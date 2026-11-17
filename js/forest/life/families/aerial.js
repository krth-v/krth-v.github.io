import * as THREE from 'three';
import { frame, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums, list, oneOf } from '../bodies.js';
import { airOf, along, spotAt, LANE, HIGH, UP_VALLEY } from '../places/aerial2.js';

// Birds that live on the wing: the Violet-green Swallow and Vaux's Swift. Each is one of a party of its kind that goes
// about together (`together`), hawking insects in the open air of one part of the valley (its home: the old clearing,
// the river's bend and the beach, or the long reach), in runs and loops, glides and sudden turns, lower in the dim of
// morning and evening and over the water at dusk; the party drifts along the valley while it is there, and after a
// spell climbs away high and goes, for a while or for good. A swallow comes down now and then to sit on a snag's top or
// the cabin's ridge, and twitters there; a swift never does. At dusk the swifts gather high over the
// old redcedar and go down, one by one, into its broken top, where they cling to the inside of the hollow all night
// (`bird.cover`: not to be seen), and in the morning they come out again. On the wing neither is put up by the walker
// (the skeleton's rule is for the perch alone): it keeps out of their face, and goes on with what it is doing.
//
// From what was read (2026-11-16, each by this agent: Seattle Audubon's BirdWeb and the National Audubon Society's
// guide pages for both kinds; Wikipedia's Vaux's Swift; for how swifts roost and how swallows and swifts fly, search
// results only, whose pages refused to open, so these are summaries and not the papers): the swallow "forage[s] almost
// exclusively in flight", "often fl[ies] higher" than the Tree Swallow, "feed[s] low over open water, especially in bad
// weather", has "faster wingbeats, less gliding" than the Tree Swallow, perches on snags at forest edges, calls in
// flight ("a high dee-chip"), and visits snags with old woodpecker holes (a study in Arizona, via a summary). The swift
// "forage[s] in fast flight, often low over the water", "flies high over northwestern forests or low over lakes and
// rivers with stiff, rapid wingbeats", "often feeds low over water, especially in morning and evening", has crescent
// wings and "a mixture of stiff wing-beats and unsteady glides", roosts in hollow trees and chimneys, which it enters
// "between sunset and dark" and leaves at sunrise; summaries of the Park Service's and others' accounts have swifts
// circling over a roost from about an hour before sunset and then dropping in, spiralling, at nightfall. What flight
// is from in general (summaries of wind-tunnel studies of the Barn Swallow and the Common Swift): wingbeats slowest at
// a middle speed, and gliding between bursts; a swift's wings held stiff, swept back for fast glides and spread for
// slow ones. Not found, and so the agent's own: either kind's wingbeat rate, speed and heights in metres; every
// distance, time and chance below and in the kinds' ways; that the old cedar is the roost (the brief offered it, or a
// big snag); and the cabin's ridge as a swallow's perch.
//
// How it flies (the agent's). Each bird has a flight of its own, kept across what it does: a speed, a heading on
// the ground, a climb, a turn rate that changes no faster than its kind's `jerk`, and the bank that turn asks for (its
// tangent is the speed times the turn rate over g); its body is turned by them (`bird.q`) and its wings follow its
// kind's beat, in bursts of flapping and spells of gliding, the wings swept back the faster it goes. It flies only
// where the air is clear (life/places/aerial2.js): it looks ahead each step, and where the air ahead is not clear it
// makes for the middle of the window's lane, or straight up over everything. While it is on the wing its `state` is
// 'fly', as a bird's in any flight is, for the visit's tests of crowding and of two in one spot.

const G = 9.8, TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrap = (x) => { const y = (x + Math.PI) % TAU; return y < 0 ? y + Math.PI : y - Math.PI; };
const smooth = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const TUCK = Object.freeze({ mode: 'tuck' });

// The parts of the valley a party keeps to: metres along the window's line, and across it (to its right), where it
// may look for insects
export const WINDOWS = {
  clearing: { from: 22, to: 92, u: [-6.5, 22], says: 'over the old clearing' },
  bend: { from: 86, to: 140, u: [-14, 8.5], says: 'over the river' },
  reach: { from: 130, to: 240, u: [-8.5, 8.5], says: 'over the river' },
  far: { from: 230, to: 360, u: [-8.5, 8.5], says: 'far up the river' },
};

// The sun's way, for each visit's world: rising or setting (a swift comes out in the morning at a height of the sun
// at which it went in the evening before). Set from the hour the visit began, and then from the sun itself.
const suns = new WeakMap();
function sunOf(world) {
  let s = suns.get(world);
  if (!s) { s = { last: world.sunHeight, at: world.clock, rising: world.hour < 13 }; suns.set(world, s); }
  if (world.clock - s.at >= 2) {
    if (world.sunHeight > s.last + 1e-5) s.rising = true;
    else if (world.sunHeight < s.last - 1e-5) s.rising = false;
    s.last = world.sunHeight; s.at = world.clock;
  }
  return s;
}

const _v = new THREE.Vector3(), _fw = new THREE.Vector3(), _lv = new THREE.Vector3(), _rt = new THREE.Vector3(), _ub = new THREE.Vector3(), _ah = new THREE.Vector3();

function aerial(a) {
  const { bird, world, way, r } = a, home = bird.home, air = home.air;
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  const rest = bird.sheet.poses.perched, W = way.wing;
  // its flight, kept across what it does
  const fl = { v: way.cruise[0], psi: r() * TAU, gamma: 0, omega: 0, phi: 0, amp: 1, flapping: true, left: 0.3, beat: r() * TAU, rock: r() * TAU, gape: 0, what: '', calling: 0, escape: 0, air: false, climbing: false };
  const tgt = new THREE.Vector3(), esc = new THREE.Vector3();
  let calls = between(way.call.every) * (0.2 + r()), again = 0, perchIn = way.perch ? between(way.perch.every) * (0.3 + 0.7 * r()) : Infinity;
  // its own moments in the evening and the morning (the swift): the sun's height (degrees) at which it goes in, and comes out
  const enterAt = way.roost ? between(way.roost.enter) : 0, emergeAt = way.roost ? between(way.roost.emerge) : 0;

  // ---- the time of day, as the bird takes it: day, the dim of morning and late afternoon, dawn and dusk, night
  const phase = () => {
    const h = world.sunHeight, s = sunOf(world);
    if (h <= 0.01 && world.day < 0.05) return 'night';
    if (h < 5.5) return s.rising ? 'dawn' : 'dusk';
    return h < 12 ? 'dim' : 'day';
  };
  const band = (ph) => (ph === 'day' ? way.heights.day : ph === 'dusk' ? way.heights.dusk : way.heights.dim);
  // the party's middle, along the valley: it sweeps its part of the valley to and fro, slowly, every party its own way
  const centre = (win) => win.from + (win.to - win.from) * (0.5 + 0.5 * Math.sin(home.phase + (world.clock * TAU) / home.period));
  // where it looks for insects now: its party's part of the valley; low over the river at dusk, and in the dim, as often as not
  const windowNow = (ph) => (ph === 'dusk' || ((ph === 'dim' || ph === 'dawn') && r() < 0.5) ? WINDOWS.bend : home.window);

  // A point in clear air in its part of the valley, at a height its kind keeps to at this time of day (low more often
  // than high), not near the walker. The lane's middle if none is found.
  function pick(out, { win = null, low = false } = {}) {
    const ph = phase(), w = win || windowNow(ph), [lo, hi] = band(ph), c = win ? w.from + r() * (w.to - w.from) : centre(w);
    for (let tries = 0; tries < 14; tries += 1) {
      const t = clamp(c + (r() * 2 - 1) * way.span, w.from, w.to);
      let u, h;
      if (!low && r() < way.heights.high) { u = (r() * 2 - 1) * 30; h = HIGH + 4 + r() * 22; }
      else { u = w.u[0] + r() * (w.u[1] - w.u[0]); h = lo + Math.pow(r(), 1.5) * (hi - lo); }
      spotAt(t, u, 0, out);
      const f = air.floor(out.x, out.z);
      out.y = f.y + Math.max(h, f.least + 0.2);
      if (!air.clear(out.x, out.y, out.z) || out.distanceTo(world.eye) < 5) continue;
      return out;
    }
    spotAt(clamp(c, LANE.from + 3, LANE.to - 3), 0, 0, out);
    const f = air.floor(out.x, out.z);
    out.y = f.y + Math.max(f.least + 0.5, (lo + hi) / 2);
    return out;
  }

  // ---- the flight
  const headingOf = (q) => { _v.set(1, 0, 0).applyQuaternion(q); return Math.abs(_v.x) + Math.abs(_v.z) < 1e-6 ? fl.psi : Math.atan2(_v.z, _v.x); };
  const launch = (v, gamma, psi = headingOf(bird.q)) => { fl.v = v; fl.gamma = gamma; fl.psi = psi; fl.omega = 0; fl.phi = 0; fl.escape = 0; };
  // Somewhere clear to make for when the air ahead is not: out of air that is not clear, straight up over everything;
  // otherwise the middle of the lane at the bird's own place along it, at its own height, or high over everything if
  // where it wants to go can only be reached that way
  function refugeAir(goal, out) {
    const p = bird.at, f = air.floor(p.x, p.z), h = p.y - f.y, t = f.t, u = f.u;
    fl.climbing = false;
    if (!air.clear(p.x, p.y, p.z) && h < HIGH) {
      // (beside the valley's open air, as on a perch at the clearing's edge: across to the lane, at its own height;
      // anywhere else, the old cedar's top among the old terrace's trees: up over everything)
      if (!(t > LANE.from - 6 && t < LANE.to && Math.abs(u) < 45)) { fl.climbing = true; return out.set(p.x, f.y + HIGH + 6, p.z); }
      spotAt(t, 0, 0, out); out.y = Math.max(p.y, air.floor(out.x, out.z).y + 1.6);
      return out;
    }
    spotAt(clamp(t, LANE.from + 3, LANE.to - 3), 0, 0, out);
    // (the floor's answer is one table, read at once each time it is asked)
    let g = air.floor(out.x, out.z);
    const gy = g.y, gl = g.least;
    g = air.floor(goal.x, goal.z);
    const gu = g.u, gt = g.t, gh = goal.y - g.y;
    const inLane = gt >= LANE.from && gt <= LANE.to && Math.abs(gu) <= LANE.wide;
    if (gh >= HIGH || (!inLane && !air.clear(goal.x, goal.y, goal.z))) out.y = gy + HIGH + 4;
    else if (!inLane) out.y = Math.max(goal.y, gy + gl + 0.5);       // (never under what grows where the lane is)
    else out.y = Math.max(p.y, gy + gl + 0.5);
    return out;
  }
  // one step towards `target`. Options: cruise (m/s), vmin, turn (rad/s), climb and sink (m/s), least (m over the
  // floor, for a drink), free (no look ahead: a way known to be clear), flap / glide (forced), pitch (more)
  function fly(dt, target, o = {}) {
    const p = bird.at;
    let goal = target;
    if (!o.free) {
      if (fl.escape > 0) { fl.escape -= dt; goal = esc; }
      else {
        const c = Math.cos(fl.gamma), L = Math.max(4, fl.v * 0.9);
        _ah.set(p.x + Math.cos(fl.psi) * c * L, p.y + Math.sin(fl.gamma) * L, p.z + Math.sin(fl.psi) * c * L);
        if (!air.clear(_ah.x, _ah.y, _ah.z)) { refugeAir(target, esc); fl.escape = 0.8; goal = esc; }
      }
    }
    let psiWant = Math.abs(goal.x - p.x) + Math.abs(goal.z - p.z) > 1e-3 ? Math.atan2(goal.z - p.z, goal.x - p.x) : fl.psi + 0.8;
    let yWant = goal.y;
    // never into the walker's face: aside, and over them. (This is steering, as round a tree: a bird on the wing does
    // not fly into a person. It is no reaction to the walker of the kind the skeleton's rule is about, life/behave.js:
    // nothing is put up, the bird goes on with what it is at, and on a perch the rule is the skeleton's alone.)
    const ex = world.eye.x - p.x, ey = world.eye.y - p.y, ez = world.eye.z - p.z, ed = Math.hypot(ex, ez);
    if (ed < 7 && Math.abs(ey) < 3.5) {
      const off = wrap(Math.atan2(ez, ex) - fl.psi);
      if (Math.abs(off) < 1.3) psiWant = fl.psi - Math.sign(off || 1) * 1.4;
      if (ed < 3.5) yWant = Math.max(yWant, world.eye.y + 2.5);
    }
    // nor into one of its party
    const mates = bird.who && bird.who.party ? bird.who.party.members : null;
    if (mates) for (const m of mates) {
      const b = m.bird;
      if (!b || b === bird || b.state !== 'fly') continue;
      const dx = b.at.x - p.x, dy = b.at.y - p.y, dz = b.at.z - p.z;
      if (dx * dx + dy * dy + dz * dz > 2.25) continue;
      const off = wrap(Math.atan2(dz, dx) - fl.psi);
      if (Math.abs(off) < 1.6) psiWant = fl.psi - Math.sign(off || 1) * 1.0;
      yWant += dy > 0 ? -1.2 : 1.2;
    }
    const turn = o.turn ?? way.turn;
    const omegaWant = clamp(wrap(psiWant - fl.psi) * 3, -turn, turn);
    fl.omega += clamp(omegaWant - fl.omega, -way.jerk * dt, way.jerk * dt);
    fl.psi = wrap(fl.psi + fl.omega * dt);
    const vy = clamp((yWant - p.y) * 1.1, -(o.sink ?? way.sink), o.climb ?? way.climb);
    const gWant = Math.asin(clamp(vy / Math.max(fl.v, 1), -0.8, 0.75));
    fl.gamma += clamp(gWant - fl.gamma, -2.4 * dt, 2.4 * dt);
    // its speed: eased towards what it wants, gained in a dive and lost in a climb, within its kind's bounds
    const vWant = o.cruise ?? way.cruise[0];
    fl.v += clamp(vWant - fl.v, -2.5 * dt, (fl.flapping ? 5 : 1.2) * dt) - G * Math.sin(fl.gamma) * dt * 0.35;
    fl.v = clamp(fl.v, o.vmin ?? way.cruise[0] * 0.6, way.burst);
    const c = Math.cos(fl.gamma);
    p.x += Math.cos(fl.psi) * c * fl.v * dt; p.y += Math.sin(fl.gamma) * fl.v * dt; p.z += Math.sin(fl.psi) * c * fl.v * dt;
    // never under the floor, and lifted (no faster than it can climb) where it is lower than it keeps
    // (a drink's least height, `o.least`, holds over the water only: over a bar or the bank it keeps what grows there)
    const f = air.floor(p.x, p.z), least = f.y + (o.least != null && f.kind === 'water' ? o.least : f.least);
    if (p.y < least) { p.y = Math.min(least, p.y + Math.max(way.climb, 3) * dt); if (fl.gamma < 0) fl.gamma *= 0.5; }
    if (p.y < f.y + 0.05) p.y = f.y + 0.05;
    attitude(dt);
    wings(dt, o);
  }
  // its body: along its way, banked into its turn (and, gliding, rocked as its kind is)
  function attitude(dt) {
    let phiWant = clamp(Math.atan((fl.v * fl.omega) / G), -way.bank, way.bank);
    if (fl.amp < 0.5 && W.rock) { fl.rock += dt * 7; phiWant += W.rock * Math.sin(fl.rock) * (1 - fl.amp * 2); }
    fl.phi += (phiWant - fl.phi) * Math.min(1, dt * 9);
    const c = Math.cos(fl.gamma);
    _fw.set(Math.cos(fl.psi) * c, Math.sin(fl.gamma), Math.sin(fl.psi) * c);
    _lv.copy(UP).addScaledVector(_fw, -_fw.y).normalize();
    _rt.crossVectors(_fw, _lv);
    _ub.copy(_lv).multiplyScalar(Math.cos(fl.phi)).addScaledVector(_rt, Math.sin(fl.phi));
    frame(_fw, _ub, bird.q);
  }
  // its wings: its kind's beat in bursts, and between them its kind's glide; a climb is flapped, a dive glided
  function wings(dt, o) {
    fl.left -= dt;
    if (fl.left <= 0) { fl.flapping = !fl.flapping; fl.left = between(fl.flapping ? way.bursts.flap : way.bursts.glide); }
    let flapping = fl.flapping;
    if (fl.gamma > 0.2 || fl.v < way.cruise[0] * 0.8 || o.flap) flapping = true;
    if (fl.gamma < -0.32 || o.glide) flapping = false;
    fl.amp += ((flapping ? 1 : 0) - fl.amp) * Math.min(1, dt * 16);
    fl.beat += dt * way.hz * TAU;
    const A = fl.amp, s = Math.sin(fl.beat), up = Math.max(0, Math.cos(fl.beat));
    const fast = clamp((fl.v - way.cruise[0]) / Math.max(0.1, way.burst - way.cruise[0]), 0, 1), turning = clamp(Math.abs(fl.omega) / way.turn, 0, 1);
    const swept = W.glide.sweep[0] + (W.glide.sweep[1] - W.glide.sweep[0]) * Math.max(fast, fl.gamma < -0.25 ? 1 : 0);
    const want = bird.want;
    want.spread = 1; want.lift = 0.6; want.lean = 0; want.roll = 0; want.droop = 0;
    want.flap = A * (W.flap[0] * s + W.flap[1]) + (1 - A) * (W.glide.flap + 0.06 * turning);
    want.hand = A * W.hand[0] * Math.sin(fl.beat - W.hand[1]) + (1 - A) * W.glide.hand;
    want.sweep = A * (W.sweep[0] + (W.sweep[1] - W.sweep[0]) * up) + (1 - A) * (swept - 0.15 * turning);
    want.pitch = 0.05 + 0.12 * (1 - fast) + (o.pitch || 0);
    fl.gape -= dt; fl.calling -= dt;
    want.gape = fl.gape > 0 ? 0.75 : fl.calling > 0 ? (((fl.calling * way.call.rate) % 1) > 0.5 ? 0.5 : 0.1) : 0;
    if (want.head) { want.head.yaw = clamp(fl.omega * 0.12, -0.4, 0.4); want.head.pitch = 0; want.head.roll = 0; }
    if (want.tail) { want.tail.pitch = 0.04 * (1 - fast); want.tail.fan = W.tail[0] + (W.tail[1] - W.tail[0]) * Math.max(turning, 1 - fast * 1.6); want.tail.yaw = 0; want.tail.prop = null; }
    want.feet = TUCK;
    bird.snap = true;                                // its wings beat too fast to be eased
  }
  // its call, now and then, in the air and on a perch
  function voice(dt, every = way.call.every) {
    calls -= dt;
    if (calls < 0) { calls = between(every); fl.calling = way.call.time; world.say(bird, 'call', way.call.reach); }
  }
  const where = () => {
    const f = air.floor(bird.at.x, bird.at.z), h = bird.at.y - f.y;
    return h > 40 ? 'high over the valley' : f.kind === 'water' ? 'over the river' : f.kind === 'meadow' ? 'over the old clearing' : home.window.says;
  };
  // on the wing: what the visit and the page read of it
  const aloft = () => { bird.state = 'fly'; bird.aloft = true; bird.cover = false; fl.air = true; };

  // ---- hawking: runs and loops through the air of its part of the valley, and sudden turns after an insect
  function next(now, how = {}) {
    const ph = phase(), p = bird.at;
    now.loop = null; now.snap = false; now.least = null; now.glide = false; now.cruise = between(way.cruise);
    if (how.arrive) { now.mode = 'arrive'; pick(tgt); now.left = 30; return; }
    const m = way.modes, water = air.floor(p.x, p.z).kind === 'water' || ph === 'dusk';
    const roll = r() * (m.run + m.loop + m.chase + (water ? m.swoop : 0));
    if (roll < m.chase) {
      // a sudden turn after an insect: a few metres off to one side, a little up or down
      const off = (r() < 0.5 ? -1 : 1) * (0.9 + 1.5 * r()), d = 3 + 3 * r(), th = fl.psi + off;
      tgt.set(p.x + Math.cos(th) * d, p.y + (r() - 0.5) * 2.4, p.z + Math.sin(th) * d);
      if (air.clear(tgt.x, tgt.y, tgt.z) && tgt.distanceTo(world.eye) > 4) { now.mode = 'chase'; now.left = 0.45 + 0.4 * r(); now.cruise = Math.min(way.burst, way.cruise[1] * 1.15); now.snap = true; return; }
    } else if (roll < m.chase + m.loop) {
      // round in a loop, one way or the other, once or twice
      const side = r() < 0.5 ? -1 : 1, R = between(way.loop), right = fl.psi + Math.PI / 2;
      const cx = p.x + Math.cos(right) * side * R, cz = p.z + Math.sin(right) * side * R;
      let ok = true;
      for (let k = 0; k < 6 && ok; k += 1) { const th = (k * TAU) / 6; ok = air.clear(cx + Math.cos(th) * R, p.y, cz + Math.sin(th) * R); }
      if (ok) { now.mode = 'loop'; now.loop = { cx, cz, y: p.y + (r() - 0.5) * 3, R, side, turned: 0, turns: TAU * (0.7 + 1.1 * r()), last: Math.atan2(p.z - cz, p.x - cx) }; now.cruise = Math.min(now.cruise, 0.85 * way.turn * R); now.left = 12; return; }
    } else if (roll >= m.run + m.loop + m.chase) {
      // down to the water, to drink on the wing (or snatch an insect off it), and up again
      for (let tries = 0; tries < 6; tries += 1) {
        const d = 8 + 10 * r(), th = fl.psi + (r() - 0.5) * 1.2;
        tgt.set(p.x + Math.cos(th) * d, 0, p.z + Math.sin(th) * d);
        const f = air.floor(tgt.x, tgt.z);
        if (f.kind !== 'water') continue;
        tgt.y = f.y + 0.06 + 0.1 * r();
        if (!air.clear(tgt.x, f.y + 0.5, tgt.z) || tgt.distanceTo(world.eye) < 5) continue;
        now.mode = 'swoop'; now.left = 5; now.least = 0.05; now.glide = true; now.water = f.y; return;
      }
    }
    now.mode = 'run'; pick(tgt); now.left = 2 + 4 * r();
  }
  const hawk = {
    wary: false,
    enter(a, how = {}) {
      aloft();
      if (how.v != null) launch(how.v, how.gamma ?? 0, how.psi ?? headingOf(bird.q));
      next(a.now, how);
    },
    step(a, dt) {
      const now = a.now, ph = phase();
      voice(dt);
      again -= dt;
      // the evening: the swallow off for the night, the swift to its roost
      if (way.dusk != null && (ph === 'dusk' || ph === 'night') && world.sunHeight < way.dusk && again <= 0) { if (a.leave(30 + r() * 40)) return; again = 2; }
      if (way.roost && (ph === 'dusk' || ph === 'night') && world.sunHeight < way.roost.gather && air.roost().top) { a.to('gather'); return; }
      // the party has had its spell here: it goes, for a while or for good, and each of it with it
      if (!home.leaving && world.clock > home.until) home.leaving = { seconds: r() < way.moveOn ? Infinity : a.awhile() };
      if (home.leaving && again <= 0) { if (a.leave(home.leaving.seconds)) return; again = 2; }
      // now and then down to a perch (the swallow)
      perchIn -= dt;
      if (way.perch && perchIn < 0 && now.mode !== 'arrive') { perchIn = between(way.perch.every); if (toPerch()) return; }
      // what it is after
      now.left -= dt;
      const p = bird.at;
      if (now.mode === 'loop') {
        const L = now.loop, ang = Math.atan2(p.z - L.cz, p.x - L.cx);
        L.turned += Math.abs(wrap(ang - L.last)); L.last = ang;
        const ahead = ang + L.side * 0.7;
        tgt.set(L.cx + Math.cos(ahead) * L.R, L.y, L.cz + Math.sin(ahead) * L.R);
        if (L.turned > L.turns) now.left = 0;
      }
      // (a swoop is over when its bill is at the water; short of it, it skims on, the point it makes for drawn on ahead)
      if (now.mode === 'swoop' && Math.hypot(tgt.x - p.x, tgt.z - p.z) < 2.5 && p.y - now.water > 0.3) {
        const nx = tgt.x + Math.cos(fl.psi) * 3, nz = tgt.z + Math.sin(fl.psi) * 3;
        if (air.clear(nx, now.water + 0.5, nz)) { tgt.x = nx; tgt.z = nz; } else now.left = 0;
      }
      const near = now.mode === 'swoop' ? p.y - now.water < 0.3 : now.mode !== 'loop' && Math.hypot(tgt.x - p.x, tgt.z - p.z) < 2.5 && Math.abs(tgt.y - p.y) < 2.5;
      if (near || now.left <= 0) {
        if (now.snap || (now.mode === 'swoop' && near)) { fl.gape = 0.14; fl.what = now.mode === 'swoop' ? 'drinking on the wing, its bill to the water' : 'snapping an insect from the air'; }
        next(now);
      }
      const sinking = now.mode === 'arrive' || now.mode === 'swoop';
      fly(dt, tgt, { cruise: now.cruise, least: now.least ?? undefined, sink: sinking ? way.sink * 1.5 : undefined, glide: now.glide && fl.v > way.cruise[0] });
      bird.doing = fl.escape > 0 && fl.climbing ? 'climbing up over the trees' : fl.gape > 0 ? fl.what
        : now.mode === 'arrive' ? 'coming down from high over the valley'
        : now.mode === 'chase' ? 'turning sharply after an insect'
        : now.mode === 'swoop' ? 'swooping down to the water'
        : now.mode === 'loop' ? `wheeling round ${where()}`
        : fl.amp < 0.3 ? `gliding ${where()} on swept-back wings` : `hawking insects ${where()}`;
    },
  };

  // ---- a perch (the swallow): it sits, looks about, twitters, and drops off into the air again
  const at = { post: null };
  const facing = (post, out) => {
    if (post.along) { _v.crossVectors(post.along, UP); if (r() < 0.5) _v.negate(); } else { const th = r() * TAU; _v.set(Math.cos(th), 0, Math.sin(th)); }
    return frame(_v, UP, out);
  };
  function toPerch() {
    const list = air.perches().filter((one) => one.point.distanceTo(bird.at) < way.perch.reach && world.free(one.point, bird, 0.45) && a.clear(one.point));
    if (!list.length) return false;
    // the one nearest a mate already perched, if one is (a party's birds sit in a row), or any
    const mates = bird.who && bird.who.party ? bird.who.party.members.map((m) => m.bird).filter((b) => b && b !== bird && b.state === 'perch') : [];
    let one = list[Math.floor(r() * list.length)];
    if (mates.length) one = list.reduce((best, x) => (x.point.distanceTo(mates[0].at) < best.point.distanceTo(mates[0].at) ? x : best), one);
    bird.aloft = true;
    a.fly({ at: one.point.clone(), q: facing(one, new THREE.Quaternion()), rise: 0.3, floor: world.height, speed: way.speed }, 'perch', one);
    bird.doing = one.kind === 'ridge' ? "flying in to the cabin's ridge" : 'flying in to a perch';
    return true;
  }
  const perch = {
    enter(a, post) {
      at.post = post; fl.air = false;
      Object.assign(a.now, { stay: between(way.perch.stay), look: 0, calls: 0.6 + 2 * r(), calling: 0, head: { yaw: 0, pitch: rest.head ? rest.head.pitch : 0.05, roll: 0 } });
      if (bird.at.distanceToSquared(post.point) > 0.0025) { bird.at.copy(post.point); facing(post, bird.q); }
    },
    step(a, dt) {
      const now = a.now;
      now.stay -= dt; now.look -= dt; now.calls -= dt; again -= dt;
      if (now.look < 0) { now.look = 0.5 + 1.8 * r(); now.head = { yaw: (r() - 0.5) * 2, pitch: (r() - 0.4) * 0.5, roll: (r() - 0.5) * 0.2 }; }
      Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, roll: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, head: now.head,
        tail: { ...rest.tail, prop: null }, feet: { mode: 'grip', round: Math.max(0.004, at.post.radius || 0.02) }, gape: 0 });
      if (now.calling > 0) {
        now.calling -= dt;
        bird.want.gape = ((now.calling * way.call.rate) % 1) > 0.5 ? 0.5 : 0.08;
        bird.want.head = { yaw: now.head.yaw * 0.3, pitch: 0.25, roll: 0 };
      } else if (now.calls < 0) { now.calls = between(way.perch.calls); now.calling = way.call.time; world.say(bird, 'call', way.call.reach); }
      // the party going, or the day's end: off the perch and away
      if (home.leaving && again <= 0) { if (a.leave(home.leaving.seconds)) return; again = 2; }
      if (way.dusk != null && world.sunHeight < way.dusk && !sunOf(world).rising && again <= 0) { if (a.leave(30 + r() * 40)) return; again = 2; }
      // its time up: it drops off its perch into the air
      if (now.stay < 0) { a.to('hawk', { v: 3.5, gamma: -0.35 }); return; }
      const on = at.post.kind === 'ridge' ? "on the cabin's ridge" : "on a snag's broken top";
      bird.doing = now.calling > 0 ? `twittering ${on}` : `perched ${on}, looking about`;
    },
  };

  // ---- off out of the walker's sight: up and away along the valley, the way that is further from them, until they
  // cannot plainly see it, and gone from there (for `seconds`, or for good)
  const away = {
    wary: false,
    enter(a, seconds) {
      const was = fl.air;
      aloft();
      if (!was) launch(4, 0.25);
      a.now.seconds = seconds;
      const t = along(bird.at.x, bird.at.z), te = along(world.eye.x, world.eye.z);
      a.now.dir = t >= te ? 1 : -1;
    },
    step(a, dt) {
      if (!world.plain(bird.at, bird.size)) { bird.left = a.now.seconds; a.to('gone'); return; }
      const f = air.floor(bird.at.x, bird.at.z);
      spotAt(clamp(f.t + a.now.dir * 60, LANE.from + 3, LANE.to - 3), 0, 0, tgt);
      tgt.y = air.floorY(tgt.x, tgt.z) + HIGH + 18;
      fly(dt, tgt, { cruise: way.cruise[1], flap: true });
      bird.doing = 'climbing away high over the valley';
    },
  };

  // ---- the swift's evening and night
  const roostOf = () => air.roost();
  // (a slot is held by a bird of this visit: the roost is the habitat's, and a page may walk many visits through it)
  const freeSlot = () => { const R = roostOf(); return R.slots.find((slot) => !slot.taken || slot.world !== world || slot.taken.left != null || slot.taken.state !== 'roost') || null; };
  // high over the old cedar, round and round with the others, until its own moment to go in
  const gather = {
    wary: false,
    enter(a) {
      aloft();
      const R = roostOf();
      a.now.r = 9 + 12 * r();
      a.now.y = (R.top ? air.floorY(R.top.x, R.top.z) : 0) + HIGH + 2 + 14 * r();
    },
    step(a, dt) {
      voice(dt);
      const R = roostOf();
      if (!R.top) { if (a.leave(Infinity)) return; }
      if (sunOf(world).rising && world.sunHeight > way.roost.emerge[1]) { a.to('hawk'); return; }
      const p = bird.at, dx = p.x - R.top.x, dz = p.z - R.top.z, d = Math.hypot(dx, dz);
      if (world.sunHeight <= enterAt && d < a.now.r + 6 && Math.abs(p.y - a.now.y) < 10) { a.to('descend'); return; }
      const ang = Math.atan2(dz, dx) + home.spin * 0.7;
      tgt.set(R.top.x + Math.cos(ang) * a.now.r, a.now.y, R.top.z + Math.sin(ang) * a.now.r);
      fly(dt, tgt, { cruise: way.cruise[1] });
      bird.doing = d < a.now.r + 12 ? 'circling high over the old cedar with the others, before it goes in to roost' : 'on its way to the old cedar, where it roosts';
    },
  };
  // down a tightening spiral over the broken top, to just over it
  const descend = {
    wary: false,
    enter(a) { aloft(); const R = roostOf(); a.now.r0 = clamp(Math.hypot(bird.at.x - R.top.x, bird.at.z - R.top.z), 4, 14); a.now.t = 0; a.now.y0 = Math.max(bird.at.y - R.top.y, 8); },
    step(a, dt) {
      const R = roostOf(), top = R.top, p = bird.at;
      a.now.t += dt;
      const dx = p.x - top.x, dz = p.z - top.z, d = Math.hypot(dx, dz), above = p.y - top.y;
      if ((above < 3.5 && d < 3) || a.now.t > 45) { a.to('plunge'); return; }
      const rr = 0.8 + a.now.r0 * clamp(above / a.now.y0, 0, 1), ang = Math.atan2(dz, dx) + home.spin * 0.8;
      tgt.set(top.x + Math.cos(ang) * rr, top.y + Math.max(1.6, above - 6), top.z + Math.sin(ang) * rr);
      // (`free`: no look ahead, since the clear-air test calls no air clear among the old terrace's trees, where the
      // cedar stands. The way is clear all the same: the spiral is under 2 m wide by the time it is as low as the
      // younger trunks' tops, which stand 4 m and more from the broken top's middle. Measured 2026-11-16 over 33
      // descents: none passed nearer than 2.6 m to the cedar's other wood, by its vertices.)
      fly(dt, tgt, { free: true, cruise: 4.5, vmin: 3.2, turn: 3.6, sink: 4.5, glide: above > 6 });
      bird.doing = "spiralling down to the old cedar's broken top";
    },
  };
  // and in: over the hole, wings held up, and down into the hollow, where it is hidden
  const plunge = {
    wary: false,
    enter(a) {
      aloft(); const R = roostOf();
      a.now.t = 0; a.now.from = bird.at.clone(); a.now.psi = fl.psi;
      a.now.over = R.top.clone().addScaledVector(R.axis, 0.9);
      a.now.in = Math.max(0.35, a.now.from.distanceTo(a.now.over) / 4.5);         // (over the hole at no more than a flight's pace)
    },
    step(a, dt) {
      const R = roostOf(), now = a.now;
      now.t += dt;
      const k = Math.min(1, now.t / (now.in + 0.4));
      if (now.t < now.in) bird.at.lerpVectors(now.from, now.over, smooth(now.t / now.in));
      else bird.at.copy(now.over).addScaledVector(R.axis, -1.5 * Math.min(1, (now.t - now.in) / 0.4));
      // head down into it, its wings up in a V and fluttering
      _fw.set(Math.cos(now.psi) * 0.45, -0.9, Math.sin(now.psi) * 0.45).normalize();
      _lv.set(Math.cos(now.psi), 0.5, Math.sin(now.psi)).normalize();
      frame(_fw, _lv.addScaledVector(_fw, -_lv.dot(_fw)).normalize(), bird.q);
      fl.beat += dt * way.hz * TAU;
      Object.assign(bird.want, { spread: 1, flap: 0.95 + 0.12 * Math.sin(fl.beat), hand: 0.35, sweep: 0.05, pitch: 0.1, lift: 0.6, droop: 0, gape: 0, feet: TUCK });
      if (bird.want.tail) { bird.want.tail.fan = 0.6; bird.want.tail.pitch = 0.1; }
      bird.snap = true;
      bird.doing = "dropping into the old cedar's broken top, to roost";
      if (bird.at.y < R.top.y - 0.05) bird.cover = true;
      if (k < 1) return;
      const slot = freeSlot();
      if (slot) { a.to('roost', slot); return; }
      bird.left = 40 + 40 * r(); a.to('gone'); bird.cover = true;      // (no room in it: it roosts somewhere else tonight)
    },
  };
  // clinging inside the hollow all night, out of sight; out at its own moment in the morning
  const roost = {
    wary: false,
    pose: () => ({ ...rest, spread: 0, flap: 0, hand: 0, sweep: 0, gape: 0 }),
    enter(a, slot) {
      a.now.slot = slot; slot.taken = bird; slot.world = world; fl.air = false;
      home.slept = true;                       // (the party is at roost: its spell begins again as it comes out, `emerge`)
      bird.at.copy(slot.point); bird.q.copy(slot.q);
      bird.cover = true; bird.state = 'roost';
    },
    step(a) {
      bird.cover = true;
      bird.doing = 'roosting inside the old cedar, clinging to the wall of its hollow top';
      const s = sunOf(world);
      if (s.rising && world.sunHeight >= emergeAt) a.to('emerge');
    },
    exit(a) { if (a.now.slot && a.now.slot.taken === bird) a.now.slot.taken = null; },
  };
  const emerge = {
    wary: false,
    enter(a) { aloft(); bird.cover = true; a.now.t = 0; a.now.psi = r() * TAU; },
    step(a, dt) {
      const R = roostOf(), now = a.now;
      now.t += dt;
      const k = Math.min(1, now.t / 0.55);
      bird.at.copy(R.top).addScaledVector(R.axis, -0.5 + 2.4 * k);
      if (bird.at.y > R.top.y + 0.05) bird.cover = false; else bird.cover = true;
      _lv.set(Math.cos(now.psi), 0, Math.sin(now.psi));
      frame(R.axis, _lv, bird.q);
      fl.beat += dt * way.hz * TAU;
      Object.assign(bird.want, { spread: 1, flap: 0.5 + 0.45 * Math.sin(fl.beat), hand: 0.3 * Math.sin(fl.beat - 0.8), sweep: 0.1, pitch: 0, lift: 0.6, droop: 0, gape: 0, feet: TUCK });
      bird.snap = true;
      bird.doing = "coming up out of the old cedar's broken top";
      if (k < 1) return;
      // (a spell begins as the first of the party comes out, as it does when the party comes in, `begin`: the one
      // drawn at the visit's start ran on while it slept, and every swift climbed away the moment it was out, or a
      // few seconds after)
      if (home.slept || home.leaving || home.until < world.clock) { home.slept = false; home.leaving = null; home.until = world.clock + between(way.spell); }
      a.to('hawk', { v: 4, gamma: 0.9, psi: now.psi });
    },
  };

  // ---- how it comes: by day, down from high over its part of the valley, where the walker cannot plainly see it
  // come to be; at dusk (the swift) high over the cedar; in the roost if it is roosting time
  function arrive() {
    const win = home.window, c = centre(win);
    for (let tries = 0; tries < 8; tries += 1) {
      const t = clamp(c + (r() * 2 - 1) * way.span, LANE.from + 3, LANE.to - 3), u = (r() * 2 - 1) * LANE.half;
      spotAt(t, u, 0, bird.at);
      bird.at.y = air.floorY(bird.at.x, bird.at.z) + HIGH + 6 + 24 * r();
      if (world.plain(bird.at, bird.size)) continue;
      a.to('hawk', { v: between(way.cruise), gamma: -0.3, psi: UP_VALLEY + (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.8, arrive: true });
      return true;
    }
    return false;
  }
  function overRoost() {
    const R = roostOf();
    for (let tries = 0; tries < 6; tries += 1) {
      const th = r() * TAU, d = 8 + 14 * r();
      bird.at.set(R.top.x + Math.cos(th) * d, 0, R.top.z + Math.sin(th) * d);
      bird.at.y = air.floorY(bird.at.x, bird.at.z) + HIGH + 6 + 16 * r();
      if (world.plain(bird.at, bird.size)) continue;
      fl.psi = th + home.spin * Math.PI / 2; fl.v = way.cruise[1]; fl.gamma = 0;
      a.to('gather');
      return true;
    }
    return false;
  }

  return {
    activities: { hawk, perch, away, gather, descend, plunge, roost, emerge },
    // flushed off its perch (the swallow; on the wing nothing puts either up): into the air, away from the walker
    refuge() {
      _v.subVectors(bird.at, world.eye);
      a.to('hawk', { v: 4, gamma: -0.2, psi: Math.atan2(_v.z, _v.x) });
      bird.doing = 'off its perch and away from you';
      return true;
    },
    leave: (seconds) => a.to('away', seconds),
    begin() {
      const ph = phase(), first = a.life.first;
      // (a spell begins when the party comes: back from away, or at a home it has moved to, whose `until` was drawn
      // from the visit's start)
      if (home.leaving || home.until < world.clock) { home.leaving = null; home.until = world.clock + between(way.spell); }
      if (way.roost) {
        const R = roostOf();
        if (R.top) {
          const s = world.sunHeight;
          // its roosting time: in the roost, out of sight
          if (ph === 'night' || (ph === 'dawn' && s < emergeAt) || (ph === 'dusk' && s <= enterAt)) {
            const slot = freeSlot();
            if (slot) { a.to('roost', slot); return; }
            bird.left = 40 + 40 * r(); return;
          }
          if (ph === 'dusk' && s < way.roost.gather) { if (!overRoost()) bird.left = 5 + 10 * r(); return; }
        }
      } else if (ph === 'night' || (way.dusk != null && ph === 'dusk' && world.sunHeight < way.dusk)) { bird.left = 30 + 40 * r(); return; }
      // there when the walker came: in the air of its part of the valley already
      if (first) {
        pick(bird.at);
        a.to('hawk', { v: between(way.cruise), gamma: 0, psi: r() * TAU });
        return;
      }
      if (!arrive()) bird.left = 5 + 10 * r();
    },
  };
}

// The part of the valley a party keeps to, and what the party has between them: how it sweeps that part, which way
// the swifts circle, when its spell there is over, and whether it has left.
const homeOf = (way) => (habitat, r, taken = []) => {
  const air = airOf(habitat);
  const free = way.windows.filter((name) => !taken.some((h) => h && h.name === name)), names = free.length ? free : way.windows;
  const name = names[Math.floor(r() * names.length)];
  return { air, name, window: WINDOWS[name], phase: r() * TAU, period: way.drift[0] + r() * (way.drift[1] - way.drift[0]), spin: r() < 0.5 ? 1 : -1,
    until: way.spell[0] + r() * (way.spell[1] - way.spell[0]), leaving: null };
};

export default {
  // what an aerial bird's way holds besides what every way has (life/families/index.js)
  fields: {
    windows: list(oneOf(...Object.keys(WINDOWS)), 1),     // the parts of the valley its parties keep to (WINDOWS)
    span: 'number',                                  // how far (m) along the valley from its party's middle a bird ranges
    drift: nums(2),                                  // seconds for its party to sweep its part of the valley, to and fro
    heights: { day: nums(2), dim: nums(2), dusk: nums(2), high: 'number' },   // m over the floor, by day, in the dim and at dusk; the chance a run goes high over everything
    hz: 'number', speed: 'number',                   // wingbeats a second; how fast it flies to a perch (m/s)
    cruise: nums(2), burst: 'number',                // m/s while hawking; the most it flies at
    climb: 'number', sink: 'number',                 // m/s
    turn: 'number', jerk: 'number', bank: 'number',  // the most it turns (rad/s), how fast its turning changes (rad/s/s), the most it banks (rad)
    loop: nums(2),                                   // the radius (m) of its loops
    modes: { run: 'number', loop: 'number', chase: 'number', swoop: 'number' },   // how often each: a run, a loop, a turn after an insect, down to the water
    bursts: { flap: nums(2), glide: nums(2) },       // seconds of flapping, and of gliding, by turns
    wing: { flap: nums(2), hand: nums(2), sweep: nums(2), glide: { flap: 'number', hand: 'number', sweep: nums(2) }, rock: 'number', tail: nums(2) },
    spell: nums(2), moveOn: 'number',                // seconds a party is about in its part of the valley; the chance it then goes for good
    dusk: optional('number'),                        // the sun's height (degrees), in the evening, below which it is off for the night
    perch: optional({ every: nums(2), stay: nums(2), reach: 'number', calls: nums(2) }),   // seconds between its perchings, on a perch; how far (m) it goes to one; seconds between calls there
    roost: optional({ gather: 'number', enter: nums(2), emerge: nums(2) }),   // the sun's height (degrees) below which, of an evening, it goes to the roost; at which it goes in, and at which it comes out
    ...WARY,                                         // how near it lets the walker come, on a perch (life/behave.js)
    call: { every: nums(2), time: 'number', rate: 'number', reach: 'number' },
  },
  act: (way) => (bird, world) => live(bird, world, way, aerial),
  home: homeOf,
};
