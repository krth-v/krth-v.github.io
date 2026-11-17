// Rufous Hummingbird, Selasphorus rufus: the adult male in spring (definitive basic plumage). The female is
// green above with a pale rufous flank and no scarlet throat, and is not built.
//
// What is published and what is not. The lengths under `published` are Ridgway's for 18 adult male skins
// (1911, p. 612), read by this agent in the archive.org full-text character recognition of the scan ("length
// (skins), 73-91 (84); wing, 38-41.5 (40.3); tail, 26-29 (27.9); exposed culmen, 15-17.5 (16.5)", the footnote
// reading "Eighteen specimens"): the same line the research file had. Ridgway gives no tarsus or toe for it, so
// none is published here, and the feet are the agent's drawing. The bird is built to the means;
// life/measure.js measures the built bird against them. The colours follow his description tract by tract.
// Not found in what was read, and so the agent's: the outline of head and body, how far the wings pass the
// tail (they fall 8 mm short of it as drawn), the notch in the middle pair of feathers (not built), the shape
// of the spread wing and every number of the legs. The wingspan is Wikipedia's single figure, 11 cm, which the
// research agent thought low beside a folded wing of 40 mm; it is built as given.
//
// Iridescence is not built. The gorget is "brilliant metallic scarlet, changing to golden green" with the angle
// of the light (Ridgway); the paint is one sheet with no gloss that moves, so the gorget is laid as scarlet
// feathers edged with a gold, which gives it a glitter and no change of colour. A change of colour with the
// angle would need a shader of its own for this bird's skin.

const R = 'Ridgway 1911, The Birds of North and Middle America, Part V (U.S. National Museum Bulletin 50), Selasphorus rufus, p. 612';

export const published = {
  shown: 'adult male, spring (the female has no scarlet throat)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (pileum dull metallic bronze or bronze-green; the rest of the upper parts, the face included, and most of the tail plain cinnamon-rufous, the back sometimes glossed with bronze-green; each tail feather with a terminal, spindle-shaped area of purplish or bronzy dusky; flight feathers dark brownish slate or dusky, faintly glossed with purplish; chin and throat brilliant metallic scarlet, the gorget elongated at the sides; chest white, passing through cinnamon-buff into cinnamon-rufous on the rest of the underparts, paler along the middle; under tail coverts whitish at the base; femoral tufts white). Not found, and the agent\'s: the outline, the stance, the legs and feet, the span\'s shape and that the throat is not iridescent here.',
  sources: {
    R: `${R}: 18 adult males, museum skins (the female: wing 43-45, tail 24.5-28, culmen 17-19)`,
    W: 'Wikipedia, "Rufous hummingbird" (read for the research file, 2026-11-16): 7 to 9 cm long, spans 11 cm, 2 to 5 g; a long, straight, slender bill',
    B: 'Birds of the World (Healy and Calder 2020), as quoted in the research file and not opened again: 52 wingbeats a second hovering at a feeder in the laboratory, 62 at the greatest load (Chai and Millard 1997); wing hum 35 to 100 Hz; stroke amplitude 163 degrees hovering; the male\'s outer primary narrow and curved; short wings, small feet "unsuited for walking or hopping"',
    S: 'Seattle Audubon, BirdWeb, Rufous Hummingbird: "except for their white chests and short green wings, males are rufous all over"; common in May on the Pacific Northwest Coast; feeds on red flowering currant and salmonberry',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 40.3, [38, 41.5], 'R'],
    ['tail', 'Tail', 27.9, [26, 29], 'R'],
    ['culmen', 'Exposed culmen', 16.5, [15, 17.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 84, [73, 91], 'R'],
    ['span', 'Wingspan (both sexes, one secondary source)', 110, [110, 110], 'W'],
  ],
  proportions: [
    'The wing about 2.4 times the bill (40.3 to 16.5: Ridgway\'s means; his genus rule has the wing "about three times as long" as the bill)',
    'The tail about two thirds of the wing (27.9 to 40.3), rounded, the middle feathers longest',
    'The feet tiny and the legs short (the agent\'s)',
  ],
  mass: '2 to 5 g (W); on spring migration 2.8 to 4.6 g, mean 3.3 (B)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]. (2026-11-16, the second round: laid darker than their
// names read, as the jay's blues and the chickadee's chestnut were. Lit on the plate, "cinnamon-rufous" at a lightness of
// 38 came out peach, the scarlet gorget with gold edges as pale salmon speckle, and the "dull bronze-green" crown as a
// leaf's green.)
const RUFOUS = [18, 80, 26], PALE = [23, 62, 40], BUFF = [30, 52, 56], WHITE = [40, 10, 86], BRONZE = [62, 30, 21];
// the gorget: a deep orange-scarlet whose small, scale-like feathers end in a narrow edge of gold-orange, which is
// what glints (the colour that changes with the angle of the light is not built: see the head of this file)
const GORGET = [5, 96, 28], GLINT = [16, 100, 40], GORGET_SHADE = [2, 90, 21];
const WING = [280, 8, 15], DUSKY = [280, 14, 15];

const size = (p) => (p.x > 30 ? 2 : 3);

export default {
  name: 'Rufous Hummingbird', latin: 'Selasphorus rufus', key: 'rufous-hummingbird', seed: 337,
  // ---- who is about on a visit (life/species/index.js says what each field is)
  // (a party of one or two: one holds a patch of flowers, and a second that comes to it is chased off. BirdWeb and
  // Birds of the World have it highly territorial, keeping its flowers from others; that the second is one of its own
  // party, about the same patch, is the agent's way of making the chase happen)
  census: { tier: 'some', party: [1, 2], source: 'B C; edges and openings' },
  // ---- how it lives on a visit (life/families/hoverer.js; the numbers are the agent's but where a source is named)
  way: {
    family: 'hoverer', there: 0.6, gap: [50, 180],
    fastest: 24,                                    // its display dive (21 m/s at the bottom of the J: the agent's)
    homeOff: 10, range: 9, apart: 34, need: 16,
    hz: 52, stroke: 163,                            // hovering (Birds of the World, after Chai and Millard 1997)
    speed: 9, dart: 7,
    spell: [45, 150],
    flush: 1.2, startle: 2.5, near: 0.85, gone: 0.12,
    sip: [0.5, 1.8], visits: [4, 11], backOff: 0.55,
    sit: [5, 25],
    hawk: { chance: 0.25, time: [0.8, 2.2], reach: [1.2, 3.5] },
    chase: { notice: [1, 5], time: [1.2, 2.6], speed: 11, away: 0.3 },
    // Myers et al. 2019: dives "~20 m high, 15 m wide", "an average of 4 consecutive dives in a bout"; a shuttle and
    // half pendulum before them, sometimes
    display: { chance: 0.45, every: [50, 160], high: [17, 21], wide: 15, dives: [2, 6], shuttle: 0.5, climb: 7, peak: 21 },
    hum: { reach: 7, every: 0.9 }, dive: { reach: 70 }, call: { every: [15, 45], reach: 25 },
    watching: 'perched on a bare twig at the top of a shrub, watching over its flowers',
  },
  // What it says (life/families/hoverer.js says when). Its chips are silent: the one recording with a licence that
  // could be used is slowed five times (<par>/VOICES.js). The hum of its wings and its dive's note are made in the page
  // (sound/hummingbird.js).
  voices: {
    call: { silent: true },
    hum: { synth: 'hummingbird-hum', level: 0.32, near: 1.8 },      // (sound/index.js: full strength within 1.8 m, a fifth of it at 5.7 m, none past 7)
    dive: { synth: 'hummingbird-dive', level: 0.7, near: 10 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 8 cm long and 3 g: smaller than a wren, with a bill as long as its head and a half again.',
    marks: ['Orange-rufous nearly all over, with a white chest', 'A flaming scarlet-orange throat', 'A long, straight, needle-fine black bill', 'A dull green crown'],
    lives: 'Edges and openings, where there are flowers: red flowering currant, salmonberry. It hovers at a flower and sips its nectar on a long tongue, wings beating about fifty times a second, and takes small insects on the wing. The male keeps a patch of flowers and chases other hummingbirds off it, watching over it from a bare twig. Before a female he climbs some twenty metres and dives past her in a long J, again and again, and his tail makes a buzzing note at the bottom. The female, green above, is not shown here: when he dives, she is hidden low in the thicket.',
  },
  plate: { wide: 0.2, bar: 0.01 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 39.7
    // (it ends at the bill's base as deep and as wide as the bill is: 2 mm by 2, "straight, slender, terete" (R, the
    // genus); it was 2.9 by 3, and the bill was heavy)
    top:    [[-3, 1], [2, 3.2], [10, 5], [20, 5.6], [28, 5.3], [33, 5.2], [36.5, 4.4], [38.8, 2.4], [39.7, 1.5]],
    bottom: [[-3, -1], [2, -3], [10, -4.6], [20, -5], [28, -4.4], [33, -3.4], [36.5, -2.2], [38.8, -0.8], [39.7, -0.5]],
    half:   [[-3, 1.3], [2, 3.2], [10, 4.5], [20, 4.9], [28, 4.6], [33, 4.4], [36.5, 3.4], [38.8, 1.7], [39.7, 1]],
    widest: 0.5,
    neck: [26, 34],
    eye: { x: 34, y: 1.7, r: 1.4 },
    bill: { culmen: 16.5, drop: 0.03, gape: 3 },
    wing: {
      chord: 40.3, wrist: [17, 0], aim: [-40, 2],
      // short, narrow and pointed (the agent's)
      up:   [[0, 1.5], [0.1, 4.6], [0.3, 5.2], [0.55, 4.2], [0.8, 2.4], [0.95, 1], [1, 0.4]],
      down: [[0, 1], [0.1, 2.6], [0.3, 3.4], [0.55, 2.8], [0.8, 1.6], [0.95, 0.8], [1, 0.4]],
      rest: 1.6, proud: 0.8,
      span: 110, shoulder: [27, 5, 5], arm: 12, lead: 3, sweep: 8, root: 14, tipChord: 6,
    },
    // rounded, the middle feathers the longest, the outer ones narrow (Ridgway's genus: "more or less rounded or graduated")
    tail: { length: 27.9, root: 0.6, rootHalf: 2, feathers: 10, width: 3.4, closed: 0.04, graded: 6, point: 0.5, droop: 0.01, tent: 1.5 },
    leg: { knee: [18, -3.5, 3], shin: 2.5, tarsus: 3.5, thick: [1.2, 0.7, 0.45], toes: { mid: 3.5, side: 2.8, hind: 2.8, claw: 1.6, hindClaw: 1.8 }, splay: 0.5 },
  },
  poses: {
    // upright on a twig, the tail in line with the body and the wings let down a little along its sides, their tips
    // over the tail (with the tail let down a third of a radian below the body, the folded wing stood off it like a blade)
    perched: { pitch: 0.7, lift: 0.5, droop: 0.05, head: { pitch: 0.1 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.002 }, perch: 0.002 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
    // at a flower: the body tilted up, the tail let down and fanned, the wings out. The wings beat fore and aft, level
    // with the ground (life/families/hoverer.js works out each frame's place in the stroke); here they are a third of
    // the way into the forward stroke, which with the body tilted 0.75 is a flap of -0.40 and a sweep of -0.47.
    hover: { pitch: 0.75, lift: 0.6, spread: 1, flap: -0.4, sweep: -0.47, hand: 0.05, head: { pitch: -0.1 }, tail: { pitch: -0.2, fan: 0.35 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: RUFOUS, size },                                                                 // upper parts, face and sides plain cinnamon-rufous (R)
      { where: (p) => p.a <= 0.4 && p.x < 14, colour: PALE, size },                             // paler along the middle of the underparts (R)
      { where: (p) => p.a <= 0.45 && p.x >= 14 && p.x < 20, colour: BUFF, size },               // chest white, passing through cinnamon-buff behind (R)
      { where: (p) => p.a <= 0.45 && p.x >= 20 && p.x < 28, colour: WHITE, size },
      { where: (p) => p.a <= 0.5 && p.x < 3, colour: [38, 20, 76], size },                       // under tail coverts whitish at the base (R)
      { where: (p) => p.x >= 30 && p.a > 0.72, colour: BRONZE, size },                           // pileum dull metallic bronze or bronze-green (R)
      // Chin and throat brilliant metallic scarlet (R), up to the gape and no higher at the bill (the lores are rufous,
      // R), and elongated laterally (R) back under the auriculars, below the eye (it first reached the eye's rim). A
      // scale in three, by where it lies, is a deeper red: lit feathers and feathers turned from the light, side by
      // side, which is how a gorget glitters in a still (the agent's, standing in for the change of colour, not built).
      { where: (p) => p.x >= 27 && p.a <= 0.44, colour: GORGET, edge: GLINT, fringe: 0.1, size: 1.6 },
      { where: (p) => p.x >= 28 && p.x < 34 && p.a > 0.44 && p.a <= 0.5, colour: GORGET, edge: GLINT, fringe: 0.1, size: 1.6 },
      { where: (p) => (p.x >= 27 && p.a <= 0.44) || (p.x >= 28 && p.x < 34 && p.a <= 0.5) ? ((Math.sin(p.x * 12.9898 + p.a * 78.233) * 43758.5453) % 1 + 1) % 1 < 0.33 : false,
        colour: GORGET_SHADE, edge: GLINT, fringe: 0.08, size: 1.6 },
    ],
    wing: {
      web: WING, edge: [280, 8, 21], tertial: WING, covert: WING, lesser: WING, lesserEdge: [280, 8, 21],    // flight feathers dark brownish slate, faintly glossed with purplish (R)
      medianTip: null, greaterTip: null,
      patchSkip: 0,
      primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [],
      under: [280, 6, 22], underCovert: [280, 6, 26], underCovertTip: null, underBars: [],      // (under the wing: not described in what was read)
      fold: { primaries: 9, secondaries: 6, secondaryEnd: 0.5, greater: 6, greaterEnd: 0.3, median: 5, medianEnd: 0.2 },
      spread: { primaries: 9, secondaries: 6, shape: [0.58, 0.82, 0.95, 1, 1, 1, 0.99, 0.97, 0.95] },
    },
    // mostly plain cinnamon-rufous, each feather ending in a spindle-shaped area of purplish dusky (R)
    tail: { web: RUFOUS, edge: [22, 60, 46], under: [22, 40, 30], point: 0.4, tip: [0, 1, 2, 3, 4, 5].map((k) => [k, DUSKY, 0.42]) },
    bill: { upper: [0, 0, 8], lower: [0, 0, 9] },
    mouth: [350, 25, 28],
    eye: { iris: [20, 30, 9], pupil: [240, 15, 5] },
    leg: [0, 0, 14],
    shin: [30, 40, 70],                                                                          // femoral tufts white (R): the feathered shin is pale
  },
};
