"use client";

import { motion } from "framer-motion";
import { LogoMark } from "@/components/logo";

export function GlowOrb() {
  return (
    <div className="relative flex size-40 shrink-0 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(31,77,58,0.32), rgba(31,77,58,0) 70%)",
        }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-7 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(200,155,60,0.45), rgba(200,155,60,0) 70%)",
        }}
        animate={{ scale: [1.12, 0.94, 1.12], opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        className="relative flex size-16 items-center justify-center rounded-full bg-primary shadow-[0_8px_32px_-8px_rgb(31_77_58/0.55)]"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <LogoMark className="size-9" />
      </motion.div>
    </div>
  );
}
