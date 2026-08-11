import { cookies } from "next/headers";
import type { Connection, ExecutionSummary, WorkflowSummary } from "@/lib/api";
import { ACCESS_TOKEN_COOKIE, backendUrl } from "@/lib/session";

async function serverRequest<T>(path: string): Promise<T | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) return null;

  const response = await fetch(backendUrl(`/api/v1${path}`), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

export async function getWorkflowsServer(): Promise<WorkflowSummary[]> {
  return (await serverRequest<WorkflowSummary[]>("/workflows")) ?? [];
}

export async function getExecutionsServer(): Promise<ExecutionSummary[]> {
  return (await serverRequest<ExecutionSummary[]>("/workflows/executions")) ?? [];
}

export async function getConnectionsServer(): Promise<Connection[]> {
  return (await serverRequest<Connection[]>("/connections")) ?? [];
}
