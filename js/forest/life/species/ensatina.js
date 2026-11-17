// Ensatina, Ensatina eschscholtzii oregonensis (the Oregon ensatina): a lungless salamander of the forest's floor with
// long legs, a short body and a tail pinched in at its base; brown above with small yellow-orange flecks, its sides
// orange, its belly whitish. Under logs and bark by day, out on wet nights; disturbed, it stands tall on stiff legs
// with its tail raised. Built by life/salamander.js from `shape` (every length in units of the snout-to-vent length),
// painted by life/salamanderSkin.js; it lives by the crawler family (life/families/crawler.js).
//
// What is published and what is not (read 2026-11-16 by an agent, each page's text through a tool that returns a
// summary, none seen as an image; kept in .local-assets/forest/research/beasts-herps-2026-11-16.json). Read, on
// CaliforniaHerps' page of the Oregon form: the snout-to-vent and total lengths (ranges; no mean, sample or sex, and
// nothing of the Olympic Peninsula's own), 12 to 13 costal grooves, long legs and a relatively short body, the tail
// rounded and constricted at its base; light to dark brown above with small yellow to orange flecks, the sides
// yellowish-orange mottled with light markings, the belly whitish with fine black speckling, the limbs' bases yellow
// to orange; the defence (it stands tall and stiff-legged, its back swayed and its tail raised, and sways it); that it
// waits for its prey or stalks it slowly; under logs, bark and debris by day, out on wet nights; almost silent. Not
// found, and the agent's own: every proportion of the head, the eye (large and dark here), the limbs, the toes and the
// tail, the gait and every pose.
export default {
  key: 'ensatina', name: 'Ensatina', latin: 'Ensatina eschscholtzii oregonensis', seed: 483,
  census: { tier: 'few', source: 'A; under bark and logs', clock: 'night' },
  // How it lives on a visit (life/families/crawler.js): under a log or a stump near the walk (or on the floor near
  // one) by day, out about it by night; still from 2.5 m of a walker, from 1.2 m (further at a run) under the nearest
  // cover, or, one time in three, standing its ground, tall. Every number here is the agent's own.
  way: {
    family: 'crawler', gap: [60, 300], there: 0.8, keeps: { logs: 0.8, floor: 0.2 }, territory: 3,
    pace: 0.05, dash: 0.11, swim: 0, range: 2.4, reach: 1.3, still: 2.5, warn: 0, stand: 0.33,
    flush: 1.2, startle: 2.8, near: 0.85, gone: 0.25, out: [50, 180], stay: [30, 150], leaves: 0.3, day: 0, night: 0.8,
  },
  plan: 'salamander',
  published: {
    shown: 'an adult: 58 mm from snout to vent and 113 mm in all',
    note: 'Published: the lengths, as ranges, the costal grooves, the build (long legs, a short body, the tail pinched in at its base) and the colours above. The head, the eye, the limbs\' and toes\' lengths and the tail\'s girth are the agent\'s drawing.',
    sources: {
      C: 'CaliforniaHerps, Oregon ensatina: 1.5 to 3.2 in (3.8 to 8.1 cm) snout to vent, 3 to 6 in (7.5 to 15.5 cm) in all; 12 to 13 costal grooves; long legs and a relatively short body; the tail rounded and constricted at its base; light to dark brown above with small yellow to orange flecks, the sides yellowish-orange and mottled with light markings, the belly whitish with fine black speckling, the limbs\' bases yellow to orange; it stands tall in a stiff-legged defensive posture with its back swayed and its tail raised',
    },
    mass: 'No mass was found.',
    proportions: [
      'Long legs and a relatively short body, with 12 to 13 costal grooves (C): 12 painted here',
      'The tail rounded and constricted at its base (C)',
      'Not found: the head\'s proportions, the eye, the limbs\' and toes\' lengths',
    ],
    lengths: [
      ['svl', 'Snout to vent, adults', null, [38, 81], 'C'],
      ['total', 'Total length, adults', null, [75, 155], 'C'],
    ],
  },
  shape: {
    svl: 58, tail: 0.95, ends: [0.05, 0.05], axis: 0.11, neck: 0.22, shoulder: 0.28, hip: 0.82, stride: 0.5,
    //       s      up     down   half   square
    rings: [[0, 0.028, 0.02, 0.046, 2.2], [0.05, 0.04, 0.03, 0.066, 2.3], [0.11, 0.05, 0.038, 0.078, 2.3], [0.18, 0.052, 0.043, 0.076, 2.2],
      [0.23, 0.048, 0.046, 0.066, 2.1], [0.3, 0.058, 0.058, 0.074, 2.1], [0.55, 0.064, 0.064, 0.08, 2.1], [0.74, 0.062, 0.06, 0.077, 2.1],
      [0.86, 0.056, 0.052, 0.067, 2.0], [1.0, 0.045, 0.04, 0.05, 2.0], [1.06, 0.035, 0.032, 0.035, 2.0], [1.2, 0.052, 0.046, 0.05, 2.0],
      [1.42, 0.05, 0.044, 0.046, 2.0], [1.62, 0.04, 0.036, 0.036, 2.0], [1.8, 0.023, 0.021, 0.021, 2.0], [1.92, 0.008, 0.008, 0.008, 2.0]],
    eye: { s: 0.095, up: 0.026, side: 0.054, r: 0.026 },
    fore: { upper: 0.13, lower: 0.11, girth: [0.034, 0.026, 0.02], foot: [0.06, 0.22], palm: 0.04, wide: 0.05, toes: [0.025, 0.04, 0.042, 0.028], toe: 0.0085, spread: 70, turn: -5 },
    hind: { upper: 0.14, lower: 0.12, girth: [0.04, 0.03, 0.022], foot: [-0.07, 0.23], palm: 0.044, wide: 0.056, toes: [0.025, 0.038, 0.048, 0.042, 0.025], toe: 0.009, spread: 85, turn: 22 },
  },
  skin: {
    body: [
      { colour: [22, 38, 18] },                                                                         // brown above (C)
      { colour: [20, 34, 13], where: (p) => 0.45 * smooth(0.5, 0.7, p.n(5)) },                          // (light to dark brown)
      // the sides yellowish-orange, mottled with light markings (C)
      { colour: [28, 70, 42], where: (p) => smooth(0.62, 0.48, p.a) * smooth(0.16, 0.28, p.a) * (0.65 + 0.35 * smooth(0.35, 0.6, p.n(12))) },
      { colour: [36, 50, 60], where: (p) => smooth(0.56, 0.46, p.a) * smooth(0.2, 0.3, p.a) * 0.8 * smooth(0.66, 0.74, p.n2(26)) },
      { colour: [40, 18, 82], where: (p) => smooth(0.23, 0.14, p.a) },                                  // the belly whitish (C)
    ],
    grooves: { count: 12, from: 0.3, to: 0.8, colour: [22, 34, 10], width: 0.013 },
    spots: [
      { colour: [36, 88, 56], count: 150, size: [0.005, 0.012], where: (s, a) => a > 0.55 },           // small yellow to orange flecks (C)
      { colour: [20, 20, 14], count: 170, size: [0.003, 0.006], where: (s, a) => a < 0.22, alpha: 0.75 },   // fine black speckling below (C)
    ],
    mouth: { a: 0.42, to: 0.14, colour: [22, 34, 10] },
    leg: ({ d, under }) => mix(mix([22, 38, 18], [34, 86, 52], smooth(0.55, 0.1, d)), [40, 20, 78], smooth(0.45, 0.8, under) * 0.7),   // the limbs' bases yellow to orange (C)
    foot: { top: [26, 36, 30], under: [38, 22, 72] },
    eye: { iris: [32, 36, 16], pupil: [0, 0, 3], ring: [26, 30, 10], lid: [24, 40, 20] },
  },
  card: {
    size: 'An adult is 4 to 8 cm from snout to vent and 7.5 to 15.5 cm in all.',
    marks: ['Brown above, with small yellow to orange flecks', 'Orange sides and the bases of its long legs; a whitish belly', 'The tail pinched in where it meets the body'],
    lives: 'On the forest\'s floor, under logs and loose bark by day and out on wet nights, waiting for small prey or stalking it slowly. Disturbed, it stands tall on stiff legs with its back swayed and its tail raised.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
