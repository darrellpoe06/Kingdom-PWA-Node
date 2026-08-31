# DR-0317 — the repoint moved the rows, not the blobs

- **status:** accepted
- **date:** 2026-08-31
- **declared by:** Darrell — *"What happened to the images for our MooreDivahs App?!!!!!!"* / *"Fix it!!!!!!!!"* (in-session, 2026-08-31)
- **extends:** DR-0310 (the repoint rides the record), DR-0307 (the cutover sprint), DR-0076 (verification doctrine), DR-0107 (a down surface is the worst outcome), DR-0075 (a non-improvement carries a why + a date)

## What broke

Every image in the Moore Divahs gallery rendered as a broken-image icon on
poetech.us. Titles, prices, and the "Order inspired by this" buttons were
perfect. Shay's front screen — the first thing a client meets — showed her work
as two empty boxes.

## The premise that fell

The reported diagnosis was a client-side regression in the app: either a
dropped `getPublicUrl()` transform leaving a bucket-relative `src`, or a
service-worker cache-only strategy for images. The decisive evidence offered
was that the hosted Supabase project's edge logs carried **zero** browser
requests in 24 hours — read as "the `<img src>` never resolved to the Supabase
host."

Both candidates were wrong, and the zero-requests reading was inverted.
Measured:

- `app/src/lib/showcase.js` still called `getPublicUrl()` — the transform was
  never dropped (`showcaseImageUrl`, unchanged since 0092).
- `app/public/sw.js` routes images down its default branch,
  `caches.match(req).then((cached) => cached || fetch(req))` — a cache MISS
  falls through to a real network fetch. No cache-only path exists.
- `infra/nas-supabase/REPOINT-ARMED` has existed since **2026-08-19**
  (DR-0310). Since that deploy, `deploy-cloudflare-pages.yml` builds the app
  with `VITE_SUPABASE_URL=https://poetech.us/sb`. **The app stopped talking to
  the hosted project entirely.** Zero browser requests in its edge logs is not
  a symptom — it is the repoint working exactly as designed. The only traffic
  left there (`Python-urllib/3.8` on `/rest/v1/instances`, every 15 min) is a
  server-side poller that was never repointed.

## The actual root cause

**The repoint moved the ROWS. It did not move the BLOBS.**
`infra/nas-supabase/cutover_sync.py:15-18` names this in its own header:

> STORAGE OBJECTS ARE NOT COPIED (named gap, not silence): storage.objects
> rows point at blob files that live in the hosted backend; copying rows
> without blobs fabricates working-looking links. The 3 buckets / 455 objects
> stay a recorded NOT-done with its own follow-up (DR-0307).

So from 2026-08-19 on, `getPublicUrl()` correctly built
`https://poetech.us/sb/storage/v1/object/public/moore-showcase/…` — the `/sb`
transport routes `/sb/storage/v1/` to the sovereign storage container
(`infra/nas-supabase/kong.yml:68-70`), which has no `moore-showcase` bucket and
none of its objects. 404, twelve times. The rows rendered because the rows
came across; the pictures did not because the pictures did not.

**The gap was known, recorded, and deliberate. What was missing is that nothing
watched the surface it broke.** A named NOT-done is only honest if something
observes what it costs — for twelve days, nothing did.

## Decision

1. **Public blobs resolve where they actually live, until they move.**
   `VITE_PUBLIC_STORAGE_URL` is an explicit bridge origin. When set,
   `showcaseImageUrl()` builds the public-object URL against it; when unset
   (every un-armed build and every local dev run) behavior is unchanged.
   `deploy-cloudflare-pages.yml` sets it to the hosted origin **only while the
   repoint is armed**, reusing the existing `env.SOVEREIGN_SB_URL` signal.
   Everything else stays sovereign. **Deleting that one workflow line is the
   whole retirement** — images follow the sovereign backend with no code
   change. **re-review: 2026-09-30.**
2. **A named NOT-done gets a witness, not just a note.** The blob copy is the
   real close of this gap and remains open (DR-0307 follow-up). It is carried
   here with a date rather than left as a comment in a Python header that no
   surface reads. **re-review: 2026-09-30.**
3. **The bucket states its read intent explicitly.** 0092 created
   `moore-showcase` with a steward INSERT policy and **no SELECT policy** —
   reads work only because `bucket.public = true` makes `/object/public`
   bypass RLS. Migration `0163` adds the SELECT policy and re-asserts the
   public flag. Nothing about today's behavior changes; the policy is there
   for the day the public flag is not, so the bucket can never fail closed and
   silent (a restore, a signed-URL move, or the sovereign cutover recreating
   buckets).
4. **Bytes are bounded at upload, not by a transform URL.** The bucket held
   10.6 MB and 7.3 MB originals being painted into ~180 CSS px grid
   thumbnails, ~30 MB for twelve. A `/render/image` transform is the wrong
   fix *here*: the sovereign stack runs **no imgproxy**
   (`infra/nas-supabase/docker-compose.yml`), so a transform URL would break
   the moment the blobs land there. `addPiece()` now re-encodes through the
   repo's proven `compressImageFile` path (1600px, q0.8) before upload —
   true on both backends. Best-effort by design: a file this device's decoder
   cannot read uploads the original rather than failing Shay's post. The
   twelve existing originals are a data backfill that rides the blob copy —
   **re-review: 2026-09-30.**

## Why this is a Way and not just a fix

The cutover's own record said storage did not come across. The app's code was
innocent, the data was intact, the gates were green, and the surface was
broken for twelve days — because *"named as not-done"* was treated as the same
thing as *"handled."* It is not. **A deliberate gap in a migration is a
scheduled outage of whatever reads across it, and it must be carried on the
thing it breaks.** The general form, sized to this cutover: when a migration
declares a class of data out of scope, the surfaces that read that class are
enumerated in the same delivery and each one gets a bridge, a witness, or a
dated re-review — never silence.

Related: DR-0125 (the site has its own witness), DR-0298 (show-me-on-the-live-site
is a workflow, not a claim). The blob copy is the durable close; this record is
what keeps it from going quiet again.
