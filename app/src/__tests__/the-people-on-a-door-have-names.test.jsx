// @vitest-environment jsdom
// =============================================================================
// THE PEOPLE ON A DOOR HAVE NAMES — AND AN EMPTY UNIT IS STILL A PLACE
// =============================================================================
// Darrell, 2026-10-10, on the PEOPLE tab with the invite panel open and a role
// dropdown reading "1099 worker": "Need to be able to add users... 1099
// workers... etc..." and then, one word: "Names?!!!!"
//
// Minutes later, on the WORK BOARD of 805 North Prospect Avenue Apt 2 — "No
// tenancy on this door" — with "Add a microwave and cabinet with exhaust fan
// inside the kitchen." typed in and FILE IT dead: "Workorders don't work...
// can't send...!?!!!!!"
//
// WHAT WAS TRUE, measured:
//
//  1. NO NAME WAS EVER ASKED FOR. property_access_invites.display_name exists,
//     inviteToProperties writes it, workerRoster READS it first and the signed
//     contractor document prints it — and the invite form had no name field
//     and passed no displayName. Everyone invited from inside the door became
//     a phone number: in the Dispatch picker, in the note written on the
//     door's permanent record, and as a blank on the contractor's document.
//     The same invite sent from PoeTech's People-you-know DID pass a name, so
//     two doors into one table disagreed and the one he stood in was lossy.
//
//  2. THE TAB LISTED NOBODY. It rendered the invite form and nothing else,
//     while loadInvites() was already in the component's state and
//     revokeInvite() sat in cloud.js called by NOTHING in the entire app. You
//     could add a person, then never see them, never know if they had signed
//     in, and never take access away from the surface that gave it.
//
//  3. A VACANT UNIT COULD DO NOTHING. tenant_maintenance_requests.tenancy_id
//     is NOT NULL REFERENCES rental_tenancies(id), and every write control
//     keys off `activeDoor`, a TENANCY. So the schema said work only happens
//     where a tenant already lives — and fixing up an empty unit before anyone
//     moves in, the most ordinary landlord job there is, had nowhere to go.
//     The SAME null door disabled "Write the invitation". One cause, both
//     dead buttons, neither saying why.
//
//  4. activeDoor FELL BACK TO doors[0]. Picking a property with no tenancy
//     silently selected a DIFFERENT property's door, so a work order filed
//     there would have attached to the wrong place entirely.
// =============================================================================
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { personName, personContact, peopleOnDoor, whyNotReady } from '../modules/properties/people.js';
import { vacantUnitRow } from '../modules/properties/staging.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));
const read = (...p) => readFileSync(join(HERE, '..', ...p), 'utf8');

const invite = (over = {}) => ({
  id: 'i1', instance_id: 'inst', tenancy_id: 'door-1', scope_ref: 'slug-1',
  role_label: 'field_worker', email: '', invited_phone: '2179040219',
  display_name: null, capabilities: [], revoked: false, claimed_at: null,
  created_at: '2026-10-01T00:00:00Z', ...over,
});

// ── 1. NAMES ────────────────────────────────────────────────────────────────
describe('a person invited to a door has a name', () => {
  it('PROVEN-TO-CATCH: the name they were invited under is the name shown', () => {
    expect(personName(invite({ display_name: 'Marcus Webb' }))).toBe('Marcus Webb');
  });

  it('falls back to the formatted number, never raw digits', () => {
    // This is what EVERY person invited from the door tab used to become.
    expect(personName(invite())).toBe('(217) 904-0219');
  });

  it('reads the number out of a phone-door login address', () => {
    expect(personName(invite({ invited_phone: '', email: '12179040219@phone.poetech.us' })))
      .toBe('(217) 904-0219');
  });

  it('uses the local part of a REAL email when that is all there is', () => {
    expect(personName(invite({ invited_phone: '', email: 'marcus@example.com' }))).toBe('marcus');
  });

  it('says plainly when there is no name rather than inventing one', () => {
    expect(personName(invite({ invited_phone: '', email: '' }))).toBe('Someone (no name given)');
  });

  it('the synthetic phone-door address is NEVER shown as a way to reach them', () => {
    // <digits>@phone.poetech.us is a login identifier, not a contact. Printing
    // it on a roster would teach the landlord an address that reaches nobody.
    const c = personContact(invite({ invited_phone: '', email: '12179040219@phone.poetech.us' }));
    expect(c.kind).toBe('phone');
    expect(c.label).toBe('(217) 904-0219');
    expect(c.label).not.toContain('phone.poetech.us');
  });
});

// ── 2. THE ROSTER ───────────────────────────────────────────────────────────
describe('who is on this door', () => {
  const scope = { instanceId: 'inst', tenancyId: 'door-1', scopeRef: 'slug-1' };

  it('PROVEN-TO-CATCH: lists the people on this door with role and name', () => {
    const { people } = peopleOnDoor([
      invite({ id: 'a', display_name: 'Marcus Webb' }),
      invite({ id: 'b', display_name: 'Rita Alvarez', role_label: 'tenant', invited_phone: '2175550144' }),
    ], scope);
    expect(people.map((p) => `${p.name} · ${p.roleName}`))
      .toEqual(['Marcus Webb · 1099 worker', 'Rita Alvarez · Tenant']);
  });

  it('keeps another door\'s people off this door', () => {
    const { people } = peopleOnDoor([invite({ tenancy_id: 'door-2', scope_ref: 'slug-2' })], scope);
    expect(people).toHaveLength(0);
  });

  it('includes the instance-wide people placed on every door', () => {
    // people-placement.js writes scope_ref '*' with no tenancy — a manager or
    // worker placed across the whole portfolio belongs on each door.
    const { people } = peopleOnDoor(
      [invite({ tenancy_id: null, scope_ref: '*', display_name: 'Dee Monroe', role_label: 'manager' })], scope);
    expect(people).toHaveLength(1);
    expect(people[0].everywhere).toBe(true);
  });

  it('separates the ones whose access was taken away, so a revoke is never silent', () => {
    const { people, removed } = peopleOnDoor([
      invite({ id: 'a', display_name: 'Marcus Webb' }),
      invite({ id: 'b', display_name: 'Gone Guy', invited_phone: '2175550199', revoked: true }),
    ], scope);
    expect(people.map((p) => p.name)).toEqual(['Marcus Webb']);
    expect(removed.map((p) => p.name)).toEqual(['Gone Guy']);
  });

  it('the same person invited twice is one person', () => {
    const { people } = peopleOnDoor([
      invite({ id: 'a', display_name: 'Marcus Webb' }),
      invite({ id: 'b', display_name: 'Marcus Webb' }),
    ], scope);
    expect(people).toHaveLength(1);
  });

  it('says who has actually walked through the door and who has not', () => {
    const { people } = peopleOnDoor([
      invite({ id: 'a', display_name: 'Waiting', invited_phone: '2175550111' }),
      invite({ id: 'b', display_name: 'Arrived', invited_phone: '2175550122', claimed_at: '2026-10-05T00:00:00Z' }),
    ], scope);
    expect(people.map((p) => [p.name, p.joined])).toEqual([['Arrived', true], ['Waiting', false]]);
  });

  it('names the grants in plain language, not capability keys', () => {
    const { people } = peopleOnDoor([invite({ capabilities: ['docs.add'] })], scope);
    expect(people[0].grants).toEqual(['Add job documentation (photos, outcome)']);
  });
});

// ── 3. A DEAD BUTTON ALWAYS SAYS WHY ────────────────────────────────────────
describe('nothing is greyed out in silence', () => {
  it('PROVEN-TO-CATCH: a missing name is the reason, and it is said out loud', () => {
    expect(whyNotReady({ name: '', identified: true, by: 'phone', door: true }))
      .toMatch(/Add their name/);
  });

  it('asks for the area code when the number is short', () => {
    expect(whyNotReady({ name: 'Marcus', identified: false, by: 'phone', door: true }))
      .toMatch(/area code/);
  });

  it('asks for an email on the email door', () => {
    expect(whyNotReady({ name: 'Marcus', identified: false, by: 'email', door: true }))
      .toMatch(/email address/);
  });

  it('is null — the button is live — once everything is in hand', () => {
    expect(whyNotReady({ name: 'Marcus', identified: true, by: 'phone', door: true })).toBeNull();
  });
});

// ── 4. AN EMPTY UNIT IS STILL A PLACE ───────────────────────────────────────
describe('a vacant unit can hold work and people', () => {
  const rental = { id: 'r1', slug: 'slug-1', address: '805 North Prospect Avenue Apt 2', unit: 'Apt 2', instance_id: 'inst' };

  it('PROVEN-TO-CATCH: builds a door record with nobody living in it', () => {
    const b = vacantUnitRow({ instanceId: 'inst', rental });
    expect(b.ok).toBe(true);
    expect(b.row.tenant_name).toBeNull();
    expect(b.row.tenant_email).toBeNull();
    expect(b.row.tenant_phone).toBeNull();
    expect(b.row.monthly_rent).toBe(0);
  });

  it('uses a status the database actually allows', () => {
    // rental_tenancies.status CHECK IN ('pending','active','ended') — 0055:71.
    // A value outside that list is rejected by Postgres at insert time, so the
    // unit record would fail exactly where the work order used to.
    expect(['pending', 'active', 'ended']).toContain(vacantUnitRow({ instanceId: 'inst', rental }).row.status);
  });

  it('carries the rental key the tenancy table expects — the SLUG, not the id', () => {
    // rental_tenancies.rental_ref is TEXT (the slug); property_rooms and
    // property_photos take the UUID. Handing over the wrong one matched
    // nothing and emptied Rooms and Photos on every door (2026-08-27).
    expect(vacantUnitRow({ instanceId: 'inst', rental }).row.rental_ref).toBe('slug-1');
  });

  it('refuses rather than writing a row with no home', () => {
    expect(vacantUnitRow({ instanceId: null, rental }).ok).toBe(false);
    expect(vacantUnitRow({ instanceId: 'inst', rental: null }).ok).toBe(false);
  });
});

// ── 4b. THE FAMILY'S OWN HOME IS NOT A DOOR ────────────────────────────────
describe('the house the family lives in never becomes a tenancy', () => {
  const app = read('modules', 'properties', 'PropertiesApp.jsx');

  it('PROVEN-TO-CATCH: ensureDoor refuses an own home before it writes a row', () => {
    // Found by a peer session reviewing this change, and it was a real hole.
    // isOwnHome already guards OFFERING and LISTING a home; this new path had
    // no guard, so filing work on the house the family lives in would have
    // minted a placeholder tenancy for it — and every rent roll, door list
    // and tenancy report counts rows in that table.
    const at = app.indexOf('const ensureDoor =');
    expect(at).toBeGreaterThan(-1);
    const body = app.slice(at, app.indexOf('}, [activeDoor, activeRental]);', at));
    expect(body).toContain("isOwnHome(activeRental)");
    // Before the write, not after it.
    expect(body.indexOf('isOwnHome(activeRental)')).toBeLessThan(body.indexOf('createTenancy('));
  });

  it('and says why, in words about the home rather than a reason code', () => {
    expect(app).toContain("'own-home': 'This is your own home, not a rental door");
  });
});

// ── 5. THE SOURCE PINS ──────────────────────────────────────────────────────
describe('the wiring the screens depend on', () => {
  const app = read('modules', 'properties', 'PropertiesApp.jsx');

  it('PROVEN-TO-CATCH: the invite form collects a name and sends it', () => {
    expect(app).toContain('data-testid="invite-name"');
    expect(app).toContain('displayName: name.trim()');
  });

  it('the confirmation names the person, not an empty string', () => {
    // It said "Invitation written for ." on every phone invite, because
    // payload.email is '' on that path.
    expect(app).not.toContain('Invitation written for ${payload.email}');
    expect(app).toContain('payload.displayName || payload.email || formatPhone(payload.phone)');
  });

  it('revoke is wired to the surface that grants access', () => {
    expect(app).toContain('revokeInvite(person.id)');
  });

  it('activeDoor never silently falls back to a DIFFERENT property', () => {
    // The defect: `doors.find(...) || doors[0] || null` showed, and filed work
    // against, some OTHER door's tenant when the id named a rental.
    //
    // THIS ASSERTION USED TO READ `expect(app).toContain("rentals.some(...)")`
    // AND THAT WAS THE WRONG KIND OF TEST, as DR-0904 then proved: it pinned
    // one SPELLING of the fix, so it broke the moment the expression changed
    // for a good reason — and, worse, it had nothing to say about whether the
    // guarantee still held. It would have passed just as happily while every
    // message on a vacant door was invisible, which is exactly what was
    // happening.
    //
    // The guarantee is now proven by USING the app, in
    // a-message-stays-on-a-vacant-door.test.jsx: mounted at a unit's address,
    // with a tenancy belonging to a DIFFERENT property in state, the record is
    // read with no tenancy and that property's messages never appear. What
    // stays here is only the thing a render cannot say — that the specific bad
    // expression has not come back.
    expect(app).not.toContain('doors.find((x) => x.id === activeId) || doors[0] || null');
  });

  it('filing work and inviting both go through ensureDoor', () => {
    expect(app).toContain('const ensureDoor =');
    expect(app).toContain('vacantUnitRow({ instanceId, rental: activeRental })');
    // The early return that silently swallowed the whole action is gone.
    expect(app).not.toContain('const submitWorkOrder = async (form) => {\n    if (!activeDoor) return;');
  });
});

// ── 6. THE PROP THAT SILENTLY WINS ──────────────────────────────────────────
describe('a repeated prop can never ship again', () => {
  it('PROVEN-TO-CATCH: eslint forbids duplicate JSX props', () => {
    // Twenty-five of these were live on 2026-10-10 — a second className wins
    // and the first is DROPPED, taking its sizing, spacing and border classes
    // with it, with no error anywhere. The color gates were happy because the
    // color was right; the layout had quietly fallen off the element.
    const cfg = readFileSync(join(HERE, '..', '..', 'eslint.config.js'), 'utf8');
    expect(cfg).toContain("'react/jsx-no-duplicate-props': 'error'");
  });
});

// ── 7. THE SCREEN ───────────────────────────────────────────────────────────
describe('the People tab as the landlord meets it', () => {
  let container, root;
  afterEach(() => {
    try { act(() => root && root.unmount()); } catch { /* noop */ }
    if (container) container.remove();
    container = null; root = null;
  });

  async function mountPeople(props) {
    const mod = await import('../modules/properties/PropertiesApp.jsx');
    const PeopleTab = mod.__PeopleTab;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => { root.render(createElement(PeopleTab, props)); });
    return container;
  }

  const door = { id: 'door-1', instance_id: 'inst', rental_ref: 'slug-1', property_label: '805 N Prospect' };

  it('PROVEN-TO-CATCH: an empty door says so instead of showing a bare form', async () => {
    await mountPeople({ door, place: door, invites: [], onInvite: () => {}, onRevoke: () => {} });
    expect(container.textContent).toContain('Nobody has been invited to this door yet');
    expect(container.querySelector('[data-testid="invite-name"]')).toBeTruthy();
  });

  it('lists the people who ARE on the door, by name', async () => {
    await mountPeople({
      door, place: door, onInvite: () => {}, onRevoke: () => {},
      invites: [invite({ display_name: 'Marcus Webb' })],
    });
    expect(container.querySelectorAll('[data-testid="door-person"]')).toHaveLength(1);
    expect(container.textContent).toContain('Marcus Webb');
    expect(container.textContent).toContain('1099 worker');
  });

  it('says why the invite button is dead instead of leaving it grey and silent', async () => {
    await mountPeople({ door, place: door, invites: [], onInvite: () => {}, onRevoke: () => {} });
    const why = container.querySelector('[data-testid="invite-blocked"]');
    expect(why, 'a disabled button with no reason is the defect').toBeTruthy();
    expect(why.textContent).toMatch(/Add their name/);
  });

  it('hands the typed name to the invite', async () => {
    let sent = null;
    await mountPeople({ door, place: door, invites: [], onInvite: (p) => { sent = p; }, onRevoke: () => {} });
    const setValue = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => { setValue(container.querySelector('[data-testid="invite-name"]'), 'Marcus Webb'); });
    await act(async () => { setValue(container.querySelector('input[type="tel"]'), '2179040219'); });
    const write = [...container.querySelectorAll('button')].find((b) => /write the invitation/i.test(b.textContent));
    expect(write.disabled, 'the button should be live once name and number are in').toBe(false);
    await act(async () => { write.click(); });
    expect(sent.displayName).toBe('Marcus Webb');
  });
});
