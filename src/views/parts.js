import { html, raw } from '../html.js';
import { filled, isTbc } from '../tbc.js';

/**
 * Confirmed content as text. In preview, a placeholder is shown marked "TBC";
 * for guests it renders nothing.
 */
export function t(v, ctx) {
  if (filled(v)) return v;
  if (ctx.preview && isTbc(v)) return html`<span class="tbc">${v.hint}</span>`;
  return '';
}

/** Whether a value should appear at all for this visitor. */
export const shows = (v, ctx) => filled(v) || (ctx.preview && isTbc(v));

/** Text split into paragraphs on blank lines; single line breaks are kept. */
export function paras(v, ctx, cls = '') {
  if (!filled(v)) return ctx.preview && isTbc(v) ? html`<p class="${cls}">${t(v, ctx)}</p>` : '';
  return String(v)
    .split(/\n\s*\n/)
    .map((p) =>
      html`<p class="${cls}">${p
        .trim()
        .split('\n')
        .map((l, i) => (i ? html`<br>${l}` : l))}</p>`,
    );
}

/** A labelled stand-in for a photograph that hasn't arrived yet (preview only). */
export function plate(hint, ratio = '4 / 5', cls = '') {
  return html`<div class="plate ${cls}" style="--ar:${ratio}" role="img" aria-label="Photo placeholder: ${hint}">
    <span class="plate__label">Photograph</span>
    <span class="plate__hint">${hint}</span>
  </div>`;
}

const SAFE_COLOR = /^#[0-9a-f]{3,8}$/i;
export const safeColor = (c) => (typeof c === 'string' && SAFE_COLOR.test(c) ? c : null);

/**
 * A responsive photograph prepared by `npm run photos`.
 * ratio crops the frame (e.g. '4 / 5'); without it the photo keeps its own proportions.
 */
export function picture(ctx, name, { alt = '', sizes = '100vw', ratio = null, eager = false, cls = '', reveal = true } = {}) {
  const img = ctx.images.get(name);
  if (!img) {
    if (!ctx.preview) return '';
    if (isTbc(name)) return plate(name.hint, ratio || '4 / 5', cls);
    if (filled(name)) return plate(`“${name}” hasn’t been prepared yet: add it to /photos and run npm run photos`, ratio || '4 / 5', cls);
    return '';
  }
  const srcset = (ext) => (ext === 'jpg' ? img.jpg : img.widths).map((w) => `/images/${img.name}-${w}.${ext} ${w}w`).join(', ');
  const fallback = img.jpg.find((w) => w >= 1024) || img.jpg[img.jpg.length - 1];
  const tone = safeColor(img.color) || '#e2d8c8';
  return html`<div class="media ${cls}${ratio ? ' media--crop' : ''}" style="--ar:${ratio || `${img.w} / ${img.h}`};--tone:${tone}"${reveal ? raw(' data-reveal') : ''}>
    <picture>
      <source type="image/webp" srcset="${srcset('webp')}" sizes="${sizes}">
      <img src="/images/${img.name}-${fallback}.jpg" srcset="${srcset('jpg')}" sizes="${sizes}" width="${img.w}" height="${img.h}" alt="${alt}"${eager ? raw(' fetchpriority="high"') : raw(' loading="lazy"')} decoding="async">
    </picture>
  </div>`;
}

/** Digits for wa.me and tel: links. Nigerian local numbers (0803…) become +234 803…. */
export function phoneDigits(phone) {
  let d = String(phone || '').replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (/^0\d{10}$/.test(d)) d = `234${d.slice(1)}`;
  return d.replace(/\D/g, '');
}
export const telHref = (phone) => `tel:+${phoneDigits(phone)}`;
export const whatsappHref = (phone, text = '') =>
  `https://wa.me/${phone ? phoneDigits(phone) : ''}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mapsSearchHref = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const mapsDirectionsHref = (q) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
export const mapsEmbedSrc = (q) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];

/* ---------- Icons: one line-drawn set, 24px grid, drawn in currentColor ---------- */

const ICONS = {
  arrow: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  phone: '<path d="M5.2 4h3.3l1.6 4.2-2.1 1.4a11 11 0 0 0 6.4 6.4l1.4-2.1 4.2 1.6v3.3a1.6 1.6 0 0 1-1.7 1.6A16.4 16.4 0 0 1 3.6 5.7 1.6 1.6 0 0 1 5.2 4z"/>',
  chat: '<path d="M4.5 19.5l1.3-3.7a8 8 0 1 1 2.9 2.8z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01"/>',
  rings: '<circle cx="9" cy="14" r="5.5"/><circle cx="15" cy="14" r="5.5"/><path d="M10.5 3.5h3L12 6z"/>',
  dress: '<path d="M12 7.2a2 2 0 1 1 2-2"/><path d="M12 7.2v1.3l-8 6.4A1.6 1.6 0 0 0 5 17.8h14a1.6 1.6 0 0 0 1-2.9l-8-6.4"/>',
  gift: '<rect x="4" y="9.5" width="16" height="10.5" rx="1.5"/><path d="M3 9.5h18M12 9.5V20M12 9.5S10.3 5 8 5.5s-.8 4 4 4c4.8 0 6.3-3.5 4-4S12 9.5 12 9.5"/>',
  bed: '<path d="M3 18.5V6.5M3 13.5h18v5M21 18.5V15a3 3 0 0 0-3-3h-7v1.5"/><circle cx="7" cy="10.5" r="1.8"/>',
  people: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.2 14.3A4.6 4.6 0 0 1 20.5 19"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
};

export const icon = (name, cls = '') =>
  raw(`<svg class="icon ${cls}" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`);

/** A pill button with the arrow disc, in the reference's style. */
export function button(label, href, { variant = '', attrs = '' } = {}) {
  return html`<a class="btn${variant ? ` btn--${variant}` : ''}" href="${href}"${attrs ? raw(` ${attrs}`) : ''}><span class="btn__label">${label}</span><span class="btn__disc" aria-hidden="true">${icon('arrow')}</span></a>`;
}

/** A hand-drawn arrow, as on the reference's call-to-action bands. */
export const scribbleArrow = () =>
  raw('<svg class="scribble" viewBox="0 0 120 44" width="120" height="44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 30c16-12 30-15 40-8 9 6 5 15-3 12-9-4-3-19 18-21 15-1 30 7 49 18"/><path d="M98 21l10 10-14 2"/></svg>');

/** Where "Directions" leads: the venue's own Google Maps link when given, otherwise a search. */
export const directionsHref = (venue, query) => (filled(venue?.mapUrl) ? venue.mapUrl : mapsDirectionsHref(query));

/**
 * The people guests RSVP to, with a call button and a WhatsApp button that opens a
 * pre-written message. Used on the home page and the RSVP page.
 */
export function rsvpPeople(ctx, { cls = '' } = {}) {
  const r = ctx.content.rsvp || {};
  const people = (r.contacts || []).filter((p) => filled(p.phone));
  if (!people.length) return '';
  const message = (p) => String(r.whatsappMessage || '').replaceAll('{name}', p.name || '');
  return html`<ul class="rsvp-people ${cls}">
    ${people.map(
      (p) => html`<li class="rsvp-person">
        <span class="rsvp-person__name">${p.name}</span>
        <a class="rsvp-person__phone" href="${telHref(p.phone)}">${p.phone}</a>
        <span class="rsvp-person__actions">
          <a class="pill" href="${telHref(p.phone)}">${icon('phone')}<span>Call</span></a>
          <a class="pill pill--wa" href="${whatsappHref(p.phone, message(p))}" target="_blank" rel="noopener">${icon('chat')}<span>WhatsApp</span></a>
        </span>
      </li>`,
    )}
  </ul>`;
}
