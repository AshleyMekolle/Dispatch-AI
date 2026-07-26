import { CreditCard, Download } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Button, Card } from "@/components/ui";

const INVOICES = [
  { id: "INV-2026-007", date: "Jul 1, 2026", amount: "$632.00", status: "Paid" },
  { id: "INV-2026-006", date: "Jun 1, 2026", amount: "$632.00", status: "Paid" },
  { id: "INV-2026-005", date: "May 1, 2026", amount: "$553.00", status: "Paid" },
  { id: "INV-2026-004", date: "Apr 1, 2026", amount: "$553.00", status: "Paid" },
];

export default function BillingPage() {
  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <PageHeader
        title="Billing"
        subtitle="Manage your plan, usage, and invoices."
      />

      <div className="grid gap-5 md:grid-cols-2">
        {/* Plan */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Current plan
            </h2>
            <Badge tone="primary">Professional</Badge>
          </div>
          <p className="mt-4 text-[28px] font-semibold tracking-[-0.02em] text-ink">
            $63
            <span className="ml-1 text-sm font-normal text-faint">
              / user / month · billed annually
            </span>
          </p>
          <p className="mt-1 text-[13px] text-muted">
            8 seats · Renews August 1, 2026
          </p>
          <div className="mt-5 flex gap-2.5 border-t border-line pt-5">
            <Button variant="secondary" size="sm">
              Change plan
            </Button>
            <Button variant="ghost" size="sm">
              Manage seats
            </Button>
          </div>
        </Card>

        {/* Usage */}
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            Usage this cycle
          </h2>
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-muted">
                Automation runs
              </span>
              <span className="text-[13px] tabular-nums text-ink">
                <span className="font-semibold">642</span>
                <span className="text-faint"> / 1,000</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink/[0.05]">
              <div className="h-full w-[64%] rounded-full bg-primary" />
            </div>
            <p className="mt-2 text-xs text-faint">
              Resets in 14 days. Overage runs are billed at $0.08 each.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-line pt-5">
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-ink/[0.04]">
              <CreditCard className="size-4 text-muted" />
            </span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-ink">
                Visa ending in 4242
              </p>
              <p className="text-xs text-faint">Expires 04/28</p>
            </div>
            <Button variant="ghost" size="sm">
              Update
            </Button>
          </div>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="mt-5 overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            Invoices
          </h2>
        </div>
        <div className="divide-y divide-line/70">
          {INVOICES.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-canvas/50"
            >
              <div className="flex-1">
                <p className="text-[13.5px] font-medium text-ink">{inv.id}</p>
                <p className="text-xs text-faint">{inv.date}</p>
              </div>
              <span className="text-[13.5px] tabular-nums text-ink">
                {inv.amount}
              </span>
              <Badge tone="success">{inv.status}</Badge>
              <button className="cursor-pointer rounded-md p-1.5 text-faint transition-colors hover:bg-ink/[0.04] hover:text-ink">
                <Download className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
