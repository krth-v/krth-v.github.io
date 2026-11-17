// Northern red-legged frog, Rana aurora: a medium, slim-waisted, long-legged frog of the wet forests of the Pacific
// coast, smooth-skinned, with a ridge (the dorsolateral fold) down each side of its back and red under its hind legs.
// Built by life/frog.js from `shape` (every length in units of the snout-to-vent length), painted by life/frogCoat.js.
//
// What is published and what is not (read 2026-11-16 by agents, each from the page's text through a tool that returns
// a summary, none seen as an image; kept in .local-assets/forest/research/beasts-herps-2026-11-16.json). Read: the
// snout-to-vent length of adults (a range, and a BC summary's 50 to 60 mm); the colours (a tan, brown or olive-brown
// back with black flecks and spots; red under the hind legs and along the body's margins; a dark mask; a creamy,
// grey-marbled chest and throat); the prominent folds; webbing on the hind feet; the long hind legs; that it stays
// still and then leaps. Not found, and the agent's own drawing: every proportion (the hind leg's length against the
// body, the head's width, the eye, the tympanum, the webbing's extent), the colour of the folds, the iris (one
// source: golden brown), and every pose. How this frog sits and how it leaps is from no source.
export default {
  key: 'northern-red-legged-frog', name: 'Northern red-legged frog', latin: 'Rana aurora', seed: 353,
  census: { tier: 'few', source: 'A; secretive; breeding is over by May', clock: 'any' },
  plan: 'frog',
  // How it lives on a visit: life/families/hopper.js. Alone, in the wet ground and at the creek (after its breeding,
  // which is over by May, it keeps to damp forest: the research file); by day mostly hidden, by night out; still until
  // the walker is near, then off in long leaps into the brush, or onto the water, where it swims off at the surface.
  // Silent in May. Every number is the agent's.
  way: {
    family: 'hopper', kind: 'ranid', there: 0.75, gap: [60, 240],
    fastest: 5,
    flush: 4.5, startle: 8, near: 0.85, gone: 0.25,
    sites: { glade: 3, gully: 2, swale: 0.3, pool: 0.6, ravine: 0.6, river: 0.2 }, off: 14,
    hidden: [0.85, 0.3], cycle: 90,
    leap: [0.5, 1.1], hop: [0.1, 0.35], floats: true, stroke: 0.2, crawl: 0, still: 0,
  },
  // (silent: the staged voices (VOICES.js, by the agent in charge) found nothing for it; and by the research file its
  // calling, quiet and mostly under water, is over by May)
  voices: { call: { silent: true } },
  published: {
    shown: 'an adult of 58 mm (the middle of the British Columbia summary\'s range), the colours of the coastal form',
    note: 'Published: the snout-to-vent length, as a range (no mean or sample was found), and the colours and marks above. Everything else, the legs, head, eye, folds and webbing, is the agent\'s drawing from memory of the animal.',
    sources: {
      C: 'CaliforniaHerps.com, Rana aurora: "Adults are 1.75 to 3 inches long from snout to vent (4.4 - 7.6 cm)"; slim waist, long legs, webbing on the hind feet, prominent dorsolateral folds',
      D: 'BC Conservation Data Centre species summary, adults at 50 to 60 mm snout to vent (as a search summary gave it; the page itself was not opened)',
      W: 'Washington Department of Fish and Wildlife: tan, brown or olive-brown back with black spotting; the undersides of the legs and body margins brick to orange-red; females rarely exceed 3.5 in, males 3 in',
      U: 'Burke Museum: red to brownish, with black splotches and flecks; legs with black bands',
    },
    mass: 'No mass was found.',
    proportions: [
      'Slim waist, long legs, smooth skin, webbed hind feet (C)',
      'Prominent folds along the back (C); their colour was not found (built paler than the back)',
      'Not found: the hind leg\'s length against the body (built at about 1.9 body lengths from the hip to the tip of the longest toe), the head\'s width, the eye, the tympanum',
    ],
    // [key, label, value (mm), [least, most], source]: what the built frog is measured against (life/frog.js)
    lengths: [
      ['svl', 'Snout to vent, adults', null, [44.5, 76.2], 'C'],
      ['svl', 'Snout to vent, adults (BC)', null, [50, 60], 'D'],
    ],
  },
  shape: {
    svl: 58, axis: [0.13, 13],
    //       s      up     down   half   square
    trunk: [[0.012, 0.04, 0.035, 0.05, 2], [0.06, 0.1, 0.075, 0.12, 2], [0.16, 0.155, 0.11, 0.16, 2], [0.3, 0.165, 0.125, 0.16, 2.05],
      [0.44, 0.14, 0.12, 0.145, 2.05], [0.57, 0.125, 0.11, 0.165, 2.1], [0.68, 0.11, 0.08, 0.18, 2.15], [0.8, 0.09, 0.056, 0.15, 2.2],
      [0.9, 0.068, 0.042, 0.105, 2.2], [0.96, 0.046, 0.032, 0.065, 2.1], [0.988, 0.026, 0.021, 0.034, 2]],
    hinge: [0.62, 0.68, 0.55],
    eye: { s: 0.78, up: 0.05, side: 0.115, r: 0.06 },
    hind: {
      hip: [-0.42, 0.16, 0.11], knee: [0.12, 0.11, 0.32], ankle: [-0.48, 0.055, 0.28], ball: [-0.14, 0.025, 0.34],
      girth: [0.1, 0.055, 0.045, 0.032, 0.024],
      toes: { lens: [0.11, 0.16, 0.24, 0.35, 0.23], r: 0.018, spread: 22, pad: 0, web: 0.75 },
    },
    fore: {
      shoulder: [0.08, 0.2, 0.1], elbow: [-0.05, 0.09, 0.19], wrist: [0.12, 0.025, 0.18], girth: [0.045, 0.034, 0.028, 0.025],
      fingers: { lens: [0.08, 0.07, 0.11, 0.07], r: 0.016, spread: 24, pad: 0 },
    },
    sac: { s: 0.82, size: [0.2, 0.1, 0.18] },
    features: { ridges: [[0.14, 0.72, 0.8, 0.03, 0.016]], bumps: [] },
  },
  skin: {
    body: [
      { colour: [24, 34, 33] },                                                                      // brown, a little red (W, U)
      { colour: [26, 30, 40], where: (p) => 0.75 * smooth(0.7, 0.5, p.a) },                          // paler flanks
      { colour: [20, 26, 15], where: (p) => smooth(0.6, 0.7, p.n(8)) * smooth(0.55, 0.68, p.a) * smooth(0.78, 0.64, p.t) },   // black blotches on the back (C)
      { colour: [44, 22, 80], where: (p) => smooth(0.44, 0.3, p.a) },                                // a creamy belly (C)
      { colour: [30, 8, 50], where: (p) => smooth(0.36, 0.2, p.a) * smooth(0.5, 0.72, p.t) * (0.4 + 0.6 * p.n(26)) },   // a chest and throat marbled grey (C)
      { colour: [10, 62, 44], where: (p) => 0.9 * smooth(0.5, 0.32, p.a) * smooth(0.5, 0.18, p.t) },  // brick to orange-red along the body's margins, behind (W, C)
      { colour: [30, 30, 46], where: (p) => folds(p) },                                              // the folds, paler than the back (their colour was not found)
      { colour: [40, 26, 70], where: (p) => jaw(p) },                                                // a stripe from the shoulder to the front of the upper jaw (C); that it is pale is the agent's
      { colour: [18, 32, 14], where: (p) => mask(p) },                                               // a dark mask over the ear (C)
    ],
    spots: [{ colour: [16, 22, 11], count: 260, size: [0.004, 0.01], where: (t, a) => a > 0.5 && t > 0.08 }, { colour: [14, 20, 10], count: 30, size: [0.01, 0.022], where: (t, a) => a > 0.6 && t > 0.1 && t < 0.66, alpha: 0.8 }],
    mouth: { a: 0.42, from: 0.68, colour: [18, 22, 12] },
    leg: ({ d, under, hind, n }) => {
      const top = n(9) > 0.6 ? [18, 24, 15] : [24, 32, 33];                                          // black bands on the legs (U)
      return hind ? mix(top, [9, 64, 46], smooth(0.55, 0.8, under)) : mix(top, [40, 20, 72], smooth(0.55, 0.8, under));
    },
    foot: { top: [24, 28, 32], under: [16, 40, 46], pad: [24, 24, 40], web: [16, 26, 30] },
    eye: { iris: [36, 58, 42], pupil: [0, 0, 4], lid: [22, 30, 26], ring: [20, 40, 18] },              // golden brown (Wikipedia, one source)
    sac: { colour: [30, 15, 60], fold: [28, 15, 44] },
  },
  card: {
    size: 'An adult is 5 to 8 cm from snout to vent; females are larger than males.',
    marks: ['Tan to brown above, with black flecks and spots', 'Red under the hind legs and along the body\'s edges', 'A dark mask, a ridge down each side of the back and webbed hind feet'],
    lives: 'In damp forest and beside still, shallow water in the lowlands of the Pacific coast. It sits still, hidden by its colours, and leaps into brush or water when something comes too near.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// the folds: a raised line down each side of the back, behind the eye to the hips (shape.features.ridges)
const folds = (p) => smooth(0.03, 0.012, Math.abs(p.a - 0.8)) * smooth(0.14, 0.2, p.t) * smooth(0.72, 0.66, p.t);
// The mask: dark from the snout's side, through the eye (a = 0.72 by the head's rings) and over the ear, ending at
// the shoulder; under it the pale stripe along the jaw.
const maskAt = (t) => (t > 0.78 ? 0.72 + (t - 0.78) * 0.25 : t > 0.6 ? 0.72 - (0.78 - t) * 0.9 : 0.56);
const mask = (p) => smooth(0.075, 0.055, Math.abs(p.a - maskAt(p.t))) * smooth(0.58, 0.63, p.t) * smooth(0.98, 0.95, p.t);
const jaw = (p) => { const d = maskAt(p.t) - 0.065 - p.a; return smooth(-0.01, 0.01, d) * smooth(0.07, 0.045, d) * smooth(0.58, 0.63, p.t) * smooth(0.985, 0.96, p.t); };
