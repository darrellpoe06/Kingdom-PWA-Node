// @vitest-environment node
// =============================================================================
// Phone photos back up to the NAS as ORIGINALS, from a card that connects itself
// =============================================================================
// Darrell 2026-09-23: "There's no path to upload photos from my cellphone to
// the nas!!!!! Why not?!!! I should be able to back up my phone and pick the
// nas..." MEASURED: the path existed (Big Picture › Life Gallery ›
// /nas-photos/upload › /volume1/PoeTech/family-photos) but (1) it sat behind a
// per-device token PASTE on any phone that had never opened Voice or Real
// Estate — the v1 gate every other surface retired on 2026-08-03 (DR-0574) —
// and (2) it sent a 1600px re-encode of each photo: a preview, not a backup.
// PROVEN-TO-CATCH: each pin fails on the pre-fix component/lib.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadPlan, NAS_UPLOAD_MAX_BYTES } from '../lib/nas-photos.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const GALLERY = readFileSync(join(HERE, '..', 'components', 'LifeGallery.jsx'), 'utf8');
const SERVER = readFileSync(join(HERE, '..', '..', '..', 'infra', 'nas-property-photos', 'photo_server.py'), 'utf8');

describe('uploadPlan — the original goes when it fits and the server keeps its type', () => {
  it('a phone JPEG under the cap goes as the original', () => {
    expect(uploadPlan({ size: 4 * 1024 * 1024, type: 'image/jpeg' })).toEqual({ mode: 'original', reason: 'fits' });
    expect(uploadPlan({ size: 900, type: 'image/png' }).mode).toBe('original');
    expect(uploadPlan({ size: 900, type: 'image/webp' }).mode).toBe('original');
  });

  it('over the cap goes reduced, and says so', () => {
    expect(uploadPlan({ size: NAS_UPLOAD_MAX_BYTES + 1, type: 'image/jpeg' })).toEqual({ mode: 'reduced', reason: 'too-large' });
    expect(uploadPlan({ size: NAS_UPLOAD_MAX_BYTES, type: 'image/jpeg' }).mode).toBe('original');
  });

  it('a type the server does not keep (HEIC, GIF) goes reduced — the sniff would refuse the original', () => {
    expect(uploadPlan({ size: 900, type: 'image/heic' })).toEqual({ mode: 'reduced', reason: 'type-not-kept' });
    expect(uploadPlan({ size: 900, type: 'image/gif' }).reason).toBe('type-not-kept');
  });

  it('an unknown size is never sent raw', () => {
    expect(uploadPlan({ type: 'image/jpeg' }).reason).toBe('unknown-size');
    expect(uploadPlan(null).mode).toBe('reduced');
  });

  it('the client cap IS the server cap (photo_server.py MAX_UPLOAD_BYTES)', () => {
    const m = SERVER.match(/^MAX_UPLOAD_BYTES = (\d+) \* 1024 \* 1024/m);
    expect(m, 'the server states its cap as N * 1024 * 1024').toBeTruthy();
    expect(NAS_UPLOAD_MAX_BYTES).toBe(Number(m[1]) * 1024 * 1024);
  });

  it('the kept types are the ones the server sniffs', () => {
    expect(SERVER).toMatch(/Return 'jpg' \| 'png' \| 'webp'/);
  });
});

describe('the Life Gallery card', () => {
  it('provisions the bridge token itself on a signed-in family device (DR-0574), instead of only asking for a paste', () => {
    expect(GALLERY).toMatch(/import \{ provisionBridgeToken \} from '\.\.\/lib\/bridge-provision\.js'/);
    expect(GALLERY).toMatch(/provisionBridgeToken\(supabase\)\.then\(\(r\) => \{ if \(live && r === 'provisioned'\) setNasConnected\(true\); \}\)/);
  });

  it('sends the ORIGINAL bytes when the plan allows, the reduced copy otherwise', () => {
    expect(GALLERY).toMatch(/const plan = uploadPlan\(s\.file\)/);
    expect(GALLERY).toMatch(/payload = await fileToDataUrl\(s\.file\)/);
    expect(GALLERY).toMatch(/uploadPhoto\(payload, \{ filename: s\.file\?\.name \}\)/);
  });

  it('tells the person how many went as originals and how many were reduced, and where they live', () => {
    expect(GALLERY).toMatch(/backed up to your NAS — shared with the family\./);
    expect(GALLERY).toMatch(/sent as a reduced copy \(over 8 MB or a type the NAS does not keep\)/);
    expect(GALLERY).toMatch(/the family-photos folder — originals up to 8 MB/);
  });

  it('the camera-folder button says how many it pulls (newest 30), matching the code', () => {
    expect(GALLERY).toMatch(/Newest 30 from camera folder/);
    expect(GALLERY).toMatch(/handles\.slice\(0, 30\)/);
  });
});
