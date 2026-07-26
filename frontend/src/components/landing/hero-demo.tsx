"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Check, ShieldCheck } from "lucide-react";
import { AppIcon, type AppName } from "@/components/app-icon";
import { LogoMark } from "@/components/logo";

type Demo = {
  prompt: string;
  steps: { action: string; app: AppName; duration: string }[];
};

const DEMOS: Demo[] = [
  {
    prompt: "Send follow-up emails to overdue customers.",
    steps: [
      { action: "Find invoices overdue 7+ days", app: "Stripe", duration: "~3s" },
      { action: "Draft personalized reminders (14)", app: "Gmail", duration: "~6s" },
      { action: "Send and log each follow-up", app: "Gmail", duration: "~4s" },
      { action: "Post summary in #finance", app: "Slack", duration: "~1s" },
    ],
  },
  {
    prompt: "Create onboarding documents for our new employee.",
    steps: [
      { action: "Create “Onboarding — T. Okafor” workspace", app: "Notion", duration: "~2s" },
      { action: "Generate 30/60/90 plan from template", app: "Notion", duration: "~4s" },
      { action: "Share docs and send day-one email", app: "Gmail", duration: "~2s" },
      { action: "Introduce new hire in #general", app: "Slack", duration: "~1s" },
    ],
  },
  {
    prompt: "Update HubSpot and notify the sales team.",
    steps: [
      { action: "Move deal “Acme Corp” to Closed won", app: "HubSpot", duration: "~2s" },
      { action: "Update deal value and close date", app: "HubSpot", duration: "~1s" },
      { action: "Notify #sales with deal summary", app: "Slack", duration: "~1s" },
      { action: "Schedule kickoff with the client", app: "Google Calendar", duration: "~2s" },
    ],
  },
];

export function HeroDemo() {
  const [demo, setDemo] = useState(0);
  const [text, setText] = useState("");
  const [shown, setShown] = useState(0);
  const [planVisible, setPlanVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const d = DEMOS[demo];
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    setText("");
    setShown(0);
    setPlanVisible(false);

    (async () => {
      await sleep(500);
      for (let i = 1; i <= d.prompt.length; i++) {
        if (cancelled) return;
        setText(d.prompt.slice(0, i));
        await sleep(26);
      }
      await sleep(500);
      if (cancelled) return;
      setPlanVisible(true);
      await sleep(400);
      for (let s = 1; s <= d.steps.length; s++) {
        if (cancelled) return;
        setShown(s);
        await sleep(380);
      }
      await sleep(3200);
      if (cancelled) return;
      setDemo((demo + 1) % DEMOS.length);
    })();

    return () => {
      cancelled = true;
    };
  }, [demo]);

  const d = DEMOS[demo];

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* soft glow behind the panel */}
      <div className="absolute -inset-x-10 -top-6 bottom-0 rounded-[32px] bg-gradient-to-b from-primary/[0.06] to-transparent blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-pop">
        {/* panel header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2.5">
            <LogoMark className="size-5" />
            <span className="text-[13px] font-medium text-muted">
              New automation
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/[0.07] px-2.5 py-1 text-[11px] font-medium text-primary">
            <ShieldCheck className="size-3" />
            Runs only after your approval
          </span>
        </div>

        {/* prompt input */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-canvas/60 px-4 py-3.5">
            <p className="min-h-[44px] text-left text-[15px] leading-snug text-ink">
              {text}
              <span className="caret-blink ml-px inline-block h-[17px] w-[1.5px] translate-y-[3px] bg-ink" />
            </p>
            <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <ArrowUp className="size-4" />
            </span>
          </div>
        </div>

        {/* execution plan */}
        <div className="min-h-[248px] px-5 pb-5">
          <AnimatePresence mode="wait">
            {planVisible && (
              <motion.div
                key={demo}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-2.5 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold tracking-wide text-faint uppercase">
                    Execution plan
                  </span>
                  <span className="text-xs text-faint">
                    {d.steps.length} actions · est. 12s
                  </span>
                </div>
                <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                  {d.steps.map((s, i) => (
                    <motion.div
                      key={s.action}
                      initial={{ opacity: 0, x: -8 }}
                      animate={
                        i < shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }
                      }
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="flex items-center gap-3 bg-surface px-3.5 py-2.5"
                    >
                      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success/12 text-success">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                      <span className="flex-1 truncate text-left text-[13.5px] font-medium text-ink">
                        {s.action}
                      </span>
                      <span className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
                        <AppIcon app={s.app} size="xs" />
                        {s.app}
                      </span>
                      <span className="w-9 text-right text-xs tabular-nums text-faint">
                        {s.duration}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: shown === d.steps.length ? 1 : 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="mt-3.5 flex items-center justify-end gap-2 px-1"
                >
                  <span className="mr-auto text-xs text-faint">
                    Review each action before anything runs
                  </span>
                  <span className="inline-flex h-8 items-center rounded-lg px-3 text-[13px] font-medium text-muted">
                    Edit
                  </span>
                  <span className="inline-flex h-8 items-center rounded-lg bg-primary px-3.5 text-[13px] font-medium text-white">
                    Approve &amp; Execute
                  </span>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
