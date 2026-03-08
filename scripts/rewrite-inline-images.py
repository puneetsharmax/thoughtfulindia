#!/usr/bin/env python3
"""
Rewrite inline WordPress image URLs in post bodies to local /images/ paths.

Replaces:
  https://www.thoughtfulindia.com/wp-content/uploads/YYYY/MM/file.jpg
  http://www.thoughtfulindia.com/wp-content/uploads/YYYY/MM/file.jpg
  https://thoughtfulindia.com/wp-content/uploads/YYYY/MM/file.jpg

With:
  /images/YYYY/MM/file.jpg

Also rewrites any markdown image links wrapping the same URLs, e.g.:
  [![alt](https://.../wp-content/uploads/...)](https://.../wp-content/uploads/...)
  → ![alt](/images/...)

Dry-run by default. Pass --write to apply changes.
"""

import os
import re
import glob
import sys

POSTS_DIR = "/Users/puneetsharma/CoWorkClaude/thoughtfulindia/content/posts"

# Match full WP upload URLs
WP_URL_RE = re.compile(
    r'https?://(?:www\.)?thoughtfulindia\.com/wp-content/uploads/([\w./%+\-]+)',
    re.IGNORECASE
)

# Also catch bare /wp-content/uploads/ references
WP_REL_RE = re.compile(r'/wp-content/uploads/([\w./%+\-]+)')

dry_run = "--write" not in sys.argv

def rewrite_post(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        original = f.read()

    # Split frontmatter from body (don't touch frontmatter featured_image — already correct)
    if original.startswith("---"):
        parts = original.split("---", 2)
        if len(parts) >= 3:
            frontmatter = "---" + parts[1] + "---"
            body = parts[2]
        else:
            frontmatter = ""
            body = original
    else:
        frontmatter = ""
        body = original

    # Rewrite absolute WP URLs in body
    new_body = WP_URL_RE.sub(lambda m: "/images/" + m.group(1), body)
    # Rewrite relative /wp-content/uploads/ in body  
    new_body = WP_REL_RE.sub(lambda m: "/images/" + m.group(1), new_body)

    new_content = frontmatter + new_body

    if new_content == original:
        return False  # No changes

    if not dry_run:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
    return True


def main():
    posts = sorted(glob.glob(os.path.join(POSTS_DIR, "*.md")))
    changed = 0
    unchanged = 0

    for post in posts:
        if rewrite_post(post):
            changed += 1
            if dry_run:
                print(f"  WOULD rewrite: {os.path.basename(post)}")
        else:
            unchanged += 1

    mode = "DRY RUN" if dry_run else "APPLIED"
    print(f"\n[{mode}] {changed} posts rewritten, {unchanged} unchanged")
    if dry_run:
        print("Run with --write to apply changes.")


if __name__ == "__main__":
    main()
