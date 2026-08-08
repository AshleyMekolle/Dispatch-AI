export type ProviderName = "GMAIL" | "GOOGLE_CALENDAR" | "NOTION" | "SLACK" | "GOOGLE_DRIVE";
export type WorkflowStatus = "DRAFT" | "APPROVED";
export type ExecutionStepStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "SKIPPED" | "CANCELLED";
export type ExecutionStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export type WorkflowStep = {
  id: string;
  step_order: number;
  action_type: string;
  provider: ProviderName;
  params: Record<string, unknown>;
};

export type Workflow = {
  id: string;
  title: string;
  status: WorkflowStatus;
  version_id: string;
  created_at: string;
  steps: WorkflowStep[];
};

export type WorkflowSummary = {
  id: string;
  title: string;
  status: WorkflowStatus;
  action_type: string;
  provider: ProviderName;
  created_at: string;
};

export type ExecutionSummary = {
  id: string;
  workflow_id: string;
  workflow_title: string;
  status: ExecutionStatus;
  started_at: string | null;
  completed_at: string | null;
};

export type ExecutionStep = {
  id: string;
  action_type: string;
  provider: ProviderName;
  status: ExecutionStepStatus;
  result: Record<string, unknown> | null;
};

export type Execution = {
  id: string;
  status: ExecutionStatus;
  started_at: string | null;
  completed_at: string | null;
  steps: ExecutionStep[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message = typeof error?.detail === "string" ? error.detail : "Something went wrong.";
    throw new Error(message);
  }
  return response.json();
}

export function createWorkflow(
  actionType: string,
  params: Record<string, unknown>,
): Promise<Workflow> {
  return request<Workflow>("/workflows", {
    method: "POST",
    body: JSON.stringify({ action_type: actionType, params }),
  });
}

export function listWorkflows(): Promise<WorkflowSummary[]> {
  return request<WorkflowSummary[]>("/workflows");
}

export function listExecutions(): Promise<ExecutionSummary[]> {
  return request<ExecutionSummary[]>("/workflows/executions");
}

export function getWorkflow(id: string): Promise<Workflow> {
  return request<Workflow>(`/workflows/${id}`);
}

export function approveWorkflow(id: string): Promise<Workflow> {
  return request<Workflow>(`/workflows/${id}/approve`, { method: "POST" });
}

export function executeWorkflow(id: string): Promise<Execution> {
  return request<Execution>(`/workflows/${id}/executions`, { method: "POST" });
}
