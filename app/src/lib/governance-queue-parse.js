// =============================================================================
// governance-queue-parse — docs/governance/decision-queue.md → the in-app queue
// =============================================================================
// The repo file is the single source of truth for the Governor's decision
// queue (DR-0061 / DR-0065: one source, surfaced where the user is). This
// module is the parser the vite build runs (vite.config.js → the
// __GOVERNANCE_QUEUE__ define) and the tests run, so what the tests prove is
// what the app shows. Pure: text in, data out; no fs, no network.
//
// Two sections are read:
//   ## OPEN …            one `### OPEN-N · Title` block per decision waiting
//                        on the Governor (fields: Unblocks, My recommendation,
//                        Track, and a Tier named anywhere in the block).
//   ## REVIEW FINDINGS … one `### <review title>` block per review, each with a
//                        **Source:** line and a markdown table whose columns
//                        are: id | finding | evidence | severity | owner |
//                        close-by. These are findings, NOT decisions, and the
//                        surface renders them apart from the queue so it never
//                        says a finding is "waiting on you" (DR-0239 dim. 3).
//
// Each section ends at the NEXT `## ` heading, whatever it is called. Before
// 2026-09-29 the OPEN section ran on to `## DECIDED`, so the BUILD BACKLOG and
// LANE COORDINATION text was read as part of the last OPEN block, and a
// "(Tier A)" in a lane note labelled OPEN-5 (credentials, a bright line) as
// Tier A on the Governor's screen. Measured, fixed, pinned
// (governance-queue-parse.test.js).
// =============================================================================

/** The body of the `## <name>` section, up to the next `## ` heading. */
export function sectionBody(raw, name) {
  const text = String(raw || '');
  const lines = text.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${name}\\b`).test(l));
  if (start === -1) return '';
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^##\s+/.test(l) && !/^###/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

const field = (block, label) => {
  const m = block.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`, 'i'));
  return m ? m[1].trim() : '';
};

/** OPEN-N decision blocks → items (the shape the surface has always read). */
export function parseOpenItems(raw) {
  const blocks = sectionBody(raw, 'OPEN').split(/^###\s+/m).slice(1);
  return blocks.map((b) => {
    const head = (b.split('\n')[0] || '').trim();
    const [idPart, ...titleParts] = head.split('·');
    const tierMatch = b.match(/Tier\s+([ABC])\b/);
    return {
      id: (idPart || '').trim(),
      title: titleParts.join('·').trim(),
      unblocks: field(b, 'Unblocks'),
      recommendation: field(b, 'My recommendation') || field(b, 'Recommendation'),
      track: field(b, 'Track'),
      tier: tierMatch ? tierMatch[1] : '',
    };
  }).filter((it) => /^OPEN-\d+/.test(it.id));
}

const SEVERITIES = ['high', 'medium', 'low'];

// One markdown table row → cells, honoring `\|` as a literal pipe inside a cell.
function cells(line) {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split(/(?<!\\)\|/).map((c) => c.replace(/\\\|/g, '|').trim());
}

/** REVIEW FINDINGS blocks → [{ title, source, findings: [...] }]. */
export function parseReviewFindings(raw) {
  const blocks = sectionBody(raw, 'REVIEW FINDINGS').split(/^###\s+/m).slice(1);
  return blocks.map((b) => {
    const lines = b.split('\n');
    const title = (lines[0] || '').trim();
    const rows = lines
      .filter((l) => /^\s*\|/.test(l))
      .map(cells)
      .filter((c) => c.length >= 6 && !/^-+$/.test(c[0].replace(/:/g, '')) && c[0].toLowerCase() !== 'id');
    const findings = rows.map((c) => ({
      id: c[0],
      finding: c[1],
      evidence: c[2],
      severity: SEVERITIES.includes(c[3].toLowerCase()) ? c[3].toLowerCase() : '',
      owner: c[4],
      closeBy: c[5],
    })).filter((f) => f.id && f.finding);
    return { title, source: field(b, 'Source'), findings };
  }).filter((g) => g.title && g.findings.length);
}

/** The whole define: { ok, openCount, items, reviews }. */
export function parseGovernanceQueue(raw) {
  const items = parseOpenItems(raw);
  return { ok: true, openCount: items.length, items, reviews: parseReviewFindings(raw) };
}
