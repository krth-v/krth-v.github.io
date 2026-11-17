// Orange-crowned Warbler, Leiothlypis celata (the Pacific coast form, lutescens, Ridgway's "Lutescent
// Warbler"): the adult male in spring. The orange crown that gives the bird its name is nearly always hidden.
//
// What is published and what is not. The lengths under `published` are Ridgway's for adult males of lutescens
// (skins), and the bird is built to their means; life/measure.js measures the built bird against them. He
// describes only the eastern form, celata, tract by tract, and gives lutescens as "similar, but much more
// brightly colored, the upper parts bright olive-green, the under parts distinctly yellow (bright
// olive-yellow to nearly gamboge)"; so the colours of the head, wing and tail are celata's, brightened. The
// outline of head and body, where the eye sits, how the folded wing lies and the stance are in nothing that
// was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, through the Internet Archive's character
// recognition of the scan (as text, not as an image) and, for the species at large, through summaries of
// Wikipedia and BirdWeb pages. The checker confirmed every length of Ridgway's against the text; it could not
// find the footnote that gives the number of specimens (the reader took it to be six males, by its position:
// not confirmed). The wingspan and the mass are the checker's "unconfirmed": they were not opened a second time.

const R = 'Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), p. 466, Helminthophila celata lutescens (https://archive.org/download/cu31924090256888/cu31924090256888_djvu.txt)';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them (of celata, the eastern form, and for lutescens "much more brightly colored": upper parts bright olive-green, the rump and upper tail coverts brighter and more yellowish; a narrow stripe over the eye and the eyelids pale olive-yellowish; an indistinct dusky spot before the eye and a fainter dusky streak behind it; the cheek and the sides of the neck and breast light grayish olive-green; under parts distinctly yellow, bright olive-yellow to nearly gamboge, and the under tail coverts pale yellow; no wing bars on the adult; the crown tawny, but mostly hidden by grayish olive tips to the feathers; bill dusky above and paler below; iris brown; legs brownish horn in dried skins). Not found, and the agent\'s: the outline, the stance, the edgings of wing and tail (painted olive-green), how long the middle toe is (no figure for any celata form: built at 10 mm to the tarsus), the colour of the bare parts in life, any streaking of the breast (Ridgway has it, faintly, for celata only: left out), and a flight. His key says "no white orbital ring"; modern pages say a broken ring, which is painted faintly. The exposed culmen\'s mean is printed equal to its least value, 9.4: it is repeated in his key, so it is built as printed.',
  sources: {
    R: `${R}: adult males, museum skins (six, by an inference from a footnote that was not found again)`,
    W: 'Wikipedia, "Orange-crowned warbler" (read 2026-11-16, through a summary tool): wingspan 184 mm, about 9 g, live length 12 to 13 cm; a faint eye line and a broken eye ring; the crown patch usually not visible',
    B: 'Seattle Audubon, BirdWeb, Orange-crowned Warbler (through a summary tool): slender bills; stays low in bushes and small trees; gleans leaves and flowers; common in May on the Pacific Northwest coast. Read again by the agent that gave it its way (2026-11-16): "broken eye-rings, and partial eye-lines", "olive-green above and yellow below, with brighter yellow undertail coverts", "The western Washington breeders are brighter yellow than the eastern Washington breeding form"',
  },
  lengths: [
    ['wing', 'Wing, folded', 59.9, [58.2, 61.2], 'R'],
    ['tail', 'Tail', 47, [44.7, 49], 'R'],
    ['culmen', 'Exposed culmen (the mean is printed equal to the least)', 9.4, [9.4, 9.6], 'R'],
    ['tarsus', 'Tarsus', 18, [17.5, 18.3], 'R'],
    ['midToe', 'Middle toe (no figure found: the agent\'s)', 10, [9, 11], 'A'],
    ['length', 'Length, bill tip to tail tip (skins)', 109.7, [106.7, 113], 'R'],
    ['span', 'Wingspan (one secondary source)', null, [175, 195], 'W'],
  ],
  proportions: [
    'The tail four fifths of the wing (47 to 59.9: worked out from Ridgway\'s means)',
    'The tarsus nearly a third of the wing (Ridgway, of the genus)',
    'A bill much shorter than the head, fine and wedge-shaped (Ridgway, of the genus)',
  ],
  mass: 'Mass about 9 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness] (set darker than the names read). A yellow is held through
// the tone mapping only from hue 28 to about 52 and at a high saturation (life/material.js): at 56 to 60 and a
// saturation of 40 to 66, as they were first laid, the under parts came out straw and the face's marks pale blocks.
// lutescens is "much more brightly colored" than the eastern form, and BirdWeb has the western Washington birds
// "brighter yellow": its yellows are laid at 52 to 56 and saturated, an olive-yellow that the hold keeps (2026-11-16).
const BACK = [72, 44, 33], RUMP = [66, 54, 39], NAPE = [72, 40, 33], CROWN = [72, 38, 32];
const YELLOW = [54, 86, 48], BREAST = [57, 72, 43], CHEEKC = [66, 36, 36], BROW = [54, 80, 60], RING = [52, 86, 64], DUSKY = [64, 16, 20], LORE = [70, 30, 19];
const UNDERTAIL = [51, 94, 56], FLANK = [59, 60, 40];

const size = (p) => (p.x > 46 ? 1.7 : p.x > 38 ? 2.3 : 4);
const head = (p) => p.x > 39;
// a number from 0 to 1 that is the same for a place every time, to break a boundary between two colours into a few
// feathers' width of both
const jit = (p) => { const v = Math.sin(p.x * 12.9898 + p.a * 78.233 + p.y * 37.719) * 43758.5453; return v - Math.floor(v); };
// the face, about the eye (x 46.6, y 5.6, r 1.35): a broken ring round it, a narrow stripe over it, and a faint dusky
// line through it; on the side of the head only (as a share of the way round, below the crown)
const EYE = { x: 46.6, y: 5.6, r: 1.35 };
const side = (p) => p.a > 0.42 && p.a < 0.8;
const ring = (p) => { const dx = p.x - EYE.x, dy = p.y - EYE.y, d = Math.hypot(dx, dy); return side(p) && d > EYE.r + 0.05 && d < EYE.r + 1.05 && Math.abs(dx) < EYE.r * 0.95; };
const brow = (p) => side(p) && p.x > EYE.x - 3 && p.x < EYE.x + 4 && p.y > EYE.y + EYE.r + 0.6 && p.y < EYE.y + EYE.r + 1.8;
const line = (p) => side(p) && Math.abs(p.y - EYE.y - 0.15 * (p.x - EYE.x)) < 0.7 && ((p.x > EYE.x + EYE.r + 0.3 && p.x < EYE.x + 4.6) || (p.x < EYE.x - EYE.r - 0.3 && p.x > EYE.x - 4));

export default {
  name: 'Orange-crowned Warbler', latin: 'Leiothlypis celata', key: 'orange-crowned-warbler', seed: 113,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'some', source: 'B C', wave: true },
  // ---- how it lives on a visit: in the shrubs and small trees near the walk, elderberry and vine maple most of all,
  // a little higher than the other three; it flicks its tail, gleans the undersides of the leaves, now and then hovers
  // at them, and goes up to a shrub's top to sing (life/families/thicket.js, where what was read is quoted). Every
  // number is the agent's.
  way: {
    family: 'thicket', there: 0.55, gap: [40, 150],
    homeOff: 16, range: 10, apart: 28, need: 5,
    shrubs: { elder: 1, vine: 1, willow: 0.9, salmon: 0.7, club: 0.3, huckle: 0.1, bough: 0.3 },
    wet: 0.15, heights: [0.8, 4.5], high: 8,
    hz: 21, speed: 6,
    spell: [50, 150],
    // how near it lets the walker come (life/behave.js; the agent's own: no flush distance was found)
    flush: 4, startle: 9, near: 0.7, gone: 0.2,
    reach: 2.6, flee: 14,
    // seconds it keeps to the inside of the shrub after the walker has put it up
    skulk: [6, 18],
    hover: { every: [6, 20], time: [0.5, 1.1] },
    tail: { kind: 'flick', every: [2, 6] },
    chip: { every: [8, 25], reach: 25, doing: 'giving its high chip' },
    // (silent: its song is drawn as long as such a trill runs, the agent's guess, since no recording could be used)
    song: { every: [25, 70], songs: [3, 6], gap: [5, 12], time: 1.6, rate: 14, reach: 60, post: 0.6, lift: 2.5, doing: 'singing: a thin trill that drops in pitch and dies away' },
  },
  voices: {
    song: { silent: true },   // only CC BY-SA 4.0 recordings were found
    chip: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 12 cm long and 9 g: a small warbler.',
    marks: ['Plain olive-green above, olive-yellow below, brightest under the tail', 'A plain face: only a faint pale mark about the eye', 'No wing bars', 'The orange crown it is named for is nearly always hidden'],
    lives: 'Thickets and low trees by streams and in clearings, mostly low down. It gleans insects from the undersides of leaves and from flowers, moving quickly from perch to perch. In May a male sings from a twig: a thin trill that dies away at the end.',
  },
  plate: { wide: 0.34, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 53.6
    top:    [[-8, 1.8], [-2.5, 4.6], [5, 8.2], [14, 11], [24, 12], [32, 11.8], [38, 11.6], [43, 12.6], [47.5, 12.6], [50.7, 10.6], [52.6, 7.6], [53.6, 4.4]],
    bottom: [[-9.5, -0.9], [-3.4, -4.6], [5, -9], [14, -12], [23, -12.8], [31, -11.4], [38, -8.6], [44, -5.4], [49, -2.4], [53.6, 0.8]],
    half:   [[-9.5, 2], [-3.4, 5.4], [5, 9], [14, 11], [23, 11.4], [31, 10.4], [38, 9.4], [43, 9.2], [47.5, 8.2], [51, 4.8], [53.6, 1.2]],
    widest: 0.46,
    neck: [35, 44],
    eye: { x: 46.6, y: 5.6, r: 1.35 },
    bill: { culmen: 9.4, drop: 0.04, gape: 1.4 },
    wing: {
      chord: 59.9, wrist: [33, -1.8], aim: [-58, 4.6],
      up:   [[0, 1.8], [0.12, 6.8], [0.3, 8.2], [0.5, 7.2], [0.72, 4.6], [0.9, 2], [1, 0.5]],
      down: [[0, 1.2], [0.12, 3.9], [0.3, 5.4], [0.5, 5.4], [0.72, 4], [0.9, 2.2], [1, 0.5]],
      rest: 1.8, proud: 0.9,
      span: 184, shoulder: [31.5, 5.2, 8.4], arm: 25, lead: 5.5, sweep: 12, root: 46, tipChord: 18,
    },
    // a slightly notched tail, the feathers rather narrow (Ridgway, of the genus)
    tail: { length: 47, root: 0.8, rootHalf: 2.1, feathers: 12, width: 5, closed: 0.035, graded: 0, point: 0.55, droop: 0.03, tent: 3.6 },
    leg: { knee: [22, -8, 5.3], shin: 12, tarsus: 18, thick: [2.5, 1, 0.6], toes: { mid: 10, side: 7.4, hind: 7, claw: 3.6, hindClaw: 4.6 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.3, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: YELLOW, size },                                                                 // under parts distinctly yellow, bright olive-yellow to nearly gamboge (R, lutescens)
      { where: (p) => p.a > 0.12 && p.a < 0.42 && p.x > 14 && p.x < 40, colour: BREAST, size: 3 },  // the breast a little more olive-yellow (the agent's: a faint streaking in celata only)
      { where: (p) => p.a > 0.4 && p.a < 0.6 && p.x + 4 * jit(p) < 40, colour: FLANK, size: 4 },    // sides and flanks olive-yellow, tinged olive, up to the cheek
      { where: (p) => p.x <= 3 && p.a < 0.5, colour: UNDERTAIL, size: 4.6 },                    // under tail coverts yellow, brighter than the rest (R; BirdWeb)
      { where: (p) => p.a >= 0.58 && p.x <= 44, colour: BACK, size },                           // back bright olive-green (R, lutescens)
      { where: (p) => p.a >= 0.58 && p.x < 10, colour: RUMP, size: 4 },                         // rump and upper tail coverts brighter, more yellowish (R)
      { where: (p) => p.a >= 0.58 && p.x > 33 + 2 * jit(p) && p.x <= 44, colour: NAPE, size: 2.6 },   // nape a little greyer (the agent's)
      { where: (p) => p.x > 36 + 2 * jit(p) && p.a >= 0.36 && p.a < 0.58, colour: CHEEKC, size: 2.2 },     // cheek, sides of neck and of the breast light grayish olive-green (R)
      { where: (p) => p.x > 41 && p.a < 0.36 + 0.04 * jit(p), colour: YELLOW, size: 1.9 },      // the throat yellow
      { where: (p) => head(p) && p.a >= 0.58, colour: CROWN, size: 1.8 },                        // the crown olive: the tawny patch is hidden by grayish olive tips (R)
      { where: line, colour: LORE, size: 1 },                                                 // an indistinct dusky spot before the eye and a fainter dusky streak behind it (R)
      { where: brow, colour: BROW, size: 1 },                                                 // a narrow stripe over the eye pale olive-yellowish (R)
      { where: ring, colour: RING, size: 0.9 },                                                 // the eyelids pale olive-yellowish (R): a broken ring (BirdWeb, Wikipedia)
    ],
    wing: {
      web: DUSKY, edge: [72, 40, 34], tertial: [66, 16, 24], covert: [70, 26, 28], lesser: BACK, lesserEdge: [72, 40, 38],
      medianTip: null, greaterTip: null,                                                      // no wing bars on the adult (Birds of the World, via a summary)
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.4, 0.95, [72, 34, 36], 'edge']],                    // the edgings olive-green (the agent's)
      under: [56, 30, 62], underCovert: [54, 48, 66], underCovertTip: null, underBars: [],    // under wing coverts pale yellow (R, celata)
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.58, 0.84, 0.96, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: DUSKY, edge: [72, 32, 33], under: [60, 12, 40], point: 0.42 },                // dusky olive, edged olive-green (the agent's: no white patch in the outer feather, R's key)
    bill: { upper: [30, 14, 18], lower: [34, 14, 34] },                                        // maxilla dusky horn, mandible paler (R, celata)
    mouth: [8, 50, 50],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                          // iris brown (R)
    leg: [28, 22, 30],                                                                         // brownish horn (R, dried skins)
    shin: [32, 22, 38],
  },
};
