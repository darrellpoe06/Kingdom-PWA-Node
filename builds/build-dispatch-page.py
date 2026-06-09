#!/usr/bin/env python3
# Throwaway builder (lives in untracked builds/): embeds builds/dispatch-page.html
# into the wf-dispatch-status-page workflow JSON with correct double-escaping.
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = open(os.path.join(ROOT, "builds", "dispatch-page.html"), "r", encoding="utf-8").read()
OUT = os.path.join(ROOT, "docs", "00-foundations", "n8n-workflows", "wf-dispatch-status-page.json")

# json.dumps(HTML) yields a valid JS string literal (quotes/backslashes/newlines
# escaped). The Code node assigns it to `html` and returns it; the Respond node
# serializes it as the HTML body.
jscode = (
    "// Dispatch status PAGE -- serves the full self-contained live-readout HTML\n"
    "// (inline CSS + JS, one CDN script for the ntfy QR). Sovereign: served from\n"
    "// the NAS n8n instance itself, not Vercel. The page fetches its data from the\n"
    "// sibling wf-dispatch-status endpoints (/webhook/dispatch-status?section=...)\n"
    "// on the same origin. Access control = the NAS being Tailscale/LAN-only.\n"
    "const html = " + json.dumps(HTML) + ";\n"
    "return [{ json: { html } }];"
)

wf = {
    "name": "Dispatch status PAGE (NAS-hosted live readout HTML)",
    "nodes": [
        {
            "parameters": {
                "httpMethod": "GET",
                "path": "dispatch-status-page",
                "responseMode": "responseNode",
                "options": {},
            },
            "id": "9f7e2a10-d5a0-45a0-85a0-aaaaaaaaaa01",
            "name": "Webhook (dispatch-status-page)",
            "type": "n8n-nodes-base.webhook",
            "typeVersion": 2,
            "position": [200, 320],
            "webhookId": "dispatch-status-page",
        },
        {
            "parameters": {"jsCode": jscode},
            "id": "9f7e2a10-d5a0-45a0-85a0-aaaaaaaaaa02",
            "name": "Build page HTML",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [440, 320],
        },
        {
            "parameters": {
                "respondWith": "text",
                "responseBody": "={{ $json.html }}",
                "options": {
                    "responseHeaders": {
                        "entries": [
                            {"name": "Content-Type", "value": "text/html; charset=utf-8"},
                            {"name": "Cache-Control", "value": "no-store"},
                            {"name": "Access-Control-Allow-Origin", "value": "*"},
                        ]
                    }
                },
            },
            "id": "9f7e2a10-d5a0-45a0-85a0-aaaaaaaaaa03",
            "name": "Respond with HTML",
            "type": "n8n-nodes-base.respondToWebhook",
            "typeVersion": 1,
            "position": [680, 320],
        },
    ],
    "connections": {
        "Webhook (dispatch-status-page)": {
            "main": [[{"node": "Build page HTML", "type": "main", "index": 0}]]
        },
        "Build page HTML": {
            "main": [[{"node": "Respond with HTML", "type": "main", "index": 0}]]
        },
    },
    "active": False,
    "settings": {
        "executionOrder": "v1",
        "saveDataSuccessExecution": "all",
        "saveDataErrorExecution": "all",
    },
    "staticData": None,
    "tags": [
        {"name": "pwa-api"},
        {"name": "dispatch-status"},
        {"name": "nas-sovereign"},
        {"name": "sovereign-loop"},
    ],
    "meta": {"instanceId": "poe-family"},
    "pinData": {},
}

with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    json.dump(wf, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("Wrote", OUT, "(", os.path.getsize(OUT), "bytes )")
