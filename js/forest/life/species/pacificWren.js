// Pacific Wren, Troglodytes pacificus (the Western Winter Wren of older books). The sexes are alike; the
// male is a little the larger.
//
// What is published and what is not. The lengths under `published` are from the Cornell Lab's Birds of the
// World, whose tables were read by two agents, the second checking the first (2026-11-16): males of British
// Columbia, the same form as the Olympic Peninsula's. Ridgway's account (1904) could not be opened. The
// colours follow the same account's description, tract by tract. The outline is the agent's drawing, as for
// every species. Every source was read through a tool that fetches a page and returns its text or a summary
// of it; none was seen as an image.

export const published = {
  shown: 'adult (sexes alike); measurements are of males',
  note: 'Published: the lengths above, and the plumage tract by tract (rufescent brown above, barred dusky; rump brighter; tail light chestnut, narrowly barred; flight feathers barred, the outer primaries dusky and buff; a narrow brownish-buff stripe over the eye; throat paler; sides and flanks barred; under tail coverts barred black; bill brown with a paler base below; legs brown to pinkish brown). Not found, and the agent\'s: the middle toe, how far the wing tip reaches down the tail, whether the tail is rounded, the crown apart from the back, how many bars a feather has. Drawn by the agent: the outline of head and body, the place of the eye, how the folded wing lies.',
  sources: {
    B: 'Cornell Lab of Ornithology, Birds of the World, Pacific Wren, "Appearance": wing, tail and tarsus of 34 males of British Columbia; bill of 50 males of the central coast of British Columbia; mass of 240 breeding adults of western Washington',
    A: 'National Audubon Society, Guide to North American Birds, Pacific Wren: length 9 to 11 cm, wingspan 15 to 18 cm',
    W: 'Seattle Audubon BirdWeb, Pacific Wren; Wikipedia, "Pacific wren"',
  },
  lengths: [
    ['wing', 'Wing, folded (chord)', 46.4, [43.5, 49], 'B'],
    ['tail', 'Tail', 30.2, [27.5, 33.5], 'B'],
    ['culmen', 'Bill (how it was taken is not said)', 10.6, [9.7, 11.9], 'B'],
    ['tarsus', 'Tarsus', 18.1, [16.7, 19.4], 'B'],
    ['length', 'Length, bill tip to tail tip', null, [90, 110], 'A'],
    ['span', 'Wingspan', null, [150, 180], 'A'],
  ],
  proportions: [
    'Tail very short, about two thirds of the wing, and often held upright (B, W)',
    'Bill thin and delicate, the upper mandible slightly decurved; 2.6 mm deep and as wide (B: where on the bill is not said; built 3.2 mm deep and 3.0 wide where it meets the head)',
    'Feet large for the bird and legs sturdy (B); wings small and rounded (W)',
    'The bill of 10.6 mm is probably not the exposed culmen: the same table has 8.3 mm from the nostril to the tip. Built here as the culmen from the feathers',
    'Not found: the middle toe. Built at 10.5 mm, from the tarsus and the creeper\'s proportion',
  ],
  mass: 'Mass 9.1 g (B: western Washington, both sexes); males 8.1-11.6 g (B: south-western British Columbia)',
};

// colours as paint: [hue, saturation, lightness]
const BROWN = [23, 46, 25], RUMP = [21, 55, 30], DUSKY = [24, 30, 12], CROWN = [24, 40, 22];
const BUFF = [28, 46, 39], THROAT = [31, 44, 47], FLANK = [27, 42, 36], PALE = [38, 30, 70];
const BROW = [33, 42, 54], FACE = [31, 38, 44], STREAK = [25, 34, 22];
const size = (p) => (p.x > 40 ? 2.2 : 4);
// the narrow stripe over the eye, and the brownish one behind it
const brow = (p) => p.x > 40.5 && p.x < 53 && Math.abs(p.y - (8.3 + (49 - p.x) * 0.06)) < 0.6;
const behind = (p) => p.x > 40 && p.x < 47.6 && Math.abs(p.y - (6.1 + (49 - p.x) * 0.04)) < 0.95;
const face = (p) => p.x > 41 && p.x < 54 && p.y > 2 && p.y < 7.6;

export default {
  name: 'Pacific Wren', latin: 'Troglodytes pacificus', key: 'pacific-wren', seed: 53,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'every', source: 'B C; P regular', mean: 6 },
  way: {
    // (it does not leave: it is in its ferns or out of them, all the visit long. Where its home is, and what it does
    // there: its family's, life/families/skulker.js)
    // (every number here is the agent's own, but the song's length, which is that of the recording played for it)
    family: 'skulker', there: 1, gap: [20, 60],
    hz: 24, speed: 5.5,                              // wingbeats a second; low and whirring, from fern to fern (m/s)
    // put up from 2.6 m at a stroll (life/behave.js `pace`), or by a sudden movement within 6 m; always into a fern
    // further off if there is one, and never gone for good: it keeps a territory
    flush: 2.6, startle: 6, near: 1, gone: 0,
    stay: [8, 38], work: [8, 22],                    // seconds in the ferns before it comes out; along a log
    song: { time: [7.1, 7.5], reach: 90 },           // (as long as the recording that is played for it)
    scold: { reach: 30 },
  },
  voices: {
    // (what was downloaded is the 240-line copy of the source video: the 2,032,751 bytes below. The video itself is 79,259,851)
    song: { file: 'wren-song.mp3', level: 0.55, near: 6,
      credit: { what: 'Pacific Wren, song', by: 'Don Henise, Oregon, 2014 (Wikimedia Commons, from Flickr)', licence: 'CC BY 2.0: cut to one song and filtered',
        licenceUrl: 'https://creativecommons.org/licenses/by/2.0/', source: 'https://commons.wikimedia.org/wiki/File:Song_of_Pacific_wren_(Troglodytes_pacificus).webm', bytes: 2032751, kept: 7.35 } },
    // (silent: no recording of it was found under a licence that could be used)
    scold: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 10 cm long and 9 g: one of the smallest birds of the forest, and one of the loudest.',
    marks: ['Dark reddish brown all over, finely barred on the wings, the flanks and the tail', 'A very short tail, often held cocked up', 'A thin bill, and a faint buff stripe over the eye', 'It bobs its whole body when something alarms it'],
    lives: 'Low in the dampest, darkest wood: among sword ferns, root hollows, stumps and fallen logs, where it hops in and out of cover and is almost always moving. The male sings a long, fast run of trills from a stump or a log.',
  },
  plate: { wide: 0.36, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 56
    top:    [[-9, 2], [-3, 5.5], [6, 9.6], [16, 12.7], [26, 13.7], [34, 13.3], [40, 12.7], [44.5, 13], [49, 12.6], [52.5, 10.6], [54.8, 7.6], [56, 4.3]],
    bottom: [[-11, -1], [-4, -5.5], [5, -10.6], [15, -14], [25, -14.6], [34, -12.6], [41, -9.2], [47, -5.4], [52, -1.8], [56, 1.1]],
    half:   [[-11, 2.4], [-4, 6.6], [5, 10.8], [15, 13.3], [25, 13.6], [34, 12], [41, 9.9], [46, 9.3], [50, 8], [53.5, 5], [56, 1.5]],
    widest: 0.46,
    neck: [38, 47],
    eye: { x: 49, y: 6.2, r: 1.5 },
    bill: { culmen: 10.6, drop: 0.1, gape: 1.6 },
    wing: {
      chord: 46.4, wrist: [36, -2], aim: [-44, 5],
      // short and rounded: broad to near its tip
      up:   [[0, 1.6], [0.12, 6.4], [0.3, 7.8], [0.5, 7], [0.72, 4.8], [0.9, 2.4], [1, 0.7]],
      down: [[0, 1.3], [0.12, 4], [0.3, 5.6], [0.5, 5.8], [0.72, 4.6], [0.9, 2.6], [1, 0.7]],
      rest: 1.8, proud: 1,
      span: 165, shoulder: [35, 6.5, 9.5], arm: 24, lead: 5, sweep: 10, root: 42, tipChord: 19,
    },
    tail: { length: 30.2, root: 0.9, rootHalf: 2.4, feathers: 12, width: 5.6, closed: 0.035, graded: 3.5, point: 0.6, droop: 0.03, tent: 4 },
    leg: { knee: [24, -8.6, 6], shin: 13, tarsus: 18.1, thick: [3, 1.3, 0.75], toes: { mid: 10.5, side: 7.8, hind: 7.4, claw: 4, hindClaw: 5.5 }, splay: 0.55 },
  },
  poses: {
    // on a twig, as the contact sheet shows it: plump and upright, the tail cocked
    perched: { pitch: 0.42, lift: 0.5, head: { pitch: 0.12 }, tail: { pitch: 1.5, fan: 0.03 }, feet: { mode: 'grip', round: 0.008 }, perch: 0.008 },
    // on the top of a stump or the back of a log, singing: the same, on flat feet
    singing: { pitch: 0.46, lift: 0.5, head: { pitch: 0.3 }, tail: { pitch: 1.45, fan: 0.05 }, feet: { mode: 'flat' } },
    // over the floor: low and level, the tail still up
    creeping: { pitch: 0.14, lift: 0.4, head: { pitch: 0.08 }, tail: { pitch: 1.25, fan: 0.03 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.2 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BUFF, size },                                                                   // underparts mostly buff-brown (B)
      { where: (p) => p.a < 0.6 && p.x < 33, colour: FLANK, bars: [DUSKY, 3, 0.1], shaft: PALE, shaftWidth: 0.12, size: 4.4 },      // mottled and barred dusky and whitish, most distinctly on the sides and flanks (B)
      { where: (p) => p.a < 0.42 && p.x >= 33 && p.x < 52, colour: THROAT, size: 2.6 },         // chin and throat paler buff-brown (B)
      { where: (p) => p.x <= 3 && p.a < 0.5, colour: RUMP, bars: [[24, 30, 8], 3, 0.11], size: 5 },             // under tail coverts rufescent brown, barred black (B); their white marks are left out
      { where: (p) => p.a >= 0.6, colour: BROWN, bars: [DUSKY, 3, 0.09], size },                // upperparts rufescent brown, barred dusky (B)
      { where: (p) => p.a >= 0.6 && p.x < 11, colour: RUMP, bars: [DUSKY, 3, 0.09], size: 4.4 },                // rump and upper tail coverts brighter, more rufescent (B)
      { where: (p) => p.x > 41 && p.y > 9.2, colour: CROWN, size: 2.1 },                        // the crown: not described apart from the upperparts (B); plain here
      { where: face, colour: FACE, shaft: STREAK, shaftWidth: 0.3, size: 2 },                   // under the eye and the ear coverts brownish buff, narrowly streaked brown (B)
      { where: behind, colour: STREAK, size: 2 },                                               // a narrow brownish stripe behind the eye (B)
      { where: brow, colour: BROW, size: 2 },                                                   // a narrow brownish-buff stripe over it (B)
    ],
    wing: {
      web: [24, 28, 16], edge: [23, 46, 29], tertial: [24, 36, 21], covert: [24, 40, 23], lesser: BROWN, lesserEdge: [24, 44, 31],
      medianTip: [[36, 32, 50], 0.06],                                                          // median coverts often with a small whitish spot at the tip (B)
      greaterTip: null,
      patchSkip: 0,
      // flight feathers barred dusky; the outer primaries' dusky bars alternate with buff or white (B)
      primaryBars: [[0.2, 0.26, [36, 44, 62], 'outer'], [0.34, 0.4, [36, 44, 62], 'outer'], [0.48, 0.54, [34, 44, 58], 'outer'], [0.62, 0.68, [32, 44, 52], 'outer'], [0.76, 0.82, [30, 44, 46], 'outer']],
      secondaryBars: [[0.24, 0.3, [23, 50, 34], 'outer'], [0.4, 0.46, [23, 50, 34], 'outer'], [0.56, 0.62, [23, 50, 34], 'outer'], [0.72, 0.78, [23, 50, 34], 'outer'], [0.87, 0.92, [23, 50, 34], 'outer']],
      tertialTip: null,
      under: [28, 12, 48], underCovert: [30, 14, 56], underCovertTip: null, underBars: [],      // under wing pale greyish brown, faintly barred (B)
      fold: { primaries: 6, secondaries: 6, secondaryEnd: 0.8, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.62, 0.84, 0.95, 1, 1, 1, 1, 0.98, 0.95] },
    },
    tail: { web: [22, 48, 30], edge: [22, 50, 35], under: [24, 30, 35], tip: [], point: 0.5, bars: [[24, 30, 13], 6, 0.03] },      // light chestnut brown, narrowly barred dusky (B)
    bill: { upper: [26, 24, 19], lower: [28, 26, 24], lowerBase: [[34, 52, 62], 0.55] },        // brown, the base of the lower mandible pinkish to yellow (B)
    mouth: [50, 80, 60],
    eye: { iris: [22, 40, 10], pupil: [240, 15, 5] },                                           // iris dark brown (B)
    leg: [20, 34, 48],                                                                          // brown to pinkish brown (B)
    shin: [28, 36, 40],
  },
};
