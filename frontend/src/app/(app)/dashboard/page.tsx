import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Zap,
  Sparkles,
  CalendarClock,
  Plus,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Button, Card, StatusDot } from "@/components/ui";
import { AppIcon, AppStack } from "@/components/app-icon";
import { ALL_APPS, EXECUTIONS, SCHEDULED, SUGGESTIONS } from "@/lib/data";

const STATS = [
  {
    label: "Hours saved",
    value: "128.5",
    delta: "+14% this month",
    icon: Clock,
  },
  {
    label: "Tasks automated",
    value: "1,284",
    delta: "+212 this month",
    icon: Zap,
  },
  {
    label: "Success rate",
    value: "98.6%",
    delta: "+0.4 pts",
    icon: CheckCircle2,
  },
];

function statusTone(status: string) {
  if (status === "Completed") return "success" as const;
  if (status === "Failed") return "danger" as const;
  if (status === "Running") return "primary" as const;
  return "accent" as const;
}

export default function DashboardPage() {
  const connected = ALL_APPS.filter((a) => a.connected);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Good afternoon, Amara"
        subtitle="Saturday, July 18 · Here's what Dispatch has been up to."
        actions={
          <Button href="/automations">
            <Plus className="size-4" />
            New automation
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {STATS.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted">{s.label}</p>
              <s.icon className="size-4 text-faint" strokeWidth={1.8} />
            </div>
            <p className="mt-2.5 text-[30px] font-semibold tracking-[-0.02em] text-ink">
              {s.value}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-success">
              <ArrowUpRight className="size-3.5" />
              {s.delta}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Recent executions */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Recent executions
            </h2>
            <Link
              href="/history"
              className="flex items-center gap-1 text-[13px] font-medium text-muted transition-colors hover:text-ink"
            >
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-line/70">
            {EXECUTIONS.slice(0, 6).map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-canvas/50"
              >
                <StatusDot
                  tone={
                    e.status === "Completed"
                      ? "success"
                      : e.status === "Failed"
                        ? "danger"
                        : "accent"
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ink">
                    {e.name}
                  </p>
                  <p className="mt-0.5 text-xs text-faint">
                    {e.when} · {e.steps} steps · {e.origin}
                  </p>
                </div>
                <AppStack apps={e.apps.slice(0, 4)} size="xs" />
                <Badge tone={statusTone(e.status)}>{e.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-5">
          {/* Connected apps */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                Connected apps
              </h2>
              <Link
                href="/integrations"
                className="text-[13px] font-medium text-muted transition-colors hover:text-ink"
              >
                Manage
              </Link>
            </div>
            <div className="flex flex-wrap gap-2">
              {connected.map((a) => (
                <AppIcon key={a.app} app={a.app} size="md" />
              ))}
              <Link
                href="/integrations"
                className="inline-flex size-8 items-center justify-center rounded-lg border border-dashed border-line text-faint transition-colors hover:border-faint hover:text-muted"
              >
                <Plus className="size-4" />
              </Link>
            </div>
            <p className="mt-3.5 text-xs text-faint">
              {connected.length} of {ALL_APPS.length} available apps connected
            </p>
          </Card>

          {/* Scheduled */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="size-4 text-faint" strokeWidth={1.8} />
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                Upcoming scheduled
              </h2>
            </div>
            <div className="space-y-3.5">
              {SCHEDULED.map((s) => (
                <div key={s.name} className="flex items-start gap-3">
                  <AppStack apps={s.apps} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {s.name}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">{s.next}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Suggestions */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-4 text-accent" strokeWidth={1.8} />
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">
                Smart suggestions
              </h2>
            </div>
            <div className="space-y-4">
              {SUGGESTIONS.map((s) => (
                <div key={s.text}>
                  <p className="text-[13px] leading-relaxed text-muted">
                    {s.text}
                  </p>
                  <button className="mt-1.5 cursor-pointer text-[13px] font-medium text-primary hover:text-primary-hover">
                    {s.action} →
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
