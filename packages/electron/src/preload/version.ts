import { readFileSync } from "node:fs";

export const nodeVersion = (): string => process.versions.node;
export const chromeVersion = (): string => process.versions.chrome;
export const electronVersion = (): string => process.versions.electron;
export const InnoTe = (): string => {
  return JSON.parse(readFileSync("./package.json", "utf-8")).version;
};
