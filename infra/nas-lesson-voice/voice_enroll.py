#!/usr/bin/env python3
"""
voice_enroll.py -- a person adds their own voice, with their own consent, and
can take it back (DR-0720).

Darrell, 2026-10-01: "can we somehow validate people using only their voice so
we can tag people who are speaking when we record?" and "Can you get my voice
the same way?"

THE ROAD (no inbound door anywhere; the NAS polls outbound, DR-0132):
  1. In the app ("Add my voice", My profile) a signed-in person reads what is
     kept and why, and taps to agree: give_voice_consent() writes their own
     voice_enrollments row with the time (migration 0244).
  2. They read Psalm 23 (KJV) aloud for about 25 seconds. The app uploads the
     sample to their OWN folder of the private lesson-audio bucket (0229) and
     calls send_voice_sample(), which refuses without that consent row.
  3. Each services-sync cycle this script, on the NAS:
       a. RECONCILES first: every voiceprint a person added is deleted the
          moment their consent row is gone (Remove my voice) or names another
          label, and a word-attributed label (BG, DP) that its owner removed is
          marked withdrawn, so enroll.json never re-creates it;
       b. ENROLLS each waiting sample: downloads it, deletes the waiting copy,
          measures it on the NAS CPU (diarize_local.py), and keeps ONE
          voiceprint for the person only when the sample is long enough and
          carries one voice; otherwise it says why. The sample audio is
          deleted unless the person chose to keep it.
       c. writes the result back to their row ("Your voice is added", or why
          not), which the app reads.
  4. The transcriber names a voice only from a print that still has its
     owner's consent at the moment it is used (consented_prints), so a removed
     voice is never named again, even before the reconcile runs.

Only the voiceprint (a list of numbers) is kept, and only on the NAS. It is
never written to the database, never sent anywhere.

BRAKES (DR-0248): budget MAX_SAMPLES per pass and the caller's timeout;
lock = a single-flight lock file; stop-paths = LESSON_VOICE_SELF_ENROLL=0 or
LESSON_VOICE_SPEAKERS=0 in lesson-voice.env stop new enrollments. Removal is
never stopped: taking a voice back always works.
"""
import json
import os
import re
import sys
import time
import urllib.parse

import speaker_turns as st

DATA = os.environ.get("LESSON_VOICE_DATA", "/volume1/PoeTech/lesson-voice")
TABLE = "voice_enrollments"
# The voices named from words a person who was there attributed (DR-0712).
# They are the ONLY prints with no consent row behind them.
WORD_LABELS = ("BG", "DP")
MIN_SPEECH_SECONDS = float(os.environ.get("VOICE_ENROLL_MIN_SECONDS", "15"))
OTHER_VOICE_SECONDS = 3.0
MAX_SAMPLES = 3
LOCK_MAX_AGE_SECONDS = 900
LABEL_RE = re.compile(r"^[A-Z]{2,3}$")


# --- which prints may name a voice ----------------------------------------------

def consent_index(rows):
    """{user_id: row} of the rows that stand behind a print: enrolled, with a
    label. A missing or half-written row stands behind nothing."""
    out = {}
    for r in rows or []:
        uid = r.get("user_id")
        if uid and r.get("enrolled_at") and LABEL_RE.match(r.get("label") or ""):
            out[uid] = r
    return out


def consented_prints(records, rows):
    """({label: vector}, {label: name}) the transcriber may use. A print a
    person added (it carries their user_id) counts only while their consent
    row says enrolled under the SAME label. A word-attributed print (no
    user_id) counts only for BG and DP. Everything else is left out."""
    ok = consent_index(rows)
    prints, names = {}, {}
    for label, rec in (records or {}).items():
        uid = rec.get("user_id") or ""
        if uid:
            row = ok.get(uid)
            if not row or row.get("label") != label:
                continue
            names[label] = rec.get("name") or row.get("display_name") or ""
        elif label not in WORD_LABELS:
            continue
        prints[label] = rec["vector"]
    return prints, names


# --- is this sample one person, long enough? --------------------------------------

def check_sample(diarized, others=None, min_seconds=None, threshold=None):
    """(vector, '') for a good sample, or (None, why). Pure.
    `others` = {label: vector} of the prints that belong to someone else: a
    sample that matches one of them is refused, one voice to one print."""
    min_seconds = MIN_SPEECH_SECONDS if min_seconds is None else min_seconds
    threshold = st.MATCH_THRESHOLD if threshold is None else threshold
    per = {}
    for t in (diarized or {}).get("turns") or []:
        per[t["speaker"]] = per.get(t["speaker"], 0.0) + float(t["end"]) - float(t["start"])
    if not per:
        return None, "No voice was heard in the recording. Record again in a quiet room, close to the phone."
    main = max(per, key=per.get)
    spoke = per[main]
    if spoke < min_seconds:
        return None, (f"The recording was too short: {spoke:.0f} seconds of speaking were heard, and "
                      f"{min_seconds:.0f} are needed. Read the whole psalm aloud, at an even pace.")
    cents = (diarized or {}).get("centroids") or {}
    vec = cents.get(main)
    if not vec:
        return None, "The voice could not be measured. Record again in a quiet room."
    for spk, secs in per.items():
        if spk == main or secs < OTHER_VOICE_SECONDS:
            continue
        other = cents.get(spk)
        if not other or st.cosine(vec, other) < threshold:
            return None, (f"More than one voice was heard ({secs:.0f} seconds of another voice). "
                          "Record again alone, so the signature is yours only.")
    for label, pv in (others or {}).items():
        if st.cosine(vec, pv) >= threshold:
            return None, (f"This voice already matches the voice added as {label}. "
                          "One voice has one signature; nothing was added.")
    return vec, ""


# --- remove what has no consent behind it -----------------------------------------

def withdrawn_path(data_dir):
    return os.path.join(data_dir, "voiceprints", "withdrawn.json")


def read_withdrawn(data_dir):
    try:
        with open(withdrawn_path(data_dir), encoding="utf-8") as f:
            return [str(x) for x in json.load(f) if LABEL_RE.match(str(x))]
    except (OSError, ValueError, TypeError):
        return []


def write_withdrawn(data_dir, labels):
    os.makedirs(os.path.dirname(withdrawn_path(data_dir)), exist_ok=True)
    with open(withdrawn_path(data_dir), "w", encoding="utf-8") as f:
        json.dump(sorted(set(labels)), f)


def samples_dir(data_dir):
    return os.path.join(data_dir, "enroll-samples")


def reconcile(data_dir, rows):
    """Delete every print a person added whose consent is gone or names
    another label, and any sample kept for a person with no consent row.
    A removed BG or DP is marked withdrawn so enroll.json never re-creates it
    from the old recording; a fresh self-enrollment of that label clears it.
    Returns the labels removed. Call it ONLY with a successful read of the
    rows: an empty list from a failed read would remove everyone."""
    ok = consent_index(rows)
    present = {r.get("user_id") for r in rows or [] if r.get("user_id")}
    removed = []
    withdrawn = set(read_withdrawn(data_dir))
    for label, rec in st.load_voiceprint_records(data_dir).items():
        uid = rec.get("user_id") or ""
        if not uid:
            continue
        row = ok.get(uid)
        if row and row.get("label") == label:
            continue
        try:
            os.remove(os.path.join(data_dir, "voiceprints", label + ".json"))
            removed.append(label)
        except OSError:
            continue
        if label in WORD_LABELS:
            withdrawn.add(label)
    d = samples_dir(data_dir)
    try:
        kept = os.listdir(d)
    except OSError:
        kept = []
    for uid in kept:
        if uid not in present:
            folder = os.path.join(d, uid)
            for n in os.listdir(folder) if os.path.isdir(folder) else []:
                try:
                    os.remove(os.path.join(folder, n))
                except OSError:
                    pass
            try:
                os.rmdir(folder)
            except OSError:
                pass
    if removed or withdrawn != set(read_withdrawn(data_dir)):
        write_withdrawn(data_dir, withdrawn)
    return removed


# --- one pass -----------------------------------------------------------------------

def acquire_lock(data_dir, now=None):
    now = now if now is not None else time.time()
    os.makedirs(data_dir, exist_ok=True)
    p = os.path.join(data_dir, "voice-enroll.lock")
    if os.path.isfile(p):
        try:
            age = now - os.path.getmtime(p)
        except OSError:
            age = 0
        if age <= LOCK_MAX_AGE_SECONDS:
            return False
        os.remove(p)
    with open(p, "w", encoding="utf-8") as f:
        f.write(str(os.getpid()))
    return True


def release_lock(data_dir):
    try:
        os.remove(os.path.join(data_dir, "voice-enroll.lock"))
    except OSError:
        pass


def enrolling_enabled(env=None):
    env = env if env is not None else os.environ
    return env.get("LESSON_VOICE_SELF_ENROLL", "1") != "0" and env.get("LESSON_VOICE_SPEAKERS", "1") != "0"


def sample_path_ok(row):
    """The sample must sit in the person's OWN folder (0229's access rule)."""
    p = row.get("sample_path") or ""
    uid = row.get("user_id") or ""
    return bool(uid) and p.startswith(uid + "/") and ".." not in p and "\\" not in p


def now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def run_once(io, data_dir=DATA, env=None, max_samples=MAX_SAMPLES):
    """io: list_rows(), update_row(user_id, patch), download(path) -> local,
    delete_audio(path), armed() -> bool, diarize(local) -> diarized."""
    report = {"removed": [], "enrolled": [], "refused": [], "waiting": [], "failed": []}
    if not acquire_lock(data_dir):
        report["skipped"] = "another pass holds the lock"
        return report
    try:
        try:
            rows = io.list_rows()
        except Exception as e:  # never reconcile from a failed read
            report["failed"].append({"read": str(e)[:200]})
            return report
        report["removed"] = reconcile(data_dir, rows)
        waiting = [r for r in rows if r.get("status") == "sample-sent" and r.get("sample_path")]
        if not waiting:
            return report
        if not enrolling_enabled(env) or not io.armed():
            why = "Waiting: the voice tools on our home server are not switched on yet. Your sample is kept until they are."
            for r in waiting:
                if r.get("reason") != why:
                    io.update_row(r["user_id"], {"reason": why})
                report["waiting"].append(r["user_id"])
            return report
        for r in waiting[:max_samples]:
            uid, path = r["user_id"], r["sample_path"]
            if not sample_path_ok(r):
                io.update_row(uid, {"status": "refused", "sample_path": None,
                                    "reason": "The sample was not in your own folder, so it was not used."})
                report["refused"].append(uid)
                continue
            local = None
            try:
                local = io.download(path)
                io.delete_audio(path)  # the waiting copy goes the moment the NAS has it
                diarized = io.diarize(local)
                records = st.load_voiceprint_records(data_dir)
                label = r["label"]
                others = {l: rec["vector"] for l, rec in records.items()
                          if l != label and (rec.get("user_id") or "") != uid}
                vec, why = check_sample(diarized, others)
                if vec is None:
                    io.update_row(uid, {"status": "refused", "reason": why, "sample_path": None, "updated_at": now_iso()})
                    report["refused"].append(uid)
                else:
                    st.save_voiceprint(data_dir, label, vec, source="self:" + path,
                                       name=r.get("display_name") or "", user_id=uid)
                    if label in WORD_LABELS:
                        write_withdrawn(data_dir, [x for x in read_withdrawn(data_dir) if x != label])
                    io.update_row(uid, {"status": "enrolled", "reason": None, "sample_path": None,
                                        "enrolled_at": now_iso(), "updated_at": now_iso()})
                    report["enrolled"].append(label)
                keep = bool(r.get("keep_sample")) and vec is not None
            except Exception as e:
                keep = False
                io.update_row(uid, {"status": "refused", "sample_path": None, "updated_at": now_iso(),
                                    "reason": "Our home server could not measure the sample (" + str(e)[:120] + "). Record again."})
                report["failed"].append({"user": uid, "error": str(e)[:200]})
            if local:
                if keep:
                    dest = os.path.join(samples_dir(data_dir), uid)
                    os.makedirs(dest, exist_ok=True)
                    os.replace(local, os.path.join(dest, os.path.basename(local)))
                else:
                    try:
                        os.remove(local)
                    except OSError:
                        pass
        return report
    finally:
        release_lock(data_dir)


# --- the live IO (the service role, outbound only) ----------------------------------

def make_io(url, key, data_dir=DATA, env=None):
    import lesson_voice_transcribe as lv

    class EnrollIO(lv.SupabaseIO):
        def list_rows(self):
            q = ("select=user_id,label,display_name,status,sample_path,keep_sample,enrolled_at,reason"
                 "&order=updated_at.asc&limit=500")
            return json.loads(self._req("GET", f"/rest/v1/{TABLE}?" + q).decode("utf-8"))

        def update_row(self, user_id, patch):
            self._req("PATCH", f"/rest/v1/{TABLE}?user_id=eq." + urllib.parse.quote(user_id),
                      json.dumps(patch).encode("utf-8"),
                      {"Content-Type": "application/json", "Prefer": "return=minimal"})

        def download(self, path):
            raw = self._req("GET", f"/storage/v1/object/{lv.BUCKET}/" + urllib.parse.quote(path), timeout=120)
            local = os.path.join(self.data_dir, "enroll-incoming", os.path.basename(path))
            os.makedirs(os.path.dirname(local), exist_ok=True)
            with open(local, "wb") as f:
                f.write(raw)
            return local

        def armed(self):
            return self.speakers_armed()

        def diarize(self, local):
            import diarize_local
            return diarize_local.diarize(local, self.data_dir)

    return EnrollIO(url, key, data_dir, env)


if __name__ == "__main__":
    import lesson_voice_transcribe as lv
    source, url, key = lv.load_live()
    if not (url and key):
        print(json.dumps({"ran": False, "stopped": "no Supabase credential on this NAS"}))
        sys.exit(0)
    out = run_once(make_io(url, key))
    with open(os.path.join(DATA, "voice-enroll-result.json"), "w", encoding="utf-8") as f:
        json.dump(out, f)
    print(json.dumps({"target": source, "voice_enroll": out}))
