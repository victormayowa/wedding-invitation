import { isTbc } from './tbc.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

/** Markup that has already been escaped. */
export class Html {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

/** Marks trusted markup so it is not escaped. Never pass guest input to this. */
export const raw = (s) => new Html(String(s));

function render(v) {
  if (v === null || v === undefined || v === false || v === true) return '';
  if (v instanceof Html) return v.value;
  if (Array.isArray(v)) return v.map(render).join('');
  if (isTbc(v)) return '';
  return escapeHtml(v);
}

/**
 * Tagged template that escapes every interpolated value unless it is Html.
 * Usage: html`<p>${name}</p>`
 */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Html(out);
}
