"use client"

import { Button } from "../ui/button";

// 视频预览组件
const VideoView = ({ src, title }: { src: string; title?: string }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">{title || "视频预览"}</h3>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-4xl">
          <video
            src={src}
            controls
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            您的浏览器不支持视频播放。
          </video>
        </div>
      </div>
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>视频地址: {src}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = document.createElement("a")
                link.href = src
                link.download = title || "video"
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

export default VideoView;