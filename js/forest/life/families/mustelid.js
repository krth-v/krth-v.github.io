import * as THREE from 'three';
import { frame, UP, pace, spot } from '../agents.js';
import { live } from '../behave.js';
import { nums, oneOf } from '../bodies.js';
import { onTrunk } from '../perch.js';
import { river, SHAPE } from '../../world/land.js';
import { mulberry32 } from '../../world/layout.js';

// The weasel family (mustelids, 2026-11-16): the river otter (life/species/riverOtter.js), the fisher
// (pacificFisher.js) and the striped skunk (stripedSkunk.js), on the shared skeleton (life/behave.js), each kind
// with its own way of taking the walker (`react`) and of going and coming, on foot or in the water (`leave`, `come`).
// Their bodies are posed by life/parts/longRig.js, from the beast rig's pose fields and its own (`swim`, `dig`,
// `rear`, `arch`).
//   The otter, on the river near the walk, alone or a mother and her young together: it swims at the surface,
//   dives to forage along the bottom (under the water it is out of sight: `cover`), comes up to look about with its
//   head and neck out, hauls out on a bar to groom, bounds along the cobbles and slides back in. A walker it sees it
//   watches, head up; one who comes on it dives from and comes up further off, or goes for good, under the water.
//   The fisher, in the deep wood: it bounds over the floor and along the logs, goes up a big trunk and comes down it
//   head first; it is never long in sight. Seeing the walker it stops for a moment to look, and is gone, bounding.
//   The skunk, from dusk, on the floor and the clearing's edge: it waddles nose down and digs for grubs. A walker
//   who comes near gets its warning (it turns to face them, raises its tail, arches its back and stamps its
//   forefeet, lurching), and one who comes nearer it waddles away from, the tail still up. It does not run.
// From sources (each kind's file says which): the otter's swimming, diving, hauling out, rolling and grooming, its
// bounding and sliding; the fisher's bounding and climbing, head first down a trunk; the skunk's night foraging,
// digging with its long front claws, and its warning. The agent's own: every distance, time, pace and chance here,
// how each takes the walker, and where each lives on a visit.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x));
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n = new THREE.Vector3(), _r = [0, false, 0, 0, 0], _s = spot();
const _fa = new THREE.Vector3(), _fb = new THREE.Vector3(), _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3(), _p2 = new THREE.Vector3();
const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _A = [0, 0, 0, 0], _B = [0, 0, 0, 0], _near = [];
// (what `room` last found: the nearest of the others much bigger than the body, an elk's or a bear's, and how far)
let roomBig = null, roomBigGap = Infinity;
// (set only round an otter's own step as it wrestles, null otherwise: its partner, whose body `room` still holds it
// away from, but by whom it does not ask whether another animal is about to land beside it, which is the ring's own
// business: the two lie a hand's breadth and more apart)
let exempt = null;

// ---- room: how far a body, at `at` and facing as `q` says, would be from the nearest other animal, seen from above,
// measured as the visit measures two animals (life/visit.js `apart`): a body is the line from its rump to its head (0.85
// of its half length either side of where it is, along the way it faces) with its width round that line; a bird is a
// point, and one more than a quarter of a metre above the body's back does not count, nor one on the wing; but where
// one is about to land does (the visit's own `free`, round the whole body: within that, another animal makes it as if
// too near). Below nothing, the two are in one another. `list`: the others near, if they are known already.
// Every step a weasel takes, on foot, in the water or under it, onto a log or the bark, or turning where it is, leaves
// at least ROOM, or where something else has come nearer than that, no less than there was (`keep`, below).
const ROOM = 0.08;                                     // m
const REACH = 5;                                       // m: as far as another's middle can be with its body still near (an elk's)
const SIDESTEP = [0, 0.4, -0.4, 0.8, -0.8, 1.3, -1.3]; // radians: the turns a swimmer tries, in turn, round another in its way
const flatOf = (q, out) => { out.set(1, 0, 0).applyQuaternion(q).setY(0); if (out.lengthSq() < 1e-8) out.set(1, 0, 0); else out.normalize(); return out; };
const toSeg = (px, pz, S) => { const dx = S[2] - S[0], dz = S[3] - S[1], l2 = dx * dx + dz * dz, t = l2 > 1e-9 ? clamp(((px - S[0]) * dx + (pz - S[1]) * dz) / l2, 0, 1) : 0; return Math.hypot(px - S[0] - dx * t, pz - S[1] - dz * t); };
const turnOf = (ax, az, bx, bz, cx, cz) => Math.sign((bx - ax) * (cz - az) - (bz - az) * (cx - ax));
const crosses = (S, T) => turnOf(S[0], S[1], S[2], S[3], T[0], T[1]) !== turnOf(S[0], S[1], S[2], S[3], T[2], T[3]) && turnOf(T[0], T[1], T[2], T[3], S[0], S[1]) !== turnOf(T[0], T[1], T[2], T[3], S[2], S[3]);
const segments = (S, T) => (crosses(S, T) ? 0 : Math.min(toSeg(S[0], S[1], T), toSeg(S[2], S[3], T), toSeg(T[0], T[1], S), toSeg(T[2], T[3], S)));
function room(bird, world, at, q, list = world.others(at.x, at.z, REACH, bird, _near)) {
  const body = bird.body, half = body.long * 0.85, back = at.y + body.high;
  flatOf(q, _fa);
  _A[0] = at.x - _fa.x * half; _A[1] = at.z - _fa.z * half; _A[2] = at.x + _fa.x * half; _A[3] = at.z + _fa.z * half;
  let least = Infinity;
  roomBig = null; roomBigGap = Infinity;
  for (const b of list) {
    if (b.state === 'fly') continue;
    let g = Infinity;
    if (b.body) {
      flatOf(b.q, _fb);
      const l = b.body.long * 0.85;
      _B[0] = b.at.x - _fb.x * l; _B[1] = b.at.z - _fb.z * l; _B[2] = b.at.x + _fb.x * l; _B[3] = b.at.z + _fb.z * l;
      g = segments(_A, _B) - body.wide - b.body.wide;
      if (b.body.long >= body.long * 1.6 && g < roomBigGap) { roomBigGap = g; roomBig = b; }
    } else if (b.at.y <= back + 0.25) g = toSeg(b.at.x, b.at.z, _A) - body.wide;
    least = Math.min(least, g);
  }
  if (least < ROOM) return least;
  // (none on its way to land on it)
  if (!exempt && !world.free(_p2.set(at.x, at.y + body.high * 0.5, at.z), bird, half + body.wide + ROOM)) return ROOM * 0.99;
  return least;
}
// every field the rig reads, as it stands (the plan's neutral pose has none: life/bodies.js)
const NEUTRAL = () => ({ walk: 0, trot: 0, gallop: 0, swim: 0, dig: 0, rear: 0, stamp: 0, arch: 0, lie: 0, tail: 0, high: 0, jaw: 0, ears: 0.2,
  neck: 0.6, head: { yaw: 0, pitch: 0 }, ground: [0, 0, 0, 0] });

// ---- the river: its middle line `down` metres down it, `across` metres to one side; the water's height and how far
// a spot is from the water's edge (negative in the water)
function riverPoint(down, across, out) {
  const R = SHAPE.RIVER, A = SHAPE.riverAlong;
  let i = 0;
  while (i < A.length - 2 && A[i + 1] < down) i += 1;
  const t = clamp((down - A[i]) / ((A[i + 1] - A[i]) || 1), 0, 1), ux = R[i + 1][0] - R[i][0], uz = R[i + 1][1] - R[i][1], l = Math.hypot(ux, uz) || 1;
  return out.set(R[i][0] + ux * t - (uz / l) * across, 0, R[i][1] + uz * t + (ux / l) * across);
}
const water = (x, z) => river(x, z, _r)[2];
const edge = (x, z) => river(x, z, _r)[0];

// ---- where each lives on a visit
// The otter's (2026-11-19): the stretch of the river the walk comes down beside, the beach under the clearing and the
// bend below it (425 to 450 m down the river, where the trail comes within 9 to 20 m of the river's middle; the far
// bar there is 5 to 8 m wide, 15 to 22 m from the trail), with the places on its bars where it can haul out (the
// creek's mouth among them, a fan of cobbles on our side), and the banks it slides down (where the ground rises half
// a metre within four metres of the water). `game`, a party's own, is what two of it are playing at (below). Its own
// random numbers, seeded by one of the visit's.
function otterHome(habitat, r) {
  const own = mulberry32(Math.floor(r() * 4294967296)), o = [0, false, 0, 0, 0];
  const centre = 425 + own() * 25, reach = 28, hauls = [], slides = [];
  for (let down = centre - reach; down <= centre + reach; down += 2) {
    for (const side of [-1, 1]) {
      riverPoint(down, side * SHAPE.HALF, _v);
      const bar = river(_v.x, _v.z, o)[3];
      riverPoint(down, side * (SHAPE.HALF + 0.5 + own() * clamp(bar - 0.8, 0.4, 4.5)), _v);
      const from = edge(_v.x, _v.z);
      if (from > 0.3 && from < 5 && habitat.walkable(_v.x, _v.z, 0.3)) hauls.push({ x: _v.x, z: _v.z, down, side, off: null, taken: null });
      // a bank to slide down: the first spot back from the water that stands half a metre over it, every third pace
      if (Math.round(down) % 3) continue;
      for (let back = 0.8; back <= 4.4; back += 0.4) {
        riverPoint(down, side * (SHAPE.HALF + back), _w);
        const over = habitat.height(_w.x, _w.z) - river(_w.x, _w.z, o)[2];
        if (over < 0.45) continue;
        if (habitat.walkable(_w.x, _w.z, 0.3) && edge(_w.x, _w.z) > 0.4) slides.push({ x: _w.x, z: _w.z, down, side, over, off: null, taken: null });
        break;
      }
    }
  }
  return { manner: 'otter', centre, reach, hauls, slides, game: null };
}
function fisherHome(habitat, r, taken) {
  // a big trunk in the wood, 8 to 40 m from the walk, with logs near it: what it climbs and runs along
  const trunks = habitat.trunks.filter((t) => t.off > 8 && t.off < 40 && t.girth > 0.3);
  for (let tries = 0; tries < 30 && trunks.length; tries += 1) {
    const t = trunks[Math.floor(r() * trunks.length)];
    if (taken.some((h) => Math.hypot(h.x - t.foot.x, h.z - t.foot.z) < 60)) continue;
    const logs = habitat.logs.filter((l) => Math.hypot(l.x - t.foot.x, l.z - t.foot.z) < 28);
    const climbs = trunks.filter((o) => Math.hypot(o.foot.x - t.foot.x, o.foot.z - t.foot.z) < 30);
    return { manner: 'fisher', x: t.foot.x, z: t.foot.z, reach: 26, logs, climbs };
  }
  return null;
}
function skunkHome(habitat, r, taken) {
  // somewhere on the floor by a trunk 6 to 30 m from the walk, where an animal can walk
  const trunks = habitat.trunks.filter((t) => t.off > 6 && t.off < 30);
  for (let tries = 0; tries < 40 && trunks.length; tries += 1) {
    const t = trunks[Math.floor(r() * trunks.length)], ang = r() * 6.283, d = t.girth + 1.5 + r() * 3;
    const x = t.foot.x + Math.cos(ang) * d, z = t.foot.z + Math.sin(ang) * d;
    if (!habitat.walkable(x, z, 0.6) || taken.some((h) => Math.hypot(h.x - x, h.z - z) < 50)) continue;
    return { manner: 'skunk', x, z, reach: 14 };
  }
  return null;
}

function mustelid(a) {
  const { bird, world, way, r } = a, home = bird.home, manner = way.manner;
  const long = bird.sheet.shape.long, strides = { walk: long.strides.walk, gallop: long.strides.bound };
  const [walkPace, runPace, swimPace] = way.pace, [watchAt, shyAt, fleeAt] = way.wary;
  // Who an otter is, decided once for the visit (kept from one coming to the next), 2026-11-19: of a party of three a
  // mother and two of last year's young, still with her in May; of two, that or a pair; one alone, an adult. Its size
  // against the sheet's (the sheet is an adult male's), and its body's with it. (The bear's way: life/families/bear.js.)
  if (manner === 'otter' && bird.who && bird.who.party) {
    const one = bird.who, party = one.party, i = Math.max(0, party.members.indexOf(one)), n = party.members.length;
    if (party.family === undefined) party.family = n > 2 || (n === 2 && r() < 0.5);
    if (one.scale == null) one.scale = !party.family ? (n === 2 && i === 1 ? 0.88 + r() * 0.07 : 0.94 + r() * 0.12) : i === 0 ? 0.88 + r() * 0.07 : 0.72 + r() * 0.1;
    one.young = !!party.family && i > 0;
    bird.scale = one.scale;
    bird.body = { high: bird.body.high * bird.scale, long: bird.body.long * bird.scale, wide: bird.body.wide * bird.scale };
    bird.size *= bird.scale;
  }
  const sink = bird.body.high - 0.035;                 // how far under the water's top its origin lies as it swims
  let cyc = r() * 10, heading = r() * 6.283, cool = 0, warned = 0, stuck = false;
  const to = new THREE.Vector3(), from = new THREE.Vector3();
  // (the otter's own, kept across its activities: whether it has a fish, how many more things it does on the bar
  // before it goes back in, how many more times it slides down the bank it is at, whether it is to come out again
  // somewhere away from the walker, and the counts the rig takes as they only grow: `beat`, `rake`)
  let fish = false, ashore = 0, again = 0, outAgain = false, beat = r() * 10, rake = 0;

  const flat = (p) => Math.hypot(p.x - world.eye.x, p.z - world.eye.z);
  const near = () => flat(bird.at) / pace(world);      // the walker's distance, as one at a stroll would be
  const sudden = () => world.walker && world.walker.sudden > 0;
  const face = (up = UP) => frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), up, bird.q);
  const steer = (x, z, rate, dt) => { const d = wrap(Math.atan2(z - bird.at.z, x - bird.at.x) - heading), most = rate * dt; heading += clamp(d, -most, most); return Math.abs(d); };
  const watch = (k = 1) => {                            // the head turned to the walker
    const d = wrap(Math.atan2(world.eye.z - bird.at.z, world.eye.x - bird.at.x) - heading);
    bird.want.head = { yaw: clamp(d, -1.5, 1.5) * k, pitch: 0.12 * k };
  };
  // (an otter's every pose names `roll` and the counts that only grow, which the plan's neutral pose leaves out: left
  // unnamed, a roll onto its back would be kept into the next activity, and a count eased back to nothing run backwards)
  const pose = (extra) => ({ ...NEUTRAL(), cycle: cyc, ...(manner === 'otter' ? { roll: 0, beat, rake, scale: bird.scale || 1 } : null), ...extra });
  // a hop to a place it cannot walk to (up onto a log, onto the bark, down off either), in a short arc; true while hopping
  const hopping = (n, dt) => {
    const h = n.hop; if (!h) return false;
    h.t = Math.min(1, h.t + dt / h.dur);
    bird.at.lerpVectors(h.from, h.to, h.t); bird.at.y += 0.15 * Math.sin(Math.PI * h.t);
    Object.assign(bird.want, { gallop: 1, walk: 0 }); cyc += dt * 2.5; bird.want.cycle = cyc;
    if (h.t >= 1) n.hop = null;
    return true;
  };
  // (false, and no hop, where another animal is on the spot or about to land there)
  const hop = (n, at) => {
    if (!world.free(at, bird, bird.body.wide + ROOM + 0.05)) return false;
    n.hop = { from: bird.at.clone(), to: at.clone(), t: 0, dur: clamp(bird.at.distanceTo(at) / 3.5, 0.15, 0.4) };
    return true;
  };
  const ground = () => { bird.at.y = world.height(bird.at.x, bird.at.z); };
  // facing the way `hd` says, level (as `face` sets it), into `q`
  const facing = (hd, q) => frame(_n.set(Math.cos(hd), 0, Math.sin(hd)), UP, q);
  // its room (above) there, facing so: through the others near it, found once a frame (`keep`, below), while it steps
  const by = [];
  let known = false;
  const roomAt = (at, q) => room(bird, world, at, q, known ? by : undefined);
  // would its body there, facing so, keep its room: ROOM or more, or no less than it has now
  const roomy = (at, q) => { const g = roomAt(at, q); return g >= ROOM || g >= roomAt(bird.at, bird.q) - 1e-6; };
  // a step on foot along the heading; false (and no step) where it cannot walk, or would come too near another
  const stepOn = (speed, dt, gait = null) => {
    const nx = bird.at.x + Math.cos(heading) * speed * dt, nz = bird.at.z + Math.sin(heading) * speed * dt;
    if (speed > 0 && (!world.walkable(nx, nz, 0.2) || !roomy(_p1.set(nx, world.height(nx, nz), nz), facing(heading, _q1)))) { Object.assign(bird.want, { walk: 0, gallop: 0 }); return false; }
    bird.at.x = nx; bird.at.z = nz; ground(); face();
    const bound = gait === 'walk' ? 0 : gait === 'bound' ? 1 : clamp((speed - walkPace * 1.2) / (walkPace * 0.8), 0, 1);
    cyc += (speed * dt) / ((bound > 0.5 ? strides.gallop : strides.walk) * (bird.scale || 1));
    Object.assign(bird.want, { walk: speed > 0.02 ? 1 - bound : 0, gallop: speed > 0.02 ? bound : 0, cycle: cyc });
    return true;
  };
  // a step through the water, at the surface (or `depth` under it), turned a little one way or the other round another
  // animal in its way, over it or under it as much as beside it (seen from above, as it keeps its room: above); false
  // where the way on is into the shallows (it hauls out on purpose). With no way round, it holds where it is a moment.
  const stepIn = (speed, dt, depth = 0, rate = null) => {
    let now = null;
    for (const turn of SIDESTEP) {
      const hd = heading + turn, nx = bird.at.x + Math.cos(hd) * speed * dt, nz = bird.at.z + Math.sin(hd) * speed * dt;
      if (edge(nx, nz) > -1.6) { if (turn === 0) return false; continue; }
      const g = roomAt(_p1.set(nx, bird.at.y, nz), facing(hd, _q1));
      if (g < ROOM && g < (now ??= roomAt(bird.at, bird.q)) - 1e-6) continue;
      heading = hd; bird.at.x = nx; bird.at.z = nz;
      const top = water(nx, nz) - sink - depth, bed = world.height(nx, nz) + 0.06;
      bird.at.y = Math.max(bed, top);
      cyc += rate == null ? dt * (0.8 + speed / 0.32) : dt * rate;           // (`rate`: an otter's porpoising, a leap a cycle)
      bird.want.cycle = cyc;
      return true;
    }
    stuck = true;
    return true;
  };
  // a step as it slides into the water or climbs out of it (where it may go is the activity's to say), turned round
  // another animal in its way as a swimmer is; with no way round it holds where it is a moment
  const glide = (speed, dt) => {
    let now = null;
    for (const turn of SIDESTEP) {
      const hd = heading + turn, nx = bird.at.x + Math.cos(hd) * speed * dt, nz = bird.at.z + Math.sin(hd) * speed * dt;
      const g = roomAt(_p1.set(nx, bird.at.y, nz), facing(hd, _q1));
      if (g < ROOM && g < (now ??= roomAt(bird.at, bird.q)) - 1e-6) continue;
      heading = hd; bird.at.x = nx; bird.at.z = nz;
      return true;
    }
    stuck = true;
    return false;
  };
  // a spot in the otter's stretch of river, `across` metres from its middle line (and so deep enough to swim)
  const inRiver = (down, out) => { riverPoint(clamp(down, home.centre - home.reach, home.centre + home.reach), (r() - 0.5) * 6, out); out.y = water(out.x, out.z) - sink; return out; };

  // ---- on foot: off out of the walker's plain sight, and gone from there (only from there: `off`, below); in from out
  // of it. With no place out of sight to be found, it goes straight on away from the walker, until it is too far off
  // to be seen.
  const away = (far) => {
    const ang = Math.atan2(bird.at.z - world.eye.z, bird.at.x - world.eye.x) + (r() - 0.5) * 0.8;
    return new THREE.Vector3(bird.at.x + Math.cos(ang) * far, 0, bird.at.z + Math.sin(ang) * far);
  };
  const offFoot = (seconds, gait) => a.to('off', world.offstage(bird.at, bird, r, { away: true, least: 12, most: 45, radius: 0.3, spread: 2.4 }) || away(30), seconds, gait);
  const onFoot = (target, landing, gait = 'walk') => {
    const at = world.offstage(target, bird, r, { least: 14, most: 40, radius: 0.3 });
    if (!at) return false;
    const hd = Math.atan2(target.z - at.z, target.x - at.x);
    if (roomAt(at, facing(hd, _q1)) < 0.3) return false;                      // (not onto another animal: it comes a little later)
    bird.at.copy(at); heading = hd; face();
    return a.to('in', target.clone(), landing, gait);
  };

  // ---- what any of them may be at
  const activities = {
    // on foot to `to`, then into `then`
    trot: {
      pose: () => pose({ neck: manner === 'skunk' ? 0.25 : 0.45, tail: manner === 'skunk' ? 0.15 : 0 }),
      enter: (a_, at, then, gait = null, speed = walkPace, what = null) => { to.copy(at); a.now.then = then; a.now.gait = gait; a.now.speed = speed; a.now.what = what; },
      step: (a_, dt) => {
        const n = a.now, left = Math.hypot(to.x - bird.at.x, to.z - bird.at.z);
        if (left < 0.3) return next(n.then);
        steer(to.x, to.z, 3.5, dt);
        if (!stepOn(n.speed, dt, n.gait)) {
          // (something in the way: near enough, or round it, or something else)
          if (left < 1.2) return next(n.then);
          n.stuck = (n.stuck || 0) + dt; n.flip = -(n.flip || 1); heading += n.flip * 0.9;
          if (n.stuck > 1.5) return next();
        }
        bird.doing = n.what || (n.gait === 'bound' ? 'bounding over the floor' : manner === 'skunk' ? 'waddling, nose down' : 'walking');
      },
    },
    // standing (or sitting up) a while: sniffing, or looking about
    pause: {
      pose: () => pose({ neck: manner === 'skunk' ? 0.3 : 0.75 }),
      enter: (a_, seconds, what = 'look') => { a.now.left = seconds; a.now.what = what; bird.doing = what === 'sniff' ? 'sniffing at the ground' : 'standing, looking about'; },
      step: (a_, dt) => {
        const n = a.now;
        n.left -= dt; n.glance = (n.glance || 0) - dt;
        if (n.glance < 0) { n.glance = 0.6 + r() * 1.4; bird.want.head = { yaw: (r() - 0.5) * 2, pitch: n.what === 'sniff' ? -0.3 : 0.1 }; bird.want.neck = n.what === 'sniff' ? 0.2 : 0.7 + r() * 0.3; }
        if (n.left <= 0) next();
      },
    },
    // looking at the walker for a moment, before it goes
    eye: {
      pose: () => pose({ neck: 0.95, ears: 1 }),
      enter: (a_, seconds, then) => { a.now.left = seconds; a.now.then = then; bird.doing = 'stopped, looking at you'; },
      step: (a_, dt) => { watch(); a.now.left -= dt; if (a.now.left <= 0) a.now.then(); },
    },
    // off on foot to where the walker cannot see it, and gone from there: only from there, however long it takes (it is
    // gone once the walker cannot plainly see it, by the visit's own test as it lets an animal go: life/visit.js)
    off: {
      pose: () => pose({ neck: 0.55, tail: manner === 'skunk' ? 1 : 0 }),
      enter: (a_, at, seconds, gait) => { to.copy(at); Object.assign(a.now, { seconds, gait, tries: 0, look: 0.6, round: 0, flip: 1 }); bird.doing = gait === 'bound' ? 'bounding off into the wood' : manner === 'skunk' ? 'waddling off, its tail up' : 'going off'; },
      step: (a_, dt) => {
        const n = a.now, speed = n.gait === 'bound' ? runPace : walkPace;
        if (!world.plainly(bird)) { bird.left = n.seconds; a.to('gone'); return; }
        n.look -= dt; n.round -= dt;
        if (Math.hypot(to.x - bird.at.x, to.z - bird.at.z) > 0.4) {
          if (n.round <= 0) steer(to.x, to.z, 4, dt);
          if (stepOn(speed, dt, n.gait)) return;
          // (something in the way: round it, one way or the other, a moment before it heads for its place again)
          n.flip = -n.flip; heading += n.flip * (0.6 + r() * 0.9); n.round = 0.6;
        }
        // there and still in plain sight, or held up: somewhere else out of sight, looked for now and then and a little
        // further off each time; with none, straight on away from the walker until it is too far off to be seen
        if (n.look > 0) return;
        n.look = 0.5 + r() * 0.5; n.tries += 1;
        to.copy(world.offstage(bird.at, bird, r, { away: true, least: 10, most: Math.min(90, 40 + n.tries * 5), radius: 0.3, spread: Math.min(6.2, 3.5 + n.tries * 0.25) }) || away(25 + Math.min(n.tries, 10) * 3));
      },
    },
    // in on foot from out of the walker's sight
    in: {
      pose: () => pose({ neck: 0.5 }),
      enter: (a_, at, landing, gait) => { to.copy(at); a.now.landing = landing; a.now.gait = gait; bird.doing = 'coming through the wood'; },
      step: (a_, dt) => {
        steer(to.x, to.z, 4, dt);
        if (Math.hypot(to.x - bird.at.x, to.z - bird.at.z) < 0.4 || !stepOn(a.now.gait === 'bound' ? runPace : walkPace, dt, a.now.gait)) next(a.now.landing);
      },
    },
  };

  // ---- the otter (2026-11-19). The owner, 2026-11-18: "The otters are often just stuck in the water not doing anything
  // interesting." It was under the water a third of its time. Now it dives only for a few seconds at a time, coming up
  // a few strides on where a walker can follow it, now and then with a fish; and most of its time it is out on the
  // bar or at the surface doing something a walker can name: eating a fish held in its forepaws on the bar, or on its
  // back in the water; rolling on the cobbles to rub itself dry, grooming, standing up to look about, digging and
  // scent-marking, running the bar in its humping bound, sliding down a bank on its belly into the water and climbing
  // out to do it again, porpoising along the reach; and two or three of a party wrestling on the bar or chasing one
  // another in and out of the water, the young following their mother. From sources (its file says which): the
  // hauling out, rolling and grooming, eating at the surface on its back or on the bank, the slides, the bound, the
  // play of a family. Every distance, time, pace and chance here is the agent's own.
  //   In and out of the water its feet are on the ground it is on and its body in the water while it swims: its origin
  // is at the greater of the ground and its swimming height (`settle`), and it never hangs over the cobbles as it
  // climbs out (it rose to half a metre over its swimming height, the legs hanging, wherever the ground was lower).
  const settle = (dt, rise = 0.8) => {
    const g = world.height(bird.at.x, bird.at.z), w = water(bird.at.x, bird.at.z), top = Math.max(g, w - sink);
    bird.at.y = Math.max(g, Math.min(top, bird.at.y + rise * dt));
    return clamp((w - g - 0.1) / Math.max(0.05, sink - 0.1), 0, 1);          // how far afloat it is, 0 to 1
  };
  // a step in or out of the water along the heading (where it may go is the activity's to say), the legs between
  // walking (or bounding) and paddling by how deep it is; false where it is held up
  const wade = (speed, dt, gait = 'walk') => {
    const moved = glide(speed, dt), afloat = settle(dt), bound = gait === 'bound' ? 1 : 0;
    if (moved) cyc += (speed * dt) / ((bound ? strides.gallop : strides.walk) * (bird.scale || 1));
    Object.assign(bird.want, { swim: afloat, walk: (1 - afloat) * (1 - bound), gallop: (1 - afloat) * bound, cycle: cyc });
    face();
    return moved;
  };
  const onLand = () => edge(bird.at.x, bird.at.z) > 0.1;
  // a spot in the water `along` metres down the river from where it is, near the middle, in its stretch
  const along = (metres, out) => inRiver(river(bird.at.x, bird.at.z, _r)[4] + metres, out);
  // a spot in the water away from the walker, 10 to 25 m from them, in its stretch (or the furthest of eight)
  const awayFrom = (out) => {
    let best = -1;
    for (let tries = 0; tries < 8; tries += 1) {
      inRiver(home.centre + (r() - 0.5) * 2 * home.reach, _w);
      const d = flat(_w), there = Math.hypot(_w.x - bird.at.x, _w.z - bird.at.z);
      if (there > 14) continue;
      if (d > best) { best = d; out.copy(_w); }
      if (d > 12 && d > flat(bird.at) + 3) break;
    }
    if (best < 0) along((r() < 0.5 ? -1 : 1) * 8, out);
    return out;
  };
  // the water by the bank it is on: a few metres out from where it stands, the way that is furthest from the walker
  const waterBy = (out) => {
    const [, , , , down] = river(bird.at.x, bird.at.z, _r);
    let best = -Infinity;
    for (const k of [0, -4, 4]) { inRiver(down + k, _w); const d = flat(_w) - 0.5 * Math.hypot(_w.x - bird.at.x, _w.z - bird.at.z); if (d > best) { best = d; out.copy(_w); } }
    return out;
  };
  // a dive: a few seconds under, along the bottom, up again a few strides on
  const forage = () => { along((r() < 0.5 ? -1 : 1) * (3 + r() * 4), _v); return a.to('dive', _v.clone(), 1.6 + r() * 2.4, null, true); };
  const diveAway = () => { outAgain = r() < 0.75; return a.to('dive', awayFrom(_v).clone(), 2.5 + r() * 2.5); };

  if (manner === 'otter') Object.assign(activities, {
    // at the surface, to `to`: the head and the line of the back out of the water; quick, it porpoises
    swim: {
      pose: () => pose({ swim: 1, neck: 0.85 }),
      enter: (a_, at, speed = swimPace, how = 'plain') => {
        to.copy(at); Object.assign(a.now, { speed, how, t: 0, left: 30 }); bird.cover = false;
        if (how === 'porpoise') bird.want.porpoise = 1;
        bird.doing = how === 'porpoise' ? 'porpoising along the reach' : 'swimming at the surface';
      },
      step: (a_, dt) => {
        const n = a.now; n.t += dt; n.left -= dt;
        steer(to.x, to.z, n.how === 'porpoise' ? 1.1 : 1.6, dt);
        if (Math.hypot(to.x - bird.at.x, to.z - bird.at.z) < 0.6 || n.left <= 0) return next();
        if (!stepIn(n.speed, dt, 0, n.how === 'porpoise' ? n.speed / 1.5 : null)) {
          // (in the shallows, out to where it is deep enough to swim; and a way on into them, something else)
          if (edge(bird.at.x, bird.at.z) > -1.6 && n.t < 15) { wade(swimPace, dt); return; }
          return next();
        }
        face(); bird.want.cycle = cyc;
        if (r() < dt * 0.04 && bird.who && bird.who.party && bird.who.party.members.length > 1) world.say(bird, 'chirp', 30);
      },
    },
    // down to the bottom and along it, out of sight, for `seconds`, and up again wherever it is then; `hunting`, it may
    // come up with a fish. Going off (`leaving`), it goes from under the water and is not up again here.
    dive: {
      pose: () => pose({ swim: 1, dive: 1, neck: 0.5, arch: 0.6 }),
      enter: (a_, at, seconds, leaving = null, hunting = false) => {
        to.copy(at); const n = a.now; n.left = seconds; n.leaving = leaving; n.hunting = hunting; n.t = 0;
        n.speed = leaving !== null ? swimPace * 1.8 : clamp(Math.hypot(to.x - bird.at.x, to.z - bird.at.z) / Math.max(1, seconds), 0.5, 1.7);
        bird.doing = 'diving';
      },
      step: (a_, dt) => {
        const n = a.now; n.t += dt; n.left -= dt;
        const depth = Math.min(0.9, n.t * 0.9), bed = world.height(bird.at.x, bird.at.z), surface = water(bird.at.x, bird.at.z);
        steer(to.x, to.z, 1.2, dt);
        stepIn(n.t < 0.6 ? swimPace : n.speed, dt, depth);
        face(_w.set(0.6 * Math.cos(heading), n.t < 1 ? 0.5 : 1, 0.6 * Math.sin(heading)).normalize());
        // out of sight once its back is a third of a metre under the water (a tenth, down on the bottom, where it is dark)
        const under = surface - (bird.at.y + bird.body.high);
        bird.cover = under > 0.3 || (bird.at.y <= bed + 0.07 && under > 0.1 && n.t > 0.8);
        if (bird.cover) bird.doing = 'under the water';
        // Going, it goes only from out of the walker's plain view: a third of a metre under the water (its cover, which
        // the count takes for out of sight, and which `a.to` lets go of: it still has it as it goes), or where the
        // walker cannot plainly see it (round the bend, behind the bank's trees, too far off: life/visit.js `plainly`)
        if (n.leaving !== null && n.t > 1.5 && (under > 0.3 || !world.plainly(bird))) { bird.left = n.leaving; a.to('gone'); bird.cover = under > 0.3; return; }
        if (n.leaving === null && n.left <= 0) { if (n.hunting && r() < 0.55) fish = true; a.to('rise'); }
        else if (n.left < -12) a.to('rise');
      },
    },
    // up from the bottom, and on with what it does
    rise: {
      pose: () => pose({ swim: 1, neck: 0.9 }),
      enter: () => { a.now.t = 0; bird.doing = fish ? 'coming up with a fish' : 'coming up'; },
      step: (a_, dt) => {
        a.now.t += dt;
        const surface = Math.max(world.height(bird.at.x, bird.at.z), water(bird.at.x, bird.at.z) - sink);
        bird.at.y = Math.min(surface, bird.at.y + dt * 0.9);
        stepIn(swimPace * 0.5, dt, Math.max(0, surface - bird.at.y));
        bird.cover = water(bird.at.x, bird.at.z) - (bird.at.y + bird.body.high) > 0.3;
        face();
        if (bird.at.y >= surface - 0.005) { bird.cover = false; next(); }
      },
    },
    // at the surface with its head and neck out, looking about (or at the walker), and snorting
    periscope: {
      pose: () => pose({ swim: 1, neck: 1.1, ears: 1 }),
      enter: (a_, seconds, at = false) => { a.now.left = seconds; a.now.at = at; a.now.t = 0; bird.doing = at ? 'up in the water, looking at you' : 'up in the water, looking about'; if (at) world.say(bird, 'snort', 40); },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt; n.t += dt;
        bird.at.y = Math.max(world.height(bird.at.x, bird.at.z), water(bird.at.x, bird.at.z) - sink + 0.07 * Math.min(1, n.t * 3));
        cyc += dt * 0.9; bird.want.cycle = cyc;
        if (n.at) watch(); else if ((n.glance = (n.glance || 0) - dt) < 0) { n.glance = 0.7 + r(); bird.want.head = { yaw: (r() - 0.5) * 2.4, pitch: 0.15 }; }
        if (n.left <= 0) next();
      },
    },
    // on its back at the surface, a fish held on its chest in its forepaws, chewing, drifting a little
    float: {
      pose: () => pose({ swim: 1, roll: Math.PI, hold: 1, neck: 0.9, jaw: 0.3 }),
      enter: (a_, seconds) => { a.now.left = seconds; a.now.t = 0; along(4 + r() * 4, to); bird.doing = 'eating a fish on its back in the water'; },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt; n.t += dt;
        steer(to.x, to.z, 0.4, dt);
        stepIn(0.12, dt, 0, 0.5); face();
        bird.want.jaw = 0.12 + 0.3 * Math.max(0, Math.sin(n.t * 7.5));
        bird.want.head = { yaw: 0.15 * Math.sin(n.t * 1.3), pitch: -0.25, tilt: 0 };
        if (n.left <= 0) { fish = false; next(); }
      },
    },
    // in to a bar: to the water's edge by it, and up out of the water onto the cobbles; then it shakes itself
    haul: {
      pose: () => pose({ swim: 1, neck: 0.8 }),
      enter: (a_, spot, then = null) => { const n = a.now; n.spot = spot; n.out = false; n.then = then; n.t = 0; spot.taken = bird; to.set(spot.x, 0, spot.z); bird.doing = 'swimming in to the bank'; },
      step: (a_, dt) => {
        const n = a.now; n.t += dt;
        steer(to.x, to.z, 2.5, dt);
        if (!n.out) {
          if (stepIn(swimPace * 1.8, dt)) { face(); if (n.t < 40) return; }
          n.out = true;
        }
        // (from the shallows on, through the water, swimming where it is deep and walking where it is not: the way to
        // the bar may lie across the river from the shallows it came into)
        const afloat = clamp((water(bird.at.x, bird.at.z) - world.height(bird.at.x, bird.at.z) - 0.1) / Math.max(0.05, sink - 0.1), 0, 1);
        bird.doing = afloat > 0.6 ? 'swimming in to the bank' : 'climbing out onto the bank';
        wade(afloat > 0.6 ? swimPace * 1.8 : walkPace * 2, dt);
        if (Math.hypot(to.x - bird.at.x, to.z - bird.at.z) < 0.3 || edge(bird.at.x, bird.at.z) > 1.2 || n.t > 45) { ground(); a.to('shake', n.then); }
      },
    },
    // out of the water: it shakes itself, the water flying
    shake: {
      pose: () => pose({ shake: 1, neck: 0.7, ears: -0.4 }),
      enter: (a_, then = null) => { a.now.left = 1.1 + r() * 0.8; a.now.then = then; bird.doing = 'shaking the water off'; },
      step: (a_, dt) => {
        ground(); beat += dt * 0.9; bird.want.beat = beat;
        if ((a.now.left -= dt) > 0) return;
        if (a.now.then) return next(a.now.then);
        onBar();
      },
    },
    // on the bar, a fish held up in its forepaws, sitting on its haunches, chewing with its head on one side
    eat: {
      pose: () => pose({ sit: 1, hold: 1, neck: 0.45, jaw: 0.3, ears: 0.3 }),
      enter: () => { a.now.left = 8 + r() * 10; a.now.t = 0; a.now.tip = (r() - 0.5) * 0.6; bird.doing = 'eating a fish, held in its forepaws'; },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt; n.t += dt;
        ground();
        bird.want.jaw = 0.1 + 0.4 * Math.max(0, Math.sin(n.t * 8));
        if ((n.turn = (n.turn || 0) - dt) < 0) { n.turn = 1.5 + r() * 2; n.tip = (r() - 0.5) * 0.7; }
        bird.want.head = { yaw: n.tip * 0.6, pitch: -0.35, tilt: n.tip };
        if (n.left <= 0) { fish = false; onBar(); }
      },
    },
    // rolling on the cobbles and the sand to rub itself dry, from one side over onto its back and over to the other,
    // creeping along as it goes (the roll swings and never runs on: eased back to nothing it would spin)
    roll: {
      pose: () => pose({ neck: 0.55 }),
      enter: () => { a.now.left = 5 + r() * 5; a.now.t = r() * 3; a.now.creep = heading; bird.doing = 'rolling on the bar, rubbing itself dry'; },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt; n.t += dt;
        const x = bird.at.x + Math.cos(n.creep) * 0.07 * dt, z = bird.at.z + Math.sin(n.creep) * 0.07 * dt;
        if (world.walkable(x, z, 0.2) && edge(x, z) > 0.3) { bird.at.x = x; bird.at.z = z; }
        ground();
        Object.assign(bird.want, { roll: 1.7 + 1.3 * Math.sin(n.t * 2.1), turn: 0.5 * Math.sin(n.t * 1.3), arch: 0.35 * Math.sin(n.t * 2.7), neck: 0.45 + 0.15 * Math.sin(n.t * 1.7) });
        if (n.left <= 0) onBar();
      },
    },
    // sitting up on the bar, bent to reach its chest, a flank, a forepaw, nibbling the fur, now one side, now the other
    groom: {
      pose: () => pose({ sit: 1, neck: 0.3 }),
      enter: () => { a.now.left = 6 + r() * 9; a.now.turn = 0; a.now.t = 0; bird.doing = 'grooming its fur'; },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt; n.turn -= dt; n.t += dt;
        ground();
        if (n.turn < 0) { n.turn = 1.4 + r() * 2.2; n.side = r() < 0.5 ? -1 : 1; n.deep = 0.5 + r() * 0.5; }
        Object.assign(bird.want, { turn: n.side * n.deep * 0.6, head: { yaw: n.side * (0.6 + 0.5 * n.deep), pitch: -0.55 - 0.2 * n.deep, tilt: n.side * 0.3 }, neck: 0.25 + 0.1 * n.deep, jaw: 0.05 + 0.2 * Math.max(0, Math.sin(n.t * 9)), arch: 0.3 * n.deep });
        if (n.left <= 0) onBar();
      },
    },
    // up on its hind legs on the bar, looking about, or at the walker
    rear: {
      pose: () => pose({ rear: 1, arms: -0.5, neck: 0.95, ears: 1 }),
      enter: (a_, seconds, at = false) => { a.now.left = seconds; a.now.at = at; bird.doing = at ? 'standing up to look at you' : 'standing up to look about'; if (at) world.say(bird, 'snort', 40); },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt;
        ground();
        if (n.at) watch(); else if ((n.glance = (n.glance || 0) - dt) < 0) { n.glance = 0.6 + r() * 1.1; bird.want.head = { yaw: (r() - 0.5) * 2.2, pitch: 0.1 + r() * 0.2 }; }
        if (n.left <= 0) onBar();
      },
    },
    // scraping at the cobbles with its forefeet, then squatting over the scrape to mark it, its tail raised a little
    mark: {
      pose: () => pose({ dig: 1, reach: 0.07, neck: 0.3 }),
      enter: () => { a.now.left = 3 + r() * 3; a.now.squat = 1.6; bird.doing = 'digging and scent-marking'; },
      step: (a_, dt) => {
        const n = a.now; ground();
        if (n.left > 0) { n.left -= dt; rake += dt * 2.2; bird.want.rake = rake; return; }
        if (n.squat === 1.6) Object.assign(bird.want, { dig: 0, crouch: 0.6, tail: 0.35, arch: -0.25, neck: 0.5 });
        if ((n.squat -= dt) <= 0) onBar();
      },
    },
    // down a bank on its belly into the water, the forelegs laid back, gathering speed; and, as often as not, out again
    // at the bank's foot and up it to slide again
    slide: {
      pose: () => pose({ slide: 1, neck: 0.75, ears: -0.3 }),
      enter: (a_, spot) => {
        const n = a.now; n.spot = spot; n.speed = 1.1; n.t = 0; spot.taken = bird;
        riverPoint(spot.down, spot.side * (SHAPE.HALF - 2.4), to);
        heading = Math.atan2(to.z - bird.at.z, to.x - bird.at.x); face();
        bird.doing = 'sliding down the bank on its belly';
      },
      step: (a_, dt) => {
        const n = a.now; n.t += dt; n.speed = Math.min(2.8, n.speed + dt * 2.2);
        steer(to.x, to.z, 1.5, dt);
        glide(n.speed, dt);
        const afloat = settle(dt);
        cyc += dt * 0.6;
        Object.assign(bird.want, { slide: 1 - afloat, swim: afloat, cycle: cyc }); face();
        if (afloat < 1 || (edge(bird.at.x, bird.at.z) > -1.8 && n.t < 6)) return;
        // in: again, at the bank's foot and up it; or off along the river
        const spot = n.spot;
        if (again > 0) {
          again -= 1;
          riverPoint(spot.down, spot.side * (SHAPE.HALF + 0.5), _v);
          return a.to('haul', { x: _v.x, z: _v.z, down: spot.down, side: spot.side, taken: null }, ['up', spot, 'bounding up the bank to slide again']);
        }
        spot.taken = null;
        next();
      },
      exit: () => { if (a.now.spot && a.now.spot.taken === bird) a.now.spot.taken = null; },
    },
    // up the bank to the top of a slide, in its bound (over the bank's face where the floor is too steep to walk), and
    // down it
    up: {
      pose: () => pose({ neck: 0.5 }),
      enter: (a_, spot, what = 'bounding up the bank to slide') => { a.now.spot = spot; a.now.t = 0; to.set(spot.x, 0, spot.z); bird.doing = what; },
      step: (a_, dt) => {
        const n = a.now; n.t += dt;
        steer(to.x, to.z, 5, dt);
        if (!stepOn(runPace * 0.6, dt, 'bound') && glide(runPace * 0.5, dt)) {
          ground(); face(); cyc += (runPace * 0.5 * dt) / (strides.gallop * (bird.scale || 1)); Object.assign(bird.want, { gallop: 1, walk: 0, cycle: cyc });
        }
        if (Math.hypot(to.x - bird.at.x, to.z - bird.at.z) < 0.35) return a.to('slide', n.spot);
        if (n.t > 9) onBar();
      },
    },
    // off the bar into the water: down the cobbles in its bound, and in on its belly; fleeing, it dives at once
    plunge: {
      pose: () => pose({ neck: 0.55 }),
      enter: (a_, at, flee = false, leaving = null) => { to.copy(at); Object.assign(a.now, { flee, leaving, t: 0, sliding: false }); bird.doing = flee ? 'slipping into the water' : 'running down into the water'; },
      step: (a_, dt) => {
        const n = a.now; n.t += dt;
        steer(to.x, to.z, 5, dt);
        if (!n.sliding) {
          if (edge(bird.at.x, bird.at.z) < 0.6 || !stepOn(runPace * (n.flee ? 0.9 : 0.7), dt, 'bound')) n.sliding = true;
          if (!n.sliding) return;
        }
        wade(runPace * 0.6, dt, 'bound');
        bird.want.slide = clamp(1 - bird.want.swim, 0, 1) * 0.8;
        if (edge(bird.at.x, bird.at.z) > -1.8 && n.t < 8) return;
        if (n.leaving !== null) return a.to('dive', along((r() < 0.5 ? -1 : 1) * 20, _v).clone(), 30, n.leaving);
        if (n.flee) return diveAway();
        next();
      },
    },
  });

  // ---- the otter's play with others of its party (2026-11-19; who asks whom: `play`, below)
  if (manner === 'otter') Object.assign(activities, {
    // Two wrestling on the bar: they lie side by side, nose to tail, a hand's breadth and more apart, and turn about
    // one another as they tussle, rolling towards each other, lunging up and coming down, mouthing. Each keeps to its
    // place on a ring a body's width across, which the one that asked turns, now faster, now slower; the other comes
    // to its place first. It ends when its time is up, or the other has gone to something else; and as often as not
    // it ends in a chase, the one that asked off into the water and the other after it.
    wrestle: {
      pose: () => pose({ neck: 0.6, jaw: 0.35, ears: -0.4 }),
      enter: (a_, game) => { const n = a.now; n.game = game; n.t = r() * 3; n.me = game.by === bird ? 0 : 1; n.lunge = 0.4 + r(); bird.doing = 'wrestling with another otter'; },
      exit: () => { const g = a.now && a.now.game; if (g) { g.over = true; if (home.game === g) home.game = null; } },
      step: (a_, dt) => {
        const n = a.now, g = n.game, other = n.me ? g.by : g.with; n.t += dt;
        const there = other && other.left == null && other.state === 'wrestle';
        // (never nearer the other's middle than 0.3 m, whatever the ring does: the count's limit is 0.12)
        const apart = () => { const dx = bird.at.x - other.at.x, dz = bird.at.z - other.at.z, d = Math.hypot(dx, dz); if (d < 0.3) { const k = (0.3 - d) / (d || 1); bird.at.x += (d ? dx : 1) * k; bird.at.z += (d ? dz : 0) * k; } };
        if (g.over || world.clock > g.end || (n.me === 1 && !there) || (g.joined && !there && n.t > 1.5) || (!g.joined && world.clock > g.until)) return playOver(g, n.me);
        if (n.me === 0 && g.ready) { g.th += dt * g.spin; if ((g.turn = (g.turn || 0) - dt) < 0) { g.turn = 0.8 + r() * 1.6; g.spin = 0.25 + r() * 0.9; } }
        const ang = g.th + n.me * Math.PI, sx = g.cx + Math.cos(ang) * g.ring, sz = g.cz + Math.sin(ang) * g.ring, far = Math.hypot(sx - bird.at.x, sz - bird.at.z);
        if (far > 0.8) {
          // (to its place by the other, in its bound: its place is on its own side of the other, and the ring stands
          // still until it is there)
          steer(sx, sz, 6, dt);
          if (!stepOn(runPace * 0.5, dt, 'bound') && glide(runPace * 0.4, dt)) { ground(); face(); }
          apart();
          bird.doing = n.me ? 'bounding up to another otter to play' : 'asking another otter to play';
          return;
        }
        // there: first turned to lie along the ring (the other, at the ring's middle, on its right), then into its
        // place, side by side with the other and nose to tail; the bodies never cross (`room` holds each away from
        // the other's, and only the check for one about to land is let go: `exempt`)
        const along = wrap(ang + Math.PI / 2 - heading);
        heading = wrap(heading + clamp(along, -4 * dt, 4 * dt)); face();
        if (Math.abs(along) < 0.35) { bird.at.x += (sx - bird.at.x) * Math.min(1, dt * 4); bird.at.z += (sz - bird.at.z) * Math.min(1, dt * 4); }
        apart(); ground();
        if (n.me === 1 && far < 0.1) g.ready = true;
        if (!g.ready) {
          // (until the other is by it: up on its haunches, watching it come, bobbing its head)
          const yaw = wrap(Math.atan2(other.at.z - bird.at.z, other.at.x - bird.at.x) - heading);
          Object.assign(bird.want, { walk: 0, gallop: 0, lie: 0, sit: 0.7, neck: 0.8, roll: 0, head: { yaw: clamp(yaw, -1.4, 1.4), pitch: 0.1 + 0.15 * Math.sin(n.t * 6), tilt: 0 } });
          bird.doing = n.me ? 'bounding up to another otter to play' : 'asking another otter to play';
          return;
        }
        bird.doing = 'wrestling with another otter';
        const side = 1, w = Math.sin(n.t * 2.3 + n.me * 1.9);
        n.lunge -= dt; if (n.lunge < -0.5) n.lunge = 0.5 + r() * 1.3;
        const up = n.lunge < 0 ? Math.sin(Math.PI * (-n.lunge / 0.5)) : 0;
        Object.assign(bird.want, { walk: 0, gallop: 0, sit: 0.4 * up, lie: 0, rear: 0.6 * up, arms: 0.5, roll: side * (0.5 + 0.9 * Math.max(0, w)) * (1 - up),
          turn: side * (0.5 + 0.25 * w), arch: 0.25 * Math.sin(n.t * 3.1), jaw: 0.2 + 0.4 * Math.max(0, Math.sin(n.t * 5.3 + n.me)), head: { yaw: side * 0.9, pitch: 0.15 * up, tilt: side * 0.3 } });
      },
    },
    // After another of its party, a body's length behind it: chasing it through the water (porpoising when it is
    // quick), out onto the bar and in again; or, a young one, following its mother. It stops when its time is up, or
    // when the other dives or goes.
    follow: {
      pose: () => pose({ neck: 0.65 }),
      enter: (a_, lead, seconds, why = 'chase') => { const n = a.now; n.lead = lead; n.left = seconds; n.why = why; bird.doing = why === 'mother' ? 'following its mother' : 'chasing another otter'; },
      step: (a_, dt) => {
        const n = a.now, L = n.lead; n.left -= dt;
        if (n.left <= 0 || !L || L.left != null || L.state === 'gone' || L.cover || L.state === 'dive' || L.state === 'rise') return next();
        flatOf(L.q, _fb);
        const back = 0.95 * (L.scale || 1) + 0.15, tx = L.at.x - _fb.x * back, tz = L.at.z - _fb.z * back, d = Math.hypot(tx - bird.at.x, tz - bird.at.z);
        if (d < 0.25) {                                // (up with it: it holds, and looks about)
          if (onLand()) { ground(); Object.assign(bird.want, { walk: 0, gallop: 0, swim: 0 }); } else { settle(dt); bird.want.porpoise = 0; }
          return;
        }
        steer(tx, tz, 5, dt);
        const e = edge(bird.at.x, bird.at.z);
        if (e < -1.6) {
          const speed = clamp(d * 1.5, 0.3, swimPace * 2.6), quick = speed > swimPace * 1.6;
          if (stepIn(speed, dt, 0, quick ? speed / 1.5 : null)) face(); else wade(speed, dt);
          bird.want.swim = 1; bird.want.porpoise = quick ? 1 : 0;
          return;
        }
        const speed = clamp(d * 2, 0.3, runPace * 0.8);
        bird.want.porpoise = 0;
        if (e > 0.3 && stepOn(speed, dt, speed > walkPace * 1.5 ? 'bound' : 'walk')) { bird.want.swim = 0; return; }
        wade(speed, dt, 'bound');
      },
    },
  });

  // ---- the fisher
  if (manner === 'fisher') Object.assign(activities, {
    // up a trunk to a height and down it again head first, then off it onto the floor
    climb: {
      pose: () => pose({ walk: 1, neck: 0.75 }),
      enter: (a_, tree) => {
        const n = a.now; n.tree = tree; n.h = 0.25; n.top = Math.min(tree.top - 1.5, 3.5 + r() * 6); n.up = true; n.wait = 0;
        n.turn = Math.atan2(bird.at.z - tree.foot.z, bird.at.x - tree.foot.x) / (Math.PI * 2) - tree.turnOffset; bird.doing = 'climbing a trunk';
        onTrunk(tree, n.h, n.turn, _s);
        // (too far from the bark to spring onto it, or another animal on the trunk or by it now, or on the spot)
        if (_s.point.distanceTo(bird.at) > 1.5 || world.beside(tree.foot.x, tree.foot.z, tree.girth + 1.2, bird) || !hop(n, _s.point)) return next();
      },
      step: (a_, dt) => {
        const n = a.now, speed = 0.7;
        if (hopping(n, dt)) return;
        if (n.down) return next();
        if (n.wait > 0) { n.wait -= dt; bird.want.walk = 0; watchNot(); return; }
        n.h += (n.up ? 1 : -1) * speed * dt;
        if (n.up && n.h >= n.top) { n.up = false; n.wait = 1.5 + r() * 4; bird.doing = 'on a trunk, head down, coming down'; }
        onTrunk(n.tree, n.h, n.turn, _s);
        bird.at.copy(_s.point);
        frame(_v.set(0, n.up ? 1 : -1, 0), _s.normal, bird.q);
        cyc += (speed * dt) / strides.walk; Object.assign(bird.want, { walk: 1, cycle: cyc });
        if (!n.up && n.h <= 0.3) {
          // off the bark onto the floor; where another animal is on the spot, it waits on the bark a moment
          n.h = 0.3;
          _v.copy(bird.at).addScaledVector(_w.set(_s.normal.x, 0, _s.normal.z).normalize(), 0.3); _v.y = world.height(_v.x, _v.z);
          if (hop(n, _v)) { heading = Math.atan2(_s.normal.z, _s.normal.x); face(); n.down = true; } else n.wait = 0.5;
        }
      },
    },
    // along the top of a log, end to end
    log: {
      pose: () => pose({ walk: 0, gallop: 1, neck: 0.6 }),
      enter: (a_, log) => {
        const n = a.now; n.log = log; n.len = Math.max(1, log.on(0.02, spot()).point.distanceTo(log.on(0.98, spot()).point)); bird.doing = 'bounding along a log';
        // (from the end it is nearer)
        const p0 = log.on(0.05, spot()).point, p1 = log.on(0.95, spot()).point;
        n.dir = p0.distanceTo(bird.at) <= p1.distanceTo(bird.at) ? 1 : -1; n.t = n.dir > 0 ? 0.05 : 0.95;
        const start = n.dir > 0 ? p0 : p1;
        if (start.distanceTo(bird.at) > 1.6 || !logFree(log) || !hop(n, start)) return next();
      },
      step: (a_, dt) => {
        const n = a.now, speed = runPace * 0.6;
        if (hopping(n, dt)) return;
        if (n.off) return next();
        n.t += (n.dir * speed * dt) / n.len;
        n.log.on(clamp(n.t, 0.02, 0.98), _s);
        const ahead = n.log.on(clamp(n.t + n.dir * 0.05, 0.02, 0.98), spot()).point.sub(_s.point);
        bird.at.copy(_s.point); frame(ahead, _s.normal.y < 0 ? _s.normal.negate() : _s.normal, bird.q);
        heading = Math.atan2(ahead.z, ahead.x);
        cyc += (speed * dt) / strides.gallop; Object.assign(bird.want, { gallop: 1, cycle: cyc });
        if (n.t <= 0.02 || n.t >= 0.98) {
          // off the end; or off to one side, where another animal is on the spot; or back along the log
          for (const turn of [0, Math.PI / 2, -Math.PI / 2]) {
            const hd = heading + turn;
            _v.copy(bird.at).addScaledVector(_w.set(Math.cos(hd), 0, Math.sin(hd)), 0.5); _v.y = world.height(_v.x, _v.z);
            if (hop(n, _v)) { heading = hd; face(); n.off = true; return; }
          }
          n.dir = -n.dir; n.t = clamp(n.t, 0.03, 0.97);
        }
      },
    },
  });
  const watchNot = () => { if (bird.want.head && r() < 0.02) bird.want.head = { yaw: (r() - 0.5) * 1.6, pitch: 0.2 }; };

  // ---- the skunk
  if (manner === 'skunk') Object.assign(activities, {
    dig: {
      pose: () => pose({ dig: 1, neck: 0.1, tail: 0.15 }),
      enter: () => { a.now.left = 5 + r() * 10; bird.doing = 'digging for grubs'; },
      step: (a_, dt) => { cyc += dt * 2.6; bird.want.cycle = cyc; a.now.left -= dt; if (a.now.left <= 0) next(); },
    },
    // facing the walker, tail up, back arched, stamping its forefeet and lurching at them
    warn: {
      pose: () => pose({ tail: 1, arch: 0.7, neck: 0.8, ears: 1 }),
      enter: () => { a.now.t = 0; a.now.stamp = 0.3; a.now.far = 0; bird.doing = 'warning you: tail up, stamping'; },
      step: (a_, dt) => {
        const n = a.now; n.t += dt; n.stamp -= dt;
        steer(world.eye.x, world.eye.z, 3, dt); face(); watch(0.6);
        // the stamps: both forefeet up and down hard, a lurch forward with every third
        const up = n.stamp > 0 ? Math.sin(Math.PI * clamp(n.stamp / 0.3, 0, 1)) : 0;
        bird.want.stamp = up; bird.want.rear = n.lurch > 0 ? 0.45 * up : 0;
        if (n.stamp <= -0.25 - r() * 0.6) { n.stamp = 0.3; n.lurch = r() < 0.33 ? 1 : 0; world.say(bird, 'stamp', 14); }
        if (near() > shyAt * 1.5) n.far += dt; else n.far = 0;
        if (n.far > 3) { warned = 0; next(); }
      },
    },
    // waddling away from the walker, the tail still up; it does not run
    retreat: {
      pose: () => pose({ tail: 1, neck: 0.5 }),
      enter: () => { a.now.left = 6 + r() * 6; bird.doing = 'waddling away from you, tail up'; },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt;
        heading = wrap(heading + clamp(wrap(Math.atan2(bird.at.z - world.eye.z, bird.at.x - world.eye.x) - heading), -2 * dt, 2 * dt));
        if (!stepOn(walkPace * 1.3, dt, 'walk')) heading += 0.6;
        if (n.left <= 0) { if (!offFoot(Infinity, 'walk')) n.left = 2; }
      },
    },
  });

  // ---- every step keeps its room (`room`, at the head of the file): whatever an activity did in a frame, on foot, in
  // the water, along a log, up the bark or turning where it stands, if it left its body nearer another animal's than
  // ROOM, and nearer than it was, it is undone (where it was, facing as it was, and what it was at no further on), and
  // one held up a while gives way to something else (`unstick`)
  const keep = (step) => (a_, dt) => {
    const n = a.now, was = heading, t = n && n.t, h = n && n.h, hp = n && n.hop, ht = hp && hp.t;
    _p0.copy(bird.at); _q0.copy(bird.q);
    stuck = false;
    world.others(bird.at.x, bird.at.z, REACH + 2, bird, by);
    known = true;
    // (an otter wrestling leaves its partner out of its room: the wrestle keeps the two apart itself)
    exempt = manner === 'otter' && a.name === 'wrestle' && n && n.game ? (n.me ? n.game.by : n.game.with) : null;
    try {
      step(a_, dt);
      if (bird.left != null || a.name === 'gone' || a.name === 'fly') return;
      let back = false;
      if (bird.at.x !== _p0.x || bird.at.z !== _p0.z || !bird.q.equals(_q0)) {        // (something moved, seen from above)
        const after = roomAt(bird.at, bird.q);
        if (after < ROOM && after < roomAt(_p0, _q0) - 1e-6) {
          back = true;
          bird.at.copy(_p0); bird.q.copy(_q0); heading = was;
          if (n && a.now === n) { n.t = t; n.h = h; n.hop = hp; if (hp) hp.t = ht; }
        }
      }
      // (held up, undone or with no way round in the water (`stuck`), for a second and a half in all: something else)
      const m = a.now;
      if (!m) return;
      if (!back && !stuck) { m.held = 0; return; }
      if ((m.held = (m.held || 0) + dt) >= 1.5) { m.held = 0; unstick(m); }
    } finally { known = false; exempt = null; }
  };
  // held up: up a trunk, down it again; along a log, back; under the water, up somewhere else; on foot going off or
  // coming in, it finds its own way round; anything else, something else
  const unstick = (n) => {
    // (coming down and held up it waits for the other to go by, and near the foot of the trunk it gets off)
    if (a.name === 'climb') { if (n.up && n.h > 0.6) { n.up = false; n.wait = 0; bird.doing = 'on a trunk, head down, coming down'; return; } if (n.h > 0.6) return; return next(); }
    if (a.name === 'log') { n.dir = -n.dir; return; }
    if (a.name === 'dive') { inRiver(home.centre + (r() - 0.5) * home.reach, to); return; }
    if (a.name === 'off' || a.name === 'in') return;
    next();
  };
  for (const act of Object.values(activities)) act.step = keep(act.step);

  // ---- what next, when an activity ends of itself
  function next(then = null) {
    if (then) return typeof then === 'function' ? then() : a.to(...then);
    if (manner === 'otter') return onLand() ? onBar() : afloat();
    if (manner === 'fisher') {
      const k = r();
      // (not up a trunk that another animal is on, or by, or about to land on; nor along a log another is on)
      if (k < 0.3 && home.climbs.length) {
        const t = home.climbs[Math.floor(r() * home.climbs.length)], dx = bird.at.x - t.foot.x, dz = bird.at.z - t.foot.z, d = Math.hypot(dx, dz) || 1;
        if (!world.beside(t.foot.x, t.foot.z, t.girth + 1.2, bird)) return a.to('trot', _v.set(t.foot.x + (dx / d) * (t.girth + 0.45), 0, t.foot.z + (dz / d) * (t.girth + 0.45)).clone(), ['climb', t], 'bound', runPace * 0.7);
      } else if (k < 0.55 && home.logs.length) {
        const l = home.logs[Math.floor(r() * home.logs.length)];
        if (logFree(l)) { const end = l.on(r() < 0.5 ? 0.04 : 0.96, spot()).point; return a.to('trot', end.clone(), ['log', l], 'bound', runPace * 0.7); }
      }
      if (k < 0.7) return a.to('pause', 1 + r() * 3, 'sniff');
      return wander('bound', runPace * 0.6);
    }
    // the skunk
    if (r() < 0.45) return a.to('dig');
    return wander('walk', walkPace);
  }
  // a place on a bar to haul out at that none of its family has (on its way to it, there, or bounding off it) and that
  // no other animal is on or near; or none
  // (the nearest of up to eight looked at, within 18 m of it; seldom one within 9 m of the trail, where every walker
  // passes it close; `shy`, one 15 m and more from the walker, and within 30 m)
  function freeHaul(shy = false, list = home.hauls) {
    if (!list || !list.length) return null;
    let best = null, bestD = Infinity;
    for (let tries = 0; tries < 8; tries += 1) {
      const spot = list[Math.floor(r() * list.length)], holder = spot.taken;
      if (holder && holder !== bird && holder.left == null && holder.state !== 'gone' && (holder.state === 'haul' || holder.state === 'slide' || Math.hypot(holder.at.x - spot.x, holder.at.z - spot.z) < 3)) continue;
      if (Math.hypot(spot.x - bird.at.x, spot.z - bird.at.z) > (shy ? 30 : 18)) continue;
      if (spot.off == null) spot.off = world.trail.distance(spot.x, spot.z);
      if (spot.off < 9 && r() > 0.15) continue;
      if (shy && flat(spot) < 15) continue;
      const d = Math.hypot(spot.x - bird.at.x, spot.z - bird.at.z);
      if (d < bestD && world.free(_p1.set(spot.x, world.height(spot.x, spot.z), spot.z), bird, 1.5)) { best = spot; bestD = d; }
    }
    return best;
  }
  // ---- the otter's choices. In the water: with a fish, it eats it on its back or takes it to the bar; out again
  // after slipping in from the walker, somewhere away from them; otherwise it hunts (a short dive), looks about,
  // hauls out, porpoises along the reach, or swims; a young one may follow its mother, and one of a party may set
  // another chasing it (below).
  function afloat() {
    // (in the shallows by a bank: out onto the bar, or out to where it can swim)
    if (edge(bird.at.x, bird.at.z) > -2) {
      const spot = (fish || r() < 0.5) && freeHaul();
      if (spot) { ashore = 1 + Math.floor(r() * 3); return a.to('haul', spot); }
      return a.to('swim', inRiver(river(bird.at.x, bird.at.z, _r)[4] + (r() - 0.5) * 6, _v).clone(), swimPace);
    }
    if (fish) {
      if (r() < 0.5) return a.to('float', 7 + r() * 8);
      const spot = freeHaul(); if (spot) { ashore = 1 + Math.floor(r() * 3); return a.to('haul', spot); }
      return a.to('float', 7 + r() * 8);
    }
    if (outAgain) { outAgain = false; const spot = freeHaul(true); if (spot) { ashore = 2 + Math.floor(r() * 3); return a.to('haul', spot); } }
    if (play && play(false)) return true;
    const k = r();
    if (k < 0.2) return forage();
    if (k < 0.3) return a.to('periscope', 2 + r() * 3);
    if (k < 0.62) { const spot = freeHaul(); if (spot) { ashore = 3 + Math.floor(r() * 3); return a.to('haul', spot); } }
    if (k < 0.8) return a.to('swim', along((r() < 0.5 ? -1 : 1) * (12 + r() * 14), _v).clone(), swimPace * 2.4, 'porpoise');
    return a.to('swim', along((r() < 0.5 ? -1 : 1) * (4 + r() * 8), _v).clone(), swimPace);
  }
  // On the bar: with a fish, it eats it; it rolls, grooms, stands up to look, digs and marks, runs along the bar, or
  // goes to a bank to slide; one of a party may set another wrestling with it (below); after a few of these it goes
  // back into the water, down a bank if one is near.
  function onBar() {
    if (fish) return a.to('eat');
    ashore -= 1;
    if (ashore < 0) return toSlide() || a.to('plunge', waterBy(_v).clone());
    if (play && play(true)) return true;
    const k = r();
    if (k < 0.22) return a.to('roll');
    if (k < 0.42) return a.to('groom');
    if (k < 0.54) return a.to('rear', 2 + r() * 2.5);
    if (k < 0.68) return a.to('mark');
    if (k < 0.84) {
      // a few bounds along the bar, the way that is furthest from the walker
      for (let tries = 0; tries < 6; tries += 1) {
        const ang = heading + (r() - 0.5) * 3, far = 3 + r() * 5, x = bird.at.x + Math.cos(ang) * far, z = bird.at.z + Math.sin(ang) * far;
        if (edge(x, z) > 0.5 && world.walkable(x, z, 0.3)) return a.to('trot', _v.set(x, world.height(x, z), z).clone(), null, 'bound', runPace * 0.75, 'running along the bar');
      }
    }
    return toSlide() || a.to('groom');
  }
  // to a bank near it (within 25 m) that no other is sliding down, up to its top in the bound, and down it; and, as often
  // as not, again once or twice. False if there is none.
  function toSlide() {
    const spot = freeHaul(false, (home.slides || []).filter((s) => Math.hypot(s.x - bird.at.x, s.z - bird.at.z) < 14));
    if (!spot) return false;
    again = r() < 0.65 ? 1 + Math.floor(r() * 2) : 0;
    if (!onLand()) { riverPoint(spot.down, spot.side * (SHAPE.HALF + 0.5), _v); return a.to('haul', { x: _v.x, z: _v.z, down: spot.down, side: spot.side, taken: null }, ['up', spot]); }
    return a.to('up', spot);
  }
  // ---- a party's play (2026-11-19): two of a party wrestling on the bar, or one setting another chasing it along the
  // reach; a young one following its mother. One asks (the party's `home.game`: what, by whom, with whom, until when it
  // waits for an answer, and when it ends), and the other comes to it from whatever it is at that it can leave
  // (`joined`, from `react`, each frame). False where there is no game to be had now.
  const party = manner === 'otter' && bird.who ? bird.who.party : null, _mates = [];
  const LEAVES = new Set(['swim', 'periscope', 'groom', 'roll', 'rear', 'mark', 'trot', 'shake']);
  const mates = () => {
    _mates.length = 0;
    if (party) for (const m of party.members) { const b = m.bird; if (b && b !== bird && b.left == null && b.state !== 'gone' && !b.cover) _mates.push(b); }
    return _mates;
  };
  const play = !party || party.members.length < 2 ? null : (land) => {
    // (a young one, in the water with its mother near: after her a while)
    const mother = party.members[0] && party.members[0].bird;
    if (!land && bird.who.young && mother && mother !== bird && mother.left == null && !mother.cover && mother.state !== 'gone'
      && Math.hypot(mother.at.x - bird.at.x, mother.at.z - bird.at.z) < 20 && r() < 0.4) return a.to('follow', mother, 8 + r() * 10, 'mother');
    if (home.game && !home.game.over && world.clock < home.game.end) return false;
    for (const b of mates()) {
      if (!LEAVES.has(b.state)) continue;
      const d = Math.hypot(b.at.x - bird.at.x, b.at.z - bird.at.z), theirs = edge(b.at.x, b.at.z) > 0.3;
      if (land && theirs && d < 12 && r() < 0.5) {
        // the ring: its middle a body's width from where this one is, towards the other, on open cobbles
        const ring = 0.19 * Math.max(bird.scale || 1, b.scale || 1), dx = (b.at.x - bird.at.x) / (d || 1), dz = (b.at.z - bird.at.z) / (d || 1);
        const cx = bird.at.x + dx * ring, cz = bird.at.z + dz * ring;
        if (edge(cx, cz) < 0.5 || !world.walkable(cx, cz, 0.4)) continue;
        home.game = { what: 'wrestle', by: bird, with: b, until: world.clock + 6, end: world.clock + 10 + r() * 10, joined: false, over: false,
          cx, cz, ring, th: Math.atan2(bird.at.z - cz, bird.at.x - cx), spin: 0.6, chase: r() < 0.55 };
        return a.to('wrestle', home.game);
      }
      if (!land && !theirs && d < 15 && r() < 0.35) {
        home.game = { what: 'chase', by: bird, with: b, until: world.clock + 3, end: world.clock + 12, joined: false, over: false };
        return a.to('swim', along((r() < 0.5 ? -1 : 1) * (14 + r() * 12), _v).clone(), swimPace * 2.4, 'porpoise');
      }
    }
    return false;
  };
  // asked, it comes: to wrestle only from the bar, to chase from the water or the bar
  const joined = () => {
    const g = home.game;
    if (!g || g.with !== bird || g.joined || g.over || world.clock > g.until || !LEAVES.has(a.name)) return false;
    if (g.what === 'wrestle' && !onLand()) return false;
    g.joined = true;
    if (g.what === 'wrestle') {
      // (the ring set again from where the two are now: its middle by the one that asked, towards this one)
      const L = g.by, d = Math.hypot(bird.at.x - L.at.x, bird.at.z - L.at.z) || 1;
      g.cx = L.at.x + ((bird.at.x - L.at.x) / d) * g.ring; g.cz = L.at.z + ((bird.at.z - L.at.z) / d) * g.ring; g.th = Math.atan2(L.at.z - g.cz, L.at.x - g.cx);
    }
    return g.what === 'wrestle' ? a.to('wrestle', g) : a.to('follow', g.by, 8 + r() * 6, 'chase');
  };
  // a wrestle over: as often as not a chase, the one that asked off into the water and the other after it
  const playOver = (g, me) => {
    g.over = true; if (home.game === g) home.game = null;
    const other = me ? g.by : g.with;
    if (g.chase && g.joined && other && other.left == null) {
      if (me === 0) return a.to('plunge', waterBy(_v).clone());
      if (other.state === 'plunge' || other.state === 'wrestle') return a.to('follow', other, 9 + r() * 5, 'chase');
    }
    return onBar();
  };
  // a fallen log with no other animal on it, or about to land on it, anywhere along it
  function logFree(log) {
    for (let t = 0.04; t <= 0.97; t += 0.08) if (!world.free(log.on(t, _s).point, bird, 0.6)) return false;
    return true;
  }
  // somewhere in its home's reach it can walk to
  function wander(gait, speed) {
    for (let tries = 0; tries < 10; tries += 1) {
      const ang = r() * 6.283, d = 2 + r() * home.reach;
      const x = home.x + Math.cos(ang) * d, z = home.z + Math.sin(ang) * d;
      if (world.walkable(x, z, 0.3)) return a.to('trot', _v.set(x, world.height(x, z), z).clone(), null, gait, speed);
    }
    return a.to('pause', 2, 'sniff');
  }

  // ---- out of the way of one much bigger than it (an elk, a bear) that comes on within most of a metre of its body
  // and does not go round it: aside out of the line it goes along, and a little away from it, a few metres; in the
  // water, under it and along the river away from it; on the bank, a few bounds aside and then into the water. While it
  // gets out of the way it is aimed again each frame from where the other is then (a herd comes on from more than one
  // side). Not when it is under the water already, sliding into it or off; nor up a trunk or along a log.
  const giveWay = () => {
    const n = a.now, s = a.name;
    if (s === 'climb' || s === 'log' || s === 'dive' || s === 'rise' || s === 'retreat') return false;
    if (n && (n.hop || (n.leaving != null) || (s === 'plunge' && n.sliding) || s === 'slide' || s === 'wrestle')) return false;
    room(bird, world, bird.at, bird.q);
    const b = roomBig;
    if (!b || roomBigGap > 0.8) return false;
    flatOf(b.q, _fb);
    const dx = bird.at.x - b.at.x, dz = bird.at.z - b.at.z, d = Math.hypot(dx, dz) || 1, across = dx * -_fb.z + dz * _fb.x;
    const side = across === 0 ? (r() < 0.5 ? -1 : 1) : Math.sign(across);
    const ang = Math.atan2(_fb.x * side + 0.4 * dz / d, -_fb.z * side + 0.4 * dx / d), far = manner === 'otter' ? 3 : manner === 'skunk' ? 2.5 : 4;
    const mine = manner === 'otter' ? river(bird.at.x, bird.at.z, _r)[4] : 0, theirs = manner === 'otter' ? river(b.at.x, b.at.z, _r)[4] : 0;
    // (a spot `far` metres off that way, or turned a little one way or the other, where it can go: into _v)
    const spot = () => {
      for (const turn of [0, 0.6, -0.6, 1.2, -1.2]) {
        const x = bird.at.x + Math.cos(ang + turn) * far, z = bird.at.z + Math.sin(ang + turn) * far;
        if (world.walkable(x, z, 0.3)) { _v.set(x, world.height(x, z), z); return true; }
      }
      return false;
    };
    if (n && n.away) {
      if (s === 'trot' && spot()) to.copy(_v);
      return false;
    }
    if (manner === 'otter' && edge(bird.at.x, bird.at.z) < -1.6) a.to('dive', inRiver(mine + (mine >= theirs ? 8 : -8), _v).clone(), 3 + r() * 4);
    else if (spot()) {
      if (manner === 'otter') a.to('plunge', inRiver(mine + (mine >= theirs ? 10 : -10), _w).clone());
      else a.to('trot', _v.clone(), null, manner === 'skunk' ? 'walk' : 'bound', manner === 'skunk' ? walkPace * 1.3 : runPace * 0.8);
    } else if (manner === 'otter') a.to('plunge', inRiver(mine + (mine >= theirs ? 10 : -10), _v).clone());
    else return false;
    a.now.away = true;
    bird.doing = 'getting out of the way';
    return true;
  };
  // ---- how it takes the walker (in place of a bird's flush: life/behave.js)
  const react = (a_, dt) => {
    cool -= dt;
    const d = near(), state = a.name;
    if (state === 'gone' || state === 'off' || state === 'fly') return false;
    if (giveWay()) return true;
    // (getting out of the way of an elk or a bear, it lets the walker stop it only by putting it to flight)
    const away = !!(a.now && a.now.away);
    if (manner === 'otter') {
      // (a party's play: one of it asked to play by another goes to it)
      if (play && joined()) return true;
      // (under the water, or on its way off already, or in already, fleeing: it goes on with it)
      if (state === 'dive' || state === 'rise' || bird.cover || (a.now && (a.now.leaving != null || a.now.flee))) return false;
      // A walker it lets watch it from the trail, a dozen metres off and more; one who comes at it, runs at it, or comes
      // too near, it slips into the water from, and under, and it is out again further along; one who comes right up to
      // it it goes from, under the water. (`d` is the walker's distance as one at a stroll would be: at a walk these are
      // 1.28 times as far, at a run 1.9 times.)
      const land = onLand(), w = a.walkerNear(dt);
      if (d < fleeAt) { tally(true); return a.leave(r() < 0.3 ? Infinity : a.awhile()); }
      if (away) return false;
      if (d < shyAt || (w.coming && d < shyAt * 1.3) || (sudden() && d < shyAt * 1.6)) {
        tally(false);
        if (land) return a.to('plunge', waterBy(_v).clone(), true);
        return diveAway();
      }
      if (d < watchAt && cool <= 0 && (state === 'swim' || state === 'periscope' || state === 'groom' || state === 'rear' || state === 'trot')) {
        cool = 30 + r() * 25;
        return land ? a.to('rear', 1.5 + r() * 2, true) : a.to('periscope', 2 + r() * 2.5, true);
      }
      return false;
    }
    if (manner === 'fisher') {
      if (state === 'climb') return false;                   // (on a trunk it goes on: up is away)
      if (d < shyAt || (sudden() && d < watchAt)) { tally(true); return offFoot(r() < 0.5 ? Infinity : a.awhile(), 'bound') || false; }
      if (away) return false;
      if (d < watchAt && state !== 'eye') { tally(true); return a.to('eye', 0.6 + r() * 1.2, () => offFoot(r() < 0.5 ? Infinity : a.awhile(), 'bound') || a.to('pause', 1, 'look')); }
      return false;
    }
    // the skunk
    if (state === 'retreat') return false;
    if (state === 'warn') { if (d < fleeAt) return a.to('retreat'); return false; }
    if (away) return false;
    if (d < shyAt) { warned += 1; return warned > 2 ? a.to('retreat') : a.to('warn'); }
    if (d < watchAt && state !== 'eye' && cool <= 0) { cool = 20; return a.to('eye', 2 + r() * 3, () => next()); }
    return false;
  };
  const tally = (off) => { bird.flushes = (bird.flushes || 0) + 1; if (bird.who) { bird.who.flushed = (bird.who.flushed || 0) + 1; if (off) bird.who.off = (bird.who.off || 0) + 1; } };

  // ---- going and coming, its own way
  const leave = (seconds) => {
    if (a.cast) return false;
    if (manner === 'otter') {
      if (edge(bird.at.x, bird.at.z) < -1.6) return a.to('dive', inRiver(home.centre + (r() < 0.5 ? -1 : 1) * home.reach, _v).clone(), 30, seconds);
      return a.to('plunge', waterBy(_v).clone(), true, seconds);
    }
    return offFoot(seconds, manner === 'skunk' ? 'walk' : 'bound');
  };
  const come = (target, landing, ...args) => onFoot(target, [landing, ...args], manner === 'skunk' ? 'walk' : 'bound');

  // (where it begins: of up to twelve places `pick` gives, into _p1 with a heading, the first with half a metre of room
  // round it, or the one with the most)
  let picked = 0;
  const place = (pick) => {
    let best = -Infinity, kept = 0;
    for (let tries = 0; tries < 12 && best < 0.5; tries += 1) {
      const hd = pick(), g = roomAt(_p1, facing(hd, _q1));
      if (g > best) { best = g; bird.at.copy(_p1); heading = hd; kept = picked; }
    }
    picked = kept; face();
  };
  const begin = () => {
    if (manner === 'otter') {
      // there from the first: out on a bar about some of its business, or in the water
      if ((!bird.life || bird.life.first) && r() < 0.45 && home.hauls.length) {
        place(() => { const s = home.hauls[Math.floor(r() * home.hauls.length)]; _p1.set(s.x, world.height(s.x, s.z), s.z); return r() * 6.283; });
        ashore = 1 + Math.floor(r() * 3);
        return onBar();
      }
      place(() => { picked = home.centre + (r() - 0.5) * home.reach; inRiver(picked, _p1); return r() * 6.283; });
      if (bird.life && !bird.life.first) {
        // in under the water, out of sight, and up somewhere in its stretch a moment later (`a.to` lets go of the cover)
        bird.at.y = Math.max(world.height(bird.at.x, bird.at.z) + 0.1, water(bird.at.x, bird.at.z) - sink - 0.8);
        a.to('dive', inRiver(picked + (r() - 0.5) * 8, _v).clone(), 1.5 + r() * 2); a.now.t = 1;
        bird.cover = true;
        return true;
      }
      return next();
    }
    // the fisher and the skunk: there from the first, or in on foot from out of sight
    if (!bird.life || bird.life.first) {
      place(() => { const x = home.x + (r() - 0.5) * 6, z = home.z + (r() - 0.5) * 6; _p1.set(x, world.height(x, z), z); return r() * 6.283; });
      return next();
    }
    const x = home.x + (r() - 0.5) * 6, z = home.z + (r() - 0.5) * 6;
    if (!come(_w.set(x, world.height(x, z), z), 'pause', 1 + r() * 2, 'sniff')) { bird.left = a.awhile(); a.to('gone'); }
  };

  return { activities, react, leave, come, begin };
}

export default {
  // what a weasel's way holds besides what every way has (life/families/index.js)
  fields: {
    manner: oneOf('otter', 'fisher', 'skunk'),      // which life it lives (above)
    pace: nums(3),                                  // m/s: walking, bounding, swimming
    wary: nums(3),                                  // m, at a stroll (further from one who runs): it notices the walker, it moves off, it goes
  },
  act: (way) => (bird, world) => live(bird, world, way, mustelid),
  home: (way) => (habitat, r, taken = []) => (way.manner === 'otter' ? otterHome(habitat, r) : way.manner === 'fisher' ? fisherHome(habitat, r, taken) : skunkHome(habitat, r, taken)),
};
