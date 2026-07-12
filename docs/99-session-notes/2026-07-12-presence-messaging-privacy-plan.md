# Presence, direct messaging & "do not disturb" — researched plan

**Recorded:** 2026-07-12 · **Source:** DP — "Each user can choose to be visible or
not so people can message each other or say do not disturb etc. Ari and Claude
thoughts... research what other churches are having success at and not good for
church apps." **Status:** researched proposal; the messaging/directory pieces are
Tier C (safety + congregation-facing + minors) → Bishop Gwin governs the opening.

## Reality-trace (what exists today)

- **One shared room only:** the church **family thread** (Engagement → `messages`
  table, RLS by instance; "everyone signed in sees it live"). No member-to-member
  DM, no presence/online status, no "do not disturb," no **people** directory.
- The "Church Directory" is the **multi-church partner** directory (invite your
  church), not a directory of people.
- Usernames just shipped (`resolveUserName` / `saveDisplayName`) — the identity
  layer DM/presence would build on.

## What the research says

**Works in church apps** (ministrybrands, churchspring, oneeighty.digital, discipls):
push notifications, mobile giving, sermon streaming, event signups, sermon library,
**prayer board**, and **group messaging / chat**; ~80% of members are on phones so
mobile-first + training drives adoption; **targeted** (per-group) messaging beats
blast-to-all; and content must be kept **current** or the app dies.

**Fails / the privacy bright lines** (instantchurchdirectory, onlinememberdirectory,
subsplash): a member directory is the #1 privacy risk — data leaks to people who
**left the congregation** or to **posers** seeking to harm; **child safety is
paramount** (COPPA — no minor's last name/address/phone/age exposed, parental
consent for photos, first-name-only for minors); members must **control what's
shared** (military families, civil servants, abuse survivors); and directory
membership should be **vetted**. On presence specifically: passive "last seen"
online-tracking is the surveillance anti-pattern our own DATA-AS-EMPOWERMENT rule
forbids — presence must be a **chosen** status, never passive tracking; DND/mute is
table-stakes to prevent notification fatigue.

## Recommended design (research × our Ways)

1. **"Do Not Disturb" — ship first.** Purely personal, zero privacy risk, universally
   loved. A per-person setting that mutes church push/notifications (and hides you
   from the "available to chat" list). Default: notifications on, DND off.
2. **Presence = a CHOSEN status, opt-in, not surveillance.** Three states the person
   sets: **Available · Do Not Disturb · Invisible** (default **Invisible/off** —
   DATA-AS-EMPOWERMENT: no passive online-tracking, no "last seen," ever).
3. **Direct messaging — opt-in, safety-gated, on the existing `messages` infra.**
   - Opt-in "**allow members to message me**" (default off); a person can't be DM'd
     unless they opted in.
   - **Block + report** on every thread; pastoral/leader visibility option.
   - **Minors protected:** no open member-to-member DM for minors — guardian- or
     leader-mediated only (COPPA + the research's child-safety bar).
   - RLS: a DM row readable only by its two parties (tighten the instance-wide read).
4. **A people directory is the foundation DM needs — build it opt-in:** each person
   chooses per field what's visible (name always; photo/phone/email/household opt-in),
   **first-name-only default for minors**, vetted membership, never exposed to
   signed-out or ex-members. This is `parishioners` (already has `household_id`,
   `membership_status`) surfaced with per-field visibility flags.

## Sequence

- **Now (safe, loved, no gate):** DND + opt-in presence status (Available/DND/Invisible).
- **Behind the safety gate (Bishop Gwin):** opt-in messageability + block/report → then
  full DM → the opt-in people directory. Each is Tier C (congregation-facing + minors).

## Governance

All of §3–§4 is **Tier C** — congregation-facing + child-safety. The agent builds and
stages; **Bishop Gwin + DP decide what opens**, and the minor-protection rules are
non-negotiable gates, not options (COMMUNITY-FIRST, DATA-AS-EMPOWERMENT, VISION-FAIRNESS
posture of protecting the vulnerable).

## Sources

- ministrybrands.com/church-management-software/church-app-features · churchspring.com/blog/tips-enhance-member-experience-church-app · oneeighty.digital/2025/04/29/church-mobile-app-benefits · churchsocial.ai/blog/engagement-in-church
- instantchurchdirectory.com/online-church-directory-security · blog.instantchurchdirectory.com/respecting-privacy-in-your-church-member-directory · help.instantchurchdirectory.com/article/1103-considering-your-church-members-privacy · onlinememberdirectory.com/benefits-of-online-member-directories-for-churches · subsplash.com/blog/church-directory
