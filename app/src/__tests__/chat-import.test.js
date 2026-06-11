// chat-import — staged Synology Chat history must parse the export variants,
// dedup safely on re-import, and never invent data. See lib/chat-import.js.
import { describe, it, expect } from 'vitest';
import { parseChatHistory, toConversationEntries } from '../lib/chat-import.js';

describe('parseChatHistory', () => {
  it('parses a bare array with epoch-seconds timestamps', () => {
    const out = parseChatHistory([
      { id: 101, ts: 1718040000, user: 'Darrell', text: 'Furnace fixed, $450 to Mike' },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({ sourceId: '101', date: '2024-06-10', person: 'Darrell', text: 'Furnace fixed, $450 to Mike' });
  });

  it('accepts { messages: [...] } wrapper, ms timestamps, and field-name variants', () => {
    const out = parseChatHistory({
      messages: [
        { post_id: 'p-7', created_at: 1718040000000, username: 'Christina', message: 'Tenant called about the roof' },
        { id: 8, date: '2025-03-02T10:00:00Z', author: 'Darrell', content: 'Roofer quoted $2,800' },
      ],
    });
    expect(out).toHaveLength(2);
    expect(out[0].sourceId).toBe('p-7');
    expect(out[0].date).toBe('2024-06-10');
    expect(out[0].person).toBe('Christina');
    expect(out[1].date).toBe('2025-03-02');
    expect(out[1].text).toBe('Roofer quoted $2,800');
  });

  it('drops empty / textless messages and tolerates garbage', () => {
    expect(parseChatHistory([null, {}, { id: 1, ts: 1718040000, text: '' }, 'nonsense'])).toHaveLength(0);
    expect(parseChatHistory(null)).toHaveLength(0);
    expect(parseChatHistory({ nope: true })).toHaveLength(0);
  });
});

describe('toConversationEntries', () => {
  const msgs = [
    { sourceId: '101', date: '2024-06-10', person: 'Darrell', text: 'Furnace fixed' },
    { sourceId: '102', date: '2024-07-01', person: 'Christina', text: 'New tenant moved in' },
  ];

  it('maps staged messages to conversation-log entries with provenance', () => {
    const entries = toConversationEntries(msgs, []);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      id: 'cv-chat-101',
      date: '2024-06-10',
      person: 'Darrell',
      summary: 'Furnace fixed',
      source: 'synology-chat',
      sourceId: '101',
    });
  });

  it('re-import is safe: already-imported sourceIds are skipped', () => {
    const existing = toConversationEntries([msgs[0]], []);
    const second = toConversationEntries(msgs, existing);
    expect(second).toHaveLength(1);
    expect(second[0].sourceId).toBe('102');
    // hand-written log entries (no sourceId) never block imports
    const third = toConversationEntries(msgs, [{ id: 'cv-1', summary: 'manual note' }]);
    expect(third).toHaveLength(2);
  });
});
