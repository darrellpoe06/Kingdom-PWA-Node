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

// Themed classes, never inline hex — same law as Library.jsx (2026-07-30
// midnight-illegibility fix); pinned by library-theme-classes.test.js.

// Darrell arms checkout by setting VITE_CHECKOUT_ENABLED=true in the deploy env
// once his processor keys are configured (DR-0230 runbook Step 4) — an env flip,
// never a source edit (2026-07-28 review, A1). Until then, checkout previews.
const CHECKOUT_CONFIG = { enabled: import.meta.env?.VITE_CHECKOUT_ENABLED === 'true', endpoint: checkoutEndpoint() };

const nowIso = () => new Date().toISOString();
const btn = 'text-xs px-3 py-1.5 border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]';

function TrialBanner({ sub }) {
  const t = useMemo(() => trialState(sub, nowIso()), [sub]);
  if (t.phase === 'none') return null;
  const paid = t.phase === 'paid';
  const expired = t.phase === 'expired';
  return (
    <div className={`border p-3 mb-4 bg-[#FAF8F4] ${expired ? 'border-[#E8E4DC]' : 'border-[#B85838]'}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="text-[0.6875rem] uppercase tracking-wider font-semibold text-[#B85838]" >
            {paid ? 'Membership · active' : '90-day free access'}
          </div>
          <div className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t.message}</div>
        </div>
        {t.phase === 'trial' && (
          <div className="text-right">
            <div className="text-lg font-semibold text-[#1A1815]" >{t.daysLeft}</div>
            <div className="text-[0.625rem] text-[#5A5751]" >days left</div>
          </div>
        )}
      </div>
      {t.phase === 'trial' && (
        <div className="mt-2 h-1.5 w-full bg-[#E8E4DC]" >
          <div className="h-full bg-[#B85838]" style={{ width: `${t.percentElapsed}%` }} />
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
    return <div className="text-xs p-2 border border-[#E8E4DC] text-[#5A5751] bg-[#FAF8F4]">🔒 {gate.reason}</div>;
  }
  return (
    <div className="border p-2 border-[#E8E4DC]" >
      <div className="text-[0.6875rem] uppercase tracking-wider mb-1 text-[#5A5751]" >Conversation ({list.length})</div>
      <div className="space-y-1 max-h-48 overflow-y-auto mb-2">
        {list.length === 0 && <p className="text-xs text-[#5A5751]" >Be the first to start the conversation around this book.</p>}
        {list.map((m) => (
          <div key={m.id} className="text-xs text-[#1A1815]" >
            <span className={`font-semibold ${m.role === 'author' ? 'text-[#B85838]' : 'text-[#1A1815]'}`}>{m.authorName}{m.role === 'author' ? ' · author' : ''}:</span> {m.body}
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ask a question or share…" className="flex-1 text-xs border px-2 py-1 border-[#E8E4DC]"  />
        <button type="button" onClick={post} className={btn} className="border-[#1A1815] text-[#1A1815]" >Post</button>
      </div>
      {notice && <p className="text-[0.6875rem] mt-1 text-[#B85838]" >{notice}</p>}
    </div>
  );
}

function GovernorEconomics({ product, onPublish, onPrice }) {
  const e = useMemo(() => unitEconomics(product, { fixedMonthlyCents: 0 }), [product]);
  const t = useMemo(() => trialEconomics({ monthlyCents: 3900, convertPct: 50 }), []);
  const [price, setPrice] = useState((product.priceCents / 100).toFixed(2));
  return (
    <div className="border p-2 mt-2 border-[#B85838] bg-[#FAF8F4]" >
      <div className="text-[0.6875rem] uppercase tracking-wider mb-1 text-[#B85838]" >Cost-efficiency screen (Governor)</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-[#1A1815]" >
        <span>Price</span><span>{formatPrice(e.priceCents)}</span>
        <span>Processor fee</span><span>−{formatPrice(e.processorFeeCents)}</span>
        <span>Net per sale</span><span className={e.isProfitable ? 'text-[#216E39]' : 'text-[#B85838]'}>{formatPrice(e.netCents)} ({e.marginPct}%)</span>
        <span>Per-sale profitable</span><span>{e.isProfitable ? 'Yes' : 'No'}</span>
        <span>90-free justified</span><span>{t.justified ? 'Yes (LTV &gt; trial cost)' : 'Review'}</span>
      </div>
      <p className="text-[0.625rem] mt-1 text-[#5A5751]" >{e.leanAlternative}</p>
      <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#E8E4DC]" >
        <label className="text-[0.6875rem] text-[#5A5751]" >Price $
          <input value={price} onChange={(e2) => setPrice(e2.target.value)} className="w-16 text-xs border px-1 py-0.5 ml-1 border-[#E8E4DC]"  />
        </label>
        <button type="button" onClick={() => onPrice(product, Math.round(parseFloat(price || '0') * 100))} className={btn} className="border-[#1A1815] text-[#1A1815]" >Preview → set price</button>
        {product.status !== 'published' && publishableProduct(product).ok && (
          <button type="button" onClick={() => onPublish(product)} className={`${btn} text-white bg-[#1A1815] border-[#1A1815]`}>Preview → publish</button>
        )}
        {product.status === 'published' && <span className="text-[0.6875rem] text-[#216E39]">● published</span>}
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
      <p className="text-sm mb-3 text-[#5A5751]" >
        Full books from Darrell's teaching — yours to read, with a conversation space for everyone who has the book.
      </p>

      <TrialBanner sub={sub} />
      {!access.fullApp && access.phase === 'expired' && (
        <button type="button" onClick={() => subscribe(sub.tier)} className={`${btn} text-white mb-3 bg-[#1A1815] border-[#1A1815]`}>
          Restore full access →
        </button>
      )}

      {checkoutNote && (
        <div className="border p-2 mb-3 text-xs border-[#B85838] bg-[#FAF8F4] text-[#1A1815]" >{checkoutNote}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {forSale.map((product) => {
          const owned = entitledToBook(sub, product, nowIso());
          const open = selected === product.id;
          return (
            <div key={product.id} className="border bg-white p-3 border-[#E8E4DC]" >
              <div className="flex items-start gap-2">
                <div className="text-2xl" aria-hidden="true">{product.coverEmoji}</div>
                <div className="flex-1">
                  <div className="font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{product.title}</div>
                  <div className="text-[0.6875rem] italic text-[#5A5751]" >{product.subtitle} · {product.author}</div>
                  <p className="text-xs mt-1 text-[#1A1815]" >{product.blurb}</p>
                </div>
                <div className="text-sm font-semibold text-[#B85838]" >{owned ? 'Owned' : formatPrice(product.priceCents)}</div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {owned
                  ? <button type="button" onClick={() => onReadProduct && onReadProduct(product)} className={`${btn} text-white bg-[#1A1815] border-[#1A1815]`}>Read</button>
                  : <button type="button" onClick={() => buy(product)} className={`${btn} text-white bg-[#B85838] border-[#B85838]`}>Buy {formatPrice(product.priceCents)}</button>}
                <button type="button" onClick={() => setSelected(open ? null : product.id)} className={btn} className="border-[#E8E4DC] text-[#5A5751]" >{open ? 'Hide' : 'Conversation'}</button>
                {isFamilyMember && !owned && <button type="button" onClick={() => markOwned(product)} className={btn} className="border-[#E8E4DC] text-[#5A5751]"  title="Governor test — real purchases grant via the processor">Mark owned (test)</button>}
              </div>
              {open && <div className="mt-2"><ConversationPanel product={product} sub={sub} userKey={userKey} /></div>}
              {isFamilyMember && <GovernorEconomics product={product} onPublish={publish} onPrice={setPrice} />}
            </div>
          );
        })}
      </div>

      {isFamilyMember && (
        <div className="mt-4 border p-3 border-[#E8E4DC]" >
          <div className="text-[0.6875rem] uppercase tracking-wider mb-1 text-[#5A5751]" >Drafts (Governor)</div>
          {catalog.filter((p) => p.status !== 'published').map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 text-xs py-1 text-[#1A1815]" >
              <span>{p.coverEmoji} {p.title} <span className="text-[#5A5751]" >— {p.blurb}</span></span>
              {publishableProduct(p).ok
                ? <button type="button" onClick={() => publish(p)} className={btn} className="border-[#1A1815] text-[#1A1815]" >Publish</button>
                : <span className="text-[0.625rem] text-[#5A5751]" >{publishableProduct(p).reasons[0]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
