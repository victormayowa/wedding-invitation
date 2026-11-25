import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Reads settings from the environment (and .env, when present). */
export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const port = Number(env.PORT) || 3000;
  const problems = [];

  let adminPassword = env.ADMIN_PASSWORD || '';
  let sessionSecret = env.SESSION_SECRET || '';
  let generatedPassword = false;

  if (!adminPassword) {
    if (production) problems.push('ADMIN_PASSWORD is not set.');
    adminPassword = crypto.randomBytes(9).toString('base64url');
    generatedPassword = true;
  } else if (production && adminPassword.length < 10) {
    problems.push('ADMIN_PASSWORD should be at least 10 characters.');
  }
  if (!sessionSecret) {
    if (production) problems.push('SESSION_SECRET is not set.');
    sessionSecret = crypto.randomBytes(32).toString('hex');
  }

  const nowOverride = !production && env.NOW ? new Date(env.NOW) : null;
  if (nowOverride && Number.isNaN(nowOverride.getTime())) problems.push(`NOW is not a valid date: ${env.NOW}`);

  const publicUrl = (env.PUBLIC_URL || `http://localhost:${port}`).replace(/\/+$/, '');

  return {
    production,
    port,
    host: env.HOST || '0.0.0.0',
    publicUrl,
    secureCookies: publicUrl.startsWith('https://'),
    dataDir: path.resolve(ROOT, env.DATA_DIR || 'data'),
    // Postgres connection string, e.g. postgres://user:password@host:5432/wedding.
    // Without it the site keeps its data in a SQLite file in dataDir.
    databaseUrl: env.DATABASE_URL || '',
    // 'require' for TLS, 'no-verify' for TLS with a self-signed certificate.
    databaseSsl: env.DATABASE_SSL || '',
    adminPassword,
    generatedPassword,
    sessionSecret,
    trustProxy: env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true',
    showPlaceholders: env.SHOW_PLACEHOLDERS === '1' || env.SHOW_PLACEHOLDERS === 'true',
    now: () => (nowOverride ? new Date(nowOverride) : new Date()),
    problems,
  };
}

/** Loads .env from the project root if one exists. */
export function loadDotEnv() {
  try {
    process.loadEnvFile(path.join(ROOT, '.env'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
