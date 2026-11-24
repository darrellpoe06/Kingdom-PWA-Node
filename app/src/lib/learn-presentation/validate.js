// =============================================================================
// learn-presentation/validate — the checks every promotional record must pass
// before a person reviews it (spec §4, §5, §10; CLAUDE.md Typographic Theology)
// =============================================================================
// Machine checks only. They catch what a machine can catch (a missing lesson,
// a drifted original title, a duplicate, a headline that is the original
// title, a generic "God" in our authored voice); the author's approval in the
// review dashboard remains the authority on whether a title is TRUE to the
// lesson. Returns { errors, warnings } as arrays of { lessonId, code, detail }.
// =============================================================================

const words = (s) =>
  String(s || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

// Phrases that promise what no lesson can deliver. A title may ask; it may not guarantee.
const OVERPROMISE = /\b(guaranteed?|instantly|secret (?:they|nobody)|you won'?t believe|never fail|get rich quick|100%)\b/i;

export function validateRecords(records, courses) {
  const errors = [];
  const warnings = [];
  const err = (lessonId, code, detail) => errors.push({ lessonId, code, detail });
  const warn = (lessonId, code, detail) => warnings.push({ lessonId, code, detail });

  const lessonById = new Map();
  for (const c of Array.isArray(courses) ? courses : []) {
    const key = c.key || (c.meta && c.meta.key);
    for (const l of c.schedule || []) if (l && l.id) lessonById.set(`${key}::${l.id}`, l);
  }

  const seenTitle = new Map();
  const seenHeadline = new Map();
  for (const r of Array.isArray(records) ? records : []) {
    const id = r && r.lessonId;
    const lesson = lessonById.get(`${r.courseKey}::${id}`);
    if (!lesson) {
      err(id, 'no-such-lesson', `${r.courseKey}::${id} is not a mounted lesson`);
      continue;
    }
    if (r.originalTitleAtApproval !== lesson.title) err(id, 'original-title-drift', `record has "${r.originalTitleAtApproval}", lesson has "${lesson.title}"`);
    const dt = String(r.displayTitle || '').trim();
    const hl = String(r.thumbHeadline || '').trim();
    if (!dt) err(id, 'no-display-title', '');
    if (!hl) err(id, 'no-headline', '');
    if (dt && norm(dt) === norm(lesson.title)) err(id, 'display-is-original', 'a display title must not simply repeat the original');
    const hw = words(hl).length;
    if (hl && (hw < 2 || hw > 5)) warn(id, 'headline-length', `${hw} words (target 2–5)`);
    const origLead = norm(String(lesson.title).split(/[—:-]/)[0]);
    if (hl && origLead && norm(hl) === origLead) err(id, 'headline-is-original', 'the thumbnail headline must not be the original title');
    if (hl && dt && norm(hl) === norm(dt)) warn(id, 'headline-repeats-title', 'headline and display title should complement, not repeat');
    for (const [field, text] of [
      ['displayTitle', dt],
      ['thumbHeadline', hl],
      ['promoDescription', r.promoDescription],
    ]) {
      if (/\bGod\b/.test(String(text || ''))) err(id, 'generic-god', `${field}: our authored voice names Yahweh (CLAUDE.md, DR-0210)`);
      if (OVERPROMISE.test(String(text || ''))) err(id, 'overpromise', `${field}: "${text}"`);
    }
    if (!r.visual || !String(r.visual.alt || '').trim()) err(id, 'no-alt-text', 'every thumbnail needs an accessible description');
    if (r.image && !r.image.src) err(id, 'image-without-src', '');
    const kt = norm(dt);
    if (kt) {
      if (seenTitle.has(kt)) err(id, 'duplicate-display-title', `same as ${seenTitle.get(kt)}`);
      else seenTitle.set(kt, id);
    }
    const kh = norm(hl);
    if (kh) {
      if (seenHeadline.has(kh)) warn(id, 'duplicate-headline', `same as ${seenHeadline.get(kh)}`);
      else seenHeadline.set(kh, id);
    }
  }
  return { errors, warnings };
}
