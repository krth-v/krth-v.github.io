import * as THREE from 'three';
import { mulberry32 } from '../world/layout.js';
import { takeOff, flying, straightOn, frame, UP, pace } from './agents.js';
import { bodyOf, test } from './bodies.js';
import { gaitShares, strideFor, stridesOf } from './beasts.js';

// What every animal's life is made of. The owner, 2026-11-16: "Behaviour has no shared skeleton. How each bird
// reacts to the walker is written inside its own behaviour. Your flush rule is therefore one edit per kind instead
// of one edit to a shared module. Activities also need a common start/stop shape: the bug where an action carries
// over after a flight was found one case at a time, at least five times." And of birds: "they don't really stop and
// watch you like elk do. Birds usually just go about what they are doing until you get too close or make a sudden
// movement, then they flush and flee somewhere nearby or flee away altogether."
//
// A family (life/families/) makes one animal's life from this: `live(bird, world, way, family)`, where `family(a)`
// gives its activities, where it goes when it is flushed (`refuge`) and how it begins. The families are moved onto
// it one at a time (the bough is; the ground, the trunk, the skulker and the corvid are to come; the creeper keeps
// a family of its own, the approved climb, and the herd keeps its own: one mind for a whole party, thought by its
// leader, with every member's pose laid whole as a beast's, life/beasts.js). Until a family is moved, its code is
// life/agents.js as it was.
//
// ---- The animal. `a`, one to an animal: its bird (`a.bird`: where it is, how it is turned, `want`, `doing`,
// `state`), the world, its way, its random numbers (`a.r`), the activity it is in (`a.name`, `a.act`) and what that
// activity keeps of its own (`a.now`). What it keeps across its activities (where it is on a bough, how long it has
// been in a tree, when it will next call) is its family's, in the family's own closure.
//
// ---- Activities. What an animal is at now: on a bough, hovering, at roost, flying, gone. Each is { pose(a),
// enter(a, ...), step(a, dt), exit(a), wary } (`wary`: false, or a function of `a`, where the walker is not to put
// it up: on the wing, at roost) and keeps what it is in the middle of (a hop, a call, a peck, hanging
// under the bough) in `a.now`, a table made new each time the activity is entered. An animal goes from one to
// another only by `a.to(name, ...args)`, which runs the `exit` of the one it is in, throws `a.now` away, clears what
// the page and the visit read on the bird (`cover`; and `hop`, `hitch`, `flip`, `shy` while families not yet moved
// keep them there), and sets `want` whole: the plan's neutral pose (`rest`, life/bodies.js) with the next
// activity's `pose(a)` laid over it, since the page eases only the fields `want` names, and a field no activity
// names keeps what the last left in it (an open bill, a held-out wing). Then it enters the next. So nothing one
// activity was in the middle of can be in the next.
//   Every family has these, from here: `fly` (a flight: `a.fly(to, landing, ...args)`, out and up, across and in,
//   and on landing into the activity `landing`), `gone`, and two ways of moving that end in a flight:
//   `a.leave(seconds)`, off out of the walker's plain sight and gone from there, for a while or for good
//   (Infinity), and `a.come(to, landing, ...args)`, in from out of plain sight. Each is false, and nothing is
//   changed, where there is no way to do it that the walker would not see.
//
// ---- The walker, taken one way by every bird. Each frame, before the activity's step, unless the bird is on the
// wing, gone, or in an activity that says it is not wary (at roost): is the walker within the kind's `flush` metres
// of it (further, up to nearly twice as far, for one who runs: life/agents.js `pace`), or within its `startle`
// metres and moving suddenly (`feelWalker`, below)? If so it flushes: its family's `refuge(a)` finds somewhere near
// and clear of the walker (a bough further off, the next tree), taken with the chance `near` of the kind's;
// otherwise, or if there is none, it leaves, for good with the chance `gone` of the kind's and for a while if not.
// With no way out found it looks again a moment later and not in every frame, since the search is not a light one.
// Otherwise it goes on with what it is doing, whatever the walker does: there is no watching, no edging away and no
// getting used to them. A family may give a flush a manner of its own through its refuge, never a reaction of its
// own to the walker.
//   Clear of the walker (`a.clear(point)`): further from them than the kind's flush distance at their pace, and a
//   metre more. A refuge is clear, and so is every place the bird's own doings take it (a flit, a hover at a
//   bough's tip, following its mate, coming in), and a hop is never towards the walker past the flush distance:
//   with nothing that watches or edges away, a bird whose own move ended inside its flush distance would flush at
//   once, land, and do it again.
//   One of the cast of checkpoint 2 (no `bird.life`) flushes only to a refuge and never leaves: its world has no
//   way out, and the tools look for it.
//
// ---- Animals that are not birds, and birds that do not fly off (2026-11-16). A family may give, besides its
// activities, refuge and beginning:
//   `react(a, dt)`  its own way of taking the walker, in place of the bird's rule above: called each frame before
//                   the activity's step (whatever the activity's `wary` says), and true if it has taken the frame.
//                   For a beast it is the owner's words of 2026-11-15: "an elk may stop and turn its head to the
//                   user, and if the user walks closer it might slowly move away. If the user uses the faster
//                   movement option, it might sprint away." For one that hops or swims it may be the bird's rule
//                   with a manner of its own: `a.startled()` and `a.flush()` are the bird's, to call from it.
//   `leave(seconds)` and `come(to, landing, ...args)`  how it goes off out of the walker's plain sight and comes in,
//                   on foot, in water or under cover, in place of the bird's flights (each is false, and changes
//                   nothing, where there is no way that the walker would not see); `a.leave` and `a.come` are then
//                   these. The elk's coming and going on foot is in life/agents.js `elk` and life/visit.js.
// The rest is as for a bird: activities entered and left through `a.to`, a cast member (no `bird.life`) never leaves.
//   For a beast (life/bodies.js `beast`: the elk, the bear, the mustelids, the rodents), two more on `a`:
//   `a.gait(speed, dt, paces)`  its legs at `speed` m/s for this step, into `want`: the shares of walk, trot and
//                   gallop that pace makes (life/beasts.js `gaitShares`, at the elk's paces unless `paces` gives the
//                   kind's own, { walk, trot, gallop } in m/s) and `cycle`, where in a stride it is, run on by its own
//                   strides at its `scale` (`stridesOf`: the sheet's `strides`, or the elk's scaled by its foreleg).
//                   Call it from the activity's step every frame it moves or stands: `a.to` lays `want` whole as an
//                   activity begins, and these change every frame. `cycle` is never wrapped (the rig takes it round).
//                   It lays `scale` too, from `bird.scale` (the individual's size against the sheet's, 1 if not set),
//                   which the plan's `rest` leaves out; `antler` is the herd's own.
//   `a.walkerNear(dt)`  the walker as a beast takes them, each frame: { d, closing, coming, running }: how far off
//                   they are, seen from above (m); how fast they come on (m/s, from this animal's own distance a frame
//                   before, so a walker who passes by is not coming once they are abreast); whether they are coming on
//                   (moving, and closing faster than 0.4 m/s); whether they run (faster than 4.5 m/s).
//
// ---- Night. A family's activities say what it does in the dark (the bough's birds roost on their bough, and
// are not wary there).
//
// ---- How each family's move is checked. The count of walks' four faults stay at none (nothing comes or goes in
// plain view, none under the ground, none faster than 16 m/s in plain view, no two in one spot); the shares of
// visits each kind is in sight on and heard on are written down beside the earlier ones (they move: a bird that
// flushes is seen less); and, since the count's walker never starts or turns suddenly, scripted approaches to one
// of each kind: standing outside its flush distance for a minute (no flight, and no `doing` that names the
// walker), walking in (one flight, at the flush distance), a start into a run or a flick of the view inside
// `startle` (a flight), and a notch of the wheel or an ordinary drag (none).
//
// ---- A hunting hawk's alarm (the raptors', 2026-11-16). A hawk that hunts through the wood raises an alarm in the
// world: `raise(world, { at, reach, until, size, by })`, where `at` is where it is (the hawk's own `bird.at`, so the
// alarm goes where the hawk goes), `reach` how far round that the small birds take it (m), `until` when it ends on the
// world's clock (the hawk ends it sooner by setting `until` to the clock), `size` the hawk's (`bird.size`) and `by` the
// hawk. Every animal on this skeleton that is smaller than the hawk and within `reach` of `at` before `until` takes it
// as it takes a walker too near, by the same rule (only in an activity that is wary, and so never on the wing or at
// roost): it flushes, to its refuge or off out of sight, once for each alarm. Those flushes are counted apart from
// the walker's (`bird.alarmed`, and `alarmed` on the visit's record of the animal). A family that takes the walker its
// own way (`react`) answers an alarm only if it calls `a.answerAlarm()` (a flush counted as the alarm's, which is
// then answered; `a.alarmed()` only says which alarm it is within and has not answered, or null: a flush called after
// that alone was counted as the walker's and the alarm stayed unanswered); families still on life/agents.js do not
// answer it. An activity that says `alarm: false` is not put up by one (an owl at roost keeps still). The alarms are kept on the world
// (`world.alarms`); an ended one is let go the next time one is raised. With none raised, nothing here runs.

// (a hunting hawk's alarm: above)
export function raise(world, alarm) {
  const list = (world.alarms = (world.alarms || []).filter((one) => one.until > world.clock));
  list.push(alarm);
  return alarm;
}

const chance = test((v) => Number.isFinite(v) && v >= 0 && v <= 1, 'a chance, from 0 to 1');
// What every way of a family on this skeleton holds besides its family's own numbers (life/families/index.js).
export const WARY = {
  flush: 'number',      // within this many metres of a walker at a stroll it flushes (further for one who runs)
  startle: 'number',    // within this many metres a sudden movement of theirs flushes it
  near: chance,         // the chance a flush takes it somewhere near (a refuge), not off out of sight
  gone: chance,         // the chance that off out of sight is for good (it is about again elsewhere, minutes later)
};

// ---- The walker's own movements, as the animals feel them: from the walker's controls (`speed`, the trail's way,
// m/s; `yaw`, how far their view is turned from the trail's heading, radians; `s`, metres along the trail), never
// from the camera, which a close-up swings onto the bird (read from the camera, a click on a bird would flush it),
// and by the frame's own time (`elapsed`), not the step the animals are moved by, which is held to a twentieth of a
// second (by that, one long frame of an ordinary drag read as a flick). Sudden is a start into a run, their speed
// passing 4.5 m/s from below and rising by more than 4 m/s a second (a steady scroll is a run's pace, and counts; a
// notch of the wheel and a start into a walk do not; a run eased through a bend and on again does not, since it
// never falls below 4.5), or the view turned faster than a drag turns it, the yaw changing by more than 5 radians
// a second over about a tenth of a second (a drag right across the screen in half a second is 3.5). Nothing is
// measured when the walker is set by a script or is not on the trail (`auto`: every tool places the walker that
// way, and indoors the cabin's window does), on the first frame after either, on a frame longer than a quarter of
// a second, or where the walker has been put somewhere (a jump in one frame of half a radian of yaw, or along the
// trail further than they could go: the cabin's door). `walker` keeps what it needs between frames;
// `walker.sudden` is the seconds left of the last sudden movement (it is felt for a quarter of a second), and
// `walker.suddens` how many there have been, for the tools.
export function feelWalker(walker, { speed = 0, yaw = null, s = null, auto = false, elapsed = null } = {}, dt) {
  const v = Math.abs(speed), real = elapsed ?? dt;
  walker.sudden = Math.max(0, (walker.sudden || 0) - (real > 0 ? real : 0));
  const placed = auto || walker.lastSpeed == null || !(real > 0) || real > 0.25
    || (yaw != null && walker.lastYaw != null && Math.abs(yaw - walker.lastYaw) > 0.5)
    || (s != null && walker.lastS != null && Math.abs(s - walker.lastS) > 2 + v * real);
  if (placed) walker.turn = 0;
  else {
    if (v > 4.5 && walker.lastSpeed <= 4.5 && (v - walker.lastSpeed) / real > 4) { walker.sudden = 0.25; walker.suddens = (walker.suddens || 0) + 1; }
    if (yaw != null && walker.lastYaw != null) {
      walker.turn = (walker.turn || 0) + (Math.abs(yaw - walker.lastYaw) / real - (walker.turn || 0)) * (1 - Math.exp(-real / 0.1));
      if (walker.turn > 5) { if (!walker.turning) walker.suddens = (walker.suddens || 0) + 1; walker.turning = true; walker.sudden = 0.25; }
      else if (walker.turn < 4) walker.turning = false;
    }
  }
  walker.lastSpeed = auto ? null : v; walker.lastYaw = auto ? null : yaw; walker.lastS = auto ? null : s; walker.speed = v;
}

const _v = new THREE.Vector3(), _q = new THREE.Quaternion();

// The activities every family has.
const BUILT = {
  fly: { wary: false, step: (a, dt) => flying(a.bird, dt, a.way.hz) },
  gone: { wary: false, step: () => {} },
};

// One animal's life: `family(a)` gives { activities, refuge(a), begin(a) }, and may give `react`, `leave` and
// `come` (above). Returns its step for each frame.
// how near a big animal's body sends a small one out of its way (m): see `loomed`, in `live`
const LOOM = 0.3;

export function live(bird, world, way, family) {
  const r = mulberry32(bird.seed), life = bird.life || null;
  const a = { bird, world, way, r, life, cast: !life, name: '', act: null, now: null };
  let acts = BUILT, cornered = 0;
  a.awhile = () => life.gap[0] + r() * (life.gap[1] - life.gap[0]);
  a.clear = (point, margin = 1) => point.distanceTo(world.eye) > way.flush * pace(world) + margin;
  a.to = (name, ...args) => {
    const next = acts[name];
    if (!next) throw new Error(`${bird.key}: no activity called "${name}"`);
    if (a.act && a.act.exit) a.act.exit(a);
    a.name = name; a.act = next; a.now = {};
    bird.state = name; bird.cover = false; bird.hop = null; bird.hitch = null; bird.flip = 0; bird.shy = false;
    // (and a flight it was on is over: where that was going is no longer kept for it. `takeOff` comes after this)
    bird.flight = null;
    bird.want = Object.assign(bodyOf(bird.sheet).rest(bird.sheet), next.pose ? next.pose(a) : null);
    if (next.enter) next.enter(a, ...args);
    return true;
  };
  // A flight to `to` ({ at, q, out, rise, floor, through }), and on landing into `landing`.
  a.fly = (to, landing, ...args) => {
    a.to('fly');
    takeOff(bird, to, to.speed || way.speed, () => a.to(landing, ...args));
    return true;
  };
  // Off out of the walker's plain sight, and gone from there: for `seconds`, or for the rest of the visit (Infinity).
  // If they can still plainly see it where it gets to, it flies on.
  const onwards = (seconds) => {
    bird.aloft = true;
    if (!world.plain(bird.at, bird.size)) { bird.left = seconds; a.to('gone'); return; }
    const to = world.origin(bird.at, bird.size, r, { away: true });
    if (!to) { straightOn(bird, world, seconds, way.speed, 3); return; }
    takeOff(bird, { at: to, q: frame(_v.subVectors(to, bird.at).setY(0), UP, _q).clone(), through: true }, way.speed, () => onwards(seconds));
    bird.doing = 'flying off into the wood';
  };
  a.leave = (seconds) => {
    if (a.cast) return false;
    const to = world.origin(bird.at, bird.size, r, { away: true });
    if (!to) return false;
    a.to('fly');
    takeOff(bird, { at: to, q: frame(_v.subVectors(to, bird.at).setY(0), UP, _q).clone(), through: true }, way.speed, () => onwards(seconds));
    bird.doing = 'flying off into the wood';
    return true;
  };
  // In from out of the walker's plain sight, to land at `to`.
  a.come = (to, landing, ...args) => {
    const from = world.origin(to.at, bird.size, r);
    if (!from) return false;
    a.to('fly');
    bird.at.copy(from); frame(_v.subVectors(to.at, from).setY(0), UP, bird.q);
    bird.aloft = true;
    takeOff(bird, to, to.speed || way.speed, () => a.to(landing, ...args));
    bird.doing = 'flying in';
    return true;
  };
  // the walker too near, or moving suddenly near by
  const startled = () => {
    const d = bird.at.distanceTo(world.eye);
    return d < way.flush * pace(world) || (world.walker.sudden > 0 && d < way.startle);
  };
  // (`bird.flushes`: how many times the walker has put it up, for the tools; and on the visit's record of the
  // animal, `flushed` and `off`, how many of those took it somewhere near and how many off out of sight)
  let hawk = null;                                    // (the alarm being answered: below)
  const tally = (off) => {
    if (hawk) { bird.alarmed = (bird.alarmed || 0) + 1; if (bird.who) bird.who.alarmed = (bird.who.alarmed || 0) + 1; return true; }
    bird.flushes = (bird.flushes || 0) + 1;
    if (bird.who) { bird.who.flushed = (bird.who.flushed || 0) + 1; if (off) bird.who.off = (bird.who.off || 0) + 1; }
    return true;
  };
  const away = () => !a.cast && a.leave(r() < way.gone ? Infinity : a.awhile());
  const flush = () => {
    if (cornered > 0) return false;
    const near = a.cast || r() < way.near;
    if (near && refuge(a)) return tally(false);
    if (away()) return tally(true);
    if (!near && refuge(a)) return tally(false);      // nowhere to go off to: somewhere near, then
    cornered = 0.7;                                   // (nowhere at all: it looks again in a moment)
    return false;
  };

  // (for a family that takes the walker its own way: the bird's rule, to call from its own)
  a.startled = startled;
  a.flush = flush;
  // A hunting hawk's alarm it is within and has not answered (the header), or null; and answering one: a flush,
  // counted as the alarm's.
  const answered = new Set();
  a.alarmed = () => {
    const list = world.alarms;
    if (!list) return null;
    for (const one of list) if (one.until > world.clock && one.by !== bird && !answered.has(one) && bird.size < one.size && bird.at.distanceTo(one.at) < one.reach) return one;
    return null;
  };
  const alarmed = a.answerAlarm = () => {
    const one = a.alarmed();
    if (!one) return false;
    hawk = one;
    const done = flush();
    hawk = null;
    // (answered once it has got away: one that found nowhere to go looks again, as it does for the walker)
    if (done) answered.add(one);
    return done;
  };
  // A big animal almost on it (an elk that walks through where it feeds, or that it has fed its way up to): it gets
  // out of the way as it would for a hawk, and the flush is counted with the alarms, not as the walker's. One rule
  // here for every family on the skeleton, 2026-11-16: the count had found the pairs one family at a time.
  const LOOMING = { loom: true };
  const loomed = () => {
    if (!world.loom || bird.body || !(world.loom(bird.at, bird) < LOOM)) return false;
    hawk = LOOMING;
    const done = flush();
    hawk = null;
    return done;
  };
  // (for a beast: its legs at a pace, and the walker as it takes them: see "Animals that are not birds", above)
  const shares = {};
  a.gait = (speed, dt, paces) => {
    gaitShares(speed, paces, shares);
    bird.cycle = (bird.cycle || 0) + (Math.abs(speed) * (dt > 0 ? dt : 0)) / (strideFor(shares, stridesOf(bird.sheet)) * (bird.scale || 1));
    bird.want.walk = shares.walk; bird.want.trot = shares.trot; bird.want.gallop = shares.gallop; bird.want.cycle = bird.cycle;
    bird.want.scale = bird.scale || 1;
  };
  let lastD = null;
  a.walkerNear = (dt) => {
    const d = Math.hypot(world.eye.x - bird.at.x, world.eye.z - bird.at.z), speed = world.walker ? world.walker.speed : 0;
    // (a walker put somewhere by a script, or through the cabin's door, has not come on: more than 2 m in a frame)
    const closing = lastD == null || !(dt > 0) || Math.abs(lastD - d) > 2 ? 0 : (lastD - d) / dt;
    lastD = d;
    return { d, closing, coming: speed > 0.4 && closing > 0.4, running: speed > 4.5 };
  };

  const made = family(a);
  acts = { ...BUILT, ...made.activities };
  const refuge = made.refuge || (() => false);
  if (made.leave) a.leave = made.leave;
  if (made.come) a.come = made.come;
  const react = made.react || null;
  made.begin(a);
  return (dt) => {
    cornered -= dt;
    if (react) { if (a.act && react(a, dt)) return; }
    else {
      const wary = a.act && a.act.wary;
      if (a.act && wary !== false && (typeof wary !== 'function' || wary(a)) && ((startled() && flush()) || (world.alarms && a.act.alarm !== false && alarmed()) || loomed())) return;
    }
    const was = a.act;
    if (a.act) a.act.step(a, dt);
    // (one that has just come down where a big animal now stands, which walked there while it flew, goes straight on)
    if (!react && a.act && a.act !== was && a.act.wary !== false) loomed();
  };
}
