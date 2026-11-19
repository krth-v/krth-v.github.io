import * as THREE from 'three';
import { census, mulberry } from './census.js';
import { ROLL } from './species/index.js';
import { bodyOf } from './bodies.js';
import { feelWalker } from './behave.js';
import { createWave } from './wave.js';

// A visit's animals: who is about (life/census.js), where each lives this time, and who is there now.
//
// Every animal about is one of `who`. It has a home for the visit, found for it in the habitat its kind
// keeps to, and it is there or away by turns. While it is there it is one of `birds` and does what its kind
// does (life/agents.js), whether or not anyone is near to see it. Nothing here draws: life/index.js draws the
// ones in view, and a visit can be walked through with no page at all (`walkThrough`), to count what a walk
// meets.
//
// The rule every coming and going keeps: nothing comes to be, or stops being, where the walker would plainly
// see it. An animal that comes while its place is in plain view flies in from somewhere that is not; one that
// leaves flies until it is out of plain view, and is gone from there. Each time either rule is broken it is
// counted (`broken`), and the count is meant to be none. A big animal that walks (an elk) does the same on
// foot: it walks in from a place the walker cannot see, and off to one (`offstage`); and it is plainly seen if
// any of its body is, not only the point it stands on (`plainly`).
//
// On a day the census draws a wave of migrants, the animals the wave brought go about as one party of several kinds
// (life/wave.js: what the party is, as every family whose kinds join it reads it, `home.party`). Its members come in
// with it and keep to it; when it moves on out of the valley they go too, for good.

const PIXELS = 3;                 // "plainly": in the frame, no trunk in the way, and at least this many pixels long
const NOTICED = 6;                // "in sight", for the count of what a walk meets: this many pixels long, for this long
const GLIMPSE = 0.7;              // seconds: in all, while the animal is there (not at one stretch)
const UNSEEN = [0.05, 0.08];       // seconds: how much time gathers before an animal nobody watches lives it (a party's own, between these)
const LONGEST = 0.1;              // seconds: the longest single step an animal is given (what the counted walks run at)
const SWIFT = 16;                 // m/s: the fastest a small bird is meant to go in plain view (the tools' bar for `fastest`)
const _v = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _f = new THREE.Vector3(), _w = new THREE.Vector3();
const CLOCK = Object.fromEntries(ROLL.map((row) => [row.key, row.clock]));
const WAVES = new Set(ROLL.filter((row) => row.wave).map((row) => row.key));      // the kinds that travel with the migrants' wave

// `ways`: for each kind that has been built, how it lives (its file's `way`: life/species/index.js WAYS). `sheets`: its data sheet.
export function createVisit({ habitat, trail, ways, sheets, seed, hour = 12, busy = false, only = null }) {
  const drawn = census(seed, hour, { busy, roll: ROLL });
  // (`only`: the kinds to keep of who is about, to count one kind or a few alone: a test's, never a visitor's)
  if (only) drawn.about = drawn.about.filter(({ key }) => only.includes(key));
  const r = mulberry((seed >>> 0) * 7919 + 13);
  const who = [], birds = [], unbuilt = [], homeless = [], heard = {}, seen = {}, voices = [], broken = [], threw = new Set();
  // since the visit began: how many came in on the wing and how many were simply there when the walker came
  // round; how many went off for a while, and how many for good
  const comings = { flew: 0, were: 0, went: 0, gone: 0 };
  const eye = new THREE.Vector3(), view = { camera: null, focal: 1158 };
  let tally = false, turn = 0, parties = 0;
  // What a count of walks keeps an eye on, for every kind, and what each is meant to be: the least height of
  // any animal over the ground (none under it); the fastest any moved between two steps in both of which it
  // was plainly seen (a flight's pace, never a jump); and the least distance between two that were not on the
  // wing (no two in one spot). Each with the kind and what it was doing. A kind whose way gives limits of its own
  // (`fastest`, m/s; `under`, m under the ground or the water: life/bodies.js WAY) is measured against them, so that
  // the one bar the tools hold every kind to holds for it too: `low` is its height with what it may go under added,
  // and `fastest` its pace with what it may go over the small birds' 16 m/s taken off (the `By` gives the raw figure).
  // An animal whose step throws is taken out of the visit, and the fault is kept in `broken` with its kind and
  // what it was doing (`what: 'threw'`), so that one fault does not end a count of many visits.
  const checks = { low: Infinity, lowBy: '', fastest: 0, fastestBy: '', nearest: Infinity, nearestBy: '' };
  // and for a big animal, how far the nearest other body is from its own (its body a line from rump to head,
  // its width round that line): below nothing, two bodies are in one another; how near the walker one came or went
  // (never near: an elk that goes is out of sight and far off); and the most a running one ever came nearer the
  // walker than it was when it began to run (`closer`, kept by its kind: a herd that flees runs away, not past)
  checks.overlap = Infinity; checks.overlapBy = ''; checks.closest = Infinity; checks.closestBy = ''; checks.closer = 0; checks.closerBy = '';
  // and, for a list of what to mend, every pair of kinds that came near (under 0.3 m apart, or bodies under 5 cm
  // apart): the nearest and the deepest into one another each pair came; and every kind that went under the ground
  // further than the tools allow (`lows`). One worst figure for the visit is mended pair by pair otherwise.
  checks.pairs = {}; checks.lows = {};
  // What happened on the visit that a kind says is worth counting, by kind and by name: a herd met, one that moved
  // off, one that ran (`world.event`)
  const events = {};

  // Would the walker plainly see a thing `size` long at `p`?
  function plain(p, size, least = PIXELS) {
    const camera = view.camera;
    if (!camera) return false;
    _v.copy(p).project(camera);
    if (!(_v.z > -1 && _v.z < 1) || Math.abs(_v.x) > 1.08 || Math.abs(_v.y) > 1.1) return false;
    if (((size * 0.8) / Math.max(p.distanceTo(eye), 0.01)) * view.focal < least) return false;
    // (hidden by a trunk only if the trunk hides the whole of it, as wide as it is long)
    return !habitat.blocked(eye, p, size * 0.4);
  }
  // Would the walker plainly see any of this animal? A bird is a point; a big animal (`body`: how high its back
  // stands, and half its length) is its middle, its head end and its tail end, at the height of its back.
  function plainly(bird, least = PIXELS) {
    const body = bird.body;
    if (!body) return plain(bird.at, bird.size, least);
    _f.set(1, 0, 0).applyQuaternion(bird.q).setY(0);
    if (_f.lengthSq() < 1e-8) _f.set(1, 0, 0); else _f.normalize();
    for (const k of [0, 1, -1]) {
      _w.copy(bird.at).addScaledVector(_f, k * body.long); _w.y += body.high;
      if (plain(_w, bird.size, least)) return true;
    }
    return false;
  }
  // Somewhere on the ground, from `least` to `most` metres from `to`, where a big animal could stand and the
  // walker could not see it: to walk in from, or (`away`) to walk off to, further from the walker than `to`.
  // Tried first beyond `to` as the walker sees it, then on every side. Null if none was found.
  const ghost = { at: new THREE.Vector3(), q: new THREE.Quaternion(), body: null, size: 1 };
  // `clear`: and at least that far from the walker. `spread`: tried only within half that turn either side of
  // straight beyond `to` (for a way off that never goes past the walker), where it is otherwise tried on every side.
  function offstage(to, bird, rand, { least = 22, most = 75, away = false, radius = 0.7, clear = 0, spread = 0 } = {}) {
    const dx = to.x - eye.x, dz = to.z - eye.z, d = Math.hypot(dx, dz), base = Math.atan2(dz, dx);
    ghost.body = bird.body; ghost.size = bird.size;
    for (let tries = 0; tries < 30; tries += 1) {
      const far = least + rand() * (most - least), turn = (rand() - 0.5) * (spread || (tries < 12 ? 2.2 : 6.2));
      const x = to.x + Math.cos(base + turn) * far, z = to.z + Math.sin(base + turn) * far;
      if (away && Math.hypot(x - eye.x, z - eye.z) < d + 6) continue;
      if (clear && Math.hypot(x - eye.x, z - eye.z) < clear) continue;
      if (!habitat.walkable(x, z, radius) || !habitat.crossable(x, z, to.x, to.z)) continue;
      ghost.at.set(x, habitat.height(x, z), z);
      // (it faces the way it will walk, to `to` or away from it)
      _a.set(to.x - x, 0, to.z - z); if (away) _a.negate();
      ghost.q.setFromAxisAngle(_b.set(0, 1, 0), Math.atan2(-_a.z, _a.x));
      if (!plainly(ghost)) return ghost.at.clone();
    }
    return null;
  }

  // Somewhere within reach of `to` that the walker cannot plainly see, to come in from or to go off to: behind
  // a trunk as the walker sees it; or behind the walker and overhead; or off through the trees, the other way
  // from the walker, until it is too small to be seen. Null if none was found. `away`: it is for going off
  // to, so it is further from the walker than `to` is and never past them (an animal that is put up does not
  // fly at what put it up).
  const found = [];
  function origin(to, size, rand, { least = 9, most = 42, away = false } = {}) {
    const off = Math.hypot(to.x - eye.x, to.z - eye.z);
    habitat.trunksNear(to.x, to.z, most, found);
    for (let tries = 0; found.length && tries < 10; tries += 1) {
      const place = found[Math.floor(rand() * found.length)];
      const dx = place.foot.x - eye.x, dz = place.foot.z - eye.z, d = Math.hypot(dx, dz);
      if (d < 4 || (away && (d < off + 3 || (place.foot.x - to.x) * (to.x - eye.x) + (place.foot.z - to.z) * (to.z - eye.z) < 0))) continue;
      const beyond = place.girth + 0.5 + rand() * 1.5, up = 2 + rand() * Math.min(9, Math.max(1, place.top - 3.5));
      _a.set(place.foot.x + (dx / d) * beyond, place.foot.y + up, place.foot.z + (dz / d) * beyond);
      // (not by a way that goes through a trunk, while there are others to try)
      // (nor through the trunk it is on: one that leaves from the near side of its trunk went through the wood)
      if (tries < 7 && habitat.blocked(to, _a, 0, 0.05)) continue;
      if (_a.distanceTo(to) >= least && !plain(_a, size)) return _a.clone();
    }
    if (!away && view.camera && view.camera.getWorldDirection(_b).setY(0).lengthSq() > 1e-4) {
      _a.copy(eye).addScaledVector(_b.normalize(), -(10 + rand() * 8));
      _a.x += (rand() - 0.5) * 10; _a.z += (rand() - 0.5) * 10;
      _a.y = Math.max(eye.y, habitat.height(_a.x, _a.z) + 1.6) + 4 + rand() * 4;
      if (_a.distanceTo(to) >= least * 0.6 && !plain(_a, size)) return _a.clone();
    }
    const dx = to.x - eye.x, dz = to.z - eye.z, d = Math.hypot(dx, dz) || 1;
    for (const far of [60, 95, 140, 190]) {
      const turn = (rand() - 0.5) * 1.2, c = Math.cos(turn), s = Math.sin(turn);
      const x = to.x + ((dx * c - dz * s) / d) * far, z = to.z + ((dx * s + dz * c) / d) * far;
      _a.set(x, habitat.height(x, z) + 7 + rand() * 8, z);
      // (its first twenty-five metres clear of trunks, if that can be had: further off, a trunk it goes through is one it goes behind)
      _b.copy(to).lerp(_a, 25 / far);
      if (far < 150 && habitat.blocked(to, _b)) continue;
      if (!plain(_a, size)) return _a.clone();
    }
    return null;
  }

  // A call or a song: heard by the walker if it carries as far as they are. Kept for whatever lays sound on.
  function say(bird, what, reach, hold) {
    const d = bird.at.distanceTo(eye);
    if (tally && d <= reach) heard[bird.key] = (heard[bird.key] || 0) + 1;
    if (voices.length >= 32) voices.shift();
    // (`who`: the animal itself, so that what shows where a voice comes from can follow it: js/forest/hud.js)
    voices.push({ key: bird.key, what, x: bird.at.x, y: bird.at.y, z: bird.at.z, far: d, reach, at: world.clock, hold, who: bird });
  }

  const world = {
    trail, height: habitat.height, ground: habitat.ground, open: habitat.open, wooded: habitat.wooded,
    trunks: habitat.trunks, stubs: habitat.stubs, logs: habitat.logs, stumps: habitat.stumps, covers: habitat.covers,
    blocked: habitat.blocked, trunksNear: habitat.trunksNear, stubsNear: habitat.stubsNear, coversNear: habitat.coversNear, boughsNear: habitat.boughsNear, leafyNear: habitat.leafyNear, perchesOf: habitat.perchesOf, took: habitat.took,
    eye, walker: { speed: 0, s: 0 }, day: 1, sunHeight: 20, clock: 0, hour,
    plain, plainly, origin, offstage, say, walkable: habitat.walkable, solidAt: habitat.solidAt, grazing: habitat.grazing,
    event: (key, what) => { const one = (events[key] = events[key] || {}); one[what] = (one[what] || 0) + 1; },
    // how near a spot the nearest other animal is: where it stands, or, for one on the wing, where it is about to land.
    // A big animal is its body: how far the spot is from the line from its rump to its head, less its width, and
    // from its back if the spot is above it. (A thrush fed under an elk's head, measured from where the elk stood.)
    crowd: (point, self) => {
      let least = Infinity;
      for (const b of birds) {
        if (b === self) continue;
        if (b.body) least = Math.min(least, fromBody(b, point));
        else if (b.state !== 'fly') least = Math.min(least, b.at.distanceTo(point));
        else if (b.flight && !b.flight.through) least = Math.min(least, b.flight.d.distanceTo(point));
      }
      return least;
    },
    // how near a spot the nearest big animal's body is (as `crowd` measures one): for a small animal to get out of its way
    loom: (point, self) => { let least = Infinity; for (const b of birds) if (b !== self && b.body) least = Math.min(least, fromBody(b, point)); return least; },
    // is another animal within `reach` of a spot, seen from above: standing there at any height, or about to land there
    beside: (x, z, reach, self) => birds.some((b) => b !== self && (Math.hypot(b.at.x - x, b.at.z - z) < reach || (b.flight && !b.flight.through && Math.hypot(b.flight.d.x - x, b.flight.d.z - z) < reach))),
    // is a spot free: no other animal on it, and none on its way to it (a big animal: not within `room` of its body)
    free: (point, self, room = 0.6) => birds.every((b) => b === self || (b.body ? fromBody(b, point) > room : b.at.distanceToSquared(point) > room * room && !(b.flight && b.flight.d.distanceToSquared(point) < room * room))),
    // the other animals within `reach` of a spot, seen from above (into `list`)
    others: (x, z, reach, self, list = []) => {
      list.length = 0;
      // (the same answers as Math.hypot(dx, dz) < reach: only a pair within a billionth of the limit is asked of it)
      const r2 = reach * reach, sure = r2 * (1 - 1e-9), never = r2 * (1 + 1e-9);
      for (const b of birds) {
        if (b === self) continue;
        const dx = b.at.x - x, dz = b.at.z - z, d2 = dx * dx + dz * dz;
        if (d2 < sure || (d2 <= never && Math.hypot(dx, dz) < reach)) list.push(b);
      }
      return list;
    },
  };

  // How far a point is from a big animal's body (see `crowd`).
  function fromBody(b, p) {
    _f.set(1, 0, 0).applyQuaternion(b.q).setY(0); if (_f.lengthSq() < 1e-8) _f.set(1, 0, 0); else _f.normalize();
    const l = b.body.long * 0.85, ax = b.at.x - _f.x * l, az = b.at.z - _f.z * l, dx = 2 * _f.x * l, dz = 2 * _f.z * l;
    const t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.z - az) * dz) / (dx * dx + dz * dz)));
    const side = Math.max(0, Math.hypot(p.x - ax - dx * t, p.z - az - dz * t) - b.body.wide), over = Math.max(0, p.y - (b.at.y + b.body.high + 0.3));
    return Math.hypot(side, over);
  }

  // ---- who is about, and where each lives on this visit
  // (the homes a kind's parties have already: a kind that keeps a territory is given no home in another's)
  // (one of a party that does not go about together has a home of its own once it has moved on)
  // (one of the migrants' wave keeps to the wave, wherever its home is: it holds no ground of its own)
  const homes = (key) => { const list = []; for (const one of who) { const home = one.way.together ? one.party.home : one.home; if (one.key === key && !one.gone && !one.flock) { if (!list.includes(home)) list.push(home); if (one.bird && one.home !== home && !list.includes(one.home)) list.push(one.home); } } return list; };   // (and where one of a party still is, after the party has moved on)
  // ---- the migrants' wave, as one party (life/wave.js): on a day the census draws one, by day
  const wave = drawn.wave > 0 && drawn.dark < 0.5 ? createWave(habitat, trail, seed, { busy, strength: drawn.wave }) : null;
  let serial = 0;
  for (const { key, parties } of drawn.about) {
    const way = ways[key], animals = parties.reduce((n, size) => n + size, 0);
    if (!way) { unbuilt.push({ key, animals }); continue; }
    // (the last of a kind's parties that the wave brought are its migrants)
    let stays = wave && WAVES.has(key) ? parties.length - wave.migrants(parties.length) : Infinity;
    for (const size of parties) {
      if (stays-- <= 0) { migrant(key, way, size); continue; }
      const home = way.home(habitat, r, homes(key), hour);
      if (home == null) { homeless.push(key); continue; }
      const party = { key, home, members: [] };
      // (a herd is there from the first, or still to come, as one: its members come a few seconds apart)
      const herd = way.herd ? (r() < way.there ? 0 : 3 + r() * way.gap[0]) : null;
      for (let i = 0; i < size; i += 1) {
        const one = { key, way, party, home, seed: ((seed >>> 0) * 131 + serial * 977 + 5) >>> 0, bird: null, gone: false, times: 0,
          // there from the first, or still to come
          until: herd == null ? (r() < way.there ? 0 : 3 + r() * way.gap[0]) : herd === 0 ? 0 : herd + i * (1.5 + r() * 2.5) };
        serial += 1;
        party.members.push(one); who.push(one);
      }
    }
  }
  // One of the wave's: its home is its family's own, found as any other's (from the wave's own random numbers, so that
  // what the rest of the visit draws is as it would be without the wave), with the party set on it; a family whose
  // animal's home has a `party` keeps to the party and not to the home's place. It comes in with the party, a moment
  // after the one before.
  function migrant(key, way, size) {
    const home = way.home(habitat, wave.r, [], hour);
    if (home == null || typeof home !== 'object') { homeless.push(key); return; }
    home.party = wave.party;
    const party = { key, home, members: [] };
    for (let i = 0; i < size; i += 1) {
      const one = { key, way, party, home, flock: wave.party, seed: ((seed >>> 0) * 131 + serial * 977 + 5) >>> 0, bird: null, gone: false, times: 0, until: wave.party.arrive + wave.stagger() };
      serial += 1;
      party.members.push(one); who.push(one); wave.party.members += 1;
    }
  }

  function come(one) {
    // (one of the wave's, still to come or away when the wave moves on, has gone with it)
    if (one.flock && one.flock.gone) { one.gone = true; return; }
    // (one of a pair that goes about together, away when the rest moved on: it comes to where they are now, and
    // not before they do. It came back to the place they had left, and left it again at once.)
    if (one.way.together && one.home !== one.party.home) { one.home = one.party.home; if (world.clock < one.party.back) { one.until = one.party.back + r() * 5; return; } }
    const sheet = sheets[one.key];
    const bird = { key: one.key, sheet, at: new THREE.Vector3(), q: new THREE.Quaternion(), want: {}, pose: {}, doing: '', state: '', beat: 0,
      home: one.way.spot ? one.way.spot(one.home, r, habitat) : one.home, seed: (one.seed + one.times * 7919) >>> 0,
      // (how long it is and the box it fills, for what can be seen of it: its body plan's, life/bodies.js)
      size: bodyOf(sheet).size(sheet), body: bodyOf(sheet).body(sheet), shown: -1, screen: { x: 0, y: 0, r: 0, d: 0, seen: false },
      who: one, left: null, held: false, sight: 0, life: { first: world.clock === 0, gap: one.way.gap },
      // (time it has not yet lived, and how much of it gathers before it lives it while nobody watches: `step`)
      owed: 0, pulse: (one.flock || one.party).pulse || ((one.flock || one.party).pulse = UNSEEN[0] + ((parties += 1) * 0.618 % 1) * (UNSEEN[1] - UNSEEN[0])) };
    if (one.flock && bird.home && typeof bird.home === 'object' && !bird.home.party) bird.home.party = one.flock;     // (a kind's own `spot`, about its home)
    // (a kind whose beginning throws is out of the visit, named, as one whose step throws is)
    try { bird.act = one.way.act(bird, world); }
    catch (e) {
      if (!threw.has(one.key)) { threw.add(one.key); console.error(`life: ${one.key} (coming) threw: ${e && e.stack ? e.stack : e}`); }
      broken.push({ key: one.key, what: 'threw', state: 'coming', doing: '', error: String(e && e.message || e).slice(0, 300), at: +world.clock.toFixed(1) });
      one.gone = true; return;
    }
    // (its kind's way of coming may be not to come just yet: no way in that the walker would not see)
    if (bird.left != null) { if (bird.left === Infinity) one.gone = true; else one.until = world.clock + bird.left; return; }
    // (and not onto another animal: it comes a little later)
    // (a kind that keeps a list of its party's animals, as a herd does, knows by `gone` that this one never came)
    if (world.crowd(bird.flight && !bird.flight.through ? bird.flight.d : bird.at, bird) < 0.3) { bird.state = 'gone'; one.until = world.clock + 4 + r() * 8; one.times += 1; return; }
    if (!bird.life.first && !bird.cover && plainly(bird)) broken.push({ key: one.key, what: 'came', far: +bird.at.distanceTo(eye).toFixed(1), at: +world.clock.toFixed(1) });
    if (!bird.life.first) comings[bird.state === 'fly' ? 'flew' : 'were'] += 1;
    if (bird.body && !bird.life.first) near(bird, 'came');
    one.bird = bird; one.times += 1;
    birds.push(bird);
  }
  // (how near the walker a big animal came or went)
  function near(bird, what) {
    const d = Math.hypot(bird.at.x - eye.x, bird.at.z - eye.z);
    if (d < checks.closest) { checks.closest = d; checks.closestBy = `${bird.key}, ${what} ${bird.state}`; }
  }
  function go(bird, index) {
    if (!bird.cover && plainly(bird)) broken.push({ key: bird.key, what: 'went', far: +bird.at.distanceTo(eye).toFixed(1), at: +world.clock.toFixed(1) });
    if (bird.body) near(bird, 'went');
    birds.splice(index, 1);
    const one = bird.who;
    one.bird = null;
    comings[bird.left === Infinity ? 'gone' : 'went'] += 1;
    // (one whose step threw is taken out of the visit: it came back some minutes later, and threw again)
    if (one.out) { one.gone = true; return; }
    if (bird.left !== Infinity) { one.until = world.clock + bird.left; return; }
    // (one of the wave's gone for good has passed on, with the wave or before it: it is not about again in the valley)
    if (one.flock) { one.gone = true; return; }
    // Gone for good from where it was: it has moved on to another part of the valley, and after some minutes
    // it is about again somewhere else (a kind that only passes through is not). So a long visit does not
    // empty the valley, and no place keeps its animal.
    if (one.way.together) {
      // (a pair or a party that goes about together moves on together: the first of it to go finds where to,
      // and the rest come to the same place)
      const party = one.party;
      if (party.home === one.home) {
        const next = one.way.passing ? null : one.way.home(habitat, r, homes(one.key), hour);
        if (next == null) { one.gone = true; return; }
        party.home = next; party.back = world.clock + 120 + r() * 280;
      }
      // (one that goes long after the rest still takes a moment to get there)
      one.home = party.home; one.until = Math.max(party.back, world.clock + 15 + r() * 30) + r() * 5;
      return;
    }
    const home = one.way.passing ? null : one.way.home(habitat, r, homes(one.key), hour);
    if (home == null) { one.gone = true; return; }
    one.home = home; one.party.home = home;
    one.until = world.clock + 120 + r() * 280;
  }

  // One step of everyone's life. `camera` is the walker's own view (what is plain is plain in it), `focal` the
  // frame's half height over the tangent of half its field of view (pixels), `speed` the walker's pace (m/s).
  // `yaw` (how far the walker's view is turned from the trail, radians), `auto` (the walker set by a script, or off
  // the trail) and `elapsed` (the frame's own time, where `dt` is held short) are for what the animals feel as a
  // sudden movement (life/behave.js `feelWalker`)
  // An animal lives the time it is owed: all of it at once, or in equal parts of a tenth of a second at the most
  // (the longest step the families are run at). One whose step throws is out of the visit, named.
  function live(bird) {
    const parts = Math.max(1, Math.ceil(bird.owed / LONGEST - 1e-9)), part = bird.owed / parts;
    bird.owed = 0;
    try { for (let k = 0; k < parts && bird.left == null; k += 1) bird.act(part); }
    catch (e) {
      if (!threw.has(bird.key)) { threw.add(bird.key); console.error(`life: ${bird.key} (${bird.state || 'no state'}) threw: ${e && e.stack ? e.stack : e}`); }
      broken.push({ key: bird.key, what: 'threw', state: bird.state, doing: bird.doing, error: String(e && e.message || e).slice(0, 300), at: +world.clock.toFixed(1) });
      bird.left = Infinity; bird.held = false; bird.who.out = true;
    }
    // (and one whose place is not a number is nowhere: no check could see it, and no spot was free of it)
    if (bird.left == null && !Number.isFinite(bird.at.x + bird.at.y + bird.at.z)) {
      broken.push({ key: bird.key, what: 'threw', state: bird.state, doing: bird.doing, error: 'its place is not a number', at: +world.clock.toFixed(1) });
      bird.at.set(0, -1000, 0); bird.left = Infinity; bird.held = false; bird.who.out = true;
    }
  }
  // (for the page: an animal about to be drawn that has time owed lives it first, so that nothing is drawn from a
  // state that is behind. One that leaves in doing so is taken away by the next step.)
  function settle(bird) { if (bird.left == null && bird.owed > 0) live(bird); }
  function step(dt, { camera, focal, speed = 0, s = 0, day = 1, sunHeight = 20, yaw = null, auto = false, elapsed = null, watched = null }) {
    if (!(dt > 0)) return;                         // a frame that takes no time changes nothing (the pop check draws two)
    view.camera = camera; view.focal = focal;
    eye.copy(camera.position);
    feelWalker(world.walker, { speed, yaw, s, auto, elapsed }, dt); world.walker.s = s; world.day = day; world.sunHeight = sunHeight;
    if (wave) wave.step(dt, world.clock, day);
    // by night nothing of the day comes in: what is at roost was at roost when the visit began
    for (const one of who) if (!one.bird && !one.gone && world.clock >= one.until && (world.clock === 0 || (day > 0.5 ? CLOCK[one.key] !== 'night' : CLOCK[one.key] !== 'day'))) come(one);
    world.clock += dt;
    // Who is watched. Every animal that was here lived its whole life every frame, wherever it was on the 579 m of
    // the walk, and more than half of that time went on animals nobody could see or come near. With `watched` (the
    // page's test: held, within the distance its kind heeds a walker at, or near enough to be drawn and in or beside
    // the frame) an animal that is not watched, and none of whose party is, lets its time gather and lives it in one
    // step of 0.05 to 0.08 s (each party at a pace of its own, so that they do not all fall on one frame): the step
    // every family is already run at by the counted walks. One that comes into the frame with time owed lives it
    // before it is drawn (`settle`). The count (`tally`) and a caller that gives no test step everyone every time.
    const spare = !!watched && !tally;
    turn += 1;
    if (spare) for (const bird of birds) if (bird.left == null && (bird.held || watched(bird))) (bird.who.flock || bird.who.party).seen = turn;
    for (let i = birds.length - 1; i >= 0; i -= 1) {
      const bird = birds[i];
      bird.snap = false;
      if (bird.left == null) {
        bird.owed += dt;
        if (!spare || (bird.who.flock || bird.who.party).seen === turn || bird.owed >= bird.pulse) live(bird);
      }
      if (bird.left != null && !bird.held) { go(bird, i); continue; }
      if (!tally) continue;
      // (an animal under cover is not in sight, however near: a wren in the ferns)
      if (!bird.cover && plainly(bird, NOTICED)) { bird.sight += dt; if (bird.sight >= GLIMPSE) seen[bird.key] = Math.max(seen[bird.key] || 0, bird.sight); }
      const own = ways[bird.key] || {}, under = own.under || 0, over = Math.max(0, (own.fastest || 0) - SWIFT);
      const up = bird.at.y - habitat.height(bird.at.x, bird.at.z), now = !bird.cover && plainly(bird);
      if (up + under < checks.low) { checks.low = up + under; checks.lowBy = `${bird.key}, ${bird.state}${under ? ` (${(-up).toFixed(2)} m under, of the ${under} m it may go)` : ''}`; }
      if (up + under < -0.03 && !(checks.lows[bird.key] && checks.lows[bird.key].low <= up + under)) checks.lows[bird.key] = { low: +(up + under).toFixed(3), state: bird.state };
      if (bird.closer > checks.closer) { checks.closer = bird.closer; checks.closerBy = `${bird.key}, ${bird.state}`; }
      if (bird.was) {
        const pace = bird.at.distanceTo(bird.was) / dt;
        // (in plain view at either end: a jump from plain view to somewhere hidden is a thing vanishing)
        if ((now || bird.wasPlain) && pace - over > checks.fastest) {
          const f = bird.flight;
          checks.fastest = pace - over; checks.fastestBy = `${bird.key}, ${bird.state}${over ? ` (at ${pace.toFixed(1)} m/s, of the ${own.fastest} m/s it may go)` : ''}${f ? `: a flight of ${f.a.distanceTo(f.d).toFixed(1)} m in ${f.time.toFixed(2)} s, ${f.t.toFixed(2)} of the way` : ''}`;
        }
        bird.was.copy(bird.at);
      } else bird.was = bird.at.clone();
      bird.wasPlain = now;
    }
    if (tally) for (let i = 0; i < birds.length; i += 1) for (let j = i + 1; j < birds.length; j += 1) {
      const a = birds[i], b = birds[j];
      if (a.state === 'fly' || b.state === 'fly') continue;
      const d = a.at.distanceTo(b.at);
      if (d < checks.nearest) { checks.nearest = d; checks.nearestBy = `${a.key}, ${a.state} / ${b.key}, ${b.state}`; }
      let gap = Infinity;
      if (a.body || b.body) {
        gap = apart(a, b);
        if (gap < checks.overlap) { checks.overlap = gap; checks.overlapBy = `${a.key}, ${a.state} / ${b.key}, ${b.state}`; }
      }
      if (d < 0.3 || gap < 0.05) {
        const key = a.key < b.key ? `${a.key} / ${b.key}` : `${b.key} / ${a.key}`, pair = (checks.pairs[key] = checks.pairs[key] || { near: Infinity, nearBy: '', gap: Infinity, gapBy: '' });
        if (d < pair.near) { pair.near = d; pair.nearBy = `${a.key}, ${a.state} / ${b.key}, ${b.state}`; }
        if (gap < pair.gap) { pair.gap = gap; pair.gapBy = `${a.key}, ${a.state} / ${b.key}, ${b.state}`; }
      }
    }
  }

  // How far apart two bodies are, seen from above: a big animal is a line from rump to head with its width round
  // it, a bird a point; one above the other's back does not count. Below nothing, they are in one another.
  function apart(a, b) {
    const ends = (one, out) => {
      if (!one.body) { out[0] = out[2] = one.at.x; out[1] = out[3] = one.at.z; return 0; }
      _f.set(1, 0, 0).applyQuaternion(one.q).setY(0); if (_f.lengthSq() < 1e-8) _f.set(1, 0, 0); else _f.normalize();
      const l = one.body.long * 0.85;
      out[0] = one.at.x - _f.x * l; out[1] = one.at.z - _f.z * l; out[2] = one.at.x + _f.x * l; out[3] = one.at.z + _f.z * l;
      return one.body.wide;
    };
    const A = [0, 0, 0, 0], B = [0, 0, 0, 0], ra = ends(a, A), rb = ends(b, B);
    const lower = a.body ? b : a, upper = a.body ? a : b;
    if (!lower.body && lower.at.y > upper.at.y + upper.body.high + 0.25) return Infinity;
    return segments(A, B) - ra - rb;
  }
  const segments = (A, B) => {
    // the least distance between two segments in a plane: the least of each end to the other segment (they do not cross: two bodies that cross are in one another all the same)
    const toSeg = (px, pz, S) => { const dx = S[2] - S[0], dz = S[3] - S[1], l2 = dx * dx + dz * dz, t = l2 > 1e-9 ? Math.max(0, Math.min(1, ((px - S[0]) * dx + (pz - S[1]) * dz) / l2)) : 0; return Math.hypot(px - S[0] - dx * t, pz - S[1] - dz * t); };
    const cross = (S, T) => { const o = (ax, az, bx, bz, cx, cz) => Math.sign((bx - ax) * (cz - az) - (bz - az) * (cx - ax)); return o(S[0], S[1], S[2], S[3], T[0], T[1]) !== o(S[0], S[1], S[2], S[3], T[2], T[3]) && o(T[0], T[1], T[2], T[3], S[0], S[1]) !== o(T[0], T[1], T[2], T[3], S[2], S[3]); };
    if (cross(A, B)) return 0;
    return Math.min(toSeg(A[0], A[1], B), toSeg(A[2], A[3], B), toSeg(B[0], B[1], A), toSeg(B[2], B[3], A));
  };

  const summary = () => ({ seed, hour, quiet: +drawn.quiet.toFixed(2), wave: +drawn.wave.toFixed(2), dark: drawn.dark,
    about: drawn.about.map(({ key, parties }) => ({ key, animals: parties.reduce((n, size) => n + size, 0), built: !!ways[key] })),
    unbuilt, homeless, seen: { ...seen }, heard: { ...heard },
    // how many times the walker put each kind up, and how many of those took it off out of sight (life/behave.js)
    flushed: who.reduce((all, one) => { if (one.flushed) { const k = (all[one.key] = all[one.key] || { near: 0, off: 0 }); k.near += one.flushed - (one.off || 0); k.off += one.off || 0; } return all; }, {}), broken: [...broken], comings: { ...comings }, here: birds.length, living: who.length, checks: { ...checks },
    events: JSON.parse(JSON.stringify(events)),
    // the migrants' wave as one party, if the day has one (life/wave.js): where it is, and whether it is here or gone
    flock: wave ? wave.summary() : null });

  return { seed, birds, who, world, step, settle, summary, voices, flock: wave ? wave.party : null, set tally(on) { tally = on; }, get broken() { return broken; } };
}

// A visit walked once round, with nothing drawn: from `from` metres along the walk, at `pace` metres a second,
// looking ahead and from side to side. What it met is in the visit's summary. With `stay`, the walker stands
// at `from` for that many seconds instead, looking about. `each(visit, t, camera)`, if given, is called after
// every step (to trace what an animal did).
export function walkThrough(visit, trail, { pace = 3.2, dt = 0.1, from = 0, stay = 0, day = 1, sunHeight = 20, fov = 50, height = 1080, eyeHeight = 1.6, each = null } = {}) {
  const camera = new THREE.PerspectiveCamera(fov, 16 / 9, 0.1, 600), focal = (height / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const at = new THREE.Vector3(), tangent = new THREE.Vector3(), euler = new THREE.Euler(0, 0, 0, 'YXZ');
  if (stay) pace = 0;
  else if (!(pace > 0)) throw new Error(`walkThrough: a walk round needs a pace above nothing, not ${pace} (or a time to stay)`);
  visit.tally = true;
  for (let t = 0, gone = 0; stay ? t < stay : gone < trail.length; t += dt, gone += pace * dt) {
    const s = (from + gone) % trail.length;
    trail.sample(s, at, tangent);
    camera.position.set(at.x, at.y + eyeHeight, at.z);
    euler.set(-0.04, Math.atan2(-tangent.x, -tangent.z) + 0.55 * Math.sin(t * 0.33), 0);
    camera.quaternion.setFromEuler(euler);
    camera.updateMatrixWorld();
    visit.step(dt, { camera, focal, speed: pace, s, day, sunHeight });
    if (each) each(visit, t, camera);
  }
  visit.tally = false;
  return visit.summary();
}
