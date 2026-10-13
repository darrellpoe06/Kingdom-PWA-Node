// =============================================================================
// call-to-give-sync — Supabase wiring for the Call-to-Give archive (DR-0134)
// =============================================================================
// One fetch, two existing sources, nothing new invented:
//   - the service-video corpus (choir_sermons — the same spine the choir
//     archive, songbook, and Harvest ledger attribute to), and
//   - the live transcript rows (video_transcripts via sermon-library-sync's
//     fetchTranscriptsByVideo — one transcript source, many harvests).
// RLS: both are church-member reads; a signed-out visitor gets empty rows and
// the surface shows its honest signed-out state, never throwing.
// =============================================================================
import supabase from './supabase.js';
import { fetchTranscriptsByVideo } from './sermon-library-sync.js';
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
  const [corpus, transcriptsByVideo] = await Promise.all([
    fetchServiceCorpus(),
    fetchTranscriptsByVideo(),
  ]);
  return { archive: buildCallToGiveArchive(corpus, transcriptsByVideo) };
}
