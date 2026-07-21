# nas-review-feed — the sovereign governance review-queue server

DR-0218 zero-n8n / DR-0083 sovereign-Python. `review_server.py` replaces the n8n
Code nodes **wf-review-feed** + **wf-review-action** with one deterministic stdlib
Python process — no n8n, no vendor, no data leaving the box. It is a byte-faithful
port: it reads/writes the SAME `/data/finance-events/_freshness/*.json` files the
freshness loop already writes, using the SAME `.review-token` file.

## Contract

```
GET  /review-feed    X-Review-Token: <token>
     -> { ok, generated_at, freshness: [ <proposal>, ... ] }   (<=25, newest-first,
        'dismissed' filtered out)
POST /review-action  X-Review-Token: <token>   { id, action }
     action ∈ {dismiss->dismissed, keep->kept}; id matched to ^fr-[0-9A-Za-z-]+$
     (no traversal); writes ONLY .status + .reviewed_at of an EXISTING proposal —
     never applies anything to the system (bright lines stay manual, DR-0061).
GET  /healthz -> { ok: true }
```

The in-app Governor Review tab (`app/src/components/ReviewFeed.jsx`) reaches these
at the same-origin relative paths `/review-feed` and `/review-action`; it degrades
to an honest error/"couldn’t" state until this server + its route are up.

## Run it (NAS, SSH / ConnectBot)

```
cd /volume1/PoeTech/repos/Kingdom-PWA-Node/infra/nas-review-feed
python3 review_server.py --serve --host 127.0.0.1 --port 8790     # stdlib only
```

The token is read from `/data/finance-events/_freshness/.review-token` (the same
file the workflows used) or the `REVIEW_TOKEN` env. Front it same-origin in Caddy:

```
handle /review-feed /review-action {
    reverse_proxy 127.0.0.1:8790
}
```

For public poetech.us, `/review-feed` + `/review-action` also need a Cloudflare
Pages Function proxy to the transport (mirror `app/functions/n8n/[[path]].js`); on
the sovereign NAS-Caddy instance they are same-origin already.

## Verify (offline, no NAS)

```
python3 review_server.py --selftest        # 18/18 checks — gated in CI
```
