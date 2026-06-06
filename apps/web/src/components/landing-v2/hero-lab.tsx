'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, MousePointer2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { heroCopy } from './landing-copy';
import { HoverMorphTitle } from './hover-morph-title';
import { easterEggCopy } from './landing-copy';
import { HoverRevealCopy } from './motion-primitives';

const DataConstellationScene = dynamic(
  () => import('./data-constellation-scene').then((mod) => mod.DataConstellationScene),
  { ssr: false },
);

export function HeroLab() {
  const [cellMessage, setCellMessage] = useState('3 columns suspicious');
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.72], [1, 0.18]);
  const mockupY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const mockupRotate = useTransform(scrollYProgress, [0, 1], [0, -7]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[112vh] overflow-hidden bg-[#05060a] px-4 pt-28 text-white md:pt-32"
    >
      <DataConstellationScene />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.22),transparent_32%),linear-gradient(180deg,rgba(5,6,10,0.2),#05060a_88%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.05)_45%,transparent_47%)] opacity-60" />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-10 pb-14 lg:grid-cols-[1.1fr_0.9fr]"
      >
        <div>
          <HoverMorphTitle
            baseLines={['THROW DATA', 'AT IT']}
            hoverLines={['TAME BAD', 'FILES FAST']}
            accent="#22d3ee"
            className="-mx-3 max-w-5xl"
          />

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-7 max-w-2xl text-lg leading-8 text-white/68 md:text-xl"
          >
            {heroCopy.subheadline}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link href="/workspace">
              <Button
                size="lg"
                className="h-14 rounded-full bg-cyan-300 px-7 text-base font-black text-[#05060a] shadow-[0_0_40px_rgba(34,211,238,0.28)] hover:bg-cyan-200"
              >
                {heroCopy.primaryCta}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                size="lg"
                variant="outline"
                className="h-14 rounded-full border-white/15 bg-white/[0.05] px-7 text-base font-bold text-white backdrop-blur-xl hover:bg-white/10"
              >
                <Play className="mr-2 h-5 w-5" />
                {heroCopy.secondaryCta}
              </Button>
            </a>
          </motion.div>
        </div>

          <motion.div
          style={{ y: mockupY, rotate: mockupRotate }}
          initial={{ opacity: 0, x: 35 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden min-h-[520px] lg:block"
        >
          <div className="absolute right-0 top-5 w-[28rem] rotate-2 rounded-[2rem] border border-white/12 bg-white/[0.06] p-5 shadow-2xl shadow-black/45 backdrop-blur-2xl">
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-lime-200">
                dataset autopsy
              </span>
              <span className="rounded-full bg-red-400/15 px-3 py-1 text-xs text-red-100">
                {cellMessage}
              </span>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {Array.from({ length: 88 }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    if (index % 17 === 0 || index % 11 === 0) {
                      setCellMessage(easterEggCopy.suspiciousCell);
                      window.setTimeout(() => setCellMessage('3 columns suspicious'), 2600);
                    }
                  }}
                  aria-label={`dataset cell ${index + 1}`}
                  className={`h-8 rounded-lg border ${
                    index % 17 === 0
                      ? 'border-lime-300/40 bg-lime-300/25 hover:scale-110 hover:bg-lime-300/45'
                      : index % 11 === 0
                        ? 'border-fuchsia-300/35 bg-fuchsia-300/18 hover:scale-110 hover:bg-fuchsia-300/35'
                        : 'border-cyan-300/14 bg-cyan-300/8 hover:bg-cyan-300/16'
                  } transition`}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-8 left-0 max-w-sm -rotate-3 rounded-[2rem] border border-lime-300/25 bg-[#10190b]/80 p-6 shadow-2xl shadow-lime-950/50 backdrop-blur-2xl">
            <div className="mb-4 flex items-center gap-2 text-lime-200">
              <MousePointer2 className="h-4 w-4" />
              <span className="font-mono text-xs uppercase tracking-[0.24em]">hover truth serum</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {heroCopy.orbitBadges.map((badge) => (
                <HoverRevealCopy key={badge.id} label={badge.label} detail={badge.detail} />
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="relative z-10 mx-auto mb-8 flex max-w-7xl items-center gap-4 text-xs uppercase tracking-[0.26em] text-white/40">
        <span>{heroCopy.scrollHint}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
      </div>
    </section>
  );
}
