/**
 * Generate maskable PWA icons with safe-zone padding (80% of the icon).
 * The source is a 1024×1024 image; we resize it to 80% and place it centered
 * on a canvas, then scale the whole thing to the target size.
 *
 * Usage:  node scripts/generate-maskable.mjs
 */

import sharp from "sharp";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "public");
const SRC = join(ROOT, "icons", "icon-source.png");

const sizes = {
  "icon-192x192-maskable.png": 192,
  "icon-512x512-maskable.png": 512,
};

const srcBuffer = readFileSync(SRC);

async function main() {
  // Get source dimensions
  const meta = await sharp(srcBuffer).metadata();

  // For maskable, we want the icon to fill ~80% of the canvas.
  // We'll resize the source to 80% of target size, then composite it
  // centered on a transparent canvas of the target size, then flatten with bg color.
  for (const [name, targetSize] of Object.entries(sizes)) {
    const innerSize = Math.round(targetSize * 0.8);
    const offset = Math.round((targetSize - innerSize) / 2);

    const resized = await sharp(srcBuffer)
      .resize(innerSize, innerSize)
      .png()
      .toBuffer();

    const masked = await sharp({
      create: {
        width: targetSize,
        height: targetSize,
        channels: 4,
        background: { r: 16, g: 16, b: 14, alpha: 1 },
      },
    })
      .composite([{ input: resized, top: offset, left: offset }])
      .png()
      .toFile(join(ROOT, "icons", name));

    console.log(`  ✓ ${name.padEnd(35)} ${targetSize}×${targetSize} (inner ${innerSize}×${innerSize})`);
  }

  console.log("\nDone! Maskable icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
