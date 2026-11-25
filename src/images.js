import fs from 'node:fs';
import path from 'node:path';

/**
 * Looks up photographs prepared by `npm run photos`.
 * public/images/manifest.json maps a photo name to its size, tone and widths.
 */
export function createImages(publicDir) {
  const file = path.join(publicDir, 'images', 'manifest.json');
  let manifest = {};
  let mtime = -1;

  function load() {
    try {
      const stat = fs.statSync(file);
      if (stat.mtimeMs !== mtime) {
        manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
        mtime = stat.mtimeMs;
      }
    } catch {
      manifest = {};
      mtime = -1;
    }
    return manifest;
  }

  return {
    /** Returns { name, w, h, color, widths, formats } or null when the photo hasn't been prepared. */
    get(name) {
      if (typeof name !== 'string' || !name) return null;
      const entry = load()[name];
      return entry ? { name, ...entry } : null;
    },
    all() {
      return load();
    },
  };
}
