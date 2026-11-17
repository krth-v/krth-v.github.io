// Pacific chorus frog, Pseudacris regilla: a small, slim treefrog with a large head and large eyes, a wide dark
// stripe through each eye from the nostril to the shoulder, round pads on its toe tips and little webbing. Built by
// life/frog.js from `shape` (every length in units of the snout-to-vent length), painted by life/frogCoat.js.
//
// What is published and what is not (read 2026-11-16 by agents, each from the page's text through a tool that returns a
// summary, none seen as an image; kept in .local-assets/forest/research/beasts-herps-2026-11-16.json). Read: the
// snout-to-vent length (two ranges; no mean or sample was found: females are larger than males); a back that is
// variable, most often green or brown, with irregular dark spots; the wide dark stripe through each eye from the
// nostril to the shoulder; a pale or white belly with yellow under the hind legs; a large head, large eyes, a slim waist,
// long slender legs; a round pad on each toe tip (the sources differ on how large); limited webbing; in breeding
// males a darkened, wrinkled throat. Not found, and the agent's own drawing: every proportion, the pads' diameter, the
// iris colour, the throat sac's colour when blown up, whether the stripe runs through the tympanum, and every pose.
//
// Drawn again on 2026-11-16 by the agent called frogs2, from the same reading (none of it is new), where the first
// drawing was wrong in its own terms: the shoulder stood under the eye, so the arm came out of the jaw; the hip stood
// a fifth of the body forward of the vent, where a frog's thigh leaves the body at its very end; the eyes were small
// domes on the crown, where "large eyes" bulge from the head's upper corners; the pads were 2.4 times a toe's width
// (the sources differ, and none says large: now 1.7); the pupil was an upright slit, painted for the whole plan; the
// eye stripe was a soft brown smear, where it is "wide" and "dark". Every proportion is still the agent's: the hind
// limb is about 1.55 body lengths from the hip to the tip of the fourth toe, the head about a third of the body.
export default {
  key: 'pacific-chorus-frog', name: 'Pacific chorus frog', latin: 'Pseudacris regilla', seed: 367,
  census: { tier: 'some', source: 'A; Wikipedia\'s list of the park\'s amphibians and reptiles: "a very common species"; calls March to June', party: [3, 12], clock: 'dusk' },
  plan: 'frog',
  // How it lives on a visit: life/families/hopper.js. A party of males at a site by the water, each on a seat of its
  // own; by day mostly hidden in the water or under the plants, from dusk out and calling. Every number is the agent's.
  way: {
    family: 'hopper', kind: 'chorus', there: 0.9, gap: [40, 160],
    fastest: 5,                                     // (for the count: a leap is slow. Under the water a frog keeps above the bed, which is the count's bar)
    flush: 2.6, startle: 5, near: 0.9, gone: 0.1,   // into the water or the plants from 2.6 m at a stroll (life/behave.js `pace`)
    sites: { glade: 3, swale: 3, gully: 1, pool: 1.2, ravine: 0.3, river: 0.6 }, off: 22,
    hidden: [0.75, 0.15], cycle: 70,                // hidden three quarters of the day, a seventh of the night; a round of 70 s
    leap: [0.25, 0.6], hop: [0.08, 0.25], floats: true, stroke: 0.12, crawl: 0, still: 0,
    // a bout is the recording (three calls in 4.37 s: sound/voices.js), the sac blown up for each call; one every 2.5
    // to 8 s from dusk, fourteen times as seldom by day; quiet within 13 m of the walker (further for one who runs)
    call: { every: [2.5, 8], day: 14, reach: 160, hush: 13, most: 3, clip: 4.37, notes: [[0.19, 0.28], [1.69, 0.29], [3.47, 0.27]],
      doing: 'calling, "kreck-ek", its throat blown up like a bubble' },
  },
  voices: {
    call: { file: 'chorusfrog-call.mp3', level: 0.5, near: 8,
      credit: { what: 'Pacific Chorus Frog, one male calling (three calls; the original is a 64 kbps preview)', by: 'daveincamas (Freesound), 2007', licence: 'CC BY 4.0: cut and filtered',
        licenceUrl: 'https://creativecommons.org/licenses/by/4.0/', source: 'https://freesound.org/s/32807/', bytes: 41928, kept: 4.37 } },
  },
  published: {
    shown: 'a calling male of 36 mm, green (the back is green or brown), with a dark throat',
    note: 'Published: the snout-to-vent length, as ranges, and the marks and colours above. Everything else, the limbs, head, pads, eye and throat sac, is the agent\'s drawing from memory of the animal. A male is drawn because a calling frog is a male; the dark throat is from the source, the sac\'s size is the agent\'s.',
    sources: {
      C: 'CaliforniaHerps.com, Pseudacris regilla: ".75 - 2 inches long from snout to vent (1.9 - 5.1 cm)"; large head and eyes, slim waist, long slender legs, round toe pads, limited webbing, a wide dark stripe through the middle of each eye from the nostrils to the shoulders, a pale underside with yellow under the back legs, the male\'s throat darkened and wrinkled',
      A: 'Animal Diversity Web, Pseudacris regilla: 2.5 to 4.8 cm; large toe pads',
      W: 'Wikipedia, Pacific tree frog: green or brown, some changing between the two; pale or white belly; females larger than males; males have a dark throat (EO Puget Sound)',
    },
    mass: 'Average about 0.35 g (Animal Diversity Web, as a search summary gave it).',
    proportions: [
      'Large head, large eyes, slim waist, long slender legs (C)',
      'A round pad at the end of each toe (C); built 1.7 times the toe\'s width',
      'Not found: the hind leg\'s length against the body (built at about 1.55 body lengths from the hip to the tip of the longest toe), the pads\' size, the iris, the throat sac\'s colour',
    ],
    lengths: [
      ['svl', 'Snout to vent, adults', null, [19, 51], 'C'],
      ['svl', 'Snout to vent, adults (ADW)', null, [25, 48], 'A'],
    ],
  },
  shape: {
    svl: 36, axis: [0.13, 15],
    //       s      up     down   half   square
    trunk: [[0.012, 0.04, 0.035, 0.05, 2], [0.06, 0.1, 0.075, 0.12, 2], [0.16, 0.16, 0.11, 0.165, 2], [0.3, 0.17, 0.13, 0.165, 2.05],
      [0.44, 0.145, 0.13, 0.15, 2.05], [0.57, 0.13, 0.115, 0.18, 2.1], [0.68, 0.12, 0.085, 0.2, 2.15], [0.8, 0.1, 0.06, 0.18, 2.2],
      [0.9, 0.08, 0.05, 0.14, 2.2], [0.96, 0.06, 0.038, 0.1, 2.1], [0.988, 0.035, 0.026, 0.055, 2]],
    hinge: [0.62, 0.68, 0.55],
    eye: { s: 0.79, up: 0.062, side: 0.128, r: 0.07 },
    hind: {
      hip: [-0.4, 0.17, 0.11], knee: [0.08, 0.13, 0.3], ankle: [-0.4, 0.06, 0.27], ball: [-0.12, 0.025, 0.32],
      girth: [0.085, 0.05, 0.04, 0.03, 0.022],
      toes: { lens: [0.09, 0.14, 0.2, 0.28, 0.18], r: 0.016, spread: 24, pad: 1.7, web: 0.2 },
    },
    fore: {
      shoulder: [0.08, 0.22, 0.1], elbow: [-0.04, 0.1, 0.2], wrist: [0.12, 0.025, 0.19], girth: [0.04, 0.03, 0.024, 0.022],
      fingers: { lens: [0.07, 0.09, 0.11, 0.08], r: 0.014, spread: 26, pad: 1.7 },
    },
    sac: { s: 0.8, size: [0.36, 0.3, 0.36] },
    features: { ridges: [], bumps: [] },
  },
  skin: {
    body: [
      { colour: [96, 40, 34] },                                                                      // green (C, W)
      { colour: [90, 34, 43], where: (p) => 0.7 * smooth(0.66, 0.48, p.a) },                          // lighter on the sides
      { colour: [78, 30, 17], where: (p) => smooth(0.58, 0.68, p.n(9)) * smooth(0.6, 0.72, p.a) * smooth(0.82, 0.72, p.t) },   // irregular dark spots (C)
      { colour: [72, 28, 16], where: (p) => brow(p) },                                               // a dark triangle between the eyes (ADW, as the first reading had it; its checker did not confirm it)
      { colour: [52, 22, 84], where: (p) => smooth(0.4, 0.28, p.a) },                                // a pale underside (C)
      { colour: [50, 78, 56], where: (p) => smooth(0.38, 0.2, p.a) * smooth(0.36, 0.12, p.t) },      // yellow under the hind legs, into the groin (C)
      { colour: [48, 24, 74], where: (p) => lip(p) },                                                // a pale upper lip under the stripe (the agent's)
      { colour: [26, 30, 11], where: (p) => stripe(p) },                                             // the wide dark stripe, nostril to shoulder (C)
      { colour: [44, 26, 38], where: (p) => smooth(0.56, 0.68, p.t) * smooth(0.9, 0.8, p.t) * smooth(0.24, 0.14, p.a) * 0.9 }, // a dark throat: a breeding male's (C)
    ],
    spots: [{ colour: [80, 32, 15], count: 34, size: [0.014, 0.03], where: (t, a) => a > 0.68 && t > 0.12 && t < 0.62, alpha: 0.8 }],
    mouth: { a: 0.42, from: 0.68, colour: [30, 26, 16] },
    leg: ({ d, under, n }) => mix(n(7) > 0.6 ? [80, 30, 16] : [94, 38, 36], [52, 66, 58], smooth(0.62, 0.85, under) * (d < 0.85 ? 1 : 0.4)),
    foot: { top: [92, 30, 40], under: [48, 40, 66], pad: [46, 30, 70], web: [60, 20, 55] },
    eye: { iris: [40, 55, 44], pupil: [0, 0, 4], lid: [92, 30, 30], ring: [28, 40, 20] },              // the iris colour was not found: bronze is the agent's
    sac: { colour: [40, 20, 36], fold: [34, 18, 24] },
  },
  card: {
    size: 'An adult is 2 to 5 cm from snout to vent; females are larger than males.',
    marks: ['Green or brown above, with dark spots', 'A wide dark stripe through each eye, from the nostril to the shoulder', 'A round pad on the tip of every toe; a calling male\'s throat is dark'],
    lives: 'On the ground and low in the plants of damp places, from which it climbs by its toe pads; it sings in chorus, mostly at dusk, from March into June.',
  },
};
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// The eye stripe's middle line round the body (a) along it (t): from the nostril, through the middle of the eye (whose
// centre is at a = 0.74 by the head's rings), and down behind it over the ear to the shoulder, where the arm leaves
// the body. Its half-width in `a`: about the eye's own height behind it, narrowing to the nostril.
const stripeAt = (t) => (t > 0.79 ? 0.74 + (t - 0.79) * 0.3 : t > 0.58 ? 0.74 - (0.79 - t) * 1.05 : 0.52);
const stripeHalf = (t) => 0.075 - 0.035 * smooth(0.8, 0.97, t);
const stripe = (p) => smooth(stripeHalf(p.t) + 0.012, stripeHalf(p.t) - 0.012, Math.abs(p.a - stripeAt(p.t))) * smooth(0.53, 0.58, p.t) * smooth(0.995, 0.975, p.t);
// a pale band along the upper lip, under the stripe
const lip = (p) => { const d = stripeAt(p.t) - stripeHalf(p.t) - p.a; return smooth(-0.01, 0.01, d) * smooth(0.09, 0.06, d) * smooth(0.62, 0.68, p.t) * smooth(0.99, 0.97, p.t); };
// a triangle between the eyes, its point behind them, on the crown
const brow = (p) => { const w = 0.12 * smooth(0.66, 0.84, p.t); return smooth(0.86, 0.83, p.t) * smooth(0.64, 0.7, p.t) * smooth(w + 0.01, w - 0.01, 1 - p.a); };
