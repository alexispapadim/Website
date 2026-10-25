"""Turn a finished drawing (dark ink or pencil on light paper, any size) into the site's art format:
a white ink mask art-NAME.webp (900x1272, tinted by CSS) and, for menus, its draw-in growth map.

    python3 import_art.py drawing.png NAME [--box x0 y0 x1 y1] [--card] [--from x y]

--box   where the drawing sits on the 900x1272 canvas, as fractions (default: centred, 6% margin)
--card  card art only, so no growth map
--from  where the pen starts for the draw-in (fractions of the canvas, default bottom left)
--dark  light ink on a dark ground (gold on olive): the ink is what is brighter than the ground
--menu  keep the picture's layout: fit its width, then take the spare height out of empty rows
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageOps
from scipy import ndimage

W, H = 900, 1272
SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def ink_alpha(img, dark=False):
    """paper -> 0, darkest ink -> 255, with pencil greys kept as soft alpha"""
    g = np.asarray(ImageOps.grayscale(img.convert('RGB')), np.float32)
    if dark:
        ground = np.percentile(g, 40)
        top = np.percentile(g, 99.7)
        a = np.clip((g - ground - 7) / max(top - ground - 7, 1), 0, 1) ** 0.85
        return (a * 255).astype(np.uint8)
    if img.mode in ('RGBA', 'LA'):
        g = np.where(np.asarray(img.getchannel('A')) < 8, 255, g)
    paper = np.percentile(g, 90)
    ink = np.percentile(g, 0.5)
    a = np.clip((paper - 4 - g) / max(paper - ink, 1), 0, 1) ** 0.9
    return (a * 255).astype(np.uint8)


def place(alpha, box):
    x0, y0, x1, y1 = box
    bw, bh = (x1 - x0) * W, (y1 - y0) * H
    ys, xs = np.nonzero(alpha > 10)
    crop = alpha[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    s = min(bw / crop.shape[1], bh / crop.shape[0])
    im = Image.fromarray(crop).resize((max(1, round(crop.shape[1] * s)), max(1, round(crop.shape[0] * s))), Image.LANCZOS)
    out = Image.new('L', (W, H), 0)
    out.paste(im, (round(x0 * W + (bw - im.width) / 2), round(y0 * H + (bh - im.height) / 2)))
    return np.asarray(out)


def place_menu(alpha):
    """scale to the canvas width and close up empty rows (the open middle of a menu page) to fit"""
    h0, w0 = alpha.shape
    s = W / w0
    im = np.asarray(Image.fromarray(alpha).resize((W, round(h0 * s)), Image.LANCZOS))
    extra = im.shape[0] - H
    if extra > 0:
        empty = im.max(1) < 12
        # keep a margin of empty rows next to the drawing, drop from the middle of each empty run
        run = ndimage.binary_erosion(empty, iterations=40)
        idx = np.flatnonzero(run)
        if len(idx) >= extra:
            drop = idx[np.linspace(0, len(idx) - 1, extra).astype(int)]
            im = np.delete(im, drop, axis=0)
        else:
            im = np.delete(im, idx, axis=0)
            q = Image.fromarray(im); q = q.resize((round(q.width * H / q.height), H), Image.LANCZOS)
            out = Image.new('L', (W, H), 0); out.paste(q, ((W - q.width) // 2, 0)); im = np.asarray(out)
    elif extra < 0:
        out = np.zeros((H, W), np.uint8); out[-extra // 2:-extra // 2 + im.shape[0]] = im; im = out
    return im


def growth(alpha, start):
    """the pen travels through the ink from the start point: time = distance along the drawing"""
    a = np.asarray(Image.fromarray(alpha).resize((W // 2, H // 2), Image.BILINEAR))
    ink = a > 6
    reach = ndimage.binary_dilation(ink, iterations=6)            # let it hop small gaps between strokes
    sy, sx = int(start[1] * (H // 2 - 1)), int(start[0] * (W // 2 - 1))
    seed = np.zeros_like(ink); seed[sy, sx] = True
    if not reach[sy, sx]:
        ys, xs = np.nonzero(reach)
        k = np.argmin((ys - sy) ** 2 + (xs - sx) ** 2); seed[sy, sx] = False; seed[ys[k], xs[k]] = True
    D = np.full(ink.shape, np.inf)
    D[seed] = 0
    lab, n = ndimage.label(reach)
    # geodesic distance by repeated dilation inside the ink; separate islands follow on in reading order
    t, front, done = 0, seed, seed.copy()
    while front.any():
        t += 1
        nxt = ndimage.binary_dilation(front) & reach & ~done
        D[nxt] = t; done |= nxt; front = nxt
        if not front.any() and (reach & ~done).any():
            ys, xs = np.nonzero(reach & ~done)
            k = np.argmin(ys * 0 + (xs - sx) ** 2 + (ys - sy) ** 2)
            front = np.zeros_like(ink); front[ys[k], xs[k]] = True; done |= front; D[front] = t
    T = np.where(np.isfinite(D), D / max(t, 1), 1)
    R = np.where(ink, np.clip(T, 0, .99) * 255, 255).astype(np.uint8)
    return Image.merge('RGB', [Image.fromarray(R), Image.fromarray(np.zeros_like(R)), Image.fromarray(np.zeros_like(R))])


def main():
    args = sys.argv[1:]
    def opt(name, k):
        if name in args:
            i = args.index(name); v = [float(x) for x in args[i + 1:i + 1 + k]]; del args[i:i + 1 + k]; return v
    box = opt('--box', 4) or [.06, .06, .94, .94]
    start = opt('--from', 2) or [.1, .95]
    flags = {f: f in args for f in ('--card', '--dark', '--menu')}
    args = [a for a in args if a not in flags]
    card = flags['--card']
    src, name = args
    a = ink_alpha(Image.open(src), flags['--dark'])
    alpha = place_menu(a) if flags['--menu'] else place(a, box)
    white = Image.new('L', (W, H), 255)
    Image.merge('RGBA', [white, white, white, Image.fromarray(alpha)]).save(os.path.join(SITE, f'art-{name}.webp'), lossless=True)
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'drawn.json')
    index = json.load(open(index_path))
    ys, xs = np.nonzero(alpha > 20)
    entry = {'fruits': [], 'extent': [round(xs.min() / W, 3), round(ys.min() / H, 3), round(xs.max() / W, 3), round(ys.max() / H, 3)]}
    if not card:
        growth(alpha, start).save(os.path.join(SITE, f'art-{name}-grow.png'))
    index[name] = entry
    json.dump(index, open(index_path, 'w'), indent=1)
    print('imported', name, entry['extent'])


if __name__ == '__main__':
    main()
