#!/usr/bin/env python3
"""
Download Unsplash photos for the 9 March 2026 ThoughtfulIndia articles.
Uses Unsplash source (no API key needed for direct image downloads).
Saves to public/images/2026/03/
"""
import urllib.request, os, time

OUT = "/Users/puneetsharma/CoWorkClaude/thoughtfulindia/public/images/2026/03"
os.makedirs(OUT, exist_ok=True)

# Each entry: (filename, unsplash_photo_id, description)
IMAGES = [
    # 1. Five things reshaping India — world map / India aerial
    ("five-things-reshaping-india.jpg",
     "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=1200&q=80",
     "India from above - geopolitics"),

    # 2. Rupee at 87 — currency / Indian economy
    ("rupee-at-87.jpg",
     "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
     "Currency / economy"),

    # 3. Indian democracy selective outrage — parliament / democracy
    ("indian-democracy-selective-outrage.jpg",
     "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80",
     "Parliament / democracy"),

    # 4. AI talent corridor — technology / engineers
    ("india-ai-talent-corridor.jpg",
     "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1200&q=80",
     "AI / technology"),

    # 5. India soft power — yoga / culture
    ("india-soft-power-moment.jpg",
     "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&q=80",
     "Yoga / soft power"),

    # 6. China reality check — great wall / china
    ("china-reality-check-2026.jpg",
     "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200&q=80",
     "China / geopolitics"),

    # 7. Trump tariffs India opportunity — trade / shipping
    ("trump-tariffs-india-opportunity.jpg",
     "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&q=80",
     "Shipping / trade"),

    # 8. Oil at $110 — oil / energy
    ("oil-at-110-india-exposure.jpg",
     "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
     "Oil / energy"),

    # 9. India education blindspot — students / IIT
    ("india-education-blindspot.jpg",
     "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80",
     "Education / students"),
]

headers = {
    "User-Agent": "Mozilla/5.0 ThoughtfulIndia/1.0"
}

for fname, url, desc in IMAGES:
    out_path = os.path.join(OUT, fname)
    if os.path.exists(out_path):
        print(f"⏭️  {fname} already exists")
        continue
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        with open(out_path, "wb") as f:
            f.write(data)
        size_kb = len(data) // 1024
        print(f"✅  {fname} ({size_kb}KB) — {desc}")
    except Exception as e:
        print(f"❌  {fname}: {e}")
    time.sleep(0.5)

print(f"\nDone. Images in {OUT}")
