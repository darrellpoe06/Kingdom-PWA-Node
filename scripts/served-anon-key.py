#!/usr/bin/env python3
"""served-anon-key.py -- the served site speaks the public client key the NAS could not (DR-1269).

The deploy bakes the sovereign backend's anon key into the bundle. Its first
road is the NAS over the tailnet (deploy-cloudflare-pages.yml, DR-0310). When
that road is closed -- the runner's Tailscale key refused, the NAS asleep --
the key is still public by nature: every browser that opens poetech.us
downloads it inside the app's own JavaScript. This script reads it back from
the served site, exactly the way site-health.yml reads which backend the app
truly calls (the VITE_ values are inlined at build time).

It REFUSES rather than guesses (DR-0076):
  exit 10  the shell names no hashed assets (not the app we know)
  exit 11  no chunk carries the sovereign gateway URL: the served build is not
           repoint-armed, so its key would be the wrong backend's
  exit 12  no anon key in any chunk
  exit 13  more than one distinct anon key: ambiguous, nothing is chosen
  exit 14  the shell could not be fetched
Only counts go to stderr. The key goes to stdout, once, and nowhere else.
"""
import argparse
import base64
import json
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit

UA = ('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36')
ASSET_RE = re.compile(r"/poetech-app/assets/[^\"'\s]*\.js")
JWT_RE = re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}')


def fetch(url, timeout):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode('utf-8', 'replace')


def payload_of(jwt):
    part = jwt.split('.')[1]
    part += '=' * (-len(part) % 4)
    try:
        return json.loads(base64.urlsafe_b64decode(part.encode('ascii')))
    except Exception:  # not a JWT after all; a lookalike string in a chunk
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--shell', default='https://poetech.us/poetech-app/')
    ap.add_argument('--funnel', default='poetech.tail5a2f35.ts.net/sb',
                    help='the sovereign gateway URL a repoint-armed build carries')
    ap.add_argument('--max-assets', type=int, default=40)
    ap.add_argument('--timeout', type=int, default=30)
    a = ap.parse_args()

    try:
        shell = fetch(a.shell, a.timeout)
    except (urllib.error.URLError, OSError, ValueError) as e:
        print(f'served-anon-key: the shell could not be fetched: {e.__class__.__name__}', file=sys.stderr)
        return 14
    assets = sorted(set(ASSET_RE.findall(shell)))[: a.max_assets]
    if not assets:
        print('served-anon-key: the shell names no hashed assets', file=sys.stderr)
        return 10
    u = urlsplit(a.shell)
    origin = f'{u.scheme}://{u.netloc}'
    funnel_seen = False
    anon = {}
    scanned = 0
    for path in assets:
        try:
            body = fetch(origin + path, a.timeout)
        except (urllib.error.URLError, OSError, ValueError):
            continue
        scanned += 1
        if a.funnel in body:
            funnel_seen = True
        for jwt in set(JWT_RE.findall(body)):
            p = payload_of(jwt)
            if isinstance(p, dict) and p.get('role') == 'anon':
                anon[jwt] = p
    if not funnel_seen:
        print(f'served-anon-key: no chunk of {scanned} carries the sovereign gateway ({a.funnel}); '
              'the served build is not repoint-armed, so its key is not the sovereign key', file=sys.stderr)
        return 11
    if not anon:
        print(f'served-anon-key: no anon key in {scanned} chunk(s)', file=sys.stderr)
        return 12
    # A hosted project's key carries a "ref" claim; the sovereign gateway's does not.
    sovereign = {k: p for k, p in anon.items() if 'ref' not in p}
    chosen = sovereign if sovereign else anon
    if len(chosen) != 1:
        print(f'served-anon-key: {len(chosen)} distinct anon keys in {scanned} chunk(s); ambiguous, nothing chosen', file=sys.stderr)
        return 13
    key, p = next(iter(chosen.items()))
    print(f'served-anon-key: road served-site; chunks scanned {scanned}; anon keys found {len(anon)}; '
          f'chosen 1 (iss={p.get("iss")}, exp={p.get("exp")})', file=sys.stderr)
    print(key)
    return 0


if __name__ == '__main__':
    sys.exit(main())
