// =============================================================================
// family-listening — the family's curated artist shelf (Darrell 2026-07-03:
// "lecrae music is fire — add him to our music space, and his whole crew of
// 116 and others I listen to").
// =============================================================================
// The family-curated LISTENING side of the Library (the family-curated-library
// pillar of AI-MEDIA-PRODUCTION-PLATFORM-VISION): artists the Governor has
// vouched for, each with why they are on the shelf. 116 = the Reach Records
// collective (Romans 1:16 — "I am not ashamed of the gospel").
//
// HONEST LINKS (DR-0076): every link is a YouTube SEARCH for the artist —
// always valid, never a guessed channel handle that could point at the wrong
// account. If/when the family pins exact channels, swap searchUrl for the
// verified channel URL per artist.
//
// Extend by adding an entry — Darrell names them, the shelf carries them.
export const LISTENING_TAGLINE = 'Not the destination — it\'s the journey that molds you. Artists the family vouches for, Word in the music.';

const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

// Specific tracks the Governor has vouched for by name — the shelf's deep
// cuts, each with why it's here (distilled from his words when he shared it).
// Same honest-link rule: YouTube SEARCH, never a guessed video URL.
export const FAMILY_PICKS = [
  {
    id: 'pick-round-of-applause',
    title: 'Round of Applause',
    artist: 'Lecrae',
    album: 'Church Clothes 2',
    why: 'An anthem for everyone who beat the odds — living proof of what is possible. Lecrae\'s own road out (jail-or-death expectations broken by faith and education), and the single mother who worked her way to graduating with honors, dignity intact. Nobody dictates your potential. Shared by Darrell 2026-07-03.',
    searchUrl: yt('Lecrae Round of Applause Church Clothes 2'),
  },
];

export const FAMILY_ARTISTS = [
  { id: 'lecrae',   name: 'Lecrae',        tag: '116 · Reach Records', note: 'The flagship — Word-heavy, real-life honest. Fire.', searchUrl: yt('Lecrae') },
  { id: 'reach116', name: '116 / Reach Records', tag: 'the collective', note: 'The whole crew — Romans 1:16, unashamed.', searchUrl: yt('116 Reach Records') },
  { id: 'andy',     name: 'Andy Mineo',    tag: '116 · Reach Records', note: 'Wit and craft with the conviction intact.', searchUrl: yt('Andy Mineo') },
  { id: 'triplee',  name: 'Trip Lee',      tag: '116 · Reach Records', note: 'Pastor and MC — the teaching rides the beat.', searchUrl: yt('Trip Lee') },
  { id: 'tedashii', name: 'Tedashii',      tag: '116 · Reach Records', note: 'Weight and joy in the same voice.', searchUrl: yt('Tedashii') },
  { id: 'kb',       name: 'KB',            tag: 'HGA · alumni of the movement', note: 'Energy under command — strength submitted.', searchUrl: yt('KB rapper HGA') },
  { id: 'hulvey',   name: 'Hulvey',        tag: '116 · Reach Records', note: 'The next generation carrying it.', searchUrl: yt('Hulvey') },
  { id: 'whatuprg', name: 'WHATUPRG',      tag: '116 · Reach Records', note: 'New sound, same allegiance.', searchUrl: yt('WHATUPRG') },
  { id: 'wande',    name: 'Wande',         tag: '116 · Reach Records', note: 'First lady of Reach — bold and clean.', searchUrl: yt('Wande') },
  { id: '1kphew',   name: '1K Phew',       tag: '116 · Reach Records', note: 'Atlanta grit, Kingdom aim.', searchUrl: yt('1K Phew') },
];
