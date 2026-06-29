// =============================================================================
// studyable — the generic "save this into my Study" contract + adapters.
// (Darrell 2026-06-25.)
// =============================================================================
// Darrell: "let me save/pull scripture lessons into the personal Study tab to keep
// studying — and CREATE from it as a starting point." A saved lesson becomes a SEED
// for the user's own notes + new content (the content flywheel: study it, build on
// it, produce more from it).
//
// This is the studyable sibling of presentable.js: a small, surface-agnostic
// CONTRACT any scripture surface implements to become "saveable into Study", plus
// pure adapters that translate the concrete surfaces (a curated verse, a theme, the
// connections web, a discernment lesson, a sermon) into that contract. study-space.js
// then turns a seed into a real Study entry (entryFromSeed) — so the surfaces stay
// decoupled from the Study's storage, and a NEW source just writes one more adapter.
//
// THE CONTRACT — a `studySeed`:
//   {
//     sourceKind,   // 'scripture' | 'theme' | 'connections' | 'discernment' | 'sermon'
//     sourceId,     // stable id of the source (ref / themeId / sermonId) — for dedupe
//     kind,         // the Study room it lands in (default 'research')
//     title,        // names the entry
//     scripture,    // the reference(s) it studies
//     deep,         // the rich SOURCE material (what the user studies + builds on)
//     plain,        // usually '' — the user's own distillation is the work they do
//     tags,
//     source: { kind, id, label, where }  // provenance shown on the Study card
//   }
//
// `deep` carries the substance the user keeps studying; `plain` is intentionally left
// for them to write (the same two-layer distillation the Study already runs). The
// provenance (`source`) is what lets the Study show "saved from The Word / Scripture"
// and what powers "create from this" (the flywheel) downstream.
// =============================================================================

const arr = (v) => (Array.isArray(v) ? v : []);
const clean = (s) => String(s == null ? '' : s).trim();
const dedupeTags = (tags) => Array.from(new Set(arr(tags).map(clean).filter(Boolean)));

// Normalize any partial seed into the full contract (defaults filled). Pure.
export function normalizeSeed(raw = {}) {
  const src = raw.source && typeof raw.source === 'object' ? raw.source : {};
  return {
    sourceKind: clean(raw.sourceKind) || 'scripture',
    sourceId: clean(raw.sourceId),
    kind: raw.kind === 'reflection' || raw.kind === 'processing' || raw.kind === 'research'
      ? raw.kind : 'research',
    title: clean(raw.title) || 'Untitled study',
    scripture: clean(raw.scripture),
    deep: String(raw.deep || ''),
    plain: String(raw.plain || ''),
    tags: dedupeTags(raw.tags),
    source: {
      kind: clean(src.kind) || clean(raw.sourceKind) || 'scripture',
      id: clean(src.id) || clean(raw.sourceId),
      label: clean(src.label) || 'Saved into Study',
      where: clean(src.where),
    },
  };
}

// --- Adapter: a curated Scripture verse -> a study seed ----------------------
// `verse` = { ref, kjv, gloss, role, themeId, themeTitle } (scriptures.allVerses shape).
export function studySeedFromVerse(verse = {}) {
  const ref = clean(verse.ref);
  const kjv = clean(verse.kjv);
  const gloss = clean(verse.gloss);
  const theme = clean(verse.themeTitle);
  const deepParts = [];
  if (kjv) deepParts.push(`"${kjv}" (${ref}, KJV)`);
  if (gloss) deepParts.push(gloss);
  if (theme) deepParts.push(`Theme: ${theme}.`);
  return normalizeSeed({
    sourceKind: 'scripture',
    sourceId: ref,
    title: ref || 'Scripture',
    scripture: ref,
    deep: deepParts.join('\n\n'),
    tags: ['scripture', verse.themeId].filter(Boolean),
    source: { kind: 'scripture', id: ref, label: `Scripture · ${ref}`, where: 'Church › Scripture' },
  });
}

// --- Adapter: a Scripture theme -> a study seed ------------------------------
// `theme` = a THEMES entry; `depthText` is the resolved teaching at the chosen tier
// (the caller passes resolveDepth(theme, tier).text so we don't re-import the engine).
export function studySeedFromTheme(theme = {}, opts = {}) {
  const depth = clean(opts.depthText) || clean(theme.blurb);
  const verses = arr(theme.verses).map((v) => clean(v.ref)).filter(Boolean);
  const deepParts = [clean(theme.title), depth].filter(Boolean);
  if (verses.length) deepParts.push(`Verses: ${verses.join('; ')}.`);
  return normalizeSeed({
    sourceKind: 'theme',
    sourceId: clean(theme.id),
    title: clean(theme.title) || 'Theme',
    scripture: verses.join('; '),
    deep: deepParts.join('\n\n'),
    tags: ['theme'].concat(arr(theme.interests)),
    source: { kind: 'theme', id: clean(theme.id), label: `Scripture theme · ${clean(theme.title)}`, where: 'Church › Scripture' },
  });
}

// --- Adapter: the connections web -> a study seed ----------------------------
// `connections` = connectionsFor(ref) output. Captures the verse text, its themes,
// the classic + curated cross-refs, and the word study — a rich starting point.
export function studySeedFromConnections(connections = {}) {
  const ref = clean(connections.ref);
  const kjv = clean(connections.text && connections.text.kjv);
  const crossRefs = arr(connections.crossRefs).map((c) => clean(c.ref)).filter(Boolean);
  const themes = arr(connections.themes).map((t) => clean(t.themeTitle)).filter(Boolean);
  const words = arr(connections.wordStudy)
    .map((w) => `${clean(w.word)} (${clean(w.original)} · ${clean(w.translit)} · ${clean(w.strongs)}) — ${clean(w.gloss)}`)
    .filter((s) => s.replace(/[—·()]/g, '').trim());
  const deepParts = [];
  if (kjv) deepParts.push(`"${kjv}" (${ref}, KJV)`);
  if (themes.length) deepParts.push(`Themes: ${themes.join('; ')}.`);
  if (crossRefs.length) deepParts.push(`Cross-references: ${crossRefs.join('; ')}.`);
  if (words.length) deepParts.push(`Word study:\n- ${words.join('\n- ')}`);
  return normalizeSeed({
    sourceKind: 'connections',
    sourceId: ref,
    title: `${ref} — connections`,
    scripture: ref,
    deep: deepParts.join('\n\n'),
    tags: ['scripture', 'connections', 'word-study'],
    source: { kind: 'connections', id: ref, label: `Connections · ${ref}`, where: 'Church › Scripture › Connections' },
  });
}

// --- Adapter: a discernment lesson -> a study seed ---------------------------
// `module` = a buildDiscernmentModule output (or any Learn module with lesson/anchor).
export function studySeedFromDiscernment(module = {}) {
  const id = clean(module.id);
  const anchorRef = clean(module.anchor && module.anchor.ref);
  const deepParts = [clean(module.bigIdea), clean(module.lesson)].filter(Boolean);
  return normalizeSeed({
    sourceKind: 'discernment',
    sourceId: id,
    title: clean(module.title) || 'Discernment lesson',
    scripture: anchorRef,
    deep: deepParts.join('\n\n'),
    tags: ['discernment', 'learn'],
    source: { kind: 'discernment', id, label: `Discernment · ${clean(module.title)}`, where: 'Church › Learn' },
  });
}

// --- Adapter: a sermon (The Word) -> a study seed ----------------------------
export function studySeedFromSermon(sermon = {}) {
  const id = clean(sermon.id);
  const ref = clean(sermon.scriptureRef || sermon.scripture_ref);
  const deepParts = [clean(sermon.notes), sermon.speaker ? `Delivered by ${clean(sermon.speaker)}.` : '']
    .filter(Boolean);
  return normalizeSeed({
    sourceKind: 'sermon',
    sourceId: id,
    title: clean(sermon.title) || 'The Word',
    scripture: ref,
    deep: deepParts.join('\n\n') || clean(sermon.title),
    tags: ['the-word', 'sermon'],
    source: { kind: 'sermon', id, label: `The Word · ${clean(sermon.title)}`, where: 'Church › The Word' },
  });
}
