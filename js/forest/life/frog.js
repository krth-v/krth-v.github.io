import * as THREE from 'three';
import { Skin, curve } from './skin.js';
import { rng } from '../paint/brush.js';

// A frog or a toad, built from its species sheet (life/species): the body plan 'frog'. Written in the beast's way
// (life/beast.js) and measured as the birds' and the elk's are. Every length in the sheet's `shape` is in units of
// the snout-to-vent length (`shape.svl`, millimetres), so one builder serves a long-legged frog, a squat toad and a
// tiny treefrog by their sheets alone. The body is built in metres in the bind pose, which is the resting crouch:
// +x the way it faces, +y up, +z its right, the origin on the ground under the middle of its body. Each bone's own
// turn is nothing in the bind pose; a pose turns each bone from there (life/frogRig.js).
//
//   shape.axis      [height of the vent above the ground, degrees the body's line rises towards the snout]
//   shape.trunk     the body and the head, one skin from the vent (s = 0) to the snout (s = 1) along the axis: rings
//                   [s, up, down, half its width, how square it is (2 an ellipse)], `up` and `down` from the axis
//   shape.hinge     [s of the neck's turn, s of the jaw's hinge, s where the shoulders give way to the head's skin]
//   shape.eye       { s, up, side, r }: a ball set into the head's upper corner, `up` from the axis, `side` out from it
//   shape.hind      the hip, knee, ankle and ball of the foot, each [x, y, z] (z the right side's; the left is mirrored),
//                   `girth` of thigh, knee, shank, ankle, foot, and `toes` { lens (five), r, spread, pad, web }
//   shape.fore      the same for the arm: shoulder, elbow, wrist, girth (four), `fingers` { lens (four), r, spread, pad }
//   shape.sac       { s, size: [long, high, wide] }: the throat's sac, which a pose blows up from nothing
//   shape.features  `ridges` [s0, s1, round a, width, height] (the dorsolateral folds), `bumps` [s, a, along, round,
//                   height] (the parotoid glands) and `warts` { count, h, r, from: [s0, s1], low }: a is 0 at the belly
//                   and 1 along the spine, and a feature is laid on both sides
// Three detail levels from one sheet: 0 for the close-up, 1 for the middle distance, 2 for one a few pixels long.
// At most 4,000, about 800 and about 200 triangles (the brief of 2026-11-16 for a frog): the close-up has its
// joints rounded, every toe with its pad and its webs; the middle level the limbs and the toes as thin tubes, no
// pads and no webs; the far level the body, the eyes and the limbs as three-sided sticks.
// (Revised 2026-11-16 by the agent called frogs2: the first build was 11,560, 3,880 and 1,578 triangles, and the
// toad's paint took seventeen seconds, every pixel asking each of 520 warts how near it was.)

export const FROG_BONES = ['root', 'hips', 'chest', 'head', 'jaw', 'sac',
  'thighL', 'shankL', 'footL', 'thighR', 'shankR', 'footR', 'armL', 'foreL', 'handL', 'armR', 'foreR', 'handR'];
export const FROG_PARENT = { hips: 'root', chest: 'hips', head: 'chest', jaw: 'head', sac: 'head',
  thighL: 'hips', shankL: 'thighL', footL: 'shankL', thighR: 'hips', shankR: 'thighR', footR: 'shankR',
  armL: 'chest', foreL: 'armL', handL: 'foreL', armR: 'chest', foreR: 'armR', handR: 'foreR' };
const B = Object.fromEntries(FROG_BONES.map((name, i) => [name, i]));
export const FROG_LEGS = { L: { side: -1, hind: ['thighL', 'shankL', 'footL'], fore: ['armL', 'foreL', 'handL'] }, R: { side: 1, hind: ['thighR', 'shankR', 'footR'], fore: ['armR', 'foreR', 'handR'] } };

// Where each part's paint is in the animal's one sheet: [x0, y0, x1, y1] as shares of the canvas, top-down.
// (1024 by 768: at 2048 by 1536 a frog took half a second to paint, and a close-up of the largest of them, a
// toad, fills about 400 pixels of a 1080-line frame, which the body's cell still has a texel for.)
export const FROG_SHEET = [1024, 768];
export const FCELLS = {
  trunk: [0.0, 0.0, 0.64, 0.55],             // along the body from the vent (left) to the snout; across, belly, right side, back, left side, belly
  hind:  [0.65, 0.0, 0.82, 0.3],             // a hind limb: round it, and down it from the hip to the ankle
  fore:  [0.83, 0.0, 1.0, 0.3],
  foot:  [0.65, 0.31, 0.82, 0.5],            // a toe or a finger: round it, and out along it
  web:   [0.83, 0.31, 0.9, 0.5],
  eye:   [0.91, 0.31, 0.97, 0.5],
  sac:   [0.65, 0.51, 0.9, 0.7],
};
const inCell = (cell, u, v) => [cell[0] + (cell[2] - cell[0]) * u, 1 - (cell[1] + (cell[3] - cell[1]) * v)];
// Each level: rings along the body and round it; a limb's sides and rows; a toe's sides and rows; a ball's
// (columns, rows) for a joint, a toe's pad, an eye and the sac; and what the level has at all.
const RES = [
  { along: 32, round: 24, limb: 8, rows: 3, toe: 5, toeRows: 2, ball: [5, 4], pad: [4, 3], eye: [10, 6], sac: [8, 5], joints: true, toes: true, pads: true, webs: true },
  { along: 14, round: 10, limb: 4, rows: 1, toe: 3, toeRows: 1, ball: [4, 3], pad: null, eye: [6, 4], sac: [4, 3], joints: false, toes: true, pads: false, webs: false },
  { along: 8, round: 6, limb: 3, rows: 1, toe: 0, toeRows: 0, ball: [4, 2], pad: null, eye: [4, 2], sac: [4, 2], joints: false, toes: false, pads: false, webs: false },
];
const D = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// the surface's relief at a place (s along, a round from 0 the belly to 2 the belly again): folds, glands and warts,
// in units of L. The warts are drawn once from the sheet's seed, so every level and the painter share them, and
// kept in a grid of cells three of their widths across, so that a place asks only the warts of its own and the
// next cells.
const GRID = 0.06;
export function reliefOf(sheet) {
  const F = sheet.shape.features, r = rng(sheet.seed + 5);
  // The warts in squares of GRID (s along, and a round as 0.45 of it): each wart is kept in its own square and the
  // eight round it, so that a place asks one square for every wart that can reach it (once a pixel of the paint).
  const NI = Math.ceil(1 / GRID) + 1, NJ = Math.ceil(0.9 / GRID) + 1, cells = F.warts ? Array.from({ length: NI * NJ }, () => []) : null;
  if (F.warts) {
    for (let i = 0; i < F.warts.count; i += 1) {
      const s = lerp(F.warts.from[0], F.warts.from[1], r()), a = lerp(F.warts.low, 2 - F.warts.low, r());
      const wart = [s, a, F.warts.r * (0.6 + 0.8 * r()), F.warts.h * (0.5 + 0.8 * r())];
      const i0 = Math.floor(s / GRID), j0 = Math.floor((a * 0.45) / GRID);
      for (let di = -1; di <= 1; di += 1) for (let dj = -1; dj <= 1; dj += 1) {
        const ii = i0 + di, jj = j0 + dj;
        if (ii >= 0 && jj >= 0 && ii < NI && jj < NJ) cells[ii * NJ + jj].push(wart);
      }
    }
  }
  const out = { h: 0, wart: 0 };
  return (s, a) => {
    const sym = a <= 1 ? a : 2 - a;
    let h = 0, wart = 0;
    for (const [s0, s1, a0, w, hh] of F.ridges) h += hh * smooth(s0 - 0.02, s0 + 0.04, s) * smooth(s1 + 0.02, s1 - 0.04, s) * Math.exp(-(((sym - a0) * 0.45) ** 2) / (w * w));
    for (const [s0, a0, rs, ra, hh] of F.bumps) h += hh * Math.exp(-(((s - s0) / rs) ** 2) - (((sym - a0) * 0.45 / ra) ** 2));
    if (cells) {
      const i0 = Math.floor(s / GRID), j0 = Math.floor((a * 0.45) / GRID);
      const list = i0 >= 0 && j0 >= 0 && i0 < NI && j0 < NJ ? cells[i0 * NJ + j0] : null;
      if (list) {
        for (let k = 0; k < list.length; k += 1) {
          // (a wart more than three of its radii off adds under a ten-thousandth of its height: not worked out)
          const one = list[k], ds = s - one[0], da = (a - one[1]) * 0.45, d2 = (ds * ds + da * da) / (one[2] * one[2]);
          if (d2 > 9) continue;
          const q = Math.exp(-d2);
          h += one[3] * q; if (q > wart) wart = q;
        }
      }
    }
    // (one object, filled again each call: read it before the next)
    out.h = h; out.wart = wart;
    return out;
  };
}

const cap = (skin, centre, first, n, flip) => {
  const from = skin.index.length;
  for (let i = 0; i < n; i += 1) { const a = first + i; if (flip) skin.index.push(centre, a + 1, a); else skin.index.push(centre, a, a + 1); }
  skin.shade(from, skin.index.length);
};

// The trunk's rings as tables over s, worked out once a sheet: a curve through ten rings asked for a million
// times over (once a painted pixel) was most of the half second the paint took.
const TABLE = 512;
function rings(shape) {
  const T = shape.trunk, cols = [1, 2, 3, 4].map((k) => curve(T.map((r) => [r[0], r[k]])));
  const table = cols.map((c) => Float32Array.from({ length: TABLE + 1 }, (_, i) => c(i / TABLE)));
  return table.map((t) => (s) => { const x = Math.min(TABLE, Math.max(0, s * TABLE)), i = Math.min(TABLE - 1, Math.floor(x)), f = x - i; return t[i] + (t[i + 1] - t[i]) * f; });
}

export function buildFrog(sheet, level = 0, shared = null) {
  const shape = sheet.shape, res = RES[level], L = shape.svl / 1000, skin = new Skin(), marks = {}, pivots = {}, contact = [];
  const P = (a) => V(a[0] * L, a[1] * L, a[2] * L);
  const relief = shared ? shared.relief : reliefOf(sheet);
  const [upC, downC, halfC, sqC] = shared ? shared.rings : rings(shape);

  // ---- the axis and the rings
  const th = shape.axis[1] * D, dir = V(Math.cos(th), Math.sin(th), 0), up = V(-Math.sin(th), Math.cos(th), 0);
  const vent = V(-0.5 * Math.cos(th) * L, shape.axis[0] * L, 0);
  const onAxis = (s, n = 0, z = 0) => vent.clone().addScaledVector(dir, s * L).addScaledVector(up, n * L).add(V(0, 0, z * L));
  const [neckS, jawS, shoulderS] = shape.hinge;
  pivots.root = V();
  pivots.hips = onAxis(0.22); pivots.chest = onAxis(shoulderS - 0.1); pivots.head = onAxis(neckS);
  pivots.jaw = onAxis(jawS, -downC(jawS) * 0.55); pivots.sac = onAxis(shape.sac.s, -downC(shape.sac.s) * 0.55);
  const legs = {};
  for (const [key, leg] of Object.entries(FROG_LEGS)) {
    const h = shape.hind, f = shape.fore, z = leg.side;
    const mirror = (a) => [a[0], a[1], a[2] * z];
    legs[key] = { hind: [h.hip, h.knee, h.ankle, h.ball].map((a) => P(mirror(a))), fore: [f.shoulder, f.elbow, f.wrist].map((a) => P(mirror(a))) };
    leg.hind.slice(0, 3).forEach((name, i) => { pivots[name] = legs[key].hind[i].clone(); });
    leg.fore.slice(0, 3).forEach((name, i) => { pivots[name] = legs[key].fore[i].clone(); });
  }

  // which bones hold a ring by where it is along the body: hips, then chest, then the head, shared across each hinge
  const along = (s, out) => {
    const c1 = 0.3, c3 = neckS - 0.02;
    if (s < c1 - 0.1) { out.b0 = B.hips; out.b1 = B.hips; out.w1 = 0; }
    else if (s < c1 + 0.1) { out.b0 = B.hips; out.b1 = B.chest; out.w1 = smooth(c1 - 0.1, c1 + 0.1, s); }
    else if (s < c3 - 0.07) { out.b0 = B.chest; out.b1 = B.chest; out.w1 = 0; }
    else if (s < c3 + 0.07) { out.b0 = B.chest; out.b1 = B.head; out.w1 = smooth(c3 - 0.07, c3 + 0.07, s); }
    else { out.b0 = B.head; out.b1 = B.head; out.w1 = 0; }
  };
  const oval = (a, upv, dn, half, sq, out) => {
    const t = a * Math.PI, c = -Math.cos(t), s = Math.sin(t), e = 2 / sq;
    out.y = Math.sign(c) * Math.abs(c) ** e * (c > 0 ? upv : dn);
    out.z = Math.abs(s) ** e * half;
    return out;
  };
  const _o = { y: 0, z: 0 };
  // a point of the body's skin: s along, a round (0 belly .. 1 right-hand spine .. 2 belly)
  const trunkPoint = (s, a, out = V(), bumps = relief(s, a)) => {
    const sym = a <= 1 ? a : 2 - a;
    oval(sym, upC(s) * L, downC(s) * L, halfC(s) * L, sqC(s), _o);
    const z = a <= 1 ? _o.z : -_o.z, rel = bumps.h * L, len = Math.hypot(_o.y, z) || 1, k = (len + rel) / len;
    // (the vent's place, then along the axis, then out: written out, since the painter asks this once a pixel)
    out.set(vent.x + dir.x * s * L + up.x * _o.y * k, vent.y + dir.y * s * L + up.y * _o.y * k, vent.z + dir.z * s * L + up.z * _o.y * k + z * k);
    return out;
  };

  // ---- the trunk
  const n = res.along, m = res.round, w = { b0: 0, b1: 0, w1: 0 };
  const s0 = 0.012, s1 = 0.988;
  const ks = Array.from({ length: n + 1 }, (_, j) => { const t = j / n; return s0 + (s1 - s0) * (t - 0.04 * Math.sin(2 * Math.PI * t)); });
  const base = skin.sheet(m, n, (i, j, out) => {
    const s = ks[j], a = (i / m) * 2;
    trunkPoint(s, a, out.p);
    [out.u, out.v] = inCell(FCELLS.trunk, s, a / 2);
    along(s, w);
    out.b0 = w.b0; out.b1 = w.b1; out.w1 = w.w1;
    const sym = a <= 1 ? a : 2 - a;
    if (s > jawS - 0.04) { const j1 = smooth(0.5, 0.3, sym) * smooth(jawS - 0.03, jawS + 0.05, s); if (j1 > 0) { out.b0 = B.head; out.b1 = B.jaw; out.w1 = j1; } }
  }, { flip: true, wrap: true });
  {
    const ventTip = onAxis(0).add(V(0, -downC(0) * 0.3 * L, 0)), snoutTip = onAxis(1).add(V(0, -downC(1) * 0.3 * L, 0));
    const v0 = skin.vertex(ventTip.x, ventTip.y, ventTip.z, ...inCell(FCELLS.trunk, 0.002, 0.5), B.hips);
    cap(skin, v0, base, m, false);
    const v1 = skin.vertex(snoutTip.x, snoutTip.y, snoutTip.z, ...inCell(FCELLS.trunk, 0.998, 0.5), B.head, B.jaw, 0.4);
    cap(skin, v1, base + n * (m + 1), m, true);
    marks.vent = [v0]; marks.snout = [v1];
  }
  // the lowest belly, for grounding a pose
  for (const s of [0.1, 0.25, 0.4, 0.55]) { const p = trunkPoint(s, 0); contact.push({ p, bone: s < 0.3 ? B.hips : B.chest, r: 0 }); }
  contact.push({ p: trunkPoint(0.96, 0), bone: B.head, r: 0 });

  // ---- a sphere, for a joint, an eye, a toe's pad, the throat's sac
  const ball = (centre, radii, bone, cell, planar, steps) => {
    const [c, r] = steps;
    return skin.sheet(c, r, (i, j, out) => {
      const t = (i / c) * Math.PI * 2, ph = -Math.PI / 2 + (j / r) * Math.PI;
      const x = Math.cos(ph) * Math.cos(t), y = Math.sin(ph), z = Math.cos(ph) * Math.sin(t);
      out.p.set(centre.x + x * radii[0], centre.y + y * radii[1], centre.z + z * radii[2]);
      if (planar) { const q = planar(x, y, z); [out.u, out.v] = inCell(cell, 0.5 + 0.48 * q[0], 0.5 + 0.48 * q[1]); }
      else [out.u, out.v] = inCell(cell, i / c, j / r);
      out.b0 = bone;
    }, { wrap: true, flip: true });
  };
  // ---- a tube from a to b, radius ra to rb, its dorsal side towards `ref`, its paint down the cell's v from v0 to v1
  const tube = (a, b, ra, rb, bone, cell, ref, v0, v1, { bulge = 0, flat = 1, sides = res.limb, rows = Math.max(1, res.rows) } = {}) => {
    const d = b.clone().sub(a), len = d.length(), dn = d.clone().normalize();
    const u = ref.clone().addScaledVector(dn, -ref.dot(dn)).normalize(), wv = dn.clone().cross(u);
    return skin.sheet(sides, rows, (i, j, out) => {
      const t = j / rows, ang = (i / sides) * Math.PI * 2, r = lerp(ra, rb, t) * (1 + bulge * Math.sin(Math.PI * t));
      out.p.copy(a).addScaledVector(dn, t * len).addScaledVector(u, Math.cos(ang) * r * flat).addScaledVector(wv, Math.sin(ang) * r);
      [out.u, out.v] = inCell(cell, i / sides, lerp(v0, v1, t));
      out.b0 = bone;
    }, { wrap: true });
  };

  // ---- the eyes: a ball in the head's upper corner, its paint planar from the way it faces (out, and a little up
  // and forward), its pupil across: every frog and toad here has a level pupil
  const E = shape.eye;
  for (const side of [-1, 1]) {
    const centre = onAxis(E.s, E.up, side * E.side), out = V(0.3, 0.45, side).normalize();
    const t1 = V(0, 1, 0).cross(out).normalize(), t2 = out.clone().cross(t1).normalize();
    ball(centre, [E.r * L, E.r * L, E.r * L], B.head, FCELLS.eye, (x, y, z) => { const v = V(x, y, z); return [v.dot(t1) * (side > 0 ? 1 : -1), v.dot(t2)]; }, res.eye);
  }

  // ---- the throat's sac: built full size on its own bone, which a pose scales from nothing
  {
    const [sl, sh, sw] = shape.sac.size, c = pivots.sac.clone();
    ball(c, [sl * L / 2, sh * L / 2, sw * L / 2], B.sac, FCELLS.sac, null, res.sac);
  }

  // ---- the hind legs: thigh, shank, and the foot (tarsus and toes); a ball at each joint in the close-up
  const H = shape.hind, G = H.girth, toes = H.toes;
  for (const [key, leg] of Object.entries(FROG_LEGS)) {
    const J = legs[key].hind, z = leg.side, bones = leg.hind;
    const ref = V(0, 1, z * 0.5);
    if (res.joints) {
      ball(J[0], [G[0] * L, G[0] * L, G[0] * L], B[bones[0]], FCELLS.hind, null, res.ball);
      ball(J[1], [G[1] * L, G[1] * L, G[1] * L], B[bones[1]], FCELLS.hind, null, res.ball);
      ball(J[2], [G[3] * L, G[3] * L, G[3] * L], B[bones[2]], FCELLS.hind, null, res.ball);
    }
    tube(J[0], J[1], G[0] * L, G[1] * L, B[bones[0]], FCELLS.hind, ref, 0, 0.45, { bulge: 0.18 });
    tube(J[1], J[2], G[1] * L, G[2] * L, B[bones[1]], FCELLS.hind, ref, 0.45, 0.8, { bulge: 0.12 });
    tube(J[2], J[3], G[3] * L, G[4] * L, B[bones[2]], FCELLS.hind, ref, 0.8, 1);
    contact.push({ p: J[3].clone(), bone: B[bones[2]], r: G[4] * L });
    // the toes fan from the ball of the foot, on the ground, the fourth the longest; the web is a sheet between each pair
    const axis = J[3].clone().sub(J[2]); axis.y = 0; axis.normalize();
    const tips = [];
    for (let k = 0; k < 5; k += 1) {
      const f = (k - 2) / 2, ang = f * toes.spread * D * -z, d = axis.clone().applyAxisAngle(V(0, 1, 0), ang + z * 0.12);
      d.y = -0.05; d.normalize();
      const len = toes.lens[k] * L, r = toes.r * L, from = J[3].clone();
      const tip = from.clone().addScaledVector(d, len);
      if (res.toes) tube(from, tip, r, r * 0.8, B[bones[2]], FCELLS.foot, V(0, 1, 0), 0.05, 0.95, { sides: res.toe, rows: res.toeRows });
      if (res.pads) {
        if (toes.pad > 0) ball(tip, [r * toes.pad, r * toes.pad * 0.7, r * toes.pad], B[bones[2]], FCELLS.foot, null, res.pad);
        else ball(tip, [r * 0.85, r * 0.7, r * 0.85], B[bones[2]], FCELLS.foot, null, res.pad);
      }
      contact.push({ p: tip.clone(), bone: B[bones[2]], r: r * Math.max(0.8, toes.pad * 0.7) });
      tips.push({ from, d, len });
    }
    if (toes.web > 0 && res.webs) {
      for (let k = 0; k < 4; k += 1) {
        const A = tips[k], Bt = tips[k + 1], reach = toes.web * (k === 3 ? 0.7 : 1);
        const web = (flip) => skin.sheet(1, 3, (i, j, out) => {
          const t = (j / 3) * reach, T0 = i ? Bt : A;
          out.p.copy(T0.from).addScaledVector(T0.d, T0.len * t).add(V(0, 0.2 * L * 0.012, 0));
          [out.u, out.v] = inCell(FCELLS.web, 0.5, 1 - j / 3);
          out.b0 = B[bones[2]];
        }, { flip: flip !== (z > 0) });
        web(false); web(true);
      }
    }
  }

  // ---- the forelegs
  const Fo = shape.fore, FG = Fo.girth, fing = Fo.fingers;
  for (const [key, leg] of Object.entries(FROG_LEGS)) {
    const J = legs[key].fore, z = leg.side, bones = leg.fore, ref = V(0, 1, z * 0.3);
    if (res.joints) {
      ball(J[0], [FG[0] * L, FG[0] * L, FG[0] * L], B[bones[0]], FCELLS.fore, null, res.ball);
      ball(J[1], [FG[1] * L, FG[1] * L, FG[1] * L], B[bones[1]], FCELLS.fore, null, res.ball);
      ball(J[2], [FG[3] * L, FG[3] * L, FG[3] * L], B[bones[2]], FCELLS.fore, null, res.ball);
    }
    tube(J[0], J[1], FG[0] * L, FG[1] * L, B[bones[0]], FCELLS.fore, ref, 0, 0.5, { bulge: 0.1 });
    tube(J[1], J[2], FG[1] * L, FG[2] * L, B[bones[1]], FCELLS.fore, ref, 0.5, 1);
    const axis = J[2].clone().sub(J[1]); axis.y = 0; axis.normalize();
    for (let k = 0; k < 4; k += 1) {
      const f = (k - 1.5) / 1.5, d = axis.clone().applyAxisAngle(V(0, 1, 0), f * fing.spread * D * -z); d.y = -0.04; d.normalize();
      const len = fing.lens[k] * L, r = fing.r * L, tip = J[2].clone().addScaledVector(d, len);
      if (res.toes) tube(J[2], tip, r, r * 0.8, B[bones[2]], FCELLS.foot, V(0, 1, 0), 0.05, 0.95, { sides: res.toe, rows: res.toeRows });
      if (res.pads) {
        if (fing.pad > 0) ball(tip, [r * fing.pad, r * fing.pad * 0.7, r * fing.pad], B[bones[2]], FCELLS.foot, null, res.pad);
        else ball(tip, [r * 0.85, r * 0.7, r * 0.85], B[bones[2]], FCELLS.foot, null, res.pad);
      }
      contact.push({ p: tip.clone(), bone: B[bones[2]], r: r * Math.max(0.8, fing.pad * 0.7) });
    }
    contact.push({ p: J[2].clone(), bone: B[bones[2]], r: FG[3] * L });
  }

  const geometry = skin.geometry();
  geometry.computeBoundingSphere();
  const _tp = V();
  // Where a place in the trunk's cell is on the body, for the painter: s along, a round, and the relief there.
  const surface = {
    // (`out`, if given, is filled and handed back: the painter asks this once a pixel, and a new object each time was
    // a third of its work)
    trunk(s, a, out = {}) {
      const rel = relief(s, a), p = trunkPoint(s, a, _tp, rel);
      out.x = p.x / L; out.y = p.y / L; out.z = p.z / L; out.t = s; out.a = a <= 1 ? a : 2 - a; out.side = a <= 1 ? 1 : -1; out.bump = rel.h; out.wart = rel.wart;
      return out;
    },
  };
  return { geometry, pivots, legs, marks, surface, contact, L, triangles: skin.index.length / 3 };
}

// A species ready to be made into animals: its sheet and its three detail levels (which share the sheet's warts
// and its rings, worked out once).
export function buildFrogKind(sheet) {
  const shared = { relief: reliefOf(sheet), rings: rings(sheet.shape) };
  const levels = [0, 1, 2].map((level) => buildFrog(sheet, level, shared));
  return { sheet, levels, plan: 'frog', triangles: levels.map((l) => l.triangles) };
}

// The built animal measured from the vertices of its mesh (millimetres): the snout to the vent, laid straight.
export function measureFrog(built) {
  const position = built.geometry.getAttribute('position'), a = V(), b = V();
  const mark = (list, out) => { out.set(0, 0, 0); for (const i of list) out.add(new THREE.Vector3().fromBufferAttribute(position, i)); return out.divideScalar(list.length); };
  return { svl: mark(built.marks.snout, a).distanceTo(mark(built.marks.vent, b)) * 1000 };
}
export function compareFrog(sheet, built) {
  const got = measureFrog(built);
  return sheet.published.lengths.map(([key, what, mean, range, source]) => {
    const value = got[key];
    const off = mean !== null ? (value - mean) / mean : (value < range[0] ? (value - range[0]) / range[0] : value > range[1] ? (value - range[1]) / range[1] : 0);
    return { key, what, built: value, mean, range, source, off };
  });
}
