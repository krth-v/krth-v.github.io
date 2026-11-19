import { rng, makeCanvas, css, shift, mix, vary, stroke, cutoutTexture, cutoutTextureSteps, drainSteps, tileTexture, normalMapFromHeight } from './brush.js';

// ---------- the valley's conifers ----------
// The sheet of a conifer that is seen from beside it and from far off (plants/spire.js): the Sitka spruce of
// the river's banks, and the western hemlock of the valley's slopes. One sheet a species, 2048 x 1024:
//   `crown` (2)  the whole crown seen from beside the tree, upright, 384 x 1024 each. The tree's own trunk goes
//                up the middle of the cell and is not painted (plants/alder.js: painted too, it stands beside
//                the real one). Its limbs leave the trunk as the species' do, each clothed in its twigs.
//   `spray` (3)  a bough seen flat, 640 x 256: attached at the middle of the cell's left edge
//   `side`  (3)  a bough seen from beside it, 640 x 256: its limb runs from the left edge to the right, a
//                quarter of the way down the cell (`limbAt`), with its twigs drooping under it and standing over it
// It is painted at one size on every device: no walker comes nearer one of these crowns than a few metres.
// Nothing is cut off by its cell: a cut shows as a ruled edge on the card.
//
// What was read (2026-11-15; agents reading the Forest Service's Silvics and FEIS accounts, the Park Service's
// handbook, university tree pages and a conifer database, each claim then checked against a second source;
// none of it seen as an image). Sitka spruce: an open, conical crown of horizontal branches, "somewhat
// pendulous"; its twigs stout, "not or only slightly pendent"; needles 1.5 to 2.5 cm, stiff and sharp, standing
// out all round the twig, blue-green to light yellow-green (the sources do not agree which), white beneath.
// Western hemlock: a short, narrow crown, a broad cone in a young tree and a cylinder in an old one, its
// branches level or a little drooping, its branchlets' tips hanging at every age, its leader arcing over (the
// Park's handbook: the mark to know it by, "if the top of the tree can be seen"); foliage yellow-green to dark
// green. Not found: when a spruce's buds break at these heights (one unconfirmed snippet said early June), so
// no new growth is painted on it; how far down a trunk the living crown comes in a stand on a slope.
const W = 2048, H = 1024, CROWN_W = 384, CELL_W = 640, CELL_H = 256, PAD = 8, LIMB_AT = 0.26;
const rad = (d) => (d * Math.PI) / 180;

// `spec` is the tree (SPIRES in plants/spire.js): the crown is painted from the same numbers its limbs are built from.
export function spireAtlas(look, spec) { return drainSteps(spireAtlasSteps(look, spec)); }
export function* spireAtlasSteps(look, spec) {
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pal = look.palette[spec.needles], habit = spec.paint;
  // a tone of the foliage, from its darkest (0) to its lightest (1)
  const tone = (k) => (k < 0.4 ? mix(pal.dark, pal.mid, Math.max(0, k) / 0.4) : k < 0.8 ? mix(pal.mid, pal.light, (k - 0.4) / 0.4) : mix(pal.light, pal.tip, Math.min(1, (k - 0.8) / 0.2) * 0.7));
  // A needled twig from (ax, ay) to (bx, by): a dark body, then its needles standing off it, as two sets of short
  // strokes (the second sparser and lighter, a glaze), each set drawn in one go. `needle` is a needle's length
  // and `body` the twig's width, in pixels; `rank` is the angle a needle stands off the twig at; `k` its tone.
  const needled = (r, ax, ay, bx, by, { needle, rank, body, k }) => {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, heading = Math.atan2(dy, dx);
    stroke(ctx, r, ax, ay, bx, by, body, vary(tone(k - 0.22), r, look.paint.vary * 0.6), { ragged: 0.22, taperIn: 0.12, taperOut: 0.6 });
    const count = Math.max(2, Math.round(len / 2.6));
    for (let pass = 0; pass < 2; pass += 1) {
      ctx.beginPath();
      for (let i = 0; i < count; i += 1) {
        const t = (i + r()) / count, px = ax + dx * t, py = ay + dy * t, taper = 1 - 0.5 * t * t, skip = pass === 1 && r() < 0.45;
        for (const hand of [-1, 1]) {
          const a = heading + hand * rank * (0.8 + 0.4 * r()), l = needle * taper * (0.75 + 0.5 * r());
          if (skip) continue;
          ctx.moveTo(px, py - pass * 0.7); ctx.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l - pass * 0.7);
        }
      }
      ctx.strokeStyle = css(vary(tone(pass === 0 ? k : k + 0.28), r, look.paint.vary * 0.7), pass === 0 ? 0.95 : 0.9);
      ctx.lineWidth = pass === 0 ? 1.8 : 1.2;
      ctx.stroke();
    }
  };
  const clip = (ox, oy, wide, tall) => { ctx.save(); ctx.beginPath(); ctx.rect(ox + 1, oy + 1, wide - 2, tall - 2); ctx.clip(); };

  // ---- the whole crown, from beside it. Metres: x out from the trunk, y up from the tree's foot.
  const crown = (ox, oy, seed) => {
    const r = rng(seed), [low, high] = spec.span, s = H / (high - low);
    const X = (m) => ox + CROWN_W / 2 + m * s, Y = (m) => oy + (high - m) * s;
    const [from, to] = spec.crown;
    const inside = (x, y, margin = 0.32) => Math.abs(x) < Math.min(spec.halfAt(y), spec.halfCell - 0.25) - margin && y > low + 0.3 && y < high - 0.25;
    clip(ox, oy, CROWN_W, H);
    // The limbs that are seen in profile, to one side and the other (`fore`: one that points a little towards
    // whoever is looking, or away, is as long as the rest and reaches less far across the picture; it droops
    // as far), and the ones that point straight at whoever is looking, which are seen end-on, each a tuft of
    // hanging twigs in front of the trunk. Without those a crown seen from beside it was a fish's backbone.
    const tiers = [];
    for (let i = 0; i < habit.profile; i += 1) {
      const t = Math.pow((i + 0.7 * r()) / habit.profile, 0.95), hand = (i % 2 ? 1 : -1) * (r() < 0.85 ? 1 : -1);
      tiers.push({ t, h: from + (to - from) * t, hand, fore: 0.45 + 0.55 * Math.sqrt(r()), L: spec.spread(t) * (0.85 + 0.25 * r()), sl: Math.tan(rad(spec.rise(t) + (r() - 0.5) * 8)) });
    }
    for (let i = 0; i < habit.facing; i += 1) {
      const t = Math.pow((i + r()) / habit.facing, 0.95), L = spec.spread(t) * (0.85 + 0.25 * r());
      tiers.push({ t, h: from + (to - from) * t, L, face: true, x: (r() - 0.5) * 1.1 * L });
    }
    tiers.sort((a, b) => a.h - b.h);           // from the lowest up: a bough hangs over the one below it
    const at = (l, v) => [l.hand * l.L * l.fore * v, l.h + l.L * (l.sl * v - spec.sag * v * v + spec.upturn * Math.pow(v, 4))];
    // its own shade: the boughs that point away, a dark mass over the trunk from the lowest limb up
    for (let h = from + 0.6; h < to - 0.5; h += 0.4) {
      const t = (h - from) / (to - from), wide = habit.core * spec.spread(t) + 0.12;
      for (let k = 0; k < 3; k += 1) {
        const x1 = (r() - 0.5) * wide, x2 = x1 + (r() - 0.5) * 2 * wide, drop = 0.5 + 0.9 * r();
        if (!inside(x2, h - drop, 0.1)) continue;
        stroke(ctx, r, X(x1), Y(h), X(x2), Y(h - drop), (0.4 + 0.5 * r()) * s * Math.min(1, wide + 0.35), vary(tone(0.04 + 0.2 * r() + 0.12 * t), r, look.paint.vary * 0.6),
          { ragged: 0.35, lumpy: 0.3, taperIn: 0.25, taperOut: 0.4 });
      }
    }
    const twigged = (bx, by, ex, ey, k, scale = 1) => {
      if (!inside(ex, ey)) return false;
      needled(r, X(bx), Y(by), X(ex), Y(ey), { needle: habit.needle * scale, rank: habit.rank, body: habit.body * s * (0.7 + 0.5 * r()) * scale, k });
      return true;
    };
    for (const l of tiers) {
      const high_ = 0.22 * l.t;                                                       // the higher in the crown, the more sky on it
      if (l.face) {
        // end-on: its twigs fan out and down from where it comes forward, the longest straight down; two short
        // ones over them have the sky on them
        const tall = 0.26 * l.L + habit.hang[1] * (1 - 0.45 * l.t), n = 5 + Math.floor(2.5 * r()), y0 = l.h - 0.1 * l.L;
        for (let j = 0; j < n; j += 1) {
          const a = ((j + 0.5 * r()) / (n - 0.5) - 0.5) * 2.1, len = tall * (0.55 + 0.45 * r()) * (1 - 0.3 * Math.abs(a));
          twigged(l.x + Math.sin(a) * 0.18, y0, l.x + Math.sin(a) * len * 0.8, y0 - Math.cos(a) * len, 0.18 + 0.26 * r() + high_ + 0.1 * Math.abs(a));
        }
        for (const hand of [-1, 1]) { const up = habit.over * (0.5 + 0.5 * r()); twigged(l.x, y0, l.x + hand * up * 0.9, y0 + up * 0.35, 0.5 + high_ + 0.12 * r()); }
        continue;
      }
      const reach = Math.sqrt(l.fore);
      ctx.strokeStyle = css(look.palette.twig, 0.9); ctx.lineWidth = Math.max(1, (0.04 + 0.018 * l.L) * s);
      ctx.beginPath();
      // (as far as the card goes: the longest of the lowest limbs reach past its outline, and ended in a ruled cut)
      for (let j = 0; j <= 10; j += 1) { const [x, y] = at(l, j / 10); if (j === 0) ctx.moveTo(X(x), Y(y)); else if (inside(x, y, 0.12)) ctx.lineTo(X(x), Y(y)); else break; }
      ctx.stroke();
      const n = Math.max(3, Math.round(l.L / habit.every));
      for (let k = 0; k < n; k += 1) {
        const v = 0.1 + 0.9 * (k + 0.2 + 0.6 * r()) / n, [bx, by] = at(l, v), swell = Math.sin(Math.PI * Math.pow(v, 0.7));
        // the twig under the limb: out and down
        const len = (habit.hang[0] + (habit.hang[1] - habit.hang[0]) * swell) * (1 - 0.45 * l.t) * (0.75 + 0.5 * r()), a = habit.lean * (0.75 + 0.5 * r());
        twigged(bx, by, bx + l.hand * Math.cos(a) * len * reach, by - Math.sin(a) * len, 0.16 + 0.3 * v + high_ + 0.15 * r());
        // and, at every other one, the twig over it: shorter, up and out, with the sky on it
        if (k % 2 === 0) {
          const up = habit.over * (0.7 + 0.6 * r()) * (1 - 0.4 * l.t), b = 0.5 + 0.5 * r();
          twigged(bx, by, bx + l.hand * Math.cos(b) * up * reach, by + Math.sin(b) * up, 0.42 + 0.28 * v + high_ + 0.12 * r());
        }
      }
      // its end: three twigs fanned, the lightest of the limb
      const [tx, ty] = at(l, 1), [qx, qy] = at(l, 0.9), heading = Math.atan2(ty - qy, tx - qx);
      for (const turn of [-0.55, 0.05, 0.6]) {
        const len = (0.45 + 0.4 * r()) * (1 - 0.3 * l.t), a = heading + turn;
        twigged(qx, qy, qx + Math.cos(a) * len, qy + Math.sin(a) * len, 0.6 + high_ + 0.15 * r());
      }
    }
    // the leader: a spruce's stands straight, with its last whorls of short twigs; a hemlock's arcs over
    const nod = habit.nod * (r() < 0.5 ? -1 : 1), top = Math.min(high - 0.5, to + habit.leader);
    const lead = (u) => [nod * u * u, to - 1.2 + (top - to + 1.2) * (u - habit.arc * u * u * u)];
    for (let j = 0; j < 6; j += 1) {
      const [ax, ay] = lead(j / 6), [bx, by] = lead((j + 1) / 6);
      twigged(ax, ay, bx, by, 0.5 + 0.06 * j, 1.15);
      if (j < 5) for (const hand of [-1, 1]) { const len = (0.75 - 0.1 * j) * (0.8 + 0.4 * r()); twigged(ax, ay, ax + hand * len * 0.8, ay + len * habit.whorl, 0.55 + 0.05 * j); }
    }
    ctx.restore();
    return [ox / W, 0, (ox + CROWN_W) / W, 1];
  };

  // ---- the cells of single boughs: two columns to the right of the crowns, four rows
  const cellAt = (i) => {
    const ox = 2 * CROWN_W + (i % 2) * CELL_W, oy = Math.floor(i / 2) * CELL_H;
    return { ox, oy, rect: [ox / W, 1 - (oy + CELL_H) / H, (ox + CELL_W) / W, 1 - oy / H], inside: (x, y) => x > ox + PAD && x < ox + CELL_W - PAD && y > oy + PAD && y < oy + CELL_H - PAD };
  };
  const pair = { needle: habit.needlePx, rank: habit.rank, body: habit.bodyPx };
  // a twig of a bough, and its twiglets to either side by turns
  const branch = (r, inside, ax, ay, a, len, k) => {
    const ex = ax + Math.cos(a) * len, ey = ay + Math.sin(a) * len;
    if (!inside(ex, ey)) return;
    needled(r, ax, ay, ex, ey, { ...pair, k });
    for (let j = 1; j <= habit.sub; j += 1) {
      const q = j / (habit.sub + 1), px = ax + (ex - ax) * q, py = ay + (ey - ay) * q, a2 = a + (j % 2 ? 1 : -1) * (0.55 + 0.3 * r()), l2 = len * 0.42 * (1 - 0.5 * q);
      const qx = px + Math.cos(a2) * l2, qy = py + Math.sin(a2) * l2;
      if (inside(qx, qy)) needled(r, px, py, qx, qy, { ...pair, needle: pair.needle * 0.85, k: k + 0.12 });
    }
  };
  // a bough seen flat: a limb's end with its side twigs to either hand, longest a quarter of the way out
  const spray = (i, seed) => {
    const { ox, oy, rect, inside } = cellAt(i), r = rng(seed), y0 = oy + CELL_H / 2, length = CELL_W * (0.8 + 0.06 * r());
    clip(ox, oy, CELL_W, CELL_H);
    const spine = (t) => [ox + 4 + length * t, y0 + CELL_H * 0.04 * Math.sin(t * 2.6 + seed)];
    ctx.strokeStyle = css(look.palette.twig, 0.9); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ox + 1, y0); for (let j = 1; j <= 18; j += 1) ctx.lineTo(...spine(j * 0.04)); ctx.stroke();
    // (and on, thinner, under its last twigs to where its end twig leaves it)
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(...spine(0.72)); for (let j = 19; j <= 23; j += 1) ctx.lineTo(...spine(Math.min(0.9, j * 0.04))); ctx.stroke();
    for (let k = 0; k < 22; k += 1) {
      const t = 0.04 + 0.9 * (k + 0.5 * r()) / 22, [sx, sy] = spine(t);
      const reach = CELL_H * 0.42 * Math.pow(1 - t, 0.6) * Math.min(1, 0.3 + t / 0.12) * (0.8 + 0.35 * r());
      for (const hand of [-1, 1]) { if (r() < 0.06) continue; branch(r, inside, sx, sy, hand * (habit.flatLean + (r() - 0.5) * 0.3), reach, 0.3 + 0.3 * t + 0.15 * r()); }
    }
    const [tx, ty] = spine(0.9);
    branch(r, inside, tx, ty, 0, CELL_W * 0.09, 0.62);
    ctx.restore();
    return rect;
  };
  // a bough seen from beside it: the limb a quarter of the way down the cell, sagging and then, for a spruce,
  // lifting at its tip; its twigs out and down under it, and shorter ones up and out over it
  const side = (i, seed) => {
    const { ox, oy, rect, inside } = cellAt(i), r = rng(seed), y0 = oy + CELL_H * LIMB_AT, x0 = ox + 3, x1 = ox + CELL_W - 26;
    clip(ox, oy, CELL_W, CELL_H);
    const limb = (v) => [x0 + (x1 - x0) * v, y0 + CELL_H * (habit.sideSag * v * v - habit.sideLift * Math.pow(v, 4))];
    ctx.strokeStyle = css(look.palette.twig, 0.92);
    for (let j = 0; j < 12; j += 1) { ctx.lineWidth = 5.5 - 0.36 * j; ctx.beginPath(); ctx.moveTo(...limb(j / 12)); ctx.lineTo(...limb((j + 1) / 12)); ctx.stroke(); }
    const n = 30;
    for (let k = 0; k < n; k += 1) {
      const v = 0.04 + 0.95 * (k + 0.2 + 0.6 * r()) / n, [bx, by] = limb(v), swell = Math.sin(Math.PI * Math.pow(v, 0.75));
      branch(r, inside, bx, by, habit.lean * (0.75 + 0.5 * r()), CELL_H * (0.2 + 0.36 * swell) * (0.75 + 0.5 * r()), 0.2 + 0.32 * v + 0.2 * r());
      if (k % 2 === 0) branch(r, inside, bx, by, -(0.55 + 0.5 * r()), CELL_H * (0.07 + 0.09 * r()), 0.5 + 0.3 * v);
    }
    const [tx, ty] = limb(0.97), [qx, qy] = limb(0.9), heading = Math.atan2(ty - qy, tx - qx);
    for (const turn of [-0.5, 0.1, 0.6]) branch(r, inside, tx, ty, heading + turn, CELL_H * (0.1 + 0.05 * r()), 0.66);
    ctx.restore();
    return rect;
  };

  // (in the order they were always painted: the two crowns, the three boughs seen flat, the three from beside)
  const crowns = [crown(0, 0, spec.seed + 11)];
  crowns.push(crown(CROWN_W, 0, spec.seed + 48));
  const sprays = [0, 2, 4].map((i, k) => spray(i, spec.seed + 101 + k * 13)), sides = [1, 3, 5].map((i, k) => side(i, spec.seed + 151 + k * 17));
  yield 'boughs';
  const sheet = { crown: crowns, spray: sprays, side: sides,
    // where the limb of a bough seen from beside it is painted: [share of the way along the cell, share of the way down it] at its two ends
    limb: { from: [3 / CELL_W, LIMB_AT], to: [(CELL_W - 26) / CELL_W, LIMB_AT + habit.sideSag - habit.sideLift] } };
  return { texture: yield* cutoutTextureSteps(canvas), canvas, ...sheet };
}

// ---------- a Sitka spruce's bark ----------
// Thin, and in scales: loose, roundish plates a hand's breadth or less across that curl away from the trunk at
// their lower edges, greyish purple, silver where they have weathered and red-brown where one has lately gone.
// It tiles: one sheet goes a third of the way round a trunk a metre through, and 2.4 m up it. (What was read,
// as above: "thin, scaly", "greyish-purple with circular scales about 2 inches wide", "dark purplish-brown
// with scaly plates", "thin silvery-gray scaly bark", "reddish to greyish-brown, in small rough scales".)
export function spruceBark(look) {
  const BW = 512, BH = 1024, pal = look.palette.spruceBark;
  const canvas = makeCanvas(BW, BH), ctx = canvas.getContext('2d');
  const relief = makeCanvas(BW, BH), rtx = relief.getContext('2d', { willReadFrequently: true });
  const r = rng(1543);
  ctx.fillStyle = css(pal.furrow); ctx.fillRect(0, 0, BW, BH);
  rtx.fillStyle = 'hsl(0, 0%, 26%)'; rtx.fillRect(0, 0, BW, BH);
  // one stroke on the painting and, when `grey` is given, on the relief, at every wrapped copy that reaches the tile
  let serial = 0;
  const lay = (x0, y0, x1, y1, width, colour, grey, opts) => {
    const seed = 7000 + (serial += 1), margin = width + 4;
    for (const dx of [-BW, 0, BW]) {
      if (Math.max(x0, x1) + dx < -margin || Math.min(x0, x1) + dx > BW + margin) continue;
      for (const dy of [-BH, 0, BH]) {
        if (Math.max(y0, y1) + dy < -margin || Math.min(y0, y1) + dy > BH + margin) continue;
        stroke(ctx, rng(seed), x0 + dx, y0 + dy, x1 + dx, y1 + dy, width, colour, opts);
        if (grey !== null) stroke(rtx, rng(seed), x0 + dx, y0 + dy, x1 + dx, y1 + dy, width, [0, 0, grey], { ...opts, alpha: 1 });
      }
    }
  };
  // the scales, the later over the earlier: each a short fat dab a little taller than wide
  for (let i = 0; i < 1500; i += 1) {
    const x = r() * BW, y = r() * BH, wide = 15 + 21 * r(), tall = wide * (0.95 + 0.6 * r()), k = r();
    const colour = k < 0.66 ? pal.face : k < 0.9 ? mix(pal.face, pal.ridge, 0.6) : k < 0.95 ? mix(pal.face, pal.rust, 0.6) : shift(pal.furrow, 0, 0, 6);
    lay(x, y - tall / 2, x + (r() - 0.5) * 5, y + tall / 2, wide, vary(colour, r, look.paint.vary * 0.6), k >= 0.9 && k < 0.95 ? 40 : 52 + 14 * r(), { ragged: 0.3, lumpy: 0.25, taperIn: 0.3, taperOut: 0.3 });
    // its lower edge has curled away from the trunk: a pale lip, and the dark under it
    lay(x - wide * 0.34, y + tall * 0.4, x + wide * 0.34, y + tall * 0.43, 2.2, pal.ridge, 74, { ragged: 0.3, bend: 0.12, taperIn: 0.3, taperOut: 0.3, alpha: 0.4 });
    lay(x - wide * 0.3, y + tall * 0.52, x + wide * 0.3, y + tall * 0.55, 2.6, shift(pal.furrow, 0, 0, -2), 12, { ragged: 0.3, bend: 0.12, taperIn: 0.3, taperOut: 0.3, alpha: 0.55 });
  }
  // a little pale lichen, and the drag of a nearly dry brush down everything
  for (let i = 0; i < 90; i += 1) {
    const x = r() * BW, y = r() * BH, wide = 7 + 15 * r();
    lay(x - wide / 2, y, x + wide / 2, y + (r() - 0.5) * 4, 5 + 8 * r(), vary(shift(pal.ridge, 70, 4, 10), r, look.paint.vary), null, { ragged: 0.4, taperIn: 0.3, taperOut: 0.3, alpha: 0.5 });
  }
  for (let i = 0; i < 320; i += 1) {
    const x = r() * BW, y = r() * BH, len = 30 + 110 * r();
    lay(x, y, x + (r() - 0.5) * 5, y + len, 1.5 + 3 * r(), r() < 0.5 ? shift(pal.ridge, 0, -2, 5) : shift(pal.furrow, 0, 0, -3), null, { alpha: 0.18 * look.paint.streak });
  }
  const data = rtx.getImageData(0, 0, BW, BH).data, height = new Float32Array(BW * BH);
  for (let i = 0; i < BW * BH; i += 1) height[i] = data[i * 4] / 255;
  return { texture: tileTexture(canvas), normal: normalMapFromHeight(height, BW, BH, 1.0), canvas };
}
