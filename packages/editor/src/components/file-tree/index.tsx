import { files } from "@/actions";
import {
  Tree,
  TreeViewElement,
  File,
  Folder,
  CollapseButton,
} from "@/components/ui/tree-view-api";
import { CURRENT_OPEN_FILE_PATH, OPENED_DIRECTORIES_KEY } from "@/constants/storage";
import { MouseEvent, useEffect, useMemo, useState } from "react";

export interface IFileTreeProps {
  treeData: (TreeViewElement & {
    isDirectory: boolean;
    path: string;
    children?: IFileTreeProps["treeData"];
  })[];
  afterFileOpen: (file: { name: string; path: string }, content: string) => void;
  reFresh: () => void;
  expandedItemMap: Record<string, boolean>;
  setExpandedItemMap: (expandedItemMap: Record<string, boolean>) => void;
}

export type IFileTreeItem = IFileTreeProps["treeData"][number];

const TreeItem = (props: IFileTreeProps) => {
  const { treeData: _treeData, reFresh, afterFileOpen, expandedItemMap, setExpandedItemMap } = props;

  const treeData = [..._treeData].sort((a, b) => {
    return Number(b.isDirectory) - Number(a.isDirectory);
  });


  const handleDirectoryClick = async (element: IFileTreeItem) => {
    if (!element.isDirectory) return;

    if (expandedItemMap[element.id]) {
      // collapse
      const newExpandedItemMap = {
        ...expandedItemMap,
      }
      delete newExpandedItemMap[element.id];
      setExpandedItemMap(newExpandedItemMap);
      localStorage.setItem(OPENED_DIRECTORIES_KEY, JSON.stringify(newExpandedItemMap));

      return;
    }

    // expand
    const newExpandedItemMap = {
      ...expandedItemMap,
      [element.id]: true,
    }
    setExpandedItemMap(newExpandedItemMap);
    localStorage.setItem(OPENED_DIRECTORIES_KEY, JSON.stringify(newExpandedItemMap));

    element.children = (await files.getFileList(element.path)) || [];

    props.reFresh();
  }

  const handleItemClick = async (event: MouseEvent<HTMLLIElement>, element: IFileTreeItem) => {
    event.stopPropagation();
    event.preventDefault();
    if (element.isDirectory) {
      handleDirectoryClick(element);
    } else {
      handleFileClick(element);
    }
  }

  const handleFileClick = async (element: IFileTreeItem) => {
    localStorage.setItem(CURRENT_OPEN_FILE_PATH, JSON.stringify({
      name: element.name,
      path: element.path,
    }));

    if (element.name.endsWith('.md')) {
      const content = await files.getFileContent(element.path) || '';
      props.afterFileOpen({
        name: element.name,
        path: element.path,
      }, content);
    } else {
      props.afterFileOpen({
        name: element.name,
        path: element.path,
      }, '');
    }

  }

  return (
    <ul className="w-full space-y-1">
      {treeData.map((element) => (
        <li
          key={element.id}
          className="w-full space-y-2"
          onClick={(e) => handleItemClick(e, element)}
        >
          {element.isDirectory ? (
            <Folder
              element={element.name}
              id={element.id}
              isSelectable={element.isSelectable}
              className="px-px pr-1"
            >
              <TreeItem
                key={element.id}
                aria-label={`folder ${element.name}`}
                treeData={element.children || []}
                reFresh={reFresh}
                afterFileOpen={afterFileOpen}
                expandedItemMap={expandedItemMap}
                setExpandedItemMap={setExpandedItemMap}
              />
            </Folder>
          ) : (
            <File
              key={element.id}
              id={element.id}
              element={element.name}
              isSelectable={element.isSelectable}
            >
              <span>{element?.name}</span>
            </File>
          )}
        </li>
      ))}
    </ul>
  );
};

const FileTree = (props: Omit<IFileTreeProps, 'setExpandedItemMap' | 'expandedItemMap'> & {
  currentOpenFile: {
    path: string;
    name: string;
  }
}) => {
  const { treeData, reFresh, afterFileOpen, currentOpenFile } = props;

  const [expandedItemMap, setExpandedItemMap] = useState<Record<string, boolean>>({});
  const [isReady, setIsReady] = useState(false);

  const sortedTreeData = [...treeData].sort((a, b) => {
    return Number(b.isDirectory) - Number(a.isDirectory);
  });


  useEffect(() => {
    const openedDirectories = localStorage.getItem(OPENED_DIRECTORIES_KEY);
    console.log('openedDirectories', openedDirectories);
    if (openedDirectories) {
      setExpandedItemMap(JSON.parse(openedDirectories));
    }
    setIsReady(true);
  }, []);

  const expendedItems: string[] = useMemo(() => {
    return Object.keys(expandedItemMap).filter((key) => expandedItemMap[key]);
  }, [expandedItemMap]);

  return (
    isReady && (
      <Tree
        className="w-full p-2"
        indicator={true}
        initialExpendedItems={expendedItems}
        initialSelectedId={currentOpenFile.path}
      >
        {sortedTreeData.map((element, _) => (
          <TreeItem
            key={element.id}
            treeData={[element]}
            afterFileOpen={afterFileOpen}
            reFresh={props.reFresh}
            expandedItemMap={expandedItemMap}
            setExpandedItemMap={setExpandedItemMap}
          />
        ))}
        <CollapseButton elements={sortedTreeData} expandAll={false} />
      </Tree>
    )
  );
};

export default FileTree;
