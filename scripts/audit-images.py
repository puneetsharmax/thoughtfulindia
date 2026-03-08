#!/usr/bin/env python3
"""
Audit featured image coverage across all markdown posts.

Checks which featured_image paths from content/posts/*.md
are present in public/images/ and which are still missing.

Usage: python3 audit-images.py [--verbose]
"""

import os
import re
import sys
import glob

POSTS_DIR = "/Users/puneetsharma/CoWorkClaude/thoughtfulindia/content/posts"
PUBLIC_IMAGES = "/Users/puneetsharma/CoWorkClaude/thoughtfulindia/public/images"

verbose = "--verbose" in sys.argv

def extract_featured_image(md_path):
    """Extract featured_image value from frontmatter."""
    with open(md_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read(2000)  # only need frontmatter

    # Match: featured_image: /images/... or featured_image: "/images/..."
    m = re.search(r'^featured_image:\s*["\']?(/[^\s"\']+)["\']?', content, re.MULTILINE)
    if m:
        return m.group(1).strip()
    return None

def main():
    posts = glob.glob(os.path.join(POSTS_DIR, "*.md"))
    print(f"Posts found: {len(posts)}")

    # Gather all unique featured image paths
    image_paths = {}  # img_path → [post_slug, ...]
    no_image = 0

    for post in posts:
        slug = os.path.basename(post)
        img = extract_featured_image(post)
        if not img:
            no_image += 1
            continue
        if img not in image_paths:
            image_paths[img] = []
        image_paths[img].append(slug)

    print(f"Posts with featured_image: {len(image_paths) + (len(posts) - no_image - len(image_paths))}")
    print(f"Unique image paths: {len(image_paths)}")
    print(f"Posts without featured_image: {no_image}")

    # Check presence in public/images/
    present = []
    missing = []

    for img_path, used_by in image_paths.items():
        # img_path is like /images/2011/06/foo.jpg
        local = PUBLIC_IMAGES + img_path.replace("/images", "", 1)
        if os.path.exists(local):
            present.append(img_path)
        else:
            missing.append((img_path, used_by))

    print(f"\nPresent in public/images/: {len(present)}")
    print(f"Missing from public/images/: {len(missing)}")

    if missing:
        print(f"\nFirst 20 missing:")
        for img, used_by in missing[:20]:
            print(f"  {img}  (used by: {used_by[0]})")
        if len(missing) > 20:
            print(f"  ... and {len(missing) - 20} more")

        if verbose:
            print("\nAll missing:")
            for img, used_by in missing:
                print(f"  {img}")

    # Also check what's in Downloads backup but not yet synced
    backup_root = os.path.expanduser(
        "~/Downloads/thoughtfulindia-backup/wp-content/uploads"
    )
    if os.path.isdir(backup_root):
        in_backup = 0
        not_in_backup = 0
        for img_path, _ in missing:
            # /images/YYYY/MM/file → backup/YYYY/MM/file
            rel = img_path.replace("/images/", "")
            backup_file = os.path.join(backup_root, rel)
            if os.path.exists(backup_file):
                in_backup += 1
            else:
                not_in_backup += 1
        print(f"\nOf {len(missing)} missing from public/images/:")
        print(f"  In backup (ready to sync): {in_backup}")
        print(f"  Not in backup (not downloaded): {not_in_backup}")

    print("\nCoverage: {:.1f}%".format(100 * len(present) / max(len(image_paths), 1)))


if __name__ == "__main__":
    main()
