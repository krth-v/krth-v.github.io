// Wilson's Warbler, Cardellina (Wilsonia) pusilla, the Pacific coast form chryseola, Ridgway's "Golden Pileolated
// Warbler": the adult male in spring. The female's cap is smaller or broken, and the cap of a western female is
// dark too (BirdWeb), so she is not painted.
//
// What is published and what is not. The lengths under `published` are Ridgway's for 24 adult males of
// chryseola, and the bird is built to their means; life/measure.js measures the built bird against them. The
// colours are his description of the nominate form tract by tract, with his diagnosis of chryseola laid over it
// (the yellow of the forehead inclining to orange, the back more yellowish, the underparts a purer yellow). He gives
// no wing or tail colour for the species beyond "plain": those are painted olive like the back, the agent's own.
// The outline of head and body, where the eye sits, how the folded wing lies and the pose are in nothing that
// was read: they are the agent's drawing, for the owner to judge from the contact sheet. Ridgway says the wing is
// pointed and Wikipedia says rounded; the two were not reconciled, and the wing is built short (the primaries
// project little), as his figures have it.
//
// How the sources were read: one agent reading and one checking, through the character recognition of the
// Internet Archive's full text of Ridgway 1902 (one scan for each figure; the second scan was not opened by the
// checker), and Wikipedia's page text. No page was seen as an image. The female's tarsus (18.8) was read in one
// scan only. The male's tarsus mean 18.2 rests on one clean reading. The 'length' is of skins, which run shorter than a living bird.

const R = "Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), p. 714, Wilsonia pusilla chryseola (https://archive.org/download/cu31924090256888/cu31924090256888_djvu.txt)";

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them (forehead, a stripe over the eye, the orbital region and all the underparts lemon or gamboge yellow, the sides and flanks slightly tinged olive; in chryseola the forehead and the stripe over the eye (especially the forehead) inclining to orange, the yellow below purer and more intense, and the upper parts, uniform olive-green, much more yellowish, almost olive-yellow; the crown glossy blue-black, the feathers slightly elongated and distinctly outlined; the cheek and the sides of the neck like the back but rather more yellowish; upper maxilla dark brown, more blackish towards the tip, the lower paler brown towards the base; iris brown; legs light brownish; no white on the inner webs of the outer tail feathers). Not found in what was read, and the agent\'s: the outline; the cap\'s edge (a square one); the colour of the wing and the tail, painted olive like the back with no bars; the middle toe (built at 9 mm); the wingspan of this form; the legs, painted pinkish brown after BirdWeb\'s remark that warblers of the understory tend to have pink legs. Whether the specimens were fresh spring birds is not said, nor how the wing was measured.',
  sources: {
    R: `${R}: 24 adult males, museum skins`,
    W: 'Wikipedia, "Wilson\'s warbler" (read 2026-11-16): 10 to 12 cm long, wingspan 14 to 17 cm, 5 to 10 g, all forms and both sexes',
    B: 'Seattle Audubon, BirdWeb, Wilson\'s Warbler: wet shrubby ground within forests; hops branch to branch; a tail flip; "both sexes have large, black eyes", and "The western Washington breeding race females have dark black caps" (read again by the agent that gave it its way, 2026-11-16)',
  },
  lengths: [
    ['wing', 'Wing, folded', 55.4, [53, 59], 'R'],
    ['tail', 'Tail', 49.1, [45, 52], 'R'],
    ['culmen', 'Exposed culmen', 8.3, [7, 9], 'R'],
    ['tarsus', 'Tarsus', 18.2, [17, 19.5], 'R'],
    ['midToe', 'Middle toe (not found: built at 9 mm, Ridgway has it "decidedly shorter than the tarsus")', null, [7, 11], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 110.5, [104, 117], 'R'],
    ['span', 'Wingspan (one secondary source, all forms)', null, [140, 170], 'W'],
  ],
  proportions: [
    'The tail nine tenths of the wing (49.1 to 55.4: worked out from Ridgway\'s means), long and slim for the bird',
    'The tarsus a third of the wing (Ridgway: "decidedly less than to nearly one-third")',
  ],
  mass: 'Mass about 7 g: 5 to 10 (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness] (darker than the names read). A yellow is held through the
// tone mapping only from hue 28 to about 52 and at a high saturation (life/material.js): the forehead's orange is laid
// at 43, inside it (at 38, outside it, it came out salmon pink), and the olive-yellows of the cheek and the flank at
// 54 to 56, where the hold is partial (at 60 to 62, outside it, they came out as pale cream blocks). 2026-11-16.
const YELLOW = [50, 92, 52], BRIGHT = [47, 94, 53], ORANGE = [43, 96, 51], CAP = [225, 22, 9], OLIVE = [68, 52, 32], CHEEK = [56, 76, 42], NECK = [60, 62, 38];
const RUMP = [66, 56, 36], FLANK = [55, 80, 44], WING = [66, 36, 31], WEDGE = [64, 28, 23], EDGE = [66, 46, 36];

const size = (p) => (p.x > 43 ? 1.8 : p.x > 35 ? 2.3 : 3.8);
const head = (p) => p.x > 34;
// a number from 0 to 1 that is the same for a place every time, to break a boundary between two colours into a few
// feathers' width of both, as a bird's tracts meet
const jit = (p) => { const v = Math.sin(p.x * 12.9898 + p.a * 78.233 + p.y * 37.719) * 43758.5453; return v - Math.floor(v); };
// the cap's lower edge, as a share of the way round: at the eye's height a little above the eye (which is at 0.63), and
// curving up to the crown in front (it stops at the forehead, above the front of the eye) and behind (at the nape)
const capEdge = (x) => (x < 36 ? 0.71 + (36 - x) * 0.075 : x > 44.5 ? 0.71 + (x - 44.5) * 0.095 : 0.71);

export default {
  name: "Wilson's Warbler", latin: 'Cardellina pusilla', key: 'wilsons-warbler', seed: 101,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'most', source: 'B C; breeds in the alder and willow thickets', wave: true },
  // ---- how it lives on a visit: in a few shrubs near the walk, willow and salmonberry most of all, low and quick; it
  // flips its tail and flicks its wings, flies out after an insect, now and then drops to the ground, and goes up to
  // the top of a shrub to sing (life/families/thicket.js, where what was read is quoted). Every number is the agent's.
  way: {
    family: 'thicket', there: 0.6, gap: [30, 120],
    homeOff: 14, range: 9, apart: 24, need: 6,
    shrubs: { willow: 1, salmon: 1, vine: 0.8, elder: 0.7, club: 0.5, huckle: 0.1 },
    wet: 0.4, heights: [0.4, 3.2], high: 7,
    hz: 22, speed: 6,
    spell: [60, 180],
    // how near it lets the walker come (life/behave.js; the agent's own: no flush distance was found)
    flush: 3.5, startle: 8, near: 0.75, gone: 0.15,
    reach: 2.2, flee: 12,
    // seconds it keeps to the inside of the shrub after the walker has put it up
    skulk: [6, 18],
    sally: { every: [6, 18], reach: [0.7, 2.2], rise: [-0.2, 1.2] },
    ground: { every: [60, 160], stay: [2, 4] },
    tail: { kind: 'flip', every: [1.2, 4] },
    chip: { every: [8, 25], reach: 25, doing: 'giving its flat "chuff" of a call' },
    // (a song as long as the recording played for it)
    song: { every: [20, 60], songs: [3, 7], gap: [4, 10], time: 2.4, rate: 10, reach: 70, post: 0.5, lift: 2, doing: 'singing: a chattering run of loud notes that drops away at the end' },
  },
  voices: {
    song: { file: 'wilsons-song.mp3', level: 0.35, near: 4,
      credit: { what: "Wilson's Warbler, song", by: 'J. Job, National Park Service, Rocky Mountain NP sound library, 2015', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-wilsonswarbler.htm', bytes: 557867, kept: 2.4 } },
    // (silent: no recording of its call was found under a licence that could be used)
    chip: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 11 cm long and 7 g: a small warbler.',
    marks: ['A glossy black cap on a bright yellow face', 'Olive-yellow above, plain yellow below', 'Plain wings with no bars, and a long thin tail', 'It flips its tail as it hops'],
    lives: 'Wet, shrubby ground within the forest: willow and alder thickets, stream banks and small clearings. It hops quickly from branch to branch, low down, picking insects from leaves and twigs and now and then catching one in the air, and it flips its tail as it goes. Its song is a chattering run of notes that falls away.',
  },
  plate: { wide: 0.34, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 52.8
    top:    [[-9, 1.9], [-3, 5], [6, 8.6], [16, 11], [25, 11.8], [32, 11.6], [37.5, 11.8], [42, 12.9], [46.5, 12.8], [49.6, 10.6], [51.6, 7.2], [52.8, 4.2]],
    bottom: [[-10.5, -1], [-4, -5], [5, -9.6], [15, -12.6], [24, -13], [31, -11.2], [38, -8.4], [44, -5.2], [49, -2], [52.8, 0.9]],
    half:   [[-10.5, 2.2], [-4, 6], [5, 9.8], [15, 11.8], [24, 12], [31, 10.8], [37, 9.8], [42, 9.6], [47, 8], [50.6, 5], [52.8, 1.5]],
    widest: 0.46,
    neck: [33, 41],
    eye: { x: 45.4, y: 6.2, r: 1.5 },
    bill: { culmen: 8.3, drop: 0.05, gape: 1.4 },
    wing: {
      chord: 55.4, wrist: [31.5, -1.8], aim: [-54, 4.6],
      up:   [[0, 1.8], [0.12, 6.8], [0.3, 8.2], [0.5, 7.2], [0.72, 4.6], [0.9, 2.1], [1, 0.5]],
      down: [[0, 1.2], [0.12, 3.9], [0.3, 5.4], [0.5, 5.5], [0.72, 4.1], [0.9, 2.3], [1, 0.5]],
      rest: 1.8, proud: 0.9,
      span: 155, shoulder: [30, 5.6, 8.4], arm: 24, lead: 5, sweep: 12, root: 42, tipChord: 17,
    },
    // long and slim, a little rounded, the feathers narrow (R)
    tail: { length: 49.1, root: 0.8, rootHalf: 2, feathers: 12, width: 5, closed: 0.035, graded: 3, point: 0.55, droop: 0.03, tent: 3.4 },
    leg: { knee: [21, -7.6, 5.2], shin: 11.6, tarsus: 18.2, thick: [2.4, 1, 0.62], toes: { mid: 9, side: 6.8, hind: 6.6, claw: 3.4, hindClaw: 4.4 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.3, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: YELLOW, size },                                                                  // the entire under parts lemon or gamboge yellow, purer in chryseola (R)
      { where: (p) => p.a > 0.24 && p.a < 0.58 && p.x + 4 * jit(p) < 31, colour: FLANK, size: 4 },  // sides and flanks slightly tinged with olive (R)
      { where: (p) => p.a >= 0.58 && p.x <= 37, colour: OLIVE, size },                           // upper parts uniform olive-green, much more yellowish in chryseola (R)
      { where: (p) => p.a >= 0.58 && p.x < 9, colour: RUMP, size: 4 },                           // rump and upper tail coverts: olive too, a shade brighter (the agent's)
      { where: (p) => p.x > 31 + 2 * jit(p) && p.x <= 37 + 2 * jit(p) && p.a >= 0.42 && p.a < 0.8, colour: NECK, size: 2 },   // the sides of the neck like the back but more yellowish (R)
      { where: (p) => head(p) && p.x > 38 && p.a < 0.84, colour: BRIGHT, size: 1.8 },             // forehead, the stripe over the eye and the orbital region yellow (R)
      { where: (p) => p.x > 36.5 + 2 * jit(p) && p.x < 43.6 - 1.5 * jit(p) && p.a >= 0.44 && p.a < 0.66 && p.y < 6.6, colour: CHEEK, size: 1.8 },   // the auricular region, behind and below the eye, a more olive yellow (R)
      { where: (p) => head(p) && p.x <= 38 && p.a < 0.45, colour: YELLOW, size: 2 },            // throat and chin yellow (R)
      { where: (p) => p.x > 46 && p.a >= 0.82 && p.x < 51.5, colour: ORANGE, size: 1.6 },           // the forehead inclining to orange in chryseola (R)
      { where: (p) => p.x > 32 && p.x < 47.6 && p.a >= capEdge(p.x) + 0.03 * (jit(p) - 0.5), colour: CAP, size: 1.6 },   // crown glossy blue-black, stopping at the forehead (R); where its edge runs is the agent's
    ],
    wing: {
      web: WING, edge: EDGE, tertial: WEDGE, covert: WING, lesser: OLIVE, lesserEdge: EDGE,       // plain: no bars; olive like the back (the agent's, R gives nothing)
      medianTip: null, greaterTip: null,
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null,
      under: [58, 22, 56], underCovert: [54, 70, 60], underCovertTip: null, underBars: [],       // under the wing: not described in what was read; pale, a little yellow here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.7, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.6, 0.86, 0.97, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: WEDGE, edge: EDGE, under: [60, 14, 46], point: 0.5 },                           // olive-dusky, no white on the inner webs (R)
    bill: { upper: [28, 30, 16], lower: [30, 22, 28] },                                         // upper dark brown, blackish at the tip; lower paler brown at the base (R)
    mouth: [8, 60, 55],
    eye: { iris: [22, 40, 10], pupil: [240, 15, 5] },                                           // iris brown (R); BirdWeb has the eye large and black
    leg: [24, 32, 40],                                                                          // light brownish (R), a little pink (BirdWeb, of understory warblers)
    shin: [24, 30, 42],
  },
};
