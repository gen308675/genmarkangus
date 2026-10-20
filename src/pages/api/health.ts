import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { withEdgeCache } from '../../lib/edge-cache';

export const prerender = false;

export const GET: APIRoute = ({ request, locals }) =>
  withEdgeCache(request, (p) => locals.cfContext.waitUntil(p), 30, async () => {
    const e = env as unknown as Record<string, string>;
    let status: 'online' | 'offline' = 'offline';
    try {
      const res = await fetch(`${e.N8N_BASE_URL}/healthz`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) status = 'online';
    } catch {
      // unreachable or timed out: stays offline
    }
    return new Response(JSON.stringify({ status, checkedAt: new Date().toISOString() }), {
      headers: { 'Content-Type': 'application/json' },
    });
  });