// Bald Eagle, Haliaeetus leucocephalus (the northern form, washingtoniensis, the Pacific Northwest's): the adult male.
// The female is the same in colour and about a quarter larger (Wikipedia, as the research has it).
//
// What is published and what is not. The lengths under `published` are Friedmann's for 29 adult males of the
// northern form (U.S. National Museum Bulletin 50, Part XI, 1950, p. 489: Ridgway's own volumes stop short of the
// hawks), and the bird is built to their means; life/measure.js measures the built bird against them. His culmen is
// measured from the cere, and so is this one (life/parts/raptor.js). The colours follow his description of the adult
// (written for the southern form: the northern differs only in size). Bill depth and the hind claw are from two
// adult males of New York in a Journey North page that gives Bortolotti's formula for sexing eagles by them (bill
// depth 32.4 and 32.6 mm, hind claw 41.2 and 40.5 mm). Not found in what was read, and the agent's: the cere's length,
// how far the hook hangs, the outline of head and body, the brow over the eye, the shin's long feathers, how the
// folded wing lies, the wing's shape spread beyond Friedmann's "fourth primary from the outside the longest" (its
// chord, how long each finger is and how far apart they stand), the front claws' length, every pose, and the fish.
//
// Redrawn on 2026-11-18, after the owner called it ugly: it had been a narrow bird with a small head, its spread wing
// an even fan. What was changed and what was looked at is in the commit's message; the lengths are as they were.
//
// How the sources were read: Friedmann's text through the Internet Archive's character recognition, by an agent of
// the research of 2026-11-16 (.local-assets/forest/research/birds-wave2-2026-11-16.json); BirdWeb and Wikipedia
// through tools that return a page's text or a summary of it; Journey North read by this agent through such a tool.
// No page was seen as an image.

const F = 'Friedmann 1950, The Birds of North and Middle America, Part XI (U.S. National Museum Bulletin 50), p. 489, Haliaeetus leucocephalus washingtoniensis';

export const published = {
  shown: 'adult male',
  note: 'Published: the lengths above; the colours as Friedmann has them (the whole head and neck, the tail and its coverts white, often with a creamy tinge; the body and wings dark brown, from fuscous to chaetura drab, the upperparts blacker and the underparts more rufescent, the feathers narrowly edged pale, the edges broadest on the wing coverts; iris pale chrome yellow; the bare skin round the eye, the cere, the bill and the feet deep dull cadmium; the claws black), and the six outer primaries notched, the fourth from the outside the longest. Bill depth about 32.5 mm and the hind claw about 41 mm, from two adult males (Journey North). Not found in what was read, and the agent\'s: the cere\'s length (19 mm), the hook\'s drop (17.5 mm), the front claws (36 mm), the outline (deep in the breast, broad at the shoulders, a thick neck, a flat crown), the brow over the eye, the long feathers of the shin, how the folded wing lies, the plan of the spread wing (a plank with seven fingers: its chord, and how long and how far apart the fingers are), the wingspan as built (1,960 mm), and the fish. The bill is built 40 mm deep where the feathers end; where on the bill the 32.5 mm was taken was not read, so the two are not compared.',
  sources: {
    F: `${F}: adult males, 29 skins, Alaska to North Carolina and Arkansas`,
    B: 'Seattle Audubon, BirdWeb, Bald Eagle: dark brown body and wings, white head and tail; males 8 to 10 lb with a wingspan of 6 to 6.5 ft; soars on flat wings with strong, slow beats; takes live fish and dead salmon; stick nests in tall trees; common in May on the Pacific Northwest coast',
    W: 'Wikipedia, "Bald eagle": 70 to 102 cm long, wingspan 1.8 to 2.3 m (both sexes); females about a quarter larger',
    J: 'Journey North, Bald Eagle, male and female compared (P. Nye; Bortolotti\'s formula): bill depth and hind claw of six banded adults',
  },
  lengths: [
    ['wing', 'Wing, folded', 588.6, [570, 612], 'F'],
    ['tail', 'Tail', 309.7, [290, 322], 'F'],
    ['culmen', 'Culmen from the cere', 52.5, [49, 57], 'F'],
    ['tarsus', 'Tarsus', 99.8, [84.5, 106], 'F'],
    ['midToe', 'Middle toe without its claw', 70.4, [67, 74], 'F'],
    ['length', 'Length, bill tip to tail tip (both sexes; a secondary source)', null, [700, 1020], 'W'],
    ['span', 'Wingspan (males; a secondary source)', null, [1830, 1980], 'B'],
  ],
  proportions: [
    'Tail about half the wing (Friedmann\'s means), slightly graduated: its outer feathers shorter than its middle ones by about the bill\'s depth at the base (Friedmann)',
    'The six outer primaries notched on their inner webs, the fourth from the outside the longest, then the third, fifth and second (Friedmann): a fingered wingtip',
    'Bill deep and hooked, with a cere at its base (BirdWeb, Wikipedia); 32.5 mm deep (J)',
    'Legs bare below the feathered shin, whose long feathers hang over the heel (the agent\'s drawing); the toes short and powerful, the hind claw the largest (BirdWeb); 41 mm (J)',
    'Spread, the wing is a plank: about as broad at the wrist as at the body, held flat, its tips turned a little up (BirdWeb: "soars on flat wings"; the chord and the upturn are the agent\'s)',
    'Folded, the wings reach nearly to the tail\'s tip (the agent\'s drawing)',
  ],
  mass: 'Mass of males 3.6 to 4.5 kg (8 to 10 lb, B); 3 to 6.3 kg for both sexes (W)',
};

// Friedmann's colours, as paint: [hue, saturation, lightness]
const WHITE = [44, 22, 91], CREAM = [42, 24, 86], FUSCOUS = [27, 16, 13], DRAB = [26, 15, 16], SEPIA = [24, 21, 14];
const EDGE = [27, 18, 19], PALE = [32, 20, 28], CADMIUM = [45, 90, 52], CHROME = [52, 62, 76];

const eye = { x: 420, y: 46, r: 8.6 };
const near = (p, d) => Math.hypot(p.x - eye.x, p.y - eye.y) < d;
const hood = (p) => p.x > 298 - 14 * Math.cos(Math.PI * p.a);          // the white of the head and neck: further down the throat, onto the breast, than down the nape
// the feet as an eagle on the wing carries them: back under the tail, closed (life/parts/raptor.js, feet that 'reach')
const TRAIL = { mode: 'reach', ahead: -0.88, down: -0.04, open: 0, tilt: -0.6 };

export default {
  name: 'Bald Eagle', latin: 'Haliaeetus leucocephalus', key: 'bald-eagle', seed: 411,
  // ---- who is about on a visit (life/species/index.js says what each is)
  // (`sure`, 2026-11-19, for the owner's "more animals present in their respective niches than an empty world": one
  // eagle of the river on every visit by day, and a second when the day's draw gives one; it was about on 63 visits in
  // 100 by its tier alone)
  census: { tier: 'some', sure: [1, 2], source: 'B C; breeds along fresh water at low elevation' },
  // ---- how it lives on a visit (life/families/raptor.js, the eagle's manner). Every number is the agent's own but the
  // flying speed: it glides and flaps at 56 to 70 km/h (Wikipedia, as the research of 2026-11-16 has it), so 15.5 m/s,
  // and its pass at 19.
  way: {
    family: 'raptor', manner: 'eagle',
    // (at the river from the first on six visits in ten; away at its nest for two-thirds of a minute to nearly three
    // between: it was four in ten and a minute and a half to five, and was gone most of a walk)
    there: 0.6, gap: [40, 160], fastest: 24,
    hz: 2.6, speed: 15.5, pulse: [5, 3], stay: [20, 70],
    // how near it lets the walker come: it flushes from a top or the bar when they are nearer than `flush` metres
    // (further for one who runs: 31 m at a walk, 46 at a run), or move suddenly within `startle`; off to another top,
    // another spot on the bar or into the air over the river `near` of the times, otherwise away out of sight, for good
    // `gone` of those. (It eats only where the walk is `river.bar` m off and more, so a walker on the trail passes an
    // eagle on its fish at a walk, and puts it up at a run.)
    flush: 24, startle: 45, near: 0.7, gone: 0.2,
    call: { every: [25, 90], time: 2.9, rate: 6, reach: 400, doing: 'calling: a high, weak, chittering whistle' },
    river: {
      water: 40, edge: 22, top: [16, 48],           // its tops: no further than this from the water (the first trees back from it within `edge`), and this tall (m)
      reach: [100, 560],                            // the stretch of the river it keeps to, in metres down it (the beach is at 430)
      // its soar: low enough over the river to be under the top of a walker's view from the bank and big enough in it
      // (2026-11-19: at 45 to 160 m over the water it was in sight for a tenth of the time it soared)
      soar: [30, 80], high: [18, 38], rise: [8, 22], climb: 0.6, soarSpeed: 12, radius: [35, 60], wander: 120,
      cruise: [100, 240], low: [6, 18],
      // its hunt: where along the river it strikes, how fast it stoops (m/s), and the chance a strike takes a fish
      pass: [360, 520], dive: 19, catch: 0.55,
      // with a fish: how fast it labours (m/s), its beats and glides then, the chance it takes it off to its nest, and
      // where it eats one: on the bar's stones `bar` m from the walk and more, within `barReach` along the river, for
      // `feed` seconds
      carry: 11, labour: [7, 1.2], nest: 0.2, bar: 32, barReach: 220, feed: [30, 75],
      away: 16,
      next: { soar: 0.25, cruise: 0.12, pass: 0.33, move: 0.15, leave: 0.15 },
    },
  },
  voices: {
    call: { file: 'eagle-call.mp3', level: 0.8, near: 25,
      credit: { what: 'Bald Eagle, chittering call', by: 'NPS & MSU Acoustic Atlas / Jennifer Jerrett, Yellowstone National Park sound library, 12 Sep 2016', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://commons.wikimedia.org/wiki/File:Yellowstone_sound_library_-_Bald_Eagle_-_002.mp3', source: 'https://commons.wikimedia.org/wiki/File:Yellowstone_sound_library_-_Bald_Eagle_-_002.mp3', bytes: 1950150, kept: 2.9 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 80 cm long, its wings about 2 m across: the largest bird of the valley.',
    marks: ['A white head and tail', 'A dark brown body and wings', 'A great hooked yellow bill, and yellow feet', 'Soaring, it holds its long, broad wings out flat'],
    lives: 'Rivers with tall trees to perch in over the water. It takes fish from the river, swooping low with its feet thrust forward, and eats dead salmon on the bars; it soars on flat wings and flies with strong, slow beats. In May a pair is at its nest of sticks in a tall tree, somewhere along the river, with young to feed.',
  },
  plate: { wide: 4.2, bar: 0.5 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base (where the feathers end) at 450
    // (the outline is the agent's drawing, 2026-11-18: deep in the breast and broad at the shoulders, the neck as
    // thick as the head with its hackles, the crown flat from the nape to over the eye and falling to the bill)
    top:    [[-80, 4], [-45, 22], [0, 46], [55, 68], [115, 84], [185, 93], [240, 93], [282, 88], [312, 82], [338, 78], [362, 76], [388, 76], [410, 74], [428, 67], [441, 55], [450, 42]],
    bottom: [[-85, -4], [-55, -22], [-12, -52], [50, -92], [120, -118], [190, -122], [240, -112], [280, -93], [308, -77], [336, -62], [366, -47], [396, -32], [422, -17], [440, -6], [450, 2]],
    half:   [[-85, 12], [-55, 34], [-12, 62], [50, 92], [120, 108], [190, 110], [240, 100], [280, 84], [308, 70], [336, 60], [366, 54], [396, 50], [422, 41], [440, 27], [450, 14]],
    widest: 0.46,
    neck: [288, 362],
    contour: 0,                    // (none of the lifted contour feathers every bird has had since 2026-11-18: on its neck they were dark spikes)
    // the brow: life/parts/raptor.js
    eye: { ...eye, ridge: { long: 46, out: 5.5, high: 1.0, ahead: 0.5 } },
    // the hook and the cere: life/parts/raptor.js. The bill is 40 mm deep where the feathers end.
    bill: { culmen: 52.5, drop: 0, gape: 46, hook: { drop: 17.5, from: 0.55 }, cere: { long: 19 } },
    wing: {
      chord: 588.6, wrist: [305, 30], aim: [-583, -24],
      up:   [[0, 30], [0.08, 62], [0.22, 76], [0.42, 60], [0.66, 28], [0.86, 14], [1, 4]],
      down: [[0, 28], [0.08, 78], [0.22, 100], [0.42, 92], [0.66, 58], [0.86, 30], [1, 5]],
      rest: 16, proud: 14,
      // spread, a plank: the arm as broad at the wrist as at the body, the hand nearly as broad to the fingers
      span: 1960, shoulder: [296, 44, 60], arm: 380, lead: 64, sweep: 36, root: 425, tipChord: 375,
      // its form (life/bird.js "spread wings"): nearly flat, with no rise to the wrist, and its tips turned up
      camber: 0.05, rise: 0, twist: [-0.16, 0.05], dihedral: 0, joined: true,
    },
    tail: { length: 309.7, root: 0, rootHalf: 40, feathers: 12, width: 60, closed: 0.07, graded: 28, point: 0.5, droop: 0.02, tent: 26, sheer: true },
    leg: { knee: [150, -60, 48], shin: 150, tarsus: 99.8, thick: [42, 30, 13], toes: { mid: 70.4, side: 58, hind: 46, claw: 36, hindClaw: 41 }, splay: 0.5,
      talons: { claw: 14, curve: 2.0 },
      // the shin's long feathers, down over the heel: life/parts/raptor.js
      trousers: { long: 34, girth: 44, bag: 1.2, lappets: 7 } },
    // a fish to carry and to stand over, part of the mesh (life/parts/raptor.js): a trout or a small steelhead
    prey: { long: 300, deep: 66, wide: 36 },
  },
  // The poses (life/rig.js says what each field is; `wrist`, `twist`, `prey` and feet that 'reach' are
  // life/parts/raptor.js's). Each is one moment held: what moves between them is the family's.
  poses: {
    // on a top or a limb `perch` m in radius: upright and heavy, its head drawn down into its shoulders
    perched: { pitch: 1.22, lift: 0.8, lean: 0.05, droop: 0.02, head: { pitch: -0.04 }, tail: { pitch: -0.12, fan: 0.03 }, feet: { mode: 'grip', round: 0.05 }, perch: 0.05 },
    // about to go: leaning out over its feet, its head low and forward, its wings loosened from its sides
    alert: { pitch: 0.6, lift: 0.62, lean: 0.03, droop: 0.06, head: { pitch: -0.2 }, tail: { pitch: 0.1, fan: 0.06 }, feet: { mode: 'grip', round: 0.05 }, perch: 0.05 },
    // the push off the perch: legs straight, wings thrown up and open
    takeoff: { pitch: 0.5, lift: 1.0, lean: 0.07, spread: 1, flap: 1.0, hand: 0.25, sweep: 0.1, head: { pitch: -0.1 }, tail: { pitch: 0.15, fan: 0.4 }, feet: { mode: 'grip', round: 0.05 }, perch: 0.05 },
    // the two ends of a deep, slow beat: a family beats between them (`flap` and `hand` from one to the other, the hand a little behind the arm)
    flapUp: { pitch: 0.06, lift: 0.6, spread: 1, flap: 0.75, hand: 0.25, sweep: 0.08, wrist: 0.1, tail: { fan: 0.25 }, feet: TRAIL },
    flapDown: { pitch: 0.06, lift: 0.6, spread: 1, flap: -0.55, hand: -0.2, sweep: 0, tail: { fan: 0.25 }, feet: TRAIL },
    // a glide down the river: the wings flat, the wrists a little forward and the hands back, the tail half shut
    glide: { pitch: 0.02, lift: 0.6, spread: 1, flap: 0, hand: -0.02, sweep: -0.06, wrist: 0.2, tail: { fan: 0.2 }, feet: TRAIL },
    // soaring: the wings straight out and flat, the fingers spread, the tail fanned; `roll` banks it into its circle (the head stays level)
    soar: { pitch: 0.04, lift: 0.6, spread: 1, flap: 0.03, hand: 0, sweep: -0.03, tail: { fan: 0.4 }, feet: TRAIL },
    bank: { pitch: 0.04, lift: 0.6, roll: 0.5, spread: 1, flap: 0.03, hand: 0, sweep: -0.03, tail: { fan: 0.55, yaw: 0.12 }, feet: TRAIL },
    // the stoop to the water: nose down, the wings half shut, the feet coming forward
    stoop: { pitch: -0.5, lift: 0.6, spread: 1, flap: 0.22, hand: -0.1, sweep: -0.25, wrist: 0.95, head: { pitch: -0.6 }, tail: { fan: 0.1 }, feet: { mode: 'reach', ahead: 0.3, down: 0.8, open: 0.6 } },
    // the snatch: level again over the water, wings high, the feet thrown forward and open (with `prey: 1` it has the fish)
    snatch: { pitch: 0.3, lift: 0.6, spread: 1, flap: 0.6, hand: 0.2, sweep: 0.04, head: { pitch: -0.55 }, tail: { pitch: -0.25, fan: 0.6 }, feet: { mode: 'reach', ahead: 0.72, down: 0.6, open: 1, tilt: -0.45 } },
    // carrying a fish: both feet closed on it under the body, one before the other, its head forward
    carry: { pitch: 0.06, lift: 0.6, spread: 1, flap: 0.1, hand: 0, sweep: 0, tail: { fan: 0.3 }, feet: { mode: 'reach', ahead: -0.74, down: 0.5, width: 0.014, stagger: 0.1, round: 0.02 }, prey: 1 },
    // landing: reared back on braking wings, the tail spread and down, the feet forward to take the perch
    land: { pitch: 0.95, lift: 0.6, spread: 1, flap: 0.5, hand: 0.15, sweep: -0.1, twist: 0.12, head: { pitch: -0.25 }, tail: { pitch: -0.4, fan: 0.75 }, feet: { mode: 'reach', ahead: 0.42, down: 0.86, open: 1 } },
    // standing on the ground, a bar's stones or a log
    stand: { pitch: 0.62, lift: 0.85, lean: 0.035, head: { pitch: -0.15 }, tail: { pitch: -0.1, fan: 0.03 }, feet: { mode: 'flat' } },
    // over a fish, mantling: the wings half open and let down round it, the tail spread on the ground, glaring about
    mantle: { pitch: 0.34, lift: 0.62, spread: 1, flap: -0.1, hand: -0.7, sweep: -0.5, wrist: 1.0, twist: -0.3, head: { pitch: -0.35 }, tail: { pitch: -0.3, fan: 0.6 }, feet: { mode: 'flat' }, prey: 1 },
    // tearing at it: bent right down to its feet, the bill at the fish
    tear: { pitch: 0.02, lift: 0.56, lean: -0.02, droop: 0.1, gape: 0.25, head: { pitch: -1.3 }, tail: { pitch: 0.05, fan: 0.1 }, feet: { mode: 'flat' }, prey: 1 },
    // calling: the head thrown back, the bill wide
    call: { pitch: 1.08, lift: 0.8, lean: 0.045, droop: 0.05, gape: 0.9, head: { pitch: 1.1 }, tail: { pitch: -0.1, fan: 0.05 }, feet: { mode: 'grip', round: 0.05 }, perch: 0.05 },
    // (the contact sheet's: lying level, and on the wing from above and below)
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: TRAIL },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.03, hand: 0, sweep: -0.03, tail: { fan: 0.5 }, feet: TRAIL },
  },
  plumage: {
    body: [
      { colour: SEPIA, edge: EDGE, fringe: 0.06, size: 40 },                                   // breast, belly, sides dusky sepia, more rufescent than the back, narrowly edged (F)
      { where: (p) => p.a >= 0.45, colour: FUSCOUS, edge: EDGE, fringe: 0.07, size: 46 },     // back and scapulars fuscous to fuscous-black, edged fulvous to hair brown (F)
      { where: (p) => p.a >= 0.45 && p.x < 120, colour: DRAB, edge: EDGE, fringe: 0.05, size: 34 },   // rump chaetura drab (F)
      { where: (p) => p.x < 34 && (p.a < 0.33 || p.a > 0.72), colour: WHITE, size: 30 },     // upper and under tail coverts white (F)
      // the whole head and neck white (F): the hackles long and pointed towards the shoulders, short on the crown
      { where: hood, colour: WHITE, edge: [42, 16, 83], fringe: 0.1, size: (p) => (p.x > 392 ? 12 : p.x > 350 ? 20 : 34) },
      { where: (p) => hood(p) && p.x > 438, colour: CREAM, size: 7 },                           // the bristles at the cere, creamy
      { where: (p) => near(p, eye.r + 2.6) && !near(p, eye.r - 1), colour: CADMIUM, size: 3 },  // the bare skin round the eye deep dull cadmium (F)
    ],
    wing: {
      web: [27, 16, 11], edge: [27, 16, 15], tertial: [26, 17, 13], covert: [26, 16, 14], lesser: [27, 18, 15], lesserEdge: [29, 20, 20],        // coverts edged palest and broadest (F)
      medianTip: null, greaterTip: null, tertialTip: null,
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      under: [24, 12, 14], underCovert: SEPIA, underCovertTip: null, underBars: [],                        // under wing coverts dark brownish (F)
      fold: { primaries: 7, secondaries: 7, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.26, feather: 3 },
      // spread, it is painted as a plank with seven fingers (life/parts/raptorPaint.js); `shape` is the fan's, which it does not use
      spread: { primaries: 10, secondaries: 14, shape: [0.72, 0.86, 0.96, 1, 0.99, 0.96, 0.93, 0.91, 0.9], fingers: { count: 7 } },     // the fourth from the outside the longest (F)
    },
    tail: { web: WHITE, edge: [44, 18, 88], under: [45, 12, 87], point: 0.4 },                 // tail white (F)
    bill: { upper: CADMIUM, lower: [44, 84, 50], cere: [47, 86, 54] },                         // cere and bill deep dull cadmium (F)
    claw: [30, 8, 8],                                                                           // claws black (F)
    // iris pale chrome yellow (F); the pupil small and the eye dark-rimmed under the brow's shadow, which is what makes it fierce (the agent's)
    mouth: [355, 28, 46], eye: { iris: CHROME, pupil: [240, 15, 5], rim: [30, 25, 16], small: 0.2 },
    face: { shade: [32, 14, 34], lore: [48, 55, 68], gape: CADMIUM },
    leg: CADMIUM,                                                                               // feet deep dull cadmium (F)
    shin: SEPIA, trousers: { edge: [26, 20, 24] },
    // the fish: dark olive along the back and spotted, silver sides with a rose band, a white belly (a rainbow trout; the agent's)
    prey: { back: [150, 16, 26], side: [205, 10, 70], belly: [50, 12, 90], fin: [28, 16, 38], spot: [200, 12, 14], band: [352, 40, 66] },
  },
};
