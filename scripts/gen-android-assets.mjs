// Generates the source artwork that @capacitor/assets needs to produce every
// Android launcher-icon density + splash. Run via `npm run android:assets`.
// Sources are rasterized from the brand yin-yang mark (public/icon.svg) so the
// native icons stay pixel-identical to the web/PWA icon.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(root, "assets");

// The brand mark only (no background), drawn in its native -40..40 space.
const MARK = `
  <defs>
    <linearGradient id="yang" x1="0" y1="-30" x2="0" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#9a0a2c"/>
      <stop offset="1" stop-color="#e07a5f"/>
    </linearGradient>
  </defs>
  <g transform="scale(1,-1)">
    <circle r="30" fill="url(#yang)"/>
    <path d="M 0,-30 A 30,30 0 0 0 0,30 15,15 0 0 0 0,0 15,15 0 0 1 0,-30 Z" fill="#f4f1e8"/>
    <circle r="4.2" cy="15" fill="#9a0a2c"/>
    <circle r="4.2" cy="-15" fill="#f4f1e8"/>
    <circle r="30" fill="none" stroke="#d4af37" stroke-width="1.1" opacity="0.85"/>
  </g>`;

// Dark canvas gradient, matching the app/theme background.
const BG_GRAD = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#141a2e"/>
    <stop offset="1" stop-color="#0b0e1a"/>
  </linearGradient>`;

const svg = (s) => Buffer.from(s);

// 1) Adaptive-icon FOREGROUND: mark only, transparent, padded into the 108dp
//    safe zone (mark ≈ 56% of canvas so it survives any mask shape).
const foreground = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-54 -54 108 108">${MARK}</svg>`
);

// 2) Adaptive-icon BACKGROUND: full-bleed dark gradient.
const background = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><defs>${BG_GRAD}</defs><rect width="108" height="108" fill="url(#bg)"/></svg>`
);

// 3) Legacy / Play-store ICON: mark on the dark gradient (the full brand icon).
const iconOnly = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -40 80 80"><defs>${BG_GRAD}</defs><rect x="-40" y="-40" width="80" height="80" fill="url(#bg)"/>${MARK}</svg>`
);

// 4) SPLASH: mark centered on the dark canvas (mark ≈ 38% of the short side).
const splash = svg(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200"><defs>${BG_GRAD}</defs><rect x="-100" y="-100" width="200" height="200" fill="url(#bg)"/><g transform="scale(1.27)">${MARK}</g></svg>`
);

await mkdir(out, { recursive: true });

const tasks = [
  ["icon-foreground.png", foreground, 1024, 1024, { r: 0, g: 0, b: 0, alpha: 0 }],
  ["icon-background.png", background, 1024, 1024, null],
  ["icon-only.png", iconOnly, 1024, 1024, null],
  ["splash.png", splash, 2732, 2732, null],
  ["splash-dark.png", splash, 2732, 2732, null],
];

for (const [name, buf, w, h, bg] of tasks) {
  let img = sharp(buf, { density: 384 }).resize(w, h, {
    fit: "contain",
    background: bg || { r: 11, g: 14, b: 26, alpha: 1 },
  });
  if (bg) img = img.png(); // keep alpha for the foreground
  await img.png().toFile(resolve(out, name));
  console.log("wrote assets/" + name);
}
console.log("done");
