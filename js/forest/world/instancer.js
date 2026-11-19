import * as THREE from 'three';
import { RECORD } from './layout.js';

// Layers: 0 is what the walker's camera draws. SOLID tags trunks, logs and
// ground so the budget can count them apart from foliage. CASTER holds the
// static, coarse copies that are drawn only into the sun's shadow map.
export const SOLID_LAYER = 3;
export const CASTER_LAYER = 4;

const CELL = 16;
// Detail levels hand over across a stretch of distance, not at one. A plant is its own level out to the
// distance its kind gives (`lod`), and over a further share of that distance it turns into the next level.
// Nothing nearer than `lod` is touched, so the forest near the walker is the levels as they were painted.
// Foliage takes a long stretch (`hand`, set by each kind), so that the change is slow: a crown that turns
// into its next level over ten or fifteen metres of walking is not seen to. Longer is slower still, and
// costs triangles, because the finer level is drawn further out. Wood takes a short stretch (`handWood`):
// a trunk and the next level's trunk are centimetres apart, and the finest trunks are most of the forest's
// triangles, so they are not drawn far. A tree's limbs are wood, but go with its foliage (plants/conifer.js).
const HAND = 1, HAND_WOOD = 0.15;
// A plant is drawn whole out to `max` and is gone at `gone`; between them it shrinks into its foot. Not all
// at one distance: each plant ends somewhere in the last SPREAD of that stretch, by a number of its own.
const SPREAD = 0.3;
const LEAST = 0.1;          // smaller than this share of its size, a plant is not drawn: cards under a pixel across shimmer as the walker moves
// A plant may be `late`: the eighth number of its record (world/layout.js) is how many times longer again than
// its kind's the stretch is over which it turns into its next level. Flat ground lays the plants of that
// stretch one behind another in a thin strip of the frame; a slope that faces the walker stands them one
// above another all the way up it, and the same change shows several times as much there. A plant whose
// number is 0, which is every plant of the old terrace, is packed by the arithmetic it always was.
// The wind can move a vertex a quarter of a metre (forestWorld in light/shared.js).
// Leave twice that on the single-plant bounds used at a frustum edge.
const STRAY = 0.5;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0), _cellCentre = new THREE.Vector3();
const byDistance = (a, b) => a.d - b.d;

// How far a kind's geometry reaches from its root at scale 1: sideways, down and up. The roots count as
// well as the positions: between two levels a vertex is somewhere on the way to its root.
function extent(geometries) {
  let spread = 0, low = 0, high = 0;
  for (const geometry of geometries) {
    for (const name of ['position', 'aRoot']) {
      const attribute = geometry.getAttribute(name);
      if (!attribute) continue;
      for (let i = 0; i < attribute.count; i += 1) {
        const x = attribute.getX(i), y = attribute.getY(i), z = attribute.getZ(i);
        spread = Math.max(spread, x * x + z * z);
        low = Math.min(low, y); high = Math.max(high, y);
      }
    }
  }
  return { spread: Math.sqrt(spread), low, high };
}

// One kind of plant: every instance of it, bucketed into ground cells, with one
// instanced mesh per detail level for its wood and one for its foliage. Each frame
// the visible instances are packed into the levels they belong to.
export class InstanceSet {
  // `hand` and `tail` are how much of the foliage's hand-over stretches, and of the stretch between `max`
  // and `gone`, this device uses (budget.js).
  constructor({ archetype, records, materials, scene, hand = 1, tail = 1, slope = null }) {
    this.name = archetype.name;
    this.projectedShade = !!archetype.shade;
    this.lod = archetype.lod;
    this.max = archetype.max;
    this.gone = archetype.max + (archetype.gone - archetype.max) * tail;
    if (!(this.gone > this.max)) throw new Error(`${archetype.name} needs a distance to be gone by, beyond the ${archetype.max} m it is drawn whole to`);
    const n = this.count = records.length / RECORD;

    // sort by cell so a culled cell skips a contiguous run
    const order = Array.from({ length: n }, (_, i) => i);
    const cellOf = (i) => Math.floor(records[i * RECORD] / CELL) * 4096 + Math.floor(records[i * RECORD + 2] / CELL);
    order.sort((a, b) => cellOf(a) - cellOf(b));

    this.matrix = new Float32Array(n * 16);
    this.extra = new Float32Array(n * 4);
    this.pos = new Float32Array(n * 3);
    this.scale = new Float32Array(n);                 // each plant's scale, for how far it reaches
    this.late = null;                                 // each plant's lateness, if any plant of this kind has one
    this.tilt = slope ? new Float32Array(n) : null;   // how steeply the ground lies under each plant of a kind that lies as the ground does
    this.cells = [];
    this.visible = [];
    let cell = null;
    order.forEach((src, i) => {
      const o = src * RECORD;
      _p.set(records[o], records[o + 1], records[o + 2]);
      _q.setFromAxisAngle(_up, records[o + 3]);
      _s.setScalar(records[o + 4]);
      _m.compose(_p, _q, _s).toArray(this.matrix, i * 16);
      if (slope) {
        // What lies on the ground lies as the ground does: it is sheared by the ground's slope under it, so
        // that a knot of stones a stride across neither floats on the low side of a bank nor is buried on the high.
        const [gx, gz] = slope(records[o], records[o + 2]), m = this.matrix, b = i * 16;
        m[b + 1] += gx * m[b] + gz * m[b + 2];
        m[b + 9] += gx * m[b + 8] + gz * m[b + 10];
        this.tilt[i] = Math.hypot(gx, gz);
      }
      this.extra.set([records[o + 5], records[o + 6], 1, 1], i * 4);             // phase, tint, and a plant at rest and whole
      this.pos.set([_p.x, _p.y, _p.z], i * 3);
      this.scale[i] = records[o + 4];
      const late = records[o + 7];
      if (late > 0) (this.late = this.late || new Float32Array(n))[i] = late;
      const id = cellOf(src);
      if (!cell || cell.id !== id) {
        cell = { id, start: i, count: 0, x: (Math.floor(_p.x / CELL) + 0.5) * CELL, z: (Math.floor(_p.z / CELL) + 0.5) * CELL, y: _p.y, low: _p.y, high: _p.y, late: 0, big: 0 };
        this.cells.push(cell);
      }
      cell.count += 1;
      if (records[o + 4] > cell.big) cell.big = records[o + 4];        // the largest plant in it
      if (late > cell.late) cell.late = late;         // the latest plant in it: until that one is over, the cell is not at rest
      cell.low = Math.min(cell.low, _p.y); cell.high = Math.max(cell.high, _p.y);
    });
    // a cell's own stretch of the buffers, for copying it whole
    for (const c of this.cells) {
      c.matrix = this.matrix.subarray(c.start * 16, (c.start + c.count) * 16);
      c.extra = this.extra.subarray(c.start * 4, (c.start + c.count) * 4);
    }
    const half = archetype.height * 1.3 / 2;
    // A cell is culled as a sphere. It has to cover what its plants reach sideways (a lying
    // log, half its length) and the rise and fall of the ground across the cell (2 m).
    const reach = archetype.reach ?? Math.max(2.5, archetype.height * 0.25);
    this.cellRadius = Math.hypot(CELL * 0.71 + reach, half + 2);
    this.cellLift = half;
    // what one plant of this kind reaches, measured on every level it is drawn at
    this.span = extent([...(archetype.solid || []), ...(archetype.foliage || []), ...(archetype.limbs || [])].filter(Boolean));
    // That sphere stands on the cell's first plant, and holds for plants within a few metres of its height. A
    // cell whose plants stand over a greater range of heights than that (what hangs from the limbs of a tree at any
    // height, what is set on a snag, a cell on a ravine's side) is given a sphere of its own, round the middle of
    // its range, that holds all of it by what a plant of the kind was measured to reach. (Culled by the first
    // plant's sphere, a lichen 25 m up a spruce went with the cell while it was in view: found by a review.)
    for (const c of this.cells) {
      const range = c.high - c.low;
      if (range <= 4) { c.cy = c.y + this.cellLift; c.r = this.cellRadius; continue; }
      c.cy = (c.low + c.high) / 2 + ((this.span.low + this.span.high) / 2) * c.big;
      c.r = Math.hypot(CELL * 0.71 + Math.max(reach, this.span.spread * c.big), range / 2 + ((this.span.high - this.span.low) / 2) * c.big + 2);
    }

    // Wood and foliage each have their own levels and their own instance buffers: a tree's crown is
    // still turning into the next level long after its trunk has. `cross[i]` says level i and level
    // i + 1 are both drawn while they hand over (foliage only: a trunk never mixes with a trunk).
    // `add(li)` lists what level li draws: [geometry, material, draw order, whether it is wood].
    // `lod` is the distances at which the part's levels end. A kind gives one list for both parts, unless its
    // foliage has fewer levels than its wood and changes at a distance of its own (`lodLeaf`: plants/alder.js).
    const part = (count, lod, shares, scale, cross, add) => {
      if (!count) return null;
      const share = [(shares?.[0] ?? HAND) * scale, (shares?.[1] ?? HAND) * scale];
      if (lod.length > 1 && lod[0] * (1 + share[0]) > lod[1]) throw new Error(`${archetype.name} starts its second hand-over before the first is done`);
      const levels = Array.from({ length: count }, (_, li) => {
        // a plant in a cross-over occupies two levels, but never the same level twice
        const matrix = new THREE.InstancedBufferAttribute(new Float32Array(n * 16), 16).setUsage(THREE.DynamicDrawUsage);
        const extra = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
        const meshes = [];
        for (const [geometry, material, order, solid] of add(li)) {
          geometry.setAttribute('aInst', extra);
          const mesh = new THREE.InstancedMesh(geometry, material, 1);
          mesh.instanceMatrix = matrix;
          mesh.frustumCulled = false;
          mesh.matrixAutoUpdate = false;
          mesh.renderOrder = order;
          if (solid) mesh.layers.enable(SOLID_LAYER);
          meshes.push(mesh);
          scene.add(mesh);
        }
        return { matrix, extra, meshes, used: 0 };
      });
      return { levels, share, cross: cross || [], lod };
    };
    // Draw order: wood, then foliage with the nearest level and the nearest kinds
    // first, then the ground (order 8, set by the forest). This GPU can only skip
    // a pixel that something nearer has already covered, and it cannot tell that a
    // cut-out card covers one until the card has been shaded.
    this.wood = part(archetype.solid?.length, this.lod, archetype.handWood ?? [HAND_WOOD, HAND_WOOD], 1, null, (li) => {
      const draws = [[archetype.solid[li], materials.solid, li / 10, true]];
      // a stone's shadow on the ground (plants/stones.js): it darkens what lies there, so it is drawn after all of it
      if (archetype.shade?.[li]) draws.push([archetype.shade[li], materials.shade, 9, true]);
      return draws;
    });
    this.leaf = part(archetype.foliage?.length, archetype.lodLeaf ?? this.lod, archetype.hand, hand, archetype.cross, (li) => {
      const rank = li + (archetype.order || 0) / 100, geometry = archetype.foliage[li], draws = [];
      if (archetype.limbs?.[li]) draws.push([archetype.limbs[li], materials.solid, li / 10, true]);      // limbs go when their boughs do
      if (materials.foliageDepth) draws.push([geometry, materials.foliageDepth, 2 + rank / 10, false]);
      draws.push([geometry, materials.foliage, 3 + rank, false]);
      return draws;
    });
    this.parts = [this.wood, this.leaf].filter(Boolean);
    if (this.late && this.parts.some((p) => p.lod.length !== 1)) throw new Error(`${archetype.name} has late plants, and only a kind with two detail levels can`);
    this.levels = this.parts.flatMap((p) => p.levels);            // every level of every part, for the budget's count
  }

  // Pack visible instances into their detail levels. `eye` is where distances are
  // measured from: the camera, except in the pop check. `zoom` is 1 at the normal
  // field of view and shrinks with a telephoto view, so a close-up pulls detail in.
  // It pulls the limit in too: a plant's distance for `max` and `gone` is the distance
  // as seen. By the true distance, the sorrel round a thrush 25 m away was part-size
  // or missing in a close-up of the thrush.
  // Cells crossing a frustum plane get a finer test against each plant's upright
  // bounds, including its roots, sway and ground shear. Cells wholly in view can
  // still copy a level at once. The close-up check sets each=false for its reference.
  update(eye, frustum, zoom, lodScale, each = true) {
    const { matrix, extra, pos, parts, scale, span, late, tilt } = this;
    const planes = frustum.planes;
    const cx = eye.x, cy = eye.y, cz = eye.z;
    const full = this.max, gone = this.gone;
    // What the vertex shader is told (forestPlace in light/shared.js): `still`, which is 1 for a plant at
    // rest in its level and falls to 0 as it turns into the next, and `size`, its share of its own size
    // at its limit.
    const put = (level, i, still, size) => {
      const k = level.used, dst = level.matrix.array, a = k * 16, b = i * 16;
      for (let j = 0; j < 16; j += 1) dst[a + j] = matrix[b + j];
      const ext = level.extra.array;
      ext[k * 4] = extra[i * 4]; ext[k * 4 + 1] = extra[i * 4 + 1]; ext[k * 4 + 2] = still; ext[k * 4 + 3] = size;
      level.used = k + 1;
    };
    for (const p of parts) {
      for (const level of p.levels) level.used = 0;
      p.d0 = (p.lod[0] ?? Infinity) * lodScale; p.d1 = (p.lod[1] ?? Infinity) * lodScale;        // where each level ends
      p.e0 = p.d0 * (1 + p.share[0]); p.e1 = p.d1 * (1 + p.share[1]);      // where each hand-over is done
    }
    // the cells in view, nearest first, so each mesh draws roughly front to back
    const visible = this.visible;
    visible.length = 0;
    for (const cell of this.cells) {
      _cellCentre.set(cell.x, cell.cy, cell.z);
      cell.d = Math.hypot(cell.x - cx, cell.z - cz);
      if ((cell.d - this.cellRadius) * zoom > gone) continue;
      // Interior cells still copy as one block. At the silhouette only test the planes that
      // cut the cell, so the GPU can skip individual plants outside the viewport.
      let mask = 0, outside = false;
      for (let k = 0; k < 6; k++) {
        const d = planes[k].distanceToPoint(_cellCentre);
        if (d < -cell.r) { outside = true; break; }
        if (d < cell.r) mask |= 1 << k;
      }
      if (outside) continue;
      // A stone's shadow can extend past its measured mesh at low sun.
      cell.clip = each && !this.projectedShade ? mask : 0;
      visible.push(cell);
    }
    visible.sort(byDistance);
    const HALF = CELL * 0.7072;                                                // from a cell's middle to its corner
    let drawn = 0;
    for (const cell of visible) {
      // Most cells hold plants that are all at rest in one level, and whole: such a cell is copied in one
      // piece. `near` and `far` bound how far from the eye any plant in the cell can stand.
      const near = Math.max(0, cell.d - HALF), far = Math.hypot(cell.d + HALF, Math.max(Math.abs(cell.low - cy), Math.abs(cell.high - cy)));
      const a = near * zoom, b = far * zoom, whole = b <= full;
      for (const p of parts) {
        const levels = p.levels, last = levels.length - 1, d0 = p.d0, d1 = p.d1;
        let rest = -1;                                                         // the one level every plant here rests in, if there is one
        if (!whole) rest = -1;
        else if (last === 0 || b < d0) rest = 0;
        else if (a >= (cell.late ? d0 + (p.e0 - d0) * (1 + cell.late) : p.e0) && (last === 1 || b < d1)) rest = 1;
        else if (last === 2 && a >= p.e1) rest = 2;
        if (rest >= 0 && !cell.clip) {
          const level = levels[rest];
          level.matrix.array.set(cell.matrix, level.used * 16);
          level.extra.array.set(cell.extra, level.used * 4);
          level.used += cell.count;
          if (p === parts[0]) drawn += cell.count;
          continue;
        }
        for (let i = cell.start, end = cell.start + cell.count; i < end; i += 1) {
          const dx = pos[i * 3] - cx, dy = pos[i * 3 + 1] - cy, dz = pos[i * 3 + 2] - cz;
          if (cell.clip) {
            const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], s = scale[i];
            // a plant that lies as the ground does is sheared by the ground's slope (above): an end of it stands
            // that much higher, and the other that much lower, than its geometry says (a drift log 12 m long, on a bank)
            const lift = tilt ? tilt[i] * span.spread * s : 0;
            const low = y + span.low * s - lift, high = y + span.high * s + lift, r = span.spread * s + STRAY;
            let k = 0;
            for (; k < 6; k += 1) {
              if (!(cell.clip & (1 << k))) continue;
              const n = planes[k].normal;                                        // it points into the view
              if (n.x * x + n.z * z + planes[k].constant + n.y * (n.y > 0 ? high : low) < -r) break;
            }
            if (k < 6) continue;
          }
          const e = Math.sqrt(dx * dx + dy * dy + dz * dz) * zoom;               // how far off it is, as seen
          let size = 1;
          if (e > full) {
            const ends = gone - (gone - full) * SPREAD * (extra[i * 4] * 0.159155);        // the plant's phase, as a number in 0..1 of its own
            size = (ends - e) / (ends - full);
            if (size < LEAST) continue;
          }
          if (p === parts[0]) drawn += 1;
          let li, m = 0;                                                       // the level it is, and how far over to the next
          const e0 = late && late[i] ? d0 + (p.e0 - d0) * (1 + late[i]) : p.e0;  // where its first hand-over is done
          if (last === 0 || e < d0) li = 0;
          else if (e < e0) { li = 0; m = (e - d0) / (e0 - d0); }
          else if (last === 1 || e < d1) li = 1;
          else if (e < p.e1) { li = 1; m = (e - d1) / (p.e1 - d1); }
          else li = 2;
          // Where the next level is this one in fewer pieces, this one is drawn alone, turning into it over
          // the whole stretch. Where it is another thing, both are drawn: this one holds for the first third
          // and then shrinks away, the next grows from nothing and is whole by two thirds.
          if (m === 0) put(levels[li], i, 1, size);
          else if (p.cross[li]) { put(levels[li], i, 1 - m, size); put(levels[li + 1], i, m, size); }
          else put(levels[li], i, 0.65 * (1 - m), size);
        }
      }
    }
    this.drawn = drawn;                                                        // plants, each counted once however many levels it is in
    for (const level of this.levels) {
      const used = level.used;
      for (const mesh of level.meshes) { mesh.count = used; mesh.visible = used > 0; }
      if (!used) continue;
      level.matrix.clearUpdateRanges(); level.matrix.addUpdateRange(0, used * 16); level.matrix.needsUpdate = true;
      level.extra.clearUpdateRanges(); level.extra.addUpdateRange(0, used * 4); level.extra.needsUpdate = true;
    }
  }
}

// Every stem of a kind as one static instanced mesh on the caster layer, at the
// coarsest level. Drawn only when the sun's shadow map is refreshed.
export function buildCasters(archetype, records, material) {
  const geometry = archetype.solid[archetype.solid.length - 1];
  const n = records.length / RECORD;
  const mesh = new THREE.InstancedMesh(geometry, material, n);
  for (let i = 0; i < n; i += 1) {
    const o = i * RECORD;
    _p.set(records[o], records[o + 1], records[o + 2]);
    _q.setFromAxisAngle(_up, records[o + 3]);
    _s.setScalar(records[o + 4]);
    mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.layers.set(CASTER_LAYER);
  return mesh;
}
