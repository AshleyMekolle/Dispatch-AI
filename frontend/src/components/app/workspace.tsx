"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { approveWorkflow, executeWorkflow, type Execution, type Workflow } from "@/lib/api";
import { ActionForm } from "./workspace/action-form";
import { ACTIONS, actionFor, type ActionType } from "./workspace/action-registry";
import { ActionPicker } from "./workspace/action-picker";
import {
  ExecutionPanel,
  summarizeStepResult,
  type Phase,
  type UiStepStatus,
} from "./workspace/execution-panel";
import { GlowOrb } from "./workspace/glow-orb";
import { PromptBar } from "./workspace/prompt-bar";
import { TypewriterHeadline } from "./workspace/typewriter-headline";

export function Workspace() {
  const [phase, setPhase] = useState<Phase>("picker");
  const [selectedActionType, setSelectedActionType] = useState<ActionType | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [formValues, setFormValues] = useState<Record<string, unknown> | null>(null);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [stepStatuses, setStepStatuses] = useState<UiStepStatus[]>([]);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const requested = searchParams.get("action");
    if (requested && ACTIONS.some((a) => a.type === requested)) {
      setSelectedActionType(requested as ActionType);
      setPhase("form");
    }
  }, [searchParams]);

  function reset() {
    if (runningRef.current) return;
    setPhase("picker");
    setSelectedActionType(null);
    setWorkflow(null);
    setFormValues(null);
    setExecution(null);
    setStepStatuses([]);
    setError(null);
  }

  function handlePick(type: ActionType) {
    setSelectedActionType(type);
    setPhase("form");
  }

  function handleCreated(created: Workflow, values: Record<string, unknown>) {
    setWorkflow(created);
    setFormValues(values);
    setStepStatuses(created.steps.map(() => "pending"));
    setPhase("review");
    setError(null);
  }

  async function handleApprove() {
    if (!workflow) return;
    setApproving(true);
    setError(null);
    try {
      const approved = await approveWorkflow(workflow.id);
      setWorkflow(approved);
      setPhase("approved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't approve this plan.");
    } finally {
      setApproving(false);
    }
  }

  async function handleExecute() {
    if (!workflow || runningRef.current) return;
    runningRef.current = true;
    setPhase("running");
    setStepStatuses(workflow.steps.map(() => "pending"));
    setError(null);
    try {
      const result = await executeWorkflow(workflow.id);
      setExecution(result);
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < result.steps.length; i++) {
        setStepStatuses((prev) => prev.map((s, j) => (j === i ? "running" : s)));
        await sleep(400 + Math.random() * 400);
        // Reflect what actually happened (a Gmail send can genuinely fail),
        // not an assumed success — only truly-simulated actions always pass.
        const finalStatus: UiStepStatus = result.steps[i].status === "FAILED" ? "failed" : "done";
        setStepStatuses((prev) => prev.map((s, j) => (j === i ? finalStatus : s)));
      }
      await sleep(200);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Execution failed.");
      setPhase("approved");
    } finally {
      runningRef.current = false;
    }
  }

  const activeAction = selectedActionType ? actionFor(selectedActionType) : null;
  const showUserSummary = workflow !== null;
  const showPlanReadyMessage =
    phase === "review" || phase === "approved" || phase === "running" || phase === "done";

  return (
    <div className="flex h-full">
      {phase === "picker" ? (
        <div className="quiet-scroll flex min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-surface px-6 py-12">
          <GlowOrb />
          <div className="mt-2 max-w-xl text-center">
            <TypewriterHeadline />
          </div>
          <div className="mt-8 w-full max-w-xl">
            <PromptBar />
          </div>
          <div className="mt-12 w-full max-w-2xl">
            <ActionPicker onPick={handlePick} />
          </div>
          {error && (
            <p className="mt-6 rounded-lg bg-danger/10 px-4 py-3 text-[13px] text-danger">
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex min-w-0 flex-1 flex-col bg-surface">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-6">
              <p className="text-sm font-semibold tracking-tight text-ink">
                {workflow ? workflow.title : "New automation"}
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-faint">
                <ShieldCheck className="size-3.5" />
                Approval required before execution
              </span>
            </div>

            <div className="quiet-scroll flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto max-w-xl space-y-6">
                <div className="flex items-start gap-3">
                  <LogoMark className="mt-0.5 size-7" />
                  <div className="max-w-[85%] space-y-3">
                    <div className="rounded-2xl rounded-tl-md border border-line bg-canvas/70 px-4 py-3 text-[14px] leading-relaxed text-ink">
                      {phase === "form" &&
                        activeAction &&
                        `${activeAction.label} — fill in the details below.`}
                      {showPlanReadyMessage &&
                        activeAction &&
                        `I've prepared your plan for "${activeAction.label}." Review it in the panel on the right — nothing runs until you approve.`}
                    </div>
                    {phase === "form" && (
                      <div className="flex items-center gap-2 px-1 text-xs text-faint">
                        <Sparkles className="size-3.5 text-accent" />
                        This becomes a real, persisted automation once submitted.
                      </div>
                    )}
                  </div>
                </div>

                {phase === "form" && selectedActionType && (
                  <div className="pl-10">
                    <ActionForm
                      actionType={selectedActionType}
                      onBack={() => setPhase("picker")}
                      onCreated={handleCreated}
                    />
                  </div>
                )}

                {showUserSummary && activeAction && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-[14px] leading-relaxed text-white shadow-[0_1px_2px_rgb(17_17_17/0.1)]">
                      {activeAction.summarize(formValues ?? workflow?.steps[0]?.params ?? {})}
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {phase === "done" && execution && activeAction && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <LogoMark className="mt-0.5 size-7" />
                      {(() => {
                        const succeeded = execution.steps.filter(
                          (s) => s.status === "SUCCESS",
                        ).length;
                        const failed = execution.steps.length - succeeded;
                        return (
                          <div
                            className={`max-w-[85%] rounded-2xl rounded-tl-md border px-4 py-3 text-[14px] leading-relaxed text-ink ${
                              failed > 0
                                ? "border-danger/25 bg-danger/[0.06]"
                                : "border-success/25 bg-success/[0.06]"
                            }`}
                          >
                            <span
                              className={`font-semibold ${failed > 0 ? "text-danger" : "text-success"}`}
                            >
                              {failed > 0
                                ? `Completed ${succeeded} of ${execution.steps.length} actions — ${failed} failed.`
                                : `Completed ${execution.steps.length} of ${execution.steps.length} actions.`}
                            </span>{" "}
                            {summarizeStepResult(
                              activeAction,
                              workflow?.steps[0]?.params ?? {},
                              execution.steps[0]?.result,
                              execution.steps[0]?.error_message,
                            )}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <p className="rounded-lg bg-danger/10 px-4 py-3 text-[13px] text-danger">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </div>

          <ExecutionPanel
            phase={phase}
            workflow={workflow}
            execution={execution}
            stepStatuses={stepStatuses}
            approving={approving}
            onApprove={handleApprove}
            onExecute={handleExecute}
            onReset={reset}
          />
        </>
      )}
    </div>
  );
}
