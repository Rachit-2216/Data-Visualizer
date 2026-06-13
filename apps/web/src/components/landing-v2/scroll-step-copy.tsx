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
  upload: 'left-[5vw] bottom-[5rem] w-[min(30rem,31vw)] translate-y-0',
  profile: 'right-[5vw] bottom-[5.25rem] w-[min(31rem,32vw)] translate-y-0',
  visualize: 'left-[5vw] bottom-[4.75rem] w-[min(28rem,30vw)] translate-y-0',
  ask: 'right-[5vw] top-[40%] w-[min(30rem,32vw)] -translate-y-0',
  train: 'left-[5vw] bottom-[4.75rem] w-[min(30rem,32vw)] translate-y-0',
};

const HEADLINE_SIZE: Record<string, string> = {
  upload: 'text-[clamp(2.15rem,3vw,3.55rem)] leading-[0.92] tracking-[-0.045em]',
  profile: 'text-[clamp(2.2rem,3vw,3.6rem)] leading-[0.92] tracking-[-0.045em]',
  visualize: 'text-[clamp(1.95rem,2.55vw,3.05rem)] leading-[0.95] tracking-[-0.04em]',
  ask: 'text-[clamp(1.9rem,2.55vw,3.2rem)] leading-[0.98] tracking-[-0.035em]',
  train: 'text-[clamp(2rem,2.75vw,3.25rem)] leading-[0.95] tracking-[-0.04em]',
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
      <h3 className={headlineClass('train')}>
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
      className={`absolute z-[70] ${positionClass}`}
    >
      <div className="max-h-[calc(100vh-10rem)] overflow-hidden rounded-[2rem] border border-white/18 bg-[#05060a]/96 p-5 shadow-2xl shadow-black/80 backdrop-blur-2xl">
      <div className="mb-4 flex items-center gap-3">
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
      <p className="mt-4 text-[0.96rem] font-semibold leading-7 text-white/90 drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">{step.body}</p>
      <p className="mt-5 inline-flex rounded-full border border-white/16 bg-black/65 px-4 py-2.5 text-[0.94rem] font-semibold text-white/88 shadow-xl shadow-black/35">
        {step.punchline}
      </p>
      </div>
    </motion.article>
  );
}
