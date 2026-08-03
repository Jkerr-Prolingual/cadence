import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const source = join(publicDir, 'images', 'relato_icon.png');

await sharp(source)
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'));
console.log('Created apple-touch-icon.png (180x180)');

await sharp(source)
  .resize(32, 32)
  .png()
  .toFile(join(publicDir, 'favicon-32.png'));
console.log('Created favicon-32.png (32x32)');

await sharp(source)
  .resize(192, 192)
  .png()
  .toFile(join(publicDir, 'icon-192.png'));
console.log('Created icon-192.png (192x192)');

await sharp(source)
  .resize(512, 512)
  .png()
  .toFile(join(publicDir, 'icon-512.png'));
console.log('Created icon-512.png (512x512)');

const ogWidth = 1200;
const ogHeight = 630;
const iconSize = 200;
const iconX = Math.round((ogWidth - iconSize) / 2);
const iconY = 340;

const iconResized = await sharp(source).resize(iconSize, iconSize).png().toBuffer();

const bgSvg = `<svg width="${ogWidth}" height="${ogHeight}">
  <rect width="${ogWidth}" height="${ogHeight}" fill="#f8f5fc"/>
  <text x="${ogWidth / 2}" y="220" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="700" fill="#1a1a2e" letter-spacing="-1">Relato</text>
  <text x="${ogWidth / 2}" y="275" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#6b7280">Read, listen, and learn English</text>
  <line x1="${ogWidth / 2 - 60}" y1="310" x2="${ogWidth / 2 + 60}" y2="310" stroke="#c4b2e2" stroke-width="3" stroke-linecap="round"/>
</svg>`;

await sharp(Buffer.from(bgSvg))
  .resize(ogWidth, ogHeight)
  .composite([{ input: iconResized, left: iconX, top: iconY }])
  .png()
  .toFile(join(publicDir, 'og-image.png'));
console.log('Created og-image.png (1200x630)');

console.log('\nAll icons generated from source: public/images/relato_icon.png');
