import { ipcRenderer } from "electron";

export const close = () => ipcRenderer.invoke("app:close");
export const minimize = () => ipcRenderer.invoke("app:minimize");

export const maximize = () => ipcRenderer.invoke("app:maximize");
export const unMaximize = () => ipcRenderer.invoke("app:unMaximize");

export const onMaximized = (callback: () => {}) => ipcRenderer.on("app:onMaximized", callback);
export const onUnMaximized = (callback: () => {}) => ipcRenderer.on("app:onUnMaximized", callback);
export const onEnterFullScreen = (callback: () => {}) => ipcRenderer.on("app:onEnterFullScreen", callback);
export const onLeaveFullScreen = (callback: () => {}) => ipcRenderer.on("app:onLeaveFullScreen", callback);

export const isMaximized = () => ipcRenderer.invoke("app:isMaximized");
export const isFullScreen = () => ipcRenderer.invoke("app:isFullScreen");
export const isSimpleFullScreen = () => ipcRenderer.invoke("app:isSimpleFullScreen");

export const openExternalLink = (url: string) => ipcRenderer.invoke("app:openExternalLink", url);