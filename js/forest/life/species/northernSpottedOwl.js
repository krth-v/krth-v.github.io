// Northern Spotted Owl, Strix occidentalis caurina: the adult (the sexes are alike in plumage; the female is the
// larger). Ridgway's description is of the California form, occidentalis; of this one he says only "similar to
// S. o. occidentalis but decidedly darker; the brown darker in tone and greater in area, the white spotting
// correspondingly reduced; legs and feet more heavily mottled". So the pattern of each tract is his description of
// the species, painted darker and with smaller spots.
//
// What is published and what is not. The wing, tail, culmen (from the cere) and length under `published` are
// Ridgway's for the one adult male of this form he had (from Point Reyes, California): one bird, so no range. The
// span's range is the Audubon Field Guide's, for both sexes, read by one agent and not checked by a second. A
// tarsus of live males (60 mm) was read in Birds of the World's appendix, which is behind a subscription and was not
// checked; it is not used: the tarsus is built "decidedly longer than the middle toe with its claw" (Ridgway, of the
// genus), at the agent's 54 mm. The outline of head and body, the size of the face and where the eyes sit in it, how
// the folded wing lies and the toes are the agent's drawing, scaled from the Barred Owl's.
//
// How the sources were read: Ridgway's text through the Internet Archive's character recognition of the volume, read
// by one agent and checked against it by a second; BirdWeb, Birds of the World, the state's account and Wikipedia
// through a tool that returns a page's text. No page was seen as an image.
//
// Its eyes in a light (shape.eye.shine): no source read describes the eyeshine of this species. The red is the
// Barred Owl's (life/species/barredOwl.js), and is the agent's call here.
//
// It is never about on a visit a Barred Owl is about on (life/families/owl.js says why).

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Strix occidentalis caurina, p. 649-650; the species, p. 647-648';

export const published = {
  shown: 'adult (the sexes are alike)',
  note: 'Published (Ridgway, of the species): brown above, irregularly spotted with white, the spots larger and more across the feather on the outer scapulars and the outer larger wing coverts; the secondaries crossed by six or seven bands of lighter brown; quadrate spots of lighter brown on the primaries, partly white on the longest; the tail crossed by narrow bands of lighter brown, mixed with white towards its edge and end; the brows and lores greyish white, the lores with black shafts; the face behind the eye pale brown, concentrically barred with darker brown; the feathers just before and above the eye dark sooty brown; the rim of the face mostly dark brown; the middle of the throat pale brown barred with dark brown, below it white; the rest of the under parts brown, with large rounded spots of buff and white on each web; the legs pale buff, mottled with brown; the iris blackish brown; the bill yellowish (Ridgway, of the genus; Birds of the World: yellow-green). Of this form: darker, the white spots smaller, the legs more mottled. Not found, and the agent\'s: the toes, the outline, the size of the face, how far the folded wings reach.',
  sources: {
    R: `${R}: one adult male of this form (Point Reyes, California), a museum skin`,
    A: 'Audubon Field Guide, Spotted Owl: 43 to 48 cm long and about 110 to 120 cm across, both sexes (read by one agent, not checked by a second)',
    B: 'Seattle Audubon, BirdWeb, Spotted Owl: old-growth conifers near streams; rare in every month on the Pacific Northwest coast; "very tame and can be approached easily"',
    G: 'Birds of the World, Spotted Owl (Behavior, Diet, Sounds; read through a tool that returns a page\'s text): its flight, its hunting, its calls, the small birds that mob it',
  },
  lengths: [
    ['wing', 'Wing, folded (one bird)', 325, [325, 325], 'R'],
    ['tail', 'Tail (one bird)', 220, [220, 220], 'R'],
    ['culmen', 'Culmen from the cere (one bird)', 23.5, [23.5, 23.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skin; one bird)', 425, [425, 425], 'R'],
    ['span', 'Wingspan, both sexes', null, [1100, 1200], 'A'],
  ],
  proportions: [
    'A round-headed owl with no ear tufts, the head and the eyes relatively large (Ridgway, of the genus; Birds of the World)',
    'Tail about two thirds of the wing, a little rounded (Ridgway)',
    'The iris dark brown, nearly black (Ridgway; Birds of the World)',
    'Tarsus decidedly longer than the middle toe with its claw, feathered, and the toes feathered but for their last joint (Ridgway, of the genus)',
  ],
  mass: 'Live males of north-western California 579 g on average, females 663 g (Birds of the World, not checked by a second reader)',
};

// the colours, as paint: [hue, saturation, lightness]
const BROWN = [24, 34, 21], DARK = [20, 34, 13], WHITE = [36, 18, 88], BUFF = [34, 38, 72], PALE = [30, 26, 54];

export default {
  name: 'Northern Spotted Owl', latin: 'Strix occidentalis caurina', key: 'northern-spotted-owl', seed: 404,
  // ---- who is about on a visit (life/species/index.js says what each is). 'dusk': by day the few about are at roost.
  census: { tier: 'very rare', source: 'B R; P R; declining', clock: 'dusk' },
  // ---- how it lives on a visit (life/families/owl.js says what each number is). What was read (B, G): it hunts
  // from as early as an hour before sunset to just before sunrise, choosing a perch and waiting, and pounces on
  // what it sees or hears, taking it in its talons; it moves between several perches in a night; it flies with quick
  // beats and glides, from tree to tree, and seldom far; by day it roosts in dense shade, lower in the canopy in
  // summer; it is very tame; its commonest call is four hoots, "hoo, hoo-hoo, hooo", most often at sunset, early in
  // the evening and before dawn. How high it roosts and hunts, how near it lets a walker come, and every other number
  // here are the agent's own.
  way: {
    family: 'owl', there: 0.7, gap: [60, 240], ousted: true,
    hz: 3.6, speed: 6, glide: 0.5,
    flush: 2, startle: 3, near: 0.9, gone: 0.1,
    doze: 2.6, apart: 400,
    roost: { trees: ['mature', 'cedar', 'spruce'], low: 6, high: 13, off: 26, thin: 0.03 },
    hunt: { low: 3, high: 12, thin: 0.03, reach: [15, 60], wait: [20, 80], drop: 0.35, floor: [3, 12], stay: [4, 14], catch: 0.35 },
    song: { every: [45, 200], time: 2.5, reach: 400, doing: 'calling: four deep hoots, hoo, hoo-hoo, hooo', day: 0.03 },
  },
  voices: {
    // (nothing was found under a licence that could be used)
    song: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 43 to 48 cm long, wings 110 to 120 cm across: a little smaller than a Barred Owl.',
    marks: ['Dark eyes, nearly black, in a pale brown face ringed with darker brown', 'Dark brown all over, spotted with white', 'No ear tufts', 'A greenish-yellow bill'],
    lives: 'Old-growth conifer forest, near streams. By day it roosts in deep shade and lets people come close; from dusk it waits on a perch and pounces on flying squirrels, voles and woodrats. Its call is four hoots. It is rare and declining: the Barred Owl, which came west in the last century, has taken many of its territories.',
  },
  plate: { wide: 1.1, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 189. The Barred Owl's
    // outline at 0.827 of its size, the head a twenty-fifth bigger again (life/species/barredOwl.js).
    top:    [[-41.3, 1.7], [-20.7, 8.3], [0, 15.7], [24.8, 27.3], [53.8, 38.9], [82.7, 46.3], [107.5, 48.3], [119.9, 49.1], [132.3, 54.1], [144.7, 58.9], [155.5, 60.2], [165.4, 58.1], [172.8, 54.2], [177.8, 49.9], [181.1, 43], [184.4, 31], [186.9, 17.2], [188.6, 6.9]],
    bottom: [[-46.3, -3.3], [-24.8, -12.4], [0, -29.8], [28.9, -51.3], [57.9, -64.5], [82.7, -66.2], [107.5, -59.1], [122.4, -53.6], [134, -49.9], [147.2, -49.9], [158.8, -49], [168.7, -46.4], [175.3, -43], [180.3, -37.8], [184.4, -25.8], [186.9, -13.8], [188.6, -5.2]],
    half:   [[-46.3, 6.6], [-24.8, 18.2], [0, 33.1], [28.9, 52.9], [57.9, 64.5], [82.7, 66.2], [107.5, 62.4], [122.4, 57.8], [134, 55], [147.2, 57.2], [158.8, 56.3], [168.7, 53.3], [175.3, 49.9], [180.3, 44.7], [184.4, 32.7], [186.9, 18.1], [188.6, 5.6]],
    widest: 0.45,
    neck: [97.6, 138.9],
    eye: { x: 177, y: 9.5, r: 8, shine: [8, 88, 44] },
    // the face: a dish 82 mm tall and 92 across
    disc: { rim: 41, wide: 1.12, depth: 0.16, apart: 17, at: 3.4, back: 9.1, seam: 8.3 },
    bill: { culmen: 23.5, drop: 0.3, gape: 6 },
    wing: {
      chord: 325, wrist: [115.8, 3.3], aim: [-272.9, 18.2],
      up:   [[0, 11.7], [0.12, 43], [0.3, 56.6], [0.5, 48.8], [0.75, 29.3], [0.9, 13.7], [1, 2.9]],
      down: [[0, 7.8], [0.12, 29.3], [0.3, 39.1], [0.5, 37.1], [0.75, 26.4], [0.9, 12.7], [1, 2.9]],
      rest: 5, proud: 3.3,
      span: 1140, shoulder: [124, 24.8, 37.2], arm: 203, lead: 39, sweep: 34, root: 244, tipChord: 146,
    },
    // a little rounded (Ridgway)
    tail: { length: 220, root: 8.3, rootHalf: 19.8, feathers: 12, width: 42, closed: 0.04, graded: 24, point: 0.55, droop: 0.02, tent: 9.9 },
    // two toes forward, two back; the legs and the toes but their last joint feathered (Ridgway, of the genus)
    leg: { knee: [57.9, -37.2, 24.8], shin: 59.5, tarsus: 54, thick: [21.5, 9.1, 5], toes: { mid: 30, side: 25, hind: 18, claw: 19, hindClaw: 17 }, splay: 0.45, yaw: { O: 2.3 },
      feathered: { to: 'toes', full: 0.9 } },
  },
  poses: {
    perched: { pitch: 1.3, lift: 0.5, head: { pitch: 0 }, tail: { pitch: 0 }, feet: { mode: 'grip', width: 0.037, round: 0.04, toeOut: 0.3 } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.05, hand: 0.02, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BROWN, bars: [BUFF, 2, 0.1], size: 15 },                                                                // under parts brown, with rounded spots of buff and white on each web (R)
      { where: (p) => p.a < 0.25 && p.x >= 20 && p.x < 120, colour: BROWN, bars: [WHITE, 2, 0.11], size: 14 },           // (the whiter spots along the middle of the belly)
      { where: (p) => p.x < 2 && p.a < 0.4, colour: WHITE, shaft: BROWN, shaftWidth: 0.12, bars: [BROWN, 1, 0.08], size: 12 },   // under tail coverts: the bars separate, or joined by a narrow streak (R)
      { where: (p) => p.x >= 150 && p.a < 0.42, colour: WHITE, size: 9 },                                              // the lower throat white (R)
      { where: (p) => p.x >= 163 && p.a < 0.42, colour: PALE, bars: [DARK, 2, 0.08], size: 8 },                       // the middle of the throat pale brown barred with dark (R)
      { where: (p) => p.a >= 0.5, colour: BROWN, bars: [WHITE, 1, 0.1], size: 15 },                                     // upper parts brown, irregularly spotted with white (R), the spots small (R, of this form)
      { where: (p) => p.a >= 0.5 && p.x >= 124, colour: BROWN, bars: [WHITE, 1, 0.13], size: 9 },                      // crown and nape, the same, finer
    ],
    wing: {
      web: [24, 30, 21], edge: [24, 28, 28], tertial: BROWN, covert: BROWN, lesser: DARK, lesserEdge: [22, 30, 19],
      medianTip: [WHITE, 0.24], greaterTip: null, tertialTip: [PALE, 0.08], patchSkip: 0,
      // quadrate spots of lighter brown on the primaries' outer webs, partly white on the longest (R)
      primaryBars: [[0.1, 0.16, PALE, 'outer'], [0.22, 0.28, PALE, 'outer'], [0.34, 0.4, PALE, 'outer'], [0.46, 0.52, PALE, 'outer'], [0.58, 0.64, PALE, 'outer'], [0.7, 0.76, [32, 20, 70], 'outer'], [0.83, 0.89, [34, 16, 80], 'outer']],
      // six or seven bands of lighter brown across the secondaries (R)
      secondaryBars: [[0.08, 0.15, PALE, 'both'], [0.22, 0.29, PALE, 'both'], [0.36, 0.43, PALE, 'both'], [0.5, 0.57, PALE, 'both'], [0.64, 0.71, PALE, 'both'], [0.8, 0.88, [34, 18, 74], 'both']],
      tertialBars: [[0.2, 0.28, PALE, 'both'], [0.45, 0.53, PALE, 'both'], [0.7, 0.78, PALE, 'both']],
      greaterBars: [[0.42, 0.56, WHITE, 'outer'], [0.7, 0.82, WHITE, 'outer']],                                          // the outer larger coverts' spots larger and more across (R)
      under: [30, 16, 60], underCovert: [34, 30, 78], underCovertTip: null,
      underBars: [[0.12, 0.2, PALE, 'both'], [0.34, 0.42, PALE, 'both'], [0.56, 0.64, PALE, 'both'], [0.78, 0.86, PALE, 'both']],
      fold: { primaries: 7, secondaries: 7, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.25 },
      spread: { primaries: 9, secondaries: 9, shape: [0.6, 0.78, 0.9, 0.97, 1, 1, 0.99, 0.96, 0.92] },
    },
    tail: { web: [24, 30, 21], edge: [24, 26, 28], under: [30, 16, 56], point: 0.5, bars: [PALE, 7, 0.045] },               // narrow bands of lighter brown (R)
    bill: { upper: [68, 30, 62], lower: [68, 26, 56] },                                                                   // yellowish (R), yellow-green (G)
    mouth: [8, 30, 42],
    eye: { iris: [20, 30, 8], pupil: [225, 30, 6] },                                                                      // blackish brown (R)
    leg: [40, 20, 48],                                                                                                     // (the bare parts' colour was not found)
    shin: [34, 30, 66],                                                                                                    // the legs pale buff, heavily mottled with brown (R)
    // the face behind the eye pale brown, concentrically barred with darker; the rim mostly dark brown; the brows
    // greyish white; the feathers just before and above the eye dark sooty brown (R)
    disc: { face: [28, 24, 56], rim: [22, 34, 15], band: [24, 32, 23], streak: WHITE, rings: [[22, 30, 30], 4], brow: [34, 10, 84], bristle: [30, 10, 72],
      eyering: [20, 30, 10], eyeringWide: 0.45 },
  },
};
