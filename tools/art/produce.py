"""The shapes of the produce, as surfaces for engrave.py. Every shape is built around the origin at
unit size (y down, z towards the viewer), then placed into a picture with engrave.place()."""
import math
import numpy as np
from engrave import unit, rot, place, Surface, revolve

TAU = 2 * math.pi


def angdist(a, b):
    return np.abs((a - b + math.pi) % TAU - math.pi)


# ---- tomato (ribbed Vesuvio / costoluto) --------------------------------------------------------
def tomato_fn(seed=1, ribs=8, squat=0.8, groove=0.11, dimple=0.24):
    r = np.random.default_rng(seed)
    ang = (np.arange(ribs) + r.uniform(-.18, .18, ribs)) / ribs * TAU
    amp = 1 + r.uniform(-.05, .05, ribs)
    ph1, ph2 = r.uniform(0, TAU, 2)
    def lobe(th):
        # each lobe a soft swelling between two grooves; the fruit a little lopsided
        g = sum(np.exp(-(angdist(th, a) / 0.13) ** 2) for a in ang)
        return g, 1 + 0.045 * np.sin(2 * th + ph1) + 0.03 * np.sin(3 * th + ph2)
    def f(u, v):
        th = u * TAU; ph = v * math.pi
        g, a = lobe(th)
        prof = np.exp(-((ph - 0.26 * math.pi) / 0.45) ** 2)           # grooves deep at the shoulders, gone by the base
        rr = (1 - groove * prof * g) * (1 + (a - 1) * np.sin(ph))
        x = rr * np.sin(ph) * np.cos(th)
        z = rr * np.sin(ph) * np.sin(th)
        y = -np.cos(ph) * squat + dimple * np.exp(-(ph / 0.5) ** 2) * squat
        y = y - 0.05 * np.exp(-((math.pi - ph) / 0.4) ** 2)              # a slightly flattened base
        return np.stack([x, y, z], -1)
    f.ribs = ang
    return f


def sepal_fn(tom, alpha, length=0.62, width=0.075, curl=0.3, seed=0):
    """one sepal of the calyx, lying on the shoulder of the fruit and curling up at its tip"""
    r = np.random.default_rng(seed)
    tw = r.uniform(-.3, .3)
    def f(s, w):
        w = w * 2 - 1
        ph = 0.03 + s * length
        rad = np.sin(np.maximum(ph, .05))
        wd = width * np.sin(math.pi * np.clip(s, 0, 1) ** 0.55) * (1 - 0.15 * s)
        th = alpha + w * wd / rad + tw * s * s * 0.5 + 0.04 * np.sin(s * 7 + seed * 2) * s
        p = tom(th / TAU, ph / math.pi)
        s = np.clip(s, 0, 1)
        lift = 0.015 + curl * s ** 2.2 + 0.025 * np.sin(s * 9 + seed) * s      # crinkled, tip lifting a little
        up = np.array([0, -1, 0])
        out = unit(p * np.array([1, 0, 1]) + 1e-6)
        q = p * 1.01 + up * lift[..., None] * 0.9 + out * lift[..., None] * 0.25
        q = q + up * (0.02 * (1 - w * w))[..., None]                                  # a raised midrib
        return q
    return f


def stem_fn(length=0.32, radius=0.055, bend=0.12, top=-0.62):
    def f(u, v):
        a = u * TAU
        y = top - v * length
        x = bend * v * v
        rr = radius * (1 + 0.5 * np.exp(-(v / 0.15) ** 2))
        return np.stack([x + rr * np.cos(a), y + 0 * a, rr * np.sin(a)], -1)
    return f


def tomato_cut_face(tom, ph_cut, rings=0.12):
    """the cut face of a halved tomato: a flat section through the fruit at angle ph_cut"""
    def f(u, s):
        th = u * TAU
        edge = tom(u, np.full_like(u, ph_cut / math.pi))
        y = edge[..., 1]
        x = edge[..., 0] * s; z = edge[..., 2] * s
        return np.stack([x, y, z], -1)
    return f


# ---- general shapes ------------------------------------------------------------------------------
def frame_along(path, t, h=1e-3):
    """tangent / normal / binormal along a 3D path (a frame that turns smoothly with it)"""
    tg = unit(path(t + h) - path(t - h))
    ref = np.broadcast_to(np.array([0, 0, 1.0]), tg.shape)
    alt = np.broadcast_to(np.array([1.0, 0, 0]), tg.shape)
    ref = np.where(np.abs((tg * ref).sum(-1, keepdims=True)) > .95, alt, ref)
    nb = unit(np.cross(tg, ref))
    bn = np.cross(tg, nb)
    return tg, nb, bn


def tube(path, radius, ribs=0, rib_depth=0.0, flat=1.0):
    """a stalk, spear or body swept along path(t); radius(t) (or radius(t, angle)); u = round, v = along"""
    def f(u, v):
        a = u * TAU
        c = path(v)
        tg, nb, bn = frame_along(path, v)
        r = radius(v, a) if radius.__code__.co_argcount - len(radius.__defaults__ or ()) == 2 else radius(v)
        if ribs:
            r = r * (1 - rib_depth * (0.5 - 0.5 * np.cos(ribs * a)) ** 2)
        return c + nb * (r * np.cos(a))[..., None] + bn * (r * flat * np.sin(a))[..., None]
    return f


def line3(*pts):
    """a smooth path through control points (Catmull-Rom), t in 0..1"""
    P = np.array(pts, float)
    n = len(P) - 1
    def path(t):
        t = np.clip(np.asarray(t, float), 0, 1) * n
        i = np.minimum(np.floor(t).astype(int), n - 1); f = (t - i)[..., None]
        p0 = P[np.maximum(i - 1, 0)]; p1 = P[i]; p2 = P[i + 1]; p3 = P[np.minimum(i + 2, n)]
        return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * f ** 3)
    return path


def leaf(length=1.0, width=0.45, shape=None, cup=0.18, bend=0.15, twist=0.0, wave=0.0, waves=6, pucker=0.0,
         veins=7, fold=0.0, seed=0):
    """a leaf lying along +x from its stalk at the origin, facing the viewer (z).
    u = along the midrib (0 stalk .. 1 tip), v = across (0 one edge .. 1 the other)."""
    r = np.random.default_rng(seed)
    shape = shape or (lambda s: np.sin(math.pi * np.clip(s, 0, 1) ** 0.75) ** 0.9)
    def f(s, v):
        w = v * 2 - 1
        hw = width * shape(s)
        x = s * length
        y = w * hw
        z = cup * (w * w) * hw * -1 + bend * s * s * length - fold * np.abs(w) * hw
        z = z + wave * hw * np.sin(waves * math.pi * s + w * 2) * np.abs(w) ** 1.5
        if pucker:
            vs = np.abs(np.sin(veins * math.pi * (s - 0.25 * np.abs(w))))
            z = z + pucker * hw * vs * (1 - np.abs(w)) * np.abs(w) * 2
        ang = twist * s
        y2 = y * np.cos(ang) - z * np.sin(ang); z2 = y * np.sin(ang) + z * np.cos(ang)
        return np.stack([x, y2, z2], -1)
    f.length, f.width = length, width
    return f


def chevron(slant=0.22):
    """hatching across a leaf, each line running from the midrib out to the edge like the veins"""
    def g(c, t):
        w = t * 2 - 1
        return c * (1 + slant) - slant + slant * np.abs(w), t
    return g


def leaf_veins(sc, k, n=7, slant=0.22, w_mid=1.6, w_side=0.9, start=0.08):
    """midrib and side veins drawn on leaf surface k"""
    s = np.linspace(0, 0.97, 200)
    sc.curve(k, s, np.full_like(s, .5), lambda d: w_mid * (1 - 0.6 * s), taper=20)
    for i in range(n):
        c = start + (i + 0.5) / n * (0.9 - start)
        for side in (-1, 1):
            t = np.linspace(0, 0.86, 60)
            sc.curve(k, np.clip(c + slant * t ** 0.8, 0, 1), 0.5 + side * t / 2, w_side, taper=12)


# ---- scallop ------------------------------------------------------------------------------------
def scallop_shell(ribs=19, spread=1.32, dome=0.26, rib_amp=0.03, inside=False, seed=0):
    """a scallop valve: a round fan of ribs opening from the hinge at the origin towards -y (up the page).
    u = across the fan (0..1 = -spread..spread), v = from the hinge (0) to the rim (1)."""
    def f(u, v):
        th = (u * 2 - 1) * spread
        q = th / spread
        # the outline is nearly a circle through the hinge, so the sides curve in towards it
        rim = np.cos(th) ** 0.8 * (1 + 0.02 * np.cos(math.pi * ribs * q))
        r = v * rim
        x = r * np.sin(th) * 1.05
        y = -r * np.cos(th)
        rib = (np.cos(math.pi * ribs * q) * 0.5 + 0.5) ** 1.5
        z = dome * np.sin(math.pi * np.clip(v, 0, 1) * 0.6) ** 0.9 * np.cos(q * math.pi / 2) ** 0.35
        z = z + rib_amp * rib * np.clip(v, 0, 1) ** 0.8
        if inside:
            z = -z
        return np.stack([x, y, z], -1)
    f.spread, f.ribs = spread, ribs
    return f


def scallop_ear(side=1, size=0.24):
    """the flat wing (auricle) beside the hinge: a small triangle-ish flap along the straight hinge line"""
    def f(u, v):
        x = side * u * size * (1 - 0.2 * v)
        y = 0.01 - v * size * 0.75 * (1 - 0.55 * u) - 0.04 * u * v
        z = 0.015 + 0.03 * v * (1 - u) + 0.01 * np.sin(u * 14) * v
        return np.stack([x, y, z], -1)
    return f


def puck(radius=0.3, height=0.14, bulge=0.25):
    """a round scallop muscle (or any short soft cylinder): u round, v from top centre over the side"""
    def f(u, v):
        a = u * TAU
        # v 0..0.4 across the top, 0.4..1 down the side
        top = v < 0.4
        rr = np.where(top, radius * (v / 0.4) ** 0.9, radius * (1 + bulge * 0.25 * np.sin(math.pi * (v - .4) / .6)))
        rr = np.where(top, rr * (1 - 0.06 * (v / 0.4) ** 6), rr)
        y = np.where(top, -height / 2 - 0.03 * (1 - (v / .4) ** 2), -height / 2 + height * (v - .4) / .6)
        return np.stack([rr * np.cos(a), y, rr * np.sin(a)], -1)
    return f


# ---- squash, pumpkin --------------------------------------------------------------------------
def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def butternut_profile(length=2.0, neck=0.3, bulb=0.52):
    """radius along a butternut squash, v = 0 at the stalk end, 1 at the blossom end"""
    c1 = 1 - bulb / length * 0.95          # where the round blossom end begins
    c0 = neck / length * 0.55              # where the domed stalk end finishes
    def prof(v):
        v = np.clip(v, 0, 1)
        r = neck + (bulb - neck) * smoothstep(0.42, 0.8, v)
        r = r * (1 + 0.03 * np.sin(v * 7))
        r = r * np.where(v > c1, np.sqrt(np.clip(1 - ((v - c1) / (1 - c1)) ** 2, 0, 1)), 1)
        r = r * np.where(v < c0, np.sqrt(np.clip(1 - ((c0 - v) / c0) ** 2, 0, 1)) * 0.75 + 0.25, 1)
        return r, -length / 2 + v * length
    return prof


def butternut(length=2.0, neck=0.3, bulb=0.52, half=False):
    """u round (0..1, or 0..0.5 for the back half of a halved squash), v from stalk to blossom end"""
    prof = butternut_profile(length, neck, bulb)
    def f(u, v):
        r, y = prof(v)
        a = u * TAU * (0.5 if half else 1) + (math.pi if half else 0)
        return np.stack([r * np.cos(a), y + 0 * a, r * np.sin(a)], -1)
    f.prof = prof
    return f


def butternut_face(length=2.0, neck=0.3, bulb=0.52):
    """the flat cut face of a squash halved lengthwise; u across (-1..1), v along"""
    prof = butternut_profile(length, neck, bulb)
    def f(u, v):
        r, y = prof(v)
        return np.stack([(u * 2 - 1) * r * 0.995, y + 0 * u, 0 * u + 0.002], -1)
    return f


def pumpkin(ribs=10, squat=0.72, depth=0.08, top_dip=0.22, seed=0):
    """a round, deeply ribbed pumpkin (u round, v top to bottom)"""
    r = np.random.default_rng(seed)
    ph1 = r.uniform(0, TAU)
    def f(u, v):
        th = u * TAU; ph = np.clip(v, 0, 1) * math.pi
        rib = np.abs(np.cos(ribs * th / 2)) ** 0.6
        rr = (1 - depth * (1 - rib) * np.sin(ph) ** 0.5) * (1 + 0.04 * np.sin(2 * th + ph1))
        x = rr * np.sin(ph) * np.cos(th); z = rr * np.sin(ph) * np.sin(th)
        y = -np.cos(ph) * squat + top_dip * np.exp(-(ph / 0.42) ** 2) - 0.12 * np.exp(-((math.pi - ph) / 0.35) ** 2)
        return np.stack([x, y, z], -1)
    f.ribs = ribs
    return f


def palmate_leaf(lobes=5, depth=0.3, cup=0.1, wave=0.04, notch=0.7, seed=0):
    """a broad lobed leaf (squash, courgette, vine) with its stalk at the origin, lying in x/y and
    opening towards -y. u = angle round the stalk (0..1), v = from the stalk to the edge."""
    r = np.random.default_rng(seed)
    amax = math.pi - notch / 2
    veins = np.linspace(-amax * 0.8, amax * 0.8, lobes) + r.uniform(-.06, .06, lobes)
    lens = 1 - 0.32 * (np.abs(veins) / math.pi) ** 1.3 + r.uniform(-.05, .05, lobes)
    wdt = (veins[1] - veins[0]) * 0.42
    def f(u, v):
        a = (u * 2 - 1) * amax
        g = np.stack([L * np.exp(-((a - c) / wdt) ** 2) for c, L in zip(veins, lens)], 0).max(0)
        R = (1 - depth) * (0.8 + 0.2 * np.cos(a / 2)) + depth * g
        R = R * (1 + 0.025 * np.sin(a * 31 + seed))          # toothed edge
        rr = np.clip(v, 0, 1) * R
        x = rr * np.sin(a); y = -rr * np.cos(a)
        z = -cup * (rr ** 2) + wave * np.sin(a * 7 + v * 5) * v ** 2
        return np.stack([x, y, z], -1)
    f.veins, f.amax = veins, amax
    return f


def tendril(turns=2.6, lead=0.7, seed=0):
    """a curling tendril: a gently curving lead that winds into a tightening coil (path, t 0..1)"""
    r = np.random.default_rng(seed)
    a = np.linspace(0, turns * TAU, 80)
    R = 0.16 * (1 - 0.75 * a / a[-1])
    coil = np.stack([lead + R * np.sin(a), -0.16 + R * np.cos(a), 0.03 * np.sin(a * .5)], -1)
    head = np.array([[0, 0, 0], [lead * .35, -.1 + r.uniform(-.04, .04), 0], [lead * .75, -.06, 0.01]])
    return line3(*np.vstack([head, coil[1:]]))


# ---- beetroot ------------------------------------------------------------------------------------
def beet_profile(body=0.5, root=1.1, squash_=1.0):
    """radius along a beetroot: v 0 at the crown, 1 at the tip of the tap root"""
    top = -body * 0.92 * squash_
    bottom = body * 0.9 + root
    def prof(v):
        v = np.clip(v, 0, 1)
        y = top + v * (bottom - top)
        ys = y / squash_
        rs = np.sqrt(np.clip(body ** 2 - (ys * 1.0) ** 2, 0, None))
        rr = 0.085 * np.clip(1 - (y - body * .4) / (bottom - body * .4), 0, 1) ** 1.4
        r = (rs ** 4 + rr ** 4) ** 0.25
        r = r * (1 + 0.025 * np.sin(v * 17))
        r = np.where(v < 0.03, r * np.sqrt(np.clip(v / 0.03, 0, 1)), r)
        return r, y
    prof.top = top
    return prof


def solid(prof, half=False):
    """surface of revolution for a profile function prof(v) -> (radius, y); the back half only if half"""
    def f(u, v):
        r, y = prof(v)
        a = u * TAU * (0.5 if half else 1) + (math.pi if half else 0)
        return np.stack([r * np.cos(a), y + 0 * a, r * np.sin(a)], -1)
    return f


def solid_face(prof):
    """the flat face of a solid cut in half through its axis: u across, v along"""
    def f(u, v):
        r, y = prof(v)
        return np.stack([(u * 2 - 1) * r * 0.995, y + 0 * u, 0 * u + 0.002], -1)
    return f


def ribbon(path, width, normal_hint=(0, 0, 1), cup=0.0, twist=None):
    """a strap along a 3D path: v along, u across (0..1). width(v) is the half-width; the strap
    faces normal_hint, cupped across by `cup` and optionally twisted along by twist(v) radians"""
    hint = np.asarray(normal_hint, float)
    def f(u, v):
        c = path(v)
        tg = unit(path(np.clip(v + 1e-3, 0, 1)) - path(np.clip(v - 1e-3, 0, 1)))
        side = unit(np.cross(tg, np.broadcast_to(hint, tg.shape)))
        nrm = np.cross(side, tg)
        if twist is not None:
            a = twist(v)[..., None]
            side, nrm = side * np.cos(a) + nrm * np.sin(a), nrm * np.cos(a) - side * np.sin(a)
        w = (u * 2 - 1)
        hw = width(v)
        return c + side * (w * hw)[..., None] - nrm * (cup * w * w * hw)[..., None]
    return f


# ---- radicchio di Treviso tardivo -----------------------------------------------------------------
def tardivo_leaf_path(length=1.0, lean=0.35, curl=1.9, phi=0.0, r0=0.05, sway=0.0):
    """centre line of one long leaf: rises from the base, leans out, then curls back in at the tip"""
    s = np.linspace(0, 1, 200)
    th = lean + 0.25 * s - curl * s ** 2.4             # angle from upright, + = outwards
    ds = length / 199
    r = r0 + np.cumsum(np.sin(th)) * ds
    y = -np.cumsum(np.cos(th)) * ds
    tw = sway * s ** 2
    P = np.stack([r * np.cos(phi + tw), y, r * np.sin(phi + tw)], -1)
    def path(t):
        t = np.clip(np.asarray(t, float), 0, 1) * 199
        i = np.minimum(np.floor(t).astype(int), 198); f = (t - i)[..., None]
        return P[i] * (1 - f) + P[i + 1] * f
    path.radial = np.array([math.cos(phi), 0, math.sin(phi)])
    return path


def tardivo_leaf(length=1.0, lean=0.35, curl=1.9, phi=0.0, width=0.085, seed=0):
    """a leaf of tardivo: a broad white rib with a narrow, frilled red blade along each side"""
    r = np.random.default_rng(seed)
    path = tardivo_leaf_path(length, lean, curl, phi, sway=r.uniform(-.3, .3))
    radial = path.radial
    def f(u, v):
        c = path(v)
        tg = unit(path(np.clip(v + 2e-3, 0, 1)) - path(np.clip(v - 2e-3, 0, 1)))
        side = unit(np.cross(tg, np.broadcast_to(radial, tg.shape)))
        nrm = np.cross(side, tg)
        w = u * 2 - 1
        hw = width * (1 - 0.55 * v) * (0.7 + 0.3 * np.sin(math.pi * np.clip(v, 0, 1) ** .5))
        hw = hw * np.where(v > .9, np.sqrt(np.clip((1 - v) / .1, 0, 1)) * .8 + .2, 1)
        frill = 0.25 * np.sin(v * 40 + w * 3 + seed) * np.clip(np.abs(w) - .55, 0, 1) / .45
        off = side * (w * hw)[..., None] + nrm * ((-0.6 * w * w + frill) * hw)[..., None]
        return c + off
    f.path = path
    return f
