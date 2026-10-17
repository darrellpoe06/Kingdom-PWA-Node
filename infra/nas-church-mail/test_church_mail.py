#!/usr/bin/env python3
# test_church_mail.py -- the church mail reader's pure logic (DR-1091).
# Run: python3 -m unittest infra/nas-church-mail/test_church_mail.py
# PROVEN-TO-CATCH (DR-0076 3): path parity with the PC script is pinned to
# values produced by the JavaScript itself, a refill goes to the path the row
# already names, a present file is never re-uploaded, the budget stops the
# pass, and a message that keeps failing is set aside instead of looping.
import os
import sys
import unittest
from email.message import EmailMessage

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import church_mail as cm  # noqa: E402

# Produced by node with the PC scripts' own safe() (2026-10-17).
JS_SAFE = [
    ["<CAF+abc=12@mail.gmail.com>", "_CAF_abc_12_mail.gmail.com_"],
    ["06 JUNE 2026 CALENDAR.pdf", "06 JUNE 2026 CALENDAR.pdf"],
    ["Órden de Servicio 10-19-2026.docx", "_rden de Servicio 10-19-2026.docx"],
    ["praise \U0001F64C night.docx", "praise __ night.docx"],
    ["x" * 130 + ".pdf", "x" * 120],
    ["a/b\\c:d*e?.docx", "a_b_c_d_e_.docx"],
]


def mail(subject, attachments=(), message_id="<m1@mail>"):
    m = EmailMessage()
    m["Subject"] = subject
    m["From"] = cm.SENDER
    m["Message-ID"] = message_id
    m.set_content("see attached")
    for name, data in attachments:
        m.add_attachment(data, maintype="application", subtype="pdf", filename=name)
    return m.as_bytes()


class FakeBox:
    def __init__(self, msgs):
        self.msgs = msgs

    def uids(self):
        return list(self.msgs)

    def fetch(self, uid):
        v = self.msgs[uid]
        if isinstance(v, Exception):
            raise v
        return v


class FakeServer:
    def __init__(self, rows=None, objects=(), sermons=()):
        self.rows = dict(rows or {})
        self.objects = set(objects)
        self.sermons = list(sermons)
        self.uploads = []
        self.inserted = []

    def church_id(self):
        return "inst-1"

    def team_row(self, email_id):
        return self.rows.get(email_id)

    def sermon_urls(self):
        return self.sermons

    def present(self, bucket, path):
        return (bucket, path) in self.objects

    def upload(self, bucket, path, att):
        self.uploads.append((bucket, path, att["filename"]))
        self.objects.add((bucket, path))

    def insert_team(self, row):
        self.inserted.append(row)


class PureLogic(unittest.TestCase):
    def test_safe_matches_the_javascript(self):
        for src, want in JS_SAFE:
            self.assertEqual(cm.safe(src), want, src)

    def test_classify_and_dates_match_import_team(self):
        self.assertEqual(cm.classify("Order of Service 10-19-2026"), "order-of-service")
        self.assertEqual(cm.classify("Weekly Announcements"), "announcements")
        self.assertEqual(cm.classify("06 JUNE 2026 CALENDAR"), "calendar")
        self.assertIsNone(cm.classify("Choir rehearsal"))
        self.assertEqual(cm.parse_date("Order of Service 10-19-2026"), "2026-10-19")
        self.assertEqual(cm.parse_date("Order 1/5/26"), "2026-01-05")
        self.assertEqual(cm.parse_date("06 JUNE 2026 CALENDAR"), "2026-06-01")
        self.assertIsNone(cm.parse_date("13-40-2026 nothing"))

    def test_a_new_team_document_is_filed_at_the_scripts_path(self):
        p = cm.read_message(mail("06 JUNE 2026 CALENDAR", [("June Calendar.pdf", b"%PDF")], "<CAF+1@mail>"))
        plan = cm.team_plan(p, 7, "inst-1", None)
        self.assertEqual(plan["action"], "file")
        self.assertEqual(plan["path"], "inst-1/_CAF_1_mail_/June Calendar.pdf")
        self.assertEqual(plan["row"]["doc_type"], "calendar")
        self.assertEqual(plan["row"]["doc_date"], "2026-06-01")
        self.assertEqual(plan["row"]["email_id"], "<CAF+1@mail>")
        self.assertEqual(plan["row"]["document_source"], "email")

    def test_an_existing_row_is_checked_at_its_own_path(self):
        p = cm.read_message(mail("06 JUNE 2026 CALENDAR", [("June Calendar.pdf", b"%PDF")]))
        plan = cm.team_plan(p, 7, "inst-1", {"document_url": "inst-1/older/June Calendar.pdf"})
        self.assertEqual(plan["action"], "check")
        self.assertEqual(plan["path"], "inst-1/older/June Calendar.pdf")

    def test_not_a_team_document_is_skipped(self):
        p = cm.read_message(mail("Choir rehearsal moved", [("map.pdf", b"x")]))
        self.assertEqual(cm.team_plan(p, 1, "inst-1", None)["action"], "skip")
        p = cm.read_message(mail("Order of Service", []))
        self.assertEqual(cm.team_plan(p, 1, "inst-1", None)["action"], "skip")


class Passes(unittest.TestCase):
    def test_files_new_refills_missing_and_leaves_present_alone(self):
        box = FakeBox({
            1: mail("Order of Service 10-19-2026", [("OOS.pdf", b"1")], "<new@m>"),
            2: mail("06 JUNE 2026 CALENDAR", [("Cal.pdf", b"2")], "<old@m>"),
            3: mail("Weekly Announcements", [("Ann.pdf", b"3")], "<here@m>"),
        })
        server = FakeServer(
            rows={"<old@m>": {"document_url": "inst-1/_old_m_/Cal.pdf"},
                  "<here@m>": {"document_url": "inst-1/_here_m_/Ann.pdf"}},
            objects={(cm.TEAM_BUCKET, "inst-1/_here_m_/Ann.pdf")})
        state = cm.new_state(9)
        t = cm.run_pass(box, server, state, max_messages=25, max_seconds=60)
        self.assertEqual((t["filed"], t["refilled"], t["present"]), (1, 1, 1))
        self.assertEqual(server.uploads, [
            (cm.TEAM_BUCKET, "inst-1/_new_m_/OOS.pdf", "OOS.pdf"),
            (cm.TEAM_BUCKET, "inst-1/_old_m_/Cal.pdf", "Cal.pdf"),
        ])
        self.assertEqual(len(server.inserted), 1)
        self.assertEqual(state["last_uid"], 3)

    def test_a_sermon_file_is_refilled_at_its_rows_path(self):
        box = FakeBox({4: mail("PROCLAIM 10-12-2026", [("Sermon 10-12.docx", b"d")])})
        server = FakeServer(sermons=["inst-1/sermon-9/Sermon 10-12.docx", "inst-1/sermon-8/Other.docx"])
        t = cm.run_pass(box, server, cm.new_state(9), max_messages=25, max_seconds=60)
        self.assertEqual(t["refilled"], 1)
        self.assertIn((cm.SERMON_BUCKET, "inst-1/sermon-9/Sermon 10-12.docx", "Sermon 10-12.docx"), server.uploads)

    def test_dry_run_writes_nothing(self):
        box = FakeBox({1: mail("Order of Service 10-19-2026", [("OOS.pdf", b"1")], "<new@m>")})
        server = FakeServer()
        t = cm.run_pass(box, server, cm.new_state(9), max_messages=25, max_seconds=60, dry_run=True)
        self.assertEqual(t["filed"], 1)
        self.assertEqual((server.uploads, server.inserted), ([], []))

    def test_the_message_budget_stops_the_pass_and_resumes(self):
        box = FakeBox({u: mail("Weekly Announcements %d" % u, [("A%d.pdf" % u, b"x")], "<a%d@m>" % u) for u in range(1, 8)})
        server = FakeServer()
        state = cm.new_state(9)
        t = cm.run_pass(box, server, state, max_messages=3, max_seconds=60)
        self.assertEqual((t["seen"], t["budget"], state["last_uid"]), (3, "messages", 3))
        cm.run_pass(box, server, state, max_messages=3, max_seconds=60)
        self.assertEqual(state["last_uid"], 6)

    def test_the_time_budget_stops_the_pass(self):
        clock = iter([0, 0, 1000, 1000, 1000])
        box = FakeBox({u: mail("Weekly Announcements", [("A.pdf", b"x")], "<t%d@m>" % u) for u in (1, 2, 3)})
        t = cm.run_pass(box, FakeServer(), cm.new_state(9), max_messages=25, max_seconds=60, now=lambda: next(clock))
        self.assertEqual((t["seen"], t["budget"]), (1, "time"))

    def test_a_failing_message_is_retried_then_set_aside_never_looped(self):
        box = FakeBox({1: RuntimeError("boom"), 2: mail("Weekly Announcements", [("A.pdf", b"x")], "<ok@m>")})
        server = FakeServer()
        state = cm.new_state(9)
        for _ in range(cm.MAX_FAILS - 1):
            t = cm.run_pass(box, server, state, max_messages=25, max_seconds=60)
            self.assertEqual((t["failed"], state["last_uid"]), (1, 0))
        t = cm.run_pass(box, server, state, max_messages=25, max_seconds=60)
        self.assertEqual((t["set_aside"], t["filed"], state["last_uid"]), (1, 1, 2))
        self.assertIn("1", state["set_aside"])
        self.assertIn("boom", state["set_aside"]["1"])


if __name__ == "__main__":
    unittest.main()
