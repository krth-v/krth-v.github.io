import * as THREE from 'three';
import { Mesh, sheetCell } from './build.js';
import { mulberry32 } from '../world/layout.js';
import { VIEW } from '../world/land.js';
import { face, pole, stone } from './carpentry.js';

// The cabin, from outside: the room the site opens in (js/room.js, assets/cabin.glb), as a walker sees it at
// the start of the walk and the end of it. It is built from the room's own numbers, so that the outside is the
// outside of that room:
//   - the room is 11 units wide by 9 deep and 6.4 high, its window wall at the north; one unit is taken as
//     0.377 m, which makes the desk's top 0.78 m and the seated eye 1.17 m off the floor;
//   - its window is a square 1.03 m across in a plain frame, with no bars and no sill (the model has a
//     WindowJamb and a WindowFrame of four boxes, and nothing else), 2.74 units west of the room's middle and
//     4.11 up: the same opening here, in the same place;
//   - its ceiling beams run east and west, so the ridge runs north and south, and the wall towards the valley
//     is a gable end;
//   - its hearth is on the west wall, towards the south: a stone chimney stands outside it there.
// What the room does not say is the agent's drawing: walls of squared timbers, hewn, chinked and lapped at the
// corners (the room's own walls are lined with planks, and 7 cm thick: these are 26 cm); the door (in the
// window's wall, east of the window: the desk is in the room's north-west corner, the seat looks west, and that
// stretch of the wall is behind the seat's right shoulder; the model has no door anywhere), a small roof over
// it, the pitch of the roof (36 degrees), the footing, and every size that is not the room's.
//
// The roof stands 0.2 m out over the window's wall, where it stands 0.35 m out over the back one. From the seat
// the window is 0.72 m off and is looked up through steeply, so a deep overhang would hang in the top of the
// picture the seat has through it. `clearance` below says how far out of that picture a point of the cabin is.
// The small roof over the door is east of everything the seat can see. (The box that stood in for the cabin had
// its eave 0.4 m in front of the window's vantage: it filled the top of every frame that looked up from there.)
//
// It is built in its own frame: x east, z south, y up from the height its record has. `site.ground(x, z)` is
// the ground's height there above that, and `site.floor` the floor's: the floor is where the box that stood in
// for the cabin had it, so that the window is where it was (world/structures.js: places.window).
// It comes as three kinds, for its three materials: `wood` (the timbers, the door and the frames: the bark's
// material with BARE), `roof` (split shakes and what carries them, and the moss and fern on them) and `stone`
// (the chimney, the footing and the step: the rock's material). Two levels each: every timber, shake and stone
// to 34 m, slabs beyond.
export const UNIT = 0.377;
const W = 5.5 * UNIT, D = 4.5 * UNIT, T = 0.26;          // the room's half-width and half-depth, and a wall's thickness
const HX = W + T, HZ = D + T;                             // the outside's half-width and half-depth
export const WINDOW = { x: -2.74 * UNIT, y: 4.11 * UNIT, half: 1.36 * UNIT, inset: 0.12 };       // its middle, in the cabin's frame (y above the floor); the pane stands `inset` behind the wall's face
// where the cabin's middle is in the world: its window on the valley's axis, the wall's face 0.15 m behind the window's vantage
export const SITE = { x: VIEW.x - WINDOW.x, z: VIEW.z + 0.15 + HZ, half: [HX, HZ] };
const DOOR = { x0: 0.75, x1: 1.65 };
const COURSE = (2 * WINDOW.half) / 3;                     // three courses of timber to the window's height
const FOOT = WINDOW.y - WINDOW.half - 3 * COURSE;         // the lowest timber's underside, above the floor (a centimetre)
const COURSES = 8, PLATE = FOOT + COURSES * COURSE;       // the top of the walls
const HEAD = WINDOW.y + WINDOW.half;                      // the window's head, and the door's
const PITCH = Math.tan(36 * Math.PI / 180), COS = 1 / Math.hypot(1, PITCH), SIN = PITCH * COS;
const EAVE = 0.45, RAKE_N = 0.2, RAKE_S = 0.35;           // how far the roof stands out: over the side walls, over the window's wall, over the back
const LIFT = 0.07;                                        // the shakes' plane above the top of the walls, at the wall's line
const HEARTH = { z: (4.125 - 2.3) * UNIT, half: 0.73, deep: 0.62, neck: 0.4, slim: 0.5 };       // the chimney: its middle along the west wall, and its sizes below the shoulder and above it
const EXPOSED = 0.28, SKIN = 0.04;
const NEAR = 34;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0), DOWN = V(0, -1, 0);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const roofY = (x) => PLATE + LIFT + (HX - Math.abs(x)) * PITCH;        // the shakes' plane, above the floor
export const CABIN = { ridge: roofY(0), heart: [0, 3.2, 0], top: roofY(0) + 0.6 };

// The seat inside (js/main.js: the seated eye) and the window's opening as the room has it, in this frame.
const EYE = V((-1.67) * UNIT, 3.1 * UNIT, (-0.28 - 2.3) * UNIT);
const APERTURE = { z: -D, x0: -4.1 * UNIT, x1: -1.38 * UNIT, y0: 2.75 * UNIT, y1: 5.47 * UNIT };
// How far outside the window's opening the line from the seat to a point passes, in metres at the opening
// (below zero: the point is in the picture the seat has through the window). y is above the floor. The opening
// is a tunnel through the wall: the line has to clear it at the wall's inner face and, for a point beyond the
// wall, at its outer face too. A point that is not beyond the wall's inner face is in no such picture.
// `thick: false` leaves the outer face out: the widest picture there could be, through a wall of no thickness.
export function clearance(p, thick = true) {
  if (p.z >= APERTURE.z) return Infinity;
  let worst = -Infinity;
  for (const z of thick ? [APERTURE.z, -HZ] : [APERTURE.z]) {
    if (p.z >= z) continue;
    const f = (z - EYE.z) / (p.z - EYE.z), x = EYE.x + (p.x - EYE.x) * f, y = EYE.y + (p.y - EYE.y) * f;
    worst = Math.max(worst, APERTURE.x0 - x, x - APERTURE.x1, APERTURE.y0 - y, y - APERTURE.y1);
  }
  return worst;
}

// One flat face of stone, for the rock's material: uv is [how much of the sky reaches it, how much litter lies
// over it], the wind's two numbers [how wet, how bare]. Wound to face `facing`. `sky` may be a number or a
// function of a corner, and `bare` a function of a corner.
const A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();
function rockFace(mesh, corners, facing, sky, litter = 0, bare = null) {
  N.crossVectors(A.subVectors(corners[1], corners[0]), B.subVectors(corners[3], corners[0]));
  const flip = N.dot(facing) < 0;
  if (flip) N.negate();
  N.normalize();
  const base = mesh.vertexCount;
  for (const p of corners) { mesh.position.push(p.x, p.y, p.z); mesh.root.push(p.x, p.y, p.z); mesh.normal.push(N.x, N.y, N.z); mesh.uv.push(typeof sky === 'function' ? sky(p) : sky, litter); mesh.wind.push(0, bare ? bare(p) : 0); }
  if (flip) mesh.index.push(base, base + 2, base + 1, base, base + 3, base + 2); else mesh.index.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

export function buildCabin(sheets, site) {
  const r = mulberry32(1887), G = site.ground, F = site.floor;        // every height below is above the floor: `Y` lifts it into the frame
  const Y = (y) => F + y;

  // ---- the four walls. A wall runs along x (the north and south ones) or along z, at `at`, and looks `out`.
  const walls = [
    { name: 'north', along: 'x', at: -HZ, out: V(0, 0, -1), from: -HX, to: HX, laps: 0, gable: true,
      holes: [{ t0: WINDOW.x - WINDOW.half, t1: WINDOW.x + WINDOW.half, y0: WINDOW.y - WINDOW.half, y1: HEAD }, { t0: DOOR.x0, t1: DOOR.x1, y0: FOOT, y1: HEAD }] },
    { name: 'south', along: 'x', at: HZ, out: V(0, 0, 1), from: -HX, to: HX, laps: 0, gable: true, holes: [] },
    { name: 'west', along: 'z', at: -HX, out: V(-1, 0, 0), from: -HZ, to: HZ, laps: 1, holes: [] },
    { name: 'east', along: 'z', at: HX, out: V(1, 0, 0), from: -HZ, to: HZ, laps: 1, holes: [] },
  ];
  // a point of a wall: `t` along it, `y` above the floor, `off` out from its plane
  const P = (wall, t, y, off = 0) => (wall.along === 'x' ? V(t, Y(y), wall.at + wall.out.z * off) : V(wall.at + wall.out.x * off, Y(y), t));
  const run = (wall) => (wall.along === 'x' ? V(1, 0, 0) : V(0, 0, 1));
  // What is left of a wall between two heights once its holes are out: [t0, t1, y0, y1] of each panel.
  const panels = (wall, ya, yb) => {
    const cuts = [wall.from, wall.to];
    for (const h of wall.holes) for (const t of [h.t0, h.t1]) if (t > wall.from && t < wall.to) cuts.push(t);
    cuts.sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i + 1 < cuts.length; i += 1) {
      const t0 = cuts[i], t1 = cuts[i + 1];
      if (t1 - t0 < 1e-6) continue;
      const gaps = wall.holes.filter((h) => h.t0 <= t0 + 1e-6 && h.t1 >= t1 - 1e-6 && h.y1 > ya && h.y0 < yb).sort((a, b) => a.y0 - b.y0);
      let y = ya;
      for (const h of gaps) { if (h.y0 > y + 1e-6) out.push([t0, t1, y, Math.min(yb, h.y0)]); y = Math.max(y, h.y1); }
      if (y < yb - 1e-6) out.push([t0, t1, y, yb]);
    }
    return out;
  };
  // the top of a gable wall under the roof, above the floor
  const gableTop = (t) => roofY(t) - 0.05;

  // ---- what both levels have: the frames of the window and the door, the door's head and threshold
  const trim = (mesh) => {
    const north = walls[0], x0 = WINDOW.x - WINDOW.half, x1 = WINDOW.x + WINDOW.half, y0 = WINDOW.y - WINDOW.half, y1 = HEAD;
    const grainX = V(1, 0, 0), wide = 0.1, proud = 0.062, back = -WINDOW.inset;
    // the window: its reveal (the wall's own thickness, seen in the opening), its casing, and its sill
    face(mesh, [P(north, x0, y0, 0.03), P(north, x0, y1, 0.03), P(north, x0, y1, back), P(north, x0, y0, back)], V(1, 0, 0), { grain: UP, shade: 0.35, offset: [0.3, 0.1] });
    face(mesh, [P(north, x1, y0, 0.03), P(north, x1, y1, 0.03), P(north, x1, y1, back), P(north, x1, y0, back)], V(-1, 0, 0), { grain: UP, shade: 0.35, offset: [0.7, 0.4] });
    face(mesh, [P(north, x0, y1, 0.03), P(north, x1, y1, 0.03), P(north, x1, y1, back), P(north, x0, y1, back)], V(0, -1, 0), { grain: grainX, shade: 0.5, offset: [1.1, 0.2] });
    face(mesh, [P(north, x0, y0, 0.03), P(north, x1, y0, 0.03), P(north, x1, y0, back), P(north, x0, y0, back)], V(0, 1, 0), { grain: grainX, shade: 0.2, offset: [1.5, 0.6] });
    const casing = (a0, a1, b0, b1, grain, offset) => face(mesh, [P(north, a0, b0, proud), P(north, a1, b0, proud), P(north, a1, b1, proud), P(north, a0, b1, proud)], north.out, { grain, shade: 0.04, offset });
    casing(x0 - wide, x0, y0 - 0.02, y1 + wide, UP, [2.1, 0.3]); casing(x1, x1 + wide, y0 - 0.02, y1 + wide, UP, [2.6, 0.8]);
    casing(x0, x1, y1, y1 + wide, grainX, [3.1, 0.2]);
    // (the casing's own edges, where it stands proud of the timbers)
    face(mesh, [P(north, x0 - wide, y1 + wide, proud), P(north, x1 + wide, y1 + wide, proud), P(north, x1 + wide, y1 + wide, 0.02), P(north, x0 - wide, y1 + wide, 0.02)], V(0, 1, 0), { grain: grainX, shade: 0.1 });
    for (const [t, way] of [[x0 - wide, -1], [x1 + wide, 1]]) face(mesh, [P(north, t, y0 - 0.02, proud), P(north, t, y1 + wide, proud), P(north, t, y1 + wide, 0.02), P(north, t, y0 - 0.02, 0.02)], V(way, 0, 0), { grain: UP, shade: 0.25 });
    // the sill: a board that slopes a little, out past the casing
    const s0 = x0 - wide - 0.03, s1 = x1 + wide + 0.03;
    face(mesh, [P(north, s0, y0, 0.03), P(north, s1, y0, 0.03), P(north, s1, y0 - 0.022, 0.125), P(north, s0, y0 - 0.022, 0.125)], V(0, 1, 0), { grain: grainX, shade: 0.02, offset: [3.7, 0.5] });
    face(mesh, [P(north, s0, y0 - 0.022, 0.125), P(north, s1, y0 - 0.022, 0.125), P(north, s1, y0 - 0.062, 0.125), P(north, s0, y0 - 0.062, 0.125)], north.out, { grain: grainX, shade: 0.15, offset: [4.1, 0.1] });
    face(mesh, [P(north, s0, y0 - 0.062, 0.125), P(north, s1, y0 - 0.062, 0.125), P(north, s1, y0 - 0.062, 0.02), P(north, s0, y0 - 0.062, 0.02)], V(0, -1, 0), { grain: grainX, shade: 0.6 });

    // the door: its reveal, its casing, its head and its threshold
    const d0 = DOOR.x0, d1 = DOOR.x1, top = HEAD - 0.1, leaf = -0.07;
    face(mesh, [P(north, d0, FOOT, 0.03), P(north, d0, HEAD, 0.03), P(north, d0, HEAD, leaf), P(north, d0, FOOT, leaf)], V(1, 0, 0), { grain: UP, shade: 0.35, offset: [5.3, 0.1] });
    face(mesh, [P(north, d1, FOOT, 0.03), P(north, d1, HEAD, 0.03), P(north, d1, HEAD, leaf), P(north, d1, FOOT, leaf)], V(-1, 0, 0), { grain: UP, shade: 0.35, offset: [5.7, 0.4] });
    face(mesh, [P(north, d0, top, 0.02), P(north, d1, top, 0.02), P(north, d1, HEAD, 0.02), P(north, d0, HEAD, 0.02)], north.out, { grain: grainX, shade: 0.12, offset: [6.1, 0.3] });
    face(mesh, [P(north, d0, top, 0.02), P(north, d1, top, 0.02), P(north, d1, top, leaf), P(north, d0, top, leaf)], V(0, -1, 0), { grain: grainX, shade: 0.55 });
    const post = (a0, a1, offset) => face(mesh, [P(north, a0, FOOT, proud), P(north, a1, FOOT, proud), P(north, a1, HEAD + wide, proud), P(north, a0, HEAD + wide, proud)], north.out, { grain: UP, shade: 0.04, offset });
    post(d0 - wide, d0, [6.6, 0.2]); post(d1, d1 + wide, [7.1, 0.7]);
    face(mesh, [P(north, d0, HEAD, proud), P(north, d1, HEAD, proud), P(north, d1, HEAD + wide, proud), P(north, d0, HEAD + wide, proud)], north.out, { grain: grainX, shade: 0.04, offset: [7.6, 0.4] });
    face(mesh, [P(north, d0 - wide, HEAD + wide, proud), P(north, d1 + wide, HEAD + wide, proud), P(north, d1 + wide, HEAD + wide, 0.02), P(north, d0 - wide, HEAD + wide, 0.02)], V(0, 1, 0), { grain: grainX, shade: 0.1 });
    for (const [t, way] of [[d0 - wide, -1], [d1 + wide, 1]]) face(mesh, [P(north, t, FOOT, proud), P(north, t, HEAD + wide, proud), P(north, t, HEAD + wide, 0.02), P(north, t, FOOT, 0.02)], V(way, 0, 0), { grain: UP, shade: 0.25 });
    // the threshold: a slab worn hollow in the middle
    face(mesh, [P(north, d0 - 0.03, FOOT + 0.035, leaf), P(north, d1 + 0.03, FOOT + 0.035, leaf), P(north, d1 + 0.03, FOOT + 0.03, 0.13), P(north, d0 - 0.03, FOOT + 0.03, 0.13)], V(0, 1, 0), { grain: grainX, shade: 0.0, offset: [8.2, 0.6] });
    face(mesh, [P(north, d0 - 0.03, FOOT + 0.03, 0.13), P(north, d1 + 0.03, FOOT + 0.03, 0.13), P(north, d1 + 0.03, FOOT - 0.03, 0.13), P(north, d0 - 0.03, FOOT - 0.03, 0.13)], north.out, { grain: grainX, shade: 0.2 });
  };

  // ---- the timbers: eight courses a wall, each hewn square and a little out of true, with a groove of chinking
  // between one and the next. At a corner the courses lap by turns: one wall's timber runs on past the corner
  // and the other's stops against it. In the coarser level a timber is one flat face in the wall's plane, with
  // the shade and the paint it has in the finer one: a timber's faces lie down on it, and nothing of the wall's
  // paint changes where the levels swap. So each timber's shade and paint are drawn once, here, for both.
  // (A timber runs the whole length of its wall, or from the wall's end to an opening that cuts its own course:
  // cut at the window's edges all the way up the wall, the wall was built of short ends.)
  const lengths = walls.map((wall) => Array.from({ length: COURSES }, (_, k) => {
    const y0 = FOOT + k * COURSE, y1 = y0 + COURSE, list = [];
    let t = wall.from;
    for (const h of wall.holes.filter((hole) => hole.y0 < y1 - 1e-4 && hole.y1 > y0 + 1e-4).sort((p, q) => p.t0 - q.t0)) { if (h.t0 > t + 1e-4) list.push([t, h.t0]); t = Math.max(t, h.t1); }
    if (wall.to > t + 1e-4) list.push([t, wall.to]);
    return list.map(([a, b]) => ({ a, b, y0, y1, shade: 0.12 + 0.26 * r() * r(), offset: [7 * r(), 3 * r()] }));
  }));
  const timbers = (mesh) => {
    const BEVEL = 0.034, LAP = 0.14;
    walls.forEach((wall, w) => {
      const grain = run(wall);
      // the wall's own plane behind the timbers, dark: what shows in the grooves between them
      for (const [t0, t1, y0, y1] of panels(wall, FOOT, PLATE)) face(mesh, [P(wall, t0, y0, -0.012), P(wall, t1, y0, -0.012), P(wall, t1, y1, -0.012), P(wall, t0, y1, -0.012)], wall.out, { grain, shade: 0.85, offset: [0.4, 0.2] });
      for (let k = 0; k < COURSES; k += 1) {
        const lapped = k % 2 === wall.laps;
        for (const { a, b, y0, y1, shade, offset } of lengths[w][k]) {
          const n = Math.max(1, Math.round((b - a) / 0.75));
          const cut = (j) => {            // where the adze left off: a place along the timber, how proud it stands there, and how its edges wander
            const t = a + ((b - a) * j) / n;
            return { t, off: 0.03 + 0.014 * r(), low: y0 + BEVEL + 0.007 * (r() - 0.5), high: y1 - BEVEL + 0.007 * (r() - 0.5) };
          };
          let left = cut(0);
          for (let j = 1; j <= n; j += 1) {
            const right = cut(j);
            const roots = [P(wall, left.t, y0), P(wall, right.t, y0), P(wall, right.t, y1), P(wall, left.t, y1)];
            face(mesh, [P(wall, left.t, left.low, left.off), P(wall, right.t, right.low, right.off), P(wall, right.t, right.high, right.off), P(wall, left.t, left.high, left.off)], wall.out, { grain, shade, offset, roots });
            // (its upper and lower edges, hewn off: they go back into the groove)
            face(mesh, [P(wall, left.t, left.high, left.off), P(wall, right.t, right.high, right.off), P(wall, right.t, y1 - 0.004, right.off - 0.03), P(wall, left.t, y1 - 0.004, left.off - 0.03)], V(wall.out.x, 0.8, wall.out.z),
              { grain, shade: Math.max(0, shade - 0.05), offset, roots: [roots[3], roots[2], roots[2], roots[3]] });
            face(mesh, [P(wall, left.t, left.low, left.off), P(wall, right.t, right.low, right.off), P(wall, right.t, y0 + 0.004, right.off - 0.03), P(wall, left.t, y0 + 0.004, left.off - 0.03)], V(wall.out.x, -0.8, wall.out.z),
              { grain, shade: shade + 0.3, offset, roots: [roots[0], roots[1], roots[1], roots[0]] });
            left = right;
          }
          // where it runs on past a corner: a stub of its own section, its end sawn and weathered
          for (const [t, way, isEnd] of [[a, -1, a <= wall.from + 1e-6], [b, 1, b >= wall.to - 1e-6]]) {
            if (!isEnd || !lapped) continue;
            const far = t + way * LAP * (0.8 + 0.4 * r()), off = 0.034, root = (y) => P(wall, t, y);
            const box = (p, q, facing, sh, g) => face(mesh, p.map(([tt, yy, oo]) => P(wall, tt, yy, oo)), facing, { grain: g, shade: sh, offset, roots: q.map(root) });
            const lo = y0 + 0.012, hi = y1 - 0.012, along = V(grain.x * way, 0, grain.z * way), inward = V(-wall.out.x, 0, -wall.out.z);
            box([[t, lo, off], [far, lo, off], [far, hi, off], [t, hi, off]], [y0, y0, y1, y1], wall.out, shade, grain);
            box([[far, lo, off], [far, hi, off], [far, hi, -T], [far, lo, -T]], [y0, y1, y1, y0], along, 0.34, UP);              // its end
            box([[t, lo, -T], [far, lo, -T], [far, hi, -T], [t, hi, -T]], [y0, y0, y1, y1], inward, shade + 0.1, grain);
            box([[t, hi, off], [far, hi, off], [far, hi, -T], [t, hi, -T]], [y1, y1, y1, y1], UP, shade, grain);
            box([[t, lo, off], [far, lo, off], [far, lo, -T], [t, lo, -T]], [y0, y0, y0, y0], V(0, -1, 0), 0.6, grain);
          }
        }
      }
    });
  };
  // The gables: split boards set upright from the top of the walls to the roof. The coarser level has every
  // board too, flat, with its own shade and paint, a finger proud of the wall's plane: a board laps the top
  // timber by three centimetres, and in one plane with that timber's own slab the two would flicker there.
  const GABLE_FOOT = PLATE - 0.03, LAP = 0.012;
  const boards = walls.filter((w) => w.gable).map((wall) => {
    const edges = [-HX], list = [];
    while (edges[edges.length - 1] < HX - 0.12) {
      const last = edges[edges.length - 1], next = last + 0.14 + 0.13 * r();
      edges.push(last < 0 && next > -0.05 ? 0 : Math.min(HX, next));           // one edge is under the ridge: a board's top is one line
    }
    edges[edges.length - 1] = HX;
    for (let i = 0; i + 1 < edges.length; i += 1) {
      const draws = [r(), r(), r(), r()];
      if (Math.max(gableTop(edges[i]), gableTop(edges[i + 1])) - GABLE_FOOT < 0.06) continue;
      list.push({ t0: edges[i], t1: edges[i + 1], off: 0.034 + 0.02 * draws[3], shade: 0.1 + 0.3 * draws[0] * draws[0], offset: [7 * draws[1], 3 * draws[2]] });
    }
    return { wall, list };
  });
  const gables = (mesh, fine) => {
    const top = (t) => Math.max(GABLE_FOOT + 0.01, gableTop(t));
    for (const { wall, list } of boards) {
      // (dark behind the boards: through the gaps between them the far side of the forest showed)
      for (const [a, b] of [[-HX, 0], [0, HX]]) face(mesh, [P(wall, a, GABLE_FOOT, -0.014), P(wall, b, GABLE_FOOT, -0.014), P(wall, b, top(b), -0.014), P(wall, a, top(a), -0.014)], wall.out, { grain: UP, shade: 0.9 });
      for (const { t0, t1, off, shade, offset } of list) {
        const roots = [P(wall, t0, GABLE_FOOT, LAP), P(wall, t1, GABLE_FOOT, LAP), P(wall, t1, top(t1), LAP), P(wall, t0, top(t0), LAP)];
        const a = t0 + 0.003, b = t1 - 0.003;
        face(mesh, fine ? [P(wall, a, GABLE_FOOT, off), P(wall, b, GABLE_FOOT, off), P(wall, b, top(b), off), P(wall, a, top(a), off)] : roots, wall.out, { grain: UP, shade, offset, roots });
      }
    }
  };
  // The door's leaf: five planks, ledged and braced on the outside, with a wooden latch.
  const door = (mesh, fine) => {
    const north = walls[0], leaf = -0.07, top = HEAD - 0.1, n = fine ? 5 : 1;
    // (dark behind the planks, as behind the gables' boards)
    face(mesh, [P(north, DOOR.x0, FOOT, leaf - 0.014), P(north, DOOR.x1, FOOT, leaf - 0.014), P(north, DOOR.x1, top, leaf - 0.014), P(north, DOOR.x0, top, leaf - 0.014)], north.out, { grain: UP, shade: 0.9 });
    for (let i = 0; i < n; i += 1) {
      const t0 = DOOR.x0 + ((DOOR.x1 - DOOR.x0) * i) / n, t1 = DOOR.x0 + ((DOOR.x1 - DOOR.x0) * (i + 1)) / n, off = leaf + (fine ? 0.008 * r() : 0.004);
      const roots = [P(north, t0, FOOT + 0.03, leaf + 0.004), P(north, t1, FOOT + 0.03, leaf + 0.004), P(north, t1, top, leaf + 0.004), P(north, t0, top, leaf + 0.004)];
      face(mesh, [P(north, t0 + 0.003, FOOT + 0.03, off), P(north, t1 - 0.003, FOOT + 0.03, off), P(north, t1 - 0.003, top, off), P(north, t0 + 0.003, top, off)], north.out, { grain: UP, shade: fine ? 0.12 + 0.2 * r() : 0.2, offset: [9 + i * 1.7, 0.3 * i], roots });
    }
    if (!fine) return;
    // (they lie down a finger in front of the planks: in one plane with them, the two would flicker)
    const flat = (points, shade, grain) => face(mesh, points.map(([t, y]) => P(north, t, y, leaf + 0.03)), north.out, { grain, shade, offset: [11.3, 0.8], roots: points.map(([t, y]) => P(north, t, y, leaf + 0.014)) });
    const a = DOOR.x0 + 0.04, b = DOOR.x1 - 0.04;
    flat([[a, FOOT + 0.3], [b, FOOT + 0.3], [b, FOOT + 0.42], [a, FOOT + 0.42]], 0.06, V(1, 0, 0));
    flat([[a, top - 0.42], [b, top - 0.42], [b, top - 0.3], [a, top - 0.3]], 0.06, V(1, 0, 0));
    flat([[a, FOOT + 0.42], [a + 0.12, FOOT + 0.42], [b, top - 0.42], [b - 0.12, top - 0.42]], 0.08, V(0.5, 0.86, 0));
    // the latch: a bar of wood through a staple, at a hand's height
    pole(mesh, [P(north, DOOR.x1 - 0.3, FOOT + 1.02, leaf + 0.05), P(north, DOOR.x1 - 0.02, FOOT + 1.04, leaf + 0.05)], [0.016, 0.014], { sides: 4, shade: 0.3, drop: true });
  };
  // the coarser level's walls: every timber as one flat face in the wall's plane (the window's and the door's
  // openings are where no timber is)
  const slabs = (mesh) => {
    walls.forEach((wall, w) => {
      for (const course of lengths[w]) for (const { a, b, y0, y1, shade, offset } of course) face(mesh, [P(wall, a, y0), P(wall, b, y0), P(wall, b, y1), P(wall, a, y1)], wall.out, { grain: run(wall), shade, offset });
    });
  };
  // what carries the small roof over the door: a ledger on the wall, a beam out in front, and a strut to it either side
  const HOOD = { x0: DOOR.x0 - 0.33, x1: DOOR.x1 + 0.33, high: HEAD + 0.46, low: HEAD + 0.18, out: 0.8 };
  const hoodFrame = (mesh) => {
    const north = walls[0];
    pole(mesh, [P(north, HOOD.x0 + 0.05, HOOD.low - 0.07, HOOD.out - 0.08), P(north, (HOOD.x0 + HOOD.x1) / 2, HOOD.low - 0.075, HOOD.out - 0.08), P(north, HOOD.x1 - 0.05, HOOD.low - 0.07, HOOD.out - 0.08)], [0.05, 0.048, 0.046], { sides: 6, shade: 0.2 });
    for (const t of [HOOD.x0 + 0.14, HOOD.x1 - 0.14]) {
      pole(mesh, [P(north, t, HEAD - 0.38, 0.05), P(north, t, HOOD.low - 0.1, HOOD.out - 0.1)], [0.04, 0.036], { sides: 5, shade: 0.25 });
      pole(mesh, [P(north, t, HOOD.high - 0.08, 0.05), P(north, t, HOOD.low - 0.04, HOOD.out - 0.04)], [0.036, 0.034], { sides: 5, shade: 0.45 });
    }
  };

  const wood = [new Mesh(), new Mesh()];
  trim(wood[0]); timbers(wood[0]); gables(wood[0], true); door(wood[0], true); hoodFrame(wood[0]);
  trim(wood[1]); slabs(wood[1]); gables(wood[1], false); door(wood[1], false); hoodFrame(wood[1]);

  // ---- the roof: two slopes of split shakes from the eaves to a ridge that runs north and south
  const Z0 = -HZ - RAKE_N, Z1 = HZ + RAKE_S;
  const slopes = [-1, 1].map((sign) => {
    const up = V(-sign * COS, SIN, 0), normal = V(sign * SIN, COS, 0), length = (HX + EAVE) / COS;
    // a point of the slope: d metres up it from the eave, at z, `lift` above the shakes' plane. (Past the ridge
    // it goes on up its own slope: read from roofY, which is the roof's and not the slope's, the west slope's last
    // course bent down over the ridge and went in under the east one's. A review read that in the code.)
    const at = (d, z, lift = 0) => { const out = HX + EAVE - d * COS; return V(sign * out, Y(PLATE + LIFT + (HX - out) * PITCH), z).addScaledVector(normal, lift); };
    return { sign, up, normal, length, at };
  });
  // the chimney goes up through the west eave: no shake lies where it stands
  const notched = (s, d0, z0, z1) => s.sign < 0 && d0 < EAVE / COS - 0.05 && z1 > HEARTH.z - HEARTH.neck - 0.03 && z0 < HEARTH.z + HEARTH.neck + 0.03;
  const roofCommon = (mesh) => {
    for (const s of slopes) {
      // the underside: dark, the sun never on it (one face from rake to rake: where the chimney goes up through the west eave it is inside the stone)
      face(mesh, [s.at(0, Z0, -0.012), s.at(0, Z1, -0.012), s.at(s.length, Z1, -0.012), s.at(s.length, Z0, -0.012)], V(0, -1, 0), { grain: s.up, shade: 0.8, offset: [2.3, 0.4] });
      // a pole along either rake, under the shakes' ends
      for (const z of [Z0 + 0.035, Z1 - 0.035]) pole(mesh, [s.at(0.03, z, -0.05), s.at(s.length / 2, z, -0.052), s.at(s.length - 0.05, z, -0.05)], [0.036, 0.036, 0.034], { sides: 5, shade: 0.3 });
      // the purlin half-way up the slope, its ends out under the rakes
      const x = s.sign * 1.2, y = Y(roofY(x)) - 0.02 - 0.075;
      pole(mesh, [V(x, y, Z0 + 0.03), V(x, y - 0.01, 0), V(x, y, Z1 - 0.03)], [0.075, 0.073, 0.07], { sides: 6, shade: [0.2, 0.6, 0.2] });
    }
    // the ridge log
    const y = Y(roofY(0)) - 0.03 - 0.1;
    pole(mesh, [V(0, y, Z0 + 0.02), V(0, y - 0.012, 0), V(0, y, Z1 - 0.02)], [0.1, 0.098, 0.094], { sides: 7, shade: [0.15, 0.6, 0.15] });
  };
  const shakes = (mesh) => {
    for (const s of slopes) {
      // (the west slope's last course stands a little past the ridge, over the east one's)
      const length = s.length + (s.sign < 0 ? 0.07 : 0), courses = Math.ceil(length / EXPOSED);
      for (let k = 0; k < courses; k += 1) {
        const d0 = k * EXPOSED, d1 = Math.min(length, d0 + EXPOSED + 0.03);
        let z = Z0 - 0.02 * r();
        while (z < Z1 - 0.03) {
          const draws = [r(), r(), r(), r(), r(), r()];
          const wide = 0.1 + 0.15 * draws[0], z0 = z, z1 = Math.min(Z1 + 0.02 * draws[1], z + wide);
          z = z1;
          if (notched(s, d0, z0, z1)) continue;
          const butt = d0 + 0.03 * (draws[2] - 0.5) - (draws[3] < 0.03 ? 0.04 + 0.06 * draws[4] : 0), roll = 0.007 * (draws[4] - 0.5);
          const corners = [s.at(butt, z0, 0.05 + roll), s.at(butt, z1, 0.05 - roll), s.at(d1, z1, 0.03), s.at(d1, z0, 0.03)];
          // (the coarser level's slope ends at the ridge: what stands past it lies down onto the ridge's line)
          const ridge = Math.min(d1, s.length);
          const roots = [s.at(Math.max(0, d0), z0, SKIN), s.at(Math.max(0, d0), z1, SKIN), s.at(ridge, z1, SKIN), s.at(ridge, z0, SKIN)];
          const offset = [9 * draws[5], 4 * draws[2]];
          face(mesh, corners, s.normal, { grain: s.up, offset, roots, shade: 0.2 * draws[1] * draws[1] });
          face(mesh, [corners[0], corners[1], s.at(butt, z1, 0.026), s.at(butt, z0, 0.026)], V(-s.up.x, -s.up.y, 0), { grain: s.normal, offset, shade: 0.4, roots: [roots[0], roots[1], roots[1], roots[0]] });
        }
      }
    }
  };
  // The roof's own edge, from near by: from its underside up to the shakes, under their butts along the eaves and
  // under their ends along the rakes. Without it the slot between the underside and the shakes was open: seen
  // from below at a gable the roof was a centimetre thick at its edge, and the wood beyond showed through. (No
  // reading found it. The gallery's views were drawn again with back faces on, and the slot was what differed.)
  // The coarser level's slab has these edges (roofSlabs), and these lie down onto them.
  const edges = (mesh) => {
    for (const s of slopes) {
      const cols = s.sign < 0 ? [Z0, HEARTH.z - HEARTH.neck, HEARTH.z + HEARTH.neck, Z1] : [Z0, 0, Z1];
      for (let i = 0; i + 1 < cols.length; i += 1) {
        const d0 = s.sign < 0 && i === 1 ? EAVE / COS : 0, low = [s.at(d0, cols[i + 1], -0.012), s.at(d0, cols[i], -0.012)];
        face(mesh, [s.at(d0, cols[i], 0.026), s.at(d0, cols[i + 1], 0.026), ...low], V(-s.up.x, -s.up.y, 0), { grain: s.normal, shade: 0.4, roots: [s.at(d0, cols[i], SKIN), s.at(d0, cols[i + 1], SKIN), ...low] });
      }
      for (const z of [Z0, Z1]) {
        const low = [s.at(s.length, z, -0.012), s.at(0, z, -0.012)];
        face(mesh, [s.at(0, z, 0.03), s.at(s.length, z, 0.03), ...low], V(0, 0, Math.sign(z)), { grain: s.up, shade: 0.3, roots: [s.at(0, z, SKIN), s.at(s.length, z, SKIN), ...low] });
      }
      // (and the under side of the west slope's last course where it stands past the ridge, which is what the
      // east sees of it; the coarser level's slope ends at the ridge, and this lies down onto that line)
      if (s.sign < 0) {
        const line = [s.at(s.length, Z0, SKIN), s.at(s.length, Z1, SKIN)];
        face(mesh, [s.at(s.length - 0.03, Z0, 0.02), s.at(s.length - 0.03, Z1, 0.02), s.at(s.length + 0.07, Z1, 0.02), s.at(s.length + 0.07, Z0, 0.02)], V(-s.normal.x, -s.normal.y, 0), { grain: s.up, shade: 0.6, roots: [line[0], line[1], line[1], line[0]] });
      }
    }
  };
  const roofSlabs = (mesh) => {
    for (const s of slopes) {
      // (in three along the eave on the west, round the chimney)
      const cols = s.sign < 0 ? [Z0, HEARTH.z - HEARTH.neck, HEARTH.z + HEARTH.neck, Z1] : [Z0, 0, Z1];
      for (let i = 0; i + 1 < cols.length; i += 1) {
        const d0 = s.sign < 0 && i === 1 ? EAVE / COS : 0;
        face(mesh, [s.at(d0, cols[i], SKIN), s.at(d0, cols[i + 1], SKIN), s.at(s.length, cols[i + 1], SKIN), s.at(s.length, cols[i], SKIN)], s.normal, { grain: s.up, offset: [5.7 + i, 1.9], shade: 0.06 });
        face(mesh, [s.at(d0, cols[i], SKIN), s.at(d0, cols[i + 1], SKIN), s.at(d0, cols[i + 1], -0.012), s.at(d0, cols[i], -0.012)], V(-s.up.x, -s.up.y, 0), { grain: s.normal, shade: 0.4 });
      }
      for (const z of [Z0, Z1]) face(mesh, [s.at(0, z, SKIN), s.at(s.length, z, SKIN), s.at(s.length, z, -0.012), s.at(0, z, -0.012)], V(0, 0, Math.sign(z)), { grain: s.up, shade: 0.3 });
    }
  };
  // the rafters' tails under the eaves: only from near by
  const rafters = (mesh) => {
    for (const s of slopes) {
      for (let z = Z0 + 0.22; z < Z1 - 0.1; z += 0.58 + 0.06 * r()) {
        if (s.sign < 0 && Math.abs(z - HEARTH.z) < HEARTH.neck + 0.08) continue;
        const d0 = (EAVE - 0.03) / COS, d1 = 0.05;
        pole(mesh, [s.at(d0 + 0.5, z, -0.06), s.at(d1, z, -0.058)], [0.045, 0.04], { sides: 5, shade: 0.5, drop: true });
      }
    }
  };
  // the small roof over the door: four courses of shakes from the wall down to the beam
  const hoodAt = (d, t, lift = 0) => {
    const share = d / Math.hypot(HOOD.out, HOOD.high - HOOD.low), north = walls[0];
    return P(north, t, HOOD.low + (HOOD.high - HOOD.low) * share + lift * 0.94, HOOD.out * (1 - share) + 0.03 + lift * 0.33);
  };
  const hoodLength = Math.hypot(HOOD.out, HOOD.high - HOOD.low), hoodUp = V(0, (HOOD.high - HOOD.low) / hoodLength, HOOD.out / hoodLength), hoodNormal = V(0, 0.94, -0.33);
  const hood = (mesh, fine) => {
    face(mesh, [hoodAt(0, HOOD.x0, -0.012), hoodAt(0, HOOD.x1, -0.012), hoodAt(hoodLength, HOOD.x1, -0.012), hoodAt(hoodLength, HOOD.x0, -0.012)], V(0, -1, 0), { grain: hoodUp, shade: 0.75 });
    // its own edge at either side, from the underside up to the shakes (the slab's side, in the coarser level);
    // and in front, from near by, under the shakes' butts (the coarser level's slab has its own, below)
    for (const [t, way] of [[HOOD.x0, -1], [HOOD.x1, 1]]) {
      const slab = [hoodAt(0, t, SKIN), hoodAt(hoodLength, t, SKIN), hoodAt(hoodLength, t, -0.012), hoodAt(0, t, -0.012)];
      face(mesh, fine ? [hoodAt(0, t, 0.03), hoodAt(hoodLength, t, 0.03), slab[2], slab[3]] : slab, V(way, 0, 0), { grain: hoodUp, shade: 0.3, roots: slab });
    }
    if (fine) {
      const slab = [hoodAt(0, HOOD.x0, SKIN), hoodAt(0, HOOD.x1, SKIN), hoodAt(0, HOOD.x1, -0.012), hoodAt(0, HOOD.x0, -0.012)];
      face(mesh, [hoodAt(0, HOOD.x0, 0.026), hoodAt(0, HOOD.x1, 0.026), slab[2], slab[3]], V(0, -0.3, -1), { grain: V(1, 0, 0), shade: 0.4, roots: slab });
    }
    if (!fine) {
      face(mesh, [hoodAt(0, HOOD.x0, SKIN), hoodAt(0, HOOD.x1, SKIN), hoodAt(hoodLength, HOOD.x1, SKIN), hoodAt(hoodLength, HOOD.x0, SKIN)], hoodNormal, { grain: hoodUp, shade: 0.06, offset: [3.3, 0.7] });
      face(mesh, [hoodAt(0, HOOD.x0, SKIN), hoodAt(0, HOOD.x1, SKIN), hoodAt(0, HOOD.x1, -0.012), hoodAt(0, HOOD.x0, -0.012)], V(0, -0.3, -1), { grain: V(1, 0, 0), shade: 0.4 });
      return;
    }
    const courses = Math.ceil(hoodLength / 0.27);
    for (let k = 0; k < courses; k += 1) {
      const d0 = k * 0.27, d1 = Math.min(hoodLength, d0 + 0.3);
      let t = HOOD.x0 - 0.02 * r();
      while (t < HOOD.x1 - 0.03) {
        const draws = [r(), r(), r(), r()], t0 = t, t1 = Math.min(HOOD.x1 + 0.02 * draws[1], t + 0.1 + 0.14 * draws[0]);
        t = t1;
        const butt = d0 + 0.03 * (draws[2] - 0.5);
        const corners = [hoodAt(butt, t0, 0.05), hoodAt(butt, t1, 0.05), hoodAt(d1, t1, 0.03), hoodAt(d1, t0, 0.03)];
        const roots = [hoodAt(Math.max(0, d0), t0, SKIN), hoodAt(Math.max(0, d0), t1, SKIN), hoodAt(d1, t1, SKIN), hoodAt(d1, t0, SKIN)];
        face(mesh, corners, hoodNormal, { grain: hoodUp, offset: [9 * draws[3], 4 * draws[2]], roots, shade: 0.2 * draws[1] * draws[1] });
        face(mesh, [corners[0], corners[1], hoodAt(butt, t1, 0.026), hoodAt(butt, t0, 0.026)], V(0, -0.3, -1), { grain: V(1, 0, 0), shade: 0.4, roots: [roots[0], roots[1], roots[1], roots[0]] });
      }
    }
  };
  const roof = [new Mesh(), new Mesh()];
  roofCommon(roof[0]); shakes(roof[0]); edges(roof[0]); rafters(roof[0]); hood(roof[0], true);
  roofCommon(roof[1]); roofSlabs(roof[1]); hood(roof[1], false);

  // ---- what grows on the roof (the maples' sheet): a little moss under the eaves, a fern or two near the ridge
  const leaf = new Mesh();
  if (sheets.maple) {
    const sheet = sheets.maple, pick = (list) => sheetCell(list[Math.floor(r() * list.length)], sheet.cells), cards = [];
    const add = (origin, along, across, cell, options) => cards.push({ y: origin.y, origin, along, across, cell, normal: new THREE.Vector3().crossVectors(along, across).normalize(), options });
    for (const s of slopes) {
      for (let z = Z0 + 0.2; z < Z1 - 0.6;) {
        const long = 0.5 + 0.5 * r(), a = s.at(0.01, z, 0.02), b = s.at(0.01, Math.min(Z1, z + long), 0.02), tall = 0.16 * (0.7 + 0.6 * r());
        // (none where the chimney stands in the eave)
        if (r() < 0.3 && !(s.sign < 0 && z < HEARTH.z + HEARTH.neck + 0.1 && z + long > HEARTH.z - HEARTH.neck - 0.1)) {
          const across = V(0, tall, 0);
          add(a.clone().addScaledVector(across, -0.4), new THREE.Vector3().subVectors(b, a), across, pick(sheet.moss), { sway: [0.1, 0.1], variation: r(), root: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5) });
        }
        z += long + 0.5 * r() + 0.3;
      }
    }
    // (a fern runs level along the slope, its foot on the shakes: one that ran up the slope went through the roof)
    const west = slopes[0];
    for (let i = 0; i < 4; i += 1) {
      const at = west.at(west.length - 0.2 - 0.9 * r(), Z0 + 0.5 + (Z1 - Z0 - 1) * (i + 0.2 + 0.6 * r()) / 4, 0.03), long = 0.55 + 0.4 * r(), across = V(0, 0.26 + 0.14 * r(), 0);
      const runZ = V(0, 0, long * (r() < 0.5 ? -1 : 1));
      add(at.clone().addScaledVector(runZ, -0.5).addScaledVector(across, 0.5).addScaledVector(UP, 0.02), runZ, across, pick(sheet.fern), { sway: [0.08, 0.08], variation: r(), root: at });
    }
    cards.sort((a, b) => a.y - b.y);
    for (const card of cards) leaf.card(card.origin, card.along, card.across, card.cell, card.normal, card.options);
  }

  // ---- stone: the chimney outside the west wall, the footing under the walls, the step at the door and the
  // stones from it to the trail
  const top = CABIN.top;
  // the chimney's half-width along the wall and its depth out from it, at a height above the floor
  const girth = (y) => { const t = Math.min(1, Math.max(0, (y - 1.9) / 0.8)); return [HEARTH.half + (HEARTH.neck - HEARTH.half) * t, HEARTH.deep + (HEARTH.slim - HEARTH.deep) * t]; };
  const chimneyFoot = Math.min(G(-HX - 0.3, HEARTH.z - 0.5), G(-HX - 0.3, HEARTH.z + 0.5), G(-HX - 0.6, HEARTH.z)) - F - 0.12;
  // its core: what the stones are laid against, and all there is of it from far off
  // (the higher on the stack, the barer of moss, and towards the top the darker with soot: the core as the stones)
  const bareAt = (y) => 0.2 + 0.75 * smooth(0.5, 2.8, y), sootAt = (y) => 1 - 0.45 * smooth(top - 1.2, top, y);
  const core = (mesh, light) => {
    const bare = (p) => bareAt(p.y - F), shaded = (k) => (p) => light * k * sootAt(p.y - F);
    const levels = [chimneyFoot, 1.9, 2.7, top];
    for (let i = 0; i + 1 < levels.length; i += 1) {
      const [h0, d0] = girth(levels[i]), [h1, d1] = girth(levels[i + 1]), y0 = Y(levels[i]), y1 = Y(levels[i + 1]);
      rockFace(mesh, [V(-HX - d0, y0, HEARTH.z - h0), V(-HX - d0, y0, HEARTH.z + h0), V(-HX - d1, y1, HEARTH.z + h1), V(-HX - d1, y1, HEARTH.z - h1)], V(-1, 0, 0), shaded(1), 0, bare);
      for (const way of [-1, 1]) rockFace(mesh, [V(-HX - d0, y0, HEARTH.z + way * h0), V(-HX + 0.02, y0, HEARTH.z + way * h0), V(-HX + 0.02, y1, HEARTH.z + way * h1), V(-HX - d1, y1, HEARTH.z + way * h1)], V(0, 0, way), shaded(0.9), 0, bare);
    }
    // (its back, above the roof, and its top: the flue's mouth is dark)
    const [h, d] = girth(top);
    rockFace(mesh, [V(-HX + 0.02, Y(PLATE), HEARTH.z - h), V(-HX + 0.02, Y(PLATE), HEARTH.z + h), V(-HX + 0.02, Y(top), HEARTH.z + h), V(-HX + 0.02, Y(top), HEARTH.z - h)], V(1, 0, 0), shaded(0.9), 0, bare);
    rockFace(mesh, [V(-HX - d, Y(top), HEARTH.z - h), V(-HX - d, Y(top), HEARTH.z + h), V(-HX + 0.02, Y(top), HEARTH.z + h), V(-HX + 0.02, Y(top), HEARTH.z - h)], UP, light * 0.25, 0, bare);
  };
  // The chimney's stones are squared blocks laid in courses against the core's four faces (its back only above
  // the roof), each a little proud of the core and of its neighbours, with a joint's width between them through
  // which the core shows dark. A block's corners carry normals that lean out of it, so the rock's shading (half
  // by the face, half smoothly) rounds its edges off. Its roots lie on the core's own face at each corner's
  // height, a finger proud of it (in the core's own plane the two would flicker): in the coarser level the
  // stones have lain down on the core, which is all that level has. The higher on the stack, the barer of moss
  // (it is warm, and dry), and towards the top the darker with soot.
  const P3 = (m, v) => V(m.position[v * 3], m.position[v * 3 + 1], m.position[v * 3 + 2]);
  const quad = (m, a, b, c, d, facing) => {
    const pa = P3(m, a), normal = new THREE.Vector3().crossVectors(P3(m, b).sub(pa), P3(m, d).sub(pa));
    if (normal.dot(facing) < 0) m.index.push(a, c, b, a, d, c); else m.index.push(a, b, c, a, c, d);
  };
  // a face of the core at a height above the floor: a point on it, and how far the run of stones goes either way along it
  const STACK = [
    { out: V(-1, 0, 0), along: V(0, 0, 1), run: (y) => { const [h, d] = girth(y); return { at: V(-HX - d, 0, HEARTH.z), from: -h - 0.04, to: h + 0.04 }; } },
    { out: V(0, 0, -1), along: V(1, 0, 0), run: (y) => { const [h, d] = girth(y); return { at: V(-HX, 0, HEARTH.z - h), from: -d + 0.05, to: 0.02 }; } },
    { out: V(0, 0, 1), along: V(1, 0, 0), run: (y) => { const [h, d] = girth(y); return { at: V(-HX, 0, HEARTH.z + h), from: -d + 0.05, to: 0.02 }; } },
    { out: V(1, 0, 0), along: V(0, 0, 1), above: PLATE + 0.25, run: (y) => { const [h] = girth(y); return { at: V(-HX + 0.02, 0, HEARTH.z), from: -h, to: h }; } },
  ];
  const block = (mesh, f, y, middle, long, tall, proud, sky, bare) => {
    const base = mesh.vertexCount, here = f.run(y + tall / 2);
    for (let k = 0; k < 2; k += 1) for (let j = 0; j < 2; j += 1) for (let i = 0; i < 2; i += 1) {
      const side = i ? 1 : -1, wobble = k ? 0.012 : 0, a = middle + side * long / 2 + (r() - 0.5) * 2 * wobble, h = y + j * tall + (r() - 0.5) * 1.6 * wobble;
      const p = here.at.clone().addScaledVector(f.along, a).addScaledVector(f.out, k ? proud + (r() - 0.5) * 2 * wobble : -0.05).setY(Y(h));
      const n = V(0, j ? 0.5 : -0.5, 0).addScaledVector(f.along, side * 0.5).addScaledVector(f.out, k ? 1 : 0.15).normalize();
      const hh = Math.min(top, Math.max(chimneyFoot, h)), on = f.run(hh), q = on.at.clone().addScaledVector(f.along, Math.min(on.to, Math.max(on.from, a))).addScaledVector(f.out, 0.012).setY(Y(hh));
      mesh.position.push(p.x, p.y, p.z); mesh.root.push(q.x, q.y, q.z); mesh.normal.push(n.x, n.y, n.z); mesh.uv.push(sky * (k ? 1 : 0.55), 0); mesh.wind.push(0, bare);
    }
    const v = (i, j, k) => base + i + 2 * j + 4 * k;
    quad(mesh, v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1), f.out);
    quad(mesh, v(0, 1, 0), v(1, 1, 0), v(1, 1, 1), v(0, 1, 1), UP);
    quad(mesh, v(0, 0, 0), v(1, 0, 0), v(1, 0, 1), v(0, 0, 1), DOWN);
    for (const i of [0, 1]) quad(mesh, v(i, 0, 0), v(i, 1, 0), v(i, 1, 1), v(i, 0, 1), i ? f.along : f.along.clone().negate());
  };
  const chimney = (mesh) => {
    for (let y = chimneyFoot; y < top - 0.05;) {
      const rest = top - y, tall = rest < 0.5 ? rest : 0.22 + 0.13 * r(), mid = y + tall / 2, cap = y > top - 0.36 ? 0.05 : 0;
      const bare = bareAt(mid), soot = sootAt(mid);
      for (const f of STACK) {
        if (f.above !== undefined && y < f.above) continue;
        const { from, to } = f.run(mid);
        for (let t = from; t < to - 0.08;) {
          const long = 0.3 + 0.34 * r(), length = to - (t + long) < 0.17 ? to - t : long;          // no sliver at a course's end
          block(mesh, f, y, t + length / 2, length - 0.024, tall - 0.02, 0.04 + 0.05 * r() + cap, (0.55 + 0.45 * r()) * soot, bare);
          t += length;
        }
      }
      y += tall;
    }
  };
  // The footing: stones stacked dry under the four walls, as many courses as the ground asks for; none where
  // the chimney stands. Behind them a band of stone under each wall, which is all the coarser level has of the
  // footing: a stone's roots lie on it, a finger proud of it.
  const band = (mesh, sky) => {
    for (const wall of walls) {
      const a = P(wall, wall.from, 0), b = P(wall, wall.to, 0);
      rockFace(mesh, [V(a.x, G(a.x, a.z) - 0.12, a.z), V(b.x, G(b.x, b.z) - 0.12, b.z), V(b.x, Y(FOOT), b.z), V(a.x, Y(FOOT), a.z)], wall.out, sky, 0.2);
    }
  };
  const footing = (mesh) => {
    for (const wall of walls) {
      const skip = wall.name === 'west' ? [HEARTH.z - HEARTH.half - 0.1, HEARTH.z + HEARTH.half + 0.1] : null, turn0 = wall.along === 'x' ? 0 : Math.PI / 2;
      for (let t = wall.from; t < wall.to;) {
        const long = 0.32 + 0.26 * r(), wide = 0.32 + 0.1 * r(), mid = Math.min(wall.to, t + long / 2), at = P(wall, mid, 0, -0.06), ground = G(at.x, at.z) - 0.08, tall = Y(FOOT) - ground;
        const turn = turn0 + (r() - 0.5) * 0.3, sky = 0.75 + 0.25 * r(), base = mesh.vertexCount;
        t += long * (0.86 + 0.1 * r());
        if (skip && mid > skip[0] && mid < skip[1]) continue;
        if (tall > 0.36) {
          const lower = tall * (0.5 + 0.12 * r());
          stone(mesh, V(at.x, ground, at.z), long * 1.15, wide * 1.2, lower, turn, { sky: sky * 0.9, rand: r });
          stone(mesh, V(at.x + (r() - 0.5) * 0.06, ground + lower - 0.03, at.z + (r() - 0.5) * 0.06), long * 0.92, wide, tall - lower + 0.03, turn + (r() - 0.5) * 0.4, { sky, sunk: -1, rand: r });
        } else stone(mesh, V(at.x, ground, at.z), long, wide, Math.max(0.1, tall), turn, { sky, rand: r });
        for (let v = base; v < mesh.vertexCount; v += 1) {
          const o = v * 3, along = Math.min(wall.to, Math.max(wall.from, wall.along === 'x' ? mesh.position[o] : mesh.position[o + 2])), on = P(wall, along, 0, 0.012);
          mesh.root[o] = on.x; mesh.root[o + 1] = Math.min(Y(FOOT), mesh.position[o + 1]); mesh.root[o + 2] = on.z;
        }
      }
    }
  };
  // the step at the door, and three flat stones from it towards the trail: the same in both levels
  const steps = (mesh) => {
    const base = mesh.vertexCount, x = (DOOR.x0 + DOOR.x1) / 2;
    const ground = (px, pz) => G(px, pz) - 0.05;
    stone(mesh, V(x, ground(x, -HZ - 0.36), -HZ - 0.36), 1.18, 0.56, Math.max(0.1, Y(FOOT) - 0.16 - ground(x, -HZ - 0.36)), 0.04, { sky: 1, lump: 0.1, rand: r });
    for (const [dx, dz, long, wide, turn] of [[0.08, -1.08, 0.6, 0.44, 0.3], [0.2, -1.74, 0.52, 0.4, -0.2], [0.26, -2.34, 0.56, 0.42, 0.5]]) {
      // (none in the tread itself: the walk's own worn earth takes over there)
      if (site.tread && site.tread(x + dx, -HZ + dz) < 0.95) continue;
      stone(mesh, V(x + dx, ground(x + dx, -HZ + dz) - 0.02, -HZ + dz), long, wide, 0.11, turn, { sky: 1, sunk: 0.05, lump: 0.16, rand: r });
    }
    for (let v = base; v < mesh.vertexCount; v += 1) for (let k = 0; k < 3; k += 1) mesh.root[v * 3 + k] = mesh.position[v * 3 + k];
  };
  const rock = [new Mesh(), new Mesh()];
  core(rock[0], 0.4); chimney(rock[0]); band(rock[0], 0.4); footing(rock[0]); steps(rock[0]);
  core(rock[1], 0.85); band(rock[1], 0.8); steps(rock[1]);

  // (`height` is above the record's own height, `reach` out from its spot: the stones to the trail reach furthest)
  const limits = { lod: [NEAR], handWood: [0.35], max: 260, gone: 320 };
  return {
    wood: { solid: wood.map((m) => m.geometry()), height: F + CABIN.ridge + 0.2, reach: 3.8, ...limits },
    roof: { solid: roof.map((m) => m.geometry()), ...(leaf.vertexCount ? { foliage: [leaf.geometry()] } : {}), height: F + CABIN.ridge + 0.5, reach: 4.1, ...limits },
    stone: { solid: rock.map((m) => m.geometry()), height: F + top + 0.3, reach: 5.2, ...limits },
  };
}
