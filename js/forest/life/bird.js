import * as THREE from 'three';
import { DISPLAY_BONES, DISPLAY_PARENT, buildDisplay, fanBind } from './parts/display.js';
import { Skin, curve } from './skin.js';
import { hookedBill, talon } from './parts/raptor.js';
import { buildDuckBill, buildWebs } from './parts/duck.js';
import { squeezeOf, buildDisc, buildTufts, feathering, lidPivot } from './parts/owl.js';

// A bird, built from its species sheet (life/species). The sheet gives lengths in millimetres, as the
// literature does; the bird is built in metres. Everything is laid out in the level pose: the body's axis
// level, +x towards the bill, +y up, +z the bird's right, x = 0 where the tail feathers are rooted.
//
//   shape.top, shape.bottom, shape.half   the outline of head and body: its upper and lower edge seen from the
//                                         side and its half-width seen from above, as [[x, y], ...]. It ends
//                                         at the bill's base, as deep and as wide there as the bill is.
//   shape.widest                          how far up between bottom and top the body is widest (0..1)
//   shape.neck: [x0, x1]                  where the head's hold on the skin begins and where it is complete
//   shape.eye: { x, y, r }
//   shape.bill: { culmen, drop, gape }    culmen: the exposed culmen (published); drop: how far the tip curves
//                                         down, as a share of that; gape: how far behind the base the jaw hinges
//   shape.wing: { chord, wrist: [x, y], aim: [dx, dy], up, down, rest, proud,
//                 span, shoulder: [x, y, z], arm, lead, sweep, root, tipChord }
//                                         chord and span are published lengths. `up` and `down` are the folded
//                                         wing's upper and lower edge, as [[share of the chord, mm], ...].
//   shape.tail: { length, root: y, rootHalf, feathers, width, closed, graded, point, droop, tent }
//   shape.leg: { knee: [x, y, z], shin, tarsus, thick: [thigh, heel, tarsus], toes: { mid, side, hind, claw, hindClaw }, splay }
//   shape.crest: { sunk, paint, lobes: [[x, length, lean, deep, wide, sweep], ...] }
//                                         only for a bird that has one: blades of long feathers standing from the
//                                         crown (see "a crest", below)
//   shape.comb, shape.ruff, shape.tail.fan   only for a bird that has them: a grouse's display (life/parts/display.js)
//
// The parts hang on the bones of life/rig.js. Both wings are built twice: folded against the body, as the
// perched bird shows them, and spread. A pose shows one and shrinks the other into its joint. The folded
// wing is a painted surface of its own because that is where a perched bird's field marks are.
//
// Three detail levels come from one sheet: 0 for the close-up, 1 for the middle distance, 2 for a bird a
// few pixels long.

// The three front toes: the middle one, the outer and the inner. Each has three joints. The first of every
// toe turns on the foot's one `toes` bone; the second and third have a bone each (toeMB, toeMC, ...), so that a
// foot can close round a branch. A toe that could only turn where it leaves the foot went straight through it.
export const TOES = ['M', 'O', 'I'];
export const BONES = ['root', 'body', 'head', 'jaw', 'foldL', 'foldR', 'armL', 'handL', 'armR', 'handR', 'tail', 'tailL', 'tailR',
  'shinL', 'tarsusL', 'toesL', 'hindL', 'shinR', 'tarsusR', 'toesR', 'hindR',
  ...['L', 'R'].flatMap((side) => TOES.flatMap((toe) => [`toe${toe}B${side}`, `toe${toe}C${side}`]))];
export const PARENT = { body: 'root', head: 'body', jaw: 'head', foldL: 'body', foldR: 'body', armL: 'body', handL: 'armL', armR: 'body', handR: 'armR',
  tail: 'body', tailL: 'tail', tailR: 'tail', shinL: 'body', tarsusL: 'shinL', toesL: 'tarsusL', hindL: 'tarsusL', shinR: 'body', tarsusR: 'shinR', toesR: 'tarsusR', hindR: 'tarsusR',
  ...Object.fromEntries(['L', 'R'].flatMap((side) => TOES.flatMap((toe) => [[`toe${toe}B${side}`, `toes${side}`], [`toe${toe}C${side}`, `toe${toe}B${side}`]]))) };
// (the grouse's display, life/parts/display.js: a comb, a ruff and a tail that fans, on bones of their own appended
// after every other, so that each of those keeps its place; a bird that has none of them has these bones unmoved)
BONES.push(...DISPLAY_BONES); Object.assign(PARENT, DISPLAY_PARENT);
// which way each front toe points, as a turn outwards from straight ahead, in shares of the sheet's `splay`; and its length in shares of its own
export const TOE_YAW = { M: 0, O: 1, I: -1 };
// The way a front toe points, in radians from straight ahead (outwards +). A sheet may give a toe a way of its
// own (shape.leg.yaw: { O, I }): a woodpecker's outer toe is turned out and back.
export const toeYaw = (leg, key) => (leg.yaw && leg.yaw[key] != null ? leg.yaw[key] : TOE_YAW[key] * leg.splay);
const B = Object.fromEntries(BONES.map((name, i) => [name, i]));

// Where each part's paint is in the bird's one sheet: [x0, y0, x1, y1] as shares of the canvas, top-down.
// life/plumage.js paints into the same table. The sheet is half as tall again as it is wide, and the skin's
// cell holds the whole way round the body: the left side's belly at its top, the back along its middle, the
// right side's belly at its bottom. Painted as one side and mirrored, the streaks of a creeper's crown and
// back met along the midline as a kaleidoscope does.
export const CELLS = {
  skin:      [0.00, 0.000, 1.00, 0.533],
  fold:      [0.00, 0.540, 0.50, 0.690],
  foldUnder: [0.51, 0.540, 0.75, 0.604],
  wingUp:    [0.00, 0.697, 0.50, 0.845],
  wingUnder: [0.00, 0.852, 0.50, 1.000],
  tailUp:    [0.51, 0.697, 0.75, 1.000],
  tailUnder: [0.76, 0.697, 1.00, 1.000],
  bill:      [0.76, 0.540, 0.88, 0.604],
  mouth:     [0.89, 0.540, 0.93, 0.569],
  eye:       [0.94, 0.540, 1.00, 0.583],
  leg:       [0.51, 0.615, 0.75, 0.682],
  shin:      [0.76, 0.615, 1.00, 0.682],
};
// The share of the skin cell's height kept as a margin at its top and at its bottom. The paint repeats into
// the margins (the top edge and the bottom edge are the same line under the belly), so a filtered read at
// the seam finds the paint it would have found on the other side, and no line is drawn down the breast.
export const SKIN_EDGE = 0.0075;
// A point (u across, v down, both 0..1) of a cell, as texture coordinates. The canvas is flipped on upload.
// (`squeeze`: a sheet whose paint is taller than every bird's, an owl's, has its cells where they always are on a
// taller canvas: life/parts/owl.js. It is 1, exactly, for every other bird.)
let squeeze = 1;
const inCell = (cell, u, v) => [cell[0] + (cell[2] - cell[0]) * u, 1 - (cell[1] + (cell[3] - cell[1]) * v) * squeeze];
// Which of the six strips of a tail cell a feather is painted in: 0 the middle pair, 5 the outermost.
export const tailStrip = (c) => Math.min(5, Math.round(Math.abs(c) * 5));

const MM = 0.001;
const RES = [
  { along: 44, round: 24, bill: [8, 6], eye: true, fold: [12, 6], arm: [3, 3], hand: [5, 3], tail: 3, leg: 6, toes: true },
  { along: 18, round: 12, bill: [4, 3], eye: false, fold: [5, 2], arm: [1, 1], hand: [2, 1], tail: 1, leg: 3, toes: false },
  { along: 9, round: 6, bill: [2, 2], eye: false, fold: null, arm: [1, 1], hand: [1, 1], tail: 1, leg: 0, toes: false },
];

// The outline of head and body as functions of x (mm), and the surface between them.
export function outline(shape) {
  const top = curve(shape.top), bottom = curve(shape.bottom), half = curve(shape.half);
  const rear = Math.min(shape.top[0][0], shape.bottom[0][0]), front = Math.max(shape.top[shape.top.length - 1][0], shape.bottom[shape.bottom.length - 1][0]);
  const mid = (x) => bottom(x) + (top(x) - bottom(x)) * shape.widest;
  // The point a share `a` of the way from the belly's midline (0) up the right side to the back's midline (1).
  const surface = (x, a, out) => {
    const psi = Math.PI * a, m = mid(x), c = Math.cos(psi);
    return out.set(x, m - c * (c > 0 ? m - bottom(x) : top(x) - m), half(x) * Math.sin(psi));
  };
  // How far out the right side is at (x, y) seen from the side; 0 outside the outline.
  const out = (x, y) => {
    if (x < rear || x > front) return 0;
    const m = mid(x), k = y > m ? (y - m) / Math.max(top(x) - m, 1e-6) : (m - y) / Math.max(m - bottom(x), 1e-6);
    return k >= 1 ? 0 : half(x) * Math.sqrt(1 - k * k);
  };
  // The share `a` at which the right side passes height y.
  const around = (x, y) => {
    const m = mid(x), k = y > m ? -(y - m) / Math.max(top(x) - m, 1e-6) : (m - y) / Math.max(m - bottom(x), 1e-6);
    return Math.acos(Math.min(1, Math.max(-1, k))) / Math.PI;
  };
  return { top, bottom, half, mid, rear, front, surface, out, around };
}

// Returns { geometry, pivots, marks, origin, triangles }. `pivots` is where each bone turns, in metres in
// the bind pose. `marks` names the vertices that published lengths are measured between (life/measure.js):
// each is a list of vertices whose middle is the mark. `origin` is the point of the level pose, in mm,
// that the bird's own origin (the ground between its feet) is.
export function buildBird(sheet, level = 0) {
  const shape = sheet.shape, res = RES[level], skin = new Skin(), marks = {};
  const body = outline(shape);
  squeeze = squeezeOf(sheet);
  // (an owl's lids hang on the jaw, and its lower mandible on the head: life/parts/owl.js)
  const lidded = !!shape.disc && shape.disc.lid !== false;
  const leg = shape.leg, wing = shape.wing, tail = shape.tail, bill = shape.bill;
  const [kx, ky, kz] = leg.knee, heel = ky - leg.shin, foot = heel - leg.tarsus, ground = foot - leg.thick[2] * 0.6;
  const origin = [kx, ground];
  // from the level pose in mm to the bind pose in metres
  const X = (x) => (x - origin[0]) * MM, Y = (y) => (y - origin[1]) * MM, Z = (z) => z * MM;
  const p = new THREE.Vector3();
  const put = (out, x, y, z) => out.p.set(X(x), Y(y), Z(z));
  const row = (base, cols, j) => Array.from({ length: cols + 1 }, (_, i) => base + j * (cols + 1) + i);

  // ---- head and body: one skin, the head's share of each vertex rising across the neck
  const [neck0, neck1] = shape.neck;
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // stations are closer together on the head, where the outline turns fastest
  const stations = [];
  for (let j = 0; j <= res.along; j += 1) { const t = j / res.along; stations.push(body.rear + (body.front - body.rear) * (t + 0.22 * t * (1 - t) * (2 * t - 0.4))); }
  const skinBase = skin.sheet(res.round, res.along, (i, j, out) => {
    const x = stations[j], a = (i / res.round) * 2, half = a <= 1 ? a : 2 - a;      // 0 belly, 1 back, then down the left side to the belly again
    body.surface(x, half, p);
    put(out, p.x, p.y, a <= 1 ? p.z : -p.z);
    [out.u, out.v] = inCell(CELLS.skin, 1 - (x - body.rear) / (body.front - body.rear), SKIN_EDGE + (1 - a / 2) * (1 - 2 * SKIN_EDGE));       // right round: each side has its own paint
    out.b0 = B.body; out.b1 = B.head; out.w1 = smooth(neck0, neck1, x);
  }, { wrap: true, flip: true });
  // both ends are closed with a fan to their middle
  for (const [j, bone, rear] of [[0, B.body, true], [res.along, B.head, false]]) {
    const x = stations[j], centre = skin.vertex(X(x), Y(body.mid(x)), 0, ...inCell(CELLS.skin, rear ? 0.998 : 0.002, 0.5), bone), from = skin.index.length;
    for (let i = 0; i < res.round; i += 1) {
      const a = skinBase + j * (res.round + 1) + i;
      if (rear) skin.index.push(centre, a, a + 1); else skin.index.push(centre, a + 1, a);
    }
    skin.shade(from, skin.index.length);
  }
  const loftEnd = skin.count;

  // A few overlapping contour feathers turn the smooth loft at the nape and throat.
  // They take the paint and neck weights of the skin directly underneath. Tuck the
  // quills into it and lift the rounded tips, keeping a waterbird's plumage sleeker.
  if (level === 0) {
    const span = body.front - body.rear;
    const halfWidths = [0.025, 0.056, 0.014];
    const tufts = [[0.18, 0.80], [0.24, 0.89], [0.30, 0.82], [0.25, 0.25], [0.31, 0.18], [0.38, 0.27]];
    for (const side of [1, -1]) for (const [start, around] of tufts) {
      skin.sheet(2, 2, (i, j, out) => {
        const t = j / 2, across = i - 1;
        const x = body.front - span * (start + 0.105 * t - 0.014 * t * Math.abs(across));
        const a = around + across * halfWidths[j] - 0.045 * t;
        body.surface(x, a, p);
        const lift = body.half(x) * (shape.bill.duck ? 0.055 : 0.14) *
          (t - 0.22) * (1 - 0.32 * Math.abs(across));
        put(out, x, p.y - lift * Math.cos(Math.PI * a), side * (p.z + lift * Math.sin(Math.PI * a)));
        const v = side > 0 ? 1 - a / 2 : a / 2;
        [out.u, out.v] = inCell(CELLS.skin, (body.front - x) / span, SKIN_EDGE + v * (1 - 2 * SKIN_EDGE));
        out.b0 = B.body; out.b1 = B.head; out.w1 = smooth(neck0, neck1, x);
      }, { flip: side < 0 });
    }
  }

  // ---- eyes: a low dome on each side of the head (an owl's are set in its face: life/parts/owl.js)
  if (res.eye && !shape.disc) {
    const { x, y, r } = shape.eye, a = body.around(x, y), centre = body.surface(x, a, new THREE.Vector3());
    const ahead = body.surface(x + 0.5, a, new THREE.Vector3()).sub(centre), up = body.surface(x, a + 0.01, new THREE.Vector3()).sub(centre);
    const normal = new THREE.Vector3().crossVectors(ahead, up).normalize();
    if (normal.z < 0) normal.negate();
    ahead.normalize(); up.crossVectors(normal, ahead);
    for (const side of [1, -1]) {
      skin.sheet(10, 3, (i, j, out) => {
        // a low dome, its rim a little under the feathers: higher, the eyes stood out of the head's outline seen from in front
        const th = (i / 10) * Math.PI * 2, rr = r * (1 - j / 3), lift = 0.24 * r * Math.sqrt(1 - (rr / r) * (rr / r)) - 0.2;
        p.copy(centre).addScaledVector(ahead, Math.cos(th) * rr).addScaledVector(up, Math.sin(th) * rr).addScaledVector(normal, lift);
        put(out, p.x, p.y, p.z * side);
        [out.u, out.v] = inCell(CELLS.eye, 0.5 + 0.46 * Math.cos(th) * (rr / r), 0.5 - 0.46 * Math.sin(th) * (rr / r));
        out.b0 = B.head;
      }, { flip: side < 0, wrap: true });
    }
  }

  // ---- bill: an upper and a lower mandible that meet along the cutting edge; the lower one is the jaw's
  // (a raptor's, hooked and with a cere at its base, is built by life/parts/raptor.js: only for a sheet that asks)
  if (bill.hook || bill.cere) hookedBill({ skin, body, level, bill, put, B, CELLS, marks });
  // (a duck's, for a sheet that asks for one: life/parts/duck.js)
  else if (bill.duck) buildDuckBill({ skin, body, bill, level, put, inCell, CELLS, marks, head: B.head, jaw: B.jaw });
  else {
    const x0 = body.front, yTop = body.top(x0), yLow = body.bottom(x0), depth = yTop - yLow, width = body.half(x0) * 2;
    const edge = yTop - depth * 0.56;                                              // the cutting edge at the base
    // The exposed culmen is the straight line from where the feathers end on top of the bill to its tip.
    const fall = bill.drop * bill.culmen + depth * 0.72, length = Math.sqrt(Math.max(bill.culmen * bill.culmen - fall * fall, 1));
    // (`shape.brow.over`: mm of it under the forehead's feathers, as a grouse's base and nostrils are: the bill is begun
    // that far inside the head, and its culmen measured from there, as one measured from the base is. The grouse's)
    const from = x0 - (shape.brow ? shape.brow.over : 0);
    // t runs from the base to the tip: the cutting edge drops as the bill curves, and both mandibles thin to the tip
    const line = (t) => edge - bill.drop * bill.culmen * t * t - depth * 0.06 * t;
    const thin = (t) => Math.pow(1 - t, 0.75) * 0.94 + 0.06;
    const [nu, nv] = res.bill;
    for (const upper of [true, false]) {
      const high = upper ? depth * 0.56 : depth * 0.44, reach = upper ? 1 : 0.94;   // the upper mandible's tip reaches past the lower one's, and turns down over it
      const hook = (t) => (upper && t > 0.8 ? (t - 0.8) * depth * 0.5 : 0);
      const base = skin.sheet(nu, nv, (i, j, out) => {
        const t = j / nv, th = (i / nu) * Math.PI, end = j === nv ? 0.25 : 1, w = width * 0.5 * thin(t) * end, h = high * thin(t) * (upper ? 1 : 0.85) * end;
        put(out, from + length * t * reach, line(t) + (upper ? 1 : -1) * Math.sin(th) * h - hook(t), -Math.cos(th) * w * (upper ? 1 : -1));
        [out.u, out.v] = inCell(CELLS.bill, 0.04 + 0.92 * t, upper ? 0.05 + 0.4 * (i / nu) : 0.55 + 0.4 * (i / nu));
        out.b0 = upper || lidded ? B.head : B.jaw;
      });
      if (upper) { marks.culmenBase = [base + Math.round(nu / 2)]; marks.billTip = [base + nv * (nu + 1) + Math.round(nu / 2)]; }
      if (level === 0) {
        // the inside of the mouth, seen when the bill opens: a strip from one cutting edge to the other
        skin.sheet(1, nv, (i, j, out) => {
          const t = j / nv, w = width * 0.5 * thin(t) * (j === nv ? 0.25 : 1);
          put(out, from + length * t * reach, line(t) - hook(t), (i ? -1 : 1) * w * (upper ? 1 : -1));
          [out.u, out.v] = inCell(CELLS.mouth, 0.5, 0.5);
          out.b0 = upper || lidded ? B.head : B.jaw;
        });
      }
    }
  }

  // ---- folded wings: a shallow dome lying on the body's side from the wrist back to the wing's tip
  if (res.fold) {
    const aim = new THREE.Vector2(wing.aim[0], wing.aim[1]).normalize(), across = new THREE.Vector2(-aim.y, aim.x);
    if (across.y < 0) across.negate();
    const up = curve(wing.up), down = curve(wing.down), [nc, nw] = res.fold;
    const lift = (x, y, t) => Math.max(body.out(x, y), wing.rest * (1 - 0.6 * t));
    // The wing chord is measured in the round, from the wrist on the body's side to the tip over the tail,
    // so seen from the side the wing is a little shorter than its chord.
    const tipSide = [wing.wrist[0] + aim.x * wing.chord, wing.wrist[1] + aim.y * wing.chord];
    const dz = lift(wing.wrist[0], wing.wrist[1], 0) - lift(tipSide[0], tipSide[1], 1), flat = Math.sqrt(Math.max(wing.chord * wing.chord - dz * dz, 1));
    for (const side of [1, -1]) {
      for (const under of [false, true]) {
        const base = skin.sheet(nc, nw, (i, j, out) => {
          const t = i / nc, v = j / nw, off = -down(t) + (up(t) + down(t)) * v;
          const x = wing.wrist[0] + aim.x * flat * t + across.x * off, y = wing.wrist[1] + aim.y * flat * t + across.y * off;
          // proud of the body in the middle and down on it at the rim; past the body the two wings lie side by side over the tail
          const dome = Math.pow(Math.sin(Math.PI * v), 0.6) * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.93 + 0.035)), 0.4);
          put(out, x, y, (lift(x, y, t) + (under ? 0.1 : 0.5 + wing.proud * dome)) * side);
          [out.u, out.v] = inCell(under ? CELLS.foldUnder : CELLS.fold, t, 1 - v);
          out.b0 = side > 0 ? B.foldR : B.foldL;
        }, { flip: (side > 0) !== under });
        if (side > 0 && !under) { marks.wrist = [base, base + nw * (nc + 1)]; marks.wingTip = [base + nc, base + nw * (nc + 1) + nc]; }
      }
    }
  }

  // ---- spread wings: an arm and a hand, cambered, each with an upper and an under side
  {
    const [sx, sy, sz] = wing.shoulder, reach = wing.span / 2 - sz, armSpan = wing.arm, handSpan = reach - armSpan;
    const lead = (z) => { const k = Math.max(0, z - armSpan) / handSpan; return wing.lead - wing.sweep * k * k; };          // x of the leading edge, from the shoulder
    const chordAt = (z) => { const k = Math.max(0, z - armSpan) / handSpan; return wing.root + (wing.tipChord - wing.root) * Math.pow(k, 1.6); };
    for (const side of [1, -1]) {
      for (const [bone, z0, z1, [nz, nx], u0, u1] of [[side > 0 ? B.armR : B.armL, 0, armSpan, res.arm, 0, armSpan / reach], [side > 0 ? B.handR : B.handL, armSpan, reach, res.hand, armSpan / reach, 1]]) {
        for (const under of [false, true]) {
          const base = skin.sheet(nz, nx, (i, j, out) => {
            const z = z0 + (z1 - z0) * (i / nz), k = j / nx;
            // the wing is cambered a little: its edges lie lower than the middle of its chord
            const along = z / reach;
            const arch = wing.root * 0.075 * (1 - 0.8 * along) * Math.sin(Math.PI * k);
            // The wrist carries the span. The outer primaries sweep down from it and twist
            // out towards the tips; this stays continuous where the arm meets the hand.
            const wristRise = wing.arm * 0.065 * Math.min(z / armSpan, 1);
            const primary = Math.max(0, (z - armSpan) / handSpan);
            const twist = primary * primary * wing.tipChord * (0.22 + 0.16 * k);
            put(out, sx + lead(z) - chordAt(z) * k, sy + wristRise + arch - twist - (under ? 0.3 : 0), (sz + z) * side);
            [out.u, out.v] = inCell(under ? CELLS.wingUnder : CELLS.wingUp, u0 + (u1 - u0) * (i / nz), k);
            out.b0 = bone;
          }, { flip: (side > 0) !== under });
          if (!under && z1 === reach) marks[side > 0 ? 'spreadTipR' : 'spreadTipL'] = Array.from({ length: nx + 1 }, (_, j) => base + j * (nz + 1) + nz);
        }
      }
    }
  }

  // ---- tail: its feathers one by one, each an upper and an under side, the outer ones lowest in the stack
  {
    const n = tail.feathers, rows = res.tail;
    const groups = level === 0 ? n : (level === 1 ? 4 : 2);              // fewer, wider strips stand in for the feathers further off
    for (let g = 0; g < groups; g += 1) {
      const c = (g / (groups - 1)) * 2 - 1, width = (tail.width * n) / groups / (level === 0 ? 1 : 1.7);
      // `fork` (optional, mm): the middle feathers are that much shorter than the outermost, which are `length` (a swallow's notch)
      const cut = tail.fork ? tail.fork * (1 - Math.abs(c)) : 0;
      const length = tail.length - tail.graded * Math.pow(Math.abs(c), 1.5) - cut, turn = c * tail.closed, cos = Math.cos(turn), sin = Math.sin(turn);
      const strip = tailStrip(c), widest = tail.rootHalf + tail.length * Math.sin(tail.closed) + tail.width / 2;
      for (const under of [false, true]) {
        const base = skin.sheet(1, rows, (i, j, out) => {
          const t = j / rows, s = (i ? 1 : -1) * width * 0.5 * (j === rows ? tail.point : 1) * (0.55 + 0.45 * Math.min(1, t * 3)), along = length * t;
          const z = c * tail.rootHalf + along * sin + s * cos;
          // A closed tail is not flat: it is ridged like a roof, the outer feathers lying lower than the middle
          // pair, so from the side it shows as a slab and not as a line. It also droops a little along its length.
          const roof = tail.tent * Math.pow(Math.min(1, Math.abs(z) / widest), 1.7) * (0.6 + 0.4 * t);
          put(out, -along * cos + s * sin, tail.root - roof - (under ? 0.25 : 0) - tail.droop * t * t * length, z);
          // a feather's inner web is towards the middle of the tail on either side
          const inner = (i === 1) === (c < 0);
          [out.u, out.v] = inCell(under ? CELLS.tailUnder : CELLS.tailUp, (strip + (inner ? 0.12 : 0.88)) / 6, t);
          out.b0 = B.tail; out.b1 = c >= 0 ? B.tailR : B.tailL; out.w1 = Math.abs(c);
          if (tail.fan) fanBind(c, out, B);                                  // (a tail that fans in display: life/parts/display.js)
        }, { flip: !under });
        if (!under && g === Math.floor((groups - 1) / 2)) { marks.tailBase = [base, base + 1]; if (!tail.fork) marks.tailTip = [base + rows * 2, base + rows * 2 + 1]; }
        // a forked tail is measured to the tips of its two outermost feathers, which are its longest
        if (!under && tail.fork && (g === 0 || g === groups - 1)) marks.tailTip = [...(marks.tailTip || []), base + rows * 2, base + rows * 2 + 1];
      }
      // `spine` (optional, mm): the shaft of each feather runs on past its vane as a bare spine (a swift's), at the nearest level only
      if (level === 0 && tail.spine) {
        const tipX = -length * cos, tipZ = c * tail.rootHalf + length * sin, tipY = tail.root - tail.tent * Math.pow(Math.min(1, Math.abs(tipZ) / widest), 1.7) - tail.droop * length;
        const dx = -cos, dz = sin;                                           // the way the feather points, in the level
        skin.sheet(3, 1, (i, j, out) => {
          const th = (i / 3) * Math.PI * 2, r = 0.38 * (1 - 0.8 * j), up = Math.sin(th) * r, side = Math.cos(th) * r;     // a ring round the line the feather points along
          put(out, tipX + dx * tail.spine * j - dz * side, tipY + up, tipZ + dz * tail.spine * j + dx * side);
          [out.u, out.v] = inCell(CELLS.tailUp, (strip + 0.5) / 6, 0.99);
          out.b0 = B.tail; out.b1 = c >= 0 ? B.tailR : B.tailL; out.w1 = Math.abs(c);
        }, { wrap: true, flip: true });
      }
    }
  }

  // ---- legs: a feathered shin, a bare tarsus, three toes forward and one back
  if (res.leg) {
    const sides = res.leg, axis = new THREE.Vector3(), u = new THREE.Vector3(), v = new THREE.Vector3(), ref = new THREE.Vector3();
    const fl = feathering(leg);                                    // (feathered legs and toes: life/parts/owl.js)
    for (const side of [1, -1]) {
      const name = side > 0 ? 'R' : 'L';
      const tube = (bone, cell, from, to, r0, r1, rows, endBone = bone) => {
        axis.set(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
        const len = axis.length() || 1;
        axis.divideScalar(len);
        ref.set(0, 0, 1); if (Math.abs(axis.z) > 0.9) ref.set(1, 0, 0);
        u.crossVectors(axis, ref).normalize(); v.crossVectors(axis, u);
        return skin.sheet(sides, rows, (i, j, out) => {
          const t = j / rows, th = (i / sides) * Math.PI * 2, r = r0 + (r1 - r0) * t, c = Math.cos(th) * r, s = Math.sin(th) * r;
          put(out, from[0] + axis.x * len * t + u.x * c + v.x * s, from[1] + axis.y * len * t + u.y * c + v.y * s, (from[2] + axis.z * len * t + u.z * c + v.z * s) * side);
          [out.u, out.v] = inCell(cell, i / sides, 0.04 + 0.92 * t);
          out.b0 = j === rows ? endBone : bone;                    // a joint's ring goes with the bone beyond it, so the joint stays closed when it bends
        }, { wrap: true, flip: side < 0 });
      };
      tube(B[`shin${name}`], CELLS.shin, [kx, ky, kz], [kx, heel, kz], leg.thick[0], leg.thick[1], 2, B[`tarsus${name}`]);
      const tarsus = tube(B[`tarsus${name}`], fl.tarsus ? CELLS.shin : CELLS.leg, [kx, heel, kz], [kx, foot, kz], leg.thick[2] * fl.puff, leg.thick[2] * 0.9 * fl.puff, 2);
      if (side > 0) { marks.heel = row(tarsus, sides, 0); marks.toeBase = row(tarsus, sides, 2); }
      if (res.toes) {
        const r = leg.thick[2] * 0.62;
        const toe = (bones, yaw, length, claw, mark) => {
          // three joints flat on the ground, then a claw that comes down to a point on it
          const c = Math.cos(yaw), s = Math.sin(yaw);
          const at = (d, h) => [kx + c * d, ground + r + h, kz + s * d];
          let last = 0;
          for (let k = 0; k < 3; k += 1) { const f = k < fl.toes ? fl.toePuff : 1; last = tube(bones[k], k < fl.toes ? CELLS.shin : CELLS.leg, at(length * k / 3, k === 0 ? leg.thick[2] * 0.3 : 0), at(length * (k + 1) / 3, 0), r * (1 - 0.1 * k) * f, r * (0.9 - 0.1 * k) * f, 1, bones[Math.min(2, k + 1)]); }
          if (leg.talons) talon({ skin, put, sides }, side, bones[2], at(length, 0), [c, s], claw, r, leg.talons);       // (a raptor's: life/parts/raptor.js)
          else tube(bones[2], CELLS.leg, at(length, 0), at(length + claw * 0.8, -r * 0.9), r * 0.62, r * 0.08, 2);
          if (mark && side > 0) marks[mark] = row(last, sides, 1);
        };
        const front = (key, yaw, length, claw, mark) => toe([B[`toes${name}`], B[`toe${key}B${name}`], B[`toe${key}C${name}`]], yaw, length, claw, mark);
        front('M', 0, leg.toes.mid, leg.toes.claw, 'midToeTip');
        front('O', toeYaw(leg, 'O'), leg.toes.side, leg.toes.claw * 0.9);
        front('I', toeYaw(leg, 'I'), leg.toes.side * 0.96, leg.toes.claw * 0.9);
        toe([B[`hind${name}`], B[`hind${name}`], B[`hind${name}`]], Math.PI, leg.toes.hind, leg.toes.hindClaw);
        // (webs between the front toes, for a sheet that asks for them: life/parts/duck.js)
        if (leg.web) buildWebs({ skin, put, inCell, CELLS, side, name, B, kx, kz, ground, leg, toeYaw });
      }
    }
  }

  // ---- a grouse's comb and ruff (life/parts/display.js), after the body's own parts: only a sheet that asks builds them
  const turns = shape.comb || shape.ruff ? buildDisplay({ skin, body, shape, level, put, inCell, CELLS, SKIN_EDGE, B }) : {};

  // ---- a crest: blades of long feathers that stand up and back from the crown, each drawn out to a point. It
  // is the head's (it has no bone of its own, so it is carried as the sheet draws it) and it takes the crown's
  // own paint, further back along the head the further up the blade: no cell of the sheet is its own. Only a
  // sheet that has one builds it, and after every other part, so a bird without one is vertex for vertex what
  // it was. The furthest level has the hindmost blade alone, a little thicker.
  if (shape.crest) {
    const lobes = level === 2 ? shape.crest.lobes.slice(-1) : shape.crest.lobes, [sides, rows] = [[8, 5], [4, 2], [3, 1]][level], thick = level === 2 ? 1.5 : 1;
    for (const [x0, length, lean, deep, wide, sweep = 0.2] of lobes) {
      const y0 = body.top(x0) - (shape.crest.sunk ?? 3);
      skin.sheet(sides, rows, (i, j, out) => {
        const t = j / rows, th = (i / sides) * Math.PI * 2, turn = lean + sweep * t, taper = Math.pow(1 - t, 0.7) * thick;
        // its middle line leans back, and further back towards the tip; across it, the blade is deeper than it is wide
        const cx = x0 - Math.sin(turn) * length * t, cy = y0 + Math.cos(turn) * length * t, c = Math.cos(th) * deep * taper;
        put(out, cx + Math.cos(turn) * c, cy + Math.sin(turn) * c, Math.sin(th) * wide * taper);
        // (the paint it takes: the crown's from its root back, or, if the sheet says so, a stretch of the crown, `paint`: [from, to])
        const stretch = shape.crest.paint, xs = stretch ? stretch[1] - (stretch[1] - stretch[0]) * t : Math.max(body.rear, x0 - length * t * 0.55), a = 1 - 0.07 * Math.sin(th);
        [out.u, out.v] = inCell(CELLS.skin, 1 - (xs - body.rear) / (body.front - body.rear), SKIN_EDGE + (1 - a / 2) * (1 - 2 * SKIN_EDGE));
        out.b0 = B.head;
      }, { wrap: true, flip: true });
    }
  }

  // ---- an owl's face, with its eyes and lids set in it, and its ear tufts (life/parts/owl.js), after every other part
  if (shape.disc || shape.tufts) {
    const c = { skin, shape, level, body, put, inCell, B, CELLS, SKIN_EDGE, loft: [0, loftEnd], grid: [skinBase, res.round, res.along], X, Y, Z, unX: (m) => m / MM + origin[0], unY: (m) => m / MM + origin[1], unZ: (m) => m / MM };
    if (shape.disc) buildDisc(c);
    if (shape.tufts) buildTufts(c);
  }

  // ---- where the bones turn (the bind pose, metres)
  const at = (x, y, z = 0) => new THREE.Vector3(X(x), Y(y), Z(z));
  const headX = (neck0 + neck1) / 2, wristOut = body.out(wing.wrist[0], wing.wrist[1]);
  const pivots = {
    root: new THREE.Vector3(), body: at(kx, ky), head: at(headX, body.mid(headX) + (body.top(headX) - body.mid(headX)) * 0.2),
    jaw: at(body.front - bill.gape, body.top(body.front) - (body.top(body.front) - body.bottom(body.front)) * 0.56),
    foldR: at(wing.wrist[0], wing.wrist[1], wristOut), foldL: at(wing.wrist[0], wing.wrist[1], -wristOut),
    armR: at(...wing.shoulder), armL: at(wing.shoulder[0], wing.shoulder[1], -wing.shoulder[2]),
    handR: at(wing.shoulder[0], wing.shoulder[1], wing.shoulder[2] + wing.arm), handL: at(wing.shoulder[0], wing.shoulder[1], -wing.shoulder[2] - wing.arm),
    tail: at(0, tail.root), tailL: at(0, tail.root), tailR: at(0, tail.root),
    shinR: at(kx, ky, kz), tarsusR: at(kx, heel, kz), toesR: at(kx, foot, kz), hindR: at(kx, foot, kz),
    shinL: at(kx, ky, -kz), tarsusL: at(kx, heel, -kz), toesL: at(kx, foot, -kz), hindL: at(kx, foot, -kz),
  };
  if (lidded) pivots.jaw = lidPivot(shape, body, at);

  // the joints of the front toes: a third and two-thirds of the way along each
  for (const side of [1, -1]) {
    for (const key of TOES) {
      const yaw = toeYaw(leg, key), length = (key === 'M' ? leg.toes.mid : key === 'O' ? leg.toes.side : leg.toes.side * 0.96);
      for (const [bone, share] of [['B', 1 / 3], ['C', 2 / 3]]) {
        pivots[`toe${key}${bone}${side > 0 ? 'R' : 'L'}`] = at(kx + Math.cos(yaw) * length * share, ground + leg.thick[2] * 0.62, (kz + Math.sin(yaw) * length * share) * side);
      }
    }
  }
  // (the display's bones: where its parts turn, or, for a part the bird has not, its parent's joint)
  for (const name of DISPLAY_BONES) pivots[name] = turns[name] ? at(...turns[name]) : pivots[DISPLAY_PARENT[name]].clone();

  const geometry = skin.geometry();
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.05, 0), wing.span * MM * 0.75);
  return { geometry, pivots, marks, origin, triangles: skin.index.length / 3 };
}
