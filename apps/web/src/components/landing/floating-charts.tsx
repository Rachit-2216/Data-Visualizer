'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

type ChartType = 'bar' | 'pie' | 'line' | 'scatter';

type Floating3DChartProps = {
  type: ChartType;
  position: [number, number, number];
  scale?: number;
  color?: string;
};

function BarChart3D({ color = '#0ea5e9' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  const bars = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        height: 0.3 + Math.random() * 0.7,
        x: (i - 3) * 0.25,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.3) * 0.2;
  });

  return (
    <group ref={groupRef}>
      {bars.map((bar, idx) => (
        <mesh key={idx} position={[bar.x, bar.height / 2, 0]}>
          <boxGeometry args={[0.15, bar.height, 0.15]} />
          <meshStandardMaterial color={color} transparent opacity={0.8} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 0.5]} />
        <meshStandardMaterial color="#1e293b" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function PieChart3D({ color = '#8b5cf6' }: { color?: string }) {
  const groupRef = useRef<THREE.Group>(null);

  const segments = useMemo(() => {
    const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b'];
    const values = [0.35, 0.25, 0.25, 0.15];
    let startAngle = 0;

    return values.map((value, idx) => {
      const angle = value * Math.PI * 2;
      const segment = { startAngle, endAngle: startAngle + angle, color: colors[idx] };
      startAngle += angle;
      return segment;
    });
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.x = -0.3;
    groupRef.current.rotation.z = clock.elapsedTime * 0.1;
  });

  return (
    <group ref={groupRef}>
      {segments.map((seg, idx) => {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.arc(0, 0, 0.5, seg.startAngle, seg.endAngle, false);
        shape.lineTo(0, 0);

        const extrudeSettings = {
          depth: 0.1,
          bevelEnabled: false,
        };

        return (
          <mesh key={idx} position={[0, 0, -0.05]}>
            <extrudeGeometry args={[shape, extrudeSettings]} />
            <meshStandardMaterial color={seg.color} transparent opacity={0.85} metalness={0.2} roughness={0.6} />
          </mesh>
        );
      })}
    </group>
  );
}

function ScatterPlot3D({ color = '#10b981' }: { color?: string }) {
  const pointsRef = useRef<THREE.Points>(null);

  const points = useMemo(() => {
    const positions = new Float32Array(50 * 3);
    const colors = new Float32Array(50 * 3);
    const baseColor = new THREE.Color(color);

    for (let i = 0; i < 50; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      const c = baseColor.clone().offsetHSL(0, 0, (Math.random() - 0.5) * 0.3);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    return { positions, colors };
  }, [color]);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.elapsedTime * 0.2;
    pointsRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.3) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={50} array={points.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={50} array={points.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} sizeAttenuation />
    </points>
  );
}

function FloatingChart({ type, position, scale = 1, color }: Floating3DChartProps) {
  const Chart = useMemo(() => {
    switch (type) {
      case 'bar':
        return BarChart3D;
      case 'pie':
        return PieChart3D;
      case 'scatter':
        return ScatterPlot3D;
      default:
        return BarChart3D;
    }
  }, [type]);

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1} position={position}>
      <group scale={scale}>
        <Chart color={color} />
      </group>
    </Float>
  );
}

type FloatingChartsSceneProps = {
  variant?: 'hero' | 'section';
};

export function FloatingChartsScene({ variant = 'hero' }: FloatingChartsSceneProps) {
  const charts: Floating3DChartProps[] = useMemo(() => {
    if (variant === 'hero') {
      return [
        { type: 'bar', position: [-3, 1, -5], scale: 1.5, color: '#0ea5e9' },
        { type: 'pie', position: [4, -1, -8], scale: 2, color: '#8b5cf6' },
        { type: 'scatter', position: [-4, -2, -3], scale: 1.2, color: '#10b981' },
      ];
    }
    return [{ type: 'bar', position: [0, 0, 0], scale: 2 }];
  }, [variant]);

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }} className="absolute inset-0 pointer-events-none">
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#0ea5e9" />

      {charts.map((chart, idx) => (
        <FloatingChart key={idx} {...chart} />
      ))}
    </Canvas>
  );
}
