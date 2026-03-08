#!/bin/bash
# Upload all images to Cloudflare R2 using rclone (fast, parallel)
#
# One-time setup:
#   1. brew install rclone
#   2. Get R2 credentials from CF dashboard:
#      Workers & Pages → R2 → Manage R2 API Tokens → Create token (Admin Read & Write)
#   3. Add to ~/.config/rclone/rclone.conf:
#
#      [r2]
#      type = s3
#      provider = Cloudflare
#      access_key_id = <R2_ACCESS_KEY_ID>
#      secret_access_key = <R2_SECRET_ACCESS_KEY>
#      endpoint = https://<CF_ACCOUNT_ID>.r2.cloudflarestorage.com
#      acl = private
#
#   4. Create bucket in CF dashboard: thoughtfulindia-images
#   5. Enable R2 public access for the bucket (or set custom domain)
#
# Usage: bash upload-to-r2.sh [--dry-run]

BUCKET="thoughtfulindia-images"
LOCAL_IMAGES="/Users/puneetsharma/CoWorkClaude/thoughtfulindia/public/images"
R2_REMOTE="r2:$BUCKET/images"

DRY_RUN=""
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN="--dry-run"
    echo "=== DRY RUN MODE ==="
fi

echo "=== Uploading images to R2 ==="
echo "Source : $LOCAL_IMAGES"
echo "Target : $R2_REMOTE"
echo ""

# rclone sync: fast parallel upload, skips existing files with matching size+mtime
rclone sync "$LOCAL_IMAGES" "$R2_REMOTE" \
    $DRY_RUN \
    --transfers=32 \
    --checkers=16 \
    --s3-upload-concurrency=8 \
    --stats=10s \
    --stats-one-line \
    --progress \
    --exclude="*.DS_Store" \
    --log-level=INFO \
    --log-file="$HOME/Downloads/thoughtfulindia-r2-upload.log"

echo ""
echo "Upload complete. Log: ~/Downloads/thoughtfulindia-r2-upload.log"
echo ""
echo "Next steps:"
echo "  1. In CF dashboard: R2 → thoughtfulindia-images → Settings → Public Access"
echo "     Note the public URL: https://pub-XXXX.r2.dev"
echo "  2. OR set custom domain: images.thoughtfulindia.com → bucket"
echo "  3. Update R2_PUBLIC_URL in next.config.ts with your bucket URL"
