import { Fragment } from "react";
import Link from "next/link";
import {
  MessageSquareText,
  ListChecks,
  ShieldCheck,
  Activity,
  History,
  LayoutTemplate,
  Blocks,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Nav } from "@/components/landing/nav";
import { HeroDemo } from "@/components/landing/hero-demo";
import { TimelineMock } from "@/components/landing/timeline-mock";
import { Pricing } from "@/components/landing/pricing";
import { Button } from "@/components/ui";
import { AppIcon } from "@/components/app-icon";
import { Logo } from "@/components/logo";
import { ACTIONS } from "@/components/app/workspace/action-registry";
import { ALL_APPS } from "@/lib/data";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "Natural language automation",
    text: "Describe the work in plain English. No drag-and-drop builders, no flowcharts, no training.",
  },
  {
    icon: ShieldCheck,
    title: "Approval before execution",
    text: "Nothing runs until you say so. Review, edit, or remove any step before it touches your tools.",
  },
  {
    icon: ListChecks,
    title: "AI execution preview",
    text: "Dispatch turns your request into a precise plan — every action, app, and estimated duration.",
  },
  {
    icon: Activity,
    title: "Execution timeline",
    text: "Watch each action complete in real time, with live status for every connected app.",
  },
  {
    icon: History,
    title: "Automation history",
    text: "A complete, searchable record of everything Dispatch has done — who, what, when, and where.",
  },
  {
    icon: LayoutTemplate,
    title: "Reusable templates",
    text: "Turn any workflow into a template your whole team can run with a single sentence.",
  },
  {
    icon: Blocks,
    title: "Connected business apps",
    text: "Gmail, Slack, HubSpot, Notion, Stripe, and more — one assistant across your whole stack.",
  },
  {
    icon: Sparkles,
    title: "Smart suggestions",
    text: "Dispatch notices repetitive work and quietly suggests automations you can approve in one click.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: MessageSquareText,
    title: "Describe",
    text: "Type what you need done, the way you'd tell a capable colleague. Dispatch understands your apps, your data, and your intent.",
  },
  {
    n: "02",
    icon: ListChecks,
    title: "Review",
    text: "Dispatch generates a step-by-step execution plan. Check every action, edit anything, and approve when it's right.",
  },
  {
    n: "03",
    icon: Zap,
    title: "Execute",
    text: "Dispatch carries out the work across your connected apps and shows you a live timeline as each step completes.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />

      {/* ————— Hero ————— */}
      <section
        className="relative overflow-hidden pt-36 pb-24"
        style={{
          backgroundImage:
            "radial-gradient(1100px 480px at 50% -120px, rgba(31,77,58,0.08), transparent 70%)",
        }}
      >
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-[13px] font-medium text-muted shadow-[0_1px_2px_rgb(17_17_17/0.04)]">
            <span className="size-1.5 rounded-full bg-success" />
            Your AI Operations Assistant
          </div>
          <h1 className="mx-auto max-w-3xl text-[44px] leading-[1.06] font-semibold tracking-[-0.03em] text-ink md:text-[64px]">
            Automate repetitive business work using plain English.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Describe what you want done. Dispatch coordinates your business
            apps and completes the work in seconds.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Button href="/signup" size="lg">
              Start Free
              <ArrowRight className="size-4" />
            </Button>
            <Button href="#pricing" variant="secondary" size="lg">
              Book a Demo
            </Button>
          </div>
          <p className="mt-4 text-[13px] text-faint">
            Free 14-day trial · No credit card required
          </p>

          <div className="mt-16">
            <HeroDemo />
          </div>
        </div>
      </section>

      {/* ————— How it works ————— */}
      <section id="product" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
              How it works
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink md:text-[40px] md:leading-tight">
              From sentence to finished work in three steps
            </h2>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-stretch md:gap-4">
            {STEPS.map((s, i) => (
              <Fragment key={s.n}>
                <div className="flex-1 rounded-2xl border border-line bg-surface p-7 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                      <s.icon className="size-[18px]" strokeWidth={1.8} />
                    </span>
                    <span className="text-[13px] font-semibold tracking-wide text-accent">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                    {s.text}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden shrink-0 items-center justify-center text-line md:flex">
                    <ArrowRight className="size-5" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Timeline split ————— */}
      <section className="border-y border-line/70 bg-surface/60 py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
              Execution you can watch
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink md:text-[36px] md:leading-tight">
              Every action, visible. Nothing runs without your approval.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
              Dispatch is built for work you can trust. Each workflow shows its
              plan before it runs, executes step by step on a live timeline,
              and records everything in a permanent history.
            </p>
            <ul className="mt-7 space-y-4">
              {[
                "Review and edit the plan before anything executes",
                "Live status for every action across every app",
                "Complete audit trail your whole team can see",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-success/10">
                    <span className="size-1.5 rounded-full bg-success" />
                  </span>
                  <span className="text-[15px] text-ink">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <TimelineMock />
        </div>
      </section>

      {/* ————— Features grid ————— */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
              Platform
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink md:text-[40px] md:leading-tight">
              Everything an operations team needs
            </h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {FEATURES.slice(0, 2).map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-line bg-surface p-8 shadow-card transition-shadow hover:shadow-raised"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/[0.07] text-primary">
                  <f.icon className="size-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-muted">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.slice(2).map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/[0.07] text-primary">
                  <f.icon className="size-[18px]" strokeWidth={1.8} />
                </span>
                <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Integrations ————— */}
      <section
        id="integrations"
        className="border-y border-line/70 bg-surface/60 py-24"
      >
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
              Integrations
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink md:text-[40px] md:leading-tight">
              One assistant across your whole stack
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15.5px] text-muted">
              Dispatch connects to the tools your team already lives in — and
              coordinates them like one system.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {ALL_APPS.map((a) => (
              <div
                key={a.app}
                className="flex items-center gap-3.5 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgb(17_17_17/0.03)]"
              >
                <AppIcon app={a.app} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {a.app}
                  </p>
                  <p className="truncate text-xs text-faint">{a.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Templates ————— */}
      <section id="templates" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
                Templates
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink md:text-[40px] md:leading-tight">
                Start from workflows that already work
              </h2>
            </div>
            <Button href="/templates" variant="secondary">
              Browse all templates
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {ACTIONS.map((action) => (
              <div
                key={action.type}
                className="rounded-2xl border border-line bg-surface p-6 shadow-card transition-shadow hover:shadow-raised"
              >
                <div className="mb-4 flex items-center justify-between">
                  <AppIcon app={action.app} size="lg" />
                  <span className="text-xs text-faint">{action.app}</span>
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                  {action.label}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
                  {action.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Pricing ————— */}
      <section id="pricing" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-[13px] font-semibold tracking-[0.12em] text-primary uppercase">
              Pricing
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-ink md:text-[40px] md:leading-tight">
              Simple pricing that scales with your team
            </h2>
          </div>
          <Pricing />
        </div>
      </section>

      {/* ————— CTA band ————— */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-pop md:py-20">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-white md:text-[40px] md:leading-tight">
            Put your operations on autopilot.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15.5px] text-white/70">
            Join the teams saving hundreds of hours a month with plain-English
            automation.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-[15px] font-medium text-primary transition-colors hover:bg-white/90"
            >
              Start Free
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex h-11 items-center rounded-lg border border-white/25 px-5 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ————— Footer ————— */}
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="md:col-span-2 md:max-w-sm">
              <Logo />
              <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
                The AI operations assistant for teams who&apos;d rather
                describe the work than do it twice.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-10">
              {[
                {
                  title: "Product",
                  links: [
                    { label: "How it works", href: "#product" },
                    { label: "Integrations", href: "#integrations" },
                    { label: "Templates", href: "#templates" },
                    { label: "Pricing", href: "#pricing" },
                  ],
                },
                {
                  title: "Legal",
                  links: [
                    { label: "Privacy", href: "#" },
                    { label: "Terms", href: "#" },
                  ],
                },
              ].map((col) => (
                <div key={col.title}>
                  <p className="mb-4 text-[13px] font-semibold text-ink">
                    {col.title}
                  </p>
                  <ul className="space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          className="text-[13.5px] text-muted transition-colors hover:text-ink"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-14 border-t border-line pt-7">
            <p className="text-[13px] text-faint">
              © 2026 Dispatch Labs, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
