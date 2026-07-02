// =============================================================================
// categorize — the ONE deterministic transaction categorizer (reusable primitive)
// =============================================================================
// Replaces the naive substring matcher that tagged "WF HOME MTG AUTO PAY 0511"
// (a Wells Fargo HOME MORTGAGE autopay) as VEHICLE because it found the substring
// "auto" in "AUTO PAY". This rule layer fixes the class:
//   1. TOKEN / PAYEE-PATTERN match, ordered MOST-SPECIFIC FIRST — a mortgage
//      signal ("home mtg", "mortgage", a servicer name) wins before any generic
//      rule, and the vehicle rule matches real auto payees (autozone, oil change,
//      "\bauto \b" as its own word) — never the "auto" inside "autopay".
//   2. CONFIDENCE per rule, so low-confidence rows can flag for review instead of
//      silently posting a wrong label.
//   3. LEARNED per-payee overrides win over the built-ins: one user correction
//      teaches the payee, so every past + future row from that payee follows.
// Deterministic + pure. Money uses it now; any importer can adopt it. No n8n.
// =============================================================================

export const TX_CATEGORIES = [
  'salary', 'rental-income', 'transfer', 'groceries', 'fuel', 'utilities',
  'dining', 'medical', 'vehicle', 'household', 'charitable', 'business',
  'professional', 'insurance', 'subscription', 'debt-payment', 'other',
];

// payeeKey — a stable key for a merchant/payer, used for learned rules and to
// back-apply a correction to every row from the same payee. Strips digits, dates,
// store/account tails and punctuation so "WF HOME MTG AUTO PAY 0511" and
// "WF HOME MTG AUTO PAY 0512" share one key.
export function payeeKey(description) {
  return String(description || '')
    .toLowerCase()
    .replace(/[0-9]+/g, ' ')       // account tails, dates, store numbers
    .replace(/[^a-z& ]+/g, ' ')    // punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Ordered rules, MOST SPECIFIC FIRST. Each: [regex, category, confidence].
// The regex runs against the lowercased description. Word-ish patterns + real
// payee names — never a bare "auto" that would swallow "autopay".
const RULES = [
  // Mortgage / home loan servicers — MUST precede the vehicle + generic rules.
  [/\bhome mtg\b|\bmortgage\b|home mortgage|wf home mtg|wells fargo.*(mtg|mortgage|home)|rocket mort|mr cooper|freedom mtg|loandepot|carrington|select portfolio|\bsps\b|shellpoint|newrez|pennymac|penny mac|\bmtg\b/, 'debt-payment', 0.95],
  // Card / loan / BNPL payments (autopay of a debt is still debt).
  [/citi ?autopay|card ?member|cardmember|card (payment|pmt)|chase credit|credit crd|payment thank you|amex|american express|discover.*(payment|pmt)|capital one.*(pmt|payment)|synchrony|barclay|comenity|affirm|avant|upgrade,? inc|figure lending|sofi|lending club|prosper|best egg|marcus|klarna|goodleap|online payment to (fi|um|sm|wm|us|un)|automatic payment - than/, 'debt-payment', 0.9],
  // Income — practice ACH (TLC/Mosaic), payroll, deposits.
  [/tlc therapy|mosaic beha|payroll|direct dep|\bdir dep\b|state of ill dir dep|\bsalary\b|\badp\b|gusto|paychex|remote online deposit|mobile deposit|edeposit/, 'salary', 0.85],
  // Transfers — Zelle/Venmo/CashApp/ATM/PayPal/CCU.
  [/zelle|venmo|cash ?app|quickpay|\bxfer\b|to savings|from savings|online transfer|univ of il ccu|\bccu\b|atm cash|paypal|western union|moneygram|wire (in|out|trans)/, 'transfer', 0.85],
  // Fuel — real stations; "\bgas\b" only as a word (not "gastropub").
  [/shell|chevron|exxon|mobil|\bbp\b|marathon|speedway|circle k|thornton|casey|phillips 66|citgo|sunoco|\bfuel\b|\bgas\b|gasoline|murphy (usa|oil)|meijer gas/, 'fuel', 0.85],
  [/county market|county mkt|harvest market|jewel|aldi|walmart|wal-mart|wm supercenter|wm super|target|kroger|trader joe|whole foods|meijer|sam'?s club|costco|food 4 less|grocery|supermarket|save a lot|save-a-lot|fresh market|schnucks|piggly/, 'groceries', 0.85],
  [/mcdonald|chipotle|starbucks|dunkin|\bdd\/br\b|restaurant|\bcafe\b|coffee|espresso|\bpizza\b|\btaco\b|burger|wendy|chick-?fil|panera|panda express|subway|doordash|grubhub|uber ?eats|culver|portillo|domino|little caesars|kfc|popeyes|ihop|denny|buffalo wild|olive garden|\bgrill\b|\bdiner\b|bakery|cracker barrel|burrito|black dog|jimmy john|raising cane|five guys|noodles|jersey mike|kettle korn|\bdeli\b|\beatery\b|\bkitchen\b|smokehouse/, 'dining', 0.8],
  [/comed|nicor|ameren|illinois-america|illinois american|\bwater\b|electric|\butility\b|utilities|at&t|\bat t\b|comcast|xfinity|verizon|t-mobile|tmobile|\binternet\b|sprint|frontier|waste management|republic services|sewer/, 'utilities', 0.85],
  [/netflix|spotify|hulu|disney\+|disneyplus|apple\.com|\bprime video|youtube ?(premium|tv)|adobe|microsoft|\bms \*|paramount|peacock|\bhbo\b|audible|patreon|substack|dropbox|icloud|google (one|\*|storage|youtube)|openai|chatgpt|squarespace|sqsp|acuity|empower|canva|notion|linkedin|zoom\.us/, 'subscription', 0.85],
  [/state farm|geico|progressive|allstate|\binsurance\b|farmers ins|liberty mutual|nationwide|aflac|\bglic\b|american gen lif|life ins|ins_pay|inspayment/, 'insurance', 0.85],
  [/pharmacy|\bcvs\b|walgreens|hospital|clinic|\bmedical\b|\bdental\b|dentist|urgent care|labcorp|quest diag|\bhealth\b|physician|optometr|carle|christie clinic/, 'medical', 0.8],
  // Vehicle — REAL auto payees only. Note: no bare "auto"; "\bauto \b" is the
  // word "auto" (auto parts / auto repair), which never matches "autopay".
  [/autozone|o'?reilly|advance auto|\bauto (parts|repair|body|zone|service)\b|car wash|jiffy lube|\bmechanic\b|\btire\b|oil change|valvoline|midas|firestone|napa auto|carmax|\bdmv\b|secretary of state|\btoll\b|ipass|i-pass|take 5 oil/, 'vehicle', 0.85],
  [/michaels|home depot|lowe'?s|menards|hobby lobby|dollar (general|tree)|family dollar|ikea|wayfair|ace hardware|bed bath|container store|\bat home\b|homegoods|macy|kohl|jcpenney|best buy|\bamazon\b|amzn|jon.?s pipe/, 'household', 0.75],
  [/church|tithe|\btithing\b|donation|charit|goodwill|salvation army|red cross|gofundme|ministr|offering/, 'charitable', 0.8],
  [/zwicker|collection|attorney|\blegal\b|law offic/, 'professional', 0.75],
  [/\bfee\b|service charge|overdraft|\bnsf\b|interest charge|maintenance fee|atm fee|foreign trans/, 'business', 0.7],
];

// categorize — the single entry point. Learned per-payee overrides win (conf 1);
// then the ordered rules; else 'other' at confidence 0 (→ needs review).
export function categorize(description, opts = {}) {
  const learned = opts.learned || null;
  const d = String(description || '').toLowerCase();
  if (learned) {
    const key = payeeKey(description);
    if (key && Object.prototype.hasOwnProperty.call(learned, key)) {
      return { category: learned[key], confidence: 1, rule: 'learned', payeeKey: key };
    }
  }
  for (let i = 0; i < RULES.length; i++) {
    const [re, category, confidence] = RULES[i];
    if (re.test(d)) return { category, confidence, rule: `rule:${i}`, payeeKey: payeeKey(description) };
  }
  return { category: 'other', confidence: 0, rule: 'none', payeeKey: payeeKey(description) };
}

// learnRule — record a user's correction as a payee override. Returns a NEW map
// (pure) so callers persist it; every row sharing the payeeKey re-categorizes.
export function learnRule(learned, description, category) {
  const key = payeeKey(description);
  if (!key) return learned || {};
  return { ...(learned || {}), [key]: category };
}

// LOW_CONFIDENCE — at/below this, a categorization should be flagged for review
// rather than trusted silently.
export const LOW_CONFIDENCE = 0.5;

// applyCategoryToPayee — back-apply a category to EVERY transaction sharing a
// payee key (one correction, applied everywhere). Pure: returns the new
// transactions array + how many rows changed, so the caller can preview the
// count, then persist + sync the result.
export function applyCategoryToPayee(transactions, key, category) {
  let count = 0;
  const out = (transactions || []).map((t) => {
    if (payeeKey(t.description) === key && t.category !== category) { count += 1; return { ...t, category }; }
    return t;
  });
  return { transactions: out, count };
}

// countPayeeMatches — how many transactions share a payee key (for the preview
// "apply to all N from this payee").
export function countPayeeMatches(transactions, key) {
  return (transactions || []).filter((t) => payeeKey(t.description) === key).length;
}
