import type { ReactNode } from "react";

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
