// =============================================================================
// eternal-algorithms — the ETERNAL ALGORITHMS library (Darrell 2026-06-16)
// =============================================================================
// Darrell's frame: the biblical patterns/principles are "eternal algorithms" —
// patterns from the eternal that run identically in both dimensions. Each entry
// is read on two sides so the framework and the result it yields sit face to
// face for PATTERN RECOGNITION:
//
//   • fourD  — the 4th-dimensional expression: eternal / scriptural / spiritual,
//              carrying the actual Scripture references (no fabrication).
//   • threeD — the 3rd-dimensional expression: practical / temporal / how it
//              plays out in this-world life and work.
//   • OUTCOME — first-class. The result running the algorithm produces — the
//              "you win with it." This is what makes the list browsable as
//              "frameworks and outcomes": framework on one side, the outcome it
//              yields on the other (Darrell, 2026-06-16).
//
// INTEGRATION (shared logic, not one-off): this library is the 4th-dimensional
// SOURCE that powers the two-layer progressive disclosure elsewhere — the deep
// (4D) layer beneath the plain-language Technology Briefings, and the
// Mind-of-Christ / mental-stewardship thread in the courses. The 3D/teaching
// layer is the plain-audience side; the 4D is the deep side. The two-depth +
// structured-content shape mirrors study-space.js on purpose (reuse, not
// re-roll); makeId is shared from there.
//
// SOVEREIGNTY: lives inside Darrell's Study (gated to the circle in the
// monolith). DATA is device-local (localStorage), keyed to the signed-in
// identity, never sent to the cloud, never mined, never used to train anything.
// All transforms are PURE; the only I/O is load/save, which fail soft when
// storage is missing or throwing (private-mode Safari, SSR/tests).
// =============================================================================
import { makeId } from './study-space.js';

export const STORE_VERSION = 1;
const KEY_PREFIX = 'poetech.eternalalg.v1';
export const DEFAULT_LABEL = 'Eternal Algorithms';

// Per-identity key — one owner's library is never commingled with another
// signed-in profile on the same device.
export function algKey(email) {
  const id = String(email || 'anon').trim().toLowerCase();
  return `${KEY_PREFIX}:${id}`;
}

export function emptyLibrary() {
  return { version: STORE_VERSION, label: DEFAULT_LABEL, entries: [] };
}

function isoOf(nowMs) {
  try { return new Date(Number(nowMs) || 0).toISOString(); }
  catch { return new Date(0).toISOString(); }
}

// --- Entry shape -------------------------------------------------------------
// { name, fourD:{summary,scripture}, threeD:{summary}, outcome, tags, links }
// outcome is FIRST-CLASS: coerced to a string, surfaced on its own, and gated
// (see missingOutcome) so the framework<->outcome pairing is never half-built.
export function normalizeAlgorithm(raw = {}, nowMs = 0, salt = 0) {
  const iso = raw.createdAt || isoOf(nowMs);
  const fourD = raw.fourD || {};
  const threeD = raw.threeD || {};
  return {
    id: raw.id || makeId(nowMs, salt),
    name: String(raw.name || '').trim(),
    fourD: {
      summary: String(fourD.summary || '').trim(),
      scripture: String(fourD.scripture || '').trim(),
    },
    threeD: {
      summary: String(threeD.summary || '').trim(),
    },
    outcome: String(raw.outcome || '').trim(),
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean)
      : [],
    links: Array.isArray(raw.links)
      ? raw.links
          .map((l) => ({ label: String(l?.label || '').trim(), where: String(l?.where || '').trim() }))
          .filter((l) => l.label || l.where)
      : [],
    pinned: !!raw.pinned,
    seed: !!raw.seed,
    // Provenance — where this finished entry came from. 'study' = promoted from a
    // finalized Study thought (sourceId links back to that entry, and is the
    // idempotency key so re-promoting updates instead of duplicating); 'manual' /
    // null = entered directly in the library. promotedAt stamps the promotion.
    source: raw.source === 'study' || raw.source === 'manual' ? raw.source : null,
    sourceId: raw.sourceId ? String(raw.sourceId) : null,
    promotedAt: raw.promotedAt || null,
    // The forge→pulpit bridge (2026-07-03): publish state is part of the entry
    // so it survives every load/save/merge. published = visible in the public
    // church series (through the DB's eternal_algorithms_public window ONLY);
    // publish4D = the owner chose to include the deep layer (DR-0094 — the
    // owner decides what's shared, per entry, per layer).
    published: !!raw.published,
    publish4D: !!raw.publish4D,
    publishedAt: raw.publishedAt || null,
    createdAt: iso,
    updatedAt: raw.updatedAt || iso,
  };
}

// --- Pure list operations (return NEW arrays; never mutate) ------------------

export function upsertAlgorithm(entries, entry) {
  const list = Array.isArray(entries) ? entries : [];
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx === -1) return [entry, ...list];
  const next = list.slice();
  next[idx] = { ...list[idx], ...entry, updatedAt: entry.updatedAt };
  return next;
}

export function removeAlgorithm(entries, id) {
  return (Array.isArray(entries) ? entries : []).filter((e) => e.id !== id);
}

export function togglePin(entries, id) {
  return (Array.isArray(entries) ? entries : []).map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e));
}

// Pinned first, then by name (the catalog reads as a stable, recognizable list,
// not a feed). Stable + pure.
export function sortAlgorithms(entries) {
  return [...(entries || [])].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
      || String(a.name || '').localeCompare(String(b.name || '')),
  );
}

// Free-text query across every textual field: name, both dimensional
// expressions, the outcome, scripture, tags. "Recognizable" is the point.
export function filterAlgorithms(entries, query) {
  const q = String(query || '').trim().toLowerCase();
  return (entries || []).filter((e) => {
    if (!q) return true;
    const hay = [
      e.name, e.fourD?.summary, e.fourD?.scripture, e.threeD?.summary,
      e.outcome, (e.tags || []).join(' '),
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

// The browsable "frameworks and outcomes" view: framework on one side, the
// outcome it yields on the other. This is the pairing list Darrell asked for —
// the projection the list view renders for pattern recognition.
export function frameworksAndOutcomes(entries) {
  return sortAlgorithms(entries).map((e) => ({
    id: e.id,
    name: e.name,
    outcome: e.outcome,
    scripture: e.fourD?.scripture || '',
    tags: e.tags || [],
    pinned: !!e.pinned,
  }));
}

// Proven-to-catch helper: any entry whose OUTCOME is empty. The framework<->
// outcome pairing is only meaningful when both sides exist, so an entry without
// an outcome is visibly incomplete (the UI badges it; the test asserts the seed
// catalog has none).
export function missingOutcome(entries) {
  return (entries || []).filter((e) => !e.outcome || !String(e.outcome).trim());
}

// --- The no-rough-drafts gate (the finished gallery accepts only FINAL) -------
// The Eternal Algorithms library is the canonical FINISHED output. Drafting and
// iteration happen in Study (the workshop); ONLY a complete, finalized framework
// is admitted here. validateFinal is the single gate every add + promote passes —
// a missing required part is REJECTED, never half-formed in the gallery.
//
// Required = name + the three teaching parts (4D summary, 3D summary, OUTCOME),
// mirroring thought-finalizer.hasAllParts. Scripture is RECOMMENDED but NOT a
// hard block: a thought may have no single clean anchor, and inventing one would
// violate the Word-first / no-fabrication rule — so admission never forces a
// fabricated verse. (hasScripture is reported so the UI can nudge, not block.)
export const REQUIRED_FINAL_PARTS = Object.freeze(['name', '4D expression', '3D expression', 'outcome']);

export function validateFinal(algLike) {
  const e = normalizeAlgorithm(algLike || {});
  const missing = [];
  if (!e.name) missing.push('name');
  if (!e.fourD.summary) missing.push('4D expression');
  if (!e.threeD.summary) missing.push('3D expression');
  if (!e.outcome) missing.push('outcome');
  return { ok: missing.length === 0, missing, hasScripture: !!e.fourD.scripture };
}

// The entry promoted from a given Study thought (provenance dedup key), or null.
export function findBySource(entries, sourceId) {
  if (!sourceId) return null;
  return (entries || []).find((e) => e.sourceId && e.sourceId === sourceId) || null;
}

// The set of Study thought ids already promoted — so the Finalize surface can
// badge "in the library" and offer Update vs. Promote.
export function promotedSourceIds(entries) {
  return new Set((entries || []).map((e) => e.sourceId).filter(Boolean));
}

// Promote a FINALIZED Study thought into the library — the single write path from
// the workshop to the finished gallery:
//   • REJECTS a draft — validateFinal must pass, else { ok:false, missing }.
//   • IDEMPOTENT by sourceId — re-promoting an edited finalized thought UPDATES
//     its existing entry (keeps its id + pinned), never duplicates.
// Pure (the caller persists). Returns { ok, library?, entry?, missing? }.
export function promoteFromStudy(library, draft, { sourceId = null, nowMs = 0, salt = 0 } = {}) {
  const check = validateFinal(draft);
  if (!check.ok) return { ok: false, missing: check.missing };
  const lib = library && Array.isArray(library.entries) ? library : emptyLibrary();
  const existing = findBySource(lib.entries, sourceId);
  const iso = isoOf(nowMs);
  const entry = normalizeAlgorithm({
    ...(existing || {}),
    ...draft,
    id: existing ? existing.id : undefined,
    pinned: existing ? existing.pinned : false,
    seed: false,
    source: 'study',
    sourceId: sourceId || (existing && existing.sourceId) || null,
    promotedAt: (existing && existing.promotedAt) || iso,
    updatedAt: iso,
  }, nowMs, salt);
  return { ok: true, library: { ...lib, entries: upsertAlgorithm(lib.entries, entry) }, entry };
}

// --- Device-local persistence (the only I/O; fails soft) ---------------------

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch { return null; }
}

export function loadLibrary(email) {
  const ls = safeStorage();
  if (!ls) return emptyLibrary();
  try {
    const raw = ls.getItem(algKey(email));
    if (!raw) return emptyLibrary();
    const parsed = JSON.parse(raw);
    return {
      version: STORE_VERSION,
      label: typeof parsed.label === 'string' && parsed.label.trim() ? parsed.label : DEFAULT_LABEL,
      entries: Array.isArray(parsed.entries) ? parsed.entries.map((e) => normalizeAlgorithm(e)) : [],
    };
  } catch {
    return emptyLibrary();
  }
}

export function saveLibrary(email, library) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    ls.setItem(algKey(email), JSON.stringify({
      version: STORE_VERSION,
      label: library?.label || DEFAULT_LABEL,
      entries: Array.isArray(library?.entries) ? library.entries : [],
    }));
    return { saved: true };
  } catch (e) {
    return { skipped: 'write-error', error: e };
  }
}

// Seed the library with the catalog the FIRST time it is opened (entries empty).
// Idempotent at the call site: only seed when empty. Entries are marked
// {seed:true} so the UI shows provenance; Darrell edits/appends freely.
export function seedIfEmpty(library, nowMs = 0) {
  if (library && Array.isArray(library.entries) && library.entries.length > 0) return library;
  const entries = SEED_ALGORITHMS.map((a, i) => normalizeAlgorithm({ ...a, seed: true }, nowMs, i));
  return { ...emptyLibrary(), ...(library || {}), entries };
}

// =============================================================================
// THE CATALOG — seeded eternal algorithms.
// Scripture is quoted from the ESV (public-domain KJV where noted) per the repo
// SCRIPTURE-REFERENCE-STANDARD; God references capitalized per the binding
// typographic rule. Each entry pairs a 4th-dimensional expression (eternal /
// scriptural) with a 3rd-dimensional expression (practical) and the OUTCOME the
// algorithm yields. Darrell edits/replaces/appends freely — this is the first
// impression of a finished entry, not fixed canon. Easy to append: add an
// object with the same shape.
// =============================================================================
export const SEED_ALGORITHMS = [
  {
    name: 'Response over Circumstance (90/10)',
    fourD: {
      summary: 'Joy is located in the response, not the event. "Count it all joy, my brothers, when you meet trials of various kinds" (Jas 1:2, ESV) — the trial is not the joy; the counting is. The testing is assigned to PRODUCE steadfastness so you become "perfect and complete, lacking in nothing" (Jas 1:3-4).',
      scripture: 'James 1:2-4',
    },
    threeD: {
      summary: 'Roughly 10% of life is what happens TO you; 90% is how you respond. The event is not the lever — your response is the part you actually hold. Own the reaction and you own the outcome of the moment.',
    },
    outcome: 'Stability and joy that do not depend on conditions — you stop being moved by the day, because your steadiness is sourced in the response you control, not the circumstance you do not.',
    tags: ['response', 'joy', '90-10', 'stability', 'trials'],
    links: [
      { label: 'Joy vs. happiness (Study reflection)', where: 'Study › Reflections' },
      { label: 'Mind-of-Christ thread', where: 'Church › Learn' },
    ],
  },
  {
    name: 'Build by Resistance (the enemy as material)',
    fourD: {
      summary: 'What was meant for harm is re-purposed as material for good. "You meant evil against me, but God meant it for good, to bring it about that many people should be kept alive" (Gen 50:20, ESV). The same enemies become a resting place: "until I make your enemies your footstool" (Ps 110:1). "All things work together for good for those who love God" (Rom 8:28).',
      scripture: 'Genesis 50:20; Psalm 110:1; Romans 8:28',
    },
    threeD: {
      summary: 'The load is what builds the muscle; the obstacle becomes the way. Resistance is not the interruption of the work — it is the raw material the work is made from. Lean into the weight instead of waiting for it to lift.',
    },
    outcome: 'Growth and strength: what was sent to break you becomes the very thing that builds you, and the opposition ends up underfoot — a footstool, not a threat.',
    tags: ['resistance', 'footstool', 'growth', 'redemption', 'strength'],
    links: [
      { label: 'The table and the footstool (Study reflection)', where: 'Study › Reflections' },
    ],
  },
  {
    name: 'Prepare then Execute (Research → Plan → Execute)',
    fourD: {
      summary: 'Build to a pattern already shown, after counting the cost. "See that you make them after the pattern for them, which is being shown you on the mountain" (Ex 25:40, ESV). "Which of you, desiring to build a tower, does not first sit down and count the cost?" (Luke 14:28). "Write the vision; make it plain on tablets, so he may run who reads it" (Hab 2:2).',
      scripture: 'Exodus 25:40; Luke 14:28-30; Habakkuk 2:2-3',
    },
    threeD: {
      summary: 'Research → plan → build. Measure twice, cut once. Make the plan plain enough that others can run with it. The order is non-negotiable: preparation precedes execution, and the writing-it-down is part of the preparation.',
    },
    outcome: 'It works the first time, with minimal rework — you build once instead of three times, and the plan made plain lets the whole team run without you re-explaining it.',
    tags: ['research-plan-execute', 'preparation', 'planning', 'excellence'],
    links: [
      { label: 'Reality-Trace Before Building (Layer 0)', where: 'CLAUDE.md' },
      { label: 'Verification Doctrine (DR-0076)', where: 'docs/decisions' },
    ],
  },
  {
    name: 'Change the Frame (metanoia)',
    fourD: {
      summary: 'Change the mind itself and the life follows. "Do not be conformed to this world, but be transformed by the renewing of your mind" (Rom 12:2, ESV) — metamorphoo, the caterpillar to the butterfly. "We have the mind of Christ" (1 Cor 2:16). "Take every thought captive to obey Christ" (2 Cor 10:5). The apparatus of thought is re-tooled, not merely coached.',
      scripture: 'Romans 12:2; 1 Corinthians 2:16; 2 Corinthians 10:5',
    },
    threeD: {
      summary: 'Reframe the model and the outcome changes. Change how you THINK before you try to change what you do — the behavior is downstream of the frame. Catch the thought, test it, choose a better one; do it enough and the pattern itself shifts.',
    },
    outcome: 'The win — a transformed life. Not white-knuckled behavior change but a changed pattern at the root, so the new way is what you actually are, not what you are straining to perform.',
    tags: ['metanoia', 'mind-of-christ', 'reframe', 'transformation', 'foundation'],
    links: [
      { label: 'Metanoia — the renewed mind (Study reflection)', where: 'Study › Reflections' },
      { label: 'MIND-OF-CHRIST.md', where: 'docs/00-foundations' },
    ],
  },
  {
    name: 'Broken and Healed in the Wilderness',
    fourD: {
      summary: 'The wilderness is the curriculum, not the detour. "He humbled you... testing you to know what was in your heart... that he might make you know that man does not live by bread alone but by every word that comes from the mouth of the Lord" (Deut 8:2-3, ESV). "Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me" (Ps 23:4) — through, not camped in.',
      scripture: 'Deuteronomy 8:2-3; Psalm 23:4',
    },
    threeD: {
      summary: 'The hard, empty season is where you find out what is actually inside you, and where the rebuild happens. Walk THROUGH it — do not settle there — and do not walk it alone. The healing happens in the hard place, not after it is over.',
    },
    outcome: 'You come out with a sustenance the settled land never taught — healed in the exact place you were broken, carrying a strength that only the wilderness could have given.',
    tags: ['wilderness', 'healing', 'brokenness', 'endurance'],
    links: [
      { label: 'Broken and healed in the wilderness (Study reflection)', where: 'Study › Reflections' },
    ],
  },
  {
    name: 'The Table Before the Enemy',
    fourD: {
      summary: '"You prepare a table before me in the presence of my enemies; you anoint my head with oil; my cup overflows" (Ps 23:5, ESV). Provision and honor are served openly, with the opposition watching and unable to interrupt the meal. The feast precedes the resolution.',
      scripture: 'Psalm 23:5',
    },
    threeD: {
      summary: 'Receive and steward what you have been given even while things are still unresolved. Do not leave the table to fight a fight that is already being won. The enemy at the table is not a threat to the meal — he is future furniture.',
    },
    outcome: 'Provision and peace NOW, not after the conflict ends — anxiety re-ordered, because you are eating at the table the Father set instead of starving while you wait for the field to clear.',
    tags: ['table', 'provision', 'peace', 'anxiety'],
    links: [
      { label: 'The table and the footstool (Study reflection)', where: 'Study › Reflections' },
      { label: 'ANXIETY-CLARITY-PRINCIPLE.md', where: 'docs/00-foundations' },
    ],
  },
  {
    name: 'The Finish Is Guaranteed (Author and Finisher)',
    fourD: {
      summary: 'You run toward a finish already secured. "Looking to Jesus, the founder and perfecter of our faith" (Heb 12:2, ESV; KJV: "the author and finisher of our faith"). "He who began a good work in you will bring it to completion at the day of Jesus Christ" (Phil 1:6). The One who starts it is the One who finishes it.',
      scripture: 'Hebrews 12:2; Philippians 1:6',
    },
    threeD: {
      summary: 'Work FROM a finished outcome, not toward an uncertain one. Persevere because completion is already decreed, not because you are gambling on whether it will work. The question is no longer "will it finish" but "will I keep walking."',
    },
    outcome: 'Endurance without the dread — you run the race already knowing it finishes, so the pressure of "will this work" comes off and steady perseverance becomes possible.',
    tags: ['author-finisher', 'perseverance', 'completion', 'endurance'],
    links: [
      { label: 'Perpetual improvement (DR-0075)', where: 'docs/decisions' },
    ],
  },
  {
    name: 'Joy Is the Strength',
    fourD: {
      summary: 'Joy is a strength carried in, not a reward waited for. "The joy of the Lord is your strength" (Neh 8:10, ESV) — spoken to a people WEEPING at the reading of the Law. "Though you have not seen him, you love him... you rejoice with joy that is inexpressible and filled with glory" (1 Pet 1:8) — joy as a settled possession in the middle of trial.',
      scripture: 'Nehemiah 8:10; 1 Peter 1:8',
    },
    threeD: {
      summary: 'Happiness is keyed to happenings (same root — hap, chance); joy is not. Joy does not depend on the day. It is fuel you bring INTO the hard moment, not a mood you wait for the moment to produce.',
    },
    outcome: 'A strength that does not flicker with circumstances — available on the hard days too, because it was never sourced in the day in the first place.',
    tags: ['joy', 'strength', 'happiness', 'resilience'],
    links: [
      { label: 'Joy vs. happiness (Study reflection)', where: 'Study › Reflections' },
    ],
  },
  {
    name: 'Seedtime and Harvest (sowing and reaping)',
    fourD: {
      summary: '"Do not be deceived: God is not mocked, for whatever one sows, that will he also reap... And let us not grow weary of doing good, for in due season we will reap, if we do not give up" (Gal 6:7-9, ESV). "While the earth remains, seedtime and harvest... shall not cease" (Gen 8:22). The harvest comes later, in a different season, and multiplied.',
      scripture: 'Galatians 6:7-9; Genesis 8:22',
    },
    threeD: {
      summary: 'Small consistent inputs compound. You reap in a later season than you sow, and more than you put in — so do not grow weary in the gap between deposit and return. The tithe, the buffer fund, the daily rep: each is a seed in the ground.',
    },
    outcome: 'Compounding returns — disciplined small deposits become a harvest you cannot reach any other way, precisely because most people give up in the gap before it lands.',
    tags: ['sowing-reaping', 'compounding', 'consistency', 'stewardship'],
    links: [
      { label: 'Buffer fund loop', where: 'Financial System' },
      { label: 'SEED-DATA-AS-ASPIRATION.md', where: 'docs/00-foundations' },
    ],
  },
  {
    name: 'Faithful in Little, Set Over Much',
    fourD: {
      summary: '"Well done, good and faithful servant. You have been faithful over a little; I will set you over much" (Matt 25:21, ESV). "One who is faithful in a very little is also faithful in much, and one who is dishonest in a very little is also dishonest in much" (Luke 16:10). Capacity is granted on proof, and integrity in the unseen governs the seen.',
      scripture: 'Matthew 25:21; Luke 16:10',
    },
    threeD: {
      summary: 'Stewardship scales by proof, not by ambition. Master the small assignment and the larger one is handed to you. How you handle the little — the unseen, the unglamorous — is exactly how you will handle the much, so the small task IS the audition.',
    },
    outcome: 'Trust and capacity expand — promotion follows proven faithfulness, so the way up is simply to be excellent with what is already in your hand.',
    tags: ['stewardship', 'faithfulness', 'promotion', 'excellence'],
    links: [
      { label: 'EXCELLENCE-STANDARD.md', where: 'docs/00-foundations' },
    ],
  },
  {
    name: 'The Perfect You Were Made For (whole, not flawless)',
    fourD: {
      summary: 'God\'s "perfect" never meant flawless. "You therefore must be perfect, as your heavenly Father is perfect" (Matt 5:48, ESV) uses teleios (Strong\'s G5046, from telos, "end / goal") — complete, brought to its purpose, full-grown, mature, lacking nothing necessary. "Walk before me, and be thou perfect" (Gen 17:1, KJV) is tamim (H8549) — whole, sound, having integrity (ESV: "blameless"). The KJV renders BOTH as "perfect," and the old English "perfect" simply meant whole. It is grace-work, not self-manufacture: "perfect and complete, lacking in nothing" (Jas 1:4), "go on to maturity" (Heb 6:1), "perfected in love" so that "perfect love casts out fear" (1 Jn 4:17-18). Even Paul: "Not that I am already perfect, but I press on" (Phil 3:12).',
      scripture: 'Matthew 5:48; Genesis 17:1; James 1:4; Hebrews 6:1; Colossians 1:28; 1 John 4:17-18; Philippians 3:12-15',
    },
    threeD: {
      summary: 'Chasing flawless 3rd-dimensional performance is a trap — it breeds anxiety, endless self-measuring, and the fear of never being enough, and it is a standard the Bible never set. Trade it for the Perfect actually expected: whole, wholehearted, maturing, all-in love — a target God Himself grows in you by grace. Aim at whole, not flawless, and let Him do the perfecting.',
    },
    outcome: 'Freedom from crushing perfectionism: the fear and self-condemnation lift, acceptance is received as grace instead of earned by a spotless record, and you grow whole — wholehearted and perfected in love — at rest with God rather than performing for Him.',
    tags: ['perfect', 'teleios', 'tamim', 'grace', 'maturity', 'love', 'perfectionism', 'wholeness', 'well-being', '4d-3d'],
    links: [
      { label: 'The Perfect You Were Made For (Learn lesson)', where: 'Church › Learn › Living Lessons' },
      { label: 'Verified: teleios G5046 (from telos) / tamim H8549', where: 'Strong\'s lexicon' },
    ],
  },
];
