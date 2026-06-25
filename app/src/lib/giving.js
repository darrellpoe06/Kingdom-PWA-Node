// =============================================================================
// giving — Church "Give" surface: the destination resolver + the scripture
// on giving, drawn faithfully (leaf module, dependency-free, testable).
// =============================================================================
// Two responsibilities, both load-bearing and both deliberately kept OUT of the
// component so they can be unit-tested (Verification Doctrine, DR-0076):
//
//   1. resolveGiveDestination(church) — where the Give button actually goes.
//      LINK SAFETY (binding): the Give button only ever points at the church's
//      OWN confirmed destination. It NEVER invents a giving/payment URL. No
//      payment data ever touches this app — we link out to the congregation's
//      existing secure giving page; we do not collect money here.
//
//   2. GIVING_SCRIPTURES + GIVING_DOCTRINE — the benefits of giving ACCORDING
//      TO THE WORD. Anchored to the project's binding giving doctrine
//      (docs/00-foundations/_root/BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP.md
//      Sections 11-12): the 10% tithe is the baseline discipline; giving above
//      it is generosity, sowing, and mutual aid; the heart posture
//      (cheerful, not under compulsion) governs. This is the bright line
//      against prosperity gospel — giving is worship and stewardship, NOT a
//      transaction with a promised, guaranteed return (faithfulness, not yield;
//      Matthew 25:21). ESV text per SCRIPTURE-REFERENCE-STANDARD.md; OT divine
//      name rendered "LORD" as the ESV prints it (and per the typographic rule).
// =============================================================================

// The benefits of giving, drawn faithfully from the Word. Each entry pairs the
// exact ESV verse with a short, accurate note on the BLESSING/STEWARDSHIP/WORSHIP
// it reveals — heart posture over transaction. The notes never promise a
// guaranteed material return; that inversion is the prosperity gospel the
// mission doctrine refuses (Section 11).
export const GIVING_SCRIPTURES = [
  {
    ref: 'Malachi 3:10',
    translation: 'ESV',
    text: 'Bring the full tithe into the storehouse, that there may be food in my house. And thereby put me to the test, says the LORD of hosts, if I will not open the windows of heaven for you and pour down for you a blessing until there is no more need.',
    benefit: 'The tithe — the full 10% — is brought into the storehouse so there is provision in God’s house. The open windows are His covenant faithfulness to a faithful people, not a lever we pull for ourselves.',
  },
  {
    ref: '2 Corinthians 9:6-8',
    translation: 'ESV',
    text: 'The point is this: whoever sows sparingly will also reap sparingly, and whoever sows bountifully will also reap bountifully. Each one must give as he has decided in his heart, not reluctantly or under compulsion, for God loves a cheerful giver. And God is able to make all grace abound to you, so that having all sufficiency in all things at all times, you may abound in every good work.',
    benefit: 'The heart governs: give as you have decided, not under pressure. God loves a cheerful giver and supplies grace so you can abound in every good work — the enrichment is for generosity, not for keeping.',
  },
  {
    ref: 'Luke 6:38',
    translation: 'ESV',
    text: 'Give, and it will be given to you. Good measure, pressed down, shaken together, running over, will be put into your lap.',
    benefit: 'Generosity is met by God’s generosity, in His measure and His timing — the open hand, not a formula that obligates Him.',
  },
  {
    ref: 'Proverbs 11:25',
    translation: 'ESV',
    text: 'Whoever brings blessing will be enriched, and one who waters will himself be watered.',
    benefit: 'The one who pours out is poured into. Blessing flows back to the generous — the mutual flourishing of the Body.',
  },
  {
    ref: 'Proverbs 3:9-10',
    translation: 'ESV',
    text: 'Honor the LORD with your wealth and with the firstfruits of all your produce; then your barns will be filled with plenty, and your vats will be bursting with wine.',
    benefit: 'Giving is worship: we honor the LORD FIRST, with the firstfruits — not the leftovers. Giving names what is His before it is ours.',
  },
  {
    ref: 'Acts 20:35',
    translation: 'ESV',
    text: 'It is more blessed to give than to receive.',
    benefit: 'The blessing is IN the giving itself — the posture of the King, who gave first and gave all.',
  },
];

// The framing that holds the bright line. Surfaced above the verses so the
// benefit is never read as a guaranteed-return pitch.
export const GIVING_DOCTRINE = {
  heading: 'Giving according to the Word',
  // The 10% baseline discipline (Section 12) + generosity above it (the heart).
  tithe: 'The tithe — 10% — is the baseline discipline of stewardship, the practice across both testaments (Genesis 14 to Malachi 3 to Matthew 23). Giving above it is generosity, sowing, and mutual aid.',
  heart: 'The amount is bounded; the heart is free. “Each one must give as he has decided in his heart, not reluctantly or under compulsion” (2 Corinthians 9:7).',
  // The bright line, stated plainly (Section 11). This is the firewall.
  brightLine: 'This is worship and stewardship — not a transaction with a promised return. The measure is faithfulness, not yield (Matthew 25:21). We hold the verse as written and refuse the prosperity-gospel inversion.',
};

// resolveGiveDestination — decide where the Give button points, honestly.
// Returns { url, host, confirmed, note }:
//   url       : the outbound destination (the church's OWN page) or null.
//   confirmed : true once a dedicated giving DEEP-LINK is set; false while the
//               button lands on the church's site root (which publishes their
//               giving link) and the exact deep-link is still pending the
//               church office. Surfaced to the user honestly; never hidden.
//   note      : the honest one-line status shown under the button.
// If the church carries no link at all, url is null and the panel shows a
// clearly-marked "needs the church's giving URL" state instead of a dead/guessed
// link (NEVER invent a URL).
export function resolveGiveDestination(church) {
  const links = (church && church.links) || {};
  const site = (church && church.site) || '';
  const give = (links.give || '').trim();
  const root = (site || '').trim();

  // A dedicated deep-link is one that goes DEEPER than the site root (a real
  // /give, /giving, Givelify/Tithe.ly/Pushpay page) — that's a confirmed
  // giving destination. Landing on the bare site root is accurate but not yet
  // the deep-link, so we say so.
  const isDeepLink = (u) => {
    if (!u) return false;
    if (root && u === root) return false; // exactly the site root
    try {
      const p = new URL(u);
      const path = (p.pathname || '/').replace(/\/+$/, '');
      const givingHost = /(givelify|tithe\.ly|pushpay|subsplash|givebutter|onlinegiving|churchcenter)/i.test(p.hostname);
      return givingHost || (path !== '' && path !== '/');
    } catch {
      return false;
    }
  };

  const url = give || root || null;
  if (!url) {
    return {
      url: null,
      host: '',
      confirmed: false,
      note: 'A giving link for this church has not been provided yet.',
    };
  }

  let host;
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { host = ''; }

  const confirmed = isDeepLink(url);
  return {
    url,
    host,
    confirmed,
    note: confirmed
      ? `Opens ${host} — the church’s own secure giving page. No payment information is collected by this app.`
      : `Opens ${host} — the church’s website, where their secure giving page is published. No payment information is collected by this app.`,
  };
}
