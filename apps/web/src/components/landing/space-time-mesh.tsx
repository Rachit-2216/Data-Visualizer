'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DEFAULT_MESH_CONFIG,
  MeshPhysicsConfig,
  calculateCursorForce,
  clampDisplacement,
} from './physics-engine';
import { meshVertexShader, meshFragmentShader } from './mesh-shaders';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

type SpaceTimeMeshProps = {
  config?: Partial<MeshPhysicsConfig>;
  warpProgress?: React.MutableRefObject<number>;
  velocityRef?: React.MutableRefObject<number>;
  cursorRef?: React.MutableRefObject<THREE.Vector3>;
  cursorActiveRef?: React.MutableRefObject<boolean>;
  lastMoveRef?: React.MutableRefObject<number>;
  color?: string;
  opacity?: number;
};

export function SpaceTimeMesh({
  config = {},
  warpProgress,
  velocityRef,
  cursorRef,
  cursorActiveRef,
  lastMoveRef,
  color = '#0ea5e9',
  opacity = 0.35,
}: SpaceTimeMeshProps) {
  const reducedMotion = useReducedMotion();
  const merged = useMemo(() => ({ ...DEFAULT_MESH_CONFIG, ...config }), [config]);
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { raycaster, camera } = useThree();
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const cursorWorld = cursorRef ?? useRef(new THREE.Vector3(0, 0, 0));
  const pointerRef = useRef(new THREE.Vector2(0, 0));

  const physics = useMemo(() => {
    const geom = new THREE.PlaneGeometry(
      merged.width,
      merged.height,
      merged.widthSegments,
      merged.heightSegments,
    );
    geom.rotateX(-Math.PI / 2);
    const positions = geom.attributes.position.array as Float32Array;
    const vertexCount = positions.length / 3;
    const originalY = new Float32Array(vertexCount);
    const prevY = new Float32Array(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
      const y = positions[i * 3 + 1];
      originalY[i] = y;
      prevY[i] = y;
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

    return { geom, positions, originalY, prevY, neighbors, vertexCount };
  }, [merged]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: meshVertexShader,
      fragmentShader: meshFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPointSize: { value: 1.4 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [color, opacity]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    if (!reducedMotion && !cursorRef) {
      raycaster.setFromCamera(pointerRef.current, camera);
      raycaster.ray.intersectPlane(plane, cursorWorld.current);
    }

    const warp = warpProgress?.current ?? 0;
    const velocity = velocityRef?.current ?? 0;
    const cursorActive = cursorActiveRef?.current ?? true;
    const idleTime = lastMoveRef ? performance.now() - lastMoveRef.current : 0;
    const cursorIdle = !cursorActive && idleTime > 120;

    for (let i = 0; i < physics.vertexCount; i++) {
      const idx3 = i * 3;
      const x = physics.positions[idx3];
      const y = physics.positions[idx3 + 1];
      const z = physics.positions[idx3 + 2];

      if (reducedMotion) {
        physics.positions[idx3 + 1] = physics.originalY[i];
        physics.prevY[i] = physics.originalY[i];
        continue;
      }

      if (cursorIdle) {
        const rest = physics.originalY[i];
        const vel = (y - physics.prevY[i]) * 0.55;
        let nextY = y + vel + (rest - y) * 0.18;
        if (Math.abs(nextY - rest) < 0.01) {
          nextY = rest;
          physics.prevY[i] = rest;
        } else {
          physics.prevY[i] = y;
        }
        physics.positions[idx3 + 1] = nextY;
        continue;
      }

      let forceY = (physics.originalY[i] - y) * merged.springStiffness * 0.9;

      const neighborList = physics.neighbors[i];
      for (let n = 0; n < neighborList.length; n++) {
        const ni = neighborList[n];
        const ny = physics.positions[ni * 3 + 1];
        forceY += (ny - y) * merged.springStiffness;
      }

      const dx = cursorWorld.current.x - x;
      const dz = cursorWorld.current.z - z;
      const distToCursor = Math.hypot(dx, dz);

      if (distToCursor < merged.cursorRadius) {
        const cursorForce = calculateCursorForce(
          new THREE.Vector3(x, 0, z),
          new THREE.Vector3(cursorWorld.current.x, 0, cursorWorld.current.z),
          merged.cursorMass,
          merged.minDistance,
        );
        const proximity = 1 - distToCursor / merged.cursorRadius;
        const cursorStrength = cursorForce.length() * proximity;
        forceY -= cursorStrength * 5.2;

        // Cursor-only ripple for a subtle "fabric" response.
        const ripple = Math.cos(distToCursor * 0.35 - state.clock.elapsedTime * 3) * 0.6;
        forceY += ripple * proximity * 0.8;
      }

      // Only apply scroll warp while cursor is active.
      if (cursorActive) {
        forceY -= warp * 2.2;
        forceY -= velocity * 1.2;
      }

      const vel = (y - physics.prevY[i]) * merged.damping;
      let nextY = y + vel + forceY * delta * delta;

      const displacement = clampDisplacement(nextY - physics.originalY[i], merged.maxStretch);
      nextY = physics.originalY[i] + displacement;

      physics.prevY[i] = y;
      physics.positions[idx3 + 1] = nextY;
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <>
      {!cursorRef && (
        <group>
          {typeof window !== 'undefined' && (
            <CursorListener pointerRef={pointerRef} />
          )}
        </group>
      )}
      <points geometry={physics.geom} ref={pointsRef}>
        <primitive object={material} ref={materialRef} attach="material" />
      </points>
    </>
  );
}

function CursorListener({ pointerRef }: { pointerRef: React.MutableRefObject<THREE.Vector2> }) {
  useEffect(() => {
    const handle = (event: MouseEvent) => {
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handle);
    return () => window.removeEventListener('mousemove', handle);
  }, [pointerRef]);
  return null;
}
