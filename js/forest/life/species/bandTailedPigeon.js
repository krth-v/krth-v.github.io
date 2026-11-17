// Band-tailed Pigeon, Patagioenas (Columba) fasciata, the northern group (monilis, the Pacific Northwest's): the adult male.
//
// What is published and what is not. The lengths under `published` are Ridgway's for 38 adult males of Chloroenas
// fasciata fasciata, which he does not split (the Pacific form, monilis, is in his text only as a synonym, and has no
// table of its own); the Washington row of four males is wing 218, tail 145.1, exposed culmen 18.5, tarsus 29, middle
// toe 31.3, a little larger, and was not used: the bird is built to the 38's means. The colours are his description of
// the adult male, tract by tract, and Wikipedia's and BirdWeb's for the bill, the feet and the eye. The outline of head
// and body, the stance, where the eye sits, how the folded wing lies and its wingspan are in nothing that was read
// closely: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: one agent read, and a second checked, the text of the Internet Archive's scan of Ridgway
// 1916 (Bulletin 50, Part VII, p. 288) by its character recognition; no page was seen as an image. The other sources
// (Wikipedia, Seattle Audubon's BirdWeb) were read through a tool that returns a page's text or a summary of it.
// Unconfirmed: whether the middle toe is counted with or without its claw (the genus text compares "exclusive of
// claw", so it is built without), and the wingspan (one secondary source, which the reading itself calls low against a
// 208 mm wing). Not read at all: any account of how it stands or walks.
//
// What the builder cannot do, and so is not here: the nape's metallic bronze and green is iridescent (it shifts with
// the light), and is painted flat, greener on the hindneck and more bronze down its sides; the bill's black tip is
// painted on the lower mandible only, since the builder gives the upper mandible one colour (asked for: a tip of its
// own); the red eyelids have no field, and the eye has one colour round its pupil.
//
// Corrected on 2026-11-16 (the pigeon's agent, from its contact sheet, against what was read): the tail's pale
// apical band was never painted (its `tip` named a seventh strip of six), and the tail read as a thin dark streak;
// the white bar and the bronze ran down the whole side of the neck as a collar, where Ridgway has a bar across the
// nape and the bronze on the hindneck below it; the iris was a bright yellow ring, where BirdWeb has a dark eye in a
// thin red ring and Ridgway an outer ring of pink; the pale edging of every flight feather and covert drew pale
// stripes over the folded wing. The tail is painted as COSEWIC has it seen: dark, with a lighter grey band across
// its tip (the builder lays a tail's bars across both webs, and its tips on the inner web only: so the pale is the
// tail's ground, and the dark a wide bar over its proximal part, which the coverts begin over; asked for: a band of
// its own across both webs). The body's rear is drawn out a little further over the tail's root, as a pigeon's long
// tail coverts are.

const R = 'Ridgway 1916, The Birds of North and Middle America, Part VII (U.S. National Museum Bulletin 50), Chloroenas fasciata fasciata, pp. 283-289 (https://archive.org/download/cu31924022528099/cu31924022528099_djvu.txt)';

export const published = {
  shown: 'adult male (northern group)',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the adult male (head purplish drab, paler and greyer on the throat and cheek; a bar of white across the nape and the whole hindneck below it metallic bronze or greenish bronze, the feathers sharply outlined; back and scapulars greyish brown, very faintly bronzy; rump and upper tail coverts neutral grey; tail neutral grey in its proximal half or more, the apical half lighter and browner, with a more or less interrupted band of darker grey to dull black across the middle; wing coverts brownish grey, the greater coverts narrowly edged with white; distal secondaries much darker and narrowly edged whitish, the proximal ones browner; primaries, their coverts and the alula dusky; underparts purple-drab, more vinaceous on the body and greyer on the throat, the lower abdomen, vent and under tail coverts white; underwing coverts pale neutral grey; bill yellow with its apical third or so black; iris pale yellow next to the pupil with an outer ring of pink or lilac; eyelids red; legs and feet clear cadmium yellow). The two other sources say the eye is black with a thin red ring (BirdWeb) and give the yellow bill with a black tip to the northern group (Wikipedia); the sheet paints the ring round the pupil a dull pinkish red, as BirdWeb\'s red ring and Ridgway\'s outer ring of pink read at a distance, and not his pale yellow next to the pupil. Not found, and the agent\'s: the outline, the stance, the wingspan, the thickness of the wing, the width of the tail, the exact place and width of the white bar, where the vinaceous breast turns to white, and how dark or pale each grey is within its range.',
  sources: {
    R: `${R}: 38 adult males, museum skins`,
    W: 'Wikipedia, "Band-tailed pigeon" (read 2026-11-16 through a summary tool): wingspan 66 cm (both sexes; looks low beside the wing), 226 to 460 g, the northern group has a black-tipped yellow bill, belly nearly white, a faint pink cast strongest in the male',
    B: 'Seattle Audubon BirdWeb, Band-tailed Pigeon: largest of Washington\'s pigeons and doves, like a Rock Dove in colour but longer and more streamlined, a white collar at the nape with an iridescent green patch beneath it, bill and feet yellow, the eye black with a thin red fleshy eye ring, a lighter grey banded tail; foraging in flocks most seasons, mostly in trees, which they climb about with ease, and on the ground; roosts in thick conifers; congregates at mineral springs in June and late summer (read 2026-11-16, through a tool that returns a page\'s text)',
    C: 'COSEWIC assessment and status report on the Band-tailed Pigeon in Canada, 2008 (canada.ca, read 2026-11-16 through a summary tool): "dark overall, with a purple-grey head and distinctive white crescent on a patch of iridescent green-bronze on the hindneck"; "Bill is yellow with a black tip"; "In flight the tail appears dark with a lighter grey band across the tip"; "Flight is usually swift and direct"; "Wings produce a clapping sound on takeoff"; "Migrant flocks are often observed perched in tall dead conifers near foraging areas"; feeds mostly in the early morning, with long roosting periods after; buds and flowers in early summer, fruit (cascara, elderberry, Rubus) from mid-June; mineral springs visited every 7 to 15 days, counted between sunrise and noon; 51 % of 27 nests begun in May; adults taken by Cooper\'s Hawks and goshawks',
    A: 'National Audubon Society, Guide to North American Birds, Band-tailed Pigeon (read 2026-11-16 through a summary tool): "foraging in flocks at most seasons"; "they do much of their feeding up in trees, clambering about with surprising agility", "even hanging upside down to reach berries"; seeds, young spruce cones, buds, young leaves, flowers, berries (elderberry among them); "In courtship, male flies up and then glides in a wide circle, giving a wheezing call and fluttering wings toward end of glide. On perch, male coos with chest and neck puffed up, tail lowered and spread"; voice "a deep owl-like whoo-hoo"; it gives the wingspan as 50 to 56 cm, against Wikipedia\'s 66, and was not used',
    V: 'P. Boesman, 2015, "Voice comparison of the Southern and Northern Band-tailed Pigeons", HBW Alive Ornithological Note 41 (Birds of the World, read 2026-11-16 through a summary tool): the northern birds\' song a series of soft, low coos, a single note and then repeated two-syllable notes; a note 0.65 to 0.91 s, a note and its pause 1.39 to 2.13 s; the first syllable shorter and higher; 225 to 270 Hz at the lowest, 420 to 500 at the highest (10 recordings)',
    D: 'Washington Department of Fish and Wildlife, Pacific Coast band-tailed pigeon (read 2026-11-16 through a summary tool): "Its bill is yellow with a dark tip"; "a low-pitched \'hoo-hoo\'"; mineral sites give sodium in the nesting season; "A flock of band-tailed pigeon perched in a tree top"',
  },
  lengths: [
    ['wing', 'Wing, folded', 208.6, [195, 221], 'R'],
    ['tail', 'Tail', 139.4, [122, 151], 'R'],
    ['culmen', 'Exposed culmen', 18, [16, 20], 'R'],
    ['tarsus', 'Tarsus', 27, [24.5, 29.5], 'R'],
    ['midToe', 'Middle toe (exclusive of claw, by the genus text; the table does not say)', 30.4, [27.5, 34], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 363, [342, 400], 'R'],
    ['span', 'Wingspan (one secondary source: both sexes; the one figure given is 660)', null, [600, 700], 'W'],
  ],
  proportions: [
    'The tail two thirds of the wing (139.4 to 208.6: worked out from Ridgway\'s means), distinctly but never strongly rounded, its feathers broad at the tip',
    'The wing large and pointed, the longest primaries exceeding the distal secondaries by at least a third of the wing',
    'The bill moderate and rather slender, its depth about a third of the culmen, the culmen no longer than the base to the front of the eye',
    'The tarsus a little shorter than the middle toe, the outer toes about equal, the hind toe stout',
  ],
  mass: 'Mass 226 to 460 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
// (each darker than its name reads: "purplish drab" is a dusky mauve-grey, and "light neutral grey" a mid grey)
const HEAD = [318, 6, 41], THROAT = [315, 4, 50], BREAST = [335, 9, 43], BELLY = [40, 8, 86], BACK = [28, 9, 33];
const RUMP = [214, 4, 44], BRONZE = [94, 26, 21], BRONZE_SIDE = [62, 26, 22], WHITE = [48, 6, 90];
const DUSKY = [220, 6, 19], DARKER = [220, 6, 28], BROWNISH = [28, 8, 30], EDGE = [36, 6, 33], TAILPALE = [34, 7, 55], TAILUNDER = [36, 5, 62], TAILDARK = [216, 8, 22];
const YELLOW = [46, 78, 46], FEET = [44, 85, 46];

// where the white bar across the nape lies (mm along the body), by how far round from the belly a place is: on the
// hindneck at the top, a little further forward down each side, so that it is a crescent (the agent's drawing)
const bar = (a) => 181 + 3.2 * (1 - a);
// how far either side of that line the white reaches: widest across the top of the nape, narrowing down the sides
const barHalf = (a) => 1.5 + 1.2 * Math.min(1, Math.max(0, (a - 0.58) / 0.15));
// the hindneck below the bar: back from it to where the back begins (less far back down the sides), and down each
// side towards the middle of the neck's side, less far down as it nears the bar
const hind = (p) => p.x > 158 + 14 * (1 - p.a) && p.x < bar(p.a) - barHalf(p.a) + 0.4 && p.a >= 0.52 + 0.1 * Math.max(0, (p.x - 168) / 12);
// feathers are small on the head and grow down the neck
const size = (p) => (p.x > 186 ? 4 : p.x > 165 ? 7 : 11);

export default {
  name: 'Band-tailed Pigeon', latin: 'Patagioenas fasciata', key: 'band-tailed-pigeon', seed: 241,
  census: { tier: 'some', source: 'B C; C flocks in spring; A forages in flocks even when nesting', party: [3, 15] },
  // ---- how a flock lives on a visit (life/families/canopy.js says what each number is). Every number is the agent's
  // own; what each is set against is said by it.
  way: {
    family: 'canopy', there: 0.45, gap: [90, 300], together: true, herd: true,
    // (a flock flies fast: up to 15 m/s when it is put up or goes, faster than the small birds' limit of the count of walks)
    fastest: 19,
    // its haunt: within `range` of a tall tree or a snag where the air is open, and no nearer another flock's than `apart`
    range: 70, apart: 110,
    // wingbeats a second (no source: a guess from a Rock Pigeon's size); how fast from place to place, and when put up or going
    hz: 6.5, speed: 10, dash: 15,
    // how near it lets the walker come: 13 m wherever it is (nearly
    // twice as far for one who runs; until 2026-11-16 the family had a rule of its own, further off feeding and at
    // the water); a sudden movement within 32 m; somewhere near half the times, else off, for good
    // a third of those. A hunted bird, and wary (the sources give no distance).
    flush: 13, startle: 32, near: 0.5, gone: 0.35,
    // seconds at a lookout, feeding, at the water (C: a long rest after feeding)
    stay: { lookout: [35, 110], feed: [30, 95], water: [15, 40] },
    plans: [3, 7],
    // the male's coo (V: a note about 0.8 s long, one about every 1.8 s)
    coo: { every: [14, 50], notes: [3, 6], reach: 90, doing: 'cooing from his perch, tail lowered and spread: a slow, low whoo-hoo, much like an owl\'s' },
    // the clap of its wings as the flock goes up (C); seven claps a second (the agent's)
    clap: { reach: 70, rate: 7, flush: [3, 5] },
    display: 0.35,
  },
  voices: {
    // (silent: the search for recordings that staged this kind's voices found none under a licence that could be
    // used; staged as its `call`, it is placed as the coo the way says)
    coo: { silent: true },
    // made in the page: a knock (sound/index.js), low, for the clap of a pigeon's wings as it takes off. The agent's
    // stand-in, made from no recording, and no recording of the clatter was looked for.
    clap: { synth: 'knock', level: 0.3, near: 10, pitch: 340 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 36 cm long and 230 to 460 g: much like a city pigeon, but longer and slimmer.',
    marks: ['A white crescent across the nape, with a patch of glossy green bronze below it', 'A small mauve-grey head and a pinkish-mauve breast', 'A yellow bill with a dark tip, and yellow feet', 'A pale band across the end of a broad grey tail'],
    lives: 'Tall conifer forest and its edges, where it goes in flocks, perching high in dead trees. It feeds up in the trees, clambering about the boughs for buds, flowers and berries, and on the ground; in spring it comes to springs and the water\'s edge to drink. It flies strongly and fast, its wings clapping as it takes off, and the male coos a low, owl-like whoo-hoo from a high perch.',
  },
  plate: { wide: 1.0, bar: 0.06 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 205.6
    top:    [[-40, 3.6], [-28, 5.5], [-12, 12], [10, 24], [40, 36], [80, 42], [115, 45], [145, 44], [165, 38], [177, 31], [187, 27], [196, 25], [202, 22], [205.6, 15]],
    bottom: [[-44, -1.4], [-34, -2.8], [-14, -9], [10, -24], [40, -38], [80, -47], [115, -50], [145, -47], [163, -38], [176, -26], [187, -16], [196, -10], [202, -5], [205.6, -1]],
    half:   [[-44, 6.5], [-34, 8.5], [-14, 9.5], [10, 20], [40, 30], [80, 37], [115, 40], [145, 38], [165, 30], [177, 21], [187, 15], [196, 12], [202, 8], [205.6, 5]],
    widest: 0.6,
    neck: [165, 186],
    eye: { x: 193, y: 12, r: 3 },
    bill: { culmen: 18, drop: 0.05, gape: 3 },
    wing: {
      chord: 208.6, wrist: [140, -4], aim: [-205, 14],
      // large and pointed (R): the secondaries end about three quarters of the way along it
      up:   [[0, 8], [0.12, 32], [0.3, 40], [0.5, 36], [0.74, 22], [0.9, 10], [1, 1.5]],
      down: [[0, 6], [0.12, 18], [0.3, 26], [0.5, 27], [0.74, 20], [0.9, 10], [1, 1.5]],
      rest: 6, proud: 3,
      span: 660, shoulder: [138, 26, 36], arm: 85, lead: 20, sweep: 48, root: 170, tipChord: 70,
    },
    tail: { length: 139.4, root: 3, rootHalf: 9, feathers: 12, width: 26, closed: 0.03, graded: 8, point: 0.6, droop: 0.015, tent: 14 },
    leg: { knee: [112, -32, 16], shin: 30, tarsus: 27, thick: [6, 3, 2.2], toes: { mid: 30.4, side: 22, hind: 20, claw: 7, hindClaw: 8 }, splay: 0.5 },
  },
  // Poses the contact sheet shows, and the forest's behaviours start from (life/rig.js says what each number is).
  poses: {
    perched: { pitch: 0.14, lift: 0.5, head: { pitch: 0.05 }, tail: { pitch: -0.08 }, feet: { mode: 'grip', round: 0.02 }, perch: 0.02 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
    ground: { pitch: 0.12, lift: 0.88, head: { pitch: 0.02 }, tail: { pitch: -0.1, fan: 0.02 }, feet: { mode: 'flat' } },
  },
  plumage: {
    body: [
      { colour: BREAST, size },                                                                 // underparts purple-drab, more vinaceous on the body (R)
      { where: (p) => p.a < 0.45 && p.x < 92, colour: BELLY, size: 10 },                         // the lower abdomen, vent and under tail coverts white (R; where it turns: the agent's)
      { where: (p) => p.a >= 0.5 && p.x <= 166, colour: BACK, size },                           // back and scapulars greyish brown (R)
      { where: (p) => p.a >= 0.5 && p.x < 20, colour: RUMP, size: 9 },                           // rump and upper tail coverts neutral grey (R)
      { where: (p) => hind(p), colour: BRONZE, size: 4.5, edge: [74, 18, 11] },   // the whole hindneck below the bar metallic bronze or greenish bronze, the feathers sharply outlined (R, C): flat, no iridescence
      { where: (p) => hind(p) && p.a < 0.72, colour: BRONZE_SIDE, size: 4.5, edge: [52, 18, 11] },   // more bronze down the sides of the neck (the agent's: a sheen it cannot paint)
      { where: (p) => p.a >= 0.58 && Math.abs(p.x - bar(p.a)) < barHalf(p.a), colour: WHITE, size: 3.5 },   // a bar of white across the nape (R), a crescent (C)
      { where: (p) => p.x > 184, colour: HEAD, size: 4 },                                       // head purplish drab (R)
      { where: (p) => p.x > 178 && p.a < 0.4, colour: THROAT, size: 4 },                         // paler and greyer on the throat and cheek (R)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: BROWNISH, covert: BROWNISH, lesser: BACK, lesserEdge: [28, 8, 40],       // coverts brownish grey; primaries dusky (R)
      medianTip: null, greaterTip: [[36, 6, 40], 0.03],                                         // greater coverts narrowly edged with white (R)
      patchSkip: 0, primaryBars: [], secondaryBars: [[0.5, 0.97, DARKER, 'outer']],           // the distal secondaries much darker, narrowly edged whitish (R)
      tertialTip: null, tertialBars: [],
      under: [214, 5, 46], underCovert: [214, 5, 52], underCovertTip: null, underBars: [],      // axillars and underwing coverts pale neutral grey (R)
      fold: { primaries: 9, secondaries: 8, secondaryEnd: 0.74, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.24 },
      spread: { primaries: 10, secondaries: 8, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.95] },
    },
    // proximal half or more neutral grey, the apical half lighter and browner, a darker band across the middle (R);
    // seen in flight, dark with a lighter grey band across the tip (C). The pale is the tail's ground and the dark one
    // wide bar, from under the coverts to four fifths of the way out (half as dark again underneath, where the builder
    // lays a bar at half strength): the pale band is a fifth of the tail, where Ridgway has the apical half lighter
    tail: { web: TAILPALE, edge: TAILPALE, under: TAILUNDER, bars: [TAILDARK, 1, 0.5], point: 0.5 },
    bill: { upper: YELLOW, lower: [30, 10, 12], lowerBase: [YELLOW, 0.68] },                   // yellow with its apical third black (R): the black on the lower mandible only
    mouth: [350, 40, 50],
    eye: { iris: [354, 40, 40], pupil: [240, 15, 5] },                                         // a dark eye in a thin red ring (B); R's outer ring of pink, not his pale yellow next to the pupil
    leg: FEET,                                                                                // clear cadmium yellow (R)
    shin: FEET,
  },
};
