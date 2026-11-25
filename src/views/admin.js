import { html, raw } from '../html.js';
import { displayCode } from '../db.js';
import { page, coupleMark } from './layout.js';
import { plural } from './parts.js';

export const SIDES = ['first', 'second', 'both'];
export const sideLabel = (c, side) =>
  side === 'first' ? `${c.couple.first}’s guests` : side === 'second' ? `${c.couple.second}’s guests` : side === 'both' ? 'Shared' : '';

const NAV = [
  ['/admin', 'Overview'],
  ['/admin/invitations', 'Invitations'],
  ['/admin/import', 'Import'],
  ['/admin/updates', 'Updates'],
  ['/admin/content', 'Content'],
];

function shell(ctx, { title, body, current, scripts = [] }) {
  const c = ctx.content;
  return page(ctx, {
    title: `${title} · Admin · ${c.couple.first} & ${c.couple.second}`,
    description: 'Guest management',
    bodyClass: 'admin',
    scripts: ['/js/admin.js', ...scripts],
    body: html`<header class="admin-bar">
      <div class="admin-bar__inner">
        <a class="admin-bar__mark" href="/admin"><span>${coupleMark(c)}</span><span class="admin-bar__sub">Guest list</span></a>
        ${ctx.admin
          ? html`<nav class="admin-bar__nav" aria-label="Admin">
              <ul>
                ${NAV.map(([href, label]) => html`<li><a href="${href}"${current === href ? raw(' aria-current="page"') : ''}>${label}</a></li>`)}
                <li><a href="/" target="_blank" rel="noopener">View site</a></li>
              </ul>
              <form method="post" action="/admin/logout"><input type="hidden" name="_csrf" value="${ctx.csrf}"><button class="admin-bar__out" type="submit">Sign out</button></form>
            </nav>`
          : ''}
      </div>
    </header>
    <main id="main" class="admin-main">${ctx.flash ? html`<p class="flash" role="status">${ctx.flash}</p>` : ''}${body}</main>`,
  });
}

const csrf = (ctx) => html`<input type="hidden" name="_csrf" value="${ctx.csrf}">`;

function status(inv) {
  if (!inv.response) return html`<span class="status status--awaiting">Awaiting</span>`;
  if (inv.response.attending) return html`<span class="status status--yes">Attending · ${inv.response.guests}</span>`;
  return html`<span class="status status--no">Declined</span>`;
}

const eventShort = (c, ids) =>
  c.events
    .filter((e) => ids.includes(e.id))
    .map((e) => e.name.replace(/^Wedding /, '').replace(/ (wedding|service)$/i, ''))
    .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
    .join(', ');

/* ---------------------------------------------------------------- Login */

export function loginPage(ctx, { error = '' } = {}) {
  return shell(ctx, {
    title: 'Sign in',
    body: html`<div class="admin-login">
      <p class="label">Admin</p>
      <h1 class="admin-title">Sign in</h1>
      <form method="post" action="/admin/login" class="admin-form">
        <div class="field${error ? ' field--invalid' : ''}">
          <label class="field__label" for="password">Password</label>
          <input class="input" id="password" name="password" type="password" autocomplete="current-password" required autofocus${error ? raw(' aria-invalid="true" aria-describedby="password-error"') : ''}>
          ${error ? html`<p class="field__error" id="password-error" role="alert">${error}</p>` : ''}
        </div>
        <button class="button button--block" type="submit">Sign in</button>
      </form>
    </div>`,
  });
}

/* ---------------------------------------------------------------- Overview */

export function dashboardPage(ctx, { stats, recent, notes, messages, checklistCount, problems, win }) {
  const c = ctx.content;
  const pct = stats.households ? Math.round((stats.replied / stats.households) * 100) : 0;
  return shell(ctx, {
    title: 'Overview',
    current: '/admin',
    body: html`<header class="admin-head">
        <div>
          <p class="label">${ctx.clock.dateLong(c.date)}</p>
          <h1 class="admin-title">Overview</h1>
        </div>
        <div class="admin-head__actions">
          <a class="button button--ghost" href="/admin/export/guests.csv">Export guest list</a>
          <a class="button" href="/admin/invitations/new">New invitation</a>
        </div>
      </header>

      ${problems.length
        ? html`<div class="alert"><p><strong>content/wedding.js needs attention:</strong></p><ul>${problems.map((p) => html`<li>${p}</li>`)}</ul></div>`
        : ''}
      <ul class="admin-notes">
        ${win.open
          ? win.deadline
            ? html`<li>Replies close at the end of ${ctx.clock.dateLong(win.deadline)}.</li>`
            : html`<li>No RSVP deadline is set yet. Add <code>rsvp.deadline</code> in content/wedding.js.</li>`
          : html`<li>Replies are closed to guests. You can still record replies through a guest’s personal link while signed in.</li>`}
        ${checklistCount ? html`<li><a class="link" href="/admin/content">${plural(checklistCount, 'detail')} still to confirm</a> before guests see the full site.</li>` : ''}
        ${stats.confirmedEvents === 0 ? html`<li>No events are confirmed yet, so guests see the celebration as “details to follow”.</li>` : ''}
      </ul>

      <section class="stats" aria-label="Replies">
        <div class="stat"><p class="stat__value">${stats.guests}</p><p class="stat__label">Guests attending</p></div>
        <div class="stat"><p class="stat__value">${stats.replied}<span class="stat__of">/${stats.households}</span></p><p class="stat__label">Invitations answered · ${pct}%</p></div>
        <div class="stat"><p class="stat__value">${stats.awaiting}</p><p class="stat__label">Awaiting a reply · ${plural(stats.awaitingSeats, 'seat')}</p></div>
        <div class="stat"><p class="stat__value">${stats.declined}</p><p class="stat__label">Declined</p></div>
      </section>

      <section class="admin-section" aria-labelledby="by-event">
        <h2 class="admin-subtitle" id="by-event">By celebration</h2>
        <table class="table table--events">
          <thead><tr><th scope="col">Celebration</th><th scope="col" class="num">Seats invited</th><th scope="col" class="num">Attending</th><th scope="col" class="bar-col"><span class="sr-only">Share of seats confirmed</span></th></tr></thead>
          <tbody>
            ${stats.events.map(
              (e) => html`<tr>
                <th scope="row">${e.name}${e.status === 'draft' ? html` <span class="tag">Draft</span>` : ''}${e.access !== 'open' ? html` <span class="tag">${e.access === 'private' ? 'Private' : 'By invitation'}</span>` : ''}</th>
                <td class="num">${e.seats}</td>
                <td class="num">${e.guests}</td>
                <td class="bar-col"><span class="bar" style="--p:${e.seats ? Math.min(100, Math.round((e.guests / e.seats) * 100)) : 0}%"></span></td>
              </tr>`,
            )}
          </tbody>
        </table>
        ${stats.sides.length
          ? html`<p class="admin-meta">${stats.sides.map((s, i) => html`${i ? ' · ' : ''}${sideLabel(c, s.side) || 'Unassigned'}: ${s.guests} attending of ${plural(s.seats, 'seat')}`)}</p>`
          : ''}
      </section>

      <div class="admin-columns">
        <section class="admin-section" aria-labelledby="recent">
          <h2 class="admin-subtitle" id="recent">Latest replies</h2>
          ${recent.length
            ? html`<ol class="feed">${recent.map(
                (i) => html`<li class="feed__item">
                  <a class="feed__name" href="/admin/invitations/${i.id}">${i.name}</a>
                  ${status(i)}
                  <span class="feed__when">${ctx.clock.stamp(i.response.updatedAt)}</span>
                </li>`,
              )}</ol>`
            : html`<p class="empty">No replies yet. They will appear here as guests respond.</p>`}
        </section>
        <section class="admin-section" aria-labelledby="needs">
          <h2 class="admin-subtitle" id="needs">Dietary &amp; access needs</h2>
          ${notes.length
            ? html`<ul class="feed">${notes.map(
                (i) => html`<li class="feed__item feed__item--stack">
                  <a class="feed__name" href="/admin/invitations/${i.id}">${i.name}</a>
                  ${i.response.dietary ? html`<span><span class="feed__key">Dietary</span> ${i.response.dietary}</span>` : ''}
                  ${i.response.accessibility ? html`<span><span class="feed__key">Access</span> ${i.response.accessibility}</span>` : ''}
                </li>`,
              )}</ul>`
            : html`<p class="empty">None so far.</p>`}
        </section>
      </div>

      ${messages.length
        ? html`<section class="admin-section" aria-labelledby="notes">
            <h2 class="admin-subtitle" id="notes">Notes from your guests</h2>
            <ul class="messages">${messages.map(
              (i) => html`<li class="message"><p class="message__body">${i.response.message}</p><p class="message__from">${i.response.fullName} · <a href="/admin/invitations/${i.id}">${i.name}</a></p></li>`,
            )}</ul>
          </section>`
        : ''}`,
  });
}

/* ---------------------------------------------------------------- Invitations */

export function invitationsPage(ctx, { list, filters, total }) {
  const c = ctx.content;
  const q = filters.q || '';
  const tabs = [
    ['', 'All'],
    ['awaiting', 'Awaiting'],
    ['attending', 'Attending'],
    ['declined', 'Declined'],
  ];
  const qs = (patch) => {
    const p = new URLSearchParams({ q, status: filters.status || '', side: filters.side || '', ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    const s = p.toString();
    return s ? `?${s}` : '';
  };
  return shell(ctx, {
    title: 'Invitations',
    current: '/admin/invitations',
    body: html`<header class="admin-head">
        <div>
          <p class="label">${plural(total, 'invitation')}</p>
          <h1 class="admin-title">Invitations</h1>
        </div>
        <div class="admin-head__actions">
          <a class="button button--ghost" href="/admin/export/invitations.csv">Export</a>
          <a class="button" href="/admin/invitations/new">New invitation</a>
        </div>
      </header>
      <form class="filters" method="get" action="/admin/invitations" role="search">
        <label class="sr-only" for="q">Search invitations</label>
        <input class="input input--search" id="q" name="q" value="${q}" placeholder="Search by name, code or phone">
        <select class="input input--select" name="side" aria-label="Side">
          <option value="">Everyone</option>
          ${SIDES.map((s) => html`<option value="${s}"${filters.side === s ? raw(' selected') : ''}>${sideLabel(c, s)}</option>`)}
        </select>
        ${filters.status ? html`<input type="hidden" name="status" value="${filters.status}">` : ''}
        <button class="button button--ghost" type="submit">Search</button>
      </form>
      <nav class="tabs" aria-label="Filter by reply">
        ${tabs.map(([v, label]) => html`<a href="/admin/invitations${qs({ status: v })}"${(filters.status || '') === v ? raw(' aria-current="page"') : ''}>${label}</a>`)}
      </nav>
      ${list.length
        ? html`<div class="table-wrap"><table class="table table--invites">
            <thead><tr>
              <th scope="col">Invitation</th><th scope="col">Code</th><th scope="col" class="num">Seats</th>
              <th scope="col">Invited to</th><th scope="col">Reply</th><th scope="col">Sent</th><th scope="col"><span class="sr-only">Actions</span></th>
            </tr></thead>
            <tbody>
              ${list.map((i) => {
                const link = `${ctx.publicUrl}/i/${i.code}`;
                return html`<tr>
                  <th scope="row">
                    <a class="invite-name" href="/admin/invitations/${i.id}">${i.name}</a>
                    <span class="invite-meta">${[sideLabel(c, i.side), i.category, i.phone].filter(Boolean).join(' · ')}</span>
                  </th>
                  <td><span class="code">${displayCode(i.code)}</span></td>
                  <td class="num">${i.seats}</td>
                  <td class="muted">${eventShort(c, i.events) || '—'}</td>
                  <td>${status(i)}</td>
                  <td class="muted">${i.sentAt ? ctx.clock.stamp(i.sentAt).split(',')[0] : '—'}</td>
                  <td class="row-actions">
                    <button class="mini" type="button" data-copy="${link}">Copy link</button>
                    <form method="post" action="/admin/invitations/${i.id}/send" target="_blank">${csrf(ctx)}<button class="mini" type="submit">WhatsApp</button></form>
                  </td>
                </tr>`;
              })}
            </tbody>
          </table></div>`
        : html`<p class="empty">${total ? 'No invitations match.' : html`No invitations yet. <a class="link" href="/admin/invitations/new">Create the first</a> or <a class="link" href="/admin/import">import a guest list</a>.`}</p>`}`,
  });
}

function eventChecks(ctx, selected) {
  return ctx.content.events.map(
    (e) => html`<label class="check check--compact">
      <input type="checkbox" name="events" value="${e.id}"${selected.includes(e.id) ? raw(' checked') : ''}>
      <span class="check__text"><span class="check__title">${e.name}</span><span class="check__desc">${[
        e.access === 'open' ? 'Open to all guests' : e.access === 'private' ? 'Private' : 'By invitation',
        e.status === 'draft' ? 'Draft' : '',
      ]
        .filter(Boolean)
        .join(' · ')}</span></span>
    </label>`,
  );
}

export function invitationFormPage(ctx, { invitation = null, values, errors = {}, categories = [] }) {
  const c = ctx.content;
  const v = values;
  const isNew = !invitation;
  const err = (k) => (errors[k] ? html`<p class="field__error" id="${k}-error">${errors[k]}</p>` : '');
  const inv = (k) => (errors[k] ? raw(` aria-invalid="true" aria-describedby="${k}-error"`) : '');
  const r = invitation?.response;
  const link = invitation ? `${ctx.publicUrl}/i/${invitation.code}` : '';
  const message = invitation
    ? c.invitationMessage
        .replaceAll('{name}', invitation.name)
        .replaceAll('{link}', link)
        .replaceAll('{date}', ctx.clock.dateLong(c.date))
    : '';

  return shell(ctx, {
    title: isNew ? 'New invitation' : invitation.name,
    current: '/admin/invitations',
    body: html`<header class="admin-head">
        <div>
          <p class="label"><a href="/admin/invitations">Invitations</a></p>
          <h1 class="admin-title">${isNew ? 'New invitation' : invitation.name}</h1>
        </div>
        ${invitation ? html`<div class="admin-head__actions">${status(invitation)}</div>` : ''}
      </header>

      ${invitation
        ? html`<section class="share">
            <div class="share__link">
              <p class="label">Personal invitation link</p>
              <p class="share__url"><a href="${link}" target="_blank" rel="noopener">${link}</a></p>
              <p class="admin-meta">Code <span class="code">${displayCode(invitation.code)}</span>${invitation.sentAt ? ` · Sent ${ctx.clock.stamp(invitation.sentAt)}` : ' · Not sent yet'}</p>
            </div>
            <div class="share__actions">
              <button class="button button--ghost" type="button" data-copy="${link}">Copy link</button>
              <button class="button button--ghost" type="button" data-copy="${message}">Copy message</button>
              <form method="post" action="/admin/invitations/${invitation.id}/send" target="_blank">${csrf(ctx)}<button class="button" type="submit">Send on WhatsApp</button></form>
            </div>
          </section>`
        : ''}

      <div class="admin-columns admin-columns--form">
        <form class="admin-form" method="post" action="${isNew ? '/admin/invitations' : `/admin/invitations/${invitation.id}`}" novalidate>
          ${csrf(ctx)}
          <div class="field${errors.name ? ' field--invalid' : ''}">
            <label class="field__label" for="name">Name on the invitation</label>
            <p class="field__hint" id="name-hint">As guests should see it, e.g. “Mr &amp; Mrs Chidi Okafor” or “Tolu and family”.</p>
            <input class="input" id="name" name="name" value="${v.name}" required aria-describedby="name-hint"${inv('name')}>
            ${err('name')}
          </div>
          <div class="field-row">
            <div class="field${errors.seats ? ' field--invalid' : ''}">
              <label class="field__label" for="seats">Seats</label>
              <input class="input" id="seats" name="seats" type="number" min="1" max="50" inputmode="numeric" value="${v.seats}" required${inv('seats')}>
              ${err('seats')}
            </div>
            <div class="field">
              <label class="field__label" for="side">Side</label>
              <select class="input input--select" id="side" name="side">
                <option value="">Not set</option>
                ${SIDES.map((s) => html`<option value="${s}"${v.side === s ? raw(' selected') : ''}>${sideLabel(c, s)}</option>`)}
              </select>
            </div>
            <div class="field">
              <label class="field__label" for="category">Group</label>
              <input class="input" id="category" name="category" value="${v.category}" list="categories" placeholder="Family, Friends, Church…">
              <datalist id="categories">${categories.map((x) => html`<option value="${x}">`)}</datalist>
            </div>
          </div>
          <fieldset class="field${errors.events ? ' field--invalid' : ''}">
            <legend class="field__label">Invited to</legend>
            <div class="checks checks--grid">${eventChecks(ctx, v.events)}</div>
            ${err('events')}
          </fieldset>
          <div class="field-row">
            <div class="field${errors.phone ? ' field--invalid' : ''}">
              <label class="field__label" for="phone">Phone / WhatsApp <span class="field__optional">Optional</span></label>
              <input class="input" id="phone" name="phone" type="tel" value="${v.phone}"${inv('phone')}>
              ${err('phone')}
            </div>
            <div class="field${errors.email ? ' field--invalid' : ''}">
              <label class="field__label" for="email">Email <span class="field__optional">Optional</span></label>
              <input class="input" id="email" name="email" type="email" value="${v.email}"${inv('email')}>
              ${err('email')}
            </div>
          </div>
          ${isNew
            ? html`<div class="field${errors.code ? ' field--invalid' : ''}">
                <label class="field__label" for="code">Invitation code <span class="field__optional">Optional</span></label>
                <p class="field__hint" id="code-hint">Leave empty to generate a secure code.</p>
                <input class="input input--code-sm" id="code" name="code" value="${v.code || ''}" autocomplete="off" aria-describedby="code-hint"${inv('code')}>
                ${err('code')}
              </div>`
            : ''}
          <div class="field">
            <label class="field__label" for="notes">Private notes <span class="field__optional">Only you see these</span></label>
            <textarea class="input input--area" id="notes" name="notes" rows="3">${v.notes}</textarea>
          </div>
          <div class="admin-form__submit">
            <button class="button" type="submit">${isNew ? 'Create invitation' : 'Save changes'}</button>
            <a class="link" href="/admin/invitations">Cancel</a>
          </div>
        </form>

        ${invitation
          ? html`<aside class="admin-aside">
              <section class="panel">
                <h2 class="admin-subtitle">Reply</h2>
                ${r
                  ? html`<dl class="summary summary--compact">
                      <div><dt>Answer</dt><dd>${r.attending ? `Attending · ${plural(r.guests, 'guest')}` : 'Declined'}</dd></div>
                      ${r.attending ? html`<div><dt>Celebrations</dt><dd>${eventShort(c, r.events) || '—'}</dd></div>` : ''}
                      <div><dt>From</dt><dd>${r.fullName}<br>${r.phone}${r.email ? html`<br>${r.email}` : ''}</dd></div>
                      ${r.dietary ? html`<div><dt>Dietary</dt><dd>${r.dietary}</dd></div>` : ''}
                      ${r.accessibility ? html`<div><dt>Access</dt><dd>${r.accessibility}</dd></div>` : ''}
                      ${r.message ? html`<div><dt>Note</dt><dd class="pre">${r.message}</dd></div>` : ''}
                      <div><dt>Updated</dt><dd>${ctx.clock.stamp(r.updatedAt)}${r.revisions > 1 ? ` · changed ${plural(r.revisions - 1, 'time')}` : ''}</dd></div>
                    </dl>
                    ${r.attending && r.guests > invitation.seats ? html`<p class="alert">This reply has more guests than the seats now allocated.</p>` : ''}
                    <form method="post" action="/admin/invitations/${invitation.id}/clear-reply" data-confirm="Clear this reply? The guest will be able to reply again.">${csrf(ctx)}<button class="mini" type="submit">Clear reply</button></form>`
                  : html`<p class="empty">No reply yet. To record one for the guest, open their personal link while signed in.</p>`}
              </section>
              <section class="panel">
                <h2 class="admin-subtitle">Code</h2>
                <p class="admin-meta">If a link has been shared with the wrong person, issue a new code. The old link stops working.</p>
                <form method="post" action="/admin/invitations/${invitation.id}/new-code" data-confirm="Issue a new code? The current link will stop working.">${csrf(ctx)}<button class="mini" type="submit">Issue a new code</button></form>
              </section>
              <section class="panel panel--danger">
                <h2 class="admin-subtitle">Delete</h2>
                <form method="post" action="/admin/invitations/${invitation.id}/delete" data-confirm="Delete this invitation and its reply? This cannot be undone.">${csrf(ctx)}<button class="mini mini--danger" type="submit">Delete invitation</button></form>
              </section>
            </aside>`
          : ''}
      </div>`,
  });
}

/* ---------------------------------------------------------------- Import */

export function importPage(ctx, { text = '', errors = [], created = null }) {
  const c = ctx.content;
  return shell(ctx, {
    title: 'Import',
    current: '/admin/import',
    body: html`<header class="admin-head">
        <div>
          <p class="label">Invitations</p>
          <h1 class="admin-title">Import a guest list</h1>
        </div>
      </header>
      ${created !== null ? html`<p class="flash" role="status">${plural(created, 'invitation')} created.</p>` : ''}
      ${errors.length
        ? html`<div class="alert" role="alert"><p><strong>Nothing was imported.</strong> Please fix these rows and try again:</p><ul>${errors.map((e) => html`<li>${e}</li>`)}</ul></div>`
        : ''}
      <div class="admin-columns admin-columns--form">
        <form class="admin-form" method="post" action="/admin/import">
          ${csrf(ctx)}
          <div class="field">
            <label class="field__label" for="csv">Paste CSV, or choose a file</label>
            <input class="input input--file" type="file" accept=".csv,text/csv" data-csv-file aria-label="Choose a CSV file">
            <textarea class="input input--area input--mono" id="csv" name="csv" rows="14" spellcheck="false" placeholder="name,seats,side,category,phone,events">${text}</textarea>
          </div>
          <div class="admin-form__submit"><button class="button" type="submit">Import invitations</button></div>
        </form>
        <aside class="admin-aside">
          <section class="panel">
            <h2 class="admin-subtitle">Columns</h2>
            <dl class="summary summary--compact">
              <div><dt>name</dt><dd>Required. As it should appear on the invitation.</dd></div>
              <div><dt>seats</dt><dd>Number of guests allowed. Defaults to 1.</dd></div>
              <div><dt>side</dt><dd>${c.couple.first.toLowerCase()}, ${c.couple.second.toLowerCase()} or both.</dd></div>
              <div><dt>category</dt><dd>Any group, e.g. Family.</dd></div>
              <div><dt>phone, email</dt><dd>Optional. Used to send the invitation.</dd></div>
              <div><dt>events</dt><dd>Event ids separated by ; (${c.events.map((e) => e.id).join(', ')}). Leave empty for all open events.</dd></div>
              <div><dt>code</dt><dd>Optional. Leave empty to generate one.</dd></div>
              <div><dt>notes</dt><dd>Optional, private.</dd></div>
            </dl>
            <p class="admin-meta">Example:</p>
            <pre class="example">name,seats,side,category,phone,events
Mr &amp; Mrs Chidi Okafor,2,${c.couple.second.toLowerCase()},Family,0803 000 0000,
Tolu and family,4,${c.couple.first.toLowerCase()},Friends,,${c.events.slice(1, 3).map((e) => e.id).join(';')}</pre>
          </section>
        </aside>
      </div>`,
  });
}

/* ---------------------------------------------------------------- Updates */

export function updatesPage(ctx, { items, error = '' }) {
  return shell(ctx, {
    title: 'Updates',
    current: '/admin/updates',
    body: html`<header class="admin-head">
        <div>
          <p class="label">Shown to guests</p>
          <h1 class="admin-title">Updates</h1>
        </div>
      </header>
      <p class="admin-intro">Post short announcements, such as a change of time or venue. The newest appears at the top of the site, and all are listed under Guest information.</p>
      <div class="admin-columns admin-columns--form">
        <form class="admin-form" method="post" action="/admin/updates">
          ${csrf(ctx)}
          <div class="field${error ? ' field--invalid' : ''}">
            <label class="field__label" for="body">New update</label>
            <textarea class="input input--area" id="body" name="body" rows="3" maxlength="280" required${error ? raw(' aria-invalid="true" aria-describedby="body-error"') : ''}></textarea>
            ${error ? html`<p class="field__error" id="body-error">${error}</p>` : ''}
          </div>
          <div class="admin-form__submit"><button class="button" type="submit">Publish update</button></div>
        </form>
        <section class="admin-aside">
          ${items.length
            ? html`<ol class="feed">${items.map(
                (a) => html`<li class="feed__item feed__item--stack">
                  <span>${a.body}</span>
                  <span class="feed__when">${ctx.clock.stamp(a.createdAt)}</span>
                  <form method="post" action="/admin/updates/${a.id}/delete" data-confirm="Remove this update from the site?">${csrf(ctx)}<button class="mini" type="submit">Remove</button></form>
                </li>`,
              )}</ol>`
            : html`<p class="empty">No updates published.</p>`}
        </section>
      </div>`,
  });
}

/* ---------------------------------------------------------------- Content checklist */

export function contentPage(ctx, { groups, problems }) {
  const count = groups.reduce((n, g) => n + g.items.length, 0);
  return shell(ctx, {
    title: 'Content',
    current: '/admin/content',
    body: html`<header class="admin-head">
        <div>
          <p class="label">content/wedding.js</p>
          <h1 class="admin-title">Content checklist</h1>
        </div>
        <div class="admin-head__actions"><a class="button button--ghost" href="/admin/preview?show=1&amp;back=%2F">Preview the site</a></div>
      </header>
      <p class="admin-intro">${count
        ? `${plural(count, 'detail')} still marked tbc(…). Guests don’t see these; replace each in content/wedding.js as it is confirmed. Events also need status: 'confirmed' before guests see them.`
        : 'Every placeholder has been filled in.'}</p>
      ${problems.length
        ? html`<div class="alert"><p><strong>Please fix:</strong></p><ul>${problems.map((p) => html`<li>${p}</li>`)}</ul></div>`
        : ''}
      ${groups.map(
        (g) => html`<section class="admin-section">
          <h2 class="admin-subtitle">${g.label} <span class="muted">${g.items.length}</span></h2>
          <table class="table table--checklist">
            <tbody>${g.items.map((i) => html`<tr><td>${i.hint}</td><td class="muted"><code>${i.context}</code></td></tr>`)}</tbody>
          </table>
        </section>`,
      )}`,
  });
}

