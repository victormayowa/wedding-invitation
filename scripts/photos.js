#!/usr/bin/env node
/**
 * Prepares photographs (and short films) for the website.
 *
 *   1. Put original photos in the /photos folder (JPEG, PNG or WebP), and any
 *      short videos (MP4, MOV or M4V).
 *   2. Run `npm run photos`.
 *   3. Refer to each one in content/wedding.js by its file name without the
 *      extension: photos/proposal.jpg becomes 'proposal'.
 *
 * Photos are saved to public/images at several widths (640, 1024, 1600, 2400 and
 * the original width, never enlarged) in WebP and JPEG. public/images/manifest.json
 * records each one's size and average tone so pages can reserve space and show a
 * matching colour while it loads.
 *
 * Films are saved to public/videos, ready to stream, with a poster frame prepared
 * like a photo. In the gallery they open in the viewer and play there. Films need
 * ffmpeg installed (https://ffmpeg.org); photos do not.
 *
 * Location data and other camera metadata are removed from every copy.
 * The opening portrait also becomes public/images/og.jpg, the picture shown in
 * WhatsApp and social media link previews.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.resolve(process.env.PHOTOS_DIR || path.join(ROOT, 'photos'));
const OUT = path.resolve(process.env.IMAGES_DIR || path.join(ROOT, 'public', 'images'));
const VIDEO_OUT = path.resolve(process.env.VIDEOS_DIR || path.join(ROOT, 'public', 'videos'));
const WIDTHS = [640, 1024, 1600, 2400];
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.m4v']);

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

/** Widths to generate: the standard steps up to the photo's own width, plus the original if it sits well above the last step. */
function widthsFor(width) {
  const widths = WIDTHS.filter((w) => w <= width);
  if (!widths.length || width - widths[widths.length - 1] > 120) widths.push(width);
  return widths;
}

async function prepareImage(file, name) {
  const { data, info } = await sharp(file, { failOn: 'none' }).rotate().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const tone = await sharp(data).resize(1, 1, { fit: 'cover' }).removeAlpha().raw().toBuffer();
  const widths = widthsFor(width);
  for (const w of widths) {
    const resized = sharp(data).resize({ width: w, withoutEnlargement: true });
    await resized.clone().webp({ quality: 80, effort: 5 }).toFile(path.join(OUT, `${name}-${w}.webp`));
    await resized
      .clone()
      .flatten({ background: '#f3ede3' })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(path.join(OUT, `${name}-${w}.jpg`));
  }
  return { w: width, h: height, color: `#${hex(tone[0])}${hex(tone[1])}${hex(tone[2])}`, widths };
}

/* ---------- Films ---------- */

const hasFfmpeg = () =>
  spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0 &&
  spawnSync('ffprobe', ['-version'], { stdio: 'ignore' }).status === 0;

function probe(file) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name', '-of', 'json', file], {
    encoding: 'utf8',
  });
  if (r.status !== 0) throw new Error(`Could not read ${path.basename(file)}: ${r.stderr.trim()}`);
  const j = JSON.parse(r.stdout);
  const stream = (type) => j.streams.find((s) => s.codec_type === type)?.codec_name;
  return { duration: Number(j.format.duration) || 0, video: stream('video'), audio: stream('audio') };
}

function ffmpeg(args) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { encoding: 'utf8' });
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

  const files = fs
    .readdirSync(SOURCE)
    .filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()) || VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort();
  if (!files.length) {
    console.log(`\n  No photos in ${path.relative(ROOT, SOURCE) || SOURCE}. Add photos or films and run this again.\n`);
    return;
  }

  const ffmpegReady = hasFfmpeg();
  const hero = await heroName();
  const manifest = {};
  const seen = new Map();
  const skipped = [];

  for (const f of files) {
    const file = path.join(SOURCE, f);
    const name = slug(f);
    const isVideo = VIDEO_EXTENSIONS.has(path.extname(f).toLowerCase());
    if (!name) continue;
    if (seen.has(name)) {
      console.warn(`  Skipping ${f}: it has the same name as ${seen.get(name)}.`);
      continue;
    }
    seen.set(name, f);
    if (isVideo && !ffmpegReady) {
      skipped.push(f);
      if (previous[name]) manifest[name] = previous[name];
      continue;
    }

    const old = previous[name];
    const mtime = Math.round(fs.statSync(file).mtimeMs);
    if (old && old.source === f && old.mtime === mtime && outputsExist(name, old)) {
      manifest[name] = old;
    } else {
      process.stdout.write(`  ${f} → ${name} `);
      if (isVideo) fs.mkdirSync(VIDEO_OUT, { recursive: true });
      if (old) removeOutputs(name, old);
      const entry = isVideo ? await prepareVideo(file, name) : await prepareImage(file, name);
      manifest[name] = { ...entry, source: f, mtime };
      console.log(`(${entry.w}×${entry.h}${entry.video ? `, film ${entry.video.duration}s` : ''})`);
    }

    if (name === hero && !isVideo) {
      await sharp(file, { failOn: 'none' })
        .rotate()
        .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
        .jpeg({ quality: 84, mozjpeg: true })
        .toFile(path.join(OUT, 'og.jpg'));
    }
  }

  const removed = Object.keys(previous).filter((k) => !manifest[k]);
  for (const name of removed) removeOutputs(name, previous[name]);

  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n  ${Object.keys(manifest).length} photos and films ready.${removed.length ? ` Removed ${removed.length} no longer in /photos.` : ''}`);
  if (manifest[hero]) console.log('  Link preview image: public/images/og.jpg');
  if (skipped.length) console.log(`  Install ffmpeg to prepare these films: ${skipped.join(', ')}`);
  console.log('');
}

await main();
