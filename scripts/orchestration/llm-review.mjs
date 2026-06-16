// =============================================================================
// llm-review.mjs — sovereign, tiered, ADVISORY local-LLM code review.
// =============================================================================
// "Have the local LLMs review the app for bugs or fixes." (Darrell, 2026-06-16.)
//
// WHAT THIS IS (and is NOT):
//   - It is a SECOND PAIR OF EYES on the CHANGED code only — qwen2.5 on the NAS
//     reads the diff of a branch and FLAGS likely bugs / regressions / security
//     concerns with a file:line + a one-line concern + a suggested fix.
//   - It is ADVISORY. It never edits code, never commits, never pushes. Its
//     output is a report; a human (or the orchestrator) decides what to do.
//   - It is NOT the test suite. Deterministic CI — `npm run lint` + the full
//     vitest suite — stays the heavy lifter and the merge gate (ci.yml). This
//     does not move, replace, or weaken any of that. (Printed at runtime too.)
//
// THE TIERING (sovereign-first, the Charter §3 — cheapest-first, vendor on an
// UNMET need only, never the default):
//   Tier 1  deterministic CI ......... lint + vitest in GitHub Actions (elsewhere)
//   Tier 2  LOCAL qwen2.5 on the NAS .. reviews the diff, file-by-file (this, default)
//   Tier 3  VENDOR escalation ......... ONLY when the diff is too large / too deep
//           for the local model AND it is explicitly armed (--allow-vendor +
//           ANTHROPIC_API_KEY), bounded by the Charter budget. Clearly labeled.
//
// Scoping to the DIFF is what makes Tier 2 CPU-feasible on the NAS (no CUDA):
// the model never reads the whole tree, only the changed hunks.
//
// HONEST DEGRADATION (Verification Doctrine, DR-0076): if Ollama is unreachable
// and vendor escalation is not armed, it reports ok:false with the reason — it
// never fabricates a "looks good" verdict. Unverified is marked, not papered over.
//
// SOVEREIGN + NON-INTERACTIVE: talks to Ollama / the vendor API over plain HTTP
// (global fetch). It never shells out to a prompt-blocking CLI (gh/vercel/etc.),
// so it is safe in an unattended lane (pairs with no-interactive-cli-guard.mjs).
//
// Pure helpers are exported so the parsing + tier decision are unit-tested
// (proven-to-catch). The CLI main runs only when invoked directly.
// =============================================================================
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ----------------------------------------------------------------------------
// Defaults (all overridable by flag / env). Sovereign-first.
// ----------------------------------------------------------------------------
export const DEFAULTS = {
  base: 'origin/main',
  head: 'HEAD',
  model: 'qwen2.5',            // the local sovereign model (matches class-tutor)
  ollamaBase: 'http://192.168.1.26:11434', // NAS host; localhost when run on it
  vendorModel: 'claude-haiku-4-5-20251001', // cheapest capable, IF armed
  maxFiles: 40,                // beyond this the local pass escalation-recommends
  maxDiffLines: 1500,          // total changed lines beyond which -> escalate
  maxFileDiffChars: 24000,     // per-file hunk cap sent to the model (bound cost/ctx)
  vendorMaxInputChars: 60000,  // total diff chars sent to a vendor (budget brake)
};

// Only review real source. Lockfiles, minified bundles, images, vendored deps,
// and data dumps are noise to a code reviewer — skip them so the local model
// spends its (slow, CPU) budget on code that can actually carry a bug.
export const REVIEWABLE = /\.(js|jsx|mjs|cjs|ts|tsx|sh|sql|py|rb|go|rs|java|php|vue|svelte)$/i;
export const SKIP_PATH = /(^|\/)(node_modules|dist|build|\.next|coverage|vendor)\/|(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$|\.min\.(js|css)$/i;

// Severity ranking — a "bug" is the only thing that can (optionally) fail a gate.
export const SEVERITY = { bug: 3, warning: 2, nit: 1 };

// ----------------------------------------------------------------------------
// Pure helpers (unit-tested).
// ----------------------------------------------------------------------------

// Which changed files are worth a code review. Pure: takes the raw name list,
// returns the reviewable subset (source files, not lockfiles/bundles/deps).
export function reviewableFiles(names) {
  return (Array.isArray(names) ? names : [])
    .map((n) => String(n || '').trim())
    .filter(Boolean)
    .filter((n) => REVIEWABLE.test(n) && !SKIP_PATH.test(n));
}

// The tier decision. Given the scope of the diff and whether vendor use is
// armed, decide what to do. Pure + total so it is fully testable.
//   -> { tier:'local'|'vendor', escalate:bool, reason:string }
// "escalate" means the scope exceeds what the local model handles WELL; whether
// we actually CALL a vendor depends on it being armed (allowVendor + key).
export function decideTier({ fileCount, diffLines, deep = false, allowVendor = false, hasKey = false, ollamaReachable = true }, cfg = DEFAULTS) {
  const big = fileCount > cfg.maxFiles || diffLines > cfg.maxDiffLines;
  const wantEscalate = deep || big || !ollamaReachable;
  let reason = 'within local model scope';
  if (deep) reason = 'deep review explicitly requested (--deep)';
  else if (!ollamaReachable) reason = 'local Ollama unreachable';
  else if (fileCount > cfg.maxFiles) reason = `${fileCount} files changed (> ${cfg.maxFiles}); beyond local scope`;
  else if (diffLines > cfg.maxDiffLines) reason = `${diffLines} changed lines (> ${cfg.maxDiffLines}); beyond local scope`;

  if (wantEscalate && allowVendor && hasKey) {
    return { tier: 'vendor', escalate: true, reason };
  }
  if (wantEscalate) {
    // Unmet need we are NOT armed to meet. Stay local (or fail honestly) and
    // SAY so — never silently pretend the big diff got a deep review.
    const why = !ollamaReachable
      ? 'local model unreachable and vendor escalation not armed (need --allow-vendor + ANTHROPIC_API_KEY)'
      : `scope exceeds local model; vendor escalation recommended but not armed (${reason})`;
    return { tier: 'local', escalate: true, reason: why };
  }
  return { tier: 'local', escalate: false, reason };
}

// Count changed (added/removed) lines in a unified diff blob — the cheap scope
// signal the tier decision rides on. Ignores the +++/--- file headers.
export function countDiffLines(diffText) {
  let n = 0;
  for (const line of String(diffText || '').split('\n')) {
    if ((line[0] === '+' || line[0] === '-') && !line.startsWith('+++') && !line.startsWith('---')) n++;
  }
  return n;
}

// The reviewer system prompt. Strict, advisory, JSON-out. Kept pure + exported
// so the test pins exactly what we ask for (and so local + vendor ask the same).
export function reviewSystemPrompt() {
  return [
    'You are a careful, senior software code reviewer.',
    'You are given a unified git diff for ONE file. Flag only LIKELY, defensible problems INTRODUCED by this change: real bugs, regressions, security issues, resource leaks, missing error handling, off-by-one / null / async mistakes, and clear correctness problems.',
    'You are ADVISORY: you suggest, you never rewrite the code and never claim to have changed anything.',
    'Be concise and specific. Do NOT report style preferences, formatting, or speculative concerns. If the change looks correct, return an empty findings array — do not invent findings.',
    'For each finding, give: "line" = your best estimate of the 1-based line number in the NEW version of the file (read the @@ hunk headers), or null if you cannot tell; "severity" = "bug" (likely broken), "warning" (risky), or "nit" (minor); "concern" = one sentence; "suggestion" = one sentence on the fix.',
    'Output STRICT JSON ONLY, no prose, exactly: {"findings":[{"line":<int|null>,"severity":"bug|warning|nit","concern":"...","suggestion":"..."}]}',
  ].join('\n');
}

// Build the per-file user prompt (file path + its diff, capped).
export function reviewUserPrompt(file, diffText, cfg = DEFAULTS) {
  const d = String(diffText || '');
  const clipped = d.length > cfg.maxFileDiffChars
    ? d.slice(0, cfg.maxFileDiffChars) + '\n... [diff truncated for the local model] ...'
    : d;
  return `FILE: ${file}\n\nUNIFIED DIFF:\n${clipped}`;
}

// Parse whatever the model returned (a string, possibly with stray prose or a
// ```json fence) into a clean findings array. Never throws — bad output yields
// []. This is the load-bearing "trust nothing unverified" boundary, so it is
// the most-tested function here.
export function parseFindings(raw, { file = null } = {}) {
  if (raw == null) return [];
  let text = typeof raw === 'string' ? raw : (raw.response || raw.text || '');
  text = String(text).trim();
  if (!text) return [];
  // Strip a ```json ... ``` fence if the model wrapped its JSON.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // If there is leading/trailing prose, grab the outermost JSON value — either
  // an array [...] or an object {...}, whichever starts first.
  if (text[0] !== '{' && text[0] !== '[') {
    const sObj = text.indexOf('{');
    const sArr = text.indexOf('[');
    const useArr = sArr >= 0 && (sObj < 0 || sArr < sObj);
    const s = useArr ? sArr : sObj;
    const e = useArr ? text.lastIndexOf(']') : text.lastIndexOf('}');
    if (s >= 0 && e > s) text = text.slice(s, e + 1);
  }
  let obj;
  try { obj = JSON.parse(text); } catch { return []; }
  const arr = Array.isArray(obj) ? obj : (Array.isArray(obj?.findings) ? obj.findings : []);
  return arr
    .filter((f) => f && (f.concern || f.suggestion))
    .map((f) => {
      const sev = String(f.severity || 'warning').toLowerCase();
      return {
        file: file || (f.file ? String(f.file) : null),
        line: Number.isInteger(f.line) ? f.line : (Number.isFinite(Number(f.line)) ? Number(f.line) : null),
        severity: SEVERITY[sev] ? sev : 'warning',
        concern: String(f.concern || '').trim() || '(no concern text)',
        suggestion: String(f.suggestion || '').trim() || null,
      };
    });
}

// Assemble the final advisory report envelope from collected findings + context.
// Pure: same inputs -> same report (timestamp is injected, never Date.now here,
// so it stays testable). Findings are sorted bug -> warning -> nit, then file.
export function buildReport({ base, head, model, tier, escalate, escalateReason, filesReviewed, diffLines, findings, generatedAt, error = null }) {
  const list = (Array.isArray(findings) ? findings : []).slice().sort((a, b) => {
    const s = (SEVERITY[b.severity] || 0) - (SEVERITY[a.severity] || 0);
    if (s) return s;
    return String(a.file || '').localeCompare(String(b.file || ''));
  });
  const bugs = list.filter((f) => f.severity === 'bug').length;
  const warnings = list.filter((f) => f.severity === 'warning').length;
  const ok = error == null;
  return {
    ok,
    error,
    advisory: true, // ALWAYS. This report never blocks by itself.
    generated_at: generatedAt || null,
    base: base || null,
    head: head || null,
    model: model || null,
    source: tier === 'vendor' ? `vendor:${model}` : 'local',
    escalated: tier === 'vendor',
    escalation_recommended: !!escalate,
    escalation_reason: escalate ? (escalateReason || null) : null,
    files_reviewed: Array.isArray(filesReviewed) ? filesReviewed : [],
    files_reviewed_count: Array.isArray(filesReviewed) ? filesReviewed.length : 0,
    diff_lines: Number.isFinite(diffLines) ? diffLines : null,
    counts: { findings: list.length, bugs, warnings, nits: list.length - bugs - warnings },
    findings: list,
    note: 'Advisory only. Deterministic CI (lint + the full vitest suite) is the merge gate; this is a second pair of eyes on the diff, not a replacement for tests.',
  };
}

// Render the report as concise markdown for a terminal / PR comment / log.
export function renderMarkdown(report) {
  const L = [];
  L.push(`# Local-LLM code review (advisory)`);
  L.push('');
  if (!report.ok) {
    L.push(`> **Review could not run:** ${report.error}`);
    L.push(`> Nothing is claimed about the code — this is honest "unverified", not a pass.`);
    return L.join('\n');
  }
  L.push(`- Base: \`${report.base}\` -> Head: \`${report.head}\``);
  L.push(`- Reviewer: **${report.source}**${report.escalated ? ' (vendor escalation)' : ''} · model \`${report.model}\``);
  L.push(`- Scope: ${report.files_reviewed_count} file(s), ${report.diff_lines ?? '?'} changed lines`);
  if (report.escalation_recommended && !report.escalated) {
    L.push(`- ⚠ Escalation recommended but not armed: ${report.escalation_reason}`);
  }
  L.push('');
  const c = report.counts;
  L.push(`**${c.findings} finding(s)** — ${c.bugs} bug · ${c.warnings} warning · ${c.nits} nit`);
  L.push('');
  if (!report.findings.length) {
    L.push(`_No likely bugs flagged in the changed code. (Not a guarantee — the test suite is the gate.)_`);
  } else {
    const icon = { bug: '🐞', warning: '⚠️', nit: '·' };
    for (const f of report.findings) {
      const loc = f.line != null ? `${f.file}:${f.line}` : f.file;
      L.push(`### ${icon[f.severity] || '•'} \`${loc}\` — ${f.severity}`);
      L.push(`- **Concern:** ${f.concern}`);
      if (f.suggestion) L.push(`- **Suggested fix:** ${f.suggestion}`);
      L.push('');
    }
  }
  L.push('---');
  L.push(`_${report.note}_`);
  return L.join('\n');
}

// ----------------------------------------------------------------------------
// I/O side (not in the pure-test surface): git, Ollama, vendor.
// ----------------------------------------------------------------------------
function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${(r.stderr || '').trim()}`);
  return (r.stdout || '').trim();
}

// Ask the LOCAL model (Ollama /api/generate, forced JSON). Returns the raw
// response string, or throws on a transport error so the caller can degrade.
async function askOllama(ollamaBase, model, system, prompt, signal) {
  const r = await fetch(`${ollamaBase.replace(/\/+$/, '')}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, system, prompt, stream: false, format: 'json', options: { temperature: 0.1 } }),
    signal,
  });
  if (!r.ok) throw new Error(`ollama http ${r.status}`);
  const j = await r.json();
  return j.response || '';
}

// Ask the VENDOR (Anthropic Messages API) — ONLY when armed. Bounded input +
// output (budget brake). Plain HTTPS, no CLI. Returns the raw text content.
async function askVendor(apiKey, model, system, prompt, signal) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048, // bounded — caps cost per the Charter per-task ceiling
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal,
  });
  if (!r.ok) throw new Error(`vendor http ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
  const j = await r.json();
  return (Array.isArray(j.content) ? j.content.map((b) => b.text || '').join('\n') : '') || '';
}

// ----------------------------------------------------------------------------
// CLI
// ----------------------------------------------------------------------------
function parseArgs(argv) {
  const a = { ...DEFAULTS, deep: false, allowVendor: false, failOnBug: false, jsonOnly: false, out: process.env.LLM_REVIEW_OUT || 'scripts/orchestration/.llm-review.json' };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    const next = () => argv[++i];
    if (v === '--base') a.base = next();
    else if (v === '--head') a.head = next();
    else if (v === '--model') a.model = next();
    else if (v === '--ollama') a.ollamaBase = next();
    else if (v === '--vendor-model') a.vendorModel = next();
    else if (v === '--out') a.out = next();
    else if (v === '--max-files') a.maxFiles = Number(next());
    else if (v === '--max-diff-lines') a.maxDiffLines = Number(next());
    else if (v === '--deep') a.deep = true;
    else if (v === '--allow-vendor') a.allowVendor = true;
    else if (v === '--fail-on-bug') a.failOnBug = true;
    else if (v === '--json-only') a.jsonOnly = true;
    else if (v === '-h' || v === '--help') a.help = true;
  }
  if (process.env.OLLAMA_BASE) a.ollamaBase = process.env.OLLAMA_BASE;
  return a;
}

const HELP = `llm-review — sovereign, tiered, ADVISORY local-LLM code review of a diff.

Usage:
  node scripts/orchestration/llm-review.mjs [options]
  scripts/orchestration/llm-review.sh       [options]

Options:
  --base <ref>         base to diff against        (default origin/main)
  --head <ref>         head to review              (default HEAD)
  --model <name>       local Ollama model          (default qwen2.5)
  --ollama <url>       Ollama base URL             (default http://192.168.1.26:11434; or $OLLAMA_BASE)
  --out <path>         write the JSON report here  (default scripts/orchestration/.llm-review.json; or $LLM_REVIEW_OUT)
  --max-files <n>      escalate beyond n files     (default 40)
  --max-diff-lines <n> escalate beyond n lines     (default 1500)
  --deep               force vendor escalation (if armed)
  --allow-vendor       ARM vendor escalation (needs ANTHROPIC_API_KEY; off by default — sovereign-first)
  --fail-on-bug        exit non-zero if a 'bug'-severity finding exists (opt-in; advisory by default)
  --json-only          print JSON only (no markdown)
  -h, --help           this help

Advisory only. It FLAGS issues; it never edits, commits, or pushes code.
Deterministic CI (lint + vitest) remains the merge gate — this does not replace it.`;

async function main() {
  const cfg = parseArgs(process.argv.slice(2));
  if (cfg.help) { console.log(HELP); process.exit(0); }

  // Banner: be explicit about what this is and is NOT (DR-0076 honesty).
  console.error('llm-review: ADVISORY local-LLM review of the DIFF only. Deterministic CI (lint + vitest) stays the merge gate; this does not replace it.');

  // always-now: fetch the base's remote so the diff is against current reality.
  try {
    const remote = cfg.base.includes('/') ? cfg.base.split('/')[0] : 'origin';
    git(['fetch', '--quiet', remote]);
  } catch (e) {
    console.error(`llm-review: warning — fetch failed (${e.message}); diffing against local refs.`);
  }

  // The changed, reviewable files (scoped to the diff = CPU-feasible locally).
  let names = [];
  try {
    names = git(['diff', '--name-only', '--diff-filter=ACMR', `${cfg.base}...${cfg.head}`]).split('\n');
  } catch (e) {
    const report = buildReport({ base: cfg.base, head: cfg.head, model: cfg.model, tier: 'local', escalate: false, generatedAt: new Date().toISOString(), error: `cannot compute diff: ${e.message}` });
    emit(report, cfg);
    process.exit(0);
  }
  const files = reviewableFiles(names);

  // Gather each file's diff + total scope.
  const diffs = [];
  let diffLines = 0;
  for (const f of files) {
    let d = '';
    try { d = git(['diff', `${cfg.base}...${cfg.head}`, '--', f]); } catch { d = ''; }
    if (!d.trim()) continue;
    diffLines += countDiffLines(d);
    diffs.push({ file: f, diff: d });
  }

  if (!diffs.length) {
    const report = buildReport({ base: cfg.base, head: cfg.head, model: cfg.model, tier: 'local', escalate: false, filesReviewed: [], diffLines: 0, findings: [], generatedAt: new Date().toISOString() });
    emit(report, cfg);
    process.exit(0);
  }

  // Probe the local model so the tier decision knows if it is reachable.
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  let ollamaReachable = true;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(`${cfg.ollamaBase.replace(/\/+$/, '')}/api/version`, { signal: ctrl.signal });
    clearTimeout(t);
    ollamaReachable = r.ok;
  } catch { ollamaReachable = false; }

  const decision = decideTier({ fileCount: diffs.length, diffLines, deep: cfg.deep, allowVendor: cfg.allowVendor, hasKey, ollamaReachable }, cfg);

  const system = reviewSystemPrompt();
  let findings = [];
  let model = cfg.model;
  let runError = null;

  if (decision.tier === 'vendor') {
    // Tier 3 — labeled, bounded. Send the combined (capped) diff once.
    model = cfg.vendorModel;
    console.error(`llm-review: [VENDOR ESCALATION] ${decision.reason} -> ${model} (bounded, within budget). This is a paid call.`);
    const combined = diffs.map((d) => reviewUserPrompt(d.file, d.diff, cfg)).join('\n\n=====\n\n').slice(0, cfg.vendorMaxInputChars);
    try {
      const raw = await askVendor(process.env.ANTHROPIC_API_KEY, model, system + '\nYou are reviewing MULTIPLE files; include the file path in each finding.', combined);
      findings = parseFindings(raw);
    } catch (e) {
      runError = `vendor review failed: ${e.message}`;
    }
  } else {
    // Tier 2 — LOCAL, file-by-file (each file scoped = CPU-feasible).
    if (!ollamaReachable) {
      runError = `local Ollama unreachable at ${cfg.ollamaBase}` + (cfg.allowVendor ? '' : ' (and vendor escalation not armed — pass --allow-vendor + ANTHROPIC_API_KEY to escalate)');
    } else {
      for (const d of diffs) {
        console.error(`llm-review: local review ${d.file} ...`);
        try {
          const raw = await askOllama(cfg.ollamaBase, model, system, reviewUserPrompt(d.file, d.diff, cfg));
          findings.push(...parseFindings(raw, { file: d.file }));
        } catch (e) {
          console.error(`llm-review: warning — ${d.file}: ${e.message}`);
        }
      }
    }
  }

  const report = buildReport({
    base: cfg.base, head: cfg.head, model,
    tier: decision.tier, escalate: decision.escalate, escalateReason: decision.reason,
    filesReviewed: diffs.map((d) => d.file), diffLines, findings,
    generatedAt: new Date().toISOString(), error: runError,
  });
  emit(report, cfg);

  // Advisory by default: exit 0. Only the opt-in --fail-on-bug turns a 'bug'
  // finding into a non-zero exit (a gate the dev/orchestrator chooses to honor).
  if (cfg.failOnBug && report.ok && report.counts.bugs > 0) process.exit(3);
  process.exit(0);
}

function emit(report, cfg) {
  try {
    mkdirSync(dirname(cfg.out), { recursive: true });
    writeFileSync(cfg.out, JSON.stringify(report, null, 2));
    console.error(`llm-review: report written -> ${cfg.out}`);
  } catch (e) {
    console.error(`llm-review: warning — could not write ${cfg.out}: ${e.message}`);
  }
  if (cfg.jsonOnly) console.log(JSON.stringify(report));
  else console.log('\n' + renderMarkdown(report) + '\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(`llm-review: fatal — ${e.message}`); process.exit(1); });
}
