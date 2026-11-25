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
  const srcset = (ext) => img.widths.map((w) => `/images/${img.name}-${w}.${ext} ${w}w`).join(', ');
  const fallback = img.widths.find((w) => w >= 1024) || img.widths[img.widths.length - 1];
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
