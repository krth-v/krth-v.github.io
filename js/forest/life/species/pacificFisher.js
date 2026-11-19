// Fisher, Pekania pennanti (the Pacific fisher of the West): in the deep wood, along the logs and up the trunks.
// Drawn as a plate (life/plate.js; 2026-11-19), its paws the bear's (life/parts/paw.js) and its tail a brush (life/plate.js
// `smallParts`), posed by life/plateRig.js, painted by life/plateCoat.js; how it lives is life/families/mustelid.js.
//
// What is published and what is not (read 2026-11-16 by the mustelids agent: the University of Minnesota Duluth's
// Minnesota mammals page, which cites Hazard 1982 and Jackson 1961, through a tool that returns a page's text;
// Wikipedia, Animal Diversity Web, FEIS and WDFW as earlier agents read them, each claim checked by a second agent,
// kept in .local-assets/forest/research/beasts-herps-2026-11-16.json; none of it seen as an image). Published: the
// lengths and masses below, the colours (deep brown to black; lighter, grizzled, on the head, the back of the neck
// and the shoulders; black legs and tail; brown below with white or cream patches). Not found, and the agent's: the
// hind foot, the height at the shoulder, the head, the ears' size (one California male's ear, 43 mm, is one
// specimen), the legs' segments, the claws, the outline.

export const published = {
  shown: 'an adult male',
  note: 'Published: the head and body and the tail below (Minnesota males, Hazard 1982 as the Minnesota page gives it, within Wikipedia\'s ranges), the masses and the colours. The agent\'s: everything else, from memory of photographs of fishers and martens, none of them looked at.',
  sources: {
    H: 'University of Minnesota Duluth, Mammals of Minnesota, "Fisher": males 987 mm long in all on average (905 to 1,055), tail 372 mm (341 to 397), 3.9 kg (2.9 to 5.7), after Hazard 1982',
    K: 'Wikipedia, "Fisher (animal)": males 90 to 120 cm in all, head and body 47 to 75 cm, tail 30 to 42 cm; males 3.5 to 6.0 kg; deep brown to black, the underside brown with white or cream patches',
    A: 'Animal Diversity Web, Pekania pennanti: black legs and tail',
    S: 'Washington Department of Fish and Wildlife, "Fisher": lighter shading on the head, the back of the neck and the back; 4.4 to 13 lb',
  },
  lengths: [
    ['length', 'Head and body, nose to rump (total length less tail), males', 0.615, [0.47, 0.75], 'H K'],
    ['tail', 'Tail, males', 0.372, [0.341, 0.397], 'H'],
  ],
  proportions: [
    'Long and low, a large marten: short legs, a wedge of a head with round ears, a long bushy tail (K)',
    'Not found: the hind foot (built at 0.10 m to the tip of the toe), the height at the shoulder (about 0.25 m), the head (0.12 m)',
  ],
  mass: 'Males 3.9 kg on average, 2.9 to 5.7 (H); males 3.5 to 6.0 kg (K)',
};

const BODY = [22, 24, 6.5], HOARY = [30, 9, 19], GRIZZLE = [32, 8, 25], BLACK = [20, 14, 6], UNDER = [24, 22, 11], CREAM = [36, 26, 56], NOSE = [20, 8, 6];
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };

export default {
  name: 'Pacific fisher', latin: 'Pekania pennanti', key: 'pacific-fisher', seed: 472,
  census: { tier: 'very rare', source: 'N R: ninety were let go in the park in 2008 to 2010', clock: 'any' },
  // how it lives on a visit (life/families/mustelid.js): paces (m/s: a walk, a bound, and swimming, which it does not
  // here), and how near it lets the walker come (m). Silent: nothing it says is played. The agent's numbers.
  way: { family: 'mustelid', manner: 'fisher', there: 0.5, gap: [90, 400], pace: [0.6, 3.8, 0.5], wary: [24, 13, 6], fastest: 6 },
  plan: 'beast',
  published,
  size: 0.8, body: { high: 0.27, long: 0.31, wide: 0.07 },
  // One stride of a walk and of a bound, metres (life/beasts.js `stridesOf`; life/families/mustelid.js reads
  // shape.long.strides, which are the same two)
  strides: { walk: 0.28, trot: 0.8, gallop: 0.8 },
  // The body, in metres, standing square: an adult male, drawn as a plate (life/plate.js says what each drawing is;
  // redrawn 2026-11-19). Every number is the agent's but the head and body and the tail, which are set to the published
  // means above. Drawn from memory of fishers and martens and of field-guide plates of them (no photograph was looked
  // at): long and low, but higher on the leg than an otter and lighter; the back rising to the haunches; the neck
  // long and nearly as thick as the head; a broad skull with round ears set wide, narrowing to a pointed, foxy muzzle;
  // a long full tail that tapers to a point, its hair a card's ragged edge (shape.brush).
  shape: {
    gait: 'bound',
    plate: {
      side: {
        //     t      x       y
        top: [[0, -0.272, 0.200], [0.6, -0.266, 0.222], [1.2, -0.250, 0.240], [2, -0.220, 0.256], [3, -0.170, 0.266],     // the rump and the haunches
          [4, -0.110, 0.268], [5, -0.050, 0.262], [6, 0.010, 0.252], [7, 0.065, 0.242], [8, 0.115, 0.236],                // the loins, the back, the shoulders
          [9, 0.160, 0.232], [10, 0.200, 0.228], [11, 0.236, 0.227], [12, 0.256, 0.230], [13, 0.273, 0.225],             // the long neck, the poll, the broad crown
          [14, 0.289, 0.212], [15, 0.302, 0.199], [16, 0.313, 0.188], [16.6, 0.319, 0.180], [17, 0.323, 0.174]],         // the brow and the pointed muzzle
        bottom: [[0, -0.272, 0.188], [0.6, -0.268, 0.170], [1.2, -0.256, 0.152], [2, -0.228, 0.138], [3, -0.170, 0.128],
          [4, -0.110, 0.124], [5, -0.050, 0.121], [6, 0.010, 0.120], [7, 0.065, 0.123], [8, 0.115, 0.131],               // the belly, the chest
          [9, 0.160, 0.144], [10, 0.200, 0.156], [11, 0.236, 0.164], [12, 0.256, 0.167], [13, 0.273, 0.167],            // the throat, under the jaw
          [14, 0.289, 0.166], [15, 0.302, 0.166], [16, 0.313, 0.167], [16.6, 0.319, 0.169], [17, 0.322, 0.172]],
      },
      above: [[0, 0.012], [0.6, 0.030], [1.2, 0.045], [2, 0.058], [3, 0.066], [4, 0.070], [5, 0.070], [6, 0.067], [7, 0.062], [8, 0.054],
        [9, 0.044], [10, 0.038], [11, 0.036], [12, 0.039], [13, 0.036], [14, 0.028], [15, 0.020], [16, 0.013], [16.6, 0.008], [17, 0.003]],
      front: [[0, 0.5, 2.0, 2.0], [2, 0.5, 2.2, 2.2], [5, 0.52, 2.3, 2.2], [8, 0.52, 2.2, 2.1], [11, 0.55, 2.3, 2.1], [13, 0.55, 2.4, 2.1], [15, 0.5, 2.2, 2.2], [17, 0.5, 2.0, 2.0]],
      spine: [['hips', -0.205, 0.200], ['loin', -0.120, 0.205], ['back', -0.030, 0.200], ['chest', 0.060, 0.188],
        ['neck1', 0.140, 0.188], ['neck2', 0.180, 0.192], ['neck3', 0.210, 0.196], ['head', 0.236, 0.200]],
      marks: { rump: 0.6, withers: [6.5, 8.5], poll: 11 },
      jaw: { hinge: [0.236, 0.182], from: 14.2, soft: 1.2, lips: 0.42, open: 0.3 },
      eye: { at: [0.284, 0.208], r: 0.0052 },
    },
    // the paw (the bear's, life/parts/paw.js): plantigrade, the claws short and curved, for climbing (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 14, hind: 11, curve: 1.1 },
    fore: {
      at: [0.102, 0.052],
      //        the blade's top        the point of the shoulder  the elbow             the wrist              over the pad
      joints: [[0.100, 0.215, 0.045], [0.135, 0.160, 0.055], [0.085, 0.105, 0.060], [0.100, 0.030, 0.052], [0.102, 0.016, 0.052]],
      //          y      front   back    out    in
      outline: [[0.215, 0.150, 0.065, 0.044, 0.020], [0.185, 0.168, 0.060, 0.066, 0.022], [0.155, 0.170, 0.062, 0.074, 0.026],
        [0.125, 0.148, 0.066, 0.074, 0.031], [0.095, 0.124, 0.075, 0.068, 0.036], [0.065, 0.117, 0.083, 0.064, 0.039],
        [0.042, 0.115, 0.087, 0.063, 0.041], [0.028, 0.115, 0.089, 0.062, 0.042], [0.016, 0.116, 0.089, 0.062, 0.042]],
      foot: { long: 0.06, wide: 0.042 }, web: 0.1,
    },
    hind: {
      at: [-0.22, 0.055],
      //        the hip                 the knee                the ankle               over the pad
      joints: [[-0.205, 0.200, 0.050], [-0.150, 0.125, 0.064], [-0.225, 0.045, 0.055], [-0.220, 0.016, 0.055]],
      outline: [[0.235, -0.150, -0.262, 0.050, 0.020], [0.200, -0.125, -0.276, 0.078, 0.022], [0.165, -0.118, -0.272, 0.084, 0.026],
        [0.130, -0.126, -0.256, 0.082, 0.032], [0.100, -0.148, -0.240, 0.074, 0.038], [0.070, -0.176, -0.234, 0.070, 0.041],
        [0.045, -0.194, -0.240, 0.068, 0.043], [0.030, -0.196, -0.243, 0.067, 0.043], [0.016, -0.196, -0.243, 0.067, 0.043]],
      foot: { long: 0.095, wide: 0.046 }, web: 0.1,
    },
    ear: { at: [0.250, 0.222], side: 0.026, length: 0.028, width: 0.034, out: 50, open: 30, round: 1, back: 10 },
    // the tail's bone (published), and its brush: the hair 32 mm either side and 28 above and below, a card's ragged edge
    // (life/plate.js `smallParts`); carried low and trailing, raised a little when it watches (life/plateRig.js)
    tail: { at: [-0.262, 0.205], length: 0.372, width: 0.042, depth: 0.038, hang: 102 },
    brush: { long: 34, round: 30, past: 0.6, core: 0.6, taper: 0.5, carry: { droop: 0.32, up: 1.0, curl: 0.9, run: -0.05, sit: 0.35 } },
    // how it bounds (life/families/mustelid.js reads the strides; the rest is the old rig's, kept for its record)
    long: { trunk: [[38, 20], [20, 10], [10, 6]], strides: { walk: 0.28, bound: 0.8 }, lift: { walk: 0.22, bound: 0.45 }, arch: 0.45, bob: 0.04, tailUp: 40, dip: 0.03 },
    arch: 0.45,
    neck: { low: [-0.35, -0.25, -0.2, 0.3], high: [0.35, 0.2, 0.12, -0.2], dip: -0.04 },
    lie: { drop: 0.1, fore: { top: [0.03, 0.03], fetlock: [0.08, 0.014], out: 1.2, hoof: 0 }, hind: { top: [-0.03, 0.03], fetlock: [-0.09, 0.014], out: 1.3, hoof: 0 } },
    young: { legs: 0, head: 0.15, neck: 0 },
  },
  // The coat, as paint (life/plateCoat.js says what each table is): deep brown to black (K), grizzled grey-brown over
  // the head, the back of the neck and the shoulders (S), black legs and tail (A), brown below with a cream patch (K).
  // Every shade and every boundary is the agent's.
  coat: {
    rules: [
      { colour: BODY },
      { colour: UNDER, where: (p) => (p.part === 'body' ? edge(0.3 - p.a, 0.06) * edge(10.5 - p.t, 0.5) : 0) },                       // brown below (K)
      { colour: HOARY, where: (p) => (p.part === 'body' ? Math.max(edge(p.x - 0.05, 0.06) * edge(p.a - 0.4, 0.1), edge(p.t - 10.8, 0.5) * edge(p.a - 0.22, 0.08)) : (p.hind ? 0 : edge(p.y - 0.175, 0.02))) },   // grizzled over the head, the neck and the shoulders (S)
      { colour: GRIZZLE, where: (p) => (p.part === 'body' ? edge(p.t - 11.6, 0.4) * edge(p.a - 0.6, 0.1) * edge(14.6 - p.t, 0.4) : 0) },   // palest over the crown
      { colour: BODY, where: (p) => (p.part === 'body' ? edge(p.t - 15.2, 0.4) : 0) },                                                  // the muzzle darker
      { colour: CREAM, where: (p) => (p.part === 'body' ? edge(0.15 - p.a, 0.04) * edge(p.x - 0.05, 0.012) * edge(0.115 - p.x, 0.012) : 0) },   // a cream patch on the chest (K)
      { colour: BLACK, where: (p) => (p.part === 'limb' ? edge(0.15 - p.y, 0.025) : edge(-0.215 - p.x, 0.03) * edge(p.a - 0.3, 0.1)) },   // black legs (A); darkest at the tail's root
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 16.6, 0.12) * edge(p.a - 0.4, 0.08) : 0) },
    ],
    planes: [],
    tones: { light: [4, -8, 8], shade: [-2, 2, -3] },
    turn: { top: 1, under: 0.7 },
    hair: { count: 0.45, long: 0.022 },
    claw: [30, 10, 30], pad: [20, 8, 12],
    ear: { outer: [30, 10, 24], inner: [26, 10, 14], edge: [34, 12, 48] },
    eye: { iris: [24, 40, 7], pupil: [240, 10, 3] },
    // the brush: black (A), the hairs' tips a little grizzled
    bush: { top: [20, 14, 8], band: [20, 14, 5], fringe: [30, 10, 22], under: [20, 14, 7] },
  },
  // Who a fisher may be (life/plateRig.js; its family sets these once), and the poses the contact sheet shows
  // (life/plateStudio.js), each the fields of a pose its family asks for (life/families/mustelid.js).
  who: { male: {}, female: { scale: 0.82 } },
  poses: {
    alert: { neck: 1, ears: 1, tail: 0.25 },
    walk: { walk: 1, cycle: 0.1, neck: 0.75 },
    bound: { gallop: 1, cycle: 0.05 },
    stretch: { gallop: 1, cycle: 0.55 },
    upright: { rear: 1, neck: 0.8 },
    climb: { walk: 1, cycle: 0.3, neck: 0.75 },
    sniff: { neck: 0.2, head: { pitch: -0.3 }, walk: 1, cycle: 0.6 },
    lie: { lie: 1, neck: 0.5 },
    look: { neck: 0.9, head: { yaw: 1.0 } },
  },
  studio: { high: 0.42, tall: 0.3, middle: -0.05,
    rows: [
      { span: 1.25, high: 0.4, cells: [['male', 'male', null, 'side'], ['front', 'male', null, 'front'], ['behind', 'male', null, 'behind'], ['three-quarters', 'male', null, 'quarter']] },
      { span: 1.25, high: 0.42, cells: [['from above', 'male', null, 'above'], ['walk', 'male', 'walk', 'side'], ['bounding, gathered', 'male', 'bound', 'side'], ['bounding, stretched', 'male', 'stretch', 'side']] },
      { span: 1.25, high: 0.62, cells: [['standing up to look', 'male', 'upright', 'side'], ['climbing a trunk', 'male', 'climb', 'up'], ['nose down', 'male', 'sniff', 'quarter'], ['female, watching', 'female', 'alert', 'quarter']] },
    ] },
  card: {
    size: 'About a metre from nose to tail tip, the tail over a third of it; a male 3 to 6 kg, a female half that.',
    marks: ['A long, low, dark brown to black body, grizzled grey-brown over the head and shoulders', 'Black legs and a long, bushy black tail', 'Round ears on a wedge of a head', 'It bounds, back humped, and goes up a trunk and down again head first'],
    lives: 'A hunter of old forest, on the ground and in the trees, by day and by night: squirrels, hares, mice and porcupines. Gone from Washington for most of the last century, it was brought back to the Olympic Peninsula in 2008 to 2010, ninety animals from British Columbia, and is still seldom seen.',
  },
};
