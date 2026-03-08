#!/usr/bin/env python3
"""
Sync downloaded WP uploads → Next.js public/images/

Maps:
  ~/Downloads/thoughtfulindia-backup/wp-content/uploads/YYYY/MM/file
  → /Users/puneetsharma/CoWorkClaude/thoughtfulindia/public/images/YYYY/MM/file

Skips files already present (size match).
Prints summary at the end.
"""

import os
import shutil
import sys

SRC = os.path.expanduser("~/Downloads/thoughtfulindia-backup/wp-content/uploads")
DST = "/Users/puneetsharma/CoWorkClaude/thoughtfulindia/public/images"

def main():
    copied = 0
    skipped = 0
    errors = 0
    bytes_copied = 0

    for dirpath, dirnames, filenames in os.walk(SRC):
        # Compute relative path from SRC root
        rel = os.path.relpath(dirpath, SRC)
        dst_dir = os.path.join(DST, rel) if rel != "." else DST

        for fname in filenames:
            src_file = os.path.join(dirpath, fname)
            dst_file = os.path.join(dst_dir, fname)

            src_size = os.path.getsize(src_file)

            # Skip if already present with matching size
            if os.path.exists(dst_file):
                dst_size = os.path.getsize(dst_file)
                if dst_size == src_size:
                    skipped += 1
                    continue

            try:
                os.makedirs(dst_dir, exist_ok=True)
                shutil.copy2(src_file, dst_file)
                copied += 1
                bytes_copied += src_size
                if copied % 500 == 0:
                    mb = bytes_copied / 1024 / 1024
                    print(f"  {copied} copied ({mb:.1f} MB) | {skipped} skipped | {errors} errors", flush=True)
            except Exception as e:
                print(f"  ERROR: {src_file} → {dst_file}: {e}", flush=True)
                errors += 1

    mb = bytes_copied / 1024 / 1024
    print(f"\nDONE: {copied} copied ({mb:.1f} MB) | {skipped} skipped | {errors} errors")
    print(f"Destination: {DST}")


if __name__ == "__main__":
    main()
