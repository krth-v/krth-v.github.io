// MacGillivray's Warbler, Geothlypis tolmiei (Ridgway's Oporornis tolmiei): the adult male in spring and summer.
//
// What is published and what is not. The lengths under `published` are Ridgway's for nine adult males (skins),
// and the bird is built to their means; life/measure.js measures the built bird against them. The colours follow
// his description of the adult male tract by tract, with Wikipedia and BirdWeb for what he lacks (the white
// crescents on the eyelids, the dusky wing and tail). The outline of head and body, where the eye sits, how the
// folded wing lies, the wing's and the tail's shape (none was found in what was read) and the stance are in
// nothing that was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, through page text and the character
// recognition of Ridgway's scan (Internet Archive). No page was seen as an image. Ridgway's single table is of
// nine skins of the whole western form, with no locality: it is not shown to be of the Pacific Northwest birds.

const R = "Ridgway 1902, The Birds of North and Middle America, Part II (U.S. National Museum Bulletin 50), p. 631-632, Oporornis tolmiei, adult male in spring and summer";

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them (head and neck slate, deepening to black on the lores and the rictal region; a conspicuous white spot on each eyelid, smaller and further back on the upper; throat and chest darker slate, the feathers more or less margined with pale grey, never a solid black patch; back and the rest of the upper parts plain olive-green, duller on the back; underparts clear lemon yellow, becoming yellowish olive-green on the sides and flanks; the outer web of the outermost primary edged with white; bill dusky above and pale brownish below; iris brown; legs light brownish). From Wikipedia: wings and tail blackish brown with olive-green edges, wide white crescents above and below the eye; no wing bars are described by either source and none is built. Ridgway says the chin is sometimes white: left out. The iris is brown in Ridgway and black in Wikipedia: built dark brown. Not found in what was read, and the agent\'s: the outline, the wing\'s and tail\'s shape, how far the primaries project, the stance, how dark the hood is against the back, and the white edge of the outermost primary (not painted: the painter has no mark for a single feather\'s edge). Whether the middle toe was measured with its claw is not said; it is built without.',
  sources: {
    R: `${R}: nine adult males, museum skins. The scan of one copy prints the wing\'s least value illegibly; the other copy, 59.4, is used`,
    W: 'Wikipedia, "MacGillivray\'s warbler" (read 2026-11-16): 10 to 15 cm long, wingspan 19 cm, 9 to 13 g; plumage and bare parts',
    B: 'Seattle Audubon, BirdWeb, MacGillivray\'s Warbler: understory and ground, dense thickets, flicks its tail from side to side while foraging, "rare along the outer coast"; read again by the agent that gave it its way (2026-11-16): "Males\' hoods are dark charcoal gray", "Both sexes have white crescents above and below their eyes"',
  },
  lengths: [
    ['wing', 'Wing, folded', 62.2, [59.4, 65], 'R'],
    ['tail', 'Tail', 55.6, [52.8, 63], 'R'],
    ['culmen', 'Exposed culmen', 11.4, [10.9, 11.7], 'R'],
    ['tarsus', 'Tarsus', 21.6, [20.6, 22.9], 'R'],
    ['midToe', 'Middle toe (the claw is not said to be included)', 13.2, [12.7, 13.7], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 125.7, [118.6, 138.2], 'R'],
    ['span', 'Wingspan (one secondary source, both sexes)', null, [180, 200], 'W'],
  ],
  proportions: [
    'The tail nine tenths of the wing (55.6 to 62.2: worked out from Ridgway\'s means); his key calls it decidedly longer than the Mourning Warbler\'s',
    'The tarsus long for the bird: over a third of the wing',
  ],
  mass: 'Mass 9 to 13 g (W; both sexes, no mean)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]. Set darker than their names read: BirdWeb has the male's
// hood "dark charcoal gray". The yellow is laid where the tone mapping holds a yellow (life/material.js: hue 28 to about
// 52, saturated), and the flanks' olive-yellow at 58, where it holds part of it: at 64 and a saturation of 46, as
// first laid, the side was khaki with yellow only along the keel (2026-11-16).
const SLATE = [210, 8, 24], SLATE_DARK = [215, 8, 15], SLATE_EDGE = [208, 6, 30], BLACK = [60, 8, 8], WHITE = [52, 10, 86];
const YELLOW = [51, 90, 50], FLANK = [57, 66, 41], OLIVE = [78, 34, 31], RUMP = [76, 42, 35], DUSKY = [40, 12, 17], EDGE = [76, 34, 32];

const size = (p) => (p.x > 40 ? 1.9 : p.x > 34 ? 2.6 : 4);
// a number from 0 to 1 that is the same for a place every time, to break a boundary between two colours into a few
// feathers' width of both
const jit = (p) => { const v = Math.sin(p.x * 12.9898 + p.a * 78.233 + p.y * 37.719) * 43758.5453; return v - Math.floor(v); };
// the hood's edge: lowest on the breast, where it comes furthest back, and rising round the side to the nape (as a
// share of the way round: 0 the belly's midline, 1 the back's)
const hood = (p) => p.x > 30.5 + 6.5 * p.a + 2.4 * (jit(p) - 0.5);
// the white of the eyelids (eye at x 50.5, y 7.1, r 1.5): a crescent below the eye, and above it one smaller and
// further back (R: "smaller and further back on the upper"), each close round the eye and broken before and behind it
const lid = (p) => {
  const dx = p.x - 50.5, dy = p.y - 7.1, d = Math.hypot(dx, dy);
  if (p.a < 0.4 || p.a > 0.86) return false;
  return (dy < -0.45 && Math.abs(dx) < 1.75 && d > 1.65 && d < 2.85) || (dy > 0.55 && dx > -2.1 && dx < 0.7 && d > 1.65 && d < 2.55);
};
// the black of the lores and the rictal region, in front of the eye and down to the bill
const lores = (p) => p.x > 52.4 && p.y > 3 && p.y < 8.4 && p.a > 0.35 && p.a < 0.86;

export default {
  name: "MacGillivray's Warbler", latin: 'Geothlypis tolmiei', key: 'macgillivrays-warbler', seed: 149,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'few', source: 'B C, and BirdWeb\'s text: rare on the outer coast' },
  // ---- how it lives on a visit: in the densest, lowest shrubs near the walk, salmonberry and devil's club most of all,
  // and on the ground under them; it flicks its tail from side to side, is shy, and sings mostly at dawn and dusk, from
  // the top of a shrub (life/families/thicket.js, where what was read is quoted). Every number is the agent's.
  way: {
    family: 'thicket', there: 0.5, gap: [60, 200],
    homeOff: 14, range: 8, apart: 30, need: 5,
    shrubs: { salmon: 1, club: 1, willow: 0.6, elder: 0.4, vine: 0.4, huckle: 0.2 },
    wet: 0.2, dense: 1, heights: [0.15, 2], high: 4,
    hz: 20, speed: 5.5,
    spell: [40, 120],
    // how near it lets the walker come (life/behave.js; the agent's own: "shy, secretive birds", and no distance was found)
    flush: 6, startle: 13, near: 0.6, gone: 0.25,
    reach: 1.8, flee: 14,
    // seconds it keeps to the inside of the shrub after the walker has put it up
    skulk: [12, 30],
    ground: { every: [10, 30], stay: [3, 8] },
    tail: { kind: 'side', every: [1.5, 4.5] },
    chip: { every: [10, 30], reach: 30, doing: 'giving a harsh chip note' },
    // (a song as long as the recording played for it; its runs four times as often at dawn and dusk as by day)
    song: { every: [60, 160], dawn: 0.25, songs: [3, 8], gap: [5, 12], time: 1.6, rate: 8, reach: 80, post: 0.7, lift: 3, doing: 'singing: a loud, rolling song' },
  },
  voices: {
    song: { file: 'macgillivray-song.mp3', level: 0.4, near: 5,
      credit: { what: "MacGillivray's Warbler, song", by: 'J. Job, National Park Service, Rocky Mountain NP sound library, 2015', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-macgillivrayswarbler.htm', bytes: 807446, kept: 1.6 } },
    // (silent: no recording of its chip was found under a licence that could be used)
    chip: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 13 cm long and 10 g: a small, long-tailed warbler.',
    marks: ['A slate-grey hood that runs down to the chest', 'Two white crescents, above and below the eye', 'Plain olive-green above, clear yellow below', 'It flicks its tail from side to side as it feeds'],
    lives: 'Dense, low thickets: willow and alder along the river, and the edges of openings. It stays near the ground and is hard to see, but the male gives itself away with a loud, rolling song, mostly at dawn and dusk, now and then from a higher perch. It picks insects from the leaves and the ground.',
  },
  plate: { wide: 0.3, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 58.7
    top:    [[-9, 2], [-3, 5], [6, 9.4], [16, 12.6], [26, 13.6], [35, 13.4], [43, 12.6], [49, 12.8], [53.5, 11.8], [56.6, 9.2], [58, 6.3], [58.7, 4.1]],
    bottom: [[-10, -1], [-4, -5.4], [5, -10.6], [15, -13.6], [25, -14.2], [34, -12.8], [42, -9.6], [48, -5.8], [53, -2.6], [56.5, -0.2], [58.7, 0.9]],
    half:   [[-10, 2.3], [-4, 6], [5, 9.6], [15, 12], [25, 12.3], [34, 11], [42, 9], [48, 8.2], [53, 6.2], [56.3, 3.6], [58.7, 1.6]],
    widest: 0.46,
    neck: [38, 49],
    eye: { x: 50.5, y: 7.1, r: 1.5 },
    bill: { culmen: 11.4, drop: 0.04, gape: 1.6 },
    wing: {
      chord: 62.2, wrist: [36, -1.8], aim: [-62.2, 5],
      up:   [[0, 1.8], [0.12, 6.8], [0.3, 8.2], [0.5, 7.2], [0.72, 4.6], [0.9, 2], [1, 0.5]],
      down: [[0, 1.3], [0.12, 4], [0.3, 5.5], [0.5, 5.5], [0.72, 4], [0.9, 2.1], [1, 0.5]],
      rest: 1.8, proud: 1,
      span: 190, shoulder: [34, 5.8, 9], arm: 26, lead: 6, sweep: 13, root: 44, tipChord: 19,
    },
    // long, squared: nothing was found of its tip's shape
    tail: { length: 55.6, root: 0.9, rootHalf: 2.2, feathers: 12, width: 5.8, closed: 0.035, graded: 1.5, point: 0.6, droop: 0.03, tent: 3.6 },
    leg: { knee: [24, -8, 5.6], shin: 13, tarsus: 21.6, thick: [2.7, 1.1, 0.7], toes: { mid: 13.2, side: 9.6, hind: 8.6, claw: 4, hindClaw: 5 }, splay: 0.55 },
  },
  poses: {
    // on a twig: level, the tail held out behind
    perched: { pitch: 0.3, lift: 0.45, head: { pitch: 0.06 }, tail: { pitch: -0.1, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    // on the ground: low and level on flat feet, the tail a little up
    ground: { pitch: 0.12, lift: 0.4, head: { pitch: 0.08 }, tail: { pitch: 0.25, fan: 0.03 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.22 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: YELLOW, size },                                                                 // underparts clear lemon yellow (R)
      { where: (p) => p.a > 0.36 + 0.06 * jit(p) && p.a < 0.62, colour: FLANK, size: 4 },          // becoming yellowish olive-green on the sides and flanks (R), up to the hood
      { where: (p) => p.a >= 0.6 && p.x <= 40, colour: OLIVE, size },                           // upper parts plain olive-green, duller on the back (R)
      { where: (p) => p.a >= 0.6 && p.x < 9, colour: RUMP, size: 4 },                           // rump and upper tail coverts brighter (W: yellowish olive-green)
      { where: hood, colour: SLATE, size: 2 },                                                  // head and neck slate (R): a hood, dark charcoal grey (B)
      { where: (p) => hood(p) && p.a < 0.38 && p.x < 50, colour: SLATE_DARK, edge: SLATE_EDGE, fringe: 0.12, size: 2.2 },   // throat and chest darker slate, the feathers margined pale grey (R)
      { where: lores, colour: BLACK, size: 1.6 },                                               // deepening into black on the lores and rictal region (R)
      { where: lid, colour: WHITE, size: 1.2 },                                                 // a conspicuous white spot on each eyelid (R); crescents above and below (W)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: [40, 12, 20], covert: [74, 26, 27], lesser: OLIVE, lesserEdge: [76, 34, 34],
      medianTip: null, greaterTip: null,                                                        // no wing bars described by either source
      patchSkip: 0,
      primaryBars: [], secondaryBars: [],                                                       // blackish brown with olive-green edges (W)
      tertialTip: null,
      under: [50, 10, 48], underCovert: [54, 40, 66], underCovertTip: null, underBars: [],      // under the wing: not described in what was read; pale, a little yellow, as the underparts
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.7, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.62, 0.86, 0.97, 1, 1, 1, 1, 0.98, 0.95] },
    },
    tail: { web: DUSKY, edge: [76, 30, 30], under: [50, 8, 36], point: 0.45 },                  // blackish brown with olive-green edges (W)
    bill: { upper: [30, 16, 16], lower: [30, 28, 56] },                                         // dusky above, pale pinkish buff below (R, W)
    mouth: [20, 60, 50],
    eye: { iris: [22, 40, 10], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [24, 30, 44],                                                                          // light brownish (R); pinkish brown here
    shin: [28, 30, 40],
  },
};
