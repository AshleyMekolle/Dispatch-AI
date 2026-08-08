import {
  siGmail,
  siGoogledrive,
  siGooglecalendar,
  siGooglesheets,
  siNotion,
  siHubspot,
  siAirtable,
  siStripe,
  siWhatsapp,
} from "simple-icons";

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

type IconDef =
  | { kind: "logo"; path: string; hex: string }
  | { kind: "monogram"; glyph: string; hex: string };

const APP_ICONS: Record<AppName, IconDef> = {
  Gmail: { kind: "logo", path: siGmail.path, hex: siGmail.hex },
  "Google Drive": {
    kind: "logo",
    path: siGoogledrive.path,
    hex: siGoogledrive.hex,
  },
  "Google Calendar": {
    kind: "logo",
    path: siGooglecalendar.path,
    hex: siGooglecalendar.hex,
  },
  "Google Sheets": {
    kind: "logo",
    path: siGooglesheets.path,
    hex: siGooglesheets.hex,
  },
  Slack: { kind: "monogram", glyph: "Sl", hex: "611F69" },
  Notion: { kind: "logo", path: siNotion.path, hex: siNotion.hex },
  HubSpot: { kind: "logo", path: siHubspot.path, hex: siHubspot.hex },
  Airtable: { kind: "logo", path: siAirtable.path, hex: siAirtable.hex },
  "Microsoft 365": { kind: "monogram", glyph: "Ms", hex: "D83B01" },
  WhatsApp: { kind: "logo", path: siWhatsapp.path, hex: siWhatsapp.hex },
  Stripe: { kind: "logo", path: siStripe.path, hex: siStripe.hex },
  Salesforce: { kind: "monogram", glyph: "Sf", hex: "0A8AC2" },
};

const DIMENSIONS = {
  xs: { box: "size-4.5 rounded-[5px]", glyph: "text-[9px]", logo: "size-[62%]" },
  sm: { box: "size-6 rounded-md", glyph: "text-[11px]", logo: "size-[58%]" },
  md: { box: "size-8 rounded-lg", glyph: "text-[13px]", logo: "size-[55%]" },
  lg: { box: "size-10 rounded-xl", glyph: "text-[15px]", logo: "size-[55%]" },
};

export function AppIcon({
  app,
  size = "md",
}: {
  app: AppName;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const icon = APP_ICONS[app];
  const dim = DIMENSIONS[size];
  return (
    <span
      title={app}
      className={`inline-flex shrink-0 items-center justify-center ${dim.box}`}
      style={{ backgroundColor: `#${icon.hex}1A`, color: `#${icon.hex}` }}
    >
      {icon.kind === "logo" ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className={dim.logo}>
          <path d={icon.path} />
        </svg>
      ) : (
        <span className={`font-bold tracking-tight ${dim.glyph}`}>
          {icon.glyph}
        </span>
      )}
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
