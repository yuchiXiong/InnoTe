/* eslint-disable @next/next/no-img-element */

import { Button } from "../ui/button";

// 图片预览组件
const ImageView = ({ src, title }: { src: string; title?: string }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">{title || "图片预览"}</h3>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-full max-h-full overflow-auto">
          <img
            src={src || "/placeholder.svg"}
            alt={title || "预览图片"}
            className="max-w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          />
        </div>
      </div>
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>图片地址: {src}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement("a")
                link.href = src
                link.download = title || "image"
                link.click()
              }}
            >
              下载
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(src)
              }}
            >
              复制链接
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageView;

