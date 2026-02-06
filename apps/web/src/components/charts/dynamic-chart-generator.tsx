'use client';

import { useMemo } from 'react';
import { ChartWrapper } from './chart-wrapper';

type ColumnSchema = {
  name: string;
  type?: string;
};

type DatasetLike = {
  name: string;
  columns: ColumnSchema[];
  sampleRows: Array<Record<string, unknown>>;
};

type ColumnType = 'numeric' | 'categorical' | 'temporal' | 'text' | 'boolean';

type ColumnMeta = ColumnSchema & {
  colType: ColumnType;
  values: unknown[];
  numericValues: number[];
  counts: Record<string, number>;
};

type ChartRecommendation = {
  type: 'bar' | 'line' | 'scatter' | 'histogram' | 'pie' | 'heatmap' | 'boxplot' | 'area';
  title: string;
  spec: Record<string, unknown>;
  priority: number;
  reason: string;
};

const MIN_SYNTH_ROWS = 0;
const MAX_ROWS = 800;
const MAX_PAIR_CHARTS = 12;
const MAX_CAT_PAIR_CHARTS = 8;
const MAX_NUM_CAT_CHARTS = 12;
const MAX_NUMERIC_PER_COL = 4;
const MAX_CATEGORICAL_PER_COL = 2;
const MAX_TEMPORAL_PER_COL = 2;

const COLOR_POOL = ['#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#22d3ee'];

const normalizeType = (value?: string) => (value ?? '').toLowerCase();

const isNumberLike = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  if (typeof value === 'string') return value.trim() !== '' && Number.isFinite(Number(value));
  return false;
};

const toNumber = (value: unknown) => (typeof value === 'number' ? value : Number(value));

const looksLikeDate = (value: unknown) =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isBooleanLike = (value: unknown) =>
  typeof value === 'boolean' || value === 'true' || value === 'false';

function getColumnType(column: ColumnSchema, rows: Array<Record<string, unknown>>): ColumnType {
  const type = normalizeType(column.type);
  if (['numeric', 'number', 'integer', 'float', 'double'].includes(type)) return 'numeric';
  if (['datetime', 'date', 'time', 'timestamp'].some((t) => type.includes(t))) return 'temporal';
  if (['boolean', 'bool'].includes(type)) return 'boolean';
  if (['text', 'string', 'categorical', 'id'].includes(type)) return 'categorical';

  const sample = rows.find((row) => row[column.name] !== null && row[column.name] !== undefined);
  if (!sample) return 'categorical';
  const value = sample[column.name];
  if (isBooleanLike(value)) return 'boolean';
  if (isNumberLike(value)) return 'numeric';
  if (looksLikeDate(value)) return 'temporal';
  return 'categorical';
}

function buildValueCounts(rows: Array<Record<string, unknown>>, column: string) {
  const counts: Record<string, number> = {};
  rows.forEach((row) => {
    const value = row[column];
    if (value === null || value === undefined || value === '') return;
    const key = String(value);
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return counts;
}

function buildNumericArray(rows: Array<Record<string, unknown>>, column: string) {
  return rows
    .map((row) => row[column])
    .filter((value) => value !== null && value !== undefined && isNumberLike(value))
    .map((value) => toNumber(value));
}

function computeCorrelation(rows: Array<Record<string, unknown>>, a: string, b: string) {
  const pairs = rows
    .map((row) => [row[a], row[b]])
    .filter(([x, y]) => isNumberLike(x) && isNumberLike(y))
    .map(([x, y]) => [toNumber(x), toNumber(y)]);

  if (pairs.length < 3) return 0;
  const xs = pairs.map((pair) => pair[0]);
  const ys = pairs.map((pair) => pair[1]);
  const meanX = xs.reduce((sum, v) => sum + v, 0) / xs.length;
  const meanY = ys.reduce((sum, v) => sum + v, 0) / ys.length;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < pairs.length; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

function buildSyntheticRows(
  rows: Array<Record<string, unknown>>,
  columns: ColumnSchema[],
  targetRows: number
) {
  if (rows.length === 0) {
    const synthetic: Array<Record<string, unknown>> = [];
    for (let i = 0; i < targetRows; i += 1) {
      const row: Record<string, unknown> = {};
      columns.forEach((column, idx) => {
        if (normalizeType(column.type).includes('date')) {
          row[column.name] = new Date(Date.now() - i * 86400000).toISOString();
        } else if (idx % 3 === 0) {
          row[column.name] = Math.round(Math.random() * 1000) / 10;
        } else if (idx % 3 === 1) {
          row[column.name] = ['A', 'B', 'C', 'D'][i % 4];
        } else {
          row[column.name] = `Value ${i % 12}`;
        }
      });
      synthetic.push(row);
    }
    return synthetic;
  }

  const metadata = columns.map((column) => {
    const colType = getColumnType(column, rows);
    const values = rows.map((row) => row[column.name]).filter((value) => value !== null && value !== undefined);
    const numericValues = values.filter((value) => isNumberLike(value)).map((value) => toNumber(value));
    const counts = buildValueCounts(rows, column.name);
    const uniqueValues = Object.keys(counts);
    const min = numericValues.length ? Math.min(...numericValues) : 0;
    const max = numericValues.length ? Math.max(...numericValues) : 1;
    const mean = numericValues.length
      ? numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length
      : 0;
    return { column, colType, uniqueValues, min, max, mean };
  });

  const expanded = [...rows];
  while (expanded.length < targetRows) {
    const base = rows[expanded.length % rows.length] ?? rows[0];
    const next: Record<string, unknown> = {};
    metadata.forEach((meta, idx) => {
      const value = base?.[meta.column.name];
      switch (meta.colType) {
        case 'numeric': {
          const baseValue = isNumberLike(value) ? toNumber(value) : meta.mean;
          const range = Math.max(1, meta.max - meta.min);
          const jitter = (Math.random() - 0.5) * range * 0.2;
          next[meta.column.name] = Number((baseValue + jitter).toFixed(3));
          break;
        }
        case 'temporal': {
          const baseDate = value && looksLikeDate(value) ? new Date(String(value)) : new Date();
          const shiftDays = (Math.random() - 0.5) * 60;
          next[meta.column.name] = new Date(baseDate.getTime() + shiftDays * 86400000).toISOString();
          break;
        }
        case 'boolean': {
          next[meta.column.name] = Math.random() > 0.5;
          break;
        }
        case 'categorical': {
          const pool = meta.uniqueValues.length ? meta.uniqueValues : ['A', 'B', 'C', 'D'];
          next[meta.column.name] = pool[(expanded.length + idx) % pool.length];
          break;
        }
        default: {
          next[meta.column.name] = typeof value === 'string' ? value : `Value ${expanded.length % 12}`;
          break;
        }
      }
    });
    expanded.push(next);
  }
  return expanded.slice(0, targetRows);
}

function resolveColumns(dataset: DatasetLike): ColumnSchema[] {
  if (dataset.columns.length) return dataset.columns;
  const sample = dataset.sampleRows?.[0];
  if (!sample) return [];
  return Object.keys(sample).map((name) => ({ name }));
}

function buildColumnMeta(columns: ColumnSchema[], rows: Array<Record<string, unknown>>) {
  return columns.map((column) => {
    const colType = getColumnType(column, rows);
    const values = rows.map((row) => row[column.name]).filter((value) => value !== null && value !== undefined);
    const numericValues = values.filter((value) => isNumberLike(value)).map((value) => toNumber(value));
    const counts = buildValueCounts(rows, column.name);
    return {
      ...column,
      colType,
      values,
      numericValues,
      counts,
    } satisfies ColumnMeta;
  });
}

function generateChartRecommendations(dataset: DatasetLike): ChartRecommendation[] {
  const recommendations: ChartRecommendation[] = [];
  const columns = resolveColumns(dataset);
  if (!columns.length) return recommendations;

  const baseRows = dataset.sampleRows ?? [];
  const preparedRows =
    baseRows.length >= MIN_SYNTH_ROWS
      ? baseRows.slice(0, MAX_ROWS)
      : buildSyntheticRows(baseRows, columns, MIN_SYNTH_ROWS);
  const rows = preparedRows.slice(0, MAX_ROWS);
  if (!rows.length) return recommendations;

  const columnMeta = buildColumnMeta(columns, rows);
  const numericCols = columnMeta.filter((col) => col.colType === 'numeric');
  const categoricalCols = columnMeta.filter(
    (col) => col.colType === 'categorical' || col.colType === 'boolean'
  );
  const temporalCols = columnMeta.filter((col) => col.colType === 'temporal');

  const push = (rec: ChartRecommendation) => {
    recommendations.push(rec);
  };

  const missingByColumn = columns.map((column) => {
    const missing = rows.reduce((count, row) => {
      const value = row[column.name];
      return value === null || value === undefined || value === '' ? count + 1 : count;
    }, 0);
    return { column: column.name, missing };
  });

  if (missingByColumn.some((item) => item.missing > 0)) {
    push({
      type: 'bar',
      title: 'Missing Values by Column',
      priority: 100,
      reason: 'Highlights data quality gaps',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 360,
        height: 220,
        data: { values: missingByColumn },
        mark: { type: 'bar', cornerRadiusEnd: 4, color: '#f97316' },
        encoding: {
          x: { field: 'column', type: 'nominal', sort: '-y' },
          y: { field: 'missing', type: 'quantitative' },
        },
      },
    });
  }

  const typeCounts = [
    { type: 'numeric', count: numericCols.length },
    { type: 'categorical', count: categoricalCols.length },
    { type: 'temporal', count: temporalCols.length },
  ].filter((item) => item.count > 0);

  if (typeCounts.length > 0) {
    push({
      type: 'pie',
      title: 'Column Type Breakdown',
      priority: 98,
      reason: 'Quick overview of schema composition',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 260,
        height: 260,
        data: { values: typeCounts },
        mark: { type: 'arc', innerRadius: 60, stroke: '#0f172a' },
        encoding: {
          theta: { field: 'count', type: 'quantitative' },
          color: { field: 'type', type: 'nominal' },
        },
      },
    });
  }

  numericCols.slice(0, MAX_NUMERIC_PER_COL).forEach((col, idx) => {
    const range =
      col.numericValues.length > 0
        ? Math.max(...col.numericValues) - Math.min(...col.numericValues)
        : 1;
    const bandwidth = Math.max(0.2, range / 12);

    push({
      type: 'histogram',
      title: `Distribution of ${col.name}`,
      priority: 90 - idx,
      reason: 'Shows the distribution of numeric values',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 320,
        height: 210,
        data: { values: rows },
        mark: { type: 'bar', cornerRadiusEnd: 4, color: COLOR_POOL[idx % COLOR_POOL.length] },
        encoding: {
          x: { field: col.name, type: 'quantitative', bin: { maxbins: 24 } },
          y: { aggregate: 'count', type: 'quantitative' },
        },
      },
    });

    push({
      type: 'area',
      title: `${col.name} Density`,
      priority: 88 - idx,
      reason: 'Smooth density estimation',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 320,
        height: 210,
        data: { values: rows },
        transform: [{ density: col.name, bandwidth }],
        mark: { type: 'area', color: '#22d3ee', opacity: 0.7 },
        encoding: {
          x: { field: 'value', type: 'quantitative', title: col.name },
          y: { field: 'density', type: 'quantitative' },
        },
      },
    });

    push({
      type: 'boxplot',
      title: `${col.name} Box Plot`,
      priority: 86 - idx,
      reason: 'Highlights spread and outliers',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 220,
        height: 220,
        data: { values: rows },
        mark: { type: 'boxplot', extent: 1.5 },
        encoding: {
          y: { field: col.name, type: 'quantitative' },
          color: { value: '#8b5cf6' },
        },
      },
    });

    push({
      type: 'line',
      title: `${col.name} Cumulative`,
      priority: 84 - idx,
      reason: 'Shows cumulative distribution',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 320,
        height: 210,
        data: { values: rows },
        transform: [
          { sort: [{ field: col.name, order: 'ascending' }], window: [{ op: 'count', as: 'rank' }] },
          { joinaggregate: [{ op: 'count', as: 'total' }] },
          { calculate: 'datum.rank / datum.total', as: 'cum_ratio' },
        ],
        mark: { type: 'line', color: '#38bdf8' },
        encoding: {
          x: { field: col.name, type: 'quantitative' },
          y: { field: 'cum_ratio', type: 'quantitative', axis: { format: '%' } },
        },
      },
    });
  });

  categoricalCols.slice(0, MAX_CATEGORICAL_PER_COL * 3).forEach((col, idx) => {
    const entries = Object.entries(col.counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    const data = entries.map(([key, value]) => ({ [col.name]: key, count: value }));
    if (!data.length) return;

    push({
      type: 'bar',
      title: `${col.name} Frequency`,
      priority: 78 - idx,
      reason: 'Shows category frequencies',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 320,
        height: 210,
        data: { values: data },
        mark: { type: 'bar', cornerRadiusEnd: 4, color: COLOR_POOL[(idx + 2) % COLOR_POOL.length] },
        encoding: {
          x: { field: col.name, type: 'nominal', sort: '-y' },
          y: { field: 'count', type: 'quantitative' },
        },
      },
    });

    push({
      type: 'pie',
      title: `${col.name} Breakdown`,
      priority: 76 - idx,
      reason: 'Shows proportional distribution',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 260,
        height: 260,
        data: { values: data.slice(0, 8).map((item) => ({ category: item[col.name], value: item.count })) },
        mark: { type: 'arc', innerRadius: 50, stroke: '#0f172a' },
        encoding: {
          theta: { field: 'value', type: 'quantitative' },
          color: { field: 'category', type: 'nominal' },
        },
      },
    });
  });

  if (numericCols.length >= 2) {
    const correlationPairs: Array<{ col1: ColumnMeta; col2: ColumnMeta; corr: number }> = [];
    for (let i = 0; i < numericCols.length; i += 1) {
      for (let j = i + 1; j < numericCols.length; j += 1) {
        const corr = Math.abs(computeCorrelation(rows, numericCols[i].name, numericCols[j].name));
        correlationPairs.push({ col1: numericCols[i], col2: numericCols[j], corr });
      }
    }
    correlationPairs
      .sort((a, b) => b.corr - a.corr)
      .slice(0, MAX_PAIR_CHARTS)
      .forEach((pair, idx) => {
        push({
          type: 'scatter',
          title: `${pair.col1.name} vs ${pair.col2.name}`,
          priority: 70 - idx,
          reason: `Correlation: ${pair.corr.toFixed(2)}`,
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 320,
            height: 220,
            data: { values: rows },
            mark: { type: 'circle', opacity: 0.7, size: 60 },
            encoding: {
              x: { field: pair.col1.name, type: 'quantitative' },
              y: { field: pair.col2.name, type: 'quantitative' },
              color: categoricalCols[0]
                ? { field: categoricalCols[0].name, type: 'nominal' }
                : { value: '#10b981' },
            },
          },
        });

        push({
          type: 'heatmap',
          title: `${pair.col1.name} vs ${pair.col2.name} Density`,
          priority: 68 - idx,
          reason: 'Binned density map',
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 320,
            height: 220,
            data: { values: rows },
            transform: [
              { bin: { maxbins: 24 }, field: pair.col1.name, as: 'x' },
              { bin: { maxbins: 24 }, field: pair.col2.name, as: 'y' },
            ],
            mark: 'rect',
            encoding: {
              x: { field: 'x', type: 'quantitative', bin: 'binned', title: pair.col1.name },
              y: { field: 'y', type: 'quantitative', bin: 'binned', title: pair.col2.name },
              color: { aggregate: 'count', type: 'quantitative', scale: { scheme: 'tealblues' } },
            },
          },
        });
      });
  }

  if (numericCols.length > 0 && categoricalCols.length > 0) {
    let count = 0;
    for (let i = 0; i < numericCols.length && count < MAX_NUM_CAT_CHARTS; i += 1) {
      for (let j = 0; j < categoricalCols.length && count < MAX_NUM_CAT_CHARTS; j += 1) {
        const numCol = numericCols[i];
        const catCol = categoricalCols[j];
        count += 1;

        push({
          type: 'boxplot',
          title: `${numCol.name} by ${catCol.name}`,
          priority: 60 - count,
          reason: 'Distribution across categories',
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 320,
            height: 210,
            data: { values: rows },
            mark: { type: 'boxplot', extent: 1.5 },
            encoding: {
              x: { field: catCol.name, type: 'nominal' },
              y: { field: numCol.name, type: 'quantitative' },
              color: { value: '#f59e0b' },
            },
          },
        });

        push({
          type: 'bar',
          title: `Average ${numCol.name} by ${catCol.name}`,
          priority: 58 - count,
          reason: 'Mean comparison by category',
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 320,
            height: 210,
            data: { values: rows },
            mark: { type: 'bar', cornerRadiusEnd: 4, color: '#14b8a6' },
            encoding: {
              x: { field: catCol.name, type: 'nominal', sort: '-y' },
              y: { aggregate: 'mean', field: numCol.name, type: 'quantitative' },
            },
          },
        });
      }
    }
  }

  if (categoricalCols.length >= 2) {
    let pairCount = 0;
    for (let i = 0; i < categoricalCols.length && pairCount < MAX_CAT_PAIR_CHARTS; i += 1) {
      for (let j = i + 1; j < categoricalCols.length && pairCount < MAX_CAT_PAIR_CHARTS; j += 1) {
        const col1 = categoricalCols[i];
        const col2 = categoricalCols[j];
        pairCount += 1;

        push({
          type: 'bar',
          title: `${col1.name} x ${col2.name}`,
          priority: 48 - pairCount,
          reason: 'Stacked category composition',
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 320,
            height: 210,
            data: { values: rows },
            mark: { type: 'bar' },
            encoding: {
              x: { field: col1.name, type: 'nominal' },
              y: { aggregate: 'count', type: 'quantitative' },
              color: { field: col2.name, type: 'nominal' },
            },
          },
        });

        push({
          type: 'heatmap',
          title: `${col1.name} vs ${col2.name} Heatmap`,
          priority: 46 - pairCount,
          reason: 'Category co-occurrence',
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 320,
            height: 240,
            data: { values: rows },
            mark: 'rect',
            encoding: {
              x: { field: col1.name, type: 'nominal' },
              y: { field: col2.name, type: 'nominal' },
              color: { aggregate: 'count', type: 'quantitative', scale: { scheme: 'blues' } },
            },
          },
        });
      }
    }
  }

  if (temporalCols.length > 0 && numericCols.length > 0) {
    temporalCols.slice(0, MAX_TEMPORAL_PER_COL).forEach((temporal, idx) => {
      numericCols.slice(0, MAX_TEMPORAL_PER_COL).forEach((numCol, jdx) => {
        push({
          type: 'line',
          title: `${numCol.name} over ${temporal.name}`,
          priority: 40 - idx - jdx,
          reason: 'Temporal trend',
          spec: {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            width: 320,
            height: 210,
            data: { values: rows },
            mark: { type: 'line', color: '#38bdf8' },
            encoding: {
              x: { field: temporal.name, type: 'temporal' },
              y: { field: numCol.name, type: 'quantitative' },
            },
          },
        });
      });
    });
  }

  if (numericCols.length >= 3) {
    const selected = numericCols.slice(0, 6).map((col) => col.name);
    const heatmapData: Array<{ x: string; y: string; correlation: number }> = [];
    selected.forEach((col1) => {
      selected.forEach((col2) => {
        const corr = col1 === col2 ? 1 : computeCorrelation(rows, col1, col2);
        heatmapData.push({ x: col1, y: col2, correlation: corr });
      });
    });

    push({
      type: 'heatmap',
      title: 'Correlation Matrix',
      priority: 35,
      reason: 'Relationships between numeric columns',
      spec: {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        width: 320,
        height: 320,
        data: { values: heatmapData },
        mark: 'rect',
        encoding: {
          x: { field: 'x', type: 'nominal' },
          y: { field: 'y', type: 'nominal' },
          color: {
            field: 'correlation',
            type: 'quantitative',
            scale: { scheme: 'blueorange', domain: [-1, 1] },
          },
        },
      },
    });
  }

  if (numericCols.length > 0) {
    numericCols.slice(0, 3).forEach((col, idx) => {
      push({
        type: 'line',
        title: `${col.name} Trend`,
        priority: 32 - idx,
        reason: 'Row-wise trend scan',
        spec: {
          $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
          width: 320,
          height: 210,
          data: { values: rows },
          transform: [{ window: [{ op: 'row_number', as: 'row' }] }],
          mark: { type: 'line', color: COLOR_POOL[(idx + 3) % COLOR_POOL.length] },
          encoding: {
            x: { field: 'row', type: 'quantitative' },
            y: { field: col.name, type: 'quantitative' },
          },
        },
      });
    });
  }

  return recommendations.sort((a, b) => b.priority - a.priority);
}

type DynamicChartGridProps = {
  dataset: DatasetLike;
  maxCharts?: number;
};

export function DynamicChartGrid({ dataset, maxCharts = 60 }: DynamicChartGridProps) {
  const recommendations = useMemo(
    () => generateChartRecommendations(dataset).slice(0, maxCharts),
    [dataset, maxCharts]
  );

  if (recommendations.length === 0) {
    return (
      <div className="text-center text-white/50 py-12">
        <p>No chart recommendations available.</p>
        <p className="text-sm mt-2">Upload a dataset with more columns to see visualizations.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {recommendations.map((rec, idx) => (
        <div key={`${rec.title}-${idx}`} className="relative">
          <ChartWrapper spec={rec.spec} title={rec.title} />
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white/70">
            {rec.reason}
          </div>
        </div>
      ))}
    </div>
  );
}
