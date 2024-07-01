"use client"

import Header from "@/components/header";
import Editor from "@/components/editor";
import { useCallback, useEffect, useReducer, useState } from "react";
import { CURRENT_OPEN_DIRECTORY_KEY, CURRENT_OPEN_FILE_PATH, FILE_LIST_BEFORE_CLOSE_KEY, OPENED_DIRECTORIES_KEY } from "@/constants/storage";
import { IFileTreeItem } from "@/components/file-tree";
import { useSelector, useDispatch, InnoTeProvider } from "@/stores";

export default function Home() {

  const dispatch = useDispatch();
  const currentDirectory = useSelector((state) => state.currentDirectory);
  const currentOpenFile = useSelector((state) => state.currentOpenFile);
  const fileList = useSelector((state) => state.fileList);

  // console.log('currentDirectory', currentDirectory, 'currentOpenFile', currentOpenFile, 'fileList', fileList)

  const [defaultLayout, setDefaultLayout] = useState<[number, number, number, number]>([10, 37, 37, 16]);
  const [isReady, setIsReady] = useState(false);

  const setCurrentDirectory = (directory: string) => {
    dispatch({ type: 'SET_CURRENT_DIRECTORY', currentDirectory: directory });
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

  return (
    isReady ? <main className="flex flex-col h-screen justify-center">
      <Header
        title={pageTitle}
        setCurrentDirectory={setCurrentDirectory}
      />
      <Editor
        defaultLayout={defaultLayout}
        fileList={fileList}
        currentOpenFile={currentOpenFile}
        currentDirectory={currentDirectory}
        setFileList={setFileList}
        setCurrentOpenFile={setCurrentOpenFile}
      />
    </main> : null
  );
} 
