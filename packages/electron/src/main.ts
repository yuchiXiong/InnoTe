import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  screen,
  protocol,
  net,
  shell,
  clipboard,
} from "electron";
import * as path from "node:path";
import * as fs from "node:fs";

if (require("electron-squirrel-startup")) app.quit();

async function handleOpenDirectory() {
  console.log("[DEBUG] handleOpenDirectory");
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (!canceled) {
    return filePaths[0];
  }
}

const getFileList = async (
  dirPath: string
): Promise<
  {
    fileName: string;
    isDirectory: boolean;
    children: {
      fileName: string;
      isDirectory: boolean;
      children: [];
    }[];
  }[]
> => {
  console.log("[DEBUG] getFileList", dirPath);

  const exist = fs.existsSync(dirPath);
  if (!exist) {
    return [];
  }
  const files = fs.readdirSync(dirPath, {
    withFileTypes: true,
  });
  return files.map((file) => ({
    fileName: file.name,
    isDirectory: file.isDirectory(),
    children: file.isDirectory()
      ? fs
          .readdirSync(path.join(dirPath, file.name), {
            withFileTypes: true,
          })
          .map((file) => ({
            fileName: file.name,
            isDirectory: file.isDirectory(),
            children: [],
          }))
      : [],
  }));
};

const getFileContent = async (path: string): Promise<string> => {
  console.log("[DEBUG] getFileContent", path);
  const exist = fs.existsSync(path);
  if (!exist) {
    return "";
  }
  const content = fs.readFileSync(path, "utf-8");
  return content;
};

const saveFileContent = async (
  path: string,
  content: string
): Promise<void> => {
  console.log("[DEBUG] getFileList", path);
  fs.writeFileSync(path, content, "utf-8");
};

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  console.log(width, height);
  const mainWindow = new BrowserWindow({
    width: width * 0.8,
    height: height * 0.8,
    center: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("app:onUnMaximized");
  });
  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("app:onMaximized");
  });
  mainWindow.on("enter-full-screen", () => {
    console.log("enter-full-screen");
    mainWindow.webContents.send("app:onEnterFullScreen");
  });
  mainWindow.on("leave-full-screen", () => {
    console.log("leave-full-screen");
    mainWindow.webContents.send("app:onLeaveFullScreen");
  });

  // 不允许打开新窗口，当前只有 target="_blank" 才会打开新窗口，将这一类行为拦截，使用默认浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log("[DEBUG] setWindowOpenHandler", url);
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL("http://localhost:3000");
  // mainWindow.loadURL("https://innote-editor.bubuyu.top");
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: "atom",
    privileges: {
      secure: true,
      standard: true,
      supportFetchAPI: true,
    },
  },
]);

app.whenReady().then(() => {
  ipcMain.handle("dialog:openDirectory", handleOpenDirectory);
  ipcMain.handle("getFileList", (e, path: string) => getFileList(path));
  ipcMain.handle("getFileContent", (e, path: string) => getFileContent(path));
  ipcMain.handle("saveFileContent", (e, path: string, content: string) =>
    saveFileContent(path, content)
  );
  ipcMain.handle("saveImageFromClipboard", async (e, imagePath: string) => {
    console.log("[DEBUG] saveImageFromClipboard", imagePath);

    const fullDirectory = path.join(imagePath, "image");

    const fullImagePath = path.join(
      fullDirectory,
      `${new Date().getTime()}.png`
    );

    if (!fs.existsSync(fullDirectory)) {
      fs.mkdirSync(fullDirectory, { recursive: true });
    }

    const nativeImage = clipboard.readImage();
    if (!nativeImage) {
      return "";
    }

    const imageBuffer = nativeImage.toPNG();
    fs.writeFileSync(fullImagePath, imageBuffer);

    // 返回图片的相对路径
    return path.relative(imagePath, fullImagePath);
  });
  // ipcMain.handle("getPathForFile", (e, path: string) => {
  //   webUtils.getPathForFile(path);
  // });

  ipcMain.handle("app:minimize", () => {
    console.log("[DEBUG]", "app:minimize");
    BrowserWindow.getFocusedWindow()?.minimize();
  });
  ipcMain.handle("app:maximize", () => {
    console.log("[DEBUG]", "app:maximize");
    BrowserWindow.getFocusedWindow()?.maximize();
  });
  ipcMain.handle("app:unMaximize", () => {
    console.log("[DEBUG]", "app:unMaximize");
    BrowserWindow.getFocusedWindow()?.unmaximize();
  });
  ipcMain.handle("app:isMaximized", () => {
    console.log("[DEBUG]", "app:isMaximized");
    return BrowserWindow.getFocusedWindow()?.isMaximized();
  });
  ipcMain.handle("app:isFullScreen", () => {
    console.log("[DEBUG]", "app:isFullScreen");
    return BrowserWindow.getFocusedWindow()?.isFullScreen();
  });
  ipcMain.handle("app:isSimpleFullScreen", () => {
    console.log("[DEBUG]", "app:isSimpleFullScreen");
    return BrowserWindow.getFocusedWindow()?.isSimpleFullScreen();
  });
  ipcMain.handle("app:close", () => {
    console.log("[DEBUG]", "app:close");
    BrowserWindow.getFocusedWindow()?.close();
  });
  ipcMain.handle("app:openExternalLink", (event, url: string) => {
    console.log("[DEBUG]", "app:openExternalLink");
    shell.openExternal(url);
  });
  protocol.handle("atom", (request) => {
    console.log("[DEBUG]", "atom", request.url);

    const url = request.url.replace("atom://", "");
    const filePath = decodeURIComponent(url.replace("innote/?filepath=", ""));
    if (filePath.includes("&")) {
      const [relativePath, currentPath] = filePath
        .split("&")
        .map((i) => i.replace("path=", ""));

      const fullPath = path.join(currentPath, relativePath);
      console.log("[DEBUG]", "atom", fullPath);
      return net.fetch("file://" + fullPath);
    } else {
      console.log("[DEBUG]", "atom", filePath);
      return net.fetch("file://" + filePath);
    }
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  console.log("window-all-closed");
  if (process.platform !== "darwin") app.quit();
});
