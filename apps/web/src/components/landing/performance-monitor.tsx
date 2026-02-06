'use client';

import { useEffect, useState } from 'react';

export function PerformanceMonitor() {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const checkPerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      const delta = currentTime - lastTime;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        setFps(currentFps);

        const newWarnings: string[] = [];
        if (currentFps < 30) {
          newWarnings.push('FPS below 30 - consider reducing particle count');
        }

        if ((performance as any).memory) {
          const memoryMB = (performance as any).memory.usedJSHeapSize / 1048576;
          setMemory(Math.round(memoryMB));

          if (memoryMB > 500) {
            newWarnings.push('Memory usage high - check for memory leaks');
          }
        }

        setWarnings(newWarnings);
        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(checkPerformance);
    };

    animationFrameId = requestAnimationFrame(checkPerformance);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] p-4 rounded-lg bg-black/90 border border-white/20 backdrop-blur-sm text-white font-mono text-xs space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span>FPS:</span>
        <span
          className={`font-bold ${
            fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'
          }`}
        >
          {fps}
        </span>
      </div>

      {memory > 0 && (
        <div className="flex items-center justify-between gap-4">
          <span>Memory:</span>
          <span className="font-bold">{memory} MB</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="pt-2 border-t border-white/10">
          {warnings.map((warning, idx) => (
            <div key={idx} className="text-yellow-400 text-[10px]">
              ? {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
