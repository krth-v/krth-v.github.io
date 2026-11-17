import { makeCanvas, css, shift, mix, stroke, rng, cutoutTexture } from '../paint/brush.js';
import { SHEET, CELLS, MEM, membraneAt } from './bat.js';

// A bat's paint: one sheet (life/bat.js lays its cells out), painted when the page loads from the sheet's `fur`
// table. Colours are [hue, saturation, lightness]. The fur is laid in strokes back along the body; the membrane is a
// dark skin with the finger bones and the fans of lines between them drawn from the bind pose's own rays, and a
// dusting of fur along the body's side, where the fur runs out over the skin. The colours are from the Washington
// description (dark brown to chestnut above and paler beneath, dark ears and wings), and everything else is drawn.

const [W, H] = SHEET;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function rgb([h, s, l]) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const hash = (x, y, seed) => { let h = (x * 374761393 + y * 668265263 + seed * 974711) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const value = (x, y, seed) => {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, f = (t) => t * t * (3 - 2 * t);
  const a = hash(xi, yi, seed), b = hash(xi + 1, yi, seed), c = hash(xi, yi + 1, seed), d = hash(xi + 1, yi + 1, seed);
  return (a * (1 - f(fx)) + b * f(fx)) * (1 - f(fy)) + (c * (1 - f(fx)) + d * f(fx)) * f(fy);
};

export function paintBat(sheet, built, look) {
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d'), C = sheet.fur, seed = sheet.seed, r = rng(seed);
  const ragged = look.paint.ragged, image = ctx.createImageData(W, H), px = image.data;
  const box = (cell) => [cell[0], cell[1], cell[2], cell[3]];
  const fill = (cell, colourAt) => {
    const [x0, y0, x1, y1] = box(cell), w = x1 - x0, h = y1 - y0;
    for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) {
      const [R, G, B] = rgb(colourAt((x - x0 + 0.5) / w, (y - y0 + 0.5) / h, x, y)), i = (y * W + x) * 4;
      px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = 255;
    }
  };
  const eye = built.eye, shape = sheet.shape;
  const x0 = Math.min(...shape.trunk.map((t) => t[0])) * 0.001, x1 = Math.max(...shape.trunk.map((t) => t[0])) * 0.001;
  // the face, from a quarter of the way from the neck to the nose, all of it by most of the way (the Yuma Myotis's 16.5 and 22.5 mm)
  const neck = shape.neck[0] * 0.001, face0 = neck + (x1 - neck) * 0.25, face1 = neck + (x1 - neck) * 0.85;
  // ---- the fur: u round the body from the back (0) through the right side to the belly (0.5), v from the nose to the rump
  fill(CELLS.fur, (u, v, x, y) => {
    const c = Math.cos(u * Math.PI * 2), belly = smooth(-0.05, 0.75, -c);
    let col = mix(C.back, C.belly, belly);
    col = mix(col, shift(C.back, 2, 6, 8), smooth(0.4, 0.9, value(x * 0.05, y * 0.05, seed)) * 0.5 * (1 - belly));     // chestnut washes in the dark
    const xm = x1 - (x1 - x0) * v;
    if (xm > face0) col = mix(col, C.face, smooth(face0, face1, xm) * (1 - belly * 0.4));                                   // the face is darker
    if (v < 0.05) col = mix(col, C.nose, smooth(0.05, 0.0, v));
    if (v > 0.85) col = mix(col, shift(C.back, 0, -4, -3), smooth(0.85, 1, v) * (1 - belly));
    return shift(col, 0, 0, (value(x * 0.3, y * 0.3, seed + 3) - 0.5) * 5);
  });
  // ---- the membrane: above and beneath
  const bone = (cell) => fill(cell, () => C.bone);
  for (const [cell, base] of [[CELLS.top, C.membrane.top], [CELLS.under, C.membrane.under]]) {
    fill(cell, (u, v, x, y) => {
      const n = value(x * 0.04, y * 0.04, seed + 11) * 0.7 + value(x * 0.2, y * 0.2, seed + 13) * 0.3;
      return shift(base, (n - 0.5) * 6, (n - 0.5) * 8, (n - 0.5) * 9);
    });
  }
  bone(CELLS.bone);
  fill(CELLS.foot, () => C.foot);
  fill(CELLS.earOut, (u, v) => (Math.abs(u - 0.5) > 0.44 || v < 0.05 ? C.ear.edge : mix(C.ear.outer, shift(C.ear.outer, 0, 0, 5), v)));
  fill(CELLS.earIn, (u, v) => (Math.abs(u - 0.5) > 0.44 || v < 0.05 ? C.ear.edge : mix(C.ear.inner, C.ear.outer, smooth(0.55, 1, v) * 0.5)));
  ctx.putImageData(image, 0, 0);

  // the eyes on the head: a black bead
  { const v = (x1 - eye.x) / (x1 - x0), cell = CELLS.fur;
    for (const u of [eye.angle / (Math.PI * 2), 1 - eye.angle / (Math.PI * 2)]) {
      const X = cell[0] + u * 512, Y = cell[1] + v * 512;
      ctx.fillStyle = css(C.eye); ctx.beginPath(); ctx.ellipse(X, Y, 9, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css([210, 20, 80], 0.8); ctx.beginPath(); ctx.arc(X - 2, Y - 2, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }
  // fur, stroke by stroke, back along the body
  ctx.save(); ctx.beginPath(); ctx.rect(CELLS.fur[0], CELLS.fur[1], 512, 512); ctx.clip();
  for (let i = 0; i < 5200; i += 1) {
    const u = r(), v = r(), X = CELLS.fur[0] + u * 512, Y = CELLS.fur[1] + v * 512, len = 7 + r() * 7;
    const p = ctx.getImageData(Math.floor(X), Math.floor(Y), 1, 1).data;
    const R = p[0] / 255, G = p[1] / 255, Bc = p[2] / 255, mx = Math.max(R, G, Bc), mn = Math.min(R, G, Bc), l = (mx + mn) / 2, d = mx - mn;
    const hue = d < 1e-6 ? 0 : (mx === R ? ((G - Bc) / d + 6) % 6 : mx === G ? (Bc - R) / d + 2 : (R - G) / d + 4) * 60, sat = d < 1e-6 ? 0 : d / (1 - Math.abs(2 * l - 1)) * 100;
    stroke(ctx, r, X, Y, X, Y + len, 2.2, shift([hue, sat, l * 100], (r() - 0.5) * 4, (r() - 0.5) * 8, (r() - 0.5) * 9 + 1), { ragged, taperIn: 0.1, taperOut: 0.7, alpha: 0.8 });
    void Bc;
  }
  ctx.restore();

  // Frosted fur (`fur.frost`: [colour, how much]): pale tips on the fur of the back and, fewer, of the belly, but none
  // on the head, the throat and the neck (the Silver-haired Bat's, as the sources have it)
  if (C.frost) {
    const [frost, much] = C.frost, vNeck = (x1 - neck) / (x1 - x0) + 0.06;
    ctx.save(); ctx.beginPath(); ctx.rect(CELLS.fur[0], CELLS.fur[1], 512, 512); ctx.clip();
    for (let i = 0; i < 4200 * much; i += 1) {
      const u = r(), v = vNeck + r() * (1 - vNeck), belly = smooth(-0.05, 0.75, -Math.cos(u * Math.PI * 2));
      if (r() < belly * 0.6) continue;
      const X = CELLS.fur[0] + u * 512, Y = CELLS.fur[1] + v * 512, len = 3 + r() * 4;
      stroke(ctx, r, X, Y + 6 + r() * 4, X + (r() - 0.5) * 1.5, Y + 6 + r() * 4 + len, 1.6, shift(frost, 0, 0, (r() - 0.5) * 12), { ragged, taperIn: 0.3, taperOut: 0.5, alpha: 0.75 });
    }
    ctx.restore();
  }

  // the membrane's bones and veins, from the bind pose's own rays
  const mem = built.mem || MEM, J = built.joints.R, at = (p) => { const [a, b] = membraneAt(p.x, p.z, mem); return [a * 512, b * 512]; };
  for (const [cell, dark] of [[CELLS.top, 1], [CELLS.under, 0.85]]) {
    ctx.save(); ctx.beginPath(); ctx.rect(cell[0], cell[1], 512, 512); ctx.clip(); ctx.translate(cell[0], cell[1]);
    const line = (a, b, w, col, alpha = 1) => { const [x, y] = at(a), [X, Y] = at(b); ctx.strokeStyle = css(col, alpha); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(X, Y); ctx.stroke(); };
    // the fans of fine lines that cross the membrane between the fingers
    for (const [a, b] of [['d3', 'd4'], ['d4', 'd5']]) for (let k = 1; k < 7; k += 1) {
      const t = k / 7, e1 = J.W.clone().lerp(J.tip[a], 1), e2 = J.W.clone().lerp(J.tip[b], 1);
      line(J.W.clone().lerp(J.tip[a], 0.45).lerp(J.W.clone().lerp(J.tip[b], 0.45), t), e1.clone().lerp(e2, t), 1.2, mix(C.membrane.vein, C.membrane.top, 0.5), 0.7 * dark);
    }
    for (const k of ['d2', 'd3', 'd4', 'd5']) line(J.W, J.tip[k], 3.4, C.bone, 0.95);
    line(J.S, J.E, 4.2, C.bone, 0.95); line(J.E, J.W, 3.6, C.bone, 0.95);
    line(J.hip, J.knee, 3.6, C.bone, 0.9); line(J.knee, J.ankle, 3, C.bone, 0.9); line(J.ankle, J.calcar, 2.2, C.bone, 0.9);
    // the membrane's hind edge is a little paler, and the skin by the body is furred
    line(J.tip.d3, J.tip.d4, 3, C.membrane.edge, 0.45); line(J.tip.d4, J.tip.d5, 3, C.membrane.edge, 0.45); line(J.tip.d5, J.ankle, 3, C.membrane.edge, 0.4);
    ctx.restore();
  }
  // a dusting of fur on the skin along the body
  for (const cell of [CELLS.top, CELLS.under]) {
    ctx.save(); ctx.beginPath(); ctx.rect(cell[0], cell[1], 512, 512); ctx.clip();
    for (let i = 0; i < 700; i += 1) {
      const a = r() * 0.15, b = r(), X = cell[0] + a * 512 * 0.85, Y = cell[1] + b * 512, len = 5 + r() * 5;
      stroke(ctx, r, X, Y, X + (r() - 0.5) * 3, Y + len, 1.6, shift(i % 3 ? C.back : C.belly, 0, 0, (r() - 0.5) * 8), { ragged, taperIn: 0.1, taperOut: 0.7, alpha: 0.7 * (1 - a / 0.15) });
    }
    ctx.restore();
  }
  // Fur on the tail's membrane, above (`fur.uro`: [how much of it, from its base; how thick]): the Silver-haired Bat's
  // is densely furred over its first half, the Big Brown Bat's has a few hairs over its first quarter
  if (C.uro) {
    const [share, thick] = C.uro, rump = x0, cell = CELLS.top, [, vFrom] = membraneAt(rump, 0, mem), [, vTo] = membraneAt(rump - shape.tail.length * 0.001 * share, 0, mem);
    const [uKnee] = membraneAt(0, Math.abs(J.knee.z), mem);
    ctx.save(); ctx.beginPath(); ctx.rect(cell[0], cell[1], 512, 512); ctx.clip();
    for (let i = 0; i < 1400 * thick; i += 1) {
      const t = r(), w = r(), a = w * uKnee * (1 - 0.5 * t), b = vFrom + (vTo - vFrom) * t, X = cell[0] + a * 512, Y = cell[1] + b * 512, len = 4 + r() * 5;
      const colour = C.frost && r() < 0.12 ? mix(C.frost[0], C.back, 0.4) : C.back;
      stroke(ctx, r, X, Y, X + (r() - 0.5) * 2, Y + len, 1.6, shift(colour, 0, 0, (r() - 0.5) * 8), { ragged, taperIn: 0.1, taperOut: 0.7, alpha: 0.8 * (1 - 0.6 * t) * (1 - 0.7 * w * w) });
    }
    ctx.restore();
  }
  const texture = cutoutTexture(canvas, { anisotropy: 4 });
  return { texture, canvas };
}
