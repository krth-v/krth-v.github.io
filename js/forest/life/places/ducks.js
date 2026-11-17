import * as THREE from 'three';
import { SHAPE, river } from '../../world/land.js';

// Where the ducks can be (life/families/swimmer.js): the river, as a line of stations from world/land.js (its middle
// line, `SHAPE.RIVER`, and metres down it, `SHAPE.riverAlong`), and what is along it. A place on the water is given
// as metres down the river and metres across it from its middle, to the right of the current (+) or its left (-),
// and is at the water's own surface there (land.js `river`, which the river's sheet is laid at: world/water.js).
//
// The river is 13 m wide everywhere (land.js HALF: 6.5) and its bed falls from its edge to 1.35 m within 5 m of it:
// so 0.8 m inside its edge it is about 16 cm deep, and 2.5 m inside it about 60 cm. Riffles are where the water is
// painted broken and paler (world/water.js RIFFLES: its shape is the same over them); the pools are in the bends.

const { RIVER, riverAlong, HALF } = SHAPE;
export const WIDTH = HALF;
const N = RIVER.length;
const _r = [0, false, 0, 0, 0], _m = { x: 0, z: 0, dx: 1, dz: 0 };

// Where the river runs over a riffle, in metres down it, and half the riffle's length. A copy of world/water.js's own
// (it does not export it): if those move, these must.
export const RIFFLES = [[20, 13], [130, 14], [250, 15], [408, 13], [478, 12], [620, 14]];
export const riffle = (down) => { let most = 0; for (const [at, half] of RIFFLES) { const t = (down - at) / half; if (t > -1 && t < 1) most = Math.max(most, (1 - t * t) * (1 - t * t)); } return most; };

// The stretch of the river the ducks keep to: inside the world's own box, and ending far enough from where the
// walk comes down to the river (395 to 500 m down it) that a duck at either end is too small to be seen from there
// (a merganser 200 m off is two pixels long at 1080 lines).
export const REACH = [150, 690];
// The stretch their homes are in: the river within about 130 m of the walk (measured against the walk's own points:
// the walk is 9 m from the river's middle at 427 m down it, 26 m at 404, 41 m at 472, 65 m at 497, 104 m at 320).
export const HOMES = [300, 560];

// how far each point is down the river, and the way the current goes there
const DX = new Float64Array(N), DZ = new Float64Array(N);
for (let i = 0; i < N; i += 1) {
  const a = RIVER[Math.max(0, i - 1)], b = RIVER[Math.min(N - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  DX[i] = (b[0] - a[0]) / l; DZ[i] = (b[1] - a[1]) / l;
}
function segment(down) {
  let lo = 0, hi = N - 2;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (riverAlong[mid] <= down) lo = mid; else hi = mid - 1; }
  return lo;
}
// The river's middle at `down` metres, and the way the current runs there (a unit vector), into `out` { x, z, dx, dz }.
export function middle(down, out = { x: 0, z: 0, dx: 1, dz: 0 }) {
  const d = Math.min(riverAlong[N - 1], Math.max(0, down)), i = segment(d), t = (d - riverAlong[i]) / Math.max(riverAlong[i + 1] - riverAlong[i], 1e-6);
  out.x = RIVER[i][0] + (RIVER[i + 1][0] - RIVER[i][0]) * t; out.z = RIVER[i][1] + (RIVER[i + 1][1] - RIVER[i][1]) * t;
  const dx = DX[i] + (DX[i + 1] - DX[i]) * t, dz = DZ[i] + (DZ[i + 1] - DZ[i]) * t, l = Math.hypot(dx, dz) || 1;
  out.dx = dx / l; out.dz = dz / l;
  return out;
}
// A point on the water, `down` metres down the river and `across` metres to the right of its current, at the water's surface.
export function onWater(down, across, out = new THREE.Vector3()) {
  middle(down, _m);
  const x = _m.x - _m.dz * across, z = _m.z + _m.dx * across;
  return out.set(x, river(x, z, _r)[2], z);
}
// Where a point is to the river: metres down it, metres across it (to the right of its current +), metres from the
// water's edge (negative in the water) and the water's height there.
export function where(x, z, out = { down: 0, across: 0, from: 0, level: 0 }) {
  river(x, z, _r);
  out.down = _r[4]; out.from = _r[0]; out.level = _r[2];
  middle(out.down, _m);
  out.across = -(x - _m.x) * _m.dz + (z - _m.z) * _m.dx;
  return out;
}
// the water's surface at (x, z)
export const level = (x, z) => river(x, z, _r)[2];
// how much the river turns at `down`, in radians a metre: positive where it turns to the right of its current
export function bend(down) {
  const a = middle(down - 4, { x: 0, z: 0, dx: 1, dz: 0 }), b = middle(down + 4, { x: 0, z: 0, dx: 1, dz: 0 });
  return Math.atan2(a.dx * b.dz - a.dz * b.dx, a.dx * b.dx + a.dz * b.dz) / 8;
}

// A place to stand out of the water, within `spread` metres along the river of `down`, on the side `side` (+1 to the
// right of the current, -1 its left): on a bar's cobbles, 0.4 to 1.5 m from the water's edge, a little over the water,
// on no slope a duck would not stand on, and in no solid (a boulder, a log). { at, down, across, side }, with the
// place on the river it was laid out by (a point off the water is not asked where it is: on the inside of a bend
// land.js's `river` can answer for the other reach), or null if none was found. (Ducks loaf on gravel bars and
// points: on a rock in the stream too, which the layout's boulders could be: not looked for here.)
export function barSpot(habitat, down, side, r, spread = 10, out = new THREE.Vector3()) {
  for (let tries = 0; tries < 8; tries += 1) {
    const d = down + (r() - 0.5) * spread, across = side * (HALF + 0.4 + r() * 1.1);
    if (d < REACH[0] || d > REACH[1]) continue;
    onWater(d, across, out);
    const { x, z } = out;
    if (habitat.ground(x, z) !== 'stones') continue;
    const y = habitat.height(x, z), lv = level(x, z);
    if (y < lv + 0.03 || y > lv + 0.7) continue;
    const e = 0.4, gx = habitat.height(x + e, z) - habitat.height(x - e, z), gz = habitat.height(x, z + e) - habitat.height(x, z - e);
    if (Math.hypot(gx, gz) / (2 * e) > 0.3 || habitat.solidAt(x, z, 0.35)) continue;
    return { at: out.set(x, y, z), down: d, across, side };
  }
  return null;
}
