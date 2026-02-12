import { Check, X, Edit2, Trash2, Pin } from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";

interface Memo {
  id: number;
  uid: string;
  created_ts: number;
  updated_ts: number;
  category: string;
  target_date?: string;
  completion_status: string;
  content: string;
  pinned: boolean;
  archived: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
  bg: string;
}

interface MemoCardProps {
  memo: Memo;
  getCat: (id: string) => Category | undefined;
  isEditing: boolean;
  editContent: string;
  onEdit: (id: number, content: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number) => void;
}

// 分类到 Badge 变体的映射
const categoryVariantMap: Record<string, "work" | "study" | "project" | "fitness" | "media" | "daily" | "idea"> = {
  work: "work",
  study: "study",
  project: "project",
  fitness: "fitness",
  media: "media",
  daily: "daily",
  idea: "idea",
};

export function MemoCard({
  memo,
  getCat,
  isEditing,
  editContent,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onToggleStatus,
}: MemoCardProps) {
  const cat = getCat(memo.category);
  const badgeVariant = categoryVariantMap[memo.category] || "default";

  return (
    <div
      className={cn(
        "group relative p-5 rounded-2xl transition-all duration-300",
        // 毛玻璃背景
        "bg-white/70 dark:bg-slate-900/70",
        "backdrop-blur-xl",
        // 边框和阴影
        "border border-slate-200/50 dark:border-slate-700/50",
        "shadow-sm",
        // 悬浮效果
        "hover:shadow-lg hover:shadow-indigo-500/10",
        "hover:-translate-y-1",
        "hover:border-indigo-200/50 dark:hover:border-indigo-600/50"
      )}
    >
      {/* 悬浮时的渐变光效 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* 头部：时间、分类标签、置顶标记 */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 font-mono tracking-wider">
            {dayjs.unix(memo.created_ts).format("HH:mm")}
          </span>
          {cat && (
            <Badge variant={badgeVariant}>
              {cat.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {memo.pinned && (
            <Pin size={14} className="text-indigo-500 rotate-45" />
          )}
        </div>
      </div>

      {/* 内容区 */}
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => onEdit(memo.id, e.target.value)}
          className={cn(
            "w-full p-4 rounded-xl resize-none outline-none",
            "bg-slate-50 dark:bg-slate-800/50",
            "text-slate-900 dark:text-slate-100",
            "border-2 border-indigo-200 dark:border-indigo-500/50",
            "focus:border-indigo-400 dark:focus:border-indigo-400",
            "leading-relaxed"
          )}
          rows={5}
          autoFocus
        />
      ) : (
        <div className="relative text-slate-700 dark:text-slate-200 leading-relaxed text-[15px] whitespace-pre-wrap">
          {memo.content.split("\n").map((line, i) => {
            // 检测图片格式
            if (line.startsWith("![") && line.includes("](data:image")) {
              const match = line.match(/!\[.*?\]\((data:image\/[^)]+)\)/);
              if (match) {
                return (
                  <img
                    key={i}
                    src={match[1]}
                    alt="附图"
                    loading="lazy"
                    decoding="async"
                    className="max-w-full rounded-xl my-3 shadow-md border border-slate-100 dark:border-slate-700"
                  />
                );
              }
            }
            return (
              <p key={i} className="mb-1.5 min-h-[1.5em]">
                {line}
              </p>
            );
          })}
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="relative flex items-center justify-between mt-4 pt-4 border-t border-slate-100/50 dark:border-slate-700/50 min-h-[40px]">
        {/* 左侧操作按钮 - 悬浮显示 */}
        <div
          className={cn(
            "flex items-center gap-1",
            "opacity-0 translate-y-2",
            "group-hover:opacity-100 group-hover:translate-y-0",
            "transition-all duration-200"
          )}
        >
          {isEditing ? (
            <>
              <button
                onClick={onSaveEdit}
                className="px-3 py-1.5 text-xs font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-sm transition-all active:scale-95"
              >
                保存修改
              </button>
              <button
                onClick={onCancelEdit}
                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                放弃
              </button>
            </>
          ) : (
            <>
              <IconButton
                variant="default"
                size="sm"
                onClick={() => onEdit(memo.id, memo.content)}
                title="编辑"
              >
                <Edit2 size={15} strokeWidth={2} />
              </IconButton>
              <IconButton
                variant="destructive"
                size="sm"
                onClick={() => onDelete(memo.id)}
                title="删除"
              >
                <Trash2 size={15} strokeWidth={2} />
              </IconButton>
            </>
          )}
        </div>

        {/* 右侧状态按钮 */}
        <button
          onClick={() => onToggleStatus(memo.id)}
          className={cn(
            "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300",
            "opacity-0 group-hover:opacity-100",
            memo.completion_status === "completed"
              ? "bg-emerald-500 border-emerald-500 text-white shadow-md scale-105"
              : memo.completion_status === "incomplete"
                ? "bg-red-500 border-red-500 text-white shadow-md"
                : "border-slate-200 dark:border-slate-600 text-slate-300 dark:text-slate-500 hover:border-indigo-400 hover:text-indigo-500 bg-white dark:bg-slate-800"
          )}
        >
          {memo.completion_status === "completed" && (
            <Check size={14} strokeWidth={3} />
          )}
          {memo.completion_status === "incomplete" && (
            <X size={14} strokeWidth={3} />
          )}
        </button>
      </div>
    </div>
  );
}
