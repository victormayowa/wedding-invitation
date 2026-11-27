# Photos

Put your original photographs here, as large as you have them: JPEG, PNG or WebP, plus short videos (MP4, MOV). Use a folder per album if you like, such as `photos/registry/`. This folder is never published or committed; only the prepared copies in `public/images/` and `public/videos/` are.

## 1. Name

Each photo's name is its folder and file name in lower case with hyphens. Phone clutter is dropped:

| File | Name in `content/wedding.js` |
|---|---|
| `photos/proposal-01.jpg` | `'proposal-01'` |
| `photos/pre-wedding/DSC_6740 copy 2.jpg` | `'pre-wedding-dsc-6740'` |
| `photos/registry/WhatsApp Image 2026-11-24 at 17.01.18 (1).jpeg` | `'registry-2026-11-24-17-01-18-1'` |

To print every name, with ● beside the ones the site uses:

```bash
npm run photos -- --list
```

## 2. Repair small or washed-out photos (optional)

Photos sent over WhatsApp are small and often hazy. `scripts/enhance.py` repairs them:

- it restores contrast and colour, but only as much as each photo needs
- it enlarges 2× with light denoising and gentle sharpening
- it can trim a video so it starts at the right moment (`--trim 20`)
- it can polish a video (`--polish`): light denoising and sharpening, re-encoded at a sensible size, since phone clips are often sent at several times the bitrate their picture needs

It writes to `photos/enhanced/` and never touches your originals. The next step uses an enhanced copy automatically when one exists. Setup and usage are at the top of the script. It needs Python with Pillow, NumPy and OpenCV.

For a designed graphic such as the invitation card, add `--keep-tone` so its colours stay exactly as designed.

Professional photos need nothing here. They are far larger than any screen and are reduced in the next step.

## 3. Prepare

```bash
npm run photos
```

This prepares every photo the site uses:

- WebP copies at 640, 1024, 1600 and 2400 px wide, plus JPEG copies up to 1600 px for older browsers.
- Colours converted to sRGB, and location and camera data removed.
- Large photos lightly sharpened after reduction.

Running it again only processes new or changed photos.

- `-- --all` prepares every photo in this folder, used or not.
- `-- --prune` deletes prepared copies the site no longer uses. Without it, nothing is ever deleted, so photos prepared on another computer stay on the site even when their originals aren't here.

Videos need [ffmpeg](https://ffmpeg.org). If it isn't on your PATH, point the `FFMPEG` setting at it:

```bash
FFMPEG=/path/to/ffmpeg npm run photos
```

## Shapes that work best

| Where | Best shape |
|---|---|
| Opening photos (`hero.image`, `hero.slides`) | Upright. The first is also the WhatsApp link-preview image. |
| Invitation photos (`invitation.images`) | Upright, then any; they are cropped to 4:5 and a square |
| Story chapters | Any; cropped to 4:3 |
| Venue photos | Landscape, 3:2 |
| Gallery | Any shape; each photo keeps its own proportions |
| Films | Short clips play in the gallery viewer. Every film also appears under the gallery's Films tab (`gallery.films`). |

Give every gallery photo a short `alt` description of what it shows, for guests using screen readers.
