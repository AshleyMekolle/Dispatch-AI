import type { AppName } from "@/components/app-icon";

export type ActionType = "send_email" | "create_calendar_event" | "create_notion_page";

export type FieldConfig =
  | {
      name: string;
      label: string;
      kind: "text" | "email" | "datetime-local";
      placeholder?: string;
    }
  | { name: string; label: string; kind: "textarea"; placeholder?: string };

export type ActionConfig = {
  type: ActionType;
  label: string;
  description: string;
  app: AppName;
  fields: FieldConfig[];
  summarize: (params: Record<string, unknown>) => string;
};

export const ACTIONS: ActionConfig[] = [
  {
    type: "send_email",
    label: "Send an email",
    description: "Compose and send a message through Gmail.",
    app: "Gmail",
    fields: [
      { name: "to", label: "To", kind: "email", placeholder: "someone@example.com" },
      { name: "subject", label: "Subject", kind: "text" },
      { name: "body", label: "Message", kind: "textarea" },
    ],
    summarize: (p) => `Send an email to ${p.to ?? "someone"}: "${p.subject ?? "(no subject)"}"`,
  },
  {
    type: "create_calendar_event",
    label: "Create a calendar event",
    description: "Add an event to Google Calendar.",
    app: "Google Calendar",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "start_time", label: "Date & time", kind: "datetime-local" },
    ],
    summarize: (p) => `Create a calendar event: "${p.title ?? "Untitled event"}"`,
  },
  {
    type: "create_notion_page",
    label: "Create a Notion page",
    description: "Add a new page to Notion.",
    app: "Notion",
    fields: [
      { name: "title", label: "Title", kind: "text" },
      { name: "content", label: "Content", kind: "textarea" },
    ],
    summarize: (p) => `Create a Notion page: "${p.title ?? "Untitled page"}"`,
  },
];

export function actionFor(type: ActionType): ActionConfig {
  const action = ACTIONS.find((a) => a.type === type);
  if (!action) throw new Error(`Unknown action type: ${type}`);
  return action;
}
