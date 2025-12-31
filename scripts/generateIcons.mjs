import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const outputDir = join(projectRoot, 'public/icons');

function bubbleSvg(size) {
  // Derived from `public/icons/icon.svg` so the proportions match exactly.
  const s = size / 128;

  // Original gradient vectors:
  // x1=10 y1=110 x2=118 y2=10 (in 128px space)
  const gx1 = 10 * s;
  const gy1 = 110 * s;
  const gx2 = 118 * s;
  const gy2 = 10 * s;

  const rectX = 8 * s;
  const rectY = 8 * s;
  const rectW = 112 * s;
  const rectH = 80 * s;
  const rectRx = 16 * s;

  // Tail points: (24,88) (24,112) (52,88)
  const tx1 = 24 * s;
  const ty1 = 88 * s;
  const tx2 = 24 * s;
  const ty2 = 112 * s;
  const tx3 = 52 * s;
  const ty3 = 88 * s;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bubbleGrad" x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5f6be1"/>
      <stop offset="100%" stop-color="#7e74ea"/>
    </linearGradient>
  </defs>
  <rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" rx="${rectRx}" fill="url(#bubbleGrad)"/>
  <path d="M${tx1} ${ty1} L${tx2} ${ty2} L${tx3} ${ty3}" fill="url(#bubbleGrad)"/>
</svg>`;
}

function linesSvg(size) {
  // Derived from `public/icons/icon.svg` so the icon matches the original.
  // IMPORTANT: We render this layer at exact output size (no downsample).
  // For 16/48 we choose odd integer stroke widths + half-integer Y coords,
  // which makes the *horizontal* stroke edges land on pixel boundaries.
  const s = size / 128;
  const strokeWidthBySize = {
    16: 1,
    48: 3,
    128: 9,
  };
  const sw = strokeWidthBySize[size] ?? Math.max(1, Math.round(9 * s));

  const line1y = 36 * s;
  const line2y = 60 * s;

  // Original segments:
  // (22->48), (58->104) at y=36
  // (22->62), (72->92) at y=60
  const x22 = 22 * s;
  const x48 = 48 * s;
  const x58 = 58 * s;
  const x104 = 104 * s;
  const x62 = 62 * s;
  const x72 = 72 * s;
  const x92 = 92 * s;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="${x22}" y1="${line1y}" x2="${x48}" y2="${line1y}" stroke="#5eedbd" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${x58}" y1="${line1y}" x2="${x104}" y2="${line1y}" stroke="#5dd4ff" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${x22}" y1="${line2y}" x2="${x62}" y2="${line2y}" stroke="#ff6b91" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${x72}" y1="${line2y}" x2="${x92}" y2="${line2y}" stroke="white" stroke-width="${sw}" stroke-linecap="round" opacity="0.5"/>
</svg>`;
}

// Chrome extension icon sizes
const sizes = [16, 48, 128];

async function generateIcons() {
  mkdirSync(outputDir, { recursive: true });

  for (const size of sizes) {
    const outputPath = join(outputDir, `icon${size}.png`);

    // 1) Bubble layer: supersample for smooth corners, then downsample.
    const bubbleScale = 8;
    const bubbleRenderSize = size * bubbleScale;
    const bubblePng = new Resvg(bubbleSvg(size), {
      fitTo: { mode: 'width', value: bubbleRenderSize },
      font: { loadSystemFonts: false },
    })
      .render()
      .asPng();

    const bubbleFinal = await sharp(bubblePng)
      .resize(size, size, {
        fit: 'contain',
        kernel: 'lanczos3',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    // 2) Lines layer: render at exact size with crispEdges so horizontal edges are hard.
    const linesFinal = new Resvg(linesSvg(size), {
      fitTo: { mode: 'width', value: size },
      font: { loadSystemFonts: false },
    })
      .render()
      .asPng();

    // 3) Composite: smooth bubble + crisp lines.
    const finalBuffer = await sharp(bubbleFinal)
      .composite([{ input: linesFinal }])
      .png({ compressionLevel: 9 })
      .toBuffer();

    writeFileSync(outputPath, finalBuffer);
    console.log(`✓ Generated ${outputPath} (${size}x${size})`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
