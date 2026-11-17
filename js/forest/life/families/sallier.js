import * as THREE from 'three';
import { frame, UP, spot } from '../agents.js';
import { onLimb, onTube } from '../perch.js';
import { live, WARY } from '../behave.js';
import { optional, nums, list } from '../bodies.js';

// Flycatchers that watch from a perch and fly out for their food: the Pacific-slope, Hammond's, the Olive-sided and
// the Willow. Each is one of a visit's own, with a home (`bird.home`: { x, z, posts }): the places in a stretch of the
// wood it can sit on, of the kinds and at the heights its way asks for. It sits upright and looks about, flicks its
// wings and tail, now and then calls or sings, and every so often flies out a metre or a few: to the leaves of a bough
// near by, to hover there picking at them, or into the air after something flying; then back to the same post or one
// near it. After a while it moves to another post of its own, and after a spell it goes.
//
// What was read (2026-11-16; the species' files name the rest):
//   Sakai and Noon 1990, "Variation in the foraging behaviors of two flycatchers: associations with stage of the
//   breeding cycle", Studies in Avian Biology 13: 237-244 (the Forest Service's scan, read as page images). Hammond's
//   and the Western (Pacific-slope) Flycatcher in Douglas-fir and tanoak forest in northwestern California, 1984-85.
//   Its Table 4: before incubation (10 April to 15 May) the Western Flycatcher was seen to hover-glean 121 times,
//   glean from a perch 4 times and flycatch 17; in incubation (16 May to 15 June) 213, 4 and 38. Hammond's: 32, 0 and
//   10; then 93, 2 and 45. So in May both take most of their food by hovering at leaves, and more from the air as the
//   season goes on. Hammond's "consistently selected taller trees and foraged higher in the canopy and subcanopy than
//   Western Flycatchers". A northern California study, not one of these valleys.
//   Seattle Audubon's BirdWeb (the four species' pages, read through a tool that returns a page's text): the
//   Pacific-slope "watches from a perch in the lower or middle canopy, and flies out to catch prey in the air";
//   Hammond's are "found high in the canopy where they watch from a perch" and "wag their tails in a slow, up-down
//   motion"; the Olive-sided "sits high in a treetop, darting out after a flying insect, then returns to its perch";
//   the Willow forages "in the shrub layer, or in low trees", flies out "in quick darts, and return[s] to the perch",
//   and gleans "from twigs and branches as they hover in the foliage".
//   For the Olive-sided: McBeath, Gibbons and Staicer (Nova Scotia, an abstract): its perch trees "averaged 16.3m",
//   "nearly a third of perch trees were snags; most live perch trees (70%) had emergent crowns", and the birds "tended
//   to sit on treetops adjacent to small gaps"; Oregon's Conservation Strategy: "Tall (>12 m) snags or trees provide
//   foraging perches where birds are often conspicuous", in "open forests, often near water".
// The agent's own: every distance, time and chance in the ways; which share of a kind's sallies go to leaves (set
// from Sakai and Noon's counts for the Pacific-slope and Hammond's, and from no count for the Willow); how long a
// hover lasts; how long it keeps to one post; and that one that has made a few sallies goes off for a while.
//
// Where it sits is chosen so that a walker can see it there (life/species: "Learned in milestone 4"): a bird higher
// in a tree's boughs is looked up at through their foliage, so a way may hold its boughs lower than its other posts
// (`boughs`); the Olive-sided sits on the tops of snags, which have no leaves round them (the tip of an alder is
// inside its painted crown: a close-up of one there, 25 m up, showed a tenth of the bird); and on a willow only the
// upper twigs are taken, where a bird is on the outside of the bush (one on a twig 1.3 m up, among the stems, showed
// an eighth of itself; the upper twigs have not been looked at in the forest).
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then goes to a post clear of them (somewhere near) or is off. Every post and every place it flies out to is clear
// of the walker (`a.clear`), so nothing it does of its own accord takes it towards them.
const _t = new THREE.Vector3(), _u = new THREE.Vector3(), _trees = [], _boughs = [];

function sallier(a) {
  const { bird, world, way, r } = a, home = bird.home;                  // home: { x, z, posts }
  const rest = bird.sheet.poses.perched, q = new THREE.Quaternion(), to = new THREE.Vector3(), look = new THREE.Vector3(), p = spot();
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  // where it is (kept across its activities): the post it is on, and how long its spell has left, when it next calls,
  // sallies, flicks and moves on
  const at = { post: null };
  let spell = between(way.spell), calls = between(way.call.every) * r(), sallies = between(way.sally.every) * 0.5, again = 0;
  let flick = way.flick ? 0.6 + r() * 1.5 : Infinity, stay = between(way.stay);

  // how it sits on a post: across a stub, a bough or a twig, the side it faces at random; any way on a log or a snag's top
  const facing = (post, out) => {
    if (post.along) { _t.crossVectors(post.along, UP); if (_t.lengthSq() < 1e-6) _t.set(1, 0, 0); if (r() < 0.5) _t.negate(); } else { const th = r() * 6.283; _t.set(Math.cos(th), 0, Math.sin(th)); }
    return frame(_t, post.up, out);
  };
  // Upright on a perch, its toes round it. On the broad back of a log it stands on flat feet, a little less upright,
  // the tip of its tail held just off the wood (hung as from a twig, it went into the wood); the top of a snag or a
  // stump is the tip of its tallest splinter, which its toes close round.
  const tailOf = (post, up = 0) => (post && post.flat
    ? { pitch: 0, fan: (rest.tail && rest.tail.fan) || 0, prop: 0.012 + up * 0.08 }
    : { ...rest.tail, pitch: ((rest.tail && rest.tail.pitch) || 0) + up, prop: null });
  const sit = (head, extra = {}) => {
    const post = at.post, flat = post && post.flat;
    return Object.assign(bird.want, { pitch: flat ? rest.pitch * 0.8 : rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
      head, tail: tailOf(post), feet: flat ? { mode: 'flat' } : { mode: 'grip', round: Math.max(0.004, post && post.radius ? post.radius : 0.012) } }, extra);
  };
  // the bill open while a note of what it says is in the air: at its recording's notes (`notes`), or by turns
  const open = (voice, left) => {
    const t = voice.time - left;
    if (voice.notes) return voice.notes.some(([from, until]) => t >= from && t <= until) ? 0.5 : 0.06;
    return (left * voice.rate) % 1 > 0.5 ? 0.5 : 0.08;
  };

  // A post it could go to: free, clear of the walker, within `reach` of where it is, not the one it is on; one the
  // walker has no trunk in front of, before any other.
  const pick = (reach = Infinity) => {
    const all = home.posts.filter((one) => one !== at.post && one.point.distanceTo(bird.at) < reach && world.free(one.point, bird, 0.6) && a.clear(one.point));
    const seen = all.filter((one) => !world.blocked(world.eye, one.point) && !world.blocked(bird.at, one.point)), some = seen.length ? seen : all;
    return some.length ? some[Math.floor(r() * some.length)] : null;
  };
  // off to a post, and onto it
  const go = (post, doing) => {
    a.fly({ at: post.point.clone(), q: facing(post, q).clone(), rise: 0.1, floor: world.height }, 'perch', post);
    if (doing) bird.doing = doing;
    return true;
  };
  // back to the post it flew out from if that is free and clear of the walker (the chance `back`), or to another near
  // by; none, and it goes (false if it cannot: it looks again a moment later)
  const settle = (from) => {
    const back = from && r() < way.back && world.free(from.point, bird, 0.6) && a.clear(from.point) ? from : pick(way.reach);
    if (back) return go(back, back === from ? 'back to its perch' : 'on to another perch');
    return a.leave(a.awhile());
  };

  const perch = {
    enter(a, post, wait = 0.6 + r() * 1.4) {
      at.post = post;
      Object.assign(a.now, { wait, calling: 0, voice: null, flicking: 0, flickTime: 0, look: 0, head: { yaw: 0, pitch: rest.head ? rest.head.pitch : -0.1, roll: 0 } });
      // (landing from a flight it already stands as it landed; put there by `begin`, it is turned some way)
      if (bird.at.distanceToSquared(post.point) > 0.0025) { bird.at.copy(post.point); facing(post, bird.q); }
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', at.post); return; }
      now.wait -= dt; spell -= dt; calls -= dt; sallies -= dt; flick -= dt; now.look -= dt; again -= dt; stay -= dt;
      // it turns its head quickly this way and that, looking up for insects more than down
      if (now.look < 0) { now.look = 0.4 + r() * 1.6; now.head = { yaw: (r() - 0.5) * 2.2, pitch: -0.1 + (r() - 0.35) * 0.6, roll: (r() - 0.5) * 0.3 }; }
      if (now.calling > 0) {
        now.calling -= dt;
        sit({ yaw: now.head.yaw * 0.3, pitch: 0.3, roll: 0 }, { gape: open(now.voice, now.calling) });
        bird.doing = now.voice.doing;
        return;
      }
      sit(now.head);
      // The flick: the wings snapped out and in and the tail flicked up, quickly; a kind that wags its tail (`wag`,
      // seconds) lets it down again slowly.
      if (now.flicking > 0) {
        now.flicking -= dt;
        const t = now.flickTime - now.flicking, up = t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / Math.max(0.04, now.flickTime - 0.1));
        bird.want.tail = tailOf(at.post, 0.35 * up);
        if (t < 0.14) { Object.assign(bird.want, { spread: 0.22, flap: 0.35 }); bird.snap = true; }
        bird.doing = way.wag ? 'flicking its wings, and wagging its tail slowly up and down' : 'flicking its wings and tail on its perch';
        return;
      } else if (flick < 0) { flick = between(way.flick); now.flickTime = now.flicking = way.wag || 0.18; }
      // its spell is over: off for a while or for good (with no way out found it looks again in a moment)
      if (spell < 0 && again <= 0) {
        if (a.leave(r() < way.gone ? Infinity : a.awhile())) return;
        again = 1.5;
      }
      if (now.wait > 0) { bird.doing = way.watching; return; }
      if (calls < 0) {
        const voice = way.song && r() < way.song.chance ? way.song : way.call;
        calls = between(way.call.every); now.voice = voice; now.calling = voice.time;
        world.say(bird, voice === way.song ? 'song' : 'call', voice.reach);
        return;
      }
      if (sallies < 0) {
        sallies = between(way.sally.every);
        if ((way.glean > 0 && r() < way.glean && glean()) || sally()) return;
      }
      // after a while on one post it moves to another of its own near by
      if (stay < 0) {
        stay = between(way.stay);
        const one = pick(way.reach);
        if (one) { go(one, 'moving to another perch'); return; }
      }
      bird.doing = way.watching;
    },
  };

  // The point in the air it flies out to: round its post, up or down a little, in clear air, not over the ground's
  // face, clear of the walker, no trunk in the way. False if there is none (tried a few times).
  const target = (out) => {
    for (let tries = 0; tries < 8; tries += 1) {
      // (up or down between the way's least and most: the first sheet's sum took 0.45 of the span off both, so that a
      // sally never rose past a third of its most, and fell past its least)
      const th = r() * 6.283, d = between(way.sally.reach), dy = between(way.sally.rise);
      out.set(at.post.point.x + Math.cos(th) * d, at.post.point.y + dy, at.post.point.z + Math.sin(th) * d);
      if (out.y - world.height(out.x, out.z) < 1 || !a.clear(out, 2.5) || world.blocked(at.post.point, out) || world.crowd(out, bird) < 0.8) continue;
      return true;
    }
    return false;
  };
  // out after something flying: a short flight to a point in the air, a snap there, and back
  const sally = () => {
    if (!at.post || !target(to)) return false;
    const there = to.clone();
    _u.subVectors(there, bird.at).setY(0);
    if (_u.lengthSq() < 1e-6) _u.set(1, 0, 0);
    frame(_u, UP, q);
    a.fly({ at: there, q: q.clone(), rise: 0, floor: world.height }, 'snap', at.post);
    bird.doing = 'flying out from its perch after an insect';
    return true;
  };

  // Out to the leaves: the tip of a bough near by, or a twig of a willow or a vine maple, within reach of its post and
  // not far above or below it, where it hovers facing the leaves: in clear air, clear of the walker, no trunk in the
  // way, no other animal there (the guards of the kinglet's hover at a bough's tip, life/families/bough.js, which the
  // counts of walks have been through). False if there is none (tried a few times).
  const leaves = (out, face) => {
    const from = at.post.point, far = way.sally.reach[1];
    const boughs = world.boughsNear(from.x, from.z, far + 3, _boughs), trees = world.leafyNear(from.x, from.z, far + 3, _trees);
    for (let tries = 0; tries < 10; tries += 1) {
      if (r() < 0.5 && trees.length) {
        // a twig of a plant that has no trunk (a willow, a vine maple): beside it, a hand off it on the side it came from
        const tree = trees[Math.floor(r() * trees.length)], sprigs = tree.place.perch.sprigs || [];
        if (tree.place.perch.trunk || !sprigs.length) continue;
        const one = sprigs[Math.floor(r() * sprigs.length)];
        out.set(one[0], one[1], one[2]).applyMatrix4(tree.place.matrix);
        _u.subVectors(from, out).setY(0); if (_u.lengthSq() < 1e-6) _u.set(1, 0, 0); _u.normalize();
        out.addScaledVector(_u, 0.14 + r() * 0.1); out.y -= 0.04;
        face.copy(_u).negate();
      } else {
        if (!boughs.length) continue;
        const one = boughs[Math.floor(r() * boughs.length)];
        if (one === at.post) continue;
        // the leaves at the limb's end: just off its tip and a little under it, facing back along it
        onLimb(one.tree.place, one.tree.limbs, one.tube, 0.999, p);
        out.copy(p.point).addScaledVector(p.along, 0.2 + r() * 0.25); out.y -= 0.1 + r() * 0.15;
        face.copy(p.along).negate().setY(0); if (face.lengthSq() < 1e-6) face.set(1, 0, 0);
      }
      const d = out.distanceTo(from);
      if (d < 0.6 || d > far || Math.abs(out.y - from.y) > 2.5) continue;
      if (out.y - world.height(out.x, out.z) < 0.8 || !a.clear(out) || world.blocked(from, out) || world.crowd(out, bird) < 0.5) continue;
      return true;
    }
    return false;
  };
  const glean = () => {
    if (!at.post || !leaves(to, look)) return false;
    a.fly({ at: to.clone(), q: frame(look, UP, q).clone(), rise: 0, floor: world.height }, 'glean', at.post, 0.4 + r() * 0.9);
    bird.doing = 'flying out to the leaves of a bough';
    return true;
  };

  // the snap: on the wing a moment at the end of the sally, the bill open and then shut on it
  const snap = {
    wary: false,
    enter(a, from) { a.now.post = from; a.now.time = 0.1 + r() * 0.12; a.now.whole = a.now.time; bird.aloft = true; },
    step(a, dt) {
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.y += 0.4 * dt * Math.sin(world.clock * 9);
      Object.assign(bird.want, { pitch: 0.5, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.1, droop: 0,
        gape: now.time > now.whole * 0.4 ? 0.9 : 0.05, head: { yaw: 0, pitch: 0.2, roll: 0 }, tail: { pitch: 0.3, fan: 0.5, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = 'snapping an insect from the air';
      if (now.time > 0) return;
      if (!settle(now.post)) now.time = 0.4;
    },
  };
  // the hover-glean: at the leaves on beating wings, picking at them
  const hovering = {
    wary: false,
    enter(a, from, time) { a.now.post = from; a.now.time = time; a.now.base = bird.at.clone(); bird.aloft = true; },
    step(a, dt) {
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.copy(now.base); bird.at.y += 0.01 * Math.sin(world.clock * 11);
      Object.assign(bird.want, { pitch: 0.75, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.12, droop: 0,
        gape: Math.sin(world.clock * 19) > 0.6 ? 0.6 : 0.05, head: { yaw: 0, pitch: -0.15, roll: 0 }, tail: { pitch: 0.35, fan: 0.5, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = 'hovering at the leaves, picking insects off them';
      if (now.time > 0) return;
      if (!settle(now.post)) now.time = 0.4;
    },
  };

  const roost = {
    wary: false,
    enter(a, post) { at.post = post; },
    step(a) {
      if (world.day >= 0.08) { a.to('perch', at.post, 0.4); return; }
      sit({ yaw: 0, pitch: 0.05, roll: 0 }, { pitch: (at.post && at.post.flat ? rest.pitch * 0.8 : rest.pitch) + 0.1 }); bird.doing = 'roosting on its perch';
    },
  };

  return {
    activities: { perch, snap, glean: hovering, roost },
    // Flushed: to a post of its own clear of the walker, near its own, or farther; or nowhere near.
    refuge() {
      const one = pick(way.reach * 1.5);
      return one ? go(one, 'flying to another perch') : false;
    },
    // where it is when it comes: on a post of its home that the walker is not near, and it flies in if they could see it
    // be there from nowhere
    begin() {
      const night = world.day < 0.08, posts = home.posts.filter((one) => world.free(one.point, bird, 0.6) && a.clear(one.point));
      if (!posts.length) { bird.left = night ? Infinity : 6 + r() * 10; return; }
      const post = posts[Math.floor(r() * posts.length)];
      a.to(night ? 'roost' : 'perch', post, 0.6);
      if (night) { at.post = post; bird.at.copy(post.point); facing(post, bird.q); return; }
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.1, floor: world.height }, 'perch', post, 0.6)) bird.left = 4 + r() * 8;
      }
    },
  };
}

// The places of the wood a flycatcher sits on, within `range` of a site, of the kinds the way asks for, between its
// heights above the ground (its boughs and twigs no higher than `boughs`, if it gives that) and in air as open as it
// likes (`air`):
//   stub    the stub of a broken limb on a standing trunk (2.5 to 13 m up it: life/habitat.js)
//   stump   the tip of the tallest splinter a broken stump ends in
//   log     the back of a log, a quarter, a half and three quarters of the way along it
//   snag    the tip of the tallest splinter a snag ends in
//   bough   a limb of any tree that hands its limbs over (life/habitat.js: two places on each)
//   sprig   a twig of a plant that has no trunk, a willow or a vine maple (plants/build.js `perch.sprigs`), which
//           life/habitat.js does not read: read here from the plant's own place, and only in its upper part (the
//           twigs above the middle of the plant's twigs' heights, `UPPER`), where a bird is on the outside of it
// `trees` is every tree whose boughs are read (life/habitat.js `leafy`), for the twigs.
const SPRIG = 0.004;                      // a twig's radius (m), which no plant gives
const UPPER = 0.5;                        // a twig is taken above this share of the way from the plant's lowest twig to its highest
const p_ = spot();
// the highest point round the last ring of a trunk: the tallest splinter of a broken end
const crestOf = (place, out) => {
  const tube = place.perch.trunk, last = tube.rings - 1;
  let best = -Infinity;
  for (let k = 0; k < 12; k += 1) { onTube(place, tube, last, k / 12, p_); if (p_.point.y > best) { best = p_.point.y; out.copy(p_.point); } }
  return out;
};
const postsAround = (habitat, way, x, z, trees) => {
  const out = [], [lo, hi] = way.heights, [air0, air1] = way.air || [0, 1], kinds = way.kinds, high = way.boughs ?? hi;
  const add = (point, props, top = hi) => {
    const h = point.y - habitat.height(point.x, point.z), air = habitat.open(point.x, point.z);
    if (h < lo || h > top || air < air0 || air > air1) return;
    out.push({ point: point.clone(), up: UP, h, ...props });
  };
  if (kinds.includes('stub')) for (const stub of habitat.stubsNear(x, z, way.range)) add(stub.point, { along: stub.along, radius: stub.radius, kind: 'stub' });
  if (kinds.includes('stump')) for (const s of habitat.stumps) if (Math.hypot(s.x - x, s.z - z) < way.range) add(s.point, { radius: 0.025, kind: 'stump' });
  if (kinds.includes('log')) {
    for (const l of habitat.logs) {
      if (Math.hypot(l.x - x, l.z - z) > way.range) continue;
      for (const share of [0.25, 0.5, 0.75]) { const one = l.on(share, spot()); add(one.point, { kind: 'log', flat: true }); }
    }
  }
  if (kinds.includes('snag')) {
    for (const t of habitat.trunksNear(x, z, way.range)) if (t.kind === 'snag' && t.perch.trunk) add(crestOf(t, new THREE.Vector3()), { radius: 0.03, kind: 'snag' });
  }
  if (kinds.includes('bough') || kinds.includes('sprig')) {
    for (const tree of trees) {
      if (Math.hypot(tree.x - x, tree.z - z) > way.range) continue;
      if (kinds.includes('bough')) for (const one of habitat.perchesOf(tree)) add(one.point, { along: one.along, radius: one.radius, kind: 'bough' }, high);
      if (kinds.includes('sprig') && !tree.place.perch.trunk) {
        const sprigs = tree.place.perch.sprigs || [];
        let low = Infinity, top = -Infinity;
        for (const one of sprigs) { low = Math.min(low, one[1]); top = Math.max(top, one[1]); }
        for (const one of sprigs) {
          if (one[1] < low + (top - low) * UPPER) continue;
          const point = new THREE.Vector3(one[0], one[1], one[2]).applyMatrix4(tree.place.matrix);
          const along = new THREE.Vector3(one[3], one[4], one[5]).applyQuaternion(tree.place.yaw).normalize();
          point.y += SPRIG * 0.96;
          add(point, { along, radius: SPRIG, kind: 'sprig' }, high);
        }
      }
    }
  }
  return out;
};

// Where a home's middle may be: wherever there is one of the things the way sits on, within `homeOff` of the walk, in
// air near as open as it likes.
const sitesOf = (habitat, way, trees) => {
  const sites = [], kinds = way.kinds, [air0, air1] = way.air || [0, 1];
  const take = (off, x, z) => { if (off < way.homeOff) { const air = habitat.open(x, z); if (air > air0 - 0.15 && air < air1 + 0.15) sites.push([x, z]); } };
  if (kinds.includes('stub')) for (const stub of habitat.stubs) take(stub.off, stub.point.x, stub.point.z);
  if (kinds.includes('stump')) for (const s of habitat.stumps) take(s.off, s.x, s.z);
  if (kinds.includes('log')) for (const l of habitat.logs) take(l.off, l.x, l.z);
  if (kinds.includes('snag')) for (const t of habitat.trunks) if (t.kind === 'snag') take(t.off, t.foot.x, t.foot.z);
  if (kinds.includes('bough') || kinds.includes('sprig')) for (const tree of trees) if (kinds.includes('bough') || !tree.place.perch.trunk) take(tree.off, tree.x, tree.z);
  return sites;
};

export default {
  // what a flycatcher's way holds besides what every way has (life/families/index.js)
  fields: {
    homeOff: 'number',                              // how far from the walk (m) the middle of its range may be
    range: 'number', reach: 'number',               // the radius (m) of its range; how far it goes to a post near its own
    apart: 'number',                                // no nearer than this (m) to another of its kind's home
    need: 'number',                                 // the posts a home must have, at the least
    kinds: list('string', 1),                       // what it sits on: stub, stump, log, snag, bough, sprig (above)
    heights: nums(2),                               // the heights (m) above the ground that its posts lie between
    boughs: optional('number'),                     // no bough or twig higher than this above the ground (m)
    air: optional(nums(2)),                         // the range of how open the air is (0 under the wood, 1 in the clear) at a post
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    spell: nums(2),                                 // seconds it is about, in one spell, before it goes
    stay: nums(2),                                  // seconds on one post before it moves to another of its own accord
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    sally: { every: nums(2), reach: nums(2), rise: nums(2) },     // seconds between sallies; how far out (m); how far up or down into the air (m, least and most)
    glean: 'number',                                // the share of its sallies that go to the leaves of a bough, to hover there (0: none)
    back: 'number',                                 // the chance it comes back to the post it left
    flick: optional(nums(2)),                       // seconds between its wing and tail flicks, if it flicks
    wag: optional('number'),                        // seconds its tail takes to come down again after a flick, for one that wags it slowly
    watching: 'string',
    // What it says: how often (seconds between), how long (s, the length of what is played for it), how far it carries
    // (m), the words of the card; and when its bill is open while it says it: at the notes of its recording (`notes`:
    // [from, until] seconds into it), or by turns, `rate` times a second.
    call: { every: nums(2), time: 'number', rate: 'number', reach: 'number', doing: 'string', notes: optional(list(nums(2))) },
    song: optional({ chance: 'number', time: 'number', rate: 'number', reach: 'number', doing: 'string', notes: optional(list(nums(2))) }),
  },
  act: (way) => (bird, world) => live(bird, world, way, sallier),
  // a stretch of the wood within `homeOff` of the walk with `need` posts of the right kind and height, and no other
  // of its kind's home near
  home: (way) => (habitat, r, taken = []) => {
    const trees = habitat.leafy || [], sites = sitesOf(habitat, way, trees);
    for (let tries = 0; tries < 30 && sites.length; tries += 1) {
      const [x, z] = sites[Math.floor(r() * sites.length)];
      if (taken.some((h) => h && Math.hypot(h.x - x, h.z - z) < way.apart)) continue;
      const posts = postsAround(habitat, way, x, z, trees);
      if (posts.length >= way.need) return { x, z, posts };
    }
    return null;
  },
};
