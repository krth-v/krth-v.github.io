// American Goshawk, Accipiter (Astur) atricapillus (the Northern Goshawk until 2023): the adult male of atricapillus.
// Which form lives on the Olympic Peninsula was not found: laingi, darker, is the islands' off British Columbia.
//
// What is published and what is not. The lengths under `published` are Friedmann's for 27 adult males of atricapillus
// from all parts of the range (U.S. National Museum Bulletin 50, Part XI, 1950, p. 152), and the bird is built to their
// means; his culmen is measured from the cere, and so is this one (life/parts/raptor.js). The colours are his, tract by
// tract (p. 150 to 151), for the adult male. Length and span are Birds of the World's, a secondary source. Not found,
// and the agent's: the claws, the cere and the hook, the outline of head and body, how the folded wing lies.
//
// How the sources were read: Friedmann's text through the Internet Archive's character recognition, by an agent of the
// research of 2026-11-16 (.local-assets/forest/research/birds-wave2-2026-11-16.json); Birds of the World, Wikipedia and
// BirdWeb through tools that return a page's text or a summary of it. No page was seen as an image.

const B = 285;                   // mm from where the tail is rooted to the bill's base (the outline below is in shares of it)
const C = 325.2;                 // the folded wing
const at = (pts, k = 1) => pts.map(([x, y]) => [+(x * B).toFixed(1), +(y * B * k).toFixed(1)]);
const of = (pts) => pts.map(([t, y]) => [t, +(y * C).toFixed(1)]);

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above; the colours as Friedmann has them (above deep gull gray to slate-gray, darker on the back, nape and crown, the top of the head blackish slate; the sides of the crown so mottled with white as to be more white than slate; a white superciliary stripe mottled with blackish slate; the lores, cheeks and ear coverts dirty white streaked blackish to nearly black; below white, thickly mottled, barred or vermiculated with mouse gray, the chin, breast and belly with blackish shaft streaks; the tail like the back, tipped whitish and crossed by four broad fuscous bands, narrower than the gray between them, its outer feathers 18 to 26 mm shorter than the middle ones; the flight feathers fuscous, broadly barred darker; the bill bluish black; the cere yellow; the iris red; the feet yellow and the claws bluish black). Not found, and the agent\'s: the claws (18 and 26 mm), the cere (8 mm) and the hook (7.5 mm), the span it is built at (1,000 mm, within the range for both sexes), the outline, how the folded wing lies.',
  sources: {
    F: 'Friedmann 1950, The Birds of North and Middle America, Part XI (U.S. National Museum Bulletin 50), p. 152, Accipiter gentilis atricapillus: adult males, 27 skins from all parts of the range',
    O: 'Birds of the World, American Goshawk, Appearance: males 53 to 58.5 cm long; a wingspan of 89 to 122 cm for both sexes',
    B: 'Seattle Audubon, BirdWeb, Northern Goshawk: short, round wings and a long tail, wider than the other accipiters\'; rare in May on the Pacific Northwest coast',
  },
  lengths: [
    ['wing', 'Wing, folded', 325.2, [303, 354], 'F'],
    ['tail', 'Tail', 245.7, [226.5, 280], 'F'],
    ['culmen', 'Culmen from the cere', 21.9, [20, 26], 'F'],
    ['tarsus', 'Tarsus', 75.4, [67, 82.5], 'F'],
    ['midToe', 'Middle toe without its claw', 47.5, [42.5, 54.5], 'F'],
    ['length', 'Length, bill tip to tail tip (males; a secondary source)', null, [530, 585], 'O'],
    ['span', 'Wingspan (both sexes; a secondary source)', null, [890, 1220], 'O'],
  ],
  proportions: [
    'Wings short and round; the fourth and fifth primaries the longest, the five outermost emarginated (Friedmann; BirdWeb)',
    'Tail long, wider than the other accipiters\', slightly rounded: its outer feathers 18 to 26 mm shorter than the middle ones (Friedmann; BirdWeb)',
    'A short, hooked bill with a cere at its base (BirdWeb)',
    'The tarsus long, about 75 mm, the middle toe about 47.5 mm (Friedmann)',
  ],
  mass: 'Males 677 to 1,010 g (Birds of the World)',
};

// Friedmann's colours, as paint: [hue, saturation, lightness]
const SLATE = [214, 12, 38], DARKER = [216, 13, 31], CAP = [220, 14, 12], WHITE = [210, 10, 92], MOUSE = [215, 9, 40];
const SHAFT = [218, 14, 18], FUSCOUS = [22, 10, 22], STRIPE = [210, 8, 90], EAR = [220, 12, 20], PALE = [212, 8, 78];
const eye = { x: +(0.925 * B).toFixed(1), y: +(0.076 * B).toFixed(1), r: 7.8 };
const head = (p) => p.x > 0.79 * B;
// the white stripe over the eye, from above the bill's base back over the ear coverts
const brow = (p) => head(p) && p.a >= 0.46 && p.a < 0.76 && p.y > eye.y + eye.r * 0.7 && p.y < eye.y + eye.r * 2.2 && p.x > eye.x - eye.r * 6 && p.x < eye.x + eye.r * 1.8;

export default {
  name: 'American Goshawk', latin: 'Accipiter atricapillus', key: 'american-goshawk', seed: 414,
  // ---- who is about on a visit (life/species/index.js says what each is)
  census: { tier: 'very rare', source: 'B R; P U; the Northern Goshawk until 2023' },
  // ---- how it lives on a visit (life/families/raptor.js, a hawk's manner). Every number is the agent's own.
  way: {
    family: 'raptor', manner: 'hawk',
    // (the rarest and the fiercest: there from the first on a fifth of the visits it is about on, off for good more often
    // than not; its dash the fastest and its alarm the widest of the three)
    there: 0.2, gap: [200, 500], fastest: 24,
    hz: 4.2, speed: 12, pulse: [4, 0.9], stay: [6, 25],
    flush: 20, startle: 40, near: 0.4, gone: 0.6,
    call: { every: [200, 600], time: 2.5, rate: 6, reach: 300, doing: 'calling: a harsh, loud kak-kak-kak' },
    wood: { off: 26, low: 3.5, high: 9, thick: 0.025, dash: 17, fly: 3, range: [25, 55], alarm: 24, hunt: 0.85 },
  },
  voices: {
    call: { silent: true },   // only CC BY-SA recordings were found
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 56 cm long, a male: as big as a raven, the female a little larger.',
    marks: ['Slate-gray above, a blackish cap', 'A broad white stripe over a red eye', 'Pale gray below, finely barred', 'A long tail with broad dark bands'],
    lives: 'The largest and fiercest of the forest hawks, and rare here. It comes through dense cover, low and fast, and takes grouse, jays and squirrels; it plucks its prey on a perch. Near its nest a pair will drive a person off; away from a nest, as here, it keeps its distance.',
  },
  plate: { wide: 2.3, bar: 0.2 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base (where the feathers end) at B
    top:    at([[-0.16, 0.012], [-0.095, 0.044], [0, 0.086], [0.12, 0.126], [0.26, 0.152], [0.41, 0.162], [0.54, 0.157], [0.64, 0.142], [0.71, 0.127], [0.765, 0.122], [0.815, 0.128], [0.865, 0.132], [0.91, 0.127], [0.948, 0.111], [0.978, 0.09], [1, 0.068]]),
    bottom: at([[-0.19, -0.008], [-0.12, -0.042], [-0.025, -0.096], [0.11, -0.162], [0.27, -0.2], [0.42, -0.198], [0.53, -0.173], [0.62, -0.13], [0.685, -0.094], [0.75, -0.066], [0.815, -0.047], [0.88, -0.03], [0.938, -0.016], [0.978, -0.006], [1, 0.004]]),
    half:   at([[-0.19, 0.02], [-0.12, 0.056], [-0.025, 0.105], [0.11, 0.157], [0.27, 0.184], [0.42, 0.18], [0.53, 0.159], [0.62, 0.127], [0.685, 0.106], [0.75, 0.099], [0.815, 0.102], [0.88, 0.097], [0.938, 0.077], [0.978, 0.052], [1, 0.026]]),
    widest: 0.45,
    neck: [+(0.68 * B).toFixed(1), +(0.775 * B).toFixed(1)],
    eye,
    // the hook and the cere: life/parts/raptor.js
    bill: { culmen: 21.9, drop: 0, gape: 23, hook: { drop: 7.5, from: 0.45 }, cere: { long: 8 } },
    wing: {
      chord: C, wrist: [+(0.79 * B).toFixed(1), +(0.02 * B).toFixed(1)], aim: [-0.993 * C, -0.12 * C].map((v) => +v.toFixed(1)),
      up: of([[0, 0.041], [0.1, 0.105], [0.25, 0.15], [0.45, 0.136], [0.7, 0.078], [0.88, 0.031], [1, 0.005]]),
      down: of([[0, 0.024], [0.1, 0.065], [0.25, 0.092], [0.45, 0.092], [0.7, 0.065], [0.88, 0.031], [1, 0.005]]),
      rest: 8.3, proud: 5,
      span: 1000, shoulder: [+(0.66 * B).toFixed(1), +(0.09 * B).toFixed(1), +(0.11 * B).toFixed(1)], arm: 0.64 * C, lead: 0.1 * C, sweep: 0.2 * C, root: 0.84 * C, tipChord: 0.55 * C,
    },
    // slightly rounded: the outer feathers 22 mm shorter, between Friedmann's 18 and 26
    tail: { length: 245.7, root: 0, rootHalf: 17, feathers: 12, width: 42, closed: 0.05, graded: 22, point: 0.45, droop: 0.02, tent: 14 },
    leg: { knee: [+(0.36 * B).toFixed(1), +(-0.12 * B).toFixed(1), +(0.1 * B).toFixed(1)], shin: 88, tarsus: 75.4, thick: [32, 9.5, 6],
      toes: { mid: 47.5, side: 37, hind: 26, claw: 18, hindClaw: 26 }, splay: 0.4, talons: { claw: 6.5, curve: 2.0 } },
  },
  poses: {
    perched: { pitch: 0.95, lift: 0.84, lean: 0.01, droop: 0.04, head: { pitch: -0.05 }, tail: { pitch: -0.16, fan: 0.03 }, feet: { mode: 'grip', round: 0.02 }, perch: 0.02 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0, tail: { fan: 0.35 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, bars: [MOUSE, 7, 0.07], shaft: SHAFT, shaftWidth: 0.08, size: 15 },             // below white, thickly vermiculated mouse gray; blackish shaft streaks on the breast and belly
      { where: (p) => p.a < 0.56 && p.x < 0.45 * B, colour: WHITE, bars: [MOUSE, 7, 0.08], size: 15 },   // the shaft streaks usually absent on the sides, flanks and thighs
      { where: (p) => p.a >= 0.56, colour: SLATE, edge: DARKER, fringe: 0.04, size: 18 },                // above gull gray to slate-gray
      { where: (p) => p.x < 0.12 * B && p.a < 0.42, colour: WHITE, bars: [MOUSE, 3, 0.05], size: 12 },   // under tail coverts white, barred mouse gray
      { where: (p) => p.x > 0.7 * B && p.a >= 0.56, colour: DARKER, size: 10 },                          // darker on the nape
      { where: (p) => head(p) && p.a >= 0.4 && p.a < 0.62 && p.y < eye.y + eye.r * 0.8 && p.x < eye.x + eye.r, colour: EAR, shaft: STRIPE, shaftWidth: 0.08, size: 6 },   // the ear coverts nearly black, streaked
      { where: (p) => head(p) && p.a >= 0.68, colour: CAP, size: 7 },                                    // the top of the head blackish slate
      { where: brow, colour: STRIPE, shaft: CAP, shaftWidth: 0.12, size: 5.5 },                            // a white stripe over the eye, mottled blackish
    ],
    wing: {
      web: [216, 10, 30], edge: DARKER, tertial: SLATE, covert: SLATE, lesser: SLATE, lesserEdge: DARKER,
      medianTip: null, greaterTip: null, tertialTip: null, patchSkip: 0,
      primaryBars: [[0.16, 0.24, FUSCOUS, 'inner'], [0.42, 0.5, FUSCOUS, 'inner'], [0.68, 0.76, FUSCOUS, 'inner']],     // broadly barred darker on the inner webs
      secondaryBars: [[0.22, 0.3, FUSCOUS, 'inner'], [0.52, 0.6, FUSCOUS, 'inner']],
      under: PALE, underCovert: WHITE, underCovertTip: null, underBars: [[0.14, 0.22, [214, 10, 42], 'both'], [0.4, 0.48, [214, 10, 42], 'both'], [0.66, 0.74, [214, 10, 42], 'both']],
      fold: { primaries: 6, secondaries: 7, secondaryEnd: 0.8, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.26, feather: 1.7 },
      spread: { primaries: 10, secondaries: 11, shape: [0.66, 0.84, 0.95, 1, 1, 0.96, 0.92, 0.88, 0.86] },   // the fourth and fifth the longest (F)
    },
    tail: { web: SLATE, edge: [214, 10, 46], under: [212, 6, 80], point: 0.45, bars: [[218, 12, 20], 4, 0.08], tip: [[6, [210, 8, 88], 0.05]] },   // like the back, four broad fuscous bands, tipped whitish
    bill: { upper: [222, 18, 12], lower: [220, 14, 20], cere: [52, 75, 55] },                                    // bill bluish black; cere yellow
    claw: [220, 12, 10],                                                                                          // claws bluish black
    mouth: [355, 30, 45], eye: { iris: [2, 80, 36], pupil: [240, 15, 5] },                                       // iris red
    leg: [50, 78, 54],                                                                                            // feet yellow
    shin: [210, 8, 84],
  },
};
