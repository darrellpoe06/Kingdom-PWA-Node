// =============================================================================
// assembly-program-2026 — the 77th National Assembly PRINTED program, transcribed
// =============================================================================
// Source: the church's printed conference schedule + Workshop Facilitators
// pages, photographed and handed in by Darrell 2026-07-10 ("Next week's
// conference program add this where it makes sense"). Transcribed FAITHFULLY
// from the images — titles, times, rooms, and leaders are the program's own
// words, never invented (DR-0076). The conference identity derives from the
// one facts registry (FAMILY_MINISTRIES.assembly — DR-0159), so the program
// and every other Assembly surface can never disagree on the name.
//
// SOURCE NOTE (recorded, not silently corrected): the printed Day 3 header
// reads "Thursday, July 15, 2026" while Day 2 is "Wednesday, July 15, 2026" —
// the same date twice. Wednesday July 15, 2026 is a real calendar date;
// Thursday is July 16. Day 3 is dated 2026-07-16 here, and this note is the
// receipt for the correction.
//
// These are SEED DEFINITIONS, not rows: sessions live in the family instance
// (event_sessions, RLS — DR-0060), so a steward loads the program with one
// tap in the Event Center (idempotent by title+day) and the real rows are
// written under their own credentials. The cloud never writes family data.
// =============================================================================
import { FAMILY_MINISTRIES } from './family-ministries.js';

export const ASSEMBLY_PROGRAM_SOURCE =
  'Printed 77th National Assembly schedule + Workshop Facilitators pages, photographed by Darrell 2026-07-10';

export const ASSEMBLY_DAY3_DATE_NOTE =
  'The printed Day 3 header says "Thursday, July 15, 2026" — the same date as Day 2 (Wednesday). Thursday of that week is July 16; Day 3 is dated 2026-07-16 here on purpose.';

// Room names exactly as the program prints them; the loader matches them to
// existing Event Center rooms by name (case-insensitive) and leaves the
// session's room unset when no match exists — never inventing a room.
export const ASSEMBLY_PROGRAM_2026 = [
  // ── Day 2 · Wednesday, July 15, 2026 ──────────────────────────────────────
  { day: 'Wed Jul 15', sessionDate: '2026-07-15', time: '11:00 – 11:50 AM', title: 'Every Day Tech Confidence', speaker: 'Brother Darrell Poe & Brother Clifton Reed', room: 'Sanctuary', sessionType: 'breakout' },
  { day: 'Wed Jul 15', sessionDate: '2026-07-15', time: '12:15 – 1:45 PM', title: 'Mid-Day Praise & Worship Service', speaker: null, room: 'Sanctuary', sessionType: 'main_service' },
  { day: 'Wed Jul 15', sessionDate: '2026-07-15', time: '2:00 – 3:00 PM', title: 'Lunch', speaker: 'Deacon Terence Bolden, Facilitator', room: 'Cafe', sessionType: 'other' },
  { day: 'Wed Jul 15', sessionDate: '2026-07-15', time: '7:00 – 8:30 PM', title: 'Power Praise & Worship Service', speaker: null, room: 'Sanctuary', sessionType: 'main_service' },
  { day: 'Wed Jul 15', sessionDate: '2026-07-15', time: '8:45 – 9:45 PM', title: 'Hour of Power', speaker: null, room: 'Sanctuary', sessionType: 'main_service' },
  // ── Day 3 · Thursday (printed "July 15"; see ASSEMBLY_DAY3_DATE_NOTE) ─────
  { day: 'Thu Jul 16', sessionDate: '2026-07-16', time: '8:00 – 8:45 AM', title: 'Continental Breakfast', speaker: 'Deacon Terence Bolden, Facilitator', room: 'Cafe', sessionType: 'other' },
  { day: 'Thu Jul 16', sessionDate: '2026-07-16', time: '9:00 – 9:50 AM', title: 'A Woman Created for Purpose', speaker: 'Eldress Carmen Williams', room: 'Sanctuary', sessionType: 'breakout' },
  { day: 'Thu Jul 16', sessionDate: '2026-07-16', time: '9:00 – 9:50 AM', title: 'Brothers in Christ Study of the Word', speaker: 'Bishop Chester Trail & Senior Assistant Pastor James Harden, Facilitator', room: 'Conference Room', sessionType: 'breakout' },
  { day: 'Thu Jul 16', sessionDate: '2026-07-16', time: '10:00 – 11:50 AM', title: 'Youth (K – 4th Grade)', speaker: 'Missionary Angela Evans', room: '3 - 5 Meeting Room', sessionType: 'breakout' },
  { day: 'Thu Jul 16', sessionDate: '2026-07-16', time: '10:00 – 11:50 AM', title: 'Youth (5th – 8th Grade)', speaker: 'Brother Pancho Moore & Elder Brandon Davis', room: 'K - 2 Meeting Room', sessionType: 'breakout' },
  { day: 'Thu Jul 16', sessionDate: '2026-07-16', time: '10:00 – 11:50 AM', title: 'Youth/Young Adults (Ages 14 – 21)', speaker: 'Elder James LaPlace/Brother Todd Kato', room: 'Conference Room', sessionType: 'breakout' },
  { day: 'Thu Jul 16', sessionDate: '2026-07-16', time: '10:00 – 10:50 AM', title: 'Connecting Faith and Community: A Call to Purpose', speaker: 'Carolyn Randolph-Kato, PhD', room: 'Sanctuary', sessionType: 'breakout' },
];

// The program's facilitator bios (the Workshop Facilitators page), kept with
// the program so the Assembly surface can show WHO beside WHEN. Transcribed
// from the printed page verbatim in substance, condensed only for length.
export const ASSEMBLY_FACILITATORS_2026 = [
  {
    name: 'Darrell Poe',
    bio: 'Technology leader with more than 25 years of experience in project management, information technology, and real estate. Director of Information Technology for The Church of the Living God and a Software Project Manager at the University of Illinois Urbana-Champaign — passionate about using technology to strengthen ministry, improve efficiency, and equip others for success, all while remaining grounded in faith and service.',
  },
  {
    name: 'Clifton Reed',
    bio: 'Cybersecurity professional and technology specialist serving both the University of Illinois Urbana-Champaign and The Church of the Living God. Expertise in information security, technology support, and digital solutions — passionate about using technology to strengthen ministry, improve communication, and protect valuable information, sharing practical insights on leveraging technology safely, securely, and effectively for everyday life and ministry.',
  },
];

// Idempotence key: a program session already exists when a session row with
// the same (case/space-insensitive) day label and title is present. Loading
// twice adds nothing; a hand-edited row keeps its edits (the loader never
// updates). `day` is the same free-text label the Event Center form uses
// ("Wed Jul 15"), so loaded rows read exactly like hand-added ones.
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
export function missingProgramSessions(existingSessions, program = ASSEMBLY_PROGRAM_2026) {
  const have = new Set((Array.isArray(existingSessions) ? existingSessions : [])
    .map((s) => `${norm(s?.day)}|${norm(s?.title)}`));
  return program.filter((p) => !have.has(`${norm(p.day)}|${norm(p.title)}`));
}

// Match a printed room name to an existing Event Center room by name; null
// when no room matches (the session still loads, room unassigned — honest).
export function matchRoomId(rooms, printedName) {
  const target = norm(printedName);
  if (!target) return null;
  const hit = (Array.isArray(rooms) ? rooms : []).find((r) => norm(r?.name) === target);
  return hit ? hit.id : null;
}

// The conference this program belongs to — the ONE identity source (DR-0159).
export const ASSEMBLY_NAME = FAMILY_MINISTRIES.assembly.name;
