# wellness-counseling.rego
# Starter OPA Rego policy for the Counseling bot-team.
# Skeleton: encodes the allow / deny / escalate decision points, not an exhaustive ruleset.
# Senior declaration is pre-authorized-policies.yaml (team id: counseling).
# Deploys to /volume1/PoeTech/governance/opa/policies/ on the NAS.
#
# STRICTEST FIREWALL. The TLC clinical bright line is inviolable. This team
# NEVER routes clinical content to a vendor LLM. When in doubt, this policy
# denies or escalates -- never allows. Fail closed, always.

package poetech.wellness_counseling

import rego.v1

# Default to escalate -- and clinical ambiguity defaults to deny below.
default decision := "escalate"

# ---------------------------------------------------------------------------
# DENY -- the TLC firewall. Anything clinical, any vendor-LLM call carrying
# clinical content, any PHI handling. No approval history can promote these.
# ---------------------------------------------------------------------------
deny_reasons contains "clinical_data_handling" if {
	input.action.category == "clinical_data"
}

deny_reasons contains "phi_handling" if {
	input.action.touches_phi == true
}

deny_reasons contains "vendor_llm_with_clinical_content" if {
	input.action.provider != "ollama"
	input.action.content_class == "clinical"
}

deny_reasons contains "credential_touch" if {
	input.action.category == "credential_vault"
}

# ---------------------------------------------------------------------------
# ALLOW -- only the explicitly non-clinical surface: NON-PHI intake metadata,
# scheduling, and public-marketing copy edits. Nothing else.
# ---------------------------------------------------------------------------
allowed_actions := {
	"handle_non_phi_intake_metadata",
	"schedule_appointment_slot",
	"edit_public_marketing_copy",
}

allow if {
	count(deny_reasons) == 0
	allowed_actions[input.action.name]
	input.action.touches_phi == false
	input.action.content_class != "clinical"
}

# ---------------------------------------------------------------------------
# ESCALATE -- anything ambiguous goes to Christina + supervisor pre-publish.
# If a clinical determination cannot be made with certainty, it is NOT allowed;
# it escalates (or denies, above).
# ---------------------------------------------------------------------------
ambiguous if {
	not input.action.content_class
}

ambiguous if {
	input.action.content_class == "unknown"
}

# ---------------------------------------------------------------------------
# Resolve the single decision. Deny wins; ambiguity never reaches allow.
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
}

# Escalation target, surfaced alongside the decision for the Foundation Agent.
escalation_target := "christina_and_supervisor_pre_publish" if {
	decision == "escalate"
}
