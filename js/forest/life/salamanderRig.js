import * as THREE from 'three';
import { SAL_BONES, SAL_PARENT, FRONT, BACK, TAIL, LIMBS, knee, pole } from './salamander.js';

// One salamander's skeleton, posed from named amounts (life/salamander.js builds it standing, its body straight, and
// every turn here is a turn from that). With no material it is the skeleton alone: the forest draws every animal of a
// kind together (life/flock.js), from the bones this poses. Every part has a default, so a pose names only what it
// changes.
//
//   walk     0 .. 1 the walk: the limbs step in diagonal pairs (the left fore with the right hind), the shoulders and the
//            hips swing against each other and the body bends from side to side between them, the head kept nearly
//            straight, the tail dragged and swinging after the hips. `cycle` is how many strides it has walked (a
//            count that only grows: where in a stride it is is the part after the point)
//   swim     0 .. 1 swimming: a wave runs down the body and the tail, the limbs laid back along the flanks
//   warn     0 .. 1 the newt's warning (the unken reflex): the head bent up and back, the tail curled up over the back,
//            the belly pressed down and the limbs held out stiffly, so that the orange underside shows
//   tall     0 .. 1 standing tall on straight legs, the back swayed and the tail raised (the ensatina's defence)
//   crouch   0 .. 1 pressed flat to the ground, the limbs drawn in (keeping still)
//   bend     -1 .. 1 the body curved to one side (+ to its right), as one lies at rest or turns
//   head     { yaw (+ to its right), pitch (+ up) }        tail { pitch (+ raised), yaw (+ to its right), sway }
//   sway     how far the raised tail lashes from side to side, `wave` (a count that only grows) the lash's own time
//   gills    0 .. 1 how far a gilled animal's gills stand out; they ripple with `wave`
//   lunge    0 .. 1 the head thrown forward and down at prey
//   scale    the animal's size against the sheet's       height   metres it is lifted off what it stands on
//   afloat   true: in open water, not set down on the ground
// Where it stands is worked out each pose: the animal is let down onto the lowest of its feet, toes, belly and tail.
// The angles of a gait, the warning and the stance are the agent's own: what was read describes the warning pose
// in words ("head bent back and tail curled up, showing the orange belly"; the ensatina "stands tall in a
// stiff-legged defensive posture with its back swayed and the tail raised up") and gave no gait, speed or angle.

const AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const frac = (x) => x - Math.floor(x);
const TAU = Math.PI * 2;
const DUTY = 0.72;                                  // the share of a stride a foot is on the ground
const PHASE = { LF: 0, RH: 0, RF: 0.5, LH: 0.5 };   // the diagonal pairs
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4(), _m2 = new THREE.Matrix4(), _v = new THREE.Vector3();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Vector3(), _w = new THREE.Vector3();
const _u0 = new THREE.Vector3(), _n0 = new THREE.Vector3(), _u1 = new THREE.Vector3(), _n1 = new THREE.Vector3(), _s = new THREE.Vector3(), _h = new THREE.Vector3();

// the turn that carries the frame (u0, n0) onto (u1, n1): each an axis and a normal square to it
function carry(u0, n0, u1, n1, out) {
  _m.makeBasis(u0, n0, _s.crossVectors(u0, n0));
  _m2.makeBasis(u1, n1, _s.crossVectors(u1, n1));
  return out.setFromRotationMatrix(_m2.multiply(_m.transpose()));
}

export function createSalamander(kind, material = null) {
  const bones = SAL_BONES.map((name) => { const bone = new THREE.Bone(); bone.name = name; return bone; });
  const by = Object.fromEntries(SAL_BONES.map((name, i) => [name, bones[i]]));
  const index = Object.fromEntries(SAL_BONES.map((name, i) => [name, i]));
  const built = kind.levels[0], pivots = built.pivots, sh = kind.sheet.shape, L = built.L, at = built.at;
  for (const name of SAL_BONES) {
    const parent = SAL_PARENT[name];
    if (!parent) { by[name].position.copy(pivots[name]); continue; }
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
  // what each limb is in the bind pose: its joints, lengths, the frame of its plane, and the bone of its girdle
  const legs = Object.fromEntries(Object.entries(LIMBS).map(([key, limb]) => {
    const l = built.limbs[key], u = new THREE.Vector3().subVectors(l.joint, l.top).normalize(), v = new THREE.Vector3().subVectors(l.end, l.joint).normalize();
    const n = new THREE.Vector3().crossVectors(u, v).normalize();
    return [key, { ...limb, ...l, u, v, n, gi: index[limb.girdle], bi: limb.chain.map((name) => index[name]) }];
  }));
  const reachOf = (leg) => leg.lengths[0] + leg.lengths[1];
  const stride = (sh.stride || 0.5) * L;
  const rootY = pivots.root.y;

  // a bone's turn in the model's frame (the group's), from its world matrix with the group put at the origin
  const turnOf = (i, out) => { bones[i].matrixWorld.decompose(_p, out, _s); return out; };
  // a point of the bind pose where bone i now carries it
  const carried = (i, p, out) => out.copy(p).applyMatrix4(_m.multiplyMatrices(bones[i].matrixWorld, skeleton.boneInverses[i]));

  function pose(P = {}) {
    const head = P.head || {}, tail = P.tail || {};
    const walk = clamp(P.walk ?? 0, 0, 1), swim = clamp(P.swim ?? 0, 0, 1), warn = clamp(P.warn ?? 0, 0, 1), tall = clamp(P.tall ?? 0, 0, 1);
    const crouch = clamp(P.crouch ?? 0, 0, 1), bend = clamp(P.bend ?? 0, -1, 1), lunge = clamp(P.lunge ?? 0, 0, 1);
    const c = frac(P.cycle ?? 0), wave = P.wave ?? 0, sway = clamp(tail.sway ?? 0, 0, 1);
    const raise = clamp(Math.max(warn, tall * 0.8, Math.max(0, tail.pitch ?? 0) * 1.5, swim), 0, 1);
    const keepP = group.position.clone(), keepQ = group.quaternion.clone(), keepS = group.scale.clone();
    group.position.set(0, 0, 0); group.quaternion.identity(); group.scale.set(1, 1, 1);

    // ---- the spine. Each bone's turn in the model's frame: `yaw` about the upright (three's way: + to its left) and,
    // laid on that, its own `pitch` about its own z (+ the front end up; on the tail, + the tail down)
    const yaw = {}, pitch = {};
    const theta = 0.24 * walk * (1 - swim);
    const cos = Math.cos(TAU * c);
    const shoulders = -theta * cos, hips = theta * cos;                // the left shoulder forward with the left fore foot
    // the swim's wave, from the head back, growing along the body, about one wave to the animal's length: yaw at a
    // place s along it
    const swimAt = (s) => swim * (0.06 + 0.42 * (s / built.S) ** 1.6) * Math.sin(TAU * (c - s / built.S));
    yaw.root = swimAt(at.root);
    yaw.t2 = shoulders * 0.5 + swimAt(at.t2);
    yaw.chest = shoulders + swimAt(at.chest);
    yaw.head = shoulders * 0.3 + swimAt(at.head);
    yaw.t4 = hips * 0.5 + swimAt(at.t4);
    yaw.hips = hips + swimAt(at.hips);
    TAIL.forEach((name, k) => {
      const lag = theta * (1 + 0.16 * (k + 1)) * Math.cos(TAU * (c - 0.07 * (k + 1)));
      const lash = sway * 0.3 * Math.sin(TAU * (wave - 0.12 * k)) * (k + 1) / 3;
      yaw[name] = lag + swimAt(at[name]) + lash;
    });
    // the curl and the turns asked for: the front's yaw turns the head end, the back's the tail end
    for (const name of FRONT) yaw[name] += bend * 1.1 * (at.root - at[name]) * -1;
    for (const name of BACK) yaw[name] += bend * 1.1 * (at[name] - at.root);
    yaw.head += -(head.yaw ?? 0);
    TAIL.forEach((name, k) => { yaw[name] += (tail.yaw ?? 0) * ((k + 1) / TAIL.length); });
    // pitches: the warning bends the head end and the tail end up, the stance sways the back; the tail lies on the
    // ground (its droop) unless it is raised
    pitch.root = 0;
    pitch.t2 = 0.14 * warn + 0.05 * tall;
    pitch.chest = 0.26 * warn + 0.08 * tall - 0.1 * crouch + 0.05 * lunge;
    pitch.head = 0.5 * warn + 0.04 * tall + (head.pitch ?? 0) - 0.3 * lunge;
    pitch.t4 = -0.06 * warn;
    pitch.hips = -0.3 * warn - 0.12 * tall;
    const lift = Math.max(0, tail.pitch ?? 0), dip = Math.min(0, tail.pitch ?? 0);
    // (the warning curls the tail up and forward over the back; standing tall holds it up in an arch, its tip let down)
    const WARN = [0.62, 0.52, 0.45, 0.4, 0.36, 0.32], TALL = [0.3, 0.16, 0.02, -0.08, -0.12, -0.12];
    TAIL.forEach((name, k) => {
      const curlUp = warn * WARN[k] + tall * TALL[k] + lift * (k < 3 ? 0.4 : 0.08);
      pitch[name] = built.droop[k] * (1 - raise) - curlUp - dip * (k < 2 ? 0.3 : 0);
    });
    for (const name of [...FRONT, ...BACK]) {
      if (name === 'root') { by.root.quaternion.setFromAxisAngle(AY, yaw.root); continue; }
      const parent = SAL_PARENT[name];
      by[name].quaternion.setFromAxisAngle(AY, yaw[name] - yaw[parent]).multiply(_q.setFromAxisAngle(AZ, pitch[name]));
    }
    // the gills stand out and ripple
    const gills = clamp(P.gills ?? 0.5, 0, 1);
    for (const [name, side] of [['gillL', -1], ['gillR', 1]]) {
      by[name].quaternion.setFromAxisAngle(AY, side * -(0.15 + 0.35 * gills)).multiply(_q.setFromAxisAngle(AZ, 0.12 * gills + 0.07 * Math.sin(TAU * wave * 1.3 + side)));
    }
    // the body's height: lower when it crouches or warns (the belly to the ground), higher when it stands tall
    const reachF = reachOf(legs.LF);
    by.root.position.set(0, rootY + tall * 0.5 * reachF - crouch * 0.35 * rootY - warn * 0.3 * rootY, 0);
    group.updateMatrixWorld(true);

    // ---- the limbs: where each hand or foot is to go, and the two bones that reach it
    for (const [key, leg] of Object.entries(legs)) {
      const side = leg.side, reach = reachOf(leg);
      const top = carried(leg.bi[0], leg.top, _a);
      const girdle = turnOf(leg.gi, _q2);
      // where it stands when nothing moves it: as it was built, in the body's frame (planted), or carried with its
      // girdle as the body bends (following)
      // (a walking foot is planted: it does not swing with its girdle)
      const follow = clamp((1 - walk) * 0.35 + 0.65 * Math.max(Math.abs(bend), warn, swim, tall), 0, 1);
      _t.copy(leg.end).lerp(carried(leg.gi, leg.end, _c), follow);
      // the walk: back under the body while the foot is on the ground, then lifted and swung forward
      if (walk > 0) {
        const p = frac(c + PHASE[key]);
        let dx, dy = 0;
        if (p < DUTY) dx = stride * (DUTY / 2 - p);
        else { const q = (p - DUTY) / (1 - DUTY); dx = stride * DUTY * (smooth(q) - 0.5); dy = 0.3 * leg.lengths[1] * Math.sin(Math.PI * q); }
        _t.x += dx * walk; _t.y += dy * walk;
      }
      // in the girdle's frame: laid back along the flank (a swim), held out stiffly and lifted (a warning), straight
      // down and out (standing tall), drawn in (keeping still)
      const inGirdle = (x, y, z, out) => out.set(x, y, z).applyQuaternion(girdle).add(top);
      if (swim > 0) _t.lerp(inGirdle(-0.85 * reach, -0.02 * reach, side * 0.14 * reach, _e), swim);
      if (warn > 0) _t.lerp(inGirdle((leg.fore ? 0.12 : -0.12) * reach, 0.12 * reach, side * 0.92 * reach, _e), warn * 0.85);
      if (tall > 0) { inGirdle((leg.fore ? 0.08 : -0.08) * reach, -0.9 * reach, side * 0.38 * reach, _e); _e.y = Math.max(_e.y, leg.palm); _t.lerp(_e, tall); }
      if (crouch > 0) { inGirdle((leg.fore ? -0.05 : 0.05) * reach, 0, side * 0.62 * reach, _e); _e.y = leg.palm; _t.lerp(_e, crouch * 0.6); }
      // the two bones: the elbow or knee bends up and out (and back for an elbow, forward for a knee)
      const bendTo = pole(leg.fore, side, _w).applyQuaternion(girdle);
      knee(top, _t, leg.lengths[0], leg.lengths[1], bendTo, _b, _e);
      _u1.subVectors(_b, top).normalize(); _v.subVectors(_e, _b).normalize();
      _n1.crossVectors(_u1, _v);
      if (_n1.lengthSq() < 1e-10) _n1.copy(leg.n); else _n1.normalize();
      const upper = carry(leg.u, leg.n, _u1, _n1, new THREE.Quaternion());
      const lower = carry(leg.v, leg.n, _v, _n1, new THREE.Quaternion());
      // a hand or foot on the ground stays flat, its toes the way they were built; in the warning it is carried with the
      // limb; swimming, it is laid back flat along it, its toes trailing
      const rigid = clamp(Math.max(warn * 0.9, tall * 0.3), 0, 1);
      const flat = _q.setFromAxisAngle(AY, (yaw.root * 0.5 + (leg.fore ? yaw.chest : yaw.hips) * 0.5) * 0.4);
      const hand = flat.clone().slerp(lower, rigid);
      if (swim > 0) {
        _w.copy(AY).addScaledVector(_v, -_v.y);
        if (_w.lengthSq() < 1e-8) _w.set(1, 0, 0); else _w.normalize();
        _h.copy(leg.foot).setY(0).normalize();
        hand.slerp(carry(_h, AY, _v, _w, new THREE.Quaternion()), swim);
      }
      by[leg.chain[0]].quaternion.copy(girdle).invert().multiply(upper);
      by[leg.chain[1]].quaternion.copy(upper).invert().multiply(lower);
      by[leg.chain[2]].quaternion.copy(lower).invert().multiply(hand);
    }
    group.updateMatrixWorld(true);

    // ---- let it down onto what it stands on: its lowest foot, toe, belly or tail
    let low = 0;
    if (!P.afloat) {
      low = Infinity;
      for (const { p, bone, r } of built.contact) low = Math.min(low, carried(bone, p, _v).y - r);
    }
    by.root.position.y += -low + (P.height ?? 0);
    group.position.copy(keepP); group.quaternion.copy(keepQ); group.scale.copy(keepS);
    group.scale.setScalar(P.scale ?? 1);
  }

  // Which detail level is drawn; -1 hides it.
  function setLevel(level) {
    if (level === shown) return;
    meshes.forEach((mesh, i) => { mesh.visible = i === level; });
    shown = level;
  }

  pose();
  return { group, by, bones, skeleton, meshes, kind, pose, setLevel, get level() { return shown; } };
}
