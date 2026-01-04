'use client';

import type { LayerNode } from '@/lib/code-parser/model-types';

const estimateParams = (layer: LayerNode) => {
  switch (layer.type) {
    case 'Linear': {
      const inFeatures = Number(layer.params.in_features);
      const outFeatures = Number(layer.params.out_features);
      if (!Number.isFinite(inFeatures) || !Number.isFinite(outFeatures)) return 0;
      return inFeatures * outFeatures + outFeatures;
    }
    case 'Conv2d': {
      const inChannels = Number(layer.params.in_channels);
      const outChannels = Number(layer.params.out_channels);
      const kernel = Number(layer.params.kernel);
      if (
        !Number.isFinite(inChannels) ||
        !Number.isFinite(outChannels) ||
        !Number.isFinite(kernel)
      ) {
        return 0;
      }
      return outChannels * (inChannels * kernel * kernel + 1);
    }
    case 'LSTM': {
      const inputSize = Number(layer.params.input_size);
      const hiddenSize = Number(layer.params.hidden_size);
      if (!Number.isFinite(inputSize) || !Number.isFinite(hiddenSize)) return 0;
      return 4 * hiddenSize * (inputSize + hiddenSize + 1);
    }
    default:
      return 0;
  }
};

export function ModelInsights({ layers }: { layers: LayerNode[] }) {
  const totalParams = layers.reduce((acc, layer) => acc + estimateParams(layer), 0);
  const memoryMb = totalParams ? (totalParams * 4) / (1024 * 1024) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white">
      <h3 className="text-sm font-semibold mb-3">Model Insights</h3>
      <div className="space-y-2 text-white/70">
        <div className="flex items-center justify-between">
          <span>Total parameters</span>
          <span className="text-white">{totalParams.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Trainable</span>
          <span className="text-white">{totalParams.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Memory estimate</span>
          <span className="text-white">{memoryMb.toFixed(2)} MB</span>
        </div>
      </div>
      <div className="mt-4 border-t border-white/10 pt-3">
        <p className="text-xs uppercase tracking-wide text-white/40 mb-2">Layer breakdown</p>
        <div className="space-y-1 max-h-32 overflow-auto pr-1 text-xs">
          {layers.map((layer) => (
            <div key={layer.id} className="flex items-center justify-between">
              <span className="text-white/50">{layer.name}</span>
              <span className="text-white/80">{estimateParams(layer).toLocaleString()}</span>
            </div>
          ))}
          {layers.length === 0 && <p className="text-white/40">No layers parsed yet.</p>}
        </div>
      </div>
    </div>
  );
}

