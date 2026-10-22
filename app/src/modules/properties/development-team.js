// =============================================================================
// development-team — the team a ground-up build needs, and who is still missing
// =============================================================================
// Darrell, 2026-10-21, with a photograph of a slide titled "Your Team" and a
// link (https://youtu.be/6GVmsB3PLmY):
//
//   "Research and add features and functionality for users to formulation of
//    their teams... make sense? Inside the Poe Properties Apps for building
//    from nothing... make sense?"
//
// WHAT WAS ALREADY HERE, measured before a line of this. Poe Properties knows
// two kinds of people and neither is this one:
//   · `people.js` — the invites on a DOOR: tenant, household, worker, manager.
//     Everyone it knows is attached to a unit that already exists.
//   · `dispatch-roster.js` — the workers a maintenance REQUEST can be sent to.
//     Everyone it knows is fixing something already built.
// Nothing in the module knows a surveyor, an architect or a lender, because
// nothing in it has ever been about building from nothing.
//
// -----------------------------------------------------------------------------
// WHERE THIS LIST COMES FROM, AND WHAT IS HIS SOURCE'S AND WHAT IS MINE
// -----------------------------------------------------------------------------
// The sixteen roles, their order, their wording, the three "(commercial)" marks
// and the note on Property Manager are READ FROM HIS SLIDE, verbatim. That is
// the spec and it is not paraphrased.
//
// THE VIDEO, READ (DR-1204, 2026-10-22). The slide's link is Daniel Kleiman's
// "how to build your real estate development team"; its transcript came home on
// our own road (source-transcript-nas.yml, run 39708525219, 6,431 words of
// YouTube's auto-generated captions). It settles what the slide left open:
//   · BOLD, in his words: "the core members of your team that you'll need even
//     if you want to build a single-family home or a duplex".
//   · THE ORDER: not the numbering read as a sequence (that was MY inference,
//     and the video corrects it -- lenders come FIRST, before there is a deal).
//   · For each role: when he calls them, what they do, the questions he vets
//     them with, and his ballpark pay, which he says is his own Virginia
//     experience and varies by market.
// Everything below drawn from the video is labelled as the video's, in plain
// summary, never as a verbatim quotation: they are a machine's captions, and
// the captions' own header says to verify wording before quoting a person.
/**
 * YOUR TEAM, from the slide. `n` is its number on the slide, `role` its wording,
 * `emphasis` whether the slide set it bold, `commercial` whether the slide
 * marked it "(commercial)", and `note` any words the slide added to it.
 */
export const DEV_TEAM_ROLES = Object.freeze([
  Object.freeze({ n: 1, role: 'Surveyor', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "One of the very first calls once the land is under contract.", does: "Orders the survey; helps with the site plan for any upzoning or rezoning; draws the proposed site plan for the construction drawings; stakes the footers and foundation during construction.", vet: Object.freeze([]), pay: "A basic residential survey about $300; topographic and utility surveys $1,000–$2,000; an ALTA survey $3,000 and up." }) }),
  Object.freeze({ n: 2, role: 'Soil Engineer', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "Under contract, before you close, as part of due diligence.", does: "Preliminary soil borings where the foundation and stormwater facilities will go, to catch anything about the site that stops construction or makes it cost more.", vet: Object.freeze([]), pay: "About $3–$4.50 a boring by hand auger (he says lately closer to $5–$5.50); deeper machine borings cost substantially more." }) }),
  Object.freeze({ n: 3, role: 'Attorney / Title Company', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "As soon as there is a contract on the land.", does: "Prepares the closing and runs the title search, and sends it to the surveyor so any easement is mapped on the survey.", vet: Object.freeze([]), pay: "" }) }),
  Object.freeze({ n: 4, role: 'Securities Attorney', emphasis: 'plain', commercial: false, note: '', video: Object.freeze({ when: "When you raise outside money, pool money or syndicate equity.", does: "Keeps the raise legal: the operating agreement, a PPM if one is needed, the disclosures and the rest of the documents.", vet: Object.freeze([]), pay: "" }) }),
  Object.freeze({ n: 5, role: 'Architect', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "Before the offer, in due diligence, and through construction.", does: "Knows local zoning and building code: what you can build by right, how many units, how setbacks place the building; designs it, and visits the site during construction.", vet: Object.freeze(["Are you familiar with zoning in this county?", "What do you specialize in: residential, multi-family, mixed-use, commercial, upfits, historic?", "Have you taken projects through rezoning, and will you attend meetings with the county or the neighbors?", "What architectural styles do you usually design in?", "Which projects can I drive by, and which references can I call?", "How do you bid: per foot, hourly, a lump sum to permit plus construction admin?", "What is your workload for the next 12 months, and what timelines and responsiveness can I expect?"]), pay: "A draftsman for single-family and duplex plans about $1–$2 a foot to permit-ready drawings; an architect for multi-family or mixed-use closer to $3 a foot." }) }),
  Object.freeze({ n: 6, role: 'Zoning Consultant / Land Use Attorney', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "Under contract, to learn what you can build by right and whether an upzoning would work there.", does: "Handles a rezoning for you: the paperwork, applications, community meetings, and the planning and council hearings.", vet: Object.freeze(["Are you familiar with zoning codes in this county?", "How long have you been in this role, and what did you do before? (Many worked in a county planning department.)", "What relationships do you have with council members, planning staff and the planning commission?", "Do you also expedite permits?", "Which projects here have you taken through a rezoning?", "Will you go to neighbor meetings and hearings on my behalf?", "How do you bill: hourly or per project?"]), pay: "$100–$200 an hour, or a flat fee per job." }) }),
  Object.freeze({ n: 7, role: 'GC', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "When there is a design to price and build (unless you act as the GC yourself).", does: "Builds the project, on time and on budget.", vet: Object.freeze(["What are you really good at, and is it a fit for this project?", "Do you sub out everything, or perform some trades yourselves?", "How do you bid: a guaranteed maximum price, cost plus?", "Which references can I call, and which current projects can I walk?", "Can I bring some of my own subcontractors and suppliers?", "What is your workload for the next 12 months, and what timelines and responsiveness can I expect?"]), pay: "About 15–20% of cost (he calls 20–25% too high); on a lump-sum quote, get a guaranteed maximum price." }) }),
  Object.freeze({ n: 8, role: 'Insurance Agent / Broker', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "Before the build: builder's risk and liability.", does: "A local broker shops your project across several carriers for the best policy, coverage and deductible.", vet: Object.freeze([]), pay: "Paid by a commission on each policy." }) }),
  Object.freeze({ n: 9, role: 'Civil Engineer', emphasis: 'plain', commercial: true, note: '', video: Object.freeze({ when: "Commercial code, or when the land disturbed passes your locality's size limit.", does: "Draws the civil plans; the good ones value-engineer stormwater retention creatively to save cost.", vet: Object.freeze(["What can you do in-house: surveying, geotechnical testing, structural?", "Do you help with variances and rezonings?", "How creative are you with stormwater systems?", "How do you bid, and what is your workload for the next 12 months?"]), pay: "Around $1 a foot for civil drawings, sometimes higher." }) }),
  Object.freeze({ n: 10, role: 'MEP Engineer', emphasis: 'plain', commercial: true, note: '', video: Object.freeze({ when: "Commercial code (in his market, three units or more).", does: "Draws the engineered mechanical, electrical and plumbing plans.", vet: Object.freeze([]), pay: "$1–$2 a foot, higher in some markets." }) }),
  Object.freeze({ n: 11, role: 'Structural Engineer', emphasis: 'plain', commercial: true, note: '', video: Object.freeze({ when: "Commercial code (in his market, three units or more).", does: "Draws the structural plans.", vet: Object.freeze([]), pay: "$1–$2 a foot, rising with complexity." }) }),
  Object.freeze({ n: 12, role: 'Interior Designer', emphasis: 'plain', commercial: false, note: '', video: Object.freeze({ when: "Short-term rentals, high-end spec homes, and the common areas of larger apartment buildings.", does: "Designs the spaces that have to look great; he does not use one on his rentals.", vet: Object.freeze([]), pay: "Depends on the scope." }) }),
  Object.freeze({ n: 13, role: 'Suppliers / Subs', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "Throughout the build.", does: "Your own preferred trades and suppliers, which you can ask the GC to bring in to control cost.", vet: Object.freeze([]), pay: "" }) }),
  Object.freeze({ n: 14, role: 'Lenders', emphasis: 'bold', commercial: false, note: '', video: Object.freeze({ when: "Before you have a deal: start the relationships now.", does: "Private money lenders, local community banks, equity partners. If you start looking once the clock is running on a deal, it is too late.", vet: Object.freeze([]), pay: "" }) }),
  Object.freeze({ n: 15, role: 'Bookkeeper', emphasis: 'plain', commercial: false, note: '', video: Object.freeze({ when: "From the start.", does: "Keeps the books.", vet: Object.freeze([]), pay: "About $30–$35 an hour for a good one; low $20s for a cheap one." }) }),
  // The one role the slide says something extra about, kept in its own words.
  Object.freeze({ n: 16, role: 'Property Manager', emphasis: 'plain', commercial: false, note: 'should be a part of the dev process', video: Object.freeze({ when: "During construction, and before completion.", does: "Tours the site and gives input on access and flow, pre-leases as the building nears completion, then runs it: maintenance, tenant screening, leasing, collections, retention.", vet: Object.freeze(["How long have you been in business, and what kinds of property do you manage?", "How many units is each property manager responsible for?", "How do you structure your fees? (Get every fee in writing.)", "Do you have in-house maintenance, or outsource it?", "Do you have a mission, values or guiding principles I can read?"]), pay: "6–10% of collected revenue; watch for leasing, maintenance and other fees added on top." }) }),
]);

/** The video this list comes from (DR-1204). */
export const VIDEO_SOURCE = Object.freeze({
  who: 'Daniel Kleiman',
  title: 'how to build your real estate development team',
  link: 'https://youtu.be/6GVmsB3PLmY',
  how: "YouTube's auto-generated captions, read on our own road; summarised here, not quoted",
});

/** What the slide's bold means, in the video's words (a short, clear phrase). */
export const EMPHASIS_MEANING = Object.freeze({
  whose: 'the video',
  words: "the core members of your team that you'll need even if you want to build a single-family home or a duplex",
});

/**
 * THE ORDER, as the video gives it. This REPLACES PoeTech's earlier reading of
 * the numbering ("a price before a lender"), which the video corrects: lender
 * relationships come first, before there is a deal.
 */
export const SEQUENCE_READING = Object.freeze({
  whose: 'from the video',
  words: 'Before an offer: build lender relationships before you have a deal, and ask the architect or land use attorney what the lot allows. Once the land is under contract: the surveyor, the soil engineer and the attorney or title company. Then the design, a price from the GC, the insurance, and the property manager during construction.',
});

/** How the video says to find, vet and keep the team. */
export const VIDEO_WAYS = Object.freeze({
  local: 'Hire local professionals who know your codes, zoning, styles and construction methods; one good local professional opens the door to the rest of the team.',
  find: Object.freeze([
    'Referrals from people active in the business whom you trust: one good referral leads to many.',
    'Local development news, which often names the architect, engineer and GC on a project.',
    'Driving past local projects you like and, politely, meeting the GC.',
    'Professional organizations and local networking groups.',
  ]),
  vet: Object.freeze([
    'References, but find people who worked with them on your own, not only the ones they give you.',
    'Visit their current or past projects; photos are second best.',
    'Independent reviews online.',
    'The state licensing board (in Virginia, DPOR) for license standing and any cases against them.',
  ]),
  keep: Object.freeze([
    'Say your expectations clearly: timing, quality, communication.',
    'You drive the vision and coordinate the team; do not wait for them to.',
    'Do not nickel-and-dime fair fees; make sure the people you work with do well too.',
    'Pay people on time, always.',
  ]),
  payCaveat: 'His own ballpark figures from his Virginia projects; he says they vary widely by market, location, size and complexity of the project, and relationships.',
});

/** A stable key for a role, for storing who fills it. */
export function roleKey(role) {
  return String(role || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * The roles a build of this kind calls for. The three the slide marks
 * "(commercial)" are left out of a residential build, because the slide itself
 * says they are commercial — that is its own word and not an inference.
 * Everything else is offered on every build.
 */
export function rolesFor({ commercial = true } = {}) {
  return DEV_TEAM_ROLES.filter((r) => (commercial ? true : !r.commercial));
}

/**
 * WHO YOU HAVE AND WHO YOU STILL NEED. `filled` maps a role key to whoever
 * fills it ({name, phone, email, note} or just a name). A role with nobody is a
 * GAP and is named; a role filled is carried with its person.
 *
 * Nothing is invented: a build with an empty record reads as sixteen gaps, which
 * is the true answer for someone starting from nothing, and is the whole point.
 */
export function teamState({ commercial = true, filled = {} } = {}) {
  const roles = rolesFor({ commercial });
  const have = [];
  const need = [];
  for (const r of roles) {
    const who = filled[roleKey(r.role)];
    const named = who && (typeof who === 'string' ? who.trim() : String(who.name || '').trim());
    if (named) have.push({ ...r, who: typeof who === 'string' ? { name: who.trim() } : who });
    else need.push(r);
  }
  return {
    roles,
    have,
    need,
    total: roles.length,
    // The slide's own emphasis, counted — never called "required".
    emphasised: roles.filter((r) => r.emphasis === 'bold').length,
    emphasisedNeeded: need.filter((r) => r.emphasis === 'bold').length,
  };
}

/**
 * The next role to go and find, by the slide's own numbering — the lowest
 * number nobody fills. Null when the team is whole, which is a real answer and
 * not a blank.
 */
export function nextToFind(state) {
  const need = (state && state.need) || [];
  if (!need.length) return null;
  return need.reduce((lowest, r) => (r.n < lowest.n ? r : lowest), need[0]);
}

/**
 * What the team panel SAYS, in plain words, measured from the state rather than
 * painted. A build with nobody on it says so; a whole team says so; and the
 * count in between is the count, never a percentage of a thing nobody set.
 */
export function teamWords(state) {
  const s = state || {};
  const total = Number(s.total) || 0;
  const haveN = (s.have || []).length;
  if (!total) return 'No roles for this kind of build yet.';
  if (haveN === 0) return `Nobody on the team yet — ${total} roles to fill. Start the lender relationships now, before there is a deal; once the land is under contract, the surveyor is one of the first calls.`;
  if (haveN === total) return `All ${total} roles filled. Keep the bookkeeper and the property manager in the process, not at the end of it.`;
  const next = nextToFind(s);
  return `${haveN} of ${total} filled · ${total - haveN} to go${next ? ` · next by the numbering: ${next.role}` : ''}.`;
}
