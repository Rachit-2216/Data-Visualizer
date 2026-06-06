'use client';

import { motion } from 'framer-motion';
import { phoenixJourneyCopy } from './landing-copy';

type JourneyStep = (typeof phoenixJourneyCopy.steps)[number];

type ScrollStepCopyProps = {
  step: JourneyStep;
  index: number;
  isActive: boolean;
};

const COPY_POSITIONS: Record<string, string> = {
  upload: 'left-[6vw] top-[54%] w-[min(31rem,34vw)] -translate-y-1/2',
  profile: 'right-[5vw] bottom-[5.8rem] w-[min(31rem,33vw)] translate-y-0',
  visualize: 'left-[5vw] top-[51%] w-[min(29rem,31vw)] -translate-y-1/2',
  ask: 'right-[5vw] bottom-[3rem] w-[min(30rem,32vw)] translate-y-0',
  train: 'left-[6vw] top-[55%] w-[min(31rem,34vw)] -translate-y-1/2',
};

const HEADLINE_SIZE: Record<string, string> = {
  visualize: 'text-[clamp(2.25rem,3.25vw,4rem)] leading-[0.92] tracking-[-0.045em]',
  ask: 'text-[clamp(2rem,2.85vw,3.45rem)] leading-[0.98] tracking-[-0.035em]',
};

function headlineClass(stepId?: string, fallback = 'text-[clamp(2.7rem,4.05vw,5rem)] leading-[0.88] tracking-[-0.052em]') {
  return `${HEADLINE_SIZE[stepId ?? ''] ?? fallback} font-black uppercase text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.78)]`;
}

function ChunkDropHeadline({ text, isActive, stepId }: { text: string; isActive: boolean; stepId?: string }) {
  return (
    <h3 className={headlineClass(stepId)}>
      {text.split(' ').map((word, index) => (
        <span key={`${word}-${index}`} className="mr-3 inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            animate={isActive ? { y: 0, rotate: 0, opacity: 1 } : { y: 48, rotate: 4, opacity: 0.25 }}
            transition={{ duration: 0.42, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h3>
  );
}

function ScanHeadline({ text, isActive, color, stepId }: { text: string; isActive: boolean; color: string; stepId?: string }) {
  return (
    <div className="relative overflow-hidden">
      <h3 className={headlineClass(stepId)}>
        {text}
      </h3>
      <motion.span
        className="absolute inset-y-0 w-16 blur-md"
        style={{ backgroundColor: color }}
        animate={isActive ? { left: ['-20%', '110%'], opacity: [0, 0.5, 0] } : { left: '-20%', opacity: 0 }}
        transition={{ duration: 1.2, repeat: isActive ? Infinity : 0, repeatDelay: 0.7 }}
      />
    </div>
  );
}

function BarHeadline({ text, isActive, color, stepId }: { text: string; isActive: boolean; color: string; stepId?: string }) {
  return (
    <div>
      <h3 className={headlineClass(stepId)}>
        {text}
      </h3>
      <div className="mt-5 flex h-10 items-end gap-2">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.span
            key={index}
            className="w-3 rounded-t-full"
            style={{ backgroundColor: color }}
            animate={{ height: isActive ? 8 + ((index * 17) % 32) : 3, opacity: isActive ? 0.9 : 0.25 }}
            transition={{ duration: 0.35, delay: index * 0.015 }}
          />
        ))}
      </div>
    </div>
  );
}

function TypedHeadline({ text, isActive, stepId }: { text: string; isActive: boolean; stepId?: string }) {
  return (
    <h3 className={`font-mono ${headlineClass(stepId, 'text-[clamp(2.35rem,3.35vw,4.25rem)] leading-[1.02] tracking-[-0.035em]')}`}>
      <span className="text-fuchsia-200">&gt; </span>
      {isActive ? text : text.slice(0, Math.max(8, Math.floor(text.length * 0.38)))}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.7, repeat: Infinity }}
        className="text-fuchsia-200"
      >
        _
      </motion.span>
    </h3>
  );
}

function MetricHeadline({ text, isActive }: { text: string; isActive: boolean }) {
  return (
    <div>
      <h3 className={headlineClass()}>
        {text}
      </h3>
      <div className="mt-5 flex gap-3 font-mono text-sm uppercase tracking-[0.2em] text-yellow-100/70">
        {['acc .91', 'f1 .88', 'drift low'].map((metric, index) => (
          <motion.span
            key={metric}
            className="rounded-full border border-yellow-200/20 bg-yellow-200/10 px-3 py-2"
            animate={{ y: isActive ? [12, 0] : 0, opacity: isActive ? 1 : 0.35 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
          >
            {metric}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export function ScrollStepCopy({ step, index, isActive }: ScrollStepCopyProps) {
  const positionClass = COPY_POSITIONS[step.id] ?? COPY_POSITIONS.upload;
  const renderHeadline = () => {
    if (step.animation === 'scan-line') return <ScanHeadline text={step.headline} isActive={isActive} color={step.color} stepId={step.id} />;
    if (step.animation === 'bars-grow') return <BarHeadline text={step.headline} isActive={isActive} color={step.color} stepId={step.id} />;
    if (step.animation === 'type-chat') return <TypedHeadline text={step.headline} isActive={isActive} stepId={step.id} />;
    if (step.animation === 'metric-rings') return <MetricHeadline text={step.headline} isActive={isActive} />;
    return <ChunkDropHeadline text={step.headline} isActive={isActive} stepId={step.id} />;
  };

  return (
    <motion.article
      animate={{
        opacity: isActive ? 1 : 0.22,
        scale: isActive ? 1 : 0.94,
        x: isActive ? 0 : index % 2 === 0 ? -40 : 40,
        filter: isActive ? 'blur(0px)' : 'blur(1.5px)',
      }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-50 ${positionClass}`}
    >
      <div className="max-h-[72vh] overflow-visible rounded-[2rem] border border-white/14 bg-[#05060a]/92 p-6 shadow-2xl shadow-black/75 backdrop-blur-2xl">
      <div className="mb-5 flex items-center gap-3">
        <span
          className="rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-[0.24em]"
          style={{ borderColor: `${step.color}55`, color: step.color, backgroundColor: `${step.color}14` }}
        >
          {step.eyebrow}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.24em] text-white/30">
          {String(index + 1).padStart(2, '0')} / 05
        </span>
      </div>
      {renderHeadline()}
      <p className="mt-5 text-base font-semibold leading-7 text-white/88 drop-shadow-[0_2px_16px_rgba(0,0,0,0.85)]">{step.body}</p>
      <p className="mt-6 inline-flex rounded-full border border-white/14 bg-black/55 px-5 py-3 font-semibold text-white/86 shadow-xl shadow-black/30">
        {step.punchline}
      </p>
      </div>
    </motion.article>
  );
}
