import * as THREE from 'three';
import { river, SHAPE } from '../../world/land.js';
import { onLimb } from '../perch.js';

// Where a Belted Kingfisher can be: the river, and what stands over it. Read once for each habitat (a page has
// one; the count of walks makes none of its own) from what the habitat already reads (life/habitat.js), and from
// the river's own line (world/land.js): nothing here is read from the layout, and nothing here changes the habitat.
//
//   posts    where it sits to watch the water. Every limb the habitat can read: the boughs of the trees it reads
//            boughs of (`leafy`, within 26 m of the walk) and the limbs of every trunk it reads (`trunks`, within
//            46 m), each at shares out along it towards its end, where a limb over the water is; and the stubs of
//            broken limbs. Kept where they stand over the water or within FROM m of its edge, between LOW and HIGH
//            over it, on wood that lies within 30 degrees of the level and is thick enough for the bird's foot.
//            Each post faces the water (across its limb, as a bird sits on one), and keeps the places in front of
//            it where the water is deep enough to plunge into (`targets`).
//   at()     the river's own places: a point `down` metres down its middle line, `across` metres to its far bank's
//            side (negative: ours), on the water's face. Where it hovers, where it plunges, and the line it flies.
//
// What is from sources (the species' file says which): it watches from unobstructed perches over the water, often a
// dead limb; it plunges in head first and takes its prey near the face, often without going wholly under; it may hover
// before it dives. Everything else here is the agent's own: every height, distance and share.
//
// The driftwood on the bars is not read: a kind that lies as the ground does is sheared where it is drawn, and the
// habitat passes over it (life/habitat.js). Nor is the creek, which `depth` does not know: its places are the
// river's alone.

export const LOW = 1.2, HIGH = 15;               // metres over the water that a post may be
export const FROM = 6;                           // and how far back from the water's edge (a stub, which is dead wood, a little further)
const SHARES = [0.35, 0.5, 0.65, 0.78, 0.9];     // the places read along each limb
const THIN = 0.009, THICK = 0.08;                // the limb's radius there (m): no thinner, no thicker
const LEVEL = 0.8;                               // the most a limb may rise or fall in a metre of its length (about 38 degrees)
const REACH = 22;                                // a tree whose foot stands further than this from the water has no limb over it
export const DEEP = 0.45;                        // the least depth of water to plunge into (m)

// The places where the river runs over a riffle, in metres down it, and half the riffle's length: copied from
// world/water.js (RIFFLES, which that file does not export), where the water paints itself broken.
export const RIFFLES = [[20, 13], [130, 14], [250, 15], [408, 13], [478, 12], [620, 14]];
export const riffle = (down) => { let most = 0; for (const [at, half] of RIFFLES) { const t = (down - at) / half; if (t > -1 && t < 1) most = Math.max(most, (1 - t * t) * (1 - t * t)); } return most; };

const LINE = SHAPE.RIVER, ALONG = SHAPE.riverAlong, LENGTH = ALONG[ALONG.length - 1];
export const riverLength = LENGTH;
const _r = [0, false, 0, 0, 0];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The river's middle line `down` metres down it: fills `into` (the point, on the water's face), `ahead` (the way it
// runs there, level) and returns `into`. `across`: metres to the side of the far bank (negative: towards ours).
export function at(down, across = 0, into = new THREE.Vector3(), ahead = null) {
  const d = Math.min(LENGTH, Math.max(0, down));
  let i = 0, j = ALONG.length - 1;
  while (j - i > 1) { const m = (i + j) >> 1; if (ALONG[m] <= d) i = m; else j = m; }
  const a = LINE[i], b = LINE[Math.min(LINE.length - 1, i + 1)], seg = Math.max(1e-6, ALONG[Math.min(ALONG.length - 1, i + 1)] - ALONG[i]), t = (d - ALONG[i]) / seg;
  const ux = b[0] - a[0], uz = b[1] - a[1], l = Math.hypot(ux, uz) || 1;
  // (a point a side's normal away from the line, (-uz, ux), is on the far bank: life/land.js `river` calls a side
  // negative of the line's direction ours)
  const x = a[0] + ux * t - (uz / l) * across, z = a[1] + uz * t + (ux / l) * across;
  into.set(x, river(x, z, _r)[2], z);
  if (ahead) ahead.set(ux / l, 0, uz / l);
  return into;
}

// How deep the water is at (x, z), from the river's own section (world/land.js `valley`), and whether it is water.
export function depth(x, z) {
  const from = river(x, z, _r)[0];
  return from >= 0 ? 0 : 1.25 * smooth(0, -5, from) + 0.1 * smooth(0, -1.2, from);
}

const cache = new WeakMap();
const _o = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() };
const _w = new THREE.Vector3(), _f = new THREE.Vector3(), _t = new THREE.Vector3();

// Every post along the river, in the habitat as it is: [{ point, along, radius, kind, tree, over, from, down, water,
// face, targets }], lowest first. Read once a habitat.
export function riverPosts(habitat) {
  if (cache.has(habitat)) return cache.get(habitat);
  const posts = [], trees = new Set();
  const keep = (point, along, radius, kind, tree, back = FROM) => {
    river(point.x, point.z, _r);
    const from = _r[0], water = _r[2], over = point.y - water, down = _r[4];
    if (from > back || over < LOW || over > HIGH) return;
    if (along && Math.abs(along.y) > LEVEL / Math.hypot(1, LEVEL)) return;
    if (radius < THIN || radius > THICK) return;
    if (posts.some((p) => p.point.distanceToSquared(point) < 0.36)) return;
    posts.push({ point: point.clone(), along: along ? along.clone() : null, radius, kind, tree, over, from, down, water, face: null, targets: [] });
  };
  // the limbs of a tree: shares out along each, as life/habitat.js reads a bough (a tree whose foot stands further
  // from the water than its limbs could reach is passed over)
  const limbs = (place, limbSet, tree) => {
    if (river(place.foot.x, place.foot.z, _r)[0] > REACH) return;
    for (const tube of limbSet.tubes) for (const share of SHARES) {
      const radius = onLimb(place, limbSet, tube, share, _o);
      keep(_o.point, _o.along, radius, 'limb', tree);
    }
  };
  for (const tree of habitat.leafy) { trees.add(tree.place.foot.x * 1e4 + tree.place.foot.z); limbs(tree.place, tree.limbs, tree); }
  for (const place of habitat.trunks) {
    if (!place.perch.limbs || trees.has(place.foot.x * 1e4 + place.foot.z)) continue;
    limbs(place, place.perch.limbs, place);
  }
  for (const stub of habitat.stubs) keep(stub.point, stub.along, stub.radius, 'stub', stub.place, FROM + 2);
  // which way each faces: across its wood, the side that looks more towards the water (the way its distance from the
  // water's edge falls fastest); and the places in front of it, a little to either side, deep enough to plunge into
  for (const post of posts) {
    const e = 0.5, p = post.point;
    _w.set(river(p.x - e, p.z, _r)[0] - river(p.x + e, p.z, _r)[0], 0, river(p.x, p.z - e, _r)[0] - river(p.x, p.z + e, _r)[0]);
    if (_w.lengthSq() < 1e-8) _w.set(1, 0, 0); else _w.normalize();
    if (post.along) {
      _f.set(-post.along.z, 0, post.along.x);
      if (_f.lengthSq() < 1e-8) _f.copy(_w); else { _f.normalize(); if (_f.dot(_w) < 0) _f.negate(); }
    } else _f.copy(_w);
    post.face = _f.clone();
    for (const turn of [0, -0.45, 0.45, -0.8, 0.8]) for (const far of [2.5, 4, 5.5, 7.5]) {
      const c = Math.cos(turn), s = Math.sin(turn), x = p.x + (_f.x * c - _f.z * s) * far, z = p.z + (_f.x * s + _f.z * c) * far;
      if (depth(x, z) < DEEP) continue;
      post.targets.push(new THREE.Vector3(x, river(x, z, _r)[2], z));
    }
  }
  posts.sort((a, b) => a.over - b.over);
  const out = { posts };
  cache.set(habitat, out);
  return out;
}

// A point to hover over: `down` metres down the river, `across` its middle (kept a metre and a half inside either
// edge), `high` metres over the water. Its water is deep enough to plunge into, or null.
export function hoverAt(down, across, high, into = new THREE.Vector3()) {
  at(down, Math.max(-5, Math.min(5, across)), into);
  if (depth(into.x, into.z) < DEEP) return null;
  into.y += high;
  return into;
}

// The river's line, from `fromDown` to `toDown` metres down it, a point every `step` metres, `across` its middle
// (eased from `acrossFrom` to `acrossTo`) and `high` metres over the water (eased likewise): the way a kingfisher
// flies along it. Returns a list of points.
export function riverLine(fromDown, toDown, { acrossFrom = 0, acrossTo = acrossFrom, highFrom = 1.5, highTo = highFrom, step = 7 } = {}) {
  const out = [], n = Math.max(1, Math.ceil(Math.abs(toDown - fromDown) / step));
  for (let k = 0; k <= n; k += 1) {
    const t = k / n, e = t * t * (3 - 2 * t), down = fromDown + (toDown - fromDown) * t;
    const p = at(down, acrossFrom + (acrossTo - acrossFrom) * e, new THREE.Vector3());
    p.y += highFrom + (highTo - highFrom) * e;
    out.push(p);
  }
  return out;
}

// Where (x, z) lies along the river: metres down it, and metres across its middle (positive towards the far bank).
const _a = new THREE.Vector3(), _h = new THREE.Vector3();
export function placeOf(x, z) {
  river(x, z, _r);
  const down = _r[4];
  at(down, 0, _a, _h);
  return { down, across: (x - _a.x) * -_h.z + (z - _a.z) * _h.x };
}
