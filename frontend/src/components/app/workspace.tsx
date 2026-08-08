"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Sparkles } from "lucide-react";
import { LogoMark } from "@/components/logo";
import {
  approveWorkflow,
  executeWorkflow,
  getWorkflow,
  listWorkflows,
  type Execution,
  type Workflow,
  type WorkflowSummary,
} from "@/lib/api";
import { ActionForm } from "./workspace/action-form";
import { actionFor, type ActionType } from "./workspace/action-registry";
import { ActionPicker } from "./workspace/action-picker";
import { ConversationList } from "./workspace/conversation-list";
import { ExecutionPanel, type Phase, type UiStepStatus } from "./workspace/execution-panel";
import { PromptBar } from "./workspace/prompt-bar";
import { TypewriterHeadline } from "./workspace/typewriter-headline";

export function Workspace() {
  const [phase, setPhase] = useState<Phase>("picker");
  const [selectedActionType, setSelectedActionType] = useState<ActionType | null>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string> | null>(null);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [stepStatuses, setStepStatuses] = useState<UiStepStatus[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    listWorkflows()
      .then(setWorkflows)
      .catch(() => undefined);
  }, []);

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

  function handleCreated(created: Workflow, values: Record<string, string>) {
    setWorkflow(created);
    setFormValues(values);
    setStepStatuses(created.steps.map(() => "pending"));
    setPhase("review");
    setError(null);
    listWorkflows()
      .then(setWorkflows)
      .catch(() => undefined);
  }

  async function handleSelectConversation(id: string) {
    if (runningRef.current) return;
    try {
      const selected = await getWorkflow(id);
      setWorkflow(selected);
      setFormValues(null);
      setExecution(null);
      const firstStepType = selected.steps[0]?.action_type as ActionType | undefined;
      setSelectedActionType(firstStepType ?? null);
      setStepStatuses(selected.steps.map(() => "pending"));
      setPhase(selected.status === "APPROVED" ? "approved" : "review");
      setError(null);
    } catch {
      setError("Couldn't load that automation.");
    }
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
      for (let i = 0; i < workflow.steps.length; i++) {
        setStepStatuses((prev) => prev.map((s, j) => (j === i ? "running" : s)));
        await sleep(500 + Math.random() * 500);
        setStepStatuses((prev) => prev.map((s, j) => (j === i ? "done" : s)));
      }
      await sleep(250);
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
      <ConversationList
        workflows={workflows}
        activeId={workflow?.id ?? null}
        onSelect={handleSelectConversation}
        onNew={reset}
      />

      {phase === "picker" ? (
        <div className="quiet-scroll flex min-w-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-surface px-6 py-16">
          <LogoMark className="size-11" />
          <div className="mt-6 max-w-xl text-center">
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
                  {phase === "done" && execution && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <LogoMark className="mt-0.5 size-7" />
                      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-success/25 bg-success/[0.06] px-4 py-3 text-[14px] leading-relaxed text-ink">
                        <span className="font-semibold text-success">
                          Completed {execution.steps.length} of {execution.steps.length} actions.
                        </span>{" "}
                        {String(execution.steps[0]?.result?.message ?? "")}
                      </div>
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
