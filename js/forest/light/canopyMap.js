import * as THREE from 'three';
import { LEGACY as WORLD, makeNoise } from '../world/terrain.js';
import { RECORD } from '../world/layout.js';
import { terrace } from '../world/land.js';

// A top-down picture of how much crown stands over each spot. The materials read
// it once for a point (canopyLight in shared.js): where the sun's ray that lands on
// the ground beneath the point crossed the canopy, whatever the point's own height.
// It covers the old world's box (WORLD here is that box), as it always did. Beyond
// it there is no crown overhead: more than 12 m outside the box the materials do not
// read the map at all (mapped() in shared.js).
//
// Over the old terrace the map is the old world's own: drawn from the old world's trees in the order they
// were made (`terrace`: layout.crowns), so that a spot nothing has been cleared from or planted on comes to
// the same number, bit for bit, whatever stands in the valley. The light at the Cathedral is read from this
// map as far as 160 m off towards the sun and 43 m towards the moon, which stands over the valley. Off the
// terrace it is drawn from what stands there now (`records`), and the two meet over FADE metres beyond the brink.
// crowns: [{ records, terrace, radius, weight }]
const FADE = 4;
export function createCanopyMap(U, crowns) {
  const size = 512;
  const w = WORLD.maxX - WORLD.minX, h = WORLD.maxZ - WORLD.minZ;
  const draw = (sum, records, radius, weight) => {
    for (let o = 0; o < records.length; o += RECORD) {
      const r = radius * records[o + 4];
      const cx = ((records[o] - WORLD.minX) / w) * size, cz = ((records[o + 2] - WORLD.minZ) / h) * size;
      const rx = (r / w) * size, rz = (r / h) * size;
      for (let j = Math.max(0, Math.floor(cz - rz)); j <= Math.min(size - 1, Math.ceil(cz + rz)); j += 1) {
        for (let i = Math.max(0, Math.floor(cx - rx)); i <= Math.min(size - 1, Math.ceil(cx + rx)); i += 1) {
          const d = Math.hypot((i - cx) / rx, (j - cz) / rz);
          if (d < 1) sum[j * size + i] += weight * (1 - d * d);
        }
      }
    }
  };
  const old = new Float32Array(size * size), now = new Float32Array(size * size);
  for (const { records, terrace: before, radius, weight } of crowns) { draw(old, before, radius, weight); draw(now, records, radius, weight); }
  const data = new Uint8Array(size * size);
  for (let j = 0; j < size; j += 1) {
    for (let i = 0; i < size; i += 1) {
      const k = j * size + i, inside = terrace(WORLD.minX + ((i + 0.5) / size) * w, WORLD.minZ + ((j + 0.5) / size) * h);
      const sum = inside >= 0 ? old[k] : inside <= -FADE ? now[k] : now[k] + (old[k] - now[k]) * (1 + inside / FADE);
      data[k] = Math.round(255 * (1 - Math.exp(-sum)));
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  U.uCanopyMap.value = texture;
  U.uCanopyOrigin.value.set(WORLD.minX, WORLD.minZ);
  U.uCanopyInvSize.value.set(1 / w, 1 / h);
  return texture;
}

// Tiling smooth noise: wind gusts in the vertex shader, leaf gaps in the light.
export function createNoiseTexture(U) {
  const size = 256, period = 16;
  const noise = makeNoise(91), fine = makeNoise(92);
  const wrap = (f, x, z, p) => {                      // blend four shifted copies so the tile repeats
    const u = x / p, v = z / p;
    return f(x, z) * (1 - u) * (1 - v) + f(x - p, z) * u * (1 - v) + f(x, z - p) * (1 - u) * v + f(x - p, z - p) * u * v;
  };
  const data = new Uint8Array(size * size);
  for (let j = 0; j < size; j += 1) {
    for (let i = 0; i < size; i += 1) {
      const x = (i / size) * period, z = (j / size) * period;
      const v = 0.65 * wrap(noise, x, z, period) + 0.35 * wrap(fine, x * 2, z * 2, period * 2);
      data[j * size + i] = Math.round(255 * Math.min(1, Math.max(0, (v - 0.5) * 1.6 + 0.5)));
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  U.uNoiseTex.value = texture;
  return texture;
}
