import * as version from "./versions";
import { compareVersions } from "compare-versions";

export enum IPlatform {
  "MacOS" = "mac",
  "Windows" = "win",
}

export const versionLimit = <T>(
  platforms: IPlatform[],
  _version: string,
  onCall: () => T,
  onPlatformNotSupported = () => {
    alert("Platform is not supported");
  },
  onVersionNotSupported = () => {
    alert("Version is not supported");
  }
) => {
  const currentVersion = version.InnoTe();
  const currentPlatform = navigator.platform.startsWith("Mac")
    ? IPlatform["MacOS"]
    : IPlatform["Windows"];

  console.log(currentVersion, currentPlatform);

  if (!platforms.includes(currentPlatform)) {
    onPlatformNotSupported();
    return;
  }

  if (compareVersions(currentVersion, _version) < 0) {
    onVersionNotSupported();
    return;
  }

  return onCall();
};
