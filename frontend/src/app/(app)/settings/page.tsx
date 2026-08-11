import { PageHeader } from "@/components/app/page-header";
import { Button, Card, Field, Toggle } from "@/components/ui";
import { getSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getSession();

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <PageHeader
        title="Settings"
        subtitle="Your profile, workspace, and notification preferences."
      />

      <div className="space-y-5">
        <Card className="p-6">
          <h2 className="mb-5 text-[15px] font-semibold tracking-tight text-ink">Profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" defaultValue={session?.fullName ?? ""} />
            <Field label="Role" defaultValue={session?.role ?? ""} />
            <div className="sm:col-span-2">
              <Field
                label="Email"
                defaultValue={session?.email ?? ""}
                hint="Used for sign-in and execution notifications."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-5 text-[15px] font-semibold tracking-tight text-ink">Workspace</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Workspace name" defaultValue={session?.organizationName ?? ""} />
            <Field label="Timezone" defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} />
          </div>
          <div className="mt-5 border-t border-line pt-2">
            <Toggle
              label="Require approval for all executions"
              description="Workflows can never run without a human sign-off."
              defaultOn
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
              defaultOn
            />
            <Toggle
              label="Weekly digest"
              description="A Monday summary of runs completed."
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
