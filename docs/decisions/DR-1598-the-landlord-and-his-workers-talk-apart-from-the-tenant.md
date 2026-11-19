# DR-1598: The landlord and his workers talk apart from the tenant, and the tenant is told where things are

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (new RLS-walled tables; tenant privacy)
**Type:** feature
**Area:** Poe Properties: Messages, Systems, My place, My work orders; migration 0338
**Pairs with:** DR-1594 / DR-1597 (workers get and see their jobs), DR-0871 (every message on the record), DR-0060 (RLS is the gate), DR-0076

## Context

Darrell, 2026-11-19: *"Land lords and owners should be able to see their 1099 workers work and texts about the properties when they go... We should be able to see and message each other about the properties however the tenants should only have access to message we send them and what and where certain things are like baseboard heating etc..."* Then: *"We want the message about the properties to be able to have tenant communications however we also need the separation of the conversation so both/ all options."* And: *"Only in group chats... one with the tenants being able to see what's happening and another for sensitive information... so 1099 and landlord can discuss and others who we want can be added etc..."*

Traced (DR-0219): `tenant_messages` is one thread per tenancy that the tenant, household, landlord, a manager with `message.tenant`, and a worker the door enabled all read and write (0150). Nothing was ever written there as staff-only, so no existing row is exposed. What did not exist was a chat a tenant cannot read. `property_systems` already holds each system's `location_note`; nothing showed it to the tenant.

## What was measured

- `tenant_messages_read` (0150:241): owner/admin/member, the tenant, the household, `message.tenant` delegates and `user_is_enabled_worker`; the table has no audience column, so every row is the tenant thread.
- No table on main held a conversation the tenant could not read.
- `property_systems.location_note` (0156:154) exists; its read policy (0156:207) is instance members only, so a tenant was never shown it.

## Decision

1. **The tenant group chat is `tenant_messages`, unchanged.** Every existing message stays where its readers see it. On staff faces it is now titled "Tenant group chat · the tenant sees everything here".
2. **A staff group chat per door (0338):** chats, a member list (who added whom and when; who removed whom and when), and messages.
   - Readers: the instance's owner or admin, and active members. Never the door's tenant or household, even with a member row written by hand.
   - The owner, a family member or a manager of that door adds and removes people. The worker assigned a job on the door joins by himself.
   - Each chat has its own box ("Send to staff only"), so the place is the choice and nothing reaches a tenant by accident. A worker reaches it from each job in My work orders.
3. **Where things are:** `property_systems.share_with_tenant`, which the landlord turns on per system once it says where it is. `where_things_are(tenancy)` returns only name, kind and place to that door's tenant and household. It shows on the tenant's My place.
4. **The worker's work is the landlord's to see:** his notes, pictures and status changes already sit on the job and the door's timeline under his name (DR-0871/0899). His messages to the landlord are now in the staff chat, which the landlord always reads.

## Verification

- `0338-staff-chat-and-where-things-are-smoke.sql` on PostgreSQL 16 after the door-work chain, 0337 and 0338 (applied twice): `STAFF CHAT SMOKE: PASS`.
- Proven to catch:
  - without the lives-at-door check, a forged tenant member row reads the chat;
  - without the assignment trigger, no chat is made.
- The 0260, 0306, 0310 and 0337 smokes still pass.
- `the-staff-talk-apart-from-the-tenant.test.jsx` (17): without the lives-here filter, the add-list test fails. A default made inside StaffChat's signature re-opened the chat on every render (a loop the journey tests caught); it is one module constant, and a test pins it. `a-message-stays-on-a-vacant-door` now finds the tenant thread's box by its label, since Messages holds two.

## Not done

There is no per-job staff chat, only one per door; a job's talk is held in its door's chat. `re-review: 2026-12-10`.
