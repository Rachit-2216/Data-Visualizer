'use client';

import { useMemo, useState } from 'react';
import { Maximize2, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useVisualsStore } from '@/store/visuals-store';

const VegaLite = dynamic(() => import('react-vega').then((mod) => mod.VegaLite), {
  ssr: false,
});

export function InlineChart({ spec, title }: { spec: Record<string, unknown>; title?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { addChart } = useVisualsStore();

  const interactiveSpec = useMemo(() => {
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
    }
    return next;
  }, [spec]);

  const safeTitle = useMemo(() => {
    const fromSpec = typeof spec.title === 'string' ? spec.title : undefined;
    return title ?? fromSpec ?? 'Assistant chart';
  }, [spec, title]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">{safeTitle}</p>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1"
            onClick={() => addChart(safeTitle, spec)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add to Visuals
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1"
            onClick={() => setExpanded(true)}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Expand
          </Button>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-[#0a0f1a] p-2">
        <VegaLite spec={interactiveSpec} actions={false} />
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-4xl bg-[#0b111c] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{safeTitle}</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">
            <VegaLite spec={{ ...interactiveSpec, width: 820, height: 420 }} actions={false} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
