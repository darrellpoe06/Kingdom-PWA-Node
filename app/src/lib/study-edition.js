// =============================================================================
// study-edition — the PoeTech Study Edition: a faithful CLARIFICATION layer over
// the public-domain Scripture text. (Darrell 2026-06-25.)
// =============================================================================
// What this is, and — just as importantly — what it is NOT.
//
//   It IS a study edition: the inspired Word, reproduced VERBATIM from public-
//   domain base texts (WEB + KJV), set beside our OWN clarification — plain
//   language, the 4D frame, Yahweh-context, original-language word study, honest
//   textual notes, and evenhanded handling of high-sensitivity doctrine.
//
//   It is NOT a new translation and NOT a rewrite of Scripture. We never reword
//   the text. We never present our clarification AS the inspired Word. The
//   difference between an amplified STUDY bible and ALTERING Scripture is exactly
//   this line, and this module exists to hold it.
//
// THE INTEGRITY GUARDRAIL (binding, machine-checked):
//   Two layers, structurally distinct and clearly labeled, never merged:
//     • SCRIPTURE  — base-text editions, verbatim, version+license labeled. Text.
//     • CLARIFY    — our commentary. Commentary. Plainly marked "not Scripture."
//   buildStudyEntry() keeps them in separate objects; checkSeparation() PROVES
//   they never cross (DR-0076: a green check must mean something — the test
//   tampers and asserts the guardrail catches it).
//
// SOVEREIGN: the base text is public domain and the clarification is ours, so the
// whole edition is free to use across the app (library, lessons, presenter,
// discernment) with no external licensing limits.
//
// DOCTRINE: where a reading is genuinely contested (the Godhead, a disputed text),
// we present the main biblical views FAIRLY and flag the call for the SMEs (Bishop
// Gwin / Darrell). We do not invent a position and do not present one as settled.
// =============================================================================
import { editionText, crossRefsFor, normalizeRef } from './scriptures.js';
import { reproducibleEditions, editionById } from './bible-editions.js';

// The two layers, named once. Surfaces and tests both read these so the labels
// can never silently drift apart.
export const LAYER = {
  SCRIPTURE: 'scripture',
  CLARIFICATION: 'clarification',
};

export const LAYER_LABELS = {
  scripture: 'Scripture text — public domain, reproduced verbatim',
  clarification: 'Clarification — PoeTech Study Edition (study notes, not Scripture)',
};

// The binding banner every surface shows so a reader is never confused about which
// is which. Short, plain, honest.
export const INTEGRITY_BANNER =
  'The Scripture text below is the Word, reproduced word-for-word from a public-domain '
  + 'Bible. The clarification beside it is our study help — it explains the Word; it is '
  + 'not the Word itself, and it is never a substitute for reading the text.';

// -----------------------------------------------------------------------------
// CLARIFICATIONS — the ownable layer, keyed by reference. Each entry is OUR study
// help, written to the governing lens (Yahweh's perspective + His love, grace AND
// truth, no condemnation). Fields are all optional except `plain`.
//
//   plain         — one plain-language explanation of what the verse says.
//   fourD         — { source, plain, benefits }: deep source → plain → benefits.
//   yahwehContext — how this reads in the context of Yahweh (His heart/purpose).
//   wordStudy     — [{ word, original, translit, strongs, gloss, note }] — PD
//                   Strong's (1890) word-level insight. SEED set; the full tagged
//                   layer comes from STEPBible TAGNT/TAHOT (CC BY 4.0).
//   godheadViews  — [{ name, summary, scriptures }] presented EVENHANDEDLY; carries
//                   `sme: true` to mark it a doctrinal call for the SMEs.
//   textNotes     — [{ kind, note }] honest notes about the text itself (e.g. a
//                   disputed reading visible between our two base editions).
// -----------------------------------------------------------------------------
export const CLARIFICATIONS = {
  'John 3:16': {
    plain: 'God’s love moved first and gave the most — His own Son — so that anyone who '
      + 'trusts Him is not lost but has life that never ends. The offer is for "whoever."',
    fourD: {
      source: 'ἠγάπησεν ὁ θεὸς τὸν κόσμον — God so loved the world. The verb is in the past '
        + 'tense of a settled act: love already proven at the cross (Romans 5:8), not love '
        + 'we must earn. "Gave" (ἔδωκεν) is the same costly giving the OT sacrifice pointed to.',
      plain: 'God loves the whole world and proved it by giving His Son. Trust Him and you '
        + 'will not perish — you will live forever.',
      benefits: 'Removes the fear that you must qualify first. The door is "whoever," so it '
        + 'includes you; the security is "shall not perish," so it holds.',
    },
    yahwehContext: 'This is the Father’s heart stated plainly: He is not scanning for reasons '
      + 'to condemn (John 3:17) — He gave at His own cost to bring His children home. The whole '
      + 'platform orbits this one verse.',
    wordStudy: [
      { word: 'loved', original: 'ἠγάπησεν', translit: 'ēgapēsen', strongs: 'G25',
        gloss: 'agapaō — to love with deliberate, self-giving choice', note: 'Not mere affection; love that acts and gives.' },
      { word: 'world', original: 'κόσμον', translit: 'kosmon', strongs: 'G2889',
        gloss: 'kosmos — the ordered world; here, all of humanity', note: 'The scope is everyone, not a select few.' },
      { word: 'only begotten / one and only', original: 'μονογενῆ', translit: 'monogenē', strongs: 'G3439',
        gloss: 'monogenēs — one of a kind, unique Son',
        note: 'KJV renders "only begotten"; WEB renders "one and only" — same Greek word, '
          + 'two faithful English choices. A live example of why we show both base editions.' },
    ],
    textNotes: [
      { kind: 'translation-choice',
        note: 'KJV "only begotten Son" vs WEB "one and only Son" both translate μονογενῆ (G3439). '
          + 'Neither is a change to the text — they are two public-domain renderings of one word. '
          + 'Compare them in the Scripture column above; the clarification only explains the choice.' },
    ],
  },

  'Acts 4:12': {
    plain: 'Rescue is found in one Person — Jesus. Peter, on trial, says there is no other '
      + 'name given to humanity by which we must be saved.',
    fourD: {
      source: 'οὐκ ἔστιν ἐν ἄλλῳ οὐδενὶ ἡ σωτηρία — "there is salvation in no one else." '
        + 'Spoken by a Spirit-filled Peter (Acts 4:8) before the same council that condemned Jesus.',
      plain: 'There is only one name that saves: Jesus. Not many roads — one bridge.',
      benefits: 'Settles where to look. You don’t have to assemble your own way to God; the '
        + 'one way is already given, and it is open to all who call (Romans 10:13).',
    },
    yahwehContext: 'The exclusivity is not Yahweh being narrow for its own sake — it is the '
      + 'simple truth that there is one bridge across a gap we could not cross ourselves, and '
      + 'He built it, at His own cost, for everyone.',
    wordStudy: [
      { word: 'salvation', original: 'σωτηρία', translit: 'sōtēria', strongs: 'G4991',
        gloss: 'sōtēria — rescue, deliverance, safety', note: 'Rescue from real danger — not a metaphor.' },
      { word: 'saved', original: 'σωθῆναι', translit: 'sōthēnai', strongs: 'G4982',
        gloss: 'sōzō — to save, heal, make whole', note: 'The same word used for healing — wholeness, not only escape.' },
    ],
  },

  '2 Corinthians 5:17': {
    plain: 'Anyone joined to Christ is a new creation. The old is genuinely gone; everything '
      + 'has become new. Salvation is a new birth, not a touch-up of the old self.',
    fourD: {
      source: 'εἴ τις ἐν Χριστῷ, καινὴ κτίσις — "if anyone is in Christ, a new creation." '
        + 'καινή (kainē) is new in KIND, not merely new in time — a different order of thing.',
      plain: 'In Christ you are made new — not repaired, re-created. Your past does not define '
        + 'the new you.',
      benefits: 'Frees you from being defined by what you were. The verdict is "new," present '
        + 'tense, already true of everyone in Christ.',
    },
    yahwehContext: 'Yahweh does not rehabilitate the old self; He makes a new one. That is the '
      + 'measure of the grace — not improvement, re-creation.',
    wordStudy: [
      { word: 'new', original: 'καινή', translit: 'kainē', strongs: 'G2537',
        gloss: 'kainos — new in kind/quality, fresh', note: 'New in nature, not just new in time (which would be νέος).' },
      { word: 'creation', original: 'κτίσις', translit: 'ktisis', strongs: 'G2937',
        gloss: 'ktisis — a creation, that which is created', note: 'The same word-family as God’s act of creating.' },
    ],
  },

  // FLAGSHIP integrity case: a disputed text that is visible RIGHT HERE between our
  // two public-domain editions. Handled with full honesty and routed to the SMEs.
  '1 John 5:7': {
    plain: 'This verse is famous for a textual question. In the KJV it names the Father, the '
      + 'Word, and the Holy Ghost as bearing record in heaven, "and these three are one." In '
      + 'the WEB (and the earliest Greek manuscripts) those words are not present. We show both '
      + 'and tell you the truth about the difference rather than hiding it.',
    yahwehContext: 'The doctrine of the one God in Father, Son, and Spirit does not stand or '
      + 'fall on this one disputed clause — it is taught across the whole of Scripture. Honesty '
      + 'about the text actually strengthens trust; we have nothing to fear from the facts.',
    textNotes: [
      { kind: 'comma-johanneum',
        note: 'The "Comma Johanneum" — the words "in heaven, the Father, the Word, and the Holy '
          + 'Ghost: and these three are one. And there are three that bear witness in earth" — is '
          + 'present in the KJV (from the Textus Receptus) but ABSENT from the earliest Greek '
          + 'manuscripts and from the WEB and modern critical texts. This is the single clearest '
          + 'reason our edition shows more than one base text: the reader sees the difference '
          + 'directly, in the Scripture column, not filtered through us.' },
    ],
    godheadViews: [
      { name: 'Trinitarian',
        summary: 'One God eternally existing as three distinct, co-equal Persons — Father, Son, '
          + 'and Holy Spirit. Held by most of the historic church.',
        scriptures: ['Matthew 28:19', 'John 1:1', '2 Corinthians 13:14'] },
      { name: 'Oneness',
        summary: 'One God who has revealed Himself in three manifestations or roles — Father, '
          + 'Son, and Spirit as modes of the one indivisible God. Held in Oneness Pentecostal '
          + 'and related traditions.',
        scriptures: ['Deuteronomy 6:4', 'Isaiah 9:6', 'Colossians 2:9', 'John 10:30'] },
      { sme: true,
        name: 'SME doctrinal call',
        summary: 'Which framing this edition emphasizes — and how — is a doctrinal decision for '
          + 'Bishop Gwin and Darrell, not for the system to settle. Both views above are stated '
          + 'as their adherents hold them, Word-first and evenhanded; the system presents, it '
          + 'does not divide. Flagged for SME confirmation before any teaching weight is assigned.',
        scriptures: [] },
    ],
  },
};

// -----------------------------------------------------------------------------
// buildStudyEntry — assemble the two-layer entry for a reference. The SCRIPTURE
// layer carries verbatim base-text editions (resolved from the canonical source,
// never retyped); the CLARIFICATION layer carries our study help. They are
// returned as SEPARATE objects, each self-labeling its layer. Returns null only
// if no base-text edition carries the reference at all.
//
//   opts.editions — array of edition ids to include (default: all reproducible).
// -----------------------------------------------------------------------------
export function buildStudyEntry(ref, opts = {}) {
  const key = normalizeRef(ref);
  const wantIds = Array.isArray(opts.editions) && opts.editions.length
    ? opts.editions
    : reproducibleEditions().map((e) => e.id);

  const editions = [];
  for (const id of wantIds) {
    const meta = editionById(id);
    if (!meta || !meta.reproduce) continue;
    const text = editionText(id, key);
    if (text == null) continue; // this edition doesn't carry the ref
    editions.push({
      versionId: id,
      version: meta.label,
      license: meta.license.label,
      text, // VERBATIM from the canonical source — never reworded
      reworded: false,
    });
  }
  if (!editions.length) return null;

  const clar = CLARIFICATIONS[key] || null;

  return {
    ref: key,
    scripture: {
      layer: LAYER.SCRIPTURE,
      label: LAYER_LABELS.scripture,
      editions,
    },
    clarification: clar
      ? {
        layer: LAYER.CLARIFICATION,
        label: LAYER_LABELS.clarification,
        owned: true, // ours; not Scripture
        plain: clar.plain || null,
        fourD: clar.fourD || null,
        yahwehContext: clar.yahwehContext || null,
        wordStudy: clar.wordStudy || [],
        godheadViews: clar.godheadViews || [],
        textNotes: clar.textNotes || [],
        crossRefs: crossRefsFor(key, 6).map((v) => v.ref),
      }
      : null,
  };
}

// References that have an authored clarification (the seed set, growing).
export function clarifiedRefs() {
  return Object.keys(CLARIFICATIONS);
}

// -----------------------------------------------------------------------------
// checkSeparation — THE INTEGRITY GUARDRAIL, as a function so a test can prove it
// catches a violation (DR-0076 proven-to-catch) and the UI can assert before
// render. It verifies, for a built entry:
//   1. Every Scripture edition's text is BYTE-EQUAL to the canonical base text —
//      i.e. no clarification string was substituted in, and the text was not
//      reworded.
//   2. The Scripture layer carries ONLY text (no commentary keys leaked in).
//   3. The clarification layer is correctly labeled as our commentary, not Scripture.
// Returns { ok, violations: [{ code, detail }] }.
// -----------------------------------------------------------------------------
const SCRIPTURE_ALLOWED_KEYS = new Set(['layer', 'label', 'editions']);
const EDITION_ALLOWED_KEYS = new Set(['versionId', 'version', 'license', 'text', 'reworded']);

export function checkSeparation(entry) {
  const violations = [];
  if (!entry || typeof entry !== 'object') {
    return { ok: false, violations: [{ code: 'no-entry', detail: 'entry is missing' }] };
  }

  const sc = entry.scripture;
  if (!sc || sc.layer !== LAYER.SCRIPTURE) {
    violations.push({ code: 'scripture-layer-missing', detail: 'scripture layer absent or mislabeled' });
  } else {
    for (const k of Object.keys(sc)) {
      if (!SCRIPTURE_ALLOWED_KEYS.has(k)) {
        violations.push({ code: 'commentary-leaked-into-scripture', detail: `unexpected key "${k}" in scripture layer` });
      }
    }
    for (const ed of sc.editions || []) {
      for (const k of Object.keys(ed)) {
        if (!EDITION_ALLOWED_KEYS.has(k)) {
          violations.push({ code: 'commentary-leaked-into-edition', detail: `unexpected key "${k}" in edition ${ed.versionId}` });
        }
      }
      if (ed.reworded !== false) {
        violations.push({ code: 'text-marked-reworded', detail: `edition ${ed.versionId} is not marked verbatim` });
      }
      const canonical = editionText(ed.versionId, entry.ref);
      if (canonical == null) {
        violations.push({ code: 'edition-not-canonical', detail: `edition ${ed.versionId} has no canonical source for ${entry.ref}` });
      } else if (ed.text !== canonical) {
        // The decisive check: the displayed Scripture text must equal the verbatim
        // public-domain source EXACTLY. Any tampering (e.g. a clarification string
        // dropped into a text field) fails here.
        violations.push({ code: 'scripture-text-altered', detail: `edition ${ed.versionId} text does not match the verbatim base text for ${entry.ref}` });
      }
    }
  }

  const cl = entry.clarification;
  if (cl) {
    if (cl.layer !== LAYER.CLARIFICATION) {
      violations.push({ code: 'clarification-mislabeled', detail: 'clarification layer is not labeled as clarification' });
    }
    if (cl.owned !== true) {
      violations.push({ code: 'clarification-not-marked-owned', detail: 'clarification is not marked as our commentary' });
    }
  }

  return { ok: violations.length === 0, violations };
}
