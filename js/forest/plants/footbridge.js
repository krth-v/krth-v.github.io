import * as THREE from 'three';
import { Mesh } from './build.js';
import { mulberry32 } from '../world/layout.js';

// The footbridge at the head of the falls: a foot log. One cedar trunk laid across the creek's gully with its
// ends let into the banks, its top hewn flat to walk on, and a handrail of peeled poles on its upstream side:
// three posts fixed to the log's flank and one long pole along their tops. The side towards the falls is open.
// It is what a trail crew builds where a creek is a stride or two across; it is not a boardwalk, and it has no
// deck but the log.
//
// It is built along its own x axis, which the instancer turns to the trail's heading: x runs the way the walk
// goes, z to the walker's right (downstream), and y = 0 is the tread's height where the trail crosses the
// creek's middle. Lengths are metres.
//
// The wind's two numbers say what the wood is (light/materials.js BARK_FRAG): [how deep in shade, how bare].
// The log's flanks are bark (0, 0), with moss as on any log; its hewn top and the poles are bare wood (·, 1),
// which that material lights face by face, so the top's adze marks show; and the top's edges are part bare,
// where boots do not go and moss does.
const LENGTH = 7.0, BUTT = 0.33, TIP = 0.27;          // the log: its length, and its radius at either end
const CUT = 0.6;                                      // its top is hewn off this share of its radius above its middle
const RAIL = 0.96;                                    // the handrail's height over the top

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

export function buildFootbridge() {
  const mesh = new Mesh(), r = mulberry32(4407);
  const radius = (x) => BUTT + (TIP - BUTT) * (x / LENGTH + 0.5);
  // The top stands a finger above the tread, and over its last stride at either end it goes down into the ground.
  const top = (x) => 0.03 - 0.13 * smooth(2.7, 3.5, Math.abs(x));
  const vertex = (x, y, z, nx, ny, nz, u, v, shade, bare) => {
    mesh.position.push(x, y, z); mesh.root.push(x, y, z); mesh.normal.push(nx, ny, nz); mesh.uv.push(u, v); mesh.wind.push(shade, bare);
    return mesh.vertexCount - 1;
  };

  // ---- the log
  const RINGS = 21, ARC = 12, alpha = Math.acos(CUT), half = Math.sin(alpha);          // the flat top is 2 * half * radius wide
  const xs = Array.from({ length: RINGS }, (_, j) => -LENGTH / 2 + (LENGTH * j) / (RINGS - 1));
  // its round: bark, from one edge of the top down round its belly and up to the other
  const round = mesh.vertexCount;
  for (const x of xs) {
    const rad = radius(x), cy = top(x) - CUT * rad;
    for (let i = 0; i <= ARC; i += 1) {
      const phi = alpha + ((2 * Math.PI - 2 * alpha) * i) / ARC, c = Math.cos(phi), s = Math.sin(phi), lump = 1 + 0.035 * (r() - 0.5);
      vertex(x, cy + rad * c * lump, rad * s * lump, 0, c, s, i / ARC, x / 2.4, 0, 0);
    }
  }
  for (let j = 0; j < RINGS - 1; j += 1) {
    for (let i = 0; i < ARC; i += 1) {
      const a = round + j * (ARC + 1) + i, b = a + ARC + 1;
      mesh.index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  // its top: hewn with an adze, a scallop to every stroke, worn smooth and bare down the middle
  const ACROSS = [[-1, 0.3, 0.3], [-0.52, 0, 1], [0, 0, 1], [0.52, 0, 1], [1, 0.3, 0.3]];          // [share of the half-width, how deep in shade, how bare]
  const flat = mesh.vertexCount;
  for (const x of xs) {
    const wide = half * radius(x);
    for (const [share, shade, bare] of ACROSS) {
      const z = share * wide, dip = Math.abs(share) < 1 ? 0.012 * (r() - 0.5) : 0;
      // (its paint is drawn out along the grain: a stride of the log to a hand's breadth across it)
      vertex(x, top(x) + dip, z, 0, 1, 0, z * 3 + 0.5, x * 0.22, shade, bare);
    }
  }
  for (let j = 0; j < RINGS - 1; j += 1) {
    for (let k = 0; k < ACROSS.length - 1; k += 1) {
      const a = flat + j * ACROSS.length + k, b = a + ACROSS.length;
      mesh.index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  // its two ends, sawn square (they are under the ground, unless the ground is ever moved)
  for (const end of [0, RINGS - 1]) {
    const x = xs[end], rad = radius(x), cy = top(x) - CUT * rad, out = end ? 1 : -1;
    const centre = vertex(x, cy, 0, out, 0, 0, 0, cy, 0.3, 1), first = mesh.vertexCount;
    for (let i = 0; i <= ARC; i += 1) {
      const phi = alpha + ((2 * Math.PI - 2 * alpha) * i) / ARC;
      vertex(x, cy + rad * Math.cos(phi), rad * Math.sin(phi), out, 0, 0, rad * Math.sin(phi), cy + rad * Math.cos(phi), 0.3, 1);
    }
    for (let i = 0; i < ARC; i += 1) { if (end) mesh.index.push(centre, first + i, first + i + 1); else mesh.index.push(centre, first + i + 1, first + i); }
    if (end) mesh.index.push(centre, first + ARC, first); else mesh.index.push(centre, first, first + ARC);                       // across the flat of the top
  }

  // ---- a peeled pole through `points`, with its ends closed
  const pole = (points, radii, sides = 6) => {
    const base = mesh.tube(points, radii, sides, { around: 1, tile: 2.6 }), n = points.length;
    for (let v = base; v < mesh.vertexCount; v += 1) mesh.wind[v * 2 + 1] = 1;
    for (const end of [0, n - 1]) {
      const p = points[end], ring = base + end * (sides + 1), dir = new THREE.Vector3().subVectors(points[Math.min(n - 1, end + 1)], points[Math.max(0, end - 1)]).normalize().multiplyScalar(end ? 1 : -1);
      const centre = vertex(p.x, p.y, p.z, dir.x, dir.y, dir.z, 0.5, 0.5, 0.15, 1), first = mesh.vertexCount;
      for (let i = 0; i <= sides; i += 1) { const o = (ring + i) * 3; vertex(mesh.position[o], mesh.position[o + 1], mesh.position[o + 2], dir.x, dir.y, dir.z, 0.5 + 0.4 * Math.cos(i), 0.5 + 0.4 * Math.sin(i), 0.15, 1); }
      // (a tube's rings run the other way round from its direction: build.js)
      for (let i = 0; i < sides; i += 1) { if (end) mesh.index.push(centre, first + i + 1, first + i); else mesh.index.push(centre, first + i, first + i + 1); }
    }
  };

  // ---- the handrail, on the upstream side (-z)
  const POSTS = [-2.35, -0.15, 2.2], tops = [];
  for (const x of POSTS) {
    const side = -(half * radius(x) + 0.075), lean = 0.05 + 0.04 * r(), tilt = (r() - 0.5) * 0.06;
    const foot = new THREE.Vector3(x, top(x) - 0.5, side + 0.02), head = new THREE.Vector3(x + tilt, top(x) + RAIL + 0.1, side - lean);
    const knee = new THREE.Vector3().lerpVectors(foot, head, 0.5).add(new THREE.Vector3((r() - 0.5) * 0.03, 0, (r() - 0.5) * 0.03));
    pole([foot, knee, head], [0.055, 0.05, 0.044]);
    tops.push(head);
  }
  // one long pole along the posts' inner sides, a hand below their tops: thick at its butt, a little crooked
  const along = [];
  for (let k = 0; k <= 8; k += 1) {
    const x = -2.95 + (5.85 * k) / 8;
    // where the posts' tops stand at x (a line through the nearest two of them)
    const i = x < POSTS[1] ? 0 : 1, t = (x - POSTS[i]) / (POSTS[i + 1] - POSTS[i]), a = tops[i], b = tops[i + 1];
    along.push(new THREE.Vector3(x, a.y + (b.y - a.y) * t - 0.1 + 0.014 * (r() - 0.5), a.z + (b.z - a.z) * t + 0.09 + 0.014 * (r() - 0.5)));
  }
  pole(along, along.map((_, k) => 0.045 - 0.011 * (k / 8)));

  return { solid: [mesh.geometry()], height: 1.3, reach: 4, lod: [], max: 90, gone: 120 };
}
