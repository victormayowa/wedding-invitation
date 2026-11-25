import { html, raw } from '../html.js';
import { HEAD_SCRIPT } from '../security.js';

const FONTS = ['/fonts/newsreader-normal.woff2', '/fonts/newsreader-italic.woff2', '/fonts/hanken-grotesk.woff2'];

/** Couple's names with the ampersand set in italic. */
export const coupleMark = (c) => html`${c.couple.first} <span class="amp">&amp;</span> ${c.couple.second}`;

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

export function siteHeader(ctx, links = []) {
  const c = ctx.content;
  const rsvpLabel = ctx.invite?.response ? 'Your reply' : 'RSVP';
  return html`<header class="nav" data-nav>
    <div class="nav__inner">
      <a class="nav__mark" href="/">${coupleMark(c)}</a>
      ${links.length
        ? html`<nav class="nav__links" aria-label="Sections">
            <ul>${links.map((l) => html`<li><a href="${l.href}">${l.label}</a></li>`)}</ul>
          </nav>`
        : ''}
      <div class="nav__end">
        ${ctx.rsvpOpen ? html`<a class="nav__rsvp" href="/rsvp">${rsvpLabel}</a>` : ''}
        ${links.length
          ? html`<a class="nav__toggle" href="#footer-nav" role="button" aria-expanded="false" aria-controls="menu" data-menu-toggle><span data-menu-label>Menu</span></a>`
          : ''}
      </div>
    </div>
  </header>
  ${links.length
    ? html`<div class="menu" id="menu" data-menu hidden>
        <nav class="menu__nav" aria-label="Menu">
          <ol>${links.map((l, i) => html`<li style="--i:${i}"><a href="${l.href}" data-menu-link>${l.label}</a></li>`)}</ol>
        </nav>
        <div class="menu__foot">
          <p>${ctx.clock.dateLong(c.date)}<br>${c.place}</p>
          ${ctx.rsvpOpen ? html`<a class="button" href="/rsvp">${ctx.invite?.response ? 'Update your reply' : 'Reply to our invitation'}</a>` : ''}
        </div>
      </div>`
    : ''}`;
}

export function siteFooter(ctx, links = [], { tone = 'night' } = {}) {
  const c = ctx.content;
  const [y, m, d] = c.date.split('-');
  return html`<footer class="footer footer--${tone}">
    <div class="footer__inner">
      <p class="footer__mark">${coupleMark(c)}</p>
      <p class="footer__date"><time datetime="${c.date}">${d}.${m}.${y}</time><span aria-hidden="true"> · </span>${c.place}</p>
      ${links.length
        ? html`<nav class="footer__nav" id="footer-nav" aria-label="Footer">
            <ul>${links.map((l) => html`<li><a href="${l.href}">${l.label}</a></li>`)}</ul>
          </nav>`
        : ''}
    </div>
  </footer>`;
}

/**
 * The page shell. `og` feeds WhatsApp and social link previews.
 */
export function page(ctx, { title, description, og = {}, bodyClass = '', body, scripts = [] }) {
  const c = ctx.content;
  const asset = ctx.asset;
  const ogImage = og.image || ctx.ogImage;
  return html`<!doctype html>
<html lang="en-GB" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
${c.site?.indexable ? '' : raw('<meta name="robots" content="noindex, nofollow">\n')}<meta name="theme-color" content="#F3EDE3">
<meta name="color-scheme" content="light">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${c.couple.first} &amp; ${c.couple.second}">
<meta property="og:title" content="${og.title || title}">
<meta property="og:description" content="${og.description || description}">
<meta property="og:url" content="${ctx.publicUrl}${og.path || ctx.path || '/'}">
${ogImage ? html`<meta property="og:image" content="${ogImage}">\n<meta name="twitter:card" content="summary_large_image">\n` : ''}<link rel="canonical" href="${ctx.publicUrl}${og.canonical || ctx.path || '/'}">
<link rel="icon" href="${asset('/favicon.svg')}" type="image/svg+xml">
${FONTS.map((f) => html`<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>\n`)}<link rel="stylesheet" href="${asset('/css/site.css')}">
${bodyClass.includes('admin') ? html`<link rel="stylesheet" href="${asset('/css/admin.css')}">\n` : ''}<script>${raw(HEAD_SCRIPT)}</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
${body}
${previewBar(ctx)}
${scripts.map((s) => html`<script src="${asset(s)}" defer></script>\n`)}</body>
</html>`;
}
