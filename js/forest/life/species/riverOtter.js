// North American river otter, Lontra canadensis: on the river, the pool under the falls and the creek's mouth. Built
// by life/beast.js from `shape` (its long low body and long tail: life/parts/longBody.js; its paws, webbed: the bear's
// life/parts/paw.js), posed by life/parts/longRig.js, painted by life/coat.js; how it lives is life/families/mustelid.js.
//
// What is published and what is not (read 2026-11-16 by the mustelids agent: the Mammals of Texas page through a tool
// that returns a page's text; Wikipedia, the Toronto Zoo and a Zenodo page as earlier agents read them, each claim
// checked by a second agent, kept in .local-assets/forest/research/beasts-herps-2026-11-16.json; none of it seen as an
// image). Published: the lengths and masses below, the colours (rich glossy dark brown above, greyish on the lips
// and cheeks, paler and greyish below), a long slender streamlined body, short legs, webbed feet with five toes, and a
// long thick tapering tail. Not found, and the agent's: the height at the shoulder, the head's and the neck's sizes,
// the legs' segments, the ears, the claws, the outline seen from the side.

export const published = {
  shown: 'an adult male',
  note: 'Published: the head and body, the tail and the hind foot below (Mammals of Texas\' averages, within Wikipedia\'s ranges), the masses, the colours, and the body\'s build (long, slender, streamlined; short legs; webbed five-toed feet; a long, thick, tapering tail). The agent\'s: everything else, from memory of photographs of otters, none of them looked at. The Zenodo figures (males 7.7 to 9.4 kg, tails 42 to 47 cm) and the state\'s (9.1 to 12.7 kg) disagree and are not mixed here.',
  sources: {
    T: 'Schmidly and Bradley, The Mammals of Texas, online edition (Texas Tech University), Lontra canadensis: total length 1.2 m, tail 457 mm, hind foot 124 mm (averages); 6 to 7 kg, occasionally 10; long slender streamlined body, short legs, webbed feet with five toes, a long thick tapering tail; upperparts rich glossy dark brown, greyish on lips and cheeks, underparts paler, tinged with grey',
    W: 'Wikipedia, "North American river otter": body 66 to 107 cm, tail 30 to 50 cm, 5 to 14 kg',
    Z: 'Toronto Zoo, river otter: 90 to 120 cm long in all; swims at up to 10 to 12 km/h at the surface',
  },
  // [key, label, value (m), [least, most], source]: what the built otter is measured against (life/beast.js measureBeast)
  lengths: [
    ['length', 'Head and body, nose to rump (total length less tail)', 0.743, [0.66, 1.07], 'T W'],
    ['tail', 'Tail', 0.457, [0.30, 0.50], 'T W'],
    ['hindfoot', 'Hind foot (published with the claw; built to the tip of the toe)', 0.124, ['–', '–'], 'T'],
  ],
  proportions: [
    'A long slender streamlined body on short legs, the hind feet larger than the fore (T)',
    'Not found: the height at the shoulder (built at about 0.25 m), the head (0.14 m from the back of the skull to the nose), the ear (1.7 cm)',
  ],
  mass: '6 to 7 kg, occasionally as much as 10 (T); 5 to 14 kg (W)',
};

// The coat, as paint: [hue, saturation, lightness]. Darker than the names read, as a wet otter's is.
const DARK = [24, 30, 13], BACK = [22, 30, 10], UNDER = [27, 16, 26], GREY = [30, 8, 42], NOSE = [18, 8, 8];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  name: 'North American river otter', latin: 'Lontra canadensis', key: 'river-otter', seed: 471,
  census: { tier: 'few', source: 'N C', party: [1, 3], clock: 'any' },
  // how it lives on a visit (life/families/mustelid.js): paces (m/s: a walk, a bound, swimming), and how near it lets the
  // walker come (m: it watches, it dives away, it goes); a mother and her young, or a pair, go about together. Under
  // the water it is out of sight, above the river's bed: never under the ground (`under`). The agent's numbers.
  way: { family: 'mustelid', manner: 'otter', there: 0.6, gap: [60, 240], together: true, pace: [0.55, 3.2, 0.8], wary: [28, 14, 7], fastest: 4.5, under: 0.05 },
  // (nothing heard of it was found that could be used: VOICES.js; the snort as well)
  voices: {
    chirp: { silent: true },   // the NPS Canyonlands clip is clicks 30 dB under its floor: too faint
    snort: { silent: true },
  },
  plan: 'beast',
  published,
  // how long it is, for what can be seen of it; how high its back stands, half its length and half its width (m)
  size: 0.95, body: { high: 0.27, long: 0.37, wide: 0.088 },
  // The body, in metres, standing square: an adult male. Every number is the agent's but the head and body, the
  // tail and the hind foot, which are set to the published averages above.
  shape: {
    // the torso and the neck, rump to head: [top x, top y, bottom x, bottom y, half width, widest at, square]
    trunk: [
      [-0.312, 0.238, -0.314, 0.180, 0.036, 0.50, 2.0],     // the rump's end, round the tail's thick root
      [-0.288, 0.256, -0.296, 0.150, 0.054, 0.50, 2.05],    // the body runs into the tail
      [-0.245, 0.272, -0.258, 0.115, 0.072, 0.50, 2.15],    // the haunches: the back highest over them
      [-0.170, 0.281, -0.170, 0.092, 0.084, 0.52, 2.3],
      [-0.060, 0.272, -0.060, 0.082, 0.088, 0.52, 2.3],     // the belly, low between the legs
      [0.030, 0.258, 0.035, 0.080, 0.088, 0.54, 2.3],
      [0.100, 0.246, 0.110, 0.086, 0.082, 0.55, 2.25],      // the chest
      [0.160, 0.236, 0.180, 0.100, 0.071, 0.55, 2.2],       // the shoulders
      [0.215, 0.229, 0.240, 0.116, 0.060, 0.52, 2.1],       // the neck, nearly as thick as the head
      [0.265, 0.227, 0.290, 0.132, 0.052, 0.50, 2.0],
      [0.305, 0.229, 0.325, 0.148, 0.046, 0.50, 2.0],       // the throat
      [0.330, 0.226, 0.345, 0.158, 0.040, 0.50, 2.0],       // inside the head
    ],
    withers: [0.04, 0.15],
    spine: { hips: [-0.215, 0.20], chest: [0.02, 0.185], neck1: [0.16, 0.172], neck2: [0.215, 0.18], neck3: [0.27, 0.19] },
    blend: [0.12, 0.05, 0.03, 0.03, 0.03],                   // (wide at the chest's joint, so that the back bends in one curve)
    head: {
      at: [0.322, 0.206], tilt: -6, square: 2.3, jaw: [0.035, -0.014],
      //          s     up     down   half: a broad flat skull and a broad blunt muzzle
      stations: [[-0.03, 0.034, 0.036, 0.040], [0, 0.038, 0.038, 0.046], [0.025, 0.037, 0.037, 0.048], [0.05, 0.033, 0.033, 0.045],
        [0.072, 0.027, 0.028, 0.039], [0.09, 0.022, 0.024, 0.032], [0.104, 0.017, 0.019, 0.025], [0.113, 0.010, 0.012, 0.016]],
      eye: { s: 0.05, up: 0.02, side: 0.033, r: 0.0055 },   // small, set high, to see over the water
    },
    ear: { s: 0.008, up: 0.03, side: 0.036, length: 0.017, width: 0.022, out: 75, open: 25 },
    tail: { at: [-0.30, 0.209], length: 0.457, width: 0.074, depth: 0.056, hang: 76, taper: 0.16, bulge: 0.004 },
    fore: {
      at: [0.115, 0.055], scapula: [0.13, 0.21], scapSwing: 1.2, scapMost: 0.3, bones: [0.072, 0.062, 0.014], angles: [38, -12, 0], pastern: [0, 0.016],
      foot: { long: 0.07, wide: 0.05 }, web: 0.6,
      //       d     front  across ahead
      girth: [[0, 0.03, 0.024, 0], [0.04, 0.026, 0.021, 0], [0.072, 0.019, 0.016, 0], [0.11, 0.014, 0.012, 0], [0.134, 0.012, 0.011, 0], [0.148, 0.012, 0.011, 0]],
      share: { at: [0.10, 0.11], reach: [0.06, 0.05], most: 0.5 },
    },
    hind: {
      at: [-0.20, 0.05], bones: [0.088, 0.092, 0.02], angles: [-35, 42, 0], pastern: [0, 0.018],
      foot: { long: 0.119, wide: 0.066 }, web: 0.85,
      girth: [[0, 0.04, 0.032, 0], [0.05, 0.034, 0.026, 0.004], [0.088, 0.022, 0.018, 0], [0.13, 0.017, 0.014, -0.004], [0.18, 0.014, 0.012, 0], [0.2, 0.014, 0.012, 0]],
      share: { at: [-0.2, 0.13], reach: [0.08, 0.07], most: 0.6 },
    },
    // the paw (the bear's, life/parts/paw.js): plantigrade, short claws (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 9, hind: 8, curve: 0.8 },
    unit: 0.2,                                               // (the builder's small sizes, a fifth of the elk's: life/beast.js)
    // how it bounds and swims (life/parts/longRig.js); every number the agent's
    long: { strides: { walk: 0.3, bound: 0.72 }, lift: { walk: 0.22, bound: 0.42 }, arch: 0.42, bob: 0.035, tailUp: 45, dip: 0.03 },
    neck: { low: [-0.3, -0.25, -0.15, 0.25], high: [0.35, 0.2, 0.1, -0.2], dip: -0.04 },
    lie: { drop: 0.072, fore: { top: [0.03, 0.03], fetlock: [0.08, 0.015], out: 1.2, hoof: 0 }, hind: { top: [-0.03, 0.03], fetlock: [-0.09, 0.015], out: 1.3, hoof: 0 } },
  },
  coat: {
    body: [
      { colour: DARK },                                                                    // rich glossy dark brown above (T)
      { colour: BACK, where: (p) => smooth(0.78, 0.97, p.a) },
      { colour: UNDER, where: (p) => smooth(0.36, 0.16, p.a) },                            // paler below, tinged with grey (T)
      { colour: GREY, where: (p) => smooth(0.42, 0.2, p.a) * smooth(0.18, 0.28, p.x) },    // the throat, greyish (as the cheeks: T)
    ],
    head: [
      { colour: DARK },
      { colour: GREY, where: (p) => smooth(0.5, 0.25, p.a) * smooth(0.0, 0.04, p.s) * smooth(0.112, 0.098, p.s) },     // greyish on the lips and cheeks (T)
      { colour: [26, 14, 36], where: (p) => smooth(0.085, 0.1, p.s) * smooth(0.3, 0.6, p.a) },   // the whisker pads, the muzzle's top
      { colour: NOSE, where: (p) => smooth(0.104, 0.11, p.s) * smooth(-0.004, 0.004, p.up) },
    ],
    leg: ({ pastern }) => (pastern ? [22, 26, 12] : [23, 28, 14]),
    claw: [28, 12, 26], pad: [20, 10, 16],
    ear: { outer: [24, 26, 15], inner: [26, 14, 24], edge: [26, 12, 32] },
    tail: { top: [23, 30, 14], under: [26, 22, 22] },
    eye: { iris: [24, 40, 8], pupil: [240, 10, 3] },
    hair: { long: () => false },
  },
  card: {
    size: 'About 1.1 to 1.2 m from nose to tail tip, the tail more than a third of it; 6 to 7 kg, a big male more.',
    marks: ['A long, low, glossy dark brown body, paler and greyish below', 'A broad flat head with small ears and a blunt, whiskered muzzle', 'A thick tail that tapers to a point, and webbed feet', 'In the water only its head and the line of its back show; it dives with a roll and comes up somewhere else'],
    lives: 'Along the river, the pools and the creek mouths all year, alone or a mother with her young. It hunts fish, crayfish and frogs by swimming along the bottom, comes out on bars and logs to roll and groom its fur dry, and runs along the bank in a humping bound before sliding back in.',
  },
};
