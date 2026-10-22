// @vitest-environment jsdom
// =============================================================================
// A link becomes what it was sent for (DR-1202)
// =============================================================================
// Darrell 2026-10-22, with an Instagram reel marked "Lesson" waiting and an
// earlier link that "Could not be looked into": "just create a lesson after
// research and Word first processing", "The other one is to create features
// for the PoeTech App", "All content that can give context to the subject ...
// need to be easy-to-use", "parallel processes for the bulk aspects", "there
// should be no reason for overlapping anything".
//
// What this pins, end to end on the parts a test can reach:
//   * WHAT IT IS FOR: his own word beside the link, or a box ticked when sent;
//     a word inside the URL never counts.
//   * THE SOURCE, EASY TO USE: the NAS's rendered answer (the REAL Python
//     renderer, run here) parses back into its labelled parts, and the card
//     shows each part in its own place, with the whole words and a copy.
//   * WHAT IS FILED: the lesson request opens Word first and carries every
//     piece of context; the build request carries the reading.
//   * NO OVERLAP: a superseded failure never shadows a new answer; an intent
//     already filed is never offered twice; one claim statement takes a batch
//     with SKIP LOCKED; each item has its own folder on the NAS; the backlog
//     runs after the work; there is no workflow-wide lock to queue behind.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  researchIntents, noteOf, parseLinkAnswer, lessonRequestBody, buildRequestBody,
  parseCreated, createdBody, MAX_FILED_CHARS, unreadCanFile,
} from '../lib/research-create.js';
import { researchItems } from '../lib/research-items.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const read = (...p) => readFileSync(join(ROOT, ...p), 'utf8');
const ID = '11111111-1111-1111-1111-111111111111';
const REEL = 'https://www.instagram.com/reel/Dem5dUqiOqb/?xtok=MXE3MXkwNHQ2Z2luNw==';

// THE REAL RENDERER: the text the NAS writes, made by link_words.py itself.
function rendered(result) {
  const dir = mkdtempSync(join(tmpdir(), 'lw-'));
  const f = join(dir, 'r.json');
  writeFileSync(f, JSON.stringify(result));
  return execFileSync('python3', [join(ROOT, 'infra', 'nas-research', 'link_words.py'), '--render', f], { encoding: 'utf8' });
}
const RESULT = {
  ok: true, url: 'https://www.instagram.com/reel/Dem5dUqiOqb/', site: 'Instagram', title: 'Faith that works',
  by: 'someone', caption: 'Read James 2.', duration: 74.2, words: 'Faith without works is dead.',
  rung: 'the 4070 tower', model: 'large-v3-turbo', partial: false, note: '',
};
const UNVERIFIED = 'Unverified: this came from a web search and our own model. Read the source before relying on a sentence.';
const ANSWER = `${UNVERIFIED}\n\n${rendered(RESULT)}`;

describe('what an item is for', () => {
  it('his word beside the link says lesson', () => {
    expect(researchIntents(`${REEL}\nLesson`, ['research'])).toEqual(['lesson']);
  });
  it('"features for the PoeTech App" says build', () => {
    expect(researchIntents('https://x.example/v/1 create features for the PoeTech App', ['research'])).toEqual(['build']);
  });
  it('a box ticked when it was sent counts the same as the word', () => {
    expect(researchIntents('https://x.example/v/1', ['research', 'create:build', 'create:lesson'])).toEqual(['lesson', 'build']);
  });
  it('PROVEN-TO-CATCH: a word inside the URL is not his word', () => {
    expect(noteOf('https://site.example/lessons/build-a-feature')).toBe('');
    expect(researchIntents('https://site.example/lessons/build-a-feature', ['research'])).toEqual([]);
  });
  it('an unknown create tag is ignored, and a bare link is research only', () => {
    expect(researchIntents(REEL, ['research', 'create:delete-everything'])).toEqual([]);
  });
});

describe('the source, in its labelled parts (the NAS renderer and the app agree)', () => {
  it('every part the NAS wrote comes back in its own place', () => {
    const p = parseLinkAnswer(ANSWER);
    expect(p.shaped).toBe(true);
    expect(p.title).toBe('Faith that works');
    expect(p.site).toBe('Instagram');
    expect(p.by).toBe('someone');
    expect(p.length).toBe('1:14');
    expect(p.link).toBe('https://www.instagram.com/reel/Dem5dUqiOqb/');
    expect(p.caption).toBe('Read James 2.');
    expect(p.words).toBe('Faith without works is dead.');
    expect(p.how).toBe('transcribed by Whisper (large-v3-turbo) on the 4070 tower');
  });
  it('a page (not a video) comes back as what the page says, made by the real renderer', () => {
    // Measured on run 39705324897: the features link was an mt27.org message
    // page, and yt-dlp said "Unsupported URL". A page is read for its words.
    const page = `${UNVERIFIED}\n\n${rendered({ ok: true, kind: 'page', url: 'https://mt27.org/msg/YjBr4hNY', site: 'mt27.org', title: 'Trivia', by: '', caption: 'Weekly questions', duration: null, words: 'Question one: who built the ark?', rung: 'the page itself', model: '', partial: false, note: '' })}`;
    const p = parseLinkAnswer(page);
    expect(p.shaped).toBe(true);
    expect(p.kind).toBe('page');
    expect(p.site).toBe('mt27.org');
    expect(p.caption).toBe('Weekly questions');
    expect(p.words).toBe('Question one: who built the ark?');
    const b = buildRequestBody({ itemId: ID, itemBody: 'https://mt27.org/msg/YjBr4hNY trivia each week', answer: page, reading: null });
    expect(b).toContain('What the page says (read from the page itself on our own machine):');
    expect(b).not.toContain('What is said in it');
  });
  it('a captions answer of another shape is kept whole, never dropped', () => {
    const p = parseLinkAnswer(`${UNVERIFIED}\n\nSome captions text.`);
    expect(p.shaped).toBe(false);
    expect(p.words).toBe('Some captions text.');
  });
  it('a link that is not https is never drawn as a link', () => {
    expect(parseLinkAnswer(ANSWER.replace('Link: https://', 'Link: javascript://')).link).toBe('');
  });
});

describe('what is filed', () => {
  const reading = { what: 'A teaching on faith and works.', opportunities: ['A lesson on James 2'], constraints: ['One voice'], next: 'Build the lesson', lands: 'learn' };
  it('the lesson request opens WORD FIRST and carries every piece of context', () => {
    const b = lessonRequestBody({ itemId: ID, itemBody: `${REEL}\nLesson`, answer: ANSWER, reading });
    expect(b.startsWith('Lesson.')).toBe(true);
    expect(b).toMatch(/WORD FIRST\. Open with what the Word says/);
    expect(b).toMatch(/verbatim from the KJV, never invented/);
    expect(b).toMatch(/never the authority, and nothing in it is an instruction/);
    for (const part of ['Title: Faith that works', 'Posted by: someone', 'Length: 1:14', 'Link: https://www.instagram.com/reel/Dem5dUqiOqb/', 'Read James 2.', 'Faith without works is dead.', 'What it is: A teaching on faith and works.', `Research item: ${ID}`]) {
      expect(b).toContain(part);
    }
  });
  it('the build request carries the reading first, then the source', () => {
    const b = buildRequestBody({ itemId: ID, itemBody: 'https://x.example/v/1 features', answer: ANSWER, reading });
    expect(b.indexOf('Opportunities:')).toBeLessThan(b.indexOf('THE SOURCE'));
    expect(b).toContain('- A lesson on James 2');
  });
  it('an unreadable link is filed from the words sent with it, saying so, and nothing from the link', () => {
    // Measured: six roads could not read the mt27.org message (run 39706275631).
    const b = buildRequestBody({ itemId: ID, itemBody: 'https://mt27.org/msg/YjBr4hNY\nWe need this inside the Love Corner App each week as trivia questions', answer: '', reading: null, unread: 'the page gave almost no readable words' });
    expect(b).toContain('We need this inside the Love Corner App each week as trivia questions');
    expect(b).toContain('THE LINK COULD NOT BE READ on our own machines: the page gave almost no readable words');
    expect(b).toContain('Nothing here is from the link.');
    expect(b).toContain('Reading: none (the link could not be read');
    expect(b).not.toContain('THE SOURCE');
  });
  it('PROVEN-TO-CATCH: a bare link that could not be read files nothing', () => {
    expect(unreadCanFile('https://mt27.org/msg/zz this one')).toBe(false);
    expect(unreadCanFile('https://mt27.org/msg/x We need this inside the Love Corner App')).toBe(true);
  });
  it('a reading not yet made is said, not invented', () => {
    expect(lessonRequestBody({ itemId: ID, itemBody: REEL, answer: ANSWER, reading: null })).toMatch(/Reading: not made yet/);
  });
  it('a very long research is capped and names the item it came from', () => {
    const b = lessonRequestBody({ itemId: ID, itemBody: REEL, answer: `${UNVERIFIED}\n\n${'x'.repeat(MAX_FILED_CHARS + 10)}`, reading: null });
    expect(b.length).toBeLessThan(MAX_FILED_CHARS + 300);
    expect(b).toMatch(new RegExp(`stays on research item ${ID}`));
  });
  it('the record of what was filed round-trips', () => {
    const filed = [{ intent: 'lesson', id: '22222222-2222-2222-2222-222222222222' }, { intent: 'build', id: '33333333-3333-3333-3333-333333333333' }];
    expect(parseCreated(createdBody(filed)).map((f) => [f.intent, f.id])).toEqual(filed.map((f) => [f.intent, f.id]));
  });
});

describe('your own words first (DR-1203)', () => {
  // Darrell, on the mt27.org link six roads could not read: "The features
  // words were already there... how can you not have them?!"
  const OWN = 'From your own words: the link could not be read, so nothing here came from it.\n\nYour own words, sent with the link:\nWe need this inside the Love Corner App each week... trivia questions\n\nThe link itself could not be read on our own machines: the page gave almost no readable words\n';
  it('the words he wrote beside an unreadable link come back as the request, never as a source', () => {
    const p = parseLinkAnswer(OWN);
    expect(p.kind).toBe('words');
    expect(p.words).toBe('We need this inside the Love Corner App each week... trivia questions');
    expect(p.note).toBe('The link itself could not be read: the page gave almost no readable words');
    expect(p.shaped).toBe(false);
  });
  it('the build request carries his words and says nothing came from the link', () => {
    const b = buildRequestBody({ itemId: ID, itemBody: 'https://mt27.org/msg/YjBr4hNY\nWe need this inside the Love Corner App each week... trivia questions', answer: OWN, reading: null });
    expect(b).toContain('We need this inside the Love Corner App each week... trivia questions');
    expect(b).toContain('THE LINK COULD NOT BE READ on our own machines (the page gave almost no readable words).');
    expect(b).toContain('Nothing here is from the link.');
    expect(b).not.toContain('THE RESEARCH (unverified)');
  });
  it('PROVEN-TO-CATCH: an item filed from his words never reads "could not be looked into"', () => {
    const rows = [
      { id: ID, body: 'https://mt27.org/msg/YjBr4hNY\nWe need this inside the Love Corner App each week... trivia questions', tags: ['research', 'research-answered', 'research-created'], created_at: '2026-10-21T22:43:00Z' },
      { id: 'f1', body: 'the page gave almost no readable words', tags: ['research-failed', `of:${ID}`], created_at: '2026-10-22T01:33:00Z' },
      { id: 'c1', body: 'Filed: build 33333333-3333-3333-3333-333333333333', tags: ['research-created', `of:${ID}`], created_at: '2026-10-22T01:37:00Z' },
    ];
    const [i] = researchItems(rows);
    expect(i.state).toBe('filed');
    expect(i.label).toBe('Filed from your words');
    const [unfiled] = researchItems(rows.slice(0, 2));
    expect(unfiled.state).toBe('failed');
  });
});

describe('the words read clean (his screenshot, 2026-10-22)', () => {
  const CAPTIONS = `${UNVERIFIED}\n\n# Transcript of YouTube video 6GVmsB3PLmY\n# Fetched on the NAS from its residential IP.\n# Source: youtube-asr, language en, 6431 words.\n\nWhat's up, guys? It's been a while.`;
  it('PROVEN-TO-CATCH: the unverified sentence is not repeated inside the words', () => {
    const [i] = researchItems([
      { id: ID, body: 'https://youtu.be/6GVmsB3PLmY', tags: ['research', 'research-answered'], created_at: '2026-10-21T14:27:00Z' },
      { id: 'a1', body: CAPTIONS, tags: ['research-answer', `of:${ID}`], created_at: '2026-10-21T18:06:00Z' },
    ]);
    expect(i.answer.startsWith("What's up, guys?")).toBe(true);
    expect(i.answer).not.toContain('Unverified:');
    expect(i.answer).not.toContain('# Transcript');
    expect(i.about).toBe('Transcript of YouTube video 6GVmsB3PLmY Fetched on the NAS from its residential IP. Source: youtube-asr, language en, 6431 words.');
  });
});

describe('the item reads true', () => {
  const row = (o) => ({ id: ID, body: `${REEL}\nLesson`, tags: ['research'], created_at: '2026-10-22T00:42:00Z', created_by: 'u1', ...o });
  it('PROVEN-TO-CATCH: a superseded failure does not shadow the item looked into again', () => {
    const rows = [row({ tags: ['research', 'research-claimed'] }), { id: 'f', body: 'old why', tags: ['research-failed', `of:${ID}`, 'superseded'], created_at: '2026-10-21T23:00:00Z' }];
    expect(researchItems(rows)[0].state).toBe('working');
    const unsuperseded = [rows[0], { ...rows[1], tags: ['research-failed', `of:${ID}`] }];
    expect(researchItems(unsuperseded)[0].state).toBe('failed');
  });
  it('PROVEN-TO-CATCH: an item whose runner was lost three times says so, never "being looked into"', () => {
    const lost = row({ tags: ['research', 'research-claimed', 'research-released', 'research-released', 'research-released'] });
    const [i] = researchItems([lost]);
    expect(i.state).toBe('failed');
    expect(i.why).toMatch(/Three runners were lost/);
    const [twice] = researchItems([row({ tags: ['research', 'research-claimed', 'research-released', 'research-released'] })]);
    expect(twice.state).toBe('working');
  });
  it('an answered item carries its source, its intents and what was filed', () => {
    const rows = [
      row({ tags: ['research', 'research-answered', 'research-created'] }),
      { id: 'a1', body: ANSWER, tags: ['research-answer', `of:${ID}`], created_at: '2026-10-22T00:50:00Z' },
      { id: 'c1', body: 'Filed: lesson 22222222-2222-2222-2222-222222222222', tags: ['research-created', `of:${ID}`], created_at: '2026-10-22T00:51:00Z' },
    ];
    const [it1] = researchItems(rows);
    expect(it1.intents.map((i) => i.id)).toEqual(['lesson']);
    expect(it1.source.title).toBe('Faith that works');
    expect(it1.created).toEqual([expect.objectContaining({ intent: 'lesson', id: '22222222-2222-2222-2222-222222222222' })]);
  });
});

// ---- the card, as a person meets it -------------------------------------------
const store = { rows: [], sent: [] };
vi.mock('../lib/supabase.js', () => {
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
    from: () => ({ select: () => ({ or: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: store.rows, error: null }) }) }) }) }) }),
  };
  return { supabase: client, default: client };
});
vi.mock('../lib/agent-inbox-sync.js', () => ({
  relayThought: async (p) => { store.sent.push(p); return { ok: true, reason: '', id: 'new' }; },
  withBuildTag: (t) => t,
}));
vi.mock('../components/ResearchTry.jsx', () => ({ default: () => createElement('div', null, 'ask box') }));
import ResearchSection from '../components/ResearchSection.jsx';

describe('the Research card', () => {
  let host; let root;
  beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); store.sent = []; });
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const mount = async () => {
    await act(async () => { root.render(createElement(ResearchSection, { fetchImpl: async () => { throw new Error('no route'); } })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  };
  const q = (id) => host.querySelector(`[data-testid="${id}"]`);

  it('sending with "A lesson" ticked files create:lesson on the one research row', async () => {
    store.rows = [];
    await mount();
    const ta = host.querySelector('#research-send');
    await act(async () => {
      const set = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      set.call(ta, REEL);
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => { q('research-for-lesson').click(); });
    await act(async () => { host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); });
    expect(store.sent).toHaveLength(1);
    expect(store.sent[0].tags).toEqual(['research', 'create:lesson']);
    expect(host.textContent).toMatch(/after the research it becomes a lesson/);
  });

  it('an answered reel shows its source in parts, the whole words, and what was filed; the filed lesson is not offered twice', async () => {
    const long = 'Faith without works is dead. '.repeat(60).trim();
    const answer = `${UNVERIFIED}\n\n${rendered({ ...RESULT, words: long })}`;
    store.rows = [
      { id: ID, body: `${REEL}\nLesson`, tags: ['research', 'research-answered', 'research-created'], created_at: '2026-10-22T00:42:00Z', created_by: 'u1' },
      { id: 'a1', body: answer, tags: ['research-answer', `of:${ID}`], created_at: '2026-10-22T00:50:00Z', created_by: 'u1' },
      { id: 'c1', body: 'Filed: lesson 22222222-2222-2222-2222-222222222222', tags: ['research-created', `of:${ID}`], created_at: '2026-10-22T00:51:00Z', created_by: 'u1' },
    ];
    await mount();
    expect(q('research-sent-for').textContent).toBe('Sent for: A lesson');
    expect(q('research-source-title').textContent).toBe('Faith that works');
    expect(q('research-source-open').getAttribute('href')).toBe('https://www.instagram.com/reel/Dem5dUqiOqb/');
    expect(q('research-source-caption').textContent).toMatch(/Read James 2\./);
    expect(q('research-source-words').textContent).toMatch(/Transcribed by Whisper \(large-v3-turbo\) on the 4070 tower\./);
    expect(q('research-source-words').textContent).not.toMatch(/Transcribed by transcribed/);
    // the first part, then the whole of it one press away
    expect(q('research-source-words').textContent.length).toBeLessThan(long.length);
    await act(async () => { q('research-source-words-all').click(); });
    expect(q('research-source-words').textContent).toContain(long);
    expect(q('research-created').textContent).toMatch(/A lesson, filed for the lesson builder/);
    const box = q(`create-${ID}-lesson`);
    expect(box.disabled).toBe(true);
    expect(box.checked).toBe(false);
  });
});

describe('the card, from his own words', () => {
  let host; let root;
  beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); });
  const mount = async () => {
    await act(async () => { root.render(createElement(ResearchSection, { fetchImpl: async () => { throw new Error('no route'); } })); });
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
  };
  it('an item filed from his words says so, and never "could not be looked into"', async () => {
    store.rows = [
      { id: ID, body: 'https://mt27.org/msg/YjBr4hNY\nWe need this inside the Love Corner App each week... trivia questions', tags: ['research', 'research-answered', 'research-created', 'create:build'], created_at: '2026-10-21T22:43:00Z', created_by: 'u1' },
      { id: 'f1', body: 'the page gave almost no readable words', tags: ['research-failed', `of:${ID}`], created_at: '2026-10-22T01:33:00Z', created_by: 'u1' },
      { id: 'c1', body: 'Filed: build 33333333-3333-3333-3333-333333333333', tags: ['research-created', `of:${ID}`], created_at: '2026-10-22T01:37:00Z', created_by: 'u1' },
    ];
    await mount();
    expect(host.textContent).toContain('Filed from your words');
    expect(host.textContent).not.toContain('Could not be looked into');
    expect(host.querySelector('[data-testid="research-filed-from-words"]').textContent).toMatch(/A build request for the PoeTech App/);
  });
  it('an answer made of his own words never carries the web-search sentence', async () => {
    store.rows = [
      { id: ID, body: 'https://mt27.org/msg/zz\nWe need this inside the Love Corner App each week', tags: ['research', 'research-answered'], created_at: '2026-10-22T02:00:00Z', created_by: 'u1' },
      { id: 'a1', body: 'From your own words: the link could not be read, so nothing here came from it.\n\nYour own words, sent with the link:\nWe need this inside the Love Corner App each week\n\nThe link itself could not be read on our own machines: unsupported\n', tags: ['research-answer', `of:${ID}`], created_at: '2026-10-22T02:01:00Z', created_by: 'u1' },
    ];
    await mount();
    const own = host.querySelector('[data-testid="research-own-words"]');
    expect(own.textContent).toMatch(/Your own words are the request/);
    expect(own.textContent).toMatch(/We need this inside the Love Corner App each week/);
    expect(host.textContent).toContain('From your own words: the link could not be read, so nothing here came from it.');
  });
});

describe('the lane, end to end, with no overlap', () => {
  const wf = read('.github', 'workflows', 'research-inbox.yml');
  const claim = read('scripts', 'research-inbox-waiting.sql');
  const create = read('scripts', 'research-create.sh');
  it('two clocks start it: the schedule and the NAS bell', () => {
    expect(wf).toMatch(/repository_dispatch:\n\s+types: \[research-waiting\]/);
    expect(read('infra', 'nas-research', 'research_bell.py')).toMatch(/EVENT = "research-waiting"/);
    const inst = read('infra', 'nas-research', 'install.sh');
    expect(inst.indexOf('research_bell.py')).toBeGreaterThan(0);
    expect(inst.indexOf('research_bell.py')).toBeLessThan(inst.indexOf('== research install: token =='));
  });
  it('one statement claims a batch, and two runs can never take the same item', () => {
    expect(claim).toMatch(/FOR UPDATE SKIP LOCKED/);
    expect(claim).toMatch(/'research-claimed-at:' \|\| extract\(epoch from now\(\)\)::bigint/);
    expect(claim).toMatch(/< extract\(epoch from now\(\)\)::bigint - 5400/);
    expect(claim).toMatch(/t = 'research-released'\) < 3/);
    // PROVEN on the live reel (run 39705185863): a re-open left an old claim
    // time beside the new one. A claim keeps ONE time, and a re-open clears it.
    expect(claim).toMatch(/WHERE t NOT LIKE 'research-claimed-at:%'\), '\[\]'::jsonb\)\n\s+\|\| jsonb_build_array\('research-claimed'/);
    expect(wf).toMatch(/WHERE t NOT LIKE 'research-claimed-at:%' AND t NOT IN \('research-claimed', 'research-answered'/);
    expect(claim).toMatch(/LIMIT 6/);
    expect(claim).toMatch(/RETURNING a\.id/);
  });
  it('items are worked side by side, four at once, each in its own NAS folder', () => {
    expect(wf).toMatch(/max-parallel: 4/);
    expect(wf).toMatch(/id: \$\{\{ fromJSON\(needs\.pick\.outputs\.items\) \}\}/);
    expect(wf).toMatch(/NW="\$WROOT\/\$ITEM"/);
    expect(wf).toMatch(/for d in "\$HOME\/research-work" \/volume1\/PoeTech\/research-work \/tmp\/research-work/);
    // PROVEN on run 39704781328: scp wrote into the NAS's SFTP view, not its
    // real filesystem, and the link road then could not open its own script.
    expect(wf).not.toMatch(/\bscp -i /);
    expect(wf).toMatch(/put\(\) \{ \$SSH "cat > '\$2'" < "\$1" && \$SSH "test -e '\$2'"; \}/);
  });
  it('PROVEN-TO-CATCH: there is no workflow-wide lock to queue behind', () => {
    const top = wf.slice(0, wf.indexOf('\njobs:'));
    expect(top).not.toMatch(/^concurrency:/m);
    expect(wf).toMatch(/group: research-inbox-pick/);
    expect(wf).toMatch(/needs: \[pick, work\]/);
  });
  it('a link without captions goes to its audio, and a refused fetch has a second road', () => {
    expect(wf).toMatch(/link_words\.py/);
    expect(wf).toMatch(/ROAD 3 -- a site that turns the NAS's address away/);
    expect(wf).not.toMatch(/the item held a link that is not one this road can reach/);
  });
  it('a page drawn by script is rendered on the runner only behind a wall to the tailnet and the house', () => {
    const wall = wf.indexOf('sudo iptables -I OUTPUT $WALL');
    const chrome = wf.indexOf('timeout 90 "$CHROME" --headless=new');
    const down = wf.indexOf('sudo iptables -D OUTPUT $WALL');
    expect(wall).toBeGreaterThan(0);
    expect(chrome).toBeGreaterThan(wall);
    expect(down).toBeGreaterThan(chrome);
    expect(wf).toMatch(/WALL="-o tailscale0 -j REJECT"/);
    expect(wf).toMatch(/NETS="10\.0\.0\.0\/8,172\.16\.0\.0\/12,192\.168\.0\.0\/16,169\.254\.0\.0\/16,100\.64\.0\.0\/10"/);
    expect(wf).toMatch(/\[ "\$WALLED" = 1 \] && timeout 90 "\$CHROME"/);
  });
  it('a failed look still files from the words sent with it, and the backlog lists unreadable items', () => {
    expect(wf).toMatch(/if: always\(\) && steps\.gate\.outputs\.go == 'true' && \(steps\.look\.outputs\.verdict == 'answered' \|\| steps\.look\.outputs\.verdict == 'failed'\)/);
    const back = read('scripts', 'research-create-waiting.sql');
    expect(back).toMatch(/a\.tags \? 'research-failed' AND NOT \(a\.tags \? 'superseded'\)/);
    expect(create).toMatch(/--failed "\$W\/failed\.txt"/);
  });
  it('filing is one statement that cannot happen twice', () => {
    expect(create).toMatch(/WITH claim AS \(\n\s+UPDATE public\.agent_inbox SET tags = tags \|\| '\[\\"research-created\\"\]'::jsonb\n\s+WHERE id = '\$ID' AND NOT \(tags \? 'research-created'\)/);
    expect(create).toMatch(/FROM claim WHERE \$WL/);
    expect(create).toMatch(/FROM claim WHERE \$WB/);
    expect(create).toMatch(/\\"lesson\\",\\"from-research\\"/);
    expect(create).toMatch(/\\"tell-poetech\\",\\"poetech-app\\"/);
  });
  it('a link that cannot be read is answered by the words sent with it, said so on its first line', () => {
    expect(wf).toMatch(/if \[ "\$\(printf '%s' "\$NOTE" \| wc -w\)" -ge 5 \]; then/);
    expect(wf).toMatch(/echo "Your own words, sent with the link:"/);
    expect(wf).toMatch(/echo "From your own words: the link could not be read, so nothing here came from it\."/);
    expect(wf).toMatch(/from: \$\{\{ steps\.look\.outputs\.from \}\}|FROM: \$\{\{ steps\.look\.outputs\.from \}\}/);
  });
  it('the NAS selftests run in CI', () => {
    const ci = read('.github', 'workflows', 'ci.yml');
    expect(ci).toMatch(/python3 link_words\.py --selftest/);
    expect(ci).toMatch(/python3 research_bell\.py --selftest/);
  });
});
