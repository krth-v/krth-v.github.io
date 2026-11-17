// Belted Kingfisher, Megaceryle alcyon caurina (Ridgway's Streptoceryle alcyon caurina): the adult female of the
// western form. One sheet is one bird's paint, so one sex is shown: the female, whose plumage has the blue-grey
// chest band the male has and, besides it, the cinnamon-rufous band, sides and flanks he lacks (one of the few
// birds of North America in which the female is the brighter). The male is the same without the rufous.
//
// What is published and what is not. The lengths under `published` are Ridgway's for 15 adult females of caurina
// (1914, p. 420), read by this agent in the archive.org full-text character recognition of the scan ("Adult
// female—Length (skins), 290-330 (315); wing, 159-169.5 (165.5); tail, 88-101 (93.3); exposed culmen, 53-71
// (59.6); tarsus, 10.5-12 (11.4); middle toe, 15.5-17 (16.2)", footnote "Fifteen specimens"), the same line the
// research file had, where a second reader had checked it. The bird is built to the means; life/measure.js
// measures the built bird against them. The colours are his description of the nominate form's adults (pp.
// 415-416), to which he says caurina is "similar" apart from size and wing tip (he gives no colours of its own):
// the female "similar to the adult male but with a band (sometimes incomplete or interrupted) across lower breast,
// together with sides, flanks, and axillars, cinnamon-rufous". That a small white patch parts her two bands is
// the Animal Diversity Web's. Not found in what was read, and so the agent's: the outline of head and body, the
// crest's blades (their number, lengths and set: Ridgway has only "feathers of crown, occiput and nape narrow and
// elongated, forming a conspicuous crest when erected", Wikipedia "a shaggy crest", the ADW "a tall prominent
// crest"), the shape of the spread wing and the stance. The wingspan is Wikipedia's range for both sexes.
//
// The toes: two of a kingfisher's front toes are joined (BirdWeb, of the order, as the research file has it: a
// partial fusion of two toes; the ADW: "The inner toes are fused together"). They are built as three toes lying
// side by side, nearly parallel (the sheet's `leg.yaw`), which is how the foot looks from a stride off.
//
// (Until 2026-11-16 this sheet was the adult male, to his lengths, with legs painted brown, a warm pale base to the
// bill, black bars across the folded wing's coverts and three black blots at its tertials' tips: Ridgway has the
// legs "livid slate color (in life)", the bill "black, sometimes paler (grayish) basally", and on the wing only
// "very slender black shaft-streaks" and "minute irregular white markings", the distal secondaries "rather narrowly
// tipped with white".)

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Streptoceryle alcyon caurina, p. 420; the colours from S. a. alcyon, pp. 415-416';

export const published = {
  shown: 'adult female, spring (the male lacks her rufous band and flanks)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it for the nominate form (above, the sides of the head included, clear bluish gray, nearly plumbeous, interrupted by a white collar across the hindneck; the feathers of the crown and crest with a median streak of black; back and wings with very slender black shaft streaks; the wing coverts and secondaries usually with a few minute white markings; primaries slate-black, spotted white on the basal half, the inner ones and the distal secondaries narrowly tipped white; the middle tail feathers bluish gray with a black median streak, the others slate-black with the outer web edged bluish gray and the inner web barred with white; a conspicuous white spot above the lores and a smaller one under the eye; the sides of the neck, chin, throat and foreneck white; a broad band of bluish gray across the chest; the rest of the underparts white; in the female a band across the lower breast, with the sides, flanks and axillars, cinnamon-rufous; the under wing coverts white; bill black, paler and greyish at its base, most on the lower mandible; iris dark brown; legs and feet livid slate). That a small white patch parts her two bands: the Animal Diversity Web. Not found, and the agent\'s: the outline, how many blades the crest has and how it lies, how upright the perched bird sits, and how the rufous band and flanks run into one another.',
  sources: {
    R: `${R}: 15 adult females (the male: wing 159-169, tail 88-96.5, culmen 55-64, length 284-320)`,
    W: 'Wikipedia, "Belted kingfisher" (read 2026-11-16): 28 to 35 cm long, wingspan 48 to 58 cm, 113 to 178 g; the female typically slightly larger than the male; a large head with a shaggy crest; the bill black with a grey base; pounds its prey against its perch; flies at up to 72 km/h and dives at 40 km/h',
    B: 'Seattle Audubon, BirdWeb, Belted Kingfisher (read 2026-11-16): a stocky bird with a large, crested head and a long solid bill; small feet with two toes partly fused; the female has an additional rufous band and rufous on the sides of the belly; perches or hovers over open water and dives headfirst, taking its prey near the surface without submerging completely; a dry rattle, often given in flight; nests in burrows dug in sandy banks',
    A: 'Animal Diversity Web, Megaceryle alcyon (read 2026-11-16): "The female has another rufous band below the shared dark band which is separated by a small white patch"; a tall prominent crest; small feet, the tarsus short; watches from an unobstructed and usually dead limb over the water and dives off it at an angle, or hovers and dives straight down; strikes its catch against the limb, tosses it and eats it head first; moves up and down the river above the water and below the canopy; a breeding territory of 800 to 1,200 m of shoreline',
    U: 'National Audubon Society, Guide to North American Birds, Belted Kingfisher (read 2026-11-16): plunges headfirst and takes its prey near the surface; may hover before diving; often first noticed by its rattling call as it flies along rivers or lakes; a loud, penetrating rattle at any disturbance or territory dispute',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 165.5, [159, 169.5], 'R'],
    ['tail', 'Tail', 93.3, [88, 101], 'R'],
    ['culmen', 'Exposed culmen', 59.6, [53, 71], 'R'],
    ['tarsus', 'Tarsus', 11.4, [10.5, 12], 'R'],
    ['midToe', 'Middle toe', 16.2, [15.5, 17], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 315, [290, 330], 'R'],
    ['span', 'Wingspan (both sexes)', null, [480, 580], 'W'],
  ],
  proportions: [
    'The bill long and deep: its depth at the nostrils about a quarter of its length, its length more than a third of the wing and not half of it (Ridgway\'s genus)',
    'The tail about three fifths of the wing, square (Ridgway\'s genus: "a little less to slightly more than three-fifths", "truncate or very slightly rounded")',
    'The tarsus tiny, about one fourteenth of the wing: the legs hardly clear the belly',
    'The head large for the body, with a shaggy crest of the crown, occiput and nape',
  ],
  mass: '113 to 178 g, both sexes (W); the female typically slightly the larger (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness], laid darker than their names read
const WHITE = [40, 6, 90], SLATE = [208, 23, 31], BAND = [208, 24, 30], DARK = [214, 17, 23], BLACK = [220, 15, 9], EDGE = [206, 21, 40];
const RUFOUS = [17, 54, 35], RUFOUS_PALE = [20, 46, 46];

// The female's body is a share longer than the male's this sheet was first drawn for (her skins average 315 mm to
// his 306, her wing 165.5 to his 163.1): every place along the body is drawn out by it.
const KX = 1.03, X = (x) => +(x * KX).toFixed(1);
const along = (points) => points.map(([x, y]) => [X(x), y]);

// feathers grow smaller towards the head
const size = (p) => (p.x > X(140) ? 4 : p.x > X(104) ? 6.5 : 11);

export default {
  name: 'Belted Kingfisher', latin: 'Megaceryle alcyon', key: 'belted-kingfisher', seed: 347,
  // ---- who is about on a visit (life/species/index.js says what each field is)
  census: { tier: 'some', source: 'B F' },
  // ---- how it lives on a visit: life/families/plunger.js, which says what each number is. Every number here is the
  // agent's own, but the speeds: Wikipedia has it flying at up to 72 km/h (20 m/s) and diving at 40 km/h (11 m/s).
  way: {
    family: 'plunger', there: 0.65, gap: [60, 240],
    // its stretch of the river, and the posts over it (life/places/kingfisher.js)
    range: 60, need: 4,
    hz: 7, hoverHz: 10, speed: 11, dash: 14, dive: 11,
    // how near it lets the walker come (life/behave.js): a wary bird, which a walk along the far bank passes by and a
    // run puts up
    flush: 14, startle: 30, near: 0.55, gone: 0.3,
    spell: [90, 300], away: 0.25,
    search: [3, 9], plunge: 0.3, move: 0.2,
    hover: { chance: 0.25, time: [3, 8], high: [5, 10], dive: 0.6 },
    catch: 0.35, whacks: [3, 7],
    call: { every: [25, 70], time: 1.5, reach: 150, doing: 'rattling: a loud, dry rattle' },
    // the count of walks' limits (life/bodies.js WAY): its feet go 0.1 m under the water's face in a plunge, and its
    // dash is 14 m/s
    fastest: 18,
  },
  voices: {
    call: { file: 'kingfisher-rattle.mp3', level: 0.8, near: 14,
      credit: { what: "Belted Kingfisher, rattle", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-beltedkingfisher.htm', bytes: 1000380, kept: 1.5 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: '28 to 35 cm long and 113 to 178 g, the female a little the larger: a stocky bird with a large crested head and a heavy bill longer than its head.',
    marks: ['Slate blue above, with a big, shaggy crest', 'A white collar and a white throat', 'A broad slate-blue band across the chest, and below it a rufous one that runs down the flanks: a female (the male has the blue band alone)', 'A long, heavy black bill, grey at its base and tapered to a point'],
    lives: 'Rivers and lakes with clear water. It watches the water from a bare limb over it, often a dead one, or hovers over it, and dives in head first for a small fish, which it takes near the surface without going wholly under; back on its perch it beats the fish against the limb, tosses it and swallows it head first. It flies up and down its stretch of the river, low under the trees, and is often first noticed by its loud, dry rattle. It nests in a burrow dug in a bank.',
  },
  plate: { wide: 1, bar: 0.05 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 160.6
    top:    along([[-12, 3], [-4, 11], [12, 20], [34, 26], [58, 28], [82, 28], [100, 27], [112, 27.5], [122, 29.5], [134, 29.5], [146, 26], [152, 21], [155.9, 14]]),
    bottom: along([[-12, -3], [-4, -8], [12, -17], [34, -25], [58, -27], [82, -26], [100, -23], [112, -19], [122, -17], [134, -14], [146, -10], [152, -6], [155.9, -2.4]]),
    half:   along([[-12, 5], [-4, 14], [12, 20], [34, 23], [58, 24], [82, 23.5], [100, 22], [112, 20.5], [122, 20], [134, 19.5], [146, 16], [152, 12.5], [155.9, 8]]),
    widest: 0.5,
    neck: [X(100), X(122)],
    eye: { x: X(138), y: 14, r: 4.2 },
    bill: { culmen: 59.6, drop: 0.02, gape: 18 },
    // The crest: a shaggy mass of long, ragged blades of the crown, occiput and nape, in the crown's own paint,
    // broad across the head, standing up and back in two points (one off the hind crown, a longer one off the
    // occiput) with a notch between, and shorter blades before and behind. [x of its root, length, how far it
    // leans back from upright, how deep and how wide it is at its root (mm), how much further it leans at its tip].
    // The far level keeps the last blade alone: the hind crown's point. Every number of it is the agent's.
    crest: { sunk: 6, paint: [X(114), X(138)], lobes: [
      [X(144), 15, 0.42, 6, 8.5, 0.3],
      [X(138), 25, 0.6, 8, 11, 0.32],
      [X(124), 23, 0.98, 9, 12, 0.32],
      [X(118), 40, 1.16, 9.5, 11.5, 0.32],
      [X(112), 26, 1.36, 8, 10, 0.25],
      [X(106), 15, 1.48, 6, 8, 0.2],
      [X(131), 38, 0.72, 10, 12.5, 0.4],
    ] },
    wing: {
      chord: 165.5, wrist: [X(104), -4], aim: [-160, 6],
      // broad and rounded, the tip pointed a little (Ridgway: "moderate or rather long, pointed"; the outline is the agent's)
      up:   [[0, 8], [0.12, 31], [0.3, 37], [0.5, 32], [0.74, 21], [0.9, 10], [1, 2.5]],
      down: [[0, 6], [0.12, 18], [0.3, 24], [0.5, 24], [0.74, 18], [0.9, 9], [1, 2.5]],
      rest: 8, proud: 4,
      span: 520, shoulder: [X(96), 18, 28], arm: 90, lead: 28, sweep: 40, root: 100, tipChord: 50,
    },
    tail: { length: 93.3, root: 1, rootHalf: 8, feathers: 12, width: 17, closed: 0.03, graded: 3, point: 0.7, droop: 0.02, tent: 8 },
    // short legs; the middle and outer toes lie side by side (they are joined in life)
    leg: { knee: [X(52), -18, 22], shin: 10, tarsus: 11.4, thick: [6, 2.8, 2], toes: { mid: 15.9, side: 12.4, hind: 7.2, claw: 5, hindClaw: 4 }, splay: 0.3, yaw: { O: 0.1, I: -0.1 } },
  },
  poses: {
    // upright over the water, the head down a little and the tail hanging
    perched: { pitch: 0.8, lift: 0.5, head: { pitch: -0.15 }, tail: { pitch: -0.3, fan: 0.02 }, feet: { mode: 'grip', round: 0.02 }, perch: 0.02 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.22 }, feet: { mode: 'tuck' } },
    // over the water before a plunge: the body upright, the tail fanned and let down, the wings beating, the bill down
    hover: { pitch: 0.75, lift: 0.6, spread: 1, flap: 0.3, hand: 0.1, sweep: -0.15, head: { pitch: -1.05 }, tail: { pitch: -0.45, fan: 0.55 }, feet: { mode: 'tuck' } },
    // the plunge as it strikes the water: head first, the wings closed, the bill down the line of the dive
    plunge: { pitch: -1.3, lift: 0.6, spread: 0, head: { pitch: -1.3 }, tail: { pitch: 0.1, fan: 0.04 }, feet: { mode: 'tuck' } },
    // on its limb with a fish, beating it against the wood: the head swung down and to one side
    beat: { pitch: 0.6, lift: 0.5, gape: 0.18, head: { yaw: 1.0, pitch: -0.75 }, tail: { pitch: -0.25, fan: 0.08 }, feet: { mode: 'grip', round: 0.02 }, perch: 0.02 },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                              // the rest of the underparts white (R)
      { where: (p) => p.a > 0.6, colour: SLATE, shaft: BLACK, shaftWidth: 0.07, size },                     // above clear bluish gray, with very slender black shaft streaks (R)
      { where: (p) => p.x >= X(78) && p.x < X(100) && p.a <= 0.6, colour: BAND, size },                     // a broad band of bluish gray across the chest (R)
      { where: (p) => p.x >= X(36) && p.x < X(78) && p.a > 0.24 && p.a <= 0.6, colour: RUFOUS, edge: RUFOUS_PALE, fringe: 0.2, size },     // the female's sides and flanks cinnamon-rufous (R)
      { where: (p) => p.x >= X(16) && p.x < X(36) && p.a > 0.24 && p.a <= 0.6, colour: RUFOUS, edge: WHITE, fringe: 0.35, size },        // (running out into the white towards the vent)
      { where: (p) => p.x >= X(50) && p.x < X(73) && p.a <= 0.24, colour: RUFOUS, edge: RUFOUS_PALE, fringe: 0.2, size },   // and a band across her lower breast (R), parted from the blue one by a small white patch (A)
      { where: (p) => p.x >= X(100) && p.a > 0.38 && p.a <= 0.6, colour: SLATE, size: 6 },                 // the sides of the head bluish gray (R)
      { where: (p) => p.x >= X(100) && p.a <= 0.38, colour: WHITE, size: 6 },                               // chin, throat and foreneck immaculate white (R)
      { where: (p) => p.x >= X(144) && p.a > 0.3 && p.a <= 0.42, colour: SLATE, edge: DARK, fringe: 0.3, size: 3.5 },     // the fore part of the malar region deep bluish gray (R)
      { where: (p) => p.x >= X(102) && p.x < X(114) && p.a > 0.38, colour: WHITE, size: 6 },                // a white collar across the hindneck (R)
      { where: (p) => p.x >= X(114) && p.a > 0.6, colour: SLATE, shaft: BLACK, shaftWidth: 0.3, size: 5 },  // the crown and the crest, each feather with a median streak of black (R)
      { where: (p) => p.x > X(142) && p.y > 15 && p.y < 21 && p.a > 0.55 && p.a < 0.85, colour: WHITE, size: 2.4 },       // a conspicuous white spot above the lores (R)
      { where: (p) => p.x > X(134) && p.x < X(142) && p.y > 4.5 && p.y < 8.5 && p.a > 0.4 && p.a < 0.7, colour: WHITE, size: 2.2 },     // a smaller white spot under the eye (R)
    ],
    wing: {
      web: DARK, edge: EDGE, tertial: SLATE, covert: SLATE, lesser: SLATE, lesserEdge: EDGE,
      // (the coverts' few minute white markings (R) are not painted: a fleck at every covert's tip lay across the wing
      // as two white bars, and black tips, as this sheet first had them, as two black ones)
      medianTip: null, greaterTip: null,
      patchSkip: 0,
      primaryBars: [[0.12, 0.5, WHITE, 'inner']],                                               // the primaries slate-black, spotted white on the basal half (R)
      secondaryBars: [[0.7, 0.98, WHITE, 'edge']],                                              // the secondaries' inner webs white at the base, the distal ones narrowly tipped white (R)
      tertialTip: [WHITE, 0.05], tertialBars: [],
      under: WHITE, underCovert: WHITE, underCovertTip: null, underBars: [],                    // the under wing coverts and the inner webs of the primaries white (R)
      fold: { primaries: 10, secondaries: 11, secondaryEnd: 0.66, greater: 9, greaterEnd: 0.38, median: 8, medianEnd: 0.24 },
      spread: { primaries: 10, secondaries: 9, shape: [0.64, 0.84, 0.95, 1, 1, 1, 0.99, 0.97, 0.95] },
    },
    // the middle pair bluish gray, the others slate-black with the outer web edged bluish gray and the inner web barred white (R)
    tail: { web: DARK, edge: EDGE, under: [215, 8, 60], middle: SLATE, shaft: BLACK, bars: [WHITE, 5, 0.035], point: 0.4 },
    // black, paler and greyish at the base, most on the lower mandible (R; W: "black with a grey base")
    bill: { upper: [0, 0, 9], lower: [0, 0, 10], lowerBase: [[210, 5, 34], 0.3] },
    mouth: [350, 25, 28],
    eye: { iris: [20, 40, 10], pupil: [240, 15, 5] },                                           // iris dark brown (R)
    leg: [222, 9, 36],                                                                           // legs and feet livid slate color, in life (R)
    shin: [40, 6, 80],
  },
};
