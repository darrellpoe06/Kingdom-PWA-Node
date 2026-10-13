/* ===========================================================================
   /properties/redirect.js — carry the query into the door (DR-0902)
   ===========================================================================
   Darrell, 2026-10-10, standing on the public listing for 805 North Prospect
   Apt 2: "The image has an apply button that should open the application!!!
   It does not do that currently!!!!!! Fix it!!!!"

   WHAT WAS MEASURED. /properties/index.html carried a HARDCODED destination:

       <meta http-equiv="refresh" content="0; url=/properties/app/?properties=1" />

   A meta refresh cannot see the query it was reached with, so every parameter
   arriving at /properties/ was DESTROYED at this hop. applyUrl() builds
   /properties/?apply=<rentalId> (apply-link.js), so the id naming the unit was
   thrown away one hop before the app could read it, and the door booted with
   nothing to open. readApplyTarget() on the far side was correct the whole
   time; it was simply never handed anything.

   THE PRINTED CARDS ARE THE BIGGER HALF. apply-link.js exists so "someone
   standing at the door of a vacant unit points a camera at a card in the
   window and lands on the application FOR THAT UNIT". Every QR code already
   printed encodes that same /properties/?apply=<id>, so every scan has been
   landing on the generic front door. Those cards are physical and cannot be
   recalled, which is why this is fixed HERE, at the hop they all pass through,
   rather than only by changing what new links look like.

   WHY A SEPARATE FILE AND NOT INLINE. The page's own header says "No inline JS
   (CSP: script-src 'self')" and the measured policy (app/public/_headers:23) is
   `script-src 'self' 'wasm-unsafe-eval' https://unpkg.com`. An inline script
   would be blocked and silently do nothing; a same-origin file is 'self' and
   runs. That is the whole reason this is its own file.

   THE DESTINATION IS FIXED. Only the QUERY is carried; the path is always
   /properties/app/ and is never taken from the URL, so this cannot be turned
   into an open redirect by anything a stranger types or prints. The app
   validates every parameter it then reads -- readApplyTarget() returns null
   for anything that is not a well-formed id, and addressFromSearch() drops a
   page or door it does not recognise -- so a mangled scan degrades to the
   ordinary door rather than to a query built from junk.

   ES5 on purpose: this runs before the app's bundle on whatever browser a
   phone camera happened to open, including an old in-app webview.
   =========================================================================== */
(function () {
  try {
    var loc = window.location;
    var target = '/properties/app/';

    // Start from what we were reached with, then force the flag the door boots
    // on (main.jsx: __params.get('properties') === '1'). Forcing rather than
    // appending means a link that already carries it cannot produce it twice.
    var params;
    try {
      params = new URLSearchParams(loc.search || '');
    } catch (e) {
      params = null;
    }

    var query;
    if (params) {
      params.set('properties', '1');
      query = params.toString();
    } else {
      // No URLSearchParams (a very old webview): keep the behaviour the meta
      // refresh had rather than attempting to parse by hand.
      query = 'properties=1';
    }

    var url = target + (query ? '?' + query : '') + (loc.hash || '');

    // replace(), not assign(): the back button should return the person to
    // wherever they came from -- a text message, a camera, a listing -- never
    // to this waypoint, which would bounce them straight forward again.
    loc.replace(url);
  } catch (e) {
    /* Fall through to the <meta refresh> in the page, which still works. */
  }
})();
