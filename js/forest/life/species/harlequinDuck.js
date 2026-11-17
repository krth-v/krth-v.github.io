// Harlequin Duck, Histrionicus histrionicus pacificus: the adult drake in his breeding dress, and (`mate`) the adult
// duck. They are on the rivers as pairs from March, and the drakes leave for the coast in late June or July (Birds of
// the World and BirdWeb, as gathered on 2026-11-16), so in the middle of May a harlequin on the river is one of a
// pair. A sheet is one plumage: the drake's is the sheet's, and the duck's is `mate`, with her size beside his.
//
// What is published and what is not. The lengths under `published` are Grinnell, Bryant and Storer's for ten adult
// drakes from Alaska (wing, culmen, tarsus), Baird, Brewer and Ridgway's for the middle toe, Kortright's for the
// length and the span (fresh birds), and Wikipedia's for the tail (its sexes not given); he is built to the middle of
// each range, or to its mean where one is given. His colours follow Grinnell's description of the adult male tract by
// tract, which gives the bill, the legs and the webs from Nelson (1887), with what Birds of the World adds (the mantle
// plumbeous, blackening to the rump; the breast and belly dark grey; a white spot where the outermost tail feather
// is rooted). Hers follow Grinnell's description of the adult female and Birds of the World's. The outline of head
// and body, where the eye sits, how the folded wing lies, how high it floats and every shape of the white marks are
// in nothing that was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: the full texts of Grinnell et al. 1918, Kortright 1942 and Baird, Brewer and Ridgway
// (1884) from the Internet Archive, as text recognised from the scans, by the agent; Birds of the World and Wikipedia
// through another agent's summaries of the pages (`.local-assets/forest/research/birds-wave2-2026-11-16.json`). No
// page was seen as an image.

const G = 'Grinnell, Bryant and Storer 1918, The Game Birds of California (Harlequin Duck)';

export const published = {
  shown: 'adult male, breeding dress (and the adult female, his mate)',
  note: 'Published: the lengths above, and the colours as Grinnell has them (the head and neck dark slate blue; a black stripe from the bill over the crown; a reddish brown stripe from above the eye to the back of the head on either side; a large white triangle before the eye, a narrow white stripe from its upper corner to above the eye, a round white spot behind the eye and an oblique white stripe down the side of the neck, all bordered with black; the throat sooty black; a white collar round the lower neck, divided before and behind, black above and below it; a white bar across the side of the breast before the wing, black on either side of it; the scapulars white down their middles, a white stripe either side of the back; the sides and flanks rich reddish brown; the under surface slaty, dusky on the belly; the rump and the under tail coverts black, a small white spot either side by the tail; the wing deep slate, its speculum dark metallic blue, the tertials\' outer webs white edged with black; the bill bluish black and its tip bluish horn; the legs and feet dark olive brown and the webs black, after Nelson). Hers, as Grinnell has them: olive brown all over, darkest on the crown; a spot above and before the eye, another below and behind it, and a broad patch on the cheek between the bill and the eye dull white; the under surface greyish brown, whitish towards its middle and mottled. Not found in what was read, and the agent\'s: the outline, the shape and size of each white mark, the two small white spots on the coverts (left out), how high it floats.',
  sources: {
    G: `${G}: ten adult drakes from Alaska; the culmen taken from the forehead's feathers to the tip`,
    K: 'Kortright 1942, The Ducks, Geese and Swans of North America (Western Harlequin Duck): fresh birds, length the mean of 16 drakes, span the mean of 8',
    B: 'Baird, Brewer and Ridgway 1884, The Water Birds of North America, vol. 2 (Histrionicus minutus): the middle toe; of the genus, the tail "rather long (more than half the wing), much graduated, consisting of fourteen feathers"',
    W: 'Wikipedia, "Harlequin duck", Standard measurements (through another agent\'s summary, 2026-11-16): the tail, sexes not given',
    O: 'Birds of the World (Cornell), Harlequin Duck, Appearance and Behavior (through another agent\'s summary, 2026-11-16): the colours it adds to Grinnell\'s, the walk, the mass',
    M: 'Michael 1922, as Kortright quotes it: how harlequins feed and dive on a river',
  },
  lengths: [
    ['wing', 'Wing, folded', null, [193.5, 210], 'G'],
    ['culmen', 'Bill along culmen', null, [26.4, 30], 'G'],
    ['tarsus', 'Tarsus', null, [36.8, 38.6], 'G'],
    ['midToe', 'Middle toe', 50.8, [50.8, 50.8], 'B'],
    ['tail', 'Tail', null, [77, 101.5], 'W'],
    ['length', 'Length, bill tip to tail tip (fresh birds)', 439, [406, 538], 'K'],
    ['span', 'Wingspan (fresh birds)', 667, [622, 705], 'K'],
  ],
  proportions: [
    'The bill very small, narrowing fast to a broad nail (G, B); the forehead steep',
    'The tail rather long, much graduated and conspicuously pointed, of fourteen feathers (G, B)',
    'Floats high on the water between its dives (M)',
    'The duck about nine tenths of the drake in her wing, culmen, tarsus and length (G: five females, wing 178 to 192, culmen 24.1 to 26.4, tarsus 34 to 35; K: length 401, the mean of 11)',
  ],
  mass: 'Mass of drakes 490 to 760 g, of ducks 470 to 670 g (O)',
};

// his colours, as paint: [hue, saturation, lightness]
const SLATE = [216, 24, 24], BREAST = [214, 20, 30], BELLY = [214, 10, 20], MANTLE = [213, 15, 33], BLACK = [222, 18, 9];
const CHESTNUT = [14, 60, 34], WHITE = [210, 12, 92], THROAT = [222, 12, 12];
// hers
const OLIVE = [34, 22, 25], OLIVE_DARK = [32, 20, 19], OFF_WHITE = [40, 14, 80], HER_BELLY = [36, 12, 50];

// how far a point of the side of the head or neck (x, y, in the level pose) is from a line from a to b
const fromLine = (p, [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((p.x - ax) * dx + (p.y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - ax - dx * t, p.y - ay - dy * t);
};
// his white marks, each with a black edge round it a little wider: [where it is, how wide its black edge is]
const side = (p) => p.a > 0.18 && p.a < 0.86;
const MARKS = [
  // a large white triangle at the side of the bill before the eye, straight-bordered behind (G)
  [(p, e) => side(p) && p.x > 307 - e && p.y > 15 - e && p.y < 40 + e && p.x - 307 > (p.y - 40) * -0.35 - e, 1.6],
  // a narrow white stripe from its upper corner to above the eye (G)
  [(p, e) => p.a >= 0.7 && p.a < 0.86 && fromLine(p, [309, 41], [297, 45]) < 1.6 + e, 1.2],
  // a round white spot behind the eye, on the rear ear coverts (G; larger than the eye, W)
  [(p, e) => side(p) && Math.hypot(p.x - 284, p.y - 30) < 5.2 + e, 1.4],
  // an oblique white stripe down the side of the neck (G)
  [(p, e) => side(p) && fromLine(p, [272, 15], [257, -2]) < 2.2 + e, 1.4],
  // a white collar round the lower neck, divided before and behind (G)
  [(p, e) => p.a > 0.1 && p.a < 0.9 && Math.abs(p.x - 241) < 3 + e * 1.8, 1.8],
  // a white bar across the side of the breast before the bend of the wing, from the breast up to the mantle (G, W)
  [(p, e) => p.a > 0.16 && p.a < 0.78 && Math.abs(p.x - 214 + (p.a - 0.4) * 10) < 3.4 + e * 1.6, 1.8],
];
const size = (p) => (p.x > 240 ? 5 : p.x > 200 ? 7 : 12);

export default {
  name: 'Harlequin Duck', latin: 'Histrionicus histrionicus', key: 'harlequin-duck', seed: 432,
  // ---- who is about on a visit (life/species/index.js says what each is)
  census: { tier: 'rare', source: 'B U; pairs on fast forested streams from mid-March', party: [2, 2] },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 44 cm long, wings 67 cm across: a small, dark duck of fast water.',
    marks: ['The drake slate blue, with chestnut flanks and bold white marks edged with black: before the eye, behind it, a collar and a bar on the breast',
      'The duck dull brown, with white spots on the side of her head', 'A small bill and a long, pointed tail', 'They go in pairs'],
    lives: 'Fast, rocky rivers under forest. It rides the riffles like a cork, dives to the gravel and walks along the bottom against the current, turning the stones for the larvae of insects, and pops back up where it went down. It rests on a rock in the stream or on a gravel bar, and flies fast and low along the river. The pair stays together until she sits on her eggs; then he goes back to the sea.',
  },
  plate: { wide: 1.25, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 323
    top:    [[-22, 3], [0, 11], [40, 27], [100, 35], [160, 34], [205, 27], [232, 22], [250, 25], [264, 36], [278, 45], [292, 49], [304, 46], [313, 39], [319, 31], [323, 26]],
    bottom: [[-28, 0], [0, -24], [50, -46], [110, -51], [170, -45], [205, -31], [232, -14], [256, -1], [280, 6], [300, 10], [315, 12], [323, 13]],
    half:   [[-28, 6], [0, 18], [50, 43], [110, 50], [170, 47], [205, 37], [232, 24], [250, 19], [268, 21], [286, 22], [302, 19], [314, 13], [323, 7.5]],
    widest: 0.42,
    neck: [240, 266],
    eye: { x: 300, y: 36, r: 4 },
    // very small, narrowing fast to its broad nail (life/parts/duck.js)
    bill: { culmen: 28.2, drop: 0.03, gape: 7, duck: { flat: 0.35, nail: 4.5, serrate: 0, tip: 0.45, deep: 0.45, nostril: 0.35 } },
    wing: {
      chord: 201.75, wrist: [205, 0], aim: [-200, 16],
      up:   [[0, 7], [0.12, 22], [0.3, 27], [0.5, 24], [0.75, 15], [0.9, 6], [1, 1.5]],
      down: [[0, 5], [0.12, 12], [0.3, 17], [0.5, 18], [0.75, 13], [0.9, 6], [1, 1.5]],
      rest: 5, proud: 3,
      span: 667, shoulder: [202, 18, 22], arm: 115, lead: 16, sweep: 48, root: 135, tipChord: 50,
    },
    tail: { length: 90, root: 6, rootHalf: 10, feathers: 14, width: 10, closed: 0.07, graded: 34, point: 0.55, droop: 0, tent: 9 },
    leg: { knee: [72, -34, 22], shin: 26, tarsus: 37.7, thick: [10, 5, 3.6], toes: { mid: 50.8, side: 47, hind: 9, claw: 5, hindClaw: 3.5 }, splay: 0.42,
      web: { share: 0.95, scallop: 0.15 } },
    // it floats high (M): the water comes to a little over a quarter of the way up its side (the agent's)
    float: { line: 26 },
  },
  poses: {
    // on a rock: it walks with its head held high and its body at about 45 degrees (O)
    perched: { pitch: 0.55, lift: 0.7, head: { pitch: -0.2 }, tail: { pitch: -0.25 }, feet: { mode: 'flat', width: 0.04, toeOut: 0.2 }, neck: { reach: 0, rise: 0 }, size: 1 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' }, neck: { reach: 0, rise: 0 }, size: 1 },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.16 }, feet: { mode: 'tuck' }, neck: { reach: 0.008, rise: -0.008 }, size: 1 },
    // on the water, the tail cocked up (the page lifts it to its waterline by life/parts/swim.js floatLift; this is that, worked out once)
    swim: { pitch: 0.02, lift: -0.146, head: { pitch: 0.05 }, tail: { pitch: 0.32 }, feet: { mode: 'flat' }, swim: { phase: 0.6, kick: 0.6, both: 0, run: 0 }, neck: { reach: 0, rise: 0.004 }, size: 1 },
    dive: { pitch: -0.6, lift: -0.3, head: { pitch: -0.6 }, tail: { pitch: 0.4 }, feet: { mode: 'flat' }, swim: { phase: 0.6, kick: 1, both: 1, run: 0 }, neck: { reach: 0.006, rise: -0.006 }, size: 1 },
  },
  plumage: {
    body: [
      { colour: BREAST, size },                                                                  // the under surface slaty, clearer slaty blue on the breast (G)
      { where: (p) => p.a < 0.26 && p.x < 190, colour: BELLY, size: 12 },                         // dusky on the belly (G), dark grey (O)
      { where: (p) => p.a >= 0.26 && p.a < 0.62 && p.x > 14 && p.x < 205, colour: CHESTNUT, size: 12 },   // the sides behind the bend of the wing, and the flanks, rich reddish brown (G)
      { where: (p) => p.a >= 0.62 && p.x < 232, colour: MANTLE, size },                           // the mantle greyish blue, blackening to the rump (O)
      { where: (p) => (p.a >= 0.5 && p.x < 55) || (p.a >= 0.75 && p.x < 80), colour: BLACK, size: 10 },  // the rump black, glossed steel blue (G)
      { where: (p) => p.a < 0.5 && p.x < 14, colour: BLACK, size: 9 },                            // the under tail coverts black (G)
      { where: (p) => p.a > 0.3 && p.a < 0.46 && Math.hypot(p.x - 4, (p.a - 0.38) * 120) < 5, colour: WHITE, size: 4 },  // with a small round white spot either side by the tail (G)
      { where: (p) => p.a >= 0.6 && p.a < 0.8 && p.x > 80 && p.x < 200, colour: BLACK, size: 8 },  // the scapulars: black either side of
      { where: (p) => p.a >= 0.64 && p.a < 0.76 && p.x > 88 && p.x < 192, colour: WHITE, size: 7 }, // their white middles, a stripe either side of the back (G, W)
      { where: (p) => p.x >= 232, colour: SLATE, size: 5 },                                       // the head and neck dark slate blue (G)
      { where: (p) => p.x > 256 && p.a < 0.2, colour: THROAT, size: 4 },                          // the throat sooty black (G)
      { where: (p) => p.x > 246 && p.x < 256 && p.a > 0.08 && p.a < 0.92, colour: BLACK, size: 4 },   // a broad black band above the collar (G)
      ...MARKS.map(([where, e]) => ({ where: (p) => where(p, e), colour: BLACK, size: 4 })),      // all the white marks bordered with black (G)
      ...MARKS.map(([where]) => ({ where: (p) => where(p, 0), colour: WHITE, size: 3.5 })),
      { where: (p) => p.x > 266 && p.a >= 0.92, colour: BLACK, size: 4 },                         // a black stripe from the bill over the middle of the crown (G)
      { where: (p) => p.x > 262 && p.x < 298 && p.a >= 0.82 && p.a < 0.92, colour: CHESTNUT, size: 4 },   // a reddish brown stripe from above the eye to the back of the head (G; amber, O)
    ],
    wing: {
      web: [26, 12, 15], edge: [216, 12, 20], tertial: BLACK, covert: [216, 16, 24], lesser: [216, 16, 24], lesserEdge: [216, 14, 28],  // the closed wing deep slate, the flight feathers blackish brown (G)
      medianTip: null, greaterTip: null, tertialTip: null, patchSkip: 0,
      primaryBars: [], secondaryBars: [[0.25, 1, [234, 30, 20], 'both']],                         // the speculum dark metallic blue with violet reflections (G)
      tertialBars: [[0.08, 0.95, WHITE, 'outer']],                                                // the tertials' expanded outer webs white, edged with black (G)
      under: [28, 8, 24], underCovert: [28, 8, 27], underCovertTip: null, underBars: [],         // axillars and the wing's lining dusky brown (G)
      fold: { primaries: 9, secondaries: 7, secondaryEnd: 0.72, greater: 8, greaterEnd: 0.42, median: 7, medianEnd: 0.25 },
      spread: { primaries: 10, secondaries: 11, shape: [0.88, 1, 0.99, 0.95, 0.9, 0.85, 0.8, 0.76, 0.72] },
    },
    tail: { web: [222, 10, 13], edge: [222, 10, 17], under: [222, 8, 18], point: 0.55 },                            // blackish slate, conspicuously pointed (G)
    bill: { upper: [214, 18, 21], lower: [214, 14, 26], nail: [210, 12, 66] },                    // bluish black, the tip bluish horn (G, after Nelson)
    mouth: [350, 25, 40],
    eye: { iris: [16, 40, 22], pupil: [240, 15, 5] },                                            // hazel (G), dark reddish brown (O)
    leg: [44, 12, 30], web: [30, 8, 9],                                                           // legs and feet dark olive brown, the webs black (G, after Nelson)
    shin: BELLY,
  },
  // the duck: as Grinnell has her, and nine tenths of his size (published.proportions)
  mate: {
    shown: 'adult female', scale: 0.915,
    plumage: {
      body: [
        { colour: HER_BELLY, edge: OFF_WHITE, fringe: 0.25, size: 11 },                           // the under surface greyish brown, whitish to its middle, mottled with the feathers' broad white ends (G)
        { where: (p) => p.a >= 0.22 || p.x > 200 || p.x < 20, colour: OLIVE, size: 11 },          // the upper surface, the sides, the chest and the under tail coverts almost uniform olive brown (G)
        { where: (p) => p.x > 232, colour: OLIVE, size: 5 },                                      // the head and neck chiefly olive brown (G)
        { where: (p) => p.x > 262 && p.a > 0.85, colour: OLIVE_DARK, size: 4 },                   // darkest on the crown (G)
        { where: (p) => p.x > 256 && p.a < 0.18, colour: [34, 18, 38], size: 4 },                 // lightest on the chin and throat (G)
        { where: (p) => p.a > 0.2 && p.a < 0.75 && p.x > 304 && p.y > 12 && p.y < 34, colour: OFF_WHITE, edge: [34, 16, 60], fringe: 0.3, size: 3.5 },  // a broad patch on the cheek between the bill and the eye, dull white, flecked (G)
        { where: (p) => p.a > 0.7 && p.a < 0.86 && Math.hypot(p.x - 304, p.y - 43) < 3.4, colour: OFF_WHITE, size: 3 },   // a spot above and before the eye (G)
        { where: (p) => p.a > 0.2 && p.a < 0.86 && Math.hypot(p.x - 284, p.y - 30) < 4.6, colour: OFF_WHITE, size: 3 },   // another below and behind it, as round as his (G, W)
      ],
      wing: {
        web: [30, 14, 18], edge: [32, 14, 24], tertial: [32, 16, 22], covert: OLIVE, lesser: OLIVE, lesserEdge: [34, 18, 30],
        medianTip: null, greaterTip: null, tertialTip: null, patchSkip: 0,
        primaryBars: [], secondaryBars: [],
        under: [30, 10, 30], underCovert: [30, 10, 34], underCovertTip: null, underBars: [],
        fold: { primaries: 9, secondaries: 7, secondaryEnd: 0.72, greater: 8, greaterEnd: 0.42, median: 7, medianEnd: 0.25 },
        spread: { primaries: 10, secondaries: 11, shape: [0.88, 1, 0.99, 0.95, 0.9, 0.85, 0.8, 0.76, 0.72] },
      },
      tail: { web: [30, 14, 18], edge: [32, 12, 24], under: [30, 10, 26], point: 0.55 },
      bill: { upper: [214, 12, 30], lower: [214, 10, 34], nail: [210, 10, 62] },                  // dark grey with a bluish tinge, the nail paler (O, of all ages and sexes)
      mouth: [350, 25, 40],
      eye: { iris: [24, 30, 22], pupil: [240, 15, 5] },                                          // brown (O)
      leg: [210, 6, 36], web: [30, 6, 12],                                                        // grey, the webs darker to black (O)
      shin: HER_BELLY,
    },
  },
  // ---- how it lives on a visit: life/families/swimmer.js, which says what each number is. From Michael 1922 (M): how
  // long it is under (most often 15 s at most, often 20, now and then 25), the seconds between plunges (seldom more than
  // 10), dives in runs in a riffle, coming up where it went down, tipping up in the shallows, resting in an eddy, the
  // pair seldom under together. Every other number is the agent's.
  way: {
    family: 'swimmer', together: true, there: 0.8, gap: [90, 300],
    // (the count of walks' limits, life/visit.js: it flies at about 17 m/s, a little more round a bend's outside; and
    // under the water it is on the bottom, as deep as the river is, 1.35 m under its surface, never under its bed)
    fastest: 23,
    fast: 0.9, range: 20, stay: [400, 1400],
    hz: 7, speed: 17, high: 1, patter: 4, patters: 0.4, refuge: [30, 90],
    swim: [0.5, 1], sink: 0, cock: 0.32,
    beneath: 'walking upstream on the bottom, prying among the stones',
    bouts: [['paddle', 4], ['drift', 1], ['hold', 2], ['peer', 1.5], ['preen', 2], ['rest', 2], ['tip', 2], ['flap', 0.4]],
    dive: { chance: 0.4, time: [8, 24], gap: [2, 10], travel: 0.12, deep: 2 },
    loaf: { chance: 0.03, time: [40, 180], dry: 0.05 },
    flush: 12, startle: 22, near: 0.8, gone: 0.2,
    voice: { every: [30, 120], reach: 50 },
  },
  voices: { call: { silent: true } },       // (nothing found: <par>/VOICES.js)
};
