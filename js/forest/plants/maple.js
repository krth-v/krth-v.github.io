import * as THREE from 'three';
import { Mesh, sheetCell, perchOf } from './build.js';
import { mulberry32 } from '../world/layout.js';

// A bigleaf maple, as they stand at the foot of the hill where the walk turns for home: a short stout trunk
// that divides a little over head height into great limbs, which go out before they go up, each as thick
// as a lesser tree; everything on it padded with moss, which hangs from the limbs' undersides in curtains;
// licorice fern along the limbs' tops; and over all of it, late in May, a roof of leaves as broad as two
// hands, yellow-green with the light in them.
//
// One tree, built once and stood about the hall, each turned its own way (the layout's yaw): its great low
// limb is built towards +x, and a scene turns that to where it wants the limb to go.
//
// Its wood has two levels. The far one is the trunk and the great limbs alone, in fewer sides; the lesser
// branches and the twigs thin away into it. Its foliage has one, and is seen two ways. From under the tree
// a walker looks up at sprays laid nearly flat, like tiles; from the beach, the clearing and the cabin's
// window the tree is seen from the side, where a flat card is a line: so the outer sprays tip down at
// their ends, and at every twig's end leaves hang on cards that stand on edge, one along the twig and one
// across it. Under the limbs the moss's curtains stand on edge too, and the ferns above them.
//
// Lengths are metres, angles degrees, bearings measured from +x round through +z.
// `heart` is the middle of its crown: a leaf takes its light as that part of the dome faces (light/shared.js).
export const MAPLE = { height: 23, crown: 10, crownWeight: 0.5, heart: [0.4, 12, 0.2] };

const UP = new THREE.Vector3(0, 1, 0);
const rad = THREE.MathUtils.degToRad;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const NEAR = 40;                                       // how far its near wood is drawn as it is

const FORK = 3.3;                                      // where the trunk divides
// The great limbs: its bearing, how far out its end is and how high, how thick it is where it leaves the
// trunk, and how long it keeps low before it turns up (0: it climbs from the start; 1: it goes out level
// and then stands up at its end).
const LIMBS = [
  { at: 4,   out: 8.4, high: 9.0,  thick: 0.4,  low: 0.8 },        // the great low limb: out nearly level, over a walker's head, and up at its end
  { at: 78,  out: 6.2, high: 17.5, thick: 0.33, low: 0.35 },
  { at: 152, out: 7.6, high: 13.5, thick: 0.31, low: 0.55 },
  { at: 228, out: 4.2, high: 21.0, thick: 0.36, low: 0.15 },       // the leader, nearly upright
  { at: 296, out: 7.0, high: 11.5, thick: 0.28, low: 0.65 },
];

// A curve through four points (a cubic Bézier), a little sinuous: `wig` metres to one side and the other
// along it, nothing where it starts.
export function curve(p0, p1, p2, p3, wig = 0, phase = 0) {
  const side = new THREE.Vector3().subVectors(p3, p0).cross(UP);
  if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
  side.normalize();
  const at = (u, out = new THREE.Vector3()) => {
    const k = 1 - u;
    out.set(0, 0, 0).addScaledVector(p0, k * k * k).addScaledVector(p1, 3 * k * k * u).addScaledVector(p2, 3 * k * u * u).addScaledVector(p3, u * u * u);
    if (wig) out.addScaledVector(side, wig * Math.sin(u * 8.2 + phase) * smooth(0, 0.3, u)).addScaledVector(UP, wig * 0.6 * Math.sin(u * 6.1 + phase * 1.7) * smooth(0, 0.3, u));
    return out;
  };
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const dir = (u, out = new THREE.Vector3()) => out.subVectors(at(Math.min(1, u + 0.02), a), at(Math.max(0, u - 0.02), b)).normalize();
  let length = 0;
  for (let i = 1; i <= 16; i += 1) length += at(i / 16, a).distanceTo(at((i - 1) / 16, b));
  return { at, dir, length };
}

// `sheets.maple` is its painted sheet (paint/maple.js); without one it is built bare.
export function buildMaple(sheets) {
  const r = mulberry32(7717), sheet = sheets.maple;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- its skeleton ------------------------------------------------------------------------------------
  // the trunk: it leans a little the way its low limb goes, and ends in a knuckle where the limbs leave it
  const lean = V(0.32, 0, 0.1), crotch = V(lean.x, FORK, lean.z);
  const trunk = curve(V(0, -0.45, 0), V(0.02, 0.9, 0), V(lean.x * 0.7, FORK * 0.7, lean.z * 0.7), V(lean.x * 1.1, FORK + 0.55, lean.z * 1.1));
  const girth = (u) => 0.76 - 0.12 * u - 0.62 * smooth(0.8, 1, u);                       // the trunk's radius, a share u of the way up it
  const limbs = LIMBS.map((spec, i) => {
    const out = V(Math.cos(rad(spec.at)), 0, Math.sin(rad(spec.at))), rise = spec.high - FORK + 0.2;
    const p0 = crotch.clone().addScaledVector(UP, -0.2).addScaledVector(out, 0.2);
    const p1 = p0.clone().addScaledVector(out, spec.out * (0.3 + 0.45 * spec.low)).addScaledVector(UP, rise * (0.3 - 0.24 * spec.low));
    const p2 = p0.clone().addScaledVector(out, spec.out * (0.72 + 0.26 * spec.low)).addScaledVector(UP, rise * (0.66 - 0.36 * spec.low));
    const p3 = p0.clone().addScaledVector(out, spec.out).addScaledVector(UP, rise);
    const path = curve(p0, p1, p2, p3, 0.22, i * 2.1 + 0.4);
    // (it closes down to a twig's girth at its very end, where a twig carries it on: a tube has no cap, and
    // left a hand's breadth across there it was a pipe's mouth to anyone looking back along the limb)
    return { path, out, thick: spec.thick, radius: (u) => (spec.thick * (1 - 0.74 * Math.pow(u, 0.9)) + 0.02) * (1 - 0.72 * smooth(0.9, 1, u)), length: path.length };
  });
  // the lesser branches: five to a limb, to one side and the other by turns, going out and up and nodding at their ends
  const side = new THREE.Vector3(), tangent = new THREE.Vector3(), level = new THREE.Vector3();
  const lesser = [];
  for (const limb of limbs) {
    [0.22, 0.38, 0.54, 0.7, 0.86].forEach((u, k) => {
      const hand = (k % 2 ? 1 : -1) * (r() < 0.85 ? 1 : -1), p0 = limb.path.at(u);
      limb.path.dir(u, tangent); level.set(tangent.x, 0, tangent.z).normalize(); side.set(-level.z, 0, level.x);
      const way = V(0, 0, 0).addScaledVector(side, hand * (0.75 + 0.2 * r())).addScaledVector(level, 0.25 + 0.3 * r()).addScaledVector(UP, 0.3 + 0.45 * r()).normalize();
      const length = (5.2 - 2.4 * u) * (0.8 + 0.4 * r()), flat = V(way.x, 0, way.z).normalize();
      const p1 = p0.clone().addScaledVector(way, length * 0.34), p2 = p0.clone().addScaledVector(way, length * 0.7).addScaledVector(flat, length * 0.06);
      const p3 = p0.clone().addScaledVector(way, length * 0.9).addScaledVector(flat, length * 0.2).addScaledVector(UP, -length * 0.06);
      const thick = limb.radius(u) * 0.55 + 0.02;
      lesser.push({ path: curve(p0, p1, p2, p3, 0.1, r() * 6), thick, radius: (v) => thick * (1 - 0.82 * v) + 0.012, length, limb });
    });
  }
  // the twigs: four to a lesser branch and four to the end of each limb, the last of each carrying it on
  const twigs = [];
  const sprout = (from, u, hand, length, lift) => {
    const p0 = from.path.at(u);
    from.path.dir(u, tangent); level.set(tangent.x, 0, tangent.z).normalize(); side.set(-level.z, 0, level.x);
    const way = V(0, 0, 0).addScaledVector(side, hand * (0.5 + 0.4 * r())).addScaledVector(level, 0.7 + 0.3 * r()).addScaledVector(UP, lift + 0.25 * (r() - 0.5)).normalize();
    const p3 = p0.clone().addScaledVector(way, length).addScaledVector(UP, -0.12 * length);
    twigs.push({ path: curve(p0, p0.clone().addScaledVector(way, length * 0.35), p0.clone().addScaledVector(way, length * 0.7), p3), way, length });
  };
  for (const branch of lesser) {
    const hand = r() < 0.5 ? 1 : -1;
    sprout(branch, 0.36, hand, 1.5 + 0.7 * r(), 0.2);
    sprout(branch, 0.6, -hand, 1.5 + 0.7 * r(), 0.15);
    sprout(branch, 0.82, hand, 1.4 + 0.7 * r(), 0.1);
    sprout(branch, 1, 0, 1.3 + 0.6 * r(), 0.05);
  }
  for (const limb of limbs) {
    sprout(limb, 0.9, 1, 1.9 + 0.6 * r(), 0.3); sprout(limb, 0.94, -1, 1.9 + 0.6 * r(), 0.3);
    sprout(limb, 0.97, r() < 0.5 ? 1 : -1, 1.7 + 0.6 * r(), 0.5); sprout(limb, 1, 0, 1.6 + 0.6 * r(), 0.6);
  }

  // ---- its wood, at two levels -------------------------------------------------------------------------
  const shares = (n) => Array.from({ length: n + 1 }, (_, j) => j / n);
  const wood = (fine) => {
    const mesh = new Mesh(), tubes = [], lesserTubes = [], twigTubes = [];
    const tube = (path, radius, radial, rings, options) => {
      const at = shares(rings);
      return { base: mesh.tube(at.map((u) => path.at(u)), at.map(radius), radial, options), radial, at };
    };
    // the trunk, with a flared, fluted foot: more rings where it flares
    {
      const at = (fine ? [0, 0.05, 0.1, 0.16, 0.24, 0.36, 0.5, 0.64, 0.76, 0.86, 0.93, 1] : [0, 0.12, 0.36, 0.76, 1]);
      const base = mesh.tube(at.map((u) => trunk.at(u)), at.map(girth), fine ? 20 : 8, { around: 3, tile: 2.4, lobes: 5, flare: (t, ring) => 0.55 * Math.exp(-Math.max(0, at[ring] - 0.1) / 0.09) });
      tubes.push({ base, radial: fine ? 20 : 8, at });
    }
    for (const limb of limbs) tubes.push(tube(limb.path, limb.radius, fine ? 10 : 5, fine ? 16 : 5, { around: 1, tile: 2.4 }));
    // from across the forest the lesser branches and the twigs are not there: each thins to nothing on the way to that level
    if (fine) {
      for (const branch of lesser) lesserTubes.push(tube(branch.path, branch.radius, 6, 7, { around: 1, tile: 1.5, drop: true }));
      for (const twig of twigs) twigTubes.push(tube(twig.path, (v) => 0.026 * (1 - 0.75 * v) + 0.006, 3, 2, { around: 1, tile: 1, drop: true }));
    }
    return { mesh, tubes, lesserTubes, twigTubes };
  };
  const near = wood(true), far = wood(false);
  near.tubes.forEach((tube, i) => near.mesh.settle(tube, far.mesh, far.tubes[i]));
  const built = { solid: [near.mesh.geometry(), far.mesh.geometry()], height: MAPLE.height, reach: 13, lod: [NEAR], handWood: [0.35], max: 125, gone: 150 };
  // what stands on it and hangs from it (plants/build.js): the finest wood's trunk, its five limbs, its lesser branches and
  // its twigs, a place or two under every limb and branch, and the crown
  built.perch = perchOf(near.mesh, { trunk: near.tubes[0], limbs: [...near.tubes.slice(1), ...near.lesserTubes, ...near.twigTubes] });
  built.hang = [...limbs.flatMap((l) => [0.3, 0.55, 0.8].map((v) => l.path.at(v).toArray())),
    ...lesser.flatMap((b) => [0.4, 0.7].map((v) => b.path.at(v).toArray()))];
  built.lichen = 0.3;                                                // (a bigleaf maple carries more epiphytes than anything else in these woods)
  built.crown = { middle: [...MAPLE.heart], radius: 9, low: 4.5 };
  if (!sheet) return built;

  // ---- its foliage (paint/maple.js) ------------------------------------------------------------------------
  // Every card is first written down with the height of its middle, and they are then laid lowest first: a
  // walker under the tree looks up through them, and what is nearest is best drawn before what it hides
  // (what that saves was not measured).
  const cards = [], cells = sheet.cells, pick = (list) => sheetCell(list[Math.floor(r() * list.length)], cells);
  const heart = V(...MAPLE.heart);
  // (a card carries its own normal, the way it faces: the shader draws it in as it turns edge-on to the eye)
  const add = (origin, along, across, cell, options) => cards.push({ y: origin.y + along.y * 0.5 + (options.sag ? options.sag.y * 0.25 : 0), origin: origin.clone(), along: along.clone(), across: across.clone(), cell,
    normal: new THREE.Vector3().crossVectors(along, across).normalize(), options });
  const levelOf = (way) => { level.set(way.x, 0, way.z); if (level.lengthSq() < 1e-6) level.set(1, 0, 0); return level.normalize(); };
  // A spray laid nearly flat from `from`, going `way`, `long` metres by half that: its far end tipped down by
  // `tip` (a share of a right angle), which is what shows of it from beside the tree.
  const flatSpray = (from, way, long, tip) => {
    levelOf(way); side.set(-level.z, 0, level.x);
    const down = tip * 1.5708, roll = (r() - 0.5) * 0.7;
    const along = new THREE.Vector3().copy(level).multiplyScalar(Math.cos(down)).addScaledVector(UP, -Math.sin(down)).multiplyScalar(long);
    const across = new THREE.Vector3().copy(side).multiplyScalar(Math.cos(roll)).addScaledVector(UP, Math.sin(roll)).multiplyScalar(long * 0.5);
    add(from, along, across, pick(sheet.spray), { sway: [0.15, 1], variation: r(), segments: 2, sag: new THREE.Vector3(0, -long * (0.06 + 0.1 * r()), 0) });
  };
  // Leaves hanging from a twig that goes `way` from `from`, on a card that stands on edge, `long` by half that,
  // turned `turn` radians from the twig's own way.
  const hungSpray = (from, way, long, turn) => {
    levelOf(way);
    const c = Math.cos(turn), s = Math.sin(turn), run = new THREE.Vector3(level.x * c - level.z * s, 0, level.x * s + level.z * c);
    side.set(-run.z, 0, run.x);
    const tilt = rad(16) * (r() - 0.5) * 2;
    const across = new THREE.Vector3().copy(UP).multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(long * 0.5);
    const along = new THREE.Vector3().copy(run).addScaledVector(UP, -0.1).normalize().multiplyScalar(long);
    // (the twig runs along the top of the painting: the card hangs from it, and begins half its length back if it lies across the twig)
    const origin = new THREE.Vector3().copy(from).addScaledVector(across, -0.36).addScaledVector(along, -0.5 * Math.abs(s));
    // (it is attached at the twig, `from`: its origin is the middle of its first edge, in the air below)
    add(origin, along, across, pick(sheet.hung), { sway: [0.25, 0.6], variation: r(), segments: 2, sag: new THREE.Vector3(0, -long * 0.08, 0), root: from.clone() });
  };
  const middle = new THREE.Vector3(), tip = new THREE.Vector3(), origin = new THREE.Vector3();
  // how far out in the crown a place is, 0 at the trunk's line and 1 at the crown's edge: the outer sprays tip down
  const outer = (p) => clamp01(Math.hypot(p.x - heart.x, p.z - heart.z) / 9);
  for (const twig of twigs) {
    const long = (2.5 + 0.8 * r()) * (0.85 + 0.15 * twig.length / 2), end = twig.path.at(1, tip).clone(), edge = outer(end);
    flatSpray(twig.path.at(0.2, middle), twig.way, long, 0.08 + 0.3 * edge * r());
    flatSpray(twig.path.at(0.55, middle), V(twig.way.x - twig.way.z * (r() - 0.5) * 1.6, 0, twig.way.z + twig.way.x * (r() - 0.5) * 1.6), long * 0.9, 0.15 + 0.45 * edge);
    hungSpray(twig.path.at(0.15, middle), twig.way, long * 0.9, 0);
    hungSpray(end, twig.way, long * 0.9, 1.5708 + (r() - 0.5) * 0.5);
  }
  for (const branch of lesser) {
    for (const u of [0.34, 0.62]) {
      branch.path.dir(u, tangent); levelOf(tangent);
      const hand = r() < 0.5 ? 1 : -1, way = V(level.x - level.z * hand * 1.2, 0, level.z + level.x * hand * 1.2);
      flatSpray(branch.path.at(u, middle).addScaledVector(UP, 0.15), way, 2.3 + 0.8 * r(), 0.1 + 0.2 * r());
    }
  }
  // The moss: under every limb, as far along it as it is thick enough to hold a mat, a curtain in lengths, each
  // on a card that stands on edge under the limb and bends as it does; two to a length under the great limbs,
  // leaning apart, so that the curtain has depth from any side. It is longest near the trunk.
  const UPRIGHT = 0.8;                                 // a limb that climbs more steeply than this (the sine of its slope) carries no curtain and no fern
  const curtain = (path, radius, from, to, every, tall, pair) => {
    const lengths = Math.max(1, Math.round(((to - from) * path.length) / every));
    for (let k = 0; k < lengths; k += 1) {
      const u0 = from + ((to - from) * k) / lengths, u1 = Math.min(1, u0 + ((to - from) / lengths) * 1.2), um = (u0 + u1) / 2;
      path.at(u0, origin); path.at(um, middle); path.at(u1, tip); path.dir(um, tangent);
      levelOf(tangent); side.set(-level.z, 0, level.x);
      const sag = new THREE.Vector3().copy(origin).add(tip).multiplyScalar(0.5).sub(middle).multiplyScalar(4);       // the card's middle line bends as the limb does between its two ends
      for (const leanTo of pair ? [-1, 1] : [r() < 0.5 ? -1 : 1]) {
        const tilt = leanTo * rad(8 + 10 * r()), high = tall * (1 - 0.55 * um) * (0.8 + 0.4 * r());
        const across = new THREE.Vector3().copy(UP).multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(high);
        // (the limb's own underside is at the top of the painting, a little way down from its edge)
        const hang = new THREE.Vector3().copy(origin).addScaledVector(UP, -radius(um) * 0.6).addScaledVector(across, -0.4);
        const cell = pick(sheet.moss), variation = r();
        // Nothing hangs under a limb that stands up: a card on edge along one is a sliver (the leader's were, all
        // the way up it). Its moss is the bark's own there. (Its random numbers are drawn all the same.)
        if (Math.abs(tangent.y) > UPRIGHT) continue;
        // (it is attached under the limb's middle, not at its own first edge's middle, which hangs in the air)
        add(hang, new THREE.Vector3().copy(tip).sub(origin).sub(sag), across, cell, { sway: [0.1, 0.1], variation, segments: 2, sag, root: middle.clone().addScaledVector(UP, -radius(um) * 0.6) });
      }
    }
  };
  for (const limb of limbs) curtain(limb.path, limb.radius, 0.05, 0.78, 1.5, 1.35, true);
  for (const branch of lesser) curtain(branch.path, branch.radius, 0.04, 0.6, 1.4, 0.75, false);
  // Licorice fern: along the tops of the great limbs where they are thickest, and in the crotch, on cards that
  // stand on edge above the limb, the limb along the painting's foot.
  const ferns = (path, radius, from, to, count, tall) => {
    for (let k = 0; k < count; k += 1) {
      const u = from + (to - from) * (k + 0.2 + 0.6 * r()) / count, u1 = Math.min(1, u + 1.25 / path.length);
      path.at(u, origin); path.at(u1, tip); path.dir(u, tangent);
      levelOf(tangent); side.set(-level.z, 0, level.x);
      const tilt = rad(22) * (r() - 0.5) * 2, high = tall * (0.8 + 0.4 * r());
      const across = new THREE.Vector3().copy(UP).multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(high);
      const stand = new THREE.Vector3().copy(origin).addScaledVector(UP, radius(u) * 0.7).addScaledVector(across, 0.42);
      const cell = pick(sheet.fern), variation = r();
      if (Math.abs(tangent.y) > UPRIGHT) continue;
      add(stand, new THREE.Vector3().copy(tip).sub(origin), across, cell, { sway: [0.08, 0.08], variation, root: origin.clone().addScaledVector(UP, radius(u) * 0.7) });
    }
  };
  for (const limb of limbs) ferns(limb.path, limb.radius, 0.04, 0.5, 3, 0.62);
  // (and two tufts in the crotch, where the limbs leave the trunk and their litter gathers)
  for (const turn of [0.6, 2.4]) {
    const run = V(Math.cos(turn), 0, Math.sin(turn));
    add(crotch.clone().addScaledVector(UP, 0.42).addScaledVector(run, -0.65), run.clone().multiplyScalar(1.3), V(0, 0.66, 0), pick(sheet.fern), { sway: [0.08, 0.08], variation: r() });
  }

  const leaf = new Mesh();
  cards.sort((a, b) => a.y - b.y);
  for (const card of cards) leaf.card(card.origin, card.along, card.across, card.cell, card.normal, card.options);
  return { ...built, foliage: [leaf.geometry()] };
}

// A vine maple, as it grows under the bigleaf maples and along the hall's edges: a handful of slender stems
// from one root, green and smooth, that go up for a little and then arch over and out, further than they are
// tall; and along the outer two thirds of each, leaves in tiers, small and round, of seven points, with moss
// hanging under the stems where they have gone over.
// One plant, turned and scaled wherever it stands. One level: it is drawn only from near by.
export const VINE = { height: 5, heart: [0, -40, 0] };              // its leaves are lit from above, wherever they hang
export function buildVineMaple(sheets) {
  const r = mulberry32(9049), sheet = sheets.maple, wood = new Mesh(), leaf = new Mesh();
  const mossy = mulberry32(9051);
  const stemTubes = [], sprigs = [], hang = [];                       // the moss's own random numbers: the stems and the leaves are as they were built
  const V = (x, y, z) => new THREE.Vector3(x, y, z), cells = sheet.cells, cards = [];
  const side = new THREE.Vector3(), tangent = new THREE.Vector3(), level = new THREE.Vector3();
  // its stems: [how far out its end is, how high its end is, how far its end nods] - from one that stands to
  // one that goes out low, most of them arching, none below a walker's head beyond the first stride from its root
  const STEMS = [[1.0, 4.6, 0.3], [1.5, 4.0, 0.5], [2.6, 3.7, 0.9], [3.2, 3.3, 0.8], [3.4, 2.9, 0.4], [2.2, 4.3, 1.0]];
  STEMS.forEach(([far, high, nod], i) => {
    const bearing = (i * 2.39996) + (r() - 0.5) * 0.7, out = V(Math.cos(bearing), 0, Math.sin(bearing));
    const reach = far * (0.85 + 0.3 * r()), top = high * (0.9 + 0.2 * r());
    const p0 = V(out.x * 0.12, -0.2, out.z * 0.12), p1 = p0.clone().addScaledVector(out, reach * 0.12).addScaledVector(UP, top * 0.75);
    const p2 = p0.clone().addScaledVector(out, reach * 0.55).addScaledVector(UP, top + nod * 0.3), p3 = p0.clone().addScaledVector(out, reach).addScaledVector(UP, top - nod);
    const path = curve(p0, p1, p2, p3, 0.09, r() * 6), thick = 0.03 + 0.016 * r();
    const at = Array.from({ length: 15 }, (_, j) => j / 14);
    const stemBase = wood.tube(at.map((u) => path.at(u)), at.map((u) => thick * (1 - 0.72 * u) + 0.007), 4, { around: 1, tile: 1.2 });
    stemTubes.push({ base: stemBase, radial: 4, at });
    for (const u of [0.55, 0.7, 0.85]) { const q = path.at(u), d = path.dir(u); sprigs.push([q.x, q.y, q.z, d.x, d.y, d.z]); }
    for (const u of [0.5, 0.65, 0.8]) { path.dir(u, tangent); if (Math.abs(tangent.y) <= 0.8) hang.push(path.at(u).toArray()); }
    // its leaves: tiers along its outer two thirds, to one side and the other by turns, and one at its end
    const tiers = 5 + Math.floor(r() * 2);
    for (let k = 0; k <= tiers; k += 1) {
      const u = k === tiers ? 0.97 : 0.32 + 0.6 * (k + 0.5 * r()) / tiers, from = path.at(u);
      path.dir(u, tangent); level.set(tangent.x, 0, tangent.z); if (level.lengthSq() < 1e-6) level.copy(out); level.normalize(); side.set(-level.z, 0, level.x);
      // (a tier hangs a little from its stem and is tipped to one side: laid level over a walker's head, they
      // are all seen nearly edge-on from the trail, and what is seen edge-on is let go: light/shared.js)
      const hand = k === tiers ? 0 : (k % 2 ? 1 : -1), long = (1.5 + 0.6 * r()) * (k === tiers ? 0.9 : 1), down = 0.25 + 0.4 * r(), roll = (r() < 0.5 ? -1 : 1) * (0.25 + 0.4 * r());
      const way = new THREE.Vector3().copy(level).multiplyScalar(k === tiers ? 1 : 0.45).addScaledVector(side, hand * 0.9).normalize();
      const across = new THREE.Vector3(-way.z, 0, way.x).multiplyScalar(Math.cos(roll)).addScaledVector(UP, Math.sin(roll)).multiplyScalar(long * 0.5);
      const along = new THREE.Vector3().copy(way).multiplyScalar(Math.cos(down)).addScaledVector(UP, -Math.sin(down)).multiplyScalar(long);
      cards.push({ y: from.y, origin: from.clone().addScaledVector(way, -0.12), along, across, variation: r(), sag: new THREE.Vector3(0, -long * (0.05 + 0.08 * r()), 0) });
    }
    // Its moss. A vine maple's stems carry more of it than anything else in these woods: it hangs under each
    // where the stem has gone over, in lengths, on cards that stand on edge under the stem and bend as it
    // does (as under a bigleaf maple's limbs), longest where the stem is thickest.
    for (let k = 0; k < 4; k += 1) {
      const u0 = 0.4 + 0.135 * k, u1 = u0 + 0.16, um = (u0 + u1) / 2, from = path.at(u0), mid = path.at(um), to = path.at(u1);
      const tilt = (mossy() < 0.5 ? -1 : 1) * (0.1 + 0.22 * mossy()), high = (0.3 + 0.28 * mossy()) * (1.15 - 0.6 * um), variation = mossy();
      path.dir(um, tangent);
      if (Math.abs(tangent.y) > 0.8) continue;           // nothing hangs under a stem that stands up: a card on edge along one is a sliver
      level.set(tangent.x, 0, tangent.z); if (level.lengthSq() < 1e-6) level.copy(out); level.normalize(); side.set(-level.z, 0, level.x);
      const across = new THREE.Vector3().copy(UP).multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(high);
      const sag = new THREE.Vector3().copy(from).add(to).multiplyScalar(0.5).sub(mid).multiplyScalar(4);
      const girth = thick * (1 - 0.72 * um) + 0.007;
      cards.push({ y: mid.y - high * 0.5, origin: from.clone().addScaledVector(UP, -girth * 0.6).addScaledVector(across, -0.4), along: to.clone().sub(from).sub(sag), across, variation, sag,
        cell: sheetCell(sheet.moss[k % sheet.moss.length], cells), sway: [0.1, 0.1], root: mid.clone().addScaledVector(UP, -girth * 0.6) });
    }
  });
  cards.sort((a, b) => a.y - b.y);
  for (const card of cards) leaf.card(card.origin, card.along, card.across, card.cell || sheetCell(sheet.vine[0], cells), new THREE.Vector3().crossVectors(card.along, card.across).normalize(),
    { sway: card.sway || [0.2, 1], variation: card.variation, segments: 2, sag: card.sag, ...(card.root ? { root: card.root } : {}) });
  // (`reach` is for the largest it is laid at: its stems go out 3.9 m and their last tiers two more, at scale 1.5)
  return { solid: [wood.geometry()], foliage: [leaf.geometry()], perch: perchOf(wood, { limbs: stemTubes, sprigs }), hang, crown: { middle: [0, 3, 0], radius: 3.2, low: 1.8 }, height: VINE.height, reach: 9, lod: [], max: 70, gone: 95, casts: false };
}
