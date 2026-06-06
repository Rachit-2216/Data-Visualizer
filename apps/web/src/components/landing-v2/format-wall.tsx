'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { easterEggCopy, formatsCopy } from './landing-copy';
import { MeasuredMarquee } from './motion-primitives';

type FormatCardProps = {
  card: (typeof formatsCopy.cards)[number];
  index: number;
};

function FormatCard({ card, index }: FormatCardProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const timerRef = useRef<number | null>(null);
  const Icon = card.icon;

  const startLongHover = () => {
    if (card.format !== 'CSV') return;
    timerRef.current = window.setTimeout(() => setIsUnlocked(true), 900);
  };

  const stopLongHover = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28, rotate: index % 2 ? 1.5 : -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: index % 2 ? -1 : 1 }}
      whileHover={{ y: -12, rotate: 0, scale: 1.03 }}
      onMouseEnter={startLongHover}
      onMouseLeave={stopLongHover}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group min-h-72 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl"
    >
      <div className="mb-10 flex items-center justify-between">
        <Icon className="h-7 w-7 text-cyan-200 transition group-hover:text-lime-200" />
        <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-white/50">
          suspect {index + 1}
        </span>
      </div>
      <h3 className="text-5xl font-black tracking-[-0.08em] text-white">{card.format}</h3>
      <div className="relative mt-5 min-h-12 overflow-hidden text-white/62">
        <p className="transition duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
          {card.label}
        </p>
        <p className="absolute inset-0 translate-y-8 text-lime-200 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {isUnlocked ? easterEggCopy.csvLongHover : card.hoverLabel}
        </p>
      </div>
      <div className="mt-8 h-20 rounded-2xl border border-cyan-300/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),transparent_45%),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:auto,12px_12px] transition group-hover:border-lime-300/25 group-hover:bg-lime-300/10" />
    </motion.article>
  );
}

export function FormatWall() {
  return (
    <section id="formats" className="relative overflow-hidden bg-[#05060a] px-4 py-24 text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-cyan-200">SUPPORTED FILES</p>
            <h2 className="mt-4 text-5xl font-black tracking-[-0.06em] md:text-7xl">
              {formatsCopy.headline}
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-white/60 lg:justify-self-end">
            {formatsCopy.body}
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {formatsCopy.cards.map((card, index) => (
            <FormatCard key={card.format} card={card} index={index} />
          ))}
        </div>

        <div className="mt-12">
          <MeasuredMarquee items={formatsCopy.cards.map((card) => `${card.format} accepted`)} />
        </div>
        <p className="mt-8 text-center text-sm text-white/44">{formatsCopy.footer}</p>
      </div>
    </section>
  );
}
