'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { particleVertexShader, particleFragmentShader } from './particle-shaders';

const PARTICLE_CONFIG = {
  count: 12000,
  spread: {
    x: 100,
    y: 60,
    z: 50,
  },
  colors: {
    primary: '#0ea5e9',
    secondary: '#14b8a6',
  },
  mouse: {
    radius: 15,
    strength: 8,
    recovery: 0.05,
  },
};

type ParticleSystemProps = {
  mouseX: number;
  mouseY: number;
  scrollProgress?: number;
};

export function ParticleSystem({
  mouseX,
  mouseY,
  scrollProgress = 0,
}: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { gl } = useThree();
  const pixelRatio = gl.getPixelRatio();

  const { positions, scales, randomness, originalPositions } = useMemo(() => {
    const count = PARTICLE_CONFIG.count;
    const { x: spreadX, y: spreadY, z: spreadZ } = PARTICLE_CONFIG.spread;

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomness = new Float32Array(count);
    const originalPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radiusX = Math.pow(Math.random(), 0.7) * spreadX;
      const radiusY = Math.pow(Math.random(), 0.7) * spreadY;
      const radiusZ = Math.pow(Math.random(), 0.7) * spreadZ;

      const x = radiusX * Math.sin(phi) * Math.cos(theta);
      const y = radiusY * Math.sin(phi) * Math.sin(theta);
      const z = radiusZ * Math.cos(phi);

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      originalPositions[i3] = x;
      originalPositions[i3 + 1] = y;
      originalPositions[i3 + 2] = z;

      scales[i] = 0.5 + Math.random();
      randomness[i] = Math.random();
    }

    return { positions, scales, randomness, originalPositions };
  }, []);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseRadius: { value: PARTICLE_CONFIG.mouse.radius },
        uMouseStrength: { value: PARTICLE_CONFIG.mouse.strength },
        uColorA: { value: new THREE.Color(PARTICLE_CONFIG.colors.primary) },
        uColorB: { value: new THREE.Color(PARTICLE_CONFIG.colors.secondary) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [pixelRatio]);

  useFrame((state) => {
    if (!materialRef.current) return;

    const material = materialRef.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    const targetMouse = new THREE.Vector2(mouseX, mouseY);
    const currentMouse = material.uniforms.uMouse.value as THREE.Vector2;
    currentMouse.lerp(targetMouse, 0.1);

    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;

      const scale = 1 - scrollProgress * 0.3;
      pointsRef.current.scale.setScalar(scale);
    }
  });

  useEffect(() => {
    return () => {
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      if (pointsRef.current) {
        pointsRef.current.geometry.dispose();
      }
    };
  }, []);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_CONFIG.count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aOriginalPosition"
          count={PARTICLE_CONFIG.count}
          array={originalPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={PARTICLE_CONFIG.count}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandomness"
          count={PARTICLE_CONFIG.count}
          array={randomness}
          itemSize={1}
        />
      </bufferGeometry>

      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </points>
  );
}
