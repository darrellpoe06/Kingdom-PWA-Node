// =============================================================================
// pm-synth — the PM-AI v0.1 Synthesizer (read-only portfolio brief)
// =============================================================================
// Reads PoeTech's own durable project sources (the DR ledger, the build
// roadmap, GitHub PR state) and asks Claude to synthesize a current-state
// portfolio brief. Per DR-0055: read-only, advisory, own-portfolio-only, a
// VIEW over durable sources never the sole record. It writes NOTHING to the
// repo or anywhere else — it prints the brief to stdout; the workflow puts
// that in the run summary + an artifact. System proposes; Darrell governs.
//
// Run by .github/workflows/pm-synth.yml (manual workflow_dispatch only — no
// clock, so no three-brakes needed; a cadence would be v1 / Tier C).
//
// Env:
//   ANTHROPIC_API_KEY   required — your key from console.anthropic.com
//   PM_SYNTH_MODEL      optional — defaults to claude-sonnet-4-6
//   PM_SYNTH_DRY_RUN    optional — if set, assemble + print sizes, no API call
// =============================================================================
import { readFileSync, existsSync } from 'node:fs';

const MODEL = process.env.PM_SYNTH_MODEL || 'claude-sonnet-4-6';

function readOr(path, fallback = '(not found)') {
  try { return existsSync(path) ? readFileSync(path, 'utf8') : fallback; }
  catch { return fallback; }
}

const roadmap = readOr('docs/00-foundations/_root/BUILD-ROADMAP.md');
const index = readOr('docs/decisions/INDEX.md');
const openPrs = readOr('/tmp/open_prs.json', '[]');
const mergedPrs = readOr('/tmp/merged_prs.json', '[]');

const SYSTEM = `You are the PoeTech portfolio Synthesizer (PM-AI v0, DR-0055). You read the
project's own durable sources and produce ONE concise current-state brief for
Darrell, the principal. You are READ-ONLY and ADVISORY: you propose; he governs.

Hard rules:
- Ground every statement in the provided sources. NEVER invent status, dates,
  PRs, or blockers. If something isn't in the data, say so or omit it.
- Be concise and scannable. This is a brief, not a report.
- Attribute blockers to WHO can unblock (Darrell input / Claude execution /
  external), per the data.
- Typography: capitalize references to God (He/His/Him); lowercase adversary
  names. (Rarely relevant here, but binding for every PoeTech artifact.)

Output EXACTLY these five markdown sections, in order:
## 1. State of play   (one line per active roadmap item: status + last movement)
## 2. Blocker chains   (table: item | blocked on | who unblocks)
## 3. Next-best item   (the single highest-leverage next thing + the
   anxiety-clarity questions it needs answered first: what / when / why / how)
## 4. Stale watch   (anything decided/open but not moving; drift)
## 5. Open decisions for Darrell   (input-only items awaiting his governance)`;

const USER = `Here are the current durable sources. Synthesize the brief.

=== BUILD-ROADMAP.md (the active worklist) ===
${roadmap}

=== docs/decisions/INDEX.md (what's decided) ===
${index}

=== open pull requests (gh json) ===
${openPrs}

=== recently merged pull requests (gh json) ===
${mergedPrs}`;

if (process.env.PM_SYNTH_DRY_RUN) {
  console.error(`[dry-run] model=${MODEL} system=${SYSTEM.length}b user=${USER.length}b`);
  console.log('# PORTFOLIO BRIEF (dry-run)\n\nContext assembled; API not called.');
  process.exit(0);
}

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ANTHROPIC_API_KEY not set');
  process.exit(1);
}

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM,
    messages: [{ role: 'user', content: USER }],
  }),
});

if (!res.ok) {
  const body = await res.text().catch(() => '');
  console.error(`Anthropic API ${res.status}: ${body.slice(0, 500)}`);
  process.exit(1);
}

const data = await res.json();
const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
const stamp = new Date().toISOString();
console.log(`# PORTFOLIO BRIEF\n\n_Generated ${stamp} by pm-synth (${MODEL}) — read-only view, not the source of truth (DR-0055)._\n\n${text}`);
