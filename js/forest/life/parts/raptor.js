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

export const CERE_U = 0.3;                                   // the share of the bill's cell, from its base, that is the cere's paint
export const TALON_CELL = [0.893, 0.574, 0.927, 0.602];     // where talons are painted: a corner under the mouth's cell
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
