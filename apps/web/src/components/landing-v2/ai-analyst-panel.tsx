'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, SendHorizontal, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { aiCopy, easterEggCopy } from './landing-copy';

const promptHoverCopy = [
  'March revenue went on a tiny vacation. Explain.',
  'Tell me which columns are secretly dating.',
  'Find weird rows before they become meeting drama.',
  'Make a chart a human will not immediately distrust.',
];

export function AIAnalystPanel() {
  return (
    <section id="ai-analyst" className="relative bg-[#05060a] px-4 py-24 text-white md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(240,171,252,0.12),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.12),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.32em] text-fuchsia-200">
            AI ANALYST
          </span>
          <h2 className="mt-4 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.06em] md:text-7xl">
            {aiCopy.headline}
          </h2>
          <Link href="/workspace">
            <Button className="mt-8 h-13 rounded-full bg-fuchsia-200 px-6 font-black text-[#16051c] hover:bg-fuchsia-100">
              {aiCopy.cta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-[2.5rem] border border-white/12 bg-[#0b0d14]/85 shadow-2xl shadow-black/40 backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fuchsia-200 text-[#16051c]">
                <Bot className="h-6 w-6" />
              </span>
              <div>
                <p className="font-black">DataCanvas Analyst</p>
                <p className="text-sm text-white/42">online, caffeinated, judging column names</p>
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-lime-200" />
          </div>

          <div className="space-y-3 p-6">
            {aiCopy.prompts.map((prompt, index) => (
              <motion.div
                key={prompt}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                whileHover={{ x: -8, scale: 1.015 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="group relative ml-auto min-h-12 max-w-[86%] overflow-hidden rounded-3xl rounded-br-md border border-cyan-300/12 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-50"
              >
                <span className="block transition duration-300 group-hover:-translate-y-8 group-hover:opacity-0">
                  {prompt}
                </span>
                <span className="absolute inset-x-5 top-3 translate-y-8 text-lime-100 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {promptHoverCopy[index]}
                </span>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="max-w-[88%] rounded-3xl rounded-bl-md border border-fuchsia-200/15 bg-fuchsia-200/10 px-5 py-4 text-white/78"
            >
              I found three suspicious clusters, two missing-value patterns, and one column named{' '}
              <span className="group relative inline-flex cursor-default text-fuchsia-100 underline decoration-fuchsia-200/40 underline-offset-4">
                misc
                <span className="pointer-events-none absolute left-1/2 top-full mt-2 w-max -translate-x-1/2 translate-y-2 rounded-full border border-fuchsia-200/20 bg-fuchsia-200 px-3 py-1 text-xs font-black text-[#17051b] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
                  {easterEggCopy.misc}
                </span>
              </span>{' '}
              doing crimes.
            </motion.div>
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-white/38">
              <span className="flex-1 text-sm">{'Ask why "misc" has 47 unique personalities...'}</span>
              <SendHorizontal className="h-5 w-5 text-fuchsia-200" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
