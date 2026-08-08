"use client";

import { motion } from "framer-motion";
import { AppIcon, type AppName } from "@/components/app-icon";
import { LogoMark } from "@/components/logo";

const ORBIT_APPS: AppName[] = ["Gmail", "Slack", "Google Calendar", "Notion", "HubSpot"];
const SIZE = 340;
const CENTER = SIZE / 2;
const RADIUS = 128;
const CYCLE = 2.2;

function pointOnCircle(index: number, count: number) {
  const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER + RADIUS * Math.sin(angle),
  };
}

export function DispatchAnimation() {
  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="absolute inset-0">
        {ORBIT_APPS.map((app, i) => {
          const { x, y } = pointOnCircle(i, ORBIT_APPS.length);
          return (
            <line
              key={app}
              x1={x}
              y1={y}
              x2={CENTER}
              y2={CENTER}
              stroke="white"
              strokeOpacity={0.14}
              strokeWidth={1.5}
            />
          );
        })}
        {ORBIT_APPS.map((app, i) => {
          const { x, y } = pointOnCircle(i, ORBIT_APPS.length);
          return (
            <motion.circle
              key={app}
              r={4}
              fill="var(--color-accent)"
              initial={{ cx: x, cy: y, opacity: 0 }}
              animate={{ cx: [x, x, CENTER], cy: [y, y, CENTER], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: CYCLE,
                repeat: Infinity,
                delay: i * (CYCLE / ORBIT_APPS.length),
                ease: "easeInOut",
                times: [0, 0.15, 1],
              }}
            />
          );
        })}
      </svg>

      {ORBIT_APPS.map((app, i) => {
        const { x, y } = pointOnCircle(i, ORBIT_APPS.length);
        return (
          <motion.div
            key={app}
            className="absolute size-11 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-2 shadow-xl"
            style={{ left: x, top: y }}
            animate={{ scale: [1, 1, 1.12, 1] }}
            transition={{
              duration: CYCLE,
              repeat: Infinity,
              delay: i * (CYCLE / ORBIT_APPS.length),
              ease: "easeInOut",
              times: [0, 0.15, 0.4, 1],
            }}
          >
            <AppIcon app={app} size="md" />
          </motion.div>
        );
      })}

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{
          duration: CYCLE / ORBIT_APPS.length,
          repeat: Infinity,
          repeatDelay: CYCLE - CYCLE / ORBIT_APPS.length,
          ease: "easeOut",
        }}
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-2xl">
          <LogoMark className="size-10" inverted />
        </div>
      </motion.div>
    </div>
  );
}
