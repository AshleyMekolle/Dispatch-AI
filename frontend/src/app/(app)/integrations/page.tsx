import { PageHeader } from "@/components/app/page-header";
import { IntegrationsView } from "@/components/app/integrations-view";
import { getConnectionsServer } from "@/lib/server-api";

export default async function IntegrationsPage() {
  const connections = await getConnectionsServer();

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Integrations"
        subtitle="Connect your accounts so automations can run for real."
      />
      <IntegrationsView initialConnections={connections} />
    </div>
  );
}
