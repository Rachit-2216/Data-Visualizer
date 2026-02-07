'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

type LayerConfig = {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
};

type FloatingNeuralNetworkProps = {
  position?: [number, number, number];
  scale?: number;
  rotationSpeed?: number;
};

export function FloatingNeuralNetwork({
  position = [0, 0, 0],
  scale = 1,
  rotationSpeed = 0.001,
}: FloatingNeuralNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);

  const layers: LayerConfig[] = useMemo(
    () => [
      { position: [-8, 0, 0], size: [2, 4, 2], color: '#0ea5e9' },
      { position: [-4, 0, 0], size: [2, 6, 3], color: '#8b5cf6' },
      { position: [0, 0, 0], size: [2, 8, 4], color: '#10b981' },
      { position: [4, 0, 0], size: [2, 6, 3], color: '#f59e0b' },
      { position: [8, 0, 0], size: [2, 3, 2], color: '#ef4444' },
    ],
    []
  );

  const connections = useMemo(() => {
    const lines: Array<{ start: THREE.Vector3; end: THREE.Vector3 }> = [];

    for (let i = 0; i < layers.length - 1; i++) {
      const from = layers[i];
      const to = layers[i + 1];

      const offsets = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];

      offsets.forEach(([oy, oz]) => {
        lines.push({
          start: new THREE.Vector3(
            from.position[0] + from.size[0] / 2,
            from.position[1] + (oy * from.size[1]) / 3,
            from.position[2] + (oz * from.size[2]) / 3
          ),
          end: new THREE.Vector3(
            to.position[0] - to.size[0] / 2,
            to.position[1] + (oy * to.size[1]) / 3,
            to.position[2] + (oz * to.size[2]) / 3
          ),
        });
      });
    }

    return lines;
  }, [layers]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    groupRef.current.rotation.y = clock.elapsedTime * rotationSpeed;
    groupRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.5) * 0.5;
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {layers.map((layer, idx) => (
        <mesh key={idx} position={layer.position}>
          <boxGeometry args={layer.size} />
          <meshStandardMaterial
            color={layer.color}
            transparent
            opacity={0.6}
            metalness={0.3}
            roughness={0.7}
          />
          <mesh>
            <boxGeometry args={layer.size.map((s) => s * 1.01) as [number, number, number]} />
            <meshBasicMaterial color={layer.color} wireframe transparent opacity={0.8} />
          </mesh>
        </mesh>
      ))}

      {connections.map((conn, idx) => (
        <Line
          key={idx}
          points={[conn.start, conn.end]}
          color="#475569"
          transparent
          opacity={0.4}
          lineWidth={1}
        />
      ))}

      <DataFlowParticles connections={connections} />
    </group>
  );
}

function DataFlowParticles({
  connections,
}: {
  connections: Array<{ start: THREE.Vector3; end: THREE.Vector3 }>;
}) {
  const particlesRef = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const count = connections.length * 3;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const connIdx = Math.floor(i / 3);
      const conn = connections[connIdx];
      const t = Math.random();

      positions[i * 3] = conn.start.x + (conn.end.x - conn.start.x) * t;
      positions[i * 3 + 1] = conn.start.y + (conn.end.y - conn.start.y) * t;
      positions[i * 3 + 2] = conn.start.z + (conn.end.z - conn.start.z) * t;

      speeds[i] = 0.5 + Math.random() * 0.5;
    }

    return { positions, speeds };
  }, [connections]);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;

    const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const count = connections.length * 3;

    for (let i = 0; i < count; i++) {
      const connIdx = Math.floor(i / 3);
      const conn = connections[connIdx];
      const speed = speeds[i];

      const t = (clock.elapsedTime * speed * 0.2 + i * 0.33) % 1;

      posArray[i * 3] = conn.start.x + (conn.end.x - conn.start.x) * t;
      posArray[i * 3 + 1] = conn.start.y + (conn.end.y - conn.start.y) * t;
      posArray[i * 3 + 2] = conn.start.z + (conn.end.z - conn.start.z) * t;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={connections.length * 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#22d3ee" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
    </points>
  );
}
