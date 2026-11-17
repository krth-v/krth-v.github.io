import * as THREE from 'three';
import { creek, river, glade, terrace, GLADE, FALLS, SHAPE } from '../../world/land.js';
import { mulberry32, WET_KINDS, reachOf } from '../../world/layout.js';
import walk from '../../scenes/walk.js';

// Where the frogs and the toad can be (life/families/hopper.js): the water's edge and the wet ground, found once for a
// habitat from the land as it is laid out (world/land.js) and the habitat (life/habitat.js), which this changes in no
// way. Written by the agent called frogs2, 2026-11-16.
//
//   seats    a place on the ground at the water's edge, a frog's own: on either bank of the creek every 0.75 m (not on
//            the falls' rock, not on the ravine's steep sides, not on the tread, nowhere a bank stands more than 0.35 m
//            above the water), and in the old cedar's wet ground, wherever it is sodden; none off the old terrace,
//            where the layout lays the cobbles of the river's bars and the creek's bed and the clearing's grass over
//            the ground (world/layout.js, CARPETS and COVERS) and a frog on the ground sat among the stones' domes and
//            the tufts (the one close-up of a frog on the river's bank was a frame of grass and a stone). Each has the
//            water a frog leaps into from it, if there is water within a leap and deep enough to go under: `water`
//            { x, z, level (the water's surface), bed (the ground under it, as drawn) }; and `hid`, if the walker
//            cannot see it from the walk (below).
//   floats   a place on the water's surface where a frog can float: the spring's basin, the pool under the falls, the
//            creek's calm stretches, and the river's quiet edge near the walk (not over a riffle), 0.8 m in. Off the
//            old terrace (the ravine below the pool, the swale, the river) a site has only these.
//   covers   what a frog goes under when it is not in the water: skunk cabbage and sword ferns.
//   sites    all of that in stretches of about twelve metres, each of a type: 'glade' (the wet ground and the spring),
//            'gully' (the creek under the terrace's trees), 'pool' (under the falls), 'ravine', 'swale' (the creek
//            through the old clearing's grass), 'river'.
//
// The creek's water is laid by world/water.js; its surface here is worked out by the same rules (a hand deep over
// its bed, less where it is broken; level behind the pool's sill; never higher downstream than up), so that a frog
// floats on the water as drawn. The skunk cabbage is the layout's own (world/layout.js, its fifth pass): its grid and
// its stream of random numbers gone through again here, since a family is handed no layout. What the layout tests
// against that this cannot have exactly (the ground's height as its function gives it, not as the mesh draws it; the
// solids it had laid by then) is taken from the habitat, so a plant here and there may differ: measured in the page
// on 2026-11-16, see the report of that day.
// The river's riffles are world/water.js `RIFFLES` (not exported there), copied: a change there wants one here.

const RIFFLES = [[20, 13], [130, 14], [250, 15], [408, 13], [478, 12], [620, 14]];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// ---- the creek's water, as world/water.js lays it: [x, z, bed, half-width, bank slope] s metres down its middle line
const { CREEK, creekAlong, CREEK_DEEP: DEEP, RIVER, HALF } = SHAPE;
const LENGTH = creekAlong[creekAlong.length - 1];
const at = (s) => {
  let i = 0;
  while (i < CREEK.length - 2 && creekAlong[i + 1] < s) i += 1;
  const t = Math.min(1, Math.max(0, (s - creekAlong[i]) / (creekAlong[i + 1] - creekAlong[i]))), a = CREEK[i], b = CREEK[i + 1];
  return a.map((v, k) => v + (b[k] - v) * t);
};
const sLip = creekAlong[FALLS.sill - 3], sFoot = creekAlong[FALLS.sill - 2], sSill = creekAlong[FALLS.sill];
const sEdge = sFoot + Math.hypot(FALLS.x - CREEK[FALLS.sill - 2][0], FALLS.z - CREEK[FALLS.sill - 2][1]);
const whiteAt = (s) => {
  const upper = s <= sEdge, lo = upper ? 0 : sFoot, hi = upper ? sLip : LENGTH;
  const before = at(Math.min(hi, Math.max(lo, s - 0.6))), after = at(Math.max(lo, Math.min(hi, s + 0.6)));
  const run = Math.hypot(after[0] - before[0], after[1] - before[1]);
  const fall = run > 1e-6 ? Math.abs(after[2] - before[2]) / run : 0;
  return Math.min(1, 0.05 + Math.max(0, (fall - 0.06) / 0.5));
};
const reachOfWater = (here) => here[3] + Math.min(0.5, (0.8 * DEEP) / here[4]);
// The water's surface every quarter metre down the creek: above the falls a hand over its bed; from the pool on, the
// same but never higher downstream than up (so the pool lies level with its sill).
const STEP = 0.25, LEVEL = new Float32Array(Math.ceil(LENGTH / STEP) + 1);
for (let k = 0; k < LEVEL.length; k += 1) {
  const s = Math.min(LENGTH, k * STEP);
  LEVEL[k] = at(s)[2] + DEEP * (1 - 0.6 * whiteAt(s));
}
for (let k = LEVEL.length - 2; k >= 0 && k * STEP > sEdge; k -= 1) LEVEL[k] = Math.max(LEVEL[k], LEVEL[k + 1]);
export const creekLevel = (s) => { const x = Math.min(LEVEL.length - 1, Math.max(0, s / STEP)), i = Math.min(LEVEL.length - 2, Math.floor(x)); return lerp(LEVEL[i], LEVEL[i + 1], x - i); };
const FALLS_FROM = sLip - 1.5, FALLS_TO = sEdge + 0.9;            // the falls' rock and the falling water: no frog here
const POOL = [sEdge + 1.6, sSill - 0.3];                          // the pool under the falls, where a frog may float
const quiet = (down) => RIFFLES.every(([c, half]) => Math.abs(down - c) > half + 4);

// The water's surface at (x, z), or null where there is none: the creek's within its drawn width, the river's.
const _k = [0, 0, 0, 0, 0], _r = [0, false, 0, 0, 0];
export function surfaceAt(x, z) {
  creek(x, z, _k);
  if (_k[0] < 3) {
    const s = _k[4], here = at(s);
    if (!(s > FALLS_FROM && s < FALLS_TO) && _k[0] < reachOfWater(here)) return creekLevel(s);
  }
  river(x, z, _r);
  return _r[0] < 0 ? _r[2] : null;
}

const cache = new WeakMap();
export function placesOf(habitat) {
  let places = cache.get(habitat);
  if (!places) { places = build(habitat); cache.set(habitat, places); }
  return places;
}

function build(habitat) {
  const H = habitat.height;
  // ---- the walk's middle line, every metre, in squares: how far a spot is from it, and where along it (within 24 m)
  const CELL = 8, segs = new Map(), key = (i, j) => i * 4096 + j, line = [], v = new THREE.Vector3();
  for (let s = 0; s <= habitat.length; s += 1) { habitat.beside(s, 0, v); line.push(v.x, v.z); }
  for (let k = 0; k + 1 < line.length / 2; k += 1) {
    const x = (line[2 * k] + line[2 * k + 2]) / 2, z = (line[2 * k + 1] + line[2 * k + 3]) / 2, cell = key(Math.floor(x / CELL), Math.floor(z / CELL));
    if (!segs.has(cell)) segs.set(cell, []);
    segs.get(cell).push(k);
  }
  const _w = [0, 0];
  const offWalk = (x, z, out = _w) => {
    let best = Infinity, along = 0;
    const i0 = Math.floor(x / CELL), j0 = Math.floor(z / CELL);
    for (let i = i0 - 3; i <= i0 + 3; i += 1) for (let j = j0 - 3; j <= j0 + 3; j += 1) {
      const list = segs.get(key(i, j));
      if (!list) continue;
      for (const k of list) {
        const ax = line[2 * k], az = line[2 * k + 1], ux = line[2 * k + 2] - ax, uz = line[2 * k + 3] - az, l2 = ux * ux + uz * uz || 1;
        const t = Math.min(1, Math.max(0, ((x - ax) * ux + (z - az) * uz) / l2)), d = Math.hypot(x - ax - ux * t, z - az - uz * t);
        if (d < best) { best = d; along = k + t; }
      }
    }
    out[0] = best; out[1] = along;
    return out;
  };

  const seats = [], floats = [], covers = [];
  const sitesBy = new Map();
  const siteOf = (type, index) => {
    const name = `${type}:${index}`;
    if (!sitesBy.has(name)) sitesBy.set(name, { type, name, seats: [], floats: [], covers: [], x: 0, z: 0, off: Infinity, s: 0 });
    return sitesBy.get(name);
  };
  const add = (site, list, one) => {
    site[list].push(one);
    if (list === 'seats' && one.off < site.off) { site.off = one.off; site.s = one.s; }
  };
  const creekType = (s, x, z) => (glade(x, z) > 0.25 ? 'glade' : s < FALLS_FROM ? 'gully' : s < sSill + 4 ? 'pool' : z > -30 ? 'ravine' : 'swale');

  // ---- the creek: a seat on either bank every 0.75 m, the water on its middle line, and where it is calm a float
  for (let s = 0.3; s < LENGTH - 0.5; s += 0.75) {
    if (s > FALLS_FROM && s < FALLS_TO) continue;
    const here = at(s), before = at(Math.max(0, s - 0.6)), after = at(Math.min(LENGTH, s + 0.6));
    const inv = 1 / (Math.hypot(after[0] - before[0], after[1] - before[1]) || 1), tx = (after[0] - before[0]) * inv, tz = (after[1] - before[1]) * inv;
    const level = creekLevel(s), reach = reachOfWater(here), bed = H(here[0], here[1]), deep = level - bed;
    const type = creekType(s, here[0], here[1]), site = siteOf(type, Math.floor(s / 12));
    const water = deep > 0.05 ? { x: here[0], z: here[1], level, bed } : null;
    const inPool = s > POOL[0] && s < POOL[1];
    // (none under the falling sheet: between the falls' foot and the pool's own water)
    if (water && (inPool || (whiteAt(s) < 0.16 && deep > 0.08)) && !(s < POOL[0] && s > FALLS_FROM)) {
      const [off, ws] = offWalk(here[0], here[1]);
      add(site, 'floats', { x: here[0], z: here[1], level, bed, off, s: ws, pool: inPool });
    }
    // (none on the pool's sides, which are the falls' rock, nor for a stride below its sill)
    if (s > FALLS_FROM && s < sSill + 1.5) continue;
    for (const side of [-1, 1]) {
      // (beyond the strip the habitat calls water, which runs 0.4 m past the bed's edge)
      const d = Math.max(reach + 0.14, here[3] + 0.46), x = here[0] - tz * d * side, z = here[1] + tx * d * side, ground = habitat.ground(x, z);
      if (ground === 'steep' || ground === 'tread' || ground === 'water' || terrace(x, z) < 0) continue;
      const y = H(x, z);
      if (y - level > 0.35 || y < level - 0.01 || habitat.solidAt(x, z, 0.08)) continue;
      // (`out`: the way from the seat to the water)
      const [off, ws] = offWalk(x, z), seat = { x, y, z, water, out: [tz * side, -tx * side], off, s: ws, type, ground };
      seats.push(seat); add(site, 'seats', seat);
    }
  }

  // ---- the river: our bank, where the walk comes near it and the water is quiet: the water 0.8 m in from a spot on
  // the stones at its edge
  for (let i = 0; i + 1 < RIVER.length; i += 1) {
    const ax = RIVER[i][0], az = RIVER[i][1], ux = RIVER[i + 1][0] - ax, uz = RIVER[i + 1][1] - az, len = Math.hypot(ux, uz) || 1;
    for (let t = 0; t < 1; t += 1 / Math.max(1, Math.round(len / 1.5))) {
      const mx = ax + ux * t, mz = az + uz * t;
      for (const side of [-1, 1]) {
        const nx = (-uz / len) * side, nz = (ux / len) * side;
        const x = mx + nx * (HALF + 0.3), z = mz + nz * (HALF + 0.3);
        if (offWalk(x, z)[0] > 30) continue;
        river(x, z, _r);
        if (!_r[1] || _r[0] < 0.05 || _r[0] > 0.6 || !quiet(_r[4])) continue;
        const ground = habitat.ground(x, z);
        if (ground === 'tread' || ground === 'water' || ground === 'steep' || habitat.solidAt(x, z, 0.08)) continue;
        const level = _r[2], wx = mx + nx * (HALF - 0.8), wz = mz + nz * (HALF - 0.8), bed = H(wx, wz);
        if (level - bed < 0.08) continue;
        const [off, ws] = offWalk(x, z), site = siteOf('river', Math.floor(_r[4] / 12));
        // (the seat on the stones is not kept: see the head of this file; its water is)
        void off; void ws;
        const [foff, fs] = offWalk(wx, wz);
        add(site, 'floats', { x: wx, z: wz, level, bed, off: foff, s: fs, pool: false });
      }
    }
  }

  // ---- the old cedar's wet ground: every sodden spot a seat (its water the creek's, if it is within a leap), and
  // the skunk cabbage, as the layout laid it
  const sodden = (x, z) => {
    creek(x, z, _k);
    return { sodden: (1 - smooth(0.1, 0.36, H(x, z) - (_k[1] + DEEP))) * smooth(0, 0.4, glade(x, z)), fromCreek: _k[0] - _k[2], along: _k[4] };
  };
  const glades = siteOf('glade', 0);
  for (let gz = GLADE.z - GLADE.r; gz < GLADE.z + GLADE.r; gz += 1.1) {
    for (let gx = GLADE.x - GLADE.r; gx < GLADE.x + GLADE.r; gx += 1.1) {
      const x = gx + 0.3 * Math.sin(gz * 1.7), z = gz + 0.3 * Math.sin(gx * 1.3), here = sodden(x, z);
      if (here.sodden < 0.45 || here.fromCreek < 0.15) continue;
      const ground = habitat.ground(x, z);
      if (ground === 'tread' || ground === 'water' || habitat.solidAt(x, z, 0.08)) continue;
      // its water: the creek's nearest point, within a leap
      let water = null;
      if (here.fromCreek < 2.2 && !(here.along > FALLS_FROM && here.along < FALLS_TO)) {
        const w = at(here.along), level = creekLevel(here.along), bed = H(w[0], w[1]);
        if (level - bed > 0.05) water = { x: w[0], z: w[1], level, bed };
      }
      const [off, ws] = offWalk(x, z), out = water ? w2(water.x - x, water.z - z) : [0, 1];
      const seat = { x, y: H(x, z), z, water, out, off, s: ws, type: 'glade', ground, wet: here.sodden };
      seats.push(seat); add(glades, 'seats', seat);
    }
  }
  const cabbage = [];
  {
    const kind = WET_KINDS.find((one) => one.name === 'skunk'), rand = mulberry32(1 + 104729), step = kind.every;
    const zones = (walk.clear || []).filter((zone) => zone.kinds.includes('skunk') && zone.x !== undefined);
    for (let gz = GLADE.z - GLADE.r; gz < GLADE.z + GLADE.r; gz += step) {
      for (let gx = GLADE.x - GLADE.r; gx < GLADE.x + GLADE.r; gx += step) {
        const x = gx + (rand() - 0.5) * step * 0.9, z = gz + (rand() - 0.5) * step * 0.9, chance = rand(), size = rand();
        rand(); rand(); rand();                                   // (its yaw, phase and tint)
        const here = sodden(x, z);
        if (here.fromCreek < 0.1 || chance >= smooth(0.3, 0.9, here.sodden)) continue;
        const scale = kind.scale[0] + (kind.scale[1] - kind.scale[0]) * size * (0.35 + 0.65 * here.sodden);
        const [off, ws] = offWalk(x, z);
        if (off < reachOf(kind, scale) || zones.some((zone) => Math.hypot(x - zone.x, z - zone.z) < zone.within) || habitat.solidAt(x, z, 0.1 * scale)) continue;
        const one = { x, y: H(x, z), z, reach: 0.32 * scale, what: 'cabbage', off, s: ws };
        cabbage.push(one); covers.push(one); add(glades, 'covers', one);
      }
    }
  }

  // ---- what else hides a frog at each site: sword ferns near its seats
  const fernsNear = [];
  for (const site of sitesBy.values()) {
    if (!site.seats.length && !site.floats.length) continue;
    let sx = 0, sz = 0, n = 0;
    for (const one of [...site.seats, ...site.floats]) { sx += one.x; sz += one.z; n += 1; }
    site.x = sx / n; site.z = sz / n;
    for (const fern of habitat.coversNear(site.x, site.z, 9, fernsNear)) {
      if (site.covers.some((c) => c.fern === fern)) continue;
      const [off, ws] = offWalk(fern.x, fern.z);
      const one = { x: fern.x, y: fern.y, z: fern.z, reach: fern.reach, what: 'fern', fern, off, s: ws };
      site.covers.push(one); covers.push(one);
    }
  }
  // (no seat under a skunk cabbage's leaves or a fern's fronds: a frog there is under cover, and a close-up of it from the
  // walk was a frame of leaves)
  const underLeaves = (seat, site) => site.covers.some((c) => (c.what === 'cabbage' && Math.hypot(c.x - seat.x, c.z - seat.z) < 0.55) || (c.what === 'fern' && Math.hypot(c.x - seat.x, c.z - seat.z) < c.reach * 0.6));
  for (const site of sitesBy.values()) site.seats = site.seats.filter((seat) => !underLeaves(seat, site));
  // ---- what the walker sees of a seat: the line from an eye on the walk (1.6 m over its middle line, at the point
  // nearest the seat and 4 m to either side) to a frog's head there (5 cm up), past every skunk cabbage and sword fern
  // near it, each taken as a drum (a cabbage 0.55 of its scale across and 0.6 tall, a fern 0.8 of the habitat's reach
  // across and 0.9 of its scale tall: the agent's sizes, from the builders, not measured). A seat seen from none of the
  // three is `hid`: a frog on it is under cover (life/families/hopper.js), drawn, but neither the pointer's nor counted
  // in sight, as a wren in its fern is. (The two close-ups of the first smoke runs were a frame of skunk cabbage leaves
  // and a frame of grass.) The old cedar's roots, lady ferns and the shrubs are not in it: the habitat has none of them.
  const EYE = 1.6, eyeAt = new THREE.Vector3(), alongLine = [], LONG = habitat.length;
  const drum = (c) => (c.what === 'cabbage' ? [(c.reach / 0.32) * 0.55, (c.reach / 0.32) * 0.6] : c.what === 'fern' ? [c.reach * 0.8, (c.reach / 0.75) * 0.9] : [c.reach, 0.35]);
  const seenFrom = (fx, fy, fz, ex, ey, ez) => {
    const dx = fx - ex, dz = fz - ez, l2 = dx * dx + dz * dz;
    if (l2 < 1e-6) return true;
    const ferns = habitat.coversNear((fx + ex) / 2, (fz + ez) / 2, Math.sqrt(l2) / 2 + 1.5, alongLine);
    for (const list of [ferns, cabbage]) {
      for (const one of list) {
        const c = list === ferns ? { x: one.x, z: one.z, reach: one.reach, what: 'fern' } : one, t = ((c.x - ex) * dx + (c.z - ez) * dz) / l2;
        if (t <= 0 || t >= 1) continue;
        const px = ex + dx * t, pz = ez + dz * t, [across, tall] = drum(c);
        if (Math.hypot(c.x - px, c.z - pz) > across) continue;
        if (ey + (fy - ey) * t - H(px, pz) < tall) return false;
      }
    }
    return true;
  };
  for (const site of sitesBy.values()) {
    for (const seat of site.seats) {
      let seen = false;
      for (const ds of [0, -4, 4]) {
        habitat.beside((((seat.s + ds) % LONG) + LONG) % LONG, 0, eyeAt);
        if (seenFrom(seat.x, seat.y + 0.05, seat.z, eyeAt.x, eyeAt.y + EYE, eyeAt.z)) { seen = true; break; }
      }
      seat.hid = !seen;
    }
  }
  // (a site is somewhere to sit or somewhere to float: the pool under the falls has only its water)
  const sites = [...sitesBy.values()].filter((site) => site.seats.length >= 2 || site.floats.length >= 3);
  for (const site of sites) if (!site.seats.length) for (const one of site.floats) if (one.off < site.off) { site.off = one.off; site.s = one.s; }
  return { seats: sites.flatMap((site) => site.seats), floats: sites.flatMap((site) => site.floats), covers, cabbage, sites, offWalk, surfaceAt };
}
const w2 = (dx, dz) => { const d = Math.hypot(dx, dz) || 1; return [dx / d, dz / d]; };

// The sites near a spot (within `reach` of their middle).
export function sitesNear(places, x, z, reach) { return places.sites.filter((site) => Math.hypot(site.x - x, site.z - z) < reach); }
