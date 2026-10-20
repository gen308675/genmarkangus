import type { APIRoute } from 'astro';
import { e, json, limited, clientIp, ensureSession } from '../../lib/guard';

export const prerender = false;

const MAX_BYTES = 1_500_000; // roughly 15 seconds of compressed speech

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = clientIp(request);

  let form: FormData;
  try { form = await request.formData(); } catch { return json({ error: 'bad_request' }, 400); }

  const audio = form.get('audio');
  if (!(audio instanceof File) || audio.size < 1000 || audio.size > MAX_BYTES || !audio.type.startsWith('audio/')) {
    return json({ error: 'bad_audio' }, 400);
  }

  if (limited(`vip:${ip}`, 4, 60_000)) return json({ error: 'rate_limited' }, 429);

  const rawToken = form.get('turnstileToken');
  const sessionId = await ensureSession(request, cookies, typeof rawToken === 'string' ? rawToken : '');
  if (!sessionId) return json({ error: 'needs_challenge' }, 401);
  if (limited(`vsid:${sessionId}`, 15, 60 * 60_000)) return json({ error: 'rate_limited' }, 429);

  // Re-wrap the clip so the type has no codec suffix and the file name matches its format.
  const baseType = audio.type.split(';')[0];
  const ext = baseType.split('/')[1] === 'mpeg' ? 'mp3' : baseType.split('/')[1] || 'webm';
  const out = new FormData();
  out.append('data', new File([audio], `voice.${ext}`, { type: baseType }));
  out.append('sessionId', sessionId);

  try {
    const res = await fetch(e().N8N_VOICE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'x-nm-secret': e().N8N_WEBHOOK_SECRET },
      body: out,
      signal: AbortSignal.timeout(40_000),
    });
    if (!res.ok) throw new Error(`n8n ${res.status}`);

    const data = (await res.json()) as { ok?: boolean; transcript?: unknown; reply?: unknown; error?: unknown };
    if (data.ok === false && data.error === 'no_speech') return json({ error: 'no_speech' }, 422);
    if (typeof data.transcript !== 'string' || typeof data.reply !== 'string' || !data.reply) {
      throw new Error('bad shape');
    }
    return json({ transcript: data.transcript.slice(0, 500), reply: data.reply.slice(0, 1500) });
  } catch {
    return json({ error: 'unavailable' }, 503);
  }
};