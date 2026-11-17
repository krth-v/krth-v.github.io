import * as THREE from 'three';

// The weasel family's parts of the beast builder (life/beast.js), mustelids 2026-11-16: the long tail that tapers.
// (The long low body itself needs nothing new of the builder: its trunk is the sheet's rings, laid long and low, and
// its back bends at the chest's joint; how it bounds and swims is life/parts/longRig.js.)
//
//   shape.tail.taper   the tip's breadth as a share of the root's. A sheet that gives it has this tail in place of
//                      the elk's short flat one: the elk's is built first and its faces are then taken away (its few
//                      vertices are left, held by nothing that is drawn). The rest of the tail's fields are the elk's:
//                      `at` its root, `length` (m) from the root to the very tip, `width` and `depth` (m) at the root,
//                      `hang` (degrees from straight down: 90 straight back, over 90 rising). Optional: `bulge` (m
//                      added to the half breadth at the middle of its length: a plume of hair), `curl` (degrees the
//                      line turns up by its tip; 0 keeps it straight, as it is measured).
// One bone, the elk's: the tail turns at its root, and its first fifth goes partly with the hips. Its paint is the
// sheet's tail cell (life/coat.js): round it from its underside (u 0) by its left side to its top (u 0.5) and back
// by its right, and along it from the root (v 0) to the tip (v 1). A sheet's `coat.tail.at(u, v)` paints the cell,
// if it gives one (one line in life/coat.js), in place of the elk's two tones.
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const D = Math.PI / 180;
const ROWS = [16, 6, 3], SIDES = [10, 6, 4];

export function longTail(skin, shape, pivots, level, { B, cell, inCell, marks }) {
  const tail = shape.tail, rows = ROWS[level], sides = SIDES[level], taper = tail.taper, bulge = tail.bulge || 0;
  // the elk's tail, built already, is taken out of the faces (every vertex of it is held by the tail's bone alone)
  {
    const bone = skin.bone, index = skin.index, keep = [], held = (v) => bone[v * 4] === B.tail;
    for (let f = 0; f < index.length; f += 3) if (!(held(index[f]) && held(index[f + 1]) && held(index[f + 2]))) keep.push(index[f], index[f + 1], index[f + 2]);
    for (let k = 0; k < keep.length; k += 1) index[k] = keep[k];
    index.length = keep.length;
  }
  const w0 = tail.width / 2, d0 = tail.depth / 2;
  const half = (t, r0) => r0 * (1 - (1 - taper) * t ** 0.9) * Math.sqrt(Math.max(0, 1 - smooth(0.82, 1.0, t) * 0.55)) + bulge * Math.sin(Math.PI * Math.min(1, t * 1.1)) ** 0.7;
  // the tip is a point a little past the last ring: so the line is shorter than the length by that much
  const tipR = Math.max(half(1, w0), 0.002), line = Math.max(0.01, tail.length - 0.6 * tipR);
  const ring = [], c = pivots.tail.clone(), step = line / rows;
  const dirAt = (t) => { const h = (tail.hang + (tail.curl || 0) * t) * D; return new THREE.Vector3(-Math.sin(h), -Math.cos(h), 0); };
  for (let j = 0; j <= rows; j += 1) {
    const t = j / rows;
    if (j > 0) c.addScaledVector(dirAt(t - 0.5 / rows), step);
    const T = dirAt(t);
    ring.push({ c: c.clone(), T, U: new THREE.Vector3(T.y, -T.x, 0), t, w: half(t, w0), d: half(t, d0) });
  }
  const base = skin.sheet(sides, rows, (i, j, out) => {
    const { c: at, U, t, w, d } = ring[j], ph = (i / sides) * Math.PI * 2;
    out.p.copy(at).addScaledVector(U, -Math.cos(ph) * d);
    out.p.z += -Math.sin(ph) * w;
    [out.u, out.v] = inCell(cell, i / sides, t * 0.97);
    out.b0 = B.tail; out.b1 = B.hips; out.w1 = 0.7 * (1 - smooth(0, 0.2, t));
  }, { flip: true, wrap: true });
  const end = ring[rows], tip = end.c.clone().addScaledVector(end.T, 0.6 * tipR);
  const centre = skin.vertex3(tip.x, tip.y, tip.z, ...inCell(cell, 0.5, 0.995), B.tail, B.tail, 0, B.tail, 0);
  skin.cap(centre, base + rows * (sides + 1), sides, true);
  // for measuring (life/beast.js measureBeast's `tail`): the middle of the root's ring, and the tip
  marks.tailRoot = Array.from({ length: sides }, (_, i) => base + i);
  marks.tailTip = [centre];
}
