"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "What do you want to get done today?",
  "Automate the busywork.",
  "Send that email without opening Gmail.",
  "Let's get something off your plate.",
  "Turn an errand into one click.",
];

function useTypewriter(phrases: string[]): string {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIndex];

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), 1800);
      return () => clearTimeout(t);
    }

    if (deleting && text === "") {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
      return;
    }

    const t = setTimeout(
      () => {
        setText((prev) =>
          deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1),
        );
      },
      deleting ? 22 : 42,
    );
    return () => clearTimeout(t);
  }, [text, deleting, phraseIndex, phrases]);

  return text;
}

export function TypewriterHeadline() {
  const text = useTypewriter(PHRASES);
  return (
    <h1 className="text-[26px] font-semibold tracking-tight text-ink md:text-[32px]">
      {text}
      <span className="caret-blink ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[2px] bg-primary align-middle" />
    </h1>
  );
}
