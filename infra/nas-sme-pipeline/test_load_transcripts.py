#!/usr/bin/env python3
# Proven-to-catch tests for load-transcripts.py's caption-grace classification.
# The bug this guards (Darrell 2026-07-06): a video uploaded hours ago has no
# auto-captions YET (YouTube takes a couple days to generate them), and the loader
# used to record that as a DURABLE no-caption verdict -> the fresh sermon would be
# skipped forever and never pick up its captions. The fix age-gates the verdict:
# a "no captions" result on a recent upload is transient (retry), only an OLD
# video's missing captions become a durable verdict. If within_caption_grace ever
# regresses (e.g. stops treating a day-old upload as recent), these fail.
#
# Pure functions only -- imported without youtube_transcript_api (which the loader
# imports lazily inside main()). Run: python3 -m unittest infra.nas-sme-pipeline...
# or, from this dir: python3 -m unittest test_load_transcripts
import calendar
import importlib.util
import os
import time
import unittest

from datetime import date

_HERE = os.path.dirname(os.path.abspath(__file__))


def _load(modname, filename):
    spec = importlib.util.spec_from_file_location(modname, os.path.join(_HERE, filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)  # top-level imports are stdlib only (deps are lazy)
    return mod


lt = _load("load_transcripts", "load-transcripts.py")
ci = _load("transcript_backfill_ci", "transcript-backfill-ci.py")

NOW = calendar.timegm(time.strptime("2026-07-06", "%Y-%m-%d"))  # fixed clock (epoch)


class CaptionGraceTest(unittest.TestCase):
    def test_fresh_upload_is_within_grace(self):
        # The exact scenario: "Celebrate!" uploaded ~12h ago -> still processing.
        self.assertTrue(lt.within_caption_grace("2026-07-06", now_ms=NOW, grace_days=4))
        self.assertTrue(lt.within_caption_grace("2026-07-05", now_ms=NOW, grace_days=4))
        self.assertTrue(lt.within_caption_grace("2026-07-03", now_ms=NOW, grace_days=4))

    def test_old_upload_is_outside_grace(self):
        # Old enough that missing captions are a real verdict -> Whisper fallback.
        self.assertFalse(lt.within_caption_grace("2026-06-01", now_ms=NOW, grace_days=4))
        self.assertFalse(lt.within_caption_grace("2026-07-01", now_ms=NOW, grace_days=4))  # 5 days

    def test_boundary_is_exclusive(self):
        # Exactly grace_days old is NOT within grace (>= window -> verdict stands).
        self.assertFalse(lt.within_caption_grace("2026-07-02", now_ms=NOW, grace_days=4))

    def test_unknown_date_is_conservatively_durable(self):
        # No/garbage date -> treat as old so a genuinely caption-less video is not
        # retried forever.
        self.assertFalse(lt.within_caption_grace(None, now_ms=NOW))
        self.assertFalse(lt.within_caption_grace("", now_ms=NOW))
        self.assertFalse(lt.within_caption_grace("not-a-date", now_ms=NOW))

    def test_grace_window_is_configurable(self):
        # A wider window keeps a 5-day-old upload transient (long-video ASR lag).
        self.assertTrue(lt.within_caption_grace("2026-07-01", now_ms=NOW, grace_days=7))


class CiVariantCaptionGraceTest(unittest.TestCase):
    # transcript-backfill-ci.py mirrors load-transcripts.py; its date-based
    # within_caption_grace must classify the same way so both fetch paths agree.
    TODAY = date(2026, 7, 6)

    def test_fresh_upload_is_within_grace(self):
        self.assertTrue(ci.within_caption_grace("2026-07-06", today=self.TODAY, grace_days=4))
        self.assertTrue(ci.within_caption_grace(date(2026, 7, 5), today=self.TODAY, grace_days=4))

    def test_old_upload_is_outside_grace(self):
        self.assertFalse(ci.within_caption_grace("2026-07-01", today=self.TODAY, grace_days=4))

    def test_boundary_is_exclusive(self):
        self.assertFalse(ci.within_caption_grace("2026-07-02", today=self.TODAY, grace_days=4))

    def test_unknown_date_is_conservatively_durable(self):
        self.assertFalse(ci.within_caption_grace(None, today=self.TODAY))
        self.assertFalse(ci.within_caption_grace("not-a-date", today=self.TODAY))


class VerdictClassifyTest(unittest.TestCase):
    def test_no_caption_errors_are_verdicts(self):
        self.assertTrue(lt.is_verdict("TranscriptsDisabled: Subtitles are disabled"))
        self.assertTrue(lt.is_verdict("NoTranscriptFound: empty caption track"))

    def test_ip_block_is_never_a_verdict(self):
        # The other half of DR-0076: an environmental block is not a fact about
        # the video, so it must never be persisted as a verdict.
        self.assertFalse(lt.is_verdict("RequestBlocked: YouTube is blocking this IP"))
        self.assertFalse(lt.is_verdict("IpBlocked: ..."))


if __name__ == "__main__":
    unittest.main()
