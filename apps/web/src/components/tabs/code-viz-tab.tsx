'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Code2, Network, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDatasetStore } from '@/store/dataset-store';
import { useCodeVizStore, selectLayerById, type ModelType } from '@/store/codeviz-store';
import { parsePyTorchSequential } from '@/lib/code-parser/pytorch-parser';
import { CodeEditor } from '@/components/codeviz/code-editor';
import { NetworkGraph } from '@/components/codeviz/network-graph';
import { ModelInsights } from '@/components/codeviz/model-insights';
import { LayerDetailPanel } from '@/components/codeviz/layer-detail-panel';
import { VisualizationControls } from '@/components/codeviz/visualization-controls';
import { presetTemplates, baseExamples } from '@/components/codeviz/preset-templates';
import { VisualizationCanvas } from '@/components/codeviz/legacy-visuals';
import { apiJson } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

const vizTypes: Array<{ id: ModelType; name: string; desc: string }> = [
  { id: 'neural', name: 'Neural Network', desc: 'PyTorch / Keras models' },
  { id: 'regression', name: 'Linear Regression', desc: '3D regression plane' },
  { id: 'logistic', name: 'Logistic Regression', desc: 'Decision boundary' },
  { id: 'kmeans', name: 'K-Means Clustering', desc: 'Cluster visualization' },
  { id: 'pca', name: 'PCA', desc: '3D projection' },
  { id: 'tree', name: 'Decision Tree', desc: 'Tree structure' },
];

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
}) {
  if (!dataset) {
    return { inputSize: 8, outputSize: 2 };
  }
  const name = dataset.name.toLowerCase();
  if (name.includes('titanic')) return { inputSize: 9, outputSize: 2 };
  if (name.includes('iris')) return { inputSize: 4, outputSize: 3 };
  return {
    inputSize: Math.max(2, dataset.columns.length),
    outputSize: 2,
  };
}

export function CodeVizTab() {
  const { currentProjectId, datasetsByProject, currentDatasetId, currentDatasetVersionId } =
    useDatasetStore();
  const dataset = currentProjectId
    ? (datasetsByProject[currentProjectId] ?? []).find((item) => item.id === currentDatasetId)
    : undefined;
  const { user } = useAuthStore();
  const { inputSize, outputSize } = getDatasetDefaults(dataset);
  const { ref, size } = useCanvasSize();
  const [vizData, setVizData] = useState<Record<string, unknown> | null>(null);
  const [activePreset, setActivePreset] = useState('mlp');
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

  useEffect(() => {
    if (modelType !== 'neural') {
      setCode(baseExamples[modelType]);
      setParsed({ layers: [], errors: [] });
      if (user) {
        apiJson<Record<string, unknown>>('/api/visuals/simulate', {
          method: 'POST',
          body: JSON.stringify({
            kind: modelType,
            dataset_version_id: currentDatasetVersionId ?? undefined,
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
    currentDatasetVersionId,
    inputSize,
    modelType,
    outputSize,
    setCode,
    setParsed,
    user,
  ]);

  useEffect(() => {
    if (modelType !== 'neural') return;
    const handle = window.setTimeout(async () => {
      let nextResult = null as { layers: Array<any>; errors: string[] } | null;
      if (user) {
        const framework = code.includes('keras') || code.includes('Sequential(') || code.includes('model.add')
          ? 'keras'
          : 'pytorch';
        const apiStyle = code.includes('def forward') ? 'functional' : 'sequential';
        try {
          nextResult = await apiJson<{ layers: Array<any>; errors: string[] }>('/api/code/parse', {
            method: 'POST',
            body: JSON.stringify({
              code,
              framework,
              api_style: apiStyle,
              input_size: inputSize,
            }),
          });
        } catch {
          const localResult = parsePyTorchSequential(code, { inputSize });
          nextResult = { layers: localResult.layers, errors: localResult.errors };
        }
      } else {
        const localResult = parsePyTorchSequential(code, { inputSize });
        nextResult = { layers: localResult.layers, errors: localResult.errors };
      }
      if (nextResult) {
        setParsed({
          layers: nextResult.layers,
          errors: nextResult.errors,
        });
        if (nextResult.layers.length && !selectedLayerId) {
          setSelectedLayer(nextResult.layers[0].id);
        }
      }
    }, 500);
    return () => window.clearTimeout(handle);
  }, [code, inputSize, modelType, selectedLayerId, setParsed, setSelectedLayer, user]);

  const handleVisualize = () => {
    if (modelType !== 'neural') return;
    if (user) {
      apiJson<{ layers: Array<any>; errors: string[] }>('/api/code/parse', {
        method: 'POST',
        body: JSON.stringify({
          code,
          framework: code.includes('keras') || code.includes('Sequential(') || code.includes('model.add')
            ? 'keras'
            : 'pytorch',
          api_style: code.includes('def forward') ? 'functional' : 'sequential',
          input_size: inputSize,
        }),
      })
        .then((result) => {
          setParsed({ layers: result.layers, errors: result.errors });
        })
        .catch(() => {
          setParsed(parsePyTorchSequential(code, { inputSize }));
        });
      return;
    }
    setParsed(parsePyTorchSequential(code, { inputSize }));
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 bg-[#0a0f1a] text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {vizTypes.find((v) => v.id === modelType)?.name} Visualizer
          </h2>
          <p className="text-xs text-white/50">
            {vizTypes.find((v) => v.id === modelType)?.desc}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-white/50">
            Input: <span className="text-white">{inputSize}</span> Aú Output:{' '}
            <span className="text-white">{outputSize}</span>
          </div>
          <VisualizationControls
            mode={mode}
            isAnimating={isAnimating}
            onModeChange={setMode}
            onToggleAnimation={toggleAnimation}
            onReset={() => setSelectedLayer(null)}
          />
          {modelType === 'neural' && (
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

          {modelType === 'neural' && (
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
            {modelType === 'neural' ? (
              mode === 'stack' ? (
                <div className="h-full overflow-auto p-4 space-y-2">
                  {parsed.layers.map((layer, index) => (
                    <button
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${
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
                        {layer.inputShape} → {layer.outputShape}
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
                    </button>
                  ))}
                  {parsed.layers.length === 0 && (
                    <p className="text-sm text-white/50">No layers parsed yet.</p>
                  )}
                </div>
              ) : (
                <div className={mode === '3d' ? 'h-full w-full [transform:perspective(1200px)_rotateX(12deg)]' : 'h-full w-full'}>
                  <NetworkGraph
                    layers={parsed.layers}
                    selectedId={selectedLayerId}
                    isAnimating={isAnimating}
                    onSelect={setSelectedLayer}
                    onReorder={reorderLayers}
                  />
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

          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
              <Code2 className="w-4 h-4 text-white/50" />
              <span className="text-sm font-medium">model.py</span>
              <span className="text-xs text-white/50 ml-auto">Python</span>
            </div>
            <CodeEditor value={code} onChange={setCode} />
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
