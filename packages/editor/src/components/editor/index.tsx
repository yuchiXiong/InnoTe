"use client"
import { Input } from "../ui/input"
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  FileText,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Link,
  Video,
} from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Image from "@tiptap/extension-image"
import LinkExtension from "@tiptap/extension-link"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { TableKit } from '@tiptap/extension-table'
import { common, createLowlight } from "lowlight"
import { Node, RawCommands, mergeAttributes, Extension, Storage, ChainedCommands } from "@tiptap/core"
import { ScrollArea } from "../ui/scroll-area";
import { getFileContent, pathJoin, renameFile, saveFileContent } from "@/actions/files";
import { Converter } from 'showdown';
import { IFileTreeItem } from "../file-tree";
import { Markdown } from 'tiptap-markdown'
import { useDebounceFn } from 'ahooks'
import { useDispatch, useSelector } from "@/stores";
import { ModalDialog, showInputDialog } from "../ui/modal-dialog"
export interface IEditorProps {
  currentOpenFile: IFileTreeItem,
}

const converter = new Converter({
  simplifiedAutoLink: true,
  excludeTrailingPunctuationFromURLs: true,
  strikethrough: true,
  tables: true,
  tasklists: true,
  simpleLineBreaks: true,
  openLinksInNewWindow: true,
  omitExtraWLInCodeBlocks: true,
  backslashEscapesHTMLTags: true,
})

// 视频嵌入白名单
const IFRAME_WHITELIST = [
  "player.bilibili.com",
  "www.youtube.com",
  "youtube.com",
  "player.youku.com",
  "www.iqiyi.com",
  "v.qq.com",
  "player.vimeo.com",
  "codepen.io",
  "codesandbox.io",
  "stackblitz.com",
]

// 检查URL是否在白名单中
function isUrlWhitelisted(url: string): boolean {
  try {
    // 处理协议相对URL（以//开头）
    let fullUrl = url
    if (url.startsWith("//")) {
      fullUrl = "https:" + url
    } else if (!url.startsWith("http")) {
      fullUrl = "https://" + url
    }

    const urlObj = new URL(fullUrl)
    console.log("检查URL:", urlObj.hostname)
    return IFRAME_WHITELIST.some((domain) => urlObj.hostname.includes(domain))
  } catch (error) {
    console.error("URL解析错误:", error)
    return false
  }
}

// 自定义 iframe 扩展
const IframeExtension = Node.create({
  name: "iframe",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: "100%",
      },
      height: {
        default: "400",
      },
      allowfullscreen: {
        default: true,
      },
      frameborder: {
        default: "0",
      },
      allow: {
        default: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      },
      referrerpolicy: {
        default: "strict-origin-when-cross-origin"
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: "iframe",
      },
      {
        tag: "div[data-iframe-placeholder]",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src

    if (!src || !isUrlWhitelisted(src)) {
      // 渲染占位符
      return [
        "div",
        {
          "data-iframe-placeholder": "true",
          "data-src": src || "",
          class: "iframe-placeholder border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 my-4",
        },
        [
          "div",
          { class: "flex items-center justify-center mb-4" },
          ["div", { class: "w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-3" }, "⚠️"],
          [
            "div",
            {},
            ["h3", { class: "text-lg font-semibold text-gray-700 mb-2" }, "站外内容暂时无法预览"],
            ["p", { class: "text-gray-500 text-sm" }, `来源: ${src || "未知"}`],
            ["p", { class: "text-gray-400 text-xs mt-2" }, "出于安全考虑，此内容需要管理员审核后才能显示"],
          ],
        ],
      ]
    }

    return [
      "div",
      { class: "iframe-container my-4" },
      [
        "iframe",
        mergeAttributes(HTMLAttributes, {
          class: "w-full rounded-lg shadow-lg",
          style: `height: ${HTMLAttributes.height || 400}px;`,
        }),
      ],
    ]
  },

  addCommands() {
    return {
      setIframe: (options: Record<string, any>) => ({ commands }: { commands: RawCommands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    } as Partial<RawCommands>
  },
})

// 创建 lowlight 实例用于语法高亮
const lowlight = createLowlight(common)

// Tiptap 编辑器组件
function TiptapEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  // 在 TiptapEditor 函数开始处添加状态
  const [showSource, setShowSource] = useState(false)

  // 检测文本是否为 Markdown 格式
  const detectMarkdown = (text: string): boolean => {
    // 检测常见的 Markdown 语法特征
    const markdownPatterns = [
      /^#{1,6}\s+.+$/m, // 标题
      /^\*\*.*\*\*$/m, // 粗体
      /^\*.*\*$/m, // 斜体
      /^\[.*\]$$.*$$$/m, // 链接
      /^!\[.*\]$$.*$$$/m, // 图片
      /^```[\s\S]*```$/m, // 代码块
      /^`.*`$/m, // 行内代码
      /^>\s+.+$/m, // 引用
      /^[-*+]\s+.+$/m, // 无序列表
      /^\d+\.\s+.+$/m, // 有序列表
      /^\|.*\|.*\|$/m, // 表格
    ]

    // 如果匹配到多个 Markdown 特征，认为是 Markdown
    const matches = markdownPatterns.filter((pattern) => pattern.test(text))
    return matches.length >= 2 || (text.includes("\n") && matches.length >= 1)
  }

  // 手动粘贴 Markdown
  const pasteMarkdown = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && editor) {
        const html = converter.makeHtml(text)
        editor.commands.insertContent(html)
      }
    } catch (error) {
      console.error("无法读取剪贴板内容:", error)
    }
  }

  // 创建快捷键扩展
  const ShortcutsExtension = Extension.create({
    name: "shortcuts",

    addKeyboardShortcuts() {
      return {
        "Mod-Shift-v": () => {
          pasteMarkdown()
          return true
        },
      }
    },
  })

  // 切换原文显示
  const toggleSource = () => {
    setShowSource(!showSource)
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      TableKit,
      StarterKit.configure({
        codeBlock: false, // 禁用默认的代码块，使用带语法高亮的版本
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
      }),
      Placeholder.configure({
        placeholder: "输入 '/' 查看命令，或开始写作...",
      }),
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto my-4",
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:text-blue-800 underline cursor-pointer",
        },
      }),
      IframeExtension,
      Markdown,
      ShortcutsExtension,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange((editor.storage as Storage & { markdown: { getMarkdown: () => string } })['markdown'].getMarkdown())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-8",
      },
      handlePaste: (view, event, slice) => {
        // 获取剪贴板数据
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        // 获取纯文本内容
        const text = clipboardData.getData("text/plain")
        if (!text) return false

        // 检测是否为 Markdown 内容
        const isMarkdown = detectMarkdown(text)

        if (isMarkdown) {
          // 阻止默认粘贴行为
          event.preventDefault()

          // 转换 Markdown 为 HTML 并插入
          const html = converter.makeHtml(text)
          const parser = new DOMParser()
          // const doc = parser.parseFromString(html, "text/html")

          // 插入转换后的内容
          editor?.commands.insertContent(html)
          return true
        }

        // 如果不是 Markdown，使用默认处理
        return false
      },
    },
  })

  // 当外部内容变化时更新编辑器
  useEffect(() => {
    if (editor && content !== (editor.storage as Storage & { markdown: { getMarkdown: () => string } })['markdown'].getMarkdown()) {
      const html = converter.makeHtml(content)
      editor.commands.setContent(html);
    }
  }, [content, editor])

  // 添加链接
  const addLink = async () => {
    const url = await showInputDialog({
      title: "添加链接",
      description: "请输入链接地址",
      placeholder: "https://example.com",
    })
    if (url && editor) {
      if (editor.state.selection.empty) {
        const text = await showInputDialog({
          title: "链接文本",
          description: "请输入链接显示的文本",
          placeholder: "链接文本",
          defaultValue: url,
        })
        if (text) {
          editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
        }
      } else {
        editor.chain().focus().setLink({ href: url }).run()
      }
    }
  }

  // 移除链接
  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run()
    }
  }

  // 添加图片
  const addImage = async () => {
    const url = await showInputDialog({
      title: "插入图片",
      description: "请输入图片地址",
      placeholder: "https://example.com/image.jpg",
    })
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  // 添加视频/iframe
  const addVideo = async () => {
    const src = await showInputDialog({
      title: "嵌入视频",
      description: "请输入视频嵌入地址",
      placeholder: "https://player.bilibili.com/player.html?...",
    })
    if (src && editor) {
      const height = await showInputDialog({
        title: "视频高度",
        description: "请输入视频高度（像素）",
        placeholder: "400",
        defaultValue: "400",
      });
      (editor
        .chain()
        .focus() as ChainedCommands & { setIframe: Function })
        .setIframe({
          src,
          height: height || "400",
          width: "100%",
          allowfullscreen: true,
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
          referrerpolicy: "strict-origin-when-cross-origin"
        })
        .run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col flex-1">
      {/* 全局对话框 */}
      <ModalDialog />
      {/* 工具栏 */}
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        <div className="flex items-center gap-1 flex-wrap">
          <Button
            variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("code") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("blockquote") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant={editor.isActive("codeBlock") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code className="h-4 w-4" />
            <span className="ml-1 text-xs">块</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={addImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={editor.isActive("link") ? "default" : "ghost"}
            size="sm"
            onClick={editor.isActive("link") ? removeLink : addLink}
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={addVideo}>
            <Video className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button variant={showSource ? "default" : "ghost"} size="sm" onClick={toggleSource}>
            <FileText className="h-4 w-4" />
            <span className="ml-1 text-xs">源码</span>
          </Button>
        </div>
      </div>

      {/* 编辑器内容区域 */}
      <div className="flex-1 flex-col overflow-y-auto flex -m-4">
        <ScrollArea className="flex-1 rounded-md p-4">
          {showSource ? (
            <div className="h-full p-4">
              <div className="bg-gray-50 border rounded-lg p-4 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">文档源码</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(content)
                      // 这里可以添加复制成功的提示
                    }}
                  >
                    复制 Markdown
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono leading-relaxed h-full">
                  {content}
                </pre>
              </div>
            </div>
          ) : (
            <EditorContent editor={editor} />
          )}
        </ScrollArea>
      </div>
    </div>
  )
}

const Editor: React.FC<IEditorProps> = ({
  currentOpenFile
}) => {

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('');

  const fileList = useSelector(state => state.fileList)
  const fileMap = useSelector(state => state._fileMap)
  const dispatch = useDispatch();

  const { run: saveContentToFile } = useDebounceFn(
    (path, content) => {
      saveFileContent(path, content);
    },
    {
      wait: 500,
    },
  );

  const { run: renameToFile } = useDebounceFn(
    (path, newPath) => {
      renameFile(path, newPath).then(res => {
        console.log(res);
        if (res.result) {
          const target = fileMap[path];
          target.id = newPath;
          target.path = newPath;
          target.name = title + '.md';
          (target?.children || [])
            .map((child) => {
              const childFullPath = pathJoin([newPath, child.name]);
              return {
                ...child,
                id: childFullPath,
                path: childFullPath,
              };
            })
            .sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory))
          dispatch({
            type: 'SET_FILE_LIST',
            fileList
          })
        } else {
          console.error('rename failed! ' + res.reason)
        }
      });
    },
    {
      wait: 500,
    },
  );

  useEffect(() => {
    console.log('[debug] fetchFile Content')
    if (currentOpenFile.path) {
      getFileContent(currentOpenFile.path).then(res => {
        setContent(res);
        setTitle(currentOpenFile.name.replace('.md', ''))
        console.log(res)
      })
    }
  }, [currentOpenFile]);

  const updateFileContent = (content: string) => {
    setContent(content);
    saveContentToFile(currentOpenFile.path, content);
  }

  const updateFileTitle = (title: string) => {
    console.log('updateFileTitle', title)
    setTitle(title)
    const newPath = currentOpenFile.path?.replace(currentOpenFile.name, title + '.md')
    console.log(newPath)
    renameToFile(currentOpenFile.path, newPath)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {currentOpenFile ? (
        <>
          {/* 顶部标题栏 */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Input
                value={title}
                onChange={(e) => updateFileTitle(e.target.value)}
                className="text-2xl m-4 font-semibold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent"
                placeholder="title"
              />
            </div>
          </div>

          {/* 编辑器区域 */}
          <div className="flex-1 flex bg-white overflow-hidden">
            <TiptapEditor content={content || ""} onChange={updateFileContent} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center text-gray-500">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">选择一个文件开始编辑</h3>
            <p className="text-sm">从左侧文件树中选择文件，或创建新文件</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Editor