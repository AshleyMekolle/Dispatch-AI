import type { InputHTMLAttributes } from "react";
import { Input } from "./input";

export function Field({
  label,
  hint,
  className = "",
  ...props
}: {
  label: string;
  hint?: string;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </span>
      <Input className={className} {...props} />
      {hint && <span className="mt-1.5 block text-xs text-faint">{hint}</span>}
    </label>
  );
}
