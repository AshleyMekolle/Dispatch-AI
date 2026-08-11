import { PageHeader } from "@/components/app/page-header";
import { HistoryView } from "@/components/app/history-view";
import { getExecutionsServer } from "@/lib/server-api";

export default async function HistoryPage() {
  const executions = await getExecutionsServer();

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="History"
        subtitle="A complete record of every workflow Dispatch has executed."
      />
      <HistoryView executions={executions} />
    </div>
  );
}
