// =============================================================================
// The builder brief names its outcome, its limits and what to read first
// (DR-0697; LESSONS-LEARNED P67). A spawned session that was sent to run one
// UPDATE began drafting a migration (2026-09-30); a brief without a MUST NOT
// TOUCH line and a READ FIRST line invites exactly that. PROVEN-TO-CATCH: the
// checker is fed the template with each required line removed and must fail.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(process.cwd(), '..');
const TEMPLATE = readFileSync(join(REPO, 'docs', 'templates', 'builder-brief.md'), 'utf8');
const OPERATING_MODEL = readFileSync(join(REPO, 'docs', '00-foundations', '_root', 'ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md'), 'utf8');

const REQUIRED = [
  ['one outcome', /^OUTCOME \(one\):/m],
  ['done-condition', /^DONE WHEN:/m],
  ['must not touch', /^MUST NOT TOUCH:/m],
  ['read first', /^READ FIRST/m],
  ['LESSONS-LEARNED named', /LESSONS-LEARNED\.md/],
  ['decision records named', /docs\/decisions\//],
  ['brakes', /^BRAKES:/m],
  // DR-0726: a moved control keeps its registry entry; nothing is dropped.
  ['features never dropped', /^FEATURES: Moving or restyling a control: update its registry entry's locator; never drop it\./m],
];
export const briefGaps = (text) => REQUIRED.filter(([, re]) => !re.test(text)).map(([name]) => name);

describe('the builder brief template', () => {
  it('carries every required line', () => {
    expect(briefGaps(TEMPLATE)).toEqual([]);
  });

  it('PROVEN-TO-CATCH: each required line removed is reported', () => {
    for (const [name, re] of REQUIRED) {
      const cut = TEMPLATE.split('\n').filter((l) => !re.test(l)).join('\n');
      expect(briefGaps(cut), name).toContain(name);
    }
  });

  it('the orchestration Way sends every builder to the template and to the DRs first', () => {
    expect(OPERATING_MODEL).toMatch(/Before you build: review the DRs/);
    expect(OPERATING_MODEL).toContain('docs/templates/builder-brief.md');
    expect(OPERATING_MODEL).toContain('LESSONS-LEARNED');
  });
});
