import type { DatasetContext } from './types';

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

export function buildDatasetContext(input?: DatasetContext | null): DatasetContext | null {
  if (!input) return null;

  const schema = input.schema.slice(0, 50);
  const sampleRows = input.sampleRows.slice(0, 8);
  const warnings = input.warnings.slice(0, 8);
  const stats = input.stats;

  const context: DatasetContext = {
    ...input,
    schema,
    sampleRows,
    warnings,
    stats,
  };

  const serialized = JSON.stringify(context);
  if (serialized.length > 12000) {
    return {
      ...context,
      stats: {
        note: truncate(JSON.stringify(stats), 4000),
      },
      sampleRows: sampleRows.slice(0, 3),
      warnings: warnings.slice(0, 4),
    };
  }

  return context;
}
