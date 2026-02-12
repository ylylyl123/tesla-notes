import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";

interface MiniCalendarProps {
  memos: Array<{
    id: number;
    created_ts: number;
    category: string;
  }>;
  selectedDate: dayjs.Dayjs;
  setSelectedDate: (date: dayjs.Dayjs) => void;
  setShowDateFilter: (show: boolean) => void;
}

export function MiniCalendar({
  memos,
  selectedDate,
  setSelectedDate,
  setShowDateFilter,
}: MiniCalendarProps) {
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
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {selectedDate.format("YYYY年M月")}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedDate(selectedDate.subtract(1, "month"))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setSelectedDate(selectedDate.add(1, "month"))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
          <div key={d} className="text-center text-gray-400 py-1">
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
                }}
                className={`
                  text-center py-1 rounded-full cursor-pointer text-xs transition-colors
                  ${!isCurrentMonth ? "text-gray-300" : "text-gray-600"}
                  ${isToday ? "bg-blue-500 text-white" : ""}
                  ${isSelected && !isToday ? "bg-blue-100 text-blue-600" : ""}
                  ${hasMemos && !isToday && !isSelected ? "font-bold" : ""}
                  hover:bg-gray-100
                `}
              >
                {date.date()}
              </div>
            );
          })}
      </div>
    </div>
  );
}
