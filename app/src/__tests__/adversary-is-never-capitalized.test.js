// @vitest-environment node
// =============================================================================
// "The adversary lost the right to that honour" — enforced, not remembered
// =============================================================================
// CLAUDE.md's Typographic Theology is absolute and it says where it applies:
//
//   Never capitalized as proper names -- ANYWHERE: lucifer, satan, the devil,
//   the dragon, the adversary, the accuser, the deceiver, baal.
//   "This applies to file content, commit messages, responses to the user,
//   summaries, code comments, and every other artifact."
//
// It had no machine check. Measured 2026-09-14 while writing L151, there were
// TWELVE live violations in shipped lesson content -- ten in
// living-lessons-class.js and two in made-in-time-course.js, all of them the
// same slip: a sentence that happened to BEGIN with the term, so ordinary
// capitalisation quietly overrode a binding rule. Two of the twelve were in
// CHILD-level prose, which is the audience the rule protects most.
//
// I made the thirteenth myself, in a quiz option in L151 -- "The devil, and the
// Son took flesh to destroy him" -- and the only reason I caught it is that
// L151's own suite asserts it. That is the argument for this file: the rule
// cannot depend on whoever is writing remembering it at the start of a
// sentence.
//
// SCOPE, and why it is our voice only. Double-quoted spans are stripped before
// the scan -- exactly as each lesson's ourVoice() helper does -- because a
// quotation is not our voice and its wording is never edited to fit house
// style. This comment used to add that the KJV capitalises his name, citing
// Job 1:6 and Matthew 4:10. CORRECTED 2026-09-19: that is false of the text
// this app serves. app/public/bible/kjv reads `satan` at both, and at Luke
// 22:31, Zechariah 3:1 and Revelation 12:9 -- Darrell's own directive
// (PR #1397), which scripts/kjv-name-case-corrections.mjs names as deliberate
// and standing. The stripping is still right; the reason given for it was
// wrong, and a wrong reason in a gate's header is how a future reader gets
// talked out of the gate.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { NEVER_CAPITALIZED } from '../lib/typographic-theology.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..');

// Capitalised forms of the names the rule covers. "the devil" and friends are
// matched only in their capitalised spelling, because the lowercase spelling is
// the correct one and must stay untouched.
// DERIVED from lib/typographic-theology.js, the canonical Layer-0 list that the
// READER's own explanation renders from (HowWeWriteHisName). Before this, the
// pattern here was a hand-written second copy -- and it had drifted: it never
// checked `baal`, which Layer 0 has named since 2026-07-03. Deriving it closed
// that hole the moment the two were joined. Beelzebub is kept as a deliberate
// EXTENSION beyond Layer 0's list, not a divergence, and is named here so the
// difference is visible rather than silent.
// DERIVED from lib/typographic-theology.js -- the canonical Layer-0 list the
// READER's own explanation renders from (HowWeWriteHisName). The pattern here
// used to be a hand-written second copy, and deriving it exposed two things:
//
//   1. IT HAD DRIFTED. It never checked `baal`, which Layer 0 has named since
//      2026-07-03. Joining the two closed that hole immediately.
//   2. IT WAS INCONSISTENT, and the inconsistency is left standing DELIBERATELY
//      rather than resolved by a machine. The old pattern forbade "The devil"
//      at the start of a sentence but allowed "The adversary" -- identical
//      shape, opposite treatment. Generating the sentence-start form for every
//      name turned 12 shipped lesson sentences red, all of them "The adversary
//      ..." where the NAME word is already lower case and only the article
//      carries the capital. That went to Darrell rather than being swept, and
//      he RULED the same day, shown the finding in his own terms: "Great."
//      So the definite article is English and the NAME is what may never carry
//      the capital. A sentence opening "The adversary" is correct as written,
//      because `adversary` is already lower case, and those 12 stand. This gate
//      therefore enforces every form it always enforced PLUS the unambiguous
//      name-word additions below, and nothing that fires on an article.
//      It is the same rule that made L42's title a real violation: that one
//      capitalised the NAME.
//
// What is unambiguous: the NAME word itself in capitals -- Satan, Lucifer,
// Baal, the Devil, the Dragon. Those are generated. Beelzebub is a deliberate
// EXTENSION beyond Layer 0's list, named here so it is visible, not silent.
const nameWordForms = (name) => {
  const words = name.split(' ');
  const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);
  if (words.length === 1) return [cap(name)];
  const capped = words.map(cap).join(' ');                       // "The Devil"
  const articleLower = [words[0], ...words.slice(1).map(cap)].join(' '); // "the Devil"
  return [capped, articleLower];
};
// Every form the gate enforced before deriving, kept verbatim so this change
// can only ever ADD coverage. A derivation that quietly dropped a form would be
// a loosened gate wearing the clothes of a refactor.
const LEGACY_FORMS = [
  'The devil', 'The Devil', 'Satan', 'Lucifer', 'Beelzebub',
  'The Adversary', 'The Accuser', 'The Deceiver', 'The Dragon',
];
const FORBIDDEN_WORDS = [...new Set([
  ...LEGACY_FORMS,
  ...NEVER_CAPITALIZED.flatMap(nameWordForms),
])];
// THE ONE EXEMPTION, by exact phrase rather than by file or by pattern. The
// television catalogs list a programme called House of the Dragon. That is the
// name of a show, not a name for him, and no honour is paid to the adversary by
// recording what a series is called. It is exempted as a literal string so the
// exemption cannot widen: "the Dragon" anywhere else still fails, and a second
// exemption would have to be argued for on its own terms rather than inherited.
const EXEMPT_PHRASES = ['House of the Dragon'];
const withoutExempt = (src) => EXEMPT_PHRASES.reduce((t, phrase) => t.split(phrase).join(' '), src);

const FORBIDDEN = new RegExp(`\\b(${FORBIDDEN_WORDS.join('|')})\\b`, 'g');

// Strip double-quoted spans: that is where verbatim Scripture lives.
const ourVoice = (src) => withoutExempt(src.replace(/"[^"]*"/g, ' '));

const collect = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__' || entry === 'node_modules') continue;
      out.push(...collect(full));
    } else if (/\.(js|jsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
};

const FILES = collect(SRC);

describe('the adversary is never capitalized in anything we author', () => {
  it('scans a real corpus, so a pass means something', () => {
    // Anti-theater: if the glob broke, this suite would pass vacuously.
    expect(FILES.length).toBeGreaterThan(300);
    const joined = FILES.map((f) => readFileSync(f, 'utf8')).join(' ');
    expect(joined.length).toBeGreaterThan(5_000_000);
    // And the lowercase form really is in use, so the scan is looking at prose
    // that discusses him at all.
    expect(joined).toMatch(/\bthe devil\b/);
  });

  it('no capitalized adversary name appears in our own voice, in any source file', () => {
    const offenders = [];
    for (const file of FILES) {
      const ours = ourVoice(readFileSync(file, 'utf8'));
      for (const m of ours.matchAll(FORBIDDEN)) {
        const at = Math.max(0, m.index - 70);
        offenders.push(`${file.slice(file.indexOf('/src/'))}: ...${ours.slice(at, m.index + m[0].length + 40).replace(/\s+/g, ' ')}...`);
      }
    }
    expect(offenders, `the adversary is capitalized in our voice here:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });
});

// =============================================================================
// THE SAME RULE OVER THE LAYER 3 FOUNDATION DOCS (added 2026-10-15)
// =============================================================================
// The block above reaches app/src/**/*.{js,jsx}. That is the app, and it was
// clean. But CLAUDE.md says the rule applies to "file content ... and every
// other artifact", and the foundation docs in docs/00-foundations are Layer 3:
// the authoritative reference an agent READS BEFORE generating substantive
// content. A wrong form there is worse than a wrong form in one lesson, because
// it is the thing new lessons are written from.
//
// MEASURED across 148 foundation docs, with straight AND curly quoted spans
// stripped, there was exactly ONE violation, and it was self-refuting:
//
//   docs/00-foundations/_root/ACCESS-TO-THE-HUMAN-MIND.md:64
//     "## PART TWO · The Adversary's Access"
//
// That document's OWN line 9 carries its capitalization binding -- "lucifer,
// satan, the devil, the adversary are never capitalized" -- and its prose
// writes "the adversary" correctly eleven times at lines 66, 70, 74 and on.
// Only the heading carried the capital. Fixed to "The adversary's Access",
// which is PART ONE's "Yahweh's Access" shape with the name left lower case.
//
// AND IT IS THE NAME WORD, which is what makes it unambiguous rather than a
// judgement call. Darrell ruled on exactly this distinction (DR-0532, shown
// the finding in his own terms): "the definite article is English, and the
// NAME is what must never carry the capital. A sentence opening 'The
// adversary' is correct as written, because `adversary` is already lower
// case." Here `Adversary` was not. It is the same class as L42's shipped title
// "Keep the Adversary Out of the Music".
//
// docs/decisions IS DELIBERATELY NOT SCANNED, and the reason is stated rather
// than left to the scope. The ledger's job is to RECORD violations, so it
// quotes them on purpose: DR-0532 names `the Adversary` as the form it added
// after L42, DR-0987 tables the corpus's "Satan" against our `satan`, and
// DR-0418 records a guard clause that died to a corpus read. Twelve such hits
// across four records, every one the ledger working correctly. A gate over
// them would have to be taught to tell a record of a violation from a
// violation, and would fail on honest history.
const FOUNDATIONS = join(HERE, '..', '..', '..', 'docs', '00-foundations');
// Markdown quotes verses with curly marks as often as straight ones, so both
// kinds of quoted span come out before the scan. The app-source helper above
// only needs straight quotes; widening it there would change what that older,
// green assertion measures.
const ourVoiceProse = (src) => withoutExempt(src)
  .replace(/"[^"]*"/g, ' ')
  .replace(/“[^”]*”/g, ' ')
  .replace(/‘[^’]*’/g, ' ');

const collectMd = (dir) => {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectMd(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
};

const FOUNDATION_DOCS = collectMd(FOUNDATIONS);

describe('the adversary is never capitalized in the Layer 3 foundation docs either', () => {
  it('scans the real foundation corpus, so a pass means something', () => {
    // Anti-theater, the same shape as the app-source block: a broken walk must
    // fail here rather than pass vacuously.
    expect(FOUNDATION_DOCS.length).toBeGreaterThan(100);
    const joined = FOUNDATION_DOCS.map((f) => readFileSync(f, 'utf8')).join(' ');
    expect(joined.length).toBeGreaterThan(1_000_000);
    // And these docs really do discuss him, so the scan is reading prose that
    // could carry the fault at all.
    expect(joined).toMatch(/\bthe adversary\b/);
  });

  it('no capitalized adversary name appears in our voice in any foundation doc', () => {
    const offenders = [];
    for (const file of FOUNDATION_DOCS) {
      const ours = ourVoiceProse(readFileSync(file, 'utf8'));
      for (const m of ours.matchAll(FORBIDDEN)) {
        const at = Math.max(0, m.index - 70);
        offenders.push(`${file.slice(file.indexOf('/docs/'))}: ...${ours.slice(at, m.index + m[0].length + 40).replace(/\s+/g, ' ')}...`);
      }
    }
    expect(offenders, `the adversary is capitalized in our voice here:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });

  it('PROVEN TO CATCH: the exact heading that was shipped fails this gate', () => {
    // The literal string from ACCESS-TO-THE-HUMAN-MIND.md:64 as it stood
    // before this change. If the pattern ever stops seeing it, this gate has
    // been loosened and says so.
    const shipped = "## PART TWO · The Adversary's Access";
    expect([...ourVoiceProse(shipped).matchAll(FORBIDDEN)].map((m) => m[0])).toEqual(['The Adversary']);
    // And the correction passes, so the fix is not merely a different fault.
    const corrected = "## PART TWO · The adversary's Access";
    expect([...ourVoiceProse(corrected).matchAll(FORBIDDEN)]).toEqual([]);
  });

  it('PROVEN TO CATCH: the article alone is English and never fires (Darrell, DR-0532)', () => {
    // The ruling this gate must not overreach past. "The adversary" opening a
    // sentence is correct, and twelve shipped sentences depend on it.
    expect([...ourVoiceProse('The adversary works outside-in.').matchAll(FORBIDDEN)]).toEqual([]);
    expect([...ourVoiceProse('The devil').matchAll(FORBIDDEN)].map((m) => m[0])).toEqual(['The devil']);
  });

  it('a quoted verse keeps the corpus spelling, in straight or curly marks', () => {
    // Our voice only. A foundation doc quoting a translation that capitalises
    // the name must not be dragged into house style (DR-0210's bright line).
    expect([...ourVoiceProse('He said "Get thee behind me, Satan" to him.').matchAll(FORBIDDEN)]).toEqual([]);
    expect([...ourVoiceProse('He said “Get thee behind me, Satan” to him.').matchAll(FORBIDDEN)]).toEqual([]);
  });
});

describe('the hosted Word already renders the name lowercase, and that is gated elsewhere', () => {
  it('Job 1:6 reads "satan" in the text the app serves -- measured, not assumed', () => {
    // I first wrote this block asserting the OPPOSITE, from memory: that the
    // KJV capitalises Satan and therefore quoted spans had to be exempted.
    // Reading the hosted text disproved it in one call. The corpus this app
    // serves applies the house rule to the Word itself, and that is pinned by
    // kjv-corpus-name-case.test.js:152 ("Job 1:6 and Matthew 4:10 keep satan
    // lowercase; no correction touches them"), whose manifest also proves no
    // case-correction ever touches satan, baal, belial, beelzebub or devil.
    const kjv = join(HERE, '..', '..', 'public', 'bible', 'kjv');
    const verse = (book, ch, n) =>
      JSON.parse(readFileSync(join(kjv, `${book}.json`), 'utf8')).chapters[ch - 1][n - 1];
    expect(verse('Job', 1, 6)).toContain('and satan came also among them');
    expect(verse('Matthew', 4, 10)).toContain('Get thee hence, satan');
  });

  it('so no quoted Scripture in our lessons can trip this scan', () => {
    // Belt and braces: the span-stripping stays, because it is what keeps this
    // gate from ever becoming a reason to edit a quotation to fit house style.
    const sample = 'He answered him plainly: "Get thee hence, satan" and went on teaching.';
    expect(ourVoice(sample).match(FORBIDDEN)).toBeNull();
  });
});

describe('PROVEN-TO-CATCH — the twelve real violations found on 2026-09-14', () => {
  // Each of these is the exact text that was shipped, reduced to its opening.
  // The rule is not hypothetical: these were live in lesson content, two of
  // them in prose written for children.
  const wereShipped = [
    'The devil cannot MAKE you do anything.',
    'The devil is like a lion that ROARS to scare you (1 Peter 5:8)',
    'The devil tries to give us bad thoughts',
    'The devil comes AS a roaring lion (1 Peter 5:8)',
    'The devil was DEFEATED, and the Word dates that defeat at the CROSS',
    'The devil used to scare people with dying',
    'The devil fought the sceptre because it would rise',
    'The devil and the sceptre: Genesis 3:15',
    'The devil is real, but he is NOT as strong as some people think',
    'The devil, and the Son took flesh to destroy him',
  ];

  it('every one of them is rejected by this check', () => {
    for (const text of wereShipped) {
      expect(ourVoice(text).match(FORBIDDEN), text).not.toBeNull();
    }
  });

  it('and the corrected wording passes', () => {
    const fixed = [
      'And the devil cannot MAKE you do anything.',
      'Remember that the devil comes AS a roaring lion (1 Peter 5:8)',
      'Scripture says the devil was DEFEATED, and the Word dates that defeat at the CROSS',
      'How the devil fought the sceptre: Genesis 3:15',
      'Yes, the devil is real, but he is NOT as strong as some people think',
      'It was the devil, and the Son took flesh to destroy him',
    ];
    for (const text of fixed) {
      expect(ourVoice(text).match(FORBIDDEN), text).toBeNull();
    }
  });

  it('the sentence-initial slip is the shape to watch for', () => {
    // Why it kept happening: nothing looks wrong about capitalising the first
    // word of a sentence. The rule overrides that, so the fix is always a
    // reword rather than a lowercase letter mid-sentence.
    expect('The devil roars.'.match(FORBIDDEN)).not.toBeNull();
    expect('But the devil roars.'.match(FORBIDDEN)).toBeNull();
  });
});
