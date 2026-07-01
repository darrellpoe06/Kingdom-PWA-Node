// =============================================================================
// surface-audit.test.js — PROVEN-TO-CATCH tests for the proactive surface audit
// (DR-0086). A gate that always passes is itself a lie (Verification Doctrine,
// DR-0076 §3). Every rubric item here is shown to CATCH a synthetic break AND to
// stay silent on clean source — so a green audit MEANS something.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateRubric, auditSource, checkReachability, runAudit,
  findingToConcern, diffFindings, findingKey, summarize,
} from '../../../scripts/lib/surface-audit-core.mjs';
import { composeConcerns, auditToConcernCards } from '../lib/concerns.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const rubric = JSON.parse(readFileSync(join(ROOT, 'scripts', 'surface-audit-rubric.json'), 'utf8'));

const surface = (id, extra = {}) => ({ id, label: id, nav: 'top', view: id, file: `app/src/components/${id}.jsx`, ...extra });

describe('rubric config', () => {
  it('the shipped rubric is valid', () => {
    const v = validateRubric(rubric);
    expect(v.ok, v.errors.join('; ')).toBe(true);
  });
  it('rejects a rubric with a bad regex (fails loud, never silently audits nothing)', () => {
    const bad = { version: 1, items: [{ id: 'x', label: 'x', dimension: 'd', severity: 'high', kind: 'source-pattern', expect: 'absent', patterns: ['('] }] };
    expect(validateRubric(bad).ok).toBe(false);
  });
  it('rejects an unknown severity and an unknown kind', () => {
    expect(validateRubric({ version: 1, items: [{ id: 'x', label: 'x', dimension: 'd', severity: 'nope', kind: 'source-pattern', expect: 'absent', patterns: ['a'] }] }).ok).toBe(false);
    expect(validateRubric({ version: 1, items: [{ id: 'y', label: 'y', dimension: 'd', severity: 'high', kind: 'telepathy' }] }).ok).toBe(false);
  });
});

describe('placeholder-content (no-dead-ends)', () => {
  it('CATCHES a coming-soon dead-end', () => {
    const f = auditSource(surface('demo'), '<div>Coming soon!</div>', rubric);
    expect(f.some((x) => x.item === 'placeholder-content')).toBe(true);
  });
  it('is SILENT on a real surface with no placeholder', () => {
    const f = auditSource(surface('demo'), '<div>{fmt(total)}</div>', rubric);
    expect(f.some((x) => x.item === 'placeholder-content')).toBe(false);
  });
});

describe('hardcoded-currency-tile (dynamic-not-static)', () => {
  it('CATCHES a painted dollar figure in JSX text', () => {
    const f = auditSource(surface('demo'), '<div className="tile">$12,340</div>', rubric);
    expect(f.some((x) => x.item === 'hardcoded-currency-tile')).toBe(true);
  });
  it('is SILENT when the figure is derived from data', () => {
    const f = auditSource(surface('demo'), '<div className="tile">{fmt(balance)}</div>', rubric);
    expect(f.some((x) => x.item === 'hardcoded-currency-tile')).toBe(false);
  });
});

describe('hardcoded-percent-tile (dynamic-not-static)', () => {
  it('CATCHES a painted progress percent', () => {
    const f = auditSource(surface('demo'), '<span>60% complete</span>', rubric);
    expect(f.some((x) => x.item === 'hardcoded-percent-tile')).toBe(true);
  });
  it('is SILENT on a legit CSS layout width (not a data tile)', () => {
    const f = auditSource(surface('demo'), "<div style={{ width: '100%' }} />", rubric);
    expect(f.some((x) => x.item === 'hardcoded-percent-tile')).toBe(false);
  });
});

describe('hardcoded-count-tile (dynamic-not-static) — the 2026-07-01 static->live sweep guard', () => {
  it('CATCHES a comma-grouped painted count/amount with no $ (the class the currency check misses)', () => {
    const f = auditSource(surface('demo'), '<div className="stat-value">12,340</div>', rubric);
    expect(f.some((x) => x.item === 'hardcoded-count-tile')).toBe(true);
  });
  it('CATCHES a small comma-grouped literal like 1,234', () => {
    const f = auditSource(surface('demo'), '<span>1,234</span>', rubric);
    expect(f.some((x) => x.item === 'hardcoded-count-tile')).toBe(true);
  });
  it('is SILENT when the number is derived (live renders as {fmt(n)}, no literal comma in source)', () => {
    const f = auditSource(surface('demo'), '<div className="stat-value">{fmt(count)}</div>', rubric);
    expect(f.some((x) => x.item === 'hardcoded-count-tile')).toBe(false);
  });
  it('is SILENT on a plain small integer (not comma-grouped, not a big painted stat)', () => {
    const f = auditSource(surface('demo'), '<span>{n} of 10</span>', rubric);
    expect(f.some((x) => x.item === 'hardcoded-count-tile')).toBe(false);
  });
});

describe('list-pagination (intuitive-ux, scoped to long-list surfaces)', () => {
  it('CATCHES a long-list surface with no pagination (endless-scroll class)', () => {
    // 'crm' is in the check's includeSurfaces.
    const f = auditSource(surface('crm'), 'rows.map((r) => <Row key={r.id} r={r} />)', rubric);
    expect(f.some((x) => x.item === 'list-pagination')).toBe(true);
  });
  it('is SILENT when the surface paginates (pageSize present)', () => {
    const f = auditSource(surface('crm'), 'const pageSize = 25; rows.slice(page*pageSize).map(r => <Row r={r}/>)', rubric);
    expect(f.some((x) => x.item === 'list-pagination')).toBe(false);
  });
  it('does NOT apply to surfaces outside its includeSurfaces scope (no noise)', () => {
    const f = auditSource(surface('about'), 'rows.map((r) => <Row r={r} />)', rubric);
    expect(f.some((x) => x.item === 'list-pagination')).toBe(false);
  });
});

describe('surface-unreachable (reachability)', () => {
  const surfaces = [surface('ghost'), surface('shown')];
  const shell = "if (view === 'shown') return <Shown/>;"; // ghost has NO render branch
  it('CATCHES a registered top surface with no render branch (the "admin unreachable" class)', () => {
    const { findings } = checkReachability(surfaces, shell, rubric);
    expect(findings.some((f) => f.surface === 'ghost' && f.item === 'surface-unreachable')).toBe(true);
  });
  it('is SILENT for a surface that has a render branch', () => {
    const { findings } = checkReachability(surfaces, shell, rubric);
    expect(findings.some((f) => f.surface === 'shown')).toBe(false);
  });
  it('only covers top-level surfaces (church/books subs are a documented limitation, not silently passed)', () => {
    const { findings, skipped } = checkReachability([surface('sub', { nav: 'church', sub: 'sub' })], '', rubric);
    expect(findings.length).toBe(0);
    expect(skipped).toContain('sub');
  });
});

describe('runAudit end-to-end on synthetic surfaces', () => {
  it('re-discovers the morning\'s CLASSES in one pass (endless-scroll + static tile + dead-end + unreachable)', () => {
    const surfaces = [
      surface('crm'),                 // long list, no paging -> list-pagination
      surface('books', { id: 'books' }),
      surface('orphan'),              // no render branch -> surface-unreachable
    ];
    const sources = {
      crm: 'items.map((i) => <li>{i.name}</li>)',
      books: '<div className="stat-label">Q3 revenue</div><div className="stat-value">$48,200</div><span>Coming soon</span>',
      orphan: '<div>{fmt(x)}</div>',
    };
    const shell = "view === 'crm'; view === 'books';"; // orphan absent
    const { findings, summary } = runAudit({ surfaces, sources, shellSource: shell, rubric });
    const items = new Set(findings.map((f) => f.item));
    expect(items.has('list-pagination')).toBe(true);
    expect(items.has('hardcoded-currency-tile')).toBe(true);
    expect(items.has('placeholder-content')).toBe(true);
    expect(items.has('surface-unreachable')).toBe(true);
    expect(summary.total).toBeGreaterThanOrEqual(4);
    // Deterministic severity ordering: critical first.
    expect(findings[0].severityRank).toBeLessThanOrEqual(findings[findings.length - 1].severityRank);
  });

  it('is fully SILENT on clean surfaces (a green audit means something)', () => {
    const surfaces = [surface('crm'), surface('clean')];
    const sources = {
      crm: 'const pageSize = 25; items.slice(0, pageSize).map((i) => <li>{i.name}</li>)',
      clean: '<div>{fmt(total)}</div>',
    };
    const shell = "view === 'crm'; view === 'clean';";
    const { findings } = runAudit({ surfaces, sources, shellSource: shell, rubric });
    expect(findings).toEqual([]);
  });
});

describe('finding -> concern mapping + auto-resolve diff', () => {
  it('maps a finding to a read-through concern card the board can render', () => {
    const [f] = runAudit({ surfaces: [surface('crm')], sources: { crm: 'x.map(r=><li/>)' }, shellSource: "view === 'crm'", rubric }).findings;
    const c = findingToConcern(f);
    expect(c.source).toBe('audit');
    expect(c.readOnly).toBe(true);
    expect(c.status).toBe('open');
    expect(c.concern).toContain('[Auto-audit]');
    expect(c.solution).toBeTruthy();
    expect(c.id.startsWith('audit-')).toBe(true);
  });

  it('a finding that disappears on re-audit is reported RESOLVED (dispatched fix landed)', () => {
    const before = runAudit({ surfaces: [surface('crm')], sources: { crm: 'x.map(r=><li/>)' }, shellSource: "view === 'crm'", rubric }).findings;
    const after = runAudit({ surfaces: [surface('crm')], sources: { crm: 'const pageSize=25; x.slice(0,pageSize).map(r=><li/>)' }, shellSource: "view === 'crm'", rubric }).findings;
    const diff = diffFindings(before, after);
    expect(diff.resolved.length).toBe(1);
    expect(diff.resolved[0].item).toBe('list-pagination');
    expect(after.length).toBe(0);
  });

  it('findingKey is stable for the same defect across runs (dedupe)', () => {
    const run = () => runAudit({ surfaces: [surface('crm')], sources: { crm: 'x.map(r=><li/>)' }, shellSource: "view === 'crm'", rubric }).findings[0];
    expect(findingKey(run())).toBe(findingKey(run()));
  });
});

describe('board integration (composeConcerns reads audit findings through)', () => {
  it('audit cards appear on the composed board and carry source=audit', () => {
    const artifact = { concerns: [findingToConcern({ surface: 'crm', surfaceLabel: 'CRM', item: 'list-pagination', title: 'x', severity: 'medium', severityRank: 2, detail: 'd', fix: 'f', key: 'crm::list-pagination::-' })] };
    const cards = auditToConcernCards(artifact);
    expect(cards[0].source).toBe('audit');
    const all = composeConcerns({ dbConcerns: [], feedback: [], audit: artifact });
    expect(all.some((c) => c.source === 'audit' && c.surface === 'crm')).toBe(true);
  });

  it('an empty/absent artifact never throws and adds no cards', () => {
    expect(auditToConcernCards({})).toEqual([]);
    expect(auditToConcernCards(null)).toEqual([]);
    expect(() => composeConcerns({ audit: null })).not.toThrow();
  });

  it('the SHIPPED artifact is well-formed (summary matches findings; concerns match findings)', () => {
    const artifact = JSON.parse(readFileSync(join(ROOT, 'app', 'src', 'lib', 'audit-findings.json'), 'utf8'));
    expect(artifact.summary.total).toBe(artifact.findings.length);
    expect(artifact.concerns.length).toBe(artifact.findings.length);
    expect(summarize(artifact.findings).total).toBe(artifact.findings.length);
  });
});
