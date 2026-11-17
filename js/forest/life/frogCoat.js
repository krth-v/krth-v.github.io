import { makeCanvas, css, shift, mix, rng, dab, cutoutTexture } from '../paint/brush.js';
import { FROG_SHEET, FCELLS } from './frog.js';

// A frog's or a toad's paint: one sheet for the whole animal (life/frog.js lays its cells out), painted when the page
// loads from the `skin` table of its species sheet. Colours are [hue, saturation, lightness].
//
//   skin.body     rules for the body and the head, in order: the last whose `where` holds paints a place. A rule is
//                 { colour, where(p) }, p the place on the skin: { t along from the vent (0) to the snout (1), a round
//                 from the belly (0) to the spine (1), side (+1 the right), x, y, z (units of the body's length),
//                 bump (the relief there), wart (how much of a wart's middle), n(f), n2(f) (smooth noises through
//                 space, f the frequency per body length) }; `where` may give a share, 0..1, to blend a rule in
//   skin.spots    dabs laid over the body: [{ colour, count, size: [least, most] (body lengths), where(t, a), alpha, long }]
//   skin.mouth    { a, colour, from }: the line of the mouth, from `from` along to the snout
//   skin.leg      ({ d (0 at the hip .. 1 at the ankle), under (0 the upper side, 1 the lower), hind, n(f) (a smooth
//                 noise along the limb and round it, f its frequency over the limb's length) }) => colour
//   skin.foot     { top, under, pad, web }: a toe, its tip, and the web between toes
//   skin.eye      { iris, pupil, lid, ring }: the iris flecked with the ring's colour, the pupil a level oval (every
//                 frog and toad here has a horizontal pupil: CaliforniaHerps has the toad's; the first painter laid
//                 an upright slit, a cat's)          skin.sac { colour, fold }
// Nothing here knows a species.

const [W, H] = FROG_SHEET;
function noise3(seed) {
  const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 974711) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    let v = 0;
    for (let dx = 0; dx < 2; dx += 1) for (let dy = 0; dy < 2; dy += 1) for (let dz = 0; dz < 2; dz += 1) v += hash(xi + dx, yi + dy, zi + dz) * (dx ? xf : 1 - xf) * (dy ? yf : 1 - yf) * (dz ? zf : 1 - zf);
    return v;
  };
}
function rgb([h, s, l]) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

export function paintFrog(sheet, built, look) {
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d'), C = sheet.skin, r = rng(sheet.seed);
  const n1 = noise3(sheet.seed), n2 = noise3(sheet.seed + 17);
  const box = (cell) => [Math.floor(cell[0] * W), Math.floor(cell[1] * H), Math.ceil(cell[2] * W), Math.ceil(cell[3] * H)];
  const image = ctx.createImageData(W, H), px = image.data;
  // (the rules gone through by index, the colour mixed into one array: this runs once a pixel of the body's cell)
  const _c = [0, 0, 0];
  const ruled = (rules, p) => {
    const c0 = rules[0].colour;
    _c[0] = c0[0]; _c[1] = c0[1]; _c[2] = c0[2];
    for (let i = 1; i < rules.length; i += 1) {
      const rule = rules[i], w = rule.where(p), share = w === true ? 1 : w === false ? 0 : Math.max(0, Math.min(1, w));
      if (share > 0) { const c = rule.colour; _c[0] += (c[0] - _c[0]) * share; _c[1] += (c[1] - _c[1]) * share; _c[2] += (c[2] - _c[2]) * share; }
    }
    return _c;
  };
  const fill = (cell, colourAt) => {
    const [x0, y0, x1, y1] = box(cell), w = x1 - x0, h = y1 - y0;
    for (let y = y0 - 6; y < y1 + 6; y += 1) {
      if (y < 0 || y >= H) continue;
      const v = Math.min(1, Math.max(0, (y - y0 + 0.5) / h));
      for (let x = x0 - 6; x < x1 + 6; x += 1) {
        if (x < 0 || x >= W) continue;
        const u = Math.min(1, Math.max(0, (x - x0 + 0.5) / w)), [R, G, B] = rgb(colourAt(u, v)), i = (y * W + x) * 4;
        px[i] = R; px[i + 1] = G; px[i + 2] = B; px[i + 3] = 255;
      }
    }
  };
  // ---- the body and the head. (the cell's v is read from the top of the canvas: the sheet's v runs the other way, so
  // the cell is filled in the order the mesh's own uv reads it: see inCell in frog.js)
  const mouth = C.mouth;
  // (one place, filled again for each pixel, with its two noises reading it)
  const p = { x: 0, y: 0, z: 0, t: 0, a: 0, side: 1, bump: 0, wart: 0 };
  p.n = (f) => n1(p.x * f, p.y * f, p.z * f); p.n2 = (f) => n2(p.x * f, p.y * f, p.z * f);
  fill(FCELLS.trunk, (u, v) => {
    built.surface.trunk(u, v * 2, p);
    let c = ruled(C.body, p);
    if (mouth && p.t > mouth.from && Math.abs(p.a - mouth.a) < 0.012) c = mouth.colour;
    return shift(c, 0, 0, (p.n2(60) - 0.5) * 5);
  });
  const limb = (hind) => (u, v) => {
    const th = u * Math.PI * 2, under = (1 - Math.cos(th)) / 2, c = Math.cos(th), s = Math.sin(th), lane = hind ? 3 : 7;
    const n = (f) => n1(c * f * 0.12 + lane * 11, s * f * 0.12, v * f);
    return shift(C.leg({ d: v, under, hind, n }), 0, 0, (n2(u * 9, v * 30, lane) - 0.5) * 6);
  };
  const hind = limb(true), fore = limb(false);
  fill(FCELLS.hind, hind);
  fill(FCELLS.fore, fore);
  fill(FCELLS.foot, (u, v) => {
    const under = smoothStep(0.2, 0.4, u) * smoothStep(0.8, 0.6, u);
    const c = mix(C.foot.top, C.foot.under, under);
    return v > 0.9 && C.foot.pad ? C.foot.pad : c;
  });
  fill(FCELLS.web, () => C.foot.web);
  fill(FCELLS.eye, (u, v) => {
    const d = Math.hypot(u - 0.5, v - 0.5) / 0.5, ex = (u - 0.5) / 0.5, ey = (v - 0.5) / 0.5;
    if (Math.hypot(ex / 0.36, ey / 0.19) < 1) return C.eye.pupil;
    if (d < 0.66) {
      if (d > 0.6) return C.eye.ring;
      // flecks and fine lines of the ring's colour through the iris, thickest round the pupil
      const fleck = smoothStep(0.55, 0.75, n1(ex * 9, ey * 9, 3)) * 0.7 + 0.3 * smoothStep(0.5, 0.2, Math.hypot(ex / 0.36, ey / 0.19) - 1);
      return mix(C.eye.iris, C.eye.ring, Math.min(1, fleck));
    }
    return C.eye.lid;
  });
  fill(FCELLS.sac, (u, v) => mix(C.sac.colour, C.sac.fold, 0.5 + 0.5 * Math.sin(v * 70 + n1(u * 6, v * 3, 1) * 5) > 0.82 ? 0.7 : 0));
  ctx.putImageData(image, 0, 0);

  // ---- spots laid over the body, in the cell's own pixels (squashed to be round on the body)
  {
    const [x0, y0, x1, y1] = box(FCELLS.trunk), w = x1 - x0, h = y1 - y0, squash = (h / 1.25) / w;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    for (const spec of C.spots || []) {
      for (let i = 0; i < spec.count; i += 1) {
        const t = r(), a = r() * 2, sym = a <= 1 ? a : 2 - a;
        if (spec.where && !spec.where(t, sym)) continue;
        const size = (spec.size[0] + (spec.size[1] - spec.size[0]) * r()) * w;
        dab(ctx, x0 + t * w, y0 + (a / 2) * h, size, spec.colour, spec.alpha ?? 0.9, squash * (spec.long ? 1.6 : 1), r() * 6);
      }
    }
    ctx.restore();
  }
  const texture = cutoutTexture(canvas, { anisotropy: 4 });
  void look; void css;
  return { texture, canvas };
}
const smoothStep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
