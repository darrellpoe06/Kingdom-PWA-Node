// =============================================================================
// quality-proof — pure logic for the in-app Quality / Proof panel
// =============================================================================
// Turns the build-time manifest (__QUALITY_PROOF__, real file-verified gates +
// loops + measured contrast) together with the LIVE CI conclusion (from
// lib/github-ops.js) into render-ready status, WITHOUT ever painting a green it
// did not earn (Verification Doctrine, DR-0076):
//
//   - A gate/loop's existence is NOT a pass. A row is 'idle/wired' until a real
//     CI run on the SERVED build SHA reports green; only then does it become
//     'good (passed in CI <sha>)'. If that run failed, the rows go 'attention'
//     and the headline says a check failed -- exactly the "loop silently failed"
//     signal the panel exists to show.
//   - Build freshness compares the SERVED build SHA to the live main HEAD SHA:
//     green = you are on the latest deployed build; red = a newer build landed.
//   - Contrast is the one row that carries its OWN measured pass/fail (numbers
//     from scanContrast at build time), independent of CI.
//
// All functions are pure and null-safe so they unit-test without a browser.

// Normalize the build-time manifest into a safe shape (handles the degraded
// build where the define is missing or the manifest failed to assemble).
export function normalizeManifest(raw) {
  const m = raw && typeof raw === 'object' ? raw : {};
  const arr = (x) => (Array.isArray(x) ? x : []);
  const contrast = m.contrast && typeof m.contrast === 'object' ? m.contrast : { ok: false, pass: false, themes: [], violations: [] };
  return {
    ok: m.ok === true,
    gates: arr(m.gates),
    loops: arr(m.loops),
    contrast: {
      ok: contrast.ok === true,
      pass: contrast.pass === true,
      themes: arr(contrast.themes),
      themeCount: contrast.themeCount != null ? contrast.themeCount : arr(contrast.themes).length,
      violations: arr(contrast.violations),
      standard: contrast.standard || 'WCAG 2.1 AA',
    },
    ci: m.ci && typeof m.ci === 'object' ? m.ci : { exists: false, steps: [] },
    summary: m.summary && typeof m.summary === 'object' ? m.summary : {},
  };
}

// 7-char short SHA, lowercased, from either a short or full SHA. Null-safe.
export function shortSha(sha) {
  return String(sha || '').trim().toLowerCase().slice(0, 7);
}

// Build freshness: is the SERVED build the latest on main?
//   served  = __BUILD_SHA__ baked into this bundle (7-char, or 'dev' locally)
//   mainSha = live main HEAD short SHA from the GitHub API (github-ops)
// Returns a KPI-ready descriptor. 'dev'/unknown => idle (honest "can't tell"),
// never a misleading green.
export function freshnessVerdict(servedSha, mainSha) {
  const served = shortSha(servedSha);
  const main = shortSha(mainSha);
  if (!served || served === 'dev') {
    return { status: 'idle', label: 'Local / unknown build', latest: null, served, main };
  }
  if (!main) {
    return { status: 'idle', label: 'Latest build unknown (offline)', latest: null, served, main };
  }
  if (served === main) {
    return { status: 'good', label: `Latest · ${served}`, latest: true, served, main };
  }
  return { status: 'problem', label: `Stale · ${served} (main is ${main})`, latest: false, served, main };
}

// The live CI verdict for the served build. `mainCi` is github-ops' normalized
// main-CI shape ({ status, label, latest:{ sha, conclusion } }) and `servedSha`
// is this bundle's SHA. We only call the gates "green" when the latest CI run is
// success AND it ran on the SHA we are actually serving -- otherwise the green
// would be about a different commit (provenance, DR-0076 #8).
export function ciVerdict(mainCi, servedSha) {
  const served = shortSha(servedSha);
  if (!mainCi || typeof mainCi !== 'object') {
    return { status: 'idle', headline: 'CI status unknown (offline)', green: false, onServedBuild: false, sha: null, conclusion: null };
  }
  const ranSha = shortSha(mainCi.latest && mainCi.latest.sha);
  const conclusion = (mainCi.latest && mainCi.latest.conclusion) || (mainCi.status === 'good' ? 'success' : null);
  const green = mainCi.status === 'good';
  const onServedBuild = !!served && served !== 'dev' && !!ranSha && served === ranSha;
  let headline;
  if (green && onServedBuild) headline = `All checks passed in CI on the served build (${ranSha})`;
  else if (green) headline = `Latest CI green${ranSha ? ` (${ranSha})` : ''} — newer than / different from the served build`;
  else if (mainCi.status === 'problem') headline = `CI is failing${ranSha ? ` (${ranSha})` : ''} — a gate or loop did not pass`;
  else if (mainCi.status === 'idle') headline = 'CI status unknown (offline)';
  else headline = mainCi.label || 'CI status: see the orchestration board';
  return { status: mainCi.status || 'idle', headline, green, onServedBuild, sha: ranSha, conclusion };
}

// Per-row status for a gate/loop, derived from the LIVE CI verdict -- never from
// the row's mere existence. An unverified row (its file went missing at build)
// is always 'problem' (the manifest itself broke). Otherwise: green only when CI
// is green on the served build; 'attention' when CI failed (this row is part of
// a failing run); 'idle' when we can't tell (offline / not the served SHA).
export function rowStatus(row, verdict) {
  if (row && row.verified === false) {
    return { status: 'problem', label: 'unwired — test file missing' };
  }
  if (verdict && verdict.green && verdict.onServedBuild) {
    return { status: 'good', label: 'passed in CI' };
  }
  if (verdict && verdict.status === 'problem') {
    return { status: 'attention', label: 'in a failing CI run — check' };
  }
  if (verdict && verdict.green) {
    return { status: 'idle', label: 'green in CI (other build)' };
  }
  return { status: 'idle', label: 'wired — CI status pending' };
}

// Contrast row carries its own measured verdict (numbers, not CI).
export function contrastStatus(contrast) {
  const c = contrast || {};
  if (c.ok !== true) return { status: 'idle', label: 'not measured' };
  if (c.pass === true) return { status: 'good', label: `AA met · ${c.themeCount} theme${c.themeCount === 1 ? '' : 's'}` };
  const n = Array.isArray(c.violations) ? c.violations.length : 0;
  return { status: 'problem', label: `${n} contrast violation${n === 1 ? '' : 's'}` };
}

// Map a review record's status word to a KPI state. 'addressed' is the only
// green; 'open' is attention; anything else ('logged'/unknown) is idle -- a
// recorded review with no verified resolution is never painted green.
export function reviewStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'addressed') return { status: 'good', label: 'addressed' };
  if (s === 'open') return { status: 'attention', label: 'open' };
  return { status: 'idle', label: s || 'logged' };
}

// The registry polices its own freshness (DR-0102): reviews are only
// "consistent and perpetual" if new records keep landing. Compares the newest
// record date to now; past staleDays the verdict is attention -- the panel
// says "stale" about its own registry instead of letting it age silently
// (REV-0005 sat 20 days across ~200 merges before this existed). Never green
// without a real date AND a real clock.
export function reviewFreshness(reviews, nowMs, staleDays = 7) {
  const items = reviews && Array.isArray(reviews.items) ? reviews.items : [];
  let latest = null;
  for (const it of items) {
    const t = Date.parse(String((it && it.date) || ''));
    if (Number.isFinite(t) && (latest == null || t > latest)) latest = t;
  }
  if (latest == null) return { ok: false, lastDate: '', daysSince: null, stale: false, status: 'idle', label: 'no dated reviews' };
  if (!Number.isFinite(nowMs)) return { ok: false, lastDate: new Date(latest).toISOString().slice(0, 10), daysSince: null, stale: false, status: 'idle', label: 'clock unavailable' };
  const daysSince = Math.max(0, Math.floor((nowMs - latest) / 86400000));
  const stale = daysSince > staleDays;
  return {
    ok: true,
    lastDate: new Date(latest).toISOString().slice(0, 10),
    daysSince,
    stale,
    status: stale ? 'attention' : 'good',
    label: stale ? `stale — ${daysSince}d since last review` : `fresh — ${daysSince}d ago`,
  };
}

// Normalize the reviews registry (__UIUX_REVIEWS__) into a safe shape.
export function normalizeReviews(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const items = Array.isArray(r.items) ? r.items : [];
  return {
    ok: r.ok === true && items.length > 0,
    count: items.length,
    items: items.map((it) => ({
      id: String((it && it.id) || ''),
      title: String((it && it.title) || ''),
      date: String((it && it.date) || ''),
      surface: String((it && it.surface) || ''),
      type: String((it && it.type) || ''),
      status: String((it && it.status) || ''),
      findings: String((it && it.findings) || ''),
      source: String((it && it.source) || ''),
    })),
  };
}
