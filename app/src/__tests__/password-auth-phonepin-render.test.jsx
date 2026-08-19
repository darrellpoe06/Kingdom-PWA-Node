// =============================================================================
// PasswordAuth — the phone+PIN "no email" way is a first-class, findable door
// =============================================================================
// DR-0172 (Darrell: "not everyone has an email so cellphone and pin"). The
// COLG congregation includes members with NO email; the phone+PIN option must
// be a PROMINENT choice on the first screen (not buried fine print), and the
// phone+PIN door must ask for exactly phone + a 6-digit PIN + name — no email.
// Proven-to-catch: if the option regresses to hidden, or email creeps back into
// the phone path, this fails.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
import PasswordAuth from '../components/PasswordAuth.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PasswordAuth, props)); });
}
afterEach(() => { if (root) act(() => root.unmount()); if (container) container.remove(); root = container = null; });

const btn = (re) => [...container.querySelectorAll('button')].find((b) => re.test(b.textContent));

describe('phone+PIN LEADS — the first screen IS the no-email door (DR-0307 §3)', () => {
  // 2026-08-19, first post-cutover sign-in: the email link led, and on the
  // sovereign stack (SMTP deliberately absent) it walked straight into "we
  // can't reach our service." The door now leads with what works: phone+PIN
  // is the FIRST screen, email is the toggle. Proven-to-catch: if the email
  // link ever leads again, this fails.
  it('the first screen asks for phone + PIN + name — and NEVER an email', async () => {
    await mount({ mode: 'signup' });
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
    expect(labels).toContain('Your name');
    expect(labels).toContain('Cell phone number');
    expect(labels.some((l) => /6-digit PIN/i.test(l))).toBe(true);
    // no email field anywhere on the first screen
    expect([...container.querySelectorAll('input')].some((i) => i.type === 'email')).toBe(false);
    expect(container.textContent.toLowerCase()).toContain('no email needed');
  });

  it('there is no lockout — the phone door links to email, and email links back', async () => {
    await mount({ mode: 'signup' });
    expect(btn(/use email instead/i)).toBeTruthy();
    await act(async () => { btn(/use email instead/i).click(); });
    // the email door renders, and the way back to phone+PIN is a real button
    expect([...container.querySelectorAll('input')].some((i) => i.type === 'email')).toBe(true);
    const phoneBtn = btn(/no email\?.*phone/i);
    expect(phoneBtn, 'the way back to phone+PIN is missing from the email door').toBeTruthy();
    expect(phoneBtn.className).toMatch(/min-h-\[48px\]/);
    expect(phoneBtn.className).toMatch(/border-2/);
  });
});

describe('the church door wears the church, not PoeTech (DR-0174)', () => {
  const CHURCH_BRAND = { name: 'The Love Corner', eyebrow: 'The Church of the Living God', logo: '/lovecorner-icon-192.png' };

  it('with a church brand: shows the church name + logo, not "PoeTech"', async () => {
    await mount({ mode: 'signup', brand: CHURCH_BRAND });
    expect(container.textContent).toContain('The Church of the Living God');
    expect(container.textContent).not.toContain('PoeTech');
    const logo = container.querySelector('img[src="/lovecorner-icon-192.png"]');
    expect(logo, 'the church logo is not on the sign-in gate').toBeTruthy();
  });

  it('with NO brand: PoeTech front door is unchanged', async () => {
    await mount({ mode: 'signup' });
    expect(container.textContent).toContain('PoeTech');
    expect(container.querySelector('img[src="/lovecorner-icon-192.png"]')).toBeNull();
  });
});
