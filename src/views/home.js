import { html, raw } from '../html.js';
import { filled, isTbc } from '../tbc.js';
import { isIsoDate, isTime } from '../format.js';
import { visibleEvents, countdownTarget } from '../rsvp.js';
import { calendarReady } from '../ics.js';
import { page, siteHeader, siteFooter, coupleMark } from './layout.js';
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
  ROMAN,
} from './parts.js';

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
    <p class="countdown__caption">Until the day</p>
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

function hero(ctx) {
  const c = ctx.content;
  const image = picture(ctx, c.hero.image, {
    alt: c.hero.alt,
    ratio: '4 / 5',
    eager: true,
    sizes: '(min-width: 900px) 40vw, 100vw',
    reveal: false,
  });
  const reply = ctx.invite?.response ? 'Update your reply' : 'Reply to our invitation';
  const latest = ctx.announcements[0];

  let moment;
  if (ctx.phase === 'before') {
    moment = html`${countdown(ctx)}
      <div class="hero__actions">
        ${ctx.rsvpOpen ? html`<a class="button" href="/rsvp">${reply}</a>` : ''}
        ${ctx.has.story ? html`<a class="link" href="#story">Read our story</a>` : html`<a class="link" href="#celebration">The celebration</a>`}
      </div>`;
  } else if (ctx.phase === 'today') {
    moment = html`<p class="hero__moment">Today is the day. We can’t wait to see you.</p>
      <div class="hero__actions"><a class="button" href="#celebration">Today’s celebration</a></div>`;
  } else {
    moment = html`<p class="hero__moment">Married on ${ctx.clock.dateLong(c.date)}.</p>
      ${ctx.has.gallery ? html`<div class="hero__actions"><a class="button" href="#gallery">View the gallery</a></div>` : ''}`;
  }

  return html`<section class="hero ${image ? 'hero--image' : 'hero--type'}" aria-labelledby="hero-title">
    <div class="hero__grid">
      ${latest
        ? html`<a class="hero__notice" href="#updates"><span class="hero__notice-label">Update</span> ${latest.body}</a>`
        : ''}
      <div class="hero__head">
        ${ctx.invite
          ? html`<p class="hero__for" data-intro>An invitation for <span>${ctx.invite.name}</span></p>`
          : html`<p class="hero__eyebrow" data-intro>The wedding of</p>`}
        <h1 class="hero__names" id="hero-title" data-intro style="--d:1">
          <span class="hero__line">${c.couple.first}</span>
          <span class="hero__line hero__line--second"><span class="amp">&amp;</span>&#8202;${c.couple.second}</span>
        </h1>
      </div>
      <p class="hero__when" data-intro style="--d:2">
        <time datetime="${c.date}">${ctx.clock.dateLong(c.date)}</time>
        <span class="hero__place">${c.place}</span>
      </p>
      ${image
        ? html`<figure class="hero__figure" data-intro style="--d:2">
            <div class="hero__frame" data-parallax>${image}</div>
            ${filled(c.hero.credit) ? html`<figcaption class="caption">${c.hero.credit}</figcaption>` : ''}
          </figure>`
        : ''}
      <div class="hero__details" data-intro style="--d:3">
        <p class="hero__tagline">${c.tagline}</p>
        ${moment}
      </div>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Invitation */

function invitation(ctx) {
  const c = ctx.content;
  const families = (c.invitation.families || []).filter((f) => shows(f, ctx));
  return html`<section class="invite" aria-label="Our invitation">
    <div class="invite__inner">
      <p class="invite__statement" data-reveal>${c.invitation.statement}</p>
      ${families.length
        ? html`<p class="invite__families" data-reveal style="--d:1">
            ${families.map((f, i) => html`${i ? html`<span class="invite__and">and</span>` : ''}<span class="invite__family">${t(f, ctx)}</span>`)}
          </p>`
        : ''}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Story */

function story(ctx) {
  const c = ctx.content;
  const chapters = c.story.chapters.filter((ch) => shows(ch.body, ctx));
  if (!chapters.length) return '';
  return html`<section class="section story" id="story" aria-labelledby="story-title">
    <div class="story__grid">
      <header class="story__head">
        <p class="label" data-reveal>Our story</p>
        <h2 class="section-title" id="story-title" data-reveal style="--d:1">A few chapters, so far</h2>
        ${shows(c.story.intro, ctx) ? html`<p class="lead" data-reveal style="--d:2">${t(c.story.intro, ctx)}</p>` : ''}
      </header>
      <ol class="chapters">
        ${chapters.map((ch, i) => {
          const wide = ch.layout === 'wide';
          const img = shows(ch.image, ctx)
            ? picture(ctx, ch.image, {
                alt: ch.alt || ch.title,
                ratio: wide ? '3 / 2' : '4 / 5',
                sizes: wide ? '(min-width: 900px) 60vw, 100vw' : '(min-width: 900px) 24vw, 100vw',
              })
            : '';
          return html`<li class="chapter chapter--${wide ? 'wide' : 'side'}${img ? '' : ' chapter--text'}">
            <p class="chapter__marker" data-reveal>
              <span class="chapter__numeral">${ROMAN[i] || i + 1}.</span>
              ${shows(ch.when, ctx) ? html`<span class="chapter__when">${t(ch.when, ctx)}</span>` : ''}
            </p>
            <div class="chapter__text" data-reveal style="--d:1">
              <h3 class="chapter__title">${ch.title}</h3>
              ${paras(ch.body, ctx, 'chapter__body')}
            </div>
            ${img ? html`<figure class="chapter__figure">${img}${filled(ch.caption) ? html`<figcaption class="caption">${ch.caption}</figcaption>` : ''}</figure>` : ''}
          </li>`;
        })}
      </ol>
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Celebration */

function timeRange(ctx, e) {
  if (!isTime(e.start)) return '';
  return isTime(e.end) && e.end > e.start
    ? `${ctx.clock.time(e.start)} – ${ctx.clock.time(e.end)}`
    : ctx.clock.time(e.start);
}

function accessNote(ctx, e) {
  const invited = ctx.invite?.events.includes(e.id);
  if (e.access === 'open') return html`<p class="event__access">Open to all our guests</p>`;
  if (invited) return html`<p class="event__access event__access--yours">Included in your invitation</p>`;
  return html`<p class="event__access event__access--restricted">By invitation</p>`;
}

function eventBlock(ctx, e) {
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
  const venueImage = shows(v.image, ctx)
    ? picture(ctx, v.image, { alt: filled(v.name) ? v.name : e.name, ratio: '3 / 2', sizes: '(min-width: 900px) 30vw, 100vw' })
    : '';
  const hasMore = extras.length || query || venueImage;

  return html`<article class="event" id="event-${e.id}" data-reveal>
    <header class="event__head">
      <h3 class="event__name">${e.name}</h3>
      ${accessNote(ctx, e)}
      ${e.status === 'draft' ? html`<p class="draft-flag">Draft: hidden from guests until confirmed</p>` : ''}
    </header>
    <dl class="event__facts">
      <div class="event__fact">
        <dt>When</dt>
        <dd>
          ${isIsoDate(e.date) ? ctx.clock.dateMedium(e.date) : t(e.date, ctx)}
          ${time ? html`<span class="event__time">${time}</span>` : shows(e.start, ctx) ? html`<span class="event__time">${t(e.start, ctx)}</span>` : html`<span class="event__time event__time--tbc">Time to follow</span>`}
        </dd>
      </div>
      <div class="event__fact">
        <dt>Where</dt>
        <dd>
          ${shows(v.name, ctx) ? html`<span class="event__venue">${t(v.name, ctx)}</span>` : html`<span class="event__venue event__time--tbc">Venue to follow</span>`}
          ${shows(v.address, ctx) ? html`<span class="event__address">${t(v.address, ctx)}</span>` : ''}
        </dd>
      </div>
      ${shows(dress.title, ctx) || shows(dress.description, ctx)
        ? html`<div class="event__fact">
            <dt>Dress code</dt>
            <dd>
              ${shows(dress.title, ctx) ? html`<span class="event__dress">${t(dress.title, ctx)}</span>` : ''}
              ${ctx.has.dress ? html`<a class="event__aside" href="#dress-code">Colours &amp; guidance</a>` : ''}
            </dd>
          </div>`
        : ''}
    </dl>
    <div class="event__actions">
      ${query ? html`<a class="link" href="${mapsDirectionsHref(query)}" rel="noopener" target="_blank">Directions<span class="sr-only"> to ${e.name} (opens Google Maps)</span></a>` : ''}
      ${calendarReady(e) ? html`<a class="link" href="/calendar/${e.id}.ics">Add to calendar</a>` : ''}
    </div>
    ${hasMore
      ? html`<details class="event__more" data-event-more>
          <summary><span>Venue, map &amp; arrival</span></summary>
          <div class="event__more-grid">
            ${query
              ? html`<div class="event__map" data-map="${mapsEmbedSrc(query)}" data-map-title="Map of ${filled(v.name) ? v.name : e.name}">
                  <a class="event__map-fallback" href="${mapsDirectionsHref(query)}" rel="noopener" target="_blank">Open the map in Google Maps</a>
                </div>`
              : ''}
            <div class="event__notes">
              ${venueImage}
              ${extras.length
                ? html`<dl>${extras.map(([label, val]) => html`<div><dt>${label}</dt><dd>${paras(val, ctx)}</dd></div>`)}</dl>`
                : ''}
            </div>
          </div>
        </details>`
      : ''}
  </article>`;
}

/** "Saturday 28 November", or a span such as "27 – 28 November" when events fall on several days. */
function celebrationDates(ctx, events) {
  const dates = [...new Set(events.map((e) => e.date).filter(isIsoDate))].sort();
  if (dates.length < 2) return ctx.clock.dateMedium(dates[0] || ctx.content.date);
  const first = dates[0];
  const last = dates[dates.length - 1];
  return first.slice(0, 7) === last.slice(0, 7)
    ? `${Number(first.slice(8))} – ${ctx.clock.dayMonth(last)}`
    : `${ctx.clock.dayMonth(first)} – ${ctx.clock.dayMonth(last)}`;
}

function celebration(ctx) {
  const c = ctx.content;
  const events = ctx.events;
  return html`<section class="section section--oat celebration" id="celebration" aria-labelledby="celebration-title">
    <div class="celebration__inner">
      <header class="celebration__head">
        <p class="label" data-reveal>The celebration</p>
        <h2 class="section-title" id="celebration-title" data-reveal style="--d:1">${celebrationDates(ctx, events)}</h2>
        <p class="lead celebration__lead" data-reveal style="--d:2">
          ${events.length
            ? events.length === 1
              ? 'The time, the place and how to get there.'
              : 'Times, venues and directions for every part of the celebration.'
            : 'Full details of the celebration will be shared here shortly.'}
        </p>
      </header>
      ${events.length ? html`<div class="events">${events.map((e) => eventBlock(ctx, e))}</div>` : ''}
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
  const c = ctx.content;
  const d = c.dressCode || {};
  const palette = (d.palette || []).map((s) => swatch(ctx, s)).filter(Boolean);
  const notes = (d.notes || []).filter((n) => shows(n, ctx));
  const items = ctx.events.filter((e) => shows(e.dressCode?.title, ctx) || shows(e.dressCode?.description, ctx));
  if (!palette.length && !notes.length && !items.length && !shows(d.intro, ctx)) return '';
  return html`<section class="section attire" id="dress-code" aria-labelledby="attire-title">
    <div class="attire__inner">
      <header class="attire__head">
        <p class="label" data-reveal>Dress code</p>
        <h2 class="section-title" id="attire-title" data-reveal style="--d:1">What to wear</h2>
        ${shows(d.intro, ctx) ? html`<p class="lead" data-reveal style="--d:2">${t(d.intro, ctx)}</p>` : ''}
      </header>
      ${palette.length
        ? html`<div class="attire__palette" data-reveal>
            <p class="label">Our colours</p>
            <ul class="swatches swatches--large">${palette}</ul>
          </div>`
        : ''}
      ${items.length
        ? html`<div class="attire__list">
            ${items.map((e, i) => {
              const dc = e.dressCode;
              const sw = (dc.colours || []).map((s) => swatch(ctx, s)).filter(Boolean);
              return html`<article class="attire__item" data-reveal style="--d:${i}">
                <p class="label">${e.name}</p>
                ${shows(dc.title, ctx) ? html`<h3 class="attire__title">${t(dc.title, ctx)}</h3>` : ''}
                ${paras(dc.description, ctx, 'attire__desc')}
                ${sw.length ? html`<ul class="swatches">${sw}</ul>` : ''}
              </article>`;
            })}
          </div>`
        : ''}
      ${notes.length
        ? html`<div class="attire__notes" data-reveal>${notes.map((n) => paras(n, ctx, 'attire__note'))}</div>`
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

  if (!albums.length) {
    if (!ctx.preview) return '';
    return html`<section class="section gallery" id="gallery" aria-labelledby="gallery-title">
      <div class="gallery__inner">
        <header class="gallery__head">
          <div>
            <p class="label">Gallery</p>
            <h2 class="section-title" id="gallery-title">Moments together</h2>
          </div>
        </header>
        <div class="gallery__plates">
          ${plate('Engagement photographs: gallery.albums', '3 / 2')}
          ${plate('Pre-wedding shoot', '4 / 5')}
          ${plate('Favourite moments', '4 / 5')}
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
      return html`<li class="gallery__item" style="--ar:${(img.w / img.h).toFixed(4)}" data-album="${a.id}">
        <button class="gallery__open" type="button" data-index="${i}" data-srcset="${webp}" data-src="/images/${img.name}-${img.widths[img.widths.length - 1]}.jpg" data-caption="${im.caption || ''}" data-alt="${im.alt || ''}" aria-label="View photo: ${im.alt || a.title}">
          ${picture(ctx, im.src, { alt: im.alt || '', sizes: '(min-width: 900px) 33vw, 50vw', reveal: false })}
        </button>
      </li>`;
    }),
  );

  return html`<section class="section gallery" id="gallery" aria-labelledby="gallery-title">
    <div class="gallery__inner">
      <header class="gallery__head">
        <div>
          <p class="label" data-reveal>Gallery</p>
          <h2 class="section-title" id="gallery-title" data-reveal style="--d:1">Moments together</h2>
        </div>
        ${albums.length > 1
          ? html`<div class="gallery__filters" role="group" aria-label="Albums" data-gallery-filters>
              <button type="button" aria-pressed="true" data-album="all">All</button>
              ${albums.map((a) => html`<button type="button" aria-pressed="false" data-album="${a.id}">${a.title}</button>`)}
            </div>`
          : ''}
      </header>
      <ul class="gallery__grid" data-gallery data-reveal>${items}</ul>
    </div>
    <dialog class="lightbox" data-lightbox aria-label="Photo viewer">
      <div class="lightbox__stage">
        <img class="lightbox__img" alt="" data-lightbox-img>
      </div>
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

function guestBlock(id, title, intro, body) {
  return html`<div class="guests__block" id="${id}">
    <div class="guests__block-head" data-reveal>
      <h3 class="guests__title">${title}</h3>
      ${intro || ''}
    </div>
    <div class="guests__block-body" data-reveal style="--d:1">${body}</div>
  </div>`;
}

function guests(ctx) {
  const c = ctx.content;
  const blocks = [];

  if (ctx.announcements.length) {
    blocks.push(
      guestBlock(
        'updates',
        'Latest updates',
        '',
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
      guestBlock(
        'travel',
        'Travel & stay',
        shows(tr.intro, ctx) ? html`<p class="guests__intro">${t(tr.intro, ctx)}</p>` : '',
        html`${hotels.length
          ? html`<ul class="hotels">${hotels.map(
              (h) => html`<li class="hotel">
                <div class="hotel__main">
                  <p class="hotel__name">${t(h.name, ctx)}</p>
                  ${shows(h.note, ctx) ? html`<p class="hotel__note">${t(h.note, ctx)}</p>` : ''}
                </div>
                <div class="hotel__meta">
                  ${shows(h.address, ctx) ? html`<p>${t(h.address, ctx)}</p>` : ''}
                  ${shows(h.price, ctx) ? html`<p class="hotel__price">${t(h.price, ctx)}</p>` : ''}
                </div>
                <div class="hotel__links">
                  ${filled(h.phone) ? html`<a class="link" href="${telHref(h.phone)}">${h.phone}</a>` : shows(h.phone, ctx) ? html`<p>${t(h.phone, ctx)}</p>` : ''}
                  ${filled(h.url) ? html`<a class="link" href="${h.url}" rel="noopener" target="_blank">Book</a>` : shows(h.url, ctx) ? html`<p>${t(h.url, ctx)}</p>` : ''}
                </div>
              </li>`,
            )}</ul>`
          : ''}
        ${routes.length
          ? html`<dl class="routes">${routes.map((r) => html`<div class="routes__item"><dt>${r.title}</dt><dd>${paras(r.body, ctx)}</dd></div>`)}</dl>`
          : ''}
        ${shows(tr.help, ctx) ? html`<p class="guests__help">${t(tr.help, ctx)}</p>` : ''}`,
      ),
    );
  }

  const faqs = (c.faqs || []).filter((f) => shows(f.a, ctx));
  if (faqs.length) {
    blocks.push(
      guestBlock(
        'questions',
        'Questions',
        '',
        html`<div class="faqs">${faqs.map(
          (f) => html`<details class="faq">
            <summary class="faq__q"><span>${f.q}</span></summary>
            <div class="faq__a">${paras(f.a, ctx)}</div>
          </details>`,
        )}</div>`,
      ),
    );
  }

  const contacts = (c.contacts || []).filter((p) => shows(p.name, ctx) || filled(p.phone));
  if (contacts.length || filled(c.email)) {
    blocks.push(
      guestBlock(
        'contact',
        'Contact',
        html`<p class="guests__intro">For anything at all about the day, please reach out.</p>`,
        html`<ul class="contacts">${contacts.map(
          (p) => html`<li class="contact">
            <p class="contact__role">${p.role}</p>
            <p class="contact__name">${t(p.name, ctx)}</p>
            <p class="contact__links">
              ${filled(p.phone)
                ? html`<a class="link" href="${telHref(p.phone)}">${p.phone}</a>
                    ${p.whatsapp ? html`<a class="link" href="${whatsappHref(p.phone)}" rel="noopener" target="_blank">WhatsApp<span class="sr-only"> ${filled(p.name) ? p.name : p.role}</span></a>` : ''}`
                : t(p.phone, ctx)}
            </p>
          </li>`,
        )}</ul>
        ${filled(c.email) ? html`<p class="contacts__email">Or write to us at <a class="link" href="mailto:${c.email}">${c.email}</a></p>` : shows(c.email, ctx) ? html`<p class="contacts__email">${t(c.email, ctx)}</p>` : ''}`,
      ),
    );
  }

  if (!blocks.length) return '';
  return html`<section class="section guests" id="guests" aria-labelledby="guests-title">
    <div class="guests__inner">
      <header class="guests__head">
        <p class="label" data-reveal>For our guests</p>
        <h2 class="section-title" id="guests-title" data-reveal style="--d:1">Good to know</h2>
      </header>
      ${blocks}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Gifts */

function gifts(ctx) {
  const g = ctx.content.gifts;
  if (!g?.enabled) return '';
  const canSee = Boolean(ctx.invite) || ctx.preview;
  const details = (g.details || []).filter((d) => (d.lines || []).some((l) => shows(l, ctx)));
  const hasRealDetails = (g.details || []).some((d) => (d.lines || []).some(filled)) || filled(g.registry?.url);
  const registry = filled(g.registry?.url) ? g.registry : null;

  return html`<section class="section section--oat gifts" id="gifts" aria-labelledby="gifts-title">
    <div class="gifts__inner">
      <p class="label" data-reveal id="gifts-title">Gifts</p>
      <p class="gifts__message" data-reveal style="--d:1">${g.message}</p>
      ${canSee && (details.length || registry)
        ? html`<div class="gifts__details" data-reveal style="--d:2">
            ${filled(g.detailsIntro) ? html`<p class="gifts__intro">${g.detailsIntro}</p>` : ''}
            ${details.map(
              (d) => html`<div class="gift">
                <p class="label">${d.label}</p>
                <p class="gift__lines">${d.lines.filter((l) => shows(l, ctx)).map((l, i) => html`${i ? html`<br>` : ''}${t(l, ctx)}`)}</p>
                ${d.lines.some(filled) ? html`<button class="link gift__copy" type="button" data-copy="${d.lines.filter(filled).join('\n')}">Copy details</button>` : ''}
              </div>`,
            )}
            ${registry ? html`<p class="gift"><a class="link" href="${registry.url}" rel="noopener" target="_blank">${registry.label || 'Gift registry'}</a></p>` : ''}
          </div>`
        : hasRealDetails
          ? html`<p class="gifts__intro" data-reveal style="--d:2">Gift details are included with your personal invitation.</p>`
          : ''}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Closing */

function closing(ctx) {
  const c = ctx.content;
  const message = ctx.phase === 'after' && filled(c.closing.after) ? c.closing.after : c.closing.message;
  return html`<section class="closing" aria-label="With love">
    <div class="closing__inner">
      <p class="closing__message" data-reveal>${message}</p>
      <p class="closing__signoff" data-reveal style="--d:1">
        <span class="closing__with">${c.closing.signoff}</span>
        <span class="closing__names">${coupleMark(c)}</span>
      </p>
      ${ctx.rsvpOpen && ctx.phase === 'before'
        ? html`<a class="button button--light" href="/rsvp" data-reveal style="--d:2">${ctx.invite?.response ? 'Update your reply' : 'Reply to our invitation'}</a>`
        : ''}
    </div>
  </section>`;
}

/* ---------------------------------------------------------------- Page */

export function homePage(ctx) {
  const c = ctx.content;
  ctx.events = visibleEvents(c, ctx).filter(
    (e) => e.access !== 'private' || ctx.preview || ctx.invite?.events.includes(e.id),
  );

  const sections = {};
  ctx.has = {};
  // Render dependent sections first so links between them only point at sections that exist.
  sections.gallery = gallery(ctx);
  ctx.has.gallery = Boolean(String(sections.gallery));
  sections.story = story(ctx);
  ctx.has.story = Boolean(String(sections.story));
  sections.dress = dressCode(ctx);
  ctx.has.dress = Boolean(String(sections.dress));
  sections.guests = guests(ctx);

  const links = [
    ctx.has.story && { href: '#story', label: 'Our story' },
    { href: '#celebration', label: 'Celebration' },
    ctx.has.dress && { href: '#dress-code', label: 'Dress code' },
    ctx.has.gallery && { href: '#gallery', label: 'Gallery' },
    String(sections.guests) && { href: '#guests', label: 'Guest information' },
  ].filter(Boolean);

  const names = `${c.couple.first} & ${c.couple.second}`;
  const when = ctx.clock.dateLong(c.date);
  const title = `${names} · ${when}`;
  const description = `${c.tagline} The wedding of ${names}, ${when}, ${c.place}.`;
  const og = ctx.invite
    ? { title: `An invitation for ${ctx.invite.name}`, description: `The wedding of ${names}, ${when}. Open your invitation to reply.`, canonical: '/' }
    : { title: `The wedding of ${names}`, description: `${when} · ${c.place}. ${c.tagline}` };

  return page(ctx, {
    title,
    description,
    og,
    bodyClass: 'home',
    scripts: ['/js/site.js'],
    body: html`${siteHeader(ctx, links)}
<main id="main">
${hero(ctx)}
${invitation(ctx)}
${sections.story}
${celebration(ctx)}
${sections.dress}
${sections.gallery}
${sections.guests}
${gifts(ctx)}
${closing(ctx)}
</main>
${siteFooter(ctx, [...links, ...(ctx.rsvpOpen ? [{ href: '/rsvp', label: 'RSVP' }] : [])])}`,
  });
}
