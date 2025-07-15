import { cn } from "@/lib/utils"
import { FileNode } from "../editor/index.v2"
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import React from "react"
import { IFileTreeItem } from "../file-tree"

export interface IFileTreeNodeProps {
  file: IFileTreeItem
  setFileList: (fileList: IFileTreeItem[]) => void

  onSelect: (node: IFileTreeItem) => void
  onDelete: (id: string) => void
  selectedId: string | null
  onToggle: (id: string) => void
}

// 文件树节点组件
const FileTreeNode: React.FC<IFileTreeNodeProps> = ({
  file,
  setFileList,

  onSelect,
  onDelete,
  selectedId,
  onToggle,
}) => {
  const isSelected = selectedId === file.id

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 group",
          isSelected && "bg-blue-50 text-blue-700",
        )}
        onClick={() => {
          if (file.isDirectory) {
            onToggle(file.id)
          } else {
            onSelect(file)
          }
        }}
      >
        {/* Icon 部分 */}
        {file.isDirectory ? (
          <>
            {file.isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {file.isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          </>
        ) : (
          <>
            <div className="w-4" />
            <FileText className="h-4 w-4" />
          </>
        )}
        <span className="flex-1 text-sm truncate">{file.name}</span>
        {/* 删除图标 */}
        {!file.isDirectory && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(file.id)
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {/* 递归展示目录内容 */}
      {file.isDirectory && file.isOpen && file.children && (
        <div className="ml-4">
          {file.children.map((file) => (
            <FileTreeNode
              key={file.id}
              file={file}
              setFileList={setFileList}

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

export default FileTreeNode;