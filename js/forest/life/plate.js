import * as THREE from 'three';
import { curve } from './skin.js';
import { Hide } from './parts/hide.js';
import { footLayout, buildPaw } from './parts/paw.js';

// A beast built from its plate (2026-11-18): the animal drawn as a field-guide illustrator draws it, standing square,
// seen from the side, from above and from the front, and the builder lofts a skin between the drawings. A sheet
// whose shape has `plate` is built here; one without is built as it was (life/beast.js). Metres; +x the way the
// animal faces, +y up from the ground it stands on, +z its right; the origin on the ground under its middle.
//
// THE BODY is one skin from the rump (or the tail's tip) to the tip of the nose: trunk, neck and head. Three
// drawings share one ruler, `t`, which runs along the body from its hind end (any numbers that rise: the ribs of the
// drawing; whole numbers for the landmarks is the habit):
//   plate.side     { top: [[t, x, y], ...], bottom: [[t, x, y], ...] }: the outline seen from the side, its upper line
//                  (croup, back, withers, crest, poll, forehead, nose) and its lower (buttock, belly, brisket, throat,
//                  jaw, chin). At any t the body's section stands in the plane through the two lines' points at t, so
//                  a point of one line is drawn across the body from the point of the other with the same t. Each
//                  line may have as many points as it needs, at its own t's; between them it is a smooth curve.
//   plate.above    [[t, half], ...]: the outline seen from above, half the body's width at t
//   plate.front    [[t, wide, over, under], ...]: the section seen from the front: how far up from its lowest point
//                  it is widest (a share of its height), and how square it is above that and below it (2 an ellipse,
//                  under 2 a ridge or a keel, over 2 a box): a deep narrow chest, a round barrel, a wide flat otter
//   plate.spine    [[bone, x, y], ...] from the hind end forward: where each bone of the back turns. For a body with
//                  its tail drawn in the outline (an otter), the tail's joints first, from its tip: tail6 .. tail;
//                  then hips, loin, back, chest, neck1, neck2, neck3, head (the poll). A fourth number is how far
//                  either side of the joint the skin is shared (m); without it, a third of the shorter bone beside it
//   plate.marks    { rump: t, withers: [t, t], poll: t }: where the lengths are taken (the rump: where the body ends
//                  and the tail begins; the withers: the highest of the back between the two)
//   plate.jaw      { hinge: [x, y], from: t, lips: share }: where the jaw turns, the t of the corner of the mouth, and
//                  how far up each section the lips meet; forward of the corner what is under the lips opens with the jaw
//   plate.mane     { from: t, to: t, at: [x, y] } (optional): the skin of the neck that a bull's heavier neck swells
//                  (life/plateRig.js `bull`): between the two t's, away from `at` (a point on the crest)
//   plate.eye      { at: [x, y], r }: on the side drawing; it is set on the skin there
// THE LIMBS: each a skin of its own from high on the body's side to the foot, so that the shoulder and the haunch are
// masses that lie on the trunk and a limb can be turned any way without tearing the trunk's skin.
//   shape.fore     { at: [x, z] where the foot stands (life/beasts.js reads it),
//                    joints: [[x, y, z], ...]: the top of the shoulder blade, the point of the shoulder, the elbow,
//                    the knee (the wrist) and the fetlock (for a paw: the joint over the pad, a little off the ground);
//                    outline: [[y, front, back, out, in], ...] from its top down: at each height the limb's front and
//                    back edge seen from the side (x) and its outer and inner edge seen from the front (z, from the
//                    midline, for the right leg). Where the limb lies on the body it stands `proud` (m) of the body's
//                    side at the least, however wide the body is drawn.
//                    hoof: { long, high, wide, ahead } (a cloven hoof, the coronet `ahead` of the fetlock), or
//                    foot: { ... } and web (a paw: life/parts/paw.js, with shape.paw) }
//   shape.hind     the same; joints: the hip, the stifle, the hock (the ankle) and the fetlock (the pad's joint)
// THE REST:
//   shape.ear      { at: [x, y], side (optional: else on the skin), length, width, out, open, round, back }
//   shape.tail     { at: [x, y], length, width, depth, hang } for a tail that is not in the outline (an elk's, a bear's)
//   shape.antler   { at: [x, y], side, base, tip, beam: [[x, y, z], ...] from the pedicle (the right antler),
//                    tines: [[share along the beam, [[x, y, z], ...] from there, thick (a share of the beam's there)], ...],
//                    far: how many of the tines the coarsest level keeps }
// Three detail levels from one sheet. At each, the rings of the body and of the limbs are put where the outline turns
// most, so that the coarse levels keep the silhouette.

// The bones a plate adds to the beast's (life/beast.js BEAST_BONES holds them all, in one order for every beast): two
// more in the back, and the swell of a bull's neck.
export const PLATE_BONES = ['loin', 'back', 'mane'];
export const PLATE_PARENT = { hips: 'root', loin: 'hips', back: 'loin', chest: 'back', neck1: 'chest', neck2: 'neck1', neck3: 'neck2', head: 'neck3', jaw: 'head',
  earL: 'head', earR: 'head', antlerL: 'head', antlerR: 'head', mane: 'neck2',
  tail: 'hips', tail2: 'tail', tail3: 'tail2', tail4: 'tail3', tail5: 'tail4', tail6: 'tail5',
  scapL: 'chest', armL: 'scapL', foreL: 'armL', canL: 'foreL', pastL: 'canL', scapR: 'chest', armR: 'scapR', foreR: 'armR', canR: 'foreR', pastR: 'canR',
  thighL: 'hips', shankL: 'thighL', metaL: 'shankL', pastHL: 'metaL', thighR: 'hips', shankR: 'thighR', metaR: 'shankR', pastHR: 'metaR',
  cone: 'root', flake1: 'root', flake2: 'root', flake3: 'root' };
export const PLATE_LEGS = {
  LF: { fore: true, side: -1, chain: ['armL', 'foreL', 'canL', 'pastL'], scap: 'scapL', col: 0 },
  RF: { fore: true, side: 1, chain: ['armR', 'foreR', 'canR', 'pastR'], scap: 'scapR', col: 1 },
  LH: { fore: false, side: -1, chain: ['thighL', 'shankL', 'metaL', 'pastHL'], col: 2 },
  RH: { fore: false, side: 1, chain: ['thighR', 'shankR', 'metaR', 'pastHR'], col: 3 },
};
const TAIL = ['tail', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6'];

// Where each part's paint is in the animal's one sheet: [x0, y0, x1, y1] as shares of the canvas, top-down
// (life/plateCoat.js paints into the same table). The body's cell goes right round the body, along it from the hind
// end (its left edge) to the nose: the right side's belly at its bottom... (v 0 the belly, by the right side to the
// back at 0.5, and down the left side to the belly at 1). A leg's column goes round the leg from the back by its
// inner side, its front and its outer side, and down it from its top to its foot.
export const PSHEET = [2048, 1536];
export const PCELLS = {
  // (a gap between any two: each cell's paint runs on a few texels past its edge, so that a seam reads its own colour)
  body:   [0.000, 0.010, 1.000, 0.490],
  legs:   [0.310, 0.510, 0.995, 0.870],          // four columns: left fore, right fore, left hind, right hind
  foot:   [0.310, 0.890, 0.600, 0.992],          // four columns, as the legs: a hoof, or a paw (life/parts/paw.js)
  ear:    [0.005, 0.510, 0.140, 0.700],          // the outer side in its left half, the inner in its right
  tail:   [0.160, 0.510, 0.290, 0.700],
  antler: [0.005, 0.720, 0.290, 0.870],
  eye:    [0.005, 0.890, 0.070, 0.992],
};
const inCell = (cell, u, v) => [cell[0] + (cell[2] - cell[0]) * u, 1 - (cell[1] + (cell[3] - cell[1]) * v)];
// (r2-small, 2026-11-19: three more cells, in the strip the others leave empty under the legs and beside the foot,
// for the small mammals' own parts: a bushy tail's core and its hair cards, and the small bits (teeth, whiskers, a
// cone, a cone's scale). Only a sheet that asks for those parts paints or reads them: life/plateCoat.js.)
Object.assign(PCELLS, {
  brush:  [0.615, 0.885, 0.790, 0.995],          // the tail's core: along it from the root (u), round it from the belly side (v)
  hair:   [0.800, 0.885, 0.995, 0.995],          // the tail's hair cards: along it (u), across from one edge to the other (v)
  bits:   [0.080, 0.895, 0.300, 0.990],          // four in a row: the teeth, the whiskers, the cone, a scale
});

// Each detail level: the body's rings along it and the vertices round each; a limb's rings and sides; and the rest.
const RES = [
  { along: 76, round: 28, limb: [40, 16], hoof: [10, 3, 2], ear: [8, 6], tail: [8, 6], beam: [18, 8], tine: [6, 6], eye: [10, 5] },
  { along: 26, round: 12, limb: [12, 7], hoof: [6, 1, 1], ear: [3, 2], tail: [4, 3], beam: [7, 4], tine: [2, 3], eye: null },
  { along: 12, round: 6, limb: [6, 4], hoof: [4, 1, 1], ear: [1, 1], tail: [3, 2], beam: [4, 3], tine: [1, 3], eye: null },
];
const D = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const pow = (x, e) => Math.sign(x) * Math.abs(x) ** e;

// A row of a table of rows, by Catmull-Rom through them: `k` from 0 (the first row) to 1 (the last).
function rowAt(table, k, out = []) {
  const n = table.length, x = Math.min(n - 1, Math.max(0, k * (n - 1))), i = Math.min(n - 2, Math.floor(x)), t = x - i, t2 = t * t, t3 = t2 * t;
  const r0 = table[Math.max(0, i - 1)], r1 = table[i], r2 = table[i + 1], r3 = table[Math.min(n - 1, i + 2)];
  for (let c = 0; c < r1.length; c += 1) out[c] = 0.5 * (2 * r1[c] + (-r0[c] + r2[c]) * t + (2 * r0[c] - 5 * r1[c] + 4 * r2[c] - r3[c]) * t2 + (-r0[c] + 3 * r1[c] - 3 * r2[c] + r3[c]) * t3);
  return out;
}

// Which `n` of the samples `rows` (each a list of numbers, the same count in each) to keep so that straight lines
// between the kept ones stray least from the rest: the two ends and whatever `forced` names, then one at a time the
// sample that is furthest from the line between its kept neighbours.
function choose(rows, n, forced = []) {
  const last = rows.length - 1, kept = new Set([0, last, ...forced.map((i) => clamp(Math.round(i), 0, last))]);
  const error = (i, a, b) => { const f = (i - a) / (b - a); let e = 0; for (let c = 0; c < rows[i].length; c += 1) e = Math.max(e, Math.abs(rows[i][c] - lerp(rows[a][c], rows[b][c], f))); return e; };
  while (kept.size < Math.min(n, rows.length)) {
    const order = [...kept].sort((a, b) => a - b);
    let worst = -1, at = -1;
    for (let k = 0; k + 1 < order.length; k += 1) for (let i = order[k] + 1; i < order[k + 1]; i += 1) { const e = error(i, order[k], order[k + 1]) + 1e-9 * (order[k + 1] - order[k]); if (e > worst) { worst = e; at = i; } }
    if (at < 0) break;
    kept.add(at);
  }
  return [...kept].sort((a, b) => a - b);
}

// ---- the body's drawing, as functions of t
// `at(t)` is its section there: { ax, ay (the upper line), bx, by (the lower), half, cx, cy (the middle of its widest
// line), ux, uy (the way from its lowest point to its highest), up, down (how far above and below the widest line it
// reaches), over, under }.
export function drawingOf(plate) {
  const col = (list, c) => curve(list.map((p) => [p[0], p[c]]));
  const top = plate.side.top, bottom = plate.side.bottom;
  const ax = col(top, 1), ay = col(top, 2), bx = col(bottom, 1), by = col(bottom, 2);
  const half = col(plate.above, 1), wide = col(plate.front, 1), over = col(plate.front, 2), under = col(plate.front, 3);
  const t0 = Math.max(top[0][0], bottom[0][0]), t1 = Math.min(top[top.length - 1][0], bottom[bottom.length - 1][0]);
  const at = (t, out = {}) => {
    out.t = t; out.ax = ax(t); out.ay = ay(t); out.bx = bx(t); out.by = by(t);
    const lx = out.ax - out.bx, ly = out.ay - out.by, len = Math.max(1e-6, Math.hypot(lx, ly)), w = clamp(wide(t), 0.05, 0.95);
    out.len = len; out.ux = lx / len; out.uy = ly / len; out.half = Math.max(1e-5, half(t));
    out.cx = out.bx + lx * w; out.cy = out.by + ly * w; out.up = len * (1 - w); out.down = len * w; out.wide = w;
    out.over = Math.max(0.6, over(t)); out.under = Math.max(0.6, under(t));
    return out;
  };
  // a point of the section's rim: `a` 0 at the bottom, up the right side (+z) to 1 at the top, and down the left to 2
  const point = (s, a, out) => {
    const th = a * Math.PI, c = -Math.cos(th), sn = Math.sin(th), e = 2 / (c > 0 ? s.over : s.under);
    const h = pow(c, e) * (c > 0 ? s.up : s.down), z = pow(sn, e) * s.half;
    return out.set(s.cx + s.ux * h, s.cy + s.uy * h, z);
  };
  // how far out the body's side is, at a share `k` of the way up a section (0 its lowest point, 1 its highest)
  const sideAt = (s, k) => {
    const up = k >= s.wide, c = up ? (k - s.wide) / (1 - s.wide) : (s.wide - k) / s.wide, q = up ? s.over : s.under;
    return s.half * Math.max(0, 1 - clamp(c, 0, 1) ** q) ** (1 / q);
  };
  // Dense samples of it, for finding a place on the side drawing and for choosing rings.
  const N = 320, samples = Array.from({ length: N + 1 }, (_, i) => at(lerp(t0, t1, i / N)));
  // The drawing's own faults, named: two sections that cross (the outline folded back on itself between them).
  for (let i = 0; i < N; i += 1) {
    const p = samples[i], q = samples[i + 1];
    const side = (s, x, y) => Math.sign((s.ax - s.bx) * (y - s.by) - (s.ay - s.by) * (x - s.bx));
    if (side(p, q.ax, q.ay) * side(p, q.bx, q.by) < 0 && side(q, p.ax, p.ay) * side(q, p.bx, p.by) < 0) throw new Error(`plate: the body's sections cross near t = ${p.t.toFixed(2)} (the upper and the lower line turn against one another there)`);
  }
  // Where a point of the side drawing is on the body: { t, k (the share of the way up its section), z (how far out
  // the skin is there) }, or null off the body.
  const locate = (x, y) => {
    const f = (s) => ((s.ax - s.bx) * (y - s.by) - (s.ay - s.by) * (x - s.bx)) / s.len;      // how far ahead of the section's line
    const kOf = (s) => ((x - s.bx) * (s.ax - s.bx) + (y - s.by) * (s.ay - s.by)) / (s.len * s.len);
    let best = null, least = Infinity;
    let fp = f(samples[0]);
    for (let i = 0; i < N; i += 1) {
      const fq = f(samples[i + 1]);
      if (fp * fq <= 0 && fp !== fq) {
        const w = fp / (fp - fq), k = lerp(kOf(samples[i]), kOf(samples[i + 1]), w);
        const off = k < 0 ? -k : k > 1 ? k - 1 : 0;
        if (off < least) { least = off; best = { i, w, k }; }
      }
      fp = fq;
    }
    if (!best || least > 1e-9) return null;
    const s = at(lerp(samples[best.i].t, samples[best.i + 1].t, best.w));
    return { t: s.t, k: best.k, z: sideAt(s, best.k) };
  };
  return { at, point, sideAt, locate, samples, t0, t1 };
}

// Where a hoofed or a pawed limb's joints are as it stands (what life/plateRig.js bends): its top joint (the point
// of the shoulder, the hip), the next two down, the fetlock (a paw's joint over its pad), the coronet, and the foot.
function layoutOf(spec, leg, paw) {
  const z = leg.side, J = spec.joints.slice(leg.fore ? 1 : 0).map((p) => V(p[0], p[1], z * p[2]));
  const lengths = [0, 1, 2].map((k) => J[k].distanceTo(J[k + 1]));
  if (spec.hoof) {
    const h = spec.hoof, coronet = V(J[3].x + (h.ahead ?? 0), h.high, J[3].z), heel = coronet.x - h.long * 0.32, toe = coronet.x + h.long * 0.68;
    return { joints: J, lengths, coronet, heel, toe, sole: V((heel + toe) / 2, 0, J[3].z) };
  }
  const coronet = V(J[3].x, 0, J[3].z);
  return { joints: J, lengths, coronet, ...footLayout(pawSpec(spec, leg, 0.02, 0.02), leg.side, paw, coronet) };
}
// (what life/parts/paw.js reads of a leg: its foot, its web, how wide the leg is at its last joint and how high that is)
const pawSpec = (spec, leg, depth, width) => ({ foot: spec.foot, web: spec.web, girth: [[0, depth, width, 0]], pastern: [0, spec.joints[spec.joints.length - 1][1]], scapula: leg.fore ? [0, 0] : undefined });

export function buildPlate(sheet, level, B) {
  const shape = sheet.shape, plate = shape.plate, res = RES[level], skin = new Hide(), marks = {}, pivots = {}, legs = {};
  const body = drawingOf(plate), _p = V();
  const high = Math.max(...plate.side.top.map((p) => p[2])), unit = high / 1.4;          // the builder's own small sizes go by the animal's (an elk's: 1)

  // ---- the joints
  pivots.root = V();
  const spine = plate.spine.map(([name, x, y, share]) => ({ name, x, y, share }));
  for (const node of spine) pivots[node.name] = V(node.x, node.y, 0);
  for (const name of ['hips', 'loin', 'back', 'chest', 'neck1', 'neck2', 'neck3', 'head']) if (!pivots[name]) throw new Error(`plate: plate.spine has no ${name}`);
  pivots.jaw = V(plate.jaw.hinge[0], plate.jaw.hinge[1], 0);
  pivots.mane = plate.mane ? V(plate.mane.at[0], plate.mane.at[1], 0) : pivots.neck2.clone();
  const onSkin = (at, side, inset = 0.86) => { const found = body.locate(at[0], at[1]); return V(at[0], at[1], side ?? (found ? found.z * inset : 0)); };
  const earAt = onSkin(shape.ear.at, shape.ear.side), antlerAt = shape.antler ? onSkin(shape.antler.at, shape.antler.side, 0.7) : null;
  for (const [side, z] of [['L', -1], ['R', 1]]) {
    pivots[`ear${side}`] = V(earAt.x, earAt.y, z * earAt.z);
    pivots[`antler${side}`] = antlerAt ? V(antlerAt.x, antlerAt.y, z * antlerAt.z) : pivots.head.clone();
  }
  for (const [key, leg] of Object.entries(PLATE_LEGS)) {
    const spec = leg.fore ? shape.fore : shape.hind, lay = layoutOf(spec, leg, shape.paw);
    legs[key] = lay;
    leg.chain.forEach((name, i) => { pivots[name] = lay.joints[i].clone(); });
    if (leg.fore) { const b = spec.joints[0]; pivots[leg.scap] = V(b[0], b[1], leg.side * b[2]); }
  }
  // the tail's joints: the outline's own (a tail drawn with the body), or along the tail that hangs from the rump
  const drawnTail = !!pivots.tail6;
  if (!drawnTail) {
    const tail = shape.tail, dir = V(-Math.sin(tail.hang * D), -Math.cos(tail.hang * D), 0);
    TAIL.forEach((name, k) => { pivots[name] = V(tail.at[0], tail.at[1], 0).addScaledVector(dir, (tail.length * k) / 6); });
  }
  for (const name of ['cone', 'flake1', 'flake2', 'flake3']) pivots[name] = pivots.head.clone();

  // ---- the body: one skin from its hind end to its nose
  // A ring is held by the bones of the back by where its middle lies along them (the line through their joints),
  // shared across each joint. Along the tail a bone holds what is behind its joint; from the hips on, what is ahead.
  // (the line the rings are measured along: through the joints, and on from the first and the last of them to the
  // body's two ends, since a head hangs across the neck's line and a rump lies behind the hips)
  const ends = body.samples, hindEnd = ends[0], noseEnd = ends[ends.length - 1];
  const path = [{ x: hindEnd.cx, y: hindEnd.cy }, ...spine, { x: noseEnd.cx, y: noseEnd.cy }], pathTo = [0];
  for (let i = 1; i < path.length; i += 1) pathTo.push(pathTo[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  const cum = spine.map((_, i) => pathTo[i + 1]);
  const isTail = (name) => name.startsWith('tail');
  // the stretches between joints, and beyond each end: whose each is; and the joints where the holder changes
  const owners = [spine[0].name];
  for (let i = 0; i + 1 < spine.length; i += 1) owners.push(isTail(spine[i].name) ? spine[i + 1].name : spine[i].name);
  owners.push(spine[spine.length - 1].name);
  // (owners[i] holds from joint i - 1 to joint i; the last holds beyond the last joint)
  const bounds = [];
  for (let i = 0; i < spine.length; i += 1) {
    const before = owners[i], after = owners[i + 1];
    if (before === after) continue;
    const near = Math.min(i > 0 ? cum[i] - cum[i - 1] : Infinity, i + 1 < spine.length ? cum[i + 1] - cum[i] : Infinity);
    bounds.push({ at: cum[i], share: spine[i].share ?? near * 0.34, before: B[before], after: B[after] });
  }
  const along = (x, y) => {
    let best = Infinity, s = 0;
    for (let i = 0; i + 1 < path.length; i += 1) {
      const P = path[i], Q = path[i + 1], dx = Q.x - P.x, dy = Q.y - P.y, l2 = Math.max(1e-12, dx * dx + dy * dy);
      const f = clamp(((x - P.x) * dx + (y - P.y) * dy) / l2, 0, 1), d = Math.hypot(x - P.x - dx * f, y - P.y - dy * f);
      if (d < best) { best = d; s = pathTo[i] + f * Math.sqrt(l2); }
    }
    return s;
  };
  // the bones that hold a ring whose middle is `s` along the back, and their shares: into `bones`, `weights`
  const hold = (s, bones, weights) => {
    bones.length = 0; weights.length = 0;
    let rest = 1;                                                // what is not yet given to a bone further back
    for (let i = 0; i <= bounds.length; i += 1) {
      const bone = i < bounds.length ? bounds[i].before : bounds[bounds.length - 1].after;
      const on = i < bounds.length ? smooth(bounds[i].at - bounds[i].share, bounds[i].at + bounds[i].share, s) : 0;      // how far past this joint
      const w = rest * (1 - on);
      if (w > 1e-4) { const k = bones.indexOf(bone); if (k >= 0) weights[k] += w; else { bones.push(bone); weights.push(w); } }
      rest *= on;
      if (rest <= 1e-4) break;
    }
    while (bones.length > 3) { let k = 0; for (let i = 1; i < bones.length; i += 1) if (weights[i] < weights[k]) k = i; bones.splice(k, 1); weights.splice(k, 1); }
  };

  // which rings: where the outline turns most (the upper and lower lines, and the width)
  const S = body.samples, forced = [];
  const sampleOf = (t) => ((t - body.t0) / (body.t1 - body.t0)) * (S.length - 1);
  forced.push(sampleOf(plate.marks.rump), sampleOf(plate.marks.poll));
  const picked = choose(S.map((s) => [s.ax, s.ay, s.bx, s.by, s.half * 0.8]), res.along + 1, forced);
  const rings = picked.map((i) => S[i]), n = rings.length - 1, m = res.round;
  // along the paint's cell by how far along the body, the head (ahead of the poll) given more of it than its length
  const uAt = (() => {
    const lengthTo = [0];
    for (let i = 1; i < S.length; i += 1) { const p = S[i - 1], q = S[i], d = Math.max(Math.hypot(q.ax - p.ax, q.ay - p.ay), Math.hypot(q.bx - p.bx, q.by - p.by)); lengthTo.push(lengthTo[i - 1] + d * (q.t > plate.marks.poll ? 1.7 : 1)); }
    const total = lengthTo[S.length - 1];
    return (t) => { const x = clamp(sampleOf(t), 0, S.length - 1), i = Math.min(S.length - 2, Math.floor(x)); return lerp(lengthTo[i], lengthTo[i + 1], x - i) / total; };
  })();
  const tAtU = (u) => { let lo = body.t0, hi = body.t1; for (let k = 0; k < 24; k += 1) { const mid = (lo + hi) / 2; if (uAt(mid) < u) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  const jaw = plate.jaw, mane = plate.mane;
  const bones = [], weights = [];
  const heldBy = (s, a, out) => {
    // `a`: 0 the belly .. 1 the back (either side)
    hold(along(s.cx, s.cy), bones, weights);
    if (s.t > jaw.from - 0.01) {
      // the jaw: under the lips, forward of the corner of the mouth
      const c = Math.abs(Math.cos(a * Math.PI)), k = a < 0.5 ? s.wide * (1 - c ** (2 / s.under)) : s.wide + (1 - s.wide) * c ** (2 / s.over);      // how far up the section this is
      const w = (1 - smooth(jaw.lips - 0.08, jaw.lips + 0.02, k)) * smooth(jaw.from, jaw.from + (jaw.soft ?? 0.5), s.t);
      if (w > 0.001) { for (let i = 0; i < weights.length; i += 1) weights[i] *= 1 - w; bones.push(B.jaw); weights.push(w); }
    }
    if (mane && s.t > mane.from && s.t < mane.to) {
      const w = (mane.most ?? 0.55) * Math.sin(Math.PI * (s.t - mane.from) / (mane.to - mane.from)) ** 0.8;
      for (let i = 0; i < weights.length; i += 1) weights[i] *= 1 - w;
      bones.push(B.mane); weights.push(w);
    }
    while (bones.length > 4) { let k = 0; for (let i = 1; i < bones.length; i += 1) if (weights[i] < weights[k]) k = i; bones.splice(k, 1); weights.splice(k, 1); }
    out.bones = bones; out.weights = weights;
  };
  const bodyBase = skin.sheet(m, n, (i, j, out) => {
    const s = rings[j], a = (i / m) * 2;
    body.point(s, a, out.p);
    [out.u, out.v] = inCell(PCELLS.body, uAt(s.t), a / 2);
    heldBy(s, a <= 1 ? a : 2 - a, out);
  }, { wrap: true, flip: true });
  {
    // both ends closed with a fan to their middle
    const r0 = rings[0], r1 = rings[n];
    hold(along(r0.cx, r0.cy), bones, weights);
    const hind = skin.vertexN(r0.cx - 0.004 * unit, r0.cy, 0, ...inCell(PCELLS.body, 0.001, 0.25), bones, weights);
    skin.cap(hind, bodyBase, m, false);
    hold(along(r1.cx, r1.cy), bones, weights);
    const nose = skin.vertexN(r1.cx + r1.half * 0.5, r1.cy, 0, ...inCell(PCELLS.body, 0.999, 0.25), bones, weights);
    skin.cap(nose, bodyBase + n * (m + 1), m, true);
    marks.nose = [nose];
    const topOf = (j) => bodyBase + j * (m + 1) + Math.round(m / 2);
    const ringAt = (t) => { let best = 0; for (let j = 1; j <= n; j += 1) if (Math.abs(rings[j].t - t) < Math.abs(rings[best].t - t)) best = j; return best; };
    marks.poll = [topOf(ringAt(plate.marks.poll))];
    // the rump: where the body ends (the middle of its ring there)
    marks.rump = drawnTail || plate.marks.rump > body.t0 + 1e-6 ? Array.from({ length: m }, (_, i) => bodyBase + ringAt(plate.marks.rump) * (m + 1) + i) : [hind];
    if (drawnTail) { marks.tailRoot = marks.rump; marks.tailTip = [hind]; }
    // the withers: the highest of the back between the plate's bounds for them
    let top = -Infinity, at = topOf(0);
    for (let j = 0; j <= n; j += 1) if (rings[j].t >= plate.marks.withers[0] && rings[j].t <= plate.marks.withers[1] && rings[j].ay > top) { top = rings[j].ay; at = topOf(j); }
    marks.withers = [at];
  }

  // ---- the eyes: a dark, glossy dome on each side, set on the skin
  if (res.eye && plate.eye) {
    const [er, ea] = res.eye, eye = plate.eye, on = onSkin(eye.at, eye.side, 1);
    for (const side of [-1, 1]) {
      const centre = V(on.x, on.y, side * on.z), out = V(0, 0, side).applyAxisAngle(V(0, 1, 0), side * (eye.ahead ?? 0.3));
      const t1 = V(0, 1, 0).cross(out).normalize(), t2 = out.clone().cross(t1).normalize();
      skin.sheet(er, ea, (i, j, o) => {
        const th = (i / er) * Math.PI * 2, ph = (j / ea) * Math.PI * 0.5, r = eye.r * Math.cos(ph);
        o.p.copy(centre).addScaledVector(t1, Math.cos(th) * r).addScaledVector(t2, Math.sin(th) * r * 0.8).addScaledVector(out, eye.r * (0.55 * Math.sin(ph) - 0.3));
        [o.u, o.v] = inCell(PCELLS.eye, 0.5 + 0.48 * Math.cos(th) * Math.cos(ph), 0.5 + 0.48 * Math.sin(th) * Math.cos(ph));
        o.b0 = B.head;
      });
    }
  }

  // ---- the limbs: each a skin of its own from high on the body's side down to its foot
  const limbs = {};
  for (const [key, leg] of Object.entries(PLATE_LEGS)) {
    const spec = leg.fore ? shape.fore : shape.hind, lay = legs[key], side = leg.side, O = spec.outline;
    const yTop = O[0][0], yEnd = O[O.length - 1][0], reach = yTop - yEnd;
    const down = (c) => curve(O.map((r) => [yTop - r[0], r[c]]));
    const front = down(1), back = down(2), outer = down(3), inner = down(4);
    const square = spec.square ?? 2.3, e = 2 / square, proud = spec.proud ?? 0.03 * unit, sink = spec.sink ?? proud * 0.8;
    // its bones, from the top: the heights at which one gives way to the next
    const names = leg.fore ? [leg.scap, ...leg.chain] : leg.chain, J = spec.joints, cuts = J.slice(1).map((p) => p[1]);
    const share = (spec.share ?? 0.05) * unit;
    const [rows, sides] = res.limb;
    // which heights: the joints', and where the outline turns most
    const M = 160, heights = Array.from({ length: M + 1 }, (_, i) => (reach * i) / M);
    const pickedRows = choose(heights.map((q) => [front(q), back(q), outer(q) * 0.7, inner(q) * 0.7]), rows + 1, level === 2 ? cuts.slice(0, 3).map((y) => ((yTop - y) / reach) * M) : cuts.map((y) => ((yTop - y) / reach) * M));
    const qs = pickedRows.map((i) => heights[i]), nr = qs.length - 1;
    const hipTop = leg.fore ? null : J[0][1];
    const ringAt = (q, th, out) => {
      const y = yTop - q, xf = front(q), xb = back(q), zo = outer(q), zi = inner(q), cx = (xf + xb) / 2, rx = (xf - xb) / 2, zc = (zo + zi) / 2, rz = (zo - zi) / 2;
      const c = Math.cos(th), s = Math.sin(th), x = cx - pow(c, e) * rx;
      let z = zc - pow(s, e) * rz;
      if (s < 0) {
        // on the body, the limb stands proud of its side: least at its edges, where it goes under the body's skin
        const on = body.locate(x, y);
        if (on) { const k = (-s) ** 0.8 * smooth(0, 0.1 * unit, q); z = Math.max(z, on.z + proud * k - sink * (1 - k)); }
      }
      return out.set(x, y, side * z);
    };
    const base = skin.sheet(sides, nr, (i, j, out) => {
      const q = qs[j], th = (i / sides) * Math.PI * 2, y = yTop - q;
      ringAt(q, th, out.p);
      [out.u, out.v] = inCell(PCELLS.legs, (leg.col + i / sides) / 4, q / reach);
      // held by the bone of its height, shared across each joint; the top of a haunch stays with the hips
      let k = 0;
      while (k < cuts.length && y < cuts[k]) k += 1;
      k = Math.min(k, names.length - 1);
      out.bones = [B[names[k]]]; out.weights = [1];
      if (k > 0 && cuts[k - 1] - y < share) { const w = 0.5 * (1 - smooth(0, share, cuts[k - 1] - y)); out.bones.push(B[names[k - 1]]); out.weights[0] = 1 - w; out.weights.push(w); }
      else if (k < cuts.length && k + 1 < names.length && y - cuts[k] < share) { const w = 0.5 * (1 - smooth(0, share, y - cuts[k])); out.bones.push(B[names[k + 1]]); out.weights[0] = 1 - w; out.weights.push(w); }
      const trunk = leg.fore ? smooth(yTop - 0.3 * (yTop - cuts[0]), yTop, y) * 0.6 : smooth(hipTop - 0.25 * unit, hipTop + 0.1 * unit, y) * 0.9;          // (the haunch's top goes with the hips over a long stretch: stood upright, it does not stand out behind them)
      if (trunk > 0.001) { for (let w = 0; w < out.weights.length; w += 1) out.weights[w] *= 1 - trunk; out.bones.push(leg.fore ? B.chest : B.hips); out.weights.push(trunk); }
    }, { flip: side < 0, wrap: true });
    // its top closed (inside the body)
    {
      const mid = V((front(0) + back(0)) / 2, yTop + 0.01 * unit, side * (outer(0) + inner(0)) / 2);
      const v = skin.vertex3(mid.x, mid.y, mid.z, ...inCell(PCELLS.legs, (leg.col + 0.5) / 4, 0), B[names[0]], B[names[0]], 0, B[names[0]], 0);
      skin.cap(v, base, sides, side > 0);
    }
    // marks for measuring: a vertex of no face at each joint the rig bends (the shoulder or the hip, and the three below)
    marks[`${key}joints`] = lay.joints.map((p, k) => [skin.vertex3(p.x, p.y, p.z, ...inCell(PCELLS.legs, (leg.col + 0.5) / 4, 0.5), B[leg.chain[Math.min(k, 3)]], B[leg.chain[Math.min(k, 3)]], 0, B[leg.chain[Math.min(k, 3)]], 0)]);
    limbs[key] = { front, back, outer, inner, yTop, reach, e, ringAt, spec, leg };
    const last = base + nr * (sides + 1), bone = B[leg.chain[3]], qEnd = reach;
    const depth = (front(qEnd) - back(qEnd)) / 2, width = (outer(qEnd) - inner(qEnd)) / 2;
    if (shape.paw) {
      buildPaw(skin, { key, fore: leg.fore, side, col: leg.col, lay, spec: pawSpec(spec, leg, depth, width), paw: shape.paw, level, depth, width, bone, above: B[leg.chain[2]], marks, cell: PCELLS.foot });
      continue;
    }
    // ---- the hoof: cloven, two claws side by side from the coronet's ring down to the sole, each pointed at its toe
    // and blunt at its heel, flat on the ground (y = 0)
    const hoof = spec.hoof, [hr, hrow, claws] = res.hoof;
    const mid = (lay.heel + lay.toe) / 2, halfLen = (lay.toe - lay.heel) / 2, cz = (outer(qEnd) + inner(qEnd)) / 2, cor = { x: (front(qEnd) + back(qEnd)) / 2, y: yEnd };
    for (let claw = 0; claw < claws; claw += 1) {
      const off = claws === 1 ? 0 : (claw === 0 ? -1 : 1) * hoof.wide * 0.25, halfW = claws === 1 ? hoof.wide / 2 : hoof.wide * 0.235;
      const hb = skin.sheet(hr, hrow, (i, j, out) => {
        const t = j / hrow, th = (i / hr) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        // the sole's outline: th 0 at the heel, round by the inner side to the toe at pi; the claws' facing sides flat
        const flat = claws === 1 ? 1 : (Math.sign(-s) === Math.sign(off) ? 1 : 0.55);
        const sx = mid - halfLen * c * (c < 0 ? 1 : 0.9), sz = off - s * halfW * flat * (c < 0 ? 1 - 0.62 * c * c : 1);
        // the coronet's ring: the leg's last, each claw its half
        const rx = cor.x - c * depth * 0.98, rz = off * 0.8 - s * (claws === 1 ? width : width * 0.52) * flat, ry = cor.y + (c < 0 ? -c * hoof.high * 0.12 : c * hoof.high * 0.1);
        out.p.set(lerp(rx, sx, t ** 0.9), lerp(ry, 0, t), side * (cz + lerp(rz, sz, t)));
        [out.u, out.v] = inCell(PCELLS.foot, (leg.col + i / hr) / 4, 0.04 + 0.9 * t);
        out.b0 = bone;
      }, { flip: side < 0, wrap: true });
      const c = skin.vertex3(mid, 0, side * (cz + off), ...inCell(PCELLS.foot, (leg.col + 0.5) / 4, 0.98), bone, bone, 0, bone, 0);
      skin.cap(c, hb + hrow * (hr + 1), hr, side < 0);
      const top = skin.vertex3(cor.x, cor.y + hoof.high * 0.02, side * (cz + off * 0.8), ...inCell(PCELLS.foot, (leg.col + 0.5) / 4, 0.02), bone, bone, 0, bone, 0);
      skin.cap(top, hb, hr, side > 0);
      if (claw === claws - 1) { marks[`${key}toe`] = [hb + hrow * (hr + 1) + Math.round(hr / 2)]; marks[`${key}heel`] = [hb + hrow * (hr + 1)]; }
    }
    void last;
  }

  // ---- the ears: a leaf each, cupped, its outer side and its inner side, up and out from the head
  {
    const [ea, eb] = res.ear, ear = shape.ear, round = ear.round ?? 0;
    for (const [side, z] of [['L', -1], ['R', 1]]) {
      const at = pivots[`ear${side}`], bone = B[`ear${side}`];
      // its length goes up and out by `out` degrees and back by `back`; its width lies along the head, turned about
      // its length by `open` so that its inside faces out and forward
      const o = ear.out * D, bk = (ear.back ?? 0) * D;
      const len = V(-Math.sin(bk) * Math.cos(o), Math.cos(bk) * Math.cos(o), z * Math.sin(o)).normalize();
      const wid = V(Math.cos(bk), Math.sin(bk), 0).applyAxisAngle(len, z * ear.open * D), nIn = wid.clone().cross(len).multiplyScalar(z).normalize();
      const put = (u, v, inside, out) => {
        const leaf = Math.sin(Math.PI * Math.min(1, 0.06 + v * 0.94)) ** 0.75 * (1 - 0.28 * v), disc = Math.sqrt(Math.max(0, 1 - (2 * v - 0.9) ** 2 / 1.21));
        const wv = lerp(leaf, disc, round) * ear.width * 0.5;
        const fold = Math.sin(Math.PI * v) * (0.5 + 0.5 * u);
        const cup = ((u * u - 0.4) * 0.58 + u * fold * 0.28) * wv + (inside ? 0.0015 : -0.0015) * unit;
        out.p.copy(at).addScaledVector(len, v * ear.length).addScaledVector(wid, u * wv).addScaledVector(nIn, cup);
        out.b0 = B.head; out.b1 = bone; out.w1 = smooth(0, 0.3, v);
      };
      skin.sheet(ea, eb, (i, j, out) => { const u = (i / ea) * 2 - 1, v = j / eb; put(u, v, false, out); [out.u, out.v] = inCell(PCELLS.ear, 0.25 + u * 0.23, 0.98 - v * 0.96); }, { flip: z > 0 });
      skin.sheet(ea, eb, (i, j, out) => { const u = (i / ea) * 2 - 1, v = j / eb; put(u, v, true, out); [out.u, out.v] = inCell(PCELLS.ear, 0.75 + u * 0.23, 0.98 - v * 0.96); }, { flip: z < 0 });
    }
  }

  // ---- a tail that is not in the outline: short, hanging from the rump against it (a bushy one, shape.brush, is
  // built below: r2-small)
  if (!drawnTail && !shape.brush) {
    const [tr, tn] = res.tail, tail = shape.tail, root = pivots.tail;
    const dir = V(-Math.sin(tail.hang * D), -Math.cos(tail.hang * D), 0), back = V(dir.y, -dir.x, 0), across = V(0, 0, 1);
    const tb = skin.sheet(tr, tn, (i, j, out) => {
      const t = j / tn, th = (i / tr) * Math.PI * 2, round = Math.sqrt(Math.max(0.03, 1 - smooth(0.6, 1, t) ** 2 * 0.9));
      const wd = tail.width * 0.5 * (1 - 0.25 * t) * round, dp = tail.depth * 0.5 * (1 - 0.2 * t) * round;
      out.p.copy(root).addScaledVector(dir, (t - 0.12) * tail.length).addScaledVector(back, -Math.cos(th) * dp).addScaledVector(across, -Math.sin(th) * wd);
      [out.u, out.v] = inCell(PCELLS.tail, i / tr, t);
      out.b0 = B.tail; out.b1 = B.hips; out.w1 = 1 - smooth(0, 0.3, t);
    }, { flip: true, wrap: true });
    const end = root.clone().addScaledVector(dir, tail.length * 0.9);
    const c = skin.vertex3(end.x, end.y, end.z, ...inCell(PCELLS.tail, 0.5, 0.99), B.tail, B.tail, 0, B.tail, 0);
    skin.cap(c, tb + tn * (tr + 1), tr, true);
    marks.tailRoot = [skin.vertex3(root.x, root.y, 0, ...inCell(PCELLS.tail, 0.5, 0.1), B.tail, B.hips, 1, B.tail, 0)]; marks.tailTip = [c];
  }

  // ---- r2-small (2026-11-19): a bushy tail, a rodent's teeth and whiskers, a cone, and the ear's marks; each only for
  // a sheet that asks (smallParts, below)
  smallParts(skin, { shape, level, B, pivots, marks, body, unit });

  // ---- the antlers, in velvet: a beam up, out and back from the skull, with tines; every end a soft knob
  if (shape.antler) {
    const A = shape.antler, [bn, br] = res.beam;
    const branch = (bone, pts, r0, r1, rows, sides, u0, u1) => {
      // through the points by Catmull-Rom, evenly by their number; a ring at each row square to the way it runs, all
      // the rings turned alike (each frame is the one before, carried along), and the end rounded off: velvet
      const P = pts.map((p) => V(p[0], p[1], p[2])), last = P.length - 1;
      const at = (t) => {
        const f = clamp(t, 0, 1) * last, i = Math.min(last - 1, Math.floor(f)), u = f - i;
        const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(last, i + 2)], out = V();
        for (const k of ['x', 'y', 'z']) out[k] = 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
        return out;
      };
      const dirAt = (t) => at(Math.min(1, t + 0.02)).sub(at(Math.max(0, t - 0.02))).normalize();
      const frames = [];
      let across = null;
      for (let j = 0; j <= rows; j += 1) {
        const dir = dirAt(j / rows);
        if (!across) across = (Math.abs(dir.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0)).cross(dir);
        across = across.clone().addScaledVector(dir, -across.dot(dir)).normalize();
        frames.push([dir, across, dir.clone().cross(across).normalize()]);
      }
      const round = 0.16;                                    // the share of its length its end is rounded over
      const base = skin.sheet(sides, rows, (i, j, out) => {
        const t = j / rows, th = (i / sides) * Math.PI * 2, [dir, ax, up] = frames[j];
        const s = Math.max(0, (t - (1 - round)) / round), r = lerp(r0, r1, t ** 0.8) * Math.sqrt(Math.max(0.06, 1 - s * s));
        // (its first ring is a radius back inside what it grows from)
        out.p.copy(at(t)).addScaledVector(ax, Math.cos(th) * r).addScaledVector(up, Math.sin(th) * r);
        if (j === 0) out.p.addScaledVector(dir, -r0);
        [out.u, out.v] = inCell(PCELLS.antler, lerp(u0, u1, t), i / sides);
        out.b0 = bone;
      }, { wrap: true });
      const tip = at(1).addScaledVector(dirAt(1), r1 * 0.12);
      const c = skin.vertex3(tip.x, tip.y, tip.z, ...inCell(PCELLS.antler, u1, 0.5), bone, bone, 0, bone, 0);
      skin.cap(c, base + rows * (sides + 1), sides, true);
      return at;
    };
    for (const [side, z] of [['L', -1], ['R', 1]]) {
      const bone = B[`antler${side}`], at = pivots[`antler${side}`];
      // (the left antler is the right one's points mirrored: a tube's rings are laid round the way it runs, so its faces look out either way)
      const mirror = (p) => [at.x + p[0], at.y + p[1], at.z + z * p[2]];
      const tube = (pts, r0, r1, rows, sides, u0, u1) => branch(bone, pts, r0, r1, rows, sides, u0, u1);
      const beam = tube(A.beam.map(mirror), A.base, A.tip, bn, br, 0, 0.6);
      const tines = level === 2 ? A.tines.slice().sort((p, q) => lengthOf(q[1]) - lengthOf(p[1])).slice(0, A.far ?? 3) : A.tines;
      for (const [share, pts, thick] of tines) {
        const from = beam(share), r = lerp(A.base, A.tip, share ** 0.8) * (thick ?? 0.8);
        tube([[from.x, from.y, from.z], ...pts.map((p) => [from.x + p[0], from.y + p[1], from.z + z * p[2]])], r, A.tip * 0.85, res.tine[0], res.tine[1], 0.62, 1);
      }
    }
  }

  const geometry = skin.geometry();
  geometry.computeBoundingSphere();
  // Where a place in the sheet's cells is on the animal as it stands (for life/plateCoat.js).
  const _s = {}, _q = V();
  const surface = {
    // the body's cell: (u, v) to a place { x, y, z }, how far round from the belly (a: 0) to the back (1), the
    // ruler's t there and which side (-1 left, 1 right)
    body(u, v) {
      const t = tAtU(u), a = 2 * v, half = a <= 1 ? a : 2 - a;
      body.at(t, _s); body.point(_s, a, _q);
      return { x: _q.x, y: _q.y, z: _q.z, a: half, t, side: a <= 1 ? 1 : -1, part: 'body' };
    },
    // the legs' cell: to a place, which leg, how far down it (d: 0 its top .. 1 its end), how far round to its outer
    // side (out: -1 inner .. 1 outer) and its front (front: -1 back .. 1), and whether it lies on the body there
    limb(u, v) {
      const col = Math.min(3, Math.floor(u * 4)), key = ['LF', 'RF', 'LH', 'RH'][col], L = limbs[key], th = (u * 4 - col) * Math.PI * 2;
      const q = clamp(v, 0, 1) * L.reach;
      L.ringAt(q, th, _q);
      return { x: _q.x, y: _q.y, z: _q.z, col, key, hind: col >= 2, side: L.leg.side, d: clamp(v, 0, 1), out: -Math.sin(th), front: -Math.cos(th), on: !!body.locate(_q.x, _q.y), part: 'limb' };
    },
    locate: body.locate, at: body.at, uAt,
  };
  return { geometry, pivots, legs, marks, surface, triangles: skin.index.length / 3, drawnTail };
}
const lengthOf = (pts) => { let l = 0, p = [0, 0, 0]; for (const q of pts) { l += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); p = q; } return l; };

// ==== r2-small (2026-11-19, the small mammals' agent: the Douglas squirrel, the two chipmunks, the striped skunk and
// the fisher drawn as plates). What such an animal has that the elk, the bear and the otter have not, each built only
// for a sheet that asks for it, so that those three are built vertex for vertex as they were:
//   shape.brush     { long, round (mm), past (a share of long), core (a share), taper (a share: less hair at its tip),
//                   carry (how life/plateRig.js holds it), each optional but long and round }: a bushy tail on
//                   shape.tail's bone (shape.tail: { at, length, width, depth, hang }, as a short tail's). Its hair
//                   stands out `long` either side of the bone and `round` above and below it, and runs on past the
//                   bone's tip. It is a dense core round the bone (`core` of the hair: 0.6) and two cards crossed along
//                   it, one flat and one upright, whose painted hair (life/plateCoat.js) is its ragged edge from any
//                   side: a tube of the same size reads as a tube. Held by the tail's six bones, which life/plateRig.js
//                   curls. Marks for measuring: the tail from its root's ring to the bone's tip (the hair past it not
//                   counted, as a tail is measured), and the ear from its base to its tip (life/parts/rodent.js
//                   measureRodent reads them, by the marks a bushy tail sets).
//   shape.teeth     { long, wide (mm) }: a rodent's incisors, the upper pair under the nose and the lower on the jaw
//   shape.whiskers  { long (mm), count (a side) }: in the close-up's level only
//   shape.cone      { long, wide (mm) }: a conifer's cone at the cone's bone, and three of its scales (the rig puts it
//                   in the forepaws and lets the scales fall: life/plateRig.js)
const SMALL_RES = [{ sides: 12, along: 16, end: 5, cards: 16, bit: 1 }, { sides: 6, along: 6, end: 2, cards: 6, bit: 0 }, { sides: 4, along: 3, end: 1, cards: 3, bit: 0 }];
function smallParts(skin, { shape, level, B, pivots, marks, body, unit }) {
  const res = SMALL_RES[level];
  if (shape.brush) {
    const t = shape.tail, br = shape.brush, dir = V(-Math.sin(t.hang * D), -Math.cos(t.hang * D), 0), back = V(dir.y, -dir.x, 0), across = V(0, 0, 1);
    const root = pivots.tail, L = t.length, long = br.long / 1000, round = br.round / 1000, r0 = t.width / 2, d0 = t.depth / 2, core = br.core ?? 0.6;
    const past = long * (br.past ?? 0.85);
    // rows: one inside the rump, one at the root, along the bone to its tip exactly, and round the brush's end
    const start = -Math.min(r0 * 1.4, L / 10), along = (n, end) => { const xs = [start]; for (let j = 0; j <= n; j += 1) xs.push((L * j) / n); for (let j = 1; j <= end; j += 1) xs.push(L + past * Math.sin(((j / end) * Math.PI) / 2) * 0.98); return xs; };
    // the brush's half size along the bone: the bone's own at the root, the hair grown out by a quarter of the way along,
    // full to near the tip and rounded off past it
    const grow = (x) => smooth(-0.02 * L, 0.28 * L, x);
    const taper = br.taper ?? 0.1, thin = (x) => 1 - taper * clamp(x / L, 0, 1) ** 1.6;      // (taper: how much less hair at the tip)
    const size = (x, bone, hairs) => {
      if (x <= L) return bone * (1 - 0.5 * clamp(x / L, 0, 1)) + hairs * grow(x) * thin(x);
      const tip = bone * 0.5 + hairs * thin(L), f = clamp((x - L) / past, 0, 1);
      return tip * Math.sqrt(Math.max(0, 1 - f * f)) + 0.0004 * unit;
    };
    // the bones that hold a place along it: the segment's own, the next across a joint, and near the root the hips
    const seg = L / 6, blend = L / 12;
    const held = (x, out) => {
      const k = clamp(Math.floor(x / seg), 0, 5);
      out.b0 = B[TAIL[k]];
      const lo = k * seg, hi = (k + 1) * seg;
      if (k > 0 && x - lo < blend) { out.b1 = B[TAIL[k - 1]]; out.w1 = 0.5 * (1 - smooth(0, blend, x - lo)); }
      else if (k < 5 && hi - x < blend && x <= L) { out.b1 = B[TAIL[k + 1]]; out.w1 = 0.5 * (1 - smooth(0, blend, hi - x)); }
      const hips = 0.7 * (1 - smooth(-0.02 * L, 0.07 * L, x));
      if (hips > 0) { out.b2 = B.hips; out.w2 = hips; out.w1 *= 1 - hips; }
    };
    // the core: an oval round the bone, a little flattened on its back and belly
    const xs = along(res.along, res.end), sides = res.sides, tipRow = 1 + res.along;
    const coreBase = skin.sheet(sides, xs.length - 1, (i, j, out) => {
      const x = xs[j], a = (i / sides) * 2, half = a <= 1 ? a : 2 - a;
      const w = size(x, r0, long * core), d = size(x, d0, round * core), th = half * Math.PI, c = -Math.cos(th), s = Math.sin(th);
      out.p.copy(root).addScaledVector(dir, x).addScaledVector(back, Math.sign(c) * Math.abs(c) ** 0.9 * d).addScaledVector(across, (a <= 1 ? 1 : -1) * Math.abs(s) ** 0.9 * w);
      [out.u, out.v] = inCell(PCELLS.brush, clamp((x - start) / (L + past - start), 0, 1), 1 - a / 2);
      held(x, out);
    }, { wrap: true });
    const tip = root.clone().addScaledVector(dir, L + past);
    const cap = skin.vertex3(tip.x, tip.y, tip.z, ...inCell(PCELLS.brush, 0.999, 0.5), B.tail6, B.tail6, 0, B.tail6, 0);
    skin.cap(cap, coreBase + (xs.length - 1) * (sides + 1), sides, false);
    marks.tailRoot = Array.from({ length: sides }, (_, i) => coreBase + 1 * (sides + 1) + i);
    marks.tailTip = Array.from({ length: sides }, (_, i) => coreBase + tipRow * (sides + 1) + i);
    marks.bushTip = marks.tailTip.slice();
    // the hair: two cards crossed along the bone, flat (across) and upright (back), each both ways round; three
    // vertices across each row (an edge, the bone, the other edge). The cell's v runs from one edge to the other.
    const cx = along(res.cards, Math.max(1, res.end - 1));
    for (const [way, hairs, bone] of [[across, long, r0], [back, round, d0]]) {
      for (const flip of [false, true]) {
        skin.sheet(2, cx.length - 1, (i, j, out) => {
          const x = cx[j], h = size(x, bone, hairs) * (i - 1);
          out.p.copy(root).addScaledVector(dir, x).addScaledVector(way, h);
          [out.u, out.v] = inCell(PCELLS.hair, clamp((x - start) / (L + past - start), 0, 1), i / 2);
          held(x, out);
        }, { flip });
      }
    }
    // the ear, from its base to its tip (the right one)
    const ear = shape.ear, o = ear.out * D, bk = (ear.back ?? 0) * D, at = pivots.earR;
    const len = V(-Math.sin(bk) * Math.cos(o), Math.cos(bk) * Math.cos(o), Math.sin(o)).normalize();
    marks.earBase = [skin.vertex3(at.x, at.y, at.z, ...inCell(PCELLS.ear, 0.25, 0.98), B.earR, B.earR, 0, B.earR, 0)];
    marks.earTip = [skin.vertex3(at.x + len.x * ear.length, at.y + len.y * ear.length, at.z + len.z * ear.length, ...inCell(PCELLS.ear, 0.25, 0.02), B.earR, B.earR, 0, B.earR, 0)];
  }
  // ---- the head's small bits, by the body's drawing near the nose
  const bitCell = (k) => { const c = PCELLS.bits, w = (c[2] - c[0]) / 4; return [c[0] + w * k, c[1], c[0] + w * (k + 1), c[3]]; };
  const tube = (pts, radii, sides, bone, cell, capped = true) => {
    const n = pts.length, dirAt = (j) => pts[Math.min(n - 1, j + 1)].clone().sub(pts[Math.max(0, j - 1)]).normalize();
    const base = skin.sheet(sides, n - 1, (i, j, out) => {
      const d = dirAt(j), side = (Math.abs(d.y) < 0.95 ? V(0, 1, 0) : V(1, 0, 0)).cross(d).normalize(), up = d.clone().cross(side).normalize(), th = (i / sides) * Math.PI * 2;
      out.p.copy(pts[j]).addScaledVector(side, Math.cos(th) * radii[j]).addScaledVector(up, Math.sin(th) * radii[j]);
      [out.u, out.v] = inCell(cell, j / (n - 1), i / sides);
      out.b0 = bone;
    }, { wrap: true });
    if (capped) { const e = pts[n - 1].clone().addScaledVector(dirAt(n - 1), radii[n - 1] * 0.6); skin.cap(skin.vertex3(e.x, e.y, e.z, ...inCell(cell, 0.99, 0.5), bone, bone, 0, bone, 0), base + (n - 1) * (sides + 1), sides, false); }
  };
  if ((shape.teeth || shape.whiskers) && res.bit) {
    const plate = shape.plate, poll = plate.marks.poll, t1 = body.t1, head = t1 - poll, s = {};
    // a place on the head: `k` of the way from the poll to the nose, `up` of the way up its section, `side` m out
    const onHead = (k, up, side, out = V()) => { body.at(poll + head * k, s); return out.set(s.bx + (s.ax - s.bx) * up, s.by + (s.ay - s.by) * up, side); };
    const lips = plate.jaw.lips;
    if (shape.teeth) {
      const long = shape.teeth.long / 1000, wide = shape.teeth.wide / 1000, cell = bitCell(0);
      body.at(t1 - head * 0.06, s);
      const fwd = V(s.ux, s.uy, 0), downWay = V(-s.uy * 0.25 - s.ux * 0.1, -1, 0).normalize();
      void fwd;
      for (const z of [-1, 1]) {
        const a0 = onHead(0.9, lips + 0.04, z * wide * 0.27), up = V(0.35, 1, 0).normalize();
        tube([a0, a0.clone().addScaledVector(downWay, long * 0.5), a0.clone().addScaledVector(downWay, long)], [wide * 0.22, wide * 0.22, wide * 0.19], 4, B.head, cell);
        const b0 = onHead(0.84, lips - 0.06, z * wide * 0.24);
        tube([b0, b0.clone().addScaledVector(up, long * 0.4), b0.clone().addScaledVector(up, long * 0.72)], [wide * 0.18, wide * 0.18, wide * 0.16], 4, B.jaw, cell);
      }
    }
    if (shape.whiskers) {
      const w = shape.whiskers, len = w.long / 1000, cell = bitCell(1);
      let seed = 7;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (const z of [-1, 1]) for (let k = 0; k < w.count; k += 1) {
        // from the pad on the side of the muzzle, out, back and fanned up and down
        const kk = 0.78 + 0.1 * rand(); body.at(poll + head * kk, s);
        const at = onHead(kk, lips + 0.12 + 0.18 * rand(), 0);
        at.z = z * body.sideAt(s, lips + 0.2) * 0.92;
        const fan = (k / Math.max(1, w.count - 1) - 0.5) * 1.1, l = len * (0.55 + 0.45 * rand());
        const way = V(-0.8, fan, z).normalize(), pts = [], radii = [], r = Math.max(0.00022, len * 0.008);
        for (let j = 0; j <= 4; j += 1) { const f = j / 4; pts.push(at.clone().addScaledVector(way, l * f).add(V(0, -l * 0.16 * f * f, 0))); radii.push(r * (1 - 0.8 * f)); }
        tube(pts, radii, 3, B.head, cell, false);
      }
    }
  }
  if (shape.cone && res.bit) {
    // the cone along +z at its bone's place in the bind pose, fattest a little below its middle and drawn to a point
    const long = shape.cone.long / 1000, wide = shape.cone.wide / 1000, at = pivots.cone, cell = bitCell(2), pts = [], radii = [];
    for (let j = 0; j <= 9; j += 1) { const f = j / 9; pts.push(at.clone().add(V(0, 0, (f - 0.5) * long))); radii.push(Math.max(0.0005, (wide / 2) * Math.sin(Math.PI * (0.06 + 0.92 * f)) ** 0.7 * (1 - 0.25 * f))); }
    tube(pts, radii, 8, B.cone, cell);
    // its scales: each a flat, rounded flake, both of its faces drawn
    const flake = bitCell(3);
    for (const name of ['flake1', 'flake2', 'flake3']) {
      const p = pivots[name], w = wide * 0.32, h = wide * 0.3, bone = B[name];
      const corners = [[-w / 2, 0], [w / 2, 0], [w * 0.4, h * 0.8], [0, h], [-w * 0.4, h * 0.8]];
      for (const face of [1, -1]) {
        const c = skin.vertex3(p.x, p.y + h * 0.45, p.z + face * 0.0002, ...inCell(flake, 0.5, 0.5), bone, bone, 0, bone, 0);
        const ring = corners.map(([x, y]) => skin.vertex3(p.x + x, p.y + y, p.z + face * 0.0002, ...inCell(flake, 0.5 + x / w, 1 - y / h), bone, bone, 0, bone, 0));
        const from = skin.index.length;
        for (let k = 0; k < ring.length; k += 1) { const a = ring[k], b = ring[(k + 1) % ring.length]; if (face > 0) skin.index.push(c, a, b); else skin.index.push(c, b, a); }
        skin.shade(from, skin.index.length);
      }
    }
  }
}

// A species ready to be made into animals: its sheet and its three detail levels. `bones`: every beast's bones, in
// their one order (life/beast.js).
export function buildPlateKind(sheet, bones) {
  const B = Object.fromEntries(bones.map((name, i) => [name, i]));
  const levels = [0, 1, 2].map((level) => buildPlate(sheet, level, B));
  return { sheet, levels, plan: 'beast', plate: true, parent: PLATE_PARENT, legsOf: PLATE_LEGS, triangles: levels.map((l) => l.triangles) };
}
