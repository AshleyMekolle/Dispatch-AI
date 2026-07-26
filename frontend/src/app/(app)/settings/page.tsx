"use client";

import { useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button, Card } from "@/components/ui";

function Field({
  label,
  defaultValue,
  hint,
}: {
  label: string;
  defaultValue: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">
        {label}
      </span>
      <input
        defaultValue={defaultValue}
        className="h-9.5 w-full rounded-lg border border-line bg-surface px-3 text-[13.5px] text-ink shadow-[0_1px_2px_rgb(17_17_17/0.03)] outline-none transition-shadow focus:border-primary/40 focus:shadow-[0_0_0_3px_rgb(31_77_58/0.08)]"
      />
      {hint && <span className="mt-1.5 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

function Toggle({
  label,
  description,
  defaultOn = true,
}: {
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <div>
        <p className="text-[13.5px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 text-[13px] text-muted">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative h-6 w-10.5 shrink-0 cursor-pointer rounded-full transition-colors ${
          on ? "bg-primary" : "bg-ink/[0.12]"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <PageHeader
        title="Settings"
        subtitle="Your profile, workspace, and notification preferences."
      />

      <div className="space-y-5">
        <Card className="p-6">
          <h2 className="mb-5 text-[15px] font-semibold tracking-tight text-ink">
            Profile
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" defaultValue="Amara Cole" />
            <Field label="Role" defaultValue="Operations Lead" />
            <div className="sm:col-span-2">
              <Field
                label="Email"
                defaultValue="amara@halcyon.co"
                hint="Used for sign-in and execution notifications."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-[15px] font-semibold tracking-tight text-ink">
            Workspace
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Workspace name" defaultValue="Halcyon Partners" />
            <Field label="Timezone" defaultValue="(GMT−05:00) Eastern Time" />
          </div>
          <div className="mt-5 border-t border-line pt-2">
            <Toggle
              label="Require approval for all executions"
              description="Workflows can never run without a human sign-off."
            />
            <Toggle
              label="Allow members to create templates"
              description="Anyone in the workspace can save workflows as templates."
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 text-[15px] font-semibold tracking-tight text-ink">
            Notifications
          </h2>
          <div className="divide-y divide-line/70">
            <Toggle
              label="Execution failures"
              description="Get notified immediately when a workflow fails."
            />
            <Toggle
              label="Needs review"
              description="When Dispatch pauses a workflow for your input."
            />
            <Toggle
              label="Weekly digest"
              description="A Monday summary of hours saved and runs completed."
              defaultOn={false}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-2.5">
          <Button variant="ghost">Cancel</Button>
          <Button>Save changes</Button>
        </div>
      </div>
    </div>
  );
}
