import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const webRoot = path.join(repoRoot, 'apps', 'web');
const sourceRoot = path.join(webRoot, 'src');

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

const sourceFiles = await collectFiles(sourceRoot);
const forbiddenPatterns = [
  /@supabase\//i,
  /\/supabase\//i,
  /NEXT_PUBLIC_SUPABASE/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
];

for (const file of sourceFiles) {
  const content = await readFile(file, 'utf8');
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(
      content,
      pattern,
      `${path.relative(repoRoot, file)} still contains ${pattern}`
    );
  }
}

const packageJson = JSON.parse(
  await readFile(path.join(webRoot, 'package.json'), 'utf8')
);
const dependencyNames = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
});

assert.equal(
  dependencyNames.some((name) => name.startsWith('@supabase/')),
  false,
  'apps/web/package.json still includes Supabase dependencies'
);

const envExample = await readFile(
  path.join(webRoot, '.env.local.example'),
  'utf8'
);
assert.doesNotMatch(
  envExample,
  /SUPABASE/i,
  'apps/web/.env.local.example still documents Supabase variables'
);

console.log('Web runtime is local-only and Supabase-free.');
