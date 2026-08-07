import { PageHeader } from "@/components/app/page-header";
import { Button, Card, Field, Toggle } from "@/components/ui";

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
