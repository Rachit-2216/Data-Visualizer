import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parseDatasetFile } from '../apps/web/src/lib/offline/parser.ts';
import { buildOfflineProfile } from '../apps/web/src/lib/offline/profiler.ts';

const fixturePath = resolve('scripts/fixtures/local-workspace-verification.csv');
const contents = await readFile(fixturePath);
const file = new File([contents], 'local-workspace-verification.csv', {
  type: 'text/csv',
});

const parsed = await parseDatasetFile(file);
const result = buildOfflineProfile(
  file.name,
  parsed.rows,
  parsed.columns,
  parsed.rowCount,
  parsed.sampleNote
);

assert.equal(parsed.rowCount, 12, 'CSV row count should match the uploaded fixture');
assert.equal(parsed.columns.length, 8, 'CSV columns should be detected from the header');
assert.equal(result.profile.stats.duplicateRows, 1, 'Duplicate rows should be detected');
assert.equal(result.profile.stats.missingCells, 2, 'Missing cells should be detected');
assert.equal(result.profile.columnTypes.numeric, 4, 'Numeric columns should be inferred');
assert.equal(result.profile.columnTypes.categorical, 3, 'Categorical columns should be inferred');
assert.equal(result.profile.columnTypes.datetime, 1, 'Date columns should be inferred');

console.log(
  JSON.stringify({
    dataset: result.profile.dataset.name,
    rows: result.profile.stats.rowCount,
    columns: result.profile.stats.columnCount,
    duplicateRows: result.profile.stats.duplicateRows,
    missingCells: result.profile.stats.missingCells,
    columnTypes: result.profile.columnTypes,
  })
);
