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
// SCOPE, and why it is our voice only. Quoted Scripture is fetched verbatim and
// the KJV capitalises Satan (Job 1:6, Matthew 4:10). DR-0076's bright line
// forbids editing a quotation to fit house style, so double-quoted spans are
// stripped before the scan -- exactly as each lesson's ourVoice() helper does.
// The rule governs what WE author; the Word is never touched.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..');

// Capitalised forms of the names the rule covers. "the devil" and friends are
// matched only in their capitalised spelling, because the lowercase spelling is
// the correct one and must stay untouched.
const FORBIDDEN = /\b(The devil|The Devil|Satan|Lucifer|Beelzebub|The Adversary|The Accuser|The Deceiver|The Dragon)\b/g;

// Strip double-quoted spans: that is where verbatim Scripture lives.
const ourVoice = (src) => src.replace(/"[^"]*"/g, ' ');

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
