import * as THREE from 'three';
import { frame, UP, spot, flying } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums } from '../bodies.js';
import { creek, river, inMeadow } from '../../world/land.js';

// Sparrows and the junco: birds of the ground at the edges, which feed hopping over open ground and scratch in the
// litter, and go up into a tree when they are put up (into a shrub as they do in the wild, once the shrubs of the
// understory hand over places to stand: they hand over none yet). The Dark-eyed Junco (the Oregon form), the Song
// Sparrow and the Fox Sparrow (life/species/). Each is only ever one of a visit's own; the juncos go about in pairs
// (`together`), the others alone.
//
// Where. Its home is a stretch of the walk (`bird.home`: { s, from, ok, perches, posts, ... }, found below): it
// feeds on the tread itself, within 0.4 m of its middle line, where a walker sees it. The floor beside the tread is
// under the fronds of ferns, under sorrel or in grass almost everywhere (a bird there is not seen: CLAUDE.md, "Learned
// in milestone 4"), and a bar's cobbles lie across the tread on the beach (a bird stood inside them), so neither is fed
// on; nor is the foot log or the stepping stones, where the tread does not lie on the ground. Its perches are the low
// boughs of the trees beside the stretch (a hemlock pole's, a willow's, a vine maple's, the apple's, a young spruce's),
// the stubs of broken limbs, the tops of stumps and the backs of logs. Which stretch suits which kind is its way's own:
// how open the air over it is (`air`) and, for the Fox Sparrow, how near cover of the kind it keeps to (`thicket`: the
// creek, the river, the old clearing's edge, where the salmonberry grows: world/layout.js UNDER).
//
// What it does there, each an activity: it feeds (`forage`), hopping along the tread in short hops, picking at the
// ground, looking about, and scratching in the litter with the double scratch (a little hop forward and a jump back
// that kicks the litter behind it with both feet), the Fox Sparrow above all; the junco flicks its tail open, a
// flash of white. After a while at one patch it moves on along its stretch, low, a few metres; or goes up to a post
// to sing (the junco's trill from a low branch two to six metres up, the Song Sparrow's song from a low perch: a
// willow's bough by the river, a tree's low bough, a stump or a log), or to sit a while; and when it has worked its stretch it goes, for a while or for good. A pair keeps together: where one
// moves on to, the other follows a moment later, and when one goes, so does its mate. By night it roosts on a bough
// and is not put up.
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then it is up into a tree near by that is clear of them (a low bough or the stub of a limb at least 1.2 m up; a
// log's back or a stump's top only if there is none; the further from the walk the better, or it is passed under and
// put up again), calling as it goes, its tail spread (the junco's white outer feathers); or it is off. In
// a pair the one put up warns its mate, which goes up too (BirdWeb: "The flash of white tail feathers serve as a
// signal that alerts members of the flock when one is alarmed"). Up there it goes on with its life: it looks about,
// calls, and after a while comes back down to its stretch, well clear of the walker: behind one who walks on, on its
// own side of one who stands, never in front of one who is coming on unless they are forty metres off; with nowhere
// to come down it goes to another perch, or off. It does not fly low past a walker who stands between it and where
// it is going, to move on along its stretch or to follow its mate.
//
// From what was read (the species' sheets, and BirdWeb's pages for the three, read 2026-11-16): the junco forages on
// the ground "scratching with their feet to find food", flashes its white tail feathers when alarmed, and the male
// "sings from a high perch" (here a low one, up to six metres: from the walk a bird higher in a tree is looked up at
// through the bough's own leaves, the bough birds' lesson); the Song Sparrow forages "mostly on the ground, sometimes
// scratching the soil", holds its long tail cocked and pumps it "up and down in flight", and lives in "dense, brushy
// thickets"; the Fox Sparrow scratches "in the leaf litter with a two-footed jump-kick motion", and the Sooty forms
// breed "in willows and alders at the edge of wet habitats" (Wikipedia, "Sooty fox sparrow"), its call "a sharp zitt
// or thik". The agent's own: every distance, time and chance below, the stretch of tread each keeps to, the scratch's
// timing and pose, that a pair's mate follows, and where a bird put up comes back down.

const TREAD = 0.4;        // metres either side of the walk's middle line it keeps to (sorrel, ferns and grass stand back from there)
const BIN = 0.5;          // the stretch's tread is judged every half metre
const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3();
const _cr = [0, 0, 0, 0, 0], _rv = [0, false, 0, 0, 0];

// Is the tread at (x, z) one a bird can be seen on: the tread itself, not steep and lying on the ground (not the foot
// log over the creek, not the stepping stones through it: both where the walk crosses the creek), and clear of a bar's
// cobbles.
function treadOk(habitat, x, z) {
  if (habitat.ground(x, z) !== 'tread') return false;
  if (creek(x, z, _cr)[0] < 3) return false;
  river(x, z, _rv);
  return _rv[0] > _rv[3] + 1.5;
}
// ... across the whole width it keeps to, `s` metres along the walk (`habitat.ground` says 'steep' or 'water' before
// it says 'tread', so the middle line alone is not enough: on the bank down to the river the tread's edges are steep)
const across = (habitat, s, p) => [-TREAD, 0, TREAD].every((side) => { habitat.beside(s, side, p); return treadOk(habitat, p.x, p.z); });
// Near the cover a Fox Sparrow keeps to: within `m` metres of the creek's middle line or of the river's water, or
// within half that of the old clearing's edge (inside it or out).
const thicketNear = (x, z, m) => creek(x, z, _cr)[0] < m || river(x, z, _rv)[0] < m || Math.abs(inMeadow(x, z)) < m * 0.5;

// The perches beside a stretch of the walk (every eight metres along it, within `reach`), from a quarter metre to
// `high` metres above the ground: low boughs, the stubs of broken limbs, the tops of stumps and the backs of logs. Each as
// { point, along (a bough's or a stub's, else null), radius, kind, h (metres over the ground), off (metres from the
// walk, of its tree or its wood), air (how open the air is over it) }.
function perchesBy(habitat, from, length, reach, high, r) {
  const seen = new Set(), out = [], mid = new THREE.Vector3();
  const add = (point, props) => {
    const h = point.y - habitat.height(point.x, point.z);
    if (h < 0.25 || h > high) return;
    out.push({ point: point.clone(), along: null, radius: 0, h, air: habitat.open(point.x, point.z), ...props });
  };
  for (let s = from; s <= from + length + 0.01; s += 8) {
    habitat.beside(s, 0, mid);
    for (const one of habitat.boughsNear(mid.x, mid.z, reach, [])) {
      if (seen.has(one)) continue;
      seen.add(one);
      add(one.point, { along: one.along.clone(), radius: one.radius, kind: 'bough', off: one.tree.off });
    }
    for (const stub of habitat.stubsNear(mid.x, mid.z, reach, [])) {
      if (seen.has(stub)) continue;
      seen.add(stub);
      add(stub.point, { along: stub.along.clone(), radius: stub.radius, kind: 'stub', off: stub.off });
    }
    for (const stump of habitat.stumps) {
      if (seen.has(stump) || Math.hypot(stump.x - mid.x, stump.z - mid.z) > reach) continue;
      seen.add(stump);
      add(stump.point, { kind: 'stump', off: stump.off });
    }
    for (const log of habitat.logs) {
      if (seen.has(log) || Math.hypot(log.x - mid.x, log.z - mid.z) > reach + 4) continue;
      seen.add(log);
      for (const share of [0.22, 0.5, 0.78]) add(log.on(share, spot()).point, { kind: 'log', off: log.off });
    }
  }
  // (a stand of hemlock poles hands over hundreds: a home keeps eighty of them, by chance)
  while (out.length > 80) out.splice(Math.floor(r() * out.length), 1);
  return out;
}

function scratcher(a) {
  const { bird, world, way, r } = a, home = bird.home;     // home: { s, from, ok, perches, posts, patch, count, quota, leaving, alarm, drift }
  const g = bird.sheet.poses.ground || bird.sheet.poses.perched, rest = bird.sheet.poses.perched;
  const gHead = g.head && g.head.pitch != null ? g.head.pitch : 0.05, gTail = (g.tail && g.tail.pitch) || 0;
  const q = new THREE.Quaternion(), to = new THREE.Vector3();
  const L = world.trail.length, between = (range) => range[0] + r() * (range[1] - range[0]);
  const quota = () => Math.round(between(way.patches));
  // (of a pair only the first sings; a bird alone does)
  const singer = !!way.song && (!bird.who || !bird.who.party || bird.who.party.members[0] === bird.who);
  // where it is, kept across its activities: on the tread, `s` metres along the walk (counted on from the home's
  // `from`, never wrapped) and `side` metres to the walk's right, facing `turn` radians off the walk's own way; or on a perch
  const at = { s: home.s, side: 0, turn: 0, perch: null };
  let until = between(way.stay), again = 0, lastS = null, walkerWay = 0;

  // ---- the tread
  const signed = (d) => ((((d % L) + 1.5 * L) % L) - 0.5 * L);
  // is `s` on the home's stretch, where the tread lies on the ground and no cobbles lie on it?
  const good = (s) => { const i = Math.round((s - home.from) / BIN); return i >= 0 && i < home.ok.length && home.ok[i] === 1; };
  const tread = (s, side, out) => { world.trail.sample(s, _p, _t); const x = _p.x - _t.z * side, z = _p.z + _t.x * side; return out.set(x, world.height(x, z), z); };
  // the way it faces on the tread
  const facing = (s, turn, out) => { world.trail.sample(s, _p, _t); _u.set(-_t.z, 0, _t.x); out.copy(_t).multiplyScalar(Math.cos(turn)).addScaledVector(_u, Math.sin(turn)); return out; };
  const face = () => frame(facing(at.s, at.turn, _w), UP, bird.q);
  // which way along the walk the walker last went (+1, -1; 0 until they have gone half a metre), from their place on
  // it (a jump of more than five metres is a scripted pose, and does not count)
  const sense = () => {
    const ws = world.walker.s;
    if (ws == null) return;
    if (lastS == null) { lastS = ws; return; }
    const d = signed(ws - lastS);
    if (Math.abs(d) > 5) lastS = ws;
    else if (Math.abs(d) > 0.5) { walkerWay = Math.sign(d); lastS = ws; }
  };
  // which side of the walker a place on the walk is (+1 ahead of them along the walk, -1 behind)
  const sideOf = (s) => Math.sign(signed(s - world.walker.s));
  // A place on its stretch of the tread: free of other animals, clear of the walker by `margin` metres more than its
  // flush distance (life/behave.js), within `near` metres along the walk of `s` (anywhere on the stretch if `s` is
  // null), and, if `side` is +1 or -1, on that side of the walker along the walk. Null if none was found in a few tries.
  const ground = (s = null, near = Infinity, margin = 1, side = 0) => {
    for (let tries = 0; tries < 12; tries += 1) {
      const ss = s == null ? home.from + r() * way.stretch : s + (r() * 2 - 1) * near;
      if (!good(ss)) continue;
      if (side !== 0 && signed(ss - world.walker.s) * side <= 0) continue;
      const lateral = (r() * 2 - 1) * TREAD;
      tread(ss, lateral, to);
      if (!a.clear(to, margin) || !world.free(to, bird, 0.45)) continue;
      return { s: ss, side: lateral, point: to.clone() };
    }
    return null;
  };

  // ---- poses
  const stand = (extra = {}) => Object.assign(bird.want, { pitch: g.pitch, lift: g.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.03, gape: 0,
    head: a.now.head || { yaw: 0, pitch: gHead, roll: 0 }, tail: { pitch: gTail, fan: (g.tail && g.tail.fan) || 0 }, feet: { mode: 'flat' } }, extra);
  const sit = (head, extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
    head, tail: { ...rest.tail }, feet: at.perch && at.perch.radius > 0 ? { mode: 'grip', round: Math.max(0.004, at.perch.radius) } : { mode: 'flat' } }, extra);
  // how it sits on a perch: across a bough or a stub, any way on a stump's top or a log's back
  const seat = (p, out) => {
    if (p.along) { _v.crossVectors(p.along, UP); if (_v.lengthSq() < 1e-6) _v.set(1, 0, 0); if (r() < 0.5) _v.negate(); } else { const th = r() * 6.283; _v.set(Math.cos(th), 0, Math.sin(th)); }
    return frame(_v, UP, out);
  };

  // ---- moves
  // off to a perch, and onto it (`why`: 'flushed', 'sing' or 'rest')
  const go = (p, why, doing) => {
    a.fly({ at: p.point.clone(), q: seat(p, q).clone(), rise: 0.15, floor: world.height }, 'perch', p, why);
    if (doing) bird.doing = doing;
    return true;
  };
  // down onto the tread, low, at a place on its stretch (and a pair's mate is to follow it there)
  const land = (one, doing) => {
    at.turn = r() < 0.5 ? (r() - 0.5) * 0.8 : Math.PI + (r() - 0.5) * 0.8;
    a.fly({ at: one.point, q: frame(facing(one.s, at.turn, _w), UP, q).clone(), rise: 0, floor: world.height }, 'forage', one);
    if (way.together) home.patch = { s: one.s, side: one.side, by: bird };
    if (doing) bird.doing = doing;
    return true;
  };
  // A perch of its home to go up to: free, clear of the walker, within `reach` of it; from `list` (its posts to sing
  // from, or all its perches), the most open first for a song.
  const pick = (list, reach, open = false) => {
    const all = list.filter((p) => p !== at.perch && p.point.distanceTo(bird.at) < reach && a.clear(p.point, 1) && world.free(p.point, bird, 0.4));
    if (!all.length) return null;
    if (open) all.sort((m, n) => n.air - m.air);
    const some = all.filter((p) => !world.blocked(bird.at, p.point));
    const from = (some.length ? some : all).slice(0, open ? Math.max(2, Math.ceil(all.length / 2)) : undefined);
    return from[Math.floor(r() * from.length)];
  };
  // what it is doing on its perch, and on its way up to one, in the card's words
  const perched = () => (!at.perch || at.perch.kind === 'bough' || at.perch.kind === 'stub' ? way.perched : `perched on ${at.perch.kind === 'log' ? 'a log' : 'a stump'}, looking about`);
  const upTo = (p) => (p.kind === 'bough' || p.kind === 'stub' ? 'flying up into a tree' : `flying up onto ${p.kind === 'log' ? 'a log' : 'a stump'}`);
  // where to roost: a bough first (a stub, a stump or a log if there is none), near where it is (or anywhere on its
  // stretch, for one that comes by night)
  const roosting = (anywhere = false) => {
    const near = home.perches.filter((p) => (anywhere || p.point.distanceTo(bird.at) < way.reach + 6) && world.free(p.point, bird, 0.4));
    const boughs = near.filter((p) => p.kind === 'bough'), some = boughs.length ? boughs : near;
    return some.length ? some[Math.floor(r() * some.length)] : null;
  };
  // it has worked its stretch: off, for a while or for good (and a pair's mate goes too: `leave`, below)
  const done = () => a.leave(r() < way.gone ? Infinity : a.awhile());

  // ---- on the ground
  // a hop: both feet together, a hand's breadth or less, a little up and down; true while one is being made
  const hopping = (dt) => {
    const h = a.now.hop;
    if (!h) return false;
    h.t = Math.min(1, h.t + dt / h.time);
    bird.at.lerpVectors(h.a, h.b, h.t); bird.at.y += h.up * Math.sin(Math.PI * h.t);
    stand({ lift: g.lift * (1 + 0.35 * Math.sin(Math.PI * h.t)), feet: { mode: h.t > 0.2 && h.t < 0.8 ? 'tuck' : 'flat' } });
    bird.snap = true;
    if (h.t >= 1) { a.now.hop = null; at.s = h.s; at.side = h.side; a.now.wait = a.now.hops > 0 ? 0.04 + r() * 0.08 : 0.3 + r() * 1.1; }
    return true;
  };
  // the next hop along `turn`, if the tread is there, it does not take it onto another animal, and not towards the walker
  // past where it would be put up
  const hop = () => {
    facing(at.s, at.turn, _w); world.trail.sample(at.s, _p, _t);
    const len = between(way.hop), ds = len * _w.dot(_t), side = at.side + len * _w.dot(_u.set(-_t.z, 0, _t.x)), s = at.s + ds;
    if (Math.abs(side) > TREAD || !good(s)) return false;
    tread(s, side, to);
    if (!a.clear(to, 0) || world.crowd(to, bird) < Math.min(0.35, world.crowd(bird.at, bird))) return false;
    face();
    a.now.hop = { a: bird.at.clone(), b: to.clone(), t: 0, time: 0.1 + 0.03 * r(), up: 0.012 + 0.008 * r(), s, side };
    bird.doing = way.hopping;
    return true;
  };
  // The double scratch: a little hop forward, and a jump back that kicks the litter out behind with both feet; then a
  // look down at what it has turned up. True while one is being made.
  const kicking = (dt) => {
    const k = a.now.kick;
    if (!k) return false;
    k.t += dt;
    const T1 = 0.09, T2 = 0.25, T3 = 0.34;
    if (k.t < T1) {
      const u = k.t / T1;
      bird.at.lerpVectors(k.a, k.f, u); bird.at.y += 0.01 * Math.sin(Math.PI * u);
      stand({ pitch: g.pitch - 0.08, lift: g.lift * (1 + 0.3 * Math.sin(Math.PI * u)), head: { yaw: 0, pitch: -0.35, roll: 0 }, feet: { mode: u > 0.25 && u < 0.75 ? 'tuck' : 'flat' } });
    } else if (k.t < T2) {
      const u = (k.t - T1) / (T2 - T1), s = Math.sin(Math.PI * u);
      bird.at.lerpVectors(k.f, k.b, u); bird.at.y += 0.016 * s;
      // (the feet are thrown back behind the body as it jumps, and the tail goes up)
      stand({ pitch: g.pitch - 0.3 * s, lean: 0.012 * s, lift: g.lift * (1 + 0.22 * s), head: { yaw: 0, pitch: -0.75, roll: 0 },
        tail: { pitch: gTail + 0.45 * s, fan: 0.08 }, feet: { mode: 'flat', ahead: -0.028 * s } });
    } else {
      bird.at.copy(k.b);
      stand({ pitch: g.pitch - 0.14, head: { yaw: 0.25 * Math.sin(k.t * 30), pitch: -0.8, roll: 0 } });
    }
    bird.snap = true;
    bird.doing = 'scratching in the litter: a hop forward and a kick back with both feet';
    if (k.t >= T3) { a.now.kick = null; at.s = k.s; at.side = k.side; a.now.wait = a.now.kicks > 0 ? 0.05 + r() * 0.1 : 0.3 + r() * 0.8; a.now.peck = a.now.kicks > 0 ? 0 : 0.3 + r() * 0.6; }
    return true;
  };
  const kick = () => {
    facing(at.s, at.turn, _w); world.trail.sample(at.s, _p, _t); _u.set(-_t.z, 0, _t.x);
    const fs = 0.035 * _w.dot(_t), fside = 0.035 * _w.dot(_u), bs = -0.022 * _w.dot(_t), bside = -0.022 * _w.dot(_u);
    if (Math.abs(at.side + fside) > TREAD || Math.abs(at.side + bside) > TREAD || !good(at.s + fs) || !good(at.s + bs)) return false;
    const f = tread(at.s + fs, at.side + fside, new THREE.Vector3()), b = tread(at.s + bs, at.side + bside, new THREE.Vector3());
    const least = Math.min(0.35, world.crowd(bird.at, bird));
    if (!a.clear(f, 0) || world.crowd(f, bird) < least || world.crowd(b, bird) < least) return false;
    face();
    a.now.kick = { a: bird.at.clone(), f, b, t: 0, s: at.s + bs, side: at.side + bside };
    return true;
  };

  const forage = {
    pose: () => ({ pitch: g.pitch, lift: g.lift, tail: { pitch: gTail, fan: 0, yaw: 0, prop: null } }),
    enter(a, one, wait = 0.4 + r() * 0.8) {
      at.s = one.s; at.side = one.side; at.perch = null;
      Object.assign(a.now, { wait, hop: null, kick: null, hops: 0, kicks: 0, peck: 0, look: 0, flick: 0, follow: null, warned: home.alarm ? home.alarm.at : -1,
        head: { yaw: 0, pitch: gHead, roll: 0 } });
      if (bird.at.distanceToSquared(one.point) > 0.0025) bird.at.copy(one.point);
      face();
      bird.doing = 'looking about';
    },
    step(a, dt) {
      const now = a.now;
      sense();
      // by night it goes up to roost (with nowhere to roost it stays down, and looks again in a while)
      if (world.day < 0.08) {
        if (again <= 0) { const p = roosting(); if (p) { go(p, 'rest', 'flying up to roost'); return; } again = 4; }
        again -= dt; stand({ head: { yaw: 0, pitch: 0, roll: 0 } }); bird.doing = 'standing on the ground in the dark';
        return;
      }
      until -= dt; again -= dt;
      if (hopping(dt) || kicking(dt)) return;
      // its mate has been put up close by: it goes up too
      if (home.alarm && home.alarm.by !== bird && home.alarm.at > now.warned && world.clock - home.alarm.at < 0.8 && bird.at.distanceTo(home.alarm.where) < 12) {
        now.warned = home.alarm.at;
        if (a.flush()) return;
      }
      now.wait -= dt; now.peck -= dt; now.look -= dt; now.flick -= dt;
      if (now.peck > 0) {
        // the bill at the ground, picking: the head goes this way and that
        stand({ pitch: g.pitch - 0.16, head: { yaw: 0.3 * Math.sin(now.peck * 23), pitch: -0.85, roll: 0 }, gape: (now.peck * 9) % 1 > 0.7 ? 0.25 : 0 });
        bird.doing = 'picking at the ground';
        return;
      }
      if (now.flick > 0) {
        // the tail spread open and shut, quickly: the white of the outer feathers (the junco)
        stand({ tail: { pitch: gTail + 0.15, fan: way.flash } }); bird.snap = true;
        bird.doing = 'flicking its tail open, a flash of white';
        return;
      }
      if (now.look > 0) { stand(); bird.doing = 'looking about'; return; }
      // the pair is leaving: it goes too (with no way out found, it looks again in a moment)
      if (home.leaving && again <= 0) { if (a.leave(home.leaving.seconds)) return; again = 1; }
      // its mate has moved on along the stretch: after a moment it follows
      // (not past the walker, if they stand between the two)
      if (way.together && home.patch && home.patch.by !== bird && Math.abs(home.patch.s - at.s) > 3.5 && sideOf(home.patch.s) === sideOf(at.s)) {
        if (now.follow == null) now.follow = 0.5 + r() * 2.5;
        now.follow -= dt;
        if (now.follow <= 0 && again <= 0) {
          now.follow = null;
          const one = ground(home.patch.s, 1.5, 1);
          if (one) { until = between(way.stay); land(one, 'following its mate along the trail'); return; }
          again = 1;
        }
      }
      if (now.wait > 0) { stand(); return; }
      if (until < 0 && again <= 0) {
        // a while at this patch: on along the stretch, or up to sing, or (the stretch worked) off
        if (home.count >= home.quota) { if (done()) return; again = 2; }
        else if (singer && r() < way.song.chance) {
          const p = pick(home.posts, way.reach + 4, true);
          if (p) { until = between(way.stay); go(p, 'sing', 'flying up to sing'); return; }
        } else if (r() < way.sit) {
          const p = pick(home.perches, way.reach);
          if (p) { until = between(way.stay); go(p, 'rest', upTo(p)); return; }
        }
        if (again <= 0) {
          // the next patch, a few metres on the way it has been drifting (turned back at the stretch's end)
          // (on the side of the walker it is on: it does not fly low past them)
          let one = ground(at.s + home.drift * (3 + r() * 9), 2.5, 2, sideOf(at.s));
          if (!one) { home.drift = -home.drift; one = ground(at.s + home.drift * (3 + r() * 9), 2.5, 2, sideOf(at.s)); }
          if (one) { home.count += 1; until = between(way.stay); land(one, 'moving on along the trail'); return; }
          again = 1.5;
        }
        until = 2 + r() * 3;
      }
      // what next, here: a few hops, the double scratch, a look about, a flick of the tail, the bill to the ground
      if (now.hops > 0) { now.hops -= 1; if (hop()) return; now.hops = 0; now.wait = 0.2; return; }
      if (now.kicks > 0) { now.kicks -= 1; if (kick()) return; now.kicks = 0; now.peck = 0.4; return; }
      const k = r();
      if (k < way.kick) { now.kicks = Math.round(between(way.kicks)) - 1; if (kick()) return; now.peck = 0.5; return; }
      if (k < way.kick + 0.42) {
        // a run of hops: mostly along the tread, now and then across it; back towards its patch if it has strayed
        now.hops = Math.floor(r() * 4);
        const back = way.together && home.patch ? signed(home.patch.s - at.s) : 0;
        if (Math.abs(back) > 2.5) at.turn = (back > 0 ? 0 : Math.PI) + (r() - 0.5) * 0.5;
        else if (r() < 0.35) at.turn = (r() < 0.5 ? 1 : -1) * (0.6 + r() * 0.9) + (r() < 0.5 ? 0 : Math.PI);
        else if (r() < 0.3) at.turn += Math.PI;
        else at.turn += (r() - 0.5) * 0.6;
        if (Math.abs(at.side) > TREAD * 0.7 && Math.sin(at.turn) * at.side > 0) at.turn = -at.turn;            // (not off the tread's edge)
        if (hop()) return;
        at.turn += Math.PI; now.hops = 0; now.wait = 0.15;
        return;
      }
      if (k < way.kick + 0.42 + way.flick) { now.flick = 0.14 + r() * 0.08; return; }
      if (k < way.kick + 0.42 + way.flick + 0.25) { now.peck = 0.25 + r() * 0.8; return; }
      now.look = 0.4 + r() * 1.2;
      now.head = { yaw: (r() - 0.5) * 2.2, pitch: gHead + 0.1 + r() * 0.3, roll: (r() - 0.5) * 0.3 };
    },
  };

  // ---- on a perch: put up there, or come up to sing, or to sit a while; then back down to its stretch
  const perch = {
    enter(a, p, why = 'rest') {
      at.perch = p;
      Object.assign(a.now, { why, wait: 0.3 + r() * 0.6, spell: why === 'sing' ? 0 : between(way.rest), over: 0, songs: why === 'sing' ? Math.round(between(way.song.songs)) : 0,
        note: 0, gap: 0.6 + r(), calling: 0, ticks: why === 'flushed' ? 1 + Math.floor(r() * 3) : 0, tick: 0.2 + r() * 0.5, look: 0, flick: 0,
        head: { yaw: 0, pitch: 0.05, roll: 0 } });
      if (bird.at.distanceToSquared(p.point) > 0.0025) { bird.at.copy(p.point); seat(p, bird.q); }
    },
    step(a, dt) {
      const now = a.now;
      sense();
      if (world.day < 0.08) { a.to('roost', at.perch); return; }
      now.wait -= dt; now.look -= dt; now.tick -= dt; now.flick -= dt; again -= dt;
      if (now.look < 0) { now.look = 0.3 + r() * 1.3; now.head = { yaw: (r() - 0.5) * 2.4, pitch: (r() - 0.35) * 0.6, roll: (r() - 0.5) * 0.4 }; }
      if (now.note > 0) {
        // a song: the bill open and shut fast, the head up
        now.note -= dt;
        sit({ yaw: now.head.yaw * 0.3, pitch: 0.45, roll: 0 }, { gape: 0.25 + 0.3 * Math.abs(Math.sin(now.note * 26)) });
        bird.doing = way.song.doing;
        return;
      }
      if (now.calling > 0) { now.calling -= dt; sit(now.head, { gape: 0.45 }); bird.doing = way.call.doing; return; }
      sit(now.head);
      if (now.flick > 0) { Object.assign(bird.want, { tail: { ...rest.tail, pitch: (rest.tail.pitch || 0) + 0.15, fan: way.flash } }); bird.snap = true; bird.doing = 'flicking its tail open, a flash of white'; return; }
      // the pair is leaving: it goes too
      if (home.leaving && again <= 0) { if (a.leave(home.leaving.seconds)) return; again = 1; }
      if (now.wait > 0) { bird.doing = perched(); return; }
      // put up, it calls a few times
      if (now.ticks > 0 && now.tick < 0) { now.ticks -= 1; now.tick = between(way.call.every); now.calling = way.call.time; world.say(bird, 'call', way.call.reach); return; }
      if (now.why === 'sing') {
        now.gap -= dt;
        if (now.songs > 0) {
          // (the gap is counted from the song's end: while it sings, this branch is not reached)
          if (now.gap <= 0) { now.songs -= 1; now.note = between(way.song.time); now.gap = between(way.song.gap); world.say(bird, 'song', way.song.reach); return; }
          bird.doing = 'perched between songs';
          return;
        }
      } else {
        now.spell -= dt;
        if (way.flick && r() < dt * 0.15) now.flick = 0.14;
        if (now.spell > 0) { bird.doing = perched(); return; }
      }
      if (again > 0) { bird.doing = perched(); return; }
      // Back down onto its stretch, well clear of the walker, and by its mate if it has one down there. If they are
      // within forty metres: behind a walker who walks on (on the side they have come from: not in front of one who is
      // coming on), and on its own side of one who stands (it does not fly past them to come down; some while later,
      // anywhere). With nowhere to come down, to another perch further off, or off.
      now.over += 1;
      const moving = Math.abs(world.walker.speed || 0) > 0.3 && walkerWay !== 0, far = bird.at.distanceTo(world.eye) > 40;
      const away = far ? 0 : moving ? -walkerWay : sideOf(world.trail.locate(bird.at.x, bird.at.z)[1]);
      const mate = way.together && home.patch && home.patch.by !== bird ? ground(home.patch.s, 2, 6, away) : null;
      const one = mate || ground(null, Infinity, 6, away) || (!moving && now.over > 4 ? ground(null, Infinity, 6) : null);
      if (one) { until = between(way.stay); land(one, 'dropping back down to the trail'); return; }
      if (now.over > 2 && r() < 0.5) { const p = pick(home.perches, way.reach + 6); if (p) { go(p, 'rest', 'flying to another perch'); return; } }
      if (now.over > 5 && done()) return;
      again = 1.2 + r() * 1.5;
      bird.doing = perched();
    },
  };

  const roost = {
    wary: false,
    enter(a, p) { at.perch = p; if (bird.at.distanceToSquared(p.point) > 0.0025) { bird.at.copy(p.point); seat(p, bird.q); } },
    step(a) {
      if (world.day >= 0.08) { a.to('perch', at.perch, 'rest'); return; }
      sit({ yaw: 0, pitch: 0.02, roll: 0 }, { pitch: rest.pitch + 0.08, droop: 0.05 });
      bird.doing = 'roosting';
    },
  };

  // Every flight is the skeleton's (agents.js `flying`), with the tail spread as this kind spreads it in flight (the
  // junco's white outer feathers show), and pumped up and down if it pumps it (the Song Sparrow). (`flying` sets the
  // whole pose afresh each frame, so this is laid over it after.)
  const fly = {
    wary: false,
    step(a, dt) {
      flying(bird, dt, way.hz);
      if (a.name !== 'fly' || !bird.flight) return;
      const tail = bird.want.tail;
      tail.fan = Math.max(tail.fan || 0, way.flash);
      if (way.pump) tail.pitch = (tail.pitch || 0) + way.pump * Math.sin(world.clock * 17);
    },
  };

  // Off out of sight: as every bird goes (life/behave.js), calling if the walker put it up.
  const away = a.leave;
  return {
    activities: { forage, perch, roost, fly },
    leave: (seconds) => {
      const startled = a.startled();
      if (!away(seconds)) return false;
      if (startled) world.say(bird, 'call', way.call.reach);
      // (a pair goes together: when one goes, put up or with its stretch worked, its mate goes too)
      if (way.together && !home.leaving) home.leaving = { seconds };
      return true;
    },
    // Put up: into the nearest tree clear of the walker and further from them than it is (a low bough or the stub of a
    // limb, at least 1.2 m up; a log's back or a stump's top only if there is none), the further from the walk the
    // better (up to the distance a runner would put it up from), calling; a pair's mate is warned.
    refuge() {
      const off = bird.at.distanceTo(world.eye), run = way.flush * 1.9 + 1;
      let best = null, most = -Infinity;
      for (const pass of [true, false]) {
        for (const p of home.perches) {
          if (p === at.perch || (pass && (p.h < 1.2 || (p.kind !== 'bough' && p.kind !== 'stub')))) continue;
          const d = p.point.distanceTo(bird.at);
          if (d > way.reach + 4 || p.point.distanceTo(world.eye) <= off || !a.clear(p.point, 1.5) || !world.free(p.point, bird, 0.4)) continue;
          const score = Math.min(p.off, run) - 0.3 * d + 1.5 * r() - (world.blocked(bird.at, p.point) ? 3 : 0);
          if (score > most) { most = score; best = p; }
        }
        if (best) break;
      }
      if (!best) return false;
      if (way.together) home.alarm = { at: world.clock, by: bird, where: bird.at.clone() };
      world.say(bird, 'call', way.call.reach);
      return go(best, 'flushed', upTo(best));
    },
    // Where it is when it comes: on its stretch of the tread (by its mate, if it has one there), clear of the walker,
    // flying in if they could see it be there from nowhere; by night, at roost by its stretch, if there is a perch free
    // and the walker could not see it be there from nowhere (else it comes a while later). A leaving that is over is over.
    begin() {
      if (home.leaving) { home.leaving = null; home.count = 0; home.quota = quota(); }
      if (world.day < 0.08) {
        bird.at.set(home.x, world.height(home.x, home.z), home.z);
        const p = roosting(true);
        if (!p || (!a.life.first && world.plain(p.point, bird.size))) { bird.left = 30 + r() * 60; return; }
        a.to('roost', p);
        return;
      }
      const one = (way.together && home.patch ? ground(home.patch.s, 1.5, 1) : null) || ground(null, Infinity, 1);
      if (!one) { bird.left = 6 + r() * 10; return; }
      at.turn = r() < 0.5 ? 0 : Math.PI;
      a.to('forage', one, 0.5);
      if (way.together && !home.patch) home.patch = { s: one.s, side: one.side, by: bird };
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0, floor: world.height }, 'forage', one, 0.6)) bird.left = 4 + r() * 8;
      }
    },
  };
}

export default {
  // what a scratcher's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    air: nums(2),                                   // how open the air over its stretch of the walk may be (0 under the old terrace's trees, 1 on the river's bank)
    thicket: 'number',                              // within this many metres of the creek, the river's water or (half of it) the old clearing's edge; 0: anywhere
    stretch: 'number',                              // the metres of the walk's tread it feeds along
    apart: 'number',                                // no nearer than this (m) to another home of its kind
    reach: 'number', high: 'number',                // how far from its stretch (m) its perches are, and how high over the ground at most (m)
    stay: nums(2),                                  // seconds at one patch of the tread before it moves on
    patches: nums(2),                               // how many patches it works before it goes
    sit: 'number',                                  // the chance it goes up to sit a while, when it has done with a patch
    rest: nums(2),                                  // seconds it sits up there (and when it has been put up) before it comes down
    hop: nums(2),                                   // a hop's length (m)
    kick: 'number', kicks: nums(2),                 // the chance a bout is the double scratch, and how many scratches to a bout
    flick: 'number',                                // the chance a pause is a flick of the tail
    flash: 'number', pump: 'number',                // how far its tail is spread in flight (and in a flick); how far it pumps it in flight (radians)
    hopping: 'string', perched: 'string',           // what it is doing, in the card's words, as it hops and as it sits
    call: { every: nums(2), time: 'number', reach: 'number', doing: 'string' },              // its call (seconds between them when it has been put up)
    song: optional({ chance: 'number', songs: nums(2), time: nums(2), gap: nums(2), reach: 'number', high: nums(2), doing: 'string' }),
  },
  act: (way) => (bird, world) => live(bird, world, way, scratcher),
  // A stretch of the walk's tread `stretch` metres long whose air is as open as the kind likes (and near its cover),
  // with tread enough on the ground for it, perches beside it (and posts to sing from, for a kind that sings), and no
  // other home of its kind within `apart`.
  home: (way) => (habitat, r, taken = []) => {
    const half = way.stretch / 2, mid = new THREE.Vector3(), p = new THREE.Vector3();
    for (let tries = 0; tries < 40; tries += 1) {
      const s = r() * habitat.length, air = habitat.airAt(s);
      if (air < way.air[0] || air > way.air[1]) continue;
      habitat.beside(s, 0, mid);
      if (taken.some((h) => h && Math.hypot(h.x - mid.x, h.z - mid.z) < way.apart)) continue;
      if (way.thicket > 0 && !thicketNear(mid.x, mid.z, way.thicket)) continue;
      const n = Math.round(way.stretch / BIN) + 1, ok = new Uint8Array(n);
      let fit = 0;
      for (let i = 0; i < n; i += 1) {
        const there = habitat.airAt(s - half + i * BIN);
        if (there >= way.air[0] - 0.15 && there <= way.air[1] + 0.15 && across(habitat, s - half + i * BIN, p)) { ok[i] = 1; fit += 1; }
      }
      if (fit < n * 0.5) continue;
      const perches = perchesBy(habitat, s - half, way.stretch, way.reach, way.high, r);
      if (perches.length < 3) continue;
      const posts = way.song ? perches.filter((one) => one.h >= way.song.high[0] && one.h <= way.song.high[1]) : [];
      if (way.song && !posts.length) continue;
      return { x: mid.x, z: mid.z, s, from: s - half, ok, perches, posts, patch: null, count: 0, quota: Math.round(way.patches[0] + r() * (way.patches[1] - way.patches[0])),
        leaving: null, alarm: null, drift: r() < 0.5 ? 1 : -1 };
    }
    return null;
  },
};
