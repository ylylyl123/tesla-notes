import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { type HTMLAttributes } from "react";

/**
 * Badge 变体定义 - 分类标签样式
 */
const badgeVariants = cva(
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
    {
        variants: {
            variant: {
                default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                work: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
                study: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                project: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
                fitness: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                media: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
                daily: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                idea: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
                finance: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300",
                planning: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                destructive: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

export interface BadgeProps
    extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

/**
 * Badge 组件 - 分类标签
 */
function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

export { Badge, badgeVariants };
