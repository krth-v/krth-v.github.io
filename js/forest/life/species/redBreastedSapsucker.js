// Red-breasted Sapsucker, Sphyrapicus ruber (the northern form, ruber): an adult. The sexes look alike.
//
// What is published and what is not. The lengths under `published` are Ridgway's for ten adult males of the northern
// red-breasted sapsucker, Sphyrapicus ruber notkensis (Birds of North and Middle America, Part VI, Bulletin 50, 1914,
// pp. 284-285), and the bird is built to their means; life/measure.js measures the built bird against them. The
// colours follow his description of ruber (p. 282) and the differences he gives for notkensis. How it was read: as
// the Internet Archive's OCR text of the scan (item cu31924022528081), by one reader and no checker; no page was seen
// as an image, so a slip of the scan would go unseen (the figures are clean and fall inside their own ranges).
// The skins measured are "ten specimens" per his footnote (the males; the footnote is shared with the females').
// The wingspan and mass are from All About Birds (via a search summary): 37 to 40.6 cm, 53 to 63.5 g. The outline,
// the stance, the tail's shape, the size of the white patches, where the red ends on the breast and the iris and
// leg colours' exact tones are the agent's drawing. Its feet: two toes forward and two back, as the Pileated
// Woodpecker's (shape.leg.yaw); the toe built to "outer anterior toe" is the one that points straight ahead.
//
// Looked at again on 2026-11-16 (the agent called woodpeckers), against the same text (the genus, pp. 272-273; ruber,
// p. 282; notkensis, p. 284): (1) the back is black with a double row of small whitish spots down its middle,
// converging behind ("usually smaller (sometimes obsolete)" in notkensis), where every feather of it had been edged
// pale, which read as scales; (2) the white patch of the wing is the middle coverts and the outer webs of the greater
// coverts, and the lesser coverts at the shoulder are black, where they had been white; (3) the primaries have white
// spots on their outer webs, not one long band; (4) the breast is washed with red below the red of the chest, and
// the sides and flanks are paler with dusky marks; (5) the outer hind toe is very slightly longer than the outer front
// toe, and the tarsus longer than the outer hind toe with its claw ("claws only moderately large"), where it had been
// shorter. The red head and chest stand as they were.

export const published = {
  shown: 'adult male, northern form (notkensis)',
  note: 'Published (Ridgway): the lengths above, and the colours: head, neck and chest bright red (nearest poppy red), the feathers dusky beneath; nasal tufts and the front and lower lores dull yellowish white, the lores next to the eye black; the red of the malar region blackish at its front end; the rest of the underparts very pale straw yellow or yellowish white, the breast washed with red, the sides, flanks and under tail-coverts less yellow, with V-shaped dusky marks; the upper parts black with a double row of white spots down the back (usually smaller in notkensis, sometimes none), a long white patch on the wing coverts, white spots on the outer webs of the primaries and at the tips of the inner secondaries, the upper tail-coverts partly white, and white spots on the inner web of the middle tail feathers; bill brownish black; iris brown; legs and feet grayish. In notkensis the red is darker and brighter than in ruber. Which form breeds on the Olympic Peninsula was not read: notkensis is the form of western Washington (Ridgway). Not read, and the agent\'s: the outline, the stance, the wingspan\'s shape, the size of the patches, how far down the breast the red goes, the exact tones. Whether the toe was measured with its claw is not said; it is built without. Of the genus: the outer hind toe very slightly longer than the outer front toe, the tarsus longer than the outer hind toe with its claw, the claws only moderately large. Not painted: the white spots on the inner web of the middle tail feathers (the painter lays a tail\'s bars on every feather alike).',
  sources: {
    R: 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Sphyrapicus ruber notkensis pp. 284-285, S. r. ruber p. 282 for the plumage, and the genus pp. 272-273 for the feet (https://archive.org/stream/cu31924022528081/cu31924022528081_djvu.txt): ten adult males, museum skins, OCR text',
    A: 'Cornell Lab, All About Birds, Red-breasted Sapsucker (via a search summary, read 2026-11-16): 20 to 22 cm long, wingspan 37 to 40.6 cm, 53 to 63.5 g',
  },
  lengths: [
    ['wing', 'Wing, folded', 128.6, [123.5, 133.5], 'R'],
    ['tail', 'Tail', 78.9, [72, 81.5], 'R'],
    ['culmen', 'Exposed culmen', 25.3, [24, 27], 'R'],
    ['tarsus', 'Tarsus', 21.1, [20, 22], 'R'],
    ['midToe', 'Outer anterior toe (the claw is not said to be counted)', 15.7, [15, 16.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 203, [187, 217], 'R'],
    ['span', 'Wingspan (All About Birds)', null, [370, 406], 'A'],
  ],
  proportions: [
    'The tail 61 % of the wing (78.9 to 128.6: worked out from Ridgway\'s means), stiff and wedge-shaped, braced on the bark',
    'Bill straight and chisel-tipped, about as long as the head',
    'Two toes forward and two back; the outer hind toe very slightly longer than the outer front toe, the tarsus longer than the outer hind toe with its claw; claws only moderately large (Ridgway, of the genus)',
  ],
  mass: 'Mass 53 to 63.5 g (A)',
};

// colours as paint: [hue, saturation, lightness]; every one darker than its name reads
const RED = [356, 80, 22], RED2 = [358, 72, 17], BLACK = [30, 6, 9], BELLY = [50, 36, 46], SPOT = [48, 12, 70], RUMP = [48, 10, 66], WHITE = [48, 12, 84], FLANK = [48, 16, 54], DUSKY = [40, 8, 30], MALAR = [356, 40, 12];

const size = (p) => (p.x > 81 ? 3 : p.x > 68 ? 4.5 : 7);
// the double row of small whitish spots down the middle of the back, converging behind (R; small in notkensis, and here
// only every other stretch of each row has one): a band either side of the midline, nearer it towards the rump
const spots = (p) => { if (p.x < 10 || p.x > 62) return false; const mid = 0.95 - (p.x - 10) * 0.0011; return Math.abs(p.a - mid) < 0.026 && Math.sin(p.x * 0.95) > 0.1; };

export default {
  key: 'red-breasted-sapsucker', name: 'Red-breasted Sapsucker', latin: 'Sphyrapicus ruber', seed: 239,
  census: { tier: 'few', source: 'B F; P U', extra: true },
  // How it lives on a visit (life/families/trunk.js, which says what each number is). From what was read: it "drills
  // tiny holes in tree bark, usually in neatly spaced rows, and then returns to them periodically to feed on the sap",
  // and on "insects that are attracted to the sap"; "besides drilling sap wells, also gleans insects from tree trunks
  // in more typical woodpecker fashion" and "sallies out to catch insects in the air"; its voice "a soft, slurred
  // whee-ur or mew" (Audubon, read 2026-11-16); "neat horizontal rows of holes", "forage in healthy trees", fairly
  // common in May on the coast (BirdWeb); its drum like "Morse code" (BirdNote, 2020), and the sapsuckers' drum "a
  // stuttered opening, and then steady tapping that slows in cadence and wanders away" (Pfeiffer, Northern Woodlands,
  // 2017, of the Yellow-bellied, its eastern kin). The agent's own: every distance, time, chance and height below;
  // which trees it drills (alders and maples most, then hemlocks and spruces); how a row is laid (wells 18 mm apart,
  // rows 3 cm apart, on the side of the trunk towards the walk); that it has wells from earlier days on its tree when
  // it is first about; the drum's knocks one by one.
  way: {
    family: 'trunk', there: 0.75, gap: [45, 200],
    hz: 9, speed: 8, range: 30, low: 1, high: 6, start: [0.1, 0.5], quota: [3, 6], stay: [40, 120], bound: 0.2,
    suits: (t) => ({ alder: 3, maple: 3, mature: 2, slope: 2, spruce: 2, cedar: 1, giant: 1, snag: 0.2 }[t.kind] || 0),
    homeOff: 20, apart: 150, short: true,
    flush: 6, startle: 11, near: 0.7, gone: 0.3,
    step: [0.04, 0.07], beat: 0.12, run: [1, 4], backs: 0.08,
    bear: (r) => (r() < 0.85 ? (r() - 0.5) * 0.5 : (r() < 0.5 ? 1 : -1) * (1.1 + r() * 0.5)),
    moving: (bearing) => (Math.abs(Math.sin(bearing)) > 0.7 ? 'hitching round the trunk' : 'hitching up the trunk'),
    probing: 'looking over the bark', resting: 'clinging to the trunk, braced on its tail',
    work: { chance: 0.15, time: [2, 6], rate: 3.6, doing: 'pecking at the bark for ants', reach: 40 },
    wells: { chance: 0.65, back: 0.6, low: [1.3, 2.4], row: [4, 7], apart: 0.018, over: 0.03, rows: 7, trees: 2,
      drill: [5, 12], open: [2, 5], sip: [4, 12], rate: 8, reach: 0.11, heard: 12, doing: 'lapping the sap at its wells' },
    sally: { chance: 0.12, reach: [1.5, 4] },
    call: { every: [40, 160], time: 0.9, rate: 1.2, reach: 70, doing: 'calling: a soft, slurred mew' },
    // a stuttered opening of a few quick knocks, a catch, and then single knocks and pairs that slow and wander off
    drum: { time: 2.5, reach: 200, doing: 'drumming: a few quick knocks, then slower, like Morse code', every: [150, 420], bout: [1, 3], pause: [8, 20], seek: true,
      knocks: (r) => {
        const times = [];
        let t = 0;
        for (let i = 3 + Math.floor(r() * 4); i > 0; i -= 1) { times.push(t); t += 0.045 + r() * 0.012; }
        t += 0.12 + r() * 0.1;
        let gap = 0.075 + r() * 0.02;
        for (let i = 6 + Math.floor(r() * 6); i > 0; i -= 1) {
          times.push(t);
          if (r() < 0.3) { t += 0.045 + r() * 0.01; times.push(t); }
          t += gap; gap *= 1.18 + r() * 0.12;
        }
        return times;
      } },
  },
  voices: {
    call: { silent: true },   // no recording under a licence that could be used: the public-domain ones found are of another sapsucker, or a field recording of unclear content
    // (made in the page: each knock of its drum, said one by one in the drum's own rhythm)
    drum: { synth: 'knock', level: 0.45, near: 10, pitch: 1000 },
    knock: { synth: 'knock', level: 0.25, near: 5, pitch: 1250 },
    tap: { synth: 'knock', level: 0.1, near: 3, pitch: 1700 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 21 cm long, wings 37 to 40 cm across, about 55 g: a woodpecker a little smaller than a Hairy.',
    marks: ['A red head and upper breast', 'A black back with small whitish spots down its middle, and a white rump', 'A long white patch on the folded wing', 'A pale yellow belly'],
    lives: 'Forest with living trees, alders and conifers. It drills neat rows of small wells in the bark of a live trunk and comes back to them, laps the sap and takes the insects that come to it, and darts out after insects in the air. Its drum is a few quick knocks and then slower ones, like Morse code.',
  },
  plate: { wide: 0.52, bar: 0.03 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 99
    top:    [[-20.7, 1.5], [-9, 6], [4.5, 11], [20.7, 15], [36.9, 17], [51.3, 17], [63, 15.5], [72, 14], [77.4, 13.5], [81.9, 15], [86.4, 17], [90.9, 17.5], [94.5, 16], [97.2, 13], [98.5, 10], [99, 8]],
    bottom: [[-25.2, -1], [-12.6, -5.5], [0, -11], [13.5, -18], [28.8, -23], [42.3, -24], [54, -21.5], [63.9, -16.5], [72, -11], [77.4, -7.5], [82.8, -5.5], [88.2, -4.5], [92.7, -3], [96.3, -1.5], [99, 0]],
    half:   [[-25.2, 3.5], [-12.6, 7.5], [0, 12.5], [13.5, 17], [28.8, 19.5], [42.3, 20], [54, 18.5], [63.9, 15], [72, 11.5], [77.4, 10], [82.8, 10.5], [88.2, 10.5], [92.7, 9.5], [96.3, 7], [98.1, 5], [99, 4]],
    widest: 0.46,
    neck: [68, 81],
    eye: { x: 90, y: 9.5, r: 2.3 },
    bill: { culmen: 25.3, drop: 0, gape: 5 },
    wing: {
      chord: 128.6, wrist: [69, -3], aim: [-127, 8],
      up:   [[0, 4], [0.12, 15], [0.3, 18], [0.5, 15.5], [0.75, 8.5], [0.9, 3.5], [1, 0.8]],
      down: [[0, 2.5], [0.12, 7.5], [0.3, 11], [0.5, 11.5], [0.75, 8.5], [0.9, 4.5], [1, 0.8]],
      rest: 3, proud: 1.8,
      span: 388, shoulder: [67, 9, 12], arm: 54, lead: 11, sweep: 25, root: 81, tipChord: 38,
    },
    tail: { length: 78.9, root: 1, rootHalf: 4, feathers: 12, width: 15, closed: 0.045, graded: 15, point: 0.4, droop: 0.03, tent: 8 },
    // (the outer hind toe, `side`, 16 against the outer front toe's 15.7, and 20.95 with its claw against the tarsus's 21.1)
    leg: { knee: [41, -15, 10], shin: 20, tarsus: 21.1, thick: [7, 3.3, 1.8], toes: { mid: 15.7, side: 16, hind: 9, claw: 5.5, hindClaw: 5 }, splay: 0.3, yaw: { O: 2.2, I: -0.3 } },
  },
  poses: {
    perched: { pitch: 0.2, lift: 0.36, lean: 0.004, droop: 0.05, head: { pitch: 0.1 }, tail: { prop: 0.002, fan: 0.04 }, feet: { mode: 'flat', width: 0.017, ahead: 0.007, toeOut: 0.5 }, board: true },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.2 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                           // the rest of the under parts very pale straw yellow (R)
      { where: (p) => ((p.a > 0.2 && p.a < 0.5 && p.x > 0) || (p.a < 0.5 && p.x <= 0)) && p.x < 45, colour: FLANK, shaft: DUSKY, shaftWidth: 0.34, size: 7 },   // the sides, flanks and under tail coverts less yellow, with dusky marks (R)
      { where: (p) => p.a >= 0.5, colour: BLACK, size: 9 },                                              // upper parts black (R)
      { where: spots, colour: BLACK, bars: [SPOT, 1, 0.2], size: 6 },                                    // broken by a double row of small whitish spots down the back (R)
      { where: (p) => p.a >= 0.5 && p.x < 7, colour: RUMP, size: 6 },                                    // the upper tail coverts largely white (R)
      { where: (p) => p.a < 0.5 && p.x > 41 && p.x <= 52, colour: BELLY, edge: RED, fringe: 0.4, size: 6 },   // the breast washed with red (R)
      { where: (p) => p.a < 0.5 && p.x > 52, colour: RED, edge: RED2, fringe: 0.15, size: 5 },          // the chest red (R)
      { where: (p) => p.x > 68, colour: RED, size },                                                     // head and neck red (R)
      { where: (p) => p.x > 93 && p.y > -1.5 && p.y <= 2.5, colour: MALAR, size: 2.5 },                  // the red of the malar region blackish at its front end (R)
      { where: (p) => p.x > 94 && p.y > 4.5 && p.y < 9, colour: [52, 20, 64], size: 2.5 },               // nasal tufts and front lores dull yellowish white (R)
      { where: (p) => p.x > 88 && p.x <= 94 && p.y > 4.5 && p.y < 9, colour: BLACK, size: 2.5 },         // the lores next to the eye black (R)
    ],
    wing: {
      // a long white patch on the wing coverts: most of the middle coverts, and the outer webs of the greater; the
      // lesser coverts at the shoulder black (R)
      web: BLACK, edge: [30, 6, 13], tertial: BLACK, covert: BLACK, lesser: BLACK, lesserEdge: [30, 6, 14],
      medianTip: [WHITE, 0.85], greaterTip: [WHITE, 0.2], greaterBars: [[0.12, 0.95, WHITE, 'outer']], patchSkip: 0,
      // white spots on the outer webs of the primaries (R); how many and how large, the agent's
      primaryBars: [[0.3, 0.36, WHITE, 'outer'], [0.45, 0.51, WHITE, 'outer'], [0.6, 0.66, WHITE, 'outer'], [0.75, 0.8, WHITE, 'outer']],
      secondaryBars: [], tertialTip: [WHITE, 0.12],                                              // white at the tips of the proximal secondaries (R)
      under: [30, 6, 18], underCovert: [50, 28, 70], underCovertTip: null,
      underBars: [[0.04, 0.5, [50, 24, 66], 'both']],
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.75, greater: 8, greaterEnd: 0.4, median: 7, medianEnd: 0.23 },
      spread: { primaries: 9, secondaries: 7, shape: [0.7, 0.9, 0.98, 1, 1, 1, 0.99, 0.97, 0.95] },
    },
    tail: { web: [30, 6, 8], edge: [30, 6, 12], under: [30, 5, 16], point: 0.3 },
    bill: { upper: [28, 12, 12], lower: [28, 12, 16] },
    mouth: [350, 30, 40],
    eye: { iris: [25, 45, 18], pupil: [240, 15, 4] },
    leg: [210, 5, 24],
    shin: [210, 6, 14],
  },
};
