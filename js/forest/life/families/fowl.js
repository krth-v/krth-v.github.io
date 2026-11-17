import * as THREE from 'three';
import { onLimb } from '../perch.js';
import { frame, UP, spot, flying } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums } from '../bodies.js';

// Grouse (the grouse's, 2026-11-16): the Ruffed Grouse and the Sooty Grouse (life/species/ruffedGrouse.js,
// sootyGrouse.js), birds of the forest's floor that walk.
//
// What each does, as activities on life/behave.js:
//   forage  on the floor under the trees beside the walk near its home (or the clearing's edge, where the walk crosses
//           it): it walks, a foot at a time, its head held still and then thrust on (life/parts/gait.js), and pecks at
//           buds, new leaves and the first green; now and then it stands up and looks about; and when it has fed a
//           while it goes back to its log or up into its tree, or flies to feed somewhere else along the walk, or (now
//           and then) off out of sight
//   log     the Ruffed Grouse's: the male on his drumming log. He stands, turns, and every few minutes drums: upright,
//           braced on his tail, he beats the air with his wings, slow thumps that quicken into a roll (said as `drum`,
//           which sound/grouse.js makes); after a drum, now and then, he struts on the log with his ruffs raised and
//           his tail fanned (life/parts/display.js: `display`)
//   tree    on a limb of a conifer by the trunk: the Sooty Grouse male hooting from high in his tree, in bouts of
//           series (said as `hoot`), his comb swollen and his tail cocked; by night roosting there. A Ruffed Grouse
//           flushed into a tree sits in it a while and comes down
//   roost   the Ruffed Grouse by night: on the ground, under a fern if there is one near
//   fly     a burst of quick wingbeats, then a glide on stiff wings held a little down (`glide`: the share of the
//           flight after which it glides)
// It lives by the owner's rule for every bird (life/behave.js): trusting its colour it goes on with what it is doing as
// the walker passes; when they come within its `flush` distance (further at a run), or move suddenly within its
// `startle` distance, it bursts up with a roar of wings (said as `flush`, which sound/grouse.js makes) and glides low
// off through the trunks to land out of the walker's sight further off (with the chance `near`), or into a tree, or
// it leaves (off out of sight, for good with the chance `gone`).
//
// From the sources (the species' sheets): where each lives and what it eats in summer, that both walk and run on the
// ground, burst into flight with loud wingbeats and are better at short bursts than sustained flight; that the ruffed
// male drums from a log, puffed out, ruff raised and tail fanned, the beats starting slow and speeding up (the drum's
// timing is from a recording, sound/grouse.js); that the sooty male hoots from high in a conifer, next to the trunk,
// and struts with his tail raised and fanned; that the sooty is usually single and fairly wary. The agent's own: every
// distance, time and chance below, the walk's step and the head's bob, how often each drums or hoots, where each
// roosts, and that a flushed ruffed grouse goes into a tree one time in four.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const CONIFERS = new Set(['pole', 'mature', 'spruce', 'slope', 'cedar']);
const HARDWOODS = new Set(['alder', 'maple', 'vine', 'willow', 'apple']);
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _near = [];

// Ground a grouse walks and feeds on: the floor, the grass or the wet ground; not the tread, not a log or a trunk or a
// stone, not a steep bank
const footing = (place, x, z) => {
  const kind = place.ground(x, z);
  if (kind !== 'floor' && kind !== 'grass' && kind !== 'wet') return false;
  if (place.solidAt(x, z, 0.3)) return false;
  const e = 0.6, h = place.height, gx = h(x + e, z) - h(x - e, z), gz = h(x, z + e) - h(x, z - e);
  return Math.hypot(gx, gz) / (2 * e) < 0.6;
};

// The drum's beats, seconds from its first (sound/grouse.js plays the same law): gaps that shorten by a seventh each,
// from 0.89 s to about 0.14 s, then quicken into a roll of beats 65 ms apart for 1.6 s, which dies away. Timed from
// the National Park Service's recording (Yellowstone sound library, Ruffed Grouse 001): seventeen beats over 5.7 s,
// then the roll; 42 beats in 7.4 s here.
const drumBeats = () => {
  const beats = [];
  let t = 0, gap = 0.89;
  while (gap > 0.14) { beats.push(t); t += gap; gap *= 0.86; }
  for (let k = 0; k < 4; k += 1) { beats.push(t); t += gap; gap = Math.max(0.065, gap * 0.8); }
  for (const end = t + 1.6; t < end; t += 0.065) beats.push(t);
  return beats;
};
const BEATS = drumBeats();

function fowl(a) {
  const { bird, world, way, r } = a, home = bird.home, sheet = bird.sheet, P = sheet.poses;
  const stand = P.perched, peck = P.peck || stand, strut = P.display || stand, drum = P.drum || null, branch = P.branch || stand, hoot = P.hoot || branch;
  const S = sheet.shape.leg.tarsus * 0.0019;                         // a step: about twice the tarsus (m)
  const p = spot(), q = new THREE.Quaternion(), to = new THREE.Vector3(), mid = new THREE.Vector3(), across = new THREE.Vector3(), over = new THREE.Vector3();
  const feet = { mode: 'flat', walk: [0, 0, 0, 0] };
  let heading = r() * 6.283;
  // where it is, kept across its activities: the limb it is on in a tree, and which way it faces across it
  const at = { perch: null, side: 1, radius: 0.03 };
  const between = ([least, most]) => least + r() * (most - least);
  const night = () => world.day < 0.08;
  const low = () => world.sunHeight < 16;                           // morning and evening, when the sun is low
  const face = () => frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q);
  const ground = (x, z, out) => out.set(x, world.height(x, z), z);
  const roar = () => world.say(bird, 'flush', way.roar.reach);

  // A whole pose from one of the sheet's: every field the page eases, so that nothing is carried over from the last
  // (`display`, `reach` and `dip` are named in every one: life/parts/display.js, gait.js)
  const full = (base) => ({
    pitch: base.pitch, lift: base.lift, lean: 0, roll: 0, spread: base.spread ?? 0, flap: base.flap ?? 0, hand: base.hand ?? 0, sweep: base.sweep ?? 0,
    droop: base.droop ?? 0.02, gape: base.gape ?? 0, head: { yaw: 0, pitch: base.head && base.head.pitch != null ? base.head.pitch : 0.1, roll: 0 },
    tail: { pitch: base.tail && base.tail.pitch != null ? base.tail.pitch : 0, fan: base.tail && base.tail.fan != null ? base.tail.fan : 0, yaw: 0,
      prop: base.tail && base.tail.prop != null ? base.tail.prop : null },
    feet: base.feet, display: base.display ?? 0, reach: base.reach ?? 0, dip: base.dip ?? 0 });
  const hold = (base, extra) => Object.assign(bird.want, full(base), extra);
  // it looks about, in turns of the head
  let glanceIn = 0, glance = { yaw: 0, pitch: 0.1, roll: 0 };
  const looking = (dt, pitch = 0.1) => { glanceIn -= dt; if (glanceIn < 0) { glanceIn = 0.6 + r() * 2.2; glance = { yaw: (r() - 0.5) * 1.6, pitch: pitch + (r() - 0.5) * 0.2, roll: 0 }; } return glance; };

  // ---- on the ground
  // Its feeding ground: the floor beside the walk near its home, 18 m either way along it and 2.2 to 11 m from its middle
  // line, mostly on its home's side (where a walker passes it, and may see it: fed further in, among the ferns, a grouse
  // 20 m off was a fleck of white in a frame of fronds). `edge`: where its home is along the walk, and on which side.
  const trail = world.trail, _p = new THREE.Vector3(), _t = new THREE.Vector3();
  const edge = (() => {
    const [, s] = trail.locate(home.x, home.z);
    trail.sample(s, _p, _t);
    return { s, side: Math.sign((home.x - _p.x) * -_t.z + (home.z - _p.z) * _t.x) || 1 };
  })();
  // somewhere on that ground: on ground it walks, clear of the walker, and that no other animal has
  const edgeSpot = (out) => {
    for (let tries = 0; tries < 14; tries += 1) {
      const L = trail.length, s = (((edge.s + (r() - 0.5) * 36) % L) + L) % L, side = (r() < 0.8 ? edge.side : -edge.side) * (2.2 + r() * 8.8);
      trail.sample(s, _p, _t);
      const x = _p.x - _t.z * side, z = _p.z + _t.x * side;
      if (!footing(world, x, z)) continue;
      ground(x, z, out);
      if (!a.clear(out, 0.5) || !world.free(out, bird, 0.6)) continue;
      return out;
    }
    return null;
  };
  // is the straight way on foot from `from` to (x, z) clear of logs, trunks and stumps (tried every 0.4 m)?
  const wayClear = (from, x, z) => {
    const n = Math.ceil(Math.hypot(x - from.x, z - from.z) / 0.4);
    for (let k = 1; k < n; k += 1) if (world.solidAt(from.x + ((x - from.x) * k) / n, from.z + ((z - from.z) * k) / n, 0.12)) return false;
    return true;
  };
  // a step or a few from `from`, `near` to `far` metres: on ground it walks, off the tread, no further from the walk than
  // 12 m (or than it is: flushed further off, it feeds where it landed until it goes back), clear and free; and, for a
  // walk (`walks`; not for a hop down off its log), with no log or trunk in the way
  const feedSpot = (from, near, far, out, walks = true) => {
    const most = Math.max(12, trail.distance(from.x, from.z) + 1);
    for (let tries = 0; tries < 12; tries += 1) {
      const turn = heading + (r() - 0.5) * 2.6 + (tries > 6 ? Math.PI : 0), d = near + r() * (far - near);
      const x = from.x + Math.cos(turn) * d, z = from.z + Math.sin(turn) * d, off = trail.distance(x, z);
      if (off < 1.4 || off > most || !footing(world, x, z) || (walks && !wayClear(from, x, z))) continue;
      ground(x, z, out);
      if (!a.clear(out, 0.5) || !world.free(out, bird, 0.6)) continue;
      return out;
    }
    return null;
  };
  // A walk, a foot at a time (life/parts/gait.js `feet.walk`): the foot that swings is lifted and put down a step on,
  // the other goes back under the body as it moves over it; the head is held still and thrust on at each step. True
  // while it walks.
  const walking = (now, dt, base = stand) => {
    const w = now.walk;
    if (!w) return false;
    const dx = w.to.x - bird.at.x, dz = w.to.z - bird.at.z, left = Math.hypot(dx, dz);
    if (left < 0.03 || (world.crowd(w.to, bird) < 0.45)) { now.walk = null; feet.walk.fill(0); return false; }
    let turn = Math.atan2(dz, dx) - heading;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    heading += clamp(turn, -dt * 2.4, dt * 2.4); face();
    const move = Math.min(left, way.walk * (Math.abs(turn) > 1.1 ? 0.35 : 1) * dt);
    // (another animal in the way, not only at the end of it, or a log, a trunk or a stump: it stops short. One that is
    // already within a solid's reach, as it can be where it came down, may walk out of it)
    _v.set(bird.at.x + Math.cos(heading) * (move + 0.25), bird.at.y, bird.at.z + Math.sin(heading) * (move + 0.25));
    if (world.crowd(_v, bird) < 0.3 || (world.solidAt(_v.x, _v.z, 0.12) && !world.solidAt(bird.at.x, bird.at.z, 0.12))) { now.walk = null; feet.walk.fill(0); return false; }
    bird.at.x += Math.cos(heading) * move; bird.at.z += Math.sin(heading) * move; bird.at.y = world.height(bird.at.x, bird.at.z);
    w.phase = (w.phase + move / (2 * S)) % 1;
    const swing = w.phase < 0.5 ? 0 : 2, planted = 2 - swing, u = (w.phase % 0.5) / 0.5;
    feet.walk[swing] = -S / 2 + S * u; feet.walk[swing + 1] = 0.28 * S * Math.sin(Math.PI * u);
    feet.walk[planted] = S / 2 - S * u; feet.walk[planted + 1] = 0;
    const A = 0.2 * S, reach = u < 0.25 ? -A + 2 * A * (u / 0.25) : A - 2 * A * ((u - 0.25) / 0.75);
    hold(base, { feet, reach, lift: base.lift * (1 - 0.012 * Math.sin(Math.PI * 2 * u)), head: { yaw: 0, pitch: -0.04, roll: 0 } });
    return true;
  };
  const feedFor = () => between(way.feed);
  // what it says it is eating, in May
  const FOOD = ['pecking at new leaves', 'picking buds from a low shoot', 'pecking at the first green', 'picking at the litter'];

  // ---- in a tree: a place on a limb, across it and facing `side`; fills `pos` and `quat` and returns the limb's radius
  const place = (perch, side, pos, quat) => {
    const rad = onLimb(perch.tree.place, perch.tree.limbs, perch.tube, perch.share, p);
    mid.copy(p.point); mid.y -= rad * 0.96;
    across.crossVectors(p.along, UP).normalize().multiplyScalar(side);
    over.copy(UP).addScaledVector(p.along, -p.along.y).normalize();
    pos.copy(mid).addScaledVector(over, rad * 0.96);
    frame(across, over, quat);
    return rad;
  };
  // a limb high in a conifer near `x, z` (the home's tree first), by the trunk, `high` metres up; free, and clear of the walker
  const limbIn = (tree, high) => {
    if (!tree) return null;
    const all = world.perchesOf(tree).filter((one) => one.share < 0.5 && one.above >= high[0] && one.above <= high[1] && one.radius >= 0.025 && world.free(one.point, bird, 0.5) && a.clear(one.point, 2));
    return all.length ? all[Math.floor(r() * all.length)] : null;
  };
  const treeNear = (x, z, reach, high, away = false) => {
    const trees = world.leafyNear(x, z, reach, []).filter((t) => CONIFERS.has(t.kind));
    for (let tries = 0; tries < 6 && trees.length; tries += 1) {
      const tree = trees[Math.floor(r() * trees.length)];
      if (away && Math.hypot(tree.x - world.eye.x, tree.z - world.eye.z) < Math.hypot(bird.at.x - world.eye.x, bird.at.z - world.eye.z) + 6) continue;
      const one = limbIn(tree, high);
      if (one) return one;
    }
    return null;
  };
  const upInto = (perch, doing, put = false) => {
    const side = r() < 0.5 ? 1 : -1;
    place(perch, side, to, q);
    if (put) roar();
    a.fly({ at: to.clone(), q: q.clone(), rise: 0.5, floor: world.height, speed: way.speed * (put ? 1 : 0.8) }, 'tree', perch, side);
    bird.doing = doing;
    return true;
  };

  // ---- the activities
  const forage = {
    pose: () => full(stand),
    enter(a, until = feedFor(), still = 0) {
      feet.walk.fill(0);
      Object.assign(a.now, { until, wait: still || 0.3 + r() * 1.2, walk: null, pecks: 0, peck: 0, look: 3 + r() * 9, up: 0, food: FOOD[Math.floor(r() * FOOD.length)] });
    },
    step(a, dt) {
      const now = a.now;
      now.until -= dt; now.wait -= dt; now.look -= dt;
      if (night() && !now.walk) { bed(); return; }
      if (walking(now, dt)) { bird.doing = 'walking over the forest floor'; return; }
      if (now.peck > 0) {
        now.peck -= dt;
        hold(now.peck > 0.22 ? peck : stand, { feet: stand.feet, gape: now.peck > 0.22 && now.peck < 0.36 ? 0.25 : 0 });
        bird.doing = now.food;
        return;
      }
      if (now.up > 0) { now.up -= dt; hold(stand, { pitch: stand.pitch + 0.14, lift: stand.lift * 1.08, head: looking(dt, 0.25) }); bird.doing = 'standing tall, looking about'; return; }
      hold(stand, { head: looking(dt, 0) });
      bird.doing = 'standing on the forest floor';
      if (now.wait > 0) return;
      if (now.until < 0) { onwards(); return; }
      const roll = r();
      if (now.look < 0) { now.look = 4 + r() * 10; now.up = 1 + r() * 1.8; return; }
      if (now.pecks > 0 || roll < 0.55) {
        if (now.pecks <= 0) now.pecks = 1 + Math.floor(r() * 4);
        now.pecks -= 1; now.peck = 0.5; now.wait = 0.12 + r() * 0.4;
        if (r() < 0.2) now.food = FOOD[Math.floor(r() * FOOD.length)];
        return;
      }
      const next = feedSpot(bird.at, 0.5, 2.8, to);
      if (next) { now.walk = { to: next.clone(), phase: 0 }; return; }
      now.wait = 0.8 + r();
    },
  };
  // (fed a while: back to its log, up into its tree, on to feed somewhere else, or off for a while)
  const onwards = () => {
    if (r() < 0.1 && a.leave(a.awhile())) return;
    if (home.stand && !night()) {
      const d = bird.at.distanceTo(home.stand.point);
      if (d < 12 && world.free(home.stand.point, bird, 0.6) && a.clear(home.stand.point)) {
        a.now.walk = null;
        a.fly({ at: home.stand.point.clone(), q: standing(), rise: 0.2, floor: world.height, speed: way.speed * 0.45 }, 'log');
        bird.doing = 'up onto its log';
        return;
      }
      if (world.free(home.stand.point, bird, 0.6) && a.clear(home.stand.point)) {
        a.fly({ at: home.stand.point.clone(), q: standing(), rise: 0.3, floor: world.height, speed: way.speed * 0.8 }, 'log');
        bird.doing = 'flying back to its log';
        return;
      }
    }
    if (home.tree && way.tree && !night() && r() < 0.6) {
      const one = limbIn(home.tree, way.tree.high) || treeNear(bird.at.x, bird.at.z, 25, way.tree.high);
      if (one) { upInto(one, 'flying up into a conifer'); return; }
    }
    const next = edgeSpot(to);
    if (next) {
      heading = Math.atan2(next.z - bird.at.z, next.x - bird.at.x);
      a.fly({ at: next.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), rise: 0.3, floor: world.height, speed: way.speed * 0.7 }, 'forage', feedFor());
      bird.doing = 'flying on to feed';
      return;
    }
    a.now.until = 20 + r() * 30;
  };
  // the way it stands on its log: along it, one way or the other
  const standing = () => {
    const s = home.stand;
    heading = Math.atan2(s.along.z, s.along.x) + (r() < 0.5 ? 0 : Math.PI);
    return frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone();
  };
  // by night: the ruffed grouse on the ground, under a fern if one is near; the sooty up in its tree
  const bed = () => {
    if (home.tree && way.tree) {
      const one = limbIn(home.tree, way.tree.high) || treeNear(bird.at.x, bird.at.z, 25, way.tree.high);
      if (one) { upInto(one, 'flying up to roost'); return; }
    }
    a.to('roost');
  };

  const log = {
    pose: () => full(stand),
    enter(a, until = between(way.log ? way.log.stay : [300, 900])) {
      bird.at.copy(home.stand.point);
      Object.assign(a.now, { until, drum: 6 + r() * 40, beats: null, strut: 0, turn: 0 });
    },
    step(a, dt) {
      const now = a.now;
      if (now.beats) { drumming(now, dt); return; }
      now.drum -= dt; now.until -= dt;
      if (now.strut > 0) {
        // strutting: the ruffs raised and the tail fanned, turning on the log
        now.strut -= dt; now.turn -= dt;
        if (now.turn < 0) { now.turn = 1.2 + r() * 2; heading += (r() - 0.5) * 1.4; face(); }
        hold(strut, { head: { yaw: 0.25 * Math.sin(world.clock * 7), pitch: strut.head ? strut.head.pitch : -0.1, roll: 0 } });
        bird.doing = 'strutting on his log, ruff raised and tail fanned';
        return;
      }
      if (night() || now.until < 0) { down(); return; }
      if (now.drum <= 0 && drum) { now.beats = { t: -1.1 }; return; }
      now.turn -= dt;
      if (now.turn < 0) { now.turn = 4 + r() * 9; if (r() < 0.4) { heading += Math.PI; face(); } }
      hold(stand, { head: looking(dt, 0.12) });
      bird.doing = 'standing on his drumming log';
    },
  };
  // A drum: braced upright on the log, then the beats, each a stroke of the wings forward and back, too quick to ease
  const drumming = (now, dt) => {
    const b = now.beats;
    b.t += dt;
    bird.doing = 'drumming: beating the air with his wings';
    if (b.t < 0) { hold(drum, { spread: 0, flap: 0, sweep: 0, hand: 0 }); return; }
    if (!b.said) { b.said = true; world.say(bird, 'drum', way.drum.reach, way.drum.time); }
    const last = BEATS[BEATS.length - 1];
    if (b.t > last + 0.6) { now.beats = null; now.drum = between(way.drum.every) * (low() ? 0.7 : 1.3); if (strut !== stand && r() < 0.3) now.strut = 6 + r() * 10; return; }
    let k = 0;
    while (k < BEATS.length - 1 && BEATS[k + 1] <= b.t) k += 1;
    const since = b.t - BEATS[k], roll = BEATS[k] > BEATS[BEATS.length - 1] - 1.7;
    bird.snap = true;
    if (b.t > last) hold(drum, { spread: 0.3, sweep: 0.2, flap: 0, hand: 0 });
    else if (since < (roll ? 0.03 : 0.05)) hold(drum);
    else if (since < (roll ? 0.065 : 0.17)) hold(drum, { spread: 0.8, sweep: 0.25, flap: 0.05 });
    else hold(drum, { spread: 0.4, sweep: 0.25, flap: 0, hand: 0 });
  };
  // off the log: a hop down beside it, to feed
  const down = () => {
    const next = feedSpot(bird.at, 0.8, 3, to, false);
    if (!next) { if (night()) { a.to('roost'); return; } a.now.until = 20; return; }
    heading = Math.atan2(next.z - bird.at.z, next.x - bird.at.x);
    a.fly({ at: next.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), rise: 0.1, floor: world.height, speed: 3 }, night() ? 'roost' : 'forage');
    bird.doing = 'hopping down off its log';
  };

  const tree = {
    pose: () => full(branch),
    enter(a, perch, side = 1, until = between(way.tree ? way.tree.stay : [60, 200])) {
      at.perch = perch; at.side = side;
      at.radius = place(perch, side, bird.at, bird.q);
      Object.assign(a.now, { until, series: way.hoot ? Math.round(between(way.hoot.bouts) * (low() ? 1.5 : 1)) : 0, next: 3 + r() * 12, hooting: 0 });
    },
    step(a, dt) {
      const now = a.now, grip = { mode: 'grip', round: Math.max(0.01, at.radius) };
      if (now.hooting > 0) {
        // a series of hoots: the comb swollen, the tail cocked and half spread, the throat working
        now.hooting -= dt;
        hold(hoot, { feet: grip, gape: 0.06 + 0.1 * Math.max(0, Math.sin(now.hooting * 9)) });
        bird.doing = 'hooting from high in a conifer';
        return;
      }
      if (night()) { hold(branch, { feet: grip, lift: branch.lift * 0.85, head: { yaw: 0, pitch: 0, roll: 0 } }); bird.doing = 'roosting in a conifer, by the trunk'; return; }
      now.until -= dt; now.next -= dt;
      if (way.hoot && now.next <= 0) {
        if (now.series > 0) { now.series -= 1; now.hooting = way.hoot.time; now.next = way.hoot.time + between(way.hoot.every); world.say(bird, 'hoot', way.hoot.reach, way.hoot.time); return; }
        now.series = Math.round(between(way.hoot.bouts)); now.next = 60 + r() * 240;                  // (a quiet spell, then another bout)
      }
      if (now.until < 0) {
        const next = edgeSpot(to);
        if (next) {
          heading = Math.atan2(next.z - bird.at.z, next.x - bird.at.x);
          a.fly({ at: next.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), rise: 0, floor: world.height, speed: way.speed * 0.8 }, 'forage', feedFor());
          bird.doing = 'gliding down to feed';
          return;
        }
        now.until = 30 + r() * 60;
      }
      hold(branch, { feet: grip, head: looking(dt, 0.08) });
      bird.doing = 'sitting in a conifer, by the trunk';
    },
  };

  const roost = {
    // (by night it sits tight, and is put up only by a walker much nearer than by day)
    wary: (a) => a.bird.at.distanceTo(world.eye) < way.flush * 0.6,
    pose: () => full(stand),
    enter(a) {
      // (the nearest fern within a few metres, which it walks to and settles under; or where it is)
      const d = (c) => Math.hypot(c.x - bird.at.x, c.z - bird.at.z);
      const c = world.coversNear(bird.at.x, bird.at.z, 6, _near).filter((one) => footing(world, one.x, one.z) && wayClear(bird.at, one.x, one.z) && world.free(_v.set(one.x, one.y, one.z), bird, 0.6)).sort((m, n) => d(m) - d(n))[0] || null;
      const spot = c ? ground(c.x, c.z, new THREE.Vector3()) : null;
      Object.assign(a.now, { wake: 0, spot, settled: false, walk: spot ? { to: spot, phase: 0 } : null });
    },
    step(a, dt) {
      if (walking(a.now, dt)) { bird.doing = 'walking to its roost'; return; }
      // (under its fern only if it got there: another animal by the fern stops it short)
      if (!a.now.settled) { a.now.settled = true; bird.cover = !!a.now.spot && bird.at.distanceTo(a.now.spot) < 0.6; }
      hold(stand, { lift: stand.lift * 0.71, pitch: 0.1, head: { yaw: 0, pitch: -0.05, roll: 0 }, tail: { pitch: -0.06, fan: 0, yaw: 0, prop: null } });
      bird.doing = bird.cover ? 'roosting on the ground, under a fern' : 'roosting on the ground';
      if (!night()) { a.now.wake += dt; if (a.now.wake > 2) a.to('forage', feedFor(), 1 + r() * 3); }
    },
  };

  // its flight: a burst of quick beats, then a glide on stiff wings held a little down (the wings beat in the flare to land)
  const fly = {
    wary: false,
    pose: () => ({ display: 0, reach: 0, dip: 0, droop: 0 }),
    step(a, dt) {
      flying(bird, dt, way.hz);
      const f = bird.flight;
      if (a.name !== 'fly' || !f) return;                         // (it has landed: the next activity has its own pose)
      if (f.t > way.glide && (f.through || f.t < 0.9)) Object.assign(bird.want, { flap: -0.07 + 0.02 * Math.sin(bird.beat * 0.15), hand: 0.04, sweep: 0.07 });
    },
  };

  // Flushed: up with a roar of wings, and low off through the trunks to land somewhere the walker cannot see, further
  // from them; from a tree, to another tree further off; a ruffed grouse one time in four into a tree
  const refuge = () => {
    if (a.name === 'tree' && at.perch) {
      const one = treeNear(bird.at.x, bird.at.z, 45, way.tree ? way.tree.high : [3, 9], true);
      return one ? upInto(one, 'off with a clatter of wings to another tree', true) : false;
    }
    if (!way.tree && r() < 0.25) {
      const one = treeNear(bird.at.x, bird.at.z, 35, [2.5, 7], true);
      if (one) return upInto(one, 'bursting up into a tree with a roar of wings', true);
    }
    const dx = bird.at.x - world.eye.x, dz = bird.at.z - world.eye.z, base = Math.atan2(dz, dx);
    let best = null;
    for (let tries = 0; tries < 16; tries += 1) {
      const turn = base + (r() - 0.5) * 2, d = 22 + r() * 34, x = bird.at.x + Math.cos(turn) * d, z = bird.at.z + Math.sin(turn) * d;
      if (!footing(world, x, z) || world.trail.distance(x, z) > 30) continue;
      ground(x, z, to);
      if (!a.clear(to, 3) || !world.free(to, bird, 0.8)) continue;
      // (low through the trunks, not through one)
      _w.copy(bird.at); _w.y += 0.6; _v.copy(to); _v.y += 0.6;
      if (world.blocked(_w, _v)) continue;
      if (!world.plain(to, bird.size)) { best = to.clone(); break; }
      if (!best) best = to.clone();
    }
    if (!best) return false;
    roar();
    heading = Math.atan2(best.z - bird.at.z, best.x - bird.at.x);
    a.fly({ at: best, q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), rise: 0.6, floor: world.height, speed: way.speed }, 'forage', feedFor(), 2.5 + r() * 4);
    bird.doing = 'bursting up with a roar of wings, and gliding off through the trunks';
    return true;
  };
  // off out of sight: with a roar of wings if it was put up (life/behave.js leaves this way when it flushes it off)
  const leaveOff = a.leave;
  const leave = (seconds) => {
    const put = a.startled();
    if (!leaveOff(seconds)) return false;
    if (put) { roar(); bird.doing = 'bursting up with a roar of wings'; }
    return true;
  };

  return {
    activities: { forage, log, tree, roost, fly },
    refuge,
    leave,
    // where the visit finds it: the ruffed grouse on his log or feeding near it, the sooty in his tree or feeding near
    // it (by night, at roost). Where the walker could see it be there from nowhere it flies in, and by night, when it
    // does not fly, it is not there yet (false: the visit tries again a little later)
    begin() {
      const first = a.life.first, dark = night();
      const come = (spot, landing, ...args) => {
        if (first || !world.plain(spot, bird.size)) return true;
        if (dark) return false;
        return a.come({ at: spot.clone(), q: bird.q.clone(), rise: 0.3, floor: world.height }, landing, ...args);
      };
      if (home.stand) {
        if (!dark && r() < (low() ? 0.75 : 0.5) && world.free(home.stand.point, bird, 0.6)) {
          bird.q.copy(standing()); a.to('log');
          if (!come(home.stand.point, 'log')) bird.left = 6 + r() * 10;
          return;
        }
      } else if (home.tree && way.tree && (dark || r() < (low() ? 0.7 : 0.45))) {
        const one = limbIn(home.tree, way.tree.high);
        if (one) {
          a.to('tree', one, at.side);
          if (!come(bird.at, 'tree', one, at.side)) bird.left = 6 + r() * 10;
          return;
        }
      }
      const there = edgeSpot(to);
      if (!there) { bird.left = 20 + r() * 30; return; }
      bird.at.copy(there); heading = r() * 6.283; face();
      if (dark) { a.to('roost'); if (!come(bird.at, 'roost')) bird.left = 6 + r() * 10; return; }
      a.to('forage', feedFor(), 0.5 + r() * 2);
      if (!come(bird.at, 'forage', feedFor(), 0.5 + r() * 2)) bird.left = 6 + r() * 10;
    },
  };
}

// ---- homes
// Room to feed where a grouse feeds (its family's `edgeSpot`): of sixteen places on the walk's edge near a home at
// (x, z), `s` metres along the walk and `off` from it (18 m either way along it, 2.2 to 11 m from its middle line, on
// the home's side), how many it could walk on.
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function edgeRoom(habitat, x, z, s, off) {
  const right = habitat.beside(s, off, _a), left = habitat.beside(s, -off, _b);
  const side = Math.hypot(right.x - x, right.z - z) <= Math.hypot(left.x - x, left.z - z) ? 1 : -1, L = habitat.length;
  let room = 0;
  for (let k = 0; k < 16; k += 1) {
    const at = habitat.beside((((s + (k / 15 - 0.5) * 36) % L) + L) % L, side * (2.2 + (k % 4) * 2.9), _a);
    if (footing(habitat, at.x, at.z)) room += 1;
  }
  return room;
}
// The Ruffed Grouse: a male's drumming log, `off` metres from the walk, the more likely near broad-leaved trees (alder,
// maple, vine maple, willow) or at the clearing's edge, with room to feed on the walk's edge near it; none within 150 m
// of another's. `stand`: where on the log he stands to drum (its top, a third to two thirds of the way along it).
function logHome(habitat, r, taken, way) {
  const logs = habitat.logs.filter((l) => l.off >= way.off[0] && l.off <= way.off[1] && !taken.some((h) => Math.hypot(h.x - l.x, h.z - l.z) < 150));
  const weighted = logs.map((l) => {
    const hard = habitat.leafyNear(l.x, l.z, 40, []).some((t) => HARDWOODS.has(t.kind)), edge = habitat.open(l.x, l.z) > 0.25;
    return [l, hard ? 3 : edge ? 2 : 1];
  });
  const total = weighted.reduce((n, [, w]) => n + w, 0);
  for (let tries = 0; tries < 12 && total > 0; tries += 1) {
    let pick = r() * total, log = null;
    for (const [l, w] of weighted) { pick -= w; if (pick <= 0) { log = l; break; } }
    if (!log) continue;
    const stand = log.on(0.33 + r() * 0.34, spot());
    if (stand.normal.y < 0) stand.normal.negate();
    if (stand.normal.y < 0.6) continue;
    const ahead = log.on(Math.min(0.99, 0.5 + 0.1), spot()).point, back = log.on(0.4, spot()).point;
    const along = new THREE.Vector3().subVectors(ahead, back).setY(0);
    if (along.lengthSq() < 1e-6) along.set(1, 0, 0);
    along.normalize();
    if (edgeRoom(habitat, log.x, log.z, log.s, log.off) < 5) continue;
    return { x: log.x, z: log.z, kind: 'log', stand: { point: stand.point.clone(), normal: stand.normal.clone(), along } };
  }
  return null;
}
// The Sooty Grouse: a male's hooting tree, a conifer `off` metres from the walk with limbs by its trunk as high as he
// hoots from, and room to feed on the walk's edge near it; none within 150 m of another's.
function treeHome(habitat, r, taken, way) {
  const trees = habitat.leafy.filter((t) => CONIFERS.has(t.kind) && t.off >= way.off[0] && t.off <= way.off[1] && !taken.some((h) => Math.hypot(h.x - t.x, h.z - t.z) < 150));
  for (let tries = 0; tries < 16 && trees.length; tries += 1) {
    const tree = trees[Math.floor(r() * trees.length)];
    if (habitat.perchesOf(tree).filter((one) => one.share < 0.5 && one.above >= way.tree.high[0] && one.above <= way.tree.high[1] && one.radius >= 0.025).length < 2) continue;
    if (edgeRoom(habitat, tree.x, tree.z, tree.s, tree.off) < 5) continue;
    return { x: tree.x, z: tree.z, kind: 'tree', tree };
  }
  return null;
}

export default {
  // what a grouse's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number',                  // wingbeats a second in its burst; how fast it flies (m/s)
    glide: 'number',                                // the share of a flight after which it glides
    walk: 'number',                                 // how fast it walks (m/s)
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    off: nums(2),                                   // how far from the walk its home is (m)
    feed: nums(2),                                  // seconds it feeds before it moves on
    log: optional({ stay: nums(2) }),               // the Ruffed Grouse's: seconds on its drumming log at a time
    drum: optional({ every: nums(2), time: 'number', reach: 'number' }),   // seconds between drums; how long one is (s); how far it is heard (m)
    tree: optional({ high: nums(2), stay: nums(2) }),                      // the Sooty Grouse's: how high in its tree (m); seconds in it at a time
    hoot: optional({ every: nums(2), bouts: nums(2), time: 'number', reach: 'number' }),   // seconds between series; series in a bout; how long one is; how far heard
    roar: { reach: 'number' },                      // how far its flush is heard (m)
  },
  act: (way) => (bird, world) => live(bird, world, way, fowl),
  home: (way) => (habitat, r, taken = []) => (way.drum ? logHome(habitat, r, taken, way) : treeHome(habitat, r, taken, way)),
};
