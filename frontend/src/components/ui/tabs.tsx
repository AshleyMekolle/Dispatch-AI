const tabFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  variant = "segmented",
  className = "",
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  variant?: "segmented" | "chips";
  className?: string;
}) {
  if (variant === "chips") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${tabFocus} ${
              value === option
                ? "bg-ink text-white"
                : "border border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-[0_1px_2px_rgb(17_17_17/0.03)] ${className}`}
    >
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`cursor-pointer rounded-[7px] px-3.5 py-1.5 text-[13px] font-medium transition-colors ${tabFocus} ${
            value === option ? "bg-ink text-white" : "text-muted hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
