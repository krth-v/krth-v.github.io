// Common Merganser, Mergus merganser americanus: the adult female, as she is on a forested river in the middle of
// May. A sheet is one plumage, and this one is hers: by then the drakes are leaving the rivers to moult (Kortright:
// the drake's moult into eclipse begins in spring; the drakes go when the ducks begin to sit), and a merganser on the
// river in May is most often a duck, alone or two together.
//
// What is published and what is not. The lengths under `published` are Grinnell, Bryant and Storer's for five adult
// females of the Pacific coast (wing, culmen, tarsus), Baird, Brewer and Ridgway's for the middle toe, and
// Kortright's for the length and the span (fresh birds, his own and others' measurements); she is built to the middle
// of each range, or to its mean where one is given. The colours follow Grinnell's description of the adult female,
// with what Birds of the World adds (gathered on 2026-11-16 by another agent, read through a summary of the page:
// `.local-assets/forest/research/birds-wave2-2026-11-16.json`). The outline of head and body, where the eye sits,
// how the folded wing lies, the crest's length and the waterline are in nothing that was read: they are the agent's
// drawing, for the owner to judge from the contact sheet. No length of the tail was found: it is built to Baird,
// Brewer and Ridgway's "about half the length of the wings", for the genus.
//
// How the sources were read: the full texts of Grinnell et al. 1918, Kortright 1942, Ridgway's Manual (1900) and
// Baird, Brewer and Ridgway (1884) from the Internet Archive, as text recognised from the scans, by the agent (no page
// seen as an image).

const G = 'Grinnell, Bryant and Storer 1918, The Game Birds of California (American Merganser, adult female)';
const K = 'Kortright 1942, The Ducks, Geese and Swans of North America (American Merganser)';

export const published = {
  shown: 'adult female',
  note: 'Published: the lengths above, and the colours as Grinnell has them (the whole head reddish brown but for the chin and throat, which are white, the slender feathers of the crest longer than the drake\'s; the upper surface ashy grey; the closed wing chiefly grey like the back, its speculum white, outlined with sooty brown and crossed by a single dusky bar; the flight feathers blackish brown; the wing\'s lining white; the under surface creamy white to salmon buff; the hind neck, the sides and the upper breast indistinctly barred grey and white; feet red, paler than the drake\'s); and from Birds of the World the bill scarlet to brown-red with a dusky top stripe and a dark nail, the webs dusky, the iris brown with a paler ring (Grinnell has it red). From Ridgway\'s Manual and Baird, Brewer and Ridgway, of this form: the black bases of the greater coverts exposed as a bar across the white of the wing. Not found in what was read, and the agent\'s: the tail\'s length (built at 110 mm, from the genus\'s "about half the length of the wings", B), the crest\'s length, the outline, the waterline. Whether the middle toe was measured with its claw is not said; it is built without, as Grinnell measures toes.',
  sources: {
    G: `${G}: five adult females, California to Alaska; the culmen taken from the forehead's feathers to the tip, the length laid on the back with the head straight out`,
    K: `${K}: fresh birds, length the mean of 39 females, span the mean of 14`,
    B: 'Baird, Brewer and Ridgway 1884, The Water Birds of North America, vol. 2 (Mergus americanus, female): the middle toe; of the genus, "the breadth [of the bill] uniformly about equal to the depth, the serrations conical, acute, and pointed backward", "tail about half the length of the wings"',
    W: 'Birds of the World (Cornell), Common Merganser, Appearance and Identification, through a summary of the page (2026-11-16, another agent): the female\'s colours, her bare parts, her mass',
    R: 'Bent 1923 and Millais 1913, as Kortright quotes them: how it patters off the water, flies low along rivers, dives, and loafs on islands and points',
  },
  lengths: [
    ['wing', 'Wing, folded', null, [234, 257], 'G'],
    ['culmen', 'Bill along culmen', null, [44.3, 53], 'G'],
    ['tarsus', 'Tarsus', null, [45.7, 49.5], 'G'],
    ['midToe', 'Middle toe', null, [57.2, 61], 'B'],
    ['length', 'Length, bill tip to tail tip (fresh birds)', 582, [541, 676], 'K'],
    ['span', 'Wingspan (fresh birds)', 871, [833, 958], 'K'],
  ],
  proportions: [
    'The bill long, slender and nearly cylindrical, "toothed" along both edges, with a sharp, hooked nail at its tip (G); the nostril nearer the middle of the bill than its base (G)',
    'A shaggy crest of slender feathers at the back of the head, longer than the drake\'s (G)',
    'The legs set far back on a long, low body; three front toes webbed nearly to their tips and a small hind toe (K, of the diving ducks)',
    'Tail about half the length of the wing (B, of the genus); the folded wing reaches to about the root of the tail (the agent\'s)',
  ],
  mass: 'Mass about 1,230 g in autumn: 900 to 1,700 (W)',
};

// the colours, as paint: [hue, saturation, lightness]
const RUFOUS = [14, 52, 31], CROWN = [12, 48, 26], CHIN = [40, 12, 92], BUFF = [32, 38, 88], GREY = [212, 10, 50], PALE = [212, 9, 58];
const SIDE = [212, 7, 62], BAR = [36, 16, 86], SOOT = [24, 12, 16], WHITE = [42, 10, 93];

const size = (p) => (p.x > 345 ? 7 : p.x > 290 ? 10 : 17);
// how far forward the head's brown comes down the neck: further on the nape than on the foreneck, where it meets the white throat
const brown = (p) => p.x > 345 - 20 * p.a;

export default {
  name: 'Common Merganser', latin: 'Mergus merganser', key: 'common-merganser', seed: 431,
  // ---- who is about on a visit (life/species/index.js says what each is)
  census: { tier: 'some', source: 'B C; breeds on clear forested rivers', party: [1, 2] },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 58 cm long, wings 87 cm across: a long, low duck, larger than a mallard.',
    marks: ['A rusty head with a shaggy crest, sharply set off from a white chin and throat', 'Grey above, white below', 'A long, thin red bill, toothed along its edges and hooked at the tip', 'This is a female: the drakes have left the rivers to moult by now'],
    lives: 'Clear rivers through forest. It hunts fish by sight, swimming with its head under water and diving after them; it patters along the surface to take off, and flies fast and low along the river. In spring it spends hours sleeping and preening on a gravel bar or a rock. It nests in a hollow in a big tree near the water.',
  },
  plate: { wide: 1.6, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 425
    top:    [[-24, 4], [0, 12], [40, 30], [100, 42], [160, 46], [215, 42], [260, 33], [290, 27], [318, 30], [344, 46], [364, 60], [385, 66], [403, 64], [416, 57], [423, 51], [425, 49.5]],
    bottom: [[-30, 0], [0, -26], [50, -52], [110, -66], [165, -68], [222, -58], [260, -42], [292, -18], [320, 4], [349, 20], [378, 28], [402, 31], [418, 32.5], [425, 33]],
    half:   [[-30, 7], [0, 22], [50, 50], [110, 60], [165, 60], [222, 52], [265, 38], [298, 25], [326, 22], [354, 24], [378, 25], [398, 21], [414, 14], [422, 9.5], [425, 8.5]],
    widest: 0.4,
    neck: [316, 356],
    eye: { x: 405, y: 56, r: 4.6 },
    // straight, with a hooked nail; as broad as it is deep all along, toothed (B; life/parts/duck.js)
    bill: { culmen: 48.6, drop: 0.02, gape: 10, duck: { flat: 0.05, nail: 7, serrate: 1, tip: 0.72, deep: 0.6, nostril: 0.4 } },
    // A shaggy crest, hanging back from the nape (see life/bird.js): its length is the agent's.
    crest: { sunk: 4, paint: [374, 392], lobes: [[388, 20, 1.5, 6, 8, 0.25], [381, 28, 1.6, 7, 9, 0.3], [374, 35, 1.7, 7, 9, 0.35], [367, 32, 1.85, 6, 8, 0.35]] },
    wing: {
      chord: 245, wrist: [272, 6], aim: [-245, 22],
      up:   [[0, 8], [0.12, 26], [0.3, 32], [0.5, 30], [0.75, 18], [0.9, 8], [1, 1.5]],
      down: [[0, 6], [0.12, 16], [0.3, 24], [0.5, 25], [0.75, 18], [0.9, 9], [1, 1.5]],
      rest: 6, proud: 4,
      span: 871, shoulder: [270, 26, 30], arm: 150, lead: 22, sweep: 62, root: 175, tipChord: 62,
    },
    tail: { length: 110, root: 8, rootHalf: 16, feathers: 16, width: 15, closed: 0.12, graded: 18, point: 0.3, droop: 0.04, tent: 8 },
    leg: { knee: [100, -44, 26], shin: 30, tarsus: 47.6, thick: [11, 6, 4.4], toes: { mid: 59, side: 56, hind: 13, claw: 8, hindClaw: 5 }, splay: 0.45,
      web: { share: 0.95, scallop: 0.12 } },
    // where the water comes to on her side as she swims, above the lowest point of her belly (the agent's)
    float: { line: 50 },
  },
  poses: {
    // standing on a bar: upright and clumsy on land (W), the bill pointed down a little
    perched: { pitch: 0.34, lift: 0.66, head: { pitch: -0.12 }, tail: { pitch: -0.1 }, feet: { mode: 'flat', width: 0.05, toeOut: 0.2 }, neck: { reach: 0, rise: -0.01 }, size: 1 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' }, neck: { reach: 0, rise: 0 }, size: 1 },
    // the neck stretched out ahead (R)
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.14 }, feet: { mode: 'tuck' }, neck: { reach: 0.014, rise: -0.014 }, size: 1 },
    // on the water (the page lifts her to her waterline by life/parts/swim.js floatLift; this is that, worked out once)
    swim: { pitch: 0.02, lift: -0.328, head: { pitch: 0.05 }, tail: { pitch: 0.06 }, feet: { mode: 'flat' }, swim: { phase: 0.6, kick: 0.6, both: 0, run: 0 }, neck: { reach: 0, rise: 0.008 }, size: 1 },
    // going under: pitched forward, the feet kicking together
    dive: { pitch: -0.55, lift: -0.3, head: { pitch: -0.6 }, tail: { pitch: 0.2 }, feet: { mode: 'flat' }, swim: { phase: 0.6, kick: 1, both: 1, run: 0 }, neck: { reach: 0.012, rise: -0.01 }, size: 1 },
  },
  plumage: {
    body: [
      { colour: BUFF, size },                                                                   // the under surface creamy white to salmon buff (G)
      { where: (p) => p.a > 0.28 && p.a < 0.6 && p.x > 20 && p.x < 288, colour: SIDE, bars: [BAR, 2, 0.12], size: 16 },   // the sides indistinctly barred grey and white (G)
      { where: (p) => p.x >= 245 && p.x < 322 && p.a < 0.6, colour: [212, 6, 70], bars: [BAR, 2, 0.14], size: 11 },      // and the upper breast (G)
      { where: (p) => p.a >= 0.6 && p.x < 315, colour: GREY, size },                           // the upper surface ashy grey (G), medium blue-grey (W)
      { where: (p) => p.a >= 0.55 && p.x < 40, colour: PALE, size: 14 },                         // palest on the rump (W)
      { where: (p) => p.a >= 0.5 && p.x >= 288 && p.x < 330, colour: [212, 8, 56], bars: [BAR, 1, 0.1], size: 10 },     // the hind neck barred grey and white (G)
      { where: brown, colour: RUFOUS, size: 7 },                                                // the whole head reddish brown (G), rich rusty (W)
      { where: (p) => brown(p) && p.a > 0.82 && p.x > 362, colour: CROWN, size: 6 },            // a little darker on the crown and the crest (the agent's)
      { where: (p) => p.x > 366 && p.a < 0.3 && p.y < 40, colour: CHIN, size: 5 },              // chin and throat white (G), a well-defined patch (W)
    ],
    wing: {
      web: [214, 9, 24], edge: [214, 7, 32], tertial: [212, 6, 66], covert: GREY, lesser: GREY, lesserEdge: [212, 8, 56],      // flight feathers blackish brown (G); the closed wing grey like the back (G); the tertials pale grey (W)
      medianTip: null, greaterTip: null, tertialTip: null, patchSkip: 0,
      // the speculum white, crossed by a single dusky bar (G): the greater coverts' black bases exposed as a bar across the white (B, Ridgway)
      primaryBars: [], secondaryBars: [[0.45, 1, WHITE, 'both']], greaterBars: [[0.5, 0.66, SOOT, 'both'], [0.66, 1, WHITE, 'both']],
      under: [24, 5, 52], underCovert: WHITE, underCovertTip: null, underBars: [],               // axillars and the wing's lining white (G)
      fold: { primaries: 9, secondaries: 8, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.44, median: 8, medianEnd: 0.26 },
      spread: { primaries: 10, secondaries: 12, shape: [0.9, 1, 0.99, 0.96, 0.92, 0.88, 0.84, 0.8, 0.77] },
    },
    tail: { web: [212, 7, 40], edge: [212, 6, 47], under: [212, 5, 56], point: 0.25 },              // grey, as the rump (the agent's: no source gives it)
    bill: { upper: [4, 62, 38], lower: [6, 58, 44], ridge: [6, 30, 17], nail: [8, 18, 13] },      // scarlet to brown-red, a dusky top stripe and a dark nail (W)
    mouth: [352, 32, 42],
    eye: { iris: [16, 42, 20], pupil: [240, 15, 5] },                                            // brown, with a paler ring (W)
    leg: [10, 58, 46], web: [10, 30, 30],                                                         // red, paler than the drake's (G); the webs dusky (W)
    shin: BUFF,
  },
  // ---- how it lives on a visit: life/families/swimmer.js, which says what each number is. From the sources (R, W):
  // that it hunts by swimming with its head under water and diving, patters a long way to rise, flies low along the
  // river, and loafs on bars for hours in spring; every number here is the agent's, none was read.
  way: {
    family: 'swimmer', together: true, there: 0.7, gap: [90, 300],
    // (the count of walks' limits, life/visit.js: it flies at about 19 m/s, a little more round a bend's outside; and
    // under the water it may be as deep as the river is, 1.35 m under its surface, never under its bed)
    fastest: 25,
    fast: 0.1, range: 50, stay: [300, 1100],
    hz: 5.5, speed: 19, high: 2.5, patter: 12, patters: 0.25, refuge: [60, 160],
    swim: [0.4, 0.9], sink: 0.3, cock: 0.06,
    beneath: 'under the water, chasing fish',
    bouts: [['paddle', 3], ['drift', 2], ['hold', 2], ['peer', 4], ['preen', 2], ['rest', 2], ['flap', 0.4]],
    dive: { chance: 0.3, time: [12, 35], gap: [4, 20], travel: 1.2, deep: 1.0 },
    loaf: { chance: 0.04, time: [60, 240], dry: 0.2 },
    flush: 30, startle: 50, near: 0.6, gone: 0.35,
    voice: { every: [120, 400], reach: 40 },
  },
  voices: { call: { silent: true } },       // (only a CC BY-SA recording was found: <par>/VOICES.js)
};
