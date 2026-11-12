// =============================================================================
// Storefront — the store's public face, on our own door (DR-1449)
// =============================================================================
// Darrell 2026-11-12, with a Payhip link: "Make our store have this
// capability", then "can we do it sovereign?" This is the sovereign page: no
// account to browse; the seller's name, line and bio first; then everything
// for sale in one list from the sources the house already keeps
// (store-catalog.js); a share link for the store and for each product; and a
// buyer sent back here with their book the moment Stripe clears the card
// (instant-delivery.js). What can really be bought is the SERVER's answer
// (GET /api/checkout), never a build flag. Themed classes, never inline hex.
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SectionTitle } from './shared.jsx';
import ShareButton from './ShareButton.jsx';
import PoeTechPlusButton from './PoeTechPlusButton.jsx';
import { supabase } from '../lib/supabase.js';
import { STORE_PROFILE, storeUrl, storeShareText, productFromSearch } from '../lib/store-profile.js';
import { storefrontItems, storefrontCounts, readOpen, PROCESSOR_LABEL } from '../lib/store-catalog.js';
import { loadCatalog, loadOverrides } from '../lib/book-catalog.js';
import { listOpenWorkshops, startSeatCheckout, saySeatError } from '../lib/workshops.js';
import { buildBookCheckoutRequest, executeCheckout, checkoutEndpoint, PROCESSOR_NOTE } from '../lib/checkout-seam.js';
import { ensureSubscriber, loadSubscriber, saveSubscriber, entitledToBook } from '../lib/entitlements.js';
import { deliveryRefFromSearch, deliveryReturnPaths, readDelivery, applyDelivery, sayDeliveryError } from '../lib/instant-delivery.js';
import { lessonUrl } from '../lib/lesson-links.js';
import { PLUS_LABEL } from '../lib/poetech-plus.js';
import { readReviewSummaries } from '../lib/book-reviews.js';
import { Stars } from './BookReviews.jsx';

const btn =
  'inline-flex items-center text-xs px-3 py-1.5 min-h-[36px] border font-semibold focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60';
const eyebrow = 'text-[0.6875rem] uppercase tracking-wider font-semibold text-[#B85838] mb-1';
const serif = { fontFamily: '"Fraunces", serif' };
const nowIso = () => new Date().toISOString();
const KIND_LABEL = { book: 'Books', bundle: 'Bundles', course: 'Courses', workshop: 'Workshops', membership: 'Membership' };
const KIND_ORDER = ['book', 'bundle', 'course', 'workshop', 'membership'];

/** The delivery panel: what the buyer just got, and the downloads the app builds. */
export function DeliveredPanel({ delivery, onDownload }) {
  if (!delivery) return null;
  if (!delivery.ok)
    return (
      <p className="text-xs border p-2 mb-3 border-[#E8E4DC] bg-[#FAF8F4] text-[#1A1815]" role="status" data-testid="delivery-failed">
        {sayDeliveryError(delivery.error)}
      </p>
    );
  return (
    <div className="border p-3 mb-3 border-[#B85838] bg-[#FAF8F4]" role="status" data-testid="delivered">
      <div className={eyebrow}>Yours now</div>
      <p className="text-sm text-[#1A1815]" style={serif}>
        Thank you. {delivery.grants.length > 1 ? `${delivery.grants.length} books are` : 'Your book is'} in your library on this device
        {delivery.email ? `, and the receipt went to ${delivery.email}` : ''}.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        {delivery.grants.map((id) => (
          <span key={id} className="inline-flex flex-wrap gap-1 items-center text-[0.6875rem] text-[#1A1815]">
            <span className="font-semibold">{id}</span>
            {onDownload &&
              ['epub', 'html', 'md'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onDownload(id, k)}
                  className={`${btn} border-[#1A1815] text-[#1A1815]`}
                  data-testid={`download-${k}`}
                >
                  .{k}
                </button>
              ))}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Storefront({
  email = '',
  onReadProduct = null,
  onDownloadProduct = null,
  client = supabase,
  fetchImpl,
  nowIsoFn = nowIso,
  search = null,
}) {
  const userKey = email || 'anon';
  const [sub, setSub] = useState(() => loadSubscriber(userKey));
  const [open, setOpen] = useState({ books: [], subscriptions: [], processors: [] });
  const [events, setEvents] = useState([]);
  const [token, setToken] = useState('');
  const [note, setNote] = useState('');
  const [delivery, setDelivery] = useState(null);
  const [busy, setBusy] = useState('');
  const [stars, setStars] = useState({});
  const loc = typeof window !== 'undefined' ? window.location : { pathname: '/poetech-app/', search: '' };
  const qs = search !== null ? search : loc.search || '';
  const wanted = productFromSearch(qs);

  useEffect(() => {
    setSub(ensureSubscriber(userKey, nowIsoFn()));
  }, [userKey, nowIsoFn]);
  useEffect(() => {
    let alive = true;
    readOpen({ fetchImpl }).then((o) => alive && setOpen(o));
    listOpenWorkshops(client, nowIsoFn()).then((r) => alive && r.ok && setEvents(r.events));
    readReviewSummaries(client).then((r) => alive && r.ok && setStars(r.byProduct));
    Promise.resolve(client && client.auth ? client.auth.getSession() : { data: null })
      .then(({ data }) => alive && setToken((data && data.session && data.session.access_token) || ''))
      .catch(() => {});
    // A return from Stripe carries session_id; from Square, square_order (DR-1451).
    const ref = deliveryRefFromSearch(qs);
    if (ref) {
      readDelivery(ref, { fetchImpl }).then((d) => {
        if (!alive) return;
        setDelivery(d);
        if (d.ok)
          setSub((s) => {
            const next = applyDelivery(s, d);
            saveSubscriber(userKey, next);
            return next;
          });
      });
    }
    return () => {
      alive = false;
    };
  }, [client, fetchImpl, nowIsoFn, qs, userKey]);

  const items = useMemo(() => storefrontItems({ books: loadCatalog(), overrides: loadOverrides(), events, open }), [events, open]);
  const counts = useMemo(() => storefrontCounts(items), [items]);
  const grouped = useMemo(() => KIND_ORDER.map((k) => ({ kind: k, items: items.filter((i) => i.kind === k) })).filter((g) => g.items.length), [items]);

  // Two processors, one seam (DR-1451): the server names what is open, the
  // owner's choice first; a second one is offered beside it. The request
  // names the processor; the server holds every price and key.
  const processors = Array.isArray(open.processors) ? open.processors : [];
  const primary = processors[0] || '';
  const alternate = processors[1] || '';
  const buyBook = useCallback(
    async (it, processor = '') => {
      setBusy(it.id);
      setNote('');
      const { successUrl, cancelUrl } = deliveryReturnPaths(loc.pathname, qs);
      const built = buildBookCheckoutRequest(it.product, sub, { successUrl, cancelUrl, nowIso: nowIsoFn() });
      const req = processor ? { ...built, processor } : built;
      const res = await executeCheckout(req, { config: { enabled: it.buyable, endpoint: checkoutEndpoint() }, fetchImpl, token });
      setBusy('');
      if (res.ok && res.url) {
        try {
          window.location.assign(res.url);
        } catch {
          /* the note tells the truth */
        }
        return;
      }
      setNote(
        it.buyable
          ? `Checkout could not start (${res.error || 'no answer'}). Nothing was charged.`
          : `Checkout for "${it.title}" is not open yet. ${PROCESSOR_NOTE}`
      );
    },
    [sub, loc.pathname, qs, nowIsoFn, fetchImpl, token]
  );

  const seat = useCallback(
    async (it) => {
      setBusy(it.id);
      setNote('');
      const r = await startSeatCheckout({ token, eventId: it.id, pathname: loc.pathname, search: qs, fetchImpl, processor: primary });
      setBusy('');
      if (r.url) {
        try {
          window.location.assign(r.url);
        } catch {
          /* noop */
        }
        return;
      }
      setNote(saySeatError(r.error));
    },
    [token, loc.pathname, qs, fetchImpl, primary]
  );

  const shareUrl = storeUrl({ origin: loc.origin });
  return (
    <div className="w-full" data-testid="storefront" data-total={counts.total}>
      <SectionTitle eyebrow="Store">{STORE_PROFILE.name}</SectionTitle>
      <header className="border p-3 mb-4 border-[#E8E4DC] bg-white" data-testid="store-profile">
        <div className="text-sm font-semibold text-[#1A1815]" style={serif}>
          {STORE_PROFILE.seller}
        </div>
        <div className="text-xs text-[#5A5751]">{STORE_PROFILE.tagline}</div>
        <p className="text-xs mt-2 text-[#1A1815]">{STORE_PROFILE.bio}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {STORE_PROFILE.links.map((l) => (
            <a key={l.href} href={l.href} className={`${btn} border-[#E8E4DC] text-[#5A5751]`}>
              {l.label}
            </a>
          ))}
          <ShareButton payload={{ url: shareUrl, text: storeShareText(), title: STORE_PROFILE.name }} label="Share the store" />
        </div>
        <p className="text-[0.6875rem] mt-2 text-[#5A5751]" data-testid="store-counts">
          {counts.book} books · {counts.bundle} bundles · {counts.course} courses · {counts.workshop} workshops open · {counts.membership} membership
        </p>
      </header>

      <DeliveredPanel delivery={delivery} onDownload={onDownloadProduct ? (id, k) => onDownloadProduct(id, k) : null} />
      {note && (
        <p className="text-xs border p-2 mb-3 border-[#E8E4DC] bg-[#FAF8F4] text-[#1A1815]" role="status" data-testid="store-note">
          {note}
        </p>
      )}
      <p className="text-[0.6875rem] mb-3 text-[#5A5751]">
        Have a code? Enter it on the checkout page. Every book downloads as .epub, .html or .md the moment it is yours.
      </p>

      {grouped.map((g) => (
        <section key={g.kind} className="mb-5" data-testid={`store-${g.kind}`}>
          <div className={eyebrow}>{KIND_LABEL[g.kind]}</div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {g.items.map((it) => {
              const owned =
                it.kind === 'book'
                  ? entitledToBook(sub, it.product, nowIsoFn())
                  : it.kind === 'bundle'
                    ? it.grants.every((id) => entitledToBook(sub, { id, tierIncluded: [] }, nowIsoFn()))
                    : false;
              const highlight = wanted && wanted === it.id;
              return (
                <li
                  key={it.id}
                  className={`border bg-white p-3 ${highlight ? 'border-[#B85838]' : 'border-[#E8E4DC]'}`}
                  data-testid="store-item"
                  data-kind={it.kind}
                  data-id={it.id}
                  data-buyable={it.buyable ? 'yes' : 'no'}
                >
                  <div className="flex items-start gap-2">
                    <div className="text-2xl" aria-hidden="true">
                      {it.coverEmoji}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-[#1A1815]" style={serif}>
                        {it.title}
                      </div>
                      {it.subtitle && <div className="text-[0.6875rem] italic text-[#5A5751]">{it.subtitle}</div>}
                      {it.blurb && <p className="text-xs mt-1 text-[#1A1815]">{it.blurb}</p>}
                      {it.kind === 'book' && (
                        <div className="mt-1">
                          <Stars productId={it.id} cloud={stars[it.id] || null} />
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-[#B85838]" data-testid="store-price">
                      {owned ? 'Yours' : it.priceLabel}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {(it.kind === 'book' || it.kind === 'bundle') &&
                      (owned ? (
                        <>
                          {onReadProduct && it.kind === 'book' && (
                            <button type="button" onClick={() => onReadProduct(it.product)} className={`${btn} text-white bg-[#1A1815] border-[#1A1815]`}>
                              Read
                            </button>
                          )}
                          {onDownloadProduct &&
                            (it.kind === 'book' ? [it.id] : it.grants).map((id) => (
                              <button key={id} type="button" onClick={() => onDownloadProduct(id, 'epub')} className={`${btn} border-[#1A1815] text-[#1A1815]`}>
                                Download .epub
                              </button>
                            ))}
                        </>
                      ) : it.buyable ? (
                        <>
                          <button
                            type="button"
                            disabled={busy === it.id}
                            onClick={() => buyBook(it, primary)}
                            className={`${btn} text-white bg-[#B85838] border-[#B85838]`}
                            data-testid="buy"
                            data-processor={primary}
                          >
                            {busy === it.id
                              ? 'Opening checkout…'
                              : it.pricing.kind === 'pwyw' && primary !== 'square'
                                ? 'Name your price'
                                : `Buy ${it.priceLabel}`}
                          </button>
                          {alternate && (
                            <button
                              type="button"
                              disabled={busy === it.id}
                              onClick={() => buyBook(it, alternate)}
                              className={`${btn} border-[#1A1815] text-[#1A1815]`}
                              data-testid="buy-alternate"
                              data-processor={alternate}
                            >
                              Pay with {PROCESSOR_LABEL[alternate]}
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[0.6875rem] text-[#5A5751]" data-testid="not-open">
                          Checkout opens soon.
                        </span>
                      ))}
                    {it.kind === 'course' && (
                      <a
                        href={lessonUrl({ courseKey: it.course.key, course: { meta: { category: it.course.department } } })}
                        className={`${btn} border-[#1A1815] text-[#1A1815]`}
                      >
                        Open course
                      </a>
                    )}
                    {it.kind === 'workshop' &&
                      (it.buyable ? (
                        token ? (
                          <button
                            type="button"
                            disabled={busy === it.id}
                            onClick={() => seat(it)}
                            className={`${btn} text-white bg-[#1A1815] border-[#1A1815]`}
                            data-testid="take-a-seat"
                          >
                            {busy === it.id ? 'Opening checkout…' : 'Take a seat'}
                          </button>
                        ) : (
                          <span className="text-[0.6875rem] text-[#5A5751]">Sign in to take a seat.</span>
                        )
                      ) : (
                        <span className="text-[0.6875rem] text-[#5A5751]">Every seat is taken.</span>
                      ))}
                    {it.kind === 'membership' && <PoeTechPlusButton client={client} fetchImpl={fetchImpl} />}
                    <ShareButton
                      payload={{ url: storeUrl({ origin: loc.origin, productId: it.id }), text: storeShareText(it), title: it.title }}
                      label="Share"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {!grouped.length && (
        <p className="text-xs text-[#5A5751]" data-testid="store-empty">
          Nothing is on the shelf yet.
        </p>
      )}
      <p className="text-[0.625rem] mt-4 text-[#5A5751]">
        Membership opens the deeper levels; the Word's own courses stay free. {PLUS_LABEL} is managed from the app.
      </p>
    </div>
  );
}
