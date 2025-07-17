import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen, Plus, Trash2 } from "lucide-react"
import { Button } from "../ui/button"
import React from "react"
import { IFileTreeItem } from "."
import { Input } from "../ui/input"

export interface IFileTreeNodeProps {
  selectedId: string | null
  file: IFileTreeItem
  onSelect: (file: IFileTreeItem) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void

  showNewFileInput: () => void;
  handleFileCreate: (fileId: string) => void
  handleFileCreateCancel: (fileId: string) => void
  newFileName: string
  onNewFileNameChange: (name: string) => void
}

// 文件树节点组件
const FileTreeNode: React.FC<IFileTreeNodeProps> = ({
  selectedId,
  file,
  onSelect,
  onDelete,
  onToggle,

  showNewFileInput,
  handleFileCreate,
  handleFileCreateCancel,
  newFileName,
  onNewFileNameChange,
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
        {/* 新文件输入框 */}
        {file.showNewFileInput && (
          <div className="ml-6 mt-1 mb-2">
            <div className="flex gap-2 items-center">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <Input
                value={newFileName}
                onChange={(e) => onNewFileNameChange(e.target.value)}
                placeholder="输入文件名..."
                className="text-sm h-7"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFileCreate(file.id)
                  } else if (e.key === "Escape") {
                    handleFileCreateCancel(file.id)
                  }
                }}
                onBlur={() => {
                  // 延迟取消，避免点击按钮时立即取消
                  setTimeout(() => {
                    handleFileCreateCancel(file.id)
                  }, 150)
                }}
              />
              <Button size="sm" className="h-7 px-2" onClick={() => handleFileCreate(file.id)} disabled={!newFileName.trim()}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleFileCreateCancel(file.id)}>
                ×
              </Button>
            </div>
          </div>
        )}
        {/* Icon 部分 */}
        {!file.showNewFileInput && file.isDirectory ? (
          <>
            {file.isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {file.isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          </>
        ) : (
          !file.showNewFileInput && (
            <>
              <div className="w-4" />
              <FileText className="h-4 w-4" />
            </>
          )
        )}

        {!file.showNewFileInput && <span className="flex-1 text-sm truncate">{file.name}</span>}
        {/* 文件夹的创建按钮 */}
        {!file.showNewFileInput && file.isDirectory && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              showNewFileInput()
            }}
            title="在此文件夹中创建新文件"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}

        {/* 删除图标 */}
        {!file.showNewFileInput && !file.isDirectory && (
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
              selectedId={selectedId}
              file={file}
              onSelect={onSelect}
              onDelete={onDelete}
              onToggle={onToggle}
              showNewFileInput={showNewFileInput}
              handleFileCreate={handleFileCreate}
              handleFileCreateCancel={handleFileCreateCancel}
              newFileName={newFileName}
              onNewFileNameChange={onNewFileNameChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FileTreeNode;