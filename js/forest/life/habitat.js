import * as THREE from 'three';
import { RECORD, KINDS, VALLEY_KINDS, HAND_KINDS, CARPETS, RIVER_KINDS } from '../world/layout.js';
import { standing, onTube, onTrunk, onStub, onLimb, groundUnder } from './perch.js';
import { FINE } from '../world/terrain.js';
import { LEGACY } from '../world/land.js';

// Where an animal can be, all along the walk: read once from the world as it was built (life/perch.js), for
// every big trunk, snag, log and stump within reach of the trail, and asked of the land for the ground. An
// animal is given a home among these when a visit begins (life/index.js), a different one on every visit.
//
// What can be stood on so far: the ground, a trunk's bark, the stub of a broken limb, the back of a log, the
// top of a stump, and a bough: a limb of a hemlock pole from head height up, or one of a grown hemlock's
// lowest, where a small bird of the crowns can be seen from the walk. Nothing higher in a crown and nothing in
// a shrub: a kind that lives there waits for those.
// And cover: the sword ferns beside the walk, under whose fronds a small bird is as good as out of sight.
// And for a big animal that walks: every solid the layout laid, to walk round (`solidAt`); where it can stand
// (`walkable`); and the open places near the walk where a herd can graze or lie up (`grazing`).

const REACH = 46;                 // metres from the walk within which the world is read
const CELL = 16;                  // the trunks are kept in squares this wide, for asking what stands between two places
const BOUGHS = 26;                // metres from the walk within which a tree's boughs are perched on
// every kind is read alike, from the `perch` it hands over (plants/build.js has the shape), never by its name:
const BOUGH_TOP = 17;             // how high above its foot a bough may be and still be read (no bird yet goes above 14)
const BOUGH_THIN = 0.012;         // a limb thinner than this (a sapling's, in metres at its place) is no perch
const TRUNK_GIRTH = 0.15;         // a trunk stood on is at least this far round its axis at 1.5 m (a pole is not; a hemlock's trunk is)
const TRUNK_TOP = 5;              // and at least this tall
// every kind of the layout that nothing may stand in, with its radius at scale 1 (and, for a log, its half length)
const SOLID = [...KINDS, ...VALLEY_KINDS, ...HAND_KINDS, ...CARPETS, ...RIVER_KINDS].filter((kind) => kind.solid);

export function createHabitat({ terrain, trail, layout, plants, records: recordsOf = (name) => layout[name] }) {
  const began = performance.now();
  const land = terrain.land;
  const out = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() };
  const best = new THREE.Vector3();
  const trunks = [], stubs = [], logs = [], stumps = [];

  // ---- what every kind hands over: its perch, and where each of its plants stands. A kind that has a perch is
  // read by the form of it: a trunk to climb (and the stubs on it), the back of a log, the top of a stump, boughs.
  // (A kind that `lies` as the ground does is sheared where it is drawn, and is not read here yet.)
  const perchKinds = [];
  for (const name of Object.keys(plants)) {
    const plant = plants[name], perch = plant && (plant.perch || (plant.solid && plant.solid.perch)), records = perch && recordsOf(name);
    if (!perch || !records || !records.length || plant.lies) continue;
    perchKinds.push({ name, perch, records, form: perch.form || 'standing' });
  }

  // ---- trunks, and the stubs on them
  for (const { name, perch, records, form } of perchKinds) {
    if (form !== 'standing' || !perch.trunk) continue;
    for (let i = 0; i < records.length / RECORD; i += 1) {
      const x = records[i * RECORD], z = records[i * RECORD + 2], [off, s] = trail.locate(x, z);
      if (off > REACH) continue;
      const place = standing(perch, records, i);
      place.kind = name; place.off = off; place.s = s;
      place.turnOffset = -records[i * RECORD + 3] / (Math.PI * 2);      // a yaw about +y carries the plant's own +x to (cos, 0, -sin)
      onTrunk(place, 1.5, 0, out);
      place.girth = Math.hypot(out.point.x - place.foot.x, out.point.z - place.foot.z);
      place.top = place.heights[place.heights.length - 1];
      if (place.girth < TRUNK_GIRTH || place.top < TRUNK_TOP) continue;
      trunks.push(place);
      for (const stub of perch.stubs || []) {
        const radius = onStub(place, stub, out), above = out.point.y - place.foot.y;
        if (radius > 0 && above > 2.5 && above < 13) stubs.push({ point: out.point.clone(), along: out.along.clone(), radius, place, off, s });
      }
    }
  }

  // ---- dead wood on the ground: the back of a log (the highest point round it, at a share of the way along
  // it) and the top of a stump (the tallest of the splinters it ends in)
  const crest = (place, tube, along, into) => {
    best.set(0, -Infinity, 0);
    for (let k = 0; k < 12; k += 1) { onTube(place, tube, along, k / 12, out); if (out.point.y > best.y) { best.copy(out.point); into.normal.copy(out.normal); into.up.copy(out.up); } }
    into.point.copy(best);
    return into;
  };
  for (const { name, perch, records, form } of perchKinds) {
    if ((form !== 'lying' && form !== 'stump') || !perch.trunk) continue;
    for (let i = 0; i < records.length / RECORD; i += 1) {
      const x = records[i * RECORD], z = records[i * RECORD + 2], [off, s] = trail.locate(x, z);
      if (off > REACH) continue;
      const place = standing(perch, records, i), last = perch.trunk.rings - 1;
      place.kind = name; place.off = off; place.s = s;
      if (form === 'lying') logs.push({ place, off, s, x, z, on: (share, into) => crest(place, perch.trunk, Math.min(last, Math.max(0, share * last)), into) });
      else { const top = crest(place, perch.trunk, last, { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3() }); stumps.push({ place, off, s, x, z, point: top.point.clone() }); }
    }
  }

  // ---- what stands between two places: a trunk, seen from above as a circle. What is at either end of the
  // line does not count (a creeper is on its own trunk).
  const cells = new Map(), key = (i, j) => i * 4096 + j;
  trunks.forEach((place, index) => {
    const k = key(Math.floor(place.foot.x / CELL), Math.floor(place.foot.z / CELL));
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(index);
  });
  // the stubs in squares of their own, and what is within a distance of a spot (into `list`, which is emptied first)
  const perches = new Map();
  stubs.forEach((stub) => {
    const k = key(Math.floor(stub.point.x / CELL), Math.floor(stub.point.z / CELL));
    if (!perches.has(k)) perches.set(k, []);
    perches.get(k).push(stub);
  });
  const within = (map, pick, at) => (x, z, reach, list = []) => {
    list.length = 0;
    for (let i = Math.floor((x - reach) / CELL); i <= Math.floor((x + reach) / CELL); i += 1) for (let j = Math.floor((z - reach) / CELL); j <= Math.floor((z + reach) / CELL); j += 1) {
      const some = map.get(key(i, j));
      if (!some) continue;
      for (const entry of some) { const one = pick(entry), p = at(one); if (Math.hypot(p.x - x, p.z - z) <= reach) list.push(one); }
    }
    return list;
  };
  const trunksNear = within(cells, (index) => trunks[index], (place) => place.foot);
  const stubsNear = within(perches, (stub) => stub, (stub) => stub.point);

  // ---- boughs. Each tree's are read from its limbs as they were built, the first time they are asked for: two
  // places on each limb that the next detail level keeps, 1.6 m and more above the tree's foot.
  const leafy = [], crowns = new Map();
  for (const { name, perch, records, form } of perchKinds) {
    const limbs = perch.limbs, top = BOUGH_TOP;
    if (form !== 'standing' || !limbs || !limbs.tubes.length) continue;
    // (a kind whose lowest limb is above where a bough is read, at the smallest of its plants, has none to ask for)
    let low = Infinity, small = Infinity;
    for (let i = 0; i < records.length / RECORD; i += 1) small = Math.min(small, records[i * RECORD + 4]);
    for (const tube of limbs.tubes) for (let j = 0; j < tube.rings; j += 1) low = Math.min(low, limbs.position[(tube.base + j * (tube.radial + 1)) * 3 + 1]);
    if (low * small > top) continue;
    for (let i = 0; i < records.length / RECORD; i += 1) {
      const x = records[i * RECORD], z = records[i * RECORD + 2], [off, s] = trail.locate(x, z);
      if (off > BOUGHS) continue;
      const tree = { place: standing(perch, records, i), kind: name, limbs, top, off, s, x, z, perches: null };
      leafy.push(tree);
      const k = key(Math.floor(x / CELL), Math.floor(z / CELL));
      if (!crowns.has(k)) crowns.set(k, []);
      crowns.get(k).push(tree);
    }
  }
  const perchesOf = (tree) => {
    if (tree.perches) return tree.perches;
    tree.perches = [];
    for (const tube of tree.limbs.tubes) {
      // (how long the limb's wood is, in the world's metres: a bird goes along it by shares of that)
      onLimb(tree.place, tree.limbs, tube, 0, out); const root = out.point.clone();
      onLimb(tree.place, tree.limbs, tube, 0.999, out); const length = out.point.distanceTo(root);
      for (const share of [0.3, 0.62]) {
        const radius = onLimb(tree.place, tree.limbs, tube, share, out), above = out.point.y - tree.place.foot.y;
        if (above >= 1.6 && above <= tree.top && radius >= BOUGH_THIN) tree.perches.push({ point: out.point.clone(), along: out.along.clone(), radius, above, tree, tube, share, length });
      }
    }
    return tree.perches;
  };
  const leafyNear = within(crowns, (tree) => tree, (tree) => tree);
  // the boughs of every such tree within a distance of a spot (into `list`, which is emptied first)
  const _trees = [];
  const boughsNear = (x, z, reach, list = []) => { leafyNear(x, z, reach, _trees); list.length = 0; for (const tree of _trees) for (const perch of perchesOf(tree)) list.push(perch); return list; };

  // ---- cover: every sword fern from 0.8 to 12 m from the walk's middle line, as { x, y, z, reach } (how far
  // its fronds go out), in squares of their own
  const covers = [], hides = new Map();
  for (let i = 0, records = layout.fern || []; i < records.length / RECORD; i += 1) {
    const x = records[i * RECORD], z = records[i * RECORD + 2], [off, s] = trail.locate(x, z);
    if (off < 0.8 || off > 12) continue;
    const cover = { x, y: records[i * RECORD + 1], z, reach: 0.75 * records[i * RECORD + 4], off, s };
    covers.push(cover);
    const k = key(Math.floor(x / CELL), Math.floor(z / CELL));
    if (!hides.has(k)) hides.set(k, []);
    hides.get(k).push(cover);
  }
  const coversNear = within(hides, (cover) => cover, (cover) => cover);
  // (`half`: half the length of the thing at `b`, for asking whether a trunk hides the whole of it and not its
  // middle alone: a hemlock pole "hid" an eagle, whose wings stood out on both sides of it)
  // (`from`: metres from `a` within which a trunk's middle is passed over, where it is otherwise the first fiftieth
  // of the line: for a bird that sets off from a trunk's own bark, whose trunk is then in its way or is not)
  function blocked(a, b, half = 0, from = null) {
    const dx = b.x - a.x, dz = b.z - a.z, len2 = dx * dx + dz * dz;
    if (len2 < 1e-6) return false;
    const i0 = Math.floor((Math.min(a.x, b.x) - 2) / CELL), i1 = Math.floor((Math.max(a.x, b.x) + 2) / CELL);
    const j0 = Math.floor((Math.min(a.z, b.z) - 2) / CELL), j1 = Math.floor((Math.max(a.z, b.z) + 2) / CELL);
    for (let i = i0; i <= i1; i += 1) for (let j = j0; j <= j1; j += 1) {
      const list = cells.get(key(i, j));
      if (!list) continue;
      for (const index of list) {
        const place = trunks[index], t = ((place.foot.x - a.x) * dx + (place.foot.z - a.z) * dz) / len2;
        if ((from == null ? t < 0.02 : t * Math.sqrt(len2) < from) || t > 0.985) continue;
        // (a line that passes over a trunk's top is not stopped by it: a bird above a short snag was hidden "behind" it)
        if (a.y + (b.y - a.y) * t > place.foot.y + place.top + 0.3) continue;
        if (Math.hypot(a.x + dx * t - place.foot.x, a.z + dz * t - place.foot.z) + half * t < place.girth * 0.92) return true;
      }
    }
    return false;
  }

  // ---- the ground: its height as it is drawn, and what kind of ground a spot is
  //   'tread' the trail itself | 'floor' the forest's floor | 'grass' the old clearing and the banks' grass
  //   | 'wet' the old cedar's sodden ground and the creek's edge | 'stones' a bar's cobbles | 'water' | 'steep'
  const _zone = { kind: 'terrace', d: 0, from: 0, wet: 0, meadow: 0, glade: 0, sodden: 0, creek: 99, water: 0, bar: 0, steep: 0, ours: true };
  function ground(x, z) {
    const zone = land.zone(x, z, _zone), off = trail.distance(x, z);
    if (zone.kind === 'water' || zone.creek < 0.4) return 'water';
    if (zone.steep > 0.4) return 'steep';
    if (off < 0.7) return 'tread';
    if (zone.kind === 'bar' || zone.kind === 'farbar') return 'stones';
    if (zone.sodden > 0.4 || zone.creek < 1.6) return 'wet';
    if (zone.meadow > 0.5 || zone.kind === 'bank') return 'grass';
    return 'floor';
  }
  // (the ground's own triangles: a metre to the cell where the fine sheet lies, which is where the walk leaves
  // the old terrace, and two metres on the old terrace. Further off the ground is drawn coarser than this
  // knows, and nothing is stood on it.)
  const height = (x, z) => (x > FINE.minX && x < FINE.maxX && z > FINE.minZ && z < FINE.maxZ ? terrain.surfaceAt(x, z) : groundUnder(terrain.heightAt, x, z));
  // how open the air is over a spot: 0 under the old terrace's trees, 1 on the river's bank
  const open = (x, z) => land.open(x, z);

  // A place beside the walk: `s` metres along it, `side` metres to the walker's right (+) or left (-).
  const _p = new THREE.Vector3(), _t = new THREE.Vector3();
  function beside(s, side, into) {
    trail.sample(s, _p, _t);
    const x = _p.x - _t.z * side, z = _p.z + _t.x * side;
    return into.set(x, height(x, z), z);
  }

  // ---- what a big animal walks round: every solid the layout laid (a trunk's foot, a log along its whole length,
  // a stump, a boulder, the old cedar, the shelter, the cabin), as circles in squares of their own
  const solids = new Map();
  let widest = 0;
  const addSolid = (x, z, radius) => {
    const k = key(Math.floor(x / CELL), Math.floor(z / CELL));
    if (!solids.has(k)) solids.set(k, []);
    solids.get(k).push(x, z, radius);
    widest = Math.max(widest, radius);
  };
  for (const kind of SOLID) {
    const records = layout[kind.name];
    if (!records) continue;
    for (let i = 0; i < records.length / RECORD; i += 1) {
      const x = records[i * RECORD], z = records[i * RECORD + 2], yaw = records[i * RECORD + 3], radius = kind.solid * records[i * RECORD + 4];
      if (!kind.half) { addSolid(x, z, radius); continue; }
      // (a log, or a bridge, along its length: a yaw about +y carries its own +x to (cos, 0, -sin))
      const half = kind.half * records[i * RECORD + 4], n = Math.ceil((2 * half) / radius) + 1;
      for (let j = 0; j < n; j += 1) { const t = -half + (2 * half * j) / (n - 1); addSolid(x + Math.cos(yaw) * t, z - Math.sin(yaw) * t, radius); }
    }
  }
  // is any solid within `radius` of a spot, seen from above?
  function solidAt(x, z, radius) {
    const reach = radius + widest;
    for (let i = Math.floor((x - reach) / CELL); i <= Math.floor((x + reach) / CELL); i += 1) for (let j = Math.floor((z - reach) / CELL); j <= Math.floor((z + reach) / CELL); j += 1) {
      const list = solids.get(key(i, j));
      if (!list) continue;
      for (let k = 0; k < list.length; k += 3) if (Math.hypot(list[k] - x, list[k + 1] - z) < radius + list[k + 2]) return true;
    }
    return false;
  }
  // Can a big animal stand here, its body `radius` round? On the old world's ground (where `height` is the drawn
  // ground's own: beyond it the valley is drawn coarser), out of the river and off the ravine's sides, on no slope
  // steeper than a beast walks up (0.55: 29 degrees), and in no solid. The creek it may step through.
  const _zw = { kind: 'terrace', d: 0, from: 0, wet: 0, meadow: 0, glade: 0, sodden: 0, creek: 99, water: 0, bar: 0, steep: 0, ours: true };
  function walkable(x, z, radius = 0.6) {
    if (!(x > LEGACY.minX + 4 && x < LEGACY.maxX - 4 && z > LEGACY.minZ + 4 && z < LEGACY.maxZ - 4)) return false;
    const zone = land.zone(x, z, _zw);
    if (zone.kind === 'water' || zone.steep > 0.3) return false;
    const e = 0.8, gx = height(x + e, z) - height(x - e, z), gz = height(x, z + e) - height(x, z - e);
    if (Math.hypot(gx, gz) / (2 * e) > 0.55) return false;
    return !solidAt(x, z, radius);
  }
  // Can a big animal get from one spot to another on foot: no river and no steep ground on the straight line between
  // them, every two metres (what stands on the line it walks round). An elk was given a way in from across the river,
  // and looked for another spot for ever (a reviewer's reading, and an arrival of 635 s, 2026-11-16).
  function crossable(x0, z0, x1, z1) {
    const d = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(d / 2));
    for (let i = 1; i < n; i += 1) {
      const zone = land.zone(x0 + ((x1 - x0) * i) / n, z0 + ((z1 - z0) * i) / n, _zw);
      if (zone.kind === 'water' || zone.steep > 0.3) return false;
    }
    return true;
  }

  // ---- open places near the walk where a herd can be: every eight metres along it, on either side, a spot from
  // nine to forty-five metres off with room round it (ten of twelve spots six metres round it walkable). Read
  // the first time a herd asks.
  let open_ = null;
  const _g = new THREE.Vector3();
  function grazing() {
    if (open_) return open_;
    open_ = [];
    // (no nearer the trail than 16 m: a herd's spots lie up to ten metres round its middle, and one grazing on the
  // tread is put to flight by every walk)
  for (let s = 0; s < trail.length; s += 8) for (const side of [-1, 1]) for (const off of [16, 24, 34, 45, 58]) {
      beside(s, side * off, _g);
      const x = _g.x, z = _g.z, kind = ground(x, z);
      if (kind === 'water' || kind === 'steep' || kind === 'tread' || !walkable(x, z, 1.2)) continue;
      if (open_.some((one) => Math.hypot(one.x - x, one.z - z) < 7)) continue;
      let room = 0;
      for (let k = 0; k < 12; k += 1) if (walkable(x + Math.cos((k / 12) * 6.283) * 6, z + Math.sin((k / 12) * 6.283) * 6, 0.6)) room += 1;
      if (room < 10) continue;
      open_.push({ x, z, s, off: trail.distance(x, z), ground: kind, open: land.open(x, z) });
    }
    return open_;
  }

  // ---- the walk itself, metre by metre: how open the air is over it, and whether its tread lies on the ground
  // (over the foot log and the stepping stones it does not)
  const steps = Math.ceil(trail.length), air = new Float32Array(steps), earth = new Uint8Array(steps);
  for (let i = 0; i < steps; i += 1) {
    trail.sample(i, _p, _t);
    air[i] = land.open(_p.x, _p.z);
    earth[i] = Math.abs(_p.y - height(_p.x, _p.z)) < 0.2 && ground(_p.x, _p.z) === 'tread' ? 1 : 0;
  }
  const metre = (s) => ((Math.floor(s) % steps) + steps) % steps;
  // under trees, on a tread that lies on the ground, for `reach` metres either way
  const wooded = (s, reach = 3) => { for (let d = -reach; d <= reach; d += 1) { const i = metre(s + d); if (!earth[i] || air[i] > 0.5) return false; } return true; };
  const airAt = (s) => air[metre(s)];

  return { trunks, stubs, logs, stumps, covers, leafy, perchesOf, boughsNear, leafyNear, blocked, trunksNear, stubsNear, coversNear, ground, height, open, beside, wooded, airAt, length: trail.length,
    solidAt, walkable, crossable, grazing, took: performance.now() - began, perchKinds };
}
