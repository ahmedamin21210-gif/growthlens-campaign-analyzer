import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-9 w-9 p-0",
        variant === "primary" && "border-brand-navy bg-brand-navy text-white hover:bg-[#15113a]",
        variant === "secondary" && "border-brand-border bg-white text-brand-navy hover:border-brand-cyan hover:bg-cyan-50",
        variant === "ghost" && "border-transparent bg-transparent text-slate-700 shadow-none hover:bg-slate-100 hover:text-brand-navy",
        variant === "danger" && "border-brand-red bg-brand-red text-white hover:bg-red-600",
        className
      )}
      {...props}
    />
  );
}
