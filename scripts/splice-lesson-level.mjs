#!/usr/bin/env node
// =============================================================================
// splice-lesson-level — write one version of one lesson INTO its source file,
// by the file's own syntax tree, never by a regex (DR-1266)
// =============================================================================
// The 45 course files are not one shape: Living Lessons holds 227 `levels`
// objects inline, Sovereign A.I. 36 for 52 lessons, some lessons carry no
// `levels` at all. So the splice is done on a parse (acorn, which the app
// already depends on): find the ONE object literal whose `id` property is the
// lesson, find its `levels` property if it has one, and replace that band's
// string or add the band — or add a `levels` property right after `id` when
// there is none. Everything outside those character ranges is untouched, and
// the result is re-parsed before it is written, so a splice that would not
// parse is refused rather than saved. The proof test splices a marker into a
// copy of EVERY course file that declares lessons and imports the copy.
//
//   node scripts/splice-lesson-level.mjs <file> <lessonId> <band> <textfile|->
//   prints JSON { ok, action: 'replaced'|'added-band'|'added-levels', file }
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// acorn is the app's dependency (vite's parser); this script lives beside the
// app, so it is resolved from the app's own node_modules.
// Under vitest import.meta.url is a path, not a file: URL, so both are taken.
const HERE_FILE = import.meta.url.startsWith('file:') ? fileURLToPath(import.meta.url) : import.meta.url;
const acorn = createRequire(join(dirname(HERE_FILE), '..', 'app', 'package.json'))('acorn');

export const BANDS = ['child', 'youth', 'teen', 'standard', 'senior'];

/** A JS single-quoted string literal for `text`, one line, as the course files are written. */
export function literal(text) {
  return `'${String(text).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n')}'`;
}

function keyName(prop) {
  if (!prop || prop.type !== 'Property') return null;
  if (prop.key.type === 'Identifier') return prop.key.name;
  if (prop.key.type === 'Literal') return String(prop.key.value);
  return null;
}

/**
 * `text` as a new property on the line after `prop`, with prop's own
 * indentation. If prop has a trailing comma the new property goes after that
 * comma and gets one of its own; else a comma is put after prop and the new
 * property ends the list as prop did.
 */
function insertAfterProperty(src, prop, text) {
  const lineStart = src.lastIndexOf('\n', prop.start) + 1;
  const indent = src.slice(lineStart, prop.start).match(/^\s*/)[0];
  const after = src.slice(prop.end);
  const comma = after.match(/^\s*,/);
  if (comma) {
    const at = prop.end + comma[0].length;
    return src.slice(0, at) + '\n' + indent + text + ',' + src.slice(at);
  }
  return src.slice(0, prop.end) + ',\n' + indent + text + src.slice(prop.end);
}

/** The lesson's object literal in the parsed source, or null. */
export function locateModule(src, lessonId) {
  const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', ranges: true });
  let found = null;
  const seen = new Set();
  const walk = (node) => {
    if (!node || typeof node.type !== 'string' || seen.has(node)) return;
    seen.add(node);
    if (node.type === 'ObjectExpression') {
      const idProp = node.properties.find((p) => keyName(p) === 'id');
      if (idProp && idProp.value.type === 'Literal' && idProp.value.value === lessonId) {
        if (found) throw new Error(`lesson ${lessonId} is declared twice in this file`);
        found = node;
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v.type === 'string') walk(v);
    }
  };
  walk(ast);
  return found;
}

/**
 * The source with `band` of `lessonId` set to `text`. Throws when the lesson
 * is not in this file or the result would not parse.
 * @returns {{ src: string, action: string }}
 */
export function spliceLevel(src, lessonId, band, text) {
  if (!BANDS.includes(band)) throw new Error(`unknown band ${band}`);
  const obj = locateModule(src, lessonId);
  if (!obj) throw new Error(`lesson ${lessonId} is not declared in this file`);
  const lit = literal(text);
  const levels = obj.properties.find((p) => keyName(p) === 'levels');
  let out;
  let action;
  if (levels && levels.value.type === 'ObjectExpression') {
    const prop = levels.value.properties.find((p) => keyName(p) === band);
    if (prop) {
      out = src.slice(0, prop.value.start) + lit + src.slice(prop.value.end);
      action = 'replaced';
    } else {
      // After the last band, with the same indentation the file uses there.
      const props = levels.value.properties;
      if (props.length) {
        const last = props[props.length - 1];
        out = insertAfterProperty(src, last, `${band}: ${lit}`);
      } else {
        out = src.slice(0, levels.value.start + 1) + ` ${band}: ${lit} ` + src.slice(levels.value.end - 1);
      }
      action = 'added-band';
    }
  } else if (levels) {
    throw new Error(`lesson ${lessonId}: levels is not an object literal here, so it cannot be spliced`);
  } else {
    const idProp = obj.properties.find((p) => keyName(p) === 'id');
    out = insertAfterProperty(src, idProp, `levels: { ${band}: ${lit} }`);
    action = 'added-levels';
  }
  // Refuse a result that does not parse: nothing broken is ever written.
  acorn.parse(out, { ecmaVersion: 'latest', sourceType: 'module' });
  const check = locateModule(out, lessonId);
  const lv = check && check.properties.find((p) => keyName(p) === 'levels');
  const got = lv && lv.value.properties.find((p) => keyName(p) === band);
  if (!got || got.value.type !== 'Literal' || got.value.value !== String(text)) throw new Error('the splice did not land where it was aimed');
  return { src: out, action };
}

const isMain = !!process.argv[1] && HERE_FILE === process.argv[1];
if (isMain) {
  const [file, lessonId, band, textFile] = process.argv.slice(2);
  if (!file || !lessonId || !band || !textFile) {
    process.stderr.write('usage: splice-lesson-level.mjs <file> <lessonId> <band> <textfile|->\n');
    process.exit(2);
  }
  const text = textFile === '-' ? readFileSync(0, 'utf8') : readFileSync(textFile, 'utf8');
  try {
    const { src, action } = spliceLevel(readFileSync(file, 'utf8'), lessonId, band, text.replace(/\s+$/, ''));
    writeFileSync(file, src);
    process.stdout.write(JSON.stringify({ ok: true, action, file }) + '\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: String(e && e.message || e), file }) + '\n');
    process.exit(1);
  }
}
