// Chart and visualization types

import type { VegaLiteSpec, ChartSection } from './database';

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  category: ChartCategory;
  thumbnail?: string;
  requiredEncodings: EncodingChannelType[];
  optionalEncodings: EncodingChannelType[];
  supportedColumnTypes: ColumnTypeSupport[];
  vegaSpecTemplate: VegaLiteSpec;
}

export type ChartCategory =
  | 'distribution'
  | 'relationship'
  | 'comparison'
  | 'composition'
  | 'time-series'
  | 'correlation'
  | 'missing';

export type EncodingChannelType = 'x' | 'y' | 'color' | 'size' | 'shape' | 'row' | 'column';

export type ColumnTypeSupport =
  | 'quantitative'
  | 'nominal'
  | 'ordinal'
  | 'temporal';

export interface GeneratedChartData {
  key: string;
  title: string;
  subtitle?: string;
  section: ChartSection;
  spec: VegaLiteSpec;
  explanation?: string;
}

// Chart intent from natural language
export interface ChartIntent {
  intent: 'plot' | 'compare' | 'correlate' | 'distribute' | 'summarize' | 'unknown';
  chart_type?: ChartType;
  x?: string;
  y?: string;
  color?: string;
  size?: string;
  agg?: AggregationType;
  filters?: ChartFilter[];
  notes?: string;
}

export type ChartType =
  | 'scatter'
  | 'bar'
  | 'line'
  | 'histogram'
  | 'heatmap'
  | 'box'
  | 'violin'
  | 'pie'
  | 'area';

export type AggregationType =
  | 'count'
  | 'sum'
  | 'mean'
  | 'median'
  | 'min'
  | 'max'
  | 'distinct';

export interface ChartFilter {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in' | 'contains';
  value: string | number | (string | number)[];
}

// EDA Pack sections
export interface EDAPackSection {
  id: ChartSection;
  title: string;
  description: string;
  charts: GeneratedChartData[];
}

export interface EDAPack {
  sections: EDAPackSection[];
  totalCharts: number;
  generatedAt: string;
}

// Chart configuration for UI
export interface ChartConfig {
  width?: number | 'container';
  height?: number;
  autosize?: 'fit' | 'fit-x' | 'fit-y' | 'none';
  padding?: number | { top?: number; right?: number; bottom?: number; left?: number };
  background?: string;
  theme?: 'light' | 'dark';
}
