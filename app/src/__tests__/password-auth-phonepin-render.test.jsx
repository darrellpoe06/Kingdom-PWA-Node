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

describe('phone+PIN is a prominent, findable way in (no email needed)', () => {
  it('the first screen offers phone+PIN as a real button, not fine print', async () => {
    await mount({ mode: 'signup' });
    const phoneBtn = btn(/no email\?.*phone/i);
    expect(phoneBtn, 'the "No email? phone + PIN" option is missing from the first screen').toBeTruthy();
    // a real tap target, bordered — not a muted inline text link
    expect(phoneBtn.className).toMatch(/min-h-\[48px\]/);
    expect(phoneBtn.className).toMatch(/border-2/);
  });

  it('tapping it opens a door that needs phone + PIN + name — and NEVER an email', async () => {
    await mount({ mode: 'signup' });
    await act(async () => { btn(/no email\?.*phone/i).click(); });
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
    expect(labels).toContain('Your name');
    expect(labels).toContain('Cell phone number');
    expect(labels.some((l) => /6-digit PIN/i.test(l))).toBe(true);
    // no email field anywhere on the phone path
    expect([...container.querySelectorAll('input')].some((i) => i.type === 'email')).toBe(false);
    expect(container.textContent.toLowerCase()).toContain('no email needed');
  });

  it('there is no lockout — the phone door links back to email', async () => {
    await mount({ mode: 'signup' });
    await act(async () => { btn(/no email\?.*phone/i).click(); });
    expect(btn(/use email instead/i)).toBeTruthy();
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
