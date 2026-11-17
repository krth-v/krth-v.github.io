import * as THREE from 'three';
import { VIEW, river, inMeadow } from '../../world/land.js';
import { CABIN, SITE } from '../../plants/cabin.js';
import { cabinFloor } from '../../world/structures.js';

// The open air of the valley, for the birds that live on the wing (life/families/aerial.js: the Violet-green Swallow
// and Vaux's Swift), and the few places such a bird comes down to: a swallow's perches, and the hollow top the swifts
// go down into at dusk. Read once for each habitat from what the land is (world/land.js) and what was built, and
// kept. Nothing here is from a source: every number is the agent's, from the land's own rules, which it names.
//
// Where the air is clear, and how it is measured. The valley's own frame: `t` metres along the line the cabin's
// window looks down (VIEW: from the window, 20 degrees west of north, to where a spur closes the reach) and `u`
// metres to its right (east, across the valley). In the strip the window looks along nothing taller than 4.5 m
// grows (world/layout.js LOW, land.sightline: whole to 14 m either side of the line, from 12 m out to 372 m), so the
// air over it is clear at every height; trees stand beside it, and their limbs reach in (an edge-grown spruce's lowest
// limbs are up to 8 m long, a maple's crown is as wide as the tree is tall), so the lane flown is narrower: 6.5 m
// either side of the line, 8.5 m higher up. Over the old clearing (`inMeadow`, the outline's own distance inward)
// the air is clear low down, away from its edges and from the old apple tree; over the river's water, low down too,
// where it is in the window's strip (14 m either side of the line: the reach and the bend's near part; where the river
// winds away west it is walled by its banks' trees, and a bird low over it there had no clear air near it to make for);
// and over everything 82 m above the ground, which is above the tallest tree of the old terrace (75.6 m).
// The least height over the floor is what grows on it: the clearing's grass and bracken (1.3 m), the bars' willows
// in the strip (no taller than 3 m there), the shrubs of the strip's other ground (under 4.5 m), and nothing on the
// water.

const RAD = Math.PI / 180, UX = -Math.sin(VIEW.bearing * RAD), UZ = -Math.cos(VIEW.bearing * RAD);
export const along = (x, z) => (x - VIEW.x) * UX + (z - VIEW.z) * UZ;
export const across = (x, z) => -(x - VIEW.x) * UZ + (z - VIEW.z) * UX;
// the point at `t` along and `u` across, at height `y`
export const spotAt = (t, u, y, out) => out.set(VIEW.x + UX * t - UZ * u, y, VIEW.z + UZ * t + UX * u);
// the way along the line (t growing), as a heading on the ground: the angle of (x, z) from +x
export const UP_VALLEY = Math.atan2(UZ, UX);

export const LANE = { from: 14, to: 366, half: 6.5, wide: 8.5, wideAbove: 22 };       // the strip's lane: t, and u either side, low and high
export const DOOR = { from: -6, to: 14, half: 4, top: 10 };                               // the window's own line, over the dooryard
export const HIGH = 82;                                                                    // m over the ground: clear everywhere
const MEADOW_LOW = { inside: 6, top: 3 }, MEADOW_MID = { inside: 9, top: 40 };            // m inside the clearing's outline, and how high
const WATER = { inside: 2.5, top: 3, from: 80, half: 14 };                                // m inside the water's edge, how high over it, from t, and u either side
const LEAST = { water: 0.2, meadow: 1.5, bar: 3.4, land: 4.8 };                           // m over the floor: what grows there
const APPLE = { r: 6.5, top: 9.5 };                                                        // round the old apple tree, and up to

// ---- Among a tree's limbs. For a flight that is laid out before it is flown and does not look ahead as it goes (a
// hummingbird's display dive, life/places/hummingbird.js; a pigeon's display glide, life/families/canopy.js): is a
// point among the limbs of a tree? Read from the limbs each kind hands over (plants/build.js `perch.limbs`): for every
// metre of a kind's height, the furthest any of its limbs reaches from the plant's own middle line, so a tree is
// taken as the solid its limbs sweep round its trunk, with `margin` metres more for the leaves at their ends. That
// is more than the tree fills (a maple's five great limbs have air between them), which errs the right way.
// `land` is the habitat or a visit's world (`trunksNear`, `leafyNear`). What it cannot say: a tree the habitat
// does not read (further than 46 m from the walk; a thin-trunked one further than 26 m), and a shrub, which has no
// limbs. Every number is the agent's.
const spreads = new WeakMap(), _trunks = [], _leafy = [];
const CROWN_REACH = 14;                                    // m: no limb read reaches further from its foot (the old cedar's: 13)
function spreadOf(perch) {
  let spread = spreads.get(perch);
  if (spread) return spread;
  spread = [];
  const limbs = perch.limbs;
  if (limbs) for (const tube of limbs.tubes) for (let j = 0; j < tube.rings; j += 1) {
    const v = (tube.base + j * (tube.radial + 1)) * 3, k = Math.floor(limbs.position[v + 1]);
    if (k >= 0) spread[k] = Math.max(spread[k] || 0, Math.hypot(limbs.position[v], limbs.position[v + 2]));
  }
  spreads.set(perch, spread);
  return spread;
}
export function inCrown(land, p, margin = 0.5) {
  const among = (place) => {
    const h = p.y - place.foot.y;
    if (h <= 0) return false;
    const spread = spreadOf(place.perch), k = Math.floor(h / place.scale), reach = Math.max(spread[k] || 0, spread[k - 1] || 0, spread[k + 1] || 0);
    return reach > 0 && Math.hypot(p.x - place.foot.x, p.z - place.foot.z) < reach * place.scale + margin;
  };
  for (const place of land.trunksNear(p.x, p.z, CROWN_REACH, _trunks)) if (among(place)) return true;
  for (const tree of land.leafyNear(p.x, p.z, CROWN_REACH, _leafy)) if (among(tree.place)) return true;
  return false;
}

const cache = new WeakMap();
export function airOf(habitat) {
  let air = cache.get(habitat);
  if (!air) { air = makeAir(habitat); cache.set(habitat, air); }
  return air;
}

function makeAir(habitat) {
  const rv = [0, false, 0, 0, 0];
  const apple = habitat.leafy.find((tree) => tree.kind === 'apple') || null;
  // The floor under a spot: the water where there is water, the ground elsewhere; and what it is (`kind`)
  // (`least`: how high over it a bird keeps, for what grows there; `ground`: the ground itself, the river's bed under water)
  const under = { y: 0, ground: 0, kind: 'land', least: LEAST.land, t: 0, u: 0, edge: 0 };
  function floor(x, z) {
    const ground = habitat.height(x, z), t = along(x, z), u = across(x, z);
    under.t = t; under.u = u; under.y = ground; under.ground = ground; under.kind = 'land'; under.edge = 99;
    if (t > 60 || Math.abs(u) > 30) {
      river(x, z, rv);
      under.edge = rv[0];
      if (rv[0] < 0 && rv[2] > ground) { under.y = rv[2]; under.kind = 'water'; under.least = LEAST.water; return under; }
      if (rv[0] < rv[3]) { under.kind = 'bar'; under.least = LEAST.bar; return under; }
    }
    if (t > 10 && t < 105 && u > -15 && u < 35 && inMeadow(x, z) > 2) under.kind = 'meadow';
    under.least = LEAST[under.kind];
    return under;
  }
  const floorY = (x, z) => floor(x, z).y;
  const least = (x, z) => LEAST[floor(x, z).kind];
  // Is the air clear at (x, y, z)? (`h`: the height over the floor, if it is known already)
  function clear(x, y, z) {
    const f = floor(x, z), h = y - f.y, { t, u } = f;
    if (h < LEAST[f.kind] - 0.15) return false;
    if (h >= HIGH) return true;
    if (t >= LANE.from && t <= LANE.to && Math.abs(u) <= (h >= LANE.wideAbove ? LANE.wide : LANE.half)) return true;
    if (t >= DOOR.from && t < DOOR.to && Math.abs(u) <= DOOR.half && h <= DOOR.top) return true;
    if (f.kind === 'water' && t >= WATER.from && t <= LANE.to && Math.abs(u) <= WATER.half && h <= WATER.top && f.edge <= -WATER.inside) return true;
    if (h <= MEADOW_MID.top && t > 10 && t < 105 && u > -15 && u < 35) {
      if (apple && h <= APPLE.top && Math.hypot(x - apple.x, z - apple.z) < APPLE.r) return false;
      const inside = inMeadow(x, z);
      if (inside >= MEADOW_MID.inside || (h <= MEADOW_LOW.top && inside >= MEADOW_LOW.inside)) return true;
    }
    return false;
  }

  // ---- a swallow's perches: the cabin's ridge log and the tops of snags at the edge of the clearing and the bend
  // (each { point, along, up, radius, kind, t, u })
  let perches = null;
  function perchList() {
    if (perches) return perches;
    perches = [];
    // the ridge log (plants/cabin.js: its top a hand under the shakes' plane at the ridge, 0.1 m round; the cabin's
    // floor is world/structures.js's sum), six places along it, inside the walls' span
    const floorAt = cabinFloor({ heightAt: habitat.height }), top = floorAt + CABIN.ridge - 0.03;
    for (let k = 0; k < 6; k += 1) {
      const z = SITE.z - SITE.half[1] + 0.2 + k * ((2 * SITE.half[1] - 0.2) / 5), point = new THREE.Vector3(SITE.x, top, z);
      perches.push({ point, along: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0), radius: 0.1, kind: 'ridge', t: along(point.x, point.z), u: across(point.x, point.z) });
    }
    // (The old apple's dead limb was one, and was taken out: it is inside the tree's crown, and a close-up of a swallow on
    // it, from the walk 57 m off, was a frame of blossom with a speck in it; its way in went through the crown.)
    // a snag's broken top, where the air is open over it (land.open: not under the old terrace's trees) near the
    // clearing and the bend
    for (const t of habitat.trunks) {
      if (t.kind !== 'snag') continue;
      const k = t.heights.length - 1, ax = t.axis[k], top = new THREE.Vector3(ax.x, 0, ax.z).applyQuaternion(t.yaw).multiplyScalar(t.scale).add(t.foot);
      top.y = t.foot.y + t.top - 0.12;
      const tt = along(top.x, top.z), uu = across(top.x, top.z);
      if (habitat.open(top.x, top.z) < 0.3 || tt < 10 || tt > 150 || Math.abs(uu) > 36) continue;
      perches.push({ point: top, along: null, up: new THREE.Vector3(0, 1, 0), radius: 0.06, kind: 'snag', t: tt, u: uu });
    }
    return perches;
  }

  // ---- the swifts' roost: the old redcedar's broken top (plants/cedar.js: its old stem ends at 41 m, the end's middle
  // a fifth of a metre under that, at 40.8 m in the tree's own frame), a hollow chimney of silver wood. Read from the
  // tree as built: the middle of the end's own vertices. The stem leans less than three degrees there (the slope of
  // its axis in plants/cedar.js at the top: 0.007 and 0.045 of a metre in a metre), so the hollow is taken as upright.
  // Twelve places to cling inside it, round the hollow's wall and a step apart in depth. If the cedar is not where it
  // was, the tallest snag near the walk serves.
  let roost = null;
  function roostOf() {
    if (roost) return roost;
    const cedar = habitat.trunks.find((t) => t.kind === 'cedar');
    let top = null;
    const axis = new THREE.Vector3(0, 1, 0);
    if (cedar) {
      const p = cedar.perch.position;
      const end = new THREE.Vector3();
      let n = 0;
      for (let i = 0; i < p.length; i += 3) if (Math.abs(p[i + 1] - 40.8) < 0.01) { end.x += p[i]; end.y += p[i + 1]; end.z += p[i + 2]; n += 1; }
      if (n) top = end.divideScalar(n).applyMatrix4(cedar.matrix);
    }
    let tree = cedar;
    if (!top) {
      tree = habitat.trunks.filter((t) => t.kind === 'snag').sort((a, b) => b.top - a.top)[0] || null;
      if (!tree) { roost = { top: null, slots: [] }; return roost; }
      const k = tree.heights.length - 1, ax = tree.axis[k];
      top = new THREE.Vector3(ax.x, 0, ax.z).applyQuaternion(tree.yaw).multiplyScalar(tree.scale).add(tree.foot);
      top.y = tree.foot.y + tree.top - 0.15;
    }
    const side = new THREE.Vector3(1, 0, 0).addScaledVector(axis, -axis.x).normalize(), other = new THREE.Vector3().crossVectors(axis, side);
    const slots = [];
    // (neighbours round the wall are a step apart in depth: no two nearer than 0.34 m, which the visit's crowding
    // test, 0.3 m, and the count's, 0.12 m, both allow)
    const radius = tree === cedar ? 0.22 : 0.1;
    for (let k = 0; k < 12; k += 1) {
      const th = (k * Math.PI * 2) / 12, depth = 0.45 + 0.32 * (k % 4);
      const out = side.clone().multiplyScalar(Math.cos(th)).addScaledVector(other, Math.sin(th));
      const point = top.clone().addScaledVector(axis, -depth).addScaledVector(out, radius);
      // clinging head up, its belly to the wall and its back to the hollow
      const q = new THREE.Quaternion(), m = new THREE.Matrix4(), back = out.clone().negate(), right = new THREE.Vector3().crossVectors(axis, back);
      q.setFromRotationMatrix(m.makeBasis(axis, back, right));
      slots.push({ point, q, depth });
    }
    roost = { top, axis, slots, tree, cedar: tree === cedar };
    return roost;
  }

  return { floor, floorY, least, clear, perches: perchList, roost: roostOf, apple };
}
