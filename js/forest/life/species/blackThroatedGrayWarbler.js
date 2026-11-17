// Black-throated Gray Warbler, Setophaga nigrescens (Ridgway's Dendroica nigrescens): the adult male in spring.
//
// What is published and what is not. The lengths under `published` are Ridgway's (1902) for five adult males
// from California and Oregon, the nearest of his series to the coastal birds of the Pacific Northwest, and the
// bird is built to their means; life/measure.js measures the built bird against them. Their ranges are his for ten
// adult males of the whole species (localities not given). The colours are his description of the adult male in
// spring and summer: the head black with a broad white stripe over the eye, a small yellow spot before the eye
// and a broad white stripe below the cheek; the throat and chest black; the rest of the underparts white, broadly
// streaked with black along the sides; the hindneck, back, scapulars and rump slate-gray, the back streaked with
// black; two white bars on the wing; the outer tail feathers mostly white on their inner webs. The outline of
// head and body, where the eye sits, how the folded wing lies, the bill's shape and how far the primaries show
// beyond the tertials are in nothing that was read (Audubon has only "rounded" wings and a "notched,
// square-tipped" tail): they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: Ridgway's lengths and colours through the archive.org character recognition of the
// volume, read as page text by one agent and checked against it by a second; the scan itself was not seen as an
// image, and the column order of his table of five (wing, tail, exposed culmen, tarsus, middle toe) was inferred from
// its five numbers, which match the species' means. Whether the middle toe includes its claw is not said. The
// "Ten specimens" footnote is attached to the male's line by its place in the text. The live length and the span
// are from Wikipedia and Audubon (both sexes, no sample given), and were not checked by a second reader.

const R = 'Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), Dendroica nigrescens, p. 556-558';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them (head uniform black, relieved by a broad white stripe over the eye reaching forward to above its middle, a small yellow spot before the eye and a broad white malar stripe running from the base of the bill to the sides of the neck; the whole throat and chest uniform black; the rest of the underparts white, broadly streaked on the sides with black; hindneck, back, scapulars and rump slate-gray or plumbeous, the back, scapulars and upper tail coverts streaked with black, the hindneck not; wings and tail black or dusky with gray edgings, the middle and greater wing coverts broadly tipped white to make two conspicuous bands; the inner webs of the two outermost tail feathers mostly white, the third white on its terminal half or more, the fourth with some white at the end; bill black; iris brown; legs and feet dusky brown, sometimes nearly black). Not found in what was read, and the agent\'s: the outline, the bill\'s shape, how far the primaries project, how wide each stripe of the head is, and the posture. The colours are laid darker than their names read. The Pacific series is five birds; the species line is ten.',
  sources: {
    R: `${R}: five adult males from California and Oregon (means), and ten adult males of the species (ranges); museum skins`,
    W: 'Wikipedia, "Black-throated gray warbler" (read 2026-11-16, not checked by a second reader): 13 cm long, wingspan 19 to 19.7 cm, 8.4 g',
    A: 'Audubon field guide, Black-throated Gray Warbler (not checked by a second reader): 11 to 13 cm, wingspan 18 to 20 cm, 8 to 12 g; wings rounded, tail notched or square-tipped',
    B: 'Seattle Audubon, BirdWeb, Black-throated Gray Warbler (not checked by a second reader): a fairly common summer resident of western Washington; gleans from foliage and limbs',
  },
  lengths: [
    ['wing', 'Wing, folded (five males of California and Oregon)', 61.9, [59.6, 66.6], 'R'],
    ['tail', 'Tail', 49.4, [48.8, 55], 'R'],
    ['culmen', 'Exposed culmen', 9.3, [8.2, 9.6], 'R'],
    ['tarsus', 'Tarsus', 17.4, [16.8, 18.8], 'R'],
    ['midToe', 'Middle toe (claw not stated)', 10.4, [9.8, 11.2], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 112.5, [105, 118], 'R'],
    ['span', 'Wingspan (secondary sources, both sexes)', null, [190, 197], 'W'],
  ],
  proportions: [
    'The tail four fifths of the wing (49.4 to 61.9: worked out from Ridgway\'s means)',
    'The tarsus more than a quarter of the wing, and the bill about a seventh of it (the agent\'s arithmetic)',
  ],
  mass: 'Mass about 8.4 g: 8 to 12 (W, A)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
// (laid darker than the names read: the slate-gray is a middling blue-grey, and the white is a little off white)
const BLACK = [220, 6, 8], WHITE = [48, 8, 86], BELLY = [46, 8, 84], SLATE = [212, 11, 33], SLATE_NAPE = [214, 10, 35];
const YELLOW = [50, 85, 50], DUSKY = [220, 8, 15], EDGE = [214, 9, 40], BAR = [48, 6, 88], STREAK = [220, 8, 11];

const size = (p) => (p.x > 43 ? 2 : p.x > 37 ? 2.8 : 4.4);

export default {
  name: 'Black-throated Gray Warbler', latin: 'Setophaga nigrescens', key: 'black-throated-gray-warbler', seed: 139,
  // ---- who is about on a visit, how it lives on one (life/species/index.js says what each field is) and its voices
  census: { tier: 'few', source: 'B C; second growth and edges', wave: true },
  // Its way (life/families/foliage.js). From what was read (B; A, the Audubon field guide; W): it gleans the foliage
  // while climbing about the limbs, mostly for small caterpillars, and hovers a moment to pick at a leaf (that it flies
  // out after an insect now and then, `sally`, is the agent's); it is not wary when it is low, and can be watched close; in Washington it keeps to mixed
  // and coniferous woods, second growth and edges; in migration it goes about in mixed flocks. The sources differ
  // on its height (BirdWeb the treetops, Audubon and Wikipedia low foliage): here 1.8 to 6.5 m above its tree's foot,
  // and it sings from up to 8 m (the family says why). Every number below is the agent's.
  way: {
    family: 'foliage', there: 0.6, gap: [40, 180],
    homeOff: 14, range: 22, apart: 40, broad: 0.45,
    low: 1.8, high: 6.5, perch: 8,
    hz: 21, speed: 6.5, stay: [8, 24], spell: [100, 320],
    flush: 2.5, startle: 6, near: 0.85, gone: 0.12,
    hop: [0.3, 1.3], hops: 4, hang: 0.02, hover: 0.08, sally: 0.07, reach: [1.5, 4], flick: 0,
    doing: { look: 'among the leaves, looking about', hop: 'hopping along a bough', peck: 'picking at the leaves', hang: 'hanging under a twig, picking at it', hover: 'hovering at a leaf, picking at it' },
    call: { every: [8, 20], time: 0.15, rate: 6, reach: 25, doing: 'calling: a dull "tup"' },
    song: { every: [10, 22], up: 0.3, bout: [3, 6], gap: [7, 14], time: 1.5, rate: 6, reach: 60, doing: 'singing: buzzy notes that rise and then fall' },
  },
  voices: {
    song: { silent: true },   // no recording found under any usable or BY-SA licence
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 12 cm long and 8 g: a little smaller than a sparrow.',
    marks: ['A black cap and a black throat, with a white stripe over the eye and another below the cheek', 'A small yellow spot before the eye', 'Gray above, white below, with black streaks along the sides', 'Two white bars on the wing'],
    lives: 'Open, mixed and second-growth woods and the edges of them. It gleans caterpillars and other insects from leaves and twigs, sometimes hovering to take one, and is often among other small birds. Its song is a run of buzzy notes that rises and then falls; its call is a dull "tup".',
  },
  plate: { wide: 0.36, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 54.3
    top:    [[-9, 2], [-3, 5], [6, 8.6], [16, 11.2], [26, 12], [34, 11.8], [40, 11.6], [45, 12.6], [49.5, 12.2], [52, 9.6], [53.6, 6.2], [54.3, 3.9]],
    bottom: [[-11, -1], [-4, -5], [5, -9.4], [15, -12.2], [25, -12.6], [33, -11], [40, -8.6], [46, -5.2], [50.5, -2], [54.3, 0.9]],
    half:   [[-11, 2.2], [-4, 6], [5, 9.8], [15, 11.8], [25, 12.2], [33, 11], [39, 9.6], [44, 9.4], [48.5, 8.2], [52, 5], [54.3, 1.5]],
    widest: 0.46,
    neck: [36, 45],
    eye: { x: 48.2, y: 6.4, r: 1.4 },
    bill: { culmen: 9.3, drop: 0.04, gape: 1.4 },
    wing: {
      chord: 61.9, wrist: [35, -2], aim: [-60, 5],
      up:   [[0, 2], [0.12, 7.2], [0.3, 8.8], [0.5, 7.8], [0.72, 5], [0.9, 2.3], [1, 0.6]],
      down: [[0, 1.4], [0.12, 4.2], [0.3, 5.8], [0.5, 6], [0.72, 4.5], [0.9, 2.5], [1, 0.6]],
      rest: 1.9, proud: 1,
      span: 195, shoulder: [33.5, 6, 9], arm: 27, lead: 6, sweep: 13, root: 47, tipChord: 19,
    },
    // notched or square-tipped (Audubon): the feathers nearly of a length
    tail: { length: 49.4, root: 0.9, rootHalf: 2.3, feathers: 12, width: 5.6, closed: 0.035, graded: 0.5, point: 0.6, droop: 0.03, tent: 3.8 },
    leg: { knee: [23, -7.6, 5.6], shin: 11.5, tarsus: 17.4, thick: [2.6, 1.1, 0.66], toes: { mid: 10.4, side: 7.8, hind: 7.4, claw: 3.8, hindClaw: 5 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.3, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                  // under parts white (R)
      { where: (p) => p.a > 0.26 && p.a < 0.6 && p.x < 33, colour: WHITE, shaft: STREAK, shaftWidth: 0.26, size: 7.5 },   // the sides and flanks broadly streaked with black (R)
      { where: (p) => p.a < 0.46 && p.x > 34, colour: BLACK, size: 2.6 },                          // the whole throat and chest uniform black (R)
      { where: (p) => p.a >= 0.58 && p.x <= 38, colour: SLATE, shaft: STREAK, shaftWidth: 0.22, size: 6.5 },   // back, scapulars and upper tail coverts slate-gray, streaked with black (R)
      { where: (p) => p.a >= 0.58 && p.x > 28.5 && p.x <= 38, colour: SLATE_NAPE, size: 3 },    // the hindneck not streaked (R)
      { where: (p) => p.a >= 0.58 && p.x > 5 && p.x < 12.5, colour: SLATE, size: 4.4 },         // the rump sometimes not streaked (R)
      { where: (p) => p.x > 38, colour: BLACK, size: 2 },                                       // head uniform black (R)
      // (each stripe of the head bounded round it, `a`, so that it does not join its fellow over the crown or under the chin)
      { where: (p) => p.x > 37 && p.x <= 49 && p.a >= 0.45 && p.a < 0.82 && p.y > 8 && p.y <= 10.4, colour: WHITE, size: 1.8 },   // a broad white stripe over the eye, to above its middle (R)
      { where: (p) => p.x > 48.8 && p.x <= 52 && p.a >= 0.45 && p.a < 0.84 && p.y > 7.4 && p.y <= 9.2, colour: YELLOW, size: 1.1 },    // a small yellow spot before the eye (R)
      { where: (p) => p.x > 38 && p.a >= 0.3 && p.a < 0.5 && p.y > -3.6 && p.y <= 1.6, colour: WHITE, size: 1.9 },   // a broad white stripe from the base of the bill to the sides of the neck (R)
      { where: (p) => p.x > 52.6 && p.a < 0.32, colour: WHITE, size: 1.2 },                     // the two meeting on the chin's very front, the throat behind it black (R: "anteriorly confluent on chin")
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: DUSKY, covert: [216, 8, 19], lesser: SLATE, lesserEdge: [212, 10, 46],     // wings black or dusky with gray edgings (R)
      medianTip: [BAR, 0.16], greaterTip: [BAR, 0.15],                                           // middle and greater coverts broadly tipped white: two conspicuous bands (R)
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.4, 0.95, [214, 6, 62], 'edge']],                       // the tertials edged pale (agent's)
      under: [214, 6, 52], underCovert: [214, 5, 74], underCovertTip: null, underBars: [],      // under the wing: not described in what was read; pale grey here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.74, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.96] },
    },
    // the inner webs of the two outermost feathers mostly white, the third's terminal half or more, the fourth's end (R)
    tail: { web: DUSKY, edge: EDGE, under: [214, 6, 36], point: 0.4, tip: [[5, WHITE, 0.88], [4, WHITE, 0.78], [3, WHITE, 0.55], [2, WHITE, 0.22]] },
    bill: { upper: [220, 6, 9], lower: [220, 6, 12] },                                          // bill black (R)
    mouth: [350, 30, 40],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [25, 18, 18],                                                                          // dusky brown, sometimes nearly black (R)
    shin: [25, 16, 22],
  },
};
