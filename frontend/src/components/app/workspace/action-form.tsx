"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button, Field, Textarea } from "@/components/ui";
import { createWorkflow, type Workflow } from "@/lib/api";
import { actionFor, type ActionType } from "./action-registry";

export function ActionForm({
  actionType,
  onBack,
  onCreated,
}: {
  actionType: ActionType;
  onBack: () => void;
  onCreated: (workflow: Workflow, params: Record<string, string>) => void;
}) {
  const action = actionFor(actionType);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const params =
        actionType === "create_calendar_event" && values.start_time
          ? { ...values, start_time: new Date(values.start_time).toISOString() }
          : values;
      const workflow = await createWorkflow(actionType, params);
      onCreated(workflow, values);
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
      {action.fields.map((field) =>
        field.kind === "textarea" ? (
          <label key={field.name} className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-ink">{field.label}</span>
            <Textarea
              required
              value={values[field.name] ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.name]: e.target.value }))
              }
            />
          </label>
        ) : (
          <Field
            key={field.name}
            label={field.label}
            type={field.kind}
            placeholder={field.placeholder}
            required
            value={values[field.name] ?? ""}
            onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
          />
        ),
      )}
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Generate plan
      </Button>
    </form>
  );
}
