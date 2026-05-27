#!/usr/bin/env python3
"""
publish-and-activate.py
=============================================================================
Promotes selected workflows from draft to published, sets active=1, inserts
webhook_entity routes for any webhook nodes, and writes an audit row to
workflow_publish_history.

Why this script exists: n8n 2.21 introduced a draft/published workflow model
where active=1 alone isn't enough — workflows also need a published version
in workflow_history + workflow_published_version + webhook_entity to actually
run. The UI handles this when you click "Publish"; programmatic activation
via SQL UPDATE doesn't replicate the full flow. Discovered 2026-05-26 when
end-to-end test returned 404 "webhook not registered" despite active=1.

Usage:
    sudo python3 /tmp/publish-and-activate.py

Idempotent. Re-running rotates the published version (new versionId, history
row preserved).

n8n must be stopped during the patch.
=============================================================================
"""

import sqlite3
import shutil
import time
import uuid
import sys

DB = '/volume1/docker/n8n-stack/n8n/database.sqlite'

# Workflows to publish + activate (Day 1: only the 2 with no Postgres
# dependency. Add 02/04/05 here once Supabase Postgres credential exists.)
to_publish = ['auveBxQz4ZymO1kV', 'xRidE2JCMkACeqiE']

# Webhook node config per workflow (only for workflows with a webhook trigger)
webhooks = {
    'auveBxQz4ZymO1kV': {
        'webhookPath': 'supabase-cycle-item',
        'method': 'POST',
        'node': 'Supabase Webhook (cycle_items.insert)',
        'webhookId': 'supabase-cycle-item',
    },
    'xRidE2JCMkACeqiE': {
        'webhookPath': 'github-events',
        'method': 'POST',
        'node': 'GitHub Webhook',
        'webhookId': 'github-events',
    },
}


def main():
    backup = DB + '.bak-publish-' + str(int(time.time()))
    shutil.copy(DB, backup)
    print('BACKUP: ' + backup)

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    owner_row = cur.execute(
        'SELECT id FROM user ORDER BY createdAt ASC LIMIT 1'
    ).fetchone()
    owner_id = owner_row[0] if owner_row else None
    print('owner_id: ' + str(owner_id))

    max_pub_id_row = cur.execute(
        'SELECT COALESCE(MAX(id), 0) FROM workflow_publish_history'
    ).fetchone()
    max_pub_id = max_pub_id_row[0]

    for wid in to_publish:
        row = cur.execute(
            'SELECT name, nodes, connections FROM workflow_entity WHERE id = ?',
            (wid,)
        ).fetchone()
        if not row:
            print('SKIP ' + wid + ': not found')
            continue
        name, nodes_json, connections_json = row
        version_id = str(uuid.uuid4())

        cur.execute(
            'INSERT INTO workflow_history (versionId, workflowId, authors, nodes, connections, name, autosaved) '
            'VALUES (?, ?, ?, ?, ?, ?, 0)',
            (version_id, wid, 'cowork-rollout', nodes_json, connections_json, name)
        )

        cur.execute(
            'UPDATE workflow_entity SET active = 1, activeVersionId = ?, updatedAt = datetime("now") WHERE id = ?',
            (version_id, wid)
        )
        cur.execute(
            'DELETE FROM workflow_published_version WHERE workflowId = ?',
            (wid,)
        )
        cur.execute(
            'INSERT INTO workflow_published_version (workflowId, publishedVersionId) VALUES (?, ?)',
            (wid, version_id)
        )

        max_pub_id += 1
        cur.execute(
            'INSERT INTO workflow_publish_history (id, workflowId, versionId, event, userId) '
            'VALUES (?, ?, ?, ?, ?)',
            (max_pub_id, wid, version_id, 'activated', owner_id)
        )

        wh = webhooks.get(wid)
        if wh:
            cur.execute(
                'DELETE FROM webhook_entity WHERE webhookPath = ? AND method = ?',
                (wh['webhookPath'], wh['method'])
            )
            cur.execute(
                'INSERT INTO webhook_entity (workflowId, webhookPath, method, node, webhookId, pathLength) '
                'VALUES (?, ?, ?, ?, ?, 1)',
                (wid, wh['webhookPath'], wh['method'], wh['node'], wh['webhookId'])
            )
            print('[' + wid + '] published + webhook ' + wh['method'] + ' /' + wh['webhookPath'])
        else:
            print('[' + wid + '] published (cron / no webhook)')

    conn.commit()
    conn.close()
    print('DONE')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('FAIL: ' + str(e), file=sys.stderr)
        sys.exit(1)
