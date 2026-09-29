"""
fixes -- the algorithmic fixes that bring a tower writer to the reference (DR-0671).

THE FIX INTERFACE. Each fix is one module in this package that closes one gap
class named by parity_core.GAP_CLASSES. It exports:

    GAP_CLASS = "<class>"        # the gap it closes
    STAGE     = "pre" | "post"   # pre: changes the prompt context before the
                                 #      tower writes; post: repairs the tower's
                                 #      output after it writes
    def apply(ctx) -> ctx        # pure and deterministic; returns a NEW ctx

    ctx for a pre fix:  {"teaching": str, "prompt": str, ...}
    ctx for a post fix: {"teaching": str, "body": dict, ...}

and ships with a test that re-measures the stored example BEFORE and AFTER the
fix with parity_core (proven-to-catch: the gap is present before and smaller or
gone after). The Claude fix step (parity_loop.fix_step) writes new modules in
this shape as ordinary PRs through the lane.

The tower pipeline runs every enabled fix of its stage, in the order below.
Wiring point for the NAS lesson builder (DR-0669): call apply_stage("pre", ctx)
before sending the prompt to a tower writer, and apply_stage("post", ctx) on
the tower's body before its gates run. Claude, the reference, is never passed
through fixes: the reference stays what it is.
"""
import importlib

# Enabled fixes, in run order. A fix is added here by the PR that proves it.
ENABLED = [
    "verse_retrieval",
]


def load(name):
    return importlib.import_module("fixes." + name)


def for_stage(stage):
    return [m for m in (load(n) for n in ENABLED) if getattr(m, "STAGE", None) == stage]


def apply_stage(stage, ctx):
    for m in for_stage(stage):
        ctx = m.apply(ctx)
    return ctx


def closes():
    """{gap_class: module name} for every enabled fix."""
    return {load(n).GAP_CLASS: n for n in ENABLED}
