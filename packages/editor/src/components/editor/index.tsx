"use client"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Textarea } from "@/components/ui/textarea";
import FileTree, { IFileTreeItem } from '@/components/file-tree';
import { useCallback, useEffect, useRef, useState } from "react";
import marked from '@/utils/marked';
import { cn } from "@/lib/utils";
import { files } from "@/actions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useDebounce } from 'react-use';
import { CURRENT_OPEN_FILE_PATH } from "@/constants/storage";
import { toast } from "sonner";
import { ContentRenderer } from "../content-renderer";

export interface IEditorProps {
  currentOpenFile: { name: string; path: string };
  currentDirectory: string;
  fileList: IFileTreeItem[];
  defaultLayout: [number, number, number, number];
  setCurrentOpenFile: (file: { name: string; path: string }) => void;
  setFileList: (fileList: IFileTreeItem[]) => void;
}

const Editor = (props: IEditorProps) => {

  const {
    defaultLayout,
    currentOpenFile,
    fileList,
    setCurrentOpenFile,
    setFileList
  } = props;

  const [markedResult, setMarkedResult] = useState<string>('');
  const [toc, setTOC] = useState<string>('');
  const [debounceFnFlag, setDebounceFnFlag] = useState<number>(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useDebounce(() => {
    if (debounceFnFlag === 0) return;
    const content = textAreaRef.current?.value || '';
    files.saveFileContent(currentOpenFile.path, content);
  }, 200, [debounceFnFlag]);

  const debounceSaveFileContent = useCallback(() => {
    setDebounceFnFlag(debounceFnFlag => debounceFnFlag + 1);
  }, []);

  useEffect(() => {
    if (fileList.length !== 0) return;

    files.getFileList(props.currentDirectory).then(res => {
      setFileList(res);
    })
  }, [props.currentDirectory])

  useEffect(() => {
    textAreaRef.current?.addEventListener('paste', handleTextAreaPaste);

    return () => {
      textAreaRef.current?.removeEventListener('paste', handleTextAreaPaste);
    }
  })

  const handleTextAreaPaste = async (e: ClipboardEvent): Promise<any> => {
    e.preventDefault();
    const path = currentOpenFile.path.replace(currentOpenFile.name, '');
    const imagePath = await files.saveImageFromClipboard(path);

    if (!textAreaRef.current) return;

    const start = textAreaRef.current.selectionStart;
    const finish = textAreaRef.current.selectionEnd;

    // 替换选中内容
    textAreaRef.current.value = textAreaRef.current.value.substring(0, start) + `![${imagePath}](${imagePath})` + textAreaRef.current.value.substring(finish);
    
  }

  const updateEditor = useCallback((file: { name: string; path: string }, fileContent: string) => {
    setCurrentOpenFile(file);
    if (!file.name.endsWith('.md')) return;

    const markedAsync = async () => {
      return await marked(fileContent);
    };

    markedAsync().then(res => {
      setMarkedResult(res);
      generateToc();
    });
    if (textAreaRef.current) {
      textAreaRef.current.value = fileContent;
      textAreaRef.current.scrollTop = 0;
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
  }, [debounceSaveFileContent])

  useEffect(() => {
    if (currentOpenFile.path) {
      files.getFileContent(currentOpenFile.path).then(res => {
        updateEditor(currentOpenFile, res);
      })
    }
  }, [currentOpenFile, updateEditor]);


  useEffect(() => {
    setCurrentOpenFile(JSON.parse(localStorage.getItem(CURRENT_OPEN_FILE_PATH) || '{"name":"","path":""}'));
    window.addEventListener("keydown", handleSaveTips);

    return () => {
      window.removeEventListener("keydown", handleSaveTips);
    }
  }, []);

  const handleSaveTips = (e: KeyboardEvent) => {
    const isWindows = navigator.platform.startsWith('Win');
    const isMac = navigator.platform.startsWith('Mac');

    const isSave = (isWindows && e.key === 's' && e.ctrlKey) || (isMac && e.key === 's' && e.metaKey);

    if (isSave) {
      e.preventDefault();
      debounceSaveFileContent();
      toast("别担心！", {
        description: "InnoTe 会自动保存你的文件哦！",
      })
    }
  }

  const handleInput = async (e: React.FormEvent<HTMLTextAreaElement>) => {
    const originContent = e.currentTarget.value;
    debounceSaveFileContent();
    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
    const _markedResult = await marked(originContent);
    setMarkedResult(_markedResult);
    generateToc();
    // localStorage.setItem('TEST_CONTENT', originContent);
  }

  const generateToc = async (): Promise<void> => {
    const content = textAreaRef.current?.value || '';
    const result = await marked(content);
    const removeThreeLevel = result.split('\n').filter(i => {
      return i.startsWith('<h1') || i.startsWith('<h2') || i.startsWith('<h3')
    }).map(heading => {
      if (heading.startsWith('<h1') || heading.startsWith('<h2')) return heading;

      const defaultStyle = 'pl-2 border-l-4 border-white border-solid';
      const hoverStyle = 'hover:bg-[#5a67d820] hover:border-[#5a67d8]';
      const style = `${defaultStyle} ${hoverStyle}`;

      const headingWithHover = heading.replace('<h3 ', `<h3 class="${style}" `)
      return headingWithHover;
    }).join('\n');
    setTOC(removeThreeLevel);
  }

  const handleTocClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const previewTarget = document.querySelector(`#${target.id}`);

    previewTarget?.classList.add('bg-[#5a67d880]');
    previewTarget?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      previewTarget?.classList.remove('bg-[#5a67d880]');
    }, 500);
  }

  const onLayout = (sizes: number[]) => {
    if (!currentOpenFile.name.endsWith('.md')) return;

    const key = 'react-resizable-panels:layout';
    const value = JSON.stringify(sizes);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = textAreaRef.current.scrollHeight + 'px';
    }
    localStorage.setItem(key, value);
  };

  const reFreshFileTree = () => {
    setFileList([...fileList]);
  }

  return (
    <ResizablePanelGroup direction="horizontal" onLayout={onLayout}>
      <ResizablePanel defaultSize={defaultLayout[0]}>
        <div className={cn(
          'flex-1 h-full max-h-full',
          'overflow-auto',
        )}>
          <FileTree
            treeData={fileList}
            reFresh={reFreshFileTree}
            currentOpenFile={currentOpenFile}
            afterFileOpen={updateEditor}
          />

        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      {
        currentOpenFile.name.endsWith('.md') ? (
          <>
            <ResizablePanel defaultSize={defaultLayout[1]}>
              {/* 编辑区 */}
              <ScrollArea className="w-full h-full">
                <Textarea
                  ref={textAreaRef}
                  onInput={handleInput}
                  spellCheck={false}
                  key={currentOpenFile.path}
                  className={cn(
                    'w-full min-h-screen',
                    'px-8 py-4 box-border',
                    'text-base text-[#263e7a] font-mono leading-7',
                    'border-none shadow-none focus-visible:ring-0 focus-visible:shadow-none',
                    "resize-none",
                    "input-textarea",
                  )}
                />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[2]}>
              {/* 预览区 */}
              <ScrollArea
                className={cn(
                  "w-full h-full",
                  "preview-area-container"
                )}>
                <ContentRenderer content={markedResult} />
                <ScrollBar orientation="vertical" />
              </ScrollArea>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={defaultLayout[3]}>
              {/* 目录 */}
              <div
                className={cn(
                  'marked-toc',
                  'py-2 px-4',
                  'max-w-max max-h-max',
                )}
                dangerouslySetInnerHTML={{ __html: toc }}
                onClick={handleTocClick}
              />

            </ResizablePanel>
          </>
        ) : (
          currentOpenFile.name.endsWith('.png') || currentOpenFile.name.endsWith('.jpg') || currentOpenFile.name.endsWith('.jpeg')
            ? (
              <ResizablePanel className="px-4 py-2">
                <div className={cn(
                  'w-full h-full',
                  'flex justify-center items-center',
                  'overflow-hidden',
                  'relative'
                )}>
                  <img
                    src={'atom://innote?filepath=' + encodeURIComponent(currentOpenFile.path)}
                    className={cn(
                      'w-full',
                      'rounded',
                      'absolute',
                      'blur-xl'
                    )}
                  />
                  <img
                    src={'atom://innote?filepath=' + encodeURIComponent(currentOpenFile.path)}
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
              <ResizablePanel>
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
  )
}

export default Editor;