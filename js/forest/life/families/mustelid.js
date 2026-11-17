import * as THREE from 'three';
import { frame, UP, pace, spot } from '../agents.js';
import { live } from '../behave.js';
import { nums, oneOf } from '../bodies.js';
import { onTrunk } from '../perch.js';
import { river, SHAPE } from '../../world/land.js';

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
  if (!world.free(_p2.set(at.x, at.y + body.high * 0.5, at.z), bird, half + body.wide + ROOM)) return ROOM * 0.99;
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
function otterHome(habitat, r) {
  // a stretch of the river within sight of the walk (the beach and the bend below the clearing), and the places on
  // its bars, out of the water on the cobbles, where it can haul out
  const centre = 395 + r() * 55, hauls = [];
  for (let down = centre - 30; down <= centre + 30; down += 3) {
    for (const side of [-1, 1]) {
      riverPoint(down, side * (SHAPE.HALF + 0.9 + r() * 1.2), _v);
      const from = edge(_v.x, _v.z);
      if (from < 0.3 || from > 3 || !habitat.walkable(_v.x, _v.z, 0.3)) continue;
      hauls.push({ x: _v.x, z: _v.z, down, side });
    }
  }
  return { manner: 'otter', centre, reach: 30, hauls };
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
  const sink = bird.body.high - 0.035;                 // how far under the water's top its origin lies as it swims
  let cyc = r() * 10, heading = r() * 6.283, cool = 0, warned = 0, stuck = false;
  const to = new THREE.Vector3(), from = new THREE.Vector3();

  const flat = (p) => Math.hypot(p.x - world.eye.x, p.z - world.eye.z);
  const near = () => flat(bird.at) / pace(world);      // the walker's distance, as one at a stroll would be
  const sudden = () => world.walker && world.walker.sudden > 0;
  const face = (up = UP) => frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), up, bird.q);
  const steer = (x, z, rate, dt) => { const d = wrap(Math.atan2(z - bird.at.z, x - bird.at.x) - heading), most = rate * dt; heading += clamp(d, -most, most); return Math.abs(d); };
  const watch = (k = 1) => {                            // the head turned to the walker
    const d = wrap(Math.atan2(world.eye.z - bird.at.z, world.eye.x - bird.at.x) - heading);
    bird.want.head = { yaw: clamp(d, -1.5, 1.5) * k, pitch: 0.12 * k };
  };
  const pose = (extra) => ({ ...NEUTRAL(), cycle: cyc, ...extra });
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
    cyc += (speed * dt) / (bound > 0.5 ? strides.gallop : strides.walk);
    Object.assign(bird.want, { walk: speed > 0.02 ? 1 - bound : 0, gallop: speed > 0.02 ? bound : 0, cycle: cyc });
    return true;
  };
  // a step through the water, at the surface (or `depth` under it), turned a little one way or the other round another
  // animal in its way, over it or under it as much as beside it (seen from above, as it keeps its room: above); false
  // where the way on is into the shallows (it hauls out on purpose). With no way round, it holds where it is a moment.
  const stepIn = (speed, dt, depth = 0) => {
    let now = null;
    for (const turn of SIDESTEP) {
      const hd = heading + turn, nx = bird.at.x + Math.cos(hd) * speed * dt, nz = bird.at.z + Math.sin(hd) * speed * dt;
      if (edge(nx, nz) > -1.6) { if (turn === 0) return false; continue; }
      const g = roomAt(_p1.set(nx, bird.at.y, nz), facing(hd, _q1));
      if (g < ROOM && g < (now ??= roomAt(bird.at, bird.q)) - 1e-6) continue;
      heading = hd; bird.at.x = nx; bird.at.z = nz;
      const top = water(nx, nz) - sink - depth, bed = world.height(nx, nz) + 0.06;
      bird.at.y = Math.max(bed, top);
      cyc += dt * (0.8 + speed / 0.32);
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
      enter: (a_, at, then, gait = null, speed = walkPace) => { to.copy(at); a.now.then = then; a.now.gait = gait; a.now.speed = speed; },
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
        bird.doing = n.gait === 'bound' ? 'bounding over the floor' : manner === 'skunk' ? 'waddling, nose down' : 'walking';
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

  // ---- the otter
  if (manner === 'otter') Object.assign(activities, {
    // at the surface, to `to`: the head and the line of the back out of the water; quick, it porpoises
    swim: {
      pose: () => pose({ swim: 1, neck: 0.85 }),
      enter: (a_, at, speed = swimPace) => { to.copy(at); a.now.speed = speed; a.now.t = 0; bird.cover = false; bird.doing = speed > swimPace * 1.4 ? 'swimming fast, porpoising' : 'swimming at the surface'; },
      step: (a_, dt) => {
        const n = a.now; n.t += dt;
        steer(to.x, to.z, 1.6, dt);
        const fast = n.speed > swimPace * 1.4, arc = fast ? Math.sin(n.t * 4.2) : 0;
        if (!stepIn(n.speed, dt, fast ? -0.09 * arc : 0) || Math.hypot(to.x - bird.at.x, to.z - bird.at.z) < 0.6) return next();
        face(_w.set(-0.25 * arc * Math.cos(heading), 1, -0.25 * arc * Math.sin(heading)).normalize());
        bird.want.arch = fast ? 0.5 * Math.cos(n.t * 4.2) : 0;
        if (r() < dt * 0.04 && bird.who && bird.who.party && bird.who.party.members.length > 1) world.say(bird, 'chirp', 30);
      },
    },
    // down to the bottom and along it, out of sight, for `seconds`; up again at `to`
    dive: {
      pose: () => pose({ swim: 1, neck: 0.5, arch: 0.6 }),
      enter: (a_, at, seconds, leaving = null) => { to.copy(at); a.now.left = seconds; a.now.leaving = leaving; a.now.t = 0; bird.doing = 'diving'; },
      step: (a_, dt) => {
        const n = a.now; n.t += dt; n.left -= dt;
        const depth = Math.min(0.9, n.t * 0.9), bed = world.height(bird.at.x, bird.at.z), surface = water(bird.at.x, bird.at.z);
        steer(to.x, to.z, 1.2, dt);
        stepIn(n.t < 1 ? swimPace : n.leaving !== null ? swimPace * 1.6 : swimPace * 0.8, dt, depth);
        face(_w.set(0.6 * Math.cos(heading), n.t < 1 ? 0.5 : 1, 0.6 * Math.sin(heading)).normalize());
        // out of sight once its back is a third of a metre under the water (a tenth, down on the bottom, where it is dark)
        const under = surface - (bird.at.y + bird.body.high);
        bird.cover = under > 0.3 || (bird.at.y <= bed + 0.07 && under > 0.1 && n.t > 0.8);
        if (bird.cover) bird.doing = 'under the water';
        // Going, it goes only from out of the walker's plain view: a third of a metre under the water (its cover, which
        // the count takes for out of sight, and which `a.to` lets go of: it still has it as it goes), or where the
        // walker cannot plainly see it (round the bend, behind the bank's trees, too far off: life/visit.js `plainly`)
        if (n.leaving !== null && n.t > 1.5 && (under > 0.3 || !world.plainly(bird))) { bird.left = n.leaving; a.to('gone'); bird.cover = under > 0.3; return; }
        if (n.left <= 0 && Math.hypot(to.x - bird.at.x, to.z - bird.at.z) < 2.5) a.to('rise');
        else if (n.left < -6) a.to('rise');
      },
    },
    // up from the bottom, and on with what it does
    rise: {
      pose: () => pose({ swim: 1, neck: 0.9 }),
      enter: () => { a.now.t = 0; bird.doing = 'coming up'; },
      step: (a_, dt) => {
        a.now.t += dt;
        const surface = water(bird.at.x, bird.at.z) - sink;
        bird.at.y = Math.min(surface, bird.at.y + dt * 0.6);
        stepIn(swimPace * 0.5, dt, Math.max(0, surface - bird.at.y));
        bird.cover = water(bird.at.x, bird.at.z) - (bird.at.y + bird.body.high) > 0.3;
        face();
        if (bird.at.y >= surface - 0.005) { bird.cover = false; next(); }
      },
    },
    // at the surface with its head and neck out, looking about (or at the walker), and snorting
    periscope: {
      pose: () => pose({ swim: 1, neck: 1.1, rear: 0, ears: 1 }),
      enter: (a_, seconds, at = false) => { a.now.left = seconds; a.now.at = at; a.now.t = 0; bird.doing = at ? 'up in the water, looking at you' : 'up in the water, looking about'; if (at) world.say(bird, 'snort', 40); },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt; n.t += dt;
        bird.at.y = water(bird.at.x, bird.at.z) - sink + 0.07 * Math.min(1, n.t * 3);
        cyc += dt * 0.9; bird.want.cycle = cyc;
        if (n.at) watch(); else if ((n.glance = (n.glance || 0) - dt) < 0) { n.glance = 0.7 + r(); bird.want.head = { yaw: (r() - 0.5) * 2.4, pitch: 0.15 }; }
        if (n.left <= 0) next();
      },
    },
    // out onto a bar: to the water's edge by it, and up the cobbles
    haul: {
      pose: () => pose({ swim: 1, neck: 0.8 }),
      enter: (a_, spot) => { a.now.spot = spot; a.now.out = false; spot.taken = bird; to.set(spot.x, 0, spot.z); bird.doing = 'swimming in to the bank'; },
      step: (a_, dt) => {
        const n = a.now;
        steer(to.x, to.z, 2.5, dt);
        if (!n.out) {
          if (stepIn(swimPace * 0.8, dt)) return;
          n.out = true; Object.assign(bird.want, { swim: 0, neck: 0.6 });
        }
        bird.doing = 'climbing out onto the bank';
        glide(walkPace, dt);
        const g = world.height(bird.at.x, bird.at.z), s = water(bird.at.x, bird.at.z) - sink;
        bird.at.y = Math.max(g, Math.min(s + 0.5, bird.at.y + dt * 0.4));
        bird.want.swim = clamp((water(bird.at.x, bird.at.z) - g - 0.08) / 0.15, 0, 1);
        cyc += (walkPace * dt) / strides.walk; Object.assign(bird.want, { walk: 1, cycle: cyc }); face();
        if (Math.hypot(to.x - bird.at.x, to.z - bird.at.z) < 0.3 || edge(bird.at.x, bird.at.z) > 0.8) { ground(); a.to('groom'); }
      },
    },
    // on the bar: lying, rolling about to dry, grooming its flanks and its tail
    groom: {
      pose: () => pose({ lie: 1, neck: 0.4 }),
      enter: () => { a.now.left = 8 + r() * 18; a.now.turn = 0; bird.doing = 'grooming on the bar'; },
      step: (a_, dt) => {
        const n = a.now; n.left -= dt; n.turn -= dt;
        ground();
        if (n.turn < 0) { n.turn = 1.2 + r() * 2; const side = r() < 0.5 ? -1 : 1; bird.want.head = { yaw: side * (0.9 + r() * 0.6), pitch: -0.4 }; bird.want.neck = 0.25 + r() * 0.3; bird.want.arch = 0.4 * r(); }
        if (n.left > 0) return;
        // up, a bound along the bar, and back into the water
        const fwd = heading + (r() - 0.5) * 1.4;
        riverPoint(clamp(home.centre + (r() - 0.5) * 20, home.centre - home.reach, home.centre + home.reach), (r() - 0.5) * 4, _v);
        from.set(bird.at.x + Math.cos(fwd) * 3, 0, bird.at.z + Math.sin(fwd) * 3);
        a.to('romp', world.walkable(from.x, from.z, 0.3) ? from.clone() : null, _v.clone());
      },
    },
    // a few bounds along the bar, and a slide down into the water
    romp: {
      pose: () => pose({ neck: 0.6 }),
      enter: (a_, along, into, leaving = null) => { a.now.along = along; a.now.into = into; a.now.leaving = leaving; a.now.sliding = !along; bird.doing = 'bounding along the bank'; },
      step: (a_, dt) => {
        const n = a.now;
        if (!n.sliding) {
          steer(n.along.x, n.along.z, 4, dt);
          if (Math.hypot(n.along.x - bird.at.x, n.along.z - bird.at.z) < 0.4 || !stepOn(runPace * 0.75, dt, 'bound')) n.sliding = true;
          return;
        }
        bird.doing = 'sliding into the water';
        steer(n.into.x, n.into.z, 4, dt);
        glide(runPace * 0.7, dt);
        const g = world.height(bird.at.x, bird.at.z), s = water(bird.at.x, bird.at.z) - sink;
        bird.at.y = Math.max(s, Math.min(g, bird.at.y + 0.05));
        cyc += (runPace * 0.7 * dt) / strides.gallop;
        Object.assign(bird.want, { gallop: g > s ? 1 : 0, swim: g > s ? 0 : 1, arch: -0.4, cycle: cyc, neck: 0.5 }); face();
        if (edge(bird.at.x, bird.at.z) < -1.8) {
          if (n.leaving !== null) return a.to('dive', inRiver(home.centre + (r() - 0.5) * 50, _v).clone(), 4, n.leaving);
          a.to('swim', inRiver(home.centre + (r() - 0.5) * 30, _v).clone());
        }
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
    } finally { known = false; }
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
    if (manner === 'otter') {
      const inWater = edge(bird.at.x, bird.at.z) < -1;
      if (!inWater) return a.to('romp', null, inRiver(home.centre + (r() - 0.5) * 20, _v).clone());
      const k = r();
      if (k < 0.3) return a.to('dive', inRiver(home.centre + (r() - 0.5) * home.reach, _v).clone(), 4 + r() * 10);
      if (k < 0.6) return a.to('periscope', 2 + r() * 4);
      if (k < 0.75 && home.hauls.length) { const spot = freeHaul(); if (spot) return a.to('haul', spot); }
      return a.to('swim', inRiver(home.centre + (r() - 0.5) * 2 * home.reach, _v).clone(), swimPace * (r() < 0.25 ? 2 : 1));
    }
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
  function freeHaul() {
    for (let tries = 0; tries < 6; tries += 1) {
      const spot = home.hauls[Math.floor(r() * home.hauls.length)], holder = spot.taken;
      if (holder && holder !== bird && holder.left == null && (holder.state === 'haul' || holder.state === 'groom' || holder.state === 'romp')) continue;
      if (world.free(_p1.set(spot.x, world.height(spot.x, spot.z), spot.z), bird, 1.5)) return spot;
    }
    return null;
  }
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
    if (n && (n.hop || (n.leaving != null) || (s === 'romp' && n.sliding))) return false;
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
      else if (s === 'romp' && n.along && spot()) n.along.copy(_v);
      return false;
    }
    if (manner === 'otter' && edge(bird.at.x, bird.at.z) < -1.6) a.to('dive', inRiver(mine + (mine >= theirs ? 8 : -8), _v).clone(), 3 + r() * 4);
    else if (spot()) {
      if (manner === 'otter') a.to('romp', _v.clone(), inRiver(mine + (mine >= theirs ? 10 : -10), _w).clone());
      else a.to('trot', _v.clone(), null, manner === 'skunk' ? 'walk' : 'bound', manner === 'skunk' ? walkPace * 1.3 : runPace * 0.8);
    } else if (manner === 'otter') a.to('romp', null, inRiver(mine + (mine >= theirs ? 10 : -10), _v).clone());
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
      // (under the water, or on its way off already, sliding in to go: it goes on with it)
      if (state === 'dive' || state === 'rise' || bird.cover || (a.now && a.now.leaving != null)) return false;
      const onLand = state === 'groom' || state === 'romp' || (state === 'haul' && a.now.out);
      if (d < fleeAt || (sudden() && d < shyAt * 1.5)) { tally(true); return a.leave(r() < 0.45 ? Infinity : a.awhile()); }
      if (away) return false;
      if (d < shyAt) {
        if (onLand) { if (state !== 'romp' || !a.now.sliding) { tally(false); return a.to('romp', null, inRiver(home.centre + (r() - 0.5) * 20, _v).clone()); } return false; }
        // down, and up again further from the walker
        tally(false);
        for (let tries = 0; tries < 8; tries += 1) { inRiver(home.centre + (r() - 0.5) * 2 * home.reach, _v); if (flat(_v) > flat(bird.at) + 12) return a.to('dive', _v.clone(), 5 + r() * 8); }
        return a.leave(a.awhile());
      }
      if (d < watchAt && cool <= 0 && !onLand && state !== 'periscope') { cool = 25; return a.to('periscope', 2.5 + r() * 4, true); }
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
      return a.to('romp', null, inRiver(home.centre, _v).clone(), seconds);
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
      place(() => { picked = home.centre + (r() - 0.5) * home.reach; inRiver(picked, _p1); return r() * 6.283; });
      if (bird.life && !bird.life.first) {
        // in under the water, out of sight, and up somewhere in its stretch a moment later (`a.to` lets go of the cover)
        bird.at.y = Math.max(world.height(bird.at.x, bird.at.z) + 0.1, water(bird.at.x, bird.at.z) - sink - 0.8);
        a.to('dive', inRiver(picked + (r() - 0.5) * 16, _v).clone(), 2 + r() * 4); a.now.t = 1;
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
