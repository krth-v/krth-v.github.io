import * as THREE from 'three';
import { onTrunk } from '../perch.js';
import { frame, spot, creeper as named } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';

// A bird that hitches up a trunk in a spiral, braced on its tail, and drops to the foot of another: the Brown Creeper
// (life/species/brownCreeper.js, whose file says where it lives and gives its numbers). The climb is the one approved
// at checkpoint 2 ("The varied thrush and the brown creeper are good"): it starts near the foot of a trunk and hitches
// up it in a spiral, probing the furrows of the bark; from the top of its climb it flies down to the foot of another
// trunk near by (or of the same one, when there is none); by night it roosts against the bark. One of a visit's own
// calls and now and then sings as it works, works a few trunks and is gone, for a while or for good. One of the cast
// of checkpoint 2 (life/index.js, which asks life/agents.js for it by name: it is handed over at the foot of this
// file) works the composed scene's trunks, silent, for as long as the page is open.
//
// It lives on life/behave.js: it goes on climbing whatever the walker does, until they are too near or move suddenly.
// Then it slips round its trunk in quick sidelong hitches to the side they cannot see, if it is out of their reach
// there, and goes on up from there; or it flies to the foot of another trunk, further from them; or it is off. The
// slip is its refuge, as a flight is, and it is not put up again in the middle of one; after it, it climbs on as
// before, and is put up again from there like any bird, behind its trunk or not (it was not, while its trunk hid it:
// a walker could walk up to the trunk and round it, and that was keeping the trunk between, which the owner's rule
// for birds leaves out). It no longer presses itself to the bark and keeps still for a walker who watches it, and
// no longer slips round before they are too near.
//
// From what was read (the species' sheet, and the Animal Diversity Web's account, read 2026-11-16): it moves upward on
// a trunk, sometimes spiralling round it, braced on its stiff tail, to within a few metres of the top, then flies to
// the bottom of that trunk or of another and starts over; it usually flies short distances between trunks; males sing
// a high, thin song in the breeding season. That account has adults respond to a threat by freezing, flattened against
// the trunk: the owner's rule for birds (2026-11-16) leaves that out for the walker. The agent's own: every distance,
// time and chance below; how fast it climbs; that it climbs only 7 to 15 m (where a walker can see it: the source has
// it to near the top); that it slips round its trunk out of the walker's sight; how near it lets them come.
const _t = new THREE.Vector3(), _v = new THREE.Vector3(), _w = new THREE.Vector3(), _near = [];
// how near another animal a hitch may end (m): the agent's number
const ROOM = 0.2;

function creeper(a) {
  const { bird, world, way, r, cast } = a, rest = bird.sheet.poses.perched;
  const p = spot(), p2 = spot(), q = new THREE.Quaternion();
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  // Where it is, kept across its activities: the trunk it is on (for the cast, one of the composed scene's, by its
  // number), how high on it (m above its foot), how far round it (a share of a turn), which way and how steeply it
  // spirals (turns to a metre climbed), how high it goes on this trunk, how many trunks it has worked, when it next
  // calls; and how far it leans from straight up the bark (`tilt`), eased, since the way it spirals can turn about.
  let tree = cast ? world.trunks[bird.home % world.trunks.length] : bird.home;
  let height = between(way.start), turn = bird.turn ?? r(), twist = (r() < 0.5 ? -1 : 1) * between(way.twist);
  const ceiling = (t) => Math.min(between(way.top), t.heights[t.heights.length - 1] - 0.6);
  let top = ceiling(tree), trees = 0, calls = cast ? Infinity : 4 + r() * 10, tilt = Math.sign(twist) * 0.22;
  const quota = cast ? Infinity : way.quota[0] + Math.floor(r() * (way.quota[1] - way.quota[0] + 1));

  // Head up the bark, leaning the way it spirals (more, slipping sideways round the trunk). A turn the right way
  // round the trunk is a move along normal x up. (The old code leaned it the other way, against its own comment: a
  // creeper of the cast, watched for nine seconds, faced against the way it moved across the bark 35 times and with it
  // twice.)
  const heading = (out) => out.copy(p.up).addScaledVector(_t.crossVectors(p.normal, p.up), tilt);
  // (true while it is still turning: the bird is then set on the bark again)
  const lean = (dt, slipping) => { const was = tilt; tilt += (Math.sign(twist) * (slipping ? 0.9 : 0.22) - tilt) * Math.min(1, dt * 8); return Math.abs(tilt - was) > 1e-5; };
  const settle = () => { onTrunk(tree, height, turn, p); bird.at.copy(p.point); frame(heading(_v), p.normal, bird.q); };
  // how it holds itself on bark is the pose its sheet is drawn in
  const cling = (extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: rest.lean, spread: 0, flap: 0, hand: 0, sweep: 0, droop: rest.droop ?? 0, gape: 0,
    head: { yaw: 0, pitch: rest.head.pitch, roll: 0 }, tail: { ...rest.tail }, feet: rest.feet }, extra);
  // One hitch, both feet together, as `now.hitch` says (from height a to b, and from c to d of the way round). True
  // while one is being made.
  const hitching = (now, dt) => {
    const h = now.hitch;
    if (!h) return false;
    h.t = Math.min(1, h.t + dt / way.beat);
    height = h.a + (h.b - h.a) * h.t; turn = h.c + (h.d - h.c) * h.t;
    settle();
    bird.at.addScaledVector(p.normal, 0.004 * Math.sin(Math.PI * h.t));            // both feet leave the bark together
    cling({ lift: rest.lift + 0.12 * Math.sin(Math.PI * h.t) });
    if (h.t >= 1) now.hitch = null;
    return true;
  };

  // the side of its trunk that faces the walker, as a share of the way round; and where it is round its trunk from
  // that side: 0 facing them, half a turn (either sign) behind it
  const facing = () => Math.atan2(world.eye.z - tree.foot.z, world.eye.x - tree.foot.x) / (Math.PI * 2) - tree.turnOffset;
  const round = () => ((((turn - facing()) % 1) + 1.5) % 1) - 0.5;
  // is a trunk (its own, or another) between it and the walker?
  const hidden = () => world.blocked(world.eye, bird.at);
  // Would a slip round its trunk, the way `side` says, hide it from the walker? Tried at the far side, a little up from
  // where it is: a thin trunk, or a walker right under it, does not hide it there.
  const behind = (side) => { onTrunk(tree, height + 0.04, facing() + side * 0.42, p2); return world.blocked(world.eye, p2.point); };

  // Would a hitch to `h` above the trunk's foot and `tu` of the way round it end on another animal: nearer one than
  // ROOM, and nearer than it is to one now? (One of a visit's: the cast's world has no other animals to ask after.)
  const taken = (h, tu) => { if (!world.crowd) return false; onTrunk(tree, h, tu, p2); return world.crowd(p2.point, bird) < Math.min(ROOM, world.crowd(bird.at, bird)); };
  // Is a trunk in the way of a flight from where it clings to `point`? Its own is, if `point` lies behind the bark it
  // is on (the world's test passes over a trunk right at the start of the line); another, by the world's test.
  const barred = (point) => {
    _t.set(0, 1, 0).applyQuaternion(bird.q).setY(0); _w.subVectors(point, bird.at).setY(0);
    return _t.dot(_w) < 0.1 * _t.length() * _w.length() || world.blocked(bird.at, point);
  };
  // (the trunks a flight can reach with no trunk in the way, before the rest, each as they were ordered)
  const clearFirst = (list) => { const open = [], rest = []; for (const t of list) (barred(t.foot) ? rest : open).push(t); return open.concat(rest); };
  // the trunks it could go to next: near this one, with no other animal on them (one of a visit's), nearest first
  // (the cast's world has only the list of the composed scene's trunks)
  const others = () => {
    const all = world.trunksNear ? world.trunksNear(tree.foot.x, tree.foot.z, way.range, _near) : world.trunks;
    return all.filter((t) => t !== tree && t.foot.distanceTo(tree.foot) < way.range && (cast || !world.beside(t.foot.x, t.foot.z, t.girth + 1.5, bird)))
      .sort((m, n) => m.foot.distanceTo(tree.foot) - n.foot.distanceTo(tree.foot));
  };
  // Down to `to` (another trunk, or its own), near its foot: onto the side it flies in from, or on down the side it is
  // on. False, and nothing changed, if that is not clear of the walker (life/behave.js).
  const drop = (to, doing) => {
    const h = between(way.start), tu = to === tree ? turn + (r() - 0.5) * 0.1
      : Math.atan2(tree.foot.z - to.foot.z, tree.foot.x - to.foot.x) / (Math.PI * 2) - to.turnOffset + (r() - 0.5) * 0.2;
    onTrunk(to, h, tu, p2);
    if (!a.clear(p2.point)) return false;
    tree = to; height = h; turn = tu; top = ceiling(to); trees += 1;
    twist = (r() < 0.5 ? -1 : 1) * between(way.twist); tilt = Math.sign(twist) * 0.22;
    // (it lands as it will cling: a landing that faced straight up the bark turned a fifth of a radian the moment it settled)
    onTrunk(tree, height, turn, p);
    a.fly({ at: p.point.clone(), q: frame(heading(_v), p.normal, q).clone(), out: p.normal.clone(), rise: -0.2, speed: way.drop }, 'climb', 0.5);
    bird.doing = doing;
    return true;
  };
  // The top of its climb: off, once it has worked its trunks (one of a visit's); or to the foot of another trunk near
  // by; or, with none, off (one of a visit's) or down to the foot of its own, to work up it again. False if none of it
  // could be done just now.
  const next = () => {
    if (trees >= quota && a.leave(r() < 0.35 ? Infinity : a.awhile())) return true;
    // (one it can fly to with no trunk in the way, its own or another, before any other)
    const near = others(), open = near.filter((t) => !barred(t.foot)), some = (open.length ? open : near).slice(0, 4);
    while (some.length) { const to = some.splice(Math.floor(r() * some.length), 1)[0]; if (drop(to, 'dropping to the foot of another trunk')) return true; }
    if (!cast && a.leave(a.awhile())) return true;
    return drop(tree, 'dropping to the foot of its trunk');
  };

  // Round its trunk out of the walker's sight, the way `now.slip` says (+1 or -1, of a turn): quick sidelong hitches, a
  // little upward, leaning into them, until the trunk has been between it and the walker for two of them and it is
  // out of their reach there, or it is well round the far side, or it has gone sixty, or another animal is in its
  // way; then it is climbing again, on up from there, spiralling on the same way.
  const slipping = (now, dt) => {
    if (hitching(now, dt)) { if (!now.hitch) now.wait = 0.04 + r() * 0.06; return; }
    now.wait -= dt;
    if (now.wait > 0) return;
    now.hid = hidden() ? now.hid + 1 : 0;
    const b = height + 0.008 + r() * 0.01, d = turn + now.slip * 0.07 / (Math.PI * 2 * Math.max(0.12, tree.girth));
    if ((now.hid >= 2 && a.clear(bird.at, 0)) || Math.abs(round()) >= 0.45 || now.steps >= 60 || taken(b, d)) { now.slip = 0; now.hitches = 0; now.wait = 0.3 + r() * 0.6; now.probe = 0; return; }
    now.steps += 1;
    now.hitch = { a: height, b, c: turn, d, t: 0 };
  };

  const climb = {
    // (it is not put up while it slips round its trunk: the slip is where a flush has sent it, as a flight is)
    wary: () => !a.now.slip,
    // `side`: it comes to this climb slipping round its trunk, that way (+1 or -1, of a turn), put up by the walker
    enter(a, wait = 0.5, side = 0) {
      Object.assign(a.now, { wait, hitches: 0, probe: 0, hitch: null, calling: 0, singing: false, slip: side, steps: 0, hid: 0 });
      if (side) twist = side * Math.abs(twist);
      bird.doing = side ? 'slipping round to the far side of the trunk' : 'clinging, braced on its tail';
      settle(); cling();
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost'); return; }
      if (lean(dt, !!now.slip) && !now.hitch) settle();
      if (now.slip) { slipping(now, dt); return; }
      now.wait -= dt; calls -= dt;
      // its call, thin and high, as it works, and now and then in May its song: it carries a little way (one of a
      // visit's own: the cast is silent, as it was)
      if (calls < 0) {
        now.singing = r() < way.song.chance; calls = between(way.call.every); now.calling = now.singing ? way.song.time : way.call.time;
        world.say(bird, now.singing ? 'song' : 'call', now.singing ? way.song.reach : way.call.reach);
      }
      if (hitching(now, dt)) {
        if (!now.hitch) { now.wait = now.hitches > 0 ? 0.13 + r() * 0.1 : 0.5 + r() * 1.6; now.probe = now.hitches > 0 ? 0 : 0.3 + r() * 0.6; }
        return;
      }
      if (now.calling > 0) {
        // the bill a little open, the head up
        now.calling -= dt;
        cling({ gape: (now.calling * 7) % 1 > 0.45 ? 0.35 : 0.06, head: { yaw: 0, pitch: rest.head.pitch + 0.15, roll: 0 } });
        bird.doing = now.singing ? 'singing: a few thin, high notes' : 'calling: one thin, high note';
        return;
      }
      if (now.wait > 0) {
        if (now.probe > 0) {
          // the bill goes into a furrow of the bark
          now.probe -= dt;
          cling({ head: { yaw: 0.5 * Math.sin(now.probe * 9), pitch: -0.15 - 0.2 * Math.abs(Math.sin(now.probe * 14)), roll: 0 } });
          bird.doing = 'probing a furrow in the bark';
        } else if (now.hitches <= 0) { cling(); bird.doing = 'clinging, braced on its tail'; }
        return;
      }
      if (height > top) {
        if (next()) return;
        // (nowhere to go just now: it works the bark where it is a while, and looks again; not in every frame, since
        // the search is not a light one)
        now.wait = 1.5 + r() * 2.5; now.probe = now.wait * 0.6;
        return;
      }
      if (now.hitches <= 0) { now.hitches = way.run[0] + Math.floor(r() * (way.run[1] - way.run[0] + 1)); if (r() < 0.2) twist = -twist; }
      now.hitches -= 1;
      const rise = between(way.step);
      // (not onto another animal on the trunk: it stops, and tries the other way round in a moment)
      if (taken(height + rise, turn + twist * rise)) { twist = -twist; now.hitches = 0; now.wait = 0.4 + r() * 0.8; now.probe = now.wait * 0.6; return; }
      now.hitch = { a: height, b: height + rise, c: turn, d: turn + twist * rise, t: 0 };
      bird.doing = 'hitching up the trunk in a spiral';
    },
  };

  const roost = {
    wary: false,
    enter() { settle(); cling({ head: { yaw: 0, pitch: 0.05, roll: 0 } }); bird.doing = 'roosting against the bark'; },
    step(a) { if (world.day >= 0.08) a.to('climb', 0.5); },
  };

  return {
    activities: { climb, roost },
    // Put up: round its trunk out of the walker's sight, more often than not, if its trunk would hide it there and
    // its far side is out of their reach (a climb begun again, slipping round: a refuge is clear of the walker,
    // life/behave.js, here by 0.3 m, the agent's number, where a flight's landing is by a metre: a trunk is not so
    // wide); or to the foot of another trunk further from them than its own, whose landing is clear of them, nearest
    // first, one it can fly to with no trunk in the way before any other (the trunks further from the walker are
    // mostly behind the bark it is on).
    refuge() {
      const off = round(), side = Math.abs(off) < 0.02 ? (r() < 0.5 ? 1 : -1) : Math.sign(off);
      const round_ = () => behind(side) && a.clear(p2.point, 0.3) && a.to('climb', 0, side);
      const off_ = () => {
        const far = tree.foot.distanceTo(world.eye) + 3;
        for (const to of clearFirst(others().filter((t) => t.foot.distanceTo(world.eye) > far)).slice(0, 8)) if (drop(to, 'flying off to another trunk')) return true;
        return false;
      };
      return r() < way.slip ? round_() || off_() : off_() || round_();
    },
    // Where it is when it comes: low on its trunk (the cast's creeper on the side a walker at its place on the trail
    // sees), and by night at roost there. One of a visit's flies in if the walker could see it be there from nowhere;
    // not onto a trunk another animal is on, nor where the walker would put it up at once: it comes a little later,
    // somewhere else.
    begin() {
      if (world.day < 0.08) { a.to('roost'); if (!cast && world.beside(tree.foot.x, tree.foot.z, tree.girth + 1.5, bird)) bird.left = 5 + r() * 10; return; }
      a.to('climb', 0.5);
      if (cast) return;
      if (world.beside(tree.foot.x, tree.foot.z, tree.girth + 1.5, bird)) { bird.left = 5 + r() * 10; return; }
      if (!a.clear(bird.at)) { bird.left = 4 + r() * 8; return; }
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), out: p.normal.clone(), rise: -0.2, speed: way.drop }, 'climb', 0.5)) bird.left = 4 + r() * 8;
      }
    },
  };
}

// The cast of checkpoint 2 asks life/agents.js for the creeper's behaviour by name (life/index.js): it lives this life
// too, by the Brown Creeper's own way (its sheet is its kind's file).
named.cast = (bird, world) => live(bird, world, bird.sheet.way, creeper);

export default {
  // what a creeper's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number', drop: 'number',  // wingbeats a second; how fast it flies off and in, and down to a trunk's foot (m/s)
    range: 'number',                                // how far off (m) the next trunk it goes to may be
    start: nums(2), top: nums(2),                   // how high on a trunk it starts, and how high it goes (m above the foot)
    quota: nums(2),                                 // how many trunks it works before it goes (one of a visit's)
    step: nums(2), beat: 'number', run: nums(2),    // a hitch's rise (m) and time (s); hitches in a run
    twist: nums(2),                                 // how steeply it spirals: turns round the trunk to a metre climbed
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    slip: 'number',                                 // the chance that, put up, it tries its trunk's far side before another trunk
    call: { every: nums(2), time: 'number', reach: 'number' },
    song: { chance: 'number', time: 'number', reach: 'number' },
  },
  act: (way) => (bird, world) => live(bird, world, way, creeper),
};
