# church-ops.rego
# Starter OPA Rego policy for the Church-Ops bot-team (COLG).
# Skeleton: encodes the allow / deny / escalate decision points, not an exhaustive ruleset.
# Senior declaration is pre-authorized-policies.yaml (team id: church_colg).
# Deploys to /volume1/PoeTech/governance/opa/policies/ on the NAS.
#
# COLG-first per COMMUNITY-FIRST-MISSION. The chosen-approval gate is Bishop Gwin:
# nothing the family or COLG fronts theologically publishes without his approval.

package poetech.church_ops

import rego.v1

default decision := "escalate"

# ---------------------------------------------------------------------------
# DENY -- never auto-promote.
# ---------------------------------------------------------------------------
deny_reasons contains "public_publish_without_bishop_gwin_gate" if {
	input.action.name == "publish_public_content"
	not input.action.bishop_gwin_approved
}

deny_reasons contains "theological_position_taking" if {
	input.action.category == "theological_position"
}

deny_reasons contains "credential_touch" if {
	input.action.category == "credential_vault"
}

# ---------------------------------------------------------------------------
# ALLOW -- drafts and supplements that stay inside the review queue, plus
# Tier-1 generated-content fixes (typographic theology, scripture badges).
# Drafts are allowed to be PRODUCED; publishing is gated separately above.
# ---------------------------------------------------------------------------
allowed_actions := {
	"draft_sermon_to_content",
	"draft_bible_study_supplement",
	"update_ministry_calendar",
	"draft_weekly_bulletin",
	"draft_announcement_3channel",
	"fix_typographic_theology",
	"add_scripture_translation_badge",
}

allow if {
	count(deny_reasons) == 0
	allowed_actions[input.action.name]
	pending_bishop_gwin_review
}

# Sermon-to-content drafts are explicitly pending Bishop Gwin review before publish.
pending_bishop_gwin_review if {
	input.action.target == "bishop_gwin_review_queue"
}

pending_bishop_gwin_review if {
	not input.action.requires_publish
}

# ---------------------------------------------------------------------------
# ESCALATE -- doctrinal claims need verification against the Worldview spine
# and the SCRIPTURE-REFERENCE-STANDARD before they enter any draft as fact.
# ---------------------------------------------------------------------------
escalate_actions := {
	"verify_doctrinal_claim",
	"publish_public_content",
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
