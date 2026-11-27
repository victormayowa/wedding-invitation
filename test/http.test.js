import test from 'node:test';
import assert from 'node:assert/strict';
import { startServer, client, ADMIN_PASSWORD, testContent } from './helpers.js';
import base from '../content/wedding.js';

const reply = (o = {}) => ({ attending: 'yes', fullName: 'Chidi Okafor', phone: '0803 000 0000', guests: '2', events: 'church', ...o });

test('public pages', async (t) => {
  const s = await startServer();
  t.after(() => s.close());
  const c = s.client();

  await t.test('the invitation renders with security headers and no placeholders', async () => {
    const res = await c.get('/');
    assert.equal(res.status, 200);
    assert.match(res.text, /Victor/);
    assert.match(res.text, /Saturday 28 November 2026/);
    assert.match(res.text, /data-countdown="2026-11-28T09:00:00.000Z"/);
    assert.doesNotMatch(res.text, /class="tbc"/);
    assert.doesNotMatch(res.text, /Thanksgiving service/, 'draft events stay hidden');
    assert.doesNotMatch(res.text, /Test Reception/, 'private events stay hidden');
    assert.match(res.text, /0123456789/, 'gift details are public, as on the printed card');
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.match(res.text, /name="robots" content="noindex/);
  });

  await t.test('the shipped content shows the invitation card details and nothing unconfirmed', async () => {
    const plain = await startServer({ content: base });
    const res = await plain.client().get('/');
    const rsvp = await plain.client().get('/rsvp');
    await plain.close();
    assert.equal(res.status, 200);
    assert.doesNotMatch(res.text, /class="tbc"|plate|Thanksgiving service|id="story"/);
    for (const fact of ['Abuja, Nigeria', 'Engr. Dr. Chukwuma &amp; Dcns. Patience Katchy', 'Mr. Omotayo &amp; Mrs. Elizabeth Adeleye', 'Adaeze Ifeoma &amp; Victor Mayowa', 'Living Faith Church, Jahi', 'Admiralty Event Centre', '11 am prompt', 'The bride’s residence', '4102011901']) {
      assert.ok(res.text.includes(fact), `shows ${fact}`);
    }
    // RSVP by phone: every reply button scrolls to the band with call and WhatsApp links.
    assert.match(res.text, /id="rsvp"/);
    assert.match(res.text, /href="tel:\+2347060452660"/);
    assert.match(res.text, /href="https:\/\/wa\.me\/2347033750663\?text=Hello%20Chiaza/);
    assert.doesNotMatch(res.text, /href="\/rsvp"/, 'no link leads to the code page');
    assert.match(rsvp.text, /Kindly RSVP/);
    assert.match(rsvp.text, /tel:\+2347060452660/);
    assert.doesNotMatch(rsvp.text, /Invitation code/);
    // Locations: the couple's own Google Maps links and an embedded map for each venue.
    assert.match(res.text, /href="#locations"/);
    assert.match(res.text, /href="https:\/\/maps\.app\.goo\.gl\/R5dxjq2atjnpQqps9"/);
    assert.match(res.text, /href="https:\/\/maps\.app\.goo\.gl\/jghnDnHpbBmUw5Kc8"/);
    assert.equal((res.text.match(/<iframe src="https:\/\/www\.google\.com\/maps\?q=/g) || []).length, 2);
    // Gallery: one album at a time, no "All".
    assert.doesNotMatch(res.text, /data-album="all"/);
    assert.match(res.text, /aria-pressed="true" data-album="pre-wedding"/);
    assert.match(res.text, /data-album="registry"/);
    // The printed card is shown and can be saved.
    assert.match(res.text, /invitation-iv-card-1334\.webp/);
    assert.match(res.text, /download="NEW-WINE-26-invitation\.jpg"/);
  });

  await t.test('the online reply form with codes returns when byPhone is off', async () => {
    const codes = await startServer({ content: testContent({ rsvp: { ...base.rsvp, byPhone: false, deadline: '2026-11-21' } }) });
    const res = await codes.client().get('/rsvp');
    const home = await codes.client().get('/');
    await codes.close();
    assert.match(res.text, /Invitation code/);
    assert.match(home.text, /href="\/rsvp"/);
  });

  await t.test('preview mode marks placeholders', async () => {
    const preview = await startServer({ content: base, showPlaceholders: true });
    const res = await preview.client().get('/');
    await preview.close();
    assert.match(res.text, /class="tbc"/);
    assert.match(res.text, /Draft: hidden from guests/);
  });

  await t.test('assets, robots and unknown paths', async () => {
    const css = await c.get('/css/site.css?v=1');
    assert.equal(css.status, 200);
    assert.match(css.headers.get('cache-control'), /immutable/);
    assert.equal((await c.get('/robots.txt')).text, 'User-agent: *\nDisallow: /\n');
    assert.equal((await c.get('/nowhere')).status, 404);
    assert.equal((await c.get('/%2e%2e/server.js')).status, 404);
    assert.equal((await c.get('/..%2fpackage.json')).status, 404);
  });

  await t.test('the gallery offers photos and films that stream in byte ranges', async () => {
    const home = await c.get('/');
    assert.match(home.text, /property="og:image" content="http:\/\/wedding\.test\/images\/og\.jpg\?v=/);
    assert.match(home.text, /<a class="gallery__open[^"]*" href="\/videos\/proposal-film-1\.mp4"[^>]*data-video="\/videos\/proposal-film-1\.mp4"/);
    assert.match(home.text, /aria-label="Play film: Victor and Adaeze embracing as guests look on"/);
    assert.match(home.text, /<\/svg> 0:10<\/span>/);
    assert.match(home.text, /NEW WINE’26/);
    assert.match(home.text, /href="\/images\/proposal-03-810\.webp"/, 'gallery links open the largest WebP');
    assert.match(home.text, /pre-wedding-dsc-6740-2400\.webp 2400w/, 'professional photos offer a 2400 px WebP');
    assert.doesNotMatch(home.text, /-2400\.jpg/, 'JPEG fallbacks stop at 1600 px');
    assert.match(home.text, /aria-label="Play film: Victor and Adaeze arriving at the registry with family"/);

    const full = await c.get('/videos/proposal-film-2.mp4');
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('content-type'), 'video/mp4');
    assert.equal(full.headers.get('accept-ranges'), 'bytes');
    const size = Number(full.headers.get('content-length'));

    const part = await fetch(`${s.origin}/videos/proposal-film-2.mp4`, { headers: { range: 'bytes=0-1' } });
    assert.equal(part.status, 206);
    assert.equal(part.headers.get('content-range'), `bytes 0-1/${size}`);
    assert.equal((await part.arrayBuffer()).byteLength, 2);

    const tail = await fetch(`${s.origin}/videos/proposal-film-2.mp4`, { headers: { range: 'bytes=-100' } });
    assert.equal(tail.headers.get('content-range'), `bytes ${size - 100}-${size - 1}/${size}`);

    const beyond = await fetch(`${s.origin}/videos/proposal-film-2.mp4`, { headers: { range: `bytes=${size}-` } });
    assert.equal(beyond.status, 416);
  });

  await t.test('calendar entries exist only for confirmed times', async () => {
    const ics = await c.get('/calendar/church.ics');
    assert.equal(ics.status, 200);
    assert.match(ics.headers.get('content-type'), /text\/calendar/);
    assert.equal((await c.get('/calendar/reception.ics')).status, 404, 'private event');
    assert.equal((await c.get('/calendar/thanksgiving.ics')).status, 404, 'draft event');
  });
});

test('a guest replies with their personal link', async (t) => {
  const s = await startServer();
  t.after(() => s.close());
  const inv = (await s.db.createInvitation({ name: 'The Okafor Family', seats: 2, events: ['traditional', 'church', 'reception'] }));
  const other = (await s.db.createInvitation({ name: 'Tolu', seats: 1, events: ['church'] }));
  const guest = s.client();

  await t.test('unknown links and codes are refused', async () => {
    assert.equal((await guest.get('/i/ZZZZZZZZ')).status, 404);
    const bad = await guest.post('/rsvp/code', { code: 'nope' });
    assert.equal(bad.status, 400);
    assert.match(bad.text, /couldn’t find an invitation/);
  });

  await t.test('the personal link greets the guest and reveals what they are invited to', async () => {
    const res = await guest.get(`/i/${inv.code}`);
    assert.equal(res.status, 200);
    assert.match(res.text, /An invitation for The Okafor Family/);
    assert.match(res.text, /property="og:title" content="An invitation for The Okafor Family"/);
    assert.match(res.text, /Test Reception/);
    assert.match(res.text, /Included in your invitation/);
    assert.match(res.text, /0123456789/, 'gift details for invited guests');
  });

  await t.test('the reply card enforces the seat allocation', async () => {
    const form = await guest.get('/rsvp');
    assert.match(form.text, /Your invitation is for up to 2 guests/);
    assert.match(form.text, /max="2"/);
    const tooMany = await guest.post('/rsvp', reply({ guests: '5' }));
    assert.equal(tooMany.status, 422);
    assert.match(tooMany.text, /up to 2 guests/);
    assert.equal((await s.db.getInvitation(inv.id)).response, null);
  });

  await t.test('a valid reply is saved, confirmed and can be updated', async () => {
    const ok = await guest.post('/rsvp', reply({ events: ['church', 'thanksgiving'] }));
    assert.equal(ok.status, 303);
    assert.equal(ok.location, '/rsvp/thank-you');
    const saved = (await s.db.getInvitation(inv.id)).response;
    assert.deepEqual(saved.events, ['church'], 'events outside the invitation are ignored');
    assert.equal(saved.guests, 2);

    const thanks = await guest.get('/rsvp/thank-you');
    assert.match(thanks.text, /Thank you, Chidi\./);
    assert.match(thanks.text, /Attending · 2 guests/);
    const ics = await guest.get('/calendar.ics');
    assert.match(ics.text, /SUMMARY:Victor & Adaeze: White wedding/);
    assert.doesNotMatch(ics.text, /Traditional/);

    await guest.post('/rsvp', reply({ attending: 'no' }));
    const updated = (await s.db.getInvitation(inv.id)).response;
    assert.equal(updated.attending, false);
    assert.equal(updated.revisions, 2);
    assert.equal((await s.db.getInvitation(other.id)).response, null);
  });

  await t.test('a forged invite cookie is ignored', async () => {
    const forged = client(s.origin);
    forged.jar.set('va_invite', `${inv.code}.forged`);
    const res = await forged.get('/rsvp');
    assert.match(res.text, /Kindly RSVP/, 'treated as a guest without an invitation');
  });

  await t.test('replies close after the deadline', async () => {
    s.setNow('2026-11-22T09:00:00+01:00');
    const res = await guest.get('/rsvp');
    assert.match(res.text, /Replies have now closed/);
    const late = await guest.post('/rsvp', reply());
    assert.match(late.text, /Replies have now closed/);
    assert.equal((await s.db.getInvitation(inv.id)).response.attending, false);
    s.setNow('2026-11-29T09:00:00+01:00');
    const home = await guest.get('/');
    assert.match(home.text, /Married on Saturday 28 November 2026/);
  });
});

test('the admin area', async (t) => {
  const s = await startServer();
  t.after(() => s.close());
  const anon = s.client();

  await t.test('is closed without a session', async () => {
    const res = await anon.get('/admin/invitations');
    assert.equal(res.status, 303);
    assert.equal(res.location, '/admin/login');
    assert.equal((await anon.get('/admin/export/guests.csv')).status, 303);
    assert.equal((await anon.login('wrong')).status, 401);
  });

  const admin = s.client();
  await t.test('signs in and rejects forms without a CSRF token', async () => {
    const res = await admin.login();
    assert.equal(res.status, 303);
    assert.equal((await admin.get('/admin')).status, 200);
    const forged = await admin.post('/admin/invitations', { name: 'Forged', seats: '1', events: 'church' });
    assert.equal(forged.status, 403);
    const crossSite = await admin.post('/admin/invitations', { name: 'X', seats: '1', events: 'church', _csrf: await admin.csrf() }, { headers: { origin: 'https://evil.example' } });
    assert.equal(crossSite.status, 403);
    assert.equal((await s.db.listInvitations()).length, 0);
  });

  await t.test('creates, edits and exports invitations', async () => {
    const csrf = await admin.csrf();
    const bad = await admin.post('/admin/invitations', { _csrf: csrf, name: '', seats: '80' });
    assert.equal(bad.status, 422);
    const res = await admin.post('/admin/invitations', { _csrf: csrf, name: '=cmd|calc', seats: '3', side: 'second', events: 'church', phone: '0803 111 2222' });
    assert.equal(res.status, 303);
    const inv = (await s.db.listInvitations())[0];
    assert.equal(inv.seats, 3);
    assert.equal(inv.side, 'second');

    const page = await admin.get(`/admin/invitations/${inv.id}`);
    assert.match(page.text, new RegExp(`/i/${inv.code}`));
    const send = await admin.post(`/admin/invitations/${inv.id}/send`, { _csrf: csrf });
    assert.match(send.location, /^https:\/\/wa\.me\/2348031112222\?text=/);
    assert.ok((await s.db.getInvitation(inv.id)).sentAt);

    const csv = await admin.get('/admin/export/guests.csv');
    assert.equal(csv.status, 200);
    assert.match(csv.headers.get('content-disposition'), /guest-list-2026-11-20\.csv/);
    assert.match(csv.text, /'=cmd\|calc/, 'formula-like cells are neutralised');
  });

  await t.test('imports a guest list all-or-nothing', async () => {
    const csrf = await admin.csrf('/admin/import');
    const bad = await admin.post('/admin/import', { _csrf: csrf, csv: 'name,seats,events\nAda,2,church\nBen,0,church' });
    assert.equal(bad.status, 422);
    assert.match(bad.text, /Row 3: seats must be 1 to 50/);
    assert.equal((await s.db.listInvitations()).length, 1);
    const ok = await admin.post('/admin/import', { _csrf: csrf, csv: 'name,seats,side,events\nAda,2,adaeze,church;reception\n"Okafor, Chidi",1,groom,' });
    assert.equal(ok.status, 303);
    const list = (await s.db.listInvitations());
    assert.equal(list.length, 3);
    const ada = list.find((i) => i.name === 'Ada');
    assert.deepEqual(ada.events, ['church', 'reception']);
    assert.equal(list.find((i) => i.name === 'Okafor, Chidi').side, 'first');
  });

  await t.test('publishes updates guests can see', async () => {
    const csrf = await admin.csrf('/admin/updates');
    await admin.post('/admin/updates', { _csrf: csrf, body: 'The reception now begins at 3 pm.' });
    const home = await anon.get('/');
    assert.match(home.text, /The reception now begins at 3 pm\./);
  });

  await t.test('shows signed-in admins the placeholders', async () => {
    const home = await admin.get('/');
    assert.match(home.text, /class="preview-bar"/);
    await admin.get('/admin/preview?show=0&back=/');
    const asGuest = await admin.get('/');
    assert.match(asGuest.text, /Guest view/);
  });

  await t.test('limits password guessing', async () => {
    const guesser = s.client();
    let last;
    for (let i = 0; i < 9; i++) last = await guesser.login(`guess-${i}`);
    assert.equal(last.status, 429);
    assert.equal((await guesser.login(ADMIN_PASSWORD)).status, 429);
  });
});
