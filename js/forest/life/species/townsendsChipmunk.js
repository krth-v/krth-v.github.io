// Townsend's chipmunk, Neotamias townsendii (Tamias townsendii in older works): the large dark chipmunk of the
// coast's humid forests, and the chipmunk of a low valley on the west side of the Olympics. Built by life/beast.js
// with the parts of life/parts/rodent.js (a bushy tail, a rodent's head), posed by life/parts/rodentRig.js; how it
// lives is life/families/scurrier.js.
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

const TAWNY = [27, 48, 34], CINNAMON = [26, 42, 47], DARK = [22, 30, 11], BUFF = [30, 34, 56], WHITE = [38, 18, 76], GREYISH = [30, 18, 38];
const HEAD = [26, 38, 30], FACEDARK = [22, 32, 12], FACEPALE = [32, 30, 62];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const band = (x, at, half) => smooth(at - half, at - half * 0.35, x) * (1 - smooth(at + half * 0.35, at + half, x));
// the stripes run from the rump to the shoulders (x, m), the middle one on to the head
const along = (x) => smooth(-0.045, -0.032, x) * (1 - smooth(0.022, 0.034, x));
const EYE = { s: 0.0092, up: 0.0062, side: 0.0100, r: 0.0029 };

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
  studio: { wide: 0.65, bar: 0.1 },
  // The body, in metres, standing on all fours: the Douglas squirrel's drawing at 0.706 of its size and slimmer, its
  // muzzle longer, its ears and hind feet as published (the agent's own, as the squirrel's is).
  shape: {
    unit: 0.07,
    trunk: [
      [-0.0494, 0.0452, -0.0508, 0.0353, 0.0061, 0.5, 2], [-0.0466, 0.0501, -0.0487, 0.024, 0.0121, 0.52, 2.1], [-0.0402, 0.0544, -0.0409, 0.0176, 0.0158, 0.5, 2.25],
      [-0.0297, 0.0558, -0.0289, 0.0155, 0.017, 0.5, 2.3], [-0.0169, 0.0544, -0.0162, 0.0162, 0.017, 0.5, 2.3], [-0.0042, 0.0515, -0.0035, 0.0176, 0.0158, 0.52, 2.25],
      [0.0085, 0.048, 0.0099, 0.0191, 0.0146, 0.54, 2.2], [0.0198, 0.0459, 0.0212, 0.0205, 0.0128, 0.56, 2.15], [0.0289, 0.0459, 0.0311, 0.0233, 0.0109, 0.55, 2.1],
      [0.036, 0.048, 0.0388, 0.0282, 0.0097, 0.52, 2.05], [0.0417, 0.0515, 0.0445, 0.0332, 0.0091, 0.5, 2], [0.0459, 0.0551, 0.0487, 0.0381, 0.0085, 0.5, 2],
    ],
    withers: [0.0141, 0.0318],
    spine: { hips: [-0.0311, 0.0381], chest: [0.0071, 0.0353], neck1: [0.0311, 0.0367], neck2: [0.0381, 0.0409], neck3: [0.0438, 0.0452] },
    blend: [0.0141, 0.0085, 0.0056, 0.0049, 0.0042],
    head: {
      at: [0.0466, 0.048], tilt: -16, square: 1.8, jaw: [0.0184, -0.0042],
      stations: [[-0.0099, 0.0056, 0.0064, 0.0055], [-0.0056, 0.0102, 0.009, 0.0086], [0.0, 0.0128, 0.0103, 0.0104], [0.0056, 0.0136, 0.0104, 0.0108], [0.0113, 0.0126, 0.0097, 0.0102],
        [0.0169, 0.0104, 0.0085, 0.0085], [0.0219, 0.0081, 0.0072, 0.007], [0.0275, 0.0058, 0.0054, 0.0049], [0.0316, 0.0038, 0.0037, 0.0034]],
      eye: EYE,
      incisors: { long: 3, wide: 2.2 },
      whiskers: { long: 26, count: 4 },
    },
    ear: { s: -0.002, up: 0.0105, side: 0.0062, length: 0.0205, width: 0.0125, out: 18, open: 30, round: 0.55 },
    tail: { at: [-0.048, 0.0438], length: 0.119, width: 0.0068, depth: 0.006, hang: 100, bush: { long: 13, round: 6 } },
    fore: {
      at: [0.024, 0.0072], scapula: [0.0212, 0.0424], bones: [0.0155, 0.0169, 0.0099], angles: [28, -6, -72], pastern: [0.0049, 0.0014], hoof: [0.0042, 0.0018, 0.0042],
      girth: [[0, 0.0043, 0.0036, 0], [0.0078, 0.0046, 0.0039, 0.0007], [0.0155, 0.003, 0.0027, 0], [0.024, 0.0026, 0.0023, 0], [0.0325, 0.0021, 0.0021, 0], [0.0374, 0.0013, 0.0024, 0], [0.0424, 0.0011, 0.0026, 0]],
      share: { at: [0.0226, 0.0247], reach: [0.0113, 0.0099], most: 0.5 },
    },
    hind: {
      at: [-0.0325, 0.0081], bones: [0.0254, 0.0299, 0.0239], angles: [-48, 52, -80], pastern: [0.0067, 0.0011], hoof: [0.0052, 0.0019, 0.006],
      girth: [[0, 0.0073, 0.0049, 0], [0.009, 0.0085, 0.0056, 0.0014], [0.0195, 0.0067, 0.0055, 0.0007], [0.0269, 0.0049, 0.0039, 0], [0.0389, 0.0036, 0.003, 0],
        [0.0509, 0.0026, 0.0026, 0], [0.0554, 0.0024, 0.0027, 0], [0.0674, 0.0017, 0.0033, 0], [0.0793, 0.0013, 0.0035, 0]],
      share: { at: [-0.0282, 0.0268], reach: [0.0155, 0.0141], most: 0.6 },
    },
    neck: { low: [-0.55, -0.35, -0.3, 0.35], high: [0.28, 0.16, 0.12, -0.1], dip: -0.035 },
    lie: { drop: 0.014, fore: { top: [0.014, 0.008], fetlock: [-0.007, 0.003], out: 1.0, hoof: -0.5 }, hind: { top: [-0.007, 0.008], fetlock: [0.014, 0.003], out: 1.2, hoof: 0.2 } },
    climb: { stride: 0.3, splay: 0.014, flex: 0.35 },
  },
  coat: {
    body: [
      { colour: TAWNY },                                                                                                   // the sides rich tawny (Q)
      { colour: GREYISH, where: (p) => 0.6 * (1 - smooth(-0.044, -0.03, p.x)) * smooth(0.4, 0.7, p.a) },                  // the rump greyer
      { colour: BUFF, where: (p) => band(p.a, 0.61, 0.05) * along(p.x) },                                                  // the lowest pale stripe
      { colour: DARK, where: (p) => band(p.a, 0.69, 0.045) * along(p.x) },                                                 // and the five dark ones (Q)
      { colour: CINNAMON, where: (p) => band(p.a, 0.775, 0.045) * along(p.x) },                                            // with cinnamon between them
      { colour: DARK, where: (p) => band(p.a, 0.86, 0.045) * along(p.x) },
      { colour: CINNAMON, where: (p) => band(p.a, 0.93, 0.035) * along(p.x) },
      { colour: DARK, where: (p) => smooth(0.95, 0.985, p.a) * smooth(-0.045, -0.032, p.x) },                               // the middle one on to the head
      { colour: WHITE, where: (p) => 1 - smooth(0.2, 0.3, p.a) },                                                         // dull white below (Q)
    ],
    head: [
      { colour: HEAD },
      { colour: DARK, where: (p) => smooth(0.009, 0.012, p.up) * (1 - smooth(0.003, 0.005, Math.abs(p.z))) },              // the middle stripe over the crown
      { colour: FACEPALE, where: (p) => band(p.up, EYE.up + 0.0034, 0.0015) * smooth(-0.006, -0.002, p.s) * (1 - smooth(0.02, 0.025, p.s)) },
      { colour: FACEDARK, where: (p) => band(p.up, EYE.up, 0.0017) * smooth(-0.008, -0.004, p.s) * (1 - smooth(0.024, 0.028, p.s)) },     // through the eye
      { colour: FACEPALE, where: (p) => band(p.up, EYE.up - 0.0036, 0.0016) * smooth(-0.006, -0.002, p.s) * (1 - smooth(0.022, 0.026, p.s)) },
      { colour: FACEDARK, where: (p) => band(p.up, EYE.up - 0.0066, 0.0013) * smooth(-0.006, -0.003, p.s) * (1 - smooth(0.014, 0.018, p.s)) },
      { colour: WHITE, where: (p) => 1 - smooth(-0.009, -0.004, p.up) },                                                  // the chin and the throat
      { colour: [18, 14, 13], where: (p) => smooth(0.029, 0.0315, p.s) * smooth(-0.002, 0.0, p.up) },                       // the nose
    ],
    leg: ({ d, pastern }) => (pastern ? [30, 22, 44] : [28, 36, 30 + 10 * smooth(0.4, 1, d)]),
    hoof: [26, 14, 18],
    ear: { outer: [30, 8, 40], inner: [22, 20, 13], edge: [30, 12, 55] },                                                // black in front, grey behind (A)
    tail: { top: [24, 18, 15], under: [27, 58, 40] },
    antler: [30, 10, 30],
    eye: { iris: [20, 30, 7], pupil: [0, 0, 3] },
    hair: { long: () => false },
    fur: 1.8,
    // the brush: blackish frosted with white above, tawny below (Q)
    bush: { top: [24, 16, 14], band: [22, 18, 9], fringe: [36, 14, 70], under: [27, 58, 40] },
    bits: { teeth: [32, 78, 52], whiskers: [30, 12, 9], cone: [24, 42, 27], flake: [26, 44, 33] },
  },
  card: {
    size: 'About 26 cm from nose to tail\'s end, of which the tail is 12 cm; 70 to 80 g.',
    marks: ['Rich tawny, with five dark stripes down the back, wide and soft-edged, cinnamon between them', 'Dark and pale stripes on the face', 'A long, bushy tail, blackish frosted with white, carried straight up as it runs'],
    lives: 'In the coast\'s wet forests, among logs and stumps by trails and the edges of clearings: it feeds on the ground and on the dead wood, on seeds, berries, fungi and insects, and sits up on a stump to look about. It is quiet and shy, and at a person\'s approach it runs into cover and is not seen again; now and then one climbs high into a tree instead. Alarmed, it chips, fast and high.',
  },
};
