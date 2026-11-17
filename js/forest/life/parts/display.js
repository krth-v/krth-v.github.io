import * as THREE from 'three';

// A grouse's display (the grouse's, 2026-11-16): a comb of bare skin over the eye, which swells; a ruff of broad
// feathers on each side of the neck, which is raised; and a tail that is spread into a fan. Each is built only for
// a sheet that asks for it, and after every other part of the bird, so a bird that asks for none is vertex for
// vertex what it was (life/bird.js calls `buildDisplay` and `fanBind`). Each moves on bones of its own, appended
// to the bird's (DISPLAY_BONES): a bird that asks for none has them too, unmoved, each at its parent's joint, and
// its vertices never name them.
//
//   shape.comb: { long, high, rest, wide, ahead }   a ridge of bare skin `long` mm along the eye's upper rim, which
//                    stands `high` mm out of the feathers when it is swollen and `rest` of that (0.3 if not given)
//                    when it is not; `wide` mm across (a third of its length if not given), its middle `ahead` of
//                    its length before the eye's (-0.08: a little behind it). The rest of it is under the skin,
//                    and in display it is pushed out and swells by a fifth. Its paint is the skin's where it lies
//                    (life/parts/displayPaint.js lays `plumage.comb` there), so the bare skin round it shows at
//                    rest, and at any distance.
//   shape.ruff: { long, at, around, wide, fan, raise, tilt }   on each side of the neck, broad feathers `long` mm
//                    long rooted along the side of the neck at x = `at` (a quarter of the way into the neck if not
//                    given), from `around[0]` to `around[1]` of the way round it from the belly to the back
//                    ([0.34, 0.72]), each `wide` mm across at its tip (0.45 of its length), lying back along the
//                    neck and fanned apart by `fan` (0.5) of their spread round it towards their tips. In display
//                    they are raised: turned out from the neck by `raise` radians (1.35) and up by `tilt` (0.3),
//                    each side about its roots. Their paint is the skin's where they lie (`plumage.ruff`).
//   shape.tail.fan: { spread }   a tail that is spread, in display, until its outermost feathers are `spread`
//                    radians further out than when it is closed (life/families/fowl.js reads it). Its feathers
//                    hang on four bones of their own besides the tail's two (DISPLAY_BONES), so that each turns
//                    by the share of the fan it stands at: on two bones alone a feather half way out was drawn
//                    straight between them, and a tail spread into a half circle came out a polygon, its middle
//                    feathers a quarter shorter.
//
// The pose (life/rig.js calls `displayPose` at the end of its own): `display`, 0 to 1, how far into display the
// bird is: the comb swollen and the ruff raised. The tail's spread is the tail's own `fan` (radians), as every
// bird's is; a tail that has fan bones spreads it over them. Neither `display` nor a fan is in a bird's neutral
// pose (life/bodies.js `rest`): a family whose birds display names `display` in every one of its activities'
// poses, its flight too (life/families/fowl.js does), so that none is carried into the next.
//
// Every number here that is not a sheet's is the agent's own.

export const DISPLAY_BONES = ['combL', 'combR', 'ruffL', 'ruffR', 'fanL1', 'fanL2', 'fanR1', 'fanR2'];
export const DISPLAY_PARENT = { combL: 'head', combR: 'head', ruffL: 'body', ruffR: 'body', fanL1: 'tail', fanL2: 'tail', fanR1: 'tail', fanR2: 'tail' };

// The comb swells about a point this many times its own rise inside the head: grown by a fifth about it, it comes
// out by its rise and is a fifth larger.
const DEEP = 5, SWELL = 1 / DEEP;
const _p = new THREE.Vector3(), _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3(), _t = new THREE.Vector3(), _c = new THREE.Vector3();
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();

// The outward normal of the head and body's surface on the right side at (x mm, `a` of the way round), from its
// tangents along and round.
function normalAt(body, x, a, out) {
  body.surface(x + 0.4, a, _a); body.surface(x - 0.4, a, _b); _t.subVectors(_a, _b);
  body.surface(x, Math.min(1, a + 0.01), _a); body.surface(x, Math.max(0, a - 0.01), _b); _c.subVectors(_a, _b);
  out.crossVectors(_t, _c);
  if (out.lengthSq() < 1e-12) out.set(0, 0, 1);
  out.normalize();
  body.surface(x, a, _a); _b.set(x, body.mid(x), 0);
  if (out.dot(_a.sub(_b)) < 0) out.negate();
  return out;
}
// the way round the surface at (x, a), towards the back, as a unit vector
function roundAt(body, x, a, out) {
  body.surface(x, Math.min(1, a + 0.01), _a); body.surface(x, Math.max(0, a - 0.01), _b);
  return out.subVectors(_a, _b).normalize();
}
// how many of the way round from belly to back a millimetre round the body is at x (half the girth there is 1)
const shareOfMm = (body, x) => { const deep = (body.top(x) - body.bottom(x)) / 2, wide = body.half(x); return 1 / (Math.PI * Math.sqrt((deep * deep + wide * wide) / 2)); };

// The comb and the ruff of a sheet that asks for them, into the bird's skin, at one detail level. Returns where their
// bones turn, as [x, y, z] in millimetres of the level pose, for the ones it has built: life/bird.js puts every other
// display bone at its parent's joint.
export function buildDisplay(c) {
  const turns = {};
  if (c.shape.comb) Object.assign(turns, comb(c));
  if (c.shape.ruff) Object.assign(turns, ruff(c));
  return turns;
}

// the skin cell's paint at (x, a) on one side, as texture coordinates (as life/bird.js lays the skin's)
const paintAt = (c, x, a, side) => c.inCell(c.CELLS.skin, 1 - (x - c.body.rear) / (c.body.front - c.body.rear), c.SKIN_EDGE + (side > 0 ? 1 - a / 2 : a / 2) * (1 - 2 * c.SKIN_EDGE));

// ---- the comb: a ridge over the eye, most of it under the skin until the bird displays
export const combLayout = (shape) => {
  const C = shape.comb, eye = shape.eye, half = C.long / 2, mid = eye.x + (C.ahead ?? -0.08) * C.long, wide = C.wide ?? C.long * 0.32;
  // its lower edge rides the eye's upper rim: highest over the eye's middle, down beside it at its ends
  const low = (x) => { const k = Math.max(0, 1 - ((x - eye.x) / Math.max(half, 1e-3)) ** 2); return eye.y + eye.r * (0.55 + 0.6 * Math.sqrt(k)); };
  // and it is widest in its middle
  const across = (u) => wide * (0.45 + 0.55 * Math.sin(Math.PI * u));
  return { from: mid - half, long: C.long, low, across, high: C.high, sink: C.high * (1 - (C.rest ?? 0.3)) };
};
function comb(c) {
  const { skin, body, shape, level, put, B } = c, L = combLayout(shape), res = [[12, 5], [5, 2], null][level];
  const rise = (u, v) => L.high * Math.pow(Math.sin(Math.PI * u), 0.55) * Math.pow(Math.sin(Math.PI * v), 0.7);
  if (res) {
    const [nu, nv] = res;
    for (const side of [1, -1]) {
      skin.sheet(nu, nv, (i, j, out) => {
        const u = i / nu, v = j / nv, x = L.from + L.long * u, a = body.around(x, L.low(x) + L.across(u) * v);
        body.surface(x, a, _p); normalAt(body, x, a, _n);
        _p.addScaledVector(_n, rise(u, v) - L.sink);
        put(out, _p.x, _p.y, _p.z * side);
        [out.u, out.v] = paintAt(c, x, a, side);
        out.b0 = side > 0 ? B.combR : B.combL;
      }, { flip: side < 0 });
    }
  }
  // it swells about a point under its middle, DEEP times its rise inside the head
  const x = L.from + L.long / 2, a = body.around(x, L.low(x) + L.across(0.5) * 0.5);
  body.surface(x, a, _p); normalAt(body, x, a, _n); _p.addScaledVector(_n, -DEEP * L.sink);
  return { combR: [_p.x, _p.y, _p.z], combL: [_p.x, _p.y, -_p.z] };
}

// ---- the ruff: on each side of the neck, broad blades of feathers lying back along it, raised in display
export const ruffLayout = (shape, level = 0) => {
  const R = shape.ruff, [a0, a1] = R.around ?? [0.34, 0.72];
  return { at: R.at ?? shape.neck[0] + 0.25 * (shape.neck[1] - shape.neck[0]), a0, a1, long: R.long, wide: R.wide ?? R.long * 0.45, fan: R.fan ?? 0.5,
    // (the furthest level has none: the paint under them is the ruff, seen from there)
    blades: [7, 3, 0][level] };
};
function ruff(c) {
  const { skin, body, shape, level, put, B } = c, L = ruffLayout(shape, level), [sides, rows] = [[6, 4], [4, 2], [0, 0]][level];
  const mid = (L.a0 + L.a1) / 2, wide = L.wide * (level === 1 ? 1.8 : 1);
  for (let k = 0; k < L.blades; k += 1) {
    const ak = L.a0 + (L.a1 - L.a0) * (k + 0.5) / L.blades, fan = (ak - mid) * L.fan;
    for (const side of [1, -1]) {
      skin.sheet(sides, rows, (i, j, out) => {
        const t = j / rows, th = (i / sides) * Math.PI * 2, x = L.at - L.long * 0.92 * t, a = Math.min(0.98, Math.max(0.02, ak + fan * t));
        body.surface(x, a, _p); normalAt(body, x, a, _n); roundAt(body, x, a, _t);
        // broad and flat: narrow at its root, widest towards its square end, which is drawn in to an edge
        const end = j === rows, w = wide * (0.42 + 0.58 * Math.sqrt(t)) * (end ? 0.9 : 1), thick = end ? 0.05 : 1.3 + 1.1 * (1 - t), lift = 0.9 + 4.2 * t;
        _p.addScaledVector(_n, lift + Math.sin(th) * thick * 0.5).addScaledVector(_t, Math.cos(th) * w * 0.5);
        put(out, _p.x, _p.y, _p.z * side);
        // its paint: the skin's where it lies, across the blade as round the neck
        [out.u, out.v] = paintAt(c, x, Math.min(1, Math.max(0, a + Math.cos(th) * w * 0.5 * shareOfMm(body, x))), side);
        out.b0 = side > 0 ? B.ruffR : B.ruffL;
      }, { wrap: true, flip: side > 0 });
    }
  }
  // raised about its roots' middle, a little inside the neck
  const a = mid;
  body.surface(L.at, a, _p); normalAt(body, L.at, a, _n); _p.addScaledVector(_n, -2);
  return { ruffR: [_p.x, _p.y, _p.z], ruffL: [_p.x, _p.y, -_p.z] };
}

// ---- the tail: a feather `c` of the way out from the middle (-1 the left's outermost .. 1 the right's) turns by `c`
// of the fan, between the two bones whose turns are either side of its own (the tail's own at none, fan bones at a
// third and two thirds, and the tail's outer bone at the whole)
export function fanBind(c, out, B) {
  const k = Math.min(3, Math.abs(c) * 3), side = c >= 0 ? 'R' : 'L', bones = [B.tail, B[`fan${side}1`], B[`fan${side}2`], B[`tail${side}`]], i = Math.min(2, Math.floor(k));
  out.b0 = bones[i]; out.b1 = bones[i + 1]; out.w1 = k - i;
}

// ---- the pose: life/rig.js calls this at the end of its own, for every bird; it moves only the bones of the parts a
// sheet has. Every bone it moves it sets in every pose (one skeleton poses every animal of a kind in turn).
export function displayPose(kind, by, P) {
  const shape = kind.sheet.shape, show = Math.min(1, Math.max(0, P.display ?? 0));
  if (shape.comb) { const s = 1 + SWELL * show; by.combL.scale.setScalar(s); by.combR.scale.setScalar(s); }
  if (shape.ruff) {
    const R = shape.ruff, out = (R.raise ?? 1.35) * show, up = (R.tilt ?? 0.3) * show;
    // (out from the neck first, then up: turned the other way round, a blade that lies back along the body's axis is not tilted at all)
    by.ruffR.quaternion.setFromAxisAngle(AX, -up).multiply(_q.setFromAxisAngle(AY, out));
    by.ruffL.quaternion.setFromAxisAngle(AX, up).multiply(_q.setFromAxisAngle(AY, -out));
  }
  if (shape.tail.fan) {
    const fan = (P.tail && P.tail.fan) ?? 0;
    by.fanR1.quaternion.setFromAxisAngle(AY, fan / 3); by.fanR2.quaternion.setFromAxisAngle(AY, (fan * 2) / 3);
    by.fanL1.quaternion.setFromAxisAngle(AY, -fan / 3); by.fanL2.quaternion.setFromAxisAngle(AY, (-fan * 2) / 3);
  }
}
