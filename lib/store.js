// Instantanés figés des challenges terminés (Vercel Blob privé, authentification OIDC).
const enabled = () => !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
const key = id => `snapshots/${id}.json`;

export async function getSnapshot(id) {
  if (!enabled()) return null;
  const { get } = await import('@vercel/blob');
  const r = await get(key(id), { access: 'private', useCache: false }).catch(() => null);
  const stream = r?.stream || r?.body;
  if (!stream) return null;
  return JSON.parse(await new Response(stream).text());
}

export async function saveSnapshot(id, data) {
  if (!enabled()) throw new Error('Stockage non activé : connecte un store Vercel Blob au projet (Storage → Blob).');
  const { put } = await import('@vercel/blob');
  await put(key(id), JSON.stringify(data), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
}
