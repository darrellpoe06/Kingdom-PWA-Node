#!/usr/bin/env python3
"""
add-ntfy-fallback.py
=============================================================================
Adds a parallel ntfy HTTP node to workflows 01 and 03 so push delivery
has TWO independent channels:

  - Path A/B (Pushover): rich notifications, but delivery chain is
    n8n -> Gmail SMTP -> pomail.net -> Pushover -> phone (5 hops, several
    failure modes including silent sender filtering)

  - Path C (ntfy): n8n -> ntfy container -> ntfy app on phone (2 hops,
    proven-working in smoke tests, $0 cost, no external service)

If Pushover delivery fails for any reason, ntfy still reaches the phone.
That's the sustainable "system handles little issues automatically"
posture Darrell asked for 2026-05-26.

Also adds retry-on-fail to the Email Send node (3 retries, 2-second
linear backoff) so transient SMTP hiccups self-recover.

Idempotent. Safe to re-run.

Usage:
    sudo python3 /tmp/add-ntfy-fallback.py

n8n must be stopped to avoid race with in-memory state.
=============================================================================
"""

import sqlite3
import json
import shutil
import time
import uuid
import sys

DB = '/volume1/docker/n8n-stack/n8n/database.sqlite'

# Workflows to patch + their Format-equivalent node + ntfy topic
patches = {
    'auveBxQz4ZymO1kV': {  # 01 Supabase
        'fan_from': 'Format notification (POE-bound)',
        'fan_to_respond': 'Respond to Supabase',
        'topic': 'darrell',
        'title_field': 'title',
        'body_field': 'body',
        'click_field': 'pushover.url',
    },
    'xRidE2JCMkACeqiE': {  # 03 GitHub
        'fan_from': 'Parse GitHub event',
        'fan_to_respond': 'Respond 200',
        'topic': 'darrell',
        'title_field': 'title',
        'body_field': 'body',
        'click_field': 'pushover.url',
    },
}


def ensure_ntfy_node(nodes, topic, title_field, body_field, click_field):
    """Return (node, was_new). Find existing ntfy fallback or create one."""
    name = 'ntfy Fallback (' + topic + ')'
    for node in nodes:
        if node.get('name') == name:
            return node, False
    new_node = {
        'parameters': {
            'method': 'POST',
            'url': 'http://ntfy:80/' + topic,
            'sendBody': True,
            'contentType': 'raw',
            'rawContentType': 'text/plain',
            'body': '={{ $json.' + body_field + ' }}',
            'sendHeaders': True,
            'headerParameters': {
                'parameters': [
                    {'name': 'Title', 'value': '={{ $json.' + title_field + ' }}'},
                    {'name': 'Tags', 'value': 'bell,poetech'},
                    {'name': 'Click', 'value': '={{ $json.' + click_field + ' || "" }}'},
                ]
            },
            'options': {},
        },
        'id': 'ntfy-fallback-' + str(uuid.uuid4())[:8],
        'name': name,
        'type': 'n8n-nodes-base.httpRequest',
        'typeVersion': 4.2,
        'position': [720, 720],  # below the existing nodes
        'continueOnFail': True,  # ntfy failure shouldn't block the rest
    }
    nodes.append(new_node)
    return new_node, True


def add_retry_to_email_send(nodes):
    """Add retry-on-fail to every Email Send node. Returns count of patched nodes."""
    count = 0
    for node in nodes:
        if node.get('type') == 'n8n-nodes-base.emailSend':
            node['retryOnFail'] = True
            node['maxTries'] = 3
            node['waitBetweenTries'] = 2000  # 2 seconds linear
            node['continueOnFail'] = True  # don't block ntfy if email fails
            count += 1
    return count


def patch_connections(conns, fan_from, ntfy_name, fan_to_respond):
    """Fan output of `fan_from` to BOTH existing target AND ntfy_name.
       Then connect ntfy_name -> fan_to_respond.
    """
    if fan_from not in conns:
        return False
    main = conns[fan_from].get('main', [[]])
    if not main or not main[0]:
        return False
    # Check if ntfy is already in the fan
    existing_targets = [t.get('node') for t in main[0]]
    if ntfy_name not in existing_targets:
        main[0].append({'node': ntfy_name, 'type': 'main', 'index': 0})
    # Add ntfy -> respond connection (idempotent)
    if ntfy_name not in conns:
        conns[ntfy_name] = {'main': [[{'node': fan_to_respond, 'type': 'main', 'index': 0}]]}
    return True


def main():
    backup = DB + '.bak-ntfy-' + str(int(time.time()))
    shutil.copy(DB, backup)
    print('BACKUP: ' + backup)

    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    total_patched = 0

    for wid, cfg in patches.items():
        row = cur.execute(
            'SELECT nodes, connections FROM workflow_entity WHERE id = ?',
            (wid,)
        ).fetchone()
        if not row:
            print('[' + wid + '] NOT FOUND')
            continue
        nodes = json.loads(row[0])
        conns = json.loads(row[1])

        ntfy_node, was_new = ensure_ntfy_node(
            nodes, cfg['topic'], cfg['title_field'], cfg['body_field'], cfg['click_field']
        )

        ok = patch_connections(conns, cfg['fan_from'], ntfy_node['name'], cfg['fan_to_respond'])
        if not ok:
            print('[' + wid + '] fan_from node "' + cfg['fan_from'] + '" not found in connections; skipping')
            continue

        retry_count = add_retry_to_email_send(nodes)

        cur.execute(
            'UPDATE workflow_entity SET nodes = ?, connections = ?, updatedAt = datetime("now") WHERE id = ?',
            (json.dumps(nodes), json.dumps(conns), wid)
        )
        # Sync published version snapshot if exists
        pub = cur.execute(
            'SELECT publishedVersionId FROM workflow_published_version WHERE workflowId = ?',
            (wid,)
        ).fetchone()
        if pub:
            cur.execute(
                'UPDATE workflow_history SET nodes = ?, connections = ?, updatedAt = datetime("now") WHERE versionId = ?',
                (json.dumps(nodes), json.dumps(conns), pub[0])
            )
            print('[' + wid + '] ntfy=' + ('NEW' if was_new else 'EXISTS') +
                  ', retry-on-fail added to ' + str(retry_count) + ' Email Send node(s), published snapshot synced')
        else:
            print('[' + wid + '] ntfy=' + ('NEW' if was_new else 'EXISTS') +
                  ', retry-on-fail added to ' + str(retry_count) + ' Email Send node(s) (no published version)')
        total_patched += 1

    conn.commit()
    conn.close()
    print('DONE: patched ' + str(total_patched) + ' workflow(s)')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('FAIL: ' + str(e), file=sys.stderr)
        sys.exit(1)
