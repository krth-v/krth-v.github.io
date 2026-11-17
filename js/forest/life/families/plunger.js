import * as THREE from 'three';
import { frame, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';
import { river } from '../../world/land.js';
import { riverPosts, at as onRiver, hoverAt, riverLine, placeOf, riverLength, riffle, depth } from '../places/kingfisher.js';

// The family of the kingfisher, which fishes by plunging: the Belted Kingfisher. Each is one of a visit's own, with a
// home (`bird.home`: { x, z, posts, from, to }): a stretch of the river, from `from` to `to` metres down it, and the
// posts over its water that it watches from (life/places/kingfisher.js). It is never far from the water: it sits over
// it, hovers over it, plunges into it, and flies along it, low, from one end of its stretch to the other and off.
//
// What it does. On a post it watches the water, its head down and moving, now and then bobbing as it fixes on
// something, and flicks its tail; every so often it looks for a fish in earnest, and then it plunges from the post,
// or flies out to hover over the river on quick wingbeats and plunges from there, or moves to another post along
// the river; now and then it rattles. A plunge is head first, steep from a hover and at an angle from a post; its
// head and fore-body go under, and it comes straight up out of the water. With a fish it flies to a post, beats the
// fish against the limb, tosses it and swallows it head first, and sits a while; with none it hovers again or goes
// back to a post. After a spell it is off along the river, rattling, for a while or for good.
//
// From what was read (the species' file names its sources): it watches from "an unobstructed and usually dead limb
// of a tree overlooking the feeding site" (the Animal Diversity Web), or hovers over the water before diving
// (Audubon; BirdWeb); it dives "off the branch toward the water at an angle, entering head first", and from a hover
// "either dive[s] straight down or in a spiraling motion" (ADW); prey "is taken near the surface, and the birds do not
// submerge themselves completely" (BirdWeb); it returns to its perch, strikes the prey against the limb, tosses it
// and eats it head first (ADW; Wikipedia: "pound its prey against its perch"); it moves "up and down the river above
// the water and below the canopy", and its "wing beats can at times appear unmethodical" (ADW); it is "often first
// noticed by its rattling call as it flies along rivers or lakes", a "loud, penetrating rattle at any disturbance"
// (Audubon), "a dry rattle, often given in flight" (BirdWeb); it flies up to 72 km/h and dives at 40 km/h
// (Wikipedia); in April and May a pair keeps a territory of 800 to 1,200 m of shoreline (ADW). The ADW gives how high
// it hovers as "90.14 meters", which the text as read has garbled. The agent's own: every distance, height, time and
// chance below, the wingbeat rates, how often a plunge takes a fish, and how near it lets a walker come.
//
// It lives on life/behave.js, and takes the walker by the owner's rule: it goes on with what it is doing until they
// are too near or move suddenly, and then it flies off low along the river, rattling, to a post further from them or
// out of their sight. A hovering bird is put up as a perched one is; one in a plunge or on the wing is not. Its going
// and coming are its own (`leave`, `come`): along the river's line, never into the wood, the way that does not pass
// the walker, until they cannot plainly see it.
//
// What is not drawn: the fish, and the splash. No part is added to the bird for them, and what it says it is doing
// says so.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const _v = new THREE.Vector3(), _u = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Quaternion(), _r = [0, false, 0, 0, 0];
const level = (x, z) => river(x, z, _r)[2];               // the water's face abreast of (x, z)
const LOW = 0.45;                                        // the least a flight goes over the water or the ground (m)

function plunger(a) {
  const { bird, world, way, r } = a, home = bird.home;  // home: { x, z, posts, from, to }
  const rest = bird.sheet.poses.perched;
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  // where it is, kept across its activities: the post it is on, whether it holds a fish, how long its rattle has to go
  const at = { post: null, fish: false, calling: 0 };
  let spell = between(way.spell), calls = between(way.call.every) * (0.3 + 0.7 * r()), again = 0;

  // ---- on a post: the world's up, leant half way towards square to its limb (a bird on a sloping limb leans with
  // it a little), facing across it to the water
  const up = new THREE.Vector3();
  const attitude = (post, out) => {
    up.copy(UP);
    if (post.along) { _u.copy(UP).addScaledVector(post.along, -post.along.y).normalize(); up.lerp(_u, 0.5).normalize(); }
    return frame(post.face, up, out);
  };
  // (on its post it is not on the wing: its next flight begins from a standstill, its wings folded)
  const settle = (post) => { bird.at.copy(post.point); attitude(post, bird.q); bird.aloft = false; };
  const sit = (head, extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: bill(), head,
    tail: { pitch: rest.tail.pitch, fan: rest.tail.fan ?? 0, yaw: 0, prop: null }, feet: { mode: 'grip', round: Math.max(0.006, at.post ? at.post.radius : 0.02) } }, extra);
  // the rattle: heard as far as it carries, and the bill opening and shutting fast while it lasts
  const rattle = () => { at.calling = way.call.time; calls = between(way.call.every); world.say(bird, 'call', way.call.reach); };
  const bill = () => (at.calling > 0 ? ((at.calling * 13) % 1 > 0.5 ? 0.42 : 0.08) : at.fish ? 0.14 : 0);
  const tick = (dt) => { at.calling = Math.max(0, at.calling - dt); calls -= dt; spell -= dt; again -= dt; };

  // Which of several posts: an open one more often than one in the crown (a limb's end out over the water is at the
  // crown's edge, one over the bank inside it, where a walker sees leaves), a low one more than a high one, and the
  // stub of a dead limb most of all (the ADW: "an unobstructed and usually dead limb").
  const worth = (p) => (p.from < 0 ? 2.5 : 1) * (p.over < 7 ? 2 : p.over < 11 ? 1.3 : 0.8) * (p.kind === 'stub' ? 1.5 : 1);
  const choose = (list) => {
    let sum = 0;
    for (const p of list) sum += worth(p);
    let k = r() * sum;
    for (const p of list) { k -= worth(p); if (k <= 0) return p; }
    return list[list.length - 1];
  };
  // A post of its stretch it could go to: free, clear of the walker, not its own, and (`away`) further from the
  // walker than it is now and further along the river from them on its own side of them, so that the way there,
  // which follows the river, never takes it past them (on its own side however little it is to that side: within
  // 5 m of abreast of them either side was allowed, and from 4.5 m down the river of them it flew up it, 1.1 m from
  // them seen from above, in a probe of 2026-11-16); or (`near`) within so many metres of it. One the walker has
  // no trunk in front of, mostly.
  const pick = ({ away = false, near = Infinity } = {}) => {
    const here = bird.at.distanceTo(world.eye);
    let beyond = null;
    if (away) {
      const them = placeOf(world.eye.x, world.eye.z).down, mine = placeOf(bird.at.x, bird.at.z).down - them;
      beyond = (p) => Math.abs(p.down - them) > Math.abs(mine) + 2 && (p.down >= them ? 1 : -1) === (mine >= 0 ? 1 : -1);
    }
    const all = home.posts.filter((p) => p !== at.post && p.point.distanceTo(bird.at) < near && world.free(p.point, bird, 0.6) && a.clear(p.point)
      && (!away || (p.point.distanceTo(world.eye) > here + 4 && beyond(p))));
    if (!all.length) return null;
    const open = all.filter((p) => !world.blocked(world.eye, p.point));
    return choose(open.length && r() < 0.8 ? open : all);
  };
  // A place over the water to hover: within `near` metres down the river of where it is, inside its stretch, over a
  // riffle more often than not, clear of the walker and of other animals, with no trunk between it and the bird.
  const hoverSpot = (near = 28) => {
    const here = placeOf(bird.at.x, bird.at.z);
    for (let tries = 0; tries < 12; tries += 1) {
      const down = clamp(here.down + (r() - 0.5) * 2 * near, home.from, home.to);
      if (tries < 6 && r() > 0.5 + riffle(down)) continue;
      const p = hoverAt(down, (r() - 0.5) * 8, between(way.hover.high));
      if (!p || !a.clear(p, 2) || world.crowd(p, bird) < 1.5 || world.blocked(bird.at, p)) continue;
      return p;
    }
    return null;
  };

  // ---- flights along the river. A route between two places: out from the first and down to the river's line, along
  // it low over the water, and up from it to the second; a short one is a dip between them.
  const route = (from, to, high = 1.2 + r() * 0.9) => {
    const a0 = placeOf(from.x, from.z), b0 = placeOf(to.x, to.z), span = Math.abs(b0.down - a0.down), points = [from.clone()];
    const drop = clamp((from.y - level(from.x, from.z)) * 0.7, 5, 9), rise = clamp((to.y - level(to.x, to.z)) * 0.6, 4, 8);
    if (span > drop + rise + 8) {
      const dir = Math.sign(b0.down - a0.down);
      points.push(...riverLine(a0.down + dir * drop, b0.down - dir * rise, { acrossFrom: clamp(a0.across, -4, 4), acrossTo: clamp(b0.across, -4, 4), highFrom: high, highTo: high }));
    } else if (from.distanceTo(to) > 3) {
      _v.copy(from).lerp(to, 0.5);
      _v.y = Math.max(level(_v.x, _v.z) + high, Math.min(from.y, to.y) - 0.6 - 0.1 * from.distanceTo(to));
      points.push(_v.clone());
    }
    points.push(to.clone());
    return points;
  };
  // Off to a post, and onto it into `landing`.
  const travel = (post, landing, args, { speed = way.speed, doing = 'flying low along the river', call = 0.35 } = {}) => {
    if (r() < call) rattle();
    a.to('cruise', { points: route(bird.at, post.point), landing, args, q: attitude(post, new THREE.Quaternion()), speed, doing });
    return true;
  };
  // Out over the river to hover.
  const outTo = (point, doing = 'flying out over the river') => {
    a.to('cruise', { points: route(bird.at, point), landing: 'hover', args: [point, between(way.hover.time)], air: true, speed: way.speed * 0.7, doing });
    return true;
  };

  // The flight: along a smooth curve through `points` at `speed`, from a standstill off a post, braking to land at its
  // end in `landing` (with `args`, in the attitude `q`), or (`air`) to a stop in the air; or (`through`) on along the
  // river until the walker cannot plainly see it, and gone (for `seconds`). Its wings beat in bursts with short
  // glides between (ADW: "Wing beats can at times appear unmethodical"). (It is a flight, as the count of walks
  // reads a bird's state.)
  const cruise = {
    wary: false,
    enter(a, plan) {
      const now = a.now;
      Object.assign(now, plan, { curve: new THREE.CatmullRomCurve3(plan.points, false, 'centripetal'), s: 0, v: bird.aloft ? plan.speed * 0.6 : 1.2, glide: 0.5 + r() * 1.4, gliding: 0, open: bird.aloft ? 1 : 0, gone: 0 });
      now.length = now.curve.getLength();
      bird.state = 'fly'; bird.aloft = true;
      const end = plan.points[plan.points.length - 1];
      bird.flight = plan.through ? null : { a: plan.points[0].clone(), d: end.clone(), time: now.length / plan.speed, t: 0, through: false };
      if (plan.doing) bird.doing = plan.doing;
    },
    exit() { bird.flight = null; },
    step(a, dt) {
      const now = a.now;
      tick(dt);
      const left = now.length - now.s;
      // its pace: up from a standstill, and down to a landing (or to a hover) at its end
      const most = now.through ? now.speed : Math.max(now.air ? 2.2 : 1.4, Math.sqrt(2 * 7 * Math.max(0, left)));
      now.v = Math.min(now.speed, most, now.v + 8 * dt);
      now.s = Math.min(now.length, now.s + now.v * dt);
      now.open = Math.min(1, now.open + dt / 0.12);
      const u = now.length > 1e-6 ? now.s / now.length : 1;
      now.curve.getPointAt(u, bird.at);
      now.curve.getTangentAt(u, _t);
      // never into the water or the ground on its way (its ends are where it means to be)
      if (u > 0.03 && u < 0.97) { const least = Math.max(level(bird.at.x, bird.at.z), world.height(bird.at.x, bird.at.z)) + LOW; if (bird.at.y < least) bird.at.y = least; }
      if (bird.flight) bird.flight.t = u;
      const flat = Math.hypot(_t.x, _t.z), slope = Math.atan2(_t.y, flat);
      if (flat > 0.05) frame(_t, UP, bird.q);
      // it brakes into its landing: the body up, the wings forward, the tail spread, the feet down; and it comes round
      // into the attitude it lands in
      const flare = now.air || now.through ? 0 : clamp(1 - left / 1.3, 0, 1);
      if (flare > 0 && now.q) bird.q.slerp(now.q, flare * flare);
      // the wingbeats: in bursts, with short glides between
      now.glide -= dt;
      if (now.gliding > 0) now.gliding -= dt;
      else { bird.beat += dt * way.hz * Math.PI * 2; if (now.glide < 0 && flare === 0) { now.gliding = 0.15 + r() * 0.25; now.glide = 0.7 + r() * 1.8; } }
      const gliding = now.gliding > 0;
      Object.assign(bird.want, { pitch: 0.05 + 0.55 * clamp(slope, -0.9, 0.6) + 0.6 * flare, lift: 0.6, lean: 0, spread: now.open, flap: gliding ? 0.22 : 0.75 * Math.sin(bird.beat) + 0.15,
        hand: gliding ? 0.04 : 0.5 * Math.sin(bird.beat - 1), sweep: (gliding ? 0.2 : 0.12) - 0.32 * flare, droop: 0, gape: bill(),
        head: { yaw: 0, pitch: -0.12 - 0.3 * clamp(-slope, 0, 1), roll: 0 }, tail: { pitch: 0.1 * flare, fan: 0.1 + 0.45 * flare, yaw: 0, prop: null }, feet: { mode: flare > 0.6 ? 'flat' : 'tuck' } });
      bird.snap = true;
      if (now.through) {
        // gone once the walker cannot plainly see it (and not before it has gone a little way)
        if (now.s > 12 && !world.plain(bird.at, bird.size)) { bird.left = now.seconds; a.to('gone'); return; }
        if (now.s >= now.length) {
          // still in plain sight at the end of its way: on, along the river or, at its end, away from the walker and
          // up (six legs at the most, each of up to 240 m: long before then it is too far off to be seen)
          const legs = (now.legs ?? 6) - 1, next = legs > 0 ? onwards(now.dir, bird.at) : null;
          if (next) { const seconds = now.seconds, dir = now.dir; a.to('cruise', { points: next, through: true, seconds, dir, legs, speed: now.speed, doing: bird.doing }); return; }
          bird.left = now.seconds; a.to('gone');
        }
        return;
      }
      if (now.s >= now.length) {
        bird.at.copy(now.points[now.points.length - 1]);
        if (now.q) bird.q.copy(now.q);
        a.to(now.landing, ...(now.args || []));
      }
    },
  };
  // The river's line on from `from`, `dir` the way down it, a long leg at a time; at the river's end, away and up.
  const onwards = (dir, from) => {
    const here = placeOf(from.x, from.z), far = dir > 0 ? riverLength - here.down : here.down;
    if (far > 30) {
      const to = here.down + dir * Math.min(far - 5, 240);
      return [from.clone(), ...riverLine(here.down + dir * 8, to, { acrossFrom: clamp(here.across, -3, 3), acrossTo: (r() - 0.5) * 4, highFrom: 1.3 + r(), highTo: 1.6 + r() })];
    }
    _v.subVectors(from, world.eye).setY(0).normalize();
    return [from.clone(), from.clone().addScaledVector(_v, 40).add(new THREE.Vector3(0, 12, 0)), from.clone().addScaledVector(_v, 90).add(new THREE.Vector3(0, 25, 0))];
  };

  // ---- watching from a post
  const perch = {
    enter(a, post, wait = 0.6 + r() * 1.4) {
      at.post = post;
      Object.assign(a.now, { wait, look: 0, head: { yaw: 0, pitch: -0.4, roll: 0 }, search: between(way.search) * (0.4 + 0.6 * r()), bob: 0, then: null, flick: 2 + r() * 7, flicking: 0 });
      settle(post);
    },
    step(a, dt) {
      const now = a.now;
      tick(dt);
      if (world.day < 0.08) { a.to('roost', at.post); return; }
      now.wait -= dt; now.look -= dt; now.search -= dt; now.flick -= dt;
      // it looks about: mostly down at the water before it, now this way, now that
      if (now.look < 0) { now.look = 0.5 + r() * 1.7; now.head = { yaw: (r() - 0.5) * 1.3, pitch: -0.2 - r() * 0.7, roll: (r() - 0.5) * 0.2 }; }
      let head = now.head;
      if (now.bob > 0) {
        // the head bobs as it fixes on something in the water, and then it goes
        now.bob -= dt;
        head = { yaw: now.head.yaw * 0.3, pitch: -0.75 - 0.22 * Math.abs(Math.sin(now.bob * 19)), roll: 0 };
        if (now.bob <= 0 && now.then) { const go = now.then; now.then = null; if (go()) return; }
      }
      sit(head);
      if (now.flicking > 0) { now.flicking -= dt; bird.want.tail = { pitch: rest.tail.pitch + 0.5, fan: 0.12, yaw: 0, prop: null }; }
      else if (now.flick < 0) { now.flick = 3 + r() * 9; now.flicking = 0.14; }
      if (at.calling > 0) { bird.doing = way.call.doing; return; }
      bird.doing = now.bob > 0 ? 'bobbing its head, fixing on something in the water' : 'perched over the river, watching the water';
      // its spell is over: off along the river (with no way out found it looks again in a moment)
      if (spell < 0 && again <= 0 && now.bob <= 0) {
        if (a.leave(r() < way.away ? Infinity : a.awhile())) return;
        again = 2;
      }
      if (now.wait > 0 || now.bob > 0) return;
      if (calls < 0) { rattle(); bird.doing = way.call.doing; return; }
      if (now.search > 0) return;
      now.search = between(way.search);
      const k = r();
      if (k < way.plunge) {
        // down at the water in front of it, deep enough, clear of the walker and of other animals
        const targets = at.post.targets.filter((t) => a.clear(t, 0) && world.crowd(t, bird) > 1.2);
        // (and still so when its head has done bobbing, up to a second later: or it stays where it is)
        if (targets.length) { const target = targets[Math.floor(r() * targets.length)]; now.bob = 0.45 + r() * 0.5; now.then = () => a.clear(target, 0) && world.crowd(target, bird) > 1.2 && a.to('plunge', target.clone(), 'perch'); return; }
      }
      if (k < way.plunge + way.hover.chance) { const spot = hoverSpot(); if (spot) { outTo(spot); return; } }
      if (k < way.plunge + way.hover.chance + way.move) { const one = pick({ near: 70 }); if (one) { travel(one, 'perch', [one]); return; } }
    },
  };

  // ---- hovering over the water on quick wingbeats, the body up, the tail spread and let down, the bill down
  const hover = {
    enter(a, point, time) { Object.assign(a.now, { base: point.clone(), time, phase: r() * 6.283 }); bird.aloft = true; bird.doing = 'hovering over the river on quick wingbeats, looking down into the water'; },
    step(a, dt) {
      const now = a.now;
      tick(dt);
      now.time -= dt;
      // (it comes up to its place from below after a plunge, and holds there, drifting a little)
      _v.copy(now.base); _v.x += 0.12 * Math.sin(world.clock * 0.9 + now.phase); _v.z += 0.12 * Math.cos(world.clock * 0.7 + now.phase); _v.y += 0.08 * Math.sin(world.clock * 1.7);
      const gap = bird.at.distanceTo(_v);
      if (gap > 1e-4) bird.at.lerp(_v, Math.min(1, (Math.min(3.5, gap * 5) * dt) / gap));
      bird.beat += dt * way.hoverHz * Math.PI * 2;
      Object.assign(bird.want, { pitch: 0.75, lift: 0.6, lean: 0, spread: 1, flap: 0.8 * Math.sin(bird.beat) + 0.1, hand: 0.55 * Math.sin(bird.beat - 1), sweep: -0.18, droop: 0, gape: bill(),
        head: { yaw: 0.25 * Math.sin(world.clock * 1.3 + now.phase), pitch: -1.05, roll: 0 }, tail: { pitch: -0.45, fan: 0.55, yaw: 0, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true;
      if (at.calling > 0) bird.doing = way.call.doing; else bird.doing = 'hovering over the river on quick wingbeats, looking down into the water';
      if (now.time > 0 || gap > 0.5) return;
      // the hover's end: a plunge below it, another place to hover, a post, or off
      if (r() < way.hover.dive) {
        const target = new THREE.Vector3(bird.at.x + (r() - 0.5) * 1.2, 0, bird.at.z + (r() - 0.5) * 1.2);
        target.y = level(target.x, target.z);
        if (depth(target.x, target.z) > 0.3 && world.crowd(target, bird) > 1.2) { a.to('plunge', target, 'hover'); return; }
      }
      if (r() < 0.45) { const spot = hoverSpot(14); if (spot) { outTo(spot, 'moving on over the river'); return; } }
      const one = pick({ near: 70 });
      if (one) { travel(one, 'perch', [one]); return; }
      if (!a.leave(a.awhile())) now.time = 1;
    },
  };

  // ---- the plunge: off its post at an angle, or nearly straight down from a hover, head first, gathering speed, the
  // wings held up and back and closed as it strikes; its head and fore-body under for a moment; and up out of it
  const plunge = {
    wary: false,
    enter(a, target, from) {
      const now = a.now;
      now.from = from; now.p0 = bird.at.clone(); now.p2 = target.clone();
      const drop = Math.max(0.5, now.p0.y - now.p2.y);
      _v.subVectors(now.p2, now.p0).setY(0);
      now.p1 = from === 'hover' ? now.p0.clone().addScaledVector(_v, 0.2).setY(now.p0.y - drop * 0.3) : now.p0.clone().addScaledVector(_v, 0.62).setY(now.p0.y + 0.1);
      // (a table of lengths along the curve, so that it is flown at its own pace)
      const table = [0], p = new THREE.Vector3(), q = now.p0.clone();
      for (let k = 1; k <= 16; k += 1) { bez(now, k / 16, p); table.push(table[k - 1] + p.distanceTo(q)); q.copy(p); }
      Object.assign(now, { table, length: table[16], s: 0, v: from === 'hover' ? 0.6 : 1.2, phase: 'dive', time: 0, ahead: _v.lengthSq() > 1e-6 ? _v.clone().normalize() : new THREE.Vector3(1, 0, 0).applyQuaternion(bird.q).setY(0).normalize() });
      frame(now.ahead, UP, bird.q);
      bird.aloft = true;
      // The water it is going into is held for it while it dives, as a landing is: it is on the wing (`cruise` says
      // so the same way), and its flight ends there, which is what the other animals keep clear of (life/visit.js
      // `crowd`, `free`). With no flight, a duck could swim onto the place, or come up under it, in the second the
      // dive takes.
      bird.state = 'fly';
      bird.flight = { a: now.p0.clone(), d: now.p2.clone(), time: Math.max(0.2, now.length / way.dive), t: 0, through: false };
      bird.doing = 'plunging head first into the river';
    },
    exit() { bird.flight = null; },
    step(a, dt) {
      const now = a.now;
      tick(dt);
      bird.snap = true;
      if (now.phase === 'dive') {
        now.v = Math.min(way.dive, now.v + 8.3 * dt);
        now.s = Math.min(now.length, now.s + now.v * dt);
        let k = 0;
        while (k < 15 && now.table[k + 1] < now.s) k += 1;
        const u = (k + (now.s - now.table[k]) / Math.max(1e-6, now.table[k + 1] - now.table[k])) / 16;
        bez(now, u, bird.at); dbez(now, u, _t);
        if (bird.flight) bird.flight.t = now.s / now.length;
        const pitch = clamp(Math.atan2(_t.y, Math.hypot(_t.x, _t.z)), -1.4, 0.3), shut = (now.length - now.s) / Math.max(now.v, 0.1) < 0.16;
        Object.assign(bird.want, { pitch, lift: 0.6, lean: 0, spread: shut ? 0 : 1, flap: 0.5, hand: -0.25, sweep: 0.55, droop: 0, gape: 0,
          head: { yaw: 0, pitch: Math.min(pitch, -0.5), roll: 0 }, tail: { pitch: 0.1, fan: 0.08, yaw: 0, prop: null }, feet: { mode: 'tuck' } });
        bird.doing = 'plunging head first into the river';
        // (in the water it is no longer on the wing, and is where it is)
        if (now.s >= now.length) { now.phase = 'under'; now.time = 0.3 + r() * 0.2; now.top = level(bird.at.x, bird.at.z); at.fish = r() < way.catch; bird.state = 'plunge'; bird.flight = null; }
        return;
      }
      if (now.phase === 'under') {
        // under the face, as deep as its feet go (its head and bill deeper), for a moment
        now.time -= dt;
        bird.at.y = Math.max(now.top - 0.105, bird.at.y - dt * 1.5);          // (its feet 0.1 m under the surface: never the bed)
        Object.assign(bird.want, { pitch: -1.3, spread: 0, flap: 0, hand: 0, sweep: 0, head: { yaw: 0, pitch: -1.3, roll: 0 }, tail: { pitch: 0.1, fan: 0.04, yaw: 0, prop: null } });
        bird.doing = 'in the water, after a fish';
        if (now.time <= 0) { now.phase = 'rise'; now.time = 0; now.from0 = bird.at.clone(); now.to0 = bird.at.clone().addScaledVector(now.ahead, 1 + r() * 0.6).add(_u.set(0, 1.6 + r() * 0.8, 0)); }
        return;
      }
      // up out of the water, beating hard, the body coming up
      now.time = Math.min(1, now.time + dt / 0.6);
      const t = 1 - (1 - now.time) * (1 - now.time);
      bird.at.lerpVectors(now.from0, now.to0, t);
      bird.beat += dt * way.hoverHz * Math.PI * 2;
      Object.assign(bird.want, { pitch: -1.3 + 1.95 * Math.min(1, now.time * 2.5), lift: 0.6, lean: 0, spread: 1, flap: 0.85 * Math.sin(bird.beat) + 0.1, hand: 0.55 * Math.sin(bird.beat - 1), sweep: -0.1, droop: 0, gape: at.fish ? 0.14 : 0,
        head: { yaw: 0, pitch: -0.3, roll: 0 }, tail: { pitch: -0.2, fan: 0.4, yaw: 0, prop: null }, feet: { mode: 'tuck' } });
      bird.doing = at.fish ? 'coming up out of the water with a fish (the fish is not drawn)' : 'coming up out of the water with nothing';
      if (now.time >= 1) after(now.from);
    },
  };
  const bez = (now, u, out) => { const w = 1 - u; return out.set(0, 0, 0).addScaledVector(now.p0, w * w).addScaledVector(now.p1, 2 * w * u).addScaledVector(now.p2, u * u); };
  const dbez = (now, u, out) => out.subVectors(now.p1, now.p0).multiplyScalar(2 * (1 - u)).add(_u.subVectors(now.p2, now.p1).multiplyScalar(2 * u));
  // what it does when it is up out of the water
  const after = (from) => {
    if (at.fish) {
      // to a post with it: the one it left if it may, or another
      const back = from === 'perch' && at.post && world.free(at.post.point, bird, 0.6) && a.clear(at.post.point) ? at.post : pick({ near: 80 });
      if (back) return travel(back, 'beat', [back], { doing: 'flying to a perch with a fish (the fish is not drawn)', call: 0.15 });
      at.fish = false;
      if (a.leave(a.awhile())) return true;
    }
    if (from === 'hover' && r() < 0.6) { const spot = hoverSpot(10); if (spot) return outTo(spot, 'up to hover again'); }
    const back = from === 'perch' && at.post && world.free(at.post.point, bird, 0.6) && a.clear(at.post.point) ? at.post : pick({ near: 70 });
    if (back) return travel(back, 'perch', [back], { doing: 'flying back to a perch', call: 0.1 });
    const spot = hoverSpot(20);
    if (spot) return outTo(spot);
    if (a.leave(a.awhile())) return true;
    // nowhere at all: it hovers where it is a moment, and looks again
    return a.to('hover', bird.at.clone(), 1.5);
  };

  // ---- the catch: beaten against the limb, tossed and swallowed head first
  const beat = {
    enter(a, post) {
      at.post = post; settle(post);
      Object.assign(a.now, { whacks: Math.round(between(way.whacks)), t: 0, side: r() < 0.5 ? 1 : -1, phase: 'beat', time: 0 });
    },
    step(a, dt) {
      const now = a.now;
      tick(dt);
      if (now.phase === 'beat') {
        // each blow: the head swung down onto the limb to one side, fast, and up again slower
        now.t += dt / 0.42;
        const f = now.t % 1, down = f < 0.28 ? ease(f / 0.28) : 1 - ease((f - 0.28) / 0.72);
        sit({ yaw: now.side * (0.35 + 0.65 * down), pitch: 0.05 - 0.85 * down, roll: 0 }, { pitch: rest.pitch - 0.2 * down, gape: 0.16 });
        bird.snap = true;
        bird.doing = 'beating a fish against the limb (the fish is not drawn)';
        if (now.t >= now.whacks) { now.phase = 'swallow'; now.time = 1.1 + r() * 0.5; }
        else if (f > 0.97 && r() < 0.3) now.side = -now.side;
        return;
      }
      if (now.phase === 'swallow') {
        // tossed, and swallowed head first: the head up, the bill opening and shutting
        now.time -= dt;
        sit({ yaw: 0, pitch: 0.85, roll: 0 }, { gape: Math.max(0, Math.sin(now.time * 11)) * 0.5 });
        bird.doing = 'tossing the fish and swallowing it head first';
        if (now.time <= 0) { at.fish = false; a.to('perch', at.post, 5 + r() * 9); }
      }
    },
    exit() { at.fish = false; },
  };

  // ---- at roost on its post by night
  const roost = {
    wary: false,
    enter(a, post) { at.post = post; settle(post); },
    step(a, dt) {
      tick(dt);
      if (world.day >= 0.08) { a.to('perch', at.post, 0.5); return; }
      sit({ yaw: 0, pitch: 0.2, roll: 0 }, { pitch: rest.pitch + 0.1, lift: rest.lift - 0.1 });
      bird.doing = 'at roost over the river';
    },
  };

  // ---- going and coming: along the river, never into the wood
  // Off along the river, the way that takes it further from the walker, low over the water, until they cannot
  // plainly see it, and gone (for `seconds`, or for good). It rattles as it goes.
  const leave = (seconds) => {
    if (a.cast) return false;
    // (the way down the river that is away from the walker: never past them)
    const here = placeOf(bird.at.x, bird.at.z), them = placeOf(world.eye.x, world.eye.z), dir = here.down >= them.down ? 1 : -1;
    const points = onwards(dir, bird.at);
    if (!points) return false;
    at.post = null;
    rattle();
    a.to('cruise', { points, through: true, seconds, dir, speed: way.dash, doing: 'flying off low along the river, rattling' });
    return true;
  };
  // In along the river from out of the walker's plain sight, to land at `to` ({ at, q }).
  const come = (to, landing, ...args) => {
    const there = placeOf(to.at.x, to.at.z), first = r() < 0.5 ? 1 : -1;
    for (const far of [70, 100, 140, 190]) for (const dir of [first, -first]) {
      const from = there.down + dir * far;
      if (from < 5 || from > riverLength - 5) continue;
      const start = onRiver(from, (r() - 0.5) * 5, new THREE.Vector3());
      start.y += 1.4 + r();
      if (world.plain(start, bird.size)) continue;
      const rise = clamp((to.at.y - level(to.at.x, to.at.z)) * 0.6, 4, 8);
      const points = [start, ...riverLine(from - dir * 6, there.down + dir * rise, { acrossFrom: clamp(placeOf(start.x, start.z).across, -4, 4), acrossTo: clamp(there.across, -4, 4), highFrom: start.y - level(start.x, start.z), highTo: 1.4 }), to.at.clone()];
      bird.at.copy(start); bird.aloft = true;
      if (r() < 0.5) rattle();
      a.to('cruise', { points, landing, args, q: to.q, speed: way.speed, doing: 'flying in low along the river' });
      return true;
    }
    return false;
  };

  return {
    activities: { perch, hover, plunge, beat, roost, cruise },
    // Flushed: off low along the river, rattling, to a post further from the walker; or nowhere near
    refuge() {
      const one = pick({ away: true });
      if (!one) return false;
      rattle();
      return travel(one, 'perch', [one, 1 + r() * 2], { speed: way.dash, doing: 'flying off low along the river, rattling', call: 0 });
    },
    leave, come,
    // where it is when it comes: on a post of its stretch that the walker is not near, and it flies in along the river
    // if they could see it be there from nowhere
    begin() {
      const night = world.day < 0.08, posts = home.posts.filter((p) => world.free(p.point, bird, 0.6) && a.clear(p.point));
      if (!posts.length) { bird.left = night ? Infinity : 6 + r() * 10; return; }
      const post = choose(posts);
      if (night) { a.to('roost', post); return; }
      a.to('perch', post, 0.8);
      if (a.life && !a.life.first && (world.plain(bird.at, bird.size) || r() < 0.6)) {
        if (!come({ at: post.point.clone(), q: bird.q.clone() }, 'perch', post, 0.8)) bird.left = 4 + r() * 8;
      }
    },
  };
}

export default {
  // what a kingfisher's way holds besides what every way has (life/families/index.js)
  fields: {
    range: 'number',                                // its stretch: so many metres down the river either side of its middle
    need: 'number',                                 // the posts a stretch must have, at the least
    hz: 'number', hoverHz: 'number',                // wingbeats a second in flight; hovering
    speed: 'number', dash: 'number', dive: 'number',     // m/s along the river; flushed or going off; the plunge's most
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    spell: nums(2),                                 // seconds it is about its stretch, in one spell, before it goes off
    away: 'number',                                 // the chance that going off at the end of a spell is for good
    search: nums(2),                                // seconds between its looks for a fish from a post
    plunge: 'number', move: 'number',               // the chance a look ends in a plunge from the post; in a move to another post
    hover: { chance: 'number', time: nums(2), high: nums(2), dive: 'number' },     // the chance a look ends in a hover; how long it hovers (s); how high (m over the water); the chance a hover ends in a plunge
    catch: 'number',                                // the chance a plunge takes a fish
    whacks: nums(2),                                // how many times it beats a fish against the limb
    call: { every: nums(2), time: 'number', reach: 'number', doing: 'string' },
    // (and from what every way has, life/bodies.js WAY: `under`, how far its feet go under the water's face in a
    // plunge, which the plunge keeps to (its head and bill go deeper), and `fastest`, which its dash keeps under:
    // the count of walks reads both)
  },
  act: (way) => (bird, world) => live(bird, world, way, plunger),
  // A stretch of the river with posts over it that the walk can see: the posts within `range` metres down the river
  // of one of them, at least `need` of them. A second kingfisher about on the visit is taken for its mate and given
  // the same stretch (the ADW has a pair finishing its nest in April and May, in a territory of 800 to 1,200 m of
  // shoreline, which is more river than the walk sees). So is one that was gone for good, when it comes back: the
  // posts the habitat can read are all within about 90 m of river, and there is no other stretch to go to.
  home: (way) => (habitat, r, taken = []) => {
    const { posts } = riverPosts(habitat);
    if (posts.length < way.need) return null;
    const mate = taken.find((h) => h && h.posts);
    if (mate) return { ...mate };
    for (let tries = 0; tries < 12; tries += 1) {
      const middle = posts[Math.floor(r() * posts.length)].down, mine = posts.filter((p) => Math.abs(p.down - middle) <= way.range);
      if (mine.length < way.need) continue;
      const from = Math.min(...mine.map((p) => p.down)) - 12, to = Math.max(...mine.map((p) => p.down)) + 12, c = onRiver((from + to) / 2);
      return { x: c.x, z: c.z, posts: mine, from, to };
    }
    return null;
  },
};
