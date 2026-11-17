import * as THREE from 'three';
import { onTrunk } from '../perch.js';

// Places of the woodpeckers' own (life/families/trunk.js), read from the world as it was built and the visit as
// it goes: the lower trunks of trees that divide low, and the sapsucker's sap wells.
//
// ---- Trunks that divide low. The habitat's trunks are 5 m tall at the least (life/habitat.js), so a bigleaf
// maple, whose trunk divides into its five great limbs at about 3.3 m, is not among them, though the trunk is the
// broadest of the walk after the old cedar's and stands 7 to 8 m from it at the maple hall. Its tree is among the
// leafy ones (habitat.leafy, world.leafyNear: every tree within 26 m of the walk whose limbs come low enough), with
// its own perch's trunk, and is made here into a place of the same shape as a habitat's trunk: `kind`, `off`, `s`,
// `girth`, `top`, `turnOffset` beside what life/perch.js `standing` gives (`perch`, `matrix`, `yaw`, `scale`,
// `foot`, `heights`, `axis`). Only a trunk the habitat leaves out is made: 2.5 m tall at the least and under 5 m,
// and 0.15 m round its axis (the habitat's own least): so the maples, and not the apple (1.45 m to its fork) or a
// tree the habitat has already. `forked: true` says which it is: nothing stands between the walker and a bird by
// it as far as world.blocked knows (it knows the habitat's trunks), so a forked trunk hides nothing.
const LOWEST = 2.5, HABITAT_TOP = 5, HABITAT_GIRTH = 0.15;
const made = new WeakMap(), _out = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() };

// The trunk place of a leafy tree that divides low, or null.
export function forked(tree) {
  if (made.has(tree)) return made.get(tree);
  let place = null;
  const p = tree && tree.place;
  if (p && p.perch && p.perch.trunk && p.heights.length >= 2) {
    const top = p.heights[p.heights.length - 1];
    if (top >= LOWEST && top < HABITAT_TOP) {
      // (the record's yaw, from the turn standing() made of it about +y)
      const yaw = 2 * Math.atan2(p.yaw.y, p.yaw.w);
      place = { ...p, kind: tree.kind, off: tree.off, s: tree.s, top, forked: true, turnOffset: -yaw / (Math.PI * 2) };
      onTrunk(place, Math.min(1.5, top * 0.45), 0, _out);
      place.girth = Math.hypot(_out.point.x - place.foot.x, _out.point.z - place.foot.z);
      if (place.girth < HABITAT_GIRTH) place = null;
    }
  }
  made.set(tree, place);
  return place;
}

// Every such trunk within `reach` of a spot (into `list`, which is emptied first). `near(x, z, reach, list)` is the
// world's or the habitat's leafyNear.
const _trees = [];
export function forkedNear(near, x, z, reach, list = []) {
  list.length = 0;
  for (const tree of near(x, z, reach, _trees)) { const place = forked(tree); if (place) list.push(place); }
  return list;
}

// ---- The sapsucker's sap wells. Rows of small holes it drills through the bark of a living tree, side by side
// round the trunk, a row over the row before; it comes back to them, opens them again and laps the sap that runs,
// and the insects that come to it. They stay where they were drilled for the rest of the visit, whoever drilled them
// and whether or not it is there: a well is the visit's, kept here by the visit's world, not the bird's.
// Each tree that has any: { rows: [{ height, centre, turns: [...], made: [...], tended: [...], by }] }, where
// `height` is metres above the tree's foot (where the bill strikes: the bird clings that far below it), `turns` the
// share of the way round each well is (in the tree's own turn, as life/perch.js onTrunk takes it), `made` / `tended`
// the visit's clock when each was drilled and last opened (null: not drilled yet; below 0: before the visit began,
// the wells a sapsucker already has when it is first about), and `by` the visit's record of the animal that drilled
// the row. What a well looks like is not drawn yet: that needs a mesh of the page's (life/index.js), a dark oval a
// few millimetres across on the bark at `point`, facing `normal` (sapWells, below).
const WELLS = new WeakMap();
const ledger = (world) => { let trees = WELLS.get(world); if (!trees) { trees = new Map(); WELLS.set(world, trees); } return trees; };
const drilled = (one) => one.rows.some((row) => row.made.some((t) => t != null));

// The wells of one tree (made empty if it has none), and whether a tree has any drilled.
export function wellsOf(world, tree) {
  const trees = ledger(world);
  let one = trees.get(tree);
  if (!one) { one = { rows: [] }; trees.set(tree, one); }
  return one;
}
export const hasWells = (world, tree) => { const one = ledger(world).get(tree); return !!one && drilled(one); };
// the trees with wells drilled within `reach` of a spot, nearest first
export function wellTreesNear(world, x, z, reach) {
  const out = [];
  for (const [tree, one] of ledger(world)) if (drilled(one) && Math.hypot(tree.foot.x - x, tree.foot.z - z) <= reach) out.push(tree);
  return out.sort((a, b) => Math.hypot(a.foot.x - x, a.foot.z - z) - Math.hypot(b.foot.x - x, b.foot.z - z));
}

// Every well drilled so far, where it is in the world: { tree, point, normal, made, tended }. For what else comes to
// the sap (a hummingbird, a warbler) and for whatever draws the wells.
export function sapWells(world) {
  const out = [];
  for (const [tree, one] of ledger(world)) for (const row of one.rows) row.turns.forEach((turn, i) => {
    if (row.made[i] == null) return;
    onTrunk(tree, row.height, turn, _out);
    out.push({ tree, point: _out.point.clone(), normal: _out.normal.clone(), made: row.made[i], tended: row.tended[i] });
  });
  return out;
}
