import { rng, makeCanvas, css, shift, mix, vary, stroke, cutoutTexture, tileTexture, normalMapFromHeight } from './brush.js';

// ---------- the riverside's sheet ----------
// What grows on the river's banks and bars (plants/alder.js): red alder and willow. Two columns of cells
// 512 x 256, four rows:
//   `spray`  (2)  the end of an alder branch seen flat: it is attached at the middle of the cell's left edge
//   `hung`   (2)  the same seen from the side: a twig along the top of the cell and the leaves hanging from it
//   `crown`  (2)  a whole alder's crown seen from beside it: the tree's trunk goes through it from the middle
//                 of the cell's left edge to the right, which is up the tree
//   `willow` (2)  a willow's shoot seen flat, attached like `spray`
// It is painted at one size on every device: an alder's leaves begin ten metres over a walker's head.
// (There was a whole willow too, on a square of two cells, for the bush far off: laid on two crossed cards it
// grew out of its root as the shoots shrank, and a bush twenty metres away changed a third of a 40-pixel square
// in one step of a walk. A willow keeps its shoots at any distance.)
//
// What was read (2026-11-15; agents reading the Forest Service's accounts of red alder (FEIS, PNW-GTR-669),
// Oregon State's and Virginia Tech's tree pages and the Burke Herbarium's willows; none of it seen as an image):
// an alder's leaf is 7 to 13 cm long (to 15), egg-shaped with a pointed tip, coarsely toothed, its edge rolled
// under, with 8 to 15 pairs of straight side veins, dull dark green above and greyish below; it is in full leaf
// between early April and the middle of May (2 May north of Seattle), so in mid-May the leaves are new; the
// long catkins are over, and last year's woody cones, 12 to 25 mm, are still on the twigs. Willows of these
// bars (Scouler's and Sitka; Pacific willow): leaves 3 to 12 cm (Pacific to 17) and two to four times as long
// as wide (Pacific far narrower), a little glossy above, pale or silky white below.
const CW = 512, CH = 256, PAD = 9;

export function alderAtlas(look) {
  const canvas = makeCanvas(CW * 2, CH * 4), ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pal = look.palette.alder, wil = look.palette.willow;

  // a cell of the sheet, or any box of it: paint(ox, oy, inside, wide, tall), clipped to the box
  const box = (ox, oy, wide, tall, paint) => {
    ctx.save(); ctx.beginPath(); ctx.rect(ox + 1, oy + 1, wide - 2, tall - 2); ctx.clip();
    paint(ox, oy, (x, y, margin = PAD) => x > ox + margin && x < ox + wide - margin && y > oy + margin && y < oy + tall - margin, wide, tall);
    ctx.restore();
  };
  const clipped = (cell, paint) => box((cell % 2) * CW, Math.floor(cell / 2) * CH, CW, CH, paint);
  // A leaf as a path: its base at (bx, by), its tip `length` away along `angle`. `shape` is its half-width,
  // as a share of its length, at eight places along it; an alder's is widest below the middle and coarsely
  // toothed, a willow's is a blade.
  const ALDER = [0, 0.22, 0.32, 0.34, 0.3, 0.22, 0.12, 0], WILLOW = [0, 0.09, 0.13, 0.14, 0.13, 0.1, 0.05, 0];
  const blade = (r, bx, by, angle, length, shape, teeth) => {
    const c = Math.cos(angle), s = Math.sin(angle), n = shape.length - 1;
    const at = (t, off) => [bx + (c * t - s * off) * length, by + (s * t + c * off) * length];
    ctx.beginPath(); ctx.moveTo(bx, by);
    for (let i = 1; i <= n; i += 1) ctx.lineTo(...at(i / n, shape[i] * (1 + teeth * (i % 2 ? 1 : -1) * (0.5 + 0.5 * r()))));
    for (let i = n - 1; i >= 1; i -= 1) ctx.lineTo(...at(i / n, -shape[i] * (1 + teeth * (i % 2 ? -1 : 1) * (0.5 + 0.5 * r()))));
    ctx.closePath(); ctx.fill();
  };
  // an alder's leaf, with its midrib and its straight side veins pressed into it
  const alderLeaf = (r, bx, by, angle, length, colour) => {
    ctx.fillStyle = css(colour);
    blade(r, bx, by, angle, length, ALDER, 0.16);
    if (length < 13) return;
    const c = Math.cos(angle), s = Math.sin(angle);
    ctx.strokeStyle = css(mix(colour, pal.vein, 0.55), 0.7); ctx.lineWidth = Math.max(0.6, length * 0.035);
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + c * length * 0.94, by + s * length * 0.94);
    for (let k = 1; k <= 4; k += 1) {
      const t = 0.14 + 0.17 * k, px = bx + c * length * t, py = by + s * length * t, reach = length * ALDER[Math.min(6, Math.round(t * 7))] * 0.9;
      for (const hand of [-1, 1]) { const a = angle + hand * 0.95; ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * reach, py + Math.sin(a) * reach); }
    }
    ctx.stroke();
  };
  // The leaves of one box, the ones underneath first and darkest. Which are light and which dark goes by
  // where a leaf is in the spray, a handful together (paint/maple.js: every leaf's tone its own is confetti).
  const lay = (r, leaves, colours, draw) => {
    const a = r() * 6.3, b = r() * 6.3;
    for (const l of leaves) l.tier = Math.min(1, Math.max(0, l.tier * 0.4 + 0.3 + 0.3 * Math.sin(l.x * 0.03 + a) + 0.22 * Math.sin(l.y * 0.06 + l.x * 0.017 + b)));
    leaves.sort((p, q) => p.tier - q.tier);
    for (const l of leaves) {
      const tone = l.under ? mix(colours.silver, colours.light, 0.5 * r())
        : l.tier < 0.34 ? mix(colours.dark, colours.mid, 0.25 + 0.5 * r()) : l.tier < 0.72 ? mix(colours.mid, colours.light, 0.1 + 0.6 * r()) : mix(colours.light, colours.pale, 0.1 + 0.7 * r());
      draw(r, l.x, l.y, l.angle, l.size, vary(tone, r, look.paint.vary * 0.6));
    }
  };
  const twigLine = (points, colour, width) => {
    ctx.strokeStyle = css(colour, 0.95); ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(...points[i]);
    ctx.stroke();
  };
  // Leaves set by turns to either side of a twig from (ax, ay) to (bx, by), each pointing forward and out,
  // and one at its end; `gap` is the distance from one to the next. A leaf that would leave the box is left
  // out: a cut shows as a ruled edge on the card.
  const along = (r, leaves, inside, ax, ay, bx, by, size, gap, { spread = 1.0, droop = 0, under = 0 } = {}) => {
    const length = Math.hypot(bx - ax, by - ay), heading = Math.atan2(by - ay, bx - ax), n = Math.max(2, Math.round(length / gap));
    for (let k = 1; k <= n; k += 1) {
      const t = (k - 0.3 + 0.4 * r()) / n, px = ax + (bx - ax) * Math.min(1, t), py = ay + (by - ay) * Math.min(1, t);
      const hand = k === n ? 0 : (k % 2 ? 1 : -1), long = size * (0.75 + 0.5 * r()), angle = heading + hand * spread * (0.75 + 0.5 * r()) + droop * (0.6 + 0.8 * r());
      const ex = px + Math.cos(angle) * long, ey = py + Math.sin(angle) * long;
      if (!inside(px, py) || !inside(ex, ey) || !inside(ex - long * 0.3, ey - long * 0.3) || !inside(ex + long * 0.3, ey + long * 0.3)) continue;
      leaves.push({ x: px, y: py, angle, size: long, tier: r(), under: r() < under });
    }
  };
  // last year's cones: three or four small dark eggs on short stalks, where a twig forks
  const cones = (r, x, y, heading) => {
    for (let k = 0; k < 3 + Math.floor(r() * 2); k += 1) {
      const a = heading + (k - 1.5) * 0.55 + (r() - 0.5) * 0.3, far = 7 + 4 * r(), cx = x + Math.cos(a) * far, cy = y + Math.sin(a) * far;
      ctx.strokeStyle = css(pal.twig, 0.9); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.fillStyle = css(vary(pal.cone, r, look.paint.vary * 0.5));
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(1.5, 0, 3.6, 2.4, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    }
  };

  // ---- an alder's branch end, flat: a shoot with side shoots to either side by turns, each with shoots of its
  // own, and leaves all along every one of them, so that the whole is a leaf-shaped mass of leaves
  const spray = (cell, seed) => clipped(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH / 2, leaves = [];
    const spine = (t) => [ox + 3 + CW * 0.86 * t, y0 + CH * 0.05 * Math.sin(t * 2.7 + seed)];
    const twigs = [];
    for (let k = 0; k < 13; k += 1) {
      const t = 0.04 + 0.82 * (k + 0.5 * r()) / 13, hand = k % 2 ? 1 : -1, [sx, sy] = spine(t);
      // longest a third of the way out, so that the spray is widest there
      const reach = CH * (0.3 + 0.24 * Math.sin(Math.PI * Math.pow(t, 0.6))) * (0.8 + 0.3 * r()), a = hand * (0.62 + 0.3 * r());
      const end = [sx + Math.cos(a) * reach, sy + Math.sin(a) * reach];
      twigs.push([[sx, sy], end]);
      // (and a shoot of its own, half-way along it, on its outer side)
      const mx = (sx + end[0]) / 2, my = (sy + end[1]) / 2, b = a + hand * (0.5 + 0.3 * r()) * (r() < 0.5 ? 1 : -0.6), far = reach * (0.35 + 0.2 * r());
      twigs.push([[mx, my], [mx + Math.cos(b) * far, my + Math.sin(b) * far]]);
    }
    for (let k = 0; k < 18; k += 1) { const [ax, ay] = spine(k / 18), [bx, by] = spine((k + 1) / 18); along(r, leaves, inside, ax, ay, bx, by, 21, 12, { spread: 1.05 }); }
    for (const [[ax, ay], [bx, by]] of twigs) along(r, leaves, inside, ax, ay, bx, by, 20, 10, { spread: 1.0 });
    twigLine(Array.from({ length: 19 }, (_, k) => spine(k / 18)), pal.twig, 2.6);
    for (const [a, b] of twigs) twigLine([a, b], pal.twig, 1.4);
    lay(r, leaves, pal, alderLeaf);
    for (const k of [2, 8, 14]) cones(r, ...twigs[k][0], Math.atan2(twigs[k][1][1] - twigs[k][0][1], twigs[k][1][0] - twigs[k][0][0]) + 0.9);
  });
  spray(0, 4409); spray(1, 4421);

  // ---- the same from the side: a twig along the top, and side twigs that go out and down with their leaves
  // hanging, a curtain of them
  const hung = (cell, seed) => clipped(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH * 0.17, leaves = [];
    const twig = (t) => [ox + 2 + (CW - 4) * t, y0 + CH * 0.06 * t * t + 2 * Math.sin(t * 8 + seed)];
    const droops = [];
    for (let k = 0; k < 15; k += 1) {
      const [px, py] = twig(0.03 + 0.93 * (k + 0.2 + 0.6 * r()) / 15), reach = CH * (0.34 + 0.4 * r()), lean = 0.2 + 0.75 * r();
      const end = [px + Math.sin(lean) * reach, py + Math.cos(lean) * reach];
      droops.push([[px, py], end]);
      const mx = (px + end[0]) / 2, my = (py + end[1]) / 2, b = lean + (r() < 0.5 ? -1 : 1) * (0.5 + 0.3 * r()), far = reach * (0.3 + 0.25 * r());
      droops.push([[mx, my], [mx + Math.sin(b) * far, my + Math.cos(b) * far]]);
    }
    for (let k = 0; k < 20; k += 1) { const [ax, ay] = twig(k / 20), [bx, by] = twig((k + 1) / 20); along(r, leaves, inside, ax, ay, bx, by, 20, 12, { spread: 0.9, droop: 0.5 }); }
    for (const [[ax, ay], [bx, by]] of droops) along(r, leaves, inside, ax, ay, bx, by, 20, 10, { spread: 0.95, droop: 0.15 });
    twigLine(Array.from({ length: 21 }, (_, k) => twig(k / 20)), pal.twig, 2.6);
    for (const [a, b] of droops) twigLine([a, [(a[0] + b[0]) / 2 - 2, (a[1] + b[1]) / 2 + 2], b], pal.twig, 1.4);
    lay(r, leaves, pal, alderLeaf);
    for (const k of [4, 12, 22]) cones(r, ...droops[k][0], 1.9);
  });
  hung(2, 4441); hung(3, 4447);

  // ---- a whole crown from beside it, as it is seen from across the river: limbs that leave the trunk going up
  // and out, and leaves in masses round them, each mass a few dozen dabs, with sky and wood showing between
  // the masses. Up the tree is to the right. A narrow dome: in a stand an alder keeps only the crown at its top.
  const crown = (cell, seed) => clipped(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH / 2, leaves = [];
    const trunk = (t) => [ox + 2 + (CW - 40) * t, y0 + CH * 0.03 * Math.sin(t * 3.4 + seed)];
    // the dome's half-width, t of the way up it: it opens fast, is widest two-fifths of the way up, and rounds over
    const half = (t) => CH * 0.45 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + 0.9 * Math.pow(t, 0.7))), 0.55);
    const limbs = [];
    for (let k = 0; k < 17; k += 1) {
      const t = 0.02 + 0.86 * (k + 0.5 * r()) / 17, hand = k % 2 ? 1 : -1, [sx, sy] = trunk(t);
      const up = CW * (0.13 + 0.07 * r()) * (1 - 0.45 * t), out = half(Math.min(1, t + up / CW)) * (0.62 + 0.36 * r());
      limbs.push({ from: [sx, sy], bend: [sx + up * 0.3, sy + hand * out * 0.72], to: [sx + up, sy + hand * out], t });
    }
    const on = (l, v) => { const u = 1 - v; return [u * u * l.from[0] + 2 * u * v * l.bend[0] + v * v * l.to[0], u * u * l.from[1] + 2 * u * v * l.bend[1] + v * v * l.to[1]]; };
    // a mass of leaves: dabs within `big` of (x, y), pointing every way, lighter the higher `share` is
    const mass = (x, y, big, share, count = 30) => {
      for (let k = 0; k < count; k += 1) {
        const a = r() * 6.2832, far = big * Math.sqrt(r()), px = x + Math.cos(a) * far * 1.2, py = y + Math.sin(a) * far, size = 6 + 4 * r();
        if (!inside(px - size, py - size, 4) || !inside(px + size, py + size, 4)) continue;
        leaves.push({ x: px, y: py, angle: a + (r() - 0.5), size, tier: 0.2 + 0.45 * r() + 0.4 * share });
      }
    };
    for (const l of limbs) {
      // along the limb's outer half and round its end; the inner masses are in the crown's own shade
      mass(...on(l, 1), 17 + 8 * r(), 0.75, 34); mass(...on(l, 0.72), 15 + 7 * r(), 0.45); mass(...on(l, 0.45), 12 + 6 * r(), 0.15, 22);
      const [ex, ey] = on(l, 1); mass(ex - 8 + 26 * r(), ey + (ey > y0 ? -1 : 1) * 16 * r(), 13 + 6 * r(), 0.5 + 0.3 * l.t);
    }
    // (the middle of it, over the trunk, from a third of the way up; and its top)
    for (let k = 0; k < 9; k += 1) { const [tx, ty] = trunk(0.3 + 0.07 * k); mass(tx, ty + (r() - 0.5) * 30, 13 + 7 * r(), 0.25, 24); }
    for (let k = 0; k < 5; k += 1) { const [tx, ty] = trunk(0.86 + 0.035 * k); mass(tx + 4, ty + (r() - 0.5) * 20, 11 + 5 * r(), 0.95); }
    // (its limbs, and not its trunk: the tree's own trunk goes up through the card, and is not straight; painted
    // here as well, it stood beside the real one as a pale plank)
    ctx.strokeStyle = css(pal.trunk, 0.96);
    for (const l of limbs) { ctx.lineWidth = 2.4 * (1 - 0.6 * l.t) + 0.8; ctx.beginPath(); ctx.moveTo(...l.from); ctx.quadraticCurveTo(...l.bend, ...l.to); ctx.stroke(); }
    lay(r, leaves, pal, (rr, x, y, angle, size, colour) => { ctx.fillStyle = css(colour); blade(rr, x, y, angle, size, ALDER, 0.1); });
  });
  crown(4, 4463); crown(5, 4481);

  // ---- a willow's shoot, flat: long wands from one stem, each bending a little, narrow leaves all along them,
  // some turned to show their pale backs
  const willowLeaf = (r, x, y, angle, size, colour) => {
    ctx.fillStyle = css(colour);
    blade(r, x, y, angle, size, WILLOW, 0.05);
    if (size < 12) return;
    ctx.strokeStyle = css(mix(colour, wil.silver, 0.5), 0.7); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(angle) * size * 0.92, y + Math.sin(angle) * size * 0.92); ctx.stroke();
  };
  // a wand: a line from (x, y) that sets out along `angle` and turns by `bend` over its `length`, as points
  const wand = (x, y, angle, length, bend, n = 8) => {
    const points = [[x, y]];
    for (let j = 1; j <= n; j += 1) { const a = angle + bend * (j - 0.5) / n, [px, py] = points[j - 1]; points.push([px + Math.cos(a) * length / n, py + Math.sin(a) * length / n]); }
    return points;
  };
  const shoot = (cell, seed) => clipped(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH / 2, leaves = [];
    const spine = wand(ox + 3, y0, (r() - 0.5) * 0.1, CW * 0.88, (r() - 0.5) * 0.3, 20), wands = [];
    for (const [t, hand] of [[0.04, 1], [0.1, -1], [0.19, 1], [0.27, -1], [0.37, 1], [0.46, -1], [0.56, 1], [0.66, -1]]) {
      const [sx, sy] = spine[Math.round(t * 20)], reach = CW * (0.36 + 0.2 * r()) * (1 - 0.5 * t);
      wands.push(wand(sx, sy, hand * (0.34 + 0.3 * r()), reach, -hand * (0.15 + 0.35 * r())));
    }
    for (const points of [spine, ...wands]) for (let j = 0; j + 1 < points.length; j += 1) along(r, leaves, inside, ...points[j], ...points[j + 1], 19, 7, { spread: 0.62, under: 0.22 });
    twigLine(spine, wil.twig, 2.4);
    for (const points of wands) twigLine(points, wil.twig, 1.4);
    lay(r, leaves, wil, willowLeaf);
  });
  shoot(6, 4493); shoot(7, 4513);

  return { texture: cutoutTexture(canvas), canvas, cells: [2, 4], spray: [0, 1], hung: [2, 3], crown: [4, 5], willow: [6, 7] };
}

// ---------- an alder's bark ----------
// Thin and smooth, and hardly ever its own colour: crusts of lichen cover it in patches of white, ash grey and
// grey-green that meet edge to edge, with the brown-grey bark showing between them here and there; short dark
// dashes across it (its breathing pores), and where a branch was shed an eye with a brow over it. It tiles: one
// sheet goes once round a trunk and 2.4 m up it. (FEIS: "thin, smooth, gray-whitish and mottled, often covered
// with green moss"; PNW-GTR-669 names the crust lichens that make it look white. The moss is the shader's.)
export function alderBark(look) {
  const W = 512, H = 1024, pal = look.palette.alderBark;
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d');
  const relief = makeCanvas(W, H), rtx = relief.getContext('2d', { willReadFrequently: true });
  const r = rng(977);
  ctx.fillStyle = css(pal.bark); ctx.fillRect(0, 0, W, H);
  rtx.fillStyle = 'hsl(0, 0%, 45%)'; rtx.fillRect(0, 0, W, H);
  // one stroke on the painting and, when `grey` is given, on the relief, at every wrapped copy that reaches the tile
  let serial = 0;
  const lay = (x0, y0, x1, y1, width, colour, grey, opts) => {
    const seed = 9000 + (serial += 1), margin = width + 4;
    for (const dx of [-W, 0, W]) {
      if (Math.max(x0, x1) + dx < -margin || Math.min(x0, x1) + dx > W + margin) continue;
      for (const dy of [-H, 0, H]) {
        if (Math.max(y0, y1) + dy < -margin || Math.min(y0, y1) + dy > H + margin) continue;
        stroke(ctx, rng(seed), x0 + dx, y0 + dy, x1 + dx, y1 + dy, width, colour, opts);
        if (grey !== null) stroke(rtx, rng(seed), x0 + dx, y0 + dy, x1 + dx, y1 + dy, width, [0, 0, grey], { ...opts, alpha: 1 });
      }
    }
  };
  // the crusts: broad patches, wider than tall, the palest most of all; each a short fat stroke with a ragged edge
  for (let i = 0; i < 330; i += 1) {
    const x = r() * W, y = r() * H, wide = 30 + 80 * r(), tall = 24 + 56 * r(), k = r();
    const tone = k < 0.48 ? pal.white : k < 0.78 ? pal.ash : k < 0.93 ? pal.green : pal.bark;
    lay(x - wide / 2, y + (r() - 0.5) * 10, x + wide / 2, y + (r() - 0.5) * 10, tall, vary(tone, r, look.paint.vary * 0.7), tone === pal.bark ? 38 : 50 + 8 * r(),
      { ragged: 0.3, lumpy: 0.3, taperIn: 0.22, taperOut: 0.22 });
  }
  // a little of one crust over another: small pale spots, and a darker rim here and there
  for (let i = 0; i < 260; i += 1) {
    const x = r() * W, y = r() * H, wide = 6 + 16 * r();
    lay(x - wide / 2, y, x + wide / 2, y + (r() - 0.5) * 4, 5 + 9 * r(), vary(r() < 0.6 ? shift(pal.white, 0, 0, 4) : pal.green, r, look.paint.vary), null, { ragged: 0.4, taperIn: 0.3, taperOut: 0.3, alpha: 0.85 });
  }
  // its pores: short dark dashes across the trunk, in loose rows
  for (let i = 0; i < 330; i += 1) {
    const x = r() * W, y = Math.floor(r() * 30) * (H / 30) + (r() - 0.5) * 22, wide = 5 + 13 * r();
    lay(x - wide / 2, y, x + wide / 2, y + (r() - 0.5) * 2, 1.6 + 1.4 * r(), shift(pal.scar, 0, 0, 6 * r()), 62, { ragged: 0.2, taperIn: 0.25, taperOut: 0.25, alpha: 0.8 });
  }
  // where a branch was shed: a dark eye, and over it a brow that runs down to either side
  for (let i = 0; i < 6; i += 1) {
    const x = 40 + r() * (W - 80), y = 60 + r() * (H - 120), wide = 13 + 9 * r();
    for (const hand of [-1, 1]) lay(x, y - wide * 0.7, x + hand * wide * 2.3, y + wide * 1.1, 3.2 + 2 * r(), pal.scar, 30, { ragged: 0.3, bend: hand * 0.12, taperIn: 0.1, taperOut: 0.7, alpha: 0.85 });
    lay(x - wide * 0.55, y, x + wide * 0.55, y, wide * 0.8, pal.scar, 16, { ragged: 0.25, taperIn: 0.3, taperOut: 0.3 });
    // (and the stain the rain carries down from it)
    lay(x + (r() - 0.5) * 6, y + wide * 0.5, x + (r() - 0.5) * 10, y + wide * 0.5 + 60 + 90 * r(), 7 + 5 * r(), shift(pal.ash, 0, 0, -10), null, { ragged: 0.3, taperIn: 0.1, taperOut: 0.9, alpha: 0.4 });
  }
  // the drag of a nearly dry brush down everything
  for (let i = 0; i < 260; i += 1) {
    const x = r() * W, y = r() * H, len = 30 + 110 * r();
    lay(x, y, x + (r() - 0.5) * 5, y + len, 1.5 + 3 * r(), r() < 0.5 ? shift(pal.white, 0, 0, 5) : shift(pal.ash, 0, 0, -8), null, { alpha: 0.16 * look.paint.streak });
  }
  const data = rtx.getImageData(0, 0, W, H).data, height = new Float32Array(W * H);
  for (let i = 0; i < W * H; i += 1) height[i] = data[i * 4] / 255;
  return { texture: tileTexture(canvas), normal: normalMapFromHeight(height, W, H, 1.3), canvas };
}
