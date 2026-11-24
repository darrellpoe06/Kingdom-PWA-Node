// Learn Studio: words grow with the app's text-size control (A / A+ / A++ /
// A+++ / A44). Darrell's wife, 2026-11-24, on a real lesson screen: "Words
// don't get bigger with the text adjustments available." The mechanism
// (lib/text-size.js) scales the document ROOT font-size; every size on this
// page must be authored in rem (the same 16px baseline), never a fixed px,
// or it sits still while the rest of the app grows. Pins the shipped
// stylesheet so this class of regression fails the build again.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'learn-studio', 'learn-studio.css'), 'utf8');

describe('Learn Studio text scales with the app text-size control (DR-0276)', () => {
  it('declares no font-size in fixed px -- every size is rem (or a vw-bound clamp)', () => {
    const offenders = css.match(/font-size:[^;]*\dpx[^;]*;/g) || [];
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('actually has rem-based sizes (the rule is not vacuous)', () => {
    const remSizes = css.match(/font-size:\s*[\d.]+rem/g) || [];
    expect(remSizes.length).toBeGreaterThan(10);
  });

  it('the Explore-by-Topic grid collapses to one column at Larger/Big Print sizes (DR-0276 .ts-grid-collapse)', () => {
    const jsx = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'components', 'learn-studio', 'LearnStudio.jsx'), 'utf8');
    expect(jsx).toMatch(/className="ls-topics ts-grid-collapse"/);
  });
});
