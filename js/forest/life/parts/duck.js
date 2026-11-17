// The ducks' parts of a bird: a duck's bill, and webs between the front toes. life/bird.js builds them and
// life/plumage.js paints them, each only for a sheet that asks for it (`shape.bill.duck`, `shape.leg.web`), so every
// other bird is vertex for vertex and pixel for pixel what it was. Nothing here imports the builder: what it needs
// of it is handed in.
//
//   shape.bill.duck: { flat, nail, serrate, tip, deep, nostril }
//     flat      0..1, how flat the bill's section is: 0 nearly round (a merganser's, "narrow, cylindrical"), 1 broad
//               and flat-topped (a dabbler's)
//     nail      mm: the length of the nail, the hard plate that ends the upper mandible and hooks down over the
//               lower one's tip
//     serrate   0..1: the "teeth" along the cutting edges of both mandibles (a merganser's; 0 none)
//     tip       the bill's width at the tip, as a share of its width at the base (a merganser's sides run nearly
//               parallel; a harlequin's "converge rapidly to the tip")
//     deep      its depth at the tip, as a share of its depth at the base
//     nostril   where the nostril is, as a share of the way from the base to the tip (it is painted)
//   shape.leg.web: { share, scallop }
//     share     how far out along the toes the web reaches, as a share of their length (a duck's: nearly to the tips)
//     scallop   how far the web's free edge is cut back between the toes, as a share of that
//   plumage.web            the web's colour (it is the leg's if not given)
//   plumage.bill.nail      the nail's colour;  plumage.bill.ridge   a stripe along the top of the upper mandible
//
// The bill is laid out as the songbird's is (life/bird.js): in the level pose, from the head's front, where the
// outline is as deep and as wide as the bill, an upper mandible on the head's bone and a lower one on the jaw's,
// meeting along the cutting edge, which is where the jaw's hinge is; and its paint is laid out the same way in its
// cell: along it from the base, round each mandible from one cutting edge over the top to the other, the upper
// mandible in the cell's upper half and the lower one in its lower half. Its exposed culmen is measured as the
// songbird's is: on the mesh, from the top of the bill's base to the top of its tip.

const RES = [{ along: 10, round: 10, teeth: true, mouth: true }, { along: 4, round: 4, teeth: false, mouth: false }, { along: 2, round: 2, teeth: false, mouth: false }];

// A duck's bill, in place of the songbird's. `put(out, x, y, z)` sets a vertex's place from millimetres of the level
// pose; `inCell(cell, u, v)` is a point of a cell of the sheet.
export function buildDuckBill({ skin, body, bill, level, put, inCell, CELLS, marks, head, jaw }) {
  const D = bill.duck, res = RES[level];
  const x0 = body.front, yTop = body.top(x0), yLow = body.bottom(x0), depth = yTop - yLow, half0 = body.half(x0);
  const edge = yTop - depth * 0.56;                                    // the cutting edge at the base, where the jaw hinges
  const flat = D.flat ?? 0.3, tipShare = D.tip ?? 0.5, deep = D.deep ?? 0.45, power = 1 - 0.65 * flat;
  const hu0 = depth * 0.56, hl0 = depth * 0.44;
  // along the bill, t from 0 at the base to 1 at the tip
  const line = (t) => edge - bill.drop * bill.culmen * t * t;          // the cutting edge, let down a little towards the tip
  const fall = (t) => 1 - (1 - deep) * Math.pow(t, 0.8);               // its depth, as a share of the base's
  // in plan its sides run in to `tip` of the base's width, and the tip is rounded off over its last part
  const rounding = 0.16;
  const wide = (t) => half0 * (1 - (1 - tipShare) * Math.pow(t, 1.2)) * (t <= 1 - rounding ? 1 : Math.sqrt(Math.max(0.04, 1 - ((t - 1 + rounding) / rounding) ** 2)));
  // The nail: over its length the upper mandible's tip turns down over the lower one's, which stops a little short.
  const nailFrom = (length) => Math.max(0.55, 1 - (D.nail || 0) / Math.max(length, 1));
  const hook = (t, from) => (D.nail && t > from ? Math.pow((t - from) / (1 - from), 2.2) * Math.min(D.nail * 0.4, depth * 0.3) : 0);
  const section = (th) => Math.pow(Math.max(0, Math.sin(th)), power);
  // the top of the tip: what the culmen is measured to (the last ring is drawn in, as the songbird's is)
  const END = 0.3;
  const tipTop = (from) => line(1) - hook(1, from) + hu0 * fall(1) * END;
  // the bill's length along x, so that the culmen from the top of its base to the top of its tip is the published one
  let length = bill.culmen, from = nailFrom(length);
  for (let k = 0; k < 4; k += 1) { from = nailFrom(length); const drop = yTop - tipTop(from); length = Math.sqrt(Math.max(bill.culmen * bill.culmen - drop * drop, 1)); }
  from = nailFrom(length);
  const nu = res.round, nv = res.along;
  for (const upper of [true, false]) {
    const reach = upper ? 1 : 0.95;
    const base = skin.sheet(nu, nv, (i, j, out) => {
      const t = j / nv, th = (i / nu) * Math.PI, end = j === nv ? END : 1, w = wide(t * reach) * (j === nv ? 0.35 : 1);
      const lift = upper ? hu0 * fall(t) * end * section(th) : -hl0 * 0.9 * fall(t) * end * section(th);
      put(out, x0 + length * t * reach, line(t * reach) - (upper ? hook(t, from) : 0) + lift, -Math.cos(th) * w * (upper ? 1 : -1));
      [out.u, out.v] = inCell(CELLS.bill, 0.04 + 0.92 * t, upper ? 0.05 + 0.4 * (i / nu) : 0.55 + 0.4 * (i / nu));
      out.b0 = upper ? head : jaw;
    });
    if (upper) { marks.culmenBase = [base + Math.round(nu / 2)]; marks.billTip = [base + nv * (nu + 1) + Math.round(nu / 2)]; }
    if (res.mouth) {
      // the inside of the mouth, seen when the bill opens: a strip from one cutting edge to the other
      skin.sheet(1, nv, (i, j, out) => {
        const t = j / nv, w = wide(t * reach) * (j === nv ? 0.35 : 1);
        put(out, x0 + length * t * reach, line(t * reach) - (upper ? hook(t, from) : 0), (i ? -1 : 1) * w * (upper ? 1 : -1));
        [out.u, out.v] = inCell(CELLS.mouth, 0.5, 0.5);
        out.b0 = upper ? head : jaw;
      });
    }
  }
  // The "teeth" of a merganser's bill: sharp points along the cutting edges of both mandibles, inclined backwards,
  // each a small blade standing out of the edge, seen from either side (two faces). Only the nearest level has them.
  if (res.teeth && D.serrate > 0) {
    const count = Math.round(10 + 14 * D.serrate), size = Math.max(0.5, depth * 0.075 * D.serrate);
    const first = skin.index.length, pt = { x: 0, y: 0, z: 0 }, holder = { p: { set: (px, py, pz) => { pt.x = px; pt.y = py; pt.z = pz; } } };
    for (const upper of [true, false]) {
      for (const sz of [1, -1]) {
        for (let k = 0; k < count; k += 1) {
          // a tooth's root is a stretch of the edge; its point hangs from the upper edge (stands from the lower), aimed back
          const t0 = 0.1 + 0.8 * (k / count), t1 = t0 + 0.55 * (0.8 / count), tm = t0 - 0.25 * (0.8 / count);
          // (each face has vertices of its own: shared, the two faces' normals would cancel)
          for (const face of [0, 1]) {
            const p = [];
            for (const [t, down] of [[t0, 0], [t1, 0], [tm, 1]]) {
              put(holder, x0 + length * t, line(t) - (upper ? hook(t, from) : 0) + (upper ? -1 : 1) * size * down, sz * wide(t) * 0.98);
              const [u, v] = inCell(CELLS.bill, 0.04 + 0.92 * t, upper ? (sz < 0 ? 0.06 : 0.44) : (sz < 0 ? 0.94 : 0.56));
              p.push(skin.vertex(pt.x, pt.y, pt.z, u, v, upper ? head : jaw));
            }
            if (face) skin.index.push(p[0], p[2], p[1]); else skin.index.push(p[0], p[1], p[2]);
          }
        }
      }
    }
    skin.shade(first, skin.index.length);
  }
  return { length, nail: from };
}

// Webs between the three front toes of one foot (`side` 1 the right, -1 the left), at the nearest level, where the
// toes are built. Each is a membrane from the middle toe to a side toe, out to `share` of their length, its free edge
// cut back between them by `scallop`, with an upper and an under face; each of its vertices goes with the toe joints
// on either side of it, so it closes and opens as the toes do (life/parts/swim.js folds them on a paddle's recovery).
export function buildWebs({ skin, put, inCell, CELLS, side, name, B, kx, kz, ground, leg, toeYaw }) {
  const web = leg.web, share = web.share ?? 0.92, scallop = web.scallop ?? 0.18, r = leg.thick[2] * 0.62;
  const toes = { M: { yaw: 0, length: leg.toes.mid }, O: { yaw: toeYaw(leg, 'O'), length: leg.toes.side }, I: { yaw: toeYaw(leg, 'I'), length: leg.toes.side * 0.96 } };
  // which bone a point a share u of the way along a toe goes with: the foot's, then the toe's second and third joints
  const boneAt = (key, u) => (u < 1 / 3 - 1e-6 ? B[`toes${name}`] : u < 2 / 3 - 1e-6 ? B[`toe${key}B${name}`] : B[`toe${key}C${name}`]);
  // a point on a toe's middle line, a little under its middle: the toe's own skin hides the web's edge
  const on = (key, u, out) => {
    const { yaw, length } = toes[key], d = length * u;
    out[0] = kx + Math.cos(yaw) * d; out[1] = ground + r * 0.78 + (u < 1 / 3 ? leg.thick[2] * 0.3 * (1 - 3 * u) : 0); out[2] = kz + Math.sin(yaw) * d;
    return out;
  };
  const [K, J] = [6, 3], a = [0, 0, 0], b = [0, 0, 0], uv = inCell(CELLS.leg, 0.5, 0.985);
  for (const key of ['O', 'I']) {
    // seen from above, is the side toe to the middle toe's right (its yaw outwards on the right foot)? That says which
    // way the faces are wound
    const right = (toes[key].yaw > 0) === (side > 0);
    for (const under of [false, true]) {
      skin.sheet(J, K, (i, j, out) => {
        const across = i / J, edge = share * (1 - scallop * Math.sin(Math.PI * across)), u = (0.03 + 0.97 * (j / K)) * edge;
        on('M', u, a); on(key, u, b);
        put(out, a[0] + (b[0] - a[0]) * across, a[1] + (b[1] - a[1]) * across + (under ? -0.15 : 0.05), (a[2] + (b[2] - a[2]) * across) * side);
        [out.u, out.v] = uv;
        out.b0 = boneAt('M', u); out.b1 = boneAt(key, u); out.w1 = across;
      }, { flip: right === under });
    }
  }
}

// ---- paint (life/plumage.js hands in its own brush)

// The bill's marks over its two colours: a stripe along the top of the upper mandible, the nail, and the nostril.
export function paintDuckBill({ ctx, r, w, h, P, D, culmen, stroke, vary, css, shift, ragged, wobble }) {
  const nailU = D.nail ? Math.max(0.5, 0.96 - 0.92 * (D.nail / culmen)) : 1;
  if (P.ridge) stroke(ctx, r, -w * 0.02, h * 0.25, w * (nailU + 0.02), h * 0.25, h * 0.13, vary(P.ridge, r, wobble * 0.4), { ragged, taperIn: 0.02, taperOut: 0.3 });
  if (D.nostril) {
    // a slit on either side of the upper mandible, a quarter of the way round from each cutting edge
    const u = 0.04 + 0.92 * D.nostril;
    ctx.fillStyle = css(shift(P.upper, 0, -10, -60));
    for (const v of [0.15, 0.35]) { ctx.beginPath(); ctx.ellipse(w * u, h * v, w * 0.05, h * 0.025, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  if (D.nail && P.nail) {
    // the nail covers the whole tip of the upper mandible, and a little of the lower one's
    stroke(ctx, r, w * nailU, h * 0.25, w * 1.02, h * 0.25, h * 0.46, vary(P.nail, r, wobble * 0.3), { ragged: ragged * 0.5, taperIn: 0.25, taperOut: 0.05 });
    stroke(ctx, r, w * (nailU + 0.4 * (1 - nailU)), h * 0.75, w * 1.02, h * 0.75, h * 0.3, vary(P.nail, r, wobble * 0.3), { ragged: ragged * 0.5, taperIn: 0.4, taperOut: 0.05 });
  }
}

// The web's colour, in the strip of the leg's cell the webs are laid on (its last few rows, which the tubes of the
// legs and toes do not reach: they are laid from 0.04 to 0.96 of the cell).
export function paintWeb({ ctx, w, h, colour, css }) {
  ctx.fillStyle = css(colour);
  ctx.fillRect(-2, h * 0.968, w + 4, h * 0.04);
}
