import * as THREE from 'three';
import { displayPose } from './parts/display.js';
import { gaitPose } from './parts/gait.js';
import { BONES, PARENT, TOES, toeYaw, buildBird } from './bird.js';
import { swimPose } from './parts/swim.js';

// A species ready to be made into birds: its sheet, and its three detail levels built once.
export function buildKind(sheet) {
  const levels = [0, 1, 2].map((level) => buildBird(sheet, level));
  const leg = sheet.shape.leg, MM = 0.001;
  // where the tip of the tail is from the joint the tail turns on, read from the mesh
  const near = levels[0], at = near.geometry.getAttribute('position'), tailTip = new THREE.Vector3();
  for (const i of near.marks.tailTip) tailTip.add(_x.fromBufferAttribute(at, i));
  tailTip.divideScalar(near.marks.tailTip.length).sub(near.pivots.tail);
  return {
    sheet, levels, tailTip,
    // lengths the poses need, in metres
    shin: leg.shin * MM, tarsus: leg.tarsus * MM, pad: leg.thick[2] * 0.6 * MM, knee: leg.knee[2] * MM,
    straight: (leg.shin + leg.tarsus + leg.thick[2] * 0.6) * MM,              // how high the hips stand on straight legs
    // each front toe: which way it points, and how long one of its three joints is; the hind toe's length; a toe's thickness
    toes: TOES.map((key) => ({ key, yaw: toeYaw(leg, key), joint: (key === 'M' ? leg.toes.mid : key === 'O' ? leg.toes.side : leg.toes.side * 0.96) * MM / 3 })),
    hindToe: leg.toes.hind * MM, toeThick: leg.thick[2] * 0.62 * MM,
    triangles: levels.map((l) => l.triangles),
  };
}

const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
const _body = new THREE.Quaternion(), _inv = new THREE.Quaternion(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _shin = new THREE.Quaternion(), _tarsus = new THREE.Quaternion();
const _knee = new THREE.Vector3(), _foot = new THREE.Vector3(), _heel = new THREE.Vector3(), _dir = new THREE.Vector3(), _bend = new THREE.Vector3();
const _front = new THREE.Vector3(), _back = new THREE.Vector3(), _seg = new THREE.Vector3();
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const TINY = 0.001;

// The turn that carries a bone's bind direction, straight down, onto `dir`, keeping its front as near `ahead` as it can.
function aimDown(dir, ahead, out) {
  _y.copy(dir).negate();
  _x.copy(ahead).addScaledVector(_y, -ahead.dot(_y));
  if (_x.lengthSq() < 1e-8) _x.set(0, 0, 1).cross(_y);
  _x.normalize();
  _z.crossVectors(_x, _y);
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}

// One bird: a skeleton, and its skin at three detail levels sharing it, all under one group. The group's
// origin is where the feet grip, +x the way the bird faces, +y away from what it stands on.
// With no material it is the skeleton alone: the forest draws every bird of a kind together (life/flock.js),
// from the bones this poses.
export function createBird(kind, material = null) {
  const bones = BONES.map((name) => { const bone = new THREE.Bone(); bone.name = name; return bone; });
  const by = Object.fromEntries(BONES.map((name, i) => [name, bones[i]]));
  const pivots = kind.levels[0].pivots;
  for (const name of BONES) {
    const parent = PARENT[name];
    if (!parent) continue;
    by[parent].add(by[name]);
    by[name].position.copy(pivots[name]).sub(pivots[parent]);
  }
  const group = new THREE.Group();
  group.add(by.root);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);                  // the bind pose is the pose the bones are in now
  const identity = new THREE.Matrix4();
  const meshes = !material ? [] : kind.levels.map((level, i) => {
    const mesh = new THREE.SkinnedMesh(level.geometry, material);
    mesh.bind(skeleton, identity);
    mesh.boundingSphere = level.geometry.boundingSphere;       // a skinned mesh would otherwise work its own out, once, from the bind pose
    mesh.visible = i === 0;
    group.add(mesh);
    return mesh;
  });
  let shown = 0;

  // A pose. Angles are radians; every part has a default, so a pose names only what it changes.
  //   pitch      the body's axis above the level              lift   how high the hips are, as a share of straight legs
  //   lean       the hips' place ahead of the feet (m)        roll   the body rolled about its own axis
  //   head       { yaw (+ to the bird's right), pitch (+ up), roll }, measured from the way the bird faces, not from its body
  //   gape       the bill open, 0..1                          tail   { pitch (+ up), fan, yaw, prop }
  //                                                           prop: instead of a pitch, how far above what the bird stands on
  //                                                           the tail's tip rests (m): a creeper's tail, let down onto the bark
  //   spread     0 wings folded .. 1 spread                   flap, hand, sweep   the spread wing: raised, its hand raised further, swept back
  //   droop      the folded wing let down                     feet   { mode: 'flat' | 'grip' | 'tuck', width, ahead, round, toeOut }
  //                                                           round: the radius of the branch the toes close on (m), for 'grip'
  function pose(P = {}) {
    const pitch = P.pitch ?? 0.5, lift = P.lift ?? 0.78, head = P.head || {}, tail = P.tail || {}, feet = P.feet || {};
    const spread = Math.min(1, Math.max(0, P.spread ?? 0));
    _body.setFromAxisAngle(AZ, pitch);
    if (P.roll) _body.multiply(_q.setFromAxisAngle(AX, P.roll));
    by.body.position.set(P.lean ?? 0, kind.straight * lift, 0);
    by.body.quaternion.copy(_body);
    _inv.copy(_body).invert();

    // the head keeps its own direction whatever the body does under it
    _q.setFromAxisAngle(AY, -(head.yaw ?? 0)).multiply(_q2.setFromAxisAngle(AZ, head.pitch ?? 0.05));
    if (head.roll) _q.multiply(_q2.setFromAxisAngle(AX, head.roll));
    by.head.quaternion.copy(_inv).multiply(_q);
    by.jaw.quaternion.setFromAxisAngle(AZ, -(P.gape ?? 0) * 0.5);

    let tailPitch = tail.pitch ?? 0;
    if (tail.prop != null) {
      // The tip's height is the joint's height plus the tail turned by the body's pitch and its own: solve for its own.
      const t = kind.tailTip, reach = Math.hypot(t.x, t.y);
      _seg.copy(by.tail.position).applyQuaternion(_body).add(by.body.position);
      const turned = Math.PI - Math.asin(Math.min(1, Math.max(-1, (tail.prop - _seg.y) / reach))) - Math.atan2(t.y, t.x);
      tailPitch = pitch - Math.atan2(Math.sin(turned), Math.cos(turned));
    }
    by.tail.quaternion.setFromAxisAngle(AZ, -tailPitch).multiply(_q.setFromAxisAngle(AY, tail.yaw ?? 0));
    by.tailR.quaternion.setFromAxisAngle(AY, tail.fan ?? 0);
    by.tailL.quaternion.setFromAxisAngle(AY, -(tail.fan ?? 0));

    // one pair of wings is shown and the other drawn into its joint
    for (const side of [1, -1]) {
      const name = side > 0 ? 'R' : 'L';
      by[`fold${name}`].scale.setScalar(Math.max(TINY, 1 - spread));
      by[`fold${name}`].quaternion.setFromAxisAngle(AZ, P.droop ?? 0);                    // the wing lies back from its bend: this lets its tip down
      by[`arm${name}`].scale.setScalar(Math.max(TINY, spread));
      by[`arm${name}`].quaternion.setFromAxisAngle(AY, -side * (P.sweep ?? 0)).multiply(_q.setFromAxisAngle(AX, -side * (P.flap ?? 0)));
      by[`hand${name}`].quaternion.setFromAxisAngle(AX, -side * (P.hand ?? 0));
    }

    // legs: a foot stays where it grips, and its leg bends to reach it, the heel going back
    const mode = feet.mode || 'flat', width = feet.width ?? kind.knee * 0.9, toeOut = feet.toeOut ?? 0.12;
    // Round a branch every joint of a toe is a chord of the circle the toe's middle lies on, so each turns on the
    // one before by the angle that chord takes up. A toe that crosses the branch aslant has less of a curve to follow.
    const round = (feet.round ?? 0.02) + kind.toeThick;
    const bend = (length, yaw = 0) => (mode === 'grip' ? 2 * Math.asin(Math.min(1, (length * Math.cos(yaw) ** 2) / (2 * round))) : 0);
    const L1 = kind.shin, L2 = kind.tarsus;
    _front.set(1, 0, 0).applyQuaternion(_body);
    _back.set(-1, -0.25, 0).applyQuaternion(_body).normalize();
    for (const side of [1, -1]) {
      const name = side > 0 ? 'R' : 'L';
      _knee.set(0, 0, side * kind.knee).applyQuaternion(_body).add(by.body.position);
      // tucked, the foot is drawn up under the belly
      if (mode === 'tuck') _foot.set(L2 * 0.15, -L1 * 0.2, side * kind.knee * 0.9).applyQuaternion(_body).add(by.body.position);       // up in the belly's feathers: lower, the toes were two marks on the belly from beneath
      else _foot.set(feet.ahead ?? 0, kind.pad, side * width);
      _dir.subVectors(_foot, _knee);
      const reach = Math.min(Math.max(_dir.length(), Math.abs(L1 - L2) + 1e-5), (L1 + L2) * 0.999);
      _dir.normalize();
      const along = (L1 * L1 - L2 * L2 + reach * reach) / (2 * reach);
      _bend.copy(_back).addScaledVector(_dir, -_back.dot(_dir)).normalize();
      _heel.copy(_knee).addScaledVector(_dir, along).addScaledVector(_bend, Math.sqrt(Math.max(L1 * L1 - along * along, 0)));
      aimDown(_seg.subVectors(_heel, _knee).normalize(), _front, _shin);
      by[`shin${name}`].quaternion.copy(_inv).multiply(_shin);
      _foot.copy(_knee).addScaledVector(_dir, reach);                                    // where the foot is, if the leg could not reach
      aimDown(_seg.subVectors(_foot, _heel).normalize(), _front, _tarsus);
      by[`tarsus${name}`].quaternion.copy(_shin).invert().multiply(_tarsus);
      const toes = by[`toes${name}`], hind = by[`hind${name}`];
      if (mode === 'tuck') {
        toes.quaternion.setFromAxisAngle(AZ, -1.0); hind.quaternion.setFromAxisAngle(AZ, 1.0);       // closed, against the tarsus
      } else {
        // the toes lie the way the bird faces, a little outwards: flat, or closed round a perch
        _q2.copy(_tarsus).invert();
        _q.setFromAxisAngle(AY, -side * toeOut).multiply(_q3.setFromAxisAngle(AZ, -bend(kind.toes[0].joint) / 2));
        toes.quaternion.copy(_q2).multiply(_q);
        _q.setFromAxisAngle(AY, -side * toeOut).multiply(_q3.setFromAxisAngle(AZ, bend(kind.hindToe) / 2));
        hind.quaternion.copy(_q2).multiply(_q);
      }
      for (const toe of kind.toes) {
        // each joint turns downwards about the line across its own toe
        _seg.set(Math.sin(toe.yaw) * side, 0, -Math.cos(toe.yaw));
        _q.setFromAxisAngle(_seg, mode === 'tuck' ? 0.5 : bend(toe.joint, toe.yaw));
        by[`toe${toe.key}B${name}`].quaternion.copy(_q);
        by[`toe${toe.key}C${name}`].quaternion.copy(_q);
      }
    }
    // (a bird that swims: its feet paddling under it, its neck and its size, life/parts/swim.js)
    if (kind.sheet.shape.float) swimPose(by, kind, P);
    displayPose(kind, by, P); gaitPose(kind, by, P);     // (the grouse's: a display's parts, and a walk a foot at a time: life/parts/)
  }

  // Which detail level is drawn; -1 hides the bird.
  function setLevel(level) {
    if (level === shown) return;
    meshes.forEach((mesh, i) => { mesh.visible = i === level; });
    shown = level;
  }

  pose();
  return { group, by, bones, skeleton, meshes, kind, pose, setLevel, get level() { return shown; } };
}
