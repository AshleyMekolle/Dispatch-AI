import type { TextareaHTMLAttributes } from "react";

const textareaClassName =
  "min-h-[100px] w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-[13.5px] leading-relaxed text-ink shadow-[0_1px_2px_rgb(17_17_17/0.03)] outline-none transition-shadow placeholder:text-faint focus:border-primary/40 focus:shadow-[0_0_0_3px_rgb(31_77_58/0.08)]";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${textareaClassName} ${className}`} {...props} />;
}
