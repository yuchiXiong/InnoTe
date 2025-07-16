import { ExternalLink, File } from "lucide-react";
import { Button } from "../ui/button";

// 不支持预览的文件视图组件
const UnsupportedView = ({
  src,
  title,
  fileType,
  size,
}: { src: string; title?: string; fileType?: string; size?: string }) => {

  const getFileTypeDescription = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    const typeMap: Record<string, string> = {
      pdf: "PDF 文档",
      doc: "Word 文档",
      docx: "Word 文档",
      xls: "Excel 表格",
      xlsx: "Excel 表格",
      ppt: "PowerPoint 演示文稿",
      pptx: "PowerPoint 演示文稿",
      zip: "压缩文件",
      rar: "压缩文件",
      "7z": "压缩文件",
      txt: "文本文件",
      json: "JSON 数据文件",
      xml: "XML 文件",
      csv: "CSV 数据文件",
      mindmap: "思维导图文件",
      xmind: "XMind 思维导图",
      mm: "FreeMind 思维导图",
      mmap: "MindManager 思维导图",
    }
    return typeMap[ext || ""] || "未知文件类型"
  }

  const filename = src.split("/").pop() || title || "unknown"
  const description = fileType || getFileTypeDescription(filename)

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
              <File className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          <h4 className="text-xl font-semibold text-gray-900 mb-2">无法预览此文件</h4>
          <p className="text-gray-600 mb-6">此文件类型暂不支持预览，您可以使用专业的软件从本地打开。</p>

          <div className="bg-white rounded-lg border p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">文件名称:</span>
                <span className="font-medium">{filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">文件类型:</span>
                <span className="font-medium">{description}</span>
              </div>
              {size && (
                <div className="flex justify-between">
                  <span className="text-gray-500">文件大小:</span>
                  <span className="font-medium">{size}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">文件路径:</span>
                <span className="font-medium text-xs text-gray-400 truncate max-w-48" title={src}>
                  {src}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">

            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => {
                navigator.clipboard.writeText(src)
              }}
            >
              复制路径
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 bg-transparent"
              onClick={() => {
                window.open(src, "_blank")
              }}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              在磁盘中查看
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnsupportedView;