'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type HoverMorphTitleProps = {
  eyebrow?: string;
  baseLines: string[];
  hoverLines: string[];
  accent?: string;
  className?: string;
};

export function HoverMorphTitle({
  eyebrow,
  baseLines,
  hoverLines,
  accent = '#ff6647',
  className,
}: HoverMorphTitleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative isolate cursor-default overflow-visible ${className ?? ''}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${baseLines.join(' ')}. Hover text: ${hoverLines.join(' ')}`}
    >
      <motion.div
        className="absolute left-[52%] top-[45%] -z-10 h-[min(36vw,420px)] w-[min(36vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: accent }}
        animate={{
          scale: isHovered ? 1 : 0,
          x: isHovered ? -35 : -170,
          y: isHovered ? -12 : -110,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      />

      {eyebrow ? (
        <motion.div
          className="mb-4 text-center font-mono text-xs uppercase tracking-[0.6em] text-white/52 md:text-sm"
          animate={{ color: isHovered ? '#f7ffd6' : 'rgba(255,255,255,0.52)' }}
          transition={{ duration: 0.35 }}
        >
          {eyebrow}
        </motion.div>
      ) : null}

      <div className="relative py-2 text-center text-[clamp(3.2rem,7.4vw,8.1rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]">
        <div aria-hidden={isHovered}>
          {baseLines.map((line, index) => (
            <motion.span
              key={line}
              className="block whitespace-nowrap text-stone-100 drop-shadow-[0_4px_28px_rgba(0,0,0,0.55)]"
              animate={{
                y: isHovered ? -18 - index * 5 : 0,
                opacity: isHovered ? 0.2 : 1,
                filter: isHovered ? 'blur(1px)' : 'blur(0px)',
              }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {line.split('').map((char, charIndex) => (
                <motion.span
                  key={`${line}-${charIndex}`}
                  className="inline-block"
                  animate={{
                    y: isHovered ? (charIndex % 2 === 0 ? -4 : 5) : 0,
                    x: isHovered ? (charIndex % 3) - 1 : 0,
                    textShadow: isHovered
                      ? '0.08em 0 rgba(34,211,238,0.22), -0.08em 0 rgba(163,230,53,0.12)'
                      : '0 0 rgba(0,0,0,0)',
                  }}
                  transition={{ duration: 0.28, delay: charIndex * 0.01 }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </motion.span>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {hoverLines.map((line, index) => (
            <motion.span
              key={line}
              className="block whitespace-nowrap text-[#f8ffd8] drop-shadow-[0_4px_26px_rgba(0,0,0,0.9)] [-webkit-text-stroke:1px_rgba(5,6,10,0.55)]"
              animate={{
                y: isHovered ? 0 : 34 + index * 8,
                opacity: isHovered ? 1 : 0,
                scale: isHovered ? 1 : 0.96,
              }}
              transition={{ duration: 0.42, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            >
              {line}
            </motion.span>
          ))}
        </div>
      </div>

      <motion.p
        className="mx-auto mt-4 flex w-fit max-w-xl rounded-full border border-white/10 bg-black/30 px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.28em] backdrop-blur-md"
        animate={{ color: isHovered ? '#d9ff79' : 'rgba(255,255,255,0.35)' }}
        transition={{ duration: 0.35 }}
      >
        {isHovered ? 'hover mode: spreadsheet exorcism' : 'hover the headline'}
      </motion.p>
    </motion.div>
  );
}
