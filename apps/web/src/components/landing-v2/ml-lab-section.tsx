'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { mlCopy } from './landing-copy';

export function MLLabSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const ringRotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const ringScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.08, 0.9]);

  return (
    <section ref={sectionRef} id="ml-lab" className="relative overflow-hidden bg-[#05060a] px-4 py-24 text-white md:py-32">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(250,204,21,0.09),transparent)]" />
      <motion.div
        className="absolute right-[-8rem] top-12 h-[34rem] w-[34rem] rounded-full border border-yellow-200/15"
        style={{ rotate: ringRotate, scale: ringScale }}
        aria-hidden="true"
      >
        <div className="absolute inset-10 rounded-full border border-cyan-200/10" />
        <div className="absolute inset-24 rounded-full border border-lime-200/10" />
        <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-yellow-200 shadow-[0_0_24px_rgba(250,204,21,0.75)]" />
      </motion.div>
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
        >
          <span className="font-mono text-xs uppercase tracking-[0.32em] text-yellow-200">ML LAB</span>
          <h2 className="mt-4 max-w-4xl text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
            {mlCopy.headline}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">{mlCopy.body}</p>
          <p className="mt-8 inline-flex rounded-full border border-yellow-200/20 bg-yellow-200/10 px-5 py-3 text-yellow-50">
            {mlCopy.microcopy}
          </p>
        </motion.div>

        <div className="grid gap-4">
          {mlCopy.bullets.map((bullet, index) => {
            const Icon = bullet.icon;
            return (
              <motion.div
                key={bullet.label}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ x: -8, scale: 1.015 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="group flex items-center gap-5 rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 backdrop-blur-xl"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-200/12 text-yellow-200 transition group-hover:bg-yellow-200 group-hover:text-[#161203]">
                  <Icon className="h-7 w-7" />
                </span>
                <span className="flex-1 text-xl font-black tracking-[-0.03em]">{bullet.label}</span>
                <CheckCircle2 className="h-5 w-5 text-lime-200" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
