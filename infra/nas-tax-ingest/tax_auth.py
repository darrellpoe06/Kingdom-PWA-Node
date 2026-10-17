# =============================================================================
# tax_auth -- the one rule for who may touch the family's tax archive (DR-1086)
# =============================================================================
# The /taxes routes are mounted on the PUBLIC Tailscale Funnel (install.sh) and
# proxied same-origin from the public site (app/functions/taxes/[[path]].js).
# Until 2026-10-17 only the UPLOAD checked the bearer, and only when a token was
# configured; the archive index (every return's file name) and the return PDFs
# themselves were served to anyone who asked. Tax returns carry Social Security
# numbers. Every route now asks this one function.
#
# FAIL CLOSED: no configured token means nobody gets in, never everybody.
# Constant-time comparison, so the check leaks nothing about the token.
# Stdlib only, so it is testable without the server's dependencies.
# =============================================================================
import hmac


def bearer_ok(authorization, token):
    """True only when a token is configured AND the header carries exactly it."""
    if not token:
        return False
    if not isinstance(authorization, str) or not authorization.startswith("Bearer "):
        return False
    presented = authorization[len("Bearer "):]
    return hmac.compare_digest(presented.encode("utf-8"), token.encode("utf-8"))
