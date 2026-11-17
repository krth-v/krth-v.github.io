// Sharp-shinned Hawk, Accipiter striatus velox (the form that breeds across most of North America, the Pacific
// Northwest among it): the adult male.
//
// What is published and what is not. The lengths under `published` are Friedmann's for 51 adult males of velox from all
// parts of the range (U.S. National Museum Bulletin 50, Part XI, 1950, p. 185: Ridgway's own volumes stop short of the
// hawks), and the bird is built to their means; his culmen is measured from the cere, and so is this one
// (life/parts/raptor.js). The tail's least is printed "184" in the scan's text, and is read as 134. The colours are his,
// tract by tract, for the adult male. Not found, and the agent's: the length and span it is built at (Wikipedia gives
// ranges), the claws, the cere and the hook, the outline of head and body, how the folded wing lies.
//
// How the sources were read: Friedmann's text through the Internet Archive's character recognition, by an agent of the
// research of 2026-11-16 (.local-assets/forest/research/birds-wave2-2026-11-16.json); Wikipedia, BirdWeb and Birds of the
// World through tools that return a page's text or a summary of it. No page was seen as an image.

const B = 110;                   // mm from where the tail is rooted to the bill's base (the outline below is in shares of it)
const C = 171.1;                 // the folded wing
const at = (pts, k = 1) => pts.map(([x, y]) => [+(x * B).toFixed(1), +(y * B * k).toFixed(1)]);
const of = (pts) => pts.map(([t, y]) => [t, +(y * C).toFixed(1)]);

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above; the colours as Friedmann has them (the crown and nape blackish plumbeous, the back shading from blackish plumbeous to deep plumbeous on the rump; the cheeks and ear coverts ochraceous-tawny with fine blackish shaft lines; the chin and throat white with fine blackish shaft lines; the breast, belly and flanks white, irregularly barred with ochraceous-tawny to cinnamon-brown, thinner on the lower belly; the under tail coverts pure white; the flight feathers fuscous above, pale gray below, broadly barred; the tail neutral gray, narrowly tipped white, crossed by four bands of grayish fuscous, the last the widest; the bill blackish; the cere yellow or greenish yellow; the iris red; the feet yellow and the claws jet black). Not found, and the agent\'s: the length and span it is built at (270 and 510 mm), the claws (10 and 12 mm), the cere (3.9 mm) and the hook (3.7 mm), the outline, how the folded wing lies.',
  sources: {
    F: 'Friedmann 1950, The Birds of North and Middle America, Part XI (U.S. National Museum Bulletin 50), p. 185, Accipiter striatus velox: adult males, 51 skins from all parts of the range',
    W: 'Wikipedia, "Sharp-shinned hawk": 23 to 30 cm long, a wingspan of 42 to 58 cm; males 82 to 115 g',
    B: 'Seattle Audubon, BirdWeb, Sharp-shinned Hawk: the smallest North American accipiter; short, broad, rounded wings; a long, square tail with very narrow white tips',
  },
  lengths: [
    ['wing', 'Wing, folded', 171.1, [162, 185], 'F'],
    ['tail', 'Tail', 140.8, [134, 152.5], 'F'],
    ['culmen', 'Culmen from the cere', 10.3, [9.5, 11], 'F'],
    ['tarsus', 'Tarsus', 49.9, [46, 54], 'F'],
    ['midToe', 'Middle toe without its claw', 30.7, [28, 35], 'F'],
    ['length', 'Length, bill tip to tail tip (a secondary source)', null, [230, 300], 'W'],
    ['span', 'Wingspan (a secondary source)', null, [420, 580], 'W'],
  ],
  proportions: [
    'Tail about four fifths of the wing (Friedmann\'s means), long and squarish, from slightly notched to slightly rounded (Wikipedia)',
    'Wings short, broad and rounded, set a little further forward on the body than a Cooper\'s (BirdWeb)',
    'Head relatively small (BirdWeb); a hooked bill with a cere at its base',
    'Legs long and very slender: the tarsus about 50 mm against a wing of 171 (Friedmann; Wikipedia)',
  ],
  mass: 'Males 82 to 115 g (W)',
};

// Friedmann's colours, as paint: [hue, saturation, lightness]
const PLUMBEOUS = [214, 16, 28], DEEP = [214, 14, 34], WHITE = [36, 20, 93], TAWNY = [26, 62, 52];
const CHEEK = [24, 50, 58], LINE = [20, 18, 18], DARK = [220, 14, 16], PALE = [212, 8, 76], GRAY = [212, 8, 50];
const eye = { x: +(0.93 * B).toFixed(1), y: +(0.08 * B).toFixed(1), r: 4.3 };
const head = (p) => p.x > 0.79 * B;

export default {
  name: 'Sharp-shinned Hawk', latin: 'Accipiter striatus', key: 'sharp-shinned-hawk', seed: 413,
  // ---- who is about on a visit (life/species/index.js says what each is)
  census: { tier: 'rare', source: 'B U; P U' },
  // ---- how it lives on a visit (life/families/raptor.js, a hawk's manner). Every number is the agent's own.
  way: {
    family: 'raptor', manner: 'hawk',
    // (rare and seen rarely: there from the first on a quarter of the visits it is about on, off for good more often
    // than not when it goes)
    there: 0.25, gap: [150, 420], fastest: 22,
    hz: 7, speed: 10, pulse: [4, 0.5], stay: [6, 30],
    flush: 12, startle: 25, near: 0.5, gone: 0.55,
    call: { every: [150, 450], time: 1.6, rate: 9, reach: 150, doing: 'calling: a high, thin kik-kik-kik' },
    wood: { off: 26, low: 2.5, high: 7, thick: 0.012, dash: 14, fly: 2, range: [15, 45], alarm: 14, hunt: 0.75 },
  },
  voices: {
    call: { file: 'sharpshin-call.mp3', level: 0.6, near: 10,
      credit: { what: 'Sharp-shinned Hawk, \'kik-kik-kik\' (hissy original, noise reduced)', by: 'G. McGrane, Florida, 1996 (Wikimedia Commons)', licence: 'public domain (the recordist\'s own release, PD-self): cut, filtered and noise-reduced',
        licenceUrl: 'https://commons.wikimedia.org/wiki/File:Sharp-shinned_Hawk.ogg', source: 'https://commons.wikimedia.org/wiki/File:Sharp-shinned_Hawk.ogg', bytes: 34226, kept: 1.65 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    // (the length is Wikipedia's range for males, as under `published`; the 270 mm it is built at is the agent's)
    size: '23 to 30 cm long, a male: hardly bigger than a jay. The female is larger.',
    marks: ['Slate-gray above, the cap no darker than the back', 'White below, barred tawny', 'A long, square tail, banded, its tip narrowly white', 'Red eyes; long, very slender yellow legs'],
    lives: 'A small hawk of thick woods, rarely seen while it nests. It comes on small birds by surprise, bursting out of cover and through the branches after them, a few quick beats and a glide; then it is gone. In May a pair has a nest of sticks in a dense conifer.',
  },
  plate: { wide: 1.15, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base (where the feathers end) at B
    top:    at([[-0.16, 0.012], [-0.095, 0.042], [0, 0.082], [0.12, 0.12], [0.26, 0.145], [0.41, 0.155], [0.54, 0.15], [0.64, 0.136], [0.71, 0.122], [0.765, 0.117], [0.815, 0.123], [0.865, 0.128], [0.91, 0.123], [0.948, 0.108], [0.978, 0.088], [1, 0.066]]),
    bottom: at([[-0.19, -0.008], [-0.12, -0.04], [-0.025, -0.092], [0.11, -0.155], [0.27, -0.192], [0.42, -0.19], [0.53, -0.166], [0.62, -0.124], [0.685, -0.09], [0.75, -0.064], [0.815, -0.046], [0.88, -0.03], [0.938, -0.016], [0.978, -0.006], [1, 0.004]]),
    half:   at([[-0.19, 0.019], [-0.12, 0.053], [-0.025, 0.1], [0.11, 0.15], [0.27, 0.176], [0.42, 0.172], [0.53, 0.152], [0.62, 0.122], [0.685, 0.102], [0.75, 0.096], [0.815, 0.099], [0.88, 0.094], [0.938, 0.074], [0.978, 0.05], [1, 0.025]]),
    widest: 0.45,
    neck: [+(0.68 * B).toFixed(1), +(0.775 * B).toFixed(1)],
    eye,
    // the hook and the cere: life/parts/raptor.js
    bill: { culmen: 10.3, drop: 0, gape: 9.5, hook: { drop: 3.7, from: 0.45 }, cere: { long: 3.9 } },
    wing: {
      chord: C, wrist: [+(0.8 * B).toFixed(1), +(0.02 * B).toFixed(1)], aim: [-0.993 * C, -0.12 * C].map((v) => +v.toFixed(1)),
      up: of([[0, 0.041], [0.1, 0.105], [0.25, 0.15], [0.45, 0.136], [0.7, 0.078], [0.88, 0.031], [1, 0.005]]),
      down: of([[0, 0.024], [0.1, 0.065], [0.25, 0.092], [0.45, 0.092], [0.7, 0.065], [0.88, 0.031], [1, 0.005]]),
      rest: 4.4, proud: 2.6,
      span: 510, shoulder: [+(0.67 * B).toFixed(1), +(0.09 * B).toFixed(1), +(0.11 * B).toFixed(1)], arm: 0.62 * C, lead: 0.1 * C, sweep: 0.2 * C, root: 0.82 * C, tipChord: 0.55 * C,
    },
    // long and square (the agent's: its tip neither notched nor rounded)
    tail: { length: 140.8, root: 0, rootHalf: 8, feathers: 12, width: 23, closed: 0.05, graded: 2, point: 0.2, droop: 0.02, tent: 7 },
    leg: { knee: [+(0.36 * B).toFixed(1), +(-0.12 * B).toFixed(1), +(0.1 * B).toFixed(1)], shin: 52, tarsus: 49.9, thick: [13, 3.8, 2.8],
      toes: { mid: 30.7, side: 24, hind: 15, claw: 10, hindClaw: 12 }, splay: 0.4, talons: { claw: 3.2, curve: 2.2 } },
  },
  poses: {
    perched: { pitch: 1.0, lift: 0.84, lean: 0.006, droop: 0.04, head: { pitch: -0.05 }, tail: { pitch: -0.18, fan: 0.03 }, feet: { mode: 'grip', round: 0.012 }, perch: 0.012 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, bars: [TAWNY, 4, 0.18], size: 5.5 },                                            // breast, belly, flanks white, barred ochraceous-tawny
      { where: (p) => p.a >= 0.56, colour: PLUMBEOUS, edge: DEEP, fringe: 0.04, size: 6.5 },           // upperparts blackish plumbeous
      { where: (p) => p.a >= 0.56 && p.x < 0.25 * B, colour: DEEP, size: 6 },                         // shading to deep plumbeous on the rump and upper tail coverts
      { where: (p) => p.x < 0.12 * B && p.a < 0.42, colour: WHITE, size: 5.5 },                       // under tail coverts pure white
      { where: (p) => p.x > 0.66 * B && p.a < 0.4, colour: WHITE, shaft: LINE, shaftWidth: 0.1, size: 3.8 },       // chin and throat white, with fine blackish shaft lines
      { where: (p) => p.x > 0.7 * B && p.a >= 0.4 && p.a < 0.66, colour: CHEEK, shaft: LINE, shaftWidth: 0.09, size: 3.5 },   // cheeks and ear coverts ochraceous-tawny, fine shaft lines
      { where: (p) => head(p) && p.a >= 0.7, colour: PLUMBEOUS, size: 4 },                              // crown and occiput blackish plumbeous: the back's own colour, so the cap does not stand out
    ],
    wing: {
      web: [214, 10, 25], edge: DEEP, tertial: PLUMBEOUS, covert: PLUMBEOUS, lesser: PLUMBEOUS, lesserEdge: DEEP,
      medianTip: null, greaterTip: null, tertialTip: null, patchSkip: 0,
      primaryBars: [[0.14, 0.2, DARK, 'both'], [0.36, 0.42, DARK, 'both'], [0.58, 0.64, DARK, 'both'], [0.8, 0.86, DARK, 'both']],
      secondaryBars: [[0.2, 0.27, DARK, 'both'], [0.46, 0.53, DARK, 'both'], [0.72, 0.79, DARK, 'both']],
      under: PALE, underCovert: WHITE, underCovertTip: null, underBars: [[0.14, 0.22, [214, 12, 36], 'both'], [0.38, 0.46, [214, 12, 36], 'both'], [0.62, 0.7, [214, 12, 36], 'both'], [0.84, 0.9, [214, 12, 36], 'both']],
      fold: { primaries: 6, secondaries: 7, secondaryEnd: 0.8, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.26 },
      spread: { primaries: 10, secondaries: 11, shape: [0.64, 0.82, 0.92, 0.99, 1, 0.97, 0.92, 0.88, 0.86] },
    },
    tail: { web: GRAY, edge: [212, 8, 56], under: [212, 6, 78], point: 0.2, bars: [[216, 14, 22], 4, 0.1], tip: [[6, WHITE, 0.04]] },     // neutral gray, four bands of grayish fuscous, narrowly tipped white
    bill: { upper: [220, 10, 14], lower: [215, 10, 24], cere: [58, 62, 58] },                                       // bill blackish; cere yellow or greenish yellow
    claw: [30, 6, 6],                                                                                               // claws jet black
    mouth: [355, 30, 45], eye: { iris: [4, 82, 40], pupil: [240, 15, 5] },                                         // iris red
    leg: [52, 80, 55],                                                                                              // feet yellow
    shin: [24, 45, 70],
  },
};
