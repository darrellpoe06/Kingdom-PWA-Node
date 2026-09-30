// =============================================================================
// books-intake-cloud — the family's copy of every uploaded original
// (DR-0707, the one Books upload)
// =============================================================================
// After the device has kept the original (books-intake-store), a copy goes to
// the household's private document shelf: the `family-documents` bucket and
// `family_documents` rows that migration 0201 already guards with RLS (my own
// folder; shared with the household only when a person chooses). No new table,
// no new bucket: the shelf "The money" is where statements worth keeping live.
//
// Best effort and honest: signed out, no household, or offline -> the result
// says so and the document still sits safely on the device.
// =============================================================================
import supabase from './supabase.js';
import { BUCKET, saveDocument } from './family-vault-sync.js';
import { documentPath, MAX_FILE_BYTES } from './family-vault.js';
import { readHousehold } from './household-sync.js';

let instanceIdCache = null;

export async function keepOriginalInCloud(file, doc) {
  try {
    if (!file || !doc) return { ok: false, reason: 'nothing' };
    if (Number(file.size) > MAX_FILE_BYTES) return { ok: false, reason: 'too-large', message: 'Kept on this device only (over 25 MB).' };
    const { data } = await supabase.auth.getUser();
    const userId = data && data.user && data.user.id;
    if (!userId) return { ok: false, reason: 'signed-out', message: 'Kept on this device; sign in to keep a copy on the household shelf.' };
    if (!instanceIdCache) {
      const h = await readHousehold();
      instanceIdCache = h && h.ok && h.view ? h.view.instanceId : null;
    }
    const slug = `books-${doc.id}`;
    const path = documentPath({ userId, slug, fileName: file.name });
    const up = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type || 'application/octet-stream' });
    if (up.error) return { ok: false, reason: 'upload-error', message: 'Kept on this device; the household shelf did not take the copy yet.' };
    if (instanceIdCache) {
      await saveDocument({
        slug, category: 'money', label: `Books upload: ${file.name}`.slice(0, 120),
        dateOf: String(doc.receivedAt || '').slice(0, 10) || '', note: `Received ${doc.receivedAt} through the Books upload.`,
        fileName: file.name, fileSize: file.size, storagePath: path,
      }, instanceIdCache);
    }
    return { ok: true, storagePath: path };
  } catch {
    return { ok: false, reason: 'network-error', message: 'Kept on this device; the household shelf copy will be tried again.' };
  }
}
