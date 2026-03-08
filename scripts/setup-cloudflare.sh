#!/bin/bash
# =============================================================================
# setup-cloudflare.sh — One-time Cloudflare Pages + R2 setup for thoughtfulindia
# =============================================================================
#
# Run this AFTER:
#   1. Images are fully synced to public/images/ (wait-and-sync.sh done)
#   2. You have a Cloudflare account with Pages + R2 enabled
#
# What this script does:
#   1. Checks wrangler CLI is installed
#   2. Prompts for R2 public URL (from CF dashboard) and patches _redirects
#   3. Configures rclone for R2 (if not already configured)
#   4. Uploads all images to R2
#   5. Runs `npm run build` to generate out/
#   6. Deploys to Cloudflare Pages via wrangler
#
# Usage:
#   bash scripts/setup-cloudflare.sh
# =============================================================================

set -e
REPO="/Users/puneetsharma/CoWorkClaude/thoughtfulindia"
IMAGES_DIR="$REPO/public/images"
REDIRECTS="$REPO/public/_redirects"
LOG="$HOME/Downloads/thoughtfulindia-cf-setup.log"

log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$LOG"; }

log "=== Cloudflare Pages + R2 Setup ==="
log "Repo: $REPO"
log ""

# ── 1. Check wrangler ──────────────────────────────────────────────────────
if ! command -v wrangler &>/dev/null; then
    log "Installing wrangler..."
    npm install -g wrangler 2>&1 | tee -a "$LOG"
fi
log "wrangler: $(wrangler --version 2>&1 | head -1)"

# ── 2. Check rclone ────────────────────────────────────────────────────────
if ! command -v rclone &>/dev/null; then
    log "Installing rclone..."
    brew install rclone 2>&1 | tee -a "$LOG"
fi
log "rclone: $(rclone --version 2>&1 | head -1)"

# ── 3. Patch _redirects with real R2 URL ──────────────────────────────────
log ""
log "=== Step 1: R2 Bucket URL ==="
log "In Cloudflare dashboard:"
log "  Workers & Pages → R2 → Create bucket: thoughtfulindia-images"
log "  After creating: click bucket → Settings → Public Access → Enable"
log "  Copy the public URL (looks like: https://pub-XXXX.r2.dev)"
log ""
echo -n "Paste your R2 public URL (e.g. https://pub-abc123.r2.dev): "
read R2_URL

# Strip trailing slash
R2_URL="${R2_URL%/}"

if [[ -z "$R2_URL" ]]; then
    log "ERROR: R2 URL is required. Exiting."
    exit 1
fi

log "Patching _redirects with: $R2_URL"
sed -i '' "s|R2_PUBLIC_BASE_URL|$R2_URL|g" "$REDIRECTS"
log "Done. Contents of _redirects:"
cat "$REDIRECTS" | tee -a "$LOG"

# ── 4. Configure rclone for R2 ────────────────────────────────────────────
log ""
log "=== Step 2: rclone R2 Configuration ==="
if rclone listremotes | grep -q "^r2:"; then
    log "rclone 'r2' remote already configured. Skipping."
else
    log "You need R2 API credentials:"
    log "  CF Dashboard → R2 → Manage R2 API Tokens → Create Token (Admin Read & Write)"
    log "  Also note your Account ID from CF dashboard (right sidebar)"
    log ""
    echo -n "R2 Access Key ID: "
    read R2_KEY_ID
    echo -n "R2 Secret Access Key: "
    read R2_SECRET
    echo -n "CF Account ID: "
    read CF_ACCOUNT_ID

    RCLONE_CONF="$HOME/.config/rclone/rclone.conf"
    mkdir -p "$(dirname $RCLONE_CONF)"
    cat >> "$RCLONE_CONF" << EOF

[r2]
type = s3
provider = Cloudflare
access_key_id = $R2_KEY_ID
secret_access_key = $R2_SECRET
endpoint = https://$CF_ACCOUNT_ID.r2.cloudflarestorage.com
acl = private
EOF
    log "rclone config written to $RCLONE_CONF"
fi

# ── 5. Upload images to R2 ────────────────────────────────────────────────
log ""
log "=== Step 3: Upload images to R2 ==="
IMAGE_COUNT=$(find "$IMAGES_DIR" -type f | wc -l | tr -d ' ')
log "Images to upload: $IMAGE_COUNT"
log "Running rclone sync..."

rclone sync "$IMAGES_DIR" "r2:thoughtfulindia-images/images" \
    --transfers=32 \
    --checkers=16 \
    --s3-upload-concurrency=8 \
    --stats=15s \
    --stats-one-line \
    --exclude="*.DS_Store" \
    --log-level=INFO \
    --log-file="$HOME/Downloads/thoughtfulindia-r2-upload.log" \
    2>&1 | tee -a "$LOG"

log "R2 upload complete. Full log: ~/Downloads/thoughtfulindia-r2-upload.log"

# ── 6. Build Next.js ──────────────────────────────────────────────────────
log ""
log "=== Step 4: npm run build ==="
cd "$REPO"
npm run build:cf 2>&1 | tee -a "$LOG"
log "Build complete. Output in: $REPO/out/"
log "File count in out/: $(find out/ -type f | wc -l | tr -d ' ') (images excluded — served from R2)"

# ── 7. Deploy to Cloudflare Pages ─────────────────────────────────────────
log ""
log "=== Step 5: Deploy to Cloudflare Pages ==="
log "First-time deploy creates the Pages project. Subsequent runs update it."
wrangler pages deploy out/ \
    --project-name=thoughtfulindia \
    --commit-dirty=true \
    2>&1 | tee -a "$LOG"

log ""
log "=== DONE ==="
log "Your site is live on Cloudflare Pages!"
log "Next: In CF dashboard, add custom domain thoughtfulindia.com to the Pages project"
log "      and update DNS to point to Cloudflare Pages."
