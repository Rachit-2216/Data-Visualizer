'use client';

import { useMemo, useRef, useState } from 'react';
import type { LayerNode } from '@/lib/code-parser/model-types';
import { cn } from '@/lib/utils';

type NetworkGraphProps = {
  layers: LayerNode[];
  selectedId: string | null;
  isAnimating: boolean;
  onSelect: (id: string) => void;
  onReorder: (from: number, to: number) => void;
};

type Point = { x: number; y: number };

export function NetworkGraph({
  layers,
  selectedId,
  isAnimating,
  onSelect,
  onReorder,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const { nodes, edges } = useMemo(() => {
    const width = 860;
    const height = 280;
    const spacing = width / Math.max(1, layers.length + 1);
    const nodeRadius = 18;
    const nodesLayout = layers.map((layer, i) => ({
      ...layer,
      x: spacing * (i + 1),
      y: height / 2,
      index: i,
      radius: nodeRadius,
    }));
    const edgesLayout = nodesLayout.slice(1).map((node, i) => ({
      id: `edge-${i}`,
      from: nodesLayout[i],
      to: node,
    }));
    return { nodes: nodesLayout, edges: edgesLayout };
  }, [layers]);

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const nextScale = Math.min(1.6, Math.max(0.6, scale - event.deltaY * 0.001));
    setScale(nextScale);
  };

  const handlePanStart = (event: React.MouseEvent) => {
    if (event.button !== 0) return;
    const start = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    const onMove = (moveEvent: MouseEvent) => {
      setOffset({ x: moveEvent.clientX - start.x, y: moveEvent.clientY - start.y });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleNodeDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleNodeDragEnd = (event: React.MouseEvent) => {
    if (draggingIndex === null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left - offset.x) / scale;
    const spacing = 860 / Math.max(1, layers.length + 1);
    const targetIndex = Math.min(
      layers.length - 1,
      Math.max(0, Math.round(x / spacing) - 1)
    );
    onReorder(draggingIndex, targetIndex);
    setDraggingIndex(null);
  };

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-xl border border-white/10 bg-[#060b16] overflow-hidden"
      onWheel={handleWheel}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 860 280"
        onMouseDown={handlePanStart}
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {edges.map((edge) => {
            const isActive =
              edge.from.id === hoveredId ||
              edge.to.id === hoveredId ||
              edge.from.id === selectedId ||
              edge.to.id === selectedId;
            return (
              <line
                key={edge.id}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                stroke={isActive ? '#22d3ee' : 'rgba(148,163,184,0.35)'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isAnimating ? '6 6' : undefined}
                className={cn(isAnimating && 'animate-[dash_1.6s_linear_infinite]')}
              />
            );
          })}

          {nodes.map((node) => {
            const isActive = node.id === selectedId || node.id === hoveredId;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  handleNodeDragStart(node.index);
                }}
                onMouseUp={(event) => {
                  event.stopPropagation();
                  handleNodeDragEnd(event);
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(node.id);
                }}
                className="cursor-pointer"
              >
                <circle
                  r={node.radius + 6}
                  fill={isActive ? 'rgba(34,211,238,0.2)' : 'rgba(99,102,241,0.15)'}
                  filter="url(#glow)"
                />
                <circle
                  r={node.radius}
                  fill={isActive ? '#38bdf8' : '#1e293b'}
                  stroke={isActive ? '#7dd3fc' : '#475569'}
                  strokeWidth="2"
                />
                <text
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="10"
                  dy="4"
                >
                  {node.type}
                </text>
                <text
                  textAnchor="middle"
                  fill="rgba(226,232,240,0.6)"
                  fontSize="9"
                  dy="18"
                >
                  {node.outputShape ?? ''}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

