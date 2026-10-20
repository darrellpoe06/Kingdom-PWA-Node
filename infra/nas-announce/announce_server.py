#!/usr/bin/env python3
# =============================================================================
# nas-announce / announce_server — sovereign incident push (DR-0156, DR-0218)
# =============================================================================
# Deterministic stdlib Python server on the family NAS that pushes an incident
# to the family's phones through the sovereign ntfy container. It REPLACES the
# n8n workflow wf-ops-announce (DR-0218 zero-n8n) — same DR-0083 lane as
# photo_server and review_server: "plain Python on the NAS that just runs."
#
# CORRECTED 2026-10-15, on mining this file out of the stale #1255. Its header
# said wf-ops-announce "was deleted with every other n8n artifact on
# 2026-08-16". THAT IS NOT TRUE OF main: infra/n8n/wf-ops-announce.json is
# still on disk, and it is one of the legacy files business-systems-guard
# tolerates by allow-list. The n8n retirement happened broadly and this one
# artifact outlived it. The claim is removed rather than carried through,
# because a wrong fact in a header is how a future reader gets talked out of
# the thing the header is explaining (the same correction DR-1038 records).
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
# The relay runs on the HOST (poetech-announce.service), where Docker's
# `ntfy` name does not resolve: that name exists only inside the n8n compose
# network (infra/n8n/INSTALL.md item 9). ntfy is published on host port 8081
# (infra/n8n/docker-compose.yml), so the host address is the default (DR-1110).
NTFY_URL = os.environ.get('NTFY_URL', 'http://127.0.0.1:8081') + '/' + TOPIC
# CORRECTED 2026-10-15: this default was '/volume1/poetech/.announce-token',
# which is a path that does not exist. install.sh writes the token to
# /volume1/PoeTech/secrets/announce-token.txt -- capital PoeTech, under
# secrets/, matching every other installer on this NAS (nas-property-photos
# uses the identical /volume1/PoeTech/secrets/ directory). On the Synology
# volume those are two different directories, so the fallback was dead.
#
# It never fired in practice, because install.sh bakes the token into the unit
# as Environment=ANNOUNCE_TOKEN and load_token() prefers env. So this was
# latent, and it failed CLOSED (unreadable file -> '' -> every request 401),
# which is the safe direction -- but a fallback that can only ever fail is not
# a fallback, and the next person to run this by hand without the env var
# would have got a 401 with nothing explaining it.
TOKEN_FILE = os.environ.get('ANNOUNCE_TOKEN_FILE', '/volume1/PoeTech/secrets/announce-token.txt')
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


def ntfy_health(opener=None):
    """
    Is the sovereign ntfy container answering, from where this service runs?
    (ok, detail); never raises. The Way, step 5: the thing a service depends
    on is probed from the box before the door says it is well.
    """
    base = NTFY_URL.rsplit('/', 1)[0]
    req = urllib.request.Request(base + '/v1/health', method='GET')
    try:
        send = opener or urllib.request.urlopen
        with send(req, timeout=4) as resp:
            code = getattr(resp, 'status', 200)
            if 200 <= code < 300:
                return True, ''
            return False, f'ntfy HTTP {code}'
    except (urllib.error.URLError, OSError, ValueError) as exc:
        return False, str(exc)[:200]


def health_body(opener=None):
    """
    The open door's answer (status, payload). ok only when the token is set
    (an empty token refuses every ring) and ntfy answers; otherwise the
    reason in words. No path, no token: the Funnel makes this route public.
    """
    reasons = []
    if not load_token():
        reasons.append('no announce token is set on this box, so every ring is refused; the installer stamps it into the unit')
    up, detail = ntfy_health(opener)
    if not up:
        reasons.append(f'the ntfy container on the box is not answering its /v1/health ({detail}), so the bell cannot ring')
    if reasons:
        return 503, {'ok': False, 'reason': '; '.join(reasons)}
    return 200, {'ok': True, 'ntfy': 'up'}


MAX_BODY = 64_000


def read_body(headers, rfile):
    """The request body, read whole before the handler answers anything:
    bytes (possibly empty), or None when it is larger than a bell could be
    or cannot be read. Pure over its two arguments."""
    try:
        n = int(headers.get('Content-Length') or 0)
    except (TypeError, ValueError):
        return None
    if n < 0 or n > MAX_BODY:
        return None
    try:
        return rfile.read(n) if n else b''
    except OSError:
        return None


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
            code, payload = health_body()
            return self._json(code, payload)
        return self._json(404, {'ok': False, 'error': 'not found'})

    def do_POST(self):
        # THE BODY IS READ BEFORE ANY ANSWER, OR THE NEXT REQUEST READS IT
        # (measured 2026-10-20, announce-health run 39490048742). This handler
        # speaks HTTP/1.1, so the Funnel keeps the connection and sends the
        # next request down it. A refused call (wrong path, wrong bearer) used
        # to answer without ever reading its body, so the unread JSON stayed
        # in the stream and was parsed as the START of the next request --
        # which then got Python's own 400 page ("Bad request syntax"). That
        # is exactly site-health's shape: its probe POSTs keyless (401), then
        # its alarm rings on the same kept connection and is answered 400
        # with "<!DOCTYPE HTML PUBLIC" -- while a lone ring (run 39489289287)
        # was accepted. Read the body first, bounded; the checks come after.
        raw = read_body(self.headers, self.rfile)
        if raw is None:
            # Too big to be a bell, or unreadable: refuse and let this
            # connection go, so what was not read can never be misread.
            self.close_connection = True
            return self._json(413, {'ok': False, 'error': 'too large'})

        if not self.path.split('?')[0].endswith('/ops-announce'):
            return self._json(404, {'ok': False, 'error': 'not found'})

        expected = load_token()
        # THIS LINE WAS WHY THE BELL NEVER RANG, and it is measured, not guessed.
        #
        # It read `.removeprefix('Bearer ')`, which is Python 3.9+. It was the
        # ONLY 3.9+ call in the file, and it sat in do_POST — so on an older
        # interpreter do_GET answered /healthz perfectly while do_POST raised
        # AttributeError before writing any response, the connection dropped,
        # and Tailscale Funnel reported 502 to the caller.
        #
        # MEASURED 2026-10-15 in one site-health run, both codes side by side:
        #   GET  /announce/healthz      -> 200
        #   POST /announce/ops-announce -> 502
        # and ops-announce's own detector had already written "the announce
        # relay failed (HTTP 502)" onto #2057 at 15:48. Liveness said 200 over
        # the top of a dead alarm for the whole day. The service file runs bare
        # `/usr/bin/python3`, so the interpreter is whatever DSM ships.
        #
        # The replacement is EXACTLY equivalent, proven over 3,599 generated
        # and adversarial header shapes with zero divergences. That mattered:
        # the obvious rewrite (strip first, compare case-insensitively) WIDENED
        # the auth check — it accepted "bearer x" and "  Bearer x", which the
        # original rejects. This form changes no auth decision, only the Python
        # floor it needs: startswith + a slice works on 3.6+.
        _auth = self.headers.get('Authorization') or ''
        got = (_auth[7:] if _auth.startswith('Bearer ') else _auth).strip()
        # Fail CLOSED: no configured token means nobody gets in.
        if not expected or not hmac.compare_digest(got, expected):
            return self._json(401, {'ok': False, 'error': 'unauthorized'})

        try:
            body = json.loads(raw or b'{}')
        except ValueError:
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

    # ONE KEPT CONNECTION, A REFUSED RING, THEN A GOOD ONE (2026-10-20, run
    # 39490048742): the second must be answered as a ring, never as Python's
    # 400 page for a request that begins with the first ring's unread body.
    import http.client, socket, threading
    _tok = os.environ.get('ANNOUNCE_TOKEN'); os.environ['ANNOUNCE_TOKEN'] = 'selftest-token'
    srv = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        conn = http.client.HTTPConnection('127.0.0.1', srv.server_address[1], timeout=10)
        body = json.dumps({'title': 'selftest', 'message': 'x' * 300, 'priority': 2})
        conn.request('POST', '/announce/ops-announce', body=body, headers={'Authorization': 'Bearer wrong', 'Content-Type': 'application/json'})
        r1 = conn.getresponse(); b1 = r1.read()
        conn.request('POST', '/announce/ops-announce', body=body, headers={'Authorization': 'Bearer selftest-token', 'Content-Type': 'application/json'})
        r2 = conn.getresponse(); b2 = r2.read()
        check('a refused ring answers 401 as JSON', r1.status == 401 and b'unauthorized' in b1)
        check('CATCHES the unread body: the next ring on the SAME connection is answered as a ring (200 JSON), not a 400 page',
              r2.status == 200 and b2.startswith(b'{') and b'"ok": true' in b2)
        conn.request('POST', '/announce/elsewhere', body=body, headers={'Authorization': 'Bearer selftest-token'})
        r3 = conn.getresponse(); r3.read()
        conn.request('POST', '/announce/ops-announce', body=body, headers={'Authorization': 'Bearer selftest-token'})
        r4 = conn.getresponse(); b4 = r4.read()
        check('a wrong path (404) leaves the connection clean too', r3.status == 404 and r4.status == 200 and b4.startswith(b'{'))
        conn.close()
    finally:
        srv.shutdown(); srv.server_close()
        if _tok is None: os.environ.pop('ANNOUNCE_TOKEN', None)
        else: os.environ['ANNOUNCE_TOKEN'] = _tok
    class _H:
        def __init__(self, n): self.n = n
        def get(self, k): return self.n
    import io
    check('read_body reads exactly Content-Length and refuses a body too big to be a bell',
          read_body(_H('5'), io.BytesIO(b'hello!')) == b'hello' and read_body(_H('0'), io.BytesIO(b'')) == b''
          and read_body(_H(str(MAX_BODY + 1)), io.BytesIO(b'x')) is None and read_body(_H('nope'), io.BytesIO(b'')) is None)

    # THE DOOR SAYS WHY (the Way, step 5; 2026-10-20). A fake ntfy that answers
    # and one that does not; the token present and absent; no path and no
    # token in any reason.
    class _Resp:
        status = 200
        def __enter__(self): return self
        def __exit__(self, *a): return False
    def _up(req, timeout=0): return _Resp()
    def _down(req, timeout=0): raise urllib.error.URLError('connection refused')
    _tok = os.environ.get('ANNOUNCE_TOKEN'); os.environ['ANNOUNCE_TOKEN'] = 'selftest-token'
    code, body = health_body(opener=_up)
    check('healthz 200 with the token set and ntfy answering', code == 200 and body == {'ok': True, 'ntfy': 'up'})
    code, body = health_body(opener=_down)
    check('CATCHES ntfy down: healthz 503 with the reason in words', code == 503 and body['ok'] is False and 'not answering' in body['reason'])
    os.environ['ANNOUNCE_TOKEN'] = ''
    _tf = TOKEN_FILE; globals()['TOKEN_FILE'] = '/nonexistent/announce-token.txt'
    code, body = health_body(opener=_up)
    check('CATCHES no token: healthz 503 says every ring is refused', code == 503 and 'no announce token' in body['reason'])
    check('a reason never carries a path or a token', '/' not in body['reason'] and 'selftest-token' not in body['reason'])
    globals()['TOKEN_FILE'] = _tf
    if _tok is None: os.environ.pop('ANNOUNCE_TOKEN', None)
    else: os.environ['ANNOUNCE_TOKEN'] = _tok

    # THE BEARER PARSE, which is what actually broke the bell (2026-10-15).
    # do_POST's one 3.9+ call (`removeprefix`) raised on DSM's interpreter and
    # killed the handler before it could answer, so healthz read 200 while the
    # ring read 502 all day. These cases pin BOTH halves of the fix: the parse
    # still works, and it still refuses what it always refused -- the obvious
    # rewrite WIDENED the auth check by accepting 'bearer x' and '  Bearer x'.
    bearer = lambda v: (v[7:] if v.startswith('Bearer ') else v).strip()
    check('bearer parsed without removeprefix', bearer('Bearer abc123') == 'abc123')
    check('extra spaces inside are trimmed', bearer('Bearer   tok  ') == 'tok')
    check('a lowercase scheme is NOT accepted as a bearer', bearer('bearer abc123') == 'bearer abc123')
    check('a leading-space header is NOT accepted as a bearer', bearer('  Bearer abc123') == '  Bearer abc123'.strip())
    check('no scheme passes through unchanged', bearer('abc123') == 'abc123')
    check('the bare word Bearer is not a token', bearer('Bearer') == 'Bearer')
    # And the whole-file guard: ANY 3.9+ string call here means the POST road
    # dies on an older interpreter while /healthz keeps answering 200, which is
    # the exact shape that hid this for a day. Read from our own source.
    # PROVEN-TO-CATCH, and it caught ME first: the first version of this guard
    # reported "lines [147]" and the finding was itself. Two faults, both the
    # kind that make a check worse than none — it matched its own detector
    # string, and it numbered lines by position in the COMMENT-STRIPPED list,
    # so the number pointed at nothing a reader could open. A guard that cries
    # wolf at its own reflection gets deleted, and then the real thing it
    # watches for comes back. So: the needles are assembled at runtime so they
    # are not literals in this file, and line numbers come from the real file.
    _needles = ['.remove' + 'prefix(', '.remove' + 'suffix(']
    try:
        with open(os.path.abspath(__file__), 'r', encoding='utf-8') as _fh:
            _lines = _fh.read().split('\n')
        _bad = [
            i + 1 for i, l in enumerate(_lines)
            if not l.lstrip().startswith('#') and any(n in l for n in _needles)
        ]
        check('no Python 3.9+ string call outside comments (the NAS runs bare /usr/bin/python3)',
              not _bad, f'real line(s) {_bad}' if _bad else '')
    except OSError as _e:
        check('could read own source for the 3.9+ guard', False, str(_e))

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
