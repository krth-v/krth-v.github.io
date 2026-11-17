import * as THREE from 'three';
import { SHAPE, river, creek, FALLS } from '../../world/land.js';
import { FINE } from '../../world/terrain.js';
import { frame, UP, flying, straightOn } from '../agents.js';

// Where the birds of the water can be, and how they fly along it: the American Dipper (life/families/stream.js) and
// the Spotted Sandpiper (life/families/shore.js). By the agent called dipper, 2026-11-16.
//
// The water, from the lie of the land (world/land.js: the creek's line and bed, the falls, the river's line):
//   its height, which is not `world.height` (that is the bed): the creek's as world/water.js lays it (a hand over its
//     bed; on the rock's lip over the rock; behind the pool's sill level with the sill, since no water stands higher
//     downstream than up), and the river's from land.js `river`. (The water's sheet lies a little lower where it runs
//     white, by up to 8 cm: world/water.js `whiteAt`, which is not exported. Not followed here.)
//   the course: the creek from its spring to its mouth and the river on from there, as one line along which a bird
//     flies low over the water, round every bend, over the falls' lip and down beside the falling water. A place on it
//     is { line: 'creek', s, off } (metres down the creek, and across it: + to the right of the way it runs) or
//     { line: 'river', down, side, from } (metres down the river; the bank, -1 ours, the left of the way it runs, +1
//     the far one; metres from the water's edge, negative in the water).
//   the rocks: the boulders the layout laid in the creek's bed below the falls and at the river's edges. A family has
//     no reader of the layout's records, and the habitat hands over only what is solid where (`solidAt`), in which a
//     boulder is a circle 0.38 m round at its scale (world/layout.js, CARPETS); so each is found by probing along the
//     water's edges for something solid and walking out from it to the circle's rim. A round circle of a boulder's
//     size there is one: an alder stands further back from the cobbles than a boulder lies (layout.js RIVER_KINDS
//     `band`), and a log or a bridge is a chain of circles, not one round one. Its top is the stone's own (plants/
//     stones.js: the big stone stands 0.234 m over its root at scale 1).
//   the falls' lip: the rock's own top either side of the chute, where a dipper stands at the brink. The rock is not
//     the ground there (the ground is the funnel the rock roofs over: plants/crag.js), and the rock hands the habitat
//     no reader of its surface: its height is the rock's notch floor (crag.js `notch`: the lip's height for 0.72 m
//     either side of the creek's middle), which the dev page's crag.standing gave as -1.82 to -1.86 there (2026-11-16):
//     the bird stands at -1.852, between them.
//   the spots: rocks, the lip, and the water's edge along the creek and both banks of the river.
// Nothing here stands outside the fine ground (world/terrain.js FINE), where `world.height` is not the ground as it is
// drawn; a flight may go anywhere.
//
// How they fly (`skim`, `skimming`, `alongTheWater`): along a line laid low over the water (`route`), at an even pace
// once under way, speeding up at the start and slowing to land; flushed or leaving, along the water away from the
// walker until they cannot plainly see it (the owner's rule for these two: a flushed one goes along the water, not
// into the trees); coming in, along the water from out of their sight.

const { CREEK, creekAlong: CA, RIVER, riverAlong: RA, HALF, CREEK_DEEP } = SHAPE;
const LC = CA[CA.length - 1], LR = RA[RA.length - 1];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
export const inFine = (x, z, margin = 0.5) => x > FINE.minX + margin && x < FINE.maxX - margin && z > FINE.minZ + margin && z < FINE.maxZ - margin;

// world/water.js RIFFLES, copied as it stands there (it is not exported): metres down the river, and half the riffle's
// length. A gravel river is pools and riffles by turns, and a dipper feeds where the water runs shallow and broken.
const RIFFLES = [[20, 13], [130, 14], [250, 15], [408, 13], [478, 12], [620, 14]];
export const riffle = (down) => { let most = 0; for (const [at, half] of RIFFLES) { const t = (down - at) / half; if (t > -1 && t < 1) most = Math.max(most, (1 - t * t) * (1 - t * t)); } return most; };

// ---- the creek: s metres down it, as world/water.js reads its line: [x, z, bed, half-width of the bed, bank slope]
export function creekAt(s, out = [0, 0, 0, 0, 0]) {
  let i = 0;
  while (i < CREEK.length - 2 && CA[i + 1] < s) i += 1;
  const t = Math.min(1, Math.max(0, (s - CA[i]) / (CA[i + 1] - CA[i]))), a = CREEK[i], b = CREEK[i + 1];
  for (let k = 0; k < 5; k += 1) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}
// the way the creek runs at s (unit [x, z]), over a metre and a bit
const _h0 = [0, 0, 0, 0, 0], _h1 = [0, 0, 0, 0, 0];
export function creekHeading(s, out = [0, 0]) {
  creekAt(Math.max(0, s - 0.6), _h0); creekAt(Math.min(LC, s + 0.6), _h1);
  const tx = _h1[0] - _h0[0], tz = _h1[1] - _h0[1], inv = 1 / (Math.hypot(tx, tz) || 1);
  out[0] = tx * inv; out[1] = tz * inv;
  return out;
}
// The falls, in metres down the creek, as world/water.js has them: the bed's own lip, its foot, the edge of the rock
// the water leaves, and the sill the pool's water stands level with.
export const S_LIP = CA[FALLS.sill - 3], S_FOOT = CA[FALLS.sill - 2], S_SILL = CA[FALLS.sill];
export const S_EDGE = S_FOOT + Math.hypot(FALLS.x - CREEK[FALLS.sill - 2][0], FALLS.z - CREEK[FALLS.sill - 2][1]);
export const LIP = FALLS.top + 0.09;                     // the water's height on the rock's lip
const DEEP = CREEK_DEEP * 0.97;
// the creek's water every quarter metre (no water stands higher downstream than up: a running maximum from the mouth
// back to the foot of the falls)
const STEP = 0.25, LEVEL = new Float32Array(Math.ceil(LC / STEP) + 2);
{
  const c = [0, 0, 0, 0, 0];
  for (let k = 0; k < LEVEL.length; k += 1) {
    const s = Math.min(LC, k * STEP);
    LEVEL[k] = s > S_LIP && s <= S_EDGE ? LIP : creekAt(s, c)[2] + DEEP;
  }
  for (let k = LEVEL.length - 2; k * STEP > S_EDGE; k -= 1) LEVEL[k] = Math.max(LEVEL[k], LEVEL[k + 1]);
}
export const creekLevel = (s) => { const f = Math.min(LEVEL.length - 1.001, Math.max(0, s / STEP)), k = Math.floor(f); return lerp(LEVEL[k], LEVEL[k + 1], f - k); };
export const POOL = creekLevel((S_EDGE + S_SILL) / 2);
// how far the creek's water reaches either side of its line (world/water.js `reach`; in the pool it is wider)
export const creekReach = (s, c = creekAt(s)) => c[3] + Math.min(0.5, (0.8 * CREEK_DEEP) / c[4]) + (s > S_EDGE && s < S_SILL ? 0.5 * (1 - smooth(S_SILL - 1.6, S_SILL - 0.4, s)) : 0);
// a point s metres down the creek and `off` metres across it (+ to the right of the way it runs)
const _ch = [0, 0], _cc = [0, 0, 0, 0, 0];
export function creekPoint(s, off, out) {
  creekAt(s, _cc); creekHeading(s, _ch);
  return out.set(_cc[0] - _ch[1] * off, 0, _cc[1] + _ch[0] * off);
}

// ---- the river: its middle line `down` metres down it, and the way it runs: [x, z, ux, uz]. The way it runs is
// blended with the next stretch's over the last few metres of each, so that a point beside the line (the water's
// edge, 6.5 m out) goes smoothly round the line's corners: taken from each stretch alone, it jumped a metre and more
// at every corner, and a sandpiper walking the edge jumped with it (found by the first smoke run, 2026-11-16).
const _r = [0, false, 0, 0, 0];
const dirOf = (i, out) => { const a = RIVER[i], b = RIVER[i + 1], ux = b[0] - a[0], uz = b[1] - a[1], inv = 1 / (Math.hypot(ux, uz) || 1); out[0] = ux * inv; out[1] = uz * inv; return out; };
const _u0 = [0, 0], _u1 = [0, 0];
export function riverMid(down, out = [0, 0, 0, 0]) {
  const d = Math.min(LR, Math.max(0, down));
  let lo = 0, hi = RA.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (RA[mid] <= d) lo = mid; else hi = mid; }
  const t = (d - RA[lo]) / Math.max(1e-6, RA[hi] - RA[lo]), a = RIVER[lo], b = RIVER[hi];
  out[0] = a[0] + (b[0] - a[0]) * t; out[1] = a[1] + (b[1] - a[1]) * t;
  dirOf(lo, _u0);
  const W = Math.min(3, (RA[hi] - RA[lo]) / 2), into = d - RA[lo], left = RA[hi] - d;
  let w = 0;
  if (into < W && lo > 0) { dirOf(lo - 1, _u1); w = 0.5 * (1 - into / W); }
  else if (left < W && hi < RA.length - 1) { dirOf(hi, _u1); w = 0.5 * (1 - left / W); }
  const ux = _u0[0] * (1 - w) + _u1[0] * w, uz = _u0[1] * (1 - w) + _u1[1] * w, inv = 1 / (Math.hypot(ux, uz) || 1);
  out[2] = ux * inv; out[3] = uz * inv;
  return out;
}
// a point `from` metres from the water's edge (negative in the water) on bank `side` (-1 ours, +1 the far one),
// `down` metres down the river (land.js `river` says a point is on our bank where it lies to the left of the way the
// river runs)
const _m = [0, 0, 0, 0];
export function riverPoint(down, side, from, out) {
  riverMid(down, _m);
  const d = HALF + from;
  return out.set(_m[0] - side * _m[3] * d, 0, _m[1] + side * _m[2] * d);
}
export const riverLevel = (x, z) => river(x, z, _r)[2];

// The water's surface over (x, z), or NaN where there is none.
const _k = [0, 0, 0, 0, 0];
export function waterAt(x, z) {
  creek(x, z, _k);
  if (_k[0] < 99 && _k[0] < creekReach(_k[4])) return creekLevel(_k[4]);
  river(x, z, _r);
  return _r[0] <= 0 ? _r[2] : NaN;
}

// ---- places on the course
// The creek's mouth, on the river: where its line's last point lies.
export const MOUTH = (() => { const [x, z] = CREEK[CREEK.length - 1]; river(x, z, _r); return { down: _r[4], x, z }; })();
// The place of a point on the water or by it (the creek's, if it is in or beside the creek).
export function placeOf(x, z) {
  creek(x, z, _k);
  if (_k[0] < 99 && _k[0] < creekReach(_k[4]) + 0.8) {
    creekAt(_k[4], _cc); creekHeading(_k[4], _ch);
    return { line: 'creek', s: _k[4], off: (x - _cc[0]) * -_ch[1] + (z - _cc[1]) * _ch[0] };
  }
  river(x, z, _r);
  return { line: 'river', down: _r[4], side: _r[1] ? -1 : 1, from: _r[0] };
}
// How far apart two places are along the water (m): the bank's far side counts the river's width more.
export function along(a, b) {
  if (a.line === 'creek' && b.line === 'creek') return Math.abs(a.s - b.s);
  if (a.line === 'river' && b.line === 'river') return Math.abs(a.down - b.down) + (a.side !== b.side ? 2 * HALF : 0);
  const c = a.line === 'creek' ? a : b, r = a.line === 'creek' ? b : a;
  return (LC - c.s) + Math.abs(r.down - MOUTH.down) + (r.side > 0 ? 2 * HALF : 0);
}
// A place `metres` along the water from `place` (+ downstream): over the water, a little in from the bank it is at.
// Down the creek past its mouth it goes on down the river by our bank; null where the water runs out.
export function shift(place, metres) {
  if (place.line === 'creek') {
    const s = place.s + metres;
    if (s < 0.5) return null;
    if (s <= LC) return { line: 'creek', s, off: Math.max(-0.4, Math.min(0.4, place.off * 0.5)) };
    const down = MOUTH.down + (s - LC);
    return down < LR - 1 ? { line: 'river', down, side: -1, from: -1.2 } : null;
  }
  const down = place.down + metres;
  return down > 1 && down < LR - 1 ? { line: 'river', down, side: place.side, from: Math.min(-0.6, place.from) } : null;
}
// Where a place is: on the water, at its height (+ `over` metres)
export function pointOf(place, over = 0, out = new THREE.Vector3()) {
  if (place.line === 'creek') {
    creekPoint(place.s, place.off, out);
    out.y = creekLevel(place.s) + over;
  } else {
    riverPoint(place.down, place.side, place.from, out);
    out.y = riverLevel(out.x, out.z) + over;
  }
  return out;
}

// The height a bird flies at over the creek at s: over its water, and at the falls over the lip until it is past the
// rock's face, then down beside the falling water into the bowl (or up it, the other way).
const flyLevel = (s) => (s > S_LIP - 0.3 && s <= S_EDGE + 0.3 ? LIP : s > S_EDGE + 0.3 && s < S_EDGE + 2.8 ? lerp(LIP, POOL, smooth(S_EDGE + 0.3, S_EDGE + 2.8, s)) : creekLevel(s));
// A flight's line from place `a` to place `b` (each with `at`, its point), every metre or so, `hover` metres over the
// water, into `list` (THREE.Vector3s). Along the creek it keeps over the water, and down or up the falls a little to
// one side of the falling sheet (a dipper goes beside a fall, or through it); along the river it keeps over the water
// near the bank it is going to, and crosses where it has to. `out`: how far out over the river the middle of a flight
// from a bank back to the same bank swings (the sandpiper's), metres.
const _p = new THREE.Vector3();
export function route(a, b, hover, { out: bulge = 0, list = [] } = {}) {
  list.length = 0;
  list.push(a.at.clone());
  const side = a.line === 'creek' && a.off < 0 ? -1 : 1;
  const creekLeg = (s0, s1, off0, off1) => {
    const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / 0.9));
    for (let i = 1; i < n; i += 1) {
      const t = i / n, s = lerp(s0, s1, t);
      // (beside the falls it keeps 0.85 m to one side of the chute's middle, coming over to it over a metre or so)
      const by = smooth(S_LIP - 2.6, S_LIP - 1.2, s) * (1 - smooth(S_EDGE + 2.8, S_EDGE + 4.2, s));
      const reach = creekReach(s) * 0.7 * (1 - by) + 0.9 * by;
      const off = Math.max(-reach, Math.min(reach, lerp(lerp(off0, off1, t), 0.85 * side, by)));
      creekPoint(s, off, _p); _p.y = flyLevel(s) + hover;
      list.push(_p.clone());
    }
  };
  // across the river: metres from its middle line, + towards the far bank
  const riverLeg = (d0, d1, lat0, lat1, swing) => {
    const n = Math.max(1, Math.ceil(Math.abs(d1 - d0) / 1.2), swing ? 6 : 1);
    for (let i = 1; i < n; i += 1) {
      const t = i / n, d = lerp(d0, d1, t);
      const lat = Math.max(-(HALF - 0.5), Math.min(HALF - 0.5, lerp(lat0, lat1, t) + swing * Math.sin(Math.PI * t)));
      riverMid(d, _m);
      _p.set(_m[0] - _m[3] * lat, 0, _m[1] + _m[2] * lat);
      _p.y = riverLevel(_p.x, _p.z) + hover;
      list.push(_p.clone());
    }
  };
  const lat = (p) => p.side * (HALF + Math.min(0, p.from) - 1.2);
  if (a.line === 'creek' && b.line === 'creek') creekLeg(a.s, b.s, a.off, b.off);
  else if (a.line === 'river' && b.line === 'river') riverLeg(a.down, b.down, lat(a), lat(b), a.side === b.side ? -a.side * bulge : 0);
  else if (a.line === 'creek') {
    creekLeg(a.s, LC, a.off, 0);
    list.push(new THREE.Vector3(MOUTH.x, riverLevel(MOUTH.x, MOUTH.z) + hover, MOUTH.z));
    riverLeg(MOUTH.down, b.down, -(HALF - 1.2), lat(b), 0);
  } else {
    riverLeg(a.down, MOUTH.down, lat(a), -(HALF - 1.2), 0);
    list.push(new THREE.Vector3(MOUTH.x, riverLevel(MOUTH.x, MOUTH.z) + hover, MOUTH.z));
    creekLeg(LC, b.s, 0, b.off);
  }
  list.push(b.at.clone());
  return list;
}

// ---- a flight along such a line. `bird.flight` holds what life/visit.js reads of a flight (`a`, `d`, `t`, `time`,
// `through`) and the line; the family's `fly` activity steps it with `skimming` and lays its own wings on it.
// It speeds up evenly over the first `ramp` of its time and slows evenly over the last to land (not when it goes on
// out of sight), and holds `speed` between.
const shareAt = (t, r, through) => {
  const r2 = through ? 0 : r, v = 1 / (1 - r / 2 - r2 / 2);
  if (t < r) return (v * t * t) / (2 * r);
  if (t > 1 - r2) return 1 - (v * (1 - t) * (1 - t)) / (2 * r2);
  return v * (r / 2 + (t - r));
};
export function skim(bird, path, speed, then, { through = false, land = null } = {}) {
  const len = [0];
  for (let i = 1; i < path.length; i += 1) len.push(len[i - 1] + path[i].distanceTo(path[i - 1]));
  const total = Math.max(len[len.length - 1], 0.01), ramp = Math.min(0.4, 1.4 / total);
  const v = 1 / (1 - ramp / 2 - (through ? 0 : ramp) / 2);
  bird.flight = { a: path[0].clone(), d: path[path.length - 1].clone(), path, len, total, ramp, through, then, k: 0, t: 0, time: Math.max(0.3, (total * v) / speed),
    q0: bird.q.clone(), q1: land ? land.clone() : null, aloft: !!bird.aloft, skim: true, floor: null, table: null, off: null };
  bird.aloft = false;
  bird.state = 'fly';
  bird.doing = 'flying';
}
const _a = new THREE.Vector3(), _d = new THREE.Vector3(), _q = new THREE.Quaternion();
const pointAlong = (f, want, out) => {
  let k = 0;
  while (k < f.len.length - 2 && f.len[k + 1] < want) k += 1;
  const seg = f.len[k + 1] - f.len[k], u = seg > 1e-6 ? Math.min(1, Math.max(0, (want - f.len[k]) / seg)) : 1;
  return out.lerpVectors(f.path[k], f.path[k + 1], u);
};
// One step of the flight: where the bird is and how it is turned (it takes off in the attitude it stood in, and lands
// in the one it is to land in). True when it has got there.
export function skimming(bird, dt) {
  const f = bird.flight;
  f.t = Math.min(1, f.t + dt / f.time);
  const want = shareAt(f.t, f.ramp, f.through) * f.total;
  while (f.k < f.len.length - 2 && f.len[f.k + 1] < want) f.k += 1;
  const seg = f.len[f.k + 1] - f.len[f.k], u = seg > 1e-6 ? Math.min(1, Math.max(0, (want - f.len[f.k]) / seg)) : 1;
  bird.at.lerpVectors(f.path[f.k], f.path[f.k + 1], u);
  // it faces where it will be a stride on, so a corner of the line is taken smoothly
  pointAlong(f, Math.min(f.total, want + 0.9), _a);
  _d.subVectors(_a, bird.at);
  if (_d.lengthSq() > 1e-6) { _d.y *= 0.4; frame(_d, UP, _q); } else _q.copy(bird.q);
  const begun = Math.min(1, f.t / 0.12), arrive = f.through || !f.q1 ? 1 : Math.min(1, (1 - f.t) / 0.14);
  bird.q.copy(_q);
  if (begun < 1) bird.q.slerpQuaternions(f.q0, _q, begun);
  if (arrive < 1) bird.q.slerp(f.q1, 1 - arrive);
  return f.t >= 1;
}

// The `fly` activity of a bird of the water: a flight along the water (`skim`) or the skeleton's own (`a.fly`, out,
// across and in: life/agents.js `flying`). `wings(a, dt, flare)` lays the kind's own wingbeat on a flight along the
// water (flare: 0 under way, to 1 as it lands). A flight that is taking it off out of the walker's sight
// (`flight.off`, the seconds it is to be gone) ends where they can no longer plainly see it; at the end of its line,
// if they still can, it goes on (`ways.onwards`).
export function flyActivity(a, wings, ways) {
  const { bird, world } = a;
  return {
    wary: false,
    step(a, dt) {
      const f = bird.flight;
      if (!f) return;
      if (!f.skim) { flying(bird, dt, a.way.hz); return; }
      const done = skimming(bird, dt);
      wings(a, dt, f.through || !f.q1 ? 0 : 1 - Math.min(1, (1 - f.t) / 0.16));
      if (f.off != null && f.t > 0.05 && !world.plain(bird.at, bird.size)) { bird.left = f.off; bird.flight = null; a.to('gone'); return; }
      if (!done) return;
      bird.flight = null;
      if (f.off != null) { ways.onwards(f.off); return; }
      if (f.q1) bird.q.copy(f.q1);
      f.then();
    },
  };
}

// How a bird of the water goes off, comes in and moves along it. `hover`: [least, most] metres over the water it
// flies at; `out`: how far out over the river a flight from a bank back to it swings (m). Returns { leave, come, go,
// onwards }: `leave(seconds)` and `come(to, landing, ...args)` are the skeleton's (life/behave.js), each false where
// there is no way that the walker would not see; `go(spot, landing, args, { doing, out })` is a flight of its own to
// a spot by the water.
const LEAVE = 170;                                       // metres along the water a bird going off flies at the most in one line
export function alongTheWater(a, { hover, out = 0 }) {
  const { bird, world, way, r } = a;
  const high = () => hover[0] + r() * (hover[1] - hover[0]);
  const here = () => ({ ...placeOf(bird.at.x, bird.at.z), at: bird.at.clone() });
  // the two ways along the water from a place, the one that takes it further from the walker first
  const away = (from) => {
    const ways = [];
    for (const dir of [1, -1]) {
      const p = shift(from, dir * 30);
      if (!p) continue;
      const at = pointOf(p);
      ways.push({ dir, far: Math.hypot(at.x - world.eye.x, at.z - world.eye.z) });
    }
    ways.sort((x, y) => y.far - x.far);
    return ways;
  };
  const offFrom = (from, seconds, dir) => {
    for (const reach of [LEAVE, 110, 60]) {
      const to = shift(from, dir * reach);
      if (!to) continue;
      to.at = pointOf(to, high());
      const path = route(from, to, high(), { list: [] });
      a.to('fly');
      bird.aloft = true;
      skim(bird, path, way.speed, null, { through: true });
      bird.flight.off = seconds;
      bird.doing = 'flying off along the water';
      return true;
    }
    return false;
  };
  const leave = (seconds) => {
    if (a.cast) return false;
    const from = here(), ways = away(from);
    for (const { dir } of ways) if (offFrom(from, seconds, dir)) return true;
    return false;
  };
  // at the end of its line and still in their sight: on along the water the same way, or as the skeleton's birds go
  const onwards = (seconds) => {
    const from = here(), ways = away(from);
    if (ways.length && offFrom(from, seconds, ways[0].dir)) return true;
    straightOn(bird, world, seconds, way.speed, 3);
    return true;
  };
  const come = (to, landing, ...args) => {
    const there = { ...placeOf(to.at.x, to.at.z), at: to.at.clone() };
    for (const far of [24, 36, 52, 75, 105, 150]) {
      for (const dir of r() < 0.5 ? [1, -1] : [-1, 1]) {
        const from = shift(there, dir * far);
        if (!from) continue;
        from.at = pointOf(from, high());
        if (world.plain(from.at, bird.size)) continue;
        const path = route(from, there, high(), { list: [] });
        a.to('fly');
        bird.at.copy(from.at);
        _d.subVectors(path[Math.min(1, path.length - 1)], from.at).setY(0);
        if (_d.lengthSq() > 1e-6) frame(_d, UP, bird.q);
        bird.aloft = true;
        skim(bird, path, way.speed, () => a.to(landing, ...args), { land: to.q });
        bird.doing = 'flying in along the water';
        return true;
      }
    }
    return false;
  };
  const go = (spot, landing, args, { doing = 'flying along the water', out: swing = out } = {}) => {
    const from = here(), to = { ...spot.place, at: spot.at };
    const path = route(from, to, high(), { out: swing, list: [] });
    a.to('fly');
    skim(bird, path, way.speed, () => a.to(landing, ...args), { land: spot.face(r) });
    bird.doing = doing;
    return true;
  };
  return { leave, come, go, onwards };
}

// ---- what is read from a habitat once, and kept with it
const KEPT = new WeakMap();
export function waters(habitat) {
  if (KEPT.has(habitat)) return KEPT.get(habitat);
  const began = performance.now();
  const ground = (x, z) => habitat.height(x, z);
  const solid = (x, z) => habitat.solidAt(x, z, 0);

  // the river's stretch that lies in the fine ground, in metres down it
  let D0 = Infinity, D1 = -Infinity;
  for (let i = 0; i < RIVER.length; i += 1) if (inFine(RIVER[i][0], RIVER[i][1], -HALF - 3)) { D0 = Math.min(D0, RA[i]); D1 = Math.max(D1, RA[i]); }

  // ---- the boulders, found by their solid circles
  const rocks = [];
  const ray = (x, z, dx, dz) => {
    let t = 0;
    while (t < 1.4 && solid(x + dx * (t + 0.04), z + dz * (t + 0.04))) t += 0.04;
    let lo = t, hi = t + 0.04;
    for (let k = 0; k < 7; k += 1) { const mid = (lo + hi) / 2; if (solid(x + dx * mid, z + dz * mid)) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  const found = (x, z, test) => {
    if (!solid(x, z) || rocks.some((k) => Math.hypot(k.x - x, k.z - z) < k.r + 0.06)) return;
    const e = ray(x, z, 1, 0), w = ray(x, z, -1, 0), n = ray(x, z, 0, 1), s = ray(x, z, 0, -1);
    const cx = x + (e - w) / 2, cz = z + (n - s) / 2;
    let least = Infinity, most = 0, sum = 0;
    for (let k = 0; k < 8; k += 1) { const th = (k / 8) * Math.PI * 2, d = ray(cx, cz, Math.cos(th), Math.sin(th)); least = Math.min(least, d); most = Math.max(most, d); sum += d; }
    const r = sum / 8;
    // a boulder's circle: round, and the size of one (0.38 m at scales 0.6 to 1.5)
    if (!(r > 0.2 && r < 0.6 && most - least < 0.06 && test(cx, cz))) { rocks.push({ x: cx, z: cz, r: Math.max(r, 0.1), no: true }); return; }
    const scale = r / 0.38;
    rocks.push({ x: cx, z: cz, r, scale, top: ground(cx, cz) + 0.234 * scale });
  };
  const c = [0, 0, 0, 0, 0], q = new THREE.Vector3();
  // the creek's bed below the falls, and a little up its banks
  for (let s = S_SILL - 0.4; s < LC; s += 0.3) {
    creekAt(s, c);
    for (let off = -(c[3] + 0.8); off <= c[3] + 0.8; off += 0.3) {
      creekPoint(s, off, q);
      if (inFine(q.x, q.z)) found(q.x, q.z, (x, z) => { creek(x, z, _k); return _k[0] - _k[2] < 0.75; });
    }
  }
  // both edges of the river, from a little way into the water to a little way up the cobbles (a boulder lies no
  // further back than 0.8 m behind them, and an alder no nearer)
  for (let down = D0; down < D1; down += 0.3) {
    for (const side of [-1, 1]) {
      for (let from = -1.6; from < 2.6; from += 0.3) {
        riverPoint(down, side, from, q);
        if (inFine(q.x, q.z)) found(q.x, q.z, (x, z) => { river(x, z, _r); return _r[0] < _r[3] + 0.72 && _r[0] > -4.5; });
      }
    }
  }
  const boulders = rocks.filter((k) => !k.no);

  // ---- the spots. Each is { kind, at (where the feet are), level (the water's surface by it), place (on the course,
  // with its `at`), into (the way into the water, [x, z]), depth (of water at the feet; below 0 it stands above it),
  // riffle, face(r) (a way to stand there: facing the water, or along it) }
  const spots = [];
  const add = (kind, at, level, place, into, more = {}) => {
    const spot = { kind, at, level, place: { ...place, at }, into, depth: level - at.y, riffle: 0, ...more };
    spot.face = (r) => {
      const th = Math.atan2(into[1], into[0]) + (r() - 0.5) * 2.6;
      return frame(_d.set(Math.cos(th), 0, Math.sin(th)), UP, new THREE.Quaternion());
    };
    spots.push(spot);
  };
  // rocks: their tops, where a top stands out of the water or is no more than a few centimetres under it
  for (const k of boulders) {
    const place = placeOf(k.x, k.z);
    const level = place.line === 'creek' ? creekLevel(place.s) : riverLevel(k.x, k.z);
    if (k.top < level - 0.03) continue;
    let into;
    if (place.line === 'creek') { creekHeading(place.s, _ch); const sg = Math.sign(place.off || 1); into = [_ch[1] * sg, -_ch[0] * sg]; }
    else { riverMid(place.down, _m); into = [_m[3] * place.side, -_m[2] * place.side]; }
    add('rock', new THREE.Vector3(k.x, k.top, k.z), level, place, into, { rock: k, riffle: place.line === 'river' ? riffle(place.down) : 0.6 });
  }
  // the falls' lip: the rock's own top either side of the chute, a hand behind its face
  {
    const across = [-FALLS.down[1], FALLS.down[0]], back = [-FALLS.down[0], -FALLS.down[1]];
    for (const sd of [-1, 1]) {
      const x = FALLS.x + across[0] * 0.66 * sd + back[0] * 0.2, z = FALLS.z + across[1] * 0.66 * sd + back[1] * 0.2;
      add('lip', new THREE.Vector3(x, FALLS.top - 0.012, z), LIP, { line: 'creek', s: S_EDGE - 0.2, off: 0.66 * sd }, [FALLS.down[0], FALLS.down[1]], { riffle: 1, dry: true });
    }
  }
  // the creek's water's edge, every two and a half metres, where its ribbon of water ends: on the gully's floor above
  // the falls (from below the old cedar's wet ground to a little above the lip) and from below the pool's sill to the
  // mouth; none in the pool, whose sides are the rock's
  for (let s = 20; s < LC - 0.8; s += 2.5) {
    if (s > S_LIP - 2 && s < S_SILL + 1.2) continue;
    creekAt(s, c); creekHeading(s, _ch);
    const level = creekLevel(s), reach = creekReach(s, c);
    for (const sd of [-1, 1]) {
      const off = (reach + 0.05) * sd;
      creekPoint(s, off, q);
      if (!inFine(q.x, q.z) || habitat.solidAt(q.x, q.z, 0.15)) continue;
      const y = ground(q.x, q.z), slope = Math.abs(ground(q.x + 0.2, q.z) - ground(q.x - 0.2, q.z)) + Math.abs(ground(q.x, q.z + 0.2) - ground(q.x, q.z - 0.2));
      if (y > level + 0.12 || y < level - 0.1 || slope > 0.35) continue;
      add('edge', new THREE.Vector3(q.x, y, q.z), level, { line: 'creek', s, off }, [_ch[1] * sd, -_ch[0] * sd], { riffle: 0.5 });
    }
  }
  // the river's water's edge on both banks, every two and a half metres, where the cobbles come down to it
  for (let down = Math.ceil(D0); down < D1; down += 2.5) {
    for (const side of [-1, 1]) {
      riverPoint(down, side, 0.06, q);
      if (!inFine(q.x, q.z) || habitat.solidAt(q.x, q.z, 0.12)) continue;
      river(q.x, q.z, _r);
      if (_r[3] < 0.5 || _r[0] < -0.1) continue;                           // a bar's cobbles, not a cut bank
      const y = ground(q.x, q.z), level = _r[2];
      if (y < level - 0.03 || y > level + 0.1) continue;
      riverMid(down, _m);
      add('edge', new THREE.Vector3(q.x, y, q.z), level, { line: 'river', down, side, from: 0.06 }, [_m[3] * side, -_m[2] * side], { riffle: riffle(down), bar: _r[3] });
    }
  }

  const kept = { rocks: boulders, spots, D0, D1, took: performance.now() - began };
  KEPT.set(habitat, kept);
  return kept;
}

// ---- the bed under the water, for a bird that walks into it and under it: from `start` (a point on the bed or by
// the water) heading `dir` ([x, z]), up to `n` points a few centimetres apart over the bed, turning a little as it
// goes and round what is solid, none in water deeper than `deepest` or out of it, none outside the fine ground.
// Into `out` ({ at, depth, level } each); returns how many there are.
export function wadeFrom(habitat, start, dir, deepest, r, n = 40, out = []) {
  out.length = 0;
  let x = start.x, z = start.z, hx = dir[0], hz = dir[1];
  const inv0 = 1 / (Math.hypot(hx, hz) || 1); hx *= inv0; hz *= inv0;
  for (let tries = 0; tries < n * 3 && out.length < n; tries += 1) {
    const step = 0.05 + 0.04 * r(), turn = (r() - 0.5) * 0.5, cs = Math.cos(turn), sn = Math.sin(turn);
    const nx = hx * cs - hz * sn, nz = hx * sn + hz * cs, px = x + nx * step, pz = z + nz * step;
    const level = waterAt(px, pz), bed = habitat.height(px, pz);
    if (!inFine(px, pz) || habitat.solidAt(px, pz, 0.07) || !Number.isFinite(level) || level - bed > deepest || level - bed < 0.005) {
      // turned away, to the left or the right, rather than out of the water, too deep or into a stone
      const sg = r() < 0.5 ? 1 : -1, ox = hx;
      hx = hx * 0.2 - hz * sg; hz = hz * 0.2 + ox * sg;
      const inv = 1 / (Math.hypot(hx, hz) || 1); hx *= inv; hz *= inv;
      continue;
    }
    x = px; z = pz; hx = nx; hz = nz;
    out.push({ at: new THREE.Vector3(x, bed, z), depth: level - bed, level });
  }
  return out.length;
}
