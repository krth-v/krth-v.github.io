// The Olympic chipmunk, Neotamias amoenus caurinus (Tamias amoenus caurinus in older works): the Olympic Mountains'
// own race of the yellow-pine chipmunk, a small, pale chipmunk of the high country's open woods, meadows and rocks.
// On the roll it is the rarest tier: a low valley on the west side is not where it lives, by what was read. Drawn as a
// plate (life/plate.js; 2026-11-19) with a bushy tail, teeth and whiskers (life/plate.js `smallParts`), posed by
// life/plateRig.js, painted by life/plateCoat.js; how it lives is life/families/scurrier.js.
//
// What was read (2026-11-16; none of it seen as an image). Dalquest, W. W. 1948, Mammals of Washington, read whole
// as plain text (Project Gutenberg 53582, from a mirror): which chipmunk it is (Eutamias amoenus caurinus, "small
// size and pale color", of the higher parts of the Olympic Mountains), its measurements, the species' colours and
// stripes, and its habits. And what agents read on 2026-11-16 and checked against a second reading
// (.local-assets/forest/research/beasts-herps-2026-11-16.json): the Park Service's Olympic page (subalpine; more
// often heard than seen), Wikipedia and Animal Diversity Web for the species' mass. Not found: the race's mass, the
// outline of its head and body.

export const published = {
  shown: 'an adult of the Olympic race, T. a. caurinus',
  note: 'Published: the lengths below; the species\' colours (its stripes narrow and sharply set off, the middle one black, the next greyish, then brownish black, the lowest white; the underparts white; the tail ochraceous below; sleek and bright) and the race\'s paleness; that it is restless and tame, lets a person come within twenty feet or closer, scampers off a little way to watch again and stays in sight, and never takes to trees. Not found, and the agent\'s: the outline of the head and the body, how thick each part is, the legs\' bones, how bushy the tail is, the race\'s mass, and every pose.',
  sources: {
    Q: 'Dalquest 1948, Mammals of Washington: T. a. caurinus, 7 males and 3 females from Deer Park, Clallam County: total length 207.4 mm, tail 93.2, hind foot 32.5, ear 16 (head and body is the total less the tail: the agent\'s arithmetic)',
    W: 'Wikipedia, "Yellow-pine chipmunk": large males 49.7 g, females 53.5 g',
    A: 'Animal Diversity Web, Neotamias amoenus: 30 to 70 g',
    N: 'National Park Service, Olympic National Park: subalpine; more often heard than seen',
  },
  lengths: [
    ['length', 'Head and body (nose to the root of the tail, along the back)', 0.1142, [0.1142, 0.1142], 'Q'],
    ['tail', 'Tail (its bone, root to tip)', 0.0932, [0.0932, 0.0932], 'Q'],
    ['hindFoot', 'Hind foot (heel to the end of the claw)', 0.0325, [0.0325, 0.0325], 'Q'],
    ['ear', 'Ear (from its base)', 0.016, [0.016, 0.016], 'Q'],
  ],
  proportions: [
    'Head and body 114 mm, tail 93 mm, the means of ten (Q): smaller than Townsend\'s chipmunk',
    'Its stripes narrow and sharp, black and white; pale (Q)',
    'Not found: the head\'s and the body\'s outline and girth, the legs\' bones, the length of the tail\'s hair (built at 11 mm either side)',
  ],
  mass: 'For the species: 30 to 70 g (A); large males 50 g and females 54 g (W). The race\'s own was not found',
};

const SIDES = [30, 36, 52], GREY = [32, 10, 62], BLACK = [20, 20, 8], BROWNBLACK = [20, 30, 13], WHITE = [40, 12, 86], RUMP = [30, 12, 50];
const HEAD = [28, 40, 44], FACEDARK = [22, 32, 16], LEG = [30, 30, 48], FOOT = [32, 20, 60], NOSE = [18, 14, 13];
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };
// The stripes, narrow and sharply set off (Q): along the back, by how far round from the belly a place is (a: 0 the
// belly, 1 the middle of the back), from the rump to the shoulders (x, m); five dark and four pale. On the face, by
// how far a place lies above or below a line through the eye along the head (q, m), from behind the eye to the muzzle.
const U = 0.00574, EYE = [0.0532, 0.0390], X0 = -0.038, X1 = 0.021, HEAD_END = 0.0684;
const band = (a, at, half) => edge(half - Math.abs(a - at), 0.006);
const along = (p) => edge(p.x - X0, 0.003) * edge(X1 - p.x, 0.004);
const q = (p) => (p.y - EYE[1]) + 0.29 * (p.x - EYE[0]);
const face = (p, lo, hi) => (p.part === 'body' ? edge(q(p) - lo, 0.0003) * edge(hi - q(p), 0.0003) * edge(p.x - (EYE[0] - 1.6 * U), 0.0015) * edge(HEAD_END - 0.5 * U - p.x, 0.001) * edge(Math.abs(p.z) - 0.25 * U, 0.0008) : 0);

export default {
  name: 'Olympic chipmunk', latin: 'Neotamias amoenus caurinus', key: 'olympic-chipmunk', seed: 453,
  census: { tier: 'very rare', source: 'N CL, endemic; a chipmunk of the high country', clock: 'day' },
  plan: 'beast',
  published,
  // How it lives on a visit (life/families/scurrier.js): about a stump or a log near the walk, in the open if there
  // is open wood; it sits up and watches a walker, and when they come on it scampers off a few metres and watches
  // again, three times before it goes; never up a tree. Every number is the agent's (twenty feet is Dalquest's).
  way: {
    family: 'scurrier', gap: [30, 120], there: 0.6, fastest: 7,
    homeOff: 14, range: 6, girth: 0.15, run: [1.8, 3.8], climb: [1.2, 2.4],
    notice: 7, flush: 3, startle: 6, near: 0, gone: 0.3, trees: false, scold: 0, up: 0, watch: true, feed: [6, 20],
    call: { every: [0.8, 1.8], reach: 40, what: 'chip' },
  },
  // (nothing was staged for it: no recording of the Olympic race, or of the yellow-pine chipmunk, under a licence
  // that can be used was looked for or found)
  voices: { chip: { silent: true } },
  size: 0.207, body: { high: 0.045, long: 0.058, wide: 0.017 },
  // one stride of a walk, a trot and a gallop (life/beasts.js `stridesOf`); its family asks only for its scamper,
  // `scurry`, whose stride is shape.climb's (life/plateRig.js)
  strides: { walk: 0.08, trot: 0.16, gallop: 0.26 },
  // The body, in metres, standing on all fours: drawn as a plate (life/plate.js says what each drawing is; redrawn
  // 2026-11-19): the Douglas squirrel's drawing at 0.574 of its size, slimmer, its muzzle drawn longer and more pointed,
  // its ears, tail and hind feet as published (the agent's own, as the squirrel's is; no photograph was looked at).
  shape: {
    gait: 'bound',
    plate: {
      side: {
        top: [[0, -0.0413, 0.0333], [0.6, -0.0402, 0.039], [1.2, -0.0367, 0.0436], [2, -0.031, 0.0471], [3, -0.023, 0.0488], [4, -0.0138, 0.0476], [5, -0.0046, 0.0448], [6, 0.0046, 0.0413], [7, 0.0126, 0.0385], [8, 0.0201, 0.0379], [9, 0.0264, 0.039], [10, 0.0321, 0.0413], [11, 0.0367, 0.0442], [12, 0.042, 0.0459], [13, 0.0486, 0.0453], [14, 0.0552, 0.0425], [15, 0.0612, 0.0379], [16, 0.0658, 0.0344], [16.6, 0.0678, 0.0316], [17, 0.0684, 0.0293]],
        bottom: [[0, -0.0413, 0.0298], [0.6, -0.0408, 0.0241], [1.2, -0.0379, 0.0195], [2, -0.0333, 0.0166], [3, -0.0253, 0.0155], [4, -0.0149, 0.0155], [5, -0.0046, 0.0161], [6, 0.0046, 0.0166], [7, 0.0126, 0.0178], [8, 0.0201, 0.0201], [9, 0.0264, 0.023], [10, 0.0321, 0.0264], [11, 0.0367, 0.0287], [12, 0.042, 0.0293], [13, 0.0486, 0.0287], [14, 0.0552, 0.0281], [15, 0.0612, 0.0276], [16, 0.0658, 0.027], [16.6, 0.0678, 0.0276], [17, 0.0684, 0.0287]],
      },
      above: [[0, 0.003], [0.6, 0.0071], [1.2, 0.0101], [2, 0.0126], [3, 0.0141], [4, 0.0146], [5, 0.0141], [6, 0.0131], [7, 0.0116], [8, 0.0101], [9, 0.0086], [10, 0.0081], [11, 0.0087], [12, 0.0094], [13, 0.0091], [14, 0.0078], [15, 0.0059], [16, 0.0038], [16.6, 0.0024], [17, 0.0011]],
      front: [[0, 0.5, 2.0, 2.0], [3, 0.5, 2.2, 2.2], [6, 0.52, 2.3, 2.2], [9, 0.5, 2.2, 2.0], [12, 0.5, 2.2, 2.0], [15, 0.5, 2.0, 2.0], [17, 0.5, 2.0, 2.0]],
      spine: [['hips', -0.0264, 0.0333], ['loin', -0.0149, 0.0344], ['back', -0.0023, 0.0333], ['chest', 0.0103, 0.0298], ['neck1', 0.0218, 0.031], ['neck2', 0.0276, 0.0333], ['neck3', 0.0321, 0.0356], ['head', 0.0367, 0.0379]],
      marks: { rump: 0.6, withers: [6.5, 8.5], poll: 11 },
      jaw: { hinge: [0.0381, 0.0321], from: 14.3, soft: 0.8, lips: 0.42, open: 0.35 },
      eye: { at: [0.0532, 0.039], r: 0.0027 },
    },
    // its paws (the bear's, life/parts/paw.js): small, the claws curved (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 2.5, hind: 2.5, curve: 1.3 },
    fore: {
      at: [0.0207, 0.0072],
      joints: [[0.0069, 0.0367, 0.0062], [0.0172, 0.0264, 0.0088], [0.0092, 0.0166, 0.0088], [0.0195, 0.0057, 0.0072], [0.0207, 0.0029, 0.0072]],
      outline: [[0.0367, 0.0207, -0.0029, 0.0081, 0.0031], [0.031, 0.0241, -0.0011, 0.0106, 0.0036], [0.0258, 0.0247, 0.0011, 0.0116, 0.0041], [0.0207, 0.0218, 0.0034, 0.0116, 0.0046], [0.0161, 0.0201, 0.0063, 0.0106, 0.0052], [0.0115, 0.0212, 0.0121, 0.0096, 0.0052], [0.0069, 0.0224, 0.0161, 0.0091, 0.0057], [0.004, 0.023, 0.0172, 0.0088, 0.0057], [0.0029, 0.023, 0.0178, 0.0088, 0.0057]],
      foot: { long: 0.0126, wide: 0.0052 }, web: 0,
    },
    hind: {
      at: [-0.0287, 0.0088],
      joints: [[-0.0264, 0.0333, 0.0072], [-0.0149, 0.0218, 0.0114], [-0.0333, 0.0057, 0.0088], [-0.0287, 0.0029, 0.0088]],
      outline: [[0.0367, -0.0161, -0.039, 0.0091, 0.0031], [0.031, -0.0103, -0.0413, 0.0131, 0.0036], [0.0253, -0.008, -0.0419, 0.0152, 0.0041], [0.0207, -0.0092, -0.0402, 0.0157, 0.0052], [0.0161, -0.0143, -0.0379, 0.0146, 0.0062], [0.0115, -0.0207, -0.0367, 0.0131, 0.0067], [0.0075, -0.0258, -0.0367, 0.0121, 0.0067], [0.0046, -0.0276, -0.0367, 0.0116, 0.0067], [0.0029, -0.0276, -0.0367, 0.0116, 0.0067]],
      foot: { long: 0.0398, wide: 0.0063 }, web: 0,
    },
    ear: { at: [0.041, 0.0442], side: 0.006, length: 0.016, width: 0.0105, out: 18, open: 30, round: 0.6, back: 12 },
    // the tail's bone (published) and its brush (the agent's: the hair's length is the old sheet's)
    tail: { at: [-0.039, 0.0356], length: 0.0932, width: 0.0058, depth: 0.005, hang: 100 },
    brush: { long: 11, round: 6, past: 0.7, core: 0.6, taper: 0.15, carry: { droop: 0.2, up: 1.35, curl: 1.4, run: -0.3, sit: 0.3 } },
    teeth: { long: 2.5, wide: 1.8 },
    whiskers: { long: 22, count: 4 },
    // how it climbs and scampers (life/families/scurrier.js runs `cycle` by climb.stride; life/plateRig.js)
    climb: { stride: 0.26, splay: 0.012, flex: 0.35 },
    // sitting up on its haunches (life/plateRig.js): the hips this high, the body turned up this far (radians)
    sit: { high: 0.0126, pitch: 1.25, arch: 0.25, back: 0.15, fore: 0.1 },
    neck: { low: [-0.55, -0.35, -0.3, 0.35], high: [0.28, 0.16, 0.12, -0.1], dip: -0.035 },
    lie: { drop: 0.012, fore: { top: [0.012, 0.007], fetlock: [0.018, 0.0025], out: 1.0, hoof: 0 }, hind: { top: [-0.006, 0.007], fetlock: [-0.012, 0.0025], out: 1.2, hoof: 0 } },
  },
  // The coat, as paint (life/plateCoat.js says what each table is): pale (Q), its stripes narrow and sharp: the
  // middle one black, the next greyish, then brownish black, the lowest white, and under it one more dark; white below;
  // black and white stripes on the face. Every shade and boundary is the agent's.
  coat: {
    rules: [
      { colour: SIDES },
      { colour: RUMP, where: (p) => (p.part === 'body' ? 0.6 * edge(-0.026 - p.x, 0.006) * edge(p.a - 0.5, 0.1) : 0) },
      { colour: BROWNBLACK, where: (p) => (p.part === 'body' ? band(p.a, 0.725, 0.026) * along(p) : 0) },
      { colour: WHITE, where: (p) => (p.part === 'body' ? band(p.a, 0.79, 0.03) * along(p) : 0) },                         // the lowest stripe white (Q)
      { colour: BROWNBLACK, where: (p) => (p.part === 'body' ? band(p.a, 0.855, 0.026) * along(p) : 0) },                  // then brownish black
      { colour: GREY, where: (p) => (p.part === 'body' ? band(p.a, 0.915, 0.026) * along(p) : 0) },                        // greyish
      { colour: WHITE, where: (p) => (p.part === 'body' ? edge(0.27 - p.a, 0.03) : 0) },                                     // white below (Q)
      { colour: HEAD, where: (p) => (p.part === 'body' ? edge(p.t - 10.4, 0.4) * edge(p.a - 0.32, 0.05) : 0) },
      { colour: BLACK, where: (p) => (p.part === 'body' ? edge(p.a - 0.962, 0.006) * edge(p.x - X0, 0.003) * edge(EYE[0] - p.x, 0.003) : 0) },   // and the middle one black, onto the crown
      { colour: WHITE, where: (p) => face(p, 0.3 * U, 0.62 * U) },                                                           // the face: white over the eye,
      { colour: FACEDARK, where: (p) => face(p, -0.22 * U, 0.22 * U) },                                                      // dark through it,
      { colour: WHITE, where: (p) => face(p, -0.64 * U, -0.3 * U) },                                                         // white under it,
      { colour: FACEDARK, where: (p) => face(p, -0.98 * U, -0.72 * U) * edge(p.x - EYE[0] + 0.4 * U, 0.001) },              // and a dark stripe over the cheek
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 16.55, 0.1) * edge(p.a - 0.42, 0.06) : 0) },
      { colour: LEG, where: (p) => (p.part === 'limb' ? edge(0.025 - p.y, 0.006) : 0) },
      { colour: FOOT, where: (p) => (p.part === 'limb' ? edge(0.008 - p.y, 0.003) : 0) },
    ],
    planes: [],
    tones: { light: [3, -4, 7], shade: [-2, 2, -6] },
    turn: { top: 1, under: 0.8 },
    hair: { count: 0.35, long: 0.004 },
    claw: [26, 14, 20], pad: [28, 14, 40],
    ear: { outer: [30, 10, 46], inner: [24, 22, 20], edge: [34, 12, 68] },
    eye: { iris: [20, 30, 7], pupil: [0, 0, 3] },
    // the brush: greyish black frosted pale above, ochraceous below (Q)
    bush: { top: [28, 14, 26], band: [22, 16, 11], fringe: [36, 18, 74], under: [34, 52, 54] },
    bits: { teeth: [32, 78, 52], whiskers: [30, 12, 9], cone: [24, 42, 27], flake: [26, 44, 33] },
  },

  // Who it may be, and the poses its contact sheet shows: each the fields its family asks for (life/families/scurrier.js)
  who: { adult: {} },
  poses: {
    alert: { neck: 0.9, ears: 0.6, tail: 0.55, curl: 0.3 },
    scamper: { scurry: 1, cycle: 0.1, tail: 0.55, curl: 0.3 },
    stretched: { scurry: 1, cycle: 0.6, tail: 0.55, curl: 0.3 },
    sit: { sit: 1, tail: 0.75, curl: 0.5, neck: 0.55 },
    watch: { sit: 1, tail: 0.75, curl: 0.5, neck: 0.7, flick: 0.8, head: { yaw: 0.7 } },
    frozen: { crouch: 1, sit: 0, tail: 0.2, neck: 0.5, ears: -0.4 },
    sniff: { neck: 0.05, head: { pitch: -0.2 }, tail: 0.55, curl: 0.3 },
    climb: { cling: 1, scurry: 0.6, cycle: 0.3, tail: 0.35, curl: 0.15, neck: 0.75 },
  },
  studio: { high: 0.1, tall: 0.07, middle: 0.0,
    rows: [
      { span: 0.24, high: 0.16, cells: [['adult', 'adult', 'alert', 'side'], ['front', 'adult', 'alert', 'front'], ['behind', 'adult', 'alert', 'behind'], ['three-quarters', 'adult', 'alert', 'quarter']] },
      { span: 0.24, high: 0.15, cells: [['from above', 'adult', null, 'above'], ['scampering, gathered', 'adult', 'scamper', 'side'], ['scampering, stretched', 'adult', 'stretched', 'side'], ['nose in the litter', 'adult', 'sniff', 'quarter']] },
      { span: 0.24, high: 0.14, cells: [['sitting up', 'adult', 'sit', 'side'], ['sitting up, watching you', 'adult', 'watch', 'quarter'], ['frozen still', 'adult', 'frozen', 'quarter'], ['on a trunk (it never takes to one)', 'adult', 'climb', 'up']] },
    ] },
  card: {
    size: 'About 21 cm from nose to tail\'s end, of which the tail is 9 cm; about 50 g.',
    marks: ['Small and pale, with narrow, sharp stripes: black, grey and white', 'Black and white stripes on the face', 'White below; the tail ochraceous beneath'],
    lives: 'The Olympic Mountains\' own race of the yellow-pine chipmunk, of the open subalpine woods, meadows and rocks, more often heard than seen: one this low in the valley is a rare find. Restless and tame, it lets a person come within a few metres, scampers off a little way and sits up to watch again; it does not take to trees.',
  },
};
