import * as THREE from 'three';
import { frame, pace, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums, rest, test } from '../bodies.js';
import { homeOn, water, keepOff, inWood } from '../places/salamanders2.js';

// The salamanders and the newt (life/species/roughSkinnedNewt.js, westernRedBackedSalamander.js, ensatina.js,
// olympicTorrentSalamander.js, copesGiantSalamander.js): small, slow, and mostly out of sight. A visitor meets one
// seldom, and where they do it is in no hurry.
//
// Each lives about a home of its kind's (life/places/salamanders2.js): the ground under a log or a stump near the walk,
// a stretch of the forest's floor near it (the wetter the likelier), the spring's basin, the pool under the falls, a
// stretch of the creek's bed above the falls, or the wet margin of the creek at the head of the falls or of the
// spring. Its home is
// drawn afresh for each visit, and when it is gone for good it is about again somewhere else, minutes later.
//
// What it does there, each an activity (life/behave.js):
//   hidden   out of sight: under the log or in the foot of the stump (inside the wood, where the log lies on the
//            ground), under a sword fern's fronds, or down among the stones of the creek's bed. `bird.cover`: the
//            pointer does not find it and the count of walks does not call it seen. It is drawn there like any
//            animal, and what hides it is the wood, the fronds or the ground. From here it comes out, or goes (for a
//            while, or for good), never in the walker's sight
//   forage   on the floor (or the wet margin of the water) about its home: a few steps at a time, slowly, its body
//            bending from side to side as it walks, with pauses in which it turns its head and now and then snaps
//            at something in the litter. A newt may cross the trail
//   bed      on the creek's bed, under the water: the same, more slowly, with long waits (a Cope's giant salamander's
//            gills stand out and ripple)
//   swim     a newt in the spring, the pool or the creek: swimming slowly a little above the bed, and now and then
//            up to the surface for air
//   still    keeping still: a walker is near
//   warn     a newt's warning (the unken reflex: head and tail bent up, the orange underside shown), or an ensatina's
//            (standing tall on stiff legs, its tail raised and swaying)
//   crawl    on its way somewhere: under cover, out from it, to the next place. A log's or a stump's cover is the
//            ground inside its wood, so the way to it and from it goes through the wood: while it is in there it is
//            under cover as it is when hidden (life/places/salamanders2.js `inWood`)
// By night or by day it is out for a share of its spells (`night`, `day`): the newt by day and by night, the
// red-backed salamander and the ensatina only by night (by day they are under the wood, and the census does not
// draw them), the torrent salamander mostly by night, Cope's giant salamander by night.
//
// The walker (`react`, in place of the bird's rule: it hops, swims and crawls, and does not fly). Distances are along
// the ground from the walker's own eye, and further for one who runs (life/agents.js `pace`); a sudden movement
// (life/behave.js) within `startle` metres counts as coming near. The newt shows its warning from `warn` metres and
// holds it while they are near; it does not run, and when they have gone it walks on, away from where they were. The
// others keep still from `still` metres, and from `flush` metres they slip under the nearest cover that is no nearer
// the walker (the bird's flush, `a.flush()`, with a refuge of their own: `near` is the chance of that rather than
// going off for good or a while); with no cover within reach they keep still. One that can stand its ground (the
// ensatina, `stand`: the chance of it) decides as the walker comes near whether it will, and stands tall then, as it
// does whenever no cover is in reach.
// They go off under cover (`leave`), and come from under it (`come`): never into or out of the walker's sight.
// Under water and seen from low down (from the trail, as a rule) one is lost under what the water mirrors
// (world/water.js), and is under cover then as it is under a log: the pointer does not find it, nor the count see it.
//
// From what was read (each species' sheet says what): that each lives where it is put here, that the newt is abroad
// by day and by night and warns as it does, that the ensatina stands tall, that the red-backed salamander and the
// ensatina are under logs and bark by day and out at night, that the torrent salamander keeps within a metre of
// water in seeps and the splash of falls, that Cope's giant salamander is in the creek's pools by night. The agent's
// own: every distance, speed, time and chance below, how each moves, and every place.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const TAU = Math.PI * 2;
const angle = (v) => Math.atan2(Math.sin(v), Math.cos(v));
const chance = test((v) => Number.isFinite(v) && v >= 0 && v <= 1, 'a chance, from 0 to 1');
const _v = new THREE.Vector3(), _n = new THREE.Vector3(), _p = new THREE.Vector3(), _w = {};

// It takes no step that would end nearer another animal than this (m), unless it is nearer one already and the step
// takes it no nearer. (A chorus frog was found 2 cm from a newt that had walked up to it. The distance is the count's
// own bar for two animals in one spot, and a little more.)
const CLOSE = 0.15;

const HIDES = { log: 'under a log', stump: 'in the rotten foot of a stump', fern: 'under a sword fern', bed: 'down among the stones of the creek' };
const SLIPS = { log: 'slipping under a log', stump: 'slipping into the foot of a stump', fern: 'slipping in under a fern', bed: 'slipping down among the stones of the creek' };
const OUT = { log: 'coming out from under a log', stump: 'coming out of the foot of a stump', fern: 'coming out from under a fern', bed: 'coming up from among the stones' };

function crawler(a) {
  const { bird, world, way, r } = a, home = bird.home, sheet = bird.sheet, gilled = !!sheet.shape.gills;
  const stride = sheet.shape.stride * (sheet.shape.svl / 1000);              // one stride, metres
  const gait = { cycle: r(), wave: r() * 10 };                               // (counts that only grow, across its activities)
  const at = { heading: r() * TAU, spot: null, shut: false };
  const sunk = way.under ? way.under * 0.85 : 0;                             // how far down among the stones it goes
  const outdoors = home.water && !home.edges ? (way.swim ? 'swim' : 'bed') : 'forage';
  const covers = home.covers || [];
  const span = ([least, most]) => least + r() * (most - least);
  let look = 0, nerve = null;                                                // nerve: will it stand its ground, this time

  // ---- where it is: the ground's slope under it, its heading, how far it is from the walker along the ground
  const slope = (x, z, out) => { const e = 0.05; return out.set(world.height(x - e, z) - world.height(x + e, z), 2 * e, world.height(x, z - e) - world.height(x, z + e)).normalize(); };
  const face = (pitch = 0) => {
    _v.set(Math.cos(at.heading), pitch, Math.sin(at.heading));
    return frame(_v, pitch ? UP : slope(bird.at.x, bird.at.z, _n), bird.q);
  };
  const off = () => Math.hypot(bird.at.x - world.eye.x, bird.at.z - world.eye.z);
  const wary = () => Math.max(way.still, way.warn, way.flush) * pace(world);
  // how often it is out at this time of day (the forest's day factor: 0 by night, 1 by day)
  const share = () => way.night + (way.day - way.night) * clamp(world.day, 0, 1);
  const keep = () => {
    bird.want.cycle = gait.cycle; bird.want.wave = gait.wave;
    if (gilled) bird.want.gills = 0.55 + 0.25 * Math.sin(gait.wave * 1.9);
  };
  // it looks about, in slow turns of the head
  const glance = (dt) => { look -= dt; if (look < 0) { look = 1.2 + r() * 3.5; bird.want.head = { yaw: (r() - 0.5) * 0.9, pitch: (r() - 0.3) * 0.25 }; } };
  // can it walk here: the floor (or the trail), not water, a bar's cobbles or the ravine's sides, in no wood, and not
  // in the falls' rock or among the creek's stones below the brink (life/places/salamanders2.js `keepOff`)
  const land = (x, z) => { const kind = world.ground(x, z); return kind !== 'water' && kind !== 'steep' && kind !== 'stones' && !world.solidAt(x, z, 0.04) && !keepOff(x, z); };
  const free = (x, y, z) => world.free(_p.set(x, y, z), bird, 0.32);
  // under water, and seen from below about 35 degrees, where the water's mirror lies over what is under it
  const drowned = () => {
    water(bird.at.x, bird.at.z, _w);
    if (!(_w.d < _w.half + 0.1) || _w.level - bird.at.y < 0.025) return false;
    return Math.atan2(world.eye.y - _w.level, Math.hypot(bird.at.x - world.eye.x, bird.at.z - world.eye.z)) < 0.6;
  };
  // a place to walk to (a spot of the bed or the margin has a height of its own: on foot it keeps to the ground)
  const afoot = (spot) => (spot ? { x: spot.x, z: spot.z, sink: 0 } : null);

  // A step towards `to` ({ x, z, and y: a height of its own, in the water, or sink: how far below the ground it is to
  // be there }) at `speed` m/s: it turns as it goes, its body bending into the turn, and turns before it goes where it
  // must turn far. True once it is there. With another animal in the way (`CLOSE`) it takes no step, and `at.shut`
  // says so: whoever sent it there waits, or sends it elsewhere.
  const toward = (to, speed, dt, from) => {
    at.shut = false;
    // (on the ground it keeps to it, up and down; above it, in the water, it comes down to it at its own pace)
    const onGround = to.y == null && bird.at.y <= world.height(bird.at.x, bird.at.z) - from.sink + 0.01;
    const dx = to.x - bird.at.x, dz = to.z - bird.at.z, d = Math.hypot(dx, dz);
    let turn = 0, go = d;
    if (d > 0.003) {
      turn = angle(Math.atan2(dz, dx) - at.heading);
      at.heading += clamp(turn, -2.4 * dt, 2.4 * dt);
      go = Math.min(d, speed * dt * clamp(Math.cos(turn) * 1.3, 0.12, 1));
      const x = bird.at.x + Math.cos(at.heading) * go, z = bird.at.z + Math.sin(at.heading) * go, near = world.crowd(_p.set(x, bird.at.y, z), bird);
      if (near < CLOSE && near < world.crowd(bird.at, bird)) { at.shut = true; go = 0; } else { bird.at.x = x; bird.at.z = z; }
    }
    const k = d > 1e-6 ? go / d : 1, ground = world.height(bird.at.x, bird.at.z);
    if (to.y != null) bird.at.y += (to.y - bird.at.y) * k;
    else {
      // (on the ground or going down into it; from in the water, down through it to the ground)
      from.sink += ((to.sink || 0) - from.sink) * k;
      bird.at.y = onGround ? ground - from.sink : Math.max(ground - from.sink, Math.min(bird.at.y, ground + 0.5) - Math.max(speed, 0.05) * dt);
    }
    gait.cycle += go / stride;
    bird.want.bend = clamp(turn * 0.7, -0.55, 0.55);
    if (to.y != null) face(clamp((to.y - bird.at.y) / Math.max(d, 0.05), -0.6, 0.6) * 0.6); else face();
    return d - go < 0.004;
  };

  // ---- going under cover: the nearest cover within reach, free, and (put up by the walker) no nearer them
  const coverFor = (reach, fleeing) => {
    const d0 = off();
    let best = null, least = Infinity;
    for (const spot of covers) {
      const d = Math.hypot(spot.x - bird.at.x, spot.z - bird.at.z);
      if (d > reach || d >= least) continue;
      if (fleeing && Math.hypot(spot.x - world.eye.x, spot.z - world.eye.z) < d0 - 0.25) continue;
      if (!free(spot.x, spot.y, spot.z)) continue;
      best = spot; least = d;
    }
    return best;
  };
  const shelter = (fleeing, then = null) => {
    const spot = coverFor(fleeing ? way.reach : Infinity, fleeing);
    if (!spot) return false;
    a.to('crawl', { path: [{ x: spot.x, z: spot.z, sink: spot.kind === 'bed' ? sunk : 0 }], speed: fleeing ? way.dash : way.pace, landing: 'hidden', args: [spot, then || {}],
      doing: SLIPS[spot.kind], fleeing, swim: outdoors === 'swim' && spot.kind === 'bed' });
    return true;
  };
  // out from under it: a few hands from its cover, on the side away from the walker where it can be had; and
  // further out the same way, a hand and a half at a time, until it is ground it can walk on. (The layout keeps a
  // stump's ground to 1.3 m by its scale round its foot, and a log's to 0.8 m by its scale along it, and `land`
  // refuses all of it: tried only a few hands out, one under a stump never came out, nor one under the thin end of
  // a great log. How far it looks, 1.8 m more, is the agent's own.)
  const emerge = () => {
    const from = at.spot, wet = from && from.kind === 'bed';
    if (wet || home.edges) {
      const list = home.edges || home.beds;
      const fit = list.filter((s) => Math.hypot(s.x - bird.at.x, s.z - bird.at.z) < 1.1 && free(s.x, s.y, s.z));
      if (!fit.length) return false;
      const to = fit[Math.floor(r() * fit.length)];
      a.to('crawl', { path: [{ x: to.x, z: to.z, sink: 0 }], speed: way.pace * 1.5, landing: outdoors, args: [{}], doing: home.edges ? 'coming up out of the water' : 'coming out from among the stones' });
      return true;
    }
    const away = Math.atan2(bird.at.z - world.eye.z, bird.at.x - world.eye.x);
    for (let tries = 0; tries < 10; tries += 1) {
      const h = (tries < 5 ? away : r() * TAU) + (r() - 0.5) * 2;
      let d = (from ? from.radius * 0.8 : 0.1) + 0.25 + r() * 0.5;
      for (let more = 0; more < 12 && !land(bird.at.x + Math.cos(h) * d, bird.at.z + Math.sin(h) * d); more += 1) d += 0.15;
      const x = bird.at.x + Math.cos(h) * d, z = bird.at.z + Math.sin(h) * d;
      if (!land(x, z) || !free(x, world.height(x, z), z)) continue;
      a.to('crawl', { path: [{ x, z, sink: 0 }], speed: way.pace, landing: 'forage', args: [{}], doing: from ? OUT[from.kind] : 'coming out' });
      return true;
    }
    return false;
  };
  // where to next, on foot: a few hands on, more or less the way it is going, and back towards its home when it has
  // strayed; on its home's wet margin (the torrent salamander's), the next spot of the margin
  const wander = () => {
    if (home.edges) {
      const fit = home.edges.filter((s) => { const d = Math.hypot(s.x - bird.at.x, s.z - bird.at.z); return d > 0.15 && d < 0.8 && free(s.x, s.y, s.z); });
      return fit.length ? fit[Math.floor(r() * fit.length)] : null;
    }
    if (home.water) {
      const fit = home.beds.filter((s) => { const d = Math.hypot(s.x - bird.at.x, s.z - bird.at.z); return d > 0.2 && d < 1.0 && free(s.x, s.y, s.z); });
      return fit.length ? fit[Math.floor(r() * fit.length)] : null;
    }
    // (strayed, and the way back shut: any way, as when it has not strayed. A home under a great stump is further
    // inside the ground the layout keeps round it than a small salamander strays, and one come out from under it
    // found every step towards it shut, and stood where it was)
    const strayed = Math.hypot(bird.at.x - home.x, bird.at.z - home.z) > way.range;
    for (let tries = 0; tries < 8; tries += 1) {
      const h = strayed && tries < 4 ? Math.atan2(home.z - bird.at.z, home.x - bird.at.x) + (r() - 0.5) : at.heading + (r() - 0.5) * 2.2, d = 0.2 + r() * 0.7;
      const x = bird.at.x + Math.cos(h) * d, z = bird.at.z + Math.sin(h) * d;
      if (!land(x, z) || !land((x + bird.at.x) / 2, (z + bird.at.z) / 2) || !free(x, world.height(x, z), z)) continue;
      return { x, z, sink: 0 };
    }
    return null;
  };

  const activities = {
    hidden: {
      wary: false,
      pose: () => ({ crouch: 1 }),
      // `spot`: its cover; `until`: the seconds before it may come out; `leave`: gone from here at once, for that long
      enter: (a, spot, { until, leave = null } = {}) => {
        at.spot = spot; bird.cover = true;
        Object.assign(a.now, { until: until ?? span(way.stay), leave });
        if (spot.kind === 'log' && spot.heading != null) at.heading = spot.heading + (r() < 0.5 ? 0 : Math.PI);
        face();
      },
      step: (a, dt) => {
        bird.cover = true; keep();
        bird.doing = world.day < 0.3 && way.day < 0.2 ? HIDES[at.spot.kind] : `hidden ${HIDES[at.spot.kind]}`;
        if (a.now.leave != null) { bird.left = a.now.leave; return; }
        a.now.until -= dt;
        if (a.now.until > 0) return;
        // (its spell under cover is over: it goes elsewhere, or comes out if this is its time and the walker is not by)
        if (!a.cast && r() < way.leaves) { bird.left = r() < way.gone ? Infinity : a.awhile(); return; }
        if (r() > share() || off() < wary() + 1.5 || !emerge()) a.now.until = 4 + r() * 10;
      },
    },
    forage: {
      pose: () => ({ walk: 0 }),
      enter: (a, { bout, away = false } = {}) => Object.assign(a.now, { to: null, pause: away ? 0 : 0.4 + r() * 1.5, until: bout ?? span(way.out), snap: 0, away }),
      step: (a, dt) => {
        const now = a.now;
        keep(); glance(dt);
        now.until -= dt;
        // (its time out is over, or day has come for one that is out only by night: under cover again, slowly)
        if ((now.until < 0 || (share() < 0.05 && r() < dt * 0.3)) && !now.to) { if (shelter(false)) return; now.until = 8 + r() * 8; }
        if (now.snap > 0) {
          now.snap -= dt; bird.want.lunge = now.snap > 0.2 ? 1 : 0; bird.want.walk = 0;
          return;
        }
        if (now.pause > 0) {
          now.pause -= dt; bird.want.walk = 0; bird.want.bend *= 1 - Math.min(1, dt * 2);
          bird.doing = home.edges ? 'still on the wet rock at the water\'s edge' : 'stopped, its head turning';
          if (r() < dt * 0.22) { now.snap = 0.45; bird.doing = 'snapping up something small in the litter'; }
          return;
        }
        if (!now.to) {
          // (walking on after its warning: away from where the walker was)
          if (now.away) { const h = at.heading, d = 0.6 + r() * 0.6, x = bird.at.x + Math.cos(h) * d, z = bird.at.z + Math.sin(h) * d; now.away = false; if (land(x, z) && free(x, world.height(x, z), z)) now.to = { x, z, sink: 0 }; }
          if (!now.to) now.to = afoot(wander());
          if (!now.to) { now.pause = 1 + r() * 2; return; }
          now.from = { sink: 0 };
        }
        bird.want.walk = 1;
        bird.doing = home.edges ? 'creeping over the wet rock at the water\'s edge' : world.ground(bird.at.x, bird.at.z) === 'tread' ? 'crossing the trail, slowly' : 'walking slowly over the forest floor';
        if (toward(now.to, way.pace, dt, now.from)) { now.to = null; now.pause = r() < 0.7 ? 0.6 + r() * 3 : 0; }
        else if (at.shut) { now.to = null; now.pause = 0.8 + r() * 2; }      // (another animal in its way: a moment, and then another way)
      },
    },
    bed: {
      pose: () => ({ walk: 0, crouch: 0.2 }),
      enter: (a, { bout } = {}) => Object.assign(a.now, { to: null, pause: 1 + r() * 4, until: bout ?? span(way.out), snap: 0 }),
      step: (a, dt) => {
        const now = a.now;
        keep(); glance(dt); gait.wave += dt;
        bird.cover = drowned();
        now.until -= dt;
        if ((now.until < 0 || (share() < 0.05 && r() < dt * 0.3)) && !now.to) { if (shelter(false)) return; now.until = 8 + r() * 8; }
        if (now.snap > 0) { now.snap -= dt; bird.want.lunge = now.snap > 0.2 ? 1 : 0; bird.want.walk = 0; return; }
        if (now.pause > 0) {
          now.pause -= dt; bird.want.walk = 0;
          bird.doing = 'waiting on the creek\'s bed, quite still';
          if (r() < dt * 0.08) { now.snap = 0.45; bird.doing = 'snapping at something carried by in the water'; }
          // (a newt goes up for air now and then)
          if (way.swim && r() < dt * 0.04) a.to('swim', { rise: true });
          return;
        }
        if (!now.to) { now.to = afoot(wander()); now.from = { sink: 0 }; if (!now.to) { now.pause = 2 + r() * 4; return; } }
        bird.want.walk = 1;
        bird.doing = 'walking slowly over the creek\'s bed';
        if (toward(now.to, way.pace * 0.8, dt, now.from)) { now.to = null; now.pause = 2 + r() * (way.swim ? 6 : 14); }
        else if (at.shut) { now.to = null; now.pause = 2 + r() * 4; }
      },
    },
    swim: {
      pose: () => ({ swim: 1, afloat: true }),
      // `rise`: up to the surface for air, and down again
      enter: (a, { rise = false, bout } = {}) => Object.assign(a.now, { to: null, rise, air: 0, until: bout ?? span(way.out) }),
      step: (a, dt) => {
        const now = a.now;
        keep(); gait.wave += dt;
        bird.cover = drowned();
        if (now.air > 0) {
          now.air -= dt; bird.want.swim = 0.25; gait.cycle += dt * 0.4;
          bird.doing = 'at the surface, taking a gulp of air';
          if (now.air <= 0) { const bed = wander(); if (bed) { a.to('crawl', { path: [{ x: bed.x, z: bed.z, y: bed.y + 0.004 }], speed: way.swim * 0.6, landing: 'bed', args: [{}], doing: 'swimming down to the bed', swim: true }); } else now.air = 1; }
          return;
        }
        now.until -= dt;
        if (now.until < 0 && !now.to && shelter(false)) return;
        if (!now.to) {
          const bed = wander();
          if (!bed) { a.to('bed', {}); return; }
          const top = bed.level - 0.012;
          now.to = { x: bed.x, z: bed.z, y: now.rise ? top : bed.y + Math.max(0.015, 0.45 * (bed.level - bed.y)) };
        }
        gait.cycle += dt * 1.4;
        bird.doing = now.rise ? 'swimming up to the surface for air' : 'swimming slowly a little above the bed';
        if (toward(now.to, way.swim, dt, null)) {
          if (now.rise) { now.rise = false; now.air = 1.2 + r() * 1.5; }
          else if (r() < 0.45) a.to('bed', { bout: 20 + r() * 60 });
          now.to = null;
        } else if (at.shut) a.to('bed', { bout: 5 + r() * 10 });             // (another animal in its way: down to the bed a while)
      },
    },
    still: {
      pose: () => ({ crouch: 0.75 }),
      enter: (a, back = 'forage') => Object.assign(a.now, { back, calm: 2 + r() * 3 }),
      step: (a, dt) => {
        keep();
        bird.cover = drowned();
        const near = off() < wary() + 0.5;
        bird.doing = near ? 'keeping quite still' : 'keeping still';
        if (near) { a.now.calm = 2 + r() * 3; return; }
        a.now.calm -= dt;
        if (a.now.calm < 0) a.to(a.now.back, {});
      },
    },
    warn: {
      pose: () => (way.stand ? { tall: 1, tail: { pitch: 0.2, yaw: 0, sway: 0.7 } } : { warn: 1, crouch: 0.2 }),
      enter: (a) => Object.assign(a.now, { held: 0, calm: 2 + r() * 2, least: 3 + r() * 4 }),
      step: (a, dt) => {
        keep();
        a.now.held += dt; gait.wave += dt * 0.9;
        bird.doing = way.stand ? 'standing tall on stiff legs, its tail raised and swaying: a warning' : 'its head and tail bent up to show its orange underside: a warning, for its skin is poisonous';
        if (off() < wary() + 1) { a.now.calm = 2 + r() * 2; return; }
        a.now.calm -= dt;
        if (a.now.calm > 0 || a.now.held < a.now.least) return;
        // (it lets its warning go, and walks on, away from where the walker was)
        at.heading = Math.atan2(bird.at.z - world.eye.z, bird.at.x - world.eye.x) + (r() - 0.5) * 0.8;
        a.to('forage', { away: true });
      },
    },
    crawl: {
      pose: () => ({ walk: 1 }),
      enter: (a, { path, speed, landing, args = [], doing = '', fleeing = false, swim = false }) => {
        Object.assign(a.now, { path, i: 0, speed, landing, args, doing, fleeing, swim, from: { sink: Math.max(0, world.height(bird.at.x, bird.at.z) - bird.at.y) } });
        if (doing) bird.doing = doing;                                     // (said at once: the step may not come this frame)
        bird.cover = drowned() || inWood(world, bird.at.x, bird.at.z);     // (and so is whether it is under cover: it sets out from inside the wood)
      },
      step: (a, dt) => {
        const now = a.now, to = now.path[now.i];
        keep();
        // (inside a log or a stump, on its way under it or out from under it, nothing of it is seen: left as in
        // sight there, the count called it seen and a click on it gave a close-up of bark)
        // (asked of where this step has taken it, so that it is under cover from the step that takes it in)
        bird.doing = now.doing;
        if (now.swim) { bird.want.swim = 1; bird.want.walk = 0; bird.want.afloat = true; gait.cycle += dt * 1.4; }
        const there = toward(to, now.speed, dt, now.from), wood = inWood(world, bird.at.x, bird.at.z);
        bird.cover = drowned() || wood;
        if (!there) {
          // (another animal in its way: it waits, and after three seconds gives the way up and goes on as it does
          // out here, keeping still first; inside the wood it only waits, since out here is not where it is)
          if (at.shut) { bird.want.walk = 0; now.shut = (now.shut || 0) + dt; if (now.shut > 3 && !wood) { if (now.swim) a.to(outdoors, {}); else a.to('still', outdoors); } }
          else { now.shut = 0; if (!now.swim) bird.want.walk = 1; }
          return;
        }
        now.i += 1;
        if (now.i < now.path.length) return;
        a.to(now.landing, ...now.args);
      },
    },
  };

  return {
    activities,
    // the walker: the newt warns, the others keep still and then slip under cover
    react: (a) => {
      // (one that has been too far off to be drawn is found as it is: `wave` only grows, the page eases it, and
      // eased through all it had grown by meanwhile the gills and the tail raced for a moment)
      if (bird.shown < 0) bird.snap = true;
      const d = off(), p = pace(world);
      // (whether it stands its ground is decided once as the walker comes near, and forgotten once they have gone)
      if (d > wary() + 2) nerve = null;
      if (a.cast || a.name === 'hidden' || a.name === 'warn' || a.name === 'swim' || (a.name === 'crawl' && (a.now.fleeing || a.now.swim))) return false;
      const sudden = world.walker.sudden > 0 && d < way.startle;
      if (way.warn > 0) {
        if ((d < way.warn * p || sudden) && (a.name === 'forage' || a.name === 'still')) { a.to('warn'); return true; }
        return false;
      }
      if (d < way.flush * p || sudden) {
        if (nerve == null) nerve = r() < way.stand;
        const by = d < way.flush * p && (a.name === 'forage' || a.name === 'still');
        if (nerve && by) { a.to('warn'); return true; }
        if (a.flush()) return true;
        if (way.stand > 0 && by) { a.to('warn'); return true; }              // (no cover in reach: it stands its ground)
        if (a.name === 'forage' || a.name === 'bed') { a.to('still', a.name); return true; }
        return false;
      }
      if (d < way.still * p && (a.name === 'forage' || a.name === 'bed')) { a.to('still', a.name); return true; }
      return false;
    },
    // put up: under the nearest cover that is no nearer the walker
    refuge: () => shelter(true),
    // gone from here: under cover first (quickly, if the walker is by), and gone from under it
    leave: (seconds) => {
      if (a.cast) return false;
      if (a.name === 'hidden') { bird.left = seconds; return true; }
      const spot = coverFor(off() < wary() + 2 ? way.reach : Infinity, off() < wary() + 2);
      if (!spot) return false;
      a.to('crawl', { path: [{ x: spot.x, z: spot.z, sink: spot.kind === 'bed' ? sunk : 0 }], speed: off() < wary() + 2 ? way.dash : way.pace, landing: 'hidden', args: [spot, { leave: seconds }],
        doing: SLIPS[spot.kind], fleeing: true });
      return true;
    },
    // in from out of sight: under the cover of its home's nearest `to` (every cover a home has is its own, within a few
    // metres of it), from which it comes out when it will
    come: (to) => {
      let best = null, least = Infinity;
      for (const spot of covers) { const d = Math.hypot(spot.x - to.at.x, spot.z - to.at.z); if (d < least && free(spot.x, spot.y, spot.z)) { best = spot; least = d; } }
      if (!best) return false;
      bird.at.set(best.x, world.height(best.x, best.z) - (best.kind === 'bed' ? sunk : 0), best.z);
      a.to('hidden', best, { until: 0.5 + r() * 4 });
      return true;
    },
    // where the visit finds it: on the visit's first moment, out already about its home if this is its time (more
    // often than not), and otherwise under its cover there; each time it comes later, under its cover
    begin: () => {
      if (a.life.first && r() < share() * 0.75) {
        const list = home.edges || home.beds || null;
        for (let tries = 0; tries < 8; tries += 1) {
          let x, z, y = null;
          if (list) { const s = list[Math.floor(r() * list.length)]; x = s.x; z = s.z; if (outdoors === 'swim') y = s.y + Math.max(0.015, 0.45 * (s.level - s.y)); }
          else { const h = r() * TAU, d = r() * way.range; x = home.x + Math.cos(h) * d; z = home.z + Math.sin(h) * d; if (!land(x, z)) continue; }
          const ground = world.height(x, z);
          if (!free(x, y ?? ground, z)) continue;
          bird.at.set(x, y ?? ground, z); face();
          a.to(outdoors, {});
          return;
        }
      }
      // (every cover of its home has another animal on it: it comes a little later, not never)
      if (!a.come({ at: _v.set(home.x, 0, home.z) })) { bird.left = 5 + r() * 10; return; }
      if (a.life.first) a.now.until = r() * span(way.stay);
    },
  };
}

export default {
  // what a crawler's way holds besides what every way has (life/families/index.js)
  fields: {
    ...WARY,                         // flush: within this many metres (along the ground, of a walker at a stroll) it
                                     // slips under cover; startle: a sudden movement within this; near: the chance it
                                     // hides near by rather than going off; gone: the chance that going off is for good
    keeps: rest({}, 'number'),       // where it lives, as shares: floor, logs, spring, seep, pool, creek, falls
    territory: 'number',             // no home within this many metres of another of its kind's
    pace: 'number', dash: 'number',  // m/s on foot, and making for cover
    swim: 'number',                  // m/s swimming (0: it does not swim, it walks on the bed)
    range: 'number', reach: 'number',// how far from its home it wanders (m); how far off a cover it makes for when put up
    still: 'number', warn: 'number', // within this many metres it keeps still; it shows its warning (0: it does not)
    stand: chance,                   // put up, the chance it stands its ground (tall: the ensatina's) rather than slip
                                     // under cover; one that can stand does so too whenever no cover is in reach
    out: nums(2), stay: nums(2),     // seconds out at a time; seconds under cover at a time
    leaves: chance,                  // the chance, as a spell under cover ends, that it goes off from there
    day: chance, night: chance,      // the share of its spells it comes out for, by day and by night
  },
  act: (way) => (bird, world) => live(bird, world, way, crawler),
  home: (way) => (habitat, r, taken = []) => {
    const order = Object.entries(way.keeps).filter(([, share]) => share > 0);
    for (let tries = 0; tries < 4; tries += 1) {
      let pick = r() * order.reduce((sum, [, share]) => sum + share, 0), where = order[0][0];
      for (const [name, share] of order) { pick -= share; if (pick <= 0) { where = name; break; } }
      const home = homeOn(where, habitat, r, taken, way.territory);
      if (home) return home;
    }
    return null;
  },
};
