# wf-property-history — Synology Chat → PWA property-history bridge

**Status: contract defined, PWA side shipped, NAS side pending one working
session with NAS access.** The PWA's import UI (Real Estate → property
records → "📥 Import property-chat history") is live on
`feat/rentals-table-sync` and fails soft until this workflow exists.

## Why

The Poe Properties history lives in Synology Chat on the NAS
(192.168.1.26): one channel per property, named by the short address
(e.g. the channel name matches the property's name field in the PWA).
That history is the institutional memory of each property — repairs,
tenant conversations, decisions. This bridge lets the family pull it into
the PWA **with verification**: messages stage in the UI, Darrell or
Christina check what's true, only accepted items land on the property's
conversation log. Re-import is always safe (dedup by `sourceId`).

## Contract (what the PWA expects)

- **Endpoint:** `GET /webhook/property-history?channel=<short-address>`
  on the NAS n8n (reached by the PWA via the same-origin `/n8n` Vercel
  rewrite — never the absolute Funnel URL, it throttles cross-origin).
- **Response:** JSON — either a bare array or `{ "messages": [...] }`.
  Each message:

  ```json
  { "id": "12345", "ts": 1718040000, "user": "Darrell", "text": "Furnace fixed, $450 to Mike" }
  ```

  Field-name tolerance (the PWA's `parseChatHistory` accepts):
  `id` | `post_id`; `ts` (epoch seconds or ms) | `time` | `created_at` | `date`;
  `user` | `username` | `creator` | `author`; `text` | `message` | `content`.
- **Unknown channel:** return `[]` (HTTP 200), not an error.
- **Auth:** bearer token per PERPETUAL-PIPELINE-HEALTH rule 7 once the
  workflow goes live; the PWA call rides the existing `/n8n` rewrite.

## Two viable extraction paths on the NAS (pick during the build session)

1. **Synology Chat PostgreSQL (preferred, fully automatic).** Synology
   Chat stores messages in its own PostgreSQL on the NAS. An n8n Execute
   Command / Postgres node queries the chat DB read-only, filtered by
   channel name. Needs: the chat DB socket/credentials from DSM (root
   shell), read-only role. Verify table names against the installed Chat
   package version during the session — do not assume them blind.

2. **Admin export file on a bind mount (fallback, zero DB coupling).**
   DSM Chat admin exports channel history; drop the export under
   `/data/poetech-briefing/chat-exports/<channel>.json` (existing bind
   mount), and the workflow just reads + reshapes the file. Manual
   refresh, but no internal-DB dependency.

Either way the workflow is read-only toward Chat — this bridge never
writes or deletes anything in Synology Chat.

## Brakes note

This is a request/response webhook (fires only when the family taps
Import) — not timer-driven, so the three-brakes rule for autonomous
automation does not gate it. Standard PERPETUAL-PIPELINE-HEALTH rules
apply: try-catch the DB leg, standard error envelope, health check.
