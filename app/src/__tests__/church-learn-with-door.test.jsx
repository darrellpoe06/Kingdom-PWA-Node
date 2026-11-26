// @vitest-environment jsdom
// The Learn surface (surfaces.js) now loads the door wrapper; the retired Eternal Algorithms route and every prop still reach Learn.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('the Learn surface', () => {
  const surfaces = readFileSync(join(__dirname, '../surfaces.js'), 'utf8');
  it('loads the door wrapper, which renders the existing ChurchLearn with every prop passed through', () => {
    expect(surfaces).toMatch(/id: 'learn'[^\n]*learn-discover\/ChurchLearnWithDoor\.jsx/);
    const w = readFileSync(join(__dirname, '../components/learn-discover/ChurchLearnWithDoor.jsx'), 'utf8');
    expect(w).toContain("import ChurchLearn from '../ChurchLearn.jsx'");
    expect(w).toContain('<ChurchLearn {...props} />');
    expect(w).toContain('props.initialDept ? learn');
  });
  it('leaves the frozen shell untouched', () => {
    const shell = readFileSync(join(__dirname, '../poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).not.toContain('learn-discover');
  });
});
