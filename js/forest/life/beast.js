import * as THREE from 'three';
import { Skin, curve } from './skin.js';
import { footLayout, buildPaw } from './parts/paw.js';
import { RODENT_BONES, RODENT_PARENT, rodentPivots, bushTail, rodentHead, rodentCone, earWidth, measureRodent } from './parts/rodent.js';

// A big animal that walks, built from its species sheet (life/species): the Roosevelt elk first. Metres, in the
// bind pose, which is the animal standing square on level ground: +x the way it faces, +y up, +z its right, the
// origin on the ground under the middle of its body. Each bone's own turn is nothing in the bind pose, and what it
// carries is built where it stands; a pose turns each bone from there (life/beastRig.js).
//
//   shape.trunk    the torso and the neck, one skin from the rump to inside the head, laid through rings. A ring is
//                  [top x, top y, bottom x, bottom y, half its width, how far up from the bottom it is widest (a
//                  share), how square it is (2 an ellipse)]: so the outline seen from the side is the rings' tops
//                  and bottoms, and between rings it is a smooth curve through them
//   shape.spine    the joints of the back and the neck, [x, y]: hips, chest, neck1, neck2, neck3 (the head turns
//                  at shape.head.at, the poll)
//   shape.head     { at, tilt, stations: [[s, up, down, half], ...], square, jaw: [s, up], eye: { s, up, side, r } }:
//                  its own skin round its own line, which leaves the poll at `tilt` degrees (- down); s is metres along
//                  that line, up the way the forehead faces and down the way the jaw does
//   shape.fore, shape.hind   a leg: { at: [x, z] of its top joint (the shoulder's, the hip's), bones: [the three
//                  from there to the fetlock], angles: [each from straight down, degrees, + its lower end behind its
//                  top], pastern: [ahead, down] from the fetlock to the coronet, hoof: [long, high, wide],
//                  girth: [[d, half front to back, half across, ahead], ...] with d metres down the leg from its top
//                  joint, share: { at, reach, most }: the trunk's skin round the elbow or the stifle that goes with
//                  the leg }; the fore's `scapula` is where the shoulder blade turns. Optional: fore `blade` { at, reach, most }, the skin
//                  over the shoulder that turns with the blade; `scapSwing`, `scapMost`, how far the blade turns with the leg's
//                  swing (radians a metre, and at the most); `lean` (either leg), how far the cannon leans with the foot on
//                  the ground (radians a metre). A top joint's height is not
//                  given: it is wherever the leg's bones put the sole on the ground.
//   shape.ear, shape.tail, shape.antler (in velvet, built for every animal of the kind and shrunk to nothing on a cow)
//
// Three detail levels from one sheet: 0 for the close-up, 1 for the middle distance, 2 for one a few pixels long.

export const BEAST_BONES = ['root', 'hips', 'chest', 'neck1', 'neck2', 'neck3', 'head', 'jaw', 'earL', 'earR', 'antlerL', 'antlerR', 'tail',
  'scapL', 'armL', 'foreL', 'canL', 'pastL', 'scapR', 'armR', 'foreR', 'canR', 'pastR',
  'thighL', 'shankL', 'metaL', 'pastHL', 'thighR', 'shankR', 'metaR', 'pastHR'];
export const BEAST_PARENT = { hips: 'root', chest: 'hips', neck1: 'chest', neck2: 'neck1', neck3: 'neck2', head: 'neck3', jaw: 'head',
  earL: 'head', earR: 'head', antlerL: 'head', antlerR: 'head', tail: 'hips',
  scapL: 'chest', armL: 'scapL', foreL: 'armL', canL: 'foreL', pastL: 'canL', scapR: 'chest', armR: 'scapR', foreR: 'armR', canR: 'foreR', pastR: 'canR',
  thighL: 'hips', shankL: 'thighL', metaL: 'shankL', pastHL: 'metaL', thighR: 'hips', shankR: 'thighR', metaR: 'shankR', pastHR: 'metaR' };
BEAST_BONES.push(...RODENT_BONES); Object.assign(BEAST_PARENT, RODENT_PARENT);        // (a bushy tail's chain, a cone and its scales: life/parts/rodent.js)
const B = Object.fromEntries(BEAST_BONES.map((name, i) => [name, i]));
// each leg's bones, from its top joint to its hoof
export const LEGS = {
  LF: { fore: true, side: -1, chain: ['armL', 'foreL', 'canL', 'pastL'], scap: 'scapL', col: 0 },
  RF: { fore: true, side: 1, chain: ['armR', 'foreR', 'canR', 'pastR'], scap: 'scapR', col: 1 },
  LH: { fore: false, side: -1, chain: ['thighL', 'shankL', 'metaL', 'pastHL'], col: 2 },
  RH: { fore: false, side: 1, chain: ['thighR', 'shankR', 'metaR', 'pastHR'], col: 3 },
};

// Where each part's paint is in the animal's one sheet: [x0, y0, x1, y1] as shares of the canvas, top-down.
// life/coat.js paints into the same table. The trunk's cell goes right round the body, along it from the rump (its
// left edge) to the head: the left side's belly at its top, the back along its middle, the right side's belly at
// its bottom. A leg's column goes round the leg from the back (its left edge) by the leg's left side, its front and
// its right side, and down it from the top joint to the fetlock, and then the pastern.
export const SHEET = [2048, 1536];
export const BCELLS = {
  trunk:  [0.000, 0.000, 1.000, 0.500],
  head:   [0.000, 0.505, 0.420, 0.745],
  legs:   [0.425, 0.505, 1.000, 0.865],
  ear:    [0.000, 0.750, 0.200, 0.895],          // the outer side in its left half, the inner in its right
  tail:   [0.205, 0.750, 0.285, 0.895],
  antler: [0.000, 0.900, 0.420, 1.000],
  hoof:   [0.425, 0.870, 0.640, 1.000],          // four columns, as the legs
  eye:    [0.645, 0.870, 0.705, 1.000],
};
export const PASTERN = 0.93;                     // down a leg's column, where the pastern's paint begins
const inCell = (cell, u, v) => [cell[0] + (cell[2] - cell[0]) * u, 1 - (cell[1] + (cell[3] - cell[1]) * v)];
const RES = [
  { along: 52, round: 24, head: [20, 16], leg: 0.026, legRound: 12, hoof: [12, 3], ear: [8, 6], tail: [6, 6], beam: [14, 9], tine: [6, 7], eye: [10, 5] },
  { along: 24, round: 12, head: [9, 8], leg: 0.075, legRound: 6, hoof: [6, 1], ear: [3, 2], tail: [3, 3], beam: [5, 5], tine: [3, 3], eye: null },
  { along: 11, round: 6, head: [4, 4], leg: 0.3, legRound: 4, hoof: [4, 1], ear: [1, 1], tail: [2, 1], beam: [3, 3], tine: null, eye: null },
];
const D = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// A skin whose vertices may be held by three bones (the trunk low by a shoulder or a haunch: two of the back's,
// and a leg's). The bird's skin is two, and is left as it was.
class Hide extends Skin {
  vertex3(x, y, z, u, v, b0, b1, w1, b2, w2) {
    this.position.push(x, y, z); this.normal.push(0, 0, 0); this.uv.push(u, v);
    this.bone.push(b0, b1, b2, 0); this.weight.push(1 - w1 - w2, w1, w2, 0);
    return this.count - 1;
  }
  sheet(cols, rows, at, { flip = false, wrap = false } = {}) {
    const base = this.count, out = { p: V(), u: 0, v: 0, b0: 0, b1: 0, w1: 0, b2: 0, w2: 0 };
    for (let j = 0; j <= rows; j += 1) {
      for (let i = 0; i <= cols; i += 1) {
        out.b1 = -1; out.w1 = 0; out.b2 = -1; out.w2 = 0;
        at(i, j, out);
        this.vertex3(out.p.x, out.p.y, out.p.z, out.u, out.v, out.b0, out.b1 < 0 ? out.b0 : out.b1, out.w1, out.b2 < 0 ? out.b0 : out.b2, out.w2);
      }
    }
    const first = this.index.length;
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const a = base + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
        if (flip) this.index.push(a, c, b, b, c, d); else this.index.push(a, b, c, b, d, c);
      }
    }
    this.shade(first, this.index.length);
    if (wrap) {
      for (let j = 0; j <= rows; j += 1) {
        const a = (base + j * (cols + 1)) * 3, b = (base + j * (cols + 1) + cols) * 3;
        for (let k = 0; k < 3; k += 1) { const sum = this.normal[a + k] + this.normal[b + k]; this.normal[a + k] = sum; this.normal[b + k] = sum; }
      }
    }
    return base;
  }
  // a fan from one vertex to a ring of `n` + 1 vertices from `first` (the last on the first), facing `out` if not `flip`
  cap(centre, first, n, flip) {
    const from = this.index.length;
    for (let i = 0; i < n; i += 1) { const a = first + i; if (flip) this.index.push(centre, a + 1, a); else this.index.push(centre, a, a + 1); }
    this.shade(from, this.index.length);
  }
}

// A row of a table of rows, by Catmull-Rom through them: `k` from 0 (the first row) to 1 (the last).
function rowAt(table, k, out = []) {
  const n = table.length, x = Math.min(n - 1, Math.max(0, k * (n - 1))), i = Math.min(n - 2, Math.floor(x)), t = x - i, t2 = t * t, t3 = t2 * t;
  const r0 = table[Math.max(0, i - 1)], r1 = table[i], r2 = table[i + 1], r3 = table[Math.min(n - 1, i + 2)];
  for (let c = 0; c < r1.length; c += 1) out[c] = 0.5 * (2 * r1[c] + (-r0[c] + r2[c]) * t + (2 * r0[c] - 5 * r1[c] + 4 * r2[c] - r3[c]) * t2 + (-r0[c] + 3 * r1[c] - 3 * r2[c] + r3[c]) * t3);
  return out;
}
// A point round an oval ring: `a` 0 at the bottom, up the right side (+z) to 1 at the top. Returns its height
// above the ring's middle (y) and how far out to the side it is (z, >= 0).
function oval(a, up, down, half, square, out) {
  const th = a * Math.PI, c = -Math.cos(th), s = Math.sin(th), e = 2 / square;
  out.y = Math.sign(c) * Math.abs(c) ** e * (c > 0 ? up : down);
  out.z = Math.abs(s) ** e * half;
  return out;
}

// Where a leg's joints are when it stands square: its top joint, then the next three down to the fetlock, the
// coronet, and the sole's middle (on the ground). The top joint is as high as the bones below it reach.
export function legLayout(spec, side, paw) {
  const z = side * spec.at[1], [l1, l2, l3] = spec.bones, [a1, a2, a3] = spec.angles.map((a) => a * D);
  const drop = l1 * Math.cos(a1) + l2 * Math.cos(a2) + l3 * Math.cos(a3) + spec.pastern[1] + (spec.hoof ? spec.hoof[1] : 0);
  const P0 = V(spec.at[0], drop, z);
  const P1 = P0.clone().add(V(-l1 * Math.sin(a1), -l1 * Math.cos(a1), 0));
  const P2 = P1.clone().add(V(-l2 * Math.sin(a2), -l2 * Math.cos(a2), 0));
  const P3 = P2.clone().add(V(-l3 * Math.sin(a3), -l3 * Math.cos(a3), 0));
  const coronet = P3.clone().add(V(spec.pastern[0], -spec.pastern[1], 0));
  if (!spec.hoof) return { joints: [P0, P1, P2, P3], lengths: [l1, l2, l3], coronet, ...footLayout(spec, side, paw, coronet) };
  const [long] = spec.hoof, heel = coronet.x - long * 0.3, toe = coronet.x + long * 0.7;
  return { joints: [P0, P1, P2, P3], lengths: [l1, l2, l3], coronet, heel, toe, sole: V((heel + toe) / 2, 0, z) };
}

// (the long tail of the weasel family, for a sheet whose tail tapers: life/parts/longBody.js)
import { longTail } from './parts/longBody.js';

export function buildBeast(sheet, level = 0) {
  const shape = sheet.shape, res = RES[level], skin = new Hide(), marks = {}, pivots = {}, legs = {};
  const unit = shape.unit ?? 1;                // (a small animal's own small sizes: life/parts/rodent.js)
  const head = shape.head, spine = shape.spine;
  const _o = { y: 0, z: 0 }, row = [];

  // ---- the joints
  pivots.root = V();
  for (const name of ['hips', 'chest', 'neck1', 'neck2', 'neck3']) pivots[name] = V(spine[name][0], spine[name][1], 0);
  pivots.head = V(head.at[0], head.at[1], 0);
  const hd = V(Math.cos(head.tilt * D), Math.sin(head.tilt * D), 0), hn = V(-hd.y, hd.x, 0);      // the head's line, and the way its forehead faces
  const onHead = (s, up, side) => V(head.at[0] + hd.x * s + hn.x * up, head.at[1] + hd.y * s + hn.y * up, side);
  pivots.jaw = onHead(head.jaw[0], head.jaw[1], 0);
  for (const [side, z] of [['L', -1], ['R', 1]]) {
    pivots[`ear${side}`] = onHead(shape.ear.s, shape.ear.up, z * shape.ear.side);
    pivots[`antler${side}`] = shape.antler ? onHead(shape.antler.s, shape.antler.up, z * shape.antler.side) : pivots.head.clone();
    pivots[`scap${side}`] = V(shape.fore.scapula[0], shape.fore.scapula[1], z * shape.fore.at[1] * 0.85);
  }
  for (const [key, leg] of Object.entries(LEGS)) {
    const lay = legLayout(leg.fore ? shape.fore : shape.hind, leg.side, shape.paw);
    legs[key] = lay;
    leg.chain.forEach((name, i) => { pivots[name] = lay.joints[i].clone(); });
  }
  pivots.tail = V(shape.tail.at[0], shape.tail.at[1], 0);
  rodentPivots(shape, pivots);

  // ---- the trunk: one skin from the rump to inside the head
  // Each ring is held by the bones of the back and the neck by where its middle lies along them (the line through
  // their joints), shared across each joint; low by a shoulder or a haunch a share of it goes with the leg.
  const chain = ['hips', 'chest', 'neck1', 'neck2', 'neck3', 'head'], blend = shape.blend;
  const cum = [0];
  for (let i = 1; i < chain.length; i += 1) cum.push(cum[i - 1] + pivots[chain[i]].distanceTo(pivots[chain[i - 1]]));
  const byChain = (x, y, out) => {
    // where along the chain the point is: on the nearest of its stretches
    let best = Infinity, s = 0;
    for (let i = 0; i + 1 < chain.length; i += 1) {
      const A = pivots[chain[i]], Bp = pivots[chain[i + 1]], dx = Bp.x - A.x, dy = Bp.y - A.y, l2 = dx * dx + dy * dy;
      const t = Math.min(1, Math.max(0, ((x - A.x) * dx + (y - A.y) * dy) / l2)), d = Math.hypot(x - A.x - dx * t, y - A.y - dy * t);
      if (d < best) { best = d; s = cum[i] + t * Math.sqrt(l2); }
    }
    let seg = 0;
    while (seg + 1 < cum.length - 1 && s > cum[seg + 1]) seg += 1;
    out.b0 = B[chain[seg]]; out.b1 = out.b0; out.w1 = 0;
    // shared with the bone before across the joint at the start of this stretch, or with the next across its end
    const lo = cum[seg], hi = cum[seg + 1];
    if (seg > 0 && s - lo < blend[seg - 1]) { out.b1 = B[chain[seg - 1]]; out.w1 = 0.5 * (1 - smooth(0, blend[seg - 1], s - lo)); }
    else if (seg + 1 < chain.length && hi - s < blend[seg]) { out.b1 = B[chain[seg + 1]]; out.w1 = 0.5 * (1 - smooth(0, blend[seg], hi - s)); }
    return s;
  };
  const legShare = (x, y, z, half) => {
    // the arm takes some of the skin round the elbow, the thigh some round the stifle, and a shoulder blade (the
    // fore's `blade`, if its sheet gives one) the skin over the shoulder; none at the midline
    let best = 0, bone = 0;
    for (const [key, leg] of Object.entries(LEGS)) {
      if (Math.sign(z) !== leg.side && Math.abs(z) > 1e-6) continue;
      const spec = leg.fore ? shape.fore : shape.hind, share = spec.share, out = smooth(0.15, 0.6, Math.abs(z) / half);
      const w = Math.max(0, 1 - Math.hypot((x - share.at[0]) / share.reach[0], (y - share.at[1]) / share.reach[1])) * share.most * out;
      if (w > best) { best = w; bone = B[LEGS[key].chain[0]]; }
      if (leg.fore && spec.blade) {
        const b = spec.blade, wb = Math.max(0, 1 - Math.hypot((x - b.at[0]) / b.reach[0], (y - b.at[1]) / b.reach[1])) * b.most * out;
        if (wb > best) { best = wb; bone = B[leg.scap]; }
      }
    }
    return [best, bone];
  };
  const stations = shape.trunk;
  const ringAt = (k) => {
    rowAt(stations, k, row);
    const [tx, ty, bx, by, half, mid, square] = row, lx = tx - bx, ly = ty - by, len = Math.hypot(lx, ly);
    return { cx: bx + lx * mid, cy: by + ly * mid, ux: lx / len, uy: ly / len, up: len * (1 - mid), down: len * mid, half, square };
  };
  const lt = shape.long && shape.long.trunk, n = lt ? lt[level][0] : res.along, m = lt ? lt[level][1] : res.round;      // (a small weasel's own rings: life/parts/longRig.js)
  // rings closer together at the rump and up the neck, where the outline turns fastest
  const ks = [];
  for (let j = 0; j <= n; j += 1) { const t = j / n; ks.push(t - 0.035 * Math.sin(2 * Math.PI * t)); }
  const rings = ks.map(ringAt), lengthTo = [0];
  for (let j = 1; j <= n; j += 1) lengthTo.push(lengthTo[j - 1] + Math.hypot(rings[j].cx - rings[j - 1].cx, rings[j].cy - rings[j - 1].cy));
  const total = lengthTo[n], w = { b0: 0, b1: 0, w1: 0 };
  const trunkBase = skin.sheet(m, n, (i, j, out) => {
    const ring = rings[j], a = (i / m) * 2, half = a <= 1 ? a : 2 - a;
    oval(half, ring.up, ring.down, ring.half, ring.square, _o);
    // the ring's up is (ux, uy): its plane stands square to the side view's line from its bottom to its top
    const z = a <= 1 ? _o.z : -_o.z, x = ring.cx + ring.ux * _o.y, y = ring.cy + ring.uy * _o.y;
    out.p.set(x, y, z);
    [out.u, out.v] = inCell(BCELLS.trunk, lengthTo[j] / total, 1 - a / 2);
    byChain(ring.cx, ring.cy, w);
    const [share, bone] = legShare(x, y, z, ring.half);
    out.b0 = w.b0; out.b1 = w.b1; out.w1 = w.w1 * (1 - share); out.b2 = bone; out.w2 = share;
  }, { wrap: true, flip: true });
  {
    // both ends closed with a fan to their middle: the rump's, and the end inside the head
    const r0 = rings[0], r1 = rings[n];
    const rump = skin.vertex3(r0.cx - 0.004 * unit, r0.cy, 0, ...inCell(BCELLS.trunk, 0.002, 0.5), B.hips, B.hips, 0, B.hips, 0);
    skin.cap(rump, trunkBase, m, false);
    byChain(r1.cx, r1.cy, w);
    const end = skin.vertex3(r1.cx + 0.004 * unit, r1.cy, 0, ...inCell(BCELLS.trunk, 0.998, 0.5), w.b0, w.b1, w.w1, w.b0, 0);
    skin.cap(end, trunkBase + n * (m + 1), m, true);
    marks.rump = [rump];
  }
  // the withers: the highest vertex of the back between the shape's bounds for them (behind the neck's rise)
  {
    const P = skin.position, [x0, x1] = shape.withers;
    let top = -Infinity, at = trunkBase;
    for (let j = 0; j <= n; j += 1) {
      const v = trunkBase + j * (m + 1) + Math.round(m / 2);
      if (P[v * 3] > x0 && P[v * 3] < x1 && P[v * 3 + 1] > top) { top = P[v * 3 + 1]; at = v; }
    }
    marks.withers = [at];
  }

  // ---- the head: its own skin round its own line; below the hinge and forward of it the jaw holds it
  const [hcols, hrows] = res.head, hs = head.stations, hsS = hs.map((r) => r[0]), sAt = (k) => lerp(hsS[0], hsS[hsS.length - 1], k);
  const hup = curve(hs.map((r) => [r[0], r[1]])), hdown = curve(hs.map((r) => [r[0], r[2]])), hhalf = curve(hs.map((r) => [r[0], r[3]]));
  // rows closer together towards the nose, where it turns fastest
  const hk = Array.from({ length: hrows + 1 }, (_, j) => { const t = j / hrows; return t + 0.12 * Math.sin(Math.PI * t) * (0.5 - t) ; });
  const headBase = skin.sheet(hcols, hrows, (i, j, out) => {
    const s = sAt(hk[j]), a = (i / hcols) * 2, half = a <= 1 ? a : 2 - a;
    oval(half, hup(s), hdown(s), hhalf(s), head.square, _o);
    const z = a <= 1 ? _o.z : -_o.z;
    out.p.copy(onHead(s, _o.y, z));
    [out.u, out.v] = inCell(BCELLS.head, hk[j], 1 - a / 2);
    out.b0 = B.head; out.b1 = B.jaw;
    out.w1 = (1 - smooth(0.22, 0.46, half)) * smooth(head.jaw[0] - 0.02, head.jaw[0] + 0.07, s);
  }, { wrap: true, flip: true });
  {
    const s = hsS[hsS.length - 1], nose = onHead(s + 0.006 * unit, -0.25 * hdown(s), 0);
    const c = skin.vertex3(nose.x, nose.y, 0, ...inCell(BCELLS.head, 0.999, 0.5), B.head, B.jaw, 0.5, B.head, 0);
    skin.cap(c, headBase + hrows * (hcols + 1), hcols, true);
    marks.nose = [c];
    // the poll: the top of the head's ring nearest the joint it turns on
    let jn = 0;
    for (let j = 0; j <= hrows; j += 1) if (Math.abs(sAt(hk[j])) < Math.abs(sAt(hk[jn]))) jn = j;
    marks.poll = [headBase + jn * (hcols + 1) + Math.round(hcols / 2)];
  }
  // the eyes: a dark, glossy dome on each side
  if (res.eye) {
    const [er, ea] = res.eye, eye = head.eye;
    for (const side of [-1, 1]) {
      const centre = onHead(eye.s, eye.up, side * eye.side), out = V(0, 0, side).applyAxisAngle(V(0, 1, 0), side * 0.3);
      const t1 = V(0, 1, 0).cross(out).normalize(), t2 = out.clone().cross(t1).normalize();
      skin.sheet(er, ea, (i, j, o) => {
        const th = (i / er) * Math.PI * 2, ph = (j / ea) * Math.PI * 0.5, r = eye.r * Math.cos(ph);
        o.p.copy(centre).addScaledVector(t1, Math.cos(th) * r).addScaledVector(t2, Math.sin(th) * r * 0.72).addScaledVector(out, eye.r * (0.5 * Math.sin(ph) - 0.25));
        [o.u, o.v] = inCell(BCELLS.eye, 0.5 + 0.48 * Math.cos(th) * Math.cos(ph), 0.5 + 0.48 * Math.sin(th) * Math.cos(ph));
        o.b0 = B.head;
      });
    }
  }
  if (shape.head.incisors || shape.head.whiskers) rodentHead(skin, { shape, level, B, onHead, hd, hn, hup, hdown, hhalf, hsS });
  rodentCone(skin, { shape, level, B, pivots });

  // ---- the legs: each a tube from its top joint, inside the body, down to the fetlock, a ring at every joint
  for (const [key, leg] of Object.entries(LEGS)) {
    const spec = leg.fore ? shape.fore : shape.hind, lay = legs[key], J = lay.joints, L = lay.lengths;
    const ds = [0, L[0], L[0] + L[1], L[0] + L[1] + L[2]];
    const dirs = [0, 1, 2].map((k) => J[k + 1].clone().sub(J[k]).normalize());
    const depth = curve(spec.girth.map((g) => [g[0], g[1]])), width = curve(spec.girth.map((g) => [g[0], g[2]])), ahead = curve(spec.girth.map((g) => [g[0], g[3]]));
    // the rows: down each bone, with one at every joint
    const dRows = [0];
    for (let k = 0; k < 3; k += 1) { const rows = Math.max(level === 2 ? 1 : 2, Math.round(L[k] / res.leg)); for (let r = 1; r <= rows; r += 1) dRows.push(ds[k] + (L[k] * r) / rows); }
    const chainB = leg.chain.map((name) => B[name]), sides = res.legRound, swing = 0.07 * unit;
    const frame = (d) => {
      // which way the leg runs here: turned smoothly from one bone's way to the next's across each joint
      let k = 0;
      while (k < 2 && d > ds[k + 1]) k += 1;
      const dir = dirs[k].clone();
      if (k > 0 && d - ds[k] < swing) dir.lerp(dirs[k - 1], 0.5 * (1 - smooth(0, swing, d - ds[k])));
      if (k < 2 && ds[k + 1] - d < swing) dir.lerp(dirs[k + 1], 0.5 * (1 - smooth(0, swing, ds[k + 1] - d)));
      dir.normalize();
      const front = V(-dir.y, dir.x, 0);                     // square to the leg, the way it faces
      const c = J[k].clone().addScaledVector(dirs[k], d - ds[k]).addScaledVector(front, ahead(d));
      return { c, front, k };
    };
    const base = skin.sheet(sides, dRows.length - 1, (i, j, out) => {
      const d = dRows[j], { c, front, k } = frame(d), th = (i / sides) * Math.PI * 2;
      // round from the back, by the left (-z) side, the front and the right: so the faces look out
      out.p.copy(c).addScaledVector(front, -Math.cos(th) * depth(d)).add(V(0, 0, -Math.sin(th) * width(d)));
      [out.u, out.v] = inCell(BCELLS.legs, (leg.col + i / sides) / 4, PASTERN * d / ds[3]);
      out.b0 = chainB[k];
      const below = d - ds[k], above = ds[k + 1] - d, share = 0.045 * unit;
      if (k > 0 && below < share) { out.b1 = chainB[k - 1]; out.w1 = 0.5 * (1 - smooth(0, share, below)); }
      else if (k < 2 && above < share) { out.b1 = chainB[k + 1]; out.w1 = 0.5 * (1 - smooth(0, share, above)); }
    });
    // marks for measuring: the middle of each joint's ring
    const ringMark = (d) => { const j = dRows.findIndex((x) => Math.abs(x - d) < 1e-9); return Array.from({ length: sides }, (_, i) => base + j * (sides + 1) + i); };
    marks[`${key}joints`] = ds.map(ringMark);
    if (shape.paw) { buildPaw(skin, { key, fore: leg.fore, side: leg.side, col: leg.col, lay, spec, paw: shape.paw, level, depth: depth(ds[3]), width: width(ds[3]), bone: chainB[3], above: chainB[2], marks, cell: BCELLS.hoof }); continue; }

    // the pastern: from the fetlock's ring forward and down to the coronet, on the pastern's own bone
    const bone = chainB[3], F = J[3], cor = lay.coronet, [long, high, wide] = spec.hoof;
    const prow = Math.max(1, Math.round(res.hoof[1] * 0.7)), fd = depth(ds[3]), fw = width(ds[3]);
    const fr = frame(ds[3]);
    const pastBase = skin.sheet(sides, prow, (i, j, out) => {
      const t = j / prow, th = (i / sides) * Math.PI * 2;
      const c = F.clone().addScaledVector(fr.front, ahead(ds[3])).lerp(cor, t);
      const dd = lerp(fd, wide * 0.36, t), ww = lerp(fw, wide * 0.42, t);
      out.p.set(c.x - Math.cos(th) * dd, c.y, c.z - Math.sin(th) * ww);
      [out.u, out.v] = inCell(BCELLS.legs, (leg.col + i / sides) / 4, lerp(PASTERN, 0.995, t));
      out.b0 = bone;
    });
    void pastBase;
    // the hoof: from the coronet's ring down to the sole's outline, the two claws together: a pointed toe and a
    // blunt heel. Its sole is flat on the ground (y = 0).
    const [hr, hrow] = res.hoof, heel = lay.heel, toe = lay.toe, mid = (heel + toe) / 2, halfLen = (toe - heel) / 2, halfW = wide / 2;
    const sole = (th) => {
      const c = Math.cos(th), s = Math.sin(th);
      // th = 0 at the heel, round by the left (-z) to the toe at pi
      const x = mid - halfLen * c, z = c < 0 ? -s * halfW * (1 - 0.5 * -c) : -Math.sign(s) * Math.abs(s) ** 0.6 * halfW;
      return [x, z];
    };
    const hoofBase = skin.sheet(hr, hrow, (i, j, out) => {
      const t = j / hrow, th = (i / hr) * Math.PI * 2, [sx, sz] = sole(th);
      const rx = cor.x - Math.cos(th) * wide * 0.36, rz = -Math.sin(th) * wide * 0.42, ry = cor.y - (Math.cos(th) > 0 ? Math.cos(th) * high * 0.3 : 0);
      out.p.set(lerp(rx, sx, t), lerp(ry, 0, t ** 0.85), cor.z + lerp(rz, sz, t));
      [out.u, out.v] = inCell(BCELLS.hoof, (leg.col + i / hr) / 4, t);
      out.b0 = bone;
    });
    const c = skin.vertex3(mid, 0, cor.z, ...inCell(BCELLS.hoof, (leg.col + 0.5) / 4, 0.99), bone, bone, 0, bone, 0);
    skin.cap(c, hoofBase + hrow * (hr + 1), hr, false);
    marks[`${key}toe`] = [hoofBase + hrow * (hr + 1) + Math.round(hr / 2)];
    marks[`${key}heel`] = [hoofBase + hrow * (hr + 1)];
  }

  // ---- the ears: a leaf each, cupped, its outer side and its inner side, up and out from the top of the head
  {
    const [ea, eb] = res.ear, ear = shape.ear;
    for (const [side, z] of [['L', -1], ['R', 1]]) {
      const at = pivots[`ear${side}`], bone = B[`ear${side}`];
      // its length goes up and out by `out` degrees; its width lies along the head, turned about its length by `open`
      // so that its inside faces out and forward; `nIn` is the way its inside faces
      const o = ear.out * D, len = V(0, Math.cos(o), z * Math.sin(o)), wid = V(1, 0, 0).applyAxisAngle(len, z * ear.open * D);
      const nIn = wid.clone().cross(len).multiplyScalar(z).normalize();
      const put = (u, v, inner, out) => {
        const wv = earWidth(ear, v, Math.sin(Math.PI * Math.min(1, 0.06 + v * 0.94)) ** 0.75 * ear.width * 0.5 * (1 - 0.28 * v));
        const cup = (u * u - 0.4) * wv * 0.45 + (inner ? 0.0015 : -0.0015) * unit;
        out.p.copy(at).addScaledVector(len, v * ear.length).addScaledVector(wid, u * wv).addScaledVector(nIn, cup);
        out.b0 = B.head; out.b1 = bone; out.w1 = smooth(0, 0.3, v);
      };
      const outer = skin.sheet(ea, eb, (i, j, out) => { const u = (i / ea) * 2 - 1, v = j / eb; put(u, v, false, out); [out.u, out.v] = inCell(BCELLS.ear, 0.25 + u * 0.23, 0.98 - v * 0.96); }, { flip: z > 0 });
      if (shape.unit && z > 0) { marks.earBase = [outer + Math.floor(ea / 2)]; marks.earTip = [outer + eb * (ea + 1) + Math.floor(ea / 2)]; }
      skin.sheet(ea, eb, (i, j, out) => { const u = (i / ea) * 2 - 1, v = j / eb; put(u, v, true, out); [out.u, out.v] = inCell(BCELLS.ear, 0.75 + u * 0.23, 0.98 - v * 0.96); }, { flip: z < 0 });
    }
  }

  // ---- the tail: short and flat, hanging from the top of the rump against it (or bushy: life/parts/rodent.js)
  if (shape.tail.bush) bushTail(skin, { shape, level, B, pivots, marks });
  else {
    const [tr, tn] = res.tail, tail = shape.tail, root = pivots.tail;
    const dir = V(-Math.sin(tail.hang * D), -Math.cos(tail.hang * D), 0), back = V(dir.y, -dir.x, 0), across = V(0, 0, 1);
    const tb = skin.sheet(tr, tn, (i, j, out) => {
      const t = j / tn, th = (i / tr) * Math.PI * 2, wd = tail.width * 0.5 * (1 - 0.3 * t), dp = tail.depth * 0.5 * (1 - 0.2 * t);
      out.p.copy(root).addScaledVector(dir, t * tail.length).addScaledVector(back, -Math.cos(th) * dp).addScaledVector(across, -Math.sin(th) * wd);
      [out.u, out.v] = inCell(BCELLS.tail, i / tr, t);
      out.b0 = B.tail; out.b1 = B.hips; out.w1 = 1 - smooth(0, 0.3, t);
    }, { flip: true });
    const end = root.clone().addScaledVector(dir, tail.length * 1.05);
    const c = skin.vertex3(end.x, end.y, end.z, ...inCell(BCELLS.tail, 0.5, 0.99), B.tail, B.tail, 0, B.tail, 0);
    skin.cap(c, tb + tn * (tr + 1), tr, true);
    marks.tailRoot = Array.from({ length: tr }, (_, i) => tb + i); marks.tailTip = [c];          // (for measuring: the middle of its root's ring, and its tip)
  }

  // ---- the antlers, in velvet: a beam up, out and back from the skull, with tines; every end a soft knob
  if (shape.antler) {
    const A = shape.antler, [bn, br] = res.beam;
    const branch = (bone, pts, r0, r1, rows, sides, u0, u1) => {
      // through the points by Catmull-Rom, a ring at each row square to the way it runs
      const at = (t) => { const p = rowAt(pts, t); return V(p[0], p[1], p[2]); };
      const dirAt = (t) => at(Math.min(1, t + 0.02)).sub(at(Math.max(0, t - 0.02))).normalize();
      const base = skin.sheet(sides, rows, (i, j, out) => {
        const t = j / rows, th = (i / sides) * Math.PI * 2, dir = dirAt(t);
        const across = (Math.abs(dir.y) < 0.95 ? V(0, 1, 0) : V(1, 0, 0)).cross(dir).normalize(), up = dir.clone().cross(across).normalize();
        const knob = t > 0.8 ? 1 + 0.5 * Math.sin(((t - 0.8) / 0.2) * Math.PI * 0.62) : 1, r = lerp(r0, r1, t) * knob;
        out.p.copy(at(t)).addScaledVector(across, Math.cos(th) * r).addScaledVector(up, Math.sin(th) * r);
        [out.u, out.v] = inCell(BCELLS.antler, lerp(u0, u1, t), i / sides);
        out.b0 = bone;
      });
      const tip = at(1).addScaledVector(dirAt(1), r1 * 1.2);
      const c = skin.vertex3(tip.x, tip.y, tip.z, ...inCell(BCELLS.antler, u1, 0.5), bone, bone, 0, bone, 0);
      skin.cap(c, base + rows * (sides + 1), sides, false);
      return at;
    };
    for (const [side, z] of [['L', -1], ['R', 1]]) {
      const bone = B[`antler${side}`], at = pivots[`antler${side}`];
      const pts = A.beam.map(([x, y, zz]) => [at.x + x, at.y + y, at.z + z * zz]);
      const beam = branch(bone, pts, A.base, A.tip, bn, br, 0, 0.62);
      if (res.tine) for (const [t, length, dx, dy, dz] of A.tines) {
        const from = beam(t), dir = V(dx, dy, z * dz).normalize(), bend = V(0, 1, 0).multiplyScalar(length * 0.12);
        const tpts = [[from.x, from.y, from.z], [from.x + dir.x * length * 0.5 + bend.x, from.y + dir.y * length * 0.5 + bend.y, from.z + dir.z * length * 0.5],
          [from.x + dir.x * length, from.y + dir.y * length + bend.y * 1.6, from.z + dir.z * length]];
        branch(bone, tpts, A.base * 0.72, A.tip * 0.8, res.tine[1], res.tine[0], 0.64, 1);
      }
    }
  }
  if (shape.tail.taper) longTail(skin, shape, pivots, level, { B, cell: BCELLS.tail, inCell, marks });

  const geometry = skin.geometry();
  geometry.computeBoundingSphere();
  // Where a place in the sheet's cells is on the body (for life/coat.js): the trunk's and the head's (u, v) as their
  // cells have them, to a point in the bind pose and how far round from the belly (a: 0) to the back (1) it is.
  const surface = {
    trunk(u, v) {
      let j = 0;
      while (j < n - 1 && lengthTo[j + 1] / total < u) j += 1;
      const f = Math.min(1, Math.max(0, (u * total - lengthTo[j]) / Math.max(1e-9, lengthTo[j + 1] - lengthTo[j])));
      const ring = ringAt(lerp(ks[j], ks[j + 1], f)), a = 2 * (1 - v), half = a <= 1 ? a : 2 - a;
      oval(half, ring.up, ring.down, ring.half, ring.square, _o);
      return { x: ring.cx + ring.ux * _o.y, y: ring.cy + ring.uy * _o.y, z: a <= 1 ? _o.z : -_o.z, a: half, t: u };
    },
    head(u, v) {
      const s = sAt(u), a = 2 * (1 - v), half = a <= 1 ? a : 2 - a;
      oval(half, hup(s), hdown(s), hhalf(s), head.square, _o);
      const p = onHead(s, _o.y, a <= 1 ? _o.z : -_o.z);
      return { x: p.x, y: p.y, z: p.z, a: half, s, up: _o.y };
    },
  };
  return { geometry, pivots, legs, marks, surface, triangles: skin.index.length / 3 };
}

// A species ready to be made into animals: its sheet and its three detail levels.
export function buildBeastKind(sheet) {
  const levels = [0, 1, 2].map((level) => buildBeast(sheet, level));
  return { sheet, levels, plan: 'beast', triangles: levels.map((l) => l.triangles) };
}

// The built animal measured from the vertices of its mesh, not read back from the numbers it was made from (metres).
// A joint's place is the middle of the leg's ring at it.
export function measureBeast(built) {
  const position = built.geometry.getAttribute('position'), v = V();
  const mark = (list, out = V()) => { out.set(0, 0, 0); for (const i of list) out.add(v.fromBufferAttribute(position, i)); return out.divideScalar(list.length); };
  const m = built.marks, a = V(), b = V(), c = V(), d = V();
  return {
    shoulder: mark(m.withers, a).y,                                                      // the withers above the ground the soles stand on
    length: mark(m.nose, a).distanceTo(mark(m.poll, b)) + b.distanceTo(mark(m.withers, c)) + c.distanceTo(mark(m.rump, d)),     // nose, poll, withers, rump
    humerus: mark(m.RFjoints[0], a).distanceTo(mark(m.RFjoints[1], b)),
    metatarsus: mark(m.RHjoints[2], a).distanceTo(mark(m.RHjoints[3], b)),
    track: mark(m.RFtoe, a).distanceTo(mark(m.RFheel, b)),
    // a paw's length from the back of its heel or palm to the tip of its longest toe (a hoof's, for a hoof), the
    // longest fore claw's chord from the middle of its root to its tip, and the tail from its root's ring to its tip
    forefoot: mark(m.RFtoe, a).distanceTo(mark(m.RFheel, b)),
    hindfoot: mark(m.RHtoe, a).distanceTo(mark(m.RHheel, b)),
    claw: m.RFclawTip ? mark(m.RFclawTip, a).distanceTo(mark(m.RFclawRoot, b)) : null,
    tail: m.tailTip ? mark(m.tailTip, a).distanceTo(mark(m.tailRoot, b)) : null,
    ...measureRodent(built, mark),
  };
}
export function compareBeast(sheet, built) {
  const got = measureBeast(built);
  return sheet.published.lengths.map(([key, what, mean, range, source]) => {
    const value = got[key];
    const off = mean !== null ? (value - mean) / mean : (value < range[0] ? (value - range[0]) / range[0] : value > range[1] ? (value - range[1]) / range[1] : 0);
    return { key, what, built: value, mean, range, source, off };
  });
}
