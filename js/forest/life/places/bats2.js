import { river, creek, inMeadow, SHAPE } from '../../world/land.js';

// Where the bats of the valley hunt (life/families/bat.js), read once from the land as it was laid out
// (world/land.js), for each habitat a visit is made in. A bat's home on a visit is one of these beats:
//   river     a stretch of the river's middle line, 45 to 60 m of it, within sight of the walk: a bat goes up and down
//             it over the water ("they flew up and down rivers and streams in relatively straight patterns": the
//             Handbook of the Mammals of the World, of the Yuma Myotis)
//   creek     the creek below the falls (the ravine, then the swale across the clearing's foot), or above them (the
//             gully from the spring towards the footbridge, which it stops short of: a bat low over the water would
//             fly through the foot log)
//   clearing  the old clearing, five metres and more inside its edge: open air, for a bat that hawks in circles
//   edge      the clearing's edge, seven metres in from its outline, round it: the forest's edge, clear of its boughs.
//             (It was three metres in. The trees stand from a metre and a half outside the outline and their limbs
//             reach four to eight metres in over it, from two to four metres up, and a bat's heights there are 1.5 to
//             14 m: measured over sixteen visits, 1.8 to 2.6 in a hundred of a bat's places on this beat were within a
//             metre of a limb's middle line, where on the other beats 0.3 in a hundred and fewer are. The same test at
//             places along the line drawn 3, 5, 7 and 9 m in read least at 7. Drawn there, the same visits read 0.4 to
//             1.2 in a hundred; most of what is left is the little brown bat's, low among the willows at the back of
//             the beach, which lies inside the clearing's outline.)
// Both keep off what stands in the clearing (`KEEP_OFF`): the old apple tree, 6.5 m to the walker's right at 484 m
// along the walk (scenes/walk.js), whose crown reaches 4.7 m from its foot and hangs from 1.5 to 6.6 m up. The edge's
// ring passed a metre from its trunk, through its crown, and the clearing's open air came within a metre and a
// half of it: the ring is cut there (its beat is then a line with two ends, 7 m either side of the tree), and no
// place in the clearing, nor the way to it (`through`), comes within 7 m of the tree's foot. (That was of the ring
// as it was first drawn, three metres in.) The young spruces and alders at the clearing's east edge are not kept
// off; the forest's own boughs over the edge are kept off by how far in the edge's ring is drawn.
// A beat is { kind, path: [[x, z], ...], along: [metres], closed, half, length, x, z }: `half` is how far to either
// side of its line a bat may stray (a clearing's beat has no line: `inside(x, z)` and its box say where it may go).
//
// `floorAt(habitat, x, z)`: what a bat must keep above there, the ground or the water's face, whichever is higher.

const DEEP = SHAPE.CREEK_DEEP, HALF = SHAPE.HALF;
const KEEP_OFF = [[-25.95, -65.5, 7]];                  // [x, z, metres]: the old apple tree
const IN = 7;                                           // m: how far inside the clearing's outline the edge's beat is drawn
const clear = (x, z) => KEEP_OFF.every(([kx, kz, r]) => Math.hypot(x - kx, z - kz) >= r);
// whether the straight way from (ax, az) to (bx, bz) keeps off everything in KEEP_OFF
function through(ax, az, bx, bz) {
  const ux = bx - ax, uz = bz - az, l2 = ux * ux + uz * uz;
  return KEEP_OFF.every(([kx, kz, r]) => {
    const t = l2 > 1e-9 ? Math.min(1, Math.max(0, ((kx - ax) * ux + (kz - az) * uz) / l2)) : 0;
    return Math.hypot(ax + ux * t - kx, az + uz * t - kz) >= r;
  });
}
const _r = [0, false, 0, 0, 0], _c = [0, 0, 0, 0, 0];

export function floorAt(habitat, x, z) {
  let floor = habitat.height(x, z);
  river(x, z, _r);
  if (_r[0] < 0.8) floor = Math.max(floor, _r[2]);
  creek(x, z, _c);
  if (_c[0] < _c[2] + 0.8) floor = Math.max(floor, _c[1] + DEEP);
  return floor;
}

// is (x, z) over the river's or the creek's water?
export function overWater(x, z) {
  river(x, z, _r);
  if (_r[0] < 0) return true;
  creek(x, z, _c);
  return _c[0] < _c[2];
}

// a polyline's running lengths, and a point `u` metres along it (wrapping if it is closed)
const lengths = (path) => { const out = [0]; for (let i = 1; i < path.length; i += 1) out.push(out[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1])); return out; };
export function pointOn(beat, u, out) {
  const { path, along, length, closed } = beat;
  let v = closed ? ((u % length) + length) % length : Math.min(length, Math.max(0, u));
  let i = 0;
  while (i < path.length - 2 && along[i + 1] < v) i += 1;
  const span = along[i + 1] - along[i], t = span > 1e-9 ? (v - along[i]) / span : 0;
  const ax = path[i][0], az = path[i][1], bx = path[i + 1][0], bz = path[i + 1][1];
  out.x = ax + (bx - ax) * t; out.z = az + (bz - az) * t;
  // the line's own way there (unit), for straying to one side of it
  const len = Math.hypot(bx - ax, bz - az) || 1;
  out.dx = (bx - ax) / len; out.dz = (bz - az) / len;
  return out;
}
// how far along a beat's line the point nearest (x, z) is
export function nearestOn(beat, x, z) {
  let best = Infinity, at = 0;
  const { path, along } = beat;
  for (let i = 0; i + 1 < path.length; i += 1) {
    const ax = path[i][0], az = path[i][1], ux = path[i + 1][0] - ax, uz = path[i + 1][1] - az, l2 = ux * ux + uz * uz;
    const t = l2 > 1e-9 ? Math.min(1, Math.max(0, ((x - ax) * ux + (z - az) * uz) / l2)) : 0;
    const d = Math.hypot(x - ax - ux * t, z - az - uz * t);
    if (d < best) { best = d; at = along[i] + (along[i + 1] - along[i]) * t; }
  }
  return at;
}
// a polyline with points about `step` metres apart
function dense(points, step) {
  const out = [];
  for (let i = 0; i + 1 < points.length; i += 1) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1], n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / step));
    for (let k = 0; k < n; k += 1) out.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  out.push([...points[points.length - 1]]);
  return out;
}
const beatOf = (kind, path, half, closed = false) => {
  const along = lengths(path), length = along[along.length - 1];
  let x = 0, z = 0;
  for (const [px, pz] of path) { x += px; z += pz; }
  return { kind, path, along, length, closed, half, x: x / path.length, z: z / path.length };
};

const cache = new WeakMap();
export function batPlaces(habitat) {
  if (cache.has(habitat)) return cache.get(habitat);
  // the walk, every two metres, to measure how far each place is from it
  const walk = [], p = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };
  for (let s = 0; s < habitat.length; s += 2) { habitat.beside(s, 0, p); walk.push([p.x, p.z]); }
  const off = (x, z) => { let least = Infinity; for (const [wx, wz] of walk) least = Math.min(least, (wx - x) * (wx - x) + (wz - z) * (wz - z)); return Math.sqrt(least); };

  // ---- the river: a beat round every sixth point of its line (3 m apart) that is within 45 m of the walk
  const R = SHAPE.RIVER, near = R.map(([x, z]) => off(x, z)), rivers = [];
  for (let i = 0; i < R.length; i += 6) {
    if (near[i] > 45) continue;
    const from = Math.max(0, i - 9), to = Math.min(R.length - 1, i + 9);
    if (to - from < 12) continue;
    const beat = beatOf('river', R.slice(from, to + 1).map(([x, z]) => [x, z]), HALF - 2.2);
    beat.off = near[i];
    rivers.push(beat);
  }
  // ---- the creek: below the falls, from the pool's sill to its mouth, in two beats (the ravine, the swale); and
  // above them, from the spring down the gully to 7 m short of the footbridge
  const C = SHAPE.CREEK, creeks = [];
  for (const [from, to] of [[11, 14], [14, 18], [0, 5]]) {
    const path = dense(C.slice(from, to + 1).map(([x, z]) => [x, z]), 2);
    let half = Infinity;
    for (let k = from; k <= to; k += 1) half = Math.min(half, C[k][3]);
    const beat = beatOf('creek', path, Math.max(0.3, Math.min(0.9, half * 0.6)));
    beat.off = Math.min(...path.map(([x, z]) => off(x, z)));
    creeks.push(beat);
  }
  // ---- the old clearing: open air five metres and more inside its edge
  const M = SHAPE.MEADOW.outline;
  const box = [Math.min(...M.map((q) => q[0])), Math.max(...M.map((q) => q[0])), Math.min(...M.map((q) => q[1])), Math.max(...M.map((q) => q[1]))];
  const clearing = { kind: 'clearing', path: null, closed: false, half: 0, inside: (x, z) => inMeadow(x, z) > 5 && clear(x, z), through, box, x: (box[0] + box[1]) / 2, z: (box[2] + box[3]) / 2, off: 0 };
  // ---- its edge: the outline drawn in by seven metres (`IN`: see the top of this file), all the way round (the
  // outline goes round with the clearing on its right or its left: which, its signed area says)
  let area = 0;
  for (let i = 0; i < M.length; i += 1) { const a = M[i], b = M[(i + 1) % M.length]; area += a[0] * b[1] - b[0] * a[1]; }
  const inward = area > 0 ? 1 : -1, ring = [];
  for (let i = 0; i < M.length; i += 1) {
    const a = M[(i - 1 + M.length) % M.length], b = M[i], c = M[(i + 1) % M.length];
    const n1 = [-(b[1] - a[1]), b[0] - a[0]], n2 = [-(c[1] - b[1]), c[0] - b[0]], l1 = Math.hypot(...n1) || 1, l2 = Math.hypot(...n2) || 1;
    const nx = n1[0] / l1 + n2[0] / l2, nz = n1[1] / l1 + n2[1] / l2, l = Math.hypot(nx, nz) || 1;
    ring.push([b[0] + (inward * IN * nx) / l, b[1] + (inward * IN * nz) / l]);
  }
  ring.push([...ring[0]]);
  // (cut where it comes near what the clearing keeps off: the line runs from just past the cut round to just
  // before it, with the beat's own straying to either side, 1.5 m, inside what is kept)
  const round = dense(ring, 3).slice(0, -1), kept = (q) => KEEP_OFF.every(([kx, kz, r]) => Math.hypot(q[0] - kx, q[1] - kz) >= r + 1.5);
  const cut = round.findIndex((q) => !kept(q));
  let edge;
  if (cut < 0) edge = beatOf('edge', [...round, [...round[0]]], 1.5, true);
  else {
    let from = cut; while (!kept(round[from % round.length])) from += 1;
    const line = [];
    for (let k = 0; k < round.length; k += 1) { const q = round[(from + k) % round.length]; if (!kept(q)) break; line.push(q); }
    edge = beatOf('edge', line, 1.5, false);
  }
  edge.off = 0;

  const places = { river: rivers, creek: creeks, clearing: [clearing], edge: [edge] };
  cache.set(habitat, places);
  return places;
}
