#!/usr/bin/env bash
# research-create.sh <item-id> -- file what an answered research item was sent
# for (DR-1202). Called by research-inbox.yml for each item a run answers, and
# for the backlog of items answered before this road existed.
#
#   lesson -> a `lesson` row for the NAS lesson builder (migration 0243's
#             trigger rings it the moment the row lands; the builder works
#             WORD FIRST and checks every quoted verse against the KJV)
#   build  -> a `tell-poetech` + `poetech-app` row, the build request the
#             Thinking Space files (lib/poetech-request.js)
#   none   -> the item is tagged research-create-none and stays research
#
# ONE STATEMENT, SO IT CANNOT HALF-HAPPEN AND CANNOT HAPPEN TWICE. The parent
# gains `research-created` in the same statement that inserts the rows, and the
# inserts select FROM that claim, so a second caller (a backlog pass racing a
# work job) inserts nothing. The `research-created` child row names what was
# filed by id, so the Research section can say "Created from this".
#
# Bodies travel base64 into the SQL and are never echoed. Needs NAS_SSH_KEY
# (scripts/live-sql.sh) and a tailnet.
set -uo pipefail
ID="${1:-}"
[[ "$ID" =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]] || { echo "research-create: the id is not a uuid" >&2; exit 2; }
HERE="$(cd "$(dirname "$0")" && pwd)"
W="$(mktemp -d)"
trap 'rm -rf "$W"' EXIT

SQL="SELECT i.created_by, i.instance_id,
  (i.tags ? 'research-created' OR i.tags ? 'research-create-none'),
  replace(encode(convert_to(i.tags::text, 'UTF8'), 'base64'), chr(10), ''),
  replace(encode(convert_to(coalesce(i.body,''), 'UTF8'), 'base64'), chr(10), ''),
  replace(encode(convert_to(coalesce((SELECT a.body FROM public.agent_inbox a WHERE a.tags ? 'research-answer' AND a.tags ? ('of:' || i.id::text) ORDER BY a.created_at DESC LIMIT 1),''), 'UTF8'), 'base64'), chr(10), ''),
  replace(encode(convert_to(coalesce((SELECT r.body FROM public.agent_inbox r WHERE r.tags ? 'research-reading' AND r.tags ? ('of:' || i.id::text) ORDER BY r.created_at DESC LIMIT 1),''), 'UTF8'), 'base64'), chr(10), ''),
  replace(encode(convert_to(coalesce((SELECT f.body FROM public.agent_inbox f WHERE f.tags ? 'research-failed' AND NOT (f.tags ? 'superseded') AND f.tags ? ('of:' || i.id::text) ORDER BY f.created_at DESC LIMIT 1),''), 'UTF8'), 'base64'), chr(10), '')
FROM public.agent_inbox i WHERE i.id = '$ID' AND i.tags ? 'research' AND i.tags ? 'research-answered';"
row=$(printf '%s' "$SQL" | bash "$HERE/live-sql.sh" '|') || { echo "research-create: could not read the item" >&2; exit 1; }
[ -n "$row" ] || { echo "research-create: $ID is not an answered research item"; exit 0; }
BY=$(printf '%s' "$row" | cut -d'|' -f1)
INST=$(printf '%s' "$row" | cut -d'|' -f2)
DONE=$(printf '%s' "$row" | cut -d'|' -f3)
if [ "$DONE" = t ]; then echo "research-create: $ID already has what it was sent for"; exit 0; fi
printf '%s' "$row" | cut -d'|' -f4 | base64 -d > "$W/tags.json"
printf '%s' "$row" | cut -d'|' -f5 | base64 -d > "$W/item.txt"
printf '%s' "$row" | cut -d'|' -f6 | base64 -d > "$W/answer.txt"
printf '%s' "$row" | cut -d'|' -f7 | base64 -d > "$W/reading.txt"
printf '%s' "$row" | cut -d'|' -f8 | base64 -d > "$W/failed.txt"

node "$HERE/research-create-text.mjs" --id "$ID" --item "$W/item.txt" --tags "$W/tags.json" --answer "$W/answer.txt" --reading "$W/reading.txt" --failed "$W/failed.txt" > "$W/out.json"
rc=$?
if [ "$rc" = 3 ]; then
  # Nothing to file from: no words came back AND too few were sent with the
  # link to be a request of their own. Said, and marked, never invented.
  printf '%s' "UPDATE public.agent_inbox SET tags = tags || '[\"research-create-none\"]'::jsonb WHERE id = '$ID' AND NOT (tags ? 'research-create-none');" | bash "$HERE/live-sql.sh" '|' >/dev/null || true
  echo "research-create: $ID has no words to file from (the link could not be read and too little was sent with it)"
  exit 0
fi
[ "$rc" = 0 ] || { echo "research-create: the words to file could not be made" >&2; exit 1; }
INTENTS=$(node -e "const o=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(o.intents.join(','))" "$W/out.json")
if [ -z "$INTENTS" ]; then
  printf '%s' "UPDATE public.agent_inbox SET tags = tags || '[\"research-create-none\"]'::jsonb WHERE id = '$ID' AND NOT (tags ? 'research-create-none');" | bash "$HERE/live-sql.sh" '|' >/dev/null \
    || { echo "research-create: could not mark $ID as research only" >&2; exit 1; }
  echo "research-create: $ID was sent for research only; nothing filed"
  exit 0
fi
b64() { node -e "const o=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));process.stdout.write(Buffer.from(o[process.argv[2]]||'','utf8').toString('base64'))" "$W/out.json" "$1"; }
LB64=$(b64 lesson)
BB64=$(b64 build)
WL=false; WB=false
case ",$INTENTS," in *,lesson,*) WL=true ;; esac
case ",$INTENTS," in *,build,*) WB=true ;; esac

SQL="WITH claim AS (
  UPDATE public.agent_inbox SET tags = tags || '[\"research-created\"]'::jsonb
   WHERE id = '$ID' AND NOT (tags ? 'research-created') RETURNING id
), l AS (
  INSERT INTO public.agent_inbox (instance_id, body, tags, source, created_by)
  SELECT '$INST', convert_from(decode('$LB64','base64'),'UTF8'), '[\"lesson\",\"from-research\",\"research-source:$ID\"]'::jsonb, 'research-inbox', '$BY'
    FROM claim WHERE $WL RETURNING id
), b AS (
  INSERT INTO public.agent_inbox (instance_id, body, tags, source, created_by)
  SELECT '$INST', convert_from(decode('$BB64','base64'),'UTF8'), '[\"tell-poetech\",\"poetech-app\",\"from-research\",\"research-source:$ID\"]'::jsonb, 'research-inbox', '$BY'
    FROM claim WHERE $WB RETURNING id
), c AS (
  INSERT INTO public.agent_inbox (instance_id, body, tags, source, created_by)
  SELECT '$INST', concat_ws(E'\\n', (SELECT 'Filed: lesson ' || id::text FROM l), (SELECT 'Filed: build ' || id::text FROM b)), '[\"research-created\",\"of:$ID\"]'::jsonb, 'research-inbox', '$BY'
    FROM claim RETURNING id
)
SELECT (SELECT count(*) FROM claim), (SELECT count(*) FROM l), (SELECT count(*) FROM b), (SELECT count(*) FROM c);"
out=$(printf '%s' "$SQL" | bash "$HERE/live-sql.sh" '|') || { echo "research-create: the rows could not be filed" >&2; exit 1; }
echo "research-create: $ID intents [$INTENTS] -> claim|lesson|build|record = $out"
case "$out" in 0\|*) echo "research-create: another pass filed it first; nothing doubled" ;; esac
exit 0
