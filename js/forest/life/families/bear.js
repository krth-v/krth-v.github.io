import * as THREE from 'three';
import { live } from '../behave.js';
import { GAITS, strideFor, stridesOf } from '../beasts.js';
import { test, nums, headingOf } from '../bodies.js';
import { bearHome } from '../places/bear.js';

const _gaits = { walk: 0, trot: 0, gallop: 0 };
const _shares = (walk, trot, gallop) => { _gaits.walk = walk; _gaits.trot = trot; _gaits.gallop = gallop; return _gaits; };

// The American black bear (life/species/blackBear.js): one that goes about on its own, or a sow with her young.
//
// It lives on life/behave.js, with its own way of taking the walker (`react`) and of coming and going on foot. In
// the middle of May it feeds: it grazes new grass and sedges and skunk cabbage in the wet ground round the old cedar
// and on the clearing's and the banks' grass, tears at rotten logs and stumps for grubs with a forepaw, turns stones
// over on the bars, and ambles from one such place to the next (life/places/bear.js: the places of its home, which
// lie within seventy metres of one another). Now and then it lies down. After some minutes of it, it ambles off out of
// the walker's sight, for a while or for good, and comes in again later from somewhere they cannot see.
//
// The walker. Within `see` metres (at a stroll; further, up to nearly twice as far, for one who runs) it stops, its
// head up, and watches them, nose working; then, as often as not, it stands up on its hind legs to look and smell
// (NPS Olympic: "It may come closer or stand on its hind legs to get a better look or smell"; "A standing bear is
// usually curious, not threatening"), and one on its own now and then takes a few steps nearer them first. Left
// alone it goes back to feeding, and minds them less for a while. If they come on within `shy` it ambles off,
// looking back over its shoulder; within `flush`, or at a run within `see`, or with a sudden movement within `shy`,
// it is off at a gallop, with a huff. Whatever it does, it comes no nearer the walker than `shy` and a few metres.
//
// A sow with young. In May a sow has cubs of the year (born in late January or early February, out of the den in
// spring) or yearlings (who stay with her until about sixteen months, and part from her from late May into June).
// So a party of two or three is a sow with one or two young, three times in five, cubs or yearlings about as often
// (the agent's call); otherwise it is a bear on its own and the rest of the party never comes. The young keep near
// her: they nose about while she feeds, now and then one stands up beside her, and they follow her when she goes,
// at her pace. They come only with her and go with her.
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
// How much further off than at a stroll a walker is felt: 1 for one who stands or strolls, nearly twice as far for
// one who runs (as for the elk and the birds).
const pace = (world) => 1 + 0.9 * clamp(((world.walker ? world.walker.speed : 0) - 1.5) / 5.5, 0, 1);
// What every activity holds itself as, unless it says otherwise: the beast rig's own fields (life/beastRig.js) and the
// stance's (life/parts/stance.js). `rake` and `cycle` only ever grow, and are kept apart (an eased stroke or stride
// that ran backwards would show).
const STILL = { lie: 0, rear: 0, dig: 0, reach: 0.35, at: 0, neck: 0.6, jaw: 0, ears: 0, tail: 0, high: 0, stamp: 0 };

// How far apart two bodies are, seen from above, each a line from rump to head with its width round it (as
// life/beasts.js and life/visit.js measure it). Below nothing they are in one another.
function bodyGap(ax, az, ah, a, bx, bz, bh, b) {
  const la = a.long * 0.85, lb = b.long * 0.85;
  const A = [ax - Math.cos(ah) * la, az - Math.sin(ah) * la, ax + Math.cos(ah) * la, az + Math.sin(ah) * la];
  const B = [bx - Math.cos(bh) * lb, bz - Math.sin(bh) * lb, bx + Math.cos(bh) * lb, bz + Math.sin(bh) * lb];
  const toSeg = (px, pz, S) => { const dx = S[2] - S[0], dz = S[3] - S[1], l2 = dx * dx + dz * dz, t = l2 > 1e-9 ? clamp(((px - S[0]) * dx + (pz - S[1]) * dz) / l2, 0, 1) : 0; return Math.hypot(px - S[0] - dx * t, pz - S[1] - dz * t); };
  const side = (S, x, z) => Math.sign((S[2] - S[0]) * (z - S[1]) - (S[3] - S[1]) * (x - S[0]));
  if (side(A, B[0], B[1]) !== side(A, B[2], B[3]) && side(B, A[0], A[1]) !== side(B, A[2], A[3])) return -a.wide - b.wide;
  return Math.min(toSeg(A[0], A[1], B), toSeg(A[2], A[3], B), toSeg(B[0], B[1], A), toSeg(B[2], B[3], A)) - a.wide - b.wide;
}

function bear(a) {
  const { bird, world, way, r, life } = a, at = bird.at;
  const one = bird.who || { party: { members: [] } }, party = one.party, n = Math.max(0, party.members.indexOf(one));
  // Who this one is, decided once for the visit (kept from one coming to the next).
  if (party.young === undefined) party.young = party.members.length > 1 && r() < 0.6 ? (r() < 0.5 ? 'cubs' : 'yearlings') : null;
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

  // ---- its own state
  let heading = r() * TAU, speed = 0, cycle = 0, rake = 0, fresh = true, easy = 0, stoodAt = -Infinity, goal = null, last = Infinity, instant = false, turnedFrom = null;
  const ramp = { lie: 0, rear: 0, dig: 0 };
  const P = { ...STILL, head: { yaw: 0, pitch: 0 }, scale: bird.scale, walk: 0, trot: 0, gallop: 0, cycle: 0, rake: 0, ground: [0, 0, 0, 0] };
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
      P.ground[i] = clamp(world.height(at.x + c * fx - s * fz, at.z + s * fx + c * fz) - (at.y + fx * tp), -0.2 * k, 0.2 * k);
    }
  };

  // ---- room: never a step or a turn to within a hand of another animal's body, nor nearer one it is already too near.
  // Nothing is let off it: a sow and her young do not pass through one another (they go round, and the young get out
  // of her way: below)
  let blocker = null;
  function room(x, z, h) {
    let least = Infinity;
    blocker = null;
    for (const other of world.others(x, z, 4.5, bird, _near)) {
      if (other.left != null || other.state === 'gone' || other.state === 'fly') continue;
      if (other.body) { const gap = bodyGap(x, z, h, bird.body, other.at.x, other.at.z, headingOf(other), other.body); if (gap < least) { least = gap; blocker = other; } continue; }
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
  function move(dt, tx, tz, most, shun = false) {
    const dx = tx - at.x, dz = tz - at.z, dist = Math.hypot(dx, dz);
    let want = dist < 0.25 ? 0 : most * clamp(dist / 1.5, 0.25, 1), aim = Math.atan2(dz, dx);
    const toWalker = Math.atan2(world.eye.z - at.z, world.eye.x - at.x);
    if (shun) { const rel = wrap(aim - toWalker - Math.PI); if (Math.abs(rel) > 1.45) aim = toWalker + Math.PI + Math.sign(rel) * 1.45; }
    // (a way is open if it is open a stride or so ahead and at the very next step: beside a log's round side a way
    // can be open further on and shut at once)
    const ahead = (0.9 + speed * 0.35) * Math.max(0.6, bird.scale), close = 0.25 * Math.max(0.6, bird.scale);
    const open = (h) => can(at.x + Math.cos(h) * ahead, at.z + Math.sin(h) * ahead) && world.walkable(at.x + Math.cos(h) * close, at.z + Math.sin(h) * close, RADIUS);
    if (want > 0 && !open(aim)) {
      let found = null;
      for (const turn of [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4, 1.9, -1.9, 2.5, -2.5]) {
        const h = aim + turn;
        if (shun && Math.cos(h - toWalker) > -0.05) continue;
        if (open(h)) { found = h; break; }
      }
      if (found == null) want = 0; else aim = found;
    }
    // (lying, or up on its hind legs, it gets up or down first: it does not slide along the ground while it does)
    if (ramp.lie > 0.05 || ramp.rear > 0.05) { want = 0; speed = 0; bird.speed = 0; return dist; }
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
    if (!goal || Math.hypot(goal.x - tx, goal.z - tz) > 1) goal = { x: tx, z: tz, best: dist, since: world.clock };
    else if (dist < goal.best - 0.25) { goal.best = dist; goal.since = world.clock; }
    bird.stuck = world.clock - goal.since > 5;
    return dist;
  }
  const stop = (dt) => { speed = Math.max(0, speed - 3 * dt); if (speed > 0.01 && !stepTo(at.x + Math.cos(heading) * speed * dt, at.z + Math.sin(heading) * speed * dt)) speed = 0; bird.speed = speed; ground(); face(); };
  // turning on the spot towards a bearing, at a walk's turn
  const turnToward = (dt, h) => { turnTo(heading + clamp(wrap(h - heading), -1.2 * dt, 1.2 * dt)); face(); };

  // ---- how it holds itself: the activity's pose over STILL; `lie`, `rear` and `dig` are let into and out of at a
  // bear's own speed (lying down takes seconds), the gait's shares and the stride's place from how fast it goes
  const RATE = { lie: [1 / 2.6, 1 / 1.6], rear: [1 / 0.9, 1 / 0.7], dig: [1 / 0.4, 1 / 0.5] };
  function hold(dt, extra = {}, strokes = 0.8) {
    const next = { ...STILL, head: { yaw: 0, pitch: 0 }, ...extra };
    // (one there when the visit began is found as it is: lying, not lying down)
    for (const k of ['lie', 'rear', 'dig']) { ramp[k] = instant ? next[k] : towards(ramp[k], next[k], (next[k] > ramp[k] ? RATE[k][0] : RATE[k][1]) * dt); next[k] = ramp[k]; }
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
    const stepping = speed < 0.4 && ramp.lie < 0.1 && ramp.rear < 0.1 && ramp.dig < 0.1 ? clamp(turned * 0.6, 0, 0.6) : 0;
    const walk = Math.max(pacing, stepping), going = Math.max(speed, stepping > 0 ? turned * 0.3 * bird.scale : 0);
    // (by the strides the rig sweeps its feet by, which are its own sheet's: by the elk's, its feet slid at every gait)
    if (moving || stepping > 0) cycle += (going * dt) / (strideFor(_shares(walk, trot, gallop), stridesOf(bird.sheet)) * bird.scale);
    if (ramp.dig > 0.05) rake += dt * strokes;
    feet();
    Object.assign(P, next, { scale: bird.scale, walk, trot, gallop, cycle, rake });
    Object.assign(bird.want, P, { head: { ...P.head }, ground: [...P.ground] });
    // (its state is by its pace: one stepping round where it stands is standing, to its young and to the visit)
    bird.state = ramp.lie > 0.5 ? 'lie' : ramp.rear > 0.5 ? 'rear' : gallop > 0.5 ? 'gallop' : trot > 0.5 ? 'trot' : pacing > 0.5 ? 'walk' : 'stand';
  }
  // its head turned to the walker as far as a neck goes; past that it is the bear that turns, a little at a time
  const watch = (dt, turnBody = true) => {
    const off = wrap(Math.atan2(world.eye.z - at.z, world.eye.x - at.x) - heading), d = Math.hypot(world.eye.x - at.x, world.eye.z - at.z);
    if (turnBody && Math.abs(off) > 1.2 && speed < 0.3) turnToward(dt, heading + Math.sign(off) * (Math.abs(off) - 1.0));
    return { yaw: clamp(off, -1.3, 1.3), pitch: clamp(Math.atan2(world.eye.y - (at.y + bird.body.high + 0.2), d), -0.4, 0.45) };
  };
  // its nose working: the jaw a little open and shut, quickly
  const sniff = () => 0.12 + 0.1 * Math.sin(world.clock * 13 + n);
  const dist = () => Math.hypot(world.eye.x - at.x, world.eye.z - at.z);
  const event = (name) => { if (world.event) world.event(bird.key, name); };
  const restful = () => world.day < 0.08 || ((world.hour ?? 12) > 11.5 && (world.hour ?? 12) < 15.5);

  // ---- where to go: a place of its home that no other animal is at, or near; one to walk off to, out of sight
  const placeFree = (p) => world.free(_v.set(p.x, world.height(p.x, p.z), p.z), bird, 1.2);
  const nextPlace = (now) => {
    const list = (home.places || []).filter((p) => p !== now && placeFree(p) && (!world.trail || world.trail.distance(p.x, p.z) > 8));
    return list.length ? list[Math.floor(r() * Math.min(4, list.length))] : null;
  };
  const exitFrom = (far) => world.offstage(at, bird, r, { least: far * 0.6, most: far * 1.3, away: true, clear: OFFSTAGE, spread: 2.6 }) || runAway(far);
  function runAway(far) {
    const base = Math.atan2(at.z - world.eye.z, at.x - world.eye.x);
    for (const k of [1, 0.7, 0.45]) for (const turn of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2]) {
      const x = at.x + Math.cos(base + turn) * far * k, z = at.z + Math.sin(base + turn) * far * k;
      if (can(x, z)) return new THREE.Vector3(x, 0, z);
    }
    return new THREE.Vector3(at.x + Math.cos(base) * far, 0, at.z + Math.sin(base) * far);
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

  // ---- the sow's (or a lone bear's) activities
  const activities = {
    // in from out of sight to the first place of its home
    arrive: {
      pose: () => ({ ...P }),
      enter: (a, place) => { a.now.place = place; a.now.tries = 0; },
      step: (a, dt) => {
        const place = a.now.place, d = move(dt, place.x, place.z, way.amble);
        hold(dt, { neck: 0.45, head: { yaw: 0.25 * Math.sin(world.clock * 0.6), pitch: -0.1 } });
        bird.doing = 'ambling in, its nose to the ground';
        if (d < 0.6 || (bird.stuck && d < 10)) a.to('feed', place);
        else if (bird.stuck) {
          // No way to the place from where it came in (the ravine or the river between: the way in is found by where
          // it can stand, not by the way from there): another place of its home, twice, and then it feeds where it
          // has got to. (It ambled in for as long as it was watched, twelve minutes; and with no other place to try
          // it asked for one in every frame. How many it tries is the agent's own.)
          const p = a.now.tries < 2 ? nextPlace(place) : null;
          if (p) { a.now.place = p; a.now.tries += 1; }
          else a.to('feed', { kind: 'grass', x: at.x, z: at.z });
        }
      },
    },
    // feeding at a place of its home, by what the place is
    feed: {
      pose: () => ({ ...P }),
      enter: (a, place) => Object.assign(a.now, { place, until: 25 + r() * 90, bout: 0, nudge: null, sway: r() * 6 }),
      step: (a, dt) => {
        const now = a.now, place = now.place;
        now.until -= dt; now.bout -= dt;
        party.stay = (party.stay ?? way.stay[0] + r() * (way.stay[1] - way.stay[0])) - dt;
        // there first (a place it was sent to may be a few strides off)
        const off = Math.hypot(place.x - at.x, place.z - at.z);
        if (off > 0.7 && !now.there) {
          const d = move(dt, place.x, place.z, way.amble * 0.8);
          hold(dt, { neck: 0.35, head: { yaw: 0, pitch: -0.15 } });
          bird.doing = 'ambling on, its nose to the ground';
          // (stuck well short of it, it feeds where it has got to, on what grows there: sent on as if it had arrived,
          // it would have worked at a log some metres off. By reading; not seen.)
          if (d < 0.7 || bird.stuck) { now.there = true; if (d > 1.5) now.place = { kind: 'grass', x: at.x, z: at.z }; }
          return;
        }
        now.there = true;
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
              hold(dt, { neck: 0.3, head: { yaw: 0, pitch: -0.2 } });
              bird.doing = place.kind === 'log' ? 'turning to a rotten log' : 'turning to a rotten stump';
              return;
            }
            now.square = true;
          } else if (Math.abs(wrap(toWork - heading)) > 0.08) turnToward(dt, toWork);
          if (now.bout <= 0) { now.bout = 2 + r() * 5; now.nose = !now.nose && r() < 0.45; }
          // (the stance's reach is from the shoulder and its height from the feet, both at the sheet's size)
          const far = place.wx != null ? Math.hypot(place.wx - at.x, place.wz - at.z) : place.reach;
          const reach = clamp(far / bird.scale - 0.17, 0.15, 0.55), lift = clamp(place.at / bird.scale, 0, 0.6);
          hold(dt, now.nose ? { neck: 0.15, head: { yaw: 0, pitch: -0.25 }, jaw: 0.2 + 0.15 * Math.sin(world.clock * 7) }
            : { dig: 1, reach, at: lift, neck: 0.3, head: { yaw: 0, pitch: -0.3 }, jaw: 0.05 }, 0.9);
          bird.doing = place.kind === 'log' ? (now.nose ? 'licking up grubs from a rotten log' : 'tearing at a rotten log for grubs') : now.nose ? 'licking up ants from a stump it has torn open' : 'tearing a rotten stump apart for ants';
        } else if (place.kind === 'stones') {
          // on a bar: turning cobbles over with a paw, and nosing under them
          if (now.bout <= 0) { now.bout = 1.5 + r() * 4; now.nose = !now.nose; if (!now.nose && r() < 0.6) now.nudge = { x: at.x + Math.cos(heading + (r() - 0.5)) * 0.5, z: at.z + Math.sin(heading + (r() - 0.5)) * 0.5 }; }
          if (now.nudge && Math.hypot(now.nudge.x - at.x, now.nudge.z - at.z) > 0.12) move(dt, now.nudge.x, now.nudge.z, 0.5); else { now.nudge = null; stop(dt); }
          hold(dt, now.nose ? { neck: 0.05, head: { yaw: 0.2 * Math.sin(world.clock), pitch: 0 }, jaw: 0.15 } : { dig: 1, reach: 0.32, at: 0, neck: 0.25, head: { yaw: 0, pitch: -0.3 } }, 0.6);
          bird.doing = now.nose ? 'nosing under the stones it has turned' : 'turning stones over by the river';
        } else {
          // grazing: muzzle in the sedge or the grass, chewing; a step or two at a time; in the wet ground now and
          // then it digs at a skunk cabbage
          if (now.bout <= 0) {
            now.bout = 3 + r() * 8; now.dig = place.kind === 'wet' && r() < 0.3;
            const h = heading + (r() - 0.5) * 1.4, step = 0.3 + r() * 0.6;
            now.nudge = { x: at.x + Math.cos(h) * step, z: at.z + Math.sin(h) * step };
          }
          if (!now.dig && now.nudge && Math.hypot(now.nudge.x - at.x, now.nudge.z - at.z) > 0.12) move(dt, now.nudge.x, now.nudge.z, 0.45); else { now.nudge = null; stop(dt); }
          hold(dt, now.dig ? { dig: 1, reach: 0.3, at: 0, neck: 0.2, head: { yaw: 0, pitch: -0.3 } }
            : { neck: 0, head: { yaw: 0.25 * Math.sin(world.clock * 0.5 + now.sway), pitch: 0 }, jaw: 0.25 + 0.25 * Math.sin(world.clock * 8) }, 0.7);
          bird.doing = place.kind === 'wet' ? (now.dig ? 'digging at a skunk cabbage' : 'grazing sedges and skunk cabbage in the wet ground') : place.kind === 'stones' ? 'grazing by the river' : 'grazing on new grass';
        }
        if (now.until > 0) return;
        // done here: off out of sight once it has been about long enough; else a rest at midday or by night; else
        // on to the next place
        if (party.stay < 0) { party.stay = null; a.leave(r() < way.gone ? Infinity : a.awhile()); return; }
        if (restful() && r() < 0.4) { a.to('rest', place); return; }
        const p = nextPlace(place);
        if (p) a.to('feed', p); else now.until = 20 + r() * 40;
      },
    },
    // lying down, its head on its paws now and then raised
    rest: {
      pose: () => ({ ...P }),
      enter: (a, place) => Object.assign(a.now, { place, until: (restful() ? 90 : 30) + r() * 120, look: 0 }),
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt; now.look -= dt;
        stop(dt);
        if (now.look <= 0) { now.look = 3 + r() * 9; now.head = r() < 0.5 ? { yaw: (r() - 0.5) * 1.2, pitch: 0.15 } : { yaw: 0, pitch: -0.15 }; }
        hold(dt, { lie: 1, neck: now.head.pitch > 0 ? 0.45 : 0.25, head: now.head });
        bird.doing = 'lying down, resting';
        if (now.until < 0) a.to('feed', now.place);
      },
    },
    // stopped, its head up, watching the walker and smelling the air
    notice: {
      pose: () => ({ ...P }),
      enter: (a) => Object.assign(a.now, { until: 3 + r() * 5 }),
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt;
        stop(dt);
        hold(dt, { lie: ramp.lie > 0.5 ? 1 : 0, neck: ramp.lie > 0.5 ? 0.55 : 0.9, head: watch(dt, ramp.lie < 0.5), jaw: sniff(), ears: 1 });
        bird.doing = ramp.lie > 0.5 ? 'lying with its head up, watching you' : 'stopped, its head up, watching you and smelling the air';
        if (now.until > 0) return;
        const k = pace(world), d = dist();
        if (ramp.lie < 0.5 && world.clock - stoodAt > 60 && r() < way.stand && d < way.see * k) { a.to('stand'); return; }
        if (ramp.lie < 0.5 && !party.young && r() < way.curious && d > way.shy * k + 8) { a.to('closer'); return; }
        easy = 25 + r() * 35;
        a.to('feed', nearestPlace());
      },
    },
    // up on its hind legs, facing the walker, nose up and working
    stand: {
      pose: () => ({ ...P }),
      enter: (a) => { Object.assign(a.now, { until: 3 + r() * 5 }); stoodAt = world.clock; event('stood up'); if (r() < 0.4) world.say(bird, 'huff', 60); },
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt;
        stop(dt);
        const off = wrap(Math.atan2(world.eye.z - at.z, world.eye.x - at.x) - heading);
        if (Math.abs(off) > 0.15) turnToward(dt, heading + off);
        const head = watch(dt, false);
        hold(dt, { rear: 1, neck: 0.75, head: { yaw: head.yaw, pitch: head.pitch + 0.2 }, jaw: sniff(), ears: 1 });
        bird.doing = 'standing up on its hind legs to look at you and smell you';
        if (now.until > 0) return;
        // down again: off, if the walker is near or came on; else it watches a moment and goes back to feeding
        if (dist() < way.shy * pace(world) * 1.4) { amble(); return; }
        easy = 30 + r() * 40;
        a.to('notice');
      },
    },
    // a few slow steps nearer the walker, head up and nose working; never within `shy` and eight metres
    closer: {
      pose: () => ({ ...P }),
      enter: (a) => Object.assign(a.now, { until: 2.5 + r() * 3 }),
      step: (a, dt) => {
        const now = a.now, d = dist();
        now.until -= dt;
        if (d > way.shy * pace(world) + 8 && now.until > 0) move(dt, world.eye.x, world.eye.z, 0.6); else stop(dt);
        hold(dt, { neck: 0.85, head: watch(dt, false), jaw: sniff(), ears: 1 });
        bird.doing = 'coming a few steps nearer to get your scent';
        if (now.until <= 0 || d <= way.shy * pace(world) + 8) a.to(r() < 0.6 ? 'stand' : 'notice');
      },
    },
    // ambling off from the walker, looking back over its shoulder, to somewhere out of their sight
    amble: {
      pose: () => ({ ...P }),
      enter: (a, exit, seconds) => { party.exit = exit; Object.assign(a.now, { exit, seconds, look: 0, runs: 0 }); },
      step: (a, dt) => {
        const now = a.now;
        if (ramp.lie > 0.05) { stop(dt); hold(dt, { lie: 0, neck: 0.7, head: watch(dt, false) }); bird.doing = 'getting up'; return; }
        // (the walker has moved, and its way off now lies their side of it: another)
        // (her young go by `party.exit` once she has gone: left as it was, they made for the way she had given up)
        if ((now.exit.x - at.x) * (world.eye.x - at.x) + (now.exit.z - at.z) * (world.eye.z - at.z) > 0) now.exit = party.exit = exitFrom(70);
        const d = move(dt, now.exit.x, now.exit.z, way.amble * 1.15, true);
        now.look -= dt;
        const back = now.look < 0 && now.look > -1.4;
        if (now.look < -1.4) now.look = 3 + r() * 5;
        hold(dt, { neck: 0.55, head: back ? watch(dt, false) : { yaw: 0, pitch: -0.05 } });
        bird.doing = back ? 'ambling off, looking back at you' : 'ambling off into the trees';
        if (vanish(now.seconds)) return;
        if (d < 3 || bird.stuck) { now.runs += 1; now.exit = party.exit = now.runs > 4 ? runAway(60) : exitFrom(80); }
      },
    },
    // off at a gallop from the walker, and then at a trot, to somewhere out of their sight
    flee: {
      pose: () => ({ ...P }),
      enter: (a, exit, seconds) => { party.exit = exit; Object.assign(a.now, { exit, seconds, since: world.clock, runs: 0 }); world.say(bird, 'huff', 90); event('ran'); },
      step: (a, dt) => {
        const now = a.now, gallop = world.clock - now.since < 14;
        if ((now.exit.x - at.x) * (world.eye.x - at.x) + (now.exit.z - at.z) * (world.eye.z - at.z) > 0) now.exit = party.exit = exitFrom(90);
        const before = dist(), d = move(dt, now.exit.x, now.exit.z, gallop ? way.gallop : way.trot, true);
        hold(dt, { neck: 0.65, head: { yaw: 0, pitch: 0.05 }, ears: -1 });
        bird.doing = gallop ? 'running off at a gallop' : 'loping away into the trees';
        // (how far its own steps carried it towards the walker since it began to run: the count keeps the most)
        if (bird.ran !== now.since) { bird.ran = now.since; bird.towards = 0; }
        bird.towards += Math.max(0, before - dist()); bird.closer = Math.max(bird.closer || 0, bird.towards);
        if (vanish(now.seconds)) return;
        if (d < 3 || bird.stuck) { now.runs += 1; now.exit = party.exit = now.runs > 4 ? runAway(70) : exitFrom(90); }
      },
    },
  };
  const nearestPlace = () => (home.places || []).reduce((best, p) => (!best || Math.hypot(p.x - at.x, p.z - at.z) < Math.hypot(best.x - at.x, best.z - at.z) ? p : best), null) || { kind: 'grass', x: at.x, z: at.z };
  const amble = (seconds = r() < way.gone ? Infinity : a.awhile()) => { a.to('amble', exitFrom(80), seconds); event('ambled off'); return true; };
  const flee = (seconds = r() < 0.7 ? Infinity : a.awhile()) => { a.to('flee', exitFrom(100), seconds); return true; };

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
      const h = headingOf(other), L = other.body.long * 0.85, ax = other.at.x - Math.cos(h) * L, az = other.at.z - Math.sin(h) * L, dx = 2 * Math.cos(h) * L, dz = 2 * Math.sin(h) * L;
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
      pose: () => ({ ...P }),
      enter: (a) => Object.assign(a.now, { side: n === 1 ? -1 : 1, back: 1.8 + r() * 1.4, wander: 0, stand: 0, nose: 0 }),
      step: (a, dt) => {
        const now = a.now, m = mother();
        if (!m) {
          // she has gone: after her, along her way off, and gone too once out of sight
          const exit = party.exit || exitFrom(70), away = party.left ?? Infinity, w = around(exit.x, exit.z);
          move(dt, w.x, w.z, way.trot, true);
          hold(dt, { neck: 0.6 });
          bird.doing = `${what}, hurrying after its mother`;
          if (vanish(away === Infinity ? Infinity : away + 2 + r() * 4)) return;
          if (bird.stuck) party.exit = exitFrom(70);
          return;
        }
        now.wander -= dt; now.stand -= dt; now.nose -= dt;
        const mh = m.heading ?? 0, c = Math.cos(mh), sn = Math.sin(mh), lying = m.state === 'lie';
        const feeding = m.state === 'stand' || lying || m.state === 'rear', hurry = (m.speed || 0) > 2.2, fleeing = m.state === 'gallop' || m.state === 'trot';
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
          hold(dt, { lie: 1, neck: 0.3, head: { yaw: 0.25 * Math.sin(world.clock * 0.3 + n), pitch: -0.1 } });
          bird.doing = `${what}, lying beside its mother`;
          return;
        }
        // when she stands up to look, it may too
        if (m.state === 'rear' && now.stand < -3 && r() < 0.5) now.stand = 2.5 + r() * 2;
        if (now.stand > 0 && speed < 0.3) {
          hold(dt, { rear: 1, neck: 0.75, head: watch(dt, false), jaw: sniff(), ears: 1 });
          bird.doing = `${what}, standing up beside its mother`;
          return;
        }
        if (feeding && !lying && far < 1 && now.nose <= 0 && r() < dt * 0.3) now.nose = 2 + r() * 4;
        hold(dt, now.nose > 0 ? { neck: 0.05, head: { yaw: 0.4 * Math.sin(world.clock * 1.3 + n), pitch: 0 }, jaw: 0.15 } : { neck: hurry ? 0.6 : 0.5, head: { yaw: 0.3 * Math.sin(world.clock * 0.8 + n), pitch: 0 } });
        bird.doing = hurry ? `${what}, running after its mother` : now.nose > 0 ? `${what}, nosing about by its mother` : `${what}, keeping close to its mother`;
      },
    },
  };

  // ---- the walker, taken a bear's way (the young take it by their mother: they do as she does)
  const react = (a, dt) => {
    // (one that has been too far off to be drawn is found as it is, not eased through every stride it took meanwhile)
    if (fresh || bird.shown < 0) { bird.snap = true; fresh = false; }
    if (young || a.name === 'gone' || a.name === 'flee') return false;
    const d = dist(), k = pace(world), w = world.walker, coming = dt > 0 && last < Infinity && w.speed > 0.4 && (last - d) / dt > 0.4;
    last = d; easy -= dt;
    // off at a gallop: anyone right up to it, a walker who comes on within `flush`, one who runs within `see`, or a
    // sudden movement within `shy`
    if (d < way.flush * 0.6 || (coming && d < way.flush * k) || (w.speed > 4.5 && d < way.see * k) || (w.sudden > 0 && d < way.shy * k)) {
      if (!party.met) { party.met = true; event('met'); }
      return flee();
    }
    if (a.name === 'amble') return false;
    // ambling off from one who comes on within `shy`
    if (coming && d < way.shy * k) { if (!party.met) { party.met = true; event('met'); } return amble(); }
    // watching one within `see`, unless it has been minding them less since it last watched (and they have not come on)
    if (d < way.see * k && (easy <= 0 || (coming && d < way.see * k * 0.6)) && a.name !== 'notice' && a.name !== 'stand' && a.name !== 'closer') {
      if (!party.met) { party.met = true; event('met'); }
      return a.to('notice');
    }
    return false;
  };

  // ---- coming on foot: there when the visit began, or ambling in from somewhere the walker cannot see
  const place0 = () => nextPlace(null) || { kind: home.kind || 'grass', x: home.x, z: home.z };
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
      if (restful() && r() < 0.5) a.to('rest', place); else a.to('feed', place);
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
    see: 'number',        // within this many metres of a walker at a stroll it stops and watches them (further for one who runs)
    shy: 'number',        // within this many metres, if they come on, it ambles off
    flush: 'number',      // within this many metres, if they come on, it runs (and anyone within six tenths of it)
    stand: chance,        // the chance that once it has watched them a moment it stands up on its hind legs to look
    curious: chance,      // the chance a bear on its own first comes a few steps nearer them
    gone: chance,         // the chance that ambling off out of sight is for good (it is about again elsewhere, minutes later)
    stay: nums(2),        // seconds it feeds about its home before it moves on
    amble: 'number', trot: 'number', gallop: 'number',                                                    // its paces (m/s)
  },
  act: (way) => (bird, world) => live(bird, world, way, bear),
  home: () => bearHome,
};
