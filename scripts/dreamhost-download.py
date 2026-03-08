#!/usr/bin/env python3
"""
Full DreamHost download via paramiko SFTP.
Downloads entire /home/dh_pe22np/thoughtfulindia.com/ to ~/Downloads/thoughtfulindia-backup/
Skips files already downloaded. Retries SSH for up to 4 hours.
"""
import paramiko
import os
import sys
import time
import stat

HOST = "pdx1-shared-a4-04.dreamhost.com"
PORT = 22
USER = "dh_pe22np"
REMOTE_ROOT = "/home/dh_pe22np/thoughtfulindia.com"
LOCAL_ROOT = os.path.expanduser("~/Downloads/thoughtfulindia-backup")
LOG_FILE = os.path.expanduser("~/Downloads/thoughtfulindia-rsync.log")

# DreamHost File Manager proxy — try if direct fails
PROXY_HOSTS = [
    ("pdx1-shared-a4-04.dreamhost.com", 22),
    ("64.90.54.26", 22),
]

def log(msg, logf=None):
    ts = time.strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    if logf:
        logf.write(line + "\n")
        logf.flush()

def download_dir(sftp, remote_dir, local_dir, logf, stats):
    os.makedirs(local_dir, exist_ok=True)
    try:
        entries = sftp.listdir_attr(remote_dir)
    except Exception as e:
        log(f"  ERROR listing {remote_dir}: {e}", logf)
        return

    for entry in entries:
        remote_path = remote_dir.rstrip("/") + "/" + entry.filename
        local_path = os.path.join(local_dir, entry.filename)

        if stat.S_ISDIR(entry.st_mode):
            download_dir(sftp, remote_path, local_path, logf, stats)
        else:
            remote_size = entry.st_size
            if os.path.exists(local_path):
                local_size = os.path.getsize(local_path)
                if local_size == remote_size:
                    stats["skipped"] += 1
                    continue
            try:
                log(f"  GET {remote_path} ({remote_size:,}b)", logf)
                sftp.get(remote_path, local_path)
                stats["downloaded"] += 1
                stats["bytes"] += remote_size
                if stats["downloaded"] % 100 == 0:
                    mb = stats["bytes"] / 1024 / 1024
                    log(f"  *** {stats['downloaded']} files | {mb:.1f} MB | {stats['skipped']} skipped | {stats['errors']} errors ***", logf)
            except Exception as e:
                log(f"  ERROR {remote_path}: {e}", logf)
                stats["errors"] += 1

def connect_with_retry(password, logf, max_attempts=960):
    """Retry SSH connection for up to 4 hours (960 x 15s)"""
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    attempt = 0
    while attempt < max_attempts:
        for host, port in PROXY_HOSTS:
            attempt += 1
            try:
                log(f"  Attempt {attempt}: {host}:{port}", logf)
                client.connect(
                    host, port=port,
                    username=USER, password=password,
                    timeout=15, banner_timeout=30, auth_timeout=30
                )
                log(f"SSH CONNECTED to {host}:{port}!", logf)
                return client
            except Exception as e:
                log(f"  Failed ({host}:{port}): {e}", logf)

        if attempt < max_attempts:
            log(f"  Waiting 15s before retry...", logf)
            time.sleep(15)

    log("FATAL: Could not connect after max attempts.", logf)
    sys.exit(1)

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--password", required=True)
    parser.add_argument("--remote", default=REMOTE_ROOT)
    parser.add_argument("--local", default=LOCAL_ROOT)
    args = parser.parse_args()

    os.makedirs(args.local, exist_ok=True)

    with open(LOG_FILE, "a") as logf:
        log("=" * 60, logf)
        log(f"DreamHost download starting", logf)
        log(f"Remote: {USER}@{HOST}:{args.remote}", logf)
        log(f"Local:  {args.local}", logf)
        log("Connecting (will retry for up to 4 hours)...", logf)

        client = connect_with_retry(args.password, logf)
        sftp = client.open_sftp()
        log("SFTP session open. Starting recursive download...", logf)

        stats = {"downloaded": 0, "skipped": 0, "errors": 0, "bytes": 0}
        start = time.time()

        download_dir(sftp, args.remote, args.local, logf, stats)

        elapsed = time.time() - start
        mb = stats["bytes"] / 1024 / 1024
        log(f"COMPLETE: {stats['downloaded']} downloaded ({mb:.1f} MB) | {stats['skipped']} skipped | {stats['errors']} errors | {elapsed:.0f}s", logf)

        sftp.close()
        client.close()

if __name__ == "__main__":
    main()
