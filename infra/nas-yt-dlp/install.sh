#!/bin/sh
# nas-yt-dlp -- the NAS installs its own yt-dlp, pinned and verified (DR-0723).
#
# WHY. Measured 2026-10-01 (voice-intake-health run 36796582915): every
# services-sync cycle that day ended "choir-dates: DEGRADED -- yt-dlp not
# available (pip install yt-dlp)". The church video road (DR-0333 pass two,
# DR-0712) runs on the NAS's residential IP because GitHub runners are blocked
# from YouTube, and the only yt-dlp the road had was a wrapper that starts a
# python:3.12 container and pip-installs yt-dlp on every call. That wrapper
# depends on the docker socket, a pulled image and PyPI all answering at once,
# and when any one of them does not, the tool is simply "not available".
#
# WHY NOT pip INTO THE EXISTING VENV. The NAS python is 3.8.15 (the
# lesson-voice venv prints it). yt-dlp 2026.08.19 requires python >= 3.10, and
# the last release that installs on 3.8 is from September 2024 -- two years of
# YouTube changes behind. A stale extractor fails the same way a missing one
# does. So the NAS takes yt-dlp's own standalone Linux build: one file that
# carries its own python, needs only glibc >= 2.17, and runs on this box with
# no docker and no PyPI.
#
# PINNED AND VERIFIED. The version and its SHA-256 come from the release's own
# SHA2-256SUMS file and are committed here. A download that does not match is
# deleted and never run. Moving the pin is a one-line change in a PR.
#
# BRAKES (deterministic class, DR-0248): idempotent (a matching recipe and a
# --version that answers make every later cycle a no-op of one process start);
# a failed download is retried at most once per YTDLP_RETRY_SECONDS (6 h), so
# a GitHub outage cannot become a download every 15 minutes; the services-sync
# runner owns the lock and the timeout above this.
#
# EXIT: 0 when $YTDLP_HOME/yt-dlp answers --version with the pinned version;
# 1 otherwise, with the reason on stderr. Callers fall back, never guess.
set -u

# The pin. The *_PIN env names exist for test_install.sh only; nothing on the
# NAS sets them.
YTDLP_VERSION="${YTDLP_PIN_VERSION:-2026.08.19}"
YTDLP_ASSET="yt-dlp_linux"
YTDLP_SHA256="${YTDLP_PIN_SHA256:-58162f9bfdc27458ea47bfcb311cf47028f17d8154a8bf7d689861d46399230a}"
YTDLP_HOME="${YTDLP_HOME:-/volume1/PoeTech/yt-dlp}"
YTDLP_RETRY_SECONDS="${YTDLP_RETRY_SECONDS:-21600}"
RECIPE="v1 $YTDLP_ASSET $YTDLP_VERSION $YTDLP_SHA256"
URL="${YTDLP_PIN_URL:-https://github.com/yt-dlp/yt-dlp/releases/download/$YTDLP_VERSION/$YTDLP_ASSET}"

BIN="$YTDLP_HOME/$YTDLP_ASSET"
WRAP="$YTDLP_HOME/yt-dlp"
LOG="$YTDLP_HOME/install.log"
STAMP="$YTDLP_HOME/.attempt"

mkdir -p "$YTDLP_HOME/tmp" || { echo "nas-yt-dlp: cannot create $YTDLP_HOME" >&2; exit 1; }

say() { echo "nas-yt-dlp: $*"; echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> "$LOG" 2>/dev/null; }

answers() {
  [ -x "$WRAP" ] || return 1
  v=$("$WRAP" --version 2>/dev/null | tail -1)
  [ "$v" = "$YTDLP_VERSION" ]
}

sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -d' ' -f1
  else
    python3 -c 'import hashlib,sys; h=hashlib.sha256(); f=open(sys.argv[1],"rb"); [h.update(b) for b in iter(lambda: f.read(1<<20), b"")]; print(h.hexdigest())' "$1"
  fi
}

fetch() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL --max-time 300 -o "$2" "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -q -T 300 -O "$2" "$1"
  else
    python3 -c 'import sys,urllib.request; urllib.request.urlretrieve(sys.argv[1], sys.argv[2])' "$1" "$2"
  fi
}

write_wrapper() {
  # The onefile build unpacks itself under TMPDIR on every call; keep that on
  # the volume, not on DSM's small root tmpfs.
  cat > "$WRAP.part" <<WRAPEOF
#!/bin/sh
# yt-dlp $YTDLP_VERSION, pinned and verified by infra/nas-yt-dlp/install.sh (DR-0723).
TMPDIR="$YTDLP_HOME/tmp"; export TMPDIR
exec "$BIN" "\$@"
WRAPEOF
  chmod 755 "$WRAP.part" && mv -f "$WRAP.part" "$WRAP"
}

if [ "$(cat "$YTDLP_HOME/.recipe" 2>/dev/null)" = "$RECIPE" ] && answers; then
  echo "nas-yt-dlp: $YTDLP_VERSION installed and answering"
  exit 0
fi

# The binary is present and verified but the wrapper is missing or stale.
if [ -f "$BIN" ] && [ "$(sha256_of "$BIN")" = "$YTDLP_SHA256" ]; then
  chmod 755 "$BIN"; write_wrapper
  if answers; then
    echo "$RECIPE" > "$YTDLP_HOME/.recipe"
    say "$YTDLP_VERSION re-wrapped and answering"
    exit 0
  fi
fi

now=$(date +%s)
last=$(cat "$STAMP" 2>/dev/null || echo 0)
case "$last" in ''|*[!0-9]*) last=0 ;; esac
if [ $((now - last)) -lt "$YTDLP_RETRY_SECONDS" ]; then
  echo "nas-yt-dlp: not installed; last attempt $((now - last))s ago (< ${YTDLP_RETRY_SECONDS}s); see $LOG" >&2
  exit 1
fi
echo "$now" > "$STAMP"

say "installing $YTDLP_ASSET $YTDLP_VERSION from $URL"
rm -f "$BIN.part"
if ! fetch "$URL" "$BIN.part"; then
  rm -f "$BIN.part"
  say "FAILED: download did not complete"
  echo "nas-yt-dlp: download of $URL failed" >&2
  exit 1
fi
got=$(sha256_of "$BIN.part")
if [ "$got" != "$YTDLP_SHA256" ]; then
  rm -f "$BIN.part"
  say "FAILED: sha256 $got is not the pinned $YTDLP_SHA256; deleted, never run"
  echo "nas-yt-dlp: checksum mismatch; refused" >&2
  exit 1
fi
chmod 755 "$BIN.part" && mv -f "$BIN.part" "$BIN"
write_wrapper
if ! answers; then
  out=$("$WRAP" --version 2>&1 | tail -3 | tr '\n' ' ')
  say "FAILED: installed but --version did not answer $YTDLP_VERSION: $out"
  echo "nas-yt-dlp: installed binary does not run here: $out" >&2
  exit 1
fi
echo "$RECIPE" > "$YTDLP_HOME/.recipe"
say "$YTDLP_VERSION installed, verified and answering"
exit 0
