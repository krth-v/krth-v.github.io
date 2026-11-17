import * as THREE from 'three';
import { frame, UP, pace } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums, optional, oneOf, rest, list } from '../bodies.js';
import { placesOf } from '../places/frogs2.js';

// Frogs and toads: the Pacific chorus frog, the northern red-legged frog and the western toad (life/species/). Written
// by the agent called frogs2, 2026-11-16, on life/behave.js. Where they can be is life/places/frogs2.js: seats at the
// water's edge on the old terrace and in the old cedar's wet ground, places to float (the creek's calm water, the pool
// under the falls, the river's quiet edge), and what they go under (skunk cabbage, sword ferns, the water itself), in
// sites of about twelve metres of creek or river. A frog on a seat the walk cannot see (behind skunk cabbage or ferns)
// is under cover there: drawn, but not the pointer's and not in sight.
//
// What one does is one of five activities.
//   forage   on the ground (the page lays its soft patch under an animal that forages): it sits, mostly still; now and
//            then it snaps up an insect, hops to another seat or turns with a little hop. The chorus frog calls from
//            there, from dusk (below). The toad walks: slowly, over the forest floor and across the trail.
//   leap     in the air, from where it is to where it lands: onto a seat, onto the water, into the water (to go under
//            it) or under cover; further than its longest leap, in leaps over the ground between. Its landing is held
//            for it (`bird.flight`), so that no other animal lands there.
//   float    on the water, only its eyes and nostrils out, the hind legs trailing; it swims a few strokes now and then,
//            and climbs out, or goes under.
//   under    under the water (on its bed) or under cover (a skunk cabbage, a fern, the grass, the litter): not drawn
//            (`bird.hide`), not in sight and not the pointer's (`bird.cover`). It comes out when the walker has gone,
//            into the water's open or onto a seat clear of them.
//   gone     away: from under the water or under cover, so that it goes where the walker cannot see it go.
// It is out for a while and hidden for a while by turns (`hidden`: the share of its time it is hidden, by day and by
// night; `cycle`: the seconds of one round). By day the chorus frog and the red-legged frog are mostly hidden by the
// water, and the toad keeps to its cover until dusk.
//
// The walker (`react`, the family's own, in place of the bird's rule): a frog goes on with what it is doing until the
// walker is within its flush distance (further for one who runs) or moves suddenly within its startle distance, and
// then it leaps: the chorus frog into the water if there is water within a leap, and under it, or else under cover
// near by, away from them; the red-legged frog into the brush first, or else onto the water, where it mostly swims off
// at the surface; or it is gone (life/behave.js `flush`: `near` and `gone` are its chances). The toad keeps still while
// the walker is within a few metres (`still`), and when they come right up to it, or move suddenly near it, it makes
// for cover in short hops (or, with none near, hops a metre or so off) and goes under. None of them watches the walker.
//
// Room to itself (2026-11-16, after the count of walks of the merged tree found two chorus frogs afloat 8 cm apart, one
// under the water 2 cm from a newt on the bed, and a dipper on the bed 10 cm from one). Every place a frog goes (a seat,
// a float, a spot under the water or under cover, where a hop or a leap lands, where a stroke ends) has no other animal
// within ROOM of it, where it is or where it is about to land (`world.free`), nor a big animal's body or one on the
// wing coming down there (`world.crowd`). Where it is going is held for it (`bird.flight`): its leap's landing, for a
// dive the place on the bed it goes down to, and the end of a stroke. The way there (a leap's arc, a few strokes, a
// swim under the water) comes no nearer any other animal than PATH, or than it is already (`clearWay`, by one measure
// for both, `nearness`), and a stroke stops where another has come into its way. If another animal comes within KEEP
// of where it is, it moves off at once: from under the water or under cover to another place there, out of sight (or
// it is gone for a while), from the ground or the water in a hop, a few strokes or a dive. The count of walks steps a
// tenth of a second at a time, and what goes about the water on foot or under it (a newt at 0.09 m/s at the most, a
// dipper wading at 0.5) does not cover the 0.12 m between KEEP and 0.15 in one step.
//
// The chorus. A chorus frog in a bout of calling plays its recording (sound/voices.js, from the kind's file: three
// calls in 4.4 s) and blows its sac up for each call (`call.notes`). From dusk it calls every few seconds, by day
// seldom (`call.day` times as seldom). A chorus goes quiet near the walker: a frog stops calling when the walker is
// within `call.hush` metres of it (further for one who runs), or when they are near another of its site and it is not
// far off; it starts again five to eighteen seconds after they have gone by, each frog in its own time, so the chorus
// starts again behind them. At most `call.most` frogs of the whole valley that can be heard are in a bout at once (a
// page plays eight voices at once at the most, and the birds of dusk are among them).
//
// From what was read (the species' sheets, and .local-assets/forest/research/beasts-herps-2026-11-16.json, entries 8,
// 9 and 13, all of it summaries of pages, none of the Olympic valleys themselves): the chorus frog is mostly nocturnal,
// spends much of its time hiding, calls mostly at night in large choruses ('kreck-ek'), and when disturbed hops a long
// way or jumps into water; the red-legged frog stays still to avoid being seen and leaps into brush or water when a
// threat comes too near, favours land, in long jumps, and in water mostly keeps to the surface and swims along the
// bank (one account; another has it plunging to the bottom), is mostly about by night in wet weather, keeps to damp
// forest once its breeding (January to April) is over, and is silent in May; the toad is slow, walks or crawls with
// short hops, waits for prey on the ground or in a shallow burrow, hides under logs and rocks, and after breeding is
// mainly about by night. Not found, and so the agent's own: how any of them takes a walker (no source had a distance,
// or a toad's freezing), whether a chorus stops at a footstep, every distance, time, chance and share below, that the
// frogs float and dive here at all, the hush's distances and its five to eighteen seconds.

const D = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _w = new THREE.Vector3(), _e = new THREE.Vector3();
// metres: the room a frog takes wherever it goes; how near another animal may come before it moves off; how near its way
// may pass another (the header)
const ROOM = 0.32, KEEP = 0.27, PATH = 0.2;
// every activity names these, besides the plan's neutral pose (life/bodies.js `rest`), so nothing is left over from the last
const BASE = { height: 0, pitch: 0, afloat: false, lift: 0 };
const FLOAT = 0.19, FLOAT_SWIM = 0.35;                   // afloat: snout up by this much (radians), the legs trailing by this much

// the chorus in each world: when each bout that can be heard ends, and each site's nearest member to the walker
const CHORUS = new WeakMap();
const chorusOf = (world) => { let c = CHORUS.get(world); if (!c) { c = { ends: [], sites: new Map() }; CHORUS.set(world, c); } return c; };

// The water line on a frog afloat, in metres above the point it stands on: its body turned snout up about its hips
// (life/frog.js lays the axis, the hips and the eye out; life/frogRig.js turns the body about the hips), the lower
// third of its eye under the water.
function waterline(sheet, pitch) {
  const S = sheet.shape, th = S.axis[1] * D, E = S.eye, L = S.svl / 1000;
  const onAxis = (s, n) => [(-0.5 + s) * Math.cos(th) - n * Math.sin(th), S.axis[0] + s * Math.sin(th) + n * Math.cos(th)];
  const [px, py] = onAxis(0.22, 0), [ex, ey] = onAxis(E.s, E.up), dx = ex - px, dy = ey - py;
  return (py + dx * Math.sin(pitch) + dy * Math.cos(pitch) - 0.3 * E.r) * L;
}

function hopper(a) {
  const { bird, world, way, r } = a, home = bird.home, places = home.places, site = home.site;
  const toad = way.kind === 'toad', chorus = !!way.call;
  const line = waterline(bird.sheet, FLOAT - FLOAT_SWIM * 0.12);
  // where it is, kept across its activities: its seat, the water it floats on, what it is under
  const at = { seat: null, float: null, cover: null };
  let heading = r() * Math.PI * 2, out = 0, quiet = 0, callIn = 1 + r() * 4;

  const dark = () => world.day < 0.55;
  const share = () => way.hidden[dark() ? 1 : 0];
  const outFor = () => Math.max(4, way.cycle * (1 - share()) * (0.5 + r()));
  const underFor = () => way.cycle * Math.max(0.1, share()) * (0.5 + r()) + 3;
  const face = () => frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q);
  // (how long a toad takes to shuffle down into the litter, s, and how far down it is then, m: the agent's numbers)
  const DIG = 1.6, DEPTH = Math.min(0.045, bird.size * 0.5);
  const show = (on) => { bird.hide = !on; };
  // (a stride's or a kick's phase is let go at a whole turn, so that the page does not spin it back to nothing)
  const whole = () => ({ cycle: Math.round(bird.pose.cycle || 0) });
  // ---- room (the header): how near the nearest other animal is to `p`, where it is or where it is about to be (a leap's
  // landing, a stroke's end, whatever it is doing), a big animal by its body and one on the wing by where it comes down
  // (`world.crowd`); one measure for a way's threshold and for every point of it
  const _near = [];
  const nearness = (p) => {
    let least = world.crowd(p, bird);
    if (world.others) {
      for (const b of world.others(p.x, p.z, 3, bird, _near)) {
        if (b.state !== 'fly') least = Math.min(least, b.at.distanceTo(p));
        if (b.flight && b.flight.d && !b.flight.through) least = Math.min(least, b.flight.d.distanceTo(p));
      }
    }
    return least;
  };
  // a place with room for it: no other animal there or on its way there within `room`, nor near by
  const roomFor = (p, room = ROOM) => world.free(p, bird, room) && nearness(p) >= room;
  const free = (x, y, z, room = ROOM) => roomFor(_v.set(x, y, z), room);
  // the way from `from` to `to`, rising by `apex` over its middle (a leap's arc): at no point of it nearer another animal
  // than PATH, or than it is at `from` if it is nearer already (so that one too near can always get away)
  const clearWay = (from, to, apex = 0) => {
    const d = Math.hypot(to.x - from.x, to.z - from.z) + Math.abs(to.y - from.y), n = Math.max(2, Math.ceil(d / 0.05));
    const least = Math.max(0, Math.min(PATH, nearness(from) - 0.01));
    for (let i = 1; i <= n; i += 1) {
      const u = i / n;
      _w.lerpVectors(from, to, u); _w.y += 4 * apex * u * (1 - u);
      if (nearness(_w) < least) return false;
    }
    return true;
  };
  // how far a step may bring it in on the nearest other animal: no nearer than PATH, or than it is now
  const keepsOff = (next) => nearness(next) >= Math.max(0, Math.min(PATH, nearness(bird.at) - 0.005));
  const eyeTo = (x, z) => Math.hypot(x - world.eye.x, z - world.eye.z);
  const surface = (x, z) => places.surfaceAt(x, z);
  // on the water at (x, z): its eyes out, the rest under (never under the ground there)
  const onWater = (x, z, out_ = bird.at) => { const level = surface(x, z) ?? world.height(x, z); return out_.set(x, Math.max(level - line, world.height(x, z)), z); };

  // ---- places about its site
  const seatPoint = (seat, out_ = _p) => out_.set(seat.x, world.height(seat.x, seat.z), seat.z);
  // a seat of its site within `reach` of (x, z): free, clear of the walker, and not the one it is on
  const pickSeat = (x, z, reach, { clear = true } = {}) => {
    let best = null, most = -Infinity;
    for (const seat of site.seats) {
      const d = Math.hypot(seat.x - x, seat.z - z);
      if (d > reach || seat === at.seat) continue;
      const p = seatPoint(seat);
      if (!free(p.x, p.y, p.z) || (clear && !a.clear(p, 0.5))) continue;
      const score = r() - (d / reach) * 0.6;
      if (score > most) { most = score; best = seat; }
    }
    return best;
  };
  // a place on the water within `reach`, free and (if asked) clear of the walker
  const pickFloat = (x, z, reach, { clear = true } = {}) => {
    if (!way.floats) return null;
    let best = null, most = -Infinity;
    for (const one of site.floats) {
      const d = Math.hypot(one.x - x, one.z - z);
      if (d > reach || one === at.float) continue;
      const p = onWater(one.x, one.z, _p);
      if (!free(p.x, p.y, p.z) || (clear && !a.clear(p, 0.5))) continue;
      const score = r() - (d / reach) * 0.6;
      if (score > most) { most = score; best = one; }
    }
    return best;
  };
  // a place under the water near (x, z): on its bed, free, and no deeper than it may go
  const underWater = (x, z, reach = 0.45) => {
    if (!way.floats) return null;
    for (let k = 0; k < 9; k += 1) {
      const turn = r() * 6.283, d = k ? reach * r() : 0, px = x + Math.cos(turn) * d, pz = z + Math.sin(turn) * d;
      const level = surface(px, pz);
      if (level == null) continue;
      const y = world.height(px, pz), deep = level - y;
      if (deep < 0.04 || deep > (way.under ?? 0.3) - 0.01 || !free(px, y + 0.01, pz)) continue;
      return { x: px, y, z: pz, level, water: true, what: 'water' };
    }
    return null;
  };
  // a place under cover within `reach` of (x, z): under the leaves of a cabbage or a fern, or in the grass; with
  // `away`, none nearer the walker than (x, z) is
  // (the toad goes about a stretch of the walk and not a site: it looks among every sword fern by the walk, and the
  // glade's skunk cabbage)
  const _ferns = [];
  const coversAround = (x, z, reach) => {
    if (!toad || !world.coversNear) return site.covers;
    const ferns = world.coversNear(x, z, reach, _ferns);
    return site.type === 'glade' ? [...ferns, ...site.covers.filter((c) => c.what === 'cabbage')] : ferns;
  };
  // (`start`: where it goes from, if it goes there now: then only cover it can reach in leaps over the ground, no
  // longer each than its longest, is taken; the way leap and the toad's hops go in such steps)
  const overGround = (x0, z0, x1, z1) => {
    const d = Math.hypot(x1 - x0, z1 - z0), most = way.leap[1] * 1.15;
    for (let t = most / d; t < 1; t += most / d) if (!ground(x0 + (x1 - x0) * t, z0 + (z1 - z0) * t)) return false;
    return true;
  };
  const coverNear = (x, z, reach, away = false, start = null) => {
    const from = eyeTo(x, z);
    let best = null, most = -Infinity;
    for (const c of coversAround(x, z, reach)) {
      const d = Math.hypot(c.x - x, c.z - z);
      if (d > reach || (away && eyeTo(c.x, c.z) < from + 0.3)) continue;
      const turn = r() * 6.283, far = c.reach * 0.5 * r(), px = c.x + Math.cos(turn) * far, pz = c.z + Math.sin(turn) * far, y = world.height(px, pz);
      if (!free(px, y, pz) || surface(px, pz) != null || (start && !overGround(start.x, start.z, px, pz))) continue;
      const score = -d + r() * 0.6;
      if (score > most) { most = score; best = { x: px, y, z: pz, water: false, what: c.what || 'fern' }; }
    }
    return best;
  };
  const words = { water: 'under the water', cabbage: 'under a skunk cabbage leaf', fern: 'under a sword fern', grass: 'down in the grass', litter: 'dug into the litter' };

  // ---- getting about
  // A leap's arc rises this much over its middle; further than its longest leap goes, it is gone in leaps over the ground
  // between, each no longer than the kind's longest, and each landing on the way on the ground and with room (or none:
  // then one long leap); this is the first of them, from `from`.
  const apexOf = (far) => 0.02 + 0.22 * far;
  const legOf = (from, goal) => {
    const far = Math.hypot(goal.x - from.x, goal.z - from.z), most = way.leap[1] * 1.15;
    if (far > most * 1.05) {
      for (const share of [1, 0.8, 0.6]) {
        const k = (most * share) / far, x = from.x + (goal.x - from.x) * k, z = from.z + (goal.z - from.z) * k, y = world.height(x, z);
        if (ground(x, z) && free(x, y, z)) return new THREE.Vector3(x, y, z);
      }
    }
    return goal;
  };
  // what a leap holds for it: where it lands, or for a dive, the place on the bed it goes down to
  const holdOf = (goal, then, args) => (then === 'under' && args[0] && args[0].water ? new THREE.Vector3(args[0].x, world.height(args[0].x, args[0].z) + 0.01, args[0].z) : goal);
  // A leap to `to`, to land into `then`: only if where it lands (and for a dive, where it goes down to) has room, and the
  // arc of its first leap, and the way down for a dive, keep off every other animal. False, and nothing done, otherwise.
  const leapTo = (to, doing, then, ...args) => {
    const hold = holdOf(to, then, args), leg = legOf(bird.at, to);
    if (!roomFor(to) || (hold !== to && (!roomFor(hold) || !clearWay(to, hold)))) return false;
    if (!clearWay(bird.at, leg, apexOf(Math.hypot(leg.x - bird.at.x, leg.z - bird.at.z)))) return false;
    a.to('leap', to, doing, then, ...args);
    return true;
  };
  // where it goes when it is put up, or goes: the water by its seat, the water it floats on, or cover near by
  // (a red-legged frog makes for the brush first and the water only if there is none; on the water it keeps to the
  // surface and swims off along the bank: an Idaho Fish and Game account, in the research file; the chorus frog the water
  // first)
  const shelter = (away) => {
    if (a.name === 'float') return underWater(bird.at.x, bird.at.z, 0.25);
    const water = () => (at.seat && at.seat.water && Math.hypot(at.seat.water.x - bird.at.x, at.seat.water.z - bird.at.z) < way.leap[1] * 2.5 ? underWater(at.seat.water.x, at.seat.water.z, 0.4) : null);
    const cover = () => coverNear(bird.at.x, bird.at.z, way.leap[1] * 3, away, bird.at);
    return way.kind === 'ranid' ? cover() || water() : water() || cover();
  };
  // A few strokes at the surface to (x, z): only if where they end has room and the way there keeps off every other
  // animal; where they end is held for it while it swims (`bird.flight`, let go when they end or it stops).
  const strokeTo = (now, x, z, strokes, fast = false) => {
    const end = onWater(x, z, new THREE.Vector3());
    if (!roomFor(end) || !clearWay(bird.at, end)) return false;
    const cycle = Math.round(bird.pose.cycle || 0);
    now.stroke = { x, z, cycle, end: cycle + strokes, fast };
    bird.flight = { a: bird.at.clone(), d: end, t: 0, time: Math.max(0.3, end.distanceTo(bird.at) / (way.stroke * (fast ? 3 : 1))), through: false };
    return true;
  };
  const stopStroke = (now) => {
    const s = now.stroke;
    now.stroke = null; bird.flight = null;
    bird.want.swim = FLOAT_SWIM; bird.want.cycle = Math.round(s ? s.cycle : bird.pose.cycle || 0) + 0.25;
    now.wait = 1 + r() * 4;
  };
  // off across the water, at the surface, away from the walker (or, given `spread`, any way round `base`): a metre or so,
  // to where it is still deep enough to float
  const swimOff = (now, base = Math.atan2(bird.at.z - world.eye.z, bird.at.x - world.eye.x), spread = 1.8) => {
    for (let k = 0; k < 8; k += 1) {
      const turn = base + (r() - 0.5) * spread, d = 0.6 + r() * 0.9, x = bird.at.x + Math.cos(turn) * d, z = bird.at.z + Math.sin(turn) * d;
      let wet = true;
      for (let j = 1; j <= 4 && wet; j += 1) {
        const t = j / 4, px = bird.at.x + (x - bird.at.x) * t, pz = bird.at.z + (z - bird.at.z) * t, level = surface(px, pz);
        wet = level != null && level - world.height(px, pz) >= line + 0.01;
      }
      if (!wet || !strokeTo(now, x, z, 7, true)) continue;
      heading = turn; face();
      now.wait = 0;
      return true;
    }
    return false;
  };
  // with neither water nor cover in reach: a leap or two away from the walker, on the ground (not onto the trail)
  const awayFrom = (far = null) => {
    const base = Math.atan2(bird.at.z - world.eye.z, bird.at.x - world.eye.x);
    for (let k = 0; k < 6; k += 1) {
      const turn = base + (r() - 0.5) * 1.4, d = far ?? way.leap[0] + r() * (way.leap[1] - way.leap[0]), x = bird.at.x + Math.cos(turn) * d, z = bird.at.z + Math.sin(turn) * d, y = world.height(x, z);
      if (!ground(x, z) || world.ground(x, z) === 'tread' || !free(x, y, z)) continue;
      return { x, y, z, water: false, what: 'ground' };
    }
    return null;
  };
  const into = (w, then = null) => {
    // (the red-legged frog, put up, lands on the water and swims off at its surface, mostly; off for good, it goes under)
    if (w.water && way.kind === 'ranid' && a.name !== 'float' && !(then && then.gone != null) && r() < 0.7) {
      if (leapTo(onWater(w.x, w.z, new THREE.Vector3()), 'leaping into the water', 'float', { x: w.x, z: w.z }, true)) return true;
    }
    if (w.what === 'ground') return leapTo(new THREE.Vector3(w.x, w.y, w.z), 'leaping away', 'forage', { x: w.x, z: w.z }, 0.6 + r());
    if (a.name === 'float' && w.water) {
      // (a dive where it floats: down to the bed, by a way that keeps off every other animal)
      _e.set(w.x, world.height(w.x, w.z) + 0.01, w.z);
      if (!roomFor(_e) || !clearWay(bird.at, _e)) return false;
      a.to('under', w, then); bird.doing = 'diving under'; return true;
    }
    if (w.water) return leapTo(new THREE.Vector3(w.x, w.level, w.z), 'leaping into the water', 'under', w, then);
    return leapTo(new THREE.Vector3(w.x, w.y, w.z), w.what === 'cabbage' ? 'leaping in under the skunk cabbage' : w.what === 'grass' ? 'leaping into the grass' : 'leaping for cover', 'under', w, then);
  };

  // ---- the chorus
  const hushed = () => {
    if (!chorus) return true;
    const c = chorusOf(world), d = bird.at.distanceTo(world.eye), reach = way.call.hush * pace(world);
    let s = c.sites.get(site);
    if (!s) { s = { stamp: -1, least: Infinity, last: Infinity }; c.sites.set(site, s); }
    if (s.stamp !== world.clock) { s.last = s.least; s.least = d; s.stamp = world.clock; } else s.least = Math.min(s.least, d);
    if (d < reach || (Math.min(s.least, s.last) < reach * 0.8 && d < reach * 1.8)) quiet = world.clock + 5 + r() * 13;
    return world.clock < quiet;
  };
  // a bout of calling, if it may: the recording played (if it can be heard at all), the sac blown up for each call
  const startBout = (now) => {
    const c = chorusOf(world), d = bird.at.distanceTo(world.eye), heard = d <= way.call.reach;
    c.ends = c.ends.filter((end) => end > world.clock);
    if (heard && c.ends.length >= way.call.most) { callIn = 0.6 + r() * 2; return false; }
    if (heard) { c.ends.push(world.clock + way.call.clip); world.say(bird, 'call', way.call.reach); }
    now.bout = { t: 0 };
    return true;
  };
  const inBout = (now, dt) => {
    const b = now.bout;
    b.t += dt;
    let sac = 0;
    for (const [start, long] of way.call.notes) if (b.t >= start && b.t <= start + long) sac = 1;
    Object.assign(bird.want, { sac, lift: 0.45, jaw: 0, head: { yaw: 0, pitch: 0.12 } });
    bird.doing = way.call.doing;
    if (b.t < way.call.clip) return true;
    now.bout = null; now.wait = 0.4 + r() * 1.2;
    callIn = (way.call.every[0] + r() * (way.call.every[1] - way.call.every[0])) * (dark() ? 1 : way.call.day);
    return false;
  };

  // ---- the toad's walk
  const sideOf = (x, z) => { const [, s] = world.trail.locate(x, z); world.trail.sample(s, _p, _t); return -(x - _p.x) * _t.z + (z - _p.z) * _t.x; };
  const ground = (x, z) => { const kind = world.ground(x, z); return kind !== 'water' && kind !== 'steep' && !world.solidAt(x, z, 0.08) && surface(x, z) == null; };
  const toadTarget = () => {
    const len = world.trail.length, side0 = Math.sign(sideOf(bird.at.x, bird.at.z)) || 1;
    for (let k = 0; k < 10; k += 1) {
      const s = (((home.s + (r() - 0.5) * 12) % len) + len) % len, cross = r() < 0.55, side = (cross ? -side0 : side0) * (0.6 + r() * 3);
      world.trail.sample(s, _p, _t);
      const x = _p.x - _t.z * side, z = _p.z + _t.x * side, d = Math.hypot(x - bird.at.x, z - bird.at.z);
      if (d < 0.6 || d > 7 || !ground(x, z)) continue;
      // (not through a trunk, a log or a stump on the way)
      let clear = true;
      for (let j = 1; j < 6 && clear; j += 1) { const t = j / 6; clear = ground(bird.at.x + (x - bird.at.x) * t, bird.at.z + (z - bird.at.z) * t); }
      if (clear) return { x, z, cross };
    }
    return null;
  };
  const crawl = (now, dt) => {
    const w = now.walk, dx = w.x - bird.at.x, dz = w.z - bird.at.z, d = Math.hypot(dx, dz);
    if (d < 0.03) { if (w.cover) { a.to('under', w.cover); return true; } now.walk = null; now.wait = 2 + r() * 9; return false; }
    // it turns towards where it is going a little at a time
    const want = Math.atan2(dz, dx);
    heading += clamp(Math.atan2(Math.sin(want - heading), Math.cos(want - heading)), -dt * 1.5, dt * 1.5);
    const step = Math.min(d, way.crawl * dt * Math.max(0, Math.cos(want - heading))), x = bird.at.x + Math.cos(heading) * step, z = bird.at.z + Math.sin(heading) * step;
    // (it stops where another animal has come into its way)
    if (!ground(x, z) || !keepsOff(_e.set(x, world.height(x, z), z))) { now.walk = null; now.wait = 1 + r() * 3; return false; }
    bird.at.copy(_e); face();
    w.cycle += dt * (way.crawl / 0.05);
    Object.assign(bird.want, { walk: 1, cycle: w.cycle, lift: 0.22, head: { yaw: 0, pitch: -0.05 } });
    bird.doing = w.cover ? 'walking off to its cover' : world.ground(x, z) === 'tread' ? 'crossing the trail, slowly' : 'walking slowly over the forest floor';
    return true;
  };

  // ---- coming out from under
  const emerge = () => {
    if (toad) {
      for (let k = 0; k < 6; k += 1) {
        // (out of the litter where it went in: it came out up to 0.7 m from there, in one frame. From under a plant
        // or wood, a step out from it)
        const dug = at.cover && at.cover.what === 'litter';
        const turn = r() * 6.283, d = dug ? 0 : 0.2 + r() * 0.5, x = bird.at.x + Math.cos(turn) * d, z = bird.at.z + Math.sin(turn) * d, y = world.height(x, z);
        if (!ground(x, z) || !free(x, y, z) || !a.clear(_v.set(x, y, z), 0.5)) continue;
        heading = turn; face();
        a.to('forage', { x, z }, 1 + r() * 2);
        bird.doing = 'crawling out';
        return true;
      }
      return false;
    }
    if (at.cover && at.cover.water) {
      // (up to the surface by a way under the water that keeps off every other animal; or out onto the bank from there)
      const f = r() < 0.35 || !site.seats.length ? pickFloat(bird.at.x, bird.at.z, 1.6) : null;
      if (f && clearWay(bird.at, onWater(f.x, f.z, _e))) { a.to('float', f); bird.doing = 'coming up for air'; return true; }
      const seat = pickSeat(bird.at.x, bird.at.z, 2.5);
      if (seat) {
        const was = bird.at.clone();
        onWater(bird.at.x, bird.at.z);
        if (leapTo(seatPoint(seat).clone(), 'climbing out onto the bank', 'forage', seat)) return true;
        bird.at.copy(was);
      }
      return false;
    }
    const seat = pickSeat(bird.at.x, bird.at.z, 2.2);
    if (seat) return leapTo(seatPoint(seat).clone(), 'hopping out', 'forage', seat);
    return false;
  };
  // under, out of sight: in the water by it, or under cover near by
  const hideNear = (x, z) => {
    if (toad) { const c = coverNear(x, z, 5); return c || (free(x, world.height(x, z), z) ? { x, y: world.height(x, z), z, water: false, what: 'litter' } : null); }
    return underWater(x, z, 0.8) || coverNear(x, z, 3) || null;
  };
  // Another animal come within KEEP of it (the header): it moves off at once. Hidden, it goes to another place under
  // the water or under cover near by, by a way under it that keeps off the other, or with none it is gone for a while
  // (out of sight, it may); on the ground or afloat, in a hop to another seat, into the water or cover, a few strokes
  // off, a dive, or a climb out; and gone, if it is out of the walker's plain sight and has nowhere to go.
  const goneAwhile = () => { bird.left = 25 + r() * 50; a.to('gone'); return true; };
  const budge = () => {
    if (a.name === 'under') {
      const water = at.cover && at.cover.water, x = bird.at.x, z = bird.at.z;
      const w = water ? underWater(x, z, 0.9) : toad ? coverNear(x, z, 4) || awayFrom(0.35 + r() * 0.5) : coverNear(x, z, 3) || underWater(x, z, 0.9);
      if (w && clearWay(bird.at, _e.set(w.x, world.height(w.x, w.z) + (w.water ? 0.01 : 0), w.z))) {
        const until = a.now.until;
        a.to('under', w.what === 'ground' ? { ...w, what: 'litter' } : w, { until: Math.max(1, until) });
        return true;
      }
      return goneAwhile();
    }
    if (a.name === 'float') {
      if (swimOff(a.now, r() * 6.283, 6.283)) return true;
      const w = underWater(bird.at.x, bird.at.z, 0.6);
      if (w && into(w)) return true;
      const seat = pickSeat(bird.at.x, bird.at.z, 2.2);
      if (seat && leapTo(seatPoint(seat).clone(), 'climbing out onto the bank', 'forage', seat)) return true;
    } else if (a.name === 'forage') {
      if (toad) {
        const g = awayFrom(0.3 + r() * 0.4);
        if (g && leapTo(new THREE.Vector3(g.x, g.y, g.z), 'hopping out of the way', 'forage', { x: g.x, z: g.z }, 0.6 + r())) return true;
      } else {
        const seat = pickSeat(bird.at.x, bird.at.z, 1.8);
        if (seat && leapTo(seatPoint(seat).clone(), 'hopping out of the way', 'forage', seat)) return true;
        const w = shelter(false);
        if (w && into(w)) return true;
        const g = awayFrom();
        if (g && into(g)) return true;
      }
    } else return false;
    return !world.plainly(bird) ? goneAwhile() : false;
  };
  let squeezed = 0;
  const goUnder = (now) => {
    if (toad) {
      // the toad walks off to its cover, or digs into the litter where it is
      const c = coverNear(bird.at.x, bird.at.z, 5, false, bird.at);
      if (c) { now.walk = { x: c.x, z: c.z, cycle: Math.round(bird.pose.cycle || 0), cover: c }; return true; }
      if (world.plainly(bird)) return false;
      a.to('under', { x: bird.at.x, y: bird.at.y, z: bird.at.z, water: false, what: 'litter' });
      return true;
    }
    const w = shelter(false);
    return w ? into(w) : false;
  };

  const activities = {
    // on the ground: sitting, snapping, hopping about its seat, calling; the toad walking
    forage: {
      pose: () => ({ ...BASE, ...whole() }),
      enter: (a, spot, wait = 0.3 + r() * 1.5, flee = null) => {
        show(true);
        at.seat = spot.water !== undefined ? spot : null; at.float = null; at.cover = null;
        // (on a seat the walk cannot see, behind skunk cabbage or ferns: drawn, but under cover, as a wren in its fern
        // is: not the pointer's, not in sight; life/places/frogs2.js says which)
        bird.cover = !!(at.seat && at.seat.hid);
        bird.at.set(spot.x, world.height(spot.x, spot.z), spot.z);
        // a frog at the water's edge mostly sits facing out over the water
        if (spot.out && !flee && r() < 0.7) heading = Math.atan2(spot.out[1], spot.out[0]) + (r() - 0.5) * 1.2;
        face();
        Object.assign(a.now, { wait, snap: 0, bout: null, walk: null, still: 0, flee });
        if (out <= 0) out = outFor();
      },
      step: (a, dt) => {
        const now = a.now;
        now.wait -= dt; out -= dt; callIn -= dt;
        if (chorus) hushed();
        Object.assign(bird.want, { sac: 0, jaw: 0, walk: 0, lift: toad ? 0.1 : 0.05, head: { yaw: 0, pitch: 0 } });
        // (the toad, put up: on in short hops to its cover, and under it)
        if (now.flee) {
          const c = now.flee, d = Math.hypot(c.x - bird.at.x, c.z - bird.at.z);
          if (now.wait > 0) { bird.doing = c.what === 'ground' ? 'hopping off' : 'making for cover'; return; }
          if (d < 0.12) {
            if (c.what === 'ground') { now.flee = null; now.wait = 1 + r() * 3; now.still = 2 + r() * 3; return; }
            a.to('under', c); return;
          }
          const step = Math.min(d, way.hop[0] + r() * (way.hop[1] - way.hop[0])), x = bird.at.x + ((c.x - bird.at.x) / d) * step, z = bird.at.z + ((c.z - bird.at.z) / d) * step;
          heading = Math.atan2(c.z - bird.at.z, c.x - bird.at.x);
          if (leapTo(new THREE.Vector3(x, world.height(x, z), z), c.what === 'ground' ? 'hopping off, in short hops' : 'making for cover in short hops', 'forage', { x, z }, 0.25 + r() * 0.3, c)) return;
          // (its next hop has no room, another animal in its way: it waits a moment, and after a few tries keeps still)
          now.wait = 0.3 + r() * 0.4; now.stuck = (now.stuck || 0) + 1;
          if (now.stuck > 4) { now.flee = null; now.still = 1.5 + r() * 2; }
          return;
        }
        if (now.still > 0) { now.still -= dt; Object.assign(bird.want, { lift: 0, head: { yaw: 0, pitch: -0.12 } }); bird.doing = 'sitting still, pressed to the ground'; return; }
        if (now.snap > 0) {
          now.snap -= dt;
          Object.assign(bird.want, { jaw: now.snap > 0.12 ? 0.7 : 0, lift: 0.3, head: { yaw: 0, pitch: -0.3 } });
          bird.doing = 'snapping up an insect';
          return;
        }
        if (now.bout && inBout(now, dt)) return;
        if (now.walk && crawl(now, dt)) return;
        // (from dusk calling is what a chorus frog sits there for: a bout begins as soon as it may)
        if (chorus && dark() && callIn <= 0 && !hushed() && startBout(now)) return;
        if (now.wait > 0) {
          bird.doing = toad ? (dark() ? 'sitting on the forest floor' : 'sitting in the open') : at.seat && at.seat.type === 'glade' ? 'sitting on the wet ground' : 'sitting at the water\'s edge';
          return;
        }
        // time to go under (or, the toad by day, to its cover)
        if (out <= 0 && !now.walk) { if (goUnder(now)) return; out = 6 + r() * 6; }
        if (chorus && callIn <= 0 && !hushed() && startBout(now)) return;
        const k = r();
        if (toad) {
          if (dark() && k < 0.55) { const w = toadTarget(); if (w) { now.walk = { x: w.x, z: w.z, cycle: Math.round(bird.pose.cycle || 0) }; return; } }
          if (k < 0.75) { now.snap = 0.22; now.wait = 2 + r() * 5; return; }
          now.wait = 2 + r() * 6;
          return;
        }
        if (k < 0.22) { now.snap = 0.22; now.wait = 1.5 + r() * 4; return; }
        if (k < 0.4) {
          // a hop to another seat near by
          const seat = pickSeat(bird.at.x, bird.at.z, Math.max(way.hop[1] * 4, 1.2));
          if (seat && leapTo(seatPoint(seat).clone(), 'hopping along the water\'s edge', 'forage', seat)) return;
        } else if (k < 0.52) {
          // a turn, in a little hop
          const turn = heading + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 1.4), x = bird.at.x + Math.cos(turn) * 0.03, z = bird.at.z + Math.sin(turn) * 0.03;
          if (ground(x, z) && leapTo(new THREE.Vector3(x, world.height(x, z), z), 'turning', 'forage', at.seat ? { ...at.seat, x, z, out: null } : { x, z }, 0.5 + r() * 2)) return;
        } else if (k < 0.6 && at.seat && at.seat.water) {
          // into the water, to float
          const f = pickFloat(at.seat.water.x, at.seat.water.z, 1.5);
          if (f && leapTo(onWater(f.x, f.z, new THREE.Vector3()), 'hopping into the water', 'float', f)) return;
        }
        now.wait = (dark() ? 3 : 5) + r() * 10;
      },
    },

    // in the air, on a leap's arc, to land into `then`
    leap: {
      pose: () => ({ ...BASE, ...whole(), leap: 1, lift: 0.2 }),
      enter: (a, goal, doing, then, ...args) => {
        show(true);
        // (the first of its leaps, as `leapTo` found it clear: `legOf`)
        const from = bird.at.clone(), to = legOf(from, goal);
        const dist = Math.hypot(to.x - from.x, to.z - from.z);
        if (dist > 0.01) heading = Math.atan2(to.z - from.z, to.x - from.x);
        face();
        const time = Math.max(0.16, 0.2 + 0.24 * dist), apex = apexOf(dist);
        Object.assign(a.now, { from, to: to.clone(), goal: goal.clone(), last: to === goal, doing, t: 0, time, apex, then, args });
        // (where it is making for is held, the last landing, or the place on the bed a dive goes down to: no other animal
        // is to come there meanwhile)
        bird.flight = { a: from, d: holdOf(goal, then, args).clone(), t: 0, time, through: false };
        bird.doing = doing;
      },
      step: (a, dt) => {
        const now = a.now;
        now.t += dt;
        const u = Math.min(1, now.t / now.time);
        bird.at.lerpVectors(now.from, now.to, u);
        bird.at.y += 4 * now.apex * u * (1 - u);
        bird.at.y = Math.max(bird.at.y, world.height(bird.at.x, bird.at.z));
        if (bird.flight) bird.flight.t = u;
        // the legs driven out, then gathered for the landing; the body tipped up as it rises and over as it comes down
        Object.assign(bird.want, { leap: u < 0.62 ? 1 : Math.max(0, 1 - (u - 0.62) / 0.3), pitch: 0.3 * (1 - 2 * u) });
        if (u < 1) return;
        if (now.last) { a.to(now.then, ...now.args); return; }
        // (on in the next leap of the run, if its arc is clear and where it goes still has room; or it stops here)
        const leg = legOf(bird.at, now.goal), hold = holdOf(now.goal, now.then, now.args);
        if (roomFor(hold) && clearWay(bird.at, leg, apexOf(Math.hypot(leg.x - bird.at.x, leg.z - bird.at.z)))) a.to('leap', now.goal, now.doing, now.then, ...now.args);
        else a.to('forage', { x: bird.at.x, z: bird.at.z }, 0.4 + r() * 0.8);
      },
      exit: () => { bird.flight = null; },
    },

    // on the water: eyes and nostrils out, the hind legs trailing; a few strokes now and then
    float: {
      pose: () => ({ ...BASE, ...whole(), afloat: true, pitch: FLOAT, swim: FLOAT_SWIM, cycle: Math.round(bird.pose.cycle || 0) + 0.25 }),
      enter: (a, spot, flee = false) => {
        show(true);
        at.float = spot; at.seat = null; at.cover = null;
        onWater(spot.x, spot.z);
        face();
        Object.assign(a.now, { wait: 0.6 + r() * 2.5, stroke: null, bout: null, bob: r() * 6 });
        if (out <= 0) out = outFor();
        if (flee && !swimOff(a.now)) { const w = underWater(bird.at.x, bird.at.z, 0.3); if (w) into(w, { until: underFor() + 4 }); }
      },
      exit: () => { bird.flight = null; },
      step: (a, dt) => {
        const now = a.now;
        now.wait -= dt; out -= dt; callIn -= dt; now.bob += dt;
        if (chorus) hushed();
        if (now.stroke) {
          const s = now.stroke, dx = s.x - bird.at.x, dz = s.z - bird.at.z, d = Math.hypot(dx, dz);
          s.cycle += dt * 1.7;
          if (s.fast) s.cycle += dt * 1.3;
          const go = Math.min(d, way.stroke * (s.fast ? 3 : 1) * dt * (0.4 + 1.2 * Math.max(0, Math.sin(2 * Math.PI * s.cycle))));
          // (each stroke keeps off every other animal: one come into its way, it stops where it is)
          if (d > 0.01) {
            const next = onWater(bird.at.x + (dx / d) * go, bird.at.z + (dz / d) * go, _e);
            if (!keepsOff(next)) { stopStroke(now); return; }
            bird.at.copy(next);
          }
          if (bird.flight) bird.flight.t = Math.min(1, bird.flight.t + dt / bird.flight.time);
          Object.assign(bird.want, { swim: 1, cycle: s.cycle, sac: 0 });
          bird.doing = s.fast ? 'swimming off at the surface, along the bank' : 'swimming a few strokes';
          if (d < 0.02 || s.cycle > s.end) stopStroke(now);
          return;
        }
        onWater(bird.at.x, bird.at.z); bird.at.y += 0.0015 * Math.sin(now.bob * 1.7);
        Object.assign(bird.want, { sac: 0, swim: FLOAT_SWIM });
        if (now.bout && inBout(now, dt)) { bird.want.lift = 0; return; }
        if (now.wait > 0) { bird.doing = 'floating, only its eyes and nostrils above the water'; return; }
        if (out <= 0) {
          // done with the open water for now: under, or out onto the bank
          if (r() < 0.6) { const w = underWater(bird.at.x, bird.at.z, 0.25); if (w && into(w)) return; }
          const seat = pickSeat(bird.at.x, bird.at.z, 2.5);
          if (seat && leapTo(seatPoint(seat).clone(), 'climbing out onto the bank', 'forage', seat)) return;
          out = 5;
        }
        if (chorus && callIn <= 0 && !hushed() && startBout(now)) return;
        const k = r();
        if (k >= 0.4 && k < 0.6) {
          // out onto the bank
          const seat = pickSeat(bird.at.x, bird.at.z, 2);
          if (seat && leapTo(seatPoint(seat).clone(), 'climbing out onto the bank', 'forage', seat)) return;
        }
        if (k < 0.4) {
          // a few strokes, to somewhere a little way off on the water
          for (let tries = 0; tries < 6; tries += 1) {
            const turn = heading + (r() - 0.5) * 2.4, d = 0.15 + r() * 0.5, x = bird.at.x + Math.cos(turn) * d, z = bird.at.z + Math.sin(turn) * d;
            const level = surface(x, z);
            if (level == null || level - world.height(x, z) < line + 0.01 || !strokeTo(now, x, z, 2 + Math.floor(r() * 3))) continue;
            heading = turn; face();
            return;
          }
        }
        now.wait = 2 + r() * 6;
      },
    },

    // under the water, or under cover: not drawn, not in sight, not the pointer's
    under: {
      pose: () => ({ ...BASE, ...whole() }),
      enter: (a, where, then = null) => {
        // (a toad that digs into the litter where it sits shuffles down into it, and is gone when it is down: it
        // was gone in one frame, from open floor. One that comes to the visit there (`there`), or is leaving, is under already.)
        const digs = where.what === 'litter' && !(then && (then.gone != null || then.there)) && Math.hypot(where.x - bird.at.x, where.z - bird.at.z) < 0.05;
        show(digs); bird.cover = true;
        at.cover = where; at.seat = null; at.float = null;
        bird.at.set(where.x, world.height(where.x, where.z) + (where.water ? 0.01 : 0), where.z);
        bird.doing = digs ? 'shuffling down into the litter' : words[where.what] || 'out of sight';
        a.now.until = then && then.until != null ? then.until : underFor();
        a.now.dig = digs ? DIG : 0; a.now.rise = 0;
        if (then && then.gone != null) bird.left = then.gone;
      },
      step: (a, dt) => {
        const now = a.now;
        if (now.dig > 0) {
          now.dig -= dt;
          bird.at.y = world.height(bird.at.x, bird.at.z) - DEPTH * (1 - Math.max(0, now.dig) / DIG);
          if (now.dig <= 0) { show(false); bird.doing = words.litter; }
          return;
        }
        // (and comes up out of it the same way, before it goes anywhere)
        if (now.rise > 0) {
          now.rise -= dt;
          bird.at.y = world.height(bird.at.x, bird.at.z) - DEPTH * (Math.max(0, now.rise) / DIG);
          if (now.rise <= 0 && !emerge()) { show(false); bird.at.y = world.height(bird.at.x, bird.at.z); now.until = 2 + r() * 4; }
          return;
        }
        now.until -= dt;
        if (chorus) hushed();
        // (it stays under while the walker is near)
        if (bird.at.distanceTo(world.eye) < way.flush * pace(world) * 1.8 + 1.5) now.until = Math.max(now.until, 1.5 + r() * 2.5);
        if (now.until > 0) return;
        if (toad && !dark()) { now.until = 10 + r() * 20; return; }
        if (r() < share() * 0.7) { now.until = underFor() * 0.5; return; }
        if (at.cover && at.cover.what === 'litter') { show(true); now.rise = DIG; bird.at.y = world.height(bird.at.x, bird.at.z) - DEPTH; bird.doing = 'coming up out of the litter'; return; }
        if (!emerge()) now.until = 2 + r() * 4;
      },
    },

    // away: gone from under the water or from under cover, where the walker cannot see it go
    gone: { pose: () => ({ ...BASE }), enter: () => { show(false); bird.cover = true; }, step: () => {} },
  };

  return {
    activities,
    // The walker: the bird's rule, with a frog's manner (its refuge, below); the toad keeps still while they are near.
    react: (a, dt) => {
      if (!a.act) return false;
      // (another animal within KEEP of it: it moves off at once, first of all; with nowhere to go it looks again in a moment)
      squeezed -= dt;
      if (squeezed <= 0 && a.name !== 'leap' && a.name !== 'gone' && nearness(bird.at) < KEEP) {
        if (budge()) return true;
        squeezed = 0.2;
      }
      if (a.name === 'leap' || a.name === 'under' || a.name === 'gone') return false;
      if (a.name === 'float' && a.now.stroke && a.now.stroke.fast) return false;
      if (toad && a.name === 'forage') {
        // (a toad already making for cover in its hops is left to it; one walking off to its cover at dawn keeps on
        // unless it is put up; any other keeps still while the walker is near)
        if (a.now.flee) return false;
        if (!(a.now.walk && a.now.walk.cover) && bird.at.distanceTo(world.eye) < way.still * pace(world) && !a.startled()) { a.now.still = Math.max(a.now.still, 1.5 + r() * 2); a.now.walk = null; }
      }
      return a.startled() ? a.flush() : false;
    },
    // Put up: a frog leaps into the water by it and goes under (one afloat goes under where it is), or into cover near
    // by, away from the walker; the toad makes for cover in short hops.
    refuge: () => {
      if (toad) {
        const c = coverNear(bird.at.x, bird.at.z, 4, true, bird.at) || coverNear(bird.at.x, bird.at.z, 4, false, bird.at) || awayFrom(1 + r() * 0.8);
        if (!c) return false;
        a.to('forage', { x: bird.at.x, z: bird.at.z }, 0, c);
        return true;
      }
      if (a.name === 'float' && way.kind === 'ranid' && r() < 0.7 && swimOff(a.now)) return true;
      // (its refuge, or a leap or two away if the way to it has no room)
      const w = shelter(true);
      if (w && into(w, { until: underFor() + 4 })) return true;
      const g = awayFrom();
      return !!g && into(g, { until: underFor() + 4 });
    },
    // Off for a while or for good: from where the walker cannot see it, at once; from where they can, into the water
    // or under cover first, and gone from there.
    leave: (seconds) => {
      if (a.name === 'under' || a.name === 'gone' || !world.plainly(bird)) { bird.left = seconds; a.to('gone'); return true; }
      if (a.name !== 'forage' && a.name !== 'float') return false;
      const w = toad ? coverNear(bird.at.x, bird.at.z, 4, true, bird.at) : shelter(true);
      return w ? into(w, { gone: seconds }) : false;
    },
    // In: at `to` if the walker cannot see it come there, and otherwise from under the water or cover by it.
    come: (to, landing, ...args) => {
      if (!world.plain(to.at, bird.size)) { bird.at.copy(to.at); a.to(landing, ...args); return true; }
      const w = hideNear(to.at.x, to.at.z);
      if (!w) return false;
      a.to('under', w, { until: 2 + r() * 8 });
      return true;
    },
    // Where it is when it comes: at its seat (the toad, about its stretch of the walk), or on its water, or out of sight
    // by it; out of sight if it would come in the walker's plain view there, and hidden by its share of the time.
    begin: () => {
      let spot = null, float = null;
      if (toad) {
        for (let k = 0; k < 8 && !spot; k += 1) {
          const len = world.trail.length, s = (((home.s + (r() - 0.5) * 12) % len) + len) % len, side = (r() < 0.5 ? -1 : 1) * (0.8 + r() * 3);
          world.trail.sample(s, _p, _t);
          const x = _p.x - _t.z * side, z = _p.z + _t.x * side;
          if (ground(x, z) && free(x, world.height(x, z), z, 0.35)) spot = { x, z };
        }
      } else {
        const seat = home.seat && free(home.seat.x, world.height(home.seat.x, home.seat.z), home.seat.z, 0.35) ? home.seat : pickSeat(site.x, site.z, 40, { clear: false });
        float = (!seat || r() < 0.3) ? pickFloat(site.x, site.z, 40, { clear: false }) : null;
        spot = float && (!seat || r() < 0.5) ? null : seat;
        if (!spot) spot = null; else float = null;
      }
      if (!spot && !float) { bird.left = 6 + r() * 10; return; }
      // (`p` a vector of its own: `face` sets `_v`, and with `p` as `_v` the test below was of a point by the world's origin)
      const x = spot ? spot.x : float.x, z = spot ? spot.z : float.z, p = spot ? new THREE.Vector3(x, world.height(x, z), z) : onWater(x, z, new THREE.Vector3());
      heading = r() * 6.283; face();
      if ((toad && !dark()) || r() < share() || (!a.life.first && world.plain(p, bird.size))) {
        const w = hideNear(x, z);
        if (!w) { bird.left = 5 + r() * 10; return; }
        a.to('under', w, { until: a.life.first ? r() * underFor() : underFor() * (0.3 + 0.7 * r()), there: true });
        return;
      }
      if (spot) a.to('forage', spot, r() * 3); else a.to('float', float);
    },
  };
}

// A kind's home on a visit: a site near the walk of a type it likes (`sites`), away from another party's of its kind if it
// can be; and each time one of it comes, a seat there of its own.
const homeOf = (way) => (habitat, r, taken = []) => {
  const places = placesOf(habitat), choices = [];
  let total = 0;
  for (const site of places.sites) {
    let w = (way.sites[site.type] || 0) * (1 - Math.min(1, Math.max(0, (site.off - way.off) / 10)));
    if (!(w > 0) || (!site.seats.length && (!way.floats || way.kind === 'toad'))) continue;
    if (taken.some((home) => home && home.site === site)) w *= 0.15;
    choices.push([site, w]); total += w;
  }
  if (!total) return null;
  let k = r() * total;
  for (const [site, w] of choices) { k -= w; if (k <= 0) return { site, places, x: site.x, z: site.z, s: site.s }; }
  const site = choices[choices.length - 1][0];
  return { site, places, x: site.x, z: site.z, s: site.s };
};
const spotOf = () => (home, r) => ({ ...home, seat: home.site.seats.length ? home.site.seats[Math.floor(r() * home.site.seats.length)] : null });

export default {
  // what a hopper's way holds besides what every way has (life/families/index.js); `under` and `fastest` are every way's
  fields: {
    ...WARY,                                         // how near it lets the walker come (life/behave.js)
    kind: oneOf('chorus', 'ranid', 'toad'),          // a frog that calls in chorus, a wary true frog, a toad that walks
    sites: rest({}, 'number'),                       // how much it likes each type of place (life/places/frogs2.js), 0 for none
    off: 'number',                                   // metres from the walk its site may be, thinning to none 10 m further
    hidden: nums(2), cycle: 'number',                // the share of its time it is hidden, by day and by night; seconds of one round
    leap: nums(2), hop: nums(2),                     // metres: a leap (into the water, or away), a hop (about its place)
    floats: 'boolean', stroke: 'number',             // whether it floats and swims; metres a second it swims
    crawl: 'number', still: 'number',                // (the toad) metres a second it walks; within this many metres it keeps still
    call: optional({ every: nums(2), day: 'number', reach: 'number', hush: 'number', most: 'number', clip: 'number', notes: list(nums(2), 1), doing: 'string' }),
  },
  act: (way) => (bird, world) => live(bird, world, way, hopper),
  home: homeOf,
  spot: spotOf,
};
