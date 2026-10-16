-- =============================================================================
-- church-onboarding-ci-bootstrap.sql — the one table 0294/0297 read that the
-- schema files do not create, for the ci.yml church-onboarding job (DR-1066)
-- =============================================================================
-- That job runs on a throwaway postgres:16 with scripts/door-work-ci-bootstrap
-- (roles, auth.users, auth.uid()) and the schema-v1 / v1.1 / v2.1 files
-- (instances, instance_members, instance_invites, the role helpers). The
-- church join reads person_links (0141), and 0141 cannot be replayed there:
-- it also rewrites policies on study_entries / tv_watch / eternal_algorithms,
-- tables that leg never has. So the table is created here, VERBATIM from
-- 0141:34-44, with no policy — the smokes write links as postgres only,
-- exactly as 0294's does. Never applied to a real database.
-- =============================================================================
CREATE TABLE IF NOT EXISTS person_links (
  primary_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  door_user    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (primary_user, door_user),
  CONSTRAINT person_links_distinct CHECK (primary_user <> door_user),
  CONSTRAINT person_links_door_unique UNIQUE (door_user)
);
ALTER TABLE person_links ENABLE ROW LEVEL SECURITY;
