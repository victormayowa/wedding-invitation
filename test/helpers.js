import http from 'node:http';
import base from '../content/wedding.js';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/app.js';
import { checkContent } from '../src/rsvp.js';

/** Content as it might look once details are confirmed. */
export function testContent(overrides = {}) {
  const venue = (name) => ({
    name,
    address: '1 Test Road, Ado-Ekiti',
    mapQuery: 'Test venue, Ado-Ekiti',
    landmarks: null,
    parking: null,
    transport: null,
    image: null,
  });
  return {
    ...base,
    rsvp: { ...base.rsvp, deadline: '2026-11-21' },
    events: [
      { ...base.events[0], status: 'confirmed', access: 'open', date: '2026-11-27', start: '11:00', end: '15:00', venue: venue('Test Hall') },
      { ...base.events[1], status: 'confirmed', access: 'open', start: '10:00', end: null, venue: venue('Test Church') },
      { ...base.events[2], status: 'confirmed', access: 'private', start: '14:00', end: '18:00', venue: venue('Test Reception') },
      { ...base.events[3], status: 'draft' },
    ],
    gifts: { ...base.gifts, details: [{ label: 'Bank transfer', lines: ['Test Account', 'Test Bank', '0123456789'] }] },
    ...overrides,
  };
}

export const ADMIN_PASSWORD = 'correct-horse-battery';

/** Starts the real app on a random port with an in-memory database. */
export async function startServer({ content = testContent(), now = '2026-11-20T12:00:00+01:00', showPlaceholders = false } = {}) {
  let current = new Date(now);
  const config = {
    production: false,
    port: 0,
    publicUrl: 'http://wedding.test',
    secureCookies: false,
    adminPassword: ADMIN_PASSWORD,
    sessionSecret: 'test-secret-'.repeat(4),
    trustProxy: false,
    showPlaceholders,
    now: () => new Date(current),
  };
  const db = openDatabase(':memory:', { now: config.now });
  const app = createApp({ config, content, contentProblems: checkContent(content), db });
  const server = http.createServer(app.handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    db,
    content,
    setNow: (iso) => {
      current = new Date(iso);
    },
    client: () => client(origin),
    close: () =>
      new Promise((resolve) => {
        server.close(() => {
          db.close();
          resolve();
        });
      }),
  };
}

/** A tiny browser: keeps cookies and never follows redirects. */
export function client(origin) {
  const jar = new Map();
  async function request(path, { method = 'GET', form, headers = {} } = {}) {
    const h = { ...headers };
    if (jar.size) h.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    let body;
    if (form) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(form)) [].concat(v).forEach((x) => params.append(k, x));
      body = params.toString();
      h['content-type'] = 'application/x-www-form-urlencoded';
    }
    const res = await fetch(origin + path, { method, headers: h, body, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(';');
      const i = pair.indexOf('=');
      const name = pair.slice(0, i);
      const value = pair.slice(i + 1);
      if (attrs.some((a) => /max-age=0/i.test(a.trim()))) jar.delete(name);
      else jar.set(name, value);
    }
    const text = await res.text();
    return { status: res.status, headers: res.headers, text, location: res.headers.get('location') };
  }
  return {
    jar,
    get: (path, opts) => request(path, opts),
    post: (path, form, opts = {}) => request(path, { ...opts, method: 'POST', form }),
    async login(password = ADMIN_PASSWORD) {
      return request('/admin/login', { method: 'POST', form: { password } });
    },
    /** Reads the CSRF token from an admin page. */
    async csrf(path = '/admin') {
      const page = await request(path);
      const m = /name="_csrf" value="([^"]+)"/.exec(page.text);
      return m ? m[1] : '';
    },
  };
}
