// DR-1673: a shared lesson link previews as THAT lesson (its cover and title) and lands in it,
// with the same query and share token, so the open is still recorded (DR-0698).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildPreviewIndex, lessonPreviewUrl, previewPage, PREVIEW_DOORS } from '../lib/learn-link-preview.js';
import { LESSON_DOORS } from '../lib/lesson-links.js';
import { onRequest } from '../../functions/l/[[path]].js';

const RECORDS = JSON.parse(readFileSync(join(process.cwd(), 'src/lib/learn-presentation/presentation-records.json'), 'utf8')).records;
const INDEX = buildPreviewIndex(RECORDS);
const L10 = 'll10-strength-and-honour-are-her-clothing';
const Q = `?view=church&sub=learn&course=living-lessons&lesson=${L10}&s=Tok3nAbcdE12`;

describe('the preview index and the link', () => {
  it('every approved cover is in the index, with its display title and a cover that exists', () => {
    expect(Object.keys(INDEX).length).toBe(RECORDS.filter((r) => r.image && r.image.src && !r.needsReview).length);
    expect(INDEX[L10][0]).toMatch(/^Strong, Not Skinny/);
    for (const [, src] of Object.values(INDEX).slice(0, 50)) expect(() => readFileSync(join(process.cwd(), 'public', src))).not.toThrow();
  });

  it('the preview doors are the lesson doors', () => {
    expect(PREVIEW_DOORS.lovecorner.path).toBe(LESSON_DOORS.lovecorner.path);
    expect(PREVIEW_DOORS.poetech.path).toBe(LESSON_DOORS.poetech.path);
  });

  it("a lesson link is sent through its door's preview page; anything else is unchanged", () => {
    expect(lessonPreviewUrl(`https://poetech.us/lovecorner/app/${Q}`)).toBe(`https://poetech.us/l/lovecorner/${Q}`);
    expect(lessonPreviewUrl(`https://poetech.us/poetech-app/${Q}`)).toBe(`https://poetech.us/l/poetech/${Q}`);
    expect(lessonPreviewUrl('https://poetech.us/moore/')).toBe('https://poetech.us/moore/');
    expect(lessonPreviewUrl('https://evil.test/x/lovecorner/app/?a=1')).toBe('https://evil.test/x/lovecorner/app/?a=1');
  });
});

describe('the preview page', () => {
  const env = (body, ok = true) => ({ ASSETS: { fetch: async () => ({ ok, json: async () => body }) } });
  const hit = async (path, e = env(INDEX)) => onRequest({ request: new Request(`https://poetech.us${path}`), env: e });

  it("shows the lesson's cover and title, short and sweet, and refreshes into the lesson with the same query", async () => {
    const res = await hit(`/l/lovecorner/${Q}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<meta property="og:title" content="Strong, Not Skinny');
    expect(html).toContain(`<meta property="og:image" content="https://poetech.us/${INDEX[L10][1]}"`);
    expect(html).toContain('<meta property="og:description" content="The Love Corner · Lesson 10"');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"');
    const go = `/lovecorner/app/${Q}`.replace(/&/g, '&amp;');
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${go}"`);
    expect(html).not.toMatch(/<script/i);
  });

  it('never fails a link: an unknown lesson previews plainly, a missing index previews plainly, an unknown door goes straight on', async () => {
    const plain = await (await hit('/l/poetech/?lesson=nope&s=Tok3nAbcdE12')).text();
    expect(plain).toContain('<meta property="og:title" content="PoeTech"');
    expect(plain).toContain('url=/poetech-app/?lesson=nope&amp;s=Tok3nAbcdE12');
    const noIndex = await hit(`/l/lovecorner/${Q}`, env(null, false));
    expect(noIndex.status).toBe(200);
    const odd = await hit('/l/elsewhere/?lesson=x');
    expect(odd.status).toBe(302);
    expect(odd.headers.get('location')).toBe('https://poetech.us/lovecorner/app/?lesson=x');
  });

  it('a title cannot break out of its tag', () => {
    const p = previewPage({ origin: 'https://poetech.us', door: 'lovecorner', search: '?lesson=x', entry: ['"><script>alert(1)</script>', 'a.webp'] });
    expect(p.html).not.toContain('<script>');
  });
});
