import * as THREE from 'three';
import { BEAST_BONES, BEAST_PARENT, LEGS } from './beast.js';
import { stridesOf } from './beasts.js';
import { stanceOf } from './parts/stance.js';
import { rodentRig } from './parts/rodentRig.js';
import { createPlateBeast } from './plateRig.js';

// One big animal's skeleton, posed from what life/beasts.js says it is doing. With no material it is the skeleton
// alone: the forest draws every animal of a kind together (life/flock.js), from the bones this poses. The bind pose
// is the animal standing square (life/beast.js), and every turn here is a turn from that.
//
// A pose (every part has a default, so a pose names only what it changes):
//   scale          the animal's size against the sheet's        antler   0 none (a cow) .. 1 a prime bull's
//   walk, trot, gallop   how much of each gait (0..1)            cycle    where in its stride it is (0..1)
//   high           the forelegs lifted high: the stiff walk of an alarmed cow (0..1)
//   stamp          the right forefoot raised to stamp (0..1)
//   lie            0 standing .. 1 lying down: the front goes down first, and the hind end gets up first
//   neck           0 the muzzle on the ground .. 0.6 as it stands .. 1 the head held high
//   head           { yaw (+ to its right), pitch (+ up) }       jaw      0 shut .. 1 open as far as it chews
//   ears           -1 laid back .. 0 out to the sides .. 1 pricked forward          tail   0 down .. 1 raised
//   ground         [left fore, right fore, left hind, right hind]: the ground under each foot above the plane
//                  the animal stands on (m)
//
// The walk is a lateral sequence (left hind, left fore, right hind, right fore), the trot diagonal, the gallop
// transverse (the hind feet one after the other, then the fore): no source read gave an elk's footfalls, its duty
// factors or its strides (the agent's own). How it lies down and gets up is the agent's own too.

const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const TINY = 0.001;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const _x = new THREE.Vector3(), _z = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

// Where the middle joint of a two-bone limb goes, from its top `a` to its end `c`, the bones `l1` and `l2` long,
// bending towards `pole`: into `out`. Out of reach, the limb is straight, towards `c`. `end` is where its end is.
function knee(a, c, l1, l2, pole, out, end) {
  _x.subVectors(c, a);
  const d = clamp(_x.length(), Math.abs(l1 - l2) + 1e-4, (l1 + l2) * 0.9995);
  _x.normalize();
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), up = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  _z.copy(pole).addScaledVector(_x, -pole.dot(_x));
  if (_z.lengthSq() < 1e-8) _z.set(1, 0, 0);
  _z.normalize();
  out.copy(a).addScaledVector(_x, along).addScaledVector(_z, up);
  return end.copy(a).addScaledVector(_x, d);
}

// [left fore, right fore, left hind, right hind]: where in the cycle each foot is at cycle 0 (0 is when it is put
// down); how much of the cycle a foot is on the ground; how high a fetlock is lifted in its swing (fore, hind), how
// much the knee or the hock rises with it, and how far the hoof folds back (radians); how far the heel is lifted at the
// end of a stance (`over`, the breakover: the hoof rolls up onto its toe, radians); how the body bobs and pitches.
const GAIT = {
  walk:   { phase: [0.75, 0.25, 0.0, 0.5], duty: 0.62, over: 0.55, lift: [0.12, 0.10], rise: [0.04, 0.03], fold: [0.7, 0.55], bob: 0.012, pitch: 0.012 },
  trot:   { phase: [0.0, 0.5, 0.5, 0.0], duty: 0.40, over: 0.7, lift: [0.22, 0.19], rise: [0.07, 0.05], fold: [1.2, 0.95], bob: 0.03, pitch: 0.018 },
  gallop: { phase: [0.62, 0.52, 0.0, 0.9], duty: 0.30, over: 0.8, lift: [0.30, 0.26], rise: [0.09, 0.07], fold: [1.5, 1.25], bob: 0.06, pitch: 0.08 },
};
const NAMES = ['walk', 'trot', 'gallop'];
const ORDER = ['LF', 'RF', 'LH', 'RH'];

// (the weasel family's long low body, for a sheet that gives `shape.long`: life/parts/longRig.js)
import { longRig } from './parts/longRig.js';

export function createBeast(kind, material = null) {
  if (kind.plate) return createPlateBeast(kind, material);          // (a beast drawn as a plate has its own rig: life/plateRig.js)
  const bones = BEAST_BONES.map((name) => { const bone = new THREE.Bone(); bone.name = name; return bone; });
  const by = Object.fromEntries(BEAST_BONES.map((name, i) => [name, bones[i]]));
  const built = kind.levels[0], pivots = built.pivots, shape = kind.sheet.shape;
  const STRIDES = stridesOf(kind.sheet);                       // one stride of each gait at the sheet's size (life/beasts.js): the elk's, or the sheet's own
  for (const name of BEAST_BONES) {
    const parent = BEAST_PARENT[name];
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

  // each leg as it stands: its joints, the way each of its bones runs, and where its fetlock is
  const legs = ORDER.map((key) => {
    const leg = LEGS[key], lay = built.legs[key], spec = leg.fore ? shape.fore : shape.hind, Jb = lay.joints;
    const dirs = [0, 1, 2].map((k) => Jb[k + 1].clone().sub(Jb[k]).normalize());
    const beta = Math.atan2(Jb[2].x - Jb[3].x, Jb[2].y - Jb[3].y);              // the cannon from the fetlock up: + its top ahead
    return { key, ...leg, spec, dirs, beta, lengths: lay.lengths, F0: Jb[3].clone(), C0: Jb[2].clone(), toe: [lay.toe - Jb[3].x, -Jb[3].y], over: 0,
      E: new THREE.Vector3(), C: new THREE.Vector3(), F: new THREE.Vector3(), Fp: new THREE.Vector3(), rise: 0, swing: 0, fold: 0 };
  });
  const hipsPivot = pivots.hips, chestPivot = pivots.chest, span = pivots.neck1.x - pivots.hips.x;
  const qHips = new THREE.Quaternion(), qChest = new THREE.Quaternion(), qScap = new THREE.Quaternion(), qParent = new THREE.Quaternion();
  const qBone = new THREE.Quaternion(), qFold = new THREE.Quaternion();
  const hipsAt = new THREE.Vector3(), chestAt = new THREE.Vector3(), J = new THREE.Vector3(), tmp = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3();
  const reachC = new THREE.Vector3(), reachF = new THREE.Vector3();
  const neckHigh = shape.neck.high, neckLow = shape.neck.low;
  // (a long-bodied beast is posed whole by its own rig: the stance's turn of the neck and head stayed on it under that)
  const stance = shape.paw && !shape.long ? stanceOf({ by, legs, pivots, shape }) : null;
  const rodent = shape.climb ? rodentRig({ by, pivots, shape, legs }) : null;          // (a squirrel's or a chipmunk's own poses: life/parts/rodentRig.js)

  // A pose: see the head of the file.
  function pose(P = {}) {
    group.scale.setScalar(P.scale ?? 1);
    const head = P.head || {}, ground = P.ground || [0, 0, 0, 0], cycle = P.cycle ?? 0;
    const lie = clamp(P.lie ?? 0, 0, 1), dropF = ease(clamp(lie / 0.6, 0, 1)), dropH = ease(clamp((lie - 0.4) / 0.6, 0, 1));
    const share = { walk: clamp(P.walk ?? 0, 0, 1), trot: clamp(P.trot ?? 0, 0, 1), gallop: clamp(P.gallop ?? 0, 0, 1) };
    const n = clamp(P.neck ?? 0.6, 0, 1.15), graze = 1 - clamp(n / 0.6, 0, 1);

    // ---- each foot's place in its gait: on the ground it goes back under the body, in the air forward and up
    let bob = 0, pitch = 0, flex = 0;
    for (const leg of legs) {
      const i = ORDER.indexOf(leg.key), f = leg.fore ? 0 : 1;
      leg.Fp.copy(leg.F0); leg.swing = 0; leg.fold = 0; leg.rise = 0; leg.over = 0;
      for (const name of NAMES) {
        const k = share[name] * (1 - lie);
        if (k <= 0) continue;
        const g = GAIT[name], p = (((cycle + g.phase[i]) % 1) + 1) % 1, sweep = STRIDES[name] * g.duty;
        if (p < g.duty) { leg.Fp.x += k * sweep * (0.5 - p / g.duty); leg.over += k * g.over * ease(clamp((p / g.duty - 0.68) / 0.32, 0, 1)); continue; }
        const q = (p - g.duty) / (1 - g.duty), arc = Math.sin(Math.PI * q);
        const high = leg.fore && name === 'walk' ? 1 + 1.4 * (P.high ?? 0) : 1;
        leg.Fp.x += k * sweep * (q - 0.5);
        leg.Fp.y += k * g.lift[f] * high * arc ** 0.8;
        leg.rise += k * g.rise[f] * high * arc;
        leg.fold += k * g.fold[f] * arc;
        leg.swing = Math.max(leg.swing, k * arc);
      }
      if (leg.key === 'RF' && P.stamp) { const s = P.stamp * (1 - lie); leg.Fp.y += 0.14 * s; leg.Fp.x += 0.03 * s; leg.rise += 0.1 * s; leg.fold += 0.5 * s; leg.swing = Math.max(leg.swing, s); }
      leg.Fp.y += ground[i] * (1 - (leg.fore ? dropF : dropH));
    }
    for (const name of NAMES) {
      const k = share[name] * (1 - lie), g = GAIT[name], c = 2 * Math.PI * cycle;
      if (k <= 0) continue;
      bob += k * (name === 'gallop' ? g.bob * Math.sin(c + 1.2) : -g.bob * 0.5 * (1 - Math.cos(2 * c)));
      pitch += k * g.pitch * Math.sin(c + (name === 'gallop' ? 0.4 : 0));
      if (name === 'gallop') flex += k * 0.1 * Math.sin(c - 0.6);              // the back gathers and stretches
    }

    // ---- the body: lowered onto the ground lying down, the front end first; the front lowered a little to graze
    const groundF = (ground[0] + ground[1]) / 2, groundH = (ground[2] + ground[3]) / 2;
    const back = bob - shape.lie.drop * dropH + groundH * (1 - dropH), front = bob - shape.lie.drop * dropF + groundF * (1 - dropF);
    const tilt = Math.atan2(front - back, span) + pitch;
    by.hips.position.copy(hipsPivot).add(tmp.set(0, back, 0));
    by.hips.quaternion.setFromAxisAngle(AZ, tilt);
    qHips.copy(by.hips.quaternion);
    by.chest.quaternion.setFromAxisAngle(AZ, flex + shape.neck.dip * graze * (1 - lie));
    qChest.copy(qHips).multiply(by.chest.quaternion);
    hipsAt.copy(by.hips.position);
    chestAt.copy(chestPivot).sub(hipsPivot).applyQuaternion(qHips).add(hipsAt);

    // ---- the legs
    for (const leg of legs) {
      const spec = leg.spec, [l1, l2, l3] = leg.lengths, down = leg.fore ? dropF : dropH, side = leg.side;
      // the top joint, where the body has put it (a shoulder blade swings with its leg)
      if (leg.fore) {
        const scap = by[leg.scap];
        const swing = spec.scapSwing ?? 0.22, most = spec.scapMost ?? 0.2;
        scap.quaternion.setFromAxisAngle(AZ, clamp(swing * (leg.Fp.x - leg.F0.x), -most, most) * (1 - down));
        qScap.copy(qChest).multiply(scap.quaternion);
        tmp.copy(pivots[leg.scap]).sub(chestPivot).applyQuaternion(qChest).add(chestAt);
        J.copy(pivots[leg.chain[0]]).sub(pivots[leg.scap]).applyQuaternion(qScap).add(tmp);
        qParent.copy(qScap);
      } else {
        J.copy(pivots[leg.chain[0]]).sub(hipsPivot).applyQuaternion(qHips).add(hipsAt);
        qParent.copy(qHips);
      }
      // the cannon, from the fetlock up: as it stands on the ground; in the air the knee or the hock keeps its
      // height while the fetlock is lifted, so the cannon swings back under it
      // on the ground it leans with the foot (the foot behind the knee: the cannon's top is ahead of the fetlock, the
      // foot ahead: behind it), the lean let go as the swing takes the leg
      let beta = leg.beta + (spec.lean ?? 0.5) * (leg.F0.x - leg.Fp.x) * (1 - Math.sqrt(Math.min(1, leg.swing)));
      if (leg.swing > 0) {
        const c = clamp((leg.C0.y + leg.rise - leg.Fp.y) / l3, -0.3, 1), swung = Math.acos(c);
        beta += (swung - Math.abs(leg.beta)) * Math.sqrt(leg.swing);
      }
      leg.F.copy(leg.Fp);
      // the breakover: the heel comes up with the toe held where it stands, so the fetlock rises and moves on
      if (leg.over > 0 && down < 1) {
        const o = leg.over * (1 - down), co = Math.cos(o), si = Math.sin(o), [ta, tb] = leg.toe;
        leg.F.x += ta - (ta * co + tb * si); leg.F.y += tb - (-ta * si + tb * co);
      }
      leg.C.set(leg.F.x + Math.sin(beta) * l3, leg.F.y + Math.cos(beta) * l3, leg.F.z);
      // lying down: folded under the body
      const L = shape.lie[leg.fore ? 'fore' : 'hind'];
      if (down > 0) {
        const z = side * spec.at[1];
        leg.C.lerp(tmp.set(J.x + L.top[0], L.top[1], z * L.out), down);
        leg.F.lerp(tmp.set(J.x + L.fetlock[0], L.fetlock[1], z * L.out * 1.04), down);
        dir.subVectors(leg.C, leg.F).normalize();
        leg.C.copy(leg.F).addScaledVector(dir, l3);
      }
      // the elbow goes back, the stifle forward (and out, lying down)
      pole.set(leg.fore ? -1 : 1, 0, leg.fore ? 0 : side * 0.7 * down);
      knee(J, leg.C, l1, l2, pole, leg.E, reachC);
      // (if the knee or the hock is out of reach, the cannon starts where the leg could reach)
      reachF.copy(leg.F).sub(reachC).normalize().multiplyScalar(l3).add(reachC);
      const ends = [[J, leg.E], [leg.E, reachC], [reachC, reachF]];
      for (let b = 0; b < 3; b += 1) {
        dir.subVectors(ends[b][1], ends[b][0]).normalize();
        qBone.setFromUnitVectors(leg.dirs[b], dir);
        by[leg.chain[b]].quaternion.copy(_q.copy(qParent).invert()).multiply(qBone);
        qParent.copy(qBone);
      }
      // the hoof: flat on the ground as it stands, folded back from the fetlock in the air, tucked lying down
      // lying down it follows the cannon, bent from it by `L.hoof`
      qFold.setFromAxisAngle(AZ, -(leg.fold + leg.over) * (1 - down));
      if (down > 0) qFold.slerp(_q2.copy(qParent).multiply(_q.setFromAxisAngle(AZ, L.hoof)), down);
      by[leg.chain[3]].quaternion.copy(_q.copy(qParent).invert()).multiply(qFold);
    }

    // ---- the neck and the head: down to graze, up to watch, turned to whatever it watches; the body's pitch is
    // taken out of the neck, so that a head held still stays still as the body rocks
    const yaw = clamp(head.yaw ?? 0, -1.6, 1.6), hp = head.pitch ?? 0;
    const nod = (share.walk * 0.04 * Math.sin(4 * Math.PI * cycle) + share.trot * 0.02 * Math.sin(4 * Math.PI * cycle + 0.7) + share.gallop * 0.07 * Math.sin(2 * Math.PI * cycle - 0.4)) * (1 - lie);
    const at = (k) => (n < 0.6 ? neckLow[k] * (1 - n / 0.6) : neckHigh[k] * ((n - 0.6) / 0.4));
    const turns = [0.3, 0.25, 0.2, 0.25];
    ['neck1', 'neck2', 'neck3', 'head'].forEach((name, k) => {
      let p = at(k);
      if (k === 0) p += nod - (tilt + flex) * 0.7 - shape.neck.dip * graze * (1 - lie);
      if (k === 3) p += hp - nod * 0.6;
      by[name].quaternion.setFromAxisAngle(AY, -yaw * turns[k]).multiply(_q.setFromAxisAngle(AZ, p));
    });
    by.jaw.quaternion.setFromAxisAngle(AZ, -clamp(P.jaw ?? 0, 0, 1) * 0.1);
    // the ears: laid back (-1), out to the sides (0), pricked forward (1)
    const ear = clamp(P.ears ?? 0.2, -1, 1);
    for (const [side, z] of [['L', -1], ['R', 1]]) {
      by[`ear${side}`].quaternion.setFromAxisAngle(AX, z * (ear > 0 ? -0.3 * ear : -0.45 * ear)).multiply(_q2.setFromAxisAngle(AZ, ear > 0 ? -0.3 * ear : -0.75 * ear));
      by[`antler${side}`].scale.setScalar(Math.max(TINY, P.antler ?? 0));
    }
    by.tail.quaternion.setFromAxisAngle(AZ, -clamp(P.tail ?? 0, 0, 1) * 0.9);
    if (stance) stance(P);
    if (shape.long) (pose.long ??= longRig({ by, legs, pivots, shape }))(P);          // (life/parts/longRig.js)
    if (rodent) rodent(P);
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
