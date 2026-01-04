'use client';

import type { LayerNode } from '@/lib/code-parser/model-types';

export function LayerDetailPanel({ layer }: { layer: LayerNode | null }) {
  if (!layer) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
        Select a layer to see details.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white">
      <h3 className="text-sm font-semibold mb-3">{layer.name}</h3>
      <div className="space-y-2 text-white/70">
        <div className="flex items-center justify-between">
          <span>Type</span>
          <span className="text-white">{layer.type}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Input</span>
          <span className="text-white">{layer.inputShape ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Output</span>
          <span className="text-white">{layer.outputShape ?? '-'}</span>
        </div>
        {layer.activation && (
          <div className="flex items-center justify-between">
            <span>Activation</span>
            <span className="text-white">{layer.activation}</span>
          </div>
        )}
        {Object.keys(layer.params).length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs uppercase tracking-wide text-white/40 mb-1">Parameters</p>
            <div className="space-y-1">
              {Object.entries(layer.params).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-white/50">{key}</span>
                  <span className="text-white/80">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {layer.sourceLine && (
          <p className="text-xs text-white/40 pt-2">Line {layer.sourceLine}</p>
        )}
      </div>
    </div>
  );
}

