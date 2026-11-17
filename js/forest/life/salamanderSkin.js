import * as THREE from 'three';
import { makeCanvas, mix, rng, dab } from '../paint/brush.js';
import { SAL_SHEET, SCELLS, WRIST, TOES } from './salamander.js';

// A salamander's or a newt's paint: one sheet for the whole animal (life/salamander.js lays its cells out), painted
// when the page loads from the `skin` table of its species sheet. Colours are [hue, saturation, lightness].
//
//   skin.body     rules for the body, the head and the tail, in order: the last whose `where` holds paints a place. A
//                 rule is { colour, where(p) }, p the place on the skin: { s along it in snout-to-vent lengths (the vent
//                 at 1), t the same as a share of the whole animal, tail (0 at the vent .. 1 at the tip), a round it from
//                 the belly (0) to the spine (1), side (+1 the right), x, y, z (snout-to-vent lengths), n(f), n2(f)
//                 (smooth noises through space, f the frequency per snout-to-vent length) }; `where` may give a share,
//                 0..1, to blend a rule in
//   skin.grain    a rough skin: { size (mm, a granule across), relief (how much lighter its top and darker the gaps),
//                 from (a: up from the belly, where the granules begin) }
//   skin.grooves  the costal grooves down the flanks: { count, from, to (s), colour, width (s) }
//   skin.spots    dabs over the body: [{ colour, count, size: [least, most] (snout-to-vent lengths), where(s, a), alpha, long }]
//   skin.mouth    { a, to, colour }: the line of the mouth along the head's side, from the snout back to `to`
//   skin.leg      ({ d (0 at its top .. 1 at the wrist), under (0 the upper side, 1 the lower), hind }) => colour
//   skin.foot     { top, under }       skin.eye { iris, pupil, ring, lid, bar (a dark band across the iris) }
//   skin.gills    { stalk, fringe }
// Nothing here knows a species.

const [W, H] = SAL_SHEET;
// A smooth noise through space, 0..1: values on a lattice, laid between smoothly; 64 to a side along the animal and
// 16 across it (an animal is a few of its lengths long and a tenth as thick), wrapped. (A hash worked out at each of
// a lattice point's eight corners made the sheet take twice as long to paint.)
function noise3(seed) {
  const N = 64, Q = 16, lattice = new Float32Array(N * Q * Q), r = rng(seed * 7 + 3);
  for (let i = 0; i < lattice.length; i += 1) lattice[i] = r();
  const fade = (t) => t * t * (3 - 2 * t);
  return (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = fade(x - xi), yf = fade(y - yi), zf = fade(z - zi);
    const x0 = xi & (N - 1), y0 = yi & (Q - 1), z0 = zi & (Q - 1), x1 = (x0 + 1) & (N - 1), y1 = (y0 + 1) & (Q - 1), z1 = (z0 + 1) & (Q - 1);
    const at = (a, b, c) => lattice[(a * Q + b) * Q + c];
    const c00 = at(x0, y0, z0) + (at(x1, y0, z0) - at(x0, y0, z0)) * xf, c10 = at(x0, y1, z0) + (at(x1, y1, z0) - at(x0, y1, z0)) * xf;
    const c01 = at(x0, y0, z1) + (at(x1, y0, z1) - at(x0, y0, z1)) * xf, c11 = at(x0, y1, z1) + (at(x1, y1, z1) - at(x0, y1, z1)) * xf;
    const c0 = c00 + (c10 - c00) * yf, c1 = c01 + (c11 - c01) * yf;
    return c0 + (c1 - c0) * zf;
  };
}
function rgb([h, s, l], out = [0, 0, 0]) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  for (let c = 0; c < 3; c += 1) { const k = ([0, 8, 4][c] + h / 30) % 12; out[c] = (l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)))) * 255; }
  return out;
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// A tile of granules, a skin's tubercles: their height, 0 in the gaps to 1 on a granule's top, and which way each
// slopes (for a lit side and a shaded one). `n` granules across a tile of `size` pixels, wrapped at its edges.
function granules(seed, size = 192, n = 16) {
  const r = rng(seed), cell = size / n, points = [];
  for (let j = 0; j < n; j += 1) for (let i = 0; i < n; i += 1) points.push([(i + 0.15 + 0.7 * r()) * cell, (j + 0.15 + 0.7 * r()) * cell, cell * (0.42 + 0.22 * r())]);
  const height = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const ci = Math.floor(x / cell), cj = Math.floor(y / cell);
    let h = 0;
    for (let dj = -1; dj <= 1; dj += 1) for (let di = -1; di <= 1; di += 1) {
      const ii = (ci + di + n) % n, jj = (cj + dj + n) % n, [px, py, pr] = points[jj * n + ii];
      let dx = x - px, dy = y - py;
      if (dx > size / 2) dx -= size; if (dx < -size / 2) dx += size; if (dy > size / 2) dy -= size; if (dy < -size / 2) dy += size;
      const q = 1 - (dx * dx + dy * dy) / (pr * pr);
      if (q > h) h = q;
    }
    height[y * size + x] = Math.sqrt(Math.max(0, h));
  }
  // the light on a granule: lighter on its upper side (towards the spine), darker on its lower and in the gaps
  const shade = new Float32Array(size * size);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    const up = height[((y + size - 1) % size) * size + x], down = height[((y + 1) % size) * size + x], h = height[y * size + x];
    shade[y * size + x] = (h - 0.5) * 0.9 + (down - up) * 1.6;
  }
  return { size, shade, tile: n };
}

export function paintSalamander(sheet, built, look) {
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d'), C = sheet.skin, r = rng(sheet.seed), svl = sheet.shape.svl;
  const n1 = noise3(sheet.seed), n2 = noise3(sheet.seed + 17);
  const box = (cell) => [Math.floor(cell[0] * W), Math.floor(cell[1] * H), Math.ceil(cell[2] * W), Math.ceil(cell[3] * H)];
  const image = ctx.createImageData(W, H), px = image.data;
  // (between the cells: the body's first colour, so that a smaller level read at a cell's edge reads paint)
  { const [R, G2, Bl] = rgb(C.body[0].colour); for (let i = 0; i < px.length; i += 4) { px[i] = R; px[i + 1] = G2; px[i + 2] = Bl; px[i + 3] = 255; } }
  // the last rule that holds paints a place, laid over the ones before it by its share, as paint is: in red, green
  // and blue, so that a brown laid into a blue-grey does not pass through green on the way (a colour's hue mixed as a
  // number did). Into one table, kept.
  const _c = [0, 0, 0], _rgb = [0, 0, 0], RGB = new Map();
  const asRGB = (colour) => { let v = RGB.get(colour); if (!v) { v = rgb(colour); RGB.set(colour, v); } return v; };
  const over = (colour, share) => { const v = asRGB(colour); for (let i = 0; i < 3; i += 1) _c[i] += (v[i] - _c[i]) * share; };
  const ruled = (rules, p) => {
    const first = asRGB(rules[0].colour);
    _c[0] = first[0]; _c[1] = first[1]; _c[2] = first[2];
    for (let k = 1; k < rules.length; k += 1) {
      const rule = rules[k], w = rule.where(p), share = w === true ? 1 : w === false ? 0 : Math.max(0, Math.min(1, w));
      if (share > 0) over(rule.colour, share);
    }
    return _c;
  };
  // A cell painted a few pixels past its edges (a filtered read at an edge reads paint, not nothing): `colourAt(u, v)`
  // worked out on a grid every `step` pixels and laid between the grid's points, with the paint's own mottle at every
  // pixel, as gouache lies
  const fill = (cell, colourAt, step = 3) => {
    const [x0, y0, x1, y1] = box(cell), w = x1 - x0, h = y1 - y0;
    const ax = Math.max(0, x0 - 4), bx = Math.min(W, x1 + 4), ay = Math.max(0, y0 - 4), by = Math.min(H, y1 + 4);
    const gw = Math.ceil((bx - ax) / step) + 2, gh = Math.ceil((by - ay) / step) + 2, grid = new Float32Array(gw * gh * 3);
    for (let j = 0; j < gh; j += 1) {
      const v = Math.min(1, Math.max(0, (ay + step * j - y0 + 0.5) / h));
      for (let i = 0; i < gw; i += 1) {
        rgb(colourAt(Math.min(1, Math.max(0, (ax + step * i - x0 + 0.5) / w)), v), _rgb); const o = (j * gw + i) * 3;
        grid[o] = _rgb[0]; grid[o + 1] = _rgb[1]; grid[o + 2] = _rgb[2];
      }
    }
    for (let y = ay; y < by; y += 1) {
      const gy = (y - ay) / step, j0 = Math.floor(gy), fy = gy - j0;
      for (let x = ax; x < bx; x += 1) {
        const gx = (x - ax) / step, i0 = Math.floor(gx), fx = gx - i0, k = 1 + 0.05 * mottle[((y & 127) << 7) | (x & 127)];
        const o00 = (j0 * gw + i0) * 3, o10 = o00 + 3, o01 = o00 + gw * 3, o11 = o01 + 3, i = (y * W + x) * 4;
        for (let ch = 0; ch < 3; ch += 1) {
          const top = grid[o00 + ch] + (grid[o10 + ch] - grid[o00 + ch]) * fx, bottom = grid[o01 + ch] + (grid[o11 + ch] - grid[o01 + ch]) * fx;
          px[i + ch] = Math.max(0, Math.min(255, (top + (bottom - top) * fy) * k));
        }
        px[i + 3] = 255;
      }
    }
  };

  // ---- the body, the head and the tail. The rules are worked out on a grid every third pixel each way and laid
  // between them (painted pixel by pixel the sheet took 390 ms); the granules and the paint's own mottle are laid on
  // at every pixel.
  const G = C.grain ? granules(sheet.seed + 3) : null, grainMm = C.grain ? C.grain.size : 1, STEP = 3;
  const grooves = C.grooves || null, mouth = C.mouth || null, mottle = granules(sheet.seed + 9, 128, 24).shade;
  {
    const [x0, y0, x1, y1] = box(SCELLS.body), w = x1 - x0, h = y1 - y0;
    const p = { s: 0, t: 0, tail: 0, a: 0, side: 1, x: 0, y: 0, z: 0, round: 1, n: null, n2: null }, col = {};
    p.n = (f) => n1(p.x * f, p.y * f, p.z * f); p.n2 = (f) => n2(p.x * f, p.y * f, p.z * f);
    const ax = Math.max(0, x0 - 4), bx = Math.min(W, x1 + 4), ay = Math.max(0, y0 - 4), by = Math.min(H, y1 + 4);
    const gw = Math.ceil((bx - ax) / STEP) + 2, gh = Math.ceil((by - ay) / STEP) + 2, grid = new Float32Array(gw * gh * 3), rounds = new Float32Array(gw), ss = new Float32Array(gw), as = new Float32Array(gw * gh);
    for (let i = 0; i < gw; i += 1) {
      const u = Math.min(1, Math.max(0, (ax + STEP * i - x0 + 0.5) / w));
      built.surface.column(u, col);
      rounds[i] = col.round; ss[i] = col.s;
      for (let j = 0; j < gh; j += 1) {
        const v = Math.min(1, Math.max(0, (ay + STEP * j - y0 + 0.5) / h));
        built.surface.at(col, v, p);
        const c = ruled(C.body, p);
        // the costal grooves: a dark crease down the flank, with a paler lip behind it
        if (grooves && p.s > grooves.from - grooves.width && p.s < grooves.to + grooves.width) {
          const gap = (grooves.to - grooves.from) / Math.max(1, grooves.count - 1), k = Math.round((p.s - grooves.from) / gap);
          if (k >= 0 && k < grooves.count) {
            const d = (p.s - (grooves.from + k * gap) + 0.012 * (p.a - 0.5)) / grooves.width, flank = smooth(0.12, 0.25, p.a) * smooth(0.86, 0.7, p.a);
            if (flank > 0) { over(grooves.colour, flank * Math.exp(-d * d * 2.6) * 0.45); if (d > 0.6 && d < 1.6) for (let n = 0; n < 3; n += 1) c[n] *= 1 + 0.06 * flank; }
          }
        }
        // the line of the mouth
        if (mouth && p.s < mouth.to && Math.abs(p.a - mouth.a) < 0.016 * (1 - 0.5 * p.s / mouth.to)) over(mouth.colour, smooth(mouth.to, mouth.to * 0.8, p.s));
        const o = (j * gw + i) * 3;
        grid[o] = c[0]; grid[o + 1] = c[1]; grid[o + 2] = c[2];
        // (how much of a granule's relief a place takes, by how far round the body it is: for every pixel between)
        as[j * gw + i] = G ? C.grain.relief * smooth(C.grain.from, C.grain.from + 0.12, p.a) : 0;
      }
    }
    // (by column: which granule column, and how many granule rows round the body there)
    const gcol = new Int32Array(bx - ax), grow = new Float32Array(bx - ax), per = G ? G.size / G.tile : 0;
    if (G) for (let x = ax; x < bx; x += 1) {
      const gx = (x - ax) / STEP, i0 = Math.min(gw - 2, Math.floor(gx)), fx = gx - i0;
      const s = ss[i0] + (ss[i0 + 1] - ss[i0]) * fx, round = rounds[i0] + (rounds[i0 + 1] - rounds[i0]) * fx;
      gcol[x - ax] = ((Math.floor(((s * svl) / grainMm) * per) % G.size) + G.size) % G.size;
      grow[x - ax] = ((round * svl) / grainMm) * per;
    }
    for (let y = ay; y < by; y += 1) {
      const gy = (y - ay) / STEP, j0 = Math.min(gh - 2, Math.floor(gy)), fy = gy - j0, v = Math.min(1, Math.max(0, (y - y0 + 0.5) / h));
      for (let x = ax; x < bx; x += 1) {
        const gx = (x - ax) / STEP, i0 = Math.min(gw - 2, Math.floor(gx)), fx = gx - i0;
        const o00 = (j0 * gw + i0) * 3, o10 = o00 + 3, o01 = o00 + gw * 3, o11 = o01 + 3, i = (y * W + x) * 4;
        // the paint's own mottle, as gouache lies, and a rough skin: each granule lighter on top and darker in the gaps
        let k = 1 + 0.05 * mottle[((y & 127) << 7) | (x & 127)];
        if (G) k *= 1 + G.shade[(Math.floor(v * grow[x - ax]) % G.size) * G.size + gcol[x - ax]] * as[j0 * gw + i0];
        for (let ch = 0; ch < 3; ch += 1) {
          const top = grid[o00 + ch] + (grid[o10 + ch] - grid[o00 + ch]) * fx, bottom = grid[o01 + ch] + (grid[o11 + ch] - grid[o01 + ch]) * fx;
          px[i + ch] = Math.max(0, Math.min(255, (top + (bottom - top) * fy) * k));
        }
        px[i + 3] = 255;
      }
    }
  }
  // ---- the limbs: four columns, each round its limb and down it to the wrist, then the palm and the toes
  for (let k = 0; k < 4; k += 1) {
    const hind = k >= 2, col = [SCELLS.limbs[0] + (SCELLS.limbs[2] - SCELLS.limbs[0]) * (k / 4), SCELLS.limbs[1], SCELLS.limbs[0] + (SCELLS.limbs[2] - SCELLS.limbs[0]) * ((k + 1) / 4), SCELLS.limbs[3]];
    fill(col, (u, v) => {
      const under = (1 - Math.cos(u * Math.PI * 2)) / 2;
      let c;
      if (v < WRIST) c = C.leg({ d: v / WRIST, under, hind });
      else c = mix(C.foot.top, C.foot.under, smooth(0.3, 0.7, under));
      if (v > TOES + (1 - TOES) * 0.8) c = mix(c, C.foot.under, 0.4);                // the toes' tips, paler
      return c;
    });
  }
  // ---- the eye: an iris and its pupil, the rim of skin round them
  const E = C.eye;
  fill(SCELLS.eye, (u, v) => {
    const dx = (u - 0.5) / 0.48, dy = (v - 0.5) / 0.48, d = Math.hypot(dx, dy);
    if (d > 0.86) return E.lid;
    if (d > 0.8) return E.ring;
    if (E.bar && Math.abs(dy) < 0.22 && d > 0.2) return mix(E.iris, E.bar, 0.85);
    if (Math.hypot(dx / 1.25, dy) < 0.3) return E.pupil;
    return mix(E.iris, E.ring, smooth(0.45, 0.8, d) * 0.5 + (n1(u * 30, v * 30, 5) - 0.5) * 0.4);
  }, 1);
  // ---- the gills: the stalks, then the fringe
  if (C.gills) fill(SCELLS.gills, (u, v) => (u < 0.5 ? mix(C.gills.stalk, C.gills.fringe, v * 0.3) : mix(C.gills.fringe, C.gills.stalk, (n1(u * 40, v * 6, 2) - 0.5) * 0.6 + 0.2)), 2);
  ctx.putImageData(image, 0, 0);

  // ---- spots and flecks over the body, in the cell's own pixels (squashed to be round on the body)
  {
    const [x0, y0, x1, y1] = box(SCELLS.body), w = x1 - x0, h = y1 - y0, S = built.surface.S;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
    for (const spec of C.spots || []) {
      for (let i = 0; i < spec.count; i += 1) {
        const t = r(), v = r(), q = built.surface.body(t, v);
        if (spec.where && !spec.where(q.s, q.a)) continue;
        // a dab a given share of the snout-to-vent length across, laid round a body whose girth here is q.round
        const size = (spec.size[0] + (spec.size[1] - spec.size[0]) * r()) * (w / S), squash = (h / Math.max(0.05, q.round)) / (w / S);
        dab(ctx, x0 + t * w, y0 + v * h, size, spec.colour, spec.alpha ?? 0.9, squash * (spec.long ? 1.8 : 1), r() * 0.4);
      }
    }
    ctx.restore();
  }
  // (the sheet is paint everywhere, between the cells too, so nothing of it is cut out: its smaller levels are the
  // GPU's own, which a cut-out's, kept by the brush to its coverage level by level, took most of the time to paint)
  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  void look;
  return { texture, canvas };
}
