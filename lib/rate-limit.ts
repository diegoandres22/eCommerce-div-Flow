// lib/rate-limit.ts
// Rate limit simple en memoria, por IP, para los dos endpoints públicos sin
// auth (leads, contacto). Nada de Redis/Upstash a propósito -- ver CLAUDE.md
// ("no agregues sobreingeniería"), esto alcanza para frenar spam básico de
// un MVP de bajo tráfico.
//
// Limitación real, asumida: en Vercel cada instancia serverless tiene su
// propio Map en memoria, así que esto no es un límite global estricto entre
// instancias/regiones -- frena a un mismo origen insistiendo contra la
// misma instancia, no un ataque distribuido serio. Si el tráfico lo
// justifica, migrar a un store compartido (Upstash Redis) más adelante.
const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getClientIp(req: Request): string {
  // Vercel (y la mayoría de proxies) inyectan x-forwarded-for con la IP
  // real primero en la lista.
  const forwarded = req.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || 'unknown';
}
