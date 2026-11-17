import * as THREE from 'three';
import { frame, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';
import { waters, along, alongTheWater, flyActivity, wadeFrom, waterAt } from '../places/dipper.js';

// The American Dipper: a bird of fast water that never leaves it. By the agent called dipper, 2026-11-16. Each is one
// of a visit's own, with a home (`bird.home`: { core, spots, all }): a stretch of water round a rock in the creek below
// the falls, the falls' lip, or a boulder at the river's edge, and the spots along it within its kind's `range`
// (life/places/dipper.js: rocks, the lip, the water's edge). It stands on a rock bobbing, walks into the water and
// under it, flies low and straight along the water from one rock to the next, sings, and after a spell goes.
//
// From what was read (the species' sheet names its sources; the research notes of 2026-11-16 quote them): fast, clear
// streams with riffles, boulders and falls; it bobs its whole body, bending its legs to crouch and then standing, and
// sometimes blinks its white eyelid as it does; it walks rapidly in shallow water and along the shore, walks with its
// head under the water along the bottom, dives with a stroke or two of its wings and uses them to stay down; its
// flight follows the stream's bends under 2 m above the water, and flights over land or higher are rare; it sings in
// every season, loudly, a jumble of notes and trills, for minutes on end, and calls a harsh "jik" in flight. The
// agent's own: every distance, time and chance; how deep it goes (`deepest`); how long a dip takes; that it roosts on
// a rock of its own stretch (dippers roost in crevices, behind falls and under bridges: none of those is built).
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then it flies along the water to a rock clear of them, calling, or off along the water out of their sight; never
// into the trees.
//
// The blink. The bird builder has no eyelid, so there is nothing to draw: the dip sets `bird.blink` (1 for a tenth of a
// second, at half the dips, and 0 otherwise), which nothing reads yet, for a lid when one is built (the bird builder's
// owners). It is kept on the bird and not in `want`, which holds only the bird plan's own pose fields.

function stream(a) {
  const { bird, world, way, r } = a, home = bird.home;                 // home: { core, spots, all }
  const rest = bird.sheet.poses.ground, between = (range) => range[0] + r() * (range[1] - range[0]);
  const ways = alongTheWater(a, { hover: way.hover });
  const at = { spot: null };                                           // the spot it stands on, kept across its activities
  let spell = between(way.spell), again = 0, song = between(way.song.every) * (0.3 + 0.7 * r());
  // Put up by the walker, for a while it takes no spot nearer them than it is (`shy`): it goes on with what it does,
  // and does not come straight back to them (the harness of 2026-11-16 had one fly back 25 m towards a walker who
  // stood where they had put it up, a second and a half after it landed). The while is the agent's.
  let shyUntil = -Infinity;
  const shy = (s) => world.clock > shyUntil || s.at.distanceTo(world.eye) > bird.at.distanceTo(world.eye) - 0.5;
  const _t = new THREE.Vector3(), _f = new THREE.Vector3(), _q = new THREE.Quaternion();

  // the stance on a rock, and the dip from it: bending its legs to crouch, and standing (B)
  const stand = (head, dip = 0, extra = {}, blink = 0) => {
    bird.blink = blink;
    return Object.assign(bird.want, {
      pitch: rest.pitch - 0.1 * dip, lift: rest.lift - 0.3 * dip, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
      head, tail: { pitch: rest.tail.pitch + 0.2 * dip, fan: 0.03, prop: null }, feet: { mode: 'flat' } }, extra);
  };
  // turned towards `point` over a moment, upright
  const turnTo = (point, dt, rate = 8) => {
    _f.subVectors(point, bird.at).setY(0);
    if (_f.lengthSq() < 1e-8) return;
    frame(_f, UP, _q);
    bird.q.slerp(_q, Math.min(1, dt * rate));
  };
  // a spot of its own to go to: free, clear of the walker, not the one it is on; `near`: within that many metres along the water
  const pick = (list, near = way.range, least = 2) => {
    const some = list.filter((s) => s !== at.spot && along(s.place, (at.spot || home.core).place) < near && s.at.distanceTo(bird.at) > least
      && world.free(s.at, bird, 0.5) && a.clear(s.at, 1.5) && shy(s));
    const best = some.filter((s) => s.kind !== 'edge');
    const from = best.length && r() < 0.75 ? best : some;
    return from.length ? from[Math.floor(r() * from.length)] : null;
  };
  const call = () => world.say(bird, 'call', way.call.reach);
  const bobbing = () => (at.spot.kind === 'lip' ? 'bobbing at the brink of the falls' : at.spot.kind === 'edge' ? 'bobbing at the water\'s edge' : 'bobbing on a rock in the stream');

  // ---- on a rock, the lip or the water's edge
  const onRock = {
    enter(a, spot, wait = 0.5 + r() * 1.2) {
      at.spot = spot;
      Object.assign(a.now, { wait, dips: between(way.dip), dipping: 0, blinking: false, look: 0, head: { yaw: 0, pitch: 0.05, roll: 0 }, singing: 0, stay: between(way.stand) });
      if (bird.at.distanceToSquared(spot.at) > 0.0025) { bird.at.copy(spot.at); bird.q.copy(spot.face(r)); }
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', at.spot); return; }
      now.wait -= dt; now.stay -= dt; spell -= dt; song -= dt; now.look -= dt; again -= dt;
      // singing: upright, the bill opening and closing, no dipping (a jumble of notes and trills: B)
      if (now.singing > 0) {
        now.singing -= dt;
        stand({ yaw: now.head.yaw * 0.4, pitch: 0.4, roll: 0 }, 0, { pitch: rest.pitch + 0.18, gape: (now.singing * 7) % 1 > 0.45 ? 0.55 : 0.12 });
        bird.doing = 'singing from a rock in the stream';
        return;
      }
      // the dip: about a third of a second, down and up; half of them with a blink
      if (now.dipping > 0) {
        now.dipping -= dt;
        const k = 1 - now.dipping / 0.32, dip = Math.sin(Math.PI * Math.min(1, k)) ** 2;
        stand(now.head, dip, {}, now.blinking && k > 0.35 && k < 0.7 ? 1 : 0);
        bird.snap = true;
        bird.doing = bobbing();
        return;
      }
      if ((now.dips -= dt) < 0) { now.dips = between(way.dip); now.dipping = 0.32; now.blinking = r() < 0.5; }
      // it looks about, and down into the water
      if (now.look < 0) { now.look = 0.6 + r() * 1.8; now.head = r() < 0.3 ? { yaw: (r() - 0.5) * 0.6, pitch: -0.55, roll: 0 } : { yaw: (r() - 0.5) * 2, pitch: -0.1 + r() * 0.3, roll: (r() - 0.5) * 0.2 }; }
      stand(now.head);
      bird.doing = bobbing();
      if (now.wait > 0) return;
      // its spell is over: off along the water, for a while or for good (with no way out found it looks again in a moment)
      if (spell < 0 && again <= 0) {
        if (a.leave(r() < way.gone ? Infinity : a.awhile())) return;
        again = 1.5;
      }
      if (song < 0) {
        song = between(way.song.every); now.singing = between(way.song.time);
        world.say(bird, 'song', way.song.reach, now.singing);
        return;
      }
      if (now.stay > 0) return;
      now.stay = between(way.stand);
      const roll = r();
      if (roll < way.wade && at.spot.kind !== 'lip' && into()) return;
      if (roll < way.wade + way.move) {
        const next = pick(home.spots);
        if (next) { ways.go(next, 'stand', [next], { doing: 'flying low along the water' }); if (r() < 0.4) call(); return; }
      }
    },
  };

  // Into the water from where it stands: a few steps in from the water's edge, or a hop down off a rock; walking where
  // it is shallow (`wade`), under where it is deep enough (`under`), on a line over the bed (life/places/dipper.js
  // `wadeFrom`) that goes upstream more often than not and keeps clear of the walker.
  const into = () => {
    const spot = at.spot, out = spot.rock ? spot.rock.r + 0.09 : 0.1;
    _t.set(spot.at.x + spot.into[0] * out, 0, spot.at.z + spot.into[1] * out);
    const level = waterAt(_t.x, _t.z), bed = world.height(_t.x, _t.z);
    if (!Number.isFinite(level) || level - bed > way.deepest || world.solidAt(_t.x, _t.z, 0.06)) return false;
    const list = [];
    if (wadeFrom(world, _t, spot.into, way.deepest, r, 30 + Math.floor(r() * 50), list) < 8) return false;
    if (!list.every((p, i) => i > 12 || a.clear(p.at, 0.5))) return false;
    list.unshift({ at: new THREE.Vector3(_t.x, bed, _t.z), depth: level - bed, level });
    const deep = level - bed > way.below;
    if (spot.rock || deep) {
      // a hop down into it: onto the bed beside the rock
      _f.set(spot.into[0], 0, spot.into[1]);
      a.fly({ at: list[0].at.clone(), q: frame(_f, UP, _q).clone(), rise: 0.04, floor: null }, deep ? 'under' : 'wade', list, 0);
      bird.doing = deep ? 'diving into the stream' : 'hopping down into the water';
      return true;
    }
    a.to('wade', list, 0);
    return true;
  };
  // out of the water: up onto a rock or the edge near by, or along the water to another spot
  const out = () => {
    let best = null, least = 4;
    for (const s of home.all) {
      const d = s.at.distanceTo(bird.at);
      if (d < least && s.kind !== 'lip' && world.free(s.at, bird, 0.4) && a.clear(s.at, 0.5) && shy(s)) { least = d; best = s; }
    }
    if (best) { a.fly({ at: best.at.clone(), q: best.face(r).clone(), rise: 0.12, floor: null }, 'stand', best, 0.4); bird.doing = 'out of the water onto a rock'; return true; }
    const next = pick(home.spots, way.range, 0);
    if (next) { ways.go(next, 'stand', [next], { doing: 'up out of the water and off along it' }); return true; }
    return a.leave(a.awhile());
  };

  // Walking over the bed: `now.list` the line, `now.i` the last of its points it has passed (-1: none yet). False at
  // the line's end. At something in its way it turns back along its line, as it would at a stone: at another animal
  // on the line (0.3 m: it took no account of any, and waded into a sandpiper at the edge), and at the walker, where
  // its next step would take it on towards them inside the distance that puts it up (its own doings never do:
  // life/behave.js). It used to get out of the water and fly for that, which was to answer a walker who had not put
  // it up. If the way back is barred as well, it stands where it is; only the skeleton's flush puts it up.
  const barred = (next) => {
    if (!a.clear(next, 0.5) && next.distanceToSquared(world.eye) < bird.at.distanceToSquared(world.eye)) return true;
    const near = world.crowd(next, bird);
    return near < 0.3 && near < world.crowd(bird.at, bird);
  };
  const walk = (now, dt, speed) => {
    let left = speed * dt;
    while (left > 0 && now.i < now.list.length - 1) {
      const list = now.list, next = list[now.i + 1].at, d = Math.hypot(next.x - bird.at.x, next.z - bird.at.z);
      if (barred(next)) {
        // (back the way it came: the points it has passed, the last of them first)
        if (now.i >= 0) { now.list = list.slice(0, now.i + 1).reverse(); now.i = -1; }
        return true;
      }
      if (d <= left) { left -= d; now.i += 1; bird.at.x = next.x; bird.at.z = next.z; continue; }
      turnTo(next, dt);
      bird.at.x += ((next.x - bird.at.x) / d) * left; bird.at.z += ((next.z - bird.at.z) / d) * left;
      left = 0;
    }
    bird.at.y = world.height(bird.at.x, bird.at.z);
    return now.i < now.list.length - 1;
  };
  // Out of the water; or, with nowhere to go, a look again half a second on, and not in every frame: the search is
  // not a light one. (The wait was kept in the bout's own clock, which the line's end and the night never read, so
  // for those it was looked for in every frame.)
  const getOut = (now) => { if (now.again > 0) return; if (!out()) now.again = 0.5; };
  // the depth of the water over the bed where it is
  const depth = () => { const level = waterAt(bird.at.x, bird.at.z); return Number.isFinite(level) ? level - bird.at.y : 0; };

  // ---- wading where it is shallow, its head under the water, picking at the bottom (B: it walks with its head under)
  // Wading and walking under the water are one bout on one line over the bed: `bout` is what is left of it, handed
  // from the one to the other, and where it is on the line is where it is (neither puts it back on the line's last
  // point: when they did, it went under, walked on into the shallower water, came up, was put back into the deeper
  // water it had left, went under again, and walked the same stretch over and over, found by the second smoke run).
  const wade = {
    enter(a, list, i = 0, bout = between(way.feed)) {
      Object.assign(a.now, { list, i, time: bout, peek: 0.6 + r() * 1.5, up: 0, since: 0, again: 0 });
    },
    step(a, dt) {
      const now = a.now;
      now.again -= dt;
      if (world.day < 0.08 || (now.time -= dt) < 0) { getOut(now); return; }
      // (deeper, it goes under; not before it has waded a moment)
      if ((now.since += dt) > 1.2 && depth() > way.below) { a.to('under', now.list, now.i, now.time); return; }
      // it lifts its head out every so often to look about
      if ((now.peek -= dt) < 0) { now.up = 0.5 + r() * 0.5; now.peek = 1 + r() * 2.5; }
      now.up -= dt;
      const up = now.up > 0, go = up ? 0 : 0.28 * (0.6 + 0.4 * Math.sin(world.clock * 13));
      if (!walk(now, dt, go) && !up) { getOut(now); return; }
      bird.blink = 0;
      Object.assign(bird.want, { pitch: up ? 0.1 : -0.2, lift: 0.68, lean: 0, spread: 0, flap: 0, gape: 0,
        head: { yaw: up ? 0.6 * Math.sin(world.clock * 1.3) : 0.25 * Math.sin(world.clock * 5), pitch: up ? 0.05 : -1.0, roll: 0 },
        tail: { pitch: rest.tail.pitch, fan: 0.04, prop: null }, feet: { mode: 'flat' } });
      bird.doing = up ? 'standing in the shallows, looking about' : 'wading in the shallows, its head under the water';
    },
  };

  // ---- under the water: walking on the bottom with its wings half open, holding itself down (B)
  const under = {
    enter(a, list, i = 0, bout = between(way.feed)) {
      Object.assign(a.now, { list, i, bout, time: Math.min(bout, between(way.dive)), since: 0, again: 0 });
    },
    step(a, dt) {
      const now = a.now;
      now.bout -= dt; now.again -= dt;
      // (its breath, `time`, or the bout over: up and out onto a rock, or off along the water)
      if ((now.time -= dt) < 0 || world.day < 0.08) { getOut(now); return; }
      // (it comes up where the water no longer covers it: `below` is a little more than it stands tall walking on the
      // bottom, and at 0.8 of that only the top of its back is awash; at 0.55 a third of it stood out of the water, and
      // the card said it was under: seen in the second smoke run's close-up)
      if ((now.since += dt) > 1.2 && depth() < way.below * 0.8) { a.to('wade', now.list, now.i, Math.max(0.5, now.bout)); return; }
      if (!walk(now, dt, 0.32)) { getOut(now); return; }
      bird.beat += dt * 5 * Math.PI * 2;
      bird.blink = 0;
      Object.assign(bird.want, { pitch: -0.32, lift: 0.55, lean: 0, spread: 0.32, flap: 0.12 * Math.sin(bird.beat), hand: -0.1, sweep: 0.3, droop: 0, gape: 0,
        head: { yaw: 0.3 * Math.sin(world.clock * 4), pitch: -0.45, roll: 0 }, tail: { pitch: 0.15, fan: 0.2, prop: null }, feet: { mode: 'flat' } });
      bird.doing = 'walking on the bottom, under the water';
    },
  };

  // ---- at roost, on a rock of its own stretch, by night
  const roost = {
    wary: false,
    enter(a, spot) { at.spot = spot; if (spot && bird.at.distanceToSquared(spot.at) > 0.0025) { bird.at.copy(spot.at); bird.q.copy(spot.face(r)); } },
    step(a) {
      if (world.day >= 0.08) { a.to('stand', at.spot, 0.6); return; }
      stand({ yaw: 0, pitch: -0.15, roll: 0 }, 0.6, { pitch: rest.pitch - 0.05 });
      bird.doing = 'at roost on a rock by the water';
    },
  };

  // its wings in flight along the water: quick, whirring beats all the way (the agent's: no source read gives a rate)
  const wings = (a, dt, flare) => {
    bird.beat += dt * way.hz * Math.PI * 2;
    Object.assign(bird.want, { pitch: 0.04 + 0.5 * flare, lift: 0.6, lean: 0, spread: 1, flap: 0.62 * Math.sin(bird.beat) + 0.12, hand: 0.45 * Math.sin(bird.beat - 1.0), sweep: 0.1 - 0.3 * flare,
      droop: 0, gape: 0, head: { yaw: 0, pitch: 0, roll: 0 }, tail: { pitch: 0.05 + 0.2 * flare, fan: 0.1 + 0.35 * flare, prop: null }, feet: { mode: flare > 0.5 ? 'flat' : 'tuck' } });
    bird.blink = 0;
    bird.snap = true;
  };

  return {
    activities: { stand: onRock, wade, under, roost, fly: flyActivity(a, wings, ways) },
    // off along the water, calling as it goes (B: a harsh "jik" in flight), whether its spell is over or the walker put it up
    leave: (seconds) => { if (!ways.leave(seconds)) return false; call(); return true; },
    come: ways.come,
    // Flushed: along the water to a spot of its own that is clear of the walker, calling, never past them; or off.
    refuge() {
      const some = home.all.filter((s) => s !== at.spot && s.kind !== 'edge' && along(s.place, (at.spot || home.core).place) < way.range * 1.6
        && s.at.distanceTo(bird.at) > 5 && world.free(s.at, bird, 0.5) && a.clear(s.at, 2.5));
      for (let tries = 0; tries < 4 && some.length; tries += 1) {
        const next = some.splice(Math.floor(r() * some.length), 1)[0];
        // (not by a way that passes the walker)
        const by = (next.at.x - bird.at.x) * (world.eye.x - bird.at.x) + (next.at.z - bird.at.z) * (world.eye.z - bird.at.z);
        if (by > 0 && next.at.distanceTo(bird.at) > bird.at.distanceTo(world.eye)) continue;
        ways.go(next, 'stand', [next], { doing: 'flying off low along the water, calling' });
        call();
        shyUntil = world.clock + 20 + r() * 25;
        return true;
      }
      return false;
    },
    // where it is when it comes: on a rock of its home the walker is not near (the rocks and the lip before the edge);
    // it flies in along the water if they could see it be there from nowhere
    begin() {
      const night = world.day < 0.08, spots = home.spots.filter((s) => world.free(s.at, bird, 0.5) && a.clear(s.at));
      if (!spots.length) { bird.left = night ? Infinity : 6 + r() * 10; return; }
      const best = spots.filter((s) => s.kind !== 'edge'), from = best.length && r() < 0.8 ? best : spots;
      const spot = from[Math.floor(r() * from.length)];
      bird.at.copy(spot.at); bird.q.copy(spot.face(r));
      a.to(night ? 'roost' : 'stand', spot, 0.6);
      if (night) return;
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: spot.at.clone(), q: bird.q.clone() }, 'stand', spot, 0.6)) bird.left = 4 + r() * 8;
      }
    },
  };
}

export default {
  // what a dipper's way holds besides what every way has (life/families/index.js)
  fields: {
    range: 'number',                                // how far along the water its doings take it from the middle of its home (m)
    apart: 'number',                                // no nearer than this along the water to another of its kind's home (m)
    need: 'number',                                 // the spots a home must have, at the least
    deepest: 'number', below: 'number',             // the deepest water it walks into (m); deeper than this it is under (more than it stands tall in that pose)
    hz: 'number', speed: 'number', hover: nums(2),  // wingbeats a second; how fast it flies (m/s); how high over the water (m)
    spell: nums(2),                                 // seconds it is about, in one spell, before it goes
    dip: nums(2),                                   // seconds between its dips
    stand: nums(2),                                 // seconds on a rock between one thing and the next
    wade: 'number', move: 'number',                 // the chances, then, that it goes into the water, or along it to another rock
    feed: nums(2), dive: nums(2),                   // seconds in the shallows, and under the water, at a time
    song: { every: nums(2), time: nums(2), reach: 'number' },
    call: { reach: 'number' },
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
  },
  act: (way) => (bird, world) => live(bird, world, way, stream),
  // a stretch of water round a rock or the falls' lip, with `need` spots within its `range`, and no other dipper's
  // home within `apart` along the water (a dipper keeps a stretch of stream to itself)
  home: (way) => (habitat, r, taken = []) => {
    const w = waters(habitat), cores = w.spots.filter((s) => s.kind === 'rock' || s.kind === 'lip');
    for (let tries = 0; tries < 30 && cores.length; tries += 1) {
      const core = cores[Math.floor(r() * cores.length)];
      if (taken.some((h) => h && h.core && along(h.core.place, core.place) < way.apart)) continue;
      const spots = w.spots.filter((s) => along(s.place, core.place) < way.range);
      if (spots.length >= way.need) return { core, spots, all: w.spots, x: core.at.x, z: core.at.z };
    }
    return null;
  },
};
