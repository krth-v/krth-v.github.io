import { rng, makeCanvas, css, mix, vary, cutoutTexture } from './brush.js';

// ---------- the sheet of small things: flowers of the forest floor, fungi on dead wood, a hanging lichen ----------
// As they are in the middle of May (plants/flowers.js builds them). One sheet, 1024 x 1536, painted at one size
// on every device. Several of its plants stand side by side, a column to each, and one kind of plant in the
// forest is then several: which column a plant shows goes by its tint (VARIANTS, light/shared.js).
//
//   y 0..768       the carpets, four columns of 256: false lily-of-the-valley; candy flower, stream violet and
//                  foamflower; Pacific bleeding heart; English daisy. In each column two squares of the plant
//                  seen from above, and under them two upright halves (128 x 256) of it seen from beside, its
//                  foot at the bottom.
//   y 768..1280    x 0..512: western trillium, two columns of 256 (new and white; aged and pink): the plant seen
//                  from above, and under it two halves seen from beside.
//                  x 512..1024: what grows on dead wood, four columns of 128 (red-belted conk; artist's conk;
//                  oyster mushroom; turkey tail): one shelf of each seen from above and from underneath, the
//                  wood it grows from at the left edge.
//   y 1152..1536   x 512..1024: Methuselah's beard, four curtains of strands hanging from the top edge.
//
// What was read (2026-11-15; agents reading the Burke Herbarium, the Forest Service's and the Park Service's
// pages, a native plant society's and a mycological society's, each claim then put to a second source; none of
// it seen as an image). False lily-of-the-valley: heart-shaped leaves 5 to 11 cm, flowers May to July, "often
// the main groundcover in Sitka spruce forests". Western trillium: 10 to 30 cm, three petals, in flower March
// to June; it opens white and turns pink to purple with age; often in alder thickets. Pacific bleeding heart:
// 15 to 45 cm, pink, March to July, its leaves finely cut and bluish. Foamflower: white, May to August. Candy
// flower: white to pink, March to September. Stream violet: yellow, March to July. English daisy, in the old
// fields: in flower from early spring to autumn. Red-belted conk: a hoof or shelf 5 to 30 cm, grey-black on
// top with a red-orange belt and a pale margin, white to yellow underneath, on dead conifers all year.
// Artist's conk: to 30 cm and more, brown on top and white underneath, on dead wood and the wounds of living
// broad-leaved trees. Oyster mushroom: cream, in clusters on fallen and standing dead alder, fruiting most
// from March to May. Turkey tail: thin banded brackets under 10 cm, in rows and tiers on dead hardwood.
// Methuselah's beard: pale yellow-green strands from a hand's length to metres, hanging in old conifers.
// Not in flower or in fruit in the middle of May, and so not here: foxglove, bunchberry, chanterelle, king
// bolete, fly agaric. The agent's own, from no source: every colour, how each is drawn, which way a trillium's
// petals lie over its leaves, and that the flowers are larger than life so that they read from a walker's
// height (a daisy's head about one and a half times, a trillium up to one and a third).
const W = 1024, H = 1536;

export function flowerAtlas(look) {
  const canvas = makeCanvas(W, H), ctx = canvas.getContext('2d');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = look.palette;

  // a box of the sheet, clipped: paint(ox, oy)
  const box = (ox, oy, wide, tall, paint) => { ctx.save(); ctx.beginPath(); ctx.rect(ox + 2, oy + 2, wide - 4, tall - 4); ctx.clip(); paint(ox, oy); ctx.restore(); };
  // A blade as a path: its base at (bx, by), its tip `length` away along `angle` (0 is to the right, a quarter
  // turn is down the sheet). `shape` is its half-width, as a share of its length, at eight places along it.
  const blade = (r, bx, by, angle, length, shape, teeth = 0) => {
    const c = Math.cos(angle), s = Math.sin(angle), n = shape.length - 1;
    const at = (t, off) => [bx + (c * t - s * off) * length, by + (s * t + c * off) * length];
    ctx.beginPath(); ctx.moveTo(bx, by);
    for (let i = 1; i <= n; i += 1) ctx.lineTo(...at(i / n, shape[i] * (1 + teeth * (i % 2 ? 1 : -1) * (0.5 + 0.5 * r()))));
    for (let i = n - 1; i >= 1; i -= 1) ctx.lineTo(...at(i / n, -shape[i] * (1 + teeth * (i % 2 ? -1 : 1) * (0.5 + 0.5 * r()))));
    ctx.closePath(); ctx.fill();
  };
  const line = (points, colour, width, alpha = 0.96) => {
    ctx.strokeStyle = css(colour, alpha); ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(...points[i]);
    ctx.stroke();
  };
  const disc = (x, y, radius, colour, alpha = 1) => { ctx.fillStyle = css(colour, alpha); ctx.beginPath(); ctx.arc(x, y, radius, 0, 6.2832); ctx.fill(); };
  const oval = (x, y, rx, ry, angle, colour, alpha = 1) => { ctx.fillStyle = css(colour, alpha); ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.restore(); };
  const leafTone = (r, pal) => vary(mix(pal.dark, pal.light, 0.15 + 0.75 * r()), r, look.paint.vary * 0.6);
  const HEART = [0, 0.3, 0.42, 0.43, 0.37, 0.27, 0.14, 0], OVATE = [0, 0.24, 0.36, 0.4, 0.36, 0.27, 0.13, 0], NARROW = [0, 0.1, 0.15, 0.17, 0.15, 0.11, 0.05, 0];
  const SPOON = [0, 0.06, 0.09, 0.16, 0.25, 0.28, 0.22, 0], PETAL = [0, 0.2, 0.3, 0.33, 0.3, 0.22, 0.11, 0];
  // a leaf like a heart, its stalk coming in at (x, y): the two lobes of its foot lie a little behind that;
  // veins leave the foot together and arc to the tip
  const heartLeaf = (r, x, y, angle, long, pal, teeth = 0.03) => {
    const tone = leafTone(r, pal), c = Math.cos(angle), s = Math.sin(angle);
    ctx.fillStyle = css(tone); blade(r, x - c * long * 0.1, y - s * long * 0.1, angle, long * 1.1, HEART, teeth);
    ctx.strokeStyle = css(mix(tone, pal.vein, 0.7), 0.7); ctx.lineWidth = Math.max(0.7, long * 0.016);
    for (const off of [-0.27, -0.14, 0, 0.14, 0.27]) {
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (c * 0.5 - s * off) * long, y + (s * 0.5 + c * off) * long, x + c * long * 0.94, y + s * long * 0.94); ctx.stroke();
    }
  };
  // a small flower of five petals round a middle
  const five = (r, x, y, big, petal, middle, vein = null) => {
    const turn = r() * 6.3;
    for (let k = 0; k < 5; k += 1) {
      const a = turn + (k / 5) * 6.2832, px = x + Math.cos(a) * big * 0.58, py = y + Math.sin(a) * big * 0.58;
      oval(px, py, big * 0.6, big * 0.4, a, vary(petal, r, 0.4));
      if (vein) line([[x + Math.cos(a) * big * 0.2, y + Math.sin(a) * big * 0.2], [x + Math.cos(a) * big * 0.95, y + Math.sin(a) * big * 0.95]], vein, Math.max(0.6, big * 0.1), 0.7);
    }
    disc(x, y, big * 0.26, middle);
  };

  // ================= the carpets =================
  const CELL = 256, HALF = 128;
  const column = (k, flat, upright) => {
    const x = k * CELL;
    flat.forEach((paint, i) => box(x, i * CELL, CELL, CELL, (ox, oy) => paint(rng(6100 + k * 31 + i * 7), ox + CELL / 2, oy + CELL / 2)));
    upright.forEach((paint, i) => box(x + i * HALF, 2 * CELL, HALF, CELL, (ox, oy) => paint(rng(6200 + k * 31 + i * 7), ox + HALF / 2, oy + CELL - 3)));
  };

  // ---- false lily-of-the-valley: a carpet of glossy heart-shaped leaves, each on a stalk of its own, and here
  // and there a spike of small white flowers standing over them
  const may = P.mayLily;
  const mayFlat = (n) => (r, cx, cy) => {
    const leaves = [];
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * 6.2832 + (r() - 0.5) * 0.7, far = 10 + 30 * r(), long = Math.min(104 - far, 62 + 22 * r());
      leaves.push({ x: cx + Math.cos(a) * far, y: cy + Math.sin(a) * far, a: a + (r() - 0.5) * 0.7, long, tier: r() });
    }
    for (const l of leaves) line([[cx + (l.x - cx) * 0.2, cy + (l.y - cy) * 0.2], [l.x, l.y]], may.stalk, 2);
    leaves.sort((p, q) => p.tier - q.tier);
    for (const l of leaves) heartLeaf(r, l.x, l.y, l.a, l.long, may);
  };
  const spike = (r, x, y0, y1, pal, n = 22) => {
    for (let k = 0; k < n; k += 1) {
      const t = k / (n - 1), y = y0 + (y1 - y0) * t, off = (k % 2 ? 1 : -1) * (2.5 + 4.5 * r()) * (1 - 0.5 * t);
      line([[x, y], [x + off, y - 1.5]], pal.stalk, 0.8, 0.8);
      disc(x + off, y - 2, 2.2 + 1.1 * r(), r() < 0.2 * (1 + t) ? mix(pal.flower, pal.light, 0.5) : vary(pal.flower, r, 0.3));
    }
  };
  const mayUpright = (flowering) => (r, fx, fy) => {
    // one shoot in flower: a stem with two leaves and a spike over them; and beside it a shoot of one leaf
    const top = fy - (flowering ? 162 : 120), sway = (r() - 0.5) * 10;
    line([[fx - 14, fy], [fx - 12 + sway * 0.5, fy - 80], [fx - 10 + sway, top]], may.stalk, 2.6);
    heartLeaf(r, fx - 12 + sway * 0.4, fy - 74, -2.45 + (r() - 0.5) * 0.3, 48, may);
    heartLeaf(r, fx - 11 + sway * 0.7, fy - 104, -0.75 + (r() - 0.5) * 0.3, 52, may);
    if (flowering) spike(r, fx - 10 + sway, top + 46, top, may);
    line([[fx + 22, fy], [fx + 26, fy - 58]], may.stalk, 2.2);
    heartLeaf(r, fx + 26, fy - 56, -1.3 + (r() - 0.5) * 0.5, 54, may);
  };
  column(0, [mayFlat(7), mayFlat(6)], [mayUpright(true), mayUpright(true)]);

  // ---- the moist ground's small flowers: candy flower (white going to pink, its petals veined), stream violet
  // (yellow, over heart-shaped leaves), and foamflower (a thin spike of tiny white flowers over leaves of three)
  const cnd = P.candy, vio = P.violet, foa = P.foam;
  const candyFlat = (r, cx, cy) => {
    for (let p = 0; p < 4; p += 1) {
      const a = p * 1.6 + r(), far = p === 0 ? 0 : 52 + 22 * r(), x = cx + Math.cos(a) * far, y = cy + Math.sin(a) * far;
      for (let k = 0; k < 5; k += 1) {                                        // the leaves at its foot, on long stalks
        const la = k * 1.257 + r(), reach = 18 + 16 * r();
        line([[x, y], [x + Math.cos(la) * reach, y + Math.sin(la) * reach]], cnd.stalk, 1.3);
        ctx.fillStyle = css(leafTone(r, cnd)); blade(r, x + Math.cos(la) * reach, y + Math.sin(la) * reach, la, 22 + 8 * r(), OVATE);
      }
      const turn = r() * 6.3;                                                 // the pair of leaves under its flowers
      for (const hand of [0, Math.PI]) { ctx.fillStyle = css(leafTone(r, cnd)); blade(r, x, y, turn + hand, 21 + 4 * r(), OVATE); }
      for (let k = 0; k < 4; k += 1) { const fa = turn + 1.57 + (k - 1.5) * 0.9, far2 = 9 + 9 * r(); five(r, x + Math.cos(fa) * far2, y + Math.sin(fa) * far2, 7.5, r() < 0.5 ? cnd.petal : mix(cnd.petal, cnd.vein, 0.35), [70, 50, 70], cnd.vein); }
    }
  };
  // a violet seen from in front: two petals up, two to the sides, and the lowest the largest, lined dark
  const violetFlower = (r, x, y, big, turn) => {
    for (const [a, long] of [[-2.0, 0.9], [-1.14, 0.9], [-2.95, 0.85], [-0.2, 0.85], [1.57, 1.05]]) oval(x + Math.cos(a + turn) * big * 0.5, y + Math.sin(a + turn) * big * 0.5, big * 0.55 * long, big * 0.38, a + turn, vary(vio.petal, r, 0.4));
    for (const off of [-0.25, 0, 0.25]) line([[x, y], [x + Math.cos(1.57 + turn + off) * big * 0.75, y + Math.sin(1.57 + turn + off) * big * 0.75]], vio.line, Math.max(0.6, big * 0.07), 0.8);
    disc(x, y, big * 0.16, [40, 80, 40]);
  };
  const violetFlat = (r, cx, cy) => {
    const leaves = [];
    for (let i = 0; i < 6; i += 1) { const a = (i / 6) * 6.2832 + (r() - 0.5) * 0.6, far = 14 + 36 * r(); leaves.push({ x: cx + Math.cos(a) * far, y: cy + Math.sin(a) * far, a: a + (r() - 0.5) * 0.6, long: Math.min(100 - far, 40 + 16 * r()), tier: r() }); }
    for (const l of leaves) line([[cx, cy], [l.x, l.y]], vio.mid, 1.6);
    leaves.sort((p, q) => p.tier - q.tier);
    for (const l of leaves) heartLeaf(r, l.x, l.y, l.a, l.long, { ...vio, vein: mix(vio.light, [80, 40, 62], 0.5) }, 0.1);
    for (let k = 0; k < 4; k += 1) { const a = k * 1.571 + 0.6 + (r() - 0.5) * 0.5, far = 34 + 40 * r(); violetFlower(r, cx + Math.cos(a) * far, cy + Math.sin(a) * far, 10, r() * 6.3); }
  };
  // a leaf of three toothed leaflets on a stalk
  const trefoilLeaf = (r, x, y, angle, long, pal) => {
    for (const [off, share] of [[0, 1], [1.25, 0.8], [-1.25, 0.8]]) { ctx.fillStyle = css(leafTone(r, pal)); blade(r, x, y, angle + off, long * share, OVATE, 0.22); }
  };
  const foamUpright = (r, fx, fy) => {
    const top = fy - 214, sway = (r() - 0.5) * 12;
    for (const hand of [-1, 1]) {
      const ex = fx + hand * (26 + 8 * r()), ey = fy - 58 - 22 * r();
      line([[fx, fy], [fx + hand * 8, fy - 34], [ex, ey]], foa.stalk, 1.6);
      trefoilLeaf(r, ex, ey, -1.57 + hand * 0.7, 26, foa);
    }
    line([[fx, fy], [fx + sway * 0.4, fy - 110], [fx + sway, top]], foa.stalk, 1.8);
    trefoilLeaf(r, fx + sway * 0.45, fy - 104, -1.57 - 0.9, 17, foa);
    for (let k = 0; k < 30; k += 1) {
      const t = k / 29, x = fx + sway * (0.5 + 0.5 * t), y = fy - 118 - (214 - 118) * t, hand = k % 2 ? 1 : -1, reach = (5 + 7 * r()) * (1 - 0.45 * t);
      line([[x, y], [x + hand * reach, y - 3]], foa.stalk, 0.7, 0.7);
      disc(x + hand * reach, y - 3.5, 2 + 0.9 * r(), vary(foa.flower, r, 0.3));
      line([[x + hand * reach, y - 3.5], [x + hand * (reach + 3.5), y - 6]], foa.flower, 0.6, 0.8);
    }
  };
  const candyUpright = (r, fx, fy) => {
    // candy flower from beside, and a violet nodding on its stalk
    for (let k = 0; k < 4; k += 1) { const a = -1.57 + (k - 1.5) * 0.62, reach = 24 + 10 * r(); line([[fx - 16, fy], [fx - 16 + Math.cos(a) * reach, fy + Math.sin(a) * reach]], cnd.stalk, 1.3); ctx.fillStyle = css(leafTone(r, cnd)); blade(r, fx - 16 + Math.cos(a) * reach, fy + Math.sin(a) * reach, a, 22, OVATE); }
    line([[fx - 16, fy], [fx - 13, fy - 92]], cnd.stalk, 1.6);
    for (const a of [-2.75, -0.4]) { ctx.fillStyle = css(leafTone(r, cnd)); blade(r, fx - 13.5, fy - 70, a, 20, OVATE); }
    for (let k = 0; k < 4; k += 1) five(r, fx - 13 + (k - 1.5) * 9 + (r() - 0.5) * 3, fy - 96 - 6 * r() - (k % 2) * 7, 6.5, r() < 0.5 ? cnd.petal : mix(cnd.petal, cnd.vein, 0.35), [70, 50, 70], cnd.vein);
    line([[fx + 22, fy], [fx + 26, fy - 60], [fx + 32, fy - 66]], vio.mid, 1.5);
    violetFlower(r, fx + 33, fy - 62, 9, 0.2);
    line([[fx + 22, fy], [fx + 14, fy - 30]], vio.mid, 1.5);
    heartLeaf(r, fx + 14, fy - 30, -1.9, 34, { ...vio, vein: mix(vio.light, [80, 40, 62], 0.5) }, 0.1);
  };
  column(1, [candyFlat, violetFlat], [foamUpright, candyUpright]);

  // ---- Pacific bleeding heart: leaves cut as finely as a fern's, bluish; over them stalks that arch, each
  // with a row of pink hearts hanging under its end
  const bld = P.bleeding;
  // A leaf: a long stalk that divides in three, each division a little feather of lobes, and each lobe cut
  // again into narrow teeth with air between them. (Lobes laid close made a solid three-cornered blade,
  // mottled: four diamonds to a plant.)
  const cutLeaf = (r, x, y, angle, long, squash = 1) => {
    const c = Math.cos(angle), s = Math.sin(angle), fork = 0.42, jx = x + c * long * fork, jy = y + s * long * fork;
    const wood = mix(bld.stalk, bld.mid, 0.5);
    line([[x, y], [jx, jy]], wood, 1.5);
    const feather = (fa, flong) => {
      const fc = Math.cos(fa), fs = Math.sin(fa) * squash, n = Math.max(3, Math.round(flong / 10));
      line([[jx, jy], [jx + fc * flong, jy + fs * flong]], wood, 1.1);
      for (let j = 1; j <= n; j += 1) for (const side of [-1, 1]) {
        const f = j / (n + 0.3), px = jx + fc * flong * f, py = jy + fs * flong * f, la = fa + side * (0.95 - 0.3 * f), ll = flong * 0.4 * (1 - 0.5 * f) + 5;
        for (const off of [-0.36, 0, 0.36]) { ctx.fillStyle = css(leafTone(r, bld)); blade(r, px, py, la + off, ll * (off === 0 ? 1 : 0.72), [0, 0.1, 0.15, 0.16, 0.14, 0.1, 0.05, 0]); }
      }
      for (const off of [-0.4, 0, 0.4]) { ctx.fillStyle = css(leafTone(r, bld)); blade(r, jx + fc * flong * 0.96, jy + fs * flong * 0.96, fa + off, 9, [0, 0.1, 0.15, 0.16, 0.14, 0.1, 0.05, 0]); }
    };
    feather(angle + 1.05, long * 0.44); feather(angle - 1.05, long * 0.44); feather(angle, long * 0.58);
  };
  // (from above: its leaves, and over them the ends of its flower stalks, each a short row of hearts seen end-on)
  const bleedingFlat = (n) => (r, cx, cy) => {
    for (let i = 0; i < n; i += 1) { const a = (i / n) * 6.2832 + (r() - 0.5) * 0.5; cutLeaf(r, cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, a, 104 + 12 * r()); }
    for (let i = 0; i < 3; i += 1) {
      const a = (i / 3) * 6.2832 + 1 + r(), far = 26 + 34 * r(), bend = a + (r() - 0.5) * 1.2;
      line([[cx, cy], [cx + Math.cos(a) * far, cy + Math.sin(a) * far]], bld.stalk, 1.6);
      for (let k = 0; k < 5; k += 1) { const x = cx + Math.cos(a) * far + Math.cos(bend) * k * 8.5, y = cy + Math.sin(a) * far + Math.sin(bend) * k * 8.5; oval(x, y, 6.5 - 0.5 * k, 4.6 - 0.3 * k, bend + 1.57, vary(bld.heart, r, 0.5)); disc(x, y, 1.6, bld.tip, 0.9); }
    }
  };
  // a flower: a heart, hanging by its notch, paler at its point
  const heart = (r, x, y, big) => {
    const tone = vary(bld.heart, r, 0.5);
    disc(x - big * 0.26, y + big * 0.3, big * 0.34, tone); disc(x + big * 0.26, y + big * 0.3, big * 0.34, tone);
    ctx.fillStyle = css(tone); ctx.beginPath(); ctx.moveTo(x - big * 0.58, y + big * 0.42); ctx.lineTo(x + big * 0.58, y + big * 0.42); ctx.lineTo(x, y + big * 1.1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(bld.tip); ctx.beginPath(); ctx.moveTo(x - big * 0.16, y + big * 0.86); ctx.lineTo(x + big * 0.16, y + big * 0.86); ctx.lineTo(x, y + big * 1.16); ctx.closePath(); ctx.fill();
  };
  const bleedingUpright = (stalks) => (r, fx, fy) => {
    cutLeaf(r, fx + 6, fy - 2, -1.57 + 0.75, 84, 0.6);
    cutLeaf(r, fx - 4, fy - 2, -1.57 - 0.85, 76, 0.6);
    stalks.forEach(([lean, tall, hand]) => {
      // up, and over to one side: the hearts hang under the part that has gone over
      const points = [];
      for (let k = 0; k <= 14; k += 1) { const t = k / 14, over = Math.pow(Math.max(0, t - 0.5) / 0.5, 1.6); points.push([fx + lean * t + hand * 40 * over, fy - tall * (t - 0.34 * over * over)]); }
      line(points, bld.stalk, 1.8);
      for (let k = 8; k <= 14; k += 1) { const [x, y] = points[k]; line([[x, y], [x + hand * 1.5, y + 5]], bld.stalk, 0.9); heart(r, x + hand * 1.5, y + 4, 11.5 - 0.45 * (k - 8)); }
    });
  };
  column(2, [bleedingFlat(4), bleedingFlat(3)], [bleedingUpright([[4, 196, 1], [-8, 150, -1]]), bleedingUpright([[-4, 180, -1]])]);

  // ---- English daisy, in the old field's turf: a flat rosette of spoon-shaped leaves, and over it white heads
  // with yellow middles, some flushed pink at their tips
  const dsy = P.daisy;
  const head = (r, x, y, big, flat = 1) => {
    const flush = r() < 0.4;
    for (let k = 0; k < 18; k += 1) {
      const a = (k / 18) * 6.2832 + r() * 0.1, px = x + Math.cos(a) * big * 0.6, py = y + Math.sin(a) * big * 0.6 * flat;
      oval(px, py, big * 0.48, big * 0.17, Math.atan2(Math.sin(a) * flat, Math.cos(a)), vary(dsy.ray, r, 0.25));
      if (flush) disc(x + Math.cos(a) * big * 1.0, y + Math.sin(a) * big * 1.0 * flat, big * 0.12, dsy.blush, 0.8);
    }
    oval(x, y - (1 - flat) * big * 0.25, big * 0.32, big * 0.32 * (0.55 + 0.45 * flat), 0, dsy.disc);
    disc(x - big * 0.08, y - (1 - flat) * big * 0.3 - big * 0.06, big * 0.1, [52, 96, 70], 0.9);
  };
  const daisyFlat = (r, cx, cy) => {
    const heads = [];
    for (let p = 0; p < 3; p += 1) {
      const a = p * 2.1 + r() * 0.8, far = 46 + 26 * r(), x = cx + Math.cos(a) * far, y = cy + Math.sin(a) * far, n = 8 + Math.floor(3 * r());
      for (let k = 0; k < n; k += 1) { ctx.fillStyle = css(leafTone(r, dsy)); blade(r, x, y, (k / n) * 6.2832 + r() * 0.3, 30 + 10 * r(), SPOON, 0.06); }
      for (let k = 0; k < 3 + Math.floor(2 * r()); k += 1) { const ha = k * 2.4 + r() * 1.2, hf = 10 + 32 * r(); heads.push([x + Math.cos(ha) * hf, y + Math.sin(ha) * hf]); }
    }
    for (const [x, y] of heads) if (Math.abs(x - cx) < 106 && Math.abs(y - cy) < 106) head(r, x, y, 14);
  };
  const daisyUpright = (r, fx, fy) => {
    for (let k = 0; k < 7; k += 1) { const a = -1.57 + (k - 3) * 0.42 + (r() - 0.5) * 0.2; ctx.fillStyle = css(leafTone(r, dsy)); blade(r, fx + (k - 3) * 5, fy, a, 26 + 8 * r(), SPOON, 0.06); }
    for (let k = 0; k < 4; k += 1) {
      const x0 = fx + (k - 1.5) * 15 + (r() - 0.5) * 6, tall = 62 + 46 * r(), lean = (k - 1.5) * 9 + (r() - 0.5) * 8;
      line([[x0, fy], [x0 + lean * 0.4, fy - tall * 0.6], [x0 + lean, fy - tall]], dsy.stalk, 1.5);
      head(r, x0 + lean, fy - tall - 2, 13, 0.5);
    }
  };
  column(3, [daisyFlat, daisyFlat], [daisyUpright, daisyUpright]);

  // ================= western trillium =================
  // From above: three broad leaves in a whorl and, over the gaps between them, three petals round a yellow
  // middle, a green sepal showing between each two. From beside: a bare stalk, the leaves at its top, and the
  // flower standing a little over them. New and white in the first column; aged, pink going to rose, in the second.
  const tri = P.trillium, TRI_Y = 768;
  [tri.petal, tri.aged].forEach((petal, k) => {
    const aged = k === 1;
    const petalAt = (r, x, y, a, long) => {
      ctx.fillStyle = css(vary(petal, r, 0.3)); blade(r, x, y, a, long, PETAL, 0.02);
      if (aged) { ctx.fillStyle = css(tri.deep, 0.75); blade(r, x, y, a, long * 0.55, [0, 0.18, 0.24, 0.24, 0.2, 0.14, 0.07, 0]); }
      line([[x, y], [x + Math.cos(a) * long * 0.8, y + Math.sin(a) * long * 0.8]], aged ? tri.deep : [90, 14, 80], 0.9, 0.55);
    };
    box(k * CELL, TRI_Y, CELL, CELL, (ox, oy) => {
      const r = rng(6400 + k * 13), cx = ox + CELL / 2, cy = oy + CELL / 2, turn = r() * 2;
      for (let i = 0; i < 3; i += 1) {
        const a = turn + i * 2.0944 + (r() - 0.5) * 0.12, long = 100 + 8 * r(), tone = leafTone(r, tri), c = Math.cos(a), s = Math.sin(a);
        ctx.fillStyle = css(tone); blade(r, cx + c * 5, cy + s * 5, a, long, OVATE, 0.02);
        ctx.strokeStyle = css(mix(tone, tri.vein, 0.7), 0.7); ctx.lineWidth = 1.5;
        for (const off of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(cx + c * 6, cy + s * 6); ctx.quadraticCurveTo(cx + (c * 0.5 - s * off) * long, cy + (s * 0.5 + c * off) * long, cx + c * long * 0.95, cy + s * long * 0.95); ctx.stroke(); }
      }
      for (let i = 0; i < 3; i += 1) { ctx.fillStyle = css(tri.sepal); blade(r, cx, cy, turn + i * 2.0944, 34, NARROW); }
      for (let i = 0; i < 3; i += 1) petalAt(r, cx, cy, turn + 1.0472 + i * 2.0944, 46 + 4 * r());
      for (let i = 0; i < 6; i += 1) disc(cx + Math.cos(turn + i * 1.0472 + 0.5) * 6.5, cy + Math.sin(turn + i * 1.0472 + 0.5) * 6.5, 2.5, tri.heart);
      disc(cx, cy, 2.6, [86, 40, 62]);
    });
    [0, 1].forEach((half) => box(k * CELL + half * HALF, TRI_Y + CELL, HALF, CELL, (ox, oy) => {
      const r = rng(6450 + k * 13 + half * 5), fx = ox + HALF / 2, fy = oy + CELL - 3, lean = (half ? -1 : 1) * 3, tx = fx + lean, ty = fy - 178;
      line([[fx, fy], [fx + lean * 0.5, fy - 90], [tx, ty]], tri.stalk, 3.6);
      // its leaves: one to either side, drooping a little, and one towards whoever is looking
      for (const a of [Math.PI - 0.3, 0.3]) { const tone = leafTone(r, tri); ctx.fillStyle = css(tone); blade(r, tx, ty, a, 54, [0, 0.12, 0.19, 0.21, 0.18, 0.13, 0.06, 0]); line([[tx, ty], [tx + Math.cos(a) * 46, ty + Math.sin(a) * 46]], mix(tone, tri.vein, 0.7), 1.1, 0.7); }
      oval(tx, ty + 9, 17, 10, 0, leafTone(r, tri));
      line([[tx, ty], [tx + lean * 0.6, ty - 20]], tri.stalk, 2);
      const bx = tx + lean * 0.6, by = ty - 20;
      for (const a of [-2.95, -0.2]) { ctx.fillStyle = css(tri.sepal); blade(r, bx, by, a, 24, NARROW); }
      petalAt(r, bx, by, -2.3, 40); petalAt(r, bx, by, -0.84, 40); petalAt(r, bx, by, -1.57 + (half ? 0.12 : -0.12), 34);
      disc(bx, by - 5, 3, tri.heart);
    }));
  });

  // ================= what grows on dead wood =================
  // Each in a column of 128: one shelf seen from above and, under that, the same shelf seen from underneath,
  // the wood it grows from at the left edge. (plants/flowers.js lays the two over a small solid; a cluster of
  // oyster mushrooms or of turkey tails is several of them, each a plant of its own: index.js.)
  const FX = 512, FY = 768, FC = 128;
  // a shelf's outline seen from above or below: half an oval against the left edge, its rim a little uneven
  // (the same unevenness for every outline drawn from one `wave`, so that bands lie one inside another)
  const shelfPath = (wave, ox, oy, share, lumps) => {
    ctx.beginPath(); ctx.moveTo(ox + 3, oy + FC / 2 - 56 * share);
    for (let i = 0; i <= 26; i += 1) { const a = -Math.PI / 2 + (i / 26) * Math.PI, wob = 1 + lumps * wave[i]; ctx.lineTo(ox + 3 + Math.cos(a) * 114 * share * wob, oy + FC / 2 + Math.sin(a) * 56 * share * wob); }
    ctx.closePath();
  };
  const waves = (r, slow) => { const w = []; let v = 0; for (let i = 0; i <= 26; i += 1) { v = v * slow + (r() - 0.5) * 2 * (1 - slow); w.push(Math.sin(i * 1.7 + 0.4) * 0.5 + v * 2.2); } return w; };
  const shelfTop = (ox, oy, seed, bands, rings, lumps = 0.035) => {
    const r = rng(seed), wave = waves(r, 0.5);
    for (const [share, colour] of bands) { ctx.fillStyle = css(vary(colour, r, 0.3)); shelfPath(wave, ox, oy, share, lumps); ctx.fill(); }
    for (const [share, colour] of rings) { ctx.strokeStyle = css(colour, 0.5); ctx.lineWidth = 1.3; shelfPath(wave, ox, oy, share, lumps); ctx.stroke(); }
  };
  // from underneath: pores as fine dots, or gills as lines that run from where it is fast to the wood out to its rim
  const shelfUnder = (ox, oy, seed, colour, rim, pores, { lumps = 0.035, gills = null } = {}) => {
    const r = rng(seed), wave = waves(r, 0.5);
    ctx.fillStyle = css(rim); shelfPath(wave, ox, oy, 1, lumps); ctx.fill();
    ctx.fillStyle = css(colour); shelfPath(wave, ox, oy, 0.93, lumps); ctx.fill();
    for (let k = 0; k < pores; k += 1) { const a = (r() - 0.5) * Math.PI, far = 0.9 * Math.sqrt(r()); disc(ox + 3 + Math.cos(a) * 114 * far, oy + FC / 2 + Math.sin(a) * 56 * far, 0.9 + 0.6 * r(), mix(colour, [34, 30, 52], 0.35), 0.7); }
    if (gills) {
      ctx.save(); shelfPath(wave, ox, oy, 0.93, lumps); ctx.clip();
      for (let g = 0; g <= 44; g += 1) { const a = -Math.PI / 2 + (g / 44) * Math.PI; ctx.strokeStyle = css(gills, 0.8); ctx.lineWidth = g % 2 ? 0.9 : 1.3; ctx.beginPath(); ctx.moveTo(ox + 3 + Math.cos(a) * 10, oy + FC / 2 + Math.sin(a) * 5); ctx.lineTo(ox + 3 + Math.cos(a) * 124, oy + FC / 2 + Math.sin(a) * 62); ctx.stroke(); }
      ctx.restore();
    }
  };
  // -- red-belted conk: grey-black and crusted, then a belt of red-orange, then a pale rim
  const cnk = P.conk, grey = mix(cnk.top, [30, 8, 34], 0.5);
  box(FX, FY, FC, FC, (ox, oy) => shelfTop(ox, oy, 6501, [[1, cnk.rim], [0.9, cnk.belt], [0.76, mix(cnk.belt, cnk.top, 0.6)], [0.62, cnk.top], [0.44, grey], [0.24, cnk.top]], [[0.33, [0, 0, 6]], [0.53, [0, 0, 6]], [0.69, [0, 0, 8]], [0.83, cnk.band]]));
  box(FX, FY + FC, FC, FC, (ox, oy) => shelfUnder(ox, oy, 6501, cnk.under, cnk.rim, 220));
  // -- artist's conk: a broad shelf, brown and ridged, with a white rim; white underneath
  const art = P.artist;
  box(FX + FC, FY, FC, FC, (ox, oy) => shelfTop(ox, oy, 6511, [[1, art.rim], [0.93, art.band], [0.74, art.top], [0.52, art.band], [0.3, art.top]], [[0.2, [20, 20, 16]], [0.4, [20, 20, 16]], [0.62, [20, 20, 16]], [0.84, [20, 20, 16]]]));
  box(FX + FC, FY + FC, FC, FC, (ox, oy) => shelfUnder(ox, oy, 6511, art.under, mix(art.under, art.band, 0.4), 60));
  // -- oyster mushroom: one cream cap, a fan from the wood with a wavy rim, a little darker towards where it is
  // fast; gills underneath, running down to the wood
  const oys = P.oyster;
  box(FX + 2 * FC, FY, FC, FC, (ox, oy) => shelfTop(ox, oy, 6521, [[1, mix(oys.cap, oys.shade, 0.55)], [0.95, oys.cap], [0.62, mix(oys.cap, oys.shade, 0.3)], [0.34, mix(oys.cap, oys.shade, 0.7)]], [], 0.08));
  box(FX + 2 * FC, FY + FC, FC, FC, (ox, oy) => shelfUnder(ox, oy, 6521, oys.gill, mix(oys.cap, oys.shade, 0.4), 0, { lumps: 0.08, gills: oys.shade }));
  // -- turkey tail: one thin bracket, banded from the wood out in browns, a grey-blue and tan, its rim cream
  const trk = P.turkey;
  box(FX + 3 * FC, FY, FC, FC, (ox, oy) => shelfTop(ox, oy, 6531,
    [[1, trk.rim], [0.93, trk.bands[4]], [0.84, trk.bands[1]], [0.74, trk.bands[3]], [0.64, trk.bands[2]], [0.54, trk.bands[0]], [0.44, trk.bands[1]], [0.33, trk.bands[2]], [0.22, trk.bands[0]]],
    [[0.28, [20, 30, 12]], [0.49, [20, 30, 12]], [0.69, [20, 30, 12]], [0.89, [20, 30, 14]]], 0.07));
  box(FX + 3 * FC, FY + FC, FC, FC, (ox, oy) => shelfUnder(ox, oy, 6531, trk.under, trk.rim, 40, { lumps: 0.07 }));

  // ================= Methuselah's beard =================
  // Strands that hang from a limb, each a thread with short side threads standing from it all its length, some
  // a hand long and some more than a metre; a tangle of short ones at the top, where they are fast.
  const brd = P.beard, BY = 1152, BH = 384;
  for (let k = 0; k < 4; k += 1) box(FX + k * FC, BY, FC, BH, (ox, oy) => {
    const r = rng(6600 + k * 17);
    // (drawn far thicker than the thread it is: a thread a pixel wide is gone from a card a few strides off)
    const strand = (x0, long, width) => {
      const colour = vary(mix(brd.dark, brd.light, r()), r, 0.5), wave = 3 + 5 * r(), phase = r() * 6.3, drift = (r() - 0.5) * 16, points = [];
      for (let y = 0; y <= long; y += 4) points.push([x0 + drift * (y / long) + Math.sin(y * 0.021 + phase) * wave * Math.min(1, y / 60), oy + 4 + y]);
      line(points, colour, width, 0.97);
      for (let i = 1; i < points.length - 1; i += 1) {
        const [x, y] = points[i], thin = 1 - 0.5 * (i / points.length);
        for (const hand of [-1, 1]) if (r() < 0.8) line([[x, y], [x + hand * (4 + 7 * r()) * thin, y + (r() - 0.3) * 4]], colour, 1.3, 0.9);
      }
    };
    for (let i = 0; i < 16; i += 1) strand(ox + 12 + (FC - 24) * r(), 30 + 90 * r(), 2.6);
    for (let i = 0; i < 9; i += 1) strand(ox + 14 + (FC - 28) * ((i + 0.3 + 0.4 * r()) / 9), (BH - 14) * (0.4 + 0.58 * Math.pow(r(), 0.7)), 3.2);
  });

  // where each plant's paintings are, for its first column: a cell as [u0, v0, u1, v1], the sheet painted top-down
  const rect = (x, y, wide, tall) => [x / W, 1 - (y + tall) / H, (x + wide) / W, 1 - y / H];
  return { texture: cutoutTexture(canvas), canvas,
    carpet: { flat: [rect(0, 0, CELL, CELL), rect(0, CELL, CELL, CELL)], upright: [rect(0, 2 * CELL, HALF, CELL), rect(HALF, 2 * CELL, HALF, CELL)], variants: [4, CELL / W] },
    trillium: { top: rect(0, TRI_Y, CELL, CELL), side: [rect(0, TRI_Y + CELL, HALF, CELL), rect(HALF, TRI_Y + CELL, HALF, CELL)], variants: [2, CELL / W] },
    fungus: { top: rect(FX, FY, FC, FC), under: rect(FX, FY + FC, FC, FC), variants: [4, FC / W] },
    beard: [0, 1, 2, 3].map((k) => rect(FX + k * FC, BY, FC, BH)) };
}
