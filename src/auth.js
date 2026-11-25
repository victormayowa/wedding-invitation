import crypto from 'node:crypto';

const ADMIN_COOKIE = 'va_admin';
const INVITE_COOKIE = 'va_invite';
const SESSION_HOURS = 12;

const b64 = (s) => Buffer.from(s).toString('base64url');
const unb64 = (s) => Buffer.from(s, 'base64url').toString('utf8');

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function createAuth({ sessionSecret, adminPassword, secureCookies, now = () => new Date() }) {
  const sign = (value) => crypto.createHmac('sha256', sessionSecret).update(value).digest('base64url');
  const passwordDigest = crypto.createHash('sha256').update(adminPassword).digest();

  return {
    ADMIN_COOKIE,
    INVITE_COOKIE,
    cookieOptions: { secure: secureCookies, httpOnly: true, sameSite: 'Lax' },

    checkPassword(input) {
      const digest = crypto.createHash('sha256').update(String(input || '')).digest();
      return crypto.timingSafeEqual(digest, passwordDigest);
    },

    /** A signed, expiring admin session token. */
    issueSession() {
      const payload = b64(JSON.stringify({ exp: now().getTime() + SESSION_HOURS * 3600e3, n: crypto.randomBytes(8).toString('hex') }));
      return { token: `${payload}.${sign(`session:${payload}`)}`, maxAge: SESSION_HOURS * 3600 };
    },

    verifySession(token) {
      if (!token || typeof token !== 'string') return false;
      const [payload, mac] = token.split('.');
      if (!payload || !mac || !safeEqual(mac, sign(`session:${payload}`))) return false;
      try {
        const { exp } = JSON.parse(unb64(payload));
        return typeof exp === 'number' && exp > now().getTime();
      } catch {
        return false;
      }
    },

    /** CSRF token bound to the admin session. */
    csrfToken(sessionToken) {
      return sign(`csrf:${sessionToken}`);
    },
    verifyCsrf(sessionToken, token) {
      return Boolean(sessionToken && token) && safeEqual(token, sign(`csrf:${sessionToken}`));
    },

    /** Remembers which invitation a guest opened, so the site can greet them. */
    signInvite(code) {
      return `${code}.${sign(`invite:${code}`)}`;
    },
    readInvite(value) {
      if (!value || typeof value !== 'string') return null;
      const i = value.lastIndexOf('.');
      if (i < 1) return null;
      const code = value.slice(0, i);
      return safeEqual(value.slice(i + 1), sign(`invite:${code}`)) ? code : null;
    },
  };
}
