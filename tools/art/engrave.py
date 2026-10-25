"""A small engraving engine for the menu drawings.

Each subject is built from 3D surfaces, f(u, v) -> (x, y, z) in canvas pixels (y down, z towards
the viewer). The engine renders a depth/id buffer so lines know what is in front of them, then
draws the surfaces the way an engraver would: hatching that follows the form and swells in the
shadows, cross-hatching in the darkest parts, stipple for texture, and an ink outline wherever
one surface passes in front of another. The result is a white-on-transparent mask the same size
as the other art-*.webp files (900 x 1272), plus a growth map for the menu's draw-in animation.
"""
import math
import numpy as np
import cairo
from PIL import Image, ImageFilter
from scipy import ndimage

W, H = 900, 1272
SS = 2                                    # everything is drawn at twice the size, then reduced
LIGHT = np.array([-0.55, -0.75, 0.62]); LIGHT /= np.linalg.norm(LIGHT)
RNG = np.random.default_rng(7)


def unit(a):
    n = np.linalg.norm(a, axis=-1, keepdims=True)
    return a / np.maximum(n, 1e-9)


def rot(ax=0.0, ay=0.0, az=0.0):
    """rotation matrix: about x (tilt towards the viewer), then y (turn), then z (in the picture plane)"""
    cx, sx, cy, sy, cz, sz = math.cos(ax), math.sin(ax), math.cos(ay), math.sin(ay), math.cos(az), math.sin(az)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


def place(fn, R=None, at=(0, 0, 0), scale=1.0):
    """move a surface defined around the origin into the picture"""
    R = np.eye(3) if R is None else R
    at = np.asarray(at, float)
    def g(u, v):
        p = fn(u, v)
        q = np.einsum('ij,...j->...i', R, p) * scale + at
        return q
    return g


class Noise1:
    """smooth 1D noise, for the slight waver of a hand-drawn line"""
    def __init__(self, n=64, seed=0):
        r = np.random.default_rng(seed)
        self.v = r.uniform(-1, 1, n)
        self.n = n
    def __call__(self, x):
        x = np.asarray(x) % self.n
        i = np.floor(x).astype(int); f = x - i
        f = f * f * (3 - 2 * f)
        return self.v[i] * (1 - f) + self.v[(i + 1) % self.n] * f


class Surface:
    """one engraved surface.
    fn(u, v) -> (..., 3) points. hatch: list of line families, each a dict
      along: 'u' (lines run in u, one per v) | 'v' | callable(c, t) -> (u, v)
      n: number of lines, gap: optional minimum screen spacing instead of n
    tone: base darkness added everywhere (colour of the thing), dark/light extremes via gain.
    t: growth time function (u, v) -> 0..1 for the menu's draw-in animation.
    """
    def __init__(self, fn, hatch=None, tone=0.0, gain=1.0, grid=(260, 260), uv=((0, 1), (0, 1)),
                 cross=0.62, stipple=0.0, outline=1.0, t=None, wmax=3.2, thresh=0.13, mask=None,
                 shade=None, closed_u=False, fruit=0, jitter=0.7, rim=0.45, two_sided=True):
        self.fn, self.hatch = fn, hatch if hatch is not None else [dict(along='u', n=60)]
        self.tone, self.gain, self.grid, self.uv = tone, gain, grid, uv
        self.cross, self.stipple, self.outline = cross, stipple, outline
        self.t = t or (lambda u, v: np.zeros_like(u))
        self.wmax, self.thresh, self.mask, self.shade = wmax, thresh, mask, shade
        self.closed_u, self.fruit, self.jitter, self.rim = closed_u, fruit, jitter, rim

    def pts(self, u, v):
        (u0, u1), (v0, v1) = self.uv
        return self.fn(u0 + (u1 - u0) * u, v0 + (v1 - v0) * v)

    def normal(self, u, v, h=1e-3):
        p = self.pts(u, v)
        du = self.pts(u + h, v) - self.pts(u - h, v)
        dv = self.pts(u, v + h) - self.pts(u, v - h)
        n = unit(np.cross(du, dv))
        n = np.where(n[..., 2:3] < 0, -n, n)            # face the viewer
        return p, n

    def darkness(self, u, v, p=None, n=None):
        if n is None:
            p, n = self.normal(u, v)
        lam = 0.5 + 0.5 * (n * LIGHT).sum(-1)          # soft, wrapped light: most of the form stays mid-tone
        d = (1 - lam) ** 1.15 * 1.3 + self.rim * (1 - np.clip(n[..., 2], 0, 1)) ** 3
        d = d * self.gain + self.tone
        if self.shade is not None:
            d = d + self.shade(u, v, p, n)
        return np.clip(d, 0, 1.3)


class Scene:
    def __init__(self):
        self.items = []         # Surface objects, drawn with hidden-line removal
        self.extra = []         # callables(scene, ctx) for free strokes (seeds, veins…) drawn last
        self.shadows = []       # ground shadows: (cx, cy, rx, ry, strength, t)

    def add(self, s):
        self.items.append(s); return s

    # ---- depth / id / time buffers ------------------------------------------------------------
    def buffers(self):
        h, w = H * SS, W * SS
        Z = np.full(h * w, -1e9, np.float32)
        ID = np.zeros(h * w, np.int32)
        T = np.full(h * w, np.nan, np.float32)
        D = np.zeros(h * w, np.float32)
        for k, s in enumerate(self.items, 1):
            # sample finely enough that neighbouring samples are under a pixel apart on screen
            cu, cv = np.meshgrid(np.linspace(0, 1, 96), np.linspace(0, 1, 96), indexing='ij')
            cp = s.pts(cu, cv)[..., :2] * SS
            lu = np.linalg.norm(np.diff(cp, axis=0), axis=-1).max() * 95
            lv = np.linalg.norm(np.diff(cp, axis=1), axis=-1).max() * 95
            nu, nv = int(min(5000, max(64, lu * 0.95))), int(min(5000, max(64, lv * 0.95)))
            u, v = np.meshgrid(np.linspace(0, 1, nu), np.linspace(0, 1, nv), indexing='ij')
            p = s.pts(u, v)
            n = unit(np.cross(np.gradient(p, axis=0), np.gradient(p, axis=1)))
            n = np.where(n[..., 2:3] < 0, -n, n)
            if s.mask is not None:
                keep = s.mask(u, v)
            else:
                keep = np.ones(u.shape, bool)
            x = np.round(p[..., 0] * SS).astype(int); y = np.round(p[..., 1] * SS).astype(int)
            ok = keep & (x >= 0) & (y >= 0) & (x < w) & (y < h)
            if not ok.any():
                continue
            idx = (y * w + x)[ok]; z = p[..., 2][ok].astype(np.float32)
            tt = np.broadcast_to(s.t(u, v), u.shape)[ok]; dk = s.darkness(u, v, p, n)[ok]
            # splat to a 2x2 block so the surface has no pinholes
            for ox, oy in ((0, 0), (1, 0), (0, 1), (1, 1)):
                j = idx + oy * w + ox
                j = np.clip(j, 0, h * w - 1)
                o = np.lexsort((z, j))
                js, zs = j[o], z[o]
                last = np.r_[js[1:] != js[:-1], True]
                js, zs, ts, ds = js[last], zs[last], tt[o][last], dk[o][last]
                win = zs > Z[js]
                Z[js[win]] = zs[win]; ID[js[win]] = k; T[js[win]] = ts[win]; D[js[win]] = ds[win]
        self.Z, self.ID, self.T, self.D = (a.reshape(h, w) for a in (Z, ID, T, D))

    def visible(self, k, p, tol=3.0):
        h, w = self.Z.shape
        x = np.clip(np.round(p[..., 0] * SS).astype(int), 0, w - 1)
        y = np.clip(np.round(p[..., 1] * SS).astype(int), 0, h - 1)
        inside = (p[..., 0] * SS >= 0) & (p[..., 1] * SS >= 0) & (p[..., 0] * SS < w) & (p[..., 1] * SS < h)
        return inside & (self.ID[y, x] == k) & (p[..., 2] >= self.Z[y, x] - tol)

    # ---- drawing ----------------------------------------------------------------------------
    def stroke_run(self, ctx, P, Wd):
        """a line whose width follows Wd, filled as one ribbon with round ends"""
        if len(P) < 2:
            return
        Wd = np.asarray(Wd, float)
        d = np.gradient(P, axis=0)
        d = d / np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
        nrm = np.stack([-d[:, 1], d[:, 0]], -1) * (Wd[:, None] / 2)
        L, Rr = P + nrm, P - nrm
        ctx.move_to(*L[0])
        for x, y in L[1:]:
            ctx.line_to(x, y)
        for x, y in Rr[::-1]:
            ctx.line_to(x, y)
        ctx.close_path(); ctx.fill()
        for i in (0, -1):
            if Wd[i] > 0.4:
                ctx.arc(P[i, 0], P[i, 1], Wd[i] / 2, 0, 2 * math.pi); ctx.fill()

    def hatch_family(self, ctx, k, s, fam, cross=False):
        along = fam.get('along', 'u')
        n = fam.get('n', 60)
        m = fam.get('m', 500)
        off = fam.get('offset', 0.0)
        c = (np.arange(n) + 0.5 + off) / n
        t = np.linspace(0, 1, m)
        C, Tt = np.meshgrid(c, t, indexing='ij')
        if callable(along):
            u, v = along(C, Tt)
        elif along == 'u':
            u, v = Tt, C
        else:
            u, v = C, Tt
        inside = (u >= 0) & (u <= 1) & (v >= 0) & (v <= 1)
        u, v = np.clip(u, 0, 1), np.clip(v, 0, 1)
        p, nn = s.normal(u, v)
        d = s.darkness(u, v, p, nn)
        vis = self.visible(k, p) & inside
        if s.mask is not None:
            vis &= s.mask(u, v)
        lo = fam.get('lo', s.cross if cross else s.thresh)
        wmax = s.wmax * SS / 2 * fam.get('w', 0.6 if cross else 1.0)
        nz = Noise1(seed=k * 31 + (7 if cross else 0))
        for i in range(n):
            P = p[i, :, :2] * SS
            # hand waver: a small sideways drift along the line
            dirn = np.gradient(P, axis=0); dirn = unit(dirn)
            perp = np.stack([-dirn[:, 1], dirn[:, 0]], -1)
            wob = nz(np.linspace(0, 6, m) + i * 1.7)[:, None] * s.jitter * SS / 2
            P = P + perp * wob
            dd = d[i]
            on = vis[i] & (dd > lo)
            if not on.any():
                continue
            wd = np.clip((dd - lo) / (1 - lo + 1e-6), 0, 1) ** 0.85 * wmax
            wd = wd * (0.85 + 0.3 * (nz(np.linspace(0, 20, m) + i * 3.1) * 0.5 + 0.5))
            # split into runs, taper the ends a little like a burin entering and leaving
            edges = np.flatnonzero(np.diff(np.r_[0, on.astype(int), 0]))
            for a, b in zip(edges[::2], edges[1::2]):
                if b - a < 3:
                    continue
                L = b - a
                taper = np.minimum(1, np.minimum(np.arange(L) + 1, L - np.arange(L)) / 6)
                self.stroke_run(ctx, P[a:b], wd[a:b] * taper)

    def draw_stipple(self, ctx, k, s):
        if s.stipple <= 0:
            return
        r = np.random.default_rng(k * 101)
        N = int(s.stipple)
        u, v = r.random(N), r.random(N)
        p, n = s.normal(u, v)
        d = s.darkness(u, v, p, n)
        vis = self.visible(k, p)
        if s.mask is not None:
            vis &= s.mask(u, v)
        keep = vis & (r.random(N) < np.clip(d - 0.15, 0, 1) * 0.9)
        for (x, y), dd in zip(p[keep, :2] * SS, d[keep]):
            ctx.arc(x, y, (0.45 + 0.7 * dd) * SS / 2, 0, 2 * math.pi); ctx.fill()

    def curve(self, k, u, v, width, lo=0.0, taper=8, clear=False):
        """a free stroke on surface k (1-based) along the uv path, hidden where something is in front"""
        s = self.items[k - 1]
        u, v = np.asarray(u, float), np.asarray(v, float)
        def fx(scene, ctx):
            p, n = s.normal(u, v)
            vis = scene.visible(k, p, tol=6)
            d = s.darkness(u, v, p, n)
            wd = np.broadcast_to(np.asarray(width(d) if callable(width) else width, float), u.shape) * SS / 2
            P = p[:, :2] * SS
            if clear and vis.mean() > .5:
                # a closed shape that knocks out the shading behind it (a pale seed in dark flesh)
                ctx.save(); ctx.set_operator(cairo.OPERATOR_CLEAR)
                ctx.move_to(*P[0])
                for x, y in P[1:]:
                    ctx.line_to(x, y)
                ctx.close_path(); ctx.fill(); ctx.restore()
            on = vis & (d >= lo)
            edges = np.flatnonzero(np.diff(np.r_[0, on.astype(int), 0]))
            for a, b in zip(edges[::2], edges[1::2]):
                L = b - a
                if L < 3:
                    continue
                tp = np.minimum(1, np.minimum(np.arange(L) + 1, L - np.arange(L)) / taper)
                scene.stroke_run(ctx, P[a:b], wd[a:b] * tp)
        self.extra.append(fx)

    def outlines(self):
        """ink wherever one surface passes in front of another (or the paper)"""
        ID, Z, D = self.ID, self.Z, self.D
        e = np.zeros(ID.shape, bool)
        for dy, dx in ((0, 1), (1, 0), (1, 1), (1, -1)):
            a = ID; b = np.roll(np.roll(ID, -dy, 0), -dx, 1)
            za = Z; zb = np.roll(np.roll(Z, -dy, 0), -dx, 1)
            jump = (a != b) | (np.abs(za - zb) > 14)
            # put the line on the nearer surface
            near_a = za >= zb
            e |= jump & near_a & (a > 0)
            sh = jump & ~near_a & (b > 0)
            e |= np.roll(np.roll(sh, dy, 0), dx, 1)
        e[:, :3] = e[:, -3:] = False; e[:3] = e[-3:] = False      # no wrap-around at the picture's edge
        wt = np.zeros(ID.shape, np.float32)
        for k, s in enumerate(self.items, 1):
            wt[ID == k] = s.outline
        e &= wt > 0
        dark = np.clip(D, 0, 1)
        light = wt < 0.9                                  # fine parts (antennae, legs) keep a hairline
        thin = ndimage.binary_dilation(e, iterations=1)
        mid = ndimage.binary_dilation(e & (dark > 0.45) & ~light, iterations=2)
        thick = ndimage.binary_dilation(e & (dark > 0.8) & ~light, iterations=3)
        o = (thin | mid | thick).astype(np.float32)
        o = ndimage.gaussian_filter(o, 0.8)
        return np.clip(o * 1.6, 0, 1)

    def ground_shadow(self, ctx):
        for (cx, cy, rx, ry, st) in self.shadows:
            gap = 2.6 * SS
            ys = np.arange((cy - ry) * SS, (cy + ry) * SS, gap)
            nz = Noise1(seed=int(cx))
            for j, y in enumerate(ys):
                fy = (y / SS - cy) / ry
                half = rx * math.sqrt(max(0, 1 - fy * fy))
                xs = np.linspace((cx - half) * SS, (cx + half) * SS, max(4, int(half * 2)))
                fx = (xs / SS - cx) / max(rx, 1)
                dens = st * np.clip(1 - (fx ** 2 + fy ** 2), 0, 1) ** 0.8
                wd = dens * 1.5 * SS
                yy = y + nz(np.linspace(0, 3, len(xs)) + j) * 0.6 * SS
                xi = np.clip(xs.astype(int), 0, W * SS - 1); yi = np.clip(yy.astype(int), 0, H * SS - 1)
                free = self.ID[yi, xi] == 0
                wd = np.where(free, wd, 0)
                # broken, like a quick pen stroke
                brk = nz(np.linspace(0, 9, len(xs)) + j * 2.3) > -0.55
                self.stroke_run(ctx, np.stack([xs, yy], -1), np.where(brk, wd, 0))

    def render(self, out_png=None, preview=None, growth=None):
        self.buffers()
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W * SS, H * SS)
        ctx = cairo.Context(surf)
        ctx.set_source_rgba(1, 1, 1, 1)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        self.ground_shadow(ctx)
        for k, s in enumerate(self.items, 1):
            for j, fam in enumerate(s.hatch):
                self.hatch_family(ctx, k, s, fam, cross=fam.get('cross', False))
            self.draw_stipple(ctx, k, s)
        for fx in self.extra:
            fx(self, ctx)
        surf.flush()
        a = np.frombuffer(surf.get_data(), np.uint8).reshape(H * SS, W * SS, 4)[..., 3].astype(np.float32) / 255
        a = np.maximum(a, self.outlines())
        img = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'L').resize((W, H), Image.LANCZOS)
        self.alpha = np.asarray(img)
        rgba = Image.merge('RGBA', [Image.new('L', (W, H), 255)] * 3 + [img])
        if out_png:
            rgba.save(out_png)
        if preview:
            bg = Image.new('RGB', (W, H), (247, 243, 234))
            ink = Image.new('RGB', (W, H), (70, 64, 48))
            bg.paste(ink, (0, 0), img)
            bg.save(preview)
        if growth:
            self.growth_map(growth)
        return rgba

    # ---- growth map for the WebGL draw-in (same format as art-*-grow.png) ---------------------
    def growth_map(self, path):
        """R = when each pixel of ink is drawn (0..1, 255 = never), G = which fruit it belongs to
        (40 x number). Returns the fruit list for GROWMAP in app.js: anchor (where it swells from)
        and the moment the growth reaches it."""
        T = self.T.copy()
        have = ~np.isnan(T)
        # spread each surface's time a little past its edge so outlines and shadows pick it up
        idx = ndimage.distance_transform_edt(~have, return_distances=False, return_indices=True)
        Tf = T[idx[0], idx[1]]
        Tf = np.asarray(Image.fromarray(np.nan_to_num(Tf).astype(np.float32)).resize((W // 2, H // 2), Image.BILINEAR))
        ink = np.asarray(Image.fromarray(self.alpha).resize((W // 2, H // 2), Image.BILINEAR)) > 6
        R = np.where(ink, np.clip(Tf, 0, 0.99) * 255, 255).astype(np.uint8)
        G = np.zeros_like(R)
        lab = np.asarray(Image.fromarray(self.ID.astype(np.int32)).resize((W // 2, H // 2), Image.NEAREST))
        fruit_of = np.zeros(len(self.items) + 1, int)
        for i, s in enumerate(self.items, 1):
            fruit_of[i] = s.fruit
        F = fruit_of[lab]
        F = ndimage.grey_dilation(F, size=3)                 # take in the outline round each fruit
        fruits = []
        for f in range(1, 7):
            m = (F == f) & ink
            if not m.any():
                break
            G[m] = 40 * f
            ys, xs = np.nonzero(m)
            x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
            a = [round(float((x0 + x1) / 2 / (W // 2)), 3), round(float((y0 + .2 * (y1 - y0)) / (H // 2)), 3)]
            t = round(float(np.percentile(R[m], 8)) / 255, 3)
            fruits.append({'a': a, 't': t})
        Image.merge('RGB', [Image.fromarray(R), Image.fromarray(G), Image.fromarray(np.zeros_like(R))]).save(path)
        return fruits

    def frame(self):
        """the drawing's extent (fractions of the canvas), for framing it on a card"""
        ys, xs = np.nonzero(self.alpha > 20)
        return [round(float(xs.min()) / W, 3), round(float(ys.min()) / H, 3), round(float(xs.max()) / W, 3), round(float(ys.max()) / H, 3)]


def revolve(profile, turns=1.0):
    """surface of revolution: profile(v) -> (radius, y). u goes round, v down the profile"""
    def f(u, v):
        r, y = profile(v)
        a = u * 2 * math.pi * turns
        return np.stack([r * np.cos(a), y + 0 * a, r * np.sin(a)], -1)
    return f
