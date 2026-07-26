import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui";
import { AppIcon, type AppName } from "@/components/app-icon";

const WEEKS = [
  { label: "May 4", hours: 14 },
  { label: "May 11", hours: 17 },
  { label: "May 18", hours: 16 },
  { label: "May 25", hours: 21 },
  { label: "Jun 1", hours: 19 },
  { label: "Jun 8", hours: 24 },
  { label: "Jun 15", hours: 22 },
  { label: "Jun 22", hours: 27 },
  { label: "Jun 29", hours: 25 },
  { label: "Jul 6", hours: 30 },
  { label: "Jul 13", hours: 33 },
];

const BY_APP: { app: AppName; runs: number; pct: number }[] = [
  { app: "Gmail", runs: 486, pct: 88 },
  { app: "HubSpot", runs: 342, pct: 62 },
  { app: "Slack", runs: 297, pct: 54 },
  { app: "Google Calendar", runs: 156, pct: 28 },
  { app: "Stripe", runs: 121, pct: 22 },
  { app: "Airtable", runs: 98, pct: 18 },
];

const STATS = [
  { label: "Runs this month", value: "642", delta: "+18%" },
  { label: "Hours saved this month", value: "41.2", delta: "+22%" },
  { label: "Avg. execution time", value: "18s", delta: "−3s" },
  { label: "Success rate", value: "98.6%", delta: "+0.4 pts" },
];

export default function AnalyticsPage() {
  const max = Math.max(...WEEKS.map((w) => w.hours));

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Analytics"
        subtitle="How much work Dispatch is taking off your team's plate."
      />

      <div className="grid gap-4 md:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-[13px] font-medium text-muted">{s.label}</p>
            <p className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-ink">
              {s.value}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-success">
              <ArrowUpRight className="size-3.5" />
              {s.delta} vs. last month
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* Bar chart */}
        <Card className="p-6 lg:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Hours saved per week
            </h2>
            <span className="text-xs text-faint">Last 11 weeks</span>
          </div>
          <div className="flex h-48 items-end gap-2.5">
            {WEEKS.map((w, i) => (
              <div
                key={w.label}
                className="group flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-[10.5px] font-medium text-faint opacity-0 transition-opacity group-hover:opacity-100">
                  {w.hours}h
                </span>
                <div
                  className={`w-full rounded-t-md transition-colors ${
                    i === WEEKS.length - 1
                      ? "bg-primary"
                      : "bg-primary/25 group-hover:bg-primary/40"
                  }`}
                  style={{ height: `${(w.hours / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2.5">
            {WEEKS.map((w, i) => (
              <span
                key={w.label}
                className="flex-1 text-center text-[10px] text-faint"
              >
                {i % 2 === 0 ? w.label : ""}
              </span>
            ))}
          </div>
        </Card>

        {/* By app */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-6 text-[15px] font-semibold tracking-tight text-ink">
            Runs by app
          </h2>
          <div className="space-y-4.5">
            {BY_APP.map((a) => (
              <div key={a.app}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                    <AppIcon app={a.app} size="xs" />
                    {a.app}
                  </span>
                  <span className="text-xs tabular-nums text-faint">
                    {a.runs}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/[0.05]">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${a.pct}%` }}
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
