import * as THREE from 'three';
import { Mesh, sheetCell, perchOf } from './build.js';
import { curve } from './maple.js';
import { mulberry32 } from '../world/layout.js';

// What grows along the river: red alder on its banks, and willow on the backs of its bars (paint/alder.js).
//
// A red alder in a stand: a pale, straight pole of a trunk, hardly tapered, clear of branches for half its
// height and more, and at the top of it a narrow dome of slender limbs that go up and out. It leans a little
// towards the light, which on a bank is towards the water. One tree, built once and stood wherever the bank is
// its own, each turned and scaled (world/layout.js); it is built leaning towards +x.
//
// What was read, by agents and not seen as an image (2026-11-15; the Forest Service's FEIS and PNW-GTR-669):
// in riparian stands it stands 20 m at twenty years, 25 at thirty, 27 at forty and 30 at fifty, and is 28, 33
// and 41 cm through at thirty, forty and fifty; in a dense stand it prunes itself, leaving "clear, slightly
// tapered boles" and narrow domed crowns; on the Queets it stands at about 2,700 stems a hectare from 18 to 41
// years. Not found at a source: what share of the trunk is clear (it is 0.5 here), how wide a crown is, and
// whether it leans out over water: those are the agent's drawing.
//
// Its wood has three levels: as it is to 14 m; to 60 m its trunk in fewer sides, its limbs as straight sticks and
// its twigs gone; and beyond that its trunk alone, three-sided. (No alder stands within 12 m of the walk, which
// lies in the window's line where it comes to the river: the first level is for a long lens.) Its leaves have
// two, and change at 60 m (`lodLeaf`). Both have three cards through the trunk with a whole crown painted on
// each, which never move; the near one has besides them sprays at the twigs' ends and hanging under the limbs,
// which shrink into their twigs between 60 and 87 m. (The three cards were first the far level's alone, and
// grew out of the trunk as the sprays shrank: a card fifteen metres long, growing, slides its paint across
// every pixel it covers, and a crown seventy metres off changed a third of a 40-pixel square in one step of a
// walk. So with grass: CLAUDE.md, "Learned in the valley's rebuild".)
//
// Lengths are metres. `heart` is the middle of its crown: a leaf takes its light as that part of the dome faces.
export const ALDER = { height: 25, crown: 4, crownWeight: 0.3, heart: [1.1, 18.5, 0] };
// A willow of the bars (Scouler's and Sitka willow are the ones named for these rivers): a sheaf of stems from
// one root that lean out and arch over, in narrow leaves from knee height up. The sources give 1 to 8 m and
// more; it is built 5 m tall, and laid no taller than 3 m where the cabin's window looks (world/layout.js).
// Its leaves have one level, its shoots, at any distance; its stems two, and from 22 m every third is left.
export const WILLOW = { height: 5, heart: [0, 2.4, 0] };

const UP = new THREE.Vector3(0, 1, 0);
const rad = THREE.MathUtils.degToRad;
const shares = (n) => Array.from({ length: n + 1 }, (_, j) => j / n);

// `sheets.alder` is the riverside's painted sheet; without one a tree is built bare.
export function buildAlder(sheets) {
  const r = mulberry32(8123), sheet = sheets.alder, H = ALDER.height;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---- its skeleton ------------------------------------------------------------------------------------
  // the trunk: it leaves the ground a little out of true, and is swept further the way it leans as it climbs
  // (stood dead upright for its first eight metres, a stand of them was a row of fence posts)
  const trunk = curve(V(0, -0.4, 0), V(0.42, H * 0.34, 0.1), V(1.0, H * 0.7, -0.12), V(2.0, H - 0.2, 0.05), 0.12, 1.3);
  const girth = (u) => 0.175 * Math.pow(1 - u, 0.75) + 0.018;                        // 37 cm through at chest height
  const limbs = [];
  const limb = (u, bearing, length, climb) => {
    const p0 = trunk.at(u), out = V(Math.cos(bearing), 0, Math.sin(bearing));
    const way = out.clone().multiplyScalar(Math.cos(climb)).addScaledVector(UP, Math.sin(climb));
    const p1 = p0.clone().addScaledVector(way, length * 0.4), p2 = p0.clone().addScaledVector(way, length * 0.74).addScaledVector(UP, length * 0.06);
    const p3 = p0.clone().addScaledVector(way, length).addScaledVector(UP, length * 0.2);
    const thick = 0.018 + length * 0.011;
    limbs.push({ path: curve(p0, p1, p2, p3, 0.07, r() * 6), out, radius: (v) => thick * (1 - 0.8 * v) + 0.007, length, share: (u - 0.5) / 0.46 });
  };
  // the crown's limbs: fifteen up the top half of the trunk, shorter and steeper the higher they leave it
  const COUNT = 15;
  for (let i = 0; i < COUNT; i += 1) {
    const t = (i + 0.6 * r()) / COUNT;
    limb(0.5 + 0.46 * Math.pow(t, 0.9), i * 2.39996 + (r() - 0.5) * 0.8, (3.3 - 2.0 * t) * (0.8 + 0.4 * r()), rad(26 + 32 * t + 10 * (r() - 0.5)));
  }
  // (and two lower down on the side it leans to, where the light is)
  limb(0.37, 0.3, 3.0, rad(22)); limb(0.44, -0.55, 3.3, rad(28));
  // its twigs: three to a limb, to one side and the other by turns
  const side = new THREE.Vector3(), tangent = new THREE.Vector3(), level = new THREE.Vector3();
  const twigs = [];
  for (const l of limbs) {
    [0.42, 0.66, 0.88].forEach((v, k) => {
      const from = l.path.at(v), hand = (k % 2 ? 1 : -1) * (r() < 0.8 ? 1 : -1), length = (1.3 - 0.4 * v) * (0.8 + 0.4 * r());
      l.path.dir(v, tangent); level.set(tangent.x, 0, tangent.z); if (level.lengthSq() < 1e-6) level.copy(l.out); level.normalize(); side.set(-level.z, 0, level.x);
      const way = V(0, 0, 0).addScaledVector(side, hand * (0.6 + 0.3 * r())).addScaledVector(level, 0.55 + 0.3 * r()).addScaledVector(UP, 0.25 + 0.3 * r()).normalize();
      twigs.push({ from, way, to: from.clone().addScaledVector(way, length), length });
    });
  }

  // ---- its wood, at three levels -----------------------------------------------------------------------
  const wood = (li) => {
    const mesh = new Mesh(), tubes = { limbs: [] };
    const rings = [14, 7, 3][li], radial = [10, 6, 3][li], at = shares(rings).map((u) => Math.pow(u, 1.25));      // more rings near its foot
    tubes.trunk = { base: mesh.tube(at.map((u) => trunk.at(u)), at.map(girth), radial, { around: 1, tile: 2.4, lobes: 4, flare: (t, ring) => 0.4 * Math.exp(-(at[ring] * H) / 0.45) }), radial, at };
    if (li < 2) {
      for (const l of limbs) {
        const n = li === 0 ? 5 : 1, sides = li === 0 ? 5 : 3, along = shares(n);
        // (from far off it has no limbs: at the second level each thins away to its own middle line)
        tubes.limbs.push({ base: mesh.tube(along.map((v) => l.path.at(v)), along.map(l.radius), sides, { around: 1, tile: 1.5, drop: li === 1 }), radial: sides, at: along });
      }
    }
    if (li === 0) for (const t of twigs) mesh.tube([t.from, t.to], [0.014, 0.005], 3, { around: 1, tile: 1, drop: true });
    return { mesh, tubes };
  };
  const built = [wood(0), wood(1), wood(2)];
  for (let li = 0; li < 2; li += 1) {
    built[li].mesh.settle(built[li].tubes.trunk, built[li + 1].mesh, built[li + 1].tubes.trunk);
    if (li === 0) built[0].tubes.limbs.forEach((tube, i) => built[0].mesh.settle(tube, built[1].mesh, built[1].tubes.limbs[i]));
  }
  // (`reach` is for culling, at the largest scale the layout gives one: its lean, its crown and its sprays' ends)
  const kind = { solid: built.map((b) => b.mesh.geometry()), height: H, reach: 10, lod: [14, 60], handWood: [0.3, 0.15], max: 330, gone: 390,
    // what stands on it and hangs from it (plants/build.js): its trunk, its limbs as drawn near, two places under
    // each limb's outer half, and its crown from among its lowest limbs to over its top
    perch: perchOf(built[0].mesh, { trunk: built[0].tubes.trunk, limbs: built[0].tubes.limbs }),
    hang: limbs.flatMap((l) => [0.5, 0.75].map((v) => l.path.at(v).toArray())),
    crown: { middle: [...ALDER.heart], radius: 4.3, low: trunk.at(0.42).y } };
  if (!sheet) return kind;

  // ---- its leaves --------------------------------------------------------------------------------------
  const cells = sheet.cells, pick = (list) => sheetCell(list[Math.floor(r() * list.length)], cells);
  const near = new Mesh(), far = new Mesh(), cards = [];
  const add = (origin, along, across, cell, options) => cards.push({ y: origin.y + along.y * 0.5, origin: origin.clone(), along: along.clone(), across: across.clone(), cell, options });
  const flat = (from, way) => { level.set(way.x, 0, way.z); if (level.lengthSq() < 1e-6) level.set(1, 0, 0); return level.normalize(); };
  // A spray from `from` going `way`: `long` by half that, its far end tipped down and the whole of it rolled
  // to one side, so that it shows some of its face from beside the tree as well as from under it.
  const spray = (from, way, long) => {
    flat(from, way); side.set(-level.z, 0, level.x);
    const down = rad(8 + 24 * r()) - way.y * 0.5, roll = (r() < 0.5 ? -1 : 1) * rad(12 + 34 * r());
    const along = V(0, 0, 0).addScaledVector(level, Math.cos(down)).addScaledVector(UP, -Math.sin(down)).multiplyScalar(long);
    const across = V(0, 0, 0).addScaledVector(side, Math.cos(roll)).addScaledVector(UP, Math.sin(roll)).multiplyScalar(long * 0.5);
    add(from, along, across, pick(sheet.spray), { sway: [0.2, 1], variation: r() });
  };
  for (const t of twigs) spray(t.from.clone().addScaledVector(t.way, t.length * 0.3), t.way, (2.0 + 0.6 * r()) * (0.8 + 0.2 * t.length));
  for (const l of limbs) {
    // the limb's own end, and leaves hanging under its outer half on a card that stands on edge along it
    l.path.dir(0.9, tangent);
    spray(l.path.at(0.82), tangent, 2.2 + 0.6 * r());
    const from = l.path.at(0.4), to = l.path.at(1), run = flat(from, tangent.subVectors(to, from)).clone(), long = Math.max(2.1, from.distanceTo(to) * 1.25);
    const tilt = rad(14) * (r() - 0.5) * 2;
    side.set(-run.z, 0, run.x);
    const across = V(0, 0, 0).addScaledVector(UP, Math.cos(tilt)).addScaledVector(side, Math.sin(tilt)).multiplyScalar(long * 0.5);
    const along = run.clone().multiplyScalar(Math.cos(0.2)).addScaledVector(UP, Math.sin(0.2) * Math.sign(to.y - from.y)).multiplyScalar(long);
    // (the twig is painted 0.17 of the way down the cell: the card hangs from the limb, and is attached to it there)
    add(from.clone().addScaledVector(across, -0.33), along, across, pick(sheet.hung), { sway: [0.2, 0.7], variation: r(), root: from.clone() });
  }
  // (and its top: the leader's own sprays, three ways)
  for (let k = 0; k < 3; k += 1) { const a = k * 2.1 + r(); spray(trunk.at(0.93 + 0.02 * k), V(Math.cos(a), 0.5, Math.sin(a)), 1.9 + 0.4 * r()); }
  cards.sort((a, b) => a.y - b.y);
  for (const c of cards) near.card(c.origin, c.along, c.across, c.cell, new THREE.Vector3().crossVectors(c.along, c.across).normalize(), c.options);

  // The crown itself, on three cards through the trunk, from among its lowest limbs to over its top: all there
  // is of its leaves from far off, and the body of it from nearer. They are the same cards in both levels and are
  // their own roots: they do not move as the sprays go. A card drawn in to its root as it turns edge-on would
  // then not move at all, and looked up along from under the tree one was a streak; they are marked whole (a
  // freedom in the wind below zero), and such a card is drawn in to the crown's axis (light/shared.js, AXIS).
  const foot = trunk.at(0.42), top = trunk.at(1).addScaledVector(UP, 1.2), rise = new THREE.Vector3().subVectors(top, foot);
  for (const mesh of [near, far]) {
    for (let k = 0; k < 3; k += 1) {
      const a = 0.35 + k * 1.0472, across = V(Math.cos(a), 0, Math.sin(a)).multiplyScalar(8.6);
      mesh.card(foot, rise, across, sheetCell(sheet.crown[k % sheet.crown.length], cells), new THREE.Vector3().crossVectors(rise, across).normalize(),
        { sway: [-0.05, -0.5], variation: 0.3 * k, becomes: { along: rise, across } });
    }
  }
  return { ...kind, foliage: [near.geometry(), far.geometry()], lodLeaf: [60], hand: [0.45] };
}

export function buildWillow(sheets) {
  const r = mulberry32(8209), sheet = sheets.alder;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const side = new THREE.Vector3(), tangent = new THREE.Vector3(), level = new THREE.Vector3();
  // its stems: nine from one root, the outer ones leaning furthest and shortest, every one arching outwards
  const stems = [];
  for (let i = 0; i < 9; i += 1) {
    const bearing = i * 2.39996 + (r() - 0.5) * 0.6, out = V(Math.cos(bearing), 0, Math.sin(bearing)), lean = i === 0 ? 0.12 : 0.25 + 0.45 * r();
    const high = WILLOW.height * (1 - 0.42 * lean) * (0.78 + 0.22 * r()), reach = high * lean * 1.5;
    const p0 = V(out.x * 0.1, -0.15, out.z * 0.1), p1 = p0.clone().addScaledVector(out, reach * 0.18).addScaledVector(UP, high * 0.5);
    const p2 = p0.clone().addScaledVector(out, reach * 0.55).addScaledVector(UP, high * 0.92), p3 = p0.clone().addScaledVector(out, reach).addScaledVector(UP, high * (1 - 0.12 * lean));
    stems.push({ path: curve(p0, p1, p2, p3, 0.06, r() * 6), out, thick: 0.03 + 0.014 * r() });
  }
  const wood = (fine) => {
    const mesh = new Mesh(), tubes = [];
    stems.forEach((s, i) => {
      const keep = i % 3 === 0;                                            // from far off, every third stem
      if (!fine && !keep) return;
      const at = shares(fine ? 6 : 2), sides = fine ? 4 : 3;
      const base = mesh.tube(at.map((u) => s.path.at(u)), at.map((u) => s.thick * (1 - 0.75 * u) + 0.006), sides, { around: 1, tile: 1.2, drop: fine && !keep });
      if (keep) tubes.push({ base, radial: sides, at });
    });
    return { mesh, tubes };
  };
  const near = wood(true), far = wood(false);
  near.tubes.forEach((tube, i) => near.mesh.settle(tube, far.mesh, far.tubes[i]));
  const kind = { solid: [near.mesh.geometry(), far.mesh.geometry()], height: WILLOW.height, reach: 7.5, lod: [22], handWood: [0.3], max: 230, gone: 280, casts: false };
  // what stands on it (plants/build.js): the stems it keeps at every level as limbs, and sprigs along every stem;
  // worked out from the stems after every mesh was built, so nothing drawn changes
  const sprigs = [], dd = new THREE.Vector3();
  for (const st of stems) for (const u of [0.45, 0.65, 0.85, 0.97]) {
    const p = st.path.at(u); st.path.dir(u, dd);
    sprigs.push([+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3), +dd.x.toFixed(3), +dd.y.toFixed(3), +dd.z.toFixed(3)]);
  }
  kind.perch = perchOf(near.mesh, { limbs: near.tubes, sprigs });
  kind.hang = stems.filter((_, i) => i % 3 === 0).flatMap((st) => [0.5, 0.75].map((u) => st.path.at(u).toArray()));
  kind.crown = { middle: [0, WILLOW.height * 0.62, 0], radius: 2.2, low: WILLOW.height * 0.3 };
  if (!sheet) return kind;

  const cells = sheet.cells, leaf = new Mesh(), cards = [];
  for (const s of stems) {
    // shoots from a fifth of the way up it, to one side and the other by turns, and one that carries it on
    for (const [u, hand] of [[0.2, -1], [0.34, 1], [0.48, -1], [0.62, 1], [0.8, -1], [0.97, 0]]) {
      const from = s.path.at(u);
      s.path.dir(u, tangent); level.set(tangent.x, 0, tangent.z); if (level.lengthSq() < 1e-6) level.copy(s.out); level.normalize(); side.set(-level.z, 0, level.x);
      const long = (1.7 + 0.7 * r()) * (hand ? 1 : 0.9) * (0.7 + 0.3 * Math.min(1, u * 2.5)), up = 0.15 + 0.45 * r(), roll = (r() < 0.5 ? -1 : 1) * rad(15 + 45 * r());
      const way = V(0, 0, 0).addScaledVector(level, hand ? 0.6 : 1).addScaledVector(side, hand * 0.8).normalize();
      const along = way.clone().multiplyScalar(Math.cos(up)).addScaledVector(UP, Math.sin(up)).multiplyScalar(long);
      const across = V(-way.z, 0, way.x).multiplyScalar(Math.cos(roll)).addScaledVector(UP, Math.sin(roll)).multiplyScalar(long * 0.5);
      cards.push({ y: from.y, origin: from.clone().addScaledVector(way, -0.08), along, across, variation: r() });
    }
  }
  cards.sort((a, b) => a.y - b.y);
  cards.forEach((c, i) => leaf.card(c.origin, c.along, c.across, sheetCell(sheet.willow[i % sheet.willow.length], cells), new THREE.Vector3().crossVectors(c.along, c.across).normalize(), { sway: [0.25, 1], variation: c.variation }));
  return { ...kind, foliage: [leaf.geometry()] };
}
