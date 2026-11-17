import * as THREE from 'three';
import { css, vary, shift, stroke, rng } from '../../paint/brush.js';

// An owl's parts of the bird builder (life/bird.js, life/plumage.js, life/material.js): the facial disc, with the
// eyes set in it and their upper lids; ear tufts; feathered legs and toes; and the shine of an eye in a light.
// Each is built only for a sheet that asks for it by its field, after or in place of what every bird has, so that
// a bird that asks for none of them is vertex for vertex and pixel for pixel what it was. bird.js and plumage.js
// call in here from a few lines each; nothing here imports them (they hand over what is needed).
//
//   shape.disc: { rim, depth, apart, wide?, at?, seam?, ruff?, back?, lid? }      (all millimetres but `depth`,
//                `wide` and `lid`) The face: a dish over the front of the head, as wide as `rim` up and down and
//                `rim * wide` across (1.1 if not given), its middle `at` mm up in the level pose (the eyes' height less
//                a seventh of `rim`, if not given), dished `depth` of `rim` deep about the eyes, its rim standing
//                `ruff` proud (`rim / 16`), a little behind the bill's base (`back`, `rim / 18`). It leaves the head
//                `seam` mm behind the rim (`rim * 0.4`): whatever of the head lies in front of the face is pressed
//                back behind it. The eyes are set in it `apart` mm either side of the middle, at the height and
//                with the radius `shape.eye` gives (its `x` is the front of the eye). `lid`: how far up behind the
//                brow the upper lid lies when the eye is open (radians; 1.15 if not given; false for none).
//   plumage.disc: { face, rim, band?, eyering?, brow?, bristle?, rings?, rays?, pupil?, lid?, streak? }   colours
//                ([h, s, l]); `band`: the feathers that turn back from the rim onto the head (the rim's colour if
//                not given); `rings`: [colour, how many]: arcs round each eye (a Barred Owl's); `rays`: [colour, how
//                many]: dark shafts radiating from each eye (a Saw-whet's streaked face); `streak`: dark shafts on
//                the rim's feathers; `eyering`: dark feathers close round each eye, `eyeringWide` of its radius out;
//                `pupil`: the pupil's share of the eye's radius (0.62 if not given: the wide pupil of the night).
//   shape.tufts: { long, at: [x, y], lean?, out?, wide?, deep? }  an ear tuft each side, `long` mm, rooted at
//                (x, y) of the level pose on the head's side, leaning back `lean` (0.3) and out `out` (0.25)
//                radians, `wide` and `deep` mm at its root (long / 5, long / 3). It takes the crown's own paint.
//   shape.leg.feathered: { to: 'tarsus' | 'toes', full }   the tarsus feathered, or the tarsus and the toes but
//                their last joint and claws; `full` 0..1 how thick the feathering stands.
//   shape.eye.shine: colour   what the eye gives back to a light held near the line of sight: see `shineOf`.
//
// The lids. An owl closes its eyes with the upper lid (sources below). The rig has no bone for a lid, and a bone
// added to every bird would change every bird. So for a sheet with a disc the jaw is the lids' bone: its pivot is
// put on the line through both eyeballs' middles, the lower mandible is held by the head instead (an owl's bill
// opens little when it hoots), and a pose's `gape` lets the lids down, half a radian for each 1: 2 * lid shuts
// them halfway. A family of owls sets `gape` as how far its eyes are shut.
//
// The paint. A sheet with a disc is painted 512 rows taller than any other (1024 x 2048: OWL_ROWS), and the strip
// below holds the face (a front view of it, 512 x 512) and the lids' paint; every other cell is where it is on
// every bird, and the texture coordinates of every part are squeezed to the taller sheet by bird.js.

export const OWL_ROWS = 512;
// rows of paint below the standard 1536 that a sheet needs; and what its texture coordinates are squeezed by
// (1, exactly, for a bird with no disc)
export const extraRows = (sheet) => (sheet.shape.disc ? OWL_ROWS : 0);
export const squeezeOf = (sheet) => (sheet.shape.disc ? 1536 / (1536 + OWL_ROWS) : 1);
// the strip's cells, in shares of the standard sheet (1024 across, 1536 down), as CELLS in life/bird.js
export const OWL_CELLS = { face: [0, 1, 0.5, 1 + 512 / 1536], lid: [0.5, 1, 0.5625, 1 + 64 / 1536] };

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---- the face's layout, which the builder and the painter share: where the disc is, how it is dished, where the
// eyes and the bill are, and the square of the paint that the front of it is laid on
export function discLayout(shape, body) {
  const d = shape.disc, eye = shape.eye;
  const x0 = body.front, rim = d.rim, Ry = rim, Rz = rim * (d.wide ?? 1.1);
  const yc = d.at ?? eye.y - rim / 7, xr = x0 - (d.back ?? rim / 18), ruff = d.ruff ?? rim / 16, deep = d.depth * rim;
  const seamX = xr - (d.seam ?? rim * 0.4);
  const yb = body.top(x0) - (body.top(x0) - body.bottom(x0)) * 0.5, bh = (body.top(x0) - body.bottom(x0)) / 2, bw = body.half(x0);
  const apart = d.apart ?? eye.r * 1.55, eyes = [[eye.y, apart], [eye.y, -apart]];
  // how far round the disc a point is, in shares of its rim (1 on the rim)
  const sOf = (y, z) => Math.hypot((y - yc) / Ry, z / Rz);
  // The dish, as how far forward the face is at (y, z), in front of the rim's plane: the ruff stands up at the rim,
  // the dish sinks deepest about each eye, a ridge of bristles runs down the middle to the bill, and round the
  // bill's base the face comes forward to a hair in front of it (the bill comes out of the bristles).
  const face = (y, z) => {
    const s = sOf(y, z);
    const well = Math.max(...eyes.map(([ey, ez]) => Math.exp(-(((y - ey) ** 2) + ((z - ez) ** 2)) / ((eye.r * 1.9) ** 2))));
    const dish = deep * Math.pow(Math.max(0, 1 - s * s), 0.6) * (0.5 + 0.5 * well);
    const ridge = Math.exp(-((z / (eye.r * 0.9)) ** 2)) * smooth(yb - bh * 3, yb, y) * (1 - smooth(eye.y, eye.y + eye.r * 1.8, y));
    const lip = ruff * Math.exp(-(((s - 0.94) / 0.08) ** 2));
    let x = xr + lip - dish * (1 - 0.75 * ridge);
    const at = Math.exp(-(((y - yb) / (bh * 1.5)) ** 2) - ((z / (bw * 1.8)) ** 2));
    x += (x0 + 0.3 - x) * Math.min(1, at * 1.4);
    return x;
  };
  // each eye: its middle in the face, the plane its rim is sunk to and its apex
  const r = eye.r, bulge = r * 0.28;
  const sunk = Math.min(...Array.from({ length: 12 }, (_, k) => face(eye.y + Math.sin(k * 0.5236) * r, apart + Math.cos(k * 0.5236) * r))) - 0.4;
  const ball = (r * r + bulge * bulge) / (2 * bulge);                                          // the cornea's radius of curvature
  const eyeAt = { y: eye.y, z: apart, rimX: sunk, apex: sunk + bulge, r, bulge, ball, centre: sunk + bulge - ball };
  return { x0, xr, yc, Ry, Rz, ruff, deep, seamX, yb, bh, bw, eyes, sOf, face, eye: eyeAt, lid: d.lid === false ? null : (d.lid ?? 1.15) };
}

// ---- the face, and the eyes and lids set in it: built after every other part, in the bird's one skin
// `c`: { skin, shape, level, body, put, inCell, B, CELLS, SKIN_EDGE, loft: [first, end) of the head and body's own
// vertices, grid: [the first vertex of its sheet, its columns round, its rows along], X, Y, Z (mm to the bind pose's
// metres), unX, unY, unZ (back) }
export function buildDisc(c) {
  const { skin, shape, level, body, put, inCell, B } = c;
  const L = discLayout(shape, body), p = new THREE.Vector3();
  const [nIn, nA] = [[7, 22], [3, 12], [1, 6]][level];
  // the seam: the head's own surface where the face leaves it, round from the chin up the right side, over the
  // crown and down the left (as the face's angle goes round)
  const ring = (phi, out) => {
    const turn = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), right = turn <= Math.PI, a = (right ? turn : 2 * Math.PI - turn) / Math.PI;
    body.surface(L.seamX, Math.min(1, Math.max(0, a)), out);
    if (!right) out.z = -out.z;
    return out;
  };
  // the square of paint the front of the face is laid on: as far out as the seam reaches
  let half = 0;
  for (let k = 0; k < 48; k += 1) { ring((k / 48) * 2 * Math.PI, p); half = Math.max(half, Math.abs(p.z), Math.abs(p.y - L.yc)); }
  half = Math.max(half, L.Ry, L.Rz) * 1.02;
  const uvOf = (y, z, out) => { [out.u, out.v] = inCell(OWL_CELLS.face, 0.5 + z / (2 * half), 0.5 - (y - L.yc) / (2 * half)); };

  // the dish and its rim: rings from the middle out to the rim (s from 0 to 1), then the ruff turned back and
  // down onto the head (two rings, the last on the seam)
  const rings = [];
  for (let j = 0; j <= nIn; j += 1) rings.push(Math.pow(j / nIn, 0.85));
  rings.push(1.05, 'seam');
  const seam = new THREE.Vector3();
  skin.sheet(nA, rings.length - 1, (i, j, out) => {
    const phi = (i / nA) * 2 * Math.PI, dy = -Math.cos(phi), dz = Math.sin(phi), s = rings[j];
    let x, y, z;
    if (s === 'seam') { ring(phi, seam); ({ x, y, z } = seam); }
    else if (s > 1) {
      // past the rim the ruff turns back towards the seam: a third of the way there, and a little out
      ring(phi, seam);
      const ry = L.yc + dy * L.Ry, rz = dz * L.Rz;
      y = ry + (seam.y - ry) * 0.35; z = rz + (seam.z - rz) * 0.35; x = L.face(ry, rz) - (L.face(ry, rz) - seam.x) * 0.3;
    } else { y = L.yc + dy * L.Ry * s; z = dz * L.Rz * s; x = L.face(y, z); }
    put(out, x, y, z);
    uvOf(y, z, out);
    out.b0 = B.head;
  }, { wrap: true });

  // The head's own skin ends at the seam. Every vertex of it in front of the seam is put onto the seam itself, where
  // its own column of the skin crosses it (the column's share of the way round is the seam's), so that the head's
  // surface runs on unbroken into the face's ruff, and what was in front of the seam is folded into the seam's ring
  // and hidden behind the face; the two fans' middles go just behind the face's middle. (Pressed back a hair behind
  // the face instead, the head's skin cut through the hollow dish between its corners, and its paint showed in the
  // face's middle, over the eyes; pressed onto a plane behind the face, it left a gap at the seam, a dark line
  // under the chin.)
  const P = skin.position, [base, cols, rows] = c.grid, grid = (cols + 1) * (rows + 1);
  for (let v = c.loft[0]; v < c.loft[1]; v += 1) {
    if (c.unX(P[v * 3]) <= L.seamX) continue;
    if (v >= base && v < base + grid) {
      const a = (((v - base) % (cols + 1)) / cols) * 2, half = a <= 1 ? a : 2 - a;
      body.surface(L.seamX, half, p);
      P[v * 3] = c.X(L.seamX); P[v * 3 + 1] = c.Y(p.y); P[v * 3 + 2] = c.Z(a <= 1 ? p.z : -p.z);
    } else { P[v * 3] = c.X(L.seamX - 2); P[v * 3 + 1] = c.Y(L.yc); P[v * 3 + 2] = 0; }
  }

  if (level !== 0) return L;
  // ---- the eyes: each a low dome in its well, looking ahead (the eye's own paint: the eye cell)
  const E = L.eye;
  for (const side of [1, -1]) {
    skin.sheet(10, 3, (i, j, out) => {
      const th = (i / 10) * Math.PI * 2, k = 1 - j / 3, rr = E.r * k;
      // a cap of the sphere the cornea lies on, from its rim (sunk into the well) to its apex
      const x = E.centre + Math.sqrt(Math.max(0, E.ball * E.ball - rr * rr));
      put(out, x, E.y + Math.sin(th) * rr, (E.z + Math.cos(th) * rr) * side);
      [out.u, out.v] = inCell(c.CELLS.eye, 0.5 + 0.46 * Math.cos(th) * side * k, 0.5 - 0.46 * Math.sin(th) * k);
      out.b0 = B.head;
    }, { flip: side > 0, wrap: true });
  }
  // ---- the upper lids: each a shell a hair in front of its cornea, round the eyeball's middle, drawn up behind
  // the brow while the eye is open, and let down by the jaw (above)
  if (L.lid != null) {
    const R = E.ball + 0.7, span = Math.asin(Math.min(0.98, (E.r * 1.08) / R)), reach = 1.3;
    for (const side of [1, -1]) {
      skin.sheet(5, 2, (i, j, out) => {
        const lam = (i / 5 - 0.5) * 2 * span, e = L.lid + (j / 2) * reach;
        put(out, E.centre + R * Math.cos(lam) * Math.cos(e), E.y + R * Math.cos(lam) * Math.sin(e), (E.z + R * Math.sin(lam)) * side);
        [out.u, out.v] = inCell(OWL_CELLS.lid, i / 5, j / 2);
        out.b0 = B.jaw;
      }, { flip: side > 0 });
    }
  }
  return L;
}

// Where the lids turn: on the line through both eyeballs' middles (the jaw's pivot, for a sheet with lids).
export function lidPivot(shape, body, at) {
  const L = discLayout(shape, body);
  return L.lid == null ? null : at(L.eye.centre, L.eye.y, 0);
}

// ---- ear tufts: a blade each side of the crown, taking the crown's paint, further back the further up it
export function buildTufts(c) {
  const { skin, shape, level, body, put, inCell, B } = c;
  if (level === 2) return;
  const t = shape.tufts, [x0, y0] = t.at, lean = t.lean ?? 0.3, outward = t.out ?? 0.25, wide = t.wide ?? t.long / 5, deep = t.deep ?? t.long / 3;
  const [sides, rows] = level === 0 ? [5, 3] : [3, 1];
  const z0 = body.out(x0, y0) * 0.8, a0 = body.around(x0, y0);
  for (const side of [1, -1]) {
    skin.sheet(sides, rows, (i, j, out) => {
      const k = j / rows, th = (i / sides) * Math.PI * 2, taper = Math.pow(1 - k, 0.75);
      // its middle line goes up, back and out from its root; across it, it is deeper (along the head) than wide
      const cx = x0 - Math.sin(lean) * t.long * k, cy = y0 + Math.cos(lean) * Math.cos(outward) * t.long * k, cz = z0 + Math.sin(outward) * t.long * k;
      put(out, cx + Math.cos(th) * deep * 0.5 * taper * Math.cos(lean), cy + Math.cos(th) * deep * 0.5 * taper * Math.sin(lean), (cz + Math.sin(th) * wide * 0.5 * taper) * side);
      const xs = Math.max(body.rear, x0 - t.long * k * 0.5), a = Math.min(1, a0 + 0.12 * k);
      [out.u, out.v] = inCell(c.CELLS.skin, 1 - (xs - body.rear) / (body.front - body.rear), c.SKIN_EDGE + (side > 0 ? 1 - a / 2 : a / 2) * (1 - 2 * c.SKIN_EDGE));
      out.b0 = B.head;
    }, { wrap: true, flip: side > 0 });
  }
}

// ---- feathered legs: which parts take the feathers' paint (the shin's cell), and how much thicker they stand
export function feathering(leg) {
  const f = leg.feathered;
  if (!f) return { tarsus: false, toes: 0, puff: 1, toePuff: 1 };
  const full = Math.min(1, Math.max(0, f.full ?? 1));
  return { tarsus: true, toes: f.to === 'toes' ? 2 : 0, puff: 1 + 0.8 * full, toePuff: 1 + 0.55 * full };
}

// ---- the paint: the face and the lids, and an owl's own eye, after everything every bird has is painted
// `p`: { ctx, ACROSS, DOWN, body, look }
export function paintOwl(sheet, p) {
  const { ctx, ACROSS, DOWN, body } = p, shape = sheet.shape, P = sheet.plumage, D = P.disc;
  if (!shape.disc) return null;
  const r = rng((sheet.seed ?? 31) * 7 + 401), L = discLayout(shape, body), ragged = p.look.paint.ragged, wobble = p.look.paint.vary;
  const cellPx = (cell) => [cell[0] * ACROSS, cell[1] * DOWN, (cell[2] - cell[0]) * ACROSS, (cell[3] - cell[1]) * DOWN];

  // the same square of the face the builder lays the paint on
  let half = 0;
  const q = new THREE.Vector3();
  for (let k = 0; k < 48; k += 1) {
    const phi = (k / 48) * 2 * Math.PI, right = phi <= Math.PI, a = (right ? phi : 2 * Math.PI - phi) / Math.PI;
    body.surface(L.seamX, Math.min(1, Math.max(0, a)), q);
    half = Math.max(half, Math.abs(q.z), Math.abs(q.y - L.yc));
  }
  half = Math.max(half, L.Ry, L.Rz) * 1.02;
  const [fx, fy, fw, fh] = cellPx(OWL_CELLS.face), k = fw / (2 * half);              // pixels to a millimetre of the face
  const X = (z) => fx + fw / 2 + z * k, Y = (y) => fy + fh / 2 - (y - L.yc) * k;
  ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
  const band = D.band || D.rim;
  ctx.fillStyle = css(band); ctx.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
  // the feathers that turn back from the rim onto the head, lying back from it (the band's colour, streaked)
  for (let i = 0; i < 520; i += 1) {
    const phi = r() * 2 * Math.PI, s = 1 + r() * 0.5, dy = -Math.cos(phi), dz = Math.sin(phi);
    const y = L.yc + dy * L.Ry * s, z = dz * L.Rz * s, len = (2.5 + r() * 3) * k;
    stroke(ctx, r, X(z), Y(y), X(z) + dz * len, Y(y) - dy * len, len * 0.55, vary(i % 3 ? band : (D.streak || shift(band, 0, 0, 6)), r, wobble * 0.6), { ragged, taperIn: 0.2, taperOut: 0.5 });
  }
  // the disc: feathers radiating from each eye, laid from the rim inwards so that each lies over the roots of the
  // ones outside it
  ctx.save(); ctx.beginPath();
  for (let i = 0; i <= 64; i += 1) { const phi = (i / 64) * 2 * Math.PI; const x = X(Math.sin(phi) * L.Rz * 0.97), y = Y(L.yc - Math.cos(phi) * L.Ry * 0.97); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  ctx.closePath(); ctx.clip();
  ctx.fillStyle = css(D.face); ctx.fillRect(fx, fy, fw, fh);
  for (let band = 9; band >= 1; band -= 1) {
    for (const [ey, ez] of L.eyes) {
      const n = 10 + band * 9;
      for (let i = 0; i < n; i += 1) {
        const th = (i / n) * 2 * Math.PI + r() * 0.3, d0 = L.eye.r * (0.9 + band * 0.42), len = L.eye.r * (0.55 + r() * 0.25);
        const y = ey + Math.sin(th) * d0, z = ez + Math.cos(th) * d0;
        if (L.sOf(y, z) > 1.02) continue;
        stroke(ctx, r, X(z), Y(y), X(z + Math.cos(th) * len), Y(y + Math.sin(th) * len), len * k * 0.3, vary(D.face, r, wobble * 0.7), { ragged, taperIn: 0.15, taperOut: 0.6 });
      }
    }
  }
  // arcs round each eye (the Barred Owl's "concentric semicircular bars"), on that eye's side of the face
  if (D.rings) {
    const [colour, count] = D.rings;
    for (const [ey, ez] of L.eyes) {
      for (let n = 1; n <= count; n += 1) {
        const rad = L.eye.r * (1.25 + (n * (L.Rz / L.eye.r - 1.4)) / (count + 0.6)), steps = 40;
        for (let s = 0; s < steps; s += 1) {
          const a0 = (s / steps) * 2 * Math.PI, a1 = ((s + 1) / steps) * 2 * Math.PI;
          const y0 = ey + Math.sin(a0) * rad, z0 = ez + Math.cos(a0) * rad, y1 = ey + Math.sin(a1) * rad, z1 = ez + Math.cos(a1) * rad;
          if (Math.sign(z0 || ez) !== Math.sign(ez) || Math.abs(z0) < L.eye.r * 0.5 || L.sOf(y0, z0) > 0.93) continue;
          stroke(ctx, r, X(z0), Y(y0), X(z1), Y(y1), (0.9 + r() * 0.5) * k, vary(colour, r, wobble * 0.5), { ragged, taperIn: 0.2, taperOut: 0.2 });
        }
      }
    }
  }
  // dark shafts radiating from each eye, on its own side of the face (a Saw-whet's streaked disc)
  if (D.rays) {
    const [colour, count] = D.rays;
    for (const [ey, ez] of L.eyes) for (let i = 0; i < count; i += 1) {
      const th = (i / count) * 2 * Math.PI + (r() - 0.5) * 0.25, d0 = L.eye.r * (1.5 + r() * 0.6), d1 = Math.min(L.Rz, L.Ry) * (0.75 + r() * 0.25);
      const y0 = ey + Math.sin(th) * d0, z0 = ez + Math.cos(th) * d0, y1 = ey + Math.sin(th) * d1, z1 = ez + Math.cos(th) * d1;
      if (Math.sign(z0) !== Math.sign(ez) || L.sOf(y1, z1) > 1) continue;
      stroke(ctx, r, X(z0), Y(y0), X(z1), Y(y1), (0.7 + r() * 0.6) * k, vary(colour, r, wobble * 0.5), { ragged, taperIn: 0.3, taperOut: 0.5 });
    }
  }
  // pale brows over the eyes, towards the middle, and the bristles down the middle and round the bill
  if (D.brow) for (const [ey, ez] of L.eyes) for (let i = 0; i < 26; i += 1) {
    const th = Math.PI * (0.3 + 0.45 * r()) * (ez > 0 ? 1 : -1), y = ey + L.eye.r * (1.05 + r() * 0.5), z = ez - Math.sign(ez) * L.eye.r * (0.2 + r() * 0.8);
    const len = L.eye.r * (0.6 + r() * 0.4);
    stroke(ctx, r, X(z), Y(y), X(z + Math.sign(ez) * Math.cos(th) * len * 0.3), Y(y + len * 0.6), len * k * 0.22, vary(D.brow, r, wobble * 0.5), { ragged, taperIn: 0.2, taperOut: 0.6 });
  }
  if (D.bristle) for (let i = 0; i < 60; i += 1) {
    const y = L.yb - L.bh * 0.6 + r() * (L.eye.y + L.eye.r * 0.4 - L.yb), z = (r() - 0.5) * L.eye.r * 1.1, len = L.eye.r * (0.6 + r() * 0.5);
    stroke(ctx, r, X(z), Y(y), X(z * 1.6), Y(y - len), len * k * 0.18, vary(D.bristle, r, wobble * 0.5), { ragged, taperIn: 0.1, taperOut: 0.7 });
  }
  // a ring of dark feathers close round each eye (a Barred Owl's crescent before it, a Spotted Owl's sooty patch)
  if (D.eyering) for (const [ey, ez] of L.eyes) for (let i = 0; i < 40; i += 1) {
    const th = (i / 40) * 2 * Math.PI, d0 = L.eye.r * 1.02, len = L.eye.r * (D.eyeringWide ?? 0.35) * (0.7 + r() * 0.5);
    stroke(ctx, r, X(ez + Math.cos(th) * d0), Y(ey + Math.sin(th) * d0), X(ez + Math.cos(th) * (d0 + len)), Y(ey + Math.sin(th) * (d0 + len)), len * k * 0.7, vary(D.eyering, r, wobble * 0.4), { ragged, taperIn: 0.2, taperOut: 0.5 });
  }
  ctx.restore();
  // the rim itself: a narrow ring of the rim's colour, its feathers lying round the disc, streaked
  for (let i = 0; i < 300; i += 1) {
    const phi = (i / 300) * 2 * Math.PI, s = 0.93 + r() * 0.1, dy = -Math.cos(phi), dz = Math.sin(phi);
    const y = L.yc + dy * L.Ry * s, z = dz * L.Rz * s, len = L.Ry * 0.1 * (0.7 + r() * 0.6);
    stroke(ctx, r, X(z), Y(y), X(z + dz * len * 0.4 + dy * len * 0.6), Y(y + dy * len * 0.4 - dz * len * 0.6), len * k * 0.45, vary(i % 4 === 0 && D.streak ? D.streak : D.rim, r, wobble * 0.6), { ragged, taperIn: 0.2, taperOut: 0.4 });
  }
  // the eyes as they are painted for the levels further off, which have no eyes of their own
  const pupil = D.pupil ?? PUPIL;
  for (const [ey, ez] of L.eyes) {
    ctx.fillStyle = css(P.eye.iris); ctx.beginPath(); ctx.arc(X(ez), Y(ey), L.eye.r * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(P.eye.pupil); ctx.beginPath(); ctx.arc(X(ez), Y(ey), L.eye.r * k * pupil, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // the lids: feathered, of the face's colour or their own, darker at the edge that comes down over the eye
  const [lx, ly, lw, lh] = cellPx(OWL_CELLS.lid), lid = D.lid || shift(D.face, 0, 0, -6);
  ctx.fillStyle = css(lid); ctx.fillRect(lx, ly, lw, lh);
  for (let i = 0; i < 40; i += 1) { const x = lx + r() * lw, y = ly + r() * lh; stroke(ctx, r, x, y, x + (r() - 0.5) * 4, y + lh * 0.25, lw * 0.08, vary(lid, r, wobble * 0.6), { ragged }); }
  ctx.fillStyle = css(shift(lid, 0, -10, -28)); ctx.fillRect(lx, ly, lw, lh * 0.12);

  // an owl's eye, in the eye cell: a wide pupil (it is seen by night) in its iris
  const [ex0, ey0, ew, eh] = cellPx(CELL_EYE);
  ctx.fillStyle = css(P.eye.iris); ctx.fillRect(ex0, ey0, ew, eh);
  ctx.fillStyle = css(P.eye.pupil); ctx.beginPath(); ctx.ellipse(ex0 + ew / 2, ey0 + eh / 2, ew * 0.46 * pupil, eh * 0.46 * pupil, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = css([210, 30, 92]); ctx.beginPath(); ctx.ellipse(ex0 + ew * 0.42, ey0 + eh * 0.38, ew * 0.06, ew * 0.04, -0.5, 0, Math.PI * 2); ctx.fill();

  // where the pupils are, for the shine: the eye cell's, and the two painted on the face (texture coordinates)
  const squeeze = DOWN / (DOWN + OWL_ROWS), uv = (px, py) => [px / ACROSS, 1 - (py / DOWN) * squeeze];
  const [cu, cv] = uv(ex0 + ew / 2, ey0 + eh / 2), [pu, pv] = uv(X(L.eyes[0][1]), Y(L.eyes[0][0])), [qu, qv] = uv(X(L.eyes[1][1]), Y(L.eyes[1][0]));
  return {
    eye: [cu, cv, (ew / 2) / ACROSS, ((eh / 2) / DOWN) * squeeze], rho: 0.92 * pupil,       // (the dome lays its rim 0.92 of the cell's half out)
    pupils: [pu, pv, qu, qv], pupilR: [(L.eye.r * k * pupil) / ACROSS, ((L.eye.r * k * pupil) / DOWN) * squeeze],
  };
}
// the pupil's share of the eye's radius, as an owl's is painted (wide: it is seen by night)
const PUPIL = 0.62;
// (the eye cell of life/bird.js CELLS, which this module does not import)
const CELL_EYE = [0.94, 0.540, 1.00, 0.583];

// ---- the eye's shine. What an owl's eye gives back to a light held close to the line of sight: the colour the
// sheet gives (`shape.eye.shine`), and where its pupils are on the painted sheet (`paintOwl`). Handed to the
// material (life/material.js) on the texture, so that nothing between the painter and the material changes.
export function shineOf(sheet, where) {
  const colour = sheet.shape.eye.shine;
  if (!colour || !where) return null;
  const c = new THREE.Color().setHSL(colour[0] / 360, colour[1] / 100, colour[2] / 100, THREE.SRGBColorSpace);
  return { colour: [c.r, c.g, c.b], ...where };
}
