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

function scan(file) {
  const src = readFileSync(join(COMPONENTS, file), 'utf8');
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
});
