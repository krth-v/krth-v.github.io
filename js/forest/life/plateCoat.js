import { makeCanvas, css, shift, mix, stroke, rng, cutoutTexture } from '../paint/brush.js';
import { PSHEET, PCELLS } from './plate.js';
import { pawCoat } from './parts/paw.js';

// The paint of a beast drawn as a plate (life/plate.js lays its cells out): gouache, in the order a painter lays it.
//   1. The masses: broad flat fields of colour, each with an edge that is the brush's, not a ruler's and not a blur.
//      `coat.rules`, in order: the last whose `where` holds paints a place. A rule is { colour, where(p) }: `where`
//      returns a share, 0..1 (true and false count as 1 and 0), and should rise across about a centimetre: a mass
//      has an edge. p is the place on the animal as it stands, on the body or on a limb alike, so that a colour
//      carries from the trunk onto the shoulder and the haunch that lie on it:
//        { x, y, z (metres), part: 'body' | 'limb', a (the body: how far round, 0 the belly .. 1 the back),
//          t (the body: the plate's ruler there), d (a limb: 0 its top .. 1 its foot), out (a limb: -1 its inner side
//          .. 1 its outer), front (a limb: -1 its back .. 1 its front), hind (a limb: true for a hind one) }
//   2. The form: a second and a third tone laid over the masses where the anatomy turns, each a flat shape.
//      `coat.planes`: [{ at: [x, y] on the side drawing, r: [rx, ry] (m), turn (degrees, optional), tone: + lighter
//      or - darker (1 a whole tone), part ('body' | 'fore' | 'hind', optional: where it may fall), soft (optional:
//      0 a hard shape .. 1 one that fades) }]: a hollow or a plane the surface itself does not have. Most of the form
//      needs none of them: it is taken from the surface, by how each place of it faces a light from above, a little
//      ahead and to its own side, cut into the same flat tones. `coat.turn`: { top, under }: how strongly what
//      faces that light is lightened, and what is turned from it darkened (1 and 1 if not given).
//      `coat.tones`: { light: [hue, saturation, lightness] added for a whole tone lighter, shade: the same, darker }.
//   3. Guard hairs: a few strokes dragged across the edges where two masses or two tones meet, the way the hair lies
//      (back along the body and down its sides, down the legs), and nowhere else. `coat.hair`: how many (0..1; 0.5 if
//      not given), and how long (m).
// No noise and no speckle: a field is flat, and what breaks it is a shape.
//   coat.ear { outer, inner, edge }, coat.tail { top, under } (a tail that is not in the outline), coat.antler,
//   coat.eye { iris, pupil }, coat.hoof (a hoof), coat.claw and coat.pad (a paw: life/parts/paw.js)
// Colours are [hue, saturation, lightness].

const [W, H] = PSHEET;

// a smooth noise in [0, 1] through space (metres), from a seed: for the wander of an edge, never for a surface
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
// hsl to rgb, 0..255
function rgb([h, s, l]) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const toHsl = ([R, G, B]) => {
  const r0 = R / 255, g0 = G / 255, b0 = B / 255, mx = Math.max(r0, g0, b0), mn = Math.min(r0, g0, b0), l = (mx + mn) / 2, d = mx - mn;
  if (d < 1e-6) return [0, 0, l * 100];
  const s = d / (1 - Math.abs(2 * l - 1)), h = mx === r0 ? ((g0 - b0) / d + 6) % 6 : mx === g0 ? (b0 - r0) / d + 2 : (r0 - g0) / d + 4;
  return [h * 60, s * 100, l * 100];
};
// two colours mixed as paint is, by their red, green and blue (mixed by hue, black into tan goes round through green)
const blend = (a, b, t) => { const p = rgb(a), q = rgb(b); return toHsl([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]); };
const D = Math.PI / 180;

export function paintPlate(sheet, built, look) {
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d'), C = sheet.coat, r = rng(sheet.seed ?? 211);
  const ragged = look.paint.ragged, n1 = noise3(sheet.seed ?? 211), n2 = noise3((sheet.seed ?? 211) + 17);
  const box = (cell) => [Math.floor(cell[0] * W), Math.floor(cell[1] * H), Math.ceil(cell[2] * W), Math.ceil(cell[3] * H)];
  const high = Math.max(...sheet.shape.plate.side.top.map((p) => p[2])), unit = high / 1.4;
  const tones = { light: [2, -4, 9], shade: [-3, 3, -9], ...(C.tones || {}) }, turn = { top: 1, under: 1, ...(C.turn || {}) };
  const planes = (C.planes || []).map((pl) => ({ ...pl, cos: Math.cos((pl.turn || 0) * D), sin: Math.sin((pl.turn || 0) * D) }));

  // the masses: the last rule that holds, each by its share
  const ruled = (p) => {
    let c = C.rules[0].colour;
    for (let k = 1; k < C.rules.length; k += 1) {
      const rule = C.rules[k], w = rule.where(p), s = w === true ? 1 : !w ? 0 : Math.max(0, Math.min(1, w));
      if (s > 0) c = s >= 1 ? rule.colour : blend(c, rule.colour, s);
    }
    return c;
  };
  // the form: how many tones lighter (+) or darker (-) a place is, before it is cut into flat shapes
  const formAt = (p) => {
    let f = 0;
    const limb = p.part === 'limb';
    for (const pl of planes) {
      if (pl.part && pl.part !== (limb ? (p.hind ? 'hind' : 'fore') : 'body')) continue;
      const dx = p.x - pl.at[0], dy = p.y - pl.at[1], u = (dx * pl.cos + dy * pl.sin) / pl.r[0], v = (-dx * pl.sin + dy * pl.cos) / pl.r[1], d2 = u * u + v * v;
      if (d2 < 1) f += pl.tone * 1.25 * (1 - d2);          // (one flat shape to a plane: a tone of 2 has a second inside it)
    }
    // (and the turn of the surface itself: how it faces a light from above, a little ahead and to its own side)
    const lit = p.lit ?? 0;
    return f + (lit > 0 ? lit * turn.top : lit * turn.under);
  };
  // How a surface faces that light, on a coarse lattice over its cell (the form is broad: it needs no more), read
  // back between the lattice's points. `at(u, v)` is a place on the surface, `inside(u, v)` a point within it there.
  const LIGHT = [0.26, 0.86, 0.44];
  const facing = (at, inside, nu, nv, columns = 1) => {
    const grid = new Float32Array((nu + 1) * (nv + 1)), e = 0.003;
    for (let j = 0; j <= nv; j += 1) for (let i = 0; i <= nu; i += 1) {
      // (within its own column of the cell: a limb's columns are four limbs)
      const col = Math.min(columns - 1, Math.floor((i / nu) * columns)), f = (i / nu) * columns - col;
      const u = (col + Math.min(1 - 3 * e, Math.max(e, f))) / columns, v = Math.min(1 - 2 * e, Math.max(e, j / nv));
      const P = at(u, v), px = P.x, py = P.y, pz = P.z, side = P.side ?? 1;
      const Q = at(u + e / columns, v), ax = Q.x - px, ay = Q.y - py, az = Q.z - pz;
      const R = at(u, v + e), bx = R.x - px, by = R.y - py, bz = R.z - pz;
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      const len = Math.hypot(nx, ny, nz) || 1, C = inside(u, v);
      nx /= len; ny /= len; nz /= len;
      if (nx * (px - C.x) + ny * (py - C.y) + nz * (pz - C.z) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      grid[j * (nu + 1) + i] = ((nx * LIGHT[0] + ny * LIGHT[1] + nz * side * LIGHT[2]) - 0.45) * 2.6;
    }
    return (u, v) => {
      const x = Math.min(nu - 1e-6, Math.max(0, u * nu)), y = Math.min(nv - 1e-6, Math.max(0, v * nv)), i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, w = nu + 1;
      return (grid[j * w + i] * (1 - fx) + grid[j * w + i + 1] * fx) * (1 - fy) + (grid[(j + 1) * w + i] * (1 - fx) + grid[(j + 1) * w + i + 1] * fx) * fy;
    };
  };
  // A place's paint: its mass's colour, taken a little way off along a slow wander (the brush's edge), then a tone
  // lighter or darker where the form is: flat fields, each with a soft-cut edge a few millimetres wide.
  const wander = 0.014 * unit, cut = (f) => { const s = Math.sign(f), x = Math.abs(f); return s * ((x > 0.5 ? Math.min(1, (x - 0.5) / 0.07) : 0) + (x > 1.5 ? Math.min(1, (x - 1.5) / 0.07) : 0)); };
  const _w = { x: 0, y: 0, z: 0 };
  const paintAt = (p) => {
    const k = 7 / unit, wx = (n1(p.x * k, p.y * k, p.z * k) - 0.5) * 2 * wander, wy = (n2(p.x * k, p.y * k, p.z * k) - 0.5) * 2 * wander;
    Object.assign(_w, p); _w.x = p.x + wx; _w.y = p.y + wy;
    const c = ruled(_w), t = cut(formAt(_w) + (n1(p.x * k * 0.45 + 9, p.y * k * 0.45, p.z * k * 0.45) - 0.5) * 0.8);
    if (t === 0) return c;
    const by = t > 0 ? tones.light : tones.shade, a = Math.abs(t);
    return shift(c, by[0] * a, by[1] * a, by[2] * a);
  };
  // Lays one cell from `colourAt(u, v)`, with a margin of 6 texels round it repeating its edge: worked out for every
  // STEP by STEP texels and drawn up smoothly (a field's edge is then a few texels wide: millimetres on the animal).
  const STEP = 3;
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

  // ---- the body, and the limbs (the whole sheet is first laid in the animal's ground colour: nothing of it is bare)
  ctx.fillStyle = css(C.rules[0].colour); ctx.fillRect(0, 0, W, H);
  const S = built.surface;
  const _c = { x: 0, y: 0, z: 0 };
  const litBody = facing(S.body, (u, v) => { const s = S.at(S.body(u, v).t); _c.x = s.cx; _c.y = s.cy; _c.z = 0; return _c; }, 200, 64);
  const litLimb = facing(S.limb, (u, v) => { const col = Math.min(3, Math.floor(u * 4)), q = S.limb((col + (u * 4 - col + 0.5) % 1) / 4, v), p = S.limb(u, v); _c.x = (p.x + q.x) / 2; _c.y = (p.y + q.y) / 2; _c.z = (p.z + q.z) / 2; return _c; }, 128, 48, 4);
  fill(PCELLS.body, (u, v) => { const p = S.body(u, v); p.lit = litBody(u, v); return paintAt(p); });
  fill(PCELLS.legs, (u, v) => { const p = S.limb(u, v); p.lit = litLimb(u, v); return paintAt(p); });
  // ---- the feet
  const footColour = (hind) => ruled({ ...S.limb(hind ? 0.875 : 0.375, 1), d: 1 });
  if (sheet.shape.paw) pawCoat(fill, { leg: ({ hind }) => footColour(hind), pad: C.pad, claw: C.claw }, PCELLS.foot);
  else fill(PCELLS.foot, (u, v) => (v < 0.08 ? mix(footColour(u >= 0.5), C.hoof, v / 0.08) : shift(C.hoof, 0, 0, v > 0.9 ? -3 : 4 * (1 - v))));
  // ---- the ears, the tail, the antlers, the eyes
  fill(PCELLS.ear, (u, v) => {
    const inner = u >= 0.5, across = Math.abs(((u % 0.5) / 0.5) * 2 - 1), up = 1 - v;
    if (across > 0.84 || up > 0.93) return C.ear.edge;
    if (!inner) return C.ear.outer;
    const bowl = (1 - across * across) * Math.sin(Math.PI * up);
    return bowl > 0.55 ? shift(C.ear.inner, -3, 4, -12) : C.ear.inner;
  });
  if (C.tail) fill(PCELLS.tail, (u, v) => (Math.abs(u - 0.5) < 0.22 ? C.tail.top : C.tail.under));
  if (C.antler) fill(PCELLS.antler, (u, v) => {
    // velvet: the tips of the beam and of every tine paler and rounder, the underside a tone darker
    const tip = Math.max(0, ((u % 0.61) / 0.61 - 0.72) / 0.28), under = Math.abs(v - 0.75) < 0.2 ? 1 : 0;
    return shift(mix(C.antler, shift(C.antler, 4, -4, 10), tip > 0.3 ? 1 : 0), 0, 0, -6 * under);
  });
  fill(PCELLS.eye, (u, v) => (Math.hypot(u - 0.5, v - 0.5) < 0.2 ? C.eye.pupil : C.eye.iris));

  // ---- guard hairs: strokes dragged across the edges where two fields meet, the way the hair lies
  const px = ctx.getImageData(0, 0, W, H).data;
  const sample = (x, y) => { const i = (Math.min(H - 1, Math.max(0, Math.round(y))) * W + Math.min(W - 1, Math.max(0, Math.round(x)))) * 4; return [px[i], px[i + 1], px[i + 2]]; };
  const hair = { count: 0.5, long: 0.045 * unit, ...(C.hair || {}) };
  const far = ([a, b, c], [d, e, f]) => Math.abs(a - d) + Math.abs(b - e) + Math.abs(c - f);
  const drag = (cell, tries, way, scale) => {
    // `way(u, v)`: the way the hair lies there, in texels (a unit vector); `scale`: texels to the metre along it
    const [x0, y0, x1, y1] = box(cell);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    for (let i = 0; i < tries; i += 1) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), [dx, dy] = way((x - x0) / (x1 - x0), (y - y0) / (y1 - y0)), len = hair.long * scale * (0.6 + 0.8 * r());
      const here = sample(x, y), there = sample(x + dx * len * 0.7, y + dy * len * 0.7);
      // (from well inside one field, across its edge into another: never from the edge's own mixed paint)
      if (far(here, there) < 34 || far(here, sample(x - dx * len * 0.5, y - dy * len * 0.5)) > 9) continue;
      const side = (r() - 0.5) * 0.5, c = toHsl(here);
      stroke(ctx, r, x - dx * len * 0.3, y - dy * len * 0.3, x + (dx + -dy * side) * len, y + (dy + dx * side) * len, Math.max(2.2, len * 0.16), c, { ragged, taperIn: 0.15, taperOut: 0.75, bend: (r() - 0.5) * 0.25, alpha: 0.95 });
    }
    ctx.restore();
  };
  const [bx0, by0, bx1, by1] = box(PCELLS.body), bodyLong = sheet.size || 1;
  // (the body's cell: back along the body is towards its left edge; down the sides is away from its middle line)
  drag(PCELLS.body, Math.round(9000 * hair.count), (u, v) => { const down = v < 0.5 ? -1 : 1, back = 0.55 + 0.25 * Math.abs(v - 0.5) * 2; return [-back, down * Math.sqrt(1 - back * back)]; }, (bx1 - bx0) / (bodyLong * 1.15));
  const [lx0, ly0, lx1, ly1] = box(PCELLS.legs);
  drag(PCELLS.legs, Math.round(5000 * hair.count), () => [0, 1], (ly1 - ly0) / (high * 0.95));
  void by0; void by1; void lx0; void lx1;
  // the eye's light
  { const cell = PCELLS.eye, x = (cell[0] + (cell[2] - cell[0]) * 0.4) * W, y = (cell[1] + (cell[3] - cell[1]) * 0.36) * H; ctx.fillStyle = css([210, 30, 88], 0.9); ctx.beginPath(); ctx.ellipse(x, y, 7, 5, -0.5, 0, Math.PI * 2); ctx.fill(); }

  // (r2-small, 2026-11-19: a bushy tail's brush and a rodent's small bits, for a sheet whose shape asks for them)
  if (sheet.shape.brush) paintBrush(ctx, sheet, r, ragged);
  if (C.bits) paintBits(ctx, C.bits, r);

  const texture = cutoutTexture(canvas, { anisotropy: 4 });
  return { texture, canvas };
}

// ==== r2-small (2026-11-19, the small mammals' agent). The paint of what life/plate.js `smallParts` builds:
//   coat.bush  { top, band, fringe, under, streak (optional) }: a bushy tail's brush, each [hue, saturation, lightness]:
//              its back, a dark band either side, the hairs' pale tips along its edges and past its end, its underside;
//              `streak` [colour, share]: long hairs of another colour laid along its back (a skunk's white)
//   coat.bits  { teeth, whiskers, cone, flake }
// The core (its cell `brush`) is laid flat, along the tail (u) and round it (v: 0.5 its back); the hair cards (cell
// `hair`, v across from one edge to the other) are cleared to nothing and drawn hair by hair, so that their edge is
// the hairs' own ragged ends (the material cuts what is not painted: life/material.js).
const boxOf = (cell) => [Math.floor(cell[0] * W), Math.floor(cell[1] * H), Math.ceil(cell[2] * W), Math.ceil(cell[3] * H)];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function paintBrush(ctx, sheet, r, ragged) {
  const B = sheet.coat.bush, core = sheet.shape.brush.core ?? 0.6;
  // the core: its back, the band either side, the tips along its edges, its underside; the end band and tips all round
  {
    const [x0, y0, x1, y1] = boxOf(PCELLS.brush), w = x1 - x0, h = y1 - y0, STEP = 3;
    const colour = (u, v) => {
      const off = Math.abs(v - 0.5) * 4;
      let c = B.top;
      c = mixc(c, B.band, sm(0.5, 0.75, off) * sm(0.04, 0.16, u));
      c = mixc(c, B.fringe, sm(0.85, 1.0, off) * (1 - sm(1.15, 1.35, off)) * sm(0.05, 0.2, u) * 0.6);
      c = mixc(c, B.under, sm(1.25, 1.5, off));
      return mixc(c, mixc(B.band, B.fringe, sm(0.94, 0.99, u)), sm(0.8, 0.92, u) * 0.85);
    };
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 6, y0 - 6, w + 12, h + 12); ctx.clip();
    for (let y = y0 - 6; y < y1 + 6; y += STEP) for (let x = x0 - 6; x < x1 + 6; x += STEP) {
      const u = Math.min(1, Math.max(0, (x + STEP / 2 - x0) / w)), v = Math.min(1, Math.max(0, (y + STEP / 2 - y0) / h));
      ctx.fillStyle = css(colour(u, v)); ctx.fillRect(x, y, STEP, STEP);
    }
    for (let i = 0; i < 1400; i += 1) {
      const u = r(), v = r(), x = x0 + u * w, y = y0 + v * h, len = 10 + r() * 20, out = (v < 0.5 ? -1 : 1) * (0.1 + 0.2 * r());
      const c = shift(colour(Math.min(1, u + len / w), Math.min(1, Math.max(0, v + out * len / h * 0.6))), (r() - 0.5) * 6, (r() - 0.5) * 8, (r() - 0.5) * 10);
      stroke(ctx, r, x, y, x + len, y + out * len * 0.6, 1.8, c, { ragged, taperIn: 0.1, taperOut: 0.75, bend: (r() - 0.5) * 0.3, alpha: 0.85 });
    }
    ctx.restore();
  }
  // the hair cards: nothing, then hair. Inside the core's edge (|v - 0.5| < core / 2) it is dense; out from there it
  // is locks of hair, each from inside the core out and back towards the tip, ending ragged short of the card's edge.
  {
    const [x0, y0, x1, y1] = boxOf(PCELLS.hair), w = x1 - x0, h = y1 - y0;
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 5, y0 - 5, w + 10, h + 10); ctx.clip();
    ctx.clearRect(x0 - 5, y0 - 5, w + 10, h + 10);
    const inner = core * 0.5 * 0.92;
    const at = (u, off) => mixc(mixc(B.top, B.band, sm(0.15, 0.6, off)), B.fringe, sm(0.62, 0.95, off));
    // (the dense middle)
    for (let k = 0; k < 900; k += 1) {
      const u = r() * 0.98, side = r() < 0.5 ? -1 : 1, v0 = 0.5 + side * r() * inner, len = (14 + r() * 26) * (w / 400);
      stroke(ctx, r, x0 + u * w, y0 + v0 * h, x0 + Math.min(1, u + len / w) * w, y0 + (v0 + side * 0.05) * h, 3.2, shift(at(u, Math.abs(v0 - 0.5) * 2), (r() - 0.5) * 6, 0, (r() - 0.5) * 8), { ragged, taperIn: 0.05, taperOut: 0.5, alpha: 0.95 });
    }
    // (the locks out to the edge: each lies out and back; most stop short of the edge, so that it is ragged)
    for (let k = 0; k < 1500; k += 1) {
      const u = r() * 0.97, side = r() < 0.5 ? -1 : 1, v0 = 0.5 + side * (inner * (0.4 + 0.6 * r()));
      const reach = (0.5 - Math.abs(v0 - 0.5)) * (0.55 + 0.5 * r()), tipward = u > 0.85 ? 0.25 + 3 * (u - 0.85) : 0.25;
      const dv = side * reach, du = (Math.abs(dv) * h * (0.9 + tipward * 2.2) * (0.7 + 0.6 * r())) / w;
      const tipOff = Math.min(1, Math.abs(v0 + dv - 0.5) * 2);
      const c0 = at(u, Math.abs(v0 - 0.5) * 2), c1 = at(Math.min(1, u + du), tipOff);
      const c = mixc(c0, c1, 0.6);
      stroke(ctx, r, x0 + u * w, y0 + v0 * h, x0 + Math.min(1.02, u + du) * w, y0 + (v0 + dv) * h, 1.6 + r() * 1.6, shift(c, (r() - 0.5) * 6, (r() - 0.5) * 6, (r() - 0.5) * 10), { ragged, taperIn: 0.08, taperOut: 0.85, bend: (r() - 0.5) * 0.35, alpha: 0.92 });
    }
    // (long hairs of another colour along its back: a skunk's white)
    if (B.streak) for (let k = 0; k < 500 * B.streak[1]; k += 1) {
      const u = 0.05 + r() * 0.75, side = r() < 0.5 ? -1 : 1, v0 = 0.5 + side * r() * inner * 0.8, dv = side * (0.1 + 0.3 * r());
      stroke(ctx, r, x0 + u * w, y0 + v0 * h, x0 + Math.min(1, u + 0.06 + 0.1 * r()) * w, y0 + (v0 + dv) * h, 1.4 + r(), shift(B.streak[0], 0, 0, (r() - 0.5) * 8), { ragged, taperIn: 0.1, taperOut: 0.8, bend: (r() - 0.5) * 0.3, alpha: 0.9 });
    }
    ctx.restore();
  }
}
function paintBits(ctx, K, r) {
  const [x0, y0, x1, y1] = boxOf(PCELLS.bits), w = (x1 - x0) / 4, h = y1 - y0;
  const cell = (k) => { if (k) ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(x0 + k * w - (k === 0 ? 4 : 0), y0 - 4, w + (k === 0 ? 4 : 0) + (k === 3 ? 4 : 0), h + 8); ctx.clip(); return [x0 + k * w, y0, w, h]; };
  { const [x, y, cw, ch] = cell(0); ctx.fillStyle = css(K.teeth); ctx.fillRect(x - 4, y - 4, cw + 8, ch + 8); ctx.fillStyle = css(shift(K.teeth, 0, -30, 22)); ctx.fillRect(x - 4, y + ch * 0.75, cw + 8, ch * 0.25 + 4); }
  { const [x, y, cw, ch] = cell(1); for (let k = 0; k < 8; k += 1) { ctx.fillStyle = css(mix(K.whiskers, shift(K.whiskers, 0, -5, 35), k / 8)); ctx.fillRect(x - 4 + (k * (cw + 8)) / 8, y - 4, (cw + 8) / 8 + 1, ch + 8); } }
  { const [x, y, cw, ch] = cell(2); ctx.fillStyle = css(shift(K.cone, 0, -6, -10)); ctx.fillRect(x - 4, y - 4, cw + 8, ch + 8);
    for (let row = 0; row < 14; row += 1) for (let k = 0; k < 6; k += 1) {
      const cx = x + ((k + (row % 2) * 0.5) / 6) * cw, cy = y + (row / 13) * ch;
      ctx.fillStyle = css(shift(K.cone, (r() - 0.5) * 6, 0, (r() - 0.5) * 8)); ctx.beginPath(); ctx.ellipse(cx, cy, cw / 13, ch / 30, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css(shift(K.cone, 0, 6, 12), 0.8); ctx.beginPath(); ctx.ellipse(cx, cy + ch / 70, cw / 16, ch / 80, 0, 0, Math.PI * 2); ctx.fill();
    } }
  { const [x, y, cw, ch] = cell(3); ctx.fillStyle = css(K.flake); ctx.fillRect(x - 4, y - 4, cw + 8, ch + 8); ctx.fillStyle = css(shift(K.flake, 0, 0, -12)); ctx.fillRect(x - 4, y + ch * 0.7, cw + 8, ch * 0.3 + 4); }
  ctx.restore();
}
