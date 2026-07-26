"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";

type Tier = {
  name: string;
  monthly: number | null;
  blurb: string;
  cta: string;
  popular?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    name: "Starter",
    monthly: 29,
    blurb: "For individuals automating their first workflows.",
    cta: "Start Free",
    features: [
      "100 automation runs / month",
      "3 connected apps",
      "Core workflow templates",
      "Execution history (30 days)",
      "Email support",
    ],
  },
  {
    name: "Professional",
    monthly: 79,
    blurb: "For teams running operations on Dispatch every day.",
    cta: "Start Free",
    popular: true,
    features: [
      "1,000 automation runs / month",
      "Unlimited connected apps",
      "Scheduled workflows",
      "Custom templates",
      "Smart suggestions",
      "Priority support",
    ],
  },
  {
    name: "Business",
    monthly: 199,
    blurb: "For companies that need control and visibility.",
    cta: "Start Free",
    features: [
      "5,000 automation runs / month",
      "Roles & approval policies",
      "Full audit log",
      "Advanced analytics",
      "SAML SSO",
      "Slack Connect support",
    ],
  },
  {
    name: "Enterprise",
    monthly: null,
    blurb: "For organizations with custom security and scale needs.",
    cta: "Book a Demo",
    features: [
      "Unlimited runs",
      "Custom integrations",
      "Dedicated environment",
      "Security review & DPA",
      "99.9% uptime SLA",
      "Dedicated success manager",
    ],
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <div>
      {/* toggle */}
      <div className="mb-10 flex items-center justify-center gap-3">
        <div className="flex items-center rounded-full border border-line bg-surface p-1 shadow-[0_1px_2px_rgb(17_17_17/0.04)]">
          {(["Monthly", "Annual"] as const).map((label) => {
            const isAnnual = label === "Annual";
            const active = annual === isAnnual;
            return (
              <button
                key={label}
                onClick={() => setAnnual(isAnnual)}
                className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] font-medium transition-all ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-ink"
                }`}
              >
                {label}
                {isAnnual && (
                  <span
                    className={`ml-1.5 text-[11px] ${active ? "text-white/70" : "text-accent"}`}
                  >
                    −20%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => {
          const price =
            t.monthly === null
              ? null
              : annual
                ? Math.round(t.monthly * 0.8)
                : t.monthly;
          return (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-2xl border bg-surface p-6 ${
                t.popular
                  ? "border-primary/40 shadow-raised ring-1 ring-primary/20"
                  : "border-line shadow-card"
              }`}
            >
              {t.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-[15px] font-semibold text-ink">{t.name}</h3>
              <p className="mt-1.5 min-h-10 text-[13px] leading-snug text-muted">
                {t.blurb}
              </p>
              <div className="mt-5 flex items-baseline gap-1.5">
                {price === null ? (
                  <span className="text-3xl font-semibold tracking-tight text-ink">
                    Custom
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-semibold tracking-tight text-ink">
                      ${price}
                    </span>
                    <span className="text-[13px] text-faint">
                      / user / month
                    </span>
                  </>
                )}
              </div>
              {price !== null && (
                <p className="mt-1 text-xs text-faint">
                  {annual ? "Billed annually" : "Billed monthly"}
                </p>
              )}
              <div className="my-5 h-px bg-line" />
              <ul className="mb-6 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-[13px] text-muted"
                  >
                    <Check
                      className="mt-0.5 size-3.5 shrink-0 text-success"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                href="/dashboard"
                variant={t.popular ? "primary" : "secondary"}
                className="w-full"
              >
                {t.cta}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
