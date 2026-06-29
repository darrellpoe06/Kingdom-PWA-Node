import { describe, it, expect } from 'vitest';
import {
  normalizeSeed, studySeedFromVerse, studySeedFromTheme, studySeedFromConnections,
  studySeedFromDiscernment, studySeedFromSermon,
} from '../lib/studyable.js';

describe('studyable — the save-into-Study contract', () => {
  it('normalizeSeed fills defaults and a valid room kind', () => {
    const s = normalizeSeed({ title: 'x', kind: 'bogus' });
    expect(s.kind).toBe('research');           // invalid kind -> research
    expect(s.sourceKind).toBe('scripture');
    expect(s.source.label).toBe('Saved into Study');
  });

  it('verse adapter carries the verbatim text + theme as the deep source', () => {
    const seed = studySeedFromVerse({ ref: 'John 3:16', kjv: 'For God so loved...', gloss: 'the gospel in one verse', themeId: 'salvation', themeTitle: 'Salvation & the Soul' });
    expect(seed.sourceKind).toBe('scripture');
    expect(seed.sourceId).toBe('John 3:16');
    expect(seed.scripture).toBe('John 3:16');
    expect(seed.deep).toContain('For God so loved');
    expect(seed.deep).toContain('Salvation & the Soul');
    expect(seed.plain).toBe('');               // the user's distillation is the work
    expect(seed.source.where).toContain('Scripture');
  });

  it('theme adapter captures the teaching + verse list', () => {
    const seed = studySeedFromTheme(
      { id: 'salvation', title: 'Salvation & the Soul', blurb: 'the door', verses: [{ ref: 'John 3:16' }, { ref: 'Acts 4:12' }], interests: ['salvation'] },
      { depthText: 'The new birth...' },
    );
    expect(seed.sourceKind).toBe('theme');
    expect(seed.scripture).toBe('John 3:16; Acts 4:12');
    expect(seed.deep).toContain('The new birth');
    expect(seed.tags).toContain('salvation');
  });

  it('connections adapter folds cross-refs + word study into one rich seed', () => {
    const seed = studySeedFromConnections({
      ref: 'John 3:16',
      text: { kjv: 'For God so loved...' },
      themes: [{ themeTitle: 'Salvation & the Soul' }],
      crossRefs: [{ ref: 'Romans 5:8' }, { ref: '1 John 4:9-10' }],
      wordStudy: [{ word: 'loved', original: 'ἠγάπησεν', translit: 'ēgapēsen', strongs: 'G25', gloss: 'agapaō' }],
    });
    expect(seed.sourceKind).toBe('connections');
    expect(seed.deep).toContain('Cross-references: Romans 5:8; 1 John 4:9-10');
    expect(seed.deep).toContain('G25');
    expect(seed.tags).toContain('word-study');
  });

  it('discernment + sermon adapters produce labeled, attributed seeds', () => {
    const d = studySeedFromDiscernment({ id: 'musk-issue', title: 'A claim', bigIdea: 'how to think it through', lesson: 'the walk-through', anchor: { ref: '1 Thessalonians 5:21' } });
    expect(d.sourceKind).toBe('discernment');
    expect(d.scripture).toBe('1 Thessalonians 5:21');
    expect(d.deep).toContain('the walk-through');

    const s = studySeedFromSermon({ id: 'm1', title: 'For God So Loved', scriptureRef: 'John 3:16', speaker: 'Bishop Gwin', notes: 'theme: love that gives' });
    expect(s.sourceKind).toBe('sermon');
    expect(s.deep).toContain('love that gives');
    expect(s.deep).toContain('Bishop Gwin');
  });
});
