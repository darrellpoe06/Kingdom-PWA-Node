# Directive capture — QR follow-along on the presentation screen (2026-07-24)

Darrell (with two screenshots, uploaded this session, to be reviewed on the
fresh context): "Can we put a QR code on the screen for when we want to allow
the audience to follow along on their phones instead of or with the code —
maybe auto add the code for the live notes etc."

## Design seed (verified rails)
- QR primitive EXISTS: components/AppShareQR.jsx. Follow-along EXISTS:
  FollowAlong.jsx; the projector surface is AudienceWindow/AudienceSlide
  (BroadcastChannel sync, Presenter.jsx controls).
- Build: presenter toggle "Invite the room" -> AudienceSlide corner renders QR
  (via AppShareQR) encoding the follow-along URL WITH the session/join code
  embedded (auto-join: scan = joined, no typing), code shown beside it for
  non-camera phones; live-notes route gets the same auto-code param.

## Opportunities
- Zero-typing join for elderly members (COMMUNITY-FIRST) — scan and follow.
- Every service becomes an app onboarding moment (the exponential edge).
- Reuses shipped primitives; small diff; Tier B soak.

## Constraints
- QR must be LARGE + high-contrast on the wall (projector distance);
  chrome-capped area, DR-0099 palette (no true red).
- Join code = room-scoped, expiring; QR never carries auth secrets.
- Presenter-controlled (off by default; never auto-shows on sensitive slides).
- Review the two uploaded screenshots first (reality-trace) on fresh context.

Owner: next session 2026-07-25 (with the app-dispatch seam). DR to record on ship.
