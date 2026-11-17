import { rng, makeCanvas, css, shift, mix, vary, stroke, cutoutTexture } from './brush.js';

// ---------- the maples' sheet ----------
// What hangs on a bigleaf maple (plants/maple.js), eight cells in a 2 x 4 sheet:
//   `spray` (2)  the end of a branch seen flat, as from under the tree: it is attached at the middle of the
//                cell's left edge, and its leaves overlap like tiles, each on a long stalk
//   `hung`  (2)  the same seen from the side: a twig along the top of the cell and the leaves hanging from it
//   `moss`  (2)  what hangs under a limb: the limb's underside is along the top of the cell, a mat of moss on
//                it, and from the mat beards and tatters of every length
//   `fern`  (1)  licorice fern: a mat of moss along the foot of the cell, and fronds standing and arching out of it
//   `vine`  (1)  a spray of vine maple seen flat, attached like `spray`: small round leaves of seven points
//                (the plant's have seven to nine), in one layer
// A bigleaf maple's leaf is a hand: five deep lobes, the middle one longest, the lowest two turned back
// beside the stalk, each with a tooth or two. In May it is new: thin, and a yellower green than any needle.
// A cell is 512 x 256 and is laid on a card about 2.8 m by 1.4 m, so a leaf 0.3 m across is some 55 pixels.
const CW = 512, CH = 256, PAD = 9;

export function mapleAtlas(look, detail = 1) {
  const canvas = makeCanvas(CW * 2 * detail, CH * 4 * detail), ctx = canvas.getContext('2d');
  ctx.scale(detail, detail);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const pal = look.palette.maple, opts = { ragged: look.paint.ragged };

  // One lobe of a leaf as a path: from the leaf's base out along `angle`, `length` long, with a shoulder and
  // a tooth to either side.
  const lobe = (bx, by, angle, length, wide) => {
    const c = Math.cos(angle), s = Math.sin(angle);
    const at = (along, off) => [bx + (c * along - s * off) * length, by + (s * along + c * off) * length];
    const side = [[0.08, 0.1], [0.3, 0.2], [0.5, 0.25], [0.56, 0.17], [0.72, 0.19], [0.8, 0.1], [1, 0]];
    ctx.moveTo(bx, by);
    for (const [along, off] of side) ctx.lineTo(...at(along, off * wide));
    for (let i = side.length - 2; i >= 0; i -= 1) ctx.lineTo(...at(side[i][0], -side[i][1] * wide));
    ctx.closePath();
  };
  // A leaf: its base at (bx, by), its middle lobe along `angle` and `size` long. `points` 5 is a bigleaf
  // maple's; 7 or 9 a vine maple's, whose lobes are short and all much of a length.
  const leaf = (r, bx, by, angle, size, colour, { points = 5, veins = true } = {}) => {
    const lobes = points === 5
      ? [[0, 1, 1], [0.78, 0.86, 1], [-0.78, 0.86, 1], [1.82, 0.52, 1.15], [-1.82, 0.52, 1.15]]
      : Array.from({ length: points }, (_, k) => { const a = (k - (points - 1) / 2) * (4.6 / (points - 1)); return [a, 0.78 + 0.22 * Math.cos(a * 0.9), 1.25]; });
    const twist = (r() - 0.5) * 0.16;
    ctx.fillStyle = css(colour);
    // (each lobe is filled by itself. As one path with the blade between their feet, which an arc winds the
    // other way round, the fill would have a hole wherever the two overlap: worked out, not tried)
    for (const [a, len, wide] of lobes) { ctx.beginPath(); lobe(bx, by, angle + a * (1 + twist), size * len * (0.92 + 0.16 * r()), wide); ctx.fill(); }
    ctx.beginPath(); ctx.arc(bx, by, size * (points === 5 ? 0.34 : 0.5), 0, 6.2832); ctx.fill();
    if (!veins) return;
    ctx.strokeStyle = css(mix(colour, pal.vein, 0.55), 0.8); ctx.lineWidth = Math.max(0.8, size * 0.03);
    ctx.beginPath();
    for (const [a, len] of lobes) { ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(angle + a) * size * len * 0.8, by + Math.sin(angle + a) * size * len * 0.8); }
    ctx.stroke();
  };
  const stalk = (x0, y0, x1, y1, colour, width = 1.5) => {
    ctx.strokeStyle = css(colour, 0.95); ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 3, x1, y1); ctx.stroke();
  };
  // The leaves of one cell: the ones underneath first and darkest, the top ones last and lightest. Which are
  // which goes by where a leaf is in the spray, a handful together, and only a little by chance: with every
  // leaf's tone its own, a crown seen from the beach was green and cream confetti.
  const lay = (r, leaves, colours, options) => {
    const a = r() * 6.3, b = r() * 6.3;
    for (const l of leaves) l.tier = Math.min(1, Math.max(0, l.tier * 0.4 + 0.3 + 0.3 * Math.sin(l.x * 0.024 + a) + 0.22 * Math.sin(l.y * 0.05 + l.x * 0.013 + b)));
    leaves.sort((a, b) => a.tier - b.tier);
    for (const l of leaves) {
      const tone = l.tier < 0.34 ? mix(colours.dark, colours.mid, 0.25 + 0.5 * r()) : l.tier < 0.72 ? mix(colours.mid, colours.light, 0.1 + 0.6 * r()) : mix(colours.light, colours.pale, 0.1 + 0.7 * r());
      if (l.stalk) stalk(l.stalk[0], l.stalk[1], l.x, l.y, colours.stalk);
      leaf(r, l.x, l.y, l.angle, l.size, vary(tone, r, look.paint.vary * 0.6), options);
    }
  };
  const cellAt = (cell) => [(cell % 2) * CW, Math.floor(cell / 2) * CH];
  const clipped = (cell, paint) => {
    const [ox, oy] = cellAt(cell);
    ctx.save(); ctx.beginPath(); ctx.rect(ox + 1, oy + 1, CW - 2, CH - 2); ctx.clip();
    paint(ox, oy, (x, y, margin = PAD) => x > ox + margin && x < ox + CW - margin && y > oy + margin && y < oy + CH - margin);
    ctx.restore();
  };

  // ---- a branch end, flat
  const flat = (cell, seed, colours, { size, count, points }) => clipped(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH / 2, leaves = [];
    // the twig, and two or three side twigs from it
    const spine = (t) => [ox + 3 + (CW * 0.74) * t, y0 + CH * 0.05 * Math.sin(t * 3.1 + seed)];
    const twigs = [[spine(0), spine(1)]];
    for (const [t, hand] of [[0.16, -1], [0.3, 1], [0.46, -1], [0.62, 1], [0.78, -1]]) {
      const [sx, sy] = spine(t), reach = CW * (0.17 + 0.08 * r());
      twigs.push([[sx, sy], [sx + reach * 0.75, sy + hand * reach * 0.55]]);
    }
    // its leaves: in pairs along every twig, and a fan at each end, every one pointing away from where the spray is attached
    for (const [[ax, ay], [bx, by]] of twigs) {
      const length = Math.hypot(bx - ax, by - ay), pairs = Math.max(2, Math.round(length / (size * 0.95)));
      for (let k = 0; k <= pairs; k += 1) {
        const t = (k + 0.5 * r()) / pairs, px = ax + (bx - ax) * Math.min(1, t), py = ay + (by - ay) * Math.min(1, t), along = Math.atan2(by - ay, bx - ax);
        for (const hand of k === pairs ? [-0.5, 0, 0.5] : [-1, 1]) {
          const out = along + hand * (1.0 + 0.4 * r()), far = size * (0.5 + 0.7 * r());
          const x = px + Math.cos(out) * far, y = py + Math.sin(out) * far, big = size * (0.78 + 0.4 * r());
          // (a leaf whose lobes would leave the cell is left out: a cut shows as a ruled edge on the card)
          if (!inside(x - big * 1.02, y - big * 1.02) || !inside(x + big * 1.02, y + big * 1.02)) continue;
          leaves.push({ x, y, angle: out + (r() - 0.5) * 0.7, size: big, tier: r(), stalk: [px, py] });
        }
      }
    }
    // (and a few more wherever the fan is thin, low in the pile)
    for (let k = 0; k < count; k += 1) {
      const t = 0.12 + 0.8 * r(), x = ox + CW * t, half = CH * 0.42 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.6), y = y0 + (r() - 0.5) * 2 * half, big = size * (0.7 + 0.35 * r());
      const out = Math.atan2(y - y0, x - ox) + (r() - 0.5) * 0.9;
      if (!inside(x - big * 1.02, y - big * 1.02) || !inside(x + big * 1.02, y + big * 1.02)) continue;
      if (!leaves.some((l) => Math.hypot(l.x - x, l.y - y) < size * 1.25)) continue;           // none out by itself: a leaf in the air beside its spray
      leaves.push({ x, y, angle: out, size: big, tier: r() * 0.5 });
    }
    ctx.strokeStyle = css(colours.twig, 0.95);
    twigs.forEach(([[ax, ay], [bx, by]], i) => { ctx.lineWidth = i ? 2 : 3.4; ctx.beginPath(); ctx.moveTo(ax - (i ? 0 : 4), ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + 4, bx, by); ctx.stroke(); });
    lay(r, leaves, colours, { points });
  });
  flat(0, 3301, pal, { size: 40, count: 30, points: 5 });
  flat(1, 3319, pal, { size: 37, count: 34, points: 5 });

  // ---- the same from the side: a twig along the top, and from it short twigs that droop, the leaves hanging
  // from all of them point down, one over another like tiles. (In three rows by the length of their stalks,
  // the dark ones above and the light ones below, they were washing on a line.)
  const hung = (cell, seed) => clipped(cell, (ox, oy, inside) => {
    const r = rng(seed), y0 = oy + CH * 0.14, leaves = [];
    const twig = (t) => [ox + 2 + (CW - 4) * t, y0 + CH * 0.05 * t * t + 2 * Math.sin(t * 9 + seed)];
    const droops = [];
    for (let k = 0; k < 11; k += 1) {
      const [px, py] = twig(0.05 + 0.9 * (k + 0.25 + 0.5 * r()) / 11), reach = CH * (0.22 + 0.32 * r()), lean = (r() - 0.5) * 1.0;
      droops.push([[px, py], [px + Math.sin(lean) * reach, py + Math.cos(lean) * reach]]);
    }
    // a pair of leaves from a place on a twig, each on its stalk, hanging
    const pair = (px, py, deep) => {
      for (const hand of [-1, 1]) {
        const size = 30 + 14 * r(), reach = 12 + 26 * r(), out = 1.5708 + hand * (0.45 + 0.6 * r());
        const x = px + Math.cos(out) * reach, y = py + Math.sin(out) * reach * 0.85 + 3, angle = 1.5708 + hand * 0.3 * r() + (r() - 0.5) * 0.6;
        if (!inside(x - size * 1.02, y - size * 0.6) || !inside(x + size * 1.02, y + size * 1.02)) continue;
        leaves.push({ x, y, angle, size, tier: Math.min(1, Math.max(0, 0.1 + 0.75 * r() + 0.2 * deep)), stalk: [px, py] });
      }
    };
    for (let k = 0; k < 13; k += 1) pair(...twig(0.03 + 0.94 * (k + r()) / 13), 0);
    for (const [[ax, ay], [bx, by]] of droops) for (let n = 1; n <= 3; n += 1) pair(ax + (bx - ax) * (n / 3), ay + (by - ay) * (n / 3), n / 3);
    // (and a few that stand up from the twig's back)
    for (let k = 0; k < 5; k += 1) {
      const [px, py] = twig(0.1 + 0.8 * (k + r()) / 5), size = Math.min(20 + 8 * r(), (py - oy - PAD - 3) / 1.05);
      if (inside(px - size, py) && inside(px + size, py)) leaves.push({ x: px, y: py - 3, angle: -1.5708 + (r() - 0.5) * 1.2, size, tier: r() * 0.4 });
    }
    ctx.strokeStyle = css(pal.twig, 0.95);
    ctx.lineWidth = 1.8;
    for (const [[ax, ay], [bx, by]] of droops) { ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax, (ay + by) / 2, bx, by); ctx.stroke(); }
    ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(ox, y0);
    for (let t = 0.04; t <= 1.001; t += 0.04) ctx.lineTo(...twig(t));
    ctx.stroke();
    lay(r, leaves, pal, { points: 5 });
    // Its flowers: chains of small yellow-green flowers a hand long, hanging among the new leaves. By the
    // middle of May most are over (the sources an agent read have it in flower from late April into early May
    // in this country, in hanging racemes of 10 to 15 cm, with or just before the leaves): a few are left.
    for (let k = 0; k < 5; k += 1) {
      const [[ax, ay], [bx, by]] = droops[Math.floor(r() * droops.length)], t = 0.35 + 0.6 * r(), length = 20 + 9 * r();
      const x = ax + (bx - ax) * t + (r() - 0.5) * 8, y = ay + (by - ay) * t, lean = (r() - 0.5) * 5;
      if (!inside(x - 5, y) || !inside(x + 5, y + length + 3)) continue;
      ctx.strokeStyle = css(pal.stalk, 0.9); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + lean, y + length); ctx.stroke();
      for (let n = 0; n < 10; n += 1) {
        const share = (n + 0.5) / 10, hand = n % 2 ? 1 : -1;
        ctx.fillStyle = css(vary(pal.flower, r, look.paint.vary * 0.5));
        ctx.beginPath(); ctx.arc(x + lean * share + hand * (2.3 - 1.3 * share), y + length * share, 2.5 - 1.1 * share, 0, 6.2832); ctx.fill();
      }
    }
  });
  hung(2, 3331); hung(3, 3343);

  // ---- moss under a limb: a mat along the top, and what hangs from it
  const mossPal = look.palette.hangingMoss;
  const moss = (cell, seed) => clipped(cell, (ox, oy) => {
    const r = rng(seed), y0 = oy + CH * 0.1;
    // What hangs: five or six thick mats, each a sheaf of locks of much the same length that ends ragged and
    // blunt, and short tufts between them. (Forty-six locks set evenly along the limb, each tapering to a
    // point, were a fringe: the trimming on a lampshade.)
    const lock = (x, reach, width, lean, tone) => {
      const x0 = Math.min(ox + CW - PAD - 14, Math.max(ox + PAD + 14, x)), x1 = Math.min(ox + CW - PAD - 14, Math.max(ox + PAD + 14, x + lean));
      const y1 = Math.min(oy + CH - PAD - 3, y0 + reach);
      stroke(ctx, r, x0, y0 - 2, x1, y1, width, vary(tone, r, look.paint.vary), { ...opts, ragged: 0.5, lumpy: 0.4, taperIn: 0.03, taperOut: 0.34 + 0.3 * r(), bend: (r() - 0.5) * 0.1 });
      return [x0, x1, y1];
    };
    let x = ox + PAD + 16;
    while (x < ox + CW - PAD - 16) {
      const mat = r() < 0.62, wide = mat ? 46 + 60 * r() : 16 + 26 * r(), reach = (CH * 0.76) * (mat ? 0.42 + 0.58 * r() : 0.1 + 0.2 * r()), lean = (r() - 0.5) * 26;
      const locks = Math.max(2, Math.round(wide / 9));
      for (let k = 0; k < locks; k += 1) {
        const f = (k + 0.5 * r()) / locks, edge = Math.abs(f - 0.5) * 2, deep = reach * (1 - 0.3 * edge * edge) * (0.82 + 0.3 * r());
        const tone = mix(mix(mossPal.dark, mossPal.mid, 0.2 + 0.8 * r()), mossPal.light, 0.5 * edge * r());
        const [x0, x1, y1] = lock(x + wide * f, deep, 13 + 10 * r(), lean * (0.6 + 0.8 * r()), tone);
        // a lit strand down it, and the gold of its end where the light comes through
        if (r() < 0.4) stroke(ctx, r, x0 + 2, y0 + deep * 0.2, x1 + 1, y1 - 3, 3 + 3 * r(), vary(mix(mossPal.mid, mossPal.light, 0.4 + 0.6 * r()), r, look.paint.vary), { ...opts, ragged: 0.4, taperIn: 0.2, taperOut: 0.6 });
        if (r() < 0.5) stroke(ctx, r, x1, y1 - Math.min(16, deep * 0.3), x1 + (r() - 0.5) * 5, y1, 6 + 5 * r(), vary(mix(mossPal.light, mossPal.gold, 0.3 + 0.5 * r()), r, look.paint.vary), { ...opts, ragged: 0.5, taperIn: 0.3, taperOut: 0.5 });
      }
      x += wide * (0.8 + 0.25 * r());
    }
    // the mat itself: cushions along the limb, lit on their backs
    for (let k = 0; k < 30; k += 1) {
      const x = ox + PAD + 22 + (CW - 2 * PAD - 44) * ((k + r()) / 30), w = 22 + 16 * r();
      stroke(ctx, r, x - w / 2, y0 + 2 * (r() - 0.5), x + w / 2, y0 + 2 * (r() - 0.5), 13 + 7 * r(), vary(mix(mossPal.dark, mossPal.mid, 0.3 + 0.7 * r()), r, look.paint.vary), { ...opts, ragged: 0.35, taperIn: 0.3, taperOut: 0.3 });
    }
  });
  moss(4, 3359); moss(5, 3371);

  // ---- licorice fern: fronds out of a mat of moss along the foot of the cell
  clipped(6, (ox, oy, inside) => {
    const r = rng(3389), y0 = oy + CH * 0.92, fern = look.palette.licorice;
    const frond = (x, angle, length, bend) => {
      // its midrib, a point at a time, turning as it goes; a pair of leaflets at each, longest a third of the way out
      const steps = 15, rib = [];
      let px = x, py = y0 - 3, a = angle;
      for (let k = 0; k <= steps; k += 1) { rib.push([px, py, a]); a += bend / steps; px += Math.cos(a) * (length / steps); py += Math.sin(a) * (length / steps); }
      if (!rib.every(([qx, qy]) => inside(qx, qy, PAD + 4) || qy > y0 - 8)) return;
      for (let k = 2; k <= steps; k += 1) {
        const [qx, qy, qa] = rib[k], t = k / steps, reach = length * 0.13 * Math.min(1, 0.6 + t * 2) * Math.pow(1 - t, 0.7) + 2.5;
        for (const hand of [-1, 1]) {
          const out = qa + hand * (1.25 - 0.3 * t), ex = qx + Math.cos(out) * reach, ey = qy + Math.sin(out) * reach;
          if (!inside(ex, ey, PAD - 2) && ey < y0 - 8) continue;
          stroke(ctx, r, qx, qy, ex, ey, (length / steps) * 0.95, vary(mix(fern.dark, hand * Math.cos(qa) > 0 ? fern.light : fern.mid, 0.35 + 0.5 * r()), r, look.paint.vary * 0.7), { ...opts, ragged: 0.12, taperIn: 0.05, taperOut: 0.75 });
        }
      }
      ctx.strokeStyle = css(fern.stem, 0.95); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(rib[0][0], rib[0][1]); for (const [qx, qy] of rib) ctx.lineTo(qx, qy); ctx.stroke();
    };
    for (let k = 0; k < 20; k += 1) {
      const x = ox + CW * (0.07 + 0.86 * (k + 0.2 + 0.6 * r()) / 20), lean = (r() - 0.5) * 1.7;
      frond(x, -1.5708 + lean, CH * (0.3 + 0.48 * r()) * (1 - 0.25 * Math.abs(lean)), lean * (0.5 + 0.7 * r()));
    }
    for (let k = 0; k < 26; k += 1) {
      const x = ox + PAD + 24 + (CW - 2 * PAD - 48) * ((k + r()) / 26), w = 24 + 16 * r();
      stroke(ctx, r, x - w / 2, y0 + 3 * (r() - 0.5), x + w / 2, y0 + 3 * (r() - 0.5), 14 + 8 * r(), vary(mix(mossPal.dark, mossPal.mid, 0.3 + 0.7 * r()), r, look.paint.vary), { ...opts, ragged: 0.35, taperIn: 0.3, taperOut: 0.3 });
    }
  });

  // ---- vine maple, flat: one layer of small round leaves along a thin green twig and its side twigs
  flat(7, 3407, look.palette.vineMaple, { size: 19, count: 34, points: 7 });

  return { texture: cutoutTexture(canvas), canvas, cells: [2, 4], spray: [0, 1], hung: [2, 3], moss: [4, 5], fern: [6], vine: [7] };
}
