# Client Provisioning Runbook — instance + seats + pipeline + door

The repeatable per-client checklist for CLIENT-BUSINESS-FACTORY steps 4-6
(DR-0114), executed once per new client business. Target clock: **same day.**
Every step below is the pattern PROVEN by the Moore Divahs build — each cites
the real artifact it copies, per the Verification Doctrine (DR-0076).

Preconditions (from factory steps 1-3): the discovery note exists (Layer 4),
the deposit is recorded (`client-engagements.js` — no deposit, no build), and
the build board is live in Projects → Boards (DR-0113).

Fill in per client:

- `<slug>` — kebab-case business key (moore proof: `moore-divahs`)
- `<owner-email>` — the client's SIGN-IN email. **Sign-in only, never
  rendered** (Moore precedent #675): no brand record, footer, or public
  surface ever carries it.
- `<pipeline>` — their CRM pipeline key (moore proof: `moore-orders`)

## Step 4 — Their tenant (proof: `infra/supabase/migrations-auto/0089-moore-divahs-instance.sql`)

1. New migration, next number in `migrations-auto/`, following 0089 verbatim:
   - Insert the `<slug>` instance row (idempotent — `ON CONFLICT DO NOTHING`).
   - Owner seat for `<owner-email>` if the auth user exists; otherwise an
     invite row that **auto-consumes on first sign-in** (60-day expiry).
   - Darrell's admin oversight seat.
2. Any domain tables ride the 0059 recipe: `instance_id` + RLS via
   `user_role_in_instance()`, `GRANT authenticated` (never anon), four
   policies, realtime publication, `engagement_touch_updated_at` trigger.
   The tenancy guard fails the build on violations — trust the gate.
3. After merge: **dispatch `db-migrate.yml` on main by hand** (token merges
   never trigger push workflows — DR-0107) and confirm the migration in the
   ledger.

## Step 5 — Their pipeline on the ONE CRM (proof: `app/src/lib/crm-engine.js`)

1. Add the business to `BUSINESSES`, its `<pipeline>` to `PIPELINES`, and its
   door source (`<slug>-app`) to `SOURCES` — config only. The
   `crm-single-engine` guard fails the build on a forked lead table.
2. Every door capture calls `crm_capture_lead` carrying that source — this is
   what makes cross-referral ("the union data") visible from day one.

## Step 6 — Their branded door

Until cf-registry ships, the door is a component following `MooreDoor.jsx`;
after cf-registry, it is a registry ROW rendered by the generic BusinessDoor
at `?biz=<slug>` — never a new component again.

1. **Their name first**; their policies verbatim at the point of order (their
   words are senior — the flyer-to-MOORE_POLICIES precedent).
2. **Public faces ride forced-safe SECURITY DEFINER RPCs, never tables**
   (proofs: `moore_public_classes` 0088, `my_business_role` 0090,
   `business_messages` 0091, showcase 0092).
3. **Client sign-in with their-own-history** — the 0087 read-own lane
   (uid or verified sign-in email), Admin + User login on the same front
   door (`DoorAuth`), strictly-narrowing view-as-customer lens (`doorView`).
4. **Installable under their name** — per-business entry page + manifest +
   share URL/QR (proof: `public/moore/index.html`, `MOORE_SHARE_URL`).
5. Theme swatches + text-size controls ride along free (`theme-css.js`,
   `text-size.js` — already door-standard).

## Verification before "done" (non-negotiable)

- [ ] CI green on the full suite + guards; auto-merge landed the PR.
- [ ] Deploy PROVEN: a real `deploy-cloudflare-pages.yml` run, `head_sha` ==
      main tip (DR-0107). CI-green != deployed.
- [ ] Migration confirmed in the db-migrate ledger.
- [ ] Live user-view review pass on the production door (DR-0104).
- [ ] Tier C front-door sign-off WITH the client before their domain points
      (RELEASE-TIERS) — brand assets, handles, and DNS are the client's and
      Darrell's hands, never the agent's.
