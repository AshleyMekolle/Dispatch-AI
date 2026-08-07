"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Button, Card, SearchInput, StatusDot, Tabs } from "@/components/ui";
import { AppStack } from "@/components/app-icon";
import { EXECUTIONS } from "@/lib/data";

const TABS = ["All", "Completed", "Needs review", "Failed"] as const;

export default function HistoryPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const filtered =
    tab === "All" ? EXECUTIONS : EXECUTIONS.filter((e) => e.status === tab);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="History"
        subtitle="A complete record of every workflow Dispatch has executed."
        actions={
          <Button variant="secondary">
            <Download className="size-4" />
            Export
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Tabs options={TABS} value={tab} onChange={setTab} />
        <SearchInput placeholder="Search executions…" className="w-64" />
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-[11.5px] font-semibold tracking-wide text-faint uppercase">
              <th className="px-5 py-3">Workflow</th>
              <th className="px-5 py-3">Apps</th>
              <th className="px-5 py-3">Origin</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">When</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {filtered.map((e) => (
              <tr
                key={e.id}
                className="cursor-pointer transition-colors hover:bg-canvas/50"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <StatusDot
                      tone={
                        e.status === "Completed"
                          ? "success"
                          : e.status === "Failed"
                            ? "danger"
                            : "accent"
                      }
                    />
                    <div>
                      <p className="text-[13.5px] font-medium text-ink">
                        {e.name}
                      </p>
                      <p className="text-xs text-faint">
                        {e.id} · {e.steps} steps
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <AppStack apps={e.apps.slice(0, 4)} size="xs" />
                </td>
                <td className="px-5 py-3.5 text-[13px] text-muted">
                  {e.origin}
                </td>
                <td className="px-5 py-3.5 text-[13px] tabular-nums text-muted">
                  {e.duration}
                </td>
                <td className="px-5 py-3.5 text-[13px] text-muted">{e.when}</td>
                <td className="px-5 py-3.5 text-right">
                  <Badge
                    tone={
                      e.status === "Completed"
                        ? "success"
                        : e.status === "Failed"
                          ? "danger"
                          : "accent"
                    }
                  >
                    {e.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
