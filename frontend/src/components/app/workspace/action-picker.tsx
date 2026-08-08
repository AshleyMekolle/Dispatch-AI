import { ArrowRight } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { ACTIONS, type ActionType } from "./action-registry";

export function ActionPicker({ onPick }: { onPick: (type: ActionType) => void }) {
  return (
    <div className="grid gap-3.5 sm:grid-cols-3">
      {ACTIONS.map((action) => (
        <button
          key={action.type}
          onClick={() => onPick(action.type)}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
        >
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/[0.07] transition-colors group-hover:bg-primary/[0.12]">
            <AppIcon app={action.app} size="lg" />
          </span>
          <span>
            <span className="block text-[14.5px] font-semibold tracking-tight text-ink">
              {action.label}
            </span>
            <span className="mt-1 block text-[13px] leading-relaxed text-muted">
              {action.description}
            </span>
          </span>
          <span className="mt-auto flex items-center gap-1 pt-1 text-[12.5px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Get started
            <ArrowRight className="size-3.5" />
          </span>
        </button>
      ))}
    </div>
  );
}
