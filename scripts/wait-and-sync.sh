#!/bin/bash
# Waits for fmgr-download.py to finish, then runs sync-images.py + audit-images.py
# Usage: bash wait-and-sync.sh

LOG="$HOME/Downloads/thoughtfulindia-fmgr-console.log"
SCRIPTS_DIR="/Users/puneetsharma/CoWorkClaude/thoughtfulindia/scripts"
SYNC_LOG="$HOME/Downloads/thoughtfulindia-sync.log"

echo "=== wait-and-sync.sh started at $(date) ===" | tee -a "$SYNC_LOG"
echo "Waiting for download to complete (polling log every 30s)..." | tee -a "$SYNC_LOG"

while true; do
    # Check for the exact COMPLETE: summary line from fmgr-download.py
    # It looks like: [HH:MM:SS] COMPLETE: NNNN downloaded ...
    COMPLETE_LINE=$(grep -E '^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\] COMPLETE:' "$LOG" 2>/dev/null | tail -1)
    if [ -n "$COMPLETE_LINE" ]; then
        echo "Download complete!" | tee -a "$SYNC_LOG"
        echo "  $COMPLETE_LINE" | tee -a "$SYNC_LOG"
        break
    fi

    # Show latest progress line
    LAST=$(grep -E '^\[[0-9]{2}:[0-9]{2}:[0-9]{2}\].*files' "$LOG" 2>/dev/null | tail -1)
    echo "  $(date +%H:%M:%S) still downloading — $LAST" | tee -a "$SYNC_LOG"
    sleep 30
done

echo "" | tee -a "$SYNC_LOG"
echo "=== Running sync-images.py at $(date) ===" | tee -a "$SYNC_LOG"
python3 "$SCRIPTS_DIR/sync-images.py" 2>&1 | tee -a "$SYNC_LOG"

echo "" | tee -a "$SYNC_LOG"
echo "=== Running audit-images.py at $(date) ===" | tee -a "$SYNC_LOG"
python3 "$SCRIPTS_DIR/audit-images.py" 2>&1 | tee -a "$SYNC_LOG"

echo "" | tee -a "$SYNC_LOG"
echo "=== All done at $(date) ===" | tee -a "$SYNC_LOG"
