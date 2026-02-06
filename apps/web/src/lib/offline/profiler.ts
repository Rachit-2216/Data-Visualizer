type ColumnType = 'numeric' | 'categorical' | 'text' | 'datetime' | 'boolean';

type DatasetProfile = {
  dataset: {
    name: string;
    version: number;
    status: 'ready';
    uploadedAt: string;
  };
  stats: {
    rowCount: number;
    columnCount: number;
    memoryMb: number;
    duplicateRows: number;
    missingCells: number;
  };
  warnings: Array<{ severity: 'low' | 'med' | 'high'; message: string }>;
  columnTypes: Record<ColumnType, number>;
};

type ProfileResult = {
  profile: DatasetProfile;
  columns: Array<{ name: string; type: ColumnType }>;
  sampleRows: Array<Record<string, unknown>>;
};

const isNumberLike = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  if (typeof value === 'string') return value.trim() !== '' && Number.isFinite(Number(value));
  return false;
};

const looksLikeDate = (value: unknown) =>
  typeof value === 'string' && !Number.isNaN(Date.parse(value));

const isBooleanLike = (value: unknown) =>
  typeof value === 'boolean' || value === 'true' || value === 'false';

const inferColumnType = (values: unknown[]): ColumnType => {
  const sample = values.find((value) => value !== null && value !== undefined);
  if (sample === undefined) return 'categorical';
  if (isBooleanLike(sample)) return 'boolean';
  if (isNumberLike(sample)) return 'numeric';
  if (looksLikeDate(sample)) return 'datetime';
  if (typeof sample === 'string') return 'categorical';
  return 'text';
};

export const buildOfflineProfile = (
  datasetName: string,
  rows: Array<Record<string, unknown>>,
  columns: string[],
  rowCount: number,
  sampleNote?: string
): ProfileResult => {
  const sampledRows = rows.slice(0, Math.min(2000, rows.length));
  const columnTypes: Record<ColumnType, number> = {
    numeric: 0,
    categorical: 0,
    text: 0,
    datetime: 0,
    boolean: 0,
  };

  const columnMeta = columns.map((name) => {
    const values = sampledRows.map((row) => row[name]);
    const type = inferColumnType(values);
    columnTypes[type] += 1;
    return { name, type };
  });

  let missingCells = 0;
  sampledRows.forEach((row) => {
    columns.forEach((col) => {
      const value = row[col];
      if (value === null || value === undefined || value === '') {
        missingCells += 1;
      }
    });
  });

  const duplicateRows = sampledRows.length - new Set(sampledRows.map((row) => JSON.stringify(row))).size;
  const memoryMb = Number(((sampledRows.length * columns.length * 8) / (1024 * 1024)).toFixed(2));

  const warnings: DatasetProfile['warnings'] = [];
  if (missingCells > 0) {
    warnings.push({
      severity: 'low',
      message: `${missingCells} missing values detected in the sample.`,
    });
  }
  if (duplicateRows > 0) {
    warnings.push({
      severity: 'low',
      message: `${duplicateRows} duplicate rows detected in the sample.`,
    });
  }
  if (sampleNote) {
    warnings.push({
      severity: 'med',
      message: sampleNote,
    });
  }

  return {
    profile: {
      dataset: {
        name: datasetName,
        version: 1,
        status: 'ready',
        uploadedAt: new Date().toISOString(),
      },
      stats: {
        rowCount,
        columnCount: columns.length,
        memoryMb,
        duplicateRows,
        missingCells,
      },
      warnings,
      columnTypes,
    },
    columns: columnMeta,
    sampleRows: sampledRows,
  };
};
