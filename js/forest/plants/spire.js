import * as THREE from 'three';
import { Mesh, perchOf } from './build.js';
import { mulberry32 } from '../world/layout.js';

// The valley's own conifers: the Sitka spruce of the river's banks and the hill, and the western hemlock of
// the valley's slopes (paint/spire.js). They stand where the layout scattered its `spruce` (world/layout.js),
// tree for tree: which of the two a tree is, is settled after the layout from where it stands (index.js).
//
// The old terrace's conifers (plants/conifer.js) were built to be walked under: their crowns begin far overhead
// and are flat boughs seen from below. These are seen from beside them, across the river and up the valley's
// walls, a hundred and four hundred metres off, and from the cabin's window; a few of the spruces are walked
// past (the nearest stands 11 m from the walk). So a tree here is, at every distance, its trunk and its whole
// crown painted on two crossed cards through the trunk (Mesh.whole in build.js), and nearer than that it has
// besides them its limbs, each with a bough seen from beside it standing on edge along it and boughs seen
// flat lying out from it to either hand, which with the limb make a plate:
//   to `lod[0]`   every limb, with its side bough and five flat ones
//   to `lod[1]`   every other limb, with its side bough, the flat bough at its end and the outer pair
//   beyond        the trunk and the two cards
// Between two levels what goes shrinks away (a limb's wood onto its own middle line, its side bough to where
// the limb leaves the trunk, a flat bough to its own foot on the limb; from the second level to the third,
// every card to where its limb leaves the trunk), and what stays does not move: the
// crown's cards are the same in all three, so nothing slides. (The spruce that stood in for these had a far
// level of thirty large cards that grew out of the trunk as the level came in, and from the ravine's rim the
// thirteen hundred of them on the far wall were the dearest thing on the walk: CLAUDE.md, "Measured".)
// What the eye's place does to the cards is done in the shader (light/shared.js, AXIS), by where the eye
// is and not by which level is drawn, so it is nothing the levels' hand-over can show: a card is drawn in to
// the trunk as it turns edge-on; it is lit as the side of a cone; from nearby (within 28 m, and whole again by
// 60) it is drawn in to two fifths of its width and darkened, the tree's own shade behind its boughs, since a
// crown painted at a hand's breadth to the pixel is a soft sheet among boughs drawn needle by needle; and
// looked up into from under the tree it is gone.
//
// What was read (2026-11-15; agents reading the Forest Service's Silvics and FEIS accounts, the Park Service's
// handbook, university tree pages and a conifer database, each claim then checked against a second source; none
// of it seen as an image). Sitka spruce "commonly occupies alluvial soils along streams", rarely grows above
// 600 m on the peninsula, and mostly stands mixed with western hemlock; on the Hoh's terraces the forest goes
// from alder and willow on the bars to hemlock on the oldest ground. It reaches 27 m in fifty years and 48 m
// in a hundred on a good site, and far more in old growth (70 m, and 2 m through); a stand 147 years old
// averaged 64 m and 86 cm through. Its trunk is straight, from a swollen, buttressed foot; forest-grown it has
// "a long bole free of lower limbs", its dead branches staying on a long time; its crown is open and conical,
// of horizontal branches. Western hemlock is usually 30 to 46 m at maturity (49 to 61 m is not uncommon; the
// park's large ones 38 to 53 m and 0.6 to 1.2 m through), its crown short and narrow, its leader arcing over.
// Not found at any source read: which conifers clothe the lower walls of these valleys, and in what shares
// (the general accounts have western hemlock favoured on the moist western slopes, with silver fir higher);
// how far down a trunk the living crown comes in a stand. Those, the trees' girths at these heights, every
// number of their limbs, and where one species gives way to the other are the agent's own.
//
// Lengths are metres, angles degrees. `spread(t)` is a limb's length and `rise(t)` the angle above level at
// which it leaves the trunk, t of the way up the crown; `sag` and `upturn` are how it sags along its length
// and lifts (or, below zero, droops on) at its tip, as shares of its length; `droop` is how far below level
// a bough seen flat hangs, at least and how much more at most. `bow` is how far out of true the trunk stands
// at half its height (it is true again at its top, where the painted leader stands), and `trunk` where the
// trunk ends, if not at the tree's height: a hemlock's leader arcs over, and is painted. `span` is the painted crown: the
// heights at the foot and the top of its cell; `rows` are the card's outline, [height, half-width], and the
// crown is painted inside it. `paint` is the habit of its twigs (paint/spire.js).
const outline = (rows) => (h) => {
  if (h <= rows[0][0]) return rows[0][1];
  for (let i = 1; i < rows.length; i += 1) if (h <= rows[i][0]) return rows[i - 1][1] + (rows[i][1] - rows[i - 1][1]) * (h - rows[i - 1][0]) / (rows[i][0] - rows[i - 1][0]);
  return rows[rows.length - 1][1];
};
const spire = (spec) => ({ ...spec, halfAt: outline(spec.rows), halfCell: 192 * (spec.span[1] - spec.span[0]) / 1024 });

export const SPIRES = {
  // Sitka spruce, a tree of a hundred years or so, a metre through at chest height, as it grows at the edge of
  // a stand, where the river or a clearing lets the light in at its side: branched nearly to the ground, its
  // lowest limbs the longest, sweeping down and lifting at their ends. (Grown inside a stand it would have a
  // long bare trunk. These are the forest's edge: with their trunks bare, the far bank seen from the beach was
  // a slope of poles with the ground showing between them.)
  spruce: spire({
    seed: 4603, needles: 'spruceNeedle', height: 46, radius: 0.5, top: 0.05, flare: 0.65, lobes: 6, bow: 0.22, around: 3,
    crown: [3.5, 45.2], limbs: 66, spread: (t) => 0.6 + 6.0 * Math.pow(1 - t, 0.8), rise: (t) => -20 + 34 * Math.pow(t, 0.85), sag: 0.1, upturn: 0.14, droop: [6, 16], stubs: 3,
    span: [0.3, 46.9], rows: [[0.5, 6.4], [3.2, 7.7], [9, 7.6], [18, 6.3], [31, 4.3], [46.7, 1.0]], heart: [0, 23, 0],
    lod: [26, 75], hand: [0.6, 0.4], handWood: [0.3, 0.15], max: 390, gone: 470,
    crownRadius: 6.8, crownWeight: 0.85,              // what it is in the crown map: as the spruce that stood in for it was
    paint: { profile: 64, facing: 46, core: 0.42, every: 0.36, hang: [0.45, 1.25], lean: 0.85, over: 0.5, needle: 3.6, rank: 1.2, body: 0.3, nod: 0.15, leader: 1.3, arc: 0, whorl: 0.6,
      needlePx: 7, bodyPx: 5, sub: 3, flatLean: 1.08, sideSag: 0.1, sideLift: 0.16 },
  }),
  // Western hemlock in a stand on a slope: slimmer, the lower trunk bare, the crown narrow and fine, every
  // limb's end drooping and the leader arcing over.
  slope: spire({
    seed: 5501, needles: 'hemlockNeedle', height: 46, trunk: 43.6, radius: 0.4, top: 0.04, flare: 0.3, lobes: 5, bow: 0.28, around: 2,
    crown: [15, 43.4], limbs: 56, spread: (t) => 0.5 + 3.9 * Math.pow(1 - t, 0.7), rise: (t) => -12 + 12 * t, sag: 0.16, upturn: -0.1, droop: [14, 20], stubs: 5,
    span: [11.4, 46.4], rows: [[11.8, 4.7], [16, 5.3], [26, 4.3], [36, 2.8], [46.2, 1.6]], heart: [0, 30, 0],
    lod: [20, 70], hand: [0.6, 0.4], handWood: [0.3, 0.15], max: 390, gone: 470,
    paint: { profile: 62, facing: 44, core: 0.42, every: 0.32, hang: [0.35, 1.0], lean: 1.15, over: 0.3, needle: 2.7, rank: 1.25, body: 0.22, nod: 1.0, leader: 2.4, arc: 0.6, whorl: -0.25,
      needlePx: 5, bodyPx: 3.5, sub: 5, flatLean: 0.95, sideSag: 0.2, sideLift: -0.12 },
  }),
};

const UP = new THREE.Vector3(0, 1, 0);
const rad = THREE.MathUtils.degToRad;

// `sheet` is the species' painted sheet (spireAtlas in paint/spire.js).
export function buildSpire(spec, sheet) {
  const r = mulberry32(spec.seed), H = spec.height, [from, to] = spec.crown;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- its skeleton ------------------------------------------------------------------------------------
  const bend = r() * 6.283, T = spec.trunk || H;
  const axis = (h) => { const k = Math.min(1, Math.max(0, h) / T), off = spec.bow * 4 * k * (1 - k); return V(Math.cos(bend) * off, h, Math.sin(bend) * off); };
  const girth = (h) => spec.top + (spec.radius - spec.top) * Math.pow(Math.max(0, 1 - Math.max(0, h) / T), 0.8);
  const limbs = [];
  for (let i = 0; i < spec.limbs; i += 1) {
    const t = Math.pow((i + 0.8 * r()) / spec.limbs, 0.95), h = from + (to - from) * t;
    const azimuth = i * 2.39996 + (r() - 0.5) * 0.9, length = spec.spread(t) * (0.85 + 0.25 * r()), rise = rad(spec.rise(t) + (r() - 0.5) * 8);
    const out = V(Math.cos(azimuth), 0, Math.sin(azimuth)), dir = out.clone().multiplyScalar(Math.cos(rise)).addScaledVector(UP, Math.sin(rise));
    const p0 = axis(h).addScaledVector(out, girth(h) * 0.8);
    const at = (v) => p0.clone().addScaledVector(dir, length * v).addScaledVector(UP, length * (-spec.sag * v * v + spec.upturn * Math.pow(v, 4)));
    limbs.push({ t, out, p0, at, length, thick: 0.02 + length * 0.009, stays: i % 2 === 0, draws: Array.from({ length: 12 }, () => r()) });
  }

  // ---- its trunk, at three levels ----------------------------------------------------------------------
  // (it begins under the ground: on a slope the foot of a trunk a metre through stands a hand clear on the low side)
  const trunks = [[18, 14], [8, 8], [2, 4]].map(([rings, radial], li) => {
    const mesh = new Mesh(), heights = Array.from({ length: rings + 1 }, (_, j) => -0.6 + (T + 0.6) * Math.pow(j / rings, 1.35));
    const tube = { radial, at: heights, base: mesh.tube(heights.map(axis), heights.map(girth), radial, { around: spec.around, tile: 2.4, lobes: spec.lobes,
      flare: (t, ring) => spec.flare * Math.exp(-Math.max(0, heights[ring]) / (spec.radius * 1.8)) }) };
    // The stubs of the limbs it has shed, on the bare trunk under the crown (a spruce's dead branches stay on
    // it a long time): short, thick where they leave the trunk, crooked, and blunt where they broke. From
    // nearby only: they thin away into their own middle lines as the trunk goes over to the next level.
    if (li === 0) {
      const sr = mulberry32(spec.seed + 7);
      for (let k = 0; k < spec.stubs; k += 1) {
        const h = 2.2 + (from - 2.9) * sr(), a = sr() * 6.283, long = 0.35 + 0.7 * sr(), out = V(Math.cos(a), 0, Math.sin(a)), across = V(-out.z, 0, out.x);
        const p0 = axis(h).addScaledVector(out, girth(h) * 0.85), p1 = p0.clone().addScaledVector(out, long * 0.55).addScaledVector(UP, -0.04 - 0.1 * sr()).addScaledVector(across, (sr() - 0.5) * 0.16);
        const p2 = p0.clone().addScaledVector(out, long).addScaledVector(UP, (sr() - 0.6) * 0.2).addScaledVector(across, (sr() - 0.5) * 0.24);
        mesh.tube([p0, p1, p2, p2.clone().addScaledVector(out, 0.03)], [0.05, 0.038, 0.03, 0.004], 5, { around: 1, tile: 1, drop: true });
      }
    }
    return { mesh, tube };
  });
  trunks[0].mesh.settle(trunks[0].tube, trunks[1].mesh, trunks[1].tube);
  trunks[1].mesh.settle(trunks[1].tube, trunks[2].mesh, trunks[2].tube);

  // ---- its limbs' wood, which goes as their boughs do (world/instancer.js: `limbs`) ---------------------
  const limbWood = [new Mesh(), new Mesh()], limbTubes = [];
  for (const l of limbs) {
    const fine = [0, 0.25, 0.5, 0.75, 1], coarse = [0, 0.5, 1], radius = (v) => l.thick * (1 - 0.8 * v) + 0.006;
    const near = { radial: 4, at: fine, base: limbWood[0].tube(fine.map(l.at), fine.map(radius), 4, { around: 1, tile: 1.5, drop: !l.stays }) };
    if (!l.stays) continue;
    limbTubes.push(near);                                    // (a bird sits only on a limb that is still drawn from further off)
    const mid = { radial: 3, at: coarse, base: limbWood[1].tube(coarse.map(l.at), coarse.map(radius), 3, { around: 1, tile: 1.5, drop: true }) };
    limbWood[0].settle(near, limbWood[1], mid);
  }

  // ---- its foliage, at three levels --------------------------------------------------------------------
  const leaf = [new Mesh(), new Mesh(), new Mesh()];
  const flat = new THREE.Vector3(), side = new THREE.Vector3();
  const pick = (cells, draw) => cells[Math.min(cells.length - 1, Math.floor(draw * cells.length))];
  for (const l of limbs) {
    const d = l.draws, normal = V(0, 0, 0).addScaledVector(l.out, 0.62).addScaledVector(UP, 0.5 + 0.5 * l.t).normalize();
    // A card in the first level, and in the second if the limb stays and the second has it too (`kept`). Where
    // the second has it, the first's is its own root and does not move; where not, it shrinks to `foot`.
    const lay = (origin, along, across, cell, sway, variation, kept, foot) => {
      const stays = l.stays && kept;
      leaf[0].card(origin, along, across, cell, normal, { sway, variation, ...(stays ? { becomes: { along, across } } : { root: foot }) });
      if (stays) leaf[1].card(origin, along, across, cell, normal, { sway, variation, root: l.p0 });
    };
    // The bough from beside it: a card that stands on edge along the limb, laid so that the limb painted on it
    // (sheet.limb: where its two ends are in the cell) runs from the limb's own foot to its own end.
    {
      const a = l.at(0.05), chord = l.at(1).sub(a), [us, ws] = sheet.limb.from, [ue, we] = sheet.limb.to, tall = chord.length() / ((ue - us) * 2.5), tilt = rad(10) * (d[0] - 0.5) * 2;
      flat.set(chord.x, 0, chord.z).normalize(); side.set(-flat.z, 0, flat.x);
      const across = V(0, 0, 0).addScaledVector(UP, Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(tall);
      const along = chord.addScaledVector(across, we - ws).multiplyScalar(1 / (ue - us));
      lay(a.addScaledVector(along, -us).addScaledVector(across, ws - 0.5), along, across, pick(sheet.side, d[1]), [0.1, 0.7], d[2], true, l.p0);
    }
    // The boughs seen flat, which with the limb make a plate: two to either hand part of the way out, and one
    // along the limb's own end. The second level keeps the end and the outer pair.
    [[0.26, -1, 0.36, 0.5, 3, false], [0.3, 1, 0.36, 0.5, 4, false], [0.52, -1, 0.3, 0.5, 5, true], [0.56, 1, 0.3, 0.5, 6, true], [0.62, 0, 0.42, 0.3, 9, true]].forEach(([v, hand, share, least, k, kept]) => {
      const at = l.at(v), way = l.at(Math.min(1, v + 0.06)).sub(l.at(v - 0.06));
      flat.set(way.x, 0, way.z).normalize(); side.set(-flat.z, 0, flat.x);
      const swing = hand * rad(38 + 22 * d[k]), droop = rad(spec.droop[0] + spec.droop[1] * d[k + 1]) - Math.atan2(way.y, Math.hypot(way.x, way.z)) * 0.7, size = (share * l.length + least) * (0.85 + 0.3 * d[k + 2]);
      const out = flat.clone().multiplyScalar(Math.cos(swing)).addScaledVector(side, Math.sin(swing)), roll = rad(20) * (d[k] - 0.5) * 2;
      const along = out.clone().multiplyScalar(Math.cos(droop)).addScaledVector(UP, -Math.sin(droop)).multiplyScalar(size);
      const across = V(-out.z, 0, out.x).multiplyScalar(Math.cos(roll)).addScaledVector(UP, Math.sin(roll)).multiplyScalar(size / 2.5);
      lay(at, along, across, pick(sheet.spray, d[k + 1]), [0.15, 1], d[k + 2], kept, at);
    });
  }
  // The crown itself, on two cards through the trunk at right angles: the same in every level. (After the
  // boughs, which stand in front of them: a pixel a bough has covered is not shaded again.)
  const [low, high] = spec.span, rows = spec.rows.map(([h, half], i, all) => [i === 0 ? 0 : i === all.length - 1 ? 1 : (h - low) / (high - low), half / spec.halfCell]);
  for (const mesh of leaf) {
    [0, 1].forEach((k) => {
      const a = 0.5 + k * Math.PI / 2;
      mesh.whole(V(0, low, 0), V(0, high - low, 0), V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(spec.halfCell * 2), rows, sheet.crown[k], { sway: [0.04, 0.5], variation: 0.4 * k });
    });
  }

  // (where something can hang from it: two places under each limb of its crown's lower three fifths that the
  // second level keeps, in the tree's own frame: index.js hangs a lichen there)
  const hang = limbs.filter((l) => l.stays && l.t < 0.6).flatMap((l) => [0.45, 0.72].map((v) => l.at(v).toArray()));
  return { solid: trunks.map((t) => t.mesh.geometry()), limbs: [limbWood[0].geometry(), limbWood[1].geometry(), null], foliage: leaf.map((m) => m.geometry()),
    height: H, reach: 11, lod: spec.lod, hand: spec.hand, handWood: spec.handWood, max: spec.max, gone: spec.gone, hang, lichen: 0.6,
    perch: perchOf(trunks[0].mesh, { trunk: trunks[0].tube, limbs: limbTubes, limbMesh: limbWood[0] }),
    crown: { middle: [0, (from + to) / 2, 0], radius: Math.max(...limbs.map((l) => l.length)) * 0.85, low: from } };
}
