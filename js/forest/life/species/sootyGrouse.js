// Sooty Grouse, Dendragapus fuliginosus (Friedmann's Dendragapus obscurus fuliginosus): the adult male in spring.
// The female is very different, barred and browner (Friedmann), and is not built.
//
// What is published and what is not. The lengths under `published` are Friedmann's for eleven adult males of the
// coastal form (British Columbia, Washington and Oregon), and the bird is built to their means; life/measure.js
// measures the built bird against them. Friedmann names no form of the Olympic Peninsula, which lies in the range
// he gives this one. The colours follow his description of the adult male tract by tract (written for the
// south-east Alaskan form, sitkensis, to which he says this one's male is "not distinguishable"), and the bare
// parts are his (from a manuscript note of Allan Brooks'). The outline of head and body, where the eye sits, how the
// folded wing lies, the comb's size and the wingspan are in nothing that was read: they are the agent's drawing,
// for the owner to judge from the contact sheet. The length is a range for both sexes from a secondary source.
//
// How the sources were read: two agents, one reading the Internet Archive's character recognition of the scanned
// volume and one checking each line against it; none of it was seen as an image. BirdWeb and Wikipedia were read
// through a tool that returns a page's text or a summary of it, by one reader: the checker could not open BirdWeb,
// so what is from it (B, below) rests on that one reading. The voice: no recording was found under a licence
// that could be used, so its hooting is made in the page (sound/grouse.js), and its pitch is the agent's guess.
//
// Its display (life/parts/display.js): the comb over the eye, which swells; the tail, raised and spread into a fan.
// Its legs are feathered to the toes (`shape.leg.feathered`: the owls' form and code, life/parts/owl.js `feathering`).

const F = 'Friedmann 1946, The Birds of North and Middle America, Part X (U.S. National Museum Bulletin 50), Dendragapus obscurus fuliginosus, p. 75';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours of the adult male as Friedmann has them (forehead and front of the crown very dark rich chestnut-brown, the hind crown and nape fuscous; back dark bister to dark clove brown, vermiculated with umber; breast and abdomen dusky drab grey; the side and flank feathers dark, with white shafts that broaden into white wedges at their ends; vent and under tail coverts broadly tipped white; the tail fuscous to clove brown with a grey band at its tip, 15 to 22 mm on the middle pair; the feathers round the neck\'s sac largely white with broad dark tips); the bare parts (the comb deep orange-yellow, iris Vandyke brown, bill blackish, feet light brownish grey); the tarsus feathered to the toes; 20 tail feathers; the fourth primary longest and the outermost between the seventh and eighth. Not found in what was read, and the agent\'s: the wingspan (built at 680 mm; figures of 610 to 710 mm on hobby pages were not confirmed), the outline, the comb\'s size, how far the tail spreads in display, and the colours\' lightness. Whether the middle toe was measured with its claw: without, as Friedmann says.',
  sources: {
    F: `${F}: 11 adult males, museum skins, British Columbia, Washington and Oregon`,
    W: 'Wikipedia, "Sooty grouse" (read 2026-11-16 through a summary): 40 to 50 cm long and 750 to 1,300 g, both sexes; a yellow sac and a yellow comb in display',
    B: 'Seattle Audubon, BirdWeb, Sooty Grouse: wet conifer forest from sea level to timberline; on the ground in summer, on leaves, flowers, buds, berries and insects; the male hoots from high in a conifer, by the trunk, six deep hoots heard half a mile; usually single and fairly wary; males strut with tails raised and fanned',
    N: 'Mount Rainier Nature Notes, vol. 4 (National Park Service, read 2026-11-16): the hooting in five notes, the first and last two of two syllables; ventriloquial',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 221.1, [214, 238], 'F'],
    ['tail', 'Tail', 149.1, [131, 171], 'F'],
    ['culmen', 'Exposed culmen', 19.1, [18.1, 21.3], 'F'],
    ['tarsus', 'Tarsus', 44.1, [42.6, 46.3], 'F'],
    ['midToe', 'Middle toe without claw', 43.2, [40.8, 45.4], 'F'],
    ['length', 'Length, both sexes (a secondary source)', null, [400, 500], 'W'],
  ],
  proportions: [
    'The tail about two thirds of the wing (149.1 to 221.1), rounded, its feathers broad and blunt (F)',
    'The longest primaries pass the longest secondaries by nearly a third of the wing: a short, round wing (F, of the genus)',
    'The tarsus about a fifth of the wing; the middle toe nearly as long as the tarsus (F)',
  ],
  mass: 'Mass 750-1,300 g, both sexes (W); the male much the larger',
};

// Friedmann's colours, as paint: [hue, saturation, lightness]. Laid darker than the names read, as the jay's were.
const DRAB = [32, 8, 29];                       // breast and abdomen: dusty drab grey to deep quaker drab
const CLOVE = [26, 15, 14];                     // back: dark bister to dark clove brown
const UMBER = [30, 26, 25];                     // its vermiculation: Saccardo's umber to sepia
const FUSCOUS = [26, 9, 19];                    // hind crown, nape: fuscous to greyish fuscous
const FACE = [24, 10, 15];                      // lores, cheeks, ear coverts: fuscous to dark clove brown
const CHESTNUT = [15, 36, 16];                  // forehead and front of the crown
const MOUSE = [35, 6, 36];                      // deep mouse grey: the ends of the rump's feathers
const SEPIA = [27, 18, 19];                     // the side and flank feathers
const WHITE = [40, 10, 88];

// feathers are small on the head and grow down the neck; a grouse's body feathers are large
const size = (p) => (p.x > 258 ? 4.6 : p.x > 228 ? 9 : 17);

export default {
  name: 'Sooty Grouse', latin: 'Dendragapus fuliginosus', key: 'sooty-grouse', seed: 421,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'rare', source: 'B F; P regular; from sea level up, at openings and edges; the second reader: "a walker in a lowland valley rarely sees one"' },
  way: {
    // (its home, a conifer near the walk, and how it lives: its family's, life/families/fowl.js)
    family: 'fowl', there: 0.6, gap: [120, 480],
    hz: 16, speed: 12, glide: 0.4, walk: 0.3,
    flush: 5, startle: 10, near: 0.8, gone: 0.25,
    off: [6, 22], feed: [60, 240],
    tree: { high: [6, 17], stay: [240, 900] },
    hoot: { every: [14, 38], bouts: [6, 18], time: 2.8, reach: 500 },
    roar: { reach: 70 },
  },
  voices: {
    // (no recording found under a licence that could be used: made in the page, sound/grouse.js; the pitch is the agent's)
    hoot: { synth: 'grouse-hoot', level: 0.5, near: 30, pitch: 96 },
    flush: { synth: 'grouse-flush', level: 0.7, near: 6 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 45 to 50 cm long and over a kilo: the size of a small hen.',
    marks: ['Dark sooty grey all over, the flanks flecked with white', 'A broad grey band at the tip of the dark tail', 'A yellow-orange comb over the eye, swollen when he displays', 'Legs feathered to the toes'],
    lives: 'Wet conifer forest, from the valleys to the timberline. In May the male hoots from high in a conifer, close to the trunk: a few deep, far-carrying hoots that are hard to place. On the ground it walks, picking at leaves, flowers and buds, trusting its colour; come too close and it bursts up with a clatter of wings and glides off through the trunks.',
  },
  plate: { wide: 1.3, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 307
    top:    [[-45, 8], [-20, 18], [0, 26], [30, 42], [70, 55], [110, 61], [150, 60], [180, 54], [205, 45], [228, 38], [246, 37], [262, 42], [276, 46], [289, 44], [298, 37], [304, 29], [307, 23]],
    bottom: [[-55, -2], [-30, -18], [0, -36], [30, -55], [70, -70], [110, -76], [150, -71], [180, -58], [205, -42], [228, -28], [248, -16], [266, -7], [282, 1], [295, 7], [303, 10], [307, 11]],
    half:   [[-55, 8], [-30, 22], [0, 38], [30, 52], [70, 62], [110, 65], [150, 61], [180, 50], [205, 38], [228, 29], [248, 25], [266, 24], [282, 21], [295, 15], [303, 9], [307, 6]],
    widest: 0.45,
    neck: [236, 258],
    eye: { x: 286, y: 31, r: 5.4 },
    bill: { culmen: 19.1, drop: 0.16, gape: 6.5 },
    // the comb: bare skin over the eye, a ridge low in the feathers that swells in display (life/parts/display.js)
    comb: { long: 24, high: 8, rest: 0.28, wide: 6.5, ahead: 0 },
    wing: {
      chord: 221.1, wrist: [208, 12], aim: [-225, -6],
      // short and round: the secondaries end about two thirds of the way along it (F, of the genus)
      up:   [[0, 8], [0.1, 26], [0.25, 34], [0.45, 33], [0.65, 24], [0.82, 13], [0.94, 5], [1, 1.5]],
      down: [[0, 6], [0.1, 20], [0.25, 31], [0.45, 35], [0.65, 28], [0.82, 16], [0.94, 7], [1, 1.5]],
      rest: 6, proud: 4,
      span: 680, shoulder: [212, 24, 36], arm: 118, lead: 22, sweep: 34, root: 170, tipChord: 100,
    },
    // 20 broad feathers with blunt ends, the tail a little rounded (F); spread into a fan in display
    tail: { length: 149.1, root: 6, rootHalf: 10, feathers: 20, width: 25, closed: 0.1, graded: 12, point: 0.92, droop: 0.02, tent: 9, fan: { spread: 1.25 } },
    // feathered to the toes (F: "completely clothed (except on heel)" with feathers over most of the middle toe's first joint)
    leg: { knee: [118, -48, 30], shin: 72, tarsus: 44.1, thick: [24, 7.5, 4.6], toes: { mid: 43.2, side: 33, hind: 12, claw: 9, hindClaw: 6 }, splay: 0.45, feathered: { to: 'toes', full: 1 } },
  },
  // Poses the contact sheet shows, and the forest's behaviours start from (life/rig.js says what each number is;
  // `display`, `reach` and `dip` are life/parts/display.js's and life/parts/gait.js's)
  poses: {
    perched: { pitch: 0.22, lift: 0.76, head: { pitch: 0.12 }, tail: { pitch: 0.04 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.35 }, feet: { mode: 'tuck' } },
    // in its tree, on a limb by the trunk; and hooting there, the comb swollen and the tail cocked and half spread
    branch: { pitch: 0.34, lift: 0.5, head: { pitch: 0.1 }, tail: { pitch: -0.2 }, feet: { mode: 'grip', round: 0.045 }, perch: 0.045 },
    hoot: { pitch: 0.42, lift: 0.52, head: { pitch: 0.32 }, tail: { pitch: 0.35, fan: 0.55 }, feet: { mode: 'grip', round: 0.045 }, perch: 0.045, display: 0.85, gape: 0.12 },
    // strutting on the ground: the tail raised and fanned, the wings let down, the comb swollen
    display: { pitch: 0.12, lift: 0.72, head: { pitch: -0.1 }, tail: { pitch: 1.2, fan: 1.25 }, droop: 0.12, feet: { mode: 'flat' }, display: 1 },
    // pecking at the ground
    peck: { pitch: -0.32, lift: 0.62, head: { pitch: -0.9 }, tail: { pitch: 0.06 }, feet: { mode: 'flat' }, reach: 0.03, dip: 0.032 },
  },
  plumage: {
    body: [
      { colour: DRAB, size },                                                                   // breast and abdomen dusty drab grey to deep quaker drab (F)
      { where: (p) => p.a > 0.56 && p.x >= 10, colour: CLOVE, bars: [UMBER, 3, 0.05], size },   // back dark bister to dark clove brown, vermiculated with umber (F)
      { where: (p) => p.a > 0.5 && p.x < 10, colour: [27, 13, 20], edge: MOUSE, fringe: 0.3, bars: [[25, 10, 10], 2, 0.04], size: 18 },   // rump and upper tail coverts sepia to clove brown, deep mouse grey at the end, vermiculated (F)
      { where: (p) => p.a > 0.2 && p.a <= 0.56 && p.x > 15 && p.x < 195, colour: SEPIA, shaft: WHITE, shaftWidth: 0.32, edge: WHITE, fringe: 0.16, size },   // sides and flanks: white shafts broadening into white wedges (F)
      { where: (p) => p.a <= 0.22 && p.x > -10 && p.x < 70, colour: DRAB, edge: WHITE, fringe: 0.34, size },   // lower abdomen and vent broadly tipped white (F)
      { where: (p) => p.x <= -10 && p.a < 0.5, colour: [26, 13, 15], edge: WHITE, fringe: 0.42, size: 18 },    // under tail coverts darker, broadly tipped white (F)
      { where: (p) => p.x >= 205 && p.a > 0.56, colour: FUSCOUS, size },                        // hind neck and nape (F)
      { where: (p) => p.x >= 212 && p.x < 252 && p.a > 0.22 && p.a <= 0.56, colour: WHITE, edge: [26, 20, 13], fringe: 0.55, size: 8 },   // round the neck's sac, white feathers broadly tipped dark sepia (F)
      { where: (p) => p.x >= 248 && p.a <= 0.4, colour: [25, 12, 20], size },                   // chin and throat clove brown (F)
      { where: (p) => p.x >= 262 && p.a <= 0.24, colour: [25, 12, 20], shaft: WHITE, shaftWidth: 0.22, size: 4 },   // the upper throat with its white bases showing (F)
      { where: (p) => p.x >= 258 && p.a > 0.4 && p.a <= 0.78, colour: FACE, size },             // lores, cheeks and ear coverts (F)
      { where: (p) => p.x >= 252 && p.a > 0.78, colour: FUSCOUS, size },                        // hind crown and occiput (F)
      { where: (p) => p.x >= 280 && p.a > 0.74, colour: CHESTNUT, size: 3.8 },                  // forehead and front of crown very dark rich chestnut-brown (F)
    ],
    wing: {
      web: [26, 14, 15], edge: [30, 10, 21], tertial: [28, 9, 22], covert: [27, 15, 17], lesser: [32, 22, 25], lesserEdge: [28, 10, 13],
      medianTip: [[34, 7, 30], 0.12], greaterTip: [[34, 7, 33], 0.16],                          // greater coverts narrowly edged and tipped dusky mouse grey to dark drab (F)
      tertialTip: [[33, 6, 30], 0.16],                                                           // the innermost secondaries broadly grey or drab at the end (F)
      patchSkip: 0,
      primaryBars: [[0.3, 0.8, [31, 11, 24], 'outer']],                                        // some of the remiges flecked with drab on the outer webs (F)
      secondaryBars: [],
      under: [30, 8, 33], underCovert: [32, 16, 29], underCovertTip: null, underBars: [],     // under wing coverts like the lesser upper ones (F)
      fold: { primaries: 8, secondaries: 7, secondaryEnd: 0.68, greater: 9, greaterEnd: 0.45, median: 8, medianEnd: 0.27, feather: 1.6 },   // (feather: the raptors' field)
      spread: { primaries: 9, secondaries: 9, shape: [0.85, 0.95, 0.99, 1, 0.99, 0.96, 0.9, 0.84, 0.78] },
    },
    // fuscous to clove brown, the band at the tip mouse grey to light quaker drab, 15 to 22 mm on the middle pair (F)
    tail: { web: [25, 10, 13], edge: [28, 8, 18], under: [26, 8, 17], point: 0.9, band: [[0.865, 1, [38, 8, 50]]] },
    bill: { upper: [30, 6, 10], lower: [30, 6, 12] },                                          // bill blackish (F)
    mouth: [350, 20, 30],
    eye: { iris: [22, 40, 18], pupil: [240, 15, 5] },                                           // iris Vandyke brown (F)
    leg: [30, 9, 42],                                                                           // feet light brownish grey (F); the tarsus's feathers grey
    shin: [30, 8, 30],
    comb: [36, 90, 52],                                                                         // the comb deep orange-yellow (F)
  },
};
