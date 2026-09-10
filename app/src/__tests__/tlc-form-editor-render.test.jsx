// TlcFormEditor — the office edits its own intake form and documents (DR-0352).
// The seam is mocked; the editor's own behavior is what is pinned.
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { resolveOfficeDocuments, normalizeIntakeForm } from '../lib/tlc-office-forms.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let stored = {};
const saves = [];
const load = async () => ({ ok: true, resolved: resolveOfficeDocuments(stored) });
const save = async (key, body, note) => { saves.push({ key, body, note }); stored = { ...stored, [key]: { body, version: ((stored[key] && stored[key].version) || 0) + 1, updated_at: '2026-09-10T18:00:00Z', note } }; return { ok: true, saved: { key, version: stored[key].version }, body }; };

let container, root;
async function mount() {
  const { default: TlcFormEditor } = await import('../components/TlcFormEditor.jsx');
  container = document.createElement('div'); document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(TlcFormEditor, { load, save })); });
  await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
}
const click = (el) => act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const type = (el, value) => act(async () => {
  const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
});
const byText = (re, tag = 'button') => [...container.querySelectorAll(tag)].find((b) => re.test(b.textContent));
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = container = null; stored = {}; saves.length = 0; });

describe('the office forms editor', () => {
  it('opens on the original (version 0), shows the floor questions locked, adds a question, refuses a save without a note, then saves a normalized body as version 1', async () => {
    await mount();
    expect(container.textContent).toContain('The original, as the app shipped it');
    const tabs = [...container.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
    expect(tabs).toEqual(['Intake form · the questions · v0', 'Handbook · practice policies · v0', 'Confidentiality Agreement (NDA) · v0', 'Independent Contractor Agreement · v0']);
    // the floor: First Name cannot be made optional or hidden
    const first = [...container.querySelectorAll('li[aria-label^="Question:"]')].find((li) => /Question: First Name/.test(li.getAttribute('aria-label')));
    const boxes = first.querySelectorAll('input[type="checkbox"]');
    expect(boxes[0].checked).toBe(true); expect(boxes[0].disabled).toBe(true);
    expect(boxes[1].disabled).toBe(true);
    expect(first.textContent).toContain('required by the process');
    // add a question to About you
    const about = [...container.querySelectorAll('section[aria-label^="Section:"]')].find((s) => /About you/.test(s.getAttribute('aria-label')));
    const addForm = about.querySelector('form[aria-label="Add a question"]');
    await type(addForm.querySelector('input'), 'Pronouns');
    await type(addForm.querySelector('select'), 'text');
    await click(addForm.querySelector('button[type="submit"]'));
    const added = [...container.querySelectorAll('li[aria-label="Question: Pronouns"]')][0];
    expect(added).toBeTruthy();
    expect(added.textContent).toContain('Your question');
    await click(added.querySelectorAll('input[type="checkbox"]')[0]); // required
    // save without a note
    await click(byText(/Save as a new version/));
    expect(container.textContent).toContain('Say in a few words what changed.');
    expect(saves.length).toBe(0);
    await type(container.querySelector('#fe-note'), 'added pronouns');
    await click(byText(/Save as a new version/));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(saves.length).toBe(1);
    expect(saves[0].key).toBe('intake-form');
    expect(saves[0].note).toBe('added pronouns');
    const aboutSaved = saves[0].body.sections.find((s) => s.id === 'about');
    expect(aboutSaved.fields.find((f) => f.key === 'x_pronouns')).toEqual({ key: 'x_pronouns', type: 'text', label: 'Pronouns', help: '', required: true, hidden: false, custom: true });
    expect(JSON.stringify(saves[0].body)).toBe(JSON.stringify(normalizeIntakeForm(saves[0].body)));
    expect(container.textContent).toContain('Saved as version 1');
    expect([...container.querySelectorAll('[role="tab"]')][0].textContent).toBe('Intake form · the questions · v1');
    expect(container.textContent).toContain('Version 1, saved');
  });
  it('a document: the title and a section are edited and saved; Reset to the original brings the code text back into the draft', async () => {
    await mount();
    await click([...container.querySelectorAll('[role="tab"]')][2]); // confidentiality
    const title = container.querySelector('#doc-title');
    expect(title.value).toMatch(/Confidentiality Agreement/);
    await type(title, 'Confidentiality Agreement (NDA) — 2026');
    const heading = container.querySelector('li[aria-label="Section 1"] input');
    await type(heading, 'Purpose (edited)');
    await type(container.querySelector('#fe-note'), 'tightened the purpose');
    await click(byText(/Save as a new version/));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(saves.length).toBe(1);
    expect(saves[0].key).toBe('confidentiality');
    expect(saves[0].body.title).toBe('Confidentiality Agreement (NDA) — 2026');
    expect(saves[0].body.sections[0]).toMatchObject({ n: 1, title: 'Purpose (edited)' });
    await click(byText(/Reset to the original/));
    expect(container.querySelector('#doc-title').value).toMatch(/^TLC Therapy Solutions — Confidentiality Agreement/);
    expect(container.textContent).toContain('Discard my edits');
  });
});
