// =============================================================================
// A QUOTATION ENDS WHERE THE VERSE ENDS — a shrink-only ratchet
// =============================================================================
// Added 2026-09-17 during the DR-0418 pass, after 222 occurrences were made
// verbatim in a single sweep.
//
// THE RULE IS NOT NEW AND WAS NOT MINE TO DECIDE. CLAUDE.md already binds it:
// quoted KJV is "fetched verbatim and left EXACTLY as written." There is no
// carve-out letting terminal punctuation adapt to the host sentence. I had
// spent several lessons treating this as an undecided standard and surfacing it
// as a question -- while simultaneously applying the strict reading to every
// lesson I gated. Applying a binding rule to eight lessons and calling it open
// for the other 157 was the inconsistency, not the fix.
//
// WHAT WAS WRONG, MEASURED. A quoted span whose text matches the corpus but
// whose closing punctuation does not: `"...to profit withal,"` where the verse
// carries no comma there, `"...the obedience of Christ."` where it carries a
// semicolon and continues, `"Prove all things,"` for `Prove all things;`. 285
// such spans existed. The mark belonged to OUR sentence, not to the verse, and
// it was sitting inside the quotation marks claiming to be the Word's.
//
// THE FIX, AND WHY IT IS SAFE. The host sentence's mark moves OUTSIDE the
// closing quote. Nothing about the rendering changes for a reader; the
// quotation simply becomes verbatim. Applied in three scoped passes -- spans of
// five words or more, then spans with a verse reference standing beside them,
// then spans of three words or more -- 222 occurrences in total, with the full
// suite green after each. Every per-lesson pinned-fragment gate in the catalog
// passed unchanged, which is the evidence that no quotation lost its substance.
//
// WHAT REMAINS, AND WHY IT IS NOT ZERO. 55 spans, of two kinds:
//
//   (a) OUR OWN short dialogue and names -- "Fine.", "Marv,", "Ada,", "best,",
//       "do more.", "I know." Their punctuation is correct as it stands. They
//       appear here only because stripping a mark from a one- or two-word
//       phrase happens to match somewhere in 28,737 spans of corpus text. This
//       is the coincidence weakness this pass has recorded three times now
//       (L99's "when" and "watch", L100's "some say"), measured at scale.
//
//   (b) Scripture fragments inside an ELLIPSIS-JOINED quoted region --
//       "Take therefore no thought for the morrow.", "an angel touched him, and
//       said unto him, Arise and eat,". The mark sits mid-region, so a
//       span-level replace cannot target it; each needs a per-case edit of the
//       surrounding quotation. That is real remaining work, not a judgment
//       call, and the ratchet keeps it visible.
//
// So this gate does not assert zero. It asserts that the number never grows,
// which is what makes the 222 a floor rather than a moment.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import baseline from '../lib/quoted-terminal-baseline.json';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');

const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all;
})();

const spansOf = (text) => {
  const at = [...text.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(text.slice(at[i] + 1, at[i + 1]));
  return out;
};

const strings = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out));
  return out;
};

const findTerminalDrifts = () => {
  const found = {};
  for (const module of LIVING_LESSONS_MODULES) {
    const hits = new Set();
    for (const text of strings(module)) {
      for (const span of spansOf(text)) {
        for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
          if (KJV_FLOW.includes(part)) continue;
          const stripped = part.replace(/[.,;:!?]+$/, '');
          if (stripped !== part && KJV_FLOW.includes(stripped)) hits.add(part);
        }
      }
    }
    if (hits.size) found[module.id] = [...hits].sort();
  }
  return found;
};

describe('a quotation ends where the verse ends (ratchet)', () => {
  const found = findTerminalDrifts();

  it('NOTHING NEW lands — every instance is one the baseline already records', () => {
    const unrecorded = [];
    for (const [id, spans] of Object.entries(found)) {
      const known = baseline.byLesson[id] || [];
      for (const span of spans) if (!known.includes(span)) unrecorded.push({ id, span });
    }
    const report = unrecorded.map((u) => ` - ${u.id}\n     ${JSON.stringify(u.span.slice(0, 90))}`).join('\n');
    expect(
      unrecorded,
      `NEW quoted span whose terminal punctuation is not the verse's. Put the host sentence's mark OUTSIDE the closing quote:\n${report}`,
    ).toEqual([]);
  });

  it('the count only shrinks', () => {
    const total = Object.values(found).reduce((a, b) => a + b.length, 0);
    expect(total, 'more instances than the baseline records').toBeLessThanOrEqual(baseline.distinctSpans);
    expect(baseline.distinctSpans, 'the baseline itself may not grow').toBeLessThanOrEqual(55);
  });

  it('is PROVEN-TO-CATCH — on the real forms this sweep corrected', () => {
    expect(KJV_FLOW.includes('given to every man to profit withal')).toBe(true);
    expect(KJV_FLOW.includes('given to every man to profit withal,')).toBe(false);
    expect(KJV_FLOW.includes('bringing into captivity every thought to the obedience of Christ')).toBe(true);
    expect(KJV_FLOW.includes('bringing into captivity every thought to the obedience of Christ.')).toBe(false);
    expect(KJV_FLOW.includes('Prove all things;')).toBe(true);
    expect(KJV_FLOW.includes('Prove all things,')).toBe(false);
  });

  it('names the coincidence weakness it cannot solve, rather than implying precision', () => {
    // A one- or two-word span matches the corpus by accident, not by quotation.
    // These are OUR dialogue and their punctuation is right; the detector simply
    // cannot tell. Asserting the coincidence keeps the limit honest and visible.
    for (const ours of ['Fine', 'Marv', 'best', 'do more']) {
      expect(KJV_FLOW.includes(ours), `coincidental corpus match: ${ours}`).toBe(true);
    }
  });
});
