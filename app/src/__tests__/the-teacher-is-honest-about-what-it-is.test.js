// THE TEACHER IS HONEST ABOUT WHAT IT IS (DR-0430).
// =============================================================================
// Darrell 2026-09-15: an AI version of himself — voice, image, likeness — as
// the teacher of the lessons. The resolver below decides, per device, what
// that teacher can honestly do, and it is held to three rules, each
// proven-to-catch here:
//   • nothing is 'real' without the studio armed AND the sample on this
//     device AND the person's own consent row;
//   • every label begins "AI-generated";
//   • no likeness enrolment → no Teacher at all.
import { describe, it, expect } from 'vitest';
import { resolveTeacher, teacherLabel, likenessConsented, teacherIntroText, TEACHER_PERSONA } from '../lib/teacher.js';

const granted = { personKey: 'darrell', displayName: 'Darrell Poe', consentState: 'granted', meta: { likeness_consent_at: '2026-09-15T00:00:00Z' } };
const voiceOnly = { personKey: 'darrell', displayName: 'Darrell Poe', consentState: 'granted', meta: {} };

describe('likeness consent is a row, not a guess', () => {
  it('needs a GRANTED voice row carrying the likeness stamp', () => {
    expect(likenessConsented(granted)).toBe(true);
    expect(likenessConsented(voiceOnly)).toBe(false);
    expect(likenessConsented({ ...granted, consentState: 'revoked' })).toBe(false);
    expect(likenessConsented(null)).toBe(false);
  });
});

describe('resolveTeacher never says real without the whole chain', () => {
  it('everything armed and enrolled → real voice, real likeness', () => {
    const t = resolveTeacher({ profile: granted, voiceReady: true, avatarReady: true, hasVoiceSample: true, hasPortrait: true });
    expect(t).toMatchObject({ personKey: TEACHER_PERSONA, enrolled: true, voice: 'real', likeness: 'real' });
  });
  it('the likeness studio not armed → the portrait is STILL and says so', () => {
    const t = resolveTeacher({ profile: granted, voiceReady: true, avatarReady: false, hasVoiceSample: true, hasPortrait: true });
    expect(t.likeness).toBe('still');
    expect(t.label).toMatch(/still \(the likeness studio is not armed\)/);
  });
  it('the voice studio not armed → a stand-in voice, and the label says so', () => {
    const t = resolveTeacher({ profile: granted, voiceReady: false, avatarReady: true, hasVoiceSample: true, hasPortrait: true });
    expect(t.voice).toBe('stand-in');
    expect(t.label).toMatch(/stand-in device voice/);
  });
  it('no sample on this device → not real, even with the studio armed', () => {
    expect(resolveTeacher({ profile: granted, voiceReady: true, avatarReady: true, hasVoiceSample: false, hasPortrait: true }).voice).toBe('stand-in');
    expect(resolveTeacher({ profile: granted, voiceReady: true, avatarReady: true, hasVoiceSample: true, hasPortrait: false }).likeness).toBe('none');
  });
  it('no likeness enrolment → not enrolled, no likeness — the panel will not render', () => {
    const t = resolveTeacher({ profile: voiceOnly, voiceReady: true, avatarReady: true, hasVoiceSample: true, hasPortrait: true });
    expect(t.enrolled).toBe(false);
    expect(t.likeness).toBe('none');
    expect(resolveTeacher({}).enrolled).toBe(false);
    expect(resolveTeacher({}).voice).toBe('none');
  });
  it('every label begins AI-generated, in every combination', () => {
    for (const voice of ['real', 'stand-in', 'none']) for (const likeness of ['real', 'still', 'none']) {
      expect(teacherLabel({ voice, likeness }).startsWith('AI-generated')).toBe(true);
    }
  });
});

describe('what the teacher says', () => {
  it('is the lesson hook: title, big idea, anchor theme — never empty for a real module', () => {
    const t = teacherIntroText({ title: 'Pride Is Not Worth Him', bigIdea: 'PRIDE IS NOT WORTH HIM.', anchor: { theme: 'KJV: "Pride goeth before destruction" (Proverbs 16:18)' } });
    expect(t).toMatch(/^Pride Is Not Worth Him\. PRIDE IS NOT WORTH HIM\. KJV:/);
    expect(teacherIntroText(null)).toBe('');
  });
});
