export interface IElectronAPI {
  versions: {
    node: () => string;
    chrome: () => string;
    electron: () => string;
    InnoTe:() => string;
  };
  app: {
    close: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    unMaximize: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    isFullScreen: () => Promise<boolean>;
    isSimpleFullScreen: () => Promise<boolean>;
    onMaximized: (callback: () => void) => void;
    onUnMaximized: (callback: () => void) => void;
    onEnterFullScreen: (callback: () => void) => void;
    onLeaveFullScreen: (callback: () => void) => void;
    openExternalLink: (link: string) => Promise<void>;
  };
  files: {
    openDirectory: () => Promise<string>;
    getFileList: (path: string) => Promise<
      {
        fileName: string;
        isDirectory: boolean;
        children: { fileName: string; isDirectory: boolean; children: [] }[];
      }[]
    >;
    getFileContent: (path: string) => Promise<string>;
    saveFileContent: (path: string, content: string) => Promise<void>;
    saveImageFromClipboard: (path: string) => Promise<string>;
    pathJoin: (paths: string[]) => string;
  };
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
