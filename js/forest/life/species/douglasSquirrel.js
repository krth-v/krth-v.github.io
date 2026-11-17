// Douglas squirrel, Tamiasciurus douglasii: the small tree squirrel of the Pacific coast's conifer forests, and the
// one a walker meets in the Olympic valleys. Built by life/beast.js with the parts of life/parts/rodent.js (a bushy
// tail, a rodent's head, a cone in its paws), posed by life/parts/rodentRig.js, painted by life/coat.js and
// life/parts/rodentCoat.js; how it lives is life/families/scurrier.js.
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
const OLIVE = [40, 22, 20], RUST = [24, 34, 23], FLANK = [38, 20, 25], LINE = [28, 22, 8];
const ORANGE = [29, 70, 52], DEEP = [25, 70, 42], HEAD = [38, 22, 21], RING = [38, 42, 66], NOSE = [18, 14, 13];
const LEG = [32, 22, 20], FOOT = [30, 16, 15];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const EYE = { s: 0.013, up: 0.0088, side: 0.0142, r: 0.0041 };

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
  studio: { wide: 0.9, bar: 0.1 },
  // The body, in metres, standing on all fours. Every number is the agent's but the lengths measured above: the
  // outline is drawn from memory of how a tree squirrel stands, none of it from a photograph looked at.
  shape: {
    unit: 0.1,
    // the torso and the neck, rump to head: [top x, top y, bottom x, bottom y, half width, widest at, square]
    trunk: [
      [-0.070, 0.064, -0.072, 0.050, 0.010, 0.50, 2.0],       // the rump's end, round the tail's root
      [-0.066, 0.071, -0.069, 0.034, 0.020, 0.52, 2.1],       // the croup, and the buttocks under it
      [-0.057, 0.077, -0.058, 0.025, 0.026, 0.50, 2.25],      // the haunches
      [-0.042, 0.079, -0.041, 0.022, 0.028, 0.50, 2.3],
      [-0.024, 0.077, -0.023, 0.023, 0.028, 0.50, 2.3],       // the loins and the belly
      [-0.006, 0.073, -0.005, 0.025, 0.026, 0.52, 2.25],
      [0.012, 0.068, 0.014, 0.027, 0.024, 0.54, 2.2],         // the ribs
      [0.028, 0.065, 0.030, 0.029, 0.021, 0.56, 2.15],        // the chest, under the shoulders
      [0.041, 0.065, 0.044, 0.033, 0.018, 0.55, 2.1],         // the shoulders and the breast
      [0.051, 0.068, 0.055, 0.040, 0.016, 0.52, 2.05],        // the neck's base
      [0.059, 0.073, 0.063, 0.047, 0.015, 0.50, 2.0],         // the neck
      [0.065, 0.078, 0.069, 0.054, 0.014, 0.50, 2.0],         // inside the head
    ],
    withers: [0.02, 0.045],
    spine: { hips: [-0.044, 0.054], chest: [0.010, 0.050], neck1: [0.044, 0.052], neck2: [0.054, 0.058], neck3: [0.062, 0.064] },
    blend: [0.02, 0.012, 0.008, 0.007, 0.006],
    head: {
      at: [0.066, 0.068], tilt: -18, square: 1.9, jaw: [0.026, -0.006],
      //          s       up      down    half: round over the skull behind the eyes, and drawn to a short blunt muzzle
      stations: [[-0.014, 0.008, 0.009, 0.009], [-0.008, 0.0145, 0.0128, 0.0142], [0.0, 0.0182, 0.0146, 0.0172], [0.008, 0.0192, 0.0148, 0.0178], [0.016, 0.0178, 0.0138, 0.0168],
        [0.024, 0.0148, 0.012, 0.014], [0.031, 0.0115, 0.0102, 0.0115], [0.037, 0.0088, 0.0084, 0.0092], [0.042, 0.0062, 0.006, 0.0068]],
      eye: EYE,
      incisors: { long: 4, wide: 3 },
      whiskers: { long: 34, count: 4 },
    },
    ear: { s: -0.003, up: 0.0155, side: 0.0085, length: 0.0225, width: 0.0155, out: 22, open: 32, round: 0.65 },
    tail: { at: [-0.068, 0.062], length: 0.1235, width: 0.011, depth: 0.0095, hang: 98, bush: { long: 22, round: 11 } },
    fore: {
      at: [0.034, 0.0101], scapula: [0.030, 0.060], bones: [0.022, 0.024, 0.014], angles: [28, -6, -72], pastern: [0.007, 0.002], hoof: [0.006, 0.0025, 0.006],
      //       d      front   across  ahead
      girth: [[0, 0.007, 0.006, 0], [0.011, 0.0075, 0.0065, 0.001], [0.022, 0.005, 0.0045, 0], [0.034, 0.0042, 0.0038, 0], [0.046, 0.0034, 0.0034, 0],
        [0.053, 0.0022, 0.004, 0], [0.060, 0.0018, 0.0042, 0]],
      share: { at: [0.032, 0.035], reach: [0.016, 0.014], most: 0.5 },
    },
    hind: {
      at: [-0.046, 0.0115], bones: [0.034, 0.040, 0.032], angles: [-48, 52, -80], pastern: [0.009, 0.0015], hoof: [0.007, 0.0025, 0.008],
      girth: [[0, 0.012, 0.008, 0], [0.012, 0.014, 0.0092, 0.002], [0.026, 0.011, 0.009, 0.001], [0.036, 0.008, 0.0065, 0], [0.052, 0.006, 0.005, 0],
        [0.068, 0.0042, 0.0042, 0], [0.074, 0.004, 0.0045, 0], [0.090, 0.0028, 0.0055, 0], [0.106, 0.0022, 0.0058, 0]],
      share: { at: [-0.040, 0.038], reach: [0.022, 0.02], most: 0.6 },
    },
    // (no `paw` yet: given, it turns on the bear's paw, its stance and its paint (life/parts/paw.js, stance.js) whether
    // or not a leg gives `hoof`, but the paw's own plan of the leg only where none does. These legs are laid on the
    // hoof's plan, the hind foot along the third bone, and `hoof` stands for the pads and the claws: to take the paw,
    // the legs are laid again without `hoof`, and the rig's feet and the hind foot's measure are done again with them)
    // the neck's four joints turned from as it stands (radians): nose to the ground, and head up; `dip`, how far the
    // chest goes down with it
    neck: { low: [-0.55, -0.35, -0.3, 0.35], high: [0.28, 0.16, 0.12, -0.1], dip: -0.05 },
    // (the beast's lying down: a squirrel is never posed so, but the rig reads it)
    lie: { drop: 0.02, fore: { top: [0.02, 0.012], fetlock: [-0.01, 0.004], out: 1.0, hoof: -0.5 }, hind: { top: [-0.01, 0.012], fetlock: [0.02, 0.004], out: 1.2, hoof: 0.2 } },
    climb: { stride: 0.42, splay: 0.02, flex: 0.35 },
    // a Douglas-fir's cone from last autumn's store (its size the agent's)
    cone: { long: 62, wide: 26 },
  },
  coat: {
    body: [
      { colour: FLANK },
      { colour: OLIVE, where: (p) => smooth(0.5, 0.72, p.a) },                                                   // dusky olive above (Q)
      { colour: RUST, where: (p) => 0.75 * smooth(0.8, 0.95, p.a) * smooth(-0.06, -0.01, p.x) * (1 - smooth(0.03, 0.05, p.x)) },   // some rust along the back (A)
      { colour: LINE, where: (p) => smooth(0.27, 0.31, p.a) * (1 - smooth(0.35, 0.4, p.a)) * smooth(-0.055, -0.035, p.x) * (1 - smooth(0.025, 0.04, p.x)) },   // the black line along the side, in summer (M, A)
      { colour: ORANGE, where: (p) => 1 - smooth(0.24, 0.3, p.a) },                                            // orange below (Q)
      { colour: ORANGE, where: (p) => smooth(0.035, 0.05, p.x) * (1 - smooth(0.24, 0.32, p.a)) },              // and up the breast to the chin
      { colour: DEEP, where: (p) => 0.6 * (1 - smooth(0.04, 0.13, p.a)) },
    ],
    head: [
      { colour: HEAD },
      { colour: ORANGE, where: (p) => 1 - smooth(0.2, 0.36, p.a) },                                               // the chin and the throat
      { colour: RING, where: (p) => { const d = Math.hypot(p.s - EYE.s, p.up - EYE.up, (Math.abs(p.z) - EYE.side) * 0.7); return smooth(0.0040, 0.0046, d) * (1 - smooth(0.0052, 0.0058, d)); } },   // a pale ring round the eye (W)
      { colour: NOSE, where: (p) => smooth(0.038, 0.042, p.s) * smooth(-0.003, 0.0, p.up) },
    ],
    leg: ({ d, out, pastern }) => (pastern ? FOOT : [LEG, FOOT].reduce((a, b) => [a[0] + (b[0] - a[0]) * smooth(0.5, 1, d), a[1] + (b[1] - a[1]) * smooth(0.5, 1, d), a[2] + (b[2] - a[2]) * smooth(0.5, 1, d) + (out < 0 ? 4 : 0)])),   // brown legs and feet (W)
    hoof: [25, 12, 14],
    ear: { outer: [34, 22, 30], inner: [28, 24, 42], edge: [30, 18, 15] },
    tail: { top: OLIVE, under: [22, 46, 32] },
    antler: [30, 10, 30],                                     // (no antler: the beast's painter fills its cell all the same)
    eye: { iris: [20, 30, 7], pupil: [0, 0, 3] },
    hair: { long: () => false },
    fur: 2.4,
    // the brush of the tail (life/parts/rodentCoat.js): like the back above, then a black band, and the hairs' tips
    // orange or yellow (Q, A); rusty below
    bush: { top: [38, 22, 20], band: [28, 20, 8], fringe: [34, 62, 52], under: [22, 46, 32] },
    bits: { teeth: [30, 80, 50], whiskers: [30, 12, 9], cone: [24, 42, 27], flake: [26, 44, 33] },
  },
  // The words of the information card, drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 32 cm from nose to tail\'s end, of which the tail is 12 to 13 cm; about 200 g.',
    marks: ['Dusky olive above, orange below, with a black line along each side in summer', 'A pale ring round each eye', 'A broad, bushy tail, black near its edge, its hairs tipped orange', 'Climbs up and down a trunk head first, and leaps from branch to branch'],
    lives: 'In the conifer forests of the Pacific coast, the Olympic valleys among them, all year: it lives on the seeds of Douglas-fir, spruce and hemlock, cutting the cones and stripping them scale by scale on a favourite stump or log, where the scales pile into a heap. In spring it is shy and keeps a trunk between itself and a person; later in the year it chatters from the branches at anyone who comes near.',
  },
};
