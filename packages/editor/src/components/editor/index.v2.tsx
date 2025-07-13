"use client"
import { Badge } from "lucide-react"
import { Input } from "../ui/input"
import React, { SetStateAction, useEffect, useState } from "react";
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
import { cn } from "@/lib/utils"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Image from "@tiptap/extension-image"
import LinkExtension from "@tiptap/extension-link"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { Node, mergeAttributes } from "@tiptap/core"
import { FileNode } from "./index.v2";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

export interface IEditroProps {
  files: FileNode[],
  setFiles: React.Dispatch<SetStateAction<FileNode[]>>
  selectedFile: FileNode | null,
  setSelectedFile: React.Dispatch<SetStateAction<FileNode | null>>
}

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
      setIframe:
        (options) =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: options,
            })
          },
    }
  },
})

// 创建 lowlight 实例用于语法高亮
const lowlight = createLowlight(common)

// Tiptap 编辑器组件
function TiptapEditor({ content, onChange }: { content: string; onChange: (content: string) => void }) {
  // 在 TiptapEditor 函数开始处添加状态
  const [showSource, setShowSource] = useState(false)

  // 添加转换HTML为Markdown的简单函数
  const htmlToMarkdown = (html: string): string => {
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/g, "# $1")
      .replace(/<h2[^>]*>(.*?)<\/h2>/g, "## $1")
      .replace(/<h3[^>]*>(.*?)<\/h3>/g, "### $1")
      .replace(/<strong[^>]*>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em[^>]*>(.*?)<\/em>/g, "*$1*")
      .replace(/<code[^>]*>(.*?)<\/code>/g, "`$1`")
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, "[$2]($1)")
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, "![$2]($1)")
      .replace(/<ul[^>]*>/g, "")
      .replace(/<\/ul>/g, "")
      .replace(/<ol[^>]*>/g, "")
      .replace(/<\/ol>/g, "")
      .replace(/<li[^>]*>(.*?)<\/li>/g, "- $1")
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, "> $1")
      .replace(/<pre[^>]*><code[^>]*class="language-([^"]*)"[^>]*>(.*?)<\/code><\/pre>/gs, "```$1\n$2\n```")
      .replace(/<p[^>]*>(.*?)<\/p>/g, "$1\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]*>/g, "") // 移除剩余的HTML标签
      .replace(/\n\s*\n/g, "\n\n") // 清理多余的空行
      .trim()
  }

  // 切换原文显示
  const toggleSource = () => {
    setShowSource(!showSource)
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
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
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-8",
      },
    },
  })

  // 当外部内容变化时更新编辑器
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // 添加链接
  const addLink = () => {
    const url = window.prompt("请输入链接URL:")
    if (url && editor) {
      if (editor.state.selection.empty) {
        const text = window.prompt("请输入链接文本:", url)
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
  const addImage = () => {
    const url = window.prompt("请输入图片URL:")
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  // 添加视频/iframe
  const addVideo = () => {
    const src = window.prompt("请输入视频嵌入代码的src地址:")
    if (src && editor) {
      const height = window.prompt("请输入视频高度 (默认400px):", "400")
      editor
        .chain()
        .focus()
        .setIframe({
          src,
          height: height || "400",
          width: "100%",
          allowfullscreen: true,
          frameborder: "0",
        })
        .run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col flex-1">
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
                      navigator.clipboard.writeText(htmlToMarkdown(content))
                      // 这里可以添加复制成功的提示
                    }}
                  >
                    复制 Markdown
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono leading-relaxed h-full">
                  {htmlToMarkdown(content)}
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

const Editor: React.FC<IEditroProps> = ({
  files,
  setFiles,
  selectedFile,
  setSelectedFile
}) => {

  // 更新文件内容
  const updateFileContent = (content: string) => {
    if (!selectedFile) return

    const updateFile = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.id === selectedFile.id) {
          return { ...node, content }
        }
        if (node.children) {
          return { ...node, children: updateFile(node.children) }
        }
        return node
      })
    }

    setFiles(updateFile(files))
    setSelectedFile({ ...selectedFile, content })
  }

  // 更新文件标题
  const updateFileTitle = (title: string) => {
    if (!selectedFile) return

    const updateFile = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.id === selectedFile.id) {
          return { ...node, title }
        }
        if (node.children) {
          return { ...node, children: updateFile(node.children) }
        }
        return node
      })
    }

    setFiles(updateFile(files))
    setSelectedFile({ ...selectedFile, title })
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {selectedFile ? (
        <>
          {/* 顶部标题栏 */}
          <div className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-between">
              <Input
                value={selectedFile.title || ""}
                onChange={(e) => updateFileTitle(e.target.value)}
                className="text-2xl m-4 font-semibold border-none shadow-none px-0 focus-visible:ring-0 bg-transparent"
                placeholder="文档标题"
              />
            </div>
          </div>

          {/* 编辑器区域 */}
          <div className="flex-1 flex bg-white overflow-hidden">
            <TiptapEditor content={selectedFile.content || ""} onChange={updateFileContent} />
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