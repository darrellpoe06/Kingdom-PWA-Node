// @vitest-environment node
//
// The verses quoted inside a lesson are the in-app KJV, character for character
// (2026-10-21; lib/lesson-word-quotes.js). Each line re-reads the corpus the
// reader's own Bible opens (app/public/bible/kjv) and fails on any difference.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import QUOTES from '../lib/lesson-word-quotes.json';
import { wordQuotesFor, withWordFirst, withWordQuotes, WORD_LEAD } from '../lib/lesson-word-quotes.js';
import { quotesTheWord } from '../lib/lesson-completeness.js';

const KJV = path.resolve(__dirname, '../../public/bible/kjv');
const chapters = (book) => JSON.parse(fs.readFileSync(path.join(KJV, `${book.replace(/\s+/g, '')}.json`), 'utf8')).chapters;
function corpus(ref) {
  const m = /^((?:[1-3] )?[A-Za-z ]+?) (\d+):(\d+)(?:-(\d+))?$/.exec(ref);
  if (!m) throw new Error(`unreadable reference ${ref}`);
  const vs = chapters(m[1])[Number(m[2]) - 1];
  const a = Number(m[3]); const b = Number(m[4] || m[3]);
  const out = [];
  for (let i = a; i <= b; i += 1) out.push(String(vs[i - 1]).trim());
  return out.join(' ');
}

describe('every quoted verse is the corpus, verbatim', () => {
  it('PROVEN TO CATCH: each line matches app/public/bible/kjv exactly', () => {
    let n = 0;
    for (const [course, lessons] of Object.entries(QUOTES)) {
      for (const [id, list] of Object.entries(lessons)) {
        expect(list.length, `${course}/${id}`).toBeGreaterThan(0);
        for (const q of list) { expect(q.text, `${course}/${id} ${q.ref}`).toBe(corpus(q.ref)); n += 1; }
      }
    }
    expect(n).toBeGreaterThan(70);
    // a single changed character is caught
    const lessons = Object.values(QUOTES)[0];
    const q = Object.values(lessons)[0][0];
    expect(`${q.text}x`).not.toBe(corpus(q.ref));
  });
});

describe('a lesson opens with its verses, in every band', () => {
  const m = { id: 'x', lesson: 'Adult words.', levels: { teen: 'Teen words.', child: '' } };
  const table = { k: { x: [{ ref: 'John 3:16', text: 'For God so loved the world' }] } };
  it('the Word leads the lesson and each written band; an empty band stays empty', () => {
    const [out] = withWordQuotes([{ key: 'k', schedule: [m] }], table)[0].schedule;
    expect(out.lesson).toBe(`${WORD_LEAD}\n\n"For God so loved the world" (John 3:16, KJV)\n\nAdult words.`);
    expect(out.levels.teen.startsWith(WORD_LEAD)).toBe(true);
    expect(out.levels.child).toBe('');
    expect(quotesTheWord(out)).toBe(true);
    expect(withWordFirst(out, wordQuotesFor('k', 'x', table)).lesson).toBe(out.lesson); // never twice
  });
  it('a course or lesson with nothing on file is left exactly as it was', () => {
    const c = { key: 'other', schedule: [m] };
    expect(withWordQuotes([c], table)[0]).toBe(c);
    expect(withWordQuotes([{ key: 'k', schedule: [{ id: 'y', lesson: 'z' }] }], table)[0].schedule[0].lesson).toBe('z');
  });
});
