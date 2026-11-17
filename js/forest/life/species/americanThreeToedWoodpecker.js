// American Three-toed Woodpecker, Picoides dorsalis, the form of the north-west (fasciatus, Ridgway's "Alaskan
// Three-toed Woodpecker"): the adult male in spring. The female has no yellow on the crown (Ridgway's account of
// the species; not read for this sheet beyond the male's line).
//
// What is published and what is not. The lengths under `published` are Ridgway's for adult males of fasciatus (30
// skins), and the bird is built to their means; life/measure.js measures the built bird against them. The colours
// are his description of the male of the nominate form with his stated differences for fasciatus (a broad white
// patch down the middle of the back, much more white on the forehead, a distinct white streak over the ear, a
// narrower black moustache and narrower bars on the flanks). Which form lives on the Olympic Peninsula was not
// found: his range for fasciatus gives Washington only as "Chilowyuck Lake, August", and the Olympics are not
// mentioned. The outline of head and body, where the eye sits, how the folded wing lies, the stance, the exact
// extent of each patch and every colour's lightness are in nothing that was read: they are the agent's drawing,
// for the owner to judge from the contact sheet.
//
// How the sources were read: one agent reading and one checking, both through the Internet Archive's character
// recognition of the scan (the wing, tail, culmen, tarsus, outer front toe and length were each confirmed by the
// second against the account and, for four of them, against the table on p. 292). No page was seen as an image.
// The wingspan is from two secondary pages that the checker did not open (unconfirmed). The iris colour was not
// found in anything read.
//
// Its feet. This woodpecker has three toes: two forward and one back, the outer hind toe, and no hallux (Ridgway:
// "only one hind toe (the outer, the hallux being absent)"). The builder has three front toes and a hind one and
// cannot leave one out. So the builder's hind toe, which closes round a perch and folds in flight as a hind toe
// does, is this bird's one hind toe, at its own length; and the builder's outer front toe is laid on the middle
// one, at the same length and the same way (shape.leg.yaw), and the two are one toe in every pose. The front toes
// are then the outer one (built to Ridgway's "outer anterior toe", straight ahead: the page does not say whether
// it has its claw) and the inner one, 0.96 of it. Ridgway, of the genus: the hind toe with its claw "slightly but
// decidedly longer" than the outer front toe with its claw, the inner front toe "nearly as long" as the outer, the
// tarsus "decidedly longer" than the hind toe with its claw: built 17.4 mm against 16.5 and 15.5, under the
// tarsus's 20. (Until 2026-11-16 the outer front toe was turned right back onto the builder's hind toe instead,
// at the hind toe's length, 14.4 mm with its claw: shorter than the front toe, and the two came apart in any pose
// where the toes close, since the one turns on the front toes' bone and the other on the hind toe's.)

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Picoides americanus fasciatus, p. 295';

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above, and the colours as Ridgway has them (crown yellow, "light wax yellow or dull light gamboge to saffron"; the forehead black with white spots, in fasciatus much larger and sometimes run together into a dull white frontal area; the rest of the crown, the lores, the ear and the hind-neck glossy blue-black, with a distinct white streak above the ear; a narrow white stripe below the eye and a black malar stripe under it, narrower and less distinct in fasciatus; the back mostly white in a long patch down the middle, broken by black bars; the wing black, the outer webs of the flight feathers spotted with white; the tail black, the two outer pairs white over the distal half or more, the third white at its tip; the underparts white, the sides and flanks barred with black, narrower in fasciatus; the bill grayish horn with the lower mandible paler; the feet dark grayish horn, in dried skins). Not found in what was read, and the agent\'s: the iris (built dark brown), the living colour of the feet, the undertail coverts, the underside of the wing, how large each patch is, the outline, and the stance. Ridgway gives the outer front toe and not a middle toe, and does not say whether it has its claw: it is built without. His length is of skins. The wingspan is from secondary pages that were not opened by the checker.',
  sources: {
    R: `${R}: adult males, museum skins (30 for the lengths: his footnote "Thirty specimens"), read as the Internet Archive's character recognition (archive.org item cu31924022528081)`,
    A: 'Audubon field guide, American Three-toed Woodpecker: wingspan 35 to 41 cm; flap and glide, undulating flight (a summary of the page; unconfirmed)',
    W: 'Wikipedia, "American three-toed woodpecker": wingspan 37 to 39 cm, males 58.3 g, 21 to 23 cm long (a summary of the page; unconfirmed)',
    B: 'Seattle Audubon, BirdWeb, American Three-toed Woodpecker: conifer forest, flakes bark from dead and dying trees, quiet and tame (a summary; unconfirmed)',
  },
  lengths: [
    ['wing', 'Wing, folded', 116.8, [113, 123], 'R'],
    ['tail', 'Tail', 74.5, [69, 80.5], 'R'],
    ['culmen', 'Exposed culmen (his table\'s heading; the line says "culmen")', 27.1, [24, 29.5], 'R'],
    ['tarsus', 'Tarsus', 20, [19, 21.5], 'R'],
    ['midToe', 'Outer front toe (no claw, apparently)', 10.5, [9, 11.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 202, [188, 215], 'R'],
    ['span', 'Wingspan (two secondary pages)', null, [350, 410], 'A'],
  ],
  proportions: [
    'Tail about two thirds of the wing, its middle feathers slightly decurved and gradually narrowed (R, of the genus)',
    'The longest primaries reach a little over a third of the wing beyond the secondaries (R, of the genus)',
    'Bill about as long as the head, extremely depressed (broader than deep at the nostrils), wedge-shaped, the tip a chisel; the culmen straight and sharply ridged (R, of the genus)',
    'Tarsus decidedly longer than the hind toe with its claw; the hind toe a little longer than the outer front toe, the inner front toe nearly as long (R, of the genus)',
    'Three toes: two forward and one back, the inner hind toe absent (R)',
  ],
  mass: 'Mass about 58 g in males: 45 to 70 g for the species (W, A)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const BLACK = [222, 14, 9], WHITE = [42, 8, 86], DULL = [42, 6, 66], YELLOW = [46, 82, 52], TUFT = [32, 12, 44], BAR = [222, 14, 11];

const size = (p) => (p.x > 78 ? 2.8 : 6.5);
const head = (p) => p.x > 74;

export default {
  name: 'American Three-toed Woodpecker', latin: 'Picoides dorsalis', key: 'american-three-toed-woodpecker', seed: 181,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'very rare', source: 'B -; P R; a bird of the subalpine: BirdWeb has it mostly above 4,000 ft' },
  // How it lives on a visit (life/families/trunk.js, which says what each number is). From what was read: it "forages
  // on live or dead conifers, especially spruces", "often scales off flakes of bark to get at insects, and may
  // gradually remove all bark from a dead tree", "may perch motionless against a tree trunk for minutes at a time",
  // and is "often quite unwary"; its call "a soft pik" (Audubon, read 2026-11-16); it is "not wary of humans, but ...
  // quiet and inconspicuous", and visits "sapsucker wells to feed on the sap" (BirdWeb, read 2026-11-16); its drum
  // at "an average pace", often "a bit hollow" on dead softwoods (Pfeiffer, Northern Woodlands, 2017). The agent's
  // own: every distance, time, chance and height below, and how much of its time goes to each thing.
  way: {
    family: 'trunk', there: 0.6, gap: [90, 360],
    hz: 9, speed: 8.5, range: 40, low: 0.8, high: 7, start: [0.1, 0.6], quota: [1, 3], stay: [60, 200], bound: 0.2,
    // conifers only: a dead one most of all, then spruces
    suits: (t) => ({ snag: 4, spruce: 2, slope: 1, mature: 1, giant: 1, cedar: 0.5 }[t.kind] || 0),
    homeOff: 24,
    flush: 4, startle: 8, near: 0.75, gone: 0.25,
    step: [0.03, 0.06], beat: 0.13, run: [1, 3], backs: 0.1,
    bear: (r) => (r() < 0.75 ? (r() - 0.5) * 0.5 : (r() < 0.5 ? 1 : -1) * (1.1 + r() * 0.5)),
    moving: (bearing) => (Math.abs(Math.sin(bearing)) > 0.7 ? 'hitching round the trunk' : 'hitching up the trunk, braced on its tail'),
    probing: 'looking over the bark', resting: 'clinging, braced on its tail',
    flake: { chance: 0.6, time: [6, 20], rate: 2.2, doing: 'scaling flakes of bark off the trunk, after the beetles under it', reach: 25 },
    still: { chance: 0.15, time: [10, 40], doing: 'clinging still against the bark' },
    work: { chance: 0.12, time: [3, 7], rate: 3.2, doing: 'chiselling a little at the wood', reach: 40 },
    sap: { chance: 0.1, sip: [3, 8], reach: 0.12, doing: 'taking sap at a sapsucker\'s wells' },
    call: { every: [50, 200], time: 0.4, rate: 2.5, reach: 50, doing: 'calling: a soft "pik"' },
    drum: { time: 1.9, reach: 250, doing: 'drumming on a dead tree: a hollow roll', every: [150, 450], bout: [1, 3], pause: [10, 25], seek: true },
  },
  voices: {
    drum: { file: 'atw-drum.mp3', level: 0.6, near: 12,
      credit: { what: 'American Three-toed Woodpecker, drum (a kinglet sings in the original, above the cut\'s band)', by: 'J. Job, National Park Service, Rocky Mountain NP sound library, 2015', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-americanthreetoedwoodpecker.htm', bytes: 874724, kept: 1.9 } },
    call: { silent: true },   // the only public-domain recordings found are of its drum
    // (made in the page)
    knock: { synth: 'knock', level: 0.2, near: 5, pitch: 950 },
    flake: { synth: 'knock', level: 0.1, near: 3.5, pitch: 1350 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 21 cm long and 58 g, wings 35 to 41 cm across: a woodpecker a little smaller than a Hairy.',
    marks: ['A yellow patch on the crown (the male)', 'Black and white, with a long white patch down the back and barred flanks', 'Only three toes: two forward, one back', 'A white streak above the ear and a narrow black moustache'],
    lives: 'Mature conifer forest, mostly high in the mountains, and stands killed by fire or beetles. It flakes the bark from dead and dying trees to get at the beetle grubs under it, and drums a roll that fades at the end. Quiet, tame and hard to find: a pair often forages apart.',
  },
  plate: { wide: 0.5, bar: 0.03 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 100.5
    top:    [[-21, 1.5], [-9.3, 6], [4.7, 11], [21, 15], [37.3, 17], [52.2, 17], [64.3, 15.5], [72.7, 14], [78.3, 14], [82.9, 15.6], [88, 17.6], [92, 17.8], [95.5, 16], [98.3, 12.8], [99.9, 9.8], [100.5, 7.5]],
    bottom: [[-25.6, -0.9], [-13, -5.1], [0, -10.1], [14, -16.6], [28.9, -21.2], [42.9, -22.1], [55, -19.8], [65.2, -15.2], [72.7, -10.1], [78.3, -6.9], [83.9, -5.2], [89.5, -4.2], [94.6, -2.6], [97.8, -1.2], [100.5, 0]],
    half:   [[-25.6, 3.1], [-13, 6.6], [0, 11.3], [14, 15.5], [28.9, 17.9], [42.9, 18.1], [55, 16.4], [65.2, 13.2], [72.7, 10.4], [78.3, 9.4], [83.9, 9.6], [89.5, 9.6], [94.1, 8.2], [97.4, 6.4], [99.5, 5], [100.5, 4.4]],
    widest: 0.46,
    neck: [70, 82],
    eye: { x: 91.5, y: 9, r: 2.1 },
    bill: { culmen: 27.1, drop: 0, gape: 4.5 },
    wing: {
      chord: 116.8, wrist: [70, -3], aim: [-116, 8],
      up:   [[0, 4], [0.12, 15], [0.3, 18], [0.5, 15.5], [0.75, 8.5], [0.9, 3.5], [1, 0.8]],
      down: [[0, 2.5], [0.12, 7.5], [0.3, 11], [0.5, 11.5], [0.75, 8.5], [0.9, 4.5], [1, 0.8]],
      rest: 3, proud: 1.8,
      span: 380, shoulder: [68, 9, 11], arm: 52, lead: 11, sweep: 25, root: 85, tipChord: 36,
    },
    // two thirds of the wing, stiff, the middle pair decurved at its end: it is the bird's prop
    tail: { length: 74.5, root: 1, rootHalf: 4, feathers: 12, width: 14, closed: 0.045, graded: 14, point: 0.4, droop: 0.03, tent: 8 },
    // (the builder's outer front toe, `side` and yaw O, lies on the middle one: see the head of this file; `hind` is the one hind toe)
    leg: { knee: [43, -13, 10], shin: 18, tarsus: 20, thick: [7, 3.2, 1.9], toes: { mid: 10.5, side: 10.5, hind: 11.2, claw: 6, hindClaw: 6.2 }, splay: 0.3, yaw: { O: 0, I: -0.3 } },
  },
  poses: {
    // on a trunk: +x is up the bark and +y out of it. The body is held off the bark on its legs, and the tail is let down until its tip rests on it.
    perched: { pitch: 0.2, lift: 0.36, lean: 0.004, droop: 0.05, head: { pitch: 0.1 }, tail: { prop: 0.002, fan: 0.04 }, feet: { mode: 'flat', width: 0.016, ahead: 0.007, toeOut: 0.5 }, board: true },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.2 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // underparts white (R)
      { where: (p) => p.a > 0.14 && p.a < 0.56 && p.x < 70 && p.x > -14, colour: WHITE, bars: [BAR, 3, 0.2], size: 7 },     // sides and flanks barred with black, narrower in fasciatus (R)
      { where: (p) => p.a > 0.2 && p.a < 0.52 && p.x >= 52 && p.x < 74, colour: WHITE, bars: [BAR, 2, 0.2], size: 5 },       // the sides of the breast: irregular, broken into spots and streaks (R)
      { where: (p) => p.a >= 0.56, colour: BLACK, size },                                       // upper parts black (R)
      { where: (p) => p.a >= 0.84 && p.x > 4 && p.x < 66, colour: WHITE, bars: [BAR, 2, 0.26], size: 7 },                    // a long white patch down the middle of the back, broken by black bars (R, fasciatus)
      { where: (p) => p.a >= 0.64 && p.x > -20 && p.x <= 4, colour: WHITE, bars: [BAR, 3, 0.17], size: 5 },                  // upper tail coverts and lower rump barred or spotted with white (R)
      { where: (p) => p.x > 63 && p.a > 0.3 && p.a < 0.56 && p.y > -6, colour: BLACK, size: 3.5 },                          // the neck's sides black behind the ear, where the breast's bars end (the agent's)
      { where: (p) => head(p) && p.y > 3.2, colour: BLACK, size: 2.8 },                         // lores, orbital and auricular regions and the hind-neck glossy blue-black (R)
      { where: (p) => p.x > 80 && p.y > -1.6 && p.y <= 0.6, colour: BLACK, edge: WHITE, fringe: 0.4, size: 2.2 },            // a narrow black malar stripe, broken by white tips (R)
      { where: (p) => p.x > 80 && p.y > 0.6 && p.y <= 3.2, colour: WHITE, size: 2.2 },          // a narrow white rictal stripe below the eye (R)
      { where: (p) => p.x > 95 && p.y > 3.2 && p.y < 9, colour: TUFT, size: 2.2 },              // nasal tufts light grayish brown, finely streaked (R)
      { where: (p) => p.x > 76 && p.x < 93 && p.y >= 11.2 && p.y < 12.8 && p.a < 0.86, colour: WHITE, size: 2.2 },           // a white streak above the ear, distinct in fasciatus (R)
      { where: (p) => (((p.x - 86) / 7.5) ** 2 + ((1 - p.a) / 0.14) ** 2) < 1, colour: YELLOW, size: 2.4 },         // the crown yellow, in the male (R)
      { where: (p) => p.x >= 93 && p.a > 0.66 && p.y > 8, colour: DULL, edge: BLACK, fringe: 0.3, size: 2.2 },               // the forehead: large white spots, run together into a dull white area (R, fasciatus)
    ],
    wing: {
      web: BLACK, edge: [222, 12, 15], tertial: BLACK, covert: BLACK, lesser: BLACK, lesserEdge: [222, 12, 16],
      medianTip: null, greaterTip: null, patchSkip: 0,
      // the outer webs of the flight feathers spotted with white (R); how many, and how large, are the agent's
      primaryBars: [[0.26, 0.31, WHITE, 'outer'], [0.45, 0.5, WHITE, 'outer'], [0.64, 0.69, WHITE, 'outer']],
      secondaryBars: [[0.34, 0.39, WHITE, 'outer'], [0.62, 0.67, WHITE, 'outer']],
      tertialTip: null,
      under: [222, 8, 22], underCovert: [42, 6, 62], underCovertTip: null,                     // under the wing: not described in what was read; dusky flight feathers, pale coverts here
      underBars: [[0.25, 0.33, WHITE, 'both'], [0.5, 0.58, WHITE, 'both']],
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 8, greaterEnd: 0.4, median: 7, medianEnd: 0.23 },
      spread: { primaries: 9, secondaries: 7, shape: [0.7, 0.9, 0.98, 1, 1, 1, 0.99, 0.97, 0.95] },
    },
    // black above; the two outer pairs white over the distal half or more, the third white at its tip (R)
    tail: { web: [222, 12, 9], edge: [222, 12, 13], under: [222, 8, 18], tip: [[5, WHITE, 0.62], [4, WHITE, 0.56], [3, WHITE, 0.3]], point: 0.3 },
    bill: { upper: [35, 8, 26], lower: [40, 10, 42], lowerBase: [[44, 12, 54], 0.5] },          // grayish horn, the mandible paler (R)
    mouth: [350, 30, 40],
    eye: { iris: [25, 40, 11], pupil: [240, 15, 5] },                                           // iris: not found; dark brown here
    leg: [32, 8, 25],                                                                           // dark grayish horn (R, of skins)
    shin: [222, 8, 14],
  },
};
