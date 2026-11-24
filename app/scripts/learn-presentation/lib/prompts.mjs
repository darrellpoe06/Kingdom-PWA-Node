// =============================================================================
// prompts — what the text model is told, and how its answer is checked
// =============================================================================
// The model reads the lesson (title, big idea, the adult text or the nearest
// age version) and returns STRICT JSON. It never sees an instruction to edit
// the lesson, and nothing it returns is written to a lesson: the answer only
// becomes a presentation record beside the lesson's existing id.
// =============================================================================

// Visual direction per department (spec §6). The department names are the
// catalog's own; a department not listed falls back to the unified brand.
export const DEPARTMENT_VISUALS = Object.freeze({
  'Living Lessons': 'inspiring, uplifting human moments in bright natural daylight, real places, expressive faces',
  'The Word & The Way': 'faith and spiritual discovery; open landscapes, blue skies, green hills, families with open Bibles in daylight',
  'Real Estate': 'properties, homes, neighborhoods, closings, ownership',
  'Stock Market': 'financial markets, trading screens, charts, investors, financial districts',
  Business: 'entrepreneurship, storefronts, executives, professional growth',
  'Kingdom Life & Stewardship': 'responsibility, purpose, family, generations, stewardship of the home',
  History: 'documentary-style historical imagery, period-accurate settings in clear natural daylight, true color',
  Mathematics: 'bright, cheerful, colorful classrooms; children counting with real objects; joyful',
  Development: 'coding, programming, developers at work, modern technology',
  'A.I. The Way': 'dynamic, brightly lit technology spaces with vivid cyan, blue and violet light; people clearly in charge of machines',
  'Serve the House': 'ministry, service, church media and community volunteers',
  'Project Management': 'leadership, teamwork, planning boards, delegation',
  'The Eternal Algorithms': 'biblical principles meeting science and discovery; bright landscapes, order and patterns in creation, daylight',
});

// The PHOTOGRAPH has its own natural palette. The red/black/white/gold brand lives
// in the interface and the typography, never as a color filter on the picture.
// (Pilot 1 put 'deep blacks, warm gold light' here and every image came out dark
// and brown: mean luma 37.6/255. Owner direction 2026-11-24, DR in the session note.)
export const BRAND_LOOK =
  'Premium cinematic photography: exceptional composition and storytelling, bright natural daylight, high-key exposure, soft open shadows, neutral white balance, true-to-life natural skin tones, vivid natural color (greens, blues, reds), faces clearly visible and well lit, sharp focus, full-frame camera look. Composed like a premium YouTube thumbnail: the main person is large in the frame (medium close-up) on the right, face sharp, expressive and well lit with eyes visible; bright window daylight; clean light interiors or open sky; lush green plants; one bold color accent in clothing (red, cobalt blue or sunny yellow); softly blurred background.';

// Art-direction words that produced the dark, brown pilot. A v2 prompt holding
// any of them is refused before a cent is spent (prompts are checked, not trusted).
export const BANNED_ART_TERMS = Object.freeze([
  'dim',
  'dimly',
  'dark',
  'darkness',
  'shadowy',
  'deep black',
  'deep shadow',
  'candle',
  'candlelit',
  'oil lamp',
  'firelight',
  'night',
  'nighttime',
  'late-night',
  'silhouette',
  'moody',
  'low-key',
  'low key',
  'sunset',
  'dusk',
  'golden hour',
  'sunrise',
  'sepia',
  'brown filter',
  'orange filter',
  'dramatic lighting',
  'single light source',
  'negative space',
]);

/** The banned terms a prompt contains (whole words / phrases, case-insensitive). */
export function bannedArtTerms(prompt) {
  const s = ` ${String(prompt || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, ' ')} `;
  return BANNED_ART_TERMS.filter((t) => s.includes(` ${t} `));
}

const MAX_LESSON_CHARS = 14000;

/** The text the model reads: the adult version first, else the nearest age version. Read-only. */
export function lessonReading(lesson) {
  const levels = lesson && lesson.levels && typeof lesson.levels === 'object' ? lesson.levels : {};
  const pick = [lesson && lesson.lesson, levels.standard, levels.teen, levels.senior, levels.youth, levels.child].find(
    (t) => typeof t === 'string' && t.trim()
  );
  const text = pick || '';
  return text.length > MAX_LESSON_CHARS ? `${text.slice(0, MAX_LESSON_CHARS)}\n[... lesson continues]` : text;
}

export const SYSTEM_PROMPT = [
  'You write promotional presentation copy for lessons in a church learning app (The Love Corner). You never change the lesson; you only write the doorway that invites people in.',
  'Return ONLY a JSON object with exactly these string keys: displayTitle, thumbHeadline, promoDescription, imagePrompt, imageAlt. No markdown, no commentary.',
  'Rules:',
  '1. Read the whole lesson first. Every claim must be supported by the lesson. Do not imply content the lesson does not contain. No clickbait, no false promises, no guarantees, no exaggeration, no invented statistics.',
  '2. displayTitle: an engaging YouTube-style educational title (curiosity question, personal relevance, unexpected insight, contrast, problem/solution, transformation, practical application). It must NOT simply restate the original title.',
  '3. thumbHeadline: 2 to 5 words, ALL CAPS friendly, readable on a phone thumbnail. It must not be the original title and should complement, not repeat, the displayTitle.',
  '4. promoDescription: 1 to 2 plain sentences saying what the lesson actually teaches.',
  '5. In your OWN words, name the one true God by His covenant name "Yahweh" rather than the generic word "God" (house style). Never alter or paraphrase quoted Scripture, and do not quote Scripture in these fields.',
  '6. Capitalize references to Yahweh, Jesus, the Holy Spirit, the Father, the Son and the Word (Scripture), including He/His/Him for God. Never capitalize satan, lucifer, the devil or the adversary.',
  "7. imagePrompt: a detailed cinematic 16:9 PHOTOGRAPH prompt for a thumbnail background. Describe subject, setting, action, emotion, lighting, lens and composition. Use bright natural daylight and natural color; keep the main subject in the right half with a bright, uncluttered area on the left for a headline added later. Never a dark, dim, night, candlelit or silhouetted scene. The image itself must contain NO text, letters, numbers, logos, watermarks or signage. Where people appear (owner direction 2026-11-24, DR-1640): African American / Foundational Black American people are in EVERY picture, named plainly in the prompt as Black, across generations (children, families, elders, professionals), shown as capable and successful (owners, leaders, teachers, professionals, thriving families), never as a stereotype of need; about one picture in ten is also inclusive, with people of other groups in the frame beside them; dignified, realistic expressions; never a real or famous person's likeness; never a copyrighted character or another creator's branding. Never depict Jesus' face.",
  '8. imageAlt: one plain sentence describing the image for a screen reader.',
].join('\n');

export function userPrompt({ lesson, course, department, originalTitle, feedback = null, avoidTitles = [] }) {
  const parts = [
    `Department: ${department}`,
    `Department visual direction: ${DEPARTMENT_VISUALS[department] || 'cinematic, warm, human'}`,
    `Brand look: ${BRAND_LOOK}`,
    `Course: ${(course && course.title) || ''}`,
    `ORIGINAL TITLE (do not reuse as the headline; do not restate as the display title): ${originalTitle}`,
    lesson.bigIdea ? `Big idea: ${String(lesson.bigIdea).slice(0, 2000)}` : '',
    'LESSON TEXT:',
    lessonReading(lesson),
  ];
  if (avoidTitles.length) parts.push(`Display titles already used elsewhere (yours must differ): ${avoidTitles.slice(-60).join(' | ')}`);
  if (feedback) parts.push(`Your previous answer was rejected for: ${feedback}. Correct it and return the JSON again.`);
  return parts.filter(Boolean).join('\n\n');
}

export const KEYS = ['displayTitle', 'thumbHeadline', 'promoDescription', 'imagePrompt', 'imageAlt'];

/** The structured-output contract: the provider is FORCED to return exactly this object. */
export const COPY_SCHEMA = {
  type: 'object',
  properties: Object.fromEntries(KEYS.map((k) => [k, { type: 'string', minLength: 1 }])),
  required: KEYS,
  additionalProperties: false,
};

/** A model answer that could not be read as the copy object: a retryable fault, not an editorial one. */
export class CopyParseError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = 'CopyParseError';
  }
}
export const isParseFault = (msg) => /^(no JSON object in model output|invalid JSON|missing or empty|truncated)/.test(String(msg || ''));

/** Parse the model's answer. Tolerates a fenced block; demands every key as a non-empty string. */
export function parseCopy(raw) {
  const s = String(raw || '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start < 0 || end <= start) throw new CopyParseError('no JSON object in model output');
  let obj;
  try {
    obj = JSON.parse(s.slice(start, end + 1));
  } catch (e) {
    throw new CopyParseError(`invalid JSON: ${e.message}`, { cause: e });
  }
  for (const k of KEYS) {
    if (typeof obj[k] !== 'string' || !obj[k].trim()) throw new CopyParseError(`missing or empty "${k}"`);
    obj[k] = obj[k].trim();
  }
  return Object.fromEntries(KEYS.map((k) => [k, obj[k]]));
}

/** The final image prompt: the model's scene plus the fixed brand/format guard. */
export function finalImagePrompt(scene) {
  return `${scene}\n\n16:9 photograph, full-bleed edge to edge. ${BRAND_LOOK} Keep the main subject in the right half of the frame with a bright, uncluttered area on the left. No text, letters, numbers, logos, borders or watermarks anywhere in the image.`;
}
