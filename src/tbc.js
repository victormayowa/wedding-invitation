/**
 * Placeholders for content that has not been confirmed yet.
 *
 * In content/wedding.js, write tbc('what belongs here') wherever a detail is
 * still unknown. Guests never see a placeholder: the site leaves it out. Signed-in
 * admins see it marked "TBC", and /admin/content lists every one outstanding.
 */
export class Tbc {
  constructor(hint) {
    this.hint = String(hint || 'To be confirmed');
  }
  toJSON() {
    return null;
  }
}

export const tbc = (hint) => new Tbc(hint);
export const isTbc = (v) => v instanceof Tbc;

/** True when a value holds real, confirmed content. */
export function filled(v) {
  if (v === null || v === undefined || v === '' || v instanceof Tbc) return false;
  if (Array.isArray(v)) return v.some(filled);
  return true;
}

/** Walks the content tree and returns every placeholder with its path. */
export function placeholders(node, path = '') {
  if (node instanceof Tbc) return [{ path, hint: node.hint }];
  if (Array.isArray(node)) return node.flatMap((v, i) => placeholders(v, `${path}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => placeholders(v, path ? `${path}.${k}` : k));
  }
  return [];
}
