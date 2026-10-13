// =============================================================================
// ChurchGivingBook -- live render proof (Verification Doctrine: observe the REAL
// surface). Every other test for this feature reads source text or exercises the
// pure libraries; NONE of them mounts the component. A screen that crashes on
// render would have passed all 31 of them, so this file mounts the real thing
// against a mocked sync layer and drives the steward's actual path.
//
// The sync layer is mocked rather than the database, because the walls the
// feature exists to keep are RLS and are not observable from jsdom. What IS
// observable here, and what this file is for: does it render at all, does each
// honest state say the right thing, does the money reach the screen intact, and
// does the review list offer the right people without deciding for anybody.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// --- the seam -----------------------------------------------------------------
const state = {
  batches: { ok: true, batches: [] },
  claims: { ok: true, claims: [] },
  aliases: { ok: true, aliases: {}, aliasNames: {} },
  members: [],
};

vi.mock('../lib/church-giving-book-sync.js', () => ({
  fetchBatches: vi.fn(() => Promise.resolve(state.batches)),
  fetchClaims: vi.fn(() => Promise.resolve(state.claims)),
  fetchAliases: vi.fn(() => Promise.resolve(state.aliases)),
  importBatch: vi.fn(() => Promise.resolve({ ok: true, inserted: 2, skipped: 0, batch: {}, claims: [] })),
  confirmClaimGiver: vi.fn(() => Promise.resolve({ ok: true, claim: {} })),
  setDeposit: vi.fn(() => Promise.resolve({ ok: true, batch: {} })),
  removeBatch: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock('../lib/member-roles.js', () => ({
  listInstanceMembers: vi.fn(() => Promise.resolve(state.members)),
}));

const { default: ChurchGivingBook } = await import('../components/ChurchGivingBook.jsx');

const claim = (over = {}) => ({
  id: 'c1', slug: 's1', batchId: 'b1',
  giverName: 'Mary Ann Coleman', parishionerId: null, matchBasis: 'none',
  givenOn: '2026-09-06', givenAt: '09:14:00',
  grossCents: 5000, feeCents: 29, amountClaimedCents: 4971,
  fund: 'offering', note: 'tithe', txnId: 'TX1', ...over,
});

let container, root;
beforeEach(() => {
  state.batches = { ok: true, batches: [] };
  state.claims = { ok: true, claims: [] };
  state.aliases = { ok: true, aliases: {}, aliasNames: {} };
  state.members = [];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); vi.clearAllMocks(); });

async function mount(props = {}) {
  await act(async () => {
    root.render(createElement(ChurchGivingBook, { churchName: 'The Church of the Living God', instanceId: 'i1', ...props }));
  });
}

const clickText = async (selector, text) => {
  const el = [...container.querySelectorAll(selector)].find((n) => n.textContent.includes(text));
  expect(el, `no ${selector} containing "${text}"`).toBeTruthy();
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  return el;
};

// -----------------------------------------------------------------------------
describe('it renders at all', () => {
  it('mounts without throwing and shows the book', async () => {
    await mount();
    expect(container.textContent).toMatch(/The Giving Book/);
  });

  it('says what it is and what it is not, on the screen itself', async () => {
    await mount();
    // A working record is not a tax statement, and the surface must say so
    // where the steward reads it -- not only in a comment.
    expect(container.textContent).toMatch(/church-issued tax statement/i);
  });

  it('offers the three steps of the steward’s actual loop', async () => {
    await mount();
    const tabs = [...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
    expect(tabs.some((t) => /Import a statement/.test(t))).toBe(true);
    expect(tabs.some((t) => /Who gave/.test(t))).toBe(true);
    expect(tabs.some((t) => /Reports/.test(t))).toBe(true);
  });
});

describe('the honest states are distinguishable on screen', () => {
  it('a member who is not the office is told so, NOT shown an empty book', async () => {
    state.batches = { ok: false, reason: 'forbidden', batches: [] };
    await mount();
    expect(container.textContent).toMatch(/does not have office access/);
    // and must NOT imply the church received nothing
    expect(container.textContent).not.toMatch(/Nothing has been imported yet/);
  });

  it('a failed read says it is a connection problem, not an empty book', async () => {
    state.claims = { ok: false, reason: 'error', claims: [] };
    await mount();
    expect(container.textContent).toMatch(/connection problem, not an empty book/);
  });

  it('signed out says sign in; no church says no church', async () => {
    state.batches = { ok: false, reason: 'signed-out', batches: [] };
    await mount();
    expect(container.textContent).toMatch(/signed out/i);

    await act(async () => root.unmount());
    container.remove();
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    state.batches = { ok: false, reason: 'no-church', batches: [] };
    await mount();
    expect(container.textContent).toMatch(/not linked to a church/i);
  });

  it('an empty but READABLE book reports nothing imported, which is true', async () => {
    await mount();
    await clickText('[role="tab"]', 'Reports');
    expect(container.textContent).toMatch(/Nothing has been imported yet/);
  });
});

describe('the money reaches the screen intact', () => {
  it('a gift shows its amount, its date AND its time — the meeting asked for times', async () => {
    state.claims = { ok: true, claims: [claim()] };
    await mount();
    await clickText('[role="tab"]', 'Who gave');
    expect(container.textContent).toMatch(/Mary Ann Coleman/);
    expect(container.textContent).toMatch(/\$49\.71/);       // net, what arrived
    expect(container.textContent).toMatch(/2026-09-06/);
    expect(container.textContent).toMatch(/09:14:00/);
    expect(container.textContent).toMatch(/tithe/);           // the giver's own note
  });

  it('renders sub-dollar and negative amounts correctly rather than as NaN', async () => {
    state.claims = { ok: true, claims: [
      claim({ id: 'c2', giverName: 'Small Gift', amountClaimedCents: 5 }),
      claim({ id: 'c3', giverName: 'A Refund', amountClaimedCents: -1235 }),
    ] };
    await mount();
    await clickText('[role="tab"]', 'Who gave');
    expect(container.textContent).toMatch(/\$0\.05/);
    expect(container.textContent).toMatch(/-\$12\.35/);
    expect(container.textContent).not.toMatch(/NaN/);
  });

  it('the reports total the claims rather than painting a number', async () => {
    state.claims = { ok: true, claims: [
      claim({ id: 'c1', amountClaimedCents: 4971 }),
      claim({ id: 'c2', giverName: 'Bee', amountClaimedCents: 1988, txnId: 'TX2' }),
    ] };
    await mount();
    await clickText('[role="tab"]', 'Reports');
    expect(container.textContent).toMatch(/\$69\.59/);        // 49.71 + 19.88, summed from the rows
  });
});

describe('who gave — it proposes, it never decides', () => {
  it('offers the matching member as a CHOICE, with nothing preselected', async () => {
    state.members = [{ userId: 'p1', displayName: 'Mary Coleman', email: 'm@x.com' }];
    state.claims = { ok: true, claims: [claim()] };
    await mount();
    await clickText('[role="tab"]', 'Who gave');

    const select = container.querySelector('select[id^="m-"]');
    expect(select, 'the office must be offered a choice').toBeTruthy();
    // Nothing is chosen for them: the first option is the prompt, not a person.
    expect(select.value).toBe('');
    const options = [...select.options].map((o) => o.textContent);
    expect(options[0]).toMatch(/Choose the member/);
    expect(options.some((o) => /Mary Coleman/.test(o))).toBe(true);
    // The basis is shown, so the steward can judge the proposal rather than
    // trust a bare name.
    expect(options.some((o) => /matched on/.test(o))).toBe(true);
  });

  it('a name nobody on the roll resembles keeps its money and says so plainly', async () => {
    state.members = [{ userId: 'p1', displayName: 'Mary Coleman' }];
    state.claims = { ok: true, claims: [claim({ id: 'c9', giverName: 'Zzzz Nobody', amountClaimedCents: 2500 })] };
    await mount();
    await clickText('[role="tab"]', 'Who gave');
    expect(container.textContent).toMatch(/No member on the roll resembles this name/);
    expect(container.textContent).toMatch(/\$25\.00/);        // still on the books
  });

  it('confirming a giver calls the sync layer with the person the steward picked', async () => {
    const { confirmClaimGiver } = await import('../lib/church-giving-book-sync.js');
    state.members = [{ userId: 'p1', displayName: 'Mary Coleman' }];
    state.claims = { ok: true, claims: [claim()] };
    await mount();
    await clickText('[role="tab"]', 'Who gave');

    const select = container.querySelector('select[id^="m-"]');
    await act(async () => {
      select.value = 'p1';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(confirmClaimGiver).toHaveBeenCalled();
    const [claimId, parishionerId, , opts] = confirmClaimGiver.mock.calls[0];
    expect(claimId).toBe('c1');
    expect(parishionerId).toBe('p1');
    // The statement name rides along so the alias is remembered next month.
    expect(opts.statementName).toBe('Mary Ann Coleman');
  });

  it('a matched gift drops off the review list', async () => {
    state.claims = { ok: true, claims: [claim({ parishionerId: 'p1' })] };
    state.members = [{ userId: 'p1', displayName: 'Mary Coleman' }];
    await mount();
    await clickText('[role="tab"]', 'Who gave');
    expect(container.textContent).toMatch(/Every gift in the book is matched/);
  });
});

describe('reconciliation never overstates what it knows', () => {
  const batch = (over = {}) => ({
    id: 'b1', slug: 'b1', onlineSource: 'cashapp', onlineBatchId: 'TX3',
    payoutOn: '2026-09-08', serviceDate: '2026-09-06',
    depositCents: null, grossCents: 7000, feesCents: 41, onlineTotalCents: 6959,
    giftCount: 2, note: '', ...over,
  });

  it('an unchecked batch says so instead of reading as balanced', async () => {
    state.batches = { ok: true, batches: [batch()] };
    await mount();
    expect(container.textContent).toMatch(/Not checked yet/);
    expect(container.textContent).not.toMatch(/tie to the deposit exactly/);
  });

  it('asks for the BANK figure, by hand, and says why', async () => {
    state.batches = { ok: true, batches: [batch()] };
    await mount();
    expect(container.querySelector('input[id^="dep-"]')).toBeTruthy();
    expect(container.textContent).toMatch(/the bank is the independent witness/i);
  });

  it('a batch whose deposit was entered reports a real verdict', async () => {
    state.batches = { ok: true, batches: [batch({ depositCents: 6959 })] };
    await mount();
    expect(container.textContent).not.toMatch(/Not checked yet/);
    // Whatever reconcileBatch concludes, the screen must state a verdict rather
    // than leave the steward guessing.
    expect(container.textContent).toMatch(/tie|balanc|differ|short|over/i);
  });
});

describe('nothing is written by looking', () => {
  it('mounting and browsing every tab never calls a write path', async () => {
    const sync = await import('../lib/church-giving-book-sync.js');
    state.claims = { ok: true, claims: [claim()] };
    state.batches = { ok: true, batches: [] };
    await mount();
    await clickText('[role="tab"]', 'Who gave');
    await clickText('[role="tab"]', 'Reports');
    await clickText('[role="tab"]', 'Import a statement');
    for (const write of ['importBatch', 'confirmClaimGiver', 'setDeposit', 'removeBatch']) {
      expect(sync[write], `${write} must not fire from reading`).not.toHaveBeenCalled();
    }
  });

  it('the import tab says plainly that picking a file saves nothing', async () => {
    await mount();
    expect(container.textContent).toMatch(/Nothing is saved when you pick a file/);
  });
});

describe('it survives a phone', () => {
  // jsdom cannot measure geometry, so this asserts the STRUCTURE that makes the
  // layout safe rather than claiming a measurement it did not take. A six-column
  // money table is wider than a phone by construction; the house rule is that a
  // table may exceed the viewport ONLY inside its own overflow-x container, so
  // the page body never scrolls sideways. A real measured pass belongs on the
  // live build (DR-0104); this keeps the container from being deleted meanwhile.
  it('every report table sits inside its own horizontal-scroll container', async () => {
    state.claims = { ok: true, claims: [claim()] };
    await mount();
    await clickText('[role="tab"]', 'Reports');
    const tables = [...container.querySelectorAll('table')];
    expect(tables.length, 'the reports tab should render tables').toBeGreaterThan(0);
    for (const t of tables) {
      const wrapper = t.parentElement;
      expect(wrapper, 'a table must have a wrapper').toBeTruthy();
      expect(
        wrapper.className,
        `a ${t.querySelectorAll('thead th').length}-column table must be in an overflow-x container`,
      ).toMatch(/overflow-x-auto/);
    }
  });

  it('no element declares a min-width wider than a narrow phone', async () => {
    // A min-width in px on anything but the scroll container reintroduces the
    // sideways scroll the wrapper exists to prevent.
    state.claims = { ok: true, claims: [claim()] };
    state.batches = { ok: true, batches: [] };
    await mount();
    const offenders = [...container.querySelectorAll('*')].filter((el) => {
      const mw = el.style && el.style.minWidth;
      return mw && mw.endsWith('px') && parseFloat(mw) > 360;
    });
    expect(offenders.map((e) => e.tagName + '.' + e.className)).toEqual([]);
  });
});
