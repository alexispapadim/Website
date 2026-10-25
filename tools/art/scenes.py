"""The drawings themselves: each function builds one picture from the shapes in produce.py.
Run  python3 tools/art/scenes.py [name ...]  to redraw them (writes art-*.webp and art-*-grow.png
into the site folder; --preview writes ink-on-paper previews to the folder given instead)."""
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from engrave import Scene, Surface, place, rot, unit
from produce import *

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


def lin(a, b, x):
    return np.clip((x - a) / (b - a), 0, 1)


# ---- tomatoes ----------------------------------------------------------------------------------
def add_tomato(sc, at, size, R, seed=1, t0=0.0, t1=1.0, sepals=8, fruit=0, hatch_n=140):
    """a whole ribbed tomato with its calyx and stalk"""
    tom = tomato_fn(seed=seed, squat=.88, groove=.2)
    grow = lambda u, v: t0 + (t1 - t0) * (0.35 + 0.65 * v)
    k = len(sc.items) + 1
    sc.add(Surface(place(tom, R, at, size), hatch=[dict(along='u', n=hatch_n, m=900),
                                                   dict(along='v', n=int(hatch_n * 1.4), m=500, cross=True, lo=.72)],
                   tone=0.16, stipple=int(size * 40), wmax=4.0, t=grow, fruit=fruit))
    for a in tom.ribs:
        v = np.linspace(0.04, 0.6, 240)
        sc.curve(k, np.full_like(v, a / TAU), v,
                 lambda d, v=v: 0.2 + 3.2 * np.clip(d + .2, 0, 1) * np.exp(-((v - .18) / .2) ** 2))
    rng = np.random.default_rng(seed + 11)
    for j in range(sepals):
        a = j / sepals * TAU + rng.uniform(-.25, .25)
        sc.add(Surface(place(sepal_fn(tom, a, length=rng.uniform(.32, .5), width=.08, curl=.1, seed=j + seed), R, at, size),
                       hatch=[dict(along='u', n=7, m=200)], tone=0.38, thresh=.2, t=lambda u, v: t0 + (t1 - t0) * 0.2 * u))
    sc.add(Surface(place(stem_fn(top=-0.88 * 0.76 + 0.03, length=.2, radius=.05, bend=.1 * (1 if seed % 2 else -1)), R, at, size),
                   hatch=[dict(along='v', n=34, m=100)], tone=0.28, t=lambda u, v: t0 + 0 * u))
    return tom


def add_tomato_half(sc, at, size, R, seed=2, t0=0.0, t1=1.0, fruit=0):
    """a tomato cut across its middle, lying cut face up: skin below, locules full of seeds on top"""
    tom = tomato_fn(seed=seed, squat=.88, groove=.2)
    ph_c = 0.47 * math.pi
    grow = lambda u, v: t0 + (t1 - t0) * (0.4 + 0.6 * v)
    sc.add(Surface(place(tom, R, at, size), uv=((0, 1), (ph_c / math.pi, 1)),
                   hatch=[dict(along='u', n=80, m=900), dict(along='v', n=180, m=300, cross=True, lo=.72)],
                   tone=0.12, stipple=int(size * 25), wmax=3.8, t=grow, fruit=fruit))
    n = len(tom.ribs)
    septa = np.sort(tom.ribs)
    r = np.random.default_rng(seed * 31)
    # each locule: a rounded pocket of jelly between two walls, drawn in face coordinates
    # (angle round the face, distance from the middle); seeds sit along its inner side
    locs = []
    for i, a in enumerate(septa):
        b = septa[(i + 1) % n] + (TAU if i == n - 1 else 0)
        tm = (a + b) / 2 + r.uniform(-.05, .05)
        ri, ro = .2 + r.uniform(0, .06), .8 + r.uniform(-.05, .02)
        sm, hs = (ri + ro) / 2, (ro - ri) / 2
        t = np.linspace(0, TAU, 160, endpoint=False)
        c, si = np.cos(t), np.sin(t)
        ss = sm + hs * np.sign(c) * np.abs(c) ** 0.7
        half = np.maximum((0.6 * ss + 0.4 * sm) * (b - a) / 2 - 0.045, 0.01) * (0.95 + 0.1 * r.random())
        across = half * np.sign(si) * np.abs(si) ** 0.7
        th = tm + across / ss
        locs.append((th, ss, tm, sm, hs, float(half.max())))
    tex = Image.new('L', (1024, 1024), 0)
    from PIL import ImageDraw
    dr = ImageDraw.Draw(tex)
    for th, ss, *_ in locs:
        for off in (-1, 0, 1):
            dr.polygon(list(zip((th / TAU + off) * 1024, ss * 1024)), fill=255)
    tex = np.asarray(tex.filter(ImageFilter.GaussianBlur(3))) / 255.0
    def face_shade(u, s, p, nn):
        g = tex[np.clip((s * 1023).astype(int), 0, 1023), np.clip((u % 1 * 1023).astype(int), 0, 1023)]
        return g * (0.75 - 0.3 * s) - (1 - g) * 0.5
    face = tomato_cut_face(tom, ph_c)
    kf = len(sc.items) + 1
    sc.add(Surface(place(face, R, at, size), hatch=[dict(along='u', n=70, m=1000)], gain=0.35, tone=0.0,
                   shade=face_shade, stipple=int(size * 80), outline=1.0, thresh=.22, wmax=2.8,
                   t=lambda u, v: t0 + (t1 - t0) * (0.5 + 0.5 * v)))
    for li, (th, ss, tm, sm, hs, half) in enumerate(locs):
        sc.curve(kf, np.r_[th, th[:1]] / TAU % 1, np.r_[ss, ss[:1]], 1.2, taper=1)
        for _ in range(11):
            q = r.uniform(-.75, .75)
            sd = sm - hs * r.uniform(-.1, .6) * (1 - .5 * q * q)
            ts = tm + q * half / sd * 0.7
            ang = ts + math.pi / 2 + r.uniform(-.5, .5)
            e = np.linspace(0, TAU, 24)
            ex, ey = 0.036 * np.cos(e), 0.022 * np.sin(e)
            dx = ex * math.cos(ang) - ey * math.sin(ang); dy = ex * math.sin(ang) + ey * math.cos(ang)
            px = sd * np.cos(ts) + dx; py = sd * np.sin(ts) + dy
            sc.curve(kf, (np.arctan2(py, px) / TAU) % 1, np.hypot(px, py), 1.3, taper=1)
    # the thin skin round the cut edge
    u = np.linspace(0, 1, 600)
    sc.curve(kf, u, np.full_like(u, .93), 0.7, taper=1)
    return tom



# ---- leaves and stalks -------------------------------------------------------------------------
def add_leaf(sc, at, angle, size, lf=None, tilt=(0.0, 0.0), t0=0.0, t1=0.3, veins=6, tone=0.18, n=None,
             vein_w=(2.4, 1.1), slant=0.22, depth=0.0, stipple=0, fruit=0):
    """a leaf whose stalk sits at `at`, pointing at `angle` (radians, 0 = right, -pi/2 = up)"""
    lf = lf or leaf()
    R = rot(az=angle) @ rot(ax=tilt[0], ay=tilt[1])
    at = (at[0], at[1], at[2] if len(at) > 2 else depth)
    n = n or max(12, int(size * 0.22))
    k = len(sc.items) + 1
    sc.add(Surface(place(lf, R, at, size), hatch=[dict(along=chevron(slant), n=n, m=160),
                                                  dict(along='u', n=max(6, n // 3), m=300, cross=True, lo=.7)],
                   tone=tone, wmax=3.0, stipple=stipple, t=lambda u, v: t0 + (t1 - t0) * u, fruit=fruit))
    if veins:
        leaf_veins(sc, k, n=veins, slant=slant, w_mid=vein_w[0] * size / 100, w_side=vein_w[1] * size / 100)
    return k


def add_stalk(sc, pts, r0, r1, t0=0.0, t1=0.5, tone=0.2, n=None, ribs=0, rib_depth=0.0, hatch_along='v'):
    path = line3(*pts)
    k = len(sc.items) + 1
    L = sum(np.linalg.norm(np.subtract(pts[i + 1], pts[i])) for i in range(len(pts) - 1))
    n = n or 14
    sc.add(Surface(tube(path, lambda v: r0 + (r1 - r0) * v, ribs=ribs, rib_depth=rib_depth),
                   hatch=[dict(along='v' if hatch_along == 'v' else 'u', n=n if hatch_along == 'v' else int(L / 3.2), m=int(L * 1.2) if hatch_along == 'v' else 80)],
                   tone=tone, wmax=3.0, t=lambda u, v: t0 + (t1 - t0) * v))
    return path


def basil_shape(s):
    s = np.clip(s, 0, 1)
    return (s ** 0.55 * (1 - s) ** 0.95) / 0.5


def basil_sprig(sc, base, top, t0=0.0, t1=0.8, seed=1, scale=1.0, depth=0.0):
    """the top of a basil plant: a square stalk with pairs of big, glossy, cupped leaves, smaller
    towards the crown"""
    r = np.random.default_rng(seed)
    bx, by = base; tx, ty = top
    dx, dy = tx - bx, ty - by
    nx, ny = -dy, dx; nl = math.hypot(nx, ny); nx, ny = nx / nl, ny / nl
    bow = r.uniform(.04, .08) * nl
    pts = [(bx, by, depth), (bx + dx * .5 + nx * bow, by + dy * .5 + ny * bow, depth), (tx, ty, depth)]
    path = add_stalk(sc, pts, 8 * scale, 4.5 * scale, t0, t0 + (t1 - t0) * .55, tone=.25, ribs=4, rib_depth=.12)
    nodes = [0.22, 0.45, 0.64, 0.8, 0.92]
    sizes = [175, 160, 135, 105, 78]
    for j, (q, sz) in enumerate(zip(nodes, sizes)):
        p = path(np.array(q))
        tg = path(np.array(min(q + .01, 1))) - path(np.array(q - .01))
        up = math.atan2(tg[1], tg[0])
        rotj = 0.5 * (j % 2)                                   # each pair turned to the last, as basil grows
        for side in (-1, 1):
            ang = up + side * (1.2 + r.uniform(-.15, .15) - 0.12 * j)
            lf = leaf(width=.4, cup=.35, bend=.22 + r.uniform(0, .12), twist=side * r.uniform(.05, .35), pucker=.06,
                      veins=6, shape=basil_shape, seed=j * 2 + side + 2)
            roll = -(0.3 + 0.35 * rotj) + r.uniform(-.12, .12)        # tips droop away from the light
            add_leaf(sc, (p[0], p[1], depth + 6 + side * 4 * (1 - rotj)), ang, sz * scale * r.uniform(.92, 1.08), lf,
                     tilt=(roll, r.uniform(-.25, .05)), t0=t0 + (t1 - t0) * (q * .55 + .1), t1=t0 + (t1 - t0) * (q * .55 + .4),
                     veins=6, tone=.22, stipple=int(sz * 6))
    p = path(np.array(1.0))
    for side in (-1, 0, 1):
        lf = leaf(width=.34, cup=.45, bend=.25, shape=basil_shape, seed=10 + side)
        add_leaf(sc, (p[0], p[1] + 3, depth + 10), math.atan2(dy, dx) + side * .5, 60 * scale, lf, tilt=(side * .6, -.2),
                 t0=t0 + (t1 - t0) * .8, t1=t1, veins=4, tone=.28)

# ---- scallops ----------------------------------------------------------------------------------
def add_scallop_closed(sc, at, size, R, t0=0.0, t1=1.0, seed=0, fruit=0):
    sh = scallop_shell(seed=seed)
    grow = lambda u, v: t0 + (t1 - t0) * (0.15 + 0.85 * v)
    k = len(sc.items) + 1
    sc.add(Surface(place(sh, R, at, size), hatch=[dict(along='u', n=int(size * .32), m=700),
                                                  dict(along='v', n=int(size * .5), m=300, cross=True, lo=.66)],
                   tone=.12, wmax=3.6, stipple=int(size * 20), t=grow, fruit=fruit))
    # growth rings: a few stronger concentric lines
    for vv in (.35, .55, .72, .86):
        u = np.linspace(0, 1, 500)
        sc.curve(k, u, np.full_like(u, vv), lambda d: 0.4 + 1.1 * np.clip(d, 0, 1), taper=10)
    for side in (-1, 1):
        sc.add(Surface(place(scallop_ear(side), R, at, size), hatch=[dict(along='v', n=int(size * .1), m=60)],
                       tone=.2, t=lambda u, v: t0 + 0 * u))
    return sh


def add_scallop_open(sc, at, size, R, t0=0.0, t1=1.0, seed=1, fruit=0):
    """a scallop on the half shell: the cupped lower valve, the round white muscle and the coral"""
    sh = scallop_shell(seed=seed, inside=True, rib_amp=.02)
    k = len(sc.items) + 1
    sc.add(Surface(place(sh, R, at, size), hatch=[dict(along='u', n=int(size * .26), m=700),
                                                  dict(along='v', n=int(size * .45), m=300, cross=True, lo=.7)],
                   tone=.05, gain=.85, wmax=3.2, stipple=int(size * 10), t=lambda u, v: t0 + (t1 - t0) * .4 * v))
    u = np.linspace(0, 1, 600)
    sc.curve(k, u, np.full_like(u, .985), 1.6, taper=4)
    for side in (-1, 1):
        sc.add(Surface(place(scallop_ear(side), R, at, size), hatch=[dict(along='v', n=int(size * .1), m=60)],
                       tone=.2, t=lambda u, v: t0 + 0 * u))
    # the muscle sits in the cup, a little towards the hinge
    centre = np.array([0.02, -0.5, -0.08])
    Rm = R @ rot(ax=-(math.pi / 2 - 0.25))
    m_at = np.array(at) + (R @ centre) * size
    sc.add(Surface(place(puck(.25, .16), Rm, m_at, size), hatch=[dict(along='u', n=int(size * .16), m=500)],
                   tone=.0, gain=.7, stipple=int(size * 25), t=lambda u, v: t0 + (t1 - t0) * (.45 + .3 * v), fruit=fruit))
    # the coral: a plump crescent curling round the muscle
    arc = lambda tt: (R @ np.stack([0.02 + 0.36 * np.cos(-0.6 + tt * 2.4 + 0 * tt), -0.5 + 0.33 * np.sin(-0.6 + tt * 2.4), -0.02 + 0 * tt], 0)).T * size + np.array(at)
    def arc3(t):
        t = np.asarray(t, float)
        c = np.stack([0.02 + 0.36 * np.cos(0.2 + t * 1.9), -0.5 + 0.34 * np.sin(0.2 + t * 1.9), -0.04 + 0 * t], -1)
        return c
    roe = tube(arc3, lambda v: 0.012 + 0.09 * np.sin(math.pi * np.clip(v, 0, 1)) ** 0.8)
    sc.add(Surface(place(roe, R, at, size), hatch=[dict(along='u', n=int(size * .2), m=200), dict(along='v', n=int(size * .1), m=200, cross=True, lo=.6)],
                   tone=.35, stipple=int(size * 15), t=lambda u, v: t0 + (t1 - t0) * (.6 + .4 * v)))
    return sh


# ---- squash and pumpkins ------------------------------------------------------------------------
def add_palmate(sc, at, size, R, t0=0.0, t1=0.5, seed=0, tone=.2, lobes=5, depth=.45, cup=.22):
    lf = palmate_leaf(lobes=lobes, depth=depth, cup=cup, notch=.45, wave=.07, seed=seed)
    k = len(sc.items) + 1
    sc.add(Surface(place(lf, R, at, size), hatch=[dict(along='u', n=int(size * .2), m=900),
                                                  dict(along='v', n=int(size * .4), m=200, cross=True, lo=.62)],
                   tone=tone, wmax=3.0, stipple=int(size * 8), t=lambda u, v: t0 + (t1 - t0) * v))
    for c in lf.veins:
        u0 = (c / lf.amax + 1) / 2
        v = np.linspace(0, .92, 160)
        sc.curve(k, np.full_like(v, u0), v, lambda d, v=v: (2.2 - 1.6 * v) * size / 200, taper=14)
        # side veins branching off towards the edge
        for q in (.3, .5, .7):
            for sd in (-1, 1):
                tt = np.linspace(0, 1, 40)
                uu = u0 + sd * tt * 0.05
                vv = q + tt * 0.2
                sc.curve(k, np.clip(uu, 0, 1), np.clip(vv, 0, 1), 0.9 * size / 200, taper=8)
    return lf


def add_tendril(sc, at, size, R, t0=.5, t1=.8, turns=3.0):
    path = tendril(turns=turns)
    sc.add(Surface(place(tube(path, lambda v: 0.008 * (1 - .6 * v)), R, at, size), hatch=[dict(along='v', n=4, m=900)],
                   tone=.1, t=lambda u, v: t0 + (t1 - t0) * v))


def add_butternut(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, stem=True):
    sq = butternut()
    k = len(sc.items) + 1
    sc.add(Surface(place(sq, R, at, size), hatch=[dict(along='v', n=int(size * .85), m=700),
                                                  dict(along='u', n=int(size * .7), m=700, cross=True, lo=.72)],
                   tone=.06, wmax=3.4, stipple=int(size * 30), t=lambda u, v: t0 + (t1 - t0) * v, fruit=fruit))
    # faint lengthwise streaks in the skin
    rng = np.random.default_rng(int(size))
    for j in range(16):
        u0 = rng.random(); v = np.linspace(.06 + rng.random() * .1, .9 - rng.random() * .2, 200)
        sc.curve(k, np.full_like(v, u0), v, lambda d: 0.5 + 0.8 * np.clip(d, 0, 1), taper=30)
    if stem:
        add_squash_stem(sc, sq, at, size, R, t0)
    return sq


def add_squash_stem(sc, sq, at, size, R, t0, top=-1.0, length=.22, radius=.09):
    st = tube(line3((0, top + 0.03, 0), (0.02, top - length * .5, 0.01), (0.06, top - length, 0.02)),
              lambda v: radius * (1.25 - .45 * v), ribs=6, rib_depth=.25)
    sc.add(Surface(place(st, R, at, size), hatch=[dict(along='v', n=24, m=120)], tone=.3, wmax=3.0,
                   t=lambda u, v: t0 + 0 * u))
    # the cut end of the stalk
    cap = lambda u, v: np.stack([0.06 + v * radius * .8 * np.cos(u * TAU), top - length + 0 * u, 0.02 + v * radius * .8 * np.sin(u * TAU)], -1)
    sc.add(Surface(place(cap, R, at, size), hatch=[dict(along='u', n=6, m=80)], tone=.15, t=lambda u, v: t0 + 0 * u))


def add_butternut_half(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, seed=3):
    """a butternut cut lengthwise: smooth flesh, the hollow in the bulb full of seeds and strands"""
    back = butternut(half=True)
    sc.add(Surface(place(back, R, at, size), hatch=[dict(along='v', n=int(size * .45), m=700),
                                                    dict(along='u', n=int(size * .7), m=400, cross=True, lo=.72)],
                   tone=.12, wmax=3.6, stipple=int(size * 30), t=lambda u, v: t0 + (t1 - t0) * v, fruit=fruit))
    face = butternut_face()
    cav_v, cav_h, cav_w = .79, .13, .58
    def shade(u, v, p, n):
        x = (u * 2 - 1); cv = ((v - cav_v) / cav_h) ** 2 + (x / cav_w) ** 2
        inner = cv < 1
        rim = (cv >= 1) & (cv < 1.5)
        return np.where(inner, .35 + .15 * (1 - cv), np.where(rim, -.1, -.35)) + 0.08 * (np.abs(x) > .85)
    kf = len(sc.items) + 1
    sc.add(Surface(place(face, R, at, size), hatch=[dict(along='u', n=int(size * .7), m=200)], gain=.35, shade=shade,
                   stipple=int(size * 40), thresh=.2, wmax=2.8, t=lambda u, v: t0 + (t1 - t0) * v))
    # the line of the skin round the cut, and the hollow
    v = np.linspace(.03, .97, 400)
    for uu in (.03, .97):
        sc.curve(kf, np.full_like(v, uu), v, 1.0, taper=4)
    a = np.linspace(0, TAU, 300)
    sc.curve(kf, .5 + .5 * cav_w * np.cos(a), cav_v + cav_h * np.sin(a), 1.4, taper=1)
    r = np.random.default_rng(seed)
    for _ in range(26):
        ang = r.uniform(0, TAU); rad = r.uniform(.15, .8)
        cu, cv = .5 + .5 * cav_w * rad * np.cos(ang), cav_v + cav_h * rad * np.sin(ang)
        rot_ = r.uniform(0, math.pi)
        e = np.linspace(0, TAU, 26)
        ex, ey = .05 * np.cos(e), .022 * np.sin(e) * (1 + .3 * np.cos(e))
        sc.curve(kf, cu + .5 * (ex * math.cos(rot_) - ey * math.sin(rot_)) / .5 * .5,
                 cv + (ex * math.sin(rot_) + ey * math.cos(rot_)) * .5, 1.3, taper=1, clear=True)
    # strands
    for _ in range(12):
        ang = r.uniform(0, TAU)
        tt = np.linspace(0, 1, 50)
        rad = .2 + .75 * tt
        wig = .08 * np.sin(tt * 9 + r.uniform(0, 6))
        sc.curve(kf, .5 + .5 * cav_w * rad * np.cos(ang + wig), cav_v + cav_h * rad * np.sin(ang + wig), .7, taper=6)


def card_squash():
    """Autumn card: a whole butternut squash, a halved one and a leaf with a curling tendril"""
    sc = Scene()
    add_palmate(sc, (300, 600, -120), 330, rot(ax=.85, ay=.2, az=-.6), t0=0, t1=.4, seed=2)
    add_tendril(sc, (420, 520, -60), 300, rot(az=3.6, ax=.3), t0=.3, t1=.6)
    add_butternut(sc, (560, 640, 0), 230, rot(ax=.25, ay=.3, az=-.45), t0=.1, t1=.7, fruit=1)
    add_butternut_half(sc, (420, 990, 140), 200, rot(ay=-.8, az=1.45), t0=.4, t1=1, fruit=2)
    sc.shadows += [(610, 868, 150, 22, .7), (430, 1075, 250, 28, .8)]
    return sc


def add_pumpkin(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, seed=0, ribs=10):
    pk = pumpkin(ribs=ribs, seed=seed)
    k = len(sc.items) + 1
    sc.add(Surface(place(pk, R, at, size), hatch=[dict(along='v', n=int(size * 1.3), m=700),
                                                  dict(along='u', n=int(size * .55), m=900, cross=True, lo=.7)],
                   tone=.12, wmax=3.6, stipple=int(size * 30), t=lambda u, v: t0 + (t1 - t0) * (.3 + .7 * v), fruit=fruit))
    # the creases between the ribs
    for j in range(ribs):
        u0 = (j + .5) / ribs
        v = np.linspace(.08, .95, 220)
        sc.curve(k, np.full_like(v, u0), v, lambda d, v=v: 0.4 + 1.8 * np.clip(d, 0, 1) * np.sin(math.pi * v) ** .5, taper=16)
    # a thick, twisted, ribbed stalk
    top = -0.72 + 0.22 - 0.02
    st = tube(line3((0, top + .05, 0), (0.03, top - .14, .02), (0.12, top - .26, .05), (0.24, top - .3, .08)),
              lambda v: .1 * (1.35 - .6 * v), ribs=6, rib_depth=.3)
    sc.add(Surface(place(st, R, at, size), hatch=[dict(along='v', n=30, m=160)], tone=.28, wmax=3.0,
                   t=lambda u, v: t0 + (t1 - t0) * .2 * v))
    return pk


def menu_pumpkin():
    """Autumn menu 1: round pumpkins with a leaf and tendril"""
    sc = Scene()
    add_palmate(sc, (120, 330, -100), 260, rot(ax=.8, ay=-.3, az=.6), t0=0, t1=.35, seed=5)
    add_tendril(sc, (170, 470, -40), 260, rot(az=.3, ax=.2), t0=.25, t1=.5)
    add_pumpkin(sc, (780, 930, 0), 200, rot(ax=-.35, ay=.2), t0=.15, t1=.8, fruit=1, seed=1)
    add_pumpkin(sc, (600, 1110, 120), 140, rot(ax=-.45, ay=-.5), t0=.35, t1=1, fruit=2, seed=2, ribs=9)
    sc.shadows += [(780, 1080, 220, 26, .7), (600, 1220, 160, 22, .8)]
    return sc


# ---- beetroot -----------------------------------------------------------------------------------
def add_beet(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, seed=0, body=.5, root=1.1, squash_=1.0, stalks=0,
             leaves=None, tone=.22):
    """a whole beetroot; stalks: how many trimmed stalk stubs (or with leaves: list of (angle, length, leafsize))"""
    prof = beet_profile(body, root, squash_)
    k = len(sc.items) + 1
    sc.add(Surface(place(solid(prof), R, at, size), hatch=[dict(along='u', n=int(size * .9), m=700),
                                                          dict(along='v', n=int(size * 1.2), m=600, cross=True, lo=.66)],
                   tone=tone, wmax=3.6, stipple=int(size * 35), t=lambda u, v: t0 + (t1 - t0) * (.35 + .65 * (1 - v)), fruit=fruit))
    r = np.random.default_rng(seed)
    # faint rings in the skin and a few root hairs
    for vv in r.uniform(.12, .5, 5):
        u = np.linspace(0, 1, 400)
        sc.curve(k, u, np.full_like(u, vv), lambda d: 0.3 + 1.0 * np.clip(d - .3, 0, 1), taper=30)
    top = prof.top
    if leaves:
        for j, (ang, ln, lsz) in enumerate(leaves):
            a = ang
            p0 = np.array([0.06 * math.sin(a * 3), top + .02, 0.06 * math.cos(a * 3)])
            d = np.array([math.sin(a), -math.cos(a), 0.15 * r.uniform(-1, 1)])
            p1 = p0 + d * ln * .5 + np.array([0, -ln * .15, 0])
            p2 = p0 + d * ln + np.array([math.sin(a) * .1, -ln * .05, 0])
            st = tube(line3(p0, p1, p2), lambda v: .035 * (1 - .35 * v), ribs=3, rib_depth=.15)
            sc.add(Surface(place(st, R, at, size), hatch=[dict(along='v', n=14, m=int(ln * size * 1.2))], tone=.25, wmax=3.0,
                           t=lambda u, v, j=j: t0 + (t1 - t0) * (.05 + .35 * v)))
            tip = R @ p2 * size + np.array(at)
            dd = R @ (p2 - p1)
            angle = math.atan2(dd[1], dd[0])
            lf = leaf(width=.27, cup=.25, bend=.12, twist=r.uniform(-.5, .5), wave=.1, waves=8, pucker=.05,
                      shape=lambda s: np.sin(math.pi * np.clip(s, 0, 1) ** 0.8) ** 0.7, seed=seed * 7 + j)
            add_leaf(sc, (tip[0], tip[1], tip[2]), angle, lsz * size, lf, tilt=(r.uniform(-.6, .6), r.uniform(-.3, .2)),
                     t0=t0 + (t1 - t0) * .35, t1=t0 + (t1 - t0) * .75, veins=7, tone=.2, stipple=int(lsz * size * 4))
    else:
        for j in range(stalks):
            a = (j - (stalks - 1) / 2) * .35
            p0 = np.array([0.05 * math.sin(a * 4), top + .03, 0.04 * math.cos(a * 4)])
            p2 = p0 + np.array([math.sin(a) * .2, -.28 - .05 * r.random(), 0.02])
            st = tube(line3(p0, (p0 + p2) / 2, p2), lambda v: .035 * (1 - .2 * v), ribs=3, rib_depth=.15)
            sc.add(Surface(place(st, R, at, size), hatch=[dict(along='v', n=12, m=120)], tone=.28, wmax=3.0,
                           t=lambda u, v: t0 + (t1 - t0) * .1 * v))
    return prof


def add_beet_half(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, seed=0, rings=7):
    """a candy-striped (Chioggia) beetroot cut in half: rings of colour round its heart"""
    prof = beet_profile(.5, .35)
    sc.add(Surface(place(solid(prof, half=True), R, at, size), hatch=[dict(along='u', n=int(size * .5), m=500),
                                                                     dict(along='v', n=int(size * .9), m=400, cross=True, lo=.66)],
                   tone=.18, wmax=3.6, stipple=int(size * 25), t=lambda u, v: t0 + (t1 - t0) * (.4 + .6 * (1 - v)), fruit=fruit))
    cy = 0.0
    def shade(u, v, p, n):
        r_, y = prof(v)
        x = (u * 2 - 1) * r_
        d = np.sqrt(x ** 2 + ((y - cy) * 1.05) ** 2) / .5
        band = (np.floor(d * rings) % 2 == 1) & (d < .97)
        return np.where(band, .3, -.35) + 0.25 * (d > .97)
    kf = len(sc.items) + 1
    sc.add(Surface(place(solid_face(prof), R, at, size), hatch=[dict(along='u', n=int(size * .6), m=300)], gain=.3, shade=shade,
                   stipple=int(size * 20), thresh=.2, wmax=2.6, t=lambda u, v: t0 + (t1 - t0) * (.5 + .5 * v)))
    # the ring lines themselves
    for i in range(1, rings):
        rad = i / rings * .5
        a = np.linspace(0, TAU, 300)
        x, y = rad * np.cos(a), cy + rad * np.sin(a) / 1.05
        # map back to (u, v): find v from y, u from x / radius at that v
        vv = np.interp(y, prof(np.linspace(0, 1, 400))[1], np.linspace(0, 1, 400))
        rr = prof(vv)[0]
        ok = np.abs(x) < rr * .97
        sc.curve(kf, np.where(ok, (x / np.maximum(rr, 1e-3) + 1) / 2, .5), vv, np.where(ok, .9, 0), taper=1)
    return prof


def menu_beetroot():
    """Autumn menu 2: a selection of beetroot: a bunch with its leaves, a Chioggia cut in half, little ones"""
    sc = Scene()
    add_beet(sc, (160, 1030, 0), 150, rot(az=.25, ax=-.2), t0=0, t1=.8, fruit=1, seed=1, body=.5, root=1.0,
             leaves=[(-.55, 1.2, 2.0), (-.12, 1.6, 2.3), (.3, 1.25, 1.9)])
    add_beet(sc, (300, 1150, 80), 120, rot(az=-.6, ax=-.3), t0=.2, t1=.9, fruit=2, seed=2, body=.45, root=.9, squash_=1.3,
             stalks=3, tone=.3)
    add_beet_half(sc, (740, 1040, 40), 200, rot(ay=-.85, az=1.75), t0=.3, t1=1, fruit=3, seed=3)
    add_beet(sc, (830, 1210, 140), 95, rot(az=1.2, ax=-.2), t0=.45, t1=1, fruit=4, seed=4, body=.48, root=.7, stalks=2, tone=.08)
    sc.shadows += [(220, 1150, 200, 24, .7), (770, 1130, 190, 24, .7)]
    return sc


# ---- radicchio --------------------------------------------------------------------------------------
def add_tardivo(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, seed=0, n=22, root=.3):
    """a head of radicchio tardivo: long white-ribbed leaves curling in like flames, on a trimmed root"""
    r = np.random.default_rng(seed)
    ga = math.pi * (3 - math.sqrt(5))
    for j in range(n):
        q = j / (n - 1)                        # 0 = innermost, 1 = outermost
        phi = j * ga + r.uniform(-.2, .2)
        L = (0.85 + 0.45 * q) * r.uniform(.9, 1.08)
        lean = 0.12 + 0.55 * q + r.uniform(-.08, .08)
        curl = 0.9 + 1.1 * q + r.uniform(-.25, .25)
        lf = tardivo_leaf(L, lean, curl, phi, width=.06 + .03 * q, seed=seed * 50 + j)
        def shade(u, v, p, nn):
            w = np.abs(u * 2 - 1)
            return np.where(w < .45, -.35, .55 + .15 * v)
        sc.add(Surface(place(lf, R, at, size), hatch=[dict(along='v', n=18, m=500), dict(along='u', n=70, m=60, cross=True, lo=.8)],
                       shade=shade, tone=.05, wmax=3.0, stipple=int(size * 4), grid=(40, 300),
                       t=lambda u, v, q=q: t0 + (t1 - t0) * (.25 + .5 * v * (0.6 + .4 * q) + .15 * (1 - q)), fruit=fruit if q < .2 else 0))
        k = len(sc.items)
        # the edges of the rib
        v = np.linspace(.02, .9, 200)
        for e in (.28, .72):
            sc.curve(k, np.full_like(v, e), v, .9, taper=20)
    # the trimmed root, peeled clean
    rt = tube(line3((0, -.02, 0), (0.01, root * .5, 0.01), (0.03, root, 0.02)), lambda v: .065 * (1 - .5 * v) + .012)
    sc.add(Surface(place(rt, R, at, size), hatch=[dict(along='v', n=30, m=200)], tone=.0, gain=.8, stipple=int(size * 6),
                   t=lambda u, v: t0 + (t1 - t0) * .2 * (1 - v)))
    cap = lambda u, v: np.stack([0.03 + v * .044 * np.cos(u * TAU), root + 0 * u, 0.02 + v * .044 * np.sin(u * TAU)], -1)
    sc.add(Surface(place(cap, R, at, size), hatch=[dict(along='u', n=5, m=80)], tone=.1, t=lambda u, v: t0 + 0 * u))


def card_radicchio():
    """Winter card and menu: two heads of radicchio di Treviso tardivo"""
    sc = Scene()
    add_tardivo(sc, (560, 930, -60), 400, rot(ax=.12, az=-.08), t0=0, t1=.8, fruit=1, seed=1, n=24)
    add_tardivo(sc, (330, 1010, 80), 330, rot(ax=.35, ay=.3, az=1.25), t0=.2, t1=1, fruit=2, seed=2, n=18)
    sc.shadows += [(470, 1060, 330, 26, .75)]
    return sc


def menu_radicchio():
    """Winter menu 1: radicchio tardivo at either side of the page"""
    sc = Scene()
    add_tardivo(sc, (790, 1000, -60), 400, rot(ax=.12, az=-.18), t0=0, t1=.8, fruit=1, seed=1, n=24)
    add_tardivo(sc, (150, 1130, 80), 300, rot(ax=.35, ay=.3, az=1.3), t0=.2, t1=1, fruit=2, seed=2, n=18)
    sc.shadows += [(760, 1130, 200, 24, .75), (130, 1185, 200, 22, .75)]
    return sc


# ---- langoustine --------------------------------------------------------------------------------
def add_langoustine(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, seed=0, curl=.25, claw_open=.08):
    """a langoustine seen from above: carapace, banded tail ending in a fan, long slender claws,
    whip-like antennae and fine legs. Local x runs head (0) to tail, z towards the viewer."""
    r = np.random.default_rng(seed)
    T = lambda a, b: (lambda u, v: t0 + (t1 - t0) * (a + (b - a) * v))
    def S(fn, hatch, tone=.18, t=None, **kw):
        k = len(sc.items) + 1
        sc.add(Surface(place(fn, R, at, size), hatch=hatch, tone=tone, wmax=3.2, t=t or T(0, 1), **kw))
        return k
    # carapace: a long, slightly flattened shell with a ridge down the back and a spiny rostrum
    cara = line3((0.0, 0, .02), (.35, 0, .04), (.72, 0, .03))
    rad = lambda v, a: (.05 + .085 * np.clip(v * 1.4, 0, 1) ** .7) * (1 - .25 * np.clip((v - .9) / .1, 0, 1)) * (1 + .1 * np.cos(a * 2) ** 8)
    S(tube(cara, rad, flat=.8), [dict(along='v', n=int(size * .35), m=400), dict(along='u', n=int(size * .25), m=300, cross=True, lo=.66)],
      tone=.2, stipple=int(size * 12), t=T(.0, .3), fruit=fruit)
    S(tube(line3((-.22, 0, .05), (-.1, 0, .05), (0.02, 0, .05)), lambda v: .006 + .02 * v), [dict(along='v', n=8, m=120)], tone=.3, t=T(0, .05))
    # the groove across the carapace
    kc = 1
    # the tail: six overlapping bands curling under, then the fan
    def axis(t):
        t = np.asarray(t, float)
        a = curl * t ** 1.5
        x = .7 + 1.05 * t * np.cos(a * .6)
        z = .03 - .25 * curl * t ** 2
        return np.stack([x, 0 * t + .0, z], -1)
    for i in range(6):
        a, b = i / 6, (i + 1.12) / 6
        seg = line3(axis(np.array(a)), axis(np.array((a + b) / 2)), axis(np.array(b)))
        rr = .13 * (1 - .42 * (i / 6))
        S(tube(seg, lambda v, a, rr=rr: rr * (1 + .12 * np.sin(math.pi * v)) * (1 - .08 * v) * (1 + .22 * np.abs(np.sin(a)) ** 6), flat=.72),
          [dict(along='u', n=int(size * .05) + 6, m=300), dict(along='v', n=int(size * .2), m=60, cross=True, lo=.62)],
          tone=.16, stipple=int(size * 4), t=T(.3 + .06 * i, .36 + .06 * i))
    # tail fan
    end = axis(np.array(1.0))
    for j, ang in enumerate((-.55, -.25, 0, .25, .55)):
        lf = leaf(width=.32 if j != 2 else .26, cup=-.1, bend=0, shape=lambda s: np.sin(math.pi * np.clip(s, 0, 1) ** .6) ** .5)
        paddle = place(lf, rot(az=ang), end, .26)
        S(paddle, [dict(along='u', n=10, m=120)], tone=.12, t=T(.68, .75))
    # claws: arm and slender pincer reaching forward on each side
    for sd in (-1, 1):
        sh = np.array([.12, sd * .1, .0])
        el = np.array([-.18, sd * .32, .02])
        wr = np.array([-.4, sd * .38, .02])
        tip = np.array([-1.05, sd * (.36 + .05 * r.random()), .03])
        S(tube(line3(sh, (sh + el) / 2 + np.array([0, sd * .04, 0]), el), lambda v: .035 + .01 * v, ribs=6, rib_depth=.15),
          [dict(along='v', n=14, m=200)], tone=.2, t=T(.15, .3))
        S(tube(line3(el, wr), lambda v: .045 + .01 * np.sin(math.pi * v), ribs=6, rib_depth=.15),
          [dict(along='v', n=14, m=120)], tone=.2, t=T(.25, .35))
        # the long propodus, ridged and finely spined, tapering into the fixed finger
        S(tube(line3(wr, wr + (tip - wr) * .5 + np.array([0, sd * .02, .02]), tip), lambda v: .07 * (1 - .8 * v ** 1.8) * (1 + .15 * np.sin(math.pi * v)) + .006, ribs=8, rib_depth=.22),
          [dict(along='v', n=18, m=400), dict(along='u', n=60, m=60, cross=True, lo=.6)], tone=.18, stipple=int(size * 3), t=T(.3, .5))
        hinge = wr + (tip - wr) * .62
        ftip = tip + np.array([.04, sd * (.08 + claw_open * .3), .01])
        S(tube(line3(hinge + np.array([0, sd * .04, .03]), (hinge + ftip) / 2 + np.array([0, sd * .035, .03]), ftip), lambda v: .032 * (1 - .8 * v) + .005, ribs=6, rib_depth=.15),
          [dict(along='v', n=10, m=200)], tone=.22, t=T(.45, .55))
        # antennae: long whips sweeping back past the tail
        a0 = np.array([-.12, sd * .05, .06])
        S(tube(line3(a0, (-.32, sd * .2, .08), (-.25, sd * .45, .06), (.3, sd * .62, .05), (1.2, sd * .55, .03)), lambda v: .006 * (1 - .8 * v) + .0015),
          [dict(along='v', n=3, m=900)], tone=.25, t=T(.05, .3), outline=.5)
        S(tube(line3(a0 + np.array([0, -sd * .03, 0]), (-.3, sd * .03, .07), (-.45, sd * .12, .07)), lambda v: .008 * (1 - .6 * v) + .002),
          [dict(along='v', n=4, m=200)], tone=.25, t=T(.05, .15), outline=.5)
        # walking legs
        for j in range(4):
            x0 = .25 + j * .12
            l0 = np.array([x0, sd * .12, -.03]); l1 = np.array([x0 + .02, sd * (.27 + .02 * j), -.05]); l2 = np.array([x0 + .12, sd * (.36 + .02 * j), -.1])
            S(tube(line3(l0, l1, l2), lambda v: .007 * (1 - .5 * v)), [dict(along='v', n=4, m=120)], tone=.25, t=T(.2, .3), outline=.5)
    # eyes
    for sd in (-1, 1):
        c = np.array([.0, sd * .05, .08])
        sp = lambda u, v, c=c: np.stack([.028 * np.sin(v * math.pi) * np.cos(u * TAU), .028 * np.sin(v * math.pi) * np.sin(u * TAU), .028 * np.cos(v * math.pi)], -1) + c
        S(sp, [dict(along='u', n=6, m=60)], tone=.5, t=T(0, .05))


def menu_langoustine():
    """Winter menu 2: two langoustines"""
    sc = Scene()
    add_langoustine(sc, (260, 1000, 0), 240, rot(az=-.85, ax=.3), t0=0, t1=1, fruit=1, seed=1)
    add_langoustine(sc, (690, 330, 0), 205, rot(az=2.25, ax=.25), t0=.15, t1=1, fruit=2, seed=2, curl=.4)
    return sc


# ---- spring: wild asparagus and courgettes -----------------------------------------------------
def add_spear(sc, pts, t0=0.0, t1=1.0, seed=0, radius=4.0, fruit=0):
    """one thin wild asparagus spear through the given points (cut end first, tip last), in picture pixels"""
    r = np.random.default_rng(seed)
    pts = [np.asarray(p, float) for p in pts]
    path = line3(*pts)
    L = sum(np.linalg.norm(pts[i + 1] - pts[i]) for i in range(len(pts) - 1))
    tip0 = 1 - 38 / L                                    # the bud: the last ~38px
    def rad(v, ang):
        base = radius * (1 - .3 * v)
        tz = np.clip((v - tip0) / (1 - tip0), 0, 1)
        scales = np.mod(v * L / 6 + ang / TAU * 2.5, 1.0) * (tz > 0)
        bud = base * (1 + .28 * np.sin(math.pi * tz ** .8)) * np.sqrt(np.clip(1 - tz ** 4, 0, 1))
        return bud * (1 + .22 * scales)
    sc.add(Surface(tube(path, rad), hatch=[dict(along='v', n=7, m=int(L * 1.3)), dict(along='u', n=int(L / 5), m=40, cross=True, lo=.72)],
                   tone=.22, wmax=2.6, t=lambda u, v: t0 + (t1 - t0) * v, outline=.5, fruit=fruit))
    # small papery bracts at the nodes
    for q in np.linspace(.2, tip0 - .08, 5) + r.uniform(-.03, .03, 5):
        p = path(np.array(q)); d = path(np.array(q + .02)) - path(np.array(q - .02))
        ang = math.atan2(d[1], d[0]) + (r.choice([-1, 1])) * .28
        lf = leaf(width=.28, cup=.25, bend=.08, shape=lambda s: np.clip(1 - s, 0, 1) ** .7 * np.clip(s * 5, 0, 1))
        add_leaf(sc, (p[0], p[1], p[2] + radius * .8), ang, radius * 3.2, lf, tilt=(r.uniform(-.4, .4), 0), t0=t0 + (t1 - t0) * q,
                 t1=t0 + (t1 - t0) * (q + .05), veins=0, tone=.15, n=3)
    return path


def add_bundle(sc, tie, angle, length, n=9, t0=0.0, t1=1.0, seed=0, fruit=0):
    """a bundle of wild asparagus lying on its side, gathered by a few turns of raffia"""
    r = np.random.default_rng(seed)
    ca, sa = math.cos(angle), math.sin(angle)
    ax = np.array([ca, sa, 0]); px = np.array([-sa, ca, 0]); zz = np.array([0, 0, 1.0])
    tie = np.asarray(tie, float)
    for i in range(n):
        q = (i - (n - 1) / 2) / ((n - 1) / 2)
        th = q * math.pi / 2
        off_p, off_z = 15 * math.sin(th), 14 * math.cos(th)
        L = length * r.uniform(.86, 1.04)
        back = L * r.uniform(.33, .4)
        a = tie - ax * back + px * off_p * 2.1 + zz * off_z * 1.5
        m = tie + px * off_p + zz * off_z
        c = tie + ax * (L - back) * .55 + px * (off_p * 2.6 + r.uniform(-6, 6)) + zz * off_z
        b = tie + ax * (L - back) + px * (off_p * 4.2 + r.uniform(-10, 10)) + zz * off_z * 1.5
        add_spear(sc, [a, m, c, b], t0=t0 + (t1 - t0) * .04 * i, t1=t0 + (t1 - t0) * (.6 + .04 * i), seed=seed * 20 + i,
                  radius=r.uniform(3.3, 4.4), fruit=fruit if i == n // 2 else 0)
    # raffia: three turns round the gathered middle, and the two loose ends
    for j, sh in enumerate((-7, 0, 7)):
        tt = np.linspace(0, 1, 13)[:-1]
        ring = [tie + ax * (sh + 3 * math.sin(TAU * q)) + px * (19 * math.cos(TAU * q)) + zz * (19 * math.sin(TAU * q)) for q in tt]
        path = line3(*(ring + ring[:2]))
        sc.add(Surface(lambda u, v, path=path: tube(path, lambda vv: 2.6, flat=.45)(u, v * (12 / 13)),
                       hatch=[dict(along='v', n=4, m=500)], tone=.25, t=lambda u, v: t0 + (t1 - t0) * .72 + 0 * u, outline=.5))
    for sd in (-1, 1):
        e0 = tie + px * 19 * sd * .2 + zz * 20
        path = line3(e0, e0 + px * 30 * sd + ax * 25 * sd, e0 + px * 55 * sd + ax * 20 * sd + np.array([0, 25, 0]))
        sc.add(Surface(tube(path, lambda v: 2.6 * (1 - .4 * v), flat=.45), hatch=[dict(along='v', n=4, m=200)], tone=.25,
                       t=lambda u, v: t0 + (t1 - t0) * .75 + 0 * u, outline=.5))


def menu_asparagus():
    """Spring menu 1: wild asparagus: a tied bundle and a few loose spears"""
    sc = Scene()
    add_bundle(sc, (530, 1010, 0), -.6, 560, n=13, t0=.1, t1=1, seed=3, fruit=1)
    for i, pts in enumerate([[(30, 640, 0), (90, 420, 0), (150, 260, 0), (250, 110, 0)],
                             [(-10, 560, 10), (60, 380, 10), (110, 270, 10), (140, 170, 10)],
                             [(110, 700, -10), (160, 520, -10), (250, 360, -10), (330, 250, -10)]]):
        add_spear(sc, pts, t0=.0 + .08 * i, t1=.7 + .08 * i, seed=40 + i, radius=3.8)
    sc.shadows += [(540, 1090, 260, 20, .6)]
    return sc


def courgette_profile(length=2.4, r=0.24):
    def prof(v):
        v = np.clip(v, 0, 1)
        rr = r * (0.82 + 0.18 * smoothstep(0.1, 0.85, v)) * (1 + 0.02 * np.sin(v * 9))
        rr = rr * np.where(v > .9, np.sqrt(np.clip(1 - ((v - .9) / .1) ** 2, 0, 1)) * .85 + .15, 1)
        rr = rr * np.where(v < .06, np.sqrt(np.clip(1 - ((.06 - v) / .06) ** 2, 0, 1)) * .55 + .45, 1)
        return rr, -length / 2 + v * length
    return prof


def add_courgette(sc, at, size, R, t0=0.0, t1=1.0, fruit=0, seed=0, flower=False):
    prof = courgette_profile()
    def f(u, v):
        rr, y = prof(v)
        a = u * TAU
        rr = rr * (1 - .035 * (0.5 - 0.5 * np.cos(8 * a)) ** 2)        # faint ridges
        return np.stack([rr * np.cos(a), y + 0 * a, rr * np.sin(a)], -1)
    k = len(sc.items) + 1
    sc.add(Surface(place(f, R, at, size), hatch=[dict(along='v', n=int(size * .9), m=800), dict(along='u', n=int(size * .8), m=600, cross=True, lo=.68)],
                   tone=.16, wmax=3.4, stipple=int(size * 30), t=lambda u, v: t0 + (t1 - t0) * v, fruit=fruit))
    # pale speckles: knocked out of the shading
    r = np.random.default_rng(seed)
    for _ in range(70):
        u0, v0 = r.random(), r.uniform(.1, .88)
        e = np.linspace(0, TAU, 12)
        sc.curve(k, u0 + .006 * np.cos(e), v0 + .012 * np.sin(e), .0, taper=1, clear=True)
    # the stalk: five-sided, flaring onto the fruit
    st = tube(line3((0, -1.2 + .02, 0), (.02, -1.33, .01), (.07, -1.45, .03)), lambda v: .09 * (1.3 - .5 * v), ribs=5, rib_depth=.25)
    sc.add(Surface(place(st, R, at, size), hatch=[dict(along='v', n=22, m=120)], tone=.3, t=lambda u, v: t0 + 0 * u))
    if flower:
        add_blossom(sc, at, size, R, t0 + (t1 - t0) * .7, t1, seed)


def add_blossom(sc, at, size, R, t0, t1, seed=0):
    """a courgette flower at the end of the fruit: a slender closed trumpet of five pointed petals"""
    r = np.random.default_rng(seed)
    base = np.array([0, 1.18, 0])
    for j in range(5):
        a = j / 5 * TAU + r.uniform(-.15, .15)
        def petal(u, v, a=a):
            w = u * 2 - 1
            L = .95
            hw = .3 * np.sin(math.pi * np.clip(v, 0, 1) ** .9) ** .8 * (1 - .4 * v)
            rad = .08 + .25 * np.sin(math.pi * np.clip(v, 0, 1) * .85) + .12 * np.clip((v - .75) / .25, 0, 1) ** 2
            ang = a + w * hw / np.maximum(rad, .05)
            y = 1.18 + v * L
            frill = .03 * np.sin(v * 20 + w * 4)
            rr = rad * (1 - .15 * w * w) + frill
            return np.stack([rr * np.cos(ang), y + .05 * w * w, rr * np.sin(ang)], -1)
        sc.add(Surface(place(petal, R, at, size), hatch=[dict(along='v', n=9, m=300)], tone=.1, wmax=3.0,
                       t=lambda u, v: t0 + (t1 - t0) * v))
        k = len(sc.items)
        v = np.linspace(.05, .95, 120)
        sc.curve(k, np.full_like(v, .5), v, 1.0, taper=10)


def menu_courgette():
    """Spring menu 2: courgettes, one still carrying its flower, and a leaf"""
    sc = Scene()
    add_palmate(sc, (150, 330, -100), 290, rot(ax=.8, ay=-.2, az=.5), t0=0, t1=.35, seed=7, tone=.1)
    add_tendril(sc, (250, 450, -40), 220, rot(az=.6, ax=.2), t0=.2, t1=.45)
    add_courgette(sc, (650, 900, 0), 165, rot(ay=.4, az=1.95, ax=.2), t0=.15, t1=.7, fruit=1, seed=1)
    add_courgette(sc, (660, 1110, 90), 150, rot(ay=-.3, az=1.35, ax=-.2), t0=.3, t1=.8, fruit=2, seed=2, flower=True)
    sc.shadows += [(720, 990, 260, 24, .6), (640, 1190, 300, 22, .6)]
    return sc


# ---- events: canapé plate with tweezers, sashimi ------------------------------------------------
def plate_profile(r_in=1.0, r_out=1.4, lip=.08):
    def prof(v):
        v = np.clip(v, 0, 1)
        r = v * r_out
        y = np.where(r < r_in, 0.0, -lip * smoothstep(r_in, r_out, r) - .015 * smoothstep(r_out * .97, r_out, r))
        return r, y
    return prof


def add_plate(sc, at, size, R, t0=0.0, t1=.3, r_in=1.0, r_out=1.4):
    prof = plate_profile(r_in, r_out)
    def f(u, v):
        r, y = prof(v)
        a = u * TAU
        return np.stack([r * np.cos(a), y + 0 * a, r * np.sin(a)], -1)
    # the plate itself is white: just its rim is shaded, and a fine ring marks where the well ends
    def shade(u, v, p, n):
        return np.where(v < r_in / r_out * .98, -.6, 0.0)
    k = len(sc.items) + 1
    sc.add(Surface(place(f, R, at, size), hatch=[dict(along='u', n=int(size * .12), m=1200)], shade=shade, tone=.0, gain=.7,
                   wmax=2.4, t=lambda u, v: t0 + (t1 - t0) * u))
    u = np.linspace(0, 1, 900)
    sc.curve(k, u, np.full_like(u, r_in / r_out), .7, taper=1)
    # the plate's thickness at the edge
    edge = lambda u, v: np.stack([r_out * np.cos(u * TAU), -.1 * 0 + (.0 - .015) + v * .05 + 0 * u, r_out * np.sin(u * TAU)], -1)
    sc.add(Surface(place(edge, R, at, size), hatch=[dict(along='v', n=int(size * 3), m=10)], tone=.2, t=lambda u, v: t0 + (t1 - t0) * u))
    return k


def add_tartlet(sc, at, size, R, t0, t1, seed=0):
    """a fluted pastry tartlet, filled and finished with a quenelle, pearls and herbs"""
    shell = lambda u, v: np.stack([(1 - .25 * (1 - v)) * (1 + .06 * np.cos(u * TAU * 16)) * np.cos(u * TAU), -.55 * v, (1 - .25 * (1 - v)) * (1 + .06 * np.cos(u * TAU * 16)) * np.sin(u * TAU)], -1)
    sc.add(Surface(place(shell, R, at, size), hatch=[dict(along='v', n=int(size * 2.2), m=60)], tone=.2, wmax=2.6, stipple=int(size * 8),
                   t=lambda u, v: t0 + (t1 - t0) * .3 * v))
    # the filling, level with the rim, then a smooth quenelle on top
    fill = lambda u, v: np.stack([.96 * v * np.cos(u * TAU), -.56 - .04 * (1 - v ** 2), .96 * v * np.sin(u * TAU)], -1)
    sc.add(Surface(place(fill, R, at, size), hatch=[dict(along='u', n=8, m=300)], tone=.05, stipple=int(size * 6),
                   t=lambda u, v: t0 + (t1 - t0) * .4))
    def quen(u, v):
        a = u * TAU; ph = v * math.pi
        x = .55 * np.sin(ph) * np.cos(a); z = .3 * np.sin(ph) * np.sin(a); y = -.6 - .28 * np.cos(ph) - .28
        return np.stack([x, y, z], -1) @ rot(ay=.6).T
    sc.add(Surface(place(quen, R, at, size), hatch=[dict(along='u', n=int(size * .25), m=300)], tone=.1, wmax=2.6,
                   t=lambda u, v: t0 + (t1 - t0) * (.5 + .2 * v)))
    r = np.random.default_rng(seed)
    for j in range(5):
        c = np.array([r.uniform(-.7, .7), -.62, r.uniform(-.65, .65)])
        if np.hypot(c[0], c[2]) > .78:
            c[[0, 2]] *= .7
        rr = r.uniform(.07, .1)
        sp = lambda u, v, c=c, rr=rr: np.stack([rr * np.sin(v * math.pi) * np.cos(u * TAU), -rr * np.cos(v * math.pi), rr * np.sin(v * math.pi) * np.sin(u * TAU)], -1) + c - np.array([0, rr, 0])
        sc.add(Surface(place(sp, R, at, size), hatch=[dict(along='u', n=6, m=60)], tone=.35, t=lambda u, v: t0 + (t1 - t0) * .8, outline=.5))


def add_blini(sc, at, size, R, t0, t1, seed=0):
    """a little round blini with a curl of cured fish and a spoon of caviar"""
    disc = lambda u, v: np.stack([np.minimum(v * 1.25, 1) * np.cos(u * TAU), -.22 * np.clip((v * 1.25 - 1) * -1 + 1, 0, 1) * (v > .8) - .22 * (v <= .8) + .0 * u, np.minimum(v * 1.25, 1) * np.sin(u * TAU)], -1)
    top = lambda u, v: np.stack([v * np.cos(u * TAU) * (1 - .04 * v ** 8), -.24 - .04 * (1 - v ** 2), v * np.sin(u * TAU) * (1 - .04 * v ** 8)], -1)
    side = lambda u, v: np.stack([np.cos(u * TAU) * (1 - .04 * (1 - (2 * v - 1) ** 2) * -1), -.24 + .24 * v + 0 * u, np.sin(u * TAU)], -1)
    sc.add(Surface(place(side, R, at, size), hatch=[dict(along='v', n=int(size * 2.5), m=30)], tone=.25, t=lambda u, v: t0 + 0 * u))
    sc.add(Surface(place(top, R, at, size), hatch=[dict(along='u', n=10, m=300)], tone=.05, stipple=int(size * 25), t=lambda u, v: t0 + (t1 - t0) * .3))
    # the fish: a ruffled ribbon wound into a rose
    a = np.linspace(0, 2.2 * TAU, 120)
    rad = .15 + .45 * a / a[-1]
    pts = np.stack([rad * np.cos(a), -.3 - .25 * (1 - a / a[-1]) + 0 * a, rad * np.sin(a)], -1)
    path = line3(*pts[::6])
    rib = ribbon(path, lambda v: .17 + .05 * np.sin(v * 30), normal_hint=(0, -1, 0), cup=.0)
    def rose(u, v):
        p = rib(u, v)
        lift = (u - .5) * .35 * (1 + .3 * np.sin(v * 25))
        return p + np.stack([0 * u, -lift - .1, 0 * u], -1)
    sc.add(Surface(place(rose, R, at, size), hatch=[dict(along='v', n=10, m=400)], tone=.3, wmax=2.6, t=lambda u, v: t0 + (t1 - t0) * (.4 + .4 * v)))


def add_tweezers(sc, hinge, tip, gap=6, width=11, t0=0.0, t1=1.0):
    """chef's tweezers: two long, flat, tapering arms joined at the back, tips nearly closed"""
    hinge = np.asarray(hinge, float); tip = np.asarray(tip, float)
    d = tip - hinge; L = np.linalg.norm(d); ax = d / L
    px = np.array([-ax[1], ax[0], 0])
    for sd in (-1, 1):
        a = hinge + px * sd * 4
        m = hinge + ax * L * .45 + px * sd * (width * 1.3) + np.array([0, 0, 10])
        b = tip + px * sd * gap / 2 + np.array([0, 0, 20])
        path = line3(a, m, b)
        arm = tube(path, lambda v: width * (1 - .7 * v ** 1.3) + 1.2, flat=.16)
        sc.add(Surface(arm, hatch=[dict(along='v', n=7, m=600)],
                       tone=.1, wmax=2.6, t=lambda u, v: t0 + (t1 - t0) * v))
        k = len(sc.items)
        for q in np.linspace(.3, .5, 9):          # the ribbed grip
            u = np.linspace(.0, .5, 30)
            sc.curve(k, u, np.full_like(u, q), .9, taper=4)


def add_beads(sc, R, at, size, pts, rad, tone=.35, t=.8, lift=0.0):
    """little spheres (caviar, pearls of sauce) at local points pts, each of radius rad (local units)"""
    for c in pts:
        c = np.asarray(c, float)
        sp = lambda u, v, c=c: np.stack([rad * np.sin(v * math.pi) * np.cos(u * TAU), -rad * np.cos(v * math.pi), rad * np.sin(v * math.pi) * np.sin(u * TAU)], -1) + c - np.array([0, rad + lift, 0])
        sc.add(Surface(place(sp, R, at, size), hatch=[dict(along='u', n=5, m=50)], tone=tone, t=lambda u, v: t + 0 * u, outline=.5))


def add_dome(sc, R, at, size, c, rad, h=.5, tone=.1, t=.8):
    """a dot of purée on the plate: a soft dome"""
    c = np.asarray(c, float)
    f = lambda u, v: np.stack([rad * v * np.cos(u * TAU), -h * rad * (1 - v ** 2) ** .8, rad * v * np.sin(u * TAU)], -1) + c
    sc.add(Surface(place(f, R, at, size), hatch=[dict(along='u', n=6, m=100)], tone=tone, t=lambda u, v: t + 0 * u, outline=.5))


def add_flower(sc, R, at, size, c, rad, t=.9, petals=5):
    """a tiny edible flower (viola) lying on top"""
    c = np.asarray(c, float)
    for j in range(petals):
        a0 = j / petals * TAU
        def pet(u, v, a0=a0):
            a = a0 + (u * 2 - 1) * (math.pi / petals) * .95 * np.sin(math.pi * np.clip(v, 0, 1) ** .6)
            r = rad * v
            return np.stack([r * np.cos(a), -.02 - .1 * rad * v ** 2 + .04 * rad * np.sin(v * 8), r * np.sin(a)], -1) + c
        sc.add(Surface(place(pet, R, at, size), hatch=[dict(along='v', n=5, m=60)], tone=.05, t=lambda u, v: t + 0 * u, outline=.5))
    add_beads(sc, R, at, size, [c + np.array([0, -.01, 0])], rad * .18, tone=.5, t=t)


def card_canape():
    """Events card and menu 1: a plate of three canapés, tweezers setting a last leaf on the middle one"""
    sc = Scene()
    Rp = rot(ax=-1.0)
    P = (450, 930, -100)
    add_plate(sc, P, 210, Rp, t0=0, t1=.3)
    # dots of purée trailing between the canapés
    for i, (x, z, rr) in enumerate([(-.62, .5, .07), (-.45, .62, .05), (.1, .72, .06), (.32, .66, .045), (.55, .45, .065), (.7, .3, .04)]):
        add_dome(sc, Rp, P, 225, (x, -.0, z), rr, t=.5 + .04 * i)
    # left: a blini with a rose of cured fish and caviar
    add_blini(sc, (295, 935, -40), 86, Rp, .3, .6, seed=1)
    add_beads(sc, Rp, (295, 935, -40), 86, [(.55 + .12 * math.cos(q), -.33, .45 + .12 * math.sin(q)) for q in np.linspace(0, TAU, 7)[:-1]] + [(.55, -.36, .45)], .085, t=.6)
    # middle: the tartlet, with a quenelle, pearls and a viola
    add_tartlet(sc, (455, 900, -20), 102, Rp, .35, .7, seed=2)
    add_flower(sc, Rp, (455, 900, -20), 102, (-.45, -.66, .3), .32, t=.75)
    # right: another blini, finished with tiny herb leaves
    add_blini(sc, (618, 958, -40), 80, Rp, .4, .75, seed=3)
    rr = np.random.default_rng(5)
    for j in range(4):
        ang = rr.uniform(0, TAU)
        lf = leaf(width=.32, cup=.3, bend=.15, shape=basil_shape)
        add_leaf(sc, (618 + 22 * math.cos(ang), 925 + 9 * math.sin(ang), 20), ang + 2.2, 40, lf, tilt=(-.8, .2), t0=.75, t1=.85, veins=3, tone=.1)
    # the leaf in the tweezers, a moment before it lands
    tip = np.array([478, 780, 160])
    lf = leaf(width=.45, cup=.3, bend=.1, shape=lambda s: np.sqrt(np.clip(s * (1 - s), 0, 1)) * 2)
    add_leaf(sc, (tip[0] - 6, tip[1] + 8, tip[2] + 18), 1.75, 50, lf, tilt=(-.6, .3), t0=.85, t1=1, veins=3, tone=.2)
    add_tweezers(sc, (960, 250, 300), tip, width=14, t0=.6, t1=.95)
    sc.shadows += [(450, 1020, 290, 30, .45)]
    return sc


def slab(length=2.4, width=1.0, thick=.28, n=5.0, sag=.0, taper=.1):
    """a slice of raw fish: a soft-cornered slab, u along its length, v round its cross-section
    (v .5..1 is the top). It droops a little along its length."""
    def f(u, v):
        th = v * TAU
        c, s_ = np.cos(th), np.sin(th)
        k = (np.abs(c) ** n + np.abs(s_) ** n) ** (-1 / n)
        wv = width * (1 - taper * (2 * u - 1) ** 2)
        x = (u - .5) * length
        y = thick * s_ * k + sag * (2 * u - 1) ** 2
        z = wv / 2 * c * k
        return np.stack([x, y, z], -1)
    return f


def add_slice(sc, at, size, R, t0, t1, kind='salmon', seed=0):
    f = slab()
    k = len(sc.items) + 1
    tuna = kind == 'tuna'
    sc.add(Surface(place(f, R, at, size), hatch=[dict(along='u', n=int(size * .6), m=400), dict(along='v', n=int(size * 1.4), m=200, cross=True, lo=.45 if tuna else .7)],
                   tone=.5 if tuna else .14, wmax=3.0, stipple=int(size * (60 if tuna else 10)), t=lambda u, v: t0 + (t1 - t0) * u))
    if kind == 'salmon':
        r = np.random.default_rng(seed)
        for u0 in np.arange(.08, .95, .085) + r.uniform(-.01, .01):
            v = np.linspace(.53, .97, 60)
            u = u0 + .12 * (v - .53) / .44 + .012 * np.sin(v * 20)
            sc.curve(k, np.clip(u, 0, 1), v, lambda d: .9 + .6 * np.clip(d, 0, 1), taper=8)


def add_chopstick(sc, a, b, t0, t1, r0=5.5, r1=2.2):
    path = line3(np.asarray(a, float), (np.asarray(a, float) + np.asarray(b, float)) / 2, np.asarray(b, float))
    sq = lambda v, ang: (r0 + (r1 - r0) * v) * (np.abs(np.cos(ang)) ** 4 + np.abs(np.sin(ang)) ** 4) ** (-1 / 4)
    sc.add(Surface(tube(path, sq), hatch=[dict(along='v', n=10, m=700)], tone=.25, wmax=2.8, t=lambda u, v: t0 + (t1 - t0) * v))


def menu_sashimi():
    """Events menu 2: sashimi of salmon and tuna on a long plate, with shiso, wasabi and chopsticks"""
    sc = Scene()
    Rp = rot(ax=-1.0) @ rot(ay=.0)
    P = np.array([520, 1040, -60])
    Rt = rot(az=-.32) @ rot(ax=-1.05)
    # the long plate: a low slab
    plate = slab(length=3.2, width=1.25, thick=.05, n=8, sag=0, taper=0)
    sc.add(Surface(place(plate, Rt, P, 210), hatch=[dict(along='u', n=26, m=900)], tone=.0, gain=.6, t=lambda u, v: .0 + .3 * u))
    # shiso leaf under the fish
    lf = leaf(width=.42, cup=.15, bend=.05, wave=.03, shape=lambda s: np.sin(math.pi * np.clip(s, 0, 1) ** .75) ** .8 * (1 + .07 * np.abs(np.sin(s * 34))))
    add_leaf(sc, tuple(P + Rt @ np.array([-60, -14, -10])), -2.6, 230, lf, tilt=(-1.0, .1), t0=.25, t1=.45, veins=6, tone=.12)
    # salmon, fanned, then tuna
    for i in range(5):
        c = P + Rt @ np.array([-185 + i * 30, -14 - 4 * i, 20])
        add_slice(sc, tuple(c), 62, Rt @ rot(ay=.75) @ rot(az=-.12), .35 + .05 * i, .5 + .05 * i, 'salmon', seed=i)
    for i in range(4):
        c = P + Rt @ np.array([70 + i * 30, -14 - 4 * i, 10])
        add_slice(sc, tuple(c), 58, Rt @ rot(ay=.75) @ rot(az=-.12), .55 + .05 * i, .7 + .05 * i, 'tuna', seed=10 + i)
    # wasabi, in a little leaf-shaped dab
    add_dome(sc, Rt, P, 210, (1.2, -.06, -.35), .14, h=.9, tone=.25, t=.8)
    # chopsticks resting across the near corner
    # a little ceramic rest, and the chopsticks lying on it
    rest = lambda u, v: np.stack([(u - .5) * 70, -9 * np.sin(math.pi * v) - 4 * np.cos(math.pi * 2 * (u - .5)) * 0, (v - .5) * 22], -1)
    sc.add(Surface(place(rest, rot(az=-.32) @ rot(ax=-1.0), (300, 1215, 150), 1), hatch=[dict(along='u', n=10, m=200)], tone=.1, t=lambda u, v: .75 + 0 * u))
    add_chopstick(sc, (240, 1215, 175), (900, 960, 175), .78, 1.0)
    add_chopstick(sc, (250, 1240, 172), (905, 990, 172), .8, 1.0)
    # a little dish of soy at the top of the page
    bowl = lambda u, v: np.stack([(.55 + .45 * v) * np.cos(u * TAU), -.32 * v ** 2, (.55 + .45 * v) * np.sin(u * TAU)], -1)
    sc.add(Surface(place(bowl, rot(ax=-1.0), (740, 330, 0), 120), hatch=[dict(along='u', n=26, m=700)], tone=.05, t=lambda u, v: .0 + .2 * u))
    base = lambda u, v: np.stack([.55 * v * np.cos(u * TAU), 0 * u, .55 * v * np.sin(u * TAU)], -1)
    sc.add(Surface(place(base, rot(ax=-1.0), (740, 330, 0), 120), hatch=[dict(along='u', n=12, m=500)], tone=.45, stipple=2500, t=lambda u, v: .2 + 0 * u))
    side = lambda u, v: np.stack([np.cos(u * TAU), -.32 + .2 * v + 0 * u, np.sin(u * TAU)], -1) * np.array([1, 1, 1])
    sc.add(Surface(place(side, rot(ax=-1.0), (740, 330, 0), 120), hatch=[dict(along='v', n=90, m=30)], tone=.15, t=lambda u, v: .1 + 0 * u))
    sc.shadows += [(520, 1170, 340, 30, .5), (745, 400, 130, 16, .5)]
    return sc


def card_tomato():
    """Summer card: Vesuvio tomatoes, two whole and one halved"""
    sc = Scene()
    add_tomato(sc, (560, 560, 0), 215, rot(ax=-0.45, ay=0.5), seed=5, t0=.0, t1=.6, fruit=1)
    add_tomato(sc, (330, 760, 60), 190, rot(ax=-0.55, ay=-0.4, az=0.08), seed=3, t0=.2, t1=.8, fruit=2)
    add_tomato_half(sc, (600, 930, 160), 175, rot(ax=-1.0, ay=0.2), seed=8, t0=.45, t1=1.0, fruit=3)
    sc.shadows += [(560, 760, 220, 30, .7), (330, 960, 210, 32, .8), (610, 1080, 200, 30, .8)]
    return sc


def menu_tomato_basil():
    """Summer menu 1: a basil sprig rising on the left, tomatoes on the right"""
    sc = Scene()
    basil_sprig(sc, (-10, 1180), (190, 360), t0=0, t1=.75, seed=2)
    add_tomato(sc, (810, 590, 0), 165, rot(ax=-0.45, ay=0.5), seed=5, t0=.2, t1=.75, fruit=1)
    add_tomato_half(sc, (760, 935, 160), 140, rot(ax=-1.0, ay=0.2), seed=8, t0=.4, t1=1.0, fruit=2)
    sc.shadows += [(800, 750, 170, 24, .7), (770, 1060, 160, 24, .8)]
    return sc


def menu_scallops():
    """Summer menu 2: scallops, one on the half shell and two closed shells"""
    sc = Scene()
    add_scallop_closed(sc, (110, 460, 0), 230, rot(ax=.35, az=.5), t0=0, t1=.6, seed=1, fruit=1)
    add_scallop_closed(sc, (790, 930, -40), 230, rot(ax=.4, ay=-.2, az=-.35), t0=.15, t1=.7, seed=2, fruit=2)
    add_scallop_open(sc, (720, 1150, 60), 270, rot(ax=-.85, az=-.2), t0=.3, t1=1.0, seed=3, fruit=3)
    sc.shadows += [(760, 1170, 230, 30, .6)]
    return sc


CARD_ONLY = {'tomato', 'squash', 'radicchio'}

SCENES = {
    'sashimi': menu_sashimi,
    'canape': card_canape,
    'courgette': menu_courgette,
    'asparagus': menu_asparagus,
    'langoustine': menu_langoustine,
    'radicchio-menu': menu_radicchio,
    'radicchio': card_radicchio,
    'beetroot': menu_beetroot,
    'pumpkin': menu_pumpkin,
    'squash': card_squash,
    'scallops': menu_scallops,
    'tomato': card_tomato,
    'tomato-basil': menu_tomato_basil,
}


if __name__ == '__main__':
    import json
    args = sys.argv[1:]
    prev = None
    if '--preview' in args:
        i = args.index('--preview'); prev = args[i + 1]; del args[i:i + 2]
    index_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'drawn.json')
    try:
        index = json.load(open(index_path))
    except (OSError, ValueError):
        index = {}
    for name in args or SCENES:
        sc = SCENES[name]()
        if prev:
            os.makedirs(prev, exist_ok=True)
            sc.render(preview=os.path.join(prev, name + '.png'))
        else:
            img = sc.render()
            img.save(os.path.join(SITE, f'art-{name}.webp'), lossless=True)
            # the cards don't animate their drawing, so only the menu drawings need a growth map
            fruits = [] if name in CARD_ONLY else sc.growth_map(os.path.join(SITE, f'art-{name}-grow.png'))
            index[name] = {'fruits': fruits, 'extent': sc.frame()}
            json.dump(index, open(index_path, 'w'), indent=1)
        print('drew', name)
