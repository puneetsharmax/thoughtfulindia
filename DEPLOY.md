# Thoughtful India — Cloudflare Deployment Guide

## What's Been Built
- **1,959 articles** migrated from WordPress to Next.js static site
- **90.5% image coverage** (1,631/1,803 posts with images have images locally)
- **30 category pages**, sitemap.xml, robots.txt, 404 page
- Static HTML exported to `out/` — ready to deploy

---

## Prerequisites (one-time setup)

You need:
1. A **Cloudflare account** with R2 enabled (free tier is fine for this)
2. **wrangler** CLI — install with: `npm install -g wrangler`
3. **rclone** — install with: `brew install rclone`

---

## Deployment Steps

### Step 1 — Create R2 bucket for images

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**
2. Click **Create bucket** → Name it: `thoughtfulindia-images`
3. After creating, click the bucket → **Settings** tab → **Public Access** → Enable
4. Copy the **Public URL** (looks like `https://pub-abc123xyz.r2.dev`)

### Step 2 — Get R2 API credentials

1. In Cloudflare Dashboard → R2 → **Manage R2 API Tokens**
2. Click **Create API Token** → Select **Admin Read & Write**
3. Copy: **Access Key ID** and **Secret Access Key**
4. Also copy your **Account ID** from the right sidebar of the dashboard

### Step 3 — Run the deployment script

Open Terminal, `cd` to the project folder, then:

```bash
bash scripts/setup-cloudflare.sh
```

The script will ask for:
- R2 public URL (from Step 1)
- R2 Access Key ID (from Step 2)
- R2 Secret Access Key (from Step 2)
- Cloudflare Account ID (from Step 2)

Then it will automatically:
1. Upload ~22,700 images to R2 (~5–15 min depending on internet speed)
2. Build the Next.js site (strips images from `out/`, ~12 min)
3. Deploy to Cloudflare Pages

### Step 4 — Add custom domain (thoughtfulindia.com)

After deployment:
1. In Cloudflare Dashboard → **Workers & Pages** → `thoughtfulindia` project
2. Click **Custom domains** → Add `thoughtfulindia.com` and `www.thoughtfulindia.com`
3. Update DNS at your registrar to point to Cloudflare Pages (CF will show you the values)

---

## Re-deploying after content changes

Any time posts are added or edited, just run:

```bash
cd /path/to/thoughtfulindia
npm run build:cf
wrangler pages deploy out/ --project-name=thoughtfulindia --commit-dirty=true
```

Images only need to be re-uploaded if new images are added to `public/images/`.

---

## What's in the `out/` folder

```
out/
├── index.html              ← Home page
├── sitemap.xml             ← 1,991 URLs for Google
├── robots.txt              ← Allows all crawlers
├── 404.html                ← Custom 404 page
├── _redirects              ← Cloudflare: proxies /images/* to R2
├── post/
│   └── [slug]/index.html  ← 1,959 article pages
├── category/
│   └── [slug]/index.html  ← 30 category pages
└── for-students/
    └── index.html          ← For Students page
```

Images are **not** in `out/` — they're served from R2 via the `_redirects` proxy rule.

---

## Image Coverage

- **90.5% of articles with images have their images** (1,631/1,803)
- **172 articles** have missing images (gracefully hidden — no broken icons)
- Missing images come from 4 year/month directories where DreamHost server was inaccessible:
  - 2012/06, 2013/03, 2014/09 — server API errors
  - 2013/02 — files exist but with different filenames than posts reference

---

## Troubleshooting

**Images not showing?**
- Check R2 bucket has Public Access enabled
- Verify `_redirects` has the correct R2 URL (not the placeholder `R2_PUBLIC_BASE_URL`)
- Check rclone upload completed successfully: `~/Downloads/thoughtfulindia-r2-upload.log`

**Build fails?**
- Make sure Node.js 18+ is installed: `node --version`
- Run `npm install` first if packages are missing

**Wrangler asks to login?**
- Run `wrangler login` first to authenticate with Cloudflare
