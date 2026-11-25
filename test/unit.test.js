import test from 'node:test';
import assert from 'node:assert/strict';
import { tbc, filled, placeholders } from '../src/tbc.js';
import { html, raw } from '../src/html.js';
import { parseCsv, toCsv } from '../src/csv.js';
import { openDatabase, generateCode, normaliseCode, displayCode } from '../src/db.js';
import { validateReply, rsvpWindow, countdownTarget, checkContent } from '../src/rsvp.js';
import { createClock } from '../src/format.js';
import { buildCalendar } from '../src/ics.js';
import { createAuth } from '../src/auth.js';
import { phoneDigits } from '../src/views/parts.js';
import { contentChecklist } from '../src/content.js';
import content from '../content/wedding.js';
import { testContent } from './helpers.js';

test('placeholders are never treated as content', () => {
  assert.equal(filled(tbc('Venue')), false);
  assert.equal(filled(''), false);
  assert.equal(filled([tbc('a'), null]), false);
  assert.equal(filled('Christ Church'), true);
  const found = placeholders({ a: { b: [tbc('x'), 'y'] }, c: tbc('z') });
  assert.deepEqual(found.map((p) => p.path), ['a.b[0]', 'c']);
});

test('html escapes interpolated values and drops placeholders', () => {
  const evil = '<script>alert("x")</script>';
  assert.equal(String(html`<p title="${evil}">${evil}</p>`), '<p title="&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;">&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>');
  assert.equal(String(html`<p>${raw('<em>ok</em>')}</p>`), '<p><em>ok</em></p>');
  assert.equal(String(html`<p>${tbc('hidden')}${null}${false}</p>`), '<p></p>');
  assert.equal(String(html`<ul>${['a', 'b'].map((x) => html`<li>${x}</li>`)}</ul>`), '<ul><li>a</li><li>b</li></ul>');
});

test('csv parses quotes and protects spreadsheets from formulas', () => {
  const rows = parseCsv('﻿name,notes\r\n"Okafor, Chidi","said ""hi"""\n\nTolu,\n');
  assert.deepEqual(rows, [['name', 'notes'], ['Okafor, Chidi', 'said "hi"'], ['Tolu', '']]);
  const out = toCsv([['=HYPERLINK("x")', '+234 803 000 0000', '-1+2', '@cmd']]);
  assert.equal(out, '﻿"\'=HYPERLINK(""x"")",+234 803 000 0000,\'-1+2,\'@cmd\r\n');
});

test('invitation codes are unambiguous and normalised', () => {
  for (let i = 0; i < 200; i++) assert.match(generateCode(), /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
  assert.equal(normaliseCode(' abcd-2345 '), 'ABCD2345');
  assert.equal(displayCode('ABCD2345'), 'ABCD-2345');
});

test('database keeps one reply per invitation and counts revisions', () => {
  const db = openDatabase(':memory:');
  const inv = db.createInvitation({ name: 'The Okafor Family', seats: 3, events: ['church'] });
  assert.equal(db.findByCode(displayCode(inv.code).toLowerCase()).id, inv.id);
  assert.throws(() => db.createInvitation({ name: 'Dup', seats: 1, code: inv.code }), /already in use/);

  const reply = { attending: true, fullName: 'Chidi Okafor', phone: '0803 000 0000', guests: 2, events: ['church'] };
  db.saveResponse(inv.id, reply);
  const updated = db.saveResponse(inv.id, { ...reply, guests: 3 });
  assert.equal(updated.response.guests, 3);
  assert.equal(updated.response.revisions, 2);
  assert.equal(db.listInvitations({ status: 'attending' }).length, 1);
  assert.equal(db.listInvitations({ status: 'awaiting' }).length, 0);

  const newCode = db.regenerateCode(inv.id).code;
  assert.notEqual(newCode, inv.code);
  assert.equal(db.findByCode(inv.code), null);

  db.deleteInvitation(inv.id);
  assert.equal(db.raw.prepare('SELECT COUNT(*) AS n FROM responses').get().n, 0);
  db.close();
});

test('replies are validated against the invitation', () => {
  const invitation = { seats: 2, events: ['church', 'reception'] };
  const events = [{ id: 'church' }, { id: 'reception' }];
  const form = (o) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(o)) [].concat(v).forEach((x) => p.append(k, x));
    return p;
  };

  let r = validateReply(form({}), invitation, events);
  assert.deepEqual(Object.keys(r.errors).sort(), ['attending', 'fullName', 'phone']);

  r = validateReply(form({ attending: 'yes', fullName: 'Ada', phone: '0803 000 0000', guests: '3', events: 'church' }), invitation, events);
  assert.match(r.errors.guests, /up to 2/);

  r = validateReply(form({ attending: 'yes', fullName: 'Ada', phone: '0803 000 0000', guests: '2', events: ['church', 'traditional'] }), invitation, events);
  assert.equal(r.ok, true);
  assert.deepEqual(r.value.events, ['church']);

  r = validateReply(form({ attending: 'yes', fullName: 'Ada', phone: '12', guests: '1' }), invitation, events);
  assert.ok(r.errors.phone);
  assert.ok(r.errors.events);

  r = validateReply(form({ attending: 'no', fullName: 'Ada', phone: '+234 803 000 0000', guests: '2', events: 'church', dietary: 'none' }), invitation, events);
  assert.equal(r.ok, true);
  assert.equal(r.value.guests, 0);
  assert.deepEqual(r.value.events, []);
  assert.equal(r.value.dietary, '');
});

test('dates and times read in the wedding’s time zone', () => {
  const clock = createClock(content);
  assert.equal(clock.dateLong('2026-11-28'), 'Saturday 28 November 2026');
  assert.equal(clock.time('10:00'), '10 am');
  assert.equal(clock.time('16:30'), '4:30 pm');
  assert.equal(clock.day(new Date('2026-11-27T23:30:00Z')), '2026-11-28');
});

test('replies close after the deadline and after the wedding', () => {
  const c = testContent();
  const clock = createClock(c);
  assert.equal(rsvpWindow(c, clock, new Date('2026-11-21T23:00:00+01:00')).open, true);
  assert.equal(rsvpWindow(c, clock, new Date('2026-11-22T00:01:00+01:00')).reason, 'deadline');
  const noDeadline = { ...c, rsvp: { ...c.rsvp, deadline: tbc('x') } };
  assert.equal(rsvpWindow(noDeadline, clock, new Date('2026-11-28T09:00:00+01:00')).open, true);
  assert.equal(rsvpWindow(noDeadline, clock, new Date('2026-11-29T09:00:00+01:00')).reason, 'after');
});

test('the countdown runs to the first confirmed event on the day', () => {
  const c = testContent();
  assert.equal(countdownTarget(c, createClock(c)).toISOString(), '2026-11-28T09:00:00.000Z');
  assert.equal(countdownTarget(content, createClock(content)).toISOString(), '2026-11-27T23:00:00.000Z');
});

test('calendar files use UTC and fold long lines', () => {
  const c = testContent();
  const ics = buildCalendar({ content: c, clock: createClock(c), events: c.events, publicUrl: 'https://example.com', now: new Date('2026-11-20T00:00:00Z') });
  assert.match(ics, /DTSTART:20261128T090000Z/);
  assert.match(ics, /DTEND:20261128T120000Z/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 3);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, line);
});

test('sessions, CSRF tokens and invite cookies are signed', () => {
  let now = new Date('2026-11-20T12:00:00Z');
  const auth = createAuth({ sessionSecret: 'x'.repeat(32), adminPassword: 'secret-password', secureCookies: false, now: () => now });
  assert.equal(auth.checkPassword('secret-password'), true);
  assert.equal(auth.checkPassword('nope'), false);
  const { token } = auth.issueSession();
  assert.equal(auth.verifySession(token), true);
  assert.equal(auth.verifySession(token.replace(/.$/, (c) => (c === 'a' ? 'b' : 'a'))), false);
  assert.equal(auth.verifyCsrf(token, auth.csrfToken(token)), true);
  assert.equal(auth.verifyCsrf(token, 'forged'), false);
  assert.equal(auth.readInvite(auth.signInvite('ABCD2345')), 'ABCD2345');
  assert.equal(auth.readInvite('ABCD2345.forged'), null);
  now = new Date('2026-11-21T12:00:00Z');
  assert.equal(auth.verifySession(token), false);
});

test('phone numbers become WhatsApp-ready digits', () => {
  assert.equal(phoneDigits('0803 000 0000'), '2348030000000');
  assert.equal(phoneDigits('+234 (803) 000-0000'), '2348030000000');
  assert.equal(phoneDigits('00447700900000'), '447700900000');
});

test('the shipped content is valid and its placeholders are listed', () => {
  assert.deepEqual(checkContent(content), []);
  const groups = contentChecklist(content);
  assert.ok(groups.length > 5);
  assert.ok(groups.some((g) => g.label.startsWith('The celebration: Church wedding')));
  assert.deepEqual(checkContent({ ...content, events: [{ id: 'Bad Id', name: 'x', status: 'live', access: 'open' }] }).length, 2);
});
