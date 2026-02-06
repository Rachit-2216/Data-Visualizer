'use client';

import { useRef, useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { gsap } from 'gsap';
import { Users, Database, BarChart3, Cpu } from 'lucide-react';

type StatItem = {
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  color: string;
};

const STATS: StatItem[] = [
  { icon: Users, value: 50000, suffix: '+', label: 'Active Users', color: '#0ea5e9' },
  { icon: Database, value: 10, suffix: 'M+', label: 'Datasets Analyzed', color: '#8b5cf6' },
  { icon: BarChart3, value: 100, suffix: 'M+', label: 'Charts Generated', color: '#10b981' },
  { icon: Cpu, value: 500000, suffix: '+', label: 'ML Models Trained', color: '#f59e0b' },
];

function AnimatedCounter({ value, suffix, duration = 2, startOnView = true }: { value: number; suffix: string; duration?: number; startOnView?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const { ref, inView } = useInView({ threshold: 0.5, triggerOnce: true });

  useEffect(() => {
    if (!inView && startOnView) return;

    const obj = { value: 0 };
    gsap.to(obj, {
      value,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        setDisplayValue(Math.floor(obj.value));
      },
    });
  }, [inView, value, duration, startOnView]);

  const formatted = displayValue.toLocaleString();

  return (
    <span ref={ref}>
      <span>{formatted}</span>
      {suffix}
    </span>
  );
}

function StatCard({ stat, index }: { stat: StatItem; index: number }) {
  const Icon = stat.icon;
  const { ref, inView } = useInView({ threshold: 0.3, triggerOnce: true });

  return (
    <div
      ref={ref}
      className={`
        relative p-8 rounded-2xl
        bg-gradient-to-br from-white/5 to-transparent
        border border-white/10
        backdrop-blur-sm
        transition-all duration-700
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
        style={{
          background: `linear-gradient(135deg, ${stat.color}20, transparent)`,
          border: `1px solid ${stat.color}30`,
        }}
      >
        <Icon className="w-7 h-7" style={{ color: stat.color }} />
      </div>

      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
      </div>

      <div className="text-white/60">{stat.label}</div>

      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{
          background: `radial-gradient(ellipse at center, ${stat.color}10, transparent 70%)`,
        }}
      />
    </div>
  );
}

export function StatsSection() {
  const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: true });

  return (
    <section
      ref={ref}
      className="relative py-32 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #030712 0%, #0a0f1a 50%, #030712 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-20"
          style={{
            background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div
          className={`
            text-center mb-16
            transition-all duration-1000
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Trusted by Data Teams Worldwide</h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Join thousands of analysts, scientists, and engineers who use DataCanvas to understand their
            data faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, index) => (
            <StatCard key={stat.label} stat={stat} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
