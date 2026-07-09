// =============================================================================
// lessons-manifest — LESSONS-LEARNED.md parsed into the app (the WHY layer)
// =============================================================================
// LESSONS-LEARNED.md is a Layer-3 foundation doc: every incident distilled to
// extracted principles (P1..Pn) + a forward architectural fix. Until now it had
// no in-app surface — the Quality & Throughput board (DR-0091) pairs those
// principles beside the numbers they explain, so the qualitative record travels
// with the quantitative one (same doctrine as the Decision-Record ledger:
// parsed from the SAME real file at build time, no second source, no painted
// summary — DR-0065 / DR-0076).
//
// Importable (buildLessonsManifest) so vite.config bakes it into
// __LESSONS_PRINCIPLES__; parseLessons is the pure core so a vitest proves the
// parsing catches (a fixture with known principles must parse exactly, and a
// malformed doc degrades honestly). CLI: node scripts/lessons-manifest.mjs
// =============================================================================
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LESSONS_PATH = 'docs/00-foundations/_root/LESSONS-LEARNED.md';

// Markdown -> readable plain text (keep the words; drop bold/code/links).
const plain = (s) => String(s || '')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .trim();

// Pure core. Returns { ok, principles[], incidents[] }.
//   principles: [{ id: 'P10', num: 10, rule, detail, extracted }] sorted by num
//     (the doc is hand-ordered — P22/P23 precede P21 — so display order is
//     normalized here without touching the source).
//   incidents:  [{ date: 'YYYY-MM-DD', title }] newest-first as written.
export function parseLessons(raw) {
  const text = String(raw || '').replace(/\r\n/g, '\n');

  // ---- principles: bullets under "## Principles Extracted" ----
  const principlesSection = (text.split(/^##\s+Principles Extracted\b.*$/m)[1] || '')
    .split(/^##\s+/m)[0];
  const principles = [];
  // One bullet per principle: "- **P{n} — {rule}** {detail}". Detail may wrap
  // onto following lines until the next bullet.
  const bullets = principlesSection.split(/^-\s+/m).slice(1);
  for (const b of bullets) {
    const m = /^\*\*(P(\d+))\s+—\s+([\s\S]*?)\*\*([\s\S]*)$/.exec(b.trim());
    if (!m) continue;
    const detailRaw = m[4].replace(/\n+/g, ' ').trim();
    // The "(Extracted: ...)" tail names the incident the principle came from.
    const ex = /\(Extracted:\s*([^)]+)\)/.exec(detailRaw);
    principles.push({
      id: m[1],
      num: parseInt(m[2], 10),
      rule: plain(m[3]),
      detail: plain(detailRaw).slice(0, 1200),
      extracted: ex ? plain(ex[1]) : '',
    });
  }
  principles.sort((a, b) => a.num - b.num);

  // ---- incidents: "### YYYY-MM-DD... — Title" under the Incident Log ----
  const logSection = (text.split(/^##\s+Incident Log\b.*$/m)[1] || '');
  const incidents = [];
  const incRe = /^###\s+(\d{4}-\d{2}-\d{2})(?:\s*\(([^)]*)\))?\s+—\s+(.+)$/gm;
  let im;
  while ((im = incRe.exec(logSection)) !== null) {
    incidents.push({ date: im[1], when: im[2] || '', title: plain(im[3]) });
  }

  return { ok: principles.length > 0, principles, incidents, source: LESSONS_PATH };
}

// Build-time entry. Best-effort: a missing/unreadable doc degrades to an honest
// empty manifest (`ok:false`), never a crashed build.
export function buildLessonsManifest() {
  let raw = '';
  try { raw = readFileSync(join(ROOT, LESSONS_PATH), 'utf8'); }
  catch { return { ok: false, principles: [], incidents: [], source: LESSONS_PATH }; }
  return parseLessons(raw);
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const m = buildLessonsManifest();
  console.log(`lessons manifest (${m.source}): ok=${m.ok}`);
  console.log(`  principles: ${m.principles.length} (${m.principles.map((p) => p.id).join(', ')})`);
  console.log(`  incidents:  ${m.incidents.length}`);
  for (const i of m.incidents.slice(0, 3)) console.log(`    ${i.date} — ${i.title.slice(0, 70)}`);
}
