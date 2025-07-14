/* eslint-disable @next/next/no-img-element */
"use client"

import Header from "@/components/header";
import Editor from "@/components/editor/index.v2";
import { useCallback, useEffect, useReducer, useState } from "react";
import { CURRENT_OPEN_DIRECTORY_KEY, CURRENT_OPEN_FILE_PATH, FILE_LIST_BEFORE_CLOSE_KEY, OPENED_DIRECTORIES_KEY } from "@/constants/storage";
import { IFileTreeItem } from "@/components/file-tree";
import { useSelector, useDispatch, InnoTeProvider } from "@/stores";
import FileTree from "@/components/file-tree-v2";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Textarea } from "@icon-park/react";
import { ScrollBar } from "@/components/ui/scroll-area";
import { ContentRenderer } from "@/components/content-renderer";
import { cn } from "@/lib/utils";
import { getFileList } from "@/actions/files";

export interface FileNode {
  id: string
  name: string
  type: "file" | "folder"
  content?: string
  title?: string
  children?: FileNode[]
  isOpen?: boolean
}


export default function Home() {

  const dispatch = useDispatch();
  const currentDirectory = useSelector((state) => state.currentDirectory);
  const currentOpenFile = useSelector((state) => state.currentOpenFile);
  const fileList = useSelector((state) => state.fileList);

  console.log('currentDirectory', currentDirectory, 'currentOpenFile', currentOpenFile, 'fileList', fileList)

  const [defaultLayout, setDefaultLayout] = useState<[number, number]>([25, 75]);
  const [isReady, setIsReady] = useState(false);

  const setCurrentDirectory = async (directory: string) => {
    dispatch({ type: 'SET_CURRENT_DIRECTORY', currentDirectory: directory });
    const fileList = await getFileList(directory)
    console.log('setCurrentOpenFile', fileList)
    setFileList([...fileList])
    saveOpenedDirectoryInfo(fileList)
  }

  const setCurrentOpenFile = (file: {
    path: string;
    name: string;
  }) => {
    dispatch({ type: 'SET_CURRENT_OPEN_FILE', currentOpenFile: file });
  }

  const setFileList = (fileList: IFileTreeItem[]) => {
    dispatch({ type: 'SET_FILE_LIST', fileList: fileList });
    saveOpenedDirectoryInfo(fileList);
  }

  const saveOpenedDirectoryInfo = useCallback((fileList: IFileTreeItem[]) => {
    localStorage.setItem(FILE_LIST_BEFORE_CLOSE_KEY, JSON.stringify(fileList));
  }, []);

  useEffect(() => {
    setCurrentDirectory(localStorage.getItem(CURRENT_OPEN_DIRECTORY_KEY) || '');
    setCurrentOpenFile(JSON.parse(localStorage.getItem(CURRENT_OPEN_FILE_PATH) || '{"name":"","path":""}'));
    setFileList(JSON.parse(localStorage.getItem(FILE_LIST_BEFORE_CLOSE_KEY) || '[]'));
    const defaultLayout = JSON.parse(localStorage.getItem('react-resizable-panels:layout') || '[10, 37, 37, 16]');
    setDefaultLayout(defaultLayout);
    setIsReady(true);
  }, []);

  const pageTitle = currentDirectory
    ? [
      currentOpenFile.name,
      currentDirectory
    ].join(' - ')
    : 'InnoTe Editor';

  const [files, setFiles] = useState<FileNode[]>([
    {
      id: "1",
      name: "我的文档",
      type: "folder",
      isOpen: true,
      children: [
        {
          id: "2",
          name: "欢迎文档.md",
          type: "file",
          title: "欢迎使用写作软件",
          content: `<h1>欢迎使用写作软件</h1><p>这是一个功能强大的<strong>写作工具</strong>，现在支持链接、代码语法高亮、图片渲染和安全的视频嵌入！</p><h2>主要特性</h2><ul><li>✨ <strong>所见即所得</strong>：真正的 WYSIWYG 编辑体验</li><li>📝 <strong>Markdown 快捷键</strong>：输入 # 自动变成标题</li><li>🎨 <strong>语法高亮</strong>：代码块支持多种语言高亮</li><li>🖼️ <strong>图片支持</strong>：支持图片插入和渲染</li><li>🔗 <strong>链接支持</strong>：支持创建和编辑链接</li><li>📺 <strong>安全视频嵌入</strong>：支持白名单内的视频平台</li><li>📁 <strong>文件管理</strong>：层级文件夹结构</li></ul><h2>链接示例</h2><p>您可以创建链接到 <a href="https://github.com" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">GitHub</a> 或其他网站。</p><p>也可以链接到 <a href="https://www.bilibili.com" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">哔哩哔哩</a> 观看视频内容。</p><h2>视频嵌入示例</h2><p>支持以下平台的视频嵌入：</p><ul><li>🎬 哔哩哔哩 (bilibili.com)</li><li>🎥 YouTube (youtube.com)</li><li>📹 优酷 (youku.com)</li><li>🎞️ 爱奇艺 (iqiyi.com)</li><li>🎪 腾讯视频 (qq.com)</li><li>🎭 Vimeo (vimeo.com)</li></ul><div data-iframe-placeholder="true" data-src="//player.bilibili.com/player.html?isOutside=true&aid=114844388821585&bvid=BV1FCuczLEUG&cid=31010654941&p=1" class="iframe-placeholder border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 my-4"><div class="flex items-center justify-center mb-4"><div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-3">⚠️</div><div><h3 class="text-lg font-semibold text-gray-700 mb-2">站外内容暂时无法预览</h3><p class="text-gray-500 text-sm">来源: //player.bilibili.com/player.html?isOutside=true&aid=114844388821585&bvid=BV1FCuczLEUG&cid=31010654941&p=1</p><p class="text-gray-400 text-xs mt-2">出于安全考虑，此内容需要管理员审核后才能显示</p></div></div></div><h2>快捷键提示</h2><ul><li>输入 <code>#</code> + 空格 = 一级标题</li><li>输入 <code>##</code> + 空格 = 二级标题</li><li>输入 <code>-</code> + 空格 = 无序列表</li><li>输入 <code>1.</code> + 空格 = 有序列表</li><li>输入 <code>&gt;</code> + 空格 = 引用块</li><li>输入 <code>\`\`\`</code> + 语言名 = 代码块</li><li><code>**文本**</code> = <strong>粗体</strong></li><li><code>*文本*</code> = <em>斜体</em></li><li><code>[文本](链接)</code> = <a href="#" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">链接</a></li></ul><blockquote><p>开始您的<strong>创作之旅</strong>吧！试试创建链接、插入图片或嵌入视频。</p></blockquote>`,
        },
        {
          id: "3",
          name: "链接和媒体示例.md",
          type: "file",
          title: "链接和媒体功能示例",
          content: `<h1>链接和媒体功能示例</h1><h2>🔗 链接功能</h2><h3>创建链接的方法</h3><ol><li><strong>工具栏按钮</strong>：选中文本后点击链接按钮</li><li><strong>Markdown 语法</strong>：直接输入 <code>[文本](URL)</code></li><li><strong>快捷键</strong>：Ctrl+K (Windows) 或 Cmd+K (Mac)</li></ol><h3>链接示例</h3><ul><li>官方网站：<a href="https://example.com" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">示例网站</a></li><li>技术文档：<a href="https://developer.mozilla.org" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">MDN Web Docs</a></li><li>开源项目：<a href="https://github.com" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">GitHub</a></li></ul><h2>📺 视频嵌入功能</h2><h3>支持的平台（白名单）</h3><ul><li>✅ 哔哩哔哩 (player.bilibili.com)</li><li>✅ YouTube (youtube.com, www.youtube.com)</li><li>✅ 优酷 (player.youku.com)</li><li>✅ 爱奇艺 (www.iqiyi.com)</li><li>✅ 腾讯视频 (v.qq.com)</li><li>✅ Vimeo (player.vimeo.com)</li><li>✅ CodePen (codepen.io)</li><li>✅ CodeSandbox (codesandbox.io)</li><li>✅ StackBlitz (stackblitz.com)</li></ul><h3>安全机制</h3><p>为了保护用户安全，我们实施了以下安全措施：</p><ul><li>🛡️ <strong>白名单机制</strong>：只允许信任的域名</li><li>⚠️ <strong>安全提示</strong>：非白名单内容显示警告</li><li>🔒 <strong>内容审核</strong>：管理员可以扩展白名单</li></ul><h3>非白名单内容示例</h3><p>以下是一个非白名单域名的示例，会显示安全提示：</p><div data-iframe-placeholder="true" data-src="https://example-unsafe-site.com/video" class="iframe-placeholder border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 my-4"><div class="flex items-center justify-center mb-4"><div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-3">⚠️</div><div><h3 class="text-lg font-semibold text-gray-700 mb-2">站外内容暂时无法预览</h3><p class="text-gray-500 text-sm">来源: https://example-unsafe-site.com/video</p><p class="text-gray-400 text-xs mt-2">出于安全考虑，此内容需要管理员审核后才能显示</p></div></div></div><h2>🖼️ 图片功能</h2><p>支持多种方式插入图片：</p><img src="https://sjc.microlink.io/xAj9LaG-1Gw5FqjJobFh8nonrT4rtAy6cjnPZ_95_gj3xesVH4zTrHGIKXwuJvEUE431VabobV7zwp8p7am2fw.jpeg" alt="视频播放器界面" class="rounded-lg max-w-full h-auto my-4"><p><em>上图：视频播放器界面示例</em></p><h2>💡 使用技巧</h2><ol><li><strong>链接编辑</strong>：点击已有链接可以编辑或删除</li><li><strong>视频尺寸</strong>：插入视频时可以自定义高度</li><li><strong>安全第一</strong>：只嵌入来自可信来源的内容</li><li><strong>响应式设计</strong>：所有媒体内容都会自适应屏幕尺寸</li></ol><p>现在您可以创建包含丰富媒体内容的文档了！</p>`,
        },
      ],
    },
  ])

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null)

  // 初始化时选择第一个文件
  useEffect(() => {
    if (files.length > 0 && files[0].children && files[0].children.length > 0) {
      setSelectedFile(files[0].children[0])
    }
  }, [])

  const onLayout = (sizes: number[]) => {
    if (!currentOpenFile.name.endsWith('.md')) return;

    const key = 'react-resizable-panels:layout';
    const value = JSON.stringify(sizes);
    // if (textAreaRef.current) {
    //   textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    // }
    localStorage.setItem(key, value);
  };

  return (
    isReady ? <main className="flex flex-col h-screen">
      <Header
        title={pageTitle}
        setCurrentDirectory={setCurrentDirectory}
      />
      <div className="flex flex-1 bg-gray-50 overflow-hidden">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={onLayout}
          className="flex flex-1"
        >
          <ResizablePanel defaultSize={defaultLayout[0]}>
            <div className={cn(
              'flex-1 h-full max-h-full',
              'overflow-auto',
            )}>
              {/* 左侧文件树 */}
              <FileTree
                fileList={fileList}
                setFileList={setFileList}

                files={files}
                setFiles={setFiles}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
              />

            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          {currentOpenFile.name.endsWith('.md') ? (
            <ResizablePanel className="flex flex-1" defaultSize={defaultLayout[1]}>
              <Editor
                files={files}
                setFiles={setFiles}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
              />
            </ResizablePanel>
          ) : (
            currentOpenFile.name.endsWith('.png') || currentOpenFile.name.endsWith('.jpg') || currentOpenFile.name.endsWith('.jpeg')
              ? (
                <ResizablePanel defaultSize={defaultLayout[1]} className="px-4 py-2">
                  <div className={cn(
                    'w-full h-full',
                    'flex justify-center items-center',
                    'overflow-hidden',
                    'relative'
                  )}>
                    <img
                      src={'atom://innote?filepath=' + encodeURIComponent(currentOpenFile.path)}
                      alt=''
                      className={cn(
                        'w-full',
                        'rounded',
                        'absolute',
                        'blur-xl'
                      )}
                    />
                    <img
                      src={'atom://innote?filepath=' + encodeURIComponent(currentOpenFile.path)}
                      alt=''
                      className={cn(
                        'max-w-full max-h-full',
                        'rounded',
                        'absolute',
                      )}
                    />
                  </div>
                </ResizablePanel>
              )
              : (
                <ResizablePanel defaultSize={defaultLayout[1]}>
                  <section className="text-gray-600 body-font">
                    <div className="container mx-auto flex px-5 py-24 items-center justify-center flex-col">
                      <img className="mb-10 object-cover object-center rounded" alt="Logo" src="https://dummyimage.com/368x307" />
                      <div className="text-center lg:w-2/3 w-full">
                        <h1 className="title-font sm:text-4xl text-3xl mb-4 font-medium text-gray-900">InnoTe Editor</h1>
                        {
                          currentOpenFile.name === ''
                            ? (<p className="my-4 leading-relaxed">点击「文件 - 打开目录」立即开始编写你的 Markdown 文件</p>)
                            : (<p className="my-4 leading-relaxed">暂不支持该文件类型哦~</p>)
                        }
                        {/* <div className="flex justify-center">
                  <button className="inline-flex text-white bg-indigo-500 border-0 py-2 px-6 focus:outline-none hover:bg-indigo-600 rounded text-lg">Button</button>
                  <button className="ml-4 inline-flex text-gray-700 bg-gray-100 border-0 py-2 px-6 focus:outline-none hover:bg-gray-200 rounded text-lg">Button</button>
                </div> */}
                      </div>
                    </div>
                  </section>
                </ResizablePanel>
              )
          )
          }
        </ResizablePanelGroup>
      </div>
      {/* <EditorV2
        defaultLayout={defaultLayout}
        fileList={fileList}
        currentOpenFile={currentOpenFile}
        currentDirectory={currentDirectory}
        setFileList={setFileList}
        setCurrentOpenFile={setCurrentOpenFile}
      /> */}
    </main> : null
  );
} 
