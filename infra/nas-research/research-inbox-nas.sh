#!/usr/bin/env bash
# =============================================================================
# research-inbox-nas.sh -- the NAS answers its own research items (DR-1443)
# =============================================================================
# Darrell 2026-11-12: "We have a research space does it work?!!!! Fix it!!!!!"
#
# MEASURED THE SAME DAY: it did not. Every research-inbox.yml run since the
# runner's tailnet key expired (2026-11-04, and again by 2026-11-10: "invalid
# key: API key does not exist") failed at the join -- the NAS's own bell rang
# the lane every hour and every run died before it could claim a row. So a
# link or a question sent from the Research tab sat at "Waiting to be looked
# into" with nothing looking.
#
# DR-1360 already set the direction: the NAS starts every road. This is the
# same lane research-inbox.yml runs, run HERE, with nothing outside alive:
#   * the same SQL files (research-inbox-waiting.sql, the reading and create
#     waiting queries, research-create.sh), through scripts/live-sql.sh in its
#     LIVE_SQL_LOCAL mode -- docker exec psql on this box, no ssh, no key;
#   * the same roads: YouTube captions (youtube-captions.py), else the link's
#     words through link_words.py and the Whisper ladder; a question through
#     the forwarder's /ask on 127.0.0.1:8797 with the family key read here;
#   * the same rows: research-answer / research-failed with the unverified
#     sentence as the FIRST LINE, research-reading / research-reading-failed,
#     then what it was sent for, filed by research-create.sh.
# What it does not have is the runner's own address and browser (roads 3 and
# 6 of the workflow). An item the NAS cannot read falls to the sender's own
# words (DR-1203), exactly as before, and a failure says why on the item.
#
# BRAKES (deterministic class, DR-0248: budget + lock).
#   Budget -- at most RESEARCH_NAS_MAX_ITEMS items a run (3), claimed ONE at a
#             time (the claim query's LIMIT 6 is run as LIMIT 1, so nothing is
#             claimed that this run will not answer), a wall-clock budget
#             (RESEARCH_NAS_BUDGET_SECONDS, 3000) checked before each claim,
#             the link road's own 45-minute ceiling, a 400,000-character cap
#             on an answer, one reading and ten filings from the backlog.
#   Lock   -- one run at a time: a lock directory holding the run's pid; a run
#             that finds it held by a live pid SKIPS. The real single-reader
#             lock across machines is still the research-claimed tag
#             (FOR UPDATE SKIP LOCKED), so this and the workflow, if its key
#             ever returns, can never answer the same item twice.
#   Stop   -- `enabled: false` on the research service in services.json, or
#             RESEARCH_NAS_ENABLED=0. No database on this box is a named quiet
#             no-op. The ledger (last-run.json) says what each run did.
#
# NO BODIES, NO KEYS, IN THE LOG. Words travel through files in this item's own
# folder (mode 700) and base64 into SQL; the log carries ids, kinds, counts and
# verdicts only.
#
# NOT YET PROVEN (P66): working when its first answer row is seen in the
# Research tab. The session that wrote it cannot watch it run, for the same
# expired key that is the reason it exists.
# =============================================================================
set -uo pipefail
PATH="/usr/local/bin:/opt/bin:/usr/bin:/bin:${PATH:-}"
export PATH

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
HOME_DIR="${RESEARCH_NAS_HOME:-/volume1/PoeTech/research/nas-lane}"
MAX_ITEMS="${RESEARCH_NAS_MAX_ITEMS:-3}"
BUDGET="${RESEARCH_NAS_BUDGET_SECONDS:-3000}"
TOKEN_FILE="${RESEARCH_TOKEN_FILE:-/volume1/PoeTech/secrets/chat-bridge-token.txt}"
ASK_URL="${RESEARCH_ASK_URL:-http://127.0.0.1:8797/ask}"
READ_URL="${RESEARCH_READ_URL:-http://127.0.0.1:8797/read}"
# Injectable so the test can stand in for the database and the filer.
LIVE_SQL="${RESEARCH_LIVE_SQL:-bash $REPO/scripts/live-sql.sh}"
CREATE="${RESEARCH_CREATE:-bash $REPO/scripts/research-create.sh}"
export LIVE_SQL_LOCAL=1
START=$(date +%s)
UNVERIFIED="Unverified: this came from a web search and our own model. Read the source before relying on a sentence."
UUID_RE='^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

sql() { $LIVE_SQL '|'; }
elapsed() { echo $(( $(date +%s) - START )); }
b64() { base64 < "$1" | tr -d '\n'; }

ANSWERED=0; FAILED=0; READINGS=0; FILED=0; WHAT=nothing-waiting; ERR=""
ledger() {
  mkdir -p "$HOME_DIR" 2>/dev/null || return 0
  python3 - "$HOME_DIR/last-run.json" "$WHAT" "$ANSWERED" "$FAILED" "$READINGS" "$FILED" "$(elapsed)" "$ERR" <<'PY' || true
import json, os, sys, datetime
p, what, a, f, r, c, secs, err = sys.argv[1:9]
e = {"what": what, "answered": int(a), "failed": int(f), "readings": int(r), "filed": int(c),
     "seconds": int(secs), "at": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z")}
if err:
    e["error"] = err[:300]
tmp = p + ".tmp"
with open(tmp, "w", encoding="utf-8") as fh:
    json.dump(e, fh)
os.replace(tmp, p)
PY
}

# ---- STOP ------------------------------------------------------------------
if [ "${RESEARCH_NAS_ENABLED:-1}" = 0 ]; then
  echo "research-inbox-nas: stopped (RESEARCH_NAS_ENABLED=0)"; exit 0
fi
if [ -z "${RESEARCH_LIVE_SQL:-}" ] && [ ! -s "${NAS_ENV:-/volume1/docker/supabase/.env}" ] && ! sudo -n test -s "${NAS_ENV:-/volume1/docker/supabase/.env}" 2>/dev/null; then
  WHAT=no-database; ledger
  echo "research-inbox-nas: no sovereign database on this box - quiet no-op"; exit 0
fi

# ---- LOCK ------------------------------------------------------------------
mkdir -p "$HOME_DIR" || { echo "research-inbox-nas: cannot make $HOME_DIR"; exit 1; }
LOCK="$HOME_DIR/.lock"
if ! mkdir "$LOCK" 2>/dev/null; then
  OTHER=$(cat "$LOCK/pid" 2>/dev/null || true)
  if [ -n "$OTHER" ] && kill -0 "$OTHER" 2>/dev/null; then
    echo "research-inbox-nas: a run is already going (pid $OTHER) - skipping"; exit 0
  fi
  rm -rf "$LOCK"; mkdir "$LOCK" || { echo "research-inbox-nas: could not take the lock"; exit 1; }
  echo "research-inbox-nas: released a lock left by a run that is gone"
fi
echo $$ > "$LOCK/pid"
WORK="$HOME_DIR/work"
mkdir -p "$WORK" && chmod 700 "$WORK"
trap 'rm -rf "$LOCK"' EXIT

token() { cat "$TOKEN_FILE" 2>/dev/null || sudo -n cat "$TOKEN_FILE" 2>/dev/null || true; }

# POST a JSON body (from a file) to a forwarder door with the family key.
# Prints {"code": ..., ...} and never raises.
post() {  # url body.json timeout out.json
  TOK="$(token)" python3 - "$1" "$2" "$3" > "$4" 2>/dev/null <<'PY' || echo '{"code":0,"error":"the door could not be asked"}' > "$4"
import json, os, sys, urllib.error, urllib.request
url, body, timeout = sys.argv[1], sys.argv[2], int(sys.argv[3])
req = urllib.request.Request(url, method="POST", data=open(body, "rb").read())
req.add_header("Content-Type", "application/json")
req.add_header("Authorization", "Bearer " + os.environ.get("TOK", ""))
try:
    with urllib.request.urlopen(req, timeout=timeout) as r:
        print(json.dumps({"code": r.status, **json.loads(r.read().decode() or "{}")}))
except urllib.error.HTTPError as e:
    try:
        b = json.loads(e.read().decode() or "{}")
    except ValueError:
        b = {}
    print(json.dumps({"code": e.code, "error": str(b.get("error", ""))[:200]}))
except Exception as e:
    print(json.dumps({"code": 0, "error": str(e)[:200]}))
PY
}

# ---- ONE ITEM --------------------------------------------------------------
# Words, answer, reading, then what it was sent for -- the workflow's work job.
work_item() {
  local ID="$1" W="$WORK/$1"
  mkdir -p "$W" && chmod 700 "$W"
  local row
  row=$(printf '%s' "SELECT id, created_by, instance_id, replace(encode(convert_to(coalesce(body,''), 'UTF8'), 'base64'), chr(10), '') FROM public.agent_inbox WHERE id = '$ID' AND tags ? 'research-claimed' AND NOT (tags ? 'research-answered');" | sql) || { echo "  could not read $ID"; rm -rf "$W"; return 1; }
  [ -n "$row" ] || { echo "  $ID is no longer claimed and waiting"; rm -rf "$W"; return 0; }
  local BY INST
  BY=$(printf '%s' "$row" | cut -d'|' -f2)
  INST=$(printf '%s' "$row" | cut -d'|' -f3)
  printf '%s' "$row" | cut -d'|' -f4 | base64 -d > "$W/item.txt"
  local LINK VID KIND
  LINK=$(grep -oE 'https?://[^[:space:]<>"]+' "$W/item.txt" | head -1 || true)
  VID=$(printf '%s' "$LINK" | sed -nE 's#.*(youtu\.be/|[?&]v=|/shorts/|/live/|/embed/)([A-Za-z0-9_-]{11}).*#\2#p' | head -1)
  if [ -n "$LINK" ]; then KIND=link; else KIND=question; fi
  echo "  item $ID - kind $KIND - $(wc -c < "$W/item.txt") characters - youtube id ${VID:-none}"
  : > "$W/answer.txt"
  local VERDICT=failed WHY="the road did not run" TRY_AUDIO=0 FROM=link

  if [ "$KIND" = link ] && [ -n "$VID" ]; then
    # ROAD 1 -- captions, from this box's residential address (DR-0723).
    local SME="$REPO/infra/nas-sme-pipeline"
    ( cd "$SME" && PYTHONPATH="$SME/.vendor:/var/services/homes/dpoe/.local/lib/python3.8/site-packages" \
        timeout 300 python3 youtube-captions.py --ids "$VID" --max 1 --refetch --out "$W/captions.json" ) > "$W/fetch.log" 2>&1 || true
    if [ -s "$W/captions.json" ]; then
      node "$REPO/scripts/captions-json-to-text.mjs" "$W/captions.json" "$VID" > "$W/answer.txt" 2>/dev/null || true
      if [ "$(wc -c < "$W/answer.txt")" -gt 500 ]; then VERDICT=answered
      else WHY="the captions came back but rendered under 500 characters"; TRY_AUDIO=1; fi
    else
      WHY="no captions came back for this video"; TRY_AUDIO=1
    fi
  elif [ "$KIND" = link ]; then
    TRY_AUDIO=1
  fi

  if [ "$TRY_AUDIO" = 1 ]; then
    # ROAD 2 -- the link's words through the Whisper ladder the spoken lessons
    # ride, fetched by this box's pinned yt-dlp; a page is read as a page.
    local LV="$REPO/infra/nas-lesson-voice" PY=/volume1/PoeTech/venvs/lesson-voice/bin/python
    [ -x "$PY" ] || PY=python3
    ( cd "$LV" 2>/dev/null || cd "$REPO"; LINK_WORDS_LADDER_DIR="$LV" LINK_WORDS_WORK="$W" LINK_WORDS_SLOT_DIR="$WORK/.slots" \
        timeout 2700 "$PY" "$REPO/infra/nas-research/link_words.py" --url-file "$W/item.txt" --out "$W/link_words.json" ) > "$W/lw.log" 2>&1 || true
    python3 "$REPO/infra/nas-research/link_words.py" --render "$W/link_words.json" > "$W/answer.txt" 2>/dev/null || : > "$W/answer.txt"
    if [ "$(wc -c < "$W/answer.txt")" -gt 40 ]; then VERDICT=answered
    else
      local LWWHY
      LWWHY=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('why') or '')" "$W/link_words.json" 2>/dev/null || true)
      WHY="${WHY:+$WHY; }the link's audio could not be turned into words: ${LWWHY:-the link road did not answer}"
    fi
  elif [ "$KIND" = question ]; then
    # The /ask door DR-1101 brought home; the question travels as a file.
    python3 -c "import json,sys;print(json.dumps({'query':open(sys.argv[1],encoding='utf-8').read().strip(),'mode':'speed','sources':['web']}))" "$W/item.txt" > "$W/ask-body.json"
    post "$ASK_URL" "$W/ask-body.json" 200 "$W/ask.json"
    node "$REPO/scripts/research-answer-text.mjs" "$W/ask.json" > "$W/answer.txt" 2>"$W/ask.err" || true
    if [ "$(wc -c < "$W/answer.txt")" -gt 20 ]; then VERDICT=answered
    else WHY="the research road did not answer: $(head -c 200 "$W/ask.err" 2>/dev/null)"; fi
  fi

  # YOUR OWN WORDS FIRST (DR-1203): an unreadable link with five or more words
  # beside it is answered from those words, and says so.
  if [ "$KIND" = link ] && [ "$VERDICT" != answered ]; then
    local NOTE
    NOTE=$(python3 -c "import re,sys;print(re.sub(r'https?://[^\s<>\"\']+',' ',open(sys.argv[1],encoding='utf-8').read()).strip())" "$W/item.txt" 2>/dev/null || true)
    if [ "$(printf '%s' "$NOTE" | wc -w)" -ge 5 ]; then
      { echo "Your own words, sent with the link:"; printf '%s\n' "$NOTE"; echo; echo "The link itself could not be read on our own machines: $WHY"; } > "$W/answer.txt"
      VERDICT=answered; FROM=words
    fi
  fi
  python3 -c "import sys; p=sys.argv[1]; t=open(p, encoding='utf-8', errors='replace').read(); n=len(t); t=t[:400000]; open(p, 'w', encoding='utf-8').write(t + ('\n\n(The words ran past 400,000 characters; they are kept to that length.)' if n > 400000 else ''))" "$W/answer.txt" || true

  local TAG
  if [ "$VERDICT" = answered ] && [ "$FROM" = words ]; then
    TAG=research-answer
    { echo "From your own words: the link could not be read, so nothing here came from it."; echo; cat "$W/answer.txt"; } > "$W/body.txt"
  elif [ "$VERDICT" = answered ]; then
    TAG=research-answer
    { echo "$UNVERIFIED"; echo; cat "$W/answer.txt"; } > "$W/body.txt"
  else
    TAG=research-failed
    printf '%s\n' "$WHY" > "$W/body.txt"
  fi
  local out
  out=$(printf '%s' "INSERT INTO public.agent_inbox (instance_id, body, tags, source, created_by) VALUES ('$INST', convert_from(decode('$(b64 "$W/body.txt")','base64'),'UTF8'), '[\"$TAG\",\"of:$ID\"]'::jsonb, 'research-inbox-nas', '$BY'); UPDATE public.agent_inbox SET tags = tags || '[\"research-answered\"]'::jsonb WHERE id = '$ID' AND NOT (tags ? 'research-answered'); SELECT id::text FROM public.agent_inbox WHERE tags @> '[\"of:$ID\"]'::jsonb;" | sql) \
    || { echo "  could not write the answer row for $ID - it stays claimed and is released after 90 minutes"; ERR="answer row for $ID not written"; rm -rf "$W"; return 1; }
  echo "  verdict $VERDICT ($TAG) - from $FROM - $(wc -c < "$W/answer.txt") characters"
  if [ "$VERDICT" = answered ]; then ANSWERED=$((ANSWERED+1)); else FAILED=$((FAILED+1)); fi

  # The reading, in the same pass (DR-1200).
  if [ "$VERDICT" = answered ]; then
    read_item "$ID" "$BY" "$INST" "$W/item.txt" "$W/body.txt" "$W"
  fi
  # What it was sent for (DR-1202), also after a failed look.
  if $CREATE "$ID" > "$W/create.log" 2>&1; then FILED=$((FILED+1)); fi
  tail -1 "$W/create.log" | sed 's/^/  /'
  rm -rf "$W"
}

# The reading: the tower alone, no search; its own row either way.
read_item() {  # id by inst note words workdir
  local ID="$1" BY="$2" INST="$3" W="$6"
  printf '%s' "UPDATE public.agent_inbox SET tags = tags || '[\"research-reading-claimed\"]'::jsonb WHERE id = '$ID' AND NOT (tags ? 'research-reading-claimed');" | sql > /dev/null || return 0
  python3 -c "import json,sys;r=lambda p:open(p,encoding='utf-8').read();print(json.dumps({'text':r(sys.argv[1]),'note':r(sys.argv[2])[:500]}))" "$5" "$4" > "$W/read-body.json"
  post "$READ_URL" "$W/read-body.json" 960 "$W/read.json"
  local TAG UNCLAIM=""
  if node "$REPO/scripts/research-reading-text.mjs" "$W/read.json" > "$W/reading.txt" 2>"$W/read.err" && [ "$(wc -c < "$W/reading.txt")" -gt 30 ]; then
    TAG=research-reading
    { echo "Unverified: this came from our own model reading the words. Read the source before relying on a sentence."; echo; cat "$W/reading.txt"; } > "$W/rbody.txt"
    READINGS=$((READINGS+1))
  else
    TAG=research-reading-failed
    head -c 200 "$W/read.err" > "$W/rbody.txt" 2>/dev/null
    [ -s "$W/rbody.txt" ] || echo "the road did not say why" > "$W/rbody.txt"
    UNCLAIM="UPDATE public.agent_inbox SET tags = tags - 'research-reading-claimed' WHERE id = '$ID';"
  fi
  printf '%s' "INSERT INTO public.agent_inbox (instance_id, body, tags, source, created_by) VALUES ('$INST', convert_from(decode('$(b64 "$W/rbody.txt")','base64'),'UTF8'), '[\"$TAG\",\"of:$ID\"]'::jsonb, 'research-inbox-nas', '$BY'); $UNCLAIM" | sql > /dev/null \
    && echo "  reading: $TAG" || echo "  reading row could not be written"
}

# ---- THE RUN ---------------------------------------------------------------
CLAIM_SQL=$(sed 's/LIMIT 6/LIMIT 1/' "$REPO/scripts/research-inbox-waiting.sql")
case "$CLAIM_SQL" in *"LIMIT 1"*) ;; *) echo "research-inbox-nas: the claim query lost its LIMIT - refusing to claim"; ERR="claim query has no LIMIT"; WHAT=error; ledger; exit 1 ;; esac
N=0
while [ "$N" -lt "$MAX_ITEMS" ] && [ "$(elapsed)" -lt "$BUDGET" ]; do
  ids=$(printf '%s' "$CLAIM_SQL" | sql) || { ERR="could not read the live database - this is NOT 'no items waiting'"; WHAT=error; echo "research-inbox-nas: $ERR"; break; }
  ID=$(printf '%s\n' "$ids" | grep -E "$UUID_RE" | head -1 || true)
  [ -n "$ID" ] || break
  N=$((N+1)); WHAT=worked
  echo "research-inbox-nas: claimed $ID"
  work_item "$ID" || true
done

# ---- THE BACKLOG -----------------------------------------------------------
if [ "$WHAT" != error ] && [ "$(elapsed)" -lt "$BUDGET" ]; then
  row=$(sql < "$REPO/scripts/research-reading-waiting.sql" 2>/dev/null || true)
  RID=$(printf '%s' "$row" | head -1 | cut -d'|' -f1)
  if printf '%s' "$RID" | grep -qE "$UUID_RE"; then
    W="$WORK/read-$RID"; mkdir -p "$W" && chmod 700 "$W"
    printf '%s' "$row" | head -1 | cut -d'|' -f4 | base64 -d > "$W/note.txt"
    printf '%s' "$row" | head -1 | cut -d'|' -f5 | base64 -d > "$W/words.txt"
    echo "research-inbox-nas: reading an earlier answer, $RID"
    read_item "$RID" "$(printf '%s' "$row" | head -1 | cut -d'|' -f2)" "$(printf '%s' "$row" | head -1 | cut -d'|' -f3)" "$W/note.txt" "$W/words.txt" "$W"
    rm -rf "$W"
  fi
  for CID in $(sql < "$REPO/scripts/research-create-waiting.sql" 2>/dev/null | grep -E "$UUID_RE" || true); do
    if $CREATE "$CID" 2>&1 | tail -1 | sed 's/^/  /'; then FILED=$((FILED+1)); fi
  done
fi

ledger
echo "research-inbox-nas: $WHAT - answered $ANSWERED, failed $FAILED, readings $READINGS, filed $FILED, $(elapsed)s"
[ "$WHAT" = error ] && exit 1
exit 0
