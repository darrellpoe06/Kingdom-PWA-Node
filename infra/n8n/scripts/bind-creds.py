#!/usr/bin/env python3
"""
bind-creds.py
=============================================================================
Binds the n8n SMTP credential to every Path B Email Send node across our 5
production workflows. Idempotent.

Why this script exists: n8n's UI workflow editor renders imported workflows
at negative screen coordinates (Vue Flow reactive viewport quirk in
Chrome MCP automation), which blocks clicks to bind credentials via UI.
n8n's REST API requires session cookies that don't survive container
restarts AND a scope-restricted API key UI that Community edition can't
populate. Direct SQLite patching bypasses both blockers.

Usage:
    sudo python3 /tmp/bind-creds.py

Reads the SMTP credential ID dynamically — finds the first credential of
type 'smtp' in credentials_entity. If multiple exist, edit SMTP_CRED_ID
below to override.

n8n must be stopped during the patch to avoid race with in-memory state.
=============================================================================
"""

import sqlite3
import json
import shutil
import time
import sys

DB = '/volume1/docker/n8n-stack/n8n/database.sqlite'

# Set to None to auto-discover the first smtp credential
SMTP_CRED_ID = None
SMTP_CRED_NAME = 'SMTP account'

workflow_ids = [
    'auveBxQz4ZymO1kV',  # 01 Supabase webhook
    'MXLfhmEHmDrCgYJP',  # 02 Daily reports cron
    'xRidE2JCMkACeqiE',  # 03 GitHub webhook
    'PMDQcmgZKM0ish8Q',  # 04 POE morning standup
    'RaMYVlm1J5IrnRJI',  # 05 End-of-day reflection
]


def main():
    backup = DB + '.bak-bindcreds-' + str(int(time.time()))
    shutil.copy(DB, backup)
    print('BACKUP: ' + backup)

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    smtp_id = SMTP_CRED_ID
    if smtp_id is None:
        row = cur.execute(
            "SELECT id, name FROM credentials_entity WHERE type = 'smtp' ORDER BY createdAt ASC LIMIT 1"
        ).fetchone()
        if not row:
            print('FAIL: no smtp credential found in credentials_entity', file=sys.stderr)
            sys.exit(1)
        smtp_id, smtp_name = row[0], row[1]
        print('AUTO-DISCOVERED smtp credential: id=' + smtp_id + ' name=' + smtp_name)
    else:
        smtp_name = SMTP_CRED_NAME

    for wid in workflow_ids:
        row = cur.execute('SELECT nodes FROM workflow_entity WHERE id = ?', (wid,)).fetchone()
        if not row:
            print('[' + wid + '] NOT FOUND')
            continue
        nodes = json.loads(row[0])
        bound = []
        for node in nodes:
            if node.get('type') == 'n8n-nodes-base.emailSend':
                node.setdefault('credentials', {})
                node['credentials']['smtp'] = {'id': smtp_id, 'name': smtp_name}
                bound.append(node.get('name', '?'))
        if bound:
            cur.execute(
                'UPDATE workflow_entity SET nodes = ?, updatedAt = datetime("now") WHERE id = ?',
                (json.dumps(nodes), wid)
            )
            # Also patch published-version snapshot if any
            pub = cur.execute(
                'SELECT publishedVersionId FROM workflow_published_version WHERE workflowId = ?',
                (wid,)
            ).fetchone()
            if pub:
                cur.execute(
                    'UPDATE workflow_history SET nodes = ?, updatedAt = datetime("now") WHERE versionId = ?',
                    (json.dumps(nodes), pub[0])
                )
            print('[' + wid + '] BOUND: ' + ', '.join(bound))
        else:
            print('[' + wid + '] no Email Send node found')

    conn.commit()
    conn.close()
    print('DONE')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('FAIL: ' + str(e), file=sys.stderr)
        sys.exit(1)
