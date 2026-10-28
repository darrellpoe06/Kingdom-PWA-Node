# 2026-10-28 — The deploy has more than one road (DR-1269)

**What happened.** From 01:46 UTC the GitHub runner's Tailscale auth key was refused (`invalid key ... not valid`), so every tailnet workflow failed at the join: no deploy (the anon key came only from the NAS over the tailnet), no db-migrate (same road). The site served 32d7d51 for over five hours, up but stale; migration 0313 did not land. Darrell's phone showed the NAS online on the tailnet the whole time; DR-1267's "the NAS stopped answering" was the second log line, not the first.

**What Darrell asked.** "Is there another way?! Why do we only have this one way?! We are supposed to have multiple ways and solutions... Build ways that fit our requirements... if we find a Way we can use we test it."

**What was built, all on `claude/the-deploy-has-more-than-one-road`.**
- `scripts/served-anon-key.py` + the deploy's key step: when the NAS does not answer, the served site speaks the public client key (the same read site-health does), with five distinct refusals and the road named in the log.
- `infra/nas-supabase/replay-on-clock.sh` + `services.json` `sovereign-replay` (enabled): the NAS applies its mirror's migrations every services-sync cycle with the same script and ledger as db-migrate; `replay_migrations.sh` gains a lock both roads respect; loops-health reads its status.json; the flow registry places the rider.
- `app/src/__tests__/the-deploy-has-more-than-one-road.test.js`: 18 cases, selector on a served fixture, installer on a fake replay, the lock on the real replay, the witness and the graph.

**Still his, said plainly.** The Tailscale key itself (admin console only). Every other tailnet workflow waits on it; the build and the schema no longer do.

**Live proof owed.** The deploy run on this record's merge SHA (its `anon key road` line) and site-health SERVED == MAIN; the first `status.json` on the box through loops-health. re-review 2026-11-04.
