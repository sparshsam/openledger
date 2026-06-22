/**
 * Generate all PWA/web/mobile/desktop icons from a single 1024×1024 source.
 *
 * Usage:  node scripts/generate-icons.mjs
 *
 * Source: public/icons/icon-source.png  (from quietledger.png)
 * Output: public/icons/
 *         public/favicon.ico
 */

import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "public");
const SRC = join(ROOT, "icons", "icon-source.png");
const OUT = join(ROOT, "icons");

mkdirSync(OUT, { recursive: true });

const sizes = {
  // --- PWA standard ---
  "icon-48x48.png": 48,
  "icon-72x72.png": 72,
  "icon-96x96.png": 96,
  "icon-128x128.png": 128,
  "icon-144x144.png": 144,
  "icon-152x152.png": 152,
  "icon-192x192.png": 192,
  "icon-384x384.png": 384,
  "icon-512x512.png": 512,

  // --- Apple touch icons ---
  "apple-touch-icon.png": 180,
  "apple-touch-icon-152x152.png": 152,
  "apple-touch-icon-167x167.png": 167,   // iPad Pro
  "apple-touch-icon-180x180.png": 180,

  // --- Favicon ---
  "favicon-16x16.png": 16,
  "favicon-32x32.png": 32,
};

console.log(`Reading source: ${SRC}`);
const srcBuffer = readFileSync(SRC);

async function main() {
  for (const [name, size] of Object.entries(sizes)) {
    const dest = join(OUT, name);
    await sharp(srcBuffer).resize(size, size).png().toFile(dest);
    console.log(`  ✓ ${name.padEnd(40)} ${size}×${size}`);
  }

  // Also produce SVG placeholder (for browsers that support SVG favicons)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#10100e"/>
  <text x="16" y="22" font-family="sans-serif" font-size="18" font-weight="bold" fill="#d4d4c8" text-anchor="middle">OL</text>
</svg>`;
  writeFileSync(join(OUT, "icon.svg"), svg);
  console.log("  ✓ icon.svg (fallback SVG)");

  // Favicon .ico — just rename the 32×32 PNG (most browsers accept PNG in .ico)
  writeFileSync(join(ROOT, "favicon.ico"), readFileSync(join(OUT, "favicon-32x32.png")));
  console.log("  ✓ favicon.ico");

  // Also copy icon.svg to root for older manifest fallback
  writeFileSync(join(ROOT, "icon.svg"), svg);
  console.log("  ✓ /icon.svg (root fallback)");

  console.log("\nDone! All icons generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
