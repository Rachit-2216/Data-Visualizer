'use client';

import { useMemo } from 'react';

type MetricData = {
  epoch: number;
  value: number;
};

type TrainingDashboardProps = {
  metrics: {
    trainLoss: MetricData[];
    trainAccuracy: MetricData[];
    valLoss: MetricData[];
    valAccuracy: MetricData[];
    batchTime: MetricData[];
    epochTime: MetricData[];
  };
  currentEpoch: number;
  totalEpochs: number;
  isTraining: boolean;
};

function buildSparkline(data: MetricData[], width: number, height: number) {
  if (data.length < 2) return '';
  const values = data.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1e-6);
  const pad = 2;
  const usableWidth = width - pad * 2;
  const usableHeight = height - pad * 2;

  return data
    .map((point, idx) => {
      const x = pad + (idx / (data.length - 1)) * usableWidth;
      const y = pad + (1 - (point.value - min) / range) * usableHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

function MiniGraph({
  data,
  label,
  color,
  formatter = (value: number) => value.toFixed(2),
}: {
  data: MetricData[];
  label: string;
  color: string;
  formatter?: (value: number) => string;
}) {
  const currentValue = data[data.length - 1]?.value ?? 0;
  const points = useMemo(() => buildSparkline(data, 140, 48), [data]);

  return (
    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/50">{label}</span>
        <span className="text-sm font-mono text-white">{formatter(currentValue)}</span>
      </div>
      <svg width="100%" height="48" viewBox="0 0 140 48" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function TrainingDashboard({
  metrics,
  currentEpoch,
  totalEpochs,
  isTraining,
}: TrainingDashboardProps) {
  const progress = totalEpochs > 0 ? (currentEpoch / totalEpochs) * 100 : 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs.toFixed(0)}s` : `${secs.toFixed(2)}s`;
  };

  return (
    <div className="bg-[#0a0f1a] rounded-xl border border-white/10 p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">
            {isTraining ? 'Training' : 'Idle'} - Epoch {currentEpoch}/{totalEpochs}
          </span>
          <span className="text-xs text-white/50">{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniGraph data={metrics.trainLoss} label="Train Loss" color="#f97316" />
        <MiniGraph
          data={metrics.trainAccuracy}
          label="Train Accuracy"
          color="#10b981"
          formatter={(value) => `${value.toFixed(1)}%`}
        />
        <MiniGraph data={metrics.valLoss} label="Val Loss" color="#ef4444" />
        <MiniGraph
          data={metrics.valAccuracy}
          label="Val Accuracy"
          color="#22d3ee"
          formatter={(value) => `${value.toFixed(1)}%`}
        />
        <MiniGraph
          data={metrics.batchTime}
          label="Batch Time"
          color="#a855f7"
          formatter={formatTime}
        />
        <MiniGraph
          data={metrics.epochTime}
          label="Epoch Time"
          color="#eab308"
          formatter={formatTime}
        />
      </div>
    </div>
  );
}
