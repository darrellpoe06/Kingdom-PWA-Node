#!/usr/bin/env node
// Writes app/src/components/learn-studio/learn-classic-skin.css from the one
// mapping in app/src/lib/learn-classic-skin.js, for every classic color class in
// the sources the classic Learn renders (ChurchLearn.jsx and every component it
// reaches, the new look's own learn-studio/ excepted).
//   node scripts/learn-classic-skin.mjs          -- report what is uncovered (exit 1 if any)
//   node scripts/learn-classic-skin.mjs --write  -- write the stylesheet
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { skinCss, skinTokens, uncoveredTokens, unknownColors } from '../app/src/lib/learn-classic-skin.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const COMPONENTS = path.join(ROOT, 'app/src/components');
export const CSS_PATH = path.join(COMPONENTS, 'learn-studio/learn-classic-skin.css');

/** ChurchLearn.jsx and every local .jsx it reaches, learn-studio/ excepted. */
export function classicLearnSources(entry = path.join(COMPONENTS, 'ChurchLearn.jsx')) {
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file) || !fs.existsSync(file)) return;
    seen.add(file);
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/from\s+'(\.{1,2}\/[^']+\.jsx)'/g)) {
      const next = path.resolve(path.dirname(file), m[1]);
      if (next.includes(`${path.sep}learn-studio${path.sep}`)) continue;
      if (!next.startsWith(COMPONENTS)) continue;
      walk(next);
    }
  };
  walk(entry);
  return [...seen];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = classicLearnSources();
  const sources = files.map((f) => fs.readFileSync(f, 'utf8'));
  const unknown = unknownColors(sources);
  if (unknown.length) {
    console.error(`colors with no role in lib/learn-classic-skin.js: ${unknown.join(', ')}`);
    process.exit(1);
  }
  if (process.argv.includes('--write')) {
    const tokens = sources.flatMap(skinTokens);
    fs.writeFileSync(CSS_PATH, skinCss(tokens));
    console.log(`wrote ${path.relative(ROOT, CSS_PATH)}: ${new Set(tokens).size} classes from ${files.length} files`);
  } else {
    const css = fs.existsSync(CSS_PATH) ? fs.readFileSync(CSS_PATH, 'utf8') : '';
    const miss = uncoveredTokens(sources, css);
    console.log(`${files.length} files; ${miss.length} uncovered`);
    if (miss.length) { console.log(miss.join('\n')); process.exit(1); }
  }
}
