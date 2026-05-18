# Ecosystem Participants — External stakeholders get scoped portals into the operator's instance

> Founder direction (2026-05-18):
> *"We want to add user profiles for Contractors so the 1099 user can get all the necessary information and see everything that project or service needs are — even an estimated timeline based on the information they get from the user's requirements, with an ability to connect with the customer and/or team with ease. Also need to be able to give our tenants user access to get information. Everyone using the app for business will have the ability to have users who support their work — and this should track those interactions between our ecosystem."*

Extends `IDENTITY-ROLES-AUDIT.md` from **internal users** (the family / business operators) to **external participants** — the people the operator serves or works with. Same audit framework, different access scope. Binding from r28 onwards.

---

## The two-layer model

| Layer | Who | Examples | Default scope |
|---|---|---|---|
| **Internal** | The operator's team running the instance | Owner, Editor, Contributor, Viewer, Specialist | Full operator data per role / scope per `IDENTITY-ROLES-AUDIT.md` |
| **External** | People the operator interacts with from outside | Contractor, Tenant, Client, Donor, Parishioner, Volunteer, Customer, Vendor | Only their own data + the operator-published shared bits |

A single physical person can hold both layers (e.g., Christina is internal Editor on the PoeTech instance AND would be a Client if she ever used TLC's instance — different instances, different roles).

---

## External participant types — first-class data shapes

Seven types ship in the framework; instance templates pre-enable a subset:

| Type | Linked to | What they see | What they can do |
|---|---|---|---|
| **Contractor** (1099) | A 1099 record in `contractors1099[]` | Assigned projects + scope + materials policy + estimated timeline + their YTD payments | Upload invoices, post status updates, message project owner, submit time logs |
| **Tenant** | A rental property in `rentals[]` | Their lease, rent payment status, maintenance request history | Submit a maintenance request, message landlord/property manager, view lease docs, mark rent paid |
| **Client** (Practice — non-PHI) | An inquiry in `inquiries[]` | Their intake status, next-step prompts, booked appointment summary | Update contact info, reschedule (links out to Acuity), message intake coordinator. **PHI stays in Acuity, never SKOS.** |
| **Donor** (Church / Nonprofit) | A donor record (future entity) | Their giving history, impact updates, upcoming events they're invited to | View tax statements, RSVP to events, message stewardship lead |
| **Parishioner** (Church) | A member record (future entity) | Care notes addressed to them, prayer request status, ministry signups | Submit a prayer request, sign up for ministry, message pastor |
| **Volunteer** (Nonprofit / Church) | A volunteer record (future entity) | Assigned shifts, hours logged, impact summaries | Log hours, swap shifts, message coordinator |
| **Customer** (Small biz) | A customer record (future entity) | Order/account status, support tickets, invoices | Submit support ticket, view order history, pay invoice |

Each type has a standard data shape:

```js
{
  id: 'ext-<random>',
  type: 'contractor' | 'tenant' | 'client' | 'donor' | 'parishioner' | 'volunteer' | 'customer',
  name: '<displayed to operator>',
  email: '<for invitations + magic-link login when Phase 3 ships>',
  phone: '<optional, for SMS notifications if Twilio wired>',
  linkedEntityType: 'contractor1099' | 'rental' | 'inquiry' | …,
  linkedEntityId: '<id of the internal record they're tied to>',

  // Access status
  inviteStatus: 'not-invited' | 'invited' | 'accepted' | 'revoked',
  invitedAt: null | '<iso>',
  invitedBy: '<internal user id>',
  acceptedAt: null,
  lastSeenAt: null,

  // Scoped permissions — what THEY can see + do
  permissions: ['view-own-lease', 'submit-maintenance-request', …],

  // Interactions log — every back-and-forth
  interactions: [
    {
      at: '<iso>',
      direction: 'inbound' | 'outbound',          // from external user → us, or us → them
      channel: 'in-app' | 'email' | 'sms' | 'phone' | 'in-person',
      kind: 'message' | 'status-update' | 'file-share' | 'request' | 'payment' | 'visit',
      summary: '<short>',
      byInternalUser: '<id, if outbound from us>',
      attachments: [],   // pointer list — actual files in operator's storage
      lifecycleNote: '<optional context for audit>',
    },
  ],

  // Standard fields shared with every entity in the system
  lifecycle: { phase, openedAt, closedAt, log: [] },
  links: [],            // per CONNECTED-CONTEXT.md
  notes: '<operator-side internal notes — never visible to the external user>',
}
```

Important: **the `notes` field is internal-only**. The external user sees everything in `interactions[]` and everything they're permitted via `permissions[]`, but never the internal `notes`. The system enforces this at the data layer, not just the UI layer.

---

## Permissions — least-privilege by default

Each external type ships with a default permissions list. The operator can tighten it per-participant; they cannot grant beyond the type's maximum.

### Contractor (1099) — default permissions

- `view-assigned-projects` — see project title, scope, dates, materials policy, estimated timeline
- `view-own-payments-ytd` — see their own YTD paid
- `view-own-1099-readiness` — see if their W-9 is on file, their 1099 status for tax season
- `submit-status-update` — post status on assigned projects (e.g., "20% complete, hit electrical issue, ETA pushed 2 days")
- `submit-invoice` — upload invoice files
- `submit-time-log` — log hours for hourly contracts
- `message-project-owner` — in-app messaging to the operator

### Tenant — default permissions

- `view-own-lease` — read lease document + key terms
- `view-own-rent-history` — see what they've paid + when
- `view-payment-due` — see next payment + amount + grace period
- `submit-maintenance-request` — create a maintenance issue tied to their unit
- `submit-payment-confirmation` — mark a payment as sent (operator confirms)
- `message-landlord` — in-app messaging

### Client (Practice — non-PHI only)

- `view-own-inquiry-status` — see if they're new/contacted/scheduled
- `view-next-step` — what the operator asked them to do next
- `update-contact-info` — change their own phone/email
- `message-intake-coordinator` — in-app messaging
- *(Anything PHI-adjacent — diagnoses, session notes, treatment plans — stays in Acuity. Per `LEGAL-PRIVACY-BOUNDARY.md` + TLC isolation.)*

### Other types follow the same pattern

(Donor / Parishioner / Volunteer / Customer — defaults shipped with the relevant instance templates per `MULTI-INSTANCE-STRATEGY.md`.)

---

## How interactions get tracked

Every back-and-forth between an internal user and an external participant writes an `interaction` entry on the external user record AND a lifecycle log entry on the linked internal entity. Bidirectional visibility:

- **Internal users see:** "5 interactions this month with Tenant Tracy — last one 2 days ago, she submitted a maintenance request that's still open."
- **External users see:** "Christina replied to your maintenance request 3 hours ago — she said the plumber comes Tuesday."

Same data, two views. The audit log records who sent what and when, for compliance and handoff continuity. When a property manager leaves and a new one takes over, the new one opens the tenant's profile and sees the full conversation history.

---

## Implementation phases — same shape as IDENTITY-ROLES-AUDIT

| Phase | What ships | Cost |
|---|---|---|
| **Phase 1 (NOW)** | Data shape support: each `contractor1099` and `rental` can carry an `externalProfile` block (name + email + phone + permissions + notes). No external login. Operator manually emails / texts / calls. Interactions logged manually via existing conversation logs. | $0 |
| **Phase 2 (with local-profile rollout)** | Operator can mark an external participant as "invitable" + see a preview of the portal they'd get. Still no external login. | $0 |
| **Phase 3 (with cloud auth)** | Real external user accounts via **email magic link** (no password). External user clicks link in email → lands on their portal → can interact. All scoped by `permissions[]`. | $0 — magic-link email via free Cloudflare email worker or SES free tier (200/day) |
| **Phase 4 (enterprise)** | SSO for contractor agencies that have their own identity provider, bulk invite + revoke, custom portal branding per operator. | Roll-up into enterprise tier pricing |

---

## Zero-cost guarantee

Per the founder's standing rule (no per-user fees from PoeTech, ever):

- **In-app messaging** uses the same Cloudflare Worker + D1 stack — free tier covers thousands of customers.
- **Email magic-link auth** (Phase 3) uses Cloudflare's free 1k-email/day allowance OR SES free tier.
- **SMS** is optional, opt-in per operator. Operator brings their own Twilio key (per the BYOK pattern from RentCast); their phone bill, not PoeTech's.
- **File attachments** stored in Cloudflare R2 ($0.015/GB-month, only when used; first 10GB free). Most operators stay in free tier.

No per-external-user fees ever. A property manager with 50 tenants, a contractor agency with 100 contractors, a church with 500 parishioners — all $0 to PoeTech.

---

## Scaling pitfalls — and mitigations

1. **External user impersonation.** Magic-link emails could be forwarded. Mitigation: short-lived link (15 min), one-use, single-device binding after first claim.
2. **Spam / abuse from external users.** A tenant could spam a landlord with messages. Mitigation: operator can pause an external user's messaging (per-participant flag); rate-limit at the Worker (e.g., 20 inbound messages per external user per day).
3. **Confidentiality leakage.** An operator types something privileged in a message thinking it's internal. Mitigation: any field marked `notes` is internal-only and never sent to external user; messages have a clear "Sent to [Tenant Name]" header before send.
4. **HIPAA boundary.** Client portals (TLC clients) must NOT enable PHI exchange via the in-app channel. Mitigation: Client type ships with messaging DISABLED by default for therapy-practice instance template; operator must explicitly enable AND acknowledge they've stripped PHI.
5. **External user permission creep.** Operator grants too many permissions over time. Mitigation: quarterly review prompt — "Tracy hasn't used `submit-payment-confirmation` in 6 months; revoke?"
6. **Departure handoffs.** A contractor finishes their last project; their access should expire. Mitigation: auto-revoke 30 days after `lifecycle.phase === 'closed'` on the linked record, with operator override.
7. **Aggregate audit log load.** Thousands of external interactions per instance could balloon the lifecycle log. Mitigation: per-entity log capped at 500 entries with rollup beyond that; full archive in Cloudflare R2 for compliance retrieval.
8. **Cross-instance contamination.** An external user with accounts at two PoeTech-powered businesses must not see one from the other. Mitigation: external user accounts are per-instance, scoped by instance_id at the Worker; same email at two instances = two separate accounts.
9. **Family-friendliness vs. business polish.** A family using SKOS for household management does NOT need external user portals; surfaces should hide when no external participants exist. Mitigation: per-instance enable/disable; default OFF for `family` instance type, default ON for `small-business` / `property-management` / `church` / `nonprofit` / `therapy-practice` (with the HIPAA caveat) / `trades` templates.
10. **"Notes" leakage to external users.** As above — internal field never serialized to external view. Test coverage required before Phase 3 ships.

---

## Cross-references

- `IDENTITY-ROLES-AUDIT.md` — the internal-user framework this extends.
- `CONNECTED-CONTEXT.md` — every external user is a node in the link graph (Contractor ↔ Project ↔ Scope ↔ Invoice; Tenant ↔ Property ↔ Lease ↔ Maintenance Request).
- `LIFECYCLE-AND-HANDOFF.md` — interactions feed the lifecycle log for the linked entity + the external user record.
- `EDITABLE-EVERYWHERE.md` — operator-side, every external participant record is editable inline. External-user-side, only their own scoped fields.
- `LEGAL-PRIVACY-BOUNDARY.md` — Client (TLC) participants ship with messaging disabled by default; HIPAA stays in Acuity.
- `MULTI-INSTANCE-STRATEGY.md` — Phase 3 backend is the auth + portal infrastructure; same Workers cover external users.
- `MODULAR-EXTENSIBILITY.md` — each external type's portal is its own module under `components/portals/{Type}.jsx`.
- `SITUATIONAL-PEACE.md` — when a tenant emails about a leak at 11pm, the operator sees it in their queue tomorrow morning with full context, not as a chaos-inducing surprise.
- `FOUNDERS-CONFESSION.md` — these are people, not just records. The interactions log honors the relationship.

---

## What ships in this round (r28+)

1. **Foundation locked.** This doc. ✓
2. **Data shape on existing entities:**
   - `contractor1099.externalProfile = { name, email, phone, permissions: [], inviteStatus: 'not-invited', notes }` (defaults applied when the field is absent — backward compatible)
   - `rental.tenantProfile = { name, email, phone, permissions: [], inviteStatus: 'not-invited', notes }` (when set; rentals already have tenant fields, this adds the access-layer block)
3. **UI hint:** small "🔗 Will be inviteable when external portal ships" badge on the contractor / tenant edit panels, so users see the path coming.
4. **Defer Phase 3 implementation** to dedicated rounds when cloud auth ships. The data shape exists now so existing records get the field for free; future portal code just reads/writes it.

---

**End of document.** Binding. Every new external participant type must implement the standard `externalProfile` shape, ship with default-least-privilege permissions, and route all interactions through the audit log. The internal `notes` field is never serialized to external views. PoeTech central never charges per external user. The framework scales from a one-person therapy practice with 20 clients to a property-management firm with 5,000 tenants without re-architecture — same data shape, same Workers, same costs.
