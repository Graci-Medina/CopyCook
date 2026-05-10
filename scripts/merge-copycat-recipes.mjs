#!/usr/bin/env node
/**
 * Merge copycat-recipes patches: incoming meals replace or append by idMeal, sorted by numeric id.
 * Usage: node scripts/merge-copycat-recipes.mjs [patch.json ...]
 */
import fs from 'fs';
import path from 'path';

const root = path.join(import.meta.dirname, '..');
const mainPath = path.join(root, 'Home page', 'copycat-recipes.json');

let data = JSON.parse(fs.readFileSync(mainPath, 'utf8'));
if (!Array.isArray(data.meals)) throw new Error('Expected top-level meals array');

const byId = new Map(data.meals.map((m) => [String(m.idMeal), m]));

for (const arg of process.argv.slice(2)) {
  const patch = JSON.parse(fs.readFileSync(path.resolve(arg), 'utf8'));
  const list = patch.meals || patch;
  if (!Array.isArray(list)) throw new Error(`Not an array: ${arg}`);
  for (const m of list) {
    if (m && m.idMeal != null) byId.set(String(m.idMeal), m);
  }
}

const merged = [...byId.values()].sort((a, b) => Number(a.idMeal) - Number(b.idMeal));
fs.writeFileSync(mainPath, JSON.stringify({ meals: merged }, null, 2) + '\n');
console.log(`Wrote ${merged.length} meals to copycat-recipes.json`);
