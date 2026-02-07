'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DEFAULT_MESH_CONFIG,
  MeshPhysicsConfig,
  calculateCursorForce,
  clampDisplacement,
} from './physics-engine';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type SpaceTimeMeshProps = {
  config?: Partial<MeshPhysicsConfig>;
  warpProgress?: React.MutableRefObject<number>;
  velocityRef?: React.MutableRefObject<number>;
  color?: string;
  opacity?: number;
};

export function SpaceTimeMesh({
  config = {},
  warpProgress,
  velocityRef,
  color = '#0ea5e9',
  opacity = 0.35,
}: SpaceTimeMeshProps) {
  const reducedMotion = useReducedMotion();
  const merged = useMemo(() => ({ ...DEFAULT_MESH_CONFIG, ...config }), [config]);
  const meshRef = useRef<THREE.Mesh>(null);
  const { raycaster, camera, pointer } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const cursorWorld = useRef(new THREE.Vector3(0, 0, 0));

  const physics = useMemo(() => {
    const geom = new THREE.PlaneGeometry(
      merged.width,
      merged.height,
      merged.widthSegments,
      merged.heightSegments,
    );
    const positions = geom.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    const originalZ = new Float32Array(vertexCount);
    const prevZ = new Float32Array(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
      const z = positions[i * 3 + 2];
      originalZ[i] = z;
      prevZ[i] = z;
    }

    const neighbors: number[][] = [];
    const cols = merged.widthSegments + 1;
    const rows = merged.heightSegments + 1;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        const list: number[] = [];
        if (x > 0) list.push(idx - 1);
        if (x < cols - 1) list.push(idx + 1);
        if (y > 0) list.push(idx - cols);
        if (y < rows - 1) list.push(idx + cols);
        neighbors[idx] = list;
      }
    }

    return { geom, positions, originalZ, prevZ, neighbors, vertexCount };
  }, [merged]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (!reducedMotion) {
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(plane, cursorWorld.current);
    }

    const warp = warpProgress?.current ?? 0;
    const velocity = velocityRef?.current ?? 0;

    for (let i = 0; i < physics.vertexCount; i++) {
      const idx3 = i * 3;
      const x = physics.positions[idx3];
      const y = physics.positions[idx3 + 1];
      const z = physics.positions[idx3 + 2];

      if (reducedMotion) {
        const wave =
          Math.sin(state.clock.elapsedTime * 0.5 + x * 0.08) * 0.4 +
          Math.cos(state.clock.elapsedTime * 0.4 + y * 0.06) * 0.3;
        physics.positions[idx3 + 2] = wave * 0.4;
        continue;
      }

      let forceZ = (physics.originalZ[i] - z) * merged.springStiffness * 0.8;

      const neighborList = physics.neighbors[i];
      for (let n = 0; n < neighborList.length; n++) {
        const ni = neighborList[n];
        const nz = physics.positions[ni * 3 + 2];
        forceZ += (nz - z) * merged.springStiffness;
      }

      const distToCursor = Math.hypot(
        cursorWorld.current.x - x,
        cursorWorld.current.y - y,
      );

      if (distToCursor < merged.cursorRadius) {
        const cursorForce = calculateCursorForce(
          new THREE.Vector3(x, y, z),
          cursorWorld.current,
          merged.cursorMass,
          merged.minDistance,
        );
        forceZ -= cursorForce.length() * (1 - distToCursor / merged.cursorRadius);
      }

      forceZ -= warp * 1.5;
      forceZ -= velocity * 0.8;

      const vel = (z - physics.prevZ[i]) * merged.damping;
      let nextZ = z + vel + forceZ * delta * delta;
      const displacement = clampDisplacement(nextZ - physics.originalZ[i], merged.maxStretch);
      nextZ = physics.originalZ[i] + displacement;

      physics.prevZ[i] = z;
      physics.positions[idx3 + 2] = nextZ;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <mesh geometry={physics.geom} ref={meshRef}>
      <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
    </mesh>
  );
}
