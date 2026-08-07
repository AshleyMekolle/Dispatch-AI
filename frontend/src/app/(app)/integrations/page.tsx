"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Button, Card } from "@/components/ui";
import { AppIcon } from "@/components/app-icon";
import { ALL_APPS } from "@/lib/data";

export default function IntegrationsPage() {
  const [connected, setConnected] = useState(
    () => new Set(ALL_APPS.filter((a) => a.connected).map((a) => a.app)),
  );

  const toggle = (app: string) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(app as never)) next.delete(app as never);
      else next.add(app as never);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <PageHeader
        title="Integrations"
        subtitle={`${connected.size} of ${ALL_APPS.length} apps connected. Dispatch only acts within the permissions you grant.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ALL_APPS.map((a) => {
          const isConnected = connected.has(a.app);
          return (
            <Card key={a.app} className="p-5">
              <div className="flex items-start justify-between">
                <AppIcon app={a.app} size="lg" />
                {isConnected ? (
                  <Badge tone="success">
                    <Check className="size-3" strokeWidth={3} />
                    Connected
                  </Badge>
                ) : (
                  <Badge tone="pending">Not connected</Badge>
                )}
              </div>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">
                {a.app}
              </h3>
              <p className="mt-1 min-h-9 text-[13px] leading-relaxed text-muted">
                {a.description}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="text-xs text-faint">{a.category}</span>
                {isConnected ? (
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    onClick={() => toggle(a.app)}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggle(a.app)}
                  >
                    <Plus className="size-3.5" />
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
