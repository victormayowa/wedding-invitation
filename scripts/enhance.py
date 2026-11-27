#!/usr/bin/env python3
"""
Repairs small or washed-out photos (typically ones sent over WhatsApp) before
`npm run photos` prepares them for the website. Originals are never changed:
improved copies go to photos/enhanced/<same folder>/<same name>.jpg, and the photo
script uses an enhanced copy in place of its original whenever one exists.

For each photo:
  1. Tone: if the photo is washed out (lifted blacks, faded colour), stretch its
     levels and restore a little colour. Photos that are already fine are left alone.
  2. Size: enlarge 2x. With PyTorch and the Real-ESRGAN "general v3" weights
     available, a real-photo super-resolution model is used and blended with a
     plain enlargement so skin and fabric keep their natural texture; otherwise a
     careful classical enlargement (light denoise, Lanczos, gentle sharpening).

Videos can be trimmed: --trim START (seconds) keeps the clip from START onwards.

Setup (once, in any virtual environment):
  pip install pillow numpy opencv-python-headless
  pip install torch --index-url https://download.pytorch.org/whl/cpu        # optional
  # optional weights: realesr-general-x4v3.pth and realesr-general-wdn-x4v3.pth from
  # https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0, in --models DIR

Usage:
  python scripts/enhance.py photos/registry/"WhatsApp Image ….jpeg" … [--models DIR]
  python scripts/enhance.py photos/registry/video.mp4 --trim 20 --ffmpeg /path/to/ffmpeg
"""
import argparse
import os
import shutil
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTOS = os.path.join(ROOT, 'photos')
OUT = os.path.join(PHOTOS, 'enhanced')


def out_path(src, ext):
    rel = os.path.relpath(os.path.abspath(src), PHOTOS)
    if rel.startswith('..'):
        sys.exit(f'{src} is not inside the photos folder')
    return os.path.join(OUT, os.path.splitext(rel)[0] + ext)


# ---------------------------------------------------------------- tone

def repair_tone(rgb):
    """Stretch the levels of washed-out photos and restore some colour. uint8 RGB in and out."""
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0]
    lo, hi = np.percentile(L, [0.5, 99.6])
    target_lo, target_hi = 6.0, 252.0
    notes = []
    if lo > 16 or hi < 238:
        # Move 70% of the way towards full range: firm blacks without crushing dark skin.
        new_lo = lo + (target_lo - lo) * 0.7 if lo > 16 else lo
        new_hi = hi + (target_hi - hi) * 0.7 if hi < 238 else hi
        L = (L - lo) * (new_hi - new_lo) / max(hi - lo, 1) + new_lo
        notes.append(f'levels {lo:.0f}-{hi:.0f} -> {new_lo:.0f}-{new_hi:.0f}')
    # Haze: low overall contrast. Add local contrast in proportion to how flat the photo is.
    spread = float(L.std())
    haze = min(0.45, max(0.0, (64 - spread) / 30))
    if haze > 0.02:
        clahe = cv2.createCLAHE(clipLimit=1.6, tileGridSize=(8, 8))
        local = clahe.apply(np.clip(L, 0, 255).astype(np.uint8)).astype(np.float32)
        L = L * (1 - haze) + local * haze
        notes.append(f'clarity {haze:.2f}')
    # Haze fades colour too. Restore a little, only on hazy photos: white dresses and
    # pale walls look colourless without being faded, and boosting them reddens skin.
    a, b = lab[..., 1] - 128, lab[..., 2] - 128
    if haze > 0.02:
        boost = 1 + min(0.1, haze * 0.4)
        a, b = a * boost, b * boost
        notes.append(f'colour +{(boost - 1) * 100:.0f}%')
    lab[..., 0] = np.clip(L, 0, 255)
    lab[..., 1] = np.clip(a + 128, 0, 255)
    lab[..., 2] = np.clip(b + 128, 0, 255)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB), notes


# ---------------------------------------------------------------- enlargement

def load_model(models_dir, denoise):
    """Real-ESRGAN general v3 (SRVGGNetCompact), blended between its two published weights."""
    try:
        import torch
        from torch import nn
        from torch.nn import functional as F
    except ImportError:
        return None
    paths = [os.path.join(models_dir or '', n) for n in ('realesr-general-x4v3.pth', 'realesr-general-wdn-x4v3.pth')]
    if not all(os.path.exists(p) for p in paths):
        return None

    class SRVGGNetCompact(nn.Module):
        def __init__(self, feat=64, convs=32, scale=4):
            super().__init__()
            self.scale = scale
            body = [nn.Conv2d(3, feat, 3, 1, 1), nn.PReLU(feat)]
            for _ in range(convs):
                body += [nn.Conv2d(feat, feat, 3, 1, 1), nn.PReLU(feat)]
            body.append(nn.Conv2d(feat, 3 * scale * scale, 3, 1, 1))
            self.body = nn.ModuleList(body)
            self.up = nn.PixelShuffle(scale)

        def forward(self, x):
            out = x
            for layer in self.body:
                out = layer(out)
            return self.up(out) + F.interpolate(x, scale_factor=self.scale, mode='nearest')

    def weights(p):
        state = torch.load(p, map_location='cpu', weights_only=True)
        return state.get('params_ema', state.get('params', state))

    strong, weak = weights(paths[0]), weights(paths[1])
    blended = {k: strong[k] * denoise + weak[k] * (1 - denoise) for k in strong}
    net = SRVGGNetCompact()
    net.load_state_dict({k.replace('upsampler', 'up'): v for k, v in blended.items()}, strict=True)
    net.eval()
    torch.set_num_threads(os.cpu_count() or 4)

    def run(rgb, tile=400, pad=12):
        img = torch.from_numpy(rgb.astype(np.float32) / 255).permute(2, 0, 1)[None]
        _, _, h, w = img.shape
        out = torch.zeros(1, 3, h * 4, w * 4)
        with torch.inference_mode():
            for y in range(0, h, tile):
                for x in range(0, w, tile):
                    y0, x0 = max(y - pad, 0), max(x - pad, 0)
                    y1, x1 = min(y + tile + pad, h), min(x + tile + pad, w)
                    res = net(img[:, :, y0:y1, x0:x1])
                    ty, tx = (y - y0) * 4, (x - x0) * 4
                    th, tw = (min(y + tile, h) - y) * 4, (min(x + tile, w) - x) * 4
                    out[:, :, y * 4:y * 4 + th, x * 4:x * 4 + tw] = res[:, :, ty:ty + th, tx:tx + tw]
        return (out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)

    return run


def classical_2x(rgb):
    """Light denoise of JPEG blocking, Lanczos 2x, then gentle luminance-only sharpening."""
    clean = cv2.fastNlMeansDenoisingColored(rgb, None, 2, 3, 5, 15)
    big = cv2.resize(clean, (rgb.shape[1] * 2, rgb.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
    lab = cv2.cvtColor(big, cv2.COLOR_RGB2LAB).astype(np.float32)
    L = lab[..., 0]
    blur = cv2.GaussianBlur(L, (0, 0), 1.4)
    detail = L - blur
    mask = np.abs(detail) > 2.5  # leave flat skin and sky alone
    lab[..., 0] = np.clip(L + 0.7 * detail * mask, 0, 255)
    return cv2.cvtColor(lab.astype(np.uint8), cv2.COLOR_LAB2RGB)


def enlarge(rgb, model, blend):
    plain = cv2.resize(rgb, (rgb.shape[1] * 2, rgb.shape[0] * 2), interpolation=cv2.INTER_LANCZOS4)
    if model is None:
        return classical_2x(rgb), 'classical 2x'
    x4 = model(rgb)
    x2 = cv2.resize(x4, (rgb.shape[1] * 2, rgb.shape[0] * 2), interpolation=cv2.INTER_AREA)
    # Keep some of the photograph's own texture so the model never looks painted.
    out = cv2.addWeighted(x2, 1 - blend, plain, blend, 0)
    return out, f'Real-ESRGAN 2x (blend {blend:.2f})'


# ---------------------------------------------------------------- main

def enhance_image(src, model, blend, max_side, tone=True):
    im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    rgb = np.asarray(im)
    rgb, notes = repair_tone(rgb) if tone else (rgb, [])
    if max(rgb.shape[:2]) * 2 <= max_side:
        rgb, how = enlarge(rgb, model, blend)
        notes.append(how)
    dest = out_path(src, '.jpg')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    Image.fromarray(rgb).save(dest, quality=93, subsampling=0, optimize=True)
    return dest, notes


def trim_video(src, start, ffmpeg):
    dest = out_path(src, '.mp4')
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    cmd = [ffmpeg, '-v', 'error', '-y', '-ss', str(start), '-i', src, '-map_metadata', '-1',
           # Phone clips are already compressed and grainy: a moderate quality with a bitrate
           # cap keeps the trimmed clip no larger, per second, than the original.
           '-c:v', 'libx264', '-crf', '26', '-maxrate', '1200k', '-bufsize', '2400k', '-preset', 'slow', '-pix_fmt', 'yuv420p',
           '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dest]
    subprocess.run(cmd, check=True)
    return dest, [f'trimmed from {start}s']


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('files', nargs='+')
    p.add_argument('--models', help='folder holding the Real-ESRGAN general v3 weights')
    p.add_argument('--denoise', type=float, default=0.5, help='0 keeps grain, 1 removes most noise (default 0.5)')
    p.add_argument('--blend', type=float, default=0.25, help='share of plain enlargement mixed back in (default 0.25)')
    p.add_argument('--max-side', type=int, default=2600, help='only enlarge photos whose long side doubled stays within this')
    p.add_argument('--keep-tone', action='store_true', help='enlarge only: leave colours as they are (designed cards, graphics)')
    p.add_argument('--trim', type=float, help='videos: start the clip this many seconds in')
    p.add_argument('--ffmpeg', default=shutil.which('ffmpeg') or 'ffmpeg')
    args = p.parse_args()

    model = None
    if any(f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) for f in args.files):
        model = load_model(args.models, args.denoise)
        print('Enlarging with', 'Real-ESRGAN general v3' if model else 'the classical method (no model found)')
    for f in args.files:
        if f.lower().endswith(('.mp4', '.mov', '.m4v')):
            if args.trim is None:
                print(f'  skip {f}: videos are only changed with --trim')
                continue
            dest, notes = trim_video(f, args.trim, args.ffmpeg)
        else:
            dest, notes = enhance_image(f, model, args.blend, args.max_side, tone=not args.keep_tone)
        print(f'  {os.path.relpath(dest, ROOT)}  ({", ".join(notes) or "unchanged"})')


if __name__ == '__main__':
    main()
