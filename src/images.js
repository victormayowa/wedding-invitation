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
    /**
     * Returns { name, w, h, color, widths, jpg, video? } or null when the photo hasn't been prepared.
     * widths lists the WebP sizes; jpg the JPEG fallbacks, which stop at 1600 px.
     */
    get(name) {
      if (typeof name !== 'string' || !name) return null;
      const entry = load()[name];
      return entry ? { name, ...entry, jpg: entry.jpg || entry.widths } : null;
    },
    all() {
      return load();
    },
  };
}
