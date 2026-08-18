#!/usr/bin/env python3
# =============================================================================
# nas-announce / announce_server — sovereign incident push (DR-0156, DR-0218)
# =============================================================================
# Deterministic stdlib Python server on the family NAS that pushes an incident
# to the family's phones through the sovereign ntfy container. It REPLACES the
# n8n workflow wf-ops-announce, which was deleted with every other n8n artifact
# on 2026-08-16 (DR-0218 zero-n8n) — same DR-0083 lane as photo_server and
# review_server: "plain Python on the NAS that just runs."
#
# WHY THIS EXISTS RIGHT NOW. site-health.yml measured Supabase at HTTP 402 and
# filed the incident correctly on the GitHub ledger — then the phone push failed:
#
#     {"code":404,"message":"The requested webhook \"POST ops-announce\"
#      is not registered."}
#
# So the bell had not rung for the whole outage. The GitHub issue is the record
# and the Actions list goes red, but Darrell was not being told. Re-registering
# the n8n workflow would have re-armed a transport the house had just removed;
# this endpoint is the sovereign replacement, and it self-deploys through the
# services-sync manifest (adding it + merging IS the deploy — DR-0236), so it
# needs no hand on the box.
#
#   POST /ops-announce   Authorization: Bearer <token>
#        { title, message, url, priority } -> { ok, delivered, detail }
#   GET  /healthz -> { ok: true }   (no auth; liveness only)
#
# The path is matched by SUFFIX so it works whether the fronting proxy strips
# its mount prefix or not. Binds 127.0.0.1 by default: reachable only via the
# local reverse proxy that fronts the same-origin route.
#
# BYTE-FAITHFUL PORT of the workflow's validation, because these caps are the
# security model and not decoration:
#   * TOPIC IS PINNED server-side ('darrell'). A caller supplies title/message/
#     url/priority and NOTHING else, so a leaked bearer can only ever ring the
#     family's own bell — never spray arbitrary ntfy topics.
#   * title: newlines stripped (they would forge header lines), capped 120.
#   * message: capped 900.
#   * url: accepted ONLY when it matches https://github.com/ or
#     https://poetech.us/ — an unvalidated x-click is a phishing tap-through
#     on the family's lock screen. Capped 500.
#   * priority: must be one of 1..5, else 4.
#
# FAIL-SOFT BY DESIGN (both sides). The GitHub issue is the RECORD; this is the
# announcement. A push failure returns ok:true with delivered:false and a
# reason, so a dead bell never turns a passing probe into a failing one — and
# never hides WHY it was dead either (DR-0310: unknown is a third state, and it
# is reported, not swallowed).
#
# MODES:
#   announce_server.py --serve [--host 127.0.0.1] [--port 8796]
#   announce_server.py --selftest      # offline logic checks; no NAS, no network
# =============================================================================
import argparse
import hmac
import json
import os
import re
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TOPIC = 'darrell'                       # PINNED. Never taken from the request.
NTFY_URL = os.environ.get('NTFY_URL', 'http://ntfy:80') + '/' + TOPIC
TOKEN_FILE = os.environ.get('ANNOUNCE_TOKEN_FILE', '/volume1/poetech/.announce-token')
CLICK_OK = re.compile(r'^https://(github\.com|poetech\.us)/')


def load_token():
    """Bearer from env or the token file. Empty means fail-closed."""
    tok = (os.environ.get('ANNOUNCE_TOKEN') or '').strip()
    if tok:
        return tok
    try:
        with open(TOKEN_FILE, 'r', encoding='utf-8') as fh:
            return fh.read().strip()
    except OSError:
        return ''


def sanitize(body):
    """
    Validate + cap the caller-supplied fields. Pure, so the selftest can prove
    every cap without a network or a NAS.
    """
    b = body if isinstance(body, dict) else {}
    title = str(b.get('title') or 'PoeTech ops')
    title = re.sub(r'[\r\n]', ' ', title)[:120]
    message = str(b.get('message') or 'ops event')[:900]
    raw = str(b.get('url') or '')
    click = raw[:500] if CLICK_OK.match(raw) else ''
    pri = str(b.get('priority'))
    priority = pri if pri in ('1', '2', '3', '4', '5') else '4'
    return {'title': title, 'message': message, 'click': click, 'priority': priority}


def push(fields, opener=None):
    """
    Ring the bell. Returns (delivered, detail) and NEVER raises: the incident is
    already recorded on the GitHub ledger, so a dead bell must not error the
    caller. The reason is always returned rather than swallowed.
    """
    headers = {
        'x-title': fields['title'],
        'x-priority': fields['priority'],
        'x-tags': 'rotating_light',
    }
    if fields['click']:
        headers['x-click'] = fields['click']
    req = urllib.request.Request(
        NTFY_URL, data=fields['message'].encode('utf-8'), headers=headers, method='POST')
    try:
        send = opener or urllib.request.urlopen
        with send(req, timeout=10) as resp:
            code = getattr(resp, 'status', 200)
            if 200 <= code < 300:
                return True, ''
            return False, f'ntfy HTTP {code}'
    except (urllib.error.URLError, OSError, ValueError) as exc:
        return False, str(exc)[:200]


class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def log_message(self, *_a):          # quiet; the service log is the journal
        pass

    def _json(self, code, payload):
        raw = json.dumps(payload).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path.split('?')[0].endswith('/healthz'):
            return self._json(200, {'ok': True})
        return self._json(404, {'ok': False, 'error': 'not found'})

    def do_POST(self):
        if not self.path.split('?')[0].endswith('/ops-announce'):
            return self._json(404, {'ok': False, 'error': 'not found'})

        expected = load_token()
        got = (self.headers.get('Authorization') or '').removeprefix('Bearer ').strip()
        # Fail CLOSED: no configured token means nobody gets in.
        if not expected or not hmac.compare_digest(got, expected):
            return self._json(401, {'ok': False, 'error': 'unauthorized'})

        try:
            n = int(self.headers.get('Content-Length') or 0)
            body = json.loads(self.rfile.read(min(n, 64_000)) or b'{}')
        except (ValueError, OSError):
            return self._json(400, {'ok': False, 'error': 'bad json'})

        delivered, detail = push(sanitize(body))
        return self._json(200, {'ok': True, 'delivered': delivered, 'detail': detail})


def selftest():
    fails = 0

    def check(name, ok, detail=''):
        nonlocal fails
        if not ok:
            fails += 1
        print(f"{'PASS' if ok else 'FAIL'}  {name}{f' — {detail}' if detail else ''}")

    s = sanitize({'title': 'a' * 300, 'message': 'b' * 2000})
    check('title capped at 120', len(s['title']) == 120, str(len(s['title'])))
    check('message capped at 900', len(s['message']) == 900, str(len(s['message'])))

    s = sanitize({'title': 'line one\r\nX-Injected: evil'})
    check('newlines stripped from title (header injection)', '\n' not in s['title'] and '\r' not in s['title'])

    check('github link accepted', sanitize({'url': 'https://github.com/x/y'})['click'].startswith('https://github.com/'))
    check('poetech link accepted', sanitize({'url': 'https://poetech.us/z'})['click'].startswith('https://poetech.us/'))
    check('foreign link REJECTED', sanitize({'url': 'https://evil.example/x'})['click'] == '')
    check('http (non-TLS) github REJECTED', sanitize({'url': 'http://github.com/x'})['click'] == '')
    check('lookalike host REJECTED', sanitize({'url': 'https://github.com.evil.example/x'})['click'] == '')

    check('priority passthrough', sanitize({'priority': 5})['priority'] == '5')
    check('bad priority falls back to 4', sanitize({'priority': 'urgent'})['priority'] == '4')

    check('topic is pinned, not caller-supplied', NTFY_URL.endswith('/' + TOPIC) and 'topic' not in sanitize({'topic': 'other'}))

    # A dead bell reports the reason and never raises.
    def boom(*_a, **_k):
        raise urllib.error.URLError('connection refused')
    delivered, detail = push(sanitize({'message': 'x'}), opener=boom)
    check('a dead bell is fail-soft AND says why', delivered is False and 'refused' in detail, detail)

    print(f"\n{'SELFTEST OK' if fails == 0 else 'SELFTEST FAILED'} — {fails} failure(s)")
    return 0 if fails == 0 else 1


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--serve', action='store_true')
    ap.add_argument('--selftest', action='store_true')
    ap.add_argument('--host', default='127.0.0.1')
    ap.add_argument('--port', type=int, default=8796)
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if a.serve:
        ThreadingHTTPServer((a.host, a.port), Handler).serve_forever()
        return 0
    ap.print_help()
    return 2


if __name__ == '__main__':
    sys.exit(main())
