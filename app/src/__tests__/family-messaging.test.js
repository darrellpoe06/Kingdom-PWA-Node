// Family messaging — pure-logic + the no-leak guard (sibling privacy, guardian
// oversight, no external leak). The guard rides the required `app — lint + vitest`
// check; anti-theater per DR-0060 (proven to CATCH the leak, not just pass clean).
import { describe, it, expect } from 'vitest';
import {
  decideFamilySend, composeFamilyMessage, buildGenerationsInvite,
  threadBetween, unreadFor, MINOR_TIERS,
} from '../lib/family-messaging.js';
import { scanFamilyMessaging } from '../../../scripts/family-messaging-guard.mjs';

describe('family-messaging — child-safety + tier gating (pure)', () => {
  it('an adult/member may message within the family', () => {
    const d = decideFamilySend({ senderRole: 'member', senderTier: 'adult' });
    expect(d.allowed).toBe(true);
    expect(d.requiresApproval).toBe(false);
  });

  it('a child may ALWAYS reach a guardian (asking a parent is never gated to deny)', () => {
    // message.family default is APPROVAL -> reaching a guardian needs approval, not deny.
    const d = decideFamilySend({ senderRole: 'child', senderTier: 'under13', recipientIsGuardian: true });
    expect(d.requiresApproval).toBe(true);
    expect(d.reason).toMatch(/guardian/i);
  });

  it('a child reaching a guardian is free when the guardian set message.family = allow', () => {
    const d = decideFamilySend({
      senderRole: 'child', senderTier: 'under13', recipientIsGuardian: true,
      childConfig: { 'message.family': 'allow' },
    });
    expect(d.allowed).toBe(true);
    expect(d.requiresApproval).toBe(false);
  });

  it('UNDER-13 messaging a NON-guardian (sibling) needs guardian approval even if allowed', () => {
    const d = decideFamilySend({
      senderRole: 'child', senderTier: 'under13', recipientIsGuardian: false,
      childConfig: { 'message.family': 'allow' }, // guardian allowed it...
    });
    expect(d.allowed).toBe(false);          // ...but the under-13 tier floor still gates it
    expect(d.requiresApproval).toBe(true);
  });

  it('a TEEN follows the capability setting when messaging a non-guardian', () => {
    const allow = decideFamilySend({ senderRole: 'child', senderTier: 'teen', recipientIsGuardian: false, childConfig: { 'message.family': 'allow' } });
    expect(allow.allowed).toBe(true);
    const deflt = decideFamilySend({ senderRole: 'child', senderTier: 'teen', recipientIsGuardian: false });
    expect(deflt.requiresApproval).toBe(true); // default is approval
  });

  it('a denied child (guardian set deny) cannot send', () => {
    const d = decideFamilySend({ senderRole: 'child', senderTier: 'teen', childConfig: { 'message.family': 'deny' } });
    expect(d.allowed).toBe(false);
    expect(d.requiresApproval).toBe(false);
  });

  it('compose validates body + recipient and matches the DB shape', () => {
    expect(() => composeFamilyMessage({ recipientUserId: 'u1', body: '   ' })).toThrow(/empty/);
    expect(() => composeFamilyMessage({ body: 'hi' })).toThrow(/recipient/);
    const row = buildGenerationsInvite({ senderUserId: 'dad', recipientUserId: 'kid', toName: 'Christian' });
    expect(row.kind).toBe('invite');
    expect(row.context).toBe('generations-game');
    expect(row.recipient_user_id).toBe('kid');
    expect(row.body).toMatch(/Generations game/i);
  });

  it('thread + unread helpers are pure and correct', () => {
    const msgs = [
      { sender_user_id: 'dad', recipient_user_id: 'kid', sent_at: '2', read_at: null },
      { sender_user_id: 'kid', recipient_user_id: 'dad', sent_at: '1', read_at: '9' },
      { sender_user_id: 'mom', recipient_user_id: 'sib', sent_at: '3', read_at: null },
    ];
    const t = threadBetween(msgs, 'dad', 'kid');
    expect(t.map((m) => m.sent_at)).toEqual(['1', '2']); // sorted, only the dad<->kid pair
    expect(unreadFor(msgs, 'kid')).toBe(1);
    expect(MINOR_TIERS).toContain('under13');
  });
});

describe('family-messaging guard — sibling privacy + no external leak (DR-0060)', () => {
  it('the REAL migration passes (participant/guardian-scoped, instance-bound, no anon)', () => {
    const { ok, problems } = scanFamilyMessaging();
    expect(ok, problems.join('; ')).toBe(true);
  });

  it('CATCHES an instance-only SELECT policy (siblings could read each other)', () => {
    const leak = `
      ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;
      CREATE POLICY family_messages_read ON family_messages FOR SELECT TO authenticated
        USING (user_in_instance(instance_id));
      CREATE POLICY family_messages_insert ON family_messages FOR INSERT TO authenticated
        WITH CHECK (user_in_instance(instance_id) AND sender_user_id = auth.uid());`;
    const { ok, problems } = scanFamilyMessaging(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/sibling privacy/i);
  });

  it('CATCHES a USING (true) read policy', () => {
    const leak = `
      ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;
      CREATE POLICY family_messages_read ON family_messages FOR SELECT TO authenticated USING (true);
      CREATE POLICY family_messages_insert ON family_messages FOR INSERT TO authenticated
        WITH CHECK (sender_user_id = auth.uid());`;
    const { ok } = scanFamilyMessaging(leak);
    expect(ok).toBe(false);
  });

  it('CATCHES a spoofable sender (insert not pinned to auth.uid())', () => {
    const leak = `
      ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;
      CREATE POLICY family_messages_read ON family_messages FOR SELECT TO authenticated
        USING (user_in_instance(instance_id) AND (sender_user_id = auth.uid() OR recipient_user_id = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin')));
      CREATE POLICY family_messages_insert ON family_messages FOR INSERT TO authenticated
        WITH CHECK (user_in_instance(instance_id));`;
    const { ok, problems } = scanFamilyMessaging(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/spoofable sender/i);
  });

  it('CATCHES an anon grant (family messaging must be internal)', () => {
    const leak = `
      ALTER TABLE family_messages ENABLE ROW LEVEL SECURITY;
      GRANT SELECT ON family_messages TO anon;
      CREATE POLICY family_messages_read ON family_messages FOR SELECT TO authenticated
        USING (user_in_instance(instance_id) AND (sender_user_id = auth.uid() OR recipient_user_id = auth.uid() OR user_role_in_instance(instance_id) IN ('owner','admin')));
      CREATE POLICY family_messages_insert ON family_messages FOR INSERT TO authenticated
        WITH CHECK (sender_user_id = auth.uid());`;
    const { ok, problems } = scanFamilyMessaging(leak);
    expect(ok).toBe(false);
    expect(problems.join(' ')).toMatch(/anon/i);
  });
});
