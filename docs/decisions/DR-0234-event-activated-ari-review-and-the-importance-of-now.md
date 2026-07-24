# DR-0234 — Event-activated Ari review; the Importance of Now

- **Date:** 2026-07-24  · **Declared by:** Darrell  · **Status:** accepted

## 1. Event-activated comprehensive review
Ari's comprehensive review fires on EVENTS (merge coalesced, incident filed,
app-side `ari-review` dispatch from feedback/role-tiered directives), with one
weekly DEAD-MAN heartbeat whose only job is detecting silence (the 2026-07-06
silent-decay class). "Events for change, time only for decay — every clock
must name the decay it watches, or it doesn't earn its schedule."
Shipped: `.github/workflows/ari-comprehensive-review.yml` — three brakes
designed in (10-min budget, single-instance lock, inactive-by-default kill
posture), report-only, INACTIVE per DR-0225; activation is the Governor's
witnessed step. Dated remainder (2026-07-25): the app→lane dispatch seam
(scoped token custody) and the verified-role classifier
(member=evidence · dev/ops=scoped directive · Governor=command; role read
server-side, never from text; bright lines stay Governor-only).

## 2. The Importance of Now (binding way)
Darrell 2026-07-24: "Why tomorrow and not now?" and "Ways and documentation
should explain the importance of now." **When directed work can be decomposed,
the core ships NOW — smaller, through the gates — and only the genuinely
undeliverable remainder carries a date and a why.** "Tomorrow" is acceptable
only as the dated remainder of something partially shipped today, never as
the whole answer. Session/context budget is a reason to SHRINK the increment,
not to defer it. Pairs with DR-0111 (do the work), DR-0103 (motion default),
DR-0075 (why + date for any deferral), DR-0225 (brakes are build
requirements, never a stall).
