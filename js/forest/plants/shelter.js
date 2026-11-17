import * as THREE from 'three';
import { Mesh, sheetCell } from './build.js';
import { mulberry32 } from '../world/layout.js';
import { face, pole, board, stone } from './carpentry.js';

// The trail shelter in the old clearing: the relic the owner chose ("A trail shelter"). It is the kind the
// Forest Service built along these valleys' trails from about 1907 to 1938, which the one study read calls
// the pole-and-shake Adirondack: three walls and an open front, a frame of peeled poles clad in split cedar,
// a roof of split cedar shakes in a modified gable (its ridge forward of the middle: a short slope over the
// open front and a long one down to a low back wall), on a dry-stacked stone footing of a few courses, with a
// dirt floor, about 14 feet square.
//
// What was read (2026-11-15; agents reading a university thesis on the Olympic shelters through a tool that
// returns a page's text or a summary of it, encyclopedia pages on single shelters and the state's register;
// none of it seen as an image, and the register's own forms could not be read at all): the four types and
// their dates; of the first, "a wood frame with whole or split log supports", three walls, the stone footing,
// dirt floors, a roof of split cedar shakes, about 14 x 14 ft, two to four bunks; that the North Fork Sol Duc
// shelter (about 1932) has a peeled log frame with vertical split board siding and no floor, and Elkhorn a
// saltbox profile; that Fifteen Mile and Hyak (1928) on the Bogachiel and Happy Four (1935) on the Hoh are of
// this type; that of ninety shelters eighteen stand; and that the survivors' roofs carry "organic growth",
// their sills and purlins rot and one leans. Not found: any wall height, roof pitch or depth of overhang,
// and which type was commonest on the west-side rivers. So every height and slope here is the agent's
// drawing, and so is the choice of this type over the plan's "three walls of logs".
// It has no bunks: the owner's pick was "No boardwalk, no bench", and it is a relic.
//
// It is built for the spot it stands on, in its own frame: x towards its open front, z across it, y up from
// the height its record has (the ground at its middle). `site.ground(x, z)` is the ground's height there above
// that. Its sills lie level on the footing, a hand above the ground at the uphill corners; the footing takes
// up the slope.
//
// It comes as two kinds, for the two materials: `wood` (the bark's material with BARE, and on it the moss and
// licorice fern of the maples' sheet, as foliage) and `stone` (the rock's material).
export const SHELTER = { half: 2.15, heart: [0, 1.6, 0], height: 3.2 };

const HALF = SHELTER.half;               // half its side: 14 ft square
const RIDGE_X = 0.75, RIDGE_Y = 2.95;    // the ridge: forward of the middle, and its height above the sills
const BACK = Math.tan(25.8 * Math.PI / 180), FRONT = Math.tan(20 * Math.PI / 180);     // the two slopes
const EAVE_BACK = -2.6, EAVE_FRONT = 2.75, RAKE = 2.45;                              // where the roof ends: behind, in front, and to either side
const SAG = 0.05;                        // how far its purlins have sagged between the gable walls
const SKIN = 0.04;                       // the shakes' thickness as the coarser level has them: one slab
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

export function buildShelter(sheets, site) {
  const r = mulberry32(1934), G = site.ground;
  // The sills lie level, a hand above the ground at the highest corner of the three walls.
  let floor = -Infinity;
  for (const [x, z] of [[-HALF, -HALF], [-HALF, 0], [-HALF, HALF], [0, -HALF], [0, HALF], [HALF, -HALF], [HALF, HALF]]) floor = Math.max(floor, G(x, z));
  floor += 0.1;
  // the plane the shakes lie on, above the sills: two slopes from the ridge, sagged between the gable walls
  const roofAt = (x, z) => floor + (x <= RIDGE_X ? RIDGE_Y - BACK * (RIDGE_X - x) : RIDGE_Y - FRONT * (x - RIDGE_X)) - SAG * (1 - (z / RAKE) ** 2);
  const slopes = [
    { from: EAVE_BACK, to: RIDGE_X + 0.07, way: 1, tan: BACK },      // the long one behind; its last course stands a little past the ridge
    { from: EAVE_FRONT, to: RIDGE_X, way: -1, tan: FRONT },         // the short one over the open front
  ].map((s) => {
    const cos = 1 / Math.hypot(1, s.tan), sin = s.tan * cos;
    // (a slope's own plane, and not the roof's: past the ridge the long slope goes on up, where read from roofAt
    // its last course bent down over the ridge and went in under the short slope's shakes: the cabin's roof had
    // the same fault, which a review read there)
    const own = s.way > 0 ? (x) => RIDGE_Y - BACK * (RIDGE_X - x) : (x) => RIDGE_Y - FRONT * (x - RIDGE_X);
    return { ...s, cos, length: Math.abs(s.to - s.from) / cos, up: V(s.way * cos, sin, 0), normal: V(-s.way * sin, cos, 0), at: (d, z, lift) => { const x = s.from + s.way * d * cos; return V(x, floor + own(x) - SAG * (1 - (z / RAKE) ** 2), z).addScaledVector(V(-s.way * sin, cos, 0), lift); } };
  });

  // ---- what both levels have, the same in each: the roof's underside, the corner posts, the header, the sills
  const common = (mesh) => {
    for (const s of slopes) {
      // the underside, as it is seen from inside and from under the eaves: dark, the sun never on it
      const cols = [-RAKE, 0, RAKE], rows = [0, s.length];
      for (let i = 0; i < 2; i += 1) {
        const corners = [s.at(rows[0], cols[i], -0.012), s.at(rows[0], cols[i + 1], -0.012), s.at(rows[1], cols[i + 1], -0.012), s.at(rows[1], cols[i], -0.012)];
        face(mesh, corners, V(0, -1, 0), { grain: s.up, shade: 0.8, offset: [2.3 + i, 0.4] });
      }
    }
    // the corner posts: the front pair carry the header, the back pair the back plate
    for (const [x, z] of [[-HALF, -HALF], [-HALF, HALF], [HALF, -HALF], [HALF, HALF]]) {
      const top = roofAt(x, z) - 0.2, lean = x > 0 ? 0.02 : 0;
      pole(mesh, [V(x, floor + 0.02, z), V(x + lean, (floor + top) / 2, z + (z > 0 ? 0.012 : -0.012)), V(x, top, z)], [0.098, 0.09, 0.084], { sides: 6, shade: x > 0 ? 0.05 : 0.3 });
    }
    // the header over the open front, and the back plate
    for (const [x, radius] of [[HALF, 0.09], [-HALF, 0.08]]) {
      const points = [-RAKE + 0.07, 0, RAKE - 0.07].map((z) => V(x, roofAt(x, z) - 0.012 - radius, z));
      pole(mesh, points, [radius, radius * 0.96, radius * 0.92], { sides: 6, shade: [0.2, 0.45, 0.2] });
    }
    // the sills, on the footing: one behind and one down either side, their ends past the corners
    pole(mesh, [V(-HALF, floor, -HALF - 0.22), V(-HALF, floor, 0), V(-HALF, floor, HALF + 0.22)], [0.115, 0.11, 0.105], { sides: 6, shade: 0.15 });
    for (const z of [-HALF, HALF]) pole(mesh, [V(-HALF - 0.22, floor + 0.05, z), V(0, floor + 0.05, z), V(HALF + 0.2, floor + 0.05, z)], [0.11, 0.105, 0.1], { sides: 6, shade: 0.15 });
  };

  // ---- the walls: split boards set upright, from the sill to the roof, a little out of line and out of true
  const walls = [
    { fixed: 'x', at: -HALF - 0.1, out: V(-1, 0, 0), from: -HALF - 0.14, to: HALF + 0.14, missing: [], short: [7] },             // behind
    { fixed: 'z', at: -HALF - 0.1, out: V(0, 0, -1), from: -HALF - 0.14, to: HALF + 0.1, missing: [9], short: [] },             // to the left of someone looking out
    { fixed: 'z', at: HALF + 0.1, out: V(0, 0, 1), from: -HALF - 0.14, to: HALF + 0.1, missing: [15], short: [3] },
  ];
  const wallPoint = (wall, t, y, off = 0) => (wall.fixed === 'x' ? V(wall.at + wall.out.x * off, y, t) : V(t, y, wall.at + wall.out.z * off));
  const wallTop = (wall, t) => (wall.fixed === 'x' ? roofAt(wall.at, t) : roofAt(t, wall.at)) - 0.035;
  const boards = (mesh) => {
    for (const wall of walls) {
      const edges = [wall.from];
      while (edges[edges.length - 1] < wall.to - 0.1) edges.push(Math.min(wall.to, edges[edges.length - 1] + 0.13 + 0.14 * r()));
      edges[edges.length - 1] = wall.to;
      for (let i = 0; i < edges.length - 1; i += 1) {
        const draws = [r(), r(), r(), r(), r()];
        if (wall.missing.includes(i)) continue;
        const t0 = edges[i] + 0.004, t1 = edges[i + 1] - 0.004, off = 0.022 * draws[0], lean = 0.014 * (draws[1] - 0.5);
        const foot = floor + 0.07 + 0.05 * draws[2], short = wall.short.includes(i) ? 0.45 + 0.3 * draws[3] : 0;          // one has broken off short of the roof
        const y0 = wallTop(wall, t0) - short, y1 = wallTop(wall, t1) - short * (0.8 + 0.4 * draws[4]);
        const corners = [wallPoint(wall, t0, foot, off), wallPoint(wall, t1, foot, off), wallPoint(wall, t1 + lean, y1, off + lean), wallPoint(wall, t0 + lean, y0, off + lean)];
        // in the coarser level the wall is one slab: a board's corners go to its plane, and the boards either
        // side of a gap close it between them
        const r0 = wall.missing.includes(i - 1) ? (edges[i - 1] + edges[i]) / 2 : edges[i], r1 = wall.missing.includes(i + 1) ? (edges[i + 1] + edges[i + 2]) / 2 : edges[i + 1];
        const roots = [wallPoint(wall, r0, foot), wallPoint(wall, r1, foot), wallPoint(wall, r1, wallTop(wall, r1)), wallPoint(wall, r0, wallTop(wall, r0))];
        // (no two were split from one bolt: some have weathered darker than their neighbours)
        board(mesh, corners, wall.out, { thick: 0.024, inner: 0.78, shade: 0.3 * draws[1] * draws[1], offset: [7 * draws[3], 3 * draws[4]], roots, grain: UP });
      }
    }
  };
  const slabs = (mesh) => {
    for (const wall of walls) {
      const corners = [wallPoint(wall, wall.from, floor + 0.07), wallPoint(wall, wall.to, floor + 0.07), wallPoint(wall, wall.to, wallTop(wall, wall.to)), wallPoint(wall, wall.from, wallTop(wall, wall.from))];
      // (a side wall's top is not one line: it climbs to the ridge and comes down again)
      if (wall.fixed === 'z') {
        const ridge = wallPoint(wall, RIDGE_X, wallTop(wall, RIDGE_X)), foot = wallPoint(wall, RIDGE_X, floor + 0.07);
        for (const part of [[corners[0], foot, ridge, corners[3]], [foot, corners[1], corners[2], ridge]]) board(mesh, part, wall.out, { thick: 0.024, inner: 0.78, shade: 0.08, grain: UP, offset: [1.3, 0.2] });
      } else board(mesh, corners, wall.out, { thick: 0.024, inner: 0.78, shade: 0.08, grain: UP, offset: [4.1, 0.7] });
    }
  };

  // ---- the roof: split shakes in courses, each a little out of line with its neighbours
  const EXPOSED = 0.28;
  const shakes = (mesh) => {
    for (const s of slopes) {
      const courses = Math.ceil(s.length / EXPOSED);
      for (let k = 0; k < courses; k += 1) {
        const d0 = k * EXPOSED, d1 = Math.min(s.length, d0 + EXPOSED + 0.03);
        let z = -RAKE - 0.03 * r();
        while (z < RAKE - 0.03) {
          const draws = [r(), r(), r(), r(), r(), r()];
          const wide = 0.1 + 0.15 * draws[0], z0 = z, z1 = Math.min(RAKE + 0.03 * draws[1], z + wide);
          z = z1;
          // its butt hangs a finger lower or higher than its neighbour's; now and then one has slipped
          const butt = d0 + 0.03 * (draws[2] - 0.5) - (draws[3] < 0.05 ? 0.05 + 0.08 * draws[4] : 0), roll = 0.007 * (draws[4] - 0.5);
          const corners = [s.at(butt, z0, 0.05 + roll), s.at(butt, z1, 0.05 - roll), s.at(d1, z1, 0.03), s.at(d1, z0, 0.03)];
          const roots = [s.at(Math.max(0, d0), z0, SKIN), s.at(Math.max(0, d0), z1, SKIN), s.at(d1, z1, SKIN), s.at(d1, z0, SKIN)];
          const offset = [9 * draws[5], 4 * draws[2]];
          face(mesh, corners, s.normal, { grain: s.up, offset, roots, shade: 0.22 * draws[1] * draws[1] });
          // its butt end: the edge of a split, in its own shade
          face(mesh, [corners[0], corners[1], s.at(butt, z1, 0.026), s.at(butt, z0, 0.026)], V(-s.up.x, -s.up.y, 0), { grain: s.normal, offset, shade: 0.4, roots: [roots[0], roots[1], roots[1], roots[0]] });
        }
      }
    }
  };
  // The roof's own edge, from near by: from its underside up to the shakes, under their butts along the eaves and
  // under their ends at the gables (a finger inside the gables' edges: moss hangs in that plane). Without it the
  // slot between the underside and the shakes was open, and from below at a gable the roof was a centimetre
  // thick at its edge with the wood beyond showing through (a review read that; frames drawn with back faces on
  // showed it). The coarser level's slab has these edges (roofSlabs), and these lie down onto them.
  const edges = (mesh) => {
    for (const s of slopes) {
      const cols = [-RAKE, 0, RAKE];
      for (let i = 0; i < 2; i += 1) {
        const low = [s.at(0, cols[i + 1], -0.012), s.at(0, cols[i], -0.012)];
        face(mesh, [s.at(0, cols[i], 0.026), s.at(0, cols[i + 1], 0.026), ...low], V(-s.up.x, -s.up.y, 0), { grain: s.normal, shade: 0.4, roots: [s.at(0, cols[i], SKIN), s.at(0, cols[i + 1], SKIN), ...low] });
      }
      for (const z of [-RAKE, RAKE]) {
        const zi = z - Math.sign(z) * 0.008;
        face(mesh, [s.at(0, zi, 0.03), s.at(s.length, zi, 0.03), s.at(s.length, zi, -0.012), s.at(0, zi, -0.012)], V(0, 0, Math.sign(z)), { grain: s.up, shade: 0.3, roots: [s.at(0, z, SKIN), s.at(s.length, z, SKIN), s.at(s.length, z, -0.012), s.at(0, z, -0.012)] });
      }
    }
  };
  const roofSlabs = (mesh) => {
    for (const s of slopes) {
      const cols = [-RAKE, 0, RAKE];
      for (let i = 0; i < 2; i += 1) {
        face(mesh, [s.at(0, cols[i], SKIN), s.at(0, cols[i + 1], SKIN), s.at(s.length, cols[i + 1], SKIN), s.at(s.length, cols[i], SKIN)], s.normal, { grain: s.up, offset: [5.7 + i, 1.9] });
        // its edge at the eave
        face(mesh, [s.at(0, cols[i], SKIN), s.at(0, cols[i + 1], SKIN), s.at(0, cols[i + 1], -0.012), s.at(0, cols[i], -0.012)], V(-s.up.x, -s.up.y, 0), { grain: s.normal, shade: 0.4 });
      }
      // and at either gable
      for (const z of [-RAKE, RAKE]) face(mesh, [s.at(0, z, SKIN), s.at(s.length, z, SKIN), s.at(s.length, z, -0.012), s.at(0, z, -0.012)], V(0, 0, Math.sign(z)), { grain: s.up, shade: 0.3 });
    }
  };

  // ---- the poles only the near level has: they thin away as it goes
  const frame = (mesh) => {
    // posts under the ridge in either gable wall, and one in the middle of the back wall
    for (const [x, z] of [[RIDGE_X, -HALF], [RIDGE_X, HALF], [-HALF, 0]]) pole(mesh, [V(x, floor + 0.05, z), V(x, roofAt(x, z) - 0.2, z)], [0.08, 0.07], { sides: 5, shade: 0.4, drop: true });
    // the purlins the shakes are nailed to, their ends out under the gables' edges; the ridge pole is the stoutest
    for (const [x, radius] of [[-1.2, 0.062], [-0.25, 0.062], [RIDGE_X, 0.08], [1.45, 0.062]]) {
      const points = [-RAKE + 0.05, -HALF, 0, HALF, RAKE - 0.05].map((z) => V(x, roofAt(x, z) - 0.014 - radius, z));
      pole(mesh, points, points.map((_, i) => radius * (1 - 0.03 * i)), { sides: 5, shade: [0.25, 0.6, 0.7, 0.6, 0.25], drop: true });
    }
    // the rafter along the top of either gable wall, under the purlins
    for (const z of [-HALF, HALF]) {
      const points = [-HALF - 0.25, RIDGE_X, HALF + 0.35].map((x) => V(x, roofAt(x, z) - 0.2, z));
      pole(mesh, points, [0.07, 0.075, 0.066], { sides: 5, shade: 0.35, drop: true });
    }
    // a brace from either front post up to the header
    for (const z of [-HALF, HALF]) {
      const inward = -Math.sign(z);
      pole(mesh, [V(HALF, floor + 1.42, z + inward * 0.06), V(HALF, roofAt(HALF, z) - 0.21, z + inward * 0.66)], [0.05, 0.044], { sides: 5, shade: 0.2, drop: true });
    }
    // and a log across the open front, lying on the ground: what is left of the sill there
    const ends = [-HALF - 0.1, 0, HALF + 0.1].map((z) => V(HALF + 0.12, G(HALF + 0.12, z) + 0.05, z));
    pole(mesh, ends, [0.12, 0.115, 0.11], { sides: 6, shade: 0.1, drop: true });
  };

  const near = new Mesh(), far = new Mesh();
  common(near); boards(near); shakes(near); edges(near); frame(near);
  common(far); slabs(far); roofSlabs(far);

  // ---- what grows on it (the maples' sheet): moss in lengths under the eaves and the gables' edges, and
  // licorice fern in the moss along the ridge and down the long slope
  const leaf = new Mesh();
  if (sheets.maple) {
    const sheet = sheets.maple, pick = (list) => sheetCell(list[Math.floor(r() * list.length)], sheet.cells);
    const cards = [];
    const add = (origin, along, across, cell, options) => cards.push({ y: origin.y, origin, along, across, cell, normal: new THREE.Vector3().crossVectors(along, across).normalize(), options });
    // a length of moss hanging from the roof's edge between two points of it
    const curtain = (a, b, tall) => {
      const across = V(0, tall, 0), along = new THREE.Vector3().subVectors(b, a), root = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      // (the edge is along the top of the painting, a little way down from the cell's own)
      add(a.clone().addScaledVector(across, -0.4), along, across, pick(sheet.moss), { sway: [0.1, 0.1], variation: r(), root });
    };
    for (const s of slopes) {
      // under its eave: lengths with gaps between them, the longer where the roof sags
      for (let z = -RAKE + 0.1; z < RAKE - 0.5;) {
        const long = 0.6 + 0.6 * r(), gap = 0.25 * r() * r();
        if (r() < 0.55) curtain(s.at(0.01, z, 0.02), s.at(0.01, Math.min(RAKE, z + long), 0.02), (s.way > 0 ? 0.26 : 0.19) * (0.7 + 0.6 * r()));
        z += long + gap + 0.3 * r();
      }
      // under either gable's edge, where it is not too steep to hold
      for (const z of [-RAKE, RAKE]) {
        for (let d = 0.2; d < s.length - 0.7;) {
          const long = 0.6 + 0.5 * r();
          if (r() < 0.3) curtain(s.at(d, z, 0.02), s.at(d + long, z, 0.02), 0.17 * (0.7 + 0.6 * r()));
          d += long + 0.6 * r();
        }
      }
    }
    // Licorice fern: a tuft is a card on edge, the moss it grows from along the painting's foot. It runs level
    // across the slope, a little askew, and its foot is on the shakes: one that ran up the slope went through
    // the roof at its upper end, and its fronds showed inside.
    const tuft = (at, turn, long, tall) => {
      const run = V(Math.cos(turn), 0, Math.sin(turn)), across = V(0, tall, 0);
      add(at.clone().addScaledVector(run, -long / 2).addScaledVector(across, 0.5).addScaledVector(UP, 0.02 + 0.5 * long * Math.abs(run.x) * BACK), run.multiplyScalar(long), across, pick(sheet.fern), { sway: [0.08, 0.08], variation: r(), root: at });
    };
    const [back, front] = slopes;
    for (let i = 0; i < 5; i += 1) tuft(back.at(back.length - 0.1 - 0.25 * r(), -RAKE + 0.5 + (2 * RAKE - 1) * (i + 0.3 + 0.4 * r()) / 5, 0.03), 1.5708 + (r() - 0.5) * 0.7, 0.7 + 0.5 * r(), 0.34 + 0.16 * r());
    for (let i = 0; i < 7; i += 1) tuft(back.at(0.3 + (back.length - 0.9) * r(), -RAKE + 0.4 + (2 * RAKE - 0.8) * r(), 0.03), 1.5708 + (r() - 0.5) * 0.5, 0.6 + 0.5 * r(), 0.28 + 0.16 * r());
    for (let i = 0; i < 3; i += 1) tuft(front.at(0.25 + (front.length - 0.8) * r(), -RAKE + 0.4 + (2 * RAKE - 0.8) * r(), 0.03), 1.5708 + (r() - 0.5) * 0.5, 0.6 + 0.4 * r(), 0.26 + 0.12 * r());
    cards.sort((a, b) => a.y - b.y);
    for (const card of cards) leaf.card(card.origin, card.along, card.across, card.cell, card.normal, card.options);
  }

  // ---- the footing: stones stacked dry under the three sills, as many courses as the ground asks for
  const rocks = new Mesh();
  const course = (line, top) => {
    // `line(t)` runs along a sill, t in metres; a stone's foot is in the ground, and its top carries the sill
    for (let t = line.from; t < line.to;) {
      const long = 0.3 + 0.24 * r(), wide = 0.3 + 0.1 * r(), at = line.at(Math.min(line.to, t + long / 2)), ground = G(at.x, at.z) - 0.07, tall = top - ground;
      const turn = line.turn + (r() - 0.5) * 0.35, sky = 0.75 + 0.25 * r();
      if (tall > 0.36) {
        // two courses: a broad stone below, and a smaller one on it, set off to one side
        const lower = tall * (0.5 + 0.12 * r());
        stone(rocks, V(at.x, ground, at.z), long * 1.15, wide * 1.2, lower, turn, { sky: sky * 0.9, rand: r });
        stone(rocks, V(at.x + (r() - 0.5) * 0.08, ground + lower - 0.03, at.z + (r() - 0.5) * 0.08), long * 0.92, wide, tall - lower + 0.03, turn + (r() - 0.5) * 0.5, { sky, sunk: -1, rand: r });
      } else stone(rocks, V(at.x, ground, at.z), long, wide, Math.max(0.1, tall), turn, { sky, rand: r });
      t += long * (0.86 + 0.1 * r());
    }
  };
  course({ from: -HALF - 0.3, to: HALF + 0.3, turn: 1.5708, at: (t) => V(-HALF, 0, t) }, floor - 0.1);
  for (const z of [-HALF, HALF]) course({ from: -HALF + 0.25, to: HALF + 0.25, turn: 0, at: (t) => V(t, 0, z) }, floor - 0.05);

  const wood = { solid: [near.geometry(), far.geometry()], ...(leaf.vertexCount ? { foliage: [leaf.geometry()] } : {}), height: SHELTER.height, reach: 4.2, lod: [30], handWood: [0.35], max: 130, gone: 165 };
  const footing = { solid: [rocks.geometry()], height: 0.8, reach: 4, lod: [], max: 70, gone: 95, casts: false };
  return { wood, footing, floor };
}
