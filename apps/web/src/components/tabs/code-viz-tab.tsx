'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Code2, Layers, Mountain, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatasetStore } from '@/store/dataset-store';
import { useCodeVizStore, selectLayerById, type ModelType } from '@/store/codeviz-store';
import { parsePyTorchSequential } from '@/lib/code-parser/pytorch-parser';
import { parseTensorflowModel } from '@/lib/code-parser/tensorflow-parser';
import { CodeEditor } from '@/components/codeviz/code-editor';
import { NetworkGraph } from '@/components/codeviz/network-graph';
import { ModelInsights } from '@/components/codeviz/model-insights';
import { LayerDetailPanel } from '@/components/codeviz/layer-detail-panel';
import { VisualizationControls } from '@/components/codeviz/visualization-controls';
import { presetTemplates, baseExamples } from '@/components/codeviz/preset-templates';
import { VisualizationCanvas } from '@/components/codeviz/legacy-visuals';
import { TrainingDashboard } from '@/components/codeviz/training-dashboard';
import { ClientErrorBoundary } from '@/components/common/client-error-boundary';
import { apiJson } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { isUuid } from '@/lib/utils';
import dynamic from 'next/dynamic';

const vizTypes: Array<{ id: ModelType; name: string; desc: string }> = [
  { id: 'neural', name: 'Neural Network', desc: 'PyTorch / Keras models' },
  { id: 'regression', name: 'Linear Regression', desc: '3D regression plane' },
  { id: 'logistic', name: 'Logistic Regression', desc: 'Decision boundary' },
  { id: 'kmeans', name: 'K-Means Clustering', desc: 'Cluster visualization' },
  { id: 'pca', name: 'PCA', desc: '3D projection' },
  { id: 'tree', name: 'Decision Tree', desc: 'Tree structure' },
];

type VizTab = 'architecture' | 'landscape' | 'training';

const Loading3D = () => (
  <div className="h-full w-full flex items-center justify-center text-white/50">
    Loading 3D scene...
  </div>
);

const NeuralNetwork3D = dynamic(
  () => import('@/components/codeviz/neural-network-3d').then((mod) => mod.NeuralNetwork3D),
  { ssr: false, loading: Loading3D }
);

const LossLandscape3D = dynamic(
  () => import('@/components/codeviz/loss-landscape-3d').then((mod) => mod.LossLandscape3D),
  { ssr: false, loading: Loading3D }
);

function useCanvasSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 720, height: 420 });

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(520, Math.floor(width)),
        height: Math.max(320, Math.floor(height)),
      });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, size };
}

function getDatasetDefaults(dataset?: {
  name: string;
  columns: Array<{ name: string }>;
  sampleRows?: Array<Record<string, unknown>>;
  profile?: { stats?: { columnCount?: number } };
}) {
  if (!dataset) {
    return { inputSize: 8, outputSize: 2 };
  }
  const name = dataset.name.toLowerCase();
  if (name.includes('titanic')) return { inputSize: 9, outputSize: 2 };
  if (name.includes('iris')) return { inputSize: 4, outputSize: 3 };
  const inferredCount = dataset.sampleRows?.[0] ? Object.keys(dataset.sampleRows[0]).length : 0;
  const columnCount = dataset.columns.length || dataset.profile?.stats?.columnCount || inferredCount || 0;
  return {
    inputSize: Math.max(2, columnCount),
    outputSize: 2,
  };
}

const buildFallbackLayers = (inputSize: number, outputSize: number) => {
  const hidden1 = Math.min(128, Math.max(16, Math.round(inputSize * 4)));
  const hidden2 = Math.min(64, Math.max(8, Math.round(hidden1 / 2)));
  const layers = [
    {
      id: `layer-input-${Date.now()}`,
      name: 'Input',
      type: 'Input',
      params: { features: inputSize },
      inputShape: `[${inputSize}]`,
      outputShape: `[${inputSize}]`,
    },
    {
      id: `layer-dense-${Date.now() + 1}`,
      name: 'Dense1',
      type: 'Linear',
      params: { in_features: inputSize, out_features: hidden1 },
      inputShape: `[${inputSize}]`,
      outputShape: `[${hidden1}]`,
    },
    {
      id: `layer-activation-${Date.now() + 2}`,
      name: 'ReLU',
      type: 'ReLU',
      params: {},
      inputShape: `[${hidden1}]`,
      outputShape: `[${hidden1}]`,
    },
    {
      id: `layer-dense-${Date.now() + 3}`,
      name: 'Dense2',
      type: 'Linear',
      params: { in_features: hidden1, out_features: hidden2 },
      inputShape: `[${hidden1}]`,
      outputShape: `[${hidden2}]`,
    },
    {
      id: `layer-activation-${Date.now() + 4}`,
      name: 'ReLU',
      type: 'ReLU',
      params: {},
      inputShape: `[${hidden2}]`,
      outputShape: `[${hidden2}]`,
    },
    {
      id: `layer-output-${Date.now() + 5}`,
      name: 'Output',
      type: 'Linear',
      params: { in_features: hidden2, out_features: outputSize },
      inputShape: `[${hidden2}]`,
      outputShape: `[${outputSize}]`,
    },
    {
      id: `layer-softmax-${Date.now() + 6}`,
      name: 'Softmax',
      type: 'Softmax',
      params: { dim: 1 },
      inputShape: `[${outputSize}]`,
      outputShape: `[${outputSize}]`,
    },
  ];
  return layers;
};

const ensureParsedLayers = (
  parsed: { layers: Array<any>; errors: string[] } | null,
  inputSize: number,
  outputSize: number
) => {
  if (!parsed || parsed.layers.length > 0) return parsed;
  return {
    layers: buildFallbackLayers(inputSize, outputSize),
    errors: parsed.errors.length
      ? parsed.errors
      : ['No layers detected. Showing dataset-based fallback architecture.'],
  };
};

const resolveFramework = (code: string) =>
  code.includes('keras') || code.includes('Sequential(') || code.includes('model.add')
    ? 'keras'
    : 'pytorch';

const resolveApiStyle = (code: string) => (code.includes('def forward') ? 'functional' : 'sequential');

export function CodeVizTab() {
  const { currentProjectId, datasetsByProject, currentDatasetId, currentDatasetVersionId } =
    useDatasetStore();
  const datasetVersionId = isUuid(currentDatasetVersionId)
    ? currentDatasetVersionId ?? undefined
    : undefined;
  const dataset = currentProjectId
    ? (datasetsByProject[currentProjectId] ?? []).find((item) => item.id === currentDatasetId)
    : undefined;
  const { user } = useAuthStore();
  const { inputSize, outputSize } = getDatasetDefaults(dataset);
  const { ref, size } = useCanvasSize();
  const [vizData, setVizData] = useState<Record<string, unknown> | null>(null);
  const [activePreset, setActivePreset] = useState('mlp');
  const [vizTab, setVizTab] = useState<VizTab>('architecture');
  const {
    code,
    parsed,
    selectedLayerId,
    mode,
    modelType,
    isAnimating,
    setCode,
    setParsed,
    setSelectedLayer,
    setMode,
    setModelType,
    toggleAnimation,
    reorderLayers,
  } = useCodeVizStore();

  const selectedLayer = selectLayerById(parsed.layers, selectedLayerId);
  const isNeural = modelType === 'neural';
  const parseLocal = useCallback(
    (source: string) => {
      const framework = resolveFramework(source);
      const localResult =
        framework === 'keras'
          ? parseTensorflowModel(source, { inputSize })
          : parsePyTorchSequential(source, { inputSize });
      return { layers: localResult.layers, errors: localResult.errors };
    },
    [inputSize]
  );

  const applyParsed = useCallback(
    (result: { layers: Array<any>; errors: string[] } | null) => {
      const nextResult = ensureParsedLayers(result, inputSize, outputSize);
      if (!nextResult) return;
      setParsed({
        layers: nextResult.layers,
        errors: nextResult.errors,
      });
      if (nextResult.layers.length && !selectedLayerId) {
        setSelectedLayer(nextResult.layers[0].id);
      }
    },
    [inputSize, outputSize, selectedLayerId, setParsed, setSelectedLayer]
  );
  const trainingMetrics = useMemo(
    () => ({
      trainLoss: Array.from({ length: 10 }, (_, i) => ({
        epoch: i,
        value: 2.5 - i * 0.2 + Math.random() * 0.1,
      })),
      trainAccuracy: Array.from({ length: 10 }, (_, i) => ({
        epoch: i,
        value: 50 + i * 4.5 + Math.random() * 2,
      })),
      valLoss: Array.from({ length: 10 }, (_, i) => ({
        epoch: i,
        value: 2.6 - i * 0.18 + Math.random() * 0.15,
      })),
      valAccuracy: Array.from({ length: 10 }, (_, i) => ({
        epoch: i,
        value: 48 + i * 4.3 + Math.random() * 3,
      })),
      batchTime: Array.from({ length: 10 }, (_, i) => ({
        epoch: i,
        value: 0.05 + Math.random() * 0.02,
      })),
      epochTime: Array.from({ length: 10 }, (_, i) => ({
        epoch: i,
        value: 30 + Math.random() * 5,
      })),
    }),
    []
  );

  useEffect(() => {
    if (!isNeural) {
      setVizTab('architecture');
    }
  }, [isNeural]);

  useEffect(() => {
    if (!isNeural) {
      setCode(baseExamples[modelType]);
      setParsed({ layers: [], errors: [] });
      if (user) {
        apiJson<Record<string, unknown>>('/api/visuals/simulate', {
          method: 'POST',
          body: JSON.stringify({
            kind: modelType,
            dataset_version_id: datasetVersionId,
          }),
        })
          .then((data) => setVizData(data))
          .catch(() => setVizData(null));
      }
      return;
    }
    const preset = presetTemplates.find((item) => item.id === activePreset) ?? presetTemplates[0];
    setCode(preset.code(inputSize, outputSize));
    setVizData(null);
  }, [
    activePreset,
    datasetVersionId,
    inputSize,
    isNeural,
    modelType,
    outputSize,
    setCode,
    setParsed,
    user,
  ]);

  useEffect(() => {
    if (!isNeural) return;
    const handle = window.setTimeout(async () => {
      const localResult = parseLocal(code);
      applyParsed(localResult);

      if (user) {
        const framework = resolveFramework(code);
        const apiStyle = resolveApiStyle(code);
        try {
          const remote = await apiJson<{ layers: Array<any>; errors: string[] }>('/api/code/parse', {
            method: 'POST',
            body: JSON.stringify({
              code,
              framework,
              api_style: apiStyle,
              input_size: inputSize,
            }),
          });
          applyParsed(remote);
        } catch {
          // Keep local parse result when backend is offline.
        }
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [applyParsed, code, inputSize, isNeural, parseLocal, user]);

  const handleVisualize = () => {
    if (!isNeural) return;
    const localResult = parseLocal(code);
    applyParsed(localResult);

    if (!user) return;

    apiJson<{ layers: Array<any>; errors: string[] }>('/api/code/parse', {
      method: 'POST',
      body: JSON.stringify({
        code,
        framework: resolveFramework(code),
        api_style: resolveApiStyle(code),
        input_size: inputSize,
      }),
    })
      .then((result) => {
        applyParsed(result);
      })
      .catch(() => {
        // Keep local parse if the backend is offline.
      });
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-4 p-4 overflow-auto bg-[#0a0f1a] text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {vizTypes.find((item) => item.id === modelType)?.name} Visualizer
          </h2>
          <p className="text-xs text-white/50">
            {vizTypes.find((item) => item.id === modelType)?.desc}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/50">
            Input: <span className="text-white">{inputSize}</span> Output:{' '}
            <span className="text-white">{outputSize}</span>
          </div>
          {isNeural && (
            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs">
              <button
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${
                  vizTab === 'architecture' ? 'bg-cyan-400/20 text-cyan-100' : 'text-white/60'
                }`}
                onClick={() => setVizTab('architecture')}
              >
                <Layers className="w-3.5 h-3.5" />
                Architecture
              </button>
              <button
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${
                  vizTab === 'landscape' ? 'bg-cyan-400/20 text-cyan-100' : 'text-white/60'
                }`}
                onClick={() => setVizTab('landscape')}
              >
                <Mountain className="w-3.5 h-3.5" />
                Loss
              </button>
              <button
                className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${
                  vizTab === 'training' ? 'bg-cyan-400/20 text-cyan-100' : 'text-white/60'
                }`}
                onClick={() => setVizTab('training')}
              >
                <Activity className="w-3.5 h-3.5" />
                Training
              </button>
            </div>
          )}
          <VisualizationControls
            mode={mode}
            isAnimating={isAnimating}
            onModeChange={setMode}
            onToggleAnimation={toggleAnimation}
            onReset={() => setSelectedLayer(null)}
          />
          {isNeural && vizTab === 'architecture' && (
            <Button onClick={handleVisualize} className="gap-2">
              <Network className="h-4 w-4" />
              Visualize
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-[360px]">
        <div className="w-60 shrink-0 bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
            Model Types
          </p>
          <div className="space-y-1">
            {vizTypes.map((viz) => (
              <button
                key={viz.id}
                onClick={() => setModelType(viz.id)}
                className={`w-full flex flex-col items-start px-3 py-2 rounded-lg text-left transition-colors ${
                  modelType === viz.id
                    ? 'bg-cyan-400/10 text-white border border-cyan-300/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-xs font-medium">{viz.name}</span>
                <span className="text-[10px] text-white/40">{viz.desc}</span>
              </button>
            ))}
          </div>

          {isNeural && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">
                Presets
              </p>
              <div className="space-y-1">
                {presetTemplates.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setActivePreset(preset.id)}
                    className={`w-full px-3 py-2 rounded-lg text-left text-xs ${
                      activePreset === preset.id
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div
            ref={ref}
            className="flex-1 min-h-[320px] rounded-xl overflow-hidden border border-white/10 bg-[#060b16]"
          >
            {isNeural ? (
              vizTab === 'architecture' ? (
                mode === 'stack' ? (
                  <div className="h-full overflow-auto p-4 space-y-2">
                    {parsed.layers.map((layer, index) => (
                      <div
                        key={layer.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedLayer(layer.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedLayer(layer.id);
                          }
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                          selectedLayerId === layer.id
                            ? 'border-cyan-300/40 bg-cyan-300/10 text-white'
                            : 'border-white/10 text-white/70 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{layer.name}</span>
                          <span className="text-xs text-white/40">{layer.type}</span>
                        </div>
                        <div className="text-xs text-white/40">
                          {layer.inputShape ?? ''} -> {layer.outputShape ?? ''}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-white/40">
                          <span>Drag to reorder:</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (index > 0) reorderLayers(index, index - 1);
                            }}
                          >
                            Up
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[10px]"
                            onClick={(event) => {
                              event.stopPropagation();
                              reorderLayers(index, index + 1);
                            }}
                          >
                            Down
                          </Button>
                        </div>
                      </div>
                    ))}
                    {parsed.layers.length === 0 && (
                      <p className="text-sm text-white/50">No layers parsed yet.</p>
                    )}
                  </div>
                ) : mode === '3d' ? (
                  <ClientErrorBoundary
                    onError={() => setMode('graph')}
                    fallback={
                      <div className="h-full w-full flex items-center justify-center text-white/60">
                        3D renderer unavailable. Switching to Graph view.
                      </div>
                    }
                  >
                    <NeuralNetwork3D
                      layers={parsed.layers}
                      selectedLayerId={selectedLayerId}
                      isAnimating={isAnimating}
                      onLayerSelect={setSelectedLayer}
                    />
                  </ClientErrorBoundary>
                ) : (
                  <NetworkGraph
                    layers={parsed.layers}
                    selectedId={selectedLayerId}
                    isAnimating={isAnimating}
                    onSelect={setSelectedLayer}
                    onReorder={reorderLayers}
                  />
                )
              ) : vizTab === 'landscape' ? (
                <ClientErrorBoundary
                  fallback={
                    <div className="h-full w-full flex items-center justify-center text-white/60">
                      3D landscape unavailable right now.
                    </div>
                  }
                >
                  <LossLandscape3D
                    isAnimating={isAnimating}
                    showLabels
                    colorScheme="cyan-green"
                  />
                </ClientErrorBoundary>
              ) : (
                <div className="h-full p-4 flex flex-col gap-4">
                  <TrainingDashboard
                    metrics={trainingMetrics}
                    currentEpoch={10}
                    totalEpochs={50}
                    isTraining={false}
                  />
                  <div className="flex-1 min-h-[200px]">
                    <ClientErrorBoundary
                      fallback={
                        <div className="h-full w-full flex items-center justify-center text-white/60">
                          3D landscape unavailable right now.
                        </div>
                      }
                    >
                      <LossLandscape3D
                        gridSize={24}
                        isAnimating={false}
                        showLabels={false}
                        colorScheme="blue-red"
                      />
                    </ClientErrorBoundary>
                  </div>
                </div>
              )
            ) : (
              <VisualizationCanvas
                type={modelType}
                isAnimating={isAnimating}
                width={size.width}
                height={size.height}
                data={vizData}
              />
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden h-[280px] min-h-[240px]">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
              <Code2 className="w-4 h-4 text-white/50" />
              <span className="text-sm font-medium">model.py</span>
              <span className="text-xs text-white/50 ml-auto">Python</span>
            </div>
            <CodeEditor value={code} onChange={setCode} height="100%" />
          </div>
          {parsed.errors.length > 0 && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{parsed.errors[0]}</span>
            </div>
          )}
        </div>

        <div className="w-64 shrink-0 flex flex-col gap-4">
          <ModelInsights layers={parsed.layers} />
          <LayerDetailPanel layer={selectedLayer} />
        </div>
      </div>
    </div>
  );
}
