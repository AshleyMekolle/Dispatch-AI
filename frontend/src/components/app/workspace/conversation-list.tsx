import { Plus } from "lucide-react";
import { SearchInput } from "@/components/ui";
import type { WorkflowSummary } from "@/lib/api";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ConversationList({
  workflows,
  activeId,
  onSelect,
  onNew,
}: {
  workflows: WorkflowSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex w-64 shrink-0 flex-col border-r border-line bg-canvas">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">Automations</h2>
        <button
          onClick={onNew}
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg border border-line bg-surface text-muted shadow-[0_1px_2px_rgb(17_17_17/0.04)] transition-colors hover:text-ink"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="px-3 pb-3">
        <SearchInput inputSize="sm" placeholder="Search…" />
      </div>
      <div className="quiet-scroll flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {workflows.length === 0 && (
          <p className="px-2.5 py-2 text-[13px] text-faint">No automations yet.</p>
        )}
        {workflows.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            className={`w-full cursor-pointer rounded-lg px-2.5 py-2 text-left transition-colors ${
              w.id === activeId
                ? "bg-surface shadow-[0_1px_2px_rgb(17_17_17/0.05)] ring-1 ring-line"
                : "hover:bg-ink/[0.04]"
            }`}
          >
            <span
              className={`block truncate text-[13px] font-medium ${w.id === activeId ? "text-ink" : "text-muted"}`}
            >
              {w.title}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-faint">
              {formatWhen(w.created_at)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
