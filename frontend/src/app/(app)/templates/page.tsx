import Link from "next/link";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ACTIONS } from "@/components/app/workspace/action-registry";
import { Card } from "@/components/ui";
import { AppIcon } from "@/components/app-icon";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Templates"
        subtitle="Start from one of the automations Dispatch can run today."
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map((action) => (
          <Card
            key={action.type}
            className="group flex flex-col p-6 transition-shadow hover:shadow-raised"
          >
            <AppIcon app={action.app} size="lg" />
            <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
              {action.label}
            </h3>
            <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-muted">
              {action.description}
            </p>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <span className="text-xs text-faint">{action.app}</span>
              <Link
                href={`/automations?action=${action.type}`}
                className="flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-primary transition-colors hover:text-primary-hover"
              >
                <Play className="size-3.5" />
                Use template
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
