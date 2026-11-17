import * as THREE from 'three';
import { Mesh } from './build.js';
import { mulberry32 } from '../world/layout.js';

// The small things: flowers of the forest floor, what grows on dead wood, and a lichen that hangs from limbs
// (paint/flowers.js has what was read about each, and the sheet they are all painted on). Each is a few cards
// and nothing else (but the fungus, which is a small solid), at one level of detail, and small enough to be gone
// within a stone's throw.
//
// Several are one kind in the forest: the sheet has them side by side, a column to each, and a plant's tint says
// which column it shows (VARIANTS in light/shared.js). So a carpet is false lily-of-the-valley, or the moist
// ground's small flowers, or bleeding heart, or daisies, in one draw; a trillium is white or aged pink; and a
// fungus is a red-belted conk, an artist's conk, a cluster of oyster mushrooms or of turkey tails. world/layout.js
// (UNDER_KINDS) says where the flowers grow and which each is; index.js (riders) where the fungi and the lichen are.

const UP = new THREE.Vector3(0, 1, 0);

// A carpet: a patch a stride across of low plants. Nine squares of the plant seen from above, laid a hand over
// the ground and tipped this way and that; and among them seven upright halves of it seen from beside, which
// are what a walker sees of the patch from a few strides off, where the squares are seen edge-on.
export const CARPET = { height: 0.34, max: 27, gone: 38 };
export function buildCarpet(sheets) {
  const cells = sheets.flower.carpet, mesh = new Mesh(), r = mulberry32(307), SIZE = 0.34;
  const n = new THREE.Vector3(), u = new THREE.Vector3(), v = new THREE.Vector3(), origin = new THREE.Vector3(), lit = new THREE.Vector3();
  let reach = 0;
  for (let i = 0; i < 9; i += 1) {
    const a = i * 2.39996 + r() * 0.6, far = 0.5 * Math.sqrt((i + 0.4) / 9), turn = r() * 6.283, tilt = 0.06 + 0.3 * r(), lean = r() * 6.283;
    n.set(Math.sin(tilt) * Math.cos(lean), Math.cos(tilt), Math.sin(tilt) * Math.sin(lean));
    u.set(Math.cos(turn), 0, Math.sin(turn)).addScaledVector(n, -n.x * Math.cos(turn) - n.z * Math.sin(turn)).normalize();
    v.crossVectors(n, u);
    origin.set(Math.cos(a) * far, 0.07 + 0.09 * r(), Math.sin(a) * far).addScaledVector(u, -SIZE / 2);
    mesh.card(origin, u.clone().multiplyScalar(SIZE), v.clone().multiplyScalar(SIZE), cells.flat[i % 2], lit.copy(n).addScaledVector(UP, 0.6).normalize(), { sway: [0.2, 0.45], variation: r() });
    reach = Math.max(reach, far + SIZE * 0.7);
  }
  for (let i = 0; i < 7; i += 1) {
    const a = i * 2.39996 + 1.1 + r() * 0.6, far = 0.45 * Math.sqrt((i + 0.3) / 7), turn = r() * 6.283, lean = (r() - 0.5) * 0.2;
    u.set(Math.cos(turn), 0, Math.sin(turn));
    origin.set(Math.cos(a) * far, -0.01, Math.sin(a) * far);
    mesh.card(origin, new THREE.Vector3(u.x * lean, 1, u.z * lean).multiplyScalar(SIZE), u.clone().multiplyScalar(SIZE / 2), cells.upright[i % 2], lit.set(-u.z * 0.5, 0.85, u.x * 0.5).normalize(), { sway: [0, 0.9], variation: r(), upright: true });
  }
  return { foliage: [mesh.geometry()], height: CARPET.height, reach: reach + 0.1, lod: [], max: CARPET.max, gone: CARPET.gone };
}

// Western trillium: three plants, in the loose group they come up in, each a bare stalk with its three leaves
// and its flower at the top. A plant is a square of it seen from above, tipped a little the way its flower
// faces, at the height its leaves are; and under that two upright halves of it seen from beside, crossed.
export const TRILLIUM = { height: 0.32, max: 24, gone: 34 };
export function buildTrillium(sheets) {
  const cells = sheets.flower.trillium, mesh = new Mesh(), r = mulberry32(331);
  const n = new THREE.Vector3(), u = new THREE.Vector3(), v = new THREE.Vector3(), origin = new THREE.Vector3(), lit = new THREE.Vector3();
  let reach = 0;
  for (const [px, pz, size] of [[0, 0, 1], [0.27, 0.11, 0.86], [-0.12, 0.29, 0.72]]) {
    const TOP = 0.3 * size, tall = 0.3 * size, leaves = tall * (178 / 256);          // (the sheet's side view has its leaves 178 px up a cell of 256)
    const turn = r() * 6.283, tilt = 0.12 + 0.3 * r(), lean = r() * 6.283;
    n.set(Math.sin(tilt) * Math.cos(lean), Math.cos(tilt), Math.sin(tilt) * Math.sin(lean));
    u.set(Math.cos(turn), 0, Math.sin(turn)).addScaledVector(n, -n.x * Math.cos(turn) - n.z * Math.sin(turn)).normalize();
    v.crossVectors(n, u);
    origin.set(px, leaves + 0.012 * size, pz).addScaledVector(u, -TOP / 2);
    mesh.card(origin, u.clone().multiplyScalar(TOP), v.clone().multiplyScalar(TOP), cells.top, lit.copy(n).addScaledVector(UP, 0.6).normalize(), { sway: [0.5, 0.6], variation: r() });
    for (const k of [0, 1]) {
      const b = turn + 0.5 + k * 1.5708;
      u.set(Math.cos(b), 0, Math.sin(b));
      mesh.card(origin.set(px, -0.005, pz), new THREE.Vector3(0, tall, 0), u.clone().multiplyScalar(tall / 2), cells.side[k], lit.set(-u.z * 0.5, 0.85, u.x * 0.5).normalize(), { sway: [0, 0.6], variation: r(), upright: true });
    }
    reach = Math.max(reach, Math.hypot(px, pz) + TOP * 0.7);
  }
  return { foliage: [mesh.geometry()], height: TRILLIUM.height, reach: reach + 0.1, lod: [], max: TRILLIUM.max, gone: TRILLIUM.gone };
}

// What grows on dead wood: a shelf, or a cluster of them. Out of the wood is +x here, and the wood's surface is
// the plane through the origin across that; a rider's record turns it to face out of the trunk or the log it is
// on (index.js). It is a small solid and not cards: a half dome above, thickest where it is fast to the wood
// and thinning to a rim, and under it a half cone up to the same rim; the sheet's shelf seen from above is laid
// over the one and its shelf seen from underneath over the other. (Four cards, the shelf from above, from
// underneath and twice from beside, were a paper dart stuck in the bark.) At scale 1 it is 0.3 m across the wood
// and stands 0.2 m out of it. (It is built a hand above its own origin, and its record set as far down: what
// is at the origin's height or under it is taken for the foot of a plant, in its own shade: light/materials.js.)
export const FUNGUS = { height: 0.12, max: 30, gone: 44, lift: 0.1 };
export function buildFungus(sheets) {
  const cells = sheets.flower.fungus, mesh = new Mesh(), HALF = 0.15, OUT = 0.2, IN = -0.035, Y = FUNGUS.lift, RIM = Y - 0.07, FOOT = Y - 0.16;
  const AROUND = 8, RINGS = [0.4, 0.75, 1];
  // a point of the sheet's shelf: `t` of the way from the middle of its fast edge to its rim, on bearing `a`.
  // (The painted shelf is half an oval against its cell's left edge, 114 px out and 56 px to either side, in a
  // cell of 128; the solid keeps a little inside its outline.)
  const paint = (cell, t, a) => { const cu = (3 + 114 * 0.92 * t * Math.cos(a)) / 128, cv = (64 + 56 * 0.92 * t * Math.sin(a)) / 128; return [cell[0] + (cell[2] - cell[0]) * cu, cell[3] - (cell[3] - cell[1]) * cv]; };
  const side = (cell, upper) => {
    const base = mesh.vertexCount;
    const push = (t, a) => {
      const thick = 0.35 + 0.65 * Math.cos(a);                                  // thinner towards either end of its fast edge
      const y = upper ? RIM + (Y - RIM) * (1 - t * t) * thick : RIM - (RIM - FOOT) * (1 - t) * thick;
      const x = IN + (OUT - IN) * t * Math.cos(a), z = HALF * t * Math.sin(a);
      mesh.position.push(x, y, z); mesh.root.push(x, y, z); mesh.wind.push(0, 0);
      mesh.uv.push(...paint(cell, t, a));
      const n = upper ? [0.55 * t * Math.cos(a), 1, 0.55 * t * Math.sin(a)] : [0.6 * Math.cos(a), -0.75, 0.6 * Math.sin(a)], long = Math.hypot(...n);
      mesh.normal.push(n[0] / long, n[1] / long, n[2] / long);
    };
    push(0, 0);
    for (const t of RINGS) for (let i = 0; i <= AROUND; i += 1) push(t, -Math.PI / 2 + (i / AROUND) * Math.PI);
    for (let i = 0; i < AROUND; i += 1) mesh.index.push(base, base + 1 + i, base + 2 + i);
    for (let j = 0; j < RINGS.length - 1; j += 1) for (let i = 0; i < AROUND; i += 1) {
      const p = base + 1 + j * (AROUND + 1) + i, q = p + AROUND + 1;
      mesh.index.push(p, q, p + 1, p + 1, q, q + 1);
    }
  };
  side(cells.top, true); side(cells.under, false);
  return { foliage: [mesh.geometry()], height: FUNGUS.height, reach: 0.4, lod: [], max: FUNGUS.max, gone: FUNGUS.gone };
}

// Methuselah's beard: a curtain of strands hanging from a limb, on two cards crossed, two metres long at scale 1. Its origin is where it is fast to the limb, and it swings most at its lower end.
export const BEARD = { length: 2.0, max: 52, gone: 72 };
export function buildBeard(sheets) {
  const cells = sheets.flower.beard, mesh = new Mesh(), L = BEARD.length, top = new THREE.Vector3(0, 0, 0);
  [0.2, 1.75].forEach((b, k) => {
    const across = new THREE.Vector3(Math.cos(b), 0, Math.sin(b)).multiplyScalar(L / 3);          // (a cell of the sheet is three times as tall as it is wide)
    mesh.card(new THREE.Vector3(0, -L, 0), new THREE.Vector3(0, L, 0), across, cells[k * 2], new THREE.Vector3(-across.z, 0.5, across.x).normalize(), { sway: [1, 0.04], variation: 0.3 + 0.4 * k, upright: true, root: top });
    mesh.card(new THREE.Vector3(0.05 * (k ? 1 : -1), -L * 0.62, 0.04), new THREE.Vector3(0, L * 0.62, 0), across.clone().multiplyScalar(0.8), cells[k * 2 + 1], new THREE.Vector3(across.z, 0.5, -across.x).normalize(), { sway: [0.8, 0.04], variation: 0.7 - 0.4 * k, upright: true, root: top });
  });
  return { foliage: [mesh.geometry()], height: BEARD.length, reach: 0.5, lod: [], max: BEARD.max, gone: BEARD.gone };
}
