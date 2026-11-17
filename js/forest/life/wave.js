import * as THREE from 'three';
import { mulberry, WAVE } from './census.js';

// The migrants' wave as one party. The owner, 2026-11-15: "On a given day you might see a handful of warbler species
// traveling in a group and on another day none at all." On a visit whose census draws a wave (life/census.js: about
// one visit in eight, by day), the animals that the wave has brought go about together: one party of several kinds,
// which comes into the valley as one, drifts slowly through the wood beside the walk, tree to tree, and after some
// minutes moves on out of it, every member with it. On a visit with no wave nothing here is made or drawn.
//
// Who is in it (life/visit.js asks `migrants`): a kind that travels with the wave (its census says `wave`) is several
// times as many on a wave day (the census multiplies its mean by k, 1 + 4 times the wave's strength); of its animals,
// each is one of the wave's with the share of the day's number that the wave brought, (k - 1) / k, and the rest live
// here as on any day. Under `busy` (the tools' busiest visit) every animal of such a kind but one is the wave's, and
// the party is there from the first.
//
// The party, as every family whose kinds join a wave reads it (the form is fixed in the agents' roster of 2026-11-16:
// fields may be added to it, none changed). An animal in the party has `home.party` set: this one object, which the
// visit shares among all the party's members and moves through the wood:
//   at       a THREE.Vector3: the party's middle, ON THE GROUND (its y is the ground's height there)
//   heading  radians: the way it is drifting, seen from above, as the bough family's `drift` is: the way is
//            (cos heading, sin heading) in (x, z)
//   radius   metres, SEEN FROM ABOVE (x and z only, whatever the height): a member keeps its doings within this of `at`,
//            taking a place near it and moving on after it when it falls behind
//   gone     true once the party has moved on out of the valley: each member then leaves (`a.leave`), for good
// and, besides, for the tools and for a family that wants them:
//   here     true from the moment the party comes into the valley until it is gone
//   arrive, depart   the visit's clock (s) at which it comes, and at which it moves on
//   speed    m/s, how fast `at` drifts; `tree`, the tree (life/habitat.js `leafy`) it is making for
//   s, off   where `at` is beside the walk: metres along it, and metres from its middle line
//   members  how many animals are in it
//
// How it moves: `at` goes from tree to tree among the trees whose boughs are perched on (life/habitat.js `leafy`:
// within 26 m of the walk), so a member always has boughs within reach: onward the way it is drifting, turned back
// towards the walk when it strays more than 14 m from it, and turned about where the wood runs out. By night it
// stands still (its members roost).
//
// What was read (through a tool that returns a summary of a page): that Townsend's, the Hermit and the Black-throated
// Gray go about in mixed flocks in migration, Townsend's with chickadees, kinglets and other warblers (BirdWeb, and
// Birds of the World for Townsend's), and the Yellow-rumped in flocks of its own kind. Not read: how fast such a flock
// moves through a wood, how wide it is or how long it stays (a paper on such flocks, Rodewald and Brittingham 2002,
// was found by a search and could not be opened). So the agent's own: how fast the party drifts (0.18 to 0.35 m/s),
// how wide it is (16 m), how long it stays (6 to 16 minutes), that it is there from the first on 45 visits in 100 and
// comes in within three minutes otherwise, and how it moves.
//
// How near a member keeps: each family says. The foliage family keeps a member's tree within `radius` of `at` (by the
// tree's foot), so a bird on a long limb, out after an insect or up on a song perch can be a few metres beyond it
// (20.4 m was the most measured, against 16, in 18 minutes stepped by hand); the thicket family keeps the bird itself
// within it. A family's `home()` that hands back no object leaves that migrant out of the visit (`homeless`).

export const RADIUS = 16;                 // m, seen from above
const SPEED = [0.18, 0.35];               // m/s
const STAY = [360, 960];                  // seconds in the valley
const THERE = 0.45;                       // the chance it is there when the visit begins
const LATER = [20, 200];                  // or it comes in this many seconds after
const OFF = 14;                           // m from the walk's middle line, beyond which it turns back towards it
const STEP = [5, 13];                     // m from one tree it makes for to the next

const _p = new THREE.Vector3(), _t = new THREE.Vector3();

// `seed`: the visit's number. The wave draws its own random numbers, so that what the visit draws for everything
// else is what it would be without it.
export function createWave(habitat, trail, seed, { busy = false, strength = 1 } = {}) {
  const r = mulberry((seed >>> 0) * 6271 + 101);
  const k = 1 + (WAVE.most - 1) * strength, share = (k - 1) / k;
  const trees = habitat.leafy.filter((t) => t.off < OFF);
  const between = ([a, b]) => a + r() * (b - a);
  const arrive = busy ? 0 : r() < THERE ? 0 : between(LATER);
  const party = { at: new THREE.Vector3(), heading: 0, radius: RADIUS, gone: false, here: false,
    arrive, depart: arrive + between(STAY), speed: between(SPEED), tree: null, s: 0, off: 0, members: 0 };
  let last = null, idle = 0;
  const near = [];

  // where it begins: a tree near the walk, drifting along the walk one way or the other
  if (trees.length) {
    const tree = trees[Math.floor(r() * trees.length)];
    party.tree = tree;
    party.at.set(tree.x, habitat.height(tree.x, tree.z), tree.z);
    trail.sample(tree.s, _p, _t);
    party.heading = Math.atan2(_t.z, _t.x) + (r() < 0.5 ? 0 : Math.PI);
    party.s = tree.s; party.off = tree.off;
  } else party.gone = true;

  // The next tree: 5 to 13 m on, the way it is drifting, a little either side. Where `at` has strayed from the walk
  // the heading is turned back towards it first; where no tree lies ahead it is turned about.
  function onward() {
    const [off, s] = trail.locate(party.at.x, party.at.z);
    party.off = off; party.s = s;
    if (off > OFF) {
      trail.sample(s, _p, _t);
      const back = Math.atan2(_p.z - party.at.z, _p.x - party.at.x);
      let turn = Math.atan2(Math.sin(back - party.heading), Math.cos(back - party.heading));
      party.heading += turn * 0.5;
    }
    party.heading += (r() - 0.5) * 0.5;
    for (let tries = 0; tries < 3; tries += 1) {
      habitat.leafyNear(party.at.x, party.at.z, STEP[1], near);
      let best = null, most = 0.15;
      const c = Math.cos(party.heading), sn = Math.sin(party.heading);
      for (const t of near) {
        if (t === party.tree || t === last || t.off > OFF + 6) continue;
        const dx = t.x - party.at.x, dz = t.z - party.at.z, d = Math.hypot(dx, dz);
        if (d < STEP[0]) continue;
        const score = (dx * c + dz * sn) / d + r() * 0.6 - Math.abs(d - 9) * 0.03;
        if (score > most) { most = score; best = t; }
      }
      if (best) { last = party.tree; party.tree = best; return; }
      party.heading += Math.PI * (0.7 + r() * 0.6);
    }
    idle = 5 + r() * 10;                                     // (nowhere to go: it stays where it is a while)
  }

  // One step of the visit's clock. `day`: the forest's day factor (life/visit.js).
  function step(dt, clock, day) {
    if (party.gone || !party.members) return;
    if (!party.here) { if (clock < party.arrive) return; party.here = true; }
    if (clock >= party.depart) { party.gone = true; party.here = false; return; }
    if (day < 0.08) return;                                  // by night it stands still: its members roost
    if (idle > 0) { idle -= dt; return; }
    const tree = party.tree, dx = tree.x - party.at.x, dz = tree.z - party.at.z, d = Math.hypot(dx, dz);
    if (d < 0.75) { onward(); return; }
    const f = Math.min(1, (party.speed * dt) / d);
    party.at.x += dx * f; party.at.z += dz * f;
    party.at.y = habitat.height(party.at.x, party.at.z);
  }

  return {
    party, r,
    // how many of a kind's `n` parties (each one animal, for these kinds) are the wave's
    migrants(n) {
      if (busy) return n > 1 ? n - 1 : n;
      let m = 0;
      for (let i = 0; i < n; i += 1) if (r() < share) m += 1;
      return m;
    },
    // a few seconds after the one before: the party comes in as one, its members a moment apart
    stagger: (() => { let t = 0; return () => (party.arrive === 0 ? 0 : (t += 0.6 + r() * 2.2)); })(),
    step,
    summary: () => ({ at: [+party.at.x.toFixed(1), +party.at.y.toFixed(1), +party.at.z.toFixed(1)], s: +party.s.toFixed(0), off: +party.off.toFixed(1),
      heading: +party.heading.toFixed(2), here: party.here, gone: party.gone, arrive: +party.arrive.toFixed(0), depart: +party.depart.toFixed(0), members: party.members }),
  };
}
