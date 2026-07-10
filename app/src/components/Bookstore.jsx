// =============================================================================
// Bookstore — the monetized book line + unified subscriber + gated conversation
// =============================================================================
// Darrell, 2026-06-25: full books from his Spiritual Module + his other work
// (his voice/IP), SOLD; purchasers unlock an in-app conversation space around
// the book; ONE unified subscriber spans the tiers with 90 days free app access.
//
// BINDING: money is the owner's hand. This surface is the STOREFRONT +
// ENTITLEMENT + ACCESS only. A processor (Stripe) moves money, configured by
// Darrell (checkout-seam.js). Buying PREVIEWS the checkout request and, when the
// processor is unconfigured, never charges — it routes to Darrell's endpoint
// only once he flips it on. Pricing/publishing are preview -> execute.
//
// Mounted as the Library "Store" mode. Sovereign: catalog + entitlement +
// conversation persist device-local now; the migration (Darrell's-hand apply)
// adds the cloud tables for cross-device.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import { formatPrice, unitEconomics, trialEconomics, publishableProduct } from '../lib/commerce.js';
import {
  seedCatalog, mergeCatalog, publishedProducts, loadOverrides, saveOverrides, upsertOverride,
} from '../lib/book-catalog.js';
import {
  ensureSubscriber, loadSubscriber, saveSubscriber, trialState, appAccess,
  entitledToBook, grantBookEntitlement,
} from '../lib/entitlements.js';
import {
  conversationGate, loadConversation, saveConversation, addMessageGated, visibleMessages,
} from '../lib/book-conversation.js';
import {
  buildBookCheckoutRequest, buildSubscriptionCheckoutRequest, executeCheckout,
  checkoutEndpoint, PROCESSOR_NOTE,
} from '../lib/checkout-seam.js';

const P = { ink: '#1A1815', muted: '#5A5751', accent: '#B85838', line: '#E0DBD0', panel: '#FAF8F4' };

// Darrell flips `enabled` + sets `endpoint` once he configures his processor
// (see the design note's Darrell's-hand steps). Until then, checkout previews.
const CHECKOUT_CONFIG = { enabled: false, endpoint: checkoutEndpoint() };

const nowIso = () => new Date().toISOString();
const btn = 'text-xs px-3 py-1.5 border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]';

function TrialBanner({ sub }) {
  const t = useMemo(() => trialState(sub, nowIso()), [sub]);
  if (t.phase === 'none') return null;
  const paid = t.phase === 'paid';
  const expired = t.phase === 'expired';
  return (
    <div className="border p-3 mb-4" style={{ borderColor: expired ? P.line : P.accent, background: P.panel }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: P.accent }}>
            {paid ? 'Membership · active' : '90-day free access'}
          </div>
          <div className="text-sm" style={{ color: P.ink, fontFamily: '"Fraunces", serif' }}>{t.message}</div>
        </div>
        {t.phase === 'trial' && (
          <div className="text-right">
            <div className="text-lg font-semibold" style={{ color: P.ink }}>{t.daysLeft}</div>
            <div className="text-[10px]" style={{ color: P.muted }}>days left</div>
          </div>
        )}
      </div>
      {t.phase === 'trial' && (
        <div className="mt-2 h-1.5 w-full" style={{ background: P.line }}>
          <div style={{ width: `${t.percentElapsed}%`, height: '100%', background: P.accent }} />
        </div>
      )}
    </div>
  );
}

function ConversationPanel({ product, sub, userKey }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { setMessages(loadConversation(product.id)); }, [product.id]);
  const gate = conversationGate(sub, product, nowIso());
  const list = visibleMessages(messages, product.id);

  const post = useCallback(() => {
    const res = addMessageGated(messages, {
      userKey, authorName: userKey ? userKey.split('@')[0] : 'Reader', kind: 'comment', body: draft, at: Date.now(),
    }, { sub, product, nowIso: nowIso() });
    if (!res.ok) { setNotice(res.reason); return; }
    setMessages(res.messages); saveConversation(product.id, res.messages); setDraft(''); setNotice('');
  }, [messages, draft, userKey, sub, product]);

  if (!gate.allowed) {
    return <div className="text-xs p-2 border" style={{ borderColor: P.line, color: P.muted, background: P.panel }}>🔒 {gate.reason}</div>;
  }
  return (
    <div className="border p-2" style={{ borderColor: P.line }}>
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: P.muted }}>Conversation ({list.length})</div>
      <div className="space-y-1 max-h-48 overflow-y-auto mb-2">
        {list.length === 0 && <p className="text-xs" style={{ color: P.muted }}>Be the first to start the conversation around this book.</p>}
        {list.map((m) => (
          <div key={m.id} className="text-xs" style={{ color: P.ink }}>
            <span className="font-semibold" style={{ color: m.role === 'author' ? P.accent : P.ink }}>{m.authorName}{m.role === 'author' ? ' · author' : ''}:</span> {m.body}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask a question or share…" className="flex-1 text-xs border px-2 py-1" style={{ borderColor: P.line }} />
        <button type="button" onClick={post} className={btn} style={{ borderColor: P.ink, color: P.ink }}>Post</button>
      </div>
      {notice && <p className="text-[11px] mt-1" style={{ color: P.accent }}>{notice}</p>}
    </div>
  );
}

function GovernorEconomics({ product, onPublish, onPrice }) {
  const e = useMemo(() => unitEconomics(product, { fixedMonthlyCents: 0 }), [product]);
  const t = useMemo(() => trialEconomics({ monthlyCents: 3900, convertPct: 50 }), []);
  const [price, setPrice] = useState((product.priceCents / 100).toFixed(2));
  return (
    <div className="border p-2 mt-2" style={{ borderColor: P.accent, background: P.panel }}>
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: P.accent }}>Cost-efficiency screen (Governor)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs" style={{ color: P.ink }}>
        <span>Price</span><span>{formatPrice(e.priceCents)}</span>
        <span>Processor fee</span><span>−{formatPrice(e.processorFeeCents)}</span>
        <span>Net per sale</span><span style={{ color: e.isProfitable ? '#216E39' : P.accent }}>{formatPrice(e.netCents)} ({e.marginPct}%)</span>
        <span>Per-sale profitable</span><span>{e.isProfitable ? 'Yes' : 'No'}</span>
        <span>90-free justified</span><span>{t.justified ? 'Yes (LTV &gt; trial cost)' : 'Review'}</span>
      </div>
      <p className="text-[10px] mt-1" style={{ color: P.muted }}>{e.leanAlternative}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: P.line }}>
        <label className="text-[11px]" style={{ color: P.muted }}>Price $
          <input value={price} onChange={(e2) => setPrice(e2.target.value)} className="w-16 text-xs border px-1 py-0.5 ml-1" style={{ borderColor: P.line }} />
        </label>
        <button type="button" onClick={() => onPrice(product, Math.round(parseFloat(price || '0') * 100))} className={btn} style={{ borderColor: P.ink, color: P.ink }}>Preview → set price</button>
        {product.status !== 'published' && publishableProduct(product).ok && (
          <button type="button" onClick={() => onPublish(product)} className={`${btn} text-white`} style={{ background: P.ink, borderColor: P.ink }}>Preview → publish</button>
        )}
        {product.status === 'published' && <span className="text-[11px] text-[#216E39]">● published</span>}
      </div>
    </div>
  );
}

export default function Bookstore({ email = '', isFamilyMember = false, onReadProduct }) {
  const userKey = email || 'anon';
  const [sub, setSub] = useState(() => loadSubscriber(userKey));
  const [overrides, setOverrides] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checkoutNote, setCheckoutNote] = useState('');

  // First signed-in load starts the 90-day free app access (graceful, honest).
  useEffect(() => { setSub(ensureSubscriber(userKey, nowIso())); setOverrides(loadOverrides()); }, [userKey]);

  const catalog = useMemo(() => mergeCatalog(seedCatalog(), overrides), [overrides]);
  const forSale = useMemo(() => publishedProducts(catalog), [catalog]);
  const access = useMemo(() => appAccess(sub, nowIso()), [sub]);

  const refreshSub = useCallback((next) => { setSub(next); saveSubscriber(userKey, next); }, [userKey]);

  const buy = useCallback(async (product) => {
    const req = buildBookCheckoutRequest(product, sub, { successUrl: '#/library', cancelUrl: '#/library', nowIso: nowIso() });
    const res = await executeCheckout(req, { config: CHECKOUT_CONFIG });
    if (res.ok && res.url) { try { window.location.assign(res.url); } catch (e) { /* noop */ } return; }
    // Unconfigured processor: PREVIEW only, never charge.
    setCheckoutNote(`Checkout staged for "${product.title}" (${formatPrice(product.priceCents)}). ${PROCESSOR_NOTE}`);
  }, [sub]);

  // Convert the unified subscriber to paid (after the 90 free days, or to upgrade).
  // One subscription across the whole app — previews until the processor is live.
  const subscribe = useCallback(async (tier) => {
    const req = buildSubscriptionCheckoutRequest(tier || sub.tier || 'poetech-plus', sub, { successUrl: '#/library', cancelUrl: '#/library', nowIso: nowIso() });
    const res = await executeCheckout(req, { config: CHECKOUT_CONFIG });
    if (res.ok && res.url) { try { window.location.assign(res.url); } catch (e) { /* noop */ } return; }
    setCheckoutNote(`Subscription checkout staged (${tier || sub.tier}). ${PROCESSOR_NOTE}`);
  }, [sub]);

  // Governor-only local grant so the entitlement + conversation can be exercised
  // before the processor is live. Real purchases grant via the webhook.
  const markOwned = useCallback((product) => { refreshSub(grantBookEntitlement(sub, product.id)); }, [sub, refreshSub]);

  const publish = useCallback((product) => {
    const next = upsertOverride(overrides, { id: product.id, status: 'published' });
    setOverrides(next); saveOverrides(next);
  }, [overrides]);
  const setPrice = useCallback((product, priceCents) => {
    const next = upsertOverride(overrides, { id: product.id, priceCents });
    setOverrides(next); saveOverrides(next);
  }, [overrides]);

  return (
    <div className="max-w-4xl">
      <SectionTitle eyebrow="Books · Store">The Bookstore</SectionTitle>
      <p className="text-sm mb-3" style={{ color: P.muted }}>
        Full books from Darrell's teaching — yours to read, with a conversation space for everyone who has the book.
      </p>

      <TrialBanner sub={sub} />
      {!access.fullApp && access.phase === 'expired' && (
        <button type="button" onClick={() => subscribe(sub.tier)} className={`${btn} text-white mb-3`} style={{ background: P.ink, borderColor: P.ink }}>
          Restore full access →
        </button>
      )}

      {checkoutNote && (
        <div className="border p-2 mb-3 text-xs" style={{ borderColor: P.accent, background: P.panel, color: P.ink }}>{checkoutNote}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forSale.map((product) => {
          const owned = entitledToBook(sub, product, nowIso());
          const open = selected === product.id;
          return (
            <div key={product.id} className="border bg-white p-3" style={{ borderColor: P.line }}>
              <div className="flex items-start gap-2">
                <div className="text-2xl" aria-hidden="true">{product.coverEmoji}</div>
                <div className="flex-1">
                  <div className="font-semibold" style={{ color: P.ink, fontFamily: '"Fraunces", serif' }}>{product.title}</div>
                  <div className="text-[11px] italic" style={{ color: P.muted }}>{product.subtitle} · {product.author}</div>
                  <p className="text-xs mt-1" style={{ color: P.ink }}>{product.blurb}</p>
                </div>
                <div className="text-sm font-semibold" style={{ color: P.accent }}>{owned ? 'Owned' : formatPrice(product.priceCents)}</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {owned
                  ? <button type="button" onClick={() => onReadProduct && onReadProduct(product)} className={`${btn} text-white`} style={{ background: P.ink, borderColor: P.ink }}>Read</button>
                  : <button type="button" onClick={() => buy(product)} className={`${btn} text-white`} style={{ background: P.accent, borderColor: P.accent }}>Buy {formatPrice(product.priceCents)}</button>}
                <button type="button" onClick={() => setSelected(open ? null : product.id)} className={btn} style={{ borderColor: P.line, color: P.muted }}>{open ? 'Hide' : 'Conversation'}</button>
                {isFamilyMember && !owned && <button type="button" onClick={() => markOwned(product)} className={btn} style={{ borderColor: P.line, color: P.muted }} title="Governor test — real purchases grant via the processor">Mark owned (test)</button>}
              </div>
              {open && <div className="mt-2"><ConversationPanel product={product} sub={sub} userKey={userKey} /></div>}
              {isFamilyMember && <GovernorEconomics product={product} onPublish={publish} onPrice={setPrice} />}
            </div>
          );
        })}
      </div>

      {isFamilyMember && (
        <div className="mt-4 border p-3" style={{ borderColor: P.line }}>
          <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: P.muted }}>Drafts (Governor)</div>
          {catalog.filter((p) => p.status !== 'published').map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-xs py-1" style={{ color: P.ink }}>
              <span>{p.coverEmoji} {p.title} <span style={{ color: P.muted }}>— {p.blurb}</span></span>
              {publishableProduct(p).ok
                ? <button type="button" onClick={() => publish(p)} className={btn} style={{ borderColor: P.ink, color: P.ink }}>Publish</button>
                : <span className="text-[10px]" style={{ color: P.muted }}>{publishableProduct(p).reasons[0]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
