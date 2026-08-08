import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger-ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] transition-all duration-150 rounded-lg whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(17_17_17/0.12)]",
  secondary:
    "bg-surface text-ink border border-line hover:border-[#d8d4cb] hover:bg-[#fbfaf8] shadow-[0_1px_2px_rgb(17_17_17/0.04)]",
  ghost: "text-muted hover:text-ink hover:bg-ink/[0.04]",
  "danger-ghost": "text-danger hover:bg-danger/[0.06]",
};

const sizes = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-9.5 px-4 text-sm",
  lg: "h-11 px-5 text-[15px]",
};

export function Button({
  children,
  href,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  className = "",
  disabled,
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
