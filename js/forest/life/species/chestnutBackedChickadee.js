// Chestnut-backed Chickadee, Poecile rufescens (the northern form, with broad chestnut flanks): the adult.
// The sexes are alike.
//
// What is published and what is not. The lengths under `published` are Ridgway's for ten adult males, and the
// bird is built to their means; life/measure.js measures the built bird against them. The colours follow his
// description tract by tract, but for the cheek: his text, as it was read, puts the side of the head with the
// dark throat, and three later sources all give the bird a white cheek, which is how it is painted. The
// outline of head and body, where the eye sits and how the folded wing lies are in nothing that was read: they
// are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, each through a tool that returns a
// summary of the scan's character recognition. No page was seen as an image.

const R = 'Ridgway 1904, The Birds of North and Middle America, Part III (U.S. National Museum Bulletin 50), Penthestes rufescens rufescens';

export const published = {
  shown: 'adult (the sexes alike)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (crown and hindneck plain sepia brown; lores and behind the eye dark sooty brown; back, scapulars and rump plain chestnut; upper tail coverts brownish grey; wings and tail deep brownish grey with paler edgings, broadest on the tertials; chin, throat and upper chest dark sooty brown, sharply defined behind; the rest of the underparts white down the middle, the sides and flanks broadly chestnut; bill dusky; iris brown). The white cheek is as Wikipedia, BirdWeb and the Animal Diversity Web have it. Not found in what was read, and the agent\'s: the outline, how far down the white cheek goes. Whether the culmen is the exposed culmen, and whether the middle toe was measured with its claw, are not said.',
  sources: {
    R: `${R}: 10 adult males, museum skins`,
    A: 'Audubon Field Guide, Chestnut-backed Chickadee: wingspan 7.5 to 8.3 in; how it feeds and calls',
    W: 'Wikipedia, "Chestnut-backed chickadee" (read 2026-11-16): 11.5 to 12.5 cm, 8.5 to 12.6 g; the flank band broad in the northern form; a white cheek',
    B: 'Seattle Audubon, BirdWeb, Chestnut-backed Chickadee (read 2026-11-16, by an agent that kept only its finding): a white cheek',
    D: 'Animal Diversity Web, Poecile rufescens (read 2026-11-16, by an agent that kept only its finding): a white cheek',
  },
  lengths: [
    ['wing', 'Wing, folded', 61.2, [59.5, 64], 'R'],
    ['tail', 'Tail', 49.1, [46.5, 51.5], 'R'],
    ['culmen', 'Culmen', 9.1, [8, 10], 'R'],
    ['tarsus', 'Tarsus', 16.6, [16, 17], 'R'],
    ['midToe', 'Middle toe', 10, [9.5, 10.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 112, [107.5, 120.5], 'R'],
    ['span', 'Wingspan (one secondary source)', null, [190, 210], 'A'],
  ],
  proportions: [
    'The tail four fifths of the wing (49.1 to 61.2: worked out from Ridgway\'s means)',
    'Nothing on the shape of wing, tail or bill was found in what was read',
  ],
  mass: 'Mass 8.5-12.6 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
// (the chestnut darker than the name reads: as light as it sounds, the back was a robin's breast)
const CAP = [24, 28, 19], BIB = [22, 22, 11], CHEEK = [45, 18, 91], CHESTNUT = [14, 54, 25], WHITE = [45, 14, 89], FLANK = [16, 52, 30];
const GREY = [28, 8, 34], DUSK = [26, 8, 23];

const size = (p) => (p.x > 43 ? 2 : p.x > 37 ? 2.8 : 4.6);

export default {
  name: 'Chestnut-backed Chickadee', latin: 'Poecile rufescens', key: 'chestnut-backed-chickadee', seed: 61,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'most', source: 'B C; P regular', mean: 2, party: [2, 2] },
  way: {
    family: 'bough', there: 0.6, gap: [40, 200], together: true,
    // its pair's first tree stands within `homeOff` metres of the walk, and its boughs come low enough (`high`);
    // the trees the pair moves on to, within `off`
    homeOff: 12,
    // (`high`: no higher above its tree's foot than this. From the walk a bird on a bough higher up is looked up
    // at, and the bough's own foliage is between: the first ones, at up to eight and eleven metres, were not seen.)
    hz: 20, speed: 6.5, high: 5, off: 20, stay: [10, 30],
    // how near it lets the walker come (life/behave.js): nearer than `flush` metres (further for one who runs), or
    // a sudden movement of theirs within `startle`, and it is off, to a bough clear of them `near` of the times and
    // otherwise out of sight for a while, never for good (`gone`: 0), since it comes back to where its mate is
    // (the agent's own: chickadees are bold)
    flush: 3, startle: 7, near: 0.85, gone: 0,
    hang: 0.2, hover: 0.04, flick: 0,
    call: { every: [6, 22], time: 1.1, rate: 5, reach: 60, doing: 'calling: a thin, hoarse tsick-a-dee-dee' },
  },
  voices: {
    // (silent: no recording of it was found under a licence that could be used)
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 11 cm long and 10 g: the smallest chickadee.',
    marks: ['A dark brown cap and bib, with a white cheek between them', 'A chestnut back and chestnut flanks', 'Grey wings and tail', 'It hangs upside down from the tips of boughs'],
    lives: 'Dense, wet conifer forest, from low boughs to the crowns. It hops along twigs, hangs from their tips and sometimes hovers, picking insects and spiders from the needles, and is seldom still. In spring it goes about in pairs; its call is a thin, hoarse "tsick-a-dee-dee".',
  },
  plate: { wide: 0.38, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 54.3
    top:    [[-9, 2], [-3, 5.4], [6, 9.4], [16, 12.4], [26, 13.4], [34, 13.2], [39.5, 13], [44, 14], [48.5, 14], [51.6, 11.6], [53.5, 8], [54.3, 4.6]],
    bottom: [[-11, -1], [-4, -5.4], [5, -10.4], [15, -13.8], [25, -14.4], [33, -12.6], [40, -9.4], [46, -5.6], [50.5, -2], [54.3, 1]],
    half:   [[-11, 2.4], [-4, 6.6], [5, 10.8], [15, 13.2], [25, 13.6], [33, 12.2], [39, 10.6], [44, 10.4], [48.5, 9], [52, 5.6], [54.3, 1.8]],
    widest: 0.46,
    neck: [36, 45],
    eye: { x: 47.6, y: 6.6, r: 1.55 },
    bill: { culmen: 9.1, drop: 0.05, gape: 1.6 },
    wing: {
      chord: 61.2, wrist: [35, -2], aim: [-59, 5],
      up:   [[0, 2], [0.12, 7.8], [0.3, 9.4], [0.5, 8.2], [0.72, 5.2], [0.9, 2.4], [1, 0.6]],
      down: [[0, 1.4], [0.12, 4.4], [0.3, 6.2], [0.5, 6.4], [0.72, 4.8], [0.9, 2.6], [1, 0.6]],
      rest: 2, proud: 1.1,
      span: 200, shoulder: [33.5, 6.4, 9.4], arm: 28, lead: 6, sweep: 13, root: 48, tipChord: 20,
    },
    tail: { length: 49.1, root: 0.9, rootHalf: 2.4, feathers: 12, width: 6, closed: 0.035, graded: 4, point: 0.7, droop: 0.03, tent: 4 },
    leg: { knee: [23, -8.4, 6], shin: 12, tarsus: 16.6, thick: [2.9, 1.25, 0.74], toes: { mid: 10, side: 7.6, hind: 7.2, claw: 4, hindClaw: 5.2 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.34, lift: 0.4, head: { pitch: 0.08 }, tail: { pitch: -0.1, fan: 0.02 }, feet: { mode: 'grip', round: 0.006 }, perch: 0.006 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // underparts white, medially (R)
      { where: (p) => p.a > 0.2 && p.a < 0.58 && p.x < 35, colour: FLANK, size: 4.8 },          // sides and flanks broadly chestnut (R)
      { where: (p) => p.x <= 3 && p.a < 0.5, colour: [28, 22, 70], size: 5 },                   // under tail coverts more or less tinged with brown (R)
      { where: (p) => p.a >= 0.58 && p.x <= 39, colour: CHESTNUT, size },                       // back, scapulars and rump plain chestnut (R)
      { where: (p) => p.a >= 0.58 && p.x < 7, colour: GREY, size: 5 },                          // upper tail coverts brownish grey (R)
      { where: (p) => p.x > 35.5 && p.y <= -2.2 && p.a < 0.5, colour: BIB, size: 2.4 },         // chin, throat and upper chest uniform dark sooty brown, sharply defined behind (R)
      { where: (p) => p.x > 36.5 && p.y > -2.2 && p.y <= 5.4, colour: CHEEK, size: 2.2 },       // the cheek white (W, B, D: not in Ridgway's text as it was read)
      { where: (p) => p.x > 38 && p.y > 5.4, colour: CAP, size: 2.2 },                          // crown and hindneck plain sepia brown; lores and behind the eye darker (R)
      { where: (p) => p.x > 44.5 && p.y > 4.6 && p.y <= 7.6, colour: BIB, size: 2 },
    ],
    wing: {
      web: DUSK, edge: [30, 8, 40], tertial: [26, 8, 25], covert: [26, 10, 27], lesser: [20, 30, 28], lesserEdge: [22, 24, 34],    // wings deep brownish grey with paler grey edgings; lesser coverts tinged with chestnut (R)
      medianTip: null, greaterTip: [[34, 10, 58], 0.12],                                        // greater coverts with broader, paler edgings on the terminal part (R)
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.35, 0.95, [34, 9, 47], 'edge']],       // the edgings broader and paler, sometimes nearly white, on the tertials (R)
      under: [28, 6, 46], underCovert: [36, 8, 70], underCovertTip: null, underBars: [],        // under the wing: not described in what was read; pale grey here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.74, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: DUSK, edge: [30, 8, 38], under: [28, 6, 40], point: 0.4 },                     // tail deep brownish grey with paler grey edgings (R)
    bill: { upper: [26, 10, 14], lower: [26, 10, 17] },                                         // bill dusky (R)
    mouth: [350, 30, 40],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [215, 10, 30],                                                                         // painted dark grey: R has "dusky brownish" from skins, and asks whether greyish in life
    shin: [20, 40, 42],
  },
};
