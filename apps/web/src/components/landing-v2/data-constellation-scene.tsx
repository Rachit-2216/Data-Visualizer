'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';

const POINT_COUNT = 780;
const CONNECTION_COUNT = 180;

function DataField() {
  const pointsRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const { pointer, viewport } = useThree();

  const { basePositions, workingPositions, linePositions, colors } = useMemo(() => {
    const basePositions = new Float32Array(POINT_COUNT * 3);
    const workingPositions = new Float32Array(POINT_COUNT * 3);
    const colors = new Float32Array(POINT_COUNT * 3);

    for (let index = 0; index < POINT_COUNT; index += 1) {
      const offset = index * 3;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.pow(Math.random(), 0.62) * 18;
      const depth = (Math.random() - 0.5) * 18;

      basePositions[offset] = Math.cos(angle) * radius * 1.8;
      basePositions[offset + 1] = Math.sin(angle) * radius * 0.9;
      basePositions[offset + 2] = depth;

      workingPositions[offset] = basePositions[offset];
      workingPositions[offset + 1] = basePositions[offset + 1];
      workingPositions[offset + 2] = basePositions[offset + 2];

      const coolness = Math.random();
      colors[offset] = 0.2 + coolness * 0.3;
      colors[offset + 1] = 0.9;
      colors[offset + 2] = 0.9 + coolness * 0.1;
    }

    const linePositions = new Float32Array(CONNECTION_COUNT * 2 * 3);
    for (let index = 0; index < CONNECTION_COUNT; index += 1) {
      const a = Math.floor(Math.random() * POINT_COUNT);
      const b = (a + Math.floor(8 + Math.random() * 34)) % POINT_COUNT;
      const lineOffset = index * 6;
      const aOffset = a * 3;
      const bOffset = b * 3;

      linePositions[lineOffset] = basePositions[aOffset];
      linePositions[lineOffset + 1] = basePositions[aOffset + 1];
      linePositions[lineOffset + 2] = basePositions[aOffset + 2];
      linePositions[lineOffset + 3] = basePositions[bOffset];
      linePositions[lineOffset + 4] = basePositions[bOffset + 1];
      linePositions[lineOffset + 5] = basePositions[bOffset + 2];
    }

    return { basePositions, workingPositions, linePositions, colors };
  }, []);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const cursorX = pointer.x * viewport.width * 0.46;
    const cursorY = pointer.y * viewport.height * 0.46;

    if (pointsRef.current) {
      const position = pointsRef.current.geometry.attributes.position;
      const array = position.array as Float32Array;

      for (let index = 0; index < POINT_COUNT; index += 1) {
        const offset = index * 3;
        const baseX = basePositions[offset];
        const baseY = basePositions[offset + 1];
        const baseZ = basePositions[offset + 2];
        const dx = baseX - cursorX;
        const dy = baseY - cursorY;
        const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const influence = Math.max(0, 1 - dist / 8);
        const stretch = influence * influence * 4.2;

        array[offset] += (baseX + (dx / dist) * stretch - array[offset]) * 0.1;
        array[offset + 1] += (baseY + (dy / dist) * stretch - array[offset + 1]) * 0.1;
        array[offset + 2] +=
          (baseZ + Math.sin(time * 0.22 + index) * 0.12 + influence * 3 - array[offset + 2]) *
          0.08;
      }

      position.needsUpdate = true;
      pointsRef.current.rotation.z = Math.sin(time * 0.08) * 0.025;
      pointsRef.current.rotation.y = Math.sin(time * 0.05) * 0.08;
    }

    if (lineRef.current) {
      lineRef.current.rotation.z = Math.sin(time * 0.08) * 0.025;
      lineRef.current.rotation.y = Math.sin(time * 0.05) * 0.08;
    }

    if (glowRef.current) {
      glowRef.current.position.x += (cursorX - glowRef.current.position.x) * 0.12;
      glowRef.current.position.y += (cursorY - glowRef.current.position.y) * 0.12;
      glowRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.04);
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={POINT_COUNT}
            array={workingPositions}
            itemSize={3}
          />
          <bufferAttribute attach="attributes-color" count={POINT_COUNT} array={colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={0.82}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={CONNECTION_COUNT * 2}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#22d3ee" transparent opacity={0.13} blending={THREE.AdditiveBlending} />
      </lineSegments>

      <mesh ref={glowRef} position={[0, 0, -4]}>
        <circleGeometry args={[3.2, 40]} />
        <meshBasicMaterial color="#a3e635" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CssFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/20 bg-cyan-300/5 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.08)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />
    </div>
  );
}

export function DataConstellationScene() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <CssFallback />;
  }

  return (
    <div className="absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 28], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <fog attach="fog" args={['#05060a', 20, 46]} />
        <DataField />
      </Canvas>
    </div>
  );
}
