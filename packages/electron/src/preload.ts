import { contextBridge, ipcRenderer } from "electron";
import * as versions from './preload/version';
import * as app from './preload/app';
import * as files from './preload/files';

contextBridge.exposeInMainWorld("electronAPI", {
  versions,
  app,
  files,
});
