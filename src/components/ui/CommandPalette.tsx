import { cn } from "@/lib/cn";
import { Command, CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export interface CommandPaletteItem {
  id: string;
  label: string;
  keywords?: string[];
  hint?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
}

export function CommandPalette({ open, onOpenChange, items }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const target = [item.label, ...(item.keywords ?? [])].join(" ").toLowerCase();
      return target.includes(q);
    });
  }, [items, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filteredItems.length) {
      setActiveIndex(0);
    }
  }, [filteredItems.length, activeIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="关闭命令面板"
        onClick={() => onOpenChange(false)}
      />
      <div className="absolute left-1/2 top-[14vh] w-[92vw] max-w-[620px] -translate-x-1/2 rounded-2xl border border-slate-200/70 bg-white/95 shadow-2xl dark:border-slate-700/70 dark:bg-slate-900/95">
        <div className="flex items-center gap-2 border-b border-slate-200/70 px-3 py-2 dark:border-slate-700/70">
          <Search size={16} className="text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onOpenChange(false);
                return;
              }
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, 0));
                return;
              }
              if (e.key === "Enter") {
                e.preventDefault();
                const item = filteredItems[activeIndex];
                if (!item) return;
                item.onSelect();
                onOpenChange(false);
              }
            }}
            placeholder="输入命令或搜索..."
            className="h-9 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400">
            <Command size={12} />
            K
          </span>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl px-3 py-8 text-center text-sm text-slate-500">
              没有匹配命令
            </div>
          ) : (
            filteredItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  item.onSelect();
                  onOpenChange(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  idx === activeIndex
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                <span>{item.label}</span>
                {item.hint ? (
                  <span className="text-xs text-slate-400">{item.hint}</span>
                ) : (
                  <CornerDownLeft size={13} className="text-slate-300" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
