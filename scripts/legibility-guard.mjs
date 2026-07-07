// =============================================================================
// legibility-guard — perpetual, per-PAGE UI/UX legibility gate (DR-0076 + ITIL CSI)
// =============================================================================
// WHY THIS EXISTS (the 2026-06-25 "we can't see the recipes on the black screen"
// incident): the Chef's Corner recipe surface shipped DARK-ON-DARK. The existing
// contrast-guard (scripts/contrast-guard.mjs) is solid but had three holes that
// let it through:
//   1. It scanned app/src/components/*.jsx NON-RECURSIVELY (missed subdirs).
//   2. It POOLED every token across all files, so it could not say WHICH page
//      failed — there was no per-page health, no baseline to work down.
//   3. Its inline-color scanner only matched LITERAL `'#hex'` inline values, and
//      only ran strictly on a 2-file allowlist. ChefCorner.jsx renders all its
//      text via `style={{ color: INK }}` where `INK = '#1A1815'` is a hardcoded
//      CONSTANT — an inline color that bypasses the [data-theme] remap entirely.
//      In midnight, `bg-white` cards remap to #141414 (dark) but the inline ink
//      stays #1A1815 (dark) -> ~1.05:1 -> invisible. The scanner never saw it.
//
// This guard closes all three. It is PER-PAGE (every component file + the
// monolith is its own "page"), RECURSIVE, checks EVERY dark theme (derived, not
// hardcoded), and resolves inline color CONSTANTS so `color: INK` is caught the
// same as `color: '#1A1815'`. It carries a BASELINE (scripts/legibility-baseline
// .json): the current known-failing pages are frozen as tracked debt (reported,
// never blocking) and the gate HARD-FAILS only on a NEW violation (a regression).
// As the fix lane removes inline colors, the baseline shrinks -> the QCHP health
// trends better -> "perpetual ITIL activated." Deterministic, $0, no browser, no
// LLM. Importable so a vitest gates merges from inside the required
// `app — lint + vitest` check; CLI: node scripts/legibility-guard.mjs [--check|
// --generate|--health].
// =============================================================================
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio, parseThemes, collectColorTokens } from './contrast-guard.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MONOLITH = join(ROOT, 'app/src/poe-financial-mvp-v28.jsx');
// 2026-07-07: the [data-theme] palette rules moved to the shared theme source
// (lib/theme-css.js) so the business doors render the same themes. Theme
// parsing reads monolith + theme source; page scanning is unchanged.
const THEME_SOURCE = join(ROOT, 'app/src/lib/theme-css.js');
const COMPONENTS_DIR = join(ROOT, 'app/src/components');
const BASELINE_PATH = join(ROOT, 'scripts/legibility-baseline.json');
const HEALTH_PATH = join(ROOT, 'app/src/lib/legibility-health.json');

const AA = 4.5; // WCAG 2.1 AA, normal text

// Expand a 3-digit hex (#fff) to 6-digit (#ffffff). CSS allows both; the stable
// contrast-guard math only accepts 6-digit, and `#fff` is a real inline value in
// the codebase (ChefCorner button backgrounds), so normalize before any math.
export function expandHex(hex) {
  const m = /^#?([0-9a-f]{3})$/i.exec((hex || '').trim());
  if (!m) return (hex || '').trim();
  const [r, g, b] = m[1].split('');
  return `#${r}${r}${g}${g}${b}${b}`;
}

// --- relative luminance (WCAG 2.1) — local copy so we don't widen the stable
// contrast-guard's export surface. Same math it uses internally. -------------
export function relLum(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(expandHex(hex));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const a = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

// A theme is "dark" when its base background is dark enough that DARK text on it
// is unreadable. midnight (#000000) qualifies; slate/white (light bgs) do not.
export function darkThemes(themes) {
  return Object.entries(themes)
    .filter(([, t]) => { const L = relLum(t.baseBg); return L != null && L < 0.4; })
    .map(([n]) => n);
}

// Parse a single theme's class remap table (bg + text) AND its default inherited
// text color. Generalized from contrast-guard.parseMidnightRemap so a NEWLY
// added dark theme is checked automatically — no hardcoded 'midnight'.
export function parseThemeRemap(src, theme) {
  const bg = {}, text = {};
  let defaultText = null, baseBg = null;
  const tag = `[data-theme="${theme}"]`;
  for (const raw of src.split('\n')) {
    if (!raw.includes(tag)) continue;
    const line = raw.replace(/\\\\/g, '').replace(/\\/g, '');
    if (/:hover/.test(line)) continue;
    if (/\.text-white\{/.test(line)) continue;
    // bare theme rule: `[data-theme="x"]{background-color:..;color:..}`
    const bareRe = new RegExp(`\\[data-theme="${theme}"\\]\\{([^}]*)\\}`, 'i');
    const bare = line.match(bareRe);
    if (bare) {
      const b = bare[1].match(/background-color:\s*(#[0-9a-f]{6})/i);
      const c = bare[1].match(/(?<!background-)color:\s*(#[0-9a-f]{6})/i);
      if (b) baseBg = b[1];
      if (c) defaultText = c[1];
    }
    const bgm = line.match(/\.bg-(?:\[(#[0-9a-f]{6})\]|(white|black))\{background-color:\s*(#[0-9a-f]{6})/i);
    if (bgm) { bg[(bgm[1] || bgm[2]).toLowerCase()] = bgm[3]; continue; }
    const tm = line.match(/\.text-\[(#[0-9a-f]{6})\]\{color:\s*(#[0-9a-f]{6})/i);
    if (tm) text[tm[1].toLowerCase()] = tm[2];
  }
  return { bg, text, defaultText, baseBg };
}

// Accent ACTION backgrounds that stay bright on purpose in a dark theme and flip
// their text dark via compound `.bg-x.text-white{color:#1A1815}` rules — so the
// "bg must render dark" rule does not apply to them (mirrors contrast-guard).
const ACCENT_ACTION_BG = ['#5a6e3d', '#b85838', '#2a5a8e'];
const BG_TOO_LIGHT_LUM = 0.5;

// --- inline color constants -------------------------------------------------
// ChefCorner.jsx: `const INK = '#1A1815'` then `style={{ color: INK }}`. Resolve
// the const so the variable ref is caught exactly like the literal would be.
export function parseColorConsts(src) {
  const consts = {};
  // Accept single OR double-quoted hex string consts (both valid JS/JSX), 3 or 6
  // digit. Store expanded so all downstream math sees 6-digit.
  for (const m of src.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*['"](#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}))['"]\s*;?/g)) {
    consts[m[1]] = expandHex(m[2]);
  }
  return consts;
}

// Resolve an inline style value expression to the hex color(s) it can render.
// Handles a literal '#hex', a known color const, and a ternary of either.
// Returns [] when it cannot be resolved (a dynamic/data-driven color) — those
// are tracked as warnings, never hard-failed (no false positives on charts etc).
export function resolveColors(expr, consts) {
  expr = (expr || '').trim().replace(/,$/, '').trim();
  const lit = /^['"](#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}))['"]$/.exec(expr);
  if (lit) return [expandHex(lit[1])];
  if (Object.prototype.hasOwnProperty.call(consts, expr)) return [consts[expr]];
  const tern = /\?([^?:]+):(.+)$/.exec(expr);
  if (tern) return [...resolveColors(tern[1], consts), ...resolveColors(tern[2], consts)];
  return [];
}

const INLINE_COLOR_KEYS = ['color', 'backgroundColor', 'borderColor', 'outlineColor'];

// Scan a file's `style={{ ... }}` blocks for inline TEXT colors that resolve to
// a hex failing AA on a dark theme's surfaces — the exact dark-on-dark mechanism
// (INK/MUTE inline). Resolvable-but-light or dynamic inline colors are returned
// as `warns` (tracked debt to promote), not hard violations.
export function scanInlineColors(src, darkSurfaces) {
  const violations = [];
  const warns = [];
  const consts = parseColorConsts(src);
  const styleRe = /style=\{\{([^{}]*)\}\}/g;
  let m;
  while ((m = styleRe.exec(src))) {
    const body = m[1];
    const line = src.slice(0, m.index).split('\n').length;
    // Resolve this block's OWN inline background first. If it is an un-themeable
    // LIGHT color (e.g. `backgroundColor: CREAM`/`'#fff'`), then inline dark text
    // in the SAME block is dark-on-LIGHT and stays readable in every theme — not
    // a violation. Only flag inline dark text that sits on a themeable/inherited
    // surface (no inline light bg of its own), which goes dark in midnight.
    const bgm = new RegExp(`(?:^|[^A-Za-z])backgroundColor\\s*:\\s*([^,}]+)`).exec(body);
    const bgColors = bgm ? resolveColors(bgm[1], consts) : [];
    const hasInlineLightBg = bgColors.some((h) => { const L = relLum(h); return L != null && L >= BG_TOO_LIGHT_LUM; });
    for (const key of INLINE_COLOR_KEYS) {
      const km = new RegExp(`(?:^|[^A-Za-z])${key}\\s*:\\s*([^,}]+)`).exec(body);
      if (!km) continue;
      const colors = resolveColors(km[1], consts);
      if (key !== 'color') {
        // non-text inline color: tracked, not failed (border/bg are lower-risk).
        if (colors.length) warns.push({ line, kind: 'inline-non-text-color', key, detail: colors[0].toLowerCase() });
        continue;
      }
      if (hasInlineLightBg) continue; // dark text on an inline light bg is readable
      if (!colors.length) { warns.push({ line, kind: 'inline-dynamic-text-color', key, detail: 'dynamic' }); continue; }
      // FAIL if the inline text color is unreadable on ANY dark theme surface.
      for (const hex of colors) {
        let worst = Infinity, worstTheme = null;
        for (const ds of darkSurfaces) {
          const r = contrastRatio(hex, ds.surface);
          if (r != null && r < worst) { worst = r; worstTheme = ds.theme; }
        }
        if (worst < AA) {
          violations.push({
            line, kind: 'inline-dark-text', detail: hex.toLowerCase(),
            ratio: +worst.toFixed(2), theme: worstTheme,
            why: `inline text color ${hex} is un-themeable; renders ${worst.toFixed(2)}:1 on the ${worstTheme} surface (need ${AA}). Use a themeable text-[#hex] class.`,
          });
        }
      }
    }
  }
  return { violations, warns };
}

// --- class-token coverage (per page, every dark theme) ----------------------
// A used text-[#hex] that a dark theme does not remap renders dark-on-dark; a
// used near-white bg-[#hex] it does not remap renders light-on-light. Same idea
// as contrast-guard's pooled token check, but attributed to ONE page and run for
// every dark theme.
export function scanTokenCoverageForFile(src, darkRemaps) {
  const violations = [];
  const used = collectColorTokens(src);
  for (const { theme, remap, card } of darkRemaps) {
    for (const key of used.text) {
      const rendered = remap.text[key] || key;
      const r = contrastRatio(rendered, card);
      if (r != null && r < AA) {
        violations.push({ kind: 'token-dark-on-dark', detail: `text-${key}`, rendered, ratio: +r.toFixed(2), theme });
      }
    }
    for (const key of used.bg) {
      if (ACCENT_ACTION_BG.includes(key)) continue;
      let rendered = remap.bg[key];
      if (!rendered) rendered = key === 'white' ? '#FFFFFF' : key === 'black' ? '#000000' : key;
      const L = relLum(rendered);
      if (L != null && L >= BG_TOO_LIGHT_LUM) {
        violations.push({ kind: 'token-light-on-light', detail: `bg-${key}`, rendered, lum: +L.toFixed(2), theme });
      }
    }
  }
  return violations;
}

// A stable, line-INDEPENDENT signature so the baseline survives edits/reflows.
export function signature(v) {
  return `${v.kind}|${v.detail}|${v.theme || 'all'}`;
}

// --- page discovery (RECURSIVE — the connectors/ subdir was invisible before) -
export function listPages() {
  const pages = [];
  if (existsSync(MONOLITH)) pages.push(MONOLITH);
  const walk = (dir) => {
    let entries = [];
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.jsx')) pages.push(p);
    }
  };
  walk(COMPONENTS_DIR);
  // Sort by id so discovery order is filesystem-INDEPENDENT — the committed
  // health artifact must be byte-identical on every machine and in CI.
  return pages.sort((a, b) => pageId(a).localeCompare(pageId(b)));
}

function pageId(absPath) {
  return relative(join(ROOT, 'app/src'), absPath).split(sep).join('/');
}

export function loadBaseline() {
  try { return JSON.parse(readFileSync(BASELINE_PATH, 'utf8')); }
  catch { return { version: 1, note: '', frozenAt: null, pages: {} }; }
}

// --- the scan ---------------------------------------------------------------
export function scanLegibility(baseline = loadBaseline()) {
  const monoSrc = (existsSync(MONOLITH) ? readFileSync(MONOLITH, 'utf8') : '')
    + (existsSync(THEME_SOURCE) ? '\n' + readFileSync(THEME_SOURCE, 'utf8') : '');
  const themes = parseThemes(monoSrc);
  const darks = darkThemes(themes);
  // For each dark theme: its remap table + the LIGHTER of its two surfaces
  // (base bg / card) — the worst case for keeping light text readable, and the
  // surface dark inline text is most likely to vanish against.
  const darkRemaps = darks.map((theme) => {
    const remap = parseThemeRemap(monoSrc, theme);
    const base = remap.baseBg || themes[theme].baseBg;
    const card = remap.bg['white'] || themes[theme].cardBg || '#141414';
    return { theme, remap, base, card };
  });
  // Surfaces an inline dark text color must clear: both base and card of every
  // dark theme. Lightest among them is the easiest to read on -> if it fails
  // even there, it's unambiguously dark-on-dark.
  const darkSurfaces = darkRemaps.flatMap(({ theme, base, card }) => [
    { theme: `${theme}/base`, surface: base }, { theme: `${theme}/card`, surface: card },
  ]);

  const pages = [];
  for (const abs of listPages()) {
    let src; try { src = readFileSync(abs, 'utf8'); } catch { continue; }
    const id = pageId(abs);
    const tokenV = scanTokenCoverageForFile(src, darkRemaps);
    const { violations: inlineV, warns } = scanInlineColors(src, darkSurfaces);
    const all = [...tokenV, ...inlineV].map((v) => ({ ...v, signature: signature(v) }));
    const baseSigs = new Set((baseline.pages && baseline.pages[id]) || []);
    const tracked = [], regressions = [];
    for (const v of all) (baseSigs.has(v.signature) ? tracked : regressions).push(v);
    pages.push({
      page: id, violations: all, tracked, regressions, warns,
      status: regressions.length ? 'REGRESSION' : all.length ? 'TRACKED-DEBT' : 'PASS',
    });
  }
  const regressions = pages.flatMap((p) => p.regressions.map((v) => ({ page: p.page, ...v })));
  const debt = pages.flatMap((p) => p.tracked.map((v) => ({ page: p.page, ...v })));
  return {
    themes: Object.keys(themes), darkThemes: darks, darkSurfaces: darkSurfaces.map((d) => d.theme),
    pages, regressions, debt,
    summary: {
      pages: pages.length,
      passing: pages.filter((p) => p.status === 'PASS').length,
      trackedDebtPages: pages.filter((p) => p.status === 'TRACKED-DEBT').length,
      regressionPages: pages.filter((p) => p.status === 'REGRESSION').length,
      regressions: regressions.length,
      debtViolations: debt.length,
    },
  };
}

// --- QCHP health artifact ---------------------------------------------------
// Per-page pass/fail snapshot the QCHP / Quality Care Health Plan loop view
// (lane local_75dc44d5) renders in-app. Committed + asserted-in-sync by the test
// (the quality-manifest pattern) so it can never drift silently.
export function buildHealth(scan = scanLegibility()) {
  return {
    generatedFrom: 'scripts/legibility-guard.mjs',
    standard: 'WCAG 2.1 AA, per-page, per-theme (dark-on-dark + light-on-light)',
    themesChecked: scan.darkThemes,
    summary: scan.summary,
    pages: scan.pages
      .filter((p) => p.status !== 'PASS')
      .map((p) => ({
        page: p.page, status: p.status,
        violations: p.violations.length, regressions: p.regressions.length,
        kinds: [...new Set(p.violations.map((v) => v.kind))],
      }))
      .sort((a, b) => b.violations - a.violations || a.page.localeCompare(b.page)),
    trend: 'Tracked-debt pages are the backlog the fix lane works down; the gate blocks any NEW failing page. Fewer tracked pages over time = perpetual ITIL CSI.',
  };
}

export function writeHealth(scan = scanLegibility()) {
  const health = buildHealth(scan);
  writeFileSync(HEALTH_PATH, JSON.stringify(health, null, 2) + '\n');
  return health;
}

export function writeBaseline(scan = scanLegibility({ version: 1, pages: {} })) {
  const pages = {};
  for (const p of scan.pages) {
    if (p.violations.length) pages[p.page] = p.violations.map((v) => v.signature).sort();
  }
  const baseline = {
    version: 1,
    note: 'Frozen UI/UX legibility debt (per-page WCAG-AA dark-on-dark). The gate '
      + 'hard-fails only on a NEW violation not listed here. Shrink this list as '
      + 'pages are fixed (re-freeze: node scripts/legibility-guard.mjs --generate).',
    frozenAt: null, // stamped by a human/CI run; Date.* is non-deterministic here
    pages,
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n');
  return baseline;
}

// --- CLI --------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = process.argv[2];
  if (arg === '--generate') {
    const b = writeBaseline();
    console.log(`# legibility-guard --generate\nFroze ${Object.keys(b.pages).length} page(s) of tracked debt into ${relative(ROOT, BASELINE_PATH)}.`);
    process.exit(0);
  }
  const scan = scanLegibility();
  if (arg === '--health') {
    writeHealth(scan);
    console.log(`# legibility-guard --health\nWrote per-page health to ${relative(ROOT, HEALTH_PATH)} (${scan.summary.passing}/${scan.summary.pages} pages pass).`);
    process.exit(0);
  }
  console.log('# LEGIBILITY GUARD (per-page WCAG 2.1 AA — dark-on-dark + light-on-light)\n');
  console.log(`Themes: ${scan.themes.join(', ')} | dark: ${scan.darkThemes.join(', ') || '(none)'}`);
  console.log(`Pages scanned: ${scan.summary.pages} | PASS ${scan.summary.passing} | tracked-debt ${scan.summary.trackedDebtPages} | REGRESSION ${scan.summary.regressionPages}\n`);

  if (scan.debt.length) {
    console.log(`Tracked debt (baseline — reported, does NOT block merge): ${scan.debt.length} violation(s) across ${scan.summary.trackedDebtPages} page(s):`);
    const byPage = {};
    for (const d of scan.debt) (byPage[d.page] ||= []).push(d);
    for (const [pg, vs] of Object.entries(byPage)) {
      console.log(`  ~ ${pg}: ${vs.length}`);
      for (const v of vs.slice(0, 6)) console.log(`      - [${v.theme || 'all'}] ${v.kind} ${v.detail}${v.ratio ? ` (${v.ratio}:1)` : ''}${v.line ? ` @L${v.line}` : ''}`);
    }
    console.log('');
  }

  if (scan.regressions.length) {
    console.log(`FAIL — ${scan.regressions.length} NEW legibility violation(s) (not in baseline) — fix before merge:`);
    for (const v of scan.regressions) {
      console.log(`  - ${v.page}${v.line ? `:${v.line}` : ''} [${v.theme || 'all'}] ${v.kind} ${v.detail}${v.ratio ? ` = ${v.ratio}:1` : ''}`);
      if (v.why) console.log(`      ${v.why}`);
    }
    process.exit(1);
  }
  console.log('PASS — no NEW dark-on-dark / light-on-light violations. (Tracked debt, if any, is the fix-lane backlog; it trends down, never up.)');
  process.exit(0);
}
