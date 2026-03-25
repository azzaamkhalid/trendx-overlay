const express = require('express');
const sharp = require('sharp');
const axios = require('axios');

const app = express();
app.use(express.json());

// ── Canvas dimensions (portrait, optimal for Facebook/Instagram)
const W = 1080;
const H = 1350;
const PANEL_H = 420;       // black panel height (bottom 31%)
const PANEL_Y = H - PANEL_H; // where panel starts (930px)
const PADDING = 64;         // left padding for all text

// ── Wrap headline into lines based on char limit
function wrapText(text, maxChars = 20) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length <= maxChars) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ── Escape special XML chars for SVG safety
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Build SVG overlay
function buildSVG(headline) {
  const lines = wrapText(escapeXml(headline), 20);
  const FONT_SIZE = 68;
  const LINE_H = 80;
  const TEXT_START_Y = 90; // relative to panel top

  const headlineLines = lines
    .map((ln, i) =>
      `<text
        x="${PADDING}"
        y="${TEXT_START_Y + i * LINE_H}"
        font-family="Georgia, 'Times New Roman', serif"
        font-weight="bold"
        font-size="${FONT_SIZE}"
        fill="#FFFFFF"
      >${ln}</text>`
    )
    .join('\n');

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">

  <!-- TrendX branding — top right (replaces logo) -->
  <text
    x="${W - 32}"
    y="52"
    font-family="Georgia, 'Times New Roman', serif"
    font-weight="bold"
    font-size="30"
    fill="#FFFFFF"
    text-anchor="end"
    opacity="0.92"
    letter-spacing="1"
  >TrendX</text>

  <!-- Black panel -->
  <rect x="0" y="${PANEL_Y}" width="${W}" height="${PANEL_H}" fill="#000000"/>

  <!-- Yellow "NEWS" label -->
  <text
    x="${PADDING}"
    y="${PANEL_Y + 52}"
    font-family="Georgia, 'Times New Roman', serif"
    font-weight="bold"
    font-size="26"
    fill="#F5C300"
    letter-spacing="5"
  >NEWS</text>

  <!-- Headline text (inside panel) -->
  <g transform="translate(0, ${PANEL_Y})">
    ${headlineLines}
  </g>

</svg>`;
}

// ── Health check
app.get('/', (req, res) => res.json({ status: 'TrendX Overlay Server running ✅' }));

// ── Main overlay endpoint
app.post('/overlay', async (req, res) => {
  try {
    const { bg_image_url, headline } = req.body;

    if (!bg_image_url || !headline) {
      return res.status(400).json({ error: 'bg_image_url and headline are required' });
    }

    // 1. Download background image
    const imgResponse = await axios.get(bg_image_url, {
      responseType: 'arraybuffer',
      timeout: 20000,
    });
    const rawBuffer = Buffer.from(imgResponse.data);

    // 2. Resize/crop image to fill top portion only
    const photoBuffer = await sharp(rawBuffer)
      .resize(W, PANEL_Y, {
        fit: 'cover',
        position: 'centre',
      })
      .toBuffer();

    // 3. Build SVG overlay
    const svgBuffer = Buffer.from(buildSVG(headline));

    // 4. Composite: black canvas → photo (top) → SVG overlay
    const finalBuffer = await sharp({
      create: {
        width: W,
        height: H,
        channels: 3,
        background: '#000000',
      },
    })
      .composite([
        { input: photoBuffer, top: 0, left: 0 },
        { input: svgBuffer,   top: 0, left: 0 },
      ])
      .png({ compressionLevel: 8 })
      .toBuffer();

    // 5. Return final image
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', 'inline; filename="trendx_post.png"');
    res.send(finalBuffer);

  } catch (err) {
    console.error('[Overlay Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ TrendX Overlay Server running on port ${PORT}`)
);
