import type { AppName } from "@/components/app-icon";

export const ALL_APPS: { app: AppName; category: string; connected: boolean; description: string }[] = [
  { app: "Gmail", category: "Google Workspace", connected: true, description: "Send and draft emails, manage threads and labels." },
  { app: "Google Drive", category: "Google Workspace", connected: true, description: "Create folders, organize files, manage sharing." },
  { app: "Google Calendar", category: "Google Workspace", connected: true, description: "Schedule meetings, create events, find open slots." },
  { app: "Google Sheets", category: "Google Workspace", connected: false, description: "Read, append, and update rows in spreadsheets." },
  { app: "Slack", category: "Communication", connected: true, description: "Post messages, notify channels, DM teammates." },
  { app: "Notion", category: "Productivity", connected: true, description: "Create pages, update databases, manage docs." },
  { app: "HubSpot", category: "CRM", connected: true, description: "Create contacts, update deals, log activity." },
  { app: "Airtable", category: "Productivity", connected: true, description: "Insert and update records across bases." },
  { app: "Microsoft 365", category: "Productivity", connected: false, description: "Outlook mail, OneDrive files, Teams messages." },
  { app: "WhatsApp", category: "Communication", connected: false, description: "Send approved template messages to contacts." },
  { app: "Stripe", category: "Finance", connected: true, description: "Create invoices, send payment links, issue refunds." },
  { app: "Salesforce", category: "CRM", connected: false, description: "Manage leads, opportunities, and accounts." },
];

export type StepStatus = "pending" | "running" | "done" | "failed";

export type PlanStep = {
  action: string;
  detail: string;
  app: AppName;
  duration: string;
};

export const ONBOARDING_PLAN: PlanStep[] = [
  { action: "Create HubSpot contact", detail: "John Smith · john@acmecorp.com · tagged “New Client”", app: "HubSpot", duration: "~2s" },
  { action: "Create Drive folder", detail: "“Acme Corp — Onboarding” inside /Clients, shared with team", app: "Google Drive", duration: "~3s" },
  { action: "Send welcome email", detail: "Template “Client Welcome” personalized for John", app: "Gmail", duration: "~2s" },
  { action: "Notify sales team", detail: "Post summary in #sales with links to contact + folder", app: "Slack", duration: "~1s" },
  { action: "Schedule follow-up", detail: "30 min “Kickoff check-in”, Friday Jul 24 · 10:00 AM", app: "Google Calendar", duration: "~2s" },
];

export type Execution = {
  id: string;
  name: string;
  apps: AppName[];
  status: "Completed" | "Failed" | "Needs review" | "Running";
  steps: number;
  duration: string;
  when: string;
  origin: "Manual" | "Scheduled" | "Template";
};

export const EXECUTIONS: Execution[] = [
  { id: "EX-1042", name: "Client onboarding — Acme Corp", apps: ["HubSpot", "Google Drive", "Gmail", "Slack", "Google Calendar"], status: "Completed", steps: 5, duration: "11s", when: "Today · 2:41 PM", origin: "Manual" },
  { id: "EX-1041", name: "Overdue invoice follow-ups (14)", apps: ["Stripe", "Gmail", "Slack"], status: "Completed", steps: 42, duration: "1m 38s", when: "Today · 9:00 AM", origin: "Scheduled" },
  { id: "EX-1040", name: "Weekly pipeline report", apps: ["HubSpot", "Google Sheets", "Slack"], status: "Completed", steps: 6, duration: "24s", when: "Mon · 8:00 AM", origin: "Scheduled" },
  { id: "EX-1039", name: "Candidate advanced — R. Alvarez", apps: ["Airtable", "Gmail", "Google Calendar"], status: "Needs review", steps: 4, duration: "—", when: "Mon · 7:12 AM", origin: "Template" },
  { id: "EX-1038", name: "New lead routing — Meridian Group", apps: ["HubSpot", "Slack", "Gmail"], status: "Completed", steps: 4, duration: "8s", when: "Fri · 4:55 PM", origin: "Manual" },
  { id: "EX-1037", name: "Employee onboarding — T. Okafor", apps: ["Notion", "Gmail", "Slack", "Google Calendar"], status: "Completed", steps: 7, duration: "19s", when: "Fri · 11:20 AM", origin: "Template" },
  { id: "EX-1036", name: "Contract renewal reminders (6)", apps: ["Airtable", "Gmail"], status: "Failed", steps: 12, duration: "42s", when: "Thu · 3:05 PM", origin: "Scheduled" },
  { id: "EX-1035", name: "Deal stage sync — Q3 opportunities", apps: ["HubSpot", "Airtable", "Slack"], status: "Completed", steps: 9, duration: "31s", when: "Thu · 9:00 AM", origin: "Scheduled" },
];

export type Template = {
  name: string;
  description: string;
  apps: AppName[];
  steps: number;
  runs: number;
  category: string;
};

export const TEMPLATES: Template[] = [
  { name: "Client Onboarding", description: "Create the CRM record, spin up folders and docs, send the welcome email, and brief your team — from one sentence.", apps: ["HubSpot", "Google Drive", "Gmail", "Slack"], steps: 5, runs: 128, category: "Sales" },
  { name: "Lead Management", description: "Qualify inbound leads, enrich the record, assign an owner, and schedule the first touch automatically.", apps: ["HubSpot", "Slack", "Gmail"], steps: 4, runs: 342, category: "Sales" },
  { name: "Sales Follow-up", description: "Draft personalized follow-ups after every meeting and log the activity back to your CRM.", apps: ["Gmail", "HubSpot", "Google Calendar"], steps: 3, runs: 214, category: "Sales" },
  { name: "Recruitment Pipeline", description: "Move candidates through stages, send status emails, and book interviews without touching five tabs.", apps: ["Airtable", "Gmail", "Google Calendar"], steps: 5, runs: 96, category: "Recruiting" },
  { name: "Employee Onboarding", description: "Provision docs, send day-one info, create the 30/60/90 plan, and introduce the new hire in Slack.", apps: ["Notion", "Gmail", "Slack", "Google Calendar"], steps: 7, runs: 41, category: "HR" },
  { name: "Invoice Follow-up", description: "Detect overdue invoices, send polite escalating reminders, and alert finance when payment lands.", apps: ["Stripe", "Gmail", "Slack"], steps: 4, runs: 187, category: "Finance" },
  { name: "Weekly Reporting", description: "Pull the numbers, build the summary, and deliver the report to your channel every Monday at 8 AM.", apps: ["HubSpot", "Google Sheets", "Slack"], steps: 6, runs: 52, category: "Operations" },
  { name: "Customer Support", description: "Triage new tickets, draft first responses, and escalate anything urgent to the right person.", apps: ["Gmail", "Notion", "Slack"], steps: 4, runs: 268, category: "Support" },
  { name: "Inventory Updates", description: "Sync stock levels across sheets and bases, and notify purchasing when items run low.", apps: ["Google Sheets", "Airtable", "Slack"], steps: 5, runs: 73, category: "Operations" },
];

export type ScheduledWorkflow = {
  name: string;
  cadence: string;
  next: string;
  apps: AppName[];
};

export const SCHEDULED: ScheduledWorkflow[] = [
  { name: "Overdue invoice follow-ups", cadence: "Daily · 9:00 AM", next: "Tomorrow, 9:00 AM", apps: ["Stripe", "Gmail"] },
  { name: "Weekly pipeline report", cadence: "Mondays · 8:00 AM", next: "Mon Jul 20, 8:00 AM", apps: ["HubSpot", "Slack"] },
  { name: "Contract renewal scan", cadence: "Thursdays · 3:00 PM", next: "Thu Jul 23, 3:00 PM", apps: ["Airtable", "Gmail"] },
];

export type Suggestion = {
  text: string;
  action: string;
};

export const SUGGESTIONS: Suggestion[] = [
  { text: "You sent 9 similar follow-up emails this week. Turn them into a reusable workflow?", action: "Create workflow" },
  { text: "3 HubSpot deals moved to “Closed won” with no onboarding started. Run Client Onboarding?", action: "Review deals" },
  { text: "Your Friday report took 40 minutes manually last week. Schedule it for Mondays?", action: "Schedule it" },
];

export type Conversation = {
  title: string;
  when: string;
  active: boolean;
};

export const CONVERSATIONS: Conversation[] = [
  { title: "Onboard John Smith — Acme Corp", when: "2:41 PM", active: true },
  { title: "Follow up with overdue customers", when: "9:14 AM", active: false },
  { title: "Prep weekly pipeline report", when: "Yesterday", active: false },
  { title: "Route new Meridian Group lead", when: "Friday", active: false },
  { title: "Draft renewal emails — Q3 contracts", when: "Thursday", active: false },
  { title: "Onboard new hire Tolu Okafor", when: "Jul 10", active: false },
];
