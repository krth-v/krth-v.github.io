// Striped skunk, Mephitis mephitis: from dusk on the forest floor and at the old clearing's edge. Drawn as a plate
// (life/plate.js; 2026-11-19), its paws the bear's (life/parts/paw.js) with the forefeet long-clawed and its tail a
// plume (life/plate.js `smallParts`), posed by life/plateRig.js, painted by life/plateCoat.js (its stripes are coat
// data); how it lives is life/families/mustelid.js.
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
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };
// The white (a share, 0..1): two stripes along each side of the back (a, how far round from the belly to the back's
// middle: 0..1), from the rump forward, closing over the middle of the back at the shoulders into one cap over the
// nape, which narrows over the crown into a thin blaze between the eyes (the agent's widths; x in metres along the body)
const stripes = (p) => {
  const t = smooth(-0.18, 0.057, p.x), mid = 0.7 + 0.16 * t, half = 0.07 + 0.05 * t;
  const side = smooth(half, half * 0.6, Math.abs(p.a - mid)) * smooth(-0.19, -0.162, p.x);
  const cap = smooth(0.028, 0.076, p.x) * smooth(0.6, 0.7, p.a) * (1 - smooth(0.143, 0.162, p.x));
  const crown = smooth(0.133, 0.152, p.x) * smooth(0.78, 0.86, p.a) * (1 - smooth(0.162, 0.171, p.x));
  const blaze = smooth(0.157, 0.166, p.x) * smooth(0.925, 0.95, p.a) * (1 - smooth(0.19, 0.198, p.x));
  return Math.max(side, cap, crown, blaze);
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
  // One stride of a waddle and of its quickest gait, metres (life/beasts.js `stridesOf`; life/families/mustelid.js reads
  // shape.long.strides, which are the same two)
  strides: { walk: 0.22, trot: 0.45, gallop: 0.45 },
  // The body, in metres, standing square: an adult male, drawn as a plate (life/plate.js says what each drawing is;
  // redrawn 2026-11-19). Every number is the agent's but the head and body, the tail and the hind foot, which are set
  // to the published means above. Drawn from memory of skunks and of field-guide plates of them (no photograph was
  // looked at): stout and low, the back arched up to a broad high rump, the head small and pointed, carried low; short
  // legs, the forefeet long-clawed; a great plume of a tail, its hair a card's ragged edge (shape.brush).
  shape: {
    gait: 'bound',
    plate: {
      side: {
        //     t      x       y
        top: [[0, -0.195, 0.175], [0.6, -0.192, 0.200], [1.2, -0.182, 0.220], [2, -0.162, 0.236], [3, -0.123, 0.245],     // the broad high rump
          [4, -0.081, 0.244], [5, -0.038, 0.236], [6, 0.005, 0.222], [7, 0.043, 0.205], [8, 0.076, 0.190],                // the back falling to the shoulders
          [9, 0.104, 0.178], [10, 0.128, 0.170], [11, 0.144, 0.166], [12, 0.160, 0.166], [13, 0.174, 0.160],             // the short neck, the small head
          [14, 0.186, 0.150], [15, 0.197, 0.139], [16, 0.205, 0.129], [16.6, 0.210, 0.122], [17, 0.212, 0.117]],         // the pointed snout
        bottom: [[0, -0.195, 0.160], [0.6, -0.193, 0.138], [1.2, -0.186, 0.118], [2, -0.169, 0.098], [3, -0.133, 0.082],
          [4, -0.085, 0.074], [5, -0.038, 0.071], [6, 0.005, 0.072], [7, 0.043, 0.077], [8, 0.076, 0.086],               // the belly, low and full
          [9, 0.104, 0.098], [10, 0.128, 0.108], [11, 0.144, 0.114], [12, 0.160, 0.116], [13, 0.174, 0.115],
          [14, 0.186, 0.113], [15, 0.197, 0.112], [16, 0.205, 0.112], [16.6, 0.210, 0.113], [17, 0.212, 0.116]],
      },
      above: [[0, 0.020], [0.6, 0.045], [1.2, 0.062], [2, 0.078], [3, 0.088], [4, 0.092], [5, 0.090], [6, 0.084], [7, 0.074], [8, 0.062],
        [9, 0.050], [10, 0.042], [11, 0.036], [12, 0.034], [13, 0.030], [14, 0.024], [15, 0.017], [16, 0.011], [16.6, 0.007], [17, 0.003]],
      front: [[0, 0.5, 2.0, 2.0], [3, 0.5, 2.4, 2.2], [5, 0.52, 2.4, 2.2], [8, 0.52, 2.2, 2.1], [11, 0.5, 2.2, 2.1], [14, 0.5, 2.1, 2.1], [17, 0.5, 2.0, 2.0]],
      spine: [['hips', -0.128, 0.180], ['loin', -0.067, 0.180], ['back', -0.009, 0.170], ['chest', 0.048, 0.150],
        ['neck1', 0.090, 0.142], ['neck2', 0.112, 0.140], ['neck3', 0.130, 0.140], ['head', 0.144, 0.141]],
      marks: { rump: 0.6, withers: [6.5, 8.5], poll: 11 },
      jaw: { hinge: [0.144, 0.128], from: 14.2, soft: 1.0, lips: 0.42, open: 0.3 },
      eye: { at: [0.181, 0.142], r: 0.0038 },                // small (T)
    },
    // the paw (the bear's, life/parts/paw.js): the forefeet's claws long (T), for digging; the hind ones short (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 18, hind: 8, curve: 0.9 },
    fore: {
      at: [0.072, 0.048],
      //        the blade's top        the point of the shoulder  the elbow             the wrist              over the pad
      joints: [[0.050, 0.170, 0.045], [0.085, 0.120, 0.050], [0.050, 0.075, 0.052], [0.070, 0.022, 0.048], [0.072, 0.013, 0.048]],
      //          y      front   back    out    in
      outline: [[0.170, 0.100, 0.010, 0.042, 0.020], [0.140, 0.115, 0.012, 0.062, 0.022], [0.115, 0.118, 0.018, 0.068, 0.026],
        [0.090, 0.104, 0.028, 0.066, 0.030], [0.070, 0.092, 0.036, 0.062, 0.032], [0.050, 0.088, 0.048, 0.060, 0.034],
        [0.030, 0.088, 0.054, 0.058, 0.036], [0.020, 0.088, 0.056, 0.058, 0.036], [0.013, 0.089, 0.056, 0.058, 0.036]],
      foot: { long: 0.05, wide: 0.036 }, web: 0,
    },
    hind: {
      at: [-0.148, 0.054],
      //        the hip                 the knee                the ankle               over the pad
      joints: [[-0.135, 0.180, 0.050], [-0.090, 0.105, 0.064], [-0.155, 0.030, 0.054], [-0.148, 0.012, 0.054]],
      outline: [[0.200, -0.080, -0.190, 0.050, 0.020], [0.170, -0.065, -0.205, 0.078, 0.024], [0.140, -0.062, -0.205, 0.088, 0.028],
        [0.110, -0.072, -0.192, 0.088, 0.032], [0.085, -0.092, -0.175, 0.082, 0.036], [0.060, -0.110, -0.168, 0.074, 0.040],
        [0.040, -0.126, -0.170, 0.068, 0.042], [0.025, -0.130, -0.172, 0.066, 0.043], [0.012, -0.130, -0.172, 0.066, 0.043]],
      foot: { long: 0.088, wide: 0.04 }, web: 0,
    },
    ear: { at: [0.154, 0.160], side: 0.02, length: 0.016, width: 0.02, out: 62, open: 25, round: 1, back: 10 },
    // the tail's bone (published) and its plume: the hair 55 mm either side and 45 above and below, broad to its end
    // (the agent's). Carried low as it waddles, raised over its back to warn (life/plateRig.js, by `tail`).
    tail: { at: [-0.188, 0.185], length: 0.25, width: 0.05, depth: 0.045, hang: 96 },
    brush: { long: 55, round: 45, past: 0.5, core: 0.55, taper: 0.0, carry: { droop: 0.12, up: 1.45, curl: 0.6, run: 0.1, sit: 0.3, bend: 0.5 } },
    // the warning: both forefeet stamped (T); digging by turns, as its family runs `cycle` (life/plateRig.js)
    stamp: 'both', digBy: 'cycle',
    // how it waddles (life/families/mustelid.js reads the strides; the rest is the old rig's, kept for its record)
    long: { trunk: [[38, 20], [20, 10], [10, 6]], strides: { walk: 0.22, bound: 0.45 }, lift: { walk: 0.2, bound: 0.35 }, arch: 0.25, bob: 0.02, tailUp: 85, dip: 0.03 },
    arch: 0.3,
    neck: { low: [-0.35, -0.3, -0.2, 0.3], high: [0.3, 0.2, 0.1, -0.15], dip: -0.03 },
    lie: { drop: 0.065, fore: { top: [0.02, 0.025], fetlock: [0.06, 0.012], out: 1.2, hoof: 0 }, hind: { top: [-0.02, 0.025], fetlock: [-0.06, 0.012], out: 1.3, hoof: 0 } },
    young: { legs: 0, head: 0.15, neck: 0 },
  },
  // The coat, as paint (life/plateCoat.js says what each table is): black, with two white stripes along the sides of
  // the back that meet at the neck and run onto the head as a thin blaze between the eyes (T). Every width is the agent's.
  coat: {
    rules: [
      { colour: BLACK },
      { colour: WHITE, where: (p) => (p.part === 'body' ? stripes(p) : 0) },                                                // two white stripes, meeting at the neck (T)
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 16.4, 0.15) * edge(p.a - 0.4, 0.06) : 0) },
    ],
    planes: [],
    tones: { light: [0, 0, 7], shade: [0, 0, -4] },
    turn: { top: 1, under: 0.6 },
    hair: { count: 0.6, long: 0.03 },                                                                                       // long, coarse fur (T)
    claw: [36, 14, 62], pad: [0, 0, 10],
    ear: { outer: BLACK, inner: [0, 0, 12], edge: [0, 0, 16] },
    eye: { iris: [0, 0, 5], pupil: [0, 0, 2] },
    // the plume: black, its hairs' tips white along its edges, and long white hairs along its back; its tip black (T, A)
    bush: { top: [0, 0, 8], band: [0, 0, 6], fringe: [40, 10, 80], under: [0, 0, 6], streak: [[40, 12, 86], 1.2] },
  },
  // Who a skunk may be (life/plateRig.js; its family sets these once), and the poses the contact sheet shows
  // (life/plateStudio.js), each the fields of a pose its family asks for (life/families/mustelid.js).
  who: { male: {}, female: { scale: 0.88 } },
  poses: {
    waddle: { walk: 1, cycle: 0.1, neck: 0.3, tail: 0.15 },
    stride: { walk: 1, cycle: 0.6, neck: 0.3, tail: 0.15 },
    sniff: { neck: 0.25, tail: 0.15, head: { pitch: -0.2 } },
    dig: { dig: 1, cycle: 0.3, neck: 0.1, tail: 0.15 },
    warn: { tail: 1, arch: 0.7, neck: 0.8, ears: 1 },
    stamp: { tail: 1, arch: 0.7, neck: 0.8, ears: 1, stamp: 1, rear: 0.45 },
    retreat: { walk: 1, cycle: 0.35, tail: 1, neck: 0.5 },
    alert: { neck: 0.7, tail: 0.3 },
  },
  studio: { high: 0.4, tall: 0.26, middle: -0.02,
    rows: [
      { span: 0.85, high: 0.36, cells: [['male', 'male', 'alert', 'side'], ['front', 'male', 'alert', 'front'], ['behind', 'male', 'alert', 'behind'], ['three-quarters', 'male', 'alert', 'quarter']] },
      { span: 0.85, high: 0.34, cells: [['from above', 'male', null, 'above'], ['waddling, nose down', 'male', 'waddle', 'side'], ['digging for grubs', 'male', 'dig', 'quarter'], ['sniffing', 'female', 'sniff', 'quarter']] },
      { span: 0.85, high: 0.6, cells: [['warning: tail up', 'male', 'warn', 'side'], ['stamping both forefeet', 'male', 'stamp', 'quarter'], ['waddling away, tail up', 'male', 'retreat', 'rear'], ['warning, from the front', 'male', 'warn', 'front']] },
    ] },
  card: {
    size: 'About 0.6 to 0.7 m from nose to tail tip, the tail a third of it; 1.4 to 6.6 kg, the most in autumn.',
    marks: ['Black, with two white stripes along the back that meet over the shoulders and run onto the head', 'A thin white blaze between the eyes', 'A long bushy black tail, often edged in white', 'It waddles, nose down; it does not run'],
    lives: 'From dusk to dawn on the forest floor and along the edges of clearings, digging for grubs and beetles with its long front claws, and eating mice, eggs and berries. Warned off, it stamps its forefeet, raises its tail and turns its rump; its spray is the last word.',
  },
};
