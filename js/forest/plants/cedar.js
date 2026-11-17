import * as THREE from 'three';
import { Mesh, sheetCell, perchOf } from './build.js';
import { mulberry32 } from '../world/layout.js';

// The old cedar: one western redcedar, many centuries old, in the wet ground the creek rises from. The owner
// (2026-11-14): "a very old-growth western redcedar with a huge gnarly trunk."
//
// There is one of it, so it is not a kind built once and stood about the forest. It is built for the spot it
// stands on, in that spot's own compass (+x east, +z south, the tree's foot at the origin): its roots lie on
// the ground that is really there, its hollowed side and its greatest buttress face the trail that comes at
// it from the east and passes it to the north, and the creek rises between two of its roots. `site` says
// where it stands and how it is turned (its layout record) and what the ground is round it; the finished
// tree is turned back by its record's yaw, so that the instancer's turn sets it down as it was built.
//
// What makes it a redcedar and not a great fir: a foot more than twice as broad as the trunk above it,
// flaring into buttresses with deep flutes between them, which twist as they climb and run on up the trunk
// as ribs; burls; a trunk that tapers fast; a top long dead (a bleached spike) with younger trunks risen
// round it from limbs that turned upward, as a candelabra; heavy limbs that sweep down and lift at their
// ends; and sprays that hang from them like the fronds of a fern.
//
// Lengths are metres, angles degrees, bearings measured from east round through south.
export const CEDAR = { height: 46, crown: 10, crownWeight: 0.9 };

const UP = new THREE.Vector3(0, 1, 0), TAU = Math.PI * 2;
const rad = THREE.MathUtils.degToRad;
const turned = (a) => Math.atan2(Math.sin(a), Math.cos(a));               // an angle as the nearest way round to it
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

// ---- the trunk ------------------------------------------------------------------------------------
const TOP = 41;                       // where the old stem ends, broken
const DEAD = [32.5, 35];              // over these heights its bark gives out: above them it is bare, silver wood
const TWIST = 0.02;                   // radians a metre: its grain, its flutes and its bark all spiral
// How thick the trunk is at a height, buttresses apart: 6.4 m through at the ground, 5 m at the walker's chest,
// 4.2 m at 5 m up, 3.7 m at 10 m, 2.4 m at 25 m. It is a column, not a cone: a redcedar's foot flares in its
// lowest two metres and the trunk above it gives up its girth slowly.
const girth = (h) => { const up = Math.max(h, -0.4); return 0.42 + 1.85 * Math.pow(Math.max(0, 1 - up / TOP), 0.95) + 0.95 * Math.exp(-up / 1.5); };
// Its middle line: it leans a little to the south-west, away from the trail, and is crooked by half a metre either way.
const axis = (h, out = new THREE.Vector3()) => {
  const t = Math.max(h, 0) / TOP;
  return out.set(-0.75 * t * t + 0.5 * Math.sin(t * 5.2), h, 0.45 * t * t - 0.4 * Math.sin(t * 4.1));
};
// The trunk is not one stem but a sheaf of them grown together: a core, and round it columns that stand out
// at the ground as buttresses, with a deep crease wherever two of them meet, and run on up the trunk as ribs,
// turning as they climb. Four of them are stems in their own right: each stays whole up the trunk to the
// height it `leaves` at, and from there goes on alone as one of the younger trunks (LEADERS below).
//   at     its bearing at the ground
//   out    how far it stands out beyond the trunk's girth at the ground, as a share of that girth
//   broad  how broad it is, likewise
//   dies   the height it sinks back into the trunk over, and `rib` how much of it runs on up as a rib
//   bend   which way its root bends, `long` how long its root is, `forks` which side that forks to (0: it does not)
// The two that face the trail's nearest point (-5 and -38 degrees) have the tree's deepest crease between them,
// and the hollow opens out of it (HOLLOW). None stands to the north-north-west (235 degrees): the trunk is drawn
// in there between two great roots. (The creek was first to rise in that nook, four metres from the tree's
// middle, where no step of the trail could see its water. It rises now eight metres to the north, a little east
// of it, beyond the ends of the roots at 264 and 298 degrees: world/land.js.)
const COLUMNS = [
  { at: -5,  out: 0.42, broad: 0.40, dies: 9,  rib: 0.35, bend: 0.2,   long: 1.2,  forks: -1 },
  { at: 28,  out: 0.22, broad: 0.30, dies: 5,  rib: 0.2,  bend: -0.3,  long: 0.8,  forks: 0 },
  { at: 62,  out: 0.34, broad: 0.36, dies: 7,  rib: 0.3,  bend: 0.25,  long: 1.0,  forks: -1 },
  { at: 100, out: 0.2,  broad: 0.28, dies: 4,  rib: 0.15, bend: -0.2,  long: 0.7,  forks: 0 },
  { at: 135, out: 0.36, broad: 0.38, dies: 8,  rib: 0.8,  bend: 0.3,   long: 1.1,  forks: -1, leaves: 13.5 },
  { at: 172, out: 0.26, broad: 0.32, dies: 5,  rib: 0.2,  bend: 0.25,  long: 0.9,  forks: 0 },
  { at: 205, out: 0.38, broad: 0.36, dies: 7,  rib: 0.8,  bend: -0.4,  long: 1.15, forks: -1, leaves: 17.5 },
  { at: 264, out: 0.36, broad: 0.38, dies: 8,  rib: 0.75, bend: 0.4,   long: 1.15, forks: 1,  leaves: 26.5 },
  { at: 298, out: 0.3,  broad: 0.3,  dies: 6,  rib: 0.25, bend: -0.15, long: 0.85, forks: 0 },
  { at: 322, out: 0.36, broad: 0.34, dies: 10, rib: 0.8,  bend: -0.3,  long: 1.0,  forks: -1, leaves: 21.5 },
];
const SHARP = 10;                     // how sharp a crease is: the higher, the nearer two columns meet in a line
// how far a column stands out at a height, 1 at the ground: a stem that leaves the trunk is gone from it a little above where it does
// A rib is not even: it swells and pinches as it climbs, each in its own places, which is most of what the trunk's outline is.
const stands = (c, up) => (c.rib + (1 - c.rib) * Math.exp(-up / c.dies)) * (c.leaves ? 1 - smooth(c.leaves - 0.6, c.leaves + 1.6, up) : 1)
  * (1 + smooth(0.5, 3, up) * (0.3 * Math.sin(0.8 * up + c.at * 0.37) + 0.18 * Math.sin(1.9 * up + c.at * 0.83)));
// How far the bark stands from the trunk's middle line at a height and a bearing, burls and unevenness apart.
// `into`, if given, takes how deep that spot lies below the tops of the columns either side of it, as a share
// of the girth: measured against the tallest column of all, every lesser one stood in shade from foot to top.
const columns = (h, th, into = null) => {
  const up = Math.max(h, 0), g = girth(h), n = COLUMNS.length;
  let mean = 0;
  for (const c of COLUMNS) mean += stands(c, up) / n;
  const core = g * (0.72 + 0.2 * (1 - mean));
  let sum = Math.exp(SHARP * core), before = null, after = null;
  for (const c of COLUMNS) {
    const s = stands(c, up) * (1 + 0.3 * Math.exp(-up / 0.8));                    // at the ground a buttress spreads into its root
    const reach = g * (1 + c.out * s), size = g * c.broad * (0.6 + 0.4 * s), d = turned(th - rad(c.at) - TWIST * up);
    // a column is round: seen from the trunk's middle its face falls away as the square of the angle from its own bearing
    sum += Math.exp(SHARP * (reach - ((reach - size) * reach * 1.15) / (2 * size) * d * d));
    if (d >= 0 && (!before || d < before.d)) before = { d, reach };
    if (d < 0 && (!after || -d < after.d)) after = { d: -d, reach };
  }
  const far = Math.log(sum) / SHARP;
  if (into) {
    const span = before.d + after.d, top = Math.max(core, span > 0 ? before.reach + (after.reach - before.reach) * (before.d / span) : before.reach);
    into.deep = clamp01((top - far) / (0.3 * g));
  }
  return far;
};
// Burls: [height, bearing, how far it stands out, half its height, half its width].
const BURLS = [[2.4, 4, 0.55, 0.9, 0.95], [5.6, -52, 0.45, 0.8, 0.85], [1.1, 62, 0.35, 0.6, 0.65], [7.8, 22, 0.5, 1.0, 1.0], [3.4, 150, 0.45, 0.85, 0.85], [10.5, -95, 0.4, 0.9, 0.9],
  [6, 235, 0.4, 0.8, 0.8], [13, 100, 0.4, 1.0, 1.0], [4.2, 96, 0.7, 1.2, 1.1], [6.6, -84, 0.6, 1.0, 1.0], [9.2, 78, 0.45, 0.9, 0.9]];
const burls = (h, th, r) => {
  let sum = 0;
  for (const [at, bearing, out, tall, wide] of BURLS) {
    const dh = (h - at) / tall, dw = (turned(th - rad(bearing)) * r) / wide, m = Math.exp(-dh * dh - dw * dw);
    if (m > 0.004) sum += out * m * (1 + 0.22 * Math.sin(th * 13 + h * 4.1) * Math.sin(h * 6.3 - th * 5));      // a burl is lumpy
  }
  return sum;
};
// The hollow: the crease between the two columns that face the trail has rotted or burnt out into a cave, a
// stride and a half wide at the ground and twice the walker's height, drawn to a point at its top. [bearing,
// height, half its width at the ground, how far in it goes]
const HOLLOW = [-22, 3.7, 0.75, 1.9];
const hollow = (h, th, r) => {
  const [bearing, tall, half, far] = HOLLOW;
  if (h >= tall) return 0;
  const up = Math.max(h, 0), wide = half * Math.pow(1 - up / tall, 0.45), q = (turned(th - rad(bearing) - TWIST * up) * r) / wide;
  return Math.abs(q) < 1 ? far * Math.sqrt(1 - q * q) * Math.sqrt(1 - (up / tall) * (up / tall)) : 0;
};
// the bark itself: the columns, a slow unevenness, the burls, and the hollow
export const bark = (h, th) => {
  const far = columns(h, th) * (1 + 0.025 * Math.sin(2 * th + 0.5 * h + 1) + 0.018 * Math.sin(5 * th - 0.8 * h)) + burls(h, th, girth(h));
  return far - hollow(h, th, far);
};

// A skin over a row of rings. Ring j is `radial` + 1 vertices round centres[j], the last a copy of the first,
// each `reach(j, th)` out from it across the way the row runs (or level, if `flat`), and `lift(j, th)` along it.
// The frame is carried from ring to ring, so the skin does not twist where the row turns.
//
// Its normals are the skin's own, from the vertices either side of each one. A tube's are its rings' radii
// (Mesh.tube): on a fluted, buttressed, burled trunk those light it as the round column it is not.
// Round the ring the paint is laid by distance, not by angle: by angle, the bark on the wall of a crease, which
// runs nearly straight out from the tree's middle, is drawn out to several times its width. `lay(j, th)`, if
// given, is the shape that distance is measured on in place of the skin's own: the trunk's columns without its
// burls. Measured over the burls too, every lump took up a little more bark than the ring below it, and the
// strips ran up the trunk in a herringbone.
//   around, tile   how many times the sheet goes round, and how far along one sheet reaches
//   slant, start   how many sheets a metre the paint slips round as it climbs, and the metres it has already climbed
//   wood(j, th)    a vertex's two numbers as wood (light/materials.js BARK_FRAG): how deep in a hollow, and 1 on bare wood
//   grain          it is bare wood: painted by where it lies across the grain in metres, hardly by how far along (streaks)
//   cap            closes the far end that many metres inside its last ring, as a break
//   drop           the next coarser level has no such skin: its roots are its own middle line, and it thins away
//   measure        a number for each ring that rises along the row and means the same at both levels, to settle one onto the other by
// Returns { base, radial, at } as Mesh.settle wants them (`at` is `measure`, or each ring's distance along), and
// `cap`, the vertex in the middle of its closed end.
function hull(mesh, centres, radial, reach, { flat = false, lift = null, lay = null, around = 1, tile = 2.4, slant = 0, start = 0, wood = null, grain = false, cap = 0, drop = false, measure = null } = {}) {
  const base = mesh.vertexCount, n = centres.length, P = [], Q = [], far = [];
  const T = new THREE.Vector3(), S = new THREE.Vector3(), U = new THREE.Vector3();
  let along = start;
  for (let j = 0; j < n; j += 1) {
    if (j > 0) along += centres[j].distanceTo(centres[j - 1]);
    far.push(along);
    if (flat) { T.set(0, 1, 0); S.set(1, 0, 0); U.set(0, 0, 1); } else {
      T.subVectors(centres[Math.min(j + 1, n - 1)], centres[Math.max(j - 1, 0)]).normalize();
      if (j === 0) { S.crossVectors(T, UP); if (S.lengthSq() < 1e-4) S.set(1, 0, 0); } else S.addScaledVector(T, -S.dot(T));
      S.normalize(); U.crossVectors(S, T);
    }
    const ring = [], laid = [];
    for (let i = 0; i < radial; i += 1) {
      const th = (i / radial) * TAU, out = reach(j, th), c = Math.cos(th) * out, s = Math.sin(th) * out, l = lift ? lift(j, th) : 0;
      ring.push(new THREE.Vector3(centres[j].x + S.x * c + U.x * s + T.x * l, centres[j].y + S.y * c + U.y * s + T.y * l, centres[j].z + S.z * c + U.z * s + T.z * l));
      if (lay) { const size = lay(j, th); laid.push(new THREE.Vector3(S.x, S.y, S.z).multiplyScalar(Math.cos(th) * size).addScaledVector(U, Math.sin(th) * size)); }
    }
    P.push(ring); Q.push(lay ? laid : ring);
  }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), normal = new THREE.Vector3();
  for (let j = 0; j < n; j += 1) {
    const ring = P[j], home = centres[j];
    let round = 0;
    const share = [0];
    for (let i = 0; i < radial; i += 1) { round += Q[j][i].distanceTo(Q[j][(i + 1) % radial]); share.push(round); }
    for (let i = 0; i <= radial; i += 1) {
      const k = i % radial, p = ring[k], th = (k / radial) * TAU;
      a.subVectors(ring[(k + 1) % radial], ring[(k - 1 + radial) % radial]);
      b.subVectors(P[Math.min(j + 1, n - 1)][k], P[Math.max(j - 1, 0)][k]);
      normal.crossVectors(b, a).normalize();
      mesh.position.push(p.x, p.y, p.z);
      if (drop) mesh.root.push(home.x, home.y, home.z); else mesh.root.push(p.x, p.y, p.z);
      mesh.normal.push(normal.x, normal.y, normal.z);
      if (grain) mesh.uv.push(share[i], far[j] * 0.08); else mesh.uv.push((share[i] / round) * around - slant * far[j], far[j] / tile);
      const w = wood ? wood(j, th) : [0, 0];
      mesh.wind.push(w[0], w[1]);
    }
  }
  for (let j = 0; j < n - 1; j += 1) {
    for (let i = 0; i < radial; i += 1) { const p = base + j * (radial + 1) + i, q = p + radial + 1; mesh.index.push(p, q, p + 1, p + 1, q, q + 1); }
  }
  let middle = -1;
  if (cap) {
    const c = centres[n - 1], inward = T.subVectors(centres[n - 2], c).normalize(), ring = base + (n - 1) * (radial + 1);
    middle = mesh.vertexCount;
    mesh.position.push(c.x + inward.x * cap, c.y + inward.y * cap, c.z + inward.z * cap); mesh.root.push(c.x + inward.x * cap, c.y + inward.y * cap, c.z + inward.z * cap);
    mesh.normal.push(-inward.x, -inward.y, -inward.z); mesh.uv.push(0, 0); mesh.wind.push(0.6, 1);
    for (let i = 0; i < radial; i += 1) mesh.index.push(ring + i, middle, ring + i + 1);
  }
  return { base, radial, at: measure || far, cap: middle };
}

// A curve from a to d that leaves a towards b and comes into d from c.
const curve = (a, b, c, d) => ({
  at: (u, out = new THREE.Vector3()) => { const v = 1 - u; return out.set(0, 0, 0).addScaledVector(a, v * v * v).addScaledVector(b, 3 * v * v * u).addScaledVector(c, 3 * v * u * u).addScaledVector(d, u * u * u); },
  dir: (u, out = new THREE.Vector3()) => { const v = 1 - u; return out.set(0, 0, 0).addScaledVector(a, -3 * v * v).addScaledVector(b, 3 * v * v - 6 * v * u).addScaledVector(c, 6 * v * u - 3 * u * u).addScaledVector(d, 3 * u * u).normalize(); },
});
const shares = (n) => Array.from({ length: n + 1 }, (_, k) => k / n);

// The younger trunks: the four columns that are stems of their own leave the old trunk, one above another, and
// stand up round its dead top as a candelabra. [which column, how far out it goes before it stands, the height
// of its top, its thickness where it leaves, whether its own top is dead]
const LEADERS = [[4, 3.4, 30, 0.44, false], [6, 2.4, 39.5, 0.46, false], [9, 2.0, 44.5, 0.4, false], [7, 1.5, 38, 0.32, true]];
// What is dead on it. The broken stubs of limbs low on the trunk: [height, bearing, length, pitch]. A stub is
// short, thick where it leaves the trunk, not straight, and ends where it broke: drawn long, thin and straight
// it was a rod, and tapered to a point a thorn. And the spikes among the younger tops: [height, bearing, how
// far its tip stands out from its foot, length].
const STUBS = [[6.4, 40, 0.9, 14], [8.2, -70, 1.3, 4], [9.6, 168, 1.0, 10], [11.4, -28, 1.6, -4], [12.6, 240, 0.8, 18], [16.2, 66, 1.4, 8]];
const SPIKES = [[33, 60, 0.5, 6.5], [30, 160, 0.7, 5]];
const NEAR = 44;                      // metres: as far as its wood is drawn as the walker beside it sees it (see buildCedar)

// site: { yaw, ground(east, south), tread(east, south) }: how the layout has turned it, the height of the ground
// that many metres from its foot, above its foot, and how far that spot is from the middle of the walk's tread.
//
// Its wood has two levels, as every tree's has (plants/conifer.js): what the walker stands beside, and what is
// seen from across the forest, which is the same tree in an eighth of the triangles. The first is drawn turning
// into the second (Mesh.settle). So the tree is planned once (every random number, every place a limb leaves
// from) and its wood is then built from the plan at each level. From the Cathedral it is 120 m off and still
// in view: at one level, the walk's heaviest view held 905k solid triangles against a ceiling of 900k.
export function buildCedar(sheets, site) {
  const r = mulberry32(4107), ground = site.ground, cells = sheets.cedar.cells, { fringe, frond } = sheets.cedar;
  const BARK = { around: 12, tile: 2.4, slant: (12 * TWIST) / TAU };

  // ---- the plan --------------------------------------------------------------------------------------
  // the trunk's rings: one every hand's breadth at the foot, whose outline is seen from a stride away
  const heights = [-1.3, -0.7, -0.3];
  for (let h = 0; h < TOP; h += Math.min(1.5, 0.12 + 0.032 * h)) heights.push(h);
  heights.push(TOP);
  const split = heights.findIndex((h) => h >= 14);
  const below = heights.slice(0, split + 1), above = heights.slice(split);
  // its top broke off long ago: the last ring is torn into splinters, the side that held on longest standing highest
  const teeth = Array.from({ length: 56 }, () => r() * r());
  const torn = (th) => 0.25 + 1.1 * Math.pow(0.5 + 0.5 * Math.cos(th - 2.2), 2) + 0.9 * teeth[Math.round((th / TAU) * 56) % 56];

  // The roots: each column runs out along the ground as a fin of wood, sinks, and is gone under the moss; some
  // fork half-way out (none into the nook at 235 degrees). They lie on the ground that is there, not on a level.
  const foot = axis(0), roots = [];
  for (const c of COLUMNS) {
    const th = rad(c.at), surface = bark(0.2, th), far = surface * 0.5 + (2.4 + 6 * c.out) * c.long * (0.85 + 0.3 * r());
    roots.push({ th, from: surface * 0.5, far, bend: c.bend, high: 1.5 });
    if (c.forks) roots.push({ th: th + c.bend * 0.25 + c.forks * 0.45, from: surface * 0.5 + far * 0.5, far: far * 0.45, bend: c.forks * 0.5, high: 0.5 });
  }
  // Where the walk passes, a root is under it: the tread has been trodden down over it for a century. Three of
  // them reach the tread, and they stood a hand and more out of it, mossy, across the walker's way: from a
  // stride off, a dark green blade lying on the path. Each goes under the ground before the tread's edge.
  const rootAt = (root, u) => {
    const rho = root.from + root.far * u, a = root.th + root.bend * u * u, x = foot.x + Math.cos(a) * rho, z = foot.z + Math.sin(a) * rho;
    const clear = site.tread ? smooth(1.0, 2.6, site.tread(x, z)) : 1;
    const tall = root.high * (0.5 * Math.pow(1 - u, 1.2) + 0.07);                                                               // half its height
    const top = root.high * (1.0 * Math.pow(1 - u, 1.6) - 0.1 * u) * clear - 0.14 * (1 - clear);                                 // how far its back stands out of the ground
    return { centre: new THREE.Vector3(x, ground(x, z) + top - tall, z), wide: tall * (0.42 + 0.45 * u) + 0.04, tall };
  };

  // The younger trunks, and with the old one the stems that limbs leave from.
  const stems = [{ at: axis, girth: (h, th) => bark(h, th), from: 11, to: 33.5, count: 54, spread: (t) => 2.4 + 6.4 * Math.pow(1 - t, 0.8), rise: (t) => -30 + 24 * t, thin: 1 }];
  const leaders = LEADERS.map(([k, reachOut, h1, thick, dead]) => {
    const h0 = COLUMNS[k].leaves, th = rad(COLUMNS[k].at) + TWIST * h0, out = new THREE.Vector3(Math.cos(th), 0, Math.sin(th));
    // it begins inside its own column, a little below where that gives out, and leaves the trunk rising
    const from = axis(h0 - 1.2).addScaledVector(out, bark(h0 - 1.2, th) - thick * 1.1), elbow = from.clone().addScaledVector(out, reachOut * 0.8).addScaledVector(UP, 1.6);
    const path = curve(from, elbow, elbow.clone().addScaledVector(UP, (h1 - h0) * 0.45).addScaledVector(out, reachOut * 0.3), from.clone().addScaledVector(out, reachOut + 0.6).setY(h1));
    const size = (u) => thick * (1 - 0.86 * Math.pow(u, 0.8)) + 0.035;
    // where it stands upright it carries limbs of its own
    stems.push({ at: (h, into = new THREE.Vector3()) => path.at(clamp01(0.32 + 0.68 * (h - (h0 + 0.3 * (h1 - h0))) / (0.7 * (h1 - h0))), into),
      girth: (h) => size(clamp01((h - h0) / (h1 - h0))), from: h0 + 0.38 * (h1 - h0), to: dead ? h0 + 0.6 * (h1 - h0) : h1 - 0.4, count: dead ? 6 : 16,
      spread: (t) => (1.2 + 3.4 * Math.pow(1 - t, 0.8)) * (dead ? 0.8 : 1), rise: (t) => -22 + 26 * t, thin: 0.7 });
    return { path, size, thick, bare: dead ? [0.55, 0.7] : [2, 3] };
  });

  // The limbs: each sweeps down and out, and its end turns up.
  const limbs = [];
  let serial = 0;
  for (const s of stems) {
    for (let i = 0; i < s.count; i += 1) {
      const t = Math.pow((i + r() * 0.8) / s.count, 0.9), h = s.from + (s.to - s.from) * t;
      const azimuth = (serial += 1) * 2.39996 + (r() - 0.5) * 0.9, length = s.spread(t) * (0.75 + r() * 0.5);
      const rise = rad(s.rise(t) + (r() - 0.5) * 14), lifts = rad(16 + 28 * r());
      const out = new THREE.Vector3(Math.cos(azimuth), 0, Math.sin(azimuth));
      const from = s.at(h).addScaledVector(out, s.girth(h, azimuth) * 0.55);
      const leave = out.clone().multiplyScalar(Math.cos(rise)).addScaledVector(UP, Math.sin(rise));
      const tipDir = out.clone().multiplyScalar(Math.cos(lifts)).addScaledVector(UP, Math.sin(lifts));
      const end = from.clone().addScaledVector(out, length * 0.9).addScaledVector(UP, length * (Math.sin(rise) * 0.8 + 0.08));
      limbs.push({ path: curve(from, from.clone().addScaledVector(leave, length * 0.42), end.clone().addScaledVector(tipDir, -length * 0.3), end),
        length, thick: (0.035 + 0.014 * length) * s.thin, thin: s.thin, t, out });
    }
  }

  // What is dead on it, as lines: { from, towards, length, thick, droop, blunt }.
  const dead = [];
  for (const [h, bearing, length, pitch] of STUBS) {
    const th = rad(bearing), level = new THREE.Vector3(Math.cos(th), 0, Math.sin(th));
    dead.push({ from: axis(h).addScaledVector(level, bark(h, th) * 0.75), towards: level.clone().multiplyScalar(Math.cos(rad(pitch))).setY(Math.sin(rad(pitch))),
      length: length * 0.8 + bark(h, th) * 0.25, thick: 0.14, droop: 0.12, blunt: 0.45 });
  }
  for (const [h, bearing, off, length] of SPIKES) {
    const th = rad(bearing), level = new THREE.Vector3(Math.cos(th), 0, Math.sin(th));
    dead.push({ from: axis(h).addScaledVector(level, bark(h, th) * 0.5), towards: level.clone().multiplyScalar(off / length).addScaledVector(UP, 1).normalize(), length, thick: 0.16, droop: 0, blunt: 0 });
  }

  // ---- its wood, at a level --------------------------------------------------------------------------
  const deep = { deep: 0 };
  const every = (list, n) => list.filter((_, i) => i % n === 0 || i === list.length - 1);
  const wood = (fine) => {
    const mesh = new Mesh(), tubes = [], singles = [];
    // The trunk, in two skins: the foot and the lower trunk, where the walker stands beside it, finely; the rest in half as many sides.
    const skin = (list, radial, start, top) => {
      const last = list.length - 1;
      tubes.push(hull(mesh, list.map((h) => axis(h)), radial, (j, th) => bark(list[j], th) * (top && j === last ? 0.55 : 1), { flat: true, ...BARK, start, measure: list.map((h) => h - heights[0]),
        lay: (j, th) => columns(list[j], th), lift: top ? (j, th) => (j === last ? torn(th) : 0) : null,
        // A crease is in its own shade, the bottom of a deep one nearly dark, and the hollow is dark from its lip inward
        // (the forest's shade has no direction, so in shade this is all that draws the columns: light/shared.js
        // forestShade). And the top of the old stem is dead.
        wood: (j, th) => {
          const h = list[j], size = columns(h, th, deep), inside = hollow(h, th, size) / HOLLOW[3];
          return [Math.max(0.3 * deep.deep + 0.55 * smooth(0.3, 1, deep.deep), smooth(0.02, 0.22, inside)), Math.max(smooth(DEAD[0], DEAD[1], h), smooth(0.04, 0.26, inside))];
        } }));
      return tubes[tubes.length - 1];
    };
    skin(fine ? below : every(below, 6), fine ? 112 : 36, 0, false);
    const sides = fine ? 56 : 36, upper = fine ? above : every(above, 3), stem = skin(upper, sides, below[below.length - 1] - heights[0], true);
    {
      const tip = axis(TOP), ring = stem.base + (upper.length - 1) * (sides + 1);
      singles.push(mesh.vertexCount);
      mesh.position.push(tip.x, TOP - 0.2, tip.z); mesh.root.push(tip.x, TOP - 0.2, tip.z);
      mesh.normal.push(0, 1, 0); mesh.uv.push(0, 0); mesh.wind.push(1, 1);
      for (let i = 0; i < sides; i += 1) mesh.index.push(ring + i, singles[0], ring + i + 1);
    }
    for (const root of roots) {
      const at = shares(fine ? 12 : 4), rings = at.map((u) => rootAt(root, u));
      tubes.push(hull(mesh, rings.map((ring) => ring.centre), fine ? 9 : 5, (j, a) => 1 / Math.hypot(Math.cos(a) / rings[j].wide, Math.sin(a) / rings[j].tall), { around: 1, tile: 2.4, measure: at }));
    }
    for (const leader of leaders) {
      const at = shares(fine ? 16 : 6);
      tubes.push(hull(mesh, at.map((u) => leader.path.at(u)), fine ? 10 : 6, (j) => leader.size(at[j]),
        { around: Math.max(1, Math.round((TAU * leader.thick) / 1.2)), tile: 2.4, measure: at, wood: (j) => [0, smooth(leader.bare[0], leader.bare[1], at[j])] }));
    }
    for (const limb of limbs) {
      // from across the forest the lesser limbs are not there: each thins to nothing on the way to that level
      const stays = limb.length > 3.4, at = shares(fine ? 7 : 3);
      if (!fine && !stays) { tubes.push(null); continue; }
      tubes.push(hull(mesh, at.map((u) => limb.path.at(u)), fine ? 5 : 3, (j) => limb.thick * (1 - 0.88 * at[j]) + 0.012, { around: 1, tile: 1.5, measure: at, drop: !stays }));
    }
    for (const d of dead) {
      const at = shares(fine ? 6 : 2);
      // a stub ends where it broke, at nearly half its thickness; a dead top tapers to its tip
      const tube = hull(mesh, at.map((u) => d.from.clone().addScaledVector(d.towards, d.length * u).addScaledVector(UP, -d.droop * d.length * u * u)), fine ? 6 : 4,
        (j) => d.thick * (d.blunt ? 1 - (1 - d.blunt) * at[j] : Math.pow(1 - at[j], 0.7)) * (1 + 0.25 * Math.sin(at[j] * 13.8)) + 0.012, { grain: true, measure: at, wood: () => [0, 1], cap: d.blunt ? d.thick * 0.3 : 0 });
      tubes.push(tube);
      if (tube.cap >= 0) singles.push(tube.cap);
    }
    return { mesh, tubes, singles };
  };
  const near = wood(true), far = wood(false);
  near.tubes.forEach((tube, i) => { if (far.tubes[i]) near.mesh.settle(tube, far.mesh, far.tubes[i]); });
  near.singles.forEach((vertex, i) => { for (let k = 0; k < 3; k += 1) near.mesh.root[vertex * 3 + k] = far.mesh.position[far.singles[i] * 3 + k]; });

  // ---- its foliage (paint/textures.js cedarAtlas) -----------------------------------------------------
  // Under each limb, all the way along it, hangs its fringe: lengths of it painted with the limb along their top
  // edge, each on a card that stands on edge under the limb and follows its sweep, two such to a length, leaning
  // apart, so that the fringe has depth seen from any side. Its side branches are fronds laid nearly level, to
  // one side and then the other: they are what a walker under the tree sees, to whom a card on edge is a line.
  // Its own end carries a frond that goes on up and out and nods over.
  const leaf = new Mesh();
  const side = new THREE.Vector3(), tangent = new THREE.Vector3(), level = new THREE.Vector3(), normal = new THREE.Vector3();
  const along = new THREE.Vector3(), across = new THREE.Vector3(), sag = new THREE.Vector3(), origin = new THREE.Vector3();
  const middle = new THREE.Vector3(), tip = new THREE.Vector3(), hung = new THREE.Vector3();
  const pick = (list) => sheetCell(list[Math.floor(r() * list.length)], cells);
  for (const { path, length, thin, t, out } of limbs) {
    normal.copy(out).multiplyScalar(0.62).addScaledVector(UP, 0.5 + 0.5 * t).normalize();
    const lengths = Math.max(1, Math.round((length * 0.82) / 1.5)), tall = (1.15 + 0.07 * length) * (0.75 + 0.25 * thin);
    for (let k = 0; k < lengths; k += 1) {
      const u0 = 0.12 + (0.82 * k) / lengths, u1 = Math.min(0.985, u0 + (0.82 / lengths) * 1.25), um = (u0 + u1) / 2;
      path.at(u0, origin); path.at(um, middle); path.at(u1, tip); path.dir(um, tangent);
      level.set(tangent.x, 0, tangent.z).normalize();
      side.set(-level.z, 0, level.x);
      sag.copy(origin).add(tip).multiplyScalar(0.5).sub(middle).multiplyScalar(4);            // the card's own middle line bends as the limb does between its two ends
      for (const lean of [-1, 1]) {
        const tilt = lean * rad(13 + 13 * r()), high = tall * (0.85 + 0.3 * r()) * (1 - 0.3 * um);
        across.copy(UP).multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(high);
        hung.copy(origin).addScaledVector(across, -0.37);                                       // the limb runs along the top of the painting, not through its middle
        along.copy(tip).sub(origin).sub(sag);
        leaf.card(hung, along, across, pick(fringe), normal, { sway: [0.2, 0.55], variation: r(), segments: 2, sag });
      }
    }
    const reach = (1.3 + 0.1 * length) * (0.75 + 0.25 * thin), fronds = Math.round(length / 1.0);
    for (let k = 0; k < fronds; k += 1) {
      const u = 0.2 + 0.72 * (k + 0.5) / fronds, hand = k % 2 ? 1 : -1, size = reach * (0.85 + 0.3 * r()) * (1 - 0.25 * u), swing = rad(46 + 24 * r());
      path.at(u, origin); path.dir(u, tangent);
      level.set(tangent.x, 0, tangent.z).normalize();
      side.set(-level.z, 0, level.x);
      along.copy(level).multiplyScalar(Math.cos(swing)).addScaledVector(side, hand * Math.sin(swing)).addScaledVector(UP, -0.1 - 0.14 * r()).normalize();
      across.set(-along.z, 0, along.x).normalize().multiplyScalar(size * 0.46);
      along.multiplyScalar(size);
      sag.set(0, -size * 0.3, 0);
      leaf.card(origin, along, across, pick(frond), normal, { sway: [0.12, 1], variation: r(), segments: 2, sag });
    }
    path.at(1, origin); path.dir(1, tangent);
    const size = reach * (0.95 + 0.3 * r());
    level.set(tangent.x, 0, tangent.z).normalize();
    along.copy(tangent).multiplyScalar(size);
    across.set(-level.z, 0, level.x).multiplyScalar(size * 0.4);
    sag.set(0, -size * 0.42, 0);
    leaf.card(origin, along, across, pick(frond), normal, { sway: [0.12, 1], variation: r(), segments: 2, sag });
  }

  // turn it back by the layout's yaw, so that the instancer's turn sets it down as it was built
  const c = Math.cos(site.yaw), s = Math.sin(site.yaw);
  for (const mesh of [near.mesh, far.mesh, leaf]) {
    for (const list of [mesh.position, mesh.root, mesh.normal]) {
      for (let o = 0; o < list.length; o += 3) { const x = list[o], z = list[o + 2]; list[o] = x * c - z * s; list[o + 2] = x * s + z * c; }
    }
  }
  // what stands on it and hangs from it (plants/build.js): the lower trunk, the limbs and younger trunks as drawn near,
  // its broken stubs and spikes, two places under each limb, and its crown. Everything is turned by the yaw as the meshes are.
  const trunk = near.tubes[0];
  const tubeAt = 2 + roots.length;
  const leaderTubes = near.tubes.slice(tubeAt, tubeAt + leaders.length);
  const limbTubes = near.tubes.slice(tubeAt + leaders.length, tubeAt + leaders.length + limbs.length);
  const deadTubes = near.tubes.slice(tubeAt + leaders.length + limbs.length);
  const turn = (v) => [v.x * c - v.z * s, v.y, v.x * s + v.z * c];
  const hang = limbs.flatMap((l) => [0.5, 0.75].map((u) => turn(l.path.at(u))));
  const ends = limbs.map((l) => turn(l.path.at(1))), spread = ends.map((e) => Math.hypot(e[0], e[2])).sort((p, q) => p - q);
  const ys = ends.map((e) => e[1]);
  const crown = { middle: [0, 0.5 * (Math.min(...ys) + Math.max(...ys)), 0], radius: spread[Math.floor(spread.length * 0.9)], low: Math.min(...ys) };
  const perch = perchOf(near.mesh, { trunk, stubs: deadTubes, limbs: [...leaderTubes, ...limbTubes] });
  return { solid: [near.mesh.geometry(), far.mesh.geometry()], foliage: [leaf.geometry()], height: CEDAR.height, reach: 13, lod: [NEAR], handWood: [0.3], max: 300, gone: 380, perch, hang, lichen: 0.4, crown };
}
