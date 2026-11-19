// Townsend's chipmunk, Neotamias townsendii (Tamias townsendii in older works): the large dark chipmunk of the
// coast's humid forests, and the chipmunk of a low valley on the west side of the Olympics. Drawn as a plate
// (life/plate.js; 2026-11-19) with a bushy tail, teeth and whiskers (life/plate.js `smallParts`), posed by
// life/plateRig.js, painted by life/plateCoat.js; how it lives is life/families/scurrier.js.
//
// What was read (2026-11-16; none of it seen as an image). Dalquest, W. W. 1948, Mammals of Washington, read whole
// as plain text (Project Gutenberg 53582, from a mirror): the species' colours and stripes, its habits, and the
// measurements of its two races in Washington, T. t. townsendii of "the humid coastal belt of western Washington to
// the Pacific Ocean, exclusive of the Olympic Mountains" (built here) and T. t. cooperi of the Cascades and the
// Olympic Mountains (paler, its pale stripes whitish; a little smaller). And what agents read on 2026-11-16 and
// checked against a second reading (.local-assets/forest/research/beasts-herps-2026-11-16.json): Oregon State
// University Extension EC 1580 (8 3/4 to 11 inches with a 3 to 5 inch tail; 2 to 4 oz; it runs with its tail
// straight up; seen sitting on a stump or a log; a fast, high "chip chip chip" when alarmed; it may climb a tree or
// dive into a burrow), Animal Diversity Web (60 to 118 g; ears black in front and grey behind; underparts creamy
// white to grey). Not found: the outline of its head and body, how bushy its tail is.

export const published = {
  shown: 'an adult of the coastal race, T. t. townsendii',
  note: 'Published: the lengths and masses below; its colours (the sides rich tawny, five dark stripes black or dark brown, wide and not sharply set off, the pale stripes between them cinnamon, the underparts dull white, the tail blackish frosted with white above and tawny below, dark and pale stripes on the face, the ears black in front and grey behind); that it is quiet and shy, runs for cover when frightened (about one in ten up a tree), sits on stumps and logs, and chips when alarmed. Not found, and the agent\'s: the outline of the head and the body, how thick each part is, the legs\' bones, how bushy the tail is, and every pose.',
  sources: {
    Q: 'Dalquest 1948, Mammals of Washington: T. t. townsendii, 15 males and 10 females, the means of each sex: total length 254.7 and 258.6 mm, tail 116 and 122, hind foot 36.7 and 37.1, ear 20.5 and 20.4, weight 72 and 81.2 g (head and body is the total less the tail: the agent\'s arithmetic). T. t. cooperi, of the Olympic Mountains, 10 and 10: total 246.4 and 246.8, tail 111.7 and 107.6, hind foot 35 and 35.4, ear 20 and 20, weight 77 and 89.9 g',
    O: 'Oregon State University Extension, EC 1580: 8 3/4 to 11 inches long with a 3 to 5 inch tail; 2 to 4 oz; runs with its tail straight up; "chip chip chip" when alarmed',
    A: 'Animal Diversity Web, Neotamias townsendii: 60 to 118 g, 75 g on average; ears black in front, grey behind; underparts creamy white to grey',
  },
  lengths: [
    ['length', 'Head and body (nose to the root of the tail, along the back)', 0.1376, [0.1366, 0.1387], 'Q'],
    ['tail', 'Tail (its bone, root to tip)', 0.119, [0.116, 0.122], 'Q'],
    ['hindFoot', 'Hind foot (heel to the end of the claw)', 0.0369, [0.0367, 0.0371], 'Q'],
    ['ear', 'Ear (from its base)', 0.0205, [0.0204, 0.0205], 'Q'],
  ],
  proportions: [
    'Head and body 137 to 139 mm, tail 116 to 122 mm, by the means of each sex (Q): the tail is nearly as long as the head and body',
    'The largest chipmunk of Washington, its stripes wide and blurred (Q)',
    'Not found: the head\'s and the body\'s outline and girth, the legs\' bones, the length of the tail\'s hair (built at 13 mm either side)',
  ],
  mass: 'Males 72 g and females 81 g on average (Q); 60 to 118 g, 75 g on average (A); 2 to 4 oz (O)',
};

const TAWNY = [26, 46, 27], CINNAMON = [26, 40, 38], DARK = [22, 30, 9], BUFF = [30, 30, 48], WHITE = [38, 18, 76], GREYISH = [30, 18, 38];
const HEAD = [26, 36, 25], FACEDARK = [22, 32, 12], FACEPALE = [32, 30, 62], LEG = [28, 36, 32], FOOT = [30, 22, 44], NOSE = [18, 14, 13];
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };
// The stripes, wide and not sharply set off (Q): along the back, by how far round from the belly a place is (a: 0 the
// belly, 1 the middle of the back), from the rump to the shoulders (x, m); five dark and four pale. On the face, by
// how far a place lies above or below a line through the eye along the head (q, m), from behind the eye to the muzzle.
const U = 0.00691, EYE = [0.0641, 0.0470], X0 = -0.046, X1 = 0.025, HEAD_END = 0.0824;
const band = (a, at, half) => edge(half - Math.abs(a - at), 0.016);
const along = (p) => edge(p.x - X0, 0.005) * edge(X1 - p.x, 0.006);
const q = (p) => (p.y - EYE[1]) + 0.29 * (p.x - EYE[0]);
const face = (p, lo, hi) => (p.part === 'body' ? edge(q(p) - lo, 0.0006) * edge(hi - q(p), 0.0006) * edge(p.x - (EYE[0] - 1.6 * U), 0.002) * edge(HEAD_END - 0.5 * U - p.x, 0.0012) * edge(Math.abs(p.z) - 0.25 * U, 0.001) : 0);

export default {
  name: 'Townsend\'s chipmunk', latin: 'Neotamias townsendii', key: 'townsends-chipmunk', seed: 452,
  census: { tier: 'some', source: 'N C; the chipmunk of a low valley', extra: true, clock: 'day' },
  plan: 'beast',
  published,
  // How it lives on a visit (life/families/scurrier.js): about a stump or a log near the walk, on the floor round it
  // and on top of it; frozen a moment when a walker comes, then into cover under the wood, where it stays; one time
  // in ten up a trunk instead. Every number is the agent's.
  way: {
    family: 'scurrier', gap: [30, 120], there: 0.5, fastest: 7,
    homeOff: 10, range: 5, girth: 0.15, run: [1.8, 4], climb: [1.2, 2.4],
    notice: 12, flush: 5, startle: 10, near: 0, gone: 0.5, trees: false, scold: 0, up: 0.1, watch: false, feed: [5, 16],
    call: { every: [0.7, 1.4], reach: 45, what: 'chip' },
  },
  // (no recording under a licence that can be used: the only CC BY clips were made with a microphone on a collar, of
  // a chipmunk whose species was not confirmed)
  voices: { chip: { silent: true } },
  size: 0.256, body: { high: 0.055, long: 0.07, wide: 0.02 },
  // one stride of a walk, a trot and a gallop (life/beasts.js `stridesOf`); its family asks only for its scamper,
  // `scurry`, whose stride is shape.climb's (life/plateRig.js)
  strides: { walk: 0.09, trot: 0.18, gallop: 0.3 },
  // The body, in metres, standing on all fours: drawn as a plate (life/plate.js says what each drawing is; redrawn
  // 2026-11-19): the Douglas squirrel's drawing at 0.691 of its size, slimmer, its muzzle drawn longer and more pointed,
  // its ears, tail and hind feet as published (the agent's own, as the squirrel's is; no photograph was looked at).
  shape: {
    gait: 'bound',
    plate: {
      side: {
        top: [[0, -0.0498, 0.0401], [0.6, -0.0484, 0.047], [1.2, -0.0442, 0.0525], [2, -0.0373, 0.0567], [3, -0.0276, 0.0587], [4, -0.0166, 0.0574], [5, -0.0055, 0.0539], [6, 0.0055, 0.0498], [7, 0.0152, 0.0463], [8, 0.0242, 0.0456], [9, 0.0318, 0.047], [10, 0.0387, 0.0498], [11, 0.0442, 0.0532], [12, 0.0506, 0.0553], [13, 0.0585, 0.0546], [14, 0.0665, 0.0511], [15, 0.0736, 0.0456], [16, 0.0792, 0.0415], [16.6, 0.0816, 0.038], [17, 0.0824, 0.0352]],
        bottom: [[0, -0.0498, 0.0359], [0.6, -0.0491, 0.029], [1.2, -0.0456, 0.0235], [2, -0.0401, 0.02], [3, -0.0304, 0.0187], [4, -0.018, 0.0187], [5, -0.0055, 0.0193], [6, 0.0055, 0.02], [7, 0.0152, 0.0214], [8, 0.0242, 0.0242], [9, 0.0318, 0.0276], [10, 0.0387, 0.0318], [11, 0.0442, 0.0345], [12, 0.0506, 0.0352], [13, 0.0585, 0.0345], [14, 0.0665, 0.0339], [15, 0.0736, 0.0332], [16, 0.0792, 0.0325], [16.6, 0.0816, 0.0332], [17, 0.0824, 0.0345]],
      },
      above: [[0, 0.0036], [0.6, 0.0085], [1.2, 0.0122], [2, 0.0152], [3, 0.017], [4, 0.0176], [5, 0.017], [6, 0.0158], [7, 0.014], [8, 0.0122], [9, 0.0103], [10, 0.0097], [11, 0.0105], [12, 0.0113], [13, 0.0109], [14, 0.0094], [15, 0.0071], [16, 0.0046], [16.6, 0.0029], [17, 0.0013]],
      front: [[0, 0.5, 2.0, 2.0], [3, 0.5, 2.2, 2.2], [6, 0.52, 2.3, 2.2], [9, 0.5, 2.2, 2.0], [12, 0.5, 2.2, 2.0], [15, 0.5, 2.0, 2.0], [17, 0.5, 2.0, 2.0]],
      spine: [['hips', -0.0318, 0.0401], ['loin', -0.018, 0.0415], ['back', -0.0028, 0.0401], ['chest', 0.0124, 0.0359], ['neck1', 0.0263, 0.0373], ['neck2', 0.0332, 0.0401], ['neck3', 0.0387, 0.0428], ['head', 0.0442, 0.0456]],
      marks: { rump: 0.6, withers: [6.5, 8.5], poll: 11 },
      jaw: { hinge: [0.0458, 0.0387], from: 14.3, soft: 0.8, lips: 0.42, open: 0.35 },
      eye: { at: [0.0641, 0.047], r: 0.0032 },
    },
    // its paws (the bear's, life/parts/paw.js): small, the claws curved (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 3, hind: 3, curve: 1.3 },
    fore: {
      at: [0.0249, 0.0087],
      joints: [[0.0083, 0.0442, 0.0075], [0.0207, 0.0318, 0.0106], [0.0111, 0.02, 0.0106], [0.0235, 0.0069, 0.0087], [0.0249, 0.0035, 0.0087]],
      outline: [[0.0442, 0.0249, -0.0035, 0.0097, 0.0037], [0.0373, 0.029, -0.0014, 0.0128, 0.0044], [0.0311, 0.0297, 0.0014, 0.014, 0.005], [0.0249, 0.0263, 0.0041, 0.014, 0.0056], [0.0193, 0.0242, 0.0076, 0.0128, 0.0062], [0.0138, 0.0256, 0.0145, 0.0116, 0.0062], [0.0083, 0.0269, 0.0193, 0.0109, 0.0068], [0.0048, 0.0276, 0.0207, 0.0106, 0.0068], [0.0035, 0.0276, 0.0214, 0.0106, 0.0068]],
      foot: { long: 0.0152, wide: 0.0062 }, web: 0,
    },
    hind: {
      at: [-0.0345, 0.0106],
      joints: [[-0.0318, 0.0401, 0.0087], [-0.018, 0.0263, 0.0137], [-0.0401, 0.0069, 0.0106], [-0.0345, 0.0035, 0.0106]],
      outline: [[0.0442, -0.0193, -0.047, 0.0109, 0.0037], [0.0373, -0.0124, -0.0498, 0.0158, 0.0044], [0.0304, -0.0097, -0.0504, 0.0182, 0.005], [0.0249, -0.0111, -0.0484, 0.0189, 0.0062], [0.0193, -0.0173, -0.0456, 0.0176, 0.0075], [0.0138, -0.0249, -0.0442, 0.0158, 0.0081], [0.009, -0.0311, -0.0442, 0.0146, 0.0081], [0.0055, -0.0332, -0.0442, 0.014, 0.0081], [0.0035, -0.0332, -0.0442, 0.014, 0.0081]],
      foot: { long: 0.0448, wide: 0.0076 }, web: 0,
    },
    ear: { at: [0.0494, 0.0532], side: 0.0072, length: 0.0205, width: 0.0125, out: 18, open: 30, round: 0.55, back: 12 },
    // the tail's bone (published) and its brush (the agent's: the hair's length is the old sheet's)
    tail: { at: [-0.047, 0.0428], length: 0.119, width: 0.0068, depth: 0.006, hang: 100 },
    brush: { long: 13, round: 7, past: 0.7, core: 0.6, taper: 0.15, carry: { droop: 0.2, up: 1.35, curl: 1.4, run: -0.6, sit: 0.3 } },
    teeth: { long: 3, wide: 2.2 },
    whiskers: { long: 26, count: 4 },
    // how it climbs and scampers (life/families/scurrier.js runs `cycle` by climb.stride; life/plateRig.js)
    climb: { stride: 0.3, splay: 0.014, flex: 0.35 },
    // sitting up on its haunches (life/plateRig.js): the hips this high, the body turned up this far (radians)
    sit: { high: 0.0152, pitch: 1.25, arch: 0.25, back: 0.15, fore: 0.1 },
    neck: { low: [-0.55, -0.35, -0.3, 0.35], high: [0.28, 0.16, 0.12, -0.1], dip: -0.035 },
    lie: { drop: 0.012, fore: { top: [0.012, 0.007], fetlock: [0.018, 0.0025], out: 1.0, hoof: 0 }, hind: { top: [-0.006, 0.007], fetlock: [-0.012, 0.0025], out: 1.2, hoof: 0 } },
  },
  // The coat, as paint (life/plateCoat.js says what each table is): the sides rich tawny, five dark stripes black or
  // dark brown, wide and not sharply set off, the pale ones between them cinnamon; the underparts dull white; dark and
  // pale stripes on the face (Q). Every shade and boundary is the agent's.
  coat: {
    rules: [
      { colour: TAWNY },                                                                                                       // the sides rich tawny (Q)
      { colour: GREYISH, where: (p) => (p.part === 'body' ? 0.55 * edge(-0.032 - p.x, 0.008) * edge(p.a - 0.5, 0.1) : 0) },  // the rump greyer
      { colour: DARK, where: (p) => (p.part === 'body' ? band(p.a, 0.7, 0.035) * along(p) : 0) },                              // the five dark stripes (Q)
      { colour: BUFF, where: (p) => (p.part === 'body' ? band(p.a, 0.775, 0.034) * along(p) : 0) },                            // with paler ones between them
      { colour: DARK, where: (p) => (p.part === 'body' ? band(p.a, 0.85, 0.035) * along(p) : 0) },
      { colour: CINNAMON, where: (p) => (p.part === 'body' ? band(p.a, 0.915, 0.03) * along(p) : 0) },
      { colour: WHITE, where: (p) => (p.part === 'body' ? edge(0.26 - p.a, 0.04) : 0) },                                       // dull white below (Q)
      { colour: HEAD, where: (p) => (p.part === 'body' ? edge(p.t - 10.4, 0.5) * edge(p.a - 0.32, 0.06) : 0) },
      { colour: DARK, where: (p) => (p.part === 'body' ? edge(p.a - 0.955, 0.012) * edge(p.x - X0, 0.005) * edge(EYE[0] - p.x, 0.004) : 0) },   // the middle one on to the head
      { colour: FACEPALE, where: (p) => face(p, 0.3 * U, 0.62 * U) },
      { colour: FACEDARK, where: (p) => face(p, -0.24 * U, 0.24 * U) },                                                       // through the eye
      { colour: FACEPALE, where: (p) => face(p, -0.66 * U, -0.32 * U) },
      { colour: FACEDARK, where: (p) => face(p, -1.0 * U, -0.74 * U) * edge(p.x - EYE[0] + 0.4 * U, 0.0012) },
      { colour: WHITE, where: (p) => (p.part === 'body' ? edge(0.3 - p.a, 0.04) * edge(p.t - 10, 0.4) : 0) },                  // the chin and the throat
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 16.55, 0.1) * edge(p.a - 0.42, 0.06) : 0) },
      { colour: LEG, where: (p) => (p.part === 'limb' ? edge(0.03 - p.y, 0.007) : 0) },
      { colour: FOOT, where: (p) => (p.part === 'limb' ? edge(0.009 - p.y, 0.003) : 0) },
    ],
    planes: [],
    tones: { light: [3, -4, 7], shade: [-2, 2, -6] },
    turn: { top: 1, under: 0.8 },
    hair: { count: 0.4, long: 0.005 },
    claw: [26, 14, 18], pad: [26, 14, 32],
    ear: { outer: [30, 8, 40], inner: [22, 20, 13], edge: [30, 12, 55] },                                                 // black in front, grey behind (A)
    eye: { iris: [20, 30, 7], pupil: [0, 0, 3] },
    // the brush: blackish frosted with white above, tawny below (Q)
    bush: { top: [24, 16, 14], band: [22, 18, 9], fringe: [36, 14, 70], under: [27, 58, 40] },
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
  studio: { high: 0.12, tall: 0.08, middle: 0.0,
    rows: [
      { span: 0.28, high: 0.2, cells: [['adult', 'adult', 'alert', 'side'], ['front', 'adult', 'alert', 'front'], ['behind', 'adult', 'alert', 'behind'], ['three-quarters', 'adult', 'alert', 'quarter']] },
      { span: 0.28, high: 0.17, cells: [['from above', 'adult', null, 'above'], ['scampering, gathered', 'adult', 'scamper', 'side'], ['scampering, stretched', 'adult', 'stretched', 'side'], ['nose in the litter', 'adult', 'sniff', 'quarter']] },
      { span: 0.28, high: 0.16, cells: [['sitting up', 'adult', 'sit', 'side'], ['sitting up, watching you', 'adult', 'watch', 'quarter'], ['frozen still', 'adult', 'frozen', 'quarter'], ['up a trunk (one time in ten)', 'adult', 'climb', 'up']] },
    ] },
  card: {
    size: 'About 26 cm from nose to tail\'s end, of which the tail is 12 cm; 70 to 80 g.',
    marks: ['Rich tawny, with five dark stripes down the back, wide and soft-edged, cinnamon between them', 'Dark and pale stripes on the face', 'A long, bushy tail, blackish frosted with white, carried straight up as it runs'],
    lives: 'In the coast\'s wet forests, among logs and stumps by trails and the edges of clearings: it feeds on the ground and on the dead wood, on seeds, berries, fungi and insects, and sits up on a stump to look about. It is quiet and shy, and at a person\'s approach it runs into cover and is not seen again; now and then one climbs high into a tree instead. Alarmed, it chips, fast and high.',
  },
};
