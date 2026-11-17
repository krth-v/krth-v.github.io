import * as THREE from 'three';
import { Mesh } from './build.js';
import { mulberry32 } from '../world/layout.js';
import { FALLS, SHAPE } from '../world/land.js';
import { makeNoise } from '../world/terrain.js';

// The rock of the falls: the ledge the creek goes over, and the walls of the bowl it has dug at the ledge's
// foot. It is not a plant, but it is laid and drawn as one: the layout sets it down (a kind of its own, placed
// by a scene), and the instancer draws it at two levels of detail, one turning into the other.
//
// There is one of it, built for the spot it stands on, in the world's own east, height and south measured from
// its record (which is set down at height 0, so its heights are the world's). The ground under it is a slope
// the lattice can hold; the rock stands on that slope and hides it. The ground's own drop at the falls is a
// funnel two and a half metres long (world/land.js FALLS): the rock's face stands in front of it and the
// rock's top roofs it over.
//
// It is bedded rock: it climbs from its foot in steps, a riser and a tread to each, and the steps are broken
// along the wall into blocks that stand a little forward or back and a little high or low. (With four beds,
// their tops level and their painted beds hard-edged, it was a concrete spillway, striped.)
//
// Lengths are metres.
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// Six beds. The lower three stand nearly one on another, each set back from the one below by a ledge a hand
// wide: a face, but a face of beds. The upper three go back up the slope in treads a stride deep.
const STEPS = 6;
const RISE = [0.2, 0.4, 0.58, 0.74, 0.88, 1.0];         // how much of its whole height the rock has climbed at the top of each step
const BACK = [0.05, 0.12, 0.26, 0.52, 0.78, 1.0];       // how much of its whole depth it has gone back at the back of each tread
// rows of a station's profile, near level: foot, belly, then to each step the start of its top's chamfer, its top, its tread's back; then the dive
const ROWS = 3 * STEPS + 3;
// (the far level's rows, 2 * STEPS + 2 of them: foot, then to each step its top and its tread's back; then the dive)
// where a near row lies in the far level's rows: [row, share of the way to the next]
const ONTO = (() => {
  const map = [[0, 0], [0, 0.45]];
  for (let k = 0; k < STEPS; k += 1) map.push([2 * k, 0.9], [2 * k + 1, 0], [2 * k + 2, 0]);
  map.push([2 * STEPS + 1, 0]);
  return map;
})();

// A grid of points as a surface: `points[i][j]` (THREE.Vector3), i along it and j up it, `extra[i][j]` =
// [how open to the sky's light, how wet, how bare of moss, how much of the forest's litter lies over it].
// Normals are the grid's own. `flip` turns its faces.
// With `far` (a grid drawn the same way) and `onto(i, j)` = [far i, share along, far j, share up], every point's
// root is the point of the far grid's own triangles it turns into.
function surface(mesh, points, extra, flip, far = null, onto = null) {
  const n = points.length, m = points[0].length, base = mesh.vertexCount;
  const du = new THREE.Vector3(), dv = new THREE.Vector3(), normal = new THREE.Vector3(), root = new THREE.Vector3();
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < m; j += 1) {
      const p = points[i][j];
      du.subVectors(points[Math.min(n - 1, i + 1)][j], points[Math.max(0, i - 1)][j]);
      dv.subVectors(points[i][Math.min(m - 1, j + 1)], points[i][Math.max(0, j - 1)]);
      normal.crossVectors(du, dv);
      if (normal.lengthSq() < 1e-12) normal.set(0, 1, 0); else normal.normalize();
      if (flip) normal.negate();
      mesh.position.push(p.x, p.y, p.z);
      if (far) {
        const [fi, f, fj, g] = onto(i, j), a = far[fi][fj], b = far[Math.min(far.length - 1, fi + 1)][fj], c = far[fi][Math.min(far[0].length - 1, fj + 1)], d = far[Math.min(far.length - 1, fi + 1)][Math.min(far[0].length - 1, fj + 1)];
        // the far grid's quad is cut from b to c: the point is on one of its two triangles, not on the patch between its corners
        if (f + g <= 1) root.copy(a).addScaledVector(du.subVectors(b, a), f).addScaledVector(dv.subVectors(c, a), g);
        else root.copy(d).addScaledVector(du.subVectors(c, d), 1 - f).addScaledVector(dv.subVectors(b, d), 1 - g);
        mesh.root.push(root.x, root.y, root.z);
      } else mesh.root.push(p.x, p.y, p.z);
      mesh.normal.push(normal.x, normal.y, normal.z);
      mesh.uv.push(extra[i][j][0], extra[i][j][3] || 0);
      mesh.wind.push(extra[i][j][1], extra[i][j][2]);
    }
  }
  for (let i = 0; i < n - 1; i += 1) {
    for (let j = 0; j < m - 1; j += 1) {
      const a = base + i * m + j, b = a + m, c = a + 1, d = b + 1;
      if (flip) mesh.index.push(a, c, b, b, c, d); else mesh.index.push(a, b, c, b, d, c);
    }
  }
}

// site: { x, y, z, terrain, trail }: where the layout has set it down (its y is 0), the ground, and the walk.
export function buildFallsRock(site) {
  const r = mulberry32(8123), ground = (x, z) => site.terrain.surfaceAt(x, z);
  const pool = SHAPE.CREEK[FALLS.sill][2] + SHAPE.CREEK_DEEP;                  // the pool's water stands at about this height
  const near = new Mesh(), far = new Mesh(), lump = makeNoise(31);

  // ---- a run of ledges -----------------------------------------------------------------------------
  // `line` is its face in plan, [x, z, top] at each of its points, the open side on the left of the way it
  // runs. `notch` (optional) is where the creek comes over it: { point: which of the line's points, half: half
  // the width of its floor, side: how wide each of its sides is, floor: the height of its floor, and reach and wide,
  // for which see `topAt` and where it is called }.
  const ledges = (line, { notch = null, every = 0.45, coarse = 1.3 } = {}) => {
    // the face line, smooth through its points, as a table every few centimetres
    const fine = [], starts = [];
    const P = (k) => line[Math.min(line.length - 1, Math.max(0, k))];
    for (let k = 0; k < line.length - 1; k += 1) {
      starts.push(fine.length);
      const p0 = P(k - 1), p1 = P(k), p2 = P(k + 1), p3 = P(k + 2), parts = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 0.05));
      for (let q = 0; q < parts + (k === line.length - 2 ? 1 : 0); q += 1) {
        const t = q / parts, t2 = t * t, t3 = t2 * t;
        const cr = (c) => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3);
        fine.push([cr(0), cr(1), lerp(p1[2], p2[2], t * t * (3 - 2 * t)), 0]);
      }
    }
    for (let k = 1; k < fine.length; k += 1) fine[k][3] = fine[k - 1][3] + Math.hypot(fine[k][0] - fine[k - 1][0], fine[k][1] - fine[k - 1][1]);
    const length = fine[fine.length - 1][3];
    if (notch) notch = { ...notch, at: fine[starts[notch.point]][3] };
    const at = (u) => {                                                         // [x, z, top, outward x, outward z] u metres along the face
      let k = Math.min(fine.length - 2, Math.max(0, Math.floor((u / length) * (fine.length - 1))));
      while (k > 0 && fine[k][3] > u) k -= 1;
      while (k < fine.length - 2 && fine[k + 1][3] < u) k += 1;
      const a = fine[k], b = fine[k + 1], t = clamp01((u - a[3]) / Math.max(1e-6, b[3] - a[3]));
      const lo = fine[Math.max(0, k - 3)], hi = fine[Math.min(fine.length - 1, k + 4)], tx = hi[0] - lo[0], tz = hi[1] - lo[1], inv = 1 / Math.hypot(tx, tz);
      return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), tz * inv, -tx * inv];
    };
    const cut = (u) => (notch ? 1 - smooth(notch.half, notch.half + notch.side, Math.abs(u - notch.at)) : 0);       // 1 in the creek's notch
    // Round the notch the rock is the end of the creek's gully. The ground's lattice cannot end a gully in a
    // drop: it makes a funnel of it, two and a half metres long and six across, and the rock roofs the funnel
    // over. So there its top is the gully's own section, bed and banks, as the ground has it beyond the funnel
    // (`reach` behind the face), level from there to the face, and its ledges are all in its face. Left at the
    // bowl's rim's height right across with a slot cut in it for the water, it stood up out of the gully like a
    // weir; with its ledges a stride deep, as the bowl's walls have them, they lay in the funnel as slabs lower
    // than the water that ran between them.
    const head = (u) => (notch ? 1 - smooth(notch.wide, notch.wide + 0.7, Math.abs(u - notch.at)) : 0);
    const topAt = (u) => {
      const [x, z, top, ox, oz] = at(u);
      if (!notch) return top;
      const w = head(u), level = w > 0 ? lerp(top, Math.min(top, ground(x - ox * notch.reach, z - oz * notch.reach) + 0.05), w) : top;
      return lerp(level, notch.floor, cut(u));
    };

    // each step is broken into blocks along the wall, each standing a little forward or back, high or low
    const joints = [], blocks = [];
    for (let k = 0; k <= STEPS; k += 1) {
      const edges = [0];
      while (edges[edges.length - 1] < length) edges.push(edges[edges.length - 1] + 0.8 + 1.9 * r());
      blocks.push(edges.map(() => [(r() - 0.4) * 0.26 * (k < 3 ? 1.5 : 1), (r() - 0.5) * 0.16, r()]));
      for (const e of edges.slice(1, -1)) if (!(notch && Math.abs(e - notch.at) < notch.half + 0.5)) joints.push(e);
      blocks[k].edges = edges;
    }
    const block = (k, u) => { const edges = blocks[k].edges; let b = 0; while (b < edges.length - 2 && edges[b + 1] <= u) b += 1; return blocks[k][b]; };

    // One station's profile: its points from the foot up. `plain` leaves the blocks and the chamfers out (the far level).
    const profile = (u, plain) => {
      const [x, z, , ox, oz] = at(u), q = cut(u), top = topAt(u);
      // it tapers into the bank at either end, and stands on the bed at its foot
      const ends = smooth(0, 0.9, u) * smooth(0, 0.9, length - u);
      const foot = Math.min(ground(x + ox * 0.25, z + oz * 0.25), ground(x, z)) - 0.4;
      // how far back the ground behind it comes up to its top: the rock goes back that far, and then under
      let depth = 0.6;
      while (depth < 3.4 && ground(x - ox * depth, z - oz * depth) < top - 0.1) depth += 0.15;
      const tight = notch ? head(u) : 0;
      const h = Math.max(0.3, top - foot), out = [];
      // A face is not a plane nor a tread a floor: each swells and hollows a hand's breadth, by where it is, the
      // same at both levels (drawn from random numbers, the far level's ledges were not the near level's).
      const point = (o, y, lift = true, tread = false) => {
        const swell = 0.14 * (lump(u * 0.8 + 3, y * 1.9) - 0.5) * (1 - 0.7 * q) + (q > 0 ? 0.1 * q * (lump(u * 4.3, 7.3) - 0.5) : 0);
        const px = x + ox * (o + swell), pz = z + oz * (o + swell);
        if (tread) y += (0.12 * (lump(px * 1.1, pz * 1.1) - 0.5) + 0.06 * (lump(px * 3.3 + 9, pz * 3.3) - 0.5)) * (1 - q) - 0.035 * q * lump(u * 5.1, 1.1);
        // the rock is the ground wherever it stands: it is nowhere under the slope it stands on
        const py = lift ? Math.max(y, ground(px, pz) + 0.07) : y;
        // (and it is under the ground before it reaches the trail, nearer here than there: no ledge of it lies
        // in the tread, and its moss does not end along the tread in a ruled line)
        const clear = site.trail ? smooth(1.15, 1.9, site.trail.distance(px, pz) + 0.6 * (lump(px * 0.9 + 4, pz * 0.9) - 0.5)) : 1;
        const p = new THREE.Vector3(px - site.x, lerp(ground(px, pz) - 0.3, py, ends * clear) - site.y, pz - site.z);
        p.under = 1 - clear;
        return p;
      };
      const jut = (k) => (plain ? 0 : block(k, u)[0] * (1 - q)), lift = (k) => (plain ? 0 : block(k, u)[1] * (1 - q));
      const rows = [], light = [];
      // Wet where the pool laps it and where the falls' spray reaches; scoured bare in the creek's own notch and
      // down the face under the falling water, where nothing has ever held on.
      const off = notch ? Math.abs(u - notch.at) : 99, floor = notch ? notch.floor : top;
      const spray = 1 - smooth(0.8, 2.6, off), scour = 1 - smooth(0.5, 1.5, off), beside = 1 - smooth(0.8, 1.3, off);
      // (the spray is thrown up from the pool: it wets the bowl's faces, and little of it comes over the lip.
      // Above the lip what is wet is what the creek itself wets: its floor, and a hand's height up its sides.)
      const wetness = (y) => Math.max(1 - smooth(pool + 0.15, pool + 1.3, y), q, spray * (1 - 0.9 * smooth(pool + 1.2, floor + 0.3, y)), beside * (1 - smooth(floor + 0.12, floor + 0.5, y)));
      // (bare down the face under the falling water, a stride either side of it; at the lip only where the water
      // runs. The notch's own sides stand out of the water, and above a hand's height they are as mossy as the rest.)
      const bareness = (y) => Math.max(q, 0.85 * scour * (1 - smooth(floor - 0.35, floor, y)), 1 - smooth(0.75, 1.1, off)) * (1 - smooth(floor + 0.1, floor + 0.45, y));
      // `under`: how much of the forest's litter lies over it, where it goes back under the ground
      const add = (p, sky, under = 0) => { const y = p.y + site.y; rows.push(p); light.push([sky, clamp01(wetness(y)), notch ? clamp01(bareness(y)) : 0, Math.max(under, 1 - ends, p.under || 0)]); };
      add(point(0.18 + jut(0), foot, false), 0.45);
      if (!plain) add(point(0.02 + jut(0) + (block(0, u)[2] - 0.5) * 0.2 * (1 - q), foot + h * lerp(RISE[0], 1, q) * 0.45, false), 0.8);
      let back = 0;
      for (let k = 0; k < STEPS; k += 1) {
        // Its last step does not stand along the top of the slope like a kerb: block by block it stops short of
        // the ground's own height, and the forest floor lies over it there.
        const last = k === STEPS - 1, short = last && !plain ? 0.34 * block(STEPS, u)[2] * (1 - q) : last ? 0.12 * (1 - q) : 0;
        const rise = lerp(RISE[k], 1, q), y = foot + h * rise + lift(k) - short;
        // a riser leans back a little as it climbs, and here and there stands out over its own foot; under the falls the lip does
        const lean = k === 0 ? lerp(-0.06, 0.12, q) : k < 3 ? (plain ? -0.03 : (block(k, u)[2] - 0.62) * 0.15) : -0.05 - 0.08 * block(k, u)[2] * (plain ? 0.5 : 1);
        const face = -back + jut(k) + lean, bevel = Math.min(0.08, 0.2 * h * (rise - (k ? lerp(RISE[k - 1], 1, q) : 0)));
        if (!plain) add(point(face + 0.01, y - bevel, !last), 0.95);
        add(point(face - (plain ? 0 : bevel * 0.9), y, !last, true), 1);
        back = depth * (k < STEPS - 1 ? BACK[k] * (1 - 0.72 * tight) : 1);
        add(point(-back + (k < STEPS - 1 ? jut(k + 1) : 0) - 0.02, y + 0.04 * (1 - q), !last, true), k < STEPS - 1 ? lerp(0.55, 0.95, q) : 0.8, last ? 0.5 * (1 - q) : 0);      // the foot of the next riser is a corner the sky hardly reaches
      }
      // From its last tread it goes back and down, under the ground, a little further here than there, and the
      // forest's litter lies over it where it does: ended in one line, with moss to the line, it was a green
      // carpet laid on the forest floor.
      const far = depth + 0.3 + 0.6 * lump(u * 1.7 + 11, 5.5), dx = x - ox * far, dz = z - oz * far;
      rows.push(new THREE.Vector3(dx - site.x, ground(dx, dz) - 0.4 - site.y, dz - site.z)); light.push([0.6, 0, 0, 1]);
      return { rows, light };
    };

    // stations: close together where its top changes fast (the notch's sides), and one each side of every joint
    const stations = (most, least, withJoints) => {
      const list = [0];
      while (list[list.length - 1] < length - 1e-6) {
        const u = list[list.length - 1], steep = Math.abs(topAt(Math.min(length, u + 0.2)) - topAt(u)) / 0.2;
        list.push(Math.min(length, u + Math.max(least, most / (1 + 3.5 * Math.max(0, steep - 0.6)))));
      }
      if (withJoints) for (const j of joints) if (j > 0.3 && j < length - 0.3) list.push(j - 0.02, j + 0.02);
      return list.sort((a, b) => a - b).filter((u, k, all) => k === 0 || u - all[k - 1] > 0.012);
    };
    const coarseAt = stations(coarse, 0.3, false), fineAt = stations(every, 0.11, true);
    const farGrid = coarseAt.map((u) => profile(u, true)), nearGrid = fineAt.map((u) => profile(u, false));
    // a little unevenness on every point of the near level but its foot and its dive
    nearGrid.forEach(({ rows }) => rows.forEach((p, j) => { if (j > 0 && j < ROWS - 1) { p.x += (r() - 0.5) * 0.05; p.y += (r() - 0.5) * 0.04; p.z += (r() - 0.5) * 0.05; } }));
    // which way its faces look: the first riser's own normal against the open side
    const u0 = length / 2, [, , , ox, oz] = at(u0), k0 = Math.floor(farGrid.length / 2);
    const a = farGrid[k0].rows[0], b = farGrid[Math.min(farGrid.length - 1, k0 + 1)].rows[0], c = farGrid[k0].rows[1];
    const facing = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)), flip = facing.x * ox + facing.z * oz < 0;
    surface(far, farGrid.map((s) => s.rows), farGrid.map((s) => s.light), flip);
    const onto = (i, j) => {
      const u = fineAt[i];
      let k = 0;
      while (k < coarseAt.length - 2 && coarseAt[k + 1] < u) k += 1;
      return [k, clamp01((u - coarseAt[k]) / (coarseAt[k + 1] - coarseAt[k])), ONTO[j][0], ONTO[j][1]];
    };
    surface(near, nearGrid.map((s) => s.rows), nearGrid.map((s) => s.light), flip, farGrid.map((s) => s.rows), onto);
  };

  // ---- the bowl: down the west wall to the head, across the head with the creek's notch in it, and back
  // along the east wall, which faces the trail on the west rim and stands to the rim's own height
  const lip = FALLS.top + 0.02, [fx, fz] = [FALLS.x, FALLS.z];
  const bowl = [
    [-50.95, -12.6, pool + 0.45], [-51.0, -11.4, -3.7], [-51.25, -10.0, -2.95], [-51.8, -8.6, -2.25], [-51.9, -7.2, -1.65], [-51.7, -6.1, -1.25], [-51.32, -5.48, -1.02],
    [fx - 0.55, fz - 0.02, -0.98], [fx, fz, -0.97], [fx + 0.55, fz - 0.02, -0.95],
    [-49.42, -5.5, -0.9], [-48.78, -6.2, -0.85], [-48.22, -7.4, -0.8], [-48.02, -8.6, -0.95], [-48.15, -9.9, -1.5], [-48.48, -11.2, -2.3], [-48.6, -12.5, -3.2], [-48.56, -14.0, pool + 0.4],
  ];
  // The notch: flat under the water for `half` either side of the creek's middle, up to the gully's banks over
  // `side`; the gully's section is taken `reach` behind the face, for `wide` either side of the creek's middle.
  ledges(bowl, { notch: { point: 8, half: 0.72, side: 0.22, floor: lip, reach: 2.8, wide: 1.5 } });

  // The height of the rock's own surface over a spot (-Infinity where it is not), for what is rooted where it
  // stands: its near level's triangles, sorted into the metre squares they lie over.
  const cells = new Map(), P = near.position, I = near.index;
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    for (let x = Math.floor(Math.min(P[a], P[b], P[c]) + site.x); x <= Math.floor(Math.max(P[a], P[b], P[c]) + site.x); x += 1) {
      for (let z = Math.floor(Math.min(P[a + 2], P[b + 2], P[c + 2]) + site.z); z <= Math.floor(Math.max(P[a + 2], P[b + 2], P[c + 2]) + site.z); z += 1) {
        const key = x * 4096 + z;
        if (!cells.has(key)) cells.set(key, []);
        cells.get(key).push(t);
      }
    }
  }
  const standing = (x, z) => {
    const list = cells.get(Math.floor(x) * 4096 + Math.floor(z)), lx = x - site.x, lz = z - site.z;
    let top = -Infinity;
    for (const t of list || []) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = P[b] - P[a], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vz = P[c + 2] - P[a + 2], area = ux * vz - uz * vx;
      if (Math.abs(area) < 1e-9) continue;
      const f = ((lx - P[a]) * vz - (lz - P[a + 2]) * vx) / area, g = ((lz - P[a + 2]) * ux - (lx - P[a]) * uz) / area;
      if (f < 0 || g < 0 || f + g > 1) continue;
      top = Math.max(top, P[a + 1] + f * (P[b + 1] - P[a + 1]) + g * (P[c + 1] - P[a + 1]) + site.y);
    }
    return top;
  };

  return { solid: [near.geometry(), far.geometry()], height: 4.5, reach: 10, lod: [34], handWood: [0.35, 0.35], max: 105, gone: 135, standing };
}
