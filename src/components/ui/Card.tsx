import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Card 组件 - 悬浮岛屿效果
 */
const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "rounded-2xl p-5",
                "bg-white/75 dark:bg-slate-900/75",
                "backdrop-blur-xl",
                "border border-slate-200/50 dark:border-slate-700/50",
                "shadow-sm",
                "transition-all duration-300",
                "hover:shadow-lg hover:shadow-indigo-500/10",
                "hover:-translate-y-1",
                "hover:border-indigo-300/50 dark:hover:border-indigo-500/50",
                className
            )}
            {...props}
        />
    )
);
Card.displayName = "Card";

/**
 * CardHeader 组件
 */
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("flex items-center justify-between mb-3", className)}
            {...props}
        />
    )
);
CardHeader.displayName = "CardHeader";

/**
 * CardTitle 组件
 */
const CardTitle = forwardRef<
    HTMLParagraphElement,
    HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-lg font-semibold text-slate-900 dark:text-slate-100",
            className
        )}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

/**
 * CardContent 组件
 */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn("text-slate-700 dark:text-slate-300", className)}
            {...props}
        />
    )
);
CardContent.displayName = "CardContent";

/**
 * CardFooter 组件
 */
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(
                "flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800",
                className
            )}
            {...props}
        />
    )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
