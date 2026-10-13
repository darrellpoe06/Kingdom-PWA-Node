// DelayReport — the accountability dashboard renders the REAL ledger (DR-0115):
// the overnight deferral shows with its true 8.5x weight; nothing painted.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import DelayReport from '../components/DelayReport.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('DelayReport', () => {
  it('renders should-vs-took, the overrun factor, categories, and the model base', async () => {
    await act(async () => { root.render(createElement(DelayReport)); });
    const text = container.textContent || '';
    expect(text).toContain('should have taken vs took');
    expect(text).toContain('agent-self-deferral');
    expect(text).toContain('claude-fable-5');
    expect(text).toContain('8.5×');                      // the overnight deferral's true weight
    expect(text).toContain("1.0× = on the work's clock"); // the benchmark meaning, stated
  });
});
