'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  PieChart,
  LineChart,
  ScatterChart,
  Grid3X3,
  Info,
  Save,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useVisualsStore } from '@/store/visuals-store';
import { useChat } from '@/hooks/use-chat';
import { InteractiveChartWrapper } from '@/components/charts/interactive-chart-wrapper';
import { useDatasetStore } from '@/store/dataset-store';
import { useAuthStore } from '@/store/auth-store';
import { apiJson } from '@/lib/api-client';

type ChartType =
  | 'bar'
  | 'donut'
  | 'line'
  | 'scatter'
  | 'heatmap'
  | 'box'
  | 'area'
  | 'histogram'
  | 'custom';

type ChartDef = {
  id: string;
  title: string;
  type: ChartType;
};

const chartCatalog: Array<{
  id: string;
  label: string;
  color: string;
  charts: ChartDef[];
}> = [
  {
    id: 'summary',
    label: 'Summary',
    color: '#60a5fa',
    charts: [
      { id: 'summary-types', title: 'Data Types Breakdown', type: 'donut' },
      { id: 'summary-completeness', title: 'Completeness Score', type: 'custom' },
      { id: 'summary-cards', title: 'Column Summary Cards', type: 'custom' },
      { id: 'summary-health', title: 'Dataset Health Radar', type: 'custom' },
      { id: 'summary-memory', title: 'Memory Usage Treemap', type: 'custom' },
      { id: 'summary-row-complete', title: 'Row Completeness Histogram', type: 'histogram' },
    ],
  },
  {
    id: 'distributions',
    label: 'Distributions',
    color: '#a78bfa',
    charts: [
      { id: 'dist-hist', title: 'Numeric Histograms', type: 'histogram' },
      { id: 'dist-kde', title: 'KDE Density Curves', type: 'line' },
      { id: 'dist-cat', title: 'Categorical Frequency Bars', type: 'bar' },
      { id: 'dist-log', title: 'Log-scale Distributions', type: 'histogram' },
      { id: 'dist-cdf', title: 'CDF Curves', type: 'line' },
      { id: 'dist-violin', title: 'Violin Plots', type: 'custom' },
      { id: 'dist-ridgeline', title: 'Ridgeline Plots', type: 'custom' },
      { id: 'dist-qq', title: 'Q-Q Plots', type: 'custom' },
    ],
  },
  {
    id: 'correlations',
    label: 'Correlations',
    color: '#f472b6',
    charts: [
      { id: 'corr-pearson', title: 'Pearson Correlation Heatmap', type: 'heatmap' },
      { id: 'corr-spearman', title: 'Spearman Correlation Heatmap', type: 'heatmap' },
      { id: 'corr-splom', title: 'Scatter Matrix (SPLOM)', type: 'custom' },
      { id: 'corr-top', title: 'Top Correlations Bar Chart', type: 'bar' },
      { id: 'corr-partial', title: 'Partial Correlations Heatmap', type: 'heatmap' },
      { id: 'corr-network', title: 'Correlation Network Graph', type: 'custom' },
    ],
  },
  {
    id: 'missing',
    label: 'Missing Values',
    color: '#f59e0b',
    charts: [
      { id: 'miss-column', title: 'Missing by Column', type: 'bar' },
      { id: 'miss-pattern', title: 'Missing Pattern Heatmap', type: 'heatmap' },
      { id: 'miss-upset', title: 'Missing Combinations UpSet', type: 'custom' },
      { id: 'miss-row', title: 'Row Missingness Histogram', type: 'histogram' },
      { id: 'miss-corr', title: 'Missing Correlations Heatmap', type: 'heatmap' },
      { id: 'miss-time', title: 'Missing Over Time', type: 'line' },
    ],
  },
  {
    id: 'outliers',
    label: 'Outliers',
    color: '#fb7185',
    charts: [
      { id: 'outlier-box', title: 'Box Plots', type: 'box' },
      { id: 'outlier-scatter', title: 'Outlier Scatter Plots', type: 'scatter' },
      { id: 'outlier-zscore', title: 'Z-Score Distribution Bars', type: 'bar' },
      { id: 'outlier-isolation', title: 'Isolation Forest Scores', type: 'custom' },
      { id: 'outlier-table', title: 'Outlier Records Table', type: 'custom' },
      { id: 'outlier-mahal', title: 'Mahalanobis Distance Plot', type: 'line' },
    ],
  },
  {
    id: 'categoricals',
    label: 'Categoricals',
    color: '#34d399',
    charts: [
      { id: 'cat-freq', title: 'Frequency Bar Charts', type: 'bar' },
      { id: 'cat-pie', title: 'Pie/Donut Charts', type: 'donut' },
      { id: 'cat-treemap', title: 'Category Treemaps', type: 'custom' },
      { id: 'cat-wordcloud', title: 'Word Clouds', type: 'custom' },
      { id: 'cat-cardinality', title: 'Cardinality Analysis Bars', type: 'bar' },
      { id: 'cat-sunburst', title: 'Sunburst Chart', type: 'custom' },
      { id: 'cat-rare', title: 'Rare Categories Bar', type: 'bar' },
    ],
  },
  {
    id: 'bivariate',
    label: 'Bivariate',
    color: '#22d3ee',
    charts: [
      { id: 'bi-scatter', title: '2D Scatter Plots', type: 'scatter' },
      { id: 'bi-hexbin', title: 'Hexbin Density Plots', type: 'custom' },
      { id: 'bi-grouped', title: 'Grouped Bar Charts', type: 'bar' },
      { id: 'bi-stacked', title: 'Stacked Bar Charts', type: 'bar' },
      { id: 'bi-bubble', title: 'Bubble Charts', type: 'scatter' },
      { id: 'bi-contour', title: '2D Contour Density', type: 'custom' },
      { id: 'bi-parallel', title: 'Parallel Coordinates', type: 'custom' },
    ],
  },
  {
    id: 'target',
    label: 'Target Analysis',
    color: '#f97316',
    charts: [
      { id: 'target-dist', title: 'Target Distribution', type: 'bar' },
      { id: 'target-box', title: 'Features vs Target Box Plots', type: 'box' },
      { id: 'target-corr', title: 'Target Correlation Bars', type: 'bar' },
      { id: 'target-balance', title: 'Class Balance Donut', type: 'donut' },
      { id: 'target-mi', title: 'Mutual Information Scores', type: 'bar' },
      { id: 'target-strat', title: 'Stratified Statistics Table', type: 'custom' },
      { id: 'target-boundary', title: '2D Decision Boundary Preview', type: 'custom' },
    ],
  },
  {
    id: 'timeseries',
    label: 'Time Series',
    color: '#38bdf8',
    charts: [
      { id: 'ts-line', title: 'Time Series Line Plot', type: 'line' },
      { id: 'ts-season', title: 'Seasonality Heatmap', type: 'heatmap' },
      { id: 'ts-decomp', title: 'Trend Decomposition', type: 'line' },
      { id: 'ts-lag', title: 'Lag Plots', type: 'scatter' },
      { id: 'ts-rolling', title: 'Rolling Statistics Lines', type: 'line' },
      { id: 'ts-calendar', title: 'Calendar Heatmap', type: 'custom' },
      { id: 'ts-changepoint', title: 'Change Point Detection', type: 'custom' },
    ],
  },
  {
    id: 'text',
    label: 'Text Analysis',
    color: '#c084fc',
    charts: [
      { id: 'text-length', title: 'Text Length Histogram', type: 'histogram' },
      { id: 'text-frequency', title: 'Word Frequency Bars', type: 'bar' },
      { id: 'text-cloud', title: 'Word Cloud', type: 'custom' },
      { id: 'text-ngrams', title: 'N-gram Analysis Bars', type: 'bar' },
      { id: 'text-sentiment', title: 'Sentiment Distribution', type: 'histogram' },
      { id: 'text-language', title: 'Language Detection Pie', type: 'donut' },
      { id: 'text-ner', title: 'Named Entity Bars', type: 'bar' },
      { id: 'text-similarity', title: 'Text Similarity Heatmap', type: 'heatmap' },
    ],
  },
  {
    id: 'quality',
    label: 'Data Quality',
    color: '#94a3b8',
    charts: [
      { id: 'quality-dup', title: 'Duplicate Analysis Bars', type: 'bar' },
      { id: 'quality-constant', title: 'Constant Columns Table', type: 'custom' },
      { id: 'quality-type', title: 'Type Warnings Table', type: 'custom' },
      { id: 'quality-format', title: 'Format Consistency Bars', type: 'bar' },
      { id: 'quality-range', title: 'Range Analysis Table', type: 'custom' },
      { id: 'quality-leak', title: 'Leakage Detection Alerts', type: 'custom' },
      { id: 'quality-id', title: 'ID Column Detection Table', type: 'custom' },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced Analytics',
    color: '#0ea5e9',
    charts: [
      { id: 'adv-pca', title: 'PCA 2D Scatter', type: 'scatter' },
      { id: 'adv-tsne', title: 't-SNE 2D Scatter', type: 'scatter' },
      { id: 'adv-umap', title: 'UMAP 2D Scatter', type: 'scatter' },
      { id: 'adv-kmeans', title: 'K-Means Cluster 2D Scatter', type: 'scatter' },
      { id: 'adv-importance', title: 'Feature Importance Bars', type: 'bar' },
      { id: 'adv-interaction', title: 'Feature Interaction Heatmap', type: 'heatmap' },
    ],
  },
];

const sampleData = [
  { category: 'A', value: 28, value2: 55, x: 1, y: 10, z: 0.2 },
  { category: 'B', value: 55, value2: 43, x: 2, y: 18, z: 0.35 },
  { category: 'C', value: 43, value2: 91, x: 3, y: 8, z: 0.5 },
  { category: 'D', value: 91, value2: 32, x: 4, y: 15, z: 0.7 },
  { category: 'E', value: 32, value2: 74, x: 5, y: 4, z: 0.9 },
];

const heatmapData = [
  { x: 'A', y: 'A', value: 1 },
  { x: 'A', y: 'B', value: 0.72 },
  { x: 'A', y: 'C', value: 0.42 },
  { x: 'B', y: 'A', value: 0.72 },
  { x: 'B', y: 'B', value: 1 },
  { x: 'B', y: 'C', value: 0.63 },
  { x: 'C', y: 'A', value: 0.42 },
  { x: 'C', y: 'B', value: 0.63 },
  { x: 'C', y: 'C', value: 1 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getVegaSpec(type: ChartType): any {
  const base = {
    width: 240,
    height: 160,
    background: 'transparent',
    config: {
      view: { stroke: 'transparent' },
      axis: { labelColor: '#cbd5f5', titleColor: '#cbd5f5' },
    },
  };
  switch (type) {
    case 'bar':
      return {
        ...base,
        data: { values: sampleData },
        mark: { type: 'bar', cornerRadiusEnd: 4 },
        encoding: {
          x: { field: 'category', type: 'nominal', axis: null },
          y: { field: 'value', type: 'quantitative', axis: null },
          color: { value: '#60a5fa' },
        },
      };
    case 'donut':
      return {
        ...base,
        data: { values: sampleData },
        mark: { type: 'arc', innerRadius: 50, stroke: '#0f172a', strokeWidth: 1 },
        encoding: {
          theta: { field: 'value', type: 'quantitative' },
          color: { field: 'category', type: 'nominal', scale: { scheme: 'tableau10' } },
        },
      };
    case 'line':
      return {
        ...base,
        data: { values: sampleData },
        mark: { type: 'line', point: true },
        encoding: {
          x: { field: 'x', type: 'quantitative', axis: null },
          y: { field: 'value2', type: 'quantitative', axis: null },
          color: { value: '#38bdf8' },
        },
      };
    case 'scatter':
      return {
        ...base,
        data: { values: sampleData },
        mark: { type: 'circle', opacity: 0.8, size: 90 },
        encoding: {
          x: { field: 'x', type: 'quantitative', axis: null },
          y: { field: 'y', type: 'quantitative', axis: null },
          color: { field: 'category', type: 'nominal', scale: { scheme: 'tableau10' } },
        },
      };
    case 'heatmap':
      return {
        ...base,
        data: { values: heatmapData },
        mark: 'rect',
        encoding: {
          x: { field: 'x', type: 'nominal', axis: null },
          y: { field: 'y', type: 'nominal', axis: null },
          color: {
            field: 'value',
            type: 'quantitative',
            scale: { scheme: 'blues' },
          },
        },
      };
    case 'box':
      return {
        ...base,
        data: { values: sampleData },
        mark: { type: 'boxplot', extent: 'min-max' },
        encoding: {
          x: { field: 'category', type: 'nominal', axis: null },
          y: { field: 'value', type: 'quantitative', axis: null },
          color: { value: '#fb7185' },
        },
      };
    case 'area':
      return {
        ...base,
        data: { values: sampleData },
        mark: { type: 'area', line: { color: '#a78bfa' } },
        encoding: {
          x: { field: 'x', type: 'quantitative', axis: null },
          y: { field: 'value', type: 'quantitative', axis: null },
          color: { value: '#a78bfa' },
        },
      };
    case 'histogram':
      return {
        ...base,
        data: { values: sampleData },
        mark: { type: 'bar' },
        encoding: {
          x: { field: 'value', type: 'quantitative', bin: true, axis: null },
          y: { aggregate: 'count', type: 'quantitative', axis: null },
          color: { value: '#f97316' },
        },
      };
    default:
      return null;
  }
}

function getChartIcon(type: ChartType) {
  switch (type) {
    case 'bar':
      return BarChart3;
    case 'donut':
      return PieChart;
    case 'line':
      return LineChart;
    case 'scatter':
      return ScatterChart;
    case 'heatmap':
      return Grid3X3;
    case 'box':
    case 'histogram':
      return BarChart3;
    default:
      return BarChart3;
  }
}

export function VisualsTab() {
  const [activeSection, setActiveSection] = useState(chartCatalog[0].id);
  const activeGroup = chartCatalog.find((group) => group.id === activeSection) ?? chartCatalog[0];
  const filteredCharts = useMemo(() => activeGroup.charts, [activeGroup]);
  const [savedCharts, setSavedCharts] = useState<Record<string, boolean>>({});
  const { savedCharts: assistantCharts } = useVisualsStore();
  const { sendMessage } = useChat();
  const { currentDatasetVersionId } = useDatasetStore();
  const { user } = useAuthStore();
  const [backendCharts, setBackendCharts] = useState<Array<{ key: string; spec: Record<string, unknown> }>>([]);

  useEffect(() => {
    if (!user || !currentDatasetVersionId) {
      setBackendCharts([]);
      return;
    }
    apiJson<{ charts: Array<{ key: string; spec: Record<string, unknown> }> }>(
      `/api/visuals/sections/${currentDatasetVersionId}?section=${activeSection}`
    )
      .then((response) => setBackendCharts(response.charts ?? []))
      .catch(() => setBackendCharts([]));
  }, [activeSection, currentDatasetVersionId, user]);

  const toggleSaved = (chart: ChartDef) => {
    setSavedCharts((prev) => ({ ...prev, [chart.id]: !prev[chart.id] }));
  };

  return (
    <div className="h-full flex">
      <div className="w-56 border-r border-white/10 bg-[#060a12] text-white">
        <div className="p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40 mb-2">
            EDA Pack (81)
          </p>
        </div>
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="px-2 space-y-1">
            {chartCatalog.map((section) => (
              <button
                key={section.id}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                  activeSection === section.id
                    ? 'bg-white/10 text-white'
                    : 'hover:bg-white/5 text-white/60'
                )}
                onClick={() => setActiveSection(section.id)}
              >
                <span>{section.label}</span>
                <span className="text-xs text-muted-foreground">{section.charts.length}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <ScrollArea className="flex-1 bg-[#0a0f1a]">
        <div className="p-6">
          {assistantCharts.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">Assistant Charts</h2>
                  <p className="text-sm text-white/60">Generated from chat</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {assistantCharts.map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={{ id: chart.id, title: chart.title, type: 'custom' }}
                    accent="#22d3ee"
                    isSaved
                    onSave={() => {}}
                    onAnalyze={() => sendMessage(`Analyze this chart: ${chart.title}`)}
                    inlineSpec={chart.spec}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">{activeGroup.label}</h2>
              <p className="text-sm text-white/60">
                {filteredCharts.length} visualizations
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCharts.map((chart) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                accent={activeGroup.color}
                isSaved={!!savedCharts[chart.id]}
                onSave={() => toggleSaved(chart)}
                onAnalyze={() => sendMessage(`Analyze this chart: ${chart.title}`)}
                inlineSpec={resolveBackendSpec(chart.id, backendCharts)}
              />
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

function resolveBackendSpec(
  chartId: string,
  backendCharts: Array<{ key: string; spec: Record<string, unknown> }>
) {
  const mapping: Record<string, string> = {
    'summary-types': 'column_types',
    'summary-completeness': 'missing_values',
  };
  const mappedKey = mapping[chartId];
  if (mappedKey) {
    return backendCharts.find((chart) => chart.key === mappedKey)?.spec ?? null;
  }
  return backendCharts.length > 0 ? backendCharts[0]?.spec ?? null : null;
}

function ChartCard({
  chart,
  accent,
  isSaved,
  onSave,
  onAnalyze,
  inlineSpec,
}: {
  chart: ChartDef;
  accent: string;
  isSaved: boolean;
  onSave: () => void;
  onAnalyze?: () => void;
  inlineSpec?: Record<string, unknown>;
}) {
  const Icon = getChartIcon(chart.type);
  const spec = inlineSpec ?? getVegaSpec(chart.type);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden group">
      {spec ? (
        <InteractiveChartWrapper spec={spec} title={chart.title} />
      ) : (
        <div className="aspect-[4/3] bg-black/30 flex items-center justify-center relative text-white/60">
          <div className="relative z-10 flex h-full flex-col items-center justify-center text-center">
            <Icon className="h-10 w-10 mx-auto mb-2 text-white/40" />
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Custom</p>
            <p className="text-xs text-white/60">{chart.title}</p>
          </div>
        </div>
      )}

      <div className="p-3 border-t border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <p className="text-sm font-medium truncate text-white">{chart.title}</p>
        </div>
        <div className="flex items-center gap-1">
          {onAnalyze && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAnalyze}>
              <Sparkles className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onSave}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
