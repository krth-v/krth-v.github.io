// Rough-skinned newt, Taricha granulosa: a stout newt of the Pacific Northwest's lowland forest, dark brown and grainy
// above and bright orange below, one of the few salamanders that is abroad by day; its skin holds a poison
// (tetrodotoxin), and touched or threatened it bends its head and its tail up to show the orange (the unken reflex).
// Built by life/salamander.js from `shape` (every length in units of the snout-to-vent length), painted by
// life/salamanderSkin.js; it lives by the crawler family (life/families/crawler.js).
//
// What is published and what is not (read 2026-11-16 by an agent, each page's text through a tool that returns a
// summary, none seen as an image; kept in .local-assets/forest/research/beasts-herps-2026-11-16.json). Read: the
// snout-to-vent and total lengths of adults (ranges, no mean or sample, no sex apart); the colours (light brown to
// olive or brownish-black above, sharply contrasting bright orange to yellow below, from the head down the legs and
// the tail; eyes pale yellow crossed by a dark bar, small, not standing out of the head's outline seen from above);
// that the skin is granular (smooth only in a breeding male); a compact, chunky body with a rounded snout; the warning
// pose (the head bent back, the tail curled up, the orange shown); abroad by day and by night, on land in moist forest
// and in ponds and slow water, swimming among the stones of shallow margins and coming up for air. Not found, and the
// agent's own drawing from memory of the animal: every proportion (the head, the trunk, the tail's height and how
// flattened it is, the limbs, the toes), the tail as long as 0.88 of the body (the ranges allow it), the lower eyelid
// (one source has it orange, two dark: dark here), the gait and every pose.
export default {
  key: 'rough-skinned-newt', name: 'Rough-skinned newt', latin: 'Taricha granulosa', seed: 481,
  census: { tier: 'some', source: 'A; a common newt of lowland forest, abroad by day', clock: 'any' },
  // How it lives on a visit (life/families/crawler.js): on the forest's floor near the walk, the wetter the likelier
  // (and across the trail), or in the spring's basin, the pool under the falls or the creek; walking slowly, swimming
  // slowly and up for air; under a log, a stump or a fern between spells. A walker within 1.3 m (further at a run),
  // or a sudden movement within 2.2 m, has it show its warning, held while they are near; then it walks on, away.
  // From what was read: where it lives, that it is abroad by day and by night, the warning. Every number here is the
  // agent's own.
  way: {
    family: 'crawler', gap: [60, 300], there: 0.75, keeps: { floor: 0.6, spring: 0.12, pool: 0.14, creek: 0.14 }, territory: 2,
    pace: 0.05, dash: 0.07, swim: 0.09, range: 3, reach: 1.5, still: 0, warn: 1.3, stand: 0,
    flush: 0, startle: 2.2, near: 1, gone: 0.3, out: [90, 300], stay: [20, 90], leaves: 0.3, day: 0.8, night: 0.85, under: 0.05,
  },
  plan: 'salamander',
  published: {
    shown: 'an adult on land, 75 mm from snout to vent (the middle of the state\'s range) and 141 mm in all, its skin rough; a breeding male, smooth-skinned, is not shown',
    note: 'Published: the lengths, as ranges (no mean, sample or sex was found), and the colours, the skin and the warning pose above. Everything else, the head, the limbs, the toes, the tail\'s height and flattening, is the agent\'s drawing from memory of the animal.',
    sources: {
      W: 'Washington Department of Fish and Wildlife, Taricha granulosa: 2.4 to 3.5 in snout to vent, 4.33 to 7 in in all; brown on top, a bright orange underside; abroad by day',
      K: 'Wikipedia, Rough-skinned newt: 6 to 9 cm snout to vent, 11 to 18 cm in all; light brown to olive or brownish-black on top, orange to yellow below; granular skin; the unken posture',
      A: 'Animal Diversity Web, Taricha granulosa: 12.7 to 21.6 cm in all; the irises yellow; head bent back and tail curled up, showing the orange belly',
      F: 'Alaska Department of Fish and Game: 12 to 22 cm in all; plain brown to black above, sharply contrasting bright yellow to reddish orange below; pale yellow eyes crossed by a dark bar',
    },
    mass: 'No mass was found.',
    proportions: [
      'A compact, chunky salamander with a rounded snout and granular skin; small eyes that do not stand out of the head\'s outline seen from above (K; Caudata.org, as a summary has it)',
      'Built at 75 mm from snout to vent and 141 mm in all: inside every range read. The tail is flattened from side to side towards its tip and a little shorter than the head and body (the agent\'s)',
      'Not found: the limbs\' and toes\' lengths, the tail\'s height, the head\'s width',
    ],
    // [key, label, value (mm), [least, most], source]: what the built animal is measured against (life/salamander.js)
    lengths: [
      ['svl', 'Snout to vent, adults', null, [61, 89], 'W'],
      ['svl', 'Snout to vent, adults', null, [60, 90], 'K'],
      ['total', 'Total length, adults', null, [110, 178], 'W'],
      ['total', 'Total length, adults', null, [127, 216], 'A'],
    ],
  },
  shape: {
    svl: 75, tail: 0.88, ends: [0.06, 0.06], axis: 0.095, neck: 0.24, shoulder: 0.31, hip: 0.86, stride: 0.42,
    //       s      up     down   half   square
    rings: [[0, 0.03, 0.022, 0.05, 2.2], [0.05, 0.04, 0.032, 0.066, 2.3], [0.12, 0.05, 0.04, 0.078, 2.3], [0.19, 0.052, 0.045, 0.08, 2.3],
      [0.25, 0.052, 0.05, 0.073, 2.2], [0.32, 0.06, 0.062, 0.08, 2.2], [0.5, 0.068, 0.07, 0.088, 2.2], [0.7, 0.068, 0.07, 0.088, 2.2],
      [0.86, 0.062, 0.062, 0.078, 2.2], [1.0, 0.058, 0.052, 0.064, 2.1], [1.15, 0.058, 0.05, 0.05, 2.0], [1.35, 0.055, 0.045, 0.036, 1.9],
      [1.55, 0.044, 0.036, 0.024, 1.8], [1.75, 0.026, 0.021, 0.013, 1.8], [1.88, 0.01, 0.008, 0.006, 2.0]],
    eye: { s: 0.1, up: 0.022, side: 0.054, r: 0.018 },
    fore: { upper: 0.1, lower: 0.08, girth: [0.036, 0.027, 0.021], foot: [0.05, 0.175], palm: 0.042, wide: 0.05, toes: [0.03, 0.046, 0.048, 0.032], toe: 0.009, spread: 70, turn: -5 },
    hind: { upper: 0.11, lower: 0.09, girth: [0.042, 0.031, 0.023], foot: [-0.06, 0.19], palm: 0.048, wide: 0.06, toes: [0.03, 0.044, 0.054, 0.048, 0.03], toe: 0.0095, spread: 85, turn: 25 },
  },
  skin: {
    body: [
      { colour: [27, 30, 15] },                                                                       // dark brown above (W, F)
      { colour: [42, 24, 18], where: (p) => 0.5 * smooth(0.45, 0.7, p.n(5)) },                         // patches of olive (K)
      { colour: [24, 22, 10], where: (p) => 0.5 * smooth(0.55, 0.75, p.n2(9)) },                       // and of brownish-black
      // bright orange below, with a sharp line between (F); on the tail only along its lower edge (K)
      { colour: [25, 96, 46], where: (p) => smooth(0.43, 0.38, p.a + 0.02 * (p.n(30) - 0.5)) * (1 - smooth(0.02, 0.18, p.tail)) },
      { colour: [25, 96, 46], where: (p) => smooth(0.0, 0.05, p.tail) * smooth(0.3, 0.25, p.a + 0.015 * (p.n(30) - 0.5)) },
      { colour: [33, 96, 50], where: (p) => smooth(0.36, 0.1, p.a) * 0.35 * smooth(0.3, 0.6, p.n(12)) },   // yellower in places (K: orange to yellow)
    ],
    grain: { size: 0.75, relief: 0.4, from: 0.3 },
    mouth: { a: 0.42, to: 0.14, colour: [24, 30, 8] },
    leg: ({ d, under }) => mix([27, 30, 15], [25, 94, 46], smooth(0.35, 0.7, under) * (0.6 + 0.4 * d)),
    foot: { top: [27, 26, 18], under: [25, 80, 44] },
    eye: { iris: [50, 72, 62], pupil: [0, 0, 4], ring: [40, 30, 26], lid: [27, 30, 13], bar: [26, 34, 11] },      // pale yellow, a dark bar across (F)
  },
  card: {
    size: 'An adult is 6 to 9 cm from snout to vent and 11 to 18 cm in all.',
    marks: ['Dark brown above, its skin rough and grainy', 'Bright orange to yellow below, from the chin down the legs and the tail', 'Small pale yellow eyes, each crossed by a dark bar'],
    lives: 'In damp forest, and in ponds and slow water, where it breeds. One of the few salamanders abroad by day, and in no hurry: its skin holds a poison, and threatened it bends its head and tail up to show its orange underside.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
