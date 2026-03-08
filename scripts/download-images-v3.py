#!/usr/bin/env python3
"""
v3 - CDX-first approach:
1. Ask Wayback CDX exactly which images it HAS for thoughtfulindia.com
2. Build a manifest of confirmed-available images
3. Download only those (no wasted requests)
4. Match against what posts need
5. Single-threaded with polite delay to avoid rate limiting
"""
import os, re, sys, time, json, subprocess, urllib.request, urllib.parse

REPO = os.path.expanduser("~/CoWorkClaude/thoughtfulindia")
POSTS_DIR = os.path.join(REPO, "content/posts")
PUBLIC_IMAGES = os.path.join(REPO, "public/images")
LOG = os.path.join(REPO, "scripts/download-v3.log")
MANIFEST = os.path.join(REPO, "scripts/wayback-manifest.json")

def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f:
        f.write(msg + '\n')

def cdx_fetch_all():
    """Fetch complete CDX index of all images Wayback has for thoughtfulindia.com/wp-content/uploads/"""
    log("Fetching CDX manifest from Wayback (this is the FULL list of what they have)...")
    results = {}  # path -> best timestamp
    
    for base_url in [
        "thoughtfulindia.com/wp-content/uploads/*",
        "www.thoughtfulindia.com/wp-content/uploads/*",
    ]:
        offset = 0
        while True:
            cdx_url = (
                f"https://web.archive.org/cdx/search/cdx"
                f"?url={urllib.parse.quote(base_url)}"
                f"&output=json&fl=timestamp,original,statuscode"
                f"&filter=statuscode:200"
                f"&collapse=original"
                f"&limit=1000&offset={offset}"
            )
            try:
                req = urllib.request.Request(cdx_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = json.loads(r.read())
                if len(data) <= 1:
                    break
                rows = data[1:]
                for row in rows:
                    ts, original, code = row[0], row[1], row[2]
                    # Extract path after /wp-content/uploads/
                    m = re.search(r'wp-content/uploads/(.+)', original)
                    if m:
                        path = m.group(1).rstrip('/')
                        # Keep earliest timestamp (more likely to be original)
                        if path not in results or ts < results[path]:
                            results[path] = ts
                log(f"  {base_url}: fetched {offset+len(rows)} so far...")
                if len(rows) < 1000:
                    break
                offset += 1000
                time.sleep(1)
            except Exception as e:
                log(f"  CDX error at offset {offset}: {e}")
                time.sleep(5)
                break
    
    return results

# ── Step 1: Load or fetch CDX manifest ──────────────────────────────────────
if os.path.exists(MANIFEST):
    log(f"Loading cached CDX manifest from {MANIFEST}")
    with open(MANIFEST) as f:
        manifest = json.load(f)
    log(f"Manifest has {len(manifest)} confirmed Wayback images")
else:
    manifest = cdx_fetch_all()
    with open(MANIFEST, 'w') as f:
        json.dump(manifest, f, indent=2)
    log(f"Manifest saved: {len(manifest)} confirmed Wayback images")

# ── Step 2: Scan posts for needed images ─────────────────────────────────────
log("\nScanning posts for image references...")
needed = set()
img_pattern = re.compile(r'/images/([^)"\'> \n]+\.(?:jpg|jpeg|png|gif|webp))', re.IGNORECASE)
for fname in os.listdir(POSTS_DIR):
    if not fname.endswith('.md'): continue
    with open(os.path.join(POSTS_DIR, fname), 'r', errors='replace') as f:
        for m in img_pattern.finditer(f.read()):
            needed.add(m.group(1))

log(f"Posts need:       {len(needed)} unique images")

already = {p for p in needed
           if os.path.exists(os.path.join(PUBLIC_IMAGES, p))
           and os.path.getsize(os.path.join(PUBLIC_IMAGES, p)) > 500}
log(f"Already have:     {len(already)}")

to_download = needed - already
log(f"Still missing:    {len(to_download)}")

# ── Step 3: Cross-reference with manifest ────────────────────────────────────
downloadable = {p: manifest[p] for p in to_download if p in manifest}
not_in_wayback = to_download - set(downloadable.keys())

log(f"\nIn Wayback manifest:  {len(downloadable)}")
log(f"NOT in Wayback:       {len(not_in_wayback)}")
log(f"\nTop 20 NOT in Wayback (permanently lost):")
for p in sorted(not_in_wayback)[:20]:
    log(f"  LOST: {p}")

# ── Step 4: Download confirmed images ────────────────────────────────────────
log(f"\nDownloading {len(downloadable)} confirmed images from Wayback...")
log("Using single thread + 0.5s delay to avoid rate limiting")
log("=" * 50)

ok = fail = 0
total = len(downloadable)

for i, (path, ts) in enumerate(sorted(downloadable.items())):
    outfile = os.path.join(PUBLIC_IMAGES, path)
    if os.path.exists(outfile) and os.path.getsize(outfile) > 500:
        ok += 1
        continue
    
    os.makedirs(os.path.dirname(outfile), exist_ok=True)
    
    # Use exact CDX timestamp for most reliable download
    for base_url in [
        f"https://thoughtfulindia.com/wp-content/uploads/{path}",
        f"https://www.thoughtfulindia.com/wp-content/uploads/{path}",
        f"http://thoughtfulindia.com/wp-content/uploads/{path}",
    ]:
        wayback_url = f"https://web.archive.org/web/{ts}if_/{base_url}"
        try:
            r = subprocess.run(
                ['curl', '-s', '-L', '--max-time', '25', '-o', outfile, '-w', '%{http_code}', wayback_url],
                capture_output=True, text=True, timeout=30
            )
            code = r.stdout.strip()
            size = os.path.getsize(outfile) if os.path.exists(outfile) else 0
            if code == '200' and size > 500:
                ok += 1
                log(f"OK  [{i+1}/{total}] {path} ({size:,}b)")
                break
            else:
                if os.path.exists(outfile): os.remove(outfile)
        except Exception as e:
            if os.path.exists(outfile): os.remove(outfile)
    else:
        fail += 1
        log(f"FAIL[{i+1}/{total}] {path}")
    
    time.sleep(0.5)  # polite delay

log("=" * 50)
log(f"Downloaded:    {ok}")
log(f"Failed:        {fail}")
log(f"Permanently lost (not in Wayback): {len(not_in_wayback)}")
total_files = sum(len(files) for _, _, files in os.walk(PUBLIC_IMAGES))
log(f"Total in public/images: {total_files}")
