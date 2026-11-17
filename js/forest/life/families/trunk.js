import * as THREE from 'three';
import { onTrunk } from '../perch.js';
import { frame, flying, spot, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums } from '../bodies.js';
import { forked, forkedNear, wellsOf, hasWells, wellTreesNear } from '../places/woodpeckers.js';

// Birds that work a trunk on their feet: the Red-breasted Nuthatch, the Pileated, Hairy and American Three-toed
// Woodpeckers and the Red-breasted Sapsucker. Each is only ever one of a visit's own; its home is a trunk
// (`bird.home`), and it works a few trunks and is gone. Each kind's way says how it does it.
//
// From what was read (the species' sheets). The nuthatch walks up, down and sideways on trunks and big limbs, head
// first on the way down, and does not prop itself on its tail; it probes cracks in the bark and wedges food into
// them to hammer at; it calls a nasal "yank"; it is often tame, and comes boldly close. The woodpecker climbs
// trunks braced on its tail, chisels long holes for carpenter ants, drums a slow deep roll of about three seconds on
// a resonant dead tree, calls loudly, and flies strongly, rising and falling. The agent's own: every distance, time
// and chance below; how high each works; that a nuthatch starts high and a woodpecker low; how near either lets a
// walker come (the woodpecker's is from no source at all).
//
// The three of 2026-11-16 (the agent called woodpeckers), from what was read (each kind's file says where):
//   Hairy Woodpecker  forages "mainly on the trunks and limbs of trees", "often probing, scaling off bark, and
//                     excavating into dead wood"; "will feed on sap at damaged trees or at sapsucker workings";
//                     calls "a sharp, distinctive peek"; its drum "lasts on average for a full second, and includes
//                     about 26 beats", four to nine rolls a minute while it drums (Audubon; Pfeiffer, Northern
//                     Woodlands, 2017). So: the woodpecker's climb, chiselling and probing, scaling bark now and
//                     then (`flake`), backing down the trunk tail first now and then (`backs`), going to a
//                     sapsucker's wells to take sap when there are any near (`sap`), and seeking a dead tree to
//                     drum from (`drum.seek`) in bouts of a few rolls (`drum.every`, `bout`, `pause`).
//   Red-breasted Sapsucker  "drills tiny holes in tree bark, usually in neatly spaced rows, and then returns to them
//                     periodically to feed on the sap that oozes out", and eats "insects that are attracted to the
//                     sap"; "forage[s] in healthy trees"; "sallies out to catch insects in the air"; its voice "a
//                     soft, slurred whee-ur or mew" (Audubon; BirdWeb); its drum like Morse code (BirdNote), "a
//                     stuttered opening, and then steady tapping that slows in cadence and wanders away" (Pfeiffer,
//                     of the Yellow-bellied, its eastern kin). So: its sap wells (`wells`, below), its sallies after
//                     insects (`sally`), and a drum said knock by knock in that rhythm (`drum.knocks`).
//   American Three-toed Woodpecker  "forages on live or dead conifers, especially spruces"; "often scales off
//                     flakes of bark to get at insects, and may gradually remove all bark from a dead tree"; "may
//                     perch motionless against a tree trunk for minutes at a time"; "often quite unwary"; "a soft
//                     pik" (Audubon); it visits "sapsucker wells to feed on the sap" (BirdWeb). So: scaling bark
//                     (`flake`) as most of what it does, spells clinging still (`still`), a short flush distance, and
//                     the sap at another's wells now and then (`sap`).
// The agent's own, for these three as for the first two: every distance, time, chance and height; which trees each
// takes; how a sapsucker lays out a row of wells and where on the trunk (on the side the walk is on, so that a
// walker can see them); what it does at them, and in what order; that the hairy and the three-toed take sap at
// them; the drum's rhythm, knock by knock.
//
// ---- Sap wells (`wells`: the sapsucker's own). On a living tree of its own (its home, and up to `trees` of them
// near one another) it drills a row of `row` wells `apart` metres apart round the trunk, a row `over` metres over the
// one before, `rows` rows to a tree, the first at a height in `low` (where its bill strikes: it clings `reach` below
// that); each new well is drilled for `drill` seconds of quick light taps (`rate` a second), an old one opened again
// for `open`, and at each it laps the sap for `sip`, now and then taking an insect come to it. It turns to its wells
// on such a tree at the end of a run of hitches (`chance`), and goes back to a tree of its wells when it moves on
// (`back`). The wells stay on the bark, the visit's (life/places/woodpeckers.js), and it comes back to them: a row
// left half drilled when the walker put it up is finished when it is back. A kind that takes sap at wells it did not
// drill (`sap`) goes to them when it moves on (`chance`) and laps at the wells already made, for `sip` seconds each.
// Nothing of the wells is drawn yet: that needs a mesh of the page's (life/places/woodpeckers.js says what).
//
// ---- The trees that divide low (`short`). A bigleaf maple's trunk divides at about 3.3 m, under the habitat's
// least (life/habitat.js reads a trunk 5 m tall at the least); its lower trunk is made a trunk place of the same
// shape by life/places/woodpeckers.js, for a kind that says so, and is worked below its fork as any other.
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then flies to a trunk clear of them, or is off. Every addition of 2026-11-16 is behind a field of its own, and
// draws no random number for a kind whose way does not give that field: the nuthatch and the pileated live as they
// did, step for step.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const TAU = Math.PI * 2;
const _t = new THREE.Vector3(), _v = new THREE.Vector3(), _near = [], _forks = [], _w = new THREE.Vector3(), _wt = new THREE.Vector3();
// how fast it turns on the bark to the way it will go (radians a second), and how near another animal a hitch may
// end (m): the agent's numbers
const TURN = 9, ROOM = 0.2;

function trunk(a) {
  const { bird, world, way, r } = a, rest = bird.sheet.poses.perched, p = spot(), p2 = spot(), q = new THREE.Quaternion();
  const quota = way.quota[0] + Math.floor(r() * (way.quota[1] - way.quota[0] + 1));
  // where it is, and what it is about across its activities: the trunk, how high on it, how far round it, the
  // way it faces on the bark (`bearing`, radians round from straight up it: half a turn is head down), how many
  // trunks it has worked, how long it has left on this one, when it next calls and drums
  let tree = bird.home, height = 1, turn = r(), bearing = 0, trees = 0, until = 0, calls = 3 + r() * way.call.every[1], drums = way.drum ? 20 + r() * 120 : Infinity;
  // (the way it is turned as it is drawn: it follows `bearing` at a rate, see `turning`)
  let shown = 0;
  // (how many rolls are left of a bout of drumming, for a kind that drums in bouts: a flight ends the bout, see `fly_`)
  let rolls = 0;
  // a woodpecker (a kind whose way says how it backs down a trunk, or how its flight bounds) props itself on its
  // tail, and does not go down a trunk head first
  const props = way.backs != null || way.bound != null;
  const S = way.wells || way.sap || null;                  // what it does at sap wells, if it goes to any
  const stay = () => way.stay[0] + r() * (way.stay[1] - way.stay[0]);
  // the stretch of a trunk it works: from `low` up to the trunk's top as built, or `high`
  const ceiling = (t) => Math.max(way.low + 0.5, Math.min(way.high, t.top - 0.6));
  // where it starts on a trunk: a share of the way from low to the ceiling
  const begin = (t) => way.low + (ceiling(t) - way.low) * (way.start[0] + r() * (way.start[1] - way.start[0]));
  const facing = (out) => out.copy(p.up).multiplyScalar(Math.cos(shown)).addScaledVector(_t.crossVectors(p.normal, p.up), Math.sin(shown));
  const settle = () => { onTrunk(tree, height, turn, p); bird.at.copy(p.point); frame(facing(_v), p.normal, bird.q); };
  // It turns on the bark to the way it will go, the shorter way round, and is set there again as it turns; true while
  // it is still turning. (Faced at once the way its next run of hitches went, a bird that turned back at the end of
  // its stretch of the trunk was head down a frame after it was head up.)
  const turning = (dt) => {
    const d = Math.atan2(Math.sin(bearing - shown), Math.cos(bearing - shown));
    if (Math.abs(d) < 1e-4) return false;
    shown += clamp(d, -TURN * dt, TURN * dt);
    settle();
    return true;
  };
  // Would a hitch to `h` above the trunk's foot and `tu` of the way round it end on another animal: nearer one than
  // ROOM, and nearer than it is to one now?
  const taken = (h, tu) => { onTrunk(tree, h, tu, p2); return world.crowd(p2.point, bird) < Math.min(ROOM, world.crowd(bird.at, bird)); };
  // Is a trunk in the way of a flight from where it clings to `point`? Its own is, if `point` lies behind the bark it
  // is on (the habitat's test passes over a trunk right at the start of the line); another, by the habitat's test.
  const barred = (point) => {
    _w.set(0, 1, 0).applyQuaternion(bird.q).setY(0); _wt.subVectors(point, bird.at).setY(0);
    return _w.dot(_wt) < 0.1 * _w.length() * _wt.length() || world.blocked(bird.at, point);
  };
  // (the trunks a flight can reach with no trunk in the way, before the rest, each as they were ordered)
  const clearFirst = (list) => { const open = [], rest = []; for (const t of list) (barred(t.foot) ? rest : open).push(t); return open.concat(rest); };
  const cling = (extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: rest.lean, spread: 0, flap: 0, hand: 0, sweep: 0, droop: rest.droop ?? 0, gape: 0,
    head: { yaw: 0, pitch: rest.head.pitch, roll: 0 }, tail: { ...rest.tail }, feet: rest.feet }, extra);
  // the trunks it could go to next: near, of the kind it works, with no other animal on them; nearest first (and,
  // for a kind that works them, the lower trunks of the trees that divide low; and for a kind that says how far from
  // the walk it lives, none much further off than that, where the walker would not see it for the leaves between)
  const others = () => {
    const near = world.trunksNear(tree.foot.x, tree.foot.z, way.range, _near);
    if (way.short) for (const t of forkedNear(world.leafyNear, tree.foot.x, tree.foot.z, way.range, _forks)) near.push(t);
    return near.filter((t) => t !== tree && way.suits(t) && (way.homeOff == null || t.off < way.homeOff + 4) && !world.beside(t.foot.x, t.foot.z, t.girth + 1.5, bird))
      .sort((x, y) => x.foot.distanceTo(tree.foot) - y.foot.distanceTo(tree.foot));
  };
  // Off to the trunk `to`, onto the side it flies in from, and into `landing` there (the climb, unless it is
  // given another: a stay of `time` seconds, or one drawn). False, and nothing changed, if that is not clear of the
  // walker (life/behave.js).
  const fly = (to, landing = 'climb', time = null) => {
    const h = begin(to), b = way.bear(r), tu = Math.atan2(tree.foot.z - to.foot.z, tree.foot.x - to.foot.x) / (Math.PI * 2) - to.turnOffset + (r() - 0.5) * 0.2;
    onTrunk(to, h, tu, p);
    if (!a.clear(p.point)) return false;
    trees += 1; tree = to; height = h; turn = tu; bearing = b; shown = b;
    a.fly({ at: p.point.clone(), q: frame(facing(_v), p.normal, q).clone(), out: p.normal.clone(), rise: -0.2 }, landing, 0.6, time ?? stay());
    return true;
  };
  // Long enough on this trunk, or off the end of the stretch it works: to another, or away once it has worked its
  // trunks. With nowhere to go it works this trunk again (turning back at the ends of its stretch, as it does while
  // it has time left on a trunk), and looks for another when that time is up. (One that goes to sap wells goes to a
  // tree of them now and then, first.) Of the trunks near, one it can fly to with no trunk in the way, its own or
  // another, before any other.
  const next = () => {
    if (trees >= quota && a.leave(r() < 0.35 ? Infinity : a.awhile())) return;
    if (S && r() < (way.wells ? way.wells.back : way.sap.chance) && toWells()) return;
    const near = others(), open = near.filter((t) => !barred(t.foot)), some = (open.length ? open : near).slice(0, 4);
    while (some.length) { const to = some.splice(Math.floor(r() * some.length), 1)[0]; if (fly(to)) return; }
    if (a.leave(a.awhile())) return;
    until = stay(); height = clamp(height, way.low, ceiling(tree));
  };

  // ---- sap wells (see the head of this file)
  // How far round the trunk is at a height above its foot (m), from the trunk's own rings as built.
  const radiusAt = (t, h) => {
    const hs = t.heights, ax = t.axis;
    let k = 0;
    while (k < hs.length - 2 && hs[k + 1] < h) k += 1;
    const f = clamp((h - hs[k]) / Math.max(hs[k + 1] - hs[k], 1e-6), 0, 1);
    return Math.max(0.05, (ax[k].reach + (ax[k + 1].reach - ax[k].reach) * f) * t.scale);
  };
  // the share of the way round a trunk that faces the nearest point of the walk
  const towardWalk = (t) => {
    const [, s] = world.trail.locate(t.foot.x, t.foot.z);
    world.trail.sample(s, _w, _wt);
    return Math.atan2(_w.z - t.foot.z, _w.x - t.foot.x) / TAU - t.turnOffset;
  };
  // A new row of wells on `t`, over the last row if it has any, or at a height in `low` if not; null if there is
  // no room for one (over its stretch of the trunk, or above a forked trunk's fork).
  const newRow = (t, rows) => {
    const W = way.wells, last = rows.length ? rows[rows.length - 1] : null;
    const h = last ? last.height + W.over : W.low[0] + r() * (W.low[1] - W.low[0]);
    if (h - W.reach < way.low || h > Math.min(ceiling(t) + W.reach, t.top - 0.3)) return null;
    const n = W.row[0] + Math.floor(r() * (W.row[1] - W.row[0] + 1));
    const centre = last ? last.centre + (r() - 0.5) * 0.01 : towardWalk(t) + (r() - 0.5) * 0.16;
    const step = W.apart / (TAU * radiusAt(t, h));
    const turns = Array.from({ length: n }, (_, k) => centre + (k - (n - 1) / 2) * step);
    return { height: h, centre, turns, made: turns.map(() => null), tended: turns.map(() => null), by: bird.who || bird };
  };
  // Which well it goes to on `t`: for one that drills, the first not yet drilled of a row of its own left
  // unfinished, or a new row (always on a tree with none, and now and then on one with some), or else the row opened
  // longest ago; for one that only takes sap, a row with wells drilled, longest untended first. Null if there is none.
  const planWells = (t) => {
    const rows = wellsOf(world, t).rows;
    if (way.wells) {
      const open = rows.find((row) => row.by === (bird.who || bird) && row.made.some((m) => m == null));
      if (open) return { row: open, i: open.made.findIndex((m) => m == null) };
      if (rows.length < way.wells.rows && (!rows.length || r() < 0.55)) { const row = newRow(t, rows); if (row) { rows.push(row); return { row, i: 0 }; } }
    }
    let best = null, oldest = Infinity;
    for (const row of rows) {
      if (!row.made.some((m) => m != null)) continue;
      const last = Math.max(...row.tended.map((m) => m ?? -Infinity));
      if (last < oldest) { oldest = last; best = row; }
    }
    return best ? { row: best, i: best.made.findIndex((m) => m != null) } : null;
  };
  // Is `t` a tree it would drill wells on now: a living tree (wells in a dead one give no sap) that suits it, and one
  // of its trees with wells already, or with fewer than `trees` trees of wells near by?
  const drillsOn = (t) => !!way.wells && t.kind !== 'snag' && !!way.suits(t) && (hasWells(world, t) || wellTreesNear(world, t.foot.x, t.foot.z, 40).length < way.wells.trees);
  // The wells a sapsucker has on its tree before the visit begins, if the tree has none yet this visit: one to
  // three rows, drilled on earlier days (they are opened again, not drilled, when it comes to them).
  const oldWells = (t) => {
    const rows = wellsOf(world, t).rows;
    if (rows.length) return;
    for (let n = 1 + Math.floor(r() * 3); n > 0; n -= 1) {
      const row = newRow(t, rows);
      if (!row) break;
      const day = -86400 * (n + r());
      row.made = row.made.map(() => day); row.tended = row.tended.map(() => day + 3600);
      rows.push(row);
    }
  };
  // Off to a tree with wells near by (one with no trunk in the way of the flight before any other), and to the first
  // of them it will work there. False if there is none, or none whose landing is clear of the walker.
  const toWells = () => {
    for (const t of clearFirst(wellTreesNear(world, tree.foot.x, tree.foot.z, way.range))) {
      if (t === tree || world.beside(t.foot.x, t.foot.z, t.girth + 1.5, bird)) continue;
      const plan = planWells(t);
      if (!plan) continue;
      const h = plan.row.height - S.reach, tu = plan.row.turns[plan.i];
      onTrunk(t, h, tu, p);
      if (!a.clear(p.point)) continue;
      trees += 1; tree = t; height = h; turn = tu; bearing = 0; shown = 0;
      a.fly({ at: p.point.clone(), q: frame(facing(_v), p.normal, q).clone(), out: p.normal.clone(), rise: -0.2 }, 'wells', 0.5, stay(), plan);
      bird.doing = way.wells ? 'flying back to its sap wells' : 'flying to a sapsucker\'s wells';
      return true;
    }
    return false;
  };

  const climb = {
    enter(a, wait = 0.6, time = null) {
      Object.assign(a.now, { wait, hitches: 0, probe: 0, work: 0, calling: 0, drum: 0, knock: 0, hitch: null });
      if (time != null) until = time;
      settle();
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost'); return; }
      now.wait -= dt; until -= dt; calls -= dt; drums -= dt;
      if (now.hitch) {
        const h = now.hitch; h.t = Math.min(1, h.t + dt / way.beat);
        height = h.a + (h.b - h.a) * h.t; turn = h.c + (h.d - h.c) * h.t;
        settle();
        bird.at.addScaledVector(p.normal, way.step[1] * 0.12 * Math.sin(Math.PI * h.t));        // its feet leave the bark together
        cling({ lift: rest.lift + 0.12 * Math.sin(Math.PI * h.t) });
        if (h.t >= 1) { now.hitch = null; now.wait = now.hitches > 0 ? way.beat * 1.4 + r() * 0.1 : 0.4 + r() * 1.4; now.probe = now.hitches > 0 ? 0 : 0.3 + r() * 0.7; }
        return;
      }
      if (now.calling > 0) {
        now.calling -= dt;
        cling({ gape: (now.calling * way.call.rate) % 1 > 0.5 ? 0.55 : 0.1, head: { yaw: 0, pitch: rest.head.pitch + 0.25, roll: 0 } });
        bird.doing = way.call.doing;
        return;
      }
      if (now.drum > 0) {
        now.drum -= dt;
        if (now.knocks) {
          // a rhythm said knock by knock: the bill struck at each, and drawn back between
          const k = now.knocks;
          k.t += dt;
          while (k.i < k.times.length && k.times[k.i] <= k.t) { k.i += 1; k.last = k.t; world.say(bird, 'drum', way.drum.reach); }
          cling({ head: { yaw: 0, pitch: rest.head.pitch - 0.14 - 0.18 * Math.exp(-(k.t - k.last) / 0.035), roll: 0 } });
        } else {
          // the bill on resonant wood, too fast to count
          cling({ head: { yaw: 0, pitch: rest.head.pitch - 0.28 + 0.2 * Math.sin(now.drum * 94), roll: 0 } });
        }
        bird.snap = true; bird.doing = way.drum.doing;
        return;
      }
      if (now.work > 0) {
        // it draws its head back and drives the bill in, again and again
        now.work -= dt; now.knock -= dt;
        const swing = Math.sin(now.work * way.work.rate * Math.PI * 2), back = swing > 0 ? swing : swing * 1.6;
        cling({ pitch: rest.pitch + 0.05 * back, head: { yaw: 0.12 * Math.sin(now.work * 1.3), pitch: rest.head.pitch + 0.3 * back, roll: 0 } });
        bird.doing = way.work.doing;
        if (now.knock < 0) { now.knock = 0.9 + r() * 1.2; world.say(bird, 'knock', way.work.reach); }
        return;
      }
      if (now.flake > 0) {
        // glancing blows from either side, that knock the bark off in flakes
        now.flake -= dt; now.knock -= dt;
        const k = way.flake, s = Math.sin(now.flake * k.rate * TAU);
        cling({ pitch: rest.pitch + 0.03 * Math.abs(s), head: { yaw: 0.5 * s, pitch: rest.head.pitch - 0.2 - 0.1 * Math.abs(s), roll: 0.3 * s } });
        bird.doing = k.doing;
        if (now.knock < 0) { now.knock = 0.45 + r() * 0.8; world.say(bird, 'flake', k.reach); }
        if (now.flake <= 0) now.wait = 0.3 + r() * 0.6;
        return;
      }
      if (now.still > 0) {
        // still against the bark, but for its head now and then
        now.still -= dt; now.look -= dt;
        if (now.look < 0) { now.look = 2 + r() * 5; now.head = { yaw: (r() - 0.5) * 0.8, pitch: rest.head.pitch + (r() - 0.5) * 0.2, roll: 0 }; }
        cling({ head: now.head });
        bird.doing = way.still.doing;
        return;
      }
      if (now.wait > 0) {
        if (now.probe > 0) {
          now.probe -= dt;
          cling({ head: { yaw: 0.5 * Math.sin(now.probe * 9), pitch: rest.head.pitch - 0.35 - 0.2 * Math.abs(Math.sin(now.probe * 14)), roll: 0 } });
          bird.doing = way.probing;
        } else if (now.hitches <= 0) { cling(); bird.doing = way.resting; }
        return;
      }
      if (calls < 0) { calls = way.call.every[0] + r() * (way.call.every[1] - way.call.every[0]); now.calling = way.call.time; world.say(bird, 'call', way.call.reach); return; }
      // (it drums on dead wood: on a living trunk the roll is kept for the next dead tree it comes to, or, for one
      // that seeks one, it goes to the nearest near by to drum)
      if (way.drum && drums < 0 && tree.kind === 'snag') {
        const D = way.drum;
        if (D.every) {
          // in bouts: a few rolls with a pause between, and a long while between bouts
          if (rolls <= 0) rolls = D.bout[0] + Math.floor(r() * (D.bout[1] - D.bout[0] + 1));
          rolls -= 1;
          drums = rolls > 0 ? D.pause[0] + r() * (D.pause[1] - D.pause[0]) : D.every[0] + r() * (D.every[1] - D.every[0]);
        } else drums = 50 + r() * 160;
        if (D.knocks) { const times = D.knocks(r); now.knocks = { times, i: 0, t: 0, last: -1 }; now.drum = times[times.length - 1] + 0.3; }
        else { now.drum = D.time; world.say(bird, 'drum', D.reach); }
        return;
      }
      if (way.drum && way.drum.seek && drums < 0 && now.hitches <= 0) {
        // (the nearest it can fly to with no trunk in the way, its own or another; with dead trees near and every
        // one of them behind a trunk from where it is, it looks again in a little while, from where it is then)
        const snags = others().filter((t) => t.kind === 'snag'), snag = snags.find((t) => !barred(t.foot));
        if (snag && fly(snag, 'climb', 10 + r() * 15)) { drums = 1 + r() * 3; bird.doing = 'flying to a dead tree to drum'; return; }
        drums = snags.length && !snag ? 6 + r() * 12 : 30 + r() * 60;
      }
      // (one that drills sap wells turns to them, on a tree of its own)
      if (way.wells && now.hitches <= 0 && drillsOn(tree) && r() < way.wells.chance) {
        const plan = planWells(tree);
        if (plan) { a.to('wells', 0.2, null, plan); return; }
      }
      // (in the middle of a bout of drumming on a dead tree, it stays there for the rest of the bout)
      if (rolls > 0 && tree.kind === 'snag' && until < drums + 1) until = drums + 1;
      if (until < 0 || height > ceiling(tree) + 0.05 || height < way.low - 0.05) { next(); return; }
      if (now.hitches <= 0) {
        if (way.work && r() < way.work.chance) { now.work = way.work.time[0] + r() * (way.work.time[1] - way.work.time[0]); now.knock = 0.3; return; }
        if (way.flake && r() < way.flake.chance) { now.flake = way.flake.time[0] + r() * (way.flake.time[1] - way.flake.time[0]); now.knock = 0.2; return; }
        if (way.still && r() < way.still.chance) { now.still = way.still.time[0] + r() * (way.still.time[1] - way.still.time[0]); now.look = 0; return; }
        now.hitches = way.run[0] + Math.floor(r() * (way.run[1] - way.run[0] + 1));
        bearing = way.bear(r); now.backing = false;
        // (turned back where its stretch of the trunk ends, if it has not been there long: a woodpecker, at the top of
        // its stretch, backs down, since it does not go head first, and its way has no words for that: it said it
        // was hitching up the trunk as it went down it)
        const top = height > ceiling(tree) - 0.3 && Math.cos(bearing) > 0 && until > 6;
        if (top && !props) bearing = Math.PI - bearing;
        if (height < way.low + 0.3 && Math.cos(bearing) < 0 && until > 6) bearing = Math.PI - bearing;
        // (a woodpecker goes down a trunk tail first, facing up it, a hitch at a time)
        if (way.backs) now.backing = height > way.low + 0.5 && r() < way.backs;
        if (top && props) now.backing = true;
        if (now.backing) bearing = (r() - 0.5) * 0.3;
      }
      // (it turns to the way it will go before it goes)
      if (turning(dt)) { cling(); return; }
      now.hitches -= 1;
      const step = way.step[0] + r() * (way.step[1] - way.step[0]), dir = now.backing ? -1 : 1;
      const b = height + dir * step * Math.cos(bearing), d = turn + dir * step * Math.sin(bearing) / (Math.PI * 2 * Math.max(0.12, tree.girth));
      // (not onto another animal on the trunk: it stops, and goes another way in a moment)
      if (taken(b, d)) { now.hitches = 0; now.wait = 0.4 + r() * 0.8; return; }
      now.hitch = { a: height, b, c: turn, d, t: 0 };
      bird.doing = now.backing ? 'backing down the trunk, tail first' : way.moving(bearing);
    },
  };

  // At sap wells: going from well to well along a row, drilling each that is not made yet, opening each that is,
  // lapping the sap; now and then a look about, an insect taken at the sap, or (one that does) a sally after one in
  // the air. One that only takes sap goes to the wells already made, and laps.
  const wells = {
    enter(a, wait = 0.5, time = null, plan = null) {
      if (time != null) until = time;
      Object.assign(a.now, { wait, plan, phase: plan ? 'move' : 'done', t: 0, hitch: null, tap: 0, look: 0, rows: 0, head: { yaw: 0, pitch: rest.head.pitch, roll: 0 } });
      bearing = 0;
      settle();
      bird.doing = way.wells ? 'clinging by its sap wells' : 'clinging by a sapsucker\'s wells';
    },
    step(a, dt) {
      const now = a.now, plan = now.plan;
      if (world.day < 0.08) { a.to('roost'); return; }
      now.wait -= dt; until -= dt; calls -= dt; drums -= dt;
      if (now.hitch) {
        const h = now.hitch; h.t = Math.min(1, h.t + dt / way.beat);
        height = h.a + (h.b - h.a) * h.t; turn = h.c + (h.d - h.c) * h.t;
        settle();
        bird.at.addScaledVector(p.normal, way.step[1] * 0.1 * Math.sin(Math.PI * h.t));
        cling({ lift: rest.lift + 0.1 * Math.sin(Math.PI * h.t) });
        if (h.t >= 1) now.hitch = null;
        return;
      }
      if (now.calling > 0) {
        now.calling -= dt;
        cling({ gape: (now.calling * way.call.rate) % 1 > 0.5 ? 0.5 : 0.1, head: { yaw: 0, pitch: rest.head.pitch + 0.25, roll: 0 } });
        bird.doing = way.call.doing;
        return;
      }
      if (now.wait > 0) { cling({ head: now.head }); return; }
      // (it turns to face up the trunk before it goes along its wells)
      if (turning(dt)) { cling({ head: now.head }); return; }
      const row = plan && plan.row, i = plan ? plan.i : 0;
      if (now.phase === 'done' || !row) { a.to('climb', 0.3); return; }
      if (now.phase === 'move') {
        // to the well, a hitch at a time: up, or down tail first, and round the shorter way, facing up the trunk
        const h = row.height - S.reach, round = row.turns[i] - turn - Math.round(row.turns[i] - turn), tu = turn + round, arc = round * TAU * Math.max(0.12, tree.girth);
        if (Math.abs(h - height) < 0.004 && Math.abs(arc) < 0.004) {
          if (row.made[i] == null && !way.wells) { now.phase = 'done'; return; }
          now.phase = row.made[i] == null ? 'drill' : way.wells ? 'open' : 'sip';
          now.t = now.phase === 'drill' ? way.wells.drill[0] + r() * (way.wells.drill[1] - way.wells.drill[0])
            : now.phase === 'open' ? way.wells.open[0] + r() * (way.wells.open[1] - way.wells.open[0]) : S.sip[0] + r() * (S.sip[1] - S.sip[0]);
          return;
        }
        const most = way.step[1], go = Math.min(1, most / Math.max(Math.hypot(h - height, arc), 1e-6));
        // (not onto another animal at the wells: it leaves them to it, and goes back to climbing)
        if (taken(height + (h - height) * go, turn + (tu - turn) * go)) { now.phase = 'done'; return; }
        now.hitch = { a: height, b: height + (h - height) * go, c: turn, d: turn + (tu - turn) * go, t: 0 };
        bird.doing = h < height - 0.01 ? 'backing down to its sap wells' : 'hitching along the row of wells';
        return;
      }
      if (now.phase === 'drill' || now.phase === 'open') {
        // quick light taps, the bill on the bark
        now.t -= dt; now.tap -= dt;
        const W = way.wells, tap = Math.max(0, Math.sin(world.clock * W.rate * TAU * (now.phase === 'open' ? 0.6 : 1)));
        cling({ head: { yaw: 0.04 * Math.sin(world.clock * 2.1), pitch: rest.head.pitch - 0.24 - 0.12 * tap, roll: 0 } });
        bird.snap = true;
        bird.doing = now.phase === 'drill' ? 'drilling a sap well, one of a row' : 'opening its sap wells again';
        if (now.tap < 0) { now.tap = 0.25 + r() * 0.2; world.say(bird, 'tap', W.heard); }
        if (now.t <= 0) { if (row.made[i] == null) row.made[i] = world.clock; row.tended[i] = world.clock; now.phase = 'sip'; now.t = S.sip[0] + r() * (S.sip[1] - S.sip[0]); }
        return;
      }
      if (now.phase === 'sip') {
        // the bill in the well, lapping
        now.t -= dt;
        cling({ pitch: rest.pitch - 0.02, gape: 0.06, head: { yaw: 0.05 * Math.sin(world.clock * 2.3), pitch: rest.head.pitch - 0.36 + 0.025 * Math.sin(world.clock * 11), roll: 0 } });
        bird.doing = S.doing;
        if (now.t > 0) return;
        row.tended[i] = world.clock;
        // the next well along the row (one that only takes sap passes over the wells not drilled), and between two
        // wells now and then a look about, an insect taken at the sap, or a sally after one in the air
        let j = i + 1;
        if (!way.wells) while (j < row.turns.length && row.made[j] == null) j += 1;
        if (j < row.turns.length) {
          plan.i = j; now.phase = 'move';
          const k = r();
          if (way.sally && k < way.sally.chance && sally(plan)) return;
          if (k < 0.3) { now.wait = 0.4 + r() * 1.2; now.head = { yaw: (r() - 0.5) * 1.6, pitch: rest.head.pitch + (r() - 0.3) * 0.4, roll: 0 }; bird.doing = 'clinging by the wells, looking about'; }
          else if (k < 0.45) { now.wait = 0.35; now.head = { yaw: (r() < 0.5 ? -1 : 1) * 0.6, pitch: rest.head.pitch - 0.3, roll: 0 }; bird.doing = 'taking an insect that came to the sap'; }
          return;
        }
        // the row done: on to another row, a new one over it now and then, or back to climbing
        now.rows += 1;
        if (calls < 0) { calls = way.call.every[0] + r() * (way.call.every[1] - way.call.every[0]); now.calling = way.call.time; world.say(bird, 'call', way.call.reach); }
        const again = until > 8 && now.rows < (way.wells ? 3 : 1) && r() < 0.6 ? planWells(tree) : null;
        if (again && again.row !== row) { now.plan = again; now.phase = 'move'; return; }
        now.phase = 'done';
      }
    },
  };

  // Out from the trunk after an insect in the air, a snap at it, and back to where it left, to go on along the row
  // (`plan`): false, and nothing changed, if there is no clear air for it (clear of the walker, high enough over the
  // ground, no trunk in the way).
  const sally = (plan) => {
    const back = { at: bird.at.clone(), q: bird.q.clone(), out: p.normal.clone() };
    _v.copy(p.normal).setY(0); if (_v.lengthSq() < 1e-6) return false; _v.normalize();
    const reach = way.sally.reach[0] + r() * (way.sally.reach[1] - way.sally.reach[0]), side = (r() - 0.5) * 1.6;
    const out = bird.at.clone().addScaledVector(_v, reach).add(_t.set(-_v.z, 0, _v.x).multiplyScalar(side)); out.y += 0.3 + r() * 0.8;
    if (!a.clear(out) || out.y - world.height(out.x, out.z) < 1.2 || world.blocked(bird.at, out)) return false;
    a.fly({ at: out, q: frame(_v, UP, q).clone(), through: true, speed: way.speed * 0.7, floor: world.height }, 'sally', back, plan);
    bird.doing = 'sallying out after an insect';
    return true;
  };
  // (the snap is in the air at the end of the flight out, and it is on its way back at once, wings still open)
  const sallied = {
    wary: false,
    enter(a, back, plan) {
      bird.aloft = true;
      a.fly({ at: back.at, q: back.q, out: back.out, rise: -0.15, speed: way.speed * 0.7 }, 'wells', 0.3, null, plan);
      bird.doing = 'back to its wells with an insect';
    },
    step() {},
  };

  const roost = {
    wary: false,
    step(a) {
      if (world.day >= 0.08) { a.to('climb', 0.5); return; }
      cling({ head: { yaw: 0, pitch: 0.05, roll: 0 } }); bird.doing = 'roosting against the bark';
    },
  };

  // its own flight: it calls as it goes, if it is a kind that does; a woodpecker's rises and falls, rowing up and
  // shutting its wings for the fall. A flight ends a bout of drumming: the rolls left of it are not taken up where it
  // lands (put up in the middle of a bout, it sought a dead tree to finish it on), and the next bout is as far off
  // as after one that was finished.
  const fly_ = {
    wary: false,
    enter() {
      if (rolls > 0) { rolls = 0; drums = way.drum.every[0] + r() * (way.drum.every[1] - way.drum.every[0]); }
      if (way.call.flying && r() < 0.5) world.say(bird, 'call', way.call.reach);
    },
    step(a, dt) {
      flying(bird, dt, way.hz);
      if (way.bound && bird.flight && bird.flight.time > 1) {
        const f = bird.flight, phase = f.t * Math.PI * 2 * Math.max(1, Math.round(f.time * 1.3)), ends = Math.sin(Math.PI * f.t);
        bird.at.y += way.bound * Math.sin(phase) * ends;
        const least = world.height(bird.at.x, bird.at.z) + 0.3;              // (never under the ground on the fall)
        if (bird.at.y < least) bird.at.y = least;
        if (Math.cos(phase) < -0.15 && ends > 0.4) Object.assign(bird.want, { flap: 0, hand: 0, spread: 0.3 });
      }
    },
  };

  return {
    activities: { climb, roost, fly: fly_, wells, sally: sallied },
    // Flushed: to a trunk near by whose landing is clear of the walker, nearest first, one it can fly to with no
    // trunk in the way (its own, most of all: a flight to a trunk behind the bark it is on went through the wood)
    // before any other; or nowhere near.
    refuge() {
      for (const to of clearFirst(others()).slice(0, 8)) if (fly(to)) return true;
      return false;
    },
    // where it is when it comes: on its trunk, and it flies in if the walker could see it be there from nowhere
    // (not onto a trunk another animal is on, nor where the walker would put it up at once: it comes a little
    // later, somewhere else). One that drills sap wells comes to its wells on its home tree, or begins a row there.
    begin() {
      height = begin(tree); bearing = way.bear(r); shown = bearing;
      a.to('climb', 0.5, stay());
      if (way.wells && drillsOn(tree)) oldWells(tree);
      if (way.wells && world.day >= 0.08 && drillsOn(tree)) {
        const plan = planWells(tree);
        if (plan) { height = plan.row.height - way.wells.reach; turn = plan.row.turns[plan.i]; bearing = 0; shown = 0; a.to('wells', 0.5, null, plan); }
      }
      if (world.beside(tree.foot.x, tree.foot.z, tree.girth + 1.5, bird)) { bird.left = 5 + r() * 10; return; }
      if (!a.clear(bird.at)) { bird.left = 4 + r() * 8; return; }
      if (world.day >= 0.08 && !a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        const landing = a.name === 'wells' ? ['wells', 0.5, null, a.now.plan] : ['climb', 0.6];
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), out: p.normal.clone(), rise: -0.2 }, ...landing)) bird.left = 4 + r() * 8;
      }
    },
  };
}

// A trunk it lives on, for a kind whose file gives no `home`: one it works (`suits`, which may say how much it likes
// a trunk as a number: a home is drawn by it) within `homeOff` of the walk (30 m if it does not say), with the lower
// trunks of the trees that divide low for a kind that works them, and a living one for a kind that drills sap wells;
// none within `apart` of a home its kind has already (a territory).
function homeOf(way) {
  const off = way.homeOff ?? 30, ok = (t) => t.off < off && way.suits(t) && !(way.wells && t.kind === 'snag');
  return (habitat, r, taken = []) => {
    const pool = habitat.trunks.filter(ok);
    if (way.short) for (const tree of habitat.leafy) { const t = forked(tree); if (t && ok(t)) pool.push(t); }
    const free = way.apart ? pool.filter((t) => !taken.some((h) => h && h.foot && Math.hypot(h.foot.x - t.foot.x, h.foot.z - t.foot.z) < way.apart)) : pool;
    let total = 0;
    for (const t of free) total += Number(way.suits(t));
    let x = r() * total;
    for (const t of free) { x -= Number(way.suits(t)); if (x <= 0) return t; }
    return free.length ? free[free.length - 1] : null;
  };
}
// Where it is each time it comes: a trunk it works near its home (one that drills sap wells: its home, where they are).
function spotOf(way) {
  const off = (way.homeOff ?? 30) + 4;
  return (home, r, habitat) => {
    if (way.wells) return home;
    const pool = habitat.trunksNear(home.foot.x, home.foot.z, way.range).filter((t) => t.off < off && way.suits(t));
    if (way.short) for (const t of forkedNear(habitat.leafyNear, home.foot.x, home.foot.z, way.range)) if (t.off < off && way.suits(t)) pool.push(t);
    return pool.length ? pool[Math.floor(r() * pool.length)] : home;
  };
}

export default {
  // what a trunk bird's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    range: 'number',                                // how far off (m) the next trunk it goes to may be
    low: 'number', high: 'number',                  // the stretch of a trunk it works, above the trunk's foot (m)
    start: nums(2),                                 // where in that stretch it starts on a trunk, as shares of it
    quota: nums(2), stay: nums(2),                  // how many trunks it works before it goes; seconds on each
    bound: optional('number'),                      // how high its flight rises and falls (m): a woodpecker's
    suits: 'function',                              // (trunk) => whether it works that trunk (or a number: how much it likes it)
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    step: nums(2), beat: 'number', run: nums(2),    // a hitch's length (m) and time (s); hitches in a run
    bear: 'function',                               // (r) => the way it faces on the bark for a run of hitches
    moving: 'function',                             // (bearing) => what it says it is doing as it goes
    probing: 'string', resting: 'string',
    work: optional({ chance: 'number', time: nums(2), rate: 'number', doing: 'string', reach: 'number' }),
    call: { every: nums(2), time: 'number', rate: 'number', reach: 'number', doing: 'string', flying: optional('boolean') },
    // `knocks`: (r) => the times (s) of the knocks of one roll, said one by one (a sapsucker's), in place of one
    // voice for the whole of it; `every`, `bout`, `pause`: in bouts of a few rolls, `pause` seconds apart, `every`
    // seconds between bouts (otherwise a roll every 50 to 210 s); `seek`: off to a dead tree near by to drum from
    drum: optional({ time: 'number', reach: 'number', doing: 'string', knocks: optional('function'), every: optional(nums(2)), bout: optional(nums(2)), pause: optional(nums(2)), seek: optional('boolean') }),
    // ---- added 2026-11-16 (the agent called woodpeckers); each optional, and nothing of it is done for a way without it
    homeOff: optional('number'), apart: optional('number'),     // the family's own home: within this of the walk (m), and no nearer another's (m)
    short: optional('boolean'),                                 // it works the lower trunks of the trees that divide low (the maples) too
    backs: optional('number'),                                  // the chance a run of hitches goes down the trunk, tail first
    flake: optional({ chance: 'number', time: nums(2), rate: 'number', doing: 'string', reach: 'number' }),   // scaling bark off, in bouts
    still: optional({ chance: 'number', time: nums(2), doing: 'string' }),                                     // clinging still, in spells
    wells: optional({ chance: 'number', back: 'number', low: nums(2), row: nums(2), apart: 'number', over: 'number', rows: 'number', trees: 'number',
      drill: nums(2), open: nums(2), sip: nums(2), rate: 'number', reach: 'number', heard: 'number', doing: 'string' }),                 // its sap wells (above)
    sap: optional({ chance: 'number', sip: nums(2), reach: 'number', doing: 'string' }),                                                 // taking sap at another's
    sally: optional({ chance: 'number', reach: nums(2) }),                                                                               // out after an insect, from its wells
  },
  act: (way) => (bird, world) => live(bird, world, way, trunk),
  home: homeOf,
  spot: spotOf,
};
