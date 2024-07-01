"use client"
import { cn } from "@/lib/utils";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useEffect, useState } from "react";
import { Close, DifferenceSet, FullScreen, Minus } from "@icon-park/react";
import { files, app } from "@/actions";
import { CURRENT_OPEN_DIRECTORY_KEY } from "@/constants/storage";

export interface IHeaderProps {
  title: string,
  setCurrentDirectory: (directory: string) => void;
}

const Header = (props: IHeaderProps) => {

  const { title } = props;
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  useEffect(() => {
    app.isMaximized().then((res: boolean) => {
      setIsMaximized(res);
    });
    app.isFullScreen().then((res: boolean) => {
      setIsFullScreen(res);
    })
  }, []);

  useEffect(() => {
    app.onMaximized(() => setIsMaximized(true))
    app.onUnMaximized(() => setIsMaximized(false));
    app.onEnterFullScreen(() => {
      console.log('进入全屏');
      setIsFullScreen(true);
      app.isMaximized().then((res: boolean) => {
        console.log('isMaximized', res)
        setIsMaximized(res);
      });
      app.isSimpleFullScreen().then((res: boolean) => {
        console.log('isSimpleFullScreen', res)
      });
      app.isFullScreen().then((res: boolean) => {
        console.log('isFullScreen', res)
      })
    })
    app.onLeaveFullScreen(() => {
      console.log('离开全屏');
      setIsFullScreen(false);
      app.isMaximized().then((res: boolean) => {
        setIsMaximized(res);
      });
      app.isMaximized().then((res: boolean) => {
        console.log('isMaximized', res)
        setIsMaximized(res);
      });
      app.isSimpleFullScreen().then((res: boolean) => {
        console.log('isSimpleFullScreen', res)
      });
      app.isFullScreen().then((res: boolean) => {
        console.log('isFullScreen', res)
      })
    });
  }, []);

  const handleOpenDirectory = async () => {
    const res = await files.openDirectory();
    props.setCurrentDirectory(res);
    localStorage.setItem(CURRENT_OPEN_DIRECTORY_KEY, res);
  }

  const toggleMaximize = () => {
    if (isFullScreen) return;

    if (isMaximized) {
      app.unMaximize();
    } else {
      app.maximize();
    }
  }

  return (
    <div
      className={
        cn(
          'flex items-center justify-between',
          'w-full bg-white',
          'shadow-md',
          'select-none',
          'webkitAppRegionDrag'
        )
      }
      onDoubleClick={toggleMaximize}
    >
      <Menubar className="border-none shadow-none w-1/3">
        <MenubarMenu >
          <MenubarTrigger className="webkitAppRegionNoDrag">文件</MenubarTrigger>
          <MenubarContent>
            {/* <MenubarItem>新建窗口</MenubarItem> */}
            {/* <MenubarSeparator /> */}
            <MenubarItem onClick={handleOpenDirectory} >打开目录</MenubarItem>
            <MenubarSeparator />
            <MenubarItem onClick={app.close}>退出</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        {/* <MenubarMenu>
          <MenubarTrigger className="webkitAppRegionNoDrag">编辑</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              撤回 <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              重做 <MenubarShortcut>⇧⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>剪切</MenubarItem>
            <MenubarItem>复制</MenubarItem>
            <MenubarItem>粘贴</MenubarItem>
          </MenubarContent>
        </MenubarMenu> */}
        {/* <MenubarMenu>
          <MenubarTrigger className="webkitAppRegionNoDrag">设置</MenubarTrigger>
          <MenubarContent>
            <MenubarItem inset>首选项</MenubarItem>
            <MenubarSeparator />
            <MenubarItem inset>关于 InnoTe</MenubarItem>
          </MenubarContent>
        </MenubarMenu> */}
      </Menubar>
      <span
        className={cn(
          'w-full flex items-center justify-center text-center',
          'text-sm font-medium text-gray-700',
          'line-clamp-1',
        )}
      >
        {title}
      </span>

      <ToggleGroup type="multiple" className="w-1/3 p-1">
        <ToggleGroupItem value="bold" aria-label="Toggle bold" className="ml-auto webkitAppRegionNoDrag"
          onClick={app.minimize}
        >
          <Minus theme="outline" size="20" fill="#000000" strokeWidth={3} />
        </ToggleGroupItem>
        {!isFullScreen && (
          <ToggleGroupItem value="italic" aria-label="Toggle italic"
            className="webkitAppRegionNoDrag"
            onClick={toggleMaximize}
          >
            {
              isMaximized
                ? <DifferenceSet theme="outline" size="20" fill="#000000" strokeWidth={3} />
                : <FullScreen theme="outline" size="20" fill="#000000" strokeWidth={3} />
            }
          </ToggleGroupItem>
        )}
        <ToggleGroupItem value="underline" aria-label="Toggle underline"
          className="webkitAppRegionNoDrag"
          onClick={app.close}

        >
          <Close theme="outline" size="20" fill="#000000" strokeWidth={3} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div >
  )
}

export default Header;