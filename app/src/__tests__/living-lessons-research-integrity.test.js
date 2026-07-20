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
