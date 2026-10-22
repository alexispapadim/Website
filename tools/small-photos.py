#!/usr/bin/env python3
"""Make the phone-sized copies of the gallery photos (sm/<name>.webp, 640 px wide).

Phones load these instead of the full photos, which is much quicker on a slow connection.
The full photo still opens when a dish is tapped. A photo without a small copy still works;
it just loads the full file. Run from the site folder after adding photos:

    python3 tools/small-photos.py

Needs Pillow (pip install pillow). Only photos listed in gallery.js are converted, and
existing copies are kept unless the original is newer.
"""
import os, re
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WIDTH, QUALITY = 640, 76

def main():
    src = open(os.path.join(ROOT, 'gallery.js'), encoding='utf-8').read()
    files = sorted(set(re.findall(r"file:\s*'([^']+)'", src)))
    os.makedirs(os.path.join(ROOT, 'sm'), exist_ok=True)
    for f in files:
        full = os.path.join(ROOT, f)
        if not os.path.exists(full):
            print('missing', f); continue
        out = os.path.join(ROOT, 'sm', os.path.splitext(f)[0] + '.webp')
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(full):
            continue
        im = ImageOps.exif_transpose(Image.open(full)).convert('RGB')
        if im.width > WIDTH:
            im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        im.save(out, 'WEBP', quality=QUALITY, method=6)
        print(f'{f}: {os.path.getsize(full)//1024} KB -> sm/{os.path.basename(out)}: {os.path.getsize(out)//1024} KB')

if __name__ == '__main__':
    main()
