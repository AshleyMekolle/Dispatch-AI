import Link from "next/link";

export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-lg bg-primary text-white`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-[62%]"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* paper-plane / dispatch mark */}
        <path d="M21 3 10.5 13.5" />
        <path d="M21 3 14 21l-3.5-7.5L3 10z" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-ink">
        Dispatch
      </span>
    </Link>
  );
}
