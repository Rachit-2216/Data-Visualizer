'use client';

import { useMemo, useState } from 'react';
import { Maximize2, Download } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ClientErrorBoundary } from '@/components/common/client-error-boundary';
import { ChartModal } from './chart-modal';

const VegaLite = dynamic(() => import('react-vega').then((mod) => mod.VegaLite), {
  ssr: false,
});

type ChartWrapperProps = {
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

  if (next.encoding) {
    next.encoding.tooltip = next.encoding.tooltip ?? getTooltipFields(next.encoding);
  }

  next.config = {
    ...(next.config ?? {}),
    view: { stroke: 'transparent' },
    axis: { labelColor: '#cbd5f5', titleColor: '#cbd5f5' },
  };

  return next;
};

export function ChartWrapper({ spec, title }: ChartWrapperProps) {
  const [expanded, setExpanded] = useState(false);
  const interactiveSpec = useMemo(() => addInteractivity(spec), [spec]);

  return (
    <div className="relative isolate rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:z-10 hover:shadow-[0_16px_40px_rgba(2,6,23,0.45)]">
      <div className="aspect-[4/3] bg-black/30 flex items-center justify-center relative">
        <ClientErrorBoundary
          fallback={<div className="text-xs text-white/60">Chart unavailable</div>}
        >
          <VegaLite spec={interactiveSpec} actions={false} />
        </ClientErrorBoundary>
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setExpanded(true)}>
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setExpanded(true)}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {title && (
        <div className="p-3 border-t border-white/10">
          <p className="text-sm font-medium text-white">{title}</p>
        </div>
      )}

      <ChartModal
        open={expanded}
        onClose={() => setExpanded(false)}
        spec={interactiveSpec}
        title={title}
      />
    </div>
  );
}
