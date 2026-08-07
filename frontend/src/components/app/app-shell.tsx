"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/app/sidebar";
import { LogoMark } from "@/components/logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className="fixed inset-y-0 z-50 transition-[left] duration-200 ease-out lg:hidden"
        style={{ left: open ? "0px" : "-240px" }}
        aria-hidden={!open}
      >
        <Sidebar
          onNavigate={() => setOpen(false)}
          onClose={() => setOpen(false)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/[0.04] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
          >
            <Menu className="size-[18px]" />
          </button>
          <LogoMark className="size-6" />
          <span className="text-[15px] font-semibold tracking-tight text-ink">
            Dispatch
          </span>
        </div>
        <main className="quiet-scroll flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
