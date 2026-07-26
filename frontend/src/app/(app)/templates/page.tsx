"use client";

import { useState } from "react";
import { Play, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, Card } from "@/components/ui";
import { AppStack } from "@/components/app-icon";
import { TEMPLATES } from "@/lib/data";

const CATEGORIES = [
  "All",
  "Sales",
  "Recruiting",
  "HR",
  "Finance",
  "Operations",
  "Support",
];

export default function TemplatesPage() {
  const [cat, setCat] = useState("All");
  const filtered =
    cat === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Templates"
        subtitle="Proven workflows your team can run with a single sentence."
        actions={
          <Button variant="secondary">
            <Plus className="size-4" />
            Create template
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
              cat === c
                ? "bg-ink text-white"
                : "border border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <Card
            key={t.name}
            className="group flex flex-col p-6 transition-shadow hover:shadow-raised"
          >
            <div className="mb-4 flex items-center justify-between">
              <AppStack apps={t.apps} />
              <span className="rounded-full bg-ink/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted">
                {t.category}
              </span>
            </div>
            <h3 className="text-[15px] font-semibold tracking-tight text-ink">
              {t.name}
            </h3>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">
              {t.description}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span className="text-xs text-faint">
                {t.steps} steps · {t.runs} runs
              </span>
              <button className="flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-primary transition-colors hover:text-primary-hover">
                <Play className="size-3.5" />
                Use template
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
