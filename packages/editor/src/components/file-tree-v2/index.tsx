"use client"

import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import React, { SetStateAction, useState } from "react"
import { FileNode } from "../editor/index.v2"
import { cn } from "@/lib/utils"

// 文件树节点组件
const FileTreeNode = ({
  node,
  onSelect,
  onDelete,
  selectedId,
  onToggle,
}: {
  node: FileNode
  onSelect: (node: FileNode) => void
  onDelete: (id: string) => void
  selectedId: string | null
  onToggle: (id: string) => void
}) => {
  const isSelected = selectedId === node.id

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 group",
          isSelected && "bg-blue-50 text-blue-700",
        )}
        onClick={() => {
          if (node.type === "folder") {
            onToggle(node.id)
          } else {
            onSelect(node)
          }
        }}
      >
        {node.type === "folder" ? (
          <>
            {node.isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {node.isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          </>
        ) : (
          <>
            <div className="w-4" />
            <FileText className="h-4 w-4" />
          </>
        )}
        <span className="flex-1 text-sm truncate">{node.name}</span>
        {node.type === "file" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {node.type === "folder" && node.isOpen && node.children && (
        <div className="ml-4">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              onDelete={onDelete}
              selectedId={selectedId}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface IFileTreeProps {
  files: FileNode[],
  setFiles: React.Dispatch<SetStateAction<FileNode[]>>
  selectedFile: FileNode | null,
  setSelectedFile: React.Dispatch<SetStateAction<FileNode | null>>
}

const FileTree: React.FC<IFileTreeProps> = ({
  files,
  setFiles,
  selectedFile,
  setSelectedFile
}) => {

  const [newFileName, setNewFileName] = useState("")
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  // 选择文件
  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file)
  }

  // 创建新文件
  const createNewFile = () => {
    if (!newFileName.trim()) return

    const newFile: FileNode = {
      id: Date.now().toString(),
      name: newFileName + ".md",
      type: "file",
      title: "新文档",
      content: `<h1>${newFileName}</h1><p>开始您的写作...</p><h2>子标题</h2><p>在这里添加内容。您可以：</p><ul><li>创建 <a href="https://example.com" class="text-blue-600 hover:text-blue-800 underline cursor-pointer">链接</a></li><li>插入图片</li><li>嵌入视频</li><li>添加代码块</li></ul><p><strong>粗体文本</strong> 和 <em>斜体文本</em></p><pre><code class="language-javascript">console.log("Hello, World!");</code></pre>`,
    }

    const addToFolder = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.type === "folder" && node.isOpen) {
          return {
            ...node,
            children: [...(node.children || []), newFile],
          }
        }
        if (node.children) {
          return { ...node, children: addToFolder(node.children) }
        }
        return node
      })
    }

    setFiles(addToFolder(files))
    setNewFileName("")
    setShowNewFileInput(false)
    setSelectedFile(newFile)
  }

  // 删除文件
  const deleteFile = (fileId: string) => {
    const removeFile = (nodes: FileNode[]): FileNode[] => {
      return nodes.filter((node) => {
        if (node.id === fileId) {
          return false
        }
        if (node.children) {
          node.children = removeFile(node.children)
        }
        return true
      })
    }

    setFiles(removeFile(files))
    if (selectedFile?.id === fileId) {
      setSelectedFile(null)
    }
  }

  // 切换文件夹展开状态
  const toggleFolder = (folderId: string) => {
    const toggleNode = (nodes: FileNode[]): FileNode[] => {
      return nodes.map((node) => {
        if (node.id === folderId) {
          return { ...node, isOpen: !node.isOpen }
        }
        if (node.children) {
          return { ...node, children: toggleNode(node.children) }
        }
        return node
      })
    }

    setFiles(toggleNode(files))
  }

  return (
    <div className="w-full h-full bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between my-[1.5px]">
          <h2 className="font-semibold text-gray-900">文件管理</h2>
          <Button variant="ghost" size="sm" onClick={() => setShowNewFileInput(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

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

      <ScrollArea className="flex-1 p-2">
        {files.map((file) => (
          <FileTreeNode
            key={file.id}
            node={file}
            onSelect={handleFileSelect}
            onDelete={deleteFile}
            selectedId={selectedFile?.id || null}
            onToggle={toggleFolder}
          />
        ))}
      </ScrollArea>
    </div>

  )
}

export default FileTree;