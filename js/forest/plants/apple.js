import * as THREE from 'three';
import { Mesh, sheetCell, perchOf } from './build.js';
import { curve } from './maple.js';
import { mulberry32 } from '../world/layout.js';

// The old apple tree of the clearing: what is left of whoever cleared it. Nobody has pruned it in a lifetime.
// A short trunk half a metre through, leaning, that divides at a man's chest into crooked limbs which go out
// further than the tree is tall and come down again at their ends; one of them dead, bare and broken off
// short; straight young shoots standing in rows along the backs of the others; moss on everything that faces
// the sky; and, in the middle of May, blossom.
//
// What was read (2026-11-15; agents reading a national park's vegetation report of its old homestead fields,
// a state university's orchard pages and a botanical garden's account of the species; none of it seen as an
// image): apple trees are the commonest of the plants the homesteaders of the Queets left behind (33 stems
// of 56 heritage plants counted); an old tree left to itself is up to about 9 m tall with a crown as wide, on
// a short crooked trunk 0.3 to 0.75 m through, with dead limbs and water sprouts; its bark is thin, reddish
// grey and irregularly fissured. It flowers with its leaves or just after them: at the end of April on
// average east of the Cascades (16 May in the latest year on record), in May in England. No date was found
// for the west side of the Olympics: that it is in blossom in the middle of May here is the agent's call.
// The agent's own too: its height (6.6 m), every number of its limbs, and that it leans.
//
// One tree, built once: its low limb is built towards +x, and the scene turns that where it wants it. Its wood
// has two levels: the far one is the trunk and the limbs in fewer sides, and the lesser branches and the
// twigs thin away into it. Its foliage has one. It is seen from beside it, from the trail a few strides off
// and from the cabin's window, far more than from under it: so most of its sprays stand on edge, one along
// each twig and one across its end, and few lie flat.
// Lengths are metres, angles degrees, bearings measured from +x round through +z. `heart` is the middle of its crown.
export const APPLE = { height: 6.6, crown: 4.4, heart: [0.45, 3.7, 0.1] };

const UP = new THREE.Vector3(0, 1, 0);
const rad = THREE.MathUtils.degToRad;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const NEAR = 26;                                       // how far its near wood is drawn as it is

const FORK = 1.45;                                     // where the trunk divides
// Its limbs: its bearing, how far out its end is and how high, how thick it is where it leaves the trunk, and
// how far it arches over on the way (0: it climbs straight to its end; 1: it goes up and out and comes down to it).
// The last is dead: bare, and broken off where it ends.
const LIMBS = [
  { at: 6,   out: 2.3, high: 2.25, thick: 0.17,  arch: 0.9 },        // the low limb: out over the grass, and down to a walker's head at its end
  { at: 82,  out: 1.9, high: 4.7,  thick: 0.14,  arch: 0.55 },
  { at: 152, out: 2.2, high: 2.9,  thick: 0.15,  arch: 0.85 },
  { at: 214, out: 1.1, high: 6.0,  thick: 0.15,  arch: 0.15 },       // what is left of its leader
  { at: 284, out: 1.8, high: 2.9,  thick: 0.12,  arch: 0.3, dead: true },
];

// `sheets.apple` is its painted sheet (paint/apple.js); without one it is built bare.
export function buildApple(sheets) {
  const r = mulberry32(8123), sheet = sheets.apple;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- its skeleton ------------------------------------------------------------------------------------
  // the trunk: it leaves the ground leaning one way and goes over the other, and ends in the knuckle its limbs leave from
  const lean = V(0.52, 0, 0.12), crotch = V(lean.x, FORK, lean.z);
  const trunk = curve(V(0, -0.35, 0), V(-0.13, 0.45, -0.04), V(lean.x * 0.42, FORK * 0.72, lean.z * 0.5 + 0.1), V(lean.x * 1.08, FORK + 0.3, lean.z * 1.08), 0.03, 1.3);
  const girth = (u) => 0.3 - 0.035 * u + 0.055 * Math.exp(-Math.pow((u - 0.8) / 0.12, 2)) - 0.25 * smooth(0.88, 1, u);       // the trunk's radius, a share u of the way up it
  const limbs = LIMBS.map((spec, i) => {
    const out = V(Math.cos(rad(spec.at)), 0, Math.sin(rad(spec.at))), rise = spec.high - FORK + 0.1;
    const p0 = crotch.clone().addScaledVector(UP, -0.1).addScaledVector(out, 0.1);
    // (it arches: its middle stands higher than a straight line to its end, by up to a metre)
    const p1 = p0.clone().addScaledVector(out, spec.out * 0.3).addScaledVector(UP, rise * 0.45 + 0.75 * spec.arch);
    const p2 = p0.clone().addScaledVector(out, spec.out * 0.72).addScaledVector(UP, rise * 0.85 + 0.85 * spec.arch);
    const p3 = p0.clone().addScaledVector(out, spec.out).addScaledVector(UP, rise);
    const path = curve(p0, p1, p2, p3, spec.dead ? 0.1 : 0.16, i * 2.3 + 0.7);
    // (a living limb closes down to a twig's girth at its very end, where a twig carries it on: a tube has no
    // cap. A dead one keeps most of its girth to where it broke, and is capped there: tapered to a point it
    // was a thorn)
    const radius = spec.dead ? (u) => spec.thick * (1 - 0.34 * u) : (u) => (spec.thick * (1 - 0.72 * Math.pow(u, 0.85)) + 0.014) * (1 - 0.6 * smooth(0.9, 1, u));
    return { path, out, dead: !!spec.dead, thick: spec.thick, radius, length: path.length };
  });
  // the lesser branches: four to a living limb, to one side and the other by turns, going out level and nodding;
  // and two that stand up from its back, into the middle of the crown (without them the crown was two plates
  // of blossom with the air between them)
  const side = new THREE.Vector3(), tangent = new THREE.Vector3(), level = new THREE.Vector3();
  const lesser = [];
  for (const limb of limbs) {
    (limb.dead ? [[0.55, 0]] : [[0.3, 0], [0.5, 0], [0.7, 0], [0.88, 0], [0.4, 1], [0.64, 1]]).forEach(([u, up], k) => {
      const hand = (k % 2 ? 1 : -1) * (r() < 0.85 ? 1 : -1), p0 = limb.path.at(u);
      limb.path.dir(u, tangent); level.set(tangent.x, 0, tangent.z).normalize(); side.set(-level.z, 0, level.x);
      const way = (up
        ? V(0, 0, 0).addScaledVector(side, hand * (0.2 + 0.3 * r())).addScaledVector(level, 0.1 + 0.3 * r()).addScaledVector(UP, 0.9)
        : V(0, 0, 0).addScaledVector(side, hand * (0.8 + 0.2 * r())).addScaledVector(level, 0.3 + 0.3 * r()).addScaledVector(UP, 0.12 + 0.4 * r())).normalize();
      const length = limb.dead ? 0.75 : (up ? 1.6 - 0.6 * u : 1.75 - 0.75 * u) * (0.8 + 0.4 * r()), flat = V(way.x, 0, way.z).normalize();
      const p1 = p0.clone().addScaledVector(way, length * 0.34), p2 = p0.clone().addScaledVector(way, length * 0.7).addScaledVector(flat, length * 0.08);
      const p3 = p0.clone().addScaledVector(way, length * 0.88).addScaledVector(flat, length * 0.2).addScaledVector(UP, -length * 0.14);
      const thick = limb.radius(u) * 0.55 + 0.012;
      lesser.push({ path: curve(p0, p1, p2, p3, 0.07, r() * 6), thick, dead: limb.dead, radius: limb.dead ? (v) => thick * (1 - 0.3 * v) : (v) => thick * (1 - 0.8 * v) + 0.009, length, limb });
    });
  }
  // the twigs: three to a lesser branch and three to the end of each living limb, the last of each carrying it on
  const twigs = [];
  const sprout = (from, u, hand, length, lift) => {
    const p0 = from.path.at(u);
    from.path.dir(u, tangent); level.set(tangent.x, 0, tangent.z).normalize(); side.set(-level.z, 0, level.x);
    const way = V(0, 0, 0).addScaledVector(side, hand * (0.5 + 0.45 * r())).addScaledVector(level, 0.7 + 0.3 * r()).addScaledVector(UP, lift + 0.3 * (r() - 0.5)).normalize();
    const p3 = p0.clone().addScaledVector(way, length).addScaledVector(UP, -0.16 * length);
    twigs.push({ path: curve(p0, p0.clone().addScaledVector(way, length * 0.35), p0.clone().addScaledVector(way, length * 0.7), p3, 0.04, r() * 6), way, length });
  };
  for (const branch of lesser) {
    if (branch.dead) continue;
    const hand = r() < 0.5 ? 1 : -1;
    sprout(branch, 0.45, hand, 0.65 + 0.35 * r(), 0.2);
    sprout(branch, 0.76, -hand, 0.65 + 0.35 * r(), 0.1);
    sprout(branch, 1, 0, 0.55 + 0.35 * r(), 0.0);
  }
  for (const limb of limbs) {
    if (limb.dead) continue;
    sprout(limb, 0.86, 1, 0.7 + 0.35 * r(), 0.2); sprout(limb, 0.94, -1, 0.7 + 0.35 * r(), 0.2); sprout(limb, 1, 0, 0.6 + 0.35 * r(), 0.25);
  }

  // ---- its wood, at two levels -------------------------------------------------------------------------
  const shares = (n) => Array.from({ length: n + 1 }, (_, j) => j / n);
  const axis = new THREE.Vector3();
  const wood = (fine) => {
    const mesh = new Mesh(), tubes = [], ends = [], lesserMade = [];
    const tube = (path, radius, radial, rings, options) => {
      const at = shares(rings);
      return { base: mesh.tube(at.map((u) => path.at(u)), at.map(radius), radial, options), radial, at, path };
    };
    // bare, weathered wood: the wind's second number, half-way to split wood, so that it is still shaded round
    const bare = (made) => { for (let v = made.base; v < made.base + made.at.length * (made.radial + 1); v += 1) mesh.wind[v * 2 + 1] = 0.5; return made; };
    // the trunk, with a flared foot: more rings where it flares and where it bends
    {
      const at = fine ? [0, 0.06, 0.13, 0.22, 0.34, 0.48, 0.62, 0.76, 0.88, 1] : [0, 0.13, 0.48, 1];
      const base = mesh.tube(at.map((u) => trunk.at(u)), at.map(girth), fine ? 14 : 6, { around: 2, tile: 1.3, lobes: 4, flare: (t, ring) => 0.5 * Math.exp(-Math.max(0, at[ring] - 0.06) / 0.1) });
      tubes.push({ base, radial: fine ? 14 : 6, at });
    }
    for (const limb of limbs) {
      const made = tube(limb.path, limb.radius, fine ? 8 : 4, fine ? 12 : 4, { around: 1, tile: 1.3 });
      tubes.push(made);
      if (limb.dead) ends.push(bare(made));
    }
    // from across the clearing the lesser branches and the twigs are not there: each thins to nothing on the way
    if (fine) {
      for (const branch of lesser) {
        const made = tube(branch.path, branch.radius, 5, 6, { around: 1, tile: 1, drop: true });
        if (!branch.dead) lesserMade.push(made);
        if (branch.dead) ends.push({ ...bare(made), drop: true });
      }
      for (const twig of twigs) tube(twig.path, (v) => 0.016 * (1 - 0.7 * v) + 0.005, 3, 3, { around: 1, tile: 1, drop: true });
    }
    return { mesh, tubes, ends, lesserMade };
  };
  // A dead limb's broken end. Its own last ring is torn: each point of it is carried on past the end or cut back
  // short of it, by its own amount, and one stands on as a long sliver (a ring left whole and closed with a
  // flat fan was a limb sawn off). Then a fan of faces from the torn ring back to a point inside the break,
  // weathered dark. `tear` is how far, in metres; the far level's end is not torn (0), and the roots are the
  // ring's own, so that the near end closes onto the far one.
  const cap = ({ mesh }, made, tear) => {
    const last = made.at.length - 1, ring = made.base + last * (made.radial + 1), end = made.path.at(1);
    made.path.dir(1, axis);
    const draws = Array.from({ length: made.radial }, () => r() - 0.3);
    draws[Math.floor(r() * made.radial)] = 1.5;
    for (let i = 0; i <= made.radial; i += 1) {
      const o = (ring + i) * 3, out = tear * draws[i % made.radial];
      mesh.position[o] += axis.x * out; mesh.position[o + 1] += axis.y * out; mesh.position[o + 2] += axis.z * out;
    }
    // (its paint is read by where a vertex lies across the end, in metres: light/materials.js)
    const u = new THREE.Vector3().crossVectors(axis, UP).normalize(), v = new THREE.Vector3().crossVectors(u, axis);
    const centre = mesh.vertexCount;
    mesh.position.push(end.x - axis.x * tear * 0.5, end.y - axis.y * tear * 0.5, end.z - axis.z * tear * 0.5); mesh.root.push(end.x, end.y, end.z);
    mesh.normal.push(axis.x, axis.y, axis.z); mesh.uv.push(0, 0); mesh.wind.push(0.8, 1);
    const first = mesh.vertexCount;
    for (let i = 0; i <= made.radial; i += 1) {
      const o = (ring + i) * 3;
      const dx = mesh.position[o] - end.x, dy = mesh.position[o + 1] - end.y, dz = mesh.position[o + 2] - end.z;
      mesh.position.push(mesh.position[o], mesh.position[o + 1], mesh.position[o + 2]);
      mesh.root.push(mesh.root[o], mesh.root[o + 1], mesh.root[o + 2]);
      mesh.normal.push(axis.x, axis.y, axis.z);
      mesh.uv.push(dx * u.x + dy * u.y + dz * u.z, dx * v.x + dy * v.y + dz * v.z);
      mesh.wind.push(0.45, 1);
    }
    // (a tube's rings run the other way round from its direction: build.js)
    for (let i = 0; i < made.radial; i += 1) mesh.index.push(centre, first + i + 1, first + i);
  };
  const near = wood(true), far = wood(false);
  near.tubes.forEach((tube, i) => near.mesh.settle(tube, far.mesh, far.tubes[i]));
  for (const made of near.ends) cap(near, made, made.drop ? 0.09 : 0.2);
  for (const made of far.ends) cap(far, made, 0);
  // what stands on it and hangs from it (plants/build.js): its trunk, its living limbs and lesser branches as
  // limbs, its dead limb's broken end as a stub, two places under each living limb, and its crown
  const livingMade = near.tubes.slice(1).filter((_, i) => !limbs[i].dead);
  const deadMade = near.tubes.slice(1).filter((_, i) => limbs[i].dead);
  const perch = perchOf(near.mesh, { trunk: near.tubes[0], stubs: deadMade, limbs: [...livingMade, ...near.lesserMade] });
  const hang = limbs.filter((l) => !l.dead).flatMap((l) => [0.45, 0.75].map((u) => l.path.at(u).toArray()));
  const crown = { middle: [...APPLE.heart], radius: 3.6, low: 1.5 };
  const built = { perch, hang, crown, solid: [near.mesh.geometry(), far.mesh.geometry()], height: APPLE.height, reach: 4.8, lod: [NEAR], handWood: [0.4], max: 120, gone: 150 };
  if (!sheet) return built;

  // ---- its foliage (paint/apple.js) ------------------------------------------------------------------------
  // Every card is first written down with the height of its middle, and they are then laid lowest first.
  const cards = [], cells = sheet.cells, pick = (list) => sheetCell(list[Math.floor(r() * list.length)], cells);
  const add = (origin, along, across, cell, options) => cards.push({ y: origin.y + along.y * 0.5, origin: origin.clone(), along: along.clone(), across: across.clone(), cell,
    normal: new THREE.Vector3().crossVectors(along, across).normalize(), options });
  const levelOf = (way) => { level.set(way.x, 0, way.z); if (level.lengthSq() < 1e-6) level.set(1, 0, 0); return level.normalize(); };
  // A spray on a card that stands on edge: the twig that goes `way` from `from` runs along it two fifths of the
  // way up, with its spurs standing from it. `long` metres by half that, turned `turn` radians from the twig's way.
  const sideSpray = (from, way, long, turn) => {
    levelOf(way);
    const c = Math.cos(turn), s = Math.sin(turn), run = new THREE.Vector3(level.x * c - level.z * s, 0, level.x * s + level.z * c);
    side.set(-run.z, 0, run.x);
    const tilt = rad(20) * (r() - 0.5) * 2;
    const across = new THREE.Vector3().copy(UP).multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(long * 0.5);
    const along = new THREE.Vector3().copy(run).addScaledVector(UP, Math.max(-0.25, Math.min(0.25, way.y)) * Math.abs(c)).normalize().multiplyScalar(long);
    // (the twig is two fifths of the way up the painting: the card's middle line is a tenth of its height above
    // it; and it begins half its length back if it lies across the twig. It is attached at the twig, `from`)
    const origin = new THREE.Vector3().copy(from).addScaledVector(across, 0.1).addScaledVector(along, -0.5 * Math.abs(s));
    add(origin, along, across, pick(sheet.side), { sway: [0.12, 0.5], variation: r(), segments: 2, sag: new THREE.Vector3(0, -long * 0.05, 0), root: from.clone() });
  };
  // A spray laid nearly flat from `from`, going `way`, `long` metres by half that, its far end tipped down a little
  const flatSpray = (from, way, long, tip) => {
    levelOf(way); side.set(-level.z, 0, level.x);
    const down = tip * 1.5708, roll = (r() - 0.5) * 0.9;
    const along = new THREE.Vector3().copy(level).multiplyScalar(Math.cos(down)).addScaledVector(UP, -Math.sin(down)).multiplyScalar(long);
    const across = new THREE.Vector3().copy(side).multiplyScalar(Math.cos(roll)).addScaledVector(UP, Math.sin(roll)).multiplyScalar(long * 0.5);
    add(from, along, across, pick(sheet.spray), { sway: [0.12, 0.7], variation: r(), segments: 2, sag: new THREE.Vector3(0, -long * (0.04 + 0.08 * r()), 0) });
  };
  const middle = new THREE.Vector3(), tip = new THREE.Vector3(), origin = new THREE.Vector3();
  for (const twig of twigs) {
    const long = (1.15 + 0.35 * r()) * (0.9 + 0.1 * twig.length), end = twig.path.at(1, tip).clone();
    sideSpray(twig.path.at(0.1, middle), twig.way, long, (r() - 0.5) * 0.5);
    sideSpray(end, twig.way, long * 0.92, 1.5708 + (r() - 0.5) * 0.7);
    if (r() < 0.7) flatSpray(twig.path.at(0.4, middle), twig.way, long, 0.1 + 0.3 * r());
  }
  for (const branch of lesser) {
    if (branch.dead) continue;
    for (const u of [0.22, 0.58]) {
      branch.path.dir(u, tangent);
      sideSpray(branch.path.at(u, middle), tangent, 1.2 + 0.3 * r(), (r() < 0.5 ? -1 : 1) * (0.5 + 0.5 * r()));
    }
  }
  // Water sprouts: along the backs of the living limbs where they are thick, and where the limbs leave the trunk,
  // on cards that stand on edge over the limb, the limb along the painting's foot.
  const sprouts = (path, radius, from, to, count, tall) => {
    for (let k = 0; k < count; k += 1) {
      const u = from + (to - from) * (k + 0.2 + 0.6 * r()) / count, u1 = Math.min(1, u + 1.3 / path.length);
      path.at(u, origin); path.at(u1, tip); path.dir(u, tangent);
      levelOf(tangent); side.set(-level.z, 0, level.x);
      const tilt = rad(14) * (r() - 0.5) * 2, high = tall * (0.8 + 0.4 * r());
      const across = new THREE.Vector3().copy(UP).multiplyScalar(Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(high);
      const stand = new THREE.Vector3().copy(origin).addScaledVector(UP, radius(u) * 0.6).addScaledVector(across, 0.47);
      add(stand, new THREE.Vector3().copy(tip).sub(origin), across, pick(sheet.sprout), { sway: [0.1, 0.1], variation: r(), root: origin.clone().addScaledVector(UP, radius(u) * 0.6) });
    }
  };
  for (const limb of limbs) if (!limb.dead) sprouts(limb.path, limb.radius, 0.08, 0.62, 2, 0.95);
  for (const turn of [0.9, 2.6]) {
    const run = V(Math.cos(turn), 0, Math.sin(turn));
    add(crotch.clone().addScaledVector(UP, 0.55).addScaledVector(run, -0.6), run.clone().multiplyScalar(1.2), V(0, 0.9, 0), pick(sheet.sprout), { sway: [0.1, 0.1], variation: r(), root: crotch.clone().addScaledVector(UP, 0.12) });
  }

  const leaf = new Mesh();
  cards.sort((a, b) => a.y - b.y);
  for (const card of cards) leaf.card(card.origin, card.along, card.across, card.cell, card.normal, card.options);
  return { ...built, foliage: [leaf.geometry()] };
}
