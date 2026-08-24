// =============================================================================
// 0146 — the media cue sheet rides the booking (Bro Clifton Reed's process)
// =============================================================================
// Darrell 2026-08-24: "Merge the process and procedures to make sure our media
// team member Bro Clifton Reed form is added or accounted for based on his
// experience working with the congregation." His Event Media Intake ("cue
// sheet") form is merged INTO the venue request: one submission tells the
// office AND the media team what is coming. These pins keep the merge honest:
// the migration adds exactly the cue-sheet columns and widens exactly the
// event-type vocabulary (touching no policy), the lib round-trips the media
// fields, every event type carries the Media Team cue-sheet step, and both
// surfaces (the shared request form + the staff card) actually render it.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EVENT_TYPE_IDS, MEDIA_CATEGORIES, MEDIA_CATEGORY_KEYS, eventTypeLabel,
  responsibilitiesFor, mediaExpectedLabels, hasCueSheet,
  buildBookingRow, toBookingShape,
} from '../lib/venue-rental.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const MIG = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0146-media-cue-sheet-on-the-bookings.sql');
const sql = readFileSync(MIG, 'utf8');
const code = sql.replace(/--.*$/gm, '');

describe('0146 — the migration adds the cue sheet and nothing else', () => {
  it('adds the three cue-sheet columns, idempotently', () => {
    expect(code).toMatch(/ADD COLUMN IF NOT EXISTS media_expected jsonb NOT NULL DEFAULT '\{\}'::jsonb/);
    expect(code).toMatch(/ADD COLUMN IF NOT EXISTS music_link text/);
    expect(code).toMatch(/ADD COLUMN IF NOT EXISTS media_notes text/);
  });
  it('widens the event-type CHECK with concert + conference (drop-then-add)', () => {
    expect(code).toMatch(/DROP CONSTRAINT IF EXISTS venue_bookings_event_type_check/);
    expect(code).toMatch(/CHECK \(event_type IN \('funeral','wedding','concert','conference','community'\)\)/);
  });
  it('touches NO policy, NO trigger, NO grant — the 0030 RLS shape stands', () => {
    expect(code).not.toMatch(/CREATE POLICY|DROP POLICY|CREATE TRIGGER|GRANT /);
  });
});

describe('the lib speaks the four media categories', () => {
  it('exactly photos / videos / slides / documents, each with real formats', () => {
    expect(MEDIA_CATEGORY_KEYS).toEqual(['photos', 'videos', 'slides', 'documents']);
    expect(MEDIA_CATEGORIES.every((c) => c.label && c.formats)).toBe(true);
    expect(MEDIA_CATEGORIES.find((c) => c.key === 'slides').formats).toContain('PPTX');
  });
  it('the event types now include concert and conference', () => {
    expect(EVENT_TYPE_IDS).toContain('concert');
    expect(EVENT_TYPE_IDS).toContain('conference');
  });
  it('EVERY event type carries the Media Team cue-sheet step', () => {
    for (const t of EVENT_TYPE_IDS) {
      const step = responsibilitiesFor(t).find((r) => r.key === 'cuesheet');
      expect(step, `event type ${t} is missing the cue-sheet step`).toBeTruthy();
      expect(step.team).toBe('Media Team');
    }
  });
});

describe('the row round-trips the cue sheet', () => {
  it('buildBookingRow keeps only KNOWN category keys that are exactly true', () => {
    const row = buildBookingRow({
      requesterName: 'A', spaceId: 'north-sanctuary', campus: 'north',
      eventType: 'concert', eventDate: '2026-09-01',
      mediaExpected: { photos: true, videos: false, slides: 'yes', hacked: true },
      musicLink: '  https://open.spotify.com/playlist/x  ',
      mediaNotes: ' play at the close ',
    });
    expect(row.event_type).toBe('concert');
    expect(row.media_expected).toEqual({ photos: true });
    expect(row.music_link).toBe('https://open.spotify.com/playlist/x');
    expect(row.media_notes).toBe('play at the close');
  });
  it('an empty form yields an empty-but-present cue sheet (never undefined)', () => {
    const row = buildBookingRow({ requesterName: 'A', spaceId: 'north-sanctuary' });
    expect(row.media_expected).toEqual({});
    expect(row.music_link).toBeNull();
    expect(row.media_notes).toBeNull();
  });
  it('toBookingShape surfaces mediaExpected / musicLink / mediaNotes', () => {
    const b = toBookingShape({ id: 'x', media_expected: { videos: true }, music_link: 'https://s', media_notes: 'n' });
    expect(b.mediaExpected).toEqual({ videos: true });
    expect(b.musicLink).toBe('https://s');
    expect(b.mediaNotes).toBe('n');
    expect(mediaExpectedLabels(b)).toEqual(['Videos']);
    expect(hasCueSheet(b)).toBe(true);
  });
  it('hasCueSheet is false when nothing was asked for (proven-to-catch)', () => {
    expect(hasCueSheet(toBookingShape({ id: 'y' }))).toBe(false);
    expect(mediaExpectedLabels(toBookingShape({ id: 'y' }))).toEqual([]);
  });
});

describe('both surfaces render the cue sheet', () => {
  it('the form keeps Bro Reed’s Spotify label and accepts any music link', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'VenueRequestForm.jsx'), 'utf8');
    expect(src).toMatch(/MEDIA_CATEGORIES\.map/);
    expect(src).toMatch(/vr-music/);
    expect(src).toMatch(/Spotify link for your music/);
    expect(src).toMatch(/any music link works, YouTube included/);
    expect(src).toMatch(/vr-media-notes/);
    expect(src).toMatch(/Clifton Reed/); // his work is credited where it lives
  });
  it('the staff card shows the media team its cue sheet, with a safe link', () => {
    const src = readFileSync(join(HERE, '..', 'components', 'EventManagement.jsx'), 'utf8');
    expect(src).toMatch(/hasCueSheet\(booking\)/);
    expect(src).toMatch(/mediaExpectedLabels\(booking\)/);
    // Public-form input never becomes a clickable javascript: href.
    expect(src).toMatch(/\/\^https\?:\\\/\\\/\/i\.test\(booking\.musicLink\)/);
  });
});

// Darrell 2026-08-24, on the live list: "Should say Sunday and Wednesday
// Service too" — then "separated": each service its own type. The regular
// services are the media team's most regular work, so the cue sheet serves
// them first-class. 0149 widens the DB vocabulary and heals the same-day
// spotify_link -> music_link rename seam.
describe('0149 — Sunday and Wednesday Service join the cue sheet, separated', () => {
  const MIG9 = join(HERE, '..', '..', '..', 'infra', 'supabase', 'migrations-auto', '0149-sunday-wednesday-service-and-music-link-heal.sql');
  const code9 = readFileSync(MIG9, 'utf8').replace(/--.*$/gm, '');

  it('the widened CHECK carries BOTH services ahead of the 0146 list', () => {
    expect(code9).toMatch(/DROP CONSTRAINT IF EXISTS venue_bookings_event_type_check/);
    expect(code9).toMatch(/CHECK \(event_type IN \('sunday-service','wednesday-service','funeral','wedding','concert','conference','community'\)\)/);
    // The short-lived combined type can never wedge a replay.
    expect(code9).toMatch(/SET event_type = 'sunday-service' WHERE event_type = 'service'/);
  });
  it('the rename seam heals: values carried, orphan column dropped, guarded', () => {
    expect(code9).toMatch(/column_name = 'spotify_link'/);
    expect(code9).toMatch(/SET music_link = COALESCE\(music_link, spotify_link\)/);
    expect(code9).toMatch(/DROP COLUMN spotify_link/);
  });
  it('the client speaks the two services, separated', () => {
    expect(EVENT_TYPE_IDS).toContain('sunday-service');
    expect(EVENT_TYPE_IDS).toContain('wednesday-service');
    expect(EVENT_TYPE_IDS).not.toContain('service');
    expect(eventTypeLabel('sunday-service')).toBe('Sunday Service');
    expect(eventTypeLabel('wednesday-service')).toBe('Wednesday Service');
  });
  it('each service checklist is the media team’s standing lane', () => {
    for (const t of ['sunday-service', 'wednesday-service']) {
      const list = responsibilitiesFor(t);
      expect(list.find((r) => r.key === 'av')?.team).toBe('Media Team');
      expect(list.find((r) => r.key === 'cuesheet')?.team).toBe('Media Team');
      expect(list.find((r) => r.key === 'soundcheck')?.team).toBe('Media Team');
    }
  });
});
