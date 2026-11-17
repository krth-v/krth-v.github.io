import * as THREE from 'three';
import { frame, UP, spot } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums } from '../bodies.js';

// A bird of the forest's floor that keeps to cover: the Pacific Wren (life/species/pacificWren.js), in and out of the
// ferns like a mouse, its tail cocked; it sings from the top of a stump or the back of a log, loud for its size.
//
// It is only ever one of a visit's own. Its home is a stump or a log near the walk (`bird.home`: { x, z, posts, logs },
// found below); what it does there is one of three things, each an activity: it is in the ferns (`cover`); it sings
// from a post (`sing`); it works along the back of a log in short dashes, bobbing (`log`); and between them it flies,
// low and whirring. In the ferns it is under the fronds on the side of its fern that was the far one from the
// walker as it went in: it takes that side once, and shifts about under the fronds there, whatever the walker does
// after (it kept the far side as they went round its fern, dashing round to it: that is edging away from them, which
// the owner's rule for birds leaves out). It is drawn there like any bird, and what hides it is the fern
// (`bird.cover`: the pointer does not find it there, and the count of walks does not call it in sight). It goes on
// lurking, and comes out to sing or to work a log when it has a mind to, on a post or a stretch of log clear of the
// walker; and the ferns it goes into, of its own accord or put up, are clear of them too (life/behave.js `a.clear`).
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then it is off into a fern further from them, scolding as it goes; with no fern to take it flies off through the
// wood for a while, and comes back about its home (it keeps a territory: it is never gone for good). By night it
// roosts in the ferns and is not put up. It no longer bobs and scolds at a walker from nine metres, no longer
// waits in the ferns while they are near, and no longer turns to the walk to sing: it faces any way.
//
// From what was read (the species' sheet): the hopping, the bobbing, the whirring flight of a few metres, the song
// from a low perch and the scold from cover. The agent's own: every distance, time and chance below.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _v = new THREE.Vector3(), _cv = new THREE.Vector3(), _near = [];

function skulker(a) {
  const { bird, world, way, r } = a, home = bird.home;                // home: { x, z, posts, logs }
  const rest = bird.sheet.poses.singing || bird.sheet.poses.perched, low = bird.sheet.poses.creeping || rest;
  const p = spot(), p2 = spot(), q = new THREE.Quaternion(), from = new THREE.Vector3(), to = new THREE.Vector3();
  // where it is (kept across its activities): the fern it is under, the side of it it took as it went in (`side`:
  // a bearing, radians, the far side from the walker then), how far out under the fronds and how far round from
  // that side (radians), the post it is on, the stretch of log it works
  const at = { cover: null, side: 0, deep: 0.4, aside: 0, post: null, track: null };
  // (`again`: the seconds before it may look again for a fern to go into, after a search that found none: the
  // search is not a light one, and ran in every frame)
  let heading = r() * 6.28, look = 0, again = 0;

  const ground = (x, z, out) => out.set(x, world.height(x, z), z);
  const face = () => frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q);
  const hold = (pose, extra = {}) => Object.assign(bird.want, { pitch: pose.pitch, lift: pose.lift, lean: pose.lean ?? 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: pose.droop ?? 0.05, gape: 0,
    tail: { ...pose.tail }, feet: pose.feet }, extra);
  // (it looks about, in quick turns of the head)
  const glance = (dt) => { look -= dt; if (look < 0) { look = 0.25 + r() * 0.9; bird.want.head = { yaw: (r() - 0.5) * 2.4, pitch: 0.05 + r() * 0.3, roll: (r() - 0.5) * 0.3 }; } };
  // where it keeps under a fern: on the side it took as it went in, part of the way out under the fronds
  const under = (c, out) => { const th = at.side + at.aside, far = c.reach * at.deep; return ground(c.x + Math.cos(th) * far, c.z + Math.sin(th) * far, out); };
  // the side of a fern that is the far one from the walker now
  const away = (c) => Math.atan2(c.z - world.eye.z, c.x - world.eye.x);
  // a dash: a hop of a hand's breadth or less, low and quick. True while one is being made.
  const dashing = (dt) => {
    const h = bird.hop, now = a.now;
    if (!h) return false;
    h.t = Math.min(1, h.t + dt / 0.11);
    bird.at.lerpVectors(h.a, h.b, h.t); bird.at.y += 0.012 * Math.sin(Math.PI * h.t);
    hold(low, { lift: low.lift * (1 + 0.25 * Math.sin(Math.PI * h.t)) });
    if (h.t >= 1) { bird.hop = null; now.wait = now.dashes > 0 ? 0.05 : 0.4 + r() * 1.3; now.bob = 0; }
    return true;
  };
  const dash = (x, z) => { from.copy(bird.at); ground(x, z, to); heading = Math.atan2(to.z - from.z, to.x - from.x); face(); bird.hop = { a: from.clone(), b: to.clone(), t: 0 }; };
  // the ferns about its home, nearest first: not the one it is under, clear of the walker (life/behave.js: it sits
  // on the far side of the fern's middle from them, which is clear by a metre; and when it has been put up, further
  // from them than it is itself), and not one a big animal stands on or lies in
  const hide = (put = false) => {
    const all = world.coversNear(bird.at.x, bird.at.z, put ? 14 : 8, _near), off = bird.at.distanceTo(world.eye);
    const fit = all.filter((c) => c !== at.cover && a.clear(_cv.set(c.x, c.y, c.z)) && (!put || Math.hypot(c.x - world.eye.x, c.z - world.eye.z) > off + 1.5)
      && !(world.crowd && world.crowd(_cv.set(c.x, c.y, c.z), bird) < c.reach * 0.6 + 0.35))
      .sort((m, n) => Math.hypot(m.x - bird.at.x, m.z - bird.at.z) - Math.hypot(n.x - bird.at.x, n.z - bird.at.z));
    return fit.length ? fit[Math.floor(r() * Math.min(3, fit.length))] : null;
  };
  // into a fern: low and whirring to it, and down under its fronds on the side the walker is not, as it goes
  const into = (c, scold = false) => {
    at.side = away(c); at.deep = 0.3 + 0.24 * r(); at.aside = (r() - 0.5) * 1.2;
    under(c, to);
    heading = r() * 6.28;
    const far = to.distanceTo(bird.at);
    if (scold) world.say(bird, 'scold', way.scold.reach);
    a.fly({ at: to.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), rise: -Math.min(0.5, far * 0.12), floor: world.height, speed: way.speed }, 'cover', c);
    bird.doing = 'diving into the ferns';
    return true;
  };
  const duck = () => { const c = hide(); return c ? into(c) : false; };
  // Night, and it is out of the ferns: into one, to roost. With none to take it is off for a while (it comes back
  // into the ferns about its home), and with no way out it looks again in a moment. True if it has gone.
  const toRoost = () => {
    if (again > 0) return false;
    again = 2;
    return duck() || a.leave(a.awhile());
  };
  // up onto a post to sing: one clear of the walker by a few metres, and that no other animal has; it faces any way
  const mount = () => {
    const all = home.posts.filter((one) => one !== at.post && a.clear(one.point, 4) && world.free(one.point, bird, 0.7));
    if (!all.length) return false;
    // (one it can fly to with no trunk in the way, before any other)
    const open = all.filter((one) => !world.blocked(bird.at, one.point)), posts = open.length ? open : all;
    const one = posts[Math.floor(r() * posts.length)];
    heading = r() * 6.28;
    a.fly({ at: one.point.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), one.up, q).clone(), rise: 0.15, floor: world.height, speed: way.speed * 0.9 }, 'sing', one);
    return true;
  };
  // the back of a log at a share of the way along it, its normal out of the wood
  const back = (log, share, out) => { log.on(share, out); if (out.normal.y < 0) out.normal.negate(); return out; };
  // onto the back of a log, to work along it: a stretch of it clear of the walker, and that no other animal has
  const along = () => {
    const logs = home.logs || [];
    for (let tries = 0; tries < 4 && logs.length; tries += 1) {
      const log = logs[Math.floor(r() * logs.length)], share = 0.14 + 0.72 * r(), dir = r() < 0.5 ? 1 : -1;
      const here = back(log, share, p);
      // (not by a way that goes through a trunk, while there are tries left)
      if (!a.clear(here.point, 4) || !world.free(here.point, bird, 0.7) || (tries < 3 && world.blocked(bird.at, here.point))) continue;
      const point = here.point.clone(), normal = here.normal.clone();
      _v.subVectors(back(log, share + dir * 0.04, p2).point, point);
      a.fly({ at: point, q: frame(_v, normal, q).clone(), rise: 0.12, floor: world.height, speed: way.speed * 0.9 }, 'log', { log, share, way: dir });
      return true;
    }
    return false;
  };

  const activities = {
    // in the ferns, under the fronds on the side of its fern it took as it went in; by night roosting there, and
    // not to be put up. `until`: the seconds before it comes out again
    cover: {
      wary: () => world.day >= 0.08,
      enter: (a, c, until = way.stay[0] + r() * (way.stay[1] - way.stay[0])) => {
        at.cover = c; at.post = null; at.track = null; bird.cover = true;
        Object.assign(a.now, { until, lurk: 3 + r() * 5, wait: 0, dashes: 0, bob: 0 });
      },
      step: (a, dt) => {
        const now = a.now;
        now.until -= dt; now.wait -= dt; again -= dt;
        glance(dt);
        if (dashing(dt)) return;
        hold(low, { lift: low.lift * 0.9 });
        if (world.day < 0.08) { bird.doing = 'roosting in the ferns'; return; }
        bird.doing = 'in the ferns';
        // it does not keep still: it shifts about under the fronds, on the side of its fern it took
        now.lurk -= dt;
        if (now.lurk < 0) { now.lurk = 2 + r() * 7; at.deep = 0.3 + 0.24 * r(); at.aside = (r() - 0.5) * 1.2; }
        under(at.cover, to);
        // (a big animal at its fern puts it out, to another; with none found, it looks again in a moment)
        if (world.crowd && world.crowd(bird.at, bird) < 0.35 && again <= 0) { again = 1; const c = hide(true); if (c) { into(c); return; } }
        const off = Math.hypot(to.x - bird.at.x, to.z - bird.at.z);
        if (off > 0.09 && now.wait < 0 && !(world.crowd && world.crowd(to, bird) < 0.35)) {
          const k = Math.min(1, (0.05 + 0.05 * r()) / off);
          now.dashes = off > 0.2 ? 1 : 0;
          dash(bird.at.x + (to.x - bird.at.x) * k, bird.at.z + (to.z - bird.at.z) * k);
          return;
        }
        if (now.until < 0 && !(r() < 0.55 ? mount() || along() : along() || mount())) now.until = 5 + r() * 10;
      },
    },
    // upright on its post, tail cocked; a song is a long run of trills, the bill open and the whole bird shaking with it
    sing: {
      enter: (a, one) => { at.post = one; at.cover = null; at.track = null; Object.assign(a.now, { songs: 2 + Math.floor(r() * 4), note: 0, wait: 0.6 + r() }); },
      step: (a, dt) => {
        const now = a.now;
        now.wait -= dt; now.note -= dt; again -= dt;
        hold(rest);
        // (night: into the ferns, to roost; until it has gone it sits on its post, and does not sing)
        if (world.day < 0.08) { if (!toRoost()) { glance(dt); bird.doing = 'perched on its post'; } return; }
        if (now.note > 0) {
          bird.want.gape = 0.5 + 0.3 * Math.sin(now.note * 38);
          bird.want.head = { yaw: 0.5 * Math.sin(now.note * 0.9), pitch: 0.5, roll: 0 }; look = 0.3;
          bird.want.tail = { ...rest.tail, pitch: (rest.tail.pitch ?? 0) + 0.12 * Math.sin(now.note * 30) };
          bird.doing = 'singing: a long, fast run of trills and thin high notes';
          return;
        }
        glance(dt);
        bird.doing = 'perched on its post';
        if (now.wait >= 0) return;
        if (now.songs > 0) {
          // (as long as the song that is played for it: sound/voices.js)
          now.note = way.song.time[0] + r() * (way.song.time[1] - way.song.time[0]); now.songs -= 1; now.wait = now.note + 5 + r() * 9;
          world.say(bird, 'song', way.song.reach);
        } else if (!(r() < 0.5 ? along() : duck())) { now.songs = 1; now.wait = 3; }
      },
    },
    // along the back of a log: short quick dashes, with a bob between them; it keeps off the log's broken ends
    log: {
      enter: (a, track) => { at.track = track; at.cover = null; at.post = null; Object.assign(a.now, { dashes: 0, wait: 0.3, until: way.work[0] + r() * (way.work[1] - way.work[0]), bob: 0 }); },
      step: (a, dt) => {
        const now = a.now, track = at.track;
        now.wait -= dt; now.until -= dt; again -= dt;
        glance(dt);
        if (dashing(dt)) return;
        // (night: into the ferns, to roost; until it has gone it stays where it is on the log)
        if (world.day < 0.08) { if (!toRoost()) { hold(low); bird.doing = 'on a mossy log'; } return; }
        if (now.until < 0) { if (r() < 0.5 ? mount() : duck()) return; now.until = 6; }
        if (now.wait > 0) {
          now.bob += dt * 8;
          hold(low, { lift: low.lift * (1 - 0.22 * Math.max(0, Math.sin(now.bob))) });
          bird.doing = 'working along a mossy log';
          return;
        }
        if (now.dashes <= 0) { now.dashes = 2 + Math.floor(r() * 5); if (r() < 0.3) track.way = -track.way; }
        now.dashes -= 1;
        let share = track.share + (track.way * (0.05 + r() * 0.07)) / track.log.length;
        if (share < 0.1 || share > 0.9) { track.way = -track.way; share = clamp(share, 0.1, 0.9); }
        const there = back(track.log, share, p);
        // (not into another animal that is on the log, or about to be, and never in towards the walker past where it
        // would be put up: it turns back)
        if (world.crowd(there.point, bird) < Math.min(0.6, world.crowd(bird.at, bird)) || (!a.clear(there.point, 0) && there.point.distanceTo(world.eye) < bird.at.distanceTo(world.eye))) {
          track.way = -track.way; now.dashes = 0; now.wait = 0.4 + r() * 0.6;
          return;
        }
        from.copy(bird.at);
        if (_v.subVectors(there.point, from).lengthSq() > 1e-8) frame(_v, there.normal, bird.q);
        bird.hop = { a: from.clone(), b: there.point.clone(), t: 0 };
        track.share = share;
        bird.doing = 'working along a mossy log';
      },
    },
  };

  return {
    activities,
    // put up: off, low and whirring, into a fern further from the walker than it is, scolding as it goes
    refuge: () => { const c = hide(true); return c ? into(c, true) : false; },
    // where the visit finds it: in one of the ferns about its home, by chance, that is clear of the walker (it was
    // always the first of them, wherever the walker stood); with ferns and none of them clear it comes a little later,
    // and with no ferns not at all; by night, in the ferns and silent
    begin: () => {
      const all = world.coversNear(home.x, home.z, 9, _near), clear = all.filter((one) => a.clear(_cv.set(one.x, one.y, one.z)));
      if (!clear.length) { bird.left = all.length ? 4 + r() * 8 : Infinity; return; }
      const c = clear[Math.floor(r() * clear.length)];
      at.cover = c; at.side = away(c);
      under(c, bird.at); face();
      a.to('cover', c, 2 + r() * 25);
      hold(low);
    },
  };
}

export default {
  // what a skulker's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies from fern to fern (m/s)
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    stay: nums(2), work: nums(2),                   // seconds in the ferns before it comes out; seconds along a log
    song: { time: nums(2), reach: 'number' },       // how long one song is (s), and how far it is heard (m)
    scold: { reach: 'number' },
  },
  act: (way) => (bird, world) => live(bird, world, way, skulker),
  // a stump or a log within twelve metres of the walk, with ferns by it: its posts are that one's top, and the
  // tops and backs of any others within ten metres of it
  // (a territory each: none within thirty-two metres of another wren's)
  home: () => (habitat, r, taken = []) => {
    const sites = [...habitat.stumps.filter((s) => s.off < 12), ...habitat.logs.filter((l) => l.off < 12)];
    for (let tries = 0; tries < 24 && sites.length; tries += 1) {
      const site = sites[Math.floor(r() * sites.length)];
      if (taken.some((home) => Math.hypot(home.x - site.x, home.z - site.z) < 32)) continue;
      if (!habitat.coversNear(site.x, site.z, 9).length) continue;
      const posts = [], logs = [];
      for (const one of sites) {
        if (Math.hypot(one.x - site.x, one.z - site.z) > 10) continue;
        if (one.point) { posts.push({ point: one.point.clone(), up: new THREE.Vector3(0, 1, 0) }); continue; }
        for (const share of [0.2, 0.5, 0.8]) { const at = one.on(share, spot()); if (at.normal.y < 0) at.normal.negate(); posts.push({ point: at.point.clone(), up: at.normal.clone() }); }
        // (the logs it works along, each with its length in metres)
        logs.push({ on: one.on, length: Math.max(1, one.on(0.02, spot()).point.distanceTo(one.on(0.98, spot()).point)) });
      }
      return { x: site.x, z: site.z, posts, logs };
    }
    return null;
  },
};
