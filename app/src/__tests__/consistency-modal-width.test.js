// @vitest-environment node
// =============================================================================
// A dialog's width, passed to the shared Modal shell, is an overlay cap (DR-0658)
// =============================================================================
// consistency-guard's width-cap rule stops a TAB from being capped (DR-0246)
// and already exempts overlays (`fixed` in the same span). A width handed to
// <Modal maxWidthClass="..."> lands on the panel inside Modal's own fixed
// overlay, so it is the same class. Found when the sign-in dialog gained a TV
// width to fit 960x540. The exemption is the prop VALUE only; everything else
// in the file still counts.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { countWidthCaps } from '../../../scripts/consistency-guard.mjs';

describe('countWidthCaps and the Modal width prop', () => {
  it('a width handed to Modal is not a tab cap', () => {
    expect(countWidthCaps('<Modal open maxWidthClass="max-w-4xl">x</Modal>')).toBe(0);
    expect(countWidthCaps("<Modal maxWidthClass={'max-w-sm'} />")).toBe(0);
  });
  it('a capped wrapper beside it still counts, once', () => {
    expect(countWidthCaps('<div className="max-w-md mx-auto"><Modal maxWidthClass="max-w-4xl" /></div>')).toBe(1);
  });
  it('a cap that merely mentions the prop name elsewhere still counts', () => {
    expect(countWidthCaps('<div className="max-w-lg" title="maxWidthClass">')).toBe(1);
  });
  it('the fixed-overlay exemption is unchanged', () => {
    expect(countWidthCaps('<div className="fixed bottom-4 max-w-sm">')).toBe(0);
  });
});
