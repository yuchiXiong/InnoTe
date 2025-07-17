"use client"

import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { ScrollArea } from "@radix-ui/react-scroll-area"
import React, { useState } from "react"
import FileTreeNode from './node'
import { createFile, getFileList, pathJoin } from "@/actions/files"
import { v4 as uuidv4 } from 'uuid';
import { useSelector } from "@/stores"

export type IFileTreeItem = {
  id: string;
  name: string;
  isSelectable?: boolean;
  isDirectory: boolean;
  isOpen: boolean;
  path: string;
  children?: IFileTreeItem[];
  showNewFileInput?: boolean // 控制是否显示新文件输入框
};

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

  const _fileMap = useSelector(state => state._fileMap)
  const [newFileName, setNewFileName] = useState("")

  // 创建新文件
  const handleFileCreate = (fileId: string) => {
    console.log('handleFileCreate', newFileName, fileId)
    if (!newFileName.trim()) return

    const fileName = newFileName + '.md'
    const fullPath = currentOpenFile.path.replace(currentOpenFile.name, fileName)

    createFile(fullPath).then(res => {
      console.log(res)
      if (res.result) {
        console.log('[DEBUG]', fileId, _fileMap, _fileMap[fileId])
        // 更新文件树
        const target = _fileMap[fileId];
        target.id = fullPath;
        target.path = fullPath;
        target.showNewFileInput = false;
        target.name = fileName;
        setFileList(fileList)
        setNewFileName("")
        setCurrentOpenFile(target)
      } else {
        handleFileCreateCancel(fileId);
      }
    })
  }

  // 显示新文件输入框
  const showNewFileInput = () => {
    const id = uuidv4();

    const newFile: IFileTreeItem = {
      id: id,
      name: newFileName,
      isSelectable: true,
      isDirectory: false,
      isOpen: false,
      path: id,
      showNewFileInput: true
    }

    const addToFolder = (nodes: IFileTreeItem[]): IFileTreeItem[] => {
      return nodes.map((node) => {
        if (node.isDirectory && node.isOpen) {
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

    setFileList(addToFolder(fileList))
    setNewFileName('')
    // setCurrentOpenFile(newFile)
  }

  // 取消新文件输入
  const handleFileCreateCancel = (fileId: string) => {
    const updateFolder = (nodes: IFileTreeItem[]): IFileTreeItem[] => {
      return nodes.filter(i => i.id !== fileId).map((node) => {
        if (node.children) {
          return { ...node, children: updateFolder(node.children) }
        }
        return node
      })
    }

    setFileList(updateFolder(fileList))
    setNewFileName("")
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
          <Button variant="ghost" size="sm" onClick={() => showNewFileInput()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
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
            showNewFileInput={showNewFileInput}
            handleFileCreate={handleFileCreate}
            handleFileCreateCancel={handleFileCreateCancel}
            newFileName={newFileName}
            onNewFileNameChange={setNewFileName}
          />
        ))}
      </ScrollArea>
    </div>
  )
}

export default FileTree;