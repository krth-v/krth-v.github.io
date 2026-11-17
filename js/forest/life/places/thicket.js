import * as THREE from 'three';
import { standing } from '../perch.js';

// Where a warbler of the thickets can be: the twigs of the shrubs near the walk (life/families/thicket.js).
//
// Every shrub hands over `sprigs` (plants/build.js): places along its stems or canes, each a point and the way the stem
// runs there, in the plant's own space at scale 1. They are read here into the world, plant by plant, for the
// salmonberry, the red elderberry, the devil's club, the red huckleberry, the willows of the bars and the vine maples of
// the hall: every kind whose perch has sprigs and no trunk, read alike by that and not by its name.
//
// Where they come from. The willows and the vine maples have wood (their stems are limbs), so the habitat reads them
// among its trees (`leafy`), and each tree there carries its plant's perch and the transform that stands it in the
// world. The salmonberry, the elderberry, the devil's club and the huckleberry have no wood (their stems are painted
// on their cards), and the habitat hands over nothing of them unless it hands over the kinds it read (`perchKinds`:
// every kind that has a perch, with its records). With that, every shrub is read here; without it, the willows and
// the vine maples alone.
//
// What each place says of itself, for a bird that wants to be seen or to be hidden (a bird inside a shrub is behind
// the shrub's own leaves from everywhere: 2026-11-16, the close-ups of the first version were frames of leaves):
//   stem, k, end   which of the plant's stems it is on, how far along it (0 the first sprig), and whether it is the
//                  stem's last, at its free end. On a plant whose stems are painted on cards (no wood) the card moves
//                  in the wind, the more the further along it (plants/shrubs.js: a cane's freedom runs from 0.02 at
//                  its root to 0.7 at its end), and a bird standing on it does not move with it.
//   out            how far it is from the plant's foot, seen from above (m)
//   front          how far it is towards the walk from the plant's foot, seen from above (m). (Which side of its
//                  shrub a place is on said little of how much of a bird there a close-up shows: `open` does.)
//   open           how much of it the walk sees, 0 to 1, worked out for a plant's places the first time it is asked
//                  for (`index.sight(plant)`): from four places on the walk, 8 and 12 m from it either way along the
//                  walk, at the walker's eye, the share of the lines to it along whose last 0.28 (what a close-up
//                  draws: life/index.js) no twig of a shrub lies within 0.25 m (its places, points every 0.15 m
//                  between them, and each stem drawn on past its last place by its last stretch). A guess from the
//                  twigs alone: it knows nothing of ferns, of trees, or of leaves that hang away from their twigs.
//                  Set beside what close-ups showed (2026-11-16: a bird held on 90 places of 18 shrubs near the walk
//                  and looked at from 10 m on it, scratch/probe2.mjs; the lines worked out afterwards for the same
//                  places and eyes): with no twig on the line from the eye, a quarter of the bird or more showed in
//                  35 close-ups of 45 (0.46 of it on the mean), with a twig on it in 18 of 45 (0.25).
// and each plant:
//   toward         the way to the walk from its foot, seen from above (a unit vector, x and z)
//   edge           spots on the ground between the shrub and the walk, at the walk's own edge, for a bird that feeds
//                  on the ground at the shrubs' edge where it can be seen: not in water, not on steep ground. (Spots at
//                  the shrub's own edge, out from its outermost twig, were hidden by grass and the floor's low plants
//                  in 14 close-ups of 17 from 10 m on the walk, 2026-11-16: the ground a walker sees a small bird on is
//                  the tread's margin.) None for a shrub further from the walk than `EDGE.far`.
//
// What is the agent's own: how far from the walk a shrub is read (`REACH`), the twig's girth (`TWIG`), where the
// edge's spots lie (`EDGE`), and the numbers of the guess at what the walk sees (`SIGHT`).

const REACH = 30;                 // metres from the walk within which a shrub is read
const CELL = 8;                   // the shrubs are kept in squares this wide
const TWIG = 0.006;               // the girth of a twig a small bird grips (m, a radius)
// the edge's spots: metres from the walk's middle line towards the shrub, metres along the walk either way, and how
// far beyond its outermost sprig a shrub may be from the walk's edge and still have them
const EDGE = { off: [0.75, 1.2], along: [-0.6, 0, 0.6], far: 2.5 };
// the guess at what the walk sees of a place: how far from it the walker stands (m, either way along the walk), the
// walker's eye over the tread (m), the share of the line nearest the place that a close-up draws, how near the line a
// twig hides the place (m), how far apart the points between twigs are (m), and how far round a plant other plants'
// twigs are read (m, beyond its reach)
const SIGHT = { far: [8, 12], eye: 1.6, drawn: 0.28, near: 0.25, step: 0.15, round: 5 };
const _p = new THREE.Vector3(), _t = new THREE.Vector3(), _d = new THREE.Vector3(), _w = new THREE.Vector3(), _g = new THREE.Vector3();
const made = new WeakMap();       // an index for each habitat, kept by its `leafyNear` (the visit's world has the same one)
// The girth of a plant's stems at each of its sprigs, where its stems are wood (a willow's, a vine maple's: their
// sprigs are on the stems' middle lines, and where the birds were, a stem there was 1.1 to 4.7 cm in radius, at the
// plant's size: a bird put on a twig's girth stood sunk in it), read from the wood as built: of the vertices within
// 0.1 m of the stem's line there, the mean distance from the line of the five nearest the sprig along it (one ring of
// the tube). One list to a kind.
const girths = new WeakMap();
function girthsOf(perch) {
  if (girths.has(perch)) return girths.get(perch);
  const pos = perch.position, list = perch.sprigs.map((sprig) => {
    const l = Math.hypot(sprig[3], sprig[4], sprig[5]) || 1, ax = sprig[3] / l, ay = sprig[4] / l, az = sprig[5] / l, near = [];
    for (let i = 0; i + 2 < pos.length; i += 3) {
      const dx = pos[i] - sprig[0], dy = pos[i + 1] - sprig[1], dz = pos[i + 2] - sprig[2], along = dx * ax + dy * ay + dz * az;
      const off = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - along * along));
      if (off < 0.1 && Math.abs(along) < 0.8) near.push([Math.abs(along), off]);
    }
    near.sort((a, b) => a[0] - b[0]);
    const ring = near.slice(0, 5);
    return ring.length ? ring.reduce((sum, [, off]) => sum + off, 0) / ring.length : TWIG;
  });
  girths.set(perch, list);
  return list;
}
// Whether a twig stands near the line from an eye to a point over the part of it a close-up draws: twigs is a flat list
// of x, y, z (`SIGHT`)
function hidden(point, eye, twigs) {
  _d.subVectors(eye, point);
  const dist = _d.length(), reach = SIGHT.drawn * dist, near = SIGHT.near * SIGHT.near;
  _d.divideScalar(dist);
  for (let i = 0; i < twigs.length; i += 3) {
    const gx = twigs[i] - point.x, gy = twigs[i + 1] - point.y, gz = twigs[i + 2] - point.z, along = gx * _d.x + gy * _d.y + gz * _d.z;
    if (along < 0.1 || along > reach) continue;
    const sq = gx * gx + gy * gy + gz * gz;
    if (sq < 0.0144) continue;
    if (sq - along * along < near) return true;
  }
  return false;
}

// The shrubs' places for a habitat, or for a visit's world (which has the habitat's own `leafyNear`): built the first
// time it is asked for, the same index after that (built again, once, if it was first asked for by a source that
// could not hand over every kind and is now asked for by one that can).
export function shrubsOf(source) {
  const key = source.leafyNear;
  if (made.has(key) && (made.get(key).all || !source.perchKinds)) return made.get(key);
  const index = build(source);
  made.set(key, index);
  return index;
}

function build(source) {
  const plants = [];
  // where a spot is from the walk: [metres off its middle line, metres along it], and the walk's own point there
  const { locate, onWalk } = locator(source);
  const add = (kind, place, wood) => {
    const sprigs = place.perch.sprigs;
    if (!sprigs || !sprigs.length) return;
    const x = place.foot.x, z = place.foot.z, [off, s] = locate(x, z);
    if (off > REACH) return;
    const ground = source.ground ? source.ground(x, z) : 'floor';
    if (ground === 'water') return;
    onWalk(s, _w);
    let tx = _w.x - x, tz = _w.z - z;
    const tl = Math.hypot(tx, tz);
    if (tl > 1e-4) { tx /= tl; tz /= tl; } else { tx = 1; tz = 0; }
    const plant = { kind, x, z, foot: place.foot.y, off, s, wood, ground, open: source.open ? source.open(x, z) : 0, places: [], top: null, reach: 0, scale: place.scale,
      toward: { x: tx, z: tz }, edge: [] };
    // (a stem's sprigs come one after another from its root outwards, so a new stem begins where one is nearer the
    // plant's root than the last was)
    const far = sprigs.map((sprig) => Math.hypot(sprig[0], sprig[1], sprig[2]));
    const girth = wood && place.perch.position ? girthsOf(place.perch) : null;
    let stem = 0, k = 0;
    sprigs.forEach((sprig, i) => {
      if (i > 0 && far[i] < far[i - 1]) { stem += 1; k = 0; } else if (i > 0) k += 1;
      const end = i === sprigs.length - 1 || far[i + 1] < far[i];
      _p.set(sprig[0], sprig[1], sprig[2]).applyMatrix4(place.matrix);
      _d.set(sprig[3], sprig[4], sprig[5]).applyQuaternion(place.yaw);
      if (_d.lengthSq() < 1e-8) _d.set(1, 0, 0);
      _d.normalize();
      const under = source.height(_p.x, _p.z), above = _p.y - under;
      if (above < 0.08) return;
      const dx = _p.x - x, dz = _p.z - z;
      const one = { point: _p.clone(), along: _d.clone(), radius: girth ? girth[i] * place.scale : TWIG, above, plant, wood, stem, k, end, out: Math.hypot(dx, dz), front: dx * tx + dz * tz };
      plant.places.push(one);
      if (!plant.top || one.point.y > plant.top.point.y) plant.top = one;
      plant.reach = Math.max(plant.reach, one.out);
    });
    if (!plant.places.length) return;
    // the ground between it and the walk, at the walk's edge (the walk's point nearest it, and the way along the walk)
    if (off - EDGE.off[1] <= plant.reach + EDGE.far) {
      onWalk(s + 0.5, _t); let ax = _t.x, az = _t.z;
      onWalk(Math.max(0, s - 0.5), _t); ax -= _t.x; az -= _t.z;
      const al = Math.hypot(ax, az) || 1;
      ax /= al; az /= al;
      for (const d of EDGE.off) for (const l of EDGE.along) {
        const ex = _w.x - tx * d + ax * l, ez = _w.z - tz * d + az * l;
        const kind = source.ground ? source.ground(ex, ez) : 'floor';
        if (kind === 'water' || kind === 'steep') continue;
        plant.edge.push({ point: new THREE.Vector3(ex, source.height(ex, ez), ez), kind, plant });
      }
    }
    plants.push(plant);
  };
  if (source.perchKinds) {
    // every kind the habitat read that has sprigs and no trunk: shrubs, willows, vine maples
    for (const { name, perch, records, form } of source.perchKinds) {
      if ((form || 'standing') !== 'standing' || perch.trunk || !perch.sprigs || !perch.sprigs.length) continue;
      for (let i = 0; i < records.length / 8; i += 1) add(name, standing(perch, records, i), !!perch.limbs);
    }
  } else {
    // the trees the habitat reads that have no trunk: the willows and the vine maples
    for (const tree of source.leafyNear(-150, -60, 1200, [])) if (!tree.place.perch.trunk) add(tree.kind, tree.place, true);
  }
  // in squares of their own
  const cells = new Map(), key = (i, j) => i * 4096 + j;
  for (const plant of plants) {
    const k = key(Math.floor(plant.x / CELL), Math.floor(plant.z / CELL));
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(plant);
  }
  // the plants whose foot is within `reach` of a spot, seen from above (into `list`, which is emptied first)
  const near = (x, z, reach, list = []) => {
    list.length = 0;
    for (let i = Math.floor((x - reach) / CELL); i <= Math.floor((x + reach) / CELL); i += 1) for (let j = Math.floor((z - reach) / CELL); j <= Math.floor((z + reach) / CELL); j += 1) {
      const some = cells.get(key(i, j));
      if (some) for (const plant of some) if (Math.hypot(plant.x - x, plant.z - z) <= reach) list.push(plant);
    }
    return list;
  };
  const kinds = {};
  for (const plant of plants) kinds[plant.kind] = (kinds[plant.kind] || 0) + 1;
  // how much of each of a plant's places the walk sees (`open`), worked out once (see the head of this file), and the
  // twigs about the plant that it was worked out from, kept with it (`twigs`) for `clear`
  const length = source.trail ? source.trail.length : source.length;
  const sight = (plant) => {
    if (plant.twigs) return plant;
    // the twigs about it: every place of the plants within reach, points between a stem's places, and each stem
    // drawn on past its last place by its last stretch
    const twigs = [];
    for (const other of near(plant.x, plant.z, plant.reach + SIGHT.round, [])) {
      const list = other.places;
      list.forEach((one, i) => {
        const last = i > 0 && list[i - 1].stem === one.stem ? list[i - 1] : null;
        if (last) {
          const n = Math.floor(last.point.distanceTo(one.point) / SIGHT.step);
          for (let k = 1; k < n; k += 1) { _g.copy(last.point).lerp(one.point, k / n); twigs.push(_g.x, _g.y, _g.z); }
        }
        twigs.push(one.point.x, one.point.y, one.point.z);
        if (last && one.end) {
          _t.subVectors(one.point, last.point);
          const n = Math.max(1, Math.floor(_t.length() / SIGHT.step));
          for (let k = 1; k <= n; k += 1) { _g.copy(one.point).addScaledVector(_t, k / n); twigs.push(_g.x, _g.y, _g.z); }
        }
      });
    }
    plant.twigs = new Float32Array(twigs);
    onWalk(plant.s, _w);
    for (const one of plant.places) {
      middle(one, _p);
      const off = Math.hypot(_p.x - _w.x, _p.z - _w.z);
      let seen = 0, tries = 0;
      for (const far of SIGHT.far) for (const way of [-1, 1]) {
        const s = Math.min(length, Math.max(0, plant.s + way * Math.sqrt(Math.max(0, far * far - off * off))));
        onWalk(s, _t); _t.y += SIGHT.eye;
        tries += 1;
        if (!hidden(_p, _t, plant.twigs)) seen += 1;
      }
      one.open = seen / tries;
    }
    return plant;
  };
  // whether the line from an eye to a place has no twig on it, over the part a close-up draws
  // (the twigs first: working them out the first time uses the scratch the bird's middle is put in)
  const clear = (one, eye) => { const twigs = sight(one.plant).twigs; return !hidden(middle(one, _p), eye, twigs); };
  return { plants, near, kinds, sight, clear, all: !!source.perchKinds };
}

// a bird's middle, on a place: on top of the twig, a few centimetres up
const middle = (one, into) => { into.copy(one.point); into.y += one.radius * 0.96 + 0.04; return into; };

// Where a spot is from the walk, and the walk's own point at a distance along it, for a habitat (which has `beside`,
// the walk's own places, and its length) or a world (which has the trail).
function locator(source) {
  if (source.trail && source.trail.locate) return { locate: (x, z) => source.trail.locate(x, z), onWalk: (s, into) => { source.trail.sample(s, into, _g); return into; } };
  const n = Math.ceil(source.length), xs = new Float32Array(n), zs = new Float32Array(n);
  for (let s = 0; s < n; s += 1) { source.beside(s, 0, _t); xs[s] = _t.x; zs[s] = _t.z; }
  return {
    locate: (x, z) => {
      let best = Infinity, at = 0;
      for (let s = 0; s < n; s += 1) { const d = (xs[s] - x) * (xs[s] - x) + (zs[s] - z) * (zs[s] - z); if (d < best) { best = d; at = s; } }
      return [Math.sqrt(best), at];
    },
    onWalk: (s, into) => source.beside(Math.min(n - 1, Math.max(0, s)), 0, into),
  };
}
