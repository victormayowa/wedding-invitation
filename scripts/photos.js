#!/usr/bin/env node
/**
 * Prepares photographs (and short films) for the website.
 *
 *   1. Put photos in the /photos folder, loose or in album folders such as
 *      photos/registry/ (JPEG, PNG or WebP), and any short videos (MP4, MOV, M4V).
 *   2. Refer to each one in content/wedding.js by its name: folder and file name in
 *      lower case with hyphens. photos/pre-wedding/DSC_6740.jpg is 'pre-wedding-dsc-6740';
 *      phone clutter is dropped, so "WhatsApp Image 2026-11-24 at 17.01.18 (1).jpeg" in
 *      photos/registry is 'registry-2026-11-24-17-01-18-1'. `npm run photos -- --list`
 *      prints every name.
 *   3. Run `npm run photos`. It prepares the photos the site uses.
 *        --all    prepare every photo in /photos, used or not
 *        --prune  delete prepared copies the site no longer uses
 *        --list   print the name of every photo in /photos
 *
 * Improved copies made by scripts/enhance.py (photos/enhanced/…) are used in place
 * of their originals automatically.
 *
 * Photos become WebP at 640, 1024, 1600 and 2400 pixels wide (never enlarged; a
 * smaller photo also keeps its own width) with JPEG fallbacks up to 1600, all in
 * sRGB with camera and location data removed. Large photos get a light sharpen
 * after reduction. public/images/manifest.json records each one's size and average
 * tone so pages can reserve the space and show a matching colour while it loads.
 *
 * Films become stream-ready MP4s in public/videos with a poster frame. They need
 * ffmpeg: on PATH, or set FFMPEG (and optionally FFPROBE) to its location.
 *
 * The opening portrait also becomes public/images/og.jpg, the picture shown in
 * WhatsApp and social media link previews.
 *
 * Prepared copies are kept even when an original is not on this computer, so the
 * site never loses photos that were prepared elsewhere. Only --prune removes them.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.resolve(process.env.PHOTOS_DIR || path.join(ROOT, 'photos'));
const ENHANCED = path.join(SOURCE, 'enhanced');
const OUT = path.resolve(process.env.IMAGES_DIR || path.join(ROOT, 'public', 'images'));
const VIDEO_OUT = path.resolve(process.env.VIDEOS_DIR || path.join(ROOT, 'public', 'videos'));
const WIDTHS = [640, 1024, 1600, 2400];
const JPEG_MAX = 1600;
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v']);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = process.env.FFPROBE || 'ffprobe';

const flags = new Set(process.argv.slice(2));
const ALL = flags.has('--all');
const PRUNE = flags.has('--prune');
const LIST = flags.has('--list');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('\n  sharp is needed to prepare photos. Run `npm install` first.\n');
  process.exit(1);
}

/* ---------- Names ---------- */

/** 'registry/WhatsApp Image 2026-11-24 at 17.01.18 (1).jpeg' → 'registry-2026-11-24-17-01-18-1' */
function photoName(rel) {
  return rel
    .slice(0, rel.length - path.extname(rel).length)
    .replace(/\.(jpe?g|png|webp|heic)$/i, '') // "DSC_5041.JPG.jpeg": a doubled extension from messaging apps
    .split(path.sep)
    .join('/')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/whatsapp (image|video) /g, '')
    .replace(/ copy( \d+)?(?=$|\/)/g, '')
    .replace(/ at (?=\d)/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Every photo and film in /photos, with the enhanced copy used where one exists. */
function discover() {
  const found = [];
  const walk = (dir, depth) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!(depth === 0 && entry.name === 'enhanced') && depth < 3) walk(abs, depth + 1);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      const isVideo = VIDEO_EXTENSIONS.has(ext);
      if (!isVideo && !IMAGE_EXTENSIONS.has(ext)) continue;
      const rel = path.relative(SOURCE, abs);
      const better = path.join(ENHANCED, rel.slice(0, rel.length - ext.length) + (isVideo ? '.mp4' : '.jpg'));
      const enhanced = fs.existsSync(better);
      found.push({ rel: rel.split(path.sep).join('/'), name: photoName(rel), isVideo, enhanced, file: enhanced ? better : abs });
    }
  };
  walk(SOURCE, 0);
  return found.sort((a, b) => a.rel.localeCompare(b.rel));
}

/** The photo names content/wedding.js refers to. */
async function photoRefs() {
  const { default: c } = await import(pathToFileURL(path.join(ROOT, 'content', 'wedding.js')).href);
  const refs = [
    c.hero?.image,
    ...(c.hero?.slides || []),
    c.invitation?.card,
    ...(c.invitation?.images || []),
    c.closing?.image,
    ...(c.story?.chapters || []).map((ch) => ch.image),
    ...(c.events || []).map((e) => e.venue?.image),
    ...(c.gallery?.albums || []).flatMap((a) => (a.images || []).map((im) => im.src)),
  ];
  return { refs: new Set(refs.filter((r) => typeof r === 'string' && r)), hero: typeof c.hero?.image === 'string' ? c.hero.image : null };
}

/* ---------- Photos ---------- */

const hex = (n) => n.toString(16).padStart(2, '0');

/** The standard widths up to the photo's own width, plus its own width when it falls well between two steps. */
function widthsFor(width) {
  const widths = WIDTHS.filter((w) => w <= width);
  const last = widths[widths.length - 1];
  if (!widths.length || (width < WIDTHS[WIDTHS.length - 1] && width - last > 120)) widths.push(width);
  return widths;
}

async function prepareImage(file, name) {
  // Decode once: upright, converted to sRGB from any embedded colour profile.
  const { data, info } = await sharp(file, { failOn: 'none' })
    .rotate()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });
  const raw = { raw: { width: info.width, height: info.height, channels: info.channels } };
  const { width, height } = info;
  const tone = await sharp(data, raw).resize(1, 1, { fit: 'cover' }).removeAlpha().raw().toBuffer();
  const widths = widthsFor(width);
  const jpg = widths.filter((w) => w <= JPEG_MAX);
  if (!jpg.length) jpg.push(widths[0]);
  for (const w of widths) {
    let img = sharp(data, raw).resize({ width: w, withoutEnlargement: true, kernel: 'lanczos3' });
    // Reduction softens fine detail; restore it gently on luminance only.
    if (width / w >= 1.5) img = img.sharpen({ sigma: 0.55, m1: 0.6, m2: 1.6 });
    await img.clone().webp({ quality: 82, effort: 5, smartSubsample: true }).toFile(path.join(OUT, `${name}-${w}.webp`));
    if (jpg.includes(w)) {
      await img
        .clone()
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 82, progressive: true, mozjpeg: true })
        .toFile(path.join(OUT, `${name}-${w}.jpg`));
    }
  }
  return { w: width, h: height, color: `#${hex(tone[0])}${hex(tone[1])}${hex(tone[2])}`, widths, jpg };
}

/* ---------- Films ---------- */

const hasFfmpeg = () => spawnSync(FFMPEG, ['-version'], { stdio: 'ignore' }).status === 0;

function probe(file) {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name', '-of', 'json', file], {
    encoding: 'utf8',
  });
  if (r.status === 0) {
    const j = JSON.parse(r.stdout);
    const stream = (type) => j.streams.find((s) => s.codec_type === type)?.codec_name;
    return { duration: Number(j.format.duration) || 0, video: stream('video'), audio: stream('audio') };
  }
  // No ffprobe: read the same facts from ffmpeg's own description of the file.
  const text = spawnSync(FFMPEG, ['-hide_banner', '-i', file], { encoding: 'utf8' }).stderr || '';
  const d = /Duration: (\d+):(\d+):([\d.]+)/.exec(text);
  const v = /Stream[^\n]*Video: (\w+)/.exec(text);
  if (!d || !v) throw new Error(`Could not read ${path.basename(file)}`);
  const a = /Stream[^\n]*Audio: (\w+)/.exec(text);
  return { duration: Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]), video: v[1], audio: a?.[1] };
}

function ffmpeg(args) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr.trim() || 'ffmpeg failed');
}

async function prepareVideo(file, name) {
  const info = probe(file);
  const out = path.join(VIDEO_OUT, `${name}.mp4`);
  // Phone and WhatsApp videos are usually H.264 + AAC already: keep them untouched, only make them stream-ready.
  const canCopy = info.video === 'h264' && (!info.audio || info.audio === 'aac');
  ffmpeg([
    '-i', file,
    '-map_metadata', '-1',
    '-map', '0:v:0', '-map', '0:a:0?',
    ...(canCopy
      ? ['-c', 'copy']
      : ['-c:v', 'libx264', '-crf', '22', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-vf', "scale='min(1280,iw)':-2", '-c:a', 'aac', '-b:a', '128k']),
    '-movflags', '+faststart',
    out,
  ]);
  const poster = path.join(os.tmpdir(), `poster-${process.pid}-${name}.jpg`);
  ffmpeg(['-ss', (info.duration * 0.4).toFixed(2), '-i', file, '-frames:v', '1', '-q:v', '2', poster]);
  try {
    const entry = await prepareImage(poster, name);
    return { ...entry, video: { src: `/videos/${name}.mp4`, duration: Math.round(info.duration) } };
  } finally {
    fs.rmSync(poster, { force: true });
  }
}

/* ---------- Main ---------- */

function outputsExist(name, entry) {
  return (
    entry.widths.every((w) => fs.existsSync(path.join(OUT, `${name}-${w}.webp`))) &&
    (!entry.video || fs.existsSync(path.join(VIDEO_OUT, `${name}.mp4`)))
  );
}

function removeOutputs(name, entry) {
  for (const w of entry.widths || []) {
    for (const ext of ['webp', 'jpg']) fs.rmSync(path.join(OUT, `${name}-${w}.${ext}`), { force: true });
  }
  if (entry.video) fs.rmSync(path.join(VIDEO_OUT, `${name}.mp4`), { force: true });
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

  const { refs, hero } = await photoRefs();
  const sources = new Map();
  for (const s of discover()) {
    if (!s.name) continue;
    if (sources.has(s.name)) {
      console.warn(`  Skipping photos/${s.rel}: it has the same name as photos/${sources.get(s.name).rel}.`);
      continue;
    }
    sources.set(s.name, s);
  }

  if (LIST) {
    for (const s of sources.values()) console.log(`  ${refs.has(s.name) ? '●' : '○'} ${s.name}  ← photos/${s.rel}${s.enhanced ? ' (enhanced)' : ''}`);
    console.log('\n  ● used on the site   ○ not used\n');
    return;
  }

  const ffmpegReady = hasFfmpeg();
  const manifest = { ...previous };
  const skipped = [];
  let prepared = 0;

  for (const s of sources.values()) {
    if (!ALL && !refs.has(s.name)) continue;
    if (s.isVideo && !ffmpegReady) {
      skipped.push(s.rel);
      continue;
    }
    const old = previous[s.name];
    const mtime = Math.round(fs.statSync(s.file).mtimeMs);
    const fresh = old && old.source === s.rel && old.mtime === mtime && Boolean(old.enhanced) === s.enhanced && outputsExist(s.name, old);
    if (fresh) continue;
    process.stdout.write(`  photos/${s.rel}${s.enhanced ? ' (enhanced)' : ''} → ${s.name} `);
    if (s.isVideo) fs.mkdirSync(VIDEO_OUT, { recursive: true });
    if (old) removeOutputs(s.name, old);
    const entry = s.isVideo ? await prepareVideo(s.file, s.name) : await prepareImage(s.file, s.name);
    manifest[s.name] = { ...entry, source: s.rel, ...(s.enhanced ? { enhanced: true } : {}), mtime };
    prepared++;
    console.log(`(${entry.w}×${entry.h}${entry.video ? `, film ${entry.video.duration}s` : ''})`);
  }

  const heroSource = hero && sources.get(hero);
  if (heroSource && !heroSource.isVideo) {
    await sharp(heroSource.file, { failOn: 'none' })
      .rotate()
      .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(path.join(OUT, 'og.jpg'));
  }

  let pruned = 0;
  if (PRUNE) {
    for (const name of Object.keys(manifest)) {
      if (refs.has(name)) continue;
      removeOutputs(name, manifest[name]);
      delete manifest[name];
      pruned++;
    }
  }

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(manifestFile, JSON.stringify(sorted, null, 2) + '\n');

  const missing = [...refs].filter((r) => !manifest[r]);
  const unused = [...sources.keys()].filter((n) => !refs.has(n)).length;
  console.log(`\n  ${prepared} prepared, ${Object.keys(manifest).length} ready in total.${pruned ? ` Removed ${pruned} no longer used.` : ''}`);
  if (heroSource) console.log('  Link preview image: public/images/og.jpg');
  if (unused && !ALL) console.log(`  ${unused} photos in /photos are not used on the site (npm run photos -- --list).`);
  if (missing.length) console.log(`  Not found, so not shown on the site: ${missing.join(', ')}`);
  if (skipped.length) console.log(`  ffmpeg is needed to prepare these films: ${skipped.join(', ')}`);
  console.log('');
}

await main();
