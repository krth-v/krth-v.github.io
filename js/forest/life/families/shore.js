import * as THREE from 'three';
import { frame, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';
import { waters, along, alongTheWater, flyActivity, waterAt, riverPoint, riverMid, inFine, placeOf } from '../places/dipper.js';

// The Spotted Sandpiper: a bird of the river's bars and edges. By the agent called dipper, 2026-11-16. Each is one of a
// visit's own; a pair goes about together (`together`), with one home (`bird.home`: { core, spots, all }): a stretch of
// the river's shore round a spot where the cobbles come down to the water, and the spots along it within its kind's
// `range` (life/places/dipper.js: the water's edge on both banks, and boulders low at the water). It walks the water's
// edge picking, teetering as it goes, stands and teeters, flies low out over the water and back to the shore on stiff,
// shallow, flickering wingbeats, calling, and after a spell goes. One of a pair that sees its mate fly off along the
// shore often follows it.
//
// From what was read (the species' sheet names its sources; the research notes of 2026-11-16 quote them): it picks
// food from the surface of the ground or the water, foraging right at the water's edge, and on open flats crouches,
// stalks and dashes; it teeters, the rear of the body bobbing up and down as it walks; it flies low over the water with
// shallow, stiff wingbeats in bursts of flapping and gliding; it calls a clear "peet-weet"; it is solitary, seldom in
// flocks; the female arrives first in May and holds a stretch of shore while she courts a male. The agent's own: every
// distance, time and chance; how fast it teeters; that a pair keeps together on one stretch; how far out over the water
// a flight swings (`out`); that it roosts on the shore it fed on.
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and then
// it flies off low over the water, calling, to a stretch of shore clear of them, or off along the river out of their
// sight; never into the trees.
//
// It walks by gliding over the stones in short surges, a step's length at a time: the bird rig sets both feet together
// (`feet.ahead`), so no foot is put before the other. A gait of steps is for the bird builder's owners.

function shore(a) {
  const { bird, world, way, r } = a, home = bird.home;                 // home: { core, spots, all }
  const rest = bird.sheet.poses.ground, between = (range) => range[0] + r() * (range[1] - range[0]);
  const ways = alongTheWater(a, { hover: way.hover, out: way.out });
  // where it is on the shore (kept across its activities): the spot it came to, and its place on the river's edge
  const at = { spot: null, down: 0, side: -1, from: 0.1, dir: 1 };
  let spell = between(way.spell), again = 0, teeter = r() * 6.283, glide = 0, calls = 0, seen = null;
  // Put up by the walker, for a while it takes no spot nearer them than it is (`shy`; as the dipper: stream.js)
  let shyUntil = -Infinity;
  const shy = (s) => world.clock > shyUntil || s.at.distanceTo(world.eye) > bird.at.distanceTo(world.eye) - 0.5;
  const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = [0, 0, 0, 0], others = [];

  // teetering: the rear of the body and the tail bob up and down, over and over, standing or walking (B, W)
  const teeterOn = (dt, head, extra = {}) => {
    teeter += dt * way.teeter * Math.PI * 2;
    const s = Math.sin(teeter);
    Object.assign(bird.want, { pitch: rest.pitch - 0.14 * s, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
      head, tail: { pitch: rest.tail.pitch + 0.3 * s, fan: 0.02, prop: null }, feet: { mode: 'flat' } }, extra);
  };
  const call = (chance = 1) => { if (r() < chance) world.say(bird, 'call', way.call.reach); };
  // its mate, if one of a pair: the other of its party, wherever it is
  const mate = () => {
    if (!bird.who) return null;
    world.others(bird.at.x, bird.at.z, 150, bird, others);
    return others.find((o) => o.key === bird.key && o.who && o.who.party === bird.who.party) || null;
  };
  // a spot of its own to go to: free, clear of the walker, a few metres off at the least
  const pick = (list = home.spots, near = way.range, least = 4) => {
    const some = list.filter((s) => s !== at.spot && along(s.place, (at.spot || home.core).place) < near && s.at.distanceTo(bird.at) > least
      && world.free(s.at, bird, 0.5) && a.clear(s.at, 1.5) && shy(s));
    return some.length ? some[Math.floor(r() * some.length)] : null;
  };
  const go = (next, doing = 'flying low out over the water') => {
    ways.go(next, next.kind === 'rock' ? 'stand' : 'forage', [next], { doing });
    call(0.75);
    return true;
  };

  // Can it step to `p` (on the edge, `down` metres down the river)? On the fine ground, no stone or animal in the way,
  // in no more than a few centimetres of water, within its stretch, and not on towards the walker.
  const can = (p, down) => {
    if (!inFine(p.x, p.z) || world.solidAt(p.x, p.z, 0.05)) return false;
    p.y = world.height(p.x, p.z);                        // (measured from a point at its own height: from one at none, every animal and the walker were metres off)
    if (world.crowd(p, bird) < 0.35) return false;
    const level = waterAt(p.x, p.z);
    if (Number.isFinite(level) && level - world.height(p.x, p.z) > 0.045) return false;
    if (along({ line: 'river', down, side: at.side }, home.core.place) > way.range) return false;
    return a.clear(p, 0.5) || p.distanceToSquared(world.eye) > bird.at.distanceToSquared(world.eye);
  };

  // ---- walking the water's edge, picking, teetering
  // (`kept`: it is on the edge already, where it walked to before it went to roost, and its place there stands. Begun
  // again from its spot, as any other time, it woke a metre or two from where it slept, in one step: the spot is
  // where it flew in to, and it had walked on along the edge since.)
  const forage = {
    enter(a, spot, kept = false) {
      at.spot = spot;
      if (!kept) {
        if (spot.place.line === 'river') { at.down = spot.place.down; at.side = spot.place.side; }
        at.from = 0.08;
      }
      at.dir = r() < 0.5 ? 1 : -1;
      Object.assign(a.now, { pause: 0.3 + r(), going: 0, walk: between(way.walk), peck: between(way.peck), pecking: 0, move: between(way.move), aim: 0.05, wander: 0,
        look: 0, head: { yaw: 0, pitch: -0.05, roll: 0 }, step: 0, follow: 0, to: null, ask: 0 });
      if (kept) return;
      riverPoint(at.down, at.side, at.from, _p);
      if (Math.hypot(bird.at.x - _p.x, bird.at.z - _p.z) > 0.2) bird.at.set(_p.x, world.height(_p.x, _p.z), _p.z);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', at.spot, true); return; }
      spell -= dt; again -= dt; now.move -= dt; now.look -= dt; now.wander -= dt; now.ask -= dt;
      if (spell < 0 && again <= 0) {
        if (a.leave(r() < way.gone ? Infinity : a.awhile())) return;
        again = 1.5;
      }
      // its mate has flown off along the shore: it follows, a moment later, to near where the mate lands
      if (now.ask < 0) {
        now.ask = 0.4;
        const m = mate();
        if (m && m.state === 'fly' && m.flight && !m.flight.through && m.flight !== seen) {
          seen = m.flight;
          if (m.flight.d.distanceTo(bird.at) > 10 && r() < way.follow) {
            const near = home.all.filter((s) => s.at.distanceTo(m.flight.d) < 8 && s.at.distanceTo(m.flight.d) > 2 && world.free(s.at, bird, 0.5) && a.clear(s.at, 1.5) && shy(s));
            if (near.length) { now.to = near[Math.floor(r() * near.length)]; now.follow = 0.5 + r() * 1.5; }
          }
        } else if (m && now.pause > 0) {
          // (and it keeps near its mate along the shore)
          const there = placeOf(m.at.x, m.at.z);
          if (there.line === 'river' && Math.abs(there.down - at.down) > 12) at.dir = Math.sign(there.down - at.down) || at.dir;
        }
      }
      if (now.to && (now.follow -= dt) < 0) { const to = now.to; now.to = null; if (world.free(to.at, bird, 0.5) && a.clear(to.at, 1.5)) { go(to, 'flying after its mate, low over the water'); return; } }
      if (now.move < 0) { now.move = between(way.move); const next = pick(); if (next) { go(next); return; } }
      // a peck at the surface
      if (now.pecking > 0) {
        now.pecking -= dt;
        teeterOn(dt, { yaw: 0, pitch: -1.05, roll: 0 }, { pitch: rest.pitch - 0.3, lift: rest.lift - 0.05 });
        bird.doing = 'picking at the water\'s edge';
        return;
      }
      if (now.going > 0 && (now.peck -= dt) < 0) { now.peck = between(way.peck); now.pecking = 0.16 + r() * 0.16; return; }
      // standing, teetering, looking about
      if (now.pause > 0) {
        now.pause -= dt;
        if (now.look < 0) { now.look = 0.5 + r() * 1.5; now.head = { yaw: (r() - 0.5) * 1.6, pitch: -0.15 + r() * 0.25, roll: 0 }; }
        teeterOn(dt, now.head);
        bird.doing = 'standing at the water\'s edge, teetering';
        if (now.pause <= 0) { now.going = between([1.5, 6]); now.walk = between(way.walk); if (r() < 0.3) at.dir = -at.dir; }
        return;
      }
      if ((now.going -= dt) < 0) { now.pause = between(way.pause); return; }
      // walking: along the edge in short surges, a step at a time, now on the wet stones and now in the edge of the water
      if (now.wander < 0) { now.wander = 1 + r() * 2; now.aim = -0.14 + r() * 0.42; }
      now.step += dt * 4.5 * Math.PI * 2;
      const v = now.walk * (0.55 + 0.45 * Math.cos(now.step));
      const down = at.down + at.dir * v * dt, from = at.from + (now.aim - at.from) * Math.min(1, dt * 1.5);
      riverPoint(down, at.side, from, _p);
      if (!can(_p, down)) { at.dir = -at.dir; now.pause = 0.3 + r() * 0.8; return; }
      at.down = down; at.from = from;
      bird.at.set(_p.x, world.height(_p.x, _p.z), _p.z);
      // facing along the edge the way it goes, turned a little towards the water
      riverMid(down, _m);
      _f.set(_m[2] * at.dir + _m[3] * at.side * 0.25, 0, _m[3] * at.dir - _m[2] * at.side * 0.25);
      frame(_f, UP, _q); bird.q.slerp(_q, Math.min(1, dt * 6));
      teeterOn(dt, { yaw: 0.25 * Math.sin(world.clock * 1.7), pitch: -0.2, roll: 0 });
      bird.doing = 'walking the water\'s edge, teetering';
    },
  };

  // ---- on a boulder by the water: teetering, looking about, and then off
  const onRock = {
    enter(a, spot) {
      at.spot = spot;
      Object.assign(a.now, { stay: between(way.pause) * 3, look: 0, head: { yaw: 0, pitch: -0.05, roll: 0 } });
      if (bird.at.distanceToSquared(spot.at) > 0.0025) { bird.at.copy(spot.at); bird.q.copy(spot.face(r)); }
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', at.spot); return; }
      spell -= dt; again -= dt; now.stay -= dt; now.look -= dt;
      if (now.look < 0) { now.look = 0.5 + r() * 1.5; now.head = { yaw: (r() - 0.5) * 1.6, pitch: -0.15 + r() * 0.25, roll: 0 }; }
      teeterOn(dt, now.head);
      bird.doing = 'on a stone by the water, teetering';
      if (spell < 0 && again <= 0) {
        if (a.leave(r() < way.gone ? Infinity : a.awhile())) return;
        again = 1.5;
      }
      if (now.stay > 0) return;
      now.stay = between(way.pause);
      const edges = home.spots.filter((s) => s.kind === 'edge');
      const next = pick(r() < 0.75 && edges.length ? edges : home.spots);
      if (next) go(next, 'flying low over the water');
    },
  };

  // ---- at roost on the shore it fed on, by night (`walked`: it went to roost from the edge it was walking, and
  // wakes there)
  const roost = {
    wary: false,
    enter(a, spot, walked = false) { at.spot = spot || at.spot; a.now.walked = walked; },
    step(a) {
      if (world.day >= 0.08) { a.to(at.spot && at.spot.kind === 'rock' ? 'stand' : 'forage', at.spot || home.core, a.now.walked); return; }
      Object.assign(bird.want, { pitch: rest.pitch + 0.05, lift: rest.lift - 0.25, lean: 0, spread: 0, flap: 0, gape: 0,
        head: { yaw: 0, pitch: -0.2, roll: 0 }, tail: { pitch: rest.tail.pitch, fan: 0.02, prop: null }, feet: { mode: 'flat' } });
      bird.doing = 'at roost on the shore';
    },
  };

  // its wings in flight: stiff, shallow, quick beats with the wings held low, broken by short glides on bowed wings
  // (B, W: "shallow, stiff wing-beats and bursts of flapping and gliding"); the rate and the glides' length are the agent's
  const wings = (a, dt, flare) => {
    glide -= dt;
    if (glide < -between(way.beats)) glide = between(way.glide);
    const gliding = glide > 0 && flare === 0;
    if (!gliding) bird.beat += dt * way.hz * Math.PI * 2;
    Object.assign(bird.want, { pitch: 0.03 + 0.5 * flare, lift: 0.6, lean: 0, spread: 1,
      flap: gliding ? -0.3 : 0.3 * Math.sin(bird.beat) - 0.12, hand: gliding ? -0.2 : 0.2 * Math.sin(bird.beat - 0.6) - 0.06, sweep: 0.18 - 0.35 * flare,
      droop: 0, gape: 0, head: { yaw: 0, pitch: 0, roll: 0 }, tail: { pitch: 0.04 + 0.15 * flare, fan: 0.1 + 0.35 * flare, prop: null }, feet: { mode: flare > 0.5 ? 'flat' : 'tuck' } });
    bird.snap = true;
    // and its call as it goes, now and then
    if ((calls -= dt) < 0) { calls = 1.2 + r() * 2.4; if (flare === 0) call(0.45); }
  };

  return {
    activities: { forage, stand: onRock, roost, fly: flyActivity(a, wings, ways) },
    // off along the river, calling as it goes ("peet-weet": B, W), whether its spell is over or the walker put it up
    leave: (seconds) => { if (!ways.leave(seconds)) return false; call(); return true; },
    come: ways.come,
    // Flushed: off low over the water to a stretch of its shore clear of the walker, calling, never past them; or off.
    refuge() {
      const some = home.all.filter((s) => s !== at.spot && along(s.place, (at.spot || home.core).place) < way.range * 1.6
        && s.at.distanceTo(bird.at) > 6 && world.free(s.at, bird, 0.5) && a.clear(s.at, 2.5));
      for (let tries = 0; tries < 4 && some.length; tries += 1) {
        const next = some.splice(Math.floor(r() * some.length), 1)[0];
        const by = (next.at.x - bird.at.x) * (world.eye.x - bird.at.x) + (next.at.z - bird.at.z) * (world.eye.z - bird.at.z);
        if (by > 0 && next.at.distanceTo(bird.at) > bird.at.distanceTo(world.eye)) continue;
        ways.go(next, next.kind === 'rock' ? 'stand' : 'forage', [next], { doing: 'flying off low over the water, calling' });
        call();
        shyUntil = world.clock + 20 + r() * 25;
        return true;
      }
      return false;
    },
    // where it is when it comes: at the water's edge of its stretch, or on a stone there, where the walker is not near;
    // it flies in along the water if they could see it be there from nowhere
    begin() {
      const night = world.day < 0.08, spots = home.spots.filter((s) => world.free(s.at, bird, 0.5) && a.clear(s.at));
      if (!spots.length) { bird.left = night ? Infinity : 6 + r() * 10; return; }
      const edges = spots.filter((s) => s.kind === 'edge'), from = edges.length && r() < 0.85 ? edges : spots;
      const spot = from[Math.floor(r() * from.length)];
      bird.at.copy(spot.at); bird.q.copy(spot.face(r));
      a.to(night ? 'roost' : spot.kind === 'rock' ? 'stand' : 'forage', spot);
      if (night) return;
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone() }, spot.kind === 'rock' ? 'stand' : 'forage', spot)) bird.left = 4 + r() * 8;
      }
    },
  };
}

export default {
  // what a sandpiper's way holds besides what every way has (life/families/index.js)
  fields: {
    range: 'number',                                // how far along the shore its doings take it from the middle of its home (m)
    apart: 'number',                                // no nearer than this along the water to another of its kind's home (m)
    need: 'number',                                 // the spots at the water's edge a home must have, at the least
    hz: 'number', speed: 'number', hover: nums(2),  // wingbeats a second; how fast it flies (m/s); how high over the water (m)
    out: 'number',                                  // how far out over the river a flight along its own bank swings (m)
    beats: nums(2), glide: nums(2),                 // seconds of beating, and of gliding, in flight
    spell: nums(2),                                 // seconds it is about, in one spell, before it goes
    walk: nums(2), teeter: 'number',                // how fast it walks (m/s); teeters a second
    pause: nums(2), peck: nums(2),                  // seconds standing between walks; between pecks as it walks
    move: nums(2),                                  // seconds between flights of its own to another stretch of its shore
    follow: 'number',                               // the chance one of a pair follows its mate when the mate flies off along the shore
    call: { reach: 'number' },
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
  },
  act: (way) => (bird, world) => live(bird, world, way, shore),
  // a stretch of the river's shore round a spot where the cobbles come down to the water, with `need` such spots
  // within its `range`, and no other sandpiper's home within `apart` along the water
  home: (way) => (habitat, r, taken = []) => {
    const w = waters(habitat);
    const all = w.spots.filter((s) => s.place.line === 'river' && (s.kind === 'edge' || (s.kind === 'rock' && s.at.y - s.level < 0.35)));
    const cores = all.filter((s) => s.kind === 'edge');
    for (let tries = 0; tries < 30 && cores.length; tries += 1) {
      const core = cores[Math.floor(r() * cores.length)];
      if (taken.some((h) => h && h.core && along(h.core.place, core.place) < way.apart)) continue;
      const spots = all.filter((s) => along(s.place, core.place) < way.range);
      if (spots.filter((s) => s.kind === 'edge').length >= way.need) return { core, spots, all, x: core.at.x, z: core.at.z };
    }
    return null;
  },
};
