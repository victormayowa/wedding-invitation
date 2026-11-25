import path from 'node:path';
import { ROOT } from './config.js';
import { Router, HttpError, parseCookies, readForm, send, sendHtml, redirect, setCookie, clearCookie, staticFiles } from './http.js';
import { securityHeaders, clientIp, rateLimiter, sameOrigin } from './security.js';
import { createAuth } from './auth.js';
import { normaliseCode, displayCode } from './db.js';
import { createClock, phase } from './format.js';
import { createImages } from './images.js';
import { contentChecklist } from './content.js';
import { rsvpWindow, invitedEvents, visibleEvents, validateReply, defaultEventIds, cleanPhone } from './rsvp.js';
import { buildCalendar, calendarReady } from './ics.js';
import { parseCsv, toCsv } from './csv.js';
import { html } from './html.js';
import { homePage } from './views/home.js';
import { page, siteFooter, coupleMark } from './views/layout.js';
import { whatsappHref } from './views/parts.js';
import * as rsvpViews from './views/rsvp.js';
import * as adminViews from './views/admin.js';

const INVITE_DAYS = 400;
const line = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function createApp({ config, content, contentProblems = [], db }) {
  const clock = createClock(content);
  const auth = createAuth({ ...config, now: config.now });
  const assets = staticFiles(path.join(ROOT, 'public'));
  const images = createImages(path.join(ROOT, 'public'));
  const limits = {
    code: rateLimiter({ limit: 20, windowMs: 15 * 60e3 }),
    login: rateLimiter({ limit: 8, windowMs: 15 * 60e3 }),
    reply: rateLimiter({ limit: 30, windowMs: 15 * 60e3 }),
  };
  const cookieOpts = auth.cookieOptions;
  const router = new Router();

  /* ---------- Per-request context ---------- */

  function context(req, res, url) {
    const cookies = parseCookies(req.headers.cookie);
    const sessionToken = cookies[auth.ADMIN_COOKIE];
    const admin = auth.verifySession(sessionToken);
    const now = config.now();
    const code = auth.readInvite(cookies[auth.INVITE_COOKIE]);
    const invite = code ? db.findByCode(code) : null;
    if (code && !invite) clearCookie(res, auth.INVITE_COOKIE, cookieOpts);
    const win = rsvpWindow(content, clock, now);
    let flash = null;
    if (admin && cookies.va_flash) {
      flash = cookies.va_flash.slice(0, 200);
      clearCookie(res, 'va_flash', cookieOpts);
    }
    return {
      req,
      res,
      url,
      path: url.pathname,
      cookies,
      ip: clientIp(req, config.trustProxy),
      content,
      clock,
      now,
      phase: phase(content, clock, now),
      admin,
      sessionToken,
      csrf: admin ? auth.csrfToken(sessionToken) : '',
      preview: config.showPlaceholders || (admin && cookies.va_preview !== '0'),
      invite,
      window: win,
      rsvpOpen: win.open || admin,
      images,
      asset: (p) => assets.url(p),
      publicUrl: config.publicUrl,
      ogImage: assets.exists('/images/og.jpg') ? `${config.publicUrl}${assets.url('/images/og.jpg')}` : null,
      announcements: db.listAnnouncements(),
      flash,
    };
  }

  const flash = (res, message) => setCookie(res, 'va_flash', message, { ...cookieOpts, maxAge: 60 });
  const rememberInvite = (res, code) =>
    setCookie(res, auth.INVITE_COOKIE, auth.signInvite(code), { ...cookieOpts, maxAge: INVITE_DAYS * 86400 });

  function messagePage(ctx, status, title, body) {
    const c = ctx.content;
    return page(ctx, {
      title: `${title} · ${c.couple.first} & ${c.couple.second}`,
      description: title,
      bodyClass: 'reply-page',
      body: html`<header class="nav nav--solid"><div class="nav__inner"><a class="nav__mark" href="/">${coupleMark(c)}</a></div></header>
        <main id="main" class="reply"><div class="reply__sheet">
          <p class="label">${status}</p>
          <h1 class="reply__title">${title}</h1>
          <p class="reply__lead">${body}</p>
          <div class="reply__actions"><a class="button button--ghost" href="/">Back to the invitation</a></div>
        </div></main>
        ${siteFooter(ctx, [], { tone: 'paper' })}`,
    });
  }

  /* ---------- Public site ---------- */

  router.get('/', (ctx) => sendHtml(ctx.req, ctx.res, 200, homePage(ctx)));

  router.get('/i/:code', (ctx, { code }) => {
    const invite = db.findByCode(code);
    if (!invite) {
      return sendHtml(ctx.req, ctx.res, 404, rsvpViews.codePage(ctx, {
        code: displayCode(normaliseCode(code)),
        error: 'We couldn’t find an invitation for that link. Please check the code below, or enter it again.',
        win: ctx.window,
      }));
    }
    rememberInvite(ctx.res, invite.code);
    ctx.invite = invite;
    sendHtml(ctx.req, ctx.res, 200, homePage(ctx));
  });

  router.get('/robots.txt', (ctx) => {
    const body = content.site?.indexable
      ? 'User-agent: *\nDisallow: /admin\nDisallow: /i/\nDisallow: /rsvp\n'
      : 'User-agent: *\nDisallow: /\n';
    send(ctx.req, ctx.res, 200, body, { 'Cache-Control': 'public, max-age=3600' });
  });

  router.get('/healthz', (ctx) => send(ctx.req, ctx.res, 200, 'ok', { 'Cache-Control': 'no-store' }));

  /* ---------- RSVP ---------- */

  const replyEvents = (ctx, invite) => invitedEvents(content, invite, { preview: ctx.preview });

  router.get('/rsvp', (ctx) => {
    const { req, res } = ctx;
    if (!ctx.rsvpOpen) return sendHtml(req, res, 200, rsvpViews.closedPage(ctx, { invitation: ctx.invite, win: ctx.window }));
    if (!ctx.invite) {
      const code = line(ctx.url.searchParams.get('code'), 20);
      return sendHtml(req, res, 200, rsvpViews.codePage(ctx, { code, win: ctx.window }));
    }
    sendHtml(req, res, 200, rsvpViews.replyPage(ctx, { invitation: ctx.invite, events: replyEvents(ctx, ctx.invite), win: ctx.window }));
  });

  router.post('/rsvp/code', async (ctx) => {
    const { req, res } = ctx;
    const form = await readForm(req);
    const code = line(form.get('code'), 40);
    if (!limits.code.take(ctx.ip)) {
      return sendHtml(req, res, 429, rsvpViews.codePage(ctx, { code, error: 'Too many attempts. Please wait a few minutes and try again.', win: ctx.window }));
    }
    if (!normaliseCode(code)) {
      return sendHtml(req, res, 400, rsvpViews.codePage(ctx, { code, error: 'Please enter your invitation code.', win: ctx.window }));
    }
    const invite = db.findByCode(code);
    if (!invite) {
      return sendHtml(req, res, 400, rsvpViews.codePage(ctx, {
        code,
        error: 'We couldn’t find an invitation with that code. Please check it and try again.',
        win: ctx.window,
      }));
    }
    rememberInvite(res, invite.code);
    redirect(res, '/rsvp');
  });

  router.post('/rsvp', async (ctx) => {
    const { req, res } = ctx;
    const form = await readForm(req);
    const invite = ctx.invite;
    if (!invite) return redirect(res, '/rsvp');
    if (!ctx.rsvpOpen) return sendHtml(req, res, 200, rsvpViews.closedPage(ctx, { invitation: invite, win: ctx.window }));
    if (!limits.reply.take(ctx.ip)) throw new HttpError(429, 'Too many replies from this connection. Please try again in a few minutes.');

    const events = replyEvents(ctx, invite);
    const result = validateReply(form, invite, events);
    if (!result.ok) {
      const values = {
        attending: form.get('attending') || '',
        fullName: line(form.get('fullName'), 120),
        phone: line(form.get('phone'), 40),
        email: line(form.get('email'), 200),
        guests: form.get('guests'),
        events: form.getAll('events'),
        dietary: String(form.get('dietary') || '').slice(0, 500),
        accessibility: String(form.get('accessibility') || '').slice(0, 500),
        message: String(form.get('message') || '').slice(0, 1000),
      };
      return sendHtml(req, res, 422, rsvpViews.replyPage(ctx, { invitation: invite, events, values, errors: result.errors, win: ctx.window }));
    }
    db.saveResponse(invite.id, result.value);
    redirect(res, '/rsvp/thank-you');
  });

  router.get('/rsvp/thank-you', (ctx) => {
    if (!ctx.invite?.response) return redirect(ctx.res, '/rsvp');
    sendHtml(ctx.req, ctx.res, 200, rsvpViews.thanksPage(ctx, { invitation: ctx.invite, events: replyEvents(ctx, ctx.invite) }));
  });

  router.get('/rsvp/change', (ctx) => {
    clearCookie(ctx.res, auth.INVITE_COOKIE, cookieOpts);
    redirect(ctx.res, '/rsvp');
  });

  /* ---------- Calendar ---------- */

  function guestEvents(ctx) {
    return visibleEvents(content, ctx).filter(
      (e) => e.access !== 'private' || ctx.preview || ctx.invite?.events.includes(e.id),
    );
  }

  function sendCalendar(ctx, events, filename) {
    const ready = events.filter(calendarReady);
    if (!ready.length) throw new HttpError(404, 'The times for this celebration haven’t been confirmed yet.');
    const body = buildCalendar({ content, clock, events: ready, publicUrl: config.publicUrl, now: ctx.now });
    send(ctx.req, ctx.res, 200, body, {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    });
  }

  router.get('/calendar.ics', (ctx) => {
    let events = guestEvents(ctx);
    const r = ctx.invite?.response;
    if (r?.attending) events = events.filter((e) => r.events.includes(e.id));
    else if (ctx.invite) events = events.filter((e) => ctx.invite.events.includes(e.id));
    sendCalendar(ctx, events, `${content.couple.first}-and-${content.couple.second}-wedding.ics`.toLowerCase());
  });

  router.get('/calendar/:file', (ctx, { file }) => {
    const id = file.replace(/\.ics$/, '');
    const event = guestEvents(ctx).find((e) => e.id === id);
    if (!event || !file.endsWith('.ics')) throw new HttpError(404, 'That calendar entry doesn’t exist.');
    sendCalendar(ctx, [event], `${id}.ics`);
  });

  /* ---------- Admin: session ---------- */

  router.get('/admin/login', (ctx) => {
    if (ctx.admin) return redirect(ctx.res, '/admin');
    sendHtml(ctx.req, ctx.res, 200, adminViews.loginPage(ctx));
  });

  router.post('/admin/login', async (ctx) => {
    const { req, res } = ctx;
    const form = await readForm(req);
    if (!sameOrigin(req, config.publicUrl)) throw new HttpError(403, 'Please sign in from the website itself.');
    if (!limits.login.take(ctx.ip)) {
      return sendHtml(req, res, 429, adminViews.loginPage(ctx, { error: 'Too many attempts. Please wait 15 minutes.' }));
    }
    if (!auth.checkPassword(form.get('password'))) {
      return sendHtml(req, res, 401, adminViews.loginPage(ctx, { error: 'That password isn’t right.' }));
    }
    limits.login.reset(ctx.ip);
    const { token, maxAge } = auth.issueSession();
    setCookie(res, auth.ADMIN_COOKIE, token, { ...cookieOpts, maxAge });
    redirect(res, '/admin');
  });

  /* ---------- Admin: pages (all require a session) ---------- */

  const admin = {
    get(pattern, fn) {
      router.get(pattern, (ctx, params) => {
        if (!ctx.admin) return redirect(ctx.res, '/admin/login');
        return fn(ctx, params);
      });
    },
    post(pattern, fn, { limit } = {}) {
      router.post(pattern, async (ctx, params) => {
        if (!ctx.admin) return redirect(ctx.res, '/admin/login');
        const form = await readForm(ctx.req, limit);
        if (!sameOrigin(ctx.req, config.publicUrl) || !auth.verifyCsrf(ctx.sessionToken, form.get('_csrf'))) {
          throw new HttpError(403, 'This form has expired. Please go back, reload the page and try again.');
        }
        return fn(ctx, params, form);
      });
    },
  };

  admin.post('/admin/logout', (ctx) => {
    clearCookie(ctx.res, auth.ADMIN_COOKIE, cookieOpts);
    clearCookie(ctx.res, 'va_preview', cookieOpts);
    redirect(ctx.res, '/');
  });

  admin.get('/admin/preview', (ctx) => {
    const show = ctx.url.searchParams.get('show') !== '0';
    setCookie(ctx.res, 'va_preview', show ? '1' : '0', { ...cookieOpts, maxAge: 30 * 86400 });
    const back = ctx.url.searchParams.get('back') || '/';
    redirect(ctx.res, back.startsWith('/') && !back.startsWith('//') ? back : '/');
  });

  /* ---------- Admin: overview ---------- */

  function computeStats(list) {
    const replied = list.filter((i) => i.response);
    const attending = replied.filter((i) => i.response.attending);
    const sum = (arr, f) => arr.reduce((n, x) => n + f(x), 0);
    const sides = ['first', 'second', 'both', '']
      .map((side) => {
        const group = list.filter((i) => i.side === side);
        return {
          side,
          seats: sum(group, (i) => i.seats),
          guests: sum(group.filter((i) => i.response?.attending), (i) => i.response.guests),
          count: group.length,
        };
      })
      .filter((s) => s.count);
    return {
      households: list.length,
      seats: sum(list, (i) => i.seats),
      replied: replied.length,
      awaiting: list.length - replied.length,
      awaitingSeats: sum(list.filter((i) => !i.response), (i) => i.seats),
      declined: replied.length - attending.length,
      guests: sum(attending, (i) => i.response.guests),
      confirmedEvents: content.events.filter((e) => e.status === 'confirmed').length,
      sides: sides.length > 1 || (sides[0] && sides[0].side) ? sides : [],
      events: content.events.map((e) => ({
        ...e,
        seats: sum(list.filter((i) => i.events.includes(e.id)), (i) => i.seats),
        guests: sum(attending.filter((i) => i.response.events.includes(e.id)), (i) => i.response.guests),
      })),
    };
  }

  admin.get('/admin', (ctx) => {
    const list = db.listInvitations();
    const withReply = list.filter((i) => i.response);
    const byUpdated = [...withReply].sort((a, b) => b.response.updatedAt.localeCompare(a.response.updatedAt));
    const checklistCount = contentChecklist(content).reduce((n, g) => n + g.items.length, 0);
    sendHtml(ctx.req, ctx.res, 200, adminViews.dashboardPage(ctx, {
      stats: computeStats(list),
      recent: byUpdated.slice(0, 8),
      notes: withReply.filter((i) => i.response.attending && (i.response.dietary || i.response.accessibility)),
      messages: byUpdated.filter((i) => i.response.message).slice(0, 12),
      checklistCount,
      problems: contentProblems,
      win: ctx.window,
    }));
  });

  /* ---------- Admin: invitations ---------- */

  const blankInvitation = () => ({
    name: '',
    seats: 1,
    side: '',
    category: '',
    phone: '',
    email: '',
    notes: '',
    code: '',
    events: defaultEventIds(content),
  });

  function readInvitation(form) {
    const v = {
      name: line(form.get('name'), 160),
      seats: form.get('seats'),
      side: adminViews.SIDES.includes(form.get('side')) ? form.get('side') : '',
      category: line(form.get('category'), 60),
      phone: line(form.get('phone'), 40),
      email: line(form.get('email'), 200),
      notes: String(form.get('notes') || '').trim().slice(0, 2000),
      code: line(form.get('code'), 20),
      events: form.getAll('events').filter((id) => content.events.some((e) => e.id === id)),
    };
    const errors = {};
    if (v.name.length < 2) errors.name = 'Please add the name as it should appear on the invitation.';
    const seats = Number.parseInt(v.seats, 10);
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) errors.seats = 'Seats must be a number from 1 to 50.';
    else v.seats = seats;
    if (v.phone && !cleanPhone(v.phone).ok) errors.phone = 'That phone number doesn’t look right.';
    if (v.email && !EMAIL.test(v.email)) errors.email = 'That email address doesn’t look right.';
    if (content.events.length && !v.events.length) errors.events = 'Choose at least one celebration.';
    return { values: v, errors };
  }

  const categories = () => [...new Set(db.listInvitations().map((i) => i.category).filter(Boolean))].sort();

  admin.get('/admin/invitations', (ctx) => {
    const p = ctx.url.searchParams;
    const filters = {
      q: line(p.get('q'), 80),
      status: ['awaiting', 'attending', 'declined'].includes(p.get('status')) ? p.get('status') : '',
      side: adminViews.SIDES.includes(p.get('side')) ? p.get('side') : '',
    };
    const list = db.listInvitations(filters);
    const total = filters.q || filters.status || filters.side ? db.listInvitations().length : list.length;
    sendHtml(ctx.req, ctx.res, 200, adminViews.invitationsPage(ctx, { list, filters, total }));
  });

  admin.get('/admin/invitations/new', (ctx) => {
    sendHtml(ctx.req, ctx.res, 200, adminViews.invitationFormPage(ctx, { values: blankInvitation(), categories: categories() }));
  });

  admin.post('/admin/invitations', (ctx, _p, form) => {
    const { values, errors } = readInvitation(form);
    if (!Object.keys(errors).length) {
      try {
        const inv = db.createInvitation(values);
        flash(ctx.res, `Invitation created for ${inv.name}.`);
        return redirect(ctx.res, `/admin/invitations/${inv.id}`);
      } catch (err) {
        if (!err.field) throw err;
        errors[err.field] = err.message;
      }
    }
    sendHtml(ctx.req, ctx.res, 422, adminViews.invitationFormPage(ctx, { values, errors, categories: categories() }));
  });

  function loadInvitation(id) {
    const inv = /^\d+$/.test(id) ? db.getInvitation(id) : null;
    if (!inv) throw new HttpError(404, 'That invitation doesn’t exist.');
    return inv;
  }

  admin.get('/admin/invitations/:id', (ctx, { id }) => {
    const invitation = loadInvitation(id);
    sendHtml(ctx.req, ctx.res, 200, adminViews.invitationFormPage(ctx, { invitation, values: invitation, categories: categories() }));
  });

  admin.post('/admin/invitations/:id', (ctx, { id }, form) => {
    const invitation = loadInvitation(id);
    const { values, errors } = readInvitation(form);
    if (Object.keys(errors).length) {
      return sendHtml(ctx.req, ctx.res, 422, adminViews.invitationFormPage(ctx, { invitation, values, errors, categories: categories() }));
    }
    db.updateInvitation(invitation.id, values);
    flash(ctx.res, 'Changes saved.');
    redirect(ctx.res, `/admin/invitations/${invitation.id}`);
  });

  admin.post('/admin/invitations/:id/delete', (ctx, { id }) => {
    const invitation = loadInvitation(id);
    db.deleteInvitation(invitation.id);
    flash(ctx.res, `Deleted the invitation for ${invitation.name}.`);
    redirect(ctx.res, '/admin/invitations');
  });

  admin.post('/admin/invitations/:id/clear-reply', (ctx, { id }) => {
    const invitation = loadInvitation(id);
    db.clearResponse(invitation.id);
    flash(ctx.res, 'Reply cleared.');
    redirect(ctx.res, `/admin/invitations/${invitation.id}`);
  });

  admin.post('/admin/invitations/:id/new-code', (ctx, { id }) => {
    const inv = db.regenerateCode(loadInvitation(id).id);
    flash(ctx.res, `New code issued: ${displayCode(inv.code)}.`);
    redirect(ctx.res, `/admin/invitations/${inv.id}`);
  });

  admin.post('/admin/invitations/:id/send', (ctx, { id }) => {
    const inv = loadInvitation(id);
    db.markSent(inv.id);
    const message = content.invitationMessage
      .replaceAll('{name}', inv.name)
      .replaceAll('{link}', `${config.publicUrl}/i/${inv.code}`)
      .replaceAll('{date}', clock.dateLong(content.date));
    redirect(ctx.res, whatsappHref(inv.phone, message), 303);
  });

  /* ---------- Admin: import ---------- */

  function sideFrom(value) {
    const v = line(value, 20).toLowerCase();
    if (!v) return '';
    if (['first', 'groom', content.couple.first.toLowerCase()].includes(v)) return 'first';
    if (['second', 'bride', content.couple.second.toLowerCase()].includes(v)) return 'second';
    if (['both', 'shared', 'mutual'].includes(v)) return 'both';
    return null;
  }

  function eventsFrom(value) {
    const parts = String(value || '')
      .split(/[;|]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return { ids: defaultEventIds(content), unknown: [] };
    const ids = [];
    const unknown = [];
    for (const p of parts) {
      const e = content.events.find((x) => x.id === p || x.name.toLowerCase() === p);
      if (e) ids.push(e.id);
      else unknown.push(p);
    }
    return { ids: [...new Set(ids)], unknown };
  }

  admin.get('/admin/import', (ctx) => sendHtml(ctx.req, ctx.res, 200, adminViews.importPage(ctx, {})));

  admin.post(
    '/admin/import',
    (ctx, _p, form) => {
      const text = String(form.get('csv') || '');
      const rows = parseCsv(text);
      const errors = [];
      if (rows.length < 2) errors.push('Add a header row and at least one guest.');
      const header = (rows[0] || []).map((h) => h.trim().toLowerCase());
      if (rows.length && !header.includes('name')) errors.push('The first row must be a header row with a “name” column.');
      if (rows.length > 2001) errors.push('Please import at most 2,000 invitations at a time.');

      const records = [];
      const seenCodes = new Set();
      if (!errors.length) {
        rows.slice(1).forEach((row, i) => {
          const n = i + 2;
          const get = (k) => (header.indexOf(k) >= 0 ? row[header.indexOf(k)] ?? '' : '');
          const name = line(get('name'), 160);
          const seatsRaw = line(get('seats'), 5);
          const seats = seatsRaw ? Number.parseInt(seatsRaw, 10) : 1;
          const side = sideFrom(get('side'));
          const phone = line(get('phone'), 40);
          const email = line(get('email'), 200);
          const ev = eventsFrom(get('events'));
          const code = normaliseCode(get('code'));
          if (name.length < 2) errors.push(`Row ${n}: name is missing.`);
          if (!Number.isInteger(seats) || seats < 1 || seats > 50) errors.push(`Row ${n}: seats must be 1 to 50.`);
          if (side === null) errors.push(`Row ${n}: side “${get('side')}” isn’t recognised.`);
          if (phone && !cleanPhone(phone).ok) errors.push(`Row ${n}: the phone number doesn’t look right.`);
          if (email && !EMAIL.test(email)) errors.push(`Row ${n}: the email address doesn’t look right.`);
          if (ev.unknown.length) errors.push(`Row ${n}: unknown event ${ev.unknown.map((u) => `“${u}”`).join(', ')}.`);
          if (code) {
            if (code.length < 4) errors.push(`Row ${n}: codes need at least 4 letters or numbers.`);
            else if (seenCodes.has(code) || db.findByCode(code)) errors.push(`Row ${n}: the code ${displayCode(code)} is already in use.`);
            seenCodes.add(code);
          }
          records.push({ name, seats, side: side || '', category: line(get('category'), 60), phone, email, notes: String(get('notes')).trim().slice(0, 2000), events: ev.ids, code });
        });
      }
      if (errors.length) {
        return sendHtml(ctx.req, ctx.res, 422, adminViews.importPage(ctx, { text, errors: errors.slice(0, 50) }));
      }
      db.tx(() => records.forEach((r) => db.createInvitation(r)));
      flash(ctx.res, `${records.length} ${records.length === 1 ? 'invitation' : 'invitations'} imported.`);
      redirect(ctx.res, '/admin/invitations');
    },
    { limit: 2 * 1024 * 1024 },
  );

  /* ---------- Admin: updates ---------- */

  admin.get('/admin/updates', (ctx) => sendHtml(ctx.req, ctx.res, 200, adminViews.updatesPage(ctx, { items: db.listAnnouncements() })));

  admin.post('/admin/updates', (ctx, _p, form) => {
    const body = line(form.get('body'), 280);
    if (body.length < 3) {
      return sendHtml(ctx.req, ctx.res, 422, adminViews.updatesPage(ctx, { items: db.listAnnouncements(), error: 'Please write the update first.' }));
    }
    db.addAnnouncement(body);
    flash(ctx.res, 'Update published.');
    redirect(ctx.res, '/admin/updates');
  });

  admin.post('/admin/updates/:id/delete', (ctx, { id }) => {
    if (/^\d+$/.test(id)) db.deleteAnnouncement(id);
    flash(ctx.res, 'Update removed.');
    redirect(ctx.res, '/admin/updates');
  });

  /* ---------- Admin: content ---------- */

  admin.get('/admin/content', (ctx) => {
    sendHtml(ctx.req, ctx.res, 200, adminViews.contentPage(ctx, { groups: contentChecklist(content), problems: contentProblems }));
  });

  /* ---------- Admin: exports ---------- */

  function sendCsv(ctx, filename, rows) {
    send(ctx.req, ctx.res, 200, toCsv(rows), {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    });
  }

  const stampFile = (ctx) => clock.day(ctx.now);

  admin.get('/admin/export/guests.csv', (ctx) => {
    const list = db.listInvitations();
    const rows = [
      [
        'Invitation', 'Code', 'Side', 'Group', 'Seats', 'Reply', 'Guests attending',
        ...content.events.map((e) => e.name),
        'Name on reply', 'Phone', 'Email', 'Dietary', 'Accessibility', 'Note to the couple',
        'Replied', 'Last updated', 'Invitation phone', 'Private notes',
      ],
    ];
    for (const i of list) {
      const r = i.response;
      rows.push([
        i.name,
        displayCode(i.code),
        adminViews.sideLabel(content, i.side),
        i.category,
        i.seats,
        r ? (r.attending ? 'Attending' : 'Declined') : 'Awaiting',
        r?.attending ? r.guests : 0,
        ...content.events.map((e) => {
          if (!i.events.includes(e.id)) return 'Not invited';
          if (!r) return '';
          return r.attending && r.events.includes(e.id) ? r.guests : 0;
        }),
        r?.fullName || '',
        r?.phone || '',
        r?.email || '',
        r?.dietary || '',
        r?.accessibility || '',
        r?.message || '',
        r ? clock.stamp(r.createdAt) : '',
        r ? clock.stamp(r.updatedAt) : '',
        i.phone,
        i.notes,
      ]);
    }
    sendCsv(ctx, `guest-list-${stampFile(ctx)}.csv`, rows);
  });

  admin.get('/admin/export/invitations.csv', (ctx) => {
    const rows = [['name', 'seats', 'side', 'category', 'phone', 'email', 'events', 'code', 'link', 'sent', 'reply', 'notes']];
    for (const i of db.listInvitations()) {
      rows.push([
        i.name,
        i.seats,
        i.side === 'first' ? content.couple.first.toLowerCase() : i.side === 'second' ? content.couple.second.toLowerCase() : i.side,
        i.category,
        i.phone,
        i.email,
        i.events.join(';'),
        displayCode(i.code),
        `${config.publicUrl}/i/${i.code}`,
        i.sentAt ? clock.stamp(i.sentAt) : '',
        i.response ? (i.response.attending ? `Attending (${i.response.guests})` : 'Declined') : 'Awaiting',
        i.notes,
      ]);
    }
    sendCsv(ctx, `invitations-${stampFile(ctx)}.csv`, rows);
  });

  /* ---------- Request handler ---------- */

  async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    securityHeaders(res, { secure: config.secureCookies });
    try {
      if (assets.handle(req, res, url)) return;
      const ctx = context(req, res, url);
      const match = router.match(req.method, url.pathname);
      if (!match) throw new HttpError(404, 'This page isn’t part of our invitation.');
      if (match.methodNotAllowed) throw new HttpError(405, 'That isn’t possible here.');
      await match.handler(ctx, match.params);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status >= 500) console.error(err);
      if (res.headersSent) return res.end();
      const titles = { 403: 'Please try again', 404: 'Page not found', 405: 'Not available', 413: 'Too large', 415: 'Please try again', 429: 'Please wait a moment' };
      const message = status >= 500 ? 'Something went wrong on our side. Please try again in a moment.' : err.message;
      try {
        const ctx = context(req, res, url);
        sendHtml(req, res, status, messagePage(ctx, status, titles[status] || 'Something went wrong', message));
      } catch (inner) {
        console.error(inner);
        send(req, res, status, message);
      }
    }
  }

  return { handler, clock, auth };
}
