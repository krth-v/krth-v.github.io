import * as THREE from 'three';
import { FROG_BONES, FROG_PARENT } from './frog.js';

// One frog's or toad's skeleton, posed from named amounts (life/frog.js builds it in the resting crouch, and every
// turn here is a turn from that). With no material it is the skeleton alone: the forest draws every animal of a kind
// together (life/flock.js), from the bones this poses. Every part has a default, so a pose names only what it changes.
//
//   scale          the animal's size against the sheet's        height   metres it is lifted off what it stands on
//   leap           0 the crouch .. 1 the hind legs driven out straight behind it, the arms tucked back, the body level
//   walk           0 .. 1 a walk: the limbs swing in turn (a toad's way; `cycle` is where in the stride)
//   swim           0 .. 1 the frog's kick: both hind legs together, drawn up and driven out, the arms laid back
//   cycle          where in a stride or a kick it is (0..1)
//   lift           0 the chest on the ground .. 1 propped up on straight arms, the head high (alert, and calling)
//   pitch          the whole body tipped, radians, + the snout up
//   head           { yaw (+ to its right), pitch (+ up) }        jaw   0 shut .. 1 open
//   sac            0 .. 1 the throat's sac blown up
//   afloat         true: not set down on the ground (a swimmer)
// Where it stands is worked out each pose: the animal is let down onto the lowest of its toes, fingers and belly.
// The angles of a gait and a leap are the agent's own: no source read gave how a frog holds its limbs in a leap, a
// toad's footfalls or a kick's timing.

const AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _m = new THREE.Matrix4();
// the leg's turns (the thigh, the shank, the foot) from the crouch, as totals about the side's axis, radians
const HIND = { crouch: [0, 0, 0], leap: [-2.75, -0.1, -2.75] };
const ARM = { crouch: [0, 0, 0], tuck: [-0.7, -2.5, -3.0], prop: [0.3, 0.45, 0.2] };

export function createFrog(kind, material = null) {
  const bones = FROG_BONES.map((name) => { const bone = new THREE.Bone(); bone.name = name; return bone; });
  const by = Object.fromEntries(FROG_BONES.map((name, i) => [name, bones[i]]));
  const built = kind.levels[0], pivots = built.pivots;
  for (const name of FROG_BONES) {
    const parent = FROG_PARENT[name];
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
    mesh.boundingSphere = level.geometry.boundingSphere;
    mesh.visible = i === 0;
    group.add(mesh);
    return mesh;
  });
  let shown = 0;
  const contact = built.contact, boneIndex = Object.fromEntries(FROG_BONES.map((name, i) => [name, i]));
  const SIDES = [['L', -1], ['R', 1]];

  function pose(P = {}) {
    const head = P.head || {};
    const leap = clamp(P.leap ?? 0, 0, 1), walk = clamp(P.walk ?? 0, 0, 1), swim = clamp(P.swim ?? 0, 0, 1), lift = clamp(P.lift ?? 0, 0, 1);
    const cycle = P.cycle ?? 0, c = 2 * Math.PI * cycle;
    const kick = swim * (0.5 + 0.5 * Math.sin(c));                      // the swimmer's legs, drawn up and driven out
    const ext = clamp(leap + kick, 0, 1);
    const pitch = (P.pitch ?? 0) + lift * 0.28 - swim * 0.12 + leap * 0.4;
    const chestBend = lift * -0.1 - leap * 0.05;
    const hipsTot = pitch, chestTot = pitch + chestBend;
    by.hips.quaternion.setFromAxisAngle(AZ, hipsTot);
    by.chest.quaternion.setFromAxisAngle(AZ, chestTot - hipsTot);
    const headPitch = (head.pitch ?? 0) + lift * 0.1 - leap * 0.05;
    by.head.quaternion.setFromAxisAngle(AY, -clamp(head.yaw ?? 0, -1.4, 1.4)).multiply(_q.setFromAxisAngle(AZ, headPitch - chestBend * 0.3 + (swim ? -0.05 : 0)));
    by.jaw.quaternion.setFromAxisAngle(AZ, -clamp(P.jaw ?? 0, 0, 1) * 0.5);
    by.sac.scale.setScalar(Math.max(0.001, P.sac ?? 0));
    for (const [name, side] of SIDES) {
      // a walk swings the limbs of one corner against the other's: the left hind with the right fore
      const phase = (name === 'L' ? 0 : Math.PI), sw = walk * Math.sin(c + phase), lo = walk * Math.max(0, Math.cos(c + phase));
      const thigh = lerp(HIND.crouch[0], HIND.leap[0], ext) + 0.5 * sw;
      const shank = lerp(HIND.crouch[1], HIND.leap[1], ext) + 0.3 * sw - 0.25 * lo;
      const foot = lerp(HIND.crouch[2], HIND.leap[2], ext) + 0.2 * sw + 0.4 * lo;
      by[`thigh${name}`].quaternion.setFromAxisAngle(AZ, thigh - hipsTot);
      by[`shank${name}`].quaternion.setFromAxisAngle(AZ, shank - thigh);
      by[`foot${name}`].quaternion.setFromAxisAngle(AZ, foot - shank);
      // the splay: the thigh out a little when the leg is drawn up to kick or to leap
      by[`thigh${name}`].quaternion.premultiply(_q.setFromAxisAngle(AY, side * -0.25 * kick));
      const sf = -walk * Math.sin(c + phase), lf = walk * Math.max(0, -Math.cos(c + phase));
      const tuck = clamp(leap + swim, 0, 1);
      const arm = lerp(lerp(ARM.crouch[0], ARM.prop[0], lift), ARM.tuck[0], tuck) + 0.4 * sf;
      const fore = lerp(lerp(ARM.crouch[1], ARM.prop[1], lift), ARM.tuck[1], tuck) + 0.3 * sf - 0.2 * lf;
      const hand = lerp(lerp(ARM.crouch[2], ARM.prop[2], lift), ARM.tuck[2], tuck) + 0.3 * lf;
      by[`arm${name}`].quaternion.setFromAxisAngle(AZ, arm - chestTot);
      by[`fore${name}`].quaternion.setFromAxisAngle(AZ, fore - arm);
      by[`hand${name}`].quaternion.setFromAxisAngle(AZ, hand - fore);
    }
    // let it down onto what it stands on: its lowest toe, finger or belly, worked out with the group as the origin
    by.root.position.set(0, 0, 0);
    const keepP = group.position.clone(), keepQ = group.quaternion.clone(), keepS = group.scale.clone();
    group.position.set(0, 0, 0); group.quaternion.identity(); group.scale.set(1, 1, 1);
    group.updateMatrixWorld(true);
    let low = 0;
    if (!P.afloat && swim < 0.5) {
      low = Infinity;
      for (const { p, bone, r } of contact) {
        const i = bone;
        _m.multiplyMatrices(bones[i].matrixWorld, skeleton.boneInverses[i]);
        _v.copy(p).applyMatrix4(_m);
        low = Math.min(low, _v.y - r);
      }
    }
    by.root.position.set(0, -low + (P.height ?? 0), 0);
    group.position.copy(keepP); group.quaternion.copy(keepQ); group.scale.copy(keepS);
    group.scale.setScalar(P.scale ?? 1);
  }

  // Which detail level is drawn; -1 hides it.
  function setLevel(level) {
    if (level === shown) return;
    meshes.forEach((mesh, i) => { mesh.visible = i === level; });
    shown = level;
  }

  void boneIndex;
  pose();
  return { group, by, bones, skeleton, meshes, kind, pose, setLevel, get level() { return shown; } };
}
