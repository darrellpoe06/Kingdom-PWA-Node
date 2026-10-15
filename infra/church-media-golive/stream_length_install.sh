#!/bin/sh
# stream-length -- every service video keeps its length (DR-1045), riding the
# ALREADY-ARMED services-sync clock (DR-0247: agreed work starts itself; DR-0248
# brakes: the budget lives in stream_length_sync.py's --chunk/--time-budget, the
# lock and outer timeout live in the nas-loops runner above this). Newest
# services first, so each new Sunday and Wednesday is read on the first cycle
# after its row exists; once every video since --since has its length, a cycle
# is one read of the database and nothing else.
#
# yt-dlp is the NAS's own (DR-0723): infra/nas-yt-dlp/install.sh installs the
# pinned, sha256-verified standalone build into /volume1/PoeTech/yt-dlp, the
# same binary choir-dates reads with. If it is not ready this cycle, say so and
# stop; the next cycle tries again.
set -e

REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
DIR="$REPO/infra/church-media-golive"
mkdir -p "$DIR/state"

YTDLP_HOME="${YTDLP_HOME:-/volume1/PoeTech/yt-dlp}"
if ! sh "$REPO/infra/nas-yt-dlp/install.sh"; then
  echo "stream-length: the NAS yt-dlp is not ready (reason above); nothing read this cycle" >&2
  exit 1
fi
PATH="$YTDLP_HOME:$DIR/state:$PATH"
export PATH YTDLP_HOME
echo "stream-length: yt-dlp is $(command -v yt-dlp 2>/dev/null || echo none)"

python3 "$DIR/stream_length_sync.py" --commit --chunk 40 --time-budget 240
