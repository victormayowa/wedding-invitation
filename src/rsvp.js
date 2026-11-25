import { filled } from './tbc.js';
import { isIsoDate, isTime } from './format.js';

export const ACCESS = ['open', 'invitation', 'private'];

/** Events guests can see: confirmed ones, plus drafts when an admin is previewing. */
export function visibleEvents(content, { preview = false } = {}) {
  return content.events.filter((e) => e.status === 'confirmed' || (preview && e.status === 'draft'));
}

/** The events an invitation covers that guests can currently reply to. */
export function invitedEvents(content, invitation, opts) {
  if (!invitation) return [];
  return visibleEvents(content, opts).filter((e) => invitation.events.includes(e.id));
}

/** Events a new invitation includes unless the admin chooses otherwise. */
export const defaultEventIds = (content) => content.events.filter((e) => e.access === 'open').map((e) => e.id);

export function eventStart(clock, e) {
  if (!isIsoDate(e.date)) return null;
  return clock.at(e.date, isTime(e.start) ? e.start : '00:00');
}

/** The moment the countdown runs to: the first confirmed event on the day, else the start of the day. */
export function countdownTarget(content, clock) {
  const onTheDay = content.events
    .filter((e) => e.status === 'confirmed' && e.date === content.date && isTime(e.start))
    .map((e) => clock.at(e.date, e.start))
    .sort((a, b) => a - b);
  return onTheDay[0] || clock.at(content.date, '00:00');
}

/** Whether replies are being accepted. */
export function rsvpWindow(content, clock, now) {
  const deadline = isIsoDate(content.rsvp?.deadline) ? content.rsvp.deadline : null;
  const today = clock.day(now);
  if (today > content.date) return { open: false, reason: 'after', deadline };
  if (deadline && today > deadline) return { open: false, reason: 'deadline', deadline };
  return { open: true, reason: null, deadline };
}

const line = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const text = (v, max) =>
  String(v ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);

export function cleanPhone(v) {
  const s = line(v, 40);
  if (!s) return { value: '', ok: false };
  const digits = s.replace(/\D/g, '');
  const ok = /^\+?[\d\s().-]+$/.test(s) && digits.length >= 7 && digits.length <= 15;
  return { value: s, ok };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Validates a reply against the invitation it belongs to.
 * Returns { ok, errors: { field: message }, value }.
 */
export function validateReply(form, invitation, events) {
  const errors = {};
  const get = (k) => (form.get ? form.get(k) : form[k]);
  const getAll = (k) => (form.getAll ? form.getAll(k) : [].concat(form[k] ?? []));

  const choice = get('attending');
  if (choice !== 'yes' && choice !== 'no') errors.attending = 'Please let us know whether you can join us.';
  const attending = choice === 'yes';

  const fullName = line(get('fullName'), 120);
  if (fullName.length < 2) errors.fullName = 'Please tell us your name.';

  const phone = cleanPhone(get('phone'));
  if (!phone.value) errors.phone = 'Please add a phone number, so we can reach you about the day.';
  else if (!phone.ok) errors.phone = 'That phone number doesn’t look quite right. Please include the full number.';

  const email = line(get('email'), 200);
  if (email && !EMAIL.test(email)) errors.email = 'That email address doesn’t look quite right.';

  let guests = 0;
  let chosen = [];
  if (attending) {
    guests = invitation.seats === 1 ? 1 : Number.parseInt(get('guests'), 10);
    if (!Number.isInteger(guests) || guests < 1) {
      errors.guests = 'Please tell us how many of you will attend.';
    } else if (guests > invitation.seats) {
      errors.guests =
        invitation.seats === 1
          ? 'Your invitation is for one guest.'
          : `Your invitation is for up to ${invitation.seats} guests.`;
    }
    const allowed = new Set(events.map((e) => e.id));
    chosen = [...new Set(getAll('events').map(String))].filter((id) => allowed.has(id));
    if (events.length > 0 && chosen.length === 0) errors.events = 'Please choose at least one of the celebrations.';
  }

  const value = {
    attending,
    fullName,
    phone: phone.value,
    email,
    guests: attending ? guests : 0,
    events: attending ? events.filter((e) => chosen.includes(e.id)).map((e) => e.id) : [],
    dietary: attending ? text(get('dietary'), 500) : '',
    accessibility: attending ? text(get('accessibility'), 500) : '',
    message: text(get('message'), 1000),
  };
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/** Checks content/wedding.js for mistakes that would break the site. */
export function checkContent(content) {
  const problems = [];
  const ids = new Set();
  if (!isIsoDate(content.date)) problems.push('date must be written as YYYY-MM-DD.');
  for (const [i, e] of (content.events || []).entries()) {
    const where = `events[${i}] (${e.name || 'unnamed'})`;
    if (!e.id || !/^[a-z0-9-]+$/.test(e.id)) problems.push(`${where}: id must use lowercase letters, numbers and hyphens.`);
    if (ids.has(e.id)) problems.push(`${where}: id "${e.id}" is used twice.`);
    ids.add(e.id);
    if (!['draft', 'confirmed'].includes(e.status)) problems.push(`${where}: status must be 'draft' or 'confirmed'.`);
    if (!ACCESS.includes(e.access)) problems.push(`${where}: access must be 'open', 'invitation' or 'private'.`);
    if (filled(e.date) && !isIsoDate(e.date)) problems.push(`${where}: date must be YYYY-MM-DD.`);
    if (filled(e.start) && !isTime(e.start)) problems.push(`${where}: start must be a 24-hour time such as 10:00.`);
    if (filled(e.end) && !isTime(e.end)) problems.push(`${where}: end must be a 24-hour time such as 18:00.`);
    if (e.status === 'confirmed' && !isIsoDate(e.date)) problems.push(`${where}: a confirmed event needs a date.`);
  }
  if (filled(content.rsvp?.deadline) && !isIsoDate(content.rsvp.deadline)) {
    problems.push('rsvp.deadline must be written as YYYY-MM-DD.');
  }
  return problems;
}
