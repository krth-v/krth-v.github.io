// Bald Eagle, Haliaeetus leucocephalus (the northern form, washingtoniensis, the Pacific Northwest's): the adult male.
// The female is the same in colour and about a quarter larger (Wikipedia, as the research has it).
//
// What is published and what is not. The lengths under `published` are Friedmann's for 29 adult males of the
// northern form (U.S. National Museum Bulletin 50, Part XI, 1950, p. 489: Ridgway's own volumes stop short of the
// hawks), and the bird is built to their means; life/measure.js measures the built bird against them. His culmen is
// measured from the cere, and so is this one (life/parts/raptor.js). The colours follow his description of the adult
// (written for the southern form: the northern differs only in size). Bill depth and the hind claw are from two
// adult males of New York in a Journey North page that gives Bortolotti's formula for sexing eagles by them (bill
// depth 32.4 and 32.6 mm, hind claw 41.2 and 40.5 mm). Not found in what was read, and the agent's: the cere's length,
// how far the hook hangs, the outline of head and body, how the folded wing lies, the wing's shape spread beyond
// Friedmann's "fourth primary from the outside the longest", and the front claws' length.
//
// How the sources were read: Friedmann's text through the Internet Archive's character recognition, by an agent of
// the research of 2026-11-16 (.local-assets/forest/research/birds-wave2-2026-11-16.json); BirdWeb and Wikipedia
// through tools that return a page's text or a summary of it; Journey North read by this agent through such a tool.
// No page was seen as an image.

const F = 'Friedmann 1950, The Birds of North and Middle America, Part XI (U.S. National Museum Bulletin 50), p. 489, Haliaeetus leucocephalus washingtoniensis';

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above; the colours as Friedmann has them (the whole head and neck, the tail and its coverts white, often with a creamy tinge; the body and wings dark brown, from fuscous to chaetura drab, the upperparts blacker and the underparts more rufescent, the feathers narrowly edged pale, the edges broadest on the wing coverts; iris pale chrome yellow; the bare skin round the eye, the cere, the bill and the feet deep dull cadmium; the claws black), and the six outer primaries notched, the fourth from the outside the longest. Bill depth about 32.5 mm and the hind claw about 41 mm, from two adult males (Journey North). Not found in what was read, and the agent\'s: the cere\'s length (17 mm), the hook\'s drop (14 mm), the front claws (34 mm), the outline, how the folded wing lies, the wingspan as built (1,940 mm).',
  sources: {
    F: `${F}: adult males, 29 skins, Alaska to North Carolina and Arkansas`,
    B: 'Seattle Audubon, BirdWeb, Bald Eagle: dark brown body and wings, white head and tail; males 8 to 10 lb with a wingspan of 6 to 6.5 ft; soars on flat wings with strong, slow beats; takes live fish and dead salmon; stick nests in tall trees; common in May on the Pacific Northwest coast',
    W: 'Wikipedia, "Bald eagle": 70 to 102 cm long, wingspan 1.8 to 2.3 m (both sexes); females about a quarter larger',
    J: 'Journey North, Bald Eagle, male and female compared (P. Nye; Bortolotti\'s formula): bill depth and hind claw of six banded adults',
  },
  lengths: [
    ['wing', 'Wing, folded', 588.6, [570, 612], 'F'],
    ['tail', 'Tail', 309.7, [290, 322], 'F'],
    ['culmen', 'Culmen from the cere', 52.5, [49, 57], 'F'],
    ['tarsus', 'Tarsus', 99.8, [84.5, 106], 'F'],
    ['midToe', 'Middle toe without its claw', 70.4, [67, 74], 'F'],
    ['length', 'Length, bill tip to tail tip (both sexes; a secondary source)', null, [700, 1020], 'W'],
    ['span', 'Wingspan (males; a secondary source)', null, [1830, 1980], 'B'],
  ],
  proportions: [
    'Tail about half the wing (Friedmann\'s means), slightly graduated: its outer feathers shorter than its middle ones by about the bill\'s depth at the base (Friedmann)',
    'The six outer primaries notched on their inner webs, the fourth from the outside the longest, then the third, fifth and second (Friedmann): a fingered wingtip',
    'Bill deep and hooked, with a cere at its base (BirdWeb, Wikipedia); 32.5 mm deep (J)',
    'Legs bare below the feathered shin, the toes short and powerful, the hind claw the largest (BirdWeb); 41 mm (J)',
    'Folded, the wings reach nearly to the tail\'s tip (the agent\'s drawing)',
  ],
  mass: 'Mass of males 3.6 to 4.5 kg (8 to 10 lb, B); 3 to 6.3 kg for both sexes (W)',
};

// Friedmann's colours, as paint: [hue, saturation, lightness]
const WHITE = [44, 22, 91], CREAM = [42, 24, 86], FUSCOUS = [27, 16, 13], DRAB = [26, 15, 17], SEPIA = [23, 24, 17];
const EDGE = [27, 18, 22], PALE = [32, 20, 28], CADMIUM = [43, 78, 50], CHROME = [50, 70, 74];

const eye = { x: 418, y: 43, r: 8.6 };
const near = (p, d) => Math.hypot(p.x - eye.x, p.y - eye.y) < d;
const hood = (p) => p.x > 317 - 9 * Math.cos(Math.PI * p.a);           // the white of the head and neck: a little further down the throat than the nape

export default {
  name: 'Bald Eagle', latin: 'Haliaeetus leucocephalus', key: 'bald-eagle', seed: 411,
  // ---- who is about on a visit (life/species/index.js says what each is)
  census: { tier: 'some', source: 'B C; breeds along fresh water at low elevation' },
  // ---- how it lives on a visit (life/families/raptor.js, the eagle's manner). Every number is the agent's own but the
  // flying speed: it glides and flaps at 56 to 70 km/h (Wikipedia, as the research of 2026-11-16 has it), so 15.5 m/s,
  // and its pass at 19.
  way: {
    family: 'raptor', manner: 'eagle',
    // (at the river from the first on four visits in ten; away at its nest for a minute and a half to five between)
    there: 0.4, gap: [90, 300], fastest: 24,
    hz: 2.6, speed: 15.5, pulse: [5, 3], stay: [40, 150],
    // how near it lets the walker come: it flushes from a top when they are nearer than `flush` metres (further for one
    // who runs), or move suddenly within `startle`; off to another top or into the air over the river `near` of the
    // times, otherwise away out of sight, for good `gone` of those
    flush: 24, startle: 45, near: 0.7, gone: 0.2,
    call: { every: [35, 140], time: 2.9, rate: 6, reach: 400, doing: 'calling: a high, weak, chittering whistle' },
    river: {
      water: 40, edge: 22, top: [16, 48],           // its tops: no further than this from the water (the first trees back from it within `edge`), and this tall (m)
      reach: [100, 560],                            // the stretch of the river it keeps to, in metres down it (the beach is at 430)
      soar: [40, 120], high: [45, 100], rise: [20, 60], climb: 0.9, soarSpeed: 12, radius: [35, 65], wander: 120,
      cruise: [100, 240], low: [6, 18],
      pass: [360, 520], dive: 19,
      away: 16,
      next: { soar: 0.3, cruise: 0.22, pass: 0.18, move: 0.15, leave: 0.15 },
    },
  },
  voices: {
    call: { file: 'eagle-call.mp3', level: 0.8, near: 25,
      credit: { what: 'Bald Eagle, chittering call', by: 'NPS & MSU Acoustic Atlas / Jennifer Jerrett, Yellowstone National Park sound library, 12 Sep 2016', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://commons.wikimedia.org/wiki/File:Yellowstone_sound_library_-_Bald_Eagle_-_002.mp3', source: 'https://commons.wikimedia.org/wiki/File:Yellowstone_sound_library_-_Bald_Eagle_-_002.mp3', bytes: 1950150, kept: 2.9 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 80 cm long, its wings about 2 m across: the largest bird of the valley.',
    marks: ['A white head and tail', 'A dark brown body and wings', 'A great hooked yellow bill, and yellow feet', 'Soaring, it holds its long, broad wings out flat'],
    lives: 'Rivers with tall trees to perch in over the water. It takes fish from the river, swooping low with its feet thrust forward, and eats dead salmon on the bars; it soars on flat wings and flies with strong, slow beats. In May a pair is at its nest of sticks in a tall tree, somewhere along the river, with young to feed.',
  },
  plate: { wide: 4.2, bar: 0.5 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base (where the feathers end) at 450
    top:    [[-75, 6], [-45, 20], [0, 40], [55, 60], [115, 74], [185, 82], [240, 80], [282, 72], [312, 64], [338, 62], [362, 66], [388, 68], [410, 65], [428, 57], [441, 47.5], [450, 38]],
    bottom: [[-85, -4], [-55, -20], [-12, -48], [50, -82], [120, -102], [190, -100], [240, -86], [280, -63], [308, -45], [336, -32], [366, -23], [396, -15], [422, -8], [440, -3], [450, 0]],
    half:   [[-85, 10], [-55, 28], [-12, 52], [50, 80], [120, 94], [190, 92], [240, 80], [280, 63], [308, 53], [336, 49], [366, 51], [396, 48], [422, 38], [440, 25], [450, 12]],
    widest: 0.46,
    neck: [296, 338],
    eye,
    // the hook and the cere: life/parts/raptor.js. The bill's depth at the cere's front edge comes out at about 33 mm.
    bill: { culmen: 52.5, drop: 0, gape: 38, hook: { drop: 12, from: 0.6 }, cere: { long: 17 } },
    wing: {
      chord: 588.6, wrist: [300, 12], aim: [-580, -46],
      up:   [[0, 24], [0.1, 62], [0.25, 88], [0.45, 80], [0.7, 46], [0.88, 18], [1, 3]],
      down: [[0, 14], [0.1, 38], [0.25, 54], [0.45, 54], [0.7, 38], [0.88, 18], [1, 3]],
      rest: 15, proud: 9,
      span: 1940, shoulder: [296, 40, 56], arm: 375, lead: 60, sweep: 120, root: 470, tipChord: 300,
    },
    tail: { length: 309.7, root: 0, rootHalf: 32, feathers: 12, width: 48, closed: 0.05, graded: 26, point: 0.45, droop: 0.02, tent: 22 },
    leg: { knee: [150, -52, 48], shin: 140, tarsus: 99.8, thick: [44, 24, 10], toes: { mid: 70.4, side: 56, hind: 44, claw: 34, hindClaw: 41 }, splay: 0.42,
      talons: { claw: 11, curve: 2.0 } },
  },
  poses: {
    perched: { pitch: 1.05, lift: 0.84, lean: 0.01, droop: 0.04, head: { pitch: -0.05 }, tail: { pitch: -0.15, fan: 0.03 }, feet: { mode: 'grip', round: 0.05 }, perch: 0.05 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: -0.03, tail: { fan: 0.35 }, feet: { mode: 'tuck' } },
    soar: { pitch: 0.04, lift: 0.6, spread: 1, flap: 0.09, hand: -0.05, tail: { fan: 0.45 }, feet: { mode: 'tuck' } },
    stand: { pitch: 0.55, lift: 0.8, head: { pitch: -0.3 }, tail: { pitch: -0.15, fan: 0.02 }, feet: { mode: 'flat' } },
  },
  plumage: {
    body: [
      { colour: SEPIA, edge: EDGE, fringe: 0.04, size: 34 },                                   // breast, belly, sides dusky sepia, more rufescent than the back, narrowly edged (F)
      { where: (p) => p.a >= 0.45, colour: FUSCOUS, edge: EDGE, fringe: 0.05, size: 38 },     // back and scapulars fuscous to fuscous-black, edged fulvous to hair brown (F)
      { where: (p) => p.a >= 0.45 && p.x < 120, colour: DRAB, edge: EDGE, fringe: 0.05, size: 32 },   // rump chaetura drab (F)
      { where: (p) => p.x < 34 && (p.a < 0.33 || p.a > 0.72), colour: WHITE, size: 26 },     // upper and under tail coverts white (F)
      { where: hood, colour: WHITE, size: (p) => (p.x > 380 ? 13 : 19) },                      // the whole head and neck white (F)
      { where: (p) => hood(p) && p.x > 438, colour: CREAM, size: 7 },                           // the bristles at the cere, creamy
      { where: (p) => near(p, eye.r + 2.6) && !near(p, eye.r - 1), colour: CADMIUM, size: 3 },  // the bare skin round the eye deep dull cadmium (F)
    ],
    wing: {
      web: FUSCOUS, edge: [27, 16, 16], tertial: [26, 17, 15], covert: DRAB, lesser: [27, 18, 21], lesserEdge: PALE,        // coverts edged palest and broadest (F)
      medianTip: [PALE, 0.12], greaterTip: null, tertialTip: null,
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      under: [24, 14, 14], underCovert: SEPIA, underCovertTip: null, underBars: [],                        // under wing coverts dark brownish (F)
      fold: { primaries: 7, secondaries: 7, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.26, feather: 3 },
      spread: { primaries: 10, secondaries: 10, shape: [0.72, 0.86, 0.96, 1, 0.99, 0.96, 0.93, 0.91, 0.9] },          // the fourth from the outside the longest (F)
    },
    tail: { web: WHITE, edge: [44, 18, 88], under: [44, 16, 84], point: 0.4 },                 // tail white (F)
    bill: { upper: CADMIUM, lower: [43, 72, 54], cere: [42, 70, 47] },                         // cere and bill deep dull cadmium (F)
    claw: [30, 8, 8],                                                                           // claws black (F)
    mouth: [355, 28, 46], eye: { iris: CHROME, pupil: [240, 15, 5] },                          // iris pale chrome yellow (F)
    leg: CADMIUM,                                                                               // feet deep dull cadmium (F)
    shin: SEPIA,
  },
};
