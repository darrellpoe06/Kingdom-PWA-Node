// @vitest-environment jsdom
//
// ConferenceModule — the front-door ✎ Edit covers EVERY identity parameter the
// conferences table carries. Darrell 2026-08-03: "conference edit does not
// allow editing all of the parameters of the conference" — the form rendered
// name/theme/dates/location/livestream/site but silently omitted Host (carried
// in state, never rendered) and the real Start/End dates (never carried at
// all). This mounts the real surface, opens Edit, and pins that each field is
// present and that Save writes them through saveConference.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

const saveConference = vi.fn(async () => ({ saved: true }));
vi.mock('../lib/conference-sync.js', () => ({
  getConferenceAccess: async () => ({ signedIn: true, canSee: true, canEdit: true }),
  subscribeConferences: (cb) => {
    cb([{
      id: 'conf1', name: '77th National Assembly', theme: 'Reviving Faith',
      host: 'COLG', location: 'Champaign, IL', datesLabel: 'July 14–16, 2026',
      startDate: '2026-07-14', endDate: '2026-07-16',
      livestreamUrl: '', siteUrl: '', status: 'active',
    }]);
    return () => {};
  },
  saveConference: (...a) => saveConference(...a),
}));
vi.mock('../lib/feedback-sync.js', () => ({ uploadFeedback: async () => ({ uploaded: true }) }));

import ConferenceModule from '../components/ConferenceModule.jsx';

const labelOf = (container, text) =>
  [...container.querySelectorAll('label')].find((l) => l.textContent.trim().toLowerCase().startsWith(text));

async function mountAndOpenEdit() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { createRoot(container).render(createElement(ConferenceModule)); });
  const editBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('Edit'));
  await act(async () => { editBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  return container;
}

describe('ConferenceModule — the edit form covers every conference parameter', () => {
  beforeEach(() => { saveConference.mockClear(); });

  it('renders a field for each parameter the conferences table carries on the front door', async () => {
    const container = await mountAndOpenEdit();
    for (const field of ['conference name', 'theme', 'host', 'dates', 'start date', 'end date', 'location', 'livestream', 'website']) {
      expect(labelOf(container, field), `missing edit field: ${field}`).toBeTruthy();
    }
  });

  it('Save writes host and the real start/end dates through saveConference', async () => {
    const container = await mountAndOpenEdit();
    const setInput = async (label, value) => {
      const input = labelOf(container, label).parentElement.querySelector('input');
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    };
    await setInput('host', 'The Church of the Living God');
    await setInput('start date', '2027-07-13');
    await setInput('end date', '2027-07-15');
    const saveBtn = [...container.querySelectorAll('button')].find((b) => b.textContent.includes('Save conference details'));
    await act(async () => { saveBtn.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    expect(saveConference).toHaveBeenCalledTimes(1);
    const payload = saveConference.mock.calls[0][0];
    expect(payload.host).toBe('The Church of the Living God');
    expect(payload.startDate).toBe('2027-07-13');
    expect(payload.endDate).toBe('2027-07-15');
    expect(payload.id).toBe('conf1'); // updates the SHARED record, not a new one
  });
});
