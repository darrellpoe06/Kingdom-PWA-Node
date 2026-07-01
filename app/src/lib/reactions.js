// =============================================================================
// reactions — the reusable in-app reaction primitive (PURE registry + ranking).
// =============================================================================
// Darrell 2026-07-01: in-app reactions are PoeTech's own reaction palette — the
// PRIMARY engagement + ranking signal (YouTube public stats are a secondary
// display, never the source). Social-media style: a person taps ONE reaction on
// a piece of content; tapping it again removes it; switching replaces it cleanly.
//
// TWO layers of meaning:
//   1. Engagement/ranking — content ranks by its in-app reactions (deterministic).
//   2. QUALITATIVE reception — the "Images of the Godhead" reactions carry meaning
//      (how the Word LANDED: lamb = humbled/convicted, lion = emboldened, dove =
//      given peace...). `receptionSignal` folds that into the Quality/feedback
//      qualitative read (the feedback lane consumes it).
//
// The set is the green-lit "Images of the Godhead" palette (three groupings —
// Son / Spirit / Father-Triune), each Scripture-ANCHORED so it self-explains
// (the verse shows on tap/hover), PLUS the plainer like / love / thumbs up-down.
// Reverent, on-brand, non-denominational, Word-anchored — NOT gimmicky.
//
// EXTENSIBLE: add a reaction by adding ONE entry here (+ its icon in
// components/ReactionIcon.jsx). REUSABLE: this primitive is content-agnostic —
// the same set reacts to sermons, studies, songs, posts, and family/financial
// decisions (content_type distinguishes them).
//
// SCRIPTURE (SCRIPTURE-REFERENCE-STANDARD): the verse text is KJV — PUBLIC DOMAIN,
// so it is safe to embed at this scale (ESV would require licensing). Each text
// was FETCHED verbatim, never paraphrased (DR-0076 — real text, not from memory).
//
// PURE + import-free -> safe in Node + browser + tests; the ranking is verifiable
// in isolation. Supabase wiring lives in reactions-sync.js; the control in
// components/ReactionBar.jsx.
// =============================================================================

// group: 'plain' | 'son' | 'spirit' | 'father'. icon = the ReactionIcon name.
// weight = ranking contribution of one such reaction (in-app is primary). receives
// = the one-line "how it landed" reading fed to the qualitative signal. scripture
// = { ref, text } (KJV, public domain), shown on tap — the self-explaining anchor.
export const REACTIONS = [
  // ── plain set (familiar, fast) ──────────────────────────────────────────
  { key: 'like',        label: 'Like',        icon: 'like',        group: 'plain', weight: 2, receives: 'appreciated' },
  { key: 'love',        label: 'Love',        icon: 'love',        group: 'plain', weight: 3, receives: 'loved' },
  { key: 'thumbs-up',   label: 'Amen',        icon: 'thumbs-up',   group: 'plain', weight: 2, receives: 'affirmed' },
  { key: 'thumbs-down', label: 'Wrestling',   icon: 'thumbs-down', group: 'plain', weight: -1, receives: 'wrestling with it' },

  // ── SON — images of Christ ──────────────────────────────────────────────
  { key: 'lion',     label: 'Lion of Judah',      icon: 'lion',     group: 'son', weight: 3, receives: 'emboldened',
    scripture: { ref: 'Revelation 5:5', text: 'And one of the elders saith unto me, Weep not: behold, the Lion of the tribe of Juda, the Root of David, hath prevailed to open the book, and to loose the seven seals thereof.' } },
  { key: 'lamb',     label: 'Lamb of God',        icon: 'lamb',     group: 'son', weight: 3, receives: 'humbled / convicted',
    scripture: { ref: 'John 1:29', text: 'The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world.' } },
  { key: 'crown',    label: 'King of kings',      icon: 'crown',    group: 'son', weight: 3, receives: 'moved to worship',
    scripture: { ref: 'Revelation 19:12', text: 'His eyes were as a flame of fire, and on his head were many crowns; and he had a name written, that no man knew, but he himself.' } },
  { key: 'bread',    label: 'Bread of Life',      icon: 'bread',    group: 'son', weight: 3, receives: 'fed / nourished',
    scripture: { ref: 'John 6:35', text: 'And Jesus said unto them, I am the bread of life: he that cometh to me shall never hunger; and he that believeth on me shall never thirst.' } },
  { key: 'vine',     label: 'True Vine',          icon: 'vine',     group: 'son', weight: 3, receives: 'abiding / connected',
    scripture: { ref: 'John 15:1', text: 'I am the true vine, and my Father is the husbandman.' } },
  { key: 'water',    label: 'Living Water',       icon: 'water',    group: 'son', weight: 3, receives: 'refreshed',
    scripture: { ref: 'John 7:38', text: 'He that believeth on me, as the scripture hath said, out of his belly shall flow rivers of living water.' } },
  { key: 'door',     label: 'the Door',           icon: 'door',     group: 'son', weight: 3, receives: 'shown the way in',
    scripture: { ref: 'John 10:9', text: 'I am the door: by me if any man enter in, he shall be saved, and shall go in and out, and find pasture.' } },
  { key: 'rock',     label: 'the Rock',           icon: 'rock',     group: 'son', weight: 3, receives: 'steadied / grounded',
    scripture: { ref: '1 Corinthians 10:4', text: 'And did all drink the same spiritual drink: for they drank of that spiritual Rock that followed them: and that Rock was Christ.' } },
  { key: 'star',     label: 'Bright Morning Star', icon: 'star',    group: 'son', weight: 3, receives: 'given hope',
    scripture: { ref: 'Revelation 22:16', text: 'I Jesus have sent mine angel to testify unto you these things in the churches. I am the root and the offspring of David, and the bright and morning star.' } },
  { key: 'sun',      label: 'Sun of Righteousness', icon: 'sun',    group: 'son', weight: 3, receives: 'healed',
    scripture: { ref: 'Malachi 4:2', text: 'But unto you that fear my name shall the Sun of righteousness arise with healing in his wings; and ye shall go forth, and grow up as calves of the stall.' } },
  { key: 'sword',    label: 'the living Word',    icon: 'sword',    group: 'son', weight: 3, receives: 'pierced / discerned',
    scripture: { ref: 'Hebrews 4:12', text: 'For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart.' } },
  { key: 'shepherd', label: 'Good Shepherd',      icon: 'shepherd', group: 'son', weight: 3, receives: 'shepherded / cared for',
    scripture: { ref: 'John 10:11', text: 'I am the good shepherd: the good shepherd giveth his life for the sheep.' } },

  // ── SPIRIT ──────────────────────────────────────────────────────────────
  { key: 'dove',  label: 'Dove of the Spirit', icon: 'dove', group: 'spirit', weight: 3, receives: 'given peace',
    scripture: { ref: 'Matthew 3:16', text: 'And Jesus, when he was baptized, went up straightway out of the water: and, lo, the heavens were opened unto him, and he saw the Spirit of God descending like a dove, and lighting upon him:' } },
  { key: 'fire',  label: 'Tongues of Fire',    icon: 'fire', group: 'spirit', weight: 3, receives: 'set ablaze / stirred',
    scripture: { ref: 'Acts 2:3', text: 'And there appeared unto them cloven tongues like as of fire, and it sat upon each of them.' } },
  { key: 'wind',  label: 'Wind / Ruach',       icon: 'wind', group: 'spirit', weight: 3, receives: 'moved by the Spirit',
    scripture: { ref: 'John 3:8', text: 'The wind bloweth where it listeth, and thou hearest the sound thereof, but canst not tell whence it cometh, and whither it goeth: so is every one that is born of the Spirit.' } },
  { key: 'oil',   label: 'Oil of Anointing',   icon: 'oil',  group: 'spirit', weight: 3, receives: 'anointed / empowered',
    scripture: { ref: '1 Samuel 16:13', text: 'Then Samuel took the horn of oil, and anointed him in the midst of his brethren: and the Spirit of the LORD came upon David from that day forward. So Samuel rose up, and went to Ramah.' } },

  // ── FATHER / TRIUNE ─────────────────────────────────────────────────────
  { key: 'cloud',  label: 'Cloud of Glory',    icon: 'cloud',  group: 'father', weight: 3, receives: 'awed by His glory',
    scripture: { ref: 'Exodus 40:34', text: 'Then a cloud covered the tent of the congregation, and the glory of the LORD filled the tabernacle.' } },
  { key: 'light',  label: 'God is Light',      icon: 'light',  group: 'father', weight: 3, receives: 'given clarity',
    scripture: { ref: '1 John 1:5', text: 'This then is the message which we have heard of him, and declare unto you, that God is light, and in him is no darkness at all.' } },
  { key: 'eye',    label: 'El Roi — God sees', icon: 'eye',    group: 'father', weight: 3, receives: 'seen / known',
    scripture: { ref: 'Genesis 16:13', text: 'And she called the name of the LORD that spake unto her, Thou God seest me: for she said, Have I also here looked after him that seeth me?' } },
  { key: 'shield', label: 'the Shield',        icon: 'shield', group: 'father', weight: 3, receives: 'protected / assured',
    scripture: { ref: 'Genesis 15:1', text: 'After these things the word of the LORD came unto Abram in a vision, saying, Fear not, Abram: I am thy shield, and thy exceeding great reward.' } },
  { key: 'eagle',  label: "Eagle's Wings",     icon: 'eagle',  group: 'father', weight: 3, receives: 'renewed / lifted',
    scripture: { ref: 'Exodus 19:4', text: 'Ye have seen what I did unto the Egyptians, and how I bare you on eagles’ wings, and brought you unto myself.' } },
  { key: 'alpha-omega', label: 'Alpha & Omega', icon: 'alpha-omega', group: 'father', weight: 3, receives: 'grounded in the eternal',
    scripture: { ref: 'Revelation 1:8', text: 'I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty.' } },
];

export const REACTION_GROUPS = [
  { key: 'plain',  label: 'Reactions' },
  { key: 'son',    label: 'The Son' },
  { key: 'spirit', label: 'The Spirit' },
  { key: 'father', label: 'The Father' },
];

export const REACTION_KEYS = REACTIONS.map((r) => r.key);
const BY_KEY = Object.fromEntries(REACTIONS.map((r) => [r.key, r]));
export function reactionDef(key) { return BY_KEY[key] || null; }
export function isReactionKey(key) { return Object.prototype.hasOwnProperty.call(BY_KEY, key); }
export function reactionsInGroup(group) { return REACTIONS.filter((r) => r.group === group); }

// --- Single-pick model -------------------------------------------------------
// Each user has AT MOST ONE reaction per content item (social-media style). The
// aggregate `counts` map is { [reactionKey]: n }; `myKey` is the caller's pick.

// Build the per-content engagement map from the shapes the data path returns:
//   counts: [{ contentId, reactionKey, count }]   aggregate (RPC; no user id)
//   mine:   [{ contentId, reactionKey }]           the caller's OWN pick (<=1 each)
// Returns { [contentId]: { counts:{key:n}, total, myKey, score, top:[{key,count}] } }.
export function buildReactionMap({ counts = [], mine = [] } = {}) {
  const out = {};
  const ensure = (id) => {
    if (!out[id]) out[id] = { counts: {}, total: 0, myKey: null, score: 0, top: [] };
    return out[id];
  };
  for (const c of counts) {
    const id = c.contentId ?? c.content_id;
    const key = c.reactionKey ?? c.reaction_key;
    if (!id || !isReactionKey(key)) continue;
    const n = Number.isFinite(Number(c.count)) ? Number(c.count) : 0;
    const e = ensure(id);
    e.counts[key] = (e.counts[key] || 0) + n;
  }
  for (const m of mine) {
    const id = m.contentId ?? m.content_id;
    const key = m.reactionKey ?? m.reaction_key;
    if (!id || !isReactionKey(key)) continue;
    ensure(id).myKey = key;
  }
  // Finalize totals / score / top ordering.
  for (const e of Object.values(out)) {
    e.total = Object.values(e.counts).reduce((a, b) => a + b, 0);
    e.score = reactionScore(e.counts);
    e.top = Object.entries(e.counts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || REACTION_KEYS.indexOf(a.key) - REACTION_KEYS.indexOf(b.key));
  }
  return out;
}

export const EMPTY_REACTIONS = Object.freeze({ counts: {}, total: 0, myKey: null, score: 0, top: [] });
export function reactionsFor(map, contentId) {
  return (contentId && map && map[contentId]) || EMPTY_REACTIONS;
}

// Deterministic ranking score for a counts map — the weighted sum (in-app is the
// PRIMARY signal). A no-reaction item scores 0 and ranks last (honest zero).
export function reactionScore(counts = {}) {
  let s = 0;
  for (const [key, n] of Object.entries(counts)) {
    const def = BY_KEY[key];
    if (def) s += (def.weight || 0) * (Number(n) || 0);
  }
  return s;
}

// Rank items ({ contentId, serviceDate|createdAt, ... }) by in-app reaction score,
// tie-broken newest. New array; does not mutate.
export function sortByReactions(items, map, dateKey = 'serviceDate') {
  const list = Array.isArray(items) ? [...items] : [];
  const scoreOf = (x) => reactionsFor(map, x?.contentId ?? x?.videoId ?? x?.id).score;
  const dateOf = (x) => String(x?.[dateKey] || x?.createdAt || x?.serviceDate || '');
  return list.sort((a, b) => {
    const d = scoreOf(b) - scoreOf(a);
    if (d !== 0) return d;
    return dateOf(b).localeCompare(dateOf(a));
  });
}

// --- Qualitative reception signal (the feedback / Quality-Care pipe) ----------
// Fold a counts map into "how it landed": the meaningful reactions ranked by
// count, each with its reading (lamb = humbled/convicted, ...). `net` is a coarse
// positive/negative tone (thumbs-down is the only negative). This is what the
// qualitative feedback read consumes — real taps, never inferred sentiment.
export function receptionSignal(counts = {}) {
  const landings = Object.entries(counts)
    .map(([key, count]) => {
      const def = BY_KEY[key];
      return def ? { key, count: Number(count) || 0, receives: def.receives, label: def.label, group: def.group } : null;
    })
    .filter((x) => x && x.count > 0)
    .sort((a, b) => b.count - a.count);
  let pos = 0; let neg = 0;
  for (const l of landings) { if ((BY_KEY[l.key].weight || 0) < 0) neg += l.count; else pos += l.count; }
  return {
    landings,
    dominant: landings[0] || null,
    positive: pos,
    negative: neg,
    net: pos - neg,
    total: pos + neg,
  };
}

// A compact ordered summary the control renders (icon + count). Only reactions
// with a real count, most-reacted first — so a no-signal item reads clean.
export function reactionSummary(entry = EMPTY_REACTIONS) {
  return (entry.top || []).filter((t) => t.count > 0).map((t) => ({ ...t, def: BY_KEY[t.key] || null }));
}
