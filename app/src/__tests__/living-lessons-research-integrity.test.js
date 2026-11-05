// @vitest-environment node
//
// living-lessons research integrity — Trust but Verify (Darrell 2026-07-20, DR-0190).
// The platform teaches external research in its lessons; a claim must be verified,
// tiered, and ATTRIBUTED, never asserted as bare fact on the platform's own
// authority. This is the proven-to-catch gate: if any audience-facing lesson text
// states a hard statistic (a percentage, or "N times/× higher") WITHOUT an
// attributing token somewhere in that lesson, the build fails — so a future lesson
// cannot drop "43% of teams" as if Scripture said it.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

// A hard research-style statistic in audience text. Rhetorical "100%" (e.g. "100%
// His") is exempt — it's devotional emphasis, not a research claim.
const STAT_RE = /\b(?!100\s*%)\d{1,3}(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*(?:times|×|x)\s+(?:higher|more|greater|lower)/i;
// An attributing token that turns an assertion into "the research reports…".
const ATTRIB_RE = /\b(research|resea?rchers|study|studies|reported|reports|found|finding|findings|survey|scientist|data|analysis|peer-reviewed|Aristotle|Edmondson|lab|the article)\b/i;

const audienceText = (m) => [m.bigIdea, m.lesson, m.anchor && m.anchor.theme, ...Object.values(m.levels || {})].filter(Boolean).join('  ');
const fullText = (m) => audienceText(m) + '  ' + JSON.stringify(m.benefits || []) + '  ' + JSON.stringify(m.quiz || {});

describe('Trust but Verify — no bare statistic asserted as fact (DR-0190)', () => {
  it('every lesson that states a statistic ALSO attributes it (research/study/…)', () => {
    const offenders = [];
    for (const m of LIVING_LESSONS_MODULES) {
      const aud = audienceText(m);
      if (STAT_RE.test(aud) && !ATTRIB_RE.test(fullText(m))) {
        offenders.push(`${m.id}: "${(aud.match(STAT_RE) || [])[0]}" stated with no attributing source`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  // ── DR-1326: §5 of DR-0190 gets a gate too ────────────────────────────────
  // DR-0190 §5 has said since 2026-07-20 that a lesson carries "a short
  // trust-but-verify note: what was checked, what tier each claim landed in,
  // and the primary source." Only §3 (a bare statistic) was ever enforced, so a
  // lesson could rest its whole landing on a forwarded publication's factual
  // claims and pass, as long as it quoted no percentage.
  //
  // MEASURED 2026-11-05, which is why this exists: ll281 (DR-1325) was built
  // from a business digest, deliberately figure-free, and passed every gate —
  // while three of its four load-bearing claims failed primary-source checking,
  // and the one its teaching turned on was BACKWARDS. FINRA's own margin table
  // showed the largest one-month DROP in the series where the digest said the
  // borrowing had "reached the highest level ever recorded."
  //
  // Darrell, 2026-11-05: "Lessons are Word first and research independently."
  const DECLARES_FORWARDED_SOURCE = /\b(forwarded (?:into the app|newsletter|digest|article|issue)|a (?:morning )?(?:business )?(?:digest|newsletter) was forwarded|newsletter is not a recording)\b/i;
  const VERIFICATION_NOTE = /\b(trust but verify|primary source|we checked|checked against|verified against|FINRA|filing|earnings release|own release|independent(?:ly)? (?:verif|check)|does not survive|over-claim)/i;
  // The three lessons already on `main` that declare a forwarded source and
  // carry no verification language. Named rather than excused: each needs a
  // read to say whether it repeats an external factual claim at all (ll280
  // refused every figure in its issue, so its note may be one sentence saying
  // so) or whether a real check is owed. `re-review: 2026-11-19`.
  const PRE_EXISTING_WITHOUT_A_NOTE = [
    'll238-who-holds-the-wind-the-warning-the-foundation-and-the-neighbour-in-the-storms-path',
    'll236-the-bill-you-cannot-read-honest-weights-a-plain-reckoning-and-whose-wisdom-governs-the-meter',
    'll280-whose-answer-comes-in-the-night',
  ];

  it('a lesson built from a forwarded publication carries its trust-but-verify note (DR-0190 §5)', () => {
    const offenders = [];
    for (const m of LIVING_LESSONS_MODULES) {
      const aud = audienceText(m);
      if (!DECLARES_FORWARDED_SOURCE.test(aud)) continue;
      if (VERIFICATION_NOTE.test(fullText(m))) continue;
      if (PRE_EXISTING_WITHOUT_A_NOTE.includes(m.id)) continue;
      offenders.push(m.id);
    }
    expect(
      offenders,
      'A forwarded article, newsletter or digest is a LEAD, never the citation (DR-0190 §1). '
      + 'This lesson declares it was built from one and never says what was checked against a '
      + 'primary source, or what tier its claims landed in. Add the note — and if the lesson '
      + 'repeats no external factual claim at all, say THAT in a sentence:\n' + offenders.join('\n'),
    ).toEqual([]);
  });

  it('PROVEN TO CATCH: the ratchet is real, and the three named ones are the only ones excused', () => {
    // The trigger fires on real lessons rather than on nothing — if this count
    // ever drops to zero the matcher has rotted and the gate is decorative.
    const declaring = LIVING_LESSONS_MODULES.filter((m) => DECLARES_FORWARDED_SOURCE.test(audienceText(m)));
    expect(declaring.length, 'no lesson declares a forwarded source — re-anchor this gate').toBeGreaterThanOrEqual(3);
    // Each name on the excuse list is a real module, so the list cannot quietly
    // hold a typo that silently excuses nothing (or everything).
    for (const id of PRE_EXISTING_WITHOUT_A_NOTE) {
      expect(LIVING_LESSONS_MODULES.some((m) => m.id === id), `${id} is not a module — stale excuse`).toBe(true);
    }
    // And a lesson that declares a forwarded source with NO verification
    // language is genuinely caught: fabricate one and require the trigger.
    const fake = { bigIdea: 'A morning business digest was forwarded into the app and it closed on three statements.', lesson: 'x', levels: {} };
    expect(DECLARES_FORWARDED_SOURCE.test(audienceText(fake))).toBe(true);
    expect(VERIFICATION_NOTE.test(fullText(fake))).toBe(false);
  });

  it('PROVEN NOT TO OVER-REACH: a lesson from a recording is never asked for the note', () => {
    const spoken = { bigIdea: 'Bishop Gwin taught this at the weekly study and the recording is the source.', lesson: 'y', levels: {} };
    expect(DECLARES_FORWARDED_SOURCE.test(audienceText(spoken))).toBe(false);
  });

  it('L44 (Safe to Speak) teaches its research attributed — never the un-traceable %-stats as fact', () => {
    const l44 = LIVING_LESSONS_MODULES.find((m) => m.id === 'll44-safe-to-speak-psychological-safety');
    expect(l44, 'L44 must exist').toBeTruthy();
    // It cites the research as a witness (attributed)…
    expect(ATTRIB_RE.test(audienceText(l44))).toBe(true);
    // …and does NOT assert the circulated marketing %-stats that don't trace to a
    // primary source (they were deliberately dropped — DR-0100 tier c).
    for (const stat of ['19%', '31%', '27%', '3.6 times', '43%']) {
      expect(audienceText(l44).includes(stat), `L44 must not assert the un-traceable "${stat}"`).toBe(false);
    }
    // …and it keeps the Word senior (a verse-shaped anchor), not the lab.
    expect(/1 John 4:18|Ephesians 4:15|James 5:16/.test(l44.anchor.ref)).toBe(true);
  });
});
