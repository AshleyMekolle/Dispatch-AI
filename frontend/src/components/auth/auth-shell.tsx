import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { Logo } from "@/components/logo";
import { DispatchAnimation } from "./dispatch-animation";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="relative hidden w-[46%] max-w-xl shrink-0 flex-col justify-between overflow-hidden bg-primary lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(560px 380px at 28% 15%, rgba(255,255,255,0.10), transparent 65%), radial-gradient(420px 320px at 90% 90%, rgba(0,0,0,0.18), transparent 70%)",
          }}
        />
        <div className="relative z-10 p-10">
          <Logo href="/" inverted />
        </div>
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <DispatchAnimation />
        </div>
        <div className="relative z-10 p-10">
          <p className="max-w-sm text-lg leading-snug font-medium text-white">
            Describe the work. Dispatch coordinates your apps and gets it done.
          </p>
          <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-white/60">
            Every step reviewed and approved before anything runs.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <Card className="p-7">
            <h1 className="text-[19px] font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mt-1.5 text-[13.5px] text-muted">{subtitle}</p>
            <div className="mt-6">{children}</div>
          </Card>
          <p className="mt-6 text-center text-[13px] text-muted">{footer}</p>
        </div>
      </div>
    </div>
  );
}
