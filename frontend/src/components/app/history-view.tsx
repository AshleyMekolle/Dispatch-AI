"use client";

import { useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { ACTIONS } from "@/components/app/workspace/action-registry";
import { Badge, Card, SearchInput, StatusDot, Tabs } from "@/components/ui";
import type { ExecutionSummary, ExecutionStatus } from "@/lib/api";

const TABS = ["All", "SUCCESS", "FAILED", "RUNNING"] as const;

function statusTone(status: ExecutionStatus) {
  if (status === "SUCCESS") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "RUNNING") return "primary" as const;
  return "accent" as const;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today · ${time}`;
  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${time}`;
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "—";
  const ms = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 0) return "—";
  if (ms < 1000) return "<1s";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function HistoryView({ executions }: { executions: ExecutionSummary[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return executions.filter((e) => {
      if (tab !== "All" && e.status !== tab) return false;
      if (query && !e.workflow_title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [executions, tab, query]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <Tabs options={TABS} value={tab} onChange={setTab} />
        <SearchInput
          placeholder="Search executions…"
          className="w-64"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-faint">
            {executions.length === 0
              ? "No executions yet — run an automation to see it here."
              : "Nothing matches that filter."}
          </p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/60 text-[11.5px] font-semibold tracking-wide text-faint uppercase">
                <th className="px-5 py-3">Workflow</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/70">
              {filtered.map((e) => {
                const action = ACTIONS.find((a) => a.type === e.action_type);
                return (
                  <tr key={e.id} className="transition-colors hover:bg-canvas/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <StatusDot tone={statusTone(e.status)} />
                        {action && <AppIcon app={action.app} size="sm" />}
                        <p className="text-[13.5px] font-medium text-ink">{e.workflow_title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-muted">
                      {formatWhen(e.started_at)}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] tabular-nums text-muted">
                      {formatDuration(e.started_at, e.completed_at)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
