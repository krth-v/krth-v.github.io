import * as THREE from 'three';

// Accumulates one animal's triangles, each vertex tied to one or two bones.
// Every part of an animal is built in its bind pose, in which every bone is
// square to the model's axes: +x is forward, +y up, +z the animal's right, in
// metres, with the origin where the feet grip. A bone then needs only the
// place it turns about (life/rig.js).
export class Skin {
  constructor() { this.position = []; this.normal = []; this.uv = []; this.bone = []; this.weight = []; this.index = []; }

  get count() { return this.position.length / 3; }

  // A vertex held by bone `b0`, or shared with `b1` by the share `w1`.
  vertex(x, y, z, u, v, b0, b1 = b0, w1 = 0) {
    this.position.push(x, y, z);
    this.normal.push(0, 0, 0);
    this.uv.push(u, v);
    this.bone.push(b0, b1, 0, 0);
    this.weight.push(1 - w1, w1, 0, 0);
    return this.count - 1;
  }

  // A sheet of (cols + 1) x (rows + 1) vertices. `at(i, j, out)` fills out.p (a Vector3), out.u, out.v, out.b0,
  // and for a vertex two bones share, out.b1 and out.w1. Faces are wound so that (along i) x (along j) points
  // out of the surface; `flip` turns them over. `wrap` says column `cols` lies on column 0 (a closed tube), so
  // the two take one normal. Returns the index of its first vertex: vertex (i, j) is that + j * (cols + 1) + i.
  sheet(cols, rows, at, { flip = false, wrap = false } = {}) {
    const base = this.count, out = { p: new THREE.Vector3(), u: 0, v: 0, b0: 0, b1: 0, w1: 0 };
    for (let j = 0; j <= rows; j += 1) {
      for (let i = 0; i <= cols; i += 1) {
        out.b1 = -1; out.w1 = 0;
        at(i, j, out);
        this.vertex(out.p.x, out.p.y, out.p.z, out.u, out.v, out.b0, out.b1 < 0 ? out.b0 : out.b1, out.w1);
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

  // Adds each face's normal, weighted by its area, to its three vertices (faces from index `from` to `to`).
  shade(from, to) {
    const P = this.position, N = this.normal, I = this.index;
    for (let t = from; t < to; t += 3) {
      const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const o of [a, b, c]) { N[o] += nx; N[o + 1] += ny; N[o + 2] += nz; }
    }
  }

  geometry() {
    const N = new Float32Array(this.normal);
    for (let i = 0; i < N.length; i += 3) {
      const l = Math.hypot(N[i], N[i + 1], N[i + 2]) || 1;
      N[i] /= l; N[i + 1] /= l; N[i + 2] /= l;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.position), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uv), 2));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(new Uint16Array(this.bone), 4));
    g.setAttribute('skinWeight', new THREE.BufferAttribute(new Float32Array(this.weight), 4));
    g.setIndex(new THREE.BufferAttribute(new (this.count > 65535 ? Uint32Array : Uint16Array)(this.index), 1));
    return g;
  }
}

// A smooth curve through points [[x, y], ...] with x rising: y at x (Catmull-Rom on each span, flat beyond the ends).
export function curve(points) {
  const n = points.length;
  return (x) => {
    if (x <= points[0][0]) return points[0][1];
    if (x >= points[n - 1][0]) return points[n - 1][1];
    let i = 0;
    while (i < n - 2 && points[i + 1][0] < x) i += 1;
    const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, n - 1)];
    const t = (x - p1[0]) / (p2[0] - p1[0]);
    // tangents by finite differences over the uneven spacing, so a tight pair of points does not overshoot
    const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * (p2[0] - p1[0]);
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
  };
}
