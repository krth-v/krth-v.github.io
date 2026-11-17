import * as THREE from 'three';
import { TAIL } from './rodent.js';

// How a small mammal of the squirrel family holds itself (rodents, 2026-11-16): a second pass over the beast's pose
// (life/beastRig.js), for a sheet that gives `shape.climb`, which sets again the body, the legs, the tail's chain, the
// cone and its scales; the neck and the head, the jaw and the ears stay the beast's. Its pose fields, beside the
// beast's (`scale`, `neck`, `head`, `jaw`, `ears`, `tail`: 0 trailing .. 1 held up), all optional:
//   sit      0 on all fours .. 1 sitting up on its haunches, the hind feet flat, the body upright
//   hold     0 .. 1 the forepaws brought up to the mouth, holding the cone (shown as far as `hold`)
//   strip    0 .. 1 stripping the cone: its scales fall from it, onto what the animal sits on
//   husk     any number: how far the cone has been turned and stripped (it turns with it, and the scales fall by it)
//   cling    0 standing .. 1 pressed to bark, its feet spread to the sides and gripping
//   grip     the radius (m) of what it clings to, round under it (a limb); 0 for a trunk too big to matter, or the ground
//   down     0 .. 1 head down on a trunk, its hind feet turned back to hook the bark above it
//   scurry   0 .. 1 bounding: the hind feet together, landing ahead of the fore, the back gathering and stretching
//   cycle    any number: where in its bound it is (its fraction: 0 the hind feet pushing off)
//   crouch   0 .. 1 flattened to the ground or the bark, still
//   curl     0 .. 1 the tail's end curled forward over the back            flick   -1 .. 1 a jerk of the tail up (+)
//   wag      -1 .. 1 the tail swung to its right (+) or left
// The bound, the sitting and the clinging are the agent's own, drawn from what was read of how such animals move
// (the species' sheets) and from no measured gait: no source read gave a squirrel's or a chipmunk's footfalls.
//   shape.climb   { stride: m one bound carries it at a run, splay: m its feet go out to the sides clinging,
//                 flex: radians its back gathers and stretches in a bound }

const AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const TINY = 0.001;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const frac = (x) => x - Math.floor(x);
const ease = (t) => t * t * (3 - 2 * t);
const D = Math.PI / 180;
const _x = new THREE.Vector3(), _z = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _n = new THREE.Matrix4();

// how far one bound carries it at a share of a full run: shorter strides at a slower pace (for the family: it
// advances `cycle` by the distance covered over this)
export const strideOf = (shape, share) => shape.climb.stride * (0.3 + 0.7 * clamp(share, 0, 1));

// the middle joint of a two-bone limb from `a` to `c`, bending towards `pole` (as life/beastRig.js does it)
function knee(a, c, l1, l2, pole, out, end) {
  _x.subVectors(c, a);
  const d = clamp(_x.length(), Math.abs(l1 - l2) + 1e-5, (l1 + l2) * 0.9995);
  _x.normalize();
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), up = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  _z.copy(pole).addScaledVector(_x, -pole.dot(_x));
  if (_z.lengthSq() < 1e-10) _z.set(1, 0, 0);
  _z.normalize();
  out.copy(a).addScaledVector(_x, along).addScaledVector(_z, up);
  return end.copy(a).addScaledVector(_x, d);
}

// [left fore, right fore, left hind, right hind]: where in the bound each foot is put down, and for how much of it
// it stays down; how high it is lifted in the air (a share of the hips' height)
const BOUND = { phase: { LF: 0.48, RF: 0.55, LH: 0.0, RH: 0.04 }, duty: { fore: 0.3, hind: 0.36 }, lift: { fore: 0.32, hind: 0.24 } };

export function rodentRig({ by, pivots, shape, legs }) {
  const climb = shape.climb, height = pivots.hips.y, span = pivots.neck1.x - pivots.hips.x, head = shape.head;
  const hipsPivot = pivots.hips, chestPivot = pivots.chest;
  // the mouth, in the bind pose: under the end of the head's line, a little back from the nose
  const hs = head.stations, sEnd = hs[hs.length - 1][0], sMouth = sEnd - 0.18 * (sEnd - hs[0][0]);
  const downAt = (s) => { for (let i = 1; i < hs.length; i += 1) if (hs[i][0] >= s) { const f = (s - hs[i - 1][0]) / (hs[i][0] - hs[i - 1][0]); return hs[i - 1][2] + (hs[i][2] - hs[i - 1][2]) * f; } return hs[hs.length - 1][2]; };
  const hd = new THREE.Vector3(Math.cos(head.tilt * D), Math.sin(head.tilt * D), 0), hn = new THREE.Vector3(-hd.y, hd.x, 0);
  const mouthBind = new THREE.Vector3(head.at[0], head.at[1], 0).addScaledVector(hd, sMouth).addScaledVector(hn, -0.7 * downAt(sMouth));
  const coneLong = shape.cone ? shape.cone.long / 1000 : 0, coneWide = shape.cone ? shape.cone.wide / 1000 : 0;
  // each leg's own: its top joint's place on the bone it hangs from, its bones' lengths and rest ways, the foot's
  // rest place (`F0`: the end of its third bone, the ball of the foot) and the way its sole runs
  const L = legs.map((leg) => ({ leg, rest: pivots[leg.chain[0]], hang: leg.fore ? leg.scap : 'hips',
    E: new THREE.Vector3(), C: new THREE.Vector3(), F: new THREE.Vector3(), J: new THREE.Vector3(), R: new THREE.Vector3(), foot: new THREE.Vector3() }));
  const hipsAt = new THREE.Vector3(), chestAt = new THREE.Vector3(), qHips = new THREE.Quaternion(), qChest = new THREE.Quaternion(), qScap = new THREE.Quaternion(), qParent = new THREE.Quaternion(), qBone = new THREE.Quaternion(), qToe = new THREE.Quaternion();
  const tmp = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3(), mouth = new THREE.Vector3(), hand = new THREE.Vector3();

  // the head bone's matrix in the root's frame, from the bones as they are posed now
  const chain = ['hips', 'chest', 'neck1', 'neck2', 'neck3', 'head'];
  const headMatrix = (out) => {
    out.identity();
    for (const name of chain) { const b = by[name]; _m.compose(b.position, b.quaternion, b.scale); out.multiply(_m); }
    return out;
  };

  return function pose(P) {
    const sit = clamp(P.sit ?? 0, 0, 1), hold = clamp(P.hold ?? 0, 0, 1), strip = clamp(P.strip ?? 0, 0, 1), cling = clamp(P.cling ?? 0, 0, 1);
    const down = clamp(P.down ?? 0, 0, 1), run = clamp(P.scurry ?? 0, 0, 1) * (1 - sit), crouch = clamp(P.crouch ?? 0, 0, 1), cyc = frac(P.cycle ?? 0);
    const grip = P.grip ?? 0, stride = strideOf(shape, run) * run, w = 2 * Math.PI * cyc;

    // ---- the body: in a bound the back gathers as the hind feet come forward and stretches as they push off, and it
    // rises in the air; clinging or crouched it is let down close to what it stands on; sitting up, the hips come down
    // onto their seat and the body turns up about them
    const gather = run * climb.flex * Math.sin(w + 1.9);                  // + gathered (the hind feet forward under it)
    const bob = run * height * 0.35 * Math.max(0, Math.sin(w - 0.4)) ** 1.5;
    const low = height * (0.24 * crouch + 0.42 * cling * (1 - sit));
    const up = sit * 1.08;
    hipsAt.copy(hipsPivot);
    hipsAt.y += bob - low - sit * height * 0.5;
    hipsAt.x += gather * span * 0.18 - sit * height * 0.12;
    qHips.setFromAxisAngle(AZ, up - gather * 0.55);
    by.hips.position.copy(hipsAt); by.hips.quaternion.copy(qHips);
    by.chest.quaternion.setFromAxisAngle(AZ, sit * 0.22 + gather * 0.85);
    qChest.copy(qHips).multiply(by.chest.quaternion);
    chestAt.copy(chestPivot).sub(hipsPivot).applyQuaternion(qHips).add(hipsAt);
    // the neck takes the body's turn back out, so that the head stays as the beast's pose has it
    const turned = up + sit * 0.22 + gather * 0.3;
    [['neck1', 0.42], ['neck2', 0.33], ['neck3', 0.25]].forEach(([name, k]) => by[name].quaternion.premultiply(_q.setFromAxisAngle(AZ, -turned * k)));
    // where the mouth is now, for the forepaws and the cone
    headMatrix(_n);
    mouth.copy(mouthBind).sub(pivots.head).applyMatrix4(_n);

    // ---- the legs
    for (const l of L) {
      const leg = l.leg, [l1, l2, l3] = leg.lengths, side = leg.side, fore = leg.fore;
      // the top joint, where the body has put it
      if (fore) {
        const scap = by[leg.scap];
        scap.quaternion.setFromAxisAngle(AZ, clamp(-gather * 0.6, -0.4, 0.4));
        qScap.copy(qChest).multiply(scap.quaternion);
        tmp.copy(pivots[leg.scap]).sub(chestPivot).applyQuaternion(qChest).add(chestAt);
        l.J.copy(l.rest).sub(pivots[leg.scap]).applyQuaternion(qScap).add(tmp);
        qParent.copy(qScap);
      } else {
        l.J.copy(l.rest).sub(hipsPivot).applyQuaternion(qHips).add(hipsAt);
        qParent.copy(qHips);
      }
      // the foot: where its sole is put down, and which way it runs along the sole (`foot`, from the heel or the
      // wrist to the ball): the rest way, spread out to the side clinging, turned back on a hind foot going down
      l.F.copy(leg.F0); l.foot.copy(leg.dirs[2]);
      const spread = cling * climb.splay * (fore ? 0.8 : 1.15), turn = side * cling * (fore ? 0.5 : 0.35);
      l.F.z += side * spread;
      // round under it on a limb: the further out to the side, the lower
      if (grip > 0 && cling > 0) { const zz = Math.min(Math.abs(l.F.z), grip * 0.98); l.F.y -= cling * (grip - Math.sqrt(grip * grip - zz * zz)); }
      l.foot.applyAxisAngle(AY, -turn);
      if (!fore && down > 0) { l.foot.applyAxisAngle(AY, Math.PI * ease(down)); l.F.x += down * l3 * 0.9; l.F.y += down * height * 0.22; }
      // in its bound: back along the ground while it is down, forward and up in the air
      let lift = 0, fold = 0;
      if (run > 0) {
        const p = frac(cyc - BOUND.phase[leg.key]), duty = fore ? BOUND.duty.fore : BOUND.duty.hind, reach = stride * duty;
        if (p < duty) l.F.x += reach * (0.5 - p / duty) + (fore ? 0 : reach * 0.35);
        else {
          const q = (p - duty) / (1 - duty), arc = Math.sin(Math.PI * q);
          l.F.x += reach * (q - 0.5) + (fore ? 0 : reach * 0.35);
          lift = arc * height * (fore ? BOUND.lift.fore : BOUND.lift.hind) * (0.4 + 0.6 * run);
          fold = arc;
        }
        l.F.y += lift;
      }
      // sitting up: the hind feet flat a little forward, under the body; the forepaws drawn up to the chest, or to
      // the mouth to hold what it eats, the wrist below and the fingers up
      let pawUp = 0;
      if (fore && sit > 0) {
        hand.copy(mouth).add(tmp.set(0.25 * coneWide + 0.003, -0.5 * coneWide - 0.004, side * (coneLong * 0.32 + 0.004)));
        const tuck = tmp.copy(chestAt).addScaledVector(dir.set(0.3, 0.2, 0).applyQuaternion(qChest), span * 0.6);
        tuck.z = side * Math.abs(l.rest.z) * 0.6;
        tuck.lerp(hand, hold);
        l.F.lerp(tuck, ease(sit));
        pawUp = sit;
      } else if (!fore && sit > 0) l.F.x += sit * l3 * 0.25;
      if (pawUp > 0) l.foot.lerp(dir.set(0.25, 1, 0).normalize(), pawUp).normalize();
      // the cannon (the third bone) from the sole's ball back up its own way; the first two bones from the top
      // joint to its top: the elbow goes back and down, the knee forward, both out to the side when it clings
      l.C.copy(l.F).addScaledVector(l.foot, -l3);
      if (!pawUp) l.C.y += fold * l3 * 0.6 * (fore ? 1 : 0.4);
      pole.set(fore ? -1 : 1, fore ? -0.2 : 0.1, side * (0.25 + 1.4 * cling));
      knee(l.J, l.C, l1, l2, pole, l.E, l.R);
      // (out of reach, the cannon starts where the leg could reach)
      tmp.copy(l.F).sub(l.R).normalize().multiplyScalar(l3).add(l.R);
      const ends = [[l.J, l.E], [l.E, l.R], [l.R, tmp]];
      for (let b = 0; b < 3; b += 1) {
        dir.subVectors(ends[b][1], ends[b][0]).normalize();
        qBone.setFromUnitVectors(leg.dirs[b], dir);
        by[leg.chain[b]].quaternion.copy(_q.copy(qParent).invert()).multiply(qBone);
        qParent.copy(qBone);
      }
      // the toes: flat on what it stands on, turned out as the foot is, curled in the air and round what it holds
      qToe.setFromAxisAngle(AY, -turn + (!fore ? Math.PI * ease(down) : 0)).multiply(_q.setFromAxisAngle(AZ, -(fold * 0.9 + (fore ? pawUp * (0.6 + 0.9 * hold) : 0))));
      by[leg.chain[3]].quaternion.copy(_q.copy(qParent).invert()).multiply(qToe);
    }

    // ---- the tail: raised from its root (`tail`), its end curled forward over the back (`curl`), up the back when
    // it sits, streaming and rippling behind in a bound; a flick is a jerk up from the root that whips to its end
    const raise = clamp(P.tail ?? 0.5, 0, 1), curl = clamp(P.curl ?? 0, 0, 1), flick = clamp(P.flick ?? 0, -1, 1), wag = clamp(P.wag ?? 0, -1, 1);
    const bend = [0, 0.22, 0.3, 0.36, 0.36, 0.3];
    TAIL.forEach((name, k) => {
      let p = k === 0 ? -(raise * 1.35 - 0.2) - sit * 0.55 + run * 0.35 - flick * 0.55 + gather * 0.4 : -curl * bend[k] * 1.6 + flick * (k === 1 ? 0.3 : -0.08) + sit * (k < 3 ? 0.12 : -0.05);
      if (run > 0 && k > 0) p += run * 0.16 * Math.sin(w - k * 0.9);
      by[name].quaternion.setFromAxisAngle(AY, k === 0 ? wag * 0.5 : wag * 0.08).multiply(_q.setFromAxisAngle(AZ, p));
    });

    // ---- the cone, across the mouth between the forepaws, turned as it is stripped; its scales fall from it to
    // what the animal sits on (the root's level), drifting, turning, and are gone there
    const shown = shape.cone ? hold : 0, husk = P.husk ?? 0;
    by.cone.scale.setScalar(Math.max(TINY, shown));
    by.cone.position.copy(mouth).add(tmp.set(0.2 * coneWide + 0.002, -0.55 * coneWide - 0.003, 0));
    by.cone.quaternion.setFromAxisAngle(AZ, husk * 2.2);
    ['flake1', 'flake2', 'flake3'].forEach((name, k) => {
      const bone = by[name], f = frac(husk * 0.45 + k / 3), on = shape.cone ? strip * hold : 0;
      bone.scale.setScalar(Math.max(TINY, on * (f < 0.92 ? 1 : (1 - f) / 0.08)));
      bone.position.copy(by.cone.position);
      bone.position.y = by.cone.position.y * (1 - f * f) + 0.001;
      bone.position.x += (k - 1) * 0.004 + f * 0.01 * Math.sin(k * 2.1 + husk);
      bone.position.z += f * 0.012 * Math.cos(k * 1.7 + husk);
      bone.quaternion.setFromAxisAngle(tmp.set(0.4, 1, 0.3).normalize(), f * 9 + k).multiply(_q.setFromAxisAngle(AZ, f * 3));
    });
  };
}
