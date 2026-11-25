#!/usr/bin/env node
/**
 * Prepares photographs for the website.
 *
 *   1. Put original photos in the /photos folder (JPEG, PNG or WebP).
 *   2. Run `npm run photos`.
 *   3. Refer to each photo in content/wedding.js by its file name without the
 *      extension: photos/proposal.jpg becomes 'proposal'.
 *
 * For every photo this writes sharp, right-sized copies to public/images in WebP
 * and JPEG (640, 1024, 1600 and 2400 pixels wide, never enlarged), and records its
 * size and average tone in public/images/manifest.json so pages can reserve the
 * space and show a matching colour while it loads.
 *
 * Location data and other camera metadata are removed from every copy.
 * The opening portrait also becomes public/images/og.jpg, the picture shown in
 * WhatsApp and social media link previews.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.resolve(process.env.PHOTOS_DIR || path.join(ROOT, 'photos'));
const OUT = path.resolve(process.env.IMAGES_DIR || path.join(ROOT, 'public', 'images'));
const WIDTHS = [640, 1024, 1600, 2400];
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('\n  sharp is needed to prepare photos. Run `npm install` first.\n');
  process.exit(1);
}

async function heroName() {
  try {
    const { default: content } = await import(path.join(ROOT, 'content', 'wedding.js'));
    return typeof content.hero?.image === 'string' ? content.hero.image : 'hero';
  } catch {
    return 'hero';
  }
}

const slug = (file) =>
  path
    .basename(file, path.extname(file))
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const hex = (n) => n.toString(16).padStart(2, '0');

async function prepare(file, name) {
  const base = sharp(file, { failOn: 'none' }).rotate();
  const { data, info } = await base.clone().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const tone = await sharp(data).resize(1, 1, { fit: 'cover' }).removeAlpha().raw().toBuffer();
  const widths = WIDTHS.filter((w) => w <= width);
  if (!widths.length) widths.push(width);

  for (const w of widths) {
    const resized = sharp(data).resize({ width: w, withoutEnlargement: true });
    await resized.clone().webp({ quality: 78, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.webp`));
    await resized.clone().flatten({ background: '#f3ede3' }).jpeg({ quality: 80, progressive: true, mozjpeg: true }).toFile(path.join(OUT, `${name}-${w}.jpg`));
  }
  return { w: width, h: height, color: `#${hex(tone[0])}${hex(tone[1])}${hex(tone[2])}`, widths, source: path.basename(file) };
}

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`\n  No photos folder found at ${SOURCE}\n`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const manifestFile = path.join(OUT, 'manifest.json');
  let previous = {};
  try {
    previous = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  } catch {}

  const files = fs
    .readdirSync(SOURCE)
    .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();
  if (!files.length) {
    console.log(`\n  No photos in ${path.relative(ROOT, SOURCE) || SOURCE}. Add JPEG, PNG or WebP files and run this again.\n`);
    return;
  }

  const hero = await heroName();
  const manifest = {};
  const seen = new Map();
  for (const f of files) {
    const file = path.join(SOURCE, f);
    const name = slug(f);
    if (!name) continue;
    if (seen.has(name)) {
      console.warn(`  Skipping ${f}: it has the same name as ${seen.get(name)}.`);
      continue;
    }
    seen.set(name, f);

    const old = previous[name];
    const stat = fs.statSync(file);
    const fresh =
      old &&
      old.source === f &&
      old.mtime === Math.round(stat.mtimeMs) &&
      old.widths.every((w) => fs.existsSync(path.join(OUT, `${name}-${w}.webp`)));
    if (fresh) {
      manifest[name] = old;
    } else {
      process.stdout.write(`  ${f} → ${name} `);
      manifest[name] = { ...(await prepare(file, name)), mtime: Math.round(stat.mtimeMs) };
      console.log(`(${manifest[name].w}×${manifest[name].h})`);
    }

    if (name === hero) {
      await sharp(file, { failOn: 'none' })
        .rotate()
        .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
        .jpeg({ quality: 82, mozjpeg: true })
        .toFile(path.join(OUT, 'og.jpg'));
    }
  }

  const removed = Object.keys(previous).filter((k) => !manifest[k]);
  for (const name of removed) {
    for (const w of previous[name].widths || []) {
      for (const ext of ['webp', 'jpg']) fs.rmSync(path.join(OUT, `${name}-${w}.${ext}`), { force: true });
    }
  }

  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n  ${Object.keys(manifest).length} photos ready in public/images.${removed.length ? ` Removed ${removed.length} no longer in /photos.` : ''}`);
  if (manifest[hero]) console.log('  Link preview image: public/images/og.jpg');
  console.log('');
}

await main();
