# TrendX Overlay Server

Automated news image overlay server for TrendX Pakistan.

## What it does
- Takes a background image URL + headline text
- Resizes image to 1080×1350 (portrait)
- Adds black panel at bottom with NEWS label + headline
- Returns final branded PNG ready for Facebook

## Deploy on Render.com (FREE)

1. GitHub pe new repo banao: `trendx-overlay`
2. Yeh 3 files upload karo:
   - `server.js`
   - `package.json`
   - `render.yaml`
3. render.com → New Web Service → GitHub se connect karo
4. Free plan select karo
5. Deploy!

Tumhara URL milega: `https://trendx-overlay.onrender.com`

## API Usage

```
POST https://trendx-overlay.onrender.com/overlay
Content-Type: application/json

{
  "bg_image_url": "https://image-url-here.jpg",
  "headline": "Pakistan ne naya record tor diya"
}
```

Returns: PNG image (binary)

## n8n mein use karna

HTTP Request node:
- Method: POST
- URL: https://trendx-overlay.onrender.com/overlay
- Body: JSON with bg_image_url and headline
- Response Format: File / Binary

## Important Note (Free Tier)
Render free tier pe server 15 min inactivity ke baad "sleep" ho jata hai.
Pehli request pe 30-60 sec lag sakti hai (cold start).
Daily use mein yeh issue nahi hoga kyunki server active rahega.
