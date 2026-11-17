import * as THREE from 'three';
import { Skin, curve } from './skin.js';

// A bat, built from its species sheet (life/species/yumaMyotis.js and the other bats). Metres, in the bind pose, which is
// the bat in level flight with its wings spread flat (so that its span is measured with the wing as it is
// measured): +x the way it faces, +y up, +z its right, the origin at the middle of the body. Everything of the sheet
// is in millimetres, and a mirrored side is the right side with z turned over.
//
//   shape.trunk     the head and the body, one furred skin: [x, up, down, half its width], nose to rump
//   shape.neck      [x where the head's bone has all of it, x where the body's has all of it]
//   shape.shoulder  [x, y, z] of the right shoulder                shape.humerus, forearm   [length, yaw, pitch]
//   shape.digits    { d2, d3, d4, d5 }: each [length, yaw, pitch] from the wrist; yaw is from straight out (+z) towards
//                   the front, pitch up from level. The wing's membrane is stretched between them
//   shape.knuckle   [share of digit 3, share of digit 4 where the wingtip's own bone begins]
//   shape.thumb     [length, claw, yaw, pitch]: the free thumb with its claw, from the wrist
//   shape.leg       the hind leg: hip [x, y, z], and thigh, shin, foot, calcar each [length, dx, dy, dz] (a direction)
//   shape.tail      { length, edge (how far from the rump the membrane's hind edge is) }
//   shape.ear       { at: [x, y, z], length, width, lean: [forward, outward] (degrees), tragus: [length, width] }
//   shape.eye       [x, angle from the top of the head (degrees), radius]
// Each wing is membrane on bones: the arm (humerus, forearm), digits 2 to 5, the thumb free; the skin from the fifth
// finger to the ankle (the plagiopatagium), the skin in front of the arm (the propatagium) and the skin between the
// legs to the tail (the uropatagium), held at its edge by the calcar. Each sheet of membrane is made twice, a top and
// an underside, so that it is seen from either side. Every vertex is held by up to four bones.

export const BAT_BONES = ['root', 'body', 'head', 'earL', 'earR', 'tail',
  ...['L', 'R'].flatMap((s) => ['hum', 'fore', 'hand', 'd2', 'd3', 'd4', 'd5', 't3', 't4', 'thumb', 'thigh', 'shin', 'foot'].map((n) => n + s))];
export const BAT_PARENT = { body: 'root', head: 'body', earL: 'head', earR: 'head', tail: 'body' };
for (const s of ['L', 'R']) {
  Object.assign(BAT_PARENT, { ['hum' + s]: 'body', ['fore' + s]: 'hum' + s, ['hand' + s]: 'fore' + s, ['d2' + s]: 'hand' + s, ['d3' + s]: 'hand' + s,
    ['d4' + s]: 'hand' + s, ['d5' + s]: 'hand' + s, ['t3' + s]: 'd3' + s, ['t4' + s]: 'd4' + s, ['thumb' + s]: 'hand' + s,
    ['thigh' + s]: 'body', ['shin' + s]: 'thigh' + s, ['foot' + s]: 'shin' + s });
}
const B = Object.fromEntries(BAT_BONES.map((name, i) => [name, i]));

const MM = 0.001, RAD = Math.PI / 180;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const smooth = (t) => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

// ---- the painted sheet's cells (1024 x 1024): membrane above, membrane beneath, fur, then the small things
export const SHEET = [1024, 1024];
export const CELLS = { top: [0, 0, 512, 512], under: [512, 0, 1024, 512], fur: [0, 512, 512, 1024], earOut: [512, 512, 768, 768], earIn: [768, 512, 1024, 768],
  bone: [512, 768, 640, 896], foot: [640, 768, 768, 896] };
const uvIn = (cell, u, v) => [(cell[0] + (cell[2] - cell[0]) * u) / SHEET[0], 1 - (cell[1] + (cell[3] - cell[1]) * v) / SHEET[1]];
// the membrane's cells are the wing seen from above: x down the cell, |z| across it. Those are the Yuma Myotis's; a
// bat whose wing reaches further has the same cell scaled to its reach (`memOf`), or its wingtip ran off the cell's
// edge and its paint was drawn out into stripes there
export const MEM = { z: 0.125, x0: 0.034, x: 0.1 };
export const membraneAt = (x, z, mem = MEM) => [Math.min(1, Math.abs(z) / mem.z), Math.min(1, Math.max(0, (mem.x0 - x) / mem.x))];
export const memOf = (joints) => { const k = Math.max(1, Math.abs(joints.R.tip.d3.z) / 0.118); return k === 1 ? MEM : { z: MEM.z * k, x0: MEM.x0 * k, x: MEM.x * k }; };

// one vertex held by [[bone, weight], ...] (the four heaviest)
function vtx(skin, p, uv, bw) {
  const list = bw.filter((e) => e[1] > 1e-4).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const b = [0, 0, 0, 0], w = [0, 0, 0, 0];
  let total = 0;
  list.forEach(([bone, weight], k) => { b[k] = bone; w[k] = weight; total += weight; });
  for (let k = 0; k < 4; k += 1) w[k] /= total;
  skin.position.push(p.x, p.y, p.z); skin.normal.push(0, 0, 0); skin.uv.push(uv[0], uv[1]);
  skin.bone.push(...b); skin.weight.push(...w);
  return skin.count - 1;
}
const P = (skin, i) => V(skin.position[i * 3], skin.position[i * 3 + 1], skin.position[i * 3 + 2]);

// A closed tube along a polyline `pts` ([Vector3]) with a radius at each, held by one bone (`bone`, an index, or a
// list of [bone, weight] per point). Rings of `sides` vertices, the first and last closed by a cone. Returns the
// vertex indices of each ring, and of the two apexes.
function tube(skin, pts, radii, bone, sides, cell, closeStart = true) {
  const rings = [], N = pts.length, uv = uvIn(cell, 0.5, 0.5), first = skin.index.length;
  const bw = (i) => (Array.isArray(bone) ? bone[i] : [[bone, 1]]);
  const frames = pts.map((p, i) => {
    const t = pts[Math.min(N - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
    const ref = Math.abs(t.y) > 0.9 ? V(1, 0, 0) : V(0, 1, 0), n = new THREE.Vector3().crossVectors(t, ref).normalize();
    return { t, n, b: new THREE.Vector3().crossVectors(t, n) };
  });
  pts.forEach((p, i) => {
    const ring = [];
    for (let j = 0; j < sides; j += 1) {
      const a = (j / sides) * Math.PI * 2, o = frames[i].n.clone().multiplyScalar(Math.cos(a) * radii[i]).addScaledVector(frames[i].b, Math.sin(a) * radii[i]);
      ring.push(vtx(skin, p.clone().add(o), uv, bw(i)));
    }
    rings.push(ring);
  });
  const faces = [];
  for (let i = 0; i + 1 < N; i += 1) for (let j = 0; j < sides; j += 1) {
    const a = rings[i][j], b = rings[i][(j + 1) % sides], c = rings[i + 1][j], d = rings[i + 1][(j + 1) % sides];
    faces.push([a, b, c], [b, d, c]);
  }
  const end = pts[N - 1].clone().addScaledVector(frames[N - 1].t, radii[N - 1] * 0.9), apexEnd = vtx(skin, end, uv, bw(N - 1));
  for (let j = 0; j < sides; j += 1) faces.push([rings[N - 1][j], rings[N - 1][(j + 1) % sides], apexEnd]);
  let apexStart = -1;
  if (closeStart) {
    apexStart = vtx(skin, pts[0].clone().addScaledVector(frames[0].t, -radii[0] * 0.9), uv, bw(0));
    for (let j = 0; j < sides; j += 1) faces.push([rings[0][(j + 1) % sides], rings[0][j], apexStart]);
  }
  // wound to face outwards: the first side face against its ring's radial
  const [a, b, c] = faces[0], pa = P(skin, a), centre = pts[0];
  const flip = new THREE.Vector3().crossVectors(P(skin, b).sub(pa), P(skin, c).sub(pa)).dot(pa.clone().sub(centre)) < 0;
  for (const f of faces) skin.index.push(...(flip ? [f[0], f[2], f[1]] : f));
  skin.shade(first, skin.index.length);
  return { rings, apexEnd, apexStart };
}

// A point `u` of the way (by length) along a ray: where it is, and which bones hold it. A ray is { pts: [Vector3],
// bones: [bone name per point] }, a segment blending its two ends' bones.
function along(ray, u) {
  const L = [0];
  for (let i = 1; i < ray.pts.length; i += 1) L.push(L[i - 1] + ray.pts[i].distanceTo(ray.pts[i - 1]));
  const at = u * L[L.length - 1];
  let i = 0;
  while (i < ray.pts.length - 2 && L[i + 1] < at) i += 1;
  const span = L[i + 1] - L[i], t = span > 1e-9 ? Math.min(1, Math.max(0, (at - L[i]) / span)) : 0;
  const bi = B[ray.bones[i]], bj = B[ray.bones[i + 1]];
  return { p: ray.pts[i].clone().lerp(ray.pts[i + 1], t), bw: bi === bj ? [[bi, 1]] : [[bi, 1 - t], [bj, t]] };
}

// A sheet of membrane between two rays, made twice (its top, which faces up, and its underside). `uvOf(top, i, j, p)`.
function patch(skin, A, Bray, cols, rows, uvOf, marks, normal = null) {
  for (const top of [true, false]) {
    const base = skin.count;
    for (let j = 0; j <= rows; j += 1) for (let i = 0; i <= cols; i += 1) {
      const a = along(A, i / cols), b = along(Bray, i / cols), r = j / rows, p = a.p.clone().lerp(b.p, r), bw = new Map();
      for (const [bone, w] of a.bw) bw.set(bone, (bw.get(bone) || 0) + w * (1 - r));
      for (const [bone, w] of b.bw) bw.set(bone, (bw.get(bone) || 0) + w * r);
      vtx(skin, p, uvOf(top, i / cols, r, p), [...bw]);
    }
    const first = skin.index.length;
    for (let j = 0; j < rows; j += 1) for (let i = 0; i < cols; i += 1) {
      const a = base + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
      for (const f of [[a, b, c], [b, d, c]]) {
        const pa = P(skin, f[0]), n = new THREE.Vector3().crossVectors(P(skin, f[1]).sub(pa), P(skin, f[2]).sub(pa));
        if (n.lengthSq() < 1e-16) continue;                                      // the sliver at a fan's point
        skin.index.push(...((n.y >= 0) === top ? f : [f[0], f[2], f[1]]));
      }
    }
    skin.shade(first, skin.index.length);
    // a skin is lit through: its underside takes the top's normals, or the downward faces were black
    if (!top) for (let k = base * 3; k < skin.count * 3; k += 1) skin.normal[k] = -skin.normal[k];
    if (normal) for (let k = base; k < skin.count; k += 1) { skin.normal[k * 3] = normal.x; skin.normal[k * 3 + 1] = normal.y; skin.normal[k * 3 + 2] = normal.z; }
  }
  if (marks) marks.push(skin.count);
}

// The loft of the head and body: rings along x, nose to rump, an ellipse each (rising x for `curve`).
function loft(skin, shape, sides, count) {
  const st = shape.trunk.map((s) => s.map((v) => v * MM)).sort((a, b) => a[0] - b[0]);
  const up = curve(st.map((s) => [s[0], s[1]])), down = curve(st.map((s) => [s[0], s[2]])), half = curve(st.map((s) => [s[0], s[3]]));
  const x0 = st[0][0], x1 = st[st.length - 1][0], rings = [], neck = shape.neck.map((v) => v * MM);
  for (let i = 0; i < count; i += 1) {
    const x = x1 - (x1 - x0) * (i / (count - 1)), ring = [], hold = smooth((neck[0] - x) / (neck[0] - neck[1]));      // 1 on the body, 0 on the head
    for (let j = 0; j <= sides; j += 1) {
      const a = (j / sides) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      const p = V(x, c > 0 ? up(x) * c : down(x) * c, half(x) * s);
      ring.push(vtx(skin, p, uvIn(CELLS.fur, j / sides, i / (count - 1)), [[B.body, hold], [B.head, 1 - hold]]));
    }
    rings.push(ring);
  }
  const first = skin.index.length, faces = [];
  for (let i = 0; i + 1 < count; i += 1) for (let j = 0; j < sides; j += 1) {
    const a = rings[i][j], b = rings[i][j + 1], c = rings[i + 1][j], d = rings[i + 1][j + 1];
    faces.push([a, b, c], [b, d, c]);
  }
  const noseApex = vtx(skin, V(x1 + 0.0005, 0, 0), uvIn(CELLS.fur, 0.5, 0), [[B.head, 1]]);
  const rumpApex = vtx(skin, V(x0 - 0.0004, 0, 0), uvIn(CELLS.fur, 0.5, 1), [[B.body, 1]]);
  for (let j = 0; j < sides; j += 1) faces.push([rings[0][j], rings[0][j + 1], noseApex], [rings[count - 1][j + 1], rings[count - 1][j], rumpApex]);
  const [a, b, c] = faces[0], pa = P(skin, a);
  const flip = new THREE.Vector3().crossVectors(P(skin, b).sub(pa), P(skin, c).sub(pa)).dot(V(0, pa.y, pa.z)) < 0;
  for (const f of faces) skin.index.push(...(flip ? [f[0], f[2], f[1]] : f));
  skin.shade(first, skin.index.length);
  for (const ring of rings) for (let k = 0; k < 3; k += 1) {           // the seam takes one normal
    const sum = skin.normal[ring[0] * 3 + k] + skin.normal[ring[sides] * 3 + k];
    skin.normal[ring[0] * 3 + k] = sum; skin.normal[ring[sides] * 3 + k] = sum;
  }
  return { rings, nose: rings[0], rump: rings[count - 1] };
}

const dirOf = (yaw, pitch, side) => V(Math.sin(yaw * RAD) * Math.cos(pitch * RAD), Math.sin(pitch * RAD), side * Math.cos(yaw * RAD) * Math.cos(pitch * RAD));

// Where each joint of a side is, in the bind pose (metres): every place the bones, the membrane and the pose need.
export function layout(shape, side) {
  const s = side, m = (a) => V(a[0] * MM, a[1] * MM, a[2] * MM * s);
  const S = m(shape.shoulder), E = S.clone().addScaledVector(dirOf(shape.humerus[1], shape.humerus[2], s), shape.humerus[0] * MM);
  const W = E.clone().addScaledVector(dirOf(shape.forearm[1], shape.forearm[2], s), shape.forearm[0] * MM);
  const tip = {}, digits = shape.digits;
  for (const key of ['d2', 'd3', 'd4', 'd5']) tip[key] = W.clone().addScaledVector(dirOf(digits[key][1], digits[key][2], s), digits[key][0] * MM);
  const K3 = W.clone().lerp(tip.d3, shape.knuckle[0]), K4 = W.clone().lerp(tip.d4, shape.knuckle[1]);
  const th = shape.thumb, Th = W.clone().addScaledVector(dirOf(th[2], th[3], s), th[0] * MM), ThC = Th.clone().addScaledVector(dirOf(th[2] + 25, th[3] - 25, s), th[1] * MM);
  const lg = shape.leg, hip = m(lg.hip), leg = (from, a) => from.clone().addScaledVector(V(a[1], a[2], a[3] * s).normalize(), a[0] * MM);
  const knee = leg(hip, lg.thigh), ankle = leg(knee, lg.shin), toe = leg(ankle, lg.foot), calcar = leg(ankle, lg.calcar);
  return { S, E, W, tip, K3, K4, Th, ThC, hip, knee, ankle, toe, calcar };
}

// One level of the bat: levels differ in how finely a ring and a sheet are cut, and in what small parts they have.
// The middle level (from about 8 m for a Yuma Myotis, where it is some twenty pixels across) has no toes, no thumb's
// claw and no calcar, and its membrane is cut more coarsely; the far one (from about 26 m, a few pixels) is the
// membrane, the body and the ears, with no bone and no tragus. (Until 2026-11-16 the three levels were 2,552, 1,170
// and 631 triangles: the middle near half the near and the far a quarter, where the budget is about a fifth and a
// twentieth. The measures read the near level's marks only.)
export function buildBat(sheet, level = 0) {
  const shape = sheet.shape, skin = new Skin(), marks = {}, T = shape.tail;
  const fine = [1, 0.35, 0.25][level], sides = [14, 7, 4][level], rings = [26, 11, 6][level], ts = [6, 3, 3][level];
  const small = level === 0, bones = level < 2;
  const nz = (cols) => Math.max(1, Math.round(cols * fine)), mem = { cols: nz(8), rows: nz(3) };
  const body = loft(skin, shape, sides, rings);
  marks.nose = body.nose; marks.tailBase = body.rump;
  const st = shape.trunk, rump = st.reduce((m, r) => Math.min(m, r[0]), 1e9) * MM;
  const Tb = V(rump, 0, 0), Tt = V(rump - T.length * MM, 0, 0), Te = V(rump - T.edge * MM, -0.0008, 0);
  const pivots = Object.fromEntries(BAT_BONES.map((n) => [n, new THREE.Vector3()]));
  const joints = { L: layout(shape, -1), R: layout(shape, 1) }, cellOf = memOf(joints);
  const ea = shape.ear;
  for (const side of ['L', 'R']) {
    const s = side === 'R' ? 1 : -1, J = joints[side], bn = (name) => B[name + side], bonePivot = (name, p) => pivots[name + side].copy(p);
    bonePivot('hum', J.S); bonePivot('fore', J.E); bonePivot('hand', J.W); for (const d of ['d2', 'd3', 'd4', 'd5']) bonePivot(d, J.W);
    bonePivot('t3', J.K3); bonePivot('t4', J.K4); bonePivot('thumb', J.W); bonePivot('thigh', J.hip); bonePivot('shin', J.knee); bonePivot('foot', J.ankle);
    // the bones, as thin tubes under the membrane
    if (bones) {
      const arm = tube(skin, [J.S, J.E], [0.0016, 0.0012], bn('hum'), ts, CELLS.bone), fore = tube(skin, [J.E, J.W], [0.0012, 0.0009], bn('fore'), ts, CELLS.bone);
      if (side === 'R') { marks.elbow = arm.rings[1]; marks.wrist = fore.rings[1]; }
    }
    const r = [0.0008, 0.0004, 0.00025];
    if (bones) tube(skin, [J.W, J.tip.d2], [r[0], r[2]], bn('d2'), ts, CELLS.bone);
    if (bones) tube(skin, [J.W, J.K3], [r[0], r[1]], bn('d3'), ts, CELLS.bone);
    if (bones) marks['tip' + side] = tube(skin, [J.K3, J.tip.d3], [r[1], r[2]], bn('t3'), ts, CELLS.bone, false).rings[1];
    if (bones) tube(skin, [J.W, J.K4], [r[0], r[1]], bn('d4'), ts, CELLS.bone);
    if (bones) tube(skin, [J.K4, J.tip.d4], [r[1], r[2]], bn('t4'), ts, CELLS.bone, false);
    if (bones) tube(skin, [J.W, J.tip.d5], [r[0], r[2]], bn('d5'), ts, CELLS.bone);
    // the free thumb, and its claw
    if (bones) tube(skin, [J.W, J.Th], [0.0008, 0.0006], bn('thumb'), ts, CELLS.bone);
    if (small) tube(skin, [J.Th, J.ThC], [0.0006, 0.00008], bn('thumb'), ts, CELLS.bone, false);
    // the hind leg, with its calcar, and five toes
    if (bones) tube(skin, [J.hip, J.knee], [0.0017, 0.0011], bn('thigh'), ts, CELLS.bone);
    if (bones) tube(skin, [J.knee, J.ankle], [0.0010, 0.0007], bn('shin'), ts, CELLS.bone);
    if (bones) tube(skin, [J.ankle, J.toe], [0.0007, 0.0006], bn('foot'), ts, CELLS.foot);
    if (small) tube(skin, [J.ankle, J.calcar], [0.0005, 0.00012], bn('foot'), ts, CELLS.bone, false);
    const fd = J.toe.clone().sub(J.ankle).normalize();
    for (let k = 0; k < (small ? 5 : 0); k += 1) {
      const a = (k - 2) * 0.32, d = fd.clone().applyAxisAngle(V(0, 1, 0), a * s).add(V(0, -0.18, 0)).normalize();
      tube(skin, [J.toe, J.toe.clone().addScaledVector(d, 0.0034)], [0.00045, 0.0001], bn('foot'), Math.max(3, ts - 1), CELLS.foot, false);
    }
    // the membrane
    const bnames = (list) => list.map((e) => e[1] + (e[1] === 'body' || e[1] === 'tail' ? '' : side));
    const ray = (list) => ({ pts: list.map((e) => e[0]), bones: bnames(list) });
    const Y = (p, y) => V(p.x, y, p.z);
    const N = V(0.0115, 0.0018, 0.0034 * s), Sm = V(0.0004, 0.0004, 0.0053 * s), H = V(rump + 0.007, -0.0006, 0.0044 * s);
    const eps = (p, q) => p.clone().lerp(q, 0.02);
    const memUV = (top, u, v, p) => { const [a, b] = membraneAt(p.x, p.z, cellOf); return uvIn(top ? CELLS.top : CELLS.under, a, b); };
    const R = {
      pro: [ray([[N, 'body'], [J.W, 'hand']]), ray([[J.S, 'body'], [J.E, 'hum'], [eps(J.E, J.W), 'fore'], [J.W, 'hand']])],
      d2: [ray([[J.W, 'd2'], [J.tip.d2, 'd2']]), ray([[J.W, 'd3'], [J.W.clone().lerp(J.tip.d3, shape.digits.d2[0] / shape.digits.d3[0]), 'd3']])],
      d34: [ray([[J.W, 'd3'], [J.K3, 'd3'], [eps(J.K3, J.tip.d3), 't3'], [J.tip.d3, 't3']]), ray([[J.W, 'd4'], [J.K4, 'd4'], [eps(J.K4, J.tip.d4), 't4'], [J.tip.d4, 't4']])],
      d45: [ray([[J.W, 'd4'], [J.K4, 'd4'], [eps(J.K4, J.tip.d4), 't4'], [J.tip.d4, 't4']]), ray([[J.W, 'd5'], [J.tip.d5, 'd5']])],
      plag: [ray([[J.W, 'd5'], [J.tip.d5, 'd5'], [J.ankle, 'foot']]), ray([[J.W, 'hand'], [eps(J.W, J.E), 'fore'], [J.E, 'hum'], [Sm, 'body'], [H, 'body']])],
      uro: [ray([[Tb, 'tail'], [Te, 'tail']]), ray([[H, 'body'], [Y(J.knee, -0.0012), 'thigh'], [Y(J.ankle, -0.0014), 'foot'], [Y(J.calcar, -0.0012), 'foot'], [Te, 'tail']])],
    };
    patch(skin, R.pro[0], R.pro[1], nz(4), 1, memUV);
    patch(skin, R.d2[0], R.d2[1], 2, 1, memUV);
    patch(skin, R.d34[0], R.d34[1], mem.cols, mem.rows, memUV);
    patch(skin, R.d45[0], R.d45[1], mem.cols, mem.rows, memUV);
    patch(skin, R.plag[0], R.plag[1], nz(10), nz(4), memUV);
    patch(skin, R.uro[0], R.uro[1], nz(8), nz(3), memUV);
    // the ear and its tragus
    const base = V(ea.at[0] * MM, ea.at[1] * MM, ea.at[2] * MM * s), L = ea.length * MM, Wd = ea.width * MM;
    const d = V(Math.sin(ea.lean[0] * RAD), Math.cos(ea.lean[0] * RAD) * Math.cos(ea.lean[1] * RAD), s * Math.cos(ea.lean[0] * RAD) * Math.sin(ea.lean[1] * RAD)).normalize();
    const w = V(1, 0, 0).addScaledVector(d, -d.x).normalize(), n = new THREE.Vector3().crossVectors(d, w).multiplyScalar(s);
    const edge = (sign) => {
      const pts = [];
      for (let q = 0; q <= 6; q += 1) {
        const t = q / 6, wide = Wd * Math.pow(Math.max(0, 1 - Math.pow(t, 2.2)), 0.55);
        pts.push(base.clone().addScaledVector(d, L * t).addScaledVector(w, sign * wide));
      }
      return { pts, bones: pts.map(() => 'ear' + side) };
    };
    const earUV = (top, u, v) => uvIn(top ? CELLS.earOut : CELLS.earIn, v, 1 - u);
    const lit = V(0.2, 0.7, s * 0.7).normalize();           // an ear is lit as a leaf, from either side
    patch(skin, edge(-1), edge(1), nz(6), nz(3), earUV, null, lit);
    const tg = base.clone().addScaledVector(w, -Wd * 0.25).addScaledVector(n, s * -0.0004), tl = ea.tragus[0] * MM, tw = ea.tragus[1] * MM;
    const trag = (o, f) => ({ pts: [tg.clone().addScaledVector(w, o), tg.clone().addScaledVector(w, o * 0.6).addScaledVector(d, tl * f)], bones: ['ear' + side, 'ear' + side] });
    if (bones) patch(skin, trag(0, 1), trag(-tw, 0.8), 2, 1, (top, u, v) => uvIn(top ? CELLS.earOut : CELLS.earIn, 0.5, 0.5), null, lit);
    pivots['ear' + side].copy(base);
  }
  // the tail's bone, along the middle of the uropatagium
  if (bones) marks.tailTip = tube(skin, [Tb, Tt], [0.0007, 0.0004], B.tail, ts, CELLS.bone, false).rings[1];
  pivots.body.set(0, 0, 0); pivots.root.set(0, 0, 0); pivots.tail.copy(Tb);
  pivots.head.set(shape.neck[0] * MM, 0.002, 0);
  const geometry = skin.geometry();
  geometry.computeBoundingSphere();
  geometry.boundingSphere.radius = Math.max(geometry.boundingSphere.radius, 0.2);
  geometry.boundingSphere.center.set(0, 0, 0);
  return { geometry, pivots, marks, joints, mem: cellOf, tail: { base: Tb, tip: Tt, edge: Te }, triangles: skin.index.length / 3, eye: eyeOf(shape) };
}
const eyeOf = (shape) => ({ x: shape.eye[0] * MM, angle: shape.eye[1] * RAD, r: shape.eye[2] * MM });

// A species ready to be made into bats: its sheet and its three detail levels.
export function buildBatKind(sheet) {
  const levels = [0, 1, 2].map((level) => buildBat(sheet, level));
  return { sheet, levels, plan: 'bat', triangles: levels.map((l) => l.triangles) };
}

// The built bat measured from the vertices of its mesh (millimetres): a mark is the middle of the vertices listed.
export function measureBat(built) {
  const position = built.geometry.getAttribute('position'), v = V(0, 0, 0);
  const mark = (list) => { const out = V(0, 0, 0); for (const i of list) out.add(v.fromBufferAttribute(position, i)); return out.divideScalar(list.length); };
  const m = built.marks, between = (a, b) => mark(m[a]).distanceTo(mark(m[b])) * 1000;
  return {
    forearm: between('elbow', 'wrist'),
    headBody: between('nose', 'tailBase'),
    tail: between('tailBase', 'tailTip'),
    span: between('tipL', 'tipR'),
  };
}
export function compareBat(sheet, built) {
  const got = measureBat(built);
  return sheet.published.lengths.map(([key, what, mean, range, source]) => {
    const value = got[key];
    const off = mean !== null ? (value - mean) / mean : (value < range[0] ? (value - range[0]) / range[0] : value > range[1] ? (value - range[1]) / range[1] : 0);
    return { key, what, built: value, mean, range, source, off };
  });
}
