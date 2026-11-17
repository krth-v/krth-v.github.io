// Pileated Woodpecker, Dryocopus pileatus (the western form, picinus): the adult male. The female has the
// forehead and the front of the crown greyish brown, and her moustache stripe is slate, not red (Ridgway).
//
// What is published and what is not. The lengths under `published` are Ridgway's for adult males of the
// north-west coast, and the bird is built to their means; life/measure.js measures the built bird against
// them. The colours follow his description, with the white stripe down the neck as two later sources have
// it. The outline of head and body, where the eye sits, how the folded wing lies and how long the crest is
// are in nothing that was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, each through a tool that returns a
// summary of the scan's character recognition. No page was seen as an image. How many skins Ridgway measured
// is not given.
//
// Its feet. A woodpecker's foot has two toes forward and two back. The builder has three front toes and a
// hind one, so the outer of the three is turned out and back (shape.leg.yaw), and the toe built to Ridgway's
// "outer anterior toe" is the one that points straight ahead.

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Phloeotomus pileatus picinus';

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above, and the colours as Ridgway has them (crown and pointed crest bright red, the forehead too in the male; a narrow whitish stripe behind the eye over a broad slate one; the moustache stripe crimson; chin and throat whitish, washed grey; the rest sooty slate-black, the flanks\' feathers tipped whitish; the flight feathers white at the base; under the wing yellowish white; iris cream yellow). The broad white stripe from the bill down the side of the neck is as BirdWeb and Wikipedia have it. Not found in what was read, and the agent\'s: the crest\'s length, the outline, how large the white wrist patch is. Whether the toe was measured with its claw is not said; it is built without.',
  sources: {
    R: `${R}: adult males, museum skins, British Columbia to California`,
    W: 'Wikipedia, "Pileated woodpecker" (read 2026-11-16): 40 to 49 cm long, wingspan 66 to 75 cm, about 300 g (males)',
    B: 'Seattle Audubon, BirdWeb, Pileated Woodpecker: its holes, its food, its loud call and its drumming; pairs on a territory all year',
    D: 'Animal Diversity Web, Dryocopus pileatus: slow, vigorous flight; drumming mostly in the morning',
  },
  lengths: [
    ['wing', 'Wing, folded', 237, [230, 247], 'R'],
    ['tail', 'Tail', 157.2, [147, 163], 'R'],
    ['culmen', 'Exposed culmen', 54.4, [52, 58.5], 'R'],
    ['tarsus', 'Tarsus', 34.4, [32.5, 36], 'R'],
    ['midToe', 'Outer front toe', 26.5, [25, 28], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 426, [400, 450], 'R'],
    ['span', 'Wingspan (one secondary source)', null, [660, 750], 'W'],
  ],
  proportions: [
    'Tail about two thirds of the wing (Ridgway, of the genus); its feathers very broad, the middle pair bent down at the tip',
    'The longest primaries reach about a quarter of the wing beyond the secondaries',
    'Bill about as long as the head, broad at the base, wedge-shaped, chisel-tipped; the culmen straight',
    'Crest conspicuous and pointed',
    'Two toes forward and two back (BirdWeb); the claws very large and strongly curved',
  ],
  mass: 'Mass about 277 g: 225 to 400 (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const SOOT = [215, 9, 11.5], BELLY = [215, 8, 13.5], RED = [358, 80, 40], WHITE = [48, 22, 90], THROAT = [44, 8, 76], YELLOW = [48, 42, 64], SLATE = [215, 10, 17];

const size = (p) => (p.x > 178 ? 6 : p.x > 150 ? 9 : 15);
// the white stripe: from near the bill's base (it begins 8.5 mm behind it) under the eye, back over the cheek and down the side of the neck to the shoulder
const stripe = (p) => p.x > 126 && p.x <= 207 && Math.abs(p.y - (1.5 + (p.x - 126) * 0.085)) < (p.x > 176 ? 3.7 : 3.3 - (176 - p.x) * 0.02);

export default {
  name: 'Pileated Woodpecker', latin: 'Dryocopus pileatus', key: 'pileated-woodpecker', seed: 59,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'some', source: 'B F; P regular; the second reader\'s own words, not a source\'s: "few pairs per valley"', mean: 0.5 },
  way: {
    family: 'trunk', there: 0.5, gap: [60, 300],
    // how it works a trunk (what life/families/trunk.js reads)
    hz: 5.5, speed: 10.5, range: 46, low: 1.5, high: 14, start: [0.05, 0.4], quota: [2, 3], stay: [30, 90], bound: 0.3,
    suits: (t) => t.kind === 'snag' || t.girth > 0.45,
    // how near it lets the walker come (life/behave.js; the agent's own: it is a wary bird, and a big one)
    flush: 12, startle: 20, near: 0.5, gone: 0.5,
    step: [0.05, 0.09], beat: 0.16, run: [2, 5],
    // up the trunk, a little to one side or the other
    bear: (r) => (r() < 0.85 ? (r() - 0.5) * 0.7 : (r() < 0.5 ? 1 : -1) * (1.1 + r() * 0.5)),
    moving: (bearing) => (Math.abs(Math.sin(bearing)) > 0.7 ? 'hitching round the trunk' : 'hitching up the trunk, braced on its tail'),
    probing: 'listening at the bark', resting: 'clinging, braced on its tail',
    work: { chance: 0.5, time: [5, 16], rate: 2.8, doing: 'chiselling into the wood, after carpenter ants', reach: 110 },
    call: { every: [35, 110], time: 2.9, rate: 3.4, reach: 380, doing: 'calling: a loud, ringing run of notes', flying: true },
    drum: { time: 2.8, reach: 500, doing: 'drumming: a slow, deep roll on resonant wood' },
    // a standing dead tree within thirty-four metres of the walk if there is one, a great trunk if not; and
    // then any dead tree or great trunk within forty metres of that
    home: (habitat, r) => {
      const snags = habitat.trunks.filter((t) => t.kind === 'snag' && t.off < 34), big = habitat.trunks.filter((t) => t.kind === 'giant' && t.off < 30), from = snags.length && r() < 0.7 ? snags : big.length ? big : snags;
      return from.length ? from[Math.floor(r() * from.length)] : null;
    },
    spot: (home, r, habitat) => { const near = habitat.trunksNear(home.foot.x, home.foot.z, 40).filter((t) => t.off < 36 && (t.kind === 'snag' || t.girth > 0.45)); return near.length ? near[Math.floor(r() * near.length)] : home; },
  },
  voices: {
    call: { file: 'pileated-call.mp3', level: 1, near: 14,
      credit: { what: 'Pileated Woodpecker, call', by: 'G. McGrane, 2004 (Wikimedia Commons)', licence: 'Public domain (released by its author)',
        source: 'https://commons.wikimedia.org/wiki/File:Pileated_Woodpecker.ogg', bytes: 209993, kept: 2.95 } },
    // (made in the page: a bill on wood is a knock, and a roll of knocks)
    drum: { synth: 'drum', level: 0.9, near: 16, pitch: 620 },
    // (made in the page: a bill on wood is a knock, and a roll of knocks)
    knock: { synth: 'knock', level: 0.5, near: 9, pitch: 760 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 43 cm long, wings 66 to 75 cm across: the size of a crow, and the largest woodpecker of these woods.',
    marks: ['A pointed red crest', 'Black, with a white stripe from the bill down the side of the neck', 'White under the wings and at the wrist, seen when it flies', 'This is a male: his moustache stripe is red, hers dark'],
    lives: 'Old forest with standing dead trees. It chisels long, squared holes into trunks and logs after carpenter ants, drums a slow, deep roll on a resonant snag, and calls a loud, ringing run of notes. A pair keeps its territory all year.',
  },
  plate: { wide: 1.15, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 215.5
    top:    [[-45, 3], [-20, 12], [10, 22], [45, 30], [80, 34], [112, 34], [138, 31], [156, 27.5], [168, 27], [178, 30], [188, 33.5], [197, 34], [205, 31], [211, 25], [214.5, 19], [215.5, 15]],
    bottom: [[-55, -2], [-28, -11], [0, -22], [30, -36], [62, -46], [92, -48], [118, -43], [140, -33], [156, -22], [168, -14.5], [180, -10], [192, -8], [203, -5], [210, -2.5], [215.5, 0]],
    half:   [[-55, 6.5], [-28, 14], [0, 24], [30, 33], [62, 38], [92, 38.5], [118, 35], [140, 28], [156, 20.5], [168, 17], [180, 17.5], [192, 18.5], [202, 17.5], [209, 13.5], [213.5, 9.5], [215.5, 7.5]],
    widest: 0.46,
    neck: [150, 176],
    eye: { x: 197, y: 17.5, r: 4.2 },
    bill: { culmen: 54.4, drop: 0, gape: 9 },
    // The crest: pointed, standing back from the hindcrown (see life/bird.js). It takes the crown's red, from a
    // stretch of the crown that is red all through. Every number of it is the agent's.
    crest: { sunk: 4, paint: [187, 203], lobes: [[202, 20, 1.2, 8, 7, 0.08], [195, 31, 1.05, 10.5, 8, 0.1], [188, 40, 0.92, 11.5, 8, 0.12]] },
    wing: {
      chord: 237, wrist: [150, -6], aim: [-234, 16],
      up:   [[0, 8], [0.12, 30], [0.3, 36], [0.5, 31], [0.75, 17], [0.9, 7], [1, 1.5]],
      down: [[0, 5], [0.12, 15], [0.3, 22], [0.5, 23], [0.75, 17], [0.9, 9], [1, 1.5]],
      rest: 6, proud: 3.5,
      span: 700, shoulder: [146, 18, 23], arm: 105, lead: 22, sweep: 50, root: 175, tipChord: 70,
    },
    // wedge-shaped and stiff: it is the bird's prop
    tail: { length: 157.2, root: 2, rootHalf: 8, feathers: 12, width: 28, closed: 0.045, graded: 30, point: 0.35, droop: 0.03, tent: 16 },
    leg: { knee: [92, -30, 20], shin: 38, tarsus: 34.4, thick: [13, 6, 3.4], toes: { mid: 26.5, side: 23, hind: 14, claw: 15, hindClaw: 11 }, splay: 0.3, yaw: { O: 2.2, I: -0.3 } },
  },
  poses: {
    // on a trunk: +x is up the bark and +y out of it. The body is held off the bark on its legs, and the tail is let down until its tip rests on it.
    perched: { pitch: 0.2, lift: 0.36, lean: 0.004, droop: 0.05, head: { pitch: 0.1 }, tail: { prop: 0.002, fan: 0.04 }, feet: { mode: 'flat', width: 0.034, ahead: 0.014, toeOut: 0.5 }, board: true },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.2 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                  // breast and belly slaty black, only slightly paler than the back (R)
      { where: (p) => p.a > 0.2 && p.a < 0.5 && p.x < 100 && p.x > 10, colour: BELLY, edge: [44, 6, 22], fringe: 0.06, size: 15 },   // sides and flanks: feathers margined or tipped with whitish (R)
      { where: (p) => p.a >= 0.5, colour: SOOT, size },                                         // nape, back, rump and upper tail coverts plain sooty slate-black (R)
      { where: (p) => p.x > 176 && p.y < -1.5, colour: THROAT, size: 5 },                       // chin and throat white, in this form usually washed grey (R)
      { where: (p) => p.x > 176 && p.y >= 11.5 && p.y < 20, colour: SLATE, size: 5 },           // a broad slate stripe over the ear (R)
      { where: stripe, colour: WHITE, size: 6 },                                                // a broad white stripe below the eye and down the side of the neck (B, W)
      { where: (p) => p.x > 182 && p.x < 197 && p.y >= 20 && p.y < 22.6, colour: WHITE, size: 4 },                  // a narrow yellowish-white stripe behind the eye (R)
      { where: (p) => p.x > 180 && p.x <= 196 && p.y >= -1.5 && p.y < 3.6, colour: SLATE, size: 5 },                // the moustache stripe: slate behind,
      { where: (p) => p.x > 196 && p.y >= -1.5 && p.y < 4.2, colour: RED, size: 4.5 },                              // crimson in the male (R)
      { where: (p) => p.x > 208 && p.y >= 8.5 && p.y < 17, colour: YELLOW, size: 3.5 },         // lores and the lower part of the nasal tufts dull yellow (R)
      { where: (p) => (p.x > 181 && p.y > 24.5) || (p.x > 204 && p.y > 19.5), colour: RED, size: 6.5 },             // crown and crest bright poppy red; in the male the forehead too (R)
    ],
    wing: {
      web: SOOT, edge: [215, 9, 15], tertial: SOOT, covert: SOOT, lesser: SOOT, lesserEdge: [215, 8, 16],             // wing coverts sooty slate-black like the back (R)
      medianTip: null, greaterTip: null, patchSkip: 0,
      primaryBars: [[0.2, 0.36, WHITE, 'outer']],            // the flight feathers' white bases show as a small patch beyond the primary coverts (R)
      secondaryBars: [], tertialTip: null,
      under: [215, 8, 16], underCovert: [50, 40, 88], underCovertTip: null,                     // under wing coverts yellowish white (R)
      underBars: [[0.04, 0.5, [50, 36, 86], 'both']],                                           // the inner webs yellowish white on the basal half (R)
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.75, greater: 8, greaterEnd: 0.4, median: 7, medianEnd: 0.23 },
      spread: { primaries: 9, secondaries: 7, shape: [0.7, 0.9, 0.98, 1, 1, 1, 0.99, 0.97, 0.95] },
    },
    tail: { web: [215, 9, 10], edge: [215, 9, 13], under: [215, 8, 15], point: 0.3 },           // dark like the body (R gives it no colour of its own)
    bill: { upper: [215, 8, 28], lower: [215, 8, 34], lowerBase: [[210, 14, 70], 0.5] },        // maxilla slate; mandible bluish white at the base (R)
    mouth: [350, 30, 40],
    eye: { iris: [48, 56, 72], pupil: [240, 15, 5] },                                           // iris cream yellow to buff-yellow (R)
    leg: [215, 6, 22],
    shin: [215, 9, 12],
  },
};
