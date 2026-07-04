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

// 2026-07-04 (Darrell, looking at the Admin tab): "it should be one tab... a
// report of users like the books financial reports, just data-driven KPIs" — and
// "why does it have all this n8n information if I'm not using that." So Admin is
// now ONE data-driven report (it absorbs the former Access users/usage report)
// plus the essential System & Build controls, and the n8n/NAS surfaces — the NAS
// bridge token, the Internal Surfaces dispatch-status-page webhook, the
// n8n-sourced Data-&-Loops rows — are OFF the UI. The old four-sub-tab panel list
// and INTERNAL_SURFACES that drove that structure are retired. The remaining
// exports (roster, role meaning, system facts, preview actions) still back the
// merged surface and stay unit-tested.

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
