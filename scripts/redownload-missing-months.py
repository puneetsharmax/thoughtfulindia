#!/usr/bin/env python3
"""
Re-download specific year/month directories that are empty or partial.
Targets the 6 months with missing images:
  2011/09, 2012/06, 2013/02, 2013/03, 2013/04, 2014/09

Uses same DreamHost File Manager HTTP API as fmgr-download.py.
"""

import urllib.request
import urllib.parse
import json
import os
import base64
import time

API_URL = "https://us-west-files.dreamhost.com/application/api/api.php"

CONN = {
    "connectionType": "sftp",
    "configuration": {
        "passive": False,
        "password": "4MubzXZFChKkTa^LttrUZnHH95J45r",
        "ssl": False,
        "authenticationModeName": "Password",
        "host": "64.90.54.26",
        "remoteUsername": "dh_pe22np",
        "port": 22,
    },
}

REMOTE_BASE = "/home/dh_pe22np/thoughtfulindia.com/wp-content/uploads"
LOCAL_BASE = os.path.expanduser(
    "~/Downloads/thoughtfulindia-backup/wp-content/uploads"
)
DEST_BASE = "/Users/puneetsharma/CoWorkClaude/thoughtfulindia/public/images"

# The 6 months we need to re-download
TARGET_MONTHS = [
    "2011/09",
    "2012/06",
    "2013/02",
    "2013/03",
    "2013/04",
    "2014/09",
]

MAX_RETRIES = 4
RETRY_DELAY = 3


def api_call(action, context):
    req_body = dict(CONN)
    req_body["actionName"] = action
    req_body["context"] = context
    encoded = urllib.parse.urlencode({"request": json.dumps(req_body)}).encode()
    req = urllib.request.Request(
        API_URL,
        data=encoded,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=90) as resp:
        raw = resp.read().decode("utf-8", errors="replace")
    idx = min((raw.index(c) for c in ("{", "[") if c in raw), default=0)
    return json.loads(raw[idx:])


def list_dir(remote_path):
    result = api_call("listDirectory", {"path": remote_path})
    if not result.get("success"):
        raise RuntimeError(f"listDirectory failed: {result}")
    items = result.get("data", [])
    return [
        {
            "filename": info["name"],
            "isDirectory": info.get("isDirectory", False),
            "size": info.get("size", 0),
        }
        for info in items
    ]


def get_file_bytes(remote_path):
    result = api_call("getFileContents", {"remotePath": remote_path})
    if not result.get("success"):
        raise RuntimeError(f"getFileContents failed: {result}")
    b64_str = result["data"]
    if not b64_str:
        return b""
    decoded = base64.b64decode(b64_str + "==")
    return decoded.decode("utf-8", errors="replace").encode("latin-1", errors="replace")


def download_month(year_month):
    remote_dir = f"{REMOTE_BASE}/{year_month}"
    local_dir = os.path.join(LOCAL_BASE, year_month)
    dest_dir = os.path.join(DEST_BASE, year_month)

    os.makedirs(local_dir, exist_ok=True)
    os.makedirs(dest_dir, exist_ok=True)

    print(f"\n=== {year_month} ===")
    try:
        entries = list_dir(remote_dir)
    except Exception as e:
        print(f"  WARN: cannot list {remote_dir}: {e}")
        return 0, 0

    files = [e for e in entries if not e["isDirectory"]]
    print(f"  Remote files: {len(files)}")

    downloaded = 0
    skipped = 0
    errors = 0

    for f in files:
        remote_path = f"{remote_dir}/{f['filename']}"
        local_path = os.path.join(local_dir, f["filename"])
        dest_path = os.path.join(dest_dir, f["filename"])

        # Skip if already in dest
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
            skipped += 1
            continue

        # Download to backup first
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                raw = get_file_bytes(remote_path)
                # Write to both backup and dest
                with open(local_path, "wb") as fp:
                    fp.write(raw)
                with open(dest_path, "wb") as fp:
                    fp.write(raw)
                downloaded += 1
                print(f"  ✓ {f['filename']} ({len(raw):,}b)")
                break
            except Exception as e:
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY)
                else:
                    print(f"  ✗ ERROR [{attempt}] {f['filename']}: {e}")
                    errors += 1

    print(f"  Done: {downloaded} downloaded, {skipped} skipped, {errors} errors")
    return downloaded, errors


def main():
    print("Re-downloading missing months from DreamHost...")
    print(f"Target months: {TARGET_MONTHS}")
    total_dl = 0
    total_err = 0
    for ym in TARGET_MONTHS:
        dl, err = download_month(ym)
        total_dl += dl
        total_err += err
    print(f"\n=== COMPLETE: {total_dl} downloaded, {total_err} errors ===")


if __name__ == "__main__":
    main()
