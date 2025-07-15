"use client"

import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import React, { useState } from "react"
import { IFileTreeItem } from "../file-tree"
import FileTreeNode from './node'
import { getFileList } from "@/actions/files"

interface IFileTreeProps {
  fileList: IFileTreeItem[];
  setFileList: (fileList: IFileTreeItem[]) => void;
  currentOpenFile: IFileTreeItem;
  setCurrentOpenFile: (file: IFileTreeItem) => void;
}

const FileTree: React.FC<IFileTreeProps> = ({
  fileList,
  setFileList,
  currentOpenFile,
  setCurrentOpenFile,
}) => {

  const [newFileName, setNewFileName] = useState("")
  const [showNewFileInput, setShowNewFileInput] = useState(false)

  // 创建新文件
  const createNewFile = () => {
    // if (!newFileName.trim()) return

    // const newFile: FileNode = {
    //   id: Date.now().toString(),
    //   name: newFileName + ".md",
    //   type: "file",
    //   title: "新文档",
    //   content: `<h1>${newFileName}</h1><p>开始您的写作...</p><h2>子标题</h2><p>在这里添加内容。您可以：</p><ul><li>创建 <a href="https://example.com" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">链接</a></li><li>插入图片</li><li>嵌入视频</li><li>添加代码块</li></ul><p><strong>粗体文本</strong> 和 <em>斜体文本</em></p><pre><code class="language-javascript">console.log("Hello, World!");</code></pre>`,
    // }

    // const addToFolder = (nodes: FileNode[]): FileNode[] => {
    //   return nodes.map((node) => {
    //     if (node.type === "folder" && node.isOpen) {
    //       return {
    //         ...node,
    //         children: [...(node.children || []), newFile],
    //       }
    //     }
    //     if (node.children) {
    //       return { ...node, children: addToFolder(node.children) }
    //     }
    //     return node
    //   })
    // }

    // setFiles(addToFolder(files))
    // setNewFileName("")
    // setShowNewFileInput(false)
    // setSelectedFile(newFile)
  }

  // 删除文件
  const deleteFile = (fileId: string) => {
    // const removeFile = (nodes: FileNode[]): FileNode[] => {
    //   return nodes.filter((node) => {
    //     if (node.id === fileId) {
    //       return false
    //     }
    //     if (node.children) {
    //       node.children = removeFile(node.children)
    //     }
    //     return true
    //   })
    // }

    // setFiles(removeFile(files))
    // if (selectedFile?.id === fileId) {
    //   setSelectedFile(null)
    // }
  }

  // 切换文件夹展开状态
  const toggleFolder = async (folderId: string) => {
    // console.log('before toggleFolder', fileList, folderId)
    const toggleNode = async (nodes: IFileTreeItem[]): Promise<IFileTreeItem[]> => {
      return await Promise.all(nodes.map(async (node) => {
        // console.log('toggleFolder', node.id, folderId)

        if (node.id === folderId) {
          // console.log('toggleFolder 找到了', node.id, folderId)
          // 将一个文件夹展开时，需要拉取这个目录下的文件列表
          const children = await getFileList(folderId);
          return { ...node, isOpen: !node.isOpen, children }
        }

        if (node.children) {
          const children = await toggleNode(node.children);
          return { ...node, children }
        }
        return node
      }))
    }

    const newFileList = await toggleNode(fileList);

    setFileList(newFileList)
    // console.log('after toggleFolder', toggleNode(fileList), folderId)
  }

  return (
    <div className="w-full h-full border bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between my-[1.5px]">
          <h2 className="font-semibold text-gray-900">文件管理</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowNewFileInput(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* 创建文件的录入框 */}
        {showNewFileInput && (
          <div className="flex gap-2">
            <Input
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="文件名"
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  createNewFile()
                } else if (e.key === "Escape") {
                  setShowNewFileInput(false)
                  setNewFileName("")
                }
              }}
            />
            <Button size="sm" onClick={createNewFile}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-2 overflow-y-auto">
        {fileList.map((file) => (
          <FileTreeNode
            key={file.id}
            selectedId={currentOpenFile?.id || null}
            file={file}
            onSelect={setCurrentOpenFile}
            onDelete={deleteFile}
            onToggle={toggleFolder}
          />
        ))}
      </ScrollArea>
    </div>
  )
}

export default FileTree;