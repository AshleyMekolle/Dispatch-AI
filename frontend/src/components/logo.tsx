import Link from "next/link";

export function LogoMark({
  className = "size-7",
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span
      className={`${className} inline-flex items-center justify-center rounded-[9px] shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ${
        inverted ? "bg-white text-primary" : "bg-primary text-white"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-[58%]">
        <path d="M3 3 L21 12 L3 21 L7.5 12 Z" className="fill-current" />
        <circle cx="18.5" cy="6.2" r="1.5" className="fill-accent" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  inverted = false,
}: {
  href?: string;
  inverted?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark inverted={inverted} />
      <span
        className={`text-[17px] font-semibold tracking-[-0.01em] ${inverted ? "text-white" : "text-ink"}`}
      >
        Dispatch
      </span>
    </Link>
  );
}
