// =============================================================================
// story-exploration.js — "Explore Your Story": read your life by His Word
// =============================================================================
// The SINGLE SOURCE for the exact question L27 ("The God Who Documents His
// Grief") teaches people to ask of their own lives — surfaced as an interactive
// exploration in the app + the Games hub so people actually DO it, not only read
// it (Darrell 2026-07-11: "Let's ask that exact question in the app and games so
// people explore like Yahweh wants us to").
//
// The method is Joseph's: name the real memory, then bring it to the Word and
// ask where God was, what He was preserving, and what comfort it now lets you
// give (Genesis 45:5; 50:20; Deuteronomy 8:2; 2 Corinthians 1:3-4). This is NOT
// projecting meaning onto Scripture — it is letting Scripture READ your life.
//
// VERIFICATION (DR-0076): every verse below is KJV, fetched verbatim from
// app/public/bible/kjv the same session L27 was built; none from memory. The
// exploration and L27 share the SAME verses on purpose — one source of truth.
//
// TLC BRIGHT LINE: this is reflection WITH the Godhead through His Word, pastoral
// and NOT clinical therapy; the guardrail is shown on the surface itself.
//
// PRIVACY (DATA-AS-EMPOWERMENT-NOT-EXTRACTION): a person's reflection is theirs.
// It persists DEVICE-LOCAL only (localStorage), never leaves the device, never
// feeds a stream or a server. The persistence helpers below are pure over an
// injected storage so the vitest suite asserts the whole data trace.
// =============================================================================

// The Living Lesson this exploration is the "now do it" companion to.
export const EXPLORATION_LESSON_ID = 'll27-the-god-who-documents-his-grief';

// The opening truth that makes the whole practice safe: your tears are not
// wasted — God keeps a record of them, the way He documented His own grief.
export const EXPLORATION_OPENING = {
  ref: 'Psalms 56:8',
  verse: 'Thou tellest my wanderings: put thou my tears into thy bottle: are they not in thy book?',
  note: 'The God who wrote His OWN grief into the Word (it grieved Him at His heart, Genesis 6:6) keeps a record of yours too. Not one tear is lost. So it is safe to bring your story to Him.',
};

// The exact question, framed for two depths (child + seasoned). The Games hub
// picks by its level; anything that is not the child level reads the seasoned
// framing (a plain-adult reader is served the seasoned words, never the child's).
export const EXPLORATION_INVITATION = {
  child: 'Think of one thing that happened to you — a happy memory or a hard one. Now let’s bring it to God and His Word, and see what He was doing. Joseph did this: his brothers were mean to him, but he later saw "God meant it unto good" (Genesis 50:20).',
  senior: 'Take one real memory — a "garden" one or a hard one — and instead of interpreting it alone, bring it to the Word, the way Joseph read his own history: "ye thought evil against me; but God meant it unto good... to save much people alive" (Genesis 50:20). He did not deny the evil; he read it under God’s hand. Ask the three questions the Scriptures answer, and let the Word read your life.',
};

// The three Joseph-method questions, each with its verbatim anchor verse. These
// are the "exact question" made walkable.
export const EXPLORATION_STEPS = [
  {
    key: 'where',
    label: 'Where was God in it?',
    prompt: {
      child: 'Where was God when this happened? He was right there with you — He promises He never leaves.',
      senior: 'Where was God in this memory? Not absent — "In all their affliction he was afflicted" (Isaiah 63:9). Name where you now see He was present, even if you could not see it then.',
    },
    ref: 'Isaiah 63:9',
    verse: 'In all their affliction he was afflicted, and the angel of his presence saved them: in his love and in his pity he redeemed them; and he bare them, and carried them all the days of old.',
  },
  {
    key: 'preserving',
    label: 'What was He preserving or preparing?',
    prompt: {
      child: 'What good was God growing out of it? Joseph found out God sent him ahead "to preserve life" (Genesis 45:5).',
      senior: 'What was God preserving or preparing through it? "God did send me before you to preserve life" (Genesis 45:5); "thou shalt remember all the way which the LORD thy God led thee... to prove thee, to know what was in thine heart" (Deuteronomy 8:2).',
    },
    ref: 'Genesis 45:5; Deuteronomy 8:2',
    verse: 'Now therefore be not grieved, nor angry with yourselves, that ye sold me hither: for God did send me before you to preserve life. // And thou shalt remember all the way which the LORD thy God led thee these forty years in the wilderness, to humble thee, and to prove thee, to know what was in thine heart, whether thou wouldest keep his commandments, or no.',
  },
  {
    key: 'comfort',
    label: 'What comfort can you now give?',
    prompt: {
      child: 'What kind thing can you now do for someone else because of what you went through? God comforts us so we can comfort others.',
      senior: 'What comfort did you receive that you can now hand to someone else? "the God of all comfort; who comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble" (2 Corinthians 1:3-4).',
    },
    ref: '2 Corinthians 1:3-4',
    verse: 'Blessed be God, even the Father of our Lord Jesus Christ, the Father of mercies, and the God of all comfort; // Who comforteth us in all our tribulation, that we may be able to comfort them which are in any trouble, by the comfort wherewith we ourselves are comforted of God.',
  },
];

// The Joseph anchor the whole method rests on, and the settled end every tear
// is headed toward.
export const EXPLORATION_JOSEPH_ANCHOR = {
  ref: 'Genesis 50:20',
  verse: 'But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.',
};
export const EXPLORATION_CLOSING = {
  ref: 'Revelation 21:4',
  verse: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
};

// The pastoral guardrail, shown on the surface. Reflection, not therapy.
export const EXPLORATION_GUARDRAIL =
  'This is reflection WITH the Godhead through His Word — not clinical therapy. Some wounds are deep, and bringing a trusted believer, a pastor, or a wise counselor alongside you is wisdom, not weakness. You were put in a body of believers to grieve and heal in company, not alone.';

// The invitation + steps, framed for a level. Child level reads child framing;
// every other level reads the seasoned framing (a plain adult is never handed
// the child's words). Pure — safe in tests and server-side.
export function explorationFor(level = 'senior') {
  const band = level === 'child' ? 'child' : 'senior';
  return {
    lessonId: EXPLORATION_LESSON_ID,
    opening: EXPLORATION_OPENING,
    invitation: EXPLORATION_INVITATION[band],
    steps: EXPLORATION_STEPS.map((s) => ({ key: s.key, label: s.label, prompt: s.prompt[band], ref: s.ref, verse: s.verse })),
    josephAnchor: EXPLORATION_JOSEPH_ANCHOR,
    closing: EXPLORATION_CLOSING,
    guardrail: EXPLORATION_GUARDRAIL,
  };
}

// ---- device-local reflection persistence (private; DATA-AS-EMPOWERMENT) ------
// A reflection is a whole entry: { id, memory, where, preserving, comfort, at }.
// Stored newest-first, capped, on THIS device only. Pure over an injected
// storage (localStorage in the app; a stub in tests) so the whole trace is
// machine-checked (DR-0076).
export const STORY_STORAGE_KEY = 'poe.storyExploration.v1';
export const STORY_MAX = 50;

export function loadReflections(storage) {
  try {
    const raw = storage && storage.getItem(STORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// True when there is at least one filled field — an empty reflection is never
// saved (no painted rows, DR-0061).
export function reflectionHasContent(entry) {
  if (!entry) return false;
  return ['memory', 'where', 'preserving', 'comfort'].some((k) => typeof entry[k] === 'string' && entry[k].trim().length > 0);
}

// Append a reflection, returning the new (persisted) list newest-first. `id` and
// `at` are passed IN by the caller (component land owns the clock/id) so this
// stays pure and deterministic under test. A contentless entry is a no-op.
export function saveReflection(storage, entry) {
  const list = loadReflections(storage);
  if (!reflectionHasContent(entry)) return list;
  const clean = {
    id: entry.id,
    memory: (entry.memory || '').trim(),
    where: (entry.where || '').trim(),
    preserving: (entry.preserving || '').trim(),
    comfort: (entry.comfort || '').trim(),
    at: entry.at || null,
  };
  const next = [clean, ...list].slice(0, STORY_MAX);
  try { storage && storage.setItem(STORY_STORAGE_KEY, JSON.stringify(next)); } catch { /* device-local best effort */ }
  return next;
}

export function deleteReflection(storage, id) {
  const next = loadReflections(storage).filter((r) => r && r.id !== id);
  try { storage && storage.setItem(STORY_STORAGE_KEY, JSON.stringify(next)); } catch { /* device-local best effort */ }
  return next;
}
