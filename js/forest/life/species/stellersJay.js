// Steller's Jay, Cyanocitta stelleri stelleri: the adult of the coast. The sexes are alike (Ridgway: the
// female "often hard to tell apart", a little smaller, her bars fainter).
//
// What is published and what is not. The lengths under `published` are Ridgway's for twelve adult males of
// the coastal form, and the bird is built to their means; life/measure.js measures the built bird against
// them. The colours follow his description tract by tract. The outline of head and body, where the eye sits,
// how the folded wing lies, how long the crest is and how it is carried, and the wingspan are in nothing
// that was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, each through a tool that returns a
// summary of the scan's character recognition. No page was seen as an image. The tail's least value was
// printed as "183" and is read as 133; a mean culmen of 31 against a greatest of 32 is what the text has.

const R = 'Ridgway 1904, The Birds of North and Middle America, Part III (U.S. National Museum Bulletin 50), Cyanocitta stelleri stelleri, p. 352';

export const published = {
  shown: 'adult, spring (the sexes alike)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (head, neck and chest sooty black, the forehead streaked with blue, the chin with pale grey; back dark sooty brown; rump and underparts blue, the upper tail coverts brighter; wings and tail blue, the inner secondaries and the tail barred with black; bill, legs and feet black; iris brown). Not found in what was read, and the agent\'s: the wingspan (built at 440 mm), the crest\'s length and how it is carried, how far down the breast the black goes and how it turns to blue, how many bars there are, the outline. Whether the middle toe was measured with its claw is not said; it is built without.',
  sources: {
    R: `${R}: 12 adult males, museum skins, Puget Sound to Cook Inlet`,
    W: 'Wikipedia, "Steller\'s jay" (read 2026-11-16): about 30 to 34 cm long, 100 to 140 g; the crest "more pronounced" in northern birds',
    B: 'Seattle Audubon, BirdWeb, Steller\'s Jay: pairs in the nesting season, quiet near the nest; forages in trees and on the ground; bold round people',
    A: 'Audubon Field Guide, Steller\'s Jay: its food, its harsh "shack" calls',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 151.5, [144, 160.5], 'R'],
    ['tail', 'Tail', 138.6, [133, 150], 'R'],
    ['culmen', 'Exposed culmen', 31, [27.5, 32], 'R'],
    ['tarsus', 'Tarsus', 46.5, [44.5, 50.5], 'R'],
    ['midToe', 'Middle toe', 24.7, [22.5, 26], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 300.2, [282, 317], 'R'],
  ],
  proportions: [
    'The tail a little shorter than the wing (138.6 to 151.5: worked out from Ridgway\'s means)',
    'The tarsus long: nearly a third of the wing',
    'Ridgway\'s text for the genus, as it was read, says only "small garrulines with a conspicuous crest": nothing on the tail\'s shape, the wing\'s tip or the toes',
  ],
  mass: 'Mass 100-140 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
// (darker than the names read: laid as light as "cerulean" and "china blue" sound, the bird was sky blue, which
// no Steller's Jay is)
const SOOT = [225, 10, 11], BACK = [24, 7, 12.5], BLUE = [210, 58, 29], BRIGHT = [207, 66, 35];
const DUSK1 = [220, 20, 15], DUSK2 = [214, 40, 22], SLATE = [216, 22, 18];
const COBALT = [224, 60, 25], CERULEAN = [213, 62, 28], BAR = [226, 22, 8], FAINT = [224, 34, 14];

// feathers are small on the head and grow down the neck
const size = (p) => (p.x > 108 ? 4.4 : p.x > 96 ? 6.5 : 10);
// six narrow bars across a feather, from `from` to `to` of its length
const bars = (from, to, colour, thick = 0.026) => Array.from({ length: 6 }, (_, k) => { const t = from + (to - from) * (k / 5); return [t, t + thick, colour, 'both']; });

export default {
  name: 'Steller\'s Jay', latin: 'Cyanocitta stelleri', key: 'stellers-jay', seed: 47,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'most', source: 'B C; P regular; quiet while nesting', mean: 1.4 },
  way: {
    // (where its home is: its family's, life/families/corvid.js, which says what each number is; every one of them is
    // the agent's)
    family: 'corvid', there: 0.55, gap: [50, 240],
    hz: 7.5, speed: 9.5,
    // It is bold: put up within 3 m of a walker at a stroll (3.8 at a walk, 5.7 at a run), or by a sudden movement of
    // theirs within 7; then to a post further from them, scolding, more often than off out of sight.
    flush: 3, startle: 7, near: 0.75, gone: 0.3,
    sit: [5, 17], feed: [9, 29], down: 0.42, move: 0.38, carry: 0.45,
    call: { every: [14, 54], time: 3.3, reach: 160 },
  },
  voices: {
    shack: { file: 'jay.mp3', level: 0.8, near: 9,
      credit: { what: 'Steller\'s Jay, call', by: 'J. Job, U.S. National Park Service (Rocky Mountain National Park sound library), 2015', licence: 'Public domain',
        source: 'https://www.nps.gov/nps-audiovideo/legacy/mp3/imr/avElement/romo-STJAROMO6232015GreenMountainTrail.mp3', bytes: 487866, kept: 3.45 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 30 cm long, nearly half of it tail, and 100 to 140 g: larger than a robin, smaller than a crow.',
    marks: ['A tall black crest', 'Head and shoulders sooty black, turning to blue on the belly and the rump', 'Wings and tail deep blue, finely barred with black', 'Thin pale blue streaks on the forehead'],
    lives: 'Conifer forest, from the floor to the crowns. In spring it goes about alone or in a pair, hopping over the ground and from limb to limb after seeds, insects, berries, eggs and whatever a camp leaves. Bold and loud, but quiet near its nest.',
  },
  plate: { wide: 0.8, bar: 0.05 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 132
    top:    [[-34, 3], [-14, 9], [9, 16], [32, 22.5], [56, 26], [78, 27], [94, 25.5], [102, 25], [109, 27.8], [115.5, 30.6], [121.5, 30.4], [126.8, 26.2], [130.4, 19.4], [132, 12.3]],
    bottom: [[-42, -1.5], [-20, -8.5], [0, -16.5], [19, -27.5], [41, -35.5], [60, -38.5], [78, -36.5], [93, -30.5], [102, -22.5], [112, -13.5], [119.5, -7.3], [126, -2.8], [132, 0.6]],
    half:   [[-42, 5.2], [-21, 10.5], [0, 18.5], [21.5, 26], [43, 30.5], [62.5, 31.5], [82, 29.5], [97, 22.5], [105.5, 18], [114, 17.2], [120.5, 16.6], [126, 12.8], [130.3, 7.8], [132, 5.3]],
    widest: 0.46,
    neck: [98, 112],
    eye: { x: 120.5, y: 13.2, r: 3.6 },
    bill: { culmen: 31, drop: 0.07, gape: 5 },
    // The crest: blades of long feathers that stand up and back from the crown, the hindmost the longest. Each
    // is [where on the crown it is rooted (x), its length, how far back from upright it leans (radians), its
    // half-depth and half-width at the root, how much further back its tip sweeps]. Carried half raised, as a
    // jay going about has it: it has no bone of its own. Every number of it is the agent's.
    crest: { sunk: 3, lobes: [[125.5, 22, 1.0, 5.2, 5.4, 0.2], [119.5, 34, 0.88, 6.4, 6.2, 0.22], [113, 43, 0.75, 7, 6.4, 0.26]] },
    wing: {
      chord: 151.5, wrist: [93, -4], aim: [-150, 12],
      // short and round for the bird's size: the secondaries end about three quarters of the way along it (the agent's)
      up:   [[0, 5], [0.12, 21], [0.3, 25], [0.5, 21], [0.74, 12], [0.9, 5], [1, 1]],
      down: [[0, 3.5], [0.12, 10.5], [0.3, 15.5], [0.5, 16], [0.74, 12.5], [0.9, 6.5], [1, 1]],
      rest: 4.5, proud: 2.5,
      span: 440, shoulder: [90, 14, 21], arm: 60, lead: 14, sweep: 34, root: 118, tipChord: 50,
    },
    tail: { length: 138.6, root: 1.6, rootHalf: 5, feathers: 12, width: 21, closed: 0.034, graded: 16, point: 0.85, droop: 0.012, tent: 12 },
    leg: { knee: [56, -22, 12], shin: 34, tarsus: 46.5, thick: [8, 3.6, 2.1], toes: { mid: 24.7, side: 18.5, hind: 16, claw: 8.5, hindClaw: 10.5 }, splay: 0.5 },
  },
  // Poses the contact sheet shows, and the forest's behaviours start from (life/rig.js says what each number is).
  poses: {
    perched: { pitch: 0.36, lift: 0.5, head: { pitch: 0.04 }, tail: { pitch: -0.08 }, feet: { mode: 'grip', round: 0.02 }, perch: 0.02 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.34 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BLUE, size },                                                                   // rump and underparts blue, from greenish "china" blue (R)
      { where: (p) => p.a > 0.55 && p.x < 9, colour: BRIGHT, size: 10 },                        // upper tail coverts like the rump but brighter, nearly cerulean (R)
      { where: (p) => p.a > 0.58 && p.x >= 26, colour: BACK, size },                            // back and scapulars plain dark sooty brown (R)
      { where: (p) => p.a > 0.58 && p.x >= 26 && p.x < 39, colour: SLATE, size },               // (how the back turns to the rump's blue: the agent's)
      { where: (p) => p.a <= 0.58 && p.x > 70 && p.x <= 79, colour: DUSK2, size },              // (how the chest's black turns to the belly's blue: the agent's)
      { where: (p) => p.a <= 0.58 && p.x > 79 && p.x <= 87, colour: DUSK1, size },
      { where: (p) => p.x > 87 && (p.a <= 0.58 || p.x >= 97), colour: SOOT, size },             // head, neck and upper chest plain black or sooty black (R)
      { where: (p) => p.x > 125 && p.y > 18, colour: SOOT, shaft: [205, 58, 50], shaftWidth: 0.2, size: 3.2 },             // the forehead usually streaked with blue (R)
      { where: (p) => p.x > 118 && p.y < 3 && p.a < 0.34, colour: SOOT, shaft: [212, 8, 36], shaftWidth: 0.18, size: 3.2 },  // chin and upper throat usually streaked with pale greyish (R)
    ],
    wing: {
      web: COBALT, edge: [212, 62, 31], tertial: [223, 58, 26], covert: CERULEAN, lesser: [213, 58, 27], lesserEdge: [211, 60, 32],
      medianTip: null, greaterTip: null,
      patchSkip: 0,
      primaryBars: [[0.2, 0.96, CERULEAN, 'outer']],          // primaries dull cerulean or sevres blue (R)
      secondaryBars: bars(0.36, 0.86, BAR),                   // secondaries deep cobalt; the innermost four to six, tertials included, with sharply defined black bars (R)
      tertialBars: bars(0.3, 0.89, BAR),
      greaterBars: bars(0.3, 0.86, FAINT, 0.034),             // greater coverts usually with narrow, sometimes indistinct, black bars (R)
      tertialTip: null,
      under: [224, 12, 24], underCovert: [218, 18, 28], underCovertTip: null, underBars: [],     // under the wing: not described in what was read; dusky here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.76, greater: 8, greaterEnd: 0.42, median: 7, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 7, shape: [0.62, 0.84, 0.95, 1, 1, 1, 0.99, 0.97, 0.95] },
    },
    // dull cobalt, the terminal part usually barred black, with fainter bars toward the base (R); how many: the agent's
    tail: { web: COBALT, edge: [213, 62, 30], under: [224, 12, 20], bars: [BAR, 10, 0.011], point: 0.5 },
    bill: { upper: [220, 8, 9], lower: [220, 8, 10] },                                          // bill, legs and feet black (R)
    mouth: [350, 25, 28],
    eye: { iris: [22, 40, 13], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [220, 8, 11],
    shin: [214, 26, 24],
  },
};
