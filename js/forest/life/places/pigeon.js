import * as THREE from 'three';
import { onLimb, onStub, standing } from '../perch.js';
import { river, creek, SHAPE } from '../../world/land.js';
import { airOf } from './aerial2.js';

// Where a flock of Band-tailed Pigeons can be (life/families/canopy.js): a haunt, a stretch of the valley round one
// of its tall trees, and in it the places a flock goes to by turns. Read from the habitat as it is (life/habitat.js)
// and from the land (world/land.js), when a visit gives a flock its haunt.
//
//   lookouts  high and open: the broken tops of snags and the stubs on them, and the upper limbs of tall trees (the
//             old terrace's Douglas-firs and hemlocks, the valley's spruces, the alders of the banks), within the
//             last eight metres of each; trees that stand together are one place, so that a flock can spread over them
//   feeders   trees in leaf and flower that a pigeon clambers about in: the old apple in blossom, the alders, the
//             maples, the vine maples, the willows and the spruces; and the red elderberry and the salmonberry, near
//             their tops (a shrub has no wood to read: the habitat hands over the kinds it read, `perchKinds`, and a
//             shrub's places are its `sprigs`)
//   waters    the ground at the water's edge where it can stand and drink: round the spring under the old cedar,
//             along the creek, and on the river's cobbles where they run down into the water
//   roosts    the boughs of thick conifers, six metres up and more, for the night
//
// From what was read (the species' file names the sources): it perches high in tall dead conifers near where it
// feeds; it feeds in trees, clambering about them, and on the ground; in the breeding season it comes to mineral
// springs and the water's edge to drink; it roosts in thick conifers. The agent's own: every distance, height and
// count here, which trees are read as lookouts and which as feeders, and how places are grouped.

const out = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() };
const _r = [0, false, 0, 0, 0], _c = [0, 0, 0, 0, 0];
const TALL = 14;                 // a lookout is a tree or a snag this tall at the least (m)
const TOP = 8;                   // its spots are within this far of its top (m)
const GRIP = 0.009;              // a limb thinner than this (a radius, m) is no perch for a pigeon
const LOOKOUTS = ['snag', 'cedar', 'giant', 'mature', 'spruce', 'slope', 'alder'];
const FEEDS = ['apple', 'alder', 'maple', 'vine', 'willow', 'spruce'];
const SHRUBS = ['elder', 'salmon'];
const ROOSTS = ['mature', 'pole', 'spruce'];

// A spot: where a pigeon stands (`point`, on top of what it stands on), the way what it stands on runs (`along`,
// or null for the top of a snag or the ground), how thick that is (`radius`), and `kind`: 'limb', 'stub', 'top',
// 'twig' or 'ground' ('ground' has `face`, the way to the water). A place: { kind, spots, x, z, y, name }.
// (`bare`: it has a dead top in it, a snag's or the old cedar's)
const placeOf = (kind, spots, name) => {
  let x = 0, y = 0, z = 0;
  for (const s of spots) { x += s.point.x; y += s.point.y; z += s.point.z; }
  const n = Math.max(1, spots.length);
  return { kind, spots, name, x: x / n, y: y / n, z: z / n, bare: spots.some((s) => s.kind === 'top') };
};

// The spots high on a tall trunk: a snag's broken top and the stubs on it (and the old cedar's dead top); a living
// tree's upper limbs, a little way out from the trunk where a limb is still thick.
function highOn(t, habitat) {
  const spots = [], foot = t.foot;
  let top = t.top;
  if (t.kind === 'cedar') {
    // The old cedar's dead top is not the top of the trunk it hands over: that tube is its buttressed foot, which ends
    // 14 m up, where the stem is over 4 m through, and a spot read from its last ring was inside the wood, 27 m under
    // the top (a pigeon landed into the bark). It is the old stem's broken end, which the swifts' roost is read from
    // (life/places/aerial2.js `roost`: the end's middle): the tip of the tallest splinter round that end, from the
    // wood's own vertices. Within 1.5 m of the end's middle, the agent's: measured on the tree as built, the stem's
    // splinters stand within 0.84 m of it and no other wood above 40 m within 4 m.
    const roost = airOf(habitat).roost();
    if (!roost.cedar || roost.tree !== t) return spots;
    const p = t.perch.position, middle = roost.top.clone().applyMatrix4(new THREE.Matrix4().copy(t.matrix).invert()), tip = new THREE.Vector3(0, -Infinity, 0);
    for (let i = 0; i < p.length; i += 3) if (p[i + 1] > tip.y && Math.hypot(p[i] - middle.x, p[i + 2] - middle.z) < 1.5) tip.set(p[i], p[i + 1], p[i + 2]);
    if (tip.y < middle.y) return spots;
    tip.applyMatrix4(t.matrix);
    top = tip.y - foot.y;
    spots.push({ point: tip, along: null, radius: 0.06, kind: 'top', above: top });
    for (const stub of t.perch.stubs || []) {
      const radius = onStub(t, stub, out), above = out.point.y - foot.y;
      if (radius >= GRIP && above > top - TOP - 4) spots.push({ point: out.point.clone(), along: out.along.clone(), radius, kind: 'stub', above });
    }
    return spots;
  }
  if (t.kind === 'snag') {
    const k = t.heights.length - 1, ax = t.axis[k];
    const p = new THREE.Vector3(ax.x, 0, ax.z).applyQuaternion(t.yaw).multiplyScalar(t.scale).add(foot);
    p.y = foot.y + top - 0.1;
    spots.push({ point: p, along: null, radius: 0.06, kind: 'top', above: top });
    for (const stub of t.perch.stubs || []) {
      const radius = onStub(t, stub, out), above = out.point.y - foot.y;
      if (radius >= GRIP && above > top - TOP - 4) spots.push({ point: out.point.clone(), along: out.along.clone(), radius, kind: 'stub', above });
    }
    return spots;
  }
  const limbs = t.perch.limbs;
  if (!limbs) return spots;
  // the very top of the tree, on its leader (as a pigeon sits on the top of a conifer, against the sky)
  {
    const k = t.heights.length - 1, ax = t.axis[k];
    const p = new THREE.Vector3(ax.x, 0, ax.z).applyQuaternion(t.yaw).multiplyScalar(t.scale).add(foot);
    p.y = foot.y + top + 0.02;
    spots.push({ point: p, along: null, radius: 0.012, kind: 'tip', above: top });
  }
  for (const tube of limbs.tubes) {
    const root = limbs.position[tube.base * 3 + 1] * t.scale;
    if (root < top - TOP || root < 6) continue;
    for (const share of [0.2, 0.42]) {
      const radius = onLimb(t, limbs, tube, share, out);
      if (radius < GRIP) continue;
      spots.push({ point: out.point.clone(), along: out.along.clone(), radius, kind: 'limb', above: out.point.y - foot.y });
    }
  }
  return spots;
}

// Places near one another (`reach`, m, between their middles seen from above) grouped as one.
function grouped(items, reach) {
  const groups = [];
  for (const item of items) {
    const g = groups.find((one) => Math.hypot(one.x - item.x, one.z - item.z) < reach);
    if (g) { g.items.push(item); g.x = (g.x * (g.items.length - 1) + item.x) / g.items.length; g.z = (g.z * (g.items.length - 1) + item.z) / g.items.length; }
    else groups.push({ x: item.x, z: item.z, items: [item] });
  }
  return groups;
}

// The ground at the water's edge, where a pigeon can stand on the dry side of it and reach down to drink: every
// `step` m over a square of `half` m round (x, z), the spots on a river bar's cobbles within 0.5 m of the river's
// water, and the spots just outside what the habitat calls the creek's water (0.4 m from its edge) on its wet
// ground or its floor; never on the trail's tread or a steep bank. (On the river only the open bars: from the trail
// a bird at the foot of the bank's grass and ferns was a frame of leaves.)
function edgesNear(habitat, x, z, half, step) {
  const spots = [], CELL = 6;
  // (a coarse look first: only the squares the river or the creek comes near are looked at closely)
  for (let ci = -half; ci < half; ci += CELL) for (let cj = -half; cj < half; cj += CELL) {
    const mx = x + ci + CELL / 2, mz = z + cj + CELL / 2;
    if (river(mx, mz, _r)[0] > CELL && creek(mx, mz, _c)[0] > CELL) continue;
    for (let i = ci; i < Math.min(half, ci + CELL); i += step) for (let j = cj; j < Math.min(half, cj + CELL); j += step) edgeAt(habitat, x + i, z + j, spots);
  }
  return spots;
}
function edgeAt(habitat, px, pz, spots) {
  {
    // the river: within a hand or two of its water, above it
    river(px, pz, _r);
    let to = null, onRiver = false;
    if (_r[0] > 0.04 && _r[0] < 0.5) {
      onRiver = true;
      // the way to the water: down the slope of the distance
      const dx = river(px + 0.3, pz, _r)[0] - river(px - 0.3, pz, _r)[0], dz = river(px, pz + 0.3, _r)[0] - river(px, pz - 0.3, _r)[0];
      to = new THREE.Vector3(-dx, 0, -dz);
    } else {
      creek(px, pz, _c);
      const edge = _c[0] - _c[2];                           // metres from the creek's water (its bed's half-width)
      if (_c[0] < 90 && edge > 0.4 && edge < 0.8) {
        const dx = creek(px + 0.2, pz, _c)[0] - creek(px - 0.2, pz, _c)[0], dz = creek(px, pz + 0.2, _c)[0] - creek(px, pz - 0.2, _c)[0];
        to = new THREE.Vector3(-dx, 0, -dz);
      }
    }
    if (!to || to.lengthSq() < 1e-6) return;
    const ground = habitat.ground(px, pz);
    if (onRiver ? ground !== 'stones' : ground === 'water' || ground === 'tread' || ground === 'steep') return;
    to.normalize();
    const point = new THREE.Vector3(px, habitat.height(px, pz), pz);
    // (not where the ground falls away steeply to the water: a cut bank)
    const fall = point.y - habitat.height(px + to.x * 0.5, pz + to.z * 0.5);
    if (fall > 0.35) return;
    spots.push({ point, along: null, radius: 0, kind: 'ground', face: to, ground });
  }
}

// Every shrub of the kinds a pigeon feeds in, near (x, z), with the spots near its top: from the habitat's
// `perchKinds` (each kind with a perch, and its records) where it hands them over; otherwise none.
function shrubsNear(habitat, x, z, reach) {
  const found = [];
  if (!habitat.perchKinds) return found;
  for (const { name, perch, records } of habitat.perchKinds) {
    if (!SHRUBS.includes(name) || !perch.sprigs || !perch.sprigs.length) continue;
    for (let i = 0; i < records.length / 8; i += 1) {
      const px = records[i * 8], pz = records[i * 8 + 2];
      if (Math.hypot(px - x, pz - z) > reach) continue;
      const place = standing(perch, records, i), high = Math.max(...perch.sprigs.map((s) => s[1])) * place.scale, spots = [];
      // (each cane's sprigs but its last, at the cane's free end, which moves in the wind: as the thicket reads them)
      const far = perch.sprigs.map((s) => Math.hypot(s[0], s[1], s[2]));
      perch.sprigs.forEach((s, k) => {
        if (k === perch.sprigs.length - 1 || far[k + 1] < far[k]) return;
        if (s[1] * place.scale < Math.max(1, high * 0.55)) return;
        const point = new THREE.Vector3(s[0], s[1], s[2]).applyMatrix4(place.matrix), along = new THREE.Vector3(s[3], s[4], s[5]).applyQuaternion(place.yaw);
        if (along.lengthSq() < 1e-8) along.set(1, 0, 0);
        spots.push({ point, along: along.normalize(), radius: 0.007, kind: 'twig', above: point.y - place.foot.y });
      });
      if (spots.length >= 2) found.push({ x: px, z: pz, name, spots });
    }
  }
  return found;
}

// A flock's haunt round (x, z), within `range` m: its places, each grouped and each with spots enough. Null if it
// has no lookout or nothing to feed in.
export function hauntAt(habitat, x, z, range) {
  // lookouts: snags and tall trees, in groups of those that stand within 14 m of one another
  const high = [];
  for (const t of habitat.trunksNear(x, z, range, [])) {
    if (t.top < TALL || !LOOKOUTS.includes(t.kind)) continue;
    const spots = highOn(t, habitat);
    if (spots.length) high.push({ x: t.foot.x, z: t.foot.z, spots, name: t.kind });
  }
  const lookouts = grouped(high, 14).map((g) => placeOf('lookout', g.items.flatMap((i) => i.spots), g.items[0].name)).filter((p) => p.spots.length >= 3);
  // feeders: the trees in leaf and flower, and the shrubs; a tree with spots within reach of a pigeon's grip
  const leafy = habitat.leafyNear(x, z, range, []);
  const feed = [];
  for (const tree of leafy) {
    if (!FEEDS.includes(tree.kind)) continue;
    const spots = habitat.perchesOf(tree).filter((one) => one.radius >= GRIP && one.above >= 1.6).map((one) => ({ point: one.point, along: one.along, radius: one.radius, kind: 'limb', above: one.above }));
    if (spots.length >= 2) feed.push({ x: tree.x, z: tree.z, spots, name: tree.kind });
  }
  feed.push(...shrubsNear(habitat, x, z, range));
  const feeders = grouped(feed, 9).map((g) => placeOf('feed', g.items.flatMap((i) => i.spots), g.items[0].name)).filter((p) => p.spots.length >= 3);
  // roosts: thick conifers, six metres up and more
  const roost = [];
  for (const tree of leafy) {
    if (!ROOSTS.includes(tree.kind)) continue;
    const spots = habitat.perchesOf(tree).filter((one) => one.radius >= GRIP && one.above >= 6).map((one) => ({ point: one.point, along: one.along, radius: one.radius, kind: 'limb', above: one.above }));
    if (spots.length >= 3) roost.push({ x: tree.x, z: tree.z, spots, name: tree.kind });
  }
  const roosts = grouped(roost, 8).map((g) => placeOf('roost', g.items.flatMap((i) => i.spots), g.items[0].name)).filter((p) => p.spots.length >= 4);
  // waters: the spring and the creek's head, the creek, the river's edge; in stretches of a few metres
  const wet = [];
  const spring = SHAPE.CREEK[0];
  for (const [cx, cz, half, step, name] of [[spring[0], spring[1], 4, 0.4, 'spring'], [x, z, Math.min(range, 60), 0.55, 'edge']]) {
    if (Math.hypot(cx - x, cz - z) > range + half) continue;
    for (const spot of edgesNear(habitat, cx, cz, half, step)) {
      if (Math.hypot(spot.point.x - x, spot.point.z - z) > range) continue;
      if (name === 'edge' && Math.hypot(spot.point.x - spring[0], spot.point.z - spring[1]) < 4.5) continue;
      wet.push({ x: spot.point.x, z: spot.point.z, spots: [spot], name: name === 'spring' ? 'spring' : river(spot.point.x, spot.point.z, _r)[0] < 0.4 ? 'river' : 'creek' });
    }
  }
  const waters = grouped(wet, 7).map((g) => placeOf('water', g.items.flatMap((i) => i.spots), g.items[0].name)).filter((p) => p.spots.length >= 4);
  // and by each, the boughs of the trees within 16 m of it, nearest first: where the rest of a flock waits its turn
  // when there is no room for it at the edge
  for (const place of waters) {
    const near = [];
    for (const tree of habitat.leafyNear(place.x, place.z, 16, [])) for (const one of habitat.perchesOf(tree)) {
      if (one.radius >= GRIP && one.above >= 1.6 && one.above <= 12) near.push({ point: one.point, along: one.along, radius: one.radius, kind: 'limb', above: one.above });
    }
    near.sort((p, q) => Math.hypot(p.point.x - place.x, p.point.z - place.z) - Math.hypot(q.point.x - place.x, q.point.z - place.z));
    place.wait = near.length >= 3 ? { ...placeOf('wait', near.slice(0, 30), 'by the water'), water: place } : null;
  }
  if (!lookouts.length || !feeders.length) return null;
  return { x, z, range, lookouts, feeders, waters, roosts };
}

// Where a flock's haunt may be centred: the snags and the tall trees that stand where the air is open, or near it
// (the edges of the old clearing, the river's banks, the old cedar's glade), with a tree it feeds in within `range`
// (a snag deep in the old terrace has none, and no haunt)
const _trees = [];
export function hauntSites(habitat, range) {
  return habitat.trunks.filter((t) => t.top >= TALL && (t.kind === 'snag' || habitat.open(t.foot.x, t.foot.z) >= 0.2)
    && habitat.leafyNear(t.foot.x, t.foot.z, range, _trees).some((tree) => FEEDS.includes(tree.kind)));
}

