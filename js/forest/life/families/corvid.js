import * as THREE from 'three';
import { frame, flying, spot, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';

// A bold bird that goes about low in the wood: Steller's Jay (life/species/stellersJay.js, whose way gives its
// numbers). It is only ever one of a visit's own. Its home is a patch of the wood with dead wood in it (`bird.home`:
// { x, z, posts, logs }, found below): the tops of stumps, the backs of logs and the stubs of broken limbs are its
// posts. On a post it looks about, and now and then calls, a run of harsh notes with the tail pumped at each; it drops
// to open floor and bounds over it, picking through the litter; what it finds it may carry up to a stump or a log and
// tuck into the moss; it flies a few beats and then holds its wings out. By night it roosts on the stub of a limb.
//
// It lives on life/behave.js: it goes about its business whatever the walker does, until they are too near or move
// suddenly; then it is off to a post further from them, scolding as it goes, or away. It does nothing else about
// them (the owner's rule for birds, 2026-11-16): it does not watch them, turn to them, come nearer them, bound
// towards them or call the more for their being near; it calls on its own timer, and lands on a post facing either
// way. Every place it goes of its own accord is clear of the walker (life/behave.js `a.clear`).
//
// From what was read (the species' sheet; Seattle Audubon's BirdWeb and the Audubon field guide, as gathered in
// .local-assets/forest/research/birds-2026-11-16.json): it forages in trees and on the ground, on anything; it caches
// food and covers it; it is bold round people, at picnic places and campgrounds most of all, where it begs loudly;
// its call is a harsh, repeated "shack"; while it nests it is quiet and secretive. The agent's own: every distance,
// time and chance below; that it bounds over the ground; how it flies (a few beats, then its wings held out). What
// the sources have of its boldness round people is in how near it lets them come (its `flush`), and in nothing else.
const _v = new THREE.Vector3(), _near = [];

function corvid(a) {
  const { bird, world, way, r } = a, home = bird.home;                // home: { x, z, posts, logs }
  const rest = bird.sheet.poses.perched, q = new THREE.Quaternion(), from = new THREE.Vector3(), to = new THREE.Vector3(), p = spot();
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  // What it is about across its activities: the post it is on; when it next calls; whether what it took up from the
  // ground is something to hide; the way it is bounding; when it may look again for a roost (the search is not a
  // light one).
  const at = { post: null };
  let quiet = 4 + r() * 14, carrying = false, heading = r() * 6.28, again = 0;

  const face = () => frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q);
  const stand = (pitch, extra = {}) => Object.assign(bird.want, { pitch, lift: 0.56, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.03, gape: 0,
    tail: { pitch: -0.1, fan: 0 }, feet: { mode: 'flat' } }, extra);
  // how it sits on a post: across the stub of a limb, gripping it; flat on a stump or a log
  const sit = () => {
    const flat = !at.post.along;
    Object.assign(bird.want, { pitch: flat ? 0.46 : rest.pitch, lift: flat ? 0.56 : rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
      tail: { pitch: flat ? -0.16 : rest.tail.pitch, fan: 0 }, feet: flat ? { mode: 'flat' } : { mode: 'grip', round: at.post.radius } });
  };
  // it looks about, in quick turns of the head
  const glance = (now, dt) => { now.look -= dt; if (now.look < 0) { now.look = 0.3 + r() * 1.1; bird.want.head = { yaw: (r() - 0.5) * 2.6, pitch: (r() - 0.3) * 0.4, roll: (r() - 0.5) * 0.5 }; } };

  // Open floor it can stand on: not in a trunk, a stump, a log or a fern, and not in the water.
  const open = (x, z) => {
    const kind = world.ground(x, z);
    if (kind !== 'floor' && kind !== 'tread' && kind !== 'grass') return false;
    for (const t of world.trunksNear(x, z, 2.5, _near)) if (Math.hypot(t.foot.x - x, t.foot.z - z) < t.girth + 0.35) return false;
    for (const s of world.stumps) if (Math.hypot(s.x - x, s.z - z) < 1.1) return false;
    for (const c of world.coversNear(x, z, 1.2, _near)) if (Math.hypot(c.x - x, c.z - z) < c.reach * 0.8) return false;
    for (const log of home.logs) for (let k = 0, n = Math.ceil(log.length / 0.7); k <= n; k += 1) { const one = log.on(k / n, p).point; if (Math.hypot(one.x - x, one.z - z) < 0.8) return false; }
    return true;
  };
  // One of its posts: free, not the one it is on, clear of the walker by `margin` metres more than it has to be, no
  // nearer them than `far` (when it has been put up), a roost (the stub of a limb) if asked; one it can fly to with
  // no trunk in the way, and that the walker can see, before any other; of the nearest five, one by chance.
  const pick = ({ margin = 1, far = 0, high = false } = {}) => {
    const all = home.posts.filter((post) => post !== at.post && (!high || post.high) && world.free(post.point, bird, 0.7) && a.clear(post.point, margin)
      && post.point.distanceTo(world.eye) >= far);
    const seen = all.filter((post) => !world.blocked(world.eye, post.point) && !world.blocked(bird.at, post.point));
    const some = (seen.length ? seen : all).sort((m, n) => m.point.distanceTo(bird.at) - n.point.distanceTo(bird.at)).slice(0, 5);
    return some.length ? some[Math.floor(r() * some.length)] : null;
  };
  // how it lands on a post: across a stub, facing either way; any way on a stump or a log
  const facing = (post) => {
    if (post.along) { _v.crossVectors(post.along, UP); if (r() < 0.5) _v.negate(); return frame(_v, UP, q).clone(); }
    const turn = r() * 6.28;
    return frame(_v.set(Math.cos(turn), 0, Math.sin(turn)), post.up, q).clone();
  };
  // off to a post, and onto it (with what it carries, to tuck away there if the post is a stump or a log)
  const go = (post, doing, landing = 'perch') => {
    const tuck = carrying && !post.along;
    carrying = false;
    a.fly({ at: post.point.clone(), q: facing(post), rise: 0.25 }, landing, post, tuck);
    if (doing) bird.doing = doing;
    return true;
  };
  // down to open floor a few metres off, clear of the walker, with no trunk in the way and no other animal there
  const down = () => {
    for (let i = 0; i < 10; i += 1) {
      const turn = r() * 6.28, d = 1.5 + r() * 5.5, x = bird.at.x + Math.cos(turn) * d, z = bird.at.z + Math.sin(turn) * d;
      if (!open(x, z)) continue;
      to.set(x, world.height(x, z), z);
      if (!a.clear(to, 2) || world.blocked(bird.at, to) || world.crowd(to, bird) < 0.8) continue;
      heading = r() * 6.28;
      a.fly({ at: to.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), floor: world.height, speed: way.speed * 0.85 }, 'forage');
      bird.doing = 'dropping to the ground';
      return true;
    }
    return false;
  };
  // night: up to a roost on the stub of a limb. With none to be had it looks again in a while: on a post it stays
  // where it is meanwhile; on the ground it goes up onto any post for the night, or is off (it bounded about the
  // floor all night).
  const roosting = () => {
    if (at.post && at.post.high) return a.to('roost', at.post);
    if (again > 0) return false;
    again = 5;
    const post = pick({ high: true, margin: 0 });
    if (post) return go(post, 'going up to roost', 'roost');
    if (a.name !== 'forage') return false;
    const any = pick({ margin: 0 });
    return any ? go(any, 'going up off the ground for the night') : a.leave(a.awhile());
  };

  const perch = {
    enter(a, post, tuck = false) {
      at.post = post;
      Object.assign(a.now, { until: between(way.sit), look: 0, note: 0, tuck: tuck ? 1.6 : 0 });
      sit(); bird.doing = 'perched, looking about';
    },
    step(a, dt) {
      const now = a.now;
      again -= dt;
      if (world.day < 0.08 && roosting()) return;
      now.until -= dt; quiet -= dt;
      sit(); glance(now, dt);
      bird.doing = 'perched, looking about';
      if (world.day < 0.08) { bird.doing = 'roosting'; return; }
      if (now.tuck > 0) {
        // what it carried up goes into a crack, and is covered
        now.tuck -= dt;
        bird.want.pitch = 0.1; bird.want.head = { yaw: 0.2 * Math.sin(now.tuck * 24), pitch: -0.85, roll: 0 };
        bird.doing = 'tucking something into the moss';
        if (now.tuck <= 0) now.look = 0;
        return;
      }
      if (now.note > 0) {
        // a run of harsh notes, the bill open and the tail pumped at each
        now.note -= dt;
        const on = (now.note * 1.5) % 1 > 0.55;                 // (five notes in a little over three seconds, as the recording that is played for it has them)
        bird.want.gape = on ? 0.6 : 0.08; bird.want.pitch += on ? 0.08 : 0; bird.want.tail = { pitch: bird.want.tail.pitch - (on ? 0.22 : 0), fan: on ? 0.12 : 0 };
        bird.want.head = { yaw: bird.want.head ? bird.want.head.yaw * 0.4 : 0, pitch: 0.2, roll: 0 };
        bird.doing = 'calling: a harsh shaack, shaack, shaack';
        if (now.note <= 0) now.look = 0;
        return;
      }
      // now and then a run of harsh notes
      if (quiet < 0) { now.note = way.call.time; quiet = between(way.call.every); world.say(bird, 'shack', way.call.reach); return; }
      if (now.until < 0) {
        // it has sat long enough: down to the ground, to another post, or off
        const k = r();
        if (k < way.down && down()) return;
        if (k < way.down + way.move) { const post = pick({ margin: 2 }); if (post && go(post, 'flying to another perch')) return; }
        if (a.leave(r() < 0.35 ? Infinity : a.awhile())) return;
        now.until = 5;
      }
    },
  };

  const forage = {
    enter(a) { at.post = null; Object.assign(a.now, { until: between(way.feed), wait: 0.5, hops: 0, peck: 0, pecked: false, hop: null, look: 0 }); stand(0.5); bird.doing = 'standing, looking about'; },
    step(a, dt) {
      const now = a.now;
      again -= dt;
      if (world.day < 0.08 && roosting()) return;
      now.until -= dt; now.wait -= dt;
      glance(now, dt);
      if (now.hop) {
        const h = now.hop; h.t = Math.min(1, h.t + dt / 0.2);
        bird.at.lerpVectors(h.a, h.b, h.t); bird.at.y += 0.05 * Math.sin(Math.PI * h.t);
        stand(0.36, { lift: 0.48 + 0.3 * Math.sin(Math.PI * h.t), feet: { mode: h.t > 0.15 && h.t < 0.85 ? 'tuck' : 'flat' } });
        if (h.t >= 1) { now.hop = null; now.wait = now.hops > 0 ? 0.1 : 0.5 + r() * 1.8; }
        return;
      }
      if (now.until < 0 && world.day >= 0.08) {
        // it has found something, and takes it up to a log or a stump to hide; or it has had enough of the ground
        carrying = r() < way.carry;
        const post = pick({ margin: 2 });
        if (post ? go(post, carrying ? 'carrying something off' : 'flying up') : a.leave(a.awhile())) return;
        carrying = false; now.until = 5;
      }
      if (now.wait > 0) {
        if (now.peck > 0) {
          now.peck -= dt;
          stand(0.08, { lift: 0.44 }); bird.want.head = { yaw: 0.3 * Math.sin(now.peck * 26), pitch: -0.9, roll: 0 };
          bird.doing = 'picking through the litter';
          if (now.peck <= 0) now.look = 0;
        } else if (now.hops <= 0) { stand(0.5); bird.doing = 'standing, looking about'; }
        return;
      }
      if (now.hops <= 0) {
        if (r() < 0.5 && !now.pecked) { now.peck = 0.5 + r() * 0.6; now.wait = now.peck + 0.2; now.pecked = true; return; }
        now.pecked = false; now.hops = 2 + Math.floor(r() * 4);
        // back towards the middle of where it goes about, if it has strayed; or on, turning a little
        if (Math.hypot(home.x - bird.at.x, home.z - bird.at.z) > 9) heading = Math.atan2(home.z - bird.at.z, home.x - bird.at.x) + (r() - 0.5) * 0.9;
        else heading += (r() - 0.5) * 2.6;
        face();
      }
      now.hops -= 1;
      from.copy(bird.at);
      const reach = 0.14 + r() * 0.1, x = from.x + Math.cos(heading) * reach, z = from.z + Math.sin(heading) * reach;
      to.set(x, world.height(x, z), z);
      // (not into a trunk, a log or a fern, not into another animal, and never in towards the walker past where it
      // would be put up)
      if (!open(x, z) || world.crowd(to, bird) < Math.min(0.6, world.crowd(from, bird)) || (!a.clear(to, 1) && to.distanceTo(world.eye) < from.distanceTo(world.eye))) {
        heading += 1.4 + r() * 1.8; face(); now.hops = Math.max(now.hops, 1); now.wait = 0.12;
        return;
      }
      now.hop = { a: from.clone(), b: to.clone(), t: 0 };
      bird.doing = 'bounding over the forest floor';
    },
  };

  const roost = {
    wary: false,
    enter(a, post) { at.post = post; sit(); bird.doing = 'roosting'; },
    step(a) { if (world.day >= 0.08) a.to('perch', at.post); },
  };

  // its own flight: it rows a few beats and then holds its wings out
  const fly = {
    wary: false,
    step(a, dt) {
      flying(bird, dt, way.hz);
      if (bird.flight && bird.flight.time > 0.9 && (bird.beat / 6.283) % 13 > 8.5) Object.assign(bird.want, { flap: 0.14, hand: 0.04 });
    },
  };

  return {
    activities: { perch, forage, roost, fly },
    // Put up: off to a post further from the walker and clear of them, scolding as it goes (from the ground, up onto
    // one, and not always scolding); or nowhere near.
    refuge() {
      const ground = a.name === 'forage', post = pick({ margin: 1, far: bird.at.distanceTo(world.eye) + (ground ? 1.5 : 3) });
      if (!post) return false;
      carrying = false;
      if (!ground || r() < 0.5) { world.say(bird, 'shack', way.call.reach); quiet = between(way.call.every); }
      return go(post, ground ? 'flying up from the ground' : 'flying off a little way, scolding');
    },
    // Where it is when it comes: on one of its posts, clear of the walker (by night a roost, on the stub of a limb),
    // and it flies in if the walker could see it be there from nowhere. With no post to be had it comes a little later
    // (by night, not at all).
    begin() {
      const night = world.day < 0.08, posts = home.posts.filter((post) => (!night || post.high) && world.free(post.point, bird, 0.7) && a.clear(post.point, 3));
      if (!posts.length) { bird.left = night ? Infinity : 6 + r() * 10; return; }
      const post = posts[Math.floor(r() * posts.length)];
      bird.at.copy(post.point); bird.q.copy(facing(post));
      a.to(night ? 'roost' : 'perch', post);
      if (!night && !a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: post.point.clone(), q: bird.q.clone(), rise: 0.25 }, 'perch', post)) bird.left = 4 + r() * 8;
      }
    },
  };
}

export default {
  // what a jay's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    sit: nums(2), feed: nums(2),                    // seconds on a post, and on the ground, before it moves on
    down: 'number', move: 'number',                 // sat long enough: the chance it drops to the ground, and that it flies to another post (or it is off)
    carry: 'number',                                // the chance that what it goes up from the ground with is something to tuck away
    call: { every: nums(2), time: 'number', reach: 'number' },      // its run of harsh notes: how often (s), how long, how far it carries (m)
  },
  act: (way) => (bird, world) => live(bird, world, way, corvid),
  // a patch of the wood within reach of the walk that has dead wood and broken limbs to go about on: a stump
  // or a log within sixteen metres of the walk, and every stump top, log back and stub within twenty-four
  // metres of that (four at the least)
  home: () => (habitat, r) => {
    const sites = [...habitat.stumps.filter((s) => s.off < 16), ...habitat.logs.filter((l) => l.off < 16)];
    for (let tries = 0; tries < 24 && sites.length; tries += 1) {
      const site = sites[Math.floor(r() * sites.length)], posts = [], logs = [];
      for (const one of [...habitat.stumps, ...habitat.logs]) {
        if (one.off > 24 || Math.hypot(one.x - site.x, one.z - site.z) > 24) continue;
        if (one.point) { posts.push({ point: one.point.clone(), up: new THREE.Vector3(0, 1, 0) }); continue; }
        for (const share of [0.25, 0.5, 0.75]) { const at = one.on(share, spot()); if (at.normal.y < 0) at.normal.negate(); posts.push({ point: at.point.clone(), up: at.normal.clone() }); }
        logs.push({ on: one.on, length: Math.max(1, one.on(0.02, spot()).point.distanceTo(one.on(0.98, spot()).point)) });
      }
      for (const stub of habitat.stubsNear(site.x, site.z, 24)) if (stub.off < 22) posts.push({ point: stub.point, up: UP, along: stub.along, radius: stub.radius, high: true });
      if (posts.length >= 4) return { x: site.x, z: site.z, posts, logs };
    }
    return null;
  },
};
