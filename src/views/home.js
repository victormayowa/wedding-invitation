import { html, raw } from '../html.js';
import { filled, isTbc } from '../tbc.js';
import { isIsoDate, isTime } from '../format.js';
import { visibleEvents, countdownTarget } from '../rsvp.js';
import { calendarReady } from '../ics.js';
import { page, siteHeader, siteFooter, coupleMark } from './layout.js';

const rsvpHref = (ctx) => ctx.rsvpHref || '/rsvp';
import {
  t,
  shows,
  paras,
  picture,
  plate,
  safeColor,
  telHref,
  whatsappHref,
  mapsDirectionsHref,
  mapsEmbedSrc,
  icon,
  button,
  scribbleArrow,
  directionsHref,
  rsvpPeople,
  ROMAN,
} from './parts.js';

/* Section titles: a small label with the rings icon, then an uppercase heading
   whose second part is set in wine. */
function sectionTitle({ label, lead, accent, id, center = false }) {
  return html`<div class="section-title${center ? ' section-title--center' : ''}">
    <p class="eyebrow" data-fade>${icon('rings')}<span>${label}</span></p>
    <h2 id="${id}" data-split>${lead}${accent ? html` <span class="accent">${accent}</span>` : ''}</h2>
  </div>`;
}

/* ---------------------------------------------------------------- Hero */

function countdown(ctx) {
  const target = countdownTarget(ctx.content, ctx.clock);
  const diff = Math.max(0, target - ctx.now);
  const units = [
    ['days', Math.floor(diff / 864e5), 'Days'],
    ['hours', Math.floor(diff / 36e5) % 24, 'Hours'],
    ['minutes', Math.floor(diff / 6e4) % 60, 'Minutes'],
    ['seconds', Math.floor(diff / 1e3) % 60, 'Seconds'],
  ];
  const days = units[0][1];
  return html`<div class="countdown" data-countdown="${target.toISOString()}">
    <p class="countdown__caption">Counting down to the day</p>
    <p class="sr-only">${days === 0 ? 'Less than a day to go.' : `${days} ${days === 1 ? 'day' : 'days'} to go.`}</p>
    <ol class="countdown__units" aria-hidden="true">
      ${units.map(
        ([k, v, label]) => html`<li class="countdown__unit">
          <span class="countdown__value" data-unit="${k}">${String(v).padStart(2, '0')}</span>
          <span class="countdown__label">${label}</span>
        </li>`,
      )}
    </ol>
  </div>`;
}

/** One slide per prepared photo; the first carries the names, the rest the tagline. */
function heroSlides(ctx) {
  const c = ctx.content;
  const images = [c.hero.image, ...(c.hero.slides || [])].filter((n) => ctx.images.get(n));
  const sentences = String(c.tagline || '')
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lines = [sentences.slice(0, 2).join(' '), sentences.slice(2).join(' ')].filter(Boolean);
  return Array.from({ length: Math.max(1, images.length) }, (_, i) => ({
    image: images[i] || null,
    title: i === 0 || !lines.length ? null : lines[(i - 1) % lines.length],
  }));
}

function hero(ctx) {
  const c = ctx.content;
  const slides = heroSlides(ctx);
  const reply = ctx.invite?.response ? 'Update your reply' : 'Reply to our invitation';
  const eyebrow = ctx.invite ? html`An invitation for ${ctx.invite.name}` : c.codeName ? html`${c.codeName} · The wedding of` : 'The wedding of';
  const latest = ctx.announcements[0];

  let actions = '';
  if (ctx.phase === 'before') {
    actions = html`${ctx.rsvpOpen ? button(reply, rsvpHref(ctx)) : ''}${button('The celebration', '#celebration', { variant: 'light' })}`;
  } else if (ctx.phase === 'today') {
    actions = button('Today’s celebration', '#celebration');
  } else if (ctx.has.gallery) {
    actions = button('View the gallery', '#gallery');
  }

  let strip;
  if (ctx.phase === 'before') strip = countdown(ctx);
  else if (ctx.phase === 'today') strip = html`<p class="hero__moment">Today is the day. We can’t wait to see you.</p>`;
  else strip = html`<p class="hero__moment">Married on ${ctx.clock.dateLong(c.date)}. Thank you for celebrating with us.</p>`;

  const panels = slides.filter((s) => s.image);
  /* A panel is filled edge to edge, so a portrait photo is drawn at the panel's full height
     (the height of the screen) and is wider than the panel itself. Describe that drawn
     width to the browser so every screen fetches a large enough copy. */
  const drawnWidth = (name) => {
    const img = ctx.images.get(name);
    const tall = Math.round(100 * (img ? img.w / img.h : 0.8));
    return `(min-width: 768px) max(${Math.round(100 / panels.length)}vw, ${tall}vh), max(100vw, ${tall}vh)`;
  };
  return html`<section class="hero" aria-labelledby="hero-title" data-slider>
    <div class="hero__backdrop" style="--panels:${Math.max(1, panels.length)}" aria-hidden="true">
      ${panels.map(
        (s, i) => html`<div class="hero__panel${i === 0 ? ' is-active' : ''}" data-panel>${picture(ctx, s.image, {
          alt: '',
          eager: i === 0,
          sizes: drawnWidth(s.image),
          reveal: false,
          cls: 'media--cover',
        })}</div>`,
      )}
    </div>
    <div class="hero__slides">
      ${slides.map(
        (s, i) => html`<div class="hero__slide${i === 0 ? ' is-active' : ''}" data-slide${i ? raw(' aria-hidden="true"') : ''}>
          <div class="container hero__content">
            <p class="hero__eyebrow" data-fade>${eyebrow}</p>
            ${i === 0
              ? html`<h1 class="hero__title" id="hero-title" data-split>${coupleMark(c)}</h1>`
              : html`<p class="hero__title" data-split>${s.title || coupleMark(c)}</p>`}
            <p class="hero__text" data-fade style="--d:.25s">${ctx.clock.dateLong(c.date)} · ${c.place}</p>
            ${actions ? html`<div class="hero__actions" data-fade style="--d:.5s">${actions}</div>` : ''}
          </div>
        </div>`,
      )}
    </div>
    ${slides.length > 1
      ? html`<div class="hero__dots" data-dots>
          ${slides.map((_, i) => html`<button type="button" class="hero__dot${i === 0 ? ' is-active' : ''}" data-dot="${i}" aria-label="Show photo ${i + 1} of ${slides.length}"${i === 0 ? raw(' aria-current="true"') : ''}></button>`)}
        </div>`
      : ''}
    <a class="hero__scroll" href="#invitation" aria-label="Scroll to the invitation"><span></span></a>
    <div class="hero__strip">
      <div class="container hero__strip-inner">
        ${latest ? html`<a class="hero__notice" href="#updates"><span class="hero__notice-label">Update</span> ${latest.body}</a>` : ''}
        ${strip}
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Ticker */

function ticker(ctx) {
  const c = ctx.content;
  const [y, m, d] = c.date.split('-');
  const words = [
    c.codeName,
    `${c.couple.first} & ${c.couple.second}`,
    `${d}.${m}.${y}`,
    ...String(c.tagline || '')
      .split(/(?<=\.)\s+/)
      .map((s) => s.replace(/\.$/, '')),
    c.place.split(',')[0],
  ].filter(Boolean);
  const run = html`<div class="ticker__run">${words.map((w) => html`<span class="ticker__word">${w}</span><span class="ticker__sep">${icon('rings')}</span>`)}</div>`;
  return html`<div class="ticker" aria-hidden="true"><div class="ticker__track">${run}${run}</div></div>`;
}

/* ---------------------------------------------------------------- Invitation */

/** A photo's description, from wherever the gallery lists it. */
function altFor(c, src) {
  for (const a of c.gallery?.albums || []) for (const im of a.images) if (im.src === src && im.alt) return im.alt;
  return '';
}

function invitation(ctx) {
  const c = ctx.content;
  const inv = c.invitation;
  const families = (inv.families || []).filter((f) => shows(f, ctx));
  const card = inv.card ? ctx.images.get(inv.card) : null;
  const imgs = (inv.images || []).filter((n) => ctx.images.get(n) || (ctx.preview && (isTbc(n) || filled(n))));
  const [day, month] = ctx.clock.dayMonth(c.date).split(' ');
  const glance = ctx.events.filter((e) => isIsoDate(e.date));
  const cardFull = card && `/images/${card.name}-${card.widths[card.widths.length - 1]}.webp`;
  const cardSave = card && `/images/${card.name}-${card.jpg[card.jpg.length - 1]}.jpg`;

  let visual = '';
  if (imgs.length) {
    // The portrait, the ring in one corner, the printed card in the other and the date badge.
    visual = html`<div class="about__images">
      <figure class="about__img about__img--main image-anime" data-curtain>${picture(ctx, imgs[0], { alt: altFor(c, imgs[0]), ratio: '4 / 5', sizes: '(min-width: 992px) 34vw, 90vw', reveal: false })}</figure>
      ${imgs[1] ? html`<figure class="about__img about__img--small image-anime" data-curtain>${picture(ctx, imgs[1], { alt: altFor(c, imgs[1]), ratio: '1 / 1', sizes: '(min-width: 992px) 18vw, 45vw', reveal: false })}</figure>` : ''}
      ${card
        ? html`<a class="about__card" href="${cardFull}" target="_blank" rel="noopener" aria-label="Open the invitation card full size" data-fade style="--d:.35s">
            ${picture(ctx, inv.card, { alt: '', sizes: '(min-width: 992px) 15vw, 36vw', reveal: false })}
            <span class="about__card-open" aria-hidden="true">${icon('arrow')}</span>
          </a>`
        : ''}
      <p class="about__badge" data-fade style="--d:.5s"><strong>${day}</strong><span>${month} ${c.date.slice(0, 4)}</span></p>
    </div>`;
  } else if (card) {
    visual = html`<figure class="iv-card" data-fade>
      <a class="iv-card__frame image-anime" href="${cardFull}" target="_blank" rel="noopener" aria-label="Open the invitation card full size">
        ${picture(ctx, inv.card, { alt: inv.cardAlt || 'The invitation card', sizes: '(min-width: 992px) 30vw, 86vw', reveal: false })}
      </a>
    </figure>`;
  }

  const actions = [
    ctx.rsvpOpen && ctx.phase !== 'after' && button(ctx.invite?.response ? 'Update your reply' : 'Reply to our invitation', rsvpHref(ctx)),
    ctx.has.locations && html`<a class="text-link" href="#locations">${icon('pin')} Locations &amp; maps</a>`,
    card && html`<a class="text-link" href="${cardSave}" download="NEW-WINE-26-invitation.jpg">${icon('download')} Save the invitation card</a>`,
  ].filter(Boolean);

  return html`<section class="section about" id="invitation" aria-labelledby="invite-title">
    <div class="container about__grid${visual ? (imgs.length ? '' : ' about__grid--card') : ' about__grid--text'}">
      ${visual}
      <div class="about__text">
        ${sectionTitle({ label: ctx.invite ? html`An invitation for ${ctx.invite.name}` : 'Our invitation', lead: 'You are', accent: 'invited', id: 'invite-title' })}
        ${families.length
          ? html`<p class="about__lead" data-fade>The families of</p>
            <ul class="about__list">
              ${families.map((f, i) => html`<li data-fade style="--d:${0.25 * (i + 1)}s"><span class="icon-box">${icon('heart')}</span><span>${t(f, ctx)}</span></li>`)}
            </ul>`
          : ''}
        ${filled(inv.statement) ? html`<p class="about__statement" data-fade>${inv.statement}</p>` : ''}
        ${filled(inv.names) ? html`<p class="about__names" data-fade>${inv.names}</p>` : ''}
        ${glance.length
          ? html`<ul class="glance" data-fade>
              ${glance.map(
                (e) => html`<li class="glance__item">
                  <span class="glance__name">${e.name}</span>
                  <span class="glance__when">${ctx.clock.dateMedium(e.date)}${isTime(e.start) ? ` · ${timeRange(ctx, e)}` : ''}</span>
                  ${filled(e.venue?.name) ? html`<span class="glance__where">${e.venue.name}</span>` : ''}
                </li>`,
              )}
            </ul>`
          : ''}
        ${actions.length ? html`<div class="about__actions" data-fade style="--d:.5s">${actions}</div>` : ''}
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- RSVP band */

function ctaBand({ title, label, href }) {
  return html`<section class="cta-band" aria-label="${title}">
    <div class="container cta-band__inner">
      <h2 class="cta-band__title" data-split>${title}</h2>
      <div class="cta-band__action" data-fade>
        ${scribbleArrow()}
        ${button(label, href, { variant: 'light' })}
      </div>
    </div>
  </section>`;
}

/** Guests reply by phone: the RSVP contacts in the wine band, with call and WhatsApp buttons. */
function rsvpBand(ctx) {
  const c = ctx.content;
  const people = rsvpPeople(ctx, { cls: 'rsvp-people--band' });
  if (!c.rsvp?.byPhone || !String(people)) {
    const replied = Boolean(ctx.invite?.response);
    return ctaBand({ title: replied ? 'Need to change your reply?' : 'Kindly confirm your attendance', label: replied ? 'Update your reply' : 'RSVP now', href: '/rsvp' });
  }
  return html`<section class="cta-band rsvp-band" id="rsvp" aria-labelledby="rsvp-title">
    <div class="container rsvp-band__inner">
      <div class="rsvp-band__intro">
        <h2 class="cta-band__title" id="rsvp-title" data-split>Kindly RSVP</h2>
        <p class="rsvp-band__text" data-fade>Call or send a WhatsApp message to confirm your attendance.</p>
        ${scribbleArrow()}
      </div>
      <div data-fade style="--d:.25s">${people}</div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Story */

function story(ctx) {
  const c = ctx.content;
  const chapters = c.story.chapters.filter((ch) => shows(ch.body, ctx));
  if (!chapters.length) return '';
  return html`<section class="section story" id="story" aria-labelledby="story-title">
    <div class="container">
      <div class="section-row">
        ${sectionTitle({ label: 'Our story', lead: 'A few chapters,', accent: 'so far', id: 'story-title' })}
        ${shows(c.story.intro, ctx) ? html`<p class="section-intro" data-fade>${t(c.story.intro, ctx)}</p>` : ''}
      </div>
      <ol class="timeline">
        ${chapters.map((ch, i) => {
          const img = shows(ch.image, ctx)
            ? picture(ctx, ch.image, { alt: ch.alt || ch.title, ratio: '4 / 3', sizes: '(min-width: 992px) 30vw, 90vw', reveal: false })
            : '';
          return html`<li class="timeline__item${img ? '' : ' timeline__item--text'}">
            <span class="timeline__num" data-fade>${ROMAN[i] || i + 1}</span>
            <div class="timeline__body" data-fade style="--d:.25s">
              ${shows(ch.when, ctx) ? html`<p class="timeline__when">${t(ch.when, ctx)}</p>` : ''}
              <h3 class="timeline__title">${ch.title}</h3>
              ${paras(ch.body, ctx, 'timeline__text')}
            </div>
            ${img ? html`<figure class="timeline__img image-anime" data-curtain>${img}</figure>` : ''}
          </li>`;
        })}
      </ol>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Love notes */

/** A note with a photo: the photo stays beside the text as it scrolls. */
function letter(ctx, n, id) {
  return html`<article class="letter" aria-labelledby="${id}">
    <figure class="letter__img image-anime" data-curtain>${picture(ctx, n.image, { alt: n.alt || '', ratio: '3 / 4', sizes: '(min-width: 992px) 34vw, 90vw', reveal: false })}</figure>
    <div class="letter__body">
      ${filled(n.kicker) ? html`<p class="note__kicker" data-fade>${icon('heart')}<span>${n.kicker}</span></p>` : ''}
      <h3 class="letter__title" id="${id}" data-fade>${n.title}</h3>
      <div class="letter__text" data-fade style="--d:.15s">${paras(n.body, ctx)}</div>
      ${filled(n.finale) ? html`<p class="letter__finale" data-split>${n.finale}</p>` : ''}
    </div>
  </article>`;
}

/** A note without a photo, set as a card with its word large. */
function noteCard(ctx, n, id) {
  return html`<article class="note-card" aria-labelledby="${id}">
    <div class="note-card__head">
      ${filled(n.kicker) ? html`<p class="note__kicker note__kicker--light" data-fade>${icon('heart')}<span>${n.kicker}</span></p>` : ''}
      ${filled(n.word) ? html`<p class="note-card__word" aria-hidden="true" data-split>${n.word}</p>` : ''}
      <h3 class="note-card__title" id="${id}" data-fade>${n.title}</h3>
    </div>
    <div class="note-card__text" data-fade style="--d:.2s">${paras(n.body, ctx)}</div>
  </article>`;
}

function loveNotes(ctx) {
  const notes = (ctx.content.notes || []).filter((n) => shows(n.body, ctx));
  if (!notes.length) return '';
  return html`<section class="section section--lilac notes" id="love-notes" aria-labelledby="notes-title">
    <div class="container">
      <div class="section-row">
        ${sectionTitle({ label: 'Love notes', lead: 'In our', accent: 'own words', id: 'notes-title' })}
      </div>
      <div class="notes__list">
        ${notes.map((n, i) => (shows(n.image, ctx) && ctx.images.get(n.image) ? letter(ctx, n, `note-${i + 1}`) : noteCard(ctx, n, `note-${i + 1}`)))}
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Celebration */

function timeRange(ctx, e) {
  if (!isTime(e.start)) return '';
  const time = isTime(e.end) && e.end > e.start ? `${ctx.clock.time(e.start)} – ${ctx.clock.time(e.end)}` : ctx.clock.time(e.start);
  return filled(e.timeNote) ? `${time} ${e.timeNote}` : time;
}

function accessNote(ctx, e) {
  if (e.access === 'open') return html`<p class="tag">Open to all our guests</p>`;
  if (ctx.invite?.events.includes(e.id)) return html`<p class="tag tag--accent">Included in your invitation</p>`;
  return html`<p class="tag tag--accent">By invitation</p>`;
}

/** A stripe of the event's own colours across the top of its card. */
function colourBand(colours) {
  const list = (colours || []).map((s) => safeColor(s.hex)).filter(Boolean);
  if (!list.length) return '';
  const step = 100 / list.length;
  const stops = list.map((col, i) => `${col} ${(i * step).toFixed(2)}% ${((i + 1) * step).toFixed(2)}%`).join(', ');
  return raw(` style="--band:linear-gradient(90deg, ${stops})"`);
}

function eventCard(ctx, e, i) {
  const v = e.venue || {};
  const query = filled(v.mapQuery) ? v.mapQuery : [v.name, v.address].filter(filled).join(', ');
  const time = timeRange(ctx, e);
  const dress = e.dressCode || {};
  const extras = [
    ['How to find it', v.landmarks],
    ['Parking', v.parking],
    ['Getting there', v.transport],
    ['Please note', e.notes],
  ].filter(([, val]) => shows(val, ctx));
  const [day, month] = isIsoDate(e.date) ? ctx.clock.dayMonth(e.date).split(' ') : ['', ''];
  const swatches = (dress.colours || []).filter((s) => safeColor(s.hex));
  return html`<article class="event-card" id="event-${e.id}" data-fade${colourBand(dress.colours)}>
    <div class="event-card__band" aria-hidden="true"></div>
    <div class="event-card__head">
      ${day ? html`<p class="event-card__date"><strong>${day}</strong><span>${month.slice(0, 3)}</span></p>` : ''}
      <div>
        <h3 class="event-card__name">${e.name}</h3>
        ${accessNote(ctx, e)}
        ${e.status === 'draft' ? html`<p class="draft-flag">Draft: hidden from guests until confirmed</p>` : ''}
      </div>
    </div>
    <ul class="event-card__facts">
      <li>${icon('calendar')}<span>${isIsoDate(e.date) ? ctx.clock.dateMedium(e.date) : shows(e.date, ctx) ? t(e.date, ctx) : 'Date to follow'}</span></li>
      <li>${icon('clock')}<span>${time || (shows(e.start, ctx) ? t(e.start, ctx) : 'Time to follow')}</span></li>
      <li>${icon('pin')}<span>${shows(v.name, ctx) ? html`<strong>${t(v.name, ctx)}</strong>` : 'Venue to follow'}${shows(v.address, ctx) ? html`<br>${t(v.address, ctx)}` : ''}</span></li>
      ${shows(dress.title, ctx) || swatches.length
        ? html`<li>${icon('dress')}<span>${shows(dress.title, ctx) ? t(dress.title, ctx) : 'Colours'}${swatches.length ? html`<span class="mini-swatches">${swatches.map((s) => html`<span class="mini-swatch" style="--c:${safeColor(s.hex)}" title="${s.name}"></span>`)}</span>` : ''}</span></li>`
        : ''}
    </ul>
    <div class="event-card__actions">
      ${query ? button('Directions', directionsHref(v, query), { variant: 'sm', attrs: 'target="_blank" rel="noopener"' }) : ''}
      ${calendarReady(e) ? html`<a class="text-link" href="/calendar/${e.id}.ics">${icon('calendar')} Add to calendar</a>` : ''}
    </div>
    ${extras.length ? html`<dl class="event-card__notes">${extras.map(([label, val]) => html`<div><dt>${label}</dt><dd>${paras(val, ctx)}</dd></div>`)}</dl>` : ''}
  </article>`;
}

function celebration(ctx) {
  const c = ctx.content;
  const events = ctx.events;
  return html`<section class="section section--blush celebration" id="celebration" aria-labelledby="celebration-title">
    <div class="container">
      <div class="section-row section-row--center">
        ${sectionTitle({ label: ctx.clock.dateLong(c.date), lead: 'The', accent: 'celebration', id: 'celebration-title', center: true })}
        <p class="section-intro section-intro--center" data-fade>
          ${events.length
            ? 'Times, venues and directions for every part of the celebration.'
            : 'Full details of the celebration will be shared here shortly.'}
        </p>
      </div>
      ${events.length ? html`<div class="event-grid">${events.map((e, i) => eventCard(ctx, e, i))}</div>` : ''}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Locations */

function locations(ctx) {
  const places = ctx.events.filter((e) => filled(e.venue?.mapQuery) || filled(e.venue?.mapUrl));
  if (!places.length) return '';
  return html`<section class="section locations" id="locations" aria-labelledby="locations-title">
    <div class="container">
      <div class="section-row section-row--center">
        ${sectionTitle({ label: 'Getting there', lead: 'Our', accent: 'locations', id: 'locations-title', center: true })}
        <p class="section-intro section-intro--center" data-fade>Open a map in Google Maps for directions to each venue.</p>
      </div>
      <div class="location-grid">
        ${places.map((e, i) => {
          const v = e.venue;
          const query = filled(v.mapQuery) ? v.mapQuery : [v.name, v.address].filter(filled).join(', ');
          const time = timeRange(ctx, e);
          return html`<article class="location" data-fade style="--d:${(i % 2) * 0.25}s">
            <div class="location__map">
              <iframe src="${mapsEmbedSrc(query)}" title="Map of ${v.name}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
            </div>
            <div class="location__body">
              <p class="tag tag--accent">${e.name}</p>
              <h3 class="location__name">${v.name}</h3>
              <ul class="location__facts">
                ${filled(v.address) ? html`<li>${icon('pin')}<span>${v.address}</span></li>` : ''}
                ${isIsoDate(e.date) ? html`<li>${icon('clock')}<span>${ctx.clock.dateMedium(e.date)}${time ? ` · ${time}` : ''}</span></li>` : ''}
              </ul>
              ${button('Open in Google Maps', directionsHref(v, query), { attrs: 'target="_blank" rel="noopener"' })}
            </div>
          </article>`;
        })}
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Dress code */

function swatch(ctx, s) {
  const color = safeColor(s.hex);
  if (!color && !(ctx.preview && isTbc(s.hex))) return '';
  return html`<li class="swatch">
    <span class="swatch__chip${color ? '' : ' swatch__chip--tbc'}"${color ? raw(` style="--c:${color}"`) : ''}></span>
    <span class="swatch__name">${t(s.name, ctx)}</span>
  </li>`;
}

function dressCode(ctx) {
  const d = ctx.content.dressCode || {};
  const themes = (d.themes || [])
    .map((th) => ({ ...th, items: (th.colours || []).map((s) => swatch(ctx, s)).filter(Boolean) }))
    .filter((th) => th.items.length);
  const notes = (d.notes || []).filter((n) => shows(n, ctx));
  const items = ctx.events.filter((e) => shows(e.dressCode?.description, ctx));
  if (!themes.length && !notes.length && !items.length && !shows(d.intro, ctx)) return '';
  return html`<section class="section attire" id="dress-code" aria-labelledby="attire-title">
    <div class="container">
      <div class="section-row section-row--center">
        ${sectionTitle({ label: 'Dress code', lead: 'Our', accent: 'colours', id: 'attire-title', center: true })}
        ${shows(d.intro, ctx) ? html`<p class="section-intro section-intro--center" data-fade>${t(d.intro, ctx)}</p>` : ''}
      </div>
      ${themes.length
        ? html`<div class="theme-grid">
            ${themes.map(
              (th) => html`<article class="theme-card" data-fade>
                <h3 class="theme-card__title">${shows(th.title, ctx) ? t(th.title, ctx) : (th.colours || []).map((s) => (filled(s.name) ? s.name : '')).filter(Boolean).join(' & ')}</h3>
                <ul class="swatches">${th.items}</ul>
              </article>`,
            )}
          </div>`
        : ''}
      ${items.length || notes.length
        ? html`<div class="attire-notes">
            ${items.map((e) => html`<div class="attire-note" data-fade><h3>${e.name}${shows(e.dressCode.title, ctx) ? html`: ${t(e.dressCode.title, ctx)}` : ''}</h3>${paras(e.dressCode.description, ctx)}</div>`)}
            ${notes.map((n) => html`<div class="attire-note" data-fade>${paras(n, ctx)}</div>`)}
          </div>`
        : ''}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Gallery */

function gallery(ctx) {
  const c = ctx.content;
  const albums = c.gallery.albums
    .map((a) => ({ ...a, images: a.images.filter((im) => ctx.images.get(im.src)) }))
    .filter((a) => a.images.length);

  // Films: one more tab gathering every film, those listed for it first, then each album's in order.
  if (c.gallery.films) {
    const seen = new Set();
    const films = [...(c.gallery.films.images || []), ...albums.flatMap((a) => a.images)].filter(
      (im) => ctx.images.get(im.src)?.video && !seen.has(im.src) && seen.add(im.src),
    );
    if (films.length) albums.push({ id: 'films', title: c.gallery.films.title || 'Films', images: films });
  }

  const head = (filters = '') => html`<div class="section-row gallery__head">
    ${sectionTitle({ label: 'Gallery', lead: 'Moments', accent: 'together', id: 'gallery-title' })}
    ${filters}
  </div>`;

  if (!albums.length) {
    if (!ctx.preview) return '';
    return html`<section class="section gallery" id="gallery" aria-labelledby="gallery-title">
      <div class="container">${head()}
        <div class="gallery__plates">
          ${plate('Engagement photographs: gallery.albums', '3 / 2')}
          ${plate('Pre-wedding shoot', '4 / 5')}
          ${plate('Add photos to /photos, run npm run photos, then list them in content/wedding.js', '3 / 2')}
        </div>
      </div>
    </section>`;
  }

  let index = 0;
  const items = albums.flatMap((a) =>
    a.images.map((im) => {
      const img = ctx.images.get(im.src);
      const webp = img.widths.map((w) => `/images/${img.name}-${w}.webp ${w}w`).join(', ');
      const i = index++;
      const full = `/images/${img.name}-${img.jpg[img.jpg.length - 1]}.jpg`;
      const largest = `/images/${img.name}-${img.widths[img.widths.length - 1]}.webp`;
      const film = img.video;
      const label = im.alt || a.title;
      return html`<li class="gallery__item${film ? ' gallery__item--film' : ''}" style="--ar:${(img.w / img.h).toFixed(4)}" data-album="${a.id}">
        <a class="gallery__open image-anime" href="${film ? film.src : largest}" data-index="${i}" data-srcset="${webp}" data-src="${full}"${film ? html` data-video="${film.src}"` : ''} data-caption="${im.caption || ''}" data-alt="${im.alt || ''}" aria-label="${film ? `Play film: ${label}` : `View photo: ${label}`}">
          ${picture(ctx, im.src, { alt: im.alt || '', sizes: '(min-width: 992px) 25vw, 50vw', reveal: false })}
          ${film ? html`<span class="gallery__film" aria-hidden="true">${icon('play')} ${Math.floor(film.duration / 60)}:${String(film.duration % 60).padStart(2, '0')}</span>` : ''}
        </a>
      </li>`;
    }),
  );

  return html`<section class="section gallery" id="gallery" aria-labelledby="gallery-title">
    <div class="container">
      ${head(
        albums.length > 1
          ? html`<div class="gallery__filters" role="group" aria-label="Albums" data-gallery-filters>
              ${albums.map((a, i) => html`<button type="button" aria-pressed="${i === 0 ? 'true' : 'false'}" data-album="${a.id}">${a.title} <span class="gallery__count">${a.images.length}</span></button>`)}
            </div>`
          : '',
      )}
      <ul class="gallery__grid" data-gallery data-fade>${items}</ul>
    </div>
    <dialog class="lightbox" data-lightbox aria-label="Photo viewer">
      <div class="lightbox__stage"><img class="lightbox__img" alt="" data-lightbox-img></div>
      <div class="lightbox__bar">
        <p class="lightbox__caption" data-lightbox-caption></p>
        <p class="lightbox__count" data-lightbox-count></p>
        <div class="lightbox__controls">
          <button type="button" data-lightbox-prev>Previous</button>
          <button type="button" data-lightbox-next>Next</button>
          <button type="button" data-lightbox-close>Close</button>
        </div>
      </div>
    </dialog>
  </section>`;
}

/* ---------------------------------------------------------------- Guest information */

function infoBlock(id, iconName, title, body, intro = '') {
  return html`<div class="info-block" id="${id}" data-fade>
    <div class="info-block__head">
      <span class="icon-box icon-box--lg">${icon(iconName)}</span>
      <div><h3 class="info-block__title">${title}</h3>${intro}</div>
    </div>
    <div class="info-block__body">${body}</div>
  </div>`;
}

function guests(ctx) {
  const c = ctx.content;
  const blocks = [];

  if (ctx.announcements.length) {
    blocks.push(
      infoBlock(
        'updates',
        'mail',
        'Latest updates',
        html`<ol class="updates">${ctx.announcements.map(
          (a) => html`<li class="updates__item"><time class="updates__date" datetime="${a.createdAt}">${ctx.clock.dayMonth(ctx.clock.day(new Date(a.createdAt)))}</time><p>${a.body}</p></li>`,
        )}</ol>`,
      ),
    );
  }

  const tr = c.travel || {};
  const hotels = (tr.hotels || []).filter((h) => shows(h.name, ctx));
  const routes = (tr.routes || []).filter((r) => shows(r.body, ctx));
  if (hotels.length || routes.length || shows(tr.intro, ctx)) {
    blocks.push(
      infoBlock(
        'travel',
        'bed',
        'Travel & stay',
        html`${hotels.length
          ? html`<ul class="hotels">${hotels.map(
              (h) => html`<li class="hotel">
                <p class="hotel__name">${t(h.name, ctx)}</p>
                ${shows(h.note, ctx) ? html`<p class="hotel__note">${t(h.note, ctx)}</p>` : ''}
                ${shows(h.address, ctx) ? html`<p>${t(h.address, ctx)}</p>` : ''}
                ${shows(h.price, ctx) ? html`<p class="hotel__price">${t(h.price, ctx)}</p>` : ''}
                <p class="hotel__links">
                  ${filled(h.phone) ? html`<a class="text-link" href="${telHref(h.phone)}">${icon('phone')} ${h.phone}</a>` : t(h.phone, ctx)}
                  ${filled(h.url) ? html`<a class="text-link" href="${h.url}" rel="noopener" target="_blank">Book ${icon('arrow')}</a>` : t(h.url, ctx)}
                </p>
              </li>`,
            )}</ul>`
          : ''}
        ${routes.length ? html`<dl class="routes">${routes.map((r) => html`<div><dt>${r.title}</dt><dd>${paras(r.body, ctx)}</dd></div>`)}</dl>` : ''}
        ${shows(tr.help, ctx) ? html`<p class="info-block__help">${t(tr.help, ctx)}</p>` : ''}`,
        shows(tr.intro, ctx) ? html`<p class="info-block__intro">${t(tr.intro, ctx)}</p>` : '',
      ),
    );
  }

  const faqs = (c.faqs || []).filter((f) => shows(f.a, ctx));
  if (faqs.length) {
    blocks.push(
      infoBlock(
        'questions',
        'chat',
        'Questions',
        html`<div class="faqs">${faqs.map(
          (f) => html`<details class="faq">
            <summary class="faq__q"><span>${f.q}</span><span class="plus" aria-hidden="true">${icon('plus')}</span></summary>
            <div class="faq__a">${paras(f.a, ctx)}</div>
          </details>`,
        )}</div>`,
      ),
    );
  }

  const contacts = (c.contacts || []).filter((p) => shows(p.name, ctx) || filled(p.phone));
  if (contacts.length || filled(c.email)) {
    blocks.push(
      infoBlock(
        'contact',
        'people',
        'Contact',
        html`<ul class="contacts">${contacts.map(
          (p) => html`<li class="contact">
            <p class="contact__role">${p.role}</p>
            <p class="contact__name">${t(p.name, ctx)}</p>
            <p class="contact__links">
              ${filled(p.phone)
                ? html`<a class="text-link" href="${telHref(p.phone)}">${icon('phone')} ${p.phone}</a>
                    ${p.whatsapp ? html`<a class="text-link" href="${whatsappHref(p.phone)}" rel="noopener" target="_blank">${icon('chat')} WhatsApp<span class="sr-only"> ${filled(p.name) ? p.name : p.role}</span></a>` : ''}`
                : t(p.phone, ctx)}
            </p>
          </li>`,
        )}</ul>
        ${filled(c.email) ? html`<p class="contacts__email"><a class="text-link" href="mailto:${c.email}">${icon('mail')} ${c.email}</a></p>` : shows(c.email, ctx) ? html`<p>${t(c.email, ctx)}</p>` : ''}`,
        html`<p class="info-block__intro">For anything at all about the day, please reach out.</p>`,
      ),
    );
  }

  if (!blocks.length) return '';
  return html`<section class="section section--mist guests" id="guests" aria-labelledby="guests-title">
    <div class="container">
      <div class="section-row section-row--center">
        ${sectionTitle({ label: 'For our guests', lead: 'Good to', accent: 'know', id: 'guests-title', center: true })}
      </div>
      <div class="info-grid">${blocks}</div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Gifts */

function gifts(ctx) {
  const g = ctx.content.gifts;
  if (!g?.enabled) return '';
  const canSee = Boolean(g.public) || Boolean(ctx.invite) || ctx.preview;
  const details = (g.details || []).filter((d) => (d.lines || []).some((l) => shows(l, ctx)));
  const hasRealDetails = (g.details || []).some((d) => (d.lines || []).some(filled)) || filled(g.registry?.url);
  const registry = filled(g.registry?.url) ? g.registry : null;
  const showDetails = canSee && (details.length || registry);
  return html`<section class="section gifts" id="gifts" aria-labelledby="gifts-title">
    <div class="container gifts__grid${showDetails ? '' : ' gifts__grid--text'}">
      <div class="gifts__text">
        ${sectionTitle({ label: 'Gifts', lead: 'With', accent: 'gratitude', id: 'gifts-title' })}
        <p class="gifts__message" data-fade>${g.message}</p>
        ${showDetails
          ? filled(g.detailsIntro) ? html`<p class="gifts__intro" data-fade>${g.detailsIntro}</p>` : ''
          : hasRealDetails
            ? html`<p class="gifts__intro" data-fade>Gift details are included with your personal invitation.</p>`
            : ''}
      </div>
      ${showDetails
        ? html`<div class="gifts__cards">
            ${details.map(
              (d, i) => html`<div class="gift-card" data-fade style="--d:${0.25 * i}s">
                <span class="icon-box">${icon('gift')}</span>
                <p class="gift-card__label">${d.label}</p>
                <p class="gift-card__lines">${d.lines.filter((l) => shows(l, ctx)).map((l, j) => html`${j ? html`<br>` : ''}${t(l, ctx)}`)}</p>
                ${d.lines.some(filled) ? html`<button class="text-link gift__copy" type="button" data-copy="${d.lines.filter(filled).join('\n')}">Copy details</button>` : ''}
              </div>`,
            )}
            ${registry ? html`<div class="gift-card" data-fade>${button(registry.label || 'Gift registry', registry.url, { attrs: 'target="_blank" rel="noopener"' })}</div>` : ''}
          </div>`
        : ''}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Closing */

function closing(ctx) {
  const c = ctx.content;
  const message = ctx.phase === 'after' && filled(c.closing.after) ? c.closing.after : c.closing.message;
  const bg = [c.closing.image, ...(c.hero.slides || []), c.hero.image].find((n) => ctx.images.get(n));
  return html`<section class="closing" aria-label="With love">
    ${bg ? html`<div class="closing__bg" data-parallax>${picture(ctx, bg, { alt: '', sizes: '100vw', reveal: false, cls: 'media--cover' })}</div>` : ''}
    <div class="container closing__inner">
      <p class="eyebrow eyebrow--light" data-fade>${icon('rings')}<span>${c.codeName || 'With love'}</span></p>
      <p class="closing__message" data-split>${message}</p>
      <p class="closing__signoff" data-fade style="--d:.25s"><span>${c.closing.signoff}</span> <strong>${coupleMark(c)}</strong></p>
      ${ctx.rsvpOpen && ctx.phase === 'before' ? html`<div data-fade style="--d:.5s">${button(ctx.invite?.response ? 'Update your reply' : 'Reply to our invitation', rsvpHref(ctx), { variant: 'light' })}</div>` : ''}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Page */

export function homePage(ctx) {
  const c = ctx.content;
  ctx.events = visibleEvents(c, ctx).filter((e) => e.access !== 'private' || ctx.preview || ctx.invite?.events.includes(e.id));

  // Guests reply by phone: every "Reply" button scrolls to the RSVP band on this page.
  ctx.rsvpHref = c.rsvp?.byPhone && !ctx.invite ? '#rsvp' : '/rsvp';

  const sections = {};
  ctx.has = {};
  sections.locations = locations(ctx);
  ctx.has.locations = Boolean(String(sections.locations));
  sections.gallery = gallery(ctx);
  ctx.has.gallery = Boolean(String(sections.gallery));
  sections.story = story(ctx);
  ctx.has.story = Boolean(String(sections.story));
  sections.notes = loveNotes(ctx);
  ctx.has.notes = Boolean(String(sections.notes));
  sections.dress = dressCode(ctx);
  ctx.has.dress = Boolean(String(sections.dress));
  sections.guests = guests(ctx);

  const links = [
    { href: '#invitation', label: 'Invitation' },
    ctx.has.story && { href: '#story', label: 'Our story' },
    ctx.has.notes && { href: '#love-notes', label: 'Love notes' },
    { href: '#celebration', label: 'Celebration' },
    ctx.has.locations && { href: '#locations', label: 'Locations' },
    ctx.has.dress && { href: '#dress-code', label: 'Dress code' },
    ctx.has.gallery && { href: '#gallery', label: 'Gallery' },
    String(sections.guests) && { href: '#guests', label: 'Guest info' },
  ].filter(Boolean);

  const names = `${c.couple.first} & ${c.couple.second}`;
  const when = ctx.clock.dateLong(c.date);
  const brand = c.codeName ? `${c.codeName} · ` : '';
  const title = `${brand}${names} · ${when}`;
  const description = `${c.tagline} The wedding of ${names}, ${when}, ${c.place}.`;
  const og = ctx.invite
    ? { title: `An invitation for ${ctx.invite.name}`, description: `${brand}The wedding of ${names}, ${when}. Open your invitation to reply.`, canonical: '/' }
    : { title: `${brand}The wedding of ${names}`, description: `${when} · ${c.place}. ${c.tagline}` };

  return page(ctx, {
    title,
    description,
    og,
    bodyClass: 'home',
    scripts: ['/js/site.js'],
    body: html`${siteHeader(ctx, links)}
<main id="main">
${hero(ctx)}
${ticker(ctx)}
${invitation(ctx)}
${ctx.rsvpOpen && ctx.phase !== 'after' ? rsvpBand(ctx) : ''}
${sections.story}
${sections.notes}
${celebration(ctx)}
${sections.locations}
${sections.dress}
${sections.gallery}
${sections.guests}
${gifts(ctx)}
${closing(ctx)}
</main>
${siteFooter(ctx, [...links, ...(ctx.rsvpOpen ? [{ href: rsvpHref(ctx), label: 'RSVP' }] : [])])}`,
  });
}
