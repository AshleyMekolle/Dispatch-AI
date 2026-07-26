export type AppName =
  | "Gmail"
  | "Google Drive"
  | "Google Calendar"
  | "Google Sheets"
  | "Slack"
  | "Notion"
  | "HubSpot"
  | "Airtable"
  | "Microsoft 365"
  | "WhatsApp"
  | "Stripe"
  | "Salesforce";

const APP_STYLES: Record<AppName, { bg: string; fg: string; glyph: string }> = {
  Gmail: { bg: "#FBEAE7", fg: "#C5352B", glyph: "M" },
  "Google Drive": { bg: "#E7F1E9", fg: "#1E8E3E", glyph: "D" },
  "Google Calendar": { bg: "#E8F0FB", fg: "#1A73E8", glyph: "C" },
  "Google Sheets": { bg: "#E4F2EA", fg: "#188038", glyph: "S" },
  Slack: { bg: "#F3EAF3", fg: "#611F69", glyph: "S" },
  Notion: { bg: "#F1F0EE", fg: "#191919", glyph: "N" },
  HubSpot: { bg: "#FDEEE9", fg: "#E8593C", glyph: "H" },
  Airtable: { bg: "#FDF3DC", fg: "#B58121", glyph: "A" },
  "Microsoft 365": { bg: "#FBEBe6", fg: "#D83B01", glyph: "M" },
  WhatsApp: { bg: "#E7F6EC", fg: "#1FA855", glyph: "W" },
  Stripe: { bg: "#EDEDFB", fg: "#5851DF", glyph: "S" },
  Salesforce: { bg: "#E6F3FA", fg: "#0A8AC2", glyph: "S" },
};

export function AppIcon({
  app,
  size = "md",
}: {
  app: AppName;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const s = APP_STYLES[app];
  const dims = {
    xs: "size-4.5 rounded-[5px] text-[9px]",
    sm: "size-6 rounded-md text-[11px]",
    md: "size-8 rounded-lg text-[13px]",
    lg: "size-10 rounded-xl text-[15px]",
  };
  return (
    <span
      title={app}
      className={`inline-flex shrink-0 items-center justify-center font-bold ${dims[size]}`}
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {s.glyph}
    </span>
  );
}

export function AppStack({
  apps,
  size = "sm",
}: {
  apps: AppName[];
  size?: "xs" | "sm";
}) {
  return (
    <span className="inline-flex items-center">
      {apps.map((a, i) => (
        <span
          key={a}
          className={`inline-flex rounded-[7px] ring-2 ring-surface ${i > 0 ? "-ml-1.5" : ""}`}
        >
          <AppIcon app={a} size={size} />
        </span>
      ))}
    </span>
  );
}
