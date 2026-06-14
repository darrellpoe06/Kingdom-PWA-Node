// youtube-title-parse — dependency-free parsing of @thelovecorner video titles
// into message records (Darrell 2026-06-14). Shared by the in-app sermon
// importer and the local yt-dlp backfill script (scripts/choir-youtube-backfill.mjs),
// so the parsing rule has ONE source of truth. No imports → safe in Node + browser.
//
// Real title shapes observed on the channel:
//   '6 -10 - 2026 Bishop E. Gwin  "LET GO AND LET GOD HELP YOU"'        -> Sunday
//   '6 -3 - 2026 Bishop Lloyd Gwin Wednesday Bible Study  "THANK YOU..."' -> Wednesday
//   '5 - 6 - 26 Bishop Lloyd E. Gwin Wednesday Bible Study "NEED ANSWERS..."'

export function parseServiceTitle(rawTitle) {
  const title = String(rawTitle || '');
  const dm = title.match(/(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{2,4})/);
  let serviceDate = null;
  if (dm) {
    const mo = Number(dm[1]);
    const day = Number(dm[2]);
    let yr = Number(dm[3]);
    if (yr < 100) yr += 2000;
    if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31) {
      const pad = (n) => String(n).padStart(2, '0');
      serviceDate = `${yr}-${pad(mo)}-${pad(day)}`;
    }
  }
  const serviceType = /wednesday|bible\s*study/i.test(title) ? 'wednesday' : 'sunday';
  const qm = title.match(/[“"']\s*([^“”"']+?)\s*[”"']/);
  const messageTitle = qm ? qm[1].trim() : null;
  const sm = title.match(/Bishop[^"“]*?Gwin/i);
  const speaker = sm ? sm[0].replace(/\s+/g, ' ').trim() : null;
  return { serviceDate, serviceType, title: messageTitle, speaker };
}

// Pull the 11-char YouTube id from a watch/youtu.be/embed URL (or return null).
export function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  let m;
  if ((m = url.match(/[?&]v=([\w-]{11})/))) return m[1];
  if ((m = url.match(/youtu\.be\/([\w-]{11})/))) return m[1];
  if ((m = url.match(/\/embed\/([\w-]{11})/))) return m[1];
  if ((m = url.match(/^([\w-]{11})$/))) return m[1];
  return null;
}
