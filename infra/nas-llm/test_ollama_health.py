#!/usr/bin/env python3
"""
Proven-to-catch unit tests for ollama_health.build_health / is_pinned -- the
sovereign replacement for the wf-llm-health Code node (DR-0218 / DR-0076). These
mirror the JS normalizeLlmHealth fixtures (app/src/__tests__/llm-health.test.js)
so BOTH sides of the same envelope are gated. Pure + stdlib-only; runs in CI.

  cd infra/nas-llm && python3 -m unittest test_ollama_health -v
"""
import unittest
from datetime import datetime, timezone

from ollama_health import build_health, chat_gate, is_pinned

NOW = datetime(2026, 6, 15, 19, 0, 0, tzinfo=timezone.utc)


class IsPinned(unittest.TestCase):
    def test_far_future_expiry_is_pinned(self):
        # the keep_alive=-1 runaway signature
        self.assertTrue(is_pinned("2999-01-01T00:00:00Z", NOW))

    def test_near_expiry_is_not_pinned(self):
        # a normal keep_alive, an hour out
        self.assertFalse(is_pinned("2026-06-15T20:00:00Z", NOW))

    def test_missing_expiry_present_flag_is_pinned(self):
        # loaded but no readable expiry -> surfaced for a look (honest worst case)
        self.assertTrue(is_pinned("not-a-date", NOW))

    def test_empty_expiry_is_not_pinned(self):
        self.assertFalse(is_pinned("", NOW))
        self.assertFalse(is_pinned(None, NOW))


class BuildHealth(unittest.TestCase):
    def test_idle_box(self):
        env = build_health(
            {"models": []},
            {"models": [
                {"name": "qwen2.5:14b-instruct-q4_K_M", "size": 8988124069},
                {"name": "deepseek-r1:8b", "size": 5225376047},
            ]},
            "0.24.0",
            now=NOW,
        )
        self.assertTrue(env["ok"])
        self.assertEqual(env["version"], "0.24.0")
        self.assertEqual(env["loaded_count"], 0)
        self.assertEqual(env["installed_count"], 2)
        self.assertFalse(env["any_pinned"])
        self.assertEqual(env["generated_at"], "2026-06-15T19:00:00Z")

    def test_pinned_model_surfaces(self):
        env = build_health(
            {"models": [
                {"name": "qwen2.5:14b", "size_vram": 9000000000, "expires_at": "2999-01-01T00:00:00Z"},
                {"name": "deepseek-r1:8b", "size_vram": 5000000000, "expires_at": "2026-06-15T20:00:00Z"},
            ]},
            {"models": []},
            "0.24.0",
            now=NOW,
        )
        self.assertEqual(env["loaded_count"], 2)
        self.assertTrue(env["loaded"][0]["pinned"])
        self.assertEqual(env["loaded"][0]["size_vram"], 9000000000)
        self.assertFalse(env["loaded"][1]["pinned"])
        self.assertTrue(env["any_pinned"])

    def test_tolerates_garbage_members(self):
        env = build_health(
            {"models": [None, "nope", {"name": "ok"}]},
            {"models": [None, {"size": 5}]},  # nameless -> "(unnamed)"
            None,
            now=NOW,
        )
        self.assertEqual(env["loaded_count"], 1)
        self.assertEqual(env["installed_count"], 1)
        self.assertIsNone(env["version"])
        self.assertEqual(env["installed"][0]["name"], "(unnamed)")


class TheDoorIsLockedByTheFamilyKey(unittest.TestCase):
    """DR-1649: /llm is on the public Funnel. No key set must refuse everyone."""

    def test_no_key_set_answers_nobody(self):
        for sent in ("", "Bearer ", "Bearer anything"):
            code, error, reason = chat_gate("", sent)
            self.assertEqual((code, error), (503, "not-configured"))
            self.assertTrue(reason)

    def test_the_right_key_opens_it(self):
        self.assertIsNone(chat_gate("k3y", "Bearer k3y"))

    def test_a_wrong_or_missing_key_is_refused_with_a_reason(self):
        for sent in ("", None, "Bearer nope", "k3y", "bearer k3y"):
            code, error, reason = chat_gate("k3y", sent)
            self.assertEqual((code, error), (401, "unauthorized"))
            self.assertTrue(reason)


if __name__ == "__main__":
    unittest.main()
