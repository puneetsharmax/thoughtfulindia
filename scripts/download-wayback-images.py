#!/usr/bin/env python3 -u
"""
Download missing images from Wayback Machine.
Maps /images/YYYY/MM/file.jpg -> wp-content/uploads/YYYY/MM/file.jpg on archive.org
Run with: python3 -u script.py
"""
import subprocess, os, time, re, sys

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True)

REPO = os.path.expanduser("~/CoWorkClaude/thoughtfulindia")
POSTS_DIR = os.path.join(REPO, "content/posts")
PUBLIC_IMAGES = os.path.join(REPO, "public/images")

def log(msg):
    print(msg, flush=True)

# Step 1: Extract all image paths referenced in markdown posts
log("Scanning posts for image references...")
needed = set()
img_pattern = re.compile(r'/images/([^)"\'> \n]+\.(?:jpg|jpeg|png|gif|webp|JPG|PNG|JPEG|GIF))', re.IGNORECASE)

for fname in os.listdir(POSTS_DIR):
    if not fname.endswith('.md'):
        continue
    with open(os.path.join(POSTS_DIR, fname), 'r', errors='replace') as f:
        content = f.read()
    for m in img_pattern.finditer(content):
        needed.add(m.group(1))

log(f"Total unique image refs in posts: {len(needed)}")

# Step 2: Check which already exist
missing = set()
for path in needed:
    fullpath = os.path.join(PUBLIC_IMAGES, path)
    if not (os.path.exists(fullpath) and os.path.getsize(fullpath) > 500):
        missing.add(path)

log(f"Already in repo: {len(needed) - len(missing)}")
log(f"Missing (need to fetch): {len(missing)}")

# Step 3: Fetch from Wayback Machine
os.makedirs(PUBLIC_IMAGES, exist_ok=True)

success = 0
fail = 0
skipped = 0

missing_sorted = sorted(missing)
total = len(missing_sorted)

for i, path in enumerate(missing_sorted):
    outfile = os.path.join(PUBLIC_IMAGES, path)

    if os.path.exists(outfile) and os.path.getsize(outfile) > 500:
        skipped += 1
        continue

    os.makedirs(os.path.dirname(outfile), exist_ok=True)

    # Try multiple Wayback timestamps and both www/non-www
    attempts = [
        f"https://web.archive.org/web/2020if_/https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2020if_/https://www.thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2015if_/http://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2014if_/http://thoughtfulindia.com/wp-content/uploads/{path}",
    ]

    got_it = False
    for url in attempts:
        try:
            r = subprocess.run(
                ['curl', '-s', '-L', '--max-time', '25', '-o', outfile, '-w', '%{http_code}', url],
                capture_output=True, text=True, timeout=30
            )
            code = r.stdout.strip()
            size = os.path.getsize(outfile) if os.path.exists(outfile) else 0
            if code == '200' and size > 500:
                log(f"OK [{i+1}/{total}]: {path} ({size:,} bytes)")
                success += 1
                got_it = True
                break
            else:
                if os.path.exists(outfile):
                    os.remove(outfile)
        except Exception as e:
            if os.path.exists(outfile):
                os.remove(outfile)

    if not got_it:
        log(f"FAIL [{i+1}/{total}]: {path}")
        fail += 1

    time.sleep(0.3)

log(f"\n{'='*50}")
log(f"Downloaded: {success}")
log(f"Failed:     {fail}")
log(f"Skipped:    {skipped}")
log(f"Total files now in public/images: {sum(len(files) for _, _, files in os.walk(PUBLIC_IMAGES))}")
