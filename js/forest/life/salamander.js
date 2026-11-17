import * as THREE from 'three';
import { Skin, curve } from './skin.js';

// A salamander or a newt, built from its species sheet (life/species): the body plan 'salamander'. The rough-skinned
// newt, the western red-backed salamander, the ensatina, the Olympic torrent salamander and Cope's giant salamander
// are one plan and differ by their sheets. Written in the frog's way (life/frog.js) and measured as the birds' and the
// frogs' are. Every length in the sheet's `shape` is in units of the snout-to-vent length (`shape.svl`, millimetres),
// so one builder serves a stout newt, a slender red-backed salamander and a long-legged ensatina by their sheets
// alone. The body is built in metres in the bind pose, which is the animal standing at rest on level ground, its body
// straight: +x the way it faces, +y up, +z its right, the origin on the ground under the middle of its trunk. Each
// bone's own turn is nothing in the bind pose; a pose turns each bone from there (life/salamanderRig.js).
//
//   shape.rings     the whole animal, one skin from the snout (s = 0) through the vent (s = 1) to the tail's tip
//                   (s = 1 + shape.tail): rings [s, up, down, half its width, how square], `up` and `down` from the
//                   body's line. Square is 2 for an ellipse, more for a box, less for a lens (a tail flattened from side
//                   to side, which has an edge above and below)
//   shape.tail      the tail's length, vent to tip
//   shape.ends      [snout, tip]: how far back from the snout, and from the tail's tip, the skin rounds off to a point
//   shape.axis      the height of the body's line above the ground in the bind pose
//   shape.neck      s where the head turns on the trunk; shape.shoulder, shape.hip: the girdles, where the limbs leave
//   shape.eye       { s, up, side, r }: a dome set on the head, `up` above the body's line, `side` out from its middle
//   shape.fore, shape.hind   a limb: { upper, lower (its two bones), girth: [at the top, the elbow or knee, the wrist
//                   or ankle], foot: [ahead, out] (where the wrist or ankle stands on the ground: ahead of its girdle,
//                   and out from the body's middle), palm, wide, toes: [lengths from the first (inner) out], toe (a
//                   toe's radius at its base), spread (degrees the toes fan across), turn (degrees the foot is turned
//                   out from straight ahead) }: four toes in front and five behind
//   shape.stride    how far the body goes on in one stride (the rig and the family read it)
//   shape.gills     a gilled animal's (Cope's giant salamander keeps its gills for life): { s, up, side, stalks:
//                   [[length, out, up], ...] (degrees from straight back), fringe: [filaments to a stalk, length], r }
// Three detail levels from one sheet: 0 for the close-up, 1 for the middle distance, 2 for one a few pixels long.

export const SAL_BONES = ['root', 't2', 'chest', 'head', 't4', 'hips', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6',
  'armL', 'foreL', 'handL', 'armR', 'foreR', 'handR', 'thighL', 'shankL', 'footL', 'thighR', 'shankR', 'footR', 'gillL', 'gillR'];
export const SAL_PARENT = { t2: 'root', chest: 't2', head: 'chest', t4: 'root', hips: 't4', tail1: 'hips', tail2: 'tail1', tail3: 'tail2',
  tail4: 'tail3', tail5: 'tail4', tail6: 'tail5',
  armL: 'chest', foreL: 'armL', handL: 'foreL', armR: 'chest', foreR: 'armR', handR: 'foreR',
  thighL: 'hips', shankL: 'thighL', footL: 'shankL', thighR: 'hips', shankR: 'thighR', footR: 'shankR', gillL: 'head', gillR: 'head' };
// the spine from the snout back, and the tail's bones
export const FRONT = ['head', 'chest', 't2', 'root'], BACK = ['root', 't4', 'hips', 'tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6'];
export const TAIL = ['tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6'];
// each limb's bones from its girdle down, and the girdle's bone
export const LIMBS = {
  LF: { fore: true, side: -1, chain: ['armL', 'foreL', 'handL'], girdle: 'chest' },
  RF: { fore: true, side: 1, chain: ['armR', 'foreR', 'handR'], girdle: 'chest' },
  LH: { fore: false, side: -1, chain: ['thighL', 'shankL', 'footL'], girdle: 'hips' },
  RH: { fore: false, side: 1, chain: ['thighR', 'shankR', 'footR'], girdle: 'hips' },
};
const B = Object.fromEntries(SAL_BONES.map((name, i) => [name, i]));

// Where each part's paint is in the animal's one sheet: [x0, y0, x1, y1] as shares of the canvas, top-down.
// life/salamanderSkin.js paints into the same table. The body's cell runs along the animal from the snout (its left
// edge) to the tail's tip, and round it from the belly (its top edge) up the right side, over the back (the middle)
// and down the left side to the belly again (its bottom edge). A limb's column goes round it, and down it from its
// girdle to its wrist or ankle (to WRIST), then the palm (to TOES) and the toes.
export const SAL_SHEET = [1024, 512];               // (a close-up frames the whole animal in about 450 pixels at 1080 lines, 600 at 1440: the body's cell, 1024 across, is about twice that)
export const SCELLS = {
  body:  [0.0, 0.0, 1.0, 0.62],
  limbs: [0.0, 0.64, 0.5, 1.0],
  eye:   [0.52, 0.64, 0.6, 0.8],
  gills: [0.62, 0.64, 0.82, 1.0],
};
export const WRIST = 0.6, TOES = 0.76;
const inCell = (cell, u, v) => [cell[0] + (cell[2] - cell[0]) * u, 1 - (cell[1] + (cell[3] - cell[1]) * v)];
// what each detail level is made of: rows along the head, the trunk and the tail; vertices round the body; sides and
// rows of a limb; whether the toes, the eyes and the gills' fringe are built
const RES = [
  { head: 13, trunk: 20, tail: 21, round: 14, limb: 8, rows: 3, toe: 4, palm: true, eye: [8, 4], gill: [4, 2], fringe: true },
  { head: 5, trunk: 8, tail: 9, round: 8, limb: 4, rows: 1, toe: 0, palm: true, eye: null, gill: [3, 1], fringe: false },
  { head: 2, trunk: 3, tail: 3, round: 4, limb: 3, rows: 1, toe: 0, palm: false, eye: null, gill: null, fringe: false },
];
const D = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// A skin that can close a tube with a fan of triangles from one vertex.
class Body extends Skin {
  cap(centre, first, n, flip) {
    const from = this.index.length;
    for (let i = 0; i < n; i += 1) { const a = first + i; if (flip) this.index.push(centre, a + 1, a); else this.index.push(centre, a, a + 1); }
    this.shade(from, this.index.length);
  }
}

// A point round a ring: `h` 0 at the belly, 1 at the spine. Its height above the ring's middle (y) and how far out to
// the side it is (z, never below nothing).
export function oval(h, up, down, half, square, out) {
  const th = h * Math.PI, c = -Math.cos(th), s = Math.sin(th), e = 2 / square;
  out.y = Math.sign(c) * Math.abs(c) ** e * (c > 0 ? up : down);
  out.z = Math.abs(s) ** e * half;
  return out;
}

// Where the middle joint of a two-bone limb goes, from its top `a` towards `c`, the bones `l1` and `l2` long, bending
// towards `pole`: into `out`, and where its end then is into `end` (short of `c` if `c` is out of reach).
const _x = V(), _z = V();
export function knee(a, c, l1, l2, pole, out, end) {
  _x.subVectors(c, a);
  const d = Math.min((l1 + l2) * 0.9995, Math.max(Math.abs(l1 - l2) + 1e-6, _x.length()));
  _x.normalize();
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), up = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  _z.copy(pole).addScaledVector(_x, -pole.dot(_x));
  if (_z.lengthSq() < 1e-12) _z.set(0, 1, 0);
  _z.normalize();
  out.copy(a).addScaledVector(_x, along).addScaledVector(_z, up);
  return end.copy(a).addScaledVector(_x, d);
}
// which way an elbow (a fore limb) or a knee (a hind limb) bends: up, out to its side, and back or forward
export const pole = (fore, side, out = V()) => out.set(fore ? -0.35 : 0.35, 1, side * 0.55).normalize();

export function buildSalamander(sheet, level = 0) {
  const sh = sheet.shape, res = RES[level], L = sh.svl / 1000, skin = new Body(), marks = {}, pivots = {}, limbs = {}, contact = [];
  const S = 1 + sh.tail, mid = (sh.shoulder + sh.hip) / 2, axis = sh.axis * L;
  const X = (s) => (mid - s) * L;                                     // the body's line, in metres along x
  const col = (k) => curve(sh.rings.map((r) => [r[0], r[k]]));
  const cUp = col(1), cDown = col(2), cHalf = col(3), cSq = col(4);
  const [snoutEnd, tipEnd] = sh.ends;
  // how much of a ring is left where the skin rounds off to the snout's point and to the tail's
  const round = (s) => {
    let k = 1;
    if (s < snoutEnd) k = Math.sqrt(Math.max(0, 1 - (1 - s / snoutEnd) ** 2));
    const e = S - s;
    if (e < tipEnd) k *= Math.sqrt(Math.max(0, 1 - (1 - e / tipEnd) ** 2));
    return k;
  };
  // the ring at s, in metres: how far it reaches above and below the line, its half width and squareness
  const ringAt = (s, out = {}) => { const k = round(s); out.up = cUp(s) * L * k; out.down = cDown(s) * L * k; out.half = cHalf(s) * L * k; out.sq = cSq(s); return out; };
  const _o = { y: 0, z: 0 }, _r = {};

  // ---- the spine's joints, from the snout back: the head turns at the neck, the trunk at the shoulders, half way
  // to the middle, the middle (the root) and half way to the hips, and the tail at the vent and five more along it
  const at = { head: sh.neck, chest: sh.shoulder, t2: (sh.shoulder + mid) / 2, root: mid, t4: (mid + sh.hip) / 2, hips: sh.hip };
  TAIL.forEach((name, k) => { at[name] = 1 + (sh.tail * k) / TAIL.length; });
  for (const name of [...FRONT, ...BACK]) pivots[name] = V(X(at[name]), axis, 0);
  // which bones hold a ring at s: the bone whose own stretch it is, shared with the next across each joint. A bone's
  // own stretch of the front is from its joint back to its parent's; of the back, from its joint on to its child's.
  const spineAt = (s, out) => {
    const chain = s <= mid ? FRONT : BACK;
    const joints = chain.map((name) => at[name]);
    // the bone whose stretch s is in
    let k;
    if (s <= mid) { k = chain.length - 1; for (let i = 0; i < chain.length; i += 1) if (s <= joints[i]) { k = i; break; } }
    else { k = 0; for (let i = chain.length - 1; i >= 0; i -= 1) if (s >= joints[i]) { k = i; break; } }
    out.b0 = B[chain[k]]; out.b1 = out.b0; out.w1 = 0;
    // shared across the nearest joint: half the way to the joints either side of it, at the most
    const near = (i) => { const gaps = []; if (i > 0) gaps.push(Math.abs(joints[i] - joints[i - 1])); if (i < joints.length - 1) gaps.push(Math.abs(joints[i + 1] - joints[i])); return 0.42 * Math.min(...gaps); };
    for (let i = 0; i < chain.length; i += 1) {
      const p = joints[i], width = near(i);
      if (Math.abs(s - p) >= width || chain[i] === 'root') continue;
      // the joint of bone i: on its child's side its own, on its parent's side its parent's
      const parent = s <= mid ? chain[i + 1] : chain[i - 1], child = chain[i];
      if (!parent) continue;
      const share = s <= mid ? smooth(p + width, p - width, s) : smooth(p - width, p + width, s);
      out.b0 = B[parent]; out.b1 = B[child]; out.w1 = share;
      return out;
    }
    return out;
  };

  // ---- the body: one skin from the snout to the tail's tip, a ring at every row, one row at the vent
  const ss = [];
  const span = (from, to, n, warp) => { for (let j = 0; j < n; j += 1) ss.push(from + (to - from) * warp(j / n)); };
  const headEnd = Math.min(sh.shoulder, sh.neck + 0.08);
  span(0.004, headEnd, res.head, (t) => 1 - Math.cos((t * Math.PI) / 2) * (1 - 0.15 * t));        // close together at the snout
  span(headEnd, 1, res.trunk, (t) => t);
  span(1, S - 0.002, res.tail, (t) => t);
  ss.push(S - 0.002);
  const rows = ss.length - 1, m = res.round, w = { b0: 0, b1: 0, w1: 0 };
  const bodyBase = skin.sheet(m, rows, (i, j, out) => {
    const s = ss[j], r = ringAt(s, _r), a = (i / m) * 2, h = a <= 1 ? a : 2 - a;
    oval(h, r.up, r.down, r.half, r.sq, _o);
    out.p.set(X(s), axis + _o.y, a <= 1 ? _o.z : -_o.z);
    [out.u, out.v] = inCell(SCELLS.body, s / S, a / 2);
    spineAt(s, w); out.b0 = w.b0; out.b1 = w.b1; out.w1 = w.w1;
  }, { wrap: true });
  {
    const snout = skin.vertex(X(0), axis, 0, ...inCell(SCELLS.body, 0.0005, 0.25), B.head);
    skin.cap(snout, bodyBase, m, true);
    const tip = skin.vertex(X(S), axis, 0, ...inCell(SCELLS.body, 0.9995, 0.5), B.tail6);
    skin.cap(tip, bodyBase + rows * (m + 1), m, false);
    marks.snout = [snout]; marks.tip = [tip];
    const vent = ss.indexOf(1);
    marks.vent = [bodyBase + vent * (m + 1)];                        // the ring at the vent, under the belly
  }
  // the belly, the chin and the underside of the tail, for setting a pose down on the ground
  for (const s of [0.1, 0.3, 0.5, 0.7, 0.9, 1.15, 1 + sh.tail * 0.45, 1 + sh.tail * 0.75]) {
    const r = ringAt(s, _r);
    spineAt(s, w);
    contact.push({ p: V(X(s), axis - r.down, 0), bone: w.w1 > 0.5 ? w.b1 : w.b0, r: 0 });
  }

  // ---- a tube from a list of rings (each { c, n1, n2, a, b }), its paint from `paint(u, j)`, its bones from `bones(j, out)`
  const tube = (rings, sides, paint, bones) => skin.sheet(sides, rings.length - 1, (i, j, out) => {
    const R = rings[j], th = (i / sides) * Math.PI * 2;
    out.p.copy(R.c).addScaledVector(R.n1, Math.cos(th) * R.a).addScaledVector(R.n2, Math.sin(th) * R.b);
    [out.u, out.v] = paint(i / sides, j);
    bones(j, out);
  }, { wrap: true });
  // a ring round `dir` at `c`, with n1 as near to `toward` as it can be
  const ring = (dir, c, a, b, toward = V(0, 1, 0)) => {
    const n1 = toward.clone().addScaledVector(dir, -toward.dot(dir));
    if (n1.lengthSq() < 1e-10) n1.set(1, 0, 0).addScaledVector(dir, -dir.x);
    n1.normalize();
    return { c, n1, n2: dir.clone().cross(n1).normalize(), a, b };
  };

  // ---- the limbs: each held out to its side from its girdle, bent down at the elbow or knee to a hand or foot laid
  // flat on the ground, and the toes on the ground before it
  const column = (key) => ['LF', 'RF', 'LH', 'RH'].indexOf(key);
  for (const [key, limb] of Object.entries(LIMBS)) {
    const spec = limb.fore ? sh.fore : sh.hind, side = limb.side, sAt = limb.fore ? sh.shoulder : sh.hip, r = ringAt(sAt, {});
    const l1 = spec.upper * L, l2 = spec.lower * L, [g0, g1, g2] = spec.girth.map((g) => g * L), pt = g2 * 0.62;
    const P0 = V(X(sAt), axis - r.down * 0.3, side * r.half * 0.72);
    const want = V(X(sAt) + spec.foot[0] * L, pt, side * spec.foot[1] * L), P1 = V(), P2 = V();
    knee(P0, want, l1, l2, pole(limb.fore, side), P1, P2);
    const turn = spec.turn * D, fd = V(Math.cos(turn), 0, side * Math.sin(turn));
    limbs[key] = { top: P0, joint: P1, end: P2, lengths: [l1, l2], foot: fd.clone(), palm: pt };
    limb.chain.forEach((name, i) => { pivots[name] = [P0, P1, P2][i].clone(); });
    const col = column(key), [bTop, bMid, bEnd] = limb.chain.map((name) => B[name]), girdle = B[limb.girdle];
    const paintAt = (v) => (u) => inCell(SCELLS.limbs, (col + u) / 4, v);
    // the leg itself, top to wrist: a ring at its top, either side of the elbow and at the wrist
    const d1 = V().subVectors(P1, P0).normalize(), d2 = V().subVectors(P2, P1).normalize(), bend = V().addVectors(d1, d2).normalize();
    const ringsAlong = [], weights = [];
    const rowsUp = res.rows, rowsDown = res.rows;
    for (let k = 0; k <= rowsUp; k += 1) { const t = k / rowsUp; ringsAlong.push(ring(k === rowsUp ? bend : d1, P0.clone().lerp(P1, t), lerp(g0, g1, t), lerp(g0, g1, t) * 0.9)); weights.push([bTop, k === 0 ? girdle : bTop, k === 0 ? 0.5 : 0, t * 0.5]); }
    for (let k = 1; k <= rowsDown; k += 1) { const t = k / rowsDown; ringsAlong.push(ring(d2, P1.clone().lerp(P2, t), lerp(g1, g2, t), lerp(g1, g2, t) * 0.9)); weights.push([bMid, bMid, 0, 0.5 + t * 0.5]); }
    // (the row at the elbow is shared by the two bones)
    weights[rowsUp] = [bTop, bMid, 0.5, 0.5];
    const legBase = tube(ringsAlong, res.limb, (u, j) => paintAt(WRIST * weights[j][3])(u), (j, out) => { out.b0 = weights[j][0]; out.b1 = weights[j][1]; out.w1 = weights[j][2]; });
    // the hand or the foot: a flattened tube from the wrist forward, closed at its end; then the toes. (Furthest off,
    // the leg is closed at the wrist: a hand there is under a pixel.)
    const lat = fd.clone().cross(V(0, 1, 0)).normalize();                                            // across the foot, to its right
    if (!res.palm) {
      const centre = skin.vertex(P2.x, P2.y, P2.z, ...inCell(SCELLS.limbs, (col + 0.5) / 4, WRIST), bMid);
      skin.cap(centre, legBase + (ringsAlong.length - 1) * (res.limb + 1), res.limb, false);
    }
    const palmRings = [];
    for (let k = 0; k <= 2; k += 1) {
      const t = k / 2, c = P2.clone().addScaledVector(fd, spec.palm * L * t);
      c.y = lerp(P2.y, pt * 0.8, t);
      palmRings.push(ring(fd, c, lerp(pt, pt * 0.7, t), lerp(g2, spec.wide * L * 0.5, smooth(0, 1, t))));
    }
    const palmBase = !res.palm ? 0 : tube(palmRings, res.limb, (u, j) => inCell(SCELLS.limbs, (col + u) / 4, lerp(WRIST, TOES, j / 2)),
      (j, out) => { out.b0 = j === 0 ? bMid : bEnd; out.b1 = bEnd; out.w1 = j === 0 ? 0.5 : 0; });
    if (res.palm) {
      const end = P2.clone().addScaledVector(fd, spec.palm * L * 1.06); end.y = pt * 0.75;
      const centre = skin.vertex(end.x, end.y, end.z, ...inCell(SCELLS.limbs, (col + 0.5) / 4, TOES), bEnd);
      skin.cap(centre, palmBase + 2 * (res.limb + 1), res.limb, false);
    }
    contact.push({ p: P2.clone().setY(P2.y - pt), bone: bEnd, r: 0 });
    // the toes: from the palm's front edge, fanned, lying on the ground
    const n = spec.toes.length, fan = spec.spread * D, toeR = spec.toe * L;
    spec.toes.forEach((length, i) => {
      const f = n === 1 ? 0 : i / (n - 1) - 0.5, dir = fd.clone().applyAxisAngle(V(0, 1, 0), -side * f * fan).normalize();
      const start = P2.clone().addScaledVector(fd, spec.palm * L * 0.85).addScaledVector(lat, side * f * spec.wide * L * 0.8);
      start.y = toeR;
      const tipAt = start.clone().addScaledVector(dir, length * L);
      contact.push({ p: tipAt.clone().setY(0), bone: bEnd, r: 0 });
      if (!res.toe) return;
      const toeRings = [0, 0.5, 1].map((t) => ring(dir, start.clone().addScaledVector(dir, length * L * t), toeR * (1 - 0.35 * t), toeR * (1 - 0.35 * t) * 0.85));
      const toeBase = tube(toeRings, res.toe, (u, j) => inCell(SCELLS.limbs, (col + u) / 4, lerp(TOES, 0.98, j / 2)), (j, out) => { out.b0 = bEnd; });
      const end = start.clone().addScaledVector(dir, length * L + toeR * 0.6);
      const centre = skin.vertex(end.x, end.y, end.z, ...inCell(SCELLS.limbs, (col + 0.5) / 4, 0.995), bEnd);
      skin.cap(centre, toeBase + 2 * (res.toe + 1), res.toe, false);
    });
    void legBase;
  }

  // ---- the eyes: a dome each side of the head, its paint laid flat from the way it looks
  if (res.eye) {
    const E = sh.eye, [er, ea] = res.eye;
    for (const side of [-1, 1]) {
      const centre = V(X(E.s), axis + E.up * L, side * E.side * L), look = V(0.3, 0.75, side * 0.9).normalize(), R = E.r * L;
      const t1 = V(0, 1, 0).cross(look).normalize(), t2 = look.clone().cross(t1).normalize();
      const base = skin.sheet(er, ea, (i, j, o) => {
        const th = (i / er) * Math.PI * 2, ph = (j / ea) * (Math.PI / 2) * 1.15;        // a little more than half of it stands out
        o.p.copy(centre).addScaledVector(look, R * Math.cos(ph)).addScaledVector(t1, R * Math.sin(ph) * Math.cos(th)).addScaledVector(t2, R * Math.sin(ph) * Math.sin(th));
        const rho = 0.48 * (ph / ((Math.PI / 2) * 1.15));
        [o.u, o.v] = inCell(SCELLS.eye, 0.5 + rho * Math.cos(th) * side, 0.5 + rho * Math.sin(th));
        o.b0 = B.head;
      }, { wrap: true, flip: true });
      void base;
    }
  }

  // ---- the gills of one that keeps them: three stalks each side, behind the head, with a fringe of filaments
  pivots.gillL = pivots.head.clone(); pivots.gillR = pivots.head.clone();
  if (sh.gills) {
    const G = sh.gills;
    for (const side of [-1, 1]) {
      const name = side < 0 ? 'gillL' : 'gillR', bone = B[name], root = V(X(G.s), axis + G.up * L, side * G.side * L);
      pivots[name] = root.clone();
      if (!res.gill) continue;
      const [gs, gr] = res.gill;
      G.stalks.forEach(([length, out, up], k) => {
        const dir = V(-Math.cos(up * D) * Math.cos(out * D), Math.sin(up * D), side * Math.cos(up * D) * Math.sin(out * D)).normalize();
        const from = root.clone().add(V(0, (1 - k) * G.r * L * 1.6, 0)), len = length * L;
        const along = (t) => from.clone().addScaledVector(dir, len * t);
        const rr = (t) => G.r * L * (1 - 0.55 * t);
        const rings = Array.from({ length: gr + 1 }, (_, j) => ring(dir, along(j / gr), rr(j / gr), rr(j / gr)));
        const sb = tube(rings, gs, (u, j) => inCell(SCELLS.gills, u * 0.5, (j / gr) * 0.95), (j, o) => { o.b0 = j === 0 ? B.head : bone; o.b1 = bone; o.w1 = j === 0 ? 0.5 : 0; });
        const end = along(1).addScaledVector(dir, rr(1) * 0.8);
        const tipV = skin.vertex(end.x, end.y, end.z, ...inCell(SCELLS.gills, 0.25, 0.97), bone);
        skin.cap(tipV, sb + gr * (gs + 1), gs, false);
        if (!res.fringe) return;
        // the filaments: short, along the stalk's back, leaning out from it to either side by turns
        const [count, flen] = G.fringe, across = dir.clone().cross(V(0, 1, 0)).normalize();
        for (let f = 0; f < count; f += 1) {
          const t = 0.25 + (0.7 * (f + 0.5)) / count, p = along(t), sgn = f % 2 ? 1 : -1;
          const fdir = dir.clone().multiplyScalar(0.45).addScaledVector(across, sgn * 0.75).add(V(0, 0.35, 0)).normalize();
          const fl = flen * L * (1 - 0.35 * t), fr = G.r * L * 0.32;
          const fr2 = [0, 1].map((u) => ring(fdir, p.clone().addScaledVector(fdir, fl * u), fr * (1 - 0.6 * u), fr * (1 - 0.6 * u)));
          const fb = tube(fr2, 3, (u, j) => inCell(SCELLS.gills, 0.5 + u * 0.5, 0.1 + 0.8 * j), (j, o) => { o.b0 = bone; });
          const e = p.clone().addScaledVector(fdir, fl * 1.05);
          const fv = skin.vertex(e.x, e.y, e.z, ...inCell(SCELLS.gills, 0.75, 0.95), bone);
          skin.cap(fv, fb + 1 * 4, 3, false);
        }
      });
    }
  }

  const geometry = skin.geometry();
  geometry.computeBoundingSphere();
  // Where a place in the body's cell is on the animal, for the painter: s along, h round (0 the belly .. 1 the
  // spine), which side, and the place in units of the snout-to-vent length in the bind pose; and how far round the
  // body is there.
  const surface = {
    S, total: S, vent: 1,
    // the ring a share `u` of the way along the cell (in snout-to-vent lengths), for a painter that goes down a column
    column(u, out = {}) {
      const s = u * S, r = ringAt(s, _r);
      out.s = s; out.t = u; out.tail = Math.max(0, (s - 1) / sh.tail); out.x = X(s) / L; out.cy = sh.axis;
      out.up = r.up / L; out.down = r.down / L; out.half = r.half / L; out.sq = r.sq;
      out.round = (Math.PI * (r.up + r.down + 2 * r.half) / 2) / L;
      return out;
    },
    // a place on that ring, `v` of the way down the cell (round it from the belly by the right side)
    at(col, v, out = {}) {
      const a = 2 * v, h = a <= 1 ? a : 2 - a;
      oval(h, col.up, col.down, col.half, col.sq, _o);
      out.s = col.s; out.t = col.t; out.tail = col.tail; out.round = col.round; out.a = h; out.side = a <= 1 ? 1 : -1;
      out.x = col.x; out.y = col.cy + _o.y; out.z = a <= 1 ? _o.z : -_o.z;
      return out;
    },
    body(u, v) { return this.at(this.column(u, {}), v, {}); },
  };
  // the tail's droop: how far each of its bones is let down so that the tail lies along the ground, from the line's
  // height in the bind pose to a little over the underside of the tail's own rings (radians, down)
  const droop = TAIL.map((name, k) => {
    const s0 = at[name], s1 = k + 1 < TAIL.length ? at[TAIL[k + 1]] : S;
    const h0 = k === 0 ? axis : Math.max(ringAt(s0, {}).down + 0.002 * L, 0), h1 = Math.max(ringAt(s1, {}).down * 0.9, 0);
    return Math.atan2(h0 - h1, (s1 - s0) * L);
  });
  // (the first bone's droop takes the line from its height in the bind pose down; the rest follow the ground)
  let fall = 0;
  const droops = droop.map((d) => { const local = d - fall; fall = d; return local; });
  return { geometry, pivots, limbs, marks, surface, contact, L, S, at, droop: droops, triangles: skin.index.length / 3 };
}

// A species ready to be made into animals: its sheet and its three detail levels.
export function buildSalamanderKind(sheet) {
  const levels = [0, 1, 2].map((level) => buildSalamander(sheet, level));
  return { sheet, levels, plan: 'salamander', triangles: levels.map((l) => l.triangles) };
}

// The built animal measured from the vertices of its mesh, not read back from the numbers it was made from
// (millimetres): from the snout's tip to the vent, and to the tail's tip, along the body's line, as it lies straight in
// the pose it was built in.
export function measureSalamander(built) {
  const position = built.geometry.getAttribute('position'), v = V();
  const x = (list) => { let sum = 0; for (const i of list) sum += v.fromBufferAttribute(position, i).x; return sum / list.length; };
  const snout = x(built.marks.snout), vent = x(built.marks.vent), tip = x(built.marks.tip);
  return { svl: (snout - vent) * 1000, total: (snout - tip) * 1000, tail: (vent - tip) * 1000 };
}
export function compareSalamander(sheet, built) {
  const got = measureSalamander(built);
  return sheet.published.lengths.map(([key, what, mean, range, source]) => {
    const value = got[key], least = typeof range[0] === 'number' ? range[0] : -Infinity, most = typeof range[1] === 'number' ? range[1] : Infinity;
    const off = mean !== null ? (value - mean) / mean : (value < least ? (value - least) / least : value > most ? (value - most) / most : 0);
    return { key, what, built: value, mean, range, source, off };
  });
}
