// The lie of the land: an old river terrace, and under it a small valley. From the terrace's brink the
// ground falls as one gentle forested hill to a narrow river that winds down from the mountain. Across the
// water a forested wall rises at once, and further up the valley one rises on our side too, so that the
// valley closes to a V with the mountain in its notch. A creek leaves the wet ground round the old cedar,
// goes over the brink in one leap, and runs down a ravine and then a grassy swale to the river. Below the
// cabin's window the hill is an old clearing in grass, from the brink to the bank.
//
// Directions. On a map with -z up and +x to the right, the river comes down the valley from the top (-z),
// bends below the clearing and leaves to the left (-x). So "up-valley" is -z, a little to the left, and the
// mountain stands there. The sun is always low on the +x side of up-valley (solar.js: 16 to 47 degrees from
// +x towards -z). The cabin's window looks out through its -z wall. Read as a compass with north at -z: the
// valley runs north by west to the mountain, the river turns west below the cabin, and the sun is in the
// east-north-east. (solar.js and terrain.js call -z south, which is the same picture in a mirror; nothing
// depends on the names.)
//
// What stood in the world before there was a valley is kept exactly: on the old terrace, inside its brink
// and away from the creek, the ground is the ground it was, to the last bit (relief() returns the old height
// itself there). Checkpoint 1's scene stands on it.
//
// Heights are metres above the old terrace's own datum, which is what y = 0 always was. The terrace stands
// 6 to 7 m over the water; the highest terraces on these rivers stand about 8 (South Fork Hoh: Swanson and
// Lienkaemper 1980).
//
// This is the valley as rebuilt after the owner walked the first one (2026-11-15): that one had a bluff, a
// river 42 m wide and straight, bars as wide again, and a floor 150 m across. See CLAUDE.md, "The walk".

// The world as it was at checkpoint 2. The scatter that fills it, the sun's shadow map and the lattices
// of the ground and the light maps are all tied to this box and must not move.
export const LEGACY = Object.freeze({ minX: -120, maxX: 200, minZ: -140, maxZ: 170 });
// The world now. Each edge is a whole number of the coarsest ground cells (4 m) from the old one. The light
// maps (the sun's shadow map, the crown map, the trail map) still cover the old box and nothing more: every
// metre of the walk lies inside it, and what is across the river or far up it goes without them.
export const WORLD = { minX: -320, maxX: 200, minZ: -440, maxZ: 170, canopyTop: 70 };

export const CABIN = Object.freeze({ x: -19, z: 10.5 });

// The brink of the old terrace, walked with the terrace on the right: in from down-valley over the river,
// round the corner by the cabin, and away up-valley. It was the top of a bluff; it is now only where the old
// ground ends and the hill begins, and it has not moved.
const RIM = [[-420, -36], [-260, -30], [-170, -22], [-112, -14], [-80, -8], [-52, -4.5], [-30, -3.5], [-11, -5], [-5.5, -24], [-2, -60], [4, -110], [14, -170], [30, -250], [52, -340], [78, -440], [84, -620]];
const TERRACE = [...RIM, [640, -620], [640, 420], [-420, 420]];                        // closed: what lies inside is the old terrace

// The valley's axis: the line the cabin's window looks along. It leaves the window 20 degrees to the left of
// straight out (-z), runs down the clearing to the river's bend, and on up the middle of the river's long
// reach to the spur that closes it. `half` is how far either side of it nothing tall grows.
export const VIEW = Object.freeze({ x: -20.3, z: 7.6, bearing: 20, half: 14 });
const UX = -Math.sin(VIEW.bearing / 57.29578), UZ = -Math.cos(VIEW.bearing / 57.29578);          // one metre up the valley
// A place by how far up the valley it is from the window and how far to the right of the line, looking up it.
const upValley = (t, o) => [VIEW.x + t * UX - o * UZ, VIEW.z + t * UZ + o * UX];
const REACH_FROM = 12, REACH_TO = 372;                   // metres up the valley: from the brink under the window to where the spur closes the reach

// ---- the river ---------------------------------------------------------------------------------------
// Its middle line, downstream. It comes round the closing spur from the right, down the long reach in bends
// that swing 6 m either side of the axis (less than half its own width, so that the axis lies over water all
// the way and the eye runs up it), round the bend below the clearing, and away in wider bends.
const BEND = Object.freeze({ x: -81.34, z: -95.76, r: 22 });                           // the bend below the clearing: its centre and the radius of the river's middle line
const round = (deg) => [BEND.x - Math.cos(deg / 57.29578) * BEND.r, BEND.z - Math.sin(deg / 57.29578) * BEND.r];       // the bend's middle line where the river heads `deg` (0 is -z, 90 is +x)
const KNOTS = [
  upValley(470, 120), upValley(440, 80), upValley(415, 45), upValley(392, 18), upValley(368, 2),
  upValley(340, -6), upValley(300, 6), upValley(258, -6), upValley(216, 6), upValley(176, -6), upValley(142, 4),
  round(160), round(182), round(204), round(226), round(248), round(270),
  [-98, -76], [-116, -70], [-134, -66], [-152, -72], [-168, -82], [-188, -86], [-208, -78], [-228, -68], [-250, -66], [-275, -74], [-300, -80], [-345, -76],
];
const HALF = 6.5;                                        // half the width of the water
const FALL = 0.006;                                      // the river drops this much a metre (the Hoh: 0.0056)
const WATER = -6.6;                                      // the water's surface in the bend
const BED = 1.25;                                        // how deep the river is in its middle
const SHELF = 0.3;                                       // a bar's cobbles lie this far above the water
const BANK = 0.8;                                        // and the bank's top this far
const FACE = 3.5;                                        // metres from a bar's back to the top of the bank
const CREST = -0.2;                                      // what our hill rises towards, until it nears the brink and takes the old ground's own height
const EDGE = 0.7, WIDEST = 9;                            // metres of cobbles at the water's edge: at the least, and on the inside of the tightest bend
const SWING = 198;                                       // a bar's width for a bend of curvature 1 in 1 m: 9 m where the middle line's radius is 22 m
const BLEND = 14, BLEND_BAR = 5;                         // metres: how much nearer one stretch of the river must be than another to outweigh it e to one, for the water's height and for a bar's width
// Where our own bank has cobbles though it is the outside of the bend: the beach under the clearing, which the
// walk comes down to, and the fan the creek has built at its mouth. [x, z, reach, metres of cobbles]
const FANS = [[-53.2, -89, 14, 4], [-62.4, -74.6, 12, 5.5]];

// The creek: out of the wet ground round the old cedar, north across the terrace in a gully, over the brink
// in one leap of three metres into a pool, down a ravine that shallows to a grassy swale, across the foot of
// the clearing and into the river at the bend.
// It rises as a spring where the old cedar's two great north roots go under the ground, a stride and a half
// from the trail and dead ahead of a walker coming round the tree: a basin a stride or two across where the
// water wells up, drawn in to a rill a stride wide where it leaves, between banks of peat that stand steeper
// than a forest floor's. (It rose at (-49.3, 35.2), in the nook between two roots on the tree's far side, and
// from no step of the trail could its water be seen: a root as high as a knee stood in front of it whichever
// way the walker looked.) It is no pond: the owner chose a creek, a ravine with falling water and the river's
// bar, and "No pond" (2026-11-14).
// [x, z, bed height, half-width of the bed, how steeply the banks rise from it]
const CREEK = [[-44.6, 30.6, -1.62, 0.7, 0.5], [-46.2, 29.45, -1.628, 0.28, 0.6], [-48.6, 28.2, -1.645, 0.34, 0.6], [-50.8, 27, -1.66, 0.4, 0.6], [-52.8, 17, -1.7, 0.65, 0.8], [-54.5, 8, -1.74, 0.75, 1.1], [-53.5, 1.5, -1.77, 0.85, 1.25],
  [-50.8, -3.6, -1.8, 0.9, 1.3], [-50.68, -4.14, -1.84, 0.8, 1.5], [-50.56, -4.72, -5.05, 1.3, 2.4], [-49.85, -8, -5.0, 1.9, 1.9], [-49.6, -10.8, -4.87, 1.0, 1.25],
  [-49.5, -16, -4.92, 1.1, 1.1], [-49.5, -30, -4.95, 0.9, 1.0],
  [-49, -40, -4.97, 0.9, 0.7], [-50.5, -50, -5.0, 1.0, 0.3], [-54.5, -61, -5.6, 1.0, 0.3], [-59.5, -70, -6.25, 1.3, 0.3], [-62.4, -74.6, -6.75, 2.0, 0.3]];

// The falls. The creek goes over a ledge of rock (plants/crag.js) into a pool it has dug at the ledge's foot,
// and leaves the pool over a sill. The bed's own drop (the ninth and tenth points above) is half a metre long,
// but the ground cannot end a gully in a drop: its 1 m lattice, read from stretches that are blended into one
// another (CREEK_BLEND), makes a funnel of it, two and a half metres long and six across, most of the fall in
// its last metre and a half (measured from the ground's own mesh, not worked out from these numbers). The
// rock's face stands in front of the funnel, at `x`, `z`, where the water leaves the rock, and the rock's top
// roofs the funnel over. `down` is the way the creek runs there, `top` the height of the rock's lip under the
// water, and `sill` the index of the point the pool's water stands level with.
export const FALLS = Object.freeze({ x: -50.43, z: -5.31, down: Object.freeze([0.211, -0.977]), top: -1.84, sill: 11 });

export const GLADE = Object.freeze({ x: -46, z: 37, r: 21 });                         // the wet ground round the old cedar
// The wet ground's floor is a surface of its own, which drains to the creek: beside the creek it stands DRY
// above the water abreast of it, and it rises SEEP for each metre further off. It was the old ground let down
// by 0.85 m, which kept the old ground's own swells: half of it then lay below the creek's water, and the
// creek's first eight metres were a ribbon standing a hand above the ground beside them.
const CREEK_DEEP = 0.14, DRY = 0.1, SEEP = 0.02;                                       // metres of water over the creek's bed; see above
// The old clearing: a homestead's field on the hill below the cabin, from the brink under the window down
// to the river, with the creek's swale across its foot. Its outline, and how soft its edge is in metres.
export const MEADOW = Object.freeze({ edge: 4, outline: [[-41, -9], [-19, -9], [-16, -24], [-15.5, -42], [-17, -58], [-24, -70], [-33, -80], [-39, -90], [-46, -95.5],
  [-56, -88], [-65, -75], [-60.5, -67.5], [-56, -59], [-52.5, -47.5], [-46.5, -40], [-44.5, -28], [-42.5, -16]] });

// The valley's walls, in metres above the bank by metres back from it. The far wall rises from the far
// bank everywhere. Ours rises from our bank only up the valley, beyond the old world's box: nearer, our side
// of the valley is the hill up to the old terrace.
const FAR_WALL = { grade: 0.30, more: 0.0011, knee: 70, over: 40 }, OUR_WALL = { grade: 0.22, more: 0.0009, knee: 55, over: 30, back: 10, from: -150, full: -250 };

const clamp01 = (t) => Math.min(1, Math.max(0, t));
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// A smooth line through `knots`, as points about `step` metres apart (a centripetal Catmull-Rom curve).
function spline(knots, step) {
  const out = [], n = knots.length, at = (i) => (i < 0 ? [2 * knots[0][0] - knots[1][0], 2 * knots[0][1] - knots[1][1]] : i >= n ? [2 * knots[n - 1][0] - knots[n - 2][0], 2 * knots[n - 1][1] - knots[n - 2][1]] : knots[i]);
  const gap = (a, b) => Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1]));
  for (let i = 0; i + 1 < n; i += 1) {
    const p0 = at(i - 1), p1 = knots[i], p2 = knots[i + 1], p3 = at(i + 2);
    const t1 = gap(p0, p1), t2 = t1 + gap(p1, p2), t3 = t2 + gap(p2, p3);
    const count = Math.max(1, Math.round(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let k = 0; k < count; k += 1) {
      const t = t1 + ((t2 - t1) * k) / count, point = [0, 0];
      for (let c = 0; c < 2; c += 1) {
        const a1 = (p0[c] * (t1 - t) + p1[c] * t) / t1, a2 = (p1[c] * (t2 - t) + p2[c] * (t - t1)) / (t2 - t1), a3 = (p2[c] * (t3 - t) + p3[c] * (t - t2)) / (t3 - t2);
        const b1 = (a1 * (t2 - t) + a2 * t) / t2, b2 = (a2 * (t3 - t) + a3 * (t - t1)) / (t3 - t1);
        point[c] = (b1 * (t2 - t) + b2 * (t - t1)) / (t2 - t1);
      }
      out.push(point);
    }
  }
  out.push([knots[n - 1][0], knots[n - 1][1]]);
  return out;
}

// Distance from (x, z) to a polyline, with where along it the nearest point is. `out` gets
// [distance, metres along, segment, share of the segment, which side: negative on the left of the direction walked].
function cumulative(points) {
  const along = [0];
  for (let i = 1; i < points.length; i += 1) along.push(along[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return along;
}
function nearest(points, along, x, z, out) {
  let best = Infinity;
  for (let i = 0; i + 1 < points.length; i += 1) {
    const ax = points[i][0], az = points[i][1], ux = points[i + 1][0] - ax, uz = points[i + 1][1] - az;
    const t = clamp01(((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz));
    const dx = x - ax - ux * t, dz = z - az - uz * t, d = dx * dx + dz * dz;
    if (d < best) { best = d; out[1] = along[i] + (along[i + 1] - along[i]) * t; out[2] = i; out[3] = t; out[4] = ux * (z - az) - uz * (x - ax); }
  }
  out[0] = Math.sqrt(best);
  return out;
}
function inside(polygon, x, z) {
  let odd = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i], b = polygon[j];
    if ((a[1] > z) !== (b[1] > z) && x < ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]) + a[0]) odd = !odd;
  }
  return odd;
}

const RIVER = spline(KNOTS, 3);
const rimAlong = cumulative(RIM), riverAlong = cumulative(RIVER), creekAlong = cumulative(CREEK);
const meadowRing = [...MEADOW.outline, MEADOW.outline[0]], meadowAlong = cumulative(meadowRing);
const _a = [0, 0, 0, 0, 0], _m = [0, 0, 0, 0, 0];

// How wide the cobbles are at each point of the river's line, on our (left) bank and on the far one. A bar
// builds on the inside of a bend, the wider the tighter the bend; the outside is cut, with a strip at the
// water's edge and no more.
const BARS = (() => {
  const n = RIVER.length, turn = new Float64Array(n), ours = new Float64Array(n), far = new Float64Array(n);
  for (let i = 1; i + 1 < n; i += 1) {
    const ux = RIVER[i][0] - RIVER[i - 1][0], uz = RIVER[i][1] - RIVER[i - 1][1], vx = RIVER[i + 1][0] - RIVER[i][0], vz = RIVER[i + 1][1] - RIVER[i][1];
    // positive where the river turns to its right, which puts the inside of the bend on the far bank
    turn[i] = Math.atan2(ux * vz - uz * vx, ux * vx + uz * vz) / ((Math.hypot(ux, uz) + Math.hypot(vx, vz)) / 2);
  }
  for (let i = 0; i < n; i += 1) {
    let sum = 0, count = 0;
    for (let k = -4; k <= 4; k += 1) if (i + k >= 0 && i + k < n) { sum += turn[i + k]; count += 1; }
    const bend = (sum / count) * SWING;
    far[i] = Math.min(WIDEST, Math.max(EDGE, bend)); ours[i] = Math.min(WIDEST, Math.max(EDGE, -bend));
  }
  return { ours, far };
})();

// The river's line is some 250 short segments, and the ground asks where it stands to the river a million
// times as the page loads. So the valley is cut into squares, each with the few segments any spot in it can
// be nearest to. What a spot takes from the river besides its distance (how far down the river it lies, which
// sets the water's height abreast of it, and how wide the cobbles are on either bank) is worked out once, at
// the corners of squares half the size, as an average over every stretch of the river, the nearer the
// heavier. Taken from the nearest stretch alone, each of them jumps wherever two stretches are as near as
// each other, which is all along the middle of the inside of a bend, and the ground stepped there by up to
// two metres (CLAUDE.md, "Learned in milestone 3a").
const GRID = 8, GX = -344, GZ = -496, GNX = 58, GNZ = 63, FIELD = GRID / 2, FNX = GNX * 2, FNZ = GNZ * 2;
const NEAR = [], DOWN = new Float32Array((FNX + 1) * (FNZ + 1)), BAR_OURS = new Float32Array(DOWN.length), BAR_FAR = new Float32Array(DOWN.length);
const toSegment = (i, x, z) => {
  const ax = RIVER[i][0], az = RIVER[i][1], ux = RIVER[i + 1][0] - ax, uz = RIVER[i + 1][1] - az;
  const t = clamp01(((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz));
  return Math.hypot(x - ax - ux * t, z - az - uz * t);
};
{
  const segments = RIVER.length - 1, d = new Float64Array(segments);
  for (let j = 0; j < GNZ; j += 1) {
    for (let i = 0; i < GNX; i += 1) {
      const x = GX + (i + 0.5) * GRID, z = GZ + (j + 0.5) * GRID;
      let least = Infinity;
      for (let s = 0; s < segments; s += 1) { d[s] = toSegment(s, x, z); if (d[s] < least) least = d[s]; }
      const list = [];
      for (let s = 0; s < segments; s += 1) if (d[s] <= least + GRID * 1.4143) list.push(s);
      NEAR.push(Uint16Array.from(list));
    }
  }
  // every second point of the line is near enough for an average: 6 m apart, where a bar is 40 m long
  const every = [];
  for (let s = 0; s < RIVER.length; s += 2) every.push(s);
  const far = new Float64Array(every.length);
  for (let j = 0; j <= FNZ; j += 1) {
    for (let i = 0; i <= FNX; i += 1) {
      const x = GX + i * FIELD, z = GZ + j * FIELD, o = j * (FNX + 1) + i;
      let least = Infinity;
      for (let k = 0; k < every.length; k += 1) { const p = RIVER[every[k]]; far[k] = Math.hypot(x - p[0], z - p[1]); if (far[k] < least) least = far[k]; }
      let sum = 0, down = 0, sumBar = 0, ours = 0, other = 0;
      for (let k = 0; k < every.length; k += 1) {
        const more = far[k] - least;
        if (more > 6 * BLEND) continue;
        const w = Math.exp(-more / BLEND);
        sum += w; down += w * riverAlong[every[k]];
        if (more > 6 * BLEND_BAR) continue;
        const v = Math.exp(-more / BLEND_BAR);
        sumBar += v; ours += v * BARS.ours[every[k]]; other += v * BARS.far[every[k]];
      }
      DOWN[o] = down / sum; BAR_OURS[o] = ours / sumBar; BAR_FAR[o] = other / sumBar;
    }
  }
}
// metres down the river at the middle of the bend below the clearing, where the water's height is WATER
const BEND_AT = (() => { const o = [0, 0, 0, 0, 0], p = round(215); return nearest(RIVER, riverAlong, p[0], p[1], o)[1]; })();

// How far inside the old terrace's brink (x, z) lies: positive on the terrace, negative out over the valley.
export function terrace(x, z) {
  const d = nearest(RIM, rimAlong, x, z, _a)[0];
  return inside(TERRACE, x, z) ? d : -d;
}

// Where (x, z) stands to the river. `out`: [metres from the water's edge (negative in the water), true on
// our bank, the water's height abreast of it, how wide the cobbles are on that bank, metres down the river].
export function river(x, z, out = [0, false, 0, 0, 0]) {
  const gx = (x - GX) / GRID, gz = (z - GZ) / GRID, ix = Math.floor(gx), iz = Math.floor(gz), within = ix >= 0 && iz >= 0 && ix < GNX && iz < GNZ;
  const list = within ? NEAR[iz * GNX + ix] : null, count = list ? list.length : RIVER.length - 1;
  let best = Infinity, at = 0, share = 0, side = 0;
  for (let k = 0; k < count; k += 1) {
    const i = list ? list[k] : k, ax = RIVER[i][0], az = RIVER[i][1], ux = RIVER[i + 1][0] - ax, uz = RIVER[i + 1][1] - az;
    const t = clamp01(((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz));
    const dx = x - ax - ux * t, dz = z - az - uz * t, d = dx * dx + dz * dz;
    if (d < best) { best = d; at = i; share = t; side = ux * (z - az) - uz * (x - ax); }
  }
  const ours = side < 0, down = lerp(riverAlong[at], riverAlong[at + 1], share), bars = ours ? BARS.ours : BARS.far;
  let smoothDown = down, bar = lerp(bars[at], bars[at + 1], share);
  if (within) {
    const hx = gx * 2, hz = gz * 2, jx = Math.min(FNX - 1, Math.floor(hx)), jz = Math.min(FNZ - 1, Math.floor(hz)), fx = hx - jx, fz = hz - jz, o = jz * (FNX + 1) + jx, field = ours ? BAR_OURS : BAR_FAR;
    smoothDown = lerp(lerp(DOWN[o], DOWN[o + 1], fx), lerp(DOWN[o + FNX + 1], DOWN[o + FNX + 2], fx), fz);
    bar = lerp(lerp(field[o], field[o + 1], fx), lerp(field[o + FNX + 1], field[o + FNX + 2], fx), fz);
  }
  out[0] = Math.sqrt(best) - HALF;
  out[1] = ours;
  out[2] = WATER + (BEND_AT - smoothDown) * FALL;
  if (ours) for (const [fx, fz, reach, wide] of FANS) { const d = Math.hypot(x - fx, z - fz); if (d < reach) bar = Math.max(bar, wide * (1 - smooth(0.45 * reach, reach, d))); }
  out[3] = bar;
  out[4] = down;
  return out;
}

// The creek near (x, z): [metres from its middle line, its bed's height there, half-width of the bed, how
// steeply its banks rise, metres along it]. Far from it, the first of those is 99 and the rest mean nothing.
// All but the distance are an average over the creek's stretches, the nearer the heavier. Taken from the
// nearest stretch alone they jump along a line on the inside of every bend, where a spot is as near one
// stretch as the next, and beside the falls, where the bed drops three metres in three, the ground stepped by
// most of a metre along that line (the same fault as the river's: CLAUDE.md, "Learned in milestone 3a").
const CREEK_BLEND = 0.35;                                // metres: how much nearer one stretch must be than another to outweigh it e to one
const _cd = new Float64Array(CREEK.length - 1), _ct = new Float64Array(CREEK.length - 1);
export function creek(x, z, out = [0, 0, 0, 0, 0]) {
  if (x < -92 || x > -18 || z < -106 || z > 68) { out[0] = 99; return out; }
  let best = Infinity;
  for (let i = 0; i + 1 < CREEK.length; i += 1) {
    const ax = CREEK[i][0], az = CREEK[i][1], ux = CREEK[i + 1][0] - ax, uz = CREEK[i + 1][1] - az;
    const t = clamp01(((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz)), d = Math.hypot(x - ax - ux * t, z - az - uz * t);
    _cd[i] = d; _ct[i] = t;
    if (d < best) best = d;
  }
  let weight = 0, bed = 0, half = 0, steep = 0, along = 0;
  for (let i = 0; i + 1 < CREEK.length; i += 1) {
    const more = _cd[i] - best;
    if (more > CREEK_BLEND * 9) continue;
    const k = Math.exp(-more / CREEK_BLEND), t = _ct[i], a = CREEK[i], b = CREEK[i + 1];
    weight += k; bed += k * lerp(a[2], b[2], t); half += k * lerp(a[3], b[3], t); steep += k * lerp(a[4], b[4], t);
    along += k * lerp(creekAlong[i], creekAlong[i + 1], t);
  }
  out[0] = best; out[1] = bed / weight; out[2] = half / weight; out[3] = steep / weight; out[4] = along / weight;
  return out;
}

// How far inside the old clearing's outline (x, z) lies, in metres: negative outside it.
export function inMeadow(x, z) {
  if (x < -90 || x > 10 || z < -122 || z > 16) return -25;
  const d = nearest(meadowRing, meadowAlong, x, z, _m)[0];
  return inside(MEADOW.outline, x, z) ? d : -d;
}
export const meadow = (x, z) => smooth(-MEADOW.edge * 0.6, MEADOW.edge * 0.4, inMeadow(x, z));           // 1 in the old clearing, 0 outside it
export const glade = (x, z) => 1 - smooth(0.35, 1.0, Math.hypot(x - GLADE.x, z - GLADE.z) / GLADE.r);
// 1 where (x, z) lies in the strip the cabin's window looks along (the clearing, the bend and the river's long
// reach, VIEW.half either side of the axis), 0 outside it, with an edge three metres wide.
export function sightline(x, z) {
  const t = (x - VIEW.x) * UX + (z - VIEW.z) * UZ, o = Math.abs((z - VIEW.z) * UX - (x - VIEW.x) * UZ);
  return (1 - smooth(VIEW.half, VIEW.half + 3, o)) * smooth(REACH_FROM - 4, REACH_FROM, t) * (1 - smooth(REACH_TO, REACH_TO + 6, t));
}

const _r = [0, false, 0, 0, 0], _k = [0, 0, 0, 0, 0];
const wall = (w, d) => { const rise = w.grade * d + w.more * d * d; return rise < w.knee ? rise : w.knee + w.over * (1 - Math.exp(-(rise - w.knee) / w.over)); };

// createLand(base, grain): `base` is the old ground (terrain.js), `grain` a smooth noise in 0..1 for the
// valley's own small relief. Returns heightAt and what the layout and the paint need to know.
export function createLand(base, grain) {
  // Small relief: the hummocks of a field long left alone and of a forest floor, on the hill and the walls.
  const hummock = (x, z) => 0.5 * (grain(x / 9, z / 9) - 0.5) + 0.26 * (grain(x / 3.7 + 40, z / 3.7 + 11) - 0.5);
  // Our wall's rise at (x, z), which stands `from` metres from the water on our side: nothing at all inside
  // the old world's box, nor for some way up the valley from it.
  const ourWall = (z, from) => (z >= OUR_WALL.from ? 0 : smooth(OUR_WALL.from, OUR_WALL.full, z) * wall(OUR_WALL, Math.max(0, from - OUR_WALL.back)));

  // The valley at (x, z), which lies `d` metres inside the old terrace's brink (negative: outside it); `h` is
  // the old height there.
  function valley(x, z, h, d) {
    river(x, z, _r);
    const from = _r[0], level = _r[2], bar = _r[3];
    if (from <= 0) return level - BED * smooth(0, -5, from) - 0.1 * smooth(0, -1.2, from);
    const shelf = level + SHELF * smooth(-0.6, 2.2, from) + (from < bar ? 0.1 * (grain(x / 2.3, z / 2.3) - 0.5) * smooth(0, 1.5, from) : 0);
    const back = from - bar;                                 // metres behind the cobbles
    if (back <= 0) return shelf;
    const top = lerp(shelf, level + BANK, smooth(0, FACE, back)), beyond = Math.max(0, back - FACE);
    if (!_r[1]) {
      // the far wall: spurs and hollows along it, so that it is not one ruled slope
      const spur = 0.78 + 0.44 * grain(x / 85 + 7, z / 85 + 3);
      return top + wall(FAR_WALL, beyond) * spur + 1.6 * hummock(x, z) * smooth(0, 6, beyond);
    }
    // our hill: from the bank's top to the old ground at the brink, gentlest at its foot (seven-tenths of its
    // mean slope there, a tenth more than its mean over its upper half)
    const out = -d, p = beyond / (beyond + out), f = p * (0.7 + p * (0.5 - 0.2 * p));
    // What it rises to is the old ground only near the brink. The old ground's own swells run on under the
    // valley (they are a formula), two metres high and seventy across, and a hill that rose to them had a bulge
    // under the old clearing that the walk went down 14 in 100 to get round and then climbed again.
    return lerp(top, lerp(CREST, h, p * p), f) + hummock(x, z) * smooth(0, 8, out) * smooth(0, 4, beyond) + ourWall(z, from);
  }

  // What the valley, the creek and the wet ground do to the old height `h` at (x, z). Returns `h` itself,
  // untouched, wherever they do nothing.
  function relief(x, z, h) {
    const d = terrace(x, z);
    let y = h, touched = false, wet = 0;
    if (d < 0) {
      y = valley(x, z, h, d);
      touched = true;
    } else {
      wet = glade(x, z);
      if (wet > 0) {
        creek(x, z, _k);
        // a little relief of its own, a stride or two across, dying away at the creek's bank
        const off = Math.max(0, _k[0] - _k[2]), tussock = 0.07 * (grain(x / 1.9 + 13, z / 1.9 + 5) - 0.5) * smooth(0.3, 2.5, off);
        y = lerp(y, _k[1] + CREEK_DEEP + DRY + SEEP * off + tussock, wet);
        touched = true;
      }
      if (z < OUR_WALL.from) {                                // up the valley our wall goes on rising over what was the terrace's line
        const rise = ourWall(z, river(x, z, _r)[0]);
        if (rise > 0) { y += rise; touched = true; }
      }
    }
    creek(x, z, _k);
    if (_k[0] < 16) {
      // the creek's bed and banks: wherever they lie lower than the ground, they are the ground
      const banks = _k[1] + Math.max(0, _k[0] - _k[2]) * _k[3] + 0.06 * (grain(x / 1.7, z / 1.7) - 0.5) * (1 - 0.7 * wet);
      // A soft minimum: the bank rounds into the ground. It rounds over `k` metres of height, and where the ground
      // is nearly level with the bank's top it lies as much as a quarter of that below both: in the wet ground,
      // whose floor is a hand above the water, the rounding is kept under a hand.
      const k = 0.6 - 0.44 * wet;
      if (banks < y + k) {
        const m = clamp01(0.5 + (y - banks) / (2 * k));
        y = lerp(y, banks, m) - k * m * (1 - m);
        touched = true;
      }
    }
    return touched ? y : h;
  }

  const heightAt = (x, z) => relief(x, z, base(x, z));

  // What kind of ground (x, z) is, for the layout and the paint.
  //   kind: 'terrace' (the old one) | 'hill' (ours, from the brink down) | 'bank' (the strip behind our bank's top)
  //       | 'bar' (cobbles on our side) | 'water' | 'farbar' | 'wall' (the far one, and ours up the valley)
  //   d: metres inside the old terrace's brink   from: metres from the water's edge (999 where it was not asked: on the old terrace)
  //   meadow, glade, wet: 0 to 1   creek: metres from the creek's bed   steep: 0 to 1 on the sides of the creek's ravine
  //   sodden: 0 to 1, in the old cedar's wet ground: 1 where the ground stands a hand above the creek's water or
  //   less, 0 from a foot and more above it. (`glade` is 1 over the whole of the wet ground's middle, the trail in it too.)
  const _z = { kind: 'terrace', d: 0, from: 0, wet: 0, meadow: 0, glade: 0, sodden: 0, creek: 99, water: 0, bar: 0, steep: 0, ours: true };
  function zone(x, z, out = _z) {
    const d = terrace(x, z);
    out.d = d; out.meadow = 0; out.glade = 0; out.sodden = 0; out.wet = 0; out.steep = 0; out.from = 999; out.water = 0; out.bar = 0; out.ours = true;
    creek(x, z, _k);
    out.creek = _k[0] - _k[2];
    if (d >= 0 && z >= OUR_WALL.from) {
      out.kind = 'terrace';
      out.glade = glade(x, z);
      // (heightAt asks the creek again, of this same spot, so what it leaves in _k is still this spot's)
      if (out.glade > 0) out.sodden = (1 - smooth(DRY, 0.36, heightAt(x, z) - (_k[1] + CREEK_DEEP))) * smooth(0, 0.4, out.glade);
      // the wet ground is dark all over, and darkest where it is sodden
      out.wet = Math.max(0.45 * out.glade, out.sodden);
    } else {
      river(x, z, _r);
      const from = _r[0], back = from - _r[3];
      out.from = from; out.water = _r[2]; out.bar = _r[3]; out.ours = _r[1];
      if (d >= 0) out.kind = ourWall(z, from) > 1.5 ? 'wall' : 'terrace';
      else if (from <= 0) out.kind = 'water';
      else if (!_r[1]) out.kind = back < FACE * 0.6 ? 'farbar' : 'wall';
      else if (back < FACE * 0.6) out.kind = 'bar';
      else if (ourWall(z, from) > 1.5) out.kind = 'wall';
      else out.kind = back < FACE + 9 ? 'bank' : 'hill';
      if (d < 0 && _r[1]) out.meadow = meadow(x, z);
    }
    if (out.creek < 2.5) out.wet = Math.max(out.wet, 1 - smooth(0.3, 2.5, out.creek));
    // the ravine's sides, where the creek has cut steeper than a floor will lie on
    if (_k[0] < 16 && _k[3] > 0.85 && out.creek > 0 && out.creek < 6 && d < 0) out.steep = smooth(0.85, 1.15, _k[3]) * (1 - smooth(3.2, 5.2, out.creek));
    return out;
  }

  // How open the air is where the walker stands: 0 among the old terrace's trees, 1 on the river's bank. The
  // mist thins with it and the sky's own light comes in (light/shared.js): under the trees a walker sees a
  // hundred metres, from the bank the length of the valley. It is 0 everywhere more than 18 m inside the
  // brink, which is every step of the stretch approved at checkpoint 1.
  const WOODS = 0.35, CLEARING = 0.9;                       // under the hill's trees; in the old clearing
  function open(x, z) {
    const d = terrace(x, z);
    if (d >= 18) return 0;
    let air = Math.max(WOODS, CLEARING * smooth(-14, 2, inMeadow(x, z)));
    if (d < 0) { river(x, z, _r); air = _r[1] ? Math.max(air, smooth(16, 5, _r[0])) : 1; }
    return (1 - smooth(-6, 18, d)) * air;
  }

  // What the ground is painted as at (x, z), for the ground's mesh: [cobbles and sand, grass, bare earth and
  // rock, wet], each 0..1. All four are 0 on the old terrace away from the creek and the cedar's wet ground,
  // and on the hill under its trees: there the floor is the forest floor.
  const _g = { kind: 'terrace', d: 0, from: 0, wet: 0, meadow: 0, glade: 0, sodden: 0, creek: 99, water: 0, bar: 0, steep: 0, ours: true };
  function paint(x, z, out = [0, 0, 0, 0]) {
    zone(x, z, _g);
    out[0] = out[1] = out[2] = 0;
    out[3] = _g.wet;
    if (_g.d >= 0) return out;
    out[0] = 1 - smooth(_g.bar - 0.4, _g.bar + FACE * 0.8, _g.from);            // the cobbles run out up the bank's face
    out[1] = Math.max(_g.meadow, _g.ours ? 0.75 * smooth(_g.bar + FACE + 7, _g.bar + FACE * 0.5, _g.from) : 0) * (1 - out[0]);      // grass in the clearing, and along our bank's top
    out[2] = _g.steep;
    return out;
  }

  return { heightAt, relief, zone, open, paint };
}

// For the map (forest.html?show=map) and for whatever draws the water.
export const SHAPE = { RIM, RIVER, KNOTS, CREEK, CREEK_DEEP, FALLS, MEADOW, BEND, HALF, WATER, FALL, BED, SHELF, BANK, riverAlong, creekAlong, upValley, REACH_FROM, REACH_TO };
