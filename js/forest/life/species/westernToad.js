// Western toad, Anaxyrus boreas: a stout, warty toad with a blunt head, short legs, a pale stripe down the middle of the
// back and a long oval parotoid gland behind each eye. Built by life/frog.js from `shape` (every length in units of the
// snout-to-vent length), painted by life/frogCoat.js.
//
// What is published and what is not (read 2026-11-16 by agents, each from the page's text through a tool that returns a
// summary, none seen as an image; kept in .local-assets/forest/research/beasts-herps-2026-11-16.json). Read: the
// snout-to-vent length (ranges: no mean or sample was found); the stout body, blunt head, short legs and warty skin;
// well-developed oval parotoids and no cranial crests; horizontal pupils; a back of brown, green, olive, grey or
// reddish brown, with black blotches carrying warts with small red centres; usually a thin pale stripe down the back;
// a pale throat; males without a pronounced vocal sac; a walk or short hops. Not found, and the agent's own drawing:
// every proportion (leg and foot lengths, the head's width, the parotoids' size, the warts' size and number), the
// iris, the belly's marks beyond "mottled cream to tan with dark blotches" (one source), the toes' webbing, and every pose.
export default {
  key: 'western-toad', name: 'Western toad', latin: 'Anaxyrus boreas', seed: 359,
  census: { tier: 'rare', source: 'A', clock: 'dusk' },
  plan: 'frog',
  // How it lives on a visit: life/families/hopper.js. Alone, about a stretch of the walk near wet ground: by day under
  // cover; from dusk it walks slowly over the forest floor and across the trail. Every number is the agent's.
  way: {
    family: 'hopper', kind: 'toad', there: 0.8, gap: [90, 300],
    under: 0.05, fastest: 5,
    // (both from the walker's eye, 1.6 m up: it keeps still within 3 m on the ground, and makes for cover from 1.8 m)
    flush: 2.4, startle: 3, near: 1, gone: 0.1,
    sites: { glade: 2, gully: 2, swale: 1.5, ravine: 0.5, river: 0.3 }, off: 6,
    hidden: [1, 0.15], cycle: 120,
    leap: [0.08, 0.18], hop: [0.06, 0.14], floats: false, stroke: 0, crawl: 0.06, still: 3.4,
  },
  // (silent: the staged voices (VOICES.js, by the agent in charge) found nothing for it; by the research file its
  // males have no vocal sac and chirp mainly when handled)
  voices: { call: { silent: true } },
  published: {
    shown: 'an adult male of 85 mm (males 60 to 110 mm, rarely over 95; females larger and stouter), in a brown phase',
    note: 'Published: the snout-to-vent length, as ranges, and the marks and colours above. Everything else, the limbs, head, warts, glands and eye, is the agent\'s drawing from memory of the animal. The warts are laid at random from the sheet\'s seed.',
    sources: {
      C: 'CaliforniaHerps.com, Anaxyrus boreas: "Adults grow to 2 - 5 inches from snout to vent (5.1 - 12.7 cm)"; parotoid glands oval and well-developed; horizontal pupils; rusty warts on dark blotches; a light stripe usually on the middle of the back; males lack a pronounced vocal sac; slow, walking or crawling, with short hops',
      B: 'BC Ministry species summary: females as large as 5 in (12.7 cm) snout to vent, males rarely over 3.7 in (9.5 cm); a search snippet of it gave males 60 to 110 mm',
      W: 'Washington Department of Fish and Wildlife: a stout body, broad waist, short legs, warty skin, a blunt head; the back brown, green, olive, grey or reddish brown, with a thin light stripe',
      U: 'Burke Museum: black blotches with bumps that have small red centres; Oregon Conservation Strategy: the underside mottled cream to tan with dark blotches',
    },
    mass: 'No mass was found.',
    proportions: [
      'Stout, broad-waisted, short-legged, blunt-headed (W)',
      'Parotoid glands oval and well developed (C); built 0.2 of the body long and a little proud of the skin',
      'Not found: the hind leg\'s length against the body (built at about 1.2 body lengths from the hip to the tip of the longest toe), the head\'s width, the glands\' and warts\' sizes, the eye',
    ],
    lengths: [
      ['svl', 'Snout to vent, adults', null, [51, 127], 'C'],
      ['svl', 'Snout to vent, males (rarely over)', null, ['?', 95], 'B'],
      ['svl', 'Snout to vent, males, typical (a search snippet)', null, [60, 110], 'B'],
    ],
  },
  shape: {
    svl: 85, axis: [0.12, 9],
    //       s      up     down   half   square
    trunk: [[0.012, 0.045, 0.04, 0.07, 2], [0.06, 0.12, 0.08, 0.17, 2], [0.16, 0.18, 0.12, 0.24, 2], [0.3, 0.2, 0.14, 0.27, 2.05],
      [0.44, 0.19, 0.14, 0.27, 2.05], [0.57, 0.165, 0.13, 0.26, 2.1], [0.68, 0.13, 0.1, 0.245, 2.15], [0.8, 0.1, 0.07, 0.2, 2.2],
      [0.9, 0.075, 0.05, 0.145, 2.2], [0.96, 0.055, 0.036, 0.095, 2.1], [0.988, 0.032, 0.025, 0.05, 2]],
    hinge: [0.64, 0.7, 0.56],
    eye: { s: 0.8, up: 0.07, side: 0.125, r: 0.05 },
    hind: {
      hip: [-0.4, 0.15, 0.15], knee: [0.02, 0.1, 0.37], ankle: [-0.32, 0.05, 0.35], ball: [-0.08, 0.03, 0.4],
      girth: [0.11, 0.07, 0.055, 0.045, 0.034],
      toes: { lens: [0.06, 0.09, 0.13, 0.17, 0.11], r: 0.028, spread: 22, pad: 0, web: 0.35 },
    },
    fore: {
      shoulder: [0.1, 0.18, 0.15], elbow: [-0.02, 0.1, 0.27], wrist: [0.14, 0.03, 0.26], girth: [0.065, 0.05, 0.042, 0.038],
      fingers: { lens: [0.05, 0.065, 0.08, 0.05], r: 0.024, spread: 22, pad: 0 },
    },
    sac: { s: 0.84, size: [0.14, 0.08, 0.14] },
    features: { ridges: [], bumps: [[0.65, 0.76, 0.085, 0.12, 0.03]], warts: { count: 380, h: 0.01, r: 0.018, from: [0.05, 0.95], low: 0.32 } },
  },
  skin: {
    body: [
      { colour: [34, 24, 32] },                                                                      // a brown back (W)
      { colour: [36, 20, 42], where: (p) => 0.7 * smooth(0.62, 0.4, p.a) },                          // paler flanks
      { colour: [26, 26, 17], where: (p) => smooth(0.52, 0.62, p.n(9)) * smooth(0.5, 0.65, p.a) },    // black blotches (U)
      { colour: [16, 46, 34], where: (p) => smooth(0.4, 0.85, p.wart) * smooth(0.45, 0.6, p.a) * 0.85 },   // the warts' rusty centres (C, U)
      { colour: [40, 24, 74], where: (p) => smooth(0.42, 0.3, p.a) },                                // a cream underside (U)
      { colour: [30, 16, 40], where: (p) => smooth(0.4, 0.22, p.a) * smooth(0.56, 0.68, p.n(15)) },   // dark blotches on it (U)
      { colour: [32, 22, 38], where: (p) => smooth(0.07, 0.035, Math.hypot((p.t - 0.65) * 1.2, (p.a - 0.76) * 0.45)) * 0.7 },   // the parotoid, a little lighter (the agent's)
      { colour: [46, 28, 70], where: (p) => smooth(0.972, 0.986, p.a) * smooth(0.06, 0.12, p.t) * smooth(0.94, 0.86, p.t) },     // the thin pale stripe down the back (C, W)
      { colour: [24, 22, 22], where: (p) => smooth(0.045, 0.02, Math.hypot((p.t - 0.71) * 0.9, (p.a - 0.6) * 0.45)) },          // the tympanum
    ],
    spots: [{ colour: [24, 26, 14], count: 80, size: [0.01, 0.026], where: (t, a) => a > 0.55 && a < 0.94, alpha: 0.7 }],
    mouth: { a: 0.42, from: 0.7, colour: [22, 22, 14] },
    leg: ({ under, n }) => mix(n(8) > 0.6 ? [26, 26, 18] : [34, 22, 33], [40, 20, 68], smooth(0.55, 0.8, under)),
    foot: { top: [34, 20, 32], under: [38, 18, 56], web: [32, 16, 34] },
    eye: { iris: [40, 52, 42], pupil: [0, 0, 4], lid: [32, 22, 30], ring: [26, 40, 18] },              // the iris colour was not found: copper is the agent's
    sac: { colour: [40, 14, 62], fold: [38, 14, 46] },
  },
  card: {
    size: 'An adult is 5 to 13 cm from snout to vent; females are larger and stouter than males.',
    marks: ['Brown, olive or grey above, with dark blotches and rusty warts', 'A thin pale stripe down the middle of the back', 'A long oval gland behind each eye, and no ridges on the head'],
    lives: 'Walks or hops slowly over the forest floor, and shelters under logs and rocks by day; in the lowlands of the Pacific coast it is about at dusk and by night.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
