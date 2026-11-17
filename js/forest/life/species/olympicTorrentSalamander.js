// Olympic torrent salamander, Rhyacotriton olympicus: a small salamander found nowhere but the Olympic Peninsula's
// cold seeps and streams and the splash of their falls, seldom more than a metre from water. Brown, speckled white
// along its sides, yellow beneath; big, bulging eyes; a short tail flattened from side to side. Its lungs are tiny:
// it breathes through its skin. Built by life/salamander.js from `shape` (every length in units of the snout-to-vent
// length), painted by life/salamanderSkin.js; it lives by the crawler family (life/families/crawler.js).
//
// What is published and what is not (read 2026-11-16 by an agent, each page's text through a tool that returns a
// summary, none seen as an image; kept in .local-assets/forest/research/beasts-herps-2026-11-16.json). Read: the
// snout-to-vent lengths of adults (a range, and an upper bound) and the greatest total length; brown with white
// speckling, denser on the sides, and usually no dark spots on the back; the belly yellow to orange-yellow, with dark
// spots in some; the upper limbs lighter brown, mottled darker; dark spots on the neck and chin; the skin shiny and
// closely pitted (not shown: the forest's animals share one material); a small head with a short, rounded snout; large,
// bulging eyes, about as wide as the snout is long; a long, slim trunk with 14 costal grooves and a groove down the
// back; a short tail, shorter than the head and body, flattened from side to side and ridged on top; short limbs, five
// rounded toes behind, the third longest; cold streams, seeps and the splash zones of falls. Not found, and the
// agent's own: every proportion not named above, the iris (dark, flecked with gold, as a relative's is), the gait,
// every pose, and every number of how it lives.
export default {
  key: 'olympic-torrent-salamander', name: 'Olympic torrent salamander', latin: 'Rhyacotriton olympicus', seed: 484,
  census: { tier: 'very rare', source: 'A, endemic; seeps and the splash of falls', clock: 'any' },
  // How it lives on a visit (life/families/crawler.js): on the wet margin of the creek at the head of the falls, where
  // the footbridge crosses it, or of the spring, a seep; mostly down among the stones by day, more often out by night;
  // still from 3 m of a walker, and from 2 m (further at a run) quickly down into the water among the stones. Every
  // number here is the agent's own; that it keeps within a metre of the water is from what was read. (Its own place,
  // the wet rock round the pool under the falls, waits for the habitat to know the rock: life/places/salamanders2.js.)
  way: {
    family: 'crawler', gap: [60, 300], there: 0.8, keeps: { falls: 0.6, seep: 0.4 }, territory: 1.2,
    pace: 0.035, dash: 0.25, swim: 0, range: 1, reach: 1.2, still: 3, warn: 0, stand: 0,
    flush: 2, startle: 3.5, near: 0.95, gone: 0.2, out: [20, 90], stay: [40, 160], leaves: 0.25, day: 0.3, night: 0.85, under: 0.05,
  },
  plan: 'salamander',
  published: {
    shown: 'an adult: 52 mm from snout to vent and 89 mm in all',
    note: 'Published: the lengths, the grooves, the build (a small head and short snout, big bulging eyes, a long slim trunk, a short flattened tail ridged on top, short limbs) and the colours above. Every other proportion is the agent\'s drawing.',
    sources: {
      K: 'Wikipedia, Olympic torrent salamander (citing Stebbins 1985): 4.1 to 6.2 cm snout to vent, as much as 12 cm in all; the tail shorter than the snout-vent length, flattened from side to side and ridged on top; brown with white speckling denser on the sides; the belly yellow to orange-yellow',
      W: 'Washington Department of Fish and Wildlife, Rhyacotriton olympicus: less than 2.4 in snout to vent',
      E: 'Encyclopedia of Puget Sound: a mean snout-to-vent length of the largest tenth of adults of 59.0 mm (males) and 57.3 mm (females)',
      H: 'Herpedia, as a summary had it: large, prominent eyes, about as wide as the snout is long',
    },
    mass: 'No mass was found.',
    proportions: [
      'A small head with a short, rounded snout, and large, bulging eyes about as wide as the snout is long (K, H)',
      'A long, slim trunk with 14 costal grooves and a groove down the back (K): both painted here',
      'A short tail, shorter than the head and body, flattened from side to side and ridged on top; short limbs with five rounded toes behind, the third longest (K)',
    ],
    lengths: [
      ['svl', 'Snout to vent, adults', null, [41, 62], 'K'],
      ['svl', 'Snout to vent, adults', null, ['?', 61], 'W'],
      ['total', 'Total length, the largest', null, ['?', 120], 'K'],
    ],
  },
  shape: {
    svl: 52, tail: 0.72, ends: [0.05, 0.04], axis: 0.075, neck: 0.18, shoulder: 0.24, hip: 0.86, stride: 0.36,
    //       s      up     down   half   square
    rings: [[0, 0.026, 0.018, 0.04, 2.2], [0.04, 0.036, 0.026, 0.052, 2.2], [0.09, 0.043, 0.032, 0.058, 2.2], [0.15, 0.044, 0.036, 0.056, 2.2],
      [0.2, 0.04, 0.038, 0.05, 2.1], [0.26, 0.046, 0.046, 0.057, 2.1], [0.5, 0.05, 0.05, 0.06, 2.1], [0.75, 0.05, 0.05, 0.06, 2.1],
      [0.9, 0.048, 0.045, 0.054, 2.0], [1.0, 0.046, 0.04, 0.044, 1.9], [1.15, 0.05, 0.042, 0.032, 1.6], [1.35, 0.046, 0.038, 0.024, 1.5],
      [1.55, 0.032, 0.026, 0.016, 1.5], [1.68, 0.014, 0.012, 0.008, 1.6], [1.715, 0.004, 0.004, 0.003, 1.8]],
    eye: { s: 0.075, up: 0.024, side: 0.042, r: 0.024 },
    fore: { upper: 0.075, lower: 0.06, girth: [0.026, 0.02, 0.016], foot: [0.04, 0.15], palm: 0.03, wide: 0.04, toes: [0.018, 0.028, 0.03, 0.02], toe: 0.0072, spread: 70, turn: -5 },
    hind: { upper: 0.085, lower: 0.07, girth: [0.03, 0.022, 0.017], foot: [-0.05, 0.16], palm: 0.034, wide: 0.046, toes: [0.018, 0.028, 0.036, 0.032, 0.018], toe: 0.0075, spread: 85, turn: 22 },
  },
  skin: {
    body: [
      { colour: [28, 34, 27] },                                                                         // brown (K)
      { colour: [26, 30, 22], where: (p) => 0.4 * smooth(0.5, 0.7, p.n(6)) },
      { colour: [45, 86, 55], where: (p) => smooth(0.3, 0.2, p.a + 0.02 * (p.n(30) - 0.5)) },           // the belly yellow to orange-yellow (K)
      { colour: [38, 88, 52], where: (p) => smooth(0.25, 0.1, p.a) * 0.4 * smooth(0.4, 0.6, p.n2(8)) },
      { colour: [26, 32, 15], where: (p) => smooth(0.965, 0.99, p.a) * smooth(0.16, 0.22, p.s) },       // the groove down the back (K)
    ],
    grooves: { count: 14, from: 0.26, to: 0.84, colour: [26, 30, 12], width: 0.011 },
    spots: [
      { colour: [45, 10, 86], count: 300, size: [0.003, 0.007], where: (s, a) => a > 0.24 && a < 0.72, alpha: 0.85 },   // white speckling, denser on the sides (K)
      { colour: [45, 10, 82], count: 70, size: [0.003, 0.006], where: (s, a) => a >= 0.72, alpha: 0.8 },
      { colour: [25, 30, 16], count: 28, size: [0.008, 0.016], where: (s, a) => a < 0.2 },              // dark spots below, in some (K)
      { colour: [25, 30, 15], count: 30, size: [0.006, 0.012], where: (s, a) => s < 0.24 && a < 0.55 },  // and on the neck and chin
    ],
    mouth: { a: 0.42, to: 0.11, colour: [26, 30, 12] },
    leg: ({ d, under }) => mix(mix([30, 32, 40], [28, 34, 26], smooth(0.3, 0.9, d)), [45, 70, 56], smooth(0.45, 0.8, under) * 0.75),   // the upper limbs lighter brown (K)
    foot: { top: [29, 30, 34], under: [44, 55, 58] },
    eye: { iris: [40, 45, 26], pupil: [0, 0, 3], ring: [30, 30, 14], lid: [28, 34, 24] },
  },
  card: {
    size: 'An adult is 4 to 6 cm from snout to vent, and at the most 12 cm in all.',
    marks: ['Brown, speckled with white along its sides', 'Yellow to orange-yellow beneath', 'Big, bulging eyes; a short tail, flattened from side to side'],
    lives: 'Only on the Olympic Peninsula, in cold seeps and streams and the splash of falls, seldom a metre from the water. Its lungs are tiny: it breathes through its skin, and cannot bear to dry out.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
