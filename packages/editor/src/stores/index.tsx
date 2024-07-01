"use client"
import { IFileTreeItem } from "@/components/file-tree";
import { Dispatch, createContext, useContext, useReducer } from "react";

export interface IStore {
  currentDirectory: string;
  currentOpenFile: {
    name: string;
    path: string;
  };
  fileList: IFileTreeItem[];
}

export enum ActionType {
  SET_CURRENT_DIRECTORY = 'SET_CURRENT_DIRECTORY',
  SET_CURRENT_OPEN_FILE = 'SET_CURRENT_OPEN_FILE',
  SET_FILE_LIST = 'SET_FILE_LIST',
}

const reducer = (state: IStore, action: any): IStore => {
  switch (action.type) {
    case ActionType.SET_CURRENT_DIRECTORY:
      return {
        ...state,
        currentDirectory: action.currentDirectory,
      }
    case ActionType.SET_CURRENT_OPEN_FILE:
      return {
        ...state,
        currentOpenFile: action.currentOpenFile,
      }
    case ActionType.SET_FILE_LIST:
      return {
        ...state,
        fileList: action.fileList,
      }
    default:
      return { ...state };
  }
}

const initialState: IStore = {
  currentDirectory: '',
  currentOpenFile: {
    name: '',
    path: '',
  },
  fileList: [],
}

export const InnoTeContext = createContext({
  store: initialState,
  dispatch: (() => {
    console.log("[DEBUG] dispatch is empty")
  }) as Dispatch<any>,
});

const useInnoTeEditorStore = (): [IStore, Dispatch<any>] => {
  const [store, dispatch] = useReducer(reducer, initialState);

  return [store, dispatch]
}

export const InnoTeProvider = ({ children }: { children: React.ReactNode }) => {
  const [store, dispatch] = useInnoTeEditorStore();

  return (
    <InnoTeContext.Provider value={{ store, dispatch }}>
      {children}
    </InnoTeContext.Provider>
  )
}

const useInnoTeContext = () => {
  return useContext(InnoTeContext);
}

export const useSelector: <T>(selector: (state: IStore) => T) => T = (selector) => {
  const { store } = useInnoTeContext();
  return selector(store);
}

export const useDispatch: () => Dispatch<any> = () => {
  const { dispatch } = useInnoTeContext();
  return dispatch;
}