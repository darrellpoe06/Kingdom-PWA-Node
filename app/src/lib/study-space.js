// =============================================================================
// study-space — Darrell's Study: a PRIVATE, sovereign thinking/processing space
// =============================================================================
// Darrell 2026-06-16: a private place to think and process the deep theological /
// reflective exchanges — "the 4th-dimensional version of my presentation" — the
// layer one click BENEATH the plain-language Technology Briefings (progressive
// disclosure). It holds the captured reflections as SOURCE MATERIAL the briefings
// and presentations draw from, a processing scratch with a distillation path
// (deep 4th-dimensional reflection <-> plain wider-audience version, both
// directions), and a cultural-research / reprocess workspace (the 1 Cor 9:19-23
// "all things to all men" methodology — reworking one truth for many audiences).
//
// SOVEREIGNTY / PROCESS-DON'T-STORE (binding): this is his private thinking. It
// lives DEVICE-LOCAL (localStorage), keyed to the signed-in identity, never sent
// to the cloud, never mined, never used to train anything. Same posture as the
// Church Observation board (device-local now; a sovereign NAS rail is the named
// follow-up, never an extractive cloud table). Access to the SURFACE is gated to
// the smallest circle by design (Darrell + Christina + Bishop Gwin) in the
// monolith; this module only owns the data shape + the device-local persistence.
//
// All transform helpers are PURE (no I/O) so they unit-test in node; the only
// side-effecting functions are loadStudy/saveStudy, which guard for a missing or
// throwing localStorage (private-mode Safari, SSR/tests) and fail soft.
// =============================================================================

// The three rooms of the Study. One unified entry model carries all three; the
// `kind` distinguishes them so the distillation path (deep <-> plain) and search
// are shared logic, not three one-offs.
export const KINDS = Object.freeze({
  reflection: { key: 'reflection', label: 'Reflection', icon: '🕊', blurb: 'Captured deep exchange — the 4th-dimensional source the briefings unfold from.' },
  processing: { key: 'processing', label: 'Processing', icon: '⚒', blurb: 'Notes, code-for-building scratch, ideas being organized for a wider audience.' },
  research:   { key: 'research',   label: 'Cultural research', icon: '🌍', blurb: 'Research a culture and rework the truth to reach it (all things to all men).' },
});
export const KIND_ORDER = Object.freeze(['reflection', 'processing', 'research']);

export const DEFAULT_LABEL = "Darrell's Study";
const STORE_VERSION = 1;
const KEY_PREFIX = 'poetech.study.v1';

// Per-identity key: the owner's reflections are tied to their identity, never
// commingled with another signed-in profile on the same device.
export function studyKey(email) {
  const id = String(email || 'anon').trim().toLowerCase();
  return `${KEY_PREFIX}:${id}`;
}

export function emptyStudy() {
  return { version: STORE_VERSION, label: DEFAULT_LABEL, entries: [] };
}

// A monotonic-ish id without Date.now()/Math.random dependence in the pure layer.
// The caller passes a timestamp (ms) + an index salt; collisions across a single
// save are avoided by the index. (Date.now is allowed in the app at runtime; it
// is only forbidden inside workflow scripts.)
export function makeId(nowMs, salt = 0) {
  return `e_${Number(nowMs || 0).toString(36)}_${Number(salt).toString(36)}`;
}

// --- Entry shape -------------------------------------------------------------
// deep  = the 4th-dimensional reflection / captured exchange (source material).
// plain = the plain-language wider-audience distillation (the briefing layer).
// Both live side by side so progressive disclosure works BOTH directions: open
// the plain version to a wide room, drop one level to the deep source on demand.
export function normalizeEntry(raw = {}, nowMs = 0, salt = 0) {
  const kind = KINDS[raw.kind] ? raw.kind : 'reflection';
  const iso = raw.createdAt || isoOf(nowMs);
  return {
    id: raw.id || makeId(nowMs, salt),
    kind,
    title: String(raw.title || '').trim(),
    deep: String(raw.deep || ''),
    plain: String(raw.plain || ''),
    scripture: String(raw.scripture || '').trim(),
    culture: String(raw.culture || '').trim(), // research rooms: the audience/culture in view
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean).map((t) => String(t).trim()).filter(Boolean) : [],
    pinned: !!raw.pinned,
    seed: !!raw.seed, // seeded today's-themes entry (so the UI can mark provenance)
    createdAt: iso,
    updatedAt: raw.updatedAt || iso,
  };
}

function isoOf(nowMs) {
  try { return new Date(Number(nowMs) || 0).toISOString(); }
  catch { return new Date(0).toISOString(); }
}

// Has this entry actually been distilled both ways? Used to surface the "needs a
// plain version" / "needs the deep source" nudge — the distillation path is the
// point, so an entry with only one side is visibly incomplete.
export function distillState(entry) {
  const hasDeep = !!(entry && entry.deep && entry.deep.trim());
  const hasPlain = !!(entry && entry.plain && entry.plain.trim());
  if (hasDeep && hasPlain) return 'both';
  if (hasDeep) return 'deep-only';
  if (hasPlain) return 'plain-only';
  return 'empty';
}

// --- Pure list operations (return NEW arrays; never mutate) ------------------

export function upsertEntry(entries, entry) {
  const list = Array.isArray(entries) ? entries : [];
  const idx = list.findIndex((e) => e.id === entry.id);
  if (idx === -1) return [entry, ...list];
  const next = list.slice();
  next[idx] = { ...list[idx], ...entry, updatedAt: entry.updatedAt };
  return next;
}

export function removeEntry(entries, id) {
  return (Array.isArray(entries) ? entries : []).filter((e) => e.id !== id);
}

export function togglePin(entries, id) {
  return (Array.isArray(entries) ? entries : []).map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e));
}

// Pinned first, then newest first. Stable, pure.
export function sortEntries(entries) {
  return [...(entries || [])].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
      || String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  );
}

// Filter to one room + a free-text query across every textual field (title,
// both distillation layers, scripture, culture, tags).
export function filterEntries(entries, kind, query) {
  const q = String(query || '').trim().toLowerCase();
  return (entries || [])
    .filter((e) => !kind || e.kind === kind)
    .filter((e) => {
      if (!q) return true;
      const hay = `${e.title} ${e.deep} ${e.plain} ${e.scripture} ${e.culture} ${(e.tags || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
}

export function countsByKind(entries) {
  const out = { reflection: 0, processing: 0, research: 0 };
  for (const e of entries || []) if (out[e.kind] != null) out[e.kind] += 1;
  return out;
}

// The captured reflections that are READY to feed a briefing/presentation: a
// reflection with BOTH a deep source and a plain unfold. This is the bridge to
// the Technology Briefings' two depth layers.
export function briefingReady(entries) {
  return (entries || []).filter((e) => e.kind === 'reflection' && distillState(e) === 'both');
}

// --- Capture / import --------------------------------------------------------
// Capture a pasted exchange as a reflection. The pasted text is the DEEP source;
// the plain layer starts empty (the distillation is the work he does next). A
// best-effort title is lifted from the first non-empty line if none is given.
export function captureExchange({ title, text, scripture, tags }, nowMs = 0, salt = 0) {
  const body = String(text || '');
  const firstLine = body.split('\n').map((l) => l.trim()).find(Boolean) || '';
  return normalizeEntry({
    kind: 'reflection',
    title: String(title || '').trim() || firstLine.slice(0, 80),
    deep: body,
    scripture: scripture || '',
    tags: tags || [],
  }, nowMs, salt);
}

// --- Device-local persistence (the only I/O; fails soft) ---------------------

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined' || !localStorage) return null;
    return localStorage;
  } catch { return null; }
}

export function loadStudy(email) {
  const ls = safeStorage();
  if (!ls) return emptyStudy();
  try {
    const raw = ls.getItem(studyKey(email));
    if (!raw) return emptyStudy();
    const parsed = JSON.parse(raw);
    return {
      version: STORE_VERSION,
      label: typeof parsed.label === 'string' && parsed.label.trim() ? parsed.label : DEFAULT_LABEL,
      entries: Array.isArray(parsed.entries) ? parsed.entries.map((e) => normalizeEntry(e)) : [],
    };
  } catch {
    return emptyStudy();
  }
}

export function saveStudy(email, study) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    const payload = {
      version: STORE_VERSION,
      label: study?.label || DEFAULT_LABEL,
      entries: Array.isArray(study?.entries) ? study.entries : [],
    };
    ls.setItem(studyKey(email), JSON.stringify(payload));
    return { saved: true };
  } catch (e) {
    return { skipped: 'write-error', error: e };
  }
}

// Seed the Study with today's themes the FIRST time it is opened (entries empty).
// Idempotent at the call site: only seed when there are no entries yet. Returns a
// NEW study with the seed entries marked {seed:true} so the UI can show their
// provenance and he can edit/replace them freely.
export function seedIfEmpty(study, nowMs = 0) {
  if (study && Array.isArray(study.entries) && study.entries.length > 0) return study;
  const entries = SEED_THEMES.map((t, i) => normalizeEntry({ ...t, seed: true }, nowMs, i));
  return { ...emptyStudy(), ...(study || {}), entries };
}

// Today's themes (2026-06-16), authored as titled reflections with a deep source
// layer and a plain wider-audience layer. Scripture follows the repo standard
// (ESV primary; KJV public-domain where noted). God references capitalized per
// the binding typographic rule. He edits/replaces these freely — they are the
// first impression of what a finished reflection looks like, not fixed canon.
export const SEED_THEMES = [
  {
    kind: 'reflection',
    title: 'Metanoia — the renewed mind, the Mind of Christ',
    scripture: '2 Corinthians 10:4-5; Romans 12:2',
    deep: `Metanoia is not regret — it is the changing of the mind itself, the apparatus of thought re-formed. Paul names the mechanism plainly: the weapons of our warfare are not of the flesh but have divine power to demolish strongholds; we take every thought captive to obey Christ (2 Cor 10:4-5, ESV). A stronghold is a thought-pattern fortified by repetition. The warfare is mental before it is anything else, and the win condition is the captured thought. Romans 12:2 gives the same motion from the other side: do not be conformed to this world, but be transformed by the renewing of your mind. The Greek is metamorphoo — the caterpillar's dissolution into the butterfly — paired with the renewing (anakainosis) of the nous. The mind is not coached; it is reconstituted. This is the deep frame under everything: NOTICE the thought, TEST it (Phil 4:8), CAPTURE it, REDIRECT it. The 4th-dimensional claim is that you can hold the instrument that does the thinking and re-tool it — and that this is the literal having of the Mind of Christ (1 Cor 2:16), not a metaphor for being nice.`,
    plain: `Real change starts in how you think, not in trying harder. The Bible calls it being "transformed by the renewing of your mind" — your thinking gets rebuilt, not just managed. Practically: catch the thought, hold it up to the light, and choose a better one. Do that enough and the pattern itself changes.`,
    tags: ['metanoia', 'mind-of-christ', 'foundation'],
  },
  {
    kind: 'reflection',
    title: 'Joy vs. happiness — the strength that does not depend on the day',
    scripture: 'Nehemiah 8:10; 1 Peter 1:8',
    deep: `Happiness is keyed to happenings — same root, hap, chance, the luck of the circumstance. Joy is not. "The joy of the Lord is your strength" (Neh 8:10, ESV) is spoken to a people weeping at the reading of the Law — the feeling in the room was grief, and the instruction was to draw strength from a joy that did not match the room. Peter writes of believers who love a Christ they have not seen and "rejoice with joy that is inexpressible and filled with glory" (1 Pet 1:8) — joy as a settled possession in the middle of trial, not a mood produced by relief. The distinction matters for design and for living: a system (or a life) built to chase happiness is built to chase happenings, and happenings are chance. Joy is a strength you carry IN, not a reward you wait for. It is the difference between a buffer fund that steadies the family regardless of the month, and a windfall that only lifts the months it lands in.`,
    plain: `Happiness depends on what happens — good day, good mood. Joy is different: it's a steady strength you carry in, even on a hard day. The Bible says "the joy of the Lord is your strength," and it says it to people who were crying at the time. You don't have to wait for things to get good to have it.`,
    tags: ['joy', 'happiness', 'strength'],
  },
  {
    kind: 'reflection',
    title: 'Broken and healed in the wilderness',
    scripture: 'Deuteronomy 8:2-3; Psalm 23:4',
    deep: `The wilderness is not the detour; it is the curriculum. "Remember the whole way that the Lord your God has led you these forty years in the wilderness, that he might humble you, testing you to know what was in your heart" (Deut 8:2, ESV). The breaking is diagnostic — it surfaces what was already in the heart so it can be healed, not punitive. He humbles, then He feeds with manna "that he might make you know that man does not live by bread alone but by every word that comes from the mouth of the Lord" (8:3). The healing is not the removal of the wilderness; it is the discovery, IN the wilderness, of a sustenance that the settled land never taught. Psalm 23 keeps the order: the valley of the shadow is walked THROUGH ("I will fear no evil, for you are with me"), the table is set in the presence of enemies, not after they are gone. The broken place and the healed place are the same place, separated by who you found there.`,
    plain: `The hard, empty seasons aren't a punishment or a wrong turn — they're where you find out what's really inside you, and where God meets you and rebuilds you. The healing usually happens IN the hard place, not after it's over. You walk through the valley, you don't camp there, and you don't walk it alone.`,
    tags: ['wilderness', 'healing', 'brokenness'],
  },
  {
    kind: 'reflection',
    title: 'The table and the footstool',
    scripture: 'Psalm 23:5; Psalm 110:1',
    deep: `Two pieces of furniture name the whole posture. The table: "You prepare a table before me in the presence of my enemies" (Ps 23:5, ESV) — provision and honor served openly, with the opposition watching and unable to interrupt the meal. The footstool: "The Lord says to my Lord: Sit at my right hand, until I make your enemies your footstool" (Ps 110:1) — the same enemies, now underfoot, the throne's resting place. Jesus cites this verse of Himself (Matt 22:44). Between the table and the footstool is the entire arc: you eat in the presence of what opposes you BEFORE it is subdued, because the subduing is the Father's work and is already decreed. The believer's job is to keep eating — to receive the provision at the table while the footstool is being made — not to leave the table to fight for what is already being placed under the feet. It re-orders anxiety: the enemy at the table is not a threat to the meal; he is future furniture.`,
    plain: `Picture two things: a table set for you with a good meal — served right in front of the people against you, who can't touch it — and a footstool, where those same people end up under your feet in the end. The lesson: you can sit and receive what God's given you even while things are still unresolved, because the outcome is already settled. Don't leave the table to fight a fight that's already won.`,
    tags: ['table', 'footstool', 'provision', 'authority'],
  },
  {
    kind: 'reflection',
    title: 'The Godhead — the Holy Spirit "IS"',
    scripture: 'John 16:13; John 14:16-17',
    deep: `"When the Spirit of truth comes, He will guide you into all the truth, for He will not speak on His own authority, but whatever He hears He will speak, and He will declare to you the things that are to come" (John 16:13, ESV). The Holy Spirit is not an influence or a force — He IS, a Person of the Godhead, who hears, speaks, guides, declares. Jesus calls Him "another Helper" (allos parakletos — another of the same kind, John 14:16), and says He will be "with you forever" and "will be in you" (14:17). The integration the Worldview names is exactly this: the indwelling is not a doctrine to affirm but a Person to walk with — the relationship is the point, not the spiritual experiences it produces. The 4th-dimensional reading: the same Spirit who hears the Father and speaks only what He hears is the One being asked to renew the mind (the metanoia thread). The pipeline of trustworthy knowledge runs Father -> Spirit -> the renewed mind; nothing in it is invented at any stage ("He will not speak on His own authority"). The discipline of not improvising theology is modeled by the Spirit Himself.`,
    plain: `The Holy Spirit isn't a vague force — He's a Person, part of who God is, who actually lives in and walks with the believer. Jesus said He'd guide us into truth, and that He only ever passes on what He hears from the Father — He doesn't make things up. The whole point is the relationship, not just spiritual experiences.`,
    tags: ['godhead', 'holy-spirit', 'integration', 'worldview'],
  },
  {
    kind: 'reflection',
    title: 'The Father of lights',
    scripture: 'James 1:17',
    deep: `"Every good gift and every perfect gift is from above, coming down from the Father of lights, with whom there is no variation or shadow due to change" (James 1:17, ESV). The title "Father of lights" (Patros ton photon) names God as the source and origin of every illuminating thing — the heavenly lights He made, and by extension every gift that enlightens. The clause that follows is the load-bearing one: "no variation or shadow due to change." The created lights all turn — the sun casts a moving shadow, the moon waxes and wanes — but their Father does not. He is the one light that does not flicker, does not have a dark side that rotates into view. For a space of illumination this is the governing claim: the goal is not to generate light but to align with the unwavering Source of it, so that what is produced here carries no shadow of turning — no spin, no manipulation, no variation between what is said in the light and what is true in the dark. "Father of lights" would fittingly name a room whose whole purpose is to bring deep things into the open without distortion.`,
    plain: `God is called "the Father of lights" — the source of every good and enlightening thing. The key line: unlike the sun or moon, He never changes, never has a shadow side that turns toward you. So a space meant to bring things into the light should aim to reflect that: no spin, no hidden angle — what's said in the light matches what's true in the dark.`,
    tags: ['father-of-lights', 'illumination', 'integrity'],
  },
  {
    kind: 'reflection',
    title: 'The trustworthy-knowledge pipeline',
    scripture: 'John 16:13; Proverbs 2:6; 1 Corinthians 2:12-13',
    deep: `Knowledge can be true at the source and corrupted in transit. The Worldview's answer is a pipeline whose every stage refuses to invent: "the Lord gives wisdom; from His mouth come knowledge and understanding" (Prov 2:6, ESV) is the source; the Spirit "will not speak on His own authority, but whatever He hears He will speak" (John 16:13) is the faithful carrier; "we impart this in words not taught by human wisdom but taught by the Spirit" (1 Cor 2:13) is the faithful delivery. The architecture mirrors it: no claim without provenance, no improvised theology, fetch the actual translation rather than producing from memory, mark what is unverified. The 4th-dimensional point is that the engineering discipline (the Verification Doctrine, DR-0076) and the spiritual discipline are the SAME discipline — "trust nothing unverified" is how the Spirit Himself handles knowledge, only speaking what He has heard. A system grounded in truth is not a constraint imposed on a faith story; it is the faith story applied to information.`,
    plain: `Good information can get twisted on the way to you. The fix is a chain where nobody at any step makes things up: it starts with God as the source, the Holy Spirit carries it faithfully ("only says what He hears"), and it's delivered without spin. That's the same rule we build the app on — don't claim what you can't show, check before you trust. The honesty in the engineering and the honesty in the faith are the same honesty.`,
    tags: ['verification', 'knowledge', 'truth', 'pipeline'],
  },
];
