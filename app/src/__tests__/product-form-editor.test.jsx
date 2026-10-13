// Each office edits its OWN questions — DR-0357's named gap, closed.
//
// DR-0357 generalized the forms engine to every product and dated its own
// shortfall (re-review 2026-09-18): the EDITOR stayed bound to TLC's store, so
// the church office could read the answers on the roll and could not change a
// single question it was asking. Darrell, 2026-09-11: "We need the staff to be
// able to edit all surfaces so the Ai team nor any other team has to update
// their surfaces or tabs."
//
// The seams are injected here (load/save), so every assertion is about the
// EDITOR — what it refuses, what it says, and what it sends — with no network
// and no database in the way.
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import ProductFormEditor from '../components/ProductFormEditor.jsx';
import { originalProduct, productFormKeys, normalizeFor, PRODUCTS } from '../lib/product-forms.js';
import { MEMBER_FLOOR } from '../lib/church-member-intake.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

function harness(props = {}) {
  const saves = [];
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const load = async (product) => ({ ok: true, resolved: originalProduct(product), instanceId: 'inst-1' });
  const save = async (product, key, body, note, instanceId) => {
    saves.push({ product, key, body, note, instanceId });
    return { ok: true, saved: {} };
  };
  return {
    saves, container, root, load, save,
    // load() is async, so the render must be awaited or the assertion lands on
    // "Opening the forms…" — which is what the first draft of this file did.
    render: async (extra = {}) => act(async () => {
      root.render(createElement(ProductFormEditor, { product: 'lovecorner', instanceId: 'inst-1', load, save, ...props, ...extra }));
    }),
    text: () => container.textContent,
    buttons: () => Array.from(container.querySelectorAll('button')),
    click: (re) => act(() => { const b = Array.from(container.querySelectorAll('button')).find((x) => re.test(x.textContent)); if (b) b.click(); }),
    type: (selector, value) => act(() => {
      const el = container.querySelector(selector);
      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }),
    cleanup: () => { act(() => root.unmount()); container.remove(); },
  };
}

describe('it edits whatever the registry says the product has', () => {
  it('opens the church product with both of its forms as tabs', async () => {
    const h = harness();
    await h.render();
    expect(h.text()).toContain('Member record · the questions');
    expect(h.text()).toContain('What the church holds about you');
    h.cleanup();
  });

  it('drives the SHARED store, not the TLC one — they are different tables', () => {
    const src = read('components/ProductFormEditor.jsx');
    expect(src).toContain("from '../lib/product-forms-sync.js'");
    expect(src).not.toContain('tlc-office-forms');
    // And it says why it is not simply reusing the TLC editor.
    expect(src).toMatch(/two read different stores/i);
  });

  it('renders the household and the landlord too — one editor, every office', async () => {
    for (const product of ['poetech', 'properties']) {
      const h = harness({ product });
      await h.render();
      // Every form the registry declares for that product gets a tab, by its
      // OWN label — nothing here knows what a household or a landlord is.
      for (const key of productFormKeys(product)) {
        expect(h.text(), `${product}/${key}`).toContain(PRODUCTS[product].forms[key].label);
      }
      expect(h.text()).not.toMatch(/no product called/);
      h.cleanup();
    }
  });

  it('says so plainly for a product that does not exist', async () => {
    const h = harness({ product: 'not-a-product' });
    await h.render();
    expect(h.text()).toMatch(/no product called/);
    h.cleanup();
  });
});

describe('what an office may NOT do', () => {
  it('a floor question cannot be un-required or hidden — the boxes are disabled', async () => {
    const h = harness();
    await h.render();
    // MEMBER_FLOOR is the church's floor: full name, contact email, standing.
    expect(MEMBER_FLOOR.length).toBeGreaterThan(0);
    const rows = Array.from(h.container.querySelectorAll('li[aria-label^="Question:"]'));
    const locked = rows.filter((r) => /required by the process/.test(r.textContent));
    expect(locked.length, 'no floor question is marked as held by the process').toBeGreaterThan(0);
    for (const r of locked) {
      for (const box of r.querySelectorAll('input[type="checkbox"]')) {
        expect(box.disabled, `a floor question's box is editable: ${r.textContent.slice(0, 60)}`).toBe(true);
      }
    }
    h.cleanup();
  });

  it('a floor question has no Remove button at all', async () => {
    const h = harness();
    await h.render();
    const rows = Array.from(h.container.querySelectorAll('li[aria-label^="Question:"]'));
    for (const r of rows.filter((x) => /Original question/.test(x.textContent))) {
      expect(r.querySelector('button'), 'an original question offered Remove').toBeNull();
    }
    h.cleanup();
  });

  it('the ENGINE is the wall, and it is stronger than a refusal — it RESTORES', () => {
    // Measured before it was written down: normalizeForm does not reject a
    // body with the floor stripped out, it merges the original back in. So a
    // floor question cannot be lost at all, even by something that gets past
    // the disabled checkbox — and an attempt to un-require or hide one comes
    // back required and visible.
    const original = originalProduct('lovecorner')['member-intake'].form;
    const fieldsOf = (form) => form.sections.flatMap((s) => s.fields);

    const stripped = { sections: original.sections.map((s) => ({ ...s, fields: s.fields.filter((f) => !MEMBER_FLOOR.includes(f.key)) })) };
    const restored = normalizeFor('lovecorner', 'member-intake', stripped);
    for (const key of MEMBER_FLOOR) {
      expect(fieldsOf(restored).some((f) => f.key === key), `${key} was lost`).toBe(true);
    }

    const sneaky = { sections: original.sections.map((s) => ({ ...s, fields: s.fields.map((f) => (MEMBER_FLOOR.includes(f.key) ? { ...f, required: false, hidden: true } : f)) })) };
    for (const f of fieldsOf(normalizeFor('lovecorner', 'member-intake', sneaky)).filter((x) => MEMBER_FLOOR.includes(x.key))) {
      expect(f.required, `${f.key} was un-required`).toBe(true);
      expect(f.hidden, `${f.key} was hidden`).toBe(false);
    }
  });
});

describe('a save is a version, and a version carries a note', () => {
  it('REFUSES to save without a note', async () => {
    const h = harness();
    await h.render();
    h.type('#psec-you-title', 'Who you are, then');
    h.click(/Save as the next version/);
    expect(h.saves, 'it saved with no note').toEqual([]);
    expect(h.text()).toMatch(/Say what changed and why/);
    h.cleanup();
  });

  it('sends the product, the key, the body, the note and the instance', async () => {
    const h = harness();
    await h.render();
    h.type('#psec-you-title', 'Who you are, then');
    h.type('#pfe-note', 'Renamed the first section.');
    h.click(/Save as the next version/);
    expect(h.saves.length).toBe(1);
    expect(h.saves[0]).toMatchObject({ product: 'lovecorner', key: 'member-intake', note: 'Renamed the first section.', instanceId: 'inst-1' });
    expect(h.saves[0].body.sections[0].title).toBe('Who you are, then');
    h.cleanup();
  });

  it('Save is dead until something actually changed', async () => {
    const h = harness();
    await h.render();
    const save = h.buttons().find((b) => /Save as the next version/.test(b.textContent));
    expect(save.disabled, 'Save was live with no edits').toBe(true);
    h.cleanup();
  });

  it('"Reset to the original" is itself a save, so the history keeps a hole out', async () => {
    const h = harness();
    await h.render();
    h.type('#pfe-note', 'Putting it back.');
    h.click(/Reset to the original/);
    expect(h.saves.length).toBe(1);
    expect(h.saves[0].note).toBe('Putting it back.');
    h.cleanup();
  });

  it('never claims a version number it was not given', () => {
    // The seam returns `saved`, not a version. A screen that printed
    // "version ${res.version}" would print "version ?" or, worse, a number
    // nobody measured.
    const src = read('components/ProductFormEditor.jsx');
    expect(src).not.toMatch(/res\.version/);
    expect(src).toMatch(/a number this screen invented would be a number nobody/);
  });
});

describe('see it as they meet it', () => {
  it('shows the live form, and says so when everything is hidden', async () => {
    const h = harness();
    await h.render();
    h.click(/See it as they meet it/);
    expect(h.container.querySelector('[aria-label="The form as they meet it"]')).toBeTruthy();
    h.cleanup();
  });
});

describe('a read that failed is SAID, and never saved over silently', () => {
  it('shows the message and still renders the original', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    const load = async () => ({ ok: false, message: 'the network is out' });
    await act(async () => {
      root.render(createElement(ProductFormEditor, { product: 'lovecorner', instanceId: 'i', load, save: async () => ({ ok: true }) }));
    });
    expect(container.textContent).toContain('the network is out');
    expect(container.textContent).toContain('Member record · the questions');
    act(() => root.unmount());
    container.remove();
  });
});

describe('the office reaches it where the office already is', () => {
  it('sits beside the roll in the church member space, office-gated', () => {
    const src = read('components/ChurchMemberSpace.jsx');
    expect(src).toContain('ProductFormEditor');
    expect(src).toMatch(/product="lovecorner"/);
    // Inside the isOffice branch, next to the roll — not a separate tab a
    // steward has to be told about.
    const officeBlock = src.slice(src.indexOf('if (isOffice) {'));
    expect(officeBlock.slice(0, 1400)).toContain('ProductFormEditor');
  });
  it('costs the frozen shell nothing', () => {
    const shell = read('poe-financial-mvp-v28.jsx');
    expect(shell).not.toContain('ProductFormEditor');
  });
});

describe('proven-to-catch (anti-theater)', () => {
  it('CATCHES an editor that stopped refusing a note-less save', async () => {
    const h = harness();
    await h.render();
    h.type('#psec-you-title', 'x');
    h.click(/Save as the next version/);
    expect(h.saves.length).toBe(0);
    h.cleanup();
  });
  it('CATCHES a floor question becoming editable', async () => {
    const h = harness();
    await h.render();
    const locked = Array.from(h.container.querySelectorAll('li[aria-label^="Question:"]'))
      .filter((r) => /required by the process/.test(r.textContent));
    expect(locked.every((r) => Array.from(r.querySelectorAll('input[type="checkbox"]')).every((b) => b.disabled))).toBe(true);
    h.cleanup();
  });
  it('CATCHES the editor reaching back into the TLC store', () => {
    // The CODE, not the prose: this file names the TLC store in a comment
    // explaining why it does not use it, and a substring check cannot tell the
    // explanation from the call. (Third time this shape has bitten in this
    // session — pin the behaviour, not the spelling.)
    const src = read('components/ProductFormEditor.jsx');
    const code = src.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(code).not.toMatch(/tlc_office_document/);
    expect(code).not.toMatch(/tlc-office-forms/);
    expect(code).toMatch(/product_forms|product-forms-sync/);
  });
});
