'use client';

import { useEffect, useMemo, useRef } from 'react';

type CanvasProps = {
  isAnimating: boolean;
  width: number;
  height: number;
  data?: Record<string, unknown> | null;
};

const baseGradient = {
  start: '#0a1628',
  end: '#1a365d',
};

const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, baseGradient.start);
  gradient.addColorStop(1, baseGradient.end);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

const isFiniteNumber = (value: number) => Number.isFinite(value);

const isFinitePoint = (point: { sx: number; sy: number }) =>
  isFiniteNumber(point.sx) && isFiniteNumber(point.sy);

const normalizeColor = (color: string) => (color && color !== 'undefined' ? color : '#22d3ee');

const configureCanvas = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

function LinearRegressionViz({ isAnimating, width, height, data }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const points = useMemo(() => {
    const incoming = (data?.points as Array<{ x: number; y: number; z: number }>) ?? null;
    if (incoming?.length) return incoming;
    return Array.from({ length: 45 }, () => {
      const x = Math.random() * 2 - 1;
      const z = Math.random() * 2 - 1;
      const y = 0.5 * x + 0.3 * z + (Math.random() - 0.5) * 0.4;
      return { x, y, z };
    });
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    configureCanvas(canvas, ctx, width, height);

    let frame = 0;
    let t = 0;
    const project = (x: number, y: number, z: number, rotY: number) => {
      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      const scale = 120 / (3 + rz);
      return { sx: width / 2 + rx * scale, sy: height / 2 - y * scale * 0.8, scale };
    };

    const draw = () => {
      t += 0.008;
      const rotY = t * 0.5;
      drawBackground(ctx, width, height);

      ctx.strokeStyle = 'rgba(148,163,184,0.15)';
      ctx.lineWidth = 0.5;
      for (let i = -5; i <= 5; i += 1) {
        const p1 = project(i * 0.2, -0.8, -1, rotY);
        const p2 = project(i * 0.2, -0.8, 1, rotY);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.stroke();

        const p3 = project(-1, -0.8, i * 0.2, rotY);
        const p4 = project(1, -0.8, i * 0.2, rotY);
        ctx.beginPath();
        ctx.moveTo(p3.sx, p3.sy);
        ctx.lineTo(p4.sx, p4.sy);
        ctx.stroke();
      }

      const planeCorners = [
        project(-1, 0.5 * -1 + 0.3 * -1, -1, rotY),
        project(1, 0.5 * 1 + 0.3 * -1, -1, rotY),
        project(1, 0.5 * 1 + 0.3 * 1, 1, rotY),
        project(-1, 0.5 * -1 + 0.3 * 1, 1, rotY),
      ];

      const planeVisible = planeCorners.every(isFinitePoint);
      if (planeVisible) {
        ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(planeCorners[0].sx, planeCorners[0].sy);
        planeCorners.forEach((p) => ctx.lineTo(p.sx, p.sy));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      points.forEach((pt) => {
        const p = project(pt.x, pt.y, pt.z, rotY);
        if (!isFinitePoint(p)) return;
        const coeffs = (data?.coefficients as { x?: number; z?: number }) ?? { x: 0.5, z: 0.3 };
        const predictedY = (coeffs.x ?? 0.5) * pt.x + (coeffs.z ?? 0.3) * pt.z;
        const pPlane = project(pt.x, predictedY, pt.z, rotY);
        if (!isFinitePoint(pPlane)) return;

        ctx.strokeStyle =
          pt.y > predictedY ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy);
        ctx.lineTo(pPlane.sx, pPlane.sy);
        ctx.stroke();

        const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, 12);
        glow.addColorStop(0, 'rgba(99,102,241,0.3)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      if (isAnimating) {
        frame = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [height, isAnimating, points, width]);

  return <canvas ref={canvasRef} width={width} height={height} className="h-full w-full" />;
}

function LogisticRegressionViz({ isAnimating, width, height, data }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const points = useMemo(() => {
    const incoming = (data?.points as Array<{ x: number; y: number; class: number }>) ?? null;
    if (incoming?.length) {
      return incoming.map((point) => ({
        x: point.x,
        y: point.y,
        z: 0,
        cls: point.class,
      }));
    }
    const pts: Array<{ x: number; y: number; z: number; cls: number }> = [];
    for (let i = 0; i < 40; i += 1) {
      pts.push({
        x: -0.5 + (Math.random() - 0.5) * 0.8,
        y: -0.3 + (Math.random() - 0.5) * 0.8,
        z: (Math.random() - 0.5) * 0.5,
        cls: 0,
      });
    }
    for (let i = 0; i < 40; i += 1) {
      pts.push({
        x: 0.5 + (Math.random() - 0.5) * 0.8,
        y: 0.3 + (Math.random() - 0.5) * 0.8,
        z: (Math.random() - 0.5) * 0.5,
        cls: 1,
      });
    }
    return pts;
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    configureCanvas(canvas, ctx, width, height);

    let frame = 0;
    let t = 0;
    const project = (x: number, y: number, z: number, rotY: number) => {
      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      const scale = 130 / (3 + rz);
      return { sx: width / 2 + rx * scale, sy: height / 2 - y * scale * 0.85, scale };
    };

    const draw = () => {
      t += 0.006;
      const rotY = t * 0.4;
      drawBackground(ctx, width, height);

      points.forEach((pt) => {
        const p = project(pt.x, pt.y, pt.z, rotY);
        const color = normalizeColor(pt.cls === 0 ? '#f97316' : '#6366f1');
        if (!isFinitePoint(p)) return;
        const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, 10);
        glow.addColorStop(0, `${color}40`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      if (isAnimating) {
        frame = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [height, isAnimating, points, width]);

  return <canvas ref={canvasRef} width={width} height={height} className="h-full w-full" />;
}

function KMeansViz({ isAnimating, width, height, data }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
  const centroids = (data?.centroids as Array<{ x: number; y: number }>) ?? [
    { x: -0.5, y: 0.3 },
    { x: 0.6, y: -0.2 },
    { x: -0.2, y: -0.5 },
    { x: 0.4, y: 0.5 },
  ];
  const points = useMemo(() => {
    const incoming = (data?.points as Array<{ x: number; y: number; cluster: number }>) ?? null;
    if (incoming?.length) {
      return incoming.map((pt) => ({ ...pt, z: 0 }));
    }
    const pts: Array<{ x: number; y: number; z: number; cluster: number }> = [];
    centroids.forEach((c, ci) => {
      for (let i = 0; i < 28; i += 1) {
        pts.push({
          x: c.x + (Math.random() - 0.5) * 0.5,
          y: c.y + (Math.random() - 0.5) * 0.5,
          z: (Math.random() - 0.5) * 0.5,
          cluster: ci,
        });
      }
    });
    return pts;
  }, [centroids, data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    configureCanvas(canvas, ctx, width, height);

    let frame = 0;
    let t = 0;
    const project = (x: number, y: number, z: number, rotY: number) => {
      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      const scale = 130 / (3 + rz);
      return { sx: width / 2 + rx * scale, sy: height / 2 - y * scale * 0.9, rz };
    };

    const draw = () => {
      t += 0.006;
      const rotY = t * 0.4;
      drawBackground(ctx, width, height);

      const allItems = [
        ...points.map((p) => ({ ...p, type: 'point' as const })),
        ...centroids.map((c, i) => ({ ...c, type: 'centroid' as const, cluster: i })),
      ]
        .map((item) => {
          const proj = project(item.x, item.y, item.z, rotY);
          return { ...item, ...proj };
        })
        .filter((item) => isFinitePoint(item))
        .sort((a, b) => a.rz - b.rz);

      allItems.forEach((item) => {
        const color = normalizeColor(colors[item.cluster ?? -1] ?? '#22d3ee');
        if (item.type === 'point') {
          const glow = ctx.createRadialGradient(item.sx, item.sy, 0, item.sx, item.sy, 10);
          glow.addColorStop(0, `${color}40`);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(item.sx, item.sy, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(item.sx, item.sy, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = color;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let i = 0; i < 10; i += 1) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? 14 : 7;
            const px = item.sx + Math.cos(angle) * r;
            const py = item.sy + Math.sin(angle) * r;
            if (i === 0) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      });

      if (isAnimating) {
        frame = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [height, isAnimating, points, width]);

  return <canvas ref={canvasRef} width={width} height={height} className="h-full w-full" />;
}

function PCAViz({ isAnimating, width, height, data }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const classes = ['#6366f1', '#10b981', '#f59e0b'];
  const points = useMemo(() => {
    const incoming = (data?.points as Array<{ x: number; y: number; z: number; class: number }>) ?? null;
    if (incoming?.length) {
      return incoming.map((pt) => ({
        x: pt.x,
        y: pt.y,
        z: pt.z,
        cls: pt.class,
      }));
    }
    const pts: Array<{ x: number; y: number; z: number; cls: number }> = [];
    for (let c = 0; c < 3; c += 1) {
      const cx = (c - 1) * 0.5;
      const cy = (c - 1) * 0.3;
      for (let i = 0; i < 35; i += 1) {
        pts.push({
          x: cx + (Math.random() - 0.5) * 0.6,
          y: cy + (Math.random() - 0.5) * 0.6,
          z: (Math.random() - 0.5) * 0.4,
          cls: c,
        });
      }
    }
    return pts;
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    configureCanvas(canvas, ctx, width, height);

    let frame = 0;
    let t = 0;
    const project = (x: number, y: number, z: number, rotY: number) => {
      const cos = Math.cos(rotY);
      const sin = Math.sin(rotY);
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      const denom = Math.max(0.4, 3 + rz);
      const scale = Math.min(240, 140 / denom);
      return { sx: width / 2 + rx * scale, sy: height / 2 - y * scale * 0.85, scale };
    };

    const draw = () => {
      t += 0.007;
      const rotY = t * 0.35;
      drawBackground(ctx, width, height);

      points.forEach((pt) => {
        const p = project(pt.x, pt.y, pt.z, rotY);
        if (!Number.isFinite(p.sx) || !Number.isFinite(p.sy) || !Number.isFinite(p.scale)) {
          return;
        }
        const color = normalizeColor(classes[pt.cls ?? -1] ?? '#22d3ee');
        const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, 8);
        glow.addColorStop(0, `${color}40`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      if (isAnimating) {
        frame = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [height, isAnimating, points, width]);

  return <canvas ref={canvasRef} width={width} height={height} className="h-full w-full" />;
}

function DecisionTreeViz({ isAnimating, width, height, data }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    configureCanvas(canvas, ctx, width, height);

    const tree =
      (data?.tree as any) ??
      {
        condition: 'age <= 35',
        left: {
          condition: 'income <= 50K',
          left: { class: 0, samples: 45 },
          right: { class: 1, samples: 32 },
        },
        right: {
          condition: 'score <= 75',
          left: { class: 0, samples: 28 },
          right: { class: 1, samples: 95 },
        },
      };

    let frame = 0;
    let t = 0;
    const drawNode = (node: any, x: number, y: number, level: number, maxWidth: number) => {
      const nodeW = 95;
      const nodeH = 42;
      const isLeaf = node.class !== undefined;
      const pulse = Math.sin(t * 2 + level) * 0.05 + 1;

      const glow = ctx.createRadialGradient(x, y, 0, x, y, 55 * pulse);
      glow.addColorStop(
        0,
        isLeaf
          ? node.class === 0
            ? 'rgba(239,68,68,0.2)'
            : 'rgba(16,185,129,0.2)'
          : 'rgba(99,102,241,0.15)'
      );
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 55, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isLeaf
        ? node.class === 0
          ? 'rgba(239,68,68,0.3)'
          : 'rgba(16,185,129,0.3)'
        : 'rgba(99,102,241,0.3)';
      ctx.strokeStyle = isLeaf ? (node.class === 0 ? '#ef4444' : '#10b981') : '#6366f1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x - nodeW / 2, y - nodeH / 2, nodeW, nodeH, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Geist, sans-serif';
      ctx.textAlign = 'center';
      if (isLeaf) {
        ctx.fillText(`Class ${node.class}`, x, y - 5);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Geist, sans-serif';
        ctx.fillText(`n = ${node.samples}`, x, y + 12);
      } else {
        ctx.fillText(node.condition, x, y + 4);
      }

      if (!isLeaf) {
        const childY = y + 90;
        const spread = maxWidth / Math.pow(2, level + 1);

        ctx.strokeStyle = 'rgba(147,197,253,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 20, y + nodeH / 2);
        ctx.lineTo(x - spread, childY - nodeH / 2);
        ctx.stroke();

        drawNode(node.left, x - spread, childY, level + 1, maxWidth);

        ctx.beginPath();
        ctx.moveTo(x + 20, y + nodeH / 2);
        ctx.lineTo(x + spread, childY - nodeH / 2);
        ctx.stroke();

        drawNode(node.right, x + spread, childY, level + 1, maxWidth);
      }
    };

    const draw = () => {
      t += 0.02;
      drawBackground(ctx, width, height);
      drawNode(tree, width / 2, 55, 0, width * 0.7);

      if (isAnimating) {
        frame = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [height, isAnimating, width]);

  return <canvas ref={canvasRef} width={width} height={height} className="h-full w-full" />;
}

export function VisualizationCanvas({
  type,
  isAnimating,
  width,
  height,
  data,
}: CanvasProps & { type: string }) {
  switch (type) {
    case 'regression':
      return <LinearRegressionViz isAnimating={isAnimating} width={width} height={height} data={data} />;
    case 'logistic':
      return <LogisticRegressionViz isAnimating={isAnimating} width={width} height={height} data={data} />;
    case 'kmeans':
      return <KMeansViz isAnimating={isAnimating} width={width} height={height} data={data} />;
    case 'pca':
      return <PCAViz isAnimating={isAnimating} width={width} height={height} data={data} />;
    case 'tree':
      return <DecisionTreeViz isAnimating={isAnimating} width={width} height={height} data={data} />;
    default:
      return <LinearRegressionViz isAnimating={isAnimating} width={width} height={height} data={data} />;
  }
}
