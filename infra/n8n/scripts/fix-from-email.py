#!/usr/bin/env python3
"""
fix-from-email.py
=============================================================================
Patches all Path B Email Send nodes across our 5 production workflows to
send FROM darrellpoe06@gmail.com (the Gmail SMTP authenticated user) instead
of the placeholder n8n@poetech.local.

Why: Pushover's email-to-push gateway (pomail.net) accepts emails from the
sender registered on the Pushover account. The placeholder was a hygiene
artifact; in practice Gmail SMTP rewrites the From to the authenticated
user, but explicit > implicit, and we want Sent-folder visibility too.

Discovered 2026-05-26 during Phase 3 end-to-end testing when execution
#3 returned status=success but no push notification arrived on Darrell's
phone (likely silent drop at pomail or Pushover account-mismatch filter).

Usage (run on Synology host where /volume1/docker/n8n-stack/ lives):

    sudo python3 /tmp/fix-from-email.py

Idempotent. Safe to re-run. Creates a backup of the SQLite DB first.

After running:
    sudo /var/packages/ContainerManager/target/usr/bin/docker compose \\
        -f /volume1/docker/n8n-stack/docker-compose.yml restart n8n
    # then re-fire the test webhook

n8n must be stopped (or at least not actively processing) for SQLite
writes to be safe. The driver bash command in the Phase 1e commit script
handles stop -> patch -> start.
=============================================================================
"""

import sqlite3
import json
import shutil
import time
import sys

DB = '/volume1/docker/n8n-stack/n8n/database.sqlite'
NEW_FROM = 'darrellpoe06@gmail.com'

# All 5 production workflows that emit notifications via dual-path
workflow_ids = [
    'auveBxQz4ZymO1kV',  # 01 Supabase webhook
    'MXLfhmEHmDrCgYJP',  # 02 Daily reports cron
    'xRidE2JCMkACeqiE',  # 03 GitHub webhook
    'PMDQcmgZKM0ish8Q',  # 04 POE morning standup
    'RaMYVlm1J5IrnRJI',  # 05 End-of-day reflection
]


def main():
    backup = DB + '.bak-fromfix-' + str(int(time.time()))
    shutil.copy(DB, backup)
    print('BACKUP: ' + backup)

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    patched_count = 0

    for wid in workflow_ids:
        row = cur.execute(
            'SELECT nodes FROM workflow_entity WHERE id = ?',
            (wid,)
        ).fetchone()
        if not row:
            print('[' + wid + '] NOT FOUND')
            continue

        nodes = json.loads(row[0])
        changed = []
        for node in nodes:
            if node.get('type') == 'n8n-nodes-base.emailSend':
                params = node.setdefault('parameters', {})
                old_from = params.get('fromEmail', '')
                if old_from != NEW_FROM:
                    params['fromEmail'] = NEW_FROM
                    changed.append(node.get('name', '?') + ' (was: ' + str(old_from) + ')')

        if changed:
            cur.execute(
                'UPDATE workflow_entity SET nodes = ?, updatedAt = datetime("now") WHERE id = ?',
                (json.dumps(nodes), wid)
            )
            print('[' + wid + '] PATCHED: ' + '; '.join(changed))
            patched_count += 1

            # If this workflow has a published version, snapshot the new state into
            # workflow_history so the published-version pointer reflects the new
            # nodes. Otherwise the running webhook would still use the OLD nodes.
            pub = cur.execute(
                'SELECT publishedVersionId FROM workflow_published_version WHERE workflowId = ?',
                (wid,)
            ).fetchone()
            if pub:
                # Re-snapshot: update the existing workflow_history row in place
                cur.execute(
                    'UPDATE workflow_history SET nodes = ?, updatedAt = datetime("now") WHERE versionId = ?',
                    (json.dumps(nodes), pub[0])
                )
                print('[' + wid + '] published-version snapshot also patched (' + pub[0] + ')')
        else:
            print('[' + wid + '] no Email Send node needed patching (already correct or absent)')

    conn.commit()
    conn.close()
    print('DONE: patched ' + str(patched_count) + ' workflow(s)')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('FAIL: ' + str(e), file=sys.stderr)
        sys.exit(1)
