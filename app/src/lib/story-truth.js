// =============================================================================
// A PARABLE IS NEVER A RECORD (DR-0811; Darrell 2026-10-07, reading L40 on a
// tablet: "This is a story that had my family name in it and it's not actually
// true... however if you didn't know me you would believe it... I want this to
// be explained so my actual life narrative or my testimony is what it actually
// is... not made up... balanced.")
//
// The data already told the two kinds apart (PARABLE-AND-TESTIMONY-METHOD,
// DR-0215): `kind: 'parable'` is an imagined scene that teaches, `kind:
// 'testimony'` a real, lived, consented account with a source. The page did not
// say so: a parable was headed only "Picture this", and one parable carried the
// family's real surname. A reader who knew the family would take it for their
// history. The label is a truth commitment (DR-0076), so it is now said in
// words on every surface, and a parable may not wear a real name.
// =============================================================================

/** Names that belong to real people and a real family here; a parable never carries them. */
export const REAL_NAMES = Object.freeze(['Poe', 'PoeTech', 'Darrell']);

export const PARABLE_WORD = 'a parable';
export const TESTIMONY_WORD = 'a true story';

/** The heading a story gets: the kind is said in words, then the title. */
export function storyHeading(story) {
  const s = story || {};
  const kind = s.kind === 'testimony' ? `A true story, ${TESTIMONY_WORD === 'a true story' ? 'lived' : TESTIMONY_WORD}` : `Picture this, ${PARABLE_WORD}`;
  const title = s.title ? ` — ${s.title}` : '';
  const source = s.kind === 'testimony' && s.source ? ` · ${s.source}` : '';
  return `${kind}${title}${source}`;
}

/** The one line under a story that says what it is, in plain words. */
export function storyFootnote(story) {
  const s = story || {};
  if (s.kind === 'testimony') {
    return `A true story: this happened, told with ${s.source ? `${s.source}'s` : "the person's"} consent.`;
  }
  return 'A parable, not a record: an imagined scene that pictures the verse, the way Jesus taught (Matthew 13:34). The people and the family in it are not real. A real account is marked "A true story" with the person\'s name.';
}

/**
 * Every story object in a source file's text, as [{kind, title, body, at}].
 * Reads both shapes the courses use: the JSON row ({"kind":"parable","title":"…","body":"…"})
 * and the object literal (kind: 'parable', title: '…', body: '…'). Pure.
 */
export function storiesInSource(text) {
  const src = String(text || '');
  const kindRe = /\bkind["']?\s*:\s*(["'])(parable|testimony)\1/g;
  const marks = [];
  let m;
  while ((m = kindRe.exec(src))) marks.push({ at: m.index, kind: m[2] });
  const field = (slice, name) => {
    const re = new RegExp(`\\b${name}["']?\\s*:\\s*(["'])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`);
    const f = re.exec(slice);
    return f ? f[2].replace(/\\(["'\\])/g, '$1') : '';
  };
  return marks.map((mk, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].at : src.length;
    const slice = src.slice(mk.at, end);
    return { kind: mk.kind, title: field(slice, 'title'), body: field(slice, 'body'), at: mk.at };
  });
}

/** Parables that carry a real name: [{title, name}]. Testimonies may name real people; parables may not. */
export function realNamesInParables(text, names = REAL_NAMES) {
  const out = [];
  for (const st of storiesInSource(text)) {
    if (st.kind !== 'parable') continue;
    for (const name of names) {
      const re = new RegExp(`(^|[^A-Za-z])${name}(?![A-Za-z])`);
      if (re.test(st.title) || re.test(st.body)) out.push({ title: st.title, name });
    }
  }
  return out;
}
