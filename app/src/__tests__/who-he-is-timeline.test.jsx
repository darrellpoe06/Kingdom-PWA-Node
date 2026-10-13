// =============================================================================
// WHO HE IS — the timeline surface, and L191 / L194 / L196 held to it (DR-0675)
// =============================================================================
// Darrell, 2026-09-29: "Clarity clarification of where when what how timeless
// timelines and Who He Is!!!!!!" PR 3 of 3. This proves:
//   - the timeline shows every passage, era by era, read by where it sits or
//     by what it points to, and every number on screen is a list's length;
//   - the filters are views of the same entries, never a second list;
//   - a passage opens in place with where, when, what, how, presence, Who He
//     Is, and a way into the lesson that carries it;
//   - L191, L194 and L196 point to the curriculum, and L196 is held to it: its
//     plain "When:" lines are the curriculum's eras for the same passages, none
//     of its old cryptic marks survives, and every Old Testament passage it
//     gathers is in the curriculum or named at its edge.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import WhoHeIsTimeline, { timelineGroups } from '../components/WhoHeIsTimeline.jsx';
import { WhoHeIsLinkCard } from '../components/WhoHeIsRegister.jsx';
import {
  WHO_HE_IS_ENTRIES, WHO_HE_IS_ERAS, WHO_HE_IS_EDGE, filterEntries, lessonLinksFor, isWhoHeIsLinkedLesson, eraLabel,
} from '../lib/who-he-is.js';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const button = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));
const lesson = (p) => LIVING_LESSONS_MODULES.find((m) => m.id.startsWith(p));

describe('the timeline groups are the data, era by era', () => {
  it('reading by where it sits, every passage is in exactly one era', () => {
    const g = timelineGroups({ axis: 'sits' });
    expect(g.map((x) => x.era.id)).toEqual(WHO_HE_IS_ERAS.map((e) => e.id));
    expect(g.reduce((n, x) => n + x.entries.length, 0)).toBe(WHO_HE_IS_ENTRIES.length);
  });

  it('reading by what it points to, the last two eras fill with the passages that point there', () => {
    const g = timelineGroups({ axis: 'points' });
    const end = g.find((x) => x.era.id === 'the-end'); const ever = g.find((x) => x.era.id === 'forever');
    expect(end.entries.length).toBe(WHO_HE_IS_ENTRIES.filter((e) => e.when.pointsTo.includes('the-end')).length);
    expect(ever.entries.length).toBeGreaterThan(0);
    expect(timelineGroups({ axis: 'sits' }).find((x) => x.era.id === 'forever').entries).toHaveLength(0);
  });

  it('filters are views of the same entries', () => {
    const g = timelineGroups({ axis: 'sits', present: 'pre-incarnate' });
    expect(g.reduce((n, x) => n + x.entries.length, 0)).toBe(filterEntries({ present: 'pre-incarnate' }).length);
    const isa = timelineGroups({ axis: 'sits', book: 'Isaiah' });
    expect(isa.flatMap((x) => x.entries).every((e) => e.book === 'Isaiah')).toBe(true);
  });
});

describe('WhoHeIsTimeline renders the whole line, on a phone and on the Firestick', () => {
  it('shows every era with its count, and the total', () => {
    act(() => root.render(createElement(WhoHeIsTimeline)));
    expect(container.textContent).toContain(`Showing ${WHO_HE_IS_ENTRIES.length} of ${WHO_HE_IS_ENTRIES.length} passages`);
    for (const { era, entries } of timelineGroups({ axis: 'sits' })) expect(button(new RegExp(`${era.label} — ${entries.length}(?!\\d)`)), era.id).toBeTruthy();
    // Every control is a real button or a native select (D-pad reachable), and nothing scrolls inside itself.
    expect(container.querySelectorAll('[style*="overflow"]').length).toBe(0);
  });

  it('opening an era lists every passage in it, and opening a passage shows its six lines and its lesson', () => {
    let opened = null;
    act(() => root.render(createElement(WhoHeIsTimeline, { initialEra: 'prophets', onOpenLesson: (id) => { opened = id; } })));
    const prophets = timelineGroups({ axis: 'sits' }).find((x) => x.era.id === 'prophets').entries;
    const rows = [...container.querySelectorAll('li[data-era="prophets"] > div > ul > li > button')];
    expect(rows.length).toBe(prophets.length);
    click(rows[0]);
    const card = container.querySelector('li[data-entry]').textContent;
    for (const label of ['Where:', 'When:', 'What:', 'How:', 'Was He there:', 'Who He Is:']) expect(card).toContain(label);
    click(button(/^Open Lesson \d+:/));
    expect(opened).toMatch(/^whohe\d+-/);
  });

  it('a filter changes what is shown, and the count follows it', () => {
    act(() => root.render(createElement(WhoHeIsTimeline)));
    click(button(/^He was there before He came in the flesh$/));
    const n = filterEntries({ present: 'pre-incarnate' }).length;
    expect(container.textContent).toContain(`Showing ${n} of ${WHO_HE_IS_ENTRIES.length} passages`);
    click(button(/^What it points to$/));
    expect(button(/^Clear the filters$/)).toBeTruthy();
  });

  it('the edge sits in its own era on the line, named, when no filter is on', () => {
    act(() => root.render(createElement(WhoHeIsTimeline, { initialEra: 'prophets' })));
    const inProphets = WHO_HE_IS_EDGE.filter((g) => g.era === 'prophets');
    expect(container.textContent).toContain(`At the edge — ${inProphets.length}`);
  });
});

describe('L191, L194 and L196 point to the curriculum', () => {
  it('the three lessons are the linked ones, and each links to passages it names', () => {
    for (const p of ['ll191-', 'll194-', 'll196-']) {
      const m = lesson(p);
      expect(isWhoHeIsLinkedLesson(m.id)).toBe(true);
      const counted = WHO_HE_IS_ENTRIES.filter((e) => lessonLinksFor(e, [m]).length > 0);
      expect(counted.length, `${p} names passages that sit in the curriculum`).toBeGreaterThan(10);
    }
    expect(isWhoHeIsLinkedLesson('ll195-x')).toBe(false);
  });

  it('the link card says, from the lesson’s own references, how many passages it touches', () => {
    const m = lesson('ll194-');
    const counted = WHO_HE_IS_ENTRIES.filter((e) => lessonLinksFor(e, [m]).length > 0).length;
    act(() => root.render(createElement(WhoHeIsLinkCard, { module: m })));
    expect(container.textContent).toContain(`sit in ${counted} passages of the whole-Word curriculum`);
    expect(container.textContent).toContain(`all ${WHO_HE_IS_ENTRIES.length} passages`);
    expect(button(/^Open the course/)).toBeTruthy();
    expect(button(/^Open the whole timeline/)).toBeTruthy();
  });
});

describe('L196 is held to the curriculum', () => {
  const L = () => lesson('ll196-');
  const parse = (r) => { const m = /^(.+?) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(r.replace(/^Psalm /, 'Psalms ')); return m && { b: m[1], a: +m[2] * 1000 + +m[3], z: (m[5] ? +(m[4] || m[2]) : +m[2]) * 1000 + +(m[5] || m[3]) }; };
  const entryAt = (ref) => { const r = parse(ref); return WHO_HE_IS_ENTRIES.find((e) => { const x = parse(e.ref); return x.b === r.b && x.a <= r.a && r.a <= x.z; }); };

  it('every "When:" line on an occasion is the curriculum’s era for that passage', () => {
    const t = L().lesson;
    const occ = [...t.matchAll(/OCCASION ([1-5])\.(\d+): [^(]*\(([^)]*)\)([^]*?)(?=OCCASION \d|MOVEMENT [A-Z]+[,:]|$)/g)];
    expect(occ.length).toBeGreaterThan(90);
    for (const m of occ) {
      const when = /When: ([^.]+)\./.exec(m[4]);
      expect(when, `OCCASION ${m[1]}.${m[2]} has a When line`).toBeTruthy();
      const e = entryAt(m[3].split(';')[0].trim());
      expect(when[1], `OCCASION ${m[1]}.${m[2]}`).toBe(eraLabel(e.when.era));
    }
  });

  it('none of the old cryptic marks survives, in any field', () => {
    const m = L();
    for (const t of [m.lesson, m.bigIdea, m.inApp, ...Object.values(m.levels), ...m.benefits, ...m.facilitator.talkingPoints]) {
      expect(/Its own scene|[Ii]nside the fifty-(four|eight)|writer's own word\b|bears a designation|THE THREE MARKS/.test(t), t.slice(0, 60)).toBe(false);
    }
  });

  it('every Old Testament passage L196 gathers is in the curriculum, or named at its edge', () => {
    const t = L().lesson;
    const foretold = [...t.matchAll(/FORETOLD (\d+): [^(]*\(([^)]*)\)/g)];
    expect(foretold.length).toBeGreaterThan(30);
    for (const f of foretold) {
      const ref = f[2].split(';')[0].trim();
      const inEdge = WHO_HE_IS_EDGE.some((g) => g.verses.some((v) => v.ref === ref));
      expect(!!entryAt(ref) || inEdge, `FORETOLD ${f[1]} ${ref}`).toBe(true);
    }
  });

  it('PROVEN-TO-CATCH: a When line that disagrees with the curriculum is seen, and so is a mark put back', () => {
    const t = L().lesson;
    const bent = t.replace(/(OCCASION 1\.1: [^(]*\([^)]*\)[^]*?When: )([^.]+)\./, '$1The cross.');
    const m = /OCCASION 1\.1: [^(]*\(([^)]*)\)[^]*?When: ([^.]+)\./.exec(bent);
    expect(m[2]).not.toBe(eraLabel(entryAt(m[1].split(';')[0].trim()).when.era));
    expect(/Its own scene/.test(`${t} Its own scene.`)).toBe(true);
  });
});
