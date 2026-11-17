import * as THREE from 'three';
import { mulberry32 } from '../../world/layout.js';
import { flying, frame, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';
import { territory, FLOWERS, diveAt, hookAt, climbAt } from '../places/hummingbird.js';

// Hummingbirds: the Rufous. Each is one of a visit's own, with a home (`bird.home`, life/places/hummingbird.js
// `territory`): a patch of flowers near the walk (salmonberry, the old apple tree, red elderberry), the bare twigs at the
// tops of its shrubs and the boughs round it, and for some a female hidden low in a salmonberry, with open air over
// her. What it does there: it sits on a twig at a shrub's top and looks about; it goes the round of its flowers,
// hovering at each with its bill in it, backing off and darting to the next; it flies out after small insects and
// hovers among them; it chases off another hummingbird that comes to its flowers; a male with a female in his thicket
// shuttles in front of her and then climbs high and dives past her in a long J, again and again; by night it is at
// roost on its twig; and after a spell it goes. The hum of its wings is heard by a walker near it, and the dive's note
// from far off (sound/hummingbird.js).
//
// What is from the sources the species' sheet names, and the research file: wings beat 52 times a second hovering, 62
// at the greatest load, through 163 degrees (Birds of the World, Healy and Calder 2020, after Chai and Millard 1997);
// the hum is the wingbeat's own rate, 35 to 100 Hz; it feeds on salmonberry and takes small insects on the wing (BirdWeb;
// Wikipedia); it is highly territorial and keeps its flowers (Healy and Calder 2020; BirdWeb); its display (Myers,
// Rankin, Burns and Clark 2019, The Auk 136: ukz049, Table 1 and Figure 1; and their k-mer paper on the same birds): a
// shuttle "within 1-2 m of female"; a half pendulum, "short ascent, concluding with writhing; 2-3 m high, 2-4 m wide.
// Nearly always follows a shuttle display"; and the dive, "~20 m high, 15 m wide": a long ascent, a turn, a long
// descent "tracing similar path as ascent", the tail spread near its end to make the dive's sound, and "a slight
// ascent with writhing" (the tail flipped up and down while the wings chirrup); "an average of 4 consecutive dives in a
// bout". The agent's own: every distance, time, speed and chance here (how long it sips, how many flowers in a round,
// how long it sits, how fast it darts and dives, how near the walker may come), that an intruder is one of its own
// party, and how the wing is drawn (below).
//
// The wings. A beat of 52 a second is nearly one beat to each frame at 60: drawn as it is, the wing would alias into a
// slow flap, or stand still. So each step the wing is put on the other side of its stroke from where it was, at a point
// of that half drawn at random, most often near its end, where a wing that swings as a pendulum spends most of its
// time: on the screen the two wings are a blur over the arc they sweep, as a hummingbird's are to the eye. Slowed down
// (forest.html?slow=0.1), where a step is a small part of a beat, the beat is drawn as it is. Hovering, the stroke is
// level with the ground, forward and back, whatever the body's tilt (the rig's flap and sweep are worked out from it);
// in flight it beats up and down; diving the wings are drawn in. Which point of the stroke a step falls on is drawn from
// numbers of its own (not the bird's), so that nothing else it does depends on how many frames there are.
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly near it,
// and then darts to a twig or a flower of its own clear of them, or off. It lets a walker come close: it is fearless,
// and goes about its flowers a couple of metres from them.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const TAU = Math.PI * 2;
// Where the tip of the bill is in the hover pose, from the bird's origin (+x the way it faces, +y up): measured on the
// built bird (scratch/probe_tip.js in the agent's copy: 31.1 mm ahead and 11.1 mm up), so that hovering at a flower
// its bill is in the flower.
const TIP = new THREE.Vector3(0.0311, 0.0111, 0);
const GRAVITY = 11;               // how hard it dives: m/s² down the J (the agent's: a little more than falling)
const JINK = 2.5;                 // m/s: how fast a jink after an insect carries it (the agent's: a jink of 0.33 m laid in one step was over 20 m/s)
const ROOM = 0.45;                // m: it does not move to within this of another animal (the agent's; the count of walks asks for 0.12)

// A path: points at even steps of its own parameter, and how far along each lies.
function pathOf(fn, n = 48) {
  const pts = [], len = [0];
  for (let i = 0; i <= n; i += 1) pts.push(fn(i / n, new THREE.Vector3()));
  for (let i = 1; i <= n; i += 1) len.push(len[i - 1] + pts[i].distanceTo(pts[i - 1]));
  return { pts, len, total: len[n] };
}
// the point `s` metres along a path, and the way it runs there
function along(path, s, out, way) {
  const L = path.len;
  let k = 0;
  while (k < L.length - 2 && L[k + 1] < s) k += 1;
  const f = clamp((s - L[k]) / Math.max(L[k + 1] - L[k], 1e-9), 0, 1);
  out.copy(path.pts[k]).lerp(path.pts[k + 1], f);
  if (way) way.subVectors(path.pts[k + 1], path.pts[k]).normalize();
  return out;
}

function hoverer(a) {
  const { bird, world, way, r } = a, home = bird.home;               // home: life/places/hummingbird.js `territory`
  const strobe = mulberry32((bird.seed ^ 0x5bd1e995) >>> 0);
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  const perched = bird.sheet.poses.perched, hovering = bird.sheet.poses.hover;
  const HALF = (way.stroke / 2) * (Math.PI / 180);
  const q = new THREE.Quaternion(), f = new THREE.Vector3(), v = new THREE.Vector3(), w = new THREE.Vector3(), spot = new THREE.Vector3();
  const TUCK = { mode: 'tuck' };

  // ---- what it keeps across its activities: where it is, how long its spell has left, when it next looks for an
  // intruder, displays or chips; how many flowers are left in this round
  const at = { post: null, flower: null };
  let spell = between(way.spell), again = 0, notice = between(way.chase.notice), shows = between(way.display.every) * (0.3 + 0.7 * r());
  let round = 0, hum = 0, chips = between(way.call.every), nowhere = -1;
  // how it holds itself, eased here: the page eases nothing of a bird whose wings are drawn as they are (`snap`)
  const held = { pitch: perched.pitch, lift: perched.lift, headYaw: 0, headPitch: 0.1, tailPitch: perched.tail.pitch, tailFan: perched.tail.fan, gape: 0, roll: 0 };
  const ease = (dt, want, rate = 10) => { const k = 1 - Math.exp(-rate * dt); for (const name of Object.keys(want)) held[name] += (want[name] - held[name]) * k; };

  // ---- the wings (see the head of this file)
  const wings = { phase: 0, half: 0 };
  const beat = (dt) => {
    const advance = TAU * way.hz * dt;
    if (advance > 0 && advance < 1.2) wings.phase = (wings.phase + advance) % TAU;
    else if (advance > 0) { wings.half ^= 1; wings.phase = (wings.half + 0.06 + 0.88 * strobe()) * Math.PI; }
    return wings.phase;
  };
  const lay = (mode, dt) => {
    if (mode === 'fold') return { spread: 0, flap: 0, hand: 0, sweep: 0 };
    const phi = beat(dt), s = Math.sin(phi), c = Math.cos(phi);
    if (mode === 'hover') {
      // a stroke level with the ground: the wing `psi` forward of straight out, a little raised, seen from a body
      // pitched up by `th`, is a flap (up from the body's own level) and a sweep (back from straight out)
      const psi = s * HALF, e = 0.12 + 0.06 * c, th = held.pitch;
      const xb = Math.sin(psi) * Math.cos(e) * Math.cos(th) + Math.sin(e) * Math.sin(th);
      const yb = -Math.sin(psi) * Math.cos(e) * Math.sin(th) + Math.sin(e) * Math.cos(th);
      const zb = Math.cos(psi) * Math.cos(e);
      return { spread: 1, flap: Math.asin(clamp(yb, -1, 1)), sweep: Math.atan2(-xb, zb), hand: 0.06 };
    }
    if (mode === 'tuck') return { spread: 0.35, flap: 0.1 + 0.15 * s, sweep: 0.55, hand: 0.1 };
    return { spread: 1, flap: 0.12 + 0.85 * s, sweep: 0.05 - 0.25 * s, hand: 0.15 * s };       // in flight
  };
  const wear = (wing, feet = TUCK) => {
    Object.assign(bird.want, { pitch: held.pitch, lift: held.lift, lean: 0, roll: held.roll, spread: wing.spread, flap: wing.flap, hand: wing.hand, sweep: wing.sweep, droop: 0.05, gape: held.gape,
      head: { yaw: held.headYaw, pitch: held.headPitch, roll: 0 }, tail: { pitch: held.tailPitch, fan: held.tailFan, prop: null }, feet });
    bird.snap = true;
  };
  const grip = () => ({ mode: 'grip', round: Math.max(0.002, at.post && at.post.radius ? at.post.radius : 0.004) });

  // ---- what it says: the hum of its wings, to a walker near it, about once a second; and its chips (silent: no
  // recording with a licence that could be used was found)
  const humming = (dt) => {
    hum -= dt;
    if (hum > 0) return;
    hum = way.hum.every;
    if (bird.at.distanceTo(world.eye) < way.hum.reach) world.say(bird, 'hum', way.hum.reach, way.hum.every + 0.15);
  };
  const chip = (dt) => { chips -= dt; if (chips > 0) return; chips = between(way.call.every); world.say(bird, 'call', way.call.reach); };

  // ---- places
  // where it hovers to put its bill in a flower, facing into it
  const hoverAt = (flower, outAt, outQ) => {
    f.copy(flower.out).setY(0);
    if (f.lengthSq() < 1e-6) f.set(1, 0, 0);
    f.normalize().negate();
    outAt.copy(flower.at).addScaledVector(f, -TIP.x).addScaledVector(UP, -TIP.y);
    if (outQ) frame(f, UP, outQ);
    return outAt;
  };
  // a flower to go to next: not the one it is at, free, not right by the walker (it comes close), within `reach` of
  // `from`; a richer one and a nearer one first
  const nextFlower = (from, reach) => {
    let best = null, score = -Infinity;
    for (const flower of home.flowers) {
      const d = flower.at.distanceTo(from);
      if (d > reach || d < 0.1 || flower === at.flower) continue;
      if (!world.free(flower.at, bird, 0.35) || !a.clear(flower.at, 0.4)) continue;
      const s = flower.worth * (0.6 + r()) - d * 0.12;
      if (s > score) { score = s; best = flower; }
    }
    return best;
  };
  // how it sits on a twig: facing out of the shrub, or across a bough
  const facing = (post, out) => {
    if (post.out) { f.copy(post.out).applyAxisAngle(UP, (r() - 0.5) * 1.6); return frame(f, UP, out); }
    if (post.along && Math.abs(post.along.y) < 0.8) { f.crossVectors(post.along, UP); if (r() < 0.5) f.negate(); return frame(f, UP, out); }
    const th = r() * TAU;
    return frame(f.set(Math.cos(th), 0, Math.sin(th)), UP, out);
  };
  // a twig or bough to go to: free, clear of the walker, within `reach`; one the walker has no trunk in front of first,
  // and a bare twig at a shrub's top, in the open, before a bough among a tree's needles two times in three
  const pickPost = (reach = Infinity) => {
    const all = home.perches.filter((one) => one !== at.post && one.point.distanceTo(bird.at) < reach && world.free(one.point, bird, 0.3) && a.clear(one.point));
    const open = all.filter((one) => !world.blocked(world.eye, one.point)), some = open.length ? open : all;
    const twigs = some.filter((one) => one.kind === 'twig'), from = twigs.length && r() < 0.67 ? twigs : some;
    return from.length ? from[Math.floor(r() * from.length)] : null;
  };
  // the flights it makes of its own accord: a dart to a flower, onto a twig, out into the air
  const flown = () => { bird.aloft = a.name !== 'perch' && a.name !== 'roost'; };
  const dartTo = (flower, doing) => {
    hoverAt(flower, spot, q);
    flown();
    a.fly({ at: spot.clone(), q: q.clone(), out: flower.out, rise: 0.05, floor: world.height, speed: way.dart }, 'hover', flower);
    bird.doing = doing || 'darting to the next flower';
    return true;
  };
  const goPerch = (post, doing) => {
    flown();
    a.fly({ at: post.point.clone(), q: facing(post, q).clone(), rise: 0.15, floor: world.height, speed: way.dart }, 'perch', post);
    bird.doing = doing || 'flying up to a bare twig';
    return true;
  };
  // after a round of flowers, a chase or a display: up onto a twig, or the next flower, or off
  const settle = () => {
    if (spell < 0 && a.leave(r() < way.gone ? Infinity : a.awhile())) return true;
    const post = pickPost(way.range * 2);
    if (post) return goPerch(post);
    const flower = nextFlower(bird.at, way.range * 2);
    if (flower) { round = Math.round(between(way.visits)); return dartTo(flower); }
    return a.leave(a.awhile());
  };

  // ---- the patch is its, or another's (two of a party share one home: the first to come holds it)
  const holds = () => {
    const h = home.holder;
    if (h === bird) return true;
    if (!h || h.left != null || h.state === 'gone' || h.fleeing) { home.holder = bird; return true; }
    return false;
  };
  const _others = [];
  const intruder = () => {
    for (const b of world.others(home.x, home.z, way.range * 1.3, bird, _others)) {
      if (b.key === bird.key && b.left == null && !b.fleeing && b.state !== 'gone' && b.state !== 'roost') return b;
    }
    return null;
  };
  // the holder, a moment after another has come to its flowers, is off after it
  const guard = (dt) => {
    if (!holds()) return false;
    const other = intruder();
    if (!other) { notice = between(way.chase.notice); return false; }
    notice -= dt;
    if (notice > 0) return false;
    notice = between(way.chase.notice);
    return a.to('chase', other);
  };
  // the intruder, chased: off, for a while or for good; with nowhere out of sight to go, on with what it was doing
  const chased = () => {
    if (!bird.chasedBy || world.clock - bird.chasedAt > 0.6 || world.clock < nowhere) return false;
    bird.chasedBy = null;
    bird.fleeing = true;
    flown();
    if (a.leave(r() < way.chase.away ? Infinity : a.awhile())) { bird.doing = 'chased off by the hummingbird whose flowers these are'; return true; }
    bird.fleeing = false;
    nowhere = world.clock + 0.7;                    // (the search is not a light one: not again in every frame)
    return false;
  };

  // ---- on a twig
  const perch = {
    enter(a, post, wait) {
      at.post = post; at.flower = null; bird.aloft = false;
      Object.assign(a.now, { sit: wait ?? between(way.sit), look: 0, head: { yaw: 0, pitch: 0.1 }, flick: 0 });
      if (bird.at.distanceToSquared(post.point) > 0.0025) { bird.at.copy(post.point); facing(post, bird.q); }
      wear(lay('fold', 0), grip());
    },
    step(a, dt) {
      if (chased()) return;
      if (world.day < 0.08) { a.to('roost', at.post); return; }
      const now = a.now;
      spell -= dt; now.sit -= dt; now.look -= dt; now.flick -= dt; again -= dt; shows -= dt;
      // it turns its head this way and that, quickly, and now and then flicks its tail
      if (now.look < 0) { now.look = 0.25 + r() * 0.9; now.head = { yaw: (r() - 0.5) * 2.6, pitch: -0.05 + r() * 0.35 }; }
      const flick = now.flick > 0 ? 0.35 : 0;
      if (now.flick < -2 && r() < 0.01) now.flick = 0.12;
      ease(dt, { pitch: perched.pitch, lift: perched.lift, tailPitch: perched.tail.pitch + flick, tailFan: perched.tail.fan + flick * 0.6, gape: 0, roll: 0 }, 10);
      ease(dt, { headYaw: now.head.yaw, headPitch: now.head.pitch }, 28);
      wear(lay('fold', dt), grip());
      bird.doing = at.post.kind === 'twig' ? way.watching : 'perched on a bough near its flowers, watching over them';
      chip(dt);
      if (guard(dt)) return;
      if (spell < 0 && again <= 0) {
        if (a.leave(r() < way.gone ? Infinity : a.awhile())) return;
        again = 1.5;
      }
      if (now.sit > 0) return;
      now.sit = 0.6 + r();
      // what next: a display before the female in his thicket, a sally after insects, or a round of the flowers
      if (shows < 0 && home.female && world.day > 0.3 && holds()) {
        shows = between(way.display.every);
        if (show()) return;
      }
      if (r() < way.hawk.chance && sally()) return;
      const flower = nextFlower(bird.at, way.range * 1.6);
      if (flower) { round = Math.round(between(way.visits)); dartTo(flower, 'darting down to its flowers'); return; }
      const post = pickPost(way.range);
      if (post) goPerch(post, 'moving to another twig');
    },
  };

  // ---- hovering: at a flower, its bill in it; or among small insects in the air, darting at them
  const hover = {
    enter(a, flower) {
      const now = a.now;
      at.flower = flower; at.post = null; bird.aloft = true;
      Object.assign(now, { flower, time: flower ? between(way.sip) : between(way.hawk.time), back: 0, backed: false, jink: 0, snap: 0, t: r() * 6, base: new THREE.Vector3(), to: null, dark: 0 });
      if (flower) {
        hoverAt(flower, now.base, q);
        if (bird.at.distanceToSquared(now.base) > 0.0004) { bird.at.copy(now.base); bird.q.copy(q); }
      } else now.base.copy(bird.at);
      wear(lay('hover', 0));
    },
    step(a, dt) {
      if (chased()) return;
      const now = a.now;
      spell -= dt; now.time -= dt; now.t += dt; now.jink -= dt; now.snap -= dt; shows -= dt;
      // (night has come while it hovers: to a twig, looked for now and then and not in every step while there is none)
      if (world.day < 0.08) {
        now.dark -= dt;
        if (now.dark <= 0) { now.dark = 1.5; const post = pickPost(); if (post) { goPerch(post, 'off to its twig for the night'); return; } }
      }
      if (guard(dt)) return;
      if (now.back > 0) {
        // backing off from the flower, a hand's breadth and more, before it goes on (and not into another animal)
        now.back -= dt;
        f.copy(now.flower.out).setY(0);
        if (f.lengthSq() > 1e-6) {
          spot.copy(now.base).addScaledVector(f.normalize(), dt * 1.2);
          if (world.crowd(spot, bird) < ROOM) now.back = 0; else now.base.copy(spot);
        }
      } else if (!now.flower) {
        if (now.jink < 0) {
          // after insects: a jink of a few centimetres to a few decimetres this way or that, and a snap of the bill
          now.jink = 0.16 + r() * 0.3; now.snap = 0.08;
          const th = r() * TAU, d = 0.08 + r() * 0.25;
          spot.set(now.base.x + Math.cos(th) * d, now.base.y + (r() - 0.45) * 0.2, now.base.z + Math.sin(th) * d);
          spot.y = Math.max(spot.y, world.height(spot.x, spot.z) + 0.8);
          frame(f.set(Math.cos(th + (r() - 0.5)), 0, Math.sin(th + (r() - 0.5))), UP, bird.q);
          // (not to where another animal is: it stays where it is for this one)
          now.to = world.crowd(spot, bird) < ROOM ? null : spot.clone();
        }
        // it is carried there at a pace, not set there in one step
        if (now.to) {
          const d = now.base.distanceTo(now.to), go = Math.min(d, JINK * dt);
          if (d > 1e-4) now.base.addScaledVector(v.subVectors(now.to, now.base), go / d);
          if (d - go < 1e-4) now.to = null;
        }
      }
      // it hangs in the air, bobbing a little, its tail pumping
      bird.at.copy(now.base);
      bird.at.y += 0.004 * Math.sin(now.t * 19);
      bird.at.x += 0.003 * Math.sin(now.t * 7.3); bird.at.z += 0.003 * Math.cos(now.t * 6.1);
      ease(dt, { pitch: hovering.pitch, lift: hovering.lift, tailPitch: hovering.tail.pitch + 0.14 * Math.sin(now.t * 13), tailFan: hovering.tail.fan, gape: now.snap > 0 ? 0.6 : 0, roll: 0 }, 12);
      ease(dt, { headYaw: 0, headPitch: hovering.head.pitch }, 20);
      wear(lay('hover', dt));
      humming(dt);
      bird.doing = now.back > 0 ? 'backing off from the flower' : now.flower ? FLOWERS[now.flower.plant.kind].doing : 'catching small insects in the air';
      if (now.time > 0 || now.back > 0) return;
      if (now.flower && !now.backed && r() < way.backOff) { now.backed = true; now.back = 0.2 + r() * 0.15; return; }
      // on to the next flower of the round, or up onto a twig
      round -= 1;
      if (now.flower && round > 0 && spell >= 0) {
        const flower = nextFlower(bird.at, 2.5) || nextFlower(bird.at, 7);
        if (flower) { dartTo(flower); return; }
      }
      if (!settle()) now.time = 0.4;
    },
  };

  // out after insects from its twig: to a point in the air near by, clear of the walker and of trunks
  const sally = () => {
    for (let tries = 0; tries < 6; tries += 1) {
      const th = r() * TAU, d = between(way.hawk.reach);
      spot.set(bird.at.x + Math.cos(th) * d, bird.at.y + (r() - 0.3) * 1.5, bird.at.z + Math.sin(th) * d);
      if (spot.y - world.height(spot.x, spot.z) < 1 || !a.clear(spot, 1.5) || world.blocked(bird.at, spot) || world.crowd(spot, bird) < 0.8) continue;
      frame(v.subVectors(spot, bird.at).setY(0), UP, q);
      flown();
      a.fly({ at: spot.clone(), q: q.clone(), rise: 0, floor: world.height, speed: way.dart }, 'hover', null);
      bird.doing = 'flying out after small insects';
      return true;
    }
    return false;
  };

  // ---- a chase: after the other, a body's length and more behind it, until it is off the patch, gone, or the
  // holder has had enough; then back to a twig
  const chase = {
    wary: false,
    enter(a, other) {
      Object.assign(a.now, { other, time: between(way.chase.time), t: 0, again: 0 });
      other.chasedBy = bird; other.chasedAt = world.clock;
      bird.aloft = true;
      world.say(bird, 'call', way.call.reach);
      wear(lay('fly', 0));
    },
    step(a, dt) {
      const now = a.now, other = now.other;
      now.time -= dt; now.t += dt; now.again -= dt;
      // (it keeps the other on the move: the chase is felt as long as it lasts)
      if (other.left == null && !other.fleeing) { other.chasedBy = bird; other.chasedAt = world.clock; }
      const off = other.left != null || other.state === 'gone' || Math.hypot(other.at.x - home.x, other.at.z - home.z) > way.range * 1.8;
      // (over: to a twig, a flower or off; with none of them found it looks again in a moment, not in every step)
      if (now.time < 0 || off) { if (now.again <= 0 && !settle()) now.again = 0.3; return; }
      v.subVectors(other.at, bird.at);
      const d = v.length(), go = Math.min(way.chase.speed * dt, Math.max(0, d - 1.1));
      if (d > 1e-4) {
        // (not into another animal, the one it chases or any other: it holds where it is for that step, unless the
        // step takes it further from whatever is near)
        spot.copy(bird.at).addScaledVector(v, go / d);
        spot.y = Math.max(spot.y, world.height(spot.x, spot.z) + 0.5);
        const near = world.crowd(spot, bird);
        if (near >= ROOM || near > world.crowd(bird.at, bird)) bird.at.copy(spot);
      }
      if (v.setY(0).lengthSq() > 1e-6) frame(v, UP, bird.q);
      ease(dt, { pitch: 0.15, lift: 0.6, tailPitch: 0.05, tailFan: 0.3, gape: 0, roll: 0, headYaw: 0, headPitch: 0 }, 12);
      wear(lay('fly', dt));
      humming(dt);
      bird.doing = 'chasing another hummingbird off its flowers';
    },
  };

  // ---- the male's display before the female in his thicket (the places: life/places/hummingbird.js `stage`)
  const show = () => {
    const stage = home.female;
    w.copy(stage.bottom); w.y = Math.max(stage.at.y + 0.35, world.height(w.x, w.z) + 0.7);
    if (!a.clear(w, 1) || !world.free(w, bird, 0.6) || world.crowd(w, bird) < 1) return false;
    frame(f.subVectors(stage.at, w).setY(0), UP, q);
    flown();
    a.fly({ at: w.clone(), q: q.clone(), rise: 0.2, floor: world.height, speed: way.dart }, 'display', stage);
    bird.doing = 'darting down to a female hidden in the salmonberry';
    return true;
  };
  // The lines of it are the stage's own (life/places/hummingbird.js `diveAt`, `hookAt`, `climbAt`), tried there against
  // trunks, crowns and the territory's flowers before the stage was given, at the height the stage gives (`high`).
  // What the stage cannot know is tried here as it goes (`barred`): another animal where the next quarter of a second
  // takes it, and, before each climb and all the way down each dive, the walker or another animal at the J's bottom.
  // Then it breaks the display off, to a twig or a flower (`settle`).
  const display = {
    // Whenever it is low and slow it is where a walker could put it up, as it is at anything else: in front of her,
    // swinging up, pulling out of a dive and hovering after it, and as it starts its climb. Only turning at the top
    // and diving is it on the wing as a bird in flight is. (It was wary in the shuttle alone, and after that dived
    // again and again past a walker who had come to stand at the J's bottom.)
    wary: (a) => a.now.phase !== 'turn' && a.now.phase !== 'dive',
    enter(a, stage) {
      const now = a.now, D = way.display, B = stage.bottom, u = stage.u;
      Object.assign(now, { stage, phase: '', t: 0, s: 0, v: 0, time: 0, dives: Math.max(1, Math.round(between(D.dives))), said: false, path: null,
        H: stage.high, W: D.wide, centre: bird.at.clone(), heading: new THREE.Vector3(), flip: 0 });
      now.J = pathOf((t, out) => diveAt(B, u, now.H, now.W, t, out));
      now.hook = pathOf((t, out) => hookAt(B, u, t, out), 12);
      bird.aloft = true;
      phase(now, r() < D.shuttle ? 'shuttle' : 'climb');
      wear(lay('hover', 0));
    },
    step(a, dt) {
      const now = a.now, D = way.display, stage = now.stage, u = stage.u;
      now.t += dt;
      // (something in its way: it breaks off; with nowhere to go it hovers where it is, and looks again in a moment)
      if (barred(now, dt)) {
        if (settle()) return;
        if (now.phase !== 'writhe') { now.dives = 0; phase(now, 'writhe'); }
      }
      let mode = 'hover', doing = '';
      if (now.phase === 'shuttle') {
        // back and forth in front of her, bouncing, within a metre
        bird.at.copy(now.centre).addScaledVector(u, 0.5 * Math.sin(now.t * TAU * 1.2)).addScaledVector(UP, 0.15 * Math.abs(Math.sin(now.t * TAU * 2.4)));
        if (f.subVectors(stage.at, bird.at).setY(0).lengthSq() > 1e-6) frame(f, UP, bird.q);
        ease(dt, { pitch: hovering.pitch, lift: hovering.lift, tailPitch: hovering.tail.pitch, tailFan: 0.6, headYaw: 0, headPitch: 0, gape: 0, roll: 0 }, 12);
        humming(dt);
        doing = 'flying back and forth in front of a female hidden in the salmonberry';
        if (now.t > now.time) phase(now, 'pendulum');
      } else if (now.phase === 'pendulum' || now.phase === 'climb') {
        // up: a short half-U, or the long ascent to the top of the dive, along a path flown at its pace
        now.s = Math.min(now.path.total, now.s + now.v * dt);
        along(now.path, now.s, bird.at, v);
        heading(v, dt);
        ease(dt, { pitch: clamp(Math.asin(clamp(v.y, -1, 1)) * 0.9, -1.4, 1.4), lift: 0.6, tailPitch: 0, tailFan: 0.15, headPitch: clamp(Math.asin(clamp(v.y, -1, 1)) * 0.6, -1.2, 1.2), headYaw: 0, gape: 0, roll: 0 }, 9);
        mode = 'fly';
        doing = now.phase === 'climb' ? 'climbing high for a display dive' : 'swinging up from in front of her';
        if (now.phase === 'pendulum' && now.s > now.path.total * 0.6) writhe(dt);
        if (now.s >= now.path.total) phase(now, now.phase === 'pendulum' ? 'climb' : 'turn');
      } else if (now.phase === 'turn') {
        // at the top: it turns round and tips over into the dive
        frame(f.copy(now.heading).applyAxisAngle(UP, Math.PI * clamp(now.t / 0.4, 0, 1)), UP, bird.q);
        ease(dt, { pitch: -1.35, lift: 0.6, tailPitch: 0, tailFan: 0.1, headPitch: -1.1, headYaw: 0, gape: 0, roll: 0 }, 8);
        doing = 'turning at the top of its climb';
        if (now.t >= 0.4) phase(now, 'dive');
      } else if (now.phase === 'dive') {
        // down the J, faster and faster, and at its bottom past her with its tail spread
        const p = now.s / now.J.total, drop = now.J.pts[0].y - bird.at.y;
        now.v = Math.min(D.peak, Math.sqrt(2.5 * 2.5 + 2 * GRAVITY * Math.max(0, drop)));
        now.s = Math.min(now.J.total, now.s + now.v * dt);
        along(now.J, now.s, bird.at, v);
        frame(u, UP, bird.q);
        const spread = clamp((p - 0.72) / 0.12, 0, 1);
        ease(dt, { pitch: clamp(Math.asin(clamp(v.y, -1, 1)), -1.5, 0.3), lift: 0.6, tailPitch: 0, tailFan: 0.08 + 0.85 * spread, headPitch: clamp(Math.asin(clamp(v.y, -1, 1)) * 0.85, -1.3, 0.3), headYaw: 0, gape: 0, roll: 0 }, 16);
        mode = p < 0.7 ? 'tuck' : 'hover';
        if (!now.said && p > 0.8) { now.said = true; world.say(bird, 'dive', way.dive.reach); }
        doing = 'diving in a long J past a female hidden low in the thicket';
        if (now.s >= now.J.total) phase(now, 'hook');
      } else if (now.phase === 'hook') {
        // out of the dive and up a little, flicking its tail up and down, its wings chirruping
        now.v = Math.max(5, now.v - 60 * dt);
        now.s = Math.min(now.hook.total, now.s + now.v * dt);
        along(now.hook, now.s, bird.at, v);
        frame(u, UP, bird.q);
        ease(dt, { pitch: clamp(Math.asin(clamp(v.y, -1, 1)), -0.3, 1), lift: 0.6, tailFan: 0.6, headPitch: 0, headYaw: 0, gape: 0, roll: 0 }, 14);
        writhe(dt);
        doing = 'pulling out of its dive, flicking its tail';
        if (now.s >= now.hook.total) phase(now, 'writhe');
      } else if (now.phase === 'writhe') {
        // a moment's hovering with its tail flicking, and up again, or done
        ease(dt, { pitch: hovering.pitch, lift: hovering.lift, tailFan: 0.6, headPitch: 0, headYaw: 0, gape: 0, roll: 0 }, 12);
        writhe(dt);
        doing = 'flicking its tail at the end of its dive';
        if (now.t > 0.45) {
          now.dives -= 1;
          // (another dive only while the J's bottom is clear of the walker and of other animals: it passes it at 21 m/s)
          if (now.dives > 0 && world.day > 0.3 && a.clear(stage.bottom, 1.5) && world.crowd(stage.bottom, bird) >= 1) phase(now, 'climb');
          else { if (!settle()) now.t = 0; return; }
        }
      }
      bird.at.y = Math.max(bird.at.y, world.height(bird.at.x, bird.at.z) + 0.4);
      wear(lay(mode, dt));
      bird.doing = doing;
    },
  };
  // Is something in the way of what it does next? Another animal within ROOM of where the shuttle goes, or of the
  // line it flies as far along as the next quarter of a second takes it (a metre at the least); and, diving, the
  // walker within a metre more than its flush distance of the J's bottom, or another animal within ROOM of it.
  function barred(now, dt) {
    const near = (p) => world.crowd(p, bird) < ROOM;
    if (now.phase === 'shuttle') {
      for (const k of [-0.5, 0, 0.5]) if (near(w.copy(now.centre).addScaledVector(now.stage.u, k))) return true;
      return false;
    }
    const path = now.phase === 'pendulum' || now.phase === 'climb' ? now.path : now.phase === 'dive' ? now.J : now.phase === 'hook' ? now.hook : null;
    if (!path) return false;
    // (tried every 0.6 m of it and less: ROOM is 0.45 m either side)
    const reach = Math.max(1, now.v * 0.25), n = Math.ceil(reach / 0.6);
    for (let k = 1; k <= n; k += 1) if (near(along(path, Math.min(path.total, now.s + (reach * k) / n), w))) return true;
    return now.phase === 'dive' && (near(now.stage.bottom) || !a.clear(now.stage.bottom));
  }
  // (the way it faces as it climbs: the way the path runs, seen from above, while there is any)
  function heading(dir, dt) {
    f.copy(dir).setY(0);
    if (f.lengthSq() > 0.02) { a.now.heading.copy(f.normalize()); frame(f, UP, bird.q); }
  }
  // the tail flipped up and down, fast
  function writhe(dt) {
    const now = a.now;
    now.flip -= dt;
    if (now.flip < 0) { now.flip = 0.05 + r() * 0.03; held.tailPitch = held.tailPitch > 0 ? -0.45 : 0.5; }
  }
  // the display's next part, from where the bird is now
  function phase(now, name) {
    const D = way.display, stage = now.stage, u = stage.u, from = bird.at.clone();
    now.phase = name; now.t = 0; now.s = 0;
    if (name === 'shuttle') { now.centre.copy(bird.at); now.time = 2 + r() * 2.5; }
    else if (name === 'pendulum') {
      now.path = pathOf((t, out) => out.copy(from).addScaledVector(u, 3 * t).addScaledVector(UP, 2.5 * t * t), 12);
      now.v = 4.5;
    } else if (name === 'climb') {
      // from where it is to the top of the J, out of its plane a little, so that it does not climb the line it dives
      const top = now.J.pts[0];
      now.path = pathOf((t, out) => climbAt(from, top, u, now.H, now.W, t, out));
      now.v = D.climb;
      now.heading.set(-u.x, 0, -u.z);
    } else if (name === 'dive') { now.said = false; now.v = 2.5; }
    else if (name === 'hook') { /* (it keeps the speed it had at the bottom) */ }
  }

  // ---- by night, on its twig
  const roost = {
    wary: false,
    enter(a, post) { at.post = post; at.flower = null; bird.aloft = false; wear(lay('fold', 0), grip()); },
    step(a, dt) {
      if (world.day >= 0.08) { a.to('perch', at.post, 0.5 + r()); return; }
      ease(dt, { pitch: perched.pitch + 0.12, lift: perched.lift * 0.9, tailPitch: perched.tail.pitch, tailFan: perched.tail.fan, headPitch: 0.25, headYaw: 0, gape: 0, roll: 0 }, 4);
      wear(lay('fold', dt), grip());
      bird.doing = 'at roost on its twig for the night';
    },
  };

  // ---- a flight: the shared one (life/agents.js `flying`), with the wings held still there and laid here
  const fly = {
    wary: false,
    enter() { wear(lay('fly', 0)); },
    step(a, dt) {
      if (!bird.fleeing && chased()) return;
      flying(bird, dt, 0);
      if (a.name !== 'fly' || !bird.flight) return;            // (it has landed, and the next activity has dressed it)
      const flare = bird.want.pitch;
      ease(dt, { pitch: flare, lift: 0.6, tailPitch: bird.want.tail.pitch, tailFan: bird.want.tail.fan, headYaw: 0, headPitch: 0, gape: 0, roll: 0 }, 14);
      // (coming in to hover it flares into the hover's beat, and its feet stay tucked)
      const t = bird.flight.t, landing = !bird.flight.through && t > 0.8;
      wear(lay(landing ? 'hover' : 'fly', dt));
      humming(dt);
    },
  };

  return {
    activities: { perch, hover, chase, display, roost, fly },
    // Put up: to a twig of its own or a flower clear of the walker, near by; or nowhere near.
    refuge() {
      const post = pickPost(way.range * 2);
      if (post) return goPerch(post, 'darting off to another twig');
      const flower = nextFlower(bird.at, way.range * 2);
      if (flower && a.clear(flower.at)) { round = 2; return dartTo(flower, 'darting off to another flower'); }
      return false;
    },
    // Where it is when it comes: on a twig of its patch, or at one of its flowers; it flies in if the walker could see
    // it be there from nowhere. By night, at roost on a twig.
    begin() {
      holds();
      const night = world.day < 0.08, posts = home.perches.filter((one) => world.free(one.point, bird, 0.3) && a.clear(one.point));
      if (!posts.length) { bird.left = night ? Infinity : 6 + r() * 10; return; }
      const post = posts[Math.floor(r() * posts.length)];
      if (night) { a.to('roost', post); bird.at.copy(post.point); facing(post, bird.q); return; }
      const flower = r() < 0.45 ? nextFlower(post.point, way.range * 2) : null;
      if (flower) { round = Math.round(between(way.visits)); a.to('hover', flower); }
      else a.to('perch', post, 0.5 + r() * 3);
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        const came = flower ? a.come({ at: bird.at.clone(), q: bird.q.clone(), out: flower.out, rise: 0.05, floor: world.height }, 'hover', flower)
          : a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.15, floor: world.height }, 'perch', post, 0.6);
        if (!came) bird.left = 4 + r() * 8;
      }
    },
  };
}

export default {
  // what a hummingbird's way holds besides what every way has (life/families/index.js)
  fields: {
    homeOff: 'number',                              // how far from the walk (m) a salmonberry or the apple at the middle of its patch may be
    range: 'number',                                // the radius (m) of its patch
    apart: 'number',                                // no nearer than this (m) to another of its kind's patch
    need: 'number',                                 // the flowers a patch must have, at the least
    hz: 'number', stroke: 'number',                 // wingbeats a second, hovering; and the degrees its wing sweeps
    speed: 'number', dart: 'number',                // how fast it flies off and away, and between its flowers (m/s)
    spell: nums(2),                                 // seconds it is about, in one spell, before it goes
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    sip: nums(2), visits: nums(2), backOff: 'number', // seconds at a flower; flowers in a round; the chance it backs off from one
    sit: nums(2),                                   // seconds on a twig between rounds
    hawk: { chance: 'number', time: nums(2), reach: nums(2) },               // after insects: how often, how long, how far out (m)
    chase: { notice: nums(2), time: nums(2), speed: 'number', away: 'number' }, // the seconds before the holder sees another; how long it chases; how fast; the chance the chased one goes for good
    display: { chance: 'number', every: nums(2), high: nums(2), wide: 'number', dives: nums(2), shuttle: 'number', climb: 'number', peak: 'number' },
    hum: { reach: 'number', every: 'number' }, dive: { reach: 'number' }, call: { every: nums(2), reach: 'number' },
    watching: 'string',
  },
  act: (way) => (bird, world) => live(bird, world, way, hoverer),
  home: (way) => (habitat, r, taken = []) => territory(habitat, way, r, taken),
};
