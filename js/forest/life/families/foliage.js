import * as THREE from 'three';
import { onLimb } from '../perch.js';
import { frame, UP, spot } from '../agents.js';
import { live, WARY } from '../behave.js';
import { nums, test } from '../bodies.js';
import { stemBetween } from './bough.js';

// Birds of the foliage: the warblers of the trees (Townsend's, the Yellow-rumped, the Black-throated Gray, the Hermit)
// and the Warbling Vireo. Each is one of a visit's own. It works through the foliage of a tree, hopping along its
// limbs, picking at the needles and the leaves, reaching, now and then hanging under a twig, hovering at a bough's
// tip to pick at it, or flying out after an insect and back; it sings, now from where it is and now from high in the
// tree, a bout of songs; and it moves on to the next tree, steadily, and in the end is gone.
//
// It lives one of two ways. Most are birds that live here: one has a home, a stretch of the wood near the walk
// (`range` round a tree), which it works tree to tree, drifting one way and turning where the wood or its range
// runs out, until its spell is over and it goes, for a while or for good. On a day of the migrants' wave
// (life/wave.js) the wave's are one party: such a bird's home has `party` set, and it keeps to the party (within
// `party.radius` of `party.at`, seen from above), works the trees there, the ones ahead of the party's drift before
// the ones behind, flies on after it when it has fallen behind, and leaves for good, each at its own moment, when
// the party moves on (`party.gone`). One the walker puts off out of sight comes back to the party, wherever it is
// then.
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then flits to a bough clear of them, or on to the next tree, or is off.
//
// From what was read (each kind's file names its sources, all of them read through a tool that returns a summary of a
// page): Townsend's and the Hermit feed high in conifers, gleaning the foliage as they climb about, now and then
// hovering, and fly out after flying insects; the Hermit moves out from the trunk to the tips of the branches and
// hangs upside down to glean the undersides of twigs; the Yellow-rumped is quick and nervous and often flies out
// beyond the foliage in a loop after an insect; the Black-throated Gray gleans while climbing about the limbs, hovers a
// moment, and is not wary when it is low; the vireo works the leaves of broad-leaved trees slowly and deliberately,
// hovers a moment to pick the undersides of leaves, and sings again and again all day. In migration Townsend's, the
// Hermit and the Black-throated Gray go about in mixed flocks, and the Yellow-rumped in flocks of its own kind.
// The agent's own: every distance, time, chance and height below, how the moves are put together, and how the two
// kinds of tree are told apart.
//
// Heights. The sources put Townsend's and the Hermit high in conifers (Townsend's in the upper third of the canopy,
// Birds of the World has it): a bird there is a speck that no walker sees, and the habitat reads no bough above 17 m over a tree's foot (and, on the
// old terrace's tall hemlocks, none below 7 m). As with the chickadee and the kinglet, the gleaning is kept low
// enough to be seen from the walk (each kind's `low` to `high`, above its tree's foot: 1.8 to 7.5 m), and a bout of
// songs a little higher (`perch`: 8 to 9 m). Measured in the page on the busiest visit (2026-11-16, the walker on the
// walk 12 to 16 m from the bird, a close-up, the frame drawn with the bird and without it): at 2.6 to 8.9 m over the
// ground a close-up showed 0.15 to 0.23 of the bird; at 9.7 to 11.9 m, 0 to 0.07 of it (a frame of boughs or of a
// maple's leaves). The heights were lowered to these after that. Each kind's file says it is lower than its sources
// have it.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// The broad-leaved trees, by the layout's names (world/layout.js): the rest of the trees that hand over boughs are
// conifers. A bird's liking for one or the other is its way's `broad`.
const BROAD = new Set(['alder', 'maple', 'willow', 'vine', 'apple']);
const _o = new THREE.Vector3();

function foliage(a) {
  const { bird, world, way, r } = a, home = bird.home, party = home.party || null;
  const rest = bird.sheet.poses.perched, q = new THREE.Quaternion(), p = spot(), up = new THREE.Vector3();
  const mid = new THREE.Vector3(), across = new THREE.Vector3(), face = new THREE.Vector3(), over = new THREE.Vector3(), turned = new THREE.Vector3();
  const between = (range) => range[0] + r() * (range[1] - range[0]);
  const like = (tree) => (BROAD.has(tree.kind) ? way.broad : 1 - way.broad);
  // where it is (kept across its activities): on a limb of `perch`, `share` of the way along it, on its `side`,
  // turned `turn` radians from across it towards its end
  const at = { perch: null, share: 0, side: r() < 0.5 ? 1 : -1, radius: 0.01, turn: 0 };
  let tree = null, until = 0, spell = between(way.spell), again = 0, leaving = -1;
  let calls = between(way.call.every) * r(), songs = way.song ? between(way.song.every) * r() : Infinity, flick = way.flick > 0 ? way.flick * (0.3 + r()) : Infinity;
  const near = [];

  // Its own part of the wood: the party's middle, or its home; and how far it keeps from it, seen from above.
  const centre = () => (party ? party.at : home);
  const reach = () => (party ? party.radius : way.range);
  const from = (t) => Math.hypot(t.x - centre().x, t.z - centre().z);

  // A place on a limb: `sh` of the way along it, on side `sd`, turned `tw` from across it towards its end, swung `sw`
  // radians round it (half a turn is hanging under it). Fills `pos` and `quat`, leaves the bird's own up in `up`, and
  // returns the limb's radius.
  const place = (perch, sh, sd, sw, tw, pos, quat) => {
    const rad = onLimb(perch.tree.place, perch.tree.limbs, perch.tube, sh, p);
    mid.copy(p.point); mid.y -= rad * 0.96;
    across.crossVectors(p.along, UP).normalize().multiplyScalar(sd);
    over.copy(UP).addScaledVector(p.along, -p.along.y).normalize();                 // up, square to the limb
    turned.copy(across).multiplyScalar(Math.cos(tw)).addScaledVector(p.along, Math.sin(tw)).normalize();
    face.copy(turned).multiplyScalar(Math.cos(sw)).addScaledVector(over, -Math.sin(sw));
    up.copy(over).multiplyScalar(Math.cos(sw)).addScaledVector(turned, Math.sin(sw));
    pos.copy(mid).addScaledVector(up, rad * 0.96);
    frame(face, up, quat);
    return rad;
  };
  const settle = (swing) => { at.radius = place(at.perch, at.share, at.side, swing, swing ? 0 : at.turn, bird.at, bird.q); };
  const sit = (head, extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
    head, tail: { ...rest.tail }, feet: { mode: 'grip', round: Math.max(0.003, at.radius) } }, extra);

  // (the places of a list it can fly to from `from` with no trunk in the way, their tree's own stem and the stem of
  // the tree it is in most of all, a flit to the far side of its tree went through it: those if there are any, or
  // else the list as it is. `from`: where it is, or null when it is nowhere yet, as it comes)
  const within = (all, from) => {
    const own = from && at.perch ? at.perch.tree.place : null;
    const reach = from ? all.filter((one) => !stemBetween(one.tree.place, from, one.point) && !(own && own !== one.tree.place && stemBetween(own, from, one.point)) && !world.blocked(from, one.point)) : all;
    return reach.length ? reach : all;
  };
  // A perch in a tree: between `lo` and `hi` above its foot, free, clear of the walker, not the one it is on; one it
  // can fly to with no trunk in the way before any other, of those one the walker has no trunk in front of before
  // any other, and the outer of a limb's two places (the foliage is at the limbs' ends) twice as often as the inner.
  const pick = (t, lo = way.low, hi = way.high, from = bird.at) => {
    const all = within(world.perchesOf(t).filter((one) => one !== at.perch && one.above >= lo && one.above <= hi && world.free(one.point, bird, 0.3) && a.clear(one.point)), from);
    const open = all.filter((one) => !world.blocked(world.eye, one.point)), some = open.length ? open : all;
    if (!some.length) return null;
    let total = 0;
    for (const one of some) total += one.share > 0.5 ? 2 : 1;
    let k = r() * total;
    for (const one of some) { k -= one.share > 0.5 ? 2 : 1; if (k <= 0) return one; }
    return some[some.length - 1];
  };
  // the highest perch of a tree it would sing from (no higher than `perch`), one it can fly to with no trunk in the
  // way and then one the walker has no trunk in front of, before any other
  const song = (t) => {
    const all = within(world.perchesOf(t).filter((one) => one.above >= way.high * 0.6 && one.above <= way.perch && world.free(one.point, bird, 0.3) && a.clear(one.point)), bird.at);
    const open = all.filter((one) => !world.blocked(world.eye, one.point)), some = open.length ? open : all;
    let best = null;
    for (const one of some) if (!best || one.above + r() * 1.5 > best.above) best = one;
    return best;
  };
  // off to a perch, and onto it (into `landing`: gleaning, or singing)
  const fly = (perch, doing, landing = 'glean') => {
    const sd = r() < 0.5 ? 1 : -1, to = new THREE.Vector3();
    place(perch, perch.share, sd, 0, 0, to, q);
    a.fly({ at: to, q: q.clone(), rise: 0.1, floor: world.height }, landing, perch, perch.share, sd);
    if (doing) bird.doing = doing;
    return true;
  };

  // The next tree. With a party: one within its radius of where the party is now, ahead of its drift before behind
  // it, the nearer its middle the better. Living here: one near by within its range of home, onwards the way it is
  // drifting (turned about where its range or the wood runs out). Its own kind of tree before the other.
  const onward = () => {
    if (party) {
      world.leafyNear(party.at.x, party.at.z, party.radius, near);
      const c = Math.cos(party.heading), s = Math.sin(party.heading);
      let best = null, most = -Infinity;
      for (const t of near) {
        if (t === tree) continue;
        const dx = t.x - party.at.x, dz = t.z - party.at.z, d = Math.hypot(dx, dz) || 1;
        const score = like(t) * 1.2 + ((dx * c + dz * s) / party.radius) * 0.6 - (d / party.radius) * 0.5 + r() * 0.9;
        if (score > most) { most = score; best = t; }
      }
      return best;
    }
    for (let tries = 0; tries < 2 && tree; tries += 1) {
      world.leafyNear(tree.x, tree.z, 14, near);
      let best = null, most = 0.1;
      for (const t of near) {
        if (t === tree || t === home.last || from(t) > way.range) continue;
        const d = Math.hypot(t.x - tree.x, t.z - tree.z) || 1;
        const score = ((t.x - tree.x) * Math.cos(home.drift) + (t.z - tree.z) * Math.sin(home.drift)) / d + like(t) * 0.8 + r() * 0.9 - Math.abs(d - 7) * 0.04;
        if (score > most) { most = score; best = t; }
      }
      if (best) { home.last = tree; return best; }
      home.drift += Math.PI * (0.7 + r() * 0.6);
    }
    return null;
  };
  // a tree near the party's middle with a perch in it: where one that has fallen behind flies on to
  const follow = () => {
    world.leafyNear(party.at.x, party.at.z, party.radius * 0.7, near);
    near.sort((x, y) => from(x) - from(y));
    for (const t of near.slice(0, 6)) { const one = pick(t); if (one) { until = between(way.stay); return fly(one, 'flying on after the flock'); } }
    return false;
  };

  const glean = {
    enter(a, one, share, side, wait = 0.15 + r() * 0.4) {
      at.perch = one; at.share = share; at.side = side; at.turn = 0; tree = one.tree;
      Object.assign(a.now, { swing: 0, under: false, wait, hops: 0, dir: 1, hop: null, calling: 0, singing: false, flicking: 0, peck: 0, stretch: 0, look: 0,
        head: { yaw: 0, pitch: rest.head ? rest.head.pitch : 0.05, roll: 0 } });
      settle(0);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', now.swing); return; }
      now.wait -= dt; until -= dt; calls -= dt; songs -= dt; flick -= dt; now.look -= dt; again -= dt; spell -= dt;
      if (now.look < 0) { now.look = 0.15 + r() * 0.5; now.head = { yaw: (r() - 0.5) * 2.2, pitch: (r() - 0.45) * 0.8, roll: (r() - 0.5) * 0.5 }; }

      // it swings round its limb to hang under it, and back; it hops along it, turned the way it goes
      const want = now.under ? Math.PI : 0;
      if (now.swing !== want) { now.swing += clamp(want - now.swing, -dt * 12, dt * 12); if (Math.abs(want - now.swing) < 1e-3) now.swing = want; }
      if (now.hop) { const h = now.hop; h.t = Math.min(1, h.t + dt / 0.11); at.share = h.a + (h.b - h.a) * h.t; }
      settle(now.swing);
      if (now.hop) {
        const h = now.hop;
        bird.at.addScaledVector(up, 0.012 * Math.sin(Math.PI * h.t));
        sit(now.head, { lift: rest.lift + 0.14 * Math.sin(Math.PI * h.t) });
        if (h.t >= 1) { now.hop = null; now.wait = now.hops > 0 ? 0.04 + r() * 0.12 : between(way.hop); }
        return;
      }

      // the party has moved on out of the valley: it goes too, at its own moment; or it has fallen behind the party.
      // Living here, its spell is over. (With no way out found, it looks again in a moment and not in every frame.)
      if (party && party.gone) {
        if (leaving < 0) leaving = 0.3 + r() * 6;
        leaving -= dt;
        if (leaving <= 0 && again <= 0) { if (a.leave(Infinity)) return; again = 1; }
      } else if (party && !now.under && again <= 0 && from(tree) > party.radius) {
        if (follow()) return;
        // (nothing near the party to go to: off for a while, and back to it later)
        if (a.leave(a.awhile())) return;
        again = 1.5;
      } else if (!party && !now.under && spell < 0 && again <= 0) {
        if (a.leave(r() < way.gone ? Infinity : a.awhile())) return;
        again = 1.5;
      }
      if (now.peck > 0) {
        now.peck -= dt;
        sit({ yaw: 0.6 * Math.sin(now.peck * 29), pitch: now.under ? 0.6 : -0.75, roll: 0.2 * Math.sin(now.peck * 13) }, { pitch: rest.pitch - (now.under ? 0.05 : 0.3) });
        bird.doing = now.under ? way.doing.hang : way.doing.peck;
        if (now.peck <= 0 && now.under) { now.under = false; now.wait = 0.3; }
        return;
      }
      if (now.stretch > 0) {
        // it reaches out and down for something under the twig beside it, or up to one over it
        now.stretch -= dt;
        const down = now.dir > 0;
        sit({ yaw: 0.3 * now.dir, pitch: down ? -1.0 : 0.7, roll: 0 }, { pitch: rest.pitch + (down ? -0.45 : 0.25), lift: rest.lift + (down ? -0.1 : 0.25), lean: 0.25 * at.side });
        bird.doing = down ? 'reaching down to pick at a twig' : 'stretching up to pick at a twig';
        return;
      }
      if (now.calling > 0) {
        now.calling -= dt;
        const s = now.singing ? way.song : way.call;
        sit({ yaw: now.head.yaw * 0.4, pitch: now.singing ? 0.45 : 0.25, roll: 0 }, { gape: (now.calling * s.rate) % 1 > 0.5 ? 0.5 : 0.08 });
        bird.doing = s.doing;
        return;
      }
      // long enough in this tree: on to the next
      if (until < 0 && !now.under) {
        const next = onward(), one = next && pick(next);
        if (one) { until = between(way.stay); fly(one, party ? 'moving on through the trees with the flock' : 'moving on through the trees'); return; }
        until = 2 + r() * 4;
      }
      sit(now.head);
      if (now.flicking > 0) { now.flicking -= dt; Object.assign(bird.want, { spread: 0.2, flap: 0.35, tail: { ...rest.tail, fan: 0.35 } }); bird.snap = true; }
      else if (flick < 0) { flick = way.flick * (0.4 + r() * 1.2); now.flicking = 0.12; }
      if (now.wait > 0) { if (now.hops <= 0) bird.doing = now.under ? way.doing.hang : way.doing.look; return; }
      // a song: now and then a bout of them from high in a tree, and otherwise one from where it is
      if (songs < 0 && way.song) {
        songs = between(way.song.every);
        if (!now.under && r() < way.song.up) {
          const high = song(tree) || ((t) => t && song(t))(onward());
          if (high && high.above > at.perch.above + 1) { fly(high, 'flying up to sing', 'sing'); return; }
        }
        now.singing = true; now.calling = way.song.time;
        world.say(bird, 'song', way.song.reach);
        return;
      }
      if (calls < 0) {
        calls = between(way.call.every); now.singing = false; now.calling = way.call.time;
        world.say(bird, 'call', way.call.reach);
        return;
      }
      if (now.hops <= 0) {
        // what it does next, by chance: hang under the twig, hover at the bough's tip, fly out after an insect, flit
        // to another bough, pick at the needles, reach for a twig, turn about; or hop along the limb
        let k = r();
        if ((k -= way.hang) < 0) { if (at.share >= 0.45 && at.radius < 0.03) { now.under = true; now.peck = 0.8 + r() * 1.6; now.wait = 0.2; return; } }
        else if ((k -= way.hover) < 0) { if (hover()) return; }
        else if ((k -= way.sally) < 0) { if (sally()) return; }
        else if ((k -= 0.12) < 0) { const one = pick(tree); if (one) { fly(one, 'flitting to another bough'); return; } }
        else if ((k -= 0.22) < 0) { now.peck = 0.25 + r() * 0.6; now.wait = way.hop[0] * (0.3 + r()); return; }
        else if ((k -= 0.08) < 0) { now.stretch = 0.5 + r() * 0.6; now.dir = r() < 0.6 ? 1 : -1; now.wait = way.hop[0] * (0.3 + r()); return; }
        else if ((k -= 0.06) < 0) { at.side = -at.side; at.turn = 0; now.wait = 0.15 + r() * 0.3; return; }
        now.hops = 1 + Math.floor(r() * way.hops); now.dir = r() < 0.55 ? 1 : -1;
      }
      // a hop along the limb (not off its end, not onto another bird, not towards the walker past where it would flush)
      now.hops -= 1;
      const step = (0.04 + r() * 0.06) / Math.max(0.5, at.perch.length);
      let b = at.share + step * now.dir;
      if (b > 0.95 || b < 0.15) { now.dir = -now.dir; b = at.share + step * now.dir; }
      onLimb(at.perch.tree.place, at.perch.tree.limbs, at.perch.tube, b, p);
      if (world.crowd(p.point, bird) < 0.25 || !a.clear(p.point, 0)) { now.hops = 0; now.wait = 0.3; return; }
      now.hop = { a: at.share, b, t: 0 };
      at.turn = 0.9 * now.dir;
      bird.doing = way.doing.hop;
    },
  };

  // out to the bough's tip, to hover there (in clear air: not over the ground's very face, clear of the walker, not
  // beyond another trunk), at its end or under it
  const hover = () => {
    onLimb(at.perch.tree.place, at.perch.tree.limbs, at.perch.tube, 0.999, p);
    const base = p.point.clone().addScaledVector(p.along, 0.2 + r() * 0.35); base.y -= 0.1 + r() * 0.25;
    if (world.crowd(base, bird) > 0.4 && base.y - world.height(base.x, base.z) > 0.8 && a.clear(base) && !world.blocked(at.perch.point, base)) {
      a.fly({ at: base, q: frame(_o.copy(p.along).negate().setY(0), UP, q).clone(), rise: 0, floor: world.height }, 'hover', base, 0.5 + r() * 0.9);
      bird.doing = 'flying out to the tip of the bough';
      return true;
    }
    return false;
  };
  // out after an insect: a short flight to a point in the air outward from the tree (away from its trunk), up or
  // down a little, in clear air, clear of the walker, no trunk in the way; a snap there, and back
  const sally = () => {
    const outward = Math.atan2(bird.at.z - tree.place.foot.z, bird.at.x - tree.place.foot.x), to = new THREE.Vector3();
    for (let tries = 0; tries < 6; tries += 1) {
      const th = outward + (r() - 0.5) * 1.8, d = between(way.reach), dy = (r() - 0.4) * 1.4;
      to.set(bird.at.x + Math.cos(th) * d, bird.at.y + dy, bird.at.z + Math.sin(th) * d);
      if (to.y - world.height(to.x, to.z) < 1.2 || !a.clear(to, 2) || world.blocked(bird.at, to) || world.crowd(to, bird) < 0.8) continue;
      _o.subVectors(to, bird.at).setY(0);
      if (_o.lengthSq() < 1e-6) _o.set(1, 0, 0);
      a.fly({ at: to, q: frame(_o, UP, q).clone(), rise: 0, floor: world.height }, 'snap', at.perch);
      bird.doing = 'flying out after an insect';
      return true;
    }
    return false;
  };

  const hoverAct = {
    wary: false,
    enter(a, base, time) { a.now.base = base; a.now.time = time; bird.aloft = true; },
    step(a, dt) {
      // at the tip of a bough, on beating wings, picking at it
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.copy(now.base); bird.at.y += 0.012 * Math.sin(world.clock * 11);
      Object.assign(bird.want, { pitch: 0.8, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.12, droop: 0, gape: 0,
        head: { yaw: 0, pitch: -0.4, roll: 0 }, tail: { pitch: 0.4, fan: 0.6, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = way.doing.hover;
      if (now.time > 0) return;
      // back onto a bough: another one, or the one it left if no other bird has taken it and it is clear of the
      // walker; if there is none, it goes for a while
      const one = pick(tree) || (world.free(at.perch.point, bird, 0.3) && a.clear(at.perch.point) ? at.perch : null);
      if (one) fly(one, 'back onto a bough'); else if (!a.leave(a.awhile())) now.time = 0.4;
    },
  };

  // the snap: on the wing a moment at the end of the sally, bill open
  const snap = {
    wary: false,
    enter(a, back) { a.now.back = back; a.now.time = 0.1 + r() * 0.15; bird.aloft = true; },
    step(a, dt) {
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.y += 0.4 * dt * Math.sin(world.clock * 9);
      Object.assign(bird.want, { pitch: 0.5, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.1, droop: 0, gape: 0.9,
        head: { yaw: 0, pitch: 0.2, roll: 0 }, tail: { pitch: 0.3, fan: 0.7, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = 'snapping an insect from the air';
      if (now.time > 0) return;
      // back to the bough it left, if it is free and clear of the walker, or to another of the tree's; none, and it goes
      const back = now.back && r() < 0.6 && world.free(now.back.point, bird, 0.3) && a.clear(now.back.point) ? now.back : pick(tree);
      if (back) fly(back, 'back into the foliage');
      else if (!a.leave(a.awhile())) now.time = 0.4;
    },
  };

  // A bout of songs from high in a tree: it sits up, head raised, and sings, a few seconds between songs; then down
  // into the foliage again.
  const sing = {
    enter(a, one, share, side) {
      at.perch = one; at.share = share; at.side = side; at.turn = 0; tree = one.tree;
      Object.assign(a.now, { songs: Math.round(between(way.song.bout)), gap: 0.4 + r() * 1.2, calling: 0, look: 0, head: { yaw: 0, pitch: 0.2, roll: 0 } });
      settle(0);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', 0); return; }
      now.gap -= dt; now.look -= dt; until -= dt; spell -= dt;
      if (now.calling > 0) {
        now.calling -= dt;
        sit({ yaw: now.head.yaw * 0.3, pitch: 0.5, roll: 0 }, { pitch: rest.pitch - 0.08, gape: (now.calling * way.song.rate) % 1 > 0.5 ? 0.55 : 0.1 });
        bird.doing = way.song.doing;
        return;
      }
      if (now.look < 0) { now.look = 0.5 + r() * 1.2; now.head = { yaw: (r() - 0.5) * 2, pitch: 0.1 + r() * 0.3, roll: 0 }; }
      sit(now.head, { pitch: rest.pitch - 0.06 });
      bird.doing = 'on a high perch, between songs';
      // the bout is over, or the party has moved on, or has gone on without it: down into the foliage again
      if (now.songs <= 0 || (party && (party.gone || from(tree) > party.radius))) {
        if (now.gap > 0 && !(party && party.gone)) return;
        const one = pick(tree) || ((t) => t && pick(t))(onward());
        if (one) fly(one, 'down into the foliage again'); else a.to('glean', at.perch, at.share, at.side, 0.3);
        return;
      }
      if (now.gap > 0) return;
      now.songs -= 1; now.calling = way.song.time; now.gap = between(way.song.gap);
      world.say(bird, 'song', way.song.reach);
    },
  };

  const roost = {
    wary: false,
    enter(a, swing = 0) { a.now.swing = swing; },
    step(a, dt) {
      if (world.day >= 0.08) { a.to('glean', at.perch, at.share, at.side); return; }
      // (one that was hanging under its bough when night came swings back up onto it: it is not put there in one step)
      a.now.swing = Math.max(0, a.now.swing - dt * 12);
      at.turn = 0; settle(a.now.swing); sit({ yaw: 0, pitch: 0.05, roll: 0 }, { pitch: rest.pitch + 0.1 }); bird.doing = 'roosting in the foliage';
    },
  };

  return {
    activities: { glean, hover: hoverAct, snap, sing, roost },
    // Flushed: to a bough of its tree clear of the walker; or on to the next tree; or nowhere near.
    refuge() {
      const one = tree && pick(tree);
      if (one) return fly(one, 'flitting off to another bough');
      const next = onward(), there = next && pick(next);
      if (!there) return false;
      until = between(way.stay);
      return fly(there, 'flying off to the next tree');
    },
    // Where it is when it comes: in a tree of its part of the wood (with a party, near where the party is now), and
    // it flies in if the walker could see it be there from nowhere. By night, on a bough there already, at roost.
    begin() {
      const night = world.day < 0.08, c = centre();
      world.leafyNear(c.x, c.z, reach(), near);
      near.sort((x, y) => from(x) - from(y) + (like(y) - like(x)) * 6);
      let one = null;
      for (const t of near.slice(0, 10)) { one = pick(t, way.low, way.high, null); if (one) break; }
      if (!one && !party && home.tree) one = pick(home.tree, way.low, way.high, null);
      if (!one) { bird.left = 6 + r() * 10; return; }
      until = between(way.stay);
      at.perch = one; at.share = one.share; tree = one.tree;
      if (night) { settle(0); a.to('roost', 0); return; }
      a.to('glean', one, one.share, at.side, 0.4);
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.1, floor: world.height }, 'glean', one, one.share, at.side, 0.4)) bird.left = 4 + r() * 8;
      }
    },
  };
}

// A home: a tree within `homeOff` of the walk with three perches or more in the bird's gleaning heights (its own kind
// of tree more often than not, but any will do), and no other of its kind's home within `apart` (`taken`); with the
// way its work through the wood is drifting. Lenient: one of the wave's is given a home this way too, and keeps to the
// party, not to it.
const foliageHome = (way) => (habitat, r, taken = []) => {
  const near = habitat.leafy.filter((t) => t.off < way.homeOff);
  for (let tries = 0; near.length && tries < 24; tries += 1) {
    const tree = near[Math.floor(r() * near.length)];
    if (tries < 16 && r() > (BROAD.has(tree.kind) ? way.broad : 1 - way.broad) + 0.15) continue;
    if (tries < 20 && taken.some((h) => h && Math.hypot(h.x - tree.x, h.z - tree.z) < way.apart)) continue;
    if (habitat.perchesOf(tree).filter((one) => one.above >= way.low && one.above <= way.high).length >= 3) return { x: tree.x, z: tree.z, tree, last: null, drift: r() * 6.283 };
  }
  return null;
};

const chance = test((v) => Number.isFinite(v) && v >= 0 && v <= 1, 'a chance, from 0 to 1');
export default {
  // what a foliage bird's way holds besides what every way has (life/families/index.js)
  fields: {
    homeOff: 'number',                              // its home tree within this many metres of the walk
    range: 'number', apart: 'number',               // living here, it keeps within this of its home (m, seen from above), and its home no nearer another of its kind's
    broad: chance,                                  // how much it likes broad-leaved trees over conifers (0: conifers only, if it can)
    low: 'number', high: 'number',                  // it gleans between these heights above its tree's foot (m)
    perch: 'number',                                // and sings a bout from as high as this (m above the tree's foot)
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    stay: nums(2),                                  // seconds in one tree before it moves on to the next
    spell: nums(2),                                 // living here: seconds in its part of the wood before it goes (for a while or for good)
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    hop: nums(2), hops: 'number',                   // seconds it waits after a run of hops (least, most); the most hops in a run
    hang: chance, hover: chance, sally: chance,     // at each choice, the chance it hangs under a twig, hovers at a bough's tip, flies out after an insect
    reach: nums(2),                                 // how far out it flies after an insect (m)
    flick: 'number',                                // about how many seconds between flicks of its wings and tail (0: it does not)
    doing: { look: 'string', hop: 'string', peck: 'string', hang: 'string', hover: 'string' },
    call: { every: nums(2), time: 'number', rate: 'number', reach: 'number', doing: 'string' },
    // its song: one every `every` seconds while it gleans, sung where it is; or, with the chance `up`, a bout of
    // `bout` songs, `gap` seconds apart, from as high as `perch`
    song: { every: nums(2), up: chance, bout: nums(2), gap: nums(2), time: 'number', rate: 'number', reach: 'number', doing: 'string' },
  },
  act: (way) => (bird, world) => live(bird, world, way, foliage),
  home: (way) => foliageHome(way),
};
