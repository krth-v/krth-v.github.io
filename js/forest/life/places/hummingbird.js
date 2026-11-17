import * as THREE from 'three';
import { standing, onLimb } from '../perch.js';
import { inCrown } from './aerial2.js';

// Where a hummingbird finds what it lives on: the flowers out along the walk in the middle of May, the bare twigs
// at the tops of the shrubs it watches them from, and, for a male with a female in his thicket, the open air over it
// that his display dive needs (life/families/hoverer.js).
//
// What is in flower. Salmonberry (BirdWeb: in Washington the Rufous Hummingbird "feeds heavily on red flowering
// currant, salmonberry"; plants/shrubs.js paints it in flower in May), the old apple tree of the clearing (in blossom,
// plants/apple.js) and red elderberry (in flower in May, plants/shrubs.js). Which of them a hummingbird takes nectar
// from and which only insects is the agent's reading, not a source's: salmonberry nectar; the apple's blossom; at the
// elderberry's open heads, small insects. Each is named here by its kind, since what is in flower is the plant's
// botany and not its shape.
//
// Where they are read from. Every plant hands over its perch (plants/build.js): a shrub its `sprigs` (three places
// along each cane, at 0.45, 0.7 and 0.95 of its length for salmonberry and elderberry, each a point and the way the
// cane runs there, in the plant's own space at scale 1: plants/shrubs.js `sprigsOf`), a tree its limbs. A shrub's
// stems are painted on cards and are no wood, so the habitat reads nothing of it unless it hands over the kinds it
// read (`habitat.perchKinds`: every kind that has a perch, with its records; the thicket agent's seam of 2026-11-16,
// read here the same way). Without it only the apple is found (through `habitat.leafy`), and few visits have a
// hummingbird's home.
//
// A flower is a place and the way out from it: where the bird holds the tip of its bill, and the way it hovers off
// from. On a shrub: out at the ends of the sprays that hang from the outer part of each cane (each spray goes out and
// down from its cane, turned a little from the cane's own way: plants/shrubs.js `arching`), so that a bird at one is
// outside the shrub's leaves; on the apple, beyond the end of each limb and lesser branch, where the twigs and their
// blossom are. The agent's own: every distance here, and which places are taken.

export const FLOWERS = {
  salmon: { worth: 1, doing: 'hovering at a salmonberry flower, sipping its nectar' },
  apple: { worth: 0.6, doing: 'hovering at the old apple tree\'s blossom' },
  elder: { worth: 0.3, doing: 'hovering at the elderberry\'s flowers, picking small insects from them' },
};
const REACH = 16;                 // metres from the walk within which a plant in flower is read
const CELL = 8;                   // the plants are kept in squares this wide
const SPRAY = 0.75;               // how far out from its cane a spray's end is, seen from above (m, at the plant's scale 1)
const DROP = 0.32;                // and how far below where it leaves the cane
const TWIG = 0.004;               // the girth of the twig a hummingbird perches on (a radius, m): its feet are tiny
const PER = 3;                    // the places along each cane that the shrubs hand over (plants/shrubs.js)
const UP = new THREE.Vector3(0, 1, 0);
const made = new WeakMap();       // a habitat's flowers, read the first time they are asked for
// a number from 0 to 1 that a place always has (no random number is drawn for it)
const hash = (a, b, c) => { const h = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return h - Math.floor(h); };

// The plants in flower near the walk, for a habitat: { plants: [{ kind, x, z, foot, off, s, flowers, tops, low,
// reach }], near(x, z, reach), all }.
export function bloomOf(habitat) {
  if (made.has(habitat)) return made.get(habitat);
  const bloom = build(habitat);
  made.set(habitat, bloom);
  return bloom;
}

function build(habitat) {
  const locate = locator(habitat), plants = [];
  const _p = new THREE.Vector3(), _d = new THREE.Vector3(), out = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() };
  const plantAt = (kind, place) => {
    const x = place.foot.x, z = place.foot.z, [off, s] = locate(x, z);
    if (off > REACH || habitat.ground(x, z) === 'water') return null;
    return { kind, x, z, foot: place.foot.y, off, s, flowers: [], tops: [], low: [], reach: 0, scale: place.scale };
  };
  // a shrub: each cane's places, from its root outwards
  const shrub = (plant, place, sprigs) => {
    const per = sprigs.length % PER === 0 ? PER : 1, worth = FLOWERS[plant.kind].worth;
    for (let c = 0; c < sprigs.length; c += per) {
      let top = null;
      for (let k = 0; k < per; k += 1) {
        const sprig = sprigs[c + k];
        _p.set(sprig[0], sprig[1], sprig[2]).applyMatrix4(place.matrix);
        _d.set(sprig[3], sprig[4], sprig[5]).applyQuaternion(place.yaw);
        if (_d.lengthSq() < 1e-8) _d.set(1, 0, 0);
        _d.normalize();
        const above = _p.y - habitat.height(_p.x, _p.z);
        const away = new THREE.Vector3(_p.x - plant.x, 0, _p.z - plant.z);
        if (away.lengthSq() < 1e-4) away.set(_d.x, 0, _d.z);
        if (away.lengthSq() < 1e-8) away.set(1, 0, 0);
        away.normalize();
        plant.reach = Math.max(plant.reach, Math.hypot(_p.x - plant.x, _p.z - plant.z) + SPRAY * place.scale);
        // the flowers: at the ends of the sprays on the outer part of the cane, two to each place, turned either way
        if (k >= 1 && above > 0.6) {
          for (const hand of [-1, 1]) {
            const turn = hand * (0.3 + 0.6 * hash(_p.x, _p.z, hand)), go = away.clone().applyAxisAngle(UP, turn);
            const at = _p.clone().addScaledVector(go, SPRAY * place.scale * (0.8 + 0.3 * hash(_p.z, _p.x, k))).addScaledVector(UP, -DROP * place.scale * (0.7 + 0.6 * hash(_p.y, hand, _p.x)));
            if (at.y - habitat.height(at.x, at.z) < 0.35) continue;
            plant.flowers.push({ at, out: go.clone().addScaledVector(UP, 0.15).normalize(), plant, worth });
          }
        }
        // a bare twig on the outer part of a cane, short of its free end (which swings in the wind: a bird on it
        // would hang in the air), on top of it; the highest of them is the shrub's top
        if (k === per - 2 || per === 1) {
          if (!top || _p.y > top.point.y) top = { point: _p.clone().addScaledVector(UP, TWIG * 0.96), along: _d.clone(), out: away.clone(), radius: TWIG, plant, kind: 'twig' };
        }
        // low and inside, where a female sits unseen in the thicket: a cane's first place, under 1.8 m
        if (k === 0 && per > 1 && above > 0.3 && above < 1.8) plant.low.push({ point: _p.clone(), out: away.clone() });
      }
      if (top) plant.tops.push(top);
    }
    // the shrub's tops: its two highest twigs
    plant.tops.sort((a, b) => b.point.y - a.point.y);
    plant.tops.length = Math.min(plant.tops.length, 2);
  };
  // a tree in blossom: beyond the end of each limb and lesser branch, out from the crown's middle
  const tree = (plant, place, limbs) => {
    const tips = [];
    for (const tube of limbs.tubes) {
      onLimb(place, limbs, tube, 0.999, out);
      tips.push({ point: out.point.clone(), along: out.along.clone() });
    }
    if (!tips.length) return;
    const middle = new THREE.Vector3();
    for (const tip of tips) middle.add(tip.point);
    middle.divideScalar(tips.length);
    for (const tip of tips) {
      const above = tip.point.y - habitat.height(tip.point.x, tip.point.z);
      if (above < 1 || above > 6) continue;
      const away = new THREE.Vector3(tip.point.x - middle.x, 0, tip.point.z - middle.z);
      if (away.lengthSq() < 1e-4) away.set(tip.along.x, 0, tip.along.z);
      if (away.lengthSq() < 1e-8) continue;
      away.normalize();
      const at = tip.point.clone().addScaledVector(away, 0.3);
      if (plant.flowers.some((f) => f.at.distanceTo(at) < 0.35)) continue;
      plant.flowers.push({ at, out: away.clone().addScaledVector(UP, 0.15).normalize(), plant, worth: FLOWERS[plant.kind].worth });
      plant.reach = Math.max(plant.reach, Math.hypot(at.x - plant.x, at.z - plant.z));
    }
    // its perches: the upper side of a limb a little short of its end, between 2 and 5 m up
    for (const tube of limbs.tubes) {
      const radius = onLimb(place, limbs, tube, 0.8, out), above = out.point.y - habitat.height(out.point.x, out.point.z);
      if (above >= 2 && above <= 5 && radius > 0.004 && radius < 0.04) plant.tops.push({ point: out.point.clone(), along: out.along.clone(), radius, plant, kind: 'limb' });
    }
    plant.tops.sort((a, b) => b.point.y - a.point.y);
    plant.tops.length = Math.min(plant.tops.length, 4);
  };
  if (habitat.perchKinds) {
    for (const { name, perch, records } of habitat.perchKinds) {
      if (!FLOWERS[name] || !records) continue;
      for (let i = 0; i < records.length / 8; i += 1) {
        const place = standing(perch, records, i), plant = plantAt(name, place);
        if (!plant) continue;
        if (perch.sprigs && perch.sprigs.length) shrub(plant, place, perch.sprigs);
        else if (perch.limbs) tree(plant, place, perch.limbs);
        if (plant.flowers.length) plants.push(plant);
      }
    }
  } else {
    for (const one of habitat.leafy || []) {
      if (!FLOWERS[one.kind]) continue;
      const plant = plantAt(one.kind, one.place);
      if (!plant) continue;
      tree(plant, one.place, one.limbs);
      if (plant.flowers.length) plants.push(plant);
    }
  }
  const cells = new Map(), key = (i, j) => i * 4096 + j;
  for (const plant of plants) {
    const k = key(Math.floor(plant.x / CELL), Math.floor(plant.z / CELL));
    if (!cells.has(k)) cells.set(k, []);
    cells.get(k).push(plant);
  }
  // the plants whose foot is within `reach` of a spot, seen from above
  const near = (x, z, reach) => {
    const list = [];
    for (let i = Math.floor((x - reach) / CELL); i <= Math.floor((x + reach) / CELL); i += 1) for (let j = Math.floor((z - reach) / CELL); j <= Math.floor((z + reach) / CELL); j += 1) {
      const some = cells.get(key(i, j));
      if (some) for (const plant of some) if (Math.hypot(plant.x - x, plant.z - z) <= reach) list.push(plant);
    }
    return list;
  };
  return { plants, near, all: !!habitat.perchKinds };
}

// Where a spot is from the walk: [metres off its middle line, metres along it], from the walk's own places a metre
// apart (the habitat has `beside` and the walk's length, and not the trail itself).
function locator(habitat) {
  const n = Math.ceil(habitat.length), xs = new Float32Array(n), zs = new Float32Array(n), at = new THREE.Vector3();
  for (let s = 0; s < n; s += 1) { habitat.beside(s, 0, at); xs[s] = at.x; zs[s] = at.z; }
  return (x, z) => {
    let best = Infinity, s = 0;
    for (let i = 0; i < n; i += 1) { const d = (xs[i] - x) * (xs[i] - x) + (zs[i] - z) * (zs[i] - z); if (d < best) { best = d; s = i; } }
    return [Math.sqrt(best), s];
  };
}

// A male's display before a female in his thicket (Myers, Rankin, Burns and Clark 2019, The Auk 136: ukz049, their
// Table 1 and Figure 1, for the Rufous Hummingbird): a shuttle "within 1-2 m of female", and dives in a J, "~20 m high,
// 15 m wide", whose bottom passes her. She is not built (a female is another sheet, and so another kind): she is a
// place low in a salmonberry, and the dive passes it. The lines he flies are these, and life/families/hoverer.js
// flies them from here, so that what is tried below is what is flown: the J from its top to its bottom (a quarter of
// an ellipse: straight down at the top, level at the bottom), the short rise out of it (the hook), and the climb back
// to the J's top, a little out of its plane, so that he does not climb the line he dives.
export const diveAt = (bottom, u, high, wide, t, out) => { const phi = (t * Math.PI) / 2; return out.copy(bottom).addScaledVector(u, -wide * Math.cos(phi)).addScaledVector(UP, high * (1 - Math.sin(phi))); };
export const hookAt = (bottom, u, t, out) => out.copy(bottom).addScaledVector(u, 3.5 * t).addScaledVector(UP, 2.5 * t * t);
const _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
export const climbAt = (from, top, u, high, wide, t, out) => {
  const s = 1 - t;
  _p1.copy(from).addScaledVector(UP, high * 0.45).addScaledVector(u, -wide * 0.1); _p2.copy(top).addScaledVector(UP, -high * 0.3).addScaledVector(u, wide * 0.3);
  out.set(0, 0, 0).addScaledVector(from, s * s * s).addScaledVector(_p1, 3 * s * s * t).addScaledVector(_p2, 3 * s * t * t).addScaledVector(top, t * t * t);
  out.x += u.z * 1.2 * Math.sin(Math.PI * t); out.z -= u.x * 1.2 * Math.sin(Math.PI * t);
  return out;
};
const FLOWER_ROOM = 0.8;          // m: no flower nearer than this to where he shuttles, bottoms out and pulls up (another hovers at one, and backs off from it up to 0.45 m)
// a stream of random numbers from one number (a stage is looked for with numbers of its own: however many places are
// tried, one of the visit's own is drawn)
const prng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Where the display is: a cane's low place in a salmonberry of the territory (`at`), the bottom of the J (`bottom`)
// out from it beyond the shrub's leaves, the way along the bottom (`u`, level, across the way out from the shrub) and
// how high the J is (`high`, within the kind's range), for which every line he flies is in open air: the dive, the
// hook, and the climb from the bottom and from the hook's end, each tried every two thirds of a metre or so, as it
// will be flown. Open air: the land's own `open` at least 0.45 under the point, 0.6 m and more above the ground, among no tree's
// limbs (life/places/aerial2.js `inCrown`) and in no shrub of the territory, and no trunk between one point and the
// next. (Until 2026-11-16 only the J was tried, by the land's `open` and two straight lines for trunks, at
// the greatest height alone: of 25 stages found over 150 visits, 24 had a dive, a hook or a climb through a crown,
// the old apple's and the maples' among them.) And no flower of the territory is within FLOWER_ROOM of the shuttle,
// the J's last metres or the hook, where another hummingbird may be hovering: the bottom is set further out from the
// shrub until none is (the count of walks found two 0.118 m apart, one pulling out of its dive through the place
// where the other hovered at a flower). Null where there is none: a territory under the old terrace's trees has no
// air for a dive, and its male does not display.
export function stage(habitat, plants, r, { high, wide }) {
  const rr = prng(Math.floor(r() * 4294967296));
  const spots = [], flowers = [];
  for (const plant of plants) { flowers.push(...plant.flowers); if (plant.kind === 'salmon') for (const low of plant.low) spots.push({ low, plant }); }
  // (the places in an order of their own, twelve of them at the most)
  const order = spots.map((spot) => [rr(), spot]).sort((a, b) => a[0] - b[0]).slice(0, 12);
  const at = new THREE.Vector3(), prev = new THREE.Vector3(), from = new THREE.Vector3(), top = new THREE.Vector3(), u = new THREE.Vector3();
  // (in a shrub of the territory: within its reach of its foot, and no higher than a hand over its top twigs)
  const inShrub = (p) => plants.some((plant) => plant.kind !== 'apple' && plant.tops.length && p.y < plant.tops[0].point.y + 0.4 && Math.hypot(p.x - plant.x, p.z - plant.z) < plant.reach + 0.15);
  const airy = (p) => habitat.open(p.x, p.z) >= 0.45 && p.y > habitat.height(p.x, p.z) + 0.6 && !inCrown(habitat, p) && !inShrub(p);
  // a line of `n` steps, each point in open air and no trunk between it and the one before
  const clear = (n, line) => {
    for (let i = 0; i <= n; i += 1) {
      line(i / n, at);
      if (!airy(at) || (i > 0 && habitat.blocked(prev, at))) return false;
      prev.copy(at);
    }
    return true;
  };
  const crowded = (p) => flowers.some((flower) => flower.at.distanceToSquared(p) < FLOWER_ROOM * FLOWER_ROOM);
  for (const [, { low, plant }] of order) {
    const inside = Math.hypot(low.point.x - plant.x, low.point.z - plant.z);
    for (const further of [0.35, 0.8, 1.3]) {
      const bottom = low.point.clone().addScaledVector(low.out, Math.max(0.8, plant.reach - inside + further));
      bottom.y = Math.max(bottom.y + 0.3, habitat.height(bottom.x, bottom.z) + 0.9);
      for (const side of rr() < 0.5 ? [1, -1] : [-1, 1]) {
        u.set(-low.out.z * side, 0, low.out.x * side);
        // where he shuttles, bottoms out and pulls up: no flower near
        let room = true;
        for (const k of [-0.6, -0.3, 0, 0.3, 0.6]) room = room && !crowded(at.copy(bottom).addScaledVector(u, k));
        for (let i = 1; i <= 8 && room; i += 1) room = !crowded(hookAt(bottom, u, i / 8, at));
        if (!room) continue;
        const tall = high[0] + rr() * (high[1] - high[0]);
        for (let i = 0; i < 4 && room; i += 1) room = !crowded(diveAt(bottom, u, tall, wide, 1 - i * 0.03, at));
        if (!room) continue;
        diveAt(bottom, u, tall, wide, 0, top);
        if (!clear(40, (t, out) => diveAt(bottom, u, tall, wide, t, out)) || !clear(8, (t, out) => hookAt(bottom, u, t, out))) continue;
        if (!clear(40, (t, out) => climbAt(bottom, top, u, tall, wide, t, out))) continue;
        hookAt(bottom, u, 1, from);
        if (!clear(40, (t, out) => climbAt(from, top, u, tall, wide, t, out))) continue;
        return { at: low.point.clone(), out: low.out.clone(), bottom, u: u.clone(), high: tall, plant };
      }
    }
  }
  return null;
}

// A territory: the plants in flower within `range` of a salmonberry or the apple near the walk (`homeOff`), with
// `need` flowers among them at the least, no nearer than `apart` to another of its kind's; its perches (the twigs at
// the shrubs' tops, and boughs of the trees round it from 1.5 to 7 m up); and, with the chance `display.chance`, a
// female in its thicket and room for the dive. What two hummingbirds of one party share (life/visit.js gives both the
// one home): which of them holds it (`holder`, life/families/hoverer.js).
export function territory(habitat, way, r, taken = []) {
  const bloom = bloomOf(habitat);
  const seeds = bloom.plants.filter((plant) => plant.off < way.homeOff && FLOWERS[plant.kind].worth >= 0.5);
  for (let tries = 0; tries < 24 && seeds.length; tries += 1) {
    const seed = seeds[Math.floor(r() * seeds.length)];
    if (taken.some((home) => home && Math.hypot(home.x - seed.x, home.z - seed.z) < way.apart)) continue;
    const members = bloom.near(seed.x, seed.z, way.range), flowers = [];
    for (const plant of members) flowers.push(...plant.flowers);
    if (flowers.length < way.need) continue;
    const perches = [], boughs = [];
    for (const plant of members) perches.push(...plant.tops);
    for (const bough of habitat.boughsNear(seed.x, seed.z, way.range)) {
      if (bough.above >= 1.5 && bough.above <= 7 && bough.radius < 0.05) boughs.push({ point: bough.point.clone(), along: bough.along.clone(), radius: bough.radius, kind: 'bough', d: Math.hypot(bough.point.x - seed.x, bough.point.z - seed.z) });
    }
    // (the nearest forty boughs: a stand of young hemlocks has hundreds)
    boughs.sort((a, b) => a.d - b.d);
    perches.push(...boughs.slice(0, 40));
    if (perches.length < 2) continue;
    const female = r() < way.display.chance ? stage(habitat, members, r, { high: way.display.high, wide: way.display.wide }) : null;
    return { x: seed.x, z: seed.z, flowers, perches, female, holder: null };
  }
  return null;
}
