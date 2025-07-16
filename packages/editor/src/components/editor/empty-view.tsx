import { FileText, Plus, FileImageIcon as ImageFileIcon, Play, } from "lucide-react";
import { Button } from "../ui/button";

// 空态视图组件
const EmptyView = ({ onCreateFile }: { onCreateFile: () => void }) => {
  return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <FileText className="h-24 w-24 mx-auto mb-4 text-gray-300" />
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">开始您的创作</h3>
          <p className="text-gray-600 mb-6">选择左侧的文件开始编辑，或创建一个新的文档来开始写作。</p>
        </div>

        <div className="space-y-4">
          <Button onClick={onCreateFile} size="lg" className="w-full">
            <Plus className="h-5 w-5 mr-2" />
            创建新文档
          </Button>

          <div className="text-sm text-gray-500">
            <p className="mb-2">支持的文件类型：</p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Markdown</span>
              </div>
              <div className="flex items-center gap-1">
                <ImageFileIcon className="h-4 w-4" />
                <span>图片</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="h-4 w-4" />
                <span>视频</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmptyView;