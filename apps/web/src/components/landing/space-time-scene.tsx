'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { SpaceTimeMesh } from './space-time-mesh';
import { ParticleField } from './particle-field';
import { useMobileDetect } from './use-mobile-detect';

type SpaceTimeSceneProps = {
  warpProgress: React.MutableRefObject<number>;
  velocityRef: React.MutableRefObject<number>;
};

function SceneWarp({
  warpProgress,
  velocityRef,
}: {
  warpProgress: React.MutableRefObject<number>;
  velocityRef: React.MutableRefObject<number>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    if (!('fov' in perspective)) return;
    const progress = warpProgress.current ?? 0;
    const velocity = Math.abs(velocityRef.current ?? 0);
    const targetZ = 70 + progress * 90;
    const targetFov = 60 + progress * 30 + velocity * 2;

    perspective.position.z = THREE.MathUtils.lerp(perspective.position.z, targetZ, 0.08);
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, targetFov, 0.08);
    perspective.updateProjectionMatrix();
  });

  return null;
}

export function SpaceTimeScene({ warpProgress, velocityRef }: SpaceTimeSceneProps) {
  const { isMobile, isTablet } = useMobileDetect();

  const particleCount = isMobile ? 2000 : isTablet ? 4000 : 8000;
  const widthSegments = isMobile ? 20 : isTablet ? 30 : 50;
  const heightSegments = isMobile ? 12 : isTablet ? 20 : 30;
  const meshConfig = useMemo(() => ({ widthSegments, heightSegments }), [widthSegments, heightSegments]);
  const particleConfig = useMemo(() => ({ count: particleCount }), [particleCount]);

  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        camera={{ position: [0, 0, 70], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
        dpr={isMobile ? 1 : isTablet ? 1.5 : 2}
      >
        <color attach="background" args={['#030712']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.7} />
        <pointLight position={[-20, -10, 5]} intensity={0.4} color="#0ea5e9" />

        <Suspense fallback={null}>
          <SceneWarp warpProgress={warpProgress} velocityRef={velocityRef} />
          <SpaceTimeMesh
            warpProgress={warpProgress}
            velocityRef={velocityRef}
            config={meshConfig}
          />
          <ParticleField
            warpProgress={warpProgress}
            velocityRef={velocityRef}
            config={particleConfig}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
