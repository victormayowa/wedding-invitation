import crypto from 'node:crypto';

/** The one inline script on each page: marks that JavaScript is running, before first paint. */
export const HEAD_SCRIPT = "document.documentElement.className=document.documentElement.className.replace('no-js','js')";
const HEAD_SCRIPT_HASH = crypto.createHash('sha256').update(HEAD_SCRIPT).digest('base64');

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${HEAD_SCRIPT_HASH}'`,
  // Inline style attributes carry per-element values such as swatch colours and image ratios.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  'frame-src https://www.google.com https://maps.google.com',
  "form-action 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
].join('; ');

export function securityHeaders(res, { secure }) {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
}

/** Visitor IP, honouring X-Forwarded-For only when the site sits behind a trusted proxy. */
export function clientIp(req, trustProxy) {
  if (trustProxy) {
    const fwd = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    if (fwd) return fwd;
  }
  return req.socket.remoteAddress || 'unknown';
}

/** Fixed-window rate limiter held in memory. */
export function rateLimiter({ limit, windowMs }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs);
  timer.unref();
  return {
    /** Records an attempt; returns false once the key is over its limit. */
    take(key) {
      const now = Date.now();
      let entry = hits.get(key);
      if (!entry || entry.reset <= now) {
        entry = { count: 0, reset: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return entry.count <= limit;
    },
    reset(key) {
      hits.delete(key);
    },
  };
}

/** Rejects cross-site form posts when the browser tells us where they came from. */
export function sameOrigin(req, publicUrl) {
  const origin = req.headers.origin;
  if (!origin || origin === 'null') {
    const referer = req.headers.referer;
    if (!referer) return true;
    try {
      return new URL(referer).host === req.headers.host;
    } catch {
      return false;
    }
  }
  try {
    const host = new URL(origin).host;
    return host === req.headers.host || host === new URL(publicUrl).host;
  } catch {
    return false;
  }
}
