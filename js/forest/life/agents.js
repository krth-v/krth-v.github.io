import * as THREE from 'three';

// What every bird's flight is made of, and two names the cast of checkpoint 2 asks this file for. Each kind's life
// is its family's (life/families/), on the shared skeleton (life/behave.js), whose files say what was read and what
// is the agent's own. What is left here is what the families share: `frame`, `takeOff` and `flying` (a flight: out
// and up, across, and in to land; at an even pace for one of a visit's own animals), `straightOn` (on away from the
// walker until too small or too far off to be seen), `pace` (how much further off a walker who runs is felt),
// `spot` and `UP`. (Until 2026-11-16 each bird's behaviour was written here, with `wariness`: the watching and
// edging away that the owner's rule for birds took out.)

export const UP = new THREE.Vector3(0, 1, 0);
const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _t = new THREE.Vector3();
const _q = new THREE.Quaternion();
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const spot = () => ({ point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() });

// The frame whose +x is `ahead` (as nearly as it can be) and whose +y is `up`.
export function frame(ahead, up, out) {
  _y.copy(up).normalize();
  _x.copy(ahead).addScaledVector(_y, -ahead.dot(_y));
  if (_x.lengthSq() < 1e-10) _x.set(1, 0, 0).addScaledVector(_y, -_y.x);
  _x.normalize();
  _z.crossVectors(_x, _y);
  return out.setFromRotationMatrix(_m.makeBasis(_x, _y, _z));
}

// A flight from where the bird is to `to` ({ at, q, rise }): out and up, across, and in to land.
export function takeOff(bird, to, speed, then) {
  const from = bird.at.clone(), dist = from.distanceTo(to.at), climb = Math.min(1.2, dist * 0.18);
  const lift = _v.set(0, 1, 0).applyQuaternion(bird.q).clone();
  bird.flight = {
    a: from, b: from.clone().addScaledVector(lift, 0.25).add(new THREE.Vector3(0, climb, 0)).lerp(to.at, 0.3).setY(Math.max(from.y, to.at.y) + climb + (to.rise ?? 0) * 0.3),
    c: to.at.clone().addScaledVector(to.out || UP, Math.min(0.9, dist * 0.3)).add(new THREE.Vector3(0, to.rise ?? 0, 0)), d: to.at.clone(),
    q0: bird.q.clone(), q1: to.q.clone(), t: 0, time: Math.max(0.45, dist / speed), then,
    // `through`: it does not land at the far end, it flies on (out of sight). `aloft`: it was on the wing already.
    through: !!to.through, aloft: !!bird.aloft,
    // `floor`: the ground's height, for a flight low over it, which is then never under it
    floor: to.floor || null, table: null,
  };
  // One of a visit's animals flies its curve at an even pace. Flown by the curve's own parameter, as the cast
  // of checkpoint 2 flies it, a bird going up to a perch began at three times the flight's pace (27 m/s for a
  // tenth of a second: found by the count of walks, which looks for an animal that jumps).
  if (bird.life) {
    const f = bird.flight, table = [0];
    _t.copy(f.a);
    for (let k = 1; k <= EVEN; k += 1) { table.push(table[k - 1] + curveAt(f, k / EVEN, _v).distanceTo(_t)); _t.copy(_v); }
    f.table = table; f.time = Math.max(0.45, table[EVEN] / speed);
  }
  bird.aloft = false;
  bird.state = 'fly';
  bird.doing = 'flying';
}
const EVEN = 20;
const curveAt = (f, t, out) => { const u = 1 - t; return out.set(0, 0, 0).addScaledVector(f.a, u * u * u).addScaledVector(f.b, 3 * u * u * t).addScaledVector(f.c, 3 * u * t * t).addScaledVector(f.d, t * t * t); };

// How much further off than at a stroll a walker is felt: 1 for one who stands or strolls, nearly twice as
// far for one who runs (the walk is 3.2 m/s and the run 7).
export const pace = (world) => 1 + 0.9 * clamp(((world.walker ? world.walker.speed : 0) - 1.5) / 5.5, 0, 1);

// Still in the walker's plain sight, and nowhere found to go behind: straight on, away from them, a long leg at a
// time, until it is too small or too far off to be seen (three legs at the most: over two hundred metres).
export function straightOn(bird, world, seconds, speed, legs) {
  const dx = bird.at.x - world.eye.x, dz = bird.at.z - world.eye.z, d = Math.hypot(dx, dz) || 1;
  const x = bird.at.x + (dx / d) * 70, z = bird.at.z + (dz / d) * 70, to = new THREE.Vector3(x, Math.max(bird.at.y, world.height(x, z) + 9), z);
  takeOff(bird, { at: to, q: frame(_v.subVectors(to, bird.at).setY(0), UP, _q).clone(), through: true, floor: world.height }, speed, () => {
    bird.aloft = true;
    // (and a big bird that a running walker keeps in plain sight flies on past those, a few legs more)
    if (legs > -5 && world.plain(bird.at, bird.size)) straightOn(bird, world, seconds, speed, legs - 1);
    else { bird.left = seconds; bird.state = 'gone'; }
  });
  bird.doing = 'flying off into the wood';
}

export function flying(bird, dt, hz) {
  const f = bird.flight;
  f.t = Math.min(1, f.t + dt / f.time);
  const t = f.t;
  // where on the curve it is: by the curve's own parameter, or (with a table of lengths) by the share of the way flown
  let p = t;
  if (f.table) {
    const want = t * f.table[EVEN];
    let k = 0;
    while (k < EVEN - 1 && f.table[k + 1] < want) k += 1;
    p = (k + (want - f.table[k]) / Math.max(f.table[k + 1] - f.table[k], 1e-9)) / EVEN;
  }
  const u = 1 - p;
  curveAt(f, p, bird.at);
  _t.set(0, 0, 0).addScaledVector(f.a, -3 * u * u).addScaledVector(f.b, 3 * u * u - 6 * u * p).addScaledVector(f.c, 6 * u * p - 3 * p * p).addScaledVector(f.d, 3 * p * p);
  if (f.floor && t < 1) { const least = f.floor(bird.at.x, bird.at.z) + 0.025; if (bird.at.y < least) bird.at.y = least; }
  if (_t.lengthSq() > 1e-8) frame(_t, UP, bird.q);
  // it leaves and arrives in the attitude of its perch
  const begun = Math.min(1, t / 0.12), arrive = f.through ? 1 : Math.min(1, (1 - t) / 0.14);
  if (begun < 1) bird.q.slerpQuaternions(f.q0, bird.q, begun);
  if (arrive < 1) bird.q.slerp(f.q1, 1 - arrive);
  bird.beat += dt * hz * Math.PI * 2;
  const flare = 1 - arrive, open = (f.aloft ? 1 : Math.min(1, t / 0.05)) * (f.through ? 1 : Math.min(1, (1 - t) / 0.04));
  // the wings are swept back a little in level flight, and brought forward to brake
  Object.assign(bird.want, { pitch: 0.06 + 0.55 * flare, lift: 0.6, lean: 0, spread: open, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1.0), sweep: 0.12 - 0.3 * flare,
    droop: 0, gape: 0, head: { yaw: 0, pitch: 0 }, tail: { pitch: 0.1 * flare, fan: 0.12 + 0.4 * flare, prop: null }, feet: { mode: flare > 0.5 ? 'flat' : 'tuck' } });
  bird.snap = true;                                    // wings beat too fast to be eased
  if (t >= 1) { if (!f.through) bird.q.copy(f.q1); bird.flight = null; f.then(); }
}

// ---- Varied Thrush: forages on the ground in hops, turning litter over with its bill; sings from a perch at dawn and dusk. Its
// life is its family's, on life/behave.js (life/families/ground.js, with the American Robin's and Swainson's Thrush's). The cast
// of checkpoint 2 asks this file for it by name (life/index.js), and the family hands it over as it loads (`thrush.cast`).
export function thrush(bird, world) { return thrush.cast(bird, world); }

// ---- Brown Creeper: hitches up a trunk in a spiral, braced on its tail, then drops to the foot of another tree
// Its life is its family's, on life/behave.js (life/families/creeper.js). The cast of checkpoint 2 asks this file for
// it by name (life/index.js), and the family hands it over as it loads (`creeper.cast`). (Steller's Jay's life is its
// family's too: life/families/corvid.js.)
export function creeper(bird, world) { return creeper.cast(bird, world); }
