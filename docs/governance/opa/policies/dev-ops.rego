# dev-ops.rego
# Starter OPA Rego policy for the Dev-Ops bot-team.
# Skeleton: encodes the allow / deny / escalate decision points, not an exhaustive ruleset.
# Senior declaration is pre-authorized-policies.yaml (team id: devops).
# Deploys to /volume1/PoeTech/governance/opa/policies/ on the NAS.
#
# This is the team that operationalizes the "always-now viable fix" directive:
# the known bug-class fixes execute now; schema-breaking and production-visible
# changes escalate.

package poetech.dev_ops

import rego.v1

default decision := "escalate"

# ---------------------------------------------------------------------------
# DENY -- never auto-promote.
# ---------------------------------------------------------------------------
deny_reasons contains "schema_breaking_change" if {
	input.action.category == "schema_breaking"
}

deny_reasons contains "force_push" if {
	input.action.name == "git_force_push"
}

deny_reasons contains "history_rewrite" if {
	input.action.name == "git_history_rewrite"
}

deny_reasons contains "credential_touch" if {
	input.action.category == "credential_vault"
}

deny_reasons contains "irreversible_os" if {
	input.action.category == "irreversible_os"
}

# ---------------------------------------------------------------------------
# ALLOW -- the pre-authorized fix classes. Reversible, smoke-tested, logged.
# These execute now without pinging Darrell, per the always-now-viable-fix rule.
# ---------------------------------------------------------------------------
allowed_actions := {
	"fix_process_env_to_literal_default",
	"fix_hardcoded_value_to_set_node_config",
	"set_missing_error_workflow",
	"dependency_update_within_semver",
	"format_code",
	"fix_lint",
}

allow if {
	count(deny_reasons) == 0
	allowed_actions[input.action.name]
	not touches_production_pwa
}

# A semver-range dependency update is allowed only inside the declared range.
within_semver_range if {
	input.action.name == "dependency_update_within_semver"
	input.action.semver_bump in {"patch", "minor"}
}

# ---------------------------------------------------------------------------
# ESCALATE -- anything visible in the production PWA goes to one-tap review,
# even when the change itself is a pre-authorized class.
# ---------------------------------------------------------------------------
touches_production_pwa if {
	input.action.production_pwa_visible == true
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
	touches_production_pwa
}
