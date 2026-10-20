export async function withEdgeCache(
  request: Request,
  waitUntil: (p: Promise<unknown>) => void,
  ttlSeconds: number,
  produce: () => Promise<Response>,
): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(new URL(request.url).toString(), { method: 'GET' });

  const hit = await cache.match(key);
  if (hit) return hit;

  const res = await produce();
  if (!res.ok) return res;

  const headers = new Headers(res.headers);
  headers.set('Cache-Control', `public, max-age=${ttlSeconds}`);
  const out = new Response(await res.text(), { status: res.status, headers });
  waitUntil(cache.put(key, out.clone()));
  return out;
}