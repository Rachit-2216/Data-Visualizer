'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleSystem } from './particle-system';
import { FloatingNeuralNetwork } from './floating-neural-network';

function CameraController({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3(0, 0, 50));

  useFrame(() => {
    targetRef.current.x = mouseX * 5;
    targetRef.current.y = mouseY * 3;
    targetRef.current.z = 50;

    camera.position.lerp(targetRef.current, 0.02);
    camera.lookAt(0, 0, 0);
  });

  return null;
}

function Lighting() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#0ea5e9" />
      <pointLight position={[0, 0, -20]} intensity={0.2} color="#14b8a6" />
    </>
  );
}

function Loader() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#0ea5e9" wireframe />
    </mesh>
  );
}

type HeroCanvasProps = {
  mouseX: number;
  mouseY: number;
  scrollProgress: number;
  showNeuralNetwork?: boolean;
};

export function HeroCanvas({
  mouseX,
  mouseY,
  scrollProgress,
  showNeuralNetwork = true,
}: HeroCanvasProps) {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{
          position: [0, 0, 50],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        flat
        resize={{ scroll: false }}
      >
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 30, 100]} />

        <Suspense fallback={<Loader />}>
          <Lighting />
          <CameraController mouseX={mouseX} mouseY={mouseY} />

          <ParticleSystem mouseX={mouseX} mouseY={mouseY} scrollProgress={scrollProgress} />

          {showNeuralNetwork && (
            <FloatingNeuralNetwork position={[20, -5, -10]} scale={0.8} rotationSpeed={0.001} />
          )}

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
