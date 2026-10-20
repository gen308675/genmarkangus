import type { APIRoute } from 'astro';
import { e, json, limited, clientIp, ensureSession } from '../../lib/guard';

export const prerender = false;

const MAX_LEN = 500;

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = clientIp(request);

  let body: { message?: unknown; turnstileToken?: unknown };
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_LEN) return json({ error: 'bad_message' }, 400);

  if (limited(`ip:${ip}`, 8, 60_000)) return json({ error: 'rate_limited' }, 429);

  const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
  const sessionId = await ensureSession(request, cookies, token);
  if (!sessionId) return json({ error: 'needs_challenge' }, 401);
  if (limited(`sid:${sessionId}`, 30, 60 * 60_000)) return json({ error: 'rate_limited' }, 429);

  try {
    const res = await fetch(e().N8N_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-nm-secret': e().N8N_WEBHOOK_SECRET },
      body: JSON.stringify({ message, sessionId }),
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) throw new Error(`n8n ${res.status}`);
    const data = (await res.json()) as { reply?: unknown };
    if (typeof data.reply !== 'string' || !data.reply) throw new Error('empty reply');
    return json({ reply: data.reply });
  } catch {
    return json({ error: 'unavailable' }, 503);
  }
};