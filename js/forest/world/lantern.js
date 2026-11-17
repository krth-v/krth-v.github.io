import * as THREE from 'three';

// The walker's lantern (the owner, 2026-11-14: "A small lantern. This also means the night environment and
// moonlight need to be darker so that the lantern makes sense"). It is carried by night only, low at the
// walker's right side and a little ahead, and its flame is where the lantern's light comes from
// (lampLight in light/shared.js).
//
// It is drawn by the plain material (light/materials.js): every corner has its own colour, and a share of it
// that is its own light, which is the glass with the flame behind it. Its origin is the flame; it is about a
// hand and a half tall, and hangs from the top of its bail. Its form is the agent's: a small kerosene lantern
// with a round glass, a wire guard, a cap and a bail. No source was read for it.
export const LANTERN = { top: 0.142, foot: -0.066 };          // the top of its bail, where the hand is, and its foot, in metres from the flame

export function buildLantern(look) {
  const position = [], normal = [], paint = [];
  const colour = (c, k = 1) => new THREE.Color().setHSL(c[0] / 360, c[1] / 100, c[2] / 100, THREE.SRGBColorSpace).multiplyScalar(k);
  const lamp = colour(look.palette.built.lamp), metal = new THREE.Color(0.035, 0.03, 0.026), brass = new THREE.Color(0.2, 0.13, 0.05);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  // one triangle, wound to face outwards from the lantern's own axis (wood and metal are drawn front-side only)
  const tri = (p, q, r, tone, glow = [0, 0, 0], smoothed = null) => {
    n.crossVectors(b.subVectors(q, p), c.subVectors(r, p)).normalize();
    a.copy(p).add(q).add(r).multiplyScalar(1 / 3);
    const out = n.x * a.x + n.z * a.z + n.y * (a.y - 0.02) * 0.2;
    const order = out >= 0 ? [p, q, r] : [p, r, q], glows = out >= 0 ? glow : [glow[0], glow[2], glow[1]];
    if (out < 0) n.negate();
    order.forEach((v, i) => {
      position.push(v.x, v.y, v.z);
      const m = smoothed ? smoothed(v) : n;
      normal.push(m.x, m.y, m.z);
      paint.push(tone.r, tone.g, tone.b, glows[i]);
    });
  };
  const ring = (radius, y, sides, turn = 0) => Array.from({ length: sides }, (_, i) => { const th = turn + (i / sides) * Math.PI * 2; return new THREE.Vector3(Math.cos(th) * radius, y, Math.sin(th) * radius); });
  const round = (v) => new THREE.Vector3(v.x, 0, v.z).normalize();
  // a band between two rings of the same number of sides; glow0 and glow1 are the light of its lower and upper edge
  const band = (lower, upper, tone, glow0 = 0, glow1 = 0, smoothed = round) => {
    for (let i = 0; i < lower.length; i += 1) {
      const j = (i + 1) % lower.length;
      tri(lower[i], lower[j], upper[j], tone, [glow0, glow0, glow1], smoothed);
      tri(lower[i], upper[j], upper[i], tone, [glow0, glow1, glow1], smoothed);
    }
  };
  const lid = (edge, y, tone, up) => {
    const middle = new THREE.Vector3(0, y, 0), face = new THREE.Vector3(0, up, 0);
    for (let i = 0; i < edge.length; i += 1) {
      const j = (i + 1) % edge.length, order = up > 0 ? [middle, edge[j], edge[i]] : [middle, edge[i], edge[j]];
      for (const v of order) { position.push(v.x, v.y, v.z); normal.push(face.x, face.y, face.z); paint.push(tone.r, tone.g, tone.b, 0); }
    }
  };
  const SIDES = 10;
  // the foot, the font that holds the oil, and the burner's collar
  lid(ring(0.043, LANTERN.foot, SIDES), LANTERN.foot, metal, -1);
  band(ring(0.043, LANTERN.foot, SIDES), ring(0.04, -0.054, SIDES), metal);
  band(ring(0.04, -0.054, SIDES), ring(0.03, -0.04, SIDES), brass, 0, 0, (v) => new THREE.Vector3(v.x, 0.03, v.z).normalize());
  band(ring(0.03, -0.04, SIDES), ring(0.027, -0.03, SIDES), metal);
  // the glass: a round globe, widest at the flame, lit from inside (most at the flame's own height)
  const GLASS = [[-0.03, 0.026, 0.55], [-0.014, 0.034, 0.85], [0.002, 0.037, 1], [0.02, 0.034, 0.9], [0.038, 0.027, 0.7], [0.05, 0.022, 0.5]];
  for (let k = 0; k + 1 < GLASS.length; k += 1) {
    const [y0, r0, g0] = GLASS[k], [y1, r1, g1] = GLASS[k + 1];
    band(ring(r0, y0, SIDES), ring(r1, y1, SIDES), lamp, g0, g1);
  }
  // the cap over it, and its vent
  band(ring(0.036, 0.05, SIDES), ring(0.014, 0.07, SIDES), metal, 0, 0, (v) => new THREE.Vector3(v.x, 0.02, v.z).normalize());
  lid(ring(0.036, 0.05, SIDES), 0.05, metal, -1);
  band(ring(0.014, 0.07, SIDES), ring(0.014, 0.08, SIDES), metal);
  lid(ring(0.014, 0.08, SIDES), 0.08, metal, 1);
  // a thin square rod from p to q
  const rod = (p, q, thick, tone) => {
    const along = new THREE.Vector3().subVectors(q, p).normalize(), ref = Math.abs(along.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const u = new THREE.Vector3().crossVectors(along, ref).normalize().multiplyScalar(thick), v = new THREE.Vector3().crossVectors(along, u).normalize().multiplyScalar(thick);
    const corners = (at) => [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([i, j]) => new THREE.Vector3().copy(at).addScaledVector(u, i).addScaledVector(v, j));
    const lower = corners(p), upper = corners(q);
    for (let i = 0; i < 4; i += 1) {
      const j = (i + 1) % 4;
      // (a rod's faces look away from the rod, not from the lantern's axis)
      const face = new THREE.Vector3().addVectors(lower[i], lower[j]).multiplyScalar(0.5).sub(p).normalize();
      for (const corner of [lower[i], lower[j], upper[j], lower[i], upper[j], upper[i]]) { position.push(corner.x, corner.y, corner.z); normal.push(face.x, face.y, face.z); paint.push(tone.r, tone.g, tone.b, 0); }
    }
  };
  // the guard: four wires from the collar up to the cap, bowed out round the glass, and one ring round them
  for (let i = 0; i < 4; i += 1) {
    const th = Math.PI / 4 + (i * Math.PI) / 2, at = (y, r) => new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r);
    const points = [at(-0.034, 0.03), at(-0.012, 0.043), at(0.012, 0.045), at(0.036, 0.04), at(0.052, 0.034)];
    for (let k = 0; k + 1 < points.length; k += 1) rod(points[k], points[k + 1], 0.0016, metal);
  }
  { const hoop = ring(0.0455, 0.004, 12); for (let i = 0; i < 12; i += 1) rod(hoop[i], hoop[(i + 1) % 12], 0.0013, metal); }
  // the bail: from either side of the cap up and over to the hand
  const BAIL = 9;
  for (let k = 0; k < BAIL; k += 1) {
    const at = (t) => { const th = Math.PI * t; return new THREE.Vector3(-Math.cos(th) * 0.047, 0.05 + Math.sin(th) * (LANTERN.top - 0.05), 0); };
    rod(at(k / BAIL), at((k + 1) / BAIL), 0.0017, metal);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normal), 3));
  geometry.setAttribute('aPaint', new THREE.BufferAttribute(new Float32Array(paint), 4));
  geometry.computeBoundingSphere();
  return geometry;
}
