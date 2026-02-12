import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { forwardRef, type ButtonHTMLAttributes } from "react";

/**
 * IconButton 变体定义
 */
const iconButtonVariants = cva(
    "inline-flex items-center justify-center rounded-lg transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800",
                primary:
                    "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/50",
                destructive:
                    "text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30",
                ghost:
                    "text-slate-400 hover:text-slate-600 hover:bg-transparent dark:text-slate-500 dark:hover:text-slate-300",
            },
            size: {
                default: "h-9 w-9",
                sm: "h-8 w-8",
                lg: "h-10 w-10",
                xs: "h-7 w-7",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface IconButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> { }

/**
 * IconButton 组件
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(iconButtonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);

IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
