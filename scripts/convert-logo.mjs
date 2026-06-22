import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const inputPath  = join(__dirname, '../public/chef-logo.png');
const outputPath = join(__dirname, '../public/chef-logo-gold.png');

// Gold: #C9A84C = rgb(201, 168, 76)
const GOLD_R = 201, GOLD_G = 168, GOLD_B = 76;
const WHITE_THRESHOLD = 220; // pixel brightness above this → transparent

const { data, info } = await sharp(inputPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const pixels = new Uint8Array(data);

for (let i = 0; i < pixels.length; i += channels) {
  const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

  if (brightness > WHITE_THRESHOLD) {
    pixels[i + 3] = 0; // transparent
  } else {
    const opacity = Math.min(255, Math.round((1 - brightness / 255) * 255 * 1.4));
    pixels[i]     = GOLD_R;
    pixels[i + 1] = GOLD_G;
    pixels[i + 2] = GOLD_B;
    pixels[i + 3] = opacity;
  }
}

await sharp(Buffer.from(pixels), { raw: { width, height, channels } })
  .png()
  .toFile(outputPath);

console.log('chef-logo-gold.png erstellt:', outputPath);
