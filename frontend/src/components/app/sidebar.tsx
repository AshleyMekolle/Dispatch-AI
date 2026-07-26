"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  LayoutTemplate,
  History,
  Blocks,
  BarChart3,
  CreditCard,
  Settings,
  Plus,
  ChevronsUpDown,
} from "lucide-react";
import { Logo } from "@/components/logo";

const NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Automations", href: "/automations", icon: Workflow },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "History", href: "/history", icon: History },
  { label: "Integrations", href: "/integrations", icon: Blocks },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

const NAV_SECONDARY = [
  { label: "Billing", href: "/billing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavItem({
  item,
  active,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium transition-colors ${
        active
          ? "bg-surface text-ink shadow-[0_1px_2px_rgb(17_17_17/0.06)] ring-1 ring-line"
          : "text-muted hover:bg-ink/[0.04] hover:text-ink"
      }`}
    >
      <Icon
        className={`size-4 ${active ? "text-primary" : "text-faint"}`}
        strokeWidth={active ? 2 : 1.8}
      />
      {item.label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-canvas">
      <div className="px-4 pt-5 pb-4">
        <Logo href="/dashboard" />
      </div>

      <div className="px-3 pb-4">
        <Link
          href="/automations"
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-[13.5px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition-colors hover:bg-primary-hover"
        >
          <Plus className="size-4" />
          New automation
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
        <div className="!my-3 h-px bg-line/80" />
        {NAV_SECONDARY.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <button className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-ink/[0.04]">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white">
            AC
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[13px] font-medium text-ink">
              Amara Cole
            </span>
            <span className="block truncate text-[11.5px] text-faint">
              Halcyon Partners
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 text-faint" />
        </button>
      </div>
    </aside>
  );
}
