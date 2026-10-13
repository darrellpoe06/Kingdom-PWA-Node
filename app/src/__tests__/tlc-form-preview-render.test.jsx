// TlcFormPreview — the intake form as a colleague meets it, to SEE (DR-0352;
// Darrell: "Where is the intake form, and why can't we see it?").
import { describe, it, expect, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import TlcFormPreview from '../components/TlcFormPreview.jsx';
import { SECTIONS, BANKING_FIELDS } from '../lib/tlc-onboarding.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const here = dirname(fileURLToPath(import.meta.url));
let container, root;
async function mount(props) { container = document.createElement('div'); document.body.appendChild(container); await act(async () => { root = createRoot(container); root.render(createElement(TlcFormPreview, props)); }); }
afterEach(async () => { if (root) await act(async () => root.unmount()); if (container) container.remove(); root = container = null; });

describe('the form itself, read-only, in order', () => {
  it('shows every section and every question of the original, numbered, with kind, required mark, choices, the signature sentences and the direct-deposit fields', async () => {
    await mount({ form: null, version: 0 });
    const text = container.textContent;
    expect(text).toContain('The intake form, as a colleague sees it');
    const questions = container.querySelectorAll('li[aria-label^="Question "]');
    const expected = SECTIONS.reduce((n, s) => n + s.fields.length, 0) + BANKING_FIELDS.length;
    expect(questions.length).toBe(expected);
    expect(text).toContain(`${expected} questions in ${SECTIONS.length} sections · the original`);
    expect(container.querySelectorAll('li[aria-label^="Section: "]').length).toBe(SECTIONS.length);
    for (const s of SECTIONS) for (const f of s.fields) expect(text, f.key).toContain(f.label);
    expect(text).toContain('Routing Number');
    expect(text).toContain('read, check, and sign by typing your full name');
    expect(text).toContain('LCSW'); // a choose-one lists its choices
    expect(text).toContain('Children and Adolescents'); // a choose-any lists its choices
    expect(text).toMatch(/I acknowledge that I have received, read, and understand/); // the acknowledgment sentence
    expect(container.querySelectorAll('[aria-label="required"]').length).toBeGreaterThanOrEqual(9);
  });
  it('renders the office’s LIVE definition: a relabeled question, a hidden one gone, an added one marked as the office’s, the version named', async () => {
    const form = { sections: [{ id: 'about', fields: [{ key: 'firstName', label: 'Given name' }, { key: 'preferredName', hidden: true }, { key: 'x_pronouns', type: 'select', label: 'Pronouns', options: ['she/her', 'he/him', 'they/them'], required: true }] }] };
    await mount({ form, version: 3 });
    const text = container.textContent;
    expect(text).toContain('Given name');
    expect(text).not.toContain('Preferred Name');
    expect(text).toContain('Pronouns');
    expect(text).toContain('added by the office');
    expect(text).toContain('they/them');
    expect(text).toContain('version 3');
  });
  it('is on Team → Documents for staff and beside the editor as a preview', () => {
    const team = readFileSync(join(here, '../components/TlcTeamResources.jsx'), 'utf8');
    expect(team).toMatch(/<Fold title="Therapist Onboarding \| Hiring Form"[\s\S]*<TlcFormPreview form=\{docs \? docs\.intakeForm\.form : null\}/);
    const editor = readFileSync(join(here, '../components/TlcFormEditor.jsx'), 'utf8');
    expect(editor).toContain("Preview the form as a colleague sees it");
    expect(editor).toContain('<TlcFormPreview form={draft} version={meta.version} />');
  });
});
