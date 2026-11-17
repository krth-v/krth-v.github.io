import * as THREE from 'three';
import { Mesh, sheetCell } from './build.js';
import { mulberry32 } from '../world/layout.js';

// Conifers. A tree is a trunk, limbs, and bough cards laid along the limbs;
// the cards carry a painted bough from the species' sheet. The three detail
// levels are built from one list of limbs, so they keep the same silhouette.
//
// A level is the one before it with every other limb gone and the boughs that are left grown larger
// (`every`, `size`), so one can be drawn turning into the next: each bough that stays grows to the size
// the next level gives it, each bough and limb that goes shrinks away, and the trunk settles onto the
// next level's coarser trunk (Mesh in build.js). The last level of a tree is not like that: it is a
// dozen large boughs (`far`), and the level before hands over to it with both drawn (`cross`).
// A tree is built in three pieces: the trunk with its stubs, the limbs, and the boughs. The limbs are
// wood, but they change level when their boughs do, not when the trunk does (world/instancer.js): a limb
// that went with the trunk left its boughs hanging in the air for the rest of their hand-over. A sapling's
// limbs are twigs too thin to see from where it changes level, and stay with its trunk.
// `lod` is how far each level is drawn as it is, and `hand` the stretch beyond that, as a share of it, over which
// it turns into the next. `max` is how far a tree is drawn whole and `gone` where it is no longer drawn; between
// them it shrinks.
//
// Lengths are metres, angles degrees. `spread(t)` is the crown's radius at
// height fraction t of the crown (0 bottom, 1 top). Optional: `nodFrom`, the
// height fraction where the leader starts to nod (0.9); `twig: [base, perMetre]`,
// limb thickness for small trees; `boughRel`, bough length as a share of its limb.
// Nothing hangs lower above the tree's foot than a floor set from where its crown
// starts: a sapling's lowest sprays used to droop into the ground, and the ground cut
// each one off along a ruled line.
export const CONIFERS = {
  // Old-growth Douglas-fir: a massive clean bole, the crown starting far overhead,
  // heavy level limbs and a broad, irregular top.
  firGiant: {
    sheet: 'fir', bark: 'fir', height: 62, radius: 1.05, top: 0.2, flare: 0.5, lobes: 6, lean: 0.5,
    crown: [26, 61], spread: (t) => 2.2 + 5.6 * Math.pow(1 - t, 0.75), limbs: 64, boughs: 8, bough: 4.6,
    rise: [-16, 24], droop: 0.18, sag: 0.14, leader: 0, stubs: 7,
    // the crown starts 26 m up and is only seen from below, so even the near level needs no crossed cards
    levels: [{ radial: 56, rings: 60, every: 1, cross: false, segments: 2, size: 1 }, { radial: 18, rings: 16, every: 2, cross: false, size: 1.7 }, { radial: 7, rings: 5, far: 12, size: 2.6 }],
    lod: [30, 85], hand: [0.5, 0.4], max: 300, gone: 380, crownWeight: 0.9,
  },
  // Mature western hemlock: slimmer, the crown lower and denser, branches
  // sweeping down, and the leader nodding over at the very top.
  hemlock: {
    sheet: 'hemlock', bark: 'hemlock', height: 44, radius: 0.42, top: 0.07, flare: 0.3, lobes: 5, lean: 0.35,
    crown: [12, 44], spread: (t) => 0.6 + 4.6 * Math.pow(1 - t, 0.8), limbs: 62, boughs: 7, bough: 3.1,
    rise: [-22, 8], droop: 0.28, sag: 0.2, leader: 1.3, stubs: 3,
    levels: [{ radial: 36, rings: 44, every: 1, cross: false, segments: 2, size: 1 }, { radial: 12, rings: 12, every: 2, cross: false, size: 1.7 }, { radial: 6, rings: 4, far: 10, size: 2.4 }],
    lod: [24, 70], hand: [0.6, 0.4], max: 240, gone: 310, crownWeight: 0.8,
  },
  // A pole-sized hemlock in the shade of the giants.
  hemlockPole: {
    sheet: 'hemlock', bark: 'hemlock', height: 15, radius: 0.13, top: 0.02, flare: 0.15, lobes: 4, lean: 0.25,
    crown: [2.2, 15], spread: (t) => 0.25 + 2.5 * Math.pow(1 - t, 0.85), limbs: 40, boughs: 3, bough: 1.5,
    rise: [-16, 12], droop: 0.26, sag: 0.18, leader: 0.6, stubs: 0,
    levels: [{ radial: 14, rings: 20, every: 1, cross: true, size: 1 }, { radial: 7, rings: 8, every: 2, cross: false, size: 1.6 }, { radial: 4, rings: 3, far: 6, size: 2.2 }],
    lod: [18, 50], hand: [0.7, 0.4], max: 110, gone: 160, crownWeight: 0.35,
  },
  // A hemlock sapling: lacy sprays from knee height up, the leader drooping.
  hemlockSapling: {
    sheet: 'hemlock', bark: 'hemlock', height: 3.6, radius: 0.026, top: 0.004, flare: 0, lobes: 0, lean: 0.1,
    crown: [0.45, 3.5], spread: (t) => 0.12 + 1.25 * Math.pow(1 - t, 1.1), limbs: 30, boughs: 3, boughRel: 0.62, bough: 1, twig: [0.0015, 0.0022],
    rise: [-8, 22], droop: 0.22, sag: 0.22, leader: 0.32, nodFrom: 0.72, stubs: 0,
    levels: [{ radial: 6, rings: 9, every: 1, cross: false, segments: 2, size: 1 }, { radial: 4, rings: 3, every: 2, cross: false, size: 1.5 }],
    lod: [14], hand: [0.6], max: 60, gone: 95, crownWeight: 0.1,
  },
  // (The spruce that stood in for the valley's own conifers was here: an edge-grown tree made of the fir's
  // boughs and the hemlock's bark, whose far level stood its boughs upright. Those trees are plants/spire.js.)
};

const UP = new THREE.Vector3(0, 1, 0);
const rad = THREE.MathUtils.degToRad;

export function buildConifer(spec, sheets) {
  const r = mulberry32(spec.height * 131 + spec.limbs);
  const cells = sheets[spec.sheet].cells, barkTile = 1.2;
  const around = Math.max(1, Math.round((2 * Math.PI * spec.radius) / barkTile));

  // the trunk's centre line: a slight lean, and for hemlock a leader that nods over
  const bend = r() * 6.283;
  const nodFrom = spec.nodFrom ?? 0.9;
  const axis = (h, out = new THREE.Vector3()) => {
    const t = h / spec.height, sway = spec.lean * t * t;
    const k = Math.max(0, (t - nodFrom) / (1 - nodFrom)), nod = spec.leader * k * k;
    return out.set(Math.cos(bend) * (sway + nod), h - nod * 0.3, Math.sin(bend) * (sway + nod));
  };
  const girth = (h) => spec.radius + (spec.top - spec.radius) * Math.pow(h / spec.height, 0.85);

  // one list of limbs, shared by every level
  const limbs = [];
  const [from, to] = spec.crown;
  const floor = Math.min(0.5, from * 0.6);
  for (let i = 0; i < spec.limbs; i += 1) {
    const t = Math.pow((i + r() * 0.8) / spec.limbs, 0.9), h = from + (to - from) * t;
    const azimuth = i * 2.39996 + (r() - 0.5) * 0.9, length = spec.spread(t) * (0.75 + r() * 0.5);
    // a low limb is lifted until its tip, sag and all, clears the floor
    const least = Math.asin(Math.min(1, Math.max(-1, (floor + 0.08 - h) / length + spec.sag)));
    const rise = Math.max(rad(spec.rise[0] + (spec.rise[1] - spec.rise[0]) * t + (r() - 0.5) * 14), least);
    limbs.push({ t, h, azimuth, length, rise, seed: Math.floor(r() * 1e6) });
  }
  const stubs = [];
  for (let i = 0; i < spec.stubs; i += 1) stubs.push({ h: from * (0.35 + 0.6 * r()), azimuth: r() * 6.283, length: 0.5 + r() * 1.4, rise: rad(-10 + r() * 25) });

  const origin = new THREE.Vector3(), dir = new THREE.Vector3(), out = new THREE.Vector3(), side = new THREE.Vector3();
  const normal = new THREE.Vector3(), tmp = new THREE.Vector3();
  const vectors = () => ({ foot: new THREE.Vector3(), along: new THREE.Vector3(), across: new THREE.Vector3(), sag: new THREE.Vector3() });
  const own = vectors(), coarser = vectors();

  // What is random about a bough is drawn once, so every level lays the same boughs: six numbers each.
  const count = Math.max(1, spec.boughs);
  const draws = limbs.map((limb) => { const lr = mulberry32(limb.seed); return Array.from({ length: count }, () => [lr(), lr(), lr(), lr(), lr(), lr()]); });
  // A bough is held above the floor as its limb is. One that droops is lowest at a corner of its tip, half
  // its width down the roll, and its tip is raised until that clears; one that rises is lowest at its foot,
  // which the limb already holds up.
  const lift = (card) => { const low = card.foot.y + card.along.y + card.sag.y - Math.abs(card.across.y) / 2; if (low < floor) card.along.y += floor - low; };
  // Bough `b` of a limb as a level of the given `size` lays it. `origin`, `out`, `dir` and `side` are the limb's.
  const lay = (limb, b, draw, size, card) => {
    // boughs alternate along the limb; the last one continues it as the tip
    // they start close to the trunk and overlap, so the limb itself is clothed
    const t = spec.boughs ? 0.08 + 0.84 * b / count : 0, tip = b === count - 1;
    const swing = tip ? (draw[0] - 0.5) * 0.4 : (b % 2 ? 1 : -1) * rad(16 + draw[0] * 30);
    const reach = spec.boughRel ? limb.length * spec.boughRel : spec.bough;
    const length = (spec.boughs ? reach * (1 - 0.35 * t) : limb.length) * (0.8 + draw[1] * 0.4) * size;
    card.foot.copy(origin).addScaledVector(out, girth(limb.h) * 0.6).addScaledVector(dir, limb.length * 0.92 * t).addScaledVector(UP, -limb.length * spec.sag * t * t);
    card.along.copy(dir).multiplyScalar(Math.cos(swing)).addScaledVector(side, Math.sin(swing)).addScaledVector(UP, -spec.droop * (0.6 + draw[2] * 0.8)).normalize();
    card.across.crossVectors(UP, card.along).normalize();
    const roll = (draw[3] - 0.5) * 1.2;
    card.across.applyAxisAngle(card.along, roll).multiplyScalar(length * 0.5);
    card.sag.set(0, -length * spec.sag * 0.9, 0);
    card.along.multiplyScalar(length);
    lift(card);
  };
  const limbed = (li) => spec.boughs > 0 && li < (spec.twig ? 1 : 2);        // the levels whose limbs are wood, not only boughs

  // The coarsest level first: each level needs the one after it, to know where its own wood and boughs go.
  const built = [];
  for (let li = spec.levels.length - 1; li >= 0; li -= 1) {
    const level = spec.levels[li], next = spec.levels[li + 1], after = built[li + 1];
    const solid = new Mesh(), leaf = new Mesh(), limbWood = spec.twig ? solid : new Mesh();
    const heights = [];
    for (let j = 0; j <= level.rings; j += 1) {
      const h = spec.height * Math.pow(j / level.rings, 1.35);               // more rings near the flared foot
      if (!spec.leader || h < spec.height * nodFrom - 1e-4) heights.push(h);
    }
    if (spec.leader) {
      // extra rings where the leader nods, so it arcs over instead of kinking
      const n = li === 0 ? 5 : 2;
      for (let k = 0; k <= n; k += 1) heights.push(spec.height * (nodFrom + (1 - nodFrom) * k / n));
    }
    const points = heights.map((h) => axis(h, new THREE.Vector3())), radii = heights.map(girth);
    const tubes = { trunk: { radial: level.radial, at: heights }, limbs: new Map(), stubs: [] };
    tubes.trunk.base = solid.tube(points, radii, level.radial, { around, tile: barkTile * 2, lobes: spec.lobes,
      flare: (t, ring) => spec.flare * Math.exp(-heights[ring] / Math.max(spec.radius * 1.7, 0.05)) });

    // `stays` says the next level has this limb too: it is then settled onto that one, and otherwise thins away
    const sides = spec.twig ? 3 : (li === 0 ? 5 : 4);
    const limbTube = (mesh, h, azimuth, length, rise, thick, stays) => {
      axis(h, origin); out.set(Math.cos(azimuth), 0, Math.sin(azimuth));
      dir.copy(out).multiplyScalar(Math.cos(rise)).addScaledVector(UP, Math.sin(rise));
      const pts = [], rr = [];
      for (let k = 0; k <= 3; k += 1) {
        const t = k / 3;
        pts.push(new THREE.Vector3().copy(origin).addScaledVector(out, girth(h) * 0.7).addScaledVector(dir, length * t).addScaledVector(UP, -length * spec.sag * t * t));
        rr.push(thick * (1 - 0.8 * t) + (spec.twig ? 0.002 : 0.006));
      }
      return { base: mesh.tube(pts, rr, sides, { around: 1, tile: 1.5, drop: !stays }), radial: sides, at: [0, 1, 2, 3] };
    };

    if (level.far) {
      // far level: a handful of large boughs standing in for the whole crown. Each grows out of the trunk as the level comes in.
      const fr = mulberry32(977), along = own.along, across = own.across;
      for (let i = 0; i < level.far; i += 1) {
        const t = (i + 0.5) / level.far, h = from + (to - from) * t, azimuth = i * 2.39996;
        const length = spec.spread(t) * 1.9 * (0.85 + fr() * 0.3);
        axis(h, origin); out.set(Math.cos(azimuth), 0, Math.sin(azimuth));
        along.copy(out).multiplyScalar(length).addScaledVector(UP, -length * spec.droop * 0.7);
        // A bough lies flat, and a tree that is walked under shows the flat of it. A tree seen from across open
        // water shows every bough edge-on: a pole with lines on it. `upright` stands a far bough's breadth up,
        // by that share, so that it is seen side-on, as a branch in profile.
        if (level.upright) across.crossVectors(UP, out).multiplyScalar(length * 0.62 * (1 - level.upright) * (fr() < 0.5 ? -1 : 1)).addScaledVector(UP, length * 0.62 * level.upright);
        else across.crossVectors(UP, out).multiplyScalar(length * 0.62).addScaledVector(UP, length * 0.25 * (fr() - 0.5));
        normal.copy(out).multiplyScalar(0.6).addScaledVector(UP, 0.8).normalize();
        leaf.card(origin, along, across, sheetCell(i, cells), normal, { sway: [0.1, 0.6], variation: fr() });
      }
    } else {
      const thins = next && !next.far;                    // the next level is this one with fewer limbs
      limbs.forEach((limb, index) => {
        if (index % level.every) return;
        const stays = thins && index % next.every === 0;
        const thick = spec.twig ? spec.twig[0] + limb.length * spec.twig[1] : 0.012 + limb.length * 0.007;
        if (limbed(li)) tubes.limbs.set(index, limbTube(limbWood, limb.h, limb.azimuth, limb.length * 0.8, limb.rise, thick, stays && limbed(li + 1)));
        axis(limb.h, origin); out.set(Math.cos(limb.azimuth), 0, Math.sin(limb.azimuth));
        dir.copy(out).multiplyScalar(Math.cos(limb.rise)).addScaledVector(UP, Math.sin(limb.rise));
        side.crossVectors(UP, out);
        normal.copy(out).multiplyScalar(0.62).addScaledVector(UP, 0.5 + 0.5 * limb.t).normalize();
        for (let b = 0; b < count; b += 1) {
          const draw = draws[index][b];
          lay(limb, b, draw, level.size, own);
          // every level draws the same numbers per bough, so the levels share one silhouette
          const pick = Math.floor(draw[4] * 8), cell = sheetCell(pick, cells), variation = draw[5];
          let becomes = null;
          if (stays) {
            lay(limb, b, draw, next.size, coarser);
            becomes = { along: coarser.along, across: coarser.across, sag: coarser.sag, segments: next.segments ?? 1 };
          }
          leaf.card(own.foot, own.along, own.across, cell, normal, { sway: [0.15, 1], variation, segments: level.segments ?? (li === 0 ? 3 : 1), sag: own.sag, becomes });
          if (level.cross) {
            // a second card through the first, so the bough has body seen edge-on
            own.across.applyAxisAngle(tmp.copy(own.along).normalize(), 1.35);
            lift(own);
            leaf.card(own.foot, own.along, own.across, sheetCell((pick + 3) % 8, cells), normal, { sway: [0.15, 1], variation, segments: 3, sag: own.sag });
          }
        }
      });
      if (li < 2) for (const stub of stubs) tubes.stubs.push(limbTube(solid, stub.h, stub.azimuth, stub.length, stub.rise, 0.05, thins && li + 1 < 2));
    }
    // wood that the next level has too, in fewer sides and rings, settles onto it
    if (after) {
      solid.settle(tubes.trunk, after.solid, after.tubes.trunk);
      for (const [index, tube] of tubes.limbs) { const to = after.tubes.limbs.get(index); if (to) limbWood.settle(tube, after.limbWood, to); }
      tubes.stubs.forEach((tube, i) => { const to = after.tubes.stubs[i]; if (to) solid.settle(tube, after.solid, to); });
    }
    built[li] = { solid, leaf, limbWood, tubes };
  }

  // `limbs[i]` is the wood that changes level with the boughs of level i, where there is any.
  // `cross[i]` says level i hands over to level i + 1 with both drawn; otherwise level i turns into it.
  const limbWood = built.map((b) => (b.limbWood !== b.solid && b.limbWood.vertexCount ? b.limbWood.geometry() : null));
  // `perch` is the finest level's trunk and stubs as they were built, for what stands on them (life/perch.js):
  // an animal's feet are put on these vertices, not on a second copy of the formula that made them.
  const near = built[0];
  const perch = { position: near.solid.position, trunk: { base: near.tubes.trunk.base, radial: near.tubes.trunk.radial, rings: near.tubes.trunk.at.length },
    stubs: near.tubes.stubs.map((tube) => ({ base: tube.base, radial: tube.radial, rings: tube.at.length })),
    // and the limbs the next level keeps, as wood: a bough that is still there from further off, for what perches on one
    limbs: { position: near.limbWood.position, tubes: [...near.tubes.limbs].filter(([index]) => built[1] && built[1].tubes.limbs.has(index)).map(([, tube]) => ({ base: tube.base, radial: tube.radial, rings: tube.at.length })) } };
  // Added beside the meshes (plants/build.js, the contract): where a limb's middle line runs, worked out from the limb list as the
  // finest level builds its wood (no random number is drawn), the places under the limbs something hangs from, and for the
  // sapling, whose twigs are too slender to stand on, sprigs along them.
  const onLimb = (limb, t) => {
    const L = limb.length * 0.8, o = axis(limb.h, new THREE.Vector3());
    const d = new THREE.Vector3(Math.cos(limb.azimuth), 0, Math.sin(limb.azimuth));
    const dr = d.clone().multiplyScalar(Math.cos(limb.rise)).addScaledVector(UP, Math.sin(limb.rise));
    const at = o.clone().addScaledVector(d, girth(limb.h) * 0.7).addScaledVector(dr, L * t).addScaledVector(UP, -L * spec.sag * t * t);
    const run = dr.clone().multiplyScalar(L).addScaledVector(UP, -2 * L * spec.sag * t).normalize();
    return { at, run };
  };
  const hang = [], sprigs = [];
  limbs.forEach((limb, index) => {
    if (!near.tubes.limbs.has(index)) return;
    if (spec.twig) { const { at, run } = onLimb(limb, index % 2 ? 0.55 : 0.8); sprigs.push([at.x, at.y, at.z, run.x, run.y, run.z]); }
    else for (const t of [0.5, 0.75]) hang.push(onLimb(limb, t).at.toArray());
  });
  const mid = axis((from + to) / 2, new THREE.Vector3());
  const crown = { middle: mid.toArray(), radius: spec.spread(0) * 0.85, low: from };
  perch.sprigs = sprigs;
  // (the grown trees of an old wood carry the hanging lichen on their high limbs; a pole and a sapling are too young for it)
  return { hang, lichen: spec.crown[0] > 10 ? 0.15 : 0, crown, solid: built.map((b) => b.solid.geometry()), limbs: limbWood, foliage: built.map((b) => b.leaf.geometry()), cross: spec.levels.slice(1).map((level) => !!level.far),
    height: spec.height, lod: spec.lod, hand: spec.hand, max: spec.max, gone: spec.gone, perch };
}
