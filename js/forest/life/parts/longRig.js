import * as THREE from 'three';

// How the weasel family's long low body is posed (mustelids, 2026-11-16): for a beast whose sheet gives `shape.long`
// (the river otter, the fisher, the striped skunk), called by one line at the end of life/beastRig.js's pose. The
// elk's rig has posed every bone by then; this poses the body, the legs, the neck's first joint and the tail again,
// in the animal's own sizes, from the same pose fields and three of its own:
//   walk           a walk (a lateral sequence, as the elk's), in the sheet's own stride
//   gallop         the bound of a weasel: the forefeet down nearly together, the hind feet brought up under the
//                  arched back and set down where the forefeet were, then all four off the ground with the back
//                  stretched out
//   swim           0..1: swimming, the body level, the forefeet tucked under the chest and the hind feet paddling
//                  by turns, the back and the tail rippling with the strokes                                  (new)
//   dig            0..1: the forefeet scraping at the ground under the nose by turns, the front let down       (new)
//   rear           0..1: up on the hind feet, the front lifted                                                 (new)
//   stamp          the forefeet raised together, to be brought down hard (the skunk's warning)
//   arch           -1..1: the back bent up (+) or hollowed (-) besides what a gait does                        (new)
//   lie, neck, head, ground, tail, cycle   as the elk's (`tail` 1 raises it by the sheet's `long.tailUp` degrees)
// The sheet's `shape.long` (each optional): { trunk: [[rings along, round], ...] for each detail level (life/beast.js:
// a small animal's trunk needs fewer than the elk's 52 by 24),  strides: { walk, bound } (m, one whole cycle of each at the sheet's
// size), lift: { walk, bound } (a foot's height in its swing, as a share of the leg's height), arch (radians the back
// bends at the height of a bound), bob (m it rises and falls in one), tailUp (degrees), dip (m the front comes down
// to dig) }. Every number here is the agent's own: no source read gave a weasel's footfalls or how far its back bends.
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const D = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => t * t * (3 - 2 * t);
const frac = (x) => ((x % 1) + 1) % 1;
const _x = new THREE.Vector3(), _z = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

// the middle joint of a two-bone limb from `a` to `c`, bending towards `pole` (life/beastRig.js's own, copied)
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

// Each foot, [left fore, right fore, left hind, right hind]: added to the cycle, a foot is down while the sum (its
// fraction) is under the duty. The bound: the forefeet down at 0 and 0.05, the hind feet at 0.33 and 0.38.
const WALK = { phase: [0.75, 0.25, 0.0, 0.5], duty: 0.64 };
const BOUND = { phase: [0.0, 0.95, 0.67, 0.62], duty: [0.3, 0.28] };

export function longRig({ by, legs, pivots, shape }) {
  const long = shape.long, strides = { walk: 0.3, bound: 0.7, ...(long.strides || {}) }, lift = { walk: 0.22, bound: 0.42, ...(long.lift || {}) };
  const bendMost = long.arch ?? 0.3, bobMost = long.bob ?? 0.03, tailUp = (long.tailUp ?? 60) * D, dipMost = long.dip ?? 0.04;
  const hipsPivot = pivots.hips, chestPivot = pivots.chest;
  const fore = legs.find((l) => l.fore), hind = legs.find((l) => !l.fore);
  const xs = Math.max(0.05, fore.F0.x - hind.F0.x);
  const high = (leg) => pivots[leg.chain[0]].y;                    // a leg's height, its top joint's as it stands
  const qHips = new THREE.Quaternion(), qChest = new THREE.Quaternion(), qScap = new THREE.Quaternion(), qParent = new THREE.Quaternion();
  const qBone = new THREE.Quaternion(), qFold = new THREE.Quaternion();
  const hipsAt = new THREE.Vector3(), chestAt = new THREE.Vector3(), J = new THREE.Vector3(), tmp = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3();
  const Fp = new THREE.Vector3(), F = new THREE.Vector3(), C = new THREE.Vector3(), E = new THREE.Vector3(), reachC = new THREE.Vector3(), reachF = new THREE.Vector3();
  const lands = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const folds = [0, 0, 0, 0], overs = [0, 0, 0, 0], swings = [0, 0, 0, 0];

  return function poseLong(P) {
    const cycle = P.cycle ?? 0, ground = P.ground || [0, 0, 0, 0], head = P.head || {};
    const lie = clamp(P.lie ?? 0, 0, 1), swim = clamp(P.swim ?? 0, 0, 1), dig = clamp(P.dig ?? 0, 0, 1) * (1 - swim);
    const rear = clamp(P.rear ?? 0, 0, 1) * (1 - swim) * (1 - lie), stamp = clamp(P.stamp ?? 0, 0, 1) * (1 - swim) * (1 - lie);
    const onLand = (1 - swim) * (1 - lie);
    const walk = clamp(P.walk ?? 0, 0, 1) * onLand, bound = clamp(P.gallop ?? 0, 0, 1) * onLand;
    const c = frac(cycle), tc = 2 * Math.PI * c;

    // ---- each foot (its ankle or wrist: the joint over the paw) on the ground, in the animal's frame
    legs.forEach((leg, i) => {
      const h = high(leg), f = leg.fore ? 0 : 1, out = lands[i];
      out.copy(leg.F0); folds[i] = 0; overs[i] = 0; swings[i] = 0;
      const step = (k, stride, duty, phase, reach, rise) => {
        if (k <= 0) return;
        const p = frac(cycle + phase), sweep = stride * duty;
        if (p < duty) { out.x += k * (reach + sweep * (0.5 - p / duty)); overs[i] += k * 0.7 * ease(clamp((p / duty - 0.6) / 0.4, 0, 1)); return; }
        const q = (p - duty) / (1 - duty), arc = Math.sin(Math.PI * q);
        out.x += k * (reach + sweep * (ease(q) - 0.5));
        out.y += k * rise * h * arc ** 0.8;
        folds[i] += k * (leg.fore ? 1.1 : 0.8) * arc;
        swings[i] = Math.max(swings[i], k * arc);
      };
      step(walk, strides.walk, WALK.duty, WALK.phase[i], 0, lift.walk);
      step(bound, strides.bound, BOUND.duty[f], BOUND.phase[i], strides.bound * (leg.fore ? 0.05 : 0.12), lift.bound);
      // digging: the forefeet by turns, down ahead of the chest and drawn back along the ground, then up and forward
      if (dig > 0 && leg.fore) {
        const p = frac(cycle + (leg.side < 0 ? 0 : 0.5)), q = p < 0.5 ? p / 0.5 : (p - 0.5) / 0.5;
        const x = p < 0.5 ? lerp(0.5, 0.05, q) : lerp(0.05, 0.5, ease(q)), y = p < 0.5 ? 0 : 0.3 * Math.sin(Math.PI * q);
        out.x += dig * x * h; out.y += dig * (y * h - dipMost * 0.5); folds[i] += dig * (p < 0.5 ? 0.5 : 1.0);
      }
      // the forefeet raised to stamp, and up on the hind feet
      if (leg.fore && stamp > 0) { out.y += stamp * 0.4 * h; out.x += stamp * 0.12 * h; folds[i] += stamp * 0.6; swings[i] = Math.max(swings[i], stamp); }
      out.y += ground[i];
    });

    // ---- the body: how high its two ends are, its pitch, and how far its back is bent up at the chest's joint
    let bob = 0, pitch = 0, bend = clamp(P.arch ?? 0, -1, 1) * bendMost;
    bob -= walk * bobMost * 0.15 * (1 - Math.cos(2 * tc));
    bob += bound * bobMost * Math.sin(tc - Math.PI);
    pitch += bound * 0.07 * Math.sin(tc - 0.55 * 2 * Math.PI);
    bend += bound * bendMost * (0.35 + 0.65 * Math.cos(tc - 0.3 * 2 * Math.PI));
    bend += swim * 0.05 * Math.sin(tc);
    const drop = (shape.lie && shape.lie.drop) || 0;
    const groundF = (ground[0] + ground[1]) / 2, groundH = (ground[2] + ground[3]) / 2;
    const back = bob - drop * lie + groundH * (1 - lie), front = bob - drop * lie + groundF * (1 - lie) - dig * dipMost - rear * 0.0;
    const tilt = Math.atan2(front - back, xs) + pitch + rear * 0.95;
    by.hips.position.copy(hipsPivot).add(tmp.set(0, back + rear * 0.01, 0));
    by.hips.quaternion.setFromAxisAngle(AZ, tilt + bend / 2);
    qHips.copy(by.hips.quaternion);
    by.chest.quaternion.setFromAxisAngle(AZ, -bend);
    qChest.copy(qHips).multiply(by.chest.quaternion);
    hipsAt.copy(by.hips.position);
    chestAt.copy(chestPivot).sub(hipsPivot).applyQuaternion(qHips).add(hipsAt);

    // ---- the legs
    legs.forEach((leg, i) => {
      const spec = leg.spec, [l1, l2, l3] = leg.lengths, h = high(leg), side = leg.side;
      if (leg.fore) {
        const scap = by[leg.scap], swing = spec.scapSwing ?? 0.22, most = spec.scapMost ?? 0.2;
        scap.quaternion.setFromAxisAngle(AZ, clamp(swing * (lands[i].x - leg.F0.x) * (1 - swim), -most, most));
        qScap.copy(qChest).multiply(scap.quaternion);
        tmp.copy(pivots[leg.scap]).sub(chestPivot).applyQuaternion(qChest).add(chestAt);
        J.copy(pivots[leg.chain[0]]).sub(pivots[leg.scap]).applyQuaternion(qScap).add(tmp);
        qParent.copy(qScap);
      } else {
        J.copy(pivots[leg.chain[0]]).sub(hipsPivot).applyQuaternion(qHips).add(hipsAt);
        qParent.copy(qHips);
      }
      Fp.copy(lands[i]);
      let fold = folds[i], over = overs[i], swung = swings[i];
      // swimming: the forefeet tucked under the chest; the hind feet paddling by turns, the sole turned back on
      // the stroke and the toes trailing as the foot comes forward again
      if (swim > 0) {
        if (leg.fore) tmp.set(J.x + 0.25 * h, J.y - 0.5 * h, side * spec.at[1] * 0.9);
        else { const th = tc + (side < 0 ? 0 : Math.PI); tmp.set(J.x - 0.35 * h + 0.38 * h * Math.cos(th), J.y - 0.62 * h + 0.14 * h * Math.sin(th), side * spec.at[1] * 1.15); }
        Fp.lerp(tmp, swim);
        fold = lerp(fold, leg.fore ? 1.2 : 1.6 - 0.7 * Math.sin(tc + (side < 0 ? 0 : Math.PI)), swim); over *= 1 - swim; swung = Math.max(swung * (1 - swim), swim);
      }
      // up on the hind feet: the forefeet hang from the shoulders
      if (rear > 0 && leg.fore) { Fp.lerp(tmp.set(J.x + 0.2 * h, J.y - 0.8 * h, Fp.z), rear); fold = lerp(fold, 0.9, rear); over *= 1 - rear; swung = Math.max(swung, rear); }
      // lying down: the forefeet out ahead and the hind feet out behind, flat on the ground
      if (lie > 0) {
        tmp.set(leg.fore ? J.x + 0.55 * h : J.x - 0.5 * h, leg.F0.y * 0.5, side * (spec.at[1] + 0.25 * h));
        Fp.lerp(tmp, lie); fold *= 1 - lie; over *= 1 - lie; swung *= 1 - lie;
      }
      F.copy(Fp);
      if (over > 0) {
        const co = Math.cos(over), si = Math.sin(over), [ta, tb] = leg.toe;
        F.x += ta - (ta * co + tb * si); F.y += tb - (-ta * si + tb * co);
      }
      // the short bone over the paw, from the ankle or wrist up: as it stands, swung back under the leg in the air
      const beta = leg.beta + (leg.fore ? -0.5 : 0.6) * swung;
      C.set(F.x + Math.sin(beta) * l3, F.y + Math.cos(beta) * l3, F.z);
      pole.set(leg.fore ? -1 : 1, 0, 0);
      knee(J, C, l1, l2, pole, E, reachC);
      reachF.copy(F).sub(reachC).normalize().multiplyScalar(l3).add(reachC);
      const ends = [[J, E], [E, reachC], [reachC, reachF]];
      for (let b = 0; b < 3; b += 1) {
        dir.subVectors(ends[b][1], ends[b][0]).normalize();
        qBone.setFromUnitVectors(leg.dirs[b], dir);
        by[leg.chain[b]].quaternion.copy(_q.copy(qParent).invert()).multiply(qBone);
        qParent.copy(qBone);
      }
      qFold.setFromAxisAngle(AZ, -(fold + over));
      by[leg.chain[3]].quaternion.copy(_q.copy(qParent).invert()).multiply(qFold);
    });

    // ---- the neck's first joint: the body's own pitch taken out of it again (the head held steady as the body
    // bounds), as the elk's rig does for its own
    const n = clamp(P.neck ?? 0.6, 0, 1.15), graze = 1 - clamp(n / 0.6, 0, 1), yaw = clamp(head.yaw ?? 0, -1.6, 1.6);
    const lowN = shape.neck.low, highN = shape.neck.high;
    const at0 = n < 0.6 ? lowN[0] * (1 - n / 0.6) : highN[0] * ((n - 0.6) / 0.4);
    const p0 = at0 - (tilt - bend / 2) * 0.75 - (shape.neck.dip || 0) * graze * (1 - lie) + 0.12 * bound * Math.sin(tc - 1.2);
    by.neck1.quaternion.setFromAxisAngle(AY, -yaw * 0.3).multiply(_q.setFromAxisAngle(AZ, p0));

    // ---- the tail: raised by `tail`, streaming out behind in the bound, rippling as it swims
    const tail = clamp(P.tail ?? 0, 0, 1);
    by.tail.quaternion.setFromAxisAngle(AZ, -tail * tailUp - bound * 0.12 * (1 + Math.sin(tc)) + swim * 0.22 * Math.sin(tc + 0.9) - (tilt + bend / 2) * (0.5 + 0.6 * rear) * (1 - tail));
    void AX; void _q2;
  };
}
const lerp = (a, b, t) => a + (b - a) * t;
