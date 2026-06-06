'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { AnimatedStepPreview } from './animated-step-preview';
import { DataPhoenix } from './data-phoenix';
import { DatasetTokenField } from './dataset-token-field';
import { phoenixJourneyCopy } from './landing-copy';
import { ScrollStepCopy } from './scroll-step-copy';

const STEP_COUNT = phoenixJourneyCopy.steps.length;

type JourneyStep = (typeof phoenixJourneyCopy.steps)[number];

function ActiveStepLayer({ step, index }: { step: JourneyStep; index: number }) {
  return (
    <motion.div
      key={step.id}
      initial={{ opacity: 0, y: 26, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute inset-0"
    >
      <ScrollStepCopy step={step} index={index} isActive />
      <AnimatedStepPreview step={step} isActive />
    </motion.div>
  );
}

export function ScrollPhoenixJourney() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const phoenixX = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.72, 0.82, 1],
    [-360, 350, -360, -330, -330, -260, 80],
  );
  const phoenixY = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.72, 0.82, 1],
    [130, -125, -145, 205, 35, 25, 30],
  );
  const phoenixScale = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.72, 0.82, 1],
    [0.72, 0.9, 0.8, 0.92, 0.98, 0.95, 0.9],
  );
  const phoenixRotate = useTransform(
    scrollYProgress,
    [0, 0.2, 0.4, 0.6, 0.72, 0.82, 1],
    [-16, 10, -18, 12, 0, -8, 4],
  );
  const trailOpacity = useTransform(scrollYProgress, [0, 0.15, 0.5, 0.85, 1], [0.18, 0.75, 0.42, 0.85, 0.25]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const stageRotate = useTransform(scrollYProgress, [0, 1], [0, -3]);

  const staticSteps = useMemo(() => phoenixJourneyCopy.steps, []);
  const activeStep = staticSteps[activeIndex] ?? staticSteps[0];

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const nextIndex = Math.min(
      STEP_COUNT - 1,
      Math.max(0, Math.floor(Math.min(0.999, Math.max(0, latest)) * STEP_COUNT)),
    );
    setActiveIndex(nextIndex);
  });

  if (prefersReducedMotion) {
    return (
      <section id="features" className="bg-[#05060a] px-4 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
            {phoenixJourneyCopy.label}
          </p>
          <h2 className="mt-4 text-5xl font-black tracking-[-0.06em] md:text-7xl">
            {phoenixJourneyCopy.headline}
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {staticSteps.map((step) => (
              <article key={step.id} className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: step.color }}>
                  {step.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-black">{step.title}</h3>
                <p className="mt-4 text-white/64">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="features" className="relative bg-[#05060a] text-white lg:h-[470vh]">
      <div className="px-4 py-24 lg:hidden">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">
            {phoenixJourneyCopy.label}
          </p>
          <h2 className="mt-4 text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em]">
            {phoenixJourneyCopy.headline}
          </h2>
          <p className="mt-5 text-white/60">{phoenixJourneyCopy.body}</p>
          <div className="mt-10 space-y-4">
            {staticSteps.map((step) => (
              <article key={step.id} className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6">
                <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color: step.color }}>
                  {step.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-black uppercase tracking-[-0.05em]">{step.title}</h3>
                <p className="mt-3 text-white/62">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-0 hidden h-screen overflow-hidden bg-[#05060a] lg:block">
        <DatasetTokenField progress={scrollYProgress} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_76%,rgba(34,211,238,0.24),transparent_30%),radial-gradient(circle_at_82%_30%,rgba(163,230,53,0.1),transparent_25%),linear-gradient(180deg,rgba(5,6,10,0.02),rgba(5,6,10,0.68)_82%,rgba(5,6,10,0.88))]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.04)_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-35" />

        <motion.div
          className="absolute inset-[8%] rounded-[4rem] border border-white/10 bg-white/[0.025] shadow-2xl shadow-black/40"
          style={{ scale: stageScale, rotate: stageRotate }}
        />

        <div className="absolute left-1/2 top-28 z-30 w-[min(58rem,88vw)] -translate-x-1/2 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.38em] text-cyan-200/70">
            {phoenixJourneyCopy.label}
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase leading-[0.85] tracking-[-0.07em] text-white/90 md:text-6xl">
            {phoenixJourneyCopy.headline}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/48 md:text-base">
            {phoenixJourneyCopy.body}
          </p>
        </div>

        <DataPhoenix
          x={phoenixX}
          y={phoenixY}
          scale={phoenixScale}
          rotate={phoenixRotate}
          trailOpacity={trailOpacity}
        />

        <AnimatePresence>
          <ActiveStepLayer key={activeStep.id} step={activeStep} index={activeIndex} />
        </AnimatePresence>

        <motion.div
          className="absolute bottom-7 left-1/2 z-40 h-1 w-[min(42rem,72vw)] -translate-x-1/2 overflow-hidden rounded-full bg-white/10"
          aria-hidden="true"
        >
          <motion.div
            className="h-full origin-left rounded-full bg-gradient-to-r from-cyan-300 via-lime-300 to-yellow-200"
            style={{ scaleX: scrollYProgress }}
          />
        </motion.div>
      </div>
    </section>
  );
}
