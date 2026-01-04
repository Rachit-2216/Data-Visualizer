'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BarChart3, Sparkles, Activity, Layers, Zap } from 'lucide-react';

export default function LandingPage() {
  const [activePulse, setActivePulse] = useState(0);

  const pulses = useMemo(
    () => [
      'Neural mesh aligned with dataset schema',
      'Auto-profiling 81 charts in 43s',
      'Model topology parsed from 120 lines',
    ],
    []
  );

  useEffect(() => {
    const id = setInterval(() => {
      setActivePulse((prev) => (prev + 1) % pulses.length);
    }, 3200);
    return () => clearInterval(id);
  }, [pulses.length]);

  return (
    <div className="min-h-screen bg-[#05080f] text-white">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-transparent blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[420px] w-[520px] rounded-full bg-gradient-to-br from-amber-500/10 via-orange-400/10 to-transparent blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#05080f]/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <BarChart3 className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] text-white/50">DATACANVAS</p>
              <p className="text-sm font-semibold text-white">Neural Workspace</p>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-white/60 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-cyan-400"
            >
              <Sparkles className="h-4 w-4" />
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-16 lg:pt-24">
        <div className="max-w-3xl space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
            Orbit-aware dataset intelligence
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Decode datasets and model logic in a single orbital workspace.
          </h1>

          {/* Description */}
          <p className="max-w-xl text-base text-white/70 sm:text-lg">
            DataCanvas orchestrates 80+ visual probes, live profiling signals, and neural
            architecture maps. Upload data, paste ML code, and watch the mesh respond to your
            cursor.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              Launch the workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              View the live demo
            </Link>
          </div>

          {/* Stats */}
          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-3">
            {[
              { label: 'Mesh Latency', value: '42ms', icon: Activity },
              { label: 'Signals', value: '81 charts', icon: Zap },
              { label: 'Models Parsed', value: '14 types', icon: Layers },
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <stat.icon className="h-4 w-4 text-cyan-300" />
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-xl font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live Signal Box */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40 mb-2">Live signal</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={activePulse}
              className="text-lg text-cyan-200"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {pulses[activePulse]}
            </motion.p>
          </AnimatePresence>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Auto-EDA Constellations',
              desc: '81 declarative probes across distributions, correlation networks, and drift signals.',
            },
            {
              title: '3D Model Orbits',
              desc: 'Neural and regression structures rendered in cinematic, interactive canvases.',
            },
            {
              title: 'Natural Language Control',
              desc: 'English-to-chart assistant with saved prompt collections and execution history.',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.05] hover:-translate-y-1"
            >
              <p className="text-sm font-semibold text-white">{card.title}</p>
              <p className="mt-2 text-sm text-white/60">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
