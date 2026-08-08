"use client";

import { useState, type FormEvent } from "react";
import { ArrowUp } from "lucide-react";

export function PromptBar() {
  const [value, setValue] = useState("");
  const [nudged, setNudged] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setNudged(true);
    setValue("");
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card transition-shadow focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgb(31_77_58/0.08)]"
      >
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setNudged(false);
          }}
          placeholder="Describe what you want to automate…"
          className="flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
        />
        <button
          type="submit"
          className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors ${
            value.trim()
              ? "bg-primary text-white hover:bg-primary-hover"
              : "bg-ink/[0.06] text-faint"
          }`}
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
      {nudged && (
        <p className="mt-2.5 text-center text-[13px] text-muted">
          Free-form requests are coming soon — pick the closest match below and I&apos;ll take
          it from there.
        </p>
      )}
    </div>
  );
}
