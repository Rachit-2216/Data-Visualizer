'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

type ScrollContextType = {
  lenis: Lenis | null;
  scrollProgress: number;
  scrollY: number;
  isReady: boolean;
};

const ScrollContext = createContext<ScrollContextType>({
  lenis: null,
  scrollProgress: 0,
  scrollY: 0,
  isReady: false,
});

export function useScroll() {
  return useContext(ScrollContext);
}

type ScrollProviderProps = {
  children: React.ReactNode;
};

export function ScrollProvider({ children }: ScrollProviderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    lenis.on('scroll', (e: any) => {
      setScrollY(e.scroll);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? e.scroll / docHeight : 0;
      setScrollProgress(progress);
      ScrollTrigger.update();
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length && value !== undefined) {
          lenis.scrollTo(value, { immediate: true });
        }
        return lenis.scroll;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });
    ScrollTrigger.defaults({ scroller: document.body });

    ScrollTrigger.addEventListener('refresh', () => lenis.resize());
    setIsReady(true);

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <ScrollContext.Provider value={{ lenis: lenisRef.current, scrollProgress, scrollY, isReady }}>
      {children}
    </ScrollContext.Provider>
  );
}
