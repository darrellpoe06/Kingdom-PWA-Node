#!/usr/bin/env node
// =============================================================================
// bundle-to-pdf — render the NotebookLM bundle's Markdown sources to PDF, so they
// can be uploaded from the NotebookLM MOBILE app (which offers PDF but not
// Markdown/text upload). Darrell 2026-07-19: "I dont get the option to upload the
// .MD files" — the mobile uploader only lists PDF/Audio/Image/Website/YouTube/
// Copied text/Drive. Desktop web accepts .md directly; this covers mobile.
//
// No npm deps: converts each .md to simple HTML and prints it with the headless
// Chromium already on this machine. Run AFTER build-notebooklm-bundle.mjs.
//   node scripts/bundle-to-pdf.mjs
//   -> notebooklm-bundle/pdf/*.pdf
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'notebooklm-bundle');
const PDF_DIR = join(DIR, 'pdf');
const TMP = join(DIR, '.pdf-tmp');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Lightweight Markdown → HTML: enough for a readable PDF (headings, rules, code
// fences, and preserved line breaks). Content fidelity matters for a reader/RAG;
// exact typography does not.
function mdToHtml(md, title) {
  const lines = md.split('\n');
  const body = [];
  let inCode = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      body.push(inCode ? '</pre>' : '<pre class="code">');
      inCode = !inCode; continue;
    }
    if (inCode) { body.push(esc(line)); continue; }
    if (/^#{1,6}\s/.test(line)) {
      const h = Math.min(line.match(/^#+/)[0].length, 4);
      body.push(`<h${h}>${esc(line.replace(/^#+\s/, ''))}</h${h}>`);
    } else if (/^---+\s*$/.test(line)) {
      body.push('<hr>');
    } else if (line.trim() === '') {
      body.push('');
    } else {
      body.push(`<div class="ln">${esc(line)}</div>`);
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { margin: 14mm; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 10.5pt; line-height: 1.4; color: #1a1815; }
  h1,h2,h3,h4 { font-family: Arial, Helvetica, sans-serif; color: #0a2540; line-height: 1.25; margin: 0.8em 0 0.3em; }
  h1 { font-size: 17pt; } h2 { font-size: 14pt; } h3 { font-size: 12pt; } h4 { font-size: 11pt; }
  hr { border: none; border-top: 1px solid #cfc9bd; margin: 0.7em 0; }
  .ln { white-space: pre-wrap; word-break: break-word; }
  .code { white-space: pre-wrap; word-break: break-word; background: #f4f1ea; padding: 6px 8px; font-family: 'Courier New', monospace; font-size: 9pt; }
</style></head><body>${body.join('\n')}</body></html>`;
}

if (!existsSync(CHROME)) { console.error(`Chromium not found at ${CHROME}`); process.exit(1); }
mkdirSync(PDF_DIR, { recursive: true });
mkdirSync(TMP, { recursive: true });

const sources = readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'ICM-METHODOLOGY.md').sort();
if (!sources.length) { console.error('No bundle .md sources found — run build-notebooklm-bundle.mjs first.'); process.exit(1); }

let ok = 0;
for (const f of sources) {
  const name = basename(f, '.md');
  const html = mdToHtml(readFileSync(join(DIR, f), 'utf8'), name);
  const htmlPath = join(TMP, `${name}.html`);
  const pdfPath = join(PDF_DIR, `${name}.pdf`);
  writeFileSync(htmlPath, html);
  try {
    execFileSync(CHROME, [
      '--headless=new', '--no-sandbox', '--disable-gpu',
      '--no-pdf-header-footer', `--print-to-pdf=${pdfPath}`, `file://${htmlPath}`,
    ], { stdio: 'pipe', timeout: 120000 });
    ok += 1;
    console.log(`  ${name}.pdf`);
  } catch (e) {
    console.error(`  ! failed: ${name} — ${(e && e.message) || e}`);
  }
}
rmSync(TMP, { recursive: true, force: true });
console.log(`\n${ok}/${sources.length} PDFs written to notebooklm-bundle/pdf/`);
