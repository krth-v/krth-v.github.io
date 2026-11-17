// Common Yellowthroat, Geothlypis trichas, the Pacific form (arizela, Ridgway's Pacific Yellow-throat; type
// locality Fort Steilacoom, Washington): the adult male in spring. The female has no mask and is buff below.
//
// What is published and what is not. The lengths under `published` are Ridgway's for 17 adult males of arizela,
// and the bird is built to their means; life/measure.js measures the built bird against them. Ridgway gives no
// full description of arizela: the colours are his description of the adult male of the nominate race, with his
// stated differences for arizela (duller, the yellow of the underparts less orange, the pale band behind the
// mask narrower and whitish). That western Washington birds are arizela is on his range and type locality; no
// modern source was read to confirm it. Of the wing coverts, wing bars, flight-feather edges and tail pattern he
// says only "edge of wing yellow" and olive upper parts: no wing bars are painted, and the rest is the agent's.
// The outline of head and body, where the eye sits and how the folded wing lies are in nothing that was read:
// they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, through the Internet Archive's character
// recognition of the scan (grep and sed over its text). No page was seen as an image. The "seventeen specimens"
// footnote is attached to the male line by reading; the table beneath it sums to sixteen. "Without claw" for the
// middle toe is from Ridgway's text for the genus, not the table line.

const R = 'Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), p. 671, Geothlypis trichas arizela; https://archive.org/download/cu31924090256888/cu31924090256888_djvu.txt (character recognition of the scan)';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the nominate adult male, with his differences for arizela (a black mask over the forehead, lores, round the eye, cheek and ear coverts, bordered behind by a band of light ash gray, whitish and narrower in arizela; the rest of the upper parts plain dull grayish olive-green, the hind crown tinged brown; chin, throat and chest lemon or canary yellow, less orange in arizela; the rest of the underparts dull buffy whitish, light buffy grayish brown on the sides and flanks; under tail-coverts paler yellow; edge of the wing yellow; bill black; iris brown; legs light brown, said of dried skins). Not found in what was read, and the agent\'s: the outline, the wing coverts and flight-feather edges and the tail (no wing bars are said), how far down the breast the yellow comes, the exact colour of the band behind the mask, the colours in life. Whether the middle toe was measured with its claw is not said by the table line; "without claw" is taken from the genus text. The length is of skins. The wingspan is species-wide, from a secondary source, and was not read for the Pacific form.',
  sources: {
    R: `${R}: 17 adult males, museum skins`,
    W: 'Wikipedia, "Common yellowthroat": length 11 to 13 cm, wingspan 15 to 19 cm, mass 7.6 to 15.5 g (page text through a summary tool; both sexes, all forms; not opened by the checker)',
    B: 'Seattle Audubon, BirdWeb, Common Yellowthroat: wet shrubby lowland thickets in western Washington, forages low, pairs, May "common" on the Pacific Northwest Coast; read again by the agent that gave it its way (2026-11-16): "sometimes cock their tails up", "males often perch on a tall stalk to sing, and flick their wings and tails"',
  },
  lengths: [
    ['wing', 'Wing, folded', 55.8, [52.5, 58], 'R'],
    ['tail', 'Tail', 52.6, [49.5, 57], 'R'],
    ['culmen', 'Exposed culmen', 10.3, [10, 11], 'R'],
    ['tarsus', 'Tarsus', 20.4, [20, 21], 'R'],
    ['midToe', 'Middle toe (without claw, from the genus text)', 13.4, [13, 14], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 119.7, [114, 125], 'R'],
    ['span', 'Wingspan (one secondary source, both sexes)', null, [150, 190], 'W'],
  ],
  proportions: [
    'The tail a little shorter than the wing (52.6 to 55.8: worked out from Ridgway\'s means), the wing short and much rounded',
    'The bill short and fine, shorter than the head; the tarsus long, more than a third of the wing',
  ],
  mass: 'Mass about 10 g: 7.6 to 15.5 (W; the mean 10.3 g is of 965 males of the nominate form, not arizela)',
};

// colours as paint: [hue, saturation, lightness]. Set darker than their names read.
const BLACK = [60, 8, 8], BAND = [58, 5, 52], OLIVE = [68, 30, 30], CROWN = [56, 28, 30], YELLOW = [51, 80, 50], UNDERTAIL = [54, 70, 60];
const BUFF = [44, 16, 60], FLANK = [40, 20, 52], RUMP = [70, 32, 33], DUSKY = [60, 12, 20], EDGE = [66, 28, 31], BACK = [66, 28, 29];

const PALE = [52, 52, 66];

const size = (p) => (p.x > 46 ? 2 : p.x > 40 ? 2.8 : 4);
// a number from 0 to 1 that is the same for a place every time, to break a boundary between two colours into a few
// feathers' width of both
const jit = (p) => { const v = Math.sin(p.x * 12.9898 + p.a * 78.233 + p.y * 37.719) * 43758.5453; return v - Math.floor(v); };
// The mask (eye at x 49.6, y 6.4): over the forehead, the lores, round the eye, the cheek and the ear coverts (R), so on
// the side of the head back to behind the ear coverts, six millimetres behind the eye, and down to the throat's
// yellow; on the crown only the forehead. It first stopped two and a half millimetres behind the eye.
const MASK = 43.6;
const mask = (p) => (p.a >= 0.38 && p.a < 0.86 && p.x > MASK + 0.8 * (jit(p) - 0.5)) || (p.a >= 0.86 && p.x > 51.2 + 0.6 * (jit(p) - 0.5));
// the band behind it, light ash grey, whitish and narrower in arizela (R): behind the ear coverts, and over the crown
// behind the forehead's black
const band = (p) => (p.a >= 0.42 && p.a < 0.86 && p.x > MASK - 1.7 && p.x <= MASK + 0.4) || (p.a >= 0.86 && p.x > 49 && p.x <= 51.6);
// the yellow of the chin, throat and chest (R), coming furthest back down the middle of the breast and fading into the
// buffy belly, and up under the mask
const bib = (p) => p.a < 0.5 && p.x > 31 + 10 * p.a + 3 * jit(p);
const fade = (p) => p.a < 0.52 && p.x > 27.5 + 10 * p.a + 3 * jit(p);

export default {
  name: 'Common Yellowthroat', latin: 'Geothlypis trichas', key: 'common-yellowthroat', seed: 167,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'rare', source: 'B C; a bird of marsh and wet thicket, which this valley has little of' },
  // ---- how it lives on a visit: in the wet ground's shrubs and the willows by the river, low; its tail cocked up, it
  // gleans the foliage and now and then flies out after an insect or hops on the ground, and climbs to the top of a
  // shrub to sing, flicking its wings and tail (life/families/thicket.js, where what was read is quoted). Every number
  // is the agent's.
  way: {
    family: 'thicket', there: 0.55, gap: [50, 180],
    homeOff: 16, range: 9, apart: 40, need: 5,
    shrubs: { willow: 1, club: 1, salmon: 0.8, elder: 0.3, vine: 0.2 },
    wet: 0.9, heights: [0.2, 2.2], high: 4,
    hz: 20, speed: 5.5,
    spell: [45, 140],
    // how near it lets the walker come (life/behave.js; the agent's own: no flush distance was found)
    flush: 5, startle: 11, near: 0.65, gone: 0.2,
    reach: 2, flee: 13,
    // seconds it keeps to the inside of the shrub after the walker has put it up
    skulk: [8, 22],
    sally: { every: [20, 60], reach: [0.6, 1.8], rise: [0, 1] },
    ground: { every: [20, 50], stay: [2, 6] },
    tail: { kind: 'cock', every: [2, 6] },
    chip: { every: [10, 30], reach: 25, doing: 'giving its soft "jip" of a call' },
    // (a song as long as the recording played for it)
    song: { every: [20, 60], songs: [4, 9], gap: [4, 9], time: 1.85, rate: 6, reach: 70, post: 0.75, lift: 2.5, flick: true, doing: 'singing: a loud, rolling "witchety-witchety-witchety"' },
  },
  voices: {
    song: { file: 'yellowthroat-song.mp3', level: 0.4, near: 5,
      credit: { what: 'Common Yellowthroat, song (the "witchety")', by: 'G. McGrane, Maine, 1996 (Wikimedia Commons)', licence: "public domain (the recordist's own release, PD-self): cut and filtered",
        licenceUrl: 'https://commons.wikimedia.org/wiki/File:Common_Yellowthroat.ogg', source: 'https://commons.wikimedia.org/wiki/File:Common_Yellowthroat.ogg', bytes: 408392, kept: 1.85 } },
    // (silent: no recording of its call was found under a licence that could be used)
    chip: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 12 cm long and 10 g: a small, round warbler.',
    marks: ['A black mask over the eyes, edged behind with white', 'A bright yellow throat and breast', 'Olive above, buffy below, with yellow under the tail', 'A long, rounded tail and long legs for a warbler'],
    lives: 'Wet, shrubby thickets and sedge, low down: it skulks and creeps through the stems, gleaning insects, and the male climbs a tall stalk to sing his "witchety-witchety" and flicks his wings and tail.',
  },
  plate: { wide: 0.36, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 56.8 (119.7 less the tail and the culmen)
    top:    [[-9, 2], [-3, 5.8], [6, 10], [16, 13.2], [26, 14.2], [34, 14], [41, 13.6], [47, 13.8], [51.5, 13.2], [54.5, 10.8], [56, 7.6], [56.8, 4.4]],
    bottom: [[-11, -1], [-4, -5.8], [5, -10.8], [15, -14.4], [25, -15], [34, -13.4], [41, -10], [47, -6.2], [52, -2.4], [56.8, 1.2]],
    half:   [[-11, 2.4], [-4, 6.4], [5, 10.4], [15, 12.8], [25, 13], [34, 11.8], [41, 10], [46, 9.2], [50.5, 8], [54.5, 5.2], [56.8, 1.7]],
    widest: 0.46,
    neck: [38, 47],
    eye: { x: 49.6, y: 6.4, r: 1.5 },
    bill: { culmen: 10.3, drop: 0.06, gape: 1.6 },
    wing: {
      chord: 55.8, wrist: [37, -1.8], aim: [-55.5, 5],
      // short and much rounded: broad to near its tip
      up:   [[0, 1.7], [0.12, 6.8], [0.3, 8.2], [0.5, 7.4], [0.72, 5], [0.9, 2.4], [1, 0.7]],
      down: [[0, 1.3], [0.12, 4.2], [0.3, 5.8], [0.5, 6], [0.72, 4.6], [0.9, 2.6], [1, 0.7]],
      rest: 1.9, proud: 1,
      span: 170, shoulder: [35, 6.8, 9.5], arm: 25, lead: 5, sweep: 10, root: 42, tipChord: 19,
    },
    // long, much rounded, the feathers graded
    tail: { length: 52.6, root: 0.9, rootHalf: 2.4, feathers: 12, width: 5.8, closed: 0.035, graded: 5, point: 0.6, droop: 0.03, tent: 4 },
    leg: { knee: [24, -9, 6], shin: 13.5, tarsus: 20.4, thick: [3, 1.3, 0.8], toes: { mid: 13.4, side: 9.6, hind: 8.6, claw: 4, hindClaw: 5.4 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.34, lift: 0.5, head: { pitch: 0.08 }, tail: { pitch: 0.28, fan: 0.03 }, feet: { mode: 'grip', round: 0.006 }, perch: 0.006 },
    // on the top of a stalk, singing: more upright, the head up
    singing: { pitch: 0.5, lift: 0.5, head: { pitch: 0.3 }, tail: { pitch: 0.2, fan: 0.04 }, feet: { mode: 'grip', round: 0.006 }, perch: 0.006 },
    // over the floor or through sedge: low and level, the tail a little up
    ground: { pitch: 0.16, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: 0.4, fan: 0.03 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BUFF, size },                                                                   // the rest of the underparts dull buffy whitish (R)
      { where: (p) => p.a > 0.15 && p.a < 0.6 && p.x < 30 + 4 * jit(p), colour: FLANK, size: 4 },   // light buffy grayish brown on the sides and flanks (R)
      { where: (p) => p.a >= 0.5 && p.a < 0.6 && p.x >= 30 + 4 * jit(p), colour: BACK, size },  // the sides of the neck as the upper parts (the agent's: left buff, they were a pale wedge)
      { where: fade, colour: PALE, size },                                                      // (the yellow fading into the belly: the agent's)
      { where: bib, colour: YELLOW, size },                                                     // chin, throat and chest lemon or canary yellow (R)
      { where: (p) => p.a < 0.45 && p.x < 7, colour: UNDERTAIL, size: 4 },                      // under tail-coverts paler yellow (R)
      { where: (p) => p.a >= 0.6, colour: BACK, size },                                         // upper parts plain dull grayish olive-green (R)
      { where: (p) => p.a >= 0.6 && p.x < 11, colour: RUMP, size: 4 },                          // rump and upper tail coverts: the agent's, slightly brighter
      { where: (p) => p.a >= 0.6 && p.x >= 34 && p.x < 45, colour: CROWN, size: 2.6 },          // occiput and hind crown tinged with brown (R)
      { where: band, colour: BAND, size: 1.6 },                                                 // a narrow whitish band behind the mask (R, of arizela)
      { where: mask, colour: BLACK, size: 1.7 },                                                // the black mask: forehead, lores, round the eye, cheek, ear coverts (R)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: [62, 14, 22], covert: [64, 20, 26], lesser: OLIVE, lesserEdge: [60, 40, 36],   // edge of the wing yellow (R)
      medianTip: null, greaterTip: null,                                                        // no wing bars are described
      patchSkip: 0,
      primaryBars: [], secondaryBars: [], tertialTip: null,
      under: [52, 10, 52], underCovert: [54, 28, 66], underCovertTip: null, underBars: [],     // under the wing: not described in what was read; pale here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.8, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.6, 0.85, 0.96, 1, 1, 1, 1, 0.98, 0.95] },
    },
    tail: { web: DUSKY, edge: [66, 22, 28], under: [60, 8, 34], point: 0.5 },                  // olive: not described apart from the upper parts (R)
    bill: { upper: [50, 8, 9], lower: [50, 8, 12] },                                          // bill black (R)
    mouth: [20, 60, 50],
    eye: { iris: [22, 40, 11], pupil: [240, 15, 5] },                                         // iris brown (R)
    leg: [28, 28, 40],                                                                        // light brown (R, of dried skins)
    shin: [30, 26, 36],
  },
};
