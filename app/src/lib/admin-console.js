// =============================================================================
// admin-console — pure, testable backbone for the in-app Admin surface
// =============================================================================
// Darrell, 2026-06-30: "The admin area has never been used because it is not
// inside the app. Fix that so we can get into the backend etc without needing an
// IT degree."
//
// The old Admin() surface was a dead-end: a list of external NAS/Tailscale URLs to
// COPY and open somewhere else — nothing you could actually DO. This is the real
// thing: the backend controls a steward needs (who has access, is the data
// flowing, what's the live build, the internal surfaces) surfaced IN the app, in
// plain language, each action labeled with a "what this does" line, and anything
// consequential PREVIEWED before a deliberate execute.
//
// This module is the PURE half (no React, no I/O) so every label, roster, and
// preview is unit-testable and the local-LLM orchestrator can read it headless.
// Grounds: DR-0061 (a surface is a live view of real state — real data trace),
// DR-0065 (build capability INTO the app), DR-0076 (verify/preview, don't claim),
// the servant-king ontology (access is identity, the steward at the helm).
//
// NO SECRETS EVER leave this module: it names roles, hosts, and public identifiers
// only — never a key, token, anon secret, or bearer. The preview strings describe
// consequences in human terms; they carry no credentials.
// =============================================================================

import { assessLoops } from './loop-health.js';
import { ADMIN_EMAILS } from './admin-allowlist.js';

// The four backend concerns a steward actually needs, in the order they matter.
// icon = a UiIcon name (bundled SVG — never a device emoji, per consistency-guard).
export const ADMIN_PANELS = [
  { id: 'access',   label: 'People & Access', icon: 'users',
    blurb: 'Who can get into the backend, and your live role in the system.' },
  { id: 'data',     label: 'Data & Loops',    icon: 'chart',
    blurb: 'Is your data actually flowing? Every tracked loop’s real freshness.' },
  { id: 'system',   label: 'System & Build',  icon: 'sliders',
    blurb: 'The live build, whether the backend is reachable, and the checks that guard it.' },
  { id: 'internal', label: 'Internal Surfaces', icon: 'monitor',
    blurb: 'The family NAS surfaces you reach over Tailscale / on the home network.' },
];

export function isAdminPanel(id) {
  return ADMIN_PANELS.some((p) => p.id === id);
}

// Access is IDENTITY-based, not a shareable password (servant-king ontology). The
// canonical allowlist is interest-sync's ADMIN_EMAILS (mirrored by tenancy-guard);
// we read it here so there is ONE source of "who administers", never a fork.
// Returns the roster with the current user flagged — rendered ONLY behind the
// component's steward gate (no-leak).
export function accessRoster(currentEmail, adminEmails = ADMIN_EMAILS) {
  const me = String(currentEmail || '').toLowerCase().trim();
  return adminEmails.map((email) => ({
    email,
    isYou: email.toLowerCase() === me && me.length > 0,
  }));
}

// Plain-language meaning of a backend instance role (owner/admin/member/viewer/
// specialist — the schema's role set). Never invents a role it doesn't know.
export const ROLE_MEANING = {
  owner:      'Full control — you own this space and everyone in it.',
  admin:      'Manage members, data, and settings for this space.',
  member:     'Use the app and your own data in this space.',
  viewer:     'Read-only — you can see, but not change.',
  specialist: 'Scoped access — only the areas assigned to you.',
};
export function roleMeaning(role) {
  const key = String(role || '').toLowerCase().trim();
  return ROLE_MEANING[key] || null;
}

// Summarize data health from the REAL loop registry (loop-health). No painted
// numbers — every count comes from assessLoops reading real state.
export function dataHealthSummary(data, nowMs, env = {}) {
  const loops = assessLoops(data || {}, nowMs, env);
  const attention = loops.filter((l) => l.status !== 'fresh');
  const fresh = loops.filter((l) => l.status === 'fresh');
  return {
    loops,
    total: loops.length,
    freshCount: fresh.length,
    attentionCount: attention.length,
    allFlowing: attention.length === 0,
    plain: attention.length === 0
      ? 'All tracked data loops are updating within their window.'
      : `${attention.length} loop${attention.length === 1 ? '' : 's'} need${attention.length === 1 ? 's' : ''} your attention.`,
  };
}

// The live-system facts a steward can read at a glance, in human terms. Takes only
// public, non-secret inputs. Deliberately EXCLUDES any key/token/secret.
export function systemFacts({ isPublicHost = true, buildSha = 'dev', buildTime = null, backendReachable = false } = {}) {
  return [
    { label: 'Where this is running',
      value: isPublicHost ? 'Public site (poetech.us)' : 'Family NAS (Tailscale / home network)',
      note: isPublicHost
        ? 'The public app. Backend access is by your signed-in identity.'
        : 'The sovereign NAS host. Being on the family network is itself the access control.' },
    { label: 'Backend connection',
      value: backendReachable ? 'Connected' : 'Not connected on this device',
      note: backendReachable
        ? 'Your data is syncing with the family cloud backend.'
        : 'Working locally on this device — sign in / reconnect to sync with the backend.' },
    { label: 'Live build',
      value: buildSha === 'dev' ? 'Development build' : buildSha,
      note: buildTime ? `Deployed ${String(buildTime).slice(0, 10)}.` : 'The exact version this device is running right now.' },
  ];
}

// The internal (NAS-hosted) surfaces, folded in from the old Admin() so nothing is
// lost. Public identifiers only (Tailscale hostname + LAN IP are not secrets — they
// are unreachable without being on the family network). No keys.
export const INTERNAL_SURFACES = [
  { key: 'dispatch',
    label: 'Dispatch Status',
    what: 'Live workflow reel + Code-Task snapshot + phone-alert QR. Always-on system visibility.',
    tailscale: 'https://poetech.tail5a2f35.ts.net/webhook/dispatch-status-page',
    lan: 'http://192.168.1.26:5678/webhook/dispatch-status-page' },
];

// Consequential / outbound actions get a PREVIEW before a deliberate execute
// (wired-buttons + preview-then-execute rule). Each entry describes, in plain
// language, exactly what will happen. `danger` drives the confirm styling.
export const PREVIEW_ACTIONS = {
  'reload-latest': {
    label: 'Reload to the newest build',
    what: 'If the app looks stale or a fix isn’t showing, this pulls the very latest deployed version.',
    danger: false,
    confirmLabel: 'Reload now',
    preview: [
      'The app reloads once, fetching the newest deployed build from the network.',
      'Nothing is deleted. Your saved data and sign-in are untouched.',
      'Use this when a merged fix isn’t showing yet (a stale cached build).',
    ],
  },
  'reset-seed': {
    label: 'Reset to sample data',
    what: 'Replace what’s on THIS device with the fresh starter (demo) dataset.',
    danger: true,
    confirmLabel: 'Yes, reset this device',
    preview: [
      'Everything currently loaded on this device is replaced with the sample starter data.',
      'This affects THIS device’s local view only — it does not touch the cloud backend or anyone else.',
      'Unsaved local edits will be lost. There is no undo.',
    ],
  },
};

export function previewAction(id) {
  return PREVIEW_ACTIONS[id] || null;
}
