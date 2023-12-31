import Image from 'next/image';
import { Fragment, useEffect, useRef, useState } from "react";
import { Inter } from 'next/font/google'
import type { IDirectory } from '@/services/directory';
import Directory from '../components/Directory';
import {
  createDirectory,
  createFile,
  deleteDirectory,
  deleteFile,
  getDirectoryContent,
  renameFile
} from '@/actions/file';
import { open } from "@tauri-apps/api/dialog"
import { open as shellOpen } from "@tauri-apps/api/shell"
import { FileAdditionOne, FolderOpen, FolderPlus, LocalPin } from '@icon-park/react';
import { LAST_FOLDER_PATH, LAST_TREE_SIDEBAR_WIDTH } from "@/constants";
import Preview from "@/components/Preview";
import { Dialog, Menu, Transition } from '@headlessui/react';
import { useClickAway } from "react-use";
import { fileComparable } from "@/utils/file";
import SplitPane from 'react-split-pane';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {

  const [dir, setDirs] = useState<IDirectory>({
    name: '',
    path: '',
    children: []
  });

  // 当前选中的文件路径
  const [currentSelectedPath, setCurrentSelectedPath] = useState<string>('');
  // 当前展开的文件夹路径
  const [currentExpandedPath, setCurrentExpandedPath] = useState<string[]>([]);
  // 确认是否删除
  const [confirmDialogVisible, setConfirmDialogVisible] = useState<boolean>(false);

  /* 当前右键菜单的位置 */
  const [currentContextMenuState, setCurrentContextMenuState] = useState<{
    x: number,
    y: number,
    visible: boolean
  }>({
    x: 0,
    y: 0,
    visible: false
  });
  const [currentEditingFilePath, setCurrentEditingFilePath] = useState<string>('');
  const menuContainRef = useRef<HTMLDivElement>(null);
  const [splitPaneSize, setSplitPaneSize] = useState<number | 'w-2/12'>('w-2/12');

  useEffect(() => {
    const lastFolderPath = localStorage.getItem(LAST_FOLDER_PATH);

    if (lastFolderPath) fetchDirectory({
      name: lastFolderPath.replaceAll('\\', '/').split('/').pop() || '',
      path: lastFolderPath,
      children: []
    }, true);

    setSplitPaneSize(
      typeof window === 'object'
        ? Number(localStorage.getItem(LAST_TREE_SIDEBAR_WIDTH) || 0) || 'w-2/12'
        : 'w-2/12'
    )
  }, []);

  /* 点击空白处，隐藏右键菜单 */
  useClickAway(menuContainRef, () => {
    setCurrentContextMenuState({ ...currentContextMenuState, visible: false });
  });

  /* 重置右键菜单位置 */
  const handleResetContextMenuPosition = () => {
    setCurrentContextMenuState({ x: 0, y: 0, visible: false });
  }

  const isDirectory = (item: IDirectory): boolean => 'children' in item;

  /** 点击文件夹或文件 */
  const handleItemClick = (item: IDirectory) => {
    if (isDirectory(item)) {
      const { path } = item;
      if (currentExpandedPath.includes(path)) {
        setCurrentExpandedPath(currentExpandedPath.filter(p => !p.startsWith(path)));
      } else {
        setCurrentExpandedPath(currentExpandedPath.concat(path));
        fetchDirectory(item);
      }
    } else {
      setCurrentSelectedPath(item.path);
    }
  }

  /** 打开文件夹 */
  const handleOpenDirectory = () => {
    open({
      directory: true,
      recursive: true
    }).then(async (path) => {
      if (!path) return;

      localStorage.setItem(LAST_FOLDER_PATH, path as string);

      const APP_NAME = 'InnoTe';
      if (typeof window !== "undefined") {
        (await import('@tauri-apps/api/window'))
          .appWindow
          .setTitle(`${path} - ${APP_NAME}`);
      }

      // 获取当前文件夹下的文件列表
      fetchDirectory({
        name: (path as string).replaceAll('\\', '/').split('/').pop() || '',
        path: path as string,
        children: []
      }, true);
    });
  }

  /** 创建文件 */
  const handleCreateFile = () => {
    const dirPath = currentExpandedPath.at(-1) || localStorage.getItem(LAST_FOLDER_PATH) as string;

    createFile(dirPath).then((newFilePath: string) => {
      const pathArr = dirPath.replace(dir.path, '').replaceAll('\\', '/').split('/');
      pathArr.shift();

      let currentDir = dir;
      while ((pathArr.length > 0)) {
        const left = pathArr.shift();
        currentDir = (currentDir.children as IDirectory[]).find(item => item.name === left) as IDirectory
      }

      fetchDirectory(currentDir);
      setCurrentSelectedPath(newFilePath);
    });
  }

  /** 创建文件夹 */
  const handleCreateDirectory = () => {
    const dirPath = currentExpandedPath.at(-1) || localStorage.getItem(LAST_FOLDER_PATH) as string;

    createDirectory(dirPath).then((newFilePath: string) => {
      const pathArr = dirPath.replace(dir.path, '').replaceAll('\\', '/').split('/');
      pathArr.shift();

      let currentDir = dir;
      while ((pathArr.length > 0)) {
        const left = pathArr.shift();
        currentDir = (currentDir.children as IDirectory[]).find(item => item.name === left) as IDirectory
      }

      fetchDirectory(currentDir);
      setCurrentSelectedPath(newFilePath);
    });
  }

  /** 重命名文件 */
  const updateFileName = (oldPath: string, newPath: string) => {
    renameFile(oldPath, newPath).then(res => {
      fetchDirectory(getFileParentDirectory(newPath));
      setCurrentEditingFilePath('');
      setCurrentSelectedPath(res);
    })
  };

  /** 拉取目录下的文件列表 */
  const fetchDirectory = (currentDir: IDirectory, isRoot = false) => {
    const { path } = currentDir;
    getDirectoryContent(path as string).then((files) => {
      currentDir.children = files.map(file => {
        const obj = {
          name: file.name,
          path: file.path,
          children: file.isDirectory ? [] : undefined
        }

        if (!file.isDirectory) {
          delete obj.children;
        }
        return obj;
      }).sort(fileComparable);

      if (isRoot) {
        setDirs({ ...currentDir });
      } else {
        setDirs({ ...dir });
      }
    });
  }

  /** 打开右键菜单，选中对应的文件 */
  const handleOpenContextMenu = ({ x, y }: { x: number, y: number }, cur: IDirectory) => {
    setCurrentContextMenuState({ x, y, visible: true });
    setCurrentSelectedPath(cur.path);
  }

  /** 开始重命名 */
  const handleRenameStart = () => {
    setCurrentEditingFilePath(currentSelectedPath);
    setCurrentContextMenuState({ ...currentContextMenuState, visible: false });
  }

  /** 删除文件 */
  const handleDeleteFile = () => {
    setCurrentContextMenuState({ ...currentContextMenuState, visible: false });
    setConfirmDialogVisible(true);
  }

  /** 确认删除 */
  const handleDeleteConfirm = () => {
    // TODO 判断是一个文件夹还是文件
    // TODO Fix bug: 如果目录本身就有.，那么就会被判断为文件
    const fileName = currentSelectedPath.replaceAll('\\', '/').split('/').pop() || '';
    const isFile = fileName.includes('.');
    const optFn = isFile ? deleteFile : deleteDirectory;

    optFn(currentSelectedPath).then(() => {
      fetchDirectory(getFileParentDirectory(currentSelectedPath));
      setCurrentSelectedPath('');
      setConfirmDialogVisible(false);
    });
  }

  /** 获取文件所在的文件夹对象 */
  const getFileParentDirectory = (path: string): IDirectory => {
    const dirPath = path.replaceAll('\\', '/').split('/').slice(0, -1).join('/');
    const rootPath = (localStorage.getItem(LAST_FOLDER_PATH) as string).replaceAll('\\', '/');
    const relativePath = dirPath.replace(rootPath, '');

    const pathArr = relativePath.split('/');
    pathArr.shift();
    let currentDir = dir;
    while (pathArr.length > 0) {
      const left = pathArr.shift();
      currentDir = (currentDir.children as IDirectory[]).find(item => item.name === left) as IDirectory
    }

    return currentDir;
  }

  const handleOpenLocalDirectory = () => {
    shellOpen(localStorage.getItem(LAST_FOLDER_PATH) as string);
  }


  return (
    <main className='flex'>

      <Transition appear show={confirmDialogVisible} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setConfirmDialogVisible(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel
                  className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-red-400"
                  >
                    确认删除吗？
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      删除后将无法恢复，请谨慎操作！
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-red-900 bg-red-100 border border-transparent rounded-md outline-none hover:bg-red-200"
                      onClick={handleDeleteConfirm}
                    >
                      确认
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 ml-2 text-sm font-medium text-gray-900 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200"
                      onClick={() => setConfirmDialogVisible(false)}
                    >
                      取消
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Menu>
        <Transition
          show={currentContextMenuState.visible}
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
          afterLeave={handleResetContextMenuPosition}
        >
          <Menu.Items
            ref={menuContainRef}
            className="absolute z-50 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
            style={{
              left: currentContextMenuState.x + 'px',
              top: currentContextMenuState.y + 'px'
            }}
          >
            <div className="px-1 py-1 ">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                    onClick={handleRenameStart}
                  >
                    重命名
                  </button>
                )}
              </Menu.Item>
            </div>
            <div className="px-1 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${active ? 'bg-violet-500 text-white' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm text-red-400`}
                    onClick={handleDeleteFile}
                  >
                    删除
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items
          >
        </Transition>
      </Menu>

      {/* @ts-ignore */}
      <SplitPane
        split="vertical"
        minSize='w-2/12'
        size={splitPaneSize}
        onChange={size => {
          setSplitPaneSize(size);
          localStorage.setItem(LAST_TREE_SIDEBAR_WIDTH, size.toString());
        }}
      >
        <nav className='max-h-screen overflow-auto'>
          <div className='flex items-center h-8 p-2 border-b'>
            <button
              title='创建文件'
              className='h-8 ml-auto text-gray-500'
              onClick={handleCreateFile}
            >
              <FileAdditionOne theme="outline" size="18" fill="#666" />
            </button>
            <button
              title='新建文件夹'
              className='h-8 ml-2 text-gray-500'
              onClick={handleCreateDirectory}
            >
              <FolderPlus theme="outline" size="18" fill="#666" />
            </button>
            <button
              title='打开文件夹'
              className='h-8 ml-2 text-gray-500'
              onClick={handleOpenDirectory}
            >
              <FolderOpen className='' theme="filled" size="18" fill="#666" />
            </button>
            <button
              title='打开项目目录'
              className='h-8 ml-2 text-gray-500'
              onClick={handleOpenLocalDirectory}
            >
              <LocalPin theme="outline" size="18" fill="#666" />
            </button>
          </div>
          {(dir.children?.length || 0) > 0 ? (
            <Directory
              dir={dir}
              currentSelectedPath={currentSelectedPath}
              currentExpandedPath={currentExpandedPath}
              currentEditingFilePath={currentEditingFilePath}
              handleItemClick={handleItemClick}
              openContextMenu={handleOpenContextMenu}
              updateFileName={updateFileName}
              afterRename={() => setCurrentEditingFilePath('')}
            />
          ) : (
            <div>
              {/* empty placeholder */}
            </div>
          )}
        </nav>

        <section
          className={`w-full flex h-screen flex-col items-center justify-between ${inter.className}`}
        >
          {currentSelectedPath ? (
            <Preview
              filePath={currentSelectedPath}
            />
          ) : (
            <>
              <div
                className="flex flex-col h-screen justify-center place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-[240px] after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700/10 after:dark:from-sky-900 after:dark:via-[#0141ff]/40 before:lg:h-[360px]">
                <Image
                  className="relative dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
                  src="/innote-logo.png"
                  alt="InnoTe Logo"
                  width={180}
                  height={37}
                  priority
                />
                <p className='mt-1 font-sans text-gray-400'>下面再放一句话显得逼格比较高</p>
              </div>
            </>
          )}
        </section>
      </SplitPane>

    </main>
  )
}
