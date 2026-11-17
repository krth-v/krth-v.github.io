// Golden-crowned Kinglet, Regulus satrapa (the western form, olivaceus): the adult male. The female's crown
// patch is yellow all through, without his orange (Ridgway).
//
// What is published and what is not. The lengths under `published` are Ridgway's for 17 adult males of the
// western form, and the bird is built to their means; life/measure.js measures the built bird against them.
// The colours follow his description of the species, which is of the eastern form; of the western he says
// only that it is brighter and more greenish olive above. The outline of head and body, where the eye sits and
// how the folded wing lies are in nothing that was read: they are the agent's drawing, for the owner to judge
// from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, each through a tool that returns a
// summary of the scan's character recognition. No page was seen as an image. The male's exposed culmen is
// printed 7.0 where the female's is 7.9 and the eastern male's 7.5: one of the three is likely a slip of the
// scan, and it was not found which.

const R = 'Ridgway 1904, The Birds of North and Middle America, Part III (U.S. National Museum Bulletin 50), Regulus satrapa olivaceus';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the species (a broad black stripe on each side of the crown, the two meeting in front, round a yellow band and an orange middle; forehead and a broad stripe over the eye dull white; a faint dusky streak through the eye; the cheek dull olive-whitish; nape greyer than the back, the back olive, the rump brighter and greener; two pale wing bars, and a dusky band across the secondaries below the second; flight feathers and tail dusky, edged with light yellowish olive; underparts dull olive-whitish; bill black; iris brown). Not found in what was read, and the agent\'s: the outline, how wide each stripe of the crown is. Whether the middle toe was measured with its claw is not said.',
  sources: {
    R: `${R}: 17 adult males, museum skins`,
    W: 'Wikipedia, "Golden-crowned kinglet" (read 2026-11-16): 8 to 11 cm long, wingspan 14 to 18 cm, 4.5 to 7.8 g',
    B: 'Seattle Audubon, BirdWeb, Golden-crowned Kinglet: high in conifers in the breeding season, in pairs; how it feeds',
  },
  lengths: [
    ['wing', 'Wing, folded', 54.9, [53, 57], 'R'],
    ['tail', 'Tail', 40.8, [38.5, 42.5], 'R'],
    ['culmen', 'Exposed culmen (see the note: perhaps a slip of the scan)', 7, [6.5, 8], 'R'],
    ['tarsus', 'Tarsus', 17.3, [15.5, 18], 'R'],
    ['midToe', 'Middle toe', 8.5, [8, 9], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 93.7, [90, 100], 'R'],
    ['span', 'Wingspan (one secondary source)', null, [140, 180], 'W'],
  ],
  proportions: [
    'The tail three quarters of the wing (40.8 to 54.9: worked out from Ridgway\'s means)',
    'The tarsus long for the bird: nearly a third of the wing',
  ],
  mass: 'Mass about 6.2 g: 4.5 to 7.8 (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const ORANGE = [22, 92, 50], YELLOW = [50, 92, 52], BLACK = [60, 8, 9], WHITE = [52, 14, 86], OLIVE = [70, 22, 31], NAPE = [68, 12, 36];
const RUMP = [72, 32, 36], BELOW = [58, 14, 70], FLANK = [62, 22, 58], DUSKY = [50, 8, 19], EDGE = [62, 40, 38], BAR = [56, 34, 76];

const size = (p) => (p.x > 37 ? 1.7 : p.x > 31 ? 2.4 : 4);
const head = (p) => p.x > 34;

export default {
  name: 'Golden-crowned Kinglet', latin: 'Regulus satrapa', key: 'golden-crowned-kinglet', seed: 67,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'most', source: 'B C; P regular; high in the crowns', mean: 3, party: [2, 2] },
  way: {
    family: 'bough', there: 0.6, gap: [40, 200], together: true,
    // its pair's first tree stands within `homeOff` metres of the walk, and its boughs come low enough (`high`);
    // the trees the pair moves on to, within `off`
    homeOff: 12,
    hz: 24, speed: 6, high: 6, off: 20, stay: [8, 22],
    // how near it lets the walker come (life/behave.js; the agent's own: kinglets are bolder still); put up off
    // out of sight it is never gone for good (`gone`: 0): it comes back to where its mate is
    flush: 2.5, startle: 6, near: 0.85, gone: 0,
    hang: 0.07, hover: 0.2, flick: 1,
    call: { every: [5, 16], time: 0.7, rate: 4.5, reach: 35, doing: 'calling: three thin notes, very high' },
    song: { chance: 0.22, time: 2.2, rate: 3.3, reach: 50, doing: 'singing: a run of thin, high notes' },
  },
  voices: {
    call: { file: 'kinglet-call.mp3', level: 0.3, near: 4,
      credit: { what: 'Golden-crowned Kinglet, call', by: 'G. McGrane, 2004 (Wikimedia Commons)', licence: 'Public domain (released by its author)',
        source: 'https://commons.wikimedia.org/wiki/File:Golden-crowned_Kinglet.ogg', bytes: 16448, kept: 0.7 } },
    song: { file: 'kinglet-song.mp3', level: 0.35, near: 4,
      credit: { what: 'Golden-crowned Kinglet, song', by: 'J. Job, U.S. National Park Service (Rocky Mountain National Park sound library), 2016', licence: 'Public domain',
        source: 'https://www.nps.gov/nps-audiovideo/legacy/mp3/imr/avElement/romo-GCKIROMO5252016GemLakeTrail.mp3', bytes: 593112, kept: 2.2 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 9 cm long and 6 g: one of the smallest birds of these woods.',
    marks: ['A crown of orange and yellow between two black stripes', 'A white stripe over the eye', 'Olive above, pale below, with two pale bars on the wing', 'It flicks its wings as it goes'],
    lives: 'Conifers, mostly high in them. It hops among the outer twigs, hangs under them and hovers at their tips after insects too small to see, and is never still. In spring it goes about in pairs; its call is three thin notes, almost too high to hear.',
  },
  plate: { wide: 0.32, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 46.2
    top:    [[-8, 1.8], [-2.5, 5], [5, 8.8], [13.5, 11.5], [22, 12.4], [29, 12.1], [33.6, 11.8], [37.4, 12.7], [41.2, 12.6], [43.9, 10.3], [45.5, 6.8], [46.2, 3.7]],
    bottom: [[-9.5, -0.9], [-3.4, -5], [4.2, -9.6], [12.8, -12.8], [21.2, -13.4], [28, -11.8], [34, -8.8], [39.1, -5.2], [43, -1.9], [46.2, 1.3]],
    half:   [[-9.5, 2.1], [-3.4, 6], [4.2, 10], [12.8, 12.2], [21.2, 12.7], [28, 11.3], [33.2, 9.7], [37.4, 9.4], [41.2, 8], [44.2, 4.8], [46.2, 1.25]],
    widest: 0.46,
    neck: [30.5, 38.5],
    eye: { x: 40.6, y: 5.6, r: 1.3 },
    bill: { culmen: 7, drop: 0.03, gape: 1.3 },
    wing: {
      chord: 54.9, wrist: [30, -1.6], aim: [-53, 4.5],
      up:   [[0, 1.7], [0.12, 6.6], [0.3, 8], [0.5, 7], [0.72, 4.4], [0.9, 2], [1, 0.5]],
      down: [[0, 1.2], [0.12, 3.8], [0.3, 5.3], [0.5, 5.4], [0.72, 4], [0.9, 2.2], [1, 0.5]],
      rest: 1.7, proud: 0.9,
      span: 160, shoulder: [28.5, 5.4, 8], arm: 22, lead: 5, sweep: 12, root: 40, tipChord: 16,
    },
    // a little notched: the outer feathers the longer (the agent's)
    tail: { length: 40.8, root: 0.8, rootHalf: 2, feathers: 12, width: 5, closed: 0.035, graded: -2, point: 0.6, droop: 0.03, tent: 3.4 },
    leg: { knee: [19.5, -7.2, 5.1], shin: 11, tarsus: 17.3, thick: [2.4, 1, 0.6], toes: { mid: 8.5, side: 6.4, hind: 6.2, claw: 3.4, hindClaw: 4.4 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.26, lift: 0.38, head: { pitch: 0.06 }, tail: { pitch: -0.06, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELOW, size },                                                                  // underparts dull olive-whitish (R)
      { where: (p) => p.a > 0.2 && p.a < 0.58 && p.x < 28, colour: FLANK, size: 4 },            // sides and flanks faintly tinged yellowish olive (R)
      { where: (p) => p.a >= 0.58 && p.x <= 34, colour: OLIVE, size },                          // back olive: brighter and more greenish in the western form (R)
      { where: (p) => p.a >= 0.58 && p.x < 9, colour: RUMP, size: 4 },                          // rump and upper tail coverts brighter and greener than the back (R)
      { where: (p) => p.a >= 0.58 && p.x > 28 && p.x <= 34.5, colour: NAPE, size: 2.6 },        // nape and hindneck greyer (R, of the eastern form)
      { where: (p) => head(p) && p.a < 0.53, colour: [62, 14, 66], size: 1.8 },                 // the cheek plain dull olive-whitish (R)
      { where: (p) => head(p) && p.a >= 0.53 && p.a < 0.61 && p.x > 36, colour: [48, 10, 28], size: 1.6 },    // a faint dusky streak through and behind the eye (R)
      { where: (p) => head(p) && p.a >= 0.61 && p.a < 0.75, colour: WHITE, size: 1.7 },         // forehead and a broad stripe over the eye dull white (R)
      { where: (p) => head(p) && p.a >= 0.75 && p.x <= 45, colour: BLACK, size: 1.8 },          // a broad black stripe on each side of the crown, meeting at the front (R)
      { where: (p) => p.x > 35.5 && p.x <= 43.4 && p.a >= 0.86, colour: YELLOW, size: 1.8 },    // enclosing a narrower yellow band,
      { where: (p) => p.x > 35.5 && p.x <= 42.6 && p.a >= 0.935, colour: ORANGE, size: 1.8 },   // with a large orange middle that reaches back over the back of the head (R)
    ],
    wing: {
      web: DUSKY, edge: [60, 26, 30], tertial: [50, 8, 21], covert: [50, 8, 21], lesser: OLIVE, lesserEdge: [70, 22, 37],
      medianTip: [BAR, 0.24], greaterTip: [BAR, 0.18],          // middle and greater coverts broadly tipped pale olive-yellow or yellowish white: two wing bars (R)
      patchSkip: 0,
      primaryBars: [],                                        // flight feathers dusky with light yellowish olive edges (R): the edging
      secondaryBars: [[0.2, 0.36, [50, 8, 9], 'both'], [0.42, 0.95, EDGE, 'edge']],             // an exposed dusky band across the secondaries, the edges brightest beyond it (R)
      tertialTip: null,
      under: [52, 8, 50], underCovert: [56, 12, 74], underCovertTip: null, underBars: [],       // under the wing: not described in what was read; pale here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.7, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.6, 0.86, 0.97, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: DUSKY, edge: [60, 30, 32], under: [52, 8, 40], point: 0.45 },                          // tail dusky, edged with light yellowish olive (R)
    bill: { upper: [50, 8, 9], lower: [50, 8, 11] },                                            // bill black (R)
    mouth: [20, 60, 50],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [28, 30, 22],                                                                          // deep brown in dried skins, the soles yellowish (R)
    shin: [60, 14, 60],
  },
};
