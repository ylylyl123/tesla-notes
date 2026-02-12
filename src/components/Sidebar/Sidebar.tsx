import {
  Search,
  ChevronLeft,
  ChevronRight,
  Tag,
  Home,
  BarChart2,
  Bookmark,
  Settings,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import dayjs from "dayjs";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import logo from "@/assets/logo.png";

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

type ViewMode = "day" | "week" | "month" | "year";
type Tab = "home" | "stats" | "archive" | "settings";

interface SidebarProps {
  memos: Array<{
    id: number;
    created_ts: number;
    category: string;
  }>;
  selectedDate: dayjs.Dayjs;
  setSelectedDate: (date: dayjs.Dayjs) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  showDateFilter: boolean;
  setShowDateFilter: (show: boolean) => void;
  className?: string;
  showBottomNav?: boolean;
  onInteraction?: () => void;
}

export function Sidebar({
  memos,
  selectedDate,
  setSelectedDate,
  viewMode,
  setViewMode,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  showDateFilter,
  setShowDateFilter,
  className,
  showBottomNav = true,
  onInteraction,
}: SidebarProps) {
  const handleInteraction = () => {
    if (onInteraction) onInteraction();
  };

  // 生成日历网格
  const generateCalendarDays = () => {
    const startOfMonth = selectedDate.startOf("month");
    const endOfMonth = selectedDate.endOf("month");
    const startDay = startOfMonth.day();
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push({ date: startOfMonth.subtract(startDay - i, "day"), isCurrentMonth: false });
    }
    for (let i = 1; i <= endOfMonth.date(); i++) {
      days.push({ date: startOfMonth.date(i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: endOfMonth.add(i, "day"), isCurrentMonth: false });
    }
    return days;
  };

  return (
    <div
      className={cn(
        "w-64 flex flex-col transition-colors",
        // 毛玻璃背景
        "bg-white/80 dark:bg-slate-900/80",
        "backdrop-blur-xl",
        "border-r border-slate-200/50 dark:border-slate-700/50",
        className
      )}
    >
      {/* Logo 区域 */}
      <div className="p-4 border-b border-slate-100/50 dark:border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="Zac卓越之道" className="w-8 h-8 rounded-xl shadow-md" />
          <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Zac卓越之道
          </span>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="p-3">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl",
            "bg-slate-100/80 dark:bg-slate-800/80",
            "border border-transparent",
            "focus-within:border-indigo-300 dark:focus-within:border-indigo-500",
            "focus-within:bg-white dark:focus-within:bg-slate-800",
            "transition-all duration-200"
          )}
        >
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="搜索笔记..."
            className="bg-transparent border-none outline-none text-sm flex-1 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 日历 */}
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {selectedDate.format("YYYY年M月")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedDate(selectedDate.subtract(1, "month"))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft size={14} className="text-slate-500" />
            </button>
            <button
              onClick={() => setSelectedDate(selectedDate.add(1, "month"))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs">
          {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
            <div key={d} className="text-center text-slate-400 dark:text-slate-500 py-1">
              {d}
            </div>
          ))}
          {generateCalendarDays()
            .slice(0, 35)
            .map(({ date, isCurrentMonth }, i) => {
              const isToday = date.isSame(dayjs(), "day");
              const isSelected = date.isSame(selectedDate, "day");
              const hasMemos = memos.some(
                (m) =>
                  dayjs.unix(m.created_ts).format("YYYY-MM-DD") === date.format("YYYY-MM-DD")
              );
              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedDate(date);
                    setShowDateFilter(true);
                    setViewMode("day");
                    handleInteraction();
                  }}
                  className={cn(
                    "text-center py-1 rounded-lg cursor-pointer text-xs transition-all",
                    !isCurrentMonth && "text-slate-300 dark:text-slate-600",
                    isCurrentMonth && "text-slate-600 dark:text-slate-300",
                    isToday && "bg-indigo-500 text-white shadow-sm",
                    isSelected && !isToday && "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300",
                    hasMemos && !isToday && !isSelected && "font-bold",
                    !isToday && !isSelected && "hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {date.date()}
                </div>
              );
            })}
        </div>
      </div>

      {/* 视图切换 */}
      <div className="px-3 py-2 border-t border-slate-100/50 dark:border-slate-700/50">
        <div className="flex gap-1 p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
          {(["day", "week", "month", "year"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                if (mode !== "day") setShowDateFilter(false);
                handleInteraction();
              }}
              className={cn(
                "flex-1 py-1.5 text-xs rounded-lg transition-all",
                viewMode === mode
                  ? "bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-100"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {{ day: "日", week: "周", month: "月", year: "年" }[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* 日期筛选标签 */}
      {showDateFilter && viewMode === "day" && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-sm text-indigo-700 dark:text-indigo-300">
            <CalendarIcon size={14} />
            <span>{selectedDate.format("M月D日")}</span>
            <button
              onClick={() => setShowDateFilter(false)}
              className="ml-auto hover:text-indigo-900 dark:hover:text-indigo-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 分类筛选 */}
      <div className="px-3 py-2 flex-1 overflow-auto">
        <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium">分类</div>
        <div className="space-y-1">
          <button
            onClick={() => {
              setFilterCategory(null);
              handleInteraction();
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors",
              !filterCategory
                ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Tag size={14} /> 全部
          </button>
          {categories.map((cat) => {
            const count = memos.filter((m) => m.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setFilterCategory(cat.id);
                  handleInteraction();
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors",
                  filterCategory === cat.id
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <Badge variant={cat.variant} className="w-2 h-2 p-0 rounded-full" />
                {cat.name}
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部导航 */}
      {showBottomNav && (
      <div className="p-3 border-t border-slate-100/50 dark:border-slate-700/50">
        <div className="flex justify-around">
          {[
            { id: "home" as Tab, icon: Home, label: "首页" },
            { id: "stats" as Tab, icon: BarChart2, label: "统计" },
            { id: "archive" as Tab, icon: Bookmark, label: "置顶" },
            { id: "settings" as Tab, icon: Settings, label: "设置" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                handleInteraction();
              }}
              className={cn(
                "p-2.5 rounded-xl transition-all",
                activeTab === id
                  ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
              title={label}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
