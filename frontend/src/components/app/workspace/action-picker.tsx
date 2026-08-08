import { AppIcon } from "@/components/app-icon";
import { ACTIONS, type ActionType } from "./action-registry";

export function ActionPicker({ onPick }: { onPick: (type: ActionType) => void }) {
  return (
    <div className="space-y-2">
      {ACTIONS.map((action) => (
        <button
          key={action.type}
          onClick={() => onPick(action.type)}
          className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface p-3.5 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <AppIcon app={action.app} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-medium text-ink">{action.label}</span>
            <span className="block text-xs text-faint">{action.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
