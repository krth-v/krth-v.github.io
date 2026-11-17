// Roosevelt elk, Cervus canadensis roosevelti: the largest elk of North America, and the elk of the Olympic
// Peninsula's rain-forest valleys. Built by life/beast.js from `shape`, painted by life/coat.js; how it lives is
// life/beasts.js.
//
// What is published and what is not (read 2026-11-16 by agents, each reader's claims checked by a second agent
// against the source and a second one where one existed; kept in .local-assets/forest/research/elk-2026-11-16.json
// and animals-2-2026-11-16.json; none of it seen as an image). Few measurements of the Roosevelt elk itself were
// reached: the mammal monographs that hold them (Dalquest 1948, Bailey 1936, Murie 1951, Verts and Carraway 1998)
// could not be opened. What was: the masses of Roosevelt bulls and cows; the shoulder height of adult elk in
// Washington; the whole species' total length; a tail and a hind foot of males of other stock; two bone lengths
// and a track's length of elk of no stated stock. Not found, and the agent's: the ear, the head, the neck, the
// legs' segments but those two bones, how wide the body is, the antlers in May.

export const published = {
  shown: 'an adult cow (bulls are drawn from the same body, larger, with antlers in velvet)',
  note: 'Published: the masses and the shoulder height below, the colours (a dark brown head, neck and legs; a pale brown body; a large pale rump; a short tail; a thin dark mane), that the winter coat is greyish brown and the summer coat golden brown, and that calving is late May to early June. Not found, and the agent\'s: the ear, the head\'s and the neck\'s lengths, the legs\' segments but the humerus and the metatarsal, the body\'s width, how patchy the coat is in mid-May, and the size of a bull\'s velvet antlers in mid-May (antlers are cast from mid-January to April, and grow again soon after).',
  sources: {
    W: 'Washington Department of Fish and Wildlife, "Elk" (publication 00614): adult elk 4.5 to 5 ft at the shoulder; bulls 600 to 800 lb, cows 400 to 500 lb',
    N: 'National Park Service, Olympic National Park: "Roosevelt Elk", and the "Common Mammals" brochure (a bull sometimes 5 ft at the shoulder); herds of about 20 cows with their young, bulls alone or in small groups',
    K: 'Wikipedia, "Elk": Roosevelt bulls 318 to 499 kg, cows 261 to 283 kg',
    A: 'Animal Diversity Web, Cervus elaphus: 1.6 to 2.7 m from nose to tail, the whole species',
    T: 'Schmidly and Bradley, The Mammals of Texas (2016), wapiti: males about 2 m long, tail 160 mm, hind foot 670 mm (Rocky Mountain stock, not Roosevelt)',
    O: 'OsteoID, elk humerus 273 to 363 mm and metatarsal 282 to 356 mm (no stock, sex or sample given)',
    M: 'New Mexico State University, circular CR561: an adult elk\'s track 4 to 4 3/4 in long',
    F: 'US Forest Service, FEIS, Cervus elaphus: cows about 80 % of a bull\'s mass; most calving late May to early June; active day and night, most at dawn and dusk',
  },
  // [key, label, value (m), [least, most], source]: what the built cow is measured against (life/measure.js)
  lengths: [
    ['shoulder', 'Height at the shoulder, adults', null, [1.37, 1.52], 'W'],
    ['length', 'Length, nose to rump (the whole species)', null, [1.6, 2.7], 'A'],
    ['humerus', 'Humerus', null, [0.273, 0.363], 'O'],
    ['metatarsus', 'Metatarsal (the hind cannon bone)', null, [0.282, 0.356], 'O'],
    ['track', 'Track, length', null, [0.102, 0.121], 'M'],
  ],
  proportions: [
    'Thick-bodied, with slender legs and a short tail (Wikipedia, "Elk")',
    'The tail 160 mm and the hind foot 670 mm in males of other stock (T): the cow\'s are built a little shorter',
    'Not found: the ear (built at 0.2 m from its notch), the head (0.5 m), the neck, the width of the body',
  ],
  mass: 'Cows 261 to 283 kg, bulls 318 to 499 kg (K); in Washington cows 400 to 500 lb and bulls 600 to 800 lb (W)',
};

// The coat in the middle of May, as paint: [hue, saturation, lightness]. The pattern is from the sources above; the
// shades, the moult's patches and where each boundary runs are the agent's.
const TAN = [31, 30, 50], BACK = [29, 28, 43], DARK = [21, 30, 17], DARKER = [19, 24, 12];
const CREAM = [39, 36, 74], BORDER = [20, 28, 15], HEAD = [22, 30, 21], MUZZLE = [20, 24, 14], NOSE = [20, 8, 8];
const GLAND = [32, 22, 40], GLAND_CORE = [38, 14, 62];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  name: 'Roosevelt elk', latin: 'Cervus canadensis roosevelti', key: 'roosevelt-elk', seed: 211,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'some', source: 'N C', party: [3, 12], clock: 'any' },
  way: { family: 'herd', there: 0.7, gap: [60, 300], together: true, herd: true },
  // what the herd says (life/beasts.js `world.say`): a cow's bark when it is alarmed, and the mew that keeps a herd together
  voices: {
    bark: { file: 'elk-bark.mp3', level: 0.9, near: 30,
      credit: { what: "Elk, cow's alarm bark (Rocky Mountain elk, Moraine Park)", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-wildlife-soundscapes.htm', bytes: 76477, kept: 1.1 } },
    mew: { file: 'elk-mew.mp3', level: 0.6, near: 12,
      credit: { what: "Elk, cow's mew (the page says elk can be heard bugling in the background of the original)", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-wildlife-soundscapes.htm', bytes: 482237, kept: 1.95 } },
  },
  plan: 'beast',
  published,
  // How long it is, for what can be seen of it (a bird's size is worked out from its wing), and its body, for
  // whether any of it is seen and whether two bodies are in one another: how high its back is, half its length
  // and half its width (m). An adult cow's.
  size: 2.3, body: { high: 1.2, long: 1.1, wide: 0.42 },
  // The body, in metres, standing square: an adult cow (life/beast.js says what each table is). Every number is the
  // agent's but the shoulder's height, the humerus, the metatarsal and the hoof's length, which are set inside the
  // published ranges above; the outline is drawn from memory of photographs of elk, none of them looked at.
  shape: {
    // the torso and the neck, rump to head: [top x, top y, bottom x, bottom y, half width, widest at, square]
    trunk: [
      [-0.736, 1.165, -0.744, 1.075, 0.045, 0.50, 2.0],      // the rump's end, round the tail's root
      [-0.708, 1.236, -0.742, 0.935, 0.165, 0.52, 2.05],      // the croup comes down to the tail, and the buttocks round under it
      [-0.650, 1.288, -0.704, 0.806, 0.228, 0.54, 2.15],      // the buttocks, down to the backs of the thighs
      [-0.545, 1.328, -0.585, 0.738, 0.262, 0.56, 2.4],      // the haunch: the croup on top, the stifle below
      [-0.340, 1.360, -0.330, 0.772, 0.255, 0.56, 2.4],      // the flank, tucked up in front of the stifle
      [-0.120, 1.354, -0.120, 0.726, 0.270, 0.56, 2.3],      // the belly
      [0.100, 1.372, 0.100, 0.708, 0.276, 0.58, 2.25],       // the girth, behind the elbows
      [0.300, 1.408, 0.305, 0.730, 0.255, 0.60, 2.3],        // the chest, under the withers
      [0.440, 1.418, 0.500, 0.767, 0.235, 0.62, 2.3],        // the shoulders
      [0.505, 1.412, 0.635, 0.822, 0.220, 0.60, 2.25],       // the point of the shoulder
      [0.560, 1.425, 0.745, 0.950, 0.200, 0.55, 2.2],        // the neck's base and the breast
      [0.680, 1.480, 0.840, 1.150, 0.160, 0.50, 2.1],
      [0.800, 1.560, 0.920, 1.290, 0.130, 0.50, 2.0],        // the neck
      [0.890, 1.645, 0.965, 1.405, 0.105, 0.50, 2.0],
      [0.935, 1.700, 0.975, 1.520, 0.085, 0.50, 2.0],        // the throat, and the poll behind it
      [0.965, 1.715, 1.000, 1.560, 0.070, 0.50, 2.0],        // inside the head
    ],
    withers: [0.25, 0.5],                                    // where along the back the withers are (m): the shoulder's height is taken there
    spine: { hips: [-0.32, 1.10], chest: [-0.02, 1.08], neck1: [0.52, 1.02], neck2: [0.70, 1.22], neck3: [0.85, 1.42] },
    blend: [0.22, 0.12, 0.08, 0.07, 0.06],                    // how far either side of each joint the skin is shared (m)
    head: {
      at: [0.975, 1.69], tilt: -50, square: 2.2, jaw: [0.1, -0.055],
      //          s     up     down   half
      stations: [[-0.06, 0.050, 0.050, 0.055], [0, 0.065, 0.065, 0.075], [0.06, 0.075, 0.105, 0.088], [0.11, 0.078, 0.125, 0.093],
        [0.17, 0.074, 0.112, 0.094], [0.25, 0.064, 0.098, 0.074], [0.33, 0.057, 0.088, 0.064], [0.41, 0.053, 0.080, 0.060],
        [0.47, 0.048, 0.072, 0.057], [0.515, 0.032, 0.055, 0.046]],
      eye: { s: 0.17, up: 0.035, side: 0.083, r: 0.017 },
    },
    ear: { s: 0.055, up: 0.068, side: 0.052, length: 0.2, width: 0.105, out: 52, open: 40 },
    tail: { at: [-0.730, 1.195], length: 0.13, width: 0.072, depth: 0.036, hang: 10 },
    // a bull's antlers in the middle of May, in velvet and growing (the agent's own: nothing read gave their size then)
    antler: {
      s: 0.075, up: 0.07, side: 0.04, base: 0.03, tip: 0.023,
      beam: [[0, 0, 0], [-0.03, 0.16, 0.08], [-0.13, 0.34, 0.16], [-0.27, 0.46, 0.17], [-0.38, 0.52, 0.12]],
      tines: [[0.1, 0.22, 0.85, 0.4, 0.25], [0.2, 0.17, 0.85, 0.3, 0.15], [0.5, 0.09, 0.55, 0.7, 0.05]],          // [along the beam, long, which way]
    },
    fore: {
      at: [0.6, 0.15], scapula: [0.42, 1.3], blade: { at: [0.5, 1.12], reach: [0.2, 0.3], most: 0.8 }, scapSwing: 0.5, scapMost: 0.32, lean: 0.5, bones: [0.3, 0.34, 0.3], angles: [35, -2, 2], pastern: [0.06, 0.08], hoof: [0.112, 0.045, 0.08],
      //       d     front  across ahead
      girth: [[0, 0.04, 0.035, 0], [0.12, 0.07, 0.05, 0], [0.24, 0.088, 0.06, -0.01], [0.3, 0.085, 0.06, -0.015], [0.36, 0.072, 0.055, 0],
        [0.48, 0.055, 0.045, 0.004], [0.6, 0.04, 0.036, 0], [0.645, 0.043, 0.04, 0.004], [0.69, 0.033, 0.031, 0], [0.8, 0.027, 0.024, 0],
        [0.9, 0.029, 0.026, -0.003], [0.94, 0.034, 0.029, -0.004]],
      share: { at: [0.44, 0.84], reach: [0.2, 0.16], most: 0.5 },
    },
    hind: {
      at: [-0.53, 0.14], bones: [0.38, 0.4, 0.32], angles: [-28, 32, -4], pastern: [0.055, 0.075], hoof: [0.105, 0.042, 0.075],
      girth: [[0, 0.06, 0.055, 0], [0.18, 0.13, 0.095, 0], [0.33, 0.14, 0.1, 0.01], [0.38, 0.125, 0.09, 0.01], [0.46, 0.095, 0.068, -0.005],
        [0.6, 0.062, 0.046, -0.012], [0.72, 0.046, 0.033, -0.018], [0.78, 0.05, 0.034, -0.015], [0.83, 0.034, 0.028, 0], [0.96, 0.028, 0.025, 0],
        [1.06, 0.03, 0.026, 0], [1.1, 0.034, 0.029, -0.003]],
      share: { at: [-0.44, 0.88], reach: [0.3, 0.26], most: 0.7 }, lean: 0.5,
    },
    // the neck's four joints (neck1, neck2, neck3, the poll) turned from as it stands (radians): grazing, and head up;
    // `dip`, how far the chest is let down to graze
    neck: { low: [-0.87, -0.47, -0.52, 1.4], high: [0.21, 0.1, 0.07, -0.05], dip: -0.14 },
    // lying down: how far the body comes down; where the knee or the hock and the fetlock go (x from the top joint, y),
    // how far out to the side, and how the hoof is bent from the cannon it then follows (radians)
    lie: { drop: 0.63, fore: { top: [0.13, 0.065], fetlock: [-0.17, 0.045], out: 1.0, hoof: -0.75 }, hind: { top: [-0.09, 0.075], fetlock: [0.23, 0.045], out: 1.55, hoof: 0.2 } },
  },
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  coat: {
    body: [
      { colour: TAN },                                                                           // a pale brown body (NPS)
      { colour: BACK, where: (p) => smooth(0.8, 0.97, p.a) },
      { colour: DARK, where: (p) => smooth(0.36, 0.5, p.x + 0.25 * (1.25 - p.y)) },             // a dark brown neck (NPS), down onto the shoulders and the brisket
      { colour: DARK, where: (p) => smooth(0.3, 0.1, p.a) * smooth(-0.62, -0.45, p.x) },        // a dark belly (Mammals of Texas: belly dull rusty brown to blackish)
      { colour: BORDER, where: (p) => smooth(-0.46, -0.58, p.x) * smooth(1.18, 0.98, p.y) },    // dark down the backs of the thighs, round the rump patch
      { colour: CREAM, where: (p) => smooth(-0.55, -0.65, p.x) * smooth(0.86, 0.98, p.y) },     // a large pale rump round the tail (NPS: "large white rump"; creamy buff, Mammals of Texas)
    ],
    // patches of the short new summer coat (reddish: RMEF; NPS Rocky Mountain) through the old winter one, which in
    // the Olympics is shed from late April into June (Schwartz and Mitchell 1945, as a summary has it): shown as a
    // slight reddening and darkening of the old coat in soft clumps drawn out up and down the flank (the first try
    // painted saturated orange patches with hard edges, which read as sores)
    moult: { shift: [-5, 7, -8], share: 0.4, scale: 2.6, soft: 0.22, strength: 0.65, stretch: [1.3, 0.55, 1] },
    head: [
      { colour: HEAD },                                                                          // a dark brown head (NPS)
      { colour: MUZZLE, where: (p) => smooth(0.34, 0.44, p.s) },
      { colour: NOSE, where: (p) => smooth(0.47, 0.5, p.s) * smooth(-0.02, 0.01, p.up) },
    ],
    leg: ({ d, out, hind, pastern }) => {
      if (pastern) return DARKER;
      // the metatarsal gland: on the outer side of the hind cannon about a third of the way down it, an oval of long
      // tan hair about 75 mm tall, whitish in the middle (Mammals of Texas); a soft tuft, with no edge of its own
      const base = [DARK, DARKER].reduce((a, b) => [a[0] + (b[0] - a[0]) * smooth(0.3, 0.8, d), a[1] + (b[1] - a[1]) * smooth(0.3, 0.8, d), a[2] + (b[2] - a[2]) * smooth(0.3, 0.8, d)]);
      if (hind && out > 0) {
        const r = Math.hypot((d - 0.81) / 0.036, (out - 0.8) / 0.5), ring = 1 - smooth(0.45, 1, r), core = 1 - smooth(0.0, 0.6, r);
        if (ring > 0) return mix(mix(base, GLAND, ring * 0.7), GLAND_CORE, core * 0.55);
      }
      return base;
    },
    hoof: [26, 8, 12],
    ear: { outer: [28, 16, 38], inner: [36, 18, 68], edge: [22, 20, 18] },
    tail: { top: [34, 28, 60], under: [38, 32, 70] },
    antler: [26, 16, 30],                                                                        // velvet (its colour not found)
    eye: { iris: [20, 45, 9], pupil: [240, 10, 4] },
    hair: { long: (p) => p.x > 0.55 && p.a < 0.55 },                                            // a thin dark mane (NPS), long and shaggy under the neck (Mammals of Texas)
  },
  card: {
    size: 'A cow stands about 1.4 m at the shoulder and weighs 260 to 280 kg; a bull is larger, to 1.5 m and 500 kg. The largest elk of North America.',
    marks: ['A pale brown body, a dark brown head, neck and legs', 'A large pale rump round a short tail', 'In May every elk is losing its greyish winter coat, and a bull\'s new antlers are growing, furred in velvet', 'Cows and their young go about in herds led by an old cow; bulls keep apart, alone or a few together'],
    lives: 'In the rain-forest valleys of the Olympic Peninsula all year: grazing the meadows and the river\'s banks at dawn and dusk, and browsing ferns and shrubs under the old trees, which it keeps open. By day it often lies up, chewing the cud. Unhunted here, the herds grow used to people: the park asks walkers to keep thirty metres off.',
  },
};
