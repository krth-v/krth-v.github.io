// Cope's giant salamander, Dicamptodon copei: the smallest of the giant salamanders, which mostly never leaves the
// water: it keeps its gills and lives its life in small, cold, rocky mountain streams, mostly in their slow pools. Dark
// brown with yellowish patches, a long slender head, a tail flattened into a low fin behind the vent. Built by
// life/salamander.js from `shape` (every length in units of the snout-to-vent length), painted by
// life/salamanderSkin.js; it lives by the crawler family (life/families/crawler.js).
//
// What is published and what is not (read 2026-11-16 by an agent: Foster, Olson and Jones 2015 as the PDF's own
// text, the rest each page's text through a tool that returns a summary; none seen as an image; kept in
// .local-assets/forest/research/beasts-herps-2026-11-16.json). Read: the greatest snout-to-vent and total lengths, the
// mean total length of the older of two size classes in 28 Olympic Peninsula streams, an adult snout-to-vent range;
// dark brown with yellowish or tan patches (the Olympic Peninsula's animals have the "classic" pattern); the belly dark
// grey in any over 50 mm; a long, slender head about as wide as the body, with a rounded snout; a slender body, short
// limbs whose toes barely meet or do not when pressed along the body; inconspicuous costal grooves (none painted);
// the tail flattened from side to side into a short, low fin that begins behind the vent; short gills, their
// filaments shorter than their stalks; small, cold, rocky streams, mostly their slow pools, at a mean depth of 8 cm in one
// study; mostly out at night, under stones, bark and wood by day; it swims with its tail's fin. Not found, and the agent's own: every proportion
// not named above, the gills' colour (a dull dark red here), the eye, the gait, every pose, and every number of how
// it lives.
export default {
  key: 'copes-giant-salamander', name: 'Cope\'s giant salamander', latin: 'Dicamptodon copei', seed: 485,
  census: { tier: 'very rare', source: 'A; gilled, hidden in cold streams', clock: 'night' },
  // How it lives on a visit (life/families/crawler.js): on the bed of a stretch of the creek above the falls, or of the
  // pool under them; down among the stones by day, out on the bed by night, walking slowly and waiting
  // long; still from 2.5 m of a walker, and from 1.6 m (further at a run) down among the stones. Every number here is
  // the agent's own.
  way: {
    family: 'crawler', gap: [60, 300], there: 0.8, keeps: { creek: 0.7, pool: 0.3 }, territory: 5,
    pace: 0.035, dash: 0.15, swim: 0, range: 1.5, reach: 1.6, still: 2.5, warn: 0, stand: 0,
    flush: 1.6, startle: 3, near: 0.9, gone: 0.2, out: [60, 240], stay: [30, 120], leaves: 0.25, day: 0.1, night: 0.85, under: 0.05,
  },
  plan: 'salamander',
  published: {
    shown: 'a gilled adult, as most are: 80 mm from snout to vent and 144 mm in all, about the mean of the older size class in the Olympic Peninsula\'s streams',
    note: 'Published: the lengths, the colours, the long slender head as wide as the body, the short limbs, the low fin behind the vent and the short gills. Every other proportion, the gills\' colour and the eye are the agent\'s.',
    sources: {
      F: 'Foster, Olson and Jones 2015, Life: The Excitement of Biology 2(4) (citing Jones and Bury 2005 and their own surveys): to 120 mm snout to vent and 200 mm in all; two size classes in 28 Olympic Peninsula streams, averaging 53 and 143 mm in all; dark brown with yellowish or tan patches; short limbs; a fin that begins behind the vent; short gills; a mean depth of 8 cm (Bury and others 1991)',
      A: 'AmphibiaWeb\'s figure, as a search summary quoted it (the page itself was not opened): 2.5 to 4.4 in (6.5 to 11.4 cm) snout to vent',
      W: 'Washington Department of Fish and Wildlife, Dicamptodon copei: to 7.5 in in all, 4.5 in snout to vent; tan-to-yellow pigment on the back and sides; the belly bluish grey in larger ones',
      O: 'Oregon Conservation Strategy: up to 4.75 in snout to vent and 8 in in all; a long head about the width of the body',
    },
    mass: 'No mass was found.',
    proportions: [
      'A long, slender head, about as wide as the body, with a rounded snout (F, O)',
      'Short limbs: their toes barely meet, or do not, when pressed along the body (F); built so that they do not (worked out from the sheet)',
      'The tail flattened from side to side into a short, low fin that begins behind the vent; short gills, their filaments shorter than their stalks (F)',
    ],
    lengths: [
      ['svl', 'Snout to vent, adults', null, [65, 114], 'A'],
      ['svl', 'Snout to vent, the largest', null, ['?', 120], 'F'],
      ['total', 'Total length, the older of two size classes, 28 Olympic Peninsula streams (mean)', 143, ['?', '?'], 'F'],
      ['total', 'Total length, the largest', null, ['?', 200], 'F'],
    ],
  },
  shape: {
    svl: 80, tail: 0.8, ends: [0.05, 0.04], axis: 0.08, neck: 0.22, shoulder: 0.28, hip: 0.86, stride: 0.34,
    //       s      up     down   half   square
    rings: [[0, 0.025, 0.02, 0.045, 2.3], [0.04, 0.036, 0.03, 0.062, 2.3], [0.1, 0.044, 0.038, 0.07, 2.3], [0.18, 0.048, 0.044, 0.072, 2.2],
      [0.23, 0.05, 0.048, 0.07, 2.2], [0.3, 0.056, 0.056, 0.074, 2.2], [0.55, 0.06, 0.06, 0.078, 2.2], [0.8, 0.058, 0.056, 0.074, 2.2],
      [0.92, 0.054, 0.05, 0.064, 2.1], [1.0, 0.05, 0.044, 0.05, 1.9], [1.08, 0.062, 0.05, 0.036, 1.4], [1.3, 0.07, 0.056, 0.026, 1.25],
      [1.5, 0.06, 0.048, 0.018, 1.25], [1.68, 0.036, 0.03, 0.01, 1.3], [1.78, 0.012, 0.01, 0.005, 1.5], [1.797, 0.004, 0.004, 0.003, 1.8]],
    eye: { s: 0.1, up: 0.03, side: 0.05, r: 0.017 },
    fore: { upper: 0.085, lower: 0.07, girth: [0.034, 0.026, 0.02], foot: [0.05, 0.17], palm: 0.035, wide: 0.045, toes: [0.02, 0.032, 0.034, 0.022], toe: 0.0085, spread: 70, turn: -5 },
    hind: { upper: 0.095, lower: 0.08, girth: [0.04, 0.03, 0.022], foot: [-0.05, 0.18], palm: 0.04, wide: 0.05, toes: [0.022, 0.032, 0.038, 0.034, 0.02], toe: 0.009, spread: 85, turn: 22 },
    gills: { s: 0.2, up: 0.03, side: 0.062, r: 0.013, stalks: [[0.075, 70, 30], [0.085, 80, 5], [0.07, 90, -20]], fringe: [5, 0.03] },
  },
  skin: {
    body: [
      { colour: [25, 30, 14] },                                                                         // dark brown (F)
      // with yellowish or tan patches, the "classic" pattern (F)
      { colour: [37, 40, 38], where: (p) => smooth(0.58, 0.66, p.n(13) + 0.1 * (p.n2(34) - 0.5)) * smooth(0.3, 0.45, p.a) },
      { colour: [32, 36, 27], where: (p) => 0.35 * smooth(0.55, 0.65, p.n2(18)) * smooth(0.3, 0.45, p.a) },
      { colour: [215, 8, 30], where: (p) => smooth(0.3, 0.2, p.a) },                                    // the belly dark, bluish grey (F, W)
    ],
    spots: [
      { colour: [40, 45, 52], count: 220, size: [0.003, 0.006], where: (s, a) => a > 0.35, alpha: 0.7 },   // a granular tan-to-yellow pigment (W)
    ],
    mouth: { a: 0.43, to: 0.16, colour: [26, 30, 9] },
    leg: ({ d, under }) => mix(mix([25, 30, 14], [34, 36, 30], smooth(0.2, 0.9, d) * 0.4), [30, 5, 30], smooth(0.45, 0.8, under) * 0.8),   // (below, a grey that mixes with the brown without a green between)
    foot: { top: [28, 28, 26], under: [30, 5, 32] },
    eye: { iris: [38, 42, 30], pupil: [0, 0, 3], ring: [26, 30, 12], lid: [26, 32, 17] },
    gills: { stalk: [358, 28, 24], fringe: [352, 34, 28] },
  },
  card: {
    size: 'An adult is 6.5 to 12 cm from snout to vent and as much as 20 cm in all; in the Olympic Peninsula\'s streams the larger ones average about 14 cm.',
    marks: ['Dark brown with yellowish or tan patches', 'Short, dark gills behind the head, kept for life', 'A long, slender head; the tail a low fin behind the vent'],
    lives: 'In small, cold, rocky mountain streams, mostly in their slow, shallow pools; out on the bed at night and under the stones by day. Unlike its relatives it seldom leaves the water: most keep their gills, and breed without ever coming onto land.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
