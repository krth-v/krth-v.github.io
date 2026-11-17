// Hairy Woodpecker, Dryobates villosus, the dark form of the humid Pacific coast (harrisi, "Harris's Woodpecker" in
// Ridgway): the adult male. The female has no red on the head (Ridgway, of the species).
//
// What is published and what is not. The lengths under `published` are Ridgway's for adult males of harrisi, and
// the bird is built to their means; life/measure.js measures the built bird against them. The colours are his
// description of the species' male (the nominate form) with his stated difference for harrisi: the under parts, the
// outer tail feathers, the head stripes and the stripe on the back light drab or buffy drab-gray where the others
// are white. The outline of head and body, where the eye sits, how the folded wing lies, the stance, how far each
// patch reaches and the lightness of every colour are in nothing that was read: they are the agent's drawing (it
// began from the American Three-toed Woodpecker's, made a tenth larger), for the owner to judge from the contact
// sheet. The paint is laid darker than the words "light drab" read.
//
// How the sources were read: Ridgway 1914, Part VI, in the Internet Archive's character recognition of the scan
// (item cu31924022528081), read here directly; no page was seen as an image. The scan prints the culmen's mean as
// "(81.7)": read as 31.7, which lies inside its range of 29 to 35. A footnote gives the number of skins and was not
// read. The wingspan is from Wikipedia's account of the species. The iris, bill and feet are Ridgway's for the
// nominate form, not for harrisi.
//
// Its feet. A woodpecker's foot has two toes forward and two back. The builder has three front toes and a hind
// one, so the outer of the three is turned out and back (shape.leg.yaw), as the Pileated's is; the toe built to
// Ridgway's "outer anterior toe" is the one that points straight ahead.
//
// Looked at again on 2026-11-16 (the agent called woodpeckers), against Ridgway's text read in the same character
// recognition (his genus Dryobates, p. 194-195; harrisi, p. 218; and the chain of forms it is "similar to":
// hyloscopus, leucothorectis, monticola): (1) the stripe down the back is plain, as he has it ("the median portion
// of back (broadly) white", light drab in harrisi), where it had been barred; (2) the western forms have the white
// spots on the wing coverts "much reduced in size or number, or altogether wanting" (monticola, which the others
// are similar to), so the median coverts are left black and the greater have only a small tip; (3) the malar
// stripe is black, broken by white only in front; (4) the bill is darker ("deep grayish horn"); (5) the outer hind
// toe is longer than the outer front toe ("outer hind toe much longer than outer front toe"; "tarsus longer than
// outer hind toe with claw"), where it had been shorter. The builder makes the inner front toe 0.96 of the outer
// hind one, so the inner front toe is now a little longer than the outer front toe, which his text does not
// support: the lesser fault of the two, for the hind toe is the one that stands out from the bark.

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Dryobates villosus harrisi, p. 218';

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above (harrisi, males), and the colours as Ridgway has them for the species\' male: crown glossy blue-black; a nuchal band of bright poppy red, usually interrupted in the middle by black; the back black with a broad white stripe down its middle; the wings black spotted with white in regular rows on the greater coverts and flight feathers; the two outer pairs of tail feathers white, the third white but for the base of its inner web, the fourth part white; a broad white stripe over the ear, running over the eye, and a broad white one below the eye and ear, between them a broad black stripe over the ear, and a black malar stripe broken in front by white; bill deep grayish horn, the mandible slightly paler; iris reddish brown; legs and feet dull grayish blue to grayish olive. For harrisi he gives the white parts, the under parts and the outer tail feathers as light drab or buffy drab-gray. Of the western forms (monticola, and so leucothorectis, hyloscopus and harrisi, each "similar to" the one before) he gives the white spots on the wing coverts as much reduced or wanting. Of the genus: the outer hind toe much longer than the outer front toe, and the tarsus longer than the outer hind toe with its claw. Not found in what was read, and the agent\'s: how drab, how large each patch is, the hind toe\'s, the inner toe\'s and the hallux\'s own lengths, the outline and the stance. His length is of skins. The wingspan is from Wikipedia and is for the species.',
  sources: {
    R: `${R}: adult males, museum skins, humid Pacific coast from northern California to British Columbia (Internet Archive character recognition, item cu31924022528081; the species' colours are on p. 201 to 202, the genus on p. 194 to 195, monticola's wing coverts on p. 210)`,
    W: 'Wikipedia, "Hairy woodpecker" (read 2026-11-16): length 18 to 26 cm, wingspan 33 to 43 cm, mass 40 to 95 g (the species at large); gives nothing for harrisi but its range',
    B: 'Seattle Audubon, BirdWeb, Hairy Woodpecker (as gathered in the repository\'s research file, not read again here): fairly common in May on the Pacific Northwest coast; mature conifer forest; alone or in pairs; heard more than seen',
  },
  lengths: [
    ['wing', 'Wing, folded', 127.8, [124, 136], 'R'],
    ['tail', 'Tail', 78.3, [73.5, 84], 'R'],
    ['culmen', 'Exposed culmen (his scan prints the mean "81.7": read as 31.7)', 31.7, [29, 35], 'R'],
    ['tarsus', 'Tarsus', 23.4, [22.5, 24], 'R'],
    ['midToe', 'Outer front toe (no claw, apparently)', 15.4, [15, 16], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 223, [210, 240], 'R'],
    ['span', 'Wingspan (the species, Wikipedia)', null, [330, 430], 'W'],
  ],
  proportions: [
    'Tail a little over three fifths of the wing, stiff, its middle feathers decurved at the tip (Ridgway, of the genus)',
    'Bill about as long as the head, wedge-shaped, the tip a chisel; the culmen straight',
    'Two toes forward and two back; the outer hind toe much longer than the outer front toe, and the tarsus longer than the outer hind toe with its claw (Ridgway, of the genus)',
  ],
  mass: 'Mass about 70 g in this form: 40 to 95 g for the species (W; a midpoint, not a measurement of harrisi)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const BLACK = [222, 12, 9], DRAB = [34, 9, 44], PALE = [36, 8, 58], WHITE = [38, 6, 66], RED = [358, 78, 34], TUFT = [34, 14, 44];

const size = (p) => (p.x > 82 ? 3 : 7);
const head = (p) => p.x > 81;

export default {
  name: 'Hairy Woodpecker', latin: 'Dryobates villosus', key: 'hairy-woodpecker', seed: 233,
  census: { tier: 'some', source: 'B F; P regular', extra: true },
  // How it lives on a visit (life/families/trunk.js, which says what each number is). From what was read: it forages
  // "mainly on the trunks and limbs of trees", "often probing, scaling off bark, and excavating into dead wood", does
  // "more pounding and excavating in trees than most smaller woodpeckers", and "will feed on sap at damaged trees or at
  // sapsucker workings"; its call is "a sharp, distinctive peek" (Audubon, read 2026-11-16); its drum lasts "on
  // average for a full second, and includes about 26 beats", and it drums "about four to nine" times a minute
  // (Pfeiffer, Northern Woodlands, 2017, of the eastern birds). The agent's own: every distance, time, chance and
  // height below; which trees it takes (any big enough, dead ones most); that it backs down a trunk now and then; that
  // it goes off to a dead tree to drum.
  way: {
    family: 'trunk', there: 0.6, gap: [60, 300],
    hz: 9, speed: 9, range: 40, low: 1, high: 7, start: [0.05, 0.45], quota: [2, 4], stay: [25, 70], bound: 0.25,
    // a dead tree most of all, and any trunk big enough to work, the maples' too, below their fork
    suits: (t) => (t.kind === 'snag' ? 3 : t.girth >= 0.2 && t.kind !== 'apple' ? 1 : 0),
    homeOff: 22, apart: 150, short: true,
    flush: 8, startle: 14, near: 0.55, gone: 0.4,
    step: [0.04, 0.07], beat: 0.12, run: [2, 5], backs: 0.12,
    bear: (r) => (r() < 0.8 ? (r() - 0.5) * 0.6 : (r() < 0.5 ? 1 : -1) * (1.1 + r() * 0.5)),
    moving: (bearing) => (Math.abs(Math.sin(bearing)) > 0.7 ? 'hitching round the trunk' : 'hitching up the trunk, braced on its tail'),
    probing: 'probing a crack in the bark', resting: 'clinging, braced on its tail',
    work: { chance: 0.35, time: [3, 10], rate: 4.2, doing: 'chiselling into the wood after a beetle\'s grub', reach: 70 },
    flake: { chance: 0.2, time: [3, 8], rate: 2.5, doing: 'prying bark off with its bill, after the grubs under it', reach: 25 },
    sap: { chance: 0.15, sip: [3, 8], reach: 0.13, doing: 'taking sap at a sapsucker\'s wells' },
    call: { every: [20, 80], time: 0.6, rate: 1.6, reach: 200, doing: 'calling: a sharp "peek"', flying: true },
    drum: { time: 1.1, reach: 300, doing: 'drumming: a quick, even roll of about a second', every: [100, 300], bout: [2, 5], pause: [7, 15], seek: true },
  },
  voices: {
    call: { file: 'hairy-call.mp3', level: 0.5, near: 7,
      credit: { what: 'Hairy Woodpecker, call (one "peek")', by: 'J. Job, National Park Service, Rocky Mountain NP sound library, 2017', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-hairywoodpecker.htm', bytes: 1101920, kept: 0.65 } },
    // (made in the page. Its drum is a quick, even roll of about a second, some 26 knocks; the page's drum is the
    // Pileated's, 2.6 s quickening from 14 a second, so until it takes a length and a rate this is that roll at
    // this bird's pitch)
    drum: { synth: 'drum', level: 0.55, near: 10, pitch: 1150 },
    knock: { synth: 'knock', level: 0.3, near: 6, pitch: 1150 },
    flake: { synth: 'knock', level: 0.12, near: 4, pitch: 1450 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 23 cm long, wings 33 to 43 cm across: a little larger than a Downy, with a longer bill.',
    marks: ['A red patch at the back of the head (the male)', 'Black and white, but on this coast the white is a dingy buff-grey', 'A long pale stripe down the back and rows of white spots on the wings', 'A bill nearly as long as its head'],
    lives: 'Mature conifer forest, alder and mixed woods, and the trees along streams. It works the trunks and the main limbs, chiselling and prying bark off for the grubs of wood-boring beetles, and drums a quick, even roll in spring. Heard more often than seen.',
  },
  plate: { wide: 0.5, bar: 0.03 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 110.6
    top:    [[-23.1, 1.7], [-10.2, 6.6], [5.2, 12.1], [23.1, 16.5], [41, 18.7], [57.4, 18.7], [70.7, 17.1], [80, 15.4], [86.1, 15.4], [91.2, 17.2], [96.8, 19.4], [101.2, 19.6], [105.1, 17.6], [108.1, 14.1], [109.9, 10.8], [110.6, 8.3]],
    bottom: [[-28.2, -1], [-14.3, -5.6], [0, -11.1], [15.4, -18.3], [31.8, -23.3], [47.2, -24.3], [60.5, -21.8], [71.7, -16.7], [80, -11.1], [86.1, -7.6], [92.3, -5.7], [98.5, -4.6], [104.1, -2.9], [107.6, -1.3], [110.6, 0]],
    half:   [[-28.2, 3.4], [-14.3, 7.3], [0, 12.4], [15.4, 17.1], [31.8, 19.7], [47.2, 19.9], [60.5, 18], [71.7, 14.5], [80, 11.4], [86.1, 10.3], [92.3, 10.6], [98.5, 10.6], [103.5, 9], [107.1, 7], [109.5, 5.5], [110.6, 4.8]],
    widest: 0.46,
    neck: [77, 90],
    eye: { x: 100.7, y: 10, r: 2.3 },
    bill: { culmen: 31.7, drop: 0, gape: 5 },
    wing: {
      chord: 127.8, wrist: [77, -3.3], aim: [-127, 8.8],
      up:   [[0, 4.4], [0.12, 16.5], [0.3, 19.8], [0.5, 17.1], [0.75, 9.4], [0.9, 3.9], [1, 0.9]],
      down: [[0, 2.8], [0.12, 8.3], [0.3, 12.1], [0.5, 12.7], [0.75, 9.4], [0.9, 5], [1, 0.9]],
      rest: 3.3, proud: 2,
      span: 380, shoulder: [75, 10, 12], arm: 57, lead: 12, sweep: 27, root: 94, tipChord: 40,
    },
    // a little over three fifths of the wing, stiff, the middle pair decurved at its end: it is the bird's prop
    tail: { length: 78.3, root: 1, rootHalf: 4.4, feathers: 12, width: 15.5, closed: 0.045, graded: 15, point: 0.4, droop: 0.03, tent: 9 },
    // (the outer hind toe, `side`, 16.6 against the outer front toe's 15.4, and 22.9 with its claw against the
    // tarsus's 23.4; the hallux, `hind`, is the agent's)
    leg: { knee: [47, -14, 11], shin: 20, tarsus: 23.4, thick: [7.7, 3.5, 2.1], toes: { mid: 15.4, side: 16.6, hind: 9.5, claw: 7, hindClaw: 6 }, splay: 0.3, yaw: { O: 2.2, I: -0.3 } },
  },
  poses: {
    // on a trunk: +x is up the bark and +y out of it. The body is held off the bark on its legs, and the tail is let down until its tip rests on it.
    perched: { pitch: 0.2, lift: 0.36, lean: 0.004, droop: 0.05, head: { pitch: 0.1 }, tail: { prop: 0.002, fan: 0.04 }, feet: { mode: 'flat', width: 0.018, ahead: 0.008, toeOut: 0.5 }, board: true },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.2 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: DRAB, size },                                                                   // under parts light drab, here the dingy form (R, harrisi)
      { where: (p) => p.a >= 0.56, colour: BLACK, size },                                       // upper parts black (R)
      { where: (p) => p.a >= 0.84 && p.x > 4 && p.x < 76, colour: PALE, size: 7 },             // a broad stripe down the middle of the back, plain drab-white (R)
      { where: (p) => p.x > 66 && p.x <= 84 && p.a > 0.3 && p.a < 0.56 && p.y > -6, colour: BLACK, size: 4 },        // the side of the neck black behind the ear, where the malar stripe widens (R); extent the agent's
      { where: (p) => head(p) && p.y > 3.4, colour: BLACK, size: 3 },                           // crown, ear region and hind-neck glossy blue-black (R)
      { where: (p) => p.x > 83 && p.y > (p.x > 97 ? 12.8 : 12.4) && p.y < (p.x > 97 ? 14.8 : 15.4) && p.a < 0.9, colour: PALE, size: 3 },   // a broad drab-white stripe over the ear, narrower where it runs over the eye (R)
      { where: (p) => p.x > 83 && p.y > 2.2 && p.y <= 4.2, colour: PALE, size: 3 },             // a broad drab-white stripe below the eye and ear (R)
      { where: (p) => p.x > 83 && p.y > -1.2 && p.y <= 2.2, colour: BLACK, size: 2.6 },         // a black malar stripe (R),
      { where: (p) => p.x > 101 && p.y > -1.2 && p.y <= 2.2, colour: BLACK, edge: PALE, fringe: 0.3, size: 2.4 },     // broken in front by white (R)
      { where: (p) => p.x > 100 && p.y > 3 && p.y < 11, colour: TUFT, size: 2.6 },              // nasal tufts dull white to brownish yellow, the bristles blackish (R); dull here
      { where: (p) => p.x > 100 && p.y > 11 && p.y < 15.6, colour: PALE, size: 2.6 },           // the over-eye stripe runs forward to the nasal tufts (R)
      { where: (p) => p.x > 82 && p.x < 91 && p.a > 0.86 && p.a < 0.96 && p.y > 12, colour: RED, size: 2.6 },          // the nuchal band bright poppy red, cut across the middle by black (R)
    ],
    wing: {
      web: BLACK, edge: [222, 11, 14], tertial: BLACK, covert: BLACK, lesser: BLACK, lesserEdge: [222, 10, 15],
      // the coverts' white spots much reduced or wanting in the western forms (R): none on the median coverts here, a small tip on the greater
      medianTip: null, greaterTip: [WHITE, 0.13], patchSkip: 0,
      // the flight feathers spotted with white in regular rows (R); how many rows and how large are the agent's
      primaryBars: [[0.25, 0.285, WHITE, 'outer'], [0.41, 0.445, WHITE, 'outer'], [0.57, 0.605, WHITE, 'outer'], [0.73, 0.765, WHITE, 'outer']],
      secondaryBars: [[0.2, 0.235, WHITE, 'outer'], [0.4, 0.435, WHITE, 'outer'], [0.6, 0.635, WHITE, 'outer'], [0.8, 0.835, WHITE, 'outer']],
      tertialTip: [WHITE, 0.2],
      under: [222, 8, 22], underCovert: [36, 6, 56], underCovertTip: null,                      // under the wing: not described in what was read; dusky flight feathers, pale coverts here
      underBars: [[0.25, 0.33, WHITE, 'both'], [0.5, 0.58, WHITE, 'both']],
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 8, greaterEnd: 0.4, median: 7, medianEnd: 0.23 },
      spread: { primaries: 9, secondaries: 7, shape: [0.7, 0.9, 0.98, 1, 1, 1, 0.99, 0.97, 0.95] },
    },
    // black above; the two outer pairs white (drab here), the third white but for the base of its inner web, the fourth partly (R)
    tail: { web: [222, 12, 9], edge: [222, 12, 13], under: [222, 8, 18], tip: [[5, WHITE, 1], [4, WHITE, 0.9], [3, WHITE, 0.7], [2, WHITE, 0.4]], point: 0.3 },
    bill: { upper: [32, 7, 14], lower: [36, 8, 24], lowerBase: [[40, 9, 34], 0.5] },           // deep grayish horn, the mandible slightly paler (R): laid darker than it was, which read as pale horn
    mouth: [350, 30, 40],
    eye: { iris: [18, 52, 22], pupil: [240, 15, 5] },                                           // iris reddish brown (R), darkened
    leg: [205, 10, 28],                                                                         // dull grayish blue to grayish olive (R, of the nominate form)
    shin: [222, 8, 14],
  },
};
