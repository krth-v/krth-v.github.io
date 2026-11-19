import * as THREE from 'three';
import { frame, UP, flying } from '../agents.js';
import { live, WARY, raise } from '../behave.js';
import { optional, nums, oneOf } from '../bodies.js';
import { SHAPE, WORLD, river } from '../../world/land.js';
import { FINE } from '../../world/terrain.js';

// Birds of prey (the raptors', 2026-11-16): the Bald Eagle of the river, and the three hawks of the wood, Cooper's, the
// Sharp-shinned and the goshawk. A kind's way says which life it lives (`manner`: 'eagle' or 'hawk'). Both live on
// life/behave.js: they go on with what they are doing until the walker is too near or moves suddenly, and then they
// are off, to another perch or out of sight.
//
// The eagle. It perches on the top of a tall tree or a snag by the river, facing the water, and watches it; now and
// then it calls, its head thrown back. From its perch it soars, in wide circles over the river on flat wings, banked
// into its turn, rising as it circles and drifting along the valley; or flies along the river, beating and gliding, a
// few metres to twenty over the water; or hunts: out along the river, a long shallow stoop down onto the water, and a
// snatch with its feet thrown forward, which comes up with a fish about half the time. With a fish it labours low
// over the river to the bar's stones, lands on it, mantles over it and tears at it for a minute or so, then is up
// again; or it carries it off along the valley to its nest. Or it goes to another top. In May it has a nest with young
// somewhere else, so it comes and goes: in from far along the valley, and off the same way, high, until the walker
// cannot plainly see it. On the wing it steers itself (`wings`, below), so that a circle is a circle and a long glide
// is a long glide; its short flights, and its landing on a top or the bar, are the skeleton's. How it holds itself at
// every moment is its sheet's poses (life/species/baldEagle.js: perched, alert, call, soar, bank, glide, flapUp and
// flapDown, stoop, snatch, carry, land, stand, mantle, tear), laid by the eagle's own `lay` and `hold` (2026-11-19).
//   What was read (the research of 2026-11-16, .local-assets/forest/research/birds-wave2-2026-11-16.json: BirdWeb and
//   Wikipedia, read through tools that return a page's text): it perches in trees near water; it soars on flat wings
//   with strong, slow wingbeats; it glides and flaps at 56 to 70 km/h; it swoops to the water or the ground with its
//   feet thrust forward, for live fish, and eats dead salmon; its call is weak, staccato, chirping whistles; in mid-May
//   an adult is at or near a nest with young. The agent's own: every distance, height, time and chance below, and
//   which trees it perches on (the tops of the tallest by the water that the world reads: no source gave one); and, of
//   2026-11-19, from no source read: the stoop's slant, how often a strike takes a fish, that it eats on a bar's stones,
//   mantling, and how long a meal takes, which are from general knowledge of the bird.
//
// The hawks. Each keeps to a part of the wood. It perches inside the canopy, on a bough or the stub of a limb, still,
// its head turning in quick jerks; and after a little it is off on a dash, low through the trees, beating and gliding,
// past whatever small bird it has seen and on to another perch, or out of sight and gone. A hawk on a dash raises an
// alarm (life/behave.js `raise`): the small birds within its reach flush, as they flush from a walker too near.
//   What was read (the same research: Birds of the World's Behavior pages through a summary tool, BirdWeb, Bent 1937,
//   Wikipedia): Cooper's hunts close to the ground or below the canopy, perch-hunts much of the day, approaches through
//   dense cover and strikes with a quick dash, its flight several rapid beats and a short glide, low and swift; in the
//   breeding season it spends much of the day perched, in short stretches between brief flights, and is reclusive and
//   hard to see. The Sharp-shinned approaches stealthily and bursts into speed, hunts small birds in dense forest by
//   surprise, its flight three to six shallow beats and a short glide; it is rarely seen in the breeding season. The
//   goshawk approaches through dense cover, takes grouse, jays and squirrels, its beats slower and deeper; it is rare
//   here in May. The agent's own: every distance, height, time and chance below; that a hawk's dash puts up the small
//   birds near it (no source said how near); and how near each lets a walker come (not found for any).
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _u = new THREE.Vector3(), _q = new THREE.Quaternion(), _r = [0, false, 0, 0, 0];

// ---- the river, as the eagle uses it: its middle line (world/land.js), metres down it, the water's height
const LINE = SHAPE.RIVER, ALONG = SHAPE.riverAlong, LAST = ALONG.length - 1, END = ALONG[LAST];
// the point `at` metres down the river's middle line, at the water's height there (into `out`)
function downRiver(at, out) {
  const a = clamp(at, 0, END);
  let lo = 0, hi = LAST;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (ALONG[mid] <= a) lo = mid; else hi = mid; }
  const f = (a - ALONG[lo]) / Math.max(ALONG[hi] - ALONG[lo], 1e-6);
  const x = LINE[lo][0] + (LINE[hi][0] - LINE[lo][0]) * f, z = LINE[lo][1] + (LINE[hi][1] - LINE[lo][1]) * f;
  river(x, z, _r);
  return out.set(x, _r[2], z);
}
const alongOf = (x, z) => river(x, z, _r)[4];
// the ground's height, asked only within the world (beyond it the valley is not drawn, and nothing flies there)
const groundAt = (world, x, z) => {
  const h = world.height(clamp(x, WORLD.minX + 2, WORLD.maxX - 2), clamp(z, WORLD.minZ + 2, WORLD.maxZ - 2));
  return Number.isFinite(h) ? h : -6.6;
};
const within = (p) => p.x > WORLD.minX + 10 && p.x < WORLD.maxX - 10 && p.z > WORLD.minZ + 10 && p.z < WORLD.maxZ - 10;

// ---- On the wing, steering itself: where it heads (seen from above), how fast it goes and climbs, kept between frames.
function wings(bird, world, way, r) {
  // (`last`: how it held itself in the last frame of a flight it steered, or null once it has perched or is about to
  // open its wings from a perch: see `held`)
  const w = { hx: 1, hz: 0, v: 0, vy: 0, roll: 0, turn: 0, open: 1, g: 1, glide: 0, gliding: true, last: null };
  // from the way the bird faces now, at `speed` (with its wings to open, from a perch)
  w.start = (speed, open = 1) => {
    _v.set(1, 0, 0).applyQuaternion(bird.q).setY(0);
    if (_v.lengthSq() < 1e-6) _v.set(1, 0, 0);
    _v.normalize();
    Object.assign(w, { hx: _v.x, hz: _v.z, v: speed, vy: 0, roll: 0, turn: 0, open, g: open < 1 ? 0 : 1, glide: 0, gliding: open >= 1 });
    if (open < 1) w.last = null;
  };
  // Towards `goal`: turning at most `turn` radians a second, at `speed` m/s, climbing at most `climb` m/s and sinking
  // at most `sink`, never nearer the ground than `clear` m where it is or where it will be in `ahead` seconds (and never
  // under it). Moves the bird and turns it, and returns how far the goal is, seen from above.
  w.steer = (dt, goal, { speed, turn, climb = 2, sink = 4, clear = 6, ahead = 2.5 }) => {
    const dx = goal.x - bird.at.x, dz = goal.z - bird.at.z, d = Math.hypot(dx, dz);
    const err = d > 0.05 ? Math.atan2(w.hx * dz - w.hz * dx, w.hx * dx + w.hz * dz) : 0;      // (+: the goal is to its right)
    const step = clamp(err, -turn * dt, turn * dt), c = Math.cos(step), s = Math.sin(step);
    const hx = w.hx * c - w.hz * s, hz = w.hz * c + w.hx * s, n = Math.hypot(hx, hz) || 1;
    w.hx = hx / n; w.hz = hz / n; w.turn = step / dt;
    w.v += clamp(speed - w.v, -3 * dt, 2.5 * dt);
    const floor = Math.max(groundAt(world, bird.at.x, bird.at.z), groundAt(world, bird.at.x + w.hx * w.v * ahead, bird.at.z + w.hz * w.v * ahead)) + clear;
    const want = clamp((Math.max(goal.y, floor) - bird.at.y) * 0.5, -sink, bird.at.y < floor ? Math.max(climb, 3) : climb);
    w.vy += clamp(want - w.vy, -3 * dt, 3 * dt);
    bird.at.x += w.hx * w.v * dt; bird.at.z += w.hz * w.v * dt; bird.at.y += w.vy * dt;
    const least = groundAt(world, bird.at.x, bird.at.z) + 0.4;
    if (bird.at.y < least) { bird.at.y = least; w.vy = Math.max(0, w.vy); }
    w.roll += (clamp(Math.atan((w.v * w.turn) / 9.8), -0.75, 0.75) - w.roll) * (1 - Math.exp(-dt * 3));       // banked into the turn
    frame(_u.set(w.hx, 0, w.hz), UP, bird.q);
    return d;
  };
  // Its wings: 'soar' (out flat, the tail spread), 'glide' (out, the wrists a little back), 'flap' (beating) or
  // 'pulse' (a few beats and a glide: `way.pulse`, [beats, seconds gliding]). Laid on `want` with the rest of how it
  // holds itself on the wing; `extra` over it.
  w.pose = (mode, dt, extra = null) => {
    bird.beat += dt * way.hz * Math.PI * 2;
    if (mode === 'pulse') {
      w.glide -= dt;
      if (w.glide <= 0) { w.gliding = !w.gliding; w.glide = w.gliding ? way.pulse[1] * (0.6 + r() * 0.8) : way.pulse[0] / way.hz; }
    }
    const gliding = mode === 'soar' || mode === 'glide' || (mode === 'pulse' && w.gliding);
    w.g += ((gliding ? 1 : 0) - w.g) * (1 - Math.exp(-dt * 7));
    w.open = Math.min(1, w.open + dt * 2.5);
    const beatFlap = 0.7 * Math.sin(bird.beat) + 0.12, beatHand = 0.45 * Math.sin(bird.beat - 1);
    const flat = mode === 'soar' ? 0.07 : 0.03, hand = mode === 'soar' ? -0.06 : -0.02, sweep = mode === 'soar' ? -0.02 : 0.14;
    Object.assign(bird.want, { pitch: 0.04 + clamp(w.vy / Math.max(w.v, 1), -0.35, 0.35) * 0.7, lift: 0.6, roll: w.roll, lean: 0, spread: w.open,
      flap: beatFlap + (flat - beatFlap) * w.g, hand: beatHand + (hand - beatHand) * w.g, sweep: 0.1 + (sweep - 0.1) * w.g, droop: 0, gape: 0,
      head: { yaw: clamp(w.turn * 0.5, -0.5, 0.5), pitch: -0.2, roll: 0 }, tail: { pitch: 0, fan: mode === 'soar' ? 0.55 : 0.12 + 0.3 * Math.abs(w.roll), prop: null },
      feet: { mode: 'tuck' } }, extra);
    bird.snap = true;
    w.last = { ...bird.want };
  };
  // What an activity it goes into on the wing lays on its rest pose as it begins (an activity's `pose`): how it held
  // itself a frame ago. A steered flight sets `snap` (wings beat too fast to be eased), and `a.to` lays the rest pose,
  // which is a perched bird's: going from one flight into the next in one step, it was drawn for a frame with its
  // wings shut. Off a perch there is nothing held, and the rest pose stands, as it should.
  w.held = () => w.last;
  return w;
}

// A flight of the skeleton's (a short one, and the last of a long one, onto a perch): its middle glided, the bank of a
// steered flight before it let out.
function flight(bird, way, w) {
  return {
    wary: false,
    pose: w.held,
    step(a, dt) {
      const f = bird.flight, roll = bird.want.roll || 0;
      flying(bird, dt, way.hz);
      if (!f || bird.flight !== f) return;                   // (it has landed: the next activity's pose stands)
      bird.want.roll = roll * Math.exp(-dt * 4);
      const g = f.time > 1 ? clamp(Math.min((f.t - 0.15) / 0.1, (0.78 - f.t) / 0.1), 0, 1) : 0;
      if (g > 0) Object.assign(bird.want, { flap: bird.want.flap + (0.04 - bird.want.flap) * g, hand: bird.want.hand + (-0.03 - bird.want.hand) * g });
    },
  };
}

// ---- the eagle's places: the tops of the tall trees and snags by the river that the world reads (within 46 m of the
// walk: life/habitat.js), each with the way to the water from it
function topOf(t) {
  const k = t.heights.length - 1, ax = t.axis[k], snag = t.kind === 'snag';
  const at = new THREE.Vector3(ax.x, 0, ax.z).applyQuaternion(t.yaw).multiplyScalar(t.scale).add(t.foot);
  at.y = t.foot.y + t.top - (snag ? 0.12 : 0.02);
  const along = alongOf(at.x, at.z), water = downRiver(along, new THREE.Vector3());
  const face = new THREE.Vector3(water.x - at.x, 0, water.z - at.z);
  if (face.lengthSq() < 1e-6) face.set(1, 0, 0);
  face.normalize();
  return { at, face, snag, kind: t.kind, along, round: clamp(ax.reach * t.scale, 0.03, 0.08), above: at.y - water.y };
}
// A broad-leaved crown closes over its own top (an alder's leaves stand a metre over its trunk), so the eagle takes
// the top of a conifer or a snag. A hemlock's leader nods over (the terrace's grown hemlock, `mature`, and the
// valley's, `slope`, whose trunk ends under its painted leader), and no eagle stands on that: a spruce's straight top,
// a snag's and an old fir's (`STOUT`) come first. And a top is one the walk can see it on when nothing within 8 m
// stands as high (`over`) and it is among the first trees back from the water (`edge`, m from the water's edge): a
// top inside a stand is looked up at through the crowns in front of it. (The close-ups of a perched eagle from the
// beach, before and after `over` and `edge`, were frames of conifer boughs with the bird mostly behind them; which
// tree it sat on, the frames do not say, and `STOUT` has not been run in the forest.) Of the stout tops, those over
// their neighbours by the water while there are three, then those over their neighbours; failing both, the same two
// tiers of any top that is not broad-leaved, then any.
const BROAD = new Set(['alder', 'maple', 'apple', 'vine']), STOUT = new Set(['spruce', 'snag', 'giant']);
// And the bar's stones, where it stands on a fish to eat it (2026-11-19): spots on the cobbles a stride and more from
// the water and from the bank's foot, fairly level, and on the fine sheet of the ground (life/habitat.js: further off
// the ground is drawn coarser than its height knows, and nothing is stood on it); each with the way to the water. How
// far each is from the walk is asked the first time it is wanted (`off`). Read once a world: they are the same on
// every visit, and no random number is drawn for them.
const BARS = new WeakMap();
function barsOf(habitat, R) {
  let list = BARS.get(habitat);
  if (list) return list;
  list = [];
  const mid = new THREE.Vector3(), next = new THREE.Vector3();
  for (let along = R.reach[0]; along <= R.reach[1]; along += 4) {
    downRiver(along, mid); downRiver(along + 2, next);
    const n = Math.hypot(next.x - mid.x, next.z - mid.z) || 1, ax = -(next.z - mid.z) / n, az = (next.x - mid.x) / n;
    for (const side of [1, -1]) {
      for (let off = 8; off <= 30; off += 2) {
        const x = mid.x + ax * side * off, z = mid.z + az * side * off;
        if (!(x > FINE.minX + 2 && x < FINE.maxX - 2 && z > FINE.minZ + 2 && z < FINE.maxZ - 2)) continue;
        river(x, z, _r);
        if (_r[0] < 1.5 || _r[0] > _r[3] - 0.8 || habitat.ground(x, z) !== 'stones') continue;
        const y = habitat.height(x, z);
        if (!Number.isFinite(y) || Math.abs(habitat.height(x + 0.8, z) - habitat.height(x - 0.8, z)) > 0.3 || Math.abs(habitat.height(x, z + 0.8) - habitat.height(x, z - 0.8)) > 0.3) continue;
        list.push({ at: new THREE.Vector3(x, y, z), face: new THREE.Vector3(mid.x - x, 0, mid.z - z).normalize(), along, off: null });
      }
    }
  }
  BARS.set(habitat, list);
  return list;
}
const eagleHome = (R) => (habitat) => {
  const all = [];
  for (const t of habitat.trunks) {
    if (t.top < R.top[0] || t.top > R.top[1] || BROAD.has(t.kind)) continue;
    river(t.foot.x, t.foot.z, _r);
    if (_r[0] > R.water || _r[0] < 0) continue;
    const top = topOf(t), y = t.foot.y + t.top;
    top.edge = _r[0] <= R.edge;
    top.over = !habitat.trunks.some((o) => o !== t && Math.abs(o.foot.x - t.foot.x) < 8 && Math.abs(o.foot.z - t.foot.z) < 8 && Math.hypot(o.foot.x - t.foot.x, o.foot.z - t.foot.z) < 8 && o.foot.y + o.top > y - 0.5);
    all.push(top);
  }
  const tiers = (list) => [list.filter((t) => t.over && t.edge), list.filter((t) => t.over)].find((one) => one.length >= 3);
  return { tops: tiers(all.filter((t) => STOUT.has(t.kind))) || tiers(all) || all, bars: barsOf(habitat, R) };
};

// A number of one of the sheet's poses, or `fallback` where the pose leaves it out; and a share of the way between two.
const num = (p, name, fallback = 0) => (p && p[name] != null ? p[name] : fallback);
const mix = (a, b, k) => a + (b - a) * k;
// (the numbers of a raptor's pose that the eagle lays from its sheet's poses: life/rig.js and life/parts/raptor.js)
const NUMS = ['pitch', 'lift', 'lean', 'spread', 'flap', 'hand', 'sweep', 'droop', 'wrist', 'twist'];

function eagle(a) {
  const { bird, world, way, r } = a, home = bird.home, R = way.river, w = wings(bird, world, way, r);
  const P = bird.sheet.poses, goal = new THREE.Vector3(), here = new THREE.Vector3(), strike = new THREE.Vector3();
  const stay = () => way.stay[0] + r() * (way.stay[1] - way.stay[0]);
  const span = (pair) => pair[0] + r() * (pair[1] - pair[0]);
  let top = null, calls = way.call ? span(way.call.every) : Infinity;
  // How much of a fish it has in its feet: 0 none, 1 a whole one, less as it eats it (a pose's `prey`, which draws the
  // sheet's fish in towards nothing). Kept across its activities: it carries the fish from the water to where it eats.
  let fish = 0;
  // How it held itself in the last frame it was on the wing (`LAST`), for the activity it goes into next to begin
  // from (`held`: a steered flight snaps its wings, and `a.to` lays the rest pose, a perched bird's). `aloft`: false
  // once it stands, and then nothing is held.
  const HEAD = { yaw: 0, pitch: 0, roll: 0 }, TAIL = { pitch: 0, fan: 0, yaw: 0, prop: null }, LAST = {};
  let aloft = false;
  const held = () => (aloft ? LAST : null);

  // ---- how it holds itself, from its sheet's poses (life/species/baldEagle.js)
  // On the wing, `mode`: 'soar' (rolled towards the sheet's 'bank' as it banks in its circle), 'glide', 'stoop',
  // 'snatch', 'flap' (beating between the sheet's two ends of a beat, the hand a little behind the arm), 'pulse' (a
  // few beats and a glide: `way.pulse`) or 'carry' (labouring: more beats and shorter glides, `R.labour`, with the
  // fish in its feet as the sheet's `carry` holds it); eased `k` of the way towards the sheet's pose `toward` (its
  // landing, coming in). Its attitude is its steering's: rolled into its turn, nose up as it climbs and down as it
  // sinks. Nothing is made: the head, the tail and the record of it are this bird's own tables, the feet the sheet's.
  const lay = (mode, dt, toward = null, k = 0) => {
    const want = bird.want, labour = mode === 'carry', pulse = mode === 'pulse' || labour, beats = pulse || mode === 'flap';
    bird.beat += dt * way.hz * (labour ? 0.85 : 1) * Math.PI * 2;
    if (pulse) {
      w.glide -= dt;
      if (w.glide <= 0) { const p = labour ? R.labour : way.pulse; w.gliding = !w.gliding; w.glide = w.gliding ? p[1] * (0.6 + r() * 0.8) : p[0] / way.hz; }
    }
    w.g += ((mode === 'flap' ? 0 : pulse ? (w.gliding ? 1 : 0) : 1) - w.g) * (1 - Math.exp(-dt * 7));
    w.open = Math.min(1, w.open + dt * 2.5);
    const base = labour ? P.carry : beats ? P.glide : P[mode], B = P.bank, U = P.flapUp, D = P.flapDown, T = toward ? P[toward] : null;
    const bank = mode === 'soar' ? clamp(Math.abs(w.roll) / 0.5, 0, 1) : 0, push = 1 - w.open;
    const s = 0.5 + 0.5 * Math.sin(bird.beat), sh = 0.5 + 0.5 * Math.sin(bird.beat - 1), g = w.g;
    for (let i = 0; i < NUMS.length; i += 1) {
      const name = NUMS[i];
      let v = num(base, name);
      if (bank > 0) v = mix(v, num(B, name), bank);
      if (g < 1 && (name === 'flap' || name === 'hand' || name === 'sweep' || name === 'wrist')) v = mix(mix(num(D, name), num(U, name), name === 'hand' ? sh : s), v, g);
      if (push > 0) v = mix(v, num(P.takeoff, name), push * 0.8);         // (off a perch or the ground: the push off, its wings thrown up as they open)
      if (T && k > 0) v = mix(v, num(T, name), k);
      want[name] = v;
    }
    want.pitch += clamp(w.vy / Math.max(w.v, 1), -0.35, 0.35) * (mode === 'stoop' || mode === 'snatch' ? 0.2 : 0.7);
    want.roll = w.roll; want.lean = 0; want.droop = 0; want.gape = 0; want.spread = w.open; want.prey = fish;
    HEAD.yaw = clamp(w.turn * 0.5, -0.5, 0.5); HEAD.pitch = num(base.head, 'pitch', -0.15); HEAD.roll = 0;
    TAIL.pitch = num(base.tail, 'pitch'); TAIL.fan = mix(num(base.tail, 'fan'), num(B.tail, 'fan'), bank); TAIL.yaw = Math.sign(w.roll) * num(B.tail, 'yaw') * bank;
    let feet = base.feet;
    if (T && k > 0) {
      HEAD.pitch = mix(HEAD.pitch, num(T.head, 'pitch'), k); TAIL.pitch = mix(TAIL.pitch, num(T.tail, 'pitch'), k); TAIL.fan = mix(TAIL.fan, num(T.tail, 'fan'), k);
      if (k > 0.5) feet = T.feet;
    }
    want.head = HEAD; want.tail = TAIL; want.feet = feet;
    bird.snap = true; aloft = true;
    Object.assign(LAST, want);
  };
  // Standing (on a top, on the bar's stones): one of the sheet's standing poses (perched, alert, call, stand, mantle,
  // tear), its head turned `yaw` and pitched `pitch` (as the pose has it, if null), its bill open `gape`, on `feet`.
  const hold = (p, yaw, pitch, gape, feet) => {
    const want = bird.want;
    for (let i = 0; i < NUMS.length; i += 1) want[NUMS[i]] = num(p, NUMS[i]);
    want.roll = 0; want.gape = gape; want.prey = fish;
    if (want.head === HEAD) want.head = { yaw: 0, pitch: 0, roll: 0 };      // (a table of its own, not the wing's)
    if (want.tail === TAIL) want.tail = { pitch: 0, fan: 0, yaw: 0, prop: null };
    const h = want.head, t = want.tail;
    h.yaw = yaw; h.pitch = pitch == null ? num(p.head, 'pitch') : pitch; h.roll = 0;
    t.pitch = num(p.tail, 'pitch'); t.fan = num(p.tail, 'fan'); t.yaw = 0;
    want.feet = feet;
    aloft = false;
  };
  // Never under the river's surface (the steering keeps it off the ground, and under the water the ground is the bed).
  const aboveWater = () => { river(bird.at.x, bird.at.z, _r); if (_r[0] < 0.5 && bird.at.y < _r[2] + 0.35) bird.at.y = _r[2] + 0.35; };
  // (and off the ground, where it is let down by its own hand and not by the steering, which keeps it so: its stoop and
  // its snatch, which can run on over a bar or a bank)
  const aboveGround = () => { const least = groundAt(world, bird.at.x, bird.at.z) + 0.4; if (bird.at.y < least) bird.at.y = least; };

  // Is a place, from where the bird is, on the walker's side, seen from above? A flushed bird never flies at or past
  // what put it up: put up, it goes nowhere that is.
  const towards = (p) => (p.x - bird.at.x) * (world.eye.x - bird.at.x) + (p.z - bird.at.z) * (world.eye.z - bird.at.z) > 0;
  // a top it may go to: free, clear of the walker (and, flushed, `further` from them than it is now and not on their
  // side of it: further alone, measured from a top 35 m over them, let it go to a taller top beyond them, and of 24
  // flushes in a probe of 2026-11-16 four took it straight over their head), a snag before a tree
  const pickTop = (further = false) => {
    const far = bird.at.distanceTo(world.eye);
    const all = home.tops.filter((t) => t !== top && world.free(t.at, bird, 1.5) && a.clear(t.at, 4) && (!further || (t.at.distanceTo(world.eye) > far + 5 && !towards(t.at))));
    if (!all.length) return null;
    let sum = 0;
    const weights = all.map((t) => { const one = (t.snag ? 2.5 : 1) * (t.above < 32 ? 1.5 : 1); sum += one; return one; });
    let k = r() * sum;
    for (let i = 0; i < all.length; i += 1) { k -= weights[i]; if (k <= 0) return all[i]; }
    return all[all.length - 1];
  };
  // A spot on the bar's stones to eat a fish on: far enough from the walk that a walker on it passes by at a walk
  // (`R.bar`), clear of the walker where they are now, free, within `R.barReach` of it along the river; one 40 to 150 m
  // from the walker, where they could see it, and a near one, before others. (`further`: flushed off one, a spot
  // further from the walker than it is, and not on their side.)
  const barSpot = (further = false) => {
    const from = alongOf(bird.at.x, bird.at.z), far = bird.at.distanceTo(world.eye);
    let best = null, most = -Infinity;
    for (const s of home.bars) {
      if (Math.abs(s.along - from) > R.barReach) continue;
      if (s.off == null) s.off = world.trail.distance(s.at.x, s.at.z);
      if (s.off < R.bar || !a.clear(s.at, 6) || !world.free(s.at, bird, 2)) continue;
      const d = s.at.distanceTo(world.eye);
      if (further && (d < far + 5 || towards(s.at))) continue;
      const score = r() * 40 - Math.abs(s.along - from) * 0.25 + (d > 40 && d < 150 ? 25 : 0);
      if (score > most) { most = score; best = s; }
    }
    return best;
  };
  const facing = (t, q) => frame(t.face, UP, q);
  const said = (t) => (t.snag ? 'on the top of a snag by the river' : t.kind === 'alder' ? 'on the top of an alder by the river' : 'on the top of a tall tree by the river');
  // off a perch or the bar: its wings open as it goes
  const up = (speed = 5) => { if (!aloft) w.start(speed, 0); };

  // ---- where it goes on the wing
  // A circle over the river, a little way along it from where it is, near enough the walker to be seen from the beach
  // and the clearing: 35 to 160 m from them seen from above, and (by `R.high`) low enough to be under the top of their
  // view and big enough in it (an eagle 160 m off is six pixels long at 1080 lines).
  // (`away`, for one the walker has put up: and not on their side of where it is, with the walker 20 m and more
  // outside the circle, which would otherwise swing over them; or there is none)
  const circle = (away = false) => {
    const from = alongOf(bird.at.x, bird.at.z);
    for (let tries = 0; tries < 12; tries += 1) {
      const along = clamp(from + (r() - 0.5) * 2 * R.wander, R.reach[0], R.reach[1]);
      downRiver(along, here);
      const d = Math.hypot(here.x - world.eye.x, here.z - world.eye.z);
      if (away && towards(here)) continue;
      if ((d > 35 && d < 160) || (tries === 11 && !away)) {
        const centre = here.clone(), radius = span(R.radius);
        if (away && d < radius + 20) continue;
        let ground = -Infinity;
        for (let k = 0; k < 8; k += 1) ground = Math.max(ground, groundAt(world, centre.x + Math.cos(k * 0.785) * radius, centre.z + Math.sin(k * 0.785) * radius));
        centre.y = Math.max(here.y + span(R.high), ground + 20);
        return { centre, radius };
      }
    }
    return null;
  };
  const soar = (time = span(R.soar), away = false) => {
    const c = circle(away);
    if (!c) return false;
    up(6);
    a.to('soar', c.centre, c.radius, r() < 0.5 ? 1 : -1, time);
    return true;
  };
  // (`away`, for one the walker has put up: the way along the river that takes it further from them, never turned
  // back at the end of its stretch, which would be the way past them, and not if the river itself lies on their side.
  // The way was drawn by chance, whoever had put it up: half the time, back low along the river past the walker.)
  const cruise = (away = false) => {
    const from = alongOf(bird.at.x, bird.at.z);
    let dir = r() < 0.5 ? 1 : -1;
    if (away) {
      const down = downRiver(from + 30, here).distanceTo(world.eye), upRiver = downRiver(from - 30, _w).distanceTo(world.eye);
      dir = down >= upRiver ? 1 : -1;
      if (towards(dir > 0 ? here : _w)) return false;
    }
    let to = from + dir * span(R.cruise);
    if (!away && (to < R.reach[0] || to > R.reach[1])) to = from - (to - from);
    to = clamp(to, R.reach[0], R.reach[1]);
    if (Math.abs(to - from) < 30) return false;
    up(6);
    a.to('cruise', to, span(R.low));
    return true;
  };
  // A hunt: where it strikes, on the river's middle line within `R.pass`, clear of the walker by more than the flush
  // distance; of eight tries, the first that the walker could see it from (40 to 150 m off), else the first clear one.
  const strikeAt = () => {
    let first = null;
    for (let tries = 0; tries < 8; tries += 1) {
      const at = span(R.pass);
      downRiver(at, here);
      if (!a.clear(here, 20)) continue;
      const d = here.distanceTo(world.eye);
      if (d > 40 && d < 150) return at;
      if (first == null) first = at;
    }
    return first;
  };
  const hunt = () => {
    const at = strikeAt();
    if (at == null) return false;
    up(6);
    a.to('hunt', at, alongOf(bird.at.x, bird.at.z) < at ? 1 : -1);
    return true;
  };
  // Away with a fish: low over the water to the bar's stones, to eat it there; or, with the chance `R.nest` (or with
  // nowhere on the bar to go), off along the valley to its nest with it. (`further`: flushed off the bar, only to
  // another spot on it further from the walker, or false.)
  const carry = (further = false) => {
    const spot = !further && r() < R.nest ? null : barSpot(further);
    if (!spot) return further ? false : off();
    up(5);
    a.to('carry', spot);
    return true;
  };
  const move = (further = false) => {
    const t = pickTop(further);
    if (!t) return false;
    up(5);
    a.to('land', t);
    bird.doing = 'off along the river to another tree';
    return true;
  };
  const off = () => !a.cast && a.leave(r() < way.gone ? Infinity : a.awhile());
  // After a perch, a soar, a run along the river, a hunt that missed or a meal: what next, by the way's shares, a
  // little changed by what it has just done (fresh from a soar it hunts more, and soars again less; fed, it hunts
  // less). A hunt from a perch begins with a moment leaning out over the water (the perch's `alert`).
  const onward = (after) => {
    const n = R.next;
    const shares = [n.pass * (after === 'soar' ? 1.6 : after === 'feed' ? 0.4 : 1), n.soar * (after === 'soar' ? 0.3 : 1), n.cruise * (after === 'feed' ? 0.5 : 1), n.move, n.leave];
    let k = r() * (shares[0] + shares[1] + shares[2] + shares[3] + shares[4]);
    if ((k -= shares[0]) < 0) {
      if (after === 'perch' && a.name === 'perch') { a.now.alert = 1 + r() * 1.4; return true; }
      return hunt() || soar() || off();
    }
    if ((k -= shares[1]) < 0) return soar() || off();
    if ((k -= shares[2]) < 0) return cruise() || soar();
    if ((k -= shares[3]) < 0) return move() || soar();
    return off() || soar();
  };

  // ---- what it does
  // On a top by the river, facing the water: looking about, mostly down at the water; calling now and then, its head
  // thrown back (the sheet's `call`); and before it goes down to the water, leaning out over its feet, its head low
  // (the sheet's `alert`).
  const perch = {
    enter(a, t, wait = stay()) {
      top = t; fish = 0;
      Object.assign(a.now, { until: wait, look: 0, yaw: 0, pitch: -0.25, calling: 0, alert: 0, feet: { mode: 'grip', round: t.round }, watching: `${said(t)}, watching the water`, leaning: `${said(t)}, leaning out over the water` });
      bird.at.copy(t.at); facing(t, bird.q);
      hold(P.perched, 0, -0.25, 0, a.now.feet);
      bird.doing = a.now.watching;
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', top); return; }
      now.until -= dt; now.look -= dt; calls -= dt;
      if (now.alert > 0) {
        now.alert -= dt;
        hold(P.alert, now.yaw * 0.3, null, 0, now.feet);
        bird.doing = now.leaning;
        if (now.alert <= 0 && !hunt()) now.until = 5 + r() * 8;
        return;
      }
      if (now.calling > 0) {
        now.calling -= dt;
        hold(P.call, now.yaw * 0.4, null, (now.calling * way.call.rate) % 1 > 0.5 ? num(P.call, 'gape') : 0.25, now.feet);
        bird.doing = way.call.doing;
        return;
      }
      if (now.look < 0) { now.look = 1.5 + r() * 5; now.yaw = (r() - 0.5) * 1.8; now.pitch = -0.1 - r() * 0.5; }
      hold(P.perched, now.yaw, now.pitch, 0, now.feet);
      bird.doing = now.watching;
      if (way.call && calls < 0) {
        calls = span(way.call.every); now.calling = way.call.time;
        world.say(bird, 'call', way.call.reach);
        return;
      }
      if (now.until > 0) return;
      if (!onward('perch')) now.until = 5 + r() * 10;
    },
  };
  const roost = {
    wary: false,
    enter(a, t) { top = t; fish = 0; a.now.feet = { mode: 'grip', round: t.round }; a.now.said = `at roost ${said(t)}`; bird.at.copy(t.at); facing(t, bird.q); },
    step(a) {
      if (world.day >= 0.08) { a.to('perch', top, stay()); return; }
      hold(P.perched, 0, -0.3, 0, a.now.feet);
      bird.doing = a.now.said;
    },
  };
  // Soaring: round a circle over the river, rising in it and drifting along the valley, for `time` seconds, on flat
  // wings and banked into its turn (the sheet's `soar` and `bank`).
  const soarAct = {
    wary: false, pose: held,
    enter(a, centre, radius, dir, time) {
      Object.assign(a.now, { centre, radius, dir, time, top: centre.y + span(R.rise), drift: new THREE.Vector3() });
      downRiver(alongOf(centre.x, centre.z) + (r() < 0.5 ? 40 : -40), here);
      a.now.drift.subVectors(here, centre).setY(0).normalize().multiplyScalar(0.3 + r() * 0.5);
      bird.state = 'fly'; top = null;
    },
    step(a, dt) {
      const now = a.now;
      now.time -= dt;
      now.centre.addScaledVector(now.drift, dt);
      now.centre.y = Math.min(now.top, now.centre.y + R.climb * dt);
      const round = Math.atan2(bird.at.z - now.centre.z, bird.at.x - now.centre.x) + now.dir * 0.45;
      goal.set(now.centre.x + Math.cos(round) * now.radius, now.centre.y, now.centre.z + Math.sin(round) * now.radius);
      w.steer(dt, goal, { speed: R.soarSpeed, turn: 0.5, climb: R.climb + 0.6, sink: 2, clear: 20 });
      lay('soar', dt);
      bird.doing = fish > 0 ? 'soaring over the river, a fish in its feet' : 'soaring in wide circles over the river';
      // (with a fish, put up off the bar with it: on to eat it, or to its nest)
      if (now.time <= 0 && !(fish > 0 ? carry() : onward('soar'))) now.time = 10;
    },
  };
  // Along the river, a few metres to twenty over the water, beating and gliding, to `to` metres down it.
  const cruiseAct = {
    wary: false, pose: held,
    enter(a, to, low) { Object.assign(a.now, { to, low, dir: Math.sign(to - alongOf(bird.at.x, bird.at.z)) || 1, time: 0 }); bird.state = 'fly'; top = null; },
    step(a, dt) {
      const now = a.now, at = alongOf(bird.at.x, bird.at.z);
      now.time += dt;
      downRiver(at + now.dir * 30, goal); goal.y += now.low;
      w.steer(dt, goal, { speed: way.speed, turn: 0.8, climb: 2.5, sink: 2.5, clear: 6 });
      aboveWater();
      lay('pulse', dt);
      bird.doing = 'flying along the river';
      if ((at - now.to) * now.dir >= 0 || now.time > 90) { if (!(fish > 0 ? carry() : onward('cruise'))) now.to += now.dir * 60; }
    },
  };
  // A hunt, at `at` metres down the river, going the way `dir`. Out along the river to where its stoop begins, high,
  // beating and gliding; the stoop, a long shallow slant down onto the water at about 23 degrees, its wings half shut
  // and its feet coming forward (the sheet's `stoop`); the snatch, level over the water with its wings high and its
  // feet thrown forward into it (`snatch`), which takes a fish with the chance `R.catch`; and up again, labouring with
  // the fish (`carry`) or beating empty-footed. With a fish it carries it to the bar or off to its nest; without, on.
  const huntAct = {
    wary: false, pose: held,
    enter(a, at, dir) {
      Object.assign(a.now, { at, dir, leg: 0, time: 0, snatch: 0, caught: r() < R.catch, from: 1, high: 1 });
      bird.state = 'fly'; top = null; fish = 0;
      downRiver(at, strike); strike.y += 0.45;
    },
    step(a, dt) {
      const now = a.now;
      now.time += dt;
      if (now.leg === 0) {
        const high = Math.max(bird.at.y - strike.y, 12), run = clamp(high / 0.42, 45, 110);
        downRiver(now.at - now.dir * run, goal); goal.y = Math.max(bird.at.y, strike.y + 15);
        const d = w.steer(dt, goal, { speed: way.speed, turn: 0.9, climb: 2.5, sink: 3, clear: 8 });
        aboveWater();
        lay('pulse', dt);
        bird.doing = 'flying out along the river, watching the water';
        if (d < 14 || now.time > 40) { now.leg = 1; now.time = 0; now.from = Math.max(8, Math.hypot(strike.x - bird.at.x, strike.z - bird.at.z)); now.high = Math.max(1, bird.at.y - strike.y); }
      } else if (now.leg === 1) {
        // (steered along the ground, and let down along its slant here: the steering's own climb lags a moving goal.
        // It steers for a point on the river's middle line a little ahead of it and never past the strike, so that it
        // comes down along the river and not across it: steered at the strike itself, it came in from the side and its
        // snatch ran on over the far bank.)
        const along = alongOf(bird.at.x, bird.at.z), on = now.dir > 0 ? Math.min(along + 22, now.at + 6) : Math.max(along - 22, now.at - 6);
        downRiver(on, goal); goal.y = bird.at.y;
        w.steer(dt, goal, { speed: R.dive, turn: 1.0, climb: 0.01, sink: 0.01, clear: 0, ahead: 1 });
        const d = Math.hypot(strike.x - bird.at.x, strike.z - bird.at.z);
        // (down to the water's height 12 m short of the strike, a level run in to it: let down to the strike itself, it
        // lagged its slant, came abreast of the strike still metres up, and missed for that)
        const line = strike.y + now.high * clamp((d - 12) / Math.max(now.from - 12, 4), 0, 1);
        bird.at.y += clamp((line - bird.at.y) * 3, -11, 0.5) * dt; w.vy = 0;
        aboveGround(); aboveWater();
        lay('stoop', dt);
        bird.doing = 'stooping to the water, its feet coming forward';
        const behind = (strike.x - bird.at.x) * w.hx + (strike.z - bird.at.z) * w.hz < 0, low = bird.at.y - strike.y < 2.5;
        // (down to the water: the snatch; past it or too long about it, still high, a miss, and up again)
        if (low && (d < 3 || (behind && d < 14))) { now.leg = 2; now.snatch = 0; }
        else if ((behind && d < 14) || now.time > 30) { now.leg = 3; now.time = 0; now.caught = false; }
      } else if (now.leg === 2) {
        now.snatch += dt;
        downRiver(alongOf(bird.at.x, bird.at.z) + now.dir * 20, goal); goal.y = bird.at.y;          // (on along the river)
        w.steer(dt, goal, { speed: 12, turn: 0.9, climb: 0.01, sink: 0.01, clear: 0, ahead: 0.5 });
        bird.at.y += clamp((strike.y - bird.at.y) * 8, -6, 6) * dt; w.vy = 0;
        aboveGround(); aboveWater();
        if (now.caught && now.snatch > 0.25) fish = Math.min(1, fish + dt * 5);
        lay('snatch', dt);
        bird.doing = 'snatching at the water';
        if (now.snatch > 0.7) { now.leg = 3; now.time = 0; }
      } else {
        downRiver(alongOf(bird.at.x, bird.at.z) + now.dir * 60, goal); goal.y += 10;
        w.steer(dt, goal, { speed: fish > 0 ? R.carry : way.speed, turn: 0.8, climb: fish > 0 ? 1.8 : 3, sink: 1, clear: 2 });
        aboveWater();
        lay(fish > 0 ? 'carry' : 'flap', dt);
        bird.doing = fish > 0 ? 'climbing away from the water, a fish in its feet' : 'climbing away from the water, its feet empty';
        if (now.time > 2.5) {
          if (fish > 0) { if (!carry()) { fish = 0; if (!onward('pass')) now.time = 0; } }
          else if (!onward('pass')) now.time = 0;
        }
      }
    },
  };
  // Carrying a fish low over the river to a spot on the bar (`spot`), labouring; the last of the way the skeleton's
  // flight onto it, which comes in on the sheet's `land`.
  const carryAct = {
    wary: false, pose: held,
    enter(a, spot) { Object.assign(a.now, { spot, time: 0 }); bird.state = 'fly'; top = null; },
    step(a, dt) {
      const now = a.now, s = now.spot;
      now.time += dt;
      goal.copy(s.at); goal.y += 7;
      const d = w.steer(dt, goal, { speed: R.carry, turn: 0.9, climb: 1.8, sink: 2.5, clear: 4 });
      aboveWater();
      lay('carry', dt);
      bird.doing = 'carrying a fish low over the river';
      if (d < 26 && ((s.at.x - bird.at.x) * w.hx + (s.at.z - bird.at.z) * w.hz) > d * 0.5) {
        // (another may have taken it meanwhile, or the walker come near it)
        if (!world.free(s.at, bird, 2) || !a.clear(s.at, 4)) {
          const other = barSpot();
          if (other) { now.spot = other; return; }
          if (!off()) { fish = 0; onward('pass'); }
          return;
        }
        bird.aloft = true;
        a.fly({ at: s.at.clone(), q: frame(_v.set(w.hx, 0, w.hz), UP, _q).clone(), rise: 0.6, floor: world.height, speed: R.carry * 0.7 }, 'feed', s);
        return;
      }
      if (now.time > 70 && !off()) { fish = 0; onward('pass'); }
    },
  };
  // On the bar's stones with its fish: mantling over it on landing, its wings let down round it, glaring about
  // (`mantle`); then by turns tearing at it, bent to its feet with a pull up at each bite (`tear`), and standing up
  // from it to look about (`stand`), now and then calling, its head thrown back; mantling again now and then. The fish
  // goes as it eats (to nothing in the last seconds), and then it is up again.
  const feedAct = {
    enter(a, spot) {
      top = null; fish = Math.max(fish, 0.6);
      const time = span(R.feed);
      Object.assign(a.now, { spot, time, total: time, part: 'mantle', left: 2.5 + r() * 3, look: 0, yaw: 0, bite: 0 });
      bird.at.copy(spot.at);
      hold(P.mantle, 0, null, 0, P.mantle.feet);
      bird.doing = 'mantling over its fish on the bar';
    },
    step(a, dt) {
      const now = a.now;
      now.time -= dt; now.left -= dt; now.look -= dt; calls -= dt;
      if (now.look < 0) { now.look = 0.8 + r() * 2; now.yaw = (r() - 0.5) * 1.6; }
      if (now.time < 3 && now.part !== 'tear') { now.part = 'tear'; now.left = 3; }
      if (now.part === 'mantle') {
        hold(P.mantle, now.yaw, null, 0, P.mantle.feet);
        bird.doing = 'mantling over its fish on the bar';
        if (now.left <= 0) { now.part = 'tear'; now.left = 6 + r() * 10; }
      } else if (now.part === 'tear') {
        now.bite += dt;
        const pull = 0.5 + 0.5 * Math.sin(now.bite * 5.5);
        fish = now.time < 3 ? Math.min(fish, 0.3 * Math.max(0, now.time) / 3) : Math.max(0.3, fish - (dt * 0.7) / now.total);
        hold(P.tear, now.yaw * 0.15, num(P.tear.head, 'pitch') + 0.4 * pull, pull > 0.65 ? num(P.tear, 'gape') + 0.3 : 0.05, P.tear.feet);
        bird.doing = 'tearing at a fish on the bar';
        if (now.left <= 0 && now.time >= 3) { now.part = 'look'; now.left = 1.5 + r() * 3; }
      } else if (now.part === 'look') {
        hold(P.stand, now.yaw, -0.1, 0, P.stand.feet);
        bird.doing = 'standing on its fish on the bar, looking about';
        if (way.call && calls < 0) { calls = span(way.call.every); now.part = 'call'; now.left = way.call.time; world.say(bird, 'call', way.call.reach); }
        else if (now.left <= 0) { now.part = r() < 0.2 ? 'mantle' : 'tear'; now.left = now.part === 'mantle' ? 2 + r() * 2 : 6 + r() * 10; }
      } else {
        hold(P.stand, now.yaw * 0.4, 1.1, (now.left * way.call.rate) % 1 > 0.5 ? num(P.call, 'gape') : 0.25, P.stand.feet);
        bird.doing = way.call.doing;
        if (now.left <= 0) { now.part = 'tear'; now.left = 5 + r() * 8; }
      }
      // (dark: off to a top or away; with neither, it looks again in a few seconds, not in every frame)
      if (world.day < 0.08 && (now.dark = (now.dark || 0) - dt) <= 0) { fish = 0; if (move() || off()) return; now.dark = 5; return; }
      if (now.time <= 0) { fish = 0; if (!onward('feed')) now.time = 5; }
    },
  };
  // To a top: steered in, and the last of the way the skeleton's flight onto it.
  const landAct = {
    wary: false, pose: held,
    enter(a, t) { Object.assign(a.now, { t, time: 0 }); bird.state = 'fly'; top = null; },
    step(a, dt) {
      const now = a.now, t = now.t;
      now.time += dt;
      goal.copy(t.at); goal.y += 8;
      const d = w.steer(dt, goal, { speed: way.speed, turn: 0.9, climb: 3, sink: 3, clear: 6 });
      lay('pulse', dt);
      bird.doing = 'flying in along the river';
      if (d < 28 && ((t.at.x - bird.at.x) * w.hx + (t.at.z - bird.at.z) * w.hz) > d * 0.6) {
        // (another bird may have taken it meanwhile, or the walker come under it: it has been up to two minutes on its
        // way, and landing inside the distance that puts it up it would be put up again at once)
        if (!world.free(t.at, bird, 1.5) || !a.clear(t.at)) { const other = pickTop(); if (other) { now.t = other; return; } if (!soar()) off(); return; }
        bird.aloft = true;
        a.fly({ at: t.at.clone(), q: facing(t, _q).clone(), rise: 0.8, floor: world.height, speed: way.speed * 0.6 }, 'perch', t);
        return;
      }
      if (now.time > 120) { if (!soar()) off(); }
    },
  };
  // A flight of the skeleton's (the last of a steered one, onto a top or the bar): glided through its middle and beating
  // at its ends, the fish held if it has one, and coming in on the sheet's `land`, reared back on braking wings with
  // its feet forward; the bank of the steered flight before it let out.
  const flyAct = {
    wary: false, pose: held,
    step(a, dt) {
      const f = bird.flight;
      flying(bird, dt, way.hz);
      if (!f || bird.flight !== f) return;                   // (it has landed: the next activity's pose stands)
      w.roll *= Math.exp(-dt * 4); w.turn = 0; w.vy = 0;
      const k = f.through ? 0 : clamp((f.t - 0.55) / 0.35, 0, 1);
      lay(fish > 0 ? 'carry' : f.time > 1 && f.t > 0.15 ? 'glide' : 'flap', dt, k > 0 ? 'land' : null, k);
    },
  };
  // Off out of the walker's plain sight: along the valley, high, away from them, and gone from there (`seconds`);
  // with a fish, to its nest, labouring.
  const far = () => {
    // somewhere far along the river from the walker, or over a wall of the valley, high: further from them than it
    // is, and not the way back past them
    const eye = world.eye, mine = Math.hypot(bird.at.x - eye.x, bird.at.z - eye.z), out = [];
    for (const at of [10, 60, 120, END - 120, END - 40]) { downRiver(at, _w); out.push(_w.clone()); }
    for (let k = 0; k < 6; k += 1) { const turn = r() * Math.PI * 2; out.push(new THREE.Vector3(eye.x + Math.cos(turn) * 380, 0, eye.z + Math.sin(turn) * 380)); }
    let best = null, most = -Infinity;
    for (const p of out) {
      p.x = clamp(p.x, WORLD.minX + 12, WORLD.maxX - 12); p.z = clamp(p.z, WORLD.minZ + 12, WORLD.maxZ - 12);
      const d = Math.hypot(p.x - eye.x, p.z - eye.z);
      if (d < mine + 40) continue;
      const away = ((p.x - bird.at.x) * (bird.at.x - eye.x) + (p.z - bird.at.z) * (bird.at.z - eye.z)) / (Math.max(mine, 1) * Math.max(Math.hypot(p.x - bird.at.x, p.z - bird.at.z), 1));
      const score = d * 0.01 + away * 2 + r();
      if (score > most) { most = score; best = p; }
    }
    if (!best) { best = new THREE.Vector3(bird.at.x + (bird.at.x - eye.x), 0, bird.at.z + (bird.at.z - eye.z)); best.x = clamp(best.x, WORLD.minX + 12, WORLD.maxX - 12); best.z = clamp(best.z, WORLD.minZ + 12, WORLD.maxZ - 12); }
    best.y = groundAt(world, best.x, best.z) + (fish > 0 ? 60 : 120) + r() * 80;
    return best;
  };
  const awayAct = {
    wary: false, pose: held,
    enter(a, seconds) { Object.assign(a.now, { seconds, goal: far(), check: 0, time: 0 }); bird.state = 'fly'; bird.aloft = true; top = null; },
    step(a, dt) {
      const now = a.now;
      now.time += dt; now.check -= dt;
      if (now.check <= 0) {
        now.check = 0.25;
        if (!world.plain(bird.at, bird.size)) { bird.left = now.seconds; a.to('gone'); return; }
      }
      const d = w.steer(dt, now.goal, { speed: fish > 0 ? R.carry : R.away, turn: 0.6, climb: fish > 0 ? 1.8 : 2.5, sink: 2, clear: fish > 0 ? 8 : 25 });
      aboveWater();
      lay(fish > 0 ? 'carry' : now.time < 4 ? 'flap' : 'glide', dt);
      bird.doing = fish > 0 ? 'carrying its fish off along the valley, to its nest' : 'flying off along the valley, high';
      if (d < 25) { now.goal = far(); now.goal.y += 60; }
    },
  };

  // In from somewhere the walker cannot plainly see: behind a trunk as they see it, behind them and overhead, or far
  // along the valley; and steered in to a top (`t`) or a circle over the river.
  const arrive = (t) => {
    const c = t ? null : circle(), to = t ? t.at : c && c.centre;
    if (!to) return false;
    let from = world.origin(to, bird.size, r);
    if (!from || !within(from)) {
      from = null;
      for (let tries = 0; tries < 10 && !from; tries += 1) {
        const p = tries < 5 ? downRiver([10, 60, 120, END - 120, END - 40][tries], _w).clone() : new THREE.Vector3(to.x + Math.cos(r() * 6.283) * 300, 0, to.z + Math.sin(r() * 6.283) * 300);
        if (!within(p)) continue;
        p.y = groundAt(world, p.x, p.z) + 60 + r() * 60;
        if (!world.plain(p, bird.size)) from = p;
      }
    }
    if (!from) return false;
    bird.at.copy(from); frame(_v.subVectors(to, from).setY(0), UP, bird.q);
    w.start(way.speed);
    bird.aloft = true;
    if (t) a.to('land', t);
    else a.to('soar', c.centre, c.radius, r() < 0.5 ? 1 : -1, span(R.soar));
    bird.doing = 'flying in along the valley';
    return true;
  };

  return {
    activities: { perch, roost, soar: soarAct, cruise: cruiseAct, hunt: huntAct, carry: carryAct, feed: feedAct, land: landAct, away: awayAct, fly: flyAct },
    // Flushed: off the bar with what is left of its fish, to another spot on it further from the walker; or to a top
    // further from them, or up into the air over the river, or along it, away from them; or nowhere near.
    refuge() {
      // (off the bar it takes what is left of its fish with it: to another spot on the bar further off, or up over the
      // river or along it away from the walker, to take it somewhere when that is done)
      if (a.name === 'feed' && fish > 0.3 && (carry(true) || soar(undefined, true) || cruise(true))) return true;
      fish = 0;
      if (move(true)) return true;
      return r() < 0.5 ? soar(undefined, true) || cruise(true) : cruise(true) || soar(undefined, true);
    },
    // Off out of sight, its own way: along the valley, high (the skeleton's way is through the trees); with what is
    // left of a fish, to its nest.
    leave(seconds) {
      if (a.cast) return false;
      up(6);
      a.to('away', seconds);
      return true;
    },
    // Where it is when it comes: on a top, at night or for a visit that begins with it there; on the bar with a fish,
    // for some visits that begin with it there; or in along the valley.
    begin() {
      // (for the tools, which look at what it does: into one of its doings at once, from wherever it is, a top or the
      // bar taken as it would take one; 'call' calls three times over on a top. With `near`, the circle, the strike,
      // the spot on the bar or the top within that many metres of the walker, of up to forty tries, for a close-up,
      // which lets go of an animal 80 m off. False if it finds none.)
      bird.eagle = (what, near = Infinity) => {
        if (what === 'flush') return a.flush();                   // (as the walker's coming too near does)
        const nigh = (p) => p && Math.hypot(p.x - world.eye.x, p.z - world.eye.z) < near;
        for (let tries = 0; tries < 40; tries += 1) {
          if (what === 'soar') { const c = circle(); if (!c || !nigh(c.centre)) continue; up(6); a.to('soar', c.centre, c.radius, 1, 60); return true; }
          if (what === 'hunt') { const at = strikeAt(); if (at == null || !nigh(downRiver(at, here))) continue; up(6); a.to('hunt', at, alongOf(bird.at.x, bird.at.z) < at ? 1 : -1); return true; }
          if (what === 'feed') { const s = barSpot(); if (!nigh(s && s.at)) continue; fish = 1; frame(s.face, UP, bird.q); a.to('feed', s); return true; }
          if (what === 'perch' || what === 'call') { const t = pickTop(); if (!nigh(t && t.at)) continue; a.to('perch', t, 60); if (what === 'call') a.now.calling = way.call.time * 3; return true; }
        }
        return false;
      };
      const t = pickTop();
      if (world.day < 0.08) { if (a.life.first && t) { a.to('roost', t); return; } bird.left = a.life.first ? Infinity : 30 + r() * 60; return; }
      const k = r();
      if (a.life.first && t && k < 0.5) { a.to('perch', t, stay()); return; }
      if (a.life.first && k < 0.7) {
        const s = barSpot();
        if (s) { fish = 0.6 + r() * 0.4; frame(s.face, UP, bird.q); a.to('feed', s); return; }
      }
      if (a.life.first) {
        // already up, round a circle over the river
        const c = circle();
        if (c) { const round = r() * 6.283; bird.at.set(c.centre.x + Math.cos(round) * c.radius, c.centre.y, c.centre.z + Math.sin(round) * c.radius); frame(_v.set(-Math.sin(round), 0, Math.cos(round)), UP, bird.q); w.start(R.soarSpeed); a.to('soar', c.centre, c.radius, 1, span(R.soar)); return; }
      }
      if (!arrive(t && r() < 0.65 ? t : null) && !arrive(t)) bird.left = 20 + r() * 40;
    },
  };
}

// ---- the hawks: a part of the wood, its perches, and the dash
// Can a hawk sit on a limb where it runs this way and is this thick? Not where it climbs so steeply that it goes up
// through a bird sitting across it, nor where the bird's feet would be more than a centimetre in the wood: a perch on
// a limb is 0.96 of its radius straight above its middle line (life/perch.js `onLimb`), which on a limb that climbs
// is inside it (up to 0.88 m, on a bigleaf maple's great limbs). The owls' rule, and the reckoning: families/owl.js.
const STEEP = 0.8 / Math.hypot(1, 0.8), SUNK = 0.01;
const sits = (along, radius) => Math.abs(along.y) <= STEEP && radius * (1 / Math.sqrt(1 - along.y * along.y) - 0.96) <= SUNK;
const hawkHome = (W) => (habitat, r) => {
  const near = habitat.leafy.filter((t) => t.off < W.off);
  for (let tries = 0; near.length && tries < 20; tries += 1) {
    const tree = near[Math.floor(r() * near.length)];
    if (habitat.perchesOf(tree).filter((p) => p.above >= W.low && p.above <= W.high && p.radius >= W.thick && sits(p.along, p.radius)).length >= 2) return { x: tree.x, z: tree.z, tree };
  }
  return null;
};

function hawk(a) {
  const { bird, world, way, r } = a, home = bird.home, W = way.wood, w = wings(bird, world, way, r);
  const rest = bird.sheet.poses.perched, boughs = [], stubs = [], others = [], goal = new THREE.Vector3();
  const stay = () => way.stay[0] + r() * (way.stay[1] - way.stay[0]);
  let at = null, side = 1, passTo = null, calls = way.call ? way.call.every[0] + r() * way.call.every[1] : Infinity;

  // perches inside the canopy near a spot: the boughs and the stubs `low` to `high` m up, thick enough, a bough only
  // where it can be sat on (`sits`; no stub of the habitat's is steep)
  const perchesNear = (x, z, reach) => {
    const out = [];
    for (const p of world.boughsNear(x, z, reach, boughs)) if (p.above >= W.low && p.above <= W.high && p.radius >= W.thick && sits(p.along, p.radius)) out.push({ point: p.point, along: p.along, radius: p.radius, above: p.above, what: 'bough' });
    for (const s of world.stubsNear(x, z, reach, stubs)) { const above = s.point.y - s.place.foot.y; if (above >= W.low && above <= W.high && s.radius >= W.thick * 0.7) out.push({ point: s.point, along: s.along, radius: s.radius, above, what: 'stub' }); }
    return out;
  };
  // Of perches it might take, a stub (bare of leaves) before a bough, and a low one before a high: a hawk up in a
  // bough was a frame of needles in its first close-up.
  const pick = (list) => {
    if (!list.length) return null;
    let sum = 0;
    const weights = list.map((p) => { const one = (p.what === 'stub' ? 2.5 : 1) * (1.6 - p.above / W.high); sum += one; return one; });
    let k = r() * sum;
    for (let i = 0; i < list.length; i += 1) { k -= weights[i]; if (k <= 0) return list[i]; }
    return list[list.length - 1];
  };
  const open = (s, room = 0.6) => world.free(s.point, bird, room) && a.clear(s.point, 2);
  // where it sits on a perch, across it, facing `sd` of the two ways
  const place = (s, sd, pos, q) => {
    _v.crossVectors(s.along, UP);
    if (_v.lengthSq() < 1e-6) _v.set(1, 0, 0);
    _v.normalize().multiplyScalar(sd);
    pos.copy(s.point);
    frame(_v, UP, q);
  };
  const sit = (head) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, roll: 0, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: rest.droop ?? 0.02, gape: 0,
    head, tail: { ...rest.tail }, feet: { mode: 'grip', round: Math.max(0.01, at ? at.radius : 0.03) } });
  const flyTo = (s, sd, speed = way.speed) => {
    place(s, sd, _v, _q);
    a.fly({ at: _v.clone(), q: _q.clone(), rise: 0.3, floor: world.height, speed }, 'perch', s, sd);
    return true;
  };
  const off = () => !a.cast && a.leave(r() < way.gone ? Infinity : a.awhile());
  const perched = (s) => (s.what === 'stub' ? 'perched on the stub of a limb, still, watching' : 'perched inside the canopy, still, watching');

  // A small bird it has seen: near, smaller than it, not on the wing, no trunk between, and not beside the walker.
  const prey = () => {
    const some = world.others(bird.at.x, bird.at.z, W.range[1], bird, others).filter((b) => b.size < bird.size * 0.85 && b.state !== 'fly' && b.state !== 'gone' && !b.cover && !world.blocked(bird.at, b.at) && a.clear(b.at, 2));
    return some.length ? some[Math.floor(r() * some.length)] : null;
  };
  // Does a way (from where it is, through `legs`, and onto `end` if it has one) go nearer the walker than the
  // distance that puts the hawk up? Asked every two metres of it. A dash is its own doing, and so is clear of them
  // like any other (life/behave.js): its legs are 2 to 3 m over the ground, a walker's head, and one took it through
  // a small bird that fed beside the walker, or to a perch beyond them, 1.5 to 7 m from them at 14 to 17 m/s (a
  // probe of 2026-11-16: seven of 36 dashes of its own, the walker standing 3 m outside its flush distance).
  const nears = (from, legs, end) => {
    let prev = from;
    for (const p of end ? [...legs, end.point] : legs) {
      const n = Math.max(1, Math.ceil(prev.distanceTo(p) / 2));
      for (let k = 1; k <= n; k += 1) if (!a.clear(_u.copy(prev).lerp(p, k / n), 0)) return true;
      prev = p;
    }
    return false;
  };
  // A dash: down off its perch to a few metres over the ground, past `through` (or anywhere in range), on to a
  // perch beyond it, round any trunk in the way, by a way that does not go near the walker (up to four perches are
  // tried for one). False if it finds no way.
  const dash = (through) => {
    const from = bird.at.clone(), mid = through ? through.clone() : null, centre = mid || from;
    const ends = perchesNear(centre.x, centre.z, W.range[1]).filter((s) => s !== at && s.point.distanceTo(from) >= W.range[0] && open(s));
    // (beyond the pass, not back over it)
    const good = mid ? ends.filter((s) => (s.point.x - mid.x) * (mid.x - from.x) + (s.point.z - mid.z) * (mid.z - from.z) > 0) : ends;
    const pool = (good.length ? good : ends).slice();
    for (let tries = 0; tries < 4; tries += 1) {
      const end = pick(pool);
      if (!mid && !end) return false;
      const legs = legsOf(from, mid, end);
      if (!nears(from, legs, end)) { a.to('dash', legs, end, r() < 0.5 ? 1 : -1); return true; }
      if (!end) return false;
      pool.splice(pool.indexOf(end), 1);
    }
    return false;
  };
  // the legs of a dash from `from`, past `mid` (or null), to the perch `end` (or null: on through the wood)
  const legsOf = (from, mid, end) => {
    const legs = [];
    const ahead = (end ? end.point : mid).clone().sub(from).setY(0);
    if (ahead.lengthSq() < 1e-4) ahead.set(1, 0, 0);
    ahead.normalize();
    const drop = from.clone().addScaledVector(ahead, 5);
    drop.y = groundAt(world, drop.x, drop.z) + W.fly;
    legs.push(drop);
    if (mid) { const by = mid.clone(); by.y = Math.max(mid.y + 0.9, groundAt(world, mid.x, mid.z) + 1.2); legs.push(by); }
    if (end) {
      const last = legs[legs.length - 1], into = end.point.clone().sub(last).setY(0);
      const n = into.length();
      if (n > 9) { const short = end.point.clone().addScaledVector(into.normalize(), -7); short.y = Math.max(end.point.y - 1, groundAt(world, short.x, short.z) + W.fly); legs.push(short); }
    } else {
      const on = mid.clone().addScaledVector(ahead, 20); on.y = groundAt(world, on.x, on.z) + W.fly; legs.push(on);
    }
    // round a trunk in the way, to one side of it or the other
    for (let i = 0; i < legs.length; i += 1) {
      const prev = i ? legs[i - 1] : from;
      if (!world.blocked(prev, legs[i])) continue;
      const across = _w.subVectors(legs[i], prev).setY(0);
      if (across.lengthSq() < 1e-4) continue;
      across.normalize().set(-across.z, 0, across.x);
      for (const sd of [3, -3, 5.5, -5.5]) {
        const mid2 = prev.clone().lerp(legs[i], 0.5).addScaledVector(across, sd);
        if (!world.blocked(prev, mid2) && !world.blocked(mid2, legs[i])) { legs.splice(i, 0, mid2); i += 1; break; }
      }
    }
    return legs;
  };

  const perch = {
    enter(a, s, sd, wait = stay()) {
      at = s; side = sd; w.last = null;
      Object.assign(a.now, { until: wait, look: 0.3, head: { yaw: 0, pitch: -0.05, roll: 0 }, calling: 0 });
      place(s, sd, bird.at, bird.q);
      sit(a.now.head);
      bird.doing = perched(s);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { a.to('roost', at, side); return; }
      now.until -= dt; now.look -= dt; calls -= dt;
      if (passTo) { const p = passTo; passTo = null; if (dash(p)) return; }
      if (now.calling > 0) {
        now.calling -= dt;
        sit({ yaw: now.head.yaw, pitch: 0.2, roll: 0 });
        bird.want.gape = (now.calling * way.call.rate) % 1 > 0.5 ? 0.5 : 0.1;
        bird.doing = way.call.doing;
        return;
      }
      // its head turned in quick jerks (not eased: `snap`, in the frame it turns)
      if (now.look < 0) { now.look = 0.3 + r() * 1.4; now.head = { yaw: (r() - 0.5) * 2.4, pitch: (r() - 0.6) * 0.7, roll: (r() - 0.5) * 0.3 }; bird.snap = true; }
      sit(now.head);
      bird.doing = perched(at);                                 // (said every frame: after a call it went on saying it was calling)
      if (way.call && calls < 0) { calls = way.call.every[0] + r() * (way.call.every[1] - way.call.every[0]); now.calling = way.call.time; world.say(bird, 'call', way.call.reach); return; }
      if (now.until > 0) return;
      // the hunt: at a small bird it has seen, or on through the wood; or it is gone
      const k = r();
      if (k < W.hunt) { const one = prey(); if (one && dash(one.at)) return; }
      if (k < 0.75 && dash(null)) return;
      if (off()) return;
      now.until = 2 + r() * 4;
    },
  };
  const roost = {
    wary: false,
    enter(a, s, sd) { at = s; side = sd; w.last = null; place(s, sd, bird.at, bird.q); },
    step() {
      if (world.day >= 0.08) { a.to('perch', at, side); return; }
      sit({ yaw: 0, pitch: -0.2, roll: 0 });
      bird.doing = 'at roost inside the canopy';
    },
  };
  // On a dash: low and fast through the trees, beating and gliding, its alarm going with it.
  const dashAct = {
    wary: false, pose: w.held,
    enter(a, legs, end, sd) {
      Object.assign(a.now, { legs, k: 0, end, sd, time: 0, alarm: raise(world, { at: bird.at, reach: W.alarm, until: world.clock + 20, size: bird.size, by: bird }) });
      bird.state = 'fly'; at = null;
      w.start(4, 0);                                         // (off a perch: a dash begins from one)
      bird.doing = 'dashing low through the trees';
    },
    step(a, dt) {
      const now = a.now;
      now.time += dt;
      const g = now.legs[now.k];
      const d = w.steer(dt, g, { speed: W.dash, turn: 3.2, climb: 4, sink: 5, clear: 1.1, ahead: 0.8 });
      w.pose('pulse', dt);
      const behind = (g.x - bird.at.x) * w.hx + (g.z - bird.at.z) * w.hz < 0;
      if (d < 2.5 || (behind && d < 8)) now.k += 1;
      if (now.k < now.legs.length && now.time < 15) return;
      // (its perch, if no other bird has taken it meanwhile and the walker has not come near it: a dash is up to 15 s,
      // and put by the perch once the dash was under way, a walker had the hawk land 4 to 7 m from them and go up again
      // at once, eight times of eight in a probe of 2026-11-16)
      if (now.end && world.free(now.end.point, bird, 0.6) && a.clear(now.end.point)) { bird.aloft = true; flyTo(now.end, now.sd, W.dash * 0.55); return; }
      if (off()) return;
      // (nowhere to go: onto the nearest free perch, then)
      const any = perchesNear(bird.at.x, bird.at.z, 25).filter((s) => open(s, 0.6));
      if (any.length) { bird.aloft = true; flyTo(any[0], 1); return; }
      now.legs.push(bird.at.clone().addScaledVector(_w.set(w.hx, 0, w.hz), 15)); now.time = 10;
    },
    exit(a) { if (a.now.alarm) a.now.alarm.until = world.clock; },
  };

  return {
    activities: { perch, roost, dash: dashAct, fly: flight(bird, way, w) },
    // Flushed: off through the trees to a perch further from the walker (and now and then its alarm call); or nowhere near.
    refuge() {
      const all = perchesNear(bird.at.x, bird.at.z, 40).filter((s) => s !== at && open(s, 0.6) && a.clear(s.point, 4) && !world.blocked(bird.at, s.point));
      if (!all.length) return false;
      all.sort((p, q) => q.point.distanceTo(world.eye) - p.point.distanceTo(world.eye));
      const s = all[Math.floor(r() * Math.min(3, all.length))];
      if (way.call && r() < 0.4) world.say(bird, 'call', way.call.reach);
      flyTo(s, r() < 0.5 ? 1 : -1);
      bird.doing = 'off through the trees';
      return true;
    },
    // Where it is when it comes: on a perch in its part of the wood, in from out of sight if it could be seen to be there.
    begin() {
      // (for the tools: a pass through `point`, from the next perch it is on)
      bird.pass = (point) => { passTo = point.clone(); return true; };
      const all = perchesNear(home.x, home.z, 30).filter((s) => open(s));
      if (!all.length) { bird.left = 10 + r() * 20; return; }
      const s = pick(all), sd = r() < 0.5 ? 1 : -1;
      if (world.day < 0.08) { if (a.life.first) { a.to('roost', s, sd); return; } bird.left = 30 + r() * 60; return; }
      a.to('perch', s, sd);
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.7)) {
        place(s, sd, _v, _q);
        if (!a.come({ at: _v.clone(), q: _q.clone(), rise: 0.3, floor: world.height }, 'perch', s, sd)) bird.left = 6 + r() * 10;
      }
    },
  };
}

export default {
  // what a raptor's way holds besides what every way has (life/families/index.js)
  fields: {
    manner: oneOf('eagle', 'hawk'),                 // the eagle's life of the river, or a hawk's of the wood
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies about (m/s)
    pulse: nums(2),                                 // on the wing: how many beats, then how many seconds gliding
    stay: nums(2),                                  // seconds on a perch
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    call: optional({ every: nums(2), time: 'number', rate: 'number', reach: 'number', doing: 'string' }),
    // the eagle's: the tops it perches on (how far from the water, m, how far for the first trees back from it, and
    // how tall), the stretch of the river it keeps
    // to (metres down it), and its flights: a soar (seconds; how high over the water it starts and how much it rises,
    // m; how fast it rises, m/s; the circle's radius; how far along the river from where it is), a run along the river
    // (how far, m; how high over the water), a pass (where along the river it may strike; how fast it goes down),
    // how fast it goes off, and what it does next by shares
    river: optional({ water: 'number', edge: 'number', top: nums(2), reach: nums(2), soar: nums(2), high: nums(2), rise: nums(2), climb: 'number', soarSpeed: 'number',
      radius: nums(2), wander: 'number', cruise: nums(2), low: nums(2), pass: nums(2), dive: 'number', away: 'number',
      // (2026-11-19) its hunt and its meal: the chance a strike takes a fish; how fast it carries one (m/s) and how it
      // labours (beats, then seconds gliding); the chance it carries it off to its nest rather than to the bar; how far
      // from the walk a spot on the bar must be to eat on (m), and how far along the river it carries a fish to one
      // (m); how long it eats (s)
      catch: 'number', carry: 'number', labour: nums(2), nest: 'number', bar: 'number', barReach: 'number', feed: nums(2),
      next: { soar: 'number', cruise: 'number', pass: 'number', move: 'number', leave: 'number' } }),
    // a hawk's: how far from the walk the trees of its part of the wood stand; how high its perches are (m above the
    // ground) and how thick (m); how fast it dashes, how high over the ground (m), how far its next perch is; the
    // reach of the alarm it raises (m); and the chance it dashes at a small bird it has seen
    wood: optional({ off: 'number', low: 'number', high: 'number', thick: 'number', dash: 'number', fly: 'number', range: nums(2), alarm: 'number', hunt: 'number' }),
  },
  act: (way) => (bird, world) => live(bird, world, way, way.manner === 'eagle' ? eagle : hawk),
  home: (way) => (way.manner === 'eagle' ? eagleHome(way.river) : hawkHome(way.wood)),
};
