'use client';

import * as THREE from 'three';

export type MeshPhysicsConfig = {
  width: number;
  height: number;
  widthSegments: number;
  heightSegments: number;
  springStiffness: number;
  damping: number;
  cursorMass: number;
  maxStretch: number;
  cursorRadius: number;
  minDistance: number;
};

export type ParticlePhysicsConfig = {
  count: number;
  spread: { x: number; y: number; z: number };
  cursorInfluence: number;
  drag: number;
  mass: number;
  restore: number;
  radius: number;
};

export const DEFAULT_MESH_CONFIG: MeshPhysicsConfig = {
  width: 100,
  height: 60,
  widthSegments: 50,
  heightSegments: 30,
  springStiffness: 0.2,
  damping: 0.955,
  cursorMass: 70,
  maxStretch: 14,
  cursorRadius: 36,
  minDistance: 5,
};

export const DEFAULT_PARTICLE_CONFIG: ParticlePhysicsConfig = {
  count: 8000,
  spread: { x: 120, y: 70, z: 80 },
  cursorInfluence: 0.45,
  drag: 0.986,
  mass: 0.12,
  restore: 0.035,
  radius: 40,
};

export function calculateCursorForce(
  from: THREE.Vector3,
  cursor: THREE.Vector3,
  mass: number,
  minDistance: number,
) {
  const delta = cursor.clone().sub(from);
  const distance = Math.max(delta.length(), minDistance);
  const force = mass / (distance * distance);
  return delta.normalize().multiplyScalar(force);
}

export function clampDisplacement(value: number, maxStretch: number) {
  if (value > maxStretch) return maxStretch;
  if (value < -maxStretch) return -maxStretch;
  return value;
}
