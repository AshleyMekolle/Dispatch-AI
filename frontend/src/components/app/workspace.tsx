"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Check,
  Circle,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { LogoMark } from "@/components/logo";
import { Badge, SearchInput } from "@/components/ui";
import { CONVERSATIONS, ONBOARDING_PLAN, type StepStatus } from "@/lib/data";

const PROMPT =
  "Add John Smith from Acme Corp to HubSpot, create a Google Drive folder, send him a welcome email, notify my sales team in Slack, and schedule a follow-up meeting next Friday.";

type Phase = "review" | "approved" | "running" | "done";

const STEP_DONE_LABELS = [
  "HubSpot contact created",
  "Drive folder created",
  "Welcome email sent",
  "Sales team notified",
  "Follow-up scheduled",
];

export function Workspace() {
  const [phase, setPhase] = useState<Phase>("review");
  const [statuses, setStatuses] = useState<StepStatus[]>(
    ONBOARDING_PLAN.map(() => "pending"),
  );
  const [input, setInput] = useState("");
  const runningRef = useRef(false);

  const execute = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setPhase("running");
    (async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < ONBOARDING_PLAN.length; i++) {
        setStatuses((prev) => prev.map((s, j) => (j === i ? "running" : s)));
        await sleep(650 + Math.random() * 750);
        setStatuses((prev) => prev.map((s, j) => (j === i ? "done" : s)));
      }
      await sleep(350);
      setPhase("done");
      runningRef.current = false;
    })();
  };

  const reset = () => {
    if (runningRef.current) return;
    setPhase("review");
    setStatuses(ONBOARDING_PLAN.map(() => "pending"));
  };

  const doneCount = statuses.filter((s) => s === "done").length;
  const progress = (doneCount / ONBOARDING_PLAN.length) * 100;

  return (
    <div className="flex h-full">
      {/* ————— Conversations ————— */}
      <div className="flex w-64 shrink-0 flex-col border-r border-line bg-canvas">
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            Automations
          </h2>
          <button
            onClick={reset}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-muted shadow-[0_1px_2px_rgb(17_17_17/0.04)] transition-colors hover:text-ink"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <div className="px-3 pb-3">
          <SearchInput inputSize="sm" placeholder="Search…" />
        </div>
        <div className="quiet-scroll flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {CONVERSATIONS.map((c) => (
            <button
              key={c.title}
              className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left transition-colors ${
                c.active
                  ? "bg-surface shadow-[0_1px_2px_rgb(17_17_17/0.05)] ring-1 ring-line"
                  : "hover:bg-ink/[0.04]"
              }`}
            >
              <span
                className={`block truncate text-[13px] font-medium ${c.active ? "text-ink" : "text-muted"}`}
              >
                {c.title}
              </span>
              <span className="mt-0.5 block text-[11.5px] text-faint">
                {c.when}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ————— Conversation thread ————— */}
      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-6">
          <div className="flex items-center gap-2.5">
            <p className="text-sm font-semibold tracking-tight text-ink">
              Onboard John Smith — Acme Corp
            </p>
            <Badge tone="neutral">EX-1042</Badge>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-faint">
            <ShieldCheck className="size-3.5" />
            Approval required before execution
          </span>
        </div>

        <div className="quiet-scroll flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-xl space-y-6">
            {/* user message */}
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-[14px] leading-relaxed text-white shadow-[0_1px_2px_rgb(17_17_17/0.1)]">
                {PROMPT}
              </div>
            </div>

            {/* assistant message */}
            <div className="flex items-start gap-3">
              <LogoMark className="mt-0.5 size-7" />
              <div className="max-w-[85%] space-y-3">
                <div className="rounded-2xl rounded-tl-md border border-line bg-canvas/70 px-4 py-3 text-[14px] leading-relaxed text-ink">
                  I&apos;ve prepared an execution plan with{" "}
                  <span className="font-semibold">5 actions</span> across
                  HubSpot, Google Drive, Gmail, Slack, and Google Calendar.
                  Review each step in the panel on the right — nothing runs
                  until you approve.
                </div>
                <div className="flex items-center gap-2 px-1 text-xs text-faint">
                  <Sparkles className="size-3.5 text-accent" />
                  Estimated total time: ~10 seconds
                </div>
              </div>
            </div>

            {/* completion message */}
            <AnimatePresence>
              {phase === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3"
                >
                  <LogoMark className="mt-0.5 size-7" />
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-success/25 bg-success/[0.06] px-4 py-3 text-[14px] leading-relaxed text-ink">
                    <span className="font-semibold text-success">
                      All 5 actions completed successfully.
                    </span>{" "}
                    John Smith is in HubSpot, his folder is ready, the welcome
                    email is sent, #sales has been briefed, and the kickoff is
                    on the calendar for Friday at 10:00 AM.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* input */}
        <div className="shrink-0 border-t border-line bg-surface px-6 py-4">
          <div className="mx-auto max-w-xl">
            <div className="flex items-end gap-3 rounded-xl border border-line bg-canvas/60 px-4 py-3 transition-shadow focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgb(31_77_58/0.08)]">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you want done…"
                className="max-h-32 flex-1 resize-none bg-transparent text-[14px] leading-relaxed text-ink outline-none placeholder:text-faint"
              />
              <button
                className={`inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors ${
                  input.trim()
                    ? "bg-primary text-white hover:bg-primary-hover"
                    : "bg-ink/[0.06] text-faint"
                }`}
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11.5px] text-faint">
              Dispatch will always show you the plan before executing anything.
            </p>
          </div>
        </div>
      </div>

      {/* ————— Execution preview ————— */}
      <div className="flex w-[380px] shrink-0 flex-col border-l border-line bg-canvas">
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            {phase === "running" || phase === "done"
              ? "Execution timeline"
              : "Execution preview"}
          </h3>
          {phase === "review" && <Badge tone="pending">Awaiting approval</Badge>}
          {phase === "approved" && <Badge tone="accent">Approved</Badge>}
          {phase === "running" && (
            <Badge tone="primary">
              <Loader2 className="size-3 animate-spin" />
              Running
            </Badge>
          )}
          {phase === "done" && (
            <Badge tone="success">
              <Check className="size-3" strokeWidth={3} />
              Completed
            </Badge>
          )}
        </div>

        {/* progress bar while running */}
        <div className="h-0.5 w-full bg-line/60">
          <motion.div
            className={`h-full ${phase === "done" ? "bg-success" : "bg-primary"}`}
            animate={{ width: `${phase === "review" || phase === "approved" ? 0 : progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="quiet-scroll flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {ONBOARDING_PLAN.map((step, i) => {
              const st = statuses[i];
              return (
                <motion.div
                  key={step.action}
                  layout
                  className={`rounded-xl border bg-surface p-3.5 transition-colors ${
                    st === "running"
                      ? "border-primary/40 shadow-[0_0_0_3px_rgb(31_77_58/0.07)]"
                      : st === "done"
                        ? "border-line"
                        : "border-line"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5">
                      {st === "pending" && (
                        <Circle className="size-[18px] text-line" strokeWidth={2} />
                      )}
                      {st === "running" && (
                        <Loader2 className="size-[18px] animate-spin text-primary" />
                      )}
                      {st === "done" && (
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          className="inline-flex size-[18px] items-center justify-center rounded-full bg-success text-white"
                        >
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </motion.span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-ink">
                        {st === "done" &&
                        (phase === "running" || phase === "done")
                          ? STEP_DONE_LABELS[i]
                          : step.action}
                      </p>
                      <p className="mt-0.5 truncate text-xs leading-relaxed text-faint">
                        {step.detail}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
                          <AppIcon app={step.app} size="xs" />
                          {step.app}
                        </span>
                        <span className="text-[11px] tabular-nums text-faint">
                          {st === "done" ? "✓ " + step.duration.replace("~", "") : step.duration}
                        </span>
                      </div>
                    </div>
                    {phase === "review" && (
                      <button className="cursor-pointer rounded-md p-1 text-faint transition-colors hover:bg-ink/[0.04] hover:text-muted">
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* actions */}
        <div className="shrink-0 border-t border-line bg-canvas p-4">
          {phase === "review" && (
            <div className="space-y-2.5">
              <button
                onClick={() => setPhase("approved")}
                className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition-colors hover:bg-primary-hover"
              >
                <ShieldCheck className="size-4" />
                Approve plan
              </button>
              <div className="flex gap-2.5">
                <button className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-line bg-surface text-[13px] font-medium text-ink transition-colors hover:bg-canvas">
                  <Pencil className="size-3.5" />
                  Edit
                </button>
                <button className="flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-[13px] font-medium text-muted transition-colors hover:bg-ink/[0.04] hover:text-danger">
                  <X className="size-3.5" />
                  Cancel
                </button>
              </div>
            </div>
          )}
          {phase === "approved" && (
            <div className="space-y-2.5">
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={execute}
                className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition-colors hover:bg-primary-hover"
              >
                Execute 5 actions
              </motion.button>
              <button
                onClick={reset}
                className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-[13px] font-medium text-muted transition-colors hover:bg-ink/[0.04]"
              >
                Back to review
              </button>
            </div>
          )}
          {phase === "running" && (
            <div className="flex h-10 items-center justify-center gap-2.5 rounded-lg border border-line bg-surface text-sm text-muted">
              <Loader2 className="size-4 animate-spin text-primary" />
              Executing step {Math.min(doneCount + 1, 5)} of 5…
            </div>
          )}
          {phase === "done" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-center gap-2 rounded-lg border border-success/25 bg-success/[0.07] py-2.5 text-[13px] font-medium text-success">
                <Check className="size-4" strokeWidth={2.5} />
                Completed in 11s · 5 of 5 actions
              </div>
              <div className="flex gap-2.5">
                <button className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-[13px] font-medium text-ink transition-colors hover:bg-canvas">
                  Save as template
                </button>
                <button
                  onClick={reset}
                  className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg text-[13px] font-medium text-muted transition-colors hover:bg-ink/[0.04]"
                >
                  Run again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
