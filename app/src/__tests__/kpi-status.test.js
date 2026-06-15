// KPI status-indicator system — the reusable palette + label set behind every
// live KPI dot (build freshness, local-LLM health, workflow + loop health) and
// the Build-board Key. Locks: state -> color/label mapping, the freshness dot
// still resolves green=latest / red=old, and every color clears WCAG 1.4.11
// non-text contrast (>=3:1) on both white and black themes.
import { describe, it, expect } from 'vitest';
import {
  KPI_STATUS, KPI_STATUS_ORDER, KPI_LEGEND, resolveKpiStatus, kpiColor,
} from '../lib/kpi-status.js';
import { freshnessDescriptor } from '../lib/freshness.js';
import { llmHealthKpi } from '../components/LlmHealth.jsx';
import { workflowStatusKpi } from '../components/WorkflowStatus.jsx';
import { LOOP_KPI } from '../components/LoopHealth.jsx';

// --- WCAG relative luminance + contrast (verify, don't eyeball — DR-0076). ---
function relLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a, b) {
  const la = relLuminance(a), lb = relLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

describe('KPI palette — four canonical states', () => {
  it('has exactly the four documented states, in order', () => {
    expect(KPI_STATUS_ORDER).toEqual(['good', 'attention', 'problem', 'idle']);
    expect(Object.keys(KPI_STATUS).sort()).toEqual(['attention', 'good', 'idle', 'problem']);
  });

  it('every state carries a color AND a text label + meaning (never color-only)', () => {
    for (const k of KPI_STATUS_ORDER) {
      const s = KPI_STATUS[k];
      expect(s.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.meaning.length).toBeGreaterThan(0);
    }
  });

  it('the four colors are all distinct', () => {
    const colors = KPI_STATUS_ORDER.map((k) => KPI_STATUS[k].color);
    expect(new Set(colors).size).toBe(4);
  });
});

describe('resolveKpiStatus — canonical keys, synonyms, fallback', () => {
  it('resolves canonical keys to themselves', () => {
    for (const k of KPI_STATUS_ORDER) {
      expect(resolveKpiStatus(k).key).toBe(k);
    }
  });

  it('maps each surface vocabulary to the right bucket', () => {
    const cases = {
      good: ['latest', 'healthy', 'on-track', 'success', 'fresh', 'running', 'loaded'],
      attention: ['stale', 'due-soon', 'pinned', 'warning'],
      problem: ['old', 'blocked', 'overdue', 'error', 'crashed', 'never', 'late'],
      idle: ['n/a', 'no-data', 'waiting', 'never-run', 'unknown', 'offline', 'unreachable'],
    };
    for (const [bucket, words] of Object.entries(cases)) {
      for (const w of words) {
        expect(resolveKpiStatus(w).key).toBe(bucket);
      }
    }
  });

  it('is case-insensitive and trims', () => {
    expect(resolveKpiStatus('  SUCCESS ').key).toBe('good');
    expect(resolveKpiStatus('Overdue').key).toBe('problem');
  });

  it('unknown / null / undefined -> idle (never a misleading green)', () => {
    expect(resolveKpiStatus('wat').key).toBe('idle');
    expect(resolveKpiStatus(null).key).toBe('idle');
    expect(resolveKpiStatus(undefined).key).toBe('idle');
    expect(resolveKpiStatus('').key).toBe('idle');
  });

  it('kpiColor returns the resolved color', () => {
    expect(kpiColor('success')).toBe(KPI_STATUS.good.color);
    expect(kpiColor('error')).toBe(KPI_STATUS.problem.color);
    expect(kpiColor('pinned')).toBe(KPI_STATUS.attention.color);
    expect(kpiColor('offline')).toBe(KPI_STATUS.idle.color);
  });
});

describe('KPI_LEGEND (the Key) — derived from the same source as the dots', () => {
  it('documents all four states in order, matching the palette', () => {
    expect(KPI_LEGEND.map((s) => s.key)).toEqual(KPI_STATUS_ORDER);
    for (const s of KPI_LEGEND) {
      expect(s.color).toBe(KPI_STATUS[s.key].color);
      expect(s.label).toBe(KPI_STATUS[s.key].label);
    }
  });
});

describe('the build-freshness dot still resolves green=latest / red=old', () => {
  it('latest -> good/green', () => {
    const d = freshnessDescriptor(false);
    expect(d.status).toBe('good');
    expect(resolveKpiStatus(d.status).color).toBe('#15803D');
    expect(d.color).toBe('#15803D');
    expect(d.label).toBe('Latest');
  });

  it('update pending (old) -> problem/red with a reload affordance', () => {
    const d = freshnessDescriptor(true);
    expect(d.status).toBe('problem');
    expect(resolveKpiStatus(d.status).color).toBe('#DC2626');
    expect(d.color).toBe('#DC2626');
    expect(d.label).toMatch(/update available/i);
    expect(d.label).toMatch(/reload/i);
  });
});

describe('the converted KPIs map to the shared states', () => {
  it('local-LLM health: pinned->attention, idle/loaded->good, offline->idle', () => {
    expect(llmHealthKpi('ok', { anyPinned: true, loadedCount: 1 }).status).toBe('attention');
    expect(llmHealthKpi('ok', { anyPinned: false, loadedCount: 0 }).status).toBe('good');
    expect(llmHealthKpi('ok', { anyPinned: false, loadedCount: 2 }).status).toBe('good');
    expect(llmHealthKpi('offline', null).status).toBe('idle');
    expect(llmHealthKpi('loading', null).status).toBe('idle');
  });

  it('workflow health: errors->attention, none running->idle, running->good, no data->idle', () => {
    expect(workflowStatusKpi({ recentErrors: 2, active: 5, total: 9 }).status).toBe('attention');
    expect(workflowStatusKpi({ recentErrors: 0, active: 0, total: 9 }).status).toBe('idle');
    expect(workflowStatusKpi({ recentErrors: 0, active: 5, total: 9 }).status).toBe('good');
    expect(workflowStatusKpi(null).status).toBe('idle');
  });

  it('loop health: fresh->good, stale->attention, never->problem', () => {
    expect(LOOP_KPI.fresh).toBe('good');
    expect(LOOP_KPI.stale).toBe('attention');
    expect(LOOP_KPI.never).toBe('problem');
  });
});

describe('WCAG 1.4.11 non-text contrast — every dot legible on every theme', () => {
  // Light themes are all near-white, midnight is pure black — clearing >=3:1
  // against BOTH endpoints covers the full theme range.
  for (const k of KPI_STATUS_ORDER) {
    it(`${k} (${KPI_STATUS[k].color}) clears 3:1 vs white and vs black`, () => {
      expect(contrast(KPI_STATUS[k].color, '#FFFFFF')).toBeGreaterThanOrEqual(3);
      expect(contrast(KPI_STATUS[k].color, '#000000')).toBeGreaterThanOrEqual(3);
    });
  }
});
