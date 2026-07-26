import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger-ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium tracking-[-0.01em] transition-all duration-150 rounded-lg whitespace-nowrap disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none";

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
    <button onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "danger" | "accent" | "primary" | "pending";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/[0.05] text-muted",
    success: "bg-success/10 text-success",
    danger: "bg-danger/10 text-danger",
    accent: "bg-accent/12 text-[#8f6a1e]",
    primary: "bg-primary/10 text-primary",
    pending: "bg-[#f1efe9] text-faint",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({
  tone,
  pulse = false,
}: {
  tone: "success" | "danger" | "accent" | "muted" | "primary";
  pulse?: boolean;
}) {
  const tones = {
    success: "bg-success",
    danger: "bg-danger",
    accent: "bg-accent",
    muted: "bg-faint",
    primary: "bg-primary",
  };
  return (
    <span
      className={`inline-block size-1.5 rounded-full ${tones[tone]} ${pulse ? "pulse-dot" : ""}`}
    />
  );
}
