import * as THREE from 'three';
import { SHAPE, creek, terrace } from '../../world/land.js';
import { onTube } from '../perch.js';

// Where the salamanders and the newt (life/families/crawler.js) can be: under the dead wood, on the forest's floor,
// and in the creek, from the land's own data (world/land.js: the creek's line, its bed and its banks, the falls) and
// the habitat as it is (life/habitat.js: the logs and stumps near the walk, the sword ferns). Nothing here changes
// the habitat; what is worked out for one habitat is kept for it.
//
//   water(x, z)                 the creek at a spot: how far from its middle, its bed's half-width, its bed and
//                               water's height, and how far along it the spot is
//   inRock(x, z)                is a spot in the falls' rock (plants/crag.js), which the habitat does not know of
//   keepOff(x, z)               a spot no small animal is put on: the falls' rock, or below the old terrace's brink
//                               within a stride of the creek's bed, where its cobbles and boulders lie (world/layout.js
//                               CARPETS), which the habitat does not know of either
//   bedSpots(habitat, x, z, r)  spots of the creek's bed within r metres, with water over them
//   edgeSpots(habitat, x, z, r) spots at the water's edge: the wet margin, a hand of water or none
//   coverSpots(habitat, x, z, r) where a small animal on land is out of sight: under a log where it lies on the
//                               ground, at the foot of a stump inside its bark, under a sword fern's fronds
//   inWood(habitat, x, z)       is a spot of the ground inside the wood of a log or a stump (where a small animal
//                               on its way under one, or out from under it, cannot be seen)
//   offWalk(habitat, x, z)      how far a spot is from the walk's middle line, and how far along the walk
//   homeOn(where, habitat, r, taken, territory)   a home of one kind of place, or null

const { CREEK, CREEK_DEEP, creekAlong, FALLS } = SHAPE;
const _c = [0, 0, 0, 0, 0], _o = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3() };

// The spring's basin (the creek's first point), and the pool under the falls: the creek's points 9 to 11, its water
// lying level with the sill (world/water.js: no water stands higher downstream than up).
export const SPRING = { x: CREEK[0][0], z: CREEK[0][1], level: CREEK[0][2] + CREEK_DEEP * 0.9 };
export const POOL = { x: CREEK[10][0], z: CREEK[10][1], from: creekAlong[9] - 0.4, to: creekAlong[11] + 0.6, level: CREEK[11][2] + CREEK_DEEP * 0.75 };

// The falls' rock (plants/crag.js) is not in the habitat: the ground under it is, and where it stands a small animal
// put on that ground would be inside it. Its face, in plan, round the bowl it has dug (crag.js's own `bowl`, copied:
// down the west wall, across the head, back along the east wall, the open side on the left of the way it runs); the
// rock stands behind the face for a few strides, and tapers into the bank at either end. `FACE`: how far along the
// creek the water leaves the rock; the gully above it is the rock's for 2.8 m and more, and is kept clear of to 4.5 m.
const BOWL = [[-50.95, -12.6], [-51.0, -11.4], [-51.25, -10.0], [-51.8, -8.6], [-51.9, -7.2], [-51.7, -6.1], [-51.32, -5.48],
  [FALLS.x - 0.55, FALLS.z - 0.02], [FALLS.x, FALLS.z], [FALLS.x + 0.55, FALLS.z - 0.02],
  [-49.42, -5.5], [-48.78, -6.2], [-48.22, -7.4], [-48.02, -8.6], [-48.15, -9.9], [-48.48, -11.2], [-48.6, -12.5], [-48.56, -14.0]];
export const FACE = creek(FALLS.x, FALLS.z, [0, 0, 0, 0, 0])[4], ABOVE = FACE - 4.5;
export function inRock(x, z) {
  if (Math.hypot(x - FALLS.x, z - FALLS.z + 4) > 13) return false;
  let best = Infinity, side = 0, end = false;
  for (let i = 0; i < BOWL.length - 1; i += 1) {
    const [ax, az] = BOWL[i], dx = BOWL[i + 1][0] - ax, dz = BOWL[i + 1][1] - az, len = Math.hypot(dx, dz);
    const t = ((x - ax) * dx + (z - az) * dz) / (len * len), c = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x - ax - dx * c, z - az - dz * c);
    if (d < best) { best = d; side = (dx * (z - az) - dz * (x - ax)) / len; end = (i === 0 && t < 0) || (i === BOWL.length - 2 && t > 1); }
  }
  // (behind the face, or within a hand in front of its foot, where the lowest bed stands out)
  return !end && side > -0.12 && best < 4;
}

const _k = {};
export const keepOff = (x, z) => inRock(x, z) || (terrace(x, z) < 0 && water(x, z, _k).d - _k.half < 0.95);

export function water(x, z, out = {}) {
  creek(x, z, _c);
  out.d = _c[0]; out.half = _c[2]; out.along = _c[4]; out.bed = _c[1];
  out.level = _c[1] + CREEK_DEEP * 0.75;
  if (_c[0] < _c[2] + 0.5 && _c[4] > POOL.from && _c[4] < POOL.to) out.level = Math.max(out.level, POOL.level);
  out.inBed = _c[0] < _c[2];
  return out;
}

// spots of the bed within `reach` of (x, z), on a grid a hand and a half apart, each with the depth of the water over
// it as the ground is drawn (`least`: the shallowest kept; `most`: the deepest)
const _w = {};
export function bedSpots(habitat, x, z, reach, { least = 0.035, most = 9, step = 0.15, inside = 0.85 } = {}) {
  const list = [];
  for (let i = -reach; i <= reach + 1e-6; i += step) for (let j = -reach; j <= reach + 1e-6; j += step) {
    if (i * i + j * j > reach * reach) continue;
    const px = x + i, pz = z + j;
    water(px, pz, _w);
    // (nor in the falls' rock, nor under the foot log or a log over the water, which may be down in the bank there)
    if (!(_w.d < _w.half * inside) || inRock(px, pz) || (habitat.solidAt && habitat.solidAt(px, pz, 0.05))) continue;
    const y = habitat.height(px, pz), depth = _w.level - y;
    if (depth < least || depth > most) continue;
    list.push({ x: px, y, z: pz, depth, level: _w.level, along: _w.along, kind: 'bed' });
  }
  return list;
}
// the wet margin: just inside the bed's edge or just out of it, with at most a little water over it
export function edgeSpots(habitat, x, z, reach, { step = 0.15 } = {}) {
  const list = [];
  for (let i = -reach; i <= reach + 1e-6; i += step) for (let j = -reach; j <= reach + 1e-6; j += step) {
    if (i * i + j * j > reach * reach) continue;
    const px = x + i, pz = z + j;
    water(px, pz, _w);
    if (_w.d > _w.half + 0.35 || _w.d < _w.half - 0.3 || inRock(px, pz) || (habitat.solidAt && habitat.solidAt(px, pz, 0.05))) continue;
    const y = habitat.height(px, pz), depth = _w.level - y;
    if (depth > 0.03 || depth < -0.25 || habitat.ground(px, pz) === 'steep') continue;
    list.push({ x: px, y, z: pz, depth, level: _w.level, along: _w.along, kind: 'edge' });
  }
  return list;
}

// Under a log, where it lies on the ground: at each ring of it, the ring's middle and its lowest point; where the
// lowest point is in the ground, the ground under the middle is inside the wood, and a small animal there is out of
// sight from anywhere. (Where the log stands clear of the ground, across a hollow, anything under it would be seen.)
const logCache = new WeakMap();
function underLog(habitat, log) {
  if (logCache.has(log)) return logCache.get(log);
  const place = log.place, tube = place.perch.trunk, spots = [], centre = new THREE.Vector3(), last = new THREE.Vector3();
  for (let j = 1; j < tube.rings - 1; j += 1) {
    let low = Infinity;
    centre.set(0, 0, 0);
    for (let k = 0; k < 12; k += 1) { onTube(place, tube, j, k / 12, _o); centre.add(_o.point); low = Math.min(low, _o.point.y); }
    centre.multiplyScalar(1 / 12);
    let radius = 0;
    for (let k = 0; k < 12; k += 1) { onTube(place, tube, j, k / 12, _o); radius += _o.point.distanceTo(centre) / 12; }
    const ground = habitat.height(centre.x, centre.z);
    if (j > 1 && low < ground + 0.005 && radius > 0.085 && habitat.ground(centre.x, centre.z) !== 'water') {
      spots.push({ x: centre.x, y: ground, z: centre.z, heading: Math.atan2(centre.z - last.z, centre.x - last.x), radius, kind: 'log', log, ring: j });
    }
    last.copy(centre);
  }
  logCache.set(log, spots);
  return spots;
}
export function coverSpots(habitat, x, z, reach, list = []) {
  list.length = 0;
  for (const log of habitat.logs) {
    if (Math.hypot(log.x - x, log.z - z) > reach + 14) continue;
    for (const spot of underLog(habitat, log)) if (Math.hypot(spot.x - x, spot.z - z) <= reach && !keepOff(spot.x, spot.z)) list.push(spot);
  }
  for (const stump of habitat.stumps) {
    const foot = stump.place.foot;
    if (Math.hypot(foot.x - x, foot.z - z) > reach || habitat.ground(foot.x, foot.z) === 'water' || keepOff(foot.x, foot.z)) continue;
    list.push({ x: foot.x, y: habitat.height(foot.x, foot.z), z: foot.z, heading: 0, radius: 0.3, kind: 'stump' });
  }
  for (const fern of habitat.coversNear(x, z, reach)) {
    if (habitat.ground(fern.x, fern.z) === 'water' || keepOff(fern.x, fern.z)) continue;
    list.push({ x: fern.x, y: habitat.height(fern.x, fern.z), z: fern.z, heading: 0, radius: fern.reach * 0.35, kind: 'fern' });
  }
  return list;
}

// Is a spot of the ground inside the wood of a log or a stump? The cover under either is the ground inside it, so a
// small animal crawls through its wood to reach that and to leave it, and is seen by nobody while it does. Read
// from the wood's own rings (each ring's middle and how far its wood is from that), not from the circles the
// layout keeps round dead wood (world/layout.js `solid`), which are wider than the wood: a log's are as wide as
// its butt all along it, a stump's reach past its flared foot. A log: between two of its rings, nearer its middle
// line, seen from above, than the wood is wide at the ground's height there. A stump: nearer its middle than the
// narrowest of its wood at the ground's height. Beyond a log's last ring, at its broken ends, a spot is not inside.
const ringCache = new WeakMap();
function ringsOf(site) {
  if (ringCache.has(site)) return ringCache.get(site);
  const place = site.place, tube = place.perch.trunk, rings = [], centre = new THREE.Vector3(), points = [];
  for (let j = 0; j < tube.rings; j += 1) {
    centre.set(0, 0, 0);
    for (let k = 0; k < 12; k += 1) { onTube(place, tube, j, k / 12, _o); points[k] = (points[k] || new THREE.Vector3()).copy(_o.point); centre.add(_o.point); }
    centre.multiplyScalar(1 / 12);
    // (`round`: the ring's radius, for a log, which lies; `least`: the nearest its wood comes to its middle seen from
    // above, for a stump, which stands)
    let round = 0, least = Infinity;
    for (let k = 0; k < 12; k += 1) { round += points[k].distanceTo(centre) / 12; least = Math.min(least, Math.hypot(points[k].x - centre.x, points[k].z - centre.z)); }
    rings.push({ x: centre.x, y: centre.y, z: centre.z, round, least });
  }
  ringCache.set(site, rings);
  return rings;
}
export function inWood(habitat, x, z) {
  let ground = null;
  for (const log of habitat.logs) {
    if (Math.hypot(log.x - x, log.z - z) > 11) continue;                 // (a log's root is its middle, and the longest is 9.6 m to an end)
    const rings = ringsOf(log);
    if (ground == null) ground = habitat.height(x, z);
    for (let j = 0; j + 1 < rings.length; j += 1) {
      const a = rings[j], b = rings[j + 1], ux = b.x - a.x, uz = b.z - a.z, l2 = ux * ux + uz * uz;
      if (l2 < 1e-9) continue;
      const t = ((x - a.x) * ux + (z - a.z) * uz) / l2;
      if (t < 0 || t > 1) continue;
      // (how far the log's middle line is over the ground here, and so how wide its wood is at the ground's height)
      const round = a.round + (b.round - a.round) * t, over = a.y + (b.y - a.y) * t - ground;
      if (Math.abs(over) < round && Math.hypot(x - a.x - ux * t, z - a.z - uz * t) < Math.sqrt(round * round - over * over)) return true;
    }
  }
  for (const stump of habitat.stumps) {
    if (Math.hypot(stump.x - x, stump.z - z) > 3) continue;
    const rings = ringsOf(stump), last = rings.length - 1;
    if (ground == null) ground = habitat.height(x, z);
    if (ground > rings[last].y) continue;
    let j = 0;
    while (j < last - 1 && rings[j + 1].y < ground) j += 1;
    const a = rings[j], b = rings[j + 1], t = Math.min(1, Math.max(0, (ground - a.y) / Math.max(1e-6, b.y - a.y)));
    if (Math.hypot(x - (a.x + (b.x - a.x) * t), z - (a.z + (b.z - a.z) * t)) < a.least + (b.least - a.least) * t) return true;
  }
  return false;
}

// The walk, sampled every metre, for how far a spot is from it (kept for each habitat).
const walks = new WeakMap();
export function offWalk(habitat, x, z) {
  let samples = walks.get(habitat);
  if (!samples) {
    const n = Math.floor(habitat.length) + 1, p = new THREE.Vector3();
    samples = new Float32Array(n * 2);
    for (let i = 0; i < n; i += 1) { habitat.beside(i, 0, p); samples[i * 2] = p.x; samples[i * 2 + 1] = p.z; }
    walks.set(habitat, samples);
  }
  let best = Infinity, s = 0;
  for (let i = 0; i < samples.length; i += 2) { const d = Math.hypot(samples[i] - x, samples[i + 1] - z); if (d < best) { best = d; s = i / 2; } }
  return { off: best, s };
}

// Is a spot of the floor one a small animal can walk on: not water, a bar's cobbles or the ravine's sides, in no
// trunk, log or stump, and not kept off (above)?
export const floorOK = (habitat, x, z) => { const kind = habitat.ground(x, z); return kind !== 'water' && kind !== 'steep' && kind !== 'stones' && !habitat.solidAt(x, z, 0.04) && !keepOff(x, z); };

// ---- homes. `where`: 'logs' (a log or a stump near the walk, the ground under it), 'floor' (the forest's floor near
// the walk, the wetter the likelier), 'spring' (the spring's basin), 'seep' (the spring's wet margin), 'pool' (the
// pool under the falls, inside its rock), 'creek' (a stretch of the creek's bed on the old terrace, from the spring
// to the gully above the falls), 'falls' (the wet margin of the gully at the head of the falls, at and above the
// footbridge). Not the creek below the falls: its bed is laid with cobbles and boulders (world/layout.js, CARPETS),
// which the habitat does not know of either, and an animal on it would be in them. Each home is { x, z, where,
// water: true for the creek's, covers (where it goes out of sight), beds or edges (the water's spots) }; none
// within `territory` metres of another of its kind (`taken`).
const near = (taken, x, z, territory) => taken.some((home) => home && Math.hypot(home.x - x, home.z - z) < territory);
const pick = (list, r) => list[Math.floor(r() * list.length)];
export function homeOn(where, habitat, r, taken = [], territory = 4) {
  if (where === 'logs') {
    const sites = [...habitat.logs.filter((l) => l.off < 11), ...habitat.stumps.filter((s) => s.off < 11)];
    for (let tries = 0; tries < 30 && sites.length; tries += 1) {
      const site = pick(sites, r);
      const under = site.place.perch.trunk && site.on ? underLog(habitat, site) : [{ x: site.place.foot.x, z: site.place.foot.z }];
      if (!under.length) continue;
      const one = pick(under, r);
      if (near(taken, one.x, one.z, territory) || habitat.ground(one.x, one.z) === 'water' || keepOff(one.x, one.z)) continue;
      const covers = coverSpots(habitat, one.x, one.z, 3.5, []);
      if (!covers.length) continue;
      return { x: one.x, z: one.z, where, water: false, covers };
    }
    return null;
  }
  if (where === 'floor') {
    const p = new THREE.Vector3();
    for (let tries = 0; tries < 40; tries += 1) {
      habitat.beside(r() * habitat.length, (r() < 0.5 ? -1 : 1) * (0.4 + r() * 6), p);
      if (!floorOK(habitat, p.x, p.z) || near(taken, p.x, p.z, territory)) continue;
      // (the wetter the likelier: by the creek, in the old cedar's wet ground, under trees)
      water(p.x, p.z, _w);
      const kind = habitat.ground(p.x, p.z), wet = kind === 'wet' || _w.d < _w.half + 6 ? 1 : kind === 'grass' ? 0.15 : habitat.open(p.x, p.z) > 0.5 ? 0.2 : 0.45;
      if (r() > wet) continue;
      const covers = coverSpots(habitat, p.x, p.z, 5, []);
      if (!covers.length) continue;
      return { x: p.x, z: p.z, where, water: false, covers };
    }
    return null;
  }
  if (where === 'spring') {
    if (near(taken, SPRING.x, SPRING.z, Math.min(territory, 1))) return null;
    const beds = bedSpots(habitat, SPRING.x, SPRING.z, 1.3, { least: 0.03 });
    return beds.length >= 4 ? { x: SPRING.x, z: SPRING.z, where, water: true, beds, covers: beds } : null;
  }
  if (where === 'seep') {
    if (near(taken, SPRING.x, SPRING.z, Math.min(territory, 1))) return null;
    const beds = bedSpots(habitat, SPRING.x, SPRING.z, 1.5, { least: 0.03 }), edges = edgeSpots(habitat, SPRING.x, SPRING.z, 1.8);
    return beds.length >= 3 && edges.length >= 4 ? { x: SPRING.x, z: SPRING.z, where, water: true, beds, edges, covers: beds } : null;
  }
  if (where === 'pool') {
    if (near(taken, POOL.x, POOL.z, Math.min(territory, 1.5))) return null;
    const beds = bedSpots(habitat, POOL.x, POOL.z, 3.2, { least: 0.05 });
    return beds.length >= 6 ? { x: POOL.x, z: POOL.z, where, water: true, beds, covers: beds } : null;
  }
  if (where === 'creek' || where === 'falls') {
    // along the creek's line on the old terrace, from the spring's rill to the gully above the falls' rock; 'falls'
    // keeps to the last eight metres of that, at the head of the falls
    const from = where === 'falls' ? ABOVE - 8 : creekAlong[1], to = ABOVE;
    for (let tries = 0; tries < 30; tries += 1) {
      const along = from + r() * (to - from);
      let i = 0;
      while (i < creekAlong.length - 2 && creekAlong[i + 1] < along) i += 1;
      const t = (along - creekAlong[i]) / Math.max(1e-6, creekAlong[i + 1] - creekAlong[i]);
      const x = CREEK[i][0] + (CREEK[i + 1][0] - CREEK[i][0]) * t, z = CREEK[i][1] + (CREEK[i + 1][1] - CREEK[i][1]) * t;
      if (near(taken, x, z, territory) || offWalk(habitat, x, z).off > 24) continue;
      const beds = bedSpots(habitat, x, z, 2.2, { least: 0.04 });
      if (beds.length < 5) continue;
      if (where === 'creek') return { x, z, where, water: true, beds, covers: beds };
      const edges = edgeSpots(habitat, x, z, 2.2);
      if (edges.length < 5) continue;
      return { x, z, where, water: true, beds, edges, covers: beds };
    }
    return null;
  }
  throw new Error(`there is no place called "${where}" for a salamander (life/places/salamanders2.js)`);
}
