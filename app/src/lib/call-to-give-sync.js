// =============================================================================
// call-to-give-sync — Supabase wiring for the Call-to-Give archive (DR-0134)
// =============================================================================
// One fetch, two existing sources, nothing new invented:
//   - the service-video corpus (choir_sermons — the same spine the choir
//     archive, songbook, and Harvest ledger attribute to), and
//   - the live transcript rows (video_transcripts via sermon-library-sync's
//     fetchTranscriptsFor — one transcript source, many harvests).
//
// THIS IS THE ONE PLACE THAT GENUINELY WANTS THE WHOLE ARCHIVE (DR-1057), and
// it now SAYS SO instead of getting it from a missing WHERE clause. A
// call-to-give moment can sit in any service ever recorded, so the archive is
// built across the whole corpus by design — unlike The Word, which was reading
// every transcript to print at most eight lines per message (DR-1057). The ids
// come from the corpus, and the cap is passed explicitly as that corpus's own
// size, so "all of them" is a visible decision in the code rather than the
// absence of a limit nobody could see.
// RLS: both are church-member reads; a signed-out visitor gets empty rows and
// the surface shows its honest signed-out state, never throwing.
// =============================================================================
import supabase from './supabase.js';
import { fetchTranscriptsFor } from './sermon-library-sync.js';
import { buildCallToGiveArchive } from './call-to-give.js';

// The corpus, videos only (document-only sermon rows carry no video_id).
export async function fetchServiceCorpus() {
  const { data, error } = await supabase.from('choir_sermons')
    .select('video_id, youtube_url, service_date, service_type, title, speaker');
  if (error) { console.warn('[call-to-give] corpus fetch failed:', error); return []; }
  return data || [];
}

// The derived archive + nothing else. { archive } — empty archive means either
// signed-out (RLS) or an un-migrated cloud; the surface states which it can know.
export async function fetchCallToGiveArchive() {
  const corpus = await fetchServiceCorpus();
  const ids = corpus.map((r) => r && r.video_id).filter(Boolean);
  // cap = the corpus's own size: every service, deliberately, and nothing more.
  const transcriptsByVideo = await fetchTranscriptsFor(ids, { cap: ids.length });
  return { archive: buildCallToGiveArchive(corpus, transcriptsByVideo) };
}
