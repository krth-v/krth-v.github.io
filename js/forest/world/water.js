import * as THREE from 'three';
import { SHAPE, river as riverAt } from './land.js';
import { RECORD } from './layout.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// The river and the creek as two sheets of moving water (light/materials.js WATER_FRAG paints them).
// Each vertex carries how deep the water is under it, how broken, how fast, and where it lies along and
// across the stream: the ripples are drawn out along the current by those two, so they follow every bend.
//
// Water is what lies under it and what stands over it. Where it is thin its bed shows through it (the sheets
// are blended over the ground, by how deep the water is); and what a ripple mirrors is found on a map of
// what stands along the river, seen from above (banksMap).

// What stands along the river, from above: how high each spot reaches over the water abreast of it (the
// ground, and the trees on it), and how light its leaves are. WATER_FRAG follows the mirrored ray out across
// it, a dozen steps, and what the ray runs into is what the water shows there: the far bank's trees, or the
// sky. It is 1.3 m to the texel: a crown is five to ten texels across.
//   stands   [{ records, height, radius, shape, leaf }]: a kind's plants (world/layout.js records), how tall
//            and how wide one is at scale 1, 'spire' or 'dome', and how light its leaves are (0 a conifer's, 1 an alder's)
export const BANKS = Object.freeze({ minX: -340, maxX: 0, minZ: -452, maxZ: -40, top: 64, nx: 256, nz: 320 });
export function banksMap(terrain, stands) {
  const { minX, maxX, minZ, maxZ, top, nx, nz } = BANKS, sx = (maxX - minX) / nx, sz = (maxZ - minZ) / nz, r = [0, false, 0, 0, 0];
  // the ground over the water, read every fourth texel and drawn out between: a bank, and the valley's walls
  const C = 4, cx = nx / C, cz = nz / C, coarse = new Float32Array((cx + 1) * (cz + 1));
  for (let j = 0; j <= cz; j += 1) for (let i = 0; i <= cx; i += 1) {
    const x = minX + i * C * sx, z = minZ + j * C * sz;
    coarse[j * (cx + 1) + i] = Math.max(0, terrain.heightAt(x, z) - riverAt(x, z, r)[2]);
  }
  const high = new Float32Array(nx * nz), leaf = new Float32Array(nx * nz).fill(0.45);
  for (let j = 0; j < nz; j += 1) for (let i = 0; i < nx; i += 1) {
    const fx = (i + 0.5) / C, fz = (j + 0.5) / C, i0 = Math.min(cx - 1, Math.floor(fx)), j0 = Math.min(cz - 1, Math.floor(fz)), u = fx - i0, v = fz - j0, o = j0 * (cx + 1) + i0;
    high[j * nx + i] = (coarse[o] * (1 - u) + coarse[o + 1] * u) * (1 - v) + (coarse[o + cx + 1] * (1 - u) + coarse[o + cx + 2] * u) * v;
  }
  // The trees: a conifer is a cone from its top down to its lowest boughs, a broad-leaved tree a dome. The
  // higher of two things at a spot is what a ray meets.
  for (const { records, height, radius, shape, leaf: light } of stands) {
    for (let o = 0; o < records.length; o += RECORD) {
      const x = records[o], z = records[o + 2], scale = records[o + 4];
      if (x < minX - 12 || x > maxX + 12 || z < minZ - 12 || z > maxZ + 12) continue;
      const foot = records[o + 1] - riverAt(x, z, r)[2], tall = height * scale, ci = (x - minX) / sx, cj = (z - minZ) / sz;
      const ri = Math.max(0.75, (radius * scale) / sx), rj = Math.max(0.75, (radius * scale) / sz);
      for (let j = Math.max(0, Math.floor(cj - rj)); j <= Math.min(nz - 1, Math.ceil(cj + rj)); j += 1) {
        for (let i = Math.max(0, Math.floor(ci - ri)); i <= Math.min(nx - 1, Math.ceil(ci + ri)); i += 1) {
          const d = Math.hypot((i + 0.5 - ci) / ri, (j + 0.5 - cj) / rj);
          if (d >= 1) continue;
          const h = foot + tall * (shape === 'dome' ? 1 - 0.5 * d * d : 1 - 0.86 * d), k = j * nx + i;
          if (h > high[k]) { high[k] = h; leaf[k] = light; }
        }
      }
    }
  }
  const data = new Uint8Array(nx * nz * 2);
  for (let k = 0; k < nx * nz; k += 1) { data[k * 2] = Math.round(255 * Math.min(1, high[k] / top)); data[k * 2 + 1] = Math.round(255 * leaf[k]); }
  const texture = new THREE.DataTexture(data, nx, nz, THREE.RGFormat, THREE.UnsignedByteType);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, box: new THREE.Vector4(minX, minZ, 1 / (maxX - minX), 1 / (maxZ - minZ)), top };
}

// Where the river runs over a riffle, in metres down it, and half the riffle's length: a gravel river is
// pools and riffles by turns, a riffle every hundred metres or so for one this wide, and the pools lie in
// the bends. One runs down to the head of the bend the beach lies on, and ends 18 m up the reach from the
// place called river, where the trail meets the water; the next begins where that bend straightens, below
// the creek's mouth.
const RIFFLES = [[20, 13], [130, 14], [250, 15], [408, 13], [478, 12], [620, 14]];
const riffle = (down) => { let most = 0; for (const [at, half] of RIFFLES) { const t = (down - at) / half; if (t > -1 && t < 1) most = Math.max(most, (1 - t * t) * (1 - t * t)); } return most; };

function geometry(position, water, flow, index, air = null) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
  g.setAttribute('aWater', new THREE.BufferAttribute(new Float32Array(water), 3));
  g.setAttribute('aFlow', new THREE.BufferAttribute(new Float32Array(flow), 3));
  g.setAttribute('aAir', new THREE.BufferAttribute(air ? new Float32Array(air) : new Float32Array(position.length / 3), 1));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(index), 1));
  g.computeBoundingSphere();
  return g;
}

// The river: a lattice at the water's own height, kept wherever the ground comes within a hand of it. Its
// edge is where the ground rises through it. It runs on a little past the ground's own edges, so that the
// water does not end in a ruled line where the world does.
export function buildRiver(terrain) {
  const STEP = 2, minX = -334, maxX = -46, minZ = -446, maxZ = -54;      // all of the river that the world holds, and a little past its edges
  const nx = Math.round((maxX - minX) / STEP), nz = Math.round((maxZ - minZ) / STEP);
  const r = [0, false, 0, 0, 0], at = new Int32Array((nx + 1) * (nz + 1)).fill(-1), from = new Float32Array((nx + 1) * (nz + 1));
  const position = [], water = [], flow = [], index = [];
  for (let j = 0; j <= nz; j += 1) for (let i = 0; i <= nx; i += 1) from[j * (nx + 1) + i] = riverAt(minX + i * STEP, minZ + j * STEP, r)[0];
  const vertex = (i, j) => {
    const k = j * (nx + 1) + i;
    if (at[k] >= 0) return at[k];
    const x = minX + i * STEP, z = minZ + j * STEP;
    riverAt(x, z, r);
    const depth = r[2] - terrain.heightAt(x, z), across = (r[0] + SHAPE.HALF) * (r[1] ? -1 : 1);
    // whole and slow in a pool; quick and broken over a riffle, most of all over its shallow sides. (How deep
    // it is at a pixel the shader works out for itself, from how far the pixel lies from the river's middle
    // line: the bed is that line's own section, land.js `valley`, and a depth read off this 2 m lattice drew
    // the water's edge as the lattice.)
    position.push(x, r[2], z);
    water.push(depth, 0.5 * riffle(r[4]) * (1 - 0.45 * Math.min(1, Math.max(0, depth) / SHAPE.BED)), 1.6);
    flow.push(r[4], across, 0);
    return (at[k] = position.length / 3 - 1);
  };
  for (let j = 0; j < nz; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const k = j * (nx + 1) + i;
      if (Math.min(from[k], from[k + 1], from[k + nx + 1], from[k + nx + 2]) > 2.5) continue;       // dry land
      const a = vertex(i, j), b = vertex(i + 1, j), c = vertex(i, j + 1), d = vertex(i + 1, j + 1);
      index.push(a, c, b, b, c, d);
    }
  }
  return geometry(position, water, flow, index);
}

// The creek: a ribbon lying in its bed (terrain.js moves the ground's own vertices onto the bed's edges), a
// hand deep, white where the bed falls away under it. It lies on the ground's own mesh (terrain.surfaceAt),
// which at the foot of a fall stands above the bed it is drawn from: laid on the bed alone, the water went
// under the ground there.
//
// It is three strips. Down to the falls it runs in its gully and out over the rock's ledge (plants/crag.js) to
// the ledge's edge. From the edge it falls: a sheet of its own, on the curve a thing thrown off a ledge takes,
// because a ribbon laid on the ground can only be laid down the ramp the ground's lattice makes of a fall.
// From the foot of the rock it lies in its pool and runs on to the river. The paint is carried along each
// strip at one speed: where the speed changed along a ribbon (it used to, with how broken the water was), the
// paint was drawn out further every second the page stayed open, and after an hour it was static.
export function buildCreek(terrain) {
  const { CREEK, creekAlong, FALLS } = SHAPE, STEP = 0.5, DEEP = SHAPE.CREEK_DEEP, length = creekAlong[creekAlong.length - 1];
  const position = [], water = [], flow = [], index = [], air = [];
  const at = (s) => {                                   // the creek's middle line s metres down it: [x, z, bed, half-width, bank slope]
    let i = 0;
    while (i < CREEK.length - 2 && creekAlong[i + 1] < s) i += 1;
    const t = Math.min(1, Math.max(0, (s - creekAlong[i]) / (creekAlong[i + 1] - creekAlong[i]))), a = CREEK[i], b = CREEK[i + 1];
    return a.map((v, k) => v + (b[k] - v) * t);
  };
  // Where the falls are, in metres down the creek: the bed's own lip, the bed's foot, the edge of the rock the
  // water leaves (a little way on: the rock's face stands in front of the ramp the lattice makes of the drop),
  // and the sill the pool's water stands level with.
  const sLip = creekAlong[FALLS.sill - 3], sFoot = creekAlong[FALLS.sill - 2], sSill = creekAlong[FALLS.sill];
  const sEdge = sFoot + Math.hypot(FALLS.x - CREEK[FALLS.sill - 2][0], FALLS.z - CREEK[FALLS.sill - 2][1]);
  // how broken the water is s metres down: a little wherever it runs over stones, white where its bed falls
  // away. The falls' own drop is left out of it on either side: that water is the falling sheet's.
  const whiteAt = (s) => {
    const upper = s <= sEdge, lo = upper ? 0 : sFoot, hi = upper ? sLip : length;
    const before = at(Math.min(hi, Math.max(lo, s - 0.6))), after = at(Math.max(lo, Math.min(hi, s + 0.6)));
    const run = Math.hypot(after[0] - before[0], after[1] - before[1]);
    const fall = run > 1e-6 ? Math.abs(after[2] - before[2]) / run : 0;      // metres down for each metre along
    return Math.min(1, 0.05 + Math.max(0, (fall - 0.06) / 0.5));
  };
  // One row of the ribbon: its middle and its two edges, `half` either side of (x, z) across the way it runs.
  // (Laid wider than the water at the water's own level, for the bank to rise through it, the ribbon's edge was
  // the ground's mesh's: a ruled line a metre at a time, and a slab of water three metres wide. It keeps inside
  // the water's edge, and the shader breaks its own edge off.)
  //   fresh   the row begins a strip: it is not joined to the row before
  //   lie     false where the water does not lie on the ground at all: over the rock's ledge, in the air, in the pool
  //   whole   how much of its edge the shader may break off, 1 for a creek in its bed; in the pool the water
  //           runs in under the rock all round, and none of it is broken off
  //   deep    how deep it is painted at its middle and its edges
  //   calm    how much of its brokenness its edges have (1: as much as its middle): where the falls come down
  //           into the pool it boils in the middle, and against the rock either side it is only stirred
  let rows = 0;
  const row = (s, x, y, z, tx, tz, half, white, speed, { fresh = false, lie = true, whole = 1, deep = [0.5, 0.14], calm = 1 } = {}) => {
    for (const side of [-1, 0, 1]) {
      const px = x - tz * half * side, pz = z + tx * half * side;
      position.push(px, lie ? Math.max(y, terrain.surfaceAt(px, pz) + 0.03) : y, pz);
      water.push(side === 0 ? deep[0] : deep[1], side === 0 ? white : white * calm, speed);
      flow.push(s, half * side, side * whole);
      // under the trees of the terrace, the ravine and the hill it is dark water; where the swale comes out
      // into the old clearing the sky is on it (land.open is 0.35 under the hill's trees and 0.9 in the clearing)
      air.push(smooth(0.42, 0.8, terrain.land.open(px, pz)));
    }
    if (rows > 0 && !fresh) {
      const o = (rows - 1) * 3;
      index.push(o, o + 1, o + 3, o + 1, o + 4, o + 3, o + 1, o + 2, o + 4, o + 2, o + 5, o + 4);
    }
    rows += 1;
  };
  const SPEED = 1.35, FALLING = 3.4;
  const heading = (s) => { const before = at(Math.max(0, s - 0.6)), after = at(Math.min(length, s + 0.6)), tx = after[0] - before[0], tz = after[1] - before[1], inv = 1 / Math.hypot(tx, tz); return [tx * inv, tz * inv]; };
  // how far the water reaches either side of the creek's middle line s metres down it: over the bed, and a little way up each bank
  const reach = (here) => here[3] + Math.min(0.5, (0.8 * DEEP) / here[4]);

  // ---- from its spring to the edge of the rock
  // It rises as a spring: its head is round, the bed's own round end with the water a little way up the bank
  // all round it. (It used to begin as a point and widen over four metres, a ribbon laid down on the ground.)
  {
    const head = at(0), next = at(0.6), inv = 1 / Math.hypot(next[0] - head[0], next[1] - head[1]), tx = (next[0] - head[0]) * inv, tz = (next[1] - head[1]) * inv;
    const round = reach(head), CAP = 7;
    for (let j = 0; j < CAP; j += 1) {
      const back = round * Math.cos(((j + 0.35) / (CAP + 0.35)) * Math.PI / 2);          // metres upstream of the source: closest set where the head is roundest
      row(-back, head[0] - tx * back, head[2] + DEEP * 0.97, head[1] - tz * back, tx, tz, Math.sqrt(Math.max(0, round * round - back * back)), 0.05, SPEED);
    }
  }
  const NOTCH = 0.55;                                    // half the water's width where it leaves the rock: it draws in to a chute as it nears the edge
  const upper = [];
  for (let s = 0; s < sEdge - 0.3; s += STEP) upper.push(s);
  upper.push(sEdge - 0.15, sEdge);
  let lipLevel = 0, drawn = 0, before = 0;
  for (const s of upper) {
    const here = at(s), [tx, tz] = heading(Math.min(s, sLip)), onRock = smooth(sLip - 0.3, sLip + 0.2, s), near = smooth(sEdge - 1.7, sEdge, s);
    // Over the ledge its bed is the rock's lip, not the bed below the drop. It quickens there and goes glassy: a
    // dark tongue, its strokes drawn out long, that breaks white only in its last hand's breadths. (Broken
    // from a stride back, as a riffle is, the head of the falls seen from the bridge was a speckled tarpaulin.)
    // Its strokes are drawn out by where they lie along it, which is the same every second; drawn out by its
    // speed they would go on drawing out for as long as the page stayed open.
    const bed = s > sLip ? FALLS.top : here[2], white = Math.max(whiteAt(s) * (1 - 0.6 * near), 0.62 * smooth(sEdge - 0.4, sEdge, s));
    const half = reach(at(Math.min(s, sLip))) * (1 - onRock) + (0.8 + (NOTCH - 0.8) * near) * onRock;
    const x = s > sFoot ? FALLS.x - FALLS.down[0] * (sEdge - s) : here[0], z = s > sFoot ? FALLS.z - FALLS.down[1] * (sEdge - s) : here[1];
    drawn += (s - before) * (1 - 0.66 * smooth(sEdge - 1.7, sEdge, (s + before) / 2)); before = s;
    lipLevel = bed + DEEP * (1 - 0.6 * white) * (1 - 0.35 * near);
    // (on the rock its edge is the rock's: none of it is broken off there)
    row(s <= 0 ? s : drawn, x, lipLevel, z, tx, tz, half, white, SPEED, { lie: s <= sLip - 0.3, whole: 1 - 0.7 * onRock, deep: [0.5 + 0.3 * near, 0.14 + 0.3 * near] });
  }

  // ---- the falls: from the rock's edge to the pool, as a thrown thing falls
  const sill = at(sSill), poolLevel = sill[2] + DEEP * (1 - 0.6 * whiteAt(sSill));
  const drop = lipLevel - poolLevel, OFF = 1.4, time = Math.sqrt((2 * drop) / 9.81), throwOut = OFF * time, FALL_ROWS = 9;
  {
    const [dx, dz] = FALLS.down;
    let along = 0, last = null;
    for (let j = 0; j <= FALL_ROWS; j += 1) {
      const t = time * Math.pow(j / FALL_ROWS, 0.72), out = OFF * t, down = 0.5 * 9.81 * t * t;
      const p = [FALLS.x + dx * out, lipLevel - down, FALLS.z + dz * out];
      if (last) along += Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]);
      last = p;
      // it holds together for a hand's breadth, thins, and spreads a little as it comes down
      const share = j / FALL_ROWS, half = NOTCH * (1 - 0.14 * Math.sin(share * Math.PI)) + 0.1 * share * share;
      row(drawn + along, p[0], p[1] - (j === FALL_ROWS ? 0.06 : 0), p[2], dx, dz, half, j === 0 ? 0.62 : 1, FALLING, { fresh: j === 0, lie: false, deep: [0.5, 0.3] });
    }
  }

  // ---- from the foot of the rock: the pool, and on to the river
  const lower = [];
  for (let s = sEdge + 0.02; s < length; s += STEP) lower.push(s);
  lower.push(length);
  const sPlunge = sEdge + throwOut, rough = lower.map((s) => {
    // where the sheet comes down the pool boils, and behind it, against the rock, it is churned
    const boil = s < sPlunge ? 0.3 + 0.45 * smooth(sPlunge - 0.5, sPlunge, s) : 0.75 * Math.exp(-(s - sPlunge) / 0.4);
    return Math.max(whiteAt(s), s < sSill ? boil : 0);
  });
  // Water does not stand higher downstream than up: behind a sill it lies level, however its bed dips. (Laid a
  // hand above its bed everywhere, it rose a finger's width where the bed came up out of the pool.)
  const level = lower.map((s, k) => at(s)[2] + DEEP * (1 - 0.6 * rough[k]));
  for (let k = level.length - 2; k >= 0; k -= 1) level[k] = Math.max(level[k], level[k + 1]);
  lower.forEach((s, k) => {
    const here = at(s), [tx, tz] = heading(Math.max(s, sFoot + 0.61)), white = rough[k];
    // Where it falls further down it draws in to a chute narrower than the notch it has cut, and it does so
    // over a few metres: by the fall at each vertex alone, the outline of a fall was a row of teeth.
    let chute = 0;
    for (let j = -3; j <= 3; j += 1) chute += whiteAt(Math.min(length, Math.max(sSill, s + j * 0.5))) / 7;
    const draw = s > sSill ? Math.min(1, Math.max(0, (chute - 0.2) / 0.7)) : 0;
    // in the pool the water runs in under the rock that walls it (the rock's face stands at the bed's edge)
    const pool = 1 - smooth(sSill - 1.6, sSill - 0.4, s);
    const half = reach(here) * (1 - 0.5 * draw * draw * (3 - 2 * draw)) + 0.5 * pool;
    row(s, here[0], level[k], here[1], tx, tz, half, white, SPEED, { fresh: k === 0, lie: pool < 0.5, whole: 1 - 0.75 * pool, deep: [0.5 + 0.5 * pool, 0.14 + 0.5 * pool], calm: 1 - 0.85 * pool });
  });
  return geometry(position, water, flow, index, air);
}
