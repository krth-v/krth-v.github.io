import * as THREE from 'three';
import { WORLD, LEGACY, createLand, creek as creekAt } from './land.js';

// The forest's footprint in metres (land.js says how it lies). +x and -z are the axes solar.js uses for
// the sun, so cfg.sunDir can be used without conversion.
export { WORLD, LEGACY };

function hash(ix, iz, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed + 1, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Smooth value noise in [0, 1). Deterministic for a seed.
export function makeNoise(seed) {
  return (x, z) => {
    const ix = Math.floor(x), iz = Math.floor(z);
    const fx = x - ix, fz = z - iz;
    const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
    const a = hash(ix, iz, seed), b = hash(ix + 1, iz, seed);
    const c = hash(ix, iz + 1, seed), d = hash(ix + 1, iz + 1, seed);
    return a + (b - a) * ux + (c - a) * uz + (a - b - c + d) * ux * uz;
  };
}

// The ground's mesh is a few rectangular sheets of different fineness, drawn as one. The old terrace keeps
// the 2 m lattice it always had (the scene approved at checkpoint 1 stands on it, and what stands on the
// ground was put at the ground's own height). A 1 m sheet is let into it for what the walk goes down to: the
// creek and its ravine, the old clearing's hummocks, the river's bend with its bank and its cobbles. The
// river's long reach, seen from the bank and the window, gets a 2 m sheet; the rest of the valley, across
// the river or far up it, gets 4 m.
const range = (from, to, step) => { const out = []; for (let v = from; v < to - 1e-9; v += step) out.push(v); out.push(to); return out; };
export const FINE = { minX: -100, maxX: -10, minZ: -124, maxZ: 46 };      // whole ground cells of the old lattice
const REACH = { minX: -184, maxX: -40, minZ: -420, maxZ: LEGACY.minZ };       // whole cells of the 4 m lattice it is let into
// under: the coarser sheets a sheet's rim runs along, whose surface its rim vertices are set on.
// beside: sheets of the same fineness it meets edge to edge, where both keep the ground's own height.
const SHEETS = [
  { name: 'old', xs: range(LEGACY.minX, LEGACY.maxX, 2), zs: range(LEGACY.minZ, LEGACY.maxZ, 2), hole: FINE, under: ['up', 'down'], beside: ['reach'] },
  { name: 'creek', xs: range(FINE.minX, FINE.maxX, 1), zs: range(FINE.minZ, FINE.maxZ, 1), under: ['old'], conform: true },
  // up-valley of the old world. It stops at x = 100: east of that the old world ended in open air at its edge,
  // the views approved at checkpoint 1 look that way, and they are to stay as they were
  { name: 'up', xs: range(WORLD.minX, 100, 4), zs: range(WORLD.minZ, LEGACY.minZ, 4), hole: REACH, under: [] },
  { name: 'reach', xs: range(REACH.minX, REACH.maxX, 2), zs: range(REACH.minZ, REACH.maxZ, 2), under: ['up'], beside: ['old'] },
  { name: 'down', xs: range(WORLD.minX, LEGACY.minX, 4), zs: range(LEGACY.minZ, LEGACY.maxZ, 4), under: [] },          // down-valley of it
];

export function createTerrain(seed = 7) {
  const broad = makeNoise(seed), mid = makeNoise(seed + 11), fine = makeNoise(seed + 23);
  // The old terrace: a gentle floor with the pit-and-mound relief old tip-ups leave behind.
  const base = (x, z) =>
    4.4 * (broad(x / 70, z / 70) - 0.5) + 0.9 * (mid(x / 22, z / 22) - 0.5) + 0.25 * (fine(x / 5, z / 5) - 0.5);
  const land = createLand(base, makeNoise(seed + 41));
  // Where the trail goes down or up a slope it is cut into it (trail.js hands the cut over once it knows its own line).
  let cut = null;
  const natural = land.heightAt;
  const heightAt = (x, z) => { const h = natural(x, z); return cut ? cut(x, z, h) : h; };

  // (built in steps where the forest is built in steps: js/forest/index.js; otherwise all at once, when first asked for)
  function build() { const steps = buildSteps(); for (;;) { const { done, value } = steps.next(); if (done) return value; } }
  function* buildSteps() {
    const byName = Object.fromEntries(SHEETS.map((s) => [s.name, s]));
    const within = (s, x, z) => x >= s.xs[0] && x <= s.xs[s.xs.length - 1] && z >= s.zs[0] && z <= s.zs[s.zs.length - 1];
    const find = (a, v) => { let lo = 0, hi = a.length - 2; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m] <= v) lo = m; else hi = m - 1; } return lo; };
    // The height of a coarser sheet's own surface along one of its cell edges: between two of its corners, a straight line.
    const onSheet = (s, x, z) => {
      const i = find(s.xs, x), j = find(s.zs, z);
      const u = (x - s.xs[i]) / (s.xs[i + 1] - s.xs[i]), v = (z - s.zs[j]) / (s.zs[j + 1] - s.zs[j]);
      const h = (a, b) => heightAt(s.xs[a], s.zs[b]);
      if (u < 1e-9) return h(i, j) + (h(i, j + 1) - h(i, j)) * v;
      if (u > 1 - 1e-9) return h(i + 1, j) + (h(i + 1, j + 1) - h(i + 1, j)) * v;
      if (v < 1e-9) return h(i, j) + (h(i + 1, j) - h(i, j)) * u;
      return h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * u;
    };
    // The creek's bed is a metre or two across, and so is a cell of its sheet: left on the lattice, the bed came
    // out as a notch of whatever depth the nearest vertices happened to catch, and the water lay under the ground
    // as often as on it. A vertex within half a metre of the bed's edge is moved onto it, so that both edges of
    // the bed are lines of the mesh and the bed between them is flat.
    const _c = [0, 0, 0, 0, 0], _d = [0, 0, 0, 0, 0];
    const toBank = (x, z) => {
      creekAt(x, z, _c);
      const off = _c[0] - _c[2];                                    // metres outside the bed's edge
      if (Math.abs(off) >= 0.5) return [x, z];
      const e = 0.05, gx = creekAt(x + e, z, _d)[0] - creekAt(x - e, z, _d)[0], gz = creekAt(x, z + e, _d)[0] - creekAt(x, z - e, _d)[0], g = Math.hypot(gx, gz);
      return g < 1e-6 ? [x, z] : [x - (gx / g) * off, z - (gz / g) * off];
    };
    const position = [], normal = [], uv = [], ground = [], index = [], paint = [0, 0, 0, 0];
    for (const s of SHEETS) {
      const nx = s.xs.length - 1, nz = s.zs.length - 1, first = position.length / 3;
      if (s.conform) lattice = { minX: s.xs[0], minZ: s.zs[0], nx, nz, first };
      for (let j = 0; j <= nz; j += 1) {
        if (j % 24 === 23) yield `ground: ${s.name}`;
        for (let i = 0; i <= nx; i += 1) {
          const inner = i > 0 && i < nx && j > 0 && j < nz;
          const [x, z] = s.conform && inner ? toBank(s.xs[i], s.zs[j]) : [s.xs[i], s.zs[j]];
          // A vertex on a sheet's rim, where a coarser sheet runs alongside, lies on that sheet's surface: left at
          // its own height it would stand off the coarser edge, and the gap between the two is a slit of sky.
          let y = heightAt(x, z);
          if (!inner && !(s.beside || []).some((name) => within(byName[name], x, z))) {
            for (const name of s.under) { const below = byName[name]; if (within(below, x, z)) { y = onSheet(below, x, z); break; } }
          }
          const dx = heightAt(x + 0.5, z) - heightAt(x - 0.5, z);
          const dz = heightAt(x, z + 0.5) - heightAt(x, z - 0.5);
          const inv = 1 / Math.hypot(dx, 1, dz);
          position.push(x, y, z);
          normal.push(-dx * inv, inv, -dz * inv);
          uv.push(x * 0.25, z * 0.25);
          land.paint(x, z, paint);
          // where the trail is cut into a slope, the bank above it and the fill below are bare earth
          if (cut) paint[2] = Math.max(paint[2], Math.min(1, Math.abs(heightAt(x, z) - natural(x, z)) / 0.5));
          ground.push(paint[0], paint[1], paint[2], paint[3]);
        }
      }
      for (let j = 0; j < nz; j += 1) {
        for (let i = 0; i < nx; i += 1) {
          if (s.hole && s.xs[i] >= s.hole.minX && s.xs[i + 1] <= s.hole.maxX && s.zs[j] >= s.hole.minZ && s.zs[j + 1] <= s.hole.maxZ) continue;
          const a = first + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
          index.push(a, c, b, b, c, d);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    geometry.setAttribute('aGround', new THREE.BufferAttribute(new Float32Array(ground), 4));        // what the floor is painted as (land.js paint)
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(index), 1));
    return geometry;
  }

  let geometry = null, lattice = null;                  // lattice: where the fine sheet's vertices are in the mesh, for surfaceAt
  // The height of the ground's own mesh at (x, z), where the fine sheet lies: its triangles are flat, and
  // where the creek's bed turns from a fall into a pool they stand a hand above the bed they are drawn from.
  // What must lie on the ground there (the creek's water) asks this, not heightAt. Elsewhere it is heightAt.
  function surfaceAt(x, z) {
    const p = (geometry || (geometry = build())).getAttribute('position').array;
    const { minX, minZ, nx, nz, first } = lattice;
    const ci = Math.floor(x - minX), cj = Math.floor(z - minZ);                           // the fine sheet's cells are a metre
    if (ci < -1 || cj < -1 || ci > nx || cj > nz) return heightAt(x, z);
    // a vertex may have been moved half a metre onto the creek's bank: the triangle that holds (x, z) is this cell's or a neighbour's
    for (let j = Math.max(0, cj - 1); j <= Math.min(nz - 1, cj + 1); j += 1) {
      for (let i = Math.max(0, ci - 1); i <= Math.min(nx - 1, ci + 1); i += 1) {
        const a = first + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
        for (const [u, v, w] of [[a, c, b], [b, c, d]]) {
          const ux = p[u * 3], uz = p[u * 3 + 2], vx = p[v * 3] - ux, vz = p[v * 3 + 2] - uz, wx = p[w * 3] - ux, wz = p[w * 3 + 2] - uz;
          const area = vx * wz - vz * wx;
          if (Math.abs(area) < 1e-9) continue;
          const s = ((x - ux) * wz - (z - uz) * wx) / area, t = ((z - uz) * vx - (x - ux) * vz) / area;
          if (s >= -1e-6 && t >= -1e-6 && s + t <= 1 + 1e-6) return p[u * 3 + 1] + s * (p[v * 3 + 1] - p[u * 3 + 1]) + t * (p[w * 3 + 1] - p[u * 3 + 1]);
        }
      }
    }
    return heightAt(x, z);
  }
  // How the ground's own mesh slopes round (x, z): what it rises in a metre towards +x and towards +z, taken
  // over a stride. A bank steeper than `most` is taken for that steep: what lies on it is not stood on end.
  function slopeAt(x, z, reach = 0.4, most = 0.7) {
    const gx = (surfaceAt(x + reach, z) - surfaceAt(x - reach, z)) / (2 * reach), gz = (surfaceAt(x, z + reach) - surfaceAt(x, z - reach)) / (2 * reach);
    const steep = Math.hypot(gx, gz), ease = steep > most ? most / steep : 1;
    return [gx * ease, gz * ease];
  }
  return {
    heightAt, base, natural, land, surfaceAt, slopeAt,
    cutBy(fn) { cut = fn; geometry = null; },
    get geometry() { return geometry || (geometry = build()); },
    *grow() { if (!geometry) geometry = yield* buildSteps(); },
  };
}
