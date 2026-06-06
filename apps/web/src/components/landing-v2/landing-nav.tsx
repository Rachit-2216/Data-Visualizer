'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navLinks } from './landing-copy';

export function LandingNav() {
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 right-0 top-0 z-50 px-4 py-4"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-[#05060a]/70 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-2xl md:px-5">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-300 text-[#05060a] shadow-[0_0_35px_rgba(34,211,238,0.35)] transition group-hover:rotate-12">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-black tracking-tight text-white">DataCanvas</span>
        </Link>

        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm text-white/62 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <Link href="/workspace">
          <Button className="rounded-full bg-lime-300 px-5 text-sm font-black text-[#05060a] hover:bg-lime-200">
            Open Workspace
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </nav>
    </motion.header>
  );
}
