import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { withEdgeCache } from '../../lib/edge-cache';

export const prerender = false;

export const GET: APIRoute = ({ request, locals }) =>
  withEdgeCache(request, (p) => locals.cfContext.waitUntil(p), 60, async () => {
    const e = env as unknown as Record<string, string>;
    try {
      const res = await fetch(`${e.SUPABASE_URL}/rest/v1/rpc/metrics_summary`, {
        method: 'POST',
        headers: {
          apikey: e.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${e.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) throw new Error(`supabase ${res.status}: ${await res.text()}`);
      return new Response(JSON.stringify(await res.json()), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err){
      return new Response(JSON.stringify({ error: 'unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }
  });