"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import type { SessionUser } from "@/lib/session";

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
  onClick,
}: {
  item: { label: string; href: string; icon: React.ElementType };
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
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

function initialsFor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      {open && (
        <button
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}
      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-lg border border-line bg-surface p-1.5 shadow-raised">
          <p className="truncate px-2 py-1.5 text-[12px] text-faint">{user.email}</p>
          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium text-ink transition-colors hover:bg-danger/[0.06] hover:text-danger"
          >
            <LogOut className="size-3.5" />
            Log out
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-ink/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white">
          {initialsFor(user.fullName)}
        </span>
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[13px] font-medium text-ink">
            {user.fullName}
          </span>
          <span className="block truncate text-[11.5px] text-faint">
            {user.organizationName}
          </span>
        </span>
        <ChevronsUpDown className="size-3.5 text-faint" />
      </button>
    </div>
  );
}

export function Sidebar({
  user,
  onNavigate,
  onClose,
}: {
  user: SessionUser;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-canvas">
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <Logo href="/dashboard" />
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex size-7 cursor-pointer items-center justify-center rounded-lg text-faint transition-colors hover:bg-ink/[0.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="px-3 pb-4">
        <Link
          href="/automations"
          onClick={onNavigate}
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-[13.5px] font-medium text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
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
            onClick={onNavigate}
          />
        ))}
        <div className="!my-3 h-px bg-line/80" />
        {NAV_SECONDARY.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
