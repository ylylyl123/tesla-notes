import dayjs from "dayjs";
import type { JSX } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// 分类定义
const categories = [
  { id: "work", name: "工作", color: "#3B82F6", bg: "#DBEAFE" },
  { id: "study", name: "学习", color: "#10B981", bg: "#D1FAE5" },
  { id: "project", name: "项目", color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "fitness", name: "健身", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "media", name: "自媒体", color: "#EC4899", bg: "#FCE7F3" },
  { id: "daily", name: "日常", color: "#6B7280", bg: "#F3F4F6" },
  { id: "idea", name: "小想法", color: "#EAB308", bg: "#FEF9C3" },
  { id: "finance", name: "投资理财", color: "#0D9488", bg: "#CCFBF1" },
];

interface Memo {
  id: number;
  uid: string;
  created_ts: number;
  updated_ts: number;
  category: string;
  target_date?: string | null;
  completion_status: string;
  content: string;
  pinned: boolean;
  archived: boolean;
}

type ViewMode = "day" | "week" | "month" | "year";

interface MemoListProps {
  memos: Memo[];
  selectedDate: dayjs.Dayjs;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: dayjs.Dayjs) => void;
  setShowDateFilter: (show: boolean) => void;
  renderMemoCard: (memo: Memo) => JSX.Element;
  compactMode?: boolean;
}

export function MemoList({
  memos,
  selectedDate,
  viewMode,
  setViewMode,
  setSelectedDate,
  setShowDateFilter,
  renderMemoCard,
  compactMode,
}: MemoListProps) {
  const getCat = (id: string) =>
    categories.find((c) => c.id === id);

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

  // 按日期分组笔记
  const groupedMemos = memos.reduce((groups, memo) => {
    // 优先使用目标日期，如果没有则使用创建时间
    const date = memo.target_date
      ? dayjs(memo.target_date).format("YYYY-MM-DD")
      : dayjs.unix(memo.created_ts).format("YYYY-MM-DD");

    if (!groups[date]) groups[date] = [];
    groups[date].push(memo);
    return groups;
  }, {} as Record<string, Memo[]>);

  // 渲染日视图
  const renderDayView = () => (
    <div className={(compactMode ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-3") + " min-h-full content-start"}>
      {Object.entries(groupedMemos)
        .sort(([a], [b]) => (a > b ? -1 : 1))
        .map(([date, dateMemos]) => (
          <div key={date} className={compactMode ? "col-span-full" : ""}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-500">
                {dayjs(date).format("M月D日 ddd")}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{dateMemos.length} 条</span>
            </div>
            <div className={compactMode ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" : "space-y-3"}>
              {dateMemos.map(renderMemoCard)}
            </div>
          </div>
        ))}
    </div>
  );

  // 渲染周视图
  const renderWeekView = () => {
    const weekStart = selectedDate.startOf("week");
    const weekEnd = selectedDate.endOf("week");
    const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

    return (
      <div className="flex flex-col h-full">
        {/* 周视图导航栏 */}
        <div className="flex items-center justify-between mb-3 px-2">
          <button
            onClick={() => setSelectedDate(selectedDate.subtract(1, "week"))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title="上一周"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <div className="text-sm md:text-lg font-semibold text-gray-800">
              {weekStart.format("YYYY年M月D日")} - {weekEnd.format("M月D日")}
            </div>
            <div className="text-sm text-gray-500">
              第 {selectedDate.week()} 周
            </div>
          </div>
          <button
            onClick={() => setSelectedDate(selectedDate.add(1, "week"))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
            title="下一周"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 flex-1 min-h-[500px]">
        {days.map((day) => {
          const dayMemos = memos.filter(
            (m) =>
              dayjs.unix(m.created_ts).format("YYYY-MM-DD") === day.format("YYYY-MM-DD")
          );
          const isToday = day.isSame(dayjs(), "day");

          return (
            <div
              key={day.format("YYYY-MM-DD")}
              className="bg-white rounded-lg border border-gray-200 p-2 overflow-hidden flex flex-col min-h-[150px]"
            >
              <div
                className={`text-center mb-2 pb-2 border-b border-gray-100 ${isToday ? "text-blue-500 font-bold" : "text-gray-600"
                  }`}
              >
                <div className="text-xs">{day.format("ddd")}</div>
                <div className="text-lg">{day.date()}</div>
              </div>
              <div className="space-y-1 overflow-auto flex-1">
                {dayMemos.map((memo) => {
                  const cat = getCat(memo.category);
                  return (
                    <div
                      key={memo.id}
                      className="text-xs p-1.5 rounded truncate cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: cat?.bg, color: cat?.color }}
                      title={memo.content}
                      onClick={() => {
                        setSelectedDate(day);
                        setViewMode("day");
                        setShowDateFilter(true);
                      }}
                    >
                      {memo.content.slice(0, 20)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  // 渲染月视图
  const renderMonthView = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-auto h-full flex flex-col min-h-[600px]">
      {/* 月视图导航栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setSelectedDate(selectedDate.subtract(1, "month"))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          title="上一月"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            {selectedDate.format("YYYY年 M月")}
          </div>
        </div>
        <button
          onClick={() => setSelectedDate(selectedDate.add(1, "month"))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          title="下一月"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
          <div key={d} className="text-center py-2 text-sm text-gray-500 font-medium">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {generateCalendarDays().map(({ date, isCurrentMonth }, i) => {
          const dayMemos = memos.filter(
            (m) =>
              dayjs.unix(m.created_ts).format("YYYY-MM-DD") === date.format("YYYY-MM-DD")
          );
          const isToday = date.isSame(dayjs(), "day");
          const isSelected = date.isSame(selectedDate, "day");

          return (
            <div
              key={i}
              className={`border-b border-r border-gray-100 p-2 cursor-pointer transition-colors ${!isCurrentMonth ? "bg-gray-50/50" : "hover:bg-blue-50"
                } ${isSelected ? "bg-blue-50" : ""}`}
              onClick={() => {
                setSelectedDate(date);
                setViewMode("day");
                setShowDateFilter(true);
              }}
            >
              <div
                className={`text-sm mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-blue-500 text-white" : isCurrentMonth ? "text-gray-700" : "text-gray-300"
                  }`}
              >
                {date.date()}
              </div>
              <div className="space-y-1">
                {dayMemos.slice(0, 3).map((memo) => {
                  const cat = getCat(memo.category);
                  return (
                    <div
                      key={memo.id}
                      className="text-xs truncate px-1 py-0.5 rounded"
                      style={{ backgroundColor: cat?.bg, color: cat?.color }}
                    >
                      {memo.content.slice(0, 12)}
                    </div>
                  );
                })}
                {dayMemos.length > 3 && (
                  <div className="text-xs text-gray-400 pl-1">+{dayMemos.length - 3}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 渲染年视图
  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) =>
      selectedDate.startOf("year").add(i, "month")
    );

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {months.map((month) => {
          const monthMemos = memos.filter(
            (m) => dayjs.unix(m.created_ts).format("YYYY-MM") === month.format("YYYY-MM")
          );
          const isCurrentMonth = month.isSame(dayjs(), "month");

          return (
            <div
              key={month.format("YYYY-MM")}
              className={`bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${isCurrentMonth ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"
                }`}
              onClick={() => {
                setSelectedDate(month);
                setViewMode("month");
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">{month.format("M月")}</span>
                <span className="text-xs text-gray-400">{monthMemos.length} 条</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {categories.slice(0, 4).map((cat) => {
                  const count = monthMemos.filter((m) => m.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <span
                      key={cat.id}
                      className="text-xs px-1 rounded"
                      style={{ backgroundColor: cat.bg, color: cat.color }}
                    >
                      {count}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="w-full min-h-full">
        {viewMode === "day" && renderDayView()}
        {viewMode === "week" && renderWeekView()}
        {viewMode === "month" && renderMonthView()}
        {viewMode === "year" && renderYearView()}

        {memos.length === 0 && viewMode === "day" && (
          <div className="text-center py-12 flex flex-col items-center justify-center h-full">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400">还没有笔记,开始记录吧!</p>
          </div>
        )}
      </div>
    </div>
  );
}
