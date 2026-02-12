export interface Memo {
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

export interface DailyPlan {
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

export interface CreateMemoInput {
  content: string;
  category?: string;
  targetDate?: string;
}

export interface UpdateMemoInput {
  id: number;
  content?: string;
  category?: string;
  targetDate?: string;
  completionStatus?: string;
  pinned?: boolean;
  archived?: boolean;
}

export interface DataClient {
  getMemos(params?: {
    limit?: number;
    offset?: number;
    category?: string;
  }): Promise<Memo[]>;
  createMemo(input: CreateMemoInput): Promise<Memo>;
  updateMemo(input: UpdateMemoInput): Promise<Memo>;
  deleteMemo(id: number): Promise<void>;
  toggleMemoStatus(id: number): Promise<Memo>;
  getPlansByDate(date: string): Promise<DailyPlan[]>;
}
