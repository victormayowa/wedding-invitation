import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

/* ---------- Routing ---------- */

export class Router {
  constructor() {
    this.routes = [];
  }
  add(method, pattern, handler) {
    const keys = [];
    const source = pattern.replace(/:(\w+)/g, (_, k) => {
      keys.push(k);
      return '([^/]+)';
    });
    this.routes.push({ method, re: new RegExp(`^${source}/?$`), keys, handler });
    return this;
  }
  get(p, h) {
    return this.add('GET', p, h);
  }
  post(p, h) {
    return this.add('POST', p, h);
  }
  match(method, pathname) {
    let allowed = false;
    for (const r of this.routes) {
      const m = r.re.exec(pathname);
      if (!m) continue;
      if (r.method !== method && !(method === 'HEAD' && r.method === 'GET')) {
        allowed = true;
        continue;
      }
      const params = {};
      r.keys.forEach((k, i) => {
        try {
          params[k] = decodeURIComponent(m[i + 1]);
        } catch {
          params[k] = m[i + 1];
        }
      });
      return { handler: r.handler, params };
    }
    return allowed ? { methodNotAllowed: true } : null;
  }
}

/* ---------- Requests ---------- */

export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (!k) continue;
    try {
      out[k] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      out[k] = part.slice(i + 1).trim();
    }
  }
  return out;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Reads a urlencoded form body into URLSearchParams. */
export async function readForm(req, limit = 64 * 1024) {
  const type = (req.headers['content-type'] || '').split(';')[0].trim();
  if (type !== 'application/x-www-form-urlencoded') {
    throw new HttpError(415, 'Please submit the form from the website.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, 'That submission is too large.');
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
}

/* ---------- Responses ---------- */

const COMPRESSIBLE = /^(text\/|application\/(javascript|json|xml)|image\/svg)/;

function compress(req, body, type) {
  if (body.length < 1024 || !COMPRESSIBLE.test(type)) return { body };
  const accept = String(req.headers['accept-encoding'] || '');
  if (/\bbr\b/.test(accept)) {
    return {
      body: zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }),
      encoding: 'br',
    };
  }
  if (/\bgzip\b/.test(accept)) return { body: zlib.gzipSync(body, { level: 6 }), encoding: 'gzip' };
  return { body };
}

export function send(req, res, status, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  const type = headers['Content-Type'] || 'text/plain; charset=utf-8';
  const { body: out, encoding } = compress(req, buf, type);
  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.setHeader('Content-Type', type);
  res.setHeader('Vary', 'Accept-Encoding, Cookie');
  if (encoding) res.setHeader('Content-Encoding', encoding);
  res.setHeader('Content-Length', out.length);
  res.end(req.method === 'HEAD' ? undefined : out);
}

export function sendHtml(req, res, status, page, headers = {}) {
  send(req, res, status, String(page), {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
}

export function redirect(res, location, status = 303) {
  res.statusCode = status;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export function setCookie(res, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, `Path=${opts.path || '/'}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  if (opts.secure) parts.push('Secure');
  const prev = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', [...(Array.isArray(prev) ? prev : prev ? [prev] : []), parts.join('; ')]);
}

export const clearCookie = (res, name, opts = {}) => setCookie(res, name, '', { ...opts, maxAge: 0 });

/* ---------- Static files ---------- */

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

/**
 * Serves files under `dir`. Small text assets are compressed once and held in
 * memory; everything carries an ETag, and versioned URLs (?v=) are immutable.
 */
export function staticFiles(dir) {
  const root = path.resolve(dir);
  const cache = new Map();
  const versions = new Map();

  function load(file) {
    const stat = fs.statSync(file);
    const hit = cache.get(file);
    if (hit && hit.mtime === stat.mtimeMs) return hit;
    const body = fs.readFileSync(file);
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const etag = `"${crypto.createHash('sha1').update(body).digest('base64url').slice(0, 16)}"`;
    const entry = { body, type, etag, mtime: stat.mtimeMs };
    if (COMPRESSIBLE.test(type) && body.length > 1024) {
      entry.br = zlib.brotliCompressSync(body, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } });
      entry.gzip = zlib.gzipSync(body, { level: 9 });
    }
    cache.set(file, entry);
    return entry;
  }

  function resolve(urlPath) {
    let decoded;
    try {
      decoded = decodeURIComponent(urlPath);
    } catch {
      return null;
    }
    const file = path.resolve(root, '.' + path.posix.normalize('/' + decoded));
    if (!file.startsWith(root + path.sep)) return null;
    try {
      return fs.statSync(file).isFile() ? file : null;
    } catch {
      return null;
    }
  }

  return {
    /** Returns a cache-busting URL for an asset, e.g. /css/site.css?v=abc123 */
    url(urlPath) {
      if (versions.has(urlPath)) return versions.get(urlPath);
      const file = resolve(urlPath);
      const v = file ? load(file).etag.slice(1, 9) : '0';
      const out = `${urlPath}?v=${v}`;
      versions.set(urlPath, out);
      return out;
    },
    exists(urlPath) {
      return Boolean(resolve(urlPath));
    },
    handle(req, res, url) {
      if (req.method !== 'GET' && req.method !== 'HEAD') return false;
      const file = resolve(url.pathname);
      if (!file) return false;
      const entry = load(file);
      const immutable = url.searchParams.has('v');
      res.setHeader('Content-Type', entry.type);
      res.setHeader('ETag', entry.etag);
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
      if (entry.type.startsWith('font/')) res.setHeader('Access-Control-Allow-Origin', '*');
      if (req.headers['if-none-match'] === entry.etag) {
        res.statusCode = 304;
        res.end();
        return true;
      }
      const accept = String(req.headers['accept-encoding'] || '');
      let body = entry.body;
      res.statusCode = 200;
      if (entry.br && /\bbr\b/.test(accept)) {
        body = entry.br;
        res.setHeader('Content-Encoding', 'br');
      } else if (entry.gzip && /\bgzip\b/.test(accept)) {
        body = entry.gzip;
        res.setHeader('Content-Encoding', 'gzip');
      } else {
        // Byte ranges, which Safari needs before it will play a video.
        res.setHeader('Accept-Ranges', 'bytes');
        const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || '').trim());
        if (m && (m[1] || m[2])) {
          const size = entry.body.length;
          const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
          const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
          if (start > end || start >= size) {
            res.statusCode = 416;
            res.setHeader('Content-Range', `bytes */${size}`);
            res.end();
            return true;
          }
          body = entry.body.subarray(start, end + 1);
          res.statusCode = 206;
          res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
        }
      }
      res.setHeader('Content-Length', body.length);
      res.end(req.method === 'HEAD' ? undefined : body);
      return true;
    },
  };
}
