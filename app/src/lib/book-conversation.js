// book-conversation.js — PURCHASER-GATED conversation space, one per book.
//
// Darrell, 2026-06-25: those who PURCHASE a book get access to an in-app
// conversation/community space around that book (discussion, Q&A, the
// author/community interacting). Entitlement-gated: purchase (or tier inclusion)
// unlocks the book's conversation. Value-add + retention loop.
//
// Reuses the discussions shape (kind/body/author) but scopes to a bookProductId
// and gates on entitlement (entitlements.js). PURE helpers + a fail-soft local
// store; cloud is the book_conversations table (migration, Darrell's-hand apply).

import { entitledToBook } from './entitlements.js';

const asStr = (v) => (typeof v === 'string' ? v : '');
const asArr = (v) => (Array.isArray(v) ? v : []);
const asNum = (v, d = 0) => (Number.isFinite(v) ? v : d);

export const MESSAGE_KINDS = ['question', 'comment', 'answer'];

// The gate: can THIS subscriber take part in THIS book's conversation?
export function conversationGate(sub, product, nowIso) {
  if (!product || !product.conversationEnabled) {
    return { allowed: false, reason: 'This book does not have a conversation space yet.' };
  }
  if (entitledToBook(sub, product, nowIso)) return { allowed: true, reason: '' };
  return { allowed: false, reason: 'Purchase this book to join its conversation — readers and the author talk here.' };
}

export function normalizeMessage(raw = {}) {
  return {
    id: asStr(raw.id) || `msg-${asStr(raw.bookProductId)}-${asNum(raw.at, 0)}`,
    bookProductId: asStr(raw.bookProductId),
    userKey: asStr(raw.userKey),
    authorName: asStr(raw.authorName) || 'Reader',
    role: raw.role === 'author' ? 'author' : 'reader',
    kind: MESSAGE_KINDS.includes(raw.kind) ? raw.kind : 'comment',
    body: asStr(raw.body),
    at: asNum(raw.at, 0),
  };
}

export function visibleMessages(messages, bookProductId) {
  return asArr(messages)
    .map(normalizeMessage)
    .filter((m) => m.bookProductId === asStr(bookProductId) && m.body)
    .sort((a, b) => a.at - b.at);                       // oldest-first thread
}

export function messageCounts(messages, bookProductId) {
  const list = visibleMessages(messages, bookProductId);
  return {
    total: list.length,
    questions: list.filter((m) => m.kind === 'question').length,
    fromAuthor: list.filter((m) => m.role === 'author').length,
  };
}

// Append a post ONLY if the subscriber is entitled (the gate is enforced in the
// data path, not just the UI). Returns the new list + the gate result.
export function addMessageGated(messages, draft, { sub, product, nowIso } = {}) {
  const gate = conversationGate(sub, product, nowIso);
  if (!gate.allowed) return { ok: false, reason: gate.reason, messages: asArr(messages) };
  const msg = normalizeMessage({ ...draft, bookProductId: asStr(product?.id) });
  if (!msg.body.trim()) return { ok: false, reason: 'Write something first.', messages: asArr(messages) };
  return { ok: true, reason: '', messages: [...asArr(messages), msg] };
}

// --- device-local store (fail-soft) -----------------------------------------

function safeStore(store) {
  try { return store || ((typeof localStorage !== 'undefined' && localStorage) ? localStorage : null); } catch { return null; }
}
export function conversationKey(bookProductId) { return `poe-book-convo.${asStr(bookProductId)}`; }

export function loadConversation(bookProductId, store) {
  const ls = safeStore(store);
  if (!ls) return [];
  try { const raw = ls.getItem(conversationKey(bookProductId)); return raw ? asArr(JSON.parse(raw)).map(normalizeMessage) : []; }
  catch { return []; }
}

export function saveConversation(bookProductId, messages, store) {
  const ls = safeStore(store);
  if (!ls) return { skipped: 'no-storage' };
  try { ls.setItem(conversationKey(bookProductId), JSON.stringify(asArr(messages).map(normalizeMessage))); return { saved: true }; }
  catch (e) { return { skipped: 'write-error', error: e }; }
}
