import * as THREE from 'three';
import { frame, flying, takeOff, straightOn, UP, pace } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';
import { hauntAt, hauntSites } from '../places/pigeon.js';
import { inCrown } from '../places/aerial2.js';

// Birds of the canopy that go about in flocks: the Band-tailed Pigeon. A flock is a party of the visit that goes
// about together (`together`), there or not as one (`herd`): every one of it has the same home (life/visit.js), and
// what the flock is doing is kept on that home (`flock`, below), so that its birds sit, feed, drink, fly, are put up
// and go as one. Its home is a haunt (life/places/pigeon.js): a stretch of the valley round one of its tall trees,
// with the lookouts, the trees and shrubs it feeds in, the water's edges and the roosts within reach of it.
//
// What a flock does, by turns: it sits high on a lookout (a snag's broken top, the top limbs of a tall conifer or an
// alder), the birds looking about, preening, the males cooing, and now and then a male flying up from it to glide
// a wide circle on stiff wings and come back; it comes down to feed in a tree in flower or in leaf (the old apple
// in blossom, the alders, the maples, a red elderberry where the habitat hands its shrubs over), the birds
// clambering about the boughs and reaching out for buds and flowers; it drinks at the water's edge (the spring
// under the old cedar, the creek, the river's cobbles), each bird with its bill in the water; it roosts in a thick
// conifer by night. After a few of those it is off, for a while or for good, flying fast and high over the trees.
//
// The walker. A flock is put up as one: when the walker comes too near any of its birds, or makes a sudden movement
// near by, the first bird up decides for all where they go, a tree near by and clear of the walker or off out of
// sight, and the rest follow it within a few tenths of a second, the flock clattering its wings as it goes. Whether a
// bird is put up, and which of the two it then does, is the skeleton's rule and no other (life/behave.js: the kind's
// own `flush` and `startle`, `a.startled()` and `a.flush()`, called from `react` because what is done is done for the
// flock): the same distance wherever the bird is, on a lookout, feeding or at the water. A hunting hawk's alarm puts
// the flock up the same way (`a.alarmed()`). (Until 2026-11-16 the family had a rule of its own, 1.2 times as far for
// a bird feeding and 1.5 times at the water, and took no notice of a hawk. If a flock is to be warier at the water,
// that is a number for the kind's way, which this family would then read.)
//
// From what was read (the species' file names the sources): flocks in most seasons, foraging in flocks even in the
// breeding season; perched in tall dead conifers near where they feed; feeding mostly in trees, climbing about
// with ease, even hanging upside down, and on the ground; buds, young leaves, flowers and berries; mineral springs
// in the breeding season, where they are counted between sunrise and noon (the river's edge and the creek are the
// brief's, not a source's); roosting in thick conifers; a long rest
// after feeding; swift, direct flight; the wings clap as a flock takes off; the male's display flight (up, then a
// wide circle on a glide, the wings fluttering towards its end) and his low, owl-like coo, given from a perch with
// the tail lowered and spread. The agent's own: every distance, time, speed and chance below; how often a flock
// moves between its places and in what order; how near it lets the walker come.

const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _across = new THREE.Vector3(), _near = [];
// a limb that climbs more steeply than this (the share of its way that is upward) is no perch for a pigeon: it stands
// upright across what it is on, and a stem that goes up beside it goes up through it (the agent's: 53 degrees)
const STEEP = 0.8;
// a stream of random numbers from one number (the order a flock's home is looked for in: one of the visit's own
// numbers, however many trees are tried)
const prng = (seed) => () => {
  seed = (seed + 0x6D2B79F5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// what it is doing, in words the card shows, by what it feeds in
const FEEDING = {
  apple: 'plucking the old apple\'s blossom', alder: 'eating the alder\'s buds and young leaves', maple: 'reaching for the maple\'s flowers and new leaves',
  vine: 'picking at the vine maple\'s buds', willow: 'picking at the willow\'s buds and young leaves', spruce: 'picking at the spruce\'s new growth',
  elder: 'clambering on the elderberry, at its flower heads', salmon: 'at the salmonberry\'s flowers',
};
const PERCHED = { snag: 'on a dead snag, high up', cedar: 'high on the old cedar\'s dead top', giant: 'high in the top of a Douglas-fir', mature: 'high in the top of a hemlock',
  spruce: 'high in the top of a spruce', slope: 'high in the top of a hemlock', alder: 'in the top of an alder' };

// A flock's shared state, kept on its home: where it is (`site`), what it is doing there (`plan`) and until when;
// how many places it has been to and will go to before it leaves; its last order to move (`move`: to another place,
// or away; `alarm` if the walker put it up), which each bird follows once, in a moment of its own; where it last
// came in from (`arrival`), and when its birds are to come in together (`gather`); when a male last flew his display.
// (`retry`: when to look again for a roost, or for a place by day, having found none)
const flockOf = (home) => home.flock || (home.flock = { site: null, plan: '', until: 0, retry: 0, plans: 0, quota: 0, move: null, arrival: null, gather: -1e9, displayed: -1e9 });

function canopy(a) {
  const { bird, world, way, r } = a, home = bird.home, haunt = home.haunt, flock = flockOf(home);
  const rest = bird.sheet.poses.perched, ground = bird.sheet.poses.ground || rest;
  const party = bird.who ? bird.who.party : null;
  const male = ((bird.who ? bird.who.seed : bird.seed) >>> 3) % 2 === 0;
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  // what this bird has done of the flock's orders, and what it is about across its activities
  const mine = { moved: -1, moveAt: null, retry: 0, tries: 0 };
  let pendingClaps = 0, at = { spot: null, site: null, side: 1 };

  // ---- the flock's birds that are here now (the visit's own record of the party)
  const present = () => (party ? party.members.filter((m) => m.bird && m.bird.left == null && m.bird !== bird).map((m) => m.bird) : []);
  const stay = (plan) => (plan === 'roost' ? 1e9 : between(way.stay[plan] || way.stay.lookout));
  // Is a spot taken: another animal on it or within `room` of it, landing on it, or stepping to it. (`bound`: where a
  // pigeon on the ground is walking to, which nothing else knew of: two came to drink at one spot, their middles 0 to
  // 7 mm apart.)
  const taken = (p, room = 0.36) => !world.free(p, bird, room) || world.crowd(p, bird) < room
    || world.others(p.x, p.z, 2.4, bird, _near).some((b) => b.bound && b.bound.distanceToSquared(p) < room * room);
  // (a spot it can stand on: the ground, a top, or a limb that is not too steep)
  const fit = (s) => !s.along || Math.abs(s.along.y) <= STEEP;
  // (whether `need` of a place's spots are free, looking no further than that; `more`: counted with them, the boughs
  // by the water where the rest of a flock waits)
  const room = (spots, need, more = null) => {
    let n = 0;
    for (const p of spots) if (fit(p) && !taken(p.point) && (n += 1) >= need) return true;
    if (more) for (const p of more) if (fit(p) && !taken(p.point) && (n += 1) >= need) return true;
    return false;
  };

  // ---- where it stands on a spot, and how it is turned: across a limb, a stub or a twig; any way on a snag's top;
  // facing the water on the ground. On a limb that climbs it stands upright all the same, as a bird does. (It was
  // set square to the limb, and on an alder's limbs, most of which climb at 40 degrees and more, it sat rolled over
  // on its side by as much.)
  const placeOn = (spot, side, pos, quat) => {
    pos.copy(spot.point);
    if (spot.along) {
      _across.crossVectors(spot.along, UP); if (_across.lengthSq() < 1e-6) _across.set(1, 0, 0);
      _across.normalize().multiplyScalar(side);
      frame(_across, UP, quat);
    } else if (spot.kind === 'ground') frame(spot.face, UP, quat);
    else { const th = (spot.point.x * 7.1 + spot.point.z * 3.3 + side) % 6.283; frame(_v.set(Math.cos(th), 0, Math.sin(th)), UP, quat); }
    return quat;
  };
  // A free spot of a place, clear of the walker; near `near` if it can be (a step or a flutter along the boughs). At
  // a lookout the highest spots go first (a tree's very top, a snag's dead top, then the limbs under them).
  const freeSpot = (site, near = null, reach = 2.6) => {
    if (!site) return null;
    const all = site.spots.filter((s) => s !== at.spot && fit(s) && !taken(s.point) && a.clear(s.point));
    const some = near ? all.filter((s) => s.point.distanceTo(near) < reach && s.point.distanceTo(near) > 0.25) : all;
    if (!some.length) return null;
    if (site.kind !== 'lookout' || near) return some[Math.floor(r() * some.length)];
    some.sort((p, q) => q.point.y - p.point.y);
    return some[Math.floor(r() * r() * some.length)];
  };
  // A place of a kind in the haunt for the flock to go to: not `not`, clear of the walker, with room for the whole
  // flock (at the water, at the edge and on the boughs by it, where the rest wait their turn, with room at the edge for
  // four); if no place has that, one with room for four of it. (a lookout with a dead top in it three times as likely
  // as one without) (Room for four was all that was asked, of flocks of up to fifteen: the rest had nowhere to go, and
  // stayed where the flock had been, at a roost into the day or on a lookout into the night.)
  const pickSite = (kind, not = null) => {
    const list = kind === 'lookout' ? haunt.lookouts : kind === 'feed' ? haunt.feeders : kind === 'water' ? haunt.waters : haunt.roosts;
    const all = present().length + 1, few = Math.min(4, all);
    const some = list.filter((s) => s !== not && _v.set(s.x, s.y, s.z).distanceTo(world.eye) > way.flush * pace(world) + 9 && room(s.spots, few));
    const whole = some.filter((s) => room(s.spots, all, s.wait ? s.wait.spots : null)), ok = whole.length ? whole : some;
    if (!ok.length) return null;
    const weight = (s) => (s.bare ? 3 : 1);
    let pick = r() * ok.reduce((sum, s) => sum + weight(s), 0);
    for (const s of ok) { pick -= weight(s); if (pick <= 0) return s; }
    return ok[ok.length - 1];
  };

  // ---- flights
  // To a spot of a place, landing on it.
  const flyTo = (spot, site, speed, doing, claps = 0) => {
    const side = r() < 0.5 ? 1 : -1, q = new THREE.Quaternion(), to = new THREE.Vector3();
    placeOn(spot, side, to, q);
    pendingClaps = claps;
    a.fly({ at: to, q, rise: spot.kind === 'ground' ? 0.25 : 0.35, floor: world.height, speed, out: spot.kind === 'ground' ? UP : undefined }, site.kind === 'water' ? 'drink' : 'perch', spot, site, side);
    if (doing) bird.doing = doing;
    return true;
  };
  // Somewhere far off and high over the trees, away from the walker: what a flock that goes makes for. Its first
  // thirty metres clear of trunks, if that can be had.
  const farPoint = (from = bird.at) => {
    const dx = from.x - world.eye.x, dz = from.z - world.eye.z, base = Math.atan2(dz, dx);
    let best = null;
    for (let tries = 0; tries < 8; tries += 1) {
      const th = base + (r() - 0.5) * (tries < 4 ? 1.2 : 3.2), far = 130 + r() * 50, x = from.x + Math.cos(th) * far, z = from.z + Math.sin(th) * far;
      const to = new THREE.Vector3(x, Math.max(from.y + 12, world.height(x, z) + 34 + r() * 14), z);
      if (!best) best = to;
      if (!world.blocked(from, _v.copy(from).lerp(to, 30 / far))) return to;
    }
    return best;
  };
  // Far off, beyond what it is coming to as the walker sees it, high over the trees, and out of their plain sight:
  // where a flock comes in from.
  const farFrom = (point) => {
    const dx = point.x - world.eye.x, dz = point.z - world.eye.z, base = Math.atan2(dz, dx);
    for (let tries = 0; tries < 10; tries += 1) {
      const th = base + (r() - 0.5) * (tries < 5 ? 1.6 : 4), far = 125 + r() * 45, x = point.x + Math.cos(th) * far, z = point.z + Math.sin(th) * far;
      const from = new THREE.Vector3(x, Math.max(point.y + 14, world.height(x, z) + 32 + r() * 12), z);
      if (!world.plain(from, bird.size)) return from;
    }
    return world.origin(point, bird.size, r);
  };
  // Off with the flock, to `dest` (each bird a little to one side of it), and gone once out of the walker's plain
  // sight: for `seconds`, or for good (Infinity).
  const onwards = (seconds) => {
    bird.aloft = true;
    if (!world.plain(bird.at, bird.size)) { bird.left = seconds; a.to('gone'); return; }
    straightOn(bird, world, seconds, way.dash, 3);
  };
  const leaveTo = (dest, seconds, claps = 0) => {
    if (a.cast) return false;
    const to = dest.clone().add(_v.set((r() - 0.5) * 10, (r() - 0.5) * 5, (r() - 0.5) * 10));
    pendingClaps = claps;
    a.to('fly');
    // (`floor`: never under the ground on its way up, from the creek's edge under the ravine's wall)
    takeOff(bird, { at: to, q: frame(_v.subVectors(to, bird.at).setY(0), UP, new THREE.Quaternion()), through: true, floor: world.height }, way.dash, () => onwards(seconds));
    bird.doing = 'flying off fast with the flock, high over the trees';
    return true;
  };

  // ---- the flock's orders: a move to another place, or away. Whoever of it first finds its time there is up (or
  // that night has come, or day) decides for all; each bird goes a moment after the one before.
  const decide = () => {
    const night = world.day < 0.08, morning = world.hour < 10.5, from = flock.plan;
    let plan = null, site = null, leave = null;
    // (by night to a roost, or it stays where it is and looks again in half a minute)
    if (night) {
      site = pickSite('roost', flock.site);
      if (!site) { flock.retry = world.clock + 30; flock.until = Math.max(flock.until, flock.retry); return; }
      plan = 'roost';
    }
    flock.plans += 1;
    if (night) plan = 'roost';                                     // (the roost found above)
    else if (from === 'roost') plan = 'lookout';
    else if (flock.plans > flock.quota) leave = { seconds: r() < way.gone ? Infinity : a.awhile() };
    else {
      const k = r(), drink = haunt.waters.length ? (morning ? 0.28 : 0.14) : 0;
      if (from === 'lookout') plan = k < (morning ? 0.55 : 0.42) ? 'feed' : k < (morning ? 0.55 : 0.42) + drink ? 'water' : 'lookout';
      else if (from === 'feed') plan = k < 0.55 ? 'lookout' : k < 0.8 ? 'feed' : drink ? 'water' : 'lookout';
      else plan = k < 0.75 ? 'lookout' : 'feed';
    }
    if (!leave && !night) {
      site = pickSite(plan, flock.site) || (plan !== 'lookout' && pickSite('lookout', flock.site));
      if (site) plan = site.kind;
      else leave = { seconds: a.awhile() };
    }
    flock.move = { at: world.clock, first: bird, site, plan, alarm: false, leave: leave && { seconds: leave.seconds, dest: farPoint() }, lag: plan === 'water' ? [0.6, 3.5] : [0.2, 2.4] };
    if (leave) { flock.site = null; flock.plan = ''; flock.until = Infinity; }
    else { flock.site = site; flock.plan = plan; flock.until = world.clock + stay(plan) * (plan === 'water' && site.spots.length <= present().length ? 1.8 : 1) + 4; }
  };
  // An order carried out: off with the flock, or to the place it goes to. Put up, it goes with a clatter of wings.
  // If there is no room for it where the flock goes, it is off out of sight instead: for a while, and it comes back
  // to the flock (it used to stay where the flock had been, apart from it, unless the walker had put it up).
  const go = (m) => {
    const loud = m.alarm ? claps() : r() < 0.3 ? 1 : 0;
    bird.thirst = !m.leave && m.plan === 'water';
    if (m.hawk) heard.add(m.hawk);
    if (m.leave) return leaveTo(m.leave.dest, m.leave.seconds, loud) && (!m.alarm || tally(m, true));
    if (m.site === at.site) return false;
    const spot = freeSpot(m.site);
    if (!spot && m.alarm) return leaveTo(farPoint(), r() < way.gone ? Infinity : a.awhile(), loud) && tally(m, true);
    if (!spot) {
      // (no room at the water's edge: it waits its turn in a tree by it)
      const wait = m.site.wait ? freeSpot(m.site.wait) : null;
      return wait ? flyTo(wait, m.site.wait, way.speed, 'waiting in a tree by the water for its turn to drink', loud) : leaveTo(farPoint(), a.awhile(), loud);
    }
    if (m.alarm) tally(m, false);
    return flyTo(spot, m.site, m.alarm ? way.dash : m.plan === 'roost' ? way.speed * 0.8 : way.speed,
      m.alarm ? 'clattering up with the flock, off to another tree' : m.plan === 'water' ? 'coming down with the flock to drink' : m.plan === 'feed' ? 'dropping down with the flock to feed' : 'flying up with the flock to a high perch', loud);
  };
  // Each step of a bird that is settled: follow the flock's last order once, after its own moment. One that was on
  // the wing when the flock moved (a flutter along the boughs, a display) lands where the flock no longer is, and
  // goes after it.
  const follow = () => {
    const night = world.day < 0.08;
    if (flock.site && (world.clock >= flock.until || (night !== (flock.plan === 'roost') && world.clock >= flock.retry))) decide();
    const m = flock.move;
    if (m && m.at > mine.moved) {
      if (mine.moveAt == null) mine.moveAt = m.at + (m.first === bird ? 0 : between(m.lag));
      if (world.clock < mine.moveAt) return false;
      mine.moved = m.at; mine.moveAt = null;
      return go(m);
    }
    if (at.site === flock.site || (at.site && at.site.water === flock.site)) return false;
    // (looked for a moment later, not in every step, if there is no room; and after four looks it is off for a
    // while, and comes back to the flock)
    if (world.clock < mine.retry) return false;
    mine.retry = world.clock + 1 + r() * 2;
    if (!flock.site) return leaveTo(farPoint(), a.awhile());
    for (const site of [flock.site, flock.site.wait]) {
      const spot = site ? freeSpot(site) : null;
      if (spot) { mine.tries = 0; return flyTo(spot, site, way.speed, 'after the flock'); }
    }
    if ((mine.tries += 1) < 4) return false;
    mine.tries = 0;
    return leaveTo(farPoint(), a.awhile());
  };

  // ---- the walker, and a hunting hawk: the flock is put up as one
  // (a follower's own count, as the skeleton keeps the first bird's: put up by the walker, or by a hawk's alarm)
  const tally = (m, off) => {
    if (m.first === bird) return true;
    if (m.hawk) { bird.alarmed = (bird.alarmed || 0) + 1; if (bird.who) bird.who.alarmed = (bird.who.alarmed || 0) + 1; return true; }
    bird.flushes = (bird.flushes || 0) + 1;
    if (bird.who) { bird.who.flushed = (bird.who.flushed || 0) + 1; if (off) bird.who.off = (bird.who.off || 0) + 1; }
    return true;
  };
  // (the claps of its wings as it goes up, put up by the walker)
  function claps() { return Math.round(between(way.clap.flush)); }
  // The hawk's alarm being answered while the skeleton's flush runs, and the alarms this bird has answered or has
  // followed the flock away from (the skeleton keeps its own list only for a family without a `react`).
  let hawk = null;
  const heard = new Set();
  // The order that puts the flock up, to a place near by (`site`) or off out of sight (`leave`: where to, and for how
  // long), carried out by this bird at once; every other bird of it goes within half a second (`follow`, from its
  // own step).
  const putUp = (site, leave) => {
    flock.move = { at: world.clock, first: bird, alarm: true, hawk, lag: [0.05, 0.5], site, plan: site ? site.kind : '', leave };
    if (site) { flock.site = site; flock.plan = site.kind; flock.until = world.clock + stay(flock.plan) + 6; }
    else { flock.site = null; flock.plan = ''; flock.until = Infinity; }
    mine.moved = flock.move.at; mine.moveAt = null;
    return go(flock.move);
  };
  // Somewhere near for the flock, as the skeleton's flush asks for it: a lookout, or else a tree it feeds in, in the
  // haunt, well clear of the walker and not past them. False if there is none.
  const refuge = () => {
    const far = (s) => _v.set(s.x, s.y, s.z).distanceTo(world.eye);
    const ok = (s) => s !== flock.site && s !== at.site && far(s) > way.flush * pace(world) + 13 && room(s.spots, 1)
      && (s.x - bird.at.x) * (bird.at.x - world.eye.x) + (s.z - bird.at.z) * (bird.at.z - world.eye.z) > -40;
    const some = haunt.lookouts.filter(ok);
    const list = some.length ? some : haunt.feeders.filter(ok);
    return list.length ? putUp(list[Math.floor(r() * list.length)], null) : false;
  };
  // The owner's rule, for the whole flock, by the skeleton's own test and its own choice (life/behave.js): the first
  // of it to find the walker too near, or moving suddenly near by, or to take a hunting hawk's alarm, puts it up
  // (`a.flush()`: to the family's refuge or off out of sight, each an order to the flock). While a bird has an alarm
  // still to follow it is not put up again; once it has followed one, the next is a new alarm.
  const react = (a) => {
    const w = a.act && a.act.wary;
    if (w === false || (typeof w === 'function' && !w(a))) return false;
    const m = flock.move;
    if (m && m.alarm && m.at > mine.moved) return false;
    if (a.startled()) return a.flush();
    const one = a.alarmed();
    if (!one || heard.has(one)) return false;
    hawk = one;
    const done = a.answerAlarm();     // (a flush counted as the alarm's, and the alarm answered: life/behave.js)
    hawk = null;
    return done;
  };

  // ---- the display: a male flies up from the lookout, glides a wide circle on stiff wings, and comes back
  const display = () => {
    const R = 13 + r() * 9, dir = r() < 0.5 ? 1 : -1, th0 = r() * 6.283, h0 = bird.at.y + 5 + r() * 4;
    const cx = bird.at.x - Math.cos(th0) * R, cz = bird.at.z - Math.sin(th0) * R;
    // (the whole circle clear: above the ground by eight metres and more, no trunk across it, and among no tree's
    // limbs, life/places/aerial2.js `inCrown`; it was tried for the ground and for trunks alone, and a taller tree's
    // crown could stand in it)
    let prev = null;
    for (let k = 0; k <= 16; k += 1) {
      const th = th0 + dir * (k / 16) * 6.283, p = new THREE.Vector3(cx + Math.cos(th) * R, h0 - k * 0.175, cz + Math.sin(th) * R);
      if (p.y - world.height(p.x, p.z) < 8 || (prev && world.blocked(prev, p)) || inCrown(world, p, 1)) return false;
      prev = p;
    }
    // (and the way up to it, which is straight over the perch: not through the boughs over its head)
    const start = new THREE.Vector3(cx + Math.cos(th0) * R, h0, cz + Math.sin(th0) * R);
    for (const k of [0.5, 0.75]) if (inCrown(world, _w.copy(bird.at).lerp(start, k), 0.3)) return false;
    if (!a.clear(start, 4)) return false;
    pendingClaps = 2;
    flock.displayed = world.clock;
    a.fly({ at: start, q: frame(_v.set(-Math.sin(th0) * dir, 0, Math.cos(th0) * dir), UP, new THREE.Quaternion()), rise: 0, through: true, speed: way.speed * 0.8 }, 'glide', new THREE.Vector3(cx, h0, cz), R, th0, dir);
    bird.doing = 'clapping its wings as it climbs from the perch: a male\'s display';
    return true;
  };

  // ---- activities
  const sit = (head, extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, roll: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
    head, tail: { ...rest.tail }, feet: at.spot && at.spot.kind === 'top' ? { mode: 'flat' } : { mode: 'grip', round: Math.max(0.008, at.spot ? at.spot.radius : 0.02) } }, extra);

  const perch = {
    // (asleep at the roost by night, it is not put up; one still at the roost by day is, as anywhere)
    wary: () => !(at.site && at.site.kind === 'roost' && world.day < 0.08),
    enter(a, spot, site, side = at.side) {
      at.spot = spot; at.site = site; at.side = side;
      // (landing from a flight it already stands where it landed; put there by `begin`, it is set there)
      if (bird.at.distanceToSquared(spot.point) > 0.0025) placeOn(spot, side, bird.at, bird.q);
      Object.assign(a.now, { look: 0, head: { yaw: 0, pitch: rest.head ? rest.head.pitch : 0.05, roll: 0 }, preen: 0, coo: male ? between(way.coo.every) * (0.3 + r()) : Infinity, notes: 0, note: 0,
        reach: 0, clamber: 2 + r() * 5, wait: 0.4 + r() * 1.2, turn: 0.5 + r(), displayIn: male ? 8 + r() * 40 : Infinity });
      // (what it is doing from the moment it lands: the flight's words are no longer true)
      bird.doing = site.kind === 'roost' ? 'roosting with the flock in a thick conifer' : site.kind === 'feed' ? (FEEDING[site.name] || 'feeding in the tree')
        : site.kind === 'wait' ? (bird.thirst ? 'waiting in a tree by the water for its turn to drink' : 'in a tree by the water, waiting for the flock') : `perched ${PERCHED[site.name] || 'high up'} with the flock, watching`;
    },
    step(a, dt) {
      const now = a.now, kind = at.site.kind;
      if (follow()) return;
      now.look -= dt; now.wait -= dt; now.clamber -= dt; now.coo -= dt; now.displayIn -= dt;
      if (now.look < 0) { now.look = 0.6 + r() * 2; now.head = { yaw: (r() - 0.5) * 2.4, pitch: rest.head ? rest.head.pitch + (r() - 0.5) * 0.4 : 0, roll: (r() - 0.5) * 0.2 }; }
      if (kind === 'roost') {
        // (asleep by night; by day, until the flock moves, it sits awake)
        if (world.day < 0.08) { sit({ yaw: 0, pitch: -0.2, roll: 0 }, { pitch: rest.pitch + 0.08, lift: rest.lift - 0.06 }); bird.doing = 'roosting with the flock in a thick conifer'; }
        else { sit(now.head); bird.doing = 'in a thick conifer with the flock, where it roosted'; }
        return;
      }
      // a male's coo: a slow series of notes, the tail lowered and spread
      if (now.notes > 0) {
        now.note -= dt;
        const singing = now.note > 1.0;                                     // (each note about 0.8 s, one every 1.8 s)
        sit({ yaw: now.head.yaw * 0.3, pitch: singing ? -0.12 : 0, roll: 0 }, { lift: rest.lift + (singing ? 0.05 : 0.02), tail: { pitch: (rest.tail.pitch ?? 0) - 0.3, fan: 0.35 } });
        bird.doing = way.coo.doing;
        if (now.note <= 0) { now.notes -= 1; if (now.notes > 0) { now.note = 1.8; world.say(bird, 'coo', way.coo.reach, 0.8); } else now.coo = between(way.coo.every); }
        return;
      }
      if (now.preen > 0) {
        now.preen -= dt;
        sit({ yaw: 2.1 * (now.preen % 1.2 > 0.6 ? 1 : -1), pitch: -0.55, roll: 0.3 }, { droop: 0.12 });
        bird.doing = 'preening';
        return;
      }
      if (kind === 'wait') {
        // in a tree by the water: down to the edge for its turn when there is room, and meanwhile it sits and looks about
        now.turn -= dt;
        if (bird.thirst && now.turn < 0) {
          now.turn = 1 + r() * 2;
          const spot = freeSpot(at.site.water);
          if (spot) { flyTo(spot, at.site.water, 4, 'down to the water\'s edge for its turn to drink'); return; }
        }
        if (now.wait < 0) { now.wait = 1 + r() * 3; if (r() < 0.12) { now.preen = 1.5 + r() * 3; return; } }
        sit(now.head);
        bird.doing = bird.thirst ? 'waiting in a tree by the water for its turn to drink' : 'in a tree by the water, waiting for the flock';
        return;
      }
      if (kind === 'feed') {
        // reaching out for a bud or a flower, and pulling it off; now and then right out over the bough
        if (now.reach > 0) {
          now.reach -= dt;
          const far = now.far;
          sit({ yaw: now.head.yaw * 0.5, pitch: -0.65 - 0.3 * Math.sin(now.reach * 9), roll: 0 }, { pitch: rest.pitch - (far ? 0.55 : 0.25), lean: far ? 0.03 : 0.012, gape: (now.reach * 3) % 1 > 0.8 ? 0.4 : 0 });
          bird.doing = far ? 'leaning far out to reach a flower' : (FEEDING[at.site.name] || 'feeding in the tree');
          return;
        }
        if (now.clamber < 0) {
          now.clamber = 3 + r() * 6;
          const spot = freeSpot(at.site, bird.at, 2.6);
          if (spot) { flyTo(spot, at.site, 2.5, 'clambering about the boughs, a flutter at a time'); return; }
        }
        if (now.wait < 0) { now.wait = 0.4 + r() * 1.6; if (r() < 0.75) { now.reach = 0.8 + r() * 1.6; now.far = r() < 0.12; return; } }
        sit(now.head);
        bird.doing = FEEDING[at.site.name] || 'feeding in the tree';
        return;
      }
      // at a lookout: it sits upright and looks about; preens; a male coos, and now and then flies his display, both
      // by day alone (by the light as it is now: `world.hour` is the hour the visit began at, and a flock with no
      // roost found is on its lookout all night)
      if (male && now.coo < 0 && world.day > 0.3) { now.notes = way.coo.notes[0] + Math.floor(r() * (way.coo.notes[1] - way.coo.notes[0] + 1)); now.note = 1.8; world.say(bird, 'coo', way.coo.reach, 0.8); return; }
      if (male && now.displayIn < 0 && world.day > 0.3) {
        now.displayIn = 30 + r() * 60;
        if (world.clock - flock.displayed > 45 && r() < way.display && display()) return;
      }
      if (now.wait < 0) { now.wait = 1 + r() * 3; if (r() < 0.12) { now.preen = 1.5 + r() * 3; return; } }
      sit(now.head, { pitch: rest.pitch - 0.04 });
      bird.doing = `perched ${PERCHED[at.site.name] || 'high up'} with the flock, watching`;
    },
  };

  // on the ground at the water's edge: it drinks with its bill in the water, and does not lift its head to swallow
  const drink = {
    wary: true,
    enter(a, spot, site) {
      at.spot = spot; at.site = site;
      if (bird.at.distanceToSquared(spot.point) > 0.0025) placeOn(spot, 1, bird.at, bird.q);
      else frame(spot.face, UP, bird.q);
      Object.assign(a.now, { drink: 0, look: 0.6 + r(), walk: null, bouts: 0, enough: 2 + Math.floor(r() * 3), head: { yaw: 0, pitch: 0, roll: 0 } });
      bird.doing = 'at the water\'s edge with the flock, looking about';
    },
    exit() { bird.bound = null; },
    step(a, dt) {
      const now = a.now;
      if (follow()) return;
      const stand = (head, extra = {}) => Object.assign(bird.want, { pitch: ground.pitch, lift: ground.lift, lean: 0, roll: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
        head, tail: { ...(ground.tail || rest.tail) }, feet: { mode: 'flat' } }, extra);
      if (now.walk) {
        // a few steps along the edge, the head nodding with each
        const w = now.walk;
        w.t = Math.min(1, w.t + dt / w.time);
        // (another animal in its way: it stops where it is)
        _w.lerpVectors(w.from, w.to, w.t);
        if (world.crowd(_w, bird) < 0.2) { now.walk = null; bird.bound = null; at.spot = { ...w.spot, point: bird.at.clone() }; now.look = 0.4 + r(); return; }
        bird.at.copy(_w); bird.at.y = world.height(bird.at.x, bird.at.z);
        const step = (w.t * w.time * 3.2) % 1;
        stand({ yaw: 0, pitch: -0.1 + 0.25 * Math.sin(step * 6.283), roll: 0 }, { roll: 0.05 * Math.sin(step * 3.1416 * 2), lean: 0.01 * Math.sin(step * 6.283) });
        bird.doing = 'walking along the water\'s edge, its head nodding';
        if (w.t >= 1) { at.spot = w.spot; bird.bound = null; frame(w.spot.face, UP, bird.q); now.walk = null; now.look = 0.5 + r(); }
        return;
      }
      if (now.drink > 0) {
        now.drink -= dt;
        stand({ yaw: 0, pitch: -1.25, roll: 0 }, { pitch: ground.pitch - 0.45, lift: ground.lift - 0.12, lean: 0.015 });
        bird.doing = 'drinking: a pigeon sucks the water up with its bill in it, and does not lift its head to swallow';
        if (now.drink <= 0) { now.look = 0.8 + r() * 1.8; now.bouts += 1; if (now.bouts >= now.enough) bird.thirst = false; }
        return;
      }
      now.look -= dt;
      stand({ yaw: Math.sin(world.clock * 1.3 + bird.seed) * 0.9, pitch: 0.1, roll: 0 });
      bird.doing = 'at the water\'s edge with the flock, looking about';
      if (now.look > 0) return;
      // its turn over: if a bird of the flock is waiting in a tree for a place at the edge, it gives up its own
      if (!bird.thirst && at.site.wait && present().some((b) => b.thirst && b.state === 'perch')) {
        const wait = freeSpot(at.site.wait);
        if (wait) { flyTo(wait, at.site.wait, 4, 'up into a tree by the water, its turn over'); return; }
      }
      if (r() < 0.3) {
        const spot = freeSpot(at.site, bird.at, 1.6);
        if (spot) {
          _v.subVectors(spot.point, bird.at).setY(0); frame(_v, UP, bird.q);
          now.walk = { from: bird.at.clone(), to: spot.point.clone(), spot, t: 0, time: Math.max(0.5, bird.at.distanceTo(spot.point) / 0.35) };
          bird.bound = now.walk.to;
          return;
        }
      }
      now.drink = 2.5 + r() * 4;
    },
  };

  // Its own flight: the built-in one (life/agents.js `flying`), with the clap of its wings as it goes up: a few
  // claps at the wingbeat when it is put up, one now and then when it simply moves.
  const fly = {
    wary: false,
    enter(a) { a.now.claps = pendingClaps; a.now.t = 0; a.now.next = 0.05; pendingClaps = 0; },
    step(a, dt) {
      const now = a.now;
      now.t += dt;
      while (now.claps > 0 && now.t >= now.next) { world.say(bird, 'clap', way.clap.reach); now.claps -= 1; now.next += 1 / way.clap.rate; }
      flying(bird, dt, now.claps > 0 ? way.hz * 1.4 : way.hz);
    },
  };

  // the display's glide: round a wide circle on stiff wings, a little down all the way, the wings fluttering towards its end
  const glide = {
    wary: false,
    enter(a, centre, R, th, dir) { Object.assign(a.now, { centre, R, th, dir, gone: 0, y: centre.y, sink: 2.8 / (5.6 * R / 9.5) }); bird.aloft = true; },
    step(a, dt) {
      const now = a.now, speed = 9.5, turn = (speed / now.R) * dt;
      // (another animal in the air where this step or the next takes it, or a third of a second on: the glide is
      // broken off, and it flies back to the flock. Nothing looked, and the count of walks takes a glide for standing.)
      for (const ahead of [turn, 2 * turn, (speed * 0.35) / now.R]) {
        const th = now.th + now.dir * ahead;
        if (world.crowd(_w.set(now.centre.x + Math.cos(th) * now.R, now.y - (now.sink * ahead * now.R) / speed, now.centre.z + Math.sin(th) * now.R), bird) < 1) { rejoin(); return; }
      }
      now.th += now.dir * turn; now.gone += turn; now.y -= now.sink * dt;
      bird.at.set(now.centre.x + Math.cos(now.th) * now.R, now.y, now.centre.z + Math.sin(now.th) * now.R);
      frame(_v.set(-Math.sin(now.th) * now.dir, 0, Math.cos(now.th) * now.dir), UP, bird.q);
      const late = now.gone > 4.6;
      bird.beat += dt * (late ? 15 : 0) * Math.PI * 2;
      Object.assign(bird.want, { pitch: 0.04, lift: 0.6, lean: 0, roll: -0.22 * now.dir, spread: 1, flap: late ? 0.18 + 0.14 * Math.sin(bird.beat) : 0.12, hand: late ? 0.1 * Math.sin(bird.beat - 1) : 0.02, sweep: 0.08, droop: 0, gape: 0,
        head: { yaw: 0, pitch: 0, roll: 0 }, tail: { pitch: 0, fan: 0.6, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true;
      bird.doing = late ? 'fluttering its wings at the end of its glide: a male\'s display' : 'gliding a wide circle on stiff wings: a male\'s display flight';
      if (now.gone >= 5.6) rejoin();
    },
  };
  // back to the flock from a glide (where it is, or a tree by its water, or where the male was), or after it if it has gone
  function rejoin() {
    if (flock.site) for (const site of [flock.site, flock.site.wait, at.site]) {
      const spot = site ? freeSpot(site) : null;
      if (spot) return flyTo(spot, site, way.speed, 'back to the flock');
    }
    return leaveTo(farPoint(), a.awhile());
  }

  return {
    activities: { perch, drink, fly, glide },
    react,
    // (the skeleton's flush asks for these two: each is an order to the whole flock)
    refuge,
    leave: (seconds) => putUp(null, { dest: farPoint(), seconds }),
    // In from out of the walker's plain sight, high over the trees: the flock's birds from about the same place, the
    // first of them finding it.
    come(to, landing, ...args) {
      let from = null;
      if (flock.arrival && world.clock - flock.arrival.at < 30) {
        from = flock.arrival.from.clone().add(_w.set((r() - 0.5) * 8, (r() - 0.5) * 4, (r() - 0.5) * 8));
        if (world.plain(from, bird.size)) from = null;
      }
      if (!from) {
        from = farFrom(to.at);
        if (!from) return false;
        flock.arrival = { at: world.clock, from: from.clone() };
      }
      a.to('fly');
      bird.at.copy(from); frame(_v.subVectors(to.at, from).setY(0), UP, bird.q);
      bird.aloft = true;
      takeOff(bird, to, way.speed * 1.3, () => a.to(landing, ...args));
      bird.doing = 'flying in with the flock, fast and high';
      return true;
    },
    // Where it is when it comes. The first of the flock to come waits for the rest that are due within the minute,
    // so that they come in together; the first in finds the flock a place (a high lookout, coming in; any place, at
    // the visit's beginning; a roost by night), and each takes a free spot there.
    begin() {
      if (!a.life.first && party && !present().length) {
        // (when, once for each coming: the last of the rest that are due within a minute and a half)
        if (!(flock.gather > world.clock - 20)) {
          let due = world.clock;
          for (const m of party.members) if (m !== bird.who && !m.bird && !m.gone && m.until > world.clock && m.until < world.clock + 90) due = Math.max(due, m.until);
          flock.gather = due;
        }
        if (flock.gather > world.clock + 0.3) { bird.left = flock.gather - world.clock + r() * 0.6; return; }
      }
      const night = world.day < 0.08;
      if (!flock.site || !present().length) {
        const plan = night ? 'roost' : a.life.first ? ['lookout', 'lookout', 'feed', 'feed', 'water'][Math.floor(r() * 5)] : 'lookout';
        const site = pickSite(plan) || pickSite('lookout') || (night ? null : pickSite('feed'));
        if (!site) { bird.left = night ? Infinity : 8 + r() * 12; return; }
        Object.assign(flock, { site, plan: site.kind, until: world.clock + stay(site.kind), plans: 0, quota: Math.round(between(way.plans)), move: null });
        if (!a.life.first) flock.arrival = null;
      }
      mine.moved = flock.move ? flock.move.at : -1;
      // (a spot of the flock's place of its own; at the water, if there is no room at the edge, a bough by it to wait on)
      bird.thirst = flock.plan === 'water';
      let site = flock.site, spot = freeSpot(site);
      if (!spot && site.wait) { site = site.wait; spot = freeSpot(site); }
      if (!spot) { bird.left = night ? Infinity : 6 + r() * 10; return; }
      const side = r() < 0.5 ? 1 : -1, landing = site.kind === 'water' ? 'drink' : 'perch';
      a.to(landing, spot, site, side);
      if (a.life.first || night) return;
      if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.4, floor: world.height }, landing, spot, site, side)) bird.left = 5 + r() * 10;
    },
  };
}

// A haunt for a flock, found once for each tall tree it can be centred on (the same habitat is asked again on
// every visit)
const haunts = new WeakMap();
const hauntOf = (habitat, t, range) => {
  let made = haunts.get(habitat);
  if (!made) { made = { sites: hauntSites(habitat, range), at: new Map() }; haunts.set(habitat, made); }
  if (!t) return made;
  if (!made.at.has(t)) made.at.set(t, hauntAt(habitat, t.foot.x, t.foot.z, range));
  return made.at.get(t);
};

export default {
  // what a flock's way holds besides what every way has (life/families/index.js)
  fields: {
    range: 'number', apart: 'number',              // the radius of its haunt (m); no nearer than this to another flock's haunt (m)
    hz: 'number', speed: 'number', dash: 'number', // wingbeats a second; how fast it flies from place to place, and when it is put up or goes (m/s)
    ...WARY,                                       // how near it lets the walker come (life/behave.js), wherever it is
    stay: { lookout: nums(2), feed: nums(2), water: nums(2) },     // seconds a flock stays at a place of each kind
    plans: nums(2),                                // how many places it goes to before it leaves
    coo: { every: nums(2), notes: nums(2), reach: 'number', doing: 'string' },
    clap: { reach: 'number', rate: 'number', flush: nums(2) },     // how far its wings' clap carries, claps a second, and how many when put up
    display: 'number',                             // the chance, now and then at a lookout, that a male flies his display
  },
  act: (way) => (bird, world) => live(bird, world, way, canopy),
  // A haunt round a tall tree or a snag that stands where the air is open, or near it, with trees it feeds in within
  // its reach: no nearer another flock's than `apart`, or, if there is none so far off, two thirds and then a third of
  // that. (Tried at random 24 times, one flock of two on the busiest visit found no home.) The tall trees are tried in
  // an order drawn from one of the visit's numbers, and at most 40 haunts are worked out at each distance.
  home: (way) => (habitat, r, taken = []) => {
    const { sites } = hauntOf(habitat, null, way.range), rr = prng(Math.floor(r() * 4294967296));
    const order = sites.map((t) => [rr(), t]).sort((p, q) => p[0] - q[0]);
    for (const apart of [way.apart, way.apart * 0.6, way.apart * 0.3]) {
      let tries = 0;
      for (const [, t] of order) {
        if (taken.some((h) => h && Math.hypot(h.x - t.foot.x, h.z - t.foot.z) < apart)) continue;
        const haunt = hauntOf(habitat, t, way.range);
        if (haunt) return { x: t.foot.x, z: t.foot.z, haunt, flock: null };
        if ((tries += 1) >= 40) break;
      }
    }
    return null;
  },
};
