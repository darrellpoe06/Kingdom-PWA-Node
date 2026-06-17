// conference-identity — the COLG conference front-door identity, in ONE place so
// the lightweight public ?register=1 page and the in-app front door agree without
// the standalone boot pulling the heavy ConferenceModule (choir-sync, etc.).
// These are IDENTITY (the church's own Assembly), not metrics — safe as constants;
// dates stay blank until leadership confirms them (no painted values). Organizers
// can edit the live conference record in-app; this is the default/fallback face.
export const CONFERENCE_IDENTITY = {
  name: '77th National Assembly',
  theme: 'Reviving Faith, Restoring Hope, Rebuilding Communities',
  host: 'The Church of the Living God',
  // South Campus Event Center is the named venue for the Assembly (1109 N 4th St);
  // the Main Campus (312 E. Bradley) is the church home.
  location: '1109 N 4th Street, Champaign, IL',
  dates: '', // not yet published — leaders fill in when confirmed
  livestreamUrl: 'https://www.youtube.com/channel/UC821pJh7YR5llBNnWUJj-ZA',
  siteUrl: 'https://www.thechurchofthelivinggod.com/77th-national-assembly',
};
