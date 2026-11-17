// Cooper's Hawk, Accipiter (Astur) cooperii: the adult male, in the plumage it wears in May.
//
// What is published and what is not. Its wing and tail are of breeding adult males of southern Vancouver Island,
// British Columbia (Rosenfield et al. 2010, as Birds of the World quotes them), the nearest sample to the Olympic
// Peninsula; its culmen (from the cere) and tarsus are Friedmann's (1950) for adult males across the range, as Birds of
// the World relays them, since Friedmann's own text could not be opened; its middle toe is of 44 live breeding males
// of southern Vancouver Island (Rosenfield et al. 2020, read from the table); the hind claw is the mean of 45 young
// males of California (Pitzer et al. 2008, Journal of Field Ornithology 79, Table 2, read from the paper's text). The
// colours are Birds of the World's, Wikipedia's and Bent's words for the adult male, not Ridgway's or Friedmann's. Not
// found, and the agent's: the length and the span it is built at (only ranges were found, the span's for both sexes),
// the front claws, the cere and the hook, the outline of head and body, how the folded wing lies and its colours
// beyond "solid blue-gray", the bars of the flight feathers.
//
// How the sources were read: through the research of 2026-11-16 (.local-assets/forest/research/birds-wave2-2026-11-16.json:
// Birds of the World's and Wikipedia's pages through tools that return a page's text or a summary of it, Rosenfield
// 2020's table from its image); Pitzer et al. 2008 by this agent, from the paper's text. No page was seen as an image
// by this agent.

const B = 195;                   // mm from where the tail is rooted to the bill's base (the outline below is in shares of it)
const C = 227;                   // the folded wing
const at = (pts, k = 1) => pts.map(([x, y]) => [+(x * B).toFixed(1), +(y * B * k).toFixed(1)]);
const of = (pts) => pts.map(([t, y]) => [t, +(y * C).toFixed(1)]);

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above; the colours in words (a cap darker than the back, almost blackish, over a paler nape; the face, cheeks and foreneck reddish, the cheeks streaked; the back, scapulars and wing coverts solid blue-gray; the underparts whitish, heavily barred rufous to cinnamon, the thighs too; the under tail coverts pure white; the tail blue-gray with three blackish bands and a conspicuous white tip, rounded; the flight feathers pale gray below, barred; the bill gray at the base and blackish at the tip; the cere dull yellow to greenish yellow; the iris orange to red, red or dark orange in old males; the legs yellow; the talons black). Not found, and the agent\'s: the length and span it is built at (730 mm across), the front claws (14 mm), the cere (6.2 mm) and the hook (5.8 mm), the outline, how the folded wing lies and the bars of the flight feathers above.',
  sources: {
    R: 'Rosenfield, Sonsthagen, Stout and Talbot 2010, as quoted in Birds of the World, Cooper\'s Hawk, Appearance: breeding adult males, southern Vancouver Island, British Columbia',
    F: 'Friedmann 1950, Birds of North and Middle America, Part XI (U.S. National Museum Bulletin 50), as cited in Birds of the World: adult males, range-wide',
    T: 'Rosenfield, Stout, Sonsthagen and Ross 2020, Do British Columbia Cooper\'s Hawks have big feet?, British Columbia Birds 30, Table 1: 44 live breeding adult males, southern Vancouver Island',
    P: 'Pitzer, Hull, Ernest, Bradley and Boyce 2008, Journal of Field Ornithology 79(1), Table 2: 45 juvenile males, Marin Headlands, California',
    W: 'Wikipedia, "Cooper\'s hawk", Size and Description: males 35 to 46 cm long; a wingspan of 62 to 99 cm for both sexes',
  },
  lengths: [
    ['wing', 'Wing, folded', 227, [217, 236], 'R'],
    ['tail', 'Tail', 182.9, [172, 191], 'R'],
    ['culmen', 'Culmen from the cere', 16.2, [15, 17.5], 'F'],
    ['tarsus', 'Tarsus', 64.1, [61.5, 73], 'F'],
    ['midToe', 'Middle toe without its talon', 37, [33.8, 39.4], 'T'],
    ['length', 'Length, bill tip to tail tip (a secondary source)', null, [350, 460], 'W'],
    ['span', 'Wingspan (both sexes; a secondary source)', null, [620, 990], 'W'],
  ],
  proportions: [
    'Wings short and rounded, the sixth primary the longest, then the seventh, fifth, eighth, ninth, fourth (Birds of the World); perched, the wing tips cover less than a third of the tail (Wikipedia)',
    'Tail long and rounded, the longest and the wings the shortest of the three accipiters (Wikipedia; Bent)',
    'Bill short but robust, hooked (Wikipedia); a cere at its base',
    'Legs long but moderately thick (Birds of the World); the hind claw 19.4 mm (P, young males)',
    'Eyes set well forward on a relatively large, squarish head (Wikipedia)',
  ],
  mass: 'Breeding males of southern Vancouver Island 272 to 321 g, 296 g on average (T)',
};

// the colours of the words above, as paint: [hue, saturation, lightness]
const SLATE = [212, 17, 41], EDGED = [212, 15, 47], CAP = [218, 16, 16], NAPE = [212, 12, 50], WHITE = [36, 22, 93];
const RUFOUS = [15, 60, 46], CHEEK = [16, 50, 50], STREAK = [14, 52, 36], DARK = [216, 16, 18], PALE = [210, 8, 74];
const eye = { x: +(0.928 * B).toFixed(1), y: +(0.078 * B).toFixed(1), r: 5.6 };
const head = (p) => p.x > 0.79 * B;

export default {
  name: 'Cooper\'s Hawk', latin: 'Accipiter cooperii', key: 'coopers-hawk', seed: 412,
  // ---- who is about on a visit (life/species/index.js says what each is)
  census: { tier: 'rare', source: 'B U; P U' },
  // ---- how it lives on a visit (life/families/raptor.js, a hawk's manner). Every number is the agent's own.
  way: {
    family: 'raptor', manner: 'hawk',
    // (rare and seen rarely: in its part of the wood from the first on a quarter of the visits it is about on, gone a
    // long while between, and off for good half the times it goes)
    there: 0.25, gap: [150, 420], fastest: 22,
    hz: 5.5, speed: 11, pulse: [4, 0.7], stay: [10, 40],
    flush: 16, startle: 30, near: 0.5, gone: 0.5,
    call: { every: [150, 420], time: 2.5, rate: 7, reach: 200, doing: 'calling: a loud, hard cak-cak-cak' },
    wood: { off: 26, low: 3, high: 8, thick: 0.02, dash: 15, fly: 2.5, range: [18, 55], alarm: 18, hunt: 0.65 },
  },
  voices: {
    call: { silent: true },   // only CC BY-SA recordings were found
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    // (the length is Wikipedia's range for males, as under `published`; the length it is built at is the agent's)
    size: '35 to 46 cm long, a male: the size of a crow, the female larger.',
    marks: ['A dark cap over a paler nape', 'A blue-gray back; the breast barred rufous', 'A long, rounded tail with dark bands and a white tip', 'Red eyes'],
    lives: 'A hawk of the woods and their edges, hard to see when it nests. It perches inside the canopy, still, and from there dashes low through the trees after a jay, a robin or a squirrel, beating and gliding. In May a pair is at a nest of sticks high in a tree.',
  },
  plate: { wide: 1.6, bar: 0.2 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base (where the feathers end) at B
    top:    at([[-0.16, 0.012], [-0.095, 0.042], [0, 0.082], [0.12, 0.12], [0.26, 0.145], [0.41, 0.155], [0.54, 0.15], [0.64, 0.136], [0.71, 0.123], [0.765, 0.12], [0.815, 0.128], [0.865, 0.134], [0.91, 0.129], [0.948, 0.112], [0.978, 0.091], [1, 0.068]]),
    bottom: at([[-0.19, -0.008], [-0.12, -0.04], [-0.025, -0.092], [0.11, -0.155], [0.27, -0.192], [0.42, -0.19], [0.53, -0.166], [0.62, -0.124], [0.685, -0.09], [0.75, -0.064], [0.815, -0.046], [0.88, -0.03], [0.938, -0.016], [0.978, -0.006], [1, 0.004]]),
    half:   at([[-0.19, 0.019], [-0.12, 0.053], [-0.025, 0.1], [0.11, 0.15], [0.27, 0.176], [0.42, 0.172], [0.53, 0.152], [0.62, 0.122], [0.685, 0.104], [0.75, 0.099], [0.815, 0.104], [0.88, 0.099], [0.938, 0.078], [0.978, 0.052], [1, 0.026]]),
    widest: 0.45,
    neck: [+(0.68 * B).toFixed(1), +(0.775 * B).toFixed(1)],
    eye,
    // the hook and the cere: life/parts/raptor.js
    bill: { culmen: 16.2, drop: 0, gape: 16, hook: { drop: 5.8, from: 0.45 }, cere: { long: 6.2 } },
    wing: {
      chord: C, wrist: [+(0.79 * B).toFixed(1), +(0.02 * B).toFixed(1)], aim: [-0.993 * C, -0.12 * C].map((v) => +v.toFixed(1)),
      up: of([[0, 0.041], [0.1, 0.105], [0.25, 0.15], [0.45, 0.136], [0.7, 0.078], [0.88, 0.031], [1, 0.005]]),
      down: of([[0, 0.024], [0.1, 0.065], [0.25, 0.092], [0.45, 0.092], [0.7, 0.065], [0.88, 0.031], [1, 0.005]]),
      rest: 5.8, proud: 3.5,
      span: 730, shoulder: [+(0.66 * B).toFixed(1), +(0.09 * B).toFixed(1), +(0.11 * B).toFixed(1)], arm: 0.64 * C, lead: 0.1 * C, sweep: 0.2 * C, root: 0.82 * C, tipChord: 0.55 * C,
    },
    // long and rounded: the outer feathers shorter by a little over a tenth of its length (the agent's; Friedmann's 18 to 26 mm is the goshawk's)
    tail: { length: 182.9, root: 0, rootHalf: 12, feathers: 12, width: 30, closed: 0.05, graded: 24, point: 0.5, droop: 0.02, tent: 10 },
    leg: { knee: [+(0.36 * B).toFixed(1), +(-0.12 * B).toFixed(1), +(0.1 * B).toFixed(1)], shin: 72, tarsus: 64.1, thick: [22, 6.5, 4.2],
      toes: { mid: 37, side: 30, hind: 20, claw: 14, hindClaw: 19.4 }, splay: 0.4, talons: { claw: 4.6, curve: 2.1 } },
  },
  poses: {
    perched: { pitch: 1.0, lift: 0.84, lean: 0.008, droop: 0.04, head: { pitch: -0.05 }, tail: { pitch: -0.18, fan: 0.03 }, feet: { mode: 'grip', round: 0.015 }, perch: 0.015 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0, tail: { fan: 0.35 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, bars: [RUFOUS, 4, 0.2], size: 9 },                                             // underparts whitish, heavily barred rufous to cinnamon
      { where: (p) => p.a >= 0.55, colour: SLATE, edge: EDGED, fringe: 0.04, size: 11 },               // back and scapulars solid blue-gray
      { where: (p) => p.x < 0.12 * B && p.a < 0.42, colour: WHITE, size: 9 },                           // under tail coverts pure white
      { where: (p) => p.x > 0.66 * B && p.a < 0.42, colour: WHITE, shaft: STREAK, shaftWidth: 0.14, size: 6 },      // throat whitish, the barring narrowed to shaft streaks
      { where: (p) => p.x > 0.7 * B && p.a >= 0.42 && p.a < 0.62, colour: CHEEK, shaft: STREAK, shaftWidth: 0.12, size: 5 },   // cheeks and foreneck reddish, streaked rufous
      { where: (p) => p.x > 0.68 * B && p.a >= 0.62, colour: NAPE, size: 7 },                           // nape and hindneck paler than the cap
      { where: (p) => head(p) && (p.a >= 0.72 || (p.a >= 0.55 && p.y > eye.y + eye.r * 0.4)), colour: CAP, size: 5.5 },   // a dark cap, almost blackish, down to the eye
    ],
    wing: {
      web: SLATE, edge: EDGED, tertial: SLATE, covert: SLATE, lesser: SLATE, lesserEdge: EDGED,
      medianTip: null, greaterTip: null, tertialTip: null, patchSkip: 0,
      primaryBars: [[0.14, 0.2, DARK, 'both'], [0.36, 0.42, DARK, 'both'], [0.58, 0.64, DARK, 'both'], [0.8, 0.86, DARK, 'both']],
      secondaryBars: [[0.2, 0.27, DARK, 'both'], [0.46, 0.53, DARK, 'both'], [0.72, 0.79, DARK, 'both']],
      under: PALE, underCovert: WHITE, underCovertTip: null, underBars: [[0.14, 0.2, [212, 12, 40], 'both'], [0.36, 0.42, [212, 12, 40], 'both'], [0.58, 0.64, [212, 12, 40], 'both'], [0.8, 0.86, [212, 12, 40], 'both']],
      fold: { primaries: 6, secondaries: 7, secondaryEnd: 0.8, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.26, feather: 1.3 },
      spread: { primaries: 10, secondaries: 11, shape: [0.62, 0.8, 0.91, 0.98, 1, 0.97, 0.92, 0.88, 0.86] },   // the sixth the longest, then the seventh, fifth, eighth, ninth (BOW)
    },
    tail: { web: [212, 12, 46], edge: [212, 10, 52], under: [212, 8, 76], point: 0.5, bars: [DARK, 3, 0.1], tip: [[6, WHITE, 0.07]] },     // blue-gray, three blackish bands, a white tip
    bill: { upper: [215, 12, 22], lower: [212, 10, 40], lowerBase: [[210, 12, 52], 0.6], cere: [62, 50, 56] },                            // gray at the base, blackish at the tip; cere greenish yellow
    claw: [30, 8, 8],                                                                                   // talons black
    mouth: [355, 30, 45], eye: { iris: [10, 85, 42], pupil: [240, 15, 5] },                           // iris red to dark orange in old males
    leg: [50, 78, 54],                                                                                  // legs yellow
    shin: [16, 45, 62],                                                                                 // the thighs barred rufous
  },
};
