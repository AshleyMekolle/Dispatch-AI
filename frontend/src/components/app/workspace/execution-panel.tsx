"use client";

import { motion } from "framer-motion";
import { Check, Circle, Loader2, ShieldCheck, X } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { Badge } from "@/components/ui";
import type { Execution, Workflow } from "@/lib/api";
import { actionFor, type ActionConfig, type ActionType } from "./action-registry";

export type UiStepStatus = "pending" | "running" | "done" | "failed";
export type Phase = "picker" | "form" | "review" | "approved" | "running" | "done";

/** A step's result shape depends on whether it ran for real (Gmail) or was
 * simulated — this reads whichever fields are present instead of assuming
 * every result has a `.message`.
 */
export function summarizeStepResult(
  action: ActionConfig,
  params: Record<string, unknown>,
  result: Record<string, unknown> | null | undefined,
  errorMessage?: string | null,
): string {
  // A step-level error_message (e.g. "No Gmail account is connected") is
  // more actionable than a generic pass/fail count, so it takes priority.
  if (errorMessage) return errorMessage;
  if (!result) return action.summarize(params);
  if (typeof result.message === "string") return result.message;
  if (typeof result.sent === "boolean") {
    return result.sent ? "Sent successfully." : "Failed to send.";
  }
  if (typeof result.total === "number") {
    const succeeded = Number(result.succeeded ?? 0);
    const total = Number(result.total ?? 0);
    const failed = Number(result.failed ?? 0);
    return failed > 0
      ? `${succeeded} of ${total} sent · ${failed} failed`
      : `${succeeded} of ${total} sent successfully.`;
  }
  return action.summarize(params);
}

export function ExecutionPanel({
  phase,
  workflow,
  execution,
  stepStatuses,
  approving,
  onApprove,
  onExecute,
  onReset,
}: {
  phase: Phase;
  workflow: Workflow | null;
  execution: Execution | null;
  stepStatuses: UiStepStatus[];
  approving: boolean;
  onApprove: () => void;
  onExecute: () => void;
  onReset: () => void;
}) {
  const steps = workflow?.steps ?? [];
  const doneCount = stepStatuses.filter((s) => s === "done" || s === "failed").length;
  const failedCount = stepStatuses.filter((s) => s === "failed").length;
  const hasFailure = phase === "done" && failedCount > 0;
  const progress = steps.length ? (doneCount / steps.length) * 100 : 0;

  return (
    <div className="flex w-[380px] shrink-0 flex-col border-l border-line bg-canvas">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-5">
        <h3 className="text-sm font-semibold tracking-tight text-ink">
          {phase === "running" || phase === "done" ? "Execution timeline" : "Execution preview"}
        </h3>
        {phase === "picker" || phase === "form" ? (
          <Badge tone="neutral">Not started</Badge>
        ) : null}
        {phase === "review" && <Badge tone="pending">Awaiting approval</Badge>}
        {phase === "approved" && <Badge tone="accent">Approved</Badge>}
        {phase === "running" && (
          <Badge tone="primary">
            <Loader2 className="size-3 animate-spin" />
            Running
          </Badge>
        )}
        {phase === "done" && hasFailure && (
          <Badge tone="danger">
            <X className="size-3" strokeWidth={3} />
            Failed
          </Badge>
        )}
        {phase === "done" && !hasFailure && (
          <Badge tone="success">
            <Check className="size-3" strokeWidth={3} />
            Completed
          </Badge>
        )}
      </div>

      <div className="h-0.5 w-full bg-line/60">
        <motion.div
          className={`h-full ${hasFailure ? "bg-danger" : phase === "done" ? "bg-success" : "bg-primary"}`}
          animate={{ width: `${phase === "running" || phase === "done" ? progress : 0}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="quiet-scroll flex-1 overflow-y-auto p-4">
        {steps.length === 0 ? (
          <p className="px-1 text-[13px] leading-relaxed text-faint">
            Pick an action and fill in the details to see a plan here.
          </p>
        ) : (
          <div className="space-y-2">
            {steps.map((step, i) => {
              const action = actionFor(step.action_type as ActionType);
              const status = stepStatuses[i] ?? "pending";
              const executionStep = execution?.steps[i];
              return (
                <motion.div
                  key={step.id}
                  layout
                  className={`rounded-xl border bg-surface p-3.5 transition-colors ${
                    status === "running"
                      ? "border-primary/40 shadow-[0_0_0_3px_rgb(31_77_58/0.07)]"
                      : status === "failed"
                        ? "border-danger/30"
                        : "border-line"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5">
                      {status === "pending" && (
                        <Circle className="size-[18px] text-line" strokeWidth={2} />
                      )}
                      {status === "running" && (
                        <Loader2 className="size-[18px] animate-spin text-primary" />
                      )}
                      {status === "done" && (
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          className="inline-flex size-[18px] items-center justify-center rounded-full bg-success text-white"
                        >
                          <Check className="size-2.5" strokeWidth={3.5} />
                        </motion.span>
                      )}
                      {status === "failed" && (
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                          className="inline-flex size-[18px] items-center justify-center rounded-full bg-danger text-white"
                        >
                          <X className="size-2.5" strokeWidth={3.5} />
                        </motion.span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium text-ink">{action.label}</p>
                      <p
                        className={`mt-0.5 text-xs leading-relaxed ${
                          status === "failed" ? "text-danger" : "truncate text-faint"
                        }`}
                      >
                        {status === "done" || status === "failed"
                          ? summarizeStepResult(
                              action,
                              step.params,
                              executionStep?.result,
                              executionStep?.error_message,
                            )
                          : action.summarize(step.params)}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-muted ring-1 ring-line">
                          <AppIcon app={action.app} size="xs" />
                          {action.app}
                        </span>
                        {executionStep?.result?.simulated === true && (
                          <span className="text-[11px] text-faint">Simulated</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-line bg-canvas p-4">
        {phase === "review" && (
          <div className="space-y-2.5">
            <button
              onClick={onApprove}
              disabled={approving}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {approving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              Approve plan
            </button>
            <button
              onClick={onReset}
              className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-[13px] font-medium text-muted transition-colors hover:bg-ink/[0.04]"
            >
              Start over
            </button>
          </div>
        )}
        {phase === "approved" && (
          <div className="space-y-2.5">
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onExecute}
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition-colors hover:bg-primary-hover"
            >
              Execute {steps.length} action{steps.length === 1 ? "" : "s"}
            </motion.button>
            <button
              onClick={onReset}
              className="flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-[13px] font-medium text-muted transition-colors hover:bg-ink/[0.04]"
            >
              Start over
            </button>
          </div>
        )}
        {phase === "running" && (
          <div className="flex h-10 items-center justify-center gap-2.5 rounded-lg border border-line bg-surface text-sm text-muted">
            <Loader2 className="size-4 animate-spin text-primary" />
            Executing step {Math.min(doneCount + 1, steps.length)} of {steps.length}…
          </div>
        )}
        {phase === "done" && (
          <div className="space-y-2.5">
            {hasFailure ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-danger/25 bg-danger/[0.07] py-2.5 text-[13px] font-medium text-danger">
                <X className="size-4" strokeWidth={2.5} />
                {steps.length - failedCount} of {steps.length} succeeded · {failedCount} failed
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-success/25 bg-success/[0.07] py-2.5 text-[13px] font-medium text-success">
                <Check className="size-4" strokeWidth={2.5} />
                Completed · {steps.length} of {steps.length} actions
              </div>
            )}
            <div className="flex gap-2.5">
              <button
                onClick={onExecute}
                className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-[13px] font-medium text-ink transition-colors hover:bg-canvas"
              >
                Run again
              </button>
              <button
                onClick={onReset}
                className="flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg text-[13px] font-medium text-muted transition-colors hover:bg-ink/[0.04]"
              >
                New automation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
