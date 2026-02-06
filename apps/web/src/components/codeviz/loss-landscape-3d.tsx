'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type LossLandscapeProps = {
  data?: number[][];
  gridSize?: number;
  colorScheme?: 'cyan-green' | 'blue-red' | 'purple-yellow';
  showLabels?: boolean;
  isAnimating?: boolean;
};

type ColorRamp = {
  low: THREE.Color;
  high: THREE.Color;
};

const COLOR_SCHEMES: Record<string, ColorRamp> = {
  'cyan-green': {
    low: new THREE.Color(0x0ea5e9),
    high: new THREE.Color(0x84cc16),
  },
  'blue-red': {
    low: new THREE.Color(0x2563eb),
    high: new THREE.Color(0xf43f5e),
  },
  'purple-yellow': {
    low: new THREE.Color(0x7c3aed),
    high: new THREE.Color(0xfacc15),
  },
};

const terrainVertexShader = `
  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    vElevation = position.y;
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const terrainFragmentShader = `
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform vec3 uLightPosition;
  uniform float uTime;
  uniform float uMin;
  uniform float uRange;

  varying float vElevation;
  varying vec3 vNormal;
  varying vec3 vPosition;

  void main() {
    float normalized = clamp((vElevation - uMin) / uRange, 0.0, 1.0);
    vec3 color = mix(uColorLow, uColorHigh, normalized);

    vec3 lightDir = normalize(uLightPosition - vPosition);
    float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.6 + 0.4;

    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0) * 0.3;

    float pulse = sin(uTime * 2.0 + normalized * 6.283) * 0.5 + 0.5;
    float minHighlight = smoothstep(0.25, 0.0, normalized) * pulse * 0.35;

    vec3 finalColor = color * diffuse + fresnel + minHighlight;
    gl_FragColor = vec4(finalColor, 0.96);
  }
`;

function generateLossLandscape(size: number): number[][] {
  const data: number[][] = [];
  for (let y = 0; y < size; y += 1) {
    const row: number[] = [];
    for (let x = 0; x < size; x += 1) {
      const nx = (x / size) * 4 - 2;
      const ny = (y / size) * 4 - 2;

      const bump1 = Math.exp(-(nx * nx + ny * ny) * 0.5) * 2;
      const bump2 = Math.exp(-((nx - 1) * (nx - 1) + (ny - 0.5) * (ny - 0.5)) * 0.8) * 1.5;
      const bump3 = Math.exp(-((nx + 0.8) * (nx + 0.8) + (ny + 0.7) * (ny + 0.7)) * 0.6) * 1.2;
      const noise = (Math.random() - 0.5) * 0.1;

      const loss = 3 - bump1 - bump2 - bump3 + noise + 0.5;
      row.push(Math.max(0.1, loss));
    }
    data.push(row);
  }
  return data;
}

export function LossLandscape3D({
  data,
  gridSize = 36,
  colorScheme = 'cyan-green',
  showLabels = true,
  isAnimating = true,
}: LossLandscapeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timeRef = useRef(0);

  const landscape = useMemo(() => {
    if (data && data.length > 0) return data;
    return generateLossLandscape(gridSize);
  }, [data, gridSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060b16');
    scene.fog = new THREE.Fog('#060b16', 16, 36);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 200);
    camera.position.set(8, 6, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 24;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.autoRotate = isAnimating;
    controls.autoRotateSpeed = 0.4;

    const size = landscape.length;
    const segments = Math.max(1, size - 1);
    const geometry = new THREE.PlaneGeometry(10, 10, segments, segments);
    const positions = geometry.attributes.position as THREE.BufferAttribute;

    let min = Infinity;
    let max = -Infinity;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const idx = row * size + col;
        const value = landscape[row][col];
        min = Math.min(min, value);
        max = Math.max(max, value);
        positions.setZ(idx, value);
      }
    }

    const range = Math.max(0.001, max - min);
    for (let i = 0; i < positions.count; i += 1) {
      const z = positions.getZ(i);
      const normalized = (z - min) / range;
      positions.setZ(i, normalized * 2.6);
    }

    geometry.rotateX(-Math.PI / 2);
    geometry.computeVertexNormals();

    const palette = COLOR_SCHEMES[colorScheme] ?? COLOR_SCHEMES['cyan-green'];

    const material = new THREE.ShaderMaterial({
      vertexShader: terrainVertexShader,
      fragmentShader: terrainFragmentShader,
      uniforms: {
        uColorLow: { value: palette.low },
        uColorHigh: { value: palette.high },
        uLightPosition: { value: new THREE.Vector3(5, 10, 5) },
        uTime: { value: 0 },
        uMin: { value: 0 },
        uRange: { value: 2.6 },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0x1f2937, opacity: 0.4, transparent: true })
    );
    scene.add(wireframe);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const light = new THREE.DirectionalLight(0xffffff, 0.85);
    light.position.set(6, 10, 6);
    scene.add(light);
    const accent = new THREE.PointLight(0x38bdf8, 0.4);
    accent.position.set(-5, 8, -5);
    scene.add(accent);

    const hoverMarker = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 18, 18),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, emissiveIntensity: 0.8 })
    );
    hoverMarker.visible = false;
    scene.add(hoverMarker);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(2, 2);
    let hasPointer = false;

    const updateTooltip = (point: THREE.Vector3, value: number) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const projected = point.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * rect.width;
      const y = (-projected.y * 0.5 + 0.5) * rect.height;
      tooltip.style.transform = `translate(${x}px, ${y}px) translate(-50%, -120%)`;
      tooltip.textContent = `Loss: ${value.toFixed(3)}`;
      tooltip.style.opacity = '1';
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      hasPointer = true;
    };

    const onPointerLeave = () => {
      pointer.x = 2;
      pointer.y = 2;
      hasPointer = false;
      hoverMarker.visible = false;
      if (tooltipRef.current) {
        tooltipRef.current.style.opacity = '0';
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    let frameId: number | null = null;
    const animate = () => {
      timeRef.current += 0.01;
      material.uniforms.uTime.value = timeRef.current;
      controls.autoRotate = isAnimating;
      controls.update();

      if (hasPointer) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(mesh);
        if (hits.length > 0) {
          const hit = hits[0];
          hoverMarker.visible = true;
          hoverMarker.position.copy(hit.point);

          if (hit.uv) {
            const gridX = Math.min(size - 1, Math.max(0, Math.round(hit.uv.x * (size - 1))));
            const gridY = Math.min(size - 1, Math.max(0, Math.round((1 - hit.uv.y) * (size - 1))));
            const value = landscape[gridY][gridX];
            updateTooltip(hit.point, value);
          }
        } else {
          hoverMarker.visible = false;
          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = '0';
          }
        }
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.max(200, Math.floor(entry.contentRect.width));
      const nextHeight = Math.max(200, Math.floor(entry.contentRect.height));
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });
    resizeObserver.observe(container);

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      controls.dispose();
      geometry.dispose();
      material.dispose();
      wireframe.geometry.dispose();
      (wireframe.material as THREE.Material).dispose();
      hoverMarker.geometry.dispose();
      (hoverMarker.material as THREE.Material).dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [colorScheme, isAnimating, landscape]);

  return (
    <div ref={containerRef} className="relative h-full w-full rounded-xl bg-[#060b16] overflow-hidden">
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 rounded-lg bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity"
      />
      {showLabels && (
        <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] text-white/60">
          Drag to orbit | Scroll to zoom | Shift+drag to pan
        </div>
      )}
    </div>
  );
}
