import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface EmptyProps extends HTMLAttributes<HTMLDivElement> {}

export function Empty({ className, ...props }: EmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300/70 bg-white/60 p-6 text-center dark:border-slate-700 dark:bg-slate-900/40",
        className
      )}
      {...props}
    />
  );
}

export function EmptyIcon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mb-3 flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300",
        className
      )}
    >
      {children}
    </div>
  );
}

export function EmptyTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-slate-900 dark:text-slate-100", className)} {...props} />
  );
}

export function EmptyDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm text-slate-500 dark:text-slate-400", className)}
      {...props}
    />
  );
}

