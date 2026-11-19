import * as THREE from 'three';
import { GLADE } from '../../world/land.js';

// Where a black bear feeds in this valley in the middle of May (the bear's: life/families/bear.js), read once from
// the world as built (life/habitat.js), the first time a bear asks. A place is one of:
//   wet     the old cedar's sodden ground and the creek's edge: skunk cabbage, sedges
//   grass   the old clearing and the banks' grass: new grass, sedges and forbs
//   stones  a bar's cobbles: it turns stones over for what is under them
//   log     beside a fallen log, which it tears at for grubs and ants: `face` the way it faces to work at it, `reach`
//           how far the log's back is from where it stands (m), `at` how high the log's back is over its feet (m)
//   stump   beside a stump, the same
// Each with `x`, `z` (where it stands: ground a body 0.55 m round can stand on: the biggest boar's) and `off` (metres
// from the walk); at dead wood, `wx`, `wz` the point of the log's back or the stump's top that it works at.
// What was read: in spring a black bear eats new grasses, sedges and forbs, and skunk cabbage (search summaries,
// not a page read through: the sheet's note says which); it digs through logs for insects and lives by the
// rivers (NPS Olympic). Where in this valley each is, and every number here, is the agent's own.

const cache = new WeakMap();
const NEAREST = 9;                // m: no place nearer the walk than this (a bear by the tread is put up by every walk)

export function bearPlaces(habitat) {
  if (cache.has(habitat)) return cache.get(habitat);
  const places = [];
  // the walk, a point a metre, for how far a spot is from it (the habitat's own places carry theirs)
  const walk = [], p = new THREE.Vector3();
  for (let s = 0; s < habitat.length; s += 1) { habitat.beside(s, 0, p); walk.push(p.x, p.z); }
  const offWalk = (x, z) => { let best = Infinity; for (let i = 0; i < walk.length; i += 2) best = Math.min(best, (walk[i] - x) ** 2 + (walk[i + 1] - z) ** 2); return Math.sqrt(best); };
  const apart = (x, z, d) => places.every((one) => Math.hypot(one.x - x, one.z - z) >= d);

  // the open places a herd would graze (life/habitat.js `grazing`: nine to sixty metres from the walk)
  for (const g of habitat.grazing()) if ((g.ground === 'wet' || g.ground === 'grass' || g.ground === 'stones') && apart(g.x, g.z, 6)) places.push({ kind: g.ground, x: g.x, z: g.z, off: g.off });
  // the old cedar's wet ground, more closely: every four metres where it is sodden and a bear can stand
  for (let x = GLADE.x - GLADE.r; x <= GLADE.x + GLADE.r; x += 4) for (let z = GLADE.z - GLADE.r; z <= GLADE.z + GLADE.r; z += 4) {
    if (habitat.ground(x, z) !== 'wet' || !habitat.walkable(x, z, 0.6) || !apart(x, z, 5)) continue;
    const off = offWalk(x, z);
    if (off >= NEAREST) places.push({ kind: 'wet', x, z, off });
  }
  // beside dead wood: a log's back at two places along it, or a stump's top, no higher than a bear works at on all
  // fours; it stands square to the log, on whichever side has room
  const crest = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3() }, other = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3() };
  const besideWood = (kind, top, ax, az, off) => {
    const h = top.y - habitat.height(top.x, top.z);
    if (!(h > 0.05 && h < 0.75) || off < NEAREST) return;
    for (const side of [1, -1]) for (const d of [0.55, 0.8, 1.05, 1.3]) {
      const x = top.x - az * side * d, z = top.z + ax * side * d;
      if (!habitat.walkable(x, z, 0.55) || !apart(x, z, 4)) continue;
      places.push({ kind, x, z, off, face: Math.atan2(top.z - z, top.x - x), reach: d, at: top.y - habitat.height(x, z), wx: top.x, wz: top.z });
      return;
    }
  };
  for (const log of habitat.logs) for (const share of [0.3, 0.7]) {
    log.on(share, crest); log.on(share + 0.05, other);
    const ax = other.point.x - crest.point.x, az = other.point.z - crest.point.z, l = Math.hypot(ax, az) || 1;
    besideWood('log', crest.point.clone(), ax / l, az / l, log.off);
  }
  for (const stump of habitat.stumps) for (const turn of [0, 1.6, 3.2, 4.7]) besideWood('stump', stump.point, Math.cos(turn), Math.sin(turn), stump.off);
  cache.set(habitat, places);
  return places;
}

// ---- Where a bear can be on a visit (2026-11-19), read once from the world as built (the first time a bear asks):
// the places above (dead wood to tear at, the wet ground, the grass), and more of the same found beside the walk from
// thirteen to thirty-five metres off it: grass, the wet ground, a bar's cobbles, and the floor of the hill under the
// maples and the ravine's trees. Each is kept only if a walker can see it: `seen` is how many metres of the walk,
// within 46 m of it, have a line to it that no trunk and no rise of the ground stops; `off` how far it is from the
// walk, and `s` where along the walk that is. The owner, 2026-11-18: "The bears need to be more present, I have yet
// to see a single bear." A place nobody on the walk can see into is no place for one. Near each place, the trunks
// within twelve metres that a bear can rub its back on or climb (`trees`: the habitat's trunks, at least 0.2 m round
// their axis at 1.5 m), read the same once.
const RANGE = new WeakMap();
const NEAR_WALK = 11, FAR = 46;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function spotsOf(habitat) {
  let kept = RANGE.get(habitat);
  if (kept) return kept;
  const spots = [], n = Math.ceil(habitat.length), walk = new Float32Array(n * 3), p = new THREE.Vector3();
  for (let s = 0; s < n; s += 1) { habitat.beside(s, 0, p); walk[s * 3] = p.x; walk[s * 3 + 1] = p.y; walk[s * 3 + 2] = p.z; }
  const apart = (x, z, d) => spots.every((one) => (one.x - x) ** 2 + (one.z - z) ** 2 >= d * d);
  for (const one of bearPlaces(habitat)) spots.push({ ...one });
  for (let s = 0; s < n; s += 3) for (const side of [-1, 1]) for (const off of [13, 17, 22, 28, 35]) {
    habitat.beside(s, side * off, p);
    const kind = habitat.ground(p.x, p.z);
    if (kind === 'floor') { const air = habitat.open(p.x, p.z); if (air < 0.2 || air > 0.6) continue; }
    else if (kind !== 'grass' && kind !== 'wet' && kind !== 'stones') continue;
    if (!habitat.walkable(p.x, p.z, 0.6) || !apart(p.x, p.z, kind === 'floor' ? 9 : 5.5)) continue;
    spots.push({ kind, x: p.x, z: p.z });
  }
  kept = [];
  const eye = new THREE.Vector3(), at = new THREE.Vector3(), list = [];
  for (const one of spots) {
    let off = Infinity, s0 = 0, seen = 0;
    at.set(one.x, habitat.height(one.x, one.z) + 0.6, one.z);
    for (let s = 0; s < n; s += 1) {
      const d = Math.hypot(walk[s * 3] - one.x, walk[s * 3 + 2] - one.z);
      if (d < off) { off = d; s0 = s; }
      if (d > FAR || d < 8 || s % 2) continue;
      eye.set(walk[s * 3], walk[s * 3 + 1] + 1.6, walk[s * 3 + 2]);
      if (habitat.blocked(eye, at, 0.5)) continue;
      let hid = false;
      for (let k = 1; k < 6 && !hid; k += 1) { const t = k / 6; hid = habitat.height(eye.x + (at.x - eye.x) * t, eye.z + (at.z - eye.z) * t) > eye.y + (at.y - eye.y) * t + 0.15; }
      if (!hid) seen += 2;
    }
    if (off < NEAR_WALK || seen < 10) continue;
    one.off = off; one.s = s0; one.seen = seen;
    one.trees = habitat.trunksNear(one.x, one.z, 12, list).filter((t) => t.girth >= 0.2 && t.top > 6);
    kept.push(one);
  }
  kept.count = {};
  for (const one of kept) kept.count[one.kind] = (kept.count[one.kind] || 0) + 1;
  RANGE.set(habitat, kept);
  return kept;
}
// Where a bear's party lives on a visit: one place, drawn so that each sort of ground has its share of the visits
// whatever the number of its places (the agent's shares: the clearing's grass, a log or a stump beside the walk in
// the deep wood, the riverside's bar and the wet ground among the skunk cabbage, the floor of the hill under the
// maples, the least of them: a bear there is low in the ferns), the better seen the likelier; and the places within fifty metres of it that it can walk to, nearest
// first, which it goes from one to the next of. Not within 110 m of another bear's. `all`: every place there is,
// for where it goes when a walker moves it on.
const SHARE = { grass: 0.3, stones: 0.2, wet: 0.16, log: 0.2, stump: 0.06, floor: 0.08 };
export function bearRange(habitat, r, taken = []) {
  const all = spotsOf(habitat), pick0 = r();
  for (const apartBy of [110, 0]) {
    const weight = (one) => (apartBy && taken.some((home) => home && Math.hypot(home.x - one.x, home.z - one.z) < apartBy) ? 0
      : ((SHARE[one.kind] || 0) / all.count[one.kind]) * clamp(one.seen / 40, 0.4, 1.6) * (one.off < 14 ? 0.5 : 1));
    const sum = all.reduce((total, one) => total + weight(one), 0);
    if (!(sum > 0)) continue;
    let pick = pick0 * sum, at = null;
    for (const one of all) { const w = weight(one); if (w <= 0) continue; at = one; pick -= w; if (pick <= 0) break; }
    const far = (one) => Math.hypot(one.x - at.x, one.z - at.z);
    const near = all.filter((one) => one !== at && far(one) < 50 && habitat.crossable(at.x, at.z, one.x, one.z)).sort((m, n) => far(m) - far(n)).slice(0, 7);
    return { x: at.x, z: at.z, kind: at.kind, places: [at, ...near], all };
  }
  return null;
}
