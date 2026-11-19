import * as THREE from 'three';
import { BEAST_BONES } from './beast.js';
import { stridesOf } from './beasts.js';

// A beast drawn as a plate (life/plate.js), posed: one skeleton, which life/flock.js poses for every animal of the
// kind in turn, so a pose sets every bone afresh and nothing is carried from the animal before. The bind pose is the
// animal standing square, and every bone's own turn is nothing in it.
//
// THE POSE. Every field has a default, so a pose names only what it changes; life/bodies.js `rest` is the neutral
// pose a family's activity is laid over. An amount is 0..1 unless said; the page eases every number towards what a
// family asks (life/index.js), but takes `cycle` as it is. A phase other than `cycle` is a count that only grows
// (`beat`, `rake`, `roll`), so that easing never runs it backwards.
//
//   WHO IT IS (set by its family once, kept for the visit)
//   scale     its size against the sheet's                      antler   0 none (a cow) .. 1 a prime bull's
//   bull      0..1 a bull's build: the neck deep and maned, the head a little bigger (if not given: `antler`)
//   young     0..1 a young one's build: long legs, a big head on a short neck (if not given: from `scale`, none at
//             0.82 of the sheet's size and all of it at half)
//
//   HOW IT GOES (the stride is a contract: a family runs `cycle` on by the ground covered over the stride of the gait,
//   life/beasts.js `stridesOf(sheet)` and `strideFor`, at the animal's `scale`; the feet are swept by the same strides)
//   walk, trot, gallop   how much of each gait. A hoofed animal's are a walk, a trot and a gallop; a bear's a rolling
//             walk, a trot and a rotary gallop; a long low animal's (shape.gait 'bound') a walk and, for both the
//             others, the bound of a weasel, the back arching and stretching
//   cycle     where in its stride it is (any number; its fraction is used)
//   high      the forelegs lifted high at a walk: the stiff walk of an alarmed cow
//   ground    [left fore, right fore, left hind, right hind]: the ground under each foot above the plane the animal
//             stands on (m)
//
//   HOW IT HOLDS ITSELF (each 0..1; they may be mixed, and each is let in and out by its family at the animal's own
//   speed. Where the family puts the animal's frame is said for each: `at` is the origin, +x the way it faces, +y up
//   from what it is on)
//   lie       lying down on its brisket, the legs folded under: the front goes down first, the hind end gets up first
//   sit       sitting on its haunches, the forefeet on the ground between the hind (a bear, an otter)
//   rear      up on its hind legs, the body near upright over the hind feet (a bear standing to look; an elk rearing;
//             an otter standing up to look about). `arms` -1 the forelegs hanging at the chest .. 0 as they hang by
//             default .. 1 reaching up over the head (a bear at a branch, or its paws on a trunk). `box` 0..1 the
//             forefeet striking out by turns, by `beat` (an elk rearing to box). `rub` 0..1 the back worked up and
//             down against a trunk behind it, by `beat` (a bear: the family stands it with its back to the trunk)
//   crouch    the body let down on bent legs
//   spar      head low, the neck braced and the antlers forward, the feet set wide (an elk; two of them face one
//             another, their heads a head's length apart). `push` -1 giving ground .. 1 driving: the body goes
//             back or forward over planted feet
//   cling     on a trunk, climbing: the frame is on the bark, +x up the trunk and +y out of it; the body is close to
//             the bark and the limbs hug it. `grip` the trunk's radius (m; 0 for one too big to matter). It climbs by
//             `walk` and `cycle`, a quarter of a walking stride to the cycle
//   swim      swimming at the surface: the frame is level, its origin `sheet.body.high` less a few centimetres under
//             the water's top, so the head and the line of the back are out. The legs paddle by `cycle`
//   dive      the back arched over and the head down, the tail following: the family tips the frame over and takes
//             it under
//   porpoise  0..1 leaping through the surface as it swims: the body arcs out and in again once a `cycle`
//   slide     on its belly, the forelegs laid back along its sides: the frame is on what it slides over
//   roll      radians, any number: turned about its own length (+ onto its right side); past a quarter turn it is on
//             its back, its legs loose in the air. On the ground, with `lie` 1
//   arch      -1 the back hollowed .. 1 humped, besides what a gait does
//   turn      -1..1 the body curved to its left or its right (to look back along itself, to groom)
//
//   WHAT IT DOES WITH A LIMB
//   stamp     the right forefoot raised to stamp
//   dig       working at something with a forefoot: pawing the ground (an elk), raking at a log or turning a stone
//             (a bear), scraping (an otter). `rake` how far through its strokes it is (one stroke a unit, the feet
//             by turns, the right first), `reach` how far ahead of the shoulder it works (m), `at` how high above
//             the ground what it works at is (m)
//   hold      the forepaws brought to the mouth, holding what it eats
//   scratch   -1..1 a hind foot brought up to scratch behind the ear, the left (-) or the right (+), by `beat`
//   shake     shaking itself, by `beat`
//   beat      the count the last four go by (any number that grows: about one a second is a calm pace)
//
//   THE HEAD AND THE REST
//   neck      0 the muzzle on the ground .. 0.6 as it stands .. 1 the head held high
//   head      { yaw (+ to its right), pitch (+ up), tilt (+ its right ear down) }, radians
//   jaw       0 shut .. 1 open as far as it chews or pants         ears   -1 laid back .. 0 out to the sides .. 1 pricked
//   tail      0 down .. 1 raised                                   wag    -1..1 the tail to its left or its right
//
// What the sheet gives the rig (shape; each optional but `neck` and `lie`):
//   gait      'hoof' | 'paw' | 'bound' (if not given: 'hoof' for a hoofed animal, 'paw' for one with paws)
//   neck      { low, high: the neck's four joints (neck1, neck2, neck3, the poll) turned from as it stands, radians,
//             with the muzzle on the ground and with the head high; dip: how far the chest is let down to graze }
//   lie       { drop: how far the body comes down (m); fore, hind: { top: [x, y] where the knee or the hock goes (x
//             from the leg's top joint), fetlock: [x, y], out: how far out to the side (a share of where it stands),
//             hoof: how the foot is bent from the bone above it } }
//   sit, rear, spar, swim, young, bull: each a table of that pose's own numbers (below, with what an animal has
//             without one)

const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const TINY = 0.001, TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const c01 = (v) => Math.min(1, Math.max(0, v ?? 0));
const ease = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const frac = (x) => x - Math.floor(x);
const smooth = (a, b, x) => ease(clamp((x - a) / (b - a), 0, 1));
const _x = new THREE.Vector3(), _z = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _v = new THREE.Vector3();

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

// The gaits. [left fore, right fore, left hind, right hind]: where in the cycle each foot is at cycle 0 (0 is when it
// is put down); how much of the cycle a fore and a hind foot are on the ground; how far ahead of where it stands a
// foot's stance is set (`reach`, a share of the stride: a bounding weasel's hind feet land where its forefeet were);
// how high a foot is lifted in its swing (fore, hind: shares of the leg's height), how much the knee or the hock
// rises with it, and how far the foot folds back (radians); how far the heel is lifted at the end of a stance
// (`over`, the breakover, radians); how the body bobs (a share of the leg's height) and pitches; how far the back
// gathers and stretches (`flex`, radians, + humped) and when (`flexAt`, a share of the cycle).
// No source read gave any of these animals' footfalls: the sequences are the textbook ones (a lateral-sequence walk,
// a diagonal trot, a transverse or a rotary gallop, a half bound), and every number is the agent's own.
const GAITS = {
  hoof: {
    walk:   { phase: [0.75, 0.25, 0.0, 0.5], duty: [0.62, 0.62], over: 0.55, lift: [0.12, 0.09], rise: [0.04, 0.027], fold: [0.7, 0.55], bob: 0.012, pitch: 0.012 },
    trot:   { phase: [0.0, 0.5, 0.5, 0.0], duty: [0.40, 0.40], over: 0.7, lift: [0.22, 0.17], rise: [0.07, 0.045], fold: [1.2, 0.95], bob: 0.03, pitch: 0.018 },
    gallop: { phase: [0.62, 0.52, 0.0, 0.9], duty: [0.30, 0.30], over: 0.8, lift: [0.30, 0.23], rise: [0.09, 0.062], fold: [1.5, 1.25], bob: 0.06, pitch: 0.08, flex: 0.1, flexAt: 0.35 },
  },
  paw: {
    walk:   { phase: [0.75, 0.25, 0.0, 0.5], duty: [0.66, 0.66], over: 0.5, lift: [0.13, 0.10], rise: [0.03, 0.02], fold: [0.75, 0.5], bob: 0.015, pitch: 0.014, sway: 0.035 },
    trot:   { phase: [0.0, 0.5, 0.5, 0.0], duty: [0.45, 0.45], over: 0.6, lift: [0.2, 0.16], rise: [0.05, 0.03], fold: [1.0, 0.7], bob: 0.03, pitch: 0.02 },
    gallop: { phase: [0.58, 0.46, 0.0, 0.12], duty: [0.30, 0.32], over: 0.7, lift: [0.3, 0.26], rise: [0.07, 0.05], fold: [1.3, 1.0], bob: 0.07, pitch: 0.1, flex: 0.24, flexAt: 0.3, reach: [0.0, 0.08] },
  },
  bound: {
    walk:   { phase: [0.75, 0.25, 0.0, 0.5], duty: [0.64, 0.64], over: 0.6, lift: [0.22, 0.22], rise: [0, 0], fold: [1.1, 0.8], bob: 0.02, pitch: 0.0 },
    trot:   { phase: [0.0, 0.95, 0.67, 0.62], duty: [0.3, 0.28], over: 0.6, lift: [0.42, 0.42], rise: [0, 0], fold: [1.1, 0.8], bob: 0.12, pitch: 0.07, flex: 0.42, flexAt: 0.3, reach: [0.05, 0.12] },
    gallop: { phase: [0.0, 0.95, 0.67, 0.62], duty: [0.3, 0.28], over: 0.6, lift: [0.42, 0.42], rise: [0, 0], fold: [1.1, 0.8], bob: 0.12, pitch: 0.07, flex: 0.42, flexAt: 0.3, reach: [0.05, 0.12] },
  },
};
// (r2-small, 2026-11-19: the scamper of a squirrel or a chipmunk, which its family asks for as `scurry` and the rig runs
// as this table's gallop: the hind feet together, landing ahead of where the forefeet were, as life/parts/rodentRig.js
// had it. Only a sheet with shape.climb runs it.)
GAITS.scamper = {
  walk:   GAITS.bound.walk,
  trot:   { phase: [0.48, 0.55, 0.0, 0.04], duty: [0.3, 0.36], over: 0.5, lift: [0.32, 0.26], rise: [0, 0], fold: [1.0, 0.8], bob: 0.1, pitch: 0.06, flex: 0.35, flexAt: 0.25, reach: [0.0, 0.13] },
  gallop: { phase: [0.48, 0.55, 0.0, 0.04], duty: [0.3, 0.36], over: 0.5, lift: [0.32, 0.26], rise: [0, 0], fold: [1.0, 0.8], bob: 0.1, pitch: 0.06, flex: 0.35, flexAt: 0.25, reach: [0.0, 0.13] },
};
const NAMES = ['walk', 'trot', 'gallop'];
const ORDER = ['LF', 'RF', 'LH', 'RH'];
const TRUNK = ['hips', 'loin', 'back', 'chest'], NECK = ['neck1', 'neck2', 'neck3', 'head'], TAIL = ['tail', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6'];

export function createPlateBeast(kind, material = null) {
  const sheet = kind.sheet, shape = sheet.shape, built = kind.levels[0], pivots = built.pivots, PARENT = kind.parent, LEGS = kind.legsOf;
  const bones = BEAST_BONES.map((name) => { const bone = new THREE.Bone(); bone.name = name; return bone; });
  const by = Object.fromEntries(BEAST_BONES.map((name, i) => [name, bones[i]]));
  const rest = {};
  for (const name of BEAST_BONES) {
    const parent = PARENT[name];
    rest[name] = parent ? pivots[name].clone().sub(pivots[parent]) : new THREE.Vector3();
    if (parent) { by[parent].add(by[name]); by[name].position.copy(rest[name]); }
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
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  });
  let shown = 0;

  const STRIDES = stridesOf(sheet);
  // ---- r2-small (2026-11-19, the small mammals' agent): what the squirrel's and the chipmunks' family
  // (life/families/scurrier.js) and the weasels' (life/families/mustelid.js) ask of the skunk and the fisher, which the
  // plate's own fields do not say. Each is only for a sheet that asks, so the elk, the bear and the otter are posed as
  // they were:
  //   shape.climb (the scurrier's sheets)  `scurry` 0..1 a scamper at that share of a run, by `cycle`, which the family
  //       advances by the ground covered over climb.stride * (0.3 + 0.7 * scurry) * max(0.2, scurry): the feet are swept
  //       by the same, on the ground or on the bark (where the plate's own climb takes a quarter of a walk's stride);
  //       `sit` up on its haunches with the forepaws drawn to the chest (to the mouth by `hold`); `down` head down on a
  //       trunk, the hind feet turned back to hook the bark; `strip`, `husk`: the cone in its paws stripped, its scales
  //       falling (shape.cone); `curl`, `flick`
  //   shape.brush (a bushy tail, life/plate.js)  the tail's six bones: `tail` 0 trailing .. 1 raised (by brush.carry.up
  //       at its root), `curl` its end over the back, `flick` a jerk up from the root, `wag`, streaming in a bound
  //   shape.stamp 'both'   `stamp` raises both forefeet (the skunk's warning), not the right alone
  //   shape.digBy 'cycle'  `dig` strokes by `cycle` where no `rake` is given (the weasels' family runs `cycle`)
  const RODENT = shape.climb ? { stride: shape.climb.stride, coneLong: shape.cone ? shape.cone.long / 1000 : 0, coneWide: shape.cone ? shape.cone.wide / 1000 : 0 } : null;
  const BRUSH = shape.brush ? { droop: 0.2, up: 1.35, curl: 1.6, run: 0, sit: 0.2, ...(shape.brush.carry || {}) } : null;
  const STAMP_BOTH = shape.stamp === 'both', DIG_CYCLE = shape.digBy === 'cycle';
  const BEND = [0, 0.22, 0.3, 0.36, 0.36, 0.3];
  const _cone = new THREE.Vector3(), _axis = new THREE.Vector3(0.4, 1, 0.3).normalize();
  let rodentStride = 0;
  // (a rodent's own copy of the scamper: how long a foot is down is set each pose so that its sweep fits its leg)
  const SCAMPER = RODENT ? { walk: GAITS.scamper.walk, trot: { ...GAITS.scamper.trot, duty: [...GAITS.scamper.trot.duty], reach: [...GAITS.scamper.trot.reach] }, gallop: { ...GAITS.scamper.gallop, duty: [...GAITS.scamper.gallop.duty], reach: [...GAITS.scamper.gallop.reach] } } : null;
  const pawed = !!shape.paw, gaits = RODENT ? SCAMPER : GAITS[shape.gait || (pawed ? 'paw' : 'hoof')];
  // each leg as it stands: its joints, the way each of its bones runs, and where its foot's joint is
  const legs = ORDER.map((key) => {
    const leg = LEGS[key], lay = built.legs[key], Jb = lay.joints;
    const dirs = [0, 1, 2].map((k) => Jb[k + 1].clone().sub(Jb[k]).normalize());
    const beta = Math.atan2(Jb[2].x - Jb[3].x, Jb[2].y - Jb[3].y);              // the bone over the foot, from the foot up: + its top ahead
    return { key, ...leg, i: ORDER.indexOf(key), dirs, beta, lengths: lay.lengths, J0: Jb[0].clone(), F0: Jb[3].clone(), C0: Jb[2].clone(), toe: [lay.toe - Jb[3].x, -Jb[3].y],
      high: Jb[0].y, short: !!shape.paw || lay.lengths[2] < 0.3 * lay.lengths[1], hang: leg.fore ? leg.scap : 'hips',
      E: new THREE.Vector3(), C: new THREE.Vector3(), F: new THREE.Vector3(), Fp: new THREE.Vector3(), J: new THREE.Vector3(), rise: 0, swing: 0, fold: 0, over: 0, beta1: 0, follow: 0, bend: 0, out: 0 };
  });
  const foreLeg = legs[1], hindLeg = legs[3];
  const span = pivots.neck1.x - pivots.hips.x, legHigh = (foreLeg.high + hindLeg.high) / 2;
  const belly = Math.min(...shape.plate.side.bottom.filter((p) => p[1] > pivots.hips.x && p[1] < pivots.neck1.x).map((p) => p[2]));      // how high the belly's lowest point is
  const halfWide = Math.max(...shape.plate.above.map((p) => p[1]));
  const N = shape.neck, LIE = shape.lie;
  const SIT = { high: 0.3 * hindLeg.high, pitch: 0.95, arch: 0.35, back: 0.25, fore: 0.1, ...(shape.sit || {}) };
  const REAR = { pitch: pawed ? 1.25 : 0.95, lift: 0.25, back: 0.18, arm: pawed ? [0.25, 1.0, 0.35] : [0.9, -0.5, -1.7], paw: -1.25, up: [2.5, 2.8, 2.6], ...(shape.rear || {}) };
  const SPAR = { neck: 0.2, head: -0.75, drop: 0.07, wide: 1.35, fore: 0.1, hind: -0.12, push: 0.14, ...(shape.spar || {}) };
  const YOUNG = { legs: 0.2, head: 0.14, neck: -0.08, ...(shape.young || {}) }, BULL = { mane: [1.12, 1.34, 1.3], head: 0.05, ...(shape.bull || {}) };
  const SWIM = { fore: shape.gait === 'bound' ? 'tuck' : 'paddle', ...(shape.swim || {}) };
  const tailUp = (shape.tailUp ?? 50) * Math.PI / 180, archMost = shape.arch ?? 0.5;
  const drawnTail = built.drawnTail;
  // the head's own line, from the poll to the nose, in the head's frame as it stands (what it tilts about); the mouth
  const noseBind = new THREE.Vector3().fromBufferAttribute(built.geometry.getAttribute('position'), built.marks.nose[0]);
  const faceLine = noseBind.clone().sub(pivots.head).normalize();
  const mouthRest = noseBind.clone().addScaledVector(faceLine, -0.08 * noseBind.distanceTo(pivots.head)).sub(pivots.head); mouthRest.y -= 0.12 * noseBind.distanceTo(pivots.head);
  const earRest = pivots.earR.clone().sub(pivots.head);

  // the body's frame as it is posed (in the group's frame): each bone of the back and the neck, where it is and how it is turned
  const M = {};
  for (const name of [...TRUNK, ...NECK]) M[name] = { p: new THREE.Vector3(), q: new THREE.Quaternion() };
  const place = (name, parent) => { M[name].p.copy(rest[name]).applyQuaternion(M[parent].q).add(M[parent].p); M[name].q.copy(M[parent].q).multiply(by[name].quaternion); };
  const qScap = new THREE.Quaternion(), qParent = new THREE.Quaternion(), qBone = new THREE.Quaternion(), qFold = new THREE.Quaternion(), qBody = new THREE.Quaternion();
  const tmp = new THREE.Vector3(), dir = new THREE.Vector3(), pole = new THREE.Vector3(), T = new THREE.Vector3(), reachC = new THREE.Vector3(), reachF = new THREE.Vector3(), mouth = new THREE.Vector3(), ear = new THREE.Vector3();
  const share = { walk: 0, trot: 0, gallop: 0 };

  function pose(P = {}) {
    // ---- afresh: nothing of the animal posed before
    for (const name of BEAST_BONES) { const bone = by[name]; bone.position.copy(rest[name]); bone.quaternion.identity(); bone.scale.set(1, 1, 1); }
    const size = P.scale ?? 1;
    group.scale.setScalar(size);
    const antler = c01(P.antler), bull = c01(P.bull ?? antler), young = c01(P.young ?? smooth(0.82, 0.5, size));
    const ls = 1 + YOUNG.legs * young, hs = 1 + YOUNG.head * young + BULL.head * bull;      // the legs' and the head's size against the body's
    const head = P.head || {}, ground = P.ground || [0, 0, 0, 0], cycle = P.cycle ?? 0, beat = P.beat ?? 0;
    const lie = c01(P.lie), dropF = ease(c01(lie / 0.6)), dropH = ease(c01((lie - 0.4) / 0.6));
    const sit = ease(c01(P.sit)) * (1 - lie), rear = ease(c01(P.rear)) * (1 - lie) * (1 - sit), crouch = c01(P.crouch), spar = ease(c01(P.spar)) * (1 - lie);
    const swim = c01(P.swim), dive = c01(P.dive), slide = c01(P.slide), cling = c01(P.cling), porpoise = c01(P.porpoise), hold = Math.max(c01(P.hold), RODENT ? 0.62 * sit : 0);      // (r2-small: a rodent sat up draws its forepaws to its chest)
    const roll = P.roll ?? 0, loose = smooth(0.35, 1.2, Math.abs(Math.atan2(Math.sin(roll), Math.cos(roll))));      // on its side or its back: the legs loose
    const afloat = Math.max(swim, dive), offFeet = Math.max(afloat, slide, loose), onFeet = (1 - lie) * (1 - offFeet);
    const stepping = onFeet * (1 - sit);
    share.walk = c01(P.walk); share.trot = c01(P.trot); share.gallop = c01(P.gallop);
    // (r2-small: a scamper is this gait's gallop, all of it from a tenth of a run, at the stride its family runs `cycle` by)
    rodentStride = 0;
    if (RODENT) {
      const run = c01(P.scurry);
      if (run > 0) {
        const k = c01(run / 0.1), D = RODENT.stride * (0.3 + 0.7 * run) * Math.max(0.2, run), g = SCAMPER.gallop;
        share.walk = 0; share.trot = 0; share.gallop = k; rodentStride = D / k;
        // (a foot is down for as much of the bound as its leg can sweep: at a run the bound is long and the feet quick)
        g.duty[0] = clamp((1.1 * foreLeg.high) / D, 0.1, 0.3); g.duty[1] = clamp((1.0 * hindLeg.high) / D, 0.1, 0.36); g.reach[1] = 0.35 * g.duty[1];
      }
    }
    const n = clamp(lerp(P.neck ?? 0.6, SPAR.neck, spar), 0, 1.15), graze = (1 - clamp(n / 0.6, 0, 1)) * (1 - spar);

    // ---- each foot's place in its gait: on the ground it goes back under the body, in the air forward and up
    let bob = 0, pitch = 0, flex = 0, sway = 0;
    for (const leg of legs) {
      const i = leg.i, f = leg.fore ? 0 : 1, k0 = stepping * (leg.fore ? 1 - rear : 1);
      // (where it stands, at this animal's build: a young one's long legs set its feet a little further from its middle)
      leg.Fp.set(leg.J0.x + (leg.F0.x - leg.J0.x) * ls, leg.F0.y * ls, leg.F0.z);
      leg.swing = 0; leg.fold = 0; leg.rise = 0; leg.over = 0; leg.follow = 0; leg.bend = 0; leg.out = 0;
      for (const name of NAMES) {
        const k = share[name] * k0;
        if (k <= 0) continue;
        const g = gaits[name], stride = rodentStride > 0 && name === 'gallop' ? rodentStride : STRIDES[name] * (cling > 0 ? lerp(1, 0.25, cling) : 1), p = frac(cycle + g.phase[i]), duty = g.duty[f], sweep = stride * duty, ahead = (g.reach ? g.reach[f] : 0) * stride;
        if (p < duty) { leg.Fp.x += k * (ahead + sweep * (0.5 - p / duty)); leg.over += k * g.over * ease(clamp((p / duty - 0.68) / 0.32, 0, 1)); continue; }
        const q = (p - duty) / (1 - duty), arc = Math.sin(Math.PI * q);
        const high = leg.fore && name === 'walk' ? 1 + 1.4 * (P.high ?? 0) : 1;
        leg.Fp.x += k * (ahead + sweep * (q - 0.5));
        leg.Fp.y += k * g.lift[f] * leg.high * ls * high * arc ** 0.8;
        leg.rise += k * g.rise[f] * leg.high * ls * high * arc;
        leg.fold += k * g.fold[f] * arc;
        leg.swing = Math.max(leg.swing, k * arc);
      }
      if ((leg.key === 'RF' || (STAMP_BOTH && leg.key === 'LF')) && P.stamp) { const s = P.stamp * k0; leg.Fp.y += 0.14 * leg.high * s; leg.Fp.x += 0.03 * leg.high * s; leg.rise += 0.1 * leg.high * s; leg.fold += 0.5 * s; leg.swing = Math.max(leg.swing, s); }
      leg.Fp.y += ground[i] * (1 - (leg.fore ? dropF : dropH)) * (1 - offFeet);
      // sparring: the feet set wide, the forefeet ahead and the hind feet behind
      if (spar > 0) { leg.Fp.x += spar * (leg.fore ? SPAR.fore : SPAR.hind) * legHigh; leg.Fp.z *= lerp(1, SPAR.wide, spar); }
      // on a trunk: the feet out to its sides and round it, the forefeet up it and the hind feet under the hips
      if (cling > 0) {
        const R = P.grip ?? 0, wide = (leg.fore ? 1.9 : 1.7) * Math.abs(leg.F0.z) + 0.18 * leg.high, z = R > 0 ? Math.min(wide, R * 0.96) : wide;
        leg.Fp.z = lerp(leg.Fp.z, leg.side * z, cling);
        leg.Fp.x += cling * (leg.fore ? 0.42 : -0.05) * leg.high;
        if (R > 0) leg.Fp.y += cling * (Math.sqrt(Math.max(0, R * R - z * z)) - R);
      }
    }
    for (const name of NAMES) {
      const k = share[name] * stepping * (1 - rear), g = gaits[name], c = TAU * cycle;
      if (k <= 0) continue;
      bob += k * legHigh * (name === 'walk' ? -g.bob * 0.5 * (1 - Math.cos(2 * c)) : g.bob * Math.sin(c + 1.2));
      pitch += k * g.pitch * Math.sin(c + (name === 'walk' ? 0 : 0.4));
      if (g.flex) flex += k * g.flex * (0.35 + 0.65 * Math.cos(c - TAU * g.flexAt));
      if (g.sway) sway += k * g.sway * Math.sin(c);
    }

    // ---- the body: how high its two ends are and how it is pitched; then what each way of holding itself asks
    const groundF = (ground[0] + ground[1]) / 2, groundH = (ground[2] + ground[3]) / 2;
    const drop = LIE.drop + (ls - 1) * hindLeg.high;
    let back = bob - drop * dropH + groundH * (1 - dropH) * (1 - offFeet) + (ls - 1) * hindLeg.high;
    let front = bob - (LIE.drop + (ls - 1) * foreLeg.high) * dropF + groundF * (1 - dropF) * (1 - offFeet) + (ls - 1) * foreLeg.high;
    // (grazing, the chest is let down a little: the sheet's `dip` is the turn it makes about the hips)
    let hx = 0, arch = clamp(P.arch ?? 0, -1, 1) * archMost + flex, turn = clamp(P.turn ?? 0, -1, 1) * 0.5, twist = 0;
    const down = crouch * 0.22 * legHigh * onFeet;
    back -= down; front -= down;
    if (spar > 0) { back -= spar * SPAR.drop * legHigh * 0.6; front -= spar * SPAR.drop * legHigh; hx += spar * clamp(P.push ?? 0, -1, 1) * SPAR.push * legHigh; }
    if (cling > 0) { const d = cling * (belly - 0.1 * legHigh); back -= d; front -= d; }
    if (slide > 0) { back = lerp(back, 0.01 - belly, slide); front = lerp(front, 0.01 - belly, slide); }
    // (on its side or its back, on the ground: its middle as high as it is wide)
    if (loose > 0) { const d = pivots.hips.y - halfWide * 0.95; back = lerp(back, -d, loose * (1 - afloat)); front = lerp(front, -d, loose * (1 - afloat)); }
    let tilt = Math.atan2(front - back, span) + pitch * (1 - offFeet);
    if (sit > 0) { back = lerp(back, SIT.high - pivots.hips.y, sit); tilt = lerp(tilt, SIT.pitch, sit); arch += sit * SIT.arch; hx -= sit * SIT.back * hindLeg.high; }
    let rub = 0;
    if (rear > 0) {
      tilt += REAR.pitch * rear; back += REAR.lift * hindLeg.lengths[0] * rear; hx -= REAR.back * hindLeg.lengths[0] * rear;
      if (P.rub) { rub = c01(P.rub) * rear * Math.sin(TAU * beat); back += rub * 0.07 * legHigh; tilt += rub * 0.04; }
    }
    if (porpoise > 0) { const c = TAU * cycle; back += porpoise * 0.55 * legHigh * Math.max(0, Math.sin(c)) + porpoise * 0.2 * legHigh * Math.sin(c); tilt += porpoise * 0.55 * Math.cos(c); arch += porpoise * 0.45 * (0.3 + Math.sin(c)); }
    if (dive > 0) arch += dive * 1.05;
    if (P.shake) twist = c01(P.shake) * 0.22 * Math.sin(TAU * beat * 5);
    if (P.scratch) turn += clamp(P.scratch, -1, 1) * 0.42;

    by.hips.position.set(pivots.hips.x + hx, pivots.hips.y + back, sway * legHigh);
    by.hips.quaternion.setFromAxisAngle(AZ, tilt + arch / 2);
    if (roll || twist) by.hips.quaternion.premultiply(_q.setFromAxisAngle(AX, roll + twist));
    if (turn) by.hips.quaternion.multiply(_q.setFromAxisAngle(AY, turn * 0.5));
    M.hips.p.copy(by.hips.position); M.hips.q.copy(by.hips.quaternion);
    for (let k = 1; k < 4; k += 1) {
      const bone = by[TRUNK[k]];
      bone.quaternion.setFromAxisAngle(AZ, -arch / 3 + (k === 3 ? N.dip * graze * (1 - lie) : 0));
      if (turn) bone.quaternion.multiply(_q.setFromAxisAngle(AY, -turn / 3));
      if (twist) bone.quaternion.multiply(_q.setFromAxisAngle(AX, -twist * 0.6));
      place(TRUNK[k], TRUNK[k - 1]);
    }
    // (up on its hind legs: as far up as they can reach their feet)
    if (rear > 0) {
      let short = 0;
      for (const leg of legs) {
        if (leg.fore) continue;
        tmp.copy(rest[leg.chain[0]]).applyQuaternion(M.hips.q).add(M.hips.p);
        const l3 = leg.lengths[2] * ls;
        T.set(leg.Fp.x + Math.sin(leg.beta) * l3, leg.Fp.y + Math.cos(leg.beta) * l3, leg.Fp.z);
        short = Math.max(short, tmp.distanceTo(T) - 0.97 * (leg.lengths[0] + leg.lengths[1]) * ls);
      }
      if (short > 0) { by.hips.position.y -= short; M.hips.p.y -= short; for (let k = 1; k < 4; k += 1) place(TRUNK[k], TRUNK[k - 1]); }
    }

    // ---- the neck and the head: down to graze, up to watch, turned to whatever it watches. The body's pitch is taken
    // out of the neck, so that a head held still stays still as the body rocks, and is level when the body rears.
    const yaw = clamp((head.yaw ?? 0) + (P.scratch ? clamp(P.scratch, -1, 1) * 0.9 : 0), -1.7, 1.7), hp = (head.pitch ?? 0) + spar * SPAR.head - (P.scratch ? Math.abs(P.scratch) * 0.35 : 0) - dive * 0.5;
    const nod = (share.walk * 0.04 * Math.sin(2 * TAU * cycle) + share.trot * 0.02 * Math.sin(2 * TAU * cycle + 0.7) + share.gallop * 0.07 * Math.sin(TAU * cycle - 0.4)) * stepping;
    const at = (k) => (n < 0.6 ? N.low[k] * (1 - n / 0.6) : N.high[k] * ((n - 0.6) / 0.4));
    // (how far the chest is pitched from as it stands: all of it out of the neck up to a rear's worth, none of a dive's)
    const chestPitch = tilt + arch / 2 - arch + N.dip * graze * (1 - lie), level = -chestPitch * (1 - Math.max(dive, slide * 0.5, loose)) * (rear > 0 || sit > 0 ? 1 : 0.75);
    const turns = [0.3, 0.25, 0.2, 0.25], levels = [0.4, 0.25, 0.15, 0.2];
    const young1 = 1 + YOUNG.neck * young;
    NECK.forEach((name, k) => {
      let p = at(k) + level * levels[k];
      if (k === 0) p += nod;
      if (k === 3) p += hp - nod * 0.6;
      const bone = by[name];
      bone.quaternion.setFromAxisAngle(AY, -yaw * turns[k]).multiply(_q.setFromAxisAngle(AZ, p));
      if (k > 0) bone.position.multiplyScalar(young1);
      M[name].p.copy(bone.position).applyQuaternion(M[k === 0 ? 'chest' : NECK[k - 1]].q).add(M[k === 0 ? 'chest' : NECK[k - 1]].p);
      M[name].q.copy(M[k === 0 ? 'chest' : NECK[k - 1]].q).multiply(bone.quaternion);
    });
    const tiltHead = (head.tilt ?? 0) + (P.shake ? c01(P.shake) * 0.3 * Math.sin(TAU * beat * 5 - 1.2) : 0);
    if (tiltHead) { by.head.quaternion.multiply(_q.setFromAxisAngle(faceLine, tiltHead)); M.head.q.copy(M.neck3.q).multiply(by.head.quaternion); }
    by.head.scale.setScalar(hs);
    mouth.copy(mouthRest).multiplyScalar(hs).applyQuaternion(M.head.q).add(M.head.p);
    by.jaw.quaternion.setFromAxisAngle(AZ, -c01(P.jaw) * (shape.plate.jaw.open ?? 0.16));
    // the ears: laid back (-1), out to the sides (0), pricked forward (1); the antlers, and a bull's neck
    const ears = clamp(P.ears ?? 0.2, -1, 1);
    for (const [side, z] of [['L', -1], ['R', 1]]) {
      by[`ear${side}`].quaternion.setFromAxisAngle(AX, z * (ears > 0 ? -0.3 * ears : -0.45 * ears)).multiply(_q2.setFromAxisAngle(AZ, ears > 0 ? -0.3 * ears : -0.75 * ears));
      if (P.shake) by[`ear${side}`].quaternion.multiply(_q.setFromAxisAngle(AX, c01(P.shake) * 0.5 * Math.sin(TAU * beat * 5 - 2)));
      by[`antler${side}`].scale.setScalar(Math.max(TINY, antler));
    }
    by.mane.scale.set(lerp(1, BULL.mane[0], bull), lerp(1, BULL.mane[1], bull), lerp(1, BULL.mane[2], bull));

    // ---- the legs
    const digK = ease(c01(P.dig)) * onFeet * (1 - rear) * (1 - sit), rake = Math.max(0, P.rake ?? (DIG_CYCLE ? cycle : 0)), stroke = Math.floor(rake), digLeg = stroke % 2 === 0 ? 'RF' : 'LF';
    const scratch = clamp(P.scratch ?? 0, -1, 1) * onFeet * (1 - rear);
    for (const leg of legs) {
      const l1 = leg.lengths[0] * ls, l2 = leg.lengths[1] * ls, l3 = leg.lengths[2] * ls, drops = leg.fore ? dropF : dropH, side = leg.side, h = leg.high * ls;
      // the top joint, where the body has put it (a shoulder blade swings with its leg)
      const J = leg.J;
      if (leg.fore) {
        const scap = by[leg.scap], reach = leg.Fp.x - (leg.J0.x + (leg.F0.x - leg.J0.x) * ls);
        scap.quaternion.setFromAxisAngle(AZ, clamp((0.5 / Math.max(0.3, leg.high)) * reach, -0.3, 0.3) * (1 - drops) * (1 - rear) * (1 - offFeet));
        qScap.copy(M.chest.q).multiply(scap.quaternion);
        tmp.copy(rest[leg.scap]).applyQuaternion(M.chest.q).add(M.chest.p);
        J.copy(rest[leg.chain[0]]).applyQuaternion(qScap).add(tmp);
        qParent.copy(qScap); qBody.copy(M.chest.q);
      } else {
        J.copy(rest[leg.chain[0]]).applyQuaternion(M.hips.q).add(M.hips.p);
        qParent.copy(M.hips.q); qBody.copy(M.hips.q);
      }
      by[leg.chain[0]].scale.setScalar(ls);
      // the bone over the foot, from the foot up: as it stands on the ground it leans with the foot; in the air the
      // knee or the hock keeps its height while the foot is lifted, so that bone swings back under it (a short one, over
      // a paw, is swung by the swing itself)
      let beta = leg.beta;
      if (leg.short) beta += (leg.fore ? -0.5 : 0.6) * leg.swing;
      else {
        beta += 0.5 * ((leg.J0.x + (leg.F0.x - leg.J0.x) * ls) - leg.Fp.x) / Math.max(0.5, leg.high) * (1 - Math.sqrt(Math.min(1, leg.swing)));
        if (leg.swing > 0) { const c = clamp((leg.C0.y * ls + leg.rise - leg.Fp.y) / l3, -0.3, 1); beta += (Math.acos(c) - Math.abs(leg.beta)) * Math.sqrt(leg.swing); }
      }
      let fold = leg.fold, over = leg.over, footTurn = null, k;
      const F = leg.F.copy(leg.Fp);
      pole.set(leg.fore ? -1 : 1, 0, 0);

      // -- sitting: the hind feet stay where they stand, the knees out; the forefeet come back between them
      if (sit > 0) {
        if (leg.fore) { F.x = lerp(F.x, J.x + SIT.fore * h, sit); F.y = lerp(F.y, leg.F0.y * ls, sit); }
        else { pole.z += sit * side * 0.9; F.z = lerp(F.z, F.z * 1.25, sit); F.x += sit * 0.12 * h; }
      }
      // (r2-small: head down on a trunk, the hind feet reach on up it, to be turned back below)
      if (RODENT && !leg.fore && P.down) F.x += c01(P.down) * cling * l3 * 0.9;
      // -- up on the hind legs: the forelegs hang bent at the chest, or reach up, or strike out by turns
      if (rear > 0 && leg.fore) {
        const arms = clamp(P.arms ?? 0, -1, 1), box = c01(P.box), hit = box * Math.max(0, Math.sin(TAU * beat * 1.6 + (side < 0 ? 0 : Math.PI)));
        const a = REAR.arm, u = REAR.up, up = Math.max(0, arms) + hit * 0.45;
        const a1 = lerp(a[0], u[0], up), a2 = lerp(a[1], u[1], up) - hit * 0.5, a3 = lerp(a[2], u[2], up);
        // (each from straight down, + forward, in the group's frame: the body's pitch is not in them)
        T.copy(J).add(tmp.set(Math.sin(a1) * l1 + Math.sin(a2) * l2 + Math.sin(a3) * l3, -Math.cos(a1) * l1 - Math.cos(a2) * l2 - Math.cos(a3) * l3, side * 0.02 * h * (1 - up)));
        F.lerp(T, rear); beta = lerp(beta, -a3, rear); fold = lerp(fold, 0, rear); over *= 1 - rear;
        footTurn = lerp(REAR.paw, 1.0, up);
        pole.set(-Math.cos(a1), -Math.sin(a1), side * 0.25);
      }
      // -- digging, pawing, raking: one forefoot at work, by turns; a stroke goes out and up to the far end of what
      // it works at, down onto it and is dragged back, and the foot is set down where it stood
      if (digK > 0 && leg.key === digLeg) {
        const t = rake - stroke, reach = (P.reach ?? 0.35 * h), top = Math.max(0, P.at ?? 0), lift = 0.25 * l1;
        const farX = J.x + reach, nearX = J.x + reach * 0.4, y0 = leg.F0.y * ls;
        if (t < 0.35) { const u = ease(t / 0.35); T.set(lerp(leg.Fp.x, farX, u), lerp(y0, top + y0 + 0.02 * l1, u) + lift * Math.sin(Math.PI * u), leg.Fp.z * 0.85); }
        else if (t < 0.75) { const u = ease((t - 0.35) / 0.4); T.set(lerp(farX, nearX, u), top + y0 + 0.02 * l1 * (1 - u), leg.Fp.z * 0.85); }
        else { const u = ease((t - 0.75) / 0.25); T.set(lerp(nearX, leg.Fp.x, u), lerp(top + y0, y0, u) + 0.5 * lift * Math.sin(Math.PI * u), leg.Fp.z * 0.85); }
        F.lerp(T, digK); over *= 1 - digK;
        fold = lerp(fold, t >= 0.3 && t < 0.78 ? 0.45 : 0.15, digK);
        if (!leg.short) beta = lerp(beta, leg.beta - 0.5 + 0.9 * smooth(0.35, 0.75, t), digK);
      }
      // -- scratching: a hind foot brought forward and up to the ear on its side
      if (scratch !== 0 && !leg.fore && Math.sign(scratch) === side) {
        ear.copy(earRest).multiplyScalar(hs); ear.z *= side; ear.applyQuaternion(M.head.q).add(M.head.p);
        T.copy(ear).add(tmp.set(-0.05 * h, -0.1 * h + 0.03 * h * Math.sin(TAU * beat * 4), side * 0.04 * h));
        k = Math.abs(scratch);
        F.lerp(T, k); beta = lerp(beta, -1.9, k); fold = lerp(fold, 0.6, k); over *= 1 - k; pole.set(1, 0.3, side * 0.5);
      }
      // -- holding what it eats: the forepaws to the mouth
      if (hold > 0 && leg.fore) {
        T.copy(mouth).add(tmp.set(-0.04 * h, -0.06 * h, side * 0.05 * h));
        if (RODENT) T.z = side * Math.max(Math.abs(T.z), RODENT.coneLong * 0.3 + 0.04 * h);      // (r2-small: either end of the cone)
        F.lerp(T, hold); beta = lerp(beta, 1.2, hold); fold = lerp(fold, 0.3, hold); over *= 1 - hold; pole.set(-0.4, -1, side * 0.9);
        footTurn = lerp(footTurn ?? 0, -0.9, hold);
      }
      // -- in the water: a long low animal tucks its forefeet under its chest and paddles with the hind feet by turns;
      // any other paddles with all four
      if (afloat > 0 || slide > 0 || loose > 0) {
        const c = TAU * cycle + (side < 0 ? 0 : Math.PI) + (leg.fore ? 0 : Math.PI / 2);
        let ox, oy, fd, oz = 1;
        if (leg.fore && SWIM.fore === 'tuck') { ox = 0.25; oy = -0.5; fd = 1.2; oz = 0.9; }
        else if (SWIM.fore === 'tuck') { ox = -0.35 + 0.38 * Math.cos(c); oy = -0.62 + 0.14 * Math.sin(c); fd = 1.6 - 0.7 * Math.sin(c); oz = 1.15; }
        else { ox = 0.12 + 0.3 * Math.cos(c); oy = -0.72 + 0.14 * Math.sin(c); fd = 0.9 - 0.6 * Math.sin(c); }
        // (diving, and sliding: the forelegs laid back along the sides, the hind legs trailing)
        const back1 = Math.max(dive, slide);
        if (back1 > 0) { ox = lerp(ox, leg.fore ? -0.62 : -0.85, back1); oy = lerp(oy, leg.fore ? -0.3 : -0.12, back1); fd = lerp(fd, 1.5, back1); oz = lerp(oz, 1.05, back1); }
        // (on its side or its back: the legs loose, bent, working a little)
        if (loose > 0) { ox = lerp(ox, (leg.fore ? 0.18 : -0.1) + 0.1 * Math.sin(TAU * beat * 1.3 + leg.i), loose); oy = lerp(oy, -0.62, loose); fd = lerp(fd, 0.9, loose); oz = lerp(oz, 1.1, loose); }
        T.set(ox * h, oy * h, side * Math.abs(leg.F0.z) * oz - leg.J0.z).applyQuaternion(qBody).add(J);
        k = offFeet;
        F.lerp(T, k); fold = lerp(fold, fd, k); over *= 1 - k; leg.follow = k;
        tmp.set(leg.fore ? -1 : 1, 0, 0).applyQuaternion(qBody); pole.lerp(tmp, k);
        if (leg.short) beta = lerp(beta, leg.beta + (leg.fore ? -0.5 : 0.6), k);
      }

      // the breakover: the heel comes up with the toe held where it stands, so the foot's joint rises and moves on
      if (over > 0 && drops < 1) {
        const o = over * (1 - drops), co = Math.cos(o), si = Math.sin(o), ta = leg.toe[0] * ls, tb = leg.toe[1] * ls;
        F.x += ta - (ta * co + tb * si); F.y += tb - (-ta * si + tb * co);
      }
      const C = leg.C;
      if (leg.follow > 0) { tmp.set(Math.sin(beta), Math.cos(beta), 0).applyQuaternion(qBody); C.copy(F).addScaledVector(tmp, l3); }
      else C.set(F.x + Math.sin(beta) * l3, F.y + Math.cos(beta) * l3, F.z);
      // lying down: folded under the body
      if (drops > 0) {
        const L = LIE[leg.fore ? 'fore' : 'hind'], z = side * Math.abs(leg.F0.z);
        C.lerp(tmp.set(J.x + L.top[0] * ls, L.top[1] * ls, z * L.out), drops);
        F.lerp(tmp.set(J.x + L.fetlock[0] * ls, L.fetlock[1] * ls, z * L.out * 1.04), drops);
        dir.subVectors(C, F).normalize();
        C.copy(F).addScaledVector(dir, l3);
        pole.z += (leg.fore ? 0 : side * 0.7) * drops;
      }
      // the elbow goes back, the stifle forward
      knee(J, C, l1, l2, pole, leg.E, reachC);
      // (if the knee or the hock is out of reach, the bone over the foot starts where the leg could reach)
      reachF.copy(F).sub(reachC).normalize().multiplyScalar(l3).add(reachC);
      const ends = [[J, leg.E], [leg.E, reachC], [reachC, reachF]];
      for (let b = 0; b < 3; b += 1) {
        dir.subVectors(ends[b][1], ends[b][0]).normalize();
        qBone.setFromUnitVectors(leg.dirs[b], dir);
        by[leg.chain[b]].quaternion.copy(_q.copy(qParent).invert()).multiply(qBone);
        qParent.copy(qBone);
      }
      // the foot: flat on the ground as it stands, folded back from its joint in the air; lying down, hanging and
      // in the water it follows the bone above it
      if (footTurn !== null) qFold.setFromAxisAngle(AZ, footTurn);          // (as the group sees it: 0 flat, - its toes down)
      else {
        qFold.setFromAxisAngle(AZ, -(fold + over) * (1 - drops));
        if (leg.follow > 0) qFold.slerp(_q2.copy(qParent).multiply(_q.setFromAxisAngle(AZ, -fold)), leg.follow);
        if (drops > 0) qFold.slerp(_q2.copy(qParent).multiply(_q.setFromAxisAngle(AZ, LIE[leg.fore ? 'fore' : 'hind'].hoof)), drops);
        if (cling > 0 && (P.grip ?? 0) > 0) qFold.multiply(_q.setFromAxisAngle(AX, -side * cling * Math.asin(clamp(Math.abs(F.z) / P.grip, 0, 0.95))));
      }
      if (RODENT && !leg.fore && P.down) qFold.premultiply(_q.setFromAxisAngle(AY, Math.PI * ease(c01(P.down) * cling)));      // (r2-small)
      by[leg.chain[3]].quaternion.copy(_q.copy(qParent).invert()).multiply(qFold);
    }

    // ---- the tail: raised by `tail`, to one side by `wag`; a long one carries on the body's line, trails on the
    // ground, streams behind a bound and ripples as it swims
    const tail = c01(P.tail), wag = clamp(P.wag ?? 0, -1, 1) + (P.shake ? c01(P.shake) * 0.6 * Math.sin(TAU * beat * 5 - 2.4) : 0);
    if (!drawnTail) by.tail.quaternion.setFromAxisAngle(AZ, -tail * 0.9).multiply(_q.setFromAxisAngle(AX, wag * 0.6));
    else {
      // (the tail's own lie: the hips' pitch taken out of it, so that it trails level however the body is pitched, but
      // for an arch, which it carries on)
      const hipPitch = tilt + arch / 2, c = TAU * cycle, keep = Math.max(dive, porpoise, slide, loose);
      TAIL.forEach((name, k) => {
        let p = -tail * tailUp * (k === 0 ? 0.5 : 0.1) + (k === 0 ? -hipPitch * (1 - keep) : 0);
        p += -arch * 0.16 * keep + swim * 0.1 * Math.sin(c - 1.1 * k - 0.9) + share.gallop * stepping * 0.06 * Math.sin(c - 0.8 * k);
        // (sat down or stood up, its root is nearer the ground: it turns up to lie along it)
        if (k > 0) p -= (rear + sit) * 0.07;
        by[name].quaternion.setFromAxisAngle(AZ, p);
        if (wag) by[name].quaternion.multiply(_q.setFromAxisAngle(AY, wag * 0.2));
      });
    }

    // ---- r2-small: a bushy tail's six bones. Its root keeps its own lie whatever the hips' pitch (as a long tail's does),
    // let down a little trailing, raised by `tail`; its end curled over the back by `curl`; a flick a jerk up from the
    // root that whips to its end; in a bound it streams (brush.carry.run: + down, - up) and ripples; sat up, it lies
    // back from the hips and curls up behind
    if (BRUSH) {
      const B2 = BRUSH, curl = c01(P.curl), flick = clamp(P.flick ?? 0, -1, 1), keep = Math.max(dive, slide, loose);
      const run = (RODENT ? c01(P.scurry) : share.gallop + share.trot) * stepping, c = TAU * cycle, hipPitch = tilt + arch / 2;
      for (let k = 0; k < 6; k += 1) {
        let p;
        if (k === 0) p = -hipPitch * (1 - keep) + B2.droop * (1 - tail) - tail * B2.up * (1 - 0.85 * cling) + cling * 0.15 + sit * B2.sit + rear * 0.55 - flick * 0.55 + run * B2.run;      // (on the bark it lies along the trunk)
        else p = -curl * BEND[k] * B2.curl - rear * 0.12 + flick * (k === 1 ? 0.3 : -0.08) + (B2.bend ? -tail * B2.bend * BEND[k] : 0) + run * 0.16 * Math.sin(c - k * 0.9);
        by[TAIL[k]].quaternion.setFromAxisAngle(AZ, p);
        if (wag) by[TAIL[k]].quaternion.multiply(_q.setFromAxisAngle(AY, wag * (k === 0 ? 0.5 : 0.08)));
      }
    }
    // ---- r2-small: the cone, across the mouth between the forepaws, turned as it is stripped; its scales fall from it
    // to what the animal sits on (the root's level), drifting and turning, and are gone there
    if (RODENT && shape.cone) {
      const shown = c01(P.hold), husk = P.husk ?? 0, strip = c01(P.strip), wide = RODENT.coneWide;
      _cone.copy(mouth).add(tmp.set(0.2 * wide + 0.002, -0.55 * wide - 0.003, 0));
      by.cone.position.copy(_cone); by.cone.quaternion.setFromAxisAngle(AZ, husk * 2.2); by.cone.scale.setScalar(Math.max(TINY, shown));
      for (let k = 0; k < 3; k += 1) {
        const bone = by[`flake${k + 1}`], f = frac(husk * 0.45 + k / 3), on = strip * shown;
        bone.scale.setScalar(Math.max(TINY, on * (f < 0.92 ? 1 : (1 - f) / 0.08)));
        bone.position.copy(_cone);
        bone.position.y = _cone.y * (1 - f * f) + 0.001;
        bone.position.x += (k - 1) * 0.004 + f * 0.01 * Math.sin(k * 2.1 + husk);
        bone.position.z += f * 0.012 * Math.cos(k * 1.7 + husk);
        bone.quaternion.setFromAxisAngle(_axis, f * 9 + k).multiply(_q.setFromAxisAngle(AZ, f * 3));
      }
    } else if (RODENT) for (const name of ['cone', 'flake1', 'flake2', 'flake3']) by[name].scale.setScalar(TINY);
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
