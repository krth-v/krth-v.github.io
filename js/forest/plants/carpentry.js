import * as THREE from 'three';

// What people have built of wood and stone along the walk, in the pieces a builder lays one at a time: peeled
// poles, split boards and shakes, and stones stacked dry. plants/shelter.js is built of them.
//
// Wood goes into a Mesh (build.js) for the bark's material with BARE (light/materials.js: no bark on it
// anywhere). The wind's two numbers say what a vertex is: [how deep in shade, how bare]. A round pole is 0.6
// bare: weathered wood, shaded smoothly round. A split face is 1: lit face by face, as a break is. Its paint
// is read by uv in metres and is drawn out along the grain: a stride of a board to a hand's breadth across it.
// Wood is drawn front-side only, so every face here is wound to face the way it is said to.
//
// Every vertex has a root (build.js): where it lies when the thing has gone over to its coarser level. A piece
// the coarser level has too is its own root; one it has not is given the place it shrinks to.

const GRAIN_ACROSS = 3, GRAIN_ALONG = 0.22;
const A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3();

// One vertex of wood. `root` is where it goes in the coarser level (itself, if none is given).
export function vertex(mesh, p, normal, u, v, shade, bare, root = p) {
  mesh.position.push(p.x, p.y, p.z); mesh.root.push(root.x, root.y, root.z); mesh.normal.push(normal.x, normal.y, normal.z); mesh.uv.push(u, v); mesh.wind.push(shade, bare);
  return mesh.vertexCount - 1;
}

// A flat face through four corners, a to b to c to d round it, wound so that it faces `facing`. `grain` is the
// unit vector its wood's grain runs along, and `offset` shifts its paint, so that no two boards are one board.
// `roots` are the four corners' places in the coarser level.
export function face(mesh, corners, facing, { grain, offset = [0, 0], shade = 0, bare = 1, roots = null, normal = null } = {}) {
  const [a, b, c, d] = corners;
  N.crossVectors(A.subVectors(b, a), B.subVectors(d, a));
  const flip = N.dot(facing) < 0;
  if (flip) N.negate();
  N.normalize();
  const n = normal || N, across = A.crossVectors(n, grain).normalize();
  const at = corners.map((p, i) => vertex(mesh, p, n, p.dot(across) * GRAIN_ACROSS + offset[0], p.dot(grain) * GRAIN_ALONG + offset[1], shade, bare, roots ? roots[i] : p));
  if (flip) mesh.index.push(at[0], at[2], at[1], at[0], at[3], at[2]); else mesh.index.push(at[0], at[1], at[2], at[0], at[2], at[3]);
  return at;
}

// A peeled pole through `points`, its ends closed. `drop`: the coarser level has no such pole, and it thins away
// onto its own middle line. `shade` may be a number or one for each point.
export function pole(mesh, points, radii, { sides = 6, shade = 0, bare = 0.6, drop = false, tile = 2.6, caps = true } = {}) {
  const base = mesh.tube(points, radii, sides, { around: 1, tile, drop }), n = points.length;
  const shadeAt = (j) => (Array.isArray(shade) ? shade[j] : shade);
  for (let j = 0; j < n; j += 1) for (let i = 0; i <= sides; i += 1) { const v = base + j * (sides + 1) + i; mesh.wind[v * 2] = shadeAt(j); mesh.wind[v * 2 + 1] = bare; }
  if (!caps) return base;
  for (const end of [0, n - 1]) {
    const p = points[end], ring = base + end * (sides + 1), root = drop ? p : null;
    const dir = new THREE.Vector3().subVectors(points[Math.min(n - 1, end + 1)], points[Math.max(0, end - 1)]).normalize().multiplyScalar(end ? 1 : -1);
    const centre = vertex(mesh, p, dir, 0.5, 0.5, shadeAt(end) + 0.12, 1), first = mesh.vertexCount;
    for (let i = 0; i <= sides; i += 1) {
      const o = (ring + i) * 3, q = new THREE.Vector3(mesh.position[o], mesh.position[o + 1], mesh.position[o + 2]);
      vertex(mesh, q, dir, 0.5 + 0.4 * Math.cos(i), 0.5 + 0.4 * Math.sin(i), shadeAt(end) + 0.12, 1, root || q);
    }
    // (a tube's rings run the other way round from its direction: build.js)
    for (let i = 0; i < sides; i += 1) { if (end) mesh.index.push(centre, first + i + 1, first + i); else mesh.index.push(centre, first + i, first + i + 1); }
  }
  return base;
}

// A split board or shake: its outer face and, if `inner` is given, its inner one (a shade for it), `thick`
// apart. `corners` are the outer face's, a to b to c to d round it, with a to b across the grain at its foot;
// `out` is the way the outer face looks. `roots` are the outer corners' places in the coarser level, and the
// inner face goes to the same.
export function board(mesh, corners, out, { thick = 0.02, inner = null, shade = 0, offset = [0, 0], roots = null, grain = null } = {}) {
  const along = grain || new THREE.Vector3().subVectors(corners[3], corners[0]).normalize();
  face(mesh, corners, out, { grain: along, offset, shade, roots });
  if (inner === null) return;
  const back = corners.map((p) => p.clone().addScaledVector(out, -thick));
  face(mesh, back, new THREE.Vector3().copy(out).negate(), { grain: along, offset: [offset[0] + 0.37, offset[1] + 0.61], shade: inner, roots });
}

// One stone of a dry-stacked footing, for the rock's material (ROCK_FRAG): a block with its edges knocked off,
// `long` by `wide` by `high`, its foot's middle at `at`, turned `turn` about the upright. The rock's material
// reads uv as [how much of the sky reaches it, how much of the floor's litter lies over it] and the wind's two
// numbers as [how wet, how bare]. `sunk` is how far its foot is in the ground: there the litter lies over it.
export function stone(mesh, at, long, wide, high, turn, { sky = 1, sunk = 0.06, lump = 0.12, rand = Math.random } = {}) {
  const cos = Math.cos(turn), sin = Math.sin(turn), base = mesh.vertexCount;
  // three rings of eight: its foot, its shoulder, and its top drawn in; and the top's middle
  const RING = [[1, 0], [1, 0.72], [0.62, 1]], lumps = Array.from({ length: 8 }, () => 1 + lump * (rand() - 0.5) * 2);
  for (const [share, lift] of RING) {
    for (let i = 0; i <= 8; i += 1) {
      const a = (i % 8) * Math.PI / 4, k = lumps[i % 8];
      // a block's outline: a square with its corners eased
      const cx = Math.cos(a), cz = Math.sin(a), m = Math.max(Math.abs(cx), Math.abs(cz)), ease = 0.86 + 0.14 * m;
      const lx = (cx / m) * ease * 0.5 * long * share * k, lz = (cz / m) * ease * 0.5 * wide * share * k, y = high * lift;
      const nx = cx * (1 - 0.75 * lift * lift), nz = cz * (1 - 0.75 * lift * lift), ny = 0.15 + lift * lift;
      mesh.position.push(at.x + lx * cos + lz * sin, at.y + y, at.z - lx * sin + lz * cos);
      mesh.root.push(at.x, at.y, at.z);
      const len = Math.hypot(nx, ny, nz);
      mesh.normal.push((nx * cos + nz * sin) / len, ny / len, (-nx * sin + nz * cos) / len);
      mesh.uv.push(sky * (0.72 + 0.28 * lift), y < sunk ? 1 : Math.max(0, 0.55 - (y - sunk) * 4));
      mesh.wind.push(0, 0);
    }
  }
  const top = mesh.vertexCount;
  mesh.position.push(at.x, at.y + high * 1.02, at.z); mesh.root.push(at.x, at.y, at.z); mesh.normal.push(0, 1, 0); mesh.uv.push(sky, 0); mesh.wind.push(0, 0);
  for (let j = 0; j < 2; j += 1) {
    for (let i = 0; i < 8; i += 1) { const p = base + j * 9 + i, q = p + 9; mesh.index.push(p, q, p + 1, p + 1, q, q + 1); }
  }
  for (let i = 0; i < 8; i += 1) mesh.index.push(base + 18 + i, top, base + 18 + i + 1);
}
