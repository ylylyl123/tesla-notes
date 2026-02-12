import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateMemoInput,
  DailyPlan,
  DataClient,
  Memo,
  UpdateMemoInput,
} from "./types";

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !anonKey) {
    throw new Error("缺少 Supabase 配置: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
  }

  supabase = createClient(url, anonKey);
  return supabase;
}

function nowTs(): number {
  return Math.floor(Date.now() / 1000);
}

async function getMemoById(id: number): Promise<Memo> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("memo")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Memo;
}

function nextStatus(current: string): string {
  if (current === "pending") return "completed";
  if (current === "completed") return "incomplete";
  return "pending";
}

export const cloudClient: DataClient = {
  getMemos: async (params) => {
    const client = getSupabaseClient();
    const limit = params?.limit ?? 100;
    const offset = params?.offset ?? 0;
    let query = client
      .from("memo")
      .select("*")
      .eq("archived", false)
      .order("pinned", { ascending: false })
      .order("created_ts", { ascending: false })
      .range(offset, offset + limit - 1);

    if (params?.category) {
      query = query.eq("category", params.category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Memo[];
  },

  createMemo: async (input: CreateMemoInput) => {
    const client = getSupabaseClient();
    const ts = nowTs();
    const payload = {
      created_ts: ts,
      updated_ts: ts,
      category: input.category ?? "daily",
      target_date: input.targetDate ?? null,
      content: input.content,
    };
    const { data, error } = await client
      .from("memo")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return data as Memo;
  },

  updateMemo: async (input: UpdateMemoInput) => {
    const client = getSupabaseClient();
    const payload: Record<string, unknown> = {
      updated_ts: nowTs(),
    };

    if (input.content !== undefined) payload.content = input.content;
    if (input.category !== undefined) payload.category = input.category;
    if (input.targetDate !== undefined) payload.target_date = input.targetDate;
    if (input.completionStatus !== undefined) payload.completion_status = input.completionStatus;
    if (input.pinned !== undefined) payload.pinned = input.pinned;
    if (input.archived !== undefined) payload.archived = input.archived;

    const { data, error } = await client
      .from("memo")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as Memo;
  },

  deleteMemo: async (id: number) => {
    const client = getSupabaseClient();
    const { error } = await client.from("memo").delete().eq("id", id);
    if (error) throw error;
  },

  toggleMemoStatus: async (id: number) => {
    const current = await getMemoById(id);
    return cloudClient.updateMemo({
      id,
      completionStatus: nextStatus(current.completion_status),
    });
  },

  getPlansByDate: async (date: string) => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("daily_plan")
      .select("*")
      .eq("plan_date", date)
      .order("priority", { ascending: false })
      .order("created_ts", { ascending: true });
    if (error) throw error;
    return (data ?? []) as DailyPlan[];
  },
};
