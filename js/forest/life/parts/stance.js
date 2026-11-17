import * as THREE from 'three';

// What a beast with paws does on its own feet that a hoofed one does not (the bear's: life/families/bear.js asks for
// it): it stands up on its hind legs to look and smell (`rear`), and it works at something with a forepaw, raking at
// a rotten log or turning a stone over (`dig`). Both are amounts of a pose (life/beastRig.js reads the rest), laid
// over what the rig has posed, by one hook at the end of the rig's pose function:
//   life/beastRig.js, the imports:     import { stanceOf } from './parts/stance.js';
//   life/beastRig.js createBeast, after `const neckHigh = ...`:
//                                      const stance = shape.paw ? stanceOf({ by, legs, pivots, shape }) : null;
//   life/beastRig.js pose, its last line:
//                                      if (stance) stance(P);
// A pose's fields here (each 0 or left out does nothing, so a kind that never asks is posed as it was):
//   rear    0 on all fours .. 1 standing up on the hind legs, the body near upright over the hind feet, the forelegs
//           hanging bent in front of the chest, the head levelled (its own `head` pose turns and tips it as before)
//   dig     0 .. 1 working with a forepaw at something in front of it; `rake` how far through its strokes it is
//           (one stroke a unit, the paws taking turns, the right first; an amount that only grows, so that easing it
//           never runs a stroke backwards), `reach` how far ahead of the shoulder the paw works (m, at the sheet's
//           size), `at` how high what it works at is above the ground (m: 0 the ground, a log's top)
// How a bear stands and digs is the agent's own: nothing read gave its angles. What was read is that it stands
// up "to get a better look or smell" (NPS Olympic) and digs through logs for insects (NPS Olympic).

const AZ = new THREE.Vector3(0, 0, 1);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const _x = new THREE.Vector3(), _z = new THREE.Vector3();

// the middle joint of a two-bone limb (as life/beastRig.js's own): from `a` to `c`, bones `l1` and `l2`, bending
// towards `pole`, into `out`; out of reach the limb is straight towards `c`, and `end` is where it ends
function knee(a, c, l1, l2, pole, out, end) {
  _x.subVectors(c, a);
  const d = clamp(_x.length(), Math.abs(l1 - l2) * 1.001, (l1 + l2) * 0.9995);
  _x.normalize();
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), up = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  _z.copy(pole).addScaledVector(_x, -pole.dot(_x));
  if (_z.lengthSq() < 1e-8 * pole.lengthSq()) _z.set(1, 0, 0);
  _z.normalize();
  out.copy(a).addScaledVector(_x, along).addScaledVector(_z, up);
  return end.copy(a).addScaledVector(_x, d);
}

// `rig`: { by (the bones by name), legs (the rig's legs, each { key, fore, side, chain, scap, dirs, lengths, beta, Fp }),
// pivots, shape }. Returns the hook: (P) => void.
export function stanceOf({ by, legs, pivots, shape }) {
  const qHips = new THREE.Quaternion(), qChest = new THREE.Quaternion(), qScap = new THREE.Quaternion(), qParent = new THREE.Quaternion();
  const qBone = new THREE.Quaternion(), qWant = new THREE.Quaternion(), qPaw = new THREE.Quaternion(), qInv = new THREE.Quaternion(), q = new THREE.Quaternion();
  const hipsAt = new THREE.Vector3(), chestAt = new THREE.Vector3(), scapAt = new THREE.Vector3(), J = new THREE.Vector3(), E = new THREE.Vector3();
  const C = new THREE.Vector3(), F = new THREE.Vector3(), reachC = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3(), tmp = new THREE.Vector3();
  const hind = legs.filter((leg) => !leg.fore), fore = legs.filter((leg) => leg.fore);
  // how far the body pitches up standing (radians) and how high the hips rise (a share of the thigh): the agent's
  const UPRIGHT = 1.22, LIFT = 0.25;

  // the body's frame as the rig left it
  const frameNow = () => {
    hipsAt.copy(by.hips.position); qHips.copy(by.hips.quaternion);
    qChest.copy(qHips).multiply(by.chest.quaternion);
    chestAt.copy(pivots.chest).sub(pivots.hips).applyQuaternion(qHips).add(hipsAt);
  };
  // a leg's three bones set from its top joint `J`, its knee or elbow `E`, its wrist or ankle `C` and its paw's joint
  // `F`, under a parent turned `qParent`; then its paw turned `paw` in the group's frame. Each bone is blended from
  // where the rig had it by `k`.
  const setLeg = (leg, J0, E0, C0, F0, paw, k) => {
    const ends = [[J0, E0], [E0, C0], [C0, F0]];
    for (let b = 0; b < 3; b += 1) {
      dir.subVectors(ends[b][1], ends[b][0]).normalize();
      qBone.setFromUnitVectors(leg.dirs[b], dir);
      qWant.copy(qInv.copy(qParent).invert()).multiply(qBone);
      by[leg.chain[b]].quaternion.slerp(qWant, k);
      // (the parent of the next bone is this one as it now is, blended)
      qParent.multiply(by[leg.chain[b]].quaternion);
    }
    qWant.copy(qInv.copy(qParent).invert()).multiply(paw);
    by[leg.chain[3]].quaternion.slerp(qWant, k);
  };
  // where a fore leg's top joint is, with the body as it now is (and its shoulder blade's turn into qScap)
  const foreTop = (leg) => {
    const scap = by[leg.scap];
    scapAt.copy(pivots[leg.scap]).sub(pivots.chest).applyQuaternion(qChest).add(chestAt);
    qScap.copy(qChest).multiply(scap.quaternion);
    return J.copy(pivots[leg.chain[0]]).sub(pivots[leg.scap]).applyQuaternion(qScap).add(scapAt);
  };

  return function stance(P) {
    const rear = ease(clamp(P.rear ?? 0, 0, 1)) * (1 - clamp(P.lie ?? 0, 0, 1)), dig = ease(clamp(P.dig ?? 0, 0, 1)) * (1 - rear);
    if (rear <= 0 && dig <= 0) return;
    frameNow();

    if (rear > 0) {
      // ---- the body up about the hip joint, the hips raised a little over the hind feet and drawn back over them
      const thigh = hind[0].lengths[0], theta = UPRIGHT * rear;
      by.hips.quaternion.premultiply(q.setFromAxisAngle(AZ, theta));
      by.hips.position.y += LIFT * thigh * rear;
      by.hips.position.x -= 0.18 * thigh * rear;
      frameNow();
      // (as far up as the hind legs can reach their feet: the hips come down to where the nearer foot can be reached)
      let short = 0;
      for (const leg of hind) {
        J.copy(pivots[leg.chain[0]]).sub(pivots.hips).applyQuaternion(qHips).add(hipsAt);
        C.set(leg.Fp.x + Math.sin(leg.beta) * leg.lengths[2], leg.Fp.y + Math.cos(leg.beta) * leg.lengths[2], leg.Fp.z);
        short = Math.max(short, J.distanceTo(C) - 0.97 * (leg.lengths[0] + leg.lengths[1]));
      }
      if (short > 0) { by.hips.position.y -= short; frameNow(); }
      // ---- the hind legs, from the hips as they now are to the feet where they stand, the paws flat
      for (const leg of hind) {
        const [l1, l2, l3] = leg.lengths;
        J.copy(pivots[leg.chain[0]]).sub(pivots.hips).applyQuaternion(qHips).add(hipsAt);
        F.copy(leg.Fp);
        C.set(F.x + Math.sin(leg.beta) * l3, F.y + Math.cos(leg.beta) * l3, F.z);
        knee(J, C, l1, l2, pole.set(1, 0, 0), E, reachC);
        qParent.copy(qHips);
        setLeg(leg, J.clone(), E.clone(), reachC.clone(), F.clone(), qPaw.identity(), 1);
      }
      // ---- the forelegs hanging in front of the chest: the upper arm a little forward of straight down, the elbow
      // bent so the forearm points forward and down, the paw hanging from the wrist
      for (const leg of fore) {
        const [l1, l2, l3] = leg.lengths;
        foreTop(leg);
        const top = J.clone();
        E.copy(top).add(tmp.set(Math.sin(0.25), -Math.cos(0.25), 0).multiplyScalar(l1));
        C.copy(E).add(tmp.set(Math.sin(1.0), -Math.cos(1.0), 0).multiplyScalar(l2));
        F.copy(C).add(tmp.set(Math.sin(0.35), -Math.cos(0.35), 0).multiplyScalar(l3));
        qParent.copy(qScap);
        setLeg(leg, top, E.clone(), C.clone(), F.clone(), qPaw.setFromAxisAngle(AZ, -1.25), rear);
      }
      // ---- the neck and the head levelled: the body's pitch taken out of them, most of it low in the neck
      const shares = [0.4, 0.25, 0.15, 0.2];
      ['neck1', 'neck2', 'neck3', 'head'].forEach((name, k) => by[name].quaternion.multiply(q.setFromAxisAngle(AZ, -theta * shares[k])));
    }

    if (dig > 0) {
      // ---- one forepaw at work, the right first and then the left by turns; the other where it stood. A stroke:
      // out and up to the far end of what it works at, down onto it and dragged back towards the body, claws down,
      // and back to the ground where it stood.
      const rake = Math.max(0, P.rake ?? 0), stroke = Math.floor(rake), t = rake - stroke;
      const leg = fore[stroke % 2 === 0 ? 1 : 0], [l1, l2, l3] = leg.lengths;
      const reach = P.reach ?? 0.35, at = Math.max(0, P.at ?? 0);
      foreTop(leg);
      // (the paw's joint stands as high over what the paw is on as it stands over the ground)
      const top = J.clone(), home = leg.Fp.clone(), over = leg.F0.y;
      const far = new THREE.Vector3(top.x + reach, at + over + 0.02 * l1, home.z * 0.8), near = new THREE.Vector3(top.x + reach * 0.45, at + over, home.z * 0.8);
      const lift = 0.25 * l1;
      if (t < 0.35) { const u = ease(t / 0.35); F.lerpVectors(home, far, u); F.y += lift * Math.sin(Math.PI * u); }
      else if (t < 0.75) { const u = ease((t - 0.35) / 0.4); F.lerpVectors(far, near, u); }
      else { const u = ease((t - 0.75) / 0.25); F.lerpVectors(near, home, u); F.y += 0.5 * lift * Math.sin(Math.PI * u); }
      // the wrist over the paw, leaning the way the paw goes; the paw's toes down while it rakes
      const claws = t >= 0.3 && t < 0.78 ? 0.45 : 0.1;
      C.set(F.x - Math.sin(0.25) * l3, F.y + Math.cos(0.25) * l3, F.z);
      knee(top, C, l1, l2, pole.set(-1, 0, 0), E, reachC);
      qParent.copy(qScap);
      setLeg(leg, top, E.clone(), reachC.clone(), F.clone(), qPaw.setFromAxisAngle(AZ, -claws), dig);
    }
  };
}
