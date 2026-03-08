#!/usr/bin/env python3
"""
DreamHost File Manager HTTP bulk downloader — parallel edition.
Uses the Monsta FTP API (getFileContents + listDirectory) to download
the entire thoughtfulindia.com wp-content/uploads tree — NO SSH needed.

Decode chain: base64_decode → utf8_decode → latin1_encode → raw bytes

Strategy:
  1. Walk the full remote tree (single-threaded) to build a work queue
  2. Download files in parallel with a ThreadPoolExecutor (8 workers)
  3. Skip files already on disk with matching size
  4. Retry up to 4 times on error

Usage:
    python3 fmgr-download.py [--remote /path] [--local /path] [--workers N]
"""

import urllib.request
import urllib.parse
import json
import os
import sys
import time
import base64
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

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

REMOTE_ROOT = "/home/dh_pe22np/thoughtfulindia.com/wp-content/uploads"
LOCAL_ROOT = os.path.expanduser(
    "~/Downloads/thoughtfulindia-backup/wp-content/uploads"
)
LOG_FILE = os.path.expanduser("~/Downloads/thoughtfulindia-fmgr.log")

WORKERS = 8       # parallel download threads
MAX_RETRIES = 4
RETRY_DELAY = 3   # seconds between retries

_log_lock = threading.Lock()
_stats_lock = threading.Lock()


def log(msg, logf=None):
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    with _log_lock:
        print(line, flush=True)
        if logf:
            logf.write(line + "\n")
            logf.flush()


def api_call(action, context):
    """Make one API call. Returns parsed JSON dict or raises.
    Strips PHP warnings/notices prepended before the JSON."""
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
    # Strip any PHP warnings/notices before the JSON
    idx = min(
        (raw.index(c) for c in ("{", "[") if c in raw),
        default=0,
    )
    return json.loads(raw[idx:])


def list_dir(remote_path):
    """Returns list of {filename, isDirectory, size} dicts."""
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
    """Downloads a single file. Returns raw bytes.
    Decode chain: base64_decode → utf8_decode → latin1_encode"""
    result = api_call("getFileContents", {"remotePath": remote_path})
    if not result.get("success"):
        raise RuntimeError(f"getFileContents failed: {result}")
    b64_str = result["data"]
    if not b64_str:
        return b""
    decoded = base64.b64decode(b64_str + "==")
    return decoded.decode("utf-8", errors="replace").encode("latin-1", errors="replace")


# ── Phase 1: Walk remote tree, collect all (remote_path, local_path, size) ──

def collect_work(remote_dir, local_dir, work_list, logf):
    """Recursively list remote tree and append file tuples to work_list."""
    os.makedirs(local_dir, exist_ok=True)
    try:
        entries = list_dir(remote_dir)
    except Exception as e:
        log(f"  WARN: cannot list {remote_dir}: {e}", logf)
        return

    dirs = [e for e in entries if e["isDirectory"]]
    files = [e for e in entries if not e["isDirectory"]]

    for f in files:
        remote_path = remote_dir.rstrip("/") + "/" + f["filename"]
        local_path = os.path.join(local_dir, f["filename"])
        work_list.append((remote_path, local_path, f["size"]))

    for d in dirs:
        collect_work(
            remote_dir.rstrip("/") + "/" + d["filename"],
            os.path.join(local_dir, d["filename"]),
            work_list,
            logf,
        )


# ── Phase 2: Download one file (called from thread pool) ──────────────────

def download_one(args):
    """Download a single file. Returns ('ok'|'skip'|'error', bytes_written)."""
    remote_path, local_path, remote_size, logf, stats = args

    # Skip if already present with matching size
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        local_size = os.path.getsize(local_path)
        if remote_size == 0 or abs(local_size - remote_size) / max(remote_size, 1) < 0.25:
            with _stats_lock:
                stats["skipped"] += 1
            return ("skip", 0)

    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            raw = get_file_bytes(remote_path)
            with open(local_path, "wb") as f:
                f.write(raw)
            n = len(raw)
            with _stats_lock:
                stats["downloaded"] += 1
                stats["bytes"] += n
                done = stats["downloaded"]
                if done % 100 == 0:
                    mb = stats["bytes"] / 1024 / 1024
                    log(
                        f"  *** {done} files | {mb:.1f} MB | "
                        f"{stats['skipped']} skipped | {stats['errors']} errors ***",
                        logf,
                    )
            return ("ok", n)
        except Exception as e:
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
            else:
                log(f"  ERROR [{attempt}] {remote_path}: {e}", logf)
                with _stats_lock:
                    stats["errors"] += 1
                return ("error", 0)


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--remote", default=REMOTE_ROOT)
    parser.add_argument("--local", default=LOCAL_ROOT)
    parser.add_argument("--workers", type=int, default=WORKERS)
    args = parser.parse_args()

    os.makedirs(args.local, exist_ok=True)

    with open(LOG_FILE, "a") as logf:
        log("=" * 60, logf)
        log("File Manager HTTP downloader (parallel) starting", logf)
        log(f"Remote : {args.remote}", logf)
        log(f"Local  : {args.local}", logf)
        log(f"Workers: {args.workers}", logf)
        log("=" * 60, logf)

        # Phase 1 — collect work
        log("Phase 1: Walking remote tree...", logf)
        t0 = time.time()
        work_list = []
        collect_work(args.remote, args.local, work_list, logf)
        log(f"Phase 1 done: {len(work_list)} files found in {time.time()-t0:.0f}s", logf)

        if not work_list:
            log("Nothing to download.", logf)
            return

        # Phase 2 — parallel downloads
        log(f"Phase 2: Downloading {len(work_list)} files with {args.workers} workers...", logf)
        stats = {"downloaded": 0, "skipped": 0, "errors": 0, "bytes": 0}
        t1 = time.time()

        task_args = [
            (remote, local, size, logf, stats)
            for remote, local, size in work_list
        ]

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(download_one, a): a[0] for a in task_args}
            for fut in as_completed(futures):
                try:
                    fut.result()
                except Exception as e:
                    log(f"  UNHANDLED: {futures[fut]}: {e}", logf)

        elapsed = time.time() - t1
        mb = stats["bytes"] / 1024 / 1024
        rate = stats["downloaded"] / max(elapsed, 1)
        log("=" * 60, logf)
        log(
            f"COMPLETE: {stats['downloaded']} downloaded ({mb:.1f} MB) | "
            f"{stats['skipped']} skipped | {stats['errors']} errors | "
            f"{elapsed:.0f}s | {rate:.1f} files/s",
            logf,
        )


if __name__ == "__main__":
    main()
