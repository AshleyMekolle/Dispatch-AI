import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

export const inputClassName =
  "h-9.5 w-full rounded-lg border border-line bg-surface px-3 text-[13.5px] text-ink shadow-[0_1px_2px_rgb(17_17_17/0.03)] outline-none transition-shadow placeholder:text-faint focus:border-primary/40 focus:shadow-[0_0_0_3px_rgb(31_77_58/0.08)]";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClassName} ${className}`} {...props} />;
}

const searchSizes = {
  sm: "h-8 px-2.5",
  md: "h-9 px-3",
};

export function SearchInput({
  inputSize = "md",
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  inputSize?: "sm" | "md";
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-line bg-surface transition-shadow focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgb(31_77_58/0.08)] ${searchSizes[inputSize]} ${className}`}
    >
      <Search className="size-3.5 shrink-0 text-faint" />
      <input
        className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
        {...props}
      />
    </div>
  );
}
