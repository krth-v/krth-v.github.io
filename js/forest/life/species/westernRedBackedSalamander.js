// Western red-backed salamander, Plethodon vehiculum: a small, slender, lungless salamander of the forest's floor, dark
// on the sides with a red (or orange, yellow, olive or tan) stripe down its back from the head to the tail's tip. It
// breathes through its skin, keeps under logs, bark, stones and sword ferns by day, and is out on wet nights. Built by
// life/salamander.js from `shape` (every length in units of the snout-to-vent length), painted by
// life/salamanderSkin.js; it lives by the crawler family (life/families/crawler.js).
//
// What is published and what is not (read 2026-11-16 by an agent, each page's text through a tool that returns a
// summary, none seen as an image; kept in .local-assets/forest/research/beasts-herps-2026-11-16.json). Read: the
// snout-to-vent and total lengths of adults (ranges; no mean, sample or sex apart, and nothing of the Olympic
// Peninsula's own), the mass (5.77 g, a mean with no sample), 14 to 18 costal grooves (usually 16), 2.5 to 5.5 costal
// folds between the toes of the limbs pressed back and forward along the body (usually 3.5 to 4.5: short limbs); a
// small, thin, slender build; the stripe (red most often, with even edges, from the head to the tail's tip, often
// onto the limbs' bases), the sides dark with salt-and-pepper flecks, the belly dark with white flecks; that about one
// in ten of a coastal forest's are dark with no stripe (not shown); that it is out at night on wet ground, under
// logs, bark, stones, litter and sword ferns by day, on drier ground than the streams' edges, keeps to two square
// metres or so, and is not territorial. Not found, and the agent's own: every proportion of the head, the limbs, the
// toes and the tail (round here, and tapering), the iris (dark, with a little gold), the gait and every pose; that
// it is here among the forest's logs near the walk.
export default {
  key: 'western-red-backed-salamander', name: 'Western red-backed salamander', latin: 'Plethodon vehiculum', seed: 482,
  census: { tier: 'few', source: 'A; the second reader\'s own words, not a source\'s: "abundant but hidden under cover"', clock: 'night' },
  // How it lives on a visit (life/families/crawler.js): under a log or a stump near the walk by day, out about it on
  // the floor by night, within a couple of metres of it; still from 2.5 m of a walker, and from 1.3 m (further at a
  // run) under the nearest cover that is no nearer them. Every number here is the agent's own; that it keeps to a
  // few square metres is from what was read.
  way: {
    family: 'crawler', gap: [60, 300], there: 0.8, keeps: { logs: 1 }, territory: 2,
    pace: 0.04, dash: 0.12, swim: 0, range: 1.6, reach: 1.4, still: 2.5, warn: 0, stand: 0,
    flush: 1.3, startle: 2.8, near: 0.9, gone: 0.25, out: [40, 160], stay: [30, 150], leaves: 0.3, day: 0, night: 0.8,
  },
  plan: 'salamander',
  published: {
    shown: 'an adult with the commonest stripe, red: 48 mm from snout to vent and 87 mm in all',
    note: 'Published: the lengths, as ranges, the costal grooves, the folds between the pressed-back toes, the slender build and the colours above. The head, the limbs\' and toes\' lengths, the tail\'s girth and the eye are the agent\'s drawing; the limbs\' lengths were set so that, pressed along the body, about four folds would lie between the toes (worked out from the sheet, not measured on the mesh).',
    sources: {
      W: 'Washington Department of Fish and Wildlife, Plethodon vehiculum: 1.6 to 2.3 in snout to vent, 2.75 to 4.5 in in all; costal grooves usually 16 (14 to 18); usually 3.5 to 4.5 costal folds between adpressed toes; a stripe of red, orange, yellow, olive or tan; the sides and belly dark with salt-and-pepper flecks',
      K: 'Wikipedia, Western redback salamander: 3.8 to 5.1 cm snout to vent, 7.6 to 11.4 cm in all; slender, short-legged',
      U: 'University of Puget Sound Museum of Natural History: 7 to 11.5 cm in all; very slender; the stripe often onto the limbs\' bases',
      A: 'Animal Diversity Web, Plethodon vehiculum: a mean mass of 5.77 g; 14 to 18 costal grooves; the sides grey to black, the belly flecked with white',
    },
    mass: 'A mean mass of 5.77 g (A; no sample or sex given).',
    proportions: [
      'Small, thin and slender, with relatively short limbs (K, U, A)',
      'Usually 16 costal grooves (W): painted here from the shoulder to the hip',
      'The limbs set so that about four costal folds would lie between the toes pressed along the body (W: usually 3.5 to 4.5; worked out from the sheet)',
      'Not found: the tail\'s own length and girth, the head\'s proportions, the eye',
    ],
    lengths: [
      ['svl', 'Snout to vent, adults', null, [40.6, 58.4], 'W'],
      ['svl', 'Snout to vent, adults', null, [38, 51], 'K'],
      ['total', 'Total length, adults', null, [69.9, 114.3], 'W'],
      ['total', 'Total length, adults', null, [76, 114], 'K'],
      ['total', 'Total length', null, [70, 115], 'U'],
    ],
  },
  shape: {
    svl: 48, tail: 0.82, ends: [0.05, 0.05], axis: 0.072, neck: 0.19, shoulder: 0.25, hip: 0.88, stride: 0.36,
    //       s      up     down   half   square
    rings: [[0, 0.024, 0.017, 0.036, 2.2], [0.04, 0.032, 0.025, 0.048, 2.2], [0.1, 0.039, 0.032, 0.056, 2.2], [0.16, 0.04, 0.035, 0.055, 2.2],
      [0.21, 0.037, 0.036, 0.05, 2.1], [0.27, 0.043, 0.043, 0.055, 2.1], [0.5, 0.046, 0.046, 0.058, 2.1], [0.76, 0.046, 0.046, 0.058, 2.1],
      [0.9, 0.043, 0.041, 0.053, 2.1], [1.0, 0.039, 0.035, 0.045, 2.0], [1.15, 0.037, 0.033, 0.037, 2.0], [1.35, 0.031, 0.028, 0.029, 2.0],
      [1.55, 0.023, 0.021, 0.021, 2.0], [1.72, 0.012, 0.011, 0.011, 2.0], [1.81, 0.004, 0.004, 0.004, 2.0]],
    eye: { s: 0.08, up: 0.02, side: 0.038, r: 0.016 },
    fore: { upper: 0.085, lower: 0.07, girth: [0.026, 0.02, 0.016], foot: [0.045, 0.15], palm: 0.032, wide: 0.04, toes: [0.02, 0.032, 0.034, 0.022], toe: 0.0072, spread: 70, turn: -5 },
    hind: { upper: 0.095, lower: 0.08, girth: [0.03, 0.022, 0.017], foot: [-0.05, 0.16], palm: 0.036, wide: 0.046, toes: [0.02, 0.03, 0.038, 0.034, 0.02], toe: 0.0075, spread: 85, turn: 22 },
  },
  skin: {
    body: [
      { colour: [24, 26, 11] },                                                                         // the sides: dark brown to black (W)
      { colour: [24, 14, 17], where: (p) => smooth(0.3, 0.18, p.a) },                                   // the belly, a little greyer (A)
      // the stripe down the back, red, with even edges, from the back of the head to the tail's tip (W, U)
      { colour: [7, 64, 35], where: (p) => smooth(0.81, 0.845, p.a + 0.008 * (p.n(25) - 0.5)) * smooth(0.035, 0.08, p.s) },
      { colour: [11, 68, 41], where: (p) => smooth(0.9, 0.97, p.a) * 0.35 * smooth(0.035, 0.08, p.s) },   // (lighter down its middle)
      { colour: [6, 60, 30], where: (p) => smooth(0.81, 0.845, p.a) * 0.4 * smooth(0.5, 0.75, p.n2(6)) },   // (and darker in places)
    ],
    grooves: { count: 16, from: 0.27, to: 0.86, colour: [24, 25, 6], width: 0.011 },
    // salt and pepper: white flecks on the sides and the belly (W, A)
    spots: [
      { colour: [40, 12, 84], count: 340, size: [0.004, 0.009], where: (s, a) => a < 0.74, alpha: 0.85 },
      { colour: [40, 8, 70], count: 120, size: [0.003, 0.006], where: (s, a) => a < 0.4, alpha: 0.8 },
    ],
    mouth: { a: 0.42, to: 0.12, colour: [24, 25, 6] },
    leg: ({ d, under }) => mix(mix([24, 26, 11], [7, 62, 35], smooth(0.35, 0.05, d) * smooth(0.5, 0.15, under)), [24, 14, 17], smooth(0.4, 0.75, under) * 0.6),   // the stripe onto the limbs' bases (U)
    foot: { top: [24, 22, 14], under: [24, 14, 20] },
    eye: { iris: [38, 40, 22], pupil: [0, 0, 3], ring: [30, 25, 12], lid: [24, 26, 11] },
  },
  card: {
    size: 'An adult is 4 to 6 cm from snout to vent and 7 to 11.5 cm in all, and weighs about 6 g.',
    marks: ['A stripe down its back from the head to the tail\'s tip, most often red, with even edges', 'Dark sides and belly, flecked with white like salt and pepper', 'Small and slender, with short legs'],
    lives: 'On the forest\'s floor, under logs, bark, stones and sword ferns by day and out on wet nights, within a few square metres all its life. It has no lungs: it breathes through its damp skin.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
