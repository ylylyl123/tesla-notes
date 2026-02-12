import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

/**
 * Button 组件变体定义 (shadcn/ui 风格)
 */
const buttonVariants = cva(
    // 基础样式
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
                secondary:
                    "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                ghost:
                    "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                destructive:
                    "bg-red-500 text-white shadow-sm hover:bg-red-600",
                outline:
                    "border border-slate-200 bg-transparent text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
                link:
                    "text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400",
            },
            size: {
                default: "h-9 px-4 text-sm",
                sm: "h-8 px-3 text-xs",
                lg: "h-11 px-6 text-base",
                icon: "h-9 w-9",
                "icon-sm": "h-8 w-8",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

/**
 * Button 组件
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);

Button.displayName = "Button";

export { Button, buttonVariants };
