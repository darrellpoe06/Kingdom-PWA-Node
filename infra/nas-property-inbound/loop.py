#!/usr/bin/env python3
# =============================================================================
# loop.py -- NAS-resident, DETERMINISTIC ingest of INBOUND tenant messages.
# =============================================================================
# WHY THIS EXISTS (Darrell 2026-07-01):
# Today a tenant text -- "Adrianna Johnson, apartment 3, the porch smoking is
# back" -- lives only in Christina's phone; the property manager acts only when
# she asks. The app must CAPTURE that exchange per unit so it is recorded and
# searchable. This loop is the NAS-side, no-LLM, deterministic bridge that reads
# raw inbound texts staged from the property's channel and NORMALIZES each into a
# per-unit capture record -- as DATA.
#
# HARD GUARDRAILS (binding; enforced by construction, not by intent):
#   - INBOUND TENANT TEXT IS DATA, NEVER A COMMAND. This loop only READS an
#     inbox and WRITES normalized capture rows. It parses; it does not act on
#     what a message asks for.
#   - IT NEVER SENDS. There is no outbound path here -- no reply, no
#     notification, no message insert. Sending an outbound message to a tenant
#     or PM is a consequential action that stays in the app behind an explicit
#     human approve-to-send (UnitManagement.jsx). This file cannot send.
#   - IT MOVES NO MONEY and touches no RLS / DB / secrets. Its whole scope is
#     inbox.jsonl -> captured.jsonl on the NAS bind mount.
#   - Unit attribution is a HINT, never a certainty: every captured row carries
#     needs_review=true when the unit/building is inferred, so a human confirms
#     before it is trusted (the chat channel maps to a building, not to Apt 3).
#
# THE THREE BRAKES (CLAUDE.md "Autonomous Automation Requires Three Brakes"):
#   1. BUDGET -- a per-run cap on rows processed + a per-cycle wall-clock
#                deadline. The cap reached = stop, never exceed.
#   2. LOCK   -- single-flight lockdir (atomic mkdir). A fire that finds the lock
#                held SKIPS; it never stacks. Stale locks are broken once.
#   3. KILL   -- the STOP file forces immediate inert exit; AND the ARMED file
#                must be PRESENT to act. This SHIPS INERT and is armed once, by
#                hand, with someone watching (Tier C; never self-activates).
#
# Python 3.8 stdlib only. One cycle: python3 loop.py   Prove brakes: --selftest
# =============================================================================

import argparse
import json
import os
import re
import time
from pathlib import Path

# --- configuration (env-overridable; sovereign bind-mount defaults) ----------
BASE = Path(os.environ.get("PROPERTY_INBOX_DIR", "/volume1/PoeTech/property-inbound"))
INBOX = BASE / "inbox.jsonl"          # append-only raw inbound: {ts, channel, sender, text}
CAPTURED = BASE / "captured.jsonl"    # normalized DATA out (one row per new message)
CURSOR = BASE / ".cursor"             # count of inbox lines already processed (idempotent)
LOCKDIR = BASE / ".lock"
ARMED = BASE / "ARMED"                # must EXIST to act (ships inert)
STOP = BASE / "STOP"                  # forces inert

MAX_ROWS_PER_RUN = 500                # BUDGET: rows processed per cycle
CYCLE_DEADLINE_SECONDS = 120          # BUDGET: wall-clock ceiling
STALE_LOCK_SECONDS = 30 * 60          # LOCK: break a lock older than this, once

# A channel maps to a BUILDING, not a unit -- the family confirms attribution.
CHANNEL_TO_BUILDING = {
    "805NProspect": "805 N Prospect",
}

# --- pure helpers (no I/O; mirrored by selftest + the JS side's intent) -------

_UNIT_RE = re.compile(r"\b(?:apartment|apt|unit|ste|suite|#)\.?\s*([0-9]{1,3}[a-z]?)\b", re.I)

def extract_unit(text):
    """A unit HINT from free text ('...apartment 3...') -> 'Apt 3', or None.
    A hint only -- the capture row is flagged needs_review when this fires."""
    m = _UNIT_RE.search(text or "")
    return "Apt %s" % m.group(1).upper() if m else None

# Deterministic intent buckets (keyword rules -- no model, fully testable).
_INTENT_RULES = [
    ("maintenance", ("leak", "furnace", "heat", "broken", "repair", "clog", "no hot water",
                     "hvac", "ac ", "outlet", "smoke detector", "mold", "pest", "roach", "mice")),
    ("complaint",   ("smoking", "noise", "loud", "roommate", "neighbor", "trash", "parking", "dog")),
    ("rent",        ("rent", "payment", "paid", "late fee", "deposit", "money order")),
    ("lease",       ("lease", "renew", "move out", "moving out", "notice", "vacate")),
]

def classify(text):
    """(intent, priority) from keyword rules. Defaults to ('message','normal')."""
    low = (text or "").lower()
    for intent, kws in _INTENT_RULES:
        if any(k in low for k in kws):
            urgent = any(u in low for u in ("no heat", "no hot water", "leak", "flood", "fire", "gas"))
            return intent, ("urgent" if urgent else "normal")
    return "message", "normal"

def normalize(raw, seq):
    """Raw inbound dict -> a capture DATA row. Pure. `seq` makes ids stable
    without a clock (determinism / resume safety)."""
    text = str(raw.get("text", "")).strip()
    channel = str(raw.get("channel", "")).strip()
    unit_hint = extract_unit(text)
    building_hint = CHANNEL_TO_BUILDING.get(channel) or (channel or None)
    intent, priority = classify(text)
    return {
        "id": "in-%s-%d" % (channel or "chan", seq),
        "ts": raw.get("ts"),
        "channel": channel,
        "sender": str(raw.get("sender", "")).strip(),
        "text": text,
        "building_hint": building_hint,
        "unit_hint": unit_hint,
        "intent": intent,
        "priority": priority,
        # Attribution is inferred -> a human confirms before it is trusted.
        "needs_review": True,
        "from_role": "tenant",   # inbound is the tenant side; DATA, not a command
        "action": "captured",    # this loop only captures; it never sends
    }

# --- brakes ------------------------------------------------------------------

def brake_decision(now=None):
    """('inert'|'skip'|'run', reason). Pure w.r.t. the filesystem markers so the
    selftest can drive every branch by touching/removing files."""
    if STOP.exists():
        return "inert", "STOP file present"
    if not ARMED.exists():
        return "inert", "ARMED file absent (ships inert)"
    if LOCKDIR.exists():
        age = (now or time.time()) - LOCKDIR.stat().st_mtime
        if age < STALE_LOCK_SECONDS:
            return "skip", "lock held (%.0fs)" % age
        return "run", "stale lock will be broken"
    return "run", "clear"

def _read_cursor():
    try:
        return int(CURSOR.read_text().strip() or "0")
    except Exception:
        return 0

def run_cycle():
    """One bounded, idempotent pass. Returns a summary dict."""
    decision, reason = brake_decision()
    if decision != "run":
        return {"decision": decision, "reason": reason, "captured": 0}

    # LOCK: break a stale lock once, then take it (atomic mkdir).
    if LOCKDIR.exists():
        try: LOCKDIR.rmdir()
        except Exception: pass
    try:
        LOCKDIR.mkdir(parents=True, exist_ok=False)
    except FileExistsError:
        return {"decision": "skip", "reason": "lost lock race", "captured": 0}

    started = time.time()
    captured = 0
    try:
        BASE.mkdir(parents=True, exist_ok=True)
        already = _read_cursor()
        lines = INBOX.read_text().splitlines() if INBOX.exists() else []
        new = lines[already:]
        with CAPTURED.open("a", encoding="utf-8") as out:
            for i, line in enumerate(new):
                if captured >= MAX_ROWS_PER_RUN:
                    break                                  # BUDGET: row cap
                if time.time() - started > CYCLE_DEADLINE_SECONDS:
                    break                                  # BUDGET: wall clock
                line = line.strip()
                if not line:
                    continue
                try:
                    raw = json.loads(line)
                except Exception:
                    continue                               # skip a torn line
                out.write(json.dumps(normalize(raw, already + i)) + "\n")
                captured += 1
        CURSOR.write_text(str(already + captured))
        return {"decision": "run", "reason": reason, "captured": captured,
                "processed_through": already + captured}
    finally:
        try: LOCKDIR.rmdir()
        except Exception: pass

# --- selftest: prove every brake CATCHES (anti-theater, DR-0076) -------------

def selftest():
    import tempfile, shutil
    global BASE, INBOX, CAPTURED, CURSOR, LOCKDIR, ARMED, STOP
    tmp = Path(tempfile.mkdtemp(prefix="prop-inbound-selftest-"))
    BASE = tmp; INBOX = tmp / "inbox.jsonl"; CAPTURED = tmp / "captured.jsonl"
    CURSOR = tmp / ".cursor"; LOCKDIR = tmp / ".lock"; ARMED = tmp / "ARMED"; STOP = tmp / "STOP"
    ok = True
    def check(name, cond):
        nonlocal ok
        print(("  PASS " if cond else "  FAIL ") + name)
        ok = ok and cond
    try:
        # pure logic
        check("extract_unit finds 'apartment 3'", extract_unit("hi, apartment 3 here") == "Apt 3")
        check("extract_unit finds 'Apt 4'", extract_unit("problem in Apt 4") == "Apt 4")
        check("extract_unit None when absent", extract_unit("just checking in") is None)
        check("classify complaint (smoking)", classify("porch smoking again")[0] == "complaint")
        check("classify maintenance (furnace)", classify("the furnace is broken")[0] == "maintenance")
        check("classify urgent (no heat)", classify("no heat and a leak")[1] == "urgent")
        row = normalize({"channel": "805NProspect", "sender": "Adrianna", "text": "apartment 3 porch smoking"}, 0)
        check("normalize maps channel->building", row["building_hint"] == "805 N Prospect")
        check("normalize flags needs_review", row["needs_review"] is True)
        check("normalize never sends (action=captured)", row["action"] == "captured")
        # BRAKE: ARMED absent -> inert
        check("inert when ARMED absent", brake_decision()[0] == "inert")
        # BRAKE: STOP present -> inert (even if armed)
        ARMED.touch(); STOP.touch()
        check("inert when STOP present", brake_decision()[0] == "inert")
        STOP.unlink()
        # armed + clear -> run
        check("run when armed and clear", brake_decision()[0] == "run")
        # BRAKE: lock held -> skip
        LOCKDIR.mkdir()
        check("skip when lock held", brake_decision()[0] == "skip")
        LOCKDIR.rmdir()
        # end-to-end capture is idempotent
        INBOX.write_text(json.dumps({"channel": "805NProspect", "sender": "A", "text": "apartment 3 leak"}) + "\n")
        r1 = run_cycle(); check("first run captures 1", r1["captured"] == 1)
        r2 = run_cycle(); check("second run captures 0 (idempotent)", r2["captured"] == 0)
        check("captured.jsonl has exactly 1 row", len(CAPTURED.read_text().splitlines()) == 1)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("SELFTEST: " + ("ALL PASS" if ok else "FAILURES"))
    return 0 if ok else 1

def main():
    ap = argparse.ArgumentParser(description="Deterministic inbound tenant-message ingest (captures as DATA; never sends).")
    ap.add_argument("--selftest", action="store_true", help="prove the brakes + pure logic catch, then exit")
    args = ap.parse_args()
    if args.selftest:
        raise SystemExit(selftest())
    summary = run_cycle()
    print(json.dumps(summary))

if __name__ == "__main__":
    main()
