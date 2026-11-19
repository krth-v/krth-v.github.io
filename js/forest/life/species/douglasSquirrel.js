// Douglas squirrel, Tamiasciurus douglasii: the small tree squirrel of the Pacific coast's conifer forests, and the
// one a walker meets in the Olympic valleys. Drawn as a plate (life/plate.js; 2026-11-19), with a bushy tail, a
// rodent's teeth and whiskers and a cone in its paws (life/plate.js `smallParts`), posed by life/plateRig.js, painted
// by life/plateCoat.js; how it lives is life/families/scurrier.js.
//
// What was read (2026-11-16; none of it seen as an image). Dalquest, W. W. 1948, Mammals of Washington (University of
// Kansas Publications, Museum of Natural History 2), its account of T. d. douglasii, read whole as plain text (Project
// Gutenberg 53582, from a mirror): the measurements below, its colour against the red squirrel's, its nests, its
// calls, its food and how its habits change with the season. And what agents read on 2026-11-16 and checked against
// a second reading, kept in .local-assets/forest/research/beasts-herps-2026-11-16.json: Animal Diversity Web (lengths,
// mass, the summer coat, the black line on the side, the tail), Wikipedia (the white eye ring, brown legs and feet),
// NatureMapping (the side line in summer; cones stripped and the scales piled in middens), birdandhike (an orange eye
// ring, the tail edged pale), the Park Service's Olympic page (common in all the park's forests; grey with an orangish
// chest in spring and summer; small pointed ears, black eyes). Not found: Steele 1999 (Mammalian Species 630) could
// not be opened; no measurement of the Olympic Peninsula's own squirrels; how it holds its tail and body, its gaits.

export const published = {
  shown: 'an adult in its summer coat',
  note: 'Published: the lengths and masses below, the colours (dusky olive above, orange below, a black line along each side in summer, a pale ring round the eye, the tail above like the back with a black band and its hairs\' tips orange or yellow in Washington), that it climbs up and down trees head first and leaps from branch to branch, that it strips the scales from cones and leaves them in heaps, and its calls. Not found, and the agent\'s: the outline of the head and the body, how thick each part is, the legs\' bones, how bushy the tail is, and every pose.',
  sources: {
    Q: 'Dalquest 1948, Mammals of Washington: 15 males and 10 females from the lowlands of western Washington, the means of each sex: total length 317 and 320 mm, tail 121 and 126.7, hind foot 50 and 49.4, ear 23.2 and 22.6, weight 204 and 202 g (head and body is the total less the tail: the agent\'s arithmetic)',
    A: 'Animal Diversity Web, Tamiasciurus douglasii: 270 to 355 mm long (with the tail, as a second reader judged), tail 100 to 160 mm, hind foot 44 to 60 mm, 141 to 312 g',
    W: 'Wikipedia, "Douglas squirrel": about 33 cm with a tail of about 13 cm; 150 to 300 g; a white eye ring; brown legs and feet',
    N: 'National Park Service, Olympic National Park, "Douglas squirrel": common throughout the park\'s forests',
    M: 'NatureMapping Foundation, Douglas squirrel: a blackish line on its sides in summer; cones cut, stored and stripped, the scales left in heaps',
  },
  // [key, label, value (m), [least, most], source]
  lengths: [
    ['length', 'Head and body (nose to the root of the tail, along the back)', 0.195, [0.1933, 0.196], 'Q'],
    ['tail', 'Tail (its bone, root to tip)', 0.1233, [0.121, 0.1267], 'Q'],
    ['hindFoot', 'Hind foot (heel to the end of the claw)', 0.0498, [0.0494, 0.05], 'Q'],
    ['ear', 'Ear (from its base)', 0.0229, [0.0226, 0.0232], 'Q'],
  ],
  proportions: [
    'Head and body 193 to 196 mm, tail 121 to 127 mm, by the means of each sex (Q); the tail is about two thirds of the head and body',
    'About half the size of a grey squirrel, with a broad bushy tail; the sexes alike (A)',
    'Not found: the head\'s and the body\'s outline and girth, the legs\' bones, the length of the tail\'s hair (built at 22 mm either side)',
  ],
  mass: 'Males 204 g and females 202 g on average (Q); 141 to 312 g (A); 150 to 300 g (W)',
};

// The summer coat, as paint: [hue, saturation, lightness]. Its pattern is the sources'; each shade, and where each
// boundary runs, the agent's.
const OLIVE = [36, 18, 17], RUST = [24, 32, 20], FLANK = [36, 17, 21], LINE = [28, 22, 8];
const ORANGE = [29, 70, 50], DEEP = [25, 70, 42], HEAD = [36, 18, 17], RING = [38, 42, 66], NOSE = [18, 14, 13], LEG = [30, 20, 18];
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };
// the pale ring round the eye (its middle is the plate's eye: shape.plate.eye.at), on the side of the head
const ring = (p) => { const d = Math.hypot(p.x - 0.089, p.y - 0.068); return edge(d - 0.0049, 0.0006) * edge(0.0066 - d, 0.0006) * edge(Math.abs(p.z) - 0.008, 0.002); };

export default {
  name: 'Douglas squirrel', latin: 'Tamiasciurus douglasii', key: 'douglas-squirrel', seed: 451,
  census: { tier: 'most', source: 'N C', clock: 'day' },
  plan: 'beast',
  // How it lives on a visit (life/families/scurrier.js): about a big trunk near the walk, its post (a stump or a
  // log where it strips its cones) and the floor between; up its trunk out of reach when a walker comes, where it
  // chatters at them or keeps the trunk between; off round the trunk and up it when they come too near. Every number
  // is the agent's: a territory of about a hectare (A) set as no other squirrel's home within 55 m.
  way: {
    family: 'scurrier', gap: [40, 150], there: 0.6, fastest: 9,
    homeOff: 24, range: 16, territory: 55, girth: 0.22, run: [2.6, 5.5], climb: [1.6, 3.2], safe: [2.5, 5.5],
    notice: 20, flush: 5, startle: 11, near: 0.6, gone: 0.35, trees: true, scold: 0.15, up: 1, watch: false, feed: [18, 50],   // (scold: the agent's number, lowered from 0.45 on 2026-11-16 to agree with the card: it is May)
    call: { every: [2.2, 4.2], reach: 90, what: 'alarm' },
  },
  // (Dalquest's "short barking or chirping 'bauf' ... when a person is sighted": no recording under a licence that
  // can be used was found, only CC BY-SA ones)
  voices: { alarm: { silent: true } },
  published,
  // how long it is, nose to the end of the tail, for what can be seen of it; its body (how high its back stands,
  // half its length, half its width), for whether two bodies are in one another
  size: 0.32, body: { high: 0.08, long: 0.1, wide: 0.03 },
  // one stride of a walk, a trot and a gallop (life/beasts.js `stridesOf`); its family asks only for its scamper,
  // `scurry`, whose stride is shape.climb's (life/plateRig.js)
  strides: { walk: 0.12, trot: 0.25, gallop: 0.42 },
  // The body, in metres, standing on all fours: drawn as a plate (life/plate.js says what each drawing is; redrawn
  // 2026-11-19). Every number is the agent's but the lengths measured above, from memory of tree squirrels and of
  // field-guide plates of them (no photograph was looked at): a compact body, the back rising to big haunches; the
  // head high on a short neck, round over the skull, the eye big, the muzzle short and blunt; short forelegs with the
  // forefeet under the chest; long hind feet; a bushy tail as long as two thirds of the body, flattened, its hair a
  // card's ragged edge (shape.brush).
  shape: {
    gait: 'bound',
    plate: {
      side: {
        //     t      x       y
        top: [[0, -0.072, 0.058], [0.6, -0.070, 0.068], [1.2, -0.064, 0.076], [2, -0.054, 0.082], [3, -0.040, 0.085],     // the rump, the haunches
          [4, -0.024, 0.083], [5, -0.008, 0.078], [6, 0.008, 0.072], [7, 0.022, 0.067], [8, 0.035, 0.066],                // the loins, the back, the shoulders
          [9, 0.046, 0.068], [10, 0.056, 0.072], [11, 0.064, 0.077], [12, 0.072, 0.080], [13, 0.082, 0.079],             // the neck, the poll, the round skull
          [14, 0.092, 0.074], [15, 0.101, 0.066], [16, 0.108, 0.060], [16.6, 0.111, 0.055], [17, 0.112, 0.051]],         // the brow, the short blunt muzzle
        bottom: [[0, -0.072, 0.052], [0.6, -0.071, 0.042], [1.2, -0.066, 0.034], [2, -0.058, 0.029], [3, -0.044, 0.027],
          [4, -0.026, 0.027], [5, -0.008, 0.028], [6, 0.008, 0.029], [7, 0.022, 0.031], [8, 0.035, 0.035],               // the belly, the chest
          [9, 0.046, 0.040], [10, 0.056, 0.046], [11, 0.064, 0.050], [12, 0.072, 0.051], [13, 0.082, 0.050],            // the throat, under the jaw
          [14, 0.092, 0.049], [15, 0.101, 0.048], [16, 0.108, 0.047], [16.6, 0.111, 0.048], [17, 0.112, 0.050]],         // the chin
      },
      above: [[0, 0.006], [0.6, 0.014], [1.2, 0.020], [2, 0.025], [3, 0.028], [4, 0.029], [5, 0.028], [6, 0.026], [7, 0.023], [8, 0.020],
        [9, 0.017], [10, 0.016], [11, 0.0165], [12, 0.0178], [13, 0.0172], [14, 0.0148], [15, 0.0112], [16, 0.0072], [16.6, 0.0045], [17, 0.002]],
      front: [[0, 0.5, 2.0, 2.0], [3, 0.5, 2.2, 2.2], [6, 0.52, 2.3, 2.2], [9, 0.5, 2.2, 2.0], [12, 0.5, 2.2, 2.0], [15, 0.5, 2.1, 2.1], [17, 0.5, 2.0, 2.0]],
      spine: [['hips', -0.046, 0.058], ['loin', -0.026, 0.060], ['back', -0.004, 0.058], ['chest', 0.018, 0.052],
        ['neck1', 0.038, 0.054], ['neck2', 0.048, 0.058], ['neck3', 0.056, 0.062], ['head', 0.064, 0.066]],
      marks: { rump: 0.6, withers: [6.5, 8.5], poll: 11 },
      jaw: { hinge: [0.066, 0.056], from: 14.3, soft: 0.8, lips: 0.42, open: 0.35 },
      eye: { at: [0.089, 0.068], r: 0.0044 },
    },
    // its paws (the bear's, life/parts/paw.js): the forefeet small, the hind feet long, the claws small and curved for
    // the bark (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 4, hind: 4.5, curve: 1.3 },
    fore: {
      at: [0.036, 0.014],
      //        the blade's top        the point of the shoulder  the elbow             the wrist              over the pad
      joints: [[0.012, 0.064, 0.012], [0.030, 0.046, 0.017], [0.016, 0.029, 0.017], [0.034, 0.010, 0.014], [0.036, 0.005, 0.014]],
      //          y      front   back    out    in
      outline: [[0.064, 0.036, -0.005, 0.016, 0.006], [0.054, 0.042, -0.002, 0.021, 0.007], [0.045, 0.043, 0.002, 0.023, 0.008],
        [0.036, 0.038, 0.006, 0.023, 0.009], [0.028, 0.035, 0.011, 0.021, 0.010], [0.020, 0.037, 0.021, 0.019, 0.010],
        [0.012, 0.039, 0.028, 0.018, 0.011], [0.007, 0.040, 0.030, 0.0175, 0.011], [0.005, 0.040, 0.031, 0.0175, 0.011]],
      foot: { long: 0.022, wide: 0.009 }, web: 0,
    },
    hind: {
      at: [-0.05, 0.017],
      //        the hip                 the knee                the ankle               over the pad
      joints: [[-0.046, 0.058, 0.014], [-0.026, 0.038, 0.022], [-0.058, 0.010, 0.017], [-0.050, 0.005, 0.017]],
      outline: [[0.064, -0.028, -0.068, 0.018, 0.006], [0.054, -0.018, -0.072, 0.026, 0.007], [0.044, -0.014, -0.073, 0.030, 0.008],
        [0.036, -0.016, -0.070, 0.031, 0.010], [0.028, -0.025, -0.066, 0.029, 0.012], [0.020, -0.036, -0.064, 0.026, 0.013],
        [0.013, -0.045, -0.064, 0.024, 0.013], [0.008, -0.048, -0.064, 0.023, 0.013], [0.005, -0.048, -0.064, 0.023, 0.013]],
      foot: { long: 0.058, wide: 0.011 }, web: 0,
    },
    ear: { at: [0.071, 0.077], side: 0.011, length: 0.0229, width: 0.0135, out: 22, open: 32, round: 0.65, back: 15 },
    // the tail's bone (published) and its brush: the hair 24 mm either side and 13 above and below (the agent's)
    tail: { at: [-0.068, 0.062], length: 0.1233, width: 0.011, depth: 0.0095, hang: 98 },
    brush: { long: 22, round: 13, past: 0.75, core: 0.6, taper: 0.1, carry: { droop: 0.25, up: 1.35, curl: 1.6, run: 0.45, sit: 0.3 } },
    teeth: { long: 4, wide: 3 },
    whiskers: { long: 34, count: 4 },
    // a Douglas-fir's cone from last autumn's store (its size the agent's)
    cone: { long: 62, wide: 26 },
    // how it climbs and scampers (life/families/scurrier.js runs `cycle` by climb.stride; life/plateRig.js): one bound's
    // stride at a run (m), how far its feet spread on the bark, how far its back gathers
    climb: { stride: 0.42, splay: 0.02, flex: 0.35 },
    // sitting up on its haunches (life/plateRig.js): the hips this high, the body turned up this far (radians)
    sit: { high: 0.022, pitch: 1.2, arch: 0.25, back: 0.15, fore: 0.1 },
    // the neck's four joints turned from as it stands (radians): nose to the ground, and head up; `dip`, how far the
    // chest goes down with it
    neck: { low: [-0.55, -0.35, -0.3, 0.35], high: [0.28, 0.16, 0.12, -0.1], dip: -0.05 },
    lie: { drop: 0.02, fore: { top: [0.02, 0.012], fetlock: [0.03, 0.004], out: 1.0, hoof: 0 }, hind: { top: [-0.01, 0.012], fetlock: [-0.02, 0.004], out: 1.2, hoof: 0 } },
  },
  // The summer coat, as paint (life/plateCoat.js says what each table is): dusky olive above, rust along the back,
  // orange below and up the throat, a black line along each side, a pale ring round the eye, brown legs and feet.
  coat: {
    rules: [
      { colour: OLIVE },                                                                                                                    // dusky olive above (Q)
      { colour: FLANK, where: (p) => (p.part === 'body' ? edge(0.55 - p.a, 0.08) * edge(10 - p.t, 0.6) : edge(0.045 - p.y, 0.01)) },
      { colour: RUST, where: (p) => (p.part === 'body' ? 0.7 * edge(p.a - 0.8, 0.06) * edge(p.x + 0.055, 0.01) * edge(0.04 - p.x, 0.01) : 0) },   // some rust along the back (A)
      { colour: LINE, where: (p) => (p.part === 'body' ? edge(0.022 - Math.abs(p.a - 0.33), 0.012) * edge(p.x + 0.05, 0.008) * edge(0.034 - p.x, 0.008) : 0) },   // the black line along the side, in summer (M, A)
      { colour: ORANGE, where: (p) => (p.part === 'body' ? Math.max(edge(0.28 - p.a, 0.03), edge(0.44 - p.a, 0.04) * edge(p.t - 8.6, 0.5) * edge(11.2 - p.t, 0.4), edge(0.3 - p.a, 0.03) * edge(15.5 - p.t, 0.4)) : (p.out < -0.2 && !p.hind ? edge(p.y - 0.012, 0.004) : 0)) },   // orange below, up the breast to the chin (Q)
      { colour: DEEP, where: (p) => (p.part === 'body' ? 0.55 * edge(0.12 - p.a, 0.05) * edge(9 - p.t, 0.6) : 0) },
      { colour: HEAD, where: (p) => (p.part === 'body' ? edge(p.t - 11, 0.5) * edge(p.a - 0.48, 0.05) : 0) },
      { colour: RING, where: (p) => (p.part === 'body' ? ring(p) : 0) },                                                                     // a pale ring round the eye (W)
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 16.55, 0.12) * edge(p.a - 0.42, 0.06) : 0) },
      { colour: LEG, where: (p) => (p.part === 'limb' ? edge(0.03 - p.y, 0.01) : 0) },                                                      // brown legs and feet (W)
    ],
    planes: [],
    tones: { light: [3, -4, 8], shade: [-2, 2, -6] },
    turn: { top: 1, under: 0.8 },
    hair: { count: 0.5, long: 0.006 },
    claw: [25, 12, 14], pad: [26, 14, 24],
    ear: { outer: [34, 22, 28], inner: [28, 24, 40], edge: [30, 18, 15] },
    eye: { iris: [20, 30, 7], pupil: [0, 0, 3] },
    // the brush of the tail: like the back above, then a black band, and the hairs' tips orange or yellow (Q, A); rusty below
    bush: { top: [38, 22, 20], band: [28, 20, 8], fringe: [34, 62, 52], under: [22, 46, 32] },
    bits: { teeth: [30, 80, 50], whiskers: [30, 12, 9], cone: [24, 42, 27], flake: [26, 44, 33] },
  },
  // Who it may be, and the poses its contact sheet shows: each the fields its family asks for (life/families/scurrier.js)
  who: { adult: {} },
  poses: {
    alert: { neck: 0.95, ears: 0.6, tail: 0.55, curl: 0.3 },
    scamper: { scurry: 1, cycle: 0.1, tail: 0.55, curl: 0.3 },
    stretched: { scurry: 1, cycle: 0.6, tail: 0.55, curl: 0.3 },
    sit: { sit: 1, tail: 0.75, curl: 0.5, neck: 0.55 },
    eat: { sit: 1, hold: 1, strip: 1, husk: 0.6, jaw: 0.4, neck: 0.45, tail: 0.75, curl: 0.5, head: { pitch: -0.25 } },
    climb: { cling: 1, scurry: 0.6, cycle: 0.3, tail: 0.35, curl: 0.15, neck: 0.75 },
    down: { cling: 1, down: 1, tail: 0.6, curl: 0.15, neck: 0.95, ears: 0.6 },
    crouch: { crouch: 1, tail: 0.1, curl: 0, neck: 0.5, ears: -0.4 },
    sniff: { neck: 0.05, head: { pitch: -0.2 }, tail: 0.55, curl: 0.3 },
    flick: { neck: 0.9, tail: 0.6, curl: 0.3, flick: 0.8, jaw: 0.5 },
  },
  studio: { high: 0.14, tall: 0.1, middle: 0.0,
    rows: [
      { span: 0.36, high: 0.18, cells: [['adult', 'adult', 'alert', 'side'], ['front', 'adult', 'alert', 'front'], ['behind', 'adult', 'alert', 'behind'], ['three-quarters', 'adult', 'alert', 'quarter']] },
      { span: 0.36, high: 0.15, cells: [['from above', 'adult', null, 'above'], ['scampering, gathered', 'adult', 'scamper', 'side'], ['scampering, stretched', 'adult', 'stretched', 'side'], ['nose in the litter', 'adult', 'sniff', 'quarter']] },
      { span: 0.36, high: 0.2, cells: [['sitting up', 'adult', 'sit', 'side'], ['stripping a cone', 'adult', 'eat', 'quarter'], ['on a trunk, climbing', 'adult', 'climb', 'up'], ['chattering, tail flicked', 'adult', 'flick', 'quarter']] },
    ] },
  // The words of the information card, drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 32 cm from nose to tail\'s end, of which the tail is 12 to 13 cm; about 200 g.',
    marks: ['Dusky olive above, orange below, with a black line along each side in summer', 'A pale ring round each eye', 'A broad, bushy tail, black near its edge, its hairs tipped orange', 'Climbs up and down a trunk head first, and leaps from branch to branch'],
    lives: 'In the conifer forests of the Pacific coast, the Olympic valleys among them, all year: it lives on the seeds of Douglas-fir, spruce and hemlock, cutting the cones and stripping them scale by scale on a favourite stump or log, where the scales pile into a heap. In spring it is shy and keeps a trunk between itself and a person; later in the year it chatters from the branches at anyone who comes near.',
  },
};
