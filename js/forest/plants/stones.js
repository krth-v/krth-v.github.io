import * as THREE from 'three';
import { Mesh } from './build.js';
import { mulberry32 } from '../world/layout.js';

// The river's stones: cobbles in knots a stride across, and boulders. The owner, of the painted bar of the
// first valley (2026-11-15): "Pebbles and gravel are only believable if they have 3D form and cast shadows.
// Otherwise, it looks like a sidewalk." So every stone here is a solid: a rounded dome set a little way into
// the ground, lit by its own surface, with its own shadow.
//
// The sun's shadow map cannot draw a cobble's shadow (one texel of it is a hand wide and two long), so a
// stone carries its shadow with it: a flat shape on the ground round its foot, whose far side the vertex
// shader draws out away from the sun by the stone's height over the sun's slope (light/materials.js, STONE).
// A shadow is a mesh of its own (`shade`), drawn after everything solid and keeping the darker of itself and
// what is already there: it is painted as sand with no sun on it, and a shadow painted over whatever lay
// under it was a pale slab on wet sand and a sand-coloured tooth in the water's edge.
//
// A knot lies as the ground under it does (`lies`: the instancer shears it by the ground's slope). Set level
// on a beach that slopes to the water, the stones on the low side floated and their shadows stood out over
// the water like shelves.
//
// What a vertex says of itself, in the two numbers a card would use for the wind:
//   on a stone   x: how high up its stone it is, 0 at the ground to 1 at the top;   y: 0
//   on a shadow  x: the height of the stone that casts it, in metres;               y: 1
// and in its texture coordinate, which a stone has no other use for: x which rock it is, y how light.

// A stone: a dome over an ellipse, `sides` round and `rings` up, turned by `turn`, its middle at (x, z).
// `keep` says the next coarser level has this stone too: otherwise it sinks into the ground on the way there.
function stone(mesh, shade, r, { x, z, rx, rz, high, turn, sides, rings, rock, tone, keep, shadow }) {
  const base = mesh.vertexCount, c = Math.cos(turn), s = Math.sin(turn), sink = high * 0.22;
  const lump = Array.from({ length: sides }, () => 0.93 + 0.14 * r());        // no stone is a turned shape
  const put = (px, py, pz, nx, ny, nz, rise) => {
    const wx = x + px * c - pz * s, wz = z + px * s + pz * c;
    mesh.position.push(wx, py, wz);
    if (keep) mesh.root.push(wx, py, wz); else mesh.root.push(x, -0.02, z);
    const n = Math.hypot(nx, ny, nz) || 1;
    mesh.normal.push((nx * c - nz * s) / n, ny / n, (nx * s + nz * c) / n);
    mesh.uv.push(rock, tone);
    mesh.wind.push(rise, 0);
  };
  put(0, high - sink, 0, 0, 1, 0, 1);
  for (let k = 1; k <= rings; k += 1) {
    const phi = (k / rings) * 1.75, sp = Math.sin(phi), cp = Math.cos(phi);            // a little past the widest, so the stone's side turns under
    for (let i = 0; i < sides; i += 1) {
      const th = (i / sides) * Math.PI * 2, f = lump[i] * (0.97 + 0.06 * r());
      const px = rx * sp * Math.cos(th) * f, pz = rz * sp * Math.sin(th) * f, py = high * Math.pow(Math.max(cp, 0), 0.8) * (cp >= 0 ? 1 : 0) - sink + (cp < 0 ? cp * high * 0.3 : 0);
      put(px, py, pz, px / (rx * rx), Math.max(cp, -0.2) / high * 0.9, pz / (rz * rz), Math.max(0, (py + sink) / high));
    }
  }
  for (let i = 0; i < sides; i += 1) mesh.index.push(base, base + 1 + ((i + 1) % sides), base + 1 + i);
  for (let k = 1; k < rings; k += 1) {
    for (let i = 0; i < sides; i += 1) {
      const a = base + 1 + (k - 1) * sides + i, b = base + 1 + (k - 1) * sides + ((i + 1) % sides), d = a + sides, e = b + sides;
      mesh.index.push(a, b, d, b, e, d);
    }
  }
  if (!shadow) return;
  // its shadow: a fan round its foot, a finger above the ground. Each rim vertex says which way it faces
  // (in its normal), and the shader moves it away from the sun by as much as it faces away.
  const foot = shade.vertexCount, n = shadow;
  const flat = (wx, wz, nx, nz) => {
    shade.position.push(wx, 0.012, wz);
    if (keep) shade.root.push(wx, 0.012, wz); else shade.root.push(x, -0.02, z);
    shade.normal.push(nx, 0, nz); shade.uv.push(rock, tone); shade.wind.push(high - sink, 1);
  };
  flat(x, z, 0, 0);
  for (let i = 0; i < n; i += 1) {
    // a little wider than the stone: what shows of it on the sun's side is the dark line a stone has round its foot
    const th = (i / n) * Math.PI * 2, px = (rx * 1.1 + 0.006) * Math.cos(th), pz = (rz * 1.1 + 0.006) * Math.sin(th);
    const ox = px * c - pz * s, oz = px * s + pz * c, len = Math.hypot(ox, oz) || 1;
    flat(x + ox, z + oz, ox / len, oz / len);
  }
  for (let i = 0; i < n; i += 1) shade.index.push(foot, foot + 1 + ((i + 1) % n), foot + 1 + i);
}

// Which rock a stone is, 0 to 1 (the shader's thresholds: light/materials.js): half of them the cool grey of
// the mountain's sandstone, then buff, a pale one here and there, a dark basalt, now and then a rusty one.

// A knot of cobbles, about a metre across, laid so thickly over a bar (world/layout.js, CARPETS) that the
// knots run together and stones cover more of the ground than sand does: five as big as a loaf, eight as big
// as a fist, a scatter of pebbles. From further off (6 to 9 m) it is the five big ones alone: they are
// three-quarters of what the knot covers, so the bar does not thin where the small ones go. The five are the
// same in both levels, face for face and shadow for shadow: a stone drawn in fewer faces further off changed
// its outline by a finger's width as the levels swapped, and its shadow's tip by a fifth of its length.
export function buildCobbles() {
  const plan = () => {
    const r = mulberry32(83), list = [];
    for (let i = 0; i < 21; i += 1) {
      const a = i * 2.39996 + r() * 0.8, d = 0.05 + 0.095 * Math.sqrt(i) + 0.04 * r(), size = i < 5 ? 0.11 + 0.08 * r() : i < 13 ? 0.05 + 0.035 * r() : 0.028 + 0.016 * r();
      list.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, rx: size * (1 + 0.45 * r()), rz: size * (0.75 + 0.2 * r()), high: size * (0.5 + 0.35 * r()), turn: r() * Math.PI, rock: r(), tone: r(), seed: Math.floor(r() * 1e9) });
    }
    return list;
  };
  const fine = new Mesh(), coarse = new Mesh(), shade = [new Mesh(), new Mesh()];
  plan().forEach((p, i) => {
    const keep = i < 5;
    // the fist-sized ones are seen from above at a stride's distance: in six sides and two rings they were flat tablets with ruled edges
    stone(fine, shade[0], mulberry32(p.seed), { ...p, sides: i < 13 ? 8 : 6, rings: i < 5 ? 2 : i < 13 ? 3 : 1, keep, shadow: i < 5 ? 12 : i < 13 ? 8 : 0 });
    if (keep) stone(coarse, shade[1], mulberry32(p.seed), { ...p, sides: 8, rings: 2, keep: true, shadow: 12 });       // the same stone, face for face: nothing of it changes at the swap
  });
  return { solid: [fine.geometry(), coarse.geometry()], shade: shade.map((m) => m.geometry()), height: 0.25, reach: 1.0, lod: [6], handWood: [0.5, 0.5], max: 30, gone: 46, casts: false, lies: true };
}

// A boulder the river could not roll far, knee high, with two cobbles lodged against it. Every boulder is the
// one shape, turned and sized by where it lies, so it is of the commonest rock: the shader shifts each one's
// colour by its own tint.
export function buildRocks() {
  const big = { x: 0, z: 0, rx: 0.42, rz: 0.3, high: 0.3, turn: 0.4, rock: 0.2, tone: 0.45, seed: 891 };
  const small = [{ x: 0.5, z: 0.16, rx: 0.13, rz: 0.1, high: 0.09, turn: 1.2, rock: 0.6, tone: 0.7, seed: 892 }, { x: -0.2, z: -0.44, rx: 0.16, rz: 0.11, high: 0.1, turn: 2.3, rock: 0.83, tone: 0.5, seed: 893 }];
  const fine = new Mesh(), coarse = new Mesh(), shade = [new Mesh(), new Mesh()];
  stone(fine, shade[0], mulberry32(big.seed), { ...big, sides: 11, rings: 4, keep: true, shadow: 10 });
  for (const p of small) stone(fine, shade[0], mulberry32(p.seed), { ...p, sides: 7, rings: 2, keep: false, shadow: 6 });
  stone(coarse, shade[1], mulberry32(big.seed), { ...big, sides: 11, rings: 4, keep: true, shadow: 10 });
  return { solid: [fine.geometry(), coarse.geometry()], shade: shade.map((m) => m.geometry()), height: 0.4, reach: 1.0, lod: [16], handWood: [0.5, 0.5], max: 60, gone: 84, casts: false, lies: true };
}
