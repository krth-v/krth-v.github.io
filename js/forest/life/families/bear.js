import * as THREE from 'three';
import { live } from '../behave.js';
import { strideFor, stridesOf } from '../beasts.js';
import { test, nums } from '../bodies.js';
import { bearRange } from '../places/bear.js';
import { onTrunk } from '../perch.js';

const _gaits = { walk: 0, trot: 0, gallop: 0 };
const _shares = (walk, trot, gallop) => { _gaits.walk = walk; _gaits.trot = trot; _gaits.gallop = gallop; return _gaits; };

// The American black bear (life/species/blackBear.js): one that goes about on its own, or a sow with her young.
//
// The owner, 2026-11-18: "The bears need to be more present, I have yet to see a single bear." And of the mammals:
// "they are never doing interesting things." So a bear's party is about on every visit (the sheet's `census.sure`),
// it is there from the first, where a walker will see it, and it stays for most of a visit; and a walker may watch
// it: it goes on with what it is doing until they are near.
//
// Where. Its home for a visit is one stretch of the valley that the walk can see into (`bearRange`, below): the
// old clearing's grass, the river's bank and bar, the old cedar's wet ground among the skunk cabbage, a rotten log
// or a stump in the deep wood, the hill under the maples. It goes from one place of that stretch to the next on
// foot, its nose down, and after ten to twenty-five minutes of it ambles off out of the walker's sight, for a while
// or for good (it is then about again somewhere else in the valley), and comes in again from somewhere they cannot
// see. On the next visit its home is somewhere else.
//
// The walker. It goes on with what it is doing until they are within `shy` metres (the sheet's 22, at a walk; up
// to a third further for one who runs). Then it stands up on its hind legs, facing them, to look and to smell (NPS
// Olympic: "It may come closer or stand on its hind legs to get a better look or smell"; "A standing bear is
// usually curious, not threatening"), drops, ambles off twenty to forty metres the way they are not, and takes up
// again; for half a minute after that it does not stand again, and one who keeps on after it it only walks away
// from. It bolts only from one who is right on it (`flush`: 9 m) or who runs at it (running, and coming on, within
// `rush`): a gallop of fifty metres and more to somewhere they cannot see, where it stops, looks back, and takes up
// again. It is not gone for that: a bear that has run is still about.
//
// A sow with young. In May a sow has cubs of the year (born in late January or early February, out of the den in
// spring) or yearlings (who stay with her until about sixteen months, and part from her from late May into June).
// So a party of two or three is a sow with one or two young (`young`: the chance, set so that about one visit in
// three has a family; `cubs`: how often they are cubs of the year); otherwise it is a bear on its own and the rest
// of the party never comes. The young keep near her: they nose about while she feeds, now and then one stands up
// beside her, and they follow her when she goes, at her pace. They come only with her and go with her.
//
// The agent's own: every distance, time, pace and chance here; how a bear grazes, digs and lies; how its young
// follow. Paces: the bear runs at up to 9.5 m/s (no source read gave one). The count of walks holds it to the bar it
// holds every kind to, 16 m/s in plain view: a way's `fastest` only raises that bar, and the bear's, 13, is under it
// (life/visit.js).

const UP = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1), TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const wrap = (v) => Math.atan2(Math.sin(v), Math.cos(v));
const towards = (v, to, most) => v + clamp(to - v, -most, most);
const chance = test((v) => Number.isFinite(v) && v >= 0 && v <= 1, 'a chance, from 0 to 1');
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _near = [];
// It comes and goes no nearer the walker than this (m), and out of their sight.
const OFFSTAGE = 40;
// How much further off than at a walk a walker is felt: 1 for one who stands, strolls or walks (3.2 m/s), a third
// further for one who runs (7 m/s).
const felt = (world) => 1 + 0.35 * clamp(((world.walker ? world.walker.speed : 0) - 3.2) / 3.8, 0, 1);
// What every activity holds itself as, unless it says otherwise: every field of the plate rig's pose that this
// family ever sets (life/plateRig.js), so that nothing one activity asked for is left in the next. `rake`, `beat`
// and `cycle` only ever grow, and are kept apart (an eased stroke or stride that ran backwards would show).
const STILL = { lie: 0, sit: 0, rear: 0, cling: 0, dig: 0, roll: 0, arms: 0, rub: 0, box: 0, hold: 0, scratch: 0, shake: 0, turn: 0, grip: 0, crouch: 0,
  reach: 0.35, at: 0, neck: 0.6, jaw: 0, ears: 0, tail: 0, high: 0, stamp: 0, walk: 0 };
// the ways it holds itself that are let into and out of at a bear's own speed (a share a second, in and out)
const RATE = { lie: [1 / 2.6, 1 / 1.6], sit: [1 / 1.3, 1 / 1.0], rear: [1 / 0.9, 1 / 0.7], dig: [1 / 0.4, 1 / 0.5], cling: [1 / 0.3, 1 / 0.3] };
const RAMPS = Object.keys(RATE);
// the turns tried, in order, when the way ahead is shut
const ROUND = [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4, 1.9, -1.9, 2.5, -2.5];

// How far apart two bodies are, seen from above, each a line from rump to head with its width round it (as
// life/beasts.js and life/visit.js measure it). Below nothing they are in one another.
const _A = [0, 0, 0, 0], _B = [0, 0, 0, 0];
const toSeg = (px, pz, S) => { const dx = S[2] - S[0], dz = S[3] - S[1], l2 = dx * dx + dz * dz, t = l2 > 1e-9 ? clamp(((px - S[0]) * dx + (pz - S[1]) * dz) / l2, 0, 1) : 0; return Math.hypot(px - S[0] - dx * t, pz - S[1] - dz * t); };
const sideOf = (S, x, z) => Math.sign((S[2] - S[0]) * (z - S[1]) - (S[3] - S[1]) * (x - S[0]));
function bodyGap(ax, az, ah, a, bx, bz, bh, b) {
  const la = a.long * 0.85, lb = b.long * 0.85, A = _A, B = _B;
  A[0] = ax - Math.cos(ah) * la; A[1] = az - Math.sin(ah) * la; A[2] = ax + Math.cos(ah) * la; A[3] = az + Math.sin(ah) * la;
  B[0] = bx - Math.cos(bh) * lb; B[1] = bz - Math.sin(bh) * lb; B[2] = bx + Math.cos(bh) * lb; B[3] = bz + Math.sin(bh) * lb;
  if (sideOf(A, B[0], B[1]) !== sideOf(A, B[2], B[3]) && sideOf(B, A[0], A[1]) !== sideOf(B, A[2], A[3])) return -a.wide - b.wide;
  return Math.min(toSeg(A[0], A[1], B), toSeg(A[2], A[3], B), toSeg(B[0], B[1], A), toSeg(B[2], B[3], A)) - a.wide - b.wide;
}

function bear(a) {
  const { bird, world, way, r, life } = a, at = bird.at;
  const one = bird.who || { party: { members: [] } }, party = one.party, n = Math.max(0, party.members.indexOf(one));
  // Who this one is, decided once for the visit (kept from one coming to the next).
  if (party.young === undefined) party.young = party.members.length > 1 && r() < way.young ? (r() < way.cubs ? 'cubs' : 'yearlings') : null;
  const young = n > 0;
  if (!one.make) {
    one.make = young ? { age: party.young || 'none' } : { age: 'adult', sex: party.young || r() < 0.4 ? 'sow' : 'boar' };
    one.scale = !young ? (one.make.sex === 'boar' ? 1.05 + r() * 0.12 : 0.9 + r() * 0.12) : party.young === 'cubs' ? 0.38 + r() * 0.06 : 0.64 + r() * 0.08;
  }
  bird.make = one.make; bird.scale = one.scale; bird.big = true;
  const sheetBody = bird.body || { high: 0.84, long: 0.56, wide: 0.28 };
  bird.body = { high: sheetBody.high * bird.scale, long: sheetBody.long * bird.scale, wide: sheetBody.wide * bird.scale };
  bird.size *= bird.scale;
  const RADIUS = 0.45 * bird.scale;
  const home = bird.home || { x: at.x, z: at.z, places: [] };
  const mother = () => { const m = party.members[0] && party.members[0].bird; return m && m !== bird && m.left == null && m.state !== 'gone' ? m : null; };
  const what = young ? (party.young === 'cubs' ? 'a cub of the year' : 'a yearling') : bird.make.sex === 'sow' && party.young ? 'a sow' : 'a black bear';
  // (what a young one is doing, said of it by what it is: each made once, not every frame)
  const said = new Map(), youngly = (s) => { if (!young) return s; let t = said.get(s); if (!t) { t = `${what}, ${s}`; said.set(s, t); } return t; };

  // ---- its own state
  let heading = r() * TAU, speed = 0, cycle = 0, rake = 0, beat = 0, roll = 0, fresh = true, calm = 0, goal = null, last = Infinity, instant = false, turnedFrom = null;
  const ramp = { lie: 0, sit: 0, rear: 0, dig: 0, cling: 0 }, quick = young ? 2.2 : 1;
  // `N`: what the activity asks for in this step (made STILL again by `still()`, then set by the activity, then laid
  // by `hold`); `P`: the pose as it is laid on `bird.want`
  const N = { ...STILL, head: { yaw: 0, pitch: 0, tilt: 0 } };
  const P = { ...STILL, head: N.head, scale: bird.scale, trot: 0, gallop: 0, cycle: 0, rake: 0, beat: 0, ground: [0, 0, 0, 0] };
  const still = () => { Object.assign(N, STILL); N.head.yaw = 0; N.head.pitch = 0; N.head.tilt = 0; return N; };
  bird.state = 'stand';

  // ---- the ground: where it can step (cached by half metres), how it stands on it
  const cache = new Map();
  const can = (x, z) => {
    const k = Math.round(x * 2) * 65536 + Math.round(z * 2);
    let ok = cache.get(k);
    if (ok === undefined) { ok = world.walkable(x, z, RADIUS); if (cache.size > 6000) cache.clear(); cache.set(k, ok); }
    return ok;
  };
  let pitch = 0;
  const face = () => {
    const c = Math.cos(heading), s = Math.sin(heading), half = bird.body.long * 0.8;
    pitch = clamp(Math.atan2(world.height(at.x + c * half, at.z + s * half) - world.height(at.x - c * half, at.z - s * half), 2 * half), -0.35, 0.35);
    bird.q.setFromAxisAngle(UP, -heading).multiply(_q.setFromAxisAngle(AZ, pitch));
    bird.heading = heading;
  };
  const ground = () => { at.y = world.height(at.x, at.z); };
  // the ground under each foot over the plane it stands on ([left fore, right fore, left hind, right hind]: its
  // right is +z of its own frame)
  const FEET = [[0.21, -0.13], [0.21, 0.13], [-0.34, -0.13], [-0.34, 0.13]];
  const feet = () => {
    const c = Math.cos(heading), s = Math.sin(heading), k = bird.scale, tp = Math.tan(pitch);
    for (let i = 0; i < 4; i += 1) {
      const fx = FEET[i][0] * k, fz = FEET[i][1] * k;
      P.ground[i] = ramp.cling > 0 ? 0 : clamp(world.height(at.x + c * fx - s * fz, at.z + s * fx + c * fz) - (at.y + fx * tp), -0.2 * k, 0.2 * k);
    }
  };

  // ---- room: never a step or a turn to within a hand of another animal's body, nor nearer one it is already too near.
  // Nothing is let off it: a sow and her young do not pass through one another (they go round, and the young get out
  // of her way: below)
  let blocker = null;
  // (another's body is the line life/visit.js measures it by: its frame's own +x laid flat, and the world's +x where
  // that is upright. A bear on a trunk has its +x up the bark; measured by the heading it had on the ground, as
  // `headingOf` reads it, a sow walked into a yearling as it dropped off the trunk)
  const _lx = new THREE.Vector3();
  const lineOf = (other) => { _lx.set(1, 0, 0).applyQuaternion(other.q); return _lx.x * _lx.x + _lx.z * _lx.z < 1e-8 ? 0 : Math.atan2(_lx.z, _lx.x); };
  function room(x, z, h) {
    let least = Infinity;
    blocker = null;
    for (const other of world.others(x, z, 4.5, bird, _near)) {
      if (other.left != null || other.state === 'gone' || other.state === 'fly') continue;
      if (other.body) { const gap = bodyGap(x, z, h, bird.body, other.at.x, other.at.z, lineOf(other), other.body); if (gap < least) { least = gap; blocker = other; } continue; }
      if (other.at.y > world.height(x, z) + bird.body.high + 0.3) continue;            // (a bird above its back)
      const l = bird.body.long * 0.85, ax = x - Math.cos(h) * l, az = z - Math.sin(h) * l, dx = 2 * Math.cos(h) * l, dz = 2 * Math.sin(h) * l;
      const t = clamp(((other.at.x - ax) * dx + (other.at.z - az) * dz) / (dx * dx + dz * dz), 0, 1);
      least = Math.min(least, Math.hypot(other.at.x - ax - dx * t, other.at.z - az - dz * t) - bird.body.wide - 0.12);
    }
    return least;
  }
  const ROOM = 0.08;
  // (what stood in the way, if it was one of her own young: they are told to get out of it, behind her)
  const inWay = () => { if (!young && blocker && blocker.who && blocker.who.party === party) { party.clear = world.clock + 2; party.aim = heading; } };
  // (a step is asked of the ground itself, not of the half-metre cache the way ahead is read from, and with a little
  // less room than the way ahead is chosen with: a cell read as shut where the bear already stood held it there, and
  // at the very edge of a log's room every step along it was shut; from ground it should not be on, any step is let go)
  const stepTo = (x, z) => { if (!world.walkable(x, z, RADIUS * 0.85) && world.walkable(at.x, at.z, RADIUS * 0.85)) return false; const now = room(at.x, at.z, heading), next = room(x, z, heading); if (next < ROOM && next < now) { inWay(); return false; } at.x = x; at.z = z; return true; };
  const turnTo = (h) => { const now = room(at.x, at.z, heading), next = room(at.x, at.z, h); if (next < ROOM && next < now) { inWay(); return false; } heading = h; return true; };

  // ---- walking: towards a point at a pace, round what is in the way; `shun`, in flight from the walker, it never
  // bears off round something towards them
  let aheadBy = 0, closeBy = 0;
  const open = (h) => can(at.x + Math.cos(h) * aheadBy, at.z + Math.sin(h) * aheadBy) && world.walkable(at.x + Math.cos(h) * closeBy, at.z + Math.sin(h) * closeBy, RADIUS);
  function move(dt, tx, tz, most, shun = false) {
    const dx = tx - at.x, dz = tz - at.z, dist = Math.hypot(dx, dz);
    let want = dist < 0.25 ? 0 : most * clamp(dist / 1.5, 0.25, 1), aim = Math.atan2(dz, dx);
    const toWalker = Math.atan2(world.eye.z - at.z, world.eye.x - at.x);
    if (shun) { const rel = wrap(aim - toWalker - Math.PI); if (Math.abs(rel) > 1.45) aim = toWalker + Math.PI + Math.sign(rel) * 1.45; }
    // (a way is open if it is open a stride or so ahead and at the very next step: beside a log's round side a way
    // can be open further on and shut at once)
    aheadBy = (0.9 + speed * 0.35) * Math.max(0.6, bird.scale); closeBy = 0.25 * Math.max(0.6, bird.scale);
    if (want > 0 && !open(aim)) {
      let found = null;
      for (const turn of ROUND) {
        const h = aim + turn;
        if (shun && Math.cos(h - toWalker) > -0.05) continue;
        if (open(h)) { found = h; break; }
      }
      if (found == null) want = 0; else aim = found;
    }
    // (lying, sat down, up on its hind legs or on a trunk, it gets up or down first: it does not slide along the
    // ground while it does)
    if (ramp.lie > 0.05 || ramp.rear > 0.05 || ramp.sit > 0.05 || ramp.cling > 0.05 || Math.abs(roll) > 0.05) { speed = 0; bird.speed = 0; return dist; }
    const turn = wrap(aim - heading), most2 = (speed > 5 ? 2.0 : 1.7) * dt;
    if (!turnTo(heading + clamp(turn, -most2, most2)) && Math.abs(turn) > 2.4) turnTo(heading - Math.sign(turn) * most2);
    const off = Math.abs(wrap(aim - heading)), slow = off > 0.6 ? 1 - Math.min(0.8, (off - 0.6) * 0.7) : 1;
    speed += clamp(want * slow - speed, -4 * dt, (most > 6 ? 6 : 2) * dt);
    if (speed > 0.01 && !stepTo(at.x + Math.cos(heading) * speed * dt, at.z + Math.sin(heading) * speed * dt)) speed *= 0.3;
    // (no nearer for two seconds and wanting to go on: a step back, from whatever it has walked up to, and the turn
    // is made from there)
    else if (want > 0 && goal && world.clock - goal.since > 2 && speed < 0.15) stepTo(at.x - Math.cos(heading) * 0.4 * dt, at.z - Math.sin(heading) * 0.4 * dt);
    bird.speed = speed; ground(); face();
    // `stuck` once it has come no nearer for five seconds
    if (!goal || Math.hypot(goal.x - tx, goal.z - tz) > 1) { goal = goal || { x: 0, z: 0, best: 0, since: 0 }; goal.x = tx; goal.z = tz; goal.best = dist; goal.since = world.clock; }
    else if (dist < goal.best - 0.25) { goal.best = dist; goal.since = world.clock; }
    bird.stuck = world.clock - goal.since > 5;
    return dist;
  }
  const stop = (dt) => { speed = Math.max(0, speed - 3 * dt); if (speed > 0.01 && !stepTo(at.x + Math.cos(heading) * speed * dt, at.z + Math.sin(heading) * speed * dt)) speed = 0; bird.speed = speed; ground(); face(); };
  // turning on the spot towards a bearing, at a walk's turn
  const turnToward = (dt, h) => { turnTo(heading + clamp(wrap(h - heading), -1.2 * dt, 1.2 * dt)); face(); };

  // ---- how it holds itself: what the activity has set in `N` since `still()`; `lie`, `sit`, `rear`, `dig` and
  // `cling` are let into and out of at a bear's own speed (lying down takes seconds), the gait's shares and the
  // stride's place come from how fast it goes. `strokes`: a forepaw's strokes a second while it digs; `beats`: how
  // fast `beat` runs on (what it rubs, scratches and shakes by)
  function hold(dt, strokes = 0.8, beats = 0) {
    // (one there when the visit began is found as it is: lying, not lying down)
    // (a cub or a yearling gets down and up again twice as quickly: it tumbles)
    for (const k of RAMPS) { ramp[k] = instant ? N[k] : towards(ramp[k], N[k], (N[k] > ramp[k] ? RATE[k][0] : RATE[k][1]) * quick * dt); N[k] = ramp[k]; }
    roll = instant ? N.roll : towards(roll, N.roll, 1.6 * quick * dt); N.roll = roll;
    instant = false;
    // (a gait is chosen by the pace at its own size: a cub at its mother's walk is at a trot)
    const f = speed / Math.sqrt(bird.scale), moving = f > 0.05 ? 1 : 0, tr = smooth(1.8, 2.6, f), ga = smooth(4.6, 6.0, f);
    const pacing = moving * (1 - tr), trot = moving * tr * (1 - ga), gallop = moving * ga;
    // A turn on the spot is stepped round, not slid round, as the elk's is (life/beasts.js `hold`): on all fours and
    // not at work with a paw, it takes short steps of a walk by how fast it turns (radians a second: no more than it
    // can, so that one set down facing a new way does not take a dozen strides in a frame), and its feet go as far as
    // the turn carries them, 0.3 m from its middle at the sheet's size. (The shares and the reach are the agent's own.)
    const turned = turnedFrom == null || !(dt > 0) ? 0 : Math.min(2.5, Math.abs(wrap(heading - turnedFrom)) / dt);
    turnedFrom = heading;
    const up = ramp.lie < 0.1 && ramp.sit < 0.1 && ramp.rear < 0.1 && ramp.dig < 0.1 && ramp.cling < 0.1;
    const stepping = speed < 0.4 && up ? clamp(turned * 0.6, 0, 0.6) : 0;
    const walk = Math.max(pacing, stepping, N.walk), going = Math.max(speed, stepping > 0 ? turned * 0.3 * bird.scale : 0);
    // (by the strides the rig sweeps its feet by, which are its own sheet's: by the elk's, its feet slid at every gait)
    if (moving || stepping > 0) cycle += (going * dt) / (strideFor(_shares(Math.max(pacing, stepping), trot, gallop), stridesOf(bird.sheet)) * bird.scale);
    if (ramp.dig > 0.05) rake += dt * strokes;
    beat += dt * beats;
    feet();
    Object.assign(P, N);
    P.scale = bird.scale; P.walk = walk; P.trot = trot; P.gallop = gallop; P.cycle = cycle; P.rake = rake; P.beat = beat;
    Object.assign(bird.want, P);
    // (its state is by its pace: one stepping round where it stands is standing, to its young and to the visit)
    bird.state = ramp.cling > 0.5 ? 'cling' : ramp.lie > 0.5 ? 'lie' : ramp.sit > 0.5 ? 'sit' : ramp.rear > 0.5 ? 'rear' : gallop > 0.5 ? 'gallop' : trot > 0.5 ? 'trot' : pacing > 0.5 ? 'walk' : 'stand';
  }
  // its head turned to the walker as far as a neck goes (into `N.head`); past that it is the bear that turns, a
  // little at a time
  const watch = (dt, turnBody = true, lift = 0) => {
    const off = wrap(Math.atan2(world.eye.z - at.z, world.eye.x - at.x) - heading), d = Math.hypot(world.eye.x - at.x, world.eye.z - at.z);
    if (turnBody && Math.abs(off) > 1.2 && speed < 0.3) turnToward(dt, heading + Math.sign(off) * (Math.abs(off) - 1.0));
    N.head.yaw = clamp(off, -1.3, 1.3); N.head.pitch = clamp(Math.atan2(world.eye.y - (at.y + bird.body.high + 0.2), d), -0.4, 0.45) + lift;
  };
  // its nose working: the jaw a little open and shut, quickly
  const sniff = () => 0.12 + 0.1 * Math.sin(world.clock * 13 + n);
  const dist = () => Math.hypot(world.eye.x - at.x, world.eye.z - at.z);
  const event = (name) => { if (world.event) world.event(bird.key, name); };
  const restful = () => world.day < 0.08 || ((world.hour ?? 12) > 11.5 && (world.hour ?? 12) < 15.5);
  // what a spot of ground is, to a bear
  const kindAt = (x, z) => { const g = world.ground(x, z); return g === 'grass' || g === 'wet' || g === 'stones' ? g : 'floor'; };

  // ---- where to go: a place of its home that no other animal is at, nearer rather than further; one to walk off
  // to, out of sight
  const placeFree = (p) => world.free(_v.set(p.x, world.height(p.x, p.z), p.z), bird, 1.2);
  const nextPlace = (now) => {
    let best = null, score = -Infinity;
    for (const p of home.places || []) {
      if (p === now || !placeFree(p)) continue;
      const far = Math.hypot(p.x - at.x, p.z - at.z);
      if (far < 3) continue;
      const sc = -far * 0.03 + r() * 1.2;
      if (sc > score) { score = sc; best = p; }
    }
    return best;
  };
  const nearestPlace = () => { let best = null, least = 14; for (const p of home.all || home.places || []) { const far = Math.hypot(p.x - at.x, p.z - at.z); if (far < least && placeFree(p)) { least = far; best = p; } } return best || { kind: kindAt(at.x, at.z), x: at.x, z: at.z }; };
  const exitFrom = (far) => world.offstage(at, bird, r, { least: far * 0.6, most: far * 1.3, away: true, clear: OFFSTAGE, spread: 2.6 }) || runAway(far);
  function runAway(far) {
    const base = Math.atan2(at.z - world.eye.z, at.x - world.eye.x);
    for (const k of [1, 0.7, 0.45]) for (const turn of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2]) {
      const x = at.x + Math.cos(base + turn) * far * k, z = at.z + Math.sin(base + turn) * far * k;
      if (can(x, z)) return new THREE.Vector3(x, 0, z);
    }
    return new THREE.Vector3(at.x + Math.cos(base) * far, 0, at.z + Math.sin(base) * far);
  }
  // Where it goes when a walker has come too near: a place twenty to forty metres off, the way they are not, well
  // outside the distance at which it stands up, and off the walk if that can be had; one of the valley's places if
  // one lies that way, else open ground. (Looked for once, as it sets off.)
  function retreatTo() {
    const ex = world.eye.x, ez = world.eye.z, d0 = dist(), away = Math.atan2(at.z - ez, at.x - ex), need = way.shy * 1.35 + 6;
    let best = null, score = -Infinity;
    for (const p of home.all || home.places || []) {
      const far = Math.hypot(p.x - at.x, p.z - at.z);
      if (far < 16 || far > 44) continue;
      const fromWalker = Math.hypot(p.x - ex, p.z - ez), turn = Math.abs(wrap(Math.atan2(p.z - at.z, p.x - at.x) - away));
      if (fromWalker < need || fromWalker < d0 + 8 || turn > 1.4 || !placeFree(p)) continue;
      const sc = -Math.abs(far - 28) * 0.04 - turn * 0.8 + Math.min(p.off, 30) * 0.05 + r() * 0.8;
      if (sc > score) { score = sc; best = p; }
    }
    if (best) return best;
    for (let tries = 0; tries < 16; tries += 1) {
      const h = away + (r() - 0.5) * (tries < 8 ? 1.6 : 2.6), far = 20 + r() * 20, x = at.x + Math.cos(h) * far, z = at.z + Math.sin(h) * far;
      if (!can(x, z) || Math.hypot(x - ex, z - ez) < need) continue;
      if (tries < 12 && world.trail && world.trail.distance(x, z) < 14) continue;
      return { kind: kindAt(x, z), x, z };
    }
    const x = at.x + Math.cos(away) * 24, z = at.z + Math.sin(away) * 24;
    return { kind: kindAt(x, z), x, z };
  }
  // gone from where it is, once it is out of the walker's sight and far enough off; true when it has gone
  // (not the one a close-up is held on, as for the elk: a trunk crosses a bear forty metres off every second or two
  // in a long lens, and held, it was gone at the first)
  const vanish = (seconds) => {
    if (bird.held || dist() < OFFSTAGE || world.plainly(bird)) return false;
    bird.left = seconds;
    if (!young) { party.left = seconds; party.gone = world.clock; }
    a.to('gone');
    return true;
  };
  // (how far its own steps carried it towards the walker since it began to run: the count keeps the most)
  const ran = (since, before) => {
    if (bird.ran !== since) { bird.ran = since; bird.towards = 0; }
    bird.towards += Math.max(0, before - dist()); bird.closer = Math.max(bird.closer || 0, bird.towards);
  };

  // ---- trunks (2026-11-19): one near to rub its back on or to climb. A trunk of the habitat's (life/habitat.js
  // `trunks`) at least 0.2 m round its axis at 1.5 m and more than six metres tall, within `reach` of where it is,
  // its foot at least `clear` metres from the walk; with `away`, only one that lies the far side of it from the
  // walker; never `not` (a sibling's). The nearest such. (Asked for when an activity begins, never every frame.)
  const _trees = [];
  const treeNear = (reach, away = false, not = null, clear = 8) => {
    world.trunksNear(at.x, at.z, reach, _trees);
    let best = null, least = Infinity;
    const ex = world.eye.x - at.x, ez = world.eye.z - at.z;
    for (const t of _trees) {
      if (t === not || t.girth < 0.2 || t.top < 6) continue;
      const tx = t.foot.x - at.x, tz = t.foot.z - at.z, d = Math.hypot(tx, tz);
      if (away && tx * ex + tz * ez > 0) continue;
      if (world.trail && world.trail.distance(t.foot.x, t.foot.z) < clear) continue;
      if (d < least) { least = d; best = t; }
    }
    return best;
  };
  // A way up a trunk, from its foot to `top` metres above it, on the side that faces this bear: a point on the bark
  // and the way out of it every fifth of a metre (life/perch.js `onTrunk`, read once as it sets off). `standoff`,
  // where it stands on the ground to go up: out from the bark at the foot of the way, its nose short of it.
  const _o = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() };
  function wayUp(t, top) {
    let turn = 0, most = -Infinity;
    const fx = at.x - t.foot.x, fz = at.z - t.foot.z;
    for (let k = 0; k < 16; k += 1) { onTrunk(t, 1, k / 16, _o); const d = _o.normal.x * fx + _o.normal.z * fz; if (d > most) { most = d; turn = k / 16; } }
    const STEP = 0.2, count = Math.max(3, Math.ceil(Math.min(top, t.top - 1) / STEP) + 1), pts = new Float32Array(count * 3), out = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      onTrunk(t, i * STEP, turn, _o);
      _o.normal.y = Math.max(-0.3, Math.min(0.3, _o.normal.y)); _o.normal.normalize();
      pts[i * 3] = _o.point.x; pts[i * 3 + 1] = _o.point.y; pts[i * 3 + 2] = _o.point.z;
      out[i * 3] = _o.normal.x; out[i * 3 + 1] = _o.normal.y; out[i * 3 + 2] = _o.normal.z;
    }
    const off = 0.25 + 0.9 * bird.scale, nx = out[0], nz = out[2], l = Math.hypot(nx, nz) || 1;
    return { t, STEP, count, pts, out, top: (count - 1) * STEP, low: Math.min((count - 2) * STEP, 0.55 * bird.scale), stand: new THREE.Vector3(pts[0] + (nx / l) * off, 0, pts[2] + (nz / l) * off), face: Math.atan2(-nz, -nx) };
  }
  // Where on that way it is at `h` metres above the trunk's foot, and its frame there as the rig has a beast on a
  // trunk (life/plateRig.js `cling`): +x up the trunk, +y out of the bark.
  const _ax = new THREE.Vector3(), _ay = new THREE.Vector3(), _az = new THREE.Vector3(), _m = new THREE.Matrix4();
  function onWay(way2, h, into, q) {
    const f = clamp(h / way2.STEP, 0, way2.count - 1.001), i = Math.floor(f), u = f - i, p = way2.pts, o = way2.out, j = i * 3;
    into.set(p[j] + (p[j + 3] - p[j]) * u, p[j + 1] + (p[j + 4] - p[j + 1]) * u, p[j + 2] + (p[j + 5] - p[j + 2]) * u);
    _ax.set(p[j + 3] - p[j], p[j + 4] - p[j + 1], p[j + 5] - p[j + 2]).normalize();
    _ay.set(o[j] + (o[j + 3] - o[j]) * u, o[j + 1] + (o[j + 4] - o[j + 1]) * u, o[j + 2] + (o[j + 5] - o[j + 2]) * u);
    _ay.addScaledVector(_ax, -_ay.dot(_ax)).normalize();
    _az.crossVectors(_ax, _ay);
    q.setFromRotationMatrix(_m.makeBasis(_ax, _ay, _az));
  }
  // its frame standing on the ground, facing `h`, level
  const groundFrame = (h, q) => q.setFromAxisAngle(UP, -h);
  // does it have young about now
  const withYoung = () => !young && party.young && party.members.some((m, i) => i > 0 && m.bird && m.bird.left == null && m.bird.state !== 'gone');
  // (a slide straight to a spot a stride or two off, where the ground's own test of room shuts it out: beside a trunk)
  const slideTo = (dt, x, z, v) => { const dx = x - at.x, dz = z - at.z, d = Math.hypot(dx, dz); if (d < 0.02) return d; const s = Math.min(d, v * dt); const h = Math.atan2(dz, dx); if (room(at.x + (dx / d) * s, at.z + (dz / d) * s, heading) > ROOM) { at.x += (dx / d) * s; at.z += (dz / d) * s; } speed = 0; bird.speed = v; if (Math.abs(wrap(h - heading)) < 1.2) cycle += s / (strideFor(_shares(1, 0, 0), stridesOf(bird.sheet)) * bird.scale); ground(); face(); return d - s; };

  // ---- the sow's (or a lone bear's) activities
  const pose = () => P;
  // Up a trunk and down again (any bear: 2026-11-19). `why`: 'idle', a little way up and down for nothing but the
  // climbing; 'flee', up out of the walker's reach when they came too near, and down once they have gone on;
  // 'treed', a cub or a yearling sent up by its mother, down when she has done standing guard. It walks to the foot
  // of the trunk on the side that faces it, stands up against it, goes onto the bark (its frame turned from the
  // ground's onto the trunk's over half a second, as it stands up), climbs at its own pace, holds on there and looks
  // about, and backs down tail first and steps off. Nothing takes it off the trunk but its own way down: whatever
  // sends it elsewhere only says so (`now.down`), and it comes down first. Its feet keep to the rig's climbing stride,
  // a quarter of a walking one (life/plateRig.js `cling`): `cycle` runs on by the metres climbed and back by the
  // metres it backs down.
  const UP_PACE = young ? 0.85 : 0.6, DOWN_PACE = young ? 0.55 : 0.4;
  const _cp = new THREE.Vector3(), _cq = new THREE.Quaternion(), _cb = { q: _cq };
  const climbStride = () => 0.25 * strideFor(_shares(1, 0, 0), stridesOf(bird.sheet)) * bird.scale;
  const climb = {
    pose,
    enter: (a, t, top, why, holdFor = 3, place = null) => {
      Object.assign(a.now, { way: wayUp(t, top), why, holdFor, place, phase: 'to', since: world.clock, blend: 0, h: 0, look: 0, yaw: 0, far: 0,
        qFrom: new THREE.Quaternion(), qTo: new THREE.Quaternion(), from: new THREE.Vector3(), to: new THREE.Vector3() });
      a.now.h = a.now.way.low;
      bird.stuck = false; goal = null;
      if (why !== 'idle') event(why === 'treed' ? 'sent up a tree' : 'ran up a tree');
    },
    step: (a, dt) => {
      const now = a.now, w = now.way, m = young ? mother() : null;
      still();
      // (what would bring it down: the hold done, its mother gone off or done guarding, the walker gone on)
      if (now.phase === 'hold') {
        now.holdFor -= dt;
        if (now.why === 'idle') now.down = now.down || now.holdFor <= 0 || (young && (!m || Math.hypot(m.at.x - at.x, m.at.z - at.z) > 9));
        else if (now.why === 'treed') now.down = now.down || !party.treed || !m;
        else { now.far = dist() > way.shy * 1.4 ? now.far + dt : 0; now.down = now.down || now.far > 8 || world.clock - now.since > 150; }
      }
      if (now.phase === 'to') {
        // to the foot of the trunk
        const d = Math.hypot(w.stand.x - at.x, w.stand.z - at.z), pace2 = now.why === 'idle' ? way.amble : young ? way.trot : way.gallop * 0.7;
        if (d > 1.6 && !bird.stuck) { move(dt, w.stand.x, w.stand.z, pace2, now.why !== 'idle'); }
        else if (d > 0.08) { N.walk = 1; slideTo(dt, w.stand.x, w.stand.z, 0.6); }
        else { now.phase = 'face'; now.since2 = world.clock; }
        if (world.clock - now.since > 25 || (bird.stuck && d > 2.5)) { afterTrunk(a); return; }
        N.neck = 0.5; N.head.pitch = 0.1;
        hold(dt);
        bird.doing = now.why === 'treed' ? youngly('scrambling to a tree') : now.why === 'flee' ? 'running for a tree' : 'going over to a trunk';
        return;
      }
      if (now.phase === 'face') {
        stop(dt);
        turnToward(dt, w.face);
        N.rear = 1; N.arms = 1; N.neck = 0.9; N.head.pitch = 0.3;
        hold(dt);
        bird.doing = now.why === 'idle' ? 'standing up against a trunk, its paws on the bark' : now.why === 'treed' ? youngly('scrambling up a tree') : 'scrambling up a tree';
        if (Math.abs(wrap(w.face - heading)) < 0.12 && ramp.rear > 0.8 || world.clock - now.since2 > 2.5) {
          // (onto the bark only if there is room there for its body as the count measures one on a trunk; else it
          // waits, and gives it up after six seconds)
          onWay(w, w.low, now.to, now.qTo);
          if (room(now.to.x, now.to.z, 0) < ROOM + 0.05) { if (world.clock - now.since2 > 6) afterTrunk(a); return; }
          heading = w.face; turnedFrom = heading; now.phase = 'mount'; now.blend = 0;
          now.from.copy(at); now.qFrom.copy(bird.q);
        }
        return;
      }
      if (now.phase === 'mount' || now.phase === 'off') {
        // onto the bark, or off it: the frame turned and carried over half a second, as it stands up or drops
        now.blend = Math.min(1, now.blend + dt / 0.55);
        const e = now.blend * now.blend * (3 - 2 * now.blend);
        at.lerpVectors(now.from, now.to, e); bird.q.slerpQuaternions(now.qFrom, now.qTo, e); bird.heading = lineOf(bird);
        if (now.phase === 'mount') { N.cling = 1; N.rear = 0; N.arms = 1; } else { N.cling = 0; N.rear = 0; }
        N.grip = w.t.girth; N.neck = 0.8;
        speed = 0; bird.speed = 0;
        hold(dt);
        bird.doing = now.phase === 'mount' ? (young ? youngly('climbing a tree') : 'climbing a trunk') : (young ? youngly('dropping down off the trunk') : 'dropping down off the trunk');
        if (now.blend < 1) return;
        if (now.phase === 'mount') { now.phase = 'up'; return; }
        at.y = world.height(at.x, at.z); groundFrame(heading, bird.q); face();
        afterTrunk(a);
        return;
      }
      // on the bark: up, held there, or down
      const top = w.top;
      let dh = 0;
      if (now.phase === 'up') { dh = Math.min(UP_PACE * dt, top - now.h); if (now.h + dh >= top - 1e-3) now.phase = 'hold'; }
      else if (now.phase === 'hold') { if (now.down) now.phase = 'down'; }
      else if (now.phase === 'down') {
        dh = -Math.min(DOWN_PACE * dt, now.h - w.low);
        // (off the trunk only where there is room on the ground for it: it holds on at the foot of the trunk until there is)
        if (now.h + dh <= w.low + 1e-3 && room(w.stand.x, w.stand.z, w.face) < ROOM + 0.1) { dh = 0; now.waiting = true; }
        else if (now.h + dh <= w.low + 1e-3) {
          now.phase = 'off'; now.blend = 0; now.from.copy(at); now.qFrom.copy(bird.q);
          now.to.set(w.stand.x, world.height(w.stand.x, w.stand.z), w.stand.z); groundFrame(w.face, now.qTo);
        }
      }
      // (and no step up or down the bark into another's body, as the count measures a body on a trunk: by its frame's
      // +x laid flat, which swings with the trunk's lean as it goes)
      if (dh !== 0) {
        onWay(w, now.h + dh, _cp, _cq);
        const next = room(_cp.x, _cp.z, lineOf(_cb)), here = room(at.x, at.z, lineOf(bird));
        if (next < ROOM && next < here) { dh = 0; now.waiting = true; if (now.phase === 'up') now.phase = 'hold'; }
      }
      now.h += dh;
      cycle += dh / climbStride();
      // (its heading, for whoever reads it, is the line the count measures its body by: `lineOf`, above)
      onWay(w, now.h, at, bird.q); bird.heading = lineOf(bird);
      speed = 0; bird.speed = 0;
      N.cling = 1; N.grip = w.t.girth; N.walk = dh !== 0 ? 1 : 0;
      now.look -= dt;
      if (now.phase === 'hold') {
        // held on, looking about, or at the walker if they are near
        if (dist() < 45) { watch(dt, false); N.head.pitch -= 0.3; }
        else { if (now.look <= 0) { now.look = 1.5 + r() * 3; now.yaw = (r() - 0.5) * 2; } N.head.yaw = now.yaw; N.head.pitch = -0.2; }
        N.neck = 0.85;
      } else { N.neck = 0.8; N.head.pitch = now.phase === 'down' ? -0.35 : 0.2; }
      hold(dt);
      bird.doing = now.phase === 'up' ? youngly(now.why === 'treed' ? 'climbing up a tree out of harm\'s way' : now.why === 'flee' ? 'climbing a tree out of your way' : 'climbing a little way up a trunk')
        : now.phase === 'down' ? youngly(dh === 0 && now.waiting ? 'clinging low on the trunk, waiting to come down' : 'backing down the trunk, tail first')
        : youngly(now.why === 'treed' ? 'up a tree, clinging to the trunk' : now.why === 'flee' ? 'up a tree, watching you' : 'clinging to a trunk, looking about');
    },
  };
  // what it does once off the trunk (or once it gives the trunk up): a young one goes back to its mother; a bear that
  // went up out of the walker's way ambles off out of their sight, half the time; else it takes up feeding
  function afterTrunk(a) {
    if (young) { a.to('follow'); return; }
    if (a.now.why === 'flee' && r() < 0.5) { a.leave(a.awhile()); return; }
    calm = Math.max(calm, 15);
    a.to('feed', a.now.place || nearestPlace());
  }
  const activities = {
    // in from out of sight to the first place of its home
    arrive: {
      pose,
      enter: (a, place) => { a.now.place = place; a.now.tries = 0; },
      step: (a, dt) => {
        const place = a.now.place, d = move(dt, place.x, place.z, way.amble);
        still(); N.neck = 0.45; N.head.yaw = 0.25 * Math.sin(world.clock * 0.6); N.head.pitch = -0.1;
        hold(dt);
        bird.doing = 'ambling in, its nose to the ground';
        if (d < 0.6 || (bird.stuck && d < 10)) a.to('feed', place);
        else if (bird.stuck) {
          // No way to the place from where it came in (the ravine or the river between: the way in is found by where
          // it can stand, not by the way from there): another place of its home, twice, and then it feeds where it
          // has got to. (It ambled in for as long as it was watched, twelve minutes; and with no other place to try
          // it asked for one in every frame. How many it tries is the agent's own.)
          const p = a.now.tries < 2 ? nextPlace(place) : null;
          if (p) { a.now.place = p; a.now.tries += 1; }
          else a.to('feed', { kind: kindAt(at.x, at.z), x: at.x, z: at.z });
        }
      },
    },
    // feeding at a place of its home, by what the place is
    feed: {
      pose,
      enter: (a, place) => Object.assign(a.now, { place, until: 10 + r() * 22, bout: 0, nudge: null, sway: r() * 6, dug: 0 }),
      step: (a, dt) => {
        const now = a.now, place = now.place;
        now.bout -= dt;
        party.stay = (party.stay ?? way.stay[0] + r() * (way.stay[1] - way.stay[0])) - dt;
        // there first (a place it was sent to may be some way off): on foot, its nose to the ground
        const off = Math.hypot(place.x - at.x, place.z - at.z);
        if (off > 0.7 && !now.there) {
          const d = move(dt, place.x, place.z, way.amble);
          still(); N.neck = 0.3; N.head.yaw = 0.3 * Math.sin(world.clock * 0.7 + now.sway); N.head.pitch = -0.15; N.jaw = sniff() * 0.5;
          hold(dt);
          bird.doing = 'ambling on, its nose to the ground';
          // (stuck well short of it, it feeds where it has got to, on what grows there: sent on as if it had arrived,
          // it would have worked at a log some metres off. By reading; not seen.)
          if (d < 0.7 || bird.stuck) { now.there = true; if (d > 1.5) now.place = { kind: kindAt(at.x, at.z), x: at.x, z: at.z }; }
          return;
        }
        now.there = true;
        now.until -= dt;
        still();
        if (place.face != null) {
          // at dead wood: square to it, tearing at it with a forepaw, and nosing into what it tears open
          const toWork = place.wx != null ? Math.atan2(place.wz - at.z, place.wx - at.x) : place.face;
          // (it stops, steps round to face the wood, and then sets to work. It had turned without stopping: the pace
          // it came at was kept for as long as the turn took, up to 2.6 s, and its legs walked on the spot, with a
          // forepaw already tearing at the air. Four seconds of turning is enough: with no room to turn it works as
          // it stands)
          stop(dt);
          if (!now.square) {
            now.turning = (now.turning || 0) + dt;
            if (Math.abs(wrap(toWork - heading)) > 0.08 && now.turning < 4) {
              turnToward(dt, toWork);
              N.neck = 0.3; N.head.pitch = -0.2;
              hold(dt);
              bird.doing = place.kind === 'log' ? 'turning to a rotten log' : 'turning to a rotten stump';
              return;
            }
            now.square = true;
          } else if (Math.abs(wrap(toWork - heading)) > 0.08) turnToward(dt, toWork);
          if (now.bout <= 0) {
            // (a while of tearing at it, and now and then it sits back on its haunches to eat what it found)
            if (now.dug > 5 && r() < 0.4) { a.to('eat', place.kind === 'log' ? 'sitting back on its haunches, eating the grubs it dug out' : 'sitting back on its haunches, eating the ants it tore out', place); return; }
            now.bout = 2 + r() * 5; now.nose = !now.nose && r() < 0.45;
          }
          if (!now.nose) now.dug += dt;
          // (the stance's reach is from the shoulder and its height from the feet, both at the sheet's size)
          const far = place.wx != null ? Math.hypot(place.wx - at.x, place.wz - at.z) : place.reach;
          if (now.nose) { N.neck = 0.15; N.head.pitch = -0.25; N.jaw = 0.2 + 0.15 * Math.sin(world.clock * 7); }
          else { N.dig = 1; N.reach = clamp(far / bird.scale - 0.17, 0.15, 0.55); N.at = clamp(place.at / bird.scale, 0, 0.6); N.neck = 0.3; N.head.pitch = -0.3; N.jaw = 0.05; }
          hold(dt, 0.9);
          bird.doing = place.kind === 'log' ? (now.nose ? 'licking up grubs from a rotten log' : 'tearing a rotten log apart for grubs') : now.nose ? 'licking up ants from a stump it has torn open' : 'tearing a rotten stump apart for ants';
        } else if (place.kind === 'stones') {
          // on a bar: turning cobbles over with a paw, and nosing under them
          if (now.bout <= 0 && now.dug > 6 && r() < 0.3) { a.to('eat', 'sitting on the stones, eating what it found under them', place); return; }
          if (!now.nose) now.dug += dt;
          if (now.bout <= 0) { now.bout = 1.5 + r() * 4; now.nose = !now.nose; if (!now.nose && r() < 0.6) { const h = heading + (r() - 0.5); now.nudge = now.nudge || { x: 0, z: 0 }; now.nudge.x = at.x + Math.cos(h) * 0.5; now.nudge.z = at.z + Math.sin(h) * 0.5; now.going = true; } }
          if (now.going && Math.hypot(now.nudge.x - at.x, now.nudge.z - at.z) > 0.12 && !bird.stuck) move(dt, now.nudge.x, now.nudge.z, 0.5); else { now.going = false; stop(dt); }
          if (now.nose) { N.neck = 0.05; N.head.yaw = 0.2 * Math.sin(world.clock); N.jaw = 0.15; }
          else { N.dig = 1; N.reach = 0.32; N.neck = 0.25; N.head.pitch = -0.3; }
          hold(dt, 0.6);
          bird.doing = now.nose ? 'nosing under the stones it has turned' : 'turning stones over by the river';
        } else {
          // grazing: muzzle in the sedge or the grass, chewing; a step or two at a time; in the wet ground now and
          // then it digs at a skunk cabbage, and on the forest's floor it noses through the litter and digs for roots
          const floor = place.kind === 'floor';
          if (now.bout <= 0 && now.dig && r() < 0.45) { a.to('eat', place.kind === 'wet' ? 'sitting to eat a skunk cabbage it dug up' : 'sitting to eat the roots it dug up', place); return; }
          if (now.bout <= 0) {
            now.bout = 3 + r() * 8; now.dig = (place.kind === 'wet' && r() < 0.35) || (floor && r() < 0.4);
            // (and now and then its head comes up, chewing, and it looks about: a bear grazing in the ferns is seen
            // by its head)
            now.up = !now.dig && r() < 0.3; if (now.up) { now.bout = 2 + r() * 2.5; now.yaw = (r() - 0.5) * 1.6; }
            const h = heading + (r() - 0.5) * 1.4, step = 0.3 + r() * 0.6;
            now.nudge = now.nudge || { x: 0, z: 0 }; now.nudge.x = at.x + Math.cos(h) * step; now.nudge.z = at.z + Math.sin(h) * step; now.going = !now.dig;
          }
          if (now.going && Math.hypot(now.nudge.x - at.x, now.nudge.z - at.z) > 0.12 && !bird.stuck) move(dt, now.nudge.x, now.nudge.z, 0.45); else { now.going = false; stop(dt); }
          if (now.dig) { N.dig = 1; N.reach = 0.3; N.neck = 0.2; N.head.pitch = -0.3; }
          else if (now.up) { N.neck = 0.8; N.head.yaw = now.yaw; N.head.pitch = 0.1; N.jaw = 0.2 + 0.2 * Math.sin(world.clock * 8); N.ears = 0.6; }
          else { N.neck = 0; N.head.yaw = 0.25 * Math.sin(world.clock * 0.5 + now.sway); N.jaw = floor ? sniff() : 0.25 + 0.25 * Math.sin(world.clock * 8); }
          hold(dt, 0.7);
          bird.doing = now.up ? (floor ? 'its head up from the litter, sniffing the air' : 'its head up, chewing, looking about') : place.kind === 'wet' ? (now.dig ? 'digging at a skunk cabbage' : 'grazing sedges and skunk cabbage in the wet ground')
            : floor ? (now.dig ? 'digging in the litter for roots' : 'nosing through the litter') : 'grazing on new grass';
        }
        if (now.until > 0) return;
        // done here: off out of sight once it has been about long enough; else, now and then, a rest; else on to
        // the next place
        if (party.stay < 0) { party.stay = null; a.leave(r() < way.gone ? Infinity : a.awhile()); return; }
        nextThing(place);
      },
    },
    // lying down, its head on its paws now and then raised
    rest: {
      pose,
      enter: (a, place) => Object.assign(a.now, { place, until: 20 + r() * (restful() ? 50 : 25), look: 0, yaw: 0, up: false }),
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt; now.look -= dt;
        stop(dt);
        if (now.look <= 0) { now.look = 3 + r() * 9; now.up = r() < 0.5; now.yaw = now.up ? (r() - 0.5) * 1.2 : 0; }
        still(); N.lie = 1; N.neck = now.up ? 0.45 : 0.25; N.head.yaw = now.yaw; N.head.pitch = now.up ? 0.15 : -0.15;
        hold(dt);
        bird.doing = 'lying down, resting';
        if (now.until < 0) a.to('feed', now.place);
      },
    },
    // up on its hind legs, facing the walker, nose up and working; then down, and off a little way
    stand: {
      pose,
      enter: (a) => { Object.assign(a.now, { until: 3.5 + r() * 2.5, turned: 0 }); event('stood up'); if (r() < 0.4) world.say(bird, 'huff', 60); if (withYoung()) treeThem(); },
      step: (a, dt) => {
        const now = a.now;
        stop(dt);
        still();
        // (down from whatever it was at, and round to face them, before it stands)
        const off = wrap(Math.atan2(world.eye.z - at.z, world.eye.x - at.x) - heading), low = ramp.lie > 0.05 || ramp.sit > 0.05 || Math.abs(roll) > 0.05;
        now.turned += dt;
        if (!low && Math.abs(off) > 0.15) turnToward(dt, heading + off);
        const facing = !low && (Math.abs(off) < 0.7 || now.turned > 3);
        if (facing) now.until -= dt;
        watch(dt, false, facing ? 0.2 : 0);
        N.rear = facing ? 1 : 0; N.neck = facing ? 0.75 : 0.9; N.jaw = sniff(); N.ears = 1;
        hold(dt);
        bird.doing = facing ? 'standing up on its hind legs to look at you and smell the air' : low ? 'getting up' : 'turning to look at you';
        if (now.until <= 0) { if (party.treed && party.treed.tree) a.to('guard'); else { party.treed = null; retreat(); } }
      },
    },
    // ambling off from the walker a little way, looking back over its shoulder, and taking up again there
    retreat: {
      pose,
      enter: (a, to) => Object.assign(a.now, { to, look: 1 + r() * 3, since: world.clock }),
      step: (a, dt) => {
        const now = a.now, d = move(dt, now.to.x, now.to.z, way.amble * 1.3, true);
        now.look -= dt;
        const back = now.look < 0 && now.look > -1.4;
        if (now.look < -1.4) now.look = 3 + r() * 5;
        still(); N.neck = 0.55; N.head.pitch = -0.05;
        if (back) watch(dt, false);
        hold(dt);
        bird.doing = ramp.rear > 0.05 ? 'dropping to all fours' : back ? 'ambling off a little way, looking back at you' : 'ambling off a little way';
        if (d < 0.8 || bird.stuck || world.clock - now.since > 70) { calm = 28 + r() * 16; a.to('feed', d < 2 ? now.to : nearestPlace()); }
      },
    },
    // off at a gallop from one who is right on it or who runs at it, to somewhere they cannot see; there it stops,
    // looks back, and takes up again
    bolt: {
      pose,
      enter: (a, to) => { Object.assign(a.now, { to, since: world.clock, runs: 0, looking: 0 }); world.say(bird, 'huff', 90); event('ran'); },
      step: (a, dt) => {
        const now = a.now;
        if (now.looking > 0) {
          now.looking -= dt;
          stop(dt);
          still(); watch(dt, true); N.neck = 0.9; N.jaw = sniff(); N.ears = 1;
          hold(dt);
          bird.doing = 'stopped, looking back the way it ran';
          if (now.looking <= 0) { calm = 20 + r() * 15; a.to('feed', nearestPlace()); }
          return;
        }
        const gallop = world.clock - now.since < 12, before = dist();
        if ((now.to.x - at.x) * (world.eye.x - at.x) + (now.to.z - at.z) * (world.eye.z - at.z) > 0) now.to = exitFrom(60);
        const d = move(dt, now.to.x, now.to.z, gallop ? way.gallop : way.trot, true);
        still(); N.neck = 0.65; N.head.pitch = 0.05; N.ears = -1;
        hold(dt);
        bird.doing = gallop ? 'running off at a gallop' : 'loping away into the trees';
        ran(now.since, before);
        if (d < 3 || world.clock - now.since > 20) now.looking = 3 + r() * 3;
        else if (bird.stuck) { now.runs += 1; now.to = now.runs > 3 ? runAway(50) : exitFrom(60); }
      },
    },
    // ambling off out of the walker's sight, for a while or for good, and gone from there
    amble: {
      pose,
      enter: (a, exit, seconds) => { party.exit = exit; Object.assign(a.now, { exit, seconds, runs: 0, hurry: false }); },
      step: (a, dt) => {
        const now = a.now;
        // (the walker has moved, and its way off now lies their side of it: another)
        // (her young go by `party.exit` once she has gone: left as it was, they made for the way she had given up)
        if ((now.exit.x - at.x) * (world.eye.x - at.x) + (now.exit.z - at.z) * (world.eye.z - at.z) > 0) now.exit = party.exit = exitFrom(70);
        const before = dist(), d = move(dt, now.exit.x, now.exit.z, now.hurry ? way.gallop : way.amble * 1.15, true);
        still(); N.neck = now.hurry ? 0.65 : 0.5; N.head.pitch = -0.05; N.ears = now.hurry ? -1 : 0;
        hold(dt);
        bird.doing = ramp.lie > 0.05 || ramp.sit > 0.05 ? 'getting up' : now.hurry ? 'running off at a gallop' : 'ambling off into the trees';
        if (now.hurry) ran(now.since, before);
        if (vanish(now.seconds)) return;
        if (d < 3 || bird.stuck) { now.runs += 1; now.exit = party.exit = now.runs > 4 ? runAway(60) : exitFrom(80); }
      },
    },
    // (2026-11-19: what a bear does between one place and the next, besides feeding)
    // sat on its haunches, eating what it dug up, held to its mouth in its forepaws
    eat: {
      pose,
      enter: (a, what, place) => Object.assign(a.now, { what, place, until: 4 + r() * 6 }),
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt;
        stop(dt);
        still(); N.sit = 1; N.hold = ramp.sit > 0.6 ? 1 : 0; N.neck = 0.5; N.head.pitch = -0.1 + 0.08 * Math.sin(world.clock * 1.7); N.jaw = 0.25 + 0.25 * Math.sin(world.clock * 9); N.ears = 0.3;
        hold(dt);
        bird.doing = ramp.sit < 0.5 ? 'sitting down on its haunches' : now.what;
        if (now.until < 0) a.to('feed', now.place);
      },
    },
    // stood up with its back to a trunk, rubbing it up and down on the bark (it walks to the trunk first, and turns
    // its back to it)
    rub: {
      pose,
      enter: (a, t, place) => {
        let turn = 0, most = -Infinity;
        const fx = at.x - t.foot.x, fz = at.z - t.foot.z;
        for (let k = 0; k < 16; k += 1) { onTrunk(t, 1.2, k / 16, _o); const d = _o.normal.x * fx + _o.normal.z * fz; if (d > most) { most = d; turn = k / 16; } }
        onTrunk(t, 1.2, turn, _o);
        const nx = _o.normal.x, nz = _o.normal.z, l = Math.hypot(nx, nz) || 1, off = 0.12 + 0.3 * bird.scale;
        Object.assign(a.now, { place, phase: 'to', since: world.clock, until: 6 + r() * 8, x: _o.point.x + (nx / l) * off, z: _o.point.z + (nz / l) * off, face: Math.atan2(nz, nx), girth: t.girth });
        bird.stuck = false; goal = null;
        event('rubbed');
      },
      step: (a, dt) => {
        const now = a.now;
        still();
        if (now.phase === 'to') {
          const d = Math.hypot(now.x - at.x, now.z - at.z);
          if (d > 1.6 && !bird.stuck) move(dt, now.x, now.z, way.amble);
          else if (d > 0.08) { N.walk = 1; slideTo(dt, now.x, now.z, 0.6); }
          else now.phase = 'turn';
          if (world.clock - now.since > 30 || (bird.stuck && d > 2.5)) { a.to('feed', now.place || nearestPlace()); return; }
          N.neck = 0.45; N.head.pitch = -0.1;
          hold(dt);
          bird.doing = 'going over to a trunk';
          return;
        }
        stop(dt);
        if (now.phase === 'turn') {
          turnToward(dt, now.face);
          hold(dt);
          bird.doing = 'turning its back to a trunk';
          if (Math.abs(wrap(now.face - heading)) < 0.1 || world.clock - now.since > 40) { now.phase = 'rub'; now.since = world.clock; }
          return;
        }
        now.until -= dt;
        N.rear = 1; N.rub = ramp.rear > 0.7 ? 1 : 0; N.arms = -0.6; N.neck = 0.9; N.head.tilt = 0.3 * Math.sin(world.clock * 1.1); N.head.pitch = 0.25; N.jaw = 0.25; N.ears = -0.3;
        hold(dt, 0.8, 1.3);
        bird.doing = ramp.rear < 0.7 ? 'standing up with its back to a trunk' : 'rubbing its back up and down on a trunk';
        if (now.until < 0) a.to('feed', now.place || nearestPlace());
      },
    },
    // seeing to its coat: sat up scratching behind an ear with a hind foot, and then shaking itself
    groom: {
      pose,
      enter: (a, place) => Object.assign(a.now, { place, until: 2.5 + r() * 3, side: r() < 0.5 ? -1 : 1, shake: 1.6 }),
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt;
        stop(dt);
        still();
        if (now.until > 0) {
          N.sit = 1; N.scratch = ramp.sit > 0.6 ? now.side : 0; N.neck = 0.6; N.jaw = 0.1; N.ears = -0.3;
          hold(dt, 0.8, 3);
          bird.doing = ramp.sit < 0.6 ? 'sitting down on its haunches' : 'sitting up, scratching behind its ear with a hind foot';
          return;
        }
        // then up and shaking itself, nose to tail
        if (ramp.sit > 0.1) { hold(dt); bird.doing = 'getting up'; return; }
        now.shake -= dt;
        N.shake = 1; N.neck = 0.55; N.ears = -0.5;
        hold(dt, 0.8, 1);
        bird.doing = 'shaking itself, nose to tail';
        if (now.shake < 0) a.to('feed', now.place || nearestPlace());
      },
    },
    // flopped on its back (or its side), wriggling on the ground, paws in the air, and up again
    roll: {
      pose,
      enter: (a, place) => Object.assign(a.now, { place, until: 6 + r() * 7, to: (r() < 0.5 ? -1 : 1) * (r() < 0.65 ? 2.7 : 1.4) }),
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt;
        stop(dt);
        still();
        const down = now.until > 0;
        N.lie = down ? 1 : 0;
        N.roll = down && ramp.lie > 0.8 ? now.to + 0.2 * Math.sin(world.clock * 2.4) : 0;
        N.neck = 0.6; N.head.yaw = 0.4 * Math.sin(world.clock * 0.7); N.jaw = 0.1;
        hold(dt);
        const back = Math.abs(now.to) > 2;
        bird.doing = !down ? 'rolling back onto its feet' : ramp.lie < 0.8 ? 'lying down' : Math.abs(roll) < 0.5 ? (back ? 'rolling onto its back' : 'rolling onto its side')
          : back ? 'lying on its back, paws in the air, wriggling to scratch its back' : 'lying stretched out on its side';
        if (!down && Math.abs(roll) < 0.05 && ramp.lie < 0.05) a.to('feed', now.place || nearestPlace());
      },
    },
    // A sow whose young are up a tree, standing guard under it: between the tree and the walker, a little off the
    // trunk, watching them; now and then up on her hind legs; and if they come too near, huffing and stamping a
    // forefoot, her jaws popping. She does not leave them. Once the walker has gone on (out past half as far again
    // as `shy` for ten seconds), or after two minutes, she calls the young down and takes up feeding.
    guard: {
      pose,
      enter: (a) => {
        const t = party.treed.tree, fx = at.x - t.foot.x, fz = at.z - t.foot.z, l = Math.hypot(fx, fz) || 1, off = t.girth + 1.5 + 0.6 * bird.scale;
        Object.assign(a.now, { since: world.clock, far: 0, x: t.foot.x + (fx / l) * off, z: t.foot.z + (fz / l) * off, up: 0, next: 2 + r() * 4, huff: 0 });
        event('stood guard');
      },
      step: (a, dt) => {
        const now = a.now, d = dist(), k = felt(world);
        still();
        const off = Math.hypot(now.x - at.x, now.z - at.z);
        if (off > 0.5 && !bird.stuck && ramp.rear < 0.05) move(dt, now.x, now.z, way.amble); else stop(dt);
        now.next -= dt; now.up -= dt; now.huff -= dt;
        if (now.next <= 0 && off <= 0.5) { now.next = 6 + r() * 8; now.up = 2.5 + r() * 2; }
        const close = d < way.flush * k * 1.4;
        if (close && now.huff <= 0) { now.huff = 3 + r() * 3; world.say(bird, 'huff', 60); event('huffed'); }
        watch(dt, speed < 0.3);
        if (now.up > 0 && !close) { N.rear = 1; N.neck = 0.8; N.jaw = sniff(); N.ears = 1; N.head.pitch += 0.2; }
        else if (close) { N.stamp = Math.max(0, Math.sin(world.clock * 5)); N.jaw = Math.sin(world.clock * 7) > 0.6 ? 0.45 : 0.05; N.neck = 0.55; N.ears = -1; }
        else { N.neck = 0.75; N.jaw = sniff(); N.ears = 0.5; }
        hold(dt);
        bird.doing = off > 0.5 && speed > 0.1 ? 'going to stand under the tree her young are up' : close ? 'huffing and stamping a forefoot at you, her jaws popping, her young up the tree behind her'
          : now.up > 0 ? 'standing up under the tree her young are up, watching you' : 'standing guard under the tree her young are up, watching you';
        now.far = d > way.shy * 1.5 ? now.far + dt : 0;
        if (now.far > 10 || world.clock - now.since > 120 || !withYoung()) { party.treed = null; calm = 30 + r() * 20; a.to('feed', nearestPlace()); }
      },
    },
    climb,
  };
  const retreat = () => { a.to('retreat', retreatTo()); event('moved off a little way'); return true; };
  // Off from one who is right on it or runs at it: a sow with young sends them up a tree and stands guard under it
  // (if there is one: else she runs, and they after her); a bear on its own runs, or, one time in three, goes up a
  // trunk near by that is not the walker's side of it.
  const bolt = () => {
    if (withYoung()) { treeThem(); if (party.treed.tree) return a.to('guard'); party.treed = null; }
    if (!party.young && r() < 0.35) { const t = treeNear(9, true, null, 6); if (t) return a.to('climb', t, 4 + r() * 3, 'flee', 0, null); }
    a.to('bolt', exitFrom(60)); return true;
  };
  // A sow's young up a tree: each finds its own when it next steps (their `follow`), the first one found is hers to
  // stand under. With none found she gives it up (below, and in `guard`).
  function treeThem() {
    if (!party.treed) party.treed = { since: world.clock, tree: null };
    const youngOnes = party.members.slice(1).map((m) => m.bird).filter((b) => b && b.left == null);
    // (asked here, so that she knows at once whether there is one: the young look for theirs the same way)
    if (!party.treed.tree) for (const b of youngOnes) { const t = treeNearOf(b, 14); if (t) { party.treed.tree = t; break; } }
  }
  // a trunk for one of her young: the nearest to it within `reach`, not the walker's side of it, its foot 6 m and
  // more from the walk (as `treeNear`, from where that one stands)
  function treeNearOf(b, reach, not = null) {
    world.trunksNear(b.at.x, b.at.z, reach, _trees);
    let best = null, least = Infinity;
    const ex = world.eye.x - b.at.x, ez = world.eye.z - b.at.z;
    for (const t of _trees) {
      if (t === not || t.girth < 0.12 || t.top < 6) continue;
      const tx = t.foot.x - b.at.x, tz = t.foot.z - b.at.z, d = Math.hypot(tx, tz);
      if (tx * ex + tz * ez > 0 && d > 2) continue;
      if (world.trail && world.trail.distance(t.foot.x, t.foot.z) < 6) continue;
      if (d < least) { least = d; best = t; }
    }
    return best;
  }
  // What it does once done at a place, if it is not yet time to go: on to another place of its home (most often), or
  // first one of the things a bear does between (the agent's shares; at midday and by night it rests more).
  const nextThing = (place) => {
    const k = r(), quiet = restful();
    if (k < (quiet ? 0.18 : 0.08)) return a.to('rest', place);
    if (k < (quiet ? 0.25 : 0.15)) return a.to('roll', place);
    if (k < (quiet ? 0.33 : 0.24)) return a.to('groom', place);
    if (k < (quiet ? 0.45 : 0.40)) { const t = treeNear(12); if (t) return a.to('rub', t, place); }
    if (k < (quiet ? 0.52 : 0.50) && !withYoung()) { const t = treeNear(12); if (t) return a.to('climb', t, 1.6 + r() * 1.8, 'idle', 2 + r() * 4, place); }
    const p = nextPlace(place);
    return a.to('feed', p || place);
  };

  // ---- the young: near their mother, doing as she does. Every step keeps a hand and more off her body and off one
  // another's (room, above); to get where it is going a young one goes round her and never into her (`around`), and
  // when she is in its way, or it in hers, it is off out of it. When she lies down it lies beside her, a body's width
  // off her flank, on the side it is on.
  const _w = { x: 0, z: 0 };
  const around = (tx, tz) => {
    let vx = tx - at.x, vz = tz - at.z;
    const l = Math.hypot(vx, vz) || 1;
    vx /= l; vz /= l;
    for (const other of world.others(at.x, at.z, 3.5, bird, _near)) {
      if (!other.body || other.left != null || other.state === 'gone') continue;
      // the nearest point of its line, how far it is off that body, and whether its way runs into it
      const h = lineOf(other), L = other.body.long * 0.85, ax = other.at.x - Math.cos(h) * L, az = other.at.z - Math.sin(h) * L, dx = 2 * Math.cos(h) * L, dz = 2 * Math.sin(h) * L;
      const t = clamp(((at.x - ax) * dx + (at.z - az) * dz) / (dx * dx + dz * dz), 0, 1);
      let ux = at.x - ax - dx * t, uz = at.z - az - dz * t;
      const d = Math.hypot(ux, uz) || 1e-6, gap = d - other.body.wide - bird.body.wide, into = -(vx * ux + vz * uz) / d;
      if (gap > 0.8 || into <= 0) continue;
      ux /= d; uz /= d;
      // (it slides round, along its side, the way its own way already leans)
      const sx = -uz, sz = ux, lean = Math.sign(vx * sx + vz * sz) || (n === 1 ? 1 : -1), k = into * (0.8 - Math.max(0, gap)) / 0.8;
      vx += (ux * 0.7 + sx * lean * 1.3) * k; vz += (uz * 0.7 + sz * lean * 1.3) * k;
    }
    const v = Math.hypot(vx, vz) || 1, step = Math.min(l, 2);
    _w.x = at.x + (vx / v) * step; _w.z = at.z + (vz / v) * step;
    return _w;
  };
  const youngActs = {
    follow: {
      pose,
      enter: (a) => Object.assign(a.now, { side: n === 1 ? -1 : 1, back: 1.8 + r() * 1.4, wander: 0, stand: 0, nose: 0 }),
      step: (a, dt) => {
        const now = a.now, m = mother();
        still();
        if (!m) {
          // she has gone: after her, along her way off, and gone too once out of sight
          const exit = party.exit || exitFrom(70), away = party.left ?? Infinity, w = around(exit.x, exit.z);
          move(dt, w.x, w.z, way.trot, true);
          hold(dt);
          bird.doing = youngly('hurrying after its mother');
          if (vanish(away === Infinity ? Infinity : away + 2 + r() * 4)) return;
          if (bird.stuck) party.exit = exitFrom(70);
          return;
        }
        now.wander -= dt; now.stand -= dt; now.nose -= dt;
        // sent up a tree by her (she stood up to look at the walker, or they came at her): the nearest trunk the far
        // side of it from them, the one she looked out for if it was the first of them to go, else one of its own
        if (party.treed && triedFor !== party.treed) {
          triedFor = party.treed;
          const tr = party.treed, mine = !tr.first && tr.tree && Math.hypot(tr.tree.foot.x - at.x, tr.tree.foot.z - at.z) < 16 ? tr.tree : treeNearOf(bird, 14, tr.first || null);
          if (mine) { if (!tr.first) tr.first = mine; if (!tr.tree) tr.tree = mine; a.to('climb', mine, 2.6 + r() * 2.6, 'treed', 0); return; }
        }
        // with the other of them, to play: the first of them starts it, the other joins it
        if (party.play && party.play.until > world.clock && n === 2) { a.to('wrestle'); return; }
        const mh = m.heading ?? 0, c = Math.cos(mh), sn = Math.sin(mh), lying = m.state === 'lie';
        const feeding = m.state === 'stand' || lying || m.state === 'rear' || m.state === 'sit', hurry = (m.speed || 0) > 2.2, fleeing = m.state === 'gallop' || m.state === 'trot';
        // (which side of her it is on: + her right)
        const side = Math.sign(-sn * (at.x - m.at.x) + c * (at.z - m.at.z)) || now.side;
        if (now.wander < 0) { now.wander = 4 + r() * 8; now.side = r() < 0.5 ? -1 : 1; now.back = feeding ? 1.8 + r() * 2.6 : 1.7 + r() * 1.2; }
        let tx, tz, near = 0.5;
        if (world.clock < (party.clear ?? -1)) {
          // in her way: straight out from her, on the side it is on
          const ux = at.x - m.at.x, uz = at.z - m.at.z, d = Math.hypot(ux, uz) || 1;
          tx = m.at.x + (ux / d) * (d + 2.5); tz = m.at.z + (uz / d) * (d + 2.5);
        } else if (lying) {
          // beside her flank on its own side, a body's width off her (the first young at her shoulder, the second at her haunch)
          const lat = m.body.wide + 3 * bird.body.wide + 0.04, along = (n === 1 ? 0.15 : -0.5) * m.body.long;
          tx = m.at.x + c * along - sn * side * lat; tz = m.at.z + sn * along + c * side * lat; near = 0.3;
        } else {
          // beside or behind her, now this side and now that (never nearer her side than her width and more)
          const lat = Math.max(now.back * 0.7, m.body.wide + bird.body.wide + 0.5) * now.side, back = now.back * 0.7;
          tx = m.at.x - c * back - sn * lat; tz = m.at.z - sn * back + c * lat;
        }
        const far = Math.hypot(tx - at.x, tz - at.z);
        const most = hurry ? Math.max(way.trot, (m.speed || 0) * 1.15) : far > 4 ? way.trot * 0.8 : way.amble;
        if (far > near) { const w = around(tx, tz); move(dt, w.x, w.z, most, fleeing); } else stop(dt);
        // lying beside her, while she lies
        if (lying && far <= near + 0.25 && speed < 0.2) {
          N.lie = 1; N.neck = 0.3; N.head.yaw = 0.25 * Math.sin(world.clock * 0.3 + n); N.head.pitch = -0.1;
          hold(dt);
          bird.doing = youngly('lying beside its mother');
          return;
        }
        // when she stands up to look, it may too
        if (m.state === 'rear' && now.stand < -3 && r() < 0.5) now.stand = 2.5 + r() * 2;
        if (now.stand > 0 && speed < 0.3) {
          watch(dt, false); N.rear = 1; N.neck = 0.75; N.jaw = sniff(); N.ears = 1;
          hold(dt);
          bird.doing = youngly('standing up beside its mother');
          return;
        }
        // play, while she feeds: two of them wrestle, one alone rolls on its back or pounces; now and then one goes a
        // little way up a trunk near her (the agent's own rates)
        if (feeding && !hurry && !lying && !party.treed && speed < 0.3 && world.clock > (party.playNext ?? 0) && Math.hypot(m.at.x - at.x, m.at.z - at.z) < 6) {
          const sib = sibling();
          if (sib && n === 1 && r() < dt * 0.1) { if (startPlay(sib)) { a.to('wrestle'); return; } party.playNext = world.clock + 10; }
          else if (!sib && r() < dt * 0.06) { party.playNext = world.clock + 15 + r() * 25; a.to('romp'); return; }
        }
        if (feeding && !hurry && !lying && !party.treed && speed < 0.3 && r() < dt * 0.02 && world.clock > (party.climbNext ?? 0)) {
          const t = treeNearOf(bird, 8);
          party.climbNext = world.clock + 30 + r() * 40;
          if (t) { a.to('climb', t, 1.6 + r() * 2, 'idle', 2 + r() * 4); return; }
        }
        if (feeding && !lying && far < 1 && now.nose <= 0 && r() < dt * 0.3) now.nose = 2 + r() * 4;
        if (now.nose > 0) { N.neck = 0.05; N.head.yaw = 0.4 * Math.sin(world.clock * 1.3 + n); N.jaw = 0.15; }
        else { N.neck = hurry ? 0.6 : 0.5; N.head.yaw = 0.3 * Math.sin(world.clock * 0.8 + n); }
        hold(dt);
        bird.doing = hurry ? youngly('running after its mother') : world.clock < (party.runBack ?? -1) && far > 1 ? youngly('running back to its mother')
          : now.nose > 0 ? youngly('nosing about by its mother') : youngly('keeping close to its mother');
      },
    },
    // Two young at play, by their mother (2026-11-19): set a fixed gap apart, facing each other (their bodies a
    // hand and more apart, as two bodies must be), they spar up on their hind legs cuffing, one tumbles over and the
    // other paws at it, and they mouth at each other with their heads low, by turns, for ten to twenty seconds; then
    // back to her. Over if she moves off, the walker sends them up a tree, or one of them has gone.
    wrestle: {
      pose,
      enter: (a) => Object.assign(a.now, { side: n === 1 ? -1 : 1, set: false }),
      step: (a, dt) => {
        const now = a.now, play = party.play, m = mother();
        still();
        if (!play || !m || world.clock > play.until || party.treed || (m.speed || 0) > 0.8 || !sibling() || Math.hypot(m.at.x - at.x, m.at.z - at.z) > 10) {
          if (play) { party.play = null; party.playNext = world.clock + 25 + r() * 35; party.runBack = world.clock + 4; }
          a.to('follow'); return;
        }
        const dx = Math.cos(play.th), dz = Math.sin(play.th), sx = play.cx + dx * play.D * 0.5 * now.side, sz = play.cz + dz * play.D * 0.5 * now.side;
        const face = now.side < 0 ? play.th : play.th + Math.PI, d = Math.hypot(sx - at.x, sz - at.z);
        if (!now.set) {
          if (d > 0.6 && !bird.stuck) move(dt, sx, sz, way.trot * 0.6);
          else if (d > 0.05) { N.walk = 1; slideTo(dt, sx, sz, 0.7); }
          else now.set = true;
          if (world.clock - play.since > 8 && !now.set) { party.play = null; party.playNext = world.clock + 30; a.to('follow'); return; }
          N.neck = 0.6; N.ears = 0.5;
          hold(dt);
          bird.doing = youngly('bounding over to the other to play');
          return;
        }
        stop(dt);
        turnToward(dt, face);
        const k = Math.floor(Math.max(0, world.clock - play.since) / 2.8) % 3, first = now.side < 0;
        if (k === 0) { N.rear = 1; N.box = 1; N.arms = 0.3; N.neck = 0.7; N.jaw = 0.35; N.ears = -0.6; bird.doing = youngly('up on its hind legs, wrestling and cuffing at the other'); }
        else if (k === 1 && first) { N.lie = 1; N.roll = ramp.lie > 0.7 ? 1.3 + 0.25 * Math.sin(world.clock * 4) : 0; N.neck = 0.6; N.jaw = 0.3; bird.doing = youngly('tumbled over on its side, batting at the other'); }
        else if (k === 1) { N.dig = 1; N.reach = 0.4; N.at = 0.05; N.neck = 0.3; N.jaw = 0.4; N.ears = -0.6; bird.doing = youngly('pawing at the other, which has tumbled over'); }
        else { N.crouch = 1; N.neck = 0.25; N.jaw = 0.45; N.ears = -0.8; N.head.yaw = 0.35 * Math.sin(world.clock * 3 + n); bird.doing = youngly('mouthing at the other, their heads low'); }
        hold(dt, 1.6, 2.2);
      },
    },
    // one young on its own at play by its mother: on its back batting at the air, or crouching and pouncing
    romp: {
      pose,
      enter: (a) => Object.assign(a.now, { until: 5 + r() * 5, back: r() < 0.5 }),
      step: (a, dt) => {
        const now = a.now, m = mother();
        now.until -= dt;
        if (!m || party.treed || (m.speed || 0) > 0.8) now.until = Math.min(now.until, 0);
        stop(dt);
        still();
        if (now.back) {
          const down = now.until > 0;
          N.lie = down ? 1 : 0; N.roll = down && ramp.lie > 0.8 ? 2.6 + 0.3 * Math.sin(world.clock * 3) : 0; N.neck = 0.6; N.jaw = 0.2;
          hold(dt);
          bird.doing = down ? (ramp.lie > 0.8 ? youngly('on its back, batting at the air with its paws') : youngly('flopping down')) : youngly('rolling back onto its feet');
          if (!down && Math.abs(roll) < 0.05 && ramp.lie < 0.05) a.to('follow');
          return;
        }
        const ph = (world.clock * 0.8 + n * 0.3) % 1;
        N.crouch = ph < 0.6 ? 1 : 0; N.dig = ph >= 0.6 ? 1 : 0; N.reach = 0.35; N.neck = 0.3; N.ears = 1;
        hold(dt, 1.5);
        bird.doing = youngly('crouching and pouncing on something in the grass');
        if (now.until < 0) a.to('follow');
      },
    },
    climb,
  };
  // the other of her young, if it is about; and a game with it, if there is room for one
  let triedFor = null;
  const sibling = () => { const o = party.members[n === 1 ? 2 : 1], b = o && o.bird; return b && b !== bird && b.left == null && b.state !== 'gone' ? b : null; };
  const startPlay = (sib) => {
    if (sib.state !== 'stand' && sib.state !== 'walk') return false;
    const th = Math.atan2(sib.at.z - at.z, sib.at.x - at.x), D = 0.85 * (bird.body.long + sib.body.long) + bird.body.wide + sib.body.wide + 0.15;
    const cx = (at.x + sib.at.x) / 2, cz = (at.z + sib.at.z) / 2;
    if (!can(cx - Math.cos(th) * D * 0.5, cz - Math.sin(th) * D * 0.5) || !can(cx + Math.cos(th) * D * 0.5, cz + Math.sin(th) * D * 0.5)) return false;
    party.play = { since: world.clock, until: world.clock + 10 + r() * 10, cx, cz, th, D };
    event('played');
    return true;
  };

  // ---- the walker, taken a bear's way (the young take it by their mother: they do as she does)
  const react = (a, dt) => {
    // (one that has been too far off to be drawn is found as it is, not eased through every stride it took meanwhile)
    if (fresh || bird.shown < 0) { bird.snap = true; fresh = false; }
    if (young || a.name === 'gone') return false;
    const d = dist(), k = felt(world), w = world.walker, coming = dt > 0 && last < Infinity && w.speed > 0.4 && (last - d) / dt > 0.4;
    last = d; calm -= dt;
    if (a.name === 'bolt' || a.name === 'guard') return false;
    // (on a trunk, or making for one out of the walker's way, it is its own: it comes down by its own way, when the
    // walker has gone on)
    if (a.name === 'climb' && (a.now.phase !== 'to' || a.now.why !== 'idle')) return false;
    // off at a gallop: one who is right on it, or who runs at it
    if (d < way.flush * k || (w.speed > 4.5 && coming && d < way.rush)) {
      if (!party.met) { party.met = true; event('met'); }
      // (on its way off out of sight already: the rest of that way at a gallop)
      if (a.name === 'amble') { if (!a.now.hurry) { a.now.hurry = true; a.now.since = world.clock; world.say(bird, 'huff', 90); event('ran'); } return false; }
      return bolt();
    }
    if (a.name === 'amble' || a.name === 'stand' || a.name === 'retreat') return false;
    if (d < way.shy * k) {
      if (!party.met) { party.met = true; event('met'); }
      // up on its hind legs to look, and then off a little way; one who keeps on after it, it only walks away from
      if (calm <= 0) return a.to('stand');
      if (d < way.shy * k * 0.75) return retreat();
    }
    return false;
  };

  // ---- coming on foot: there when the visit began, or ambling in from somewhere the walker cannot see
  const place0 = () => (home.places && home.places.length && placeFree(home.places[0]) ? home.places[0] : nextPlace(null)) || { kind: home.kind || 'grass', x: home.x, z: home.z };
  const placeAt = (x, z) => { at.set(x, 0, z); ground(); face(); };
  const begin = () => {
    if (young) {
      if (!party.young) { bird.left = Infinity; return; }
      const m = mother();
      if (!m) { bird.left = 4 + r() * 6; return; }                   // (not without her: it comes when she does)
      if (life && life.first) {
        // beside her from the first
        for (let tries = 0; tries < 12; tries += 1) {
          const h = r() * TAU, d = 1.8 + r() * 1.6;
          placeAt(m.at.x + Math.cos(h) * d, m.at.z + Math.sin(h) * d);
          heading = r() * TAU; face();
          if (can(at.x, at.z) && room(at.x, at.z, heading) > 0.25) { instant = true; a.to('follow'); return; }
        }
        bird.left = 3 + r() * 4; return;
      }
      // in along her way in, a few seconds behind her
      const entry = party.entry;
      if (!entry) { bird.left = 4 + r() * 4; return; }
      placeAt(entry.x + (r() - 0.5) * 1.2, entry.z + (r() - 0.5) * 1.2);
      heading = Math.atan2(m.at.z - at.z, m.at.x - at.x); face();
      if (world.plainly(bird) || dist() < OFFSTAGE || room(at.x, at.z, heading) < 0.25) { bird.left = 2 + r() * 3; return; }
      a.to('follow');
      return;
    }
    const place = place0();
    if (life && life.first) {
      for (let tries = 0; tries < 8; tries += 1) {
        placeAt(place.x + (r() - 0.5) * 2, place.z + (r() - 0.5) * 2);
        heading = place.face ?? r() * TAU; face();
        if (can(at.x, at.z) && room(at.x, at.z, heading) > 0.3) break;
      }
      if (!can(at.x, at.z) || room(at.x, at.z, heading) < 0.3) { bird.left = 5 + r() * 10; return; }
      instant = true;
      if (restful() && r() < 0.15) a.to('rest', place); else a.to('feed', place);
      return;
    }
    const entry = world.offstage(place, bird, r, { least: 30, most: 80, clear: OFFSTAGE });
    if (!entry) { bird.left = 10 + r() * 20; return; }
    placeAt(entry.x, entry.z);
    heading = Math.atan2(place.z - at.z, place.x - at.x); face();
    if (world.plainly(bird) || dist() < OFFSTAGE || room(at.x, at.z, heading) < 0.3) { bird.left = 6 + r() * 8; return; }
    party.entry = { x: at.x, z: at.z }; party.exit = null; party.left = null;
    a.to('arrive', place);
  };

  return {
    activities: young ? youngActs : activities,
    refuge: () => false,
    begin,
    react,
    // off out of the walker's sight on foot, and gone from there (for `seconds`, or for good)
    leave: (seconds) => { if (young) return false; const exit = exitFrom(80); party.exit = exit; a.to('amble', exit, seconds); return true; },
    come: () => false,
  };
}

export default {
  // what a bear's way holds besides what every way has (life/families/index.js)
  fields: {
    shy: 'number',        // within this many metres of a walker (at a walk; a third further for one who runs) it stands up to look, and then ambles off a little way
    flush: 'number',      // within this many metres it bolts
    rush: 'number',       // and from one who runs at it within this many
    gone: chance,         // the chance that ambling off out of sight is for good (it is about again elsewhere, minutes later)
    stay: nums(2),        // seconds it is about its home before it goes off out of sight
    young: chance,        // the chance that a party of two or three is a sow with young (a bear on its own if not)
    cubs: chance,         // the chance that her young are cubs of the year (yearlings if not)
    amble: 'number', trot: 'number', gallop: 'number',                                                    // its paces (m/s)
  },
  act: (way) => (bird, world) => live(bird, world, way, bear),
  home: () => bearRange,
};
