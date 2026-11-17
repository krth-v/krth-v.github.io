import * as THREE from 'three';
import { Mesh, sheetCell } from './build.js';
import { mulberry32 } from '../world/layout.js';

// The layers below the trees: sword fern, redwood sorrel, hemlock seedlings.

const UP = new THREE.Vector3(0, 1, 0);

// Sword fern: a vase of arching fronds, the young ones upright in the middle,
// the old ones splayed and browning at the rim. From further off it is six broad
// fronds, which stand where the six youngest of the sixteen do: those six splay and
// broaden into them as the fern goes over to that level, and the other ten draw in to the middle.
export function buildFern(sheets) {
  const cells = sheets.fern.cells;
  const out = new THREE.Vector3();
  // the fronds of one level, as what a card is laid from
  const fronds = (count, widen) => {
    const r = mulberry32(41), list = [];
    for (let i = 0; i < count; i += 1) {
      const a = i * 2.39996 + r() * 0.5, k = i / count;                     // k: 0 the newest, 1 the oldest
      const length = (0.9 + 0.6 * r()) * (0.75 + 0.35 * k), old = k > 0.88;
      out.set(Math.cos(a), 0, Math.sin(a));
      const origin = new THREE.Vector3().copy(out).multiplyScalar(0.05 + 0.05 * r());
      const lean = old ? 0.95 : 0.22 + 0.5 * k, lift = old ? 0.18 : 1.1 - 0.35 * k;
      const along = new THREE.Vector3().copy(out).multiplyScalar(lean * length).addScaledVector(UP, lift * length);
      const sag = new THREE.Vector3().copy(out).multiplyScalar(0.3 * length).addScaledVector(UP, -(old ? 0.2 : 0.5 + 0.3 * k) * length);
      const across = new THREE.Vector3().crossVectors(UP, out).multiplyScalar(0.27 * widen * (0.85 + 0.3 * r()));
      const normal = new THREE.Vector3().copy(out).multiplyScalar(0.35).addScaledVector(UP, 0.9).normalize();
      const cell = old ? 3 : Math.floor(r() * 3);
      list.push({ origin, along, across, sag, normal, cell, variation: r() });
    }
    return list;
  };
  const level = (count, segments, widen, next) => {
    const mesh = new Mesh();
    fronds(count, widen).forEach((frond, i) => {
      const twin = next && next.fronds[i];
      // The two levels draw the same numbers for the fronds they share, so a twin starts at this frond's
      // own origin, with its painting. If that ever stopped being so, the swap between the levels would show.
      if (twin && (twin.origin.distanceTo(frond.origin) > 1e-6 || twin.cell !== frond.cell)) throw new Error(`fern frond ${i} is not the same frond in the next level`);
      mesh.card(frond.origin, frond.along, frond.across, sheetCell(frond.cell, cells), frond.normal,
        { sway: [0, 0.7], variation: frond.variation, segments, sag: frond.sag, upright: true,
          becomes: twin ? { along: twin.along, across: twin.across, sag: twin.sag, segments: next.segments } : null });
    });
    return mesh.geometry();
  };
  const coarse = { fronds: fronds(6, 1.7), segments: 2 };
  return { foliage: [level(16, 4, 1.12, coarse), level(6, 2, 1.7, null)], height: 1.2, lod: [11], hand: [0.75], max: 45, gone: 75 };
}

// Skunk cabbage, in the old cedar's wet ground (world/layout.js WET_KINDS): a rosette of great leaves from one
// crown at the mud. In May it is all leaf (its yellow hoods are over by the middle of the month): young leaves
// stand nearly upright in the middle, still half rolled; round them the leaves of this year, as long as an
// arm, rise and arch over outward; the outermost have flopped nearly to the ground.
//
// A leaf is not a flat card: its two halves rise from the midrib as the sides of a trough, so each half takes
// its own light and the midrib is a crease. One flat card to a leaf, and a plant of them was a fan of green
// paddles. So a leaf is two strips that share a midrib, each with its own normal.
export function buildSkunkCabbage(sheets) {
  const cells = sheets.skunk.cells, mesh = new Mesh(), r = mulberry32(97);
  const out = new THREE.Vector3(), side = new THREE.Vector3(), spine = new THREE.Vector3(), lift = new THREE.Vector3(), normal = new THREE.Vector3();
  const SEGMENTS = 3;
  // length, the angle it leaves the ground at, how far it arches over, which painting, and how deep its trough is
  const leaf = (bearing, length, rise, arch, cell, fold, variation) => {
    out.set(Math.cos(bearing), 0, Math.sin(bearing)); side.set(-out.z, 0, out.x);
    const [u0, v0, u1, v1] = sheetCell(cell, cells), wide = length / 2 * 0.5, first = mesh.vertexCount;
    const from = 0.03 + 0.05 * r(), cr = Math.cos(rise), sr = Math.sin(rise);
    for (let s = 0; s <= SEGMENTS; s += 1) {
      const t = s / SEGMENTS, sag = arch * t * t;
      // the midrib leaves the crown at `rise` and bends over outward as it goes
      spine.copy(out).multiplyScalar(from + length * (cr * t + sag * sr * 0.9)).addScaledVector(UP, length * (sr * t - sag * (0.35 + cr)));
      // the two edges stand off to either side and above the midrib: flat at the stalk, deepest in the middle of the blade
      const trough = fold * Math.sin(Math.PI * Math.min(1, t * 1.15)) * wide;
      lift.copy(UP).multiplyScalar(cr + 0.25).addScaledVector(out, -sr * 0.8).normalize().multiplyScalar(trough);
      const v = v0 + (v1 - v0) * t, um = (u0 + u1) / 2, sway = 0.04 + 0.5 * t;
      for (const [hand, u, edge] of [[-1, u0, 1], [-1, um, 0], [1, um, 0], [1, u1, 1]]) {
        mesh.position.push(spine.x + side.x * wide * hand * edge + lift.x * edge, spine.y + lift.y * edge, spine.z + side.z * wide * hand * edge + lift.z * edge);
        mesh.root.push(0, 0, 0);
        // each half faces up and outward, and in towards the midrib
        normal.copy(UP).multiplyScalar(0.55 + 0.45 * cr).addScaledVector(out, 0.25 + 0.5 * sr).addScaledVector(side, -hand * (0.3 + fold)).normalize();
        mesh.normal.push(normal.x, normal.y, normal.z);
        mesh.uv.push(u, v);
        mesh.wind.push(sway, variation);
      }
      if (s < SEGMENTS) {
        const a = first + s * 4, b = a + 4;
        mesh.index.push(a, a + 1, b, a + 1, b + 1, b, a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
      }
    }
  };
  // the young ones, in the middle
  for (let i = 0; i < 2; i += 1) leaf(r() * 6.283, 0.42 + 0.14 * r(), 1.32 + 0.12 * r(), 0.08, 3, 0.3, r());
  // this year's leaves
  for (let i = 0; i < 6; i += 1) leaf(i * 2.39996 + r() * 0.5, 0.78 + 0.26 * r(), 0.95 + 0.3 * r(), 0.3 + 0.2 * r(), i % 3 === 1 ? 2 : i % 3 === 2 ? 1 : 0, 0.42 + 0.2 * r(), r());
  // the outermost, flopped
  for (let i = 0; i < 4; i += 1) leaf(0.8 + i * 1.571 + r() * 0.6, 0.72 + 0.24 * r(), 0.38 + 0.22 * r(), 0.16 + 0.12 * r(), i % 2 ? 1 : 0, 0.22 + 0.15 * r(), r());
  return { foliage: [mesh.geometry()], height: 1.0, lod: [], max: 38, gone: 58 };
}

// Redwood sorrel: a low carpet. Each patch is a dozen small sheets tilted this way and that,
// a metre and a half across: few instances to pack each frame, the same cover.
export function buildSorrel(sheets) {
  const cells = sheets.cover.cells, mesh = new Mesh(), r = mulberry32(53);
  const origin = new THREE.Vector3(), along = new THREE.Vector3(), across = new THREE.Vector3(), normal = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 13; i += 1) {
    const a = r() * 6.283, d = Math.sqrt(r()) * 0.78, size = 0.34 + 0.16 * r(), turn = r() * 6.283;
    along.set(Math.cos(turn), (r() - 0.5) * 0.35, Math.sin(turn)).multiplyScalar(size);
    across.set(-Math.sin(turn), (r() - 0.5) * 0.35, Math.cos(turn)).multiplyScalar(size);
    origin.set(Math.cos(a) * d, 0.07 + 0.08 * r(), Math.sin(a) * d).addScaledVector(along, -0.5);
    mesh.card(origin, along, across, sheetCell(Math.floor(r() * 2), cells), normal, { sway: [0.1, 0.25], variation: r() });
  }
  return { foliage: [mesh.geometry()], height: 0.3, lod: [], max: 16, gone: 30 };
}

// A hemlock seedling, knee high: two crossed cards.
export function buildSeedling(sheets) {
  const cells = sheets.cover.cells, mesh = new Mesh();
  const origin = new THREE.Vector3(), along = new THREE.Vector3(0, 0.55, 0), across = new THREE.Vector3(), normal = new THREE.Vector3(0.3, 0.9, 0.2).normalize();
  for (const a of [0.3, 1.9]) {
    across.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.5);
    mesh.card(origin, along, across, sheetCell(3, cells), normal, { sway: [0, 0.5], variation: 0.3, upright: true });
  }
  return { foliage: [mesh.geometry()], height: 0.6, lod: [], max: 26, gone: 44 };
}

// Meadow grass: a patch of tufts a stride across, laid over the clearing edge to edge (world/layout.js,
// CARPETS). From far off a patch is four broad cards, one at each of its four tufts. Near to, the same four
// cards are still there, each crossed by a second, lower one: so from the side and from above there is
// always a blade to see, and none of it is a picture laid on the ground.
//
// The cards a patch has only near to do not shrink away as it goes over to the far level: they sink into the
// ground where they stand. A blade is a thin upright stroke. Shrunk, every blade of a card slides across the
// screen, and a meadow of them changed a third of a 40-pixel square in one step of the walk; let down along
// its own length a blade changes at its tip. The four cards both levels have do not move at all.
export function buildGrass(sheets) {
  const cells = sheets.grass.cells;
  const tufts = (count, tall, wide) => {
    const r = mulberry32(67), list = [];
    for (let i = 0; i < count; i += 1) {
      const a = i * 2.39996 + r() * 0.6, d = 0.08 + 0.16 * Math.sqrt(i);              // a spiral out from the middle: the same place for tuft i whatever the count
      const out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), turn = r() * Math.PI, lean = 0.1 + 0.3 * r(), high = (0.28 + 0.22 * r()) * tall, across = (0.4 + 0.2 * r()) * wide;
      list.push({ origin: new THREE.Vector3().copy(out).multiplyScalar(d), out, turn, lean, high, across, cell: [0, 2, 1, 0, 3, 2, 0, 1, 3][i % 9], variation: r() });
    }
    return list;
  };
  // the card of a tuft that stands across `turn`
  const card = (t, turn) => ({
    along: new THREE.Vector3().copy(t.out).multiplyScalar(t.lean * t.high).addScaledVector(UP, t.high),
    across: new THREE.Vector3(Math.cos(turn), 0, Math.sin(turn)).multiplyScalar(t.across),
    normal: new THREE.Vector3().copy(t.out).multiplyScalar(0.3).addScaledVector(UP, 1).normalize(),
  });
  const lay = (mesh, t, c, becomes) => mesh.card(t.origin, c.along, c.across, sheetCell(t.cell, cells), c.normal, { sway: [0, 0.3], variation: t.variation, upright: true, becomes });
  // a card that the far level does not have: its roots are itself, let down into the ground
  const sink = (mesh, t, c) => {
    const first = mesh.vertexCount;
    lay(mesh, t, c, null);
    for (let v = first; v < mesh.vertexCount; v += 1) { mesh.root[v * 3] = mesh.position[v * 3]; mesh.root[v * 3 + 1] = mesh.position[v * 3 + 1] - t.high * 1.15; mesh.root[v * 3 + 2] = mesh.position[v * 3 + 2]; }
  };
  const broad = tufts(4, 1.15, 1.5), small = tufts(4, 0.85, 1.2);
  const coarse = new Mesh(), fine = new Mesh();
  broad.forEach((t, i) => {
    if (small[i].origin.distanceTo(t.origin) > 1e-6 || small[i].cell !== t.cell) throw new Error(`grass tuft ${i} is not the same tuft at both levels`);
    const c = card(t, t.turn);
    lay(coarse, t, c, null);
    lay(fine, t, c, { along: c.along, across: c.across, segments: 1 });
    sink(fine, small[i], card(small[i], t.turn + Math.PI / 2));
  });
  // Cut-out cards are paid for by the pixel, and a meadow seen along its length is cards behind cards. Eight
  // tufts of two cards each, closer set, cost up to 3.5 ms a frame looking down the clearing; four tufts cost
  // about half of that. The crossing cards are the lower ones and take a long way to go down (6 to 17 m from
  // the walker): six cards a patch going down over 6 m still changed 37 % of a square in a step of the walk.
  return { foliage: [fine.geometry(), coarse.geometry()], height: 0.6, lod: [6], hand: [1.8], max: 44, gone: 66 };
}
