// Warbling Vireo, Vireo gilvus: the western form, swainsoni (Ridgway's Vireosylva gilva swainsonii; since 2025 some
// treat it as a species of its own, the Western Warbling Vireo): the adult in spring. The sexes are alike (Ridgway).
//
// What is published and what is not. The lengths under `published` are Ridgway's for 50 adult males of swainsoni, and
// the bird is built to their means; life/measure.js measures the built bird against them. (His ten males of British
// Columbia, the nearest to the Olympic Peninsula, read wing 67, tail 49.3, culmen 9.9, tarsus 17.2, toe 10: within
// 1.5 % of these.) Ridgway describes the colours in full only for the eastern form, gilva; for swainsoni he gives
// the differences, a darker crown that is perceptibly darker than the back, and back, sides and flanks more
// olivaceous, so the colours here are his gilva text with those changes. The outline of head and body, where the eye
// sits, the stout bill with its hooked tip, how the folded wing lies and the upright-ish stance are in nothing that
// was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking. Ridgway through the Internet Archive's
// character-recognition text of the volume, read as text; Wikipedia through page text. No page was seen as an image.
// The middle toe's claw is not said to be in or out of the figure, and the depth of the bill is printed "34" in the
// scan (3 to 4, mean 3.5, by inference). The Audubon and BirdWeb pages named below were read by the first agent only
// and were not checked by the second; the 10 to 16 g is from them and from Wikipedia.

const R = 'Ridgway 1904, The Birds of North and Middle America, Part III (U.S. National Museum Bulletin 50), p. 156, Vireosylva gilva swainsonii; https://archive.org/download/cu31924090256904/cu31924090256904_djvu.txt';

export const published = {
  shown: 'adult (the sexes alike), spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the species (crown and hindneck plain smoke grey, paler on the forehead; back and scapulars the same, faintly tinged with olive; rump and upper tail coverts light grey-olive; wings and tail deep brownish grey with paler edgings, the inner webs edged with white, and no wing bars; a stripe of dull grey-white over the eye reaching well behind it; the cheek and the side of the neck pale buffy grey; underparts dull white down the middle, passing into pale buffy olive on the sides and flanks; the under wing coverts and axillars very pale yellow or yellowish white; bill horn-brown above and pale horn below, bluish in life with a query; iris brown; legs pale grey-blue in life) and, for the western form, a darker crown and more olive back and flanks. The faint dusky line through the eye is from modern accounts (Audubon, BirdWeb), which Ridgway\'s text, as read, does not have. Not found in what was read, and the agent\'s: the outline, the stance, how far the wing reaches down the tail, the colour of the under tail coverts (painted white). The tail\'s shape is the genus\'s, even or a little notched. The wingspan is the species\', not the form\'s, from one secondary source.',
  sources: {
    R: `${R}: 50 adult males, museum skins (wing, tail, culmen, tarsus, toe, length)`,
    W: 'Wikipedia, "Warbling vireo" (read 2026-11-16, page text): wingspan 22 cm, length 12 to 13 cm, 10 to 16 g',
    A: 'Audubon Field Guide, Western Warbling Vireo (first reader only): gray and white, sometimes yellow and olive tinged; white eyebrow, faint eye line, no wing bars',
    B: 'Seattle Audubon, BirdWeb, Warbling Vireo (first reader only): treetop gleaning in deciduous woods, willow and cottonwood by rivers',
  },
  lengths: [
    ['wing', 'Wing, folded', 67.8, [63, 73], 'R'],
    ['tail', 'Tail', 50, [45, 54], 'R'],
    ['culmen', 'Exposed culmen', 9.9, [9, 11], 'R'],
    ['tarsus', 'Tarsus', 17.5, [16, 18], 'R'],
    ['midToe', 'Middle toe (the claw not said to be in or out)', 9.9, [9, 11], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 118, [111, 129], 'R'],
    ['span', 'Wingspan (the species, one secondary source)', null, [215, 225], 'W'],
  ],
  proportions: [
    'The tail three quarters of the wing (50 to 67.8: worked out from Ridgway\'s means)',
    'The tarsus about 1.8 times the exposed culmen (17.5 to 9.9; Ridgway says it is always longer)',
  ],
  mass: 'Mass about 13 g: 10 to 16 (W, A)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]. Set darker than their names read.
const CROWN = [40, 5, 36], BACK = [70, 7, 44], RUMP = [66, 14, 48], NAPE = [40, 5, 37];
const BELOW = [50, 10, 80], FLANK = [56, 15, 68], CHEEK = [48, 10, 62], BROW = [48, 8, 85], LINE = [40, 6, 38], THROAT = [48, 8, 84];

const size = (p) => (p.x > 48 ? 2 : p.x > 41 ? 2.8 : 4.6);
const head = (p) => p.x > 41;

export default {
  name: 'Warbling Vireo', latin: 'Vireo gilvus', key: 'warbling-vireo', seed: 157,
  // ---- who is about on a visit, how it lives on one (life/species/index.js says what each field is) and its voices
  census: { tier: 'few', source: 'B F; alder and cottonwood by rivers', wave: true },
  // Its way (life/families/foliage.js). From what was read (B, BirdWeb; A, Audubon; W, Wikipedia): it forages high in
  // broad-leaved trees, hopping along the twigs and branches and gleaning insects from the leaves, moving slowly and
  // deliberately, and hovers a moment to pick them from the undersides of leaves; it is often hard to see in high or
  // thick foliage; it sings again and again, many of them all day long. Here it keeps to the alders, maples, willows
  // and the apple where it can, 2.5 to 6.5 m above its tree's foot (the sources: high, in the treetops), and sings a
  // bout from up to 8 m (the family says why: at 9.7 m in a maple it was a frame of leaves). Every number below is the
  // agent's.
  way: {
    family: 'foliage', there: 0.6, gap: [40, 180],
    homeOff: 20, range: 22, apart: 40, broad: 0.9,
    low: 2.5, high: 6.5, perch: 8,
    hz: 17, speed: 6, stay: [14, 36], spell: [120, 360],
    flush: 4, startle: 8, near: 0.8, gone: 0.15,
    hop: [0.9, 3], hops: 2, hang: 0, hover: 0.07, sally: 0.01, reach: [1, 2.5], flick: 0,
    doing: { look: 'among the leaves, looking about slowly', hop: 'hopping slowly along a twig', peck: 'picking at the leaves', hang: 'hanging under a twig, picking at it', hover: 'hovering under a leaf, picking at it' },
    call: { every: [15, 40], time: 0.3, rate: 4, reach: 25, doing: 'calling' },
    song: { every: [3.5, 8], up: 0.12, bout: [4, 8], gap: [3, 6], time: 3, rate: 5, reach: 70, doing: 'singing: a long, rambling warble' },
  },
  voices: {
    song: { file: 'vireo-song.mp3', level: 0.4, near: 5,
      credit: { what: "Warbling Vireo, song", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2015", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-warblingvireo.htm', bytes: 850601, kept: 3.0 } },
    call: { silent: true },   // no call was cut
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 12 cm long and 13 g: a little bigger than a chickadee.',
    marks: ['Plain grey-olive above, white below', 'A pale stripe over the eye and no wing bars', 'A stout bill with a small hook at the tip', 'A darker grey cap'],
    lives: 'Open woods of alder, cottonwood, willow and maple, where it forages high in the leaves, hopping slowly along the twigs and picking insects off them. It sings a rambling, burry warble, again and again, through the day, and is often heard and not seen.',
  },
  plate: { wide: 0.36, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 58
    top:    [[-9, 2], [-3, 5.6], [6, 9.8], [17, 13.2], [28, 14.4], [37, 14.2], [43, 14.2], [48, 15.4], [53, 15.4], [55.8, 12.6], [57.2, 8.4], [58, 5.4]],
    bottom: [[-11, -1], [-4, -5.6], [5, -10.6], [16, -14.4], [27, -15.2], [36, -13.4], [43, -10], [49, -6], [54, -2.6], [58, 0.8]],
    half:   [[-11, 2.4], [-4, 6.8], [5, 11], [16, 13.6], [27, 14.2], [36, 12.8], [42, 11.4], [48, 11], [53, 9.4], [56.4, 6.2], [58, 2.5]],
    widest: 0.46,
    neck: [39, 48],
    eye: { x: 51.4, y: 7.2, r: 1.6 },
    bill: { culmen: 9.9, drop: 0.12, gape: 1.8 },
    wing: {
      chord: 67.8, wrist: [37, -2], aim: [-65, 5],
      up:   [[0, 2], [0.12, 7.8], [0.3, 9.6], [0.5, 8.4], [0.72, 5.4], [0.9, 2.4], [1, 0.6]],
      down: [[0, 1.4], [0.12, 4.4], [0.3, 6.2], [0.5, 6.4], [0.72, 4.8], [0.9, 2.6], [1, 0.6]],
      rest: 2, proud: 1.1,
      span: 220, shoulder: [35.5, 6.6, 9.6], arm: 30, lead: 6, sweep: 13, root: 50, tipChord: 22,
    },
    // even, or very slightly notched (Ridgway, of the genus)
    tail: { length: 50, root: 0.9, rootHalf: 2.4, feathers: 12, width: 6.2, closed: 0.035, graded: -1, point: 0.55, droop: 0.03, tent: 4 },
    leg: { knee: [25, -8.6, 6.4], shin: 12, tarsus: 17.5, thick: [3, 1.35, 0.8], toes: { mid: 9.9, side: 7.4, hind: 7.4, claw: 3.6, hindClaw: 4.8 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.36, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: -0.1, fan: 0.02 }, feet: { mode: 'grip', round: 0.006 }, perch: 0.006 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELOW, size },                                                                  // underparts dull white medially (R)
      { where: (p) => p.a > 0.2 && p.a < 0.58 && p.x < 40, colour: FLANK, size: 4.6 },           // sides and flanks pale buffy olive, more olivaceous in the western form (R)
      { where: (p) => p.a < 0.4 && p.x > 41, colour: THROAT, size: 2.4 },                        // throat and breast dull white
      { where: (p) => p.a >= 0.58 && p.x <= 42, colour: BACK, size },                           // back and scapulars smoke grey faintly tinged with olive (R)
      { where: (p) => p.a >= 0.58 && p.x < 8, colour: RUMP, size: 5 },                          // rump and upper tail coverts light grey-olive (R)
      { where: (p) => p.a >= 0.58 && p.x > 38 && p.x <= 43, colour: NAPE, size: 2.6 },          // hindneck plain smoke grey, as the crown (R)
      { where: (p) => head(p) && p.a >= 0.3 && p.a < 0.6, colour: CHEEK, size: 2.2 },           // cheek and side of the neck pale buffy grey (R)
      // (each stripe of the head bounded round it, `a`, so that it does not join its fellow over the crown or the nape)
      { where: (p) => p.x > 45.5 && p.x <= 55 && p.y > 6.1 && p.y <= 8.3 && p.a >= 0.45 && p.a < 0.85, colour: LINE, size: 1.8 },   // a faint dusky line through the eye (A, B: not in R as read)
      { where: (p) => p.x > 44 && p.x <= 57 && p.a >= 0.45 && p.a < 0.86 && p.y > 8.3 && p.y <= 11.2, colour: BROW, size: 1.8 },   // a stripe of dull grey-white over the eye, reaching well behind it (R)
      { where: (p) => p.x > 38 && p.y > 11, colour: CROWN, size: 2.2 },                         // crown plain smoke grey, darker than the back in the western form (R)
      { where: (p) => p.x > 53 && p.a >= 0.8 && p.y > 8.4, colour: [48, 6, 54], size: 1.8 },    // paler on the forehead (R)
    ],
    wing: {
      web: [34, 7, 26], edge: [44, 9, 42], tertial: [34, 7, 26], covert: [38, 8, 30], lesser: BACK, lesserEdge: [58, 9, 48],     // wings deep brownish grey with paler edgings, the lesser coverts as the back (R)
      medianTip: null, greaterTip: null,                                                         // wing without whitish bars (R)
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.4, 0.95, [44, 9, 52], 'edge']],                         // paler edgings on the tertials, a quiet pair (the agent's: R has "pale brownish gray edgings")
      under: [50, 10, 66], underCovert: [54, 14, 82], underCovertTip: null, underBars: [],      // under the wing: very pale yellow or yellowish white (R)
      fold: { primaries: 8, secondaries: 6, secondaryEnd: 0.74, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: [34, 7, 26], edge: [44, 9, 40], under: [40, 8, 56], point: 0.4 },              // tail deep brownish grey, the inner webs edged with white (R)
    bill: { upper: [36, 16, 28], lower: [205, 10, 58] },                                         // maxilla horn-brown, mandible pale horn, grey-blue in life (R, with a query)
    mouth: [8, 40, 55],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [210, 14, 38],                                                                         // pale grey-blue in life, dusky in skins (R)
    shin: [210, 10, 44],
  },
};
