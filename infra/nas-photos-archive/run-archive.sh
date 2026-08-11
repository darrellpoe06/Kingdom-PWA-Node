#!/bin/sh
# =============================================================================
# run-archive.sh - one command on the NAS: archive whatever Takeout landed,
# then print the GO / NO-GO deletion gate. DR-0291 / DR-0238.
# =============================================================================
# WHY: the pass was five commands with two long paths each, typed on a phone
# over ConnectBot. That is where a tired hand makes the mistake that deletes
# from Google against an archive that never verified. This is one line.
#
#   bash /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-photos-archive/run-archive.sh
#
# It finds the repo wherever it lives, archives Photos and Mail if their
# takeout folders have anything in them, and ends with the gate. Skips a kind
# with nothing landed. Safe to re-run: both archivers are idempotent.
#
# POSIX sh (DSM's default shell), no bashisms, no network calls.
# =============================================================================

set -u

PHOTOS_ROOT="/volume1/PoeTech/photos-archive"
MAIL_ROOT="/volume1/PoeTech/mail-archive"

# Find the repo without assuming a path that may have moved.
REPO=""
for candidate in \
    /volume1/PoeTech/repos/Kingdom-PWA-Node \
    /volume1/PoeTech/Kingdom-PWA-Node \
    /volume1/repos/Kingdom-PWA-Node
do
    if [ -f "$candidate/infra/nas-photos-archive/photos_archive.py" ]; then
        REPO="$candidate"
        break
    fi
done
if [ -z "$REPO" ]; then
    found=$(find /volume1 -maxdepth 5 -name photos_archive.py -type f 2>/dev/null | head -1)
    if [ -n "$found" ]; then
        REPO=$(dirname "$(dirname "$(dirname "$found")")")
    fi
fi
if [ -z "$REPO" ]; then
    echo "ERROR: could not find the repo on this NAS."
    echo "Look for it with: find /volume1 -maxdepth 6 -name photos_archive.py 2>/dev/null"
    exit 1
fi

PHOTOS_TOOL="$REPO/infra/nas-photos-archive/photos_archive.py"
MAIL_TOOL="$REPO/infra/nas-mail-archive/mail_archive.py"

echo "repo: $REPO"
echo ""

# --- prove the tools on this box before touching real data (DR-0076) --------
echo "=== selftest: photos ==="
python3 "$PHOTOS_TOOL" --selftest || exit 1
echo ""
if [ -f "$MAIL_TOOL" ]; then
    echo "=== selftest: mail ==="
    python3 "$MAIL_TOOL" --selftest || exit 1
    echo ""
fi

# --- photos ----------------------------------------------------------------
photos_ran=0
if [ -d "$PHOTOS_ROOT/takeout" ] && [ -n "$(ls -A "$PHOTOS_ROOT/takeout" 2>/dev/null)" ]; then
    echo "=== archiving Photos from $PHOTOS_ROOT/takeout ==="
    mkdir -p "$PHOTOS_ROOT"
    python3 "$PHOTOS_TOOL" --source "$PHOTOS_ROOT/takeout" --out "$PHOTOS_ROOT" --max-seconds 43200
    photos_ran=1
    echo ""
else
    echo "SKIP Photos: nothing in $PHOTOS_ROOT/takeout yet."
    echo ""
fi

# --- mail ------------------------------------------------------------------
if [ -f "$MAIL_TOOL" ] && [ -d "$MAIL_ROOT/takeout" ]; then
    mbox=$(find "$MAIL_ROOT/takeout" -name '*.mbox' -type f 2>/dev/null | head -1)
    if [ -n "$mbox" ]; then
        echo "=== archiving Mail from $mbox ==="
        python3 "$MAIL_TOOL" --mbox "$mbox" --out "$MAIL_ROOT" --extract-attachments --max-seconds 7200
        echo ""
    else
        zipcount=$(ls -A "$MAIL_ROOT/takeout" 2>/dev/null | wc -l)
        if [ "$zipcount" -gt 0 ]; then
            echo "Mail zips are present but not extracted yet. Extract them first:"
            echo "  cd $MAIL_ROOT/takeout"
            echo "  7z x -y 'takeout-*.zip'"
            echo "(or extract by tap in File Station), then re-run this script."
            echo ""
        fi
    fi
fi

# --- THE GATE --------------------------------------------------------------
if [ "$photos_ran" -eq 1 ]; then
    echo "=============================================================="
    echo " THE DELETION GATE - nothing leaves Google until this says GO"
    echo "=============================================================="
    python3 "$PHOTOS_TOOL" --out "$PHOTOS_ROOT" --verify
    gate=$?
    echo ""
    if [ "$gate" -eq 0 ]; then
        echo "Archive is whole. Deleting from Google Photos is now safe."
        echo "Before you delete, spot-check with your own eyes (DR-0076 7):"
        echo "  open $PHOTOS_ROOT/media/2015 and /2019 in File Station."
    else
        echo "DO NOT DELETE ANYTHING from Google Photos."
        echo "The lines above name what is missing or corrupt."
    fi
    exit $gate
fi

echo "Nothing archived this run. Land the Takeout zips, then run this again."
exit 0
