#!/usr/bin/env python3
"""Remove an orphaned required status check from the repo's rulesets.

WHY THIS EXISTS. DR-0218 took n8n to zero, which deleted
`scripts/test-wf36-quality-gatekeeper.js` and the CI job that ran it. But that
job's NAME was registered as a REQUIRED STATUS CHECK on the main-branch ruleset.
A required check whose job no longer runs can never report, so it blocks EVERY
pull request to main, permanently:

    405 Repository rule violations found
    Required status check "n8n workflows - wf36 gatekeeper harness" is expected.

The correct order was: change the ruleset FIRST, then delete the job. That was
inverted. This is the repair.

WHY A SCRIPT AND NOT A DASHBOARD CLICK. DR-0249 built the governed remote-hands
channel as the answer to "why can't you do it?", and COMPREHENSIVE-REVIEW-
STANDARD dimension 5 says a step is the human's ONLY when no channel drives it.
A runner's own GITHUB_TOKEN with `administration: write` drives this. Handing it
over as a manual click was the fake boundary that rule exists to catch.

SAFETY, deliberately narrow:
  * Matches ONE literal substring (default `wf36`) and only inside rules of
    type `required_status_checks`. It cannot touch another check or rule.
  * Prints before/after, so the run is its own receipt (DR-0076 section 4).
  * Idempotent: a second run finds nothing and exits 0 saying so.
  * --dry-run reports the plan and writes nothing.
  * On a 403 (token lacks administration scope) it fails LOUDLY rather than
    leaving main quietly blocked (DR-0310: unknown never reads as success).

Usage:
    python3 scripts/remove-stale-required-check.py --repo owner/name [--dry-run]
Requires GH_TOKEN (or GITHUB_TOKEN) in the environment.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.github.com"


def call(token, method, path, body=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Authorization", "Bearer " + token)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data, timeout=30) as r:
        raw = r.read().decode()
    return json.loads(raw) if raw.strip() else {}


def checks_of(ruleset):
    """Every required-status-check context in a ruleset, in order."""
    out = []
    for rule in ruleset.get("rules", []):
        if rule.get("type") == "required_status_checks":
            for c in rule.get("parameters", {}).get("required_status_checks", []):
                out.append(c.get("context", ""))
    return out


def strip(ruleset, needle):
    """Drop matching checks. Returns (new_rules, removed_contexts)."""
    removed = []
    rules = ruleset.get("rules", [])
    for rule in rules:
        if rule.get("type") != "required_status_checks":
            continue
        params = rule.get("parameters", {})
        keep = []
        for c in params.get("required_status_checks", []):
            if needle in c.get("context", ""):
                removed.append(c.get("context", ""))
            else:
                keep.append(c)
        params["required_status_checks"] = keep
    return rules, removed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, help="owner/name")
    ap.add_argument("--match", default="wf36", help="substring of the check to remove")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if not token:
        print("ERROR: GH_TOKEN / GITHUB_TOKEN not set", file=sys.stderr)
        return 2

    try:
        rulesets = call(token, "GET", "/repos/%s/rulesets" % args.repo)
    except urllib.error.HTTPError as e:
        print("ERROR: cannot read rulesets (HTTP %s) - the token most likely "
              "lacks 'administration' access. main stays blocked." % e.code, file=sys.stderr)
        return 1

    if not rulesets:
        print("ERROR: no rulesets returned. Nothing repaired; main stays blocked.", file=sys.stderr)
        return 1

    changed = 0
    for rs in rulesets:
        rid = rs.get("id")
        full = call(token, "GET", "/repos/%s/rulesets/%s" % (args.repo, rid))
        before = checks_of(full)
        if not any(args.match in c for c in before):
            continue

        print("ruleset %s (%s)" % (rid, full.get("name", "?")))
        for c in before:
            print("  before: %s" % c)

        rules, removed = strip(full, args.match)
        if args.dry_run:
            print("  DRY RUN - would remove: %s" % ", ".join(removed))
            changed += 1
            continue

        try:
            call(token, "PUT", "/repos/%s/rulesets/%s" % (args.repo, rid), {"rules": rules})
        except urllib.error.HTTPError as e:
            print("ERROR: PUT failed (HTTP %s) on ruleset %s - branch protection "
                  "UNCHANGED." % (e.code, rid), file=sys.stderr)
            return 1

        after = checks_of(call(token, "GET", "/repos/%s/rulesets/%s" % (args.repo, rid)))
        for c in after:
            print("  after:  %s" % c)
        print("  removed: %s" % ", ".join(removed))
        changed += 1

    if changed == 0:
        print("No '%s' required check found - already repaired. Nothing to do." % args.match)
    return 0


if __name__ == "__main__":
    sys.exit(main())
