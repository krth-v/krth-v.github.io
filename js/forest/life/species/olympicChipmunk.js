// The Olympic chipmunk, Neotamias amoenus caurinus (Tamias amoenus caurinus in older works): the Olympic Mountains'
// own race of the yellow-pine chipmunk, a small, pale chipmunk of the high country's open woods, meadows and rocks.
// On the roll it is the rarest tier: a low valley on the west side is not where it lives, by what was read. Built by
// life/beast.js with the parts of life/parts/rodent.js, posed by life/parts/rodentRig.js; how it lives is
// life/families/scurrier.js.
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
const HEAD = [28, 40, 44], FACEDARK = [22, 32, 16];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const band = (x, at, half) => smooth(at - half, at - half * 0.55, x) * (1 - smooth(at + half * 0.55, at + half, x));
const along = (x) => smooth(-0.037, -0.027, x) * (1 - smooth(0.018, 0.028, x));
const EYE = { s: 0.0076, up: 0.0052, side: 0.0083, r: 0.0025 };

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
  studio: { wide: 0.55, bar: 0.05 },
  // The body, in metres, standing on all fours: the Douglas squirrel's drawing at 0.586 of its size and slimmer, its
  // muzzle longer, its ears and hind feet as published (the agent's own, as the squirrel's is).
  shape: {
    unit: 0.06,
    trunk: [
      [-0.041, 0.0375, -0.0422, 0.0293, 0.0049, 0.5, 2], [-0.0387, 0.0416, -0.0404, 0.0199, 0.0098, 0.52, 2.1], [-0.0334, 0.0451, -0.034, 0.0146, 0.0128, 0.5, 2.25],
      [-0.0246, 0.0463, -0.024, 0.0129, 0.0138, 0.5, 2.3], [-0.0141, 0.0451, -0.0135, 0.0135, 0.0138, 0.5, 2.3], [-0.0035, 0.0428, -0.0029, 0.0146, 0.0128, 0.52, 2.25],
      [0.007, 0.0398, 0.0082, 0.0158, 0.0118, 0.54, 2.2], [0.0164, 0.0381, 0.0176, 0.017, 0.0103, 0.56, 2.15], [0.024, 0.0381, 0.0258, 0.0193, 0.0089, 0.55, 2.1],
      [0.0299, 0.0398, 0.0322, 0.0234, 0.0079, 0.52, 2.05], [0.0346, 0.0428, 0.0369, 0.0275, 0.0074, 0.5, 2], [0.0381, 0.0457, 0.0404, 0.0316, 0.0069, 0.5, 2],
    ],
    withers: [0.0117, 0.0264],
    spine: { hips: [-0.0258, 0.0316], chest: [0.0059, 0.0293], neck1: [0.0258, 0.0305], neck2: [0.0316, 0.034], neck3: [0.0363, 0.0375] },
    blend: [0.0117, 0.007, 0.0047, 0.0041, 0.0035],
    head: {
      at: [0.0387, 0.0398], tilt: -16, square: 1.8, jaw: [0.0152, -0.0035],
      stations: [[-0.0082, 0.0047, 0.0053, 0.0044], [-0.0047, 0.0085, 0.0075, 0.007], [0.0, 0.0107, 0.0086, 0.0085], [0.0047, 0.0113, 0.0087, 0.0088], [0.0094, 0.0104, 0.0081, 0.0083],
        [0.0141, 0.0087, 0.007, 0.0069], [0.0182, 0.0067, 0.006, 0.0057], [0.0228, 0.0048, 0.0045, 0.0041], [0.0263, 0.0031, 0.0031, 0.0028]],
      eye: EYE,
      incisors: { long: 2.5, wide: 1.8 },
      whiskers: { long: 22, count: 4 },
    },
    ear: { s: -0.0017, up: 0.0088, side: 0.0052, length: 0.016, width: 0.0105, out: 18, open: 30, round: 0.6 },
    tail: { at: [-0.0398, 0.0363], length: 0.0932, width: 0.0058, depth: 0.005, hang: 100, bush: { long: 11, round: 5 } },
    fore: {
      at: [0.0199, 0.0059], scapula: [0.0176, 0.0352], bones: [0.0129, 0.0141, 0.0082], angles: [28, -6, -72], pastern: [0.0041, 0.0012], hoof: [0.0035, 0.0015, 0.0035],
      girth: [[0, 0.0034, 0.003, 0], [0.0064, 0.0037, 0.0032, 0.0006], [0.0129, 0.0025, 0.0022, 0], [0.0199, 0.0021, 0.0019, 0], [0.027, 0.0017, 0.0017, 0], [0.0311, 0.0011, 0.002, 0], [0.0352, 0.0009, 0.0021, 0]],
      share: { at: [0.0188, 0.0205], reach: [0.0094, 0.0082], most: 0.5 },
    },
    hind: {
      at: [-0.027, 0.0068], bones: [0.0223, 0.0263, 0.021], angles: [-48, 52, -80], pastern: [0.0059, 0.001], hoof: [0.0046, 0.0016, 0.0053],
      girth: [[0, 0.0059, 0.0039, 0], [0.0079, 0.0069, 0.0046, 0.0012], [0.0171, 0.0054, 0.0044, 0.0006], [0.0236, 0.0039, 0.0032, 0], [0.0341, 0.003, 0.0025, 0],
        [0.0446, 0.0021, 0.0021, 0], [0.0486, 0.002, 0.0022, 0], [0.0591, 0.0014, 0.0027, 0], [0.0696, 0.0011, 0.0029, 0]],
      share: { at: [-0.0234, 0.0223], reach: [0.0129, 0.0117], most: 0.6 },
    },
    neck: { low: [-0.55, -0.35, -0.3, 0.35], high: [0.28, 0.16, 0.12, -0.1], dip: -0.03 },
    lie: { drop: 0.012, fore: { top: [0.012, 0.007], fetlock: [-0.006, 0.0025], out: 1.0, hoof: -0.5 }, hind: { top: [-0.006, 0.007], fetlock: [0.012, 0.0025], out: 1.2, hoof: 0.2 } },
    climb: { stride: 0.26, splay: 0.012, flex: 0.35 },
  },
  coat: {
    body: [
      { colour: SIDES },                                                                                                   // pale (Q)
      { colour: RUMP, where: (p) => 0.7 * (1 - smooth(-0.037, -0.025, p.x)) * smooth(0.4, 0.7, p.a) },
      { colour: WHITE, where: (p) => band(p.a, 0.685, 0.032) * along(p.x) },                                              // the lowest stripe white (Q)
      { colour: BROWNBLACK, where: (p) => band(p.a, 0.75, 0.028) * along(p.x) },                                         // then brownish black
      { colour: GREY, where: (p) => band(p.a, 0.815, 0.03) * along(p.x) },                                               // greyish
      { colour: BLACK, where: (p) => band(p.a, 0.88, 0.028) * along(p.x) },
      { colour: GREY, where: (p) => band(p.a, 0.94, 0.025) * along(p.x) },
      { colour: BLACK, where: (p) => smooth(0.965, 0.99, p.a) * smooth(-0.037, -0.027, p.x) },                             // and the middle one black, narrow and sharp
      { colour: WHITE, where: (p) => 1 - smooth(0.22, 0.29, p.a) },                                                      // white below (Q)
    ],
    head: [
      { colour: HEAD },
      { colour: BLACK, where: (p) => smooth(0.0075, 0.0095, p.up) * (1 - smooth(0.0025, 0.004, Math.abs(p.z))) },
      { colour: WHITE, where: (p) => band(p.up, EYE.up + 0.0029, 0.0012) * smooth(-0.005, -0.002, p.s) * (1 - smooth(0.017, 0.021, p.s)) },
      { colour: FACEDARK, where: (p) => band(p.up, EYE.up, 0.0013) * smooth(-0.007, -0.003, p.s) * (1 - smooth(0.02, 0.024, p.s)) },
      { colour: WHITE, where: (p) => band(p.up, EYE.up - 0.003, 0.0013) * smooth(-0.005, -0.002, p.s) * (1 - smooth(0.018, 0.022, p.s)) },
      { colour: FACEDARK, where: (p) => band(p.up, EYE.up - 0.0055, 0.0011) * smooth(-0.005, -0.002, p.s) * (1 - smooth(0.012, 0.015, p.s)) },
      { colour: WHITE, where: (p) => 1 - smooth(-0.0075, -0.0035, p.up) },
      { colour: [18, 14, 13], where: (p) => smooth(0.024, 0.026, p.s) * smooth(-0.0017, 0.0, p.up) },
    ],
    leg: ({ d, pastern }) => (pastern ? [32, 20, 58] : [30, 32, 40 + 10 * smooth(0.4, 1, d)]),
    hoof: [26, 14, 20],
    ear: { outer: [30, 10, 46], inner: [24, 22, 20], edge: [34, 12, 68] },
    tail: { top: [26, 14, 24], under: [34, 52, 54] },
    antler: [30, 10, 30],
    eye: { iris: [20, 30, 7], pupil: [0, 0, 3] },
    hair: { long: () => false },
    fur: 1.4,
    // the brush: greyish black frosted pale above, ochraceous below (Q)
    bush: { top: [28, 14, 26], band: [22, 16, 11], fringe: [36, 18, 74], under: [34, 52, 54] },
    bits: { teeth: [32, 78, 52], whiskers: [30, 12, 9], cone: [24, 42, 27], flake: [26, 44, 33] },
  },
  card: {
    size: 'About 21 cm from nose to tail\'s end, of which the tail is 9 cm; about 50 g.',
    marks: ['Small and pale, with narrow, sharp stripes: black, grey and white', 'Black and white stripes on the face', 'White below; the tail ochraceous beneath'],
    lives: 'The Olympic Mountains\' own race of the yellow-pine chipmunk, of the open subalpine woods, meadows and rocks, more often heard than seen: one this low in the valley is a rare find. Restless and tame, it lets a person come within a few metres, scampers off a little way and sits up to watch again; it does not take to trees.',
  },
};
