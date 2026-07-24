// =============================================================================
// paste-input — clipboard paste beside file upload (Darrell 2026-07-24)
// =============================================================================
import { describe, it, expect } from 'vitest';
import { filesFromClipboardEvent, clipboardHasFiles } from '../lib/paste-input.js';

const file = (name) => ({ name, size: 10, type: 'image/png' });

describe('filesFromClipboardEvent — pure extraction over a ClipboardEvent shape', () => {
  it('reads clipboardData.files (the copied-screenshot case)', () => {
    const e = { clipboardData: { files: [file('shot.png'), file('shot2.png')], items: [] } };
    expect(filesFromClipboardEvent(e).map((f) => f.name)).toEqual(['shot.png', 'shot2.png']);
    expect(clipboardHasFiles(e)).toBe(true);
  });
  it('falls back to items with kind=file (Chrome image paste)', () => {
    const e = { clipboardData: { files: [], items: [
      { kind: 'string', getAsFile: () => null },
      { kind: 'file', getAsFile: () => file('pasted.png') },
      { kind: 'file', getAsFile: () => null }, // null getAsFile filtered
    ] } };
    expect(filesFromClipboardEvent(e).map((f) => f.name)).toEqual(['pasted.png']);
  });
  it('plain-text paste yields no files — the browser default is left alone', () => {
    const e = { clipboardData: { files: [], items: [{ kind: 'string', getAsFile: () => null }] } };
    expect(filesFromClipboardEvent(e)).toEqual([]);
    expect(clipboardHasFiles(e)).toBe(false);
  });
  it('never throws on malformed events', () => {
    expect(filesFromClipboardEvent(null)).toEqual([]);
    expect(filesFromClipboardEvent({})).toEqual([]);
    expect(filesFromClipboardEvent({ clipboardData: {} })).toEqual([]);
  });
});
