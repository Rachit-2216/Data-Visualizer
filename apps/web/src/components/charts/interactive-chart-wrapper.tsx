'use client';

import { useMemo, useRef, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ChartExpandModal } from './chart-expand-modal';

const VegaLite = dynamic(() => import('react-vega').then((mod) => mod.VegaLite), {
  ssr: false,
});

type InteractiveChartWrapperProps = {
  spec: Record<string, unknown>;
  title?: string;
};

const getTooltipFields = (encoding: Record<string, any>) => {
  const fields: Array<{ field: string; type?: string }> = [];
  ['x', 'y', 'color', 'theta', 'size'].forEach((key) => {
    const enc = encoding[key];
    if (enc?.field) {
      fields.push({ field: enc.field, type: enc.type });
    }
  });
  return fields;
};

const addInteractivity = (spec: Record<string, unknown>) => {
  const next = JSON.parse(JSON.stringify(spec)) as Record<string, any>;
  next.params = next.params ?? [];
  next.params.push({
    name: 'hover',
    select: { type: 'point', on: 'mouseover', clear: 'mouseout' },
  });
  next.params.push({
    name: 'select',
    select: { type: 'point', on: 'click', clear: 'dblclick' },
  });

  if (next.encoding) {
    next.encoding.opacity =
      next.encoding.opacity ??
      ({
        condition: [
          { param: 'hover', value: 1 },
          { param: 'select', value: 1 },
        ],
        value: 0.3,
      } as any);
    next.encoding.tooltip = next.encoding.tooltip ?? getTooltipFields(next.encoding);
  }

  next.config = {
    ...(next.config ?? {}),
    view: { stroke: 'transparent' },
    axis: { labelColor: '#cbd5f5', titleColor: '#cbd5f5' },
  };

  return next;
};

export function InteractiveChartWrapper({ spec, title }: InteractiveChartWrapperProps) {
  const [expanded, setExpanded] = useState(false);
  const viewRef = useRef<any>(null);
  const interactiveSpec = useMemo(() => addInteractivity(spec), [spec]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden group">
      <div className="aspect-[4/3] bg-black/30 flex items-center justify-center relative">
        <VegaLite
          spec={interactiveSpec}
          actions={false}
          onNewView={(view) => {
            viewRef.current = view;
          }}
        />

        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setExpanded(true)}>
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </Button>
        </div>
      </div>

      {title && (
        <div className="p-3 border-t border-white/10">
          <p className="text-sm font-medium text-white">{title}</p>
        </div>
      )}

      <ChartExpandModal
        open={expanded}
        onClose={() => setExpanded(false)}
        spec={interactiveSpec}
        title={title}
      />
    </div>
  );
}
