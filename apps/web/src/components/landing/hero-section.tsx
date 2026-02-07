'use client';

import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import { SpaceJumpVideo } from './space-jump-video';
import { useScrollAccelerator } from './scroll-accelerator';
import { Button } from '@/components/ui/button';

type HeroSectionProps = {
  scrollProgress: number;
};

const SpaceTimeScene = dynamic(
  () => import('./space-time-scene').then((mod) => mod.SpaceTimeScene),
  { ssr: false },
);

export function HeroSection({ scrollProgress }: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const warpRef = useRef(0);
  const velocityRef = useRef(0);

  useScrollAccelerator({
    triggerRef: containerRef,
    videoRef,
    onProgress: (progress, velocity) => {
      warpRef.current = progress;
      velocityRef.current = velocity;
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen overflow-hidden">
      <SpaceJumpVideo className="z-0" videoRef={videoRef} />
      <SpaceTimeScene warpProgress={warpRef} velocityRef={velocityRef} />

      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/70 via-black/20 to-black/80" />

      <div className="relative z-30 flex min-h-screen items-center justify-center">
        <div className="max-w-4xl px-6 text-center">
          <h1
            className={`
              text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6
              transition-all duration-1000 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '200ms' }}
          >
            <span className="text-white">Welcome to 3D Data</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Visualizing the Future
            </span>
          </h1>

          <p
            className={`
              text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10
              transition-all duration-1000 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '400ms' }}
          >
            Upload any dataset and explore it in immersive, physics-driven space. Interactive
            charts, AI insights, and ML visualizations - all in one workspace.
          </p>

          <div
            className={`
              flex flex-col sm:flex-row items-center justify-center gap-4
              transition-all duration-1000 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '600ms' }}
          >
            <Link href="/workspace">
              <Button
                size="lg"
                className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-105"
              >
                Enter Workspace
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
        </div>
      </div>

      <div
        className={`
          absolute bottom-8 left-1/2 -translate-x-1/2
          flex flex-col items-center gap-2
          transition-all duration-1000 ease-out
          ${isVisible && scrollProgress < 0.1 ? 'opacity-100' : 'opacity-0'}
        `}
      >
        <span className="text-white/40 text-xs uppercase tracking-widest">Scroll to explore</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-white/60 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
