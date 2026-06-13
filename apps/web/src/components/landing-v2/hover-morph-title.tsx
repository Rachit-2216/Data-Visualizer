'use client';

import { useRef, useState } from 'react';
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
  const titleRef = useRef<HTMLDivElement>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [lens, setLens] = useState({ x: 0, y: 0 });
  const shouldReduceMotion = useReducedMotion();
  const lensSize = shouldReduceMotion ? 170 : 210;
  const lensRadius = lensSize / 2;
  const baseMask = isRevealing
    ? `radial-gradient(circle ${lensRadius + 4}px at ${lens.x}px ${lens.y}px, transparent 0 ${lensRadius - 2}px, #000 ${lensRadius + 6}px)`
    : undefined;

  const moveLens = (clientX: number, clientY: number) => {
    const rect = titleRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLens({
      x: Math.max(0, Math.min(rect.width, clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, clientY - rect.top)),
    });
  };

  const centerLens = () => {
    const rect = titleRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLens({ x: rect.width * 0.48, y: rect.height * 0.54 });
  };

  const renderLines = (lines: string[], variant: 'base' | 'secret') =>
    lines.map((line, lineIndex) => (
      <span key={`${variant}-${line}`} className="block whitespace-nowrap">
        {line.split('').map((char, charIndex) => (
          <motion.span
            key={`${variant}-${line}-${charIndex}`}
            className="inline-block"
            animate={
              shouldReduceMotion
                ? false
                : variant === 'base' && isRevealing
                  ? {
                      y: charIndex % 2 === 0 ? -2 : 2,
                      x: (charIndex % 3) - 1,
                    }
                  : { y: 0, x: 0 }
            }
            transition={{ duration: 0.22, delay: lineIndex * 0.02 + charIndex * 0.004 }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </span>
    ));

  return (
    <motion.div
      onMouseEnter={(event) => {
        setIsRevealing(true);
        moveLens(event.clientX, event.clientY);
      }}
      onMouseMove={(event) => moveLens(event.clientX, event.clientY)}
      onMouseLeave={() => setIsRevealing(false)}
      onFocus={() => {
        setIsRevealing(true);
        centerLens();
      }}
      onBlur={() => setIsRevealing(false)}
      tabIndex={0}
      className={`group relative isolate cursor-default overflow-visible ${className ?? ''}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`${baseLines.join(' ')}. Hover text: ${hoverLines.join(' ')}`}
    >
      {eyebrow ? (
        <motion.div
          className="mb-4 text-center font-mono text-xs uppercase tracking-[0.6em] text-white/52 md:text-sm"
          animate={{ color: isRevealing ? '#eaffb5' : 'rgba(255,255,255,0.52)' }}
          transition={{ duration: 0.35 }}
        >
          {eyebrow}
        </motion.div>
      ) : null}

      <div
        ref={titleRef}
        className="relative overflow-hidden py-3 text-center text-[clamp(3.2rem,7.25vw,8rem)] font-black uppercase leading-[0.82] tracking-[-0.075em]"
      >
        <motion.div
          className="relative z-20 text-[#8be9ff] drop-shadow-[0_5px_30px_rgba(0,0,0,0.82)]"
          style={{
            WebkitMaskImage: baseMask,
            maskImage: baseMask,
          }}
          animate={{
            opacity: 1,
            textShadow: isRevealing
              ? '0.055em 0 rgba(34,211,238,0.2), -0.055em 0 rgba(190,242,100,0.16)'
              : '0 0 rgba(0,0,0,0)',
          }}
          transition={{ duration: 0.22 }}
        >
          {renderLines(baseLines, 'base')}
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#05060a]/18 drop-shadow-[0_4px_24px_rgba(0,0,0,0.98)] [-webkit-text-stroke:1px_rgba(5,6,10,0.82)]"
          style={{
            color: accent,
            clipPath: isRevealing
              ? `circle(${lensRadius}px at ${lens.x}px ${lens.y}px)`
              : `circle(0px at ${lens.x}px ${lens.y}px)`,
          }}
          animate={{ opacity: isRevealing ? 1 : 0 }}
          transition={{ duration: 0.12 }}
        >
          {renderLines(hoverLines, 'secret')}
        </motion.div>

        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute z-40 rounded-full border border-lime-200/80 bg-cyan-300/14 shadow-[0_0_35px_rgba(34,211,238,0.35),inset_0_0_28px_rgba(190,242,100,0.14)] backdrop-blur-[1px]"
          animate={{
            opacity: isRevealing ? 1 : 0,
            scale: isRevealing ? 1 : 0.72,
            x: lens.x - lensSize / 2,
            y: lens.y - lensSize / 2,
          }}
          transition={{
            opacity: { duration: 0.14 },
            scale: { duration: 0.18 },
            x: { type: 'spring', stiffness: 420, damping: 36, mass: 0.45 },
            y: { type: 'spring', stiffness: 420, damping: 36, mass: 0.45 },
          }}
          style={{ width: lensSize, height: lensSize }}
        />
      </div>

      <motion.p
        className="mx-auto mt-4 flex w-fit max-w-xl rounded-full border border-white/10 bg-black/35 px-4 py-2 text-center font-mono text-xs uppercase tracking-[0.28em] backdrop-blur-md"
        animate={{ color: isRevealing ? '#d9ff79' : 'rgba(255,255,255,0.38)' }}
        transition={{ duration: 0.35 }}
      >
        {isRevealing ? 'lens mode: spreadsheet exorcism' : 'hover the headline'}
      </motion.p>
    </motion.div>
  );
}
