"use client";

import { useState } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";
import { Button, Field, Textarea } from "@/components/ui";
import {
  createWorkflow,
  parseRecipients,
  type NormalizedRecipient,
  type RecipientParseResult,
  type Workflow,
} from "@/lib/api";
import { actionFor, type ActionType } from "./action-registry";

export function ActionForm({
  actionType,
  onBack,
  onCreated,
}: {
  actionType: ActionType;
  onBack: () => void;
  onCreated: (workflow: Workflow, params: Record<string, unknown>) => void;
}) {
  const action = actionFor(actionType);
  const [values, setValues] = useState<Record<string, string>>({});
  const [recipients, setRecipients] = useState<NormalizedRecipient[]>([]);
  const [parseResult, setParseResult] = useState<RecipientParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecipientFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file after a failed parse
    if (!file) return;
    setError(null);
    setParsing(true);
    try {
      const result = await parseRecipients(file);
      setParseResult(result);
      setRecipients(result.recipients);
    } catch (err) {
      setParseResult(null);
      setRecipients([]);
      setError(err instanceof Error ? err.message : "Couldn't read that file.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (actionType === "send_bulk_email" && recipients.length === 0) {
      setError("Upload a recipient list first.");
      return;
    }

    setLoading(true);
    try {
      let params: Record<string, unknown>;
      if (actionType === "send_bulk_email") {
        params = {
          recipients: recipients.map((r) => ({ email: r.email, ...r.variables })),
          subject: values.subject ?? "",
          body: values.body ?? "",
        };
      } else if (actionType === "create_calendar_event" && values.start_time) {
        params = { ...values, start_time: new Date(values.start_time).toISOString() };
      } else {
        params = values;
      }
      const workflow = await createWorkflow(actionType, params);
      onCreated(workflow, params);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3.5 rounded-xl border border-line bg-surface p-4"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" />
        Choose a different action
      </button>
      {action.fields.map((field) => {
        if (field.kind === "recipients") {
          return (
            <div key={field.name} className="space-y-2">
              <span className="block text-[13px] font-medium text-ink">{field.label}</span>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-canvas/40 px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.03]">
                <Upload className="size-4 text-muted" />
                <span className="text-[13px] text-muted">
                  {parsing ? "Reading file…" : "Upload a CSV or XLSX file"}
                </span>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={handleRecipientFile}
                  disabled={parsing}
                />
              </label>
              {parseResult && (
                <div className="rounded-lg border border-line bg-canvas/60 px-3 py-2 text-[12.5px] leading-relaxed text-muted">
                  <span className="font-medium text-ink">{parseResult.valid_count}</span>{" "}
                  recipient{parseResult.valid_count === 1 ? "" : "s"} ready to send
                  {parseResult.issue_count > 0 && (
                    <span className="text-danger">
                      {" "}
                      · {parseResult.issue_count} row{parseResult.issue_count === 1 ? "" : "s"}{" "}
                      skipped ({parseResult.issues[0]?.reason}
                      {parseResult.issue_count > 1 ? ", …" : ""})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        }
        if (field.kind === "textarea") {
          return (
            <label key={field.name} className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-ink">
                {field.label}
              </span>
              <Textarea
                required
                value={values[field.name] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
              />
            </label>
          );
        }
        return (
          <Field
            key={field.name}
            label={field.label}
            type={field.kind}
            placeholder={field.placeholder}
            required
            value={values[field.name] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
          />
        );
      })}
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading || parsing}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Generate plan
      </Button>
    </form>
  );
}
