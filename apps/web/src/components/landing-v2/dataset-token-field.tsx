'use client';

import { motion, MotionValue, useTransform } from 'framer-motion';
import { phoenixJourneyCopy } from './landing-copy';

type DatasetTokenFieldProps = {
  progress: MotionValue<number>;
};

const BASE_TOKENS = ['CSV', 'JSON', 'NULL', 'corr', 'R²', 'F1', 'XLSX', 'schema', 'AUC', 'misc'];

export function DatasetTokenField({ progress }: DatasetTokenFieldProps) {
  const drift = useTransform(progress, [0, 1], ['0%', '-38%']);
  const rotate = useTransform(progress, [0, 1], [0, -8]);
  const gridScale = useTransform(progress, [0, 1], [1, 1.45]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="absolute inset-[-20%] bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40"
        style={{ scale: gridScale, rotate }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 flex w-[160%] items-center gap-5"
        style={{ x: drift }}
      >
        {Array.from({ length: 34 }).map((_, index) => {
          const token = BASE_TOKENS[index % BASE_TOKENS.length];
          const vertical = ((index * 37) % 78) - 39;
          return (
            <span
              key={`${token}-${index}`}
              className="rounded-full border border-cyan-300/10 bg-cyan-300/[0.035] px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-cyan-100/28"
              style={{ transform: `translateY(${vertical}vh)` }}
            >
              {token}
            </span>
          );
        })}
      </motion.div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(5,6,10,0.18)_42%,#05060a_86%)]" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-white/24">
        {phoenixJourneyCopy.label}
      </div>
    </div>
  );
}
