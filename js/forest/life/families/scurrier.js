import * as THREE from 'three';
import { onTrunk } from '../perch.js';
import { frame, UP, spot, pace } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums, optional } from '../bodies.js';

// Small mammals of the squirrel family that run on the ground, on dead wood and up trunks (rodents, 2026-11-16): the
// Douglas squirrel, Townsend's chipmunk and the Olympic chipmunk (life/species/douglasSquirrel.js,
// townsendsChipmunk.js, olympicChipmunk.js). Each is only ever one of a visit's own, alone, and lives on
// life/behave.js, with its own way of taking the walker (`react`), of going off out of sight (`leave`: round a trunk
// and up it, or under a log, or off over the ground) and of coming (from behind a trunk, or out from under a log).
//
// From what was read (the species' sheets; Dalquest 1948 above all). The squirrel climbs up and down trunks head
// first and leaps from branch to branch; it strips cones scale by scale on a favourite stump or log, where the scales
// pile up; "in spring they are shy. They rarely call and are skillful in keeping branches or tree trunks between
// themselves and persons"; later in the year it chatters at a person from a tree, its tail jerking at each call.
// Townsend's chipmunk is quiet and shy, "when frightened, ran into the nearest dense cover and vanished, not to
// appear again. A goodly number, perhaps ten per cent, climbed high up in fir trees"; it is seen sitting on a stump or
// a log, runs with its tail straight up, and chips when alarmed. The Olympic chipmunk (Tamias amoenus caurinus, of
// the yellow-pine chipmunk) is far tamer, "usually allowing the observer to approach within twenty feet or closer",
// "went scampering off through the brush and tangles of logs and branches, to emerge again and watch from a hundred
// feet away ... always remained in sight", and "none of the yellow-pine chipmunks took refuge in trees". The agent's
// own: every distance, time, pace and chance in the ways, how it goes about between its trunk, the floor and its
// post, and that it scolds in May at all (the scolding is the agent's call; Dalquest has it later in the year).

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const wrap = (x) => x - Math.round(x);                                    // a share of a turn, to -0.5 .. 0.5
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _n = new THREE.Vector3(), _u = new THREE.Vector3(), _q = new THREE.Quaternion(), _near = [], _hid = [];
const _c = new THREE.Vector3(), _g = new THREE.Vector3(), _m = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Vector3(), _k = new THREE.Vector3(), _h = new THREE.Vector3(), _qa = new THREE.Quaternion(), _o = [];

// The pose every activity starts from: every field of the rig's is named, so that nothing one activity held (sitting
// up, clinging, a cone in its paws) is left in the next (life/beastRig.js, life/parts/rodentRig.js).
const posed = (extra = {}) => ({ walk: 0, trot: 0, gallop: 0, high: 0, stamp: 0, lie: 0, neck: 0.65, jaw: 0, ears: 0.2, tail: 0.55, curl: 0.3, flick: 0, wag: 0,
  sit: 0, hold: 0, strip: 0, cling: 0, grip: 0, down: 0, scurry: 0, crouch: 0, ...extra, head: { yaw: 0, pitch: 0, ...(extra.head || {}) } });

// Room (2026-11-16): every step over the floor, run along a log, dash on the bark, leap and stop keeps a hand's width
// (HAND) off every other animal's body, or, where it is nearer than that already, takes it no nearer; a way that does
// not is not taken, and it goes round, or waits. A body is measured as the count of walks measures it (life/visit.js,
// `apart`): seen from above, a line from rump to head (a share of `long` each way of its middle) with its width round
// it, and a bird a point; a bird above another's back is let off, and nothing else is let off for height (a chipmunk
// under an elk's belly is in it). Besides that, `world.crowd` from the spot, less its own reach, which has where an
// animal on the wing is about to land; and where it stops, `world.free`. (The way had been tested at its end only, and
// the count found a chipmunk run through a standing elk, two runs along a log into a wren on its post and a squirrel on
// its stump, and a bound into a squirrel sitting up on the floor.)
const HAND = 0.1;
// the way a body faces, seen from above, as the count takes it from its frame (+x)
const facingOf = (q, out) => { out.set(1, 0, 0).applyQuaternion(q).setY(0); if (out.lengthSq() < 1e-8) out.set(1, 0, 0); else out.normalize(); return out; };
// how far a point is from a segment, and the least gap between two segments (none where they cross), in the plane
const toSegment = (px, pz, x0, z0, x1, z1) => { const dx = x1 - x0, dz = z1 - z0, l2 = dx * dx + dz * dz, t = l2 > 1e-9 ? clamp(((px - x0) * dx + (pz - z0) * dz) / l2, 0, 1) : 0; return Math.hypot(px - x0 - dx * t, pz - z0 - dz * t); };
const segments = (a0x, a0z, a1x, a1z, b0x, b0z, b1x, b1z) => {
  const o = (ax, az, bx, bz, cx, cz) => Math.sign((bx - ax) * (cz - az) - (bz - az) * (cx - ax));
  if (o(a0x, a0z, a1x, a1z, b0x, b0z) !== o(a0x, a0z, a1x, a1z, b1x, b1z) && o(b0x, b0z, b1x, b1z, a0x, a0z) !== o(b0x, b0z, b1x, b1z, a1x, a1z)) return 0;
  return Math.min(toSegment(a0x, a0z, b0x, b0z, b1x, b1z), toSegment(a1x, a1z, b0x, b0z, b1x, b1z), toSegment(b0x, b0z, a0x, a0z, a1x, a1z), toSegment(b1x, b1z, a0x, a0z, a1x, a1z));
};

// The dead wood near a spot that it can sit on: the tops of stumps and the backs of logs low enough to jump onto,
// with ground beside them it can run on. Each { kind, wood, share, point, up, along, x, z }.
function woodsNear(habitat, x, z, reach, r, p) {
  const out = [];
  for (const stump of habitat.stumps) {
    if (Math.hypot(stump.x - x, stump.z - z) > reach) continue;
    const top = stump.point, low = top.y - habitat.height(top.x, top.z);
    if (low < 0.12 || low > 1.4 || !besideWood(habitat, top.x, top.z)) continue;
    out.push({ kind: 'stump', wood: stump, share: 0, point: top.clone(), up: UP.clone(), along: null, x: top.x, z: top.z, reach: Math.max(0.9, low * 0.4 + 0.6) });
  }
  for (const log of habitat.logs) {
    if (Math.hypot(log.x - x, log.z - z) > reach + 6) continue;
    const share = 0.2 + r() * 0.6;
    log.on(share, p);
    const low = p.point.y - habitat.height(p.point.x, p.point.z);
    if (Math.hypot(p.point.x - x, p.point.z - z) > reach || low < 0.15 || low > 1.3 || !besideWood(habitat, p.point.x, p.point.z)) continue;
    out.push({ kind: 'log', wood: log, share, point: p.point.clone(), up: p.normal.clone(), along: p.up.clone(), x: p.point.x, z: p.point.z, reach: Math.max(0.9, low * 0.55 + 0.45) });
  }
  return out;
}
// (ground it can run on within a stride or two of a piece of wood, on some side of it)
function besideWood(habitat, x, z) {
  for (let k = 0; k < 8; k += 1) { const a = (k / 8) * 6.283; if (habitat.walkable(x + Math.cos(a) * 0.9, z + Math.sin(a) * 0.9, 0.1)) return true; }
  return false;
}

function scurrier(a) {
  const { bird, world, way, r } = a, home = bird.home, shape = bird.sheet.shape, p = spot();
  // its gait's place in a bound (`cycle`: never wound back, so the page never eases it backwards) and how far it has
  // turned and stripped a cone; when it next calls; how long the walker has been out of its notice
  let phase = r() * 10, husk = r() * 10, calls = 1 + r() * 3, calm = 0, cornered = 0, retreats = 0, fed = r() * 30;
  // (whether, this time, it stays on its trunk and keeps it between itself and a walker who comes right up)
  const bold = r() < way.near;
  // where it is on a trunk (the trunk, how high, how far round, which way it faces on the bark: 0 head up, 0.5 head
  // down, as a share of a turn), kept across its activities
  const bark = { tree: null, height: 1, turn: 0, bearing: 0 };
  const stride = (run) => shape.climb.stride * (0.3 + 0.7 * clamp(run, 0, 1));
  // (a cycle carries it as far as the rig sweeps its feet: a bound's stride by how much of a run it is, life/parts/rodentRig.js)
  const gait = (dist, run) => { phase += dist / (stride(run) * Math.max(0.2, Math.min(1, run))); Object.assign(bird.want, { scurry: run, cycle: phase }); };
  const far = () => Math.hypot(bird.at.x - world.eye.x, bird.at.z - world.eye.z);

  // ---- room (above): the gap its body would have at (x, y, z), facing (fx, fz) seen from above
  const body = bird.body || { high: 0.05, long: 0.06, wide: 0.02 }, half = body.long * 0.85, extent = half + body.wide;
  const roomAt = (x, y, z, fx, fz) => {
    let least = world.crowd(_c.set(x, y, z), bird) - extent;
    const a0x = x - fx * half, a0z = z - fz * half, a1x = x + fx * half, a1z = z + fz * half;
    for (const o of world.others(x, z, 3, bird, _o)) {
      if (o.left != null || o.state === 'gone' || o.state === 'fly') continue;
      let gap;
      if (o.body) {
        facingOf(o.q, _g);
        const l = o.body.long * 0.85;
        gap = segments(a0x, a0z, a1x, a1z, o.at.x - _g.x * l, o.at.z - _g.z * l, o.at.x + _g.x * l, o.at.z + _g.z * l) - body.wide - o.body.wide;
      } else if (o.at.y > y + body.high + 0.25) continue;                 // (a bird above its back)
      else gap = toSegment(o.at.x, o.at.z, a0x, a0z, a1x, a1z) - body.wide;
      if (gap < least) least = gap;
    }
    return least;
  };
  const roomHere = () => { facingOf(bird.q, _m); return roomAt(bird.at.x, bird.at.y, bird.at.z, _m.x, _m.z); };
  // (and a heading, as the beasts keep one: life/beasts.js and families/bear.js leave any animal with a body and no
  // heading out of the room they keep, so an elk would have walked over a chipmunk. Read from how it faces.)
  Object.defineProperty(bird, 'heading', { configurable: true, enumerable: true, get: () => { facingOf(bird.q, _h); return Math.atan2(_h.z, _h.x); }, set: () => {} });

  // ---- places
  const onBark = (tree, height, turn, bearing, at = bird.at, quat = bird.q) => {
    onTrunk(tree, height, turn, p);
    const b = bearing * Math.PI * 2;
    _v.copy(p.up).multiplyScalar(Math.cos(b)).addScaledVector(_w.crossVectors(p.normal, p.up), Math.sin(b));
    at.copy(p.point); frame(_v, p.normal, quat);
  };
  // the share of the way round a trunk that faces a spot (the tube's own way round is read from the trunk itself)
  const facing = (tree, x, z) => {
    const th = Math.atan2(z - tree.foot.z, x - tree.foot.x) / (Math.PI * 2);
    let best = 0, most = -Infinity;
    for (const t of [th - tree.turnOffset, -th - tree.turnOffset]) {
      onTrunk(tree, 1.5, t, p);
      const d = p.normal.x * (x - tree.foot.x) + p.normal.z * (z - tree.foot.z);
      if (d > most) { most = d; best = t; }
    }
    return best;
  };
  const awayTurn = (tree) => facing(tree, 2 * tree.foot.x - world.eye.x, 2 * tree.foot.z - world.eye.z);
  const ceiling = (tree) => Math.max(1.2, Math.min(tree.top - 1, way.trees ? 11 : 7));
  // the ground's own up under a spot, for one that runs on it
  const slope = (x, z, out) => {
    const e = 0.15;
    return out.set(world.height(x - e, z) - world.height(x + e, z), 2 * e, world.height(x, z - e) - world.height(x, z + e)).normalize();
  };
  const onGround = (x, z, ahead, at = bird.at, quat = bird.q) => { at.set(x, world.height(x, z), z); frame(ahead, slope(x, z, _n), quat); };
  const onPost = (post, dir, at = bird.at, quat = bird.q) => {
    if (post.kind === 'log') {
      post.wood.on(post.share, p);
      at.copy(p.point); frame(_v.copy(p.up).multiplyScalar(dir), p.normal, quat);
    } else { at.copy(post.point); frame(_v.set(Math.cos(dir * 3), 0, Math.sin(dir * 3)), UP, quat); }
  };
  const runnable = (x0, z0, x1, z1) => {
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.5));
    for (let i = 1; i <= n; i += 1) if (!world.walkable(lerp(x0, x1, i / n), lerp(z0, z1, i / n), 0.08)) return false;
    return true;
  };
  // the trunks near a spot that it can climb (a squirrel: any big enough; a chipmunk: one near its home)
  const trunksAround = (x, z, reach) => world.trunksNear(x, z, reach, _near).filter((t) => t.girth >= (way.girth || 0.15) && t.top > 3 && !world.beside(t.foot.x, t.foot.z, t.girth + 0.4, bird));
  // a spot on the ground out from a trunk's foot, on the side `turn` faces: the nearest it can stand on (past the
  // flare of a giant's foot), or null
  const footOf = (tree, turn, out) => {
    onTrunk(tree, 0.25, turn, p);
    _n.copy(p.normal).setY(0);
    if (_n.lengthSq() < 1e-8) _n.set(1, 0, 0);
    _n.normalize();
    for (const extra of [0.16, 0.35, 0.6, 0.9, 1.3]) {
      const x = tree.foot.x + _n.x * (tree.girth + extra), z = tree.foot.z + _n.z * (tree.girth + extra);
      if (world.walkable(x, z, 0.08)) return out.set(x, world.height(x, z), z);
    }
    return null;
  };
  // ground it can be seen on: not under a fern, not in the meadow's tall grass or the wet ground's leaves
  const bare = (x, z) => {
    const kind = world.ground(x, z);
    if (kind !== 'floor' && kind !== 'tread' && kind !== 'stones') return false;
    return !world.coversNear(x, z, 2, _hid).some((c) => Math.hypot(c.x - x, c.z - z) < c.reach + 0.15);
  };
  // ---- whether a way is clear of the other animals (room, above), every 0.12 m or so of it, from where it is now:
  // over the floor to (x1, z1), and a spot at its end that no other animal has or is coming to
  const wayOver = (x1, z1) => {
    const x0 = bird.at.x, z0 = bird.at.z, dx = x1 - x0, dz = z1 - z0, d = Math.hypot(dx, dz);
    if (d < 1e-4) return true;
    const n = Math.ceil(d / 0.12), least = Math.min(HAND, roomHere());
    for (let i = 1; i <= n; i += 1) {
      const x = x0 + (dx * i) / n, z = z0 + (dz * i) / n;
      if (roomAt(x, world.height(x, z), z, dx / d, dz / d) < least - 1e-6) return false;
    }
    return world.free(_s.set(x1, world.height(x1, z1), z1), bird, Math.max(0.3, extent + HAND));
  };
  // a leap to `at` and `q`, its arc `arc` high (as `stepLeg` flies it), and where it lands
  const leapClear = (at, q, arc) => {
    const least = Math.min(HAND, roomHere());
    for (let i = 1; i <= 5; i += 1) {
      const t = i / 5;
      _s.lerpVectors(bird.at, at, ease(t)).addScaledVector(UP, arc * Math.sin(Math.PI * t));
      facingOf(_qa.slerpQuaternions(bird.q, q, Math.min(1, t * 1.6)), _e);
      if (roomAt(_s.x, _s.y, _s.z, _e.x, _e.z) < least - 1e-6) return false;
    }
    return world.free(at, bird, Math.max(0.3, extent + HAND));
  };
  // a dash on its trunk's bark from where it is to height h1, turn u1 and bearing b1
  const barkClear = (tree, h1, u1, b1) => {
    const h0 = bark.height, u0 = bark.turn, b0 = bark.bearing, dist = Math.abs(h1 - h0) + Math.abs(wrap(u1 - u0)) * 6.283 * tree.girth;
    const n = Math.max(1, Math.ceil(dist / 0.12)), least = Math.min(HAND, roomHere());
    for (let i = 1; i <= n; i += 1) {
      const t = i / n;
      onBark(tree, lerp(h0, h1, t), u0 + wrap(u1 - u0) * t, b0 + wrap(b1 - b0) * Math.min(1, t * 2.5), _s, _qa);
      facingOf(_qa, _e);
      if (roomAt(_s.x, _s.y, _s.z, _e.x, _e.z) < least - 1e-6) return false;
    }
    return true;
  };
  // a run along a log's back, from share s0 to s1
  const logClear = (post, s0, s1) => {
    post.wood.on(s0, p); _s.copy(p.point); post.wood.on(s1, p);
    const n = Math.max(2, Math.ceil(_s.distanceTo(p.point) / 0.1)), least = Math.min(HAND, roomHere()), dir = Math.sign(s1 - s0) || 1;
    for (let i = 1; i <= n; i += 1) {
      post.wood.on(lerp(s0, s1, i / n), p);
      _e.copy(p.up).multiplyScalar(dir).setY(0);
      if (_e.lengthSq() < 1e-8) _e.set(1, 0, 0); else _e.normalize();
      if (roomAt(p.point.x, p.point.y, p.point.z, _e.x, _e.z) < least - 1e-6) return false;
    }
    return true;
  };
  // where it is held up: it waits a moment, and after a few seconds of that gives up where it was going
  const blocked = (now, doing) => { now.wait = 0.3 + r() * 0.5; now.stuck = (now.stuck || 0) + now.wait; if (now.stuck > 3) { now.goal = null; now.stuck = 0; } bird.doing = doing; };

  // ---- a leg of movement, kept in `a.now.leg` (so that a change of activity ends it): on bark (height and turn eased
  // between two places), over the ground, along a log, or through the air (a leap or a scramble from one surface to
  // another, its frame turned on the way). `then` is what it does when it gets there.
  const legOn = (now, leg, then = null) => { now.leg = { t: 0, ...leg }; now.then = then; };
  const stepLeg = (now, dt) => {
    const leg = now.leg;
    if (!leg) return false;
    const was = bird.at.clone();
    // (over the ground, along a log or on the bark: what it had, to go back to if another animal is in its way)
    const kept = leg.kind === 'air' ? null : { q: bird.q.clone(), room: roomHere(), bark: [bark.height, bark.turn, bark.bearing], share: leg.post ? leg.post.share : 0 };
    leg.t = Math.min(1, leg.t + dt / leg.time);
    const t = leg.flat ? leg.t : ease(leg.t);
    if (leg.kind === 'bark') {
      bark.height = lerp(leg.h0, leg.h1, t); bark.turn = leg.u0 + wrap(leg.u1 - leg.u0) * t; bark.bearing = leg.b0 + wrap(leg.b1 - leg.b0) * Math.min(1, t * 2.5);
      onBark(bark.tree, bark.height, bark.turn, bark.bearing);
    } else if (leg.kind === 'ground') {
      const x = lerp(leg.x0, leg.x1, t), z = lerp(leg.z0, leg.z1, t);
      onGround(x, z, _v.set(leg.x1 - leg.x0, 0, leg.z1 - leg.z0));
      bird.at.y += (leg.hop || 0) * Math.abs(Math.sin(Math.PI * leg.t * (leg.bounds || 1)));
    } else if (leg.kind === 'log') {
      leg.post.share = lerp(leg.s0, leg.s1, t);
      onPost(leg.post, Math.sign(leg.s1 - leg.s0) || 1);
    } else {
      bird.at.lerpVectors(leg.a0, leg.a1, t).addScaledVector(UP, (leg.arc || 0) * Math.sin(Math.PI * leg.t));
      bird.q.slerpQuaternions(leg.q0, leg.q1, Math.min(1, leg.t * 1.6));
    }
    // Another animal come into its way since the leg began (it was clear then): back where it was, and the leg ended
    // there, and what it is doing goes on from where it is. (A leap, once begun, goes on: it was clear all the way.)
    if (kept) {
      const room = roomHere();
      if (room < HAND && room < kept.room - 1e-6) {
        bird.at.copy(was); bird.q.copy(kept.q);
        [bark.height, bark.turn, bark.bearing] = kept.bark;
        if (leg.post) leg.post.share = kept.share;
        now.leg = null; now.then = null; bird.want.scurry = 0;
        return true;
      }
    }
    gait(bird.at.distanceTo(was), leg.run ?? 1);
    if (leg.t >= 1) { now.leg = null; const then = now.then; now.then = null; bird.want.scurry = 0; if (then) then(); }
    return true;
  };
  // from where it is, through the air, to `at` and `q` (a leap; or a scramble from the ground onto a trunk or off it)
  const air = (now, at, q, time, arc, then) => legOn(now, { kind: 'air', a0: bird.at.clone(), q0: bird.q.clone(), a1: at.clone(), q1: q.clone(), time, arc }, then);
  const leap = (now, at, q, arc, then) => air(now, at, q, Math.max(0.16, bird.at.distanceTo(at) / (way.run[1] * 0.85)), arc, then);
  const look = (now, dt) => {
    // a quick turn of the head now and then, as it looks about
    now.look = (now.look ?? 0) - dt;
    if (now.look < 0) { now.look = 0.4 + r() * 1.6; now.head = { yaw: (r() - 0.5) * 1.6, pitch: (r() - 0.4) * 0.5 }; }
    return now.head || { yaw: 0, pitch: 0 };
  };
  // the walker, as its head turns to them (yaw in its own frame)
  const toWalker = () => {
    _v.copy(world.eye).sub(bird.at).applyQuaternion(_q.copy(bird.q).invert());
    return { yaw: clamp(Math.atan2(-_v.z, _v.x), -1.3, 1.3), pitch: clamp(Math.atan2(_v.y, Math.hypot(_v.x, _v.z)) * 0.6, -0.6, 0.6) };
  };
  const vanish = (seconds) => { bird.left = seconds; a.to('gone'); bird.cover = true; return true; };
  const say = (now, dt) => {
    calls -= dt;
    if (calls > 0) return false;
    calls = way.call.every[0] + r() * (way.call.every[1] - way.call.every[0]);
    world.say(bird, way.call.what, way.call.reach);
    return true;
  };

  // ---- the activities
  // On a trunk: climbing in dashes, clinging between them, spiralling round, head first on the way down. What it is
  // there for (`intent`): about its trunk; down to the floor; up out of the walker's reach; keeping the trunk
  // between itself and the walker; or off round and up it out of their sight, gone for `seconds`.
  const barkAct = {
    pose: () => posed({ cling: 1, tail: 0.35, curl: 0.15, neck: 0.75 }),
    enter(a, tree, height, turn, bearing, intent = 'about', from = null, seconds = 0) {
      Object.assign(bark, { tree, height: clamp(height, 0.3, ceiling(tree)), turn, bearing });
      Object.assign(a.now, { intent, seconds, wait: 0.2 + r() * 0.6, dashes: 0, hold: 0 });
      if (from) bird.doing = intent === 'leave' ? 'off up a trunk' : intent === 'safe' ? 'up a trunk, out of reach' : 'up onto a trunk';
      if (from) {
        const at = new THREE.Vector3(), q = new THREE.Quaternion();
        onBark(tree, bark.height, turn, bearing, at, q);
        bird.at.copy(from.at); bird.q.copy(from.q);
        leap(a.now, at, q, 0.03);
      } else onBark(tree, bark.height, turn, bearing);
    },
    step(a, dt) {
      const now = a.now, tree = bark.tree;
      if (world.day < 0.25 && now.intent !== 'leave') { now.intent = 'leave'; now.seconds = 300 + r() * 300; }
      // (how long the walker has been out of its notice, or right by its trunk, while it hides: counted every frame)
      if (now.intent === 'hide') { calm = far() > way.notice * 1.3 ? calm + dt : 0; now.pressed = far() < way.flush ? (now.pressed || 0) + dt : 0; }
      const down = Math.cos(bark.bearing * Math.PI * 2) < -0.3;
      Object.assign(bird.want, { down: down ? 1 : 0, crouch: now.intent === 'hide' && !now.leg ? 0.6 : 0, head: now.intent === 'hide' ? toWalker() : look(now, dt) });
      if (stepLeg(now, dt)) { bird.want.cling = 1; return; }
      bird.want.scurry = 0;
      now.wait -= dt;
      if (now.wait > 0) return;
      const top = ceiling(tree), h = bark.height;
      // A dash to (h1, u1, b1); where another animal is on its way, straight up or down instead, or (`round`) the other
      // way round its trunk; false, and nothing begun, where none of them is clear
      const dash = (h1, u1, b1, speed, run = 1, round = true) => {
        for (const [hh, uu, other] of [[h1, u1, false], [h1, bark.turn, true], ...(round ? [[h1, bark.turn - wrap(u1 - bark.turn), true]] : [])]) {
          const dist = Math.abs(hh - h) + Math.abs(wrap(uu - bark.turn)) * 6.283 * tree.girth;
          if ((other && dist < 0.05) || !barkClear(tree, hh, uu, b1)) continue;
          legOn(now, { kind: 'bark', h0: h, h1: hh, u0: bark.turn, u1: uu, b0: bark.bearing, b1, time: Math.max(0.12, dist / speed), run });
          return true;
        }
        return false;
      };
      const still = () => { now.wait = 0.3 + r() * 0.4; bird.doing = 'clinging to its trunk, still'; };
      if (now.intent === 'leave') {
        // round to the far side and up, until the walker cannot see it
        if (!world.plainly(bird) && world.crowd(bird.at, bird) > 0.3) { bird.left = now.seconds; a.to('gone'); return; }
        const u1 = awayTurn(tree), side = wrap(u1 - bark.turn);
        if (!dash(Math.min(top, h + 0.5 + r() * 0.6), bark.turn + clamp(side, -0.3, 0.3), Math.abs(side) > 0.08 ? 0.18 * Math.sign(side) : 0, way.climb[1], 1, false)) { still(); return; }
        now.wait = 0.05 + r() * 0.15;
        bird.doing = 'off round its trunk and up it';
        return;
      }
      if (now.intent === 'safe') {
        // up out of the walker's reach; then it scolds them, or keeps the trunk between
        const want = way.safe[0] + r() * (way.safe[1] - way.safe[0]);
        if (h < Math.min(top, want) - 0.3) {
          if (!dash(Math.min(top, h + 0.8 + r() * 0.8), bark.turn + (r() - 0.5) * 0.25, 0, way.climb[1])) { still(); return; }
          now.wait = 0.05 + r() * 0.2; bird.doing = 'up its trunk, out of reach'; return;
        }
        if (r() < way.scold) { a.to('scold'); return; }
        now.intent = 'hide'; now.wait = 0.1;
        return;
      }
      if (now.intent === 'hide') {
        // the trunk kept between it and the walker: round as they go round, and still
        const u1 = awayTurn(tree), side = wrap(u1 - bark.turn);
        if (Math.abs(side) > 0.07 && dash(clamp(h + (r() - 0.5) * 0.2, 0.45, top), bark.turn + clamp(side, -0.25, 0.25), 0.25 * Math.sign(side), way.climb[0] * 1.3, 1, false)) { now.wait = 0.1 + r() * 0.4; bird.doing = 'keeping its trunk between itself and you'; return; }
        bird.doing = Math.abs(side) > 0.07 ? 'clinging to its trunk, still' : 'pressed to the far side of its trunk, still';
        if (now.pressed > 3) { now.intent = 'leave'; now.seconds = r() < way.gone ? Infinity : a.awhile(); }
        else if (calm > 5 + r() * 4) { calm = 0; now.intent = 'down'; }
        now.wait = 0.25;
        return;
      }
      if (now.intent === 'down') {
        // head first down the trunk, in dashes, and onto the floor at its foot
        if (h <= 0.45) {
          const spot = footOf(tree, bark.turn, _w);
          if (spot && a.clear(spot, 0)) {
            const q = new THREE.Quaternion(), at = new THREE.Vector3(), x = spot.x, z = spot.z;
            onGround(x, z, _v.set(x - tree.foot.x, 0, z - tree.foot.z), at, q);
            if (leapClear(at, q, 0.04)) {
              leap(now, at, q, 0.04, () => a.to('floor', null));
              bird.doing = 'down off its trunk';
              return;
            }
          }
          // (no ground to jump down to on this side, or another animal there or on the way: round the trunk a little,
          // and try again)
          if (!dash(h, bark.turn + (r() < 0.5 ? 1 : -1) * (0.12 + r() * 0.2), 0.25, way.climb[0])) bird.doing = 'clinging low on its trunk, still';
          now.wait = 0.3 + r() * 0.5;
          return;
        }
        if (!dash(Math.max(0.4, h - 0.5 - r() * 0.9), bark.turn + (r() - 0.5) * 0.15, 0.5, way.climb[0] * (1 + r() * 0.6))) { still(); return; }
        now.wait = 0.1 + r() * 0.8;
        bird.doing = 'coming down its trunk head first';
        return;
      }
      // about its trunk: a dash up, down or round in a spiral, and a pause clinging to the bark, looking about; after a
      // while, down to the floor
      now.dashes += 1;
      if (now.dashes > 3 + r() * 6) { now.intent = 'down'; now.wait = 0.2; return; }
      const goes = r(), u1 = bark.turn + (r() - 0.5) * 0.4;
      const moved = goes < 0.5 ? dash(Math.min(top, h + 0.3 + r() * 1.2), u1, (u1 - bark.turn) * 0.8, way.climb[0]) : goes < 0.75 ? dash(Math.max(0.6, h - 0.3 - r() * 0.8), u1, 0.5, way.climb[0]) : false;
      now.wait = 0.4 + r() * 2.2;
      bird.doing = moved ? 'running round its trunk in a spiral' : 'clinging to the bark, looking about';
    },
  };

  // Up a trunk, facing the walker, chattering at them with its tail jerking at every call (the squirrel)
  const scoldAct = {
    pose: () => posed({ cling: 1, down: 1, tail: 0.6, curl: 0.15, neck: 0.95, ears: 0.6 }),
    enter(a) {
      const tree = bark.tree, u1 = facing(tree, world.eye.x, world.eye.z) + (r() - 0.5) * 0.12;
      Object.assign(a.now, { time: 6 + r() * 14, flick: 0, jerk: 0 });
      bird.doing = 'turning on its trunk to face you';
      legOn(a.now, { kind: 'bark', h0: bark.height, h1: bark.height, u0: bark.turn, u1, b0: bark.bearing, b1: 0.5 + (r() - 0.5) * 0.3, time: 0.4 });
    },
    step(a, dt) {
      const now = a.now;
      if (stepLeg(now, dt)) return;
      now.time -= dt; now.jerk -= dt;
      const chatter = Math.sin(world.clock * 40) > 0;
      if (say(now, dt)) now.jerk = 0.18;
      Object.assign(bird.want, { jaw: chatter ? 0.55 : 0.05, flick: now.jerk > 0 ? 0.7 : 0, head: toWalker(), scurry: 0 });
      bird.snap = now.jerk > 0.12;
      bird.doing = 'chattering at you from its trunk, its tail jerking';
      if (far() > way.notice * 1.4) calm += dt; else calm = 0;
      if (now.time < 0 || calm > 4) { calm = 0; a.to('bark', bark.tree, bark.height, bark.turn, bark.bearing, far() > way.notice ? 'down' : 'hide'); }
    },
  };

  // On the floor: bounding from place to place, stopping to nose through the litter, sitting up to look about.
  // `goal`: where it is going ({ kind: 'trunk', tree, intent, seconds }, { kind: 'post', post }, { kind: 'cover',
  // post, seconds }, { kind: 'off', x, z, seconds } or null: about its home)
  const floorAct = {
    pose: () => posed({ tail: 0.75, curl: 0.35 }),
    enter(a, goal = null) {
      Object.assign(a.now, { goal, wait: 0.2 + r() * 0.6, freeze: 0, watch: 0 });
      bird.want.scurry = 0;
      // (from the top of a stump or a log, or from a leap cut short: down onto the ground first)
      if (bird.at.y - world.height(bird.at.x, bird.at.z) > 0.05) {
        for (let k = 0; k < 16; k += 1) {
          const a0 = r() * 6.283, d = 0.45 + r() * 0.5 + (k >= 10 ? 0.35 : 0), x = bird.at.x + Math.cos(a0) * d, z = bird.at.z + Math.sin(a0) * d;
          if (!world.walkable(x, z, 0.08)) continue;
          const at = new THREE.Vector3(), q = new THREE.Quaternion();
          onGround(x, z, _v.set(Math.cos(a0), 0, Math.sin(a0)), at, q);
          if (!leapClear(at, q, 0.06)) continue;
          leap(a.now, at, q, 0.06);
          a.now.wait = 0;
          return;
        }
        onGround(bird.at.x, bird.at.z, _v.set(1, 0, 0).applyQuaternion(bird.q));
      }
    },
    step(a, dt) {
      const now = a.now;
      Object.assign(bird.want, { head: now.watch > 0 ? toWalker() : look(now, dt) });
      if (stepLeg(now, dt)) return;
      bird.want.scurry = 0;
      if (now.freeze > 0) { now.freeze -= dt; Object.assign(bird.want, { crouch: 1, sit: 0, tail: 0.2, head: toWalker() }); bird.doing = 'frozen still on the floor, watching you'; return; }
      if (now.watch > 0) {
        now.watch -= dt;
        Object.assign(bird.want, { sit: 1, crouch: 0, tail: 0.6, flick: Math.sin(world.clock * 9) > 0.7 ? 0.8 : 0 });
        if (say(now, dt)) bird.snap = true;
        bird.doing = 'sitting up, watching you';
        return;
      }
      Object.assign(bird.want, { crouch: 0, sit: 0, neck: 0.65, hold: 0 });
      now.wait -= dt;
      if (now.wait > 0) {
        if (now.sniff) { Object.assign(bird.want, { neck: 0.05, head: { yaw: Math.sin(world.clock * 7) * 0.3, pitch: -0.2 } }); bird.doing = 'nosing through the litter'; }
        else if (now.up) { Object.assign(bird.want, { sit: 1, tail: 0.7, curl: 0.45 }); bird.doing = 'sitting up on the floor, looking about'; }
        return;
      }
      now.sniff = false; now.up = false;
      if (world.day < 0.25 && (!now.goal || !now.goal.seconds)) { if (a.leave(300 + r() * 300)) return; }
      const goal = now.goal || (now.goal = choose());
      if (!goal) { now.wait = 1 + r() * 2; bird.doing = 'still on the floor, looking about'; return; }
      // where the goal is on the ground, and whether it is there
      let gx, gz;
      if (goal.kind === 'trunk') {
        if (!footOf(goal.tree, facing(goal.tree, bird.at.x, bird.at.z), _w)) { now.goal = null; now.wait = 0.3; return; }
        gx = _w.x; gz = _w.z;
      }
      else if (goal.kind === 'post' || goal.kind === 'cover') { gx = goal.post.x; gz = goal.post.z; }
      else { gx = goal.x; gz = goal.z; }
      const dx = gx - bird.at.x, dz = gz - bird.at.z, d = Math.hypot(dx, dz), fleeing = !!goal.seconds || goal.intent === 'safe' || goal.kind === 'cover' || goal.kind === 'off';
      const stop = goal.kind === 'post' || goal.kind === 'cover' ? goal.post.reach || 0.9 : 0.25;
      if (d < stop) { arrive(a, goal); return; }
      // a bound or a run of bounds towards it (a dash when it is frightened), and a pause
      const run = fleeing ? 1 : 0.55 + r() * 0.35, reach = Math.min(d - stop + 0.03, fleeing ? 2 + r() * 3 : 0.4 + r() * 1.3);
      let x1 = bird.at.x + (dx / d) * reach, z1 = bird.at.z + (dz / d) * reach, len = reach;
      const speed = fleeing ? way.run[1] : way.run[0] * (0.7 + r() * 0.5);
      const still = far() < way.notice * 1.5 ? 'still on the floor, watching you' : 'still on the floor, looking about';
      if (!runnable(bird.at.x, bird.at.z, x1, z1)) { now.goal = null; now.wait = 0.3 + r(); bird.doing = still; return; }
      if (!fleeing && !a.clear(_w.set(x1, world.height(x1, z1), z1), 0)) { now.goal = null; now.wait = 0.5 + r(); bird.doing = still; return; }
      // (another animal in its way, or where it would stop: a shorter bound off to one side; and where there is none,
      // it waits)
      if (!wayOver(x1, z1)) {
        const aim = Math.atan2(dz, dx), side = r() < 0.5 ? 1 : -1;
        let found = false;
        for (const turn of [0.5, -0.5, 1, -1, 1.6, -1.6]) {
          len = Math.min(reach, 0.3 + r() * (fleeing ? 1.2 : 0.6));
          x1 = bird.at.x + Math.cos(aim + turn * side) * len; z1 = bird.at.z + Math.sin(aim + turn * side) * len;
          if (runnable(bird.at.x, bird.at.z, x1, z1) && (fleeing || a.clear(_w.set(x1, world.height(x1, z1), z1), 0)) && wayOver(x1, z1)) { found = true; break; }
        }
        if (!found) { blocked(now, still); return; }
      }
      now.stuck = 0;
      legOn(now, { kind: 'ground', x0: bird.at.x, z0: bird.at.z, x1, z1, time: len / speed, flat: fleeing, run, hop: 0.012 * run, bounds: Math.max(1, Math.round(len / stride(run))) });
      bird.doing = fleeing ? (goal.kind === 'cover' ? 'dashing for cover' : goal.kind === 'trunk' ? 'racing for a trunk' : 'scampering off over the floor') : goal.kind === 'post' ? 'bounding over the floor to its stump' : 'bounding over the floor';
      if (fleeing) now.wait = 0.02;
      else { now.wait = 0.2 + r() * 1.4; const k = r(); now.sniff = k < 0.45; now.up = !now.sniff && k < 0.6; }
    },
  };
  // what it does next on the floor, left alone: off to its trunk or its post, or a little further about its home
  const choose = () => {
    const post = home.post, tree = home.tree;
    fed -= 10;
    if (way.trees) {
      if (post && fed < 0 && r() < 0.6 && world.free(post.point, bird, 0.3)) return { kind: 'post', post };
      const trees = trunksAround(bird.at.x, bird.at.z, way.range).filter((t) => a.clear(t.foot, 0));
      const to = tree && r() < 0.5 && a.clear(tree.foot, 0) ? tree : trees[Math.floor(r() * trees.length)];
      if (to) return { kind: 'trunk', tree: to, intent: 'about' };
      return null;
    }
    if (post && r() < 0.5 && world.free(post.point, bird, 0.3)) return { kind: 'post', post };
    for (let k = 0; k < 6; k += 1) {
      const a0 = r() * 6.283, d = (post.reach || 0.9) + 0.2 + r() * way.range, x = post.x + Math.cos(a0) * d, z = post.z + Math.sin(a0) * d;
      if (world.walkable(x, z, 0.08) && bare(x, z) && world.free(_k.set(x, world.height(x, z), z), bird, 0.3)) return { kind: 'spot', x, z };
    }
    return null;
  };
  const arrive = (a, goal) => {
    if (goal.kind === 'trunk') {
      // (up onto it, unless another animal is on the bark there or on its way: then it waits at the foot a moment)
      const tree = goal.tree, turn = facing(tree, bird.at.x, bird.at.z), at = new THREE.Vector3(), q = new THREE.Quaternion();
      onBark(tree, 0.35, turn, 0, at, q);
      if (!leapClear(at, q, 0.03)) { blocked(a.now, 'still at the foot of a trunk'); return; }
      a.to('bark', tree, 0.35, turn, 0, goal.intent || 'about', { at: bird.at.clone(), q: bird.q.clone() }, goal.seconds || 0);
      return;
    }
    if (goal.kind === 'post') {
      // up onto it, in one leap (not onto one another animal has, or is coming to)
      const at = new THREE.Vector3(), q = new THREE.Quaternion();
      onPost(goal.post, 1, at, q);
      if (!world.free(goal.post.point, bird, 0.3) || !leapClear(at, q, 0.12)) { a.now.goal = null; a.now.wait = 0.6; bird.doing = 'still on the floor, looking about'; return; }
      leap(a.now, at, q, 0.12, () => a.to('post', goal.post, goal.intent === 'safe'));
      bird.doing = 'up onto the wood';
      return;
    }
    if (goal.kind === 'cover') { a.to('cover', goal.post, goal.seconds); return; }
    if (goal.kind === 'off') {
      if (!world.plainly(bird)) { bird.left = goal.seconds; a.to('gone'); return; }
      const to = world.offstage(bird.at, bird, r, { least: 4, most: 18, away: true, radius: 0.1 });
      if (to && runnable(bird.at.x, bird.at.z, to.x, to.z)) { a.now.goal = { kind: 'off', x: to.x, z: to.z, seconds: goal.seconds }; return; }
      a.now.goal = null; a.now.wait = 0.4;
      return;
    }
    // (a spot about its home: it stops there a while; or one it ran to from the walker, to watch them from)
    a.now.goal = null; a.now.wait = 0.4 + r() * 2;
    if (goal.intent === 'safe') { a.now.watch = 3 + r() * 5; a.now.wait = 0; }
  };

  // On a stump or the back of a log: sitting up stripping a cone (the squirrel), or sitting up, looking about, now
  // and then a run along the log and back (a chipmunk)
  const postAct = {
    pose: () => posed({ sit: 1, tail: 0.75, curl: 0.5, neck: 0.55 }),
    enter(a, home, watching = false) {
      const post = { ...home };                  // (its own place on the wood: a run along a log moves it)
      Object.assign(a.now, { post, watching: watching ? 4 + r() * 4 : 0, time: way.feed[0] + r() * (way.feed[1] - way.feed[0]), pause: 0, wait: 0.5, eating: !!shape.cone });
      fed = 25 + r() * 40;
      onPost(post, 1);
    },
    step(a, dt) {
      const now = a.now;
      if (stepLeg(now, dt)) return;
      bird.want.scurry = 0;
      now.time -= dt;
      if (now.eating) {
        // the cone turned in its paws, its scales torn off one after another and dropped; now and then it stops to look
        now.pause -= dt;
        if (now.pause < -3 - r() * 6) now.pause = 0.6 + r() * 1.4;
        const busy = now.pause <= 0;
        if (busy) husk += dt * 1.3;
        Object.assign(bird.want, { sit: 1, hold: 1, strip: busy ? 1 : 0, husk, jaw: busy ? 0.3 + 0.3 * Math.sin(world.clock * 25) : 0, neck: busy ? 0.45 : 0.8, head: busy ? { yaw: 0, pitch: -0.25 } : look(now, dt) });
        bird.doing = busy ? 'sitting on a stump, stripping a cone' : 'stopped with a cone in its paws, looking about';
      } else if (now.watching > 0) {
        // (sitting up on it, watching the walker, now and then a chip and a flick of the tail)
        now.watching -= dt;
        Object.assign(bird.want, { sit: 1, hold: 0, head: toWalker(), flick: Math.sin(world.clock * 9) > 0.7 ? 0.8 : 0 });
        if (say(now, dt)) bird.snap = true;
        bird.doing = 'sitting up on the wood, watching you';
        if (now.time < 2) now.time = 2;
      } else {
        now.wait -= dt;
        Object.assign(bird.want, { sit: now.wait > 0 ? 1 : 0, hold: 0, head: look(now, dt), flick: Math.sin(world.clock * 8) > 0.85 ? 0.7 : 0 });
        bird.doing = 'sitting up on the wood, looking about';
        if (now.wait < 0 && now.post.kind === 'log' && r() < 0.5) {
          // a run along the log's back, and it sits up again
          const s1 = clamp(now.post.share + (r() - 0.5) * 0.4, 0.1, 0.9);
          now.post.wood.on(s1, p);
          if (world.free(p.point, bird, 0.3) && a.clear(p.point, 0) && logClear(now.post, now.post.share, s1)) { legOn(now, { kind: 'log', post: now.post, s0: now.post.share, s1, time: Math.max(0.2, Math.abs(s1 - now.post.share) * 6 / way.run[0]) }); bird.doing = 'running along the log'; }
          now.wait = 1.5 + r() * 4;
        } else if (now.wait < 0) now.wait = 1.5 + r() * 4;
      }
      if (now.time > 0) return;
      // down off it, and on about the floor
      const a0 = r() * 6.283, out = (now.post.reach || 0.9) + 0.05, x = now.post.x + Math.cos(a0) * out, z = now.post.z + Math.sin(a0) * out;
      if (!world.walkable(x, z, 0.08)) { now.time = 0.5; return; }
      const at = new THREE.Vector3(), q = new THREE.Quaternion();
      onGround(x, z, _v.set(x - bird.at.x, 0, z - bird.at.z), at, q);
      if (!leapClear(at, q, 0.1)) { now.time = 0.5; return; }
      leap(now, at, q, 0.1, () => a.to('floor', null));
      bird.doing = 'down off the wood';
    },
  };

  // Under cover beside a log or a stump, on the side away from the walker (a chipmunk): out of sight, and out again
  // when the walker has gone by, or gone for `seconds` if they stay
  // (wood a hand or two high hides a crouched chipmunk from a walker's eye only from some way off: 9 m is the
  // agent's number, for wood 0.12 m high and the animal 0.3 m behind it)
  const unseen = () => far() > 9 || !world.plainly(bird);
  const coverAct = {
    wary: false,
    pose: () => posed({ crouch: 1, tail: 0.1, curl: 0, neck: 0.5, ears: -0.4 }),
    enter(a, post, seconds = 0, there = false) {
      Object.assign(a.now, { post, seconds, time: 2 + r() * 5 });
      const dx = post.x - world.eye.x, dz = post.z - world.eye.z, d = Math.hypot(dx, dz) || 1, base = Math.atan2(dz, dx);
      let x = null, z = null;
      search: for (const reach of [0.3, 0.5, 0.7, 0.9, 1.2]) for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5]) {
        const xx = post.x + Math.cos(base + turn) * reach, zz = post.z + Math.sin(base + turn) * reach, yy = world.height(xx, zz);
        if (world.walkable(xx, zz, 0.06) && world.free(_u.set(xx, yy, zz), bird, 0.3) && roomAt(xx, yy, zz, dz / d, -dx / d) >= HAND) { x = xx; z = zz; break search; }
      }
      // (no room beside it on any side, another animal there: in under the wood, out of sight a while, if the
      // walker cannot see it go; if they can, it crouches where it is until they cannot)
      if (x == null) { if (unseen()) vanish(seconds || 5 + r() * 10); else a.now.stuck = seconds || 5 + r() * 10; return; }
      // (it runs the last of the way round to that side, over the wood in one low bound, and is under cover when it
      // is there: set down there at once, it was gone from the walker's side of a log and behind it in one frame,
      // up to a metre and a half off)
      const span = Math.hypot(x - bird.at.x, z - bird.at.z);
      // (`there`: it is found there, as one is that comes to the visit under cover)
      if (there || span < 0.25) { onGround(x, z, _v.set(dz, 0, -dx)); bird.cover = true; return; }
      Object.assign(a.now, { going: { x0: bird.at.x, z0: bird.at.z, x, z, span, t: 0, fx: dz, fz: -dx } });
    },
    step(a, dt) {
      const now = a.now;
      if (now.going) {
        const g = now.going, k = (g.t = Math.min(1, g.t + (dt * way.run[1]) / g.span));
        onGround(g.x0 + (g.x - g.x0) * k, g.z0 + (g.z - g.z0) * k, _v.set(g.x - g.x0, 0, g.z - g.z0));
        bird.at.y += Math.sin(Math.PI * k) * Math.min(0.3, g.span * 0.3);
        gait(dt * way.run[1], 1);
        bird.doing = 'dashing for cover';
        if (k >= 1) { onGround(g.x, g.z, _v.set(g.fx, 0, g.fz)); now.going = null; bird.cover = true; }
        return;
      }
      if (now.stuck) { bird.doing = 'crouched flat, quite still'; if (unseen()) vanish(now.stuck); return; }
      bird.doing = 'in under the wood, hidden';
      now.time -= dt;
      // (it is gone from there only when the walker could not see it go: low wood does not hide it from close by)
      if (now.seconds || world.day < 0.25) { if (unseen()) vanish(now.seconds || 300 + r() * 300); return; }
      if (far() < way.notice) { calm = 0; if (now.time < -8 && unseen()) vanish(a.awhile()); return; }
      calm += dt;
      if (now.time < 0 && calm > 2) { bird.cover = false; calm = 0; a.to('floor', null); }
    },
  };

  // ---- the walker, taken its own way: off at once from one who comes too near or moves suddenly; and within its
  // notice, a squirrel makes for a trunk and goes up out of reach, Townsend's chipmunk freezes and then dashes for
  // cover (or one time in ten for a trunk), and the Olympic chipmunk sits up and watches, and scampers off a little
  // way when the walker comes on, to watch again
  const react = (a, dt) => {
    cornered -= dt;
    const name = a.name, now = a.now;
    if (name === 'gone' || name === 'cover' || (name === 'bark' && now.intent === 'leave') || (now.goal && (now.goal.seconds || now.goal.intent === 'safe' || now.goal.kind === 'cover'))) return false;
    const d = far(), k = pace(world), near = d < way.flush * k || (world.walker.sudden > 0 && d < way.startle);
    if (!near && d > way.notice * k) return false;
    if (near && cornered <= 0) {
      if (way.watch && retreats < 3) { if (scamper(a)) { retreats += 1; return true; } }
      const gone = r() < way.gone ? Infinity : a.awhile();
      if (way.trees && bold && (name === 'bark' || name === 'scold')) {
        if (name === 'scold') { a.to('bark', bark.tree, bark.height, bark.turn, bark.bearing, 'hide'); return true; }
        if (now.intent !== 'hide') now.intent = bark.height < way.safe[0] ? 'safe' : 'hide';
        return false;
      }
      if (a.leave(gone)) return true;
      cornered = 0.7;
      return false;
    }
    if (near) return false;
    // within its notice
    if (way.trees) {
      if (name === 'bark') { if (now.intent === 'about' || now.intent === 'down') { now.intent = 'safe'; now.wait = Math.min(now.wait, 0.1); } return false; }
      if (name === 'floor' || name === 'post') {
        const tree = nearestTrunk(8 + way.range * 0.5);
        if (tree) { a.to('floor', { kind: 'trunk', tree, intent: 'safe' }); return true; }
        if (cornered <= 0 && a.leave(a.awhile())) return true;
        cornered = 0.7;
      }
      return false;
    }
    if (way.watch) {
      if (name === 'post') now.watching = 4 + r() * 4;
      else if (name === 'floor' && !(now.watch > 0) && !now.leg) now.watch = 3 + r() * 5;
      return false;
    }
    // Townsend's: frozen a moment, then for cover
    if (name === 'post') { a.to('floor', null); a.now.freeze = 0.6 + r() * 1.6; a.now.froze = true; return true; }
    if (name === 'floor' && !now.leg) {
      if (!now.froze) { now.freeze = 0.6 + r() * 1.6; now.froze = true; return false; }
      if (now.freeze > 0) return false;
      const secs = r() < 0.7 ? (r() < way.gone ? Infinity : a.awhile()) : 0;
      if (cornered <= 0 && (hide(a, secs) || a.leave(secs || a.awhile()))) return true;
      cornered = 0.7;
    }
    return false;
  };
  // where it stops on its way to a spot, `short` of it
  const stopAt = (to, short) => { const dx = to.x - bird.at.x, dz = to.z - bird.at.z, d = Math.hypot(dx, dz) || 1, k = Math.max(0, d - short) / d; return [bird.at.x + dx * k, bird.at.z + dz * k]; };
  const nearestTrunk = (reach) => {
    let best = null, most = Infinity;
    for (const t of trunksAround(bird.at.x, bird.at.z, reach)) {
      const d = Math.hypot(t.foot.x - bird.at.x, t.foot.z - bird.at.z);
      // (not one the walker stands nearer to than it does)
      if (Math.hypot(t.foot.x - world.eye.x, t.foot.z - world.eye.z) < d) continue;
      if (d >= most) continue;
      const spot = footOf(t, facing(t, bird.at.x, bird.at.z), _u);
      if (spot && runnable(bird.at.x, bird.at.z, spot.x, spot.z)) { most = d; best = t; }
    }
    return best;
  };
  // the nearest wood to hide under, on the side away from the walker
  const nearestCover = (reach) => {
    let best = null, most = Infinity;
    for (const post of [home.post, ...woodsNear(world, bird.at.x, bird.at.z, reach, r, p)]) {
      if (!post) continue;
      const d = Math.hypot(post.x - bird.at.x, post.z - bird.at.z);
      if (d > reach || Math.hypot(post.x - world.eye.x, post.z - world.eye.z) < d) continue;
      if (d < most && runnable(bird.at.x, bird.at.z, ...stopAt(_u.set(post.x, 0, post.z), post.reach || 0.9))) { most = d; best = post; }
    }
    return best;
  };
  const hide = (a, seconds = 0) => {
    if (way.up > 0 && r() < way.up) { const tree = nearestTrunk(10); if (tree) { a.to('floor', { kind: 'trunk', tree, intent: 'leave', seconds: seconds || Infinity }); return true; } }
    const post = nearestCover(12);
    if (post) { a.to('floor', { kind: 'cover', post, seconds, intent: 'safe' }); return true; }
    return false;
  };
  // a little way off from the walker, still in their sight, to watch them again (the Olympic chipmunk)
  const scamper = (a) => {
    const dx = bird.at.x - world.eye.x, dz = bird.at.z - world.eye.z, d = Math.hypot(dx, dz) || 1;
    // onto a stump or a log further from them, if there is one to hand; or off over the floor a little way
    for (const post of woodsNear(world, bird.at.x, bird.at.z, 16, r, p)) {
      const off = Math.hypot(post.x - world.eye.x, post.z - world.eye.z);
      if (off < d + 4 || !world.free(post.point, bird, 0.3) || !runnable(bird.at.x, bird.at.z, ...stopAt(_u.set(post.x, 0, post.z), post.reach))) continue;
      a.to('floor', { kind: 'post', post, intent: 'safe' });
      return true;
    }
    for (let tries = 0; tries < 8; tries += 1) {
      const turn = (r() - 0.5) * 1.6, go = 6 + r() * 12, c = Math.cos(turn), s = Math.sin(turn);
      const x = bird.at.x + ((dx * c - dz * s) / d) * go, z = bird.at.z + ((dx * s + dz * c) / d) * go;
      if (!runnable(bird.at.x, bird.at.z, x, z) || (tries < 5 && !bare(x, z)) || !world.free(_k.set(x, world.height(x, z), z), bird, 0.3)) continue;
      a.to('floor', { kind: 'spot', x, z, intent: 'safe' });
      return true;
    }
    return false;
  };

  // ---- off out of the walker's sight, for `seconds`: round its trunk and up it; under the nearest wood; or off
  // over the floor to somewhere they cannot see it. False, and nothing changed, where there is none.
  const leave = (seconds) => {
    if (a.cast) return false;
    // (once it is there: on its way round to the far side it is still in view)
    if (a.name === 'cover' && !a.now.going && unseen()) return vanish(seconds);
    if (a.name === 'cover') { a.now.seconds = seconds; return true; }
    if (a.name === 'bark' || a.name === 'scold') { a.to('bark', bark.tree, bark.height, bark.turn, bark.bearing, 'leave', null, seconds); return true; }
    if (way.trees) { const tree = nearestTrunk(14); if (tree) { a.to('floor', { kind: 'trunk', tree, intent: 'leave', seconds }); return true; } }
    else if (hide(a, seconds)) return true;
    const to = world.offstage(bird.at, bird, r, { least: 4, most: 20, away: true, radius: 0.1 });
    if (to && runnable(bird.at.x, bird.at.z, to.x, to.z)) { a.to('floor', { kind: 'off', x: to.x, z: to.z, seconds }); return true; }
    return false;
  };

  return {
    activities: { bark: barkAct, scold: scoldAct, floor: floorAct, post: postAct, cover: coverAct },
    react, leave,
    // Where it is when it comes: by night it does not (it is in its nest or its burrow). At the visit's start, about
    // its home; later, in from out of the walker's sight: from behind a trunk near its home (the squirrel), or out
    // from under its wood (a chipmunk). With no way in unseen, not yet.
    begin() {
      if (world.day < 0.25) { bird.left = 300 + r() * 300; return; }
      const first = a.life && a.life.first;
      // (not into another animal, nor where one is coming: room, above)
      const roomy = () => roomHere() >= HAND && world.free(bird.at, bird, 0.3);
      if (way.trees) {
        const trees = [home.tree, ...trunksAround(home.x, home.z, way.range)].filter((t) => t && t.girth >= way.girth);
        if (first) {
          const k = r();
          if (k < 0.4 && home.post && world.free(home.post.point, bird, 0.3)) { onPost(home.post, 1); if (roomy()) { a.to('post', home.post); return; } }
          if (k < 0.7 && footOf(home.tree, r(), _w)) { onGround(_w.x, _w.z, _v.set(r() - 0.5, 0, r() - 0.5)); if (roomy()) { a.to('floor', null); return; } }
          for (let tries = 0; tries < 4 && trees.length; tries += 1) {
            const tree = trees[Math.floor(r() * trees.length)], h = clamp(1 + r() * 4, 0.3, ceiling(tree)), u = r(), b = r() < 0.5 ? 0 : 0.5;
            onBark(tree, h, u, b);
            if (roomy()) { a.to('bark', tree, h, u, b); return; }
          }
          bird.left = 4 + r() * 8;
          return;
        }
        for (let tries = 0; tries < 4 && trees.length; tries += 1) {
          const tree = trees[Math.floor(r() * trees.length)], h = Math.min(ceiling(tree), 2 + r() * 5);
          onBark(tree, h, awayTurn(tree), 0);
          if (world.plainly(bird) || world.crowd(bird.at, bird) < 0.3 || !roomy()) continue;
          a.to('bark', tree, h, awayTurn(tree), 0, r() < 0.6 ? 'down' : 'about');
          return;
        }
        bird.left = 4 + r() * 8;
        return;
      }
      const post = home.post;
      if (first) {
        if (r() < 0.5 && world.free(post.point, bird, 0.3)) { onPost(post, 1); if (roomy()) { a.to('post', post); return; } }
        const a0 = r() * 6.283, x = post.x + Math.cos(a0) * 1.2, z = post.z + Math.sin(a0) * 1.2;
        if (world.walkable(x, z, 0.08)) { onGround(x, z, _v.set(Math.cos(a0 + 2), 0, Math.sin(a0 + 2))); if (roomy()) { a.to('floor', null); return; } }
      }
      a.to('cover', post, 0, true);
    },
  };
}

// Where one lives on a visit. The squirrel: a big trunk near the walk, with a stump or a log near it to strip its cones
// on, and no other squirrel's within its territory. A chipmunk: a stump or a log near the walk, with ground about it
// to run on (Townsend's under the trees; the Olympic chipmunk where the wood is open, if there is such a place).
const homeOf = (way) => (habitat, r, taken) => {
  const p = spot(), apart = (x, z) => !way.territory || !taken.some((h) => Math.hypot(h.x - x, h.z - z) < way.territory);
  if (way.trees) {
    const trees = habitat.trunks.filter((t) => t.off < way.homeOff && t.girth >= way.girth && t.top > 6 && apart(t.foot.x, t.foot.z));
    for (let tries = 0; trees.length && tries < 24; tries += 1) {
      const tree = trees[Math.floor(r() * trees.length)], posts = woodsNear(habitat, tree.foot.x, tree.foot.z, way.range, r, p);
      if (!posts.length || !besideWood(habitat, tree.foot.x + tree.girth + 0.3, tree.foot.z)) continue;
      return { x: tree.foot.x, z: tree.foot.z, tree, post: posts[Math.floor(r() * posts.length)] };
    }
    return null;
  }
  const near = (list) => list.filter((one) => one.off < way.homeOff && apart(one.x, one.z));
  const all = [...near(habitat.stumps), ...near(habitat.logs)];
  const open = all.filter((one) => (habitat.open(one.x, one.z) >= 0.3) === !!way.watch);
  const some = open.length ? open : all;
  for (let tries = 0; some.length && tries < 24; tries += 1) {
    const one = some[Math.floor(r() * some.length)], posts = woodsNear(habitat, one.x, one.z, 3, r, p);
    if (!posts.length) continue;
    const post = posts[0];
    return { x: post.x, z: post.z, tree: null, post };
  }
  return null;
};

export default {
  // what a scurrier's way holds besides what every way has (life/families/index.js)
  fields: {
    homeOff: 'number',                     // its home no further from the walk than this (m)
    range: 'number',                       // how far from its home it goes about (m)
    territory: optional('number'),         // no home within this of another of its kind's (m)
    girth: 'number',                       // the least girth of a trunk it climbs (m, at a walker's chest)
    run: nums(2), climb: nums(2),          // its pace on the floor and up a trunk, going about and in flight (m/s)
    safe: optional(nums(2)),               // how high up a trunk is out of the walker's reach (m)
    notice: 'number',                      // within this many metres of a walker at a stroll it takes notice of them
    ...WARY,                               // flush and startle (off at once), near (up its trunk, not off), gone (for good)
    trees: 'boolean',                      // it lives on trunks (a squirrel), not on the floor and the dead wood
    scold: 'number',                       // the chance it chatters at the walker from up its trunk, not hides
    up: 'number',                          // the chance a chipmunk makes for a trunk, not for cover
    watch: 'boolean',                      // it watches the walker from a distance and does not hide
    feed: nums(2),                         // seconds at a time on its stump or log
    call: { every: nums(2), reach: 'number', what: 'string' },
  },
  act: (way) => (bird, world) => live(bird, world, way, scurrier),
  home: homeOf,
};
