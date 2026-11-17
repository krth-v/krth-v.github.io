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

// Where a bear's party lives on a visit: one place, chosen by what it is (the wet ground and the grass most, by
// the agent's reading of what it eats in May), and every other place within seventy metres of it, nearest first,
// which it goes from one to the next of. Not within 150 m of another bear's.
const WEIGHT = { wet: 4, grass: 2.5, log: 2, stones: 1.5, stump: 1.2 };
export function bearHome(habitat, r, taken = []) {
  const all = bearPlaces(habitat);
  const weight = (one) => (taken.some((home) => home && Math.hypot(home.x - one.x, home.z - one.z) < 150) ? 0 : WEIGHT[one.kind] || 0);
  const sum = all.reduce((n, one) => n + weight(one), 0);
  if (!(sum > 0)) return null;
  let pick = r() * sum, at = all[0];
  for (const one of all) { pick -= weight(one); if (pick <= 0) { at = one; break; } }
  const near = all.filter((one) => Math.hypot(one.x - at.x, one.z - at.z) < 70).sort((m, n) => Math.hypot(m.x - at.x, m.z - at.z) - Math.hypot(n.x - at.x, n.z - at.z)).slice(0, 8);
  return { x: at.x, z: at.z, kind: at.kind, places: near };
}
