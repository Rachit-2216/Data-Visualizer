'use client';

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { advancedVertexShader, advancedFragmentShader } from './particle-shaders-advanced';

const ADVANCED_CONFIG = {
  count: 15000,
  spread: {
    x: 120,
    y: 70,
    z: 60,
  },
  colors: {
    primary: '#0ea5e9',
    secondary: '#14b8a6',
    tertiary: '#8b5cf6',
  },
  mouse: {
    radius: 20,
    strength: 10,
  },
  noise: {
    scale: 0.3,
    speed: 0.15,
  },
};

type AdvancedParticleSystemProps = {
  mouseX: number;
  mouseY: number;
  scrollProgress?: number;
  config?: Partial<typeof ADVANCED_CONFIG>;
};

export function AdvancedParticleSystem({
  mouseX,
  mouseY,
  scrollProgress = 0,
  config = {},
}: AdvancedParticleSystemProps) {
  const finalConfig = { ...ADVANCED_CONFIG, ...config };
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();

  const particleData = useMemo(() => {
    const count = finalConfig.count;
    const { x: spreadX, y: spreadY, z: spreadZ } = finalConfig.spread;

    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const randomness = new Float32Array(count);
    const originalPositions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const layer = Math.floor(Math.random() * 3);
      let radiusPower;
      switch (layer) {
        case 0:
          radiusPower = 0.5;
          break;
        case 1:
          radiusPower = 0.7;
          break;
        case 2:
          radiusPower = 0.9;
          break;
        default:
          radiusPower = 0.7;
      }

      const radiusX = Math.pow(Math.random(), radiusPower) * spreadX;
      const radiusY = Math.pow(Math.random(), radiusPower) * spreadY;
      const radiusZ = Math.pow(Math.random(), radiusPower) * spreadZ;

      let x = radiusX * Math.sin(phi) * Math.cos(theta);
      let y = radiusY * Math.sin(phi) * Math.sin(theta);
      let z = radiusZ * Math.cos(phi);

      x += (Math.random() - 0.5) * 2;
      y += (Math.random() - 0.5) * 2;
      z += (Math.random() - 0.5) * 2;

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      originalPositions[i3] = x;
      originalPositions[i3 + 1] = y;
      originalPositions[i3 + 2] = z;

      const distFromCenter = Math.sqrt(x * x + y * y + z * z) / spreadX;
      scales[i] = (1.5 - distFromCenter * 0.5) * (0.5 + Math.random() * 0.5);

      randomness[i] = Math.random();
    }

    return {
      positions,
      scales,
      randomness,
      originalPositions,
    };
  }, [finalConfig.count, finalConfig.spread]);

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: advancedVertexShader,
      fragmentShader: advancedFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseRadius: { value: finalConfig.mouse.radius },
        uMouseStrength: { value: finalConfig.mouse.strength },
        uNoiseScale: { value: finalConfig.noise.scale },
        uNoiseSpeed: { value: finalConfig.noise.speed },
        uColorA: { value: new THREE.Color(finalConfig.colors.primary) },
        uColorB: { value: new THREE.Color(finalConfig.colors.secondary) },
        uColorC: { value: new THREE.Color(finalConfig.colors.tertiary) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [gl, finalConfig]);

  useFrame((state) => {
    if (!materialRef.current) return;

    const material = materialRef.current;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    const targetMouse = new THREE.Vector2(mouseX, mouseY);
    const currentMouse = material.uniforms.uMouse.value as THREE.Vector2;
    currentMouse.lerp(targetMouse, 0.1);

    if (pointsRef.current) {
      const scale = 1 - scrollProgress * 0.4;
      pointsRef.current.scale.setScalar(Math.max(scale, 0.6));
      const opacity = 1 - scrollProgress * 0.7;
      (pointsRef.current.material as THREE.Material).opacity = Math.max(opacity, 0.3);
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
        <bufferAttribute attach="attributes-position" count={finalConfig.count} array={particleData.positions} itemSize={3} />
        <bufferAttribute
          attach="attributes-aOriginalPosition"
          count={finalConfig.count}
          array={particleData.originalPositions}
          itemSize={3}
        />
        <bufferAttribute attach="attributes-aScale" count={finalConfig.count} array={particleData.scales} itemSize={1} />
        <bufferAttribute
          attach="attributes-aRandomness"
          count={finalConfig.count}
          array={particleData.randomness}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={shaderMaterial} ref={materialRef} attach="material" />
    </points>
  );
}
