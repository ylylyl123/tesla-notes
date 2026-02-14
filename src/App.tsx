import { useState, useEffect, useRef } from "react";
import {
  Pin,
  Edit2,
  Trash2,
  Check,
  X,
  Minimize2,
  Maximize2,
  Menu,
  Home,
  BarChart2,
  Bookmark,
  Settings as SettingsIcon,
  Search,
  Cloud,
  CloudOff,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { MemoList } from "./components/MemoList/MemoList";
import { MemoEditor } from "./components/Editor/MemoEditor";
import ThemeToggle from "./components/Common/ThemeToggle";
import { cn } from "./lib/cn";
import { compressImageToDataUrl, fileToDataUrl } from "./lib/image";
import { Empty, EmptyDescription, EmptyIcon, EmptyTitle } from "./components/ui/Empty";
import { Skeleton } from "./components/ui/Skeleton";
import { Toaster } from "./components/ui/Sonner";
import { CommandPalette, type CommandPaletteItem } from "./components/ui/CommandPalette";
import { isCloudConfigured, subscribeCloudChanges } from "./services/cloudClient";
import {
  getCurrentDataMode,
  getDataClient,
  setPreferredDataMode,
  type DataMode,
} from "./services/dataClient";
import { toast } from "sonner";

dayjs.locale("zh-cn");
dayjs.extend(weekOfYear);

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

interface DailyPlan {
  id: number;
  plan_date: string;
  title: string;
  description?: string | null;
  category: string;
  completed: boolean;
  priority: number;
  created_ts: number;
  updated_ts: number;
  completed_ts?: number | null;
}

const categories = [
  { id: "work", name: "工作", color: "#3B82F6", bg: "#DBEAFE" },
  { id: "study", name: "学习", color: "#10B981", bg: "#D1FAE5" },
  { id: "project", name: "项目", color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "fitness", name: "健身", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "media", name: "自媒体", color: "#EC4899", bg: "#FCE7F3" },
  { id: "daily", name: "日常", color: "#6B7280", bg: "#F3F4F6" },
  { id: "idea", name: "小想法", color: "#EAB308", bg: "#FEF9C3" },
  { id: "finance", name: "投资理财", color: "#0D9488", bg: "#CCFBF1" },
  { id: "planning", name: "提前规划", color: "#9333ea", bg: "#f3e8ff" },
];

type ViewMode = "day" | "week" | "month" | "year";
type Tab = "home" | "stats" | "archive" | "settings";

interface PendingDeletion {
  memo: Memo;
  index: number;
  timer: number;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "未知错误";
}

function App() {
  const [memos, setMemos] = useState<Memo[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_plans, setPlans] = useState<DailyPlan[]>([]);
  const [newMemoContent, setNewMemoContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [dataMode, setDataMode] = useState<DataMode>(() => getCurrentDataMode());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasLoadedOnceRef = useRef(false);
  const pendingDeletionRef = useRef<Map<number, PendingDeletion>>(new Map());
  const isTauriRuntime =
    typeof window !== "undefined" &&
    Boolean(
      (window as Window & { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown }).__TAURI__ ||
      (window as Window & { __TAURI__?: unknown; __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__
    );
  const effectiveDataMode: "local" | "cloud" = dataMode === "auto"
    ? (isTauriRuntime ? "local" : "cloud")
    : dataMode;

  const beginSync = () => {
    if (effectiveDataMode !== "cloud") return;
    setPendingSyncCount((prev) => prev + 1);
    setLastSyncError(null);
  };

  const endSync = (error?: unknown) => {
    if (effectiveDataMode !== "cloud") return;
    setPendingSyncCount((prev) => Math.max(0, prev - 1));
    if (error) {
      setLastSyncError(getErrorMessage(error));
      return;
    }
    setLastSyncedAt(Date.now());
  };

  const withSync = async <T,>(task: () => Promise<T>): Promise<T> => {
    beginSync();
    try {
      const result = await task();
      endSync();
      return result;
    } catch (error) {
      endSync(error);
      throw error;
    }
  };

  // 自动根据日期切换分类
  useEffect(() => {
    const today = dayjs().startOf('day');
    const selected = selectedDate.startOf('day');

    if (selected.isAfter(today)) {
      setSelectedCategory("planning");
    } else if (selectedCategory === "planning") {
      setSelectedCategory("daily");
    }
  }, [selectedDate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsCommandOpen((prev) => !prev);
        return;
      }
      if (event.key === "Escape") {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      for (const pending of pendingDeletionRef.current.values()) {
        window.clearTimeout(pending.timer);
      }
      pendingDeletionRef.current.clear();
    };
  }, []);

  // 加载笔记
  const loadMemos = async () => {
    try {
      const result = await withSync(() => getDataClient().getMemos({ limit: 100, offset: 0 }));
      const pendingIds = new Set(pendingDeletionRef.current.keys());
      const visible = result.filter((memo) => !pendingIds.has(memo.id));
      setMemos(visible);
      return visible;
    } catch (error) {
      console.error("加载笔记失败:", error);
      throw error;
    }
  };

  // 加载计划
  const loadPlans = async (date: string) => {
    try {
      const result = await withSync(() => getDataClient().getPlansByDate(date));
      setPlans(result);
      return result;
    } catch (error) {
      console.error("加载计划失败:", error);
      throw error;
    }
  };

  const refreshData = async () => {
    await Promise.all([loadMemos(), loadPlans(selectedDate.format("YYYY-MM-DD"))]);
  };

  // 创建笔记（乐观更新）
  const createMemo = async () => {
    if (!newMemoContent.trim() || isProcessingImage) return;
    const tempId = -Date.now();
    const ts = Math.floor(Date.now() / 1000);
    const tempMemo: Memo = {
      id: tempId,
      uid: "",
      created_ts: ts,
      updated_ts: ts,
      category: selectedCategory,
      target_date: selectedDate.format("YYYY-MM-DD"),
      completion_status: "pending",
      content: newMemoContent,
      pinned: false,
      archived: false,
    };
    // 立即更新 UI
    setMemos((prev) => [tempMemo, ...prev]);
    setNewMemoContent("");
    try {
      const created = await withSync(() => getDataClient().createMemo({
        content: tempMemo.content,
        category: selectedCategory,
        targetDate: selectedDate.format("YYYY-MM-DD"),
      }));
      // 用真实数据替换临时数据
      setMemos((prev) => prev.map((m) => (m.id === tempId ? created : m)));
    } catch (error) {
      // 失败回滚
      setMemos((prev) => prev.filter((m) => m.id !== tempId));
      console.error("创建笔记失败:", error);
      toast.error("创建笔记失败，请稍后重试");
    }
  };

  // 删除笔记（乐观更新）
  const deleteMemo = async (id: number) => {
    const index = memos.findIndex((m) => m.id === id);
    if (index < 0) return;
    const memo = memos[index];

    // 先做乐观删除，给用户撤销窗口
    setMemos((prev) => prev.filter((m) => m.id !== id));
    const timer = window.setTimeout(async () => {
      try {
        await withSync(() => getDataClient().deleteMemo(id));
      } catch (error) {
        console.error("删除失败:", error);
        setMemos((prev) => {
          if (prev.some((m) => m.id === id)) return prev;
          const copy = [...prev];
          copy.splice(Math.min(index, copy.length), 0, memo);
          return copy;
        });
        toast.error("删除失败，已恢复笔记");
      } finally {
        pendingDeletionRef.current.delete(id);
      }
    }, 3500);

    pendingDeletionRef.current.set(id, { memo, index, timer });
    toast("笔记已删除", {
      action: {
        label: "撤销",
        onClick: () => {
          const pending = pendingDeletionRef.current.get(id);
          if (!pending) return;
          window.clearTimeout(pending.timer);
          pendingDeletionRef.current.delete(id);
          setMemos((prev) => {
            if (prev.some((m) => m.id === id)) return prev;
            const copy = [...prev];
            copy.splice(Math.min(pending.index, copy.length), 0, pending.memo);
            return copy;
          });
          toast.success("已撤销删除");
        },
      },
    });
  };

  // 更新笔记（乐观更新）
  const updateMemo = async (id: number) => {
    const backup = memos;
    // 立即更新 UI
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: editContent, updated_ts: Math.floor(Date.now() / 1000) } : m
      )
    );
    setEditingMemoId(null);
    try {
      await withSync(() => getDataClient().updateMemo({ id, content: editContent }));
    } catch (error) {
      // 失败回滚
      setMemos(backup);
      console.error("更新失败:", error);
      toast.error("更新失败，请稍后重试");
    }
  };

  // 切换完成状态（乐观更新）
  const toggleStatus = async (id: number) => {
    const backup = memos;
    const nextStatus = (s: string) =>
      s === "pending" ? "completed" : s === "completed" ? "incomplete" : "pending";
    // 立即切换 UI
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, completion_status: nextStatus(m.completion_status) } : m
      )
    );
    try {
      await withSync(() => getDataClient().toggleMemoStatus(id));
    } catch (error) {
      setMemos(backup);
      console.error("切换状态失败:", error);
    }
  };

  // 切换置顶状态（乐观更新）
  const togglePin = async (id: number, currentPinned: boolean) => {
    const backup = memos;
    // 立即切换 UI
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, pinned: !currentPinned } : m
      )
    );
    try {
      await withSync(() => getDataClient().updateMemo({ id, pinned: !currentPinned }));
    } catch (error) {
      setMemos(backup);
      console.error("切换置顶失败:", error);
    }
  };

  const appendImageToMemo = async (file: Blob, displayName = "图片") => {
    setIsProcessingImage(true);
    try {
      const compressed = await compressImageToDataUrl(file);
      setNewMemoContent((prev) => prev + `\n![${displayName}](${compressed})\n`);
    } catch (error) {
      console.warn("图片压缩失败，回退为原图:", error);
      try {
        const original = await fileToDataUrl(file);
        setNewMemoContent((prev) => prev + `\n![${displayName}](${original})\n`);
      } catch (fallbackError) {
        console.error("图片读取失败:", fallbackError);
        toast.error("图片处理失败，请重试");
      }
    } finally {
      setIsProcessingImage(false);
    }
  };

  // 处理粘贴事件 (支持粘贴图片)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          await appendImageToMemo(blob, "截图");
        }
        break;
      }
    }
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.type.startsWith("image/")) {
      await appendImageToMemo(file, file.name);
    } else {
      setNewMemoContent((prev) => prev + `\n📎 附件: ${file.name}\n`);
    }
    e.target.value = "";
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const shouldShowLoader = !hasLoadedOnceRef.current;
      if (shouldShowLoader) {
        setIsInitialLoading(true);
      }
      try {
        await refreshData();
      } catch (error) {
        console.error("数据加载失败:", error);
        toast.error("数据加载失败，请检查网络");
      } finally {
        if (!cancelled && shouldShowLoader) {
          setIsInitialLoading(false);
          hasLoadedOnceRef.current = true;
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // 自动刷新: 本地模式轮询 + 聚焦刷新
  useEffect(() => {
    const refresh = () => {
      refreshData().catch((error) => {
        console.error("自动刷新失败:", error);
      });
    };

    const shouldPoll = effectiveDataMode !== "cloud";
    const timer = shouldPoll ? window.setInterval(refresh, 15000) : null;
    window.addEventListener("focus", refresh);

    return () => {
      if (timer) window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [selectedDate, effectiveDataMode]);

  // 云端模式: 使用 Supabase Realtime, 新增/编辑几乎实时同步
  useEffect(() => {
    if (effectiveDataMode !== "cloud" || !isCloudConfigured()) return;

    const unsubscribe = subscribeCloudChanges(() => {
      refreshData().catch((error) => {
        console.error("实时同步刷新失败:", error);
      });
    });

    return () => unsubscribe();
  }, [selectedDate, effectiveDataMode]);

  const switchDataMode = (mode: DataMode) => {
    setPreferredDataMode(mode);
    setDataMode(mode);
    setPendingSyncCount(0);
    setLastSyncError(null);
    window.location.reload();
  };

  const mobileTabs: Array<{
    id: Tab;
    icon: typeof Home;
    label: string;
  }> = [
      { id: "home", icon: Home, label: "首页" },
      { id: "stats", icon: BarChart2, label: "统计" },
      { id: "archive", icon: Bookmark, label: "置顶" },
      { id: "settings", icon: SettingsIcon, label: "设置" },
    ];

  const renderSyncBadge = () => {
    if (effectiveDataMode !== "cloud") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <CloudOff size={11} />
          本地模式
        </span>
      );
    }

    if (lastSyncError) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[11px] text-rose-600 dark:bg-rose-900/30 dark:text-rose-300">
          <Cloud size={11} />
          同步异常
        </span>
      );
    }

    if (pendingSyncCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          <RefreshCw size={11} className="animate-spin" />
          同步中
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
        <CheckCircle2 size={11} />
        {lastSyncedAt ? `已同步 ${dayjs(lastSyncedAt).format("HH:mm:ss")}` : "已连接云端"}
      </span>
    );
  };

  const commandItems: CommandPaletteItem[] = [
      {
        id: "new-memo",
        label: "新建笔记（发送当前输入）",
        keywords: ["新建", "创建", "发送", "memo"],
        hint: "⌘+Enter",
        onSelect: () => {
          if (!newMemoContent.trim()) {
            textareaRef.current?.focus();
            toast.message("请先输入内容");
            return;
          }
          void createMemo();
        },
      },
      {
        id: "go-today",
        label: "跳转到今天",
        keywords: ["today", "日期", "今天", "日视图"],
        onSelect: () => {
          setActiveTab("home");
          setSelectedDate(dayjs());
          setViewMode("day");
          setShowDateFilter(true);
        },
      },
      {
        id: "toggle-compact",
        label: compactMode ? "关闭紧凑视图" : "打开紧凑视图",
        keywords: ["紧凑", "列表", "视图"],
        onSelect: () => setCompactMode((prev) => !prev),
      },
      {
        id: "tab-stats",
        label: "打开统计页",
        keywords: ["统计", "图表", "stats"],
        onSelect: () => setActiveTab("stats"),
      },
      {
        id: "tab-archive",
        label: "打开置顶页",
        keywords: ["置顶", "归档", "archive"],
        onSelect: () => setActiveTab("archive"),
      },
      {
        id: "tab-settings",
        label: "打开设置页",
        keywords: ["设置", "config", "settings"],
        onSelect: () => setActiveTab("settings"),
      },
      {
        id: "mode-cloud",
        label: "切换为云同步模式",
        keywords: ["云", "cloud", "同步"],
        onSelect: () => switchDataMode("cloud"),
      },
      {
        id: "mode-local",
        label: "切换为本地模式",
        keywords: ["本地", "local", "离线"],
        onSelect: () => switchDataMode("local"),
      },
      {
        id: "mode-auto",
        label: "切换为自动模式",
        keywords: ["auto", "自动"],
        onSelect: () => switchDataMode("auto"),
      },
    ];

  const categoryCommands = categories.map<CommandPaletteItem>((cat) => ({
      id: `category-${cat.id}`,
      label: `切换分类：${cat.name}`,
      keywords: ["分类", cat.name, cat.id],
      onSelect: () => {
        setActiveTab("home");
        setSelectedCategory(cat.id);
        textareaRef.current?.focus();
      },
    }));

  commandItems.push(...categoryCommands);

  // 根据视图模式过滤笔记
  const getFilteredMemos = () => {
    let result = memos;

    // 搜索过滤
    if (searchQuery) {
      result = result.filter((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 分类过滤
    if (filterCategory) {
      result = result.filter((m) => m.category === filterCategory);
    }

    // 日期/视图过滤
    if (showDateFilter) {
      if (viewMode === "day") {
        result = result.filter(
          (m) => {
            const dateStr = m.target_date
              ? dayjs(m.target_date).format("YYYY-MM-DD")
              : dayjs.unix(m.created_ts).format("YYYY-MM-DD");
            return dateStr === selectedDate.format("YYYY-MM-DD");
          }
        );
      } else if (viewMode === "week") {
        const weekStart = selectedDate.startOf("week");
        const weekEnd = selectedDate.endOf("week");
        result = result.filter((m) => {
          const memoDate = dayjs.unix(m.created_ts);
          return memoDate.isAfter(weekStart) && memoDate.isBefore(weekEnd);
        });
      } else if (viewMode === "month") {
        result = result.filter(
          (m) =>
            dayjs.unix(m.created_ts).format("YYYY-MM") ===
            selectedDate.format("YYYY-MM")
        );
      } else if (viewMode === "year") {
        result = result.filter(
          (m) =>
            dayjs.unix(m.created_ts).format("YYYY") ===
            selectedDate.format("YYYY")
        );
      }
    }

    return result;
  };

  const filteredMemos = getFilteredMemos();

  // 按日期分组笔记 (暂未使用)
  // const groupedMemos = filteredMemos.reduce((groups, memo) => {
  //   const date = dayjs.unix(memo.created_ts).format("YYYY-MM-DD");
  //   if (!groups[date]) groups[date] = [];
  //   groups[date].push(memo);
  //   return groups;
  // }, {} as Record<string, Memo[]>);

  const getCat = (id: string) =>
    categories.find((c) => c.id === id);

  // 渲染笔记卡片
  const renderMemoCard = (memo: Memo) => {
    const cat = getCat(memo.category);
    const isEditing = editingMemoId === memo.id;

    return (
      <div
        key={memo.id}
        className={`memo-card group ${memo.category === 'planning' ? 'opacity-80 bg-purple-50/50 dark:bg-purple-900/20' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">
            {dayjs.unix(memo.created_ts).format("HH:mm")}
          </span>
          <div className="flex items-center gap-2">
            {memo.pinned && <Pin size={12} className="text-blue-500" />}
            {cat && (
              <span
                className="px-2 py-0.5 rounded-full text-xs"
                style={{ backgroundColor: cat.bg, color: cat.color }}
              >
                {cat.name}
              </span>
            )}
          </div>
        </div>

        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded resize-none"
            rows={3}
            autoFocus
          />
        ) : (
          <div className="text-gray-800 whitespace-pre-wrap">
            {memo.content.split("\n").map((line, i) => {
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
                      className={`rounded-lg my-2 transition-all ${compactMode
                        ? "max-w-[200px] max-h-[150px] object-cover cursor-pointer hover:scale-105"
                        : "max-w-full"
                        }`}
                      onClick={() => {
                        if (compactMode) {
                          const w = window.open("");
                          if (w) {
                            w.document.write(`<img src="${match[1]}" style="max-width: 100%" />`);
                          }
                        }
                      }}
                    />
                  );
                }
              }
              return <p key={i}>{line}</p>;
            })}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
              <>
                <button
                  onClick={() => updateMemo(memo.id)}
                  className="px-2 py-1 text-xs bg-zinc-900 text-white rounded hover:bg-zinc-800"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingMemoId(null)}
                  className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setEditingMemoId(memo.id);
                    setEditContent(memo.content);
                  }}
                  className="p-1.5 text-gray-400 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                  title="编辑"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => togglePin(memo.id, memo.pinned)}
                  className={`p-1.5 rounded transition-colors ${memo.pinned ? "text-blue-500 bg-blue-50" : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"}`}
                  title={memo.pinned ? "取消置顶" : "置顶"}
                >
                  <Pin size={14} />
                </button>
                <button
                  onClick={() => deleteMemo(memo.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                  title="删除"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => toggleStatus(memo.id)}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${memo.completion_status === "completed"
              ? "bg-green-500 border-green-500 text-white"
              : memo.completion_status === "incomplete"
                ? "bg-red-500 border-red-500 text-white"
                : "border-gray-300 text-gray-300 hover:border-gray-400"
              }`}
          >
            {memo.completion_status === "completed" && <Check size={14} />}
            {memo.completion_status === "incomplete" && <X size={14} />}
          </button>
        </div>
      </div>
    );
  };

  // 统计数据
  const stats = {
    total: memos.length,
    completed: memos.filter((m) => m.completion_status === "completed").length,
    incomplete: memos.filter((m) => m.completion_status === "incomplete").length,
    pending: memos.filter((m) => m.completion_status === "pending").length,
    byCategory: categories.map((cat) => ({
      ...cat,
      count: memos.filter((m) => m.category === cat.id).length,
    })),
  };

  // 渲染统计页面
  const renderStatsTab = () => (
    <div className="w-full space-y-6">
      <h2 className="text-xl font-semibold">📊 统计概览</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-500">总笔记</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-green-600">已完成</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.incomplete}</div>
          <div className="text-sm text-red-600">未完成</div>
        </div>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">待标记</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium mb-4">分类统计</h3>
        <div className="space-y-3">
          {stats.byCategory.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-sm text-gray-600">{cat.name}</span>
              <span className="text-sm font-medium">{cat.count}</span>
              <div className="flex-1 max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: cat.color,
                    width: `${stats.total > 0 ? (cat.count / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 渲染归档页面
  const renderArchiveTab = () => {
    const archivedMemos = memos.filter((m) => m.pinned);
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-xl font-semibold">📌 置顶笔记</h2>
        {archivedMemos.length === 0 ? (
          <Empty>
            <EmptyIcon>📌</EmptyIcon>
            <EmptyTitle>暂无置顶笔记</EmptyTitle>
            <EmptyDescription>你可以在笔记卡片右上角将重要内容置顶。</EmptyDescription>
          </Empty>
        ) : (
          <div className="space-y-3">{archivedMemos.map(renderMemoCard)}</div>
        )}
      </div>
    );
  };

  const renderHomeSkeleton = () => (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70"
        >
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );

  // 渲染设置页面
  const renderSettingsTab = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-xl font-semibold">⚙️ 设置</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">数据存储位置</span>
          <span className="text-sm text-gray-500">
            {dataMode === "cloud"
              ? "Supabase 云端"
              : dataMode === "local"
                ? "tesla_notes.db (本地)"
                : "自动模式 (桌面本地/网页云端)"}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">同步模式</span>
            <span className="text-sm text-gray-500">{dataMode}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">同步状态</span>
            {renderSyncBadge()}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => switchDataMode("auto")}
              className={`px-3 py-1.5 rounded-md text-sm border ${dataMode === "auto"
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
            >
              自动
            </button>
            <button
              onClick={() => switchDataMode("local")}
              className={`px-3 py-1.5 rounded-md text-sm border ${dataMode === "local"
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
            >
              仅本地
            </button>
            <button
              onClick={() => switchDataMode("cloud")}
              className={`px-3 py-1.5 rounded-md text-sm border ${dataMode === "cloud"
                ? "bg-zinc-900 text-white border-zinc-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
            >
              云同步
            </button>
          </div>
          <p className="text-xs text-gray-500">
            云同步模式下启用实时同步（手机新增通常秒级出现）；本地模式保留 15 秒自动刷新。
          </p>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">笔记总数</span>
          <span className="text-sm text-gray-500">{memos.length} 条</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">版本</span>
          <span className="text-sm text-gray-500">Zac卓越之道 v0.1.0</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700">主题切换</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* 桌面侧边栏 */}
      <div className="hidden md:flex">
        <Sidebar
          memos={memos}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          showDateFilter={showDateFilter}
          setShowDateFilter={setShowDateFilter}
        />
      </div>

      {/* 手机抽屉侧边栏 */}
      {mobileSidebarOpen && (
        <button
          className="md:hidden fixed inset-0 z-30 bg-black/45 backdrop-blur-[1px]"
          onClick={() => setMobileSidebarOpen(false)}
          aria-label="关闭侧边栏"
        />
      )}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-40 w-[84vw] max-w-[340px] transition-transform duration-300",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          memos={memos}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          showDateFilter={showDateFilter}
          setShowDateFilter={setShowDateFilter}
          className="w-full h-full shadow-2xl"
          showBottomNav={false}
          onInteraction={() => setMobileSidebarOpen(false)}
        />
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {/* 手机顶部栏 */}
        <div className="md:hidden sticky top-0 z-20 px-3 pt-2 pb-3 border-b border-slate-200/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="打开菜单"
            >
              <Menu size={18} />
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Zac卓越之道</div>
              <div className="text-xs text-slate-500">{selectedDate.format("YYYY年M月D日")}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsCommandOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="打开命令面板"
                title="命令面板"
              >
                <Search size={16} />
              </button>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-2 flex justify-center">
            {renderSyncBadge()}
          </div>
        </div>

        <div className="hidden md:flex items-center justify-end gap-2 px-4 pt-3">
          {renderSyncBadge()}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            title="命令面板"
          >
            <Search size={13} />
            <span>命令面板</span>
            <span className="text-[10px] text-slate-400">⌘K</span>
          </button>
        </div>

        {activeTab === "home" ? (
          <>
            <MemoEditor
              newMemoContent={newMemoContent}
              setNewMemoContent={setNewMemoContent}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              onCreateMemo={createMemo}
              onPaste={handlePaste}
              onFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
              textareaRef={textareaRef}
              isProcessingImage={isProcessingImage}
            />

            {isInitialLoading ? (
              renderHomeSkeleton()
            ) : (
              <>
                {viewMode === "day" && filteredMemos.length > 0 && (
                  <div className="hidden md:flex justify-end px-4 pb-2">
                    <button
                      onClick={() => setCompactMode(!compactMode)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title={compactMode ? "切换到默认视图" : "切换到紧凑视图"}
                    >
                      {compactMode ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                      <span>{compactMode ? "默认视图" : "紧凑视图"}</span>
                    </button>
                  </div>
                )}

                <MemoList
                  memos={filteredMemos}
                  selectedDate={selectedDate}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  setSelectedDate={setSelectedDate}
                  setShowDateFilter={setShowDateFilter}
                  renderMemoCard={renderMemoCard}
                  compactMode={compactMode}
                />
              </>
            )}
          </>
        ) : activeTab === "stats" ? (
          <div className="flex-1 overflow-auto p-4">{renderStatsTab()}</div>
        ) : activeTab === "archive" ? (
          <div className="flex-1 overflow-auto p-4">{renderArchiveTab()}</div>
        ) : (
          <div className="flex-1 overflow-auto p-4">{renderSettingsTab()}</div>
        )}
      </div>

      {/* 手机底部导航 */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-20 border-t border-slate-200/70 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
        <div className="grid grid-cols-4 px-2 py-2">
          {mobileTabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1 rounded-lg text-[11px] transition-colors",
                activeTab === id
                  ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/30"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <CommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} items={commandItems} />
      <Toaster />
    </div>
  );
}

export default App;
