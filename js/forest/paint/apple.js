import { rng, makeCanvas, css, mix, vary, cutoutTexture } from './brush.js';

// ---------- the apple's sheet ----------
// What grows on the old apple tree in the clearing (plants/apple.js), six cells in a 2 x 3 sheet:
//   `spray`  (3)  the end of a branch seen flat: a crooked twig with side twigs, attached at the middle of the
//                 cell's left edge, and on every one of them short spurs, each with a rosette of leaves at its
//                 end and, where it is in flower, a cluster of blossom over the rosette
//   `side`   (2)  the same seen from beside it: the twig runs along the cell two fifths of the way up it, its
//                 spurs and side twigs stand up from it, and a few hang
//   `sprout` (1)  water sprouts: straight young shoots standing in a row out of the limb that is along the
//                 cell's foot, in leaf and not in flower
// It is in blossom by the handful and not by the flower: a run of spurs in flower and then a run in leaf, one
// spray mostly white and the next mostly green. White dots spread evenly through green are confetti from
// twenty metres and nothing at all from the cabin's window.
//
// What was read (2026-11-15; agents reading a state university's orchard pages, a botanical garden's account
// of the species and a national park's vegetation report; none of it seen as an image): an apple's leaf is 5
// to 9 cm, oval with a point, finely toothed, dark green above and pale and downy beneath; its flowers are 3
// to 5 cm across, of five petals, pink in bud and white when open, in small clusters on short spurs, and open
// with the leaves or just after them. The agent's own: how many flowers a cluster has, how crooked the twigs
// are, and every colour.
// A cell is 512 x 256 and is laid on a card about 1.5 m by 0.75 m, so a leaf 6.5 cm long is some 22 pixels.
const CW = 512, CH = 256, PAD = 9;
const SHAPE = [0, 0.17, 0.28, 0.34, 0.36, 0.34, 0.28, 0.19, 0.09, 0];          // a leaf's half-width, as a share of its length, at ten places along it: an oval with a point

export function appleAtlas(look, detail = 1) {
  const canvas = makeCanvas(CW * 2 * detail, CH * 3 * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pal = look.palette.apple;
  const clipped = (cell, paint) => {
    const ox = (cell % 2) * CW, oy = Math.floor(cell / 2) * CH;
    ctx.save(); ctx.beginPath(); ctx.rect(ox + 1, oy + 1, CW - 2, CH - 2); ctx.clip();
    paint(ox, oy, (x, y, margin = PAD) => x > ox + margin && x < ox + CW - margin && y > oy + margin && y < oy + CH - margin);
    ctx.restore();
  };

  // a leaf: its base at (bx, by), its tip `length` away along `angle`; its midrib pressed into it
  const leaf = (r, bx, by, angle, length, colour) => {
    const c = Math.cos(angle), s = Math.sin(angle), n = SHAPE.length - 1;
    const at = (t, off) => [bx + (c * t - s * off) * length, by + (s * t + c * off) * length];
    ctx.fillStyle = css(colour);
    ctx.beginPath(); ctx.moveTo(bx, by);
    for (let i = 1; i <= n; i += 1) ctx.lineTo(...at(i / n, SHAPE[i] * (1 + 0.05 * (i % 2 ? 1 : -1) * r())));
    for (let i = n - 1; i >= 1; i -= 1) ctx.lineTo(...at(i / n, -SHAPE[i] * (1 + 0.05 * (i % 2 ? -1 : 1) * r())));
    ctx.closePath(); ctx.fill();
    if (length < 12) return;
    ctx.strokeStyle = css(mix(colour, pal.vein, 0.5), 0.75); ctx.lineWidth = Math.max(0.6, length * 0.04);
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(...at(0.92, 0)); ctx.stroke();
  };
  // a flower, `size` from its middle to the middle of a petal: five petals, most of them white and one or two
  // still blushed, round a yellow heart
  const flower = (r, x, y, size) => {
    const turn = r() * 6.2832, open = 0.82 + 0.18 * r();
    for (let k = 0; k < 5; k += 1) {
      const a = turn + k * 1.2566 + (r() - 0.5) * 0.2, px = x + Math.cos(a) * size * open, py = y + Math.sin(a) * size * open;
      ctx.fillStyle = css(vary(r() < 0.28 ? pal.blush : pal.petal, r, look.paint.vary * 0.3));
      ctx.beginPath(); ctx.ellipse(px, py, size * 1.04, size * 0.76, a, 0, 6.2832); ctx.fill();
    }
    ctx.fillStyle = css(pal.heart); ctx.beginPath(); ctx.arc(x, y, size * 0.42, 0, 6.2832); ctx.fill();
  };
  // a bud, not yet open: deep pink, on its own short stalk
  const bud = (r, x, y, angle, size) => {
    ctx.fillStyle = css(vary(pal.bud, r, look.paint.vary * 0.5));
    ctx.beginPath(); ctx.ellipse(x + Math.cos(angle) * size * 0.6, y + Math.sin(angle) * size * 0.6, size * 1.0, size * 0.72, angle, 0, 6.2832); ctx.fill();
  };
  // A crooked line from (x, y): it sets out along `angle` and turns a little at each of its `n` joints, as
  // points. `home` pulls it back towards a height it should keep (a twig along a cell).
  const wand = (r, x, y, angle, length, crook, n, home = null) => {
    const points = [[x, y]];
    let a = angle;
    for (let j = 1; j <= n; j += 1) {
      const [px, py] = points[j - 1];
      a += (r() - 0.5) * crook - (home === null ? 0 : (py - home) * 0.006);
      points.push([px + Math.cos(a) * length / n, py + Math.sin(a) * length / n]);
    }
    return points;
  };
  const line = (points, colour, width) => {
    ctx.strokeStyle = css(colour, 0.96); ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(...points[i]);
    ctx.stroke();
  };

  // One cell's leaves and blossom are first written down, then painted: twigs, leaves (the ones underneath
  // first and darkest: which are light and which dark goes by where a leaf is, a handful together), and over
  // them the blossom, buds before flowers.
  const sketch = (seed, share) => {
    const r = rng(seed), leaves = [], blooms = [], twigs = [], p1 = r() * 6.3, p2 = r() * 6.3;
    // is the spur at (x, y) in flower? In runs: a slow pattern across the cell set against the cell's share
    const flowering = (x, y) => 0.5 + 0.4 * Math.sin(x * 0.021 + p1) * Math.cos(y * 0.034 + p2) + 0.22 * (r() - 0.5) < share;
    // What a spur carries at its end, (x, y), where it points `out`: a rosette of leaves `big` long, and a
    // cluster over it. `hang` turns each leaf towards the foot of the cell, as its own weight does.
    const tuft = (inside, x, y, out, big, { hang = 0, bloom = flowering(x, y), light = 0 } = {}) => {
      if (!inside(x, y)) return;
      // (its leaves leave the spur's end every way, of every length, each from a place of its own: set out as an
      // even fan of equal leaves from one point, a rosette was the five-pointed leaf of a maple)
      const n = 4 + Math.floor(r() * 3), fan = bloom ? 2.7 : 1.9;
      for (let k = 0; k < n; k += 1) {
        const a0 = out + (r() - 0.5) * 2 * fan, a = a0 + hang * Math.cos(a0), long = big * (0.6 + 0.65 * r());
        const bx = x + Math.cos(a) * 2.5 + (r() - 0.5) * 3, by = y + Math.sin(a) * 2.5 + (r() - 0.5) * 3;
        if (!inside(bx + Math.cos(a) * long, by + Math.sin(a) * long)) continue;
        leaves.push({ x: bx, y: by, angle: a, size: long, tier: Math.min(1, r() + light) });
      }
      if (!bloom) return;
      const cx = x + Math.cos(out) * big * 0.3, cy = y + Math.sin(out) * big * 0.3, count = 4 + Math.floor(r() * 3), buds = 1 + Math.floor(r() * 2.4);
      for (let k = 0; k < count + buds; k += 1) {
        const a = r() * 6.2832, far = big * (k < count ? 0.52 * Math.sqrt(r()) : 0.5 + 0.25 * r()), size = big * (0.15 + 0.05 * r());
        const fx = cx + Math.cos(a) * far, fy = cy + Math.sin(a) * far;
        if (!inside(fx - size * 2.1, fy - size * 2.1, PAD - 3) || !inside(fx + size * 2.1, fy + size * 2.1, PAD - 3)) continue;
        blooms.push({ x: fx, y: fy, size, bud: k >= count, angle: a });
      }
    };
    // spurs to either side of a wand by turns, `gap` apart, and one at its end
    const spurs = (inside, points, gap, big, options = {}) => {
      let carried = gap * (0.3 + 0.5 * r()), hand = r() < 0.5 ? 1 : -1;
      for (let j = 0; j + 1 < points.length; j += 1) {
        const [ax, ay] = points[j], [bx, by] = points[j + 1], length = Math.hypot(bx - ax, by - ay), heading = Math.atan2(by - ay, bx - ax);
        while (carried < length) {
          const t = carried / length, px = ax + (bx - ax) * t, py = ay + (by - ay) * t, out = heading + hand * (0.9 + 0.5 * r()), reach = 6 + 9 * r();
          const ex = px + Math.cos(out) * reach, ey = py + Math.sin(out) * reach;
          if (inside(ex, ey)) { twigs.push({ points: [[px, py], [ex, ey]], width: 1.3 }); tuft(inside, ex, ey, out, big * (0.85 + 0.3 * r()), options); }
          hand = -hand; carried += gap * (0.75 + 0.5 * r());
        }
        carried -= length;
      }
      const [ex, ey] = points[points.length - 1], [qx, qy] = points[points.length - 2];
      tuft(inside, ex, ey, Math.atan2(ey - qy, ex - qx), big, options);
    };
    const paintAll = () => {
      for (const twig of twigs) line(twig.points, twig.colour || pal.twig, twig.width);
      const a = r() * 6.3, b = r() * 6.3;
      for (const l of leaves) l.tier = Math.min(1, Math.max(0, l.tier * 0.4 + 0.3 + 0.3 * Math.sin(l.x * 0.03 + a) + 0.22 * Math.sin(l.y * 0.06 + l.x * 0.017 + b)));
      leaves.sort((p, q) => p.tier - q.tier);
      for (const l of leaves) {
        const tone = l.tier < 0.34 ? mix(pal.dark, pal.mid, 0.25 + 0.5 * r()) : l.tier < 0.72 ? mix(pal.mid, pal.light, 0.1 + 0.6 * r()) : mix(pal.light, pal.pale, 0.1 + 0.7 * r());
        leaf(r, l.x, l.y, l.angle, l.size, vary(tone, r, look.paint.vary * 0.6));
      }
      for (const b of blooms) if (b.bud) bud(r, b.x, b.y, b.angle, b.size);
      for (const b of blooms) if (!b.bud) flower(r, b.x, b.y, b.size);
    };
    return { r, twigs, leaves, tuft, spurs, paintAll };
  };

  // ---- a branch end, flat
  const flat = (cell, seed, share) => clipped(cell, (ox, oy, inside) => {
    const { r, twigs, spurs, paintAll } = sketch(seed, share), y0 = oy + CH / 2;
    const spine = wand(r, ox + 3, y0, (r() - 0.5) * 0.16, CW * 0.8, 0.46, 8, y0);
    twigs.push({ points: [[ox - 4, y0], ...spine], width: 3.2 });
    const sides = [];
    for (let k = 1; k <= 6; k += 1) {
      const [sx, sy] = spine[k], [qx, qy] = spine[k - 1], hand = k % 2 ? 1 : -1, t = k / 8;
      const points = wand(r, sx, sy, Math.atan2(sy - qy, sx - qx) + hand * (0.72 + 0.4 * r()), CH * (0.3 + 0.16 * r()) * (1 - 0.3 * t), 0.7, 3);
      sides.push(points); twigs.push({ points, width: 2 });
    }
    spurs(inside, spine, 23, 21);
    for (const points of sides) spurs(inside, points, 20, 20);
    paintAll();
  });
  flat(0, 5113, 0.78); flat(1, 5119, 0.3); flat(5, 5147, 0.55);

  // ---- the same from beside it: the twig along the cell, two fifths of the way up it; side twigs and spurs
  // standing up from it, a few hanging under it, and the leaves under it hanging
  const side = (cell, seed, share) => clipped(cell, (ox, oy, inside) => {
    const { r, twigs, spurs, paintAll } = sketch(seed, share), y0 = oy + CH * 0.6;
    const twig = wand(r, ox + 2, y0, (r() - 0.5) * 0.1, CW - 30, 0.34, 11, y0);
    twigs.push({ points: [[ox - 4, y0], ...twig], width: 3.2 });
    const ups = [], downs = [];
    for (const j of [1, 3, 5, 7, 9]) {
      const [sx, sy] = twig[j], points = wand(r, sx, sy, -(0.62 + 0.55 * r()), CH * (0.26 + 0.2 * r()), 0.7, 3);
      ups.push(points); twigs.push({ points, width: 2 });
    }
    for (const j of [2, 6, 8]) {
      const [sx, sy] = twig[j], points = wand(r, sx, sy, 0.5 + 0.45 * r(), CH * (0.13 + 0.1 * r()), 0.6, 2);
      downs.push(points); twigs.push({ points, width: 1.8 });
    }
    spurs(inside, twig, 22, 21, { hang: 0.3 });
    for (const points of ups) spurs(inside, points, 19, 20, { hang: 0.2 });
    for (const points of downs) spurs(inside, points, 17, 20, { hang: 0.55 });
    paintAll();
  });
  side(2, 5153, 0.72); side(3, 5167, 0.36);

  // ---- water sprouts: straight shoots of the last year or two, standing out of a limb's back in twos and
  // threes, reddish, with a leaf to either side by turns all the way up and a few at the top; no blossom
  clipped(4, (ox, oy, inside) => {
    const { r, twigs, leaves, tuft, paintAll } = sketch(5179, 0), y0 = oy + CH - 3;
    for (const [where, tall] of [[0.07, 0.5], [0.13, 0.82], [0.2, 0.6], [0.36, 0.72], [0.43, 0.9], [0.5, 0.56], [0.66, 0.84], [0.73, 0.62], [0.8, 0.76], [0.92, 0.48]]) {
      const x = ox + CW * (where + (r() - 0.5) * 0.03), points = wand(r, x, y0, -1.5708 + (r() - 0.5) * 0.3, CH * tall * (0.9 + 0.12 * r()), 0.13, 7);
      if (!points.every(([px, py]) => inside(px, py, PAD + 6) || py > y0 - 14)) continue;
      twigs.push({ points, width: 2.3, colour: pal.shoot });
      let hand = r() < 0.5 ? 1 : -1;
      for (let j = 1; j < points.length; j += 1) {
        for (const f of [0.25, 0.75]) {
          const [ax, ay] = points[j - 1], [bx, by] = points[j], px = ax + (bx - ax) * f, py = ay + (by - ay) * f, heading = Math.atan2(by - ay, bx - ax);
          const a = heading + hand * (0.62 + 0.4 * r()), long = 19 + 6 * r();
          hand = -hand;
          if (py > y0 - 12 || !inside(px + Math.cos(a) * long, py + Math.sin(a) * long)) continue;
          leaves.push({ x: px, y: py, angle: a, size: long, tier: 0.45 + 0.55 * r() });
        }
      }
      const [ex, ey] = points[points.length - 1];
      tuft(inside, ex, ey, -1.5708, 17, { bloom: false, light: 0.5 });
    }
    paintAll();
  });

  return { texture: cutoutTexture(canvas), canvas, cells: [2, 3], spray: [0, 1, 5], side: [2, 3], sprout: [4] };
}
