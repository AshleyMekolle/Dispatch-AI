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
