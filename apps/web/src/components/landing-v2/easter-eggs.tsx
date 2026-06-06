'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { easterEggCopy } from './landing-copy';

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function EasterEggs() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      setSequence((current) => {
        const next = [...current, event.key].slice(-KONAMI.length);
        if (next.join('|').toLowerCase() === KONAMI.join('|').toLowerCase()) {
          setIsVisible(true);
          window.setTimeout(() => setIsVisible(false), 5000);
          return [];
        }
        return next;
      });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <AnimatePresence>
      {isVisible ? (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed left-1/2 top-24 z-[80] -translate-x-1/2 rounded-full border border-lime-300/35 bg-lime-300 px-6 py-3 font-mono text-xs font-black uppercase tracking-[0.24em] text-[#05060a] shadow-[0_0_40px_rgba(163,230,53,0.35)]"
        >
          {easterEggCopy.konami}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
