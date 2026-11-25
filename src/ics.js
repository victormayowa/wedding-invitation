import { filled } from './tbc.js';
import { isIsoDate, isTime } from './format.js';

const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const utc = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Folds lines to 75 octets as the iCalendar format requires. */
function fold(lineText) {
  const bytes = Buffer.from(lineText, 'utf8');
  if (bytes.length <= 75) return lineText;
  const parts = [];
  let start = 0;
  while (start < bytes.length) {
    let end = Math.min(start + (start === 0 ? 75 : 74), bytes.length);
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--; // don't split a character
    parts.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
  }
  return parts.join('\r\n ');
}

/** Only events with a confirmed date and start time can go in a calendar. */
export const calendarReady = (e) => isIsoDate(e.date) && isTime(e.start);

export function buildCalendar({ content, clock, events, publicUrl, now }) {
  const names = `${content.couple.first} & ${content.couple.second}`;
  const host = new URL(publicUrl).host;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${names}//Wedding//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(`The wedding of ${names}`)}`,
  ];
  for (const e of events.filter(calendarReady)) {
    const start = clock.at(e.date, e.start);
    const end = isTime(e.end) && e.end > e.start ? clock.at(e.date, e.end) : new Date(start.getTime() + 3 * 3600e3);
    const where = [e.venue?.name, e.venue?.address].filter(filled).join(', ');
    const notes = [
      filled(e.dressCode?.title) ? `Dress code: ${e.dressCode.title}` : '',
      filled(e.notes) ? e.notes : '',
      `${publicUrl}/#event-${e.id}`,
    ].filter(Boolean);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}-${e.date.replace(/-/g, '')}@${host}`,
      `DTSTAMP:${utc(now)}`,
      `DTSTART:${utc(start)}`,
      `DTEND:${utc(end)}`,
      `SUMMARY:${esc(`${names}: ${e.name}`)}`,
      ...(where ? [`LOCATION:${esc(where)}`] : []),
      `DESCRIPTION:${esc(notes.join('\n'))}`,
      `URL:${publicUrl}/#event-${e.id}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
