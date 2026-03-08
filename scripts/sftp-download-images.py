#!/usr/bin/env python3 -u
"""
Download missing images from DreamHost via SFTP.
Maps wp-content/uploads/YYYY/MM/file.jpg -> public/images/YYYY/MM/file.jpg

Usage:
  python3 -u scripts/sftp-download-images.py --password YOUR_PASSWORD

Requirements:
  pip3 install paramiko --break-system-packages
"""

import os, sys, re, argparse, time
sys.stdout.reconfigure(line_buffering=True)

# SSH credentials
HOST = "pdx1-shared-a4-04.dreamhost.com"
PORT = 22
USER = "dh_pe22np"
REMOTE_UPLOADS = "/home/dh_pe22np/thoughtfulindia.com/wp-content/uploads"

REPO = os.path.expanduser("~/CoWorkClaude/thoughtfulindia")
POSTS_DIR = os.path.join(REPO, "content/posts")
PUBLIC_IMAGES = os.path.join(REPO, "public/images")

def log(msg):
    print(msg, flush=True)

def get_missing_images():
    """Find all image paths referenced in posts that are missing locally."""
    needed = set()
    img_pattern = re.compile(
        r'/images/([^)"\'> \n]+\.(?:jpg|jpeg|png|gif|webp|JPG|PNG|JPEG|GIF))',
        re.IGNORECASE
    )
    for fname in os.listdir(POSTS_DIR):
        if not fname.endswith('.md'):
            continue
        with open(os.path.join(POSTS_DIR, fname), 'r', errors='replace') as f:
            content = f.read()
        for m in img_pattern.finditer(content):
            needed.add(m.group(1))

    missing = []
    for path in sorted(needed):
        fullpath = os.path.join(PUBLIC_IMAGES, path)
        if not (os.path.exists(fullpath) and os.path.getsize(fullpath) > 500):
            missing.append(path)
    return missing

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--password', required=True, help='Password for dh_pe22np')
    parser.add_argument('--limit', type=int, default=0, help='Max files to download (0=all)')
    args = parser.parse_args()

    try:
        import paramiko
    except ImportError:
        log("Installing paramiko...")
        os.system("pip3 install paramiko --break-system-packages -q")
        import paramiko

    log(f"Connecting to {HOST} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, port=PORT, username=USER, password=args.password, timeout=30)
    sftp = ssh.open_sftp()
    log("Connected!")

    missing = get_missing_images()
    total = len(missing)
    log(f"Missing images: {total}")
    if args.limit:
        missing = missing[:args.limit]
        log(f"Limiting to first {args.limit}")

    success = 0
    fail = 0
    skip = 0
    os.makedirs(PUBLIC_IMAGES, exist_ok=True)

    for i, rel_path in enumerate(missing):
        local_path = os.path.join(PUBLIC_IMAGES, rel_path)
        remote_path = f"{REMOTE_UPLOADS}/{rel_path}"

        if os.path.exists(local_path) and os.path.getsize(local_path) > 500:
            skip += 1
            continue

        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        try:
            sftp.get(remote_path, local_path)
            size = os.path.getsize(local_path)
            if size > 500:
                log(f"OK [{i+1}/{total}]: {rel_path} ({size:,} bytes)")
                success += 1
            else:
                os.remove(local_path)
                log(f"TINY [{i+1}/{total}]: {rel_path}")
                fail += 1
        except FileNotFoundError:
            log(f"404 [{i+1}/{total}]: {rel_path}")
            fail += 1
            if os.path.exists(local_path):
                os.remove(local_path)
        except Exception as e:
            log(f"ERR [{i+1}/{total}]: {rel_path} — {e}")
            fail += 1
            if os.path.exists(local_path):
                os.remove(local_path)

    sftp.close()
    ssh.close()

    log(f"\n{'='*50}")
    log(f"Downloaded: {success}")
    log(f"Failed/Missing on server: {fail}")
    log(f"Skipped (already exists): {skip}")
    log(f"Total in public/images: {sum(len(f) for _,_,f in os.walk(PUBLIC_IMAGES))}")

if __name__ == '__main__':
    main()
