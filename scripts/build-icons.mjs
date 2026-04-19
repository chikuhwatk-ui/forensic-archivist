// Rasterises build/icon.svg to the multi-resolution PNGs + ICO that
// electron-builder, Windows Explorer, and the HTML favicon all need.
//
// Run: npm run build:icons

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import pngToIco from 'png-to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BUILD = resolve(ROOT, 'build');

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
const MASTER_SIZE = 1024;

async function main() {
  await mkdir(BUILD, { recursive: true });
  const svg = await readFile(resolve(BUILD, 'icon.svg'));

  // High-resolution master PNG (used for macOS/Linux builds & README)
  await sharp(svg, { density: 384 })
    .resize(MASTER_SIZE, MASTER_SIZE)
    .png({ compressionLevel: 9 })
    .toFile(resolve(BUILD, 'icon.png'));
  console.log(`  ✓ icon.png (${MASTER_SIZE}x${MASTER_SIZE})`);

  // Rasterise every size .ico needs to a PNG buffer
  const pngBuffers = await Promise.all(
    ICO_SIZES.map(async (size) => {
      const buffer = await sharp(svg, { density: 384 })
        .resize(size, size)
        .png()
        .toBuffer();
      console.log(`  ✓ icon-${size}.png buffer`);
      return buffer;
    })
  );

  // Assemble the Windows .ico
  const ico = await pngToIco(pngBuffers);
  await writeFile(resolve(BUILD, 'icon.ico'), ico);
  console.log(`  ✓ icon.ico (${ICO_SIZES.join(', ')})`);

  // Favicon — 32x32 PNG dropped at public/ for Vite
  const publicDir = resolve(ROOT, 'public');
  await mkdir(publicDir, { recursive: true });
  await sharp(svg, { density: 384 }).resize(32, 32).png().toFile(resolve(publicDir, 'favicon.png'));
  console.log('  ✓ public/favicon.png (32x32)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
