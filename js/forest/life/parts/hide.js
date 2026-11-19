import * as THREE from 'three';
import { Skin } from '../skin.js';

// A beast's skin (life/beast.js, life/plate.js): the bird's (life/skin.js), with vertices that up to four bones may
// hold. The trunk low by a shoulder or a haunch is held by two of the back's bones and a leg's; a jaw's skin by two
// of the neck's and the jaw.
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export class Hide extends Skin {
  vertex3(x, y, z, u, v, b0, b1, w1, b2, w2) {
    this.position.push(x, y, z); this.normal.push(0, 0, 0); this.uv.push(u, v);
    this.bone.push(b0, b1, b2, 0); this.weight.push(1 - w1 - w2, w1, w2, 0);
    return this.count - 1;
  }
  // a vertex held by the bones `bones` in the shares `weights` (up to four; the shares are made to sum to one)
  vertexN(x, y, z, u, v, bones, weights) {
    this.position.push(x, y, z); this.normal.push(0, 0, 0); this.uv.push(u, v);
    let sum = 0;
    for (let k = 0; k < 4; k += 1) sum += k < bones.length ? weights[k] : 0;
    for (let k = 0; k < 4; k += 1) { this.bone.push(k < bones.length ? bones[k] : bones[0]); this.weight.push(k < bones.length ? weights[k] / (sum || 1) : 0); }
    return this.count - 1;
  }
  // A sheet of (cols + 1) x (rows + 1) vertices (as life/skin.js's). `at(i, j, out)` fills out.p, out.u, out.v and
  // either out.b0 (with out.b1, out.w1, out.b2, out.w2 for a vertex that is shared) or out.bones and out.weights
  // (lists of up to four, which it must then fill for every vertex).
  sheet(cols, rows, at, { flip = false, wrap = false } = {}) {
    const base = this.count, out = { p: V(), u: 0, v: 0, b0: 0, b1: 0, w1: 0, b2: 0, w2: 0, bones: null, weights: null };
    for (let j = 0; j <= rows; j += 1) {
      for (let i = 0; i <= cols; i += 1) {
        out.b1 = -1; out.w1 = 0; out.b2 = -1; out.w2 = 0; out.bones = null;
        at(i, j, out);
        if (out.bones) this.vertexN(out.p.x, out.p.y, out.p.z, out.u, out.v, out.bones, out.weights);
        else this.vertex3(out.p.x, out.p.y, out.p.z, out.u, out.v, out.b0, out.b1 < 0 ? out.b0 : out.b1, out.w1, out.b2 < 0 ? out.b0 : out.b2, out.w2);
      }
    }
    const first = this.index.length;
    for (let j = 0; j < rows; j += 1) {
      for (let i = 0; i < cols; i += 1) {
        const a = base + j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
        if (flip) this.index.push(a, c, b, b, c, d); else this.index.push(a, b, c, b, d, c);
      }
    }
    this.shade(first, this.index.length);
    if (wrap) {
      for (let j = 0; j <= rows; j += 1) {
        const a = (base + j * (cols + 1)) * 3, b = (base + j * (cols + 1) + cols) * 3;
        for (let k = 0; k < 3; k += 1) { const sum = this.normal[a + k] + this.normal[b + k]; this.normal[a + k] = sum; this.normal[b + k] = sum; }
      }
    }
    return base;
  }
  // a fan from one vertex to a ring of `n` + 1 vertices from `first` (the last on the first), facing `out` if not `flip`
  cap(centre, first, n, flip) {
    const from = this.index.length;
    for (let i = 0; i < n; i += 1) { const a = first + i; if (flip) this.index.push(centre, a + 1, a); else this.index.push(centre, a, a + 1); }
    this.shade(from, this.index.length);
  }
}
