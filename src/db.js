import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

/*
 * The guest database. In production it is Postgres (set DATABASE_URL); for local
 * development and tests it falls back to SQLite, built into Node, with no setup.
 * Both share the same queries; every method is async.
 */

/* Invitation codes avoid characters that are easy to misread: no 0/O, 1/I/L. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCode(length = 8) {
  let s = '';
  for (let i = 0; i < length; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
}
export const normaliseCode = (input) => String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const displayCode = (code) => (code && code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

/* ---------- Schema ---------- */

const MIGRATIONS = {
  sqlite: [
    `CREATE TABLE IF NOT EXISTS invitations (
       id          INTEGER PRIMARY KEY,
       code        TEXT    NOT NULL UNIQUE,
       name        TEXT    NOT NULL,
       seats       INTEGER NOT NULL CHECK (seats BETWEEN 1 AND 50),
       events      TEXT    NOT NULL DEFAULT '[]',
       side        TEXT    NOT NULL DEFAULT '',
       category    TEXT    NOT NULL DEFAULT '',
       phone       TEXT    NOT NULL DEFAULT '',
       email       TEXT    NOT NULL DEFAULT '',
       notes       TEXT    NOT NULL DEFAULT '',
       sent_at     TEXT,
       created_at  TEXT    NOT NULL,
       updated_at  TEXT    NOT NULL
     );
     CREATE TABLE IF NOT EXISTS responses (
       id             INTEGER PRIMARY KEY,
       invitation_id  INTEGER NOT NULL UNIQUE REFERENCES invitations(id) ON DELETE CASCADE,
       full_name      TEXT    NOT NULL,
       phone          TEXT    NOT NULL,
       email          TEXT    NOT NULL DEFAULT '',
       attending      INTEGER NOT NULL CHECK (attending IN (0, 1)),
       guests         INTEGER NOT NULL,
       events         TEXT    NOT NULL DEFAULT '[]',
       dietary        TEXT    NOT NULL DEFAULT '',
       accessibility  TEXT    NOT NULL DEFAULT '',
       message        TEXT    NOT NULL DEFAULT '',
       revisions      INTEGER NOT NULL DEFAULT 1,
       created_at     TEXT    NOT NULL,
       updated_at     TEXT    NOT NULL
     );
     CREATE TABLE IF NOT EXISTS announcements (
       id          INTEGER PRIMARY KEY,
       body        TEXT NOT NULL,
       created_at  TEXT NOT NULL
     );
     CREATE INDEX IF NOT EXISTS invitations_name ON invitations (name COLLATE NOCASE);`,
  ],
  postgres: [
    `CREATE TABLE IF NOT EXISTS invitations (
       id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       code        TEXT        NOT NULL UNIQUE,
       name        TEXT        NOT NULL,
       seats       INTEGER     NOT NULL CHECK (seats BETWEEN 1 AND 50),
       events      TEXT        NOT NULL DEFAULT '[]',
       side        TEXT        NOT NULL DEFAULT '',
       category    TEXT        NOT NULL DEFAULT '',
       phone       TEXT        NOT NULL DEFAULT '',
       email       TEXT        NOT NULL DEFAULT '',
       notes       TEXT        NOT NULL DEFAULT '',
       sent_at     TIMESTAMPTZ,
       created_at  TIMESTAMPTZ NOT NULL,
       updated_at  TIMESTAMPTZ NOT NULL
     );
     CREATE TABLE IF NOT EXISTS responses (
       id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       invitation_id  INTEGER     NOT NULL UNIQUE REFERENCES invitations(id) ON DELETE CASCADE,
       full_name      TEXT        NOT NULL,
       phone          TEXT        NOT NULL,
       email          TEXT        NOT NULL DEFAULT '',
       attending      BOOLEAN     NOT NULL,
       guests         INTEGER     NOT NULL,
       events         TEXT        NOT NULL DEFAULT '[]',
       dietary        TEXT        NOT NULL DEFAULT '',
       accessibility  TEXT        NOT NULL DEFAULT '',
       message        TEXT        NOT NULL DEFAULT '',
       revisions      INTEGER     NOT NULL DEFAULT 1,
       created_at     TIMESTAMPTZ NOT NULL,
       updated_at     TIMESTAMPTZ NOT NULL
     );
     CREATE TABLE IF NOT EXISTS announcements (
       id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
       body        TEXT        NOT NULL,
       created_at  TIMESTAMPTZ NOT NULL
     );
     CREATE INDEX IF NOT EXISTS invitations_name ON invitations (lower(name));`,
  ],
};

const DIALECTS = {
  sqlite: { like: 'LIKE', byName: 'i.name COLLATE NOCASE, i.id', bool: (b) => (b ? 1 : 0) },
  postgres: { like: 'ILIKE', byName: 'lower(i.name), i.id', bool: (b) => Boolean(b) },
};

/* ---------- Drivers: the same small interface over SQLite and Postgres ---------- */

function sqliteDriver(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');
  const q = {
    dialect: 'sqlite',
    async all(sql, params = []) {
      return db.prepare(sql).all(...params);
    },
    async get(sql, params = []) {
      return db.prepare(sql).get(...params);
    },
    async run(sql, params = []) {
      return { changes: Number(db.prepare(sql).run(...params).changes) };
    },
    async exec(sql) {
      db.exec(sql);
    },
    // Every statement is synchronous, so no other request can interleave inside the transaction.
    async transaction(fn) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const out = await fn(q);
        db.exec('COMMIT');
        return out;
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    async close() {
      db.close();
    },
  };
  return q;
}

const toPg = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

function sslOption(value) {
  const v = String(value || '').toLowerCase();
  if (v === 'no-verify') return { rejectUnauthorized: false };
  if (v === 'true' || v === 'require' || v === '1') return true;
  return undefined;
}

async function postgresDriver(url, { ssl, schema } = {}) {
  const { default: pg } = await import('pg');
  if (schema && !/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error(`Invalid schema name: ${schema}`);
  const pool = new pg.Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_SIZE) || 5,
    ssl: sslOption(ssl),
    ...(schema ? { options: `-c search_path=${schema}` } : {}),
  });
  pool.on('error', (err) => console.error('Postgres connection error:', err.message));
  if (schema) await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);

  const wrap = (client) => ({
    dialect: 'postgres',
    async all(sql, params = []) {
      return (await client.query(toPg(sql), params)).rows;
    },
    async get(sql, params = []) {
      return (await client.query(toPg(sql), params)).rows[0];
    },
    async run(sql, params = []) {
      return { changes: (await client.query(toPg(sql), params)).rowCount };
    },
    async exec(sql) {
      await client.query(sql);
    },
  });
  const q = wrap(pool);
  q.transaction = async (fn) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const out = await fn(wrap(client));
      await client.query('COMMIT');
      return out;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  };
  q.close = () => pool.end();
  q.dropSchema = async () => {
    if (schema) await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  };
  return q;
}

async function migrate(q) {
  await q.exec('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
  const row = await q.get('SELECT MAX(version) AS v FROM schema_version');
  const steps = MIGRATIONS[q.dialect];
  for (let v = Number(row?.v || 0); v < steps.length; v++) {
    await q.transaction(async (t) => {
      await t.exec(steps[v]);
      await t.run('INSERT INTO schema_version (version) VALUES (?)', [v + 1]);
    });
  }
}

/* ---------- Rows ---------- */

const parseList = (s) => {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};
const iso = (v) => (v === null || v === undefined ? null : v instanceof Date ? v.toISOString() : String(v));

function toInvitation(row) {
  if (!row) return null;
  const inv = {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    seats: Number(row.seats),
    events: parseList(row.events),
    side: row.side,
    category: row.category,
    phone: row.phone,
    email: row.email,
    notes: row.notes,
    sentAt: iso(row.sent_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    response: null,
  };
  if (row.r_id !== undefined && row.r_id !== null) {
    inv.response = {
      id: Number(row.r_id),
      fullName: row.r_full_name,
      phone: row.r_phone,
      email: row.r_email,
      attending: Boolean(row.r_attending),
      guests: Number(row.r_guests),
      events: parseList(row.r_events),
      dietary: row.r_dietary,
      accessibility: row.r_accessibility,
      message: row.r_message,
      revisions: Number(row.r_revisions),
      createdAt: iso(row.r_created_at),
      updatedAt: iso(row.r_updated_at),
    };
  }
  return inv;
}

const SELECT = `
  SELECT i.*, r.id AS r_id, r.full_name AS r_full_name, r.phone AS r_phone, r.email AS r_email,
         r.attending AS r_attending, r.guests AS r_guests, r.events AS r_events, r.dietary AS r_dietary,
         r.accessibility AS r_accessibility, r.message AS r_message, r.revisions AS r_revisions,
         r.created_at AS r_created_at, r.updated_at AS r_updated_at
  FROM invitations i LEFT JOIN responses r ON r.invitation_id = i.id`;

const isUniqueViolation = (err) => err?.code === '23505' || /UNIQUE constraint failed: invitations\.code/.test(err?.message || '');
const fieldError = (field, message) => Object.assign(new Error(message), { field });

/* ---------- Repository ---------- */

function repository(q, { now }) {
  const d = DIALECTS[q.dialect];
  const stamp = () => now().toISOString();

  const codeTaken = async (code, exceptId = 0) =>
    Boolean(await q.get('SELECT 1 AS x FROM invitations WHERE code = ? AND id <> ?', [code, exceptId]));

  async function uniqueCode() {
    for (let i = 0; i < 20; i++) {
      const c = generateCode();
      if (!(await codeTaken(c))) return c;
    }
    throw new Error('Could not generate a unique invitation code.');
  }

  const api = {
    dialect: q.dialect,

    /** Raw rows, for maintenance scripts and tests. */
    query: (sql, params) => q.all(sql, params),

    /* ----- Invitations ----- */

    async listInvitations({ q: search = '', status = '', side = '' } = {}) {
      const where = [];
      const params = [];
      if (search) {
        const like = `%${search.replace(/[%_\\]/g, '')}%`;
        where.push(
          `(i.name ${d.like} ? OR i.code ${d.like} ? OR i.phone ${d.like} ? OR i.category ${d.like} ? OR r.full_name ${d.like} ?)`,
        );
        params.push(like, `%${normaliseCode(search) || search}%`, like, like, like);
      }
      if (status === 'awaiting') where.push('r.id IS NULL');
      if (status === 'attending') {
        where.push('r.attending = ?');
        params.push(d.bool(true));
      }
      if (status === 'declined') {
        where.push('r.attending = ?');
        params.push(d.bool(false));
      }
      if (side) {
        where.push('i.side = ?');
        params.push(side);
      }
      const sql = `${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${d.byName}`;
      return (await q.all(sql, params)).map(toInvitation);
    },

    async getInvitation(id) {
      const n = Number(id);
      if (!Number.isSafeInteger(n) || n < 1 || n > 2147483647) return null;
      return toInvitation(await q.get(`${SELECT} WHERE i.id = ?`, [n]));
    },

    async findByCode(input) {
      const code = normaliseCode(input);
      if (code.length < 4 || code.length > 40) return null;
      return toInvitation(await q.get(`${SELECT} WHERE i.code = ?`, [code]));
    },

    async createInvitation(data) {
      const code = data.code ? normaliseCode(data.code) : await uniqueCode();
      if (code.length < 4) throw fieldError('code', 'Codes need at least 4 letters or numbers.');
      if (await codeTaken(code)) throw fieldError('code', `The code ${displayCode(code)} is already in use.`);
      const t = stamp();
      try {
        const row = await q.get(
          `INSERT INTO invitations (code, name, seats, events, side, category, phone, email, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
          [code, data.name, data.seats, JSON.stringify(data.events || []), data.side || '', data.category || '', data.phone || '', data.email || '', data.notes || '', t, t],
        );
        return api.getInvitation(row.id);
      } catch (err) {
        if (isUniqueViolation(err)) throw fieldError('code', `The code ${displayCode(code)} is already in use.`);
        throw err;
      }
    },

    async updateInvitation(id, data) {
      await q.run(
        `UPDATE invitations SET name = ?, seats = ?, events = ?, side = ?, category = ?, phone = ?, email = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
        [data.name, data.seats, JSON.stringify(data.events || []), data.side || '', data.category || '', data.phone || '', data.email || '', data.notes || '', stamp(), Number(id)],
      );
      return api.getInvitation(id);
    },

    async regenerateCode(id) {
      await q.run('UPDATE invitations SET code = ?, updated_at = ? WHERE id = ?', [await uniqueCode(), stamp(), Number(id)]);
      return api.getInvitation(id);
    },

    async markSent(id) {
      await q.run('UPDATE invitations SET sent_at = ? WHERE id = ?', [stamp(), Number(id)]);
    },

    async deleteInvitation(id) {
      return (await q.run('DELETE FROM invitations WHERE id = ?', [Number(id)])).changes > 0;
    },

    /* ----- Responses ----- */

    async saveResponse(invitationId, r) {
      const t = stamp();
      await q.run(
        `INSERT INTO responses (invitation_id, full_name, phone, email, attending, guests, events, dietary, accessibility, message, revisions, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT (invitation_id) DO UPDATE SET
           full_name = excluded.full_name, phone = excluded.phone, email = excluded.email,
           attending = excluded.attending, guests = excluded.guests, events = excluded.events,
           dietary = excluded.dietary, accessibility = excluded.accessibility, message = excluded.message,
           revisions = responses.revisions + 1, updated_at = excluded.updated_at`,
        [Number(invitationId), r.fullName, r.phone, r.email || '', d.bool(r.attending), r.guests, JSON.stringify(r.events || []), r.dietary || '', r.accessibility || '', r.message || '', t, t],
      );
      return api.getInvitation(invitationId);
    },

    async clearResponse(invitationId) {
      await q.run('DELETE FROM responses WHERE invitation_id = ?', [Number(invitationId)]);
    },

    /* ----- Announcements ----- */

    async listAnnouncements() {
      const rows = await q.all('SELECT id, body, created_at FROM announcements ORDER BY created_at DESC, id DESC');
      return rows.map((a) => ({ id: Number(a.id), body: a.body, createdAt: iso(a.created_at) }));
    },
    async addAnnouncement(body) {
      await q.run('INSERT INTO announcements (body, created_at) VALUES (?, ?)', [body, stamp()]);
    },
    async deleteAnnouncement(id) {
      await q.run('DELETE FROM announcements WHERE id = ?', [Number(id)]);
    },
  };
  return api;
}

/**
 * Opens the database: Postgres when `url` is given, otherwise SQLite at `file`.
 * `schema` (Postgres only) isolates tables in their own schema, used by the tests.
 */
export async function openDatabase({ url = '', file = ':memory:', ssl, schema, now = () => new Date() } = {}) {
  const driver = url ? await postgresDriver(url, { ssl, schema }) : sqliteDriver(file);
  try {
    await migrate(driver);
  } catch (err) {
    await Promise.resolve(driver.close()).catch(() => {});
    throw err;
  }
  const db = repository(driver, { now });
  db.tx = (fn) => driver.transaction((t) => fn(repository(t, { now })));
  db.close = () => driver.close();
  db.dropSchema = driver.dropSchema || (async () => {});
  return db;
}
