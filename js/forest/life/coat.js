import { makeCanvas, css, shift, mix, stroke, rng, cutoutTexture } from '../paint/brush.js';
import { SHEET, BCELLS, PASTERN } from './beast.js';
import { pawCoat } from './parts/paw.js';
import { paintRodent } from './parts/rodentCoat.js';
import { paintPlate } from './plateCoat.js';

// A big animal's paint: one sheet for the whole animal (life/beast.js lays its cells out), painted when the page
// loads from the coat table of its species sheet. Colours are [hue, saturation, lightness].
//
//   coat.body      rules for the trunk, in order: the last whose `where` holds paints a place. A rule is { colour,
//                  where(p) } with p the place on the body standing square: { x, y, z } in metres and a, how far
//                  round from the belly (0) to the back (1); `soft` blends a rule in over that much of its edge
//                  (`where` then returns a share, 0..1, in place of true or false)
//   coat.moult     { shift: [hue, saturation, lightness], share, scale, soft, strength, stretch: [x, y, z] }: patches of the
//                  new summer coat through the old one, which is the old colour shifted; `soft` is how wide a patch's edge is
//                  (a share of the noise), `strength` how far the colour goes, `stretch` how the patches are drawn out
//   coat.head      rules as body, with p = { x, y, z, a, s (metres along the head from the poll), up }
//   coat.leg, .hoof, .ear: { outer, inner, edge }, .tail, .antler, .eye: { iris, pupil }, .nose
//   coat.hair      { long: where the hair is long and shaggy (the mane), its colour }
//
// Nothing here knows a species. The hair is laid in strokes the way it grows: back along the body and down its
// sides, down the legs, back from the nose.

const [W, H] = SHEET;

// a smooth noise in [0, 1] through space (metres), from a seed
function noise3(seed) {
  const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 974711) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    let v = 0;
    for (let dx = 0; dx < 2; dx += 1) for (let dy = 0; dy < 2; dy += 1) for (let dz = 0; dz < 2; dz += 1) {
      v += hash(xi + dx, yi + dy, zi + dz) * (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
    }
    return v;
  };
}
const smooth01 = (t) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };
// hsl to rgb, 0..255
function rgb([h, s, l]) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

export function paintCoat(sheet, built, look) {
  if (sheet.shape.plate) return paintPlate(sheet, built, look);          // (a beast drawn as a plate has its own paint: life/plateCoat.js)
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d'), C = sheet.coat, r = rng(sheet.seed ?? 211);
  const ragged = look.paint.ragged, n1 = noise3(sheet.seed ?? 211), n2 = noise3((sheet.seed ?? 211) + 17);
  const box = (cell) => [Math.floor(cell[0] * W), Math.floor(cell[1] * H), Math.ceil(cell[2] * W), Math.ceil(cell[3] * H)];
  let px = null;

  // The colour a set of rules gives a place: the last rule that holds, each blended in by its share
  const ruled = (rules, p) => {
    let c = rules[0].colour;
    for (let k = 1; k < rules.length; k += 1) {
      const rule = rules[k], w = rule.where(p);
      const share = w === true ? 1 : w === false ? 0 : Math.max(0, Math.min(1, w));
      if (share > 0) c = mix(c, rule.colour, share);
    }
    return c;
  };
  // Lays one cell from `colourAt(u, v)`, with a margin of 6 texels round it repeating its edge. The colour is worked
  // out for every STEP by STEP texels (at their middle) and the canvas draws it up smoothly: every colour here is a
  // smooth field of the place (the rules' soft edges, a noise a few centimetres across), and working out each texel
  // took most of the paint's time.
  const STEP = 4;
  const fill = (cell, colourAt) => {
    const [x0, y0, x1, y1] = box(cell), w = x1 - x0, h = y1 - y0, M = 6;
    const ox = Math.max(0, x0 - M), oy = Math.max(0, y0 - M), ex = Math.min(W, x1 + M), ey = Math.min(H, y1 + M);
    const gc = Math.ceil((ex - ox) / STEP), gr = Math.ceil((ey - oy) / STEP), small = makeCanvas(gc, gr), sctx = small.getContext('2d'), data = sctx.createImageData(gc, gr);
    for (let gy = 0; gy < gr; gy += 1) {
      const v = Math.min(1, Math.max(0, (oy + (gy + 0.5) * STEP - y0) / h));
      for (let gx = 0; gx < gc; gx += 1) {
        const u = Math.min(1, Math.max(0, (ox + (gx + 0.5) * STEP - x0) / w)), c = rgb(colourAt(u, v)), k = (gy * gc + gx) * 4;
        data.data[k] = c[0]; data.data[k + 1] = c[1]; data.data[k + 2] = c[2]; data.data[k + 3] = 255;
      }
    }
    sctx.putImageData(data, 0, 0);
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, ex - ox, ey - oy); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, ox, oy, gc * STEP, gr * STEP);
    ctx.restore();
  };
  // the moulting coat: the old coat shed in clumps, drawn out up and down the body, the new short coat under it a
  // little redder and darker, and the edge of a clump soft and ragged
  const moult = (p, c) => {
    const M = C.moult;
    if (!M) return c;
    const [sx, sy, sz] = M.stretch || [1, 1, 1], k = M.scale;
    const m = n1(p.x * k * sx, p.y * k * sy, p.z * k * sz) * 0.75 + n2(p.x * 9, p.y * 9, p.z * 9) * 0.25, edge = 1 - M.share;
    const w = smooth01((m - edge) / (M.soft ?? 0.12)) * (M.strength ?? 1);
    return w > 0 ? shift(c, M.shift[0] * w, M.shift[1] * w, M.shift[2] * w) : c;
  };
  const grain = (p, c, amount = 1) => shift(c, 0, 0, (n2(p.x * 31, p.y * 31, p.z * 31) - 0.5) * 7 * amount);

  // ---- the trunk, and the head
  fill(BCELLS.trunk, (u, v) => { const p = built.surface.trunk(u, v); return grain(p, moult(p, ruled(C.body, p))); });
  fill(BCELLS.head, (u, v) => { const p = built.surface.head(u, v); return grain(p, ruled(C.head, p), 0.7); });
  // ---- the legs: four columns, each round its leg from the back by its left side, its front and its right side
  fill(BCELLS.legs, (u, v) => {
    const col = Math.min(3, Math.floor(u * 4)), round = u * 4 - col, side = col % 2 === 0 ? -1 : 1, hind = col >= 2;
    const th = round * Math.PI * 2, out = -Math.sin(th) * side;                   // + on the leg's outer side
    const d = Math.min(1, v / PASTERN);                                           // 0 at the top joint, 1 at the fetlock
    return grain({ x: round * 3 + col, y: v * 4, z: col }, C.leg({ d, out, front: -Math.cos(th), hind, pastern: v > PASTERN }));
  });
  if (sheet.shape.paw) pawCoat(fill, C, BCELLS.hoof); else fill(BCELLS.hoof, () => C.hoof);
  fill(BCELLS.ear, (u, v) => {
    const inner = u >= 0.5, across = Math.abs(((u % 0.5) / 0.5) * 2 - 1), up = 1 - v;
    const c = inner ? C.ear.inner : C.ear.outer;
    if (across > 0.86 || up > 0.93) return C.ear.edge;
    if (!inner) return c;
    const bowl = (1 - across * across) * Math.sin(Math.PI * up);
    return shift(c, -3 * bowl, 5 * bowl, -15 * bowl + 4 * across);
  });
  fill(BCELLS.tail, (u, v) => (Math.abs(u - 0.5) < 0.22 ? C.tail.top : C.tail.under));
  if (C.antler) fill(BCELLS.antler, (u) => mix(C.antler, shift(C.antler, 0, -4, 8), Math.max(0, (u % 0.62) / 0.62 - 0.8) * 4));
  fill(BCELLS.eye, (u, v) => (Math.hypot(u - 0.5, v - 0.5) < 0.16 ? C.eye.pupil : C.eye.iris));
  if (C.tail.at) fill(BCELLS.tail, C.tail.at);                                // (a long tail's own paint: life/parts/longBody.js)
  if (C.bush || C.bits) paintRodent(ctx, sheet, look);                            // (a bushy tail's brush, a rodent's teeth: life/parts/rodentCoat.js)
  px = ctx.getImageData(0, 0, W, H).data;                                         // what the hair is laid over: read once

  // ---- hair: strokes the way it lies, over the ground colour, in the colour beneath each stroke a little shifted
  const at = (cell, u, v) => [cell[0] * W + (cell[2] - cell[0]) * W * u, cell[1] * H + (cell[3] - cell[1]) * H * v];
  const clip = (cell, paint) => { const [x0, y0, x1, y1] = box(cell); ctx.save(); ctx.beginPath(); ctx.rect(x0 - 4, y0 - 4, x1 - x0 + 8, y1 - y0 + 8); ctx.clip(); paint(); ctx.restore(); };
  const sample = (x, y) => { const i = (Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)))) * 4; return [px[i], px[i + 1], px[i + 2]]; };
  const toHsl = ([R, G, B]) => {
    const r0 = R / 255, g0 = G / 255, b0 = B / 255, mx = Math.max(r0, g0, b0), mn = Math.min(r0, g0, b0), l = (mx + mn) / 2, d = mx - mn;
    if (d < 1e-6) return [0, 0, l * 100];
    const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r0 ? ((g0 - b0) / d + 6) % 6 : mx === g0 ? (b0 - r0) / d + 2 : (r0 - g0) / d + 4;
    return [h * 60, s * 100, l * 100];
  };
  // the trunk: back along the body and down its sides; long and dark down the neck where the mane is
  const fur = C.fur ?? 1;
  clip(BCELLS.trunk, () => {
    // Block the shoulder, flank and haunch with a broad flat brush before the guard
    // hairs. Pull the flank rearward and let the brush turn down over the shoulder.
    const count = 3200;
    for (let i = 0; i < count; i += 1) {
      const u = r(), v = r(), p = built.surface.trunk(u, v), [x, y] = at(BCELLS.trunk, u, v);
      const long = C.hair.long(p), len = (long ? 26 + r() * 22 : 9 + r() * 9) * fur, down = v < 0.5 ? -1 : 1;     // (fur: life/parts/rodentCoat.js)
      const back = long ? 0.25 : 0.58 + 0.32 * Math.sin(Math.PI * u), dx = -back * len, dy = down * Math.sqrt(1 - back * back) * len * (0.6 + 0.6 * (1 - p.a));
      const base = toHsl(sample(x, y)), c = shift(base, (r() - 0.5) * 4, (r() - 0.5) * 8, (r() - 0.5) * 9 + (long ? -3 : 1));
      const broad = i < count / 3;
      const width = broad ? (long ? 12 : 7) : (long ? 3.2 : 2.2);
      const reach = broad ? 1.6 : 1;
      const pigment = broad ? shift(c, 2, -2, p.a * 9 - 3) : c;
      stroke(ctx, r, x, y, x + dx * reach, y + dy * reach, width, pigment,
        { ragged, taperIn: 0.10, taperOut: 0.55, bend: (r() - 0.5) * 0.2, alpha: 0.9 });
    }
  });
  clip(BCELLS.head, () => {
    for (let i = 0; i < 1400; i += 1) {
      const u = r(), v = r(), [x, y] = at(BCELLS.head, u, v), len = 5 + r() * 5, down = v < 0.5 ? -1 : 1;
      const c = shift(toHsl(sample(x, y)), 0, (r() - 0.5) * 6, (r() - 0.5) * 7);
      stroke(ctx, r, x, y, x - len * 0.85, y + down * len * 0.5, 1.6, c, { ragged, taperIn: 0.1, taperOut: 0.7, alpha: 0.8 });
    }
  });
  clip(BCELLS.legs, () => {
    for (let i = 0; i < 2600; i += 1) {
      const u = r(), v = r() * PASTERN, [x, y] = at(BCELLS.legs, u, v), len = 6 + r() * 7;
      const c = shift(toHsl(sample(x, y)), 0, (r() - 0.5) * 6, (r() - 0.5) * 7);
      stroke(ctx, r, x, y, x + (r() - 0.5) * 2, y + len, 1.8, c, { ragged, taperIn: 0.1, taperOut: 0.7, alpha: 0.85 });
    }
  });
  clip(BCELLS.ear, () => {
    // long pale hairs inside the ear
    for (let i = 0; i < 160; i += 1) {
      const u = 0.55 + r() * 0.4, v = 0.15 + r() * 0.8, [x, y] = at(BCELLS.ear, u, v);
      stroke(ctx, r, x, y, x + (r() - 0.5) * 6, y - 12 - r() * 10, 1.4, shift(C.ear.inner, 0, -6, 10), { ragged, taperIn: 0.1, taperOut: 0.8, alpha: 0.7 });
    }
  });
  // the eye's light
  { const [x, y] = at(BCELLS.eye, 0.4, 0.36); ctx.fillStyle = css([210, 30, 88], 0.9); ctx.beginPath(); ctx.ellipse(x, y, 7, 5, -0.5, 0, Math.PI * 2); ctx.fill(); }

  const texture = cutoutTexture(canvas, { anisotropy: 4 });
  return { texture, canvas };
}
