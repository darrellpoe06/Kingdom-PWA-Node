// @vitest-environment jsdom
// =============================================================================
// ChurchInstitute — the landing says what is true: real courses open in Learn,
// planned programs read Planned, enrollment is closed until the office
// confirms, and nothing claims accreditation (brief rules 6 and 7).
// =============================================================================
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ChurchInstitute from '../components/ChurchInstitute.jsx';
import { COLG_DEFAULT_CHURCH } from '../lib/default-church.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const mount = (props = {}) => act(() => root.render(createElement(ChurchInstitute, { church: COLG_DEFAULT_CHURCH, ...props })));
const tab = (label) => {
  const t = [...container.querySelectorAll('[role="tab"]')].find((b) => (b.textContent || '').includes(label));
  if (!t) throw new Error(`tab not found: ${label}`);
  act(() => t.dispatchEvent(new MouseEvent('click', { bubbles: true })));
};

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
  it('Enrollment is closed, said plainly, until the office confirms; it opens only on confirmed + open', () => {
    mount();
    tab('Enrollment');
    expect(container.querySelector('[data-testid="institute-enrollment-not-filed"]').textContent).toContain('Enrollment opens when the office confirms');
    expect(container.textContent).not.toContain('Apply from My Record');
    act(() => root.unmount()); root = createRoot(container);
    mount({ settings: { exemption_status: 'confirmed', enrollment_open: true }, setChurchView: () => {} });
    tab('Enrollment');
    expect(container.querySelector('[data-testid="institute-enrollment-open"]')).toBeTruthy();
    expect(container.textContent).toContain('Apply from My Record');
  });
  it('Certificates and Announcements say their state; no accreditation or degree is claimed anywhere', () => {
    mount();
    tab('Certificates');
    expect(container.querySelector('[data-testid="institute-credential-note"]').textContent).toBe('Religious certificates of completion. No accreditation or degrees are claimed.');
    tab('Announcements');
    expect(container.querySelector('[data-testid="institute-announcements-empty"]')).toBeTruthy();
    for (const label of ['About', 'Courses', 'Enrollment', 'Students', 'Certificates', 'Announcements']) {
      tab(label);
      expect(container.textContent, label).not.toMatch(/\b(is|are|fully) accredited\b|\bdegree[- ]granting\b|\bearn (a|your) degree\b|coming soon|under construction/i);
    }
  });
  it('every button carries a focus ring', () => {
    mount();
    for (const b of container.querySelectorAll('button')) expect(b.className, b.textContent).toMatch(/focus:outline|focus-visible/);
  });
});
