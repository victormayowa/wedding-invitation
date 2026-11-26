import { html, raw } from '../html.js';
import { HEAD_SCRIPT } from '../security.js';
import { filled } from '../tbc.js';
import { button, icon, telHref, whatsappHref } from './parts.js';

const FONTS = ['/fonts/fira-sans-condensed-latin-400.woff2', '/fonts/fira-sans-condensed-latin-700.woff2'];

/** Couple's names with the ampersand in the accent colour. */
export const coupleMark = (c) => html`${c.couple.first} <span class="amp">&amp;</span> ${c.couple.second}`;

/** The NEW WINE'26 wordmark. */
export const wordmark = (c, cls = '') => html`<a class="brand ${cls}" href="/" aria-label="${c.codeName || ''} · ${c.couple.first} and ${c.couple.second}, home">
  <span class="brand__mark">${c.codeName || `${c.couple.first} & ${c.couple.second}`}</span>
  ${c.codeName ? html`<span class="brand__sub">${coupleMark(c)}</span>` : ''}
</a>`;

function previewBar(ctx) {
  if (!ctx.admin) return '';
  const back = encodeURIComponent(ctx.path || '/');
  return html`<aside class="preview-bar" aria-label="Admin preview">
    ${ctx.preview
      ? html`<p><strong>Preview</strong> Placeholders and draft events are shown to you only, marked <span class="tbc tbc--inline">TBC</span>.</p>
          <a href="/admin/preview?show=0&amp;back=${back}">View as a guest</a>`
      : html`<p><strong>Guest view</strong> This is exactly what guests see.</p>
          <a href="/admin/preview?show=1&amp;back=${back}">Show placeholders</a>`}
    <a href="/admin/content">Checklist</a>
    <a href="/admin">Admin</a>
  </aside>`;
}

/**
 * The header: transparent over the opening photograph, then a solid bar that
 * slides in once the visitor has scrolled past it. `solid` starts it solid.
 */
export function siteHeader(ctx, links = [], { solid = false } = {}) {
  const c = ctx.content;
  const rsvpLabel = ctx.invite?.response ? 'Your reply' : 'RSVP';
  return html`<header class="header${solid ? ' header--solid' : ''}" data-header>
    <div class="header__bar" data-header-bar>
      <div class="container header__inner">
        ${wordmark(c)}
        ${links.length
          ? html`<nav class="header__nav" aria-label="Sections">
              <ul>${links.map((l) => html`<li><a href="${l.href}">${l.label}</a></li>`)}</ul>
            </nav>`
          : ''}
        <div class="header__end">
          ${ctx.rsvpOpen ? button(rsvpLabel, '/rsvp', { variant: 'sm' }) : ''}
          ${links.length
            ? html`<a class="burger" href="#footer-nav" role="button" aria-expanded="false" aria-controls="menu" data-menu-toggle>
                <span class="burger__line"></span><span class="burger__line"></span><span class="burger__line"></span>
                <span class="sr-only" data-menu-label>Menu</span>
              </a>`
            : html`<a class="header__back" href="/">Back to the invitation</a>`}
        </div>
      </div>
      ${links.length
        ? html`<nav class="mobile-menu" id="menu" aria-label="Menu" data-menu hidden>
            <ul class="container">
              ${links.map((l) => html`<li><a href="${l.href}" data-menu-link>${l.label}</a></li>`)}
              ${ctx.rsvpOpen ? html`<li><a href="/rsvp" data-menu-link>${rsvpLabel}</a></li>` : ''}
            </ul>
          </nav>`
        : ''}
    </div>
  </header>`;
}

export function siteFooter(ctx, links = []) {
  const c = ctx.content;
  const [y, m, d] = c.date.split('-');
  const contacts = (c.contacts || []).filter((p) => filled(p.phone));
  return html`<footer class="footer">
    <div class="container footer__grid">
      <div class="footer__about">
        ${wordmark(c, 'brand--footer')}
        <p>${c.tagline}</p>
        <p class="footer__when">${ctx.clock.dateLong(c.date)}<br>${c.place}</p>
      </div>
      ${links.length
        ? html`<nav class="footer__links" id="footer-nav" aria-label="Footer">
            <h2 class="footer__title">Quick links</h2>
            <ul>${links.map((l) => html`<li><a href="${l.href}">${l.label}</a></li>`)}</ul>
          </nav>`
        : ''}
      <div class="footer__contact">
        <h2 class="footer__title">Contact</h2>
        ${contacts.length
          ? html`<ul>${contacts.map(
              (p) => html`<li>
                <span class="footer__icon">${icon('phone')}</span>
                <span><span class="footer__role">${p.role}</span><a href="${telHref(p.phone)}">${p.phone}</a>${p.whatsapp ? html` · <a href="${whatsappHref(p.phone)}" rel="noopener" target="_blank">WhatsApp</a>` : ''}</span>
              </li>`,
            )}</ul>`
          : html`<p>Contact details will be shared here shortly.</p>`}
        ${filled(c.email) ? html`<p><span class="footer__icon">${icon('mail')}</span><a href="mailto:${c.email}">${c.email}</a></p>` : ''}
        ${ctx.rsvpOpen ? button('Reply to our invitation', '/rsvp') : ''}
      </div>
    </div>
    <div class="container footer__bottom">
      <p>© ${y} ${c.couple.first} &amp; ${c.couple.second}${c.codeName ? ` · ${c.codeName}` : ''}</p>
      <p><time datetime="${c.date}">${d}.${m}.${y}</time> · ${c.place}</p>
    </div>
  </footer>`;
}

/** The page shell. `og` feeds WhatsApp and social link previews. */
export function page(ctx, { title, description, og = {}, bodyClass = '', body, scripts = [] }) {
  const c = ctx.content;
  const asset = ctx.asset;
  const ogImage = og.image || ctx.ogImage;
  const isAdmin = bodyClass.includes('admin');
  return html`<!doctype html>
<html lang="en-GB" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
${c.site?.indexable ? '' : raw('<meta name="robots" content="noindex, nofollow">\n')}<meta name="theme-color" content="#1C1014">
<meta name="color-scheme" content="light">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${c.codeName || `${c.couple.first} & ${c.couple.second}`}">
<meta property="og:title" content="${og.title || title}">
<meta property="og:description" content="${og.description || description}">
<meta property="og:url" content="${ctx.publicUrl}${og.path || ctx.path || '/'}">
${ogImage ? html`<meta property="og:image" content="${ogImage}">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="canonical" href="${ctx.publicUrl}${og.canonical || ctx.path || '/'}">
<link rel="icon" href="${asset('/favicon.svg')}" type="image/svg+xml">
${FONTS.map((f) => html`<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>\n`)}<link rel="stylesheet" href="${asset('/css/site.css')}">
${isAdmin ? html`<link rel="stylesheet" href="${asset('/css/admin.css')}">\n` : ''}<script>${raw(HEAD_SCRIPT)}</script>
</head>
<body class="${bodyClass}">
${isAdmin ? '' : html`<div class="preloader" aria-hidden="true" data-preloader><span class="preloader__ring"></span><span class="preloader__mark">${c.codeName || `${c.couple.first} & ${c.couple.second}`}</span></div>\n`}<a class="skip" href="#main">Skip to content</a>
${body}
${previewBar(ctx)}
${scripts.map((s) => html`<script src="${asset(s)}" defer></script>\n`)}</body>
</html>`;
}
