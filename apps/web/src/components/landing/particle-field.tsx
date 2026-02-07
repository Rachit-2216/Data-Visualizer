'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DEFAULT_PARTICLE_CONFIG, ParticlePhysicsConfig } from './physics-engine';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type ParticleFieldProps = {
  config?: Partial<ParticlePhysicsConfig>;
  warpProgress?: React.MutableRefObject<number>;
  velocityRef?: React.MutableRefObject<number>;
  color?: string;
};

export function ParticleField({
  config = {},
  warpProgress,
  velocityRef,
  color = '#38bfdb',
}: ParticleFieldProps) {
  const reducedMotion = useReducedMotion();
  const merged = useMemo(() => ({ ...DEFAULT_PARTICLE_CONFIG, ...config }), [config]);
  const pointsRef = useRef<THREE.Points>(null);
  const { raycaster, camera, pointer } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const cursorWorld = useRef(new THREE.Vector3(0, 0, 0));

  const particles = useMemo(() => {
    const positions = new Float32Array(merged.count * 3);
    const velocities = new Float32Array(merged.count * 3);
    const originals = new Float32Array(merged.count * 3);

    for (let i = 0; i < merged.count; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * merged.spread.x;
      const y = (Math.random() - 0.5) * merged.spread.y;
      const z = (Math.random() - 0.5) * merged.spread.z;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      originals[i3] = x;
      originals[i3 + 1] = y;
      originals[i3 + 2] = z;
      velocities[i3] = 0;
      velocities[i3 + 1] = 0;
      velocities[i3 + 2] = 0;
    }

    return { positions, velocities, originals };
  }, [merged]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    if (!reducedMotion) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, cursorWorld.current);
    }

    const warp = warpProgress?.current ?? 0;
    const velocity = velocityRef?.current ?? 0;

    const positions = particles.positions;
    const velocities = particles.velocities;
    const originals = particles.originals;
    const cursorX = cursorWorld.current.x;
    const cursorY = cursorWorld.current.y;
    const cursorZ = cursorWorld.current.z;
    const radiusSq = merged.radius * merged.radius;
    const minDistance = 8;

    for (let i = 0; i < merged.count; i++) {
      const i3 = i * 3;
      if (reducedMotion) {
        positions[i3 + 2] = originals[i3 + 2] + Math.sin(state.clock.elapsedTime + i) * 0.2;
        continue;
      }

      const px = positions[i3];
      const py = positions[i3 + 1];
      const pz = positions[i3 + 2];
      const dx = cursorX - px;
      const dy = cursorY - py;
      const dz = cursorZ - pz;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        const effective = Math.max(dist, minDistance);
        const force = merged.mass / (effective * effective);
        const inv = force / effective;
        velocities[i3] += dx * inv * merged.cursorInfluence * delta;
        velocities[i3 + 1] += dy * inv * merged.cursorInfluence * delta;
        velocities[i3 + 2] += dz * inv * merged.cursorInfluence * delta;
      }

      velocities[i3] += (originals[i3] - positions[i3]) * merged.restore * delta;
      velocities[i3 + 1] += (originals[i3 + 1] - positions[i3 + 1]) * merged.restore * delta;
      velocities[i3 + 2] += (originals[i3 + 2] - positions[i3 + 2]) * merged.restore * delta;

      velocities[i3] *= merged.drag;
      velocities[i3 + 1] *= merged.drag;
      velocities[i3 + 2] *= merged.drag;

      velocities[i3 + 2] -= warp * 0.6 + velocity * 0.4;

      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={merged.count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1.8}
        color={color}
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
