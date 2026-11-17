// Striped skunk, Mephitis mephitis: from dusk on the forest floor and at the old clearing's edge. Built by
// life/beast.js from `shape` (its long low body and plume of a tail: life/parts/longBody.js; its paws, the forefeet
// long-clawed: the bear's life/parts/paw.js), posed by life/parts/longRig.js, painted by life/coat.js (its stripes are
// coat data); how it lives is life/families/mustelid.js.
//
// What is published and what is not (read 2026-11-16 by the mustelids agent: the Mammals of Texas page through a tool
// that returns a page's text; Animal Diversity Web, Wikipedia, WDFW and a museum's record as earlier agents read
// them, each claim checked by a second agent, kept in .local-assets/forest/research/beasts-herps-2026-11-16.json;
// none of it seen as an image). Published: the lengths and masses below; a stout body, long coarse oily fur, short
// round ears, small eyes, five toes on each foot, the front ones with long claws, the hind heel almost on the ground;
// a long bushy tail, its tip black, white hairs often along its edges; two white stripes along the sides of the back
// that meet at the neck and run onto the head; its warning (up on the hind feet, a lurch forward, both forefeet
// stamped, the teeth clicked) and that it is mostly out at night. Not found, and the agent's: the height at the
// shoulder, the head, the legs' segments, how wide each stripe is, the outline.

export const published = {
  shown: 'an adult male',
  note: 'Published: the head and body, the tail and the hind foot below (Mammals of Texas\' averages for males; Animal Diversity Web\'s ranges, which its hind foot\'s exceeds), the masses, the pattern and the build. The agent\'s: everything else, from memory of photographs of skunks, none of them looked at.',
  sources: {
    T: 'Schmidly and Bradley, The Mammals of Texas, online edition (Texas Tech University), Mephitis mephitis: males 680 mm in all, tail 250, hind foot 90 (females 610, 225, 65); 1.4 to 6.6 kg; stout, long coarse oily fur, short round ears, small eyes, five toes on each foot, the front ones with long claws; a long bushy tail with a black tip; two white stripes along the sides of the back, meeting at the neck and running onto the head; the warning: up on the hind feet, a lurch forward, both forefeet stamped and the teeth clicked; nocturnal',
    A: 'Animal Diversity Web, Mephitis mephitis: 465 to 815 mm in all, tail 170 to 400 mm, hind foot 55 to 85 mm; a bushy black tail, often with white hairs along its edges',
  },
  lengths: [
    ['length', 'Head and body, nose to rump (total length less tail), males', 0.43, ['–', '–'], 'T'],
    ['tail', 'Tail, males', 0.25, [0.17, 0.4], 'T A'],
    ['hindfoot', 'Hind foot, males (published with the claw; built to the tip of the toe)', 0.09, [0.055, 0.085], 'T A'],
  ],
  proportions: [
    'Stout, the rump high and broad, the head small; short legs, long front claws (T)',
    'Not found: the height at the shoulder (built at about 0.17 m at the rump), the head (0.09 m), how wide the stripes are',
  ],
  mass: '1.4 to 6.6 kg, by age and how fat (T)',
};

const BLACK = [0, 0, 7], WHITE = [40, 12, 86], NOSE = [0, 0, 4];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// The two stripes: along each side of the back (a, how far round from the belly to the back's middle: 0..1), from
// the rump forward, closing over the middle of the back at the shoulders into one cap over the nape (the agent's
// widths). A share, 0..1.
const stripes = (p) => {
  const t = smooth(-0.17, 0.05, p.x), mid = 0.7 + 0.12 * t, half = 0.07 + 0.04 * t;
  const side = smooth(half, half * 0.6, Math.abs(p.a - mid));
  const cap = smooth(0.02, 0.08, p.x) * smooth(0.6, 0.72, p.a);
  return Math.max(side * smooth(-0.17, -0.13, p.x), cap);
};

export default {
  name: 'Striped skunk', latin: 'Mephitis mephitis', key: 'striped-skunk', seed: 473,
  census: { tier: 'very rare', source: 'N CL', clock: 'night' },
  // how it lives on a visit (life/families/mustelid.js): paces (m/s: a waddle, its quickest, and swimming), and how
  // near it lets the walker come before it watches, warns and waddles off (m). The agent's numbers.
  way: { family: 'mustelid', manner: 'skunk', there: 0.7, gap: [60, 300], pace: [0.35, 0.9, 0.3], wary: [14, 7, 3.5], fastest: 1.5 },
  // its forefeet stamped on the floor: a dull knock made in the page (sound/index.js), low (the agent's)
  voices: {
    stamp: { synth: 'knock', level: 0.3, near: 5, pitch: 120 },
  },
  plan: 'beast',
  published,
  size: 0.55, body: { high: 0.2, long: 0.22, wide: 0.09 },
  shape: {
    trunk: [
      [-0.164, 0.208, -0.167, 0.168, 0.030, 0.50, 2.0],     // the rump's end, round the tail's root
      [-0.153, 0.226, -0.161, 0.122, 0.064, 0.50, 2.1],
      [-0.132, 0.238, -0.140, 0.088, 0.086, 0.50, 2.25],    // the broad high rump
      [-0.080, 0.238, -0.080, 0.072, 0.092, 0.50, 2.35],
      [-0.024, 0.228, -0.024, 0.068, 0.090, 0.50, 2.35],
      [0.032, 0.212, 0.036, 0.070, 0.083, 0.52, 2.3],
      [0.072, 0.198, 0.080, 0.078, 0.072, 0.53, 2.25],      // the chest, lower than the rump
      [0.104, 0.185, 0.116, 0.088, 0.060, 0.53, 2.2],
      [0.132, 0.175, 0.144, 0.098, 0.048, 0.52, 2.1],
      [0.156, 0.168, 0.168, 0.108, 0.040, 0.50, 2.0],
      [0.176, 0.164, 0.186, 0.116, 0.034, 0.50, 2.0],       // inside the head
    ],
    withers: [0.02, 0.09],
    spine: { hips: [-0.112, 0.17], chest: [0.016, 0.155], neck1: [0.096, 0.14], neck2: [0.128, 0.14], neck3: [0.156, 0.142] },
    blend: [0.09, 0.04, 0.025, 0.025, 0.025],
    head: {
      at: [0.184, 0.146], tilt: -14, square: 2.0, jaw: [0.022, -0.01],
      // small and pointed
      stations: [[-0.017, 0.026, 0.026, 0.030], [0, 0.029, 0.028, 0.034], [0.017, 0.026, 0.024, 0.031], [0.034, 0.02, 0.019, 0.024],
        [0.047, 0.015, 0.014, 0.017], [0.056, 0.011, 0.011, 0.012], [0.062, 0.006, 0.007, 0.007]],
      eye: { s: 0.03, up: 0.014, side: 0.022, r: 0.0038 },
    },
    ear: { s: -0.004, up: 0.026, side: 0.026, length: 0.016, width: 0.02, out: 62, open: 25 },
    // a plume: the hair as broad again as the tail's root at its middle
    tail: { at: [-0.158, 0.19], length: 0.25, width: 0.05, depth: 0.045, hang: 96, taper: 0.7, bulge: 0.024 },
    fore: {
      at: [0.075, 0.045], scapula: [0.085, 0.17], scapSwing: 1.2, scapMost: 0.3, bones: [0.055, 0.05, 0.012], angles: [30, -10, 0], pastern: [0, 0.013],
      foot: { long: 0.05, wide: 0.036 },
      girth: [[0, 0.024, 0.02, 0], [0.03, 0.02, 0.017, 0], [0.055, 0.015, 0.013, 0], [0.09, 0.011, 0.01, 0], [0.105, 0.01, 0.009, 0], [0.117, 0.01, 0.009, 0]],
      share: { at: [0.07, 0.1], reach: [0.05, 0.04], most: 0.5 },
    },
    hind: {
      at: [-0.1, 0.045], bones: [0.065, 0.068, 0.016], angles: [-30, 38, 0], pastern: [0, 0.014],
      foot: { long: 0.086, wide: 0.04 },
      girth: [[0, 0.03, 0.025, 0], [0.035, 0.025, 0.02, 0.003], [0.065, 0.017, 0.014, 0], [0.1, 0.012, 0.011, -0.003], [0.133, 0.011, 0.01, 0], [0.149, 0.011, 0.01, 0]],
      share: { at: [-0.1, 0.12], reach: [0.06, 0.05], most: 0.6 },
    },
    // the forefeet's claws long (T), for digging; the hind ones short (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 18, hind: 8, curve: 0.9 },
    unit: 0.16,
    long: { trunk: [[38, 20], [20, 10], [10, 6]], strides: { walk: 0.22, bound: 0.45 }, lift: { walk: 0.2, bound: 0.35 }, arch: 0.25, bob: 0.02, tailUp: 85, dip: 0.03 },
    neck: { low: [-0.35, -0.3, -0.2, 0.3], high: [0.3, 0.2, 0.1, -0.15], dip: -0.03 },
    lie: { drop: 0.065, fore: { top: [0.02, 0.025], fetlock: [0.06, 0.012], out: 1.2, hoof: 0 }, hind: { top: [-0.02, 0.025], fetlock: [-0.06, 0.012], out: 1.3, hoof: 0 } },
  },
  coat: {
    body: [
      { colour: BLACK },
      { colour: WHITE, where: stripes },                                                   // two white stripes, meeting at the neck (T)
    ],
    head: [
      { colour: BLACK },
      { colour: WHITE, where: (p) => smooth(0.03, 0.0, p.s) * smooth(0.55, 0.8, p.a) },    // the stripes run onto the head (T)
      { colour: WHITE, where: (p) => smooth(0.006, 0.002, Math.abs(p.z)) * smooth(0.05, 0.035, p.s) * smooth(0.6, 0.8, p.a) },   // a thin white blaze between the eyes
      { colour: NOSE, where: (p) => smooth(0.056, 0.06, p.s) },
    ],
    leg: () => BLACK,
    claw: [36, 14, 62], pad: [0, 0, 10],
    ear: { outer: BLACK, inner: [0, 0, 12], edge: [0, 0, 16] },
    // the tail, round it (u: 0.5 its top) and along it (v): black, with long white hairs along its top and edges
    // over most of its length, its tip black (T, A)
    tail: {
      top: BLACK, under: BLACK,
      at: (u, v) => {
        const top = 1 - smooth(0.06, 0.2, Math.abs(u - 0.5)), streak = 0.5 + 0.5 * Math.sin(u * 61 + Math.sin(v * 9) * 2);
        return mix(BLACK, WHITE, top * smooth(0.82, 0.62, v) * (0.55 + 0.45 * streak));
      },
    },
    eye: { iris: [0, 0, 5], pupil: [0, 0, 2] },
    hair: { long: (p) => p.a > 0.45 },                                                     // long, coarse fur (T), longest along the back
  },
  card: {
    size: 'About 0.6 to 0.7 m from nose to tail tip, the tail a third of it; 1.4 to 6.6 kg, the most in autumn.',
    marks: ['Black, with two white stripes along the back that meet over the shoulders and run onto the head', 'A thin white blaze between the eyes', 'A long bushy black tail, often edged in white', 'It waddles, nose down; it does not run'],
    lives: 'From dusk to dawn on the forest floor and along the edges of clearings, digging for grubs and beetles with its long front claws, and eating mice, eggs and berries. Warned off, it stamps its forefeet, raises its tail and turns its rump; its spray is the last word.',
  },
};
