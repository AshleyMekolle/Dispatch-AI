"use client";

import { useState } from "react";

export function Toggle({
  label,
  description,
  defaultOn = true,
}: {
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div>
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-[13px] text-muted">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        role="switch"
        aria-checked={on}
        className={`relative h-6 w-10.5 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 ${
          on ? "bg-primary" : "bg-ink/[0.12]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
