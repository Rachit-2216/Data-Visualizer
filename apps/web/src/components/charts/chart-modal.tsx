'use client';

import { useMemo, useRef } from 'react';
import { Download, Share2, Repeat2, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VegaLite = dynamic(() => import('react-vega').then((mod) => mod.VegaLite), {
  ssr: false,
});

type ChartModalProps = {
  open: boolean;
  onClose: () => void;
  spec: Record<string, unknown>;
  title?: string;
};

const downloadBlob = (data: string, filename: string, type: string) => {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const downloadDataUrl = (dataUrl: string, filename: string) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const extractRows = (spec: Record<string, any>) => {
  const data = spec?.data;
  if (!data) return null;
  if (Array.isArray(data.values)) return data.values;
  if (data.name && spec.datasets && Array.isArray(spec.datasets[data.name])) {
    return spec.datasets[data.name];
  }
  return null;
};

const toCsv = (rows: Array<Record<string, any>>) => {
  if (rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const escapeValue = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const escaped = raw.replace(/"/g, '""');
    if (/[\n,"]/.test(escaped)) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((key) => escapeValue(row[key])).join(','));
  });
  return lines.join('\n');
};

export function ChartModal({ open, onClose, spec, title }: ChartModalProps) {
  const viewRef = useRef<any>(null);
  const rows = useMemo(() => extractRows(spec), [spec]);
  const canExportCsv = !!rows && rows.length > 0;

  const handleExport = async (format: 'png' | 'svg') => {
    if (!viewRef.current) return;
    if (format === 'png') {
      const url = await viewRef.current.toImageURL('png');
      downloadDataUrl(url, `${title ?? 'chart'}.png`);
    } else {
      const svg = await viewRef.current.toSVG();
      downloadBlob(svg, `${title ?? 'chart'}.svg`, 'image/svg+xml');
    }
  };

  const handleDownloadData = () => {
    const data = JSON.stringify(spec.data ?? {}, null, 2);
    downloadBlob(data, `${title ?? 'chart'}-data.json`, 'application/json');
  };

  const handleExportCsv = () => {
    if (!rows) return;
    const csv = toCsv(rows);
    downloadBlob(csv, `${title ?? 'chart'}.csv`, 'text/csv');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-[#0b111c] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>{title ?? 'Expanded chart'}</DialogTitle>
        </DialogHeader>
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <VegaLite
            spec={{ ...spec, width: 900, height: 480 }}
            actions={false}
            onNewView={(view) => {
              viewRef.current = view;
            }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('png')}>
            <Download className="h-3.5 w-3.5" />
            Export PNG
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('svg')}>
            <Download className="h-3.5 w-3.5" />
            Export SVG
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={handleExportCsv}
            disabled={!canExportCsv}
          >
            <FileText className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadData}>
            <Repeat2 className="h-3.5 w-3.5" />
            Download Data
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Share2 className="h-3.5 w-3.5" />
            Share Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
