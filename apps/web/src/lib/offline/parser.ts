'use client';

import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type ParsedDataset = {
  rows: Array<Record<string, unknown>>;
  columns: string[];
  rowCount: number;
  sampled: boolean;
  sampleNote?: string;
};

const MAX_SAMPLE_ROWS = 5000;
const LARGE_FILE_BYTES = 50 * 1024 * 1024;

const normalizeRows = (rows: Array<Record<string, unknown>>) =>
  rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    Object.entries(row).forEach(([key, value]) => {
      if (value === '') {
        normalized[key] = null;
      } else {
        normalized[key] = value;
      }
    });
    return normalized;
  });

const parseCsvLike = (file: File, delimiter: string): Promise<ParsedDataset> =>
  new Promise((resolve, reject) => {
    const rows: Array<Record<string, unknown>> = [];
    let rowCount = 0;
    const sampled = file.size > LARGE_FILE_BYTES;
    const sampleLimit = sampled ? MAX_SAMPLE_ROWS : Infinity;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimiter,
      step: (results, parser) => {
        rowCount += 1;
        if (rows.length < sampleLimit) {
          rows.push(results.data as Record<string, unknown>);
        }
        if (sampled && rows.length >= MAX_SAMPLE_ROWS) {
          parser.abort();
        }
      },
      complete: (results) => {
        const columns =
          (results.meta.fields as string[] | undefined) ??
          Object.keys(rows[0] ?? {});
        resolve({
          rows: normalizeRows(rows),
          columns,
          rowCount: sampled ? rows.length : rowCount,
          sampled,
          sampleNote: sampled
            ? `Sampled first ${MAX_SAMPLE_ROWS} rows for profiling.`
            : undefined,
        });
      },
      error: (error) => reject(error),
    });
  });

const parseJson = async (file: File): Promise<ParsedDataset> => {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of objects.');
  }
  const sampled = file.size > LARGE_FILE_BYTES;
  const rows = sampled ? data.slice(0, MAX_SAMPLE_ROWS) : data;
  const columns = Object.keys(rows[0] ?? {});
  return {
    rows: normalizeRows(rows),
    columns,
    rowCount: sampled ? rows.length : data.length,
    sampled,
    sampleNote: sampled
      ? `Sampled first ${MAX_SAMPLE_ROWS} rows for profiling.`
      : undefined,
  };
};

const parseXlsx = async (file: File): Promise<ParsedDataset> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const range = sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']) : null;
  const rowCount = range ? range.e.r : 0;
  const sampled = file.size > LARGE_FILE_BYTES || rowCount > MAX_SAMPLE_ROWS;
  const options = sampled
    ? { defval: null, range: { s: { r: 0, c: 0 }, e: { r: MAX_SAMPLE_ROWS, c: range?.e.c ?? 0 } } }
    : { defval: null };
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, options);
  const columns = Object.keys(rows[0] ?? {});
  return {
    rows: normalizeRows(rows),
    columns,
    rowCount: sampled ? rows.length : rowCount,
    sampled,
    sampleNote: sampled
      ? `Sampled first ${MAX_SAMPLE_ROWS} rows for profiling.`
      : undefined,
  };
};

const parseParquet = async (file: File): Promise<ParsedDataset> => {
  const duckdb = await import('@duckdb/duckdb-wasm');
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
  const worker = new Worker(bundle.mainWorker!);
  const logger = new duckdb.ConsoleLogger();
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  const conn = await db.connect();

  const buffer = new Uint8Array(await file.arrayBuffer());
  await db.registerFileBuffer('upload.parquet', buffer);

  const countResult = await conn.query(`SELECT COUNT(*) AS count FROM read_parquet('upload.parquet')`);
  const totalRows = Number(countResult.toArray()[0]?.count ?? 0);
  const sampled = file.size > LARGE_FILE_BYTES || totalRows > MAX_SAMPLE_ROWS;
  const limit = sampled ? MAX_SAMPLE_ROWS : totalRows;

  const result = await conn.query(
    `SELECT * FROM read_parquet('upload.parquet') LIMIT ${limit}`
  );
  const rows = result.toArray() as Array<Record<string, unknown>>;
  const columns = Object.keys(rows[0] ?? {});
  await conn.close();
  await db.terminate();
  worker.terminate();

  return {
    rows: normalizeRows(rows),
    columns,
    rowCount: sampled ? rows.length : totalRows,
    sampled,
    sampleNote: sampled
      ? `Sampled first ${MAX_SAMPLE_ROWS} rows for profiling.`
      : undefined,
  };
};

export const parseDatasetFile = async (file: File): Promise<ParsedDataset> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'csv':
      return parseCsvLike(file, ',');
    case 'tsv':
      return parseCsvLike(file, '\t');
    case 'json':
      return parseJson(file);
    case 'xlsx':
    case 'xls':
      return parseXlsx(file);
    case 'parquet':
      return parseParquet(file);
    default:
      throw new Error(`Unsupported file type: ${extension ?? 'unknown'}`);
  }
};
