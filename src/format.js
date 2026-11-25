/** Dates and times, always in the wedding's own time zone. */

export const isIsoDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

const formatters = new Map();
function fmt(tz, opts) {
  const key = tz + JSON.stringify(opts);
  if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat('en-GB', { timeZone: tz, ...opts }));
  return formatters.get(key);
}

export function createClock(content) {
  const tz = content.timezone || 'Africa/Lagos';
  const offset = content.utcOffset || '+01:00';

  const clock = {
    tz,
    /** A moment on a local date and time, e.g. at('2026-11-28', '10:00'). */
    at(date, time = '00:00') {
      return new Date(`${date}T${time}:00${offset}`);
    },
    /** The local calendar date of a moment, as YYYY-MM-DD. */
    day(d) {
      const p = Object.fromEntries(
        fmt(tz, { year: 'numeric', month: '2-digit', day: '2-digit' })
          .formatToParts(d)
          .map((x) => [x.type, x.value]),
      );
      return `${p.year}-${p.month}-${p.day}`;
    },
    /** "Saturday 28 November 2026" */
    dateLong(date) {
      return fmt(tz, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(clock.at(date, '12:00')).replace(',', '');
    },
    /** "Saturday 28 November" */
    dateMedium(date) {
      return fmt(tz, { weekday: 'long', day: 'numeric', month: 'long' }).format(clock.at(date, '12:00')).replace(',', '');
    },
    /** "28 November" */
    dayMonth(date) {
      return fmt(tz, { day: 'numeric', month: 'long' }).format(clock.at(date, '12:00'));
    },
    /** "10 am", "4:30 pm" */
    time(t) {
      if (!isTime(t)) return '';
      const [h, m] = t.split(':').map(Number);
      const suffix = h < 12 ? 'am' : 'pm';
      const h12 = h % 12 || 12;
      return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
    },
    /** "12 Nov, 14:05" for admin tables. */
    stamp(iso) {
      if (!iso) return '';
      return fmt(tz, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));
    },
  };
  return clock;
}

/** 'before', 'today' or 'after' the wedding day. */
export function phase(content, clock, now) {
  const today = clock.day(now);
  if (today < content.date) return 'before';
  if (today === content.date) return 'today';
  return 'after';
}
