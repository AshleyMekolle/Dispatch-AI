import Link from "next/link";
import { ArrowRight, CheckCircle2, ListChecks, Plus, Zap } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ACTIONS } from "@/components/app/workspace/action-registry";
import { Badge, Button, Card, StatusDot } from "@/components/ui";
import { AppIcon } from "@/components/app-icon";
import { getExecutionsServer, getWorkflowsServer } from "@/lib/server-api";
import { getSession } from "@/lib/session";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
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

function statusTone(status: string) {
  if (status === "SUCCESS") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  if (status === "RUNNING") return "primary" as const;
  return "accent" as const;
}

export default async function DashboardPage() {
  const [session, workflows, executions] = await Promise.all([
    getSession(),
    getWorkflowsServer(),
    getExecutionsServer(),
  ]);

  const firstName = session?.fullName.split(" ")[0] ?? "there";
  const now = new Date();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const succeeded = executions.filter((e) => e.status === "SUCCESS").length;
  const successRate =
    executions.length > 0 ? `${Math.round((succeeded / executions.length) * 100)}%` : "—";

  const stats = [
    { label: "Automations created", value: String(workflows.length), icon: ListChecks },
    { label: "Executions run", value: String(executions.length), icon: Zap },
    { label: "Success rate", value: successRate, icon: CheckCircle2 },
  ];

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title={`${greeting(now.getHours())}, ${firstName}`}
        subtitle={`${dateLabel} · Here's what Dispatch has been up to.`}
        actions={
          <Button href="/automations">
            <Plus className="size-4" />
            New automation
          </Button>
        }
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

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Recent executions
            </h2>
            <Link
              href="/automations"
              className="flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              New
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {executions.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13.5px] text-faint">
              No executions yet — create your first automation to see it here.
            </p>
          ) : (
            <div className="divide-y divide-line/70">
              {executions.slice(0, 6).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/50"
                >
                  <StatusDot tone={statusTone(e.status)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink">
                      {e.workflow_title}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {formatWhen(e.started_at ?? e.completed_at)}
                    </p>
                  </div>
                  <Badge tone={statusTone(e.status)}>{e.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                Supported apps
              </h2>
              <Link
                href="/integrations"
                className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
              >
                View
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => (
                <AppIcon key={a.type} app={a.app} size="md" />
              ))}
            </div>
            <p className="mt-3.5 text-xs text-faint">
              Real connections are coming soon — automations run in simulated mode for now.
            </p>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ListChecks className="size-4 text-faint" strokeWidth={1.8} />
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                Recent automations
              </h2>
            </div>
            {workflows.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-faint">
                Nothing created yet — start one from the button above.
              </p>
            ) : (
              <div className="space-y-3.5">
                {workflows.slice(0, 4).map((w) => {
                  const action = ACTIONS.find((a) => a.type === w.action_type);
                  return (
                    <div key={w.id} className="flex items-start gap-3">
                      {action && <AppIcon app={action.app} size="xs" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-ink">{w.title}</p>
                        <p className="mt-0.5 text-xs text-faint">
                          {w.status === "APPROVED" ? "Approved" : "Draft"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
