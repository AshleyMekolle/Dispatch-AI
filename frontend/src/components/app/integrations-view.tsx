"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { AppIcon, type AppName } from "@/components/app-icon";
import { Badge, Button, Card } from "@/components/ui";
import { disconnectConnection, getGmailAuthorizeUrl, type Connection } from "@/lib/api";

const SUPPORTED: { app: AppName; description: string; connectable: boolean }[] = [
  {
    app: "Gmail",
    description: "Send single and bulk emails on your behalf once connected.",
    connectable: true,
  },
  {
    app: "Google Calendar",
    description: "Create calendar events once connected.",
    connectable: false,
  },
  {
    app: "Notion",
    description: "Create pages in your workspace once connected.",
    connectable: false,
  },
];

const CONNECTION_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "That connection link expired — try connecting again.",
  no_membership: "Couldn't find your workspace — try signing in again.",
  google_rejected: "Google declined that request — try connecting again.",
};

export function IntegrationsView({ initialConnections }: { initialConnections: Connection[] }) {
  const [connections, setConnections] = useState(initialConnections);
  const [connecting, setConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const justConnected = searchParams.get("connected") === "gmail";
  const connectionError = searchParams.get("connection_error");

  const gmailConnection = connections.find((c) => c.provider === "GMAIL") ?? null;

  async function handleConnectGmail() {
    setError(null);
    setConnecting(true);
    try {
      const url = await getGmailAuthorizeUrl();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the Gmail connection.");
      setConnecting(false);
    }
  }

  async function handleDisconnect(id: string) {
    setError(null);
    setDisconnectingId(id);
    try {
      await disconnectConnection(id);
      setConnections((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't disconnect that account.");
    } finally {
      setDisconnectingId(null);
    }
  }

  return (
    <div>
      {justConnected && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-success/25 bg-success/[0.06] px-4 py-3 text-[13px] font-medium text-success">
          <Check className="size-4" strokeWidth={2.5} />
          Gmail connected — single and bulk email automations will now run for real.
        </div>
      )}
      {connectionError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger/25 bg-danger/[0.06] px-4 py-3 text-[13px] font-medium text-danger">
          <X className="size-4" strokeWidth={2.5} />
          {CONNECTION_ERROR_MESSAGES[connectionError] ?? "Couldn't connect that account."}
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-lg bg-danger/10 px-4 py-3 text-[13px] text-danger">{error}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SUPPORTED.map((a) => {
          const connection = a.app === "Gmail" ? gmailConnection : null;
          return (
            <Card key={a.app} className="p-5">
              <div className="flex items-start justify-between">
                <AppIcon app={a.app} size="lg" />
                {connection ? (
                  <Badge tone="success">Connected</Badge>
                ) : a.connectable ? (
                  <Badge tone="neutral">Not connected</Badge>
                ) : (
                  <Badge tone="pending">Coming soon</Badge>
                )}
              </div>
              <h3 className="mt-4 text-[15px] font-semibold tracking-tight text-ink">{a.app}</h3>
              <p className="mt-1 min-h-9 text-[13px] leading-relaxed text-muted">
                {connection?.external_account_email
                  ? `Connected as ${connection.external_account_email}.`
                  : a.description}
              </p>
              {a.connectable && (
                <div className="mt-4">
                  {connection ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDisconnect(connection.id)}
                      disabled={disconnectingId === connection.id}
                    >
                      {disconnectingId === connection.id && (
                        <Loader2 className="size-3.5 animate-spin" />
                      )}
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleConnectGmail} disabled={connecting}>
                      {connecting && <Loader2 className="size-3.5 animate-spin" />}
                      Connect
                    </Button>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
