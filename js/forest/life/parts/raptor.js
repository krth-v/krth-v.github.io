import * as THREE from 'three';
import { curve } from '../skin.js';

// What a raptor's body has that a songbird's has not (the raptors', 2026-11-16): a hooked bill with a cere at its
// base, and talons. Each is opt-in by a field of the sheet (life/bodies.js), and life/bird.js calls into this file
// only behind that field, so a bird that does not ask is built vertex for vertex as it was. Lengths are millimetres
// in the level pose, as everywhere in the bird builder (+x towards the bill, +y up, +z the bird's right).
//
//   shape.bill.hook: { drop, from }
//       The upper mandible ends in a hook. Its cutting edge runs on level from the gape and, from `from` of the way
//       along the culmen (a share, from the cere's front edge, or from the base with no cere), curls down on an arc
//       so that its tip hangs `drop` mm below the gape line (the cutting edge's line at the base, drawn on level).
//       How far the arc turns is worked out so that the culmen is as long as the sheet says. The lower mandible is
//       shorter and ends under the hook.
//   shape.bill.cere: { long }
//       The bill's base is a cere, `long` mm from where the feathers end to its front edge, where the horn begins.
//       The published culmen is then the one measured from the cere (Friedmann's "culmen from cere" for the hawks
//       and eagles), and the mark it is measured from (`marks.culmenBase`) is on the cere's front edge. A bill with
//       a cere and no hook curls down only as the sheet's own `drop` has it.
//       Its paint is the first CERE_U of the bill's cell (life/parts/raptorPaint.js lays `plumage.bill.cere` there).
//   shape.leg.talons: { claw, curve }
//       Every claw is a talon: `claw` mm deep where it leaves its toe (deeper than wide, as a talon is), and it
//       turns down through `curve` radians to a point that comes down to the toe's own sole: it leaves the toe
//       rising, as a raptor's does on flat ground. How long each is stays the toes' own `claw` (the front ones) and
//       `hindClaw` (the hind toe's), taken as chords, as claws are measured. Talons are painted in a cell of their
//       own (TALON_CELL, a corner of the sheet nothing else uses), in `plumage.claw`.
//
// What a raptor's bill and talons look like is from no measured drawing: the hook's drop, where it begins and how
// deep a talon is are each sheet's own numbers, and the sheets say where they come from.
//
// What an eagle has besides (the eagle's, 2026-11-18; each again only for a sheet that asks, built last of all by
// `buildRaptorParts`, so that the three hawks, which ask for none of it, are vertex for vertex what they were):
//   shape.leg.trousers: { long, girth, from, bag, lappets, drape, hang }
//       The long feathers of the shin, which hang round the heel and over the top of the bare tarsus. A sleeve
//       round each shin, clear of it from `from` of the way down (0.3), `girth` mm in radius at the heel (swelling by `bag`,
//       1.1, on the way), and on below the heel as a cuff round the tarsus, `long` mm of it at the most, ending in
//       `lappets` pointed feathers (7), longest behind. The sleeve is the shin's and the cuff mostly the tarsus's (a share `hang`, 0.35, the shin's still; the
//       ring at the heel goes a share `drape`, 0.5, with the tarsus), so that however the leg is bent the bare
//       tarsus comes out of feathers. Their paint is the shin's cell.
//   shape.eye.ridge: { long, out, high, ahead, thick }
//       The brow: a shelf of bone and feather over each eye, `long` mm from end to end with `ahead` of that (0.45)
//       before the eye's middle, its lip `out` mm further out than the head's side is at the eye's height, `high`
//       eye-radii (1.05) above the eye's middle and `thick` mm deep (2.6). Its top takes the crown's paint; its
//       under side is painted in SHADE_CELL (life/parts/raptorPaint.js lays `plumage.face.shade` there), so the
//       eye sits in shadow under it whatever the light.
//   shape.prey: { long, deep, wide }
//       A fish, of those sizes in mm, for the bird to carry and to stand on: part of the bird's own mesh, on a bone
//       of its own (PREY: one of the grouse's display bones, which a bird with no ruff never moves), built round
//       the hips' joint and drawn in to nothing there unless a pose shows it (`prey`, below). Painted in FISH_CELL
//       (`plumage.prey`). The furthest level, which has no legs to hold it by, has none.
//
// And what a pose may say besides (life/rig.js calls `raptorPose` at the end of its own, for a sheet with talons;
// every field has a default that leaves the pose as the rig made it, and none is kept from one pose to the next):
//   wrist      the hand swept back at the wrist (radians), over the rig's own `sweep` of the whole wing: with the
//              arm swept forward, a wing half shut (a stoop, a mantle over prey)
//   twist      the whole wing turned about its own span, its leading edge up (radians): a wing braking
//   feet: { mode: 'reach', ahead, down, width, stagger, open, round, tilt, hold }
//              each foot at a place given in the body's own frame, wherever the body is: `ahead` (towards the bill,
//              along the body's axis) and `down` (towards the belly's side) of the hip, in shares of the straight
//              leg; `width` m to either side (the hips' own, 0.9 of it, if not given); `stagger`: the right foot
//              that much further ahead and the left behind (shares of the leg). The toes are square to the tarsus,
//              the sole facing on along it, turned by `tilt` radians (+: the front toes towards the shin): `open` 1
//              spread wide, the hind toe back and the talons out (to take a fish), 0 a fist (a foot trailed under
//              the tail); or closed round a thing `round` m in radius (a fish carried). `hold`: the pitch of what
//              is carried, radians from the body's axis (-0.12: its head a little down).
//   prey       0 the fish drawn in to nothing .. 1 whole. With feet that reach it is held under them, its head the
//              way the bird's is; with feet that stand ('flat', 'grip') it lies on its side on what the bird
//              stands on, under the right foot, which stands on it, turned out by `preyYaw` radians (0.35) and
//              laid over on its side by `preyRoll` (1.05: flat on its side it was a line seen from beside it).

export const CERE_U = 0.3;                                   // the share of the bill's cell, from its base, that is the cere's paint
export const TALON_CELL = [0.893, 0.574, 0.927, 0.602];     // where talons are painted: a corner under the mouth's cell
export const SHADE_CELL = [0.945, 0.588, 0.995, 0.610];     // the brow's under side: under the eye's cell, where nothing else is painted
export const FISH_CELL = [0.515, 0.6838, 0.995, 0.6952];    // the fish: a strip between the legs' cells and the tail's, its snout at the right
export const FIN_U = 0.16;                                   // the share of the fish's cell, from its left, that is the tail fin's paint
export const PREY = 'ruffL';                                 // the bone the fish hangs on
const inCell = (cell, u, v) => [cell[0] + (cell[2] - cell[0]) * u, 1 - (cell[1] + (cell[3] - cell[1]) * v)];

// The hooked bill. `c` is what life/bird.js has where it builds the bill: { skin, body (the outline), level, bill
// (shape.bill), put, B (bones by name), CELLS, marks }.
export function hookedBill({ skin, body, level, bill, put, B, CELLS, marks }) {
  const x0 = body.front, yTop = body.top(x0), yLow = body.bottom(x0), depth = yTop - yLow, width = body.half(x0) * 2;
  const edge = yTop - depth * 0.56;                          // the gape line: the cutting edge at the base, as the common bill has it
  const cere = bill.cere ? bill.cere.long : 0;
  const hook = bill.hook || { drop: Math.max(0.3, bill.drop * bill.culmen), from: 0.7 };
  const from = Math.min(0.92, Math.max(0.05, hook.from ?? 0.5)), drop = Math.max(0.2, hook.drop);
  const h0 = depth * 0.56, w0 = width * 0.5, l0 = depth * 0.44;
  // How deep the upper mandible stands over its cutting edge, and how wide it is, a share t of the way along: deep
  // until the hook (the ridge falling a little all the way), and drawn in sideways sooner, since a raptor's bill is narrower than it is deep. The cere swells
  // a little over the base.
  const high = (t, tc) => h0 * (1 - 0.22 * t) * Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 0.55) * (t < tc ? 1 + 0.06 * Math.sin(Math.PI * t / tc) : 1);
  const half = (t, tc) => w0 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.6)), 0.62) * (t < tc ? 1 + 0.08 * Math.sin(Math.PI * t / tc) : 1);
  // The cutting edge: level from the gape for `a` mm, then an arc of radius R through `turn`, which hangs its tip
  // `drop` below the gape line. For a turn, everything else follows; the turn is the one that makes the culmen, from
  // the cere's front edge on top of the bill to the tip, as long as the sheet says.
  const lay = (turn) => {
    const R = drop / (1 - Math.cos(turn)), b = R * turn, a = cere + (from / (1 - from)) * b, S = a + b, tc = cere / S;
    const chord = Math.hypot(a - cere + R * Math.sin(turn), high(tc, tc) + drop);
    return { R, a, b, S, tc, turn, chord };
  };
  let lo = 0.08, hi = 2.9;
  for (let k = 0; k < 48; k += 1) { const mid = (lo + hi) / 2; if (lay(mid).chord > bill.culmen) lo = mid; else hi = mid; }
  const L = lay((lo + hi) / 2);
  // where the cutting edge is, s mm along it, and which way is along it and which way is up from it there
  const at = (s, out) => {
    if (s <= L.a) { out.x = x0 + s; out.y = edge; out.tx = 1; out.ty = 0; }
    else { const th = (s - L.a) / L.R; out.x = x0 + L.a + L.R * Math.sin(th); out.y = edge - L.R * (1 - Math.cos(th)); out.tx = Math.cos(th); out.ty = -Math.sin(th); }
    out.nx = -out.ty; out.ny = out.tx;
    return out;
  };
  const here = { x: 0, y: 0, tx: 1, ty: 0, nx: 0, ny: 1 };
  const nu = [8, 4, 2][level], rows = [12, 6, 3][level], lowRows = [8, 4, 2][level];
  // rows over the cere, then over the horn, closer together towards the hook
  const jc = cere ? Math.max(1, Math.round(rows * 0.22)) : 0;
  const sOf = (j) => (j <= jc && jc ? (j / jc) * cere : cere + (L.S - cere) * (1 - Math.pow(1 - (j - jc) / (rows - jc), 1.35)));
  const uOf = (s) => (cere ? (s <= cere ? CERE_U * (s / cere) : CERE_U + (1 - CERE_U) * (s - cere) / (L.S - cere)) : s / L.S);
  // the lower mandible: along the same edge, to a little way into the hook, blunt at its end
  const lowEnd = L.a + L.b * 0.22;
  const deepLow = (t) => l0 * 0.85 * Math.pow(Math.max(0, 1 - Math.pow(t, 1.8)), 0.6);
  for (const upper of [true, false]) {
    const n = upper ? rows : lowRows;
    const base = skin.sheet(nu, n, (i, j, out) => {
      const s = upper ? sOf(j) : lowEnd * (j / n), t = upper ? s / L.S : s / lowEnd, th = (i / nu) * Math.PI;
      at(s, here);
      const end = !upper && j === n ? 0.4 : 1;
      const h = upper ? Math.max(high(t, L.tc), j === n ? h0 * 0.04 : 0) : Math.max(deepLow(t), l0 * 0.12) * end;
      const w = (upper ? Math.max(half(t, L.tc), j === n ? w0 * 0.05 : 0) : half(t * (lowEnd / L.S), L.tc) * 0.96 * end);
      const up = (upper ? 1 : -1) * Math.sin(th) * h;
      put(out, here.x + here.nx * up, here.y + here.ny * up, -Math.cos(th) * w * (upper ? 1 : -1));
      [out.u, out.v] = inCell(CELLS.bill, 0.04 + 0.92 * (upper ? uOf(s) : t), upper ? 0.05 + 0.4 * (i / nu) : 0.55 + 0.4 * (i / nu));
      out.b0 = upper ? B.head : B.jaw;
    });
    if (upper) { marks.culmenBase = [base + jc * (nu + 1) + Math.round(nu / 2)]; marks.billTip = [base + n * (nu + 1) + Math.round(nu / 2)]; }
    if (level === 0) {
      // the inside of the mouth, seen when the bill opens: a strip from one cutting edge to the other
      skin.sheet(1, n, (i, j, out) => {
        const s = upper ? sOf(j) : lowEnd * (j / n), t = upper ? s / L.S : s / lowEnd;
        at(s, here);
        const w = upper ? half(t, L.tc) : half(t * (lowEnd / L.S), L.tc) * 0.96 * (j === n ? 0.4 : 1);
        put(out, here.x, here.y, (i ? -1 : 1) * w * (upper ? 1 : -1));
        [out.u, out.v] = inCell(CELLS.mouth, 0.5, 0.5);
        out.b0 = upper ? B.head : B.jaw;
      });
    }
  }
  return L;
}

// A talon, in place of a claw: from the end of a toe (`from`, the toe's middle line there, mm in the level pose of the
// bird's right side), the way the toe points (`dir`, [x, z]), as long as `length` (a chord), on a toe of radius `r`
// (its first joint's: its point comes down to that joint's sole, which is the ground the foot stands on).
// `c` is { skin, put, sides } from life/bird.js; `side` is +1 for the right foot and -1 for the left (mirrored).
export function talon({ skin, put, sides }, side, bone, from, dir, length, r, T) {
  const turn = Math.max(0.05, T.curve), rows = 6;
  const ry = Math.min(T.claw / 2, r * 0.95), rz = ry * 0.72;
  const arc = length * (turn / 2) / Math.sin(turn / 2);      // the claw is measured along its chord; it is built along its arc
  // It leaves the toe rising by `rise` (radians) and turns down through `turn`, its point coming to the toe's sole.
  const sole = -r * 0.92, dropOf = (rise) => (arc / turn) * (Math.cos(rise - turn) - Math.cos(rise));
  let lo = turn / 2 - Math.PI / 2 + 0.01, hi = turn / 2 + Math.PI / 2 - 0.01;
  for (let k = 0; k < 40; k += 1) { const mid = (lo + hi) / 2; if (dropOf(mid) < sole) lo = mid; else hi = mid; }
  const rise = (lo + hi) / 2, [dx, dz] = dir, bx = -dz, bz = dx;          // (bx, bz): across the toe, level
  return skin.sheet(sides, rows, (i, j, out) => {
    const k = j / rows, a = rise - turn * k, th = (i / sides) * Math.PI * 2, f = Math.max(0.06, Math.pow(1 - k, 0.8));
    const along = (arc / turn) * (Math.sin(rise) - Math.sin(a)), upward = (arc / turn) * (Math.cos(a) - Math.cos(rise));
    // across its section: up from the claw's line (square to it, in the toe's own upright plane) and to its side
    const nAlong = -Math.sin(a), nUp = Math.cos(a), cu = Math.cos(th) * ry * f, cs = Math.sin(th) * rz * f;
    const x = from[0] + dx * (along + nAlong * cu) + bx * cs, y = from[1] + upward + nUp * cu, z = from[2] + dz * (along + nAlong * cu) + bz * cs;
    put(out, x, y, z * side);
    [out.u, out.v] = inCell(TALON_CELL, 0.5, 0.3 + 0.4 * k);
    out.b0 = bone;
  }, { wrap: true, flip: side < 0 });
}

// ---- the eagle's parts (see the head of this file). `c` is what life/bird.js has when everything else is built:
// { skin, shape, level, body (the outline), put, inCell (its own: an owl's sheet is squeezed), B, CELLS, SKIN_EDGE,
// sides (of a leg's tube at this level; 0: no legs), knee: [x, y, z], heel (its height, mm) }.
export function buildRaptorParts(c) {
  const { shape } = c;
  if (shape.leg.trousers && c.sides) trousers(c, shape.leg.trousers);
  if (shape.eye.ridge && c.level < 2) ridge(c, shape.eye.ridge);
  if (shape.prey && c.level < 2) fish(c, shape.prey);          // (the furthest level has no legs to hold it by: none)
}

function trousers({ skin, put, inCell: cellAt, B, CELLS, sides, knee: [kx, ky, kz], heel, shape }, T) {
  const leg = shape.leg, from = T.from ?? 0.3, lappets = sides >= 6 ? (T.lappets ?? 7) : 3, n = lappets * 2;
  const top = ky - leg.shin * from, rTop = leg.thick[0] + (leg.thick[1] - leg.thick[0]) * from + 2, bag = T.bag ?? 1.1;
  // six rings: at the knee, inside the body (a sleeve that began part-way down the shin had an edge there, which
  // stood out of the flank when the leg was drawn up); where it comes clear of the shin; its fullest; the heel; half
  // way down the cuff; and the hem (a point and a notch by turns). Down to the heel it is the shin's; below, it
  // lies round the top of the tarsus and goes with it, so that however the leg is bent the bare tarsus comes out
  // of feathers.
  const rings = [[ky, leg.thick[0] * 0.86, 0.02], [top, Math.max(rTop, T.girth * bag * 0.96), 0.04 + 0.5 * from], [top + (heel - top) * 0.6, T.girth * bag, 0.54], [heel + 3, T.girth, 0.7], [heel - T.long * 0.5, T.girth * 0.93, 0.84], [heel - T.long, T.girth * 0.8, 0.96]];
  const last = rings.length - 1;
  for (const side of [1, -1]) {
    const name = side > 0 ? 'R' : 'L';
    skin.sheet(n, last, (i, j, out) => {
      const th = (i / n) * Math.PI * 2, behind = 0.5 - 0.5 * Math.cos(th), [y, r, v] = rings[j], hem = j === last;
      // the hem hangs furthest behind the leg, and its points further than the notches between them
      const lift = hem ? T.long * (1 - (0.66 + 0.34 * behind) * (i % 2 ? 0.55 : 1)) : 0;
      put(out, kx + Math.cos(th) * r - (j >= 2 ? behind * T.girth * 0.14 * (hem ? 0.5 : 1) : 0), y + lift, (kz + Math.sin(th) * r) * side);
      [out.u, out.v] = cellAt(CELLS.shin, i / n, hem && i % 2 ? v - 0.05 : v);
      out.b0 = B[j >= last - 1 ? `tarsus${name}` : `shin${name}`];
      if (j === last - 2) { out.b1 = B[`tarsus${name}`]; out.w1 = T.drape ?? 0.5; } else if (j >= last - 1) { out.b1 = B[`shin${name}`]; out.w1 = T.hang ?? 0.35; }                    // (the cuff hangs a little as the shin does: wholly the tarsus's, its front lay face down on a foot set forward, in shade)
    }, { wrap: true, flip: side < 0 });
  }
}

function ridge({ skin, body, shape, level, put, inCell: cellAt, B, CELLS, SKIN_EDGE }, R) {
  const e = shape.eye, long = R.long, x0 = e.x - long * (1 - (R.ahead ?? 0.45)), cols = level === 0 ? 8 : 3;
  const span = body.front - body.rear, thick = R.thick ?? 2.6;
  const skinAt = (x, a, side) => cellAt(CELLS.skin, 1 - (x - body.rear) / span, SKIN_EDGE + (side > 0 ? 1 - a / 2 : a / 2) * (1 - 2 * SKIN_EDGE));
  const swell = (t) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), 0.5);        // nothing at its ends
  // how high the lip is (never above the head itself, where the forehead falls to the bill), and how far out: as far
  // as the head's side at the eye's height and `out` more; at its ends it lies on the head
  const lipAt = (x) => Math.min(e.y + e.r * (R.high ?? 1.05), body.top(x) - 3);
  const lip = (x, t) => { const on = body.out(x, lipAt(x)), f = swell(t); return on + (body.out(x, Math.min(e.y, body.top(x) - 6)) + R.out - on) * f; };
  for (const side of [1, -1]) {
    // its top, from the crown out to the lip, in the crown's own paint
    skin.sheet(cols, 2, (i, j, out) => {
      const t = i / cols, x = x0 + long * t, lipY = lipAt(x), rootY = Math.min(body.top(x) - 0.5, lipY + e.r * (1.1 + 0.5 * swell(t)));
      const y = j === 0 ? rootY : j === 1 ? (rootY + lipY) / 2 + thick * 0.35 * swell(t) : lipY;
      const z = j === 0 ? body.out(x, rootY) - 0.4 : j === 1 ? (body.out(x, rootY) + lip(x, t)) / 2 + 0.5 * swell(t) : lip(x, t);
      put(out, x, y, z * side);
      [out.u, out.v] = skinAt(x, body.around(x, rootY), side);
      out.b0 = B.head;
    }, { flip: side > 0 });
    // its under side, from the lip in to the head just over the eye, in shadow
    skin.sheet(cols, 1, (i, j, out) => {
      const t = i / cols, x = x0 + long * t, f = swell(t), lipY = lipAt(x), inY = lipY - thick * f - e.r * 0.25 * f;
      put(out, x, j === 0 ? lipY : inY, (j === 0 ? lip(x, t) : body.out(x, inY) - 0.6) * side);
      [out.u, out.v] = cellAt(SHADE_CELL, 0.2 + 0.6 * t, 0.3 + 0.4 * j);
      out.b0 = B.head;
    }, { flip: side > 0 });
  }
}

// how deep and how wide the fish is along its body, from where the tail fin is rooted (0) to the snout (1)
const FISH_DEEP = curve([[0, 0.2], [0.1, 0.3], [0.32, 0.78], [0.56, 1], [0.76, 0.9], [0.9, 0.6], [0.97, 0.3], [1, 0.05]]);
function fish({ skin, put, inCell: cellAt, B, level, knee: [kx, ky] }, F) {
  const sides = [10, 6, 3][level], rows = [10, 5, 2][level], bone = B[PREY];
  const fin = F.long * 0.17, bodyLong = F.long - fin, tail = kx - F.long / 2 + fin;                    // x where the tail fin is rooted
  skin.sheet(sides, rows, (i, j, out) => {
    const s = j / rows, th = (i / sides) * Math.PI * 2, f = FISH_DEEP(s), up = Math.cos(th);
    // its back is narrower than its belly, which hangs a little deeper
    put(out, tail + bodyLong * s, ky + up * (F.deep / 2) * f * (up < 0 ? 1.12 : 0.9), Math.sin(th) * (F.wide / 2) * Math.pow(f, 0.8) * (1 - 0.2 * up));
    [out.u, out.v] = cellAt(FISH_CELL, FIN_U + (1 - FIN_U) * (0.02 + 0.96 * s), 0.08 + 0.84 * (0.5 - 0.5 * up));
    out.b0 = bone;
  }, { wrap: true, flip: true });
  // the tail fin, forked, and the fin on its back: flat, seen from both sides
  const flat = (points, cols, rowsOf, uv) => {
    for (const turned of [false, true]) {
      skin.sheet(cols, rowsOf, (i, j, out) => {
        const [x, y] = points(i / cols, j / rowsOf);
        put(out, x, y, turned ? -0.15 : 0.15);
        [out.u, out.v] = cellAt(FISH_CELL, ...uv(i / cols, j / rowsOf));
        out.b0 = bone;
      }, { flip: turned });
    }
  };
  const high = F.deep * 0.55;
  flat((a, b) => [tail + fin * 0.25 - fin * 1.25 * b * (1 - 0.42 * Math.sin(Math.PI * a)), ky + (a - 0.5) * 2 * (F.deep * 0.2 + (high - F.deep * 0.2) * b)], level === 2 ? 2 : 4, 1,
    (a, b) => [FIN_U * (0.92 - 0.84 * b), 0.1 + 0.8 * a]);
  if (level === 0) {
    flat((a, b) => [tail + bodyLong * (0.4 + 0.2 * a) - bodyLong * 0.05 * b, ky + (F.deep / 2) * 0.86 * FISH_DEEP(0.4 + 0.2 * a) + b * F.deep * 0.3 * (0.35 + 0.65 * a)], 2, 1,
      (a, b) => [FIN_U * (0.3 + 0.4 * a), 0.2 + 0.5 * b]);
  }
}

// ---- the eagle's poses (see the head of this file). `kind` is life/rig.js's (its lengths in metres), `by` the
// bones by name, `P` the pose. Called after the rig has posed everything, for a sheet with talons.
const _b = new THREE.Quaternion(), _bi = new THREE.Quaternion(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _shin = new THREE.Quaternion(), _tarsus = new THREE.Quaternion();
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
const _knee = new THREE.Vector3(), _foot = new THREE.Vector3(), _heel = new THREE.Vector3(), _dir = new THREE.Vector3(), _bend = new THREE.Vector3(), _seg = new THREE.Vector3();
const _front = new THREE.Vector3(), _back = new THREE.Vector3(), _mid = new THREE.Vector3(), _sole = new THREE.Vector3();
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const TINY = 0.001;
// (life/rig.js's own: the turn that carries a bone's bind direction, straight down, onto `dir`, its front as near `ahead` as it can be)
function aimDown(dir, ahead, out) {
  _y.copy(dir).negate();
  _x.copy(ahead).addScaledVector(_y, -ahead.dot(_y));
  if (_x.lengthSq() < 1e-8) _x.set(0, 0, 1).cross(_y);
  _x.normalize();
  _z.crossVectors(_x, _y);
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}

export function raptorPose(kind, by, P) {
  const shape = kind.sheet.shape, feet = P.feet || {}, mode = feet.mode || 'flat';
  // ---- the wings' two more turns, over the rig's own
  if (P.twist || P.wrist) {
    for (const side of [1, -1]) {
      const name = side > 0 ? 'R' : 'L';
      if (P.twist) by[`arm${name}`].quaternion.multiply(_q.setFromAxisAngle(AZ, P.twist));
      if (P.wrist) by[`hand${name}`].quaternion.premultiply(_q.setFromAxisAngle(AY, -side * P.wrist));
    }
  }
  const prey = shape.prey ? Math.min(1, Math.max(0, P.prey ?? 0)) : 0;
  const reach = mode === 'reach', pin = prey > 0 && !reach && mode !== 'tuck';
  if (!reach && !shape.prey) return;
  _b.copy(by.body.quaternion); _bi.copy(_b).invert();
  // (underfoot the fish lies over on its side, by `preyRoll` radians from upright, 1.05: flat on its side it was a
  // line to anyone looking from beside it. `lie`: how high it then stands, m)
  const L1 = kind.shin, L2 = kind.tarsus, L = L1 + L2, roll = P.preyRoll ?? 1.05;
  const lie = shape.prey ? 0.001 * (shape.prey.deep * Math.abs(Math.cos(roll)) + shape.prey.wide * Math.sin(roll)) : 0;
  const width = feet.width ?? kind.knee * 0.9, toeOut = feet.toeOut ?? 0.12;
  _mid.set(0, 0, 0); _sole.set(0, 0, 0);
  if (reach || pin) {
    _front.set(1, 0, 0).applyQuaternion(_b);
    _back.set(-1, -0.25, 0).applyQuaternion(_b).normalize();
    // round a thing, every joint of a toe is a chord of the circle the toe lies on (life/rig.js)
    const round = (reach ? feet.round : lie * 0.45) ?? null;
    const bend = (length, yaw = 0) => (round == null ? 0 : 2 * Math.asin(Math.min(1, (length * Math.cos(yaw) ** 2) / (2 * (round + kind.toeThick)))));
    const open = Math.min(1, Math.max(0, feet.open ?? 1)), tilt = feet.tilt ?? 0;
    for (const side of [1, -1]) {
      if (pin && side < 0) continue;                           // the left foot stands where the rig put it
      const name = side > 0 ? 'R' : 'L';
      _knee.set(0, 0, side * kind.knee).applyQuaternion(_b).add(by.body.position);
      if (reach) _foot.set(((feet.ahead ?? 0) + side * (feet.stagger ?? 0)) * L, -(feet.down ?? 0.8) * L, side * (width - kind.knee)).applyQuaternion(_b).add(_knee);
      else _foot.set((feet.ahead ?? 0) + lie * 0.6, kind.pad + lie * 0.9, side * width);                 // on the fish
      _dir.subVectors(_foot, _knee);
      const far = Math.min(Math.max(_dir.length(), Math.abs(L1 - L2) + 1e-5), L * 0.999);
      _dir.normalize();
      const along = (L1 * L1 - L2 * L2 + far * far) / (2 * far);
      _bend.copy(_back).addScaledVector(_dir, -_back.dot(_dir));
      if (_bend.lengthSq() < 1e-8) _bend.set(0, -1, 0).applyQuaternion(_b);
      _bend.normalize();
      _heel.copy(_knee).addScaledVector(_dir, along).addScaledVector(_bend, Math.sqrt(Math.max(L1 * L1 - along * along, 0)));
      aimDown(_seg.subVectors(_heel, _knee).normalize(), _front, _shin);
      by[`shin${name}`].quaternion.copy(_bi).multiply(_shin);
      _foot.copy(_knee).addScaledVector(_dir, far);
      aimDown(_seg.subVectors(_foot, _heel).normalize(), _front, _tarsus);
      by[`tarsus${name}`].quaternion.copy(_shin).invert().multiply(_tarsus);
      _mid.addScaledVector(_foot, reach ? 0.5 : 1); _sole.addScaledVector(_seg, reach ? 0.5 : 1);
      const toes = by[`toes${name}`], hind = by[`hind${name}`];
      let curl;
      if (reach) {
        // square to the tarsus: closed round what it holds, or from a fist to a hand spread wide
        const front = round != null ? -bend(kind.toes[0].joint) / 2 : -1 + 1.22 * open, back = round != null ? bend(kind.hindToe) / 2 : 1 - 1.3 * open;
        toes.quaternion.setFromAxisAngle(AY, -side * toeOut).multiply(_q.setFromAxisAngle(AZ, front + tilt));
        hind.quaternion.setFromAxisAngle(AY, -side * toeOut).multiply(_q.setFromAxisAngle(AZ, back + tilt));
        curl = (toe) => (round != null ? bend(toe.joint, toe.yaw) : 0.5 - 0.4 * open);
      } else {
        // as the rig lays a gripping foot: the way the bird faces, closed over the fish
        _q2.copy(_tarsus).invert();
        toes.quaternion.copy(_q2).multiply(_q.setFromAxisAngle(AY, -side * toeOut).multiply(_q3.setFromAxisAngle(AZ, -bend(kind.toes[0].joint) / 2)));
        hind.quaternion.copy(_q2).multiply(_q.setFromAxisAngle(AY, -side * toeOut).multiply(_q3.setFromAxisAngle(AZ, bend(kind.hindToe) / 2)));
        curl = (toe) => bend(toe.joint, toe.yaw);
      }
      for (const toe of kind.toes) {
        _seg.set(Math.sin(toe.yaw) * side, 0, -Math.cos(toe.yaw));
        _q.setFromAxisAngle(_seg, curl(toe));
        by[`toe${toe.key}B${name}`].quaternion.copy(_q);
        by[`toe${toe.key}C${name}`].quaternion.copy(_q);
      }
    }
  }
  // ---- the fish
  if (!shape.prey) return;
  const bone = by[PREY];
  if (!(prey > 0)) { bone.scale.setScalar(TINY); bone.position.set(0, 0, 0); bone.quaternion.identity(); return; }
  bone.scale.setScalar(Math.max(TINY, prey));
  if (reach) {
    // under the feet, held from above across its back, its head the way the bird's is and a little down
    _sole.normalize();
    _mid.addScaledVector(_sole, kind.toeThick * 1.6 + shape.prey.deep * 0.001 * 0.3);
    bone.quaternion.setFromAxisAngle(AZ, feet.hold ?? -0.12);
  } else {
    // on its side on what the bird stands on, under the right foot
    _mid.set((feet.ahead ?? 0) + lie * 1.1, lie * 0.47, width);
    bone.quaternion.copy(_bi).multiply(_q.setFromAxisAngle(AY, -(P.preyYaw ?? 0.35))).multiply(_q2.setFromAxisAngle(AX, roll));
  }
  bone.position.copy(_mid).sub(by.body.position).applyQuaternion(_bi);
}
