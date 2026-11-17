import * as THREE from 'three';
import { CABIN, VIEW, creek as creekAt } from './land.js';
import { SITE, WINDOW } from '../plants/cabin.js';

// What is left of the blockout's stand-ins: the light in the cabin's window, and the stones the creek is
// crossed on, flat-painted. (The cabin, the footbridge and the trail shelter are no stand-ins: plants/cabin.js,
// plants/footbridge.js and plants/shelter.js build them, and the layout lays them where scenes/walk.js says.)
//
// Returns the mesh's geometry and `places`: where each stands, and where the cabin's window looks from.

// The cabin's floor: where the box that stood in for the cabin had its own, a hand above the highest ground
// under that box's four corners. The window's vantage is 1.55 m above it, and has to stay where it was to the
// last digit (the window's frames are compared with earlier ones), so this is that box's own sum.
export function cabinFloor(terrain) {
  const half = [3.6, 2.75];
  let floor = -Infinity;
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) floor = Math.max(floor, terrain.heightAt(CABIN.x + x * half[0], CABIN.z + z * half[1]));
  return floor + 0.25;
}

export function buildStructures({ terrain, trail, look }) {
  const pal = look.palette.built;
  const colour = (c, k = 1) => new THREE.Color().setHSL(c[0] / 360, c[1] / 100, c[2] / 100, THREE.SRGBColorSpace).multiplyScalar(k);
  const position = [], normal = [], paint = [];           // three corners to a triangle; a corner's paint is its colour, and how much of it is its own light
  const n = new THREE.Vector3();
  const places = {};

  // ---- the cabin is no stand-in: plants/cabin.js builds it. What is left of it here is the light in its
  // window: a pane behind the wall's face, with the room's lamp behind it (the plain material's own light),
  // brightest low down, where the desk is. And its places: where it stands, and where its window looks from.
  {
    const floor = cabinFloor(terrain), wy = 1.55, lamp = colour(pal.lamp);
    const x0 = SITE.x + WINDOW.x - WINDOW.half, x1 = SITE.x + WINDOW.x + WINDOW.half, y0 = floor + WINDOW.y - WINDOW.half, y1 = floor + WINDOW.y + WINDOW.half;
    const z = SITE.z - SITE.half[1] + WINDOW.inset;
    // (triangles that face north, out of the window; each corner has its own share of the light: most where
    // the desk's lamp is, low in the window and a little to the seat's side of its middle, least in its corners)
    const N = 6, at = [SITE.x + WINDOW.x + 0.13, floor + WINDOW.y - 0.2];
    const corner = (i, j) => { const x = x0 + ((x1 - x0) * i) / N, y = y0 + ((y1 - y0) * j) / N; return [x, y, 0.3 + 0.7 * Math.exp(-((Math.hypot(x - at[0], y - at[1]) / 0.36) ** 2))]; };
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
      for (const [a, b] of [[i, j], [i, j + 1], [i + 1, j + 1], [i, j], [i + 1, j + 1], [i + 1, j]]) { const [x, y, glow] = corner(a, b); position.push(x, y, z); normal.push(0, 0, -1); paint.push(lamp.r, lamp.g, lamp.b, glow); }
    }
    places.cabin = [SITE.x, floor, SITE.z];                      // its middle, at its floor: inside its walls
    places.window = [VIEW.x, floor + wy, VIEW.z, 0.8];           // the fourth number: how open the air is that the window looks through (land.open is for where a walker stands)
    // the room's lamp, half a metre behind the pane where the pane is brightest: by night its light falls
    // through the window's opening onto the ground outside (lampLight in light/shared.js)
    places.pane = [at[0], at[1], z + 0.5];
  }

  // ---- the trail shelter in the old clearing is no stand-in: plants/shelter.js builds it, and the layout lays
  // it where scenes/walk.js says. Its place is kept here, for the dev page's vantages.
  {
    const p = new THREE.Vector3(), t = new THREE.Vector3();
    trail.sample(trail.at.shelter, p, t);
    const x = p.x + t.z * 8.5, z = p.z - t.x * 8.5;                    // eight and a half metres to the walker's left
    places.shelter = [x, terrain.heightAt(x, z), z];
  }

  // ---- stepping stones where the walk crosses the creek the second time
  {
    const p = new THREE.Vector3(), t = new THREE.Vector3(), k = [0, 0, 0, 0, 0], stone = colour(pal.stone, 1.1);
    const lump = new THREE.IcosahedronGeometry(1, 2), lp = lump.getAttribute('position');        // three triangles' corners in a row
    [-2.3, -1.4, -0.55, 0.3, 1.2, 2.1].forEach((along, i) => {
      trail.sample(trail.at.stones + along, p, t);
      const off = (i % 2 ? 0.16 : -0.14), x = p.x - t.z * off, z = p.z + t.x * off;
      creekAt(x, z, k);
      if (k[0] > k[2] + 0.5) return;                                    // only where there is water to step over
      const r = 0.36 + 0.09 * ((i * 7) % 3) / 2, turn = i * 1.7, cos = Math.cos(turn), sin = Math.sin(turn), y = k[1] + 0.12;
      // a water-worn cobble: every corner carries the rounded stone's own normal, so no facet shows
      for (let j = 0; j < lp.count; j += 1) {
        const ux = lp.getX(j), uy = lp.getY(j), uz = lp.getZ(j), lx = ux * r, lz = uz * r * 0.78;
        position.push(x + lx * cos + lz * sin, y + uy * 0.2, z - lx * sin + lz * cos);
        n.set(ux / r, uy / 0.2, uz / (r * 0.78)).normalize();
        normal.push(n.x * cos + n.z * sin, n.y, -n.x * sin + n.z * cos);
        paint.push(stone.r, stone.g, stone.b, 0);
      }
    });
    lump.dispose();
    trail.sample(trail.at.stones, p, t);
    places.stones = [p.x, p.y, p.z];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
  geometry.setAttribute('aPaint', new THREE.BufferAttribute(new Float32Array(paint), 4));
  geometry.computeBoundingSphere();
  return { geometry, places };
}
