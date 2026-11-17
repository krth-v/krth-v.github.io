import * as THREE from 'three';
import { BAT_BONES, BAT_PARENT } from './bat.js';

// One bat's skeleton, posed. With no material it is the skeleton alone (life/flock.js poses every animal of a kind
// with it); with one, its skinned meshes too (the contact sheet). The group's origin is where the bat stands or hangs:
// in flight, the middle of its body. The bind pose (life/bat.js) is the bat in level flight with its wings spread flat,
// and every turn here is a turn from that.
//
// A pose (every part has a default, so a pose names only what it changes):
//   flap      how much the wings beat (0 held out .. 1 the search flight's stroke)      cycle  where in the stroke (0..1):
//             0 is the top of the upstroke, 0.55 the bottom of the downstroke; while crawling, where in the shuffle
//   fold      0 the wings spread .. 1 folded against the body (the arm back, the forearm forward, the fingers laid back)
//   hang      the bat hangs head down from its feet, which are at the origin (the roost)
//   crawl     the bat on a surface on its folded wings' thumbs and its feet: its feet's lowest point at the origin
//   tilt      the body's axis above level, degrees (a bat clinging to bark: head up the trunk)      pitch, roll  in flight, degrees
//   head      { yaw (+ to its right), pitch (+ up) }, radians, from the way the body faces
//   ears      -1 laid back .. 0 .. 1 pricked          tail   0 .. 1 the tail's membrane let down          scale  the sheet's size times
//
// How a bat crawls, hangs and beats its wings is drawn from no source: the sources have that it hangs by thumbs and
// toes with its wings tucked (ADW) and its wingbeat (each kind's file: life/species/yumaMyotis.js and the rest); every angle here is the agent's.

const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const qx = new THREE.Quaternion(), qy = new THREE.Quaternion(), qz = new THREE.Quaternion(), qq = new THREE.Quaternion();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const RAD = Math.PI / 180;
const _v = new THREE.Vector3();

// where in the stroke the wing is, -1 at the top of the upstroke to +1 at the bottom of the downstroke
const stroke = (phi) => {
  const p = ((phi % 1) + 1) % 1, down = 0.55;
  return p < down ? -Math.cos(Math.PI * p / down) : Math.cos(Math.PI * (p - down) / (1 - down));
};

export function createBat(kind, material = null) {
  const bones = BAT_BONES.map((name) => { const bone = new THREE.Bone(); bone.name = name; return bone; });
  const by = Object.fromEntries(BAT_BONES.map((name, i) => [name, bones[i]]));
  const built = kind.levels[0], pivots = built.pivots;
  for (const name of BAT_BONES) {
    const parent = BAT_PARENT[name];
    if (!parent) continue;
    by[parent].add(by[name]);
    by[name].position.copy(pivots[name]).sub(pivots[parent]);
  }
  const group = new THREE.Group();
  group.add(by.root);
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones);
  const identity = new THREE.Matrix4();
  const meshes = !material ? [] : kind.levels.map((level, i) => {
    const mesh = new THREE.SkinnedMesh(level.geometry, material);
    mesh.bind(skeleton, identity);
    mesh.boundingSphere = level.geometry.boundingSphere;
    mesh.visible = i === 0;
    group.add(mesh);
    return mesh;
  });
  let shown = 0;
  // the toes' ends, in each foot's own frame, for putting the feet where the bat holds on
  const toes = ['L', 'R'].map((s) => ({ bone: by['foot' + s], at: built.joints[s].toe.clone().sub(built.joints[s].ankle) }));

  const set = (bone, ex, ey, ez) => { bone.quaternion.copy(qx.setFromAxisAngle(AX, ex)).multiply(qy.setFromAxisAngle(AY, ey)).multiply(qz.setFromAxisAngle(AZ, ez)); };

  function pose(P = {}) {
    group.scale.setScalar(P.scale ?? 1);
    const crawl = clamp(P.crawl ?? 0, 0, 1), hang = clamp(P.hang ?? 0, 0, 1), held = Math.max(crawl, hang);
    const fold = clamp(Math.max(P.fold ?? 0, held), 0, 1), spread = 1 - fold;
    const flap = clamp(P.flap ?? 0, 0, 1) * spread, phi = P.cycle ?? 0, head = P.head || {};
    const a0 = stroke(phi), a1 = stroke(phi - 0.1), a2 = stroke(phi - 0.2);          // the arm leads, the hand follows
    const shuffle = Math.sin(phi * Math.PI * 2) * crawl;
    for (const [side, s] of [['L', -1], ['R', 1]]) {
      const alt = side === 'R' ? shuffle : -shuffle;
      // the arm: raised and lowered in a stroke, swung back and folded to the body
      set(by['hum' + side], s * (flap * (0.38 * a0 - 0.05) + fold * (0.9 + hang * 0.1)), s * (fold * -63 * RAD + alt * 0.25), 0);
      set(by['fore' + side], s * flap * 0.2 * a1, s * (fold * 111 * RAD - flap * 0.3 * (1 - a1) * 0.5), 0);
      set(by['hand' + side], s * flap * 0.35 * a2, s * (fold * -156 * RAD), 0);
      // the fingers draw together on the upstroke and lie together folded; the tips bend with the stroke
      const close = fold + flap * 0.22 * (1 - a2) * 0.5;
      set(by['d2' + side], 0, 0, 0);
      set(by['d3' + side], 0, 0, 0);
      set(by['d4' + side], 0, s * close * 18 * RAD, 0);
      set(by['d5' + side], 0, s * close * 40 * RAD, 0);
      set(by['t3' + side], s * flap * 0.4 * a2, s * fold * 165 * RAD, 0);
      set(by['t4' + side], s * flap * 0.3 * a2, s * fold * 165 * RAD, 0);
      set(by['thumb' + side], 0, 0, crawl * (0.25 + 0.3 * alt) - hang * 0.0);
      // the hind legs: trailing in flight, under the body when it crawls, up to the roost when it hangs
      set(by['thigh' + side], -s * crawl * 0.8, s * -fold * 0.6, crawl * (0.9 + 0.2 * -alt) + flap * -0.12 * a1);
      set(by['shin' + side], 0, s * -fold * 0.25, crawl * -0.7);
      set(by['foot' + side], 0, 0, crawl * 1.0 - hang * 0.1);
      set(by['ear' + side], s * -0.35 * (P.ears ?? 0.3), 0, 0);
    }
    set(by.tail, 0, 0, -(P.tail ?? 0) * 0.6 - flap * 0.1 * a1);
    // the body: level in flight (the wings' stroke bobs it), nose up for a bat on bark, hung head down in the roost
    const bob = 0.0016 * flap * -a1;
    qq.setFromAxisAngle(AZ, ((P.pitch ?? 0) + (P.tilt ?? 0)) * RAD * (1 - hang) - hang * Math.PI / 2);
    by.body.quaternion.copy(qq).multiply(qx.setFromAxisAngle(AX, (P.roll ?? 0) * RAD));
    // the head turns in the bat's own frame; a hanging bat lifts it to look out
    set(by.head, 0, -(head.yaw ?? 0), (head.pitch ?? 0) + hang * 0.95 - crawl * 0.2);
    by.root.position.set(0, bob, 0);
    group.updateMatrixWorld(true);
    // a bat that holds on has its feet where it holds: hung, the toes' middle is the origin; crawling, the lowest is
    if (held > 0) {
      let lowest = Infinity, highest = -Infinity, mx = 0, mz = 0;
      for (const toe of toes) {
        _v.copy(toe.at).applyMatrix4(toe.bone.matrixWorld);
        _v.applyMatrix4(group.matrixWorld.clone().invert());
        lowest = Math.min(lowest, _v.y); highest = Math.max(highest, _v.y); mx += _v.x / 2; mz += _v.z / 2;
      }
      by.root.position.set(-mx * held, -(crawl > hang ? lowest : highest) * held + bob * (1 - held), -mz * held);
      group.updateMatrixWorld(true);
    }
  }

  function setLevel(level) {
    if (level === shown) return;
    meshes.forEach((mesh, i) => { mesh.visible = i === level; });
    shown = level;
  }

  pose();
  return { group, by, bones, skeleton, meshes, kind, pose, setLevel, get level() { return shown; } };
}
