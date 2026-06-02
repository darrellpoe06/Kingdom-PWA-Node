# family-finance.rego
# Starter OPA Rego policy for the Family-Finance bot-team.
# Skeleton: encodes the allow / deny / escalate decision points, not an exhaustive ruleset.
# Senior declaration is pre-authorized-policies.yaml (team id: family_finance).
# Deploys to /volume1/PoeTech/governance/opa/policies/ on the NAS.
#
# Decision contract: input is the proposed action; output `decision` is one of
#   "allow" | "deny" | "escalate". The bot-team never decides for itself; OPA does.

package poetech.family_finance

import rego.v1

# Default to escalate -- if no rule matches, a human decides. Fail safe, not fail open.
default decision := "escalate"

# ---------------------------------------------------------------------------
# DENY -- bright lines. These never auto-promote regardless of approval history.
# ---------------------------------------------------------------------------
deny_reasons contains "money_movement" if {
	input.action.category == "money_movement"
}

deny_reasons contains "credential_touch" if {
	input.action.category == "credential_vault"
}

deny_reasons contains "irreversible_delete" if {
	input.action.category == "irreversible_os"
}

# ---------------------------------------------------------------------------
# ALLOW -- pre-authorized, low-risk, reversible Family-Finance actions.
# ---------------------------------------------------------------------------
allowed_actions := {
	"generate_scope_tool",
	"suggest_transaction_category",
	"compute_rental_portfolio_math",
	"compute_amortization",
	"draft_appraisal_scenario",
	"produce_monthly_digest",
}

allow if {
	count(deny_reasons) == 0
	allowed_actions[input.action.name]
}

# ---------------------------------------------------------------------------
# ESCALATE -- drafts that touch a person or a decision queue for one-tap review.
# ---------------------------------------------------------------------------
escalate_actions := {
	"draft_tenant_communication",
	"draft_real_estate_decision",
}

# ---------------------------------------------------------------------------
# Resolve the single decision.
# ---------------------------------------------------------------------------
decision := "deny" if {
	count(deny_reasons) > 0
}

decision := "allow" if {
	count(deny_reasons) == 0
	allow
}

decision := "escalate" if {
	count(deny_reasons) == 0
	not allow
	escalate_actions[input.action.name]
}
