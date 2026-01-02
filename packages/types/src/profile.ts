// Detailed profiling types

export interface ColumnProfile {
  name: string;
  dtype: string;
  inferred_type: 'numeric' | 'categorical' | 'datetime' | 'boolean' | 'text' | 'id';

  // Basic stats
  count: number;
  missing_count: number;
  missing_percentage: number;
  unique_count: number;
  unique_percentage: number;

  // Numeric stats (only for numeric columns)
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
  median?: number;
  q1?: number;
  q3?: number;
  p1?: number;
  p5?: number;
  p95?: number;
  p99?: number;
  skewness?: number;
  kurtosis?: number;

  // Outlier info
  outlier_count?: number;
  outlier_percentage?: number;

  // Categorical stats
  top_values?: Array<{
    value: string;
    count: number;
    percentage: number;
  }>;

  // Distribution data for charts
  histogram?: {
    bins: number[];
    counts: number[];
  };
}

export interface CorrelationMatrix {
  columns: string[];
  pearson: number[][];
  spearman?: number[][];
}

export interface MissingPatterns {
  total_missing: number;
  total_missing_percentage: number;
  columns_with_missing: Array<{
    column: string;
    count: number;
    percentage: number;
  }>;
  row_missing_distribution: {
    bins: number[];
    counts: number[];
  };
}

export interface FullProfile {
  // Dataset overview
  dataset: {
    row_count: number;
    column_count: number;
    memory_size_bytes: number;
    memory_size_mb: number;
    duplicate_rows: number;
    duplicate_percentage: number;
  };

  // Per-column profiles
  columns: ColumnProfile[];

  // Correlation analysis
  correlations: CorrelationMatrix | null;

  // Missing value analysis
  missing: MissingPatterns;

  // Warnings and issues
  warnings: ProfileWarning[];

  // Processing metadata
  meta: {
    profiled_at: string;
    processing_time_ms: number;
    sample_size: number;
    sampled: boolean;
  };
}

export interface ProfileWarning {
  code: WarningCode;
  severity: 'low' | 'med' | 'high';
  message: string;
  columns?: string[];
  details?: Record<string, unknown>;
}

export type WarningCode =
  | 'HIGH_MISSING'
  | 'CONSTANT_COLUMN'
  | 'NEAR_CONSTANT'
  | 'HIGH_CARDINALITY'
  | 'POTENTIAL_ID'
  | 'POTENTIAL_TARGET'
  | 'HIGH_CORRELATION'
  | 'POTENTIAL_LEAKAGE'
  | 'DUPLICATE_ROWS'
  | 'MIXED_TYPES'
  | 'DATE_PARSING_ISSUES';
