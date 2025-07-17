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
import EmptyView from "@/components/editor/empty-view";
import UnsupportedView from "@/components/editor/unsupported-view";

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
    console.log('useInnoTeStore SET_CURRENT_OPEN_FILE', file)
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
                  <ResizablePanel defaultSize={defaultLayout[1]} className="flex flex-col">
                    {currentOpenFile.name !== '' ? (
                      <UnsupportedView 
                        src={currentOpenFile.path}
                        title={currentOpenFile.name}
                      />
                    ) : <EmptyView onCreateFile={console.log} />}
                  </ResizablePanel>
                )
            )}
          </ResizablePanelGroup>
        </div>
      </main>
    ) : null
  );
} 
