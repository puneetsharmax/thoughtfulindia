#!/usr/bin/env python3
"""
Multi-source image downloader for thoughtfulindia.com
Sources: Wayback Machine CDX (verified snapshots only) + archive.ph
Skips paths that were clearly hotlinked from external sites (NYT, etc.)
Runs with parallelism for speed.
"""
import os, re, sys, time, json, subprocess, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

REPO = os.path.expanduser("~/CoWorkClaude/thoughtfulindia")
POSTS_DIR = os.path.join(REPO, "content/posts")
PUBLIC_IMAGES = os.path.join(REPO, "public/images")
LOG = os.path.join(REPO, "scripts/download-v2.log")
WORKERS = 6  # parallel downloads

# Patterns that indicate hotlinked external images (not on thoughtfulindia.com server)
EXTERNAL_PATTERNS = [
    r'articleLarge', r'articleInline', r'articleSmall',  # NYT
    r'thumbStandard', r'thumbWide', r'jumbo',             # NYT
    r'articleMedium', r'moth', r'sfSpan',                 # NYT
    r'^\d{13}_',                                          # timestamp-only filenames (external)
]
EXTERNAL_RE = re.compile('|'.join(EXTERNAL_PATTERNS))

def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f:
        f.write(msg + '\n')

def is_likely_external(path):
    """Return True if this path looks like a hotlinked external image"""
    return bool(EXTERNAL_RE.search(path))

def wayback_cdx_check(path):
    """Ask CDX API if Wayback has this image. Returns best timestamp or None."""
    for base in [
        f"https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://www.thoughtfulindia.com/wp-content/uploads/{path}",
        f"http://thoughtfulindia.com/wp-content/uploads/{path}",
    ]:
        try:
            url = f"https://web.archive.org/cdx/search/cdx?url={urllib.parse.quote(base)}&output=json&limit=1&fl=timestamp,statuscode&filter=statuscode:200"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())
                if len(data) > 1:  # first row is header
                    return data[1][0]  # timestamp
        except:
            pass
    return None

def try_wayback(path, outfile):
    """Try downloading from Wayback Machine with multiple fallback timestamps."""
    attempts = [
        f"https://web.archive.org/web/2023if_/https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2022if_/https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2020if_/https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2018if_/https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2020if_/https://www.thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://web.archive.org/web/2015if_/http://thoughtfulindia.com/wp-content/uploads/{path}",
    ]
    for url in attempts:
        try:
            r = subprocess.run(
                ['curl', '-s', '-L', '--max-time', '20', '-o', outfile, '-w', '%{http_code}', url],
                capture_output=True, text=True, timeout=25
            )
            code = r.stdout.strip()
            size = os.path.getsize(outfile) if os.path.exists(outfile) else 0
            if code == '200' and size > 500:
                return ('wayback', size)
            else:
                if os.path.exists(outfile): os.remove(outfile)
        except:
            if os.path.exists(outfile): os.remove(outfile)
    return None

def try_archiveph(path, outfile):
    """Try archive.ph for the page that contained this image — less reliable for direct images."""
    # archive.ph stores pages, not individual images, so skip for now
    # Could be added later if needed
    return None

def try_direct_wayback_cdx(path, outfile):
    """Use CDX to find exact snapshot timestamp then download that."""
    import urllib.parse
    for base_url in [
        f"https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"http://thoughtfulindia.com/wp-content/uploads/{path}",
    ]:
        try:
            cdx_url = f"https://web.archive.org/cdx/search/cdx?url={urllib.parse.quote(base_url)}&output=json&limit=3&fl=timestamp,original&filter=statuscode:200&collapse=digest"
            req = urllib.request.Request(cdx_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as r:
                data = json.loads(r.read())
                if len(data) > 1:
                    ts = data[1][0]
                    img_url = f"https://web.archive.org/web/{ts}if_/{base_url}"
                    r2 = subprocess.run(
                        ['curl', '-s', '-L', '--max-time', '20', '-o', outfile, '-w', '%{http_code}', img_url],
                        capture_output=True, text=True, timeout=25
                    )
                    code = r2.stdout.strip()
                    size = os.path.getsize(outfile) if os.path.exists(outfile) else 0
                    if code == '200' and size > 500:
                        return ('cdx', size)
                    else:
                        if os.path.exists(outfile): os.remove(outfile)
        except:
            if os.path.exists(outfile): os.remove(outfile)
    return None

def download_one(i, total, path):
    outfile = os.path.join(PUBLIC_IMAGES, path)
    # Already downloaded?
    if os.path.exists(outfile) and os.path.getsize(outfile) > 500:
        return ('skip', path, 0)
    # Skip obvious external hotlinks
    if is_likely_external(path):
        return ('external', path, 0)
    os.makedirs(os.path.dirname(outfile), exist_ok=True)
    # Try CDX-verified download first (most reliable)
    result = try_direct_wayback_cdx(path, outfile)
    if result:
        return ('ok', path, result[1])
    # Fallback: brute-force Wayback timestamps
    result = try_wayback(path, outfile)
    if result:
        return ('ok', path, result[1])
    return ('fail', path, 0)

import urllib.parse

# ── Scan posts ──────────────────────────────────────────────────────────────
log("=== Multi-source image downloader v2 ===")
log(f"Scanning posts in {POSTS_DIR}...")
needed = set()
img_pattern = re.compile(r'/images/([^)"\'> \n]+\.(?:jpg|jpeg|png|gif|webp))', re.IGNORECASE)
for fname in os.listdir(POSTS_DIR):
    if not fname.endswith('.md'): continue
    with open(os.path.join(POSTS_DIR, fname), 'r', errors='replace') as f:
        for m in img_pattern.finditer(f.read()):
            needed.add(m.group(1))

missing = sorted(p for p in needed
                 if not (os.path.exists(os.path.join(PUBLIC_IMAGES, p))
                         and os.path.getsize(os.path.join(PUBLIC_IMAGES, p)) > 500))

log(f"Total image refs: {len(needed)}")
log(f"Already have:     {len(needed) - len(missing)}")
log(f"Missing:          {len(missing)}")

external_count = sum(1 for p in missing if is_likely_external(p))
log(f"Likely external (will skip): {external_count}")
log(f"Will attempt to fetch:       {len(missing) - external_count}")
log(f"Workers: {WORKERS}")
log("─" * 50)

ok = fail = skip = external = 0
total = len(missing)

with ThreadPoolExecutor(max_workers=WORKERS) as ex:
    futures = {ex.submit(download_one, i, total, path): path
               for i, path in enumerate(missing)}
    for fut in as_completed(futures):
        path = futures[fut]
        try:
            status, p, size = fut.result()
        except Exception as e:
            status, p, size = 'fail', path, 0
        done = ok + fail + skip + external + 1
        if status == 'ok':
            ok += 1
            log(f"OK  [{done}/{total}] {p} ({size:,}b)")
        elif status == 'skip':
            skip += 1
        elif status == 'external':
            external += 1
            if external <= 5 or external % 50 == 0:
                log(f"EXT [{done}/{total}] {p}")
        else:
            fail += 1
            log(f"FAIL[{done}/{total}] {p}")

log("=" * 50)
log(f"Downloaded OK: {ok}")
log(f"Failed:        {fail}")
log(f"External skip: {external}")
log(f"Already had:   {skip}")
total_files = sum(len(files) for _, _, files in os.walk(PUBLIC_IMAGES))
log(f"Total in public/images: {total_files}")
