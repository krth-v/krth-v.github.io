import * as THREE from 'three';
import { Mesh } from './build.js';
import { mulberry32 } from '../world/layout.js';

// The shrubs: what grows between the ferns and the trees (paint/shrubs.js has what was read about each).
// Roosevelt elk keep the floor of these forests open (the Park Service: "Grazing by Roosevelt elk often helps
// to keep the rain forest understory open"), so there is no shrub layer under the old terrace's trees: the
// shrubs are along water, in wet ground, under the alders of the river's banks, at the edges of the old
// clearing, and up on logs and stumps where nothing can browse them (world/layout.js UNDER_KINDS says where).
//
// Each is leaves on cards and nothing else: its stems are painted on the cards, so a kind is one mesh and one
// draw. Leaves are thin (light/materials.js THIN): a card's normal is the card's own, by which it is drawn in
// to where it is attached as it turns edge-on to the eye, and what lights it is where it hangs in the plant.
// No kind here has a second level of detail: a far level that grows shows (see "Learned in milestone 3b"),
// and none of these is many triangles.

const UP = new THREE.Vector3(0, 1, 0);

// Perches for a shrub, which has no wood (plants/build.js): along each stem or cane, from `from` to `to` of its
// length at `n` places, each [x, y, z, ax, ay, az] with the way the stem runs there. A stem is
// origin + along * t + sag * t * t, as the cards were placed. Worked out from the stems the builder recorded,
// after the cards were made: no random number and no vertex is touched.
function sprigsOf(stems, from, to, n) {
  const out = [];
  for (const { origin, along, sag } of stems) {
    for (let k = 0; k < n; k += 1) {
      const t = from + (to - from) * (n === 1 ? 0.5 : k / (n - 1));
      const p = origin.clone().addScaledVector(along, t).addScaledVector(sag, t * t);
      const d = along.clone().addScaledVector(sag, 2 * t).normalize();
      out.push([+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3), +d.x.toFixed(3), +d.y.toFixed(3), +d.z.toFixed(3)]);
    }
  }
  return out;
}

// a card whose normal is its own
function leaf(mesh, origin, along, across, cell, options) {
  const normal = new THREE.Vector3().crossVectors(along, across);
  if (options && options.sag) normal.crossVectors(new THREE.Vector3().copy(along).addScaledVector(options.sag, 0.5), across);
  normal.normalize();
  if (normal.y < 0) normal.negate();
  mesh.card(origin, along, across, cell, normal, options);
}

// A shrub of canes that leave one root, stand, and arch over at their ends. Each cane is a card standing on
// edge in the upright plane the cane leans in (the cane painted from beside it, its shoots above and below
// it). That alone is a fan seen from one side and a sheaf of slivers from the other, so each cane also has
// arms: shoots that leave it sideways, on cards that stand on edge across the plane it leans in; and sprays:
// the ends of shoots, on cards tipped down and outward, which whoever stands outside the shrub looks onto.
//   canes: how many   height: of the first cane's top, in metres (it is the longest and the most upright: the
//   tallest, or within a hand of it)   lean: [least, most] from upright, in radians
//   droop: how far a cane's end comes back down, as a share of its length
//   arms, sprays: how many of each to a cane   arm, spray: [length, width] of each, in metres
function arching(cells, { canes, height, lean, droop, arms, arm, sprays, spray, seed }) {
  const mesh = new Mesh(), r = mulberry32(seed);
  const out = new THREE.Vector3(), side = new THREE.Vector3(), along = new THREE.Vector3(), across = new THREE.Vector3(), sag = new THREE.Vector3(), origin = new THREE.Vector3(), at = new THREE.Vector3();
  const tallest = height / (Math.cos(lean[0]) - droop);
  let reach = 0;
  const stems = [];
  for (let i = 0; i < canes; i += 1) {
    const a = i * 2.39996 + r() * 0.7, tilt = lean[0] + (lean[1] - lean[0]) * (i === 0 ? 0 : 0.25 + 0.75 * r()), long = tallest * (i === 0 ? 1 : 0.66 + 0.3 * r());
    out.set(Math.cos(a), 0, Math.sin(a)); side.set(-out.z, 0, out.x);
    origin.copy(out).multiplyScalar(0.06 + 0.16 * r());
    along.copy(out).multiplyScalar(Math.sin(tilt) * long).addScaledVector(UP, Math.cos(tilt) * long);
    sag.copy(out).multiplyScalar(0.2 * long).addScaledVector(UP, -droop * long * (i === 0 ? 1 : 0.7 + 0.6 * r()));
    // across the cane, in the plane it leans in: a cell is twice as long as it is high, and so is the card
    across.copy(UP).multiplyScalar(Math.sin(tilt)).addScaledVector(out, -Math.cos(tilt)).multiplyScalar(long * 0.5);
    stems.push({ origin: origin.clone(), along: along.clone(), sag: sag.clone() });
    leaf(mesh, origin, along, across, cells.side[i % cells.side.length], { sway: [0.02, 0.7], variation: r(), segments: 2, sag });
    const spot = (t) => at.copy(origin).addScaledVector(along, t).addScaledVector(sag, t * t).clone();
    for (let j = 0; j < arms; j += 1) {
      const from = spot(0.42 + 0.5 * ((j + 0.2 + 0.6 * r()) / arms)), hand = (i + j) % 2 ? 1 : -1, rise = 0.08 + 0.42 * r(), big = 0.78 + 0.4 * r();
      const go = new THREE.Vector3().copy(side).multiplyScalar(hand * Math.cos(rise)).addScaledVector(UP, Math.sin(rise)).addScaledVector(out, 0.15 + 0.3 * r()).normalize();
      const stand = new THREE.Vector3().copy(UP).addScaledVector(go, -go.y).normalize().multiplyScalar(arm[1] * big);
      leaf(mesh, from, go.clone().multiplyScalar(arm[0] * big), stand, cells.flat[(i + j) % cells.flat.length], { sway: [0.2, 1], variation: r(), segments: 2, sag: new THREE.Vector3(0, -0.22 * arm[0] * big, 0) });
      reach = Math.max(reach, Math.hypot(from.x + go.x * arm[0] * big, from.z + go.z * arm[0] * big));
    }
    for (let j = 0; j < sprays; j += 1) {
      const from = spot(0.55 + 0.43 * ((j + 0.3 + 0.5 * r()) / sprays)), turn = ((i + j) % 2 ? 1 : -1) * (0.35 + 0.7 * r()), dip = 0.3 + 0.45 * r(), big = 0.8 + 0.4 * r();
      const b = a + turn, sx = Math.cos(b), sz = Math.sin(b);
      const go = new THREE.Vector3(sx * Math.cos(dip), -Math.sin(dip), sz * Math.cos(dip)).multiplyScalar(spray[0] * big);
      const wide = new THREE.Vector3(-sz, (r() - 0.5) * 0.5, sx).multiplyScalar(spray[1] * big);
      leaf(mesh, from, go, wide, cells.flat[(i + j + 1) % cells.flat.length], { sway: [0.3, 1], variation: r() });
      reach = Math.max(reach, Math.hypot(from.x + go.x, from.z + go.z));
    }
    at.copy(origin).add(along).add(sag);
    reach = Math.max(reach, Math.hypot(at.x, at.z));
  }
  return { mesh, reach, stems };
}

// Salmonberry: a thicket shrub of the stream sides and the alder flats, two to three metres and more; golden
// brown canes that kink at every node, leaves of three sharp-toothed leaflets, and in the middle of May the last
// of its pink-purple flowers and the first of its orange berries.
export const SALMON = { height: 2.7, heart: [0, 1.7, 0], max: 92, gone: 125 };
export function buildSalmonberry(sheets) {
  const cells = sheets.shrub.salmon;
  const { mesh, reach, stems } = arching({ side: cells.cane, flat: cells.spray }, { canes: 7, height: SALMON.height, lean: [0.06, 0.44], droop: 0.14, arms: 2, arm: [1.05, 0.52], sprays: 2, spray: [0.95, 0.48], seed: 211 });
  const perch = { position: [], trunk: null, stubs: [], limbs: null, sprigs: sprigsOf(stems, 0.45, 0.95, 3) };
  return { foliage: [mesh.geometry()], perch, hang: [], crown: { middle: [...SALMON.heart], radius: reach, low: 0.7 }, height: SALMON.height, reach: reach + 0.3, lod: [], max: SALMON.max, gone: SALMON.gone };
}

// Red elderberry: a tall, loose shrub of a few stems, bare below, its leaves in opposite pairs, each of five or
// seven leaflets, and at the ends of its shoots heads of cream flowers, out in the middle of May.
export const ELDER = { height: 3.9, heart: [0, 2.6, 0], max: 110, gone: 150 };
export function buildElder(sheets) {
  const cells = sheets.shrub.elder;
  const { mesh, reach, stems } = arching({ side: cells.stem, flat: cells.spray }, { canes: 6, height: ELDER.height, lean: [0.05, 0.4], droop: 0.1, arms: 2, arm: [1.45, 0.72], sprays: 3, spray: [1.3, 0.65], seed: 223 });
  const perch = { position: [], trunk: null, stubs: [], limbs: null, sprigs: sprigsOf(stems, 0.5, 0.95, 3) };
  return { foliage: [mesh.geometry()], perch, hang: [], crown: { middle: [...ELDER.heart], radius: reach, low: 1.3 }, height: ELDER.height, reach: reach + 0.3, lod: [], max: ELDER.max, gone: ELDER.gone };
}

// Devil's club: a few thick stems, pale and thick with yellow spines, that leave the ground leaning and turn
// up; up the last third of each, great leaves on long stalks, held out all round and hanging at their far
// edges, so that from beside the plant it is a canopy of leaves over bare, crooked stems. A stem is two narrow
// cards crossed along it; a leaf is a card of its own, bent once, its stalk at the stem. (Leaves held level, in
// a ring at each stem's end, were seen edge-on from the walk, where a thin leaf's card is drawn in: bare canes.
// Long straight stems with small leaves were canes too. The leaves are a little larger than life.)
export const CLUB = { height: 1.7, heart: [0, 1.1, 0], max: 60, gone: 85 };
export function buildDevilsClub(sheets) {
  const cells = sheets.shrub.club, mesh = new Mesh(), r = mulberry32(131);
  const out = new THREE.Vector3(), side = new THREE.Vector3(), along = new THREE.Vector3(), sag = new THREE.Vector3(), base = new THREE.Vector3(), at = new THREE.Vector3(), dir = new THREE.Vector3(), wide = new THREE.Vector3(), cross = new THREE.Vector3();
  const STEMS = 4, THICK = 0.1, recorded = [];
  let reach = 0;
  // a leaf whose stalk leaves `from` on bearing `b`, rising `rise` radians; `big` metres from the stem to its
  // far edge; its far half comes down by `hang` of that
  const blade = (from, b, rise, big, hang) => {
    dir.set(Math.cos(b) * Math.cos(rise), Math.sin(rise), Math.sin(b) * Math.cos(rise)).multiplyScalar(big);
    wide.set(-Math.sin(b), (r() - 0.5) * 0.3, Math.cos(b)).multiplyScalar(big);               // the leaf's square is as wide as it is long
    leaf(mesh, from.clone(), dir.clone(), wide.clone(), cells.leaf[Math.floor(r() * cells.leaf.length)], { sway: [0.1, 0.8], variation: r(), segments: 2, sag: new THREE.Vector3(Math.cos(b) * 0.08, -hang, Math.sin(b) * 0.08).multiplyScalar(big) });
    reach = Math.max(reach, Math.hypot(from.x + dir.x, from.z + dir.z));
  };
  for (let i = 0; i < STEMS; i += 1) {
    const a = i * 2.39996 + r() * 0.8, tilt = i === 0 ? 0.3 : 0.5 + 0.5 * r(), long = CLUB.height * (i === 0 ? 0.92 : 0.58 + 0.3 * r());
    out.set(Math.cos(a), 0, Math.sin(a)); side.set(-out.z, 0, out.x);
    base.copy(out).multiplyScalar(0.1 + 0.2 * r());
    along.copy(out).multiplyScalar(Math.sin(tilt) * long).addScaledVector(UP, Math.cos(tilt) * long);
    // it leaves the ground leaning and turns up as it goes, bowing a little to one side
    sag.copy(out).multiplyScalar(-0.45 * Math.sin(tilt) * long).addScaledVector(UP, 0.2 * Math.sin(tilt) * long).addScaledVector(side, (r() - 0.5) * 0.3 * long);
    cross.copy(UP).multiplyScalar(Math.sin(tilt)).addScaledVector(out, -Math.cos(tilt));
    recorded.push({ origin: base.clone(), along: along.clone(), sag: sag.clone() });
    leaf(mesh, base, along, new THREE.Vector3().copy(side).multiplyScalar(THICK), cells.stem[i % 2], { sway: [0, 0.2], variation: r(), segments: 3, sag });
    leaf(mesh, base, along, new THREE.Vector3().copy(cross).multiplyScalar(THICK), cells.stem[(i + 1) % 2], { sway: [0, 0.2], variation: r(), segments: 3, sag });
    // leaves up its last third, round it by turns: the higher, the smaller and the more upright
    const LEAVES = 7 + (r() < 0.5 ? 1 : 0), turn = r() * 6.283;
    for (let k = 0; k < LEAVES; k += 1) {
      const f = k / (LEAVES - 1), t = 0.66 + 0.34 * f;
      at.copy(base).addScaledVector(along, t).addScaledVector(sag, t * t);
      blade(at, turn + k * 2.39996 + (r() - 0.5) * 0.5, 0.3 + 0.35 * f + 0.2 * r(), (0.86 - 0.26 * f) * (0.9 + 0.2 * r()), 0.7 - 0.3 * f + 0.2 * r());
    }
  }
  const perch = { position: [], trunk: null, stubs: [], limbs: null, sprigs: sprigsOf(recorded, 0.4, 0.95, 3) };
  return { foliage: [mesh.geometry()], perch, hang: [], crown: { middle: [...CLUB.heart], radius: reach, low: 0.7 }, height: CLUB.height, reach: reach + 0.3, lod: [], max: CLUB.max, gone: CLUB.gone };
}

// Red huckleberry: an airy shrub of thin, bright green twigs and small leaves, on a stump's top or along a
// log, out of the elk's reach. Fans of twigs that lean out all round, some in the upright plane they lean in
// and some across it.
export const HUCKLE = { height: 1.5, heart: [0, 0.95, 0], max: 46, gone: 66 };
export function buildHuckleberry(sheets) {
  const cells = sheets.shrub.huckle.fan, mesh = new Mesh(), r = mulberry32(151);
  const out = new THREE.Vector3(), side = new THREE.Vector3(), along = new THREE.Vector3(), across = new THREE.Vector3(), origin = new THREE.Vector3();
  let reach = 0;
  const twigs = [];
  for (let i = 0; i < 9; i += 1) {
    const a = i * 2.39996 + r() * 0.5, tilt = 0.15 + 0.75 * r(), long = HUCKLE.height * (0.72 + 0.4 * r());
    out.set(Math.cos(a), 0, Math.sin(a)); side.set(-out.z, 0, out.x);
    origin.copy(out).multiplyScalar(0.04 + 0.08 * r());
    along.copy(out).multiplyScalar(Math.sin(tilt) * long).addScaledVector(UP, Math.cos(tilt) * long);
    if (i % 3 === 0) across.copy(UP).multiplyScalar(Math.sin(tilt)).addScaledVector(out, -Math.cos(tilt)).multiplyScalar(long * 0.5);
    else across.copy(side).multiplyScalar(long * 0.5);
    twigs.push({ origin: origin.clone(), along: along.clone(), sag: new THREE.Vector3() });
    leaf(mesh, origin, along, across, cells[i % cells.length], { sway: [0.05, 0.9], variation: r() });
    reach = Math.max(reach, Math.hypot(origin.x + along.x, origin.z + along.z) + long * 0.2);
  }
  const perch = { position: [], trunk: null, stubs: [], limbs: null, sprigs: sprigsOf(twigs, 0.4, 0.9, 2) };
  return { foliage: [mesh.geometry()], perch, hang: [], crown: { middle: [...HUCKLE.heart], radius: reach, low: 0.4 }, height: HUCKLE.height, reach: reach + 0.2, lod: [], max: HUCKLE.max, gone: HUCKLE.gone };
}

// Bracken, in the old clearing: fronds that come up singly from a creeping root, a stride apart: each a bare
// stalk that stands and, from its top, a blade as broad at its foot as it is long, three times cut, going out
// and up and then over; and among them a young one still unrolling. A blade is one card bent once, and its
// stalk two narrow cards crossed (the sheet's frond has its stalk along its first quarter: each takes its own
// part of the cell). Its leaves are lit as the ferns' are, by the clump's own hull: a walker looks down on it.
export const BRACKEN = { height: 1.0, max: 48, gone: 70 };
export function buildBracken(sheets) {
  const cells = sheets.shrub.bracken, mesh = new Mesh(), r = mulberry32(173);
  const out = new THREE.Vector3(), side = new THREE.Vector3(), along = new THREE.Vector3(), across = new THREE.Vector3(), sag = new THREE.Vector3(), origin = new THREE.Vector3(), top = new THREE.Vector3(), normal = new THREE.Vector3();
  const [u0, v0, u1, v1] = cells.frond[0], vm = (v0 + v1) / 2, STALK = 0.25;
  const bladeCell = [u0 + (u1 - u0) * STALK, v0, u1, v1], stalkCell = [u0, vm - (v1 - v0) * 0.035, u0 + (u1 - u0) * STALK, vm + (v1 - v0) * 0.035];
  let reach = 0;
  for (let i = 0; i < 5; i += 1) {
    const a = i * 2.39996 + r() * 0.8, far = 0.12 + 0.4 * Math.sqrt(i / 5 + 0.1 * r()), young = i === 4;
    out.set(Math.cos(a), 0, Math.sin(a)); side.set(-out.z, 0, out.x);
    origin.set(Math.cos(a * 1.7 + 1) * far, 0, Math.sin(a * 1.7 + 1) * far);
    if (young) {
      // upright, and seen from all round: two cards crossed
      along.copy(UP).multiplyScalar(0.56).addScaledVector(out, 0.1);
      for (const turn of [side, out]) {
        normal.copy(turn === side ? out : side);
        mesh.card(origin, along, across.copy(turn).multiplyScalar(0.28), cells.young[0], normal, { sway: [0, 0.5], variation: r() });
      }
      continue;
    }
    const tall = 0.4 + 0.3 * r(), long = 0.62 + 0.26 * r();
    top.copy(origin).addScaledVector(out, tall * 0.22).addScaledVector(UP, tall);
    along.copy(top).sub(origin);
    for (const turn of [side, out]) {
      normal.copy(turn === side ? out : side);
      mesh.card(origin, along, across.copy(turn).multiplyScalar(0.05), stalkCell, normal, { sway: [0, 0.35], variation: r() });
    }
    // the blade goes out and up from the stalk's top, and over: its end a little above where it began
    along.copy(out).multiplyScalar(0.84 * long).addScaledVector(UP, 0.5 * long);
    sag.copy(out).multiplyScalar(0.1 * long).addScaledVector(UP, -0.4 * long);
    across.copy(side).multiplyScalar(long * 0.74);
    normal.copy(out).multiplyScalar(-0.2).addScaledVector(UP, 0.95).normalize();
    mesh.card(top, along, across, bladeCell, normal, { sway: [0.35, 0.8], variation: r(), segments: 2, sag });
    reach = Math.max(reach, Math.hypot(top.x + along.x + sag.x, top.z + along.z + sag.z) + long * 0.2);
  }
  return { foliage: [mesh.geometry()], height: BRACKEN.height, reach: reach + 0.2, lod: [], max: BRACKEN.max, gone: BRACKEN.gone };
}
