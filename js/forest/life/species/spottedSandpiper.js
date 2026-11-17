// Spotted Sandpiper, Actitis macularius (Ridgway's Actitis macularia), the adult male in summer. Monotypic.
//
// What is published and what is not. The lengths under `published` are Ridgway's (Birds of North and Middle
// America, Part VIII, 1919, p. 373) for 18 adult males from all of North America, read as the Internet Archive's
// character recognition of the scan (cu31924022528107) by an agent on 2026-11-16 and kept in the repository's
// research notes (`.local-assets/forest/research/birds-wave2-2026-11-16.json`), from which this sheet was built: the
// line read is "Adult male.—Wing, 89-105 (100.5); tail, 45-53 (49); exposed culmen, 21.5-25.5 (23.6); tarsus,
// 19.5-24 (22.2); middle toe, 18-22 (19.4)". They are skin lengths; his five adult males from western North America
// are smaller (wing 96.1, tail 46.6). The females are larger (wing 104). He gives no length and no wingspan: the
// length is a range for live birds (Audubon, Wikipedia: 18 to 20 cm) and the wingspan another (Wikipedia and Animal
// Diversity Web: 37 to 40 cm; Audubon has 33 to 38), so neither has a mean. The colours are his description of adults
// in summer, which does not part the sexes, tract by tract (quoted in `published.note`); the summer bill's orange is
// from Wikipedia and BirdWeb, the male's smaller spots from Animal Diversity Web. Read through the notes' quotations
// and through a tool that returns a page's text: none of it seen as an image, none of it checked by a second reader.
// The agent's own: the outline of head and body, where the eye sits, the dark line through it (from general
// knowledge, not from what was read), how the folded wing lies and how far the tail reaches past its tip, the colours
// as paint, and that a male is shown.

export const published = {
  shown: 'adult male in summer; measurements are of adult males, all of North America',
  note: 'Published (R): above greenish or bronzy greyish brown with a faint gloss, the crown streaked with dusky, the back, scapulars, wing coverts, rump and upper tail coverts marked with blackish, mostly as bars across the feather; a white stripe over the eye, sometimes faint; below white with round spots of black or dusky everywhere but the chin and upper throat; the axillars white; the secondaries white for more than their basal half and broadly tipped white; the primaries dusky, with a white patch on the inner web of all but the outermost; the tail bronzy greyish brown, its outer feathers barred with white and the rest, but the middle pair, tipped white; the iris dark brown; the legs pale greyish olive in life; the maxilla black, the mandible mostly yellow. From later sources: in summer an orange bill with a dark tip (W), a male\'s spots smaller and not so far down the belly as a female\'s (A). Not found, and the agent\'s: the outline of head and body, the dark line through the eye, how the folded wing lies, how far the tail reaches past the wing tips, whether the middle toe has its claw (built without). The outer tail feathers\' white bars are laid as white tips that broaden outwards: the painter lays bars on every tail feather or on none.',
  sources: {
    R: 'Ridgway, Birds of North and Middle America, Part VIII (U.S. National Museum Bulletin 50, 1919), Actitis macularia, pp. 372 and 373, Internet Archive text of volume cu31924022528107: 18 adult males, skins; the plumage of adults in summer',
    W: 'Wikipedia, "Spotted sandpiper": 18 to 20 cm, wingspan 37 to 40 cm, 34 to 50 g; the summer bill; short legs; the teetering walk and the stiff-winged flight low over the water',
    A: 'Animal Diversity Web, Actitis macularius (wingspan 37 to 40 cm; males 34 to 41 g; the female\'s larger spots); Audubon Field Guide, Spotted Sandpiper (18 to 20 cm; "a clear peet-weet"; wing pointed, short, tapered); Seattle Audubon BirdWeb, Spotted Sandpiper (the teetering, the flight, its arrival in Washington)',
  },
  lengths: [
    ['wing', 'Wing, folded (Ridgway does not say how it was measured)', 100.5, [89, 105], 'R'],
    ['tail', 'Tail', 49, [45, 53], 'R'],
    ['culmen', 'Exposed culmen', 23.6, [21.5, 25.5], 'R'],
    ['tarsus', 'Tarsus', 22.2, [19.5, 24], 'R'],
    ['midToe', 'Middle toe (the claw is not said; built without)', 19.4, [18, 22], 'R'],
    ['length', 'Length of live birds, bill tip to tail tip', null, [180, 200], 'A'],
    ['span', 'Wingspan', null, [370, 400], 'W'],
  ],
  proportions: [
    'A slender shorebird about a robin\'s size, with a short neck and a straight bill about a quarter as long as the wing (R, A)',
    'The tail about half the wing (R); it is built to reach well past the folded wing tips, which is the agent\'s',
    'The wing pointed, short and tapered (A); the legs short (W)',
    'It teeters: the rear of the body bobs up and down as it walks (W, A)',
  ],
  mass: 'Mass: 34 to 50 g (W); males 34 to 41 g, females 43 to 50 g (A)',
};

// colours as paint: [hue, saturation, lightness], laid darker than their names read
const UPPER = [40, 17, 27], CROWN = [38, 16, 23], DARK = [30, 16, 11], SPOT = [28, 12, 12], WHITE = [45, 8, 86];
const BROW = [45, 8, 80], LINE = [36, 14, 19], STREAK = [36, 10, 42], MARK = [32, 16, 17];
const size = (p) => (p.x > 96 ? 2.6 : p.x > 84 ? 3.4 : 5);
// a fixed pseudo-random number from where a feather is, so that the spots and bars stand where they do on every load
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
// the round spots below (R), on most feathers of the breast and fewer down the belly: a male's are smaller and stop
// higher than a female's (A)
const spotted = (p) => {
  const heavy = p.x > 58 && p.x < 100 ? 0.74 : p.x > 30 ? 0.5 : p.x > 6 ? 0.2 : 0.08;
  return hash(Math.floor(p.x / 3.4), Math.floor(p.a * 26)) < heavy;
};
// the blackish marks across the feathers of the back, scapulars, rump and upper tail coverts (R): on most of them
const barred = (p) => hash(Math.floor(p.x / 4) + 50, Math.floor(p.a * 24)) < 0.78;
const upper = (p) => p.a > 0.6;
// the line through the eye (the agent's), and the white stripe over it (R): level behind the eye, down to the bill's base in front
const line = (p) => (p.x <= 105.5 ? 13.5 : 13.5 - (p.x - 105.5) * 0.55);

export default {
  name: 'Spotted Sandpiper', latin: 'Actitis macularius', key: 'spotted-sandpiper', seed: 441,
  // ---- who is about on a visit (life/species/index.js says what each field is)
  // (`party`: a lone bird or a pair. What was read has it solitary, seldom in flocks, the female arriving first in
  // May and holding a stretch of shore while she courts a male (BirdWeb): a pair on a bar is the agent's reading)
  census: { tier: 'some', source: 'B F; reaches Washington in the first or second week of May', party: [1, 2] },
  // ---- how it lives on a visit (life/families/shore.js says what each number is; every one is the agent's own)
  way: {
    family: 'shore', gap: [50, 200], there: 0.7, together: true,
    range: 26, apart: 70, need: 5,
    hz: 15, speed: 8, hover: [0.25, 0.7], out: 3.5, beats: [0.5, 1.4], glide: [0.2, 0.5],
    spell: [90, 300], walk: [0.25, 0.5], teeter: 2.2, pause: [0.6, 3], peck: [0.5, 1.8], move: [14, 40], follow: 0.7,
    call: { reach: 110 },
    flush: 11, startle: 20, near: 0.75, gone: 0.2,
  },
  voices: {
    call: { file: 'sandpiper-call.mp3', level: 0.45, near: 8,
      credit: { what: "Spotted Sandpiper, call (the \"peet-weet\")", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-spottedsandpiper.htm', bytes: 933152, kept: 1.2 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 19 cm long, wings about 38 cm across, 35 to 50 g: a little smaller than a robin.',
    marks: ['Olive-brown above, barred with black in spring', 'White below with round black spots in spring', 'A white stripe over the eye; an orange bill with a dark tip', 'It teeters: the rear of its body bobs up and down as it walks'],
    lives: 'The bars and edges of rivers and streams. It walks the water\'s edge, picking insects from the stones and the surface and teetering as it goes, and flies low over the water on stiff, shallow, flickering wingbeats, calling "peet-weet". The first come back to Washington in the first or second week of May: the female arrives first and holds a stretch of shore, and the male sits on the eggs.',
  },
  plate: { wide: 0.55, bar: 0.035 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 117
    top:    [[-24, 2], [-10, 6.5], [6, 12], [24, 17], [44, 20], [62, 20.5], [78, 19], [88, 17], [96, 18.5], [103, 20.5], [109, 19.5], [113, 16], [115.5, 11.5], [117, 7]],
    bottom: [[-28, -1], [-14, -6], [0, -12], [16, -20], [34, -26], [50, -27], [66, -25], [80, -19.5], [90, -13], [99, -7.5], [106, -3.5], [112, -0.5], [117, 2.5]],
    half:   [[-28, 3.5], [-14, 8], [0, 13], [16, 18], [34, 20.5], [50, 21], [66, 19], [80, 14], [88, 11.5], [96, 11.5], [104, 10.5], [110, 7.5], [114.5, 4.2], [117, 2.6]],
    widest: 0.46,
    neck: [84, 96],
    eye: { x: 105.5, y: 13.5, r: 2.7 },
    bill: { culmen: 23.6, drop: 0.03, gape: 3.2 },
    wing: {
      chord: 100.5, wrist: [76, -1], aim: [-100, 6],
      // long and pointed (A); the folded tips fall well short of the tail's (the agent's)
      up:   [[0, 3], [0.12, 11], [0.3, 13], [0.5, 10.5], [0.72, 6.5], [0.9, 2.6], [1, 0.6]],
      down: [[0, 2.4], [0.12, 6.5], [0.3, 8.8], [0.5, 8.4], [0.72, 5.6], [0.9, 2.6], [1, 0.6]],
      rest: 3, proud: 1.6,
      span: 385, shoulder: [74, 11, 15], arm: 50, lead: 10, sweep: 28, root: 70, tipChord: 20,
    },
    tail: { length: 49, root: 1.4, rootHalf: 4, feathers: 12, width: 12.5, closed: 0.035, graded: 1.3, point: 0.6, droop: 0.03, tent: 7 },
    leg: { knee: [52, -16, 9], shin: 18, tarsus: 22.2, thick: [4.4, 1.9, 1.2], toes: { mid: 19.4, side: 15.5, hind: 6.5, claw: 3, hindClaw: 2 }, splay: 0.55 },
  },
  poses: {
    // on a rock or a log by the water
    perched: { pitch: 0.1, lift: 0.72, head: { pitch: 0.02 }, tail: { pitch: 0.04, fan: 0.02 }, feet: { mode: 'grip', round: 0.03 }, perch: 0.03 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.2 }, feet: { mode: 'tuck' } },
    // on the shore: the body near level, the neck drawn in, the feet flat; it teeters from this (life/families/shore.js)
    ground: { pitch: 0.06, lift: 0.72, head: { pitch: -0.05 }, tail: { pitch: 0.02, fan: 0.02 }, feet: { mode: 'flat' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                   // under parts white (R)
      { where: (p) => p.a < 0.6 && p.x < 101 && spotted(p), colour: SPOT, edge: WHITE, fringe: 0.18, size: 4.4 },   // round spots of black or dusky (R)
      { where: upper, colour: UPPER, size },                                                     // above greenish or bronzy greyish brown (R)
      { where: (p) => upper(p) && p.x < 84 && barred(p), colour: UPPER, bars: [DARK, 2, 0.14], size: 5 },           // marked with blackish, mostly across the feather (R)
      { where: (p) => p.x > 84 && p.a >= 0.52, colour: UPPER, size: 3 },                        // the hind neck and the side of the neck
      { where: (p) => p.x > 92 && p.y > line(p) + 5.8, colour: CROWN, shaft: DARK, shaftWidth: 0.3, size: 2.4 },   // the crown streaked with dusky (R)
      { where: (p) => p.x > 97 && p.x < 116 && p.y > line(p) + 2.6 && p.y <= line(p) + 5.8 && p.a > 0.3, colour: BROW, size: 1.8 },   // a white stripe over the eye (R)
      { where: (p) => p.x > 96 && p.x < 117 && Math.abs(p.y - line(p)) <= 2.6 && p.a > 0.3, colour: LINE, size: 1.8 },             // the dark line through the eye (the agent's)
      { where: (p) => p.x > 97 && p.y < line(p) - 2.6 && p.y > 2 && p.a > 0.3, colour: WHITE, shaft: STREAK, shaftWidth: 0.14, size: 2 },   // the cheek: white, finely streaked (the agent's)
      { where: (p) => p.x > 101 && p.a < 0.42, colour: WHITE, size: 2.2 },                     // the chin and upper throat unspotted (R)
    ],
    wing: {
      web: [38, 14, 21], edge: [40, 15, 28], tertial: [40, 17, 26], covert: [40, 17, 27], lesser: [40, 17, 27], lesserEdge: [40, 15, 31],
      // the wing coverts marked with blackish (R): a fainter bar or two across each, so that the folded wing is not striped
      medianTip: null, greaterTip: null, greaterBars: [[0.6, 0.66, MARK, 'both']],
      tertialTip: null, tertialBars: [[0.44, 0.49, MARK, 'both'], [0.78, 0.82, MARK, 'both']],
      // the white of the spread wing (R): the inner webs of the primaries but the outermost, and the secondaries' bases and tips
      patchSkip: 1, primaryBars: [[0.22, 0.55, WHITE, 'inner']], secondaryBars: [[0, 0.42, WHITE, 'both'], [0.95, 1, WHITE, 'both']],
      under: [40, 8, 50], underCovert: [45, 6, 82], underCovertTip: null, underBars: [[0.2, 0.5, [45, 8, 78], 'both']],   // the axillars white (R)
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 7, greaterEnd: 0.5, median: 6, medianEnd: 0.26 },
      spread: { primaries: 9, secondaries: 7, shape: [0.97, 1, 0.95, 0.88, 0.8, 0.72, 0.65, 0.6, 0.56] },
    },
    // bronzy greyish brown, the outer feathers barred white and the rest but the middle pair tipped white (R)
    tail: { web: [40, 16, 26], edge: [40, 14, 31], under: [40, 8, 46], middle: [40, 18, 23], point: 0.55,
      tip: [[1, WHITE, 0.1], [2, WHITE, 0.14], [3, WHITE, 0.2], [4, WHITE, 0.32], [5, WHITE, 0.5]] },
    bill: { upper: [30, 18, 14], lower: [30, 18, 16], lowerBase: [[32, 72, 50], 0.62] },       // the maxilla black, the mandible yellow (R), orange with a dark tip (W)
    mouth: [8, 40, 50],
    eye: { iris: [25, 40, 10], pupil: [240, 15, 5] },                                          // iris dark brown (R)
    leg: [55, 26, 54],                                                                         // pale greyish olive (R), yellowish (W)
    shin: [55, 18, 45],
  },
};
