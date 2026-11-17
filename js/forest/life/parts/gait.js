import * as THREE from 'three';

// A bird that walks (the grouse's, 2026-11-16). The bird's rig (life/rig.js) sets both feet alike, side by side,
// which is how a bird that hops stands and hops; a grouse walks, a foot at a time, its head held still in the air
// and then thrust on. Two fields of a pose, each read only where it is given, so every other bird is posed as it was
// (life/rig.js calls `gaitPose` at the end of its own):
//   feet.walk: [right ahead, right up, left ahead, left up]   metres, in the bird's own frame: where each foot is,
//              ahead of where the bird stands (+) or behind it, and how high it is lifted. Each leg is bent again to
//              reach its own foot, as life/rig.js bends both to reach the one place; a lifted foot's toes curl,
//              the foot held a little up so that their tips stay above the ground (they drop about half the lift).
//              Only with the feet 'flat' (the rig's own 'grip' and 'tuck' are left as they are).
//   reach, dip  metres: the head carried forward of where the neck holds it (along the ground, the way the bird
//              faces), and down. The skin of the neck goes with it as far as the head's hold on it reaches.
// Neither is in a bird's neutral pose (life/bodies.js `rest`): a family that uses them names them in every one of its
// activities' poses (life/families/fowl.js does), so that none is carried into the next. The numbers are the
// agent's own.

const AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
const _inv = new THREE.Quaternion(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _shin = new THREE.Quaternion(), _tarsus = new THREE.Quaternion();
const _knee = new THREE.Vector3(), _foot = new THREE.Vector3(), _heel = new THREE.Vector3(), _dir = new THREE.Vector3(), _bend = new THREE.Vector3();
const _front = new THREE.Vector3(), _back = new THREE.Vector3(), _seg = new THREE.Vector3(), _bind = new THREE.Vector3(), _off = new THREE.Vector3();

// The turn that carries a bone's bind direction, straight down, onto `dir`, keeping its front as near `ahead` as it
// can (as life/rig.js has it).
function aimDown(dir, ahead, out) {
  _y.copy(dir).negate();
  _x.copy(ahead).addScaledVector(_y, -ahead.dot(_y));
  if (_x.lengthSq() < 1e-8) _x.set(0, 0, 1).cross(_y);
  _x.normalize();
  _z.crossVectors(_x, _y);
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}

export function gaitPose(kind, by, P) {
  const feet = P.feet;
  if (feet && feet.walk && (feet.mode || 'flat') === 'flat') legs(kind, by, feet, feet.walk);
  // the head carried forward and down. One skeleton poses every animal of a kind in turn: once moved, it is put back
  // for an animal whose pose does not move it.
  const head = by.head;
  if (P.reach != null || P.dip != null) {
    const pivots = kind.levels[0].pivots;
    _bind.subVectors(pivots.head, pivots.body);
    _off.set(P.reach ?? 0, -(P.dip ?? 0), 0).applyQuaternion(_inv.copy(by.body.quaternion).invert());
    head.position.copy(_bind).add(_off);
    head.userData.moved = true;
  } else if (head.userData.moved) {
    const pivots = kind.levels[0].pivots;
    head.position.subVectors(pivots.head, pivots.body);
    head.userData.moved = false;
  }
}

// Each leg bent to reach its own foot: life/rig.js's own solution, for one foot at a time.
function legs(kind, by, feet, walk) {
  const body = by.body.quaternion, L1 = kind.shin, L2 = kind.tarsus, width = feet.width ?? kind.knee * 0.9, toeOut = feet.toeOut ?? 0.12;
  _inv.copy(body).invert();
  _front.set(1, 0, 0).applyQuaternion(body);
  _back.set(-1, -0.25, 0).applyQuaternion(body).normalize();
  for (const side of [1, -1]) {
    const name = side > 0 ? 'R' : 'L', k = side > 0 ? 0 : 2, up = Math.max(0, walk[k + 1] || 0);
    _knee.set(0, 0, side * kind.knee).applyQuaternion(body).add(by.body.position);
    _foot.set(walk[k] || 0, kind.pad + up, side * width);
    _dir.subVectors(_foot, _knee);
    const reach = Math.min(Math.max(_dir.length(), Math.abs(L1 - L2) + 1e-5), (L1 + L2) * 0.999);
    _dir.normalize();
    const along = (L1 * L1 - L2 * L2 + reach * reach) / (2 * reach);
    _bend.copy(_back).addScaledVector(_dir, -_back.dot(_dir)).normalize();
    _heel.copy(_knee).addScaledVector(_dir, along).addScaledVector(_bend, Math.sqrt(Math.max(L1 * L1 - along * along, 0)));
    aimDown(_seg.subVectors(_heel, _knee).normalize(), _front, _shin);
    by[`shin${name}`].quaternion.copy(_inv).multiply(_shin);
    _foot.copy(_knee).addScaledVector(_dir, reach);
    aimDown(_seg.subVectors(_foot, _heel).normalize(), _front, _tarsus);
    by[`tarsus${name}`].quaternion.copy(_shin).invert().multiply(_tarsus);
    // the toes lie the way the bird faces, a little outwards; a lifted foot's curl, more the higher it is lifted
    const curl = Math.min(1, up / Math.max(kind.toeThick * 6, 1e-4));
    _q2.copy(_tarsus).invert();
    _q.setFromAxisAngle(AY, -side * toeOut).multiply(_q3.setFromAxisAngle(AZ, 0.25 * curl));
    by[`toes${name}`].quaternion.copy(_q2).multiply(_q);
    _q.setFromAxisAngle(AY, -side * toeOut).multiply(_q3.setFromAxisAngle(AZ, 0.6 * curl));
    by[`hind${name}`].quaternion.copy(_q2).multiply(_q);
    for (const toe of kind.toes) {
      _seg.set(Math.sin(toe.yaw) * side, 0, -Math.cos(toe.yaw));
      _q.setFromAxisAngle(_seg, 0.45 * curl);
      by[`toe${toe.key}B${name}`].quaternion.copy(_q);
      by[`toe${toe.key}C${name}`].quaternion.copy(_q);
    }
  }
}
