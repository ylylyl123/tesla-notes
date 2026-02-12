// 分类类型
export type MemoCategory =
    | 'work'     // 工作
    | 'study'    // 学习
    | 'project'  // 项目
    | 'fitness'  // 健身
    | 'media'    // 自媒体
    | 'daily'    // 日常
    | 'idea';    // 小想法

// 完成状态
export type CompletionStatus =
    | 'pending'    // 待处理 ○
    | 'completed'  // 已完成 ✓
    | 'incomplete'; // 未完成 ✗

// 视图模式
export type ViewMode = 'day' | 'week' | 'month' | 'year';

// 笔记类型
export interface Memo {
    id: number;
    uid: string;
    creatorId: number;
    createdTs: number;
    updatedTs: number;
    category: MemoCategory;
    targetDate?: string; // YYYY-MM-DD
    completionStatus: CompletionStatus;
    content: string;
    visibility: 'PUBLIC' | 'PROTECTED' | 'PRIVATE';
    pinned: boolean;
    archived: boolean;
}

// 每日计划类型
export interface DailyPlan {
    id: number;
    userId: number;
    planDate: string; // YYYY-MM-DD
    title: string;
    description?: string;
    category: MemoCategory;
    completed: boolean;
    priority: number;
    estimatedMinutes?: number;
    actualMinutes?: number;
    createdTs: number;
    updatedTs: number;
    completedTs?: number;
    relatedMemoId?: number;
}

// 用户类型
export interface User {
    id: number;
    username: string;
    nickname: string;
    avatarUrl?: string;
    createdTs: number;
}

// 分类定义
export const CATEGORIES: Record<MemoCategory, { name: string; color: string; icon: string }> = {
    work: { name: '工作', color: '#3B82F6', icon: '💼' },
    study: { name: '学习', color: '#10B981', icon: '📚' },
    project: { name: '项目', color: '#8B5CF6', icon: '🚀' },
    fitness: { name: '健身', color: '#F59E0B', icon: '💪' },
    media: { name: '自媒体', color: '#EC4899', icon: '📱' },
    daily: { name: '日常', color: '#6B7280', icon: '📝' },
    idea: { name: '小想法', color: '#EAB308', icon: '💡' },
};

// 完成状态定义
export const COMPLETION_STATUS: Record<CompletionStatus, { name: string; color: string; icon: string }> = {
    pending: { name: '待处理', color: '#9CA3AF', icon: '○' },
    completed: { name: '已完成', color: '#10B981', icon: '✓' },
    incomplete: { name: '未完成', color: '#EF4444', icon: '✗' },
};
