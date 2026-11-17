// Fisher, Pekania pennanti (the Pacific fisher of the West): in the deep wood, along the logs and up the trunks.
// Built by life/beast.js from `shape` (its long low body and long tail: life/parts/longBody.js; its paws: the bear's
// life/parts/paw.js), posed by life/parts/longRig.js, painted by life/coat.js; how it lives is life/families/mustelid.js.
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

const BODY = [22, 26, 9], HOARY = [30, 8, 26], BLACK = [20, 14, 6], UNDER = [24, 22, 10], CREAM = [36, 26, 56];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  name: 'Pacific fisher', latin: 'Pekania pennanti', key: 'pacific-fisher', seed: 472,
  census: { tier: 'very rare', source: 'N R: ninety were let go in the park in 2008 to 2010', clock: 'any' },
  // how it lives on a visit (life/families/mustelid.js): paces (m/s: a walk, a bound, and swimming, which it does not
  // here), and how near it lets the walker come (m). Silent: nothing it says is played. The agent's numbers.
  way: { family: 'mustelid', manner: 'fisher', there: 0.5, gap: [90, 400], pace: [0.6, 3.8, 0.5], wary: [24, 13, 6], fastest: 6 },
  plan: 'beast',
  published,
  size: 0.8, body: { high: 0.27, long: 0.31, wide: 0.07 },
  shape: {
    trunk: [
      [-0.248, 0.236, -0.250, 0.190, 0.030, 0.50, 2.0],     // the rump's end, round the tail's root
      [-0.228, 0.252, -0.236, 0.158, 0.046, 0.50, 2.05],
      [-0.192, 0.266, -0.202, 0.130, 0.060, 0.50, 2.15],
      [-0.130, 0.272, -0.130, 0.112, 0.068, 0.52, 2.3],
      [-0.045, 0.266, -0.045, 0.108, 0.070, 0.52, 2.3],
      [0.030, 0.258, 0.035, 0.108, 0.070, 0.54, 2.3],
      [0.088, 0.250, 0.098, 0.112, 0.066, 0.55, 2.25],      // the chest
      [0.136, 0.242, 0.150, 0.124, 0.057, 0.55, 2.2],
      [0.178, 0.237, 0.196, 0.138, 0.046, 0.52, 2.1],       // the neck, slimmer than an otter's
      [0.214, 0.236, 0.232, 0.152, 0.040, 0.50, 2.0],
      [0.244, 0.238, 0.258, 0.165, 0.036, 0.50, 2.0],
      [0.262, 0.236, 0.274, 0.172, 0.032, 0.50, 2.0],       // inside the head
    ],
    withers: [0.03, 0.12],
    spine: { hips: [-0.17, 0.205], chest: [0.02, 0.195], neck1: [0.13, 0.185], neck2: [0.175, 0.19], neck3: [0.215, 0.2] },
    blend: [0.11, 0.045, 0.03, 0.03, 0.03],
    head: {
      at: [0.258, 0.214], tilt: -10, square: 2.1, jaw: [0.03, -0.012],
      // a wedge: broad behind the ears, drawn to a pointed muzzle
      stations: [[-0.025, 0.030, 0.030, 0.036], [0, 0.034, 0.033, 0.042], [0.022, 0.032, 0.031, 0.040], [0.045, 0.027, 0.026, 0.032],
        [0.065, 0.021, 0.020, 0.024], [0.08, 0.016, 0.016, 0.017], [0.09, 0.011, 0.011, 0.011], [0.096, 0.006, 0.007, 0.006]],
      eye: { s: 0.04, up: 0.017, side: 0.027, r: 0.005 },
    },
    ear: { s: 0.004, up: 0.03, side: 0.03, length: 0.03, width: 0.034, out: 55, open: 30 },
    tail: { at: [-0.24, 0.214], length: 0.372, width: 0.05, depth: 0.045, hang: 80, taper: 0.45, bulge: 0.012 },
    fore: {
      at: [0.10, 0.045], scapula: [0.11, 0.215], scapSwing: 1.2, scapMost: 0.3, bones: [0.075, 0.07, 0.014], angles: [36, -10, 0], pastern: [0, 0.014],
      foot: { long: 0.065, wide: 0.045 },
      girth: [[0, 0.024, 0.02, 0], [0.04, 0.02, 0.017, 0], [0.075, 0.015, 0.013, 0], [0.12, 0.011, 0.01, 0], [0.145, 0.01, 0.009, 0], [0.159, 0.01, 0.009, 0]],
      share: { at: [0.09, 0.13], reach: [0.05, 0.045], most: 0.5 },
    },
    hind: {
      at: [-0.16, 0.042], bones: [0.09, 0.095, 0.02], angles: [-35, 42, 0], pastern: [0, 0.016],
      foot: { long: 0.1, wide: 0.05 },
      girth: [[0, 0.034, 0.027, 0], [0.05, 0.028, 0.022, 0.004], [0.09, 0.018, 0.015, 0], [0.135, 0.013, 0.011, -0.004], [0.185, 0.011, 0.01, 0], [0.205, 0.011, 0.01, 0]],
      share: { at: [-0.16, 0.15], reach: [0.07, 0.06], most: 0.6 },
    },
    paw: { kind: 'plantigrade', claw: 14, hind: 11, curve: 1.1 },
    unit: 0.2,
    long: { trunk: [[38, 20], [20, 10], [10, 6]], strides: { walk: 0.28, bound: 0.8 }, lift: { walk: 0.22, bound: 0.45 }, arch: 0.45, bob: 0.04, tailUp: 40, dip: 0.03 },
    neck: { low: [-0.35, -0.25, -0.2, 0.3], high: [0.35, 0.2, 0.12, -0.2], dip: -0.04 },
    lie: { drop: 0.1, fore: { top: [0.03, 0.03], fetlock: [0.08, 0.014], out: 1.2, hoof: 0 }, hind: { top: [-0.03, 0.03], fetlock: [-0.09, 0.014], out: 1.3, hoof: 0 } },
  },
  coat: {
    body: [
      { colour: BODY },                                                                    // deep brown to black (K)
      { colour: HOARY, where: (p) => smooth(0.1, 0.2, p.x) * smooth(0.45, 0.8, p.a) },     // grizzled over the neck and shoulders (S)
      { colour: UNDER, where: (p) => smooth(0.3, 0.12, p.a) },                             // brown below (K)
      { colour: CREAM, where: (p) => smooth(0.16, 0.04, p.a) * smooth(0.05, 0.11, p.x) * smooth(0.17, 0.12, p.x) },   // a cream patch on the chest (K)
      { colour: BLACK, where: (p) => smooth(-0.2, -0.235, p.x) },                          // darkest at the tail's root (A)
    ],
    head: [
      { colour: HOARY },                                                                   // grizzled on the head (S)
      { colour: BODY, where: (p) => smooth(0.5, 0.3, p.a) + smooth(0.06, 0.085, p.s) },    // the muzzle and the throat darker
      { colour: [20, 8, 6], where: (p) => smooth(0.09, 0.094, p.s) },                      // the nose
    ],
    leg: () => BLACK,                                                                      // black legs (A)
    claw: [30, 10, 30], pad: [20, 8, 12],
    ear: { outer: [28, 12, 30], inner: [26, 10, 18], edge: [32, 14, 52] },
    tail: { top: BLACK, under: [20, 14, 9] },                                              // a black tail (A)
    eye: { iris: [24, 40, 7], pupil: [240, 10, 3] },
    hair: { long: (p) => p.x < 0.05 },
  },
  card: {
    size: 'About a metre from nose to tail tip, the tail over a third of it; a male 3 to 6 kg, a female half that.',
    marks: ['A long, low, dark brown to black body, grizzled grey-brown over the head and shoulders', 'Black legs and a long, bushy black tail', 'Round ears on a wedge of a head', 'It bounds, back humped, and goes up a trunk and down again head first'],
    lives: 'A hunter of old forest, on the ground and in the trees, by day and by night: squirrels, hares, mice and porcupines. Gone from Washington for most of the last century, it was brought back to the Olympic Peninsula in 2008 to 2010, ninety animals from British Columbia, and is still seldom seen.',
  },
};
