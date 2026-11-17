// Ruffed Grouse, Bonasa umbellus castanea (the Olympic Ruffed Grouse): the adult male, brown phase. Friedmann puts
// the Olympic Peninsula in a race of its own, castanea, "the darkest and most richly colored of all the
// predominantly brown races", in which no grey bird was seen and the black ruff is commoner than the auburn.
//
// What is published and what is not. The lengths under `published` are Friedmann's for eleven adult males from the
// Olympic Peninsula, and the bird is built to their means; life/measure.js measures the built bird against them.
// His culmen is measured from the base, not where the feathers end: the bill is built with 9 mm of it under the
// forehead's feathers (the agent's number), so that the length measured from its base is his. The colours are his:
// castanea's own where he gives them (the upperparts, the underparts' wash and bars, the tail's colour, the ruff),
// and otherwise the nominate male's, which is the only one he describes tract by tract, with the differences he
// gives for the Pacific races. The bare parts and the iris are as one reader had them and no second checked. The
// outline of head and body, where the eye sits, how the folded wing lies, the crest's, the ruff's and the comb's
// sizes, and how far the tail spreads are in nothing that was read: they are the agent's drawing.
//
// How the sources were read: two agents, one reading the Internet Archive's character recognition of the scanned
// volume and one checking the measurements and the castanea paragraph against it; none of it was seen as an image.
// Wikipedia and BirdWeb were read through a tool that returns a page's text or a summary of it. The drum is made in
// the page (sound/grouse.js), timed from a public-domain recording of the National Park Service's (Yellowstone).
//
// Its display (life/parts/display.js): the black ruffs on the sides of the neck, raised; the tail, raised and spread
// into a fan; a small comb over the eye. The upper half of its tarsus is feathered and the lower half bare (F); the
// owls' `shape.leg.feathered` feathers a whole tarsus, so it is not asked for here, and the tarsus is drawn bare.

const F = 'Friedmann 1946, The Birds of North and Middle America, Part X (U.S. National Museum Bulletin 50), Bonasa umbellus castanea, p. 169';

export const published = {
  shown: 'adult male, brown phase',
  note: 'Published: the lengths above (the middle toe\'s greatest is not legible in the scan), and the colours: the upperparts deep chestnut to dark auburn with no grey (castanea); the black markings above extensive, the back\'s feathers with pale shaft spots edged black; chin, throat, breast, sides, flanks and under tail coverts heavily washed ochraceous-buff, the ventral bars Dresden brown to raw umber, darker on the flanks (castanea); the tail auburn to bay (castanea), its wavy black bars doubled with a pale band between (castanea and sabini), with a broad black band near the tip, edged with grey on each side (the nominate\'s text); the primaries\' outer webs buffy white with dusky triangular bars; the ruff black with a slight bluish sheen (castanea, the commoner form); a bare space over the eye, orange or red in the male in summer; the crest; 18 to 20 tail feathers; the tarsus\'s lower part bare (23.5 mm of its 45.3). Not found in what was read, and the agent\'s: the outline, the bill\'s hidden base (9 mm), the sizes of the crest, the ruff and the comb, how the tail spreads in display, the lightness of every colour, and the leg, bill and iris colours\' wording (one reader, unchecked).',
  sources: {
    F: `${F}: 11 adult males, museum skins, the Olympic Peninsula`,
    G: 'Friedmann 1946, the same volume, p. 153: the genus Bonasa, "length about 394-482 mm" (both sexes)',
    W: 'Wikipedia, "Ruffed grouse" (read 2026-11-16 through a summary): 40 to 50 cm long, wingspan 50 to 64 cm, 450 to 750 g; drums on a log, a stone or a mound, the wings beating the air, slow at first and quickening, heard about 400 m off; bursts into flight with loud wingbeats when startled',
    B: 'Seattle Audubon, BirdWeb, Ruffed Grouse: woods along rivers, most often near cottonwood, bigleaf maple, vine maple and Sitka spruce; forages on the ground and in shrubs and trees; the male drums from a log, ruff raised and tail fanned',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 182.8, [176, 187], 'F'],
    ['tail', 'Tail', 153.9, [145, 168], 'F'],
    ['culmen', 'Culmen from the base', 27.8, [25.6, 29.9], 'F'],
    ['tarsus', 'Tarsus', 45.3, [43.6, 48], 'F'],
    ['midToe', 'Middle toe without claw', 40.7, [38.9, '?'], 'F'],
    ['length', 'Length, the genus, both sexes', null, [394, 482], 'G'],
    ['span', 'Wingspan (one secondary source)', null, [500, 640], 'W'],
  ],
  proportions: [
    'The tail nearly as long as the wing (153.9 to 182.8), fan-shaped and rounded (F)',
    'The longest primaries pass the longest secondaries by about a third of the wing: a short, round, deeply cupped wing (F, of the genus)',
    'The tarsus under a quarter of the wing; the middle toe shorter than the tarsus (F)',
  ],
  mass: 'Mass 450-750 g (W)',
};

// Friedmann's colours, as paint: [hue, saturation, lightness]. Laid darker than the names read.
const AUBURN = [12, 46, 21];                    // the upperparts deep chestnut to dark auburn (castanea)
const HAZEL = [19, 50, 28];                     // crown and nape: orange-cinnamon, cinnamon-rufous or hazel (the Pacific races)
const BLACK = [25, 14, 8];
const SPOT = [36, 42, 68];                      // the back's shaft spots, tilleul buff to vinaceous-buff
const OCHRE = [36, 56, 58];                     // the underparts' heavy ochraceous-buff wash (castanea)
const DRESDEN = [30, 36, 28];                   // the ventral bars, Dresden brown to raw umber (castanea)
const MUMMY = [25, 34, 18];                     // darkening to mummy brown on the sides and flanks (castanea)
const PALE = [40, 34, 72];                      // the lower breast and abdomen, greyish white washed buff
const BAY = [10, 52, 25];                       // the tail auburn to bay (castanea)
const SMOKE = [38, 10, 58];                     // smoke grey (the nominate's tail tip: castanea's not described)
const FUSC = [24, 14, 18];                      // fuscous

// feathers are small on the head and grow down the neck
const size = (p) => (p.x > 232 ? 4.5 : p.x > 204 ? 8 : 15);
// the tail's paired bars: two wavy black bars with a pale ochraceous band between, at each of these shares of its length
const pairs = [0.16, 0.28, 0.4, 0.52, 0.64].flatMap((t) => [[t, t + 0.014, BLACK], [t + 0.014, t + 0.026, [38, 46, 62]], [t + 0.026, t + 0.04, BLACK]]);

export default {
  name: 'Ruffed Grouse', latin: 'Bonasa umbellus', key: 'ruffed-grouse', seed: 422,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'few', source: 'B F; P regular; maple, alder and spruce along rivers' },
  way: {
    // (its home, a drumming log near the walk, and how it lives: its family's, life/families/fowl.js)
    family: 'fowl', there: 0.7, gap: [120, 420],
    hz: 20, speed: 11, glide: 0.35, walk: 0.28,
    flush: 4, startle: 9, near: 0.8, gone: 0.2,
    off: [6, 20], feed: [45, 200],
    log: { stay: [300, 1000] },
    drum: { every: [150, 330], time: 7.6, reach: 400 },
    roar: { reach: 70 },
  },
  voices: {
    // (made in the page, sound/grouse.js: thumps of a low tone, timed from the National Park Service's recording)
    drum: { synth: 'grouse', level: 0.5, near: 25, pitch: 54 },
    flush: { synth: 'grouse-flush', level: 0.7, near: 6 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 45 cm long, a third of it tail, and 450 to 750 g: a small chicken.',
    marks: ['Rich chestnut above, barred and spotted', 'A fan-shaped tail with a broad black band near its tip', 'Black ruffs on the sides of the neck', 'A small crest'],
    lives: 'Woods along the rivers, among maple, alder and spruce. In spring the male drums from a fallen log: standing upright he beats the air with his wings, slow thumps that run together into a roll, heard a quarter of a mile off. It walks the floor picking at buds and leaves and sits tight while you pass, until you are close: then it explodes up and away through the trunks.',
  },
  plate: { wide: 1.15, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 277
    top:    [[-38, 5], [-15, 14], [10, 26], [40, 39], [75, 49], [110, 53], [140, 52], [168, 46], [190, 37], [206, 32], [222, 31], [237, 35], [250, 39], [262, 38], [270, 32], [275, 25], [277, 20]],
    bottom: [[-46, -2], [-22, -15], [0, -28], [28, -44], [58, -56], [90, -62], [120, -61], [148, -54], [172, -42], [192, -29], [210, -18], [226, -9], [242, -2], [256, 4], [268, 8], [277, 10]],
    half:   [[-46, 7], [-22, 17], [0, 30], [30, 42], [62, 51], [95, 53], [128, 50], [158, 42], [182, 31], [202, 24], [218, 22], [234, 21], [250, 19], [262, 15], [271, 10], [277, 5.5]],
    widest: 0.45,
    neck: [208, 230],
    eye: { x: 259, y: 25, r: 4.6 },
    // the culmen from the base, 9 mm of it under the forehead's feathers
    bill: { culmen: 27.8, drop: 0.14, gape: 7 },
    brow: { over: 9 },                                                                          // the forehead's feathers over the bill's base and nostrils
    // the crest, carried low: [where on the crown it is rooted, its length, how far back from upright it leans
    // (radians), its half-depth and half-width at the root, how much further back its tip sweeps]
    crest: { sunk: 3, lobes: [[263, 16, 1.25, 4.2, 4.6, 0.25], [254, 25, 1.18, 5.2, 5.6, 0.3], [245, 31, 1.12, 5.6, 6, 0.32]] },
    // a small comb over the eye, and the ruffs, which lie back along the sides of the neck (life/parts/display.js)
    comb: { long: 12, high: 3, rest: 0.4, wide: 4, ahead: -0.05 },
    ruff: { long: 44, at: 206, around: [0.34, 0.68], wide: 19, fan: 0.6, raise: 1.35, tilt: 0.12 },
    wing: {
      chord: 182.8, wrist: [182, 10], aim: [-185, -4],
      up:   [[0, 7], [0.1, 22], [0.25, 29], [0.45, 28], [0.65, 21], [0.82, 11], [0.94, 4], [1, 1.2]],
      down: [[0, 5], [0.1, 17], [0.25, 26], [0.45, 29], [0.65, 24], [0.82, 14], [0.94, 6], [1, 1.2]],
      rest: 5, proud: 3.5,
      span: 570, shoulder: [184, 20, 31], arm: 98, lead: 18, sweep: 28, root: 142, tipChord: 86,
    },
    // 18 broad feathers, fan-shaped (F); spread into a half circle in display
    tail: { length: 153.9, root: 5, rootHalf: 9, feathers: 18, width: 27, closed: 0.11, graded: 8, point: 0.94, droop: 0.015, tent: 8, fan: { spread: 1.35 } },
    // the upper half of the tarsus feathered, the lower bare (F: 23.5 of its 45.3 mm bare): drawn bare (see above)
    leg: { knee: [100, -40, 26], shin: 62, tarsus: 45.3, thick: [20, 6.5, 4.2], toes: { mid: 40.7, side: 31, hind: 11, claw: 8.5, hindClaw: 5.5 }, splay: 0.45 },
  },
  // Poses the contact sheet shows, and the forest's behaviours start from (life/rig.js says what each number is;
  // `display`, `reach` and `dip` are life/parts/display.js's and life/parts/gait.js's)
  poses: {
    perched: { pitch: 0.2, lift: 0.76, head: { pitch: 0.12 }, tail: { pitch: 0.04 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.4 }, feet: { mode: 'tuck' } },
    // on its log, strutting: the ruffs raised, the tail raised and fanned, the wings let down
    display: { pitch: 0.1, lift: 0.72, head: { pitch: -0.15 }, tail: { pitch: 1.3, fan: 1.35 }, droop: 0.12, feet: { mode: 'flat' }, display: 1 },
    // drumming: upright on the log, braced on its tail, the wings spread and swept forward (one beat of the drum)
    drum: { pitch: 0.86, lift: 0.86, head: { pitch: 0.1 }, tail: { prop: 0.01, fan: 0.6 }, spread: 1, flap: -0.15, sweep: -0.75, hand: 0.05, feet: { mode: 'flat' } },
    // on a limb (flushed up into a tree): crouched, gripping
    branch: { pitch: 0.3, lift: 0.56, head: { pitch: 0.1 }, tail: { pitch: -0.15 }, feet: { mode: 'grip', round: 0.035 }, perch: 0.035 },
    peck: { pitch: -0.32, lift: 0.62, head: { pitch: -0.9 }, tail: { pitch: 0.06 }, feet: { mode: 'flat' }, reach: 0.025, dip: 0.021 },
  },
  plumage: {
    body: [
      { colour: OCHRE, bars: [DRESDEN, 1, 0.24], size },                                       // breast heavily washed ochraceous-buff, barred Dresden brown (castanea)
      { where: (p) => p.a < 0.25 && p.x > 25 && p.x < 135, colour: PALE, bars: [[30, 32, 40], 1, 0.22], size },     // lower breast and abdomen greyish white crossed by broad brown bands (F)
      { where: (p) => p.a < 0.09 && p.x > 45 && p.x < 115, colour: PALE, size },               // the middle of the abdomen plain (F)
      { where: (p) => p.a >= 0.22 && p.a <= 0.56 && p.x > 25 && p.x < 172, colour: [32, 42, 48], bars: [MUMMY, 2, 0.17], size },   // sides and flanks, broadly barred darker (F)
      { where: (p) => p.x <= -6 && p.a < 0.5, colour: [32, 44, 50], edge: [40, 20, 88], fringe: 0.4, size },    // under tail coverts clay colour to cinnamon-buff, broadly tipped white (F)
      { where: (p) => p.a > 0.56 && p.x >= 26 && p.x < 206, colour: AUBURN, shaft: SPOT, shaftWidth: 0.28, bars: [BLACK, 2, 0.07], size },   // back deep chestnut to dark auburn, black-marked, with pale shaft spots (F)
      { where: (p) => p.a > 0.5 && p.x < 26, colour: [15, 44, 23], bars: [BLACK, 4, 0.04], edge: [28, 26, 38], fringe: 0.2, size },     // rump and upper tail coverts, crossed by narrow black bands (F)
      { where: (p) => p.a > 0.56 && p.x >= 206, colour: HAZEL, bars: [BLACK, 2, 0.06], size },  // nape and hind neck (F)
      { where: (p) => p.x >= 228 && p.a < 0.36, colour: [38, 54, 66], size },                   // throat light ochraceous-buff (F)
      { where: (p) => p.x >= 228 && p.a >= 0.2 && p.a < 0.36, colour: [38, 54, 66], edge: BLACK, fringe: 0.2, size },   // its sides scalloped with fuscous-black tips (F)
      { where: (p) => p.x >= 262 && p.a < 0.24, colour: [40, 34, 80], size: 3.6 },              // chin whitish washed buff (F)
      { where: (p) => p.x >= 236 && p.a >= 0.36 && p.a < 0.76, colour: [26, 44, 32], edge: BLACK, fringe: 0.15, size },    // cheeks and ear coverts sayal brown, black-edged (F)
      { where: (p) => p.x >= 264 && p.a >= 0.5 && p.a < 0.68, colour: [28, 40, 70], size: 3 },  // the loreal stripe pale pinkish buff (F)
      { where: (p) => p.x >= 236 && p.a >= 0.76, colour: HAZEL, bars: [BLACK, 2, 0.08], size },   // crown barred with blackish (F)
    ],
    wing: {
      web: FUSC, edge: [26, 40, 36], tertial: [22, 40, 27], covert: [22, 46, 27], lesser: [22, 44, 25], lesserEdge: BLACK,
      medianTip: [[36, 34, 56], 0.14], greaterTip: [[34, 30, 50], 0.1],                      // the coverts' pale buffy-white streaks, ending at their tips (F)
      tertialTip: [[30, 14, 36], 0.12],                                                         // the secondaries tipped drab (F)
      patchSkip: 0,
      // the primaries' outer webs buffy white with dusky triangular bars, fading on the outer third (F)
      primaryBars: [[0.12, 0.72, [38, 30, 76], 'outer'], [0.2, 0.25, FUSC, 'outer'], [0.31, 0.36, FUSC, 'outer'], [0.42, 0.47, FUSC, 'outer'], [0.53, 0.58, FUSC, 'outer']],
      secondaryBars: [[0.2, 0.86, [26, 34, 34], 'outer']],                                     // the secondaries' outer webs broadly edged sayal brown (F)
      under: [35, 12, 58], underCovert: [32, 30, 52], underCovertTip: [[40, 20, 84], 0.3], underBars: [],     // under wing coverts with whitish streaks (F)
      fold: { primaries: 8, secondaries: 7, secondaryEnd: 0.68, greater: 9, greaterEnd: 0.45, median: 8, medianEnd: 0.27, feather: 1.5 },   // (feather: the raptors' field)
      spread: { primaries: 9, secondaries: 9, shape: [0.84, 0.95, 1, 1, 0.98, 0.94, 0.88, 0.82, 0.76] },
    },
    // auburn to bay, the wavy bars doubled; a broad black band near the tip with grey either side of it (F)
    tail: { web: BAY, edge: [14, 48, 29], under: [18, 24, 40], point: 0.92, band: [...pairs, [0.765, 0.79, SMOKE], [0.79, 0.895, BLACK], [0.895, 1, SMOKE]] },
    bill: { upper: [25, 20, 16], lower: [25, 18, 22] },                                        // bill dark brown (one reader)
    mouth: [350, 20, 30],
    eye: { iris: [28, 50, 32], pupil: [240, 15, 5] },                                           // iris hazel (one reader)
    leg: [58, 10, 30],                                                                          // feet dark greyish olive with a brownish wash (one reader)
    shin: [32, 24, 54],                                                                         // thighs drab to whitish, washed buff (F)
    comb: [14, 75, 48],                                                                         // the bare space over the eye orange or red (F)
    ruff: [230, 8, 6],                                                                           // the ruff deep black with a slight bluish purplish sheen (F)
  },
};
