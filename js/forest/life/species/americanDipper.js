// American Dipper, Cinclus mexicanus, the northern form C. m. unicolor, the adult in spring. The sexes are alike.
//
// What is published and what is not. The lengths under `published` are Ridgway's (Birds of North and Middle
// America, Part III, 1904, p. 679) for 22 adult males of unicolor over the whole range, read as the Internet
// Archive's character recognition of the scan (cu31924090256904), by one agent and checked by a second
// (2026-11-16). They are skin lengths. His regional means show the Pacific-coast birds smaller than the Rocky
// Mountain ones (wing 89.5 in California against 96.1); the whole-range mean is built, as the sheet is asked
// for. His printed tarsus mean (28.8) does not agree with the weighted mean of his own regional subsets (29.2):
// the printed one is built. Ridgway gives no adult description of unicolor: he says it is "similar" to the
// eastern form but paler, with the head and neck "decidedly less brown". The colours here are his description of
// the adult of the eastern form in spring and summer, tract by tract, with the head let go greyer. The middle
// toe is Ridgway's, and he does not say there whether it has its claw: built without. The wingspan is from two
// secondary sources that disagree (Wikipedia 23 cm, Audubon 25 to 28 cm, the latter seen only in a search
// summary), so it is a range with no mean. The legs' and the bill's colours in life, the white of the eyelids
// and the posture are from Birds of the World, BirdWeb and Wikipedia, read through a tool that returns a page's
// text or a summary; none of it was checked by a second reader. The outline of head and body, the place of the
// eye and how the folded wing lies are the agent's drawing. No source was seen as an image.

export const published = {
  shown: 'adult (sexes alike); measurements are of males, C. m. unicolor, whole range',
  note: 'Published: the lengths above (Ridgway, skins), and the plumage tract by tract from his description of the eastern form (head and neck brown, the rest plain dull slate, the underparts a little paler and browner; flight feathers and tail dusky slate; the lower abdomen and flanks, the longer under tail coverts and the larger under wing coverts margined with grey-white or brown-white; bill black; iris brown). For unicolor he says only "paler, with head and neck decidedly less brown". Not found, and the agent\'s: where the wing tip reaches on the tail, how round the tail is, the crown apart from the rest of the head, the live colour of the legs (Ridgway has only "light horn brownish in dried skins"; Birds of the World has pinkish grey, unconfirmed), the wingspan (two sources that disagree). Left out: the white eyelids (a flash when the bird blinks, from Birds of the World alone) and the pale fringes of fresh feathers, which have worn off by April to August. Drawn by the agent: the outline of head and body, the place of the eye, how the folded wing lies.',
  sources: {
    R: 'Ridgway, Birds of North and Middle America, Part III (U.S. National Museum Bulletin 50, 1904), p. 679, Internet Archive text of volume cu31924090256904: 22 adult males of unicolor, skins; the plumage text is his, pp. 677 to 679',
    B: 'Cornell Lab of Ornithology, Birds of the World, American Dipper, identification, appearance, plumage and behavior pages (through a summary tool): live length 14 to 20 cm, the dark bill in the breeding season, the legs, the white eyelids, the bobbing',
    W: 'Wikipedia, "American dipper": length 16.5 cm, wingspan 23 cm, 46 g. Audubon, Guide to North American Birds, American Dipper: wingspan 25 to 28 cm (seen only in a search summary). Seattle Audubon BirdWeb, American Dipper',
  },
  lengths: [
    ['wing', 'Wing, folded (chord)', 90.9, [83, 100], 'R'],
    ['tail', 'Tail', 49.1, [43, 56], 'R'],
    ['culmen', 'Exposed culmen', 17.3, [16, 19], 'R'],
    ['tarsus', 'Tarsus (Ridgway\'s regional means weigh to 29.2)', 28.8, [25, 31], 'R'],
    ['midToe', 'Middle toe (the claw is not said; built without)', 21.3, [18, 23.5], 'R'],
    ['length', 'Length of skins, bill tip to tail tip', 173, [155, 192], 'R'],
    ['span', 'Wingspan (two sources that disagree)', null, [230, 280], 'W'],
  ],
  proportions: [
    'A plump, compact bird with short wings, a short tail and long legs; the plumage very compact and underlaid with down (R)',
    'Bill much shorter than the head, slender, much compressed; the culmen nearly straight and the tip a little decurved (R)',
    'Tail short but decidedly more than half the wing, even or slightly rounded, the feathers broad and rounded at the tip (R); often held cocked (B)',
    'Tarsus decidedly longer than the middle toe with its claw and more than a third of the wing; the hind toe as long as the side toes but stouter (R)',
    'It bobs its whole body, bending the legs to crouch and then standing (B)',
    'Not found: a measured wing tip beyond the tertials; built to lie over the root of the tail',
  ],
  mass: 'Mass: males 56.9 g, females 51.1 g, south-eastern Alaska (B); 46 g on average (W)',
};

// colours as paint: [hue, saturation, lightness]. Ridgway's "plain dull slate" is a brown-tinged grey; it is
// laid darker than its name reads.
//
// Corrected on 2026-11-16 by the agent called dipper, against the sources above and the contact sheet: the brown of
// the head met the slate of the body along a hard line round the neck (Ridgway has the head and neck brown, and
// the brown "decidedly less" in unicolor: it now gives way feather by feather over a centimetre, and is fainter);
// the under wing was cream with pale bars (his larger under wing coverts are margined grey-white, not white: the
// under wing is slate now, the margins faint); the lower abdomen was a pale scaled patch (the margins of fresh
// feathers, worn by May: fainter); the lesser coverts were a pale patch on the folded wing (plain slate: fainter); the
// legs were thin for a bird of 50 g with "rather long booted tarsi" (R), and it stood with its belly on its feet
// (it stands up on its legs now, and crouches to bob: B).
const SLATE = [214, 7, 20], BACK = [214, 7, 18], RUMP = [214, 7, 20], BELOW = [205, 4, 21];
const HEAD = [28, 5, 20], CROWN = [28, 5, 17], THROAT = [28, 5, 22], FACE = [28, 4, 19], NECK = [216, 6, 19];
const DUSKY = [218, 8, 13], MARGIN = [26, 6, 28];
const size = (p) => (p.x > 84 ? 2.8 : p.x > 76 ? 3.6 : 5);
// a fixed pseudo-random number from where a feather is, so that the edge of the brown is the same on every load
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
// the brown of the head and neck, which gives way to the slate feather by feather between 72 and 84 mm (the agent's)
const hooded = (p) => p.x > 72 + 12 * hash(Math.floor(p.x / 2.2), Math.floor(p.a * 36));

export default {
  name: 'American Dipper', latin: 'Cinclus mexicanus', key: 'american-dipper', seed: 163,
  // ---- who is about on a visit (life/species/index.js says what each field is)
  census: { tier: 'few', source: 'B U; turbulent forested streams' },
  // ---- how it lives on a visit (life/families/stream.js says what each number is; every one is the agent's own)
  way: {
    family: 'stream', gap: [40, 180], there: 0.75,
    // (`below`: walking on the bottom it stands 7.4 cm tall from its feet to the top of its back, measured on its near
    // level posed so, scratch/wade-page.js; water of 8.5 cm covers all of it)
    range: 30, apart: 90, need: 4, deepest: 0.45, below: 0.085,
    hz: 16, speed: 7, hover: [0.3, 1.1],                 // under 2 m over the water, and following its bends (B)
    spell: [100, 320], dip: [0.6, 2.4], stand: [3, 10], wade: 0.5, move: 0.3, feed: [5, 14], dive: [3, 8],
    song: { every: [30, 110], time: [4, 12], reach: 90 }, call: { reach: 55 },
    flush: 7, startle: 12, near: 0.7, gone: 0.2,
    // `under`: how far it may go under the water's surface, as life/bodies.js defines the field: it walks on the bed in
    // water up to `deepest` deep. (The count of walks measures from the ground, which under the water is the bed: from
    // there it never went below 0, not by a millimetre, in 1,300 s of the harness of 2026-11-16, flights and hops in.)
  },
  voices: {
    song: { silent: true },   // the one public-domain recording (Yellowstone, with Canada geese) has the dipper faint and amid other birds; not kept
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 16 cm long and 50 g: a plump, stocky songbird, bigger than a wren and smaller than a robin.',
    marks: ['Plain slate grey all over, browner on the head', 'A short tail and short wings, a plump body on long legs', 'It bobs its whole body up and down, all day', 'It walks into fast water, and under it'],
    lives: 'Fast, clear mountain streams with riffles, boulders and waterfalls. It stands on a rock in the current, bobbing, then walks or dives in and feeds on the bottom on insect larvae, and flies low along the stream, following its bends. It sings loudly over the noise of the water, and nests in a ball of moss on a ledge, often behind a fall.',
  },
  plate: { wide: 0.5, bar: 0.03 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 103
    top:    [[-10, 3], [-4, 9.5], [6, 17.5], [20, 25.5], [36, 30.5], [52, 32], [66, 31], [76, 30], [84, 30.5], [92, 29.5], [97.5, 26.5], [101, 22.5], [103, 18]],
    bottom: [[-12, -1], [-5, -8], [6, -18], [20, -27], [36, -31], [52, -31], [66, -27], [78, -20], [88, -11], [96, -3.5], [101, 3.5], [103, 10]],
    half:   [[-12, 3], [-5, 8], [6, 15], [20, 21], [36, 24], [52, 24.5], [66, 22], [78, 18], [88, 15.5], [96, 12], [101, 7], [103, 3.2]],
    widest: 0.46,
    neck: [78, 92],
    eye: { x: 95, y: 22.5, r: 2.2 },
    bill: { culmen: 17.3, drop: 0.07, gape: 3 },
    wing: {
      chord: 90.9, wrist: [66, -1], aim: [-90, 6],
      // short, broad and rather pointed at the tip (R)
      up:   [[0, 3.2], [0.12, 12.5], [0.3, 15], [0.5, 13.5], [0.72, 9], [0.9, 4.5], [1, 1.3]],
      down: [[0, 2.6], [0.12, 8], [0.3, 11], [0.5, 11.5], [0.72, 9], [0.9, 5], [1, 1.3]],
      rest: 3.5, proud: 2,
      span: 250, shoulder: [64, 12, 18], arm: 44, lead: 10, sweep: 22, root: 80, tipChord: 30,
    },
    tail: { length: 49.1, root: 1.6, rootHalf: 4.5, feathers: 12, width: 11.5, closed: 0.035, graded: 1.2, point: 0.7, droop: 0.03, tent: 6 },
    leg: { knee: [44, -16, 13], shin: 12, tarsus: 28.8, thick: [5.6, 2.9, 1.65], toes: { mid: 21.3, side: 16, hind: 15, claw: 5.5, hindClaw: 7 }, splay: 0.5 },
  },
  poses: {
    // on a branch or a snag over the stream: up on its legs, the body tilted up a little in front, the tail cocked
    perched: { pitch: 0.18, lift: 0.78, head: { pitch: 0.05 }, tail: { pitch: 0.5, fan: 0.03 }, feet: { mode: 'grip', round: 0.012 }, perch: 0.012 },
    // standing on a rock in the stream with its feet flat: up on its long legs, the tail cocked (B); it crouches from
    // this to bob (life/families/stream.js)
    ground: { pitch: 0.22, lift: 0.8, head: { pitch: 0.05 }, tail: { pitch: 0.55, fan: 0.03 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.15 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELOW, size },                                                                  // underparts plain slate, a little paler and browner than the back (R)
      { where: (p) => p.a < 0.62 && hooded(p) && p.x < 98, colour: THROAT, size: 2.8 },         // chin and throat paler brown (R)
      { where: (p) => p.a >= 0.6 && p.x <= 78, colour: BACK, size },                            // back, scapulars and rump plain dull slate (R)
      { where: (p) => p.a >= 0.6 && p.x < 12, colour: RUMP, size: 5 },
      { where: (p) => p.x > 68 && p.a >= 0.4, colour: NECK, size },                             // the brown comes on over the nape
      { where: (p) => hooded(p) && p.a >= 0.4, colour: HEAD, size },                            // head and neck brown, greyer in unicolor (R)
      { where: (p) => p.x > 86 && p.y > 24.5, colour: CROWN, size: 2.6 },                       // darker on the crown (R)
      { where: (p) => p.x > 88 && p.a < 0.62 && p.a >= 0.4, colour: FACE, size: 2.6 },
      { where: (p) => p.a < 0.3 && p.x < 46 && p.x > -4, colour: BELOW, edge: MARGIN, fringe: 0.04, size: 5 },    // lower abdomen and posterior flanks margined grey-white when fresh (R): worn by May
      { where: (p) => p.x <= 2 && p.a < 0.5, colour: [205, 5, 23], edge: MARGIN, fringe: 0.12, size: 6 },   // under tail coverts margined grey-white (R)
    ],
    wing: {
      web: DUSKY, edge: [214, 7, 18], tertial: [216, 7, 15], covert: [216, 7, 16], lesser: SLATE, lesserEdge: [214, 7, 21],
      medianTip: null, greaterTip: null,                       // no wing bars in spring (R); the fresh feathers' white margins have worn off
      patchSkip: 0,
      primaryBars: [], secondaryBars: [],
      tertialTip: null,
      under: [218, 8, 24], underCovert: [214, 6, 25], underCovertTip: [[26, 6, 33], 0.25], underBars: [],     // the larger under wing coverts margined grey-white (R): faintly
      fold: { primaries: 6, secondaries: 6, secondaryEnd: 0.8, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.62, 0.84, 0.95, 1, 1, 1, 1, 0.98, 0.95] },
    },
    tail: { web: [216, 7, 14], edge: [214, 7, 20], under: [218, 6, 20], tip: [], point: 0.6 },        // dull blackish slate, no pattern (R)
    bill: { upper: [220, 6, 9], lower: [220, 6, 11] },                                        // black in the breeding season (R, B)
    mouth: [8, 40, 50],
    eye: { iris: [25, 45, 12], pupil: [240, 15, 5] },                                         // iris brown (R)
    leg: [12, 12, 40],                                                                        // pinkish grey (B)
    shin: [20, 8, 30],
  },
};
