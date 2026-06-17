import { describe, it, expect } from 'vitest';
import {
  WORKSPACE_TYPES, DEFAULT_WORKSPACE_TYPE, typeFor, isValidWorkspaceType,
  exportFormatsFor, validateWorkspace, blankWorkspace, sanitizeHtml,
  exportFilename, escapeXml, buildExportSvg, svgToDataUrl, EXPORT_DOC_CSS,
} from '../lib/creation-workspace.js';
import {
  workspaceToRow, workspaceFromRow, mergeRemoteWorkspaces, WORKSPACE_COLUMN_OF,
} from '../lib/workspaces-sync.js';

describe('workspace types (extensible config)', () => {
  it('ships Document and Image, Document is the default', () => {
    const keys = WORKSPACE_TYPES.map((t) => t.key);
    expect(keys).toContain('document');
    expect(keys).toContain('image');
    expect(DEFAULT_WORKSPACE_TYPE).toBe('document');
  });
  it('every type carries the fields the component + export rely on', () => {
    for (const t of WORKSPACE_TYPES) {
      expect(typeof t.label).toBe('string');
      expect(Array.isArray(t.exportFormats) && t.exportFormats.length).toBeTruthy();
      expect(t.page && t.page.width > 0 && t.page.height > 0).toBeTruthy();
      expect(typeof t.fontStack).toBe('string');
    }
  });
  it('typeFor falls back to the default for an unknown key', () => {
    expect(typeFor('nope').key).toBe(WORKSPACE_TYPES[0].key);
    expect(typeFor('image').key).toBe('image');
  });
  it('isValidWorkspaceType and exportFormatsFor are defensive', () => {
    expect(isValidWorkspaceType('document')).toBe(true);
    expect(isValidWorkspaceType('bogus')).toBe(false);
    expect(exportFormatsFor('bogus')).toEqual(['png']); // never empty
    expect(exportFormatsFor('image')).toEqual(['png', 'jpg']);
  });
});

describe('validateWorkspace', () => {
  it('requires a title and a known type', () => {
    expect(validateWorkspace({ title: '', type: 'document' })).toContain('A title is required.');
    expect(validateWorkspace({ title: 'x', type: 'bogus' }).some((m) => m.includes('type'))).toBe(true);
  });
  it('passes a well-formed record', () => {
    expect(validateWorkspace({ title: 'My letter', type: 'document' })).toEqual([]);
  });
  it('blankWorkspace produces a valid draft', () => {
    expect(validateWorkspace(blankWorkspace('image'))).toEqual([]);
    expect(blankWorkspace('image').type).toBe('image');
  });
});

describe('sanitizeHtml (defensive clean)', () => {
  it('strips <script> and inline event handlers', () => {
    const out = sanitizeHtml('<p onclick="steal()">hi</p><script>evil()</script>');
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/onclick/i);
    expect(out).toMatch(/hi/);
  });
  it('strips javascript: urls but keeps benign content', () => {
    const out = sanitizeHtml('<a href="javascript:evil()">x</a><b>keep</b>');
    expect(out).not.toMatch(/javascript:/i);
    expect(out).toMatch(/keep/);
  });
  it('is safe on non-strings', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});

describe('exportFilename', () => {
  it('slugs the title and applies the right extension', () => {
    expect(exportFilename('My Big Letter!', 'png')).toBe('my-big-letter.png');
    expect(exportFilename('My Big Letter!', 'jpg')).toBe('my-big-letter.jpg');
    expect(exportFilename('My Big Letter!', 'jpeg')).toBe('my-big-letter.jpg');
  });
  it('never produces an empty or path-traversing name', () => {
    expect(exportFilename('', 'png')).toBe('workspace.png');
    expect(exportFilename('../../etc/passwd', 'png')).toBe('etc-passwd.png');
  });
});

describe('buildExportSvg (the markup the canvas rasterizes)', () => {
  it('wraps content in a foreignObject sized to the page with a background rect', () => {
    const svg = buildExportSvg({ innerXhtml: '<p>hello</p>', width: 816, height: 1056, css: EXPORT_DOC_CSS, background: '#FFFFFF' });
    expect(svg).toMatch(/<svg[^>]*width="816"[^>]*height="1056"/);
    expect(svg).toContain('<foreignObject');
    expect(svg).toContain('xmlns="http://www.w3.org/1999/xhtml"');
    expect(svg).toContain('<p>hello</p>');
    expect(svg).toMatch(/<rect[^>]*fill="#FFFFFF"/);
  });
  it('escapes the background and font values it injects', () => {
    const svg = buildExportSvg({ innerXhtml: '', background: '"><script>', fontStack: 'a"b' });
    expect(svg).not.toContain('"><script>');
    expect(svg).toContain('&quot;');
  });
  it('svgToDataUrl yields a decodable svg data url', () => {
    const url = svgToDataUrl('<svg/>');
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(url.split(',')[1])).toBe('<svg/>');
  });
});

describe('escapeXml', () => {
  it('escapes the five XML metacharacters', () => {
    expect(escapeXml(`<a&b>"'`)).toBe('&lt;a&amp;b&gt;&quot;&apos;');
  });
});

describe('workspaces-sync mappers (round-trip)', () => {
  const local = {
    id: 'ws-1', type: 'document', title: 'Letter', content: '<p>hi</p>',
    meta: { page: { width: 816, height: 1056 }, format: 'png' }, authorPersona: 'darrell',
  };
  it('toRow includes instance_id + created_by and maps fields', () => {
    const row = workspaceToRow(local, { tenantId: 'inst-1', userId: 'user-1' });
    expect(row.instance_id).toBe('inst-1');
    expect(row.created_by).toBe('user-1');
    expect(row.slug).toBe('ws-1');
    expect(row.type).toBe('document');
    expect(row.content).toBe('<p>hi</p>');
    expect(row.meta.format).toBe('png');
  });
  it('fromRow reconstructs the local shape and carries the remote uuid', () => {
    const row = { id: 'uuid-1', instance_id: 'inst-1', created_by: 'user-1', slug: 'ws-1', type: 'image', title: 'T', content: '<p>x</p>', meta: { format: 'jpg' }, author_persona: 'darrell', created_at: 'now', updated_at: 'later' };
    const back = workspaceFromRow(row);
    expect(back.id).toBe('ws-1');
    expect(back.remoteUuid).toBe('uuid-1');
    expect(back.type).toBe('image');
    expect(back.meta.format).toBe('jpg');
  });
  it('toRow is defensive about missing/odd fields', () => {
    const row = workspaceToRow({ id: 'ws-2' }, { tenantId: 't', userId: 'u' });
    expect(row.type).toBe('document');
    expect(row.title).toBe('Untitled');
    expect(row.content).toBe('');
    expect(row.meta).toEqual({});
  });
  it('WORKSPACE_COLUMN_OF maps only editable columns, never instance/created_by', () => {
    expect(WORKSPACE_COLUMN_OF.title).toBe('title');
    expect(WORKSPACE_COLUMN_OF.content).toBe('content');
    expect(WORKSPACE_COLUMN_OF.instance_id).toBeUndefined();
    expect(WORKSPACE_COLUMN_OF.created_by).toBeUndefined();
  });
});

describe('mergeRemoteWorkspaces (no data loss)', () => {
  it('keeps a never-uploaded local record (non-UUID id) when the cloud list arrives', () => {
    const localOnly = { id: 'ws-local-1', title: 'Draft' };
    const cloudRow = { id: '11111111-2222-3333-4444-555555555555', title: 'Cloud' };
    const merged = mergeRemoteWorkspaces([localOnly], [cloudRow]);
    expect(merged.find((x) => x.id === 'ws-local-1')).toBeTruthy();
    expect(merged.find((x) => x.id === cloudRow.id)).toBeTruthy();
  });
  it('drops a synced (UUID) row absent from the cloud list (a real cross-device delete)', () => {
    const syncedGone = { id: '11111111-2222-3333-4444-555555555555', title: 'deleted elsewhere' };
    const merged = mergeRemoteWorkspaces([syncedGone], []);
    expect(merged).toEqual([]);
  });
});
