'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LayerNode } from '@/lib/code-parser/model-types';

type NeuralNetwork3DProps = {
  layers: LayerNode[];
  activations?: number[][];
  selectedLayerId?: string | null;
  isAnimating?: boolean;
  onLayerSelect?: (id: string) => void;
};

type LayerConfig = {
  id: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  position: [number, number, number];
  color: string;
};

type LayerVisual = {
  id: string;
  group: THREE.Group;
  outline: THREE.LineSegments;
  hitBox: THREE.Mesh;
  label: THREE.Sprite;
  baseY: number;
  config: LayerConfig;
};

const VOXEL_SPACING = 0.5;
const VOXEL_SIZE = 0.4;

function layersToConfig(layers: LayerNode[]): LayerConfig[] {
  const configs: LayerConfig[] = [];
  let zPosition = 0;
  const layerGap = 4;

  layers.forEach((layer, index) => {
    let width = 1;
    let height = 1;
    let depth = 1;
    let color = '#6366f1';

    switch (layer.type) {
      case 'Input': {
        const features =
          Number(layer.params.features) ||
          Number(layer.params.input_size) ||
          Number(layer.params.in_features) ||
          8;
        const size = Math.ceil(Math.sqrt(features));
        width = size;
        height = size;
        depth = 1;
        color = '#38bdf8';
        break;
      }
      case 'Conv2d': {
        const outChannels = Number(layer.params.out_channels) || 16;
        const kernel = Number(layer.params.kernel) || Number(layer.params.kernel_size) || 3;
        width = kernel;
        height = kernel;
        depth = Math.min(outChannels, 32);
        color = '#0ea5e9';
        break;
      }
      case 'Linear': {
        const outFeatures = Number(layer.params.out_features) || 64;
        const size = Math.ceil(Math.sqrt(outFeatures));
        width = size;
        height = size;
        depth = 1;
        color = '#8b5cf6';
        break;
      }
      case 'MaxPool2d':
      case 'AvgPool2d': {
        width = 2;
        height = 2;
        depth = configs[index - 1]?.depth || 8;
        color = '#f59e0b';
        break;
      }
      case 'ReLU':
      case 'Sigmoid':
      case 'Tanh':
      case 'GELU':
      case 'LeakyReLU': {
        const prev = configs[index - 1];
        if (prev) {
          width = prev.width;
          height = prev.height;
          depth = prev.depth;
        }
        color = '#10b981';
        break;
      }
      case 'Flatten': {
        width = 1;
        height = 1;
        depth = 1;
        color = '#ec4899';
        break;
      }
      case 'Dropout': {
        const prevLayer = configs[index - 1];
        if (prevLayer) {
          width = prevLayer.width;
          height = prevLayer.height;
          depth = prevLayer.depth;
        }
        color = '#64748b';
        break;
      }
      case 'LSTM': {
        const hiddenSize = Number(layer.params.hidden_size) || 64;
        width = Math.ceil(Math.sqrt(hiddenSize));
        height = width;
        depth = 2;
        color = '#f97316';
        break;
      }
      case 'Softmax': {
        const classes = Number(layer.params.dim) || 10;
        width = classes;
        height = 1;
        depth = 1;
        color = '#ef4444';
        break;
      }
      default:
        width = 4;
        height = 4;
        depth = 1;
    }

    configs.push({
      id: layer.id,
      type: layer.type,
      width,
      height,
      depth,
      position: [0, 0, zPosition],
      color,
    });

    zPosition += Math.max(depth * 0.3, 1) + layerGap;
  });

  const totalLength = zPosition - layerGap;
  configs.forEach((config) => {
    config.position[2] -= totalLength / 2;
  });

  return configs;
}

function getLayerSize(config: LayerConfig) {
  return {
    x: Math.max(1, config.width) * VOXEL_SPACING,
    y: Math.max(1, config.height) * VOXEL_SPACING,
    z: Math.max(1, config.depth) * VOXEL_SPACING,
  };
}

function createLabelSprite(text: string, color: string) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.Sprite(new THREE.SpriteMaterial({ color }));
  }

  ctx.font = '24px "Space Grotesk", sans-serif';
  const metrics = ctx.measureText(text);
  const padding = 24;
  canvas.width = Math.min(512, Math.ceil(metrics.width) + padding);
  canvas.height = 64;

  ctx.font = '24px "Space Grotesk", sans-serif';
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padding / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(canvas.width / 80, canvas.height / 80, 1);
  return sprite;
}

function buildConnections(configs: LayerConfig[]) {
  const positions: number[] = [];
  const corners = [
    [-0.5, -0.5],
    [-0.5, 0.5],
    [0.5, -0.5],
    [0.5, 0.5],
  ];

  for (let i = 0; i < configs.length - 1; i += 1) {
    const from = configs[i];
    const to = configs[i + 1];
    const fromSize = getLayerSize(from);
    const toSize = getLayerSize(to);

    corners.forEach(([cx, cy]) => {
      positions.push(
        from.position[0] + cx * fromSize.x,
        from.position[1] + cy * fromSize.y,
        from.position[2] + fromSize.z * 0.55
      );
      positions.push(
        to.position[0] + cx * toSize.x,
        to.position[1] + cy * toSize.y,
        to.position[2] - toSize.z * 0.55
      );
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x334155, transparent: true, opacity: 0.4 });
  return new THREE.LineSegments(geometry, material);
}

export function NeuralNetwork3D({
  layers,
  activations,
  selectedLayerId,
  isAnimating = true,
  onLayerSelect,
}: NeuralNetwork3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const selectedRef = useRef(selectedLayerId ?? null);
  const animatingRef = useRef(isAnimating);
  const onSelectRef = useRef(onLayerSelect);

  const configs = useMemo(() => layersToConfig(layers), [layers]);

  useEffect(() => {
    selectedRef.current = selectedLayerId ?? null;
  }, [selectedLayerId]);

  useEffect(() => {
    animatingRef.current = isAnimating;
  }, [isAnimating]);

  useEffect(() => {
    onSelectRef.current = onLayerSelect;
  }, [onLayerSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || configs.length === 0) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#060b16');
    scene.fog = new THREE.Fog('#060b16', 18, 60);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 200);
    camera.position.set(15, 8, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 6;
    controls.maxDistance = 50;
    controls.autoRotate = isAnimating;
    controls.autoRotateSpeed = 0.35;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6);
    keyLight.position.set(10, 12, 6);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x38bdf8, 0.4);
    fillLight.position.set(-8, -6, -4);
    scene.add(fillLight);

    const visuals: LayerVisual[] = [];
    const hitTargets: THREE.Mesh[] = [];

    const boxGeo = new THREE.BoxGeometry(VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE);

    configs.forEach((config, index) => {
      const group = new THREE.Group();
      group.position.set(...config.position);

      const total = config.width * config.height * config.depth;
      const material = new THREE.MeshStandardMaterial({ color: config.color });
      const instanced = new THREE.InstancedMesh(boxGeo, material, total);
      instanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instanced.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(total * 3), 3);

      const size = getLayerSize(config);
      const tempMatrix = new THREE.Matrix4();
      const tempColor = new THREE.Color();

      let idx = 0;
      for (let z = 0; z < config.depth; z += 1) {
        for (let y = 0; y < config.height; y += 1) {
          for (let x = 0; x < config.width; x += 1) {
            const activation = activations?.[index]?.[idx] ?? Math.random();
            const brightness = 0.25 + activation * 0.75;
            tempColor.set(config.color).multiplyScalar(brightness);
            instanced.setColorAt(idx, tempColor);

            tempMatrix.makeTranslation(
              (x - config.width / 2 + 0.5) * VOXEL_SPACING,
              (y - config.height / 2 + 0.5) * VOXEL_SPACING,
              (z - config.depth / 2 + 0.5) * VOXEL_SPACING
            );
            instanced.setMatrixAt(idx, tempMatrix);
            idx += 1;
          }
        }
      }

      group.add(instanced);

      const outlineGeometry = new THREE.EdgesGeometry(
        new THREE.BoxGeometry(size.x + 0.4, size.y + 0.4, size.z + 0.4)
      );
      const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
      const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
      outline.visible = false;
      group.add(outline);

      const label = createLabelSprite(config.type, '#e2e8f0');
      label.position.set(0, size.y * 0.6 + 0.6, 0);
      group.add(label);

      const hitBox = new THREE.Mesh(
        new THREE.BoxGeometry(size.x + 0.6, size.y + 0.6, size.z + 0.6),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
      );
      hitBox.userData.layerId = config.id;
      group.add(hitBox);
      hitTargets.push(hitBox);

      scene.add(group);

      visuals.push({
        id: config.id,
        group,
        outline,
        hitBox,
        label,
        baseY: config.position[1],
        config,
      });
    });

    const connections = buildConnections(configs);
    scene.add(connections);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(2, 2);
    let hasPointer = false;

    const updateTooltip = (visual: LayerVisual, point: THREE.Vector3) => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const projected = point.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * rect.width;
      const y = (-projected.y * 0.5 + 0.5) * rect.height;
      const { width, height, depth } = visual.config;
      tooltip.style.transform = `translate(${x}px, ${y}px) translate(-50%, -120%)`;
      tooltip.textContent = `${visual.config.type} | ${width}x${height}x${depth}`;
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
      document.body.style.cursor = 'default';
      if (tooltipRef.current) {
        tooltipRef.current.style.opacity = '0';
      }
    };

    const onClick = () => {
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      if (hits.length === 0) return;
      const id = hits[0].object.userData.layerId as string | undefined;
      if (id && onSelectRef.current) {
        onSelectRef.current(id);
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('click', onClick);

    let time = 0;
    let frameId: number | null = null;

    const animate = () => {
      time += 0.01;
      controls.autoRotate = animatingRef.current;
      controls.update();

      let hoveredId: string | null = null;
      if (hasPointer) {
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(hitTargets, false);
        if (hits.length > 0) {
          hoveredId = hits[0].object.userData.layerId as string;
        }
      }

      visuals.forEach((visual, index) => {
        const isSelected = selectedRef.current === visual.id;
        const isHovered = hoveredId === visual.id;
        visual.outline.visible = isSelected || isHovered;
        (visual.outline.material as THREE.LineBasicMaterial).color.set(
          isSelected ? '#22d3ee' : '#f8fafc'
        );

        if (animatingRef.current) {
          visual.group.position.y = visual.baseY + Math.sin(time + index) * 0.12;
        } else {
          visual.group.position.y = visual.baseY;
        }
      });

      if (hoveredId) {
        const visual = visuals.find((item) => item.id === hoveredId);
        if (visual) {
          const center = new THREE.Vector3();
          visual.hitBox.getWorldPosition(center);
          updateTooltip(visual, center);
          document.body.style.cursor = 'pointer';
        }
      } else {
        if (tooltipRef.current) {
          tooltipRef.current.style.opacity = '0';
        }
        document.body.style.cursor = 'default';
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.max(240, Math.floor(entry.contentRect.width));
      const nextHeight = Math.max(240, Math.floor(entry.contentRect.height));
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
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      connections.geometry.dispose();
      (connections.material as THREE.Material).dispose();
      visuals.forEach((visual) => {
        visual.outline.geometry.dispose();
        (visual.outline.material as THREE.Material).dispose();
        visual.hitBox.geometry.dispose();
        (visual.hitBox.material as THREE.Material).dispose();
        visual.group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
          if (child instanceof THREE.Sprite) {
            const spriteMaterial = child.material as THREE.SpriteMaterial;
            spriteMaterial.map?.dispose();
            spriteMaterial.dispose();
          }
        });
      });
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [activations, configs]);

  if (layers.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#060b16] rounded-xl">
        <div className="text-center text-white/50">
          <p className="mb-2">No layers to visualize</p>
          <p className="text-xs">Write model code to see the architecture</p>
        </div>
      </div>
    );
  }

  const totalUnits = configs.reduce((acc, config) => acc + config.width * config.height * config.depth, 0);

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[#060b16] rounded-xl overflow-hidden">
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-0 top-0 rounded-lg bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity"
      />

      <div className="absolute bottom-4 left-4 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#0ea5e9]" />
          <span className="text-white/60">Conv</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#8b5cf6]" />
          <span className="text-white/60">Linear</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#10b981]" />
          <span className="text-white/60">Activation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
          <span className="text-white/60">Pool</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 text-xs text-white/50">
        <div>{layers.length} layers</div>
        <div>{totalUnits} units</div>
      </div>
    </div>
  );
}
