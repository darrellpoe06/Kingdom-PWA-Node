#!/usr/bin/env bash
# =============================================================================
# build-door-db.sh — the database the door journeys walk on (DR-0934)
# =============================================================================
# A throwaway PostgreSQL (postgres:16 in CI) built from the REAL schema files
# and migrations that own every table the Poe Properties journeys touch, in
# replay order, with the grants production gives the API roles. Nothing here
# is hand-written schema: the only stand-ins are the Supabase roles, auth.users
# and auth.uid() (scripts/door-work-ci-bootstrap.sql, shared with the
# door-work leg) and the rentals shape that leg already uses.
#
# The migrations under test (0260 onward) apply TWICE: each must be idempotent,
# because db-migrate re-runs them.
#
# Usage: PGHOST=.. PGPORT=.. PGUSER=.. PGDATABASE=.. scripts/e2e/build-door-db.sh
# Never point this at a real database: it creates schema and grants.
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/../.."
MIG=infra/supabase/migrations-auto
P() { psql -v ON_ERROR_STOP=1 -q --single-transaction "$@"; }

case "${PGHOST:-}${PGDATABASE:-}" in
  *supabase.co*|*pooler*) echo "build-door-db: refusing a hosted database" >&2; exit 2 ;;
esac

P -f scripts/door-work-ci-bootstrap.sql
# Production's grants are set by the bootstrap, before the chain (as the
# sovereign replay sets them); each migration's REVOKEs then narrow them.
for f in schema-v1.sql schema-v1.1-tenant-join.sql schema-v2.1-infra.sql schema-v2.2-rentals.sql schema-v2.2.1-rentals-amendments.sql schema-v2.2.2-rentals-sync-amendments.sql; do
  P -f "infra/supabase/$f"
done
P -f scripts/door-work-ci-rentals-shape.sql

# What the Properties app reads on boot, in the order the live ledger applied it.
for f in \
  0056-fix-instances-policy-recursion.sql \
  0052-systems-of-record.sql \
  0055-relationship-permissions.sql \
  0062-per-unit-management.sql \
  0075-delegated-property-management.sql \
  0150-poe-properties-app-invite-claim-and-household.sql \
  0152-vacancies-and-no-account-applications.sql \
  0153-property-timeline-photos.sql \
  0154-photo-captions-editable-and-archivable.sql \
  0155-what-a-door-is-offered-as.sql \
  0156-our-own-home-is-not-a-rental-door.sql \
  0157-the-landlord-orders-his-own-shelf.sql \
  0158-the-address-is-shown-when-he-says-so.sql \
  0159-nothing-a-landlord-types-lives-only-on-his-phone.sql \
  0160-a-door-says-what-it-is-unit-room-or-bed.sql \
  0161-the-landlord-orders-a-doors-pictures.sql \
  0185-a-picture-list-never-carries-the-bytes-and-a-worker-can-file-to-a-vacant-door.sql \
  0258-a-door-can-share-its-cameras-with-its-household.sql; do
  P -f "$MIG/$f"
done

# The work under test: each twice.
#
# 0276 IS IN THIS LIST (DR-0982) even though no journey here books a long stay.
# 0269 creates door_stays with CREATE TABLE IF NOT EXISTS and its two length
# caps are INLINE CONSTRAINTs, so on a FRESH database -- which is the only kind
# this script builds -- the caps 0276 dropped come back. The journeys book two
# nights and neither cap refuses anything, but the database would otherwise sit
# in a state production has not been in since 2026-10-11, and a replay ending
# where production actually is is the whole point of replaying it.
#
# NOTE FOR THE NEXT EDITOR: these are backslash-continued words, not separate
# lines. A `#` comment placed BETWEEN them is not a comment on one entry -- it
# comments out the remainder of the logical line, silently dropping every file
# after it along with the `; do`. Comments go here, above the loop.
for f in \
  0260-work-is-filed-on-the-door-not-only-on-a-tenancy.sql \
  0261-a-guest-reports-a-problem-from-inside-the-door.sql \
  0262-rent-is-reported-the-way-it-is-paid-and-every-change-keeps-its-time.sql \
  0263-a-document-is-signed-in-the-app-and-filed-where-it-belongs.sql \
  0264-a-job-can-require-proof-before-it-is-done-and-paid.sql \
  0265-the-door-keeps-its-money-with-or-without-a-tenant.sql \
  0266-a-door-camera-is-asked-for-and-given-to-whoever-the-family-chooses.sql \
  0267-a-system-keeps-its-pictures.sql \
  0268-the-public-shelf-shows-where-never-the-street.sql \
  0269-a-short-stay-door-has-a-booking-calendar.sql \
  0270-the-public-shelf-shows-the-area-on-a-map.sql \
  0273-a-shared-home-says-so-on-the-shelf.sql \
  0276-a-guest-may-stay-as-long-as-they-like.sql \
  0278-a-bed-is-not-a-bedroom.sql \
  0280-the-address-shows-unless-the-family-holds-it.sql \
  0281-a-bed-still-says-it-is-a-bed-when-the-street-shows.sql \
  0282-each-door-shows-the-apartment-in-its-own-order.sql \
  0283-a-held-door-shows-its-buildings-area.sql \
  0284-the-whole-address-and-its-archive-on-the-record.sql \
  0285-a-nas-picture-is-filed-once.sql \
  0286-a-door-is-priced-by-any-cadence.sql \
  0287-a-landlord-gets-their-own-space.sql \
  0288-a-short-stays-only-season-advertises-the-night-alone.sql; do
  for i in 1 2; do P -f "$MIG/$f"; done
done

echo "build-door-db: built ($(psql -qAt -c "SELECT count(*) FROM pg_tables WHERE schemaname='public'") public tables)"
