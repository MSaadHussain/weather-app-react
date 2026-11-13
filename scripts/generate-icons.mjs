/**
 * Generates the PWA PNG icons with no image dependencies: shapes are defined
 * as signed-distance functions, rasterised with 4x4 supersampling and encoded
 * with Node's built-in zlib. Run with `npm run icons`.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

// ---- PNG encoding -------------------------------------------------------------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePNG(size, rgba) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- Shapes (unit square, y down) --------------------------------------------
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const NAVY = hex('#172554');
const BLUE = hex('#2563eb');
const SUN = hex('#fbbf24');
const CLOUD = hex('#f8fafc');

const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const inRoundRect = (x, y, r) => {
  const dx = Math.max(r - x, 0, x - (1 - r));
  const dy = Math.max(r - y, 0, y - (1 - r));
  return dx * dx + dy * dy <= r * r;
};
const inCloud = (x, y) =>
  inCircle(x, y, 0.37, 0.6, 0.13) ||
  inCircle(x, y, 0.52, 0.52, 0.17) ||
  inCircle(x, y, 0.67, 0.61, 0.12) ||
  (x >= 0.37 && x <= 0.67 && y >= 0.6 && y <= 0.73) ||
  inCircle(x, y, 0.37, 0.66, 0.07) ||
  inCircle(x, y, 0.67, 0.66, 0.07);

/** Returns [r,g,b,a] for content coordinates. */
function sample(x, y, { rounded, transparentBg }) {
  if (transparentBg) {
    // Monochrome badge: white cloud on transparent.
    return inCloud(x, y + 0.02) ? [255, 255, 255, 255] : [0, 0, 0, 0];
  }
  if (rounded && !inRoundRect(x, y, 0.22)) return [0, 0, 0, 0];
  if (inCloud(x, y)) return [...CLOUD, 255];
  if (inCircle(x, y, 0.64, 0.37, 0.16)) return [...SUN, 255];
  return [...mix(NAVY, BLUE, (x + y) / 2), 255];
}

function render(size, { rounded = true, safeZone = 1, transparentBg = false } = {}) {
  const ss = 4;
  const out = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          let x = (px + (sx + 0.5) / ss) / size;
          let y = (py + (sy + 0.5) / ss) / size;
          // Shrink artwork into the maskable safe zone while background stays full-bleed.
          const cx = (x - 0.5) / safeZone + 0.5;
          const cy = (y - 0.5) / safeZone + 0.5;
          const bg = sample(x, y, { rounded, transparentBg });
          const fg = sample(cx, cy, { rounded: false, transparentBg });
          const isArt = transparentBg ? fg : inCloud(cx, cy) || inCircle(cx, cy, 0.64, 0.37, 0.16) ? fg : bg;
          const c = safeZone === 1 ? bg : isArt;
          for (let i = 0; i < 4; i++) acc[i] += c[i] * (i < 3 ? c[3] / 255 : 1);
        }
      }
      const n = ss * ss;
      const a = acc[3] / n;
      const o = (py * size + px) * 4;
      out[o] = a ? acc[0] / n / (a / 255) : 0;
      out[o + 1] = a ? acc[1] / n / (a / 255) : 0;
      out[o + 2] = a ? acc[2] / n / (a / 255) : 0;
      out[o + 3] = a;
    }
  }
  return encodePNG(size, out);
}

const files = {
  'icon-192.png': render(192),
  'icon-512.png': render(512),
  'maskable-192.png': render(192, { rounded: false, safeZone: 0.78 }),
  'maskable-512.png': render(512, { rounded: false, safeZone: 0.78 }),
  'apple-touch-icon.png': render(180, { rounded: false }),
  'badge-96.png': render(96, { transparentBg: true }),
};
for (const [name, buf] of Object.entries(files)) {
  writeFileSync(new URL(name, OUT), buf);
  console.log(`wrote public/icons/${name} (${buf.length} bytes)`);
}
