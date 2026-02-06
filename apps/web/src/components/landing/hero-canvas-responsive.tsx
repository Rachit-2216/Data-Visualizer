'use client';

import { HeroCanvas } from './hero-canvas';
import { useMobileDetect } from './use-mobile-detect';
import { GradientOrbs } from './gradient-orbs';

type HeroCanvasResponsiveProps = {
  mouseX: number;
  mouseY: number;
  scrollProgress: number;
};

export function HeroCanvasResponsive(props: HeroCanvasResponsiveProps) {
  const { isMobile, isTablet } = useMobileDetect();

  if (isMobile) {
    return (
      <div className="absolute inset-0 -z-10">
        <GradientOrbs />
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at top, #0ea5e920 0%, transparent 50%),
              radial-gradient(ellipse at bottom left, #8b5cf620 0%, transparent 50%),
              linear-gradient(180deg, #030712 0%, #0a0f1a 100%)
            `,
          }}
        />
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="absolute inset-0 -z-10">
        <HeroCanvas {...props} showNeuralNetwork={false} />
        <GradientOrbs />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 -z-10">
      <HeroCanvas {...props} showNeuralNetwork={true} />
      <GradientOrbs />
    </div>
  );
}
