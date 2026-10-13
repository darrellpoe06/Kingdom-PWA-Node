// =============================================================================
// voice-tutor — the study->spoken-script transform for the HEAR-the-teaching
// tutor (COMMUNITY-FIRST accessibility). Proven-to-catch guards on the two
// things that MUST hold (DR-0076 / WORD-FIRST): the tutor speaks the study in
// teaching order, and it NEVER fabricates the Word — verse text is spoken only
// when the resolver supplies it, otherwise the listener is sent to their Bible.
// Pinned against the REAL study #1 (conditional-truth), not a fixture.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { getStudy } from '../lib/eternal-algorithms-studies.js';
import { buildTutorScript, toSpeech, SEGMENT_KINDS } from '../lib/voice-tutor.js';

const study = getStudy('conditional-truth');
// A resolver standing in for the in-app KJV: returns real-looking text per ref.
const resolveVerse = (ref) => `«the verbatim Word for ${ref}»`;
const kinds = (segs) => segs.map((s) => s.kind);

describe('buildTutorScript — teaches the real study in order', () => {
  it('opens with an intro carrying the study title + subtitle', () => {
    const segs = buildTutorScript(study, { resolveVerse });
    expect(segs[0].kind).toBe('intro');
    expect(segs[0].text).toContain(study.title);
    expect(segs[0].text).toContain(study.subtitle);
    expect(segs[segs.length - 1].kind).toBe('close');
  });

  it('speaks heading -> teaching -> verse for each section, in section order', () => {
    const segs = buildTutorScript(study, { resolveVerse });
    // Every real section heading + plain teaching is spoken.
    for (const section of study.sections) {
      const headingSeg = segs.find((s) => s.kind === 'heading' && s.text === section.heading.replace(/\s+/g, ' ').trim());
      expect(headingSeg, `heading spoken: ${section.heading}`).toBeTruthy();
    }
    // The first section's heading precedes its teaching precedes its verse.
    const iHead = segs.findIndex((s) => s.kind === 'heading');
    const iTeach = segs.findIndex((s, n) => n > iHead && s.kind === 'teaching');
    const iVerse = segs.findIndex((s, n) => n > iTeach && s.kind === 'verse');
    expect(iHead).toBeGreaterThan(-1);
    expect(iTeach).toBeGreaterThan(iHead);
    expect(iVerse).toBeGreaterThan(iTeach);
  });

  it('reads the RESOLVED Word (labelled "the Word") for a section with a primaryRef', () => {
    const segs = buildTutorScript(study, { resolveVerse });
    const first = study.sections.find((s) => s.primaryRef);
    const verseSeg = segs.find((s) => s.kind === 'verse' && s.ref === first.primaryRef);
    expect(verseSeg).toBeTruthy();
    expect(verseSeg.text).toContain('The Word says');
    expect(verseSeg.text).toContain(first.primaryRef);
    expect(verseSeg.text).toContain(resolveVerse(first.primaryRef));
  });

  it('NEVER fabricates the Word — an unresolved verse sends the listener to their Bible', () => {
    const segs = buildTutorScript(study, { resolveVerse: () => null });
    const verseSegs = segs.filter((s) => s.kind === 'verse');
    expect(verseSegs.length).toBeGreaterThan(0);
    for (const seg of verseSegs) {
      expect(seg.text).toContain('Open your Bible');
      expect(seg.text).toContain(seg.ref);
      // no invented verse content, and never the false-authority "The Word says"
      expect(seg.text).not.toContain('The Word says');
    }
  });

  it('includeDeep adds each section deeper layer; default omits it', () => {
    const shallow = buildTutorScript(study, { resolveVerse });
    const deep = buildTutorScript(study, { resolveVerse, includeDeep: true });
    expect(shallow.some((s) => s.kind === 'deep')).toBe(false);
    expect(deep.some((s) => s.kind === 'deep')).toBe(true);
    expect(deep.length).toBeGreaterThan(shallow.length);
  });

  it('every emitted segment kind is a known kind', () => {
    const segs = buildTutorScript(study, { resolveVerse, includeDeep: true });
    for (const s of segs) expect(SEGMENT_KINDS).toContain(s.kind);
  });
});

describe('buildTutorScript — unbreakable on bad input', () => {
  it('a study with no sections still yields intro + close, no throw', () => {
    const segs = buildTutorScript({ title: 'Empty', subtitle: 'none' }, { resolveVerse });
    expect(kinds(segs)).toEqual(['intro', 'close']);
  });

  it('null / undefined study does not throw and still speaks something', () => {
    expect(() => buildTutorScript(null)).not.toThrow();
    expect(() => buildTutorScript(undefined)).not.toThrow();
    const segs = buildTutorScript(null);
    expect(segs[0].kind).toBe('intro');
    expect(segs[0].text).toBeTruthy();
  });
});

describe('toSpeech — joins the script for tts.speak', () => {
  it('concatenates segment text in order, skipping blanks', () => {
    const segs = buildTutorScript(study, { resolveVerse });
    const speech = toSpeech(segs);
    expect(speech).toContain(study.title);
    expect(speech).toContain('The Word says');
    // order preserved: intro text appears before the close line
    expect(speech.indexOf(study.title)).toBeLessThan(speech.indexOf('run it'));
  });

  it('is safe on empty / non-array input', () => {
    expect(toSpeech([])).toBe('');
    expect(toSpeech(null)).toBe('');
    expect(toSpeech(undefined)).toBe('');
  });
});
