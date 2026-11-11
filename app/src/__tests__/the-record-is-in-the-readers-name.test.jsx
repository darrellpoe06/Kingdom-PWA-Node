// the-record-is-in-the-readers-name — the head of a record is the reader's
// name, with who they are beneath it; a sign-in address is never the heading
// when a name is known. DR-1421.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { learnerIdentity, accountName, householdPoints } from '../lib/learner-identity.js';
import { buildContactIndex } from '../lib/contact-names.js';
import { rowToRecord } from '../lib/learner-records.js';

const contacts = buildContactIndex([{ name: 'DJ Poe', phones: ['+1 (447) 220-9779'], emails: [] }]);
vi.mock('../lib/contact-names.js', async (orig) => {
  const real = await orig();
  return { ...real, loadContactIndex: async () => real.buildContactIndex([{ name: 'DJ Poe', phones: ['+1 (447) 220-9779'], emails: [] }]) };
});
const SON_ID = 'b0000000-0000-4000-a000-000000000250';
const DAD_ID = 'b0000000-0000-4000-a000-000000000001';
const HOUSE = {
  name: 'Poe Family',
  count: 3,
  byUser: new Map([
    [SON_ID, { userId: SON_ID, displayName: 'Christian', role: 'child', relationship: 'Son' }],
    [DAD_ID, { userId: DAD_ID, displayName: 'Darrell Poe', role: 'owner', relationship: '' }],
  ]),
};
const house = { current: { name: '', count: 0, byUser: new Map() } };
vi.mock('../lib/learner-household.js', () => ({
  emptyHousehold: () => ({ name: '', count: 0, byUser: new Map() }),
  loadLearnerHousehold: async () => house.current,
}));
const { default: LearnersPanel } = await import('../components/LearnersPanel.jsx');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const DOOR = '14472209779@phone.poetech.us';

describe('who the reader is', () => {
  it('the name on their own record comes first', () => {
    expect(learnerIdentity({ label: 'Darrell Poe', ageBand: 'adult' })).toMatchObject({
      name: 'Darrell Poe',
      named: true,
      source: 'record',
      points: ['Reads at the Adult level'],
    });
  });
  it("PROVEN TO CATCH: a phone-door address is named from the viewer's contacts, and the number becomes a line beneath", () => {
    const who = learnerIdentity({ label: DOOR, ageBand: 'child' }, { contacts });
    expect(who.name).toBe('DJ Poe');
    expect(who.name).not.toMatch(/@|poetech/);
    expect(who.points).toEqual(['Reads at the Child level', 'Signs in by phone (447) 220-9779', 'Named from your contacts']);
  });
  it('with no name anywhere it is the readable number, never the raw address, and says how a name gets there', () => {
    const who = learnerIdentity({ label: DOOR, ageBand: 'child' });
    expect(who).toMatchObject({ name: '(447) 220-9779', named: false, source: 'none' });
    expect(who.points[1]).toMatch(/Save this number in your contacts with their name/);
    expect(learnerIdentity({ label: 'someone@example.org' }).name).toBe('someone@example.org');
    expect(learnerIdentity({}).name).toBe('A reader');
  });
  it('a reader on their own record always sees how they sign in, so they know it is theirs', () => {
    expect(learnerIdentity({ label: DOOR, ageBand: 'teen' }, { mine: true }).points).toEqual([
      'This is your own record',
      'Reads at the Teen level',
      'Signs in by phone (447) 220-9779',
    ]);
  });
  it("the account's own name is used when it has one, and an address is never taken for a name", () => {
    expect(accountName({ user_metadata: { full_name: ' Christina Poe ' } })).toBe('Christina Poe');
    expect(accountName({ user_metadata: { first_name: 'DJ', last_name: 'Poe' } })).toBe('DJ Poe');
    expect(accountName({ user_metadata: { name: 'x@y.org' } })).toBe('');
    expect(accountName({ email: 'x@y.org' })).toBe('');
    expect(accountName(null)).toBe('');
  });
});

describe('who they are in the household', () => {
  it('a child: the relationship, that they are under a guardian, and the household by name', () => {
    const who = learnerIdentity({ userId: SON_ID, label: DOOR, ageBand: 'child' }, { household: HOUSE });
    expect(who).toMatchObject({ name: 'Christian', named: true, source: 'household' });
    expect(who.points).toEqual([
      'Relationship: Son',
      'A child on the household account, under a guardian',
      'Household: Poe Family, 3 people',
      'Reads at the Child level',
      'Signs in by phone (447) 220-9779',
    ]);
  });
  it('a parent holds the account, and the name on their own record still comes first', () => {
    const who = learnerIdentity({ userId: DAD_ID, label: 'Darrell', ageBand: 'adult' }, { household: HOUSE, mine: true });
    expect(who.name).toBe('Darrell');
    expect(who.points.slice(0, 3)).toEqual([
      'This is your own record',
      'Head of the household account (a parent or guardian)',
      'Household: Poe Family, 3 people',
    ]);
  });
  it('one person alone is an individual account, not a household', () => {
    const solo = { name: 'Sam', count: 1, byUser: new Map([['u', { userId: 'u', displayName: 'Sam', role: 'owner' }]]) };
    expect(householdPoints(solo.byUser.get('u'), solo)).toEqual(['Head of the household account (a parent or guardian)', 'An individual account (Sam)']);
  });
  it('PROVEN TO CATCH: a reader the roster does not list gets no household line, never a guess', () => {
    expect(householdPoints(null, HOUSE)).toEqual([]);
    expect(learnerIdentity({ userId: 'stranger', label: 'Pat', ageBand: 'adult' }, { household: HOUSE }).points).toEqual(['Reads at the Adult level']);
    expect(householdPoints({ role: 'assistant' }, { count: 0 })).toEqual(['Role: assistant']);
  });
});

describe('on the record', () => {
  let root;
  let host;
  afterEach(() => {
    if (root) act(() => root.unmount());
    if (host) host.remove();
    root = null;
    host = null;
  });
  const ME = 'b0000000-0000-4000-a000-000000000001';
  const SON = 'b0000000-0000-4000-a000-000000000250';
  const rec = (over) =>
    rowToRecord({
      user_id: SON,
      lesson_id: 'L1',
      course_key: 'c',
      learner_label: DOOR,
      age_band: 'child',
      completed_at: null,
      quiz_pct: 100,
      quiz_passed: true,
      quiz_attempts: 1,
      quiz_at: '2026-11-10T10:00:00.000Z',
      updated_at: '2026-11-10T10:00:00.000Z',
      ...over,
    });
  const mount = async (props) => {
    host = document.createElement('div');
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(createElement(LearnersPanel, props));
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  it("the Governor sees the reader's name as the heading and in the drop-down, with who they are beneath", async () => {
    await mount({
      records: [rec(), rec({ user_id: ME, learner_label: 'Darrell Poe', age_band: 'adult', lesson_id: 'L2' })],
      currentUserId: ME,
      isGovernor: true,
      titleOf: () => null,
    });
    const pick = host.querySelector('[data-testid="learner-pick"]');
    expect([...pick.querySelectorAll('option')].map((o) => o.textContent.split(' · ')[0])).toEqual(['You', 'DJ Poe']);
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(pick, SON);
      pick.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(host.querySelector('[data-testid="learner-name"]').textContent).toBe('DJ Poe');
    expect(host.querySelector('[data-testid="learner-head"]').textContent).toMatch(/^The record ofDJ Poe/);
    const points = [...host.querySelectorAll('[data-testid="learner-points"] li')].map((li) => li.textContent);
    expect(points.slice(0, 3)).toEqual(['Reads at the Child level', 'Signs in by phone (447) 220-9779', 'Named from your contacts']);
    expect(points[3]).toMatch(/^Last active /);
    expect(host.querySelector('[data-testid="learner-name"]').textContent).not.toMatch(/@/);
  });
  it('PROVEN TO CATCH: an exam average is not called Mastered on a record with no lesson read (DR-1416)', async () => {
    await mount({ records: [rec()], currentUserId: ME, isGovernor: true, titleOf: () => null });
    const head = host.querySelector('[data-testid="learner-head"]').textContent;
    expect(head).toMatch(/Exam average 90% or more/);
    expect(head).not.toMatch(/Mastered/i);
  });
  it('with the household roster, the head is the name it holds and the lines say who they are in it', async () => {
    house.current = HOUSE;
    try {
      await mount({ records: [rec()], currentUserId: ME, isGovernor: true, titleOf: () => null });
      expect(host.querySelector('[data-testid="learner-name"]').textContent).toBe('Christian');
      const points = [...host.querySelectorAll('[data-testid="learner-points"] li')].map((li) => li.textContent);
      expect(points.slice(0, 3)).toEqual(['Relationship: Son', 'A child on the household account, under a guardian', 'Household: Poe Family, 3 people']);
    } finally {
      house.current = { name: '', count: 0, byUser: new Map() };
    }
  });
  it('a reader on their own record is told it is theirs and how they sign in', async () => {
    await mount({ records: [rec({ user_id: ME })], currentUserId: ME, titleOf: () => null });
    expect(host.querySelector('[data-testid="learner-head"]').textContent).toMatch(/^Your record/);
    expect(host.querySelector('[data-testid="learner-name"]').textContent).toBe('You');
    expect([...host.querySelectorAll('[data-testid="learner-points"] li')].map((li) => li.textContent).slice(0, 3)).toEqual([
      'This is your own record',
      'Reads at the Child level',
      'Signs in by phone (447) 220-9779',
    ]);
  });
});
