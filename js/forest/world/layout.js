import * as THREE from 'three';
import { WORLD, LEGACY, makeNoise } from './terrain.js';
import { CABIN, GLADE, VIEW, sightline, terrace, river, inMeadow } from './land.js';

// Where every plant stands. Deterministic for a seed.
//
// A record is 8 floats: x, y, z, yaw, scale, phase, tint, and how late the plant is (0 for all but the
// ferns off the old terrace and on its brink: see LATE).
export const RECORD = 8;

export function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// count is the number wanted at density 1. `far` bounds the distance to the trail's
// centre line; `spacing` keeps stems apart (trees share one grid).
//
// `body` is how far the plant reaches sideways at the walker's height, in metres at
// scale 1: a giant's flared foot, a pole's lowest boughs, a log's broken stubs, a
// fern's fronds. `clear` is the open space kept between that reach and the centre
// line, where the walker's eye travels: 1 m and more for anything that would fill the
// view or pass through the camera, less for the ground cover that edges the tread.
// A log is tested along its whole length (`half` is half of it), not at its root.
// `solid` is the radius, at scale 1, of what nothing else may stand in: a trunk's
// foot, a log, a stump. `rooted` kinds keep out of solids without being one.
// `high` is a tree's height in metres at scale 1, for where nothing tall may grow (buildLayout); the old
// layout does not read it.
export const KINDS = [
  { name: 'giant',    count: 300,   far: Infinity, spacing: 9,   scale: [0.85, 1.15], trees: true, body: 1.6,  clear: 1.3,  solid: 1.6,  high: 62 },
  { name: 'mature',   count: 900,   far: Infinity, spacing: 4,   scale: [0.7, 1.2],   trees: true, body: 0.55, clear: 1.7,  solid: 0.55, high: 44 },
  { name: 'pole',     count: 600,   far: 60,       spacing: 2.2, scale: [0.6, 1.25],  trees: true, body: 3.15, clear: 1.4,  solid: 0.15, high: 15 },
  { name: 'snag',     count: 45,    far: 70,       spacing: 4,   scale: [0.7, 1.2],   trees: true, body: 0.9,  clear: 1.6,  solid: 0.9,  high: 20 },
  { name: 'log',      count: 90,    far: 45,       spacing: 0,   scale: [0.6, 1.2],   body: 1.9,  clear: 1.0,  solid: 0.8, half: 8 },
  { name: 'stump',    count: 60,    far: 40,       spacing: 0,   scale: [0.7, 1.3],   body: 1.45, clear: 1.6,  solid: 1.3 },
  { name: 'sapling',  count: 800,   far: 40,       spacing: 1.1, scale: [0.5, 1.35],  trees: true, body: 1.4,  clear: 1.0,  rooted: true, high: 3.6 },
  { name: 'fern',     count: 6500,  far: 30,       spacing: 0,   scale: [0.55, 1.45], drift: 0.42, body: 1.0,  clear: 0.75, rooted: true },
  { name: 'sorrel',   count: 12000, far: 14,       spacing: 0,   scale: [0.7, 1.4],   body: 0.9,  clear: 0.6,  rooted: true },
  { name: 'seedling', count: 2500,  far: 22,       spacing: 0,   scale: [0.6, 1.5],   body: 0.3,  clear: 0.7,  rooted: true },
];
// What grows only off the old terrace. These are not in KINDS: the old layout draws its random numbers kind
// by kind, and a kind added to that list would move every plant that comes after it.
export const VALLEY_KINDS = [
  { name: 'spruce',   count: 1700,  far: Infinity, spacing: 6,   scale: [0.6, 1.15],  trees: true, body: 5.4,  clear: 0.8,  solid: 0.7,  high: 46 },
];
// What only a scene places, one at a time, each built for the spot it stands on (plants/cedar.js): never
// scattered, and not in KINDS either. `spacing` is no wider than a giant's: the search for a neighbour's stem
// reaches only as far as the widest spacing in KINDS.
// A kind that is `still` draws no random number when it is placed (its record's phase and tint are fixed): it
// was added after the valley was laid out, and a placement that drew from the shared stream would move every
// plant scattered after it. The footbridge is not: it is laid by the placement that laid the log it replaces,
// with the same fields given, and draws the two numbers that log drew.
export const HAND_KINDS = [
  { name: 'cedar',      scale: [1, 1], trees: true, spacing: 9, body: 4.4, clear: 1.0, solid: 3.6, high: 46 },
  { name: 'footbridge', scale: [1, 1], body: 0.6, clear: 0, solid: 0.5, half: 3.3 },                    // plants/footbridge.js: the walk crosses the creek on it
  { name: 'crag',       scale: [1, 1], body: 6, clear: 0, still: true },                                 // plants/crag.js: the rock of the falls
  // plants/maple.js: the bigleaf maples of the hall at the foot of the hill. `body` is its trunk and the knuckle
  // its limbs leave from: the limbs themselves go out over a walker's head. A placement gives its own phase and tint.
  { name: 'maple',      scale: [1, 1], trees: true, spacing: 8, body: 0.9, clear: 1.2, solid: 0.9, high: 24, still: true },
  // plants/deadwood.js: driftwood on the river's bars, a trunk with its root wad. `body` is the wad's reach.
  { name: 'drift',      scale: [1, 1], body: 1.2, clear: 0.5, solid: 0.42, half: 6, still: true },
  // plants/shelter.js: the trail shelter in the old clearing, and the stones it stands on: a kind for each of its
  // two materials, laid at one spot. Nothing rooted stands in the first; the second is no solid of its own.
  { name: 'shelter',    scale: [1, 1], body: 3.4, clear: 0, solid: 3.0, still: true },
  { name: 'footing',    scale: [1, 1], body: 3.4, clear: 0, still: true },
  // plants/cabin.js: the cabin, from outside: a kind for each of its three materials (its timbers, its roof,
  // its stone), laid at one spot. Nothing rooted stands in the first; the others are no solids of their own.
  { name: 'cabin',      scale: [1, 1], body: 3.3, clear: 0, solid: 3.3, still: true },
  { name: 'cabinroof',  scale: [1, 1], body: 3.3, clear: 0, still: true },
  { name: 'cabinstone', scale: [1, 1], body: 3.3, clear: 0, still: true },
  // plants/apple.js: the old apple tree of the clearing. `body` is its trunk: its limbs begin at a walker's chest
  // and go out over his head. A placement gives its own yaw, phase and tint.
  { name: 'apple',      scale: [1, 1], trees: true, spacing: 4, body: 0.5, clear: 1.2, solid: 0.38, high: 6.6, still: true },
];
// What covers open ground whole: grass in the old clearing and along the river's banks, cobbles and boulders
// on its bars. A scatter leaves bare patches and heaps by chance, so these are laid on a grid, `every` metres
// apart, each one shifted at random within its own square, wherever COVERS says the ground is theirs. `far` is
// how far from the trail they are laid at all: beyond it they would never be drawn. They are laid in this
// order, and a boulder is a solid: no cobble lies inside one.
export const CARPETS = [
  { name: 'grass',  every: 0.7,  far: 64, scale: [0.9, 1.25],  body: 0.6,  clear: 0.45, rooted: true },
  { name: 'rock',   every: 3.1,  far: 80, scale: [0.6, 1.5],   body: 0.5,  clear: 0.7,  solid: 0.38 },
  { name: 'cobble', every: 0.55, far: 44, scale: [0.8, 1.3],   body: 0.5,  clear: -0.1 },          // a walker treads between cobbles: they lie up to the tread's middle, not on it
];
// What grows only in the old cedar's wet ground: skunk cabbage. It is laid like a carpet, on a grid `every`
// metres apart with each plant shifted within its own square, wherever the ground is sodden (land.zone: how
// little it stands above the creek's water), the thicker and the bigger the wetter. It is laid after
// everything else and from random numbers of its own, so that no other plant in the forest moves for it.
export const WET_KINDS = [
  { name: 'skunk', every: 1.2, scale: [0.6, 1.3], body: 0.8, clear: 0.45, rooted: true },
];
// What grows only under the maples and round them: vine maple (plants/maple.js). It is laid as skunk cabbage is,
// on a grid `every` metres apart with each plant shifted within its own square, wherever a maple stands within
// `far` metres, the thicker the nearer one; after everything else and from random numbers of its own, so
// that no other plant in the forest moves for it. `body` is how far its stems stand out at a walker's height:
// above that they arch over, and may go over the tread. It stands 4.5 to 7.5 m tall (the sources an agent read
// give 5 to 8 m for the usual plant, up to 7 m, and 6 to 12 m; it was first laid at 3.5 to 6.25 m, from memory).
export const HALL_KINDS = [
  { name: 'vine', every: 5.2, far: 16, scale: [0.9, 1.5], body: 1.3, clear: 2.1, rooted: true, high: 5 },
];
// What grows along the river (plants/alder.js): red alder on its banks and at the foot of the valley's walls, in
// the strip behind the cobbles, and willow on the backs of its bars and the banks' faces. Each is laid on a grid
// of its own, `every` metres apart with each plant shifted within its own square, from random numbers of its own:
// the shared stream is drawn as it always was. The alders are laid in the middle of the scatter, after its
// Douglas-firs and hemlocks and before its other kinds (laid before all of it, old growth gave way to them):
// they are trees, and what is scattered afterwards grows round them as it does round any trunk. (Laid
// last, ferns and saplings would stand inside them: ground cover is no solid, and is not looked for.) The
// willows are laid last of all, as skunk cabbage and vine maple are. `band` is where an alder stands, in metres
// behind the cobbles: none nearer than the first number, as thick as they grow between the second and the
// third, none beyond the fourth. An alder's `body` is its trunk: its crown begins over a walker's head.
// A scene may place a willow by hand as well (the back of the beach: scenes/walk.js). It is `still`: such a
// placement gives its own yaw, phase and tint, and draws no random number.
export const RIVER_KINDS = [
  { name: 'alder',  every: 2.7, scale: [0.72, 1.12], trees: true, spacing: 2.3, body: 0.35, clear: 1.5, solid: 0.22, high: 25, band: [0.8, 2.2, 9.5, 15], crown: 1.5 },
  { name: 'willow', every: 2.4, scale: [0.42, 1.12], body: 2.0, clear: 0.9, rooted: true, high: 5, apart: 1.7, still: true },
  // More of the valley's conifers on its walls (plants/spire.js), where the walk comes near them. The scatter's
  // `spruce` was laid for the tree that stood in for them, which from 75 m was drawn at nearly twice its own
  // crown's width (its far boughs were 1.9 times as long as its limbs; from 26 m its boughs were 1.7 times
  // their own size): a stand that was closed for that tree
  // is thin for trees drawn at their own width, and from the beach the far wall was a few conifers on a hill.
  // These are laid last of all, on a grid and from random numbers of their own, where nothing stands yet, so
  // that nothing laid before them moves; which of the two conifers each is, is settled as for the scatter's
  // (index.js). `band`: none nearer the cobbles than this, in metres (the alders' ground). `within`: as thick
  // as they will stand out to the first distance from the walk, none beyond the second (up the valley and
  // high on the walls the scatter's own trees read as a closed wood already). `crown` is how far a spruce's
  // lowest limbs reach: none hangs into the strip the cabin's window looks along.
  { name: 'slopes', every: 4.6, scale: [0.6, 1.15], trees: true, spacing: 3.4, body: 5.4, clear: 0.8, solid: 0.7, high: 46, crown: 7.7, band: 8, within: [90, 170] },
];
// The understory (plants/shrubs.js): what grows between the ferns and the trees. Each kind is laid last of all, on
// a grid of its own `every` metres apart with each plant shifted within its own square, from random numbers of
// its own (the forest's seed and the kind's `seed`), wherever UNDER says the ground is its own: so nothing laid
// before it moves. `far` is how far from the walk it is laid at all. `gone` is how far off a plant of the kind
// is still drawn (its builder's own number: the page stops if the two differ), which is what keeps it out of
// the frames approved at checkpoint 1 (`approved`, in buildLayout). `high` is how tall it stands at scale 1,
// for the strip the cabin's window looks along.
// `more: true`: no kind of its own, but more of a kind there already is, added after the last of that kind's
// records: sword ferns on the river's banks and the far wall's foot, beyond the 30 m of the walk that the
// scatter keeps to (from the beach the far bank was a mound of bare painted floor under the alders).
export const UNDER_KINDS = [
  { name: 'salmon',   every: 2.3,  far: 96, scale: [0.6, 1.2],   body: 1.25, clear: 1.0, rooted: true, high: 2.7, gone: 125, seed: 180001 },
  { name: 'elder',    every: 4.2,  far: 60, scale: [0.7, 1.25],  body: 1.7,  clear: 1.3, rooted: true, high: 3.9, gone: 150, seed: 180007 },
  { name: 'club',     every: 1.8,  far: 40, scale: [0.65, 1.2],  body: 0.9,  clear: 0.9, rooted: true, high: 1.7, gone: 85,  seed: 180013 },
  { name: 'ladyfern', every: 1.5,  far: 34, scale: [0.6, 1.3],   body: 0.9,  clear: 0.7, rooted: true, high: 1.1, gone: 64,  seed: 180017 },
  { name: 'bracken',  every: 1.25, far: 46, scale: [0.7, 1.3],   body: 0.75, clear: 0.6, rooted: true, high: 1.0, gone: 70,  seed: 180023 },
  { name: 'fern',     every: 1.9,  far: 84, scale: [0.55, 1.45], body: 1.0,  clear: 0.75, rooted: true, high: 1.1, gone: 75, seed: 180029, more: true },
  // The flowers of the forest floor (plants/flowers.js). `variants`: how many plants the kind's sheet has side by
  // side, of which a plant shows the one its tint says: UNDER says which (it sets UNDER.pick), from the ground,
  // and may say that it is laid larger than its kind is (UNDER.grow).
  { name: 'carpet',   every: 1.15, far: 13, scale: [0.75, 1.3],  body: 0.5,  clear: 0.5,  rooted: true, high: 0.35, gone: 38, seed: 180041, variants: 4 },
  { name: 'trillium', every: 1.9,  far: 10, scale: [1.0, 1.4],   body: 0.3,  clear: 0.5,  rooted: true, high: 0.32, gone: 34, seed: 180043, variants: 2 },
];
// How much of the ground at a spot each of them takes, 0 to 1, from what land.zone says of it; `back` is metres
// behind the cobbles (a bank's face begins at 0), `patch` a slow noise of the kind's own (0 to 1), `near` metres
// from the walk, `rim` metres inside the old clearing's outline (negative outside it: the trees' edge). Elk keep
// the old terrace's floor open: there the shrubs are beside the creek and in the old cedar's wet ground, and
// nowhere else.
const UNDER = {
  // thickets under the alders of both banks and at the far wall's foot; along the creek below the falls and in
  // its gully above them; round the wet ground; and at the old clearing's edge
  salmon: (z, back, patch, near, rim) => {
    const thicket = smooth(0.36, 0.6, patch);
    const flats = z.kind === 'terrace' ? 0 : smooth(0.8, 2.6, back) * (1 - smooth(11, 17, back)) * 0.8;
    const stream = (1 - smooth(3.6, 7, z.creek)) * smooth(1.0, 1.8, z.creek) * 0.75;
    const wet = smooth(0.08, 0.45, z.glade) * (1 - smooth(0.25, 0.6, z.sodden)) * 0.4;
    const edge = z.kind === 'terrace' ? 0 : smooth(-4, -2.4, rim) * (1 - smooth(-1, 0, rim)) * 0.6;
    return rim > 0 ? 0 : Math.max(flats, stream, wet, edge) * thicket;
  },
  // at the old clearing's edge, among the first trees; on the banks behind the alders' first rank; along the creek's swale
  elder: (z, back, patch, near, rim) => {
    if (z.kind === 'terrace') return 0;
    const edge = smooth(-6, -4, rim) * (1 - smooth(-1.6, -0.4, rim)) * 0.9;
    const flats = smooth(4, 7, back) * (1 - smooth(13, 18, back)) * 0.45;
    const stream = (1 - smooth(6, 10, z.creek)) * smooth(2.6, 4, z.creek) * 0.5;
    return rim > -0.4 ? 0 : Math.max(edge, flats, stream) * smooth(0.25, 0.5, patch);
  },
  // in the wet ground, where it is not sodden; and close beside the creek, above the falls and below them
  club: (z, back, patch) => {
    if (z.meadow > 0.05 || (z.kind !== 'terrace' && z.kind !== 'hill')) return 0;
    const wet = smooth(0.1, 0.35, z.sodden) * (1 - smooth(0.6, 0.9, z.sodden)) * 0.5 + smooth(0.3, 0.8, z.glade) * 0.12;
    const stream = (1 - smooth(2.2, 4.6, z.creek)) * smooth(0.5, 1.0, z.creek) * 0.6;
    return Math.max(wet, stream) * smooth(0.3, 0.62, patch);
  },
  // wherever the ground is wet: the wet ground, the creek's sides, the foot of a bank's face
  ladyfern: (z, back, patch) => {
    const wet = smooth(0.05, 0.4, z.sodden) * 0.5;
    const stream = (1 - smooth(1.8, 3.8, z.creek)) * smooth(0.35, 0.7, z.creek) * 0.7;
    const face = z.kind === 'terrace' ? 0 : smooth(-0.6, 0.4, back) * (1 - smooth(1.8, 3.4, back)) * 0.35;
    return z.meadow > 0.3 && z.creek > 3 ? 0 : Math.max(wet, stream, face) * (0.45 + 0.55 * patch);
  },
  // in the old clearing, in drifts, thickest towards its edges
  bracken: (z, back, patch, near, rim) => (z.kind === 'bar' || z.kind === 'farbar' ? 0 : smooth(-0.6, 1.2, rim) * smooth(0.4, 0.58, patch) * (0.5 + 0.45 * (1 - smooth(3, 9, rim)))),
  // A carpet is one of four (`pick`: the column of its sheet). In the old clearing's turf, daisies, thickest
  // beside the tread. On moist ground (beside the creek, round the old cedar's wet ground where it is not sodden,
  // at the foot of a bank's face) most are the small flowers of such ground or bleeding heart, by the plant's own
  // number (`lot`). Everywhere else under trees, false lily-of-the-valley, in drifts.
  carpet: (z, back, patch, near, rim, lot) => {
    if (z.kind === 'bar' || z.kind === 'farbar') return 0;
    // (in the grass they are not seen: they are in the trodden turf at the tread's edge, and a few a little further out)
    if (rim > 0.6) { UNDER.pick = 3; return 0.12 * smooth(0.3, 0.52, patch) * (1 - smooth(3, 6, near)) + 0.75 * (1 - smooth(1.25, 1.8, near)) * smooth(0.2, 0.4, patch); }
    const stream = (1 - smooth(1.6, 4.4, z.creek)) * smooth(0.35, 0.8, z.creek);
    const face = z.kind === 'terrace' ? 0 : smooth(-0.5, 0.8, back) * (1 - smooth(3, 7, back)) * 0.7;
    const moist = Math.max(stream, smooth(0.15, 0.55, z.glade) * 0.7, face) * (1 - smooth(0.5, 0.8, z.sodden));
    // (bleeding heart stands knee high, where the others are a hand tall: its patch is laid half as large again)
    if (moist > 0.2 && lot < 0.7) { UNDER.pick = lot < 0.4 ? 1 : 2; UNDER.grow = lot < 0.4 ? 1.15 : 1.5; return moist * (0.4 + 0.5 * patch); }
    UNDER.pick = 0;
    return smooth(0.44, 0.62, patch) * (z.kind === 'terrace' ? 0.45 : 0.7) * (1 - smooth(0.5, 0.8, z.sodden));
  },
  // trillium, under trees everywhere, in loose drifts: two in five still white, the rest aged pink
  trillium: (z, back, patch, near, rim, lot) => {
    if (rim > -1 || z.kind === 'bar' || z.kind === 'farbar' || z.sodden > 0.6) return 0;
    UNDER.pick = lot < 0.4 ? 0 : 1;
    return smooth(0.5, 0.7, patch) * 0.5;
  },
  // on the banks and the far wall's foot, beyond the scatter's reach
  fern: (z, back, patch, near) => (z.kind === 'terrace' || z.kind === 'hill' || z.meadow > 0.1 ? 0 : smooth(26, 31, near) * smooth(1.2, 3, back) * (1 - smooth(22, 34, back)) * (0.25 + 0.5 * patch)),
};
// What stood in for the riverside's own plants, now that those are there: hemlock poles and saplings on the bank
// where the alders are. Each is a share of how the kind grew there, and is asked of the number a plant has
// already drawn for its chance: GROWS itself is left alone, since the most a kind grows anywhere sets how many
// tries the scatter makes, and with that every random number after it.
// (And the mossy logs of the forest floor that stood in for drift on the cobbles: there are none now.)
const EASED = { pole: { bank: 0.3 }, sapling: { bank: 0.5 }, log: { bar: 0, farbar: 0 } };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// How much of the ground at a spot a carpet takes, 0 to 1, from what land.zone says of it.
const COVERS = {
  // thick in the clearing and thinning under the trees round it; along the top of either bank; a few tufts
  // among the highest of the cobbles
  grass: (z) => {
    if (z.kind === 'terrace' || z.kind === 'water' || z.creek < 0.3) return 0;
    const back = z.from - z.bar;                                // metres behind the cobbles
    const bank = back > 0.4 ? (z.ours ? 0.85 : 0.7) * (1 - smooth(1.75, z.ours ? 10.5 : 8, back)) : back > -1.2 ? 0.35 : 0;
    return Math.max(smooth(0.05, 0.6, z.meadow), bank);
  },
  // Stones lie on the bars, thinning out up the bank's face where the grass begins, out into the shallows,
  // and along the creek's bed below the falls; boulders among them, and standing out of the river's edge.
  cobble: (z) => {
    if (z.d >= 0) return 0;
    const bar = z.from > -1.4 ? 0.95 * (1 - smooth(z.bar - 0.6, z.bar + 2.2, z.from)) * smooth(-1.4, -0.3, z.from) : 0;
    return Math.max(bar, z.creek < 0.9 && z.creek > -1.2 ? 0.8 : 0);
  },
  rock: (z) => {
    if (z.d >= 0) return 0;
    const bar = z.from > -4.5 && z.from < z.bar + 0.8 ? (z.from < 0 ? 0.3 : 0.45) : 0;
    return Math.max(bar, z.creek < 0.7 && z.creek > -1.0 ? 0.6 : 0);
  },
};
const WIDEST = Math.max(...KINDS.map((k) => k.spacing));
const GAP = 0.25;                                 // metres left between two solids

// How close to the trail a plant of this kind and scale may stand.
export const reachOf = (kind, scale) => kind.body * scale + kind.clear;

// scenes: [{ name, placements: [{ kind, s, side, yaw?, turn?, scale?, along?, lift?, close?, cluster?, spread? }], clear: [{ from, to, within, kinds }] }]
// A placement stands `side` metres to the walker's right (+) or left (-) of the
// trail at `s` metres along it. `turn` is a yaw relative to the trail's heading
// (positive swings the far end towards the walker's left). `along` then slides it
// that many metres along its own x axis and `lift` raises it above the ground at
// the unslid spot: for what grows on a log, given the log's own s, side and turn.
// `cluster: n` plants a knot of up to n within `spread` metres of the spot, each
// one wherever the rules below allow (`scale` is then [smallest, largest]); list a
// knot after the trunks and logs it has to keep out of. A clear zone keeps the
// scatter of the named kinds out of a stretch, so a composed scene is not crowded
// by chance.
//
// Placements answer to the same rules as the scatter. One that stands nearer the
// trail than its reach allows, or inside another solid, is still placed, with a
// console warning that names it (the capture tools fail on warnings); `close: true`
// says the nearness is meant. forest.html?show=map draws the result from above.
//
// This is the layout of the old terrace as it was at checkpoint 2, along the old loop and within the old
// world's bounds. It is one stream of random numbers from first plant to last, so a rule changed, a bound
// moved or a metre of trail added would move every plant after it. It is therefore run as it was, and
// buildLayout below takes from it what still has ground to stand on.
function oldLayout({ trail, heightAt, seed = 1, density = 1, scenes = [], bounds = LEGACY }) {
  const rng = mulberry32(seed), drift = makeNoise(seed + 77);
  const occupied = new Map();                    // 4 m grid of tree stems
  const key = (x, z) => `${Math.floor(x / 4)},${Math.floor(z / 4)}`;
  const tooClose = (x, z, spacing) => {
    const r = Math.ceil((spacing + WIDEST) / 2 / 4);        // far enough to meet the widest-spaced neighbour
    const cx = Math.floor(x / 4), cz = Math.floor(z / 4);
    for (let i = -r; i <= r; i += 1) {
      for (let j = -r; j <= r; j += 1) {
        const cell = occupied.get(`${cx + i},${cz + j}`);
        if (!cell) continue;
        for (let k = 0; k < cell.length; k += 3) {
          if (Math.hypot(cell[k] - x, cell[k + 1] - z) < (spacing + cell[k + 2]) / 2) return true;
        }
      }
    }
    return false;
  };

  const position = new THREE.Vector3(), tangent = new THREE.Vector3();
  const kindOf = Object.fromEntries(KINDS.map((k) => [k.name, k]));
  const occupy = (x, z, spacing) => {
    const k = key(x, z);
    if (!occupied.has(k)) occupied.set(k, []);
    occupied.get(k).push(x, z, spacing);
  };

  // What cannot be grown through: circles (x, z, radius) on the same 4 m grid.
  const solids = new Map();
  let widest = 0;                                 // the largest solid so far: how far away a neighbour's centre can be and still touch
  const blocked = (x, z, radius) => {
    const r = Math.ceil((radius + widest + GAP) / 4);
    const cx = Math.floor(x / 4), cz = Math.floor(z / 4);
    for (let i = -r; i <= r; i += 1) {
      for (let j = -r; j <= r; j += 1) {
        const cell = solids.get(`${cx + i},${cz + j}`);
        if (!cell) continue;
        for (let k = 0; k < cell.length; k += 3) {
          if (Math.hypot(cell[k] - x, cell[k + 1] - z) < radius + cell[k + 2] + GAP) return true;
        }
      }
    }
    return false;
  };
  const block = (x, z, radius) => {
    const k = key(x, z);
    if (!solids.has(k)) solids.set(k, []);
    solids.get(k).push(x, z, radius);
    widest = Math.max(widest, radius);
  };
  // The ground a plant stands on: one point, or for a lying log a row of them
  // along its length (a yaw about +y carries local +x to (cos, 0, -sin)).
  const footprint = (kind, x, z, yaw, scale) => {
    if (!kind.half) return [x, z];
    const half = kind.half * scale, n = Math.ceil((2 * half) / (kind.solid * scale)) + 1, points = [];
    for (let i = 0; i < n; i += 1) {
      const t = -half + (2 * half * i) / (n - 1);
      points.push(x + Math.cos(yaw) * t, z - Math.sin(yaw) * t);
    }
    return points;
  };
  const nearest = (points) => {
    let d = Infinity;
    for (let i = 0; i < points.length; i += 2) d = Math.min(d, trail.distance(points[i], points[i + 1]));
    return d;
  };
  const inSolid = (kind, points, scale) => {
    const radius = (kind.solid || 0.1) * scale;
    for (let i = 0; i < points.length; i += 2) if (blocked(points[i], points[i + 1], radius)) return true;
    return false;
  };
  const makeSolid = (kind, points, scale) => {
    if (!kind.solid) return;
    for (let i = 0; i < points.length; i += 2) block(points[i], points[i + 1], kind.solid * scale);
  };

  const cleared = (kind, x, z) => {
    for (const scene of scenes) {
      for (const zone of scene.clear || []) {
        if (!zone.kinds.includes(kind)) continue;
        const [d, s] = trail.locate(x, z);
        if (d < zone.within && s >= zone.from && s <= zone.to) return true;
      }
    }
    return false;
  };

  // composed placements first, so the scatter grows round them
  const placed = {};
  for (const scene of scenes) {
    for (const p of scene.placements || []) {
      const kind = kindOf[p.kind], scale = p.scale || 1;
      trail.sample(p.s, position, tangent);
      let x = position.x - tangent.z * p.side, z = position.z + tangent.x * p.side;
      if (p.cluster) {
        const [lo, hi] = Array.isArray(p.scale) ? p.scale : kind.scale, list = (placed[p.kind] = placed[p.kind] || []);
        let grown = 0;
        for (let i = 0; i < p.cluster; i += 1) {
          for (let tries = 0; tries < 40; tries += 1) {
            const a = rng() * Math.PI * 2, d = (p.spread || 2.5) * Math.sqrt(rng()), each = lo + rng() * (hi - lo);
            const cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d;
            if (trail.distance(cx, cz) < reachOf(kind, each) || inSolid(kind, [cx, cz], each)) continue;
            if (kind.trees && tooClose(cx, cz, kind.spacing)) continue;
            list.push(cx, heightAt(cx, cz), cz, rng() * Math.PI * 2, each, rng() * 6.283, rng(), 0);
            if (kind.trees) occupy(cx, cz, kind.spacing);
            makeSolid(kind, [cx, cz], each);
            grown += 1;
            break;
          }
        }
        if (!grown) console.warn(`[forest layout] ${scene.name || 'scene'}: no room for the ${p.kind} knot at s=${p.s}, side=${p.side}`);
        continue;
      }
      let yaw = p.turn !== undefined ? Math.atan2(-tangent.z, tangent.x) + p.turn : (p.yaw !== undefined ? p.yaw : rng() * Math.PI * 2);
      const y = heightAt(x, z) + (p.lift || 0);
      if (p.along !== undefined) {
        x += Math.cos(yaw) * p.along; z -= Math.sin(yaw) * p.along;
        yaw = rng() * Math.PI * 2;
      }
      (placed[p.kind] = placed[p.kind] || []).push(x, y, z, yaw, scale, rng() * 6.283, rng(), 0);
      if (kind.trees) occupy(x, z, kind.spacing);
      if (p.lift !== undefined) continue;          // it grows on a log: the rules below are for what stands on the ground
      const points = footprint(kind, x, z, yaw, scale), where = `${scene.name || 'scene'}: ${p.kind} at s=${p.s}, side=${p.side}`;
      const got = nearest(points), need = reachOf(kind, scale);
      if (got < need - 0.01 && !p.close) console.warn(`[forest layout] ${where} comes within ${got.toFixed(2)} m of the trail; its reach needs ${need.toFixed(2)} m`);
      if ((kind.solid || kind.rooted) && inSolid(kind, points, scale)) console.warn(`[forest layout] ${where} stands inside another trunk, log or stump`);
      makeSolid(kind, points, scale);
    }
  }

  const out = {};
  for (const kind of KINDS) {
    const fixed = placed[kind.name] || [];
    const want = Math.round(kind.count * density);
    const data = new Float32Array(want * RECORD + fixed.length);
    data.set(fixed, 0);
    let n = fixed.length / RECORD;
    const total = want + n, nearest0 = reachOf(kind, kind.scale[0]);
    for (let tries = 0; n < total && tries < want * 40; tries += 1) {
      const yaw = rng() * Math.PI * 2, scale = kind.scale[0] + rng() * (kind.scale[1] - kind.scale[0]);
      let x, z;
      if (kind.far === Infinity) {
        x = bounds.minX + rng() * (bounds.maxX - bounds.minX);
        z = bounds.minZ + rng() * (bounds.maxZ - bounds.minZ);
      } else {
        trail.sample(rng() * trail.length, position, tangent);
        // thicker beside the trail, thinning with distance from it
        const side = (rng() < 0.5 ? -1 : 1) * (nearest0 + (kind.far - nearest0) * Math.pow(rng(), 1.7));
        x = position.x - tangent.z * side; z = position.z + tangent.x * side;
      }
      if (trail.distance(x, z) > kind.far) continue;
      const points = footprint(kind, x, z, yaw, scale);
      if (nearest(points) < reachOf(kind, scale)) continue;                   // the whole of it keeps off the trail
      if (kind.drift && drift(x / 9, z / 9) < kind.drift) continue;          // grows in drifts, with open floor between
      if (cleared(kind.name, x, z)) continue;
      if (kind.trees && tooClose(x, z, kind.spacing)) continue;
      if ((kind.solid || kind.rooted) && inSolid(kind, points, scale)) continue;
      if (kind.trees) occupy(x, z, kind.spacing);
      makeSolid(kind, points, scale);
      const o = n * RECORD;
      data[o] = x; data[o + 1] = heightAt(x, z); data[o + 2] = z;
      data[o + 3] = yaw;
      data[o + 4] = scale;
      data[o + 5] = rng() * 6.283;
      data[o + 6] = rng();
      n += 1;
    }
    out[kind.name] = data.subarray(0, n * RECORD);
  }
  // how many records of each kind were placed by hand: they come first in its array
  out.composed = Object.fromEntries(Object.entries(placed).map(([name, list]) => [name, list.length / RECORD]));
  return out;
}

// ---- the valley, and the rest of the walk ---------------------------------------------------------

// How thickly each kind grows on each kind of ground (land.js), as a share of how it grows on the old
// terrace. The old terrace's forest comes down the hill to the bank; `spruce` is where the valley's own
// conifers stand (plants/spire.js: Sitka spruce by the river and on the hill, western hemlock up the walls;
// which a tree is, is settled in index.js from where it stands). The walls hold those and nothing else of
// the layout's big trees: they are the ones still drawn whole from the length of the river's reach away.
// (These numbers were set when hemlock poles and saplings stood in for the bank's alders and willows, an
// edge-grown spruce for the walls' trees and logs for drift on the cobbles; they are left as they were, since
// the most a kind grows anywhere sets how many tries the scatter makes: see EASED and RIVER_KINDS for what
// has been laid since.)
const GROWS = {
  giant:    { terrace: 1, hill: 0.8,  bank: 0,    bar: 0,    wall: 0,   farbar: 0 },
  mature:   { terrace: 1, hill: 0.9,  bank: 0.4,  bar: 0,    wall: 0,   farbar: 0 },
  spruce:   { terrace: 0, hill: 0.5,  bank: 1.3,  bar: 0,    wall: 1.5, farbar: 0 },
  pole:     { terrace: 1, hill: 1.0,  bank: 1.6,  bar: 0.04, wall: 0.8, farbar: 0.08 },
  snag:     { terrace: 1, hill: 0.8,  bank: 0.4,  bar: 0,    wall: 0,   farbar: 0 },
  log:      { terrace: 1, hill: 1.0,  bank: 0.8,  bar: 0.9,  wall: 0,   farbar: 0.6 },
  stump:    { terrace: 1, hill: 0.8,  bank: 0.2,  bar: 0,    wall: 0,   farbar: 0 },
  sapling:  { terrace: 1, hill: 1.2,  bank: 2.2,  bar: 0.1,  wall: 1.0, farbar: 0.15 },
  fern:     { terrace: 1, hill: 1.3,  bank: 1.6,  bar: 0,    wall: 1.0, farbar: 0 },
  sorrel:   { terrace: 1, hill: 1.0,  bank: 0.8,  bar: 0,    wall: 0,   farbar: 0 },
  seedling: { terrace: 1, hill: 0.8,  bank: 0.8,  bar: 0,    wall: 0,   farbar: 0 },
};
// How many times longer again than on the old terrace the stretch is over which a fern turns into its far
// level (world/instancer.js). On a slope the walker faces, and at the old terrace's brink above it, a stand of
// ferns shows every frond's change; in the open they stand in the sun against ground in shade.
const LATE = { fern: { brink: 1, hill: 0.5, bank: 0.5, bar: 0.5, wall: 0.5 } }, BRINK = 6;
const LOW = 4.5;                     // metres: taller than this, a tree does not grow where the cabin's window looks
const CARPET = { minX: -116, maxX: -2, minZ: -150, maxZ: 0 };          // the ground the carpets are looked for on: the hill, the river below it and the far bank
const BAND = 80, EAST = 96;          // new trees on the old terrace stand within this far of its brink, and west of this x: see buildLayout

// The same rules the old layout keeps (spacing between stems, solids nothing stands in, reach from the
// trail), on grids of their own, so that what is added answers to what was kept.
function createRules(trail) {
  const occupied = new Map(), solids = new Map();
  let widest = 0;
  const key = (x, z) => `${Math.floor(x / 4)},${Math.floor(z / 4)}`;
  const push = (map, x, z, v) => { const k = key(x, z); if (!map.has(k)) map.set(k, []); map.get(k).push(x, z, v); };
  const hit = (map, x, z, reach, test) => {
    const r = Math.ceil(reach / 4), cx = Math.floor(x / 4), cz = Math.floor(z / 4);
    for (let i = -r; i <= r; i += 1) for (let j = -r; j <= r; j += 1) {
      const cell = map.get(`${cx + i},${cz + j}`);
      if (!cell) continue;
      for (let k = 0; k < cell.length; k += 3) if (test(Math.hypot(cell[k] - x, cell[k + 1] - z), cell[k + 2])) return true;
    }
    return false;
  };
  const footprint = (kind, x, z, yaw, scale) => {
    if (!kind.half) return [x, z];
    const half = kind.half * scale, n = Math.ceil((2 * half) / (kind.solid * scale)) + 1, points = [];
    for (let i = 0; i < n; i += 1) { const t = -half + (2 * half * i) / (n - 1); points.push(x + Math.cos(yaw) * t, z - Math.sin(yaw) * t); }
    return points;
  };
  return {
    footprint,
    tooClose: (x, z, spacing) => hit(occupied, x, z, (spacing + WIDEST) / 2, (d, other) => d < (spacing + other) / 2),
    occupy: (x, z, spacing) => push(occupied, x, z, spacing),
    inSolid: (kind, points, scale) => {
      const radius = (kind.solid || 0.1) * scale;
      for (let i = 0; i < points.length; i += 2) if (hit(solids, points[i], points[i + 1], radius + widest + GAP, (d, other) => d < radius + other + GAP)) return true;
      return false;
    },
    makeSolid: (kind, points, scale) => {
      if (!kind.solid) return;
      for (let i = 0; i < points.length; i += 2) push(solids, points[i], points[i + 1], kind.solid * scale);
      widest = Math.max(widest, kind.solid * scale);
    },
    nearest: (points) => { let d = Infinity; for (let i = 0; i < points.length; i += 2) d = Math.min(d, trail.distance(points[i], points[i + 1])); return d; },
  };
}

// buildLayout: the old terrace's plants that still have ground under them, the plants a scene of the walk
// places by hand, and a scatter over the valley and along the rest of the walk.
//
// scenes: those marked `walk: true` are composed along the walk (their s is metres along the new trail, or
// the name of a place on it: trail.at); a placement may also give `x` and `z` outright. The others are
// the old terrace's, composed along the old loop.
// It is built in steps, each pass ending with a yield (js/forest/index.js builds the forest a few milliseconds at a
// time in the cabin's page, between the room's frames); buildLayout is the whole of it at once, as it always was.
// The steps change nothing of what is laid or in what order: every random number is drawn as it was.
export function buildLayout(options) {
  const steps = buildLayoutSteps(options);
  for (;;) { const { done, value } = steps.next(); if (done) return value; }
}
export function* buildLayoutSteps({ trail, oldTrail, terrain, seed = 1, density = 1, scenes = [] }) {
  const { heightAt, base, land } = terrain;
  const _p = new THREE.Vector3(), _t = new THREE.Vector3();
  const was = oldLayout({ trail: oldTrail, heightAt: base, seed, density, scenes: scenes.filter((s) => !s.walk) });
  const walk = scenes.filter((s) => s.walk);
  const ALL = [...KINDS.slice(0, 2), ...VALLEY_KINDS, ...KINDS.slice(2)];          // the big trees first: what is smaller grows round them
  const rules = createRules(trail), kindOf = Object.fromEntries([...ALL, ...HAND_KINDS, ...RIVER_KINDS].map((k) => [k.name, k]));
  // Where a thing drawn out to `far` metres could show in a frame approved at checkpoint 1 (the old terrace's
  // scenes list their views): on the stretch of the walk such a scene is composed along, or in front of one of
  // its viewpoints and near enough to be drawn. (A view is 80 degrees wide at the size the frames are compared
  // at: anything within 68 degrees of the way it looks counts as in front.) Nothing added since the approval may
  // stand there: tools/forest_same.mjs compares those frames pixel for pixel.
  const sacred = scenes.filter((s) => !s.walk).map((s) => ({ from: s.from, to: s.to, views: (s.views || []).map(([at, yaw]) => {
    trail.sample(at, _p, _t);
    const heading = Math.atan2(-_t.z, _t.x) + (yaw * Math.PI) / 180;
    return [_p.x, _p.z, Math.cos(heading), -Math.sin(heading)];
  }) }));
  const approved = (x, z, far) => {
    const [d, s] = trail.locate(x, z);
    for (const scene of sacred) {
      if (d < 22 && s > scene.from - 6 && s < scene.to + 6) return true;
      for (const [vx, vz, lx, lz] of scene.views) {
        const dx = x - vx, dz = z - vz, away = Math.hypot(dx, dz);
        if (away < far + 8 && (away < 3 || (dx * lx + dz * lz) / away > 0.375)) return true;
      }
    }
    return false;
  };
  const rng = mulberry32(seed + 7919), drift = makeNoise(seed + 77);
  const position = new THREE.Vector3(), tangent = new THREE.Vector3();
  // 'cedar+6': six metres on from the place called cedar (trail.at). A name the trail does not know is a mistake.
  const place = (s) => {
    if (typeof s !== 'string') return s;
    const [name, more] = s.split(/([+-].*)/), at = trail.at[name] + Number(more || 0);
    if (!Number.isFinite(at)) throw new Error(`the walk has no place "${s}": its places are ${Object.keys(trail.at).join(', ')}`);
    return at;
  };
  const zone = { kind: 'terrace', d: 0, from: 0, wet: 0, meadow: 0, glade: 0, sodden: 0, creek: 99, water: 0 };

  // a clear zone round a spot beside the trail ({ s, side, within }) is a zone round that spot's x and z
  const zones = walk.flatMap((scene) => (scene.clear || []).map((area) => {
    if (area.s === undefined) return area;
    trail.sample(place(area.s), position, tangent);
    return { ...area, x: position.x - tangent.z * area.side, z: position.z + tangent.x * area.side };
  }));
  for (const area of zones) if (area.x === undefined) { area.fromAt = place(area.from); area.toAt = place(area.to); }
  const cleared = (kind, x, z) => {
    let d = -1, s = 0;
    for (const area of zones) {
      if (!area.kinds.includes(kind)) continue;
      if (area.x !== undefined) { if (Math.hypot(x - area.x, z - area.z) < area.within) return true; continue; }
      if (d < 0) [d, s] = trail.locate(x, z);
      if (d < area.within && s >= area.fromAt && s <= area.toAt) return true;
    }
    return false;
  };
  // The cabin, and the ground between its window and the brink, where only what a scene places may stand.
  const yard = (kind, x, z) => Math.hypot(x - CABIN.x, z - CABIN.z) < 7.5
    || ((kind.trees || kind.solid) && x > CABIN.x - 11 && x < CABIN.x + 7 && z < CABIN.z - 2 && z > CABIN.z - 18);
  // Where the cabin's window looks (down the old clearing, over the river's bend and up its long reach), only
  // what is low grows, on either bank: the window and the walker on the bank look along it to the mountain.
  const lowOnly = (x, z) => sightline(x, z) > 0.5;
  // How well a kind grows at a spot, 0 to about 1.7; and whether there is ground for it there at all.
  const grows = (kind, x, z, scale) => {
    land.zone(x, z, zone);
    let g = GROWS[kind.name][zone.kind] || 0;
    if (!g) return 0;
    const girth = (kind.solid || 0.12) * scale;
    if (zone.creek < girth + (kind.solid ? 0.7 : 0.15)) return 0;             // not in the creek, nor a trunk on its bank
    if (kind.high * scale > LOW && lowOnly(x, z)) return 0;                                        // nothing tall where the cabin's window looks
    if (zone.meadow > 0) g *= kind.trees || kind.solid ? (zone.meadow > 0.12 ? 0 : 1) : Math.pow(1 - zone.meadow, 2) * (kind.name === 'fern' ? 0.6 : 0.2);
    if (zone.glade > 0) g *= kind.name === 'snag' ? 1 + 4 * zone.glade : kind.trees ? (zone.glade > 0.3 ? 0 : 1) : kind.name === 'fern' ? 1 : 1 - 0.7 * zone.glade;
    return g;
  };

  // What a scene of the walk has built at a spot of its own (the cabin, the shelter, the old cedar, a maple,
  // the apple tree): none of the old terrace's scatter may lie in it. A root in the cabin's yard is kept out by
  // `yard`; but a log's root is its middle, and its end reaches nine metres from that. It is the test a hand
  // placement is warned by (rules.inSolid), made beforehand, for the kinds whose solid is one circle: laid as it
  // is for a visitor the forest has no such plant, and at two and a half times the plants, as
  // tools/verify_forest.mjs lays it, a log lay through the cabin's wall.
  const built = [];
  for (const scene of walk) for (const p of scene.placements || []) {
    const kind = kindOf[p.kind];
    if (p.spent || !HAND_KINDS.includes(kind) || !kind.solid || kind.half || p.along !== undefined || p.lift !== undefined || p.height !== undefined || p.tread !== undefined) continue;
    let x = p.x, z = p.z;
    if (x === undefined) { trail.sample(place(p.s), _p, _t); x = _p.x - _t.z * (p.side || 0); z = _p.z + _t.x * (p.side || 0); }       // (as step 2 finds it)
    built.push({ x, z, radius: kind.solid * (p.scale || 1) });
  }
  const inBuilt = (kind, points, scale) => {
    if (!kind.solid) return false;
    for (let i = 0; i < points.length; i += 2) for (const b of built) if (Math.hypot(points[i] - b.x, points[i + 1] - b.z) < kind.solid * scale + b.radius + GAP) return true;
    return false;
  };

  yield 'layout: the old world';
  // 1. what stays of the old terrace
  //
  // `crowns` is what the crown map over the old terrace is drawn from (light/canopyMap.js): the old world's
  // trees in the order they were made, the ones that stood where the valley now is among them, without the
  // ones the walk has taken from the terrace itself, and with what a scene has placed on it. Over the terrace
  // the map is then the old world's own, whatever grows in the valley or is scattered along the new trail: by
  // moonlight the Cathedral is lit through crowns 43 m towards the valley, and with the valley's trees and
  // the new saplings in the map there, a seventh of an approved frame changed by a level.
  const kept = {}, fixedOld = {}, gone = [], crowns = {};
  const onTerrace = (points) => {
    for (let i = 0; i < points.length; i += 2) { land.zone(points[i], points[i + 1], zone); if (zone.kind !== 'terrace') return false; }
    return true;
  };
  for (const kind of KINDS) {
    const data = was[kind.name], fixed = was.composed[kind.name] || 0, list = (kept[kind.name] = []), crown = (crowns[kind.name] = []);
    fixedOld[kind.name] = fixed;
    for (let o = 0; o < data.length; o += RECORD) {
      const x = data[o], z = data[o + 2], yaw = data[o + 3], scale = data[o + 4], byHand = o / RECORD < fixed;
      const points = rules.footprint(kind, x, z, yaw, scale);
      if (!byHand) {
        let stays = !yard(kind, x, z) && !cleared(kind.name, x, z) && !inBuilt(kind, points, scale);
        for (let i = 0; stays && i < points.length; i += 2) stays = grows(kind, points[i], points[i + 1], scale) > 0 && zone.kind === 'terrace';
        if (stays) stays = rules.nearest(points) >= reachOf(kind, scale) - 0.01;
        if (!stays) {
          gone.push(kind.name, x, z);
          if (!onTerrace(points)) crown.push(data.subarray(o, o + RECORD));       // it stood where the valley now is: over the terrace its crown still counts
          continue;
        }
      }
      crown.push(data.subarray(o, o + RECORD));
      // the ground it stands on is the ground it stood on, unless the valley, the creek or a cut for the trail has moved it
      const before = base(x, z), now = heightAt(x, z);
      const record = Array.from(data.subarray(o, o + RECORD));
      if (now !== before) record[1] = data[o + 1] - before + now;
      list.push(record);
      if (kind.trees) rules.occupy(x, z, kind.spacing);
      if (!(byHand && record[1] > now + 0.3)) rules.makeSolid(kind, points, scale);        // what grows on a log is no solid
    }
  }

  yield 'layout: 1, the old terrace';
  // 2. what the walk's scenes place by hand
  const placed = {};
  for (const scene of walk) {
    for (const p of scene.placements || []) {
      // `spent`: random numbers that were drawn here by placements since taken out (the hemlocks that stood in for
      // the maples), drawn still and dropped, so that everything laid after them is laid as it was
      if (p.spent) { for (let i = 0; i < p.spent; i += 1) rng(); continue; }
      // (a placement may itself be `still`, where its kind is not: one of a scattered kind, set down after the
      // valley was laid out, which gives its own yaw, phase and tint and draws nothing)
      const kind = kindOf[p.kind], scale = p.scale || 1, still = kind.still || p.still;
      let x, z, heading = 0;
      if (p.x !== undefined) { x = p.x; z = p.z; } else {
        trail.sample(place(p.s), position, tangent);
        x = position.x - tangent.z * (p.side || 0); z = position.z + tangent.x * (p.side || 0);
        heading = Math.atan2(-tangent.z, tangent.x);
      }
      let yaw = p.turn !== undefined ? heading + p.turn : (p.yaw !== undefined ? p.yaw : rng() * Math.PI * 2);
      // `tread` sets it by the trail's own height where it stands (a log the walk crosses on), `height` outright
      const y = (p.tread !== undefined ? position.y + p.tread : p.height !== undefined ? p.height : heightAt(x, z)) + (p.lift || 0);
      if (p.along !== undefined) { x += Math.cos(yaw) * p.along; z -= Math.sin(yaw) * p.along; yaw = rng() * Math.PI * 2; }
      (placed[p.kind] = placed[p.kind] || []).push([x, y, z, yaw, scale, still ? p.phase || 0 : rng() * 6.283, still ? p.tint ?? 0.5 : rng(), 0]);
      // (a young tree of a kind that is scattered full-grown keeps less ground to itself than its kind does: `spacing`)
      if (kind.trees) rules.occupy(x, z, p.spacing ?? kind.spacing);
      if (p.lift !== undefined || p.height !== undefined || p.tread !== undefined) { if (p.solid) rules.makeSolid(kind, rules.footprint(kind, x, z, yaw, scale), scale); continue; }
      const points = rules.footprint(kind, x, z, yaw, scale), where = `${scene.name || 'scene'}: ${p.kind} at ${p.x !== undefined ? `x=${p.x}, z=${p.z}` : `s=${p.s}, side=${p.side}`}`;
      const got = rules.nearest(points), need = reachOf(kind, scale);
      if (got < need - 0.01 && !p.close) console.warn(`[forest layout] ${where} comes within ${got.toFixed(2)} m of the trail; its reach needs ${need.toFixed(2)} m`);
      if ((kind.solid || kind.rooted) && rules.inSolid(kind, points, scale)) console.warn(`[forest layout] ${where} stands inside another trunk, log or stump`);
      rules.makeSolid(kind, points, scale);
    }
  }

  // 2b. the alders of the river's banks, from random numbers of their own. They are laid once the old growth's
  // own big trees are (step 3 calls this after the Douglas-firs and the hemlocks, which therefore stand where
  // they stood) and before everything else, which grows round them.
  const riverside = {}, alderRng = mulberry32(seed + 150001), stand = makeNoise(seed + 311), _w = [0, false, 0, 0, 0];
  const layAlders = () => {
    const kind = kindOf.alder, list = (riverside.alder = []), step = kind.every, [none, from, to, last] = kind.band;
    for (let gz = WORLD.minZ + 2; gz < -40; gz += step) {
      for (let gx = WORLD.minX + 2; gx < -30; gx += step) {
        const x = gx + (alderRng() - 0.5) * step * 0.9, z = gz + (alderRng() - 0.5) * step * 0.9, chance = alderRng(), size = alderRng(), turn = alderRng(), phase = alderRng() * 6.283, tint = alderRng();
        land.zone(x, z, zone);
        if (zone.kind === 'terrace' || zone.kind === 'water') continue;
        const back = zone.from - zone.bar;                                                  // metres behind the cobbles
        // a stand has gaps and thick places, a few trees across; and its trees are of an age, by the patch:
        // the youngest nearest the water, where the ground was last laid bare
        const cover = smooth(none, from, back) * (1 - smooth(to, last, back)) * (0.4 + 0.75 * stand(x / 13, z / 13));
        if (chance >= cover) continue;
        const scale = (kind.scale[0] + (kind.scale[1] - kind.scale[0]) * (0.6 * stand(x / 37 + 9, z / 37 + 4) + 0.4 * size)) * (0.86 + 0.14 * smooth(1, 7, back));
        if (zone.creek < 1.6 || zone.meadow > 0.12 || yard(kind, x, z) || cleared(kind.name, x, z)) continue;
        // nothing tall where the cabin's window looks, and no crown hung out over the edge of it
        if (lowOnly(x, z) || lowOnly(x + kind.crown, z) || lowOnly(x - kind.crown, z) || lowOnly(x, z + kind.crown) || lowOnly(x, z - kind.crown)) continue;
        if (trail.distance(x, z) < reachOf(kind, scale)) continue;
        if (rules.tooClose(x, z, kind.spacing) || rules.inSolid(kind, [x, z], scale)) continue;
        rules.occupy(x, z, kind.spacing);
        rules.makeSolid(kind, [x, z], scale);
        // It is built leaning towards its own +x, and leans to the light: at the water's edge that is out over
        // the water (a yaw about +y carries +x to (cos, 0, -sin)), further back whichever way it happens to.
        const dx = river(x + 1, z, _w)[0] - river(x - 1, z, _w)[0], dz = river(x, z + 1, _w)[0] - river(x, z - 1, _w)[0];
        const yaw = Math.atan2(dz, -dx) + (turn - 0.5) * (1.4 + (Math.PI * 2 - 1.4) * smooth(2.5, 8, back));
        list.push([x, heightAt(x, z), z, yaw, scale, phase, tint, 0]);
      }
    }
  };

  yield 'layout: 2, the scenes';
  // 3. the scatter: the big trees over all the new ground, the rest along the new stretch of the walk
  const fresh = {};
  const oldArea = (LEGACY.maxX - LEGACY.minX) * (LEGACY.maxZ - LEGACY.minZ), newArea = (WORLD.maxX - WORLD.minX) * (WORLD.maxZ - WORLD.minZ);
  const [keptFrom, keptTo] = trail.kept, newLength = trail.length - (keptTo - keptFrom);
  for (const kind of ALL) {
    if (kind === ALL[2]) { layAlders(); yield 'layout: 3, the alders'; }
    const list = (fresh[kind.name] = []), most = Math.max(...Object.values(GROWS[kind.name]));
    const wide = kind.far === Infinity;
    const tries = Math.round(kind.count * density * most * 1.3 * (wide ? newArea / oldArea : newLength / oldTrail.length));
    const nearest0 = reachOf(kind, kind.scale[0]);
    for (let t = 0; t < tries; t += 1) {
      if (t && t % 3000 === 0) yield `layout: 3, ${kind.name}`;
      const yaw = rng() * Math.PI * 2, size = rng(), chance = rng(), phase = rng() * 6.283, tint = rng();
      let x, z;
      const scale = kind.scale[0] + size * (kind.scale[1] - kind.scale[0]);
      if (wide) {
        x = WORLD.minX + rng() * (WORLD.maxX - WORLD.minX); z = WORLD.minZ + rng() * (WORLD.maxZ - WORLD.minZ);
      } else {
        const s = keptTo + rng() * newLength, side = (rng() < 0.5 ? -1 : 1) * (nearest0 + (kind.far - nearest0) * Math.pow(rng(), 1.7));
        trail.sample(s, position, tangent);
        x = position.x - tangent.z * side; z = position.z + tangent.x * side;
        if (trail.distance(x, z) > kind.far) continue;
      }
      if (x < WORLD.minX + 1 || x > WORLD.maxX - 1 || z < WORLD.minZ + 1 || z > WORLD.maxZ - 1) continue;
      if (z < LEGACY.minZ && x > EAST) continue;                         // up the valley the ground stops there (terrain.js)
      const g = grows(kind, x, z, scale);
      if (chance * most >= g) continue;
      if (chance * most >= g * (EASED[kind.name]?.[zone.kind] ?? 1)) continue;        // a stand-in, where what it stood for now grows
      if (zone.kind === 'terrace') {
        // The old terrace has its plants already: its trees wherever the old world reached, the rest wherever the
        // old loop ran. Beyond the old world, trees are added only in a band along the terrace's brink, where the
        // valley sees them: further east the views approved at checkpoint 1 look out past the old world's edge.
        const inOld = x >= LEGACY.minX && x <= LEGACY.maxX && z >= LEGACY.minZ && z <= LEGACY.maxZ;
        if (wide ? inOld || zone.d > BAND || x > EAST : oldTrail.distance(x, z) <= kind.far) continue;
      }
      if (yard(kind, x, z)) continue;
      const points = rules.footprint(kind, x, z, yaw, scale);
      let ground = true;
      for (let i = 0; ground && i < points.length; i += 2) ground = grows(kind, points[i], points[i + 1], scale) > 0;      // the whole of a log lies on ground a log can lie on, both ends of it
      if (!ground) continue;
      if (rules.nearest(points) < reachOf(kind, scale)) continue;
      if (kind.drift && drift(x / 9, z / 9) < kind.drift) continue;
      if (cleared(kind.name, x, z)) continue;
      if (kind.trees && rules.tooClose(x, z, kind.spacing)) continue;
      if ((kind.solid || kind.rooted) && rules.inSolid(kind, points, scale)) continue;
      if (kind.trees) rules.occupy(x, z, kind.spacing);
      rules.makeSolid(kind, points, scale);
      land.zone(x, z, zone);
      const late = LATE[kind.name]?.[zone.kind === 'terrace' ? (zone.d < BRINK ? 'brink' : 'terrace') : zone.kind] || 0;
      list.push([x, heightAt(x, z), z, yaw, scale, phase, tint, late]);
    }
  }

  yield 'layout: 3, the scatter';
  // 4. the carpets: grass and the river's stones, laid edge to edge on a grid over the ground that is theirs
  const carpets = {};
  let rows = 0;
  for (const kind of CARPETS) {
    const list = (carpets[kind.name] = []), covers = COVERS[kind.name], step = kind.every;
    for (let gz = CARPET.minZ; gz < CARPET.maxZ; gz += step) {
      if (++rows % 12 === 0) yield `layout: 4, ${kind.name}`;
      for (let gx = CARPET.minX; gx < CARPET.maxX; gx += step) {
        const x = gx + (rng() - 0.5) * step * 0.9, z = gz + (rng() - 0.5) * step * 0.9, chance = rng(), size = rng(), yaw = rng() * Math.PI * 2, phase = rng() * 6.283, tint = rng();
        land.zone(x, z, zone);
        if (chance >= covers(zone)) continue;
        const scale = kind.scale[0] + size * (kind.scale[1] - kind.scale[0]), d = trail.distance(x, z);
        if (d > kind.far || d < reachOf(kind, scale)) continue;
        if (yard(kind, x, z) || cleared(kind.name, x, z) || rules.inSolid(kind, [x, z], scale)) continue;
        rules.makeSolid(kind, [x, z], scale);
        list.push([x, terrain.surfaceAt(x, z), z, yaw, scale, phase, tint, 0]);
      }
    }
  }

  yield 'layout: 4, the carpets';
  // 5. the wet ground's own plants, from random numbers of their own
  const wetland = {}, wetRng = mulberry32(seed + 104729);
  for (const kind of WET_KINDS) {
    const list = (wetland[kind.name] = []), step = kind.every;
    for (let gz = GLADE.z - GLADE.r; gz < GLADE.z + GLADE.r; gz += step) {
      for (let gx = GLADE.x - GLADE.r; gx < GLADE.x + GLADE.r; gx += step) {
        const x = gx + (wetRng() - 0.5) * step * 0.9, z = gz + (wetRng() - 0.5) * step * 0.9, chance = wetRng(), size = wetRng(), yaw = wetRng() * Math.PI * 2, phase = wetRng() * 6.283, tint = wetRng();
        land.zone(x, z, zone);
        // thick at the water's edge, thinning to none where the ground is a foot above it; none in the water's own bed
        if (zone.creek < 0.1 || chance >= smooth(0.3, 0.9, zone.sodden)) continue;
        const scale = kind.scale[0] + (kind.scale[1] - kind.scale[0]) * size * (0.35 + 0.65 * zone.sodden);
        if (trail.distance(x, z) < reachOf(kind, scale)) continue;
        if (cleared(kind.name, x, z) || rules.inSolid(kind, [x, z], scale)) continue;
        list.push([x, terrain.surfaceAt(x, z), z, yaw, scale, phase, tint, 0]);
      }
    }
  }

  yield 'layout: 5, the wet ground';
  // 6. what grows under the maples, from random numbers of its own
  const hall = {}, hallRng = mulberry32(seed + 130003), maples = placed.maple || [];
  for (const kind of HALL_KINDS) {
    const list = (hall[kind.name] = []), step = kind.every;
    if (!maples.length) continue;
    const xs = maples.map((m) => m[0]), zs = maples.map((m) => m[2]);
    for (let gz = Math.min(...zs) - kind.far; gz < Math.max(...zs) + kind.far; gz += step) {
      for (let gx = Math.min(...xs) - kind.far; gx < Math.max(...xs) + kind.far; gx += step) {
        const x = gx + (hallRng() - 0.5) * step * 0.9, z = gz + (hallRng() - 0.5) * step * 0.9, chance = hallRng(), size = hallRng(), yaw = hallRng() * Math.PI * 2, phase = hallRng() * 6.283, tint = hallRng();
        const scale = kind.scale[0] + (kind.scale[1] - kind.scale[0]) * size;
        let near = Infinity;
        for (const m of maples) near = Math.min(near, Math.hypot(x - m[0], z - m[2]));
        // none against a maple's foot, most a little way out from it, and thinning to none
        if (near < 2.6 || chance >= 0.75 * (1 - smooth(8, kind.far, near))) continue;
        land.zone(x, z, zone);
        if (zone.kind !== 'hill') continue;                                                  // under the trees: on the bank's grass three of them stood in a row like a planting
        if (zone.creek < 1 || zone.meadow > 0.1 || (kind.high * scale > LOW && lowOnly(x, z))) continue;
        if (trail.distance(x, z) < reachOf(kind, scale)) continue;
        if (cleared(kind.name, x, z) || rules.inSolid(kind, [x, z], scale)) continue;
        list.push([x, terrain.surfaceAt(x, z), z, yaw, scale, phase, tint, 0]);
      }
    }
  }

  yield 'layout: 6, the maples';
  // 7. the willows of the bars, from random numbers of their own
  {
    const kind = kindOf.willow, list = (riverside.willow = []), step = kind.every, willowRng = mulberry32(seed + 160001), thicket = makeNoise(seed + 331);
    const byHand = placed.willow || [];
    const UX = -Math.sin(VIEW.bearing * Math.PI / 180), UZ = -Math.cos(VIEW.bearing * Math.PI / 180);      // up the valley, along the window's line
    for (let gz = WORLD.minZ + 2; gz < -40; gz += step) {
      for (let gx = WORLD.minX + 2; gx < -30; gx += step) {
        const x = gx + (willowRng() - 0.5) * step * 0.9, z = gz + (willowRng() - 0.5) * step * 0.9, chance = willowRng(), size = willowRng(), yaw = willowRng() * Math.PI * 2, phase = willowRng() * 6.283, tint = willowRng();
        land.zone(x, z, zone);
        if (zone.kind === 'terrace' || zone.kind === 'water' || zone.from < 0.7) continue;
        const back = zone.from - zone.bar;
        // on the highest of the cobbles and up the bank's face, in thickets, the thicker the wider the bar is
        // (a thicket is a few bushes together, and then a stretch of bare stones)
        let cover = smooth(-2.4, -0.7, back) * (1 - smooth(1.6, 3.6, back)) * (0.4 + 0.6 * smooth(1.2, 4, zone.bar)) * smooth(0.44, 0.66, thicket(x / 10, z / 10)) * 1.25;
        let scale = kind.scale[0] + (kind.scale[1] - kind.scale[0]) * size;
        // Where the cabin's window looks, a willow as tall as a walker hides the water behind it for a hundred
        // metres. On our side, between the window and the beach's end, there is none but what a scene has placed;
        // up the reach, and on the far side, where it stands beyond the water and not before it, there are
        // fewer and they are low.
        const sight = sightline(x, z);
        if (sight > 0.1) {
          if (zone.ours && (x - VIEW.x) * UX + (z - VIEW.z) * UZ < 150) continue;
          cover *= 0.6; scale = Math.min(scale, 0.42 + 0.18 * size);
        }
        if (chance >= cover) continue;
        if (zone.creek < 1.4 || zone.meadow > 0.12 || yard(kind, x, z) || cleared(kind.name, x, z)) continue;
        if (trail.distance(x, z) < reachOf(kind, scale) || rules.inSolid(kind, [x, z], scale)) continue;
        let crowded = false;
        for (const other of [...byHand, ...list]) if (Math.hypot(other[0] - x, other[2] - z) < kind.apart * (scale + other[4]) * 0.5) { crowded = true; break; }
        if (crowded) continue;
        list.push([x, terrain.surfaceAt(x, z), z, yaw, scale, phase, tint, 0]);
      }
    }
  }

  yield 'layout: 7, the willows';
  // 8. the valley's walls restocked where the walk comes near them, from random numbers of their own
  {
    const kind = kindOf.slopes, list = (riverside.slopes = []), step = kind.every, slopeRng = mulberry32(seed + 170001), patch = makeNoise(seed + 353);
    // What is rooted and is no solid (saplings, ferns, grass, willows) is not in the rules' grid of solids: a
    // trunk is kept from coming up through one of those by looking for them here.
    const low = new Map(), cell = (x, z) => `${Math.floor(x / 2)},${Math.floor(z / 2)}`;
    for (const rooted of [fresh.sapling, fresh.fern, carpets.grass, riverside.willow, placed.willow || []]) {
      for (const [x, , z] of rooted) { const k = cell(x, z); if (!low.has(k)) low.set(k, []); low.get(k).push(x, z); }
    }
    const inLow = (x, z, radius) => {
      for (let i = -1; i <= 1; i += 1) for (let j = -1; j <= 1; j += 1) {
        const at = low.get(cell(x + i * 2, z + j * 2));
        if (at) for (let k = 0; k < at.length; k += 2) if (Math.hypot(at[k] - x, at[k + 1] - z) < radius) return true;
      }
      return false;
    };
    for (let gz = WORLD.minZ + 2; gz < -40; gz += step) {
      for (let gx = WORLD.minX + 2; gx < -30; gx += step) {
        const x = gx + (slopeRng() - 0.5) * step * 0.9, z = gz + (slopeRng() - 0.5) * step * 0.9, chance = slopeRng(), size = slopeRng(), yaw = slopeRng() * Math.PI * 2, phase = slopeRng() * 6.283, tint = slopeRng();
        land.zone(x, z, zone);
        if (zone.kind !== 'wall' || zone.from - zone.bar < kind.band || zone.creek < 2) continue;
        const near = trail.distance(x, z);
        if (near > kind.within[1]) continue;
        // a wood has thick places and thin ones, a few trees across
        if (chance >= (1 - smooth(kind.within[0], kind.within[1], near)) * (0.55 + 0.6 * patch(x / 19, z / 19))) continue;
        const scale = kind.scale[0] + (kind.scale[1] - kind.scale[0]) * size, reach = kind.crown * scale;
        if (z < LEGACY.minZ && x > EAST) continue;                        // up the valley the ground stops there (terrain.js)
        if (yard(kind, x, z) || cleared('spruce', x, z) || near < reachOf(kind, scale)) continue;       // a scene that clears the spruce clears these
        if (lowOnly(x, z) || lowOnly(x + reach, z) || lowOnly(x - reach, z) || lowOnly(x, z + reach) || lowOnly(x, z - reach)) continue;
        if (rules.tooClose(x, z, kind.spacing) || rules.inSolid(kind, [x, z], scale) || inLow(x, z, kind.solid * scale + 0.5)) continue;
        rules.occupy(x, z, kind.spacing);
        rules.makeSolid(kind, [x, z], scale);
        list.push([x, heightAt(x, z), z, yaw, scale, phase, tint, 0]);
      }
    }
  }

  yield 'layout: 8, the walls';
  // 9. the understory: shrubs, and more ferns on the banks, each from random numbers of its own
  const under = {};
  {
    // the walk's own box, for where to look; and the line from the cabin's window to the near water's edge,
    // which nothing new on our side of the strip the window looks along may stand above
    const box = { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity };
    for (let s = 0; s < trail.length; s += 4) { trail.sample(s, _p, _t); box.minX = Math.min(box.minX, _p.x); box.maxX = Math.max(box.maxX, _p.x); box.minZ = Math.min(box.minZ, _p.z); box.maxZ = Math.max(box.maxZ, _p.z); }
    const UX = -Math.sin(VIEW.bearing * Math.PI / 180), UZ = -Math.cos(VIEW.bearing * Math.PI / 180);      // up the valley, along the window's line
    // (the window's eye: 1.55 m over the cabin's floor, which is a hand above the highest ground under the four
    // corners of the box the cabin was blocked out as: world/structures.js cabinFloor has the same sum)
    let eye = -Infinity;
    for (const [i, j] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) eye = Math.max(eye, heightAt(CABIN.x + i * 3.6, CABIN.z + j * 2.75));
    eye += 0.25 + 1.55;
    let shore = 0, shoreY = 0;
    for (let d = 20; d < 160 && !shore; d += 0.5) { land.zone(VIEW.x + UX * d, VIEW.z + UZ * d, zone); if (zone.kind === 'water') { shore = d; shoreY = terrain.surfaceAt(VIEW.x + UX * d, VIEW.z + UZ * d); } }
    // how far the window's line to the near water's edge passes over the ground at a spot this side of it (Infinity beyond it)
    const sightOver = (x, z, y) => {
      const d = (x - VIEW.x) * UX + (z - VIEW.z) * UZ;
      return shore && d > 0 && d < shore ? eye + (shoreY - eye) * (d / shore) - y : Infinity;
    };
    // Whether something whose top is at height `top` at (x, z), on our side, stands before water that the
    // window sees: the first water along the window's line through it, three metres in from its edge. (Water
    // further off along that line is seen over a higher line still.) Only within the picture the window has,
    // 60 degrees either side of the valley's axis. The strip itself is kept by the rule above; this is for
    // the river's bend, off to the left of it, where salmonberry on our bank stood before the nearest water.
    const beyond = {};
    const hidesWater = (x, z, top) => {
      const dx = x - VIEW.x, dz = z - VIEW.z, d = Math.hypot(dx, dz);
      if (d < 12 || d > 170 || (dx * UX + dz * UZ) / d < 0.5) return false;
      for (let far = d + 2; far < d + 90; far += 1.5) {
        const wx = VIEW.x + (dx / d) * far, wz = VIEW.z + (dz / d) * far;
        if (land.zone(wx, wz, beyond).kind !== 'water') continue;
        const seen = far + 3;
        return eye + (terrain.surfaceAt(wx, wz) - eye) * (d / seen) < top;
      }
      return false;
    };
    for (const kind of UNDER_KINDS) {
      const list = (under[kind.name] = []), step = kind.every, rnd = mulberry32(seed + kind.seed), patch = makeNoise(seed + (kind.seed % 997)), covers = UNDER[kind.name];
      let rows = 0;
      for (let gz = Math.max(WORLD.minZ + 2, box.minZ - kind.far); gz < Math.min(WORLD.maxZ - 2, box.maxZ + kind.far); gz += step) {
        if (++rows % 16 === 0) yield `layout: 9, ${kind.name}`;
        for (let gx = Math.max(WORLD.minX + 2, box.minX - kind.far); gx < Math.min(WORLD.maxX - 2, box.maxX + kind.far); gx += step) {
          const x = gx + (rnd() - 0.5) * step * 0.9, z = gz + (rnd() - 0.5) * step * 0.9, chance = rnd(), size = rnd(), yaw = rnd() * Math.PI * 2, phase = rnd() * 6.283, tint = rnd();
          const near = trail.distance(x, z);
          if (near > kind.far) continue;
          land.zone(x, z, zone);
          if (zone.kind === 'water' || zone.creek < 0.3) continue;
          UNDER.pick = -1; UNDER.grow = 1;
          let cover = covers(zone, zone.from - zone.bar, patch(x / 11, z / 11), near, inMeadow(x, z), tint);
          // (which of its sheet's plants it is, and what is left of its tint to tone it by)
          const toned = kind.variants ? (Math.max(0, UNDER.pick) + ((tint * 61.7) % 1) * 0.998) / kind.variants : tint;
          let scale = (kind.scale[0] + (kind.scale[1] - kind.scale[0]) * size) * UNDER.grow;
          const y = terrain.surfaceAt(x, z), sight = sightline(x, z);
          if (sight > 0.1) {
            // Where the cabin's window looks. On our side, this side of the water: only what stands under the
            // window's line to the near water's edge, with room to spare. Beyond that, and across the water, what is
            // taller than a walker stands before the water of the long reach for someone: fewer, and low (as
            // the willows are); and nothing as tall as an elderberry.
            const over = sightOver(x, z, y);
            if (over < Infinity) { if (kind.high * scale > over - 0.3) continue; }
            else if (kind.high > 1.5) {
              if (kind.high > 3 || (zone.ours && (x - VIEW.x) * UX + (z - VIEW.z) * UZ < 150)) continue;
              cover *= 0.5; scale = Math.min(scale, kind.scale[0] + 0.1 * size);
            }
          }
          if (chance >= cover) continue;
          if (near < reachOf(kind, scale)) continue;
          if (yard(kind, x, z) || cleared(kind.name, x, z) || rules.inSolid(kind, [x, z], scale)) continue;
          if (approved(x, z, kind.gone)) continue;
          if (zone.ours && sight <= 0.1 && kind.high * scale > 1.5 && hidesWater(x, z, y + kind.high * scale)) continue;
          const late = LATE[kind.name]?.[zone.kind === 'terrace' ? (zone.d < BRINK ? 'brink' : 'terrace') : zone.kind] || 0;
          list.push([x, y, z, yaw, scale, phase, toned, late]);
        }
      }
    }
  }

  yield 'layout: 9, the understory';
  // The daisies' turf. English daisy grows where the grass is short, and under tufts as tall as the clearing's it
  // would not be seen: where a patch of it is laid, the tufts within a stride are taken out (the ground there is
  // painted as grass). Only tufts go: no other record changes for it.
  {
    const turf = (under.carpet || []).filter((record) => Math.floor(record[6] * 4) === 3);
    if (turf.length) carpets.grass = carpets.grass.filter(([x, , z]) => !turf.some((t) => Math.hypot(t[0] - x, t[2] - z) < 0.45 + 0.45 * t[4]));
  }

  yield 'layout: the daisies';
  // by kind: placed by hand first (the old terrace's, then the walk's), then the scatter (kept, then new)
  const out = { composed: {}, gone, crowns: {}, approved };   // gone: kind, x, z of every plant of the old terrace that lost its ground (for the map); approved: see above
  const kindOfUnder = Object.fromEntries(UNDER_KINDS.map((k) => [k.name, k]));
  const pack = (all) => { const data = new Float32Array(all.length * RECORD); all.forEach((record, i) => data.set(record, i * RECORD)); return data; };
  // what a scene has placed on the terrace itself, inside the old world's box, joins the terrace's crowns
  const added = ([x, , z]) => x >= LEGACY.minX && x <= LEGACY.maxX && z >= LEGACY.minZ && z <= LEGACY.maxZ && terrace(x, z) >= 0;
  for (const kind of ALL) {
    const name = kind.name, old = kept[name] || [], hand = placed[name] || [], fixed = fixedOld[name] || 0;
    out[name] = pack([...old.slice(0, fixed), ...hand, ...old.slice(fixed), ...fresh[name], ...(kindOfUnder[name]?.more ? under[name] : [])]);
    out.composed[name] = fixed + hand.length;
    out.crowns[name] = pack([...(crowns[name] || []), ...hand.filter(added)]);
  }
  for (const { name } of HAND_KINDS) {
    const hand = placed[name] || [];
    out[name] = pack(hand);
    out.composed[name] = hand.length;
    out.crowns[name] = pack(hand.filter(added));
  }
  for (const kind of CARPETS) out[kind.name] = pack(carpets[kind.name]);
  for (const kind of WET_KINDS) out[kind.name] = pack(wetland[kind.name]);
  for (const kind of HALL_KINDS) out[kind.name] = pack(hall[kind.name]);
  for (const { name } of RIVER_KINDS) { const hand = placed[name] || []; out[name] = pack([...hand, ...riverside[name]]); out.composed[name] = hand.length; }
  for (const kind of UNDER_KINDS) if (!kind.more) out[kind.name] = pack(under[kind.name]);
  return out;
}
