import * as THREE from 'three';
import { frame, UP } from '../agents.js';
import { live } from '../behave.js';
import { optional, nums, test, headingOf } from '../bodies.js';
import { mulberry32 } from '../../world/layout.js';
import { batPlaces, floorAt, overWater, pointOn, nearestOn } from '../places/bats2.js';

// The bats of the valley: the Yuma Myotis, the Little Brown Myotis, the Silver-haired Bat and the Big Brown Bat. Each
// is only ever one of a visit's own, and lives on the wing: from dusk it hunts a beat of its own (life/places/bats2.js)
// over the river, the creek, the old clearing or along the clearing's edge, in quick flight that turns sharply, dips
// and swoops after insects; before dawn it goes back to its roost. By day it is in its roost, under bark or in a
// hollow tree, where nobody sees it: on a visit it is then away (`bird.left`), and now and then, late in the afternoon,
// one is out before its time. Nothing of it is drawn but a bat in flight.
//
// From what was read (the species' files name their sources): the Yuma Myotis is "exclusively associated with open
// water", feeds "just a few inches above the surface of water, repeatedly flying regular routes", up and down rivers
// "in relatively straight patterns", and takes prey from the water's face with its feet and tail membrane; activity
// starts "a few minutes before sunset" (the Handbook of the Mammals of the World, vol. 9, 2019). The Little Brown
// Myotis hunts over water, in wooded places and over fields, "commonly within 5 m of the ground", in circles and
// zigzags, and comes out at dusk. The Silver-haired Bat "cannot forage in closed habitats", hunts over small ponds and
// streams or treetops, is a slow flier that "fly erratically taking many twists and frequent short glides", and
// forages "right before and shortly after sunset". The Big Brown Bat's flight is "strong, direct, and moderately fast"
// (the Encyclopedia of Puget Sound), up to 33 km/h, its height from 50 m down to 10 to 15 m over forest and 5 m over a
// stream under trees, and it starts "leaving roosts well before sunset". The Olympic park: "Occasionally, you may see
// a bat out in daylight." Every one of them roosts by day in trees: under loose bark, in cracks and hollows.
// The agent's own: every distance, height, speed (but the Big Brown Bat's highest), time and chance below; which of
// the beats each kind hunts; that a bat keeps two to four metres off a walker and is never put up by one (the task's
// own call: "a walker never startles it"); and that it hunts one beat for some minutes and then goes off a while.
//
// What it says: nothing. A bat's calls here are beyond hearing (the Yuma Myotis's sweep from 59 to 72 kHz down to 45
// to 50, the Little Brown's from 80 to 40, the Silver-haired's from 46 to 26, the Big Brown's from 48 to 27: the
// Handbook), and the walker hears none of them, so no voice is given and nothing is said.
//
// It lives on life/behave.js, with three things of its own. Its flight is its own activity, `fly` (in place of the
// bird's, whose pose is a bird's: a kind's `want` is in its own plan's pose fields), so that the visit takes it as on
// the wing; it goes off and comes in by its own flights (`leave`, `come`); and it takes the walker its own way
// (`react`): it is never startled, and simply flies round them.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const wrap = (x) => Math.atan2(Math.sin(x), Math.cos(x));
const DEG = 180 / Math.PI;
const _list = [], _others = [], _o = new THREE.Vector3(), _n = new THREE.Vector3(), _q = new THREE.Quaternion();
const P = { x: 0, z: 0, dx: 1, dz: 0 };

function bat(a) {
  const { bird, world, way, r } = a, home = bird.home;                 // home: { haunt, beat, low, high }
  const beat = home.beat, hz = bird.sheet.flight.rate;
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  const floor = (x, z) => floorAt(world, x, z);
  // How it flies, kept across its activities: its heading (yaw, radians: 0 is +x, a quarter turn +z, its right),
  // its speed over the ground and up, how fast it is turning, where it is in its wingbeat, and what it is in the
  // middle of (a quick turn after an insect, a dip to the water, a glide).
  const fly = { yaw: r() * 6.283, speed: between(way.speed), cruise: between(way.speed), vy: 0, rate: 0, phase: r(), flap: 1,
    jink: 0, jinkRate: 0, nextJink: between(way.jink), dip: 0, nextDip: way.dip ? between(way.dip) : Infinity,
    glide: 0, nextGlide: way.glide ? between(way.glide.every) : Infinity, scoop: 0, pitch: 0, roll: 0, head: 0 };
  // where it is going on its beat: the next place in the air (`wp`), how far along its beat's line that is, and
  // which way along it the bat is working
  const wp = new THREE.Vector3(), lowest = Math.min(home.low, 0.5);
  // (`mode`: out at its time, 'night', or before it, 'early'; `spell`: the seconds it has left on its beat)
  const at = { u: 0, dir: r() < 0.5 ? 1 : -1, set: false, mode: 'night', spell: Infinity, again: 0, next: null };
  const hunting = () => way.hunting[home.haunt] || 'hunting insects on the wing';
  // how near a place it has to come before it has reached it: a fast bat that turns wide would circle a point
  const reach = (least) => Math.max(least, (1.3 * fly.speed) / way.turn);

  // ---- the hour, as a bat keeps it
  // the hour now (the visit's own, and the time since it began), and whether it is the morning (when the light that
  // grows sends a bat in, where the light that fades in the evening brings it out)
  const hour = () => ((((world.hour ?? 12) + world.clock / 3600) % 24) + 24) % 24;
  const morning = () => { const h = hour(); return h >= 2.5 && h < 12; };
  const dark = () => (morning() ? world.day < way.dawn : world.day < way.emerge);
  // By day it is in its roost. Late in the afternoon one may be out, now and then: decided afresh at each try, from
  // random numbers of the try's own (the visit tries again with the same seed until the animal comes)
  const early = () => {
    if (morning()) return false;
    const late = clamp((20 - world.sunHeight) / 10, 0, 1);
    return mulberry32(((bird.seed >>> 0) * 31 + Math.floor(world.clock * 7) * 977) >>> 0)() < way.early * late;
  };

  // ---- where it goes next on its beat
  const pickWaypoint = () => {
    for (let tries = 0; tries < 8; tries += 1) {
      let x, z;
      if (beat.inside) {                       // a clearing: anywhere in it, ten to thirty metres on
        const th = fly.yaw + (r() - 0.5) * 3.2, d = 10 + r() * 20;
        x = bird.at.x + Math.cos(th) * d; z = bird.at.z + Math.sin(th) * d;
        if (!beat.inside(x, z)) { x = beat.x + (r() - 0.5) * 14; z = beat.z + (r() - 0.5) * 30; if (!beat.inside(x, z)) continue; }
        if (beat.through && !beat.through(bird.at.x, bird.at.z, x, z) && tries < 7) continue;      // (not through what the clearing keeps off)
      } else {                                 // a line: on along it, and back at its ends (round, on the edge's loop)
        if (!at.set) { at.u = nearestOn(beat, bird.at.x, bird.at.z); at.set = true; }
        const step = (beat.kind === 'creek' ? 4 : 6) + r() * 7;
        let next = at.u + at.dir * step;
        if (!beat.closed && (next < 1 || next > beat.length - 1)) { at.dir = -at.dir; next = at.u + at.dir * step; bird.doing = way.turning; }
        if (beat.closed && r() < 0.02) at.dir = -at.dir;
        next = beat.closed ? next : clamp(next, 0.5, beat.length - 0.5);
        pointOn(beat, next, P);
        const side = (r() * 2 - 1) * beat.half;
        x = P.x - P.dz * side; z = P.z + P.dx * side;
        at.next = next;
      }
      const f = floor(x, z), y = f + home.low + (home.high - home.low) * Math.pow(r(), way.keep);
      wp.set(x, y, z);
      if (wp.distanceTo(world.eye) < way.avoid + 1.5 && tries < 7) continue;
      if (!beat.inside && at.next != null) at.u = at.next;
      return;
    }
  };

  // What of another animal a bat keeps off: where it is, or, for a big one (`body`: an elk, a bear), the point of
  // its body nearest the bat, along the line from its rump to its head and from its feet up to its back, with its
  // width round that. (Kept off the place it stands on alone, a bat low over the clearing could go through a
  // grazing elk's back: a reviewer's reading, not seen.) Into `_n`; returns how far the bat is from it.
  const offOther = (o, p) => {
    let wide = 0;
    if (o.body) {
      const h = headingOf(o), c = Math.cos(h), s = Math.sin(h), l = o.body.long * 0.85;
      const t = clamp((p.x - o.at.x) * c + (p.z - o.at.z) * s, -l, l);
      _n.set(o.at.x + c * t, clamp(p.y, o.at.y, o.at.y + o.body.high), o.at.z + s * t);
      wide = o.body.wide;
    } else _n.copy(o.at);
    _o.subVectors(p, _n);
    return _o.length() - wide;
  };

  // ---- the flight: one step towards `goal` (a point in the air), round the walker, trunks and other animals
  const steer = (dt, goal, hunting) => {
    const p = bird.at, eye = world.eye;
    let wx = goal.x - p.x, wz = goal.z - p.z;
    const wl = Math.hypot(wx, wz) || 1;
    wx /= wl; wz /= wl;
    let ax = 0, az = 0, ay = 0;
    // the walker: kept `avoid` metres off, from their eye down to their feet
    const ex = p.x - eye.x, ez = p.z - eye.z, ey = p.y - clamp(p.y, eye.y - 1.6, eye.y + 0.2), de = Math.hypot(ex, ey, ez) || 1e-3;
    if (de < way.avoid) { const k = ((way.avoid - de) / way.avoid) * 3; ax += (ex / de) * k; az += (ez / de) * k; ay += k * 0.7; }
    // trunks it is below the top of
    for (const t of world.trunksNear(p.x, p.z, 4, _list)) {
      if (p.y > t.foot.y + t.top + 0.4) continue;
      const dx = p.x - t.foot.x, dz = p.z - t.foot.z, c = Math.hypot(dx, dz) || 1e-3, d = c - t.girth;
      if (d < 1.8) { const k = ((1.8 - Math.max(d, 0)) / 1.8) * 2.5; ax += (dx / c) * k; az += (dz / c) * k; }
    }
    // other animals: two bats of a party cross close, but never closer than a hand or two
    // (a big animal is found by where it stands, and its body reaches a metre and more from there: asked for wider)
    for (const o of world.others(p.x, p.z, 3.8, bird, _others)) {
      const d = offOther(o, p), l = _o.length() || 1e-3;
      if (d < 1.6) { const k = ((1.6 - Math.max(d, 0)) / 1.6) * 2; ax += (_o.x / l) * k; az += (_o.z / l) * k; ay += (o.body ? 1 : _o.y / l) * k * 0.5; }
    }
    const want = Math.atan2(wz + az, wx + ax);
    // the turn: towards where it wants to go, at most `turn` radians a second, and a quick hard turn of its own now
    // and then, after an insect
    let rate = clamp(wrap(want - fly.yaw) * 4, -way.turn, way.turn);
    if (fly.jink > 0) { fly.jink -= dt; rate += fly.jinkRate; }
    else if (hunting && (fly.nextJink -= dt) < 0) {
      fly.jink = 0.12 + r() * 0.22; fly.jinkRate = (r() < 0.5 ? -1 : 1) * way.turn * (1.4 + r() * 1.2); fly.nextJink = between(way.jink);
      if (r() < 0.45) { fly.scoop = 0.35; bird.doing = way.catching; } else bird.doing = way.twisting;
    }
    fly.rate += (rate - fly.rate) * Math.min(1, dt * 14);
    fly.yaw = wrap(fly.yaw + fly.rate * dt);
    // its speed: its cruise, which wanders, a little slower in a hard turn
    if (r() < dt * 0.4) fly.cruise = between(way.speed);
    const hard = Math.min(1, Math.abs(fly.rate) / (way.turn * 2));
    fly.speed += (fly.cruise * (1 - 0.25 * hard) - fly.speed) * Math.min(1, dt * 2.5);
    // up and down: towards the goal's height, never lower than its least over what is under it and just ahead,
    // and down to the water's face in a dip
    const cx = Math.cos(fly.yaw), cz = Math.sin(fly.yaw);
    const here = floor(p.x, p.z), ahead = floor(p.x + cx * 1.6, p.z + cz * 1.6);
    let ty = Math.max(goal.y, here + lowest, ahead + lowest) + ay;
    if (fly.dip > 0) { fly.dip -= dt; ty = here + way.skim; }
    else if (hunting && (fly.nextDip -= dt) < 0) {
      fly.nextDip = between(way.dip);
      if (here > p.y - 2.5 && overWater(p.x, p.z) && overWater(p.x + cx * 1.6, p.z + cz * 1.6)) { fly.dip = 0.35 + r() * 0.3; bird.doing = way.dipping; }
    }
    const vyWant = clamp((ty - p.y) * 2.4, -2.2, 2.2);
    fly.vy += (vyWant - fly.vy) * Math.min(1, dt * 7);
    // the move, and what it may not do: go under its least height, into a trunk, the walker or another animal, or
    // faster than its kind's fastest
    const ox = p.x, oy = p.y, oz = p.z;
    p.x += cx * fly.speed * dt; p.z += cz * fly.speed * dt; p.y += fly.vy * dt;
    for (const t of world.trunksNear(p.x, p.z, 3, _list)) {
      if (p.y > t.foot.y + t.top + 0.2) continue;
      const dx = p.x - t.foot.x, dz = p.z - t.foot.z, c = Math.hypot(dx, dz) || 1e-3, least = t.girth + 0.3;
      if (c < least) { p.x = t.foot.x + (dx / c) * least; p.z = t.foot.z + (dz / c) * least; }
    }
    // and never into the walker: kept a metre and more from them, from their eye down to their feet
    const keep = Math.max(1.2, way.avoid * 0.5), kx = p.x - eye.x, kz = p.z - eye.z, kh = Math.hypot(kx, kz);
    if (kh < keep && p.y < eye.y + 0.3 && p.y > eye.y - 1.7) {
      if (kh > 1e-4) { p.x = eye.x + (kx / kh) * keep; p.z = eye.z + (kz / kh) * keep; } else p.x = eye.x + keep;
    }
    for (const o of world.others(p.x, p.z, 2.6, bird, _others)) {
      const d = offOther(o, p), l = _o.length();
      if (d < 0.45) { if (l < 1e-4) _o.set(0, 1, 0); else _o.divideScalar(l); p.copy(_n).addScaledVector(_o, 0.45 + (o.body ? o.body.wide : 0)); }
    }
    const most = way.fastest * 0.92 * dt, gx = p.x - ox, gy = p.y - oy, gz = p.z - oz, g = Math.hypot(gx, gy, gz);
    if (g > most) { const k = most / g; p.set(ox + gx * k, oy + gy * k, oz + gz * k); }
    const f = floor(p.x, p.z) + Math.min(lowest, way.skim);
    if (p.y < f) { p.y = f; fly.vy = Math.max(fly.vy, 0); }
    // its wings: beating, or held out in a short glide
    if (fly.glide > 0) fly.glide -= dt;
    else if (hunting && way.glide && (fly.nextGlide -= dt) < 0) { fly.glide = between(way.glide.time); fly.nextGlide = between(way.glide.every); if (fly.vy < 0.6) bird.doing = way.gliding; }
    fly.flap += ((fly.glide > 0 ? 0 : 1) - fly.flap) * Math.min(1, dt * 9);
    // (the phase runs on and is never wound back: the rig takes it round, life/batRig.js `stroke`)
    fly.phase += hz * dt * (fly.glide > 0 ? 0.3 : 1 + 0.25 * Math.max(0, fly.vy));
    fly.scoop = Math.max(0, fly.scoop - dt);
    pose();
  };
  // how it holds itself: banked into its turn, nose up or down as it climbs or drops, its head a little into the turn
  const held = () => ({ hang: 0, fold: 0, crawl: 0, tilt: 0, flap: fly.flap, cycle: fly.phase, pitch: fly.pitch, roll: fly.roll,
    head: { yaw: clamp(fly.rate * 0.06, -0.4, 0.4), pitch: -0.1 }, ears: 0.6, tail: fly.scoop > 0 ? 0.85 : 0.1 });
  const pose = () => {
    frame(_o.set(Math.cos(fly.yaw), 0, Math.sin(fly.yaw)), UP, bird.q);
    fly.roll += (clamp(fly.rate * 13, -55, 55) - fly.roll) * 0.5;
    fly.pitch += (clamp(Math.atan2(fly.vy, Math.max(fly.speed, 0.5)) * DEG, -28, 28) - fly.pitch) * 0.5;
    Object.assign(bird.want, held());
    bird.snap = true;                                    // a wingbeat is too quick to be eased
  };

  // ---- its one activity, on the wing: hunting its beat, or on its way to a place (`to`), and then `then()`
  const flight = {
    // (as it is held now: every change of what it is about, hunting or on its way somewhere, is a new `fly`, in
    // mid-air, and a pose laid afresh from nothing set the wingbeat back to its first moment and the bat level for
    // a frame)
    pose: held,
    wary: false,
    enter(a, plan = { hunt: true }) {
      Object.assign(a.now, plan);
      if (plan.hunt) { at.set = false; pickWaypoint(); bird.doing = hunting(); }
      else if (plan.doing) bird.doing = plan.doing;
    },
    step(a, dt) {
      const now = a.now;
      if (now.hunt) {
        // In before the light grows in the morning (or, one out at its time, if it is somehow light), and after a
        // spell on its beat, off: one out early back to its roost, one out at its time for a while or for good.
        at.again -= dt; at.spell -= dt;
        if (at.again <= 0 && at.mode === 'night' && !dark()) { at.again = 3; if (a.leave(morning() ? 3600 : a.awhile(), way.homing)) return; }
        else if (at.again <= 0 && at.spell < 0) {
          at.again = 3;
          if (a.leave(at.mode === 'early' ? 600 + r() * 1200 : r() < way.gone ? Infinity : a.awhile(), at.mode === 'early' ? way.homing : way.leaving)) return;
        }
        if (Math.hypot(wp.x - bird.at.x, wp.z - bird.at.z) < reach(2.5) || wp.distanceTo(world.eye) < way.avoid) {
          pickWaypoint();
          if (fly.jink <= 0 && fly.dip <= 0 && fly.glide <= 0 && r() < 0.5) bird.doing = hunting();
        }
        steer(dt, wp, true);
        return;
      }
      steer(dt, now.to, false);
      if (Math.hypot(now.to.x - bird.at.x, now.to.z - bird.at.z) < reach(1.6) && Math.abs(now.to.y - bird.at.y) < 2.5) now.then();
    },
  };

  // ---- going off out of the walker's plain sight, and coming in from it: its own flights
  // Off, and gone once the walker cannot plainly see it (for `seconds`, or for the rest of the visit: Infinity). If
  // they can still see it where it gets to it flies on: to another place out of sight, or straight away from them,
  // over the trees, until it is too small to be seen.
  const onwards = (seconds, legs, doing) => {
    if (!world.plain(bird.at, bird.size)) { bird.left = seconds; a.to('gone'); return; }
    let to = legs > 0 ? world.origin(bird.at, bird.size, r, { away: true }) : null;
    if (!to) {
      const dx = bird.at.x - world.eye.x, dz = bird.at.z - world.eye.z, d = Math.hypot(dx, dz) || 1;
      const x = bird.at.x + (dx / d) * 60, z = bird.at.z + (dz / d) * 60;
      to = new THREE.Vector3(x, Math.max(bird.at.y, floor(x, z) + 14), z);
    }
    a.to('fly', { to, doing, then: () => onwards(seconds, legs - 1, doing) });
  };
  const leave = (seconds, doing = way.leaving) => {
    const to = world.origin(bird.at, bird.size, r, { away: true });
    if (!to) return false;
    a.to('fly', { to, doing, then: () => onwards(seconds, 2, doing) });
    return true;
  };
  // in from out of the walker's plain sight, to `to` (a point in the air), and hunting from there
  const come = (to) => {
    const from = world.origin(to, bird.size, r);
    if (!from) return false;
    bird.at.copy(from);
    fly.yaw = Math.atan2(to.z - from.z, to.x - from.x);
    a.to('fly', { to: to.clone(), doing: way.coming, then: () => a.to('fly', { hunt: true }) });
    return true;
  };

  return {
    activities: { fly: flight },
    react: () => false,                                   // never startled: it flies round the walker (`steer`)
    leave, come,
    begin(a) {
      const out = dark() ? 'night' : early() ? 'early' : null;
      if (!out) { bird.left = morning() ? 1800 + r() * 1800 : 150 + r() * 300; return; }        // in its roost
      at.mode = out; at.spell = out === 'early' ? 40 + r() * 80 : between(way.bout);
      // a place on its beat to begin from
      if (beat.inside) { for (let k = 0; k < 20; k += 1) { const x = beat.x + (r() - 0.5) * 20, z = beat.z + (r() - 0.5) * 50; if (beat.inside(x, z)) { wp.set(x, 0, z); break; } } }
      else { pointOn(beat, r() * beat.length, P); wp.set(P.x, 0, P.z); fly.yaw = Math.atan2(P.dz, P.dx) + (at.dir < 0 ? Math.PI : 0); }
      wp.y = floor(wp.x, wp.z) + home.low + (home.high - home.low) * Math.pow(r(), way.keep);
      if (a.life.first) {
        bird.at.copy(wp);
        a.to('fly', { hunt: true });
        steer(0.001, wp, false);
        return;
      }
      if (!come(wp)) bird.left = 4 + r() * 8;
    },
  };
}

const chance = test((v) => Number.isFinite(v) && v >= 0 && v <= 1, 'a chance, from 0 to 1');
const haunt = optional(nums(3));                          // [how readily it hunts there, least and most height (m) over the water or the ground]
export default {
  // what a bat's way holds besides what every way has (life/families/index.js)
  fields: {
    haunts: { river: haunt, creek: haunt, clearing: haunt, edge: haunt },      // where it hunts (life/places/bats2.js)
    keep: 'number',                                 // how it keeps to the low end of its heights: 1 evenly, more for lower
    speed: nums(2), fastest: 'number',              // m/s it hunts at; the most it ever flies (`steer` holds it to that. The count's bar is 16 m/s for every kind, and a way's `fastest` only raises it)
    turn: 'number',                                 // radians a second of its ordinary turns (a quick turn is half as much again and more)
    jink: nums(2),                                  // seconds between quick hard turns after insects
    dip: optional(nums(2)), skim: 'number',         // seconds between dips to the water's face, if it dips; how low it skims (m)
    glide: optional({ every: nums(2), time: nums(2) }),       // seconds between short glides, and how long each is
    bout: nums(2), gone: chance,                    // seconds it hunts one beat; the chance it then moves to another part of the valley
    emerge: chance, dawn: chance, early: chance,    // out once the day is darker than this in the evening; in once the morning is lighter than that; the chance one is out late on a sunny afternoon
    avoid: 'number',                                // metres it keeps from a walker
    hunting: { river: optional('string'), creek: optional('string'), clearing: optional('string'), edge: optional('string') },
    turning: 'string', twisting: 'string', catching: 'string', dipping: 'string', gliding: 'string', coming: 'string', leaving: 'string', homing: 'string',
  },
  act: (way) => (bird, world) => live(bird, world, way, bat),
  // a beat of the kind's haunts, chosen by how readily it hunts each, and not one another party of its kind has
  // while there are others
  home: (way) => (habitat, r, taken = []) => {
    const places = batPlaces(habitat), choices = Object.entries(way.haunts).filter(([name, h]) => h && places[name] && places[name].length);
    const total = choices.reduce((sum, [, h]) => sum + h[0], 0);
    if (!(total > 0)) return null;
    let pick = r() * total, name = choices[0][0];
    for (const [one, h] of choices) { pick -= h[0]; if (pick <= 0) { name = one; break; } }
    const list = places[name], free = list.filter((beat) => !taken.some((home) => home && home.beat === beat)), some = free.length ? free : list;
    const beat = some[Math.floor(r() * some.length)], [, low, high] = way.haunts[name];
    return { haunt: name, beat, low, high, x: beat.x, z: beat.z };
  },
};
