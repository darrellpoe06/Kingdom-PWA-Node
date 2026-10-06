// =============================================================================
// A recording that is not a lesson can say so, and stop (DR-0768)
// =============================================================================
// 2026-10-06: Christyn read her homework into the app's recorder -- a school
// passage, seven unnamed voices, no teacher. The recorder had ONE destination,
// so it became a lesson row, and the NAS builder's own gate refused it five
// times with "cli-local structure failed (verdict must be lesson ...)". The
// gate was right; the row was wrong. But `inbox-lesson-tag.yml` could only
// write "shipped as a lesson", which needs a lesson id and a PR that do not
// exist, so there was no way to mark the row done and the builder claimed,
// failed and released it six times in one hour.
//
// This pins the shape of the verdict road rather than its prose: the choices
// offered, the tags each verdict writes, and the four things the validation
// must refuse. The live database is not reachable from a test, so the step's
// shell is read from the workflow file and its branches are asserted.
//
// PROVEN-TO-CATCH: drop the `not-a-lesson` branch from the tag step and "the
// verdict writes the tags that end the loop" fails; make `reason` optional and
// "a verdict with no reason is refused" fails. Both demonstrated in the DR.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const wf = readFileSync(join(root, '.github', 'workflows', 'inbox-lesson-tag.yml'), 'utf8');

describe('the verdict a row can carry', () => {
  it('offers exactly two verdicts, and a lesson stays the default', () => {
    expect(wf).toMatch(/options: \[lesson, not-a-lesson\]/);
    expect(wf).toMatch(/verdict:\s*\n\s*description:[^\n]*\n\s*required: false\n\s*default: lesson/);
  });

  it('asks for the lesson id, the PR and the reason only where each belongs', () => {
    for (const name of ['lesson_id', 'pr', 'reason']) {
      const block = new RegExp(`${name}:\\s*\\n\\s*description: '([^']*)'`);
      const m = block.exec(wf);
      expect(m, `${name} must carry a description saying which verdict it belongs to`).toBeTruthy();
      expect(m[1]).toMatch(/verdict=(not-a-lesson|lesson) only/);
    }
  });
});

describe('the verdict writes the tags that end the loop', () => {
  it('not-a-lesson writes lesson-captured, not-a-lesson and the reason, and no lesson id or PR', () => {
    const branch = /if \[ "\$\{VERDICT:-lesson\}" = not-a-lesson \]; then\n([\s\S]*?)\n\s*else/.exec(wf);
    expect(branch, 'the tag step must branch on the verdict').toBeTruthy();
    const tags = branch[1];
    // lesson-captured is the one every waiting query excludes, so it is what
    // actually stops the claim-fail-release loop.
    expect(tags).toContain('lesson-captured');
    expect(tags).toContain('not-a-lesson');
    expect(tags).toContain('not-a-lesson-reason:$REASON');
    expect(tags, 'a row with no lesson must not claim a lesson id').not.toContain('lesson-id:');
    expect(tags, 'a row with no lesson must not claim a PR').not.toContain('lesson-pr:');
    expect(tags, 'nothing is published when nothing shipped').not.toContain('lesson-published');
  });

  it('the lesson verdict is unchanged: id, PR, and published only when live', () => {
    const branch = /\n\s*else\n([\s\S]*?)\n\s*fi\n/.exec(wf);
    expect(branch).toBeTruthy();
    expect(branch[1]).toContain('lesson-id:$LESSON_ID');
    expect(branch[1]).toContain('lesson-pr:$PR');
    expect(branch[1]).toMatch(/\[ "\$\{LIVE:-no\}" = yes \] && TAGS=.*lesson-published/);
  });

  it('the live check is skipped for a row that shipped nothing', () => {
    expect(wf).toMatch(/if: \$\{\{ \(inputs\.verdict \|\| 'lesson'\) == 'lesson' \}\}/);
    // LIVE is then unset, and `set -u` would abort on a bare $LIVE.
    expect(wf).not.toMatch(/echo "- live: \$LIVE"/);
    expect(wf).toContain('${LIVE:-unknown}');
  });
});

describe('the validation refuses what would hide the truth', () => {
  const start = wf.indexOf('Validate the inputs');
  const validation = [null, wf.slice(start, wf.indexOf('- name:', start))];

  it('reads the validation block', () => {
    expect(start, 'the validate step must be findable').toBeGreaterThan(-1);
    expect(validation[1]).toContain('case "$VERDICT" in');
  });

  it('a verdict with no reason is refused — a row marked done must say why', () => {
    expect(validation[1]).toMatch(/REASON.*=~.*\{9,300\}/);
    expect(validation[1]).toMatch(/reason must be 10-300 characters/);
  });

  it('a not-a-lesson verdict that also claims a lesson id or a PR is refused', () => {
    expect(validation[1]).toMatch(/verdict=not-a-lesson writes no lesson-id/);
    expect(validation[1]).toMatch(/verdict=not-a-lesson writes no lesson-pr/);
  });

  it('a lesson verdict that carries a not-a-lesson reason is refused', () => {
    expect(validation[1]).toMatch(/reason belongs to verdict=not-a-lesson/);
  });

  it('a verdict that is neither is refused rather than defaulted', () => {
    expect(validation[1]).toMatch(/verdict must be lesson or not-a-lesson/);
  });

  it('the reason can carry only characters that are safe to put in a tag', () => {
    const re = /"\$REASON" =~ \^\[A-Za-z0-9\]\[([^\]]*)\]\{9,300\}\$/.exec(validation[1]);
    expect(re, 'the reason must be validated by an explicit allowlist').toBeTruthy();
    const allowed = re[1];
    for (const bad of ['"', "'", '\\\\', ';', '|', '$', '(', ')']) {
      expect(allowed, `a reason must not be able to carry ${bad}`).not.toContain(bad);
    }
  });
});
