'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type SplitHeadlineProps = {
  lines: string[];
  className?: string;
};

export function SplitHeadline({ lines, className }: SplitHeadlineProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <h1 className={className}>
      {lines.map((line, lineIndex) => (
        <span key={line} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={shouldReduceMotion ? false : { y: '115%', rotate: 2, filter: 'blur(10px)' }}
            animate={{ y: 0, rotate: 0, filter: 'blur(0px)' }}
            transition={{
              duration: 0.85,
              delay: lineIndex * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}

type ScrambleTextProps = {
  text: string;
  className?: string;
};

const SCRAMBLE_CHARS = 'DATA!?01[]{}#%';

export function ScrambleText({ text, className }: ScrambleTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    const totalFrames = Math.max(18, text.length * 2);
    const interval = window.setInterval(() => {
      frame += 1;
      setDisplay(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            const solved = frame / totalFrames > index / text.length;
            if (solved) return char;
            return SCRAMBLE_CHARS[(frame + index * 7) % SCRAMBLE_CHARS.length];
          })
          .join(''),
      );

      if (frame >= totalFrames) {
        window.clearInterval(interval);
        setDisplay(text);
      }
    }, 28);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion, text]);

  return <span className={className}>{display}</span>;
}

type HoverRevealCopyProps = {
  label: string;
  detail: string;
  className?: string;
};

export function HoverRevealCopy({ label, detail, className }: HoverRevealCopyProps) {
  const tooltipId = useId();

  return (
    <span
      role="button"
      tabIndex={0}
      aria-describedby={tooltipId}
      className={`group relative inline-flex cursor-default justify-center overflow-visible rounded-full focus:outline-none ${className ?? ''}`}
    >
      <span className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm text-white/82 backdrop-blur-md transition duration-300 group-hover:border-lime-300/60 group-hover:bg-lime-300/10 group-hover:text-lime-100 group-focus-visible:border-lime-300/70 group-focus-visible:bg-lime-300/10 group-focus-visible:text-lime-100">
        {label}
      </span>
      <span
        id={tooltipId}
        className="pointer-events-none absolute bottom-[calc(100%+0.65rem)] left-1/2 z-50 w-max max-w-[17rem] -translate-x-1/2 translate-y-2 rounded-2xl border border-lime-300/25 bg-[#05060a]/95 px-4 py-3 text-center text-sm font-semibold leading-5 text-lime-100 opacity-0 shadow-2xl shadow-black/60 backdrop-blur-xl transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        {detail}
      </span>
    </span>
  );
}

type MeasuredMarqueeProps = {
  items: string[];
};

export function MeasuredMarquee({ items }: MeasuredMarqueeProps) {
  const doubled = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.03] py-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#05060a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#05060a] to-transparent" />
      <div className="flex w-max animate-marquee gap-3">
        {doubled.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-cyan-100/75"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
