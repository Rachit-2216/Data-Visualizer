'use client';

import { motion } from 'framer-motion';
import { phoenixJourneyCopy } from './landing-copy';

type JourneyStep = (typeof phoenixJourneyCopy.steps)[number];

type AnimatedStepPreviewProps = {
  step: JourneyStep;
  isActive: boolean;
};

const PREVIEW_POSITIONS: Record<string, string> = {
  upload: 'right-[6vw] bottom-[7rem]',
  profile: 'left-[4vw] bottom-[4.75rem]',
  visualize: 'right-[5vw] bottom-[7rem]',
  ask: 'left-[5vw] bottom-[7rem]',
  train: 'right-[5vw] bottom-[7rem]',
};

export function AnimatedStepPreview({ step, isActive }: AnimatedStepPreviewProps) {
  const positionClass = PREVIEW_POSITIONS[step.id] ?? PREVIEW_POSITIONS.upload;

  return (
    <motion.div
      key={step.id}
      animate={{
        opacity: isActive ? 1 : 0,
        y: isActive ? 0 : 36,
        rotateX: isActive ? 0 : 12,
        scale: isActive ? 1 : 0.94,
      }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className={`absolute z-20 w-[min(42rem,47vw)] rounded-[2rem] border border-white/12 bg-[#090b11]/92 p-5 shadow-2xl shadow-black/55 backdrop-blur-2xl ${positionClass}`}
      style={{ pointerEvents: isActive ? 'auto' : 'none' }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.26em]" style={{ color: step.color }}>
            {step.previewTitle}
          </p>
          <p className="mt-1 text-sm text-white/42">{step.previewMeta}</p>
        </div>
        <div className="flex gap-2">
          {step.tokens.slice(0, 3).map((token) => (
            <span
              key={token}
              className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-mono text-xs uppercase text-white/52"
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      <div className="relative h-36 overflow-hidden rounded-3xl border border-white/10 bg-black/35 p-4">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:28px_28px]" />

        {step.animation === 'type-chat' ? (
          <div className="relative space-y-3">
            {['Why did revenue dip?', 'Found 3 outliers and one suspicious "misc".'].map((line, index) => (
              <motion.div
                key={line}
                animate={{ opacity: isActive ? 1 : 0, x: isActive ? 0 : index ? -20 : 20 }}
                transition={{ delay: index * 0.15 }}
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${
                  index ? 'bg-fuchsia-200/12 text-fuchsia-50' : 'ml-auto bg-cyan-300/12 text-cyan-50'
                }`}
              >
                {line}
              </motion.div>
            ))}
          </div>
        ) : step.animation === 'metric-rings' ? (
          <div className="relative flex h-full items-center justify-center gap-7">
            {['91', '88', '03'].map((value, index) => (
              <motion.div
                key={value}
                className="grid h-24 w-24 place-items-center rounded-full border-4 border-yellow-200/25 font-mono text-2xl font-black text-yellow-100"
                animate={{ rotate: isActive ? 360 : 0, borderColor: isActive ? step.color : 'rgba(250,204,21,0.25)' }}
                transition={{ duration: 1.4 + index * 0.2, repeat: isActive ? Infinity : 0, ease: 'linear' }}
              >
                {value}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="relative flex h-full items-end gap-2">
            {Array.from({ length: 22 }).map((_, index) => (
              <motion.span
                key={index}
                className="flex-1 rounded-t-lg"
                style={{ backgroundColor: step.color }}
                animate={{ height: isActive ? 16 + ((index * 23) % 96) : 8, opacity: isActive ? 0.8 : 0.18 }}
                transition={{ duration: 0.45, delay: index * 0.018 }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
