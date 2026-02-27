'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
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
    perspective.position.y = THREE.MathUtils.lerp(perspective.position.y, 12 + progress * 6, 0.06);
    perspective.fov = THREE.MathUtils.lerp(perspective.fov, targetFov, 0.08);
    perspective.updateProjectionMatrix();
    perspective.lookAt(0, 0, 0);
  });

  return null;
}

function CursorTracker({
  cursorRef,
  cursorActiveRef,
  lastMoveRef,
}: {
  cursorRef: React.MutableRefObject<THREE.Vector3>;
  cursorActiveRef: React.MutableRefObject<boolean>;
  lastMoveRef: React.MutableRefObject<number>;
}) {
  const { camera, raycaster } = useThree();
  const pointerRef = useRef(new THREE.Vector2(0, 0));
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const handle = (event: MouseEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
      lastMoveRef.current = performance.now();
      cursorActiveRef.current = true;
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  useFrame(() => {
    raycaster.setFromCamera(pointerRef.current, camera);
    if (raycaster.ray.intersectPlane(plane, targetRef.current)) {
      cursorRef.current.lerp(targetRef.current, 0.25);
    }
    if (performance.now() - lastMoveRef.current > 120) {
      cursorActiveRef.current = false;
    }
  });

  return null;
}

export function SpaceTimeScene({ warpProgress, velocityRef }: SpaceTimeSceneProps) {
  const { isMobile, isTablet } = useMobileDetect();
  const cursorRef = useRef(new THREE.Vector3(0, 0, 0));
  const cursorActiveRef = useRef(false);
  const lastMoveRef = useRef(0);

  const particleCount = isMobile ? 1600 : isTablet ? 3200 : 6000;
  const widthSegments = isMobile ? 24 : isTablet ? 42 : 70;
  const heightSegments = isMobile ? 14 : isTablet ? 26 : 40;
  const meshConfig = useMemo(() => ({ widthSegments, heightSegments }), [widthSegments, heightSegments]);
  const particleConfig = useMemo(() => ({ count: particleCount }), [particleCount]);

  return (
    <div className="absolute inset-0 z-10">
      <Canvas
        camera={{ position: [0, 12, 80], fov: 60, near: 0.1, far: 500 }}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
        dpr={isMobile ? 1 : isTablet ? 1.5 : 2}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={0.7} />
        <pointLight position={[-20, -10, 5]} intensity={0.4} color="#0ea5e9" />

        <Suspense fallback={null}>
          <SceneWarp warpProgress={warpProgress} velocityRef={velocityRef} />
          <CursorTracker
            cursorRef={cursorRef}
            cursorActiveRef={cursorActiveRef}
            lastMoveRef={lastMoveRef}
          />
          <SpaceTimeMesh
            warpProgress={warpProgress}
            velocityRef={velocityRef}
            cursorRef={cursorRef}
            cursorActiveRef={cursorActiveRef}
            lastMoveRef={lastMoveRef}
            config={meshConfig}
          />
          <ParticleField
            warpProgress={warpProgress}
            velocityRef={velocityRef}
            cursorRef={cursorRef}
            config={particleConfig}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
