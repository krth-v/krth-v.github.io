// Vaux's Swift, Chaetura vauxi: the adult (the sexes are alike, Ridgway). The form of the Pacific coast, the
// nominate vauxi of his account.
//
// What is published and what is not. The lengths under `published` are Ridgway's for ten adult males (1911,
// pp. 722-723), read by this agent in the archive.org full-text character recognition of the scan: "Adult
// male. Length (skins), 101-117 (110); wing, 107-115 (112.8); tail, 34-37.5 (36.2); exposed culmen, 5-5.5
// (5.3); tarsus, 10-11.5 (10.9); middle toe, 7-8 (7.6)" with the footnote "Ten specimens". The bird is built to
// their means; life/measure.js measures the built bird against them. The colours follow his description tract
// by tract. Not found in what was read, and so the agent's drawing: the outline of head and body (a short, thick
// cigar), how far the wings project past the tail, the shapes of the wing and tail when spread, the stance, and
// the length of the spines at the tail's tips (2.5 mm). The wingspan is from search-result summaries of All About
// Birds and others (28 cm, one gives 26 to 30), not from a page opened. The spread wing was drawn again on
// 2026-11-16 by a second agent (aerial2), who found the first drawing a songbird's broad wing: it is now long,
// narrow and swept, a short arm and a long hand, ten primaries (a swift's number, from general knowledge, not from
// what was read) with their tips on one smooth trailing edge, and its flight pose is a glide on bowed, swept wings.
// Those numbers are that agent's drawing too.
//
// Built for a bird that never perches as a songbird does: a swift's four toes all point forward and it clings,
// so its feet are drawn as the builder draws every bird's (three toes forward and one back), and are small
// enough (7.6 mm) to be nearly lost against the body. The hind toe is therefore wrong, and is not shown in any
// pose that matters at a distance.

const R = 'Ridgway 1911, The Birds of North and Middle America, Part V (U.S. National Museum Bulletin 50), Chaetura vauxii, pp. 722-723';

export const published = {
  shown: 'adult (the sexes alike)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (pileum, hindneck, back and scapulars plain dark sooty olive, very faintly glossed with bronzy olive, the forehead\'s feathers with paler margins; rump and upper tail coverts rather light grayish brown; tail darker grayish brown with the shafts of the feathers black and rigid; wings sooty blackish, grayish brown on the inner secondaries; loral region black behind and dark grayish brown in front; auricular region, sides of neck and underparts light grayish brown, passing into grayish white on the chest, throat, chin and malar region and into deeper grayish brown on the under tail coverts; bill black, iris brown, feet brownish or dusky). Not found, and the agent\'s: the outline, how far the wings pass the tail, the spines\' length, the stance, and that the feet are drawn as a perching bird\'s.',
  sources: {
    R: `${R}: ten adult males (the female is 105-119 long, wing 107-117, tail 36-39.5)`,
    A: 'All About Birds and other pages, seen only as search-result summaries (2026-11-16): wingspan about 28 cm (one source 26 to 30), body about 11 cm, 15 to 22 g, flight rapid, fluttering and stiff-winged, the wings flapped from the wrist; no wingbeat rate was found',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 112.8, [107, 115], 'R'],
    ['tail', 'Tail', 36.2, [34, 37.5], 'R'],
    ['culmen', 'Exposed culmen', 5.3, [5, 5.5], 'R'],
    ['tarsus', 'Tarsus', 10.9, [10, 11.5], 'R'],
    ['midToe', 'Middle toe', 7.6, [7, 8], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 110, [101, 117], 'R'],
    ['span', 'Wingspan', 280, [260, 300], 'A'],
  ],
  proportions: [
    'The wing three times the tail (112.8 to 36.2: Ridgway\'s means), so a folded wing passes the tail by a third of its own length',
    'The bill and the feet tiny: 5.3 mm exposed culmen, a tarsus of 10.9 mm',
    'The tail short and square, each feather ending in a bare spine (the agent\'s 2.5 mm; the sheet\'s `spine`)',
  ],
  mass: 'About 15 to 22 g (A, a summary)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const BACK = [62, 12, 16], CROWN = [60, 12, 18], RUMP = [32, 12, 36], BELLY = [34, 12, 41], CHEST = [36, 10, 56], THROAT = [38, 9, 66], UNDERTAIL = [32, 12, 29];
const WING = [40, 6, 11], INNER = [34, 10, 23], TAIL = [30, 8, 17], LORE = [30, 8, 8];

const size = (p) => (p.x > 56 ? 2.8 : 4.4);

export default {
  name: 'Vaux\'s Swift', latin: 'Chaetura vauxi', key: 'vauxs-swift', seed: 331,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'some', source: 'B F; P U', party: [2, 6], extra: true },
  // ---- how it lives on a visit (life/families/aerial.js, which says what was read: it "forage[s] in fast flight, often
  // low over the water", "flies high over northwestern forests or low over lakes and rivers with stiff, rapid
  // wingbeats", "often feeds low over water, especially in morning and evening" (BirdWeb, Audubon), in "a mixture of
  // stiff wing-beats and unsteady glides", and roosts in hollow trees, going in between sunset and dark and out at
  // sunrise (Wikipedia; summaries for the circling before it goes in)). A party sweeps the valley's open air, high by
  // day; low over the water in the morning and towards evening; at dusk it gathers high over the old redcedar and goes
  // down, one by one, into its broken top, and comes out again in the morning. It never perches. Every number is the
  // agent's own, from no source: 10 wingbeats a second, 8 to 12 m/s hawking and 19 at the most, 6 to 45 m over the
  // ground by day (a fifth of the time higher, over everything), the sun's heights at which it goes in (0.7 to 2.6 degrees) and comes out (1.2 to 4), the turns and
  // the times. (Its flush and startle are never asked: nothing it does is wary.)
  way: {
    family: 'aerial', together: true, there: 0.6, gap: [60, 300], fastest: 21,
    windows: ['clearing', 'bend', 'reach', 'far'], span: 55, drift: [70, 180],
    heights: { day: [6, 45], dim: [1, 10], dusk: [2, 14], high: 0.2 },
    hz: 10, speed: 10, cruise: [8, 12], burst: 19, climb: 5, sink: 6,
    turn: 2.4, jerk: 12, bank: 1.0, loop: [6, 14],
    modes: { run: 0.45, loop: 0.3, chase: 0.25, swoop: 0.12 },
    bursts: { flap: [0.3, 1.2], glide: [0.5, 2.2] },
    // shallow, stiff, quick strokes, the hand moving with the arm; bowed glides, the wings swept back the faster it goes
    // and rocked from side to side
    wing: { flap: [0.3, -0.02], hand: [0.22, 0], sweep: [0.3, 0.38], glide: { flap: -0.05, hand: -0.16, sweep: [0.3, 0.6] }, rock: 0.12, tail: [0.04, 0.4] },
    spell: [60, 240], moveOn: 0.4,
    roost: { gather: 5.2, enter: [0.7, 2.6], emerge: [1.2, 4.0] },
    flush: 3, startle: 6, near: 1, gone: 0,
    call: { every: [3, 12], time: 0.8, rate: 14, reach: 50 },
  },
  // its "bat-like chipping" (Audubon): no recording was found that could be used
  voices: { call: { silent: true } },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 11 cm long and 15 to 22 g: a small, cigar-shaped bird with long, narrow, curved wings and almost no tail.',
    marks: ['Dark sooty olive above, with a paler rump', 'Pale grey-brown below, almost white at the throat', 'A very short, square tail', 'Long wings that look like a crescent in flight'],
    lives: 'Open air over the river and the clearings, where it feeds only on the wing, catching small flying insects; it flies fast, in fluttering, stiff-winged bursts and glides, often in small groups. It cannot perch on a twig: it clings to the inside of hollow trees and chimneys, and nests and roosts in old hollow snags.',
  },
  plate: { wide: 0.4, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 69.5
    top:    [[-6, 1.5], [0, 5.5], [10, 9.5], [24, 11.5], [40, 11.6], [52, 10.6], [60, 8.6], [66, 6], [68.8, 3.4], [69.5, 2.2]],
    bottom: [[-6, -1.5], [0, -6], [10, -9.5], [24, -11], [40, -11], [52, -9.4], [60, -6.8], [66, -3.8], [68.8, -1.2], [69.5, -0.4]],
    half:   [[-6, 2.5], [0, 7], [10, 10.5], [24, 12], [40, 12], [52, 10.6], [60, 8.6], [66, 6], [68.8, 4], [69.5, 3.6]],
    widest: 0.5,
    neck: [52, 62],
    eye: { x: 64, y: 2, r: 1.7 },
    bill: { culmen: 5.3, drop: 0.03, gape: 6 },
    wing: {
      chord: 112.8, wrist: [52, -2], aim: [-110, 1],
      // long, narrow and curved, the secondaries short and the primaries the whole of it (the agent's)
      up:   [[0, 2.5], [0.08, 8], [0.25, 9.5], [0.5, 7.5], [0.75, 4.2], [0.93, 1.8], [1, 0.6]],
      down: [[0, 2], [0.08, 5], [0.25, 6.5], [0.5, 5], [0.75, 2.8], [0.93, 1.3], [1, 0.6]],
      rest: 4.5, proud: 1.5,
      // Spread: a swift's arm is very short and its hand very long, so that the wing is a narrow crescent swept back
      // from a wrist near the body ("crescentic wings": Wikipedia; "long and narrow": BirdWeb). The first drawing had a
      // 30 mm arm at a 38 mm chord and a hand 103 mm long and nearly straight: a broad, straight songbird's wing. The
      // numbers are the agent's; the span is the same 280 mm whatever the sweep.
      span: 280, shoulder: [52, 9, 12], arm: 18, lead: 6, sweep: 56, root: 32, tipChord: 7,
    },
    // short and square, ten feathers (a swift's), each shaft running on as a spine (`spine`, 2.5 mm: the agent's)
    tail: { length: 36.2, root: 0, rootHalf: 3, feathers: 10, width: 7, closed: 0.03, graded: 1, point: 0.7, droop: 0, tent: 3, spine: 2.5 },
    leg: { knee: [28, -5, 4.5], shin: 3.5, tarsus: 10.9, thick: [2, 1, 0.7], toes: { mid: 7.6, side: 6.5, hind: 5.5, claw: 3.2, hindClaw: 3.2 }, splay: 0.5 },
  },
  poses: {
    // clinging to bark, as the creeper does: +x is up it, +y out of it, the short tail braced against it
    perched: { pitch: 0.05, lift: 0.3, lean: 0.004, droop: 0.1, head: { pitch: 0.2 }, tail: { prop: 0.0008, fan: 0.03 }, feet: { mode: 'flat', width: 0.01, ahead: 0.006, toeOut: 0.5 }, board: true },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    // gliding on stiff, bowed wings swept back into a crescent (the contact sheet's flight views; life/families/aerial.js flies it)
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: -0.04, hand: -0.12, sweep: 0.3, tail: { fan: 0.05 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                  // underparts light grayish brown (R)
      { where: (p) => p.a > 0.55, colour: BACK, size },                                         // back and scapulars plain dark sooty olive (R)
      { where: (p) => p.a > 0.55 && p.x < 12, colour: RUMP, size },                             // rump and upper tail coverts rather light grayish brown (R)
      { where: (p) => p.a <= 0.55 && p.x < 2, colour: UNDERTAIL, size },                        // under tail coverts deeper grayish brown (R)
      { where: (p) => p.a <= 0.5 && p.x >= 40 && p.x < 56, colour: CHEST, size },               // passing into grayish white on the chest (R)
      { where: (p) => p.x >= 56 && p.a <= 0.5, colour: THROAT, size: 2.6 },                     // throat, chin and malar region grayish white (R)
      { where: (p) => p.x >= 52 && p.a > 0.5 && p.a <= 0.7, colour: BELLY, size: 2.6 },         // auricular region and the side of the neck light grayish brown (R)
      { where: (p) => p.x >= 52 && p.a > 0.7, colour: CROWN, edge: [42, 8, 33], fringe: 0.2, size: 2.6 },   // the pileum's feathers with paler margins, the forehead's narrowly whitish (R)
      { where: (p) => p.x > 62 && p.y > -1 && p.y < 5 && p.a > 0.4, colour: LORE, size: 1.6 },  // loral region black behind, dark grayish brown in front (R)
    ],
    wing: {
      web: WING, edge: [40, 6, 17], tertial: INNER, covert: [40, 6, 13], lesser: BACK, lesserEdge: [60, 10, 22],   // wings sooty blackish, grayish brown on the inner secondaries (R)
      medianTip: null, greaterTip: null,
      patchSkip: 0,
      primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [],
      under: [36, 8, 24], underCovert: [36, 10, 30], underCovertTip: null, underBars: [],      // (under the wing: not described in what was read; dusky here)
      // (ten primaries, as a swift has, the outermost nearly the longest: the agent's from general knowledge, not from
      // what was read; each primary's tip laid on the spread wing's trailing edge, so that the edge is smooth)
      fold: { primaries: 10, secondaries: 8, secondaryEnd: 0.42, greater: 6, greaterEnd: 0.25, median: 5, medianEnd: 0.15 },
      spread: { primaries: 10, secondaries: 6, shape: [0.55, 1.3, 1.35, 1.3, 1.22, 1.14, 1.08, 1.03, 1] },
    },
    tail: { web: TAIL, edge: [30, 8, 22], under: [30, 8, 24], shaft: [0, 0, 5], point: 0.3 },   // tail darker grayish brown, the shafts black and rigid (R)
    bill: { upper: [0, 0, 8], lower: [0, 0, 9] },                                               // bill black (R)
    mouth: [350, 25, 28],
    eye: { iris: [24, 40, 11], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [28, 14, 25],                                                                           // feet brownish or dusky (R)
    shin: [34, 10, 35],
  },
};
