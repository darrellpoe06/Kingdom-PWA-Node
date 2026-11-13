// @vitest-environment jsdom
// =============================================================================
// ChurchInstitute — the landing says what is true: real courses open in Learn,
// planned programs read Planned, enrollment is closed until the office
// confirms, and nothing claims accreditation (brief rules 6 and 7). Slice B
// (DR-1460): with the office's row confirmed + open, a signed-in member
// applies through the seam and sees their own standing and certificate; the
// office desk mounts only for owner/admin; anyone verifies a code.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchInstitute from '../components/ChurchInstitute.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const I = '00000000-0000-4000-b000-000000010325';
const U = '00000000-0000-4000-a000-0000000b0325';
const E = '00000000-0000-4000-c000-000000000001';
const flush = () =>
  act(async () => {
    for (let i = 0; i < 6; i += 1) await Promise.resolve();
  });

/** A seam that answers like the database would once the office has opened enrollment. */
function fakeSync(over = {}) {
  const state = {
    settings: { instance_id: I, exemption_status: 'confirmed', enrollment_open: true, attendance_floor: 2 },
    mine: [],
    roll: [],
    creds: [],
  };
  const s = {
    state,
    readInstituteSettings: vi.fn(async () => ({ ok: true, settings: state.settings })),
    saveInstituteSettings: vi.fn(async (_i, patch) => {
      state.settings = { ...state.settings, ...patch };
      return { ok: true, settings: state.settings };
    }),
    readMyEnrollments: vi.fn(async () => ({ ok: true, enrollments: state.mine })),
    applyToProgram: vi.fn(async (_i, { programKey, programTitle, courseKeys }) => {
      const row = {
        id: E,
        program_key: programKey,
        program_title: programTitle,
        course_keys: courseKeys,
        status: 'applied',
        applied_at: '2026-11-13T00:00:00Z',
        user_id: U,
      };
      state.mine = [row];
      state.roll = [row];
      return { ok: true, enrollment: row };
    }),
    withdrawMyEnrollment: vi.fn(async () => {
      state.mine = state.mine.map((e) => ({ ...e, status: 'withdrawn' }));
      return { ok: true, enrollment: state.mine[0] };
    }),
    readInstituteRoll: vi.fn(async () => ({ ok: true, roll: state.roll })),
    setEnrollmentStatus: vi.fn(async () => ({ ok: true })),
    readAttendance: vi.fn(async () => ({ ok: true, attendance: [] })),
    markAttendance: vi.fn(async () => ({ ok: true })),
    readCompletion: vi.fn(async () => ({
      ok: true,
      completion: { complete: false, status: 'applied', present: 1, floor: 2, coursesMissing: ['church-offices'] },
    })),
    issueCredential: vi.fn(async () => ({ ok: true })),
    readMyCredentials: vi.fn(async () => ({ ok: true, credentials: state.creds })),
    verifyCredential: vi.fn(async (code) =>
      String(code).trim().toUpperCase() === 'ABCDEF0123'
        ? { ok: true, found: { holderName: 'Applicant A', programTitle: 'Ministry Leadership', credentialNo: '2026-0001', issuedAt: '2026-11-13T00:00:00Z' } }
        : { ok: true, found: null }
    ),
    instituteSentence: (a) => (a && !a.ok ? a.message || 'no' : ''),
    ...over,
  };
  return s;
}

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
const mount = (props = {}) => act(() => root.render(createElement(ChurchInstitute, { church: COLG_DEFAULT_CHURCH, ...props })));
const remount = () => {
  act(() => root.unmount());
  root = createRoot(container);
};
const tab = (label) => {
  const t = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').trim() === label);
  if (!t) throw new Error(`tab not found: ${label}`);
  act(() => t.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const buttonNamed = (text) => [...container.querySelectorAll('button')].find((b) => (b.textContent || '').trim() === text);

describe('the Institute landing', () => {
  it('opens on About with the name, the tagline, the three programs and their honest status', () => {
    mount();
    expect(container.textContent).toContain('TLC Theological Institute');
    expect(container.textContent).toContain('Equipping Believers. Developing Leaders. Deepening Faith.');
    expect(container.querySelector('[data-testid="institute-program-ministry-leadership"] [data-testid="institute-status-available"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="institute-program-biblical-studies"] [data-testid="institute-status-available"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="institute-program-christian-education"]').textContent).toContain('Planned courses:');
  });
  it('Courses lists only registered Learn courses, each as a link that opens that course', () => {
    mount();
    tab('Courses');
    const rows = container.querySelectorAll('[data-testid^="institute-course-"]');
    expect(rows.length).toBeGreaterThanOrEqual(4);
    const offices = container.querySelector('[data-testid="institute-course-church-offices"] a');
    expect(offices.textContent).toBe('The Functions of the House: every office, from the Word');
    expect(offices.getAttribute('href')).toContain('course=church-offices');
    expect(offices.getAttribute('href')).toContain('sub=learn');
    expect(container.textContent).toContain('are planned and are not listed as available');
  });
  it('Enrollment is closed, said plainly, until the office confirms; no Apply button exists while closed', () => {
    mount();
    tab('Enrollment');
    expect(container.querySelector('[data-testid="institute-enrollment-not-filed"]').textContent).toContain('Enrollment opens when the office confirms');
    expect(container.querySelector('[data-testid="institute-apply"]')).toBeNull();
    expect(buttonNamed('Apply')).toBeUndefined();
    remount();
    mount({ settings: { exemption_status: 'confirmed', enrollment_open: false } });
    tab('Enrollment');
    expect(container.querySelector('[data-testid="institute-enrollment-confirmed-closed"]')).toBeTruthy();
    expect(buttonNamed('Apply')).toBeUndefined();
  });
  it('Certificates and Announcements say their state; no accreditation or degree is claimed anywhere', () => {
    mount();
    tab('Certificates');
    expect(container.querySelector('[data-testid="institute-credential-note"]').textContent).toBe(
      'Religious certificates of completion. No accreditation or degrees are claimed.'
    );
    expect(container.querySelector('[data-testid="institute-cert-state-not-filed"]').textContent).toBe('Planned');
    tab('Announcements');
    expect(container.querySelector('[data-testid="institute-announcements-empty"]')).toBeTruthy();
    for (const label of ['About', 'Courses', 'Enrollment', 'Students', 'Certificates', 'Announcements']) {
      tab(label);
      expect(container.textContent, label).not.toMatch(
        /\b(is|are|fully) accredited\b|\bdegree[- ]granting\b|\bearn (a|your) degree\b|coming soon|under construction/i
      );
    }
  });
  it('every button carries a focus ring', () => {
    mount();
    for (const b of container.querySelectorAll('button')) expect(b.className, b.textContent).toMatch(/focus:outline|focus-visible/);
  });
});

describe('Slice B — the live row governs, and a member applies through the seam', () => {
  it('reads the office row live and opens enrollment from it, not from a prop', async () => {
    const sync = fakeSync();
    mount({ instanceId: I, myUserId: null, sync });
    await flush();
    expect(sync.readInstituteSettings).toHaveBeenCalledWith(I);
    tab('Enrollment');
    expect(container.querySelector('[data-testid="institute-enrollment-open"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="institute-apply-signed-out"]')).toBeTruthy();
    expect(buttonNamed('Apply')).toBeUndefined();
    expect(sync.readMyEnrollments).not.toHaveBeenCalled();
  });
  it('a signed-in member applies to an available program with its course keys, then may withdraw', async () => {
    const sync = fakeSync();
    mount({ instanceId: I, myUserId: U, sync });
    await flush();
    tab('Enrollment');
    const applies = container.querySelectorAll('[data-testid^="institute-apply-"]');
    expect(applies.length).toBe(3);
    const ml = container.querySelector('[data-testid="institute-apply-ministry-leadership"] button');
    expect(ml.textContent.trim()).toBe('Apply');
    click(ml);
    await flush();
    expect(sync.applyToProgram).toHaveBeenCalledWith(I, {
      programKey: 'ministry-leadership',
      programTitle: 'Ministry Leadership',
      courseKeys: ['church-offices', 'handed-forward'],
    });
    await flush();
    expect(container.querySelector('[data-testid="institute-mine-ministry-leadership"]').textContent).toContain('Applied');
    const wd = container.querySelector('[data-testid="institute-apply-ministry-leadership"] button');
    expect(wd.textContent.trim()).toBe('Withdraw');
    click(wd);
    await flush();
    expect(sync.withdrawMyEnrollment).toHaveBeenCalledWith(E);
  });
  it('a refused application is said in a sentence, never swallowed', async () => {
    const sync = fakeSync({ applyToProgram: vi.fn(async () => ({ ok: false, reason: 'refused', message: 'the policy wall' })) });
    mount({ instanceId: I, myUserId: U, sync });
    await flush();
    tab('Enrollment');
    click(container.querySelector('[data-testid="institute-apply-biblical-studies"] button'));
    await flush();
    expect(container.querySelector('[data-testid="institute-said"]').textContent).toContain('the policy wall');
  });
  it('Students shows my standing from the completion RPC: sessions against the floor and the courses still to pass', async () => {
    const sync = fakeSync();
    sync.state.mine = [
      {
        id: E,
        program_key: 'ministry-leadership',
        program_title: 'Ministry Leadership',
        status: 'accepted',
        cohort_start: '2027-01-10',
        applied_at: '2026-11-13T00:00:00Z',
      },
    ];
    mount({ instanceId: I, myUserId: U, sync });
    await flush();
    tab('Students');
    expect(sync.readCompletion).toHaveBeenCalledWith(E);
    const d = container.querySelector('[data-testid="institute-standing-detail-ministry-leadership"]').textContent;
    expect(d).toContain('Sessions present: 1 of 2 required');
    expect(d).toContain('courses still to pass: church-offices');
    expect(container.textContent).toContain('cohort begins Jan 10, 2027');
  });
  it('Certificates lists my own credential with its number and code, and anyone verifies a code', async () => {
    const sync = fakeSync();
    sync.state.creds = [
      {
        id: 'k1',
        program_title: 'Ministry Leadership',
        holder_name: 'Applicant A',
        credential_no: '2026-0001',
        verify_code: 'ABCDEF0123',
        issued_at: '2026-11-13T00:00:00Z',
      },
    ];
    mount({ instanceId: I, myUserId: U, sync });
    await flush();
    tab('Certificates');
    expect(container.querySelector('[data-testid="institute-my-credentials"]').textContent).toContain('No. 2026-0001');
    expect(container.querySelector('[data-testid="institute-cert-state-open"]').textContent).toContain('Issued by the office');
    const input = container.querySelector('[data-testid="institute-verify-code"]');
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    act(() => {
      setValue.call(input, 'nope');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => container.querySelector('[data-testid="institute-verify"]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    expect(container.querySelector('[data-testid="institute-verify-none"]')).toBeTruthy();
    act(() => {
      setValue.call(input, 'abcdef0123');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => container.querySelector('[data-testid="institute-verify"]').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    expect(container.querySelector('[data-testid="institute-verify-found"]').textContent).toContain('Applicant A · Ministry Leadership · No. 2026-0001');
  });
  it('the Office desk mounts for owner/admin only, reads the roll, and issues through the seam', async () => {
    const member = fakeSync();
    mount({ instanceId: I, myUserId: U, isOffice: false, sync: member });
    await flush();
    expect([...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent.trim())).not.toContain('Office');
    expect(member.readInstituteRoll).not.toHaveBeenCalled();
    remount();
    const office = fakeSync();
    office.state.roll = [
      { id: E, program_key: 'ministry-leadership', program_title: 'Ministry Leadership', status: 'accepted', applied_at: '2026-11-13T00:00:00Z', user_id: U },
    ];
    mount({ instanceId: I, myUserId: U, isOffice: true, sync: office });
    await flush();
    tab('Office');
    expect(office.readInstituteRoll).toHaveBeenCalledWith(I);
    expect(container.querySelector('[data-testid="institute-office-open"]').checked).toBe(true);
    expect(container.querySelector(`[data-testid="institute-roll-${E}"]`)).toBeTruthy();
    click(buttonNamed('Read standing'));
    await flush();
    expect(container.querySelector(`[data-testid="institute-roll-standing-${E}"]`).textContent).toContain('standard not yet met');
    const name = container.querySelector('input[aria-label="Name on the certificate"]');
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    act(() => {
      setValue.call(name, 'Applicant A');
      name.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(buttonNamed('Issue certificate'));
    await flush();
    expect(office.issueCredential).toHaveBeenCalledWith(E, 'Applicant A');
    for (const b of container.querySelectorAll('button')) expect(b.className, b.textContent).toMatch(/focus:outline|focus-visible/);
    expect(container.textContent).not.toMatch(/\b(is|are|fully) accredited\b|\bdegree[- ]granting\b/i);
  });
});
