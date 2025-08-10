#!/usr/bin/env node

import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

const root = resolve('.');
const localesDir = join(root, 'src', 'locales');

function findJsonFiles(dirPath) {
  const entries = readdirSync(dirPath);
  const files = [];
  for (const entry of entries) {
    const full = join(dirPath, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      files.push(...findJsonFiles(full));
    } else if (st.isFile() && entry.endsWith('.json')) {
      files.push(full);
    }
  }
  return files;
}

function dedupeJsonFile(filePath) {
  const original = readFileSync(filePath, 'utf8');
  try {
    // JSON.parse keeps the last occurrence of duplicate keys
    const data = JSON.parse(original);
    const normalized = JSON.stringify(data, null, 2) + '\n';
    writeFileSync(filePath, normalized, 'utf8');
    return { filePath, ok: true };
  } catch (err) {
    return { filePath, ok: false, error: String(err) };
  }
}

function main() {
  const files = findJsonFiles(localesDir);
  const results = files.map(dedupeJsonFile);
  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.error('Failed to process some locale files:');
    for (const f of failed) {
      console.error('-', f.filePath, '=>', f.error);
    }
    process.exit(1);
  } else {
    console.log(`Processed ${results.length} locale JSON file(s).`);
  }
}

main(); 