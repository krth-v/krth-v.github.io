import * as THREE from 'three';
import { terrace } from './land.js';

// The loop as it was at checkpoint 2: about 290 m round on the old terrace, from the origin. The first
// stretch of it is still the trail (the scene approved at checkpoint 1 is composed along it), and the
// plants that were scattered along the whole of it still stand where it put them (layout.js). So it is
// kept as it was, to the last bit, and the new trail is spliced onto it.
const OLD = [[0, 0], [18, -22], [44, -30], [70, -18], [88, 6], [84, 36], [62, 56], [34, 60], [8, 48], [-10, 26]];

export function createOldTrail(heightAt) {
  const curve = new THREE.CatmullRomCurve3(OLD.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const N = 1200;
  const points = curve.getSpacedPoints(N);          // N + 1 points; the last repeats the first
  const length = curve.getLength();

  // Ground height under the trail, smoothed so the walk does not jitter.
  const raw = points.map((pt) => heightAt(pt.x, pt.z));
  const R = 12;
  for (let i = 0; i <= N; i += 1) {
    let sum = 0;
    for (let k = -R; k <= R; k += 1) sum += raw[(((i + k) % N) + N) % N];
    points[i].y = sum / (2 * R + 1);
  }

  // Position and unit tangent at arc length s (metres, wraps).
  function sample(s, position, tangent) {
    const u = ((((s % length) + length) % length) / length) * N;
    const i = Math.min(Math.floor(u), N - 1), f = u - i;
    const a = points[i], b = points[i + 1], c = points[(i + 2) % N];
    position.lerpVectors(a, b, f);
    if (tangent) {
      const tx = (b.x - a.x) * (1 - f) + (c.x - b.x) * f;
      const tz = (b.z - a.z) * (1 - f) + (c.z - b.z) * f;
      const inv = 1 / Math.hypot(tx, tz);
      tangent.set(tx * inv, 0, tz * inv);
    }
    return position;
  }

  // Horizontal distance from (x, z) to the trail centreline; locate() also
  // gives how far along the trail the nearest point is.
  const coarse = [];
  for (let i = 0; i < N; i += 3) coarse.push(points[i].x, points[i].z);
  function locate(x, z) {
    let best = Infinity, at = 0;
    for (let i = 0; i < coarse.length; i += 2) {
      const dx = coarse[i] - x, dz = coarse[i + 1] - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; at = i; }
    }
    return [Math.sqrt(best), ((at / 2) * 3 / N) * length];
  }
  const distance = (x, z) => locate(x, z)[0];

  return { length, sample, distance, locate, points, N };
}

// The walk. Its first eight points are the old loop's first eight, so the stretch between the second and the
// seventh is the old trail exactly (a Catmull-Rom span is shaped by the two points before and after it),
// and no plant of the old terrace that can be seen from the scene approved at checkpoint 1 has the trail
// moved under it. From there it goes on round the back of the cabin through the deep wood and past the old
// cedar's wet ground, over the creek on a log at the head of its falls, and down the hill beside the ravine;
// over the creek again on stones where the ravine has opened into the clearing, and straight down the
// clearing to the river with the long reach ahead; along the water on the cobbles, round through the trees
// at the foot of the hill, and back up the clearing's far side past the shelter to the cabin.
// Distance along it is still counted from the old loop's start, which is now some 22 m past the cabin's door:
// the door is at trail.cabin, a little short of the loop's whole length.
//
// There is no switchback and no cut. The owner walked the first valley (2026-11-15): "The zigzag ascent and
// descent paths cause the camera to jerk and swing." The view turns with the trail, so a bend is felt as
// degrees of turn for each metre walked. The old loop, which they called pretty good, turns 2.3 degrees a
// metre at its sharpest and the deep wood behind it 4.5; the zigzags turned 54 and 71, and climbed 19 to 25
// in 100. Every bend here is laid out wide enough to stay at the wood's 4.5 or under, and the hill is one
// slope down to the river and one back up, about 8 in 100 and nowhere over 12.5 (the old loop's own steepest
// is 4.7, the deep wood's 12.3). tools/verify_forest.mjs measures both and fails over 5 degrees or 14 in 100.
//
// name: a place a checkpoint view or a scene can ask for by name (trail.at.<name> is metres along).
// The three wide turns are laid out as arcs of circles, a point every 15 or 20 degrees, because a curve
// through few points bends hardest at the points. Round the old cedar: 19 m in radius, a quarter turn to the
// right. At the river: 17 m and half a turn to the right, eased into over 20 degrees at 30 m from the place
// called `river`, which the trail reaches heading up the valley (15 degrees west of north, 5 short of the
// valley's own line, so the mountain stands a little to the left of dead ahead) on an arc of 29 m from the stones.
// At the cabin: 16 m to the left, past the door and on to the old loop's first point.
const ROUTE = [
  [0, 0], [18, -22], [44, -30], [70, -18], [88, 6], [84, 36], [62, 56, 'deepwood'], [34, 60],
  [8, 53, 'colonnade'], [-4, 46.5], [-14, 43.6], [-24.0, 43.0], [-28.92, 42.35], [-33.5, 40.45, 'cedar'], [-37.44, 37.44], [-40.45, 33.5], [-42.35, 28.92],
  [-44.3, 13.5, 'gully'], [-52.2, -1, 'bridge'], [-56, -10, 'brink'], [-57.5, -20], [-57.5, -29, 'ravine'], [-56.6, -37.5], [-54.2, -45.5], [-51.2, -53, 'stones'],
  [-49.34, -58.49], [-48.61, -64.04], [-48.95, -69.63], [-50.35, -75.05, 'river'], [-51.69, -80.12], [-52.15, -85.33], [-51.12, -91.14, 'beach'], [-48.17, -96.26], [-43.65, -100.05], [-38.1, -102.07], [-32.2, -102.07, 'maples'], [-26.65, -100.05], [-22.13, -96.26], [-19.18, -91.14], [-18.15, -85.33],
  [-19.2, -68, 'meadow'], [-21, -52, 'shelter'], [-24.5, -34], [-27.5, -19], [-28.43, -10.07, 'top'], [-27.88, -5.93], [-26.29, -2.07], [-23.74, 1.24], [-20.43, 3.79, 'cabin'], [-16.57, 5.38], [-12.43, 5.93], [-8.29, 5.38], [-4.43, 3.79],
];
// Where the trail would be cut into a slope at an even grade: [from, to] by place. There is no such stretch now
// (the first valley had two, down and up a bluff); the mechanism is kept for a slope that needs one.
const GRADES = [];
const SAME = [1, 6];              // between these two of its points the walk is the old loop, sample for sample
// Where the walk crosses the creek on a log it crosses level, bank to bank: [place, metres either side of it].
const SPANS = [['bridge', 5]];

export function createTrail(terrain, old) {
  const natural = terrain.natural;                    // the ground before the trail is cut into it
  const n = ROUTE.length, EACH = 400, M = n * EACH;
  const curve = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal');
  const dense = curve.getPoints(M);                   // even in the curve's own parameter: point k * EACH is ROUTE[k]
  const run = new Float64Array(M + 1);                // metres from ROUTE[0] to each of them
  for (let i = 1; i <= M; i += 1) run[i] = run[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].z - dense[i - 1].z);
  const total = run[M];
  const pointAt = (metres) => {                       // the curve's point `metres` along it (wraps)
    const m = ((metres % total) + total) % total;
    let lo = 0, hi = M - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (run[mid] <= m) lo = mid; else hi = mid - 1; }
    const f = (m - run[lo]) / Math.max(run[lo + 1] - run[lo], 1e-12);
    return new THREE.Vector3().lerpVectors(dense[lo], dense[lo + 1], f);
  };

  // The old trail's own samples between its second and seventh points become this trail's, under the same
  // numbers, so that a place along that stretch is the place it always was. The rest of the curve is cut
  // into steps of the same length (to within a part in a thousand) and numbered on from them, round to
  // where they begin.
  const step = old.length / old.N;
  const oldNear = (x, z) => { let best = Infinity, at = 0; for (let i = 0; i < old.N; i += 1) { const d = Math.hypot(old.points[i].x - x, old.points[i].z - z); if (d < best) { best = d; at = i; } } return at; };
  const denseNear = (p, k) => { let best = Infinity, at = 0; for (let i = (k - 1) * EACH; i <= (k + 1) * EACH; i += 1) { const d = Math.hypot(dense[i].x - p.x, dense[i].z - p.z); if (d < best) { best = d; at = i; } } return at; };
  const ja = oldNear(ROUTE[SAME[0]][0], ROUTE[SAME[0]][1]) + 3, jb = oldNear(ROUTE[SAME[1]][0], ROUTE[SAME[1]][1]) - 3;
  const da = denseNear(old.points[ja], SAME[0]), db = denseNear(old.points[jb], SAME[1]);
  const span = total - run[db] + run[da], more = Math.round(span / step);
  const N = jb - ja + more, length = N * step;
  const points = new Array(N + 1);
  for (let i = ja; i <= jb; i += 1) points[i] = new THREE.Vector3(old.points[i].x, 0, old.points[i].z);
  for (let k = 1; k < more; k += 1) points[(jb + k) % N] = pointAt(run[db] + (span * k) / more);
  points[N] = points[0].clone();
  // metres along this trail of a point `metres` along the curve
  const along = (metres) => { const m = (((metres - run[db]) % total) + total) % total; return (((jb + (m / span) * more) % N) + N) % N * step; };

  const at = {};
  ROUTE.forEach(([, , name], k) => { if (name) at[name] = along(run[k * EACH]); });

  // Height: the ground under the trail, averaged along it. On the old terrace over six metres, as it always
  // was. Off it over eighteen: the hill is hummocky, as an old field and a forest floor are, and the walker's
  // eye should not rise and fall with every hummock (at a steady scroll that is a bob every second or two).
  // So off the terrace the eye keeps an even height and the ground under it comes and goes by a hand.
  const raw = points.map((pt) => natural(pt.x, pt.z));
  // Where the walk crosses the creek on a log, the ground it is averaged from is the bank either side, joined
  // straight across: averaged with the creek's bed, the tread dipped towards the water at both ends of the log.
  const spans = {};
  for (const [name, reach] of SPANS) {
    const i0 = Math.round((at[name] - reach) / step), i1 = Math.round((at[name] + reach) / step), y0 = raw[i0], y1 = raw[i1];
    for (let i = i0; i <= i1; i += 1) raw[i] = y0 + ((y1 - y0) * (i - i0)) / (i1 - i0);
    spans[name] = [i0 * step, i1 * step];
  }
  for (let i = 0; i <= N; i += 1) {
    const inside = Math.min(1, Math.max(0, (terrace(points[i].x, points[i].z) + 6) / 12)), R = Math.round(37 - 25 * inside * inside * (3 - 2 * inside));
    let sum = 0;
    for (let k = -R; k <= R; k += 1) sum += raw[(((i + k) % N) + N) % N];
    points[i].y = sum / (2 * R + 1);
  }
  const cut = [];                                     // x, z, height of every sample on a grade
  for (const [from, to] of GRADES) {
    const i0 = Math.round(at[from] / step), i1 = Math.round(at[to] / step);
    const y0 = points[i0].y, y1 = points[i1].y;
    for (let i = i0; i <= i1; i += 1) {
      const t = (i - i0) / (i1 - i0), ease = t * t * (3 - 2 * t);
      points[i].y = y0 + (y1 - y0) * (0.8 * t + 0.2 * ease);
      cut.push(points[i].x, points[i].z, points[i].y);
    }
  }
  points[N].y = points[0].y;
  // The ground beside a graded stretch is the tread's own height out to 1.3 m from its middle and has met the
  // slope by 4.6 m: a bench with a cut bank above it and a fill below.
  const CELL = 6, bins = new Map();
  for (let i = 0; i < cut.length; i += 3) {
    const key = `${Math.floor(cut[i] / CELL)},${Math.floor(cut[i + 1] / CELL)}`;
    if (!bins.has(key)) bins.set(key, []);
    bins.get(key).push(i);
  }
  if (cut.length) terrain.cutBy((x, z, h) => {
    const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
    let best = 21.2, y = 0;                           // 4.6 m, squared
    for (let i = -1; i <= 1; i += 1) for (let j = -1; j <= 1; j += 1) {
      const bin = bins.get(`${cx + i},${cz + j}`);
      if (!bin) continue;
      for (const o of bin) { const dx = cut[o] - x, dz = cut[o + 1] - z, d = dx * dx + dz * dz; if (d < best) { best = d; y = cut[o + 2]; } }
    }
    if (best >= 21.16) return h;
    const t = Math.min(1, Math.max(0, (Math.sqrt(best) - 1.3) / 3.3));
    return y + (h - y) * t * t * (3 - 2 * t);
  });

  // Along the stretch that has not moved, a place is worked out by the old trail's own arithmetic, so that
  // the camera stands where it stood to the last bit; elsewhere, the same way on this trail's samples.
  const sA = (ja + 14) * step, sB = (jb - 14) * step;
  function sample(s, position, tangent) {
    if (s > sA && s < sB) return old.sample(s, position, tangent);
    const u = ((((s % length) + length) % length) / length) * N;
    const i = Math.min(Math.floor(u), N - 1), f = u - i;
    const a = points[i], b = points[i + 1], c = points[(i + 2) % N];
    position.lerpVectors(a, b, f);
    if (tangent) {
      const tx = (b.x - a.x) * (1 - f) + (c.x - b.x) * f;
      const tz = (b.z - a.z) * (1 - f) + (c.z - b.z) * f;
      const inv = 1 / Math.hypot(tx, tz);
      tangent.set(tx * inv, 0, tz * inv);
    }
    return position;
  }

  const coarse = [];
  for (let i = 0; i < N; i += 3) coarse.push(points[i].x, points[i].z);
  function locate(x, z) {
    let best = Infinity, where = 0;
    for (let i = 0; i < coarse.length; i += 2) {
      const dx = coarse[i] - x, dz = coarse[i + 1] - z;
      const d = dx * dx + dz * dz;
      if (d < best) { best = d; where = i; }
    }
    return [Math.sqrt(best), ((where / 2) * 3 / N) * length];
  }
  const distance = (x, z) => locate(x, z)[0];

  return { length, sample, distance, locate, at, cabin: at.cabin, kept: [sA, sB], grades: GRADES.map(([from, to]) => [at[from], at[to]]), spans };
}
