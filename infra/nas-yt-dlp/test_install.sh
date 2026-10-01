#!/bin/sh
# Proven-to-catch tests for infra/nas-yt-dlp/install.sh (DR-0723). Offline: a
# fake "release" is a tiny script served by file://, pinned by its own sha256.
# Run: sh infra/nas-yt-dlp/test_install.sh
set -u
HERE=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
pass=0; fail=0
ok()  { pass=$((pass+1)); echo "PASS - $1"; }
bad() { fail=$((fail+1)); echo "FAIL - $1"; }

mk_release() { # $1 dir, $2 version it reports
  mkdir -p "$1"
  printf '#!/bin/sh\necho %s\n' "$2" > "$1/yt-dlp_linux"
  chmod 755 "$1/yt-dlp_linux"
}
sha() { sha256sum "$1" | cut -d' ' -f1; }

# 1. A release that matches the pin installs, answers, and writes the recipe.
mk_release "$T/rel" 2099.01.01
GOOD=$(sha "$T/rel/yt-dlp_linux")
H="$T/home1"
if YTDLP_HOME="$H" YTDLP_PIN_VERSION=2099.01.01 YTDLP_PIN_SHA256="$GOOD" \
   YTDLP_PIN_URL="file://$T/rel/yt-dlp_linux" sh "$HERE/install.sh" >/dev/null 2>&1 \
   && [ "$("$H/yt-dlp" --version)" = "2099.01.01" ] && grep -q "2099.01.01" "$H/.recipe"; then
  ok "a matching release installs and answers --version"
else bad "a matching release installs and answers --version"; fi

# 2. Idempotent: the second cycle downloads nothing (the source is gone).
rm -f "$T/rel/yt-dlp_linux.gone"; mv "$T/rel/yt-dlp_linux" "$T/rel/yt-dlp_linux.gone"
if YTDLP_HOME="$H" YTDLP_PIN_VERSION=2099.01.01 YTDLP_PIN_SHA256="$GOOD" \
   YTDLP_PIN_URL="file://$T/rel/yt-dlp_linux" sh "$HERE/install.sh" 2>/dev/null | grep -q "installed and answering"; then
  ok "a later cycle is a no-op"
else bad "a later cycle is a no-op"; fi
mv "$T/rel/yt-dlp_linux.gone" "$T/rel/yt-dlp_linux"

# 3. A download that does not match the pin is deleted and never run.
H="$T/home2"
if YTDLP_HOME="$H" YTDLP_PIN_VERSION=2099.01.01 YTDLP_PIN_SHA256="0000000000000000000000000000000000000000000000000000000000000000" \
   YTDLP_PIN_URL="file://$T/rel/yt-dlp_linux" sh "$HERE/install.sh" >/dev/null 2>&1; then
  bad "a checksum mismatch is refused"
elif [ -e "$H/yt-dlp_linux" ] || [ -e "$H/yt-dlp" ] || [ -e "$H/yt-dlp_linux.part" ]; then
  bad "a checksum mismatch leaves nothing runnable behind"
else ok "a checksum mismatch is refused and leaves nothing runnable"; fi

# 4. The retry brake: a second attempt inside the window does not download.
if YTDLP_HOME="$H" YTDLP_PIN_VERSION=2099.01.01 YTDLP_PIN_SHA256="$GOOD" \
   YTDLP_PIN_URL="file://$T/rel/yt-dlp_linux" sh "$HERE/install.sh" >/dev/null 2>&1; then
  bad "a failed attempt is not retried inside the window"
else ok "a failed attempt is not retried inside the window"; fi
# ...and outside the window it is.
if YTDLP_HOME="$H" YTDLP_RETRY_SECONDS=0 YTDLP_PIN_VERSION=2099.01.01 YTDLP_PIN_SHA256="$GOOD" \
   YTDLP_PIN_URL="file://$T/rel/yt-dlp_linux" sh "$HERE/install.sh" >/dev/null 2>&1; then
  ok "after the window the install is retried and succeeds"
else bad "after the window the install is retried and succeeds"; fi

# 5. A binary that answers the wrong version is not trusted.
mk_release "$T/rel2" 2000.01.01
H="$T/home3"
if YTDLP_HOME="$H" YTDLP_PIN_VERSION=2099.01.01 YTDLP_PIN_SHA256="$(sha "$T/rel2/yt-dlp_linux")" \
   YTDLP_PIN_URL="file://$T/rel2/yt-dlp_linux" sh "$HERE/install.sh" >/dev/null 2>&1; then
  bad "a binary answering another version is refused"
else ok "a binary answering another version is refused"; fi

# 6. The committed pin is the real release's (shape check; CI does not download).
if grep -Eq 'YTDLP_PIN_SHA256:-[0-9a-f]{64}\}' "$HERE/install.sh" && grep -Eq 'YTDLP_PIN_VERSION:-20[0-9]{2}\.[0-9]{2}\.[0-9]{2}\}' "$HERE/install.sh"; then
  ok "the committed pin is a version and a full sha256"
else bad "the committed pin is a version and a full sha256"; fi

echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
