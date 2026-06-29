// =============================================================================
// choir-sme-notes — keyboardist SME knowledge tests (proven-to-catch).
// Parse the pipeline's knowledge.json faithfully, attach the best note per song,
// surface guidance + orphans. Nothing is invented; unconfirmed stays unconfirmed.
// =============================================================================
import { describe, it, expect } from 'vitest';
import {
  parseKnowledgeJson, toSmeNoteShape, bestSmeNote, attachSmeNotes,
  generalGuidance, orphanSmeNotes, pendingSmeNotes,
} from '../lib/choir-sme-notes.js';

const KNOWLEDGE = {
  sme: { name: 'Christian', role: 'choir keyboardist' },
  songs: [
    { title: 'Total Praise', key_label: 'Ab', arrangement: 'Pad intro, choir on bar 4', note: 'Keep the intro simple; lift on the bridge.', confidence: 'high', source_quote: "We do it in Ab..." },
    { title: 'Way Maker', key_label: null, arrangement: null, note: null, confidence: 'low', source_quote: '' },
    { key_label: 'C' }, // no title -> dropped (can't link, never guessed)
  ],
  general_guidance: [
    { topic: 'Dynamics', guidance: 'Watch my hands; breathe at phrase ends.', source_quote: 'Watch my hands...' },
  ],
  unclear: ['Confirm the key for the closing song'],
};

describe('parseKnowledgeJson — faithful to the handoff contract', () => {
  it('maps songs field-for-field and carries provenance', () => {
    const { notes, sme } = parseKnowledgeJson(KNOWLEDGE, { sourceVideo: 'christian-01.mp4', sourceRun: 'run-1' });
    expect(sme).toEqual({ name: 'Christian', role: 'choir keyboardist' });
    const total = notes.find((n) => n.titleKey === 'total praise');
    expect(total).toMatchObject({
      kind: 'song', titleDisplay: 'Total Praise', songKey: 'Ab',
      arrangement: 'Pad intro, choir on bar 4', confidence: 'high',
      sourceVideo: 'christian-01.mp4', sourceRun: 'run-1', smeName: 'Christian',
    });
  });
  it('PROVEN-TO-CATCH: a song with no title is dropped, not guessed', () => {
    const { notes } = parseKnowledgeJson(KNOWLEDGE);
    expect(notes.filter((n) => n.kind === 'song')).toHaveLength(2); // not 3
  });
  it('null fields stay null (no fabrication)', () => {
    const { notes } = parseKnowledgeJson(KNOWLEDGE);
    const way = notes.find((n) => n.titleKey === 'way maker');
    expect(way.songKey).toBe(null);
    expect(way.howToPlay).toBe(null);
    expect(way.confidence).toBe('low');
  });
  it('parses guidance + unclear; accepts a JSON string', () => {
    const { notes, unclear } = parseKnowledgeJson(JSON.stringify(KNOWLEDGE));
    expect(notes.find((n) => n.kind === 'guidance')).toMatchObject({ topic: 'Dynamics' });
    expect(unclear).toEqual(['Confirm the key for the closing song']);
  });
  it('invalid confidence is nulled, not passed through', () => {
    const { notes } = parseKnowledgeJson({ songs: [{ title: 'X', confidence: 'maybe' }] });
    expect(notes[0].confidence).toBe(null);
  });
  it('a malformed string throws (caller catches -> bad-json)', () => {
    expect(() => parseKnowledgeJson('{not json')).toThrow();
  });
});

describe('bestSmeNote — reviewed beats extracted, then confidence, then recency', () => {
  it('prefers a reviewed note over a higher-confidence extracted one', () => {
    const best = bestSmeNote([
      { status: 'extracted', confidence: 'high', createdAt: '2026-06-01' },
      { status: 'reviewed', confidence: 'low', createdAt: '2026-06-02' },
    ]);
    expect(best.status).toBe('reviewed');
  });
  it('among extracted, higher confidence wins', () => {
    const best = bestSmeNote([
      { status: 'extracted', confidence: 'low', createdAt: '2026-06-03' },
      { status: 'extracted', confidence: 'high', createdAt: '2026-06-01' },
    ]);
    expect(best.confidence).toBe('high');
  });
});

const songbook = [{ titleKey: 'total praise', title: 'Total Praise' }, { titleKey: 'way maker', title: 'Way Maker' }];
const notes = [
  { id: 'n1', kind: 'song', titleKey: 'total praise', status: 'reviewed', confidence: 'high', songKey: 'Ab' },
  { id: 'n2', kind: 'song', titleKey: 'way maker', status: 'extracted', confidence: 'low', songKey: 'B' },
  { id: 'n3', kind: 'song', titleKey: 'goodness of god', status: 'extracted', titleDisplay: 'Goodness of God' },
  { id: 'g1', kind: 'guidance', status: 'reviewed', guidance: 'Breathe together.' },
];

describe('attachSmeNotes — confirmed knowledge rides on the song', () => {
  it('attaches a reviewed note to its song', () => {
    const out = attachSmeNotes(songbook, notes);
    expect(out.find((s) => s.titleKey === 'total praise').sme.songKey).toBe('Ab');
  });
  it('PROVEN-TO-CATCH: an extracted (unconfirmed) note does NOT ride for the choir by default', () => {
    const out = attachSmeNotes(songbook, notes);
    expect(out.find((s) => s.titleKey === 'way maker').sme).toBeUndefined();
  });
  it('the director view (includeExtracted) DOES see the unconfirmed note', () => {
    const out = attachSmeNotes(songbook, notes, { includeExtracted: true });
    expect(out.find((s) => s.titleKey === 'way maker').sme.songKey).toBe('B');
  });
  it('does not mutate the input songbook', () => {
    attachSmeNotes(songbook, notes, { includeExtracted: true });
    expect(songbook[0].sme).toBeUndefined();
  });
});

describe('guidance / orphans / pending', () => {
  it('generalGuidance returns guidance notes', () => {
    expect(generalGuidance(notes).map((g) => g.id)).toEqual(['g1']);
  });
  it('orphanSmeNotes finds notes whose song is not in the repertoire', () => {
    expect(orphanSmeNotes(notes, songbook).map((n) => n.titleKey)).toEqual(['goodness of god']);
  });
  it('pendingSmeNotes returns only the extracted ones', () => {
    expect(pendingSmeNotes(notes).map((n) => n.id).sort()).toEqual(['n2', 'n3']);
  });
});

describe('toSmeNoteShape — DB row -> shape', () => {
  it('maps snake_case columns', () => {
    const shape = toSmeNoteShape({ id: 'x', kind: 'song', title_key: 'k', song_key: 'Ab', how_to_play: 'do it', status: 'reviewed' });
    expect(shape).toMatchObject({ id: 'x', titleKey: 'k', songKey: 'Ab', howToPlay: 'do it', status: 'reviewed', smeName: 'Christian' });
  });
});
