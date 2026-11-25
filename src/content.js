import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './config.js';
import { placeholders } from './tbc.js';
import { checkContent } from './rsvp.js';

export const CONTENT_FILE = path.join(ROOT, 'content', 'wedding.js');

const SECTION_NAMES = {
  invitation: 'Invitation',
  hero: 'Opening portrait',
  rsvp: 'RSVP',
  story: 'Our story',
  events: 'The celebration',
  dressCode: 'Dress code',
  gallery: 'Gallery',
  travel: 'Travel & accommodation',
  faqs: 'Questions',
  contacts: 'Contacts',
  email: 'Contacts',
  gifts: 'Gifts',
};

export async function loadContent(file = CONTENT_FILE) {
  const mod = await import(pathToFileURL(file).href);
  const content = mod.default;
  return { content, problems: checkContent(content) };
}

/** Outstanding placeholders, grouped by section, for the admin checklist. */
export function contentChecklist(content) {
  const groups = new Map();
  for (const item of placeholders(content)) {
    const top = item.path.split(/[.[]/)[0];
    let label = SECTION_NAMES[top] || top;
    let context = item.path;
    const ev = /^events\[(\d+)\]/.exec(item.path);
    if (ev) {
      const e = content.events[Number(ev[1])];
      label = `${SECTION_NAMES.events}: ${e?.name || 'event'}`;
      context = item.path.replace(/^events\[\d+\]\.?/, '');
    }
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push({ ...item, context });
  }
  return [...groups].map(([label, items]) => ({ label, items }));
}
