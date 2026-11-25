/** Parses CSV text (RFC 4180: quoted fields, doubled quotes, CRLF or LF). */
export function parseCsv(input) {
  const s = String(input).replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''));
}

/**
 * Spreadsheet apps run cells starting with = + - @ as formulas. Prefix those
 * with an apostrophe, except plain phone numbers such as +234 803 000 0000.
 */
function cell(v) {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^[+-][\d\s().-]*$/.test(s))) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV with a byte-order mark so Excel reads accented names correctly. */
export const toCsv = (rows) => '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
