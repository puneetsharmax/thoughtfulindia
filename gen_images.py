#!/usr/bin/env python3
"""
ThoughtfulIndia — X Post Image Generator
Creates 8 branded 1200x675 images (Twitter card size) for each article post.
Style: Deep navy/saffron, bold headline, ThoughtfulIndia branding.
"""

from PIL import Image, ImageDraw, ImageFont
import os, textwrap

OUT = "/Users/puneetsharma/CoWorkClaude/thoughtfulindia/images"
os.makedirs(OUT, exist_ok=True)

W, H = 1200, 675

# Brand colors
NAVY     = (15, 25, 50)       # Deep India night sky
SAFFRON  = (255, 153, 51)     # #FF9933 — Indian flag saffron
GOLD     = (255, 200, 80)     # Accent gold
WHITE    = (255, 255, 255)
CREAM    = (255, 248, 230)
TEAL     = (0, 180, 160)      # Accent for variety

POSTS = [
    {
        "file": "01-five-forces.png",
        "tag": "GEOPOLITICS",
        "headline": "Five forces reshaping\nIndia's place in the world",
        "sub": "Oil · China · AI · Soft Power · Rupee",
        "accent": SAFFRON,
    },
    {
        "file": "02-rupee.png",
        "tag": "ECONOMY",
        "headline": "The rupee at 87\nis not a crisis",
        "sub": "Fix exports. The rupee takes care of itself.",
        "accent": GOLD,
    },
    {
        "file": "03-democracy.png",
        "tag": "FOREIGN POLICY",
        "headline": "Criticising India's democracy\nis a foreign policy tool",
        "sub": "Not a human rights framework.",
        "accent": TEAL,
    },
    {
        "file": "04-ai-talent.png",
        "tag": "TECHNOLOGY",
        "headline": "India: 1.5M engineers/yr\nAmerica: not enough AI talent",
        "sub": "The corridor is obvious. Who will build it?",
        "accent": SAFFRON,
    },
    {
        "file": "05-soft-power.png",
        "tag": "SOFT POWER",
        "headline": "Yoga. Turmeric. Oscars.\nNone of it was planned.",
        "sub": "India's soft power is real — and unstrategic.",
        "accent": GOLD,
    },
    {
        "file": "06-china.png",
        "tag": "GEOPOLITICS",
        "headline": "China is not\n10 feet tall",
        "sub": "Population falling. Youth unemployment >20%. Debt unwinding.",
        "accent": TEAL,
    },
    {
        "file": "07-tariffs.png",
        "tag": "TRADE",
        "headline": "Trump's tariff chaos\nis India's opportunity",
        "sub": "China exits. Vietnam fills. India watches.",
        "accent": SAFFRON,
    },
    {
        "file": "08-oil.png",
        "tag": "ENERGY",
        "headline": "Oil at $110.\nIndia imports 85% of its crude.",
        "sub": "Every rupee matters. Every barrel counts.",
        "accent": GOLD,
    },
]

def draw_image(post):
    img = Image.new("RGB", (W, H), NAVY)
    d = ImageDraw.Draw(img)

    # --- Saffron accent bar (left edge) ---
    d.rectangle([0, 0, 8, H], fill=post["accent"])

    # --- Top stripe (thin) ---
    d.rectangle([0, 0, W, 5], fill=post["accent"])

    # --- Bottom stripe ---
    d.rectangle([0, H-5, W, H], fill=post["accent"])

    # --- Decorative circle (top right) ---
    cx, cy, r = W - 100, 100, 180
    d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(25, 40, 80))

    # --- Second subtle circle ---
    d.ellipse([cx-60, cy-60, cx+60, cy+60], fill=(35, 55, 100))

    # Try system fonts
    def get_font(size, bold=False):
        candidates = [
            f"/System/Library/Fonts/Supplemental/{'Arial Bold' if bold else 'Arial'}.ttf",
            f"/System/Library/Fonts/{'Helvetica' if not bold else 'Helvetica'}.ttc",
            "/System/Library/Fonts/Supplemental/Georgia.ttf",
            "/Library/Fonts/Arial.ttf",
        ]
        for c in candidates:
            if os.path.exists(c):
                try:
                    return ImageFont.truetype(c, size)
                except:
                    continue
        return ImageFont.load_default()

    font_tag      = get_font(22, bold=True)
    font_headline = get_font(64, bold=True)
    font_sub      = get_font(28)
    font_brand    = get_font(20, bold=True)

    # --- TAG pill ---
    tag_text = post["tag"]
    tbbox = d.textbbox((0,0), tag_text, font=font_tag)
    tw = tbbox[2] - tbbox[0]
    pill_x, pill_y = 60, 55
    pill_pad = 14
    d.rounded_rectangle(
        [pill_x - pill_pad, pill_y - 8, pill_x + tw + pill_pad, pill_y + 30],
        radius=6, fill=post["accent"]
    )
    d.text((pill_x, pill_y), tag_text, fill=NAVY, font=font_tag)

    # --- Headline ---
    lines = post["headline"].split("\n")
    y = 130
    for line in lines:
        d.text((60, y), line, fill=WHITE, font=font_headline)
        bbox = d.textbbox((0,0), line, font=font_headline)
        y += (bbox[3] - bbox[1]) + 10

    # --- Accent underline ---
    d.rectangle([60, y + 5, 160, y + 9], fill=post["accent"])
    y += 30

    # --- Sub text ---
    wrapped = textwrap.fill(post["sub"], width=55)
    d.text((60, y + 10), wrapped, fill=CREAM, font=font_sub)

    # --- Brand name bottom left ---
    d.text((60, H - 48), "ThoughtfulIndia", fill=post["accent"], font=font_brand)
    d.text((60, H - 26), "thoughtfulindia.com  |  Insight · Analysis · Perspective", fill=(160,160,180), font=get_font(16))

    # --- Ashoka Chakra hint (24 spokes, small, top right) ---
    import math
    ox, oy, or_ = W - 100, 100, 55
    for i in range(24):
        angle = math.radians(i * 15)
        x1 = ox + (or_ - 20) * math.cos(angle)
        y1 = oy + (or_ - 20) * math.sin(angle)
        x2 = ox + or_ * math.cos(angle)
        y2 = oy + or_ * math.sin(angle)
        d.line([x1, y1, x2, y2], fill=post["accent"], width=2)
    d.ellipse([ox-or_, oy-or_, ox+or_, oy+or_], outline=post["accent"], width=2)

    out_path = os.path.join(OUT, post["file"])
    img.save(out_path, "PNG", quality=95)
    print(f"✅  {post['file']}")

for post in POSTS:
    draw_image(post)

print(f"\nAll {len(POSTS)} images saved to {OUT}")
