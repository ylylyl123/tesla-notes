import { Plus, Image, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";

// 分类定义
const categories = [
  { id: "work", name: "工作", variant: "work" as const },
  { id: "study", name: "学习", variant: "study" as const },
  { id: "project", name: "项目", variant: "project" as const },
  { id: "fitness", name: "健身", variant: "fitness" as const },
  { id: "media", name: "自媒体", variant: "media" as const },
  { id: "daily", name: "日常", variant: "daily" as const },
  { id: "idea", name: "小想法", variant: "idea" as const },
  { id: "finance", name: "投资理财", variant: "finance" as const },
  { id: "planning", name: "提前规划", variant: "planning" as const },
];

interface MemoEditorProps {
  newMemoContent: string;
  setNewMemoContent: (content: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onCreateMemo: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function MemoEditor({
  newMemoContent,
  setNewMemoContent,
  selectedCategory,
  setSelectedCategory,
  onCreateMemo,
  onPaste,
  onFileSelect,
  fileInputRef,
  textareaRef,
}: MemoEditorProps) {
  const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="p-4 lg:p-5">
      <div className="w-full">
        {/* 悬浮岛编辑器 - 毛玻璃效果 */}
        <div
          className={cn(
            "rounded-2xl overflow-hidden transition-all duration-300",
            "backdrop-blur-xl",
            "border",
            selectedCategory === 'planning'
              ? "bg-purple-50/80 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
              : "bg-white/80 dark:bg-slate-900/80 border-slate-200/60 dark:border-slate-700/60",
            isFocused
              ? selectedCategory === 'planning'
                ? "border-purple-400 dark:border-purple-500 shadow-lg shadow-purple-500/10"
                : "border-indigo-300 dark:border-indigo-500 shadow-lg shadow-indigo-500/10"
              : "shadow-sm"
          )}
        >
          {/* 顶部分类选择栏 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100/50 dark:border-slate-700/50 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200",
                  selectedCategory === cat.id
                    ? "bg-indigo-500 text-white shadow-sm scale-105"
                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {selectedCategory !== cat.id && (
                    <Badge variant={cat.variant} className="w-2 h-2 p-0 rounded-full" />
                  )}
                  {cat.name}
                </span>
              </button>
            ))}
          </div>

          {/* 输入框区域 */}
          <div className="relative p-4">
            <textarea
              ref={textareaRef}
              value={newMemoContent}
              onChange={(e) => setNewMemoContent(e.target.value)}
              onPaste={onPaste}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="记录当下的想法..."
              className={cn(
                "w-full min-h-[100px] text-base leading-relaxed",
                "text-slate-800 dark:text-slate-100",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "bg-transparent border-none outline-none resize-none"
              )}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onCreateMemo();
              }}
            />

            {/* 底部工具栏 */}
            <div
              className={cn(
                "flex items-center justify-between mt-4 pt-4 border-t border-slate-100/50 dark:border-slate-700/50 transition-all duration-300",
                newMemoContent
                  ? "opacity-100 translate-y-0"
                  : "opacity-60 translate-y-1"
              )}
            >
              {/* 左侧附件按钮 */}
              <div className="flex items-center gap-1 relative">
                <button
                  onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                    "hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                  title="添加附件"
                >
                  <Plus size={20} strokeWidth={2} />
                </button>

                {attachmentMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-lg py-1.5 z-10 min-w-[140px]">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setAttachmentMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white w-full whitespace-nowrap transition-colors"
                    >
                      <Image size={16} /> <span>添加图片</span>
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        setAttachmentMenuOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white w-full whitespace-nowrap transition-colors"
                    >
                      <Paperclip size={16} /> <span>添加文件</span>
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={onFileSelect}
                />
              </div>

              {/* 右侧发送按钮 */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-300 dark:text-slate-600 hidden sm:inline-block">
                  ⌘ + Enter
                </span>
                <button
                  onClick={onCreateMemo}
                  disabled={!newMemoContent.trim()}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    newMemoContent.trim()
                      ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  )}
                >
                  <Send size={16} />
                  记下来
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
