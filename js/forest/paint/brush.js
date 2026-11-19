import * as THREE from 'three';
import { mulberry32 } from '../world/layout.js';

// A painter that is a generator (`...Steps`) yields between its parts, so that the cabin's page can build the forest
// a few milliseconds at a time (js/forest/index.js); its plain twin goes through all of it at once. The parts are
// gone through in the same order either way, so what is painted is the same.
export const drainSteps = (steps) => { for (;;) { const { done, value } = steps.next(); if (done) return value; } };

// Painting helpers. Every forest texture is painted onto a canvas when the page
// loads, stroke by stroke, so the look is drawn rather than photographed and
// the site downloads no images for it.

export const rng = mulberry32;

export function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  return canvas;
}

// Colours are [hue 0..360, saturation 0..100, lightness 0..100].
export const css = ([h, s, l], alpha = 1) => `hsla(${h.toFixed(1)}, ${s.toFixed(1)}%, ${l.toFixed(1)}%, ${alpha})`;
export const shift = ([h, s, l], dh = 0, ds = 0, dl = 0) => [h + dh, Math.max(0, Math.min(100, s + ds)), Math.max(0, Math.min(100, l + dl))];
export const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// A colour nudged at random, the way a loaded brush varies from stroke to stroke.
export const vary = (c, r, amount = 1) => shift(c, (r() - 0.5) * 8 * amount, (r() - 0.5) * 10 * amount, (r() - 0.5) * 9 * amount);

// A stroke is finished synchronously, so every atlas can reuse the two edges of its ribbon.
let leftEdge = new Float64Array(256), rightEdge = new Float64Array(256);

// One brush stroke from (x0, y0) to (x1, y1): a ribbon that swells and tapers,
// with slightly ragged edges. `bend` bows it sideways; `ragged` roughens each
// edge step by step and `lumpy` swells and pinches it slowly along the stroke.
// The edge is crisp: this is opaque paint.
export function stroke(ctx, r, x0, y0, x1, y1, width, colour, { bend = 0, ragged = 0.18, lumpy = 0, taperIn = 0.35, taperOut = 0.8, alpha = 1 } = {}) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const steps = Math.max(4, Math.round(len / 3));
  const coordinates = (steps + 1) * 2;
  if (coordinates > leftEdge.length) {
    leftEdge = new Float64Array(coordinates * 2);
    rightEdge = new Float64Array(coordinates * 2);
  }
  const left = leftEdge, right = rightEdge;
  const knots = Math.max(2, Math.round(len / 70)), lumps = [[], []];
  if (lumpy > 0) for (let k = 0; k <= knots; k += 1) { lumps[0].push((r() - 0.5) * 2 * lumpy); lumps[1].push((r() - 0.5) * 2 * lumpy); }
  const lump = (edge, t) => {
    if (!(lumpy > 0)) return 1;
    const f = t * knots, i = Math.min(knots - 1, Math.floor(f)), u = f - i, s = u * u * (3 - 2 * u);
    return 1 + edge[i] + (edge[i + 1] - edge[i]) * s;
  };
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const bow = bend ? Math.sin(Math.PI * t) * bend * len : 0;
    const cx = x0 + dx * t + nx * bow, cy = y0 + dy * t + ny * bow;
    const swell = Math.min(1, t / Math.max(taperIn, 0.001)) * Math.min(1, (1 - t) / Math.max(taperOut, 0.001));
    const half = 0.5 * width * Math.sqrt(Math.max(swell, 0)), hl = half * lump(lumps[0], t), hr = half * lump(lumps[1], t);
    const j = i * 2;
    left[j] = cx + nx * hl * (1 + (r() - 0.5) * ragged * 2);
    left[j + 1] = cy + ny * hl * (1 + (r() - 0.5) * ragged * 2);
    right[j] = cx - nx * hr * (1 + (r() - 0.5) * ragged * 2);
    right[j + 1] = cy - ny * hr * (1 + (r() - 0.5) * ragged * 2);
  }
  // Each edge point is written as the midline plus the half-width, not as the edge itself. The two differ in
  // the last bit now and then, which moves a few pixels of a bough sheet by one level: the sheets the owner
  // approved were painted this way, and they are kept bit for bit.
  const mid = (i, k) => (left[i * 2 + k] + right[i * 2 + k]) / 2;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const mx = mid(i, 0), my = mid(i, 1), px = mx + (left[i * 2] - mx), py = my + (left[i * 2 + 1] - my);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  for (let i = steps; i >= 0; i -= 1) { const mx = mid(i, 0), my = mid(i, 1); ctx.lineTo(mx + (right[i * 2] - mx), my + (right[i * 2 + 1] - my)); }
  ctx.closePath();
  ctx.fillStyle = css(colour, alpha);
  ctx.fill();
}

// A soft-edged dab, for moss, mist and washes.
export function dab(ctx, x, y, radius, colour, alpha = 1, squash = 1, angle = 0) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle); ctx.scale(1, squash);
  const g = ctx.createRadialGradient(0, 0, radius * 0.15, 0, 0, radius);
  g.addColorStop(0, css(colour, alpha));
  g.addColorStop(1, css(colour, 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// Turn a painted canvas into a texture whose smaller mip levels keep the same
// share of opaque pixels. Without this, cut-out foliage thins out and vanishes
// with distance (the "sparse, white crowns" failure recorded in CLAUDE.md).
export function cutoutTexture(canvas, options) { return drainSteps(cutoutTextureSteps(canvas, options)); }
export function* cutoutTextureSteps(canvas, { cutoff = 0.5, anisotropy = 2 } = {}) {
  const coverage = (data) => {
    let n = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] >= cutoff * 255) n += 1;
    return n / (data.length / 4);
  };
  // Give fully transparent pixels the average painted colour, so filtering at a
  // cut-out's edge blends towards paint instead of towards black.
  const bleed = (data) => {
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n += 1; }
    if (!n) return;
    r /= n; g /= n; b /= n;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      if (a < 0.2) { const k = a / 0.2; data[i] = data[i] * k + r * (1 - k); data[i + 1] = data[i + 1] * k + g * (1 - k); data[i + 2] = data[i + 2] * k + b * (1 - k); }
    }
  };
  const base = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  const want = coverage(base.data);
  bleed(base.data);
  yield 'mip 0';
  const mipmaps = [base];
  const alphaCounts = new Uint32Array(256);
  let source = canvas;
  for (let w = canvas.width, h = canvas.height; w > 1 || h > 1;) {
    w = Math.max(1, w >> 1); h = Math.max(1, h >> 1);
    const level = makeCanvas(w, h), ctx = level.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, w, h);
    const image = ctx.getImageData(0, 0, w, h);
    // An alpha histogram gives the same coverage as scanning the mip at each bisection.
    alphaCounts.fill(0);
    for (let i = 3; i < image.data.length; i += 4) alphaCounts[image.data[i]]++;
    for (let i = 254; i >= 0; i--) alphaCounts[i] += alphaCounts[i + 1];
    let lo = 1, hi = 6;
    for (let k = 0; k < 10 && want > 0; k += 1) {
      const mid = (lo + hi) / 2;
      const n = alphaCounts[Math.ceil(cutoff * 255 / mid)] || 0;
      if (n / (image.data.length / 4) < want) lo = mid; else hi = mid;
    }
    for (let i = 3; i < image.data.length; i += 4) image.data[i] = Math.min(255, image.data[i] * hi);
    ctx.putImageData(image, 0, 0);          // the next level is reduced from the boosted one
    bleed(image.data);
    mipmaps.push(image);
    source = level;
    if (w >= 128) yield `mip ${w}`;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.mipmaps = mipmaps;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

// An ordinary tiling colour texture from a painted canvas.
export function tileTexture(canvas, { srgb = true, anisotropy = 4 } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.anisotropy = anisotropy;
  texture.needsUpdate = true;
  return texture;
}

// A tangent-space normal map from a height field (Float32Array, values 0..1),
// wrapping at the edges so it tiles.
export function normalMapFromHeight(height, width, h, strength) {
  const canvas = makeCanvas(width, h), ctx = canvas.getContext('2d');
  const image = ctx.createImageData(width, h);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const l = height[y * width + ((x + width - 1) % width)], r = height[y * width + ((x + 1) % width)];
      const u = height[((y + h - 1) % h) * width + x], d = height[((y + 1) % h) * width + x];
      // +y of the map is up the sheet; the canvas is painted top-down and flipped on upload
      const nx = (l - r) * strength, ny = (d - u) * strength, inv = 1 / Math.hypot(nx, ny, 1);
      const o = (y * width + x) * 4;
      image.data[o] = Math.round((nx * inv * 0.5 + 0.5) * 255);
      image.data[o + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
      image.data[o + 2] = Math.round((inv * 0.5 + 0.5) * 255);
      image.data[o + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return tileTexture(canvas, { srgb: false, anisotropy: 2 });
}
