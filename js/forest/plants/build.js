import * as THREE from 'three';

// Accumulates one plant's triangles. Solid parts (trunks, limbs) and cut-out
// cards (boughs, fronds, leaves) are built separately because they are drawn
// by different materials.
//
// Nothing changes detail by switching. Every vertex has a root: where it lies when its plant has gone
// over to the next coarser detail level. Between two levels a plant is drawn with each vertex part of
// the way to its root (forestPlace in light/shared.js), and at the end of that stretch it is the coarser
// level, so the swap shows nothing. A bough the coarser level keeps has its roots on that level's bough;
// one it drops has them at its own foot, and shrinks into the limb. A trunk has them on the coarser
// trunk's surface; a limb that goes has them on its own centre line, and thins to nothing.
export class Mesh {
  // wind holds two numbers a vertex. On a card: how freely it moves, and a variation.
  // Wood does not move, and uses them for split wood (plants/deadwood.js).
  constructor() { this.position = []; this.normal = []; this.uv = []; this.wind = []; this.root = []; this.index = []; }

  get vertexCount() { return this.position.length / 3; }

  // A tube through `points` (THREE.Vector3) with a radius at each. uv.x runs
  // `around` times round the tube, uv.y is distance along it divided by `tile`.
  // `flare(t, ring)` swells a ring into `lobes` buttresses; `shape(t, angle)`
  // scales the radius freely, for girth that is not round. Returns the index of
  // its first vertex: ring j starts at that plus j * (radial + 1).
  // The roots are the vertices themselves, so the tube stays as it is, unless `drop`
  // says the next coarser level has no such tube: then they are its centre line. A tube
  // that the coarser level has in fewer sides is settled onto that one (`settle`).
  tube(points, radii, radial, { around = 1, tile = 1, lobes = 0, flare = null, shape = null, drop = false } = {}) {
    const base = this.vertexCount, n = points.length;
    const tangent = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(), ref = new THREE.Vector3();
    let along = 0;
    for (let j = 0; j < n; j += 1) {
      if (j > 0) along += points[j].distanceTo(points[j - 1]);
      tangent.subVectors(points[Math.min(j + 1, n - 1)], points[Math.max(j - 1, 0)]).normalize();
      ref.set(0, 0, 1); if (Math.abs(tangent.z) > 0.9) ref.set(1, 0, 0);
      side.crossVectors(tangent, ref).normalize();
      up.crossVectors(side, tangent).normalize();
      for (let i = 0; i <= radial; i += 1) {
        const th = (i / radial) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        let r = radii[j];
        if (flare) r *= 1 + flare(j / (n - 1), j) * (0.7 + 0.3 * Math.sin(th * lobes + 1.3));
        if (shape) r *= shape(j / (n - 1), th);
        const dx = side.x * c + up.x * s, dy = side.y * c + up.y * s, dz = side.z * c + up.z * s;
        const x = points[j].x + dx * r, y = points[j].y + dy * r, z = points[j].z + dz * r;
        this.position.push(x, y, z);
        if (drop) this.root.push(points[j].x, points[j].y, points[j].z); else this.root.push(x, y, z);
        this.normal.push(dx, dy, dz);
        this.uv.push((i / radial) * around, along / tile);
        this.wind.push(0, 0);
      }
    }
    for (let j = 0; j < n - 1; j += 1) {
      for (let i = 0; i < radial; i += 1) {
        const p = base + j * (radial + 1) + i, q = p + radial + 1;
        this.index.push(p, q, p + 1, p + 1, q, q + 1);
      }
    }
    return base;
  }

  // A card: `origin` is the middle of its attached edge, `along` runs to the
  // tip (full length), `across` is the full width. `cell` is [u0, v0, u1, v1]
  // in the sheet. Every vertex takes `normal` (the plant's hull normal there),
  // so a crown shades as one mass. `segments` > 1 lets the card bend by `sag`.
  // The painting runs along u in its cell unless `upright`, when it runs along v.
  // `becomes` is the same card as the next coarser level lays it, from the same origin:
  // { along, across, sag, segments }. The roots then lie on that card. Without it the
  // coarser level has no such card, and the roots are the origin: the card shrinks into its foot.
  // `root` is that foot where it is not the origin: a card that hangs from a twig along its upper edge
  // is attached at the twig, and its origin, the middle of its first edge, is in the air below.
  card(origin, along, across, cell, normal, { sway = [0.2, 1], variation = 0, segments = 1, sag = null, upright = false, becomes = null, root = null } = {}) {
    const foot = root || origin;
    const [u0, v0, u1, v1] = cell;
    // the coarser card's spine is straight between its own rows: where on it a share t of the way along falls
    const spine = (t, k) => {
      const n = becomes.segments || 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i;
      const at = (q) => origin.getComponent(k) + becomes.along.getComponent(k) * q + (becomes.sag ? becomes.sag.getComponent(k) * q * q : 0);
      const a = at(i / n);
      return a + (at((i + 1) / n) - a) * f;
    };
    for (let s = 0; s <= segments; s += 1) {
      const t = s / segments;
      const cx = origin.x + along.x * t + (sag ? sag.x * t * t : 0);
      const cy = origin.y + along.y * t + (sag ? sag.y * t * t : 0);
      const cz = origin.z + along.z * t + (sag ? sag.z * t * t : 0);
      const u = u0 + (u1 - u0) * t, w = sway[0] + (sway[1] - sway[0]) * t;
      this.position.push(cx - across.x / 2, cy - across.y / 2, cz - across.z / 2, cx + across.x / 2, cy + across.y / 2, cz + across.z / 2);
      if (becomes) {
        const bx = spine(t, 0), by = spine(t, 1), bz = spine(t, 2), wide = becomes.across;
        this.root.push(bx - wide.x / 2, by - wide.y / 2, bz - wide.z / 2, bx + wide.x / 2, by + wide.y / 2, bz + wide.z / 2);
      } else this.root.push(foot.x, foot.y, foot.z, foot.x, foot.y, foot.z);
      this.normal.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z);
      if (upright) { const v = v0 + (v1 - v0) * t; this.uv.push(u0, v, u1, v); } else this.uv.push(u, v0, u, v1);
      this.wind.push(w, variation, w, variation);
      if (s < segments) {
        const b = this.vertexCount - 2;
        this.index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
  }

  // A crown painted whole, on a card through the trunk (plants/spire.js). `foot` is the middle of the painted
  // cell's lower edge, `up` runs to the middle of its upper edge and `across` is the cell's full width. `rows`
  // are [share of the way up, half-width as a share of half the cell's]: the card's outline, so that it covers
  // little more of the cell than is painted (a cut-out card is paid for by the pixel, painted or not). Three
  // vertices to a row: the outline's two and the middle. The vertices are their own roots: the card is the same
  // in every level and never moves between them. They are marked whole, by a freedom in the wind given below
  // zero, and `normal` holds the card's own flat normal in x and z and, in y, how far out from the middle the
  // vertex is (1 or 0): forestWorld (light/shared.js, AXIS) draws such a card in to the trunk as it turns
  // edge-on to the eye, and lights it as the side of a cone.
  whole(foot, up, across, rows, cell, { sway = [0.05, 0.5], variation = 0 } = {}) {
    const [u0, v0, u1, v1] = cell, base = this.vertexCount;
    const plane = new THREE.Vector3().crossVectors(up, across).setY(0).normalize();
    rows.forEach(([t, half], j) => {
      const loose = -Math.max(1e-3, sway[0] + (sway[1] - sway[0]) * t);
      for (const k of [-1, 0, 1]) {
        const x = foot.x + up.x * t + across.x * 0.5 * half * k, y = foot.y + up.y * t + across.y * 0.5 * half * k, z = foot.z + up.z * t + across.z * 0.5 * half * k;
        this.position.push(x, y, z);
        this.root.push(x, y, z);
        this.normal.push(plane.x, Math.abs(k), plane.z);
        this.uv.push((u0 + u1) / 2 + (u1 - u0) * 0.5 * half * k, v0 + (v1 - v0) * t);
        this.wind.push(loose, variation);
      }
      if (j > 0) {
        const a = base + (j - 1) * 3, b = a + 3;
        this.index.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
      }
    });
  }

  // Roots for a ring of vertices that the next coarser level has in fewer: each goes to the point at its
  // own angle on the line through that level's ring. A ring is { start, radial, shift }: radial + 1
  // vertices from `start`, the last a copy of the first, vertex i standing (i + shift) / radial of a turn round.
  ring(from, onto, to) {
    const pos = onto.position;
    for (let i = 0; i <= from.radial; i += 1) {
      const v = ((i + (from.shift || 0)) / from.radial) * to.radial - (to.shift || 0), whole = Math.floor(v), g = v - whole;
      const a = (to.start + (((whole % to.radial) + to.radial) % to.radial)) * 3, o = (from.start + i) * 3;
      for (let k = 0; k < 3; k += 1) this.root[o + k] = pos[a + k] + (pos[a + 3 + k] - pos[a + k]) * g;
    }
  }

  // Roots for a whole tube that the next coarser level has in fewer rings and sides: each vertex goes to
  // the point at its own angle and its own place along on that level's tube. A tube is { base, radial, at },
  // where `at` gives each ring a number that rises along the tube and means the same in both levels
  // (a height, or a share of the length). The point is on one of the two triangles that tube draws there,
  // not on the curved patch between their four corners: where a buttress swells, a trunk's quad is not flat,
  // and the patch stood up to three centimetres off the surface the plant was about to become.
  settle(from, onto, to) {
    const pos = onto.position, last = to.at.length - 1;
    for (let j = 0; j < from.at.length; j += 1) {
      let k = 0;
      while (k < last - 1 && to.at[k + 1] < from.at[j]) k += 1;
      const span = to.at[k + 1] - to.at[k], f = span > 0 ? Math.min(1, Math.max(0, (from.at[j] - to.at[k]) / span)) : 0;
      for (let i = 0; i <= from.radial; i += 1) {
        const v = (i / from.radial) * to.radial, whole = Math.min(to.radial - 1, Math.floor(v)), g = v - whole;
        // the quad's corners: a and a + 3 on ring k, b and b + 3 on ring k + 1. `tube` cuts it from a + 3 to b.
        const a = (to.base + k * (to.radial + 1) + whole) * 3, b = a + (to.radial + 1) * 3, o = (from.base + j * (from.radial + 1) + i) * 3;
        for (let x = 0; x < 3; x += 1) {
          this.root[o + x] = g + f <= 1
            ? pos[a + x] + (pos[a + 3 + x] - pos[a + x]) * g + (pos[b + x] - pos[a + x]) * f
            : pos[b + 3 + x] + (pos[b + x] - pos[b + 3 + x]) * (1 - g) + (pos[a + 3 + x] - pos[b + 3 + x]) * (1 - f);
        }
      }
    }
  }

  geometry() {
    // a vertex pushed without its root would leave that buffer short, and the whole mesh would then draw nothing, without a word
    if (this.root.length !== this.position.length) throw new Error(`a mesh has ${this.position.length / 3} vertices and ${this.root.length / 3} roots`);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.position), 3));
    g.setAttribute('aRoot', new THREE.BufferAttribute(new Float32Array(this.root), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.normal), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uv), 2));
    g.setAttribute('aWind', new THREE.BufferAttribute(new Float32Array(this.wind), 2));
    const Index = this.vertexCount > 65535 ? Uint32Array : Uint16Array;
    g.setIndex(new THREE.BufferAttribute(new Index(this.index), 1));
    return g;
  }
}

// What every tree hands back beside its meshes, so that what stands on a tree, hangs from it or reads its crown
// reaches every kind of tree at once (life/habitat.js, the riders in index.js). All of it is in the plant's own
// space at scale 1, the way it was built (the layout's records stand it in the world).
//   perch   what can be stood on, from the finest level of its wood as built (life/perch.js reads it):
//             form      'standing' (the default: a trunk to climb, boughs to sit on), 'lying' (a log: a bird
//                       is on its back; the readers pass over one that `lies` as the ground does, which is
//                       sheared where it is drawn) or 'stump' (the top of the splinters it ends in)
//             position  the vertices of that level, which the tubes below count into
//             trunk     { base, radial, rings }: the trunk as a tube, ring after ring from its foot up; null if none
//             stubs     [{ base, radial, rings }]: the stubs of broken limbs, a bird on the end of one
//             limbs     { position, tubes: [{ base, radial, rings }] }: limbs a bird can sit along, root to tip;
//                       null if none. `position` is the mesh they were built in (a tree whose limbs are part of
//                       its trunk's mesh gives that mesh's)
//             sprigs    [[x, y, z, ax, ay, az]]: twigs a small bird can sit on, where there is no wood to stand
//                       on (a shrub's or a willow's): a place and the way the twig runs there
//   hang    [[x, y, z]]: places along its limbs that something can hang from (lichen, moss), on the limb's middle
//           line: what hangs is drawn from there down, so the top of it is in the wood
//           a trunk's top is the height of its last ring (life/perch.js `standing`: `heights`), which is
//           what a reader takes for the tree's top; a kind with no trunk (a willow, a vine maple: stems
//           and sprigs only) has `trunk: null` and no top
//   hang    ... and `lichen` (optional, 0 to 1): the share of those places that the long hanging lichen
//           takes, for a kind it grows on (absent: none). The riders in index.js read `hang` and `lichen`
//           for every kind alike; no rider names a kind.
//   crown   { middle: [x, y, z], radius, low }: where its leaves are: their middle, how far they spread from it
//           sideways, and how high the lowest of them is
//   casts   false if it casts no shadow in the sun's map (it casts by its farthest wood otherwise)
//   reach, height  how far it reaches sideways and how tall it is (culling, the layout's rules)
//   bounds  what the instancer culls by: `reach` and `height` above, and how far a plant is drawn (`max`, `gone`)
//   shadow  `casts` above (what casts in the sun's map is each kind's far wood, `solid[last]`), and `lod` /
//           `handWood` / `hand`, where the levels hand over
//   records where each plant of a kind stands (world/layout.js RECORD): x, y, z, yaw, scale, ... A kind that
//           is two plants by where it stands (the valley's `spruce` and `slope`) has its own list, which the
//           readers are given by name (`records(name)` in index.js), never `layout[name]` alone.
// A tube made by Mesh.tube, as `perch` counts it: its first vertex, how many round it, how many rings along it.
export const tubeOf = (tube) => ({ base: tube.base, radial: tube.radial, rings: tube.at.length });
export function perchOf(mesh, { trunk = null, stubs = [], limbs = null, limbMesh = mesh, sprigs = [] } = {}) {
  return { position: mesh.position, trunk: trunk && tubeOf(trunk), stubs: stubs.map(tubeOf),
    limbs: limbs && limbs.length ? { position: limbMesh.position, tubes: limbs.map(tubeOf) } : null, sprigs };
}

// [u0, v0, u1, v1] of cell `i` in a sheet of cols x rows painted top-down.
export function sheetCell(i, [cols, rows]) {
  const c = i % cols, r = Math.floor(i / cols) % rows;
  return [c / cols, 1 - (r + 1) / rows, (c + 1) / cols, 1 - r / rows];
}
