// @vitest-environment node
// =============================================================================
// member-surfaces-every-control-acts — no dead button, no dead link, on any
// surface a church member reaches (gate, DR-0076 §2/§3)
// =============================================================================
// Darrell, 2026-09-09: "all processes where the user will have access to...
// testing for making sure each link and button works and does what we intend."
// The journey walk (a real Chromium tapping every control on every church tab,
// session note 2026-09-09-notifications-everywhere...) is the behavioural
// proof for one build; this is the STANDING half — the static shape a control
// must have to act at all, checked on every push:
//   • every <button> carries a handler (onClick), submits a form (type="submit"
//     / a `form=` binding), or spreads props from a caller who does;
//   • no anchor is `href="#"` / `href=""` — a link that goes nowhere is a lie
//     in the shape of a control (UX-PATTERNS 2g.3's sibling for links).
// Proven-to-catch: a <button> with no onClick in any listed file fails by
// file:line; so does href="#".
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMPONENTS = join(HERE, '..', 'components');

/** The surfaces a signed-in member (not only a leader) can reach on the church door. */
export const MEMBER_SURFACES = [
  ...readdirSync(COMPONENTS).filter((f) => /^Church.*\.jsx$/.test(f)),
  'Pulpit.jsx', 'Engagement.jsx', 'DirectMessages.jsx', 'ReactionBar.jsx',
  'MyProfile.jsx', 'ProfileCard.jsx', 'PushNotifications.jsx', 'LiveWorshipBar.jsx',
  'ServiceProgram.jsx', 'Choir.jsx', 'BusMinistry.jsx',
].filter((f, i, a) => a.indexOf(f) === i);

const ACTS = /onClick|type="submit"|type=\{|\bform=|\{\.\.\./;

// A COMMENT IS NOT A CONTROL (2026-11-05, DR-1327). This scanned raw source,
// so a `<button>` written inside a JSX comment — `{/* the title sits inside a
// <button>, which the reader skips */}` — was reported as a dead control at
// the comment's own line. Measured: that is exactly what happened on the
// DR-1327 branch, where an explanatory comment in ChurchLearn.jsx failed this
// gate while the real button two lines below carried its onClick.
//
// A gate that cries wolf gets switched off (DR-0282 says so in its own words),
// so block comments are blanked before the scan. They are replaced with
// newlines rather than removed, so every reported line number still points at
// the real line in the file.
//
// LIMIT, stated rather than hidden: only BLOCK comments are blanked. A `//`
// line comment is left alone on purpose — stripping from `//` to end of line
// would also cut `href="https://…"` in two and invent findings, which is the
// same wolf-cry in the other direction. `re-review: 2026-12-05`.
export function withoutBlockComments(src) {
  return String(src).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

function scan(file) {
  const src = withoutBlockComments(readFileSync(join(COMPONENTS, file), 'utf8'));
  const dead = [];
  for (const m of src.matchAll(/<button\b[^>]*?>/gs)) {
    if (!ACTS.test(m[0])) dead.push(`${file}:${src.slice(0, m.index).split('\n').length} ${m[0].slice(0, 80).replace(/\s+/g, ' ')}`);
  }
  for (const m of src.matchAll(/href=(?:"#"|""|\{\s*['"]#?['"]\s*\})/g)) {
    dead.push(`${file}:${src.slice(0, m.index).split('\n').length} dead href`);
  }
  const buttons = (src.match(/<button\b/g) || []).length;
  return { dead, buttons };
}

describe('every control on a member surface acts', () => {
  it('scans real surfaces with real buttons (never vacuous)', () => {
    let total = 0;
    for (const f of MEMBER_SURFACES) total += scan(f).buttons;
    expect(MEMBER_SURFACES.length).toBeGreaterThan(10);
    expect(total).toBeGreaterThan(100);
  });

  it('no button without a handler, no link to nowhere', () => {
    const dead = MEMBER_SURFACES.flatMap((f) => scan(f).dead);
    expect(dead, `dead controls — a member would tap these and nothing would happen:\n${dead.join('\n')}`).toEqual([]);
  });

  it('PROVES it would catch a dead button and a dead link', () => {
    const src = '<button className="x">Tap me</button>\n<a href="#">nowhere</a>';
    const dead = [];
    for (const m of src.matchAll(/<button\b[^>]*?>/gs)) if (!ACTS.test(m[0])) dead.push('button');
    for (const _m of src.matchAll(/href=(?:"#"|""|\{\s*['"]#?['"]\s*\})/g)) dead.push('href');
    expect(dead).toEqual(['button', 'href']);
  });

  // ── DR-1327: a comment is not a control ──────────────────────────────────

  it('PROVEN TO CATCH ITS OWN WOLF-CRY: the real comment that failed this gate', () => {
    // The literal text from ChurchLearn.jsx that turned this gate red on the
    // DR-1327 branch, reconstructed rather than remembered.
    const real = `                    {/* THIS ROW OF LINKS IS NOT READ ALOUD (DR-1327). Measured
                        2026-11-05 against the real buildFollowMap: the lesson
                        TITLE sits inside a <button>, which the reader already
                        skips as chrome, so the only thing that reached the
                        voice was the trailing span. */}
                    <button type="button" onClick={() => openLesson(n.id)}>Go</button>`;
    // The OLD behaviour, asserted so the fix rests on a measurement: scanning
    // raw source finds the comment's <button> and calls it dead.
    const rawDead = [...real.matchAll(/<button\b[^>]*?>/gs)].filter((m) => !ACTS.test(m[0]));
    expect(rawDead.length, 'if this is 0 the wolf-cry is gone and this case is pointless').toBe(1);
    // And the fix: with block comments blanked, only the real button remains,
    // and it acts.
    const clean = withoutBlockComments(real);
    const dead = [...clean.matchAll(/<button\b[^>]*?>/gs)].filter((m) => !ACTS.test(m[0]));
    expect(dead).toEqual([]);
  });

  it('blanking a comment keeps every later line number honest', () => {
    const src = 'a\n/* one\ntwo\nthree */\n<button className="x">dead</button>\n';
    const clean = withoutBlockComments(src);
    expect(clean.split('\n').length).toBe(src.split('\n').length);
    const m = [...clean.matchAll(/<button\b[^>]*?>/gs)][0];
    expect(clean.slice(0, m.index).split('\n').length, 'the dead button is still reported on line 5').toBe(5);
  });

  it('PROVEN NOT TO OVER-REACH: a real dead button beside a comment is still caught', () => {
    const src = '/* a <button> in prose */\n<button className="x">Tap me</button>';
    const clean = withoutBlockComments(src);
    const dead = [...clean.matchAll(/<button\b[^>]*?>/gs)].filter((m) => !ACTS.test(m[0]));
    expect(dead.length, 'blanking comments must not blind the gate to a real dead control').toBe(1);
  });
});
