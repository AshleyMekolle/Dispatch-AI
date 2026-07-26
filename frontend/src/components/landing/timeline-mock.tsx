"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { AppIcon, type AppName } from "@/components/app-icon";

const ITEMS: { label: string; app: AppName; time: string }[] = [
  { label: "Gmail email sent", app: "Gmail", time: "0:02" },
  { label: "HubSpot contact created", app: "HubSpot", time: "0:04" },
  { label: "Google Drive folder created", app: "Google Drive", time: "0:07" },
  { label: "Airtable record updated", app: "Airtable", time: "0:09" },
  { label: "Slack notification sent", app: "Slack", time: "0:11" },
];

export function TimelineMock() {
  return (
    <div className="relative rounded-2xl border border-line bg-surface p-6 shadow-raised">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            Client onboarding — Acme Corp
          </p>
          <p className="mt-0.5 text-xs text-faint">Execution EX-1042</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
          <Check className="size-3" strokeWidth={3} />
          Completed in 11s
        </span>
      </div>
      <div className="relative">
        <div className="absolute top-2 bottom-2 left-[11px] w-px bg-line" />
        <div className="space-y-1">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: 0.35 + i * 0.22, duration: 0.4 }}
              className="relative flex items-center gap-3.5 rounded-xl px-0.5 py-2"
            >
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  delay: 0.45 + i * 0.22,
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                }}
                className="relative z-10 inline-flex size-[22px] shrink-0 items-center justify-center rounded-full bg-success text-white ring-4 ring-surface"
              >
                <Check className="size-3" strokeWidth={3.5} />
              </motion.span>
              <span className="flex-1 text-sm font-medium text-ink">
                {item.label}
              </span>
              <AppIcon app={item.app} size="sm" />
              <span className="w-8 text-right text-xs tabular-nums text-faint">
                {item.time}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
