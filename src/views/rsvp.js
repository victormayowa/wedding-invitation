import { html, raw } from '../html.js';
import { filled } from '../tbc.js';
import { isTime } from '../format.js';
import { displayCode } from '../db.js';
import { calendarReady } from '../ics.js';
import { page, siteHeader, siteFooter } from './layout.js';
import { telHref, whatsappHref, plural, picture } from './parts.js';

function shell(ctx, { title, body, scripts = [] }) {
  const c = ctx.content;
  return page(ctx, {
    title: `${title} · ${c.couple.first} & ${c.couple.second}`,
    description: `Reply to the invitation to the wedding of ${c.couple.first} & ${c.couple.second}.`,
    og: { title: `Kindly reply · ${c.couple.first} & ${c.couple.second}`, canonical: '/rsvp' },
    bodyClass: 'reply-page',
    scripts: ['/js/site.js', ...scripts],
    body: html`${siteHeader(ctx, [], { solid: true })}
    <main id="main" class="reply">
      ${pageHeader(ctx, 'RSVP')}
      <div class="container reply__wrap"><div class="reply__sheet">${body}</div></div>
    </main>
    ${siteFooter(ctx)}`,
  });
}

/** The photo band at the top of inner pages, as on the reference site. */
export function pageHeader(ctx, title) {
  const c = ctx.content;
  const bg = [...(c.hero.slides || []), c.hero.image].find((n) => ctx.images.get(n));
  return html`<div class="page-header">
    ${bg ? html`<div class="page-header__bg">${picture(ctx, bg, { alt: '', sizes: '100vw', reveal: false, cls: 'media--cover' })}</div>` : ''}
    <div class="container page-header__inner">
      <p class="page-header__title" data-split>${title}</p>
      <p class="page-header__crumbs"><a href="/">Home</a> <span aria-hidden="true">/</span> ${title}</p>
    </div>
  </div>`;
}

function deadlineLine(ctx, win) {
  if (!win.deadline) return '';
  return html`<p class="reply__deadline">Kindly reply by ${ctx.clock.dateLong(win.deadline)}.</p>`;
}

function contactsList(ctx) {
  const people = (ctx.content.contacts || []).filter((p) => filled(p.phone));
  if (!people.length) return '';
  return html`<ul class="reply__contacts">${people.map(
    (p) => html`<li>
      <span class="reply__contact-role">${p.role}${filled(p.name) ? html`<span class="reply__contact-name">, ${p.name}</span>` : ''}</span>
      <a class="link" href="${telHref(p.phone)}">${p.phone}</a>
      ${p.whatsapp ? html`<a class="link" href="${whatsappHref(p.phone)}" rel="noopener" target="_blank">WhatsApp</a>` : ''}
    </li>`,
  )}</ul>`;
}

function errorSummary(errors) {
  const entries = Object.entries(errors);
  if (!entries.length) return '';
  return html`<div class="form-errors" role="alert" tabindex="-1" data-error-summary>
    <p class="form-errors__title">${entries.length === 1 ? 'One detail needs your attention' : 'A few details need your attention'}</p>
    <ul>${entries.map(([field, msg]) => html`<li><a href="#field-${field}">${msg}</a></li>`)}</ul>
  </div>`;
}

const describedBy = (errors, field, hint) =>
  [hint && `${field}-hint`, errors[field] && `${field}-error`].filter(Boolean).join(' ');

function fieldError(errors, field) {
  return errors[field] ? html`<p class="field__error" id="${field}-error">${errors[field]}</p>` : '';
}

function input(errors, { name, label, value = '', type = 'text', optional = false, hint = '', autocomplete = '', inputmode = '' }) {
  const ids = describedBy(errors, name, hint);
  return html`<div class="field${errors[name] ? ' field--invalid' : ''}">
    <label class="field__label" for="field-${name}">${label}${optional ? html` <span class="field__optional">Optional</span>` : ''}</label>
    ${hint ? html`<p class="field__hint" id="${name}-hint">${hint}</p>` : ''}
    <input class="input" id="field-${name}" name="${name}" type="${type}" value="${value}"${autocomplete ? raw(` autocomplete="${autocomplete}"`) : ''}${inputmode ? raw(` inputmode="${inputmode}"`) : ''}${optional ? '' : raw(' required')}${ids ? raw(` aria-describedby="${ids}"`) : ''}${errors[name] ? raw(' aria-invalid="true"') : ''}>
    ${fieldError(errors, name)}
  </div>`;
}

function textarea(errors, { name, label, value = '', hint = '', rows = 3 }) {
  return html`<div class="field">
    <label class="field__label" for="field-${name}">${label} <span class="field__optional">Optional</span></label>
    ${hint ? html`<p class="field__hint" id="${name}-hint">${hint}</p>` : ''}
    <textarea class="input input--area" id="field-${name}" name="${name}" rows="${rows}"${hint ? raw(` aria-describedby="${name}-hint"`) : ''}>${value}</textarea>
  </div>`;
}

function eventWhen(ctx, e) {
  const parts = [];
  if (filled(e.date)) parts.push(ctx.clock.dateMedium(e.date));
  if (isTime(e.start)) parts.push(ctx.clock.time(e.start));
  return parts.join(' · ');
}

/* ---------------------------------------------------------------- Pages */

export function codePage(ctx, { code = '', error = '', win }) {
  return shell(ctx, {
    title: 'Kindly reply',
    body: html`<p class="label">Your invitation</p>
      <h1 class="reply__title">Kindly reply</h1>
      <p class="reply__lead">Please enter the invitation code from the message we sent you.</p>
      ${deadlineLine(ctx, win)}
      <form class="reply__form" method="post" action="/rsvp/code" novalidate>
        <div class="field field--code${error ? ' field--invalid' : ''}">
          <label class="field__label" for="field-code">Invitation code</label>
          <input class="input input--code" id="field-code" name="code" value="${code}" autocomplete="off" autocapitalize="characters" spellcheck="false" required placeholder="ABCD-2345"${error ? raw(' aria-invalid="true" aria-describedby="code-error"') : ''}>
          ${error ? html`<p class="field__error" id="code-error" role="alert">${error}</p>` : ''}
        </div>
        <button class="button button--block" type="submit">Continue</button>
      </form>
      <div class="reply__help">
        <p>${ctx.content.rsvp.help}</p>
        ${contactsList(ctx)}
      </div>`,
  });
}

export function replyPage(ctx, { invitation, events, values, errors = {}, win }) {
  const r = invitation.response;
  const v = values || {
    attending: r ? (r.attending ? 'yes' : 'no') : '',
    fullName: r?.fullName || '',
    phone: r?.phone || invitation.phone || '',
    email: r?.email || invitation.email || '',
    guests: r?.attending ? r.guests : invitation.seats,
    events: r ? r.events : events.map((e) => e.id),
    dietary: r?.dietary || '',
    accessibility: r?.accessibility || '',
    message: r?.message || '',
  };
  const seats = invitation.seats;
  const guests = Math.min(Math.max(Number(v.guests) || seats, 1), seats);

  return shell(ctx, {
    title: 'Your reply',
    scripts: ['/js/rsvp.js'],
    body: html`<p class="label">An invitation for</p>
      <h1 class="reply__title">${invitation.name}</h1>
      <p class="reply__lead">${seats === 1 ? 'Your invitation is for one guest.' : `Your invitation is for up to ${seats} guests.`}</p>
      ${r
        ? html`<p class="reply__notice">You replied on ${ctx.clock.stamp(r.updatedAt)}. Change anything below and send it again to update your reply.</p>`
        : deadlineLine(ctx, win)}
      ${errorSummary(errors)}
      <form class="reply__form" method="post" action="/rsvp" novalidate data-reply-form>
        <fieldset class="choices${errors.attending ? ' field--invalid' : ''}" id="field-attending">
          <legend class="reply__question">Will you be joining us?</legend>
          <label class="choice">
            <input type="radio" name="attending" value="yes"${v.attending === 'yes' ? raw(' checked') : ''} required>
            <span class="choice__text"><span class="choice__title">Joyfully accepts</span><span class="choice__desc">We’ll be there to celebrate with you.</span></span>
          </label>
          <label class="choice">
            <input type="radio" name="attending" value="no"${v.attending === 'no' ? raw(' checked') : ''}>
            <span class="choice__text"><span class="choice__title">Regretfully declines</span><span class="choice__desc">We’ll be with you in spirit.</span></span>
          </label>
          ${fieldError(errors, 'attending')}
        </fieldset>

        <div class="reply__group" data-when-attending>
          ${seats > 1
            ? html`<div class="field${errors.guests ? ' field--invalid' : ''}">
                <label class="field__label" for="field-guests">How many of you will attend?</label>
                <div class="stepper" data-stepper>
                  <button class="stepper__btn" type="button" data-step="-1" aria-label="One fewer guest" hidden>−</button>
                  <input class="input stepper__input" id="field-guests" name="guests" type="number" inputmode="numeric" min="1" max="${seats}" value="${guests}" aria-describedby="guests-hint${errors.guests ? ' guests-error' : ''}">
                  <button class="stepper__btn" type="button" data-step="1" aria-label="One more guest" hidden>+</button>
                  <span class="stepper__of" id="guests-hint">of ${plural(seats, 'seat')}</span>
                </div>
                ${fieldError(errors, 'guests')}
              </div>`
            : html`<input type="hidden" name="guests" value="1">`}

          ${events.length
            ? html`<fieldset class="field${errors.events ? ' field--invalid' : ''}" id="field-events">
                <legend class="field__label">${events.length === 1 ? 'You are invited to' : 'Which celebrations will you attend?'}</legend>
                <div class="checks">
                  ${events.map(
                    (e) => html`<label class="check">
                      <input type="checkbox" name="events" value="${e.id}"${v.events.includes(e.id) ? raw(' checked') : ''}>
                      <span class="check__text"><span class="check__title">${e.name}</span>${eventWhen(ctx, e) ? html`<span class="check__desc">${eventWhen(ctx, e)}</span>` : ''}</span>
                    </label>`,
                  )}
                </div>
                ${fieldError(errors, 'events')}
              </fieldset>`
            : ''}
        </div>

        <div class="reply__section">
          <p class="reply__question">Your details</p>
          ${input(errors, { name: 'fullName', label: 'Your full name', value: v.fullName, autocomplete: 'name' })}
          ${input(errors, { name: 'phone', label: 'Phone number', value: v.phone, type: 'tel', autocomplete: 'tel', inputmode: 'tel', hint: 'Ideally your WhatsApp number, in case we need to reach you about the day.' })}
          ${input(errors, { name: 'email', label: 'Email', value: v.email, type: 'email', autocomplete: 'email', optional: true })}
        </div>

        <div class="reply__section" data-when-attending>
          <p class="reply__question">Anything we should know?</p>
          ${textarea(errors, { name: 'dietary', label: 'Dietary requirements', value: v.dietary, rows: 2 })}
          ${textarea(errors, { name: 'accessibility', label: 'Accessibility needs', value: v.accessibility, rows: 2, hint: 'For example step-free access, or seating near the front.' })}
        </div>

        <div class="reply__section">
          ${textarea(errors, { name: 'message', label: `A note for ${ctx.content.couple.first} & ${ctx.content.couple.second}`, value: v.message, rows: 4 })}
        </div>

        <div class="reply__submit">
          <button class="button button--block" type="submit">${r ? 'Update my reply' : 'Send my reply'}</button>
          <p class="reply__switch">Not ${invitation.name}? <a class="link" href="/rsvp/change">Use a different code</a></p>
        </div>
      </form>`,
  });
}

export function thanksPage(ctx, { invitation, events }) {
  const r = invitation.response;
  const first = r.fullName.split(/\s+/)[0];
  const chosen = events.filter((e) => r.events.includes(e.id));
  const calendarEvents = chosen.filter(calendarReady);
  const win = ctx.window;
  return shell(ctx, {
    title: 'Thank you',
    body: html`<p class="label">${r.attending ? 'Joyfully accepted' : 'Reply received'}</p>
      <h1 class="reply__title">Thank you, ${first}.</h1>
      <p class="reply__lead reply__lead--serif">${r.attending ? 'We can’t wait to celebrate with you.' : 'We’ll miss you, and we’re so grateful for your love and good wishes.'}</p>
      <dl class="summary">
        <div><dt>Your reply</dt><dd>${r.attending ? `Attending · ${plural(r.guests, 'guest')}` : 'Unable to attend'}</dd></div>
        ${chosen.length ? html`<div><dt>Celebrations</dt><dd>${chosen.map((e) => html`<span class="summary__event">${e.name}${eventWhen(ctx, e) ? html`<span class="summary__muted">${eventWhen(ctx, e)}</span>` : ''}</span>`)}</dd></div>` : ''}
        <div><dt>We’ll reach you on</dt><dd>${r.phone}${r.email ? html`<br>${r.email}` : ''}</dd></div>
      </dl>
      <div class="reply__actions">
        ${calendarEvents.length ? html`<a class="button" href="/calendar.ics">Add to your calendar</a>` : ''}
        <a class="button button--ghost" href="/">Back to the invitation</a>
      </div>
      <p class="reply__small">Plans changed? Come back to <a class="link" href="/rsvp">your reply</a> at any time${win.deadline ? ` before ${ctx.clock.dateLong(win.deadline)}` : ''}. Your code is <strong class="code">${displayCode(invitation.code)}</strong>.</p>`,
  });
}

export function closedPage(ctx, { invitation, win }) {
  const c = ctx.content;
  const r = invitation?.response;
  const after = win.reason === 'after';
  return shell(ctx, {
    title: after ? 'Thank you' : 'Replies have closed',
    body: html`<p class="label">RSVP</p>
      <h1 class="reply__title">${after ? 'Thank you' : 'Replies have now closed'}</h1>
      <p class="reply__lead">${after
        ? c.closing.after
        : 'Our guest list is now final. If something has changed, please get in touch with us directly.'}</p>
      ${r
        ? html`<dl class="summary">
            <div><dt>Your reply</dt><dd>${r.attending ? `Attending · ${plural(r.guests, 'guest')}` : 'Unable to attend'}</dd></div>
          </dl>`
        : ''}
      ${after ? '' : contactsList(ctx)}
      <div class="reply__actions"><a class="button button--ghost" href="/">Back to the invitation</a></div>`,
  });
}
