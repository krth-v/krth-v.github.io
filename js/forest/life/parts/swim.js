import * as THREE from 'three';
import { outline } from '../bird.js';

// The poses of a bird that swims: one whose sheet has `shape.float` (the ducks). life/rig.js's pose calls swimPose
// after its own, and this sets what that left for it. The fields it reads, besides a bird's own (life/rig.js):
//   swim   { phase, kick, both, run }   the feet paddling under the body, in place of the rig's own legs
//            phase  radians, counted on and never wrapped (the page eases it as a number, and wrapped it would run
//                   back through the stroke)
//            kick   0..1, how far fore and aft the feet sweep (0: they hang still, the webs open)
//            both   0..1: 0 the feet by turns, as on the surface; 1 together and out to the sides, as under water
//            run    0..1: pattering over the water on a take-off, the feet reaching down to the surface by turns
//          A pose without it keeps the rig's legs (standing on a rock, tucked in flight).
//   neck   { reach, rise }   the head carried forward along the body's axis and up from it, in metres (the neck's
//          skin stretches between the two, life/bird.js `neck`): held out in flight, up when swimming, sunk on the
//          shoulders at rest (negative)
//   size   the whole bird scaled about its feet (a pair's hen, drawn at her own size: the sheet's `mate.scale`)
// One skeleton poses every animal of a kind, one after another (life/flock.js), so everything here is set every time,
// to nothing where the pose does not name it.
//
// On a stroke the foot sweeps back with its toes spread and the webs open, the sole pushing the water back, and comes
// forward again with its toes drawn together and trailing, edge on to the water: the side toes' outer joints are
// turned in towards the middle toe, which folds the webs between them (life/parts/duck.js). That is how a duck's foot
// paddles; the sizes of the sweep are the agent's own.

const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
const _inv = new THREE.Quaternion(), _shin = new THREE.Quaternion(), _tarsus = new THREE.Quaternion(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _knee = new THREE.Vector3(), _foot = new THREE.Vector3(), _heel = new THREE.Vector3(), _dir = new THREE.Vector3(), _bend = new THREE.Vector3();
const _front = new THREE.Vector3(), _back = new THREE.Vector3(), _seg = new THREE.Vector3(), _down = new THREE.Vector3(), _aft = new THREE.Vector3(), _out = new THREE.Vector3();
const smooth = (t) => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

// The turn that carries a bone's bind direction, straight down, onto `dir`, keeping its front as near `ahead` as it can
// (as life/rig.js has it).
function aimDown(dir, ahead, out) {
  _y.copy(dir).negate();
  _x.copy(ahead).addScaledVector(_y, -ahead.dot(_y));
  if (_x.lengthSq() < 1e-8) _x.set(0, 0, 1).cross(_y);
  _x.normalize();
  _z.crossVectors(_x, _y);
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}

// What a kind needs here, worked out once: where the head's joint is from the body's, and each side toe's way.
const cache = new WeakMap();
function prepare(kind) {
  let made = cache.get(kind);
  if (made) return made;
  const pivots = kind.levels[0].pivots;
  made = { head: pivots.head.clone().sub(pivots.body), toes: kind.toes.filter((toe) => toe.key !== 'M') };
  cache.set(kind, made);
  return made;
}

export function swimPose(by, kind, P) {
  const made = prepare(kind);
  // the neck, and the bird's size
  const neck = P.neck || {};
  by.head.position.copy(made.head);
  by.head.position.x += neck.reach ?? 0; by.head.position.y += neck.rise ?? 0;
  by.root.scale.setScalar(P.size ?? 1);
  const S = P.swim;
  if (!S) return;
  // ---- the feet, paddling: each foot sweeps on an ellipse below and behind its knee, in the body's own frame
  const body = by.body.quaternion, L1 = kind.shin, L2 = kind.tarsus, L = L1 + L2;
  const kick = Math.min(1, Math.max(0, S.kick ?? 0)), both = Math.min(1, Math.max(0, S.both ?? 0)), run = Math.min(1, Math.max(0, S.run ?? 0));
  _inv.copy(body).invert();
  _front.set(1, 0, 0).applyQuaternion(body);
  _back.set(-1, -0.25, 0).applyQuaternion(body).normalize();
  _down.set(0, -1, 0).applyQuaternion(body); _aft.set(-1, 0, 0).applyQuaternion(body);
  for (const side of [1, -1]) {
    const name = side > 0 ? 'R' : 'L';
    const phase = (S.phase ?? 0) + (1 - both) * (side < 0 ? Math.PI : 0), s = Math.sin(phase), c = Math.cos(phase);
    _knee.set(0, 0, side * kind.knee).applyQuaternion(body).add(by.body.position);
    // on the surface the feet hang under the body and sweep back by turns; under water they kick together, out to the
    // sides and further back; pattering, they reach down to the water's surface (the frame's own level) by turns
    const deep = L * (0.6 - 0.18 * both + 0.08 * c * kick), aft = L * (0.24 + 0.22 * both + (0.28 + 0.1 * both) * s * kick);
    _out.set(0, 0, side).applyQuaternion(body);
    _foot.copy(_knee).addScaledVector(_down, deep).addScaledVector(_aft, aft).addScaledVector(_out, kind.knee * (0.15 + 0.9 * both));
    if (run > 0) {
      const lifted = L * 0.28 * Math.max(0, c);
      _seg.set(_knee.x - L * 0.12 + L * 0.3 * s, Math.max(kind.pad, _knee.y - L * 0.98) + lifted, side * kind.knee * 1.1);
      _foot.lerp(_seg, run);
    }
    _dir.subVectors(_foot, _knee);
    const reach = Math.min(Math.max(_dir.length(), Math.abs(L1 - L2) + 1e-5), L * 0.999);
    _dir.normalize();
    const along = (L1 * L1 - L2 * L2 + reach * reach) / (2 * reach);
    _bend.copy(_back).addScaledVector(_dir, -_back.dot(_dir)).normalize();
    _heel.copy(_knee).addScaledVector(_dir, along).addScaledVector(_bend, Math.sqrt(Math.max(L1 * L1 - along * along, 0)));
    aimDown(_seg.subVectors(_heel, _knee).normalize(), _front, _shin);
    by[`shin${name}`].quaternion.copy(_inv).multiply(_shin);
    _foot.copy(_knee).addScaledVector(_dir, reach);
    aimDown(_seg.subVectors(_foot, _heel).normalize(), _front, _tarsus);
    by[`tarsus${name}`].quaternion.copy(_shin).invert().multiply(_tarsus);
    // The toes: sweeping back they are spread and turn from pointing down and forward to down and back; coming forward
    // they are drawn together and trail. (`open` is how far into the back stroke the foot is; still, they are open.)
    const open = kick > 0.02 ? smooth(0.5 + 2.2 * c) : 1, fold = (1 - open) * Math.min(1, kick * 3);
    const tilt = open * (-2.0 - 0.6 * s) + (1 - open) * -2.6;
    _q.copy(body).multiply(_q2.setFromAxisAngle(AY, -side * 0.12)).multiply(_q2.setFromAxisAngle(AZ, tilt * (0.35 + 0.65 * Math.max(kick, run)) + (1 - Math.max(kick, run)) * -1.0));
    by[`toes${name}`].quaternion.copy(_tarsus).invert().multiply(_q);
    by[`hind${name}`].quaternion.copy(_tarsus).invert().multiply(_q).multiply(_q2.setFromAxisAngle(AZ, 0.6));
    by[`toeMB${name}`].quaternion.identity(); by[`toeMC${name}`].quaternion.identity();
    for (const toe of made.toes) {
      // a side toe turned in towards the middle one, about the foot's own up (its yaw is measured outwards on either foot)
      by[`toe${toe.key}B${name}`].quaternion.setFromAxisAngle(AY, side * toe.yaw * fold * 0.95);
      by[`toe${toe.key}C${name}`].quaternion.setFromAxisAngle(AY, side * toe.yaw * fold * 0.3);
    }
  }
}

// The `lift` (life/rig.js: how high the hips stand, as a share of straight legs) that floats a bird with its body
// pitched `pitch` so that its waterline lies at its frame's own level: where its feet would be, which for a swimming
// bird is the water's surface. The waterline is `shape.float.line` millimetres above the lowest point of its belly, in
// the level pose, and it is held level under the middle of the body (where the belly is lowest).
const lifts = new WeakMap();
export function floatLift(sheet, pitch = 0) {
  let low = lifts.get(sheet);
  if (!low) {
    const body = outline(sheet.shape);
    low = { y: Infinity, x: 0 };
    for (let x = body.rear; x <= body.front; x += 1) { const y = body.bottom(x); if (y < low.y) { low.y = y; low.x = x; } }
    lifts.set(sheet, low);
  }
  const leg = sheet.shape.leg, [kx, ky] = leg.knee, line = low.y + sheet.shape.float.line;
  const straight = leg.shin + leg.tarsus + leg.thick[2] * 0.6;
  return -(Math.sin(pitch) * (low.x - kx) + Math.cos(pitch) * (line - ky)) / straight;
}
