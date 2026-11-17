import { rng, makeCanvas, css, mix, vary, stroke, cutoutTexture } from './brush.js';

// ---------- the shrubs' sheet ----------
// What grows between the ferns and the trees (plants/shrubs.js), as it is in the middle of May. Two columns of
// cells 512 x 256, six rows. In every cell the plant's own axis runs from the middle of the left edge to the
// right: a card is laid with its attached end at the left.
//   salmonberry   0, 1   a cane seen from beside it, its side shoots above and below it by turns
//                 2, 3   the end of a shoot seen flat
//   elderberry    4      a stem seen from beside it, its leaves in opposite pairs, a flower head at its end
//                 5      the end of a stem seen flat, with its flower heads
//   devil's club  row 3: two leaves, each on a square of 256 (the leaf-stalk comes in at the middle of the left
//                 edge), and two lengths of stem, each a strip of 512 x 64
//   huckleberry   8, 9   a fan of twigs seen from beside it
//   bracken       10     a frond seen flat: its stalk, then its blade, three times cut
//                 11     a young frond, its end still rolled
// It is painted at one size on every device.
//
// What was read (2026-11-15; agents reading the Burke Herbarium, the Forest Service's FEIS accounts, the
// Olympic National Forest's plant pages and the Park Service's, each claim then put to a second source; none
// of it seen as an image). Salmonberry: 2 to 4 m, erect and branching, its bark yellowish brown and shredding,
// leaves of three sharply toothed leaflets, flowers pink to reddish purple from March into June, fruit from
// May or June: so in the middle of May it is in full leaf with its last flowers and perhaps its first
// berries. Red elderberry: 2 to 6 m, about three stems, leaves opposite and of five to seven lance-shaped
// leaflets 5 to 15 cm long, flowers April to July in Washington in a pyramid-shaped head. Devil's club: 1 to
// 3 m, sparsely branched and densely prickly, leaves like a maple's, 10 to 35 cm across with seven to nine
// shallow lobes; it flowers from May to July, so in mid-May it is likely not yet open. Red huckleberry: 1.8
// to 3.6 m, bright green twigs sharply angled, leaves 1 to 3 cm, on nurse logs, stumps and snags; its small
// pinkish flowers are out from April to June. Bracken: fronds come up from March to early May and reach 1.8 m
// in the season; how tall it stands in the middle of May was not found. The agent's own, from no source: every
// colour here, how a cane or a frond is drawn, and how much of each plant is in flower.
const CW = 512, CH = 256, PAD = 8, ROWS = 6;

export function shrubAtlas(look) {
  const canvas = makeCanvas(CW * 2, CH * ROWS), ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = look.palette;

  // a box of the sheet: paint(ox, oy, inside, wide, tall), clipped to the box
  const box = (ox, oy, wide, tall, paint) => {
    ctx.save(); ctx.beginPath(); ctx.rect(ox + 1, oy + 1, wide - 2, tall - 2); ctx.clip();
    paint(ox, oy, (x, y, margin = PAD) => x > ox + margin && x < ox + wide - margin && y > oy + margin && y < oy + tall - margin, wide, tall);
    ctx.restore();
  };
  const cellBox = (cell, paint) => box((cell % 2) * CW, Math.floor(cell / 2) * CH, CW, CH, paint);
  // A leaf blade as a path: its base at (bx, by), its tip `length` away along `angle`. `shape` is its
  // half-width, as a share of its length, at eight places along it; `teeth` roughens its edge.
  const TOOTHED = [0, 0.17, 0.26, 0.285, 0.25, 0.18, 0.09, 0], BROAD = [0, 0.12, 0.19, 0.215, 0.2, 0.15, 0.08, 0], LANCE = [0, 0.1, 0.15, 0.165, 0.15, 0.115, 0.06, 0], OVAL = [0, 0.2, 0.3, 0.33, 0.32, 0.27, 0.17, 0];
  const blade = (r, bx, by, angle, length, shape, teeth) => {
    const c = Math.cos(angle), s = Math.sin(angle), n = shape.length - 1;
    const at = (t, off) => [bx + (c * t - s * off) * length, by + (s * t + c * off) * length];
    ctx.beginPath(); ctx.moveTo(bx, by);
    for (let i = 1; i <= n; i += 1) ctx.lineTo(...at(i / n, shape[i] * (1 + teeth * (i % 2 ? 1 : -1) * (0.5 + 0.5 * r()))));
    for (let i = n - 1; i >= 1; i -= 1) ctx.lineTo(...at(i / n, -shape[i] * (1 + teeth * (i % 2 ? -1 : 1) * (0.5 + 0.5 * r()))));
    ctx.closePath(); ctx.fill();
  };
  const rib = (bx, by, angle, length, colour, width) => {
    ctx.strokeStyle = css(colour, 0.7); ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(angle) * length * 0.92, by + Math.sin(angle) * length * 0.92); ctx.stroke();
  };
  const line = (points, colour, width, alpha = 0.96) => {
    ctx.strokeStyle = css(colour, alpha); ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(...points[i]);
    ctx.stroke();
  };
  // The leaves of one box, the ones underneath first and darkest. Which are light and which dark goes by where
  // a leaf is in the box, a handful together (paint/maple.js: every leaf's tone its own is confetti).
  const lay = (r, leaves, colours, draw) => {
    const a = r() * 6.3, b = r() * 6.3;
    for (const l of leaves) l.tier = Math.min(1, Math.max(0, l.tier * 0.4 + 0.3 + 0.3 * Math.sin(l.x * 0.03 + a) + 0.22 * Math.sin(l.y * 0.06 + l.x * 0.017 + b)));
    leaves.sort((p, q) => p.tier - q.tier);
    for (const l of leaves) {
      const tone = l.tier < 0.34 ? mix(colours.dark, colours.mid, 0.25 + 0.5 * r()) : l.tier < 0.72 ? mix(colours.mid, colours.light, 0.1 + 0.6 * r()) : mix(colours.light, colours.pale, 0.1 + 0.7 * r());
      draw(r, l, vary(tone, r, look.paint.vary * 0.6));
    }
  };

  // ================= salmonberry =================
  const sal = P.salmon;
  // A leaf of three leaflets on a stalk from (x, y): the end one the largest, on a short stalk of its own, and
  // the side pair set back from it and out, so that there is air between the three; each sharply toothed.
  // Returns null, and draws nothing, if any of it would leave the box. (Three broad leaflets from one point
  // ran together into one lobed leaf: an ivy's.)
  const trefoil = (inside, x, y, angle, size) => {
    const jx = x + Math.cos(angle) * size * 0.26, jy = y + Math.sin(angle) * size * 0.26;
    const sx = jx + Math.cos(angle) * size * 0.15, sy = jy + Math.sin(angle) * size * 0.15;
    const parts = [[sx, sy, angle, size * 0.92], [jx, jy, angle + 1.32, size * 0.68], [jx, jy, angle - 1.32, size * 0.68]];
    for (const [px, py, a, long] of parts) if (!inside(px + Math.cos(a) * long, py + Math.sin(a) * long) || !inside(px + Math.cos(a + 0.5) * long * 0.6, py + Math.sin(a + 0.5) * long * 0.6) || !inside(px + Math.cos(a - 0.5) * long * 0.6, py + Math.sin(a - 0.5) * long * 0.6)) return null;
    return parts;
  };
  const drawTrefoil = (r, l, colour) => {
    line([[l.x, l.y], [l.parts[0][0], l.parts[0][1]]], sal.cane, 1.2, 0.9);
    for (const [px, py, a, long] of l.parts) {
      ctx.fillStyle = css(colour);
      blade(r, px, py, a, long, TOOTHED, 0.3);
      if (long > 14) rib(px, py, a, long, mix(colour, sal.vein, 0.6), Math.max(0.6, long * 0.03));
    }
  };
  // a flower: five petals of pink going to purple round a pale middle, a little larger than life so that it reads
  const bloom = (r, x, y, big = 7) => {
    const turn = r() * 6.3;
    for (let k = 0; k < 5; k += 1) {
      const a = turn + (k / 5) * 6.2832;
      ctx.fillStyle = css(vary(sal.flower, r, 0.6));
      ctx.save(); ctx.translate(x + Math.cos(a) * big * 0.62, y + Math.sin(a) * big * 0.62); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, big * 0.72, big * 0.42, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = css([52, 60, 78]); ctx.beginPath(); ctx.arc(x, y, big * 0.3, 0, 6.2832); ctx.fill();
  };
  // a berry: a knot of little beads, orange going to red
  const berry = (r, x, y) => {
    for (let k = 0; k < 6; k += 1) {
      const a = k * 1.047 + r(), far = k === 0 ? 0 : 2.6;
      ctx.fillStyle = css(vary(sal.berry, r, 0.8)); ctx.beginPath(); ctx.arc(x + Math.cos(a) * far, y + Math.sin(a) * far, 2.3, 0, 6.2832); ctx.fill();
    }
  };
  // A cane seen from beside it: it kinks a little at every node, and at every node a side shoot leaves it,
  // above and below by turns, with a leaf where it leaves, one or two along it and one at its end.
  const cane = (cell, seed) => cellBox(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH * 0.5, leaves = [], twigs = [], blooms = [], berries = [], NODES = 16, points = [];
    for (let k = 0; k <= NODES; k += 1) { const t = k / NODES; points.push([ox + 2 + (CW - 46) * t, y0 + (k % 2 ? -1 : 1) * 3.5 * (1 - 0.4 * t) + CH * 0.05 * Math.sin(t * 2.6 + seed)]); }
    const leaf = (x, y, angle, size, tier) => { const parts = trefoil(inside, x, y, angle, size); if (parts) leaves.push({ x, y, parts, tier }); };
    // (a cane's card is nearly three metres long, so a leaf here is small: under a hand's length on the card)
    const shoot = (sx, sy, a, reach, hand, depth) => {
      const ex = sx + Math.cos(a) * reach, ey = sy + Math.sin(a) * reach;
      twigs.push([[sx, sy], [sx + (ex - sx) * 0.5 + hand * 2.5, sy + (ey - sy) * 0.5 - 2.5], [ex, ey]]);
      const n = Math.max(2, Math.round(reach / 17));
      for (let j = 0; j <= n; j += 1) {
        const f = j / n, turn = j === n ? 0 : (j % 2 ? 0.85 : -0.85);
        leaf(sx + (ex - sx) * f, sy + (ey - sy) * f, a + turn + (r() - 0.5) * 0.4, 15 + 8 * r(), r());
      }
      if (depth > 0 && reach > 44) shoot(sx + (ex - sx) * 0.5, sy + (ey - sy) * 0.5, a + (r() < 0.5 ? -1 : 1) * (0.6 + 0.3 * r()), reach * (0.45 + 0.2 * r()), hand, depth - 1);
      const pick = r();
      if (pick < 0.26) blooms.push([sx + (ex - sx) * 0.75 + 7 * hand, sy + (ey - sy) * 0.75 + 6]);
      else if (pick < 0.4) berries.push([sx + (ex - sx) * 0.55 - 6 * hand, sy + (ey - sy) * 0.55 + 5]);
    };
    for (let k = 1; k < NODES; k += 1) {
      const [sx, sy] = points[k], hand = k % 2 ? -1 : 1, t = k / NODES;
      shoot(sx, sy, hand * (0.8 + 0.45 * r()), CH * (0.2 + 0.24 * Math.sin(Math.PI * Math.pow(t, 0.75))) * (0.75 + 0.5 * r()), hand, 1);
    }
    leaf(points[NODES][0], points[NODES][1], 0.1, 22, 0.8);
    for (const twig of twigs) line(twig, mix(sal.cane, sal.mid, 0.35), 1.7);
    line(points, sal.cane, 3.4);
    line(points.slice(0, 5), mix(sal.cane, [30, 30, 22], 0.5), 4.4);              // (older and darker towards its foot)
    lay(r, leaves, sal, drawTrefoil);
    for (const [x, y] of blooms) if (inside(x, y, 12)) bloom(r, x, y, 6);
    for (const [x, y] of berries) if (inside(x, y, 10)) berry(r, x, y);
  });
  cane(0, 5101); cane(1, 5113);
  // The end of a shoot seen flat: a twig with side twigs to either side by turns, and leaves on all of them
  // spread level, so that the whole is one broad spray.
  const salmonSpray = (cell, seed) => cellBox(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH / 2, leaves = [], twigs = [], blooms = [];
    const spine = (t) => [ox + 3 + CW * 0.8 * t, y0 + CH * 0.05 * Math.sin(t * 3 + seed)];
    const leaf = (x, y, angle, size, tier) => { const parts = trefoil(inside, x, y, angle, size); if (parts) leaves.push({ x, y, parts, tier }); };
    for (let k = 0; k < 9; k += 1) {
      const t = 0.06 + 0.86 * (k + 0.4 * r()) / 9, hand = k % 2 ? 1 : -1, [sx, sy] = spine(t);
      const reach = CH * (0.2 + 0.2 * Math.sin(Math.PI * Math.pow(t, 0.6))) * (0.8 + 0.4 * r()), a = hand * (0.7 + 0.35 * r());
      const ex = sx + Math.cos(a) * reach, ey = sy + Math.sin(a) * reach;
      twigs.push([[sx, sy], [ex, ey]]);
      leaf(sx, sy, a * 0.4 - hand * 0.5, 30 + 10 * r(), r());
      leaf(sx + (ex - sx) * 0.55, sy + (ey - sy) * 0.55, a + hand * 0.7, 30 + 12 * r(), r());
      leaf(ex, ey, a, 34 + 12 * r(), r());
      if (r() < 0.25) blooms.push([sx + (ex - sx) * 0.8, sy + (ey - sy) * 0.8 - hand * 9]);
    }
    leaf(...spine(1), 0, 38, 0.9);
    for (const twig of twigs) line(twig, mix(sal.cane, sal.mid, 0.35), 1.6);
    line(Array.from({ length: 13 }, (_, k) => spine(k / 12)), sal.cane, 2.6);
    lay(r, leaves, sal, drawTrefoil);
    for (const [x, y] of blooms) if (inside(x, y, 12)) bloom(r, x, y, 8);
  });
  salmonSpray(2, 5147); salmonSpray(3, 5153);

  // ================= red elderberry =================
  const eld = P.elder;
  // a leaf of five or seven lance-shaped leaflets along a stalk from (x, y): pairs to either side, and one at its end
  const pinnate = (r, leaves, inside, x, y, angle, length, pairs, size) => {
    const ex = x + Math.cos(angle) * length, ey = y + Math.sin(angle) * length;
    if (!inside(ex + Math.cos(angle) * size, ey + Math.sin(angle) * size, 4)) return false;
    const add = (px, py, a, long) => { if (inside(px + Math.cos(a) * long, py + Math.sin(a) * long, 4)) leaves.push({ x: px, y: py, angle: a, size: long, tier: r(), stalk: [[x, y], [ex, ey]] }); };
    for (let k = 1; k <= pairs; k += 1) {
      const f = 0.3 + 0.7 * (k / (pairs + 0.6)), px = x + (ex - x) * f, py = y + (ey - y) * f;
      for (const hand of [-1, 1]) add(px, py, angle + hand * (1.0 + 0.15 * r()), size * (0.82 + 0.3 * r()));
    }
    add(ex, ey, angle, size * 1.05);
    return [[x, y], [ex, ey]];
  };
  const drawLance = (r, l, colour) => {
    ctx.fillStyle = css(colour);
    blade(r, l.x, l.y, l.angle, l.size, BROAD, 0.14);
    if (l.size > 16) rib(l.x, l.y, l.angle, l.size, mix(colour, eld.vein, 0.6), 0.9);
  };
  // a flower head: a pyramid of small cream flowers on stalks that fork and fork again
  const head = (r, x, y, angle, long, wide) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    line([[x, y], [x + c * long * 0.85, y + s * long * 0.85]], eld.bud, 1.4, 0.9);
    for (let k = 0; k < 150; k += 1) {
      const t = Math.pow(r(), 0.8), off = (r() - 0.5) * 2 * wide * (1 - t * 0.85) * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, t + 0.25))), px = x + c * long * t - s * off, py = y + s * long * t + c * off;
      ctx.fillStyle = css(vary(r() < 0.25 ? eld.bud : eld.flower, r, 0.5)); ctx.beginPath(); ctx.arc(px, py, 1.5 + 1.2 * r(), 0, 6.2832); ctx.fill();
    }
  };
  const round = (r, x, y, big) => {
    for (let k = 0; k < 170; k += 1) {
      const a = r() * 6.2832, far = big * Math.sqrt(r());
      ctx.fillStyle = css(vary(r() < 0.22 ? eld.bud : eld.flower, r, 0.5)); ctx.beginPath(); ctx.arc(x + Math.cos(a) * far, y + Math.sin(a) * far * 0.9, 1.5 + 1.3 * r(), 0, 6.2832); ctx.fill();
    }
  };
  cellBox(4, (ox, oy, inside) => {
    const r = rng(5209), y0 = oy + CH / 2, leaves = [], stalks = [], heads = [];
    const stem = (t) => [ox + 2 + (CW - 62) * t, y0 + CH * 0.05 * Math.sin(t * 2.4 + 1)];
    // (the stem's card is the whole stem, three metres and more: its lowest third is bare, and a leaf is small on it)
    const NODES = 10;
    for (let k = 0; k < NODES; k += 1) {
      const t = 0.3 + 0.68 * (k / (NODES - 1)), [sx, sy] = stem(t);
      for (const hand of [-1, 1]) {
        const got = pinnate(r, leaves, inside, sx, sy, hand * (0.85 + 0.35 * r()), CH * (0.2 + 0.1 * r()) * (1.1 - 0.3 * t), 2 + (r() < 0.6 ? 1 : 0), 19 + 7 * r());
        if (got) stalks.push(got);
      }
      if (k === 3 || k === 5 || k === 7) heads.push([sx, sy, (k === 5 ? 1 : -1) * 0.62, 40, 13]);
    }
    for (const stalk of stalks) line(stalk, mix(eld.stem, eld.mid, 0.5), 1.3);
    line(Array.from({ length: 13 }, (_, k) => stem(k / 12)), eld.stem, 4.4);
    line(Array.from({ length: 5 }, (_, k) => stem(k / 12)), mix(eld.stem, [30, 14, 26], 0.5), 5.6);
    lay(r, leaves, eld, drawLance);
    for (const [x, y, a, long, wide] of heads) head(r, x, y, a, long, wide);
    head(r, ...stem(1), 0, 50, 18);
  });
  cellBox(5, (ox, oy, inside) => {
    const r = rng(5227), y0 = oy + CH / 2, leaves = [], stalks = [];
    const twig = (t) => [ox + 3 + CW * 0.62 * t, y0 + CH * 0.03 * Math.sin(t * 3)];
    for (let k = 0; k < 5; k += 1) {
      const [sx, sy] = twig(0.08 + 0.9 * (k / 4));
      for (const hand of [-1, 1]) {
        const got = pinnate(r, leaves, inside, sx, sy, hand * (0.8 + 0.3 * r()) * (1 - 0.12 * k), CH * (0.3 + 0.1 * r()), 3, 30 + 8 * r());
        if (got) stalks.push(got);
      }
    }
    const got = pinnate(r, leaves, inside, ...twig(1), 0, CH * 0.36, 3, 32);
    if (got) stalks.push(got);
    for (const stalk of stalks) line(stalk, mix(eld.stem, eld.mid, 0.5), 1.5);
    line(Array.from({ length: 9 }, (_, k) => twig(k / 8)), eld.stem, 3);
    lay(r, leaves, eld, drawLance);
    round(r, ox + CW * 0.52, y0 - 34, 25); round(r, ox + CW * 0.7, y0 + 30, 22); round(r, ox + CW * 0.3, y0 + 26, 17);
  });

  // ================= devil's club =================
  const clb = P.club, ROW3 = CH * 3;
  // A leaf like a great maple's, seen flat: seven shallow pointed lobes, each toothed, round a deep notch
  // where the stalk comes in; its ribs go out from that notch to every lobe's point.
  const clubLeaf = (ox, seed) => box(ox, ROW3, 256, 256, () => {
    const r = rng(seed), bx = ox + 86, by = ROW3 + 128, R = 104, LOBES = 7, turn = (r() - 0.5) * 0.2;
    const lobe = (k) => turn + (k - (LOBES - 1) / 2) * 0.78;                    // the bearing of each lobe's point, from straight out
    const reach = (k) => R * [0.62, 0.86, 0.97, 1, 0.97, 0.86, 0.62][k] * (0.94 + 0.12 * r());
    const tips = Array.from({ length: LOBES }, (_, k) => [lobe(k), reach(k)]);
    const outline = [];
    for (let k = 0; k < LOBES; k += 1) {
      const [a, far] = tips[k], half = 0.39;
      // up one side of the lobe to its point and down the other, in teeth; between lobes the edge comes in by a third
      for (let j = -4; j <= 4; j += 1) {
        const f = j / 4, at = a + f * half, tooth = j % 2 ? 0.045 : -0.02, rad = far * (0.66 + 0.34 * Math.pow(1 - Math.abs(f), 0.75) + tooth);
        outline.push([bx + Math.cos(at) * rad, by + Math.sin(at) * rad]);
      }
    }
    const paint = (colour, shrink) => {
      ctx.fillStyle = css(colour); ctx.beginPath(); ctx.moveTo(bx - 10 * shrink, by);
      for (const [x, y] of outline) ctx.lineTo(bx + (x - bx) * shrink, by + (y - by) * shrink);
      ctx.closePath(); ctx.fill();
    };
    paint(vary(mix(clb.dark, clb.mid, 0.8), r, 0.5), 1);
    // lighter between the ribs towards the edge, lobe by lobe
    for (let k = 0; k < LOBES; k += 1) {
      const [a, far] = tips[k];
      ctx.fillStyle = css(vary(mix(clb.mid, clb.light, 0.3 + 0.6 * r()), r, 0.6), 0.85);
      ctx.beginPath(); ctx.moveTo(bx + Math.cos(a) * far * 0.2, by + Math.sin(a) * far * 0.2);
      for (const f of [-0.3, -0.16, 0, 0.16, 0.3]) ctx.lineTo(bx + Math.cos(a + f) * far * (0.86 - 0.5 * Math.abs(f)), by + Math.sin(a + f) * far * (0.86 - 0.5 * Math.abs(f)));
      ctx.closePath(); ctx.fill();
    }
    for (const [a, far] of tips) {
      line([[bx, by], [bx + Math.cos(a) * far * 0.93, by + Math.sin(a) * far * 0.93]], clb.vein, 2, 0.85);
      for (const f of [0.38, 0.58, 0.76]) for (const hand of [-1, 1]) {
        const px = bx + Math.cos(a) * far * f, py = by + Math.sin(a) * far * f, side = a + hand * 0.75;
        line([[px, py], [px + Math.cos(side) * far * 0.15, py + Math.sin(side) * far * 0.15]], clb.vein, 0.9, 0.6);
      }
    }
    line([[ox + 2, by], [bx, by]], clb.stalk, 4.2);
  });
  clubLeaf(0, 5303); clubLeaf(256, 5311);
  // a length of stem: thick, pale brown, ringed where leaves were, and thick with yellow spines that stand out all round
  const clubStem = (oy, seed) => box(CW, oy, CW, 64, (ox) => {
    const r = rng(seed), y0 = oy + 32;
    for (let k = 0; k < 260; k += 1) {
      const x = ox + 3 + r() * (CW - 6), hand = r() < 0.5 ? -1 : 1, long = 8 + 13 * r(), lean = (r() - 0.5) * 0.9;
      line([[x, y0 + hand * 6], [x + Math.sin(lean) * long, y0 + hand * (6 + Math.cos(lean) * long)]], vary(clb.spine, r, 0.8), 1.1, 0.9);
    }
    stroke(ctx, r, ox + 1, y0, ox + CW - 1, y0, 20, clb.stem, { ragged: 0.1, lumpy: 0.12, taperIn: 0.001, taperOut: 0.001 });
    stroke(ctx, r, ox + 1, y0 - 4, ox + CW - 1, y0 - 4, 6, mix(clb.stem, [44, 20, 62], 0.6), { ragged: 0.2, taperIn: 0.001, taperOut: 0.001, alpha: 0.7 });
    for (let k = 0; k < 9; k += 1) { const x = ox + 20 + (CW - 40) * (k + r() * 0.6) / 9; line([[x, y0 - 9], [x + 2, y0 + 9]], mix(clb.stem, [30, 26, 22], 0.7), 1.6, 0.8); }
    for (let k = 0; k < 110; k += 1) { const x = ox + 3 + r() * (CW - 6), y = y0 + (r() - 0.5) * 16; line([[x, y], [x + (r() - 0.5) * 5, y + (r() - 0.5) * 5]], vary(clb.spine, r, 0.8), 1, 0.85); }
  });
  clubStem(ROW3, 5323); clubStem(ROW3 + 64, 5333);

  // ================= red huckleberry =================
  const huc = P.huckle;
  // a fan of thin green twigs, forking and forking again, with small leaves set along the last of them
  const fan = (cell, seed) => cellBox(cell, (ox, oy, inside) => {
    const r = rng(seed), leaves = [], twigs = [];
    const grow = (x, y, angle, length, depth) => {
      const ex = x + Math.cos(angle) * length, ey = y + Math.sin(angle) * length;
      if (!inside(ex, ey, 6)) return;
      twigs.push([[x, y], [ex, ey], depth]);
      if (depth <= 2) {
        const n = Math.max(2, Math.round(length / 9));
        for (let k = 1; k <= n; k += 1) {
          const f = k / n, a = angle + (k % 2 ? 1 : -1) * (0.75 + 0.3 * r());
          leaves.push({ x: x + (ex - x) * f, y: y + (ey - y) * f, angle: a, size: 8.5 + 4 * r(), tier: r() });
        }
      }
      if (depth === 0) return;
      const kids = depth > 2 ? 2 : 2 + (r() < 0.45 ? 1 : 0);
      for (let k = 0; k < kids; k += 1) grow(ex, ey, angle + (k - (kids - 1) / 2) * (0.5 + 0.25 * r()) + (r() - 0.5) * 0.25, length * (0.66 + 0.14 * r()), depth - 1);
      // (and a twig part-way along, on one side)
      if (depth >= 2 && r() < 0.7) grow(x + (ex - x) * 0.55, y + (ey - y) * 0.55, angle + (r() < 0.5 ? -1 : 1) * (0.55 + 0.2 * r()), length * 0.6, depth - 1);
    };
    for (const [a, long] of [[-0.42, 96], [0.02, 118], [0.44, 92]]) grow(ox + 3, oy + CH / 2, a, long * (0.9 + 0.2 * r()), 4);
    for (const [a, b, depth] of twigs) line([a, b], depth > 2 ? mix(huc.twig, [70, 30, 26], 0.4) : huc.twig, 0.9 + depth * 0.55);
    lay(r, leaves, huc, (rr, l, colour) => { ctx.fillStyle = css(colour); blade(rr, l.x, l.y, l.angle, l.size, OVAL, 0.04); });
  });
  fan(8, 5407); fan(9, 5413);

  // ================= bracken =================
  const brk = P.bracken;
  // A frond seen flat: a bare stalk for the first quarter of the card, then a blade as broad at its foot as
  // it is long, three times cut: side stalks in pairs, the lowest pair the longest, each with its own leaflets
  // in pairs, and those toothed. New in May: a light green.
  cellBox(10, (ox, oy, inside) => {
    const r = rng(5501), y0 = oy + CH / 2, x0 = ox + 2, from = ox + CW * 0.26, to = ox + CW - 14, leaves = [], stalks = [];
    const PAIRS = 12;
    for (let k = 0; k < PAIRS; k += 1) {
      const t = k / PAIRS, px = from + (to - from) * (t + 0.02), long = CH * 0.46 * Math.pow(1 - t, 0.8) * (0.92 + 0.14 * r());
      for (const hand of [-1, 1]) {
        const a = hand * (1.2 - 0.3 * t), ex = px + Math.cos(a) * long, ey = y0 + Math.sin(a) * long;
        stalks.push([[px, y0], [ex, ey]]);
        const n = Math.max(2, Math.round(long / 9));
        for (let j = 1; j <= n; j += 1) {
          const f = j / n, bx = px + (ex - px) * f, by = y0 + (ey - y0) * f, size = Math.max(5, (long * 0.3) * (1 - 0.75 * f) + 3);
          for (const side of [-1, 1]) {
            const la = a + side * 1.1;
            if (inside(bx + Math.cos(la) * size, by + Math.sin(la) * size, 3)) leaves.push({ x: bx, y: by, angle: la, size, tier: r() });
          }
        }
      }
    }
    for (const stalk of stalks) line(stalk, mix(brk.stalk, brk.mid, 0.4), 1.3);
    lay(r, leaves, brk, (rr, l, colour) => { ctx.fillStyle = css(colour); blade(rr, l.x, l.y, l.angle, l.size, LANCE, 0.3); });
    line([[x0, y0], [to + 8, y0]], brk.stalk, 3.2);
  });
  // a young frond from beside it: a stalk that stands, two or three pairs of side stalks still half rolled,
  // and its end a crozier
  cellBox(11, (ox, oy, inside) => {
    const r = rng(5519), y0 = oy + CH / 2, leaves = [];
    const coil = (x, y, heading, big, hand) => {
      const points = [];
      for (let k = 0; k <= 22; k += 1) { const f = k / 22, a = heading + hand * f * 5.2, rad = big * (1 - 0.86 * f); points.push([x + Math.cos(a - hand * 1.5708) * rad - Math.cos(heading - hand * 1.5708) * big, y + Math.sin(a - hand * 1.5708) * rad - Math.sin(heading - hand * 1.5708) * big]); }
      return points;
    };
    const end = [ox + CW * 0.78, y0 - 6];
    line([[ox + 2, y0 + 4], [ox + CW * 0.4, y0], end], brk.stalk, 7);
    line(coil(...end, -0.1, 26, -1), brk.fiddle, 8);
    for (const [t, hand, big] of [[0.38, 1, 16], [0.38, -1, 15], [0.55, 1, 13], [0.55, -1, 12], [0.7, 1, 9], [0.7, -1, 9]]) {
      const x = ox + 2 + (end[0] - ox - 2) * t, y = y0 + 3 - 9 * t, a = hand * 1.0, long = 60 * (1.15 - t);
      const ex = x + Math.cos(a) * long, ey = y + Math.sin(a) * long;
      line([[x, y], [ex, ey]], brk.stalk, 3.2);
      line(coil(ex, ey, a, big, hand), brk.fiddle, 4.6);
      const n = Math.round(long / 10);
      for (let j = 1; j <= n; j += 1) for (const side of [-1, 1]) {
        const f = j / (n + 1), la = a + side * 1.1, size = 9 + 6 * (1 - f);
        if (inside(x + (ex - x) * f + Math.cos(la) * size, y + (ey - y) * f + Math.sin(la) * size, 3)) leaves.push({ x: x + (ex - x) * f, y: y + (ey - y) * f, angle: la, size, tier: r() });
      }
    }
    lay(r, leaves, brk, (rr, l, colour) => { ctx.fillStyle = css(colour); blade(rr, l.x, l.y, l.angle, l.size, LANCE, 0.25); });
  });

  // where each plant's paintings are: a cell as [u0, v0, u1, v1], the sheet painted top-down
  const rect = (x, y, wide, tall) => [x / (CW * 2), 1 - (y + tall) / (CH * ROWS), (x + wide) / (CW * 2), 1 - y / (CH * ROWS)];
  const cell = (i) => rect((i % 2) * CW, Math.floor(i / 2) * CH, CW, CH);
  return { texture: cutoutTexture(canvas), canvas, cells: [2, ROWS],
    salmon: { cane: [cell(0), cell(1)], spray: [cell(2), cell(3)] },
    elder: { stem: [cell(4)], spray: [cell(5)] },
    club: { leaf: [rect(0, ROW3, 256, 256), rect(256, ROW3, 256, 256)], stem: [rect(CW, ROW3, CW, 64), rect(CW, ROW3 + 64, CW, 64)] },
    huckle: { fan: [cell(8), cell(9)] },
    bracken: { frond: [cell(10)], young: [cell(11)] } };
}

// ---------- lady fern ----------
// The fern of wet ground: its fronds come up new every spring, a light yellow-green in May, and are cut twice,
// so that each side leaflet is itself a little feather; a frond is widest at its middle and narrows to both
// ends. Four fronds on one sheet, laid out as the sword fern's are (paint/textures.js), so that the same
// builder lays them (plants/understory.js buildFern); none of the four is an old one: last year's are gone.
// (The Park Service lists lady fern among the commonest plants of the rain forest's floor; FEIS has it
// deciduous, 0.6 to 2 m, up in early spring. Its colour and how it is drawn are the agent's.)
export function ladyFernAtlas(look, detail = 1) {
  const FW = 128, FH = 512, canvas = makeCanvas(FW * 4 * detail, FH * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  const pal = look.palette.ladyFern, opts = { ragged: 0.5 };
  for (let cell = 0; cell < 4; cell += 1) {
    const r = rng(5600 + cell * 17), ox = cell * FW, cx = ox + FW / 2;
    ctx.save(); ctx.beginPath(); ctx.rect(ox, 0, FW, FH); ctx.clip();
    const pairs = 30, pitch = (FH * 0.9) / pairs;
    for (let i = 0; i < pairs; i += 1) {
      const t = (i + 0.5) / pairs, y = FH * (0.95 - 0.9 * t);
      // widest two fifths of the way up, and narrowing to both ends
      const len = FW * 0.46 * Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, t * 1.02), 0.72)), 0.85) * (0.92 + r() * 0.12) + 2.5;
      for (const side of [-1, 1]) {
        const rise = len * (0.1 + 0.3 * t);
        const tone = mix(pal.dark, pal.mid, 0.25 + r() * 0.7);
        // the side leaflet: a narrow feather, its own leaflets as a ragged edge and a lighter stroke down it
        stroke(ctx, r, cx, y, cx + side * len, y - rise, pitch * 0.92, vary(tone, r, look.paint.vary), { ...opts, taperIn: 0.08, taperOut: 0.85, bend: -side * 0.04 });
        if (r() < 0.85) stroke(ctx, r, cx + side * len * 0.1, y - rise * 0.1, cx + side * len * 0.86, y - rise * 0.9, pitch * 0.36, vary(pal.light, r, look.paint.vary), { ragged: 0.3, taperIn: 0.3, taperOut: 0.8, alpha: 0.9 });
      }
    }
    ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.strokeStyle = css(pal.stem, 0.95);
    ctx.beginPath(); ctx.moveTo(cx, FH); ctx.lineTo(cx, FH * 0.045); ctx.stroke();
    ctx.restore();
  }
  return { texture: cutoutTexture(canvas), canvas, cells: [4, 1] };
}
