// Varied Thrush, Ixoreus naevius: the adult male in spring. The sexes differ: the female is duller and
// browner above, with a faint chest band (Ridgway).
//
// What is published and what is not. The lengths under `published` were read from the sources named, and
// the bird is built to their means; life/measure.js measures the built bird against them. The colours and
// where each lies follow Ridgway's description of the adult male, tract by tract. The outline (how deep and
// wide the body and head are, where the eye sits, how the folded wing lies) is in no table: it is the
// agent's drawing, and the owner, who knows the bird, judges it from the contact sheet.
//
// How the sources were read: through a tool that fetches a page and returns its text, or the scan's
// character recognition, or a summary of it. No page was seen as an image, and Ridgway's page numbers are
// the ones that tool gave. Where a comment below says "not seen", the wording is from general knowledge
// of the bird and was not found in what was read.

const R = 'Ridgway 1907, The Birds of North and Middle America, Part IV (U.S. National Museum Bulletin 50), genus Ixoreus, pp. 129-134';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colour of each feather tract as Ridgway describes the adult male. Not seen in what was read, and the agent\'s: how wide the grey margins of the flank feathers are, a crown a shade darker than the back, pale tips to the tertials, how large each white tail spot is, the legs\' colour in life. Drawn by the agent: the outline of head and body, the place of the eye, how the folded wing lies.',
  sources: {
    R: `${R}: 20 adult males, museum skins, coast and interior together (he found no ground to separate the coastal race)`,
    W: 'Wikipedia, "Varied thrush" (2026-11-14): figures the article does not tie to a source one by one',
    N: 'National Geographic, Varied Thrush',
    I: 'Interpretive Center, "The Varied Thrush": wingspan 13.4-15 in',
    A: 'Audubon Field Guide, Varied Thrush',
    B: 'BWD Magazine, Varied Thrush',
  },
  // key, what it is, mean, range, source. A mean in brackets is the middle of a range, where no mean is published.
  lengths: [
    ['wing', 'Wing, folded', 126.7, [119, 132.5], 'R'],
    ['tail', 'Tail', 87.4, [78.5, 93.5], 'R'],
    ['culmen', 'Exposed culmen', 20.7, [18, 23], 'R'],
    ['tarsus', 'Tarsus', 31.4, [29.5, 32.5], 'R'],
    ['midToe', 'Middle toe', 22.1, [21, 23], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 226, [214, 241], 'R'],
    ['span', 'Wingspan (one secondary source)', null, [340, 380], 'I'],
  ],
  // proportions Ridgway gives for the genus, which the wing and tail are laid out to
  proportions: [
    'Tail even, and slightly longer than from the bend of the wing to the end of the secondaries',
    'Longest primaries exceed the longest secondaries by the tarsus and about half the middle toe (about 42 mm)',
    'Middle toe without claw two-thirds of the tarsus; hind toe slightly shorter than the side toes',
    'Bill much shorter than the head, slender, compressed',
    'How Ridgway took "wing" and "middle toe" is not said on the pages read. Built here: the wing from its bend to the tip of the longest primary, the toe without its claw',
  ],
  mass: 'Mass 65-100 g (W)',
};

// Ridgway's colours for the adult male, as paint: [hue, saturation, lightness]
const SLATE = [214, 19, 35], CROWN = [216, 20, 30], BLACK = [222, 22, 11], TAWNY = [27, 82, 50], STRIPE = [31, 86, 56];
const FLANK = [29, 64, 57], MARGIN = [205, 9, 43], WHITE = [48, 24, 91], COVERT_GREY = [214, 10, 46], DUSKY = [222, 13, 17];
const BUFF = [30, 72, 57], PALE_BUFF = [32, 74, 58];

// where the slate of the upperparts ends down the side of the body and neck
const upper = (p) => p.a > (p.x < 78 ? 0.6 : 0.6 + 0.07 * Math.min(1, (p.x - 78) / 19));
// the chest band: across the breast, and up the side of the neck to the slate
const band = (p) => { const centre = 84 + (p.y + 30) * 0.32, half = 5.6 - Math.max(0, p.y + 10) * 0.09; return Math.abs(p.x - centre) < half && p.y < 6.5; };
// lores, the region under the eye and the ear coverts
const face = (p) => (p.x > 112 && p.y > 2.5 && p.y < 13.6) || (p.x <= 113 && ((p.x - 106.5) / 11.5) ** 2 + ((p.y - 7) / 7.2) ** 2 < 1);
// the stripe over the ear coverts, from the middle of the upper eyelid to the nape
const stripe = (p) => p.x < 113.4 && p.x > 95 && Math.abs(p.y - (15.7 + (112.5 - p.x) * 0.1)) < 1.5 + (112.5 - p.x) * 0.08;
// feathers are small on the head and grow down the neck
const size = (p) => (p.x > 99 ? 4.2 : p.x > 90 ? 6 : 9);

export default {
  name: 'Varied Thrush', latin: 'Ixoreus naevius', key: 'varied-thrush', seed: 31,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'most', source: 'B C; P regular', mean: 2 },
  way: {
    family: 'ground', there: 0.62, gap: [45, 200],
    // a stretch of the trail under trees: it feeds on the tread and the floor beside it
    home: (habitat, r) => { for (let i = 0; i < 80; i += 1) { const s = r() * habitat.length; if (habitat.wooded(s, 8)) return { s, side: (r() - 0.5) * 1.2 }; } return null; },
    // within twenty metres of there, either way along the trail
    spot: (home, r, habitat) => { for (let i = 0; i < 12; i += 1) { const s = home.s + (r() - 0.5) * 40; if (habitat.wooded(s, 6)) return { s, side: home.side + (r() - 0.5) * 1.0 }; } return { s: home.s, side: home.side }; },
    // How it lives (life/families/ground.js), in the numbers of its life as approved at checkpoint 2: in hops of 6 to
    // 11 cm, turning the litter over, up to the stub of a broken limb, where at dawn and dusk it sings a whistle of
    // one to two seconds with a silence of three to twenty, for eight to twelve minutes a perch. The walker puts it
    // up from 5.5 m (further at a run), as it did from the ground. All of them the agent's own.
    hz: 11, speed: 9,
    flush: 5.5, startle: 12, near: 0.5, gone: 0.25,
    gait: 'hop', stride: [0.06, 0.11], quick: 0.15, pause: [0.5, 2.7],
    feeding: 'litter', work: 0.45,
    moving: 'hopping over the forest floor', standing: 'standing alert',
    stray: 2.2, roam: 4.5,
    feed: [25, 55], sit: [40, 90], off: 0.45, lost: 0.4,
    perch: { stubs: true, reach: 45 },
    song: { share: 1, note: [1, 2], gap: [3, 20], stay: [480, 720], rate: 0, reach: 150, doing: 'singing: one long, buzzing whistle at a time' },
  },
  voices: {
    // Made in the page, and not a recording. Its song is one long note with a buzz in it, each song on another
    // pitch: here it is two pure tones a little apart, which beat. No recording of it was found under a licence
    // that could be used, and the wood at dawn is not itself without it; it is the agent's imitation, and the
    // owner may well want it silent (take its line out).
    song: { synth: 'whistle', level: 0.4, near: 14 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 23 cm long, wings 34 to 38 cm across: about the size of a robin.',
    marks: ['An orange stripe from over the eye back to the nape, above a black face', 'A black band across an orange breast', 'Two orange bars on a dark wing', 'Slate above; this is a male, and a female is browner with a fainter band'],
    lives: 'The shaded floor of wet conifer forest. It feeds on the ground, hopping and turning the litter over, and sings from high in the trees, mostly at dawn and dusk and after rain.',
  },
  plate: { wide: 0.8, bar: 0.05 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 122.5
    top:    [[-30, 2.5], [-12, 8], [8, 14.5], [30, 20.5], [52, 23.5], [72, 24.5], [88, 23], [96, 22.3], [103, 24.6], [109, 27], [114.5, 26.2], [119, 21.8], [121.6, 15], [122.5, 8.9]],
    bottom: [[-38, -1.5], [-18, -8], [0, -15.5], [18, -26.5], [38, -34.5], [56, -37.5], [72, -35.5], [86, -29.5], [95, -21.5], [104, -12.5], [111, -6.5], [117, -2.6], [122.5, 1.4]],
    half:   [[-38, 5], [-20, 10], [0, 17.5], [20, 25], [40, 29.5], [58, 30.5], [76, 28.5], [90, 21.5], [98, 16.5], [106, 15.2], [112, 14.8], [117, 11.5], [121, 6.5], [122.5, 4.0]],
    widest: 0.46,
    neck: [90, 104],
    eye: { x: 112.5, y: 11.5, r: 3.5 },
    bill: { culmen: 20.7, drop: 0.05, gape: 3 },
    wing: {
      chord: 126.7, wrist: [82, -3], aim: [-122, 7],
      // the folded wing's upper and lower edge, in mm either side of the line from wrist to tip. The secondaries end
      // 0.665 of the way along it: 42 mm short of the tip, as Ridgway has it.
      up:   [[0, 4], [0.12, 18], [0.3, 21], [0.5, 17], [0.665, 9.5], [0.85, 3.5], [1, 0.8]],
      down: [[0, 3], [0.12, 9], [0.3, 13], [0.5, 13], [0.665, 10], [0.85, 5.5], [1, 0.8]],
      rest: 4, proud: 2.2,
      span: 360, shoulder: [80, 13, 20], arm: 50, lead: 12, sweep: 40, root: 88, tipChord: 26,
    },
    tail: { length: 87.4, root: 1.5, rootHalf: 4, feathers: 12, width: 15.5, closed: 0.037, graded: 2.5, point: 0.72, droop: 0.03, tent: 12 },
    leg: { knee: [50, -21, 10.5], shin: 27, tarsus: 31.4, thick: [6.5, 2.6, 1.45], toes: { mid: 22.1, side: 15.5, hind: 13.5, claw: 6.5, hindClaw: 8 }, splay: 0.5 },
  },
  // Poses the contact sheet shows, and the forest's behaviours start from (life/rig.js says what each number is).
  poses: {
    perched: { pitch: 0.52, lift: 0.6, head: { pitch: 0.06 }, tail: { pitch: -0.04 }, feet: { mode: 'grip', round: 0.014 }, perch: 0.014 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: TAWNY, size },                                                                  // chin, throat and breast tawny-ochraceous
      { where: (p) => p.a > 0.2 && p.a < 0.62 && p.x < 74 && p.x > 2, colour: FLANK, edge: MARGIN, fringe: 0.16, size: 9.5 },     // sides and flanks paler, each feather margined with grey (the margins' wording: not seen)
      { where: (p) => p.a < 0.24 && p.x < 60 && p.x > -6, colour: WHITE, size: 9 },             // abdomen more or less extensively white
      { where: (p) => p.x <= 2 && p.a < 0.5, colour: COVERT_GREY, edge: [40, 46, 87], fringe: 0.5, size: 12 },                    // under tail coverts grey at base, white at tip (the tawny tinge: not seen)
      { where: upper, colour: SLATE, size },                                                    // above plain slate
      { where: band, colour: BLACK, size },                                                     // a black band across the chest
      { where: (p) => p.x > 96 && p.y > 13, colour: SLATE, size },
      { where: (p) => p.x > 97 && p.y > 17.5, colour: CROWN, size },                            // the crown a shade darker than the back: the agent's, not seen
      { where: face, colour: BLACK, size: 3.6 },                                                // loral, suborbital and auricular regions black
      { where: stripe, colour: STRIPE, size: 4 },                                               // supra-auricular stripe from the middle of the upper eyelid to the nape
    ],
    wing: {
      web: DUSKY, edge: SLATE, tertial: [220, 14, 21], covert: DUSKY, lesser: SLATE, lesserEdge: [214, 16, 42],
      medianTip: [TAWNY, 0.3],                 // middle coverts with a large terminal spot
      greaterTip: [TAWNY, 0.22],                 // greater coverts broadly tipped with the same
      patchSkip: 2,                             // primaries, except the outer two or three,
      primaryBars: [[0.3, 0.46, BUFF, 'outer']],          // ochraceous-buff on the basal part of the outer web, where it shows beyond the coverts
      secondaryBars: [[0.5, 0.9, PALE_BUFF, 'edge']],     // secondaries edged towards the tip with a paler tint
      tertialTip: [[30, 16, 40], 0.02],         // tertials narrowly tipped paler: not seen
      // Under the wing Ridgway has the coverts white at base and broadly slate-grey at tip, and a broad white or
      // pale buffy band across the base of the flight feathers. National Geographic (N) calls the linings orange
      // and black and the stripe orange. Drawn after Ridgway, the band buff; the owner will know which is nearer.
      under: [218, 12, 23], underCovert: [40, 12, 90], underCovertTip: [[214, 12, 40], 0.45],
      underBars: [[0.5, 0.67, [36, 58, 76], 'both']],
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.665, greater: 8, greaterEnd: 0.4, median: 7, medianEnd: 0.23 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.8, 0.95, 1, 1, 1, 1, 1, 1] },
    },
    // the two or three outermost feathers with a white spot at the tip of the inner web (R); how large each is, is the agent's
    tail: { web: [220, 13, 20], edge: [214, 17, 29], under: [218, 10, 25], tip: [[5, WHITE, 0.13], [4, WHITE, 0.085], [3, WHITE, 0.045]], point: 0.2 },
    bill: { upper: [28, 18, 13], lower: [28, 18, 15], lowerBase: [[38, 50, 52], 0.5] },       // brownish black, the base of the mandible pale
    mouth: [45, 70, 58],
    eye: { iris: [22, 42, 11], pupil: [240, 15, 5] },                                         // iris brown
    leg: [30, 46, 52],                                                                        // pale yellowish brown in skins (R); in life the sources read differ, and none was confirmed
    shin: [28, 34, 48],
  },
};
