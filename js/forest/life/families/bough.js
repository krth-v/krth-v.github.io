import * as THREE from 'three';
import { onLimb } from '../perch.js';
import { frame, UP, spot } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums } from '../bodies.js';

// Birds of the boughs, which go about as a pair: the Chestnut-backed Chickadee and the Golden-crowned Kinglet. Each
// is only ever one of a visit's own. A pair goes through the wood together: its home is one thing both of them have
// (`bird.home`: the tree the pair is at now, which either may lead on from, and the other follows), and when one of
// them has had enough of a part of the wood the other goes too. (One the walker puts up off out of sight goes alone,
// and comes back to where its mate is: so a kind of this family is never put up for good, its way's `gone` is 0. One
// that was, moved on to another part of the valley alone, and its mate stayed where it was.)
//
// From what was read (the species' sheets): both feed in conifers, hopping along twigs among the foliage; the
// chickadee hangs upside down from boughs and now and then hovers; the kinglet hovers at the tips of twigs, hangs
// under them, and flicks its wings; both go about in pairs in May, and both call often, thin and high. The agent's
// own: every distance, time and chance below; how high each works (the sources have the kinglet mostly high in the
// crowns: here it is on the boughs a walker can see); and how near either lets a walker come.
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then flits to a bough clear of them, or on to the next tree, or is off.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _c = new THREE.Vector3();

// Does a tree's own stem stand between two places in or by it, seen from above: its axis at the height of the
// middle of the line (a trunk leans), and its widest reach there with a little more for the bird? For a flit from
// bough to bough: the world's test (world.blocked) knows the trunks a bird could climb, and a pole's stem is not
// one of them. A tree with no trunk (a willow, a vine maple: limbs alone), or a line over its top, has none
// between. (`place`: a tree's, as life/perch.js `standing` makes it. The foliage's birds ask this too.)
export function stemBetween(place, a, b) {
  const hs = place.heights, ax = place.axis, h = (a.y + b.y) / 2 - place.foot.y;
  if (!hs || hs.length < 2 || h > hs[hs.length - 1]) return false;
  let k = 0;
  while (k < hs.length - 2 && hs[k + 1] < h) k += 1;
  const f = clamp((h - hs[k]) / Math.max(hs[k + 1] - hs[k], 1e-6), 0, 1);
  _c.set(ax[k].x + (ax[k + 1].x - ax[k].x) * f, 0, ax[k].z + (ax[k + 1].z - ax[k].z) * f).applyQuaternion(place.yaw).multiplyScalar(place.scale).add(place.foot);
  const dx = b.x - a.x, dz = b.z - a.z, len2 = dx * dx + dz * dz;
  if (len2 < 1e-6) return false;
  const t = clamp(((_c.x - a.x) * dx + (_c.z - a.z) * dz) / len2, 0, 1);
  return Math.hypot(a.x + dx * t - _c.x, a.z + dz * t - _c.z) < (ax[k].reach + (ax[k + 1].reach - ax[k].reach) * f) * place.scale + 0.05;
}

function bough(a) {
  const { bird, world, way, r } = a, home = bird.home;                // home: { tree, last, drift, count, quota, leaving }, the pair's
  const rest = bird.sheet.poses.perched, q = new THREE.Quaternion(), p = spot(), up = new THREE.Vector3();
  const mid = new THREE.Vector3(), across = new THREE.Vector3(), face = new THREE.Vector3(), over = new THREE.Vector3();
  const stay = () => way.stay[0] + r() * (way.stay[1] - way.stay[0]);
  // where it is (kept across its activities): on a limb of `perch`, `share` of the way along it, facing `side`
  const at = { perch: null, share: 0, side: r() < 0.5 ? 1 : -1, radius: 0.01 };
  let until = 0, calls = 2 + r() * way.call.every[1], flick = 1 + r() * 2, again = 0;

  // A place on a limb: `sh` of the way along it, across it and facing `sd`, `sw` radians of the way round it (half
  // a turn is hanging under it). Fills `pos` and `quat`, leaves the bird's own up in `up`, and returns the limb's radius.
  const place = (perch, sh, sd, sw, pos, quat) => {
    const rad = onLimb(perch.tree.place, perch.tree.limbs, perch.tube, sh, p);
    mid.copy(p.point); mid.y -= rad * 0.96;
    across.crossVectors(p.along, UP).normalize().multiplyScalar(sd);
    over.copy(UP).addScaledVector(p.along, -p.along.y).normalize();                 // up, square to the limb
    face.copy(across).multiplyScalar(Math.cos(sw)).addScaledVector(over, -Math.sin(sw));
    up.copy(over).multiplyScalar(Math.cos(sw)).addScaledVector(across, Math.sin(sw));
    pos.copy(mid).addScaledVector(up, rad * 0.96);
    frame(face, up, quat);
    return rad;
  };
  const settle = (swing) => { at.radius = place(at.perch, at.share, at.side, swing, bird.at, bird.q); };
  const sit = (head, extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
    head, tail: { ...rest.tail }, feet: { mode: 'grip', round: Math.max(0.003, at.radius) } }, extra);
  // A perch on a tree's boughs: free, low enough to be seen from the walk, clear of the walker; one it can fly to
  // from `from` with no trunk in the way (that tree's own stem and the stem of the tree it is in, most of all: a
  // flit to the far side of its tree went through it) before any other, and of those one the walker has no trunk in
  // front of before any other. (`from`: where it is, or null when it is nowhere yet, as it comes.)
  const pick = (tree, from = bird.at) => {
    const all = world.perchesOf(tree).filter((one) => one !== at.perch && one.above <= way.high && world.free(one.point, bird, 0.3) && a.clear(one.point));
    const own = from && at.perch && at.perch.tree !== tree ? at.perch.tree.place : null;
    const reach = from ? all.filter((one) => !stemBetween(tree.place, from, one.point) && !(own && stemBetween(own, from, one.point)) && !world.blocked(from, one.point)) : all, near = reach.length ? reach : all;
    const open = near.filter((one) => !world.blocked(world.eye, one.point)), some = open.length ? open : near;
    return some.length ? some[Math.floor(r() * some.length)] : null;
  };
  // off to a bough, and onto it
  const fly = (perch, doing) => {
    const sd = r() < 0.5 ? 1 : -1, to = new THREE.Vector3();
    place(perch, perch.share, sd, 0, to, q);
    a.fly({ at: to, q: q.clone(), rise: 0.1, floor: world.height }, 'perch', perch, perch.share, sd);
    if (doing) bird.doing = doing;
    return true;
  };
  // The tree the pair goes to next: one near by with boughs low enough, onwards the way the pair is drifting
  // (which is turned about where the wood runs out, or the walk is left too far behind).
  const onward = () => {
    const tree = home.tree;
    for (let tries = 0; tries < 2; tries += 1) {
      const near = world.leafyNear(tree.x, tree.z, 13, []).filter((t) => t !== tree && t !== home.last && t.off < way.off && world.perchesOf(t).some((one) => one.above <= way.high));
      let best = null, most = 0.1;
      for (const t of near) {
        const d = Math.hypot(t.x - tree.x, t.z - tree.z) || 1, score = ((t.x - tree.x) * Math.cos(home.drift) + (t.z - tree.z) * Math.sin(home.drift)) / d + r() * 0.9 - Math.abs(d - 6) * 0.04;
        if (score > most) { most = score; best = t; }
      }
      if (best) return best;
      home.drift += Math.PI * (0.7 + r() * 0.6);
    }
    return null;
  };
  // the pair has had enough of this part of the wood: for a while, or for good
  const done = () => {
    const seconds = r() < 0.3 ? Infinity : a.awhile();
    if (!a.leave(seconds)) return false;
    home.leaving = { seconds };
    return true;
  };

  const perch = {
    enter(a, one, share, side, wait = 0.25 + r() * 0.5) {
      at.perch = one; at.share = share; at.side = side;
      Object.assign(a.now, { swing: 0, under: false, wait, hops: 0, dir: 1, hop: null, follow: null, calling: 0, singing: false, flicking: 0, peck: 0, look: 0,
        head: { yaw: 0, pitch: rest.head ? rest.head.pitch : 0.05, roll: 0 } });
      settle(0);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', now.swing); return; }
      now.wait -= dt; until -= dt; calls -= dt; flick -= dt; now.look -= dt; again -= dt;
      if (now.look < 0) { now.look = 0.2 + r() * 0.6; now.head = { yaw: (r() - 0.5) * 2.4, pitch: (r() - 0.4) * 0.6, roll: (r() - 0.5) * 0.4 }; }

      // it swings round its limb to hang under it, and back; it hops sideways along it
      const want = now.under ? Math.PI : 0;
      if (now.swing !== want) { now.swing += clamp(want - now.swing, -dt * 12, dt * 12); if (Math.abs(want - now.swing) < 1e-3) now.swing = want; }
      if (now.hop) { const h = now.hop; h.t = Math.min(1, h.t + dt / 0.11); at.share = h.a + (h.b - h.a) * h.t; }
      settle(now.swing);
      if (now.hop) {
        const h = now.hop;
        bird.at.addScaledVector(up, 0.01 * Math.sin(Math.PI * h.t));
        sit(now.head, { lift: rest.lift + 0.14 * Math.sin(Math.PI * h.t) });
        if (h.t >= 1) { now.hop = null; now.wait = now.hops > 0 ? 0.05 + r() * 0.1 : 0.25 + r() * 0.9; }
        return;
      }

      // its mate has gone: so does it (with no way out found, it looks again in a moment and not in every frame)
      if (home.leaving && again <= 0) { if (a.leave(home.leaving.seconds)) return; again = 1; }
      if (now.peck > 0) {
        now.peck -= dt;
        sit({ yaw: 0.5 * Math.sin(now.peck * 31), pitch: now.under ? 0.5 : -0.7, roll: 0 }, { pitch: rest.pitch - (now.under ? 0.05 : 0.3) });
        bird.doing = now.under ? 'hanging under the bough, picking at it' : 'picking at the needles';
        if (now.peck <= 0 && now.under) { now.under = false; now.wait = 0.35; }
        return;
      }
      if (now.calling > 0) {
        now.calling -= dt;
        sit({ yaw: now.head.yaw * 0.4, pitch: now.singing ? 0.4 : 0.25, roll: 0 }, { gape: (now.calling * (now.singing ? way.song.rate : way.call.rate)) % 1 > 0.5 ? 0.5 : 0.08 });
        bird.doing = now.singing ? way.song.doing : way.call.doing;
        return;
      }
      // the pair has moved on: after a moment it follows
      if (home.tree !== at.perch.tree) {
        if (now.follow == null) now.follow = 0.4 + r() * 2.6;
        now.follow -= dt;
        if (now.follow <= 0) { const one = pick(home.tree); now.follow = null; if (one) { until = stay(); fly(one, 'following its mate through the trees'); return; } }
      } else if (until < 0 && !now.under) {
        // long enough in this tree: it leads on to the next, or the pair has had enough
        const next = home.count >= home.quota ? null : onward(), one = next && pick(next);
        if (one) { home.last = home.tree; home.tree = next; home.count += 1; until = stay(); fly(one, 'moving on through the trees'); return; }
        if (done()) return;
        until = 4 + r() * 6;
      }
      sit(now.head);
      if (now.flicking > 0) { now.flicking -= dt; Object.assign(bird.want, { spread: 0.24, flap: 0.4 }); bird.snap = true; }
      else if (way.flick && flick < 0) { flick = 0.7 + r() * 2.4; now.flicking = 0.12; }
      if (now.wait > 0) { if (now.hops <= 0) bird.doing = now.under ? 'hanging under the bough' : 'on a bough, looking about'; return; }
      if (calls < 0) {
        // its call; or, for a kind that has one here, now and then its song
        now.singing = !!way.song && r() < way.song.chance;
        calls = way.call.every[0] + r() * (way.call.every[1] - way.call.every[0]); now.calling = now.singing ? way.song.time : way.call.time;
        world.say(bird, now.singing ? 'song' : 'call', now.singing ? way.song.reach : way.call.reach);
        return;
      }
      if (now.hops <= 0) {
        // what it does next, by chance: hang under the bough, hover at its tip, flit to another bough, pick at the
        // needles, turn about; or (and where the one drawn cannot be done) hop along the limb. (Each fell through to
        // the next: a chickadee that could not hang where it was tried to hover with the chance of both, 0.24 where
        // its way says 0.04.)
        let k = r();
        if ((k -= way.hang) < 0) { if (at.share >= 0.5 && at.radius < 0.03) { now.under = true; now.peck = 1 + r() * 1.8; now.wait = 0.2; return; } }
        else if ((k -= way.hover) < 0) {
          // out to the bough's tip, to hover there (in clear air: not over the ground's very face, clear of the
          // walker, not beyond another trunk)
          onLimb(at.perch.tree.place, at.perch.tree.limbs, at.perch.tube, 0.999, p);
          const base = p.point.clone().addScaledVector(p.along, 0.3 + r() * 0.3); base.y -= 0.12 + r() * 0.15;
          if (world.crowd(base, bird) > 0.4 && base.y - world.height(base.x, base.z) > 0.8 && a.clear(base) && !world.blocked(at.perch.point, base)) {
            a.fly({ at: base, q: frame(p.along.clone().negate().setY(0), UP, q).clone(), rise: 0, floor: world.height }, 'hover', base, 0.5 + r() * 0.8);
            bird.doing = 'flying out to the tip of the bough';
            return;
          }
        }
        else if ((k -= 0.2) < 0) { const one = pick(at.perch.tree); if (one) { fly(one, 'flitting to another bough'); return; } }
        else if ((k -= 0.25) < 0) { now.peck = 0.3 + r() * 0.6; now.wait = 0.15; return; }
        else if ((k -= 0.1) < 0) { at.side = -at.side; now.wait = 0.2 + r() * 0.3; return; }
        now.hops = 1 + Math.floor(r() * 4); now.dir = r() < 0.5 ? 1 : -1;
      }
      // a hop sideways along the limb (not off its end, not onto another bird, not towards the walker past where it
      // would flush)
      now.hops -= 1;
      const step = (0.03 + r() * 0.04) / Math.max(0.5, at.perch.length);
      let b = at.share + step * now.dir;
      if (b > 0.9 || b < 0.18) { now.dir = -now.dir; b = at.share + step * now.dir; }
      onLimb(at.perch.tree.place, at.perch.tree.limbs, at.perch.tube, b, p);
      if (world.crowd(p.point, bird) < 0.25 || !a.clear(p.point, 0)) { now.hops = 0; now.wait = 0.3; return; }
      now.hop = { a: at.share, b, t: 0 };
      bird.doing = 'hopping along a bough';
    },
  };

  const hover = {
    wary: false,
    enter(a, base, time) { a.now.base = base; a.now.time = time; bird.aloft = true; },
    step(a, dt) {
      // at the tip of a bough, on beating wings, picking at it
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.copy(now.base); bird.at.y += 0.01 * Math.sin(world.clock * 11);
      Object.assign(bird.want, { pitch: 0.8, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.12, droop: 0, gape: 0,
        head: { yaw: 0, pitch: -0.4, roll: 0 }, tail: { pitch: 0.4, fan: 0.5, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = 'hovering at the tip of a bough';
      if (now.time > 0) return;
      // back onto a bough: another one, or the one it left if no other bird has taken it and it is clear of the
      // walker; if there is none, it goes
      const one = pick(at.perch.tree) || (world.free(at.perch.point, bird, 0.3) && a.clear(at.perch.point) ? at.perch : null);
      if (one) fly(one, 'back onto a bough'); else if (!a.leave(a.awhile())) now.time = 0.4;
    },
  };

  const roost = {
    wary: false,
    enter(a, swing = 0) { a.now.swing = swing; },
    step(a, dt) {
      if (world.day >= 0.08) { a.to('perch', at.perch, at.share, at.side); return; }
      // (one that was hanging under its bough when night came swings back up onto it: it is not put there in one step)
      a.now.swing = Math.max(0, a.now.swing - dt * 12);
      settle(a.now.swing); sit({ yaw: 0, pitch: 0.05, roll: 0 }, { pitch: rest.pitch + 0.1 }); bird.doing = 'roosting on a bough';
    },
  };

  return {
    activities: { perch, hover, roost },
    // Flushed: to a bough of its tree clear of the walker; or on to the next tree, the pair's, which its mate then
    // follows it to; or nowhere near.
    refuge() {
      const one = pick(at.perch.tree);
      if (one) return fly(one, 'flitting off to another bough');
      const next = home.tree === at.perch.tree ? onward() : home.tree, there = next && pick(next);
      if (!there) return false;
      if (home.tree === at.perch.tree) { home.last = home.tree; home.tree = next; home.count += 1; }
      until = stay();
      return fly(there, 'moving on through the trees');
    },
    // where it is when it comes: on a bough of the tree the pair is at (a leaving that is over is over), and it
    // flies in to it if the walker could see it be there from nowhere
    begin() {
      if (home.leaving) { home.leaving = null; home.count = 0; home.quota = 3 + Math.floor(r() * 6); }
      const one = pick(home.tree, null);
      if (!one) { bird.left = 6 + r() * 10; return; }
      a.to('perch', one, one.share, at.side, 0.4);
      until = stay();
      if (world.day >= 0.08 && !a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.1, floor: world.height }, 'perch', one, one.share, at.side, 0.4)) bird.left = 4 + r() * 8;
      }
    },
  };
}

// A pair's home: a tree within `off` of the walk whose boughs come low enough to be seen (three perches no higher
// than `high`), and what the pair has between them: the tree they are at, the one before, the way they are
// drifting, how many trees they have worked and how many they will, and whether they have left.
const boughHome = (habitat, r, high, off) => {
  const near = habitat.leafy.filter((t) => t.off < off);
  for (let tries = 0; near.length && tries < 16; tries += 1) {
    const tree = near[Math.floor(r() * near.length)];
    if (habitat.perchesOf(tree).filter((one) => one.above <= high).length >= 3) return { x: tree.x, z: tree.z, tree, last: null, drift: r() * 6.283, count: 0, quota: 3 + Math.floor(r() * 6), leaving: null };
  }
  return null;
};

export default {
  // what a bough bird's way holds besides what every way has (life/families/index.js)
  fields: {
    homeOff: 'number', off: 'number',               // how far from the walk (m) its first tree, and the trees it moves on to
    high: 'number',                                 // no higher above its tree's foot than this (m)
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    stay: nums(2),                                  // seconds in one tree
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    hang: 'number', hover: 'number', flick: 'number',   // the chance it hangs under a bough, hovers at a tip; flicks its wings
    call: { every: nums(2), time: 'number', rate: 'number', reach: 'number', doing: 'string' },
    song: optional({ chance: 'number', time: 'number', rate: 'number', reach: 'number', doing: 'string' }),
  },
  act: (way) => (bird, world) => live(bird, world, way, bough),
  home: (way) => (habitat, r) => boughHome(habitat, r, way.high, way.homeOff),
};
