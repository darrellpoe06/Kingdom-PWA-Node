// @vitest-environment node
// The two pipeline registries must agree — JS and the database function.
// =============================================================================
// THE INCIDENT THIS EXISTS FOR (Shay, 2026-09-13, on behalf of a real customer).
// Sterling Moore created an account, filled in the Moore Divahs order inquiry on
// poetech.us, pressed Send, and got "Could not send right now — please try again
// in a moment." Trying again could never have worked.
//
// crm_capture_lead() allowlists the pipeline in a CASE and ends in RAISE
// EXCEPTION for anything unknown. That allowlist carried SEVEN pipelines;
// crm-engine.js defines EIGHT. The missing one was 'moore-orders' — exactly the
// pipeline the Moore door's order form submits. Every order inquiry since that
// door shipped raised "unknown pipeline moore-orders". crm_leads held zero rows.
//
// WHY THE EXISTING TESTS PASSED ANYWAY, which is the whole reason for this file.
// moore-door.test.js calls getPipeline('moore-orders') and validateCapture(
// 'moore-orders', ...) and both pass — because both read the JAVASCRIPT
// registry. The database's allowlist is a SECOND registry, hand-written in SQL,
// and nothing compared them. The tests agreed with themselves while the server
// refused every submission.
//
// So this gate does the one thing those tests could not: it reads BOTH
// registries and requires them to match. A pipeline the door can submit and the
// function would refuse fails the build here, before a customer ever meets it.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIPELINES } from '../lib/crm-engine.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto');

// The LIVE definition is the last migration that defines crm_capture_lead —
// migrations replay in order, so the highest-numbered one wins. Reading "the
// last definition" rather than a pinned filename is deliberate: a future
// migration that redefines the function is picked up automatically instead of
// leaving this gate pointed at a stale copy.
function liveCaptureLeadSql() {
  const files = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  let latest = null;
  for (const f of files) {
    const body = readFileSync(join(MIGRATIONS, f), 'utf8');
    if (/CREATE OR REPLACE FUNCTION public\.crm_capture_lead/.test(body)) latest = { file: f, body };
  }
  return latest;
}

// Pull the allowlisted pipeline names out of the CASE, ignoring comments so a
// name merely MENTIONED in prose never counts as implemented.
function sqlPipelines(body) {
  const code = body
    .split('\n')
    .map((line) => {
      const i = line.indexOf('--');
      return i === -1 ? line : line.slice(0, i);
    })
    .join('\n');
  const caseBlock = code.slice(code.indexOf('CASE p_pipeline'), code.indexOf('END CASE'));
  return [...caseBlock.matchAll(/WHEN\s+'([a-z0-9-]+)'/gi)].map((m) => m[1]);
}

describe('crm_capture_lead — the JS registry and the SQL allowlist agree', () => {
  it('a migration defining the function exists and is readable', () => {
    const live = liveCaptureLeadSql();
    expect(live, 'no migration defines crm_capture_lead').toBeTruthy();
    expect(sqlPipelines(live.body).length).toBeGreaterThan(0);
  });

  it('EVERY pipeline the app can submit is accepted by the function', () => {
    // This is the assertion that would have caught Sterling's bug on the day
    // the Moore door shipped. A pipeline the UI can send and the database
    // refuses is a form that silently cannot work.
    const live = liveCaptureLeadSql();
    const inSql = new Set(sqlPipelines(live.body));
    const missing = Object.keys(PIPELINES).filter((k) => !inSql.has(k));
    expect(
      missing,
      `pipelines defined in crm-engine.js but REFUSED by crm_capture_lead (${live.file}):\n  ${missing.join('\n  ')}\n`
        + 'Every one of these is a form that fails for a real person with a retry message that can never succeed.',
    ).toEqual([]);
  });

  it('the function allowlists nothing the app does not define', () => {
    // The other direction. A pipeline in SQL with no JS definition is dead
    // surface at best and a route into a business nobody models at worst.
    const live = liveCaptureLeadSql();
    const known = new Set(Object.keys(PIPELINES));
    const extra = sqlPipelines(live.body).filter((p) => !known.has(p));
    expect(extra, `allowlisted in SQL but undefined in crm-engine.js:\n  ${extra.join('\n  ')}`).toEqual([]);
  });

  it('moore-orders specifically is accepted — the one that cost a real order', () => {
    const live = liveCaptureLeadSql();
    expect(sqlPipelines(live.body)).toContain('moore-orders');
    expect(Object.keys(PIPELINES)).toContain('moore-orders');
  });

  it('the business and sequence the function assigns match the JS definition', () => {
    // Parity of NAMES is not enough: a pipeline routed to the wrong business or
    // nurture sequence lands the lead where nobody looks for it.
    const live = liveCaptureLeadSql();
    const code = live.body;
    for (const [key, def] of Object.entries(PIPELINES)) {
      const branch = new RegExp(
        `WHEN\\s+'${key}'\\s+THEN\\s+v_business\\s*:=\\s*'([a-z0-9-]+)'\\s*;\\s*v_stage\\s*:=\\s*'([a-z0-9-]+)'\\s*;\\s*v_seq\\s*:=\\s*'([a-z0-9-]+)'`,
        'i',
      ).exec(code);
      expect(branch, `no readable branch for ${key}`).toBeTruthy();
      const [, business, stage, seq] = branch;
      expect(business, `${key}: business`).toBe(def.business);
      expect(stage, `${key}: first stage`).toBe(def.stages[0]);
      expect(seq, `${key}: nurture sequence`).toBe(def.sequenceKey);
    }
  });

  it('the unknown-pipeline branch still raises rather than silently inserting', () => {
    // The allowlist is a wall, not a suggestion. If the ELSE ever became a
    // default instead of an exception, a typo in the UI would write a lead into
    // an unmodelled business instead of failing loudly.
    const live = liveCaptureLeadSql();
    expect(live.body).toMatch(/ELSE\s+RAISE EXCEPTION 'crm_capture_lead: unknown pipeline/);
  });
});

describe('the door tells the truth when a capture fails', () => {
  const src = readFileSync(join(HERE, '..', 'components', 'MooreDoor.jsx'), 'utf8');

  it('never tells a customer to retry a failure that may be permanent', () => {
    // The original line was "Could not send right now — please try again in a
    // moment." Sterling followed that instruction against a cause that could
    // not improve by waiting. Retry advice is only honest when retrying can work.
    expect(src).not.toMatch(/please try again in a moment/i);
  });

  it('says plainly that it did not reach her', () => {
    expect(src).toMatch(/did not send/i);
    expect(src).toMatch(/has not received it/i);
  });

  it('tells the customer their typing is not lost, and does not clear the form', () => {
    expect(src).toMatch(/nothing you typed is lost/i);
    // The error branch must not reset the field state — losing a written-out
    // custom order request is its own injury on top of the failure.
    expect(src).not.toMatch(/setState\('error'\);\s*setF\(/);
  });

  it('does NOT invent a contact channel for her', () => {
    // business-registry.js: brand carries no email on purpose (#675, sign-in
    // only, never rendered). A fallback that publishes her address would fix
    // one problem by breaking a standing decision.
    const errorBlock = src.slice(src.indexOf("state === 'error'"), src.indexOf("state === 'error'") + 700);
    expect(errorBlock).not.toMatch(/@/);
    expect(errorBlock).not.toMatch(/mailto:/);
  });

  it('logs the real reason for whoever reads a screenshot', () => {
    expect(src).toMatch(/console\.warn\('\[capture\] inquiry not sent:'/);
  });
});
