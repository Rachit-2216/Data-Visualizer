'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { easterEggCopy, finalCtaCopy } from './landing-copy';

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#05060a] px-4 py-24 text-white md:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(163,230,53,0.17),transparent_30%),radial-gradient(circle_at_70%_80%,rgba(34,211,238,0.14),transparent_28%)]" />
      <div className="relative mx-auto max-w-5xl rounded-[3rem] border border-white/12 bg-white/[0.065] p-8 text-center shadow-2xl shadow-black/45 backdrop-blur-2xl md:p-14">
        <h2 className="group text-5xl font-black leading-[0.95] tracking-[-0.07em] md:text-8xl">
          {finalCtaCopy.headline.split(' ').map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="inline-block transition duration-300 group-hover:-translate-y-2 group-hover:odd:translate-x-1 group-hover:even:-translate-x-1"
              style={{ transitionDelay: `${index * 18}ms` }}
            >
              {word}&nbsp;
            </span>
          ))}
        </h2>
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/65">{finalCtaCopy.body}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/workspace">
            <Button className="h-14 rounded-full bg-lime-300 px-7 text-base font-black text-[#05060a] hover:bg-lime-200">
              {finalCtaCopy.primaryCta}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="https://github.com/Rachit-2216/Data-Visualizer" target="_blank">
            <Button
              variant="outline"
              className="h-14 rounded-full border-white/15 bg-white/[0.04] px-7 text-base font-bold text-white hover:bg-white/10"
            >
              <BookOpen className="mr-2 h-5 w-5" />
              {finalCtaCopy.secondaryCta}
            </Button>
          </Link>
        </div>
        <p className="group relative mt-8 inline-flex cursor-default font-mono text-xs uppercase tracking-[0.24em] text-white/35">
          <span className="transition group-hover:text-lime-200">{finalCtaCopy.footer}</span>
          <span className="pointer-events-none absolute left-1/2 top-full mt-3 w-max -translate-x-1/2 translate-y-2 rounded-full border border-lime-300/20 bg-lime-300 px-4 py-2 text-[10px] font-black text-[#05060a] opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
            {easterEggCopy.footer}
          </span>
        </p>
      </div>
    </section>
  );
}
