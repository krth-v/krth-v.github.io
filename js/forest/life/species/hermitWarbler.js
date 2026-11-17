// Hermit Warbler, Setophaga (Dendroica) occidentalis: the adult male in spring and summer plumage, as Ridgway
// describes him; a pure Hermit Warbler, not one of the hybrids with Townsend's Warbler of the Olympics.
//
// What is published and what is not. The lengths under `published` are Ridgway's (1902) for adult males (skins;
// the footnotes read "seven specimens" and "four specimens" without saying which figure each belongs to), and the
// bird is built to their means; life/measure.js measures the built bird against them. The wingspan is the one
// Wikipedia gives for both sexes, from All About Birds (7.9 in). The colours follow Ridgway tract by tract: the
// forehead, crown and whole side of the head, down to and including the malar region and the sides of the neck,
// clear lemon yellow, the crown flecked with black; the occiput black; the hindneck streaked black and grey-olive;
// back, scapulars and rump grey tinged with olive and streaked with black; chin, throat and upper chest black,
// with a truncated hind edge; the rest white, faintly shaded with grey on the sides; two white wing bars; the two
// outer tail feathers mostly white. The outline of head and body, where the eye sits, how the folded wing lies, the
// bill's fineness and every colour's lightness are the agent's drawing, for the owner to judge from the contact
// sheet. The Birds of the World and All About Birds texts were not read; Ridgway's legs are for dried skins.
//
// How the sources were read: Ridgway through the Internet Archive's character recognition of the Bulletin as plain
// text (p. 567-568); Wikipedia's wikitext. No page was seen as an image. The length of 5.5 in (140 mm) that
// Wikipedia gives is not used: it is for both sexes and is not Ridgway's skins (118 mm).

const R = 'Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), p. 567-568, Dendroica occidentalis, adult male in spring and summer';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them (forehead, crown and the whole side of the head down to and including the malar region and the sides of the neck clear lemon or canary yellow, the crown usually more or less spotted or flecked with black; occiput black, or mainly black; hindneck streaked with black and grayish olive-green; back, scapulars, rump and upper tail coverts gray, usually tinged with olive-green and more or less broadly streaked with black, the streaks narrower on the rump; wings and tail black with light gray edgings, the middle and greater coverts broadly tipped white in two distinct bars; the inner webs of the two outermost tail feathers extensively white, most of the web on the first and about the terminal half on the second, the third usually with a white spot or streak near its tip; chin, throat and upper chest uniform black, the black with a convex or truncated hind edge; the rest of the underparts white, usually faintly shaded with gray on the sides and sometimes narrowly and indistinctly streaked there with dusky; bill blackish; iris brown; legs and feet dark horn brown, sometimes blackish, in dried skins). Not found in what was read, and the agent\'s: the outline, how fine the bill is, the colour of the legs in life, how far the black of the occiput runs down the neck, every colour\'s lightness. Whether the middle toe was measured with its claw is not said, nor which specimens each of Ridgway\'s figures rests on.',
  sources: {
    R: `${R}: skins; the footnotes read "seven specimens" and "four specimens" without saying which figure each belongs to`,
    W: 'Wikipedia, "Hermit warbler" (wikitext, read 2026-11-16), citing All About Birds: wingspan 7.9 in (201 mm), both sexes; weight 0.3 to 0.5 oz (8.5 to 14 g); length 5.5 in, not used',
    S: 'Seattle Audubon, BirdWeb, Hermit Warbler (read 2026-11-16 through a tool that returns a summary of a page): forages high in conifers, hopping along the branches from the trunk out to their tips; gleans while hovering, hangs upside down to glean the undersides of twigs, and flies out after flying insects; in migration often in mixed flocks',
  },
  lengths: [
    ['wing', 'Wing, folded', 66.1, [63, 69], 'R'],
    ['tail', 'Tail', 50.5, [49, 52], 'R'],
    ['culmen', 'Exposed culmen', 10.1, [9.5, 11], 'R'],
    ['tarsus', 'Tarsus', 19.4, [18, 21], 'R'],
    ['midToe', 'Middle toe (whether with its claw is not said)', 11.3, [11, 12], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 118, [112, 122], 'R'],
    ['span', 'Wingspan (one secondary source, both sexes)', 201, [201, 201], 'W'],
  ],
  proportions: [
    'The tail three quarters of the wing (50.5 to 66.1: worked out from Ridgway\'s means)',
    'The tarsus 19.4 mm: more than a quarter of the wing',
  ],
  mass: 'Mass 0.3 to 0.5 oz (8.5 to 14 g), both sexes (W, from All About Birds)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]. Set darker than the names read.
const BLACK = [60, 8, 8], YELLOW = [52, 92, 44], WHITE = [50, 8, 86], GREY = [130, 5, 36], GREYOL = [95, 14, 33], RUMP = [120, 5, 42];
const DUSKY = [50, 8, 14], EDGE = [55, 5, 52], FLANK = [60, 6, 62];

const size = (p) => (p.x > 46 ? 1.9 : p.x > 38 ? 2.6 : 4);
const head = (p) => p.x > 38;
// bands round the body (the streaks run along it): on where the sine of the angle round is high
const band = (p, k, cut) => Math.sin(p.a * k + p.x * 0.05) > cut;

export default {
  name: 'Hermit Warbler', latin: 'Setophaga occidentalis', key: 'hermit-warbler', seed: 229,
  // ---- who is about on a visit, how it lives on one (life/species/index.js says what each field is) and its voices
  census: { tier: 'very rare', source: 'B U; common only in the south-eastern Olympics', wave: true, extra: true },
  // Its way (life/families/foliage.js). From what was read (S, BirdWeb, through a summary): it keeps high in conifers,
  // hops along the boughs from the trunk out to their tips, gleans while hovering, hangs upside down to glean the
  // undersides of twigs, and flies out after flying insects; in migration it is often in mixed flocks. How its song
  // sounds was not read: the card says only that it sings. Lower than the sources have it: here 2.5 to 7.5 m above its tree's foot, and it sings from up
  // to 9 m (the family says why). Every number below is the agent's.
  way: {
    family: 'foliage', there: 0.6, gap: [40, 180],
    homeOff: 16, range: 24, apart: 45, broad: 0.08,
    low: 2.5, high: 7.5, perch: 9,
    hz: 20, speed: 6.5, stay: [8, 22], spell: [100, 320],
    flush: 3.5, startle: 7, near: 0.8, gone: 0.15,
    hop: [0.3, 1.2], hops: 5, hang: 0.06, hover: 0.1, sally: 0.06, reach: [1.5, 4], flick: 0,
    doing: { look: 'among the needles, looking about', hop: 'hopping out along a bough', peck: 'picking at the needles', hang: 'hanging upside down under a twig, picking at it', hover: 'hovering at the tip of a bough, picking at the needles' },
    call: { every: [8, 20], time: 0.15, rate: 6, reach: 25, doing: 'calling' },
    song: { every: [9, 20], up: 0.35, bout: [3, 7], gap: [6, 12], time: 1.6, rate: 6, reach: 70, doing: 'singing' },
  },
  voices: {
    song: { silent: true },   // nothing found
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 12 cm long: a small warbler.',
    marks: ['A bright yellow face and crown, with a black patch on the back of the head', 'A black throat and chest above a white belly', 'A grey back streaked with black, two white bars on the wing', 'White outer tail feathers, seen in flight'],
    lives: 'Tall conifer forest, where it keeps high in the canopy and gleans insects from the needles. It is a bird of the Pacific coast ranges and the Cascades, and in the Olympics is common only in the south-east, where it meets Townsend\'s Warbler and the two interbreed.',
  },
  plate: { wide: 0.3, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 56.5
    top:    [[-9, 1.8], [-3, 5], [6, 8.6], [16, 11], [26, 12], [34, 12], [40, 12.2], [45, 13.2], [50, 13], [53.6, 10.4], [55.6, 6.6], [56.5, 3.9]],
    bottom: [[-10.5, -1], [-4, -5], [5, -9.4], [15, -12], [25, -12.6], [33, -11.2], [40, -8.6], [46, -5.6], [51, -2.6], [56.5, 1.2]],
    half:   [[-10.5, 2.2], [-4, 5.8], [5, 9.5], [15, 11.6], [25, 12], [33, 10.8], [40, 9.8], [46, 9.4], [50, 8.2], [54, 5.2], [56.5, 1.4]],
    widest: 0.46,
    neck: [36.5, 45],
    eye: { x: 50, y: 6.4, r: 1.4 },
    bill: { culmen: 10.1, drop: 0.04, gape: 1.4 },
    wing: {
      chord: 66.1, wrist: [36, -1.8], aim: [-65, 4.5],
      up:   [[0, 1.8], [0.12, 7.2], [0.3, 8.8], [0.5, 7.6], [0.72, 4.8], [0.9, 2.2], [1, 0.5]],
      down: [[0, 1.3], [0.12, 4.1], [0.3, 5.6], [0.5, 5.7], [0.72, 4.2], [0.9, 2.3], [1, 0.5]],
      rest: 1.8, proud: 1,
      span: 201, shoulder: [34, 5.6, 8.6], arm: 25, lead: 5.5, sweep: 12, root: 46, tipChord: 18,
    },
    // nearly square, the outer feathers a touch shorter (the agent's)
    tail: { length: 50.5, root: 0.8, rootHalf: 2.2, feathers: 12, width: 5.6, closed: 0.035, graded: 1.5, point: 0.6, droop: 0.03, tent: 3.6 },
    leg: { knee: [21.5, -7.6, 5.4], shin: 12, tarsus: 19.4, thick: [2.5, 1, 0.62], toes: { mid: 11.3, side: 8.4, hind: 7.6, claw: 3.4, hindClaw: 4.4 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.3, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                              // the rest of the underparts white (R)
      { where: (p) => p.a > 0.3 && p.a < 0.56 && p.x < 36 && band(p, 70, 0.5), colour: FLANK, size: 4 },     // sides faintly shaded with gray, narrowly and indistinctly streaked (R)
      { where: (p) => p.a >= 0.58 && p.x <= 36, colour: GREY, size },                                       // back and scapulars gray, tinged with olive (R)
      { where: (p) => p.a >= 0.62 && p.x > 9 && p.x <= 34 && band(p, 90, 0.35), colour: BLACK, size: 3.2 }, // more or less broadly streaked with black (R)
      { where: (p) => p.a >= 0.58 && p.x < 9, colour: RUMP, size: 4 },                                      // rump and upper tail coverts gray, the streaks narrower (R)
      { where: (p) => p.a >= 0.62 && p.x < 9 && band(p, 90, 0.65), colour: BLACK, size: 2.2 },
      { where: (p) => p.x > 33.5 && p.x <= 38.5 && p.a >= 0.34 && p.a < 0.72 && p.y > -1, colour: YELLOW, size: 2.4 }, // the sides of the neck yellow (R)
      { where: (p) => p.x > 36 && p.a < 0.34, colour: BLACK, size: 2.6 },                                   // chin, throat and upper chest black (R)
      { where: (p) => head(p) && p.a >= 0.34, colour: YELLOW, size: 1.9 },                                  // forehead, crown, the whole side of the head and the malar region yellow (R)
      { where: (p) => p.x > 43 && p.x <= 49.5 && p.a >= 0.75 && p.y > 10.4 && band(p, 60, 0.55), colour: BLACK, size: 1.5 },  // the crown more or less flecked with black, in front of the black occiput (R; how much, the agent's)
      { where: (p) => p.x > 34 && p.x <= 43 && p.a >= 0.58 && p.y > 4, colour: GREYOL, size: 2.2 },         // the hindneck: grayish olive-green (R)
      { where: (p) => p.x > 34 && p.x <= 43 && p.a >= 0.58 && p.y > 4 && band(p, 55, 0.0), colour: BLACK, size: 2.2 }, // streaked with black (R)
      { where: (p) => p.x > 37 && p.x <= 43 && p.a >= 0.6 && p.y > 9, colour: BLACK, size: 2.2 },           // the occiput black, or mainly black (R)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: [50, 8, 16], covert: [50, 8, 15], lesser: GREY, lesserEdge: RUMP,
      medianTip: [WHITE, 0.14], greaterTip: [WHITE, 0.13],                  // middle and greater coverts broadly tipped white: two conspicuous bars (R)
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null,                                                  // tertials: nothing described in what was read, so only the light grey edging
      under: [50, 6, 56], underCovert: [52, 8, 76], underCovertTip: null, underBars: [],       // under the wing: not described in what was read; pale grey here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.58, 0.84, 0.96, 1, 1, 1, 1, 0.98, 0.96] },
    },
    // the two outer feathers' inner webs extensively white (most of the web on the first, the terminal half on the second), the third a spot near its tip (R)
    tail: { web: DUSKY, edge: EDGE, under: [50, 6, 40], point: 0.45, tip: [[5, WHITE, 0.85], [4, WHITE, 0.5], [3, WHITE, 0.14]] },
    bill: { upper: [50, 8, 10], lower: [50, 8, 14] },                                                  // bill blackish (R)
    mouth: [20, 60, 50],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                                   // iris brown (R)
    leg: [30, 22, 24],                                                                                  // dark horn brown in dried skins (R); life not found
    shin: [30, 18, 40],
  },
};
