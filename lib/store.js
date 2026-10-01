// Instantanés figés des challenges terminés (Vercel Blob).
const enabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const key = id => `snapshots/${id}.json`;

export async function getSnapshot(id) {
  if (!enabled()) return null;
  const { list } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: key(id) });
  if (!blobs.length) return null;
  const latest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  const r = await fetch(latest.url, { cache: 'no-store' });
  return r.ok ? r.json() : null;
}

export async function saveSnapshot(id, data) {
  if (!enabled()) throw new Error('Stockage non activé : connecte un store Vercel Blob au projet (Storage → Blob).');
  const { put, list, del } = await import('@vercel/blob');
  const { blobs } = await list({ prefix: key(id) });
  await put(key(id), JSON.stringify(data), { access: 'public', addRandomSuffix: true, contentType: 'application/json' });
  if (blobs.length) await del(blobs.map(b => b.url));
}
