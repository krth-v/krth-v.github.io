import { rng, makeCanvas, css, shift, mix, vary, stroke, dab, cutoutTexture, cutoutTextureSteps, drainSteps, tileTexture, normalMapFromHeight } from './brush.js';

// The painted textures: bark, bough and frond cut-outs, ground. Each takes a
// `look` (js/forest/looks/*.js) for its palette and brush behaviour, and returns
// { texture, canvas } (bark also returns a normal map).

// ---------- tiling noise (for bark and ground mottling) ----------
function lattice(seed, px, py) {
  const table = new Float32Array(px * py), r = rng(seed);
  for (let i = 0; i < table.length; i += 1) table[i] = r();
  return (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const x0 = ((ix % px) + px) % px, x1 = (x0 + 1) % px, y0 = ((iy % py) + py) % py, y1 = (y0 + 1) % py;
    const a = table[y0 * px + x0], b = table[y0 * px + x1], c = table[y1 * px + x0], d = table[y1 * px + x1];
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };
}

// ---------- bark ----------
// Painted the way one would in gouache: a dark warm ground for the furrows,
// one long stroke for each ridge plate, staggered from column to column so the
// furrows braid between them, then dry-brushed lights along the plates and
// short dark cracks across them. The same strokes in grey on black are the
// relief the normal map is made from.
const BARK = {
  // Douglas-fir: thick corky ridges a hand's width across, long, with deep furrows
  fir:     { columns: 7,  plate: [260, 640], fill: 1.0,  taper: 0.2,  wander: 0.45, cracks: 0.3, lights: 3, slivers: 26, fibre: 0.14, depth: 3.6 },
  // western hemlock: thinner bark in narrow, flat, scaly ridges
  hemlock: { columns: 15, plate: [80, 240],  fill: 0.9,  taper: 0.16, wander: 0.3,  cracks: 1.3, lights: 2, slivers: 40, fibre: 0.2,  depth: 2.2 },
  // western redcedar: thin, stringy bark in strips a few fingers wide that run a long way up the trunk, hardly cracked across
  cedar:   { columns: 20, plate: [380, 900], fill: 0.84, taper: 0.1,  wander: 0.2,  cracks: 0.06, lights: 3, slivers: 64, fibre: 0.32, depth: 2.6 },
};

// Soften a wrapping height field in place (two passes of a box blur).
function blurWrapped(field, w, h, radius) {
  // (the same sums in the same order as a read through `% w` and `% h` at every tap: the wrap is laid out once)
  const tmp = new Float32Array(field.length), span = 2 * radius + 1, row = new Float32Array(w + 2 * radius), rows = new Int32Array(h + 2 * radius);
  for (let y = -radius; y < h + radius; y += 1) rows[y + radius] = ((y + h) % h) * w;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let y = 0; y < h; y += 1) {
      const o = y * w;
      for (let x = -radius; x < w + radius; x += 1) row[x + radius] = field[o + ((x + w) % w)];
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        for (let k = 0; k < span; k += 1) sum += row[x + k];
        tmp[o + x] = sum / span;
      }
    }
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        let sum = 0;
        for (let k = 0; k < span; k += 1) sum += tmp[rows[y + k] + x];
        field[y * w + x] = sum / span;
      }
    }
  }
}

export function barkTextures(kind, look) {
  const W = 512, H = 1024, spec = BARK[kind], pal = look.palette[`${kind}Bark`];
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d');
  const relief = makeCanvas(W, H), rtx = relief.getContext('2d', { willReadFrequently: true });
  const r = rng(7 + kind.length * 13), warp = lattice(23 + kind.length, 3, 4), tone = lattice(41, 3, 4), fibre = lattice(31, 64, 12);
  ctx.fillStyle = css(pal.furrow); ctx.fillRect(0, 0, W, H);
  rtx.fillStyle = '#000'; rtx.fillRect(0, 0, W, H);

  // draw at every wrapped copy that reaches the tile, so the sheet repeats
  const wrapped = (x0, y0, x1, y1, margin, draw) => {
    for (const dx of [-W, 0, W]) {
      if (Math.max(x0, x1) + dx < -margin || Math.min(x0, x1) + dx > W + margin) continue;
      for (const dy of [-H, 0, H]) {
        if (Math.max(y0, y1) + dy < -margin || Math.min(y0, y1) + dy > H + margin) continue;
        draw(dx, dy);
      }
    }
  };
  // One stroke on the painting and, when `grey` is given, on the relief. Both
  // use the same seed, so their ragged edges match exactly.
  let serial = 0;
  const lay = (x0, y0, x1, y1, width, colour, grey, { reliefAlpha = 1, ...opts }) => {
    const seed = 5000 + (serial += 1);
    wrapped(x0, y0, x1, y1, width, (dx, dy) => {
      stroke(ctx, rng(seed), x0 + dx, y0 + dy, x1 + dx, y1 + dy, width, colour, opts);
      if (grey !== null) stroke(rtx, rng(seed), x0 + dx, y0 + dy, x1 + dx, y1 + dy, width, [0, 0, grey], { ...opts, alpha: reliefAlpha });
    });
  };

  // the furrow ground is not flat: warmer and darker patches
  for (let i = 0; i < 150; i += 1) {
    const x = r() * W, y = r() * H, rad = 30 + r() * 70, squash = 0.5 + r() * 0.5, angle = r() * 3;
    const c = vary(shift(pal.furrow, 0, 8 * r(), (r() - 0.5) * 7), r, look.paint.vary);
    wrapped(x, y, x, y, rad, (dx, dy) => dab(ctx, x + dx, y + dy, rad, c, 0.6, squash, angle));
  }

  const cw = W / spec.columns;
  // slivers: thin secondary ridges that show only where the plates leave a gap
  for (let i = 0; i < spec.slivers; i += 1) {
    const x = r() * W, y = r() * H, len = 50 + r() * 170;
    lay(x, y, x + (r() - 0.5) * 14, y + len, cw * (0.16 + r() * 0.2), vary(mix(pal.furrow, pal.face, 0.5 + r() * 0.5), r, look.paint.vary * 0.6), 35 + 30 * r(),
      { ragged: 0.4, taperIn: 0.3, taperOut: 0.4 });
  }

  // ridge plates: each column is a chain of long strokes whose centre line wanders
  const centre = (c, y) => (c + 0.5) * cw + (warp((c / spec.columns) * 3, (y / H) * 4) - 0.5) * 2 * spec.wander * cw;
  for (let c = 0; c < spec.columns; c += 1) {
    const lengths = [];
    let total = 0;
    while (total < H) { const l = spec.plate[0] + r() * (spec.plate[1] - spec.plate[0]); lengths.push(l); total += l; }
    let y = r() * H;
    for (const raw of lengths) {
      const len = (raw * H) / total, y0 = y, y1 = y + len;        // the chain closes on itself after one tile
      y = y1;
      const x0 = centre(c, y0), x1 = centre(c, y1), bow = centre(c, (y0 + y1) / 2) - (x0 + x1) / 2;
      const at = (k) => [x0 + (x1 - x0) * k + Math.sin(Math.PI * k) * bow, y0 + len * k];
      const width = cw * spec.fill * (0.82 + r() * 0.36);
      const light = Math.min(1, Math.max(0, 0.2 + 0.6 * tone((c / spec.columns) * 3, (y0 / H) * 4) + (r() - 0.5) * 0.3));
      const bend = -bow / len;
      // each plate overlaps the next a little, so a ridge narrows instead of ending
      const [xs, ys] = at(-0.05), [xe, ye] = at(1.05);
      lay(xs, ys, xe, ye, width, vary(mix(pal.face, pal.ridge, light), r, look.paint.vary * 0.6), 70 + 30 * r(),
        { bend, ragged: 0.07, lumpy: 0.16, taperIn: spec.taper * (0.7 + r() * 0.6), taperOut: spec.taper * (0.7 + r() * 0.6) });
      // short dry-brushed lights down one flank and darker drags down the other, so a plate has a turned form
      for (let k = 0; k < spec.lights * 2; k += 1) {
        const pale = k % 2 === 0, from = 0.08 + r() * 0.55, span = 0.14 + r() * 0.26;
        const [xa, ya] = at(from), [xb, yb] = at(Math.min(0.95, from + span));
        const off = width * ((pale ? -0.24 : 0.27) + (r() - 0.5) * 0.2);
        const colour = pale ? shift(pal.ridge, 0, -3, 3 + 7 * r()) : shift(pal.face, 0, 2, -5 - 4 * r());
        lay(xa + off, ya, xb + off, yb, width * (0.08 + r() * 0.14), colour, null, { bend, ragged: 0.25, taperIn: 0.3, taperOut: 0.5, alpha: 0.45 + 0.3 * r() });
      }
      // cracks across it
      const cracks = Math.floor(spec.cracks * (len / 100) + r());
      for (let k = 0; k < cracks; k += 1) {
        const [xc, yc] = at(0.15 + r() * 0.7), half = width * (0.25 + r() * 0.25), slant = (r() - 0.5) * width * 0.7;
        lay(xc - half, yc - slant / 2, xc + half, yc + slant / 2, 3 + r() * 4, shift(pal.furrow, 0, 0, -2), 12,
          { ragged: 0.5, taperIn: 0.3, taperOut: 0.3, reliefAlpha: 0.85 });
      }
    }
  }

  // pale lichen touches, then the drag of a nearly dry brush over everything
  for (let i = 0; i < 70; i += 1) {
    const x = r() * W, y = r() * H, rad = 4 + r() * 9, squash = 0.6 + r() * 0.4, angle = r() * 3, c = shift(pal.ridge, 45, -4, 12 + 8 * r());
    wrapped(x, y, x, y, rad, (dx, dy) => dab(ctx, x + dx, y + dy, rad, c, 0.35, squash, angle));
  }
  for (let i = 0; i < 500; i += 1) {
    const x = r() * W, y = r() * H, len = 30 + r() * 120, lean = (r() - 0.5) * 6, width = 1.5 + r() * 3.5;
    const c = r() < 0.5 ? shift(pal.ridge, 0, -4, 6 * r()) : shift(pal.furrow, 0, 0, -3 * r());
    lay(x, y, x + lean, y + len, width, c, null, { alpha: 0.2 * look.paint.streak });
  }

  const data = rtx.getImageData(0, 0, W, H).data, height = new Float32Array(W * H);
  for (let i = 0; i < W * H; i += 1) height[i] = data[i * 4] / 255;
  blurWrapped(height, W, H, 2);                                   // plate edges become slopes
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) height[y * W + x] = height[y * W + x] * (1 - spec.fibre) + spec.fibre * fibre((x / W) * 64, (y / H) * 12);
  }
  return { texture: tileTexture(canvas), normal: normalMapFromHeight(height, W, H, spec.depth), canvas };
}

// ---------- conifer boughs ----------
// Eight boughs in a 2 x 4 sheet. Each is a branch seen flat: a twig from the
// left edge to a tip on the right, side twigs carrying needles. The card that
// carries it is laid along a branch, so the left edge is the attachment.
const BOUGH = {
  // Douglas-fir: needles all round the twig, bristly; boughs level and dense.
  fir:     { twigs: 13, reach: 0.4,  lean: 0.9,  needle: 9, rank: 0.7, droop: 0.03, sub: 4, tips: 0.3,  body: 0.9 },
  // Western hemlock: short needles in two flat ranks; lacy sprays that nod at the tip.
  hemlock: { twigs: 19, reach: 0.36, lean: 1.05, needle: 5, rank: 1.2, droop: 0.1,  sub: 6, tips: 0.55, body: 0.6 },
};
export function boughAtlas(kind, look, detail = 1) { return drainSteps(boughAtlasSteps(kind, look, detail)); }
export function* boughAtlasSteps(kind, look, detail = 1) {
  const CW = 512, CH = 256, canvas = makeCanvas(CW * 2 * detail, CH * 4 * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  const spec = BOUGH[kind], pal = look.palette[`${kind}Needle`], opts = { ragged: look.paint.ragged };
  ctx.lineCap = 'round';
  for (let cell = 0; cell < 8; cell += 1) {
    const r = rng(300 + cell * 17 + kind.length), ox = (cell % 2) * CW, oy = Math.floor(cell / 2) * CH;
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, CW, CH); ctx.clip();
    const droop = spec.droop * (0.6 + r() * 0.8);
    const x0 = ox + 6, y0 = oy + CH * (0.5 - droop * 0.9), length = CW * (0.74 + r() * 0.08);
    const spine = (t) => [x0 + length * t, y0 + CH * droop * t * t * 2.0];      // sags towards the tip
    const margin = spec.needle * 1.5 + 5;                                      // a needle's length, and the brush's width
    // One needled twig from a to b: a dark body, then needles in two tones.
    const twig = (ax, ay, bx, by, size, fresh) => {
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      stroke(ctx, r, ax, ay, bx, by, size * 1.5 * spec.body, vary(pal.dark, r, look.paint.vary), { ...opts, taperIn: 0.1, taperOut: 0.6 });
      const count = Math.round(len / 2.4);
      for (let pass = 0; pass < 2; pass += 1) {
        for (let i = 0; i < count; i += 1) {
          const t = (i + r()) / count, px = ax + dx * t, py = ay + dy * t, taper = 1 - 0.55 * t * t;
          for (const side of [-1, 1]) {
            const a = Math.atan2(uy, ux) + side * (spec.rank * (0.75 + r() * 0.5));
            const l = size * taper * (0.75 + r() * 0.5);
            const c = pass === 0 ? vary(pal.mid, r, look.paint.vary)
              : vary(r() < fresh ? pal.tip : pal.light, r, look.paint.vary);
            if (pass === 1 && r() < 0.45) continue;                       // the light pass is sparser, like a top glaze
            ctx.strokeStyle = css(c, pass === 0 ? 0.95 : 0.9);
            ctx.lineWidth = (pass === 0 ? 1.9 : 1.3);
            ctx.beginPath(); ctx.moveTo(px, py - (pass ? 0.8 : 0)); ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l - (pass ? 0.8 : 0)); ctx.stroke();
          }
        }
      }
    };
    for (let i = 0; i < spec.twigs; i += 1) {
      const t = 0.05 + 0.92 * (i + r() * 0.6) / spec.twigs;
      const [sx, sy] = spine(t);
      // side twigs are longest about a quarter of the way out and shorten to the tip
      const reach = CH * spec.reach * Math.pow(1 - t, 0.7) * Math.min(1, 0.3 + t / 0.14) * (0.8 + r() * 0.35);
      const fresh = t > 1 - spec.tips ? 0.5 : 0.12;
      for (const side of [-1, 1]) {
        if (r() < 0.07) continue;
        const angle = side * (spec.lean + (r() - 0.5) * 0.3);
        // A side twig stops short of the cell's edge. One that ran past it was cut off straight by the cell,
        // and the card that carries the bough showed the cut as a ruled edge across the needles.
        const room = (side > 0 ? oy + CH - margin - sy : sy - oy - margin) - side * CH * droop * 0.1;
        const far = Math.min(reach, Math.max(room, 0) / Math.abs(Math.sin(angle)));
        const ex = sx + Math.cos(angle) * far, ey = sy + Math.sin(angle) * far + CH * droop * 0.1;
        twig(sx, sy, ex, ey, spec.needle, fresh);
        for (let j = 1; j <= spec.sub; j += 1) {                              // twiglets off the side twig
          const k = j / (spec.sub + 1), px = sx + (ex - sx) * k, py = sy + (ey - sy) * k;
          const a2 = angle - side * (0.7 + r() * 0.3), l2 = far * 0.36 * (1 - k * 0.55);
          twig(px, py, px + Math.cos(a2) * l2, py + Math.sin(a2) * l2, spec.needle * 0.85, fresh);
        }
      }
    }
    const [tx, ty] = spine(1.04);
    twig(...spine(0.86), tx, ty, spec.needle, 0.6);
    ctx.lineWidth = 2.5; ctx.strokeStyle = css(look.palette.twig, 0.9);
    ctx.beginPath(); ctx.moveTo(x0 - 6, y0);
    for (let t = 0.05; t <= 0.7; t += 0.05) ctx.lineTo(...spine(t));
    ctx.stroke();
    ctx.restore();
  }
  yield 'painted';
  return { texture: yield* cutoutTextureSteps(canvas), canvas, cells: [2, 4] };
}

// ---------- western redcedar sprays ----------
// A redcedar has no needles: its twigs are flat straps of scales that fork and fork again into sprays, and the
// sprays hang. Painted as one frond to a card, as the fir's and the hemlock's boughs are, the tree was hung
// with the leaves of a giant fern. What the eye knows a cedar by is the fringe: under every limb a row of
// branchlets hanging like tassels, each a drooping feather of sprays, with the sky between their ends.
// Eight cells in a 2 x 4 sheet. The first six (`fringe`) are a length of limb along the top of the cell, left
// to right, with its fringe hanging to the cell's foot: the card that carries one stands on edge under the
// limb. The last two (`frond`) are a branch end seen flat, attached at the middle of the left edge.
export function cedarAtlas(look, detail = 1) { return drainSteps(cedarAtlasSteps(look, detail)); }
export function* cedarAtlasSteps(look, detail = 1) {
  const CW = 512, CH = 256, canvas = makeCanvas(CW * 2 * detail, CH * 4 * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  const pal = look.palette.cedarNeedle, opts = { ragged: look.paint.ragged };
  ctx.lineCap = 'round';
  for (let cell = 0; cell < 8; cell += 1) {
    const r = rng(900 + cell * 31), ox = (cell % 2) * CW, oy = Math.floor(cell / 2) * CH, PAD = 7;
    ctx.save();
    ctx.beginPath(); ctx.rect(ox, oy, CW, CH); ctx.clip();
    const inside = (x, y) => x > ox + PAD && x < ox + CW - PAD && y > oy + PAD && y < oy + CH - PAD;
    // A flat spray of scales: a strap from (x, y) along `angle`, which forks to either side by turns, each fork
    // a shorter strap that forks again. The straps of the last order are the light ones: the spray's own edge.
    const spray = (x, y, angle, length, width, order, fresh) => {
      const ex = x + Math.cos(angle) * length, ey = y + Math.sin(angle) * length;
      if (!inside(ex, ey)) return;                                   // nothing is cut off by its cell: a cut shows as a ruled edge on the card
      const colour = order >= 2 ? pal.dark : order === 1 ? pal.mid : (r() < fresh ? pal.tip : pal.light);
      stroke(ctx, r, x, y, ex, ey, width, vary(colour, r, look.paint.vary), { ...opts, bend: (r() - 0.5) * 0.25, taperIn: 0.2, taperOut: 0.6 });
      if (order === 0) return;
      const forks = 2 + Math.floor(length / 11);
      for (let k = 0; k < forks; k += 1) {
        const t = 0.22 + 0.7 * (k + r() * 0.5) / forks, hand = k % 2 ? 1 : -1;
        spray(x + (ex - x) * t, y + (ey - y) * t, angle + hand * (0.55 + 0.3 * r()), length * (0.68 - 0.3 * t) * (0.85 + 0.3 * r()), width * 0.82, order - 1, fresh);
      }
      if (order === 1) spray(ex, ey, angle + (r() - 0.5) * 0.3, length * 0.45, width * 0.8, 0, fresh);         // its own end
    };
    // A branchlet: a thin stem from (x, y) that sets out along `angle`, `reach` long, turning by `turn` on the
    // way, with sprays to either side of it all the way down and one at its end.
    const branchlet = (x, y, angle, reach, turn, size, fresh) => {
      const steps = Math.max(3, Math.round(reach / 13));
      let px = x, py = y;
      ctx.strokeStyle = css(look.palette.twig, 0.85); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px, py);
      const stations = [];
      for (let k = 1; k <= steps; k += 1) {
        const a = angle + turn * (k / steps) * (k / steps);
        px += Math.cos(a) * (reach / steps); py += Math.sin(a) * (reach / steps);
        if (!inside(px, py)) break;
        ctx.lineTo(px, py);
        stations.push([px, py, a, k / steps]);
      }
      ctx.stroke();
      for (const [sx, sy, a, t] of stations) {
        for (const hand of [-1, 1]) {
          if (r() < 0.12) continue;
          spray(sx, sy, a + hand * (0.75 + 0.3 * r()), size * (1.05 - 0.45 * t) * (0.8 + 0.4 * r()), 4.4, 2, t > 0.55 ? fresh : fresh * 0.4);
        }
      }
      const last = stations[stations.length - 1];
      if (last) spray(last[0], last[1], last[2], size * 0.7, 4.2, 2, fresh);
    };
    if (cell < 6) {
      // the limb along the top, sagging a little towards its end, and its fringe
      const x0 = ox + 2, y0 = oy + CH * (0.1 + 0.04 * r()), fall = CH * (0.05 + 0.05 * r());
      const limb = (t) => [x0 + (CW - 4) * t, y0 + fall * t * t];
      const count = 10 + Math.floor(r() * 4);
      for (let k = 0; k < count; k += 1) {
        const t = 0.03 + 0.93 * (k + 0.2 + 0.6 * r()) / count, [sx, sy] = limb(t);
        // a tassel hangs nearly straight down, its end swinging a little way on along the limb
        const reach = (CH * 0.86 - (sy - oy)) * (0.55 + 0.45 * r()) * (k % 3 === 2 ? 0.7 : 1);
        branchlet(sx, sy, 1.5 + (r() - 0.5) * 0.35, reach, -0.25 - 0.35 * r(), 21 + 7 * r(), 0.35);
        // and what grows from the limb's back, short and forward
        if (k % 2 === 0) spray(sx, sy, -0.75 - 0.4 * r(), 17 + 8 * r(), 4.2, 2, 0.3);
      }
      ctx.lineWidth = 3.2; ctx.strokeStyle = css(look.palette.twig, 0.95);
      ctx.beginPath(); ctx.moveTo(x0 - 2, y0);
      for (let t = 0.04; t <= 1.001; t += 0.04) ctx.lineTo(...limb(t));
      ctx.stroke();
    } else {
      // a branch end, flat: a spine that droops to its tip, branchlets to either side that shorten towards it
      const x0 = ox + 4, y0 = oy + CH * 0.4, length = CW * (0.84 + 0.05 * r());
      const spine = (t) => [x0 + length * t, y0 + CH * 0.22 * t * t];
      const count = 17;
      for (let k = 0; k < count; k += 1) {
        const t = 0.03 + 0.9 * (k + 0.5 * r()) / count, [sx, sy] = spine(t), hand = k % 2 ? 1 : -1;
        const reach = CH * 0.47 * Math.pow(1 - t, 0.55) * Math.min(1, 0.4 + t / 0.16) * (0.85 + 0.3 * r());
        branchlet(sx, sy, hand * (0.9 + 0.2 * r()) + 0.12, reach, -hand * 0.3, 24 + 7 * r(), t > 0.5 ? 0.5 : 0.25);
      }
      const [tx, ty] = spine(0.96);
      branchlet(tx, ty, 0.4, CH * 0.16, 0.2, 20, 0.5);
      ctx.lineWidth = 2.6; ctx.strokeStyle = css(look.palette.twig, 0.9);
      ctx.beginPath(); ctx.moveTo(x0 - 4, y0);
      for (let t = 0.05; t <= 0.9; t += 0.05) ctx.lineTo(...spine(t));
      ctx.stroke();
    }
    ctx.restore();
  }
  yield 'painted';
  return { texture: yield* cutoutTextureSteps(canvas), canvas, cells: [2, 4], fringe: [0, 1, 2, 3, 4, 5], frond: [6, 7] };
}

// ---------- sword fern fronds ----------
// Four fronds side by side, base at the bottom. Sword fern is once-pinnate:
// simple, pointed leaflets in two ranks, longest a third of the way up.
export function fernAtlas(look, detail = 1) {
  const CW = 128, CH = 512, canvas = makeCanvas(CW * 4 * detail, CH * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  const pal = look.palette.fern, opts = { ragged: look.paint.ragged };
  for (let cell = 0; cell < 4; cell += 1) {
    const r = rng(500 + cell * 13), ox = cell * CW, cx = ox + CW / 2, old = cell === 3;      // the last one is a spent, browning frond
    ctx.save(); ctx.beginPath(); ctx.rect(ox, 0, CW, CH); ctx.clip();
    // Leaflets wide enough to touch near the stem, so the frond reads as one
    // toothed blade from a few metres off and as leaflets close to.
    const pairs = 26, pitch = (CH * 0.95) / pairs;
    for (let i = 0; i < pairs; i += 1) {
      const t = (i + 0.5) / pairs, y = CH * (0.985 - 0.95 * t);
      // longest a fifth of the way up, shortening steadily to a pointed tip
      const len = CW * 0.47 * Math.min(1, 0.5 + t * 2.5) * Math.pow(1 - t, 0.55) * (0.94 + r() * 0.1) + 2;
      const width = pitch * (0.9 + 0.25 * (1 - t));
      for (const side of [-1, 1]) {
        const rise = len * (0.14 + 0.2 * t);
        let c = mix(pal.dark, pal.mid, 0.3 + r() * 0.6);
        if (old) c = mix(c, look.palette.fernOld, 0.75);
        stroke(ctx, r, cx, y, cx + side * len, y - rise, width, vary(c, r, look.paint.vary), { ...opts, taperIn: 0.05, taperOut: 0.7, bend: -side * 0.05 });
        if (!old && r() < 0.75) {
          stroke(ctx, r, cx + side * len * 0.12, y - rise * 0.15 - width * 0.16, cx + side * len * 0.88, y - rise * 0.92 - width * 0.1, width * 0.34,
            vary(pal.light, r, look.paint.vary), { ...opts, taperIn: 0.3, taperOut: 0.8, alpha: 0.85 });
        }
      }
    }
    ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = css(old ? look.palette.fernOld : pal.stem, 0.95);
    ctx.beginPath(); ctx.moveTo(cx, CH); ctx.lineTo(cx, CH * 0.04); ctx.stroke();
    ctx.restore();
  }
  return { texture: cutoutTexture(canvas), canvas, cells: [4, 1] };
}

// ---------- skunk cabbage ----------
// Four leaves side by side, each on its short thick stalk at the bottom: two broad ones, one of them eaten
// into by slugs, a narrower one, and a young one still half rolled. A leaf is a blade as long as a forearm
// or an arm, widest below its middle, with a pale midrib as thick as a thumb and side veins that leave it
// at half a right angle and curve towards the tip; the strips between the veins catch the light by turns.
// In May the plant is all leaf: its yellow hoods are over by the middle of the month.
export function skunkAtlas(look, detail = 1) {
  const CW = 256, CH = 512, canvas = makeCanvas(CW * 4 * detail, CH * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  const pal = look.palette.skunk, opts = { ragged: look.paint.ragged };
  const leaf = (cell, seed, { broad, point, low, bites = 0, young = false }) => {
    const r = rng(seed), ox = cell * CW, cx = ox + CW / 2, STALK = 0.1, top = CH * 0.02, foot = CH + 2;
    const yAt = (t) => foot + (top - foot) * t;
    // half its width, a share t of the way from the foot of its stalk to its tip
    const phase = [r() * 6.3, r() * 6.3];
    const half = (t) => {
      if (t < STALK) return 7 + 5 * (t / STALK);
      const u = (t - STALK) / (1 - STALK), blade = Math.pow(Math.sin(Math.PI * Math.pow(u, low)), point);
      return Math.max(4, CW * broad * blade * (1 + 0.04 * Math.sin(u * 21 + phase[0]) + 0.025 * Math.sin(u * 53 + phase[1])));
    };
    const outline = () => {
      const N = 64;
      ctx.beginPath();
      for (let i = 0; i <= N; i += 1) { const t = i / N; if (i === 0) ctx.moveTo(cx - half(t), yAt(t)); else ctx.lineTo(cx - half(t), yAt(t)); }
      for (let i = N; i >= 0; i -= 1) { const t = i / N; ctx.lineTo(cx + half(t), yAt(t)); }
      ctx.closePath();
    };
    ctx.save(); ctx.beginPath(); ctx.rect(ox + 2, 0, CW - 4, CH); ctx.clip();
    outline(); ctx.clip();
    const body = young ? mix(pal.mid, pal.light, 0.6) : pal.mid;
    ctx.fillStyle = css(body); ctx.fillRect(ox, 0, CW, CH);
    // the strips between the veins: each a stroke from the midrib out and up to the edge, light and dark by turns,
    // and the half of the blade towards the light the lighter of the two
    const veins = young ? 7 : 11;
    for (let i = 0; i < veins; i += 1) {
      const t = STALK + (1 - STALK) * ((i + 0.35) / veins) * 0.9, reach = half(Math.min(0.97, t + 0.1)) * 1.25 + 6, rise = reach * (0.75 + 0.5 * (i / veins));
      const width = ((1 - STALK) * CH * 0.9) / veins * 0.78;
      for (const side of [-1, 1]) {
        // (light and dark as far apart as the palette's own, the leaf was a striped house plant: a skunk cabbage is one green)
        const tone = (i + (side > 0 ? 1 : 0)) % 2 ? mix(body, pal.light, 0.14 + 0.16 * r()) : mix(body, pal.dark, 0.04 + 0.1 * r());
        stroke(ctx, r, cx + side * 3, yAt(t), cx + side * reach, yAt(t) - rise, width, vary(shift(tone, 0, 0, side < 0 ? 3 : -3), r, look.paint.vary * 0.5),
          { ...opts, bend: side * 0.1, taperIn: 0.04, taperOut: 0.5, ragged: 0.1 });
      }
    }
    // the veins themselves, fine and pale, and the dark of the fold beside the midrib
    ctx.lineCap = 'round';
    for (let i = 0; i < veins; i += 1) {
      const t = STALK + (1 - STALK) * ((i - 0.1) / veins) * 0.9 + 0.01, reach = half(Math.min(0.97, t + 0.1)) * 1.1, rise = reach * (0.75 + 0.5 * (i / veins));
      for (const side of [-1, 1]) {
        ctx.strokeStyle = css(mix(pal.rib, pal.light, 0.5), 0.5); ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(cx, yAt(t)); ctx.quadraticCurveTo(cx + side * reach * 0.6, yAt(t) - rise * 0.45, cx + side * reach, yAt(t) - rise); ctx.stroke();
      }
    }
    stroke(ctx, r, cx + 5, yAt(STALK * 0.6), cx + 3, yAt(0.9), young ? 9 : 12, mix(pal.dark, body, 0.35), { ...opts, taperIn: 0.05, taperOut: 0.9, ragged: 0.06, alpha: 0.7 });
    stroke(ctx, r, cx, yAt(0), cx, yAt(0.95), young ? 8 : 11, pal.rib, { ...opts, taperIn: 0.01, taperOut: 0.95, ragged: 0.05 });
    stroke(ctx, r, cx, yAt(0), cx, yAt(STALK * 1.25), 15, pal.stalk, { ...opts, taperIn: 0.01, taperOut: 0.35, ragged: 0.05 });
    ctx.restore();
    // what the slugs have had of it: holes, and bites out of its edge
    if (bites) {
      ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = '#000';
      for (let i = 0; i < bites; i += 1) {
        const t = 0.3 + 0.6 * r(), edge = i % 3 === 0, x = cx + (edge ? (r() < 0.5 ? -1 : 1) * half(t) * (0.95 + 0.2 * r()) : (r() - 0.5) * 1.5 * half(t)), size = 5 + 11 * r();
        ctx.beginPath(); ctx.ellipse(x, yAt(t), size, size * (0.5 + 0.5 * r()), r() * 3.14, 0, 6.283); ctx.fill();
      }
      ctx.restore();
    }
  };
  leaf(0, 811, { broad: 0.43, point: 0.72, low: 0.8 });
  leaf(1, 823, { broad: 0.41, point: 0.78, low: 0.86, bites: 9 });
  leaf(2, 829, { broad: 0.33, point: 0.85, low: 0.9 });
  leaf(3, 839, { broad: 0.21, point: 1.0, low: 1.0, young: true });
  return { texture: cutoutTexture(canvas), canvas, cells: [4, 1] };
}

// ---------- ground cover ----------
// A 2 x 2 sheet: redwood sorrel (three heart-shaped leaflets), a second sorrel,
// a moss cushion, a hemlock seedling.
export function coverAtlas(look) {
  const C = 256, canvas = makeCanvas(C * 2, C * 2), ctx = canvas.getContext('2d');
  const pal = look.palette, opts = { ragged: look.paint.ragged };
  const sorrel = (ox, oy, seed) => {
    const r = rng(seed);
    for (let n = 0; n < 7; n += 1) {
      const px = ox + C * (0.2 + 0.6 * r()), py = oy + C * (0.25 + 0.55 * r()), size = C * (0.085 + 0.04 * r()), turn = r() * 6.28;
      const c = vary(mix(pal.sorrel.dark, pal.sorrel.light, r()), r, look.paint.vary);
      for (let leaf = 0; leaf < 3; leaf += 1) {
        const a = turn + leaf * 2.094, lx = px + Math.cos(a) * size * 0.85, ly = py + Math.sin(a) * size * 0.85;
        for (const lobe of [-0.42, 0.42]) {               // two rounded lobes make each leaflet's heart
          ctx.fillStyle = css(shift(c, 0, 0, lobe > 0 ? 3 : -2));
          ctx.beginPath(); ctx.ellipse(lx + Math.cos(a + 1.57) * size * lobe * 0.55, ly + Math.sin(a + 1.57) * size * lobe * 0.55, size * 0.62, size * 0.46, a, 0, 6.283); ctx.fill();
        }
      }
    }
  };
  sorrel(0, 0, 61); sorrel(C, 0, 67);
  const r = rng(71);
  for (let i = 0; i < 260; i += 1) {                        // moss cushion: stippled, domed
    const a = r() * 6.283, d = Math.sqrt(r()) * C * 0.36, x = C * 0.5 + Math.cos(a) * d, y = C * 1.55 + Math.sin(a) * d * 0.55;
    dab(ctx, x, y, 5 + r() * 9, vary(mix(pal.moss.dark, pal.moss.light, r() * (1 - d / (C * 0.4))), r, look.paint.vary), 0.95, 0.8, r() * 3);
  }
  const sx = C * 1.5, sy = C * 1.96;                        // hemlock seedling: a stem with a few drooping sprays
  ctx.lineWidth = 2; ctx.strokeStyle = css(pal.twig); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 4, sy - C * 0.8); ctx.stroke();
  for (let i = 0; i < 9; i += 1) {
    const t = i / 9, y = sy - C * (0.12 + 0.68 * t), len = C * 0.34 * (1 - t * 0.75);
    for (const side of [-1, 1]) {
      stroke(ctx, r, sx + 4 * t, y, sx + side * len, y + len * 0.28, 15 * (1 - t * 0.5), vary(pal.hemlockNeedle.mid, r, look.paint.vary), { ...opts, ragged: 0.5, taperOut: 0.7 });
      stroke(ctx, r, sx + side * len * 0.2, y, sx + side * len, y + len * 0.26, 7 * (1 - t * 0.5), vary(pal.hemlockNeedle.tip, r, look.paint.vary), { ...opts, ragged: 0.5, taperOut: 0.8, alpha: 0.9 });
    }
  }
  return { texture: cutoutTexture(canvas), canvas, cells: [2, 2] };
}

// ---------- meadow grass ----------
// Four tufts side by side, roots at the bottom: a low thick tuft of this year's blades, a taller one with a
// few stems gone to seed, one with last year's straw still standing in it, and a thin one of long blades.
// A blade is one stroke from the root, widest low down and drawn out to a point, bowed the way it leans.
export function grassAtlas(look, detail = 1) {
  const C = 256, canvas = makeCanvas(C * 4 * detail, C * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  const pal = look.palette.meadow;
  const tuft = (cell, seed, { blades, tall, straw = 0, heads = 0, spread, lean }) => {
    const r = rng(seed), ox = cell * C, cx = ox + C / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(ox + 3, 0, C - 6, C); ctx.clip();
    for (let i = 0; i < blades; i += 1) {
      const k = i / blades;                                   // painted back to front: the blades behind are the darker
      const x0 = cx + (r() - 0.5) * C * spread, dry = r() < straw;
      const high = C * tall * (0.5 + 0.5 * Math.pow(r(), 0.7)) * (dry ? 0.85 : 1);
      const a = (r() - 0.5) * 2 * lean + ((x0 - cx) / C) * 1.3;           // a tuft fans out from its root
      const x1 = x0 + Math.sin(a) * high, y1 = C - Math.cos(a) * high;
      const green = mix(mix(pal.dark, pal.blade, 0.25 + 0.75 * k), pal.light, r() < 0.35 ? 0.25 + 0.6 * r() : 0);
      stroke(ctx, r, x0, C + 3, x1, y1, (dry ? 5 : 7) + r() * 5, vary(dry ? pal.straw : green, r, look.paint.vary),
        { bend: (r() - 0.5) * 0.24 + a * 0.2, ragged: 0.05, taperIn: 0.02, taperOut: 0.96 });
    }
    for (let i = 0; i < heads; i += 1) {                      // a stem gone to seed: a thin stalk and a loose head of spikelets
      const x0 = cx + (r() - 0.5) * C * spread * 0.6, a = (r() - 0.5) * 0.5, high = C * (0.8 + 0.16 * r());
      const x1 = x0 + Math.sin(a) * high, y1 = C - Math.cos(a) * high, stalk = vary(mix(pal.blade, pal.straw, 0.55), r, look.paint.vary);
      stroke(ctx, r, x0, C + 3, x1, y1, 3.4, stalk, { bend: a * 0.25, ragged: 0.04, taperIn: 0.02, taperOut: 0.5 });
      for (let n = 0; n < 9; n += 1) {
        const t = 0.7 + 0.3 * (n / 9), px = x0 + (x1 - x0) * t, py = C + (y1 - C) * t, side = n % 2 ? 1 : -1, out = a + side * (0.5 + 0.5 * r());
        stroke(ctx, r, px, py, px + Math.sin(out) * (7 + 8 * r()), py - Math.cos(out) * (7 + 8 * r()), 4.5, vary(shift(pal.straw, -6, 4, -4 + 10 * r()), r, look.paint.vary),
          { ragged: 0.1, taperIn: 0.3, taperOut: 0.6 });
      }
    }
    ctx.restore();
  };
  // thick tufts: a card that is mostly paint closes the pixels behind it, and a meadow needs fewer of them
  tuft(0, 610, { blades: 70, tall: 0.62, spread: 0.7, lean: 0.34 });
  tuft(1, 617, { blades: 60, tall: 0.78, straw: 0.08, heads: 4, spread: 0.62, lean: 0.3 });
  tuft(2, 623, { blades: 64, tall: 0.7, straw: 0.4, spread: 0.7, lean: 0.42 });
  tuft(3, 631, { blades: 34, tall: 0.9, straw: 0.12, heads: 1, spread: 0.5, lean: 0.48 });
  // grass is looked down on from a walker's height, its cards nearly edge-on: read one way only, they come from a coarse level in blocks
  return { texture: cutoutTexture(canvas, { anisotropy: 8 }), canvas, cells: [4, 1] };
}

// ---------- forest floor ----------
// One tile, 4 m across: dark humus, a drift of rusty needles and twigs, moss in
// soft patches. The material tints it towards bare earth along the trail.
export function groundTexture(look) {
  const S = 1024, canvas = makeCanvas(S, S), ctx = canvas.getContext('2d'), pal = look.palette.ground, r = rng(900);
  ctx.fillStyle = css(pal.humus); ctx.fillRect(0, 0, S, S);
  const everywhere = (x, y, margin, draw) => {                 // repeat near the edges so the tile wraps
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      if (x + dx > -margin && x + dx < S + margin && y + dy > -margin && y + dy < S + margin) draw(x + dx, y + dy);
    }
  };
  for (let i = 0; i < 520; i += 1) {                            // broad mottling
    const x = r() * S, y = r() * S, rad = 40 + r() * 110, c = vary(shift(pal.humus, 0, 0, (r() - 0.5) * 9), r, look.paint.vary);
    const squash = 0.6 + r() * 0.4, angle = r() * 3;             // drawn once, so the copies that wrap the tile match
    everywhere(x, y, rad, (px, py) => dab(ctx, px, py, rad, c, 0.5, squash, angle));
  }
  for (let i = 0; i < 200; i += 1) {                            // moss patches, built from stipples
    const x = r() * S, y = r() * S, rad = 30 + r() * 80;
    for (let k = 0; k < 22; k += 1) {
      const a = r() * 6.283, d = Math.sqrt(r()) * rad, c = vary(mix(pal.mossDark, pal.mossLight, r()), r, look.paint.vary), size = 6 + r() * 14;
      everywhere(x + Math.cos(a) * d, y + Math.sin(a) * d, size, (px, py) => dab(ctx, px, py, size, c, 0.75, 0.8, 0));
    }
  }
  for (let i = 0; i < 5200; i += 1) {                           // needle litter
    const x = r() * S, y = r() * S, a = r() * 6.283, len = 7 + r() * 13, c = vary(r() < 0.8 ? pal.needle : pal.needlePale, r, look.paint.vary);
    const width = 1.6 + r() * 1.2, seed = Math.floor(r() * 1e9);
    everywhere(x, y, 20, (px, py) => stroke(ctx, rng(seed), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width, c,
      { ragged: 0.1, taperIn: 0.3, taperOut: 0.5, alpha: 0.7 }));
  }
  for (let i = 0; i < 90; i += 1) {                             // twigs
    const x = r() * S, y = r() * S, a = r() * 6.283, len = 30 + r() * 70, c = vary(pal.twig, r, look.paint.vary);
    const width = 2.5 + r() * 2, bend = (r() - 0.5) * 0.2, seed = Math.floor(r() * 1e9);
    everywhere(x, y, 100, (px, py) => stroke(ctx, rng(seed), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width, c,
      { ragged: 0.1, bend, taperIn: 0.1, taperOut: 0.9, alpha: 0.85 }));
  }
  return { texture: tileTexture(canvas), canvas };
}

// The tread of the trail: earth worn bare and packed down, paler than the floor either
// side of it, gritty, with needles trodden in and a scatter of small stones and twigs.
// No moss grows where people walk. One tile is two metres of trail, painted at twice
// the floor's density because it is what the walker looks down at.
export function treadTexture(look) {
  const S = 1024, canvas = makeCanvas(S, S), ctx = canvas.getContext('2d'), pal = look.palette.ground, r = rng(950);
  ctx.fillStyle = css(pal.path); ctx.fillRect(0, 0, S, S);
  const everywhere = (x, y, margin, draw) => {                 // repeat near the edges so the tile wraps
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      if (x + dx > -margin && x + dx < S + margin && y + dy > -margin && y + dy < S + margin) draw(x + dx, y + dy);
    }
  };
  for (let i = 0; i < 300; i += 1) {                            // packed earth is never one tone
    const x = r() * S, y = r() * S, rad = 32 + r() * 116, c = vary(shift(pal.path, 0, 0, (r() - 0.5) * 11), r, look.paint.vary);
    const squash = 0.55 + r() * 0.45, angle = r() * 3;
    everywhere(x, y, rad, (px, py) => dab(ctx, px, py, rad, c, 0.55, squash, angle));
  }
  for (let i = 0; i < 46; i += 1) {                             // damp hollows where water stands
    const x = r() * S, y = r() * S, rad = 24 + r() * 60, c = shift(pal.path, -3, 5, -8), squash = 0.5 + r() * 0.4, angle = r() * 3;
    everywhere(x, y, rad, (px, py) => dab(ctx, px, py, rad, c, 0.6, squash, angle));
  }
  for (let i = 0; i < 150; i += 1) {                            // where a boot has scuffed it: short flat strokes with an edge
    const x = r() * S, y = r() * S, a = r() * 6.283, len = 26 + r() * 60, width = 14 + r() * 26, seed = Math.floor(r() * 1e9);
    const c = vary(shift(pal.path, 0, -4, (r() < 0.5 ? -1 : 1) * (4 + r() * 5)), r, look.paint.vary);
    everywhere(x, y, 100, (px, py) => stroke(ctx, rng(seed), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width, c,
      { ragged: 0.22, lumpy: 0.3, taperIn: 0.45, taperOut: 0.5, alpha: 0.42 }));
  }
  for (let i = 0; i < 5200; i += 1) {                           // grit: the grain of the earth itself
    const x = r() * S, y = r() * S, size = 1 + r() * 2.2, c = shift(pal.path, (r() - 0.5) * 8, -6, (r() < 0.55 ? -1 : 1) * (5 + r() * 9));
    ctx.fillStyle = css(c, 0.5 + r() * 0.35);
    ctx.fillRect(x, y, size, size * (0.6 + r() * 0.8));
  }
  for (let i = 0; i < 2600; i += 1) {                           // needles, trodden flat
    const x = r() * S, y = r() * S, a = r() * 6.283, len = 10 + r() * 18, c = vary(r() < 0.55 ? pal.needle : pal.needlePale, r, look.paint.vary);
    const width = 2.2 + r() * 1.6, seed = Math.floor(r() * 1e9);
    everywhere(x, y, 30, (px, py) => stroke(ctx, rng(seed), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width, c,
      { ragged: 0.1, taperIn: 0.3, taperOut: 0.5, alpha: 0.75 }));
  }
  for (let i = 0; i < 70; i += 1) {                             // small stones: a dark underside, then the lit top
    const x = r() * S, y = r() * S, a = r() * 6.283, len = 6 + r() * 13, width = len * (0.7 + r() * 0.5), seed = Math.floor(r() * 1e9);
    const top = vary(shift(pal.path, 6, -12, 9 + r() * 7), r, look.paint.vary), under = shift(pal.path, 0, 0, -10);
    everywhere(x, y, 40, (px, py) => {
      stroke(ctx, rng(seed), px, py + 3, px + Math.cos(a) * len, py + 3 + Math.sin(a) * len, width, under, { ragged: 0.12, taperIn: 0.6, taperOut: 0.6, alpha: 0.9 });
      stroke(ctx, rng(seed + 1), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width * 0.9, top, { ragged: 0.12, taperIn: 0.6, taperOut: 0.6 });
    });
  }
  for (let i = 0; i < 26; i += 1) {                             // twigs come down everywhere
    const x = r() * S, y = r() * S, a = r() * 6.283, len = 36 + r() * 80, c = vary(pal.twig, r, look.paint.vary);
    const width = 3.5 + r() * 2.5, bend = (r() - 0.5) * 0.16, seed = Math.floor(r() * 1e9);
    everywhere(x, y, 120, (px, py) => stroke(ctx, rng(seed), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width, c,
      { ragged: 0.1, bend, taperIn: 0.1, taperOut: 0.9, alpha: 0.85 }));
  }
  return { texture: tileTexture(canvas), canvas };
}

// ---------- the valley's floors ----------
// The ground of the river's bars, under the stones: sand and grit, with the small gravel that lies bedded in
// it. Nothing in it is bigger than a thumb. The cobbles themselves are solids (plants/stones.js): painted on a
// tile they lay flat, and the same big stone came round every two and a half metres. A tile is 1.2 m.
export function gravelTexture(look) {
  const S = 512, canvas = makeCanvas(S, S), ctx = canvas.getContext('2d'), pal = look.palette.gravel, r = rng(970);
  ctx.fillStyle = css(pal.sand); ctx.fillRect(0, 0, S, S);
  const everywhere = (x, y, margin, draw) => {                 // repeat near the edges so the tile wraps
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      if (x + dx > -margin && x + dx < S + margin && y + dy > -margin && y + dy < S + margin) draw(x + dx, y + dy);
    }
  };
  for (let i = 0; i < 70; i += 1) {                             // the sand is never one tone
    const x = r() * S, y = r() * S, rad = 40 + r() * 90, c = vary(shift(pal.sand, 0, 0, (r() - 0.5) * 8), r, look.paint.vary), squash = 0.6 + r() * 0.4, angle = r() * 3;
    everywhere(x, y, rad, (px, py) => dab(ctx, px, py, rad, c, 0.45, squash, angle));
  }
  for (let i = 0; i < 9000; i += 1) {                           // grit: grains of every rock the river carries
    const k = r(), c = shift(k < 0.5 ? pal.cool : k < 0.8 ? pal.warm : k < 0.92 ? pal.dark : pal.pale, 0, 0, (r() - 0.5) * 12), size = 1 + r() * 2.2;
    ctx.fillStyle = css(c, 0.4 + r() * 0.4);
    ctx.fillRect(r() * S, r() * S, size, size * (0.6 + r() * 0.8));
  }
  const pebble = (x, y, len, seed) => {                         // a dark underside, then the lit top
    const q = rng(seed), a = q() * 6.283, width = len * (0.6 + q() * 0.3), k = q();
    const top = vary(k < 0.5 ? pal.cool : k < 0.78 ? pal.warm : k < 0.9 ? pal.pale : k < 0.96 ? pal.dark : pal.rust, q, look.paint.vary * 1.2);
    everywhere(x, y, len + 6, (px, py) => {
      stroke(ctx, rng(seed + 1), px, py + 1.5, px + Math.cos(a) * len, py + 1.5 + Math.sin(a) * len, width, pal.dark, { ragged: 0.1, taperIn: 0.55, taperOut: 0.55, alpha: 0.7 });
      stroke(ctx, rng(seed + 2), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width * 0.92, top, { ragged: 0.1, taperIn: 0.55, taperOut: 0.55 });
    });
  };
  for (let i = 0; i < 520; i += 1) pebble(r() * S, r() * S, 3 + r() * 5, Math.floor(r() * 1e9));
  for (let i = 0; i < 46; i += 1) pebble(r() * S, r() * S, 8 + r() * 6, Math.floor(r() * 1e9));
  return { texture: tileTexture(canvas), canvas };
}

// The rock of the falls (plants/crag.js): bedded stone, seen on its edge. Its beds run level across the tile,
// each a tone of its own, with the dark of a parting between two of them; a few joints cross them upright; lichen
// in pale dabs, and rust where iron has run down a face. The rock's material lays it on through three flat
// projections with the tile's top upward, so a bed is level on every face of a ledge. A tile is three metres.
export function rockTexture(look) {
  const S = 512, canvas = makeCanvas(S, S), ctx = canvas.getContext('2d'), pal = look.palette.rock, r = rng(990);
  ctx.fillStyle = css(pal.mid); ctx.fillRect(0, 0, S, S);
  const everywhere = (x, y, margin, draw) => {                 // repeat near the edges so the tile wraps
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      if (x + dx > -margin && x + dx < S + margin && y + dy > -margin && y + dy < S + margin) draw(x + dx, y + dy);
    }
  };
  // the beds: bands a hand to a forearm thick, each laid in a few long strokes of its own tone
  let y = 0;
  const partings = [];
  while (y < S) {
    // (beds as far apart in tone as the palette's ends, each laid edge to edge with the next, were the stripes of a layer cake)
    const thick = 10 + r() * 30, k = r(), tone = k < 0.5 ? pal.mid : k < 0.74 ? pal.warm : k < 0.93 ? pal.dark : pal.pale, c = vary(mix(pal.mid, shift(tone, 0, 0, (r() - 0.5) * 6), 0.6), r, look.paint.vary);
    for (let i = 0; i < 5; i += 1) {
      const x0 = r() * S, len = S * (0.25 + r() * 0.6), yy = y + thick * (0.1 + 0.8 * r()), wave = (r() - 0.5) * 8;
      everywhere(x0, yy, len, (px, py) => stroke(ctx, rng(Math.floor(r() * 1e9)), px, py, px + len, py + wave, thick * (0.5 + r() * 0.6), vary(c, r, look.paint.vary * 0.6), { ragged: 0.04, lumpy: 0.1, taperIn: 0.3, taperOut: 0.3, alpha: 0.7 }));
    }
    partings.push(y);
    y += thick;
  }
  for (let i = 0; i < 90; i += 1) {                             // a face is never one tone: broad patches, weathered and damp
    const x = r() * S, yy = r() * S, rad = 24 + r() * 70, c = vary(r() < 0.5 ? pal.dark : pal.warm, r, look.paint.vary);
    everywhere(x, yy, rad, (px, py) => dab(ctx, px, py, rad, c, 0.22, 0.4 + r() * 0.4, (r() - 0.5) * 0.5));
  }
  // the partings between beds: dark, not ruled, and broken where a bed has spalled
  for (const at of partings) {
    let x = r() * 40;
    while (x < S) {
      const len = 30 + r() * 110, drop = (r() - 0.5) * 5;
      if (r() < 0.7) everywhere(x, at, len, (px, py) => stroke(ctx, rng(Math.floor(r() * 1e9)), px, py, px + len, py + drop, 1.2 + r() * 1.6, shift(pal.dark, 0, 0, -4), { ragged: 0.3, taperIn: 0.3, taperOut: 0.3, alpha: 0.65 }));
      x += len + r() * 26;
    }
  }
  for (let i = 0; i < 26; i += 1) {                             // joints: upright cracks that cross a few beds and stop
    const x = r() * S, yy = r() * S, len = 30 + r() * 120, lean = (r() - 0.5) * 22;
    everywhere(x, yy, len, (px, py) => stroke(ctx, rng(Math.floor(r() * 1e9)), px, py, px + lean, py + len, 1.4 + r() * 1.8, shift(pal.dark, 0, 0, -3), { ragged: 0.3, bend: (r() - 0.5) * 8, taperIn: 0.4, taperOut: 0.6, alpha: 0.8 }));
  }
  for (let i = 0; i < 34; i += 1) {                             // rust and the dark of running water, drawn down a face
    const x = r() * S, yy = r() * S, len = 40 + r() * 120, c = r() < 0.45 ? pal.rust : shift(pal.dark, 0, 0, -2);
    everywhere(x, yy, len, (px, py) => stroke(ctx, rng(Math.floor(r() * 1e9)), px, py, px + (r() - 0.5) * 8, py + len, 5 + r() * 12, c, { ragged: 0.2, lumpy: 0.3, taperIn: 0.2, taperOut: 0.9, alpha: 0.22 }));
  }
  for (let i = 0; i < 240; i += 1) {                            // lichen: pale dabs, in drifts
    const cx = r() * S, cy = r() * S, n = 1 + Math.floor(r() * 5);
    for (let j = 0; j < n; j += 1) {
      const x = cx + (r() - 0.5) * 30, yy = cy + (r() - 0.5) * 16, rad = 1.5 + r() * 4.5, c = vary(r() < 0.7 ? pal.lichen : pal.pale, r, look.paint.vary);
      everywhere(x, yy, rad, (px, py) => dab(ctx, px, py, rad, c, 0.28 + r() * 0.25, 0.6 + r() * 0.4, r() * 3));
    }
  }
  for (let i = 0; i < 2600; i += 1) {                           // grain: pits and specks
    ctx.fillStyle = css(r() < 0.6 ? shift(pal.dark, 0, 0, -3) : pal.pale, 0.25 + r() * 0.3);
    const size = 1 + r() * 2;
    ctx.fillRect(r() * S, r() * S, size, size * (0.5 + r() * 0.8));
  }
  return { texture: tileTexture(canvas), canvas };
}

// The old clearing: last year's grass, pale and lying over, and May's green coming up through it. A tile
// is about three metres.
export function meadowTexture(look) {
  const S = 512, canvas = makeCanvas(S, S), ctx = canvas.getContext('2d'), pal = look.palette.meadow, r = rng(980);
  ctx.fillStyle = css(pal.base); ctx.fillRect(0, 0, S, S);
  const everywhere = (x, y, margin, draw) => {
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      if (x + dx > -margin && x + dx < S + margin && y + dy > -margin && y + dy < S + margin) draw(x + dx, y + dy);
    }
  };
  for (let i = 0; i < 110; i += 1) {
    const x = r() * S, y = r() * S, rad = 26 + r() * 70, c = vary(r() < 0.3 ? pal.dark : shift(pal.base, 0, 0, (r() - 0.5) * 12), r, look.paint.vary), squash = 0.6 + r() * 0.4, angle = r() * 3;
    everywhere(x, y, rad, (px, py) => dab(ctx, px, py, rad, c, 0.5, squash, angle));
  }
  const lie = 0.9;                                              // the way the wind has laid it
  for (let i = 0; i < 2600; i += 1) {
    const x = r() * S, y = r() * S, k = r(), old = k < 0.38;
    const a = lie + (r() - 0.5) * (old ? 0.9 : 2.6), len = old ? 16 + r() * 26 : 8 + r() * 15, width = old ? 1.6 + r() * 1.4 : 1.8 + r() * 1.6;
    const c = vary(old ? pal.straw : k < 0.78 ? pal.blade : k < 0.93 ? pal.light : pal.dark, r, look.paint.vary), bend = (r() - 0.5) * 0.3, seed = Math.floor(r() * 1e9);
    everywhere(x, y, 44, (px, py) => stroke(ctx, rng(seed), px, py, px + Math.cos(a) * len, py + Math.sin(a) * len, width, c, { ragged: 0.1, bend, taperIn: 0.2, taperOut: 0.75, alpha: old ? 0.8 : 0.9 }));
  }
  return { texture: tileTexture(canvas), canvas };
}
