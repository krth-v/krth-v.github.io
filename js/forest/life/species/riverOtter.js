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
const DARK = [22, 38, 9.5], UNDER = [27, 20, 25], SILVER = [34, 12, 60], PADS = [28, 14, 36], NOSE = [18, 8, 8], FEET = [22, 26, 9];
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };

export default {
  name: 'North American river otter', latin: 'Lontra canadensis', key: 'river-otter', seed: 471,
  // (2026-11-19. The owner, 2026-11-18: "Uncommon and rare species just need to show up more... I'd rather have more
  // animals present in their respective niches than an empty world." One party or two on every visit, at any hour, a
  // mother with her young or a pair more often than one alone. `sure` adds a party from numbers of its own, so no
  // other kind's draw moves.)
  census: { tier: 'few', source: 'N C', party: [1, 3], clock: 'any', sure: [1, 2] },
  // how it lives on a visit (life/families/mustelid.js): paces (m/s: a walk, a bound, swimming), and how near it lets the
  // walker come (m, as one at a stroll: it watches, it slips into the water, it goes; 2026-11-19, so that a walker on
  // the trail a dozen metres off may watch it); a mother and her young, or a pair, go about together. Under the water
  // it is out of sight, above the river's bed: never under the ground (`under`). The agent's numbers.
  way: { family: 'mustelid', manner: 'otter', there: 0.6, gap: [60, 240], together: true, pace: [0.55, 3.2, 0.8], wary: [20, 7, 3.5], fastest: 4.5, under: 0.05 },
  // (nothing heard of it was found that could be used: VOICES.js; the snort as well)
  voices: {
    chirp: { silent: true },   // the NPS Canyonlands clip is clicks 30 dB under its floor: too faint
    snort: { silent: true },
  },
  plan: 'beast',
  published,
  // how long it is, for what can be seen of it; how high its back stands, half its length and half its width (m)
  size: 0.95, body: { high: 0.27, long: 0.37, wide: 0.088 },
  // One stride of a walk and of a bound, metres (life/beasts.js `stridesOf`; life/families/mustelid.js reads
  // shape.long.strides, which are the same two): as they were.
  strides: { walk: 0.3, trot: 0.72, gallop: 0.72 },
  // The body, in metres, standing square: an adult male, drawn as a plate (life/plate.js says what each drawing is),
  // the tail in the body's own outline: one skin from the tail's tip to the nose. Every number is the agent's but
  // the head and body, the tail and the hind foot, which are set to the published averages above. Drawn from memory
  // of otters and of field-guide plates of them (no photograph was looked at): long, low and round, the back
  // highest over the haunches, the neck as thick as the head, the skull broad and flat with a blunt muzzle, the
  // tail thick where it leaves the body and tapering evenly to its tip.
  shape: {
    gait: 'bound',
    plate: {
      side: {
        //     t      x       y
        top: [[0.0, -0.725, 0.026], [1.0, -0.660, 0.048], [2.0, -0.590, 0.078], [3.0, -0.520, 0.112],        // the tail, from its tip
          [4.0, -0.450, 0.150], [5.0, -0.372, 0.196], [6.0, -0.290, 0.246],                                    // thickening to its root
          [7.0, -0.232, 0.275], [8.0, -0.165, 0.285], [9.0, -0.060, 0.275], [10.0, 0.035, 0.262],              // the haunches, the highest of the back
          [11.0, 0.105, 0.250], [12.0, 0.165, 0.242], [13.0, 0.220, 0.238], [14.0, 0.270, 0.238],              // the shoulders, the thick neck
          [15.0, 0.305, 0.240], [16.0, 0.335, 0.240], [17.0, 0.365, 0.236], [18.0, 0.395, 0.224],              // the broad flat skull
          [19.0, 0.420, 0.208], [19.6, 0.435, 0.196], [20.0, 0.444, 0.188]],                                   // the blunt muzzle
        bottom: [[0.0, -0.725, 0.014], [1.0, -0.660, 0.018], [2.0, -0.590, 0.034], [3.0, -0.520, 0.058],
          [4.0, -0.450, 0.088], [5.0, -0.376, 0.118], [6.0, -0.300, 0.140],
          [7.0, -0.248, 0.110], [8.0, -0.170, 0.092], [9.0, -0.060, 0.082], [10.0, 0.035, 0.080],              // the belly, low between the legs
          [11.0, 0.110, 0.086], [12.0, 0.180, 0.100], [13.0, 0.238, 0.118], [14.0, 0.285, 0.136],              // the chest, the throat
          [15.0, 0.318, 0.150], [16.0, 0.345, 0.158], [17.0, 0.372, 0.160], [18.0, 0.398, 0.164],
          [19.0, 0.420, 0.168], [19.6, 0.433, 0.172], [20.0, 0.441, 0.176]],                                   // the chin, the lips
      },
      //        t   half
      above: [[0, 0.006], [1, 0.016], [2, 0.024], [3, 0.031], [4, 0.037], [5, 0.045], [6, 0.058], [7, 0.074], [8, 0.086], [9, 0.090],
        [10, 0.089], [11, 0.083], [12, 0.072], [13, 0.060], [14, 0.053], [15, 0.048], [16, 0.049], [17, 0.050], [18, 0.046], [19, 0.037],
        [19.6, 0.030], [20, 0.020]],
      //        t  wide  over under
      front: [[0, 0.5, 2.0, 2.0], [5, 0.5, 2.0, 2.0], [7, 0.5, 2.2, 2.2], [9, 0.5, 2.3, 2.3], [12, 0.52, 2.2, 2.2], [15, 0.5, 2.3, 2.1],
        [17, 0.55, 2.7, 2.1], [19, 0.52, 2.5, 2.2], [20, 0.5, 2.3, 2.2]],
      spine: [['tail6', -0.660, 0.033], ['tail5', -0.590, 0.056], ['tail4', -0.520, 0.085], ['tail3', -0.450, 0.119], ['tail2', -0.375, 0.156],
        ['tail', -0.295, 0.195], ['hips', -0.215, 0.20], ['loin', -0.12, 0.20], ['back', -0.03, 0.19], ['chest', 0.06, 0.185],
        ['neck1', 0.16, 0.178], ['neck2', 0.215, 0.183], ['neck3', 0.265, 0.19], ['head', 0.31, 0.20]],
      marks: { rump: 6, withers: [11.5, 12.5], poll: 15 },
      jaw: { hinge: [0.345, 0.175], from: 17.2, soft: 1.5, lips: 0.42, open: 0.3 },
      eye: { at: [0.392, 0.214], r: 0.0055 },                // small, set high, to see over the water
    },
    // the paw (the bear's, life/parts/paw.js): plantigrade, webbed, short claws (mm: the agent's)
    paw: { kind: 'plantigrade', claw: 9, hind: 8, curve: 0.8 },
    fore: {
      at: [0.12, 0.058],
      //        the blade's top        the point of the shoulder  the elbow             the wrist              over the pad
      joints: [[0.12, 0.215, 0.045], [0.165, 0.150, 0.062], [0.110, 0.100, 0.066], [0.118, 0.036, 0.058], [0.120, 0.018, 0.058]],
      //          y      front   back    out    in
      outline: [[0.215, 0.165, 0.085, 0.045, 0.020], [0.180, 0.180, 0.075, 0.070, 0.022], [0.150, 0.185, 0.078, 0.082, 0.026],
        [0.120, 0.165, 0.085, 0.086, 0.030], [0.095, 0.148, 0.090, 0.084, 0.034], [0.070, 0.138, 0.096, 0.078, 0.038],
        [0.045, 0.133, 0.100, 0.074, 0.042], [0.030, 0.132, 0.104, 0.072, 0.044], [0.018, 0.134, 0.104, 0.072, 0.044]],
      foot: { long: 0.07, wide: 0.05 }, web: 0.6,
    },
    hind: {
      at: [-0.22, 0.06],
      //        the hip                 the knee                the ankle               over the pad
      joints: [[-0.215, 0.200, 0.050], [-0.165, 0.120, 0.070], [-0.225, 0.040, 0.060], [-0.220, 0.018, 0.060]],
      outline: [[0.235, -0.160, -0.260, 0.050, 0.020], [0.200, -0.135, -0.275, 0.080, 0.022], [0.165, -0.125, -0.280, 0.092, 0.026],
        [0.130, -0.130, -0.275, 0.094, 0.030], [0.100, -0.150, -0.265, 0.090, 0.034], [0.070, -0.175, -0.255, 0.084, 0.040],
        [0.045, -0.190, -0.250, 0.080, 0.044], [0.030, -0.195, -0.248, 0.078, 0.046], [0.018, -0.195, -0.248, 0.078, 0.046]],
      foot: { long: 0.119, wide: 0.066 }, web: 0.85,
    },
    ear: { at: [0.335, 0.226], length: 0.017, width: 0.022, out: 70, open: 25, round: 1 },
    // how it bounds (life/families/mustelid.js reads the strides; the rest is the old rig's, kept for its record)
    long: { strides: { walk: 0.3, bound: 0.72 } },
    arch: 0.42, tailUp: 45,
    neck: { low: [-0.3, -0.25, -0.15, 0.25], high: [0.35, 0.2, 0.1, -0.2], dip: -0.04 },
    lie: { drop: 0.07, fore: { top: [0.03, 0.03], fetlock: [0.08, 0.015], out: 1.2, hoof: 0 }, hind: { top: [-0.03, 0.03], fetlock: [-0.09, 0.015], out: 1.3, hoof: 0 } },
    young: { legs: 0, head: 0.15, neck: 0 },
  },
  // The coat, as paint (life/plateCoat.js says what each table is): rich glossy dark brown above, paler below and
  // tinged with grey, greyish on the lips, the cheeks and the throat (T). Every shade and every boundary is the agent's.
  coat: {
    rules: [
      { colour: DARK },
      { colour: UNDER, where: (p) => (p.part === 'body' ? edge(0.30 - p.a, 0.06) * edge(p.t - 6.5, 0.6) : 0) },                         // paler below (T)
      { colour: SILVER, where: (p) => (p.part === 'body' ? edge(0.42 - p.a, 0.05) * edge(p.t - 12.4, 0.5) : 0) },                       // the throat and the chest
      { colour: SILVER, where: (p) => (p.part === 'body' ? edge(0.58 - p.a, 0.05) * edge(p.t - 16.3, 0.4) * edge(19.3 - p.t, 0.2) : 0) }, // the cheeks and the lips
      { colour: PADS, where: (p) => (p.part === 'body' ? edge(p.t - 18.7, 0.2) * edge(p.a - 0.5, 0.08) * edge(0.86 - p.a, 0.05) : 0) }, // the whisker pads
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 19.62, 0.05) * edge(p.a - 0.45, 0.08) : 0) },
      { colour: FEET, where: (p) => (p.part === 'limb' ? edge(0.05 - p.y, 0.012) : 0) },
    ],
    planes: [],
    tones: { light: [5, -6, 6], shade: [-2, 2, -3] },         // sleek: where it turns to the sky it shines
    turn: { top: 1, under: 0.6 },
    hair: { count: 0.12, long: 0.012 },
    claw: [28, 12, 26], pad: [20, 10, 16],
    ear: { outer: [24, 26, 13], inner: [26, 14, 22], edge: [26, 12, 30] },
    eye: { iris: [24, 40, 8], pupil: [240, 10, 3] },
  },
  // Who an otter may be (life/plateRig.js; its family sets these once), and the poses the contact sheet shows
  // (life/plateStudio.js), each the fields of a pose a family may ask for.
  who: { male: {}, female: { scale: 0.92 }, pup: { scale: 0.6 } },
  poses: {
    alert: { neck: 1, ears: 1 },
    walk: { walk: 1, cycle: 0.1 },
    bound: { gallop: 1, cycle: 0.05 },
    stretch: { gallop: 1, cycle: 0.55 },
    upright: { rear: 1, neck: 0.8 },
    lie: { lie: 1, neck: 0.5 },
    eat: { sit: 1, hold: 1, neck: 0.45, jaw: 0.5 },
    swim: { swim: 1, cycle: 0.2, neck: 0.75 },
    dive: { swim: 1, dive: 1, cycle: 0.2 },
    porpoise: { swim: 1, porpoise: 1, cycle: 0.22 },
    slide: { slide: 1, neck: 0.7 },
    back: { swim: 1, roll: 3.14159, hold: 1, neck: 0.9, jaw: 0.3 },
    roll: { roll: 2.6, beat: 0.4, neck: 0.7 },
    dig: { dig: 1, rake: 0.5, reach: 0.06, neck: 0.3 },
    scratch: { scratch: 1, beat: 0.1 },
    shake: { shake: 1, beat: 0.05 },
    look: { neck: 0.9, head: { yaw: 1.0 } },
  },
  studio: { high: 0.45, tall: 0.34, middle: -0.14,
    rows: [
      { span: 1.35, high: 0.42, cells: [['male', 'male', null, 'side'], ['front', 'male', null, 'front'], ['behind', 'male', null, 'behind'], ['three-quarters', 'male', null, 'quarter']] },
      { span: 1.35, high: 0.50, cells: [['from above', 'male', null, 'above'], ['walk', 'male', 'walk', 'side'], ['bounding, gathered', 'male', 'bound', 'side'], ['bounding, stretched', 'male', 'stretch', 'side']] },
      { span: 1.35, high: 0.76, cells: [['standing up to look', 'male', 'upright', 'side'], ['eating, held in its paws', 'male', 'eat', 'quarter'], ['digging', 'male', 'dig', 'side'], ['pup', 'pup', 'look', 'side']] },
      { span: 1.35, high: 0.46, cells: [['lying', 'male', 'lie', 'side'], ['sliding on its belly', 'male', 'slide', 'side'], ['shaking', 'male', 'shake', 'quarter'], ['rolling', 'male', 'roll', 'quarter']] },
      { span: 1.35, high: 0.60, cells: [['swimming', 'male', 'swim', 'side'], ['diving', 'male', 'dive', 'side'], ['porpoising', 'male', 'porpoise', 'side'], ['on its back, eating', 'male', 'back', 'side']] },
    ] },
  card: {
    size: 'About 1.1 to 1.2 m from nose to tail tip, the tail more than a third of it; 6 to 7 kg, a big male more.',
    marks: ['A long, low, glossy dark brown body, paler and greyish below', 'A broad flat head with small ears and a blunt, whiskered muzzle', 'A thick tail that tapers to a point, and webbed feet', 'In the water only its head and the line of its back show; it dives with a roll and comes up somewhere else'],
    lives: 'Along the river, the pools and the creek mouths all year, alone or a mother with her young. It hunts fish, crayfish and frogs by swimming along the bottom, comes out on bars and logs to roll and groom its fur dry, and runs along the bank in a humping bound before sliding back in.',
  },
};
