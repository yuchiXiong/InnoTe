/* eslint-disable @next/next/no-img-element */
"use client"

import Header from "@/components/header";
import Editor from "@/components/editor";
import { useCallback, useEffect, useReducer, useState } from "react";
import { CURRENT_OPEN_DIRECTORY_KEY, CURRENT_OPEN_FILE_PATH, FILE_LIST_BEFORE_CLOSE_KEY, OPENED_DIRECTORIES_KEY } from "@/constants/storage";
import { IFileTreeItem } from "@/components/file-tree";
import { useSelector, useDispatch, InnoTeProvider } from "@/stores";
import FileTree from "@/components/file-tree";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
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

  const setCurrentOpenFile = (file: IFileTreeItem) => {
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
    isReady ? (
      <main className="flex flex-col h-screen">
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
                  currentOpenFile={currentOpenFile}
                  setCurrentOpenFile={setCurrentOpenFile}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            {currentOpenFile.name.endsWith('.md') ? (
              <ResizablePanel className="flex flex-1" defaultSize={defaultLayout[1]}>
                <Editor currentOpenFile={currentOpenFile} />
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
            )}
          </ResizablePanelGroup>
        </div>
      </main>
    ) : null
  );
} 
