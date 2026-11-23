// @vitest-environment node
// =============================================================================
// sov100 — every quotation is the corpus verbatim, the Word frames the hour,
// the house is traced to its real service files, the three diagrams render,
// and the lesson is whole in every band (DR-1611)
// =============================================================================
// Sovereign A.I. week 100, "Rooms shalt thou make in the ark", is built from a
// system-design newsletter on virtual machines and containers that Darrell
// forwarded with one word, Lesson (thread 1a2087dce8e004bd), and a note asking
// for pictures. Built by scripts/sov100-fill.mjs, every verse filled from the
// KJV on disk.
//
// SHAPE. The shared Living Lesson gate's pure checks (helpers/living-lesson-gate.js,
// DR-1477) are run on this Sovereign A.I. module by name; then the checks
// particular to this lesson.
//
// THE RESIDUAL GAP, STATED (DR-0076 section 8). This file proves each quotation
// IS the verse it names, and that what the lesson says of infra/ is what infra/
// says. It cannot prove the verse was the RIGHT one for the point, nor what is
// running on the home server today; those are the author's eye and the
// re-review.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { LESSON_DIAGRAMS } from '../components/lesson-diagrams.jsx';
import { fourBandFaults, fk, words, overlapOf, FOUR_BANDS } from './fixtures/four-band-ladder.js';
import {
  lessonGateFaults,
  stringsOf,
  corpusText,
  quotedPairs,
  verbatimFaults,
  voiceFaults,
  adversaryFaults,
  bareQuoteFaults,
} from './helpers/living-lesson-gate.js';

const ID = 'sov100-rooms-shalt-thou-make-in-the-ark';
const MODULE = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const REPO = join(process.cwd(), '..');
const src = (rel) => {
  const p = join(REPO, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};
const clone = () => JSON.parse(JSON.stringify(MODULE));

const READER_PLACES = ['bigIdea', 'inApp', 'lesson', 'child', 'youth', 'teen', 'senior'];
const TEACHING_PLACES = ['lesson', 'child', 'youth', 'teen', 'senior'];
const place = (M, p) => (['child', 'youth', 'teen', 'senior'].includes(p) ? M.levels[p] : M[p]);
const SPINE = [
  ['Genesis 6:14', 'rooms shalt thou make in the ark'],
  ['Psalms 11:3', 'If the foundations be destroyed'],
];
const REVIEW = 're-review: 2026-12-07';

// MEASURED 2026-11-23 on the spliced module (scripts/sov100-fill.mjs output):
// 15 anchor references and 81 referenced quotations. The anchor exact; the
// quoted floor a little low.
const ANCHOR_COUNT = 15;
const QUOTED_FLOOR = 75;

describe('sov100 is in the catalog and is the whole lesson', () => {
  it('the module exists, as week 100, with all four bands', () => {
    expect(MODULE, `${ID} is in SOVEREIGN_AI_MODULES`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => /^sov100-/.test(m.id))).toHaveLength(1);
    for (const b of FOUR_BANDS) {
      expect(typeof MODULE.levels[b]).toBe('string');
      expect(MODULE.levels[b].startsWith(MODULE.title), b).toBe(true);
    }
  });
});

describe('the shared Living Lesson gate, run on this week check by check', () => {
  it('every check is empty', () => {
    const all = lessonGateFaults(MODULE, { spine: SPINE });
    for (const [name, faults] of Object.entries(all)) expect(faults, name).toEqual([]);
  });

  it(`at least ${QUOTED_FLOOR} referenced quotations are swept, so the sweep is not vacuous`, () => {
    const n = stringsOf(MODULE).reduce((a, t) => a + quotedPairs(t).filter((p) => p.ref).length, 0);
    expect(n).toBeGreaterThanOrEqual(QUOTED_FLOOR);
  });

  it('PROVEN-TO-CATCH: one altered word inside a quotation is caught', () => {
    const L = clone();
    L.lesson = L.lesson.replace('rooms shalt thou make in the ark', 'cabins shalt thou make in the ark');
    expect(verbatimFaults(stringsOf(L)).length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: the newsletter quoted with no reference is caught', () => {
    const L = clone();
    L.lesson += ' The newsletter said "Containers aren’t lightweight VMs."';
    expect(bareQuoteFaults(L).length).toBe(1);
  });

  it('PROVEN-TO-CATCH: the generic name in our voice and a capitalised adversary are caught', () => {
    const L = clone();
    L.levels.teen += ' God keeps the kernel. Satan breaks it.';
    expect(voiceFaults(L).length).toBeGreaterThan(0);
    expect(adversaryFaults(L)).toEqual(['Satan']);
  });
});

describe('anchor.ref names every verse quoted in a reader place, and nothing more', () => {
  const refs = MODULE.anchor.ref
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  const quoted = new Set(
    READER_PLACES.flatMap((p) =>
      quotedPairs(place(MODULE, p))
        .map((q) => q.ref)
        .filter(Boolean)
    )
  );

  it(`the anchor carries exactly ${ANCHOR_COUNT} references, each resolving in the corpus`, () => {
    expect(refs.length).toBe(ANCHOR_COUNT);
    for (const r of refs) expect(corpusText(r), r).not.toBeNull();
    expect(refs.slice(0, 2)).toEqual(['Genesis 6:14', 'Psalms 11:3']);
  });

  it('both ways: nothing on the anchor that a reader is not shown, nothing shown that is not on the anchor', () => {
    expect([...quoted].filter((r) => !refs.includes(r))).toEqual([]);
    expect(refs.filter((r) => !quoted.has(r))).toEqual([]);
  });

  it('neither spine verse is the anchor of an earlier week of this course', () => {
    const earlier = SOVEREIGN_AI_MODULES.filter((m) => m.id !== ID).map((m) =>
      String((m.anchor && m.anchor.ref) || '')
        .split(';')[0]
        .trim()
    );
    expect(earlier).not.toContain('Genesis 6:14');
    expect(earlier).not.toContain('Psalms 11:3');
  });
});

describe('the Word frames the hour, the teaching is whole, and the bright line is held', () => {
  it('in every teaching place Genesis 6:14 is quoted before the first word about a kernel, hypervisor or container', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      const at = t.indexOf('THE WORD FIRST');
      expect(at, `${p} has a Word-first section`).toBeGreaterThan(0);
      const body = t.slice(at);
      const tech = body.search(/\b(kernel|hypervisor|container)\b/i);
      expect(tech, `${p} teaches the machines`).toBeGreaterThan(0);
      expect(body.indexOf('(Genesis 6:14)'), `${p}: the Word stands before the machines`).toBeLessThan(tech);
    }
  });

  it('every teaching place names the one difference: separate kernels, one shared kernel', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, `${p} virtual machine`).toMatch(/virtual machine/i);
      expect(t, `${p} kernel`).toMatch(/kernel/);
      expect(t, `${p} shared`).toMatch(
        /share (one|the host's|the host’s)|shares? (the host's|the host’s|one) kernel|all share one kernel|on one kernel|one shared kernel|share the floor/i
      );
      expect(t, `${p} its own`).toMatch(/own kernel|its own floor/i);
    }
  });

  it('every teaching place carries the ark, the foundation, the land, the prudent, the cost and the watchman', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      for (const ref of [
        '(Genesis 6:14)',
        '(Genesis 6:16)',
        '(Psalms 11:3)',
        '(Psalms 11:4)',
        '(Genesis 13:6)',
        '(Proverbs 22:3)',
        '(Luke 14:28)',
        '(Psalms 127:1)',
      ]) {
        expect(t, `${p} ${ref}`).toContain(ref);
      }
    }
  });

  it('the honest limit is in every teaching place: hardening lowers the risk and does not remove the shared kernel', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/do(es)? not (remove|abolish|change)|still share the floor/i);
    }
  });

  it('THE BRIGHT LINE: every teaching place says no wall is the Keeper', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/keeps the city|with the Keeper|the hand that keeps us/);
    }
  });

  it('Jesus is confessed as the Lamb of Yahweh in every teaching place, and the Eternal Son in the lesson and the older bands', () => {
    for (const p of TEACHING_PLACES) {
      expect(place(MODULE, p), p).toMatch(/Lamb of Yahweh/);
      expect(place(MODULE, p), p).toContain('(John 1:29)');
      expect(place(MODULE, p), p).toContain('(Colossians 1:17)');
    }
    for (const p of ['lesson', 'youth', 'teen', 'senior']) expect(place(MODULE, p), p).toMatch(/Eternal Son/);
  });

  it('no decision record is recited at a reader, and the newsletter is not named or linked', () => {
    for (const p of READER_PLACES) expect(place(MODULE, p), p).not.toMatch(/DR-\d{4}/);
    for (const s of stringsOf(MODULE)) {
      expect(s).not.toMatch(/https?:|www\.|Level Up/i);
    }
  });
});

describe('the tiers held apart in every reader place', () => {
  it('every teaching place carries the dated re-review and what is not verified', () => {
    for (const p of TEACHING_PLACES) {
      const t = place(MODULE, p);
      expect(t, p).toContain(REVIEW);
      expect(t, `${p} says the home server today is not verified`).toMatch(/not verified/i);
    }
  });
});

// -----------------------------------------------------------------------------
// The house, measured. If one of these fails, infra/ changed: rebuild the
// lesson's numbers (node scripts/sov100-fill.mjs --rebuild after editing them)
// so the page keeps telling the truth, in either direction (DR-0100).
// -----------------------------------------------------------------------------
function composeFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...composeFiles(p));
    else if (/^(docker-)?compose[\w.-]*\.ya?ml$/.test(name)) out.push(p);
  }
  return out;
}

describe('our own house: every claim the lesson makes is still true of infra/', () => {
  const INFRA = join(REPO, 'infra');
  const files = composeFiles(INFRA).map((p) => ({ rel: relative(REPO, p), text: readFileSync(p, 'utf8') }));
  const live = (t) =>
    t
      .split('\n')
      .filter((l) => !/^\s*#/.test(l))
      .join('\n');
  const count = (re) => files.filter((f) => re.test(live(f.text))).length;

  it('fifteen container recipes', () => {
    expect(files.length, files.map((f) => f.rel).join('\n')).toBe(15);
    expect(MODULE.lesson).toMatch(/There are fifteen container recipes in this repository/);
  });

  it('none runs privileged, and none hands a container the engine’s control socket', () => {
    expect(count(/privileged:\s*true/)).toBe(0);
    expect(count(/docker\.sock/)).toBe(0);
    expect(MODULE.lesson).toMatch(/None of them runs a container with full privileges over the host/);
  });

  it('two forbid gaining new privileges, one drops capabilities, three share the host network', () => {
    expect(count(/no-new-privileges/)).toBe(2);
    expect(count(/cap_drop:/)).toBe(1);
    expect(count(/network_mode:\s*host/)).toBe(3);
    expect(MODULE.lesson).toMatch(/Two of the fifteen forbid a process from gaining new privileges, and one drops network powers/);
    expect(MODULE.lesson).toMatch(/Three share the host's network directly, on purpose/);
  });

  it('no virtual machine layer is described anywhere in infra/', () => {
    const all = files.map((f) => f.text).join('\n');
    expect(all).not.toMatch(/\b(hypervisor|qemu|kvm|proxmox|firecracker|kata-runtime|runsc)\b/i);
    expect(MODULE.lesson).toMatch(/Nothing in our files describes a virtual machine layer/);
  });

  it('the tax upload server runs as a plain service bound to the box’s own loopback', () => {
    const unit = src('infra/nas-tax-ingest/poetech-tax-upload.service');
    expect(unit).toMatch(/ExecStart=.*uvicorn .*--host 127\.0\.0\.1/);
    expect(MODULE.lesson).toMatch(/the tax upload server, is not in a container at all/);
  });
});

describe('the three diagrams Darrell asked for are real and render', () => {
  const KEYS = ['vm-vs-container', 'shared-kernel-reach', 'isolation-stack'];

  it('the module carries exactly the three diagrams, each with a title and a caption', () => {
    expect(MODULE.media.map((x) => x.key)).toEqual(KEYS);
    for (const m of MODULE.media) {
      expect(m.type).toBe('diagram');
      expect(m.title.length).toBeGreaterThan(5);
      expect(m.caption.length).toBeGreaterThan(20);
    }
  });

  it('each key has an authored SVG figure with an accessible label and a title', () => {
    for (const k of KEYS) {
      const el = LESSON_DIAGRAMS[k];
      expect(el, k).toBeTruthy();
      expect(el.type, k).toBe('svg');
      expect(el.props.role, k).toBe('img');
      expect(String(el.props['aria-label']).length, k).toBeGreaterThan(40);
      const kids = [].concat(el.props.children).filter(Boolean);
      expect(
        kids.some((c) => c && c.type === 'title'),
        k
      ).toBe(true);
    }
  });

  it('ChurchLearn spreads the figures into the map MediaList renders from', () => {
    const cl = src('app/src/components/ChurchLearn.jsx');
    expect(cl).toMatch(/import \{ LESSON_DIAGRAMS \} from '\.\/lesson-diagrams\.jsx'/);
    expect(cl).toMatch(/const DIAGRAMS = \{\n {2}\.\.\.LESSON_DIAGRAMS,/);
  });

  it('PROVEN-TO-CATCH: a key with no figure is seen as missing', () => {
    expect(LESSON_DIAGRAMS['no-such-figure']).toBeUndefined();
  });

  it('the figures type no verse text and use no true red (DR-0099)', () => {
    const fig = src('app/src/components/lesson-diagrams.jsx');
    expect(fig).not.toMatch(/#7A1F1F|#FF0000|#F00\b|fill="red"|stroke="red"/i);
    expect(fig).not.toMatch(/If the foundations be destroyed|rooms shalt thou make/);
  });
});

describe('provenance: the generator', () => {
  it('names the thread, fills every verse from the KJV on disk, and measures before it splices', () => {
    const g = src('scripts/sov100-fill.mjs');
    expect(g).toMatch(/1a2087dce8e004bd/);
    expect(g).toMatch(/import \{ kjvText \} from '\.\/lib\/kjv\.mjs'/);
    expect(g).toMatch(/return `"\$\{t\}" \(\$\{r\}\)`/);
    expect(g.indexOf('fourBandFaults(filled)')).toBeGreaterThan(0);
    expect(g.indexOf('fourBandFaults(filled)')).toBeLessThan(g.indexOf('writeFileSync(CATALOG'));
  });
});

describe('the four bands, measured on this tree', () => {
  it('passes the house four-band ladder with no faults', () => {
    expect(fourBandFaults(MODULE)).toEqual([]);
  });

  it('the measurements are what the record says they are', () => {
    // MEASURED 2026-11-23 by scripts/sov100-fill.mjs: adult 2,244 prose words;
    // child 0.528 / youth 0.623 / teen 0.641 / senior 0.631; grades 1.38 <
    // 4.77 < 5.06 < 8.68. Pinned with tolerance.
    expect(words(MODULE.lesson)).toBeGreaterThanOrEqual(2100);
    const g = Object.fromEntries(FOUR_BANDS.map((b) => [b, fk(MODULE.levels[b])]));
    expect(g.child).toBeLessThanOrEqual(5.0);
    expect(g.teen).toBeLessThanOrEqual(6.0);
    expect(g.senior).toBeLessThanOrEqual(10.0);
    let worst = 0;
    for (let i = 0; i < FOUR_BANDS.length; i += 1) {
      for (let j = i + 1; j < FOUR_BANDS.length; j += 1) worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.levels[FOUR_BANDS[j]]));
      worst = Math.max(worst, overlapOf(MODULE.levels[FOUR_BANDS[i]], MODULE.lesson));
    }
    expect(worst).toBeLessThan(0.25);
  });
});
