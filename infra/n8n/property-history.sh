#!/bin/sh
# property-history.sh - read-only Synology Chat channel export.
# Deployed at /volume1/PoeTech/scripts/property-history.sh on the NAS.
# Forced-command target for the n8n property-history bridge key: the ONLY
# command that key can run (authorized_keys command= entry, no-pty etc).
# Returns a JSON array of {id, ts, user, text} for the named channel;
# deleted and empty posts excluded; ts is epoch milliseconds.
# Channel arrives as $1 (direct call) or as the last token of
# SSH_ORIGINAL_COMMAND (forced-command call), whitelist-sanitized.
CH="$1"
if [ -z "$CH" ] && [ -n "$SSH_ORIGINAL_COMMAND" ]; then
  CH=$(echo "$SSH_ORIGINAL_COMMAND" | awk '{print $NF}')
fi
if [ -z "$CH" ]; then echo "[]"; exit 0; fi
CH=$(printf %s "$CH" | tr -cd "A-Za-z0-9._-")
sudo -n -u postgres psql synochat -At <<EOF
SELECT COALESCE(json_agg(json_build_object(
  'id', p.id,
  'ts', p.create_at,
  'user', COALESCE(u.nickname, ''),
  'text', p.message
) ORDER BY p.create_at), '[]'::json)
FROM posts p
JOIN channels c ON c.id = p.channel_id
LEFT JOIN users u ON u.id = p.user_id
WHERE c.name = '$CH'
  AND COALESCE(p.delete_at, 0) = 0
  AND COALESCE(p.message, '') <> '';
EOF
