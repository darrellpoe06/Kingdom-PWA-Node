#!/bin/sh
# funnel-watchdog.sh — thin shim to the sovereign-Python watchdog (the scribe
# pattern: .sh entry for the runner, logic in Python per the Ways / DR-0132;
# Darrell 2026-08-03: "python?").
# RECORDED-STATE: infra/nas-transport/RECORDED-STATE.md
# The Python program restores ONLY the sovereign recorded rows via
# `tailscale funnel --bg --set-path` (rule 1: FUNNEL never `serve`; full DSM
# binary path; the n8n root is never touched — DR-0218).
set -eu
REPO="${POETECH_REPO:-/volume1/PoeTech/repos/Kingdom-PWA-Node}"
exec python3 -u "$REPO/infra/nas-loops/loops/funnel_watchdog.py"
