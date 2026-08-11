import { CheckCircle2, ListChecks, Zap } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ACTIONS } from "@/components/app/workspace/action-registry";
import { Card } from "@/components/ui";
import { AppIcon } from "@/components/app-icon";
import { getExecutionsServer, getWorkflowsServer } from "@/lib/server-api";

const DAYS = 14;

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function AnalyticsPage() {
  const [workflows, executions] = await Promise.all([getWorkflowsServer(), getExecutionsServer()]);

  const succeeded = executions.filter((e) => e.status === "SUCCESS").length;
  const successRate =
    executions.length > 0 ? `${Math.round((succeeded / executions.length) * 100)}%` : "—";

  const stats = [
    { label: "Automations created", value: String(workflows.length), icon: ListChecks },
    { label: "Executions run", value: String(executions.length), icon: Zap },
    { label: "Success rate", value: successRate, icon: CheckCircle2 },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: DAYS }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (DAYS - 1 - i));
    return { date, count: 0 };
  });
  for (const e of executions) {
    if (!e.started_at) continue;
    const started = new Date(e.started_at);
    started.setHours(0, 0, 0, 0);
    const bucket = buckets.find((b) => b.date.getTime() === started.getTime());
    if (bucket) bucket.count += 1;
  }
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));

  const byAction = ACTIONS.map((action) => {
    const count = executions.filter((e) => e.action_type === action.type).length;
    const pct = executions.length > 0 ? Math.round((count / executions.length) * 100) : 0;
    return { action, count, pct };
  });

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Analytics"
        subtitle="How much work Dispatch is taking off your team's plate."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted">{s.label}</p>
              <s.icon className="size-4 text-faint" strokeWidth={1.8} />
            </div>
            <p className="mt-2.5 text-[30px] font-semibold tracking-[-0.02em] text-ink">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Executions per day
            </h2>
            <span className="text-xs text-faint">Last {DAYS} days</span>
          </div>
          {executions.length === 0 ? (
            <p className="py-14 text-center text-[13.5px] text-faint">
              No executions yet — run an automation to see activity here.
            </p>
          ) : (
            <>
              <div className="flex h-40 items-end gap-1.5">
                {buckets.map((b, i) => (
                  <div key={i} className="group flex flex-1 flex-col items-center gap-2">
                    <span className="text-[10.5px] font-medium text-faint opacity-0 transition-opacity group-hover:opacity-100">
                      {b.count}
                    </span>
                    <div
                      className={`w-full rounded-t-md transition-colors ${
                        i === buckets.length - 1
                          ? "bg-primary"
                          : "bg-primary/25 group-hover:bg-primary/40"
                      }`}
                      style={{ height: `${(b.count / maxCount) * 100}%`, minHeight: 2 }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-1.5">
                {buckets.map((b, i) => (
                  <span
                    key={i}
                    className="flex-1 text-center text-[9.5px] text-faint"
                  >
                    {i % 3 === 0 ? dayLabel(b.date) : ""}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-6 text-[15px] font-semibold tracking-tight text-ink">
            Runs by automation
          </h2>
          <div className="space-y-4.5">
            {byAction.map(({ action, count, pct }) => (
              <div key={action.type}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <AppIcon app={action.app} size="xs" />
                    {action.label}
                  </span>
                  <span className="text-xs tabular-nums text-faint">{count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.05]">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
