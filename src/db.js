import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

/* Invitation codes avoid characters that are easy to misread: no 0/O, 1/I/L. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCode(length = 8) {
  let s = '';
  for (let i = 0; i < length; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
}
export const normaliseCode = (input) => String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export const displayCode = (code) => (code && code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);

const MIGRATIONS = [
  `
  CREATE TABLE invitations (
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
  CREATE TABLE responses (
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
  CREATE TABLE announcements (
    id          INTEGER PRIMARY KEY,
    body        TEXT NOT NULL,
    created_at  TEXT NOT NULL
  );
  CREATE INDEX invitations_name ON invitations (name COLLATE NOCASE);
  `,
];

const parseList = (s) => {
  try {
    const v = JSON.parse(s || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
};

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
    sentAt: row.sent_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
      createdAt: row.r_created_at,
      updatedAt: row.r_updated_at,
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

export function openDatabase(file, { now = () => new Date() } = {}) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  if (file !== ':memory:') db.exec('PRAGMA journal_mode = WAL;');

  const version = Number(db.prepare('PRAGMA user_version').get().user_version);
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.exec('BEGIN');
    db.exec(MIGRATIONS[v]);
    db.exec(`PRAGMA user_version = ${v + 1}`);
    db.exec('COMMIT');
  }

  const stamp = () => now().toISOString();

  function tx(fn) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const out = fn();
      db.exec('COMMIT');
      return out;
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  const codeTaken = (code, exceptId = 0) =>
    Boolean(db.prepare('SELECT 1 FROM invitations WHERE code = ? AND id != ?').get(code, exceptId));

  function uniqueCode() {
    for (let i = 0; i < 20; i++) {
      const c = generateCode();
      if (!codeTaken(c)) return c;
    }
    throw new Error('Could not generate a unique invitation code.');
  }

  const api = {
    raw: db,
    tx,
    close: () => db.close(),

    /* ----- Invitations ----- */

    listInvitations({ q = '', status = '', side = '' } = {}) {
      const where = [];
      const params = [];
      if (q) {
        where.push('(i.name LIKE ? OR i.code LIKE ? OR i.phone LIKE ? OR i.category LIKE ? OR r.full_name LIKE ?)');
        const like = `%${q.replace(/[%_]/g, '')}%`;
        params.push(like, `%${normaliseCode(q) || q}%`, like, like, like);
      }
      if (status === 'awaiting') where.push('r.id IS NULL');
      if (status === 'attending') where.push('r.attending = 1');
      if (status === 'declined') where.push('r.attending = 0');
      if (side) {
        where.push('i.side = ?');
        params.push(side);
      }
      const sql = `${SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY i.name COLLATE NOCASE, i.id`;
      return db.prepare(sql).all(...params).map(toInvitation);
    },

    getInvitation(id) {
      return toInvitation(db.prepare(`${SELECT} WHERE i.id = ?`).get(Number(id)));
    },

    findByCode(input) {
      const code = normaliseCode(input);
      if (code.length < 4) return null;
      return toInvitation(db.prepare(`${SELECT} WHERE i.code = ?`).get(code));
    },

    createInvitation(data) {
      const code = data.code ? normaliseCode(data.code) : uniqueCode();
      if (code.length < 4) throw Object.assign(new Error('Codes need at least 4 letters or numbers.'), { field: 'code' });
      if (codeTaken(code)) throw Object.assign(new Error(`The code ${displayCode(code)} is already in use.`), { field: 'code' });
      const t = stamp();
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO invitations (code, name, seats, events, side, category, phone, email, notes, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          code,
          data.name,
          data.seats,
          JSON.stringify(data.events || []),
          data.side || '',
          data.category || '',
          data.phone || '',
          data.email || '',
          data.notes || '',
          t,
          t,
        );
      return api.getInvitation(Number(lastInsertRowid));
    },

    updateInvitation(id, data) {
      db.prepare(
        `UPDATE invitations SET name = ?, seats = ?, events = ?, side = ?, category = ?, phone = ?, email = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
      ).run(
        data.name,
        data.seats,
        JSON.stringify(data.events || []),
        data.side || '',
        data.category || '',
        data.phone || '',
        data.email || '',
        data.notes || '',
        stamp(),
        Number(id),
      );
      return api.getInvitation(id);
    },

    regenerateCode(id) {
      db.prepare('UPDATE invitations SET code = ?, updated_at = ? WHERE id = ?').run(uniqueCode(), stamp(), Number(id));
      return api.getInvitation(id);
    },

    markSent(id) {
      db.prepare('UPDATE invitations SET sent_at = ? WHERE id = ?').run(stamp(), Number(id));
    },

    deleteInvitation(id) {
      return db.prepare('DELETE FROM invitations WHERE id = ?').run(Number(id)).changes > 0;
    },

    /* ----- Responses ----- */

    saveResponse(invitationId, r) {
      const t = stamp();
      db.prepare(
        `INSERT INTO responses (invitation_id, full_name, phone, email, attending, guests, events, dietary, accessibility, message, revisions, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
         ON CONFLICT (invitation_id) DO UPDATE SET
           full_name = excluded.full_name, phone = excluded.phone, email = excluded.email,
           attending = excluded.attending, guests = excluded.guests, events = excluded.events,
           dietary = excluded.dietary, accessibility = excluded.accessibility, message = excluded.message,
           revisions = responses.revisions + 1, updated_at = excluded.updated_at`,
      ).run(
        Number(invitationId),
        r.fullName,
        r.phone,
        r.email || '',
        r.attending ? 1 : 0,
        r.guests,
        JSON.stringify(r.events || []),
        r.dietary || '',
        r.accessibility || '',
        r.message || '',
        t,
        t,
      );
      return api.getInvitation(invitationId);
    },

    clearResponse(invitationId) {
      db.prepare('DELETE FROM responses WHERE invitation_id = ?').run(Number(invitationId));
    },

    /* ----- Announcements ----- */

    listAnnouncements() {
      return db
        .prepare('SELECT id, body, created_at FROM announcements ORDER BY created_at DESC, id DESC')
        .all()
        .map((a) => ({ id: Number(a.id), body: a.body, createdAt: a.created_at }));
    },
    addAnnouncement(body) {
      db.prepare('INSERT INTO announcements (body, created_at) VALUES (?, ?)').run(body, stamp());
    },
    deleteAnnouncement(id) {
      db.prepare('DELETE FROM announcements WHERE id = ?').run(Number(id));
    },
  };
  return api;
}
