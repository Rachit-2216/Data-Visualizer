'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { HeroCanvasResponsive } from './hero-canvas-responsive';
import { GradientOrbs } from './gradient-orbs';
import { useMousePosition } from './use-mouse-position';
import { Button } from '@/components/ui/button';

type HeroSectionProps = {
  scrollProgress: number;
};

export function HeroSection({ scrollProgress }: HeroSectionProps) {
  const { x: mouseX, y: mouseY } = useMousePosition(0.08);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const titleOffset = scrollProgress * 100;
  const subtitleOffset = scrollProgress * 150;
  const ctaOffset = scrollProgress * 200;

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroCanvasResponsive mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />
      <GradientOrbs />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, #030712 70%)',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div
          className={`
            inline-flex items-center gap-2 px-4 py-2 mb-8
            rounded-full border border-white/10 bg-white/5 backdrop-blur-sm
            text-sm text-white/70
            transition-all duration-1000 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{
            transitionDelay: '200ms',
            transform: `translateY(${-titleOffset * 0.3}px)`,
          }}
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Now with AI-powered insights</span>
          <ArrowRight className="w-3 h-3" />
        </div>

        <h1
          className={`
            text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6
            transition-all duration-1000 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{
            transitionDelay: '400ms',
            transform: `translateY(${-titleOffset}px)`,
          }}
        >
          <span className="text-white">Visualize Data.</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Train Models.
          </span>
          <br />
          <span className="text-white">No Code.</span>
        </h1>

        <p
          className={`
            text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10
            transition-all duration-1000 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{
            transitionDelay: '600ms',
            transform: `translateY(${-subtitleOffset}px)`,
          }}
        >
          Upload your dataset and instantly get interactive visualizations, AI-powered analysis, and
          one-click machine learning. Built for analysts, scientists, and curious minds.
        </p>

        <div
          className={`
            flex flex-col sm:flex-row items-center justify-center gap-4
            transition-all duration-1000 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{
            transitionDelay: '800ms',
            transform: `translateY(${-ctaOffset}px)`,
          }}
        >
          <Link href="/workspace">
            <Button
              size="lg"
              className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105"
            >
              Start Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="lg"
            className="h-14 px-8 text-lg font-semibold border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 transition-all duration-300 hover:scale-105"
          >
            <Play className="mr-2 w-5 h-5" />
            Watch Demo
          </Button>
        </div>

        <div
          className={`
            mt-16 flex items-center justify-center gap-8 text-white/40 text-sm
            transition-all duration-1000 ease-out
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: '1000ms' }}
        >
          <span>No credit card required</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>Free tier available</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>Setup in 30 seconds</span>
        </div>
      </div>

      <div
        className={`
          absolute bottom-8 left-1/2 -translate-x-1/2
          flex flex-col items-center gap-2
          transition-all duration-1000 ease-out
          ${isVisible && scrollProgress < 0.1 ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ transitionDelay: '1200ms' }}
      >
        <span className="text-white/40 text-xs uppercase tracking-widest">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-white/60 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
