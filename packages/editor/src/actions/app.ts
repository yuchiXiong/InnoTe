// import { IPlatform, versionLimit } from "./_utils";

export const close = () => window.electronAPI.app.close();
export const minimize = () => window.electronAPI.app.minimize();
export const maximize = () => window.electronAPI.app.maximize();
export const unMaximize = () => window.electronAPI.app.unMaximize();
export const isMaximized = () => window.electronAPI.app.isMaximized();
export const onMaximized = (callback: () => void) =>
  window.electronAPI.app.onMaximized(callback);
export const onUnMaximized = (callback: () => void) =>
  window.electronAPI.app.onUnMaximized(callback);
export const onEnterFullScreen = (callback: () => void) =>
  window.electronAPI.app.onEnterFullScreen(callback);
export const onLeaveFullScreen = (callback: () => void) =>
  window.electronAPI.app.onLeaveFullScreen(callback);
export const isFullScreen = () => window.electronAPI.app.isFullScreen();
export const isSimpleFullScreen = () =>
  window.electronAPI.app.isSimpleFullScreen();
export const openExternalLink = (url: string) => {
  window.electronAPI.app.openExternalLink(url);
}

// export const testVersion = (): string | undefined => {
//   return versionLimit<string>([IPlatform.MacOS, IPlatform.Windows], "1.0.0", () => {
//     alert("test version");
//     return '1.0.0';
//   });
// };
