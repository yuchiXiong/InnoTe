import { load } from "cheerio";
import { cn } from "@/lib/utils";
import md5 from "md5";
import parse from 'html-react-parser';
import { useCallback } from "react";

export interface IContentRendererProps {
  content: string;
}

export const ContentRenderer = ({
  content,
}: IContentRendererProps) => {

  const $ = load(`<div class='testContainer'>${content}</div>`);
  const elements = $('.testContainer > *').toArray().map(i => load(i).html())

  const handleBlockRender = useCallback((block: string | null, index: number) => {
    if (!block) return;

    if (block.startsWith('iframe')) {
      return <div
        key={md5(`iframe_${block}`)}
        dangerouslySetInnerHTML={{ __html: block }}
      />
    }

    return parse(block);
  }, []);


  return (
    <div
      className={cn(
        'markdown-body',
        'w-full h-full box-border',
        'px-8 pt-4 pb-24'
      )}
    >
      {elements.map(handleBlockRender)}
    </div>
  )
}