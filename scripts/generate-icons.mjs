/**
 * Génère les icônes PNG de la PWA sans dépendance externe.
 *
 * Le dessin reprend la marque PATRIMONIA : carré arrondi en dégradé jade vers
 * indigo nuit, traversé par la ligne de progression et son point terminal.
 * Exécution : `node scripts/generate-icons.mjs`
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '..', 'public', 'icons');

const ACCENT = [43, 191, 149];
const BRAND = [37, 47, 108];

/** Distance d'un point à un segment, pour tracer des lignes épaisses. */
function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function roundedRectAlpha(x, y, size, radius) {
  const inner = size - radius;
  const cx = Math.min(Math.max(x, radius), inner);
  const cy = Math.min(Math.max(y, radius), inner);
  const distance = Math.hypot(x - cx, y - cy);
  return Math.max(0, Math.min(1, radius - distance + 0.5));
}

function renderIcon(size, { padding = 0 } = {}) {
  const pixels = Buffer.alloc(size * size * 4);
  const boxSize = size - padding * 2;
  const radius = boxSize * 0.24;
  const stroke = boxSize * 0.075;

  // Polyline de la marque, en coordonnées relatives à la boîte.
  const points = [
    [0.26, 0.7],
    [0.42, 0.4],
    [0.56, 0.58],
    [0.74, 0.3],
  ].map(([px, py]) => [padding + px * boxSize, padding + py * boxSize]);
  const dot = [padding + 0.74 * boxSize, padding + 0.3 * boxSize];
  const dotRadius = boxSize * 0.075;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const localX = x - padding;
      const localY = y - padding;
      const alpha = roundedRectAlpha(localX, localY, boxSize, radius);

      if (alpha <= 0) {
        pixels[index + 3] = 0;
        continue;
      }

      const ratio = Math.max(0, Math.min(1, (localX + localY) / (boxSize * 2)));
      let r = ACCENT[0] + (BRAND[0] - ACCENT[0]) * ratio;
      let g = ACCENT[1] + (BRAND[1] - ACCENT[1]) * ratio;
      let b = ACCENT[2] + (BRAND[2] - ACCENT[2]) * ratio;

      let markAlpha = 0;
      for (let i = 0; i < points.length - 1; i += 1) {
        const a = points[i];
        const c = points[i + 1];
        const distance = distanceToSegment(x, y, a[0], a[1], c[0], c[1]);
        markAlpha = Math.max(markAlpha, Math.max(0, Math.min(1, stroke / 2 - distance + 0.6)));
      }
      const dotDistance = Math.hypot(x - dot[0], y - dot[1]);
      markAlpha = Math.max(markAlpha, Math.max(0, Math.min(1, dotRadius - dotDistance + 0.6)));

      r = r + (255 - r) * markAlpha;
      g = g + (255 - g) * markAlpha;
      b = b + (255 - b) * markAlpha;

      pixels[index] = Math.round(r);
      pixels[index + 1] = Math.round(g);
      pixels[index + 2] = Math.round(b);
      pixels[index + 3] = Math.round(alpha * 255);
    }
  }

  return pixels;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(pixels, size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // profondeur de bit
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0; // filtre « none »
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, padding: 0 },
  { name: 'icon-512.png', size: 512, padding: 0 },
  { name: 'icon-maskable-512.png', size: 512, padding: 64 },
  { name: 'apple-touch-icon.png', size: 180, padding: 0 },
];

for (const target of targets) {
  const png = encodePng(renderIcon(target.size, { padding: target.padding }), target.size);
  writeFileSync(resolve(OUT_DIR, target.name), png);
  console.log(`écrit ${target.name} (${png.length} octets)`);
}
