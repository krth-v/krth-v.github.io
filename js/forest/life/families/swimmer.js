import * as THREE from 'three';
import { frame, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums, list, tuple, oneOf } from '../bodies.js';
import { floatLift } from '../parts/swim.js';
import { WIDTH, REACH, HOMES, riffle, middle, onWater, bend, barSpot } from '../places/ducks.js';

// Ducks of the river: the Common Merganser and the Harlequin Duck. Each is only ever one of a visit's own, and the
// animals of a party go about together (`together` in their ways). They live on the river (life/places/ducks.js) and
// never in the forest: on the water, under it, on a bar's cobbles at its edge, and in the air low along it.
//
// From what was read (their sheets say where). A merganser "can sink quietly down into the water like a grebe or
// dive quickly with a forward curving plunge", "swims swiftly on the surface, but can attain even higher speed
// below it", "has to patter along the surface for a considerable distance" to rise, "in swift water it has to rise
// downstream", "usually flies low, along the courses of rivers ... seldom rising above the tree tops" (Bent 1923, as
// Kortright quotes him), and in spring will "spend hours sleeping and preening on some small island or point of land"
// (Millais 1913, as Kortright quotes him); it floats on the surface or sinks low as a cormorant does, the more when
// it swims upstream, and perches on rocks in the stream with its wings half open (Birds of the World, through another
// agent's summary of the page: so not quoted here). Harlequins on a river (Michael 1922, as Kortright quotes him): they
// work upstream along the shore "prying among the stones", "where the water is deeper they tip up in the manner of mallard ducks, and where the water is
// still deeper they dive"; "most often they stay under water not more than 15 seconds. Often they stay down 20
// seconds, and occasionally ... 25 seconds"; they spring off with the tail, walk upstream on the bottom, "float up
// like bubbles" and "pop suddenly onto the surface"; "seldom more than 10 seconds elapse between plunges"; "the birds
// seldom dive simultaneously"; in the riffles "four or five dives are made in rapid succession" and "they come up in
// about the same spot"; "when tired ... they swing into an eddy ... and rest as they bob about"; they float high.
// Both fly low along rivers (Birds of the World, through a summary). The agent's own: every distance, speed, time and chance below and in
// the two ways, how near they let a walker come (no source gave a distance for a walker on a bank), the current, and
// how a party keeps together.
//
// It lives on life/behave.js: on the water or on a bar it goes on with what it is doing until the walker is too near
// or moves suddenly; then it patters off along the water, or flies off low along the river, the way away from the
// walker, and comes down on it further off; or it goes. Under the water it does not see the walker: it comes up, and
// then it does. Its flights and its comings and goings are its own (`fly`, `leave`, `come`): along the river, never
// across the forest (only one that is going, and is still plainly seen where the river leaves the world, flies on
// over it, by then 200 m and more from the walk).
//
// A party. Its animals share a record (`party.duck`, on life/visit.js's party): the flight the first of them to take
// off is making (where it comes down, or that it is going). The leader is the first of the party who is here; the
// others take off after it a moment later and come down beside it, or go off with it; go to loaf on the stones beside
// it (each duck's place there, its berth, is on the bird for the others: `bird.swimmer.spot`), and back into the water
// soon after it; and on the water each keeps a metre or two behind it and to one side. One left far behind flies to
// it. A harlequin's party is a drake and a duck: the second of the party is the duck
// (`bird.mate`), posed at her own size (the sheet's `mate.scale`, life/parts/swim.js); that she is drawn in her own
// paint is the page's to wire (life/bodies.js `mate`). Dives each decides for itself.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { const k = clamp(t, 0, 1); return k * k * (3 - 2 * k); };
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const G = 9.8;
// the current, m/s down the river: slack in the pools and quick over the riffles (the agent's)
const current = (down) => 0.35 + 0.8 * riffle(down);
// the river as far as one that is going may follow it (life/places/ducks.js: past REACH there is no ground under it)
const WHOLE = [10, 728];
const BOUTS = ['paddle', 'drift', 'hold', 'peer', 'preen', 'rest', 'tip', 'flap'];

function swimmer(a) {
  const { bird, world, way, r } = a, sheet = bird.sheet, rest = sheet.poses.perched, flightPose = sheet.poses.flight;
  const party = bird.who ? bird.who.party : null, rank = party ? party.members.indexOf(bird.who) : 0;
  // the duck of a harlequin pair (the second of its party) is posed at her own size
  if (sheet.mate && rank === 1) bird.mate = true;
  const size = bird.mate ? sheet.mate.scale : 1;
  const shared = party ? (party.duck = party.duck || { flight: null }) : { flight: null };
  // where it is on the river (kept across its activities), and which way it faces, as a bearing in the level
  const pos = { down: bird.home.down, across: 0, level: 0 };
  let heading = 0, last = -99, dives = 0, stay = Infinity, calls = 5 + r() * 20, joined = -99;
  // where its feet are in their stroke (radians), counted on through everything it does and never wound back: the
  // page eases the phase as a number (life/parts/swim.js), and when each activity began its own count again (at
  // nothing, or at a few radians, after hundreds) the feet ran backwards for a moment as the pose eased down to it
  let stroke = r() * 6;
  const _p = new THREE.Vector3(), _w = new THREE.Vector3(), _v = new THREE.Vector3(), _mid = { x: 0, z: 0, dx: 1, dz: 0 };
  // what the rest of its party, and the other ducks, read of it (`spot`: the place on a bar it is going to or is on)
  bird.swimmer = { on: 'water', down: pos.down, across: 0, spot: null };
  const say = (what) => { bird.doing = what; };

  // ---- the pose: every field the rig reads, every time (the page eases only what `want` names, and a field left out
  // keeps what the last activity left in it: a paddling foot on a bar, or a duck at a drake's size)
  const fields = (extra) => ({
    pitch: 0, lift: 0.6, roll: 0, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0, gape: 0,
    head: { yaw: 0, pitch: 0.05, roll: 0 }, tail: { pitch: 0.05, fan: 0, yaw: 0, prop: null }, feet: { mode: 'flat' },
    swim: null, neck: { reach: 0, rise: 0 }, size, ...extra,
  });
  const body = (extra) => Object.assign(bird.want, fields(extra));
  // on the water, at its waterline (lower by `sink`, a share of its legs' length)
  const floating = (pitch, { sink = 0, ...extra } = {}) => fields({ pitch, lift: floatLift(sheet, pitch) - sink, swim: { phase: stroke, kick: 0.3, both: 0, run: 0 }, ...extra });
  const afloat = (pitch, extra) => Object.assign(bird.want, floating(pitch, extra));
  const tail = (pitch) => ({ pitch, fan: 0, yaw: 0, prop: null });
  // (what `a.to` lays on the bird's rest pose until the activity's first step: afloat, so nothing jumps for a frame)
  const still = () => floating(0.02, { tail: tail(way.cock), neck: { reach: 0, rise: 0.006 } });

  // ---- on the river
  const face = (bearing, dt, rate = 1.6) => { heading += clamp(wrap(bearing - heading), -rate * dt, rate * dt); frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q); };
  const atWater = () => { onWater(pos.down, pos.across, bird.at); pos.level = bird.at.y; };
  const upstream = () => { middle(pos.down, _mid); return Math.atan2(-_mid.dz, -_mid.dx); };
  // the most a place on the water may be from the middle: where it is a quarter of a metre deep, to swim in (the
  // ground's own lattice by the edge can stand above the water's level), and 0.6 m deep, to dive in
  const SWIM = WIDTH - 1.2, DIVE = WIDTH - 2.6;
  const inReach = (down) => clamp(down, REACH[0] + 5, REACH[1] - 5);
  // clear of the walker (life/behave.js `a.clear`), and of every other animal
  const room = (point, self = 0.7) => a.clear(point) && world.crowd(point, bird) > self;
  // the leader of its party: the first of it who is here (itself, or none)
  const leader = () => { if (!party) return bird; for (const one of party.members) if (one.bird && one.bird.left == null) return one.bird; return bird; };
  // its place in the line behind the leader (1, 2, ...)
  const place = () => { let k = 0; if (party) for (const one of party.members) { if (one.bird === bird) break; if (one.bird && one.bird.left == null) k += 1; } return Math.max(1, k); };
  const fresh = (what, seconds) => !!what && world.clock - what.clock < seconds;

  const swim = {
    pose: still,
    enter(a, bout = null, time = 0) {
      bird.swimmer.on = 'water';
      Object.assign(a.now, { bout, time, beat: r() * 6, look: 0, head: { yaw: 0, pitch: 0.05, roll: 0 }, target: clamp(pos.across, -SWIM, SWIM), speed: 0, bearing: null, side: 1 });
      if (!bout) next(a);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost'); return; }
      if (follow(a)) return;
      now.time -= dt; now.look -= dt; calls -= dt;
      if (way.voice && calls < 0) { calls = way.voice.every[0] + r() * (way.voice.every[1] - way.voice.every[0]); world.say(bird, 'call', way.voice.reach); }
      if (now.look < 0) { now.look = 0.6 + r() * 2.2; now.head = { yaw: (r() - 0.5) * 1.6, pitch: 0.02 + (r() - 0.5) * 0.3, roll: 0 }; }
      const c = current(pos.down), L = leader(), behind = L !== bird && L.state === 'swim' && L.swimmer;
      // one left far behind its leader (on the water, or on a bar) flies to it: to the water beside it, downstream or
      // up, whichever is clear of the walker (and looks again after a while if neither is)
      const there = L === bird ? null : behind ? L.swimmer : L.state === 'loaf' && L.swimmer.spot ? { down: L.swimmer.spot.down, across: L.swimmer.spot.side * SWIM } : null;
      if (there && Math.abs(there.down - pos.down) > 30 && world.clock - joined > 12) {
        joined = world.clock;
        for (const way of [1, -1]) {
          const landing = { down: inReach(there.down + way * 1.3 * place()), across: clamp(there.across + 0.9 * way, -SWIM, SWIM) };
          if (room(onWater(landing.down, landing.across, _p), 0.6)) { takeOff({ landing, dir: Math.sign(landing.down - pos.down) || 1 }, false); return; }
        }
      }
      // which way it goes along the river (m/s down it), how hard it paddles, how it holds itself
      let along = now.speed, kick = 0.35, pitch = 0.02, sink = 0, head = now.head, rise = 0.006, reach = 0;
      switch (now.bout) {
        case 'paddle': kick = 0.8; sink = way.sink; say('swimming upstream'); break;
        case 'drift': along = c * 0.85; kick = 0.1; say('drifting down with the current'); break;
        case 'hold': along = 0.04 * Math.sin(world.clock * 0.7 + now.beat); kick = 0.6; say('riding the current, facing into it'); break;
        case 'peer': kick = 0.7; pitch = 0.08; reach = 0.01; head = { yaw: 0.25 * Math.sin(world.clock * 1.3), pitch: -0.95, roll: 0 }; say('swimming with its head under water, looking for food'); break;
        case 'preen': along = c * 0.5; kick = 0.05; rise = -0.012; head = { yaw: now.side * 2.5, pitch: -0.5, roll: 0.3 * Math.sin(world.clock * 5) }; say('preening on the water'); break;
        case 'rest': along = c * 0.3; kick = 0.05; rise = -0.012; head = { yaw: now.side * 2.9, pitch: -0.2, roll: 0 }; say('resting on the water, its bill tucked into its back'); break;
        case 'tip': along = c * 0.3; kick = 0.9; pitch = -1.25; head = { yaw: 0, pitch: -1.3, roll: 0 }; say('tipped up, feeding on the bottom'); break;
        case 'flap': along = c * 0.5; kick = 0.3; say('rearing up on the water to flap its wings'); break;
        default: break;
      }
      // one of a party keeps a metre or so behind its leader for each that is between them, downstream, and to one side
      if (behind) {
        along = clamp((L.swimmer.down + 1.3 * place() - pos.down) * 0.6, -0.9, 1.2);
        now.target = clamp(L.swimmer.across + (place() % 2 ? 0.9 : -0.9), -SWIM, SWIM);
      }
      // no further than its home's reach; and nothing it does by itself takes it nearer a walker it is already too near
      if (pos.down < bird.home.down - way.range && along < 0) along = 0.05;
      if (pos.down > bird.home.down + way.range && along > 0) along = -0.1;
      const before = pos.down, wasAcross = pos.across, wasNear = bird.at.distanceTo(world.eye);
      pos.down = inReach(pos.down + along * dt);
      pos.across += clamp(now.target - pos.across, -0.25 * dt, 0.25 * dt);
      atWater();
      if (world.crowd(bird.at, bird) < 0.55 || (!a.clear(bird.at, 0) && bird.at.distanceTo(world.eye) < wasNear)) {
        pos.down = before; pos.across = wasAcross; atWater(); now.target = pos.across;
      }
      // it faces upstream to paddle and to hold, and drifts the way it turned to
      if (now.bout === 'paddle' || now.bout === 'hold' || now.bout === 'peer' || now.bout === 'tip' || behind) face(upstream(), dt);
      else if (now.bearing != null) face(upstream() + now.bearing, dt, 0.4);
      // it bobs, the more on a riffle
      bird.at.y += (0.006 + 0.02 * riffle(pos.down)) * Math.sin(world.clock * 3.1 + now.beat);
      now.beat += dt * (1.8 + 2.5 * kick); stroke += dt * (1.8 + 2.5 * kick);
      bird.swimmer.down = pos.down; bird.swimmer.across = pos.across;
      if (now.bout === 'flap') {
        // up on the water, a second and a half of beats with the breast lifted clear of it
        const t = clamp(1 - now.time / 1.6, 0, 1);
        afloat(0.75, { lift: floatLift(sheet, 0.75) + 0.12 * Math.sin(Math.PI * t), spread: 1, flap: 0.7 * Math.sin(world.clock * 22) + 0.2, hand: 0.4 * Math.sin(world.clock * 22 - 1), sweep: 0.1,
          head: { yaw: 0, pitch: 0.3, roll: 0 }, tail: { pitch: -0.2, fan: 0.3, yaw: 0, prop: null }, swim: { phase: stroke, kick: 1, both: 1, run: 0 }, neck: { reach: 0, rise: 0.01 } });
        bird.snap = true;
      } else {
        afloat(pitch, { sink, head, tail: tail(way.cock + (now.bout === 'tip' ? 0.6 : 0)), swim: { phase: stroke, kick, both: 0, run: 0 }, neck: { reach, rise } });
      }
      if (now.time <= 0) next(a);
    },
  };

  // What it does next on the water: a bout, a dive, a bar to loaf on, or off.
  function next(a) {
    const now = a.now, deep = Math.abs(pos.across) < DIVE, fast = riffle(pos.down), L = leader();
    // long enough here: the leader goes off, for a while or for good, and the rest of the party with it
    if (stay === Infinity) stay = world.clock + way.stay[0] + r() * (way.stay[1] - way.stay[0]);
    if (a.life && L === bird && world.clock > stay) {
      if (a.leave(r() < 0.3 ? Infinity : a.awhile())) return;
      stay = world.clock + 20;
    }
    // one of a party goes to loaf where its leader is loafing
    if (L !== bird && L.state === 'loaf' && L.swimmer.spot && toBar(a)) return;
    const k = r();
    // dives come in runs (a harlequin's in a riffle four or five, with seconds between)
    if (deep && dives > 0 && world.clock - last < 12) { dives -= 1; a.to('dive'); return; }
    if (deep && k < way.dive.chance * (0.6 + fast * way.fast)) { dives = Math.floor(r() * (1 + 4 * fast * way.fast)); a.to('dive'); return; }
    if (L === bird && r() < way.loaf.chance && toBar(a)) return;
    // a bout on the water, by the kind's weights
    let total = 0;
    for (const [, weight] of way.bouts) total += weight;
    let pick = r() * total, bout = way.bouts[0][0];
    for (const [name, weight] of way.bouts) { pick -= weight; if (pick <= 0) { bout = name; break; } }
    if (bout === 'tip' && Math.abs(pos.across) < WIDTH - 2.4) bout = 'paddle';          // it tips up only where the water is shallow
    // one that keeps to fast water, off it, makes its way back to its riffle: up against the current, or down with it
    if (way.fast > 0.5 && riffle(pos.down) < 0.2 && (bout === 'paddle' || bout === 'drift' || bout === 'hold')) bout = pos.down > bird.home.down ? 'paddle' : 'drift';
    now.bout = bout; now.time = bout === 'flap' ? 1.6 : 4 + r() * 14; now.side = r() < 0.5 ? 1 : -1;
    now.speed = bout === 'paddle' ? -(way.swim[0] + r() * (way.swim[1] - way.swim[0])) * 0.5 : bout === 'peer' ? -0.2 : 0;
    now.bearing = bout === 'drift' ? (r() < 0.4 ? Math.PI : 0) + (r() - 0.5) * 0.8 : null;
    // along the shore to pry and to tip, out in the stream to hold and to peer
    now.target = clamp(bout === 'paddle' || bout === 'tip' ? (Math.sign(pos.across) || 1) * (WIDTH - 1.3 - r() * 1.2) : (r() - 0.5) * 2 * (WIDTH - 2.5), -SWIM, SWIM);
    if (L !== bird) now.time = Math.min(now.time, 6);
  }

  // ---- under the water: in with a plunge, along the bottom or through the water, and up like a bubble
  const dive = {
    wary: false,
    pose: still,
    enter(a) {
      bird.swimmer.on = 'under';
      const D = way.dive;
      // a harlequin walks upstream on the bottom and comes up about where it went down; a merganser swims off under
      // the water, up or down the river
      Object.assign(a.now, { t: 0, phase: 'plunge', low: 0, under: D.time[0] + r() * (D.time[1] - D.time[0]), speed: D.travel * (0.6 + r() * 0.8) * (r() < 0.7 ? -1 : 1) });
      // (Which way it dives is its own, wherever the walker is: turned away from them at any distance, as it was, it
      // answered a walker who had not put it up. Under the water it does not see them; where they were when it went
      // under is kept, for the one thing its own doings owe them: see `under`, below.)
      a.now.eye = world.eye.clone();
      say('diving');
    },
    step(a, dt) {
      const now = a.now, D = way.dive;
      now.t += dt;
      if (now.phase !== 'rise') stroke += dt * 9;        // (it kicks with both feet going down and under the water; coming up they are still)
      atWater();
      // as deep as it goes: on the bottom (a harlequin), or part of the way down (a merganser); always over the bed
      const depth = () => Math.max(world.height(bird.at.x, bird.at.z) + 0.08, pos.level - D.deep);
      if (now.phase === 'plunge') {
        // the plunge: forward and down, the tail flicked up, half a second
        const t = clamp(now.t / 0.5, 0, 1);
        pos.down = inReach(pos.down + Math.sign(now.speed) * 0.4 * dt * (1 - t));
        atWater();
        bird.at.y = pos.level + 0.05 * Math.sin(Math.PI * t) - (pos.level - depth()) * smooth(t);
        body({ pitch: -0.4 - 0.5 * t, lift: floatLift(sheet, -0.4 - 0.5 * t), head: { yaw: 0, pitch: -0.9, roll: 0 }, tail: { pitch: 0.5, fan: 0.2, yaw: 0, prop: null },
          swim: { phase: stroke, kick: 1, both: 1, run: 0 }, neck: { reach: 0.01, rise: -0.01 } });
        if (now.t >= 0.5) { now.phase = 'under'; now.t = 0; bird.cover = true; say(way.beneath); }
        return;
      }
      if (now.phase === 'under') {
        bird.cover = true;
        const was = pos.down, wasAcross = pos.across;
        pos.down = inReach(pos.down + now.speed * dt);
        if ((pos.down < bird.home.down - way.range && now.speed < 0) || (pos.down > bird.home.down + way.range && now.speed > 0)) now.speed = -now.speed;
        // (no nearer, under the water, to where the walker was when it went under than the distance that puts it up
        // at a run, and 4 m: it stops there and comes up there, and not at their feet, where it would be put up at once)
        if (onWater(pos.down, pos.across, _p).distanceTo(now.eye) < way.flush * 1.9 + 4 && _p.distanceTo(now.eye) < onWater(was, pos.across, _w).distanceTo(now.eye)) { pos.down = was; now.speed = 0; }
        pos.across = clamp(pos.across + Math.sin(now.t * 0.7) * 0.1 * dt, -DIVE, DIVE);
        atWater();
        bird.at.y = depth();
        // (nor into another under the water: it turns back)
        if (world.crowd(bird.at, bird) < 0.5) { pos.down = was; pos.across = wasAcross; atWater(); bird.at.y = depth(); now.speed = -now.speed; }
        face(now.speed < 0 ? upstream() : upstream() + Math.PI, dt, 2);
        body({ pitch: -0.15, lift: floatLift(sheet, -0.15), head: { yaw: 0.4 * Math.sin(now.t * 2), pitch: -0.4, roll: 0 }, tail: tail(0.1),
          swim: { phase: stroke, kick: 1, both: 1, run: 0 }, neck: { reach: 0.01, rise: -0.01 } });
        bird.swimmer.down = pos.down; bird.swimmer.across = pos.across;
        // up, where no other is on the water over it (else a little further on, under the water)
        if (now.t >= now.under && world.crowd(onWater(pos.down, pos.across, _p), bird) < 0.7) { now.under += 0.6; pos.across = clamp(pos.across + (pos.across > 0 ? -0.5 : 0.5), -DIVE, DIVE); }
        else if (now.t >= now.under) { now.phase = 'rise'; now.t = 0; now.low = bird.at.y; bird.cover = false; say('coming up'); }
        return;
      }
      // up: it floats up like a bubble, wings and feet still, and pops onto the surface (Michael)
      const t = clamp(now.t / 0.6, 0, 1);
      bird.at.y = now.low + (pos.level - now.low) * t * t + 0.03 * Math.sin(Math.PI * t);
      body({ pitch: 0.25 * (1 - t), lift: floatLift(sheet, 0.25 * (1 - t)), head: { yaw: 0, pitch: 0.2, roll: 0 }, tail: tail(way.cock), swim: { phase: stroke, kick: 0, both: 0, run: 0 }, neck: { reach: 0, rise: 0.006 } });
      if (t >= 1) { last = world.clock; a.to('swim', 'hold', D.gap[0] + r() * (D.gap[1] - D.gap[0])); }
    },
    exit() { bird.cover = false; },
  };

  // ---- on a bar: up out of the water, a while standing, preening, asleep or drying its wings, and back in. Its place
  // there is a berth: the spot on the stones ({ at, down, across, side }: life/places/ducks.js `barSpot`) and the
  // water's edge abreast of it, where it walks out and back (`edge`, at `edgeAcross` from the middle). It is kept on
  // the bird while it is on its way there, on it and at roost on it (`bird.swimmer.spot`), for the other ducks.
  // (`there`: it is on the bar already, as one may be when the walk begins)
  const STONE = 0.05;                              // (it stands on the cobbles, not on the ground between them)
  let berthBefore = null;
  function toBar(a, there = false) {
    const L = leader(), mark = L !== bird && L.swimmer && L.swimmer.spot;
    const side = mark ? mark.side : (pos.across >= 0 ? 1 : -1);
    const near = mark ? mark.down : clamp(pos.down + (r() - 0.5) * 30, bird.home.down - way.range, bird.home.down + way.range);
    for (const s of mark ? [side] : [side, -side]) {
      const found = barSpot(world, near, s, r, mark ? 4 : 10);
      if (!found || !room(found.at, 0.8) || world.trail.distance(found.at.x, found.at.z) < 2.2) continue;
      const edgeAcross = s * (WIDTH - 0.25), berth = { ...found, edgeAcross, edge: onWater(found.down, edgeAcross), level: onWater(found.down, 0).y };
      if (taken(berth)) continue;
      a.to('loaf', berth, there);
      return true;
    }
    return false;
  }
  // Is a berth too near another duck's? Each walks straight out from the water's edge abreast of its berth: two on one
  // side of the river keep 1.2 m apart along it (0.77 m on the inside of the tightest bend, 22 m round, where the lines
  // they walk on draw together).
  const _near = [];
  const taken = (berth) => world.others(berth.at.x, berth.at.z, 60, bird, _near).some((b) => { const o = b.swimmer && b.swimmer.spot; return !!o && o.side === berth.side && Math.abs(o.down - berth.down) < 1.2; });
  const standing = (extra = {}) => body({ pitch: rest.pitch, lift: rest.lift, head: { yaw: 0, pitch: rest.head ? rest.head.pitch : 0, roll: 0 }, tail: tail(rest.tail ? rest.tail.pitch : 0),
    feet: { mode: 'flat', width: rest.feet.width, toeOut: rest.feet.toeOut }, neck: { reach: 0, rise: -0.008 }, ...extra });
  const onStones = () => { bird.at.y = Math.max(world.height(bird.at.x, bird.at.z) + STONE, bird.swimmer.spot ? bird.swimmer.spot.level - 0.02 : -Infinity); };
  const loaf = {
    pose: still,
    enter(a, berth, there = false) {
      Object.assign(a.now, { berth, phase: 'in', t: 0, beat: 0, bout: 'stand', bt: 0, lean: 1, going: false, stay: way.loaf.time[0] + r() * (way.loaf.time[1] - way.loaf.time[0]) });
      bird.swimmer.on = 'water'; bird.swimmer.spot = berth;
      say('swimming in to the bar');
      if (there) {
        bird.at.copy(berth.at); onStones(); pos.down = berth.down; pos.across = berth.across; bird.swimmer.on = 'bar';
        heading = r() * Math.PI * 2; face(heading, 0); a.now.phase = 'on'; nextOnBar(a);
      }
    },
    exit() { berthBefore = bird.swimmer.spot; bird.swimmer.spot = null; },
    step(a, dt) {
      const now = a.now, berth = now.berth;
      if (follow(a)) return;
      now.t += dt; now.beat += dt;
      if (now.phase === 'in') {
        // it swims to the edge (on the water: its place on the river), and waits where another duck is in its way
        const dd = berth.down - pos.down, da = berth.edgeAcross - pos.across, d = Math.hypot(dd, da), go = Math.min(d, 0.6 * dt), before = pos.down, wasAcross = pos.across;
        if (d > 0.05) { pos.down += (dd / d) * go; pos.across += (da / d) * go; }
        atWater();
        if (world.crowd(bird.at, bird) < 0.55) { pos.down = before; pos.across = wasAcross; atWater(); }
        face(Math.atan2(berth.edge.z - bird.at.z, berth.edge.x - bird.at.x), dt, 2);
        stroke += dt * 4;
        afloat(0.02, { swim: { phase: stroke, kick: 0.8, both: 0, run: 0 }, neck: { reach: 0, rise: 0.006 }, tail: tail(way.cock) });
        bird.swimmer.down = pos.down; bird.swimmer.across = pos.across;
        // (not there in good time: it gives the bar up)
        if (now.t > 30 && d > 0.4) { a.to('swim'); return; }
        if (d < 0.1 || now.t > 30) { now.phase = 'out'; now.t = 0; now.from = bird.at.clone(); now.fromAcross = pos.across; now.walk = Math.max(0.6, now.from.distanceTo(berth.at) / 0.32); bird.swimmer.on = 'bar'; say('walking out onto the stones'); }
        return;
      }
      if (now.phase === 'out' || now.phase === 'back') {
        // a heavy, rolling walk, the bill pointed down (Millais), straight out from the water's edge and back
        const out = now.phase === 'out', to = out ? berth.at : berth.edge, from = out ? now.from : berth.at, t = clamp(now.t / now.walk, 0, 1);
        bird.at.lerpVectors(from, to, t);
        onStones();
        pos.down = berth.down; pos.across = out ? now.fromAcross + (berth.across - now.fromAcross) * t : berth.across + (berth.edgeAcross - berth.across) * t;
        face(Math.atan2(to.z - from.z, to.x - from.x), dt, 3);
        standing({ roll: 0.12 * Math.sin(now.t * 7), head: { yaw: 0, pitch: -0.35, roll: 0 }, neck: { reach: 0.004, rise: -0.004 } });
        if (t < 1) return;
        if (!out) { pos.across = berth.side * (WIDTH - 0.3); atWater(); a.to('swim', 'hold', 3 + r() * 5); return; }
        now.phase = 'on'; now.t = 0; nextOnBar(a);
        return;
      }
      // on the bar
      if (world.day < 0.08) { a.to('roost'); return; }
      // (one whose leader has gone back into the water goes after it, at the end of what it is doing, and soon)
      const L = leader();
      if (L !== bird && L.state !== 'loaf' && L.state !== 'roost' && !now.going) { now.going = true; now.stay = 0; now.bt = Math.min(now.bt, 1 + r() * 2.5); }
      now.bt -= dt;
      onStones();
      switch (now.bout) {
        case 'preen': standing({ head: { yaw: now.lean * 2.4, pitch: -0.6 + 0.2 * Math.sin(now.beat * 6), roll: 0.3 }, droop: 0.06 }); say('preening on the stones'); break;
        case 'sleep': standing({ head: { yaw: now.lean * 2.9, pitch: -0.25, roll: 0 }, pitch: rest.pitch - 0.15, lift: rest.lift - 0.08, neck: { reach: -0.01, rise: -0.015 } }); say('asleep on the stones, its bill in its back'); break;
        case 'dry': standing({ spread: 0.45, flap: 0.25, hand: 0.15, sweep: 0.2 }); say('standing with its wings half open, drying them'); break;
        case 'stretch': standing({ spread: 0.9, flap: 0.5 + 0.3 * Math.sin(now.beat * 3), hand: 0.2, pitch: rest.pitch + 0.15 }); bird.snap = true; say('stretching its wings'); break;
        default: standing({ head: { yaw: 0.9 * Math.sin(now.beat * 0.5), pitch: 0, roll: 0 } }); say('standing on the stones');
      }
      if (now.bt > 0) return;
      now.stay -= now.t; now.t = 0;
      if (now.stay > 0 || (L !== bird && L.state === 'loaf')) { nextOnBar(a); return; }
      now.phase = 'back'; now.t = 0; now.walk = Math.max(0.6, berth.at.distanceTo(berth.edge) / 0.32); say('walking back into the water');
    },
  };
  function nextOnBar(a) {
    const now = a.now, k = r();
    now.bout = k < 0.3 ? 'preen' : k < 0.55 ? 'sleep' : k < 0.55 + way.loaf.dry ? 'dry' : k < 0.85 + way.loaf.dry * 0.5 ? 'stand' : 'stretch';
    now.bt = now.bout === 'stretch' ? 1.5 : 6 + r() * 20; now.lean = r() < 0.5 ? 1 : -1;
  }

  // ---- by night: asleep on a bar (its berth kept), or on the water near its edge, out of the current
  const roost = {
    wary: false,
    pose: still,
    enter(a) {
      Object.assign(a.now, { beat: r() * 6, land: bird.swimmer.on === 'bar' && !!berthBefore, side: r() < 0.5 ? 1 : -1 });
      if (a.now.land) bird.swimmer.spot = a.now.berth = berthBefore;
      say('at roost');
    },
    exit() { bird.swimmer.spot = null; },
    step(a, dt) {
      const now = a.now;
      if (world.day >= 0.08) {
        if (!now.land) { a.to('swim'); return; }
        a.to('loaf', now.berth, true);
        return;
      }
      now.beat += dt;
      if (now.land) {
        onStones();
        standing({ pitch: rest.pitch - 0.15, lift: rest.lift - 0.08, head: { yaw: now.side * 2.9, pitch: -0.25, roll: 0 }, neck: { reach: -0.01, rise: -0.015 } });
        say('asleep on the stones');
        return;
      }
      // on the water it keeps to the slack by the edge
      pos.across += clamp((Math.sign(pos.across) || 1) * SWIM - pos.across, -0.1 * dt, 0.1 * dt);
      atWater();
      bird.at.y += 0.005 * Math.sin(world.clock * 2 + now.beat);
      stroke += dt * 2;
      afloat(0.02, { head: { yaw: now.side * 2.9, pitch: -0.2, roll: 0 }, swim: { phase: stroke, kick: 0.15, both: 0, run: 0 }, neck: { reach: 0, rise: -0.012 }, tail: tail(way.cock) });
      bird.swimmer.down = pos.down; bird.swimmer.across = pos.across;
      say('asleep on the water, its bill tucked into its back');
    },
  };

  // ---- in the air: off the water with a patter or off the stones with a spring, low and fast along the river, and
  // down on the water with a skid; or on, out of the walker's sight, and gone. A flight is a plan: where it comes down
  // ({ down, across }, or none: it goes), which way along the river (`dir`, +1 down it), what it rises from
  // ('water', 'bar', 'air'), and whether it only patters off along the surface (`low`).
  const fly = {
    wary: false,
    pose: still,
    enter(a, plan) {
      const now = a.now, from = plan.from || 'water';
      bird.swimmer.on = 'air';
      Object.assign(now, { plan, from, d0: pos.down, a0: clamp(pos.across, -WIDTH - 1.5, WIDTH + 1.5), h0: Math.max(0, bird.at.y - onWater(pos.down, 0, _w).y), s: 0, beat: 0, flown: 0, beyond: 0, last: bird.at.clone() });
      now.bounds = plan.landing ? REACH : WHOLE;
      now.d1 = plan.landing ? plan.landing.down : clamp(now.d0 + plan.dir * 500, now.bounds[0], now.bounds[1]);
      now.a1 = plan.landing ? plan.landing.across : 0;
      now.length = Math.max(0.5, Math.abs(now.d1 - now.d0)); now.dir = Math.sign(now.d1 - now.d0) || plan.dir || 1;
      now.v = from === 'air' ? way.speed * 0.8 : 0.5;
      now.patter = from === 'water' ? (plan.low ? now.length : way.patter) : 0;
      now.top = plan.low ? 0 : way.high * (0.8 + r() * 0.5);
      now.cruise = plan.low ? 4 + r() * 1.5 : way.speed * (0.92 + r() * 0.1);
      // what the visit reads of a flight (life/visit.js: where it comes down, for `crowd`), and that it is on the wing
      bird.flight = { a: bird.at.clone(), d: plan.landing ? onWater(plan.landing.down, plan.landing.across) : onWater(now.d1, 0), time: now.length / now.cruise, t: 0, through: !plan.landing, then: () => {} };
      bird.aloft = true;
      say(plan.low ? 'pattering off along the water' : from === 'water' ? 'pattering along the water to take off' : from === 'bar' ? 'springing up off the stones' : 'flying low along the river');
    },
    step(a, dt) {
      const now = a.now, plan = now.plan;
      if (now.s >= now.length && !plan.landing) { onwards(a, dt); return; }
      // its speed: up to its cruise as it rises, and down to a skid as it comes down
      const braking = plan.landing ? clamp((now.length - now.s) / (plan.low ? 4 : 26), 0, 1) : 1;
      now.v += clamp(now.cruise * (plan.landing ? 0.2 + 0.8 * braking : 1) - now.v, -9 * dt, (now.s < now.patter ? 6 : 9) * dt);
      // Where it is, `s` metres of the river's middle line into its flight (into `out`; and its place on the river).
      // Along the river: from where it rose, out over the middle, to where it comes down. Its height over the water:
      // on it as it patters, up to its height, and down onto it at the end.
      const where = (s, out) => {
        const u = s / now.length, left = now.length - s, pull = plan.low ? 0 : Math.sin(Math.PI * u) ** 0.6 * 0.85;
        pos.down = clamp(now.d0 + now.dir * s, now.bounds[0], now.bounds[1]);
        pos.across = (now.a0 + (now.a1 - now.a0) * smooth(u)) * (1 - pull);
        onWater(pos.down, pos.across, out);
        const rise = now.from === 'air' ? 1 : now.patter > 0 ? smooth((s - now.patter) / 12) : smooth(s / 6);
        const fall = plan.landing ? smooth(left / (plan.low ? 3 : 22)) : 1, base = now.from === 'bar' ? now.h0 * (1 - smooth(s / 4)) : 0;
        out.y += base + now.top * Math.min(rise, fall);
        out.y = Math.max(out.y, world.height(out.x, out.z) + 0.02);          // (off a bar it is over the stones a while)
        return out;
      };
      // Its pace is over the path it flies, not along the river's middle line: off the middle on the outside of a bend
      // (22 m round at the tightest) the path is the longer, and paced by the middle line a merganser went at 26.0 m/s
      // where its way says 25 at the most, a harlequin at 23.6 against 23 (a reviewer's reading, 2026-11-16). So the
      // step along the middle line is the one that takes it as far as it goes in this frame, from where it is.
      let step = now.v * dt;
      const flown = where(Math.min(now.length, now.s + step), _p).distanceTo(bird.at);
      if (flown > 1e-6) step *= clamp(step / flown, 0.5, 1.5);
      now.s = Math.min(now.length, now.s + step);
      stroke += step * 3.2;                                 // (its feet run on the water as it patters, a stride to two metres)
      where(now.s, bird.at);
      const u = now.s / now.length, left = now.length - now.s;
      // which way it faces, and how it banks into the river's turns
      _v.subVectors(bird.at, now.last).setY(0);
      if (_v.lengthSq() > 1e-6) { heading = Math.atan2(_v.z, _v.x); frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q); }
      now.last.copy(bird.at);
      const bank = plan.low ? 0 : clamp(Math.atan((now.v * now.v * bend(pos.down) * now.dir) / G), -0.5, 0.5);
      now.beat += dt * way.hz * Math.PI * 2;
      now.flown += now.v * dt;
      bird.flight.t = u;
      bird.swimmer.down = pos.down; bird.swimmer.across = pos.across;
      // the pose: pattering, low over the water with the neck out, braking, and the skid
      const pattering = now.s < now.patter, skid = !!plan.landing && left < (plan.low ? 0.8 : 2.4), flare = plan.landing && !plan.low ? 1 - smooth(left / 6) : 0;
      const wet = pattering || skid;
      body({ pitch: pattering ? 0.32 : 0.04 + 0.5 * flare, lift: wet ? floatLift(sheet, 0.3) + 0.1 : 0.6, roll: bank,
        spread: skid && left < 0.5 ? 0.5 : 1, flap: (skid ? 0.3 : 0.75) * Math.sin(now.beat) + (skid ? 0.3 : 0.15), hand: 0.5 * Math.sin(now.beat - 1), sweep: 0.12 - 0.3 * flare,
        head: { yaw: 0, pitch: 0, roll: 0 }, tail: { pitch: 0.1 * flare, fan: 0.12 + 0.4 * flare, yaw: 0, prop: null },
        feet: { mode: wet ? 'flat' : 'tuck' }, swim: wet ? { phase: stroke, kick: 0, both: 0, run: 1 } : null,
        neck: { reach: flightPose.neck ? flightPose.neck.reach : 0, rise: flightPose.neck ? flightPose.neck.rise : 0 } });
      bird.snap = true;
      if (!pattering && !plan.low) say(plan.landing ? (left < 20 ? 'coming down on the water' : 'flying low along the river') : 'flying off along the river');
      if (plan.landing) {
        if (now.s >= now.length) { bird.flight = null; bird.aloft = false; atWater(); a.to('swim', 'hold', 2 + r() * 4); }
        return;
      }
      // going: once it is out of the walker's plain sight, and some way off, it is gone
      if (now.flown > 60 && !world.plain(bird.at, bird.size)) { bird.flight = null; bird.left = plan.seconds; a.to('gone'); }
    },
  };
  // One that is going and has come to where the river leaves the world, still plainly seen (through a close-up's long
  // lens, or from far up the valley): straight on and up over the trees, until it is not, or 400 m on.
  function onwards(a, dt) {
    const now = a.now;
    if (now.beyond === 0) now.ahead = new THREE.Vector3(Math.cos(heading), 0, Math.sin(heading));
    now.beyond += now.v * dt;
    bird.at.addScaledVector(now.ahead, now.v * dt);
    bird.at.y = Math.max(bird.at.y + dt * 2.5, world.height(bird.at.x, bird.at.z) + 3);
    now.beat += dt * way.hz * Math.PI * 2;
    body({ pitch: 0.06, lift: 0.6, spread: 1, flap: 0.75 * Math.sin(now.beat) + 0.15, hand: 0.5 * Math.sin(now.beat - 1), sweep: 0.12, feet: { mode: 'tuck' },
      tail: { pitch: 0, fan: 0.12, yaw: 0, prop: null }, neck: { reach: flightPose.neck ? flightPose.neck.reach : 0, rise: flightPose.neck ? flightPose.neck.rise : 0 } });
    bird.snap = true;
    if (!world.plain(bird.at, bird.size) || now.beyond > 400) { bird.flight = null; bird.left = now.plan.seconds; a.to('gone'); }
  }

  // Somewhere on the water `far` metres along the river ([least, most]), the way `dir`, clear of the walker; or null.
  // One that keeps to fast water comes down on a riffle if one of the places tried is on one.
  const landingAt = (dir, far) => {
    let best = null, most = -1;
    for (let tries = 0; tries < 6; tries += 1) {
      const down = inReach(pos.down + dir * (far[0] + r() * (far[1] - far[0]))), across = (r() - 0.5) * 2 * (WIDTH - 2.2);
      if (Math.abs(down - pos.down) < far[0] * 0.6) continue;
      if (!room(onWater(down, across, _p), 1)) continue;
      const k = way.fast > 0.5 ? riffle(down) : 0;
      if (k > most) { best = { down, across }; most = k; }
      if (way.fast <= 0.5 || k > 0.3) break;
    }
    return best;
  };
  // which way along the river is away from the walker: the way whose first 30 m take it further from them
  const away = () => (onWater(pos.down + 30, pos.across, _p).distanceTo(world.eye) >= onWater(pos.down - 30, pos.across, _w).distanceTo(world.eye) ? 1 : -1);
  // into the air; the first of a party to go (`first`) says where to, for the rest
  const takeOff = (plan, first = true) => {
    plan.from = plan.from || (bird.swimmer.on === 'bar' ? 'bar' : 'water');
    if (first) shared.flight = { clock: world.clock, landing: plan.landing, dir: plan.dir, seconds: plan.seconds, low: plan.low, by: bird, followed: [] };
    a.to('fly', plan);
    return true;
  };
  // One of a party follows another into the air, a moment after it (`wait` false: at once, as when it is flushed
  // itself), and comes down beside it, or goes off with it.
  function follow(a, wait = true) {
    const s = shared.flight;
    if (!fresh(s, 4) || s.by === bird || s.followed.includes(bird)) return false;
    if (wait) { if (a.now.lag == null) a.now.lag = 0.3 + r() * 0.8; if (world.clock - s.clock < a.now.lag) return false; }
    s.followed.push(bird);
    if (!s.landing) return leave(s.seconds ?? a.awhile(), false);
    // Where it comes down: behind the leader's landing and to one side, its place in the line; or the other side, or
    // a place or two further back; or, with none of those clear of the walker and of other animals, on a landing of
    // its own the same way along the river. Never on the leader's own landing, as it once did when its place was not
    // clear: two ducks on one spot keep each other there, since `swim` undoes any move that leaves it within 0.55 m
    // of another. With nowhere at all it stays (one left far behind its leader flies to it later: `swim`).
    const k = s.followed.length, side = k % 2 ? 0.9 : -0.9;
    let landing = null;
    for (const [back, to] of [[k, side], [k, -side], [k + 1, side], [k + 1, -side], [k + 2, side]]) {
      const one = { down: inReach(s.landing.down - s.dir * 1.3 * back), across: clamp(s.landing.across + to, -SWIM, SWIM) };
      if (room(onWater(one.down, one.across, _p), 0.6)) { landing = one; break; }
    }
    landing = landing || landingAt(Math.sign(s.landing.down - pos.down) || s.dir, s.low ? [12, 30] : way.refuge);
    return landing ? takeOff({ landing, dir: s.dir, low: s.low }, false) : false;
  }

  // Off along the river out of the walker's plain sight, and gone: for `seconds` (Infinity: for good). Not from under
  // the water, nor from the air.
  const leave = (seconds, first = true) => {
    if (a.cast || bird.swimmer.on === 'under' || bird.swimmer.on === 'air') return false;
    return takeOff({ landing: null, dir: away(), seconds }, first);
  };
  // In from out of the walker's plain sight: low along the river from up or down it, to come down on the water at `spot`.
  const come = (spot) => {
    for (let tries = 0; tries < 8; tries += 1) {
      const dir = r() < 0.5 ? 1 : -1, start = inReach(spot.down - dir * (90 + r() * 160));
      onWater(start, 0, _p); _p.y += way.high;
      if (Math.abs(start - spot.down) < 60 || world.plain(_p, bird.size)) continue;
      pos.down = start; pos.across = 0;
      bird.at.copy(_p);
      return takeOff({ landing: spot, dir, from: 'air' }, false);
    }
    return false;
  };

  return {
    activities: { swim, dive, loaf, roost, fly },
    // Flushed: off along the water in a patter, or off low along the river and down on it further away, the way away
    // from the walker; after the rest of its party, if they are off already.
    refuge() {
      if (bird.swimmer.on === 'under' || bird.swimmer.on === 'air') return false;
      if (follow(a, false)) return true;
      const dir = away();
      if (bird.swimmer.on === 'water' && r() < way.patters) { const landing = landingAt(dir, [12, 30]); if (landing) return takeOff({ landing, dir, low: true }); }
      const landing = landingAt(dir, way.refuge);
      return landing ? takeOff({ landing, dir }) : false;
    },
    leave: (seconds) => leave(seconds),
    come: (spot) => come(spot),
    // Where it is when it comes: on the water about its home, beside its leader if it has one here (one there when the
    // walk begins: now and then on a bar); one that comes later flies in along the river and comes down there. By
    // night nothing comes in.
    begin() {
      const spot = { down: inReach(bird.home.down + (r() - 0.5) * way.range), across: (r() - 0.5) * 2 * (WIDTH - 2.5) };
      const L = leader(), onBar = L !== bird && L.swimmer && L.swimmer.spot;
      if (onBar) { spot.down = inReach(onBar.down + 1.5); spot.across = onBar.side * SWIM; }
      else if (L !== bird && L.swimmer) { spot.down = inReach(L.swimmer.down + 1.3 * place()); spot.across = clamp(L.swimmer.across + 0.9, -SWIM, SWIM); }
      pos.down = spot.down; pos.across = spot.across; atWater();
      heading = upstream(); frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q);
      if (a.cast || a.life.first) {
        const night = world.day < 0.08;
        if (onBar && toBar(a, true)) { if (night) a.to('roost'); return; }
        if (L === bird && r() < way.loaf.chance * 3 && toBar(a, true)) { if (night) a.to('roost'); return; }
        a.to(night ? 'roost' : 'swim');
        return;
      }
      if (world.day < 0.08) { bird.left = 30 + r() * 60; return; }
      if (!room(onWater(spot.down, spot.across, _p), 0.6) || !come(spot)) bird.left = 8 + r() * 12;
    },
  };
}

// A home: a stretch of the river within HOMES (life/places/ducks.js), about the kind's own water, and not another
// party's of its kind. One that keeps to fast water is given a riffle, the likelier the more broken the water is; one
// that does not, a pool in a bend: off the riffles, the likelier the more sharply the river turns there.
const swimHome = (r, taken, fast) => {
  for (let tries = 0; tries < 80; tries += 1) {
    const down = HOMES[0] + r() * (HOMES[1] - HOMES[0]), k = riffle(down);
    if (r() > (fast ? k : (1 - k) * clamp(Math.abs(bend(down)) / 0.03, 0.25, 1))) continue;
    if (taken.some((home) => Math.abs(home.down - down) < 60)) continue;
    const mid = middle(down);
    return { x: mid.x, z: mid.z, down };
  }
  return null;
};

export default {
  // what a swimmer's way holds besides what every way has (life/families/index.js)
  fields: {
    fast: 'number',                                 // 0..1: how much it keeps to riffles (1) rather than pools (0)
    range: 'number',                                // metres up and down the river from its home that it keeps to
    stay: nums(2),                                  // seconds before it goes off, for a while or for good
    hz: 'number', speed: 'number', high: 'number',  // wingbeats a second; m/s in the air; metres over the water it flies
    patter: 'number',                               // metres it patters along the water before it is up
    patters: 'number',                              // the chance a flush is a patter off along the water, not a flight
    refuge: nums(2),                                // how far along the river a flight from the walker takes it, metres
    swim: nums(2),                                  // m/s it paddles through the water
    sink: 'number',                                 // how much lower it swims upstream (a share of its legs' length)
    cock: 'number',                                 // how far its tail is cocked up on the water (radians)
    beneath: 'string',                              // what it is doing under the water, in the card's words
    bouts: list(tuple(oneOf(...BOUTS), 'number'), 1),   // its bouts on the water, each with its weight
    dive: { chance: 'number', time: nums(2), gap: nums(2), travel: 'number', deep: 'number' },
    loaf: { chance: 'number', time: nums(2), dry: 'number' },
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    voice: optional({ every: nums(2), reach: 'number' }),
  },
  act: (way) => (bird, world) => live(bird, world, way, swimmer),
  home: (way) => (habitat, r, taken) => swimHome(r, taken, way.fast > 0.5),
};
