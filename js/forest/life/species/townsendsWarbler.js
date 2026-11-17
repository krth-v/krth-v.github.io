// Townsend's Warbler, Setophaga (Dendroica) townsendi: the adult male in spring and summer plumage, as Ridgway
// describes him. The species is monotypic.
//
// What is published and what is not. The lengths under `published` are Ridgway's for adult males (skins), and the
// bird is built to their means; life/measure.js measures the built bird against them. The colours follow his
// description tract by tract: a black cap, cheek and bib, a broad yellow stripe over the eye and another below the
// cheek, a yellow breast with the sides streaked black, a yellowish olive back with a black wedge on each feather,
// two white wing bars, and the outer tail feathers white at the tip. The outline of head and body, where the eye
// sits, how the folded wing lies, the bill's fineness (the page read gives only the exposed culmen, and Wikipedia's
// "thin, pointed") and every colour's lightness are the agent's drawing, for the owner to judge from the contact
// sheet. Ridgway's legs are for dried skins; their colour in life was not found.
//
// How the sources were read: one agent reading and one checking. Ridgway through the Internet Archive's character
// recognition of the Bulletin as plain text; Birds of the World through a summary tool (its page could not be read
// as text by the checker); Wikipedia's wikitext. No page was seen as an image. Ridgway's footnote marks leave it
// unclear how many birds each figure rests on (the middle toe's perhaps five), and whether his middle toe includes
// the claw is not said. The Birds of the World total length (about 127 mm, both sexes) was not confirmed and is not
// used: Wikipedia's range is 114 to 127 mm.

const R = 'Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), p. 559-560, Dendroica townsendi, adult male, spring';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them (crown, hindneck, lores, auriculars, chin, throat and upper chest uniform black; a broad yellow stripe over the eye, a broad yellow stripe below the cheek that curves up behind it and meets the first, and a yellow spot under the eye, all clear lemon yellow; lower chest and breast lemon yellow; abdomen, flanks and under tail coverts white, the sides and flanks heavily streaked with black; back, scapulars and rump yellowish olive-green, each feather with a black wedge, the marks hidden on the rump; the longer upper tail coverts black edged with slate-grey; wings and tail blackish with light grey edgings, the middle and greater coverts broadly tipped white in two conspicuous bars; the inner webs of the three outer tail feathers extensively white at the tip, the terminal half or more of the outermost; bill blackish, iris brown, legs and feet dark horn-brown in dried skins). Not found in what was read, and the agent\'s: the outline, how fine the bill is, the colour of the legs in life, how much of the throat\'s black reaches the cheek, every colour\'s lightness. Whether the middle toe was measured with its claw is not said, nor how many birds each of Ridgway\'s figures rests on.',
  sources: {
    R: `${R}: skins; the character recognition's footnotes read "five specimens" and "four specimens" without saying which figure each belongs to`,
    W: 'Wikipedia, "Townsend\'s warbler" (wikitext of the infobox, read 2026-11-16): wingspan 8 in (203 mm); length 4.5 to 5 in (114 to 127 mm); tail 47.1 to 54 mm; sources not given there',
    B: 'Birds of the World, Townsend\'s Warbler (through a summary tool, not raw text): mass of males 9.1 g (7.3 to 10.4, n = 48); feeds in the upper third of the conifer canopy; gleans, hovers, and makes short sallies after flying insects; males sing in defence of their ground, and another song in breaks from feeding',
    S: 'Seattle Audubon, BirdWeb, Townsend\'s Warbler (through a summary tool): usually forages high up in trees, gleaning from the foliage, usually by climbing, sometimes while hovering; outside the breeding season and in migration in mixed flocks with chickadees, kinglets and other warblers',
  },
  lengths: [
    ['wing', 'Wing, folded', 67.2, [65, 69], 'R'],
    ['tail', 'Tail', 50, [48, 51], 'R'],
    ['culmen', 'Exposed culmen', 8.6, [8, 9], 'R'],
    ['tarsus', 'Tarsus', 18.8, [18, 19], 'R'],
    ['midToe', 'Middle toe (whether with its claw is not said)', 11, [10, 12], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 114.4, [107, 122], 'R'],
    ['span', 'Wingspan (one secondary source)', 203, [195, 210], 'W'],
  ],
  proportions: [
    'The tail three quarters of the wing (50 to 67.2: worked out from Ridgway\'s means)',
    'The tarsus 18.8 mm: more than a quarter of the wing',
  ],
  mass: 'Mass 9.1 g: 7.3 to 10.4 (B, summary tool)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]. Set darker than the names read.
const BLACK = [60, 8, 8], YELLOW = [52, 88, 50], BREAST = [52, 84, 48], WHITE = [50, 8, 86], OLIVE = [68, 42, 33], RUMPOL = [66, 40, 37];
const SLATE = [215, 8, 34], DUSKY = [50, 8, 14], EDGE = [55, 5, 50], FLANK = [52, 10, 78];

const size = (p) => (p.x > 46 ? 1.9 : p.x > 38 ? 2.6 : 4);
const head = (p) => p.x > 38;
// bands round the body (the streaks run along it): on where the sine of the angle round is high
const band = (p, k, cut) => Math.sin(p.a * k + p.x * 0.05) > cut;

export default {
  name: 'Townsend\'s Warbler', latin: 'Setophaga townsendi', key: 'townsends-warbler', seed: 109,
  // ---- who is about on a visit, how it lives on one (life/species/index.js says what each field is) and its voices
  census: { tier: 'some', source: 'B C, and BirdWeb\'s text: uncommon on the Olympic Peninsula', wave: true },
  // Its way (life/families/foliage.js). From what was read (S, BirdWeb, and B, Birds of the World, both through a
  // summary): it feeds high in conifers, gleaning the foliage as it climbs about, now and then hovering, and flies out
  // after flying insects; the male sings in defence of his ground, and another song in breaks from feeding; in
  // migration it goes about in mixed flocks with chickadees, kinglets and other warblers. Lower than the sources have it:
  // they put it in the upper third of tall conifers, where no walker would see it; here it gleans 2.5 to 7.5 m above its
  // tree's foot and sings from up to 9 m (the family says why). Every number below is the agent's.
  way: {
    family: 'foliage', there: 0.6, gap: [40, 180],
    homeOff: 16, range: 24, apart: 45, broad: 0.12,
    low: 2.5, high: 7.5, perch: 9,
    hz: 20, speed: 6.5, stay: [8, 22], spell: [100, 320],
    flush: 3.5, startle: 7, near: 0.8, gone: 0.15,
    hop: [0.3, 1.2], hops: 4, hang: 0.02, hover: 0.09, sally: 0.07, reach: [1.5, 4], flick: 0,
    doing: { look: 'among the needles, looking about', hop: 'hopping along a bough', peck: 'picking at the needles', hang: 'hanging under a twig, picking at it', hover: 'hovering at the tip of a bough, picking at the needles' },
    call: { every: [8, 20], time: 0.15, rate: 6, reach: 25, doing: 'calling: a sharp "tup"' },
    song: { every: [9, 20], up: 0.35, bout: [3, 7], gap: [6, 12], time: 1.6, rate: 6, reach: 70, doing: 'singing: a buzzy, wheezy song' },
  },
  voices: {
    song: { silent: true },   // no recording found under any usable or BY-SA licence
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 11 cm long and 9 g: a small warbler.',
    marks: ['A black crown, cheek and throat, with bright yellow stripes over the eye and below the cheek', 'A yellow breast, the flanks streaked with black', 'Olive back, two white bars on the wing', 'White outer tail feathers, seen in flight'],
    lives: 'Tall conifer forest, where it feeds mostly in the upper third of the canopy, gleaning insects from the needles, sometimes hovering or snatching them from the air. The male sings a buzzy, wheezing song from the treetops; his call is a sharp "tup".',
  },
  plate: { wide: 0.3, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 55.6
    top:    [[-9, 1.8], [-3, 5], [6, 8.6], [16, 11], [26, 12], [34, 12], [40, 12.2], [45, 13.2], [50, 13], [53.2, 10.4], [55, 6.6], [55.6, 3.9]],
    bottom: [[-10.5, -1], [-4, -5], [5, -9.4], [15, -12], [25, -12.6], [33, -11.2], [40, -8.6], [46, -5.6], [51, -2.6], [55.6, 1.2]],
    half:   [[-10.5, 2.2], [-4, 5.8], [5, 9.5], [15, 11.6], [25, 12], [33, 10.8], [40, 9.8], [46, 9.4], [50, 8.2], [53.4, 5.2], [55.6, 1.4]],
    widest: 0.46,
    neck: [36.5, 45],
    eye: { x: 49.4, y: 6.4, r: 1.4 },
    bill: { culmen: 8.6, drop: 0.04, gape: 1.4 },
    wing: {
      chord: 67.2, wrist: [36, -1.8], aim: [-66, 4.5],
      up:   [[0, 1.8], [0.12, 7.2], [0.3, 8.8], [0.5, 7.6], [0.72, 4.8], [0.9, 2.2], [1, 0.5]],
      down: [[0, 1.3], [0.12, 4.1], [0.3, 5.6], [0.5, 5.7], [0.72, 4.2], [0.9, 2.3], [1, 0.5]],
      rest: 1.8, proud: 1,
      span: 203, shoulder: [34, 5.6, 8.6], arm: 25, lead: 5.5, sweep: 12, root: 46, tipChord: 18,
    },
    // nearly square, the outer feathers a touch shorter (the agent's)
    tail: { length: 50, root: 0.8, rootHalf: 2.2, feathers: 12, width: 5.6, closed: 0.035, graded: 1.5, point: 0.6, droop: 0.03, tent: 3.6 },
    leg: { knee: [21.5, -7.6, 5.4], shin: 12, tarsus: 18.8, thick: [2.5, 1, 0.62], toes: { mid: 11, side: 8.2, hind: 7.4, claw: 3.4, hindClaw: 4.4 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.3, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                              // abdomen, flanks and under tail coverts white (R)
      { where: (p) => p.x > 25 && p.a < 0.5, colour: BREAST, size: 3 },                                     // lower chest and breast lemon yellow (R)
      { where: (p) => p.a > 0.28 && p.a < 0.56 && p.x < 36 && band(p, 70, 0.1), colour: BLACK, size: 5 },   // sides and flanks heavily streaked with black (R)
      { where: (p) => p.a >= 0.58 && p.x <= 36, colour: OLIVE, size },                                      // back and scapulars yellowish olive-green (R)
      { where: (p) => p.a >= 0.62 && p.x > 9 && p.x <= 34 && band(p, 90, 0.5), colour: BLACK, size: 3.2 }, // each with a black wedge (R)
      { where: (p) => p.a >= 0.58 && p.x < 9, colour: RUMPOL, size: 4 },                                    // rump: the marks mostly hidden (R)
      { where: (p) => p.a >= 0.62 && p.x < 3, colour: SLATE, shaft: BLACK, shaftWidth: 0.55, size: 3 },    // longer upper tail coverts black centrally, broadly margined slate (R)
      // the side of the neck behind the yellow that rings the cheek: olive as the back (R has the hindneck black and
      // does not describe the side of the neck: the agent's)
      { where: (p) => p.x > 33 && p.x <= 40.5 && p.a >= 0.34 && p.a < 0.62, colour: OLIVE, size: 2.6 },
      { where: (p) => p.x > 36 && p.a < 0.34, colour: BLACK, size: 2.6 },                                   // chin, throat and upper chest black (R)
      // the head's side (bounded round the head, `a`, so that no stripe joins its fellow over the crown or the forehead):
      { where: (p) => head(p) && p.a >= 0.3 && p.a < 0.8 && p.y <= 1.8, colour: YELLOW, size: 2 },         // a broad yellow stripe below the cheek (R)
      { where: (p) => p.x > 40.5 && p.x <= 43.6 && p.a >= 0.34 && p.a < 0.8 && p.y <= 10.4, colour: YELLOW, size: 1.8 },   // curving up behind the cheek to meet the stripe over the eye (R)
      { where: (p) => p.x > 43.6 && p.a >= 0.34 && p.a < 0.8 && p.y > 1.8 && p.y <= 8.2, colour: BLACK, size: 1.8 },      // lores and auriculars black (R)
      { where: (p) => p.a >= 0.4 && p.a < 0.8 && p.y < 5.4 && Math.abs(p.x - 49.4) < 2.3 && Math.hypot(p.x - 49.4, p.y - 6.4) > 1.5 && Math.hypot(p.x - 49.4, p.y - 6.4) < 2.9, colour: YELLOW, size: 1.2 },   // a yellow spot under the eye (R)
      { where: (p) => p.x > 40.5 && p.x <= 52 && p.a >= 0.42 && p.a < 0.8 && p.y > 8.2 && p.y <= 10.6, colour: YELLOW, size: 1.8 },  // a broad yellow stripe over the eye (R)
      { where: (p) => p.x > 36 && (p.a >= 0.8 || (p.a >= 0.5 && p.y > 10.6) || (p.x > 52 && p.a >= 0.42 && p.y > 8.2)), colour: BLACK, size: 2.2 },  // crown and forehead black (R)
      { where: (p) => p.x > 34 && p.x <= 40.5 && p.a >= 0.62 && p.y > 2, colour: BLACK, size: 2.4 },        // hindneck black, running down into the back (R)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: [50, 8, 16], covert: [50, 8, 15], lesser: OLIVE, lesserEdge: RUMPOL,
      medianTip: [WHITE, 0.14], greaterTip: [WHITE, 0.13],                  // middle and greater coverts broadly tipped white: two conspicuous bars (R)
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null,                                                  // tertials: nothing described in what was read, so only the light grey edging
      under: [50, 6, 56], underCovert: [52, 8, 76], underCovertTip: null, underBars: [],       // under the wing: not described in what was read; pale grey here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.58, 0.84, 0.96, 1, 1, 1, 1, 0.98, 0.96] },
    },
    // the three outer feathers' inner webs white over their terminal half or more, the outermost the most (R)
    tail: { web: DUSKY, edge: EDGE, under: [50, 6, 40], point: 0.45, tip: [[5, WHITE, 0.6], [4, WHITE, 0.5], [3, WHITE, 0.32]] },
    bill: { upper: [50, 8, 10], lower: [50, 8, 14] },                                                  // bill blackish (R)
    mouth: [20, 60, 50],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                                   // iris brown (R)
    leg: [30, 22, 24],                                                                                  // dark horn-brown in dried skins (R); life not found
    shin: [30, 18, 40],
  },
};
