// Yellow-rumped Warbler, Setophaga coronata, the western form, Audubon's Warbler (S. c. auduboni; Ridgway's
// Dendroica auduboni): the adult male in spring and summer. The female is duller and browner, with less black.
//
// What is published and what is not. The lengths under `published` are Ridgway's for twelve adult males of
// Audubon's Warbler, and the bird is built to their means; life/measure.js measures the built bird against them.
// The colours follow his description of the adult male in spring and summer, tract by tract. The outline of head
// and body, where the eye sits, how the folded wing lies and how the bird stands on a twig are in nothing that
// was read (no source gave a posture): they are the agent's drawing, for the owner to judge from the contact
// sheet.
//
// How the sources were read: two agents, one reading and one checking, each through the character recognition
// of the Internet Archive's scans (two scans of the volume, which agree but for the tail's least value) and, for
// the rest, through a tool that returns a summary of a page. No page was seen as an image. The tail's least
// value is printed "58" in one scan and "53" in the other, against a mean of 58.3: the checker took 53 as the
// likelier and could not prove it, so it is used here and is unconfirmed. The middle toe's upper limit (14) is
// legible in one scan only. The wingspan and the mass are for the whole species, both sexes.

const R = 'Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), p. 551 to 553, Dendroica auduboni auduboni';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the adult male in spring and summer (above bluish slate-gray streaked with black, the streaks broadest on the back, scapulars and upper tail coverts as wedge-shaped spots; a large central patch of rich lemon yellow on the crown; a triangular patch of lighter canary yellow on the lower rump; wings black, the middle and greater coverts very broadly tipped with white and the greater also broadly edged with it, so that they make one large white patch and not two bars; the flight feathers narrowly edged with gray, broader on the tertials; tail black with bluish gray edgings, the outermost feather edged white, and a large white subterminal patch on the inner web of the four or five outermost feathers; sides of the head slate-gray, darker on the lores and below the eye, with a white spot on the upper and a larger one on the lower eyelid; chin and throat bright lemon yellow; chest black or black mixed with gray; the middle of the breast, the belly and the under tail coverts white; the sides of the breast black, continued over the sides and flanks in broad streaks, with a large yellow patch on each side of the breast outside the black; bill black; iris brown; legs and feet dark brown or brownish black). Not found in what was read, and the agent\'s: the outline, the posture, the forehead and nape apart from the crown, and how wide each streak is. Whether the middle toe was measured with its claw is not said; the tail\'s least value is unconfirmed (see above); the wingspan is a species figure.',
  sources: {
    R: `${R}: 12 adult males, museum skins (the footnote "Twelve specimens" is from the second scan's text)`,
    W: 'Wikipedia, "Yellow-rumped warbler" (read 2026-11-16): wingspan 19 to 24 cm and 9.9 to 17.7 g for the whole species, both sexes',
    B: 'Seattle Audubon, BirdWeb, Yellow-rumped Warbler: a common summer resident of Washington, breeding high in conifers; broken white eye-rings',
    G: 'Grinnell and Storer, Animal Life in the Yosemite (the Sierra Nevada, not Washington; the Park Service\'s page text, through a summary): quick and nervous, flies out beyond the foliage in a semicircle after insects, the white tail patches clear when it is spread; keeps mainly to conifers, foraging from 10 to 50 feet or more above the ground, mostly on the outer foliage',
    A: 'Audubon field guide, Yellow-rumped Warbler (through a summary): searches among twigs and leaves, and will hover while taking insects from the foliage',
  },
  lengths: [
    ['wing', 'Wing, folded', 77.3, [75, 81], 'R'],
    ['tail', 'Tail (the least value unconfirmed: 53 or 58)', 58.3, [53, 61.5], 'R'],
    ['culmen', 'Exposed culmen', 10.5, [10, 11], 'R'],
    ['tarsus', 'Tarsus', 20.5, [18, 22], 'R'],
    ['midToe', 'Middle toe (whether with its claw is not said)', 12.5, [11.5, 14], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 130, [122, 137], 'R'],
    ['span', 'Wingspan (the species, both sexes)', null, [190, 240], 'W'],
  ],
  proportions: [
    'The tail three quarters of the wing (58.3 to 77.3: worked out from Ridgway\'s means)',
    'The tarsus a quarter of the wing and more (20.5 to 77.3)',
  ],
  mass: 'Mass about 12.5 g, 9.9 to 17.7 for the species (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]; set darker than their names read
const SLATE = [214, 11, 34], SLATE_DK = [216, 10, 20], BLACK = [220, 8, 8], WHITE = [48, 9, 84];
const LEMON = [48, 92, 44], CANARY = [51, 88, 50], FACE = [216, 8, 14], BELLY = [48, 10, 86], GREY = [214, 9, 48];

const head = (p) => p.x > 47;
const size = (p) => (p.x > 56 ? 1.8 : p.x > 47 ? 2.6 : 4.4);
// streaks run along the body: bands round it
const band = (p, n, share) => (p.a * n) % 1 < share;

export default {
  name: 'Yellow-rumped Warbler', latin: 'Setophaga coronata (Audubon\'s)', key: 'yellow-rumped-warbler', seed: 127,
  // ---- who is about on a visit, how it lives on one (life/species/index.js says what each field is) and its voices
  census: { tier: 'some', source: 'B C; migration peaks April to May', wave: true },
  // Its way (life/families/foliage.js). From what was read (G, Grinnell and Storer, in the Sierra Nevada; A; B; all
  // through a summary): it keeps mostly to conifers, on the outer foliage, gleaning twigs and leaves, and hovers
  // to take insects from the foliage; it is quick and nervous, and often flies out beyond the foliage in a loop
  // after an insect: of these birds it sallies most. Grinnell and Storer have it feeding 3 to 15 m up (10 to 50
  // feet or more): here 2 to 7 m above its tree's foot, and it sings from up to 8.5 m (the family says why). Every
  // number below is the agent's.
  way: {
    family: 'foliage', there: 0.6, gap: [40, 180],
    homeOff: 16, range: 22, apart: 40, broad: 0.25,
    low: 2, high: 7, perch: 8.5,
    hz: 19, speed: 7, stay: [6, 18], spell: [90, 300],
    flush: 3, startle: 6, near: 0.8, gone: 0.15,
    hop: [0.2, 0.9], hops: 4, hang: 0.01, hover: 0.06, sally: 0.17, reach: [2, 5], flick: 0,
    doing: { look: 'on a bough, looking about', hop: 'hopping along a bough', peck: 'picking at the twigs', hang: 'hanging under a twig, picking at it', hover: 'hovering at the tip of a bough, picking at it' },
    call: { every: [5, 14], time: 0.12, rate: 8, reach: 25, doing: 'calling: a sharp "chek"' },
    song: { every: [10, 24], up: 0.3, bout: [3, 6], gap: [7, 14], time: 1.7, rate: 7, reach: 60, doing: 'singing: a loose, run-together trill' },
  },
  voices: {
    song: { file: 'yrwa-song.mp3', level: 0.35, near: 4,
      credit: { what: "Yellow-rumped Warbler, song (the interior form, Audubon's Warbler)", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2015", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-audubonswarbler.htm', bytes: 1041509, kept: 1.7 } },
    call: { silent: true },   // no call was cut
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 13 cm long and 12 g: a small warbler.',
    marks: ['A yellow patch on the crown, the rump and each side of the breast, and a yellow throat', 'Grey and black above, white below with black streaks on the flanks', 'A large white patch on the wing', 'White spots in the tail that show as it flies'],
    lives: 'Conifers, often high in them. It gleans insects from the twigs and flits out after them in short loops; its call is a sharp "chek", and its song a soft, run-together warble.',
  },
  plate: { wide: 0.36, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 61.2
    top:    [[-10.6, 2.1], [-3.3, 5.8], [6.6, 10.1], [17.9, 13.2], [29.1, 14.3], [38.4, 13.9], [44.5, 12.8], [49.5, 13.6], [54.6, 13.4], [58.2, 11.0], [60.3, 7.2], [61.2, 4.2]],
    bottom: [[-12.6, -1.0], [-4.5, -5.8], [5.6, -11.0], [17.0, -14.7], [28.1, -15.4], [37.1, -13.6], [45.0, -9.4], [51.8, -5.6], [57.0, -2.0], [61.2, 1.4]],
    half:   [[-12.6, 2.3], [-4.5, 6.6], [5.6, 11.0], [17.0, 13.4], [28.1, 14.0], [37.1, 12.0], [44.0, 10.0], [49.5, 9.6], [54.6, 8.4], [58.6, 5.0], [61.2, 1.3]],
    widest: 0.46,
    neck: [40, 51],
    eye: { x: 53.4, y: 6.2, r: 1.5 },
    bill: { culmen: 10.5, drop: 0.04, gape: 1.6 },
    wing: {
      chord: 77.3, wrist: [42, -2], aim: [-76, 6],
      up:   [[0, 2.2], [0.12, 8.5], [0.3, 10.4], [0.5, 9], [0.72, 5.7], [0.9, 2.6], [1, 0.7]],
      down: [[0, 1.6], [0.12, 4.9], [0.3, 6.9], [0.5, 7], [0.72, 5.2], [0.9, 2.9], [1, 0.7]],
      rest: 2.2, proud: 1.1,
      span: 215, shoulder: [39.5, 6.9, 10.4], arm: 30, lead: 6.5, sweep: 14, root: 53, tipChord: 20,
    },
    // nearly even, a little rounded (Ridgway's genus: "emarginate, even, double-rounded or slightly rounded")
    tail: { length: 58.3, root: 1, rootHalf: 2.4, feathers: 12, width: 6.5, closed: 0.035, graded: -1, point: 0.6, droop: 0.03, tent: 4 },
    leg: { knee: [26, -8.5, 6], shin: 13, tarsus: 20.5, thick: [2.8, 1.1, 0.7], toes: { mid: 12.5, side: 9.4, hind: 9, claw: 4, hindClaw: 5 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.3, lift: 0.38, head: { pitch: 0.06 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                              // median breast, belly, under tail coverts white (R)
      { where: (p) => p.a > 0.2 && p.a < 0.56 && p.x < 40 && p.x > 3, colour: BELLY, size: 4 },
      { where: (p) => p.a > 0.2 && p.a < 0.52 && p.x < 42 && p.x > 8 && band(p, 22, 0.5), colour: BLACK, size: 4.4 },   // black over the sides and flanks in broad streaks (R)
      { where: (p) => p.a > 0.34 && p.a < 0.58 && p.x >= 30 && p.x < 49, colour: BLACK, size: 3 },          // sides of the breast black, joined to the chest (R)
      { where: (p) => p.a > 0.42 && p.a < 0.58 && p.x >= 37.5 && p.x < 46.5, colour: LEMON, size: 3 },      // a large yellow patch each side of the breast, outside the black, in front of the bend of the wing (R; where, the agent's)
      { where: (p) => p.a <= 0.4 && p.x >= 34 && p.x < 50.5, colour: [220, 6, 16], size: 2.8 },               // chest black or black mixed with gray (R)
      { where: (p) => p.a >= 0.58 && p.x <= 40, colour: SLATE, size },                                      // back bluish slate-gray (R)
      { where: (p) => p.a >= 0.62 && p.x > 6 && p.x <= 38 && band(p, 40, 0.34), colour: BLACK, size: 5 },   // streaked black, broadest on back and scapulars (R)
      { where: (p) => p.a >= 0.58 && p.x <= 6, colour: SLATE, size: 4 },
      { where: (p) => p.a >= 0.66 && p.x <= 2 && band(p, 26, 0.5), colour: BLACK, size: 4 },                // wedge-shaped spots on the upper tail coverts (R)
      { where: (p) => p.a >= 0.55 && p.x > 3 && p.x < 14 && Math.abs(p.a - 1) < 0.26, colour: CANARY, size: 3.6 },   // a triangular patch of lighter canary yellow on the lower rump (R)
      { where: (p) => p.a >= 0.58 && p.x > 38 && p.x <= 48, colour: SLATE, size: 2.6 },                      // nape and hindneck, not streaked (R)
      // the head
      { where: (p) => head(p) && p.a >= 0.3 && p.a < 0.72, colour: SLATE, size: 1.8 },                       // sides of the head slate-gray like the back (R)
      { where: (p) => head(p) && p.a >= 0.72, colour: SLATE, size: 1.8 },                                    // crown
      { where: (p) => p.x > 56.5 && p.a >= 0.5 && p.a < 0.74, colour: FACE, size: 1.5 },                     // darker, nearly black, on the lores (R)
      { where: (p) => p.x > 50 && p.x <= 56 && p.a >= 0.42 && p.a < 0.56 && p.y < 5.2, colour: [216, 8, 22], size: 1.5 },   // and below the eye (R)
      // the two eyelids' spots, close round the eye and broken before and behind it (B: "broken white eye-rings")
      { where: (p) => p.a >= 0.5 && p.a < 0.8 && p.y > 6.9 && Math.abs(p.x - 53.4) < 1.9 && Math.hypot(p.x - 53.4, p.y - 6.2) > 1.55 && Math.hypot(p.x - 53.4, p.y - 6.2) < 2.45, colour: WHITE, size: 1 },   // a white spot on the upper eyelid, small (R)
      { where: (p) => p.a >= 0.4 && p.a < 0.75 && p.y < 5.5 && Math.abs(p.x - 53.4) < 2.3 && Math.hypot(p.x - 53.4, p.y - 6.2) > 1.55 && Math.hypot(p.x - 53.4, p.y - 6.2) < 2.9, colour: WHITE, size: 1.1 },  // a larger one on the lower (R)
      { where: (p) => p.x > 45.5 && p.x <= 56 && p.a >= 0.88, colour: LEMON, size: 1.8 },                    // a central elongated patch of rich lemon yellow on the crown, the forehead slate (R)
      { where: (p) => p.x >= 49 && p.a < 0.32, colour: LEMON, size: 2 },                                     // chin and throat bright lemon yellow, the cheek slate beside it (R)
      { where: (p) => p.x > 58.6 && p.a >= 0.2 && p.a < 0.34, colour: [48, 70, 44], size: 1.4 },
    ],
    wing: {
      web: BLACK, edge: GREY, tertial: BLACK, covert: BLACK, lesser: SLATE_DK, lesserEdge: SLATE,           // wings black (R)
      medianTip: [WHITE, 0.62], greaterTip: [WHITE, 0.5],                                                  // middle and greater coverts very broadly tipped with white: one large patch (R)
      greaterBars: [[0.15, 0.95, WHITE, 'edge']],                                                          // the greater also broadly edged with it (R)
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.2, 0.95, [214, 8, 66], 'edge']],                                  // the flight feathers narrowly edged with gray, broader on the tertials (R)
      under: [214, 6, 58], underCovert: [214, 5, 72], underCovertTip: null, underBars: [],                  // under the wing: not described in what was read; pale grey here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 7, greaterEnd: 0.46, median: 6, medianEnd: 0.3 },
      spread: { primaries: 9, secondaries: 6, shape: [0.58, 0.84, 0.96, 1, 1, 1, 1, 0.98, 0.96] },
    },
    // tail black with bluish gray edgings; a large white subterminal patch on the inner webs of the four or five outermost feathers, smaller inwards (R)
    tail: { web: BLACK, edge: [214, 10, 32], under: [214, 6, 34], point: 0.4, tip: [[5, WHITE, 0.34], [4, WHITE, 0.3], [3, WHITE, 0.26], [2, WHITE, 0.2], [1, WHITE, 0.12]] },
    bill: { upper: [220, 6, 8], lower: [220, 6, 10] },                                                     // bill black (R)
    mouth: [8, 45, 48],
    eye: { iris: [22, 40, 14], pupil: [240, 15, 4] },                                                       // iris brown (R)
    leg: [24, 24, 14],                                                                                      // dark brown or brownish black (R)
    shin: [24, 20, 20],
  },
};
