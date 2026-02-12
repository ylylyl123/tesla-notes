import { invoke } from "@tauri-apps/api/core";
import type {
  CreateMemoInput,
  DailyPlan,
  DataClient,
  Memo,
  UpdateMemoInput,
} from "./types";

export const localClient: DataClient = {
  getMemos: async (params) =>
    invoke<Memo[]>("get_memos", {
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0,
      category: params?.category,
    }),

  createMemo: async (input: CreateMemoInput) =>
    invoke<Memo>("create_memo", {
      content: input.content,
      category: input.category,
      targetDate: input.targetDate,
    }),

  updateMemo: async (input: UpdateMemoInput) =>
    invoke<Memo>("update_memo", {
      id: input.id,
      content: input.content,
      category: input.category,
      targetDate: input.targetDate,
      completionStatus: input.completionStatus,
      pinned: input.pinned,
      archived: input.archived,
    }),

  deleteMemo: async (id: number) => {
    await invoke("delete_memo", { id });
  },

  toggleMemoStatus: async (id: number) =>
    invoke<Memo>("toggle_memo_status", { id }),

  getPlansByDate: async (date: string) =>
    invoke<DailyPlan[]>("get_plans_by_date", { date }),
};
