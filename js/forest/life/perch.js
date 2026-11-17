import * as THREE from 'three';
import { RECORD } from '../world/layout.js';
import { WORLD } from '../world/terrain.js';

// Where an animal can stand, read from what was built: a trunk's surface and its stubs from the vertices of
// the plant's finest level (plants/conifer.js, plants/deadwood.js give `perch`), the ground from the
// triangles the ground is drawn with. A second copy of the formula that shaped a trunk would put a creeper's
// feet a few centimetres off the bark it is drawn on.

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();

// One plant of a kind as a place: its perch data and the transform that stands it in the world.
export function standing(perch, records, index) {
  const o = index * RECORD, matrix = new THREE.Matrix4(), yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), records[o + 3]);
  matrix.compose(new THREE.Vector3(records[o], records[o + 1], records[o + 2]), yaw, new THREE.Vector3().setScalar(records[o + 4]));
  // the height of each ring of the trunk above the plant's foot, in the world's metres, and the ring's middle
  // and widest reach in the plant's own space: a trunk leans and swells, so its axis is not a line up from its foot
  const { base, radial, rings } = perch.trunk || { base: 0, radial: 0, rings: 0 }, heights = [], axis = [];       // (a kind with no trunk, a willow or a vine maple, has limbs alone)
  for (let j = 0; j < rings; j += 1) {
    let x = 0, y = 0, z = 0, reach = 0;
    for (let i = 0; i < radial; i += 1) { const v = (base + j * (radial + 1) + i) * 3; x += perch.position[v]; y += perch.position[v + 1]; z += perch.position[v + 2]; }
    x /= radial; y /= radial; z /= radial;
    for (let i = 0; i < radial; i += 1) { const v = (base + j * (radial + 1) + i) * 3; reach = Math.max(reach, Math.hypot(perch.position[v] - x, perch.position[v + 2] - z)); }
    heights.push(y * records[o + 4]);
    axis.push({ x, y, z, reach });
  }
  return { perch, matrix, yaw, scale: records[o + 4], foot: new THREE.Vector3(records[o], records[o + 1], records[o + 2]), heights, axis };
}

// How far a point of the plant's own space stands clear of the trunk: its distance from the trunk's axis at
// its height, less the trunk's widest reach there. Negative inside the wood.
function clearOf(place, p) {
  const a = place.axis;
  let k = 0;
  while (k < a.length - 2 && a[k + 1].y < p.y) k += 1;
  const f = Math.min(1, Math.max(0, (p.y - a[k].y) / Math.max(a[k + 1].y - a[k].y, 1e-6)));
  const x = a[k].x + (a[k + 1].x - a[k].x) * f, z = a[k].z + (a[k + 1].z - a[k].z) * f;
  return Math.hypot(p.x - x, p.z - z) - (a[k].reach + (a[k + 1].reach - a[k].reach) * f);
}

const vertex = (perch, tube, j, i, out) => out.fromArray(perch.position, (tube.base + j * (tube.radial + 1) + (((i % tube.radial) + tube.radial) % tube.radial)) * 3);

// A point on a tube of the plant: `along` counts rings (2.5 is halfway between ring 2 and ring 3), `turn` is the
// share of the way round. Fills out.point, out.normal (out of the wood) and out.up (along the tube), in the
// world. The point lies on one of the two triangles the tube is drawn with there, as Mesh.settle has it.
export function onTube(place, tube, along, turn, out) {
  const perch = place.perch, k = Math.min(tube.rings - 2, Math.max(0, Math.floor(along))), f = Math.min(1, Math.max(0, along - k));
  const v = (((turn % 1) + 1) % 1) * tube.radial, whole = Math.min(tube.radial - 1, Math.floor(v)), g = v - whole;
  vertex(perch, tube, k, whole, _a); vertex(perch, tube, k, whole + 1, _b); vertex(perch, tube, k + 1, whole, _c); vertex(perch, tube, k + 1, whole + 1, _d);
  if (g + f <= 1) {
    out.point.copy(_a).addScaledVector(_b.clone().sub(_a), g).addScaledVector(_c.clone().sub(_a), f);
    out.normal.crossVectors(_c.clone().sub(_a), _b.clone().sub(_a));
  } else {
    out.point.copy(_d).addScaledVector(_c.clone().sub(_d), 1 - g).addScaledVector(_b.clone().sub(_d), 1 - f);
    out.normal.crossVectors(_b.clone().sub(_d), _c.clone().sub(_d));
  }
  out.up.subVectors(_c, _a).normalize();
  out.point.applyMatrix4(place.matrix);
  out.normal.normalize().applyQuaternion(place.yaw);
  out.up.applyQuaternion(place.yaw);
  return out;
}

// The trunk at a height above the plant's foot (metres in the world) and a share of the way round.
export function onTrunk(place, height, turn, out) {
  const h = place.heights;
  let k = 0;
  while (k < h.length - 2 && h[k + 1] < height) k += 1;
  const f = Math.min(1, Math.max(0, (height - h[k]) / Math.max(h[k + 1] - h[k], 1e-6)));
  onTube(place, place.perch.trunk, k + f, turn, out);
  // The normal has to point out of the trunk, whichever way the tube was wound: away from the trunk's own axis
  // at that height. (Away from its foot, as this first had it, is not the same thing near the top of a tall
  // trunk, which is thin there and no longer over its foot: above 15 m, where no bird yet goes, 2,136 of 45,228
  // places tried came out pointing into the wood; at 15 m and under, none.)
  const axis = place.axis;
  _a.set(axis[k].x + (axis[k + 1].x - axis[k].x) * f, 0, axis[k].z + (axis[k + 1].z - axis[k].z) * f).applyQuaternion(place.yaw).multiplyScalar(place.scale);
  _b.copy(out.point).sub(place.foot).sub(_a); _b.y = 0;
  if (out.normal.dot(_b) < 0) out.normal.negate();
  if (out.up.y < 0) out.up.negate();
  return out;
}

// The top of a stub, out on the part of it that is clear of the trunk: where a bird perches on it. Fills
// out.point, out.up (the world's up) and out.along (the way the stub points), and returns the stub's radius
// there, or 0 if too little of it stands out of the bark to perch on. A stub is rooted inside the trunk, and
// on a giant a short one hardly comes out: a place two-thirds of the way along one was inside the wood.
export function onStub(place, stub, out) {
  const perch = place.perch, last = stub.rings - 1, STEPS = 8;
  const middle = (j, into) => {
    into.set(0, 0, 0);
    for (let i = 0; i < stub.radial; i += 1) into.add(vertex(perch, stub, j, i, _a));
    return into.divideScalar(stub.radial);
  };
  const at = (t, into) => {                                      // a place along the stub's middle line, 0 at its root .. 1 at its end
    const k = Math.min(last - 1, Math.floor(t * last)), f = t * last - k;
    return into.copy(middle(k, _b)).lerp(middle(k + 1, _c), f);
  };
  let from = -1;
  for (let i = 0; i <= last * STEPS; i += 1) if (clearOf(place, at(i / (last * STEPS), _d)) > 0.03 / place.scale) { from = i / (last * STEPS); break; }
  if (from < 0) return 0;
  const length = at(1, _d).distanceTo(at(from, new THREE.Vector3())) * place.scale;
  if (length < 0.25) return 0;
  const t = from + (1 - from) * 0.6, k = Math.min(last - 1, Math.floor(t * last));
  at(t, _d);
  const radius = THREE.MathUtils.lerp(vertex(perch, stub, k, 0, _a).distanceTo(middle(k, _b)), vertex(perch, stub, k + 1, 0, _a).distanceTo(middle(k + 1, _c)), t * last - k) * place.scale;
  out.along.subVectors(middle(last, _b), middle(0, _c)).applyQuaternion(place.yaw).normalize();
  out.up.set(0, 1, 0);
  out.point.copy(_d).applyMatrix4(place.matrix);
  out.point.y += radius * 0.96;
  return radius;
}

// The upper side of a limb of the plant, a share of the way along it: where a bird perches on a bough. `limbs`
// is the plant's perch.limbs (its limb wood as built, and the tubes of it that the next detail level keeps).
// Fills out.point, out.along (the way the limb runs, outwards) and out.up (the world's up), and returns the
// limb's radius there, in the world's metres. A limb's wood has no freedom in the wind: only its boughs move.
export function onLimb(place, limbs, tube, share, out) {
  const last = tube.rings - 1, t = Math.min(0.999, Math.max(0, share)) * last, k = Math.min(last - 1, Math.floor(t)), f = t - k;
  const middle = (j, into) => { into.set(0, 0, 0); for (let i = 0; i < tube.radial; i += 1) into.add(vertex(limbs, tube, j, i, _a)); return into.divideScalar(tube.radial); };
  middle(k, _b); middle(k + 1, _c);
  const r0 = vertex(limbs, tube, k, 0, _a).distanceTo(_b), r1 = vertex(limbs, tube, k + 1, 0, _a).distanceTo(_c), radius = (r0 + (r1 - r0) * f) * place.scale;
  out.along.subVectors(_c, _b).applyQuaternion(place.yaw).normalize();
  out.point.copy(_b).lerp(_c, f).applyMatrix4(place.matrix);
  out.up.set(0, 1, 0);
  // (the limb's upper side straight above that place on its middle line: on a limb that rises, further up than its
  // radius, by one over the cosine of its slope. Raised by the radius alone, a bird on a bigleaf maple's great limbs
  // stood with its feet 5 to 15 cm in the wood. No more than twice the radius: a limb steeper than that is no perch.)
  out.point.y += (radius * 0.96) / Math.max(0.5, Math.hypot(out.along.x, out.along.z));
  return radius;
}

// The height of the ground as it is drawn: the terrain's own triangles, two to each 2 m square.
export function groundUnder(heightAt, x, z) {
  const step = 2, i = Math.floor((x - WORLD.minX) / step), j = Math.floor((z - WORLD.minZ) / step);
  const x0 = WORLD.minX + i * step, z0 = WORLD.minZ + j * step, u = (x - x0) / step, v = (z - z0) / step;
  const a = heightAt(x0, z0), b = heightAt(x0 + step, z0), c = heightAt(x0, z0 + step), d = heightAt(x0 + step, z0 + step);
  return u + v <= 1 ? a + (b - a) * u + (c - a) * v : d + (c - d) * (1 - u) + (b - d) * (1 - v);
}
