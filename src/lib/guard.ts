import { env } from 'cloudflare:workers';
import type { APIContext } from 'astro';

export const e = () => env as unknown as Record<string, string>;

const COOKIE = 'nm_session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export const clientIp = (request: Request) => request.headers.get('cf-connecting-ip') ?? 'local';

// Best-effort limiter: memory is per Worker instance, so it slows abuse but is not airtight.
const hits = new Map<string, number[]>();
export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return false;
}

const enc = new TextEncoder();
async function hmac(value: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(e().CHAT_SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(value)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function readSession(raw: string | undefined): Promise<string | null> {
  if (!raw) return null;
  const [id, issued, sig] = raw.split('.');
  const age = Date.now() - Number(issued);
  if (!id || !sig || !Number.isFinite(age) || age > SESSION_TTL_MS) return null;
  return (await hmac(`${id}.${issued}`)) === sig ? id : null;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: e().TURNSTILE_SECRET, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(5000),
    });
    return ((await res.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}

/** Returns a session id, creating a signed session after Turnstile when needed. Null means a challenge is required. */
export async function ensureSession(
  request: Request,
  cookies: APIContext['cookies'],
  token: string,
): Promise<string | null> {
  const existing = await readSession(cookies.get(COOKIE)?.value);
  if (existing) return existing;
  if (!token || !(await verifyTurnstile(token, clientIp(request)))) return null;

  const sessionId = crypto.randomUUID();
  const issued = Date.now();
  cookies.set(COOKIE, `${sessionId}.${issued}.${await hmac(`${sessionId}.${issued}`)}`, {
    path: '/', httpOnly: true, secure: import.meta.env.PROD, sameSite: 'lax', maxAge: SESSION_TTL_MS / 1000,
  });
  return sessionId;
}