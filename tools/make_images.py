# Makes the smaller copies the pages ask for, next to each screenshot. Needs Pillow (pip install pillow).
#
#   python tools/make_images.py images/projects/archlens.jpg      one screenshot (1200 × 750 JPG)
#   python tools/make_images.py                                   every screenshot and the résumé preview
#
# For <name>.jpg it writes <name>-600.jpg and <name>-900.jpg (the JPEG fallbacks) and <name>-600/-750/-900.webp
# plus <name>.webp (what most browsers download). For images/resume-preview.jpg it writes -600/-900 WebP and a
# full-size WebP. Re-run it whenever you replace a screenshot.
import glob
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def resized(img, width):
    return img if width >= img.width else img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)


def screenshot(path):
    img = Image.open(path).convert('RGB')
    base = path[:-4]
    for width in (600, 900):
        resized(img, width).save(f'{base}-{width}.jpg', 'JPEG', quality=82, optimize=True, progressive=True)
    for width in (600, 750, 900):
        resized(img, width).save(f'{base}-{width}.webp', 'WEBP', quality=80, method=6)
    img.save(f'{base}.webp', 'WEBP', quality=80, method=6)
    print('made copies of', os.path.relpath(path, ROOT))


def resume_preview(path):
    img = Image.open(path).convert('RGB')
    base = path[:-4]
    for width in (600, 900):
        resized(img, width).save(f'{base}-{width}.webp', 'WEBP', quality=80, method=6)
    img.save(f'{base}.webp', 'WEBP', quality=80, method=6)
    print('made copies of', os.path.relpath(path, ROOT))


if __name__ == '__main__':
    paths = sys.argv[1:] or [
        p for p in glob.glob(os.path.join(ROOT, 'images', 'projects', '**', '*.jpg'), recursive=True)
        if not p.endswith(('-600.jpg', '-900.jpg'))
    ] + [os.path.join(ROOT, 'images', 'resume-preview.jpg')]
    for p in paths:
        p = os.path.abspath(p)
        (resume_preview if os.path.basename(p) == 'resume-preview.jpg' else screenshot)(p)
