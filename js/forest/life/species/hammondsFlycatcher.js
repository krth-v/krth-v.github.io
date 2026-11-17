// Hammond's Flycatcher, Empidonax hammondii: the adult in spring, the sexes alike in colour.
//
// What is published and what is not. The lengths under `published` are Ridgway's for twelve adult males (his
// footnote "twelve specimens" stands on the male line), and the bird is built to their means; life/measure.js
// measures the built bird against them. The colours follow his description, which has two phases, largely
// independent of season and with many birds between: a white-bellied one (chest and sides of the breast pale grey,
// the rest below dull white to very pale primrose) and a yellow-bellied one (the chest olive, the belly primrose or
// sulphur yellow). A bird between the two is painted (greyish throat, a greyish olive chest, the belly washed pale
// yellow), since BirdWeb has it "olive-gray above and buffy-yellow below". The outline of head and body, the bill's
// shape, where the eye sits and the length of the tail's notch are in nothing that was read: they are the agent's
// drawing, for the owner to judge from the contact sheet. The eye ring, which Ridgway has broader behind and below
// and which a modern source has uneven and sometimes nearly invisible, is painted as the first.
//
// Reviewed on 2026-11-16 by a second agent, who changed: the eye ring and the lores, which had been painted forward
// of the eye (see `shows`), so that the white of the lores ran into a white throat; the underparts, which were the
// white-bellied phase at its whitest; the lower mandible, which had a broad pale base where BirdWeb has "The bill is
// dark"; and how far the primaries reach past the tertials. That was the shortest of the three Empidonax here, and
// what was read has it long: "long wings, a relatively short tail" (BirdWeb), and a "longer primary projection" than
// the Dusky and Gray Flycatchers (South Dakota Birds and Birding, read through a tool that answers from a page's
// text). No length of it in millimetres was found: the primaries now reach 26 mm past the longest tertial (37 % of the
// wing, where the Pacific-slope's reach 31 % and the Willow's 33 %), worked out from the fold's numbers and not
// measured on the mesh; how long is the agent's. A slight hump at the back of the crown is not built.
//
// How the sources were read: Ridgway's page as the Internet Archive's character recognition of the scan (page
// text, read directly by one agent and checked by a second); never seen as an image. Wikipedia and BirdWeb through
// a tool that returns a summary of the page; the Birds of the World and All About Birds pages were not read
// (the second refused). The middle toe is printed without a word on whether the claw is counted.

const R = 'Ridgway 1907, The Birds of North and Middle America, Part IV (U.S. National Museum Bulletin 50), p. 565, Empidonax hammondii; https://archive.org/download/bwb_T2-EYP-566/bwb_T2-EYP-566_djvu.txt';

export const published = {
  shown: 'adult, spring, between Ridgway\'s white-bellied and yellow-bellied phases',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the white-bellied phase (crown and hindneck dull deep brownish grey, nearly mouse grey; back, scapulars, rump and upper tail coverts the same but decidedly more olive; tail deep greyish brown, its outer webs passing to light greyish olive at the edges; primaries deep greyish brown, narrowly and indistinctly edged lighter; middle and greater coverts dusky, broadly tipped pale grey or dull greyish white, two distinct bands; secondaries dusky edged dull whitish except at the base; an eye ring of dull white, broader behind and below; lores greyish white in front and largely dusky behind; the sides of the head like the crown, a little paler, fading into the dull greyish white of chin and throat; chest and sides of breast pale grey; the rest of the underparts dull white, yellowish white or very pale primrose; upper mandible brownish black, lower pale brownish; iris brown; legs and feet blackish brown), and for the yellow-bellied phase (the chest olive, the belly primrose or sulphur yellow), with many birds between: one between is painted, as BirdWeb has it "olive-gray above and buffy-yellow below", with "The bill is dark". Long wings and a long primary projection are BirdWeb\'s and South Dakota Birds and Birding\'s. Not found in what was read, and the agent\'s: the outline, the bill\'s outline (the sources say only that it is small and much narrower than a Least Flycatcher\'s), how far the primaries project in millimetres, whether the tail is notched, the undertail coverts (Ridgway does not describe them), the underside of the wing beyond the axillars\' pale primrose. The slight crest of one modern source is not built (the builder has a crest for a sheet that asks for one; it was not asked for here). Whether the middle toe was measured with its claw is not said. Ridgway\'s length is of skins: a live bird is 12 to 14 cm by the secondary source.',
  sources: {
    R: `${R}: 12 adult males, museum skins`,
    W: 'Wikipedia, "Hammond\'s flycatcher" (read 2026-11-16, page text): 12 to 14 cm long, wingspan about 22 cm, 8 to 12 g',
    B: 'Seattle Audubon, BirdWeb, Hammond\'s Flycatcher (through a summary tool, and again by a second agent on 2026-11-16 through a tool that answers from the page\'s text): olive-grey above and buffy-yellow below; "The bill is dark"; long wings, a relatively short tail; watches from a perch high in the canopy; wags its tail in a slow, up-down motion',
    S: 'South Dakota Birds and Birding, Hammond\'s Flycatcher (read 2026-11-16 through a tool that answers from the page\'s text): a longer primary projection than the Dusky or Gray Flycatcher',
  },
  lengths: [
    ['wing', 'Wing, folded', 71.3, [68, 74], 'R'],
    ['tail', 'Tail', 57.9, [55, 61], 'R'],
    ['culmen', 'Exposed culmen', 10.7, [10, 11], 'R'],
    ['tarsus', 'Tarsus', 16.2, [15.5, 17.5], 'R'],
    ['midToe', 'Middle toe (claw not said)', 9.2, [9, 10], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 124, [120, 135], 'R'],
    ['span', 'Wingspan (one secondary source)', 220, [205, 235], 'W'],
  ],
  proportions: [
    'The tail four fifths of the wing (57.9 to 71.3: worked out from Ridgway\'s means): long wings, a short tail (B)',
    'The primaries reach well past the tertials: a long primary projection (B, S; the length the agent\'s, no measurement found)',
    'The tarsus under a quarter of the wing; the middle toe long for a flycatcher of its size (R, by comparison with the Least Flycatcher)',
  ],
  mass: 'Mass about 10 g: 8 to 12 (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]; darker than the names read
const CROWN = [38, 7, 36], OLIVE = [62, 13, 36], RUMP = [62, 13, 39], FACE = [40, 6, 44], THROAT = [45, 5, 63], CHEST = [56, 9, 51];
const BELLY = [53, 36, 72], FLANK = [55, 13, 57], SIDE = [58, 11, 45], RING = [46, 6, 78], LORE = [44, 5, 60], DUSK = [36, 8, 28], DUSKY = [30, 9, 19], EDGE = [52, 12, 45], BAR = [50, 8, 68];

const size = (p) => (p.x > 52 ? 1.9 : p.x > 44 ? 2.6 : 4.4);
const head = (p) => p.x > 46;
// Where along the body (mm) a feather picked at p shows. The painter (life/plumage.js) takes a feather's colour from a
// point 3 mm behind the feather's root, and what shows of a feather is its end, the rest lying under the next one
// forward: so a mark made of feathers `size` long shows about 3.4 - size mm forward of where its rule has it (read
// from the painter, and seen on the contact sheet). The head's small marks are tested where they will show.
const shows = (p, size) => p.x + 3.4 - size;
// the eye ring: about the eye, broader behind and below (R); how broad is the agent's
const EYE = { x: 51, y: 8.2 };
const ring = (x, y) => { const dx = (x - EYE.x) / (x < EYE.x ? 3.4 : 2.5), dy = (y - EYE.y) / (y < EYE.y ? 3 : 2.2); return dx * dx + dy * dy < 1; };

export default {
  name: 'Hammond\'s Flycatcher', latin: 'Empidonax hammondii', key: 'hammonds-flycatcher', seed: 131,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'some', source: 'B F' },
  // ---- how it lives on a visit (life/families/sallier.js says what was read of how the two Empidonax of these woods
  // feed: in May most of what they take is picked off leaves as they hover, the rest from the air, and Hammond's
  // higher in taller trees than the Pacific-slope). The sources have it high in the canopy of tall conifers (B), which
  // no walker sees: here it keeps to the space under the old wood's crowns, from 4.5 to 13 m up, on the stubs of broken
  // limbs on the great trunks, and on boughs no higher than 6.5 m, where a walker can see it among their leaves
  // ("Learned in milestone 4": on a bough 7 m up, seen from the walk 19 m off, its leaves hid all but its head and back). It wags its tail slowly (B). Its voices are the Park Service's recordings, and what it does is
  // fitted to them: the call is two sharp notes 1.7 s apart, the song three hoarse phrases in 2.2 s. Every distance,
  // time and chance is the agent's own; the share of its sallies that go to leaves is Sakai and Noon's for Hammond's
  // before incubation (32 of 42 attacks), less where no bough's tip is in reach; the words for its call are the first
  // sheet's, and were not read again.
  way: {
    family: 'sallier', there: 0.5, gap: [60, 240],
    homeOff: 18, range: 16, reach: 14, apart: 40, need: 3,
    kinds: ['stub', 'bough'], heights: [4.5, 13], boughs: 6.5, air: [0, 0.7],
    hz: 21, speed: 6.5, spell: [25, 80], stay: [20, 70],
    flush: 7, startle: 16, near: 0.7, gone: 0.25,
    sally: { every: [6, 20], reach: [1.5, 5], rise: [-1.5, 2] }, glean: 0.75, back: 0.75, flick: [2, 6], wag: 0.6,
    watching: 'waiting on an open perch, wagging its tail slowly',
    call: { every: [12, 35], time: 2.1, rate: 3, reach: 40, doing: 'calling: a short, dry "pit"', notes: [[0.12, 0.24], [1.83, 1.96]] },
    song: { chance: 0.3, time: 2.2, rate: 4, reach: 55, doing: 'singing: a hoarse run of short, slurred notes', notes: [[0.28, 0.45], [0.82, 1.1], [1.73, 1.96]] },
  },
  voices: {
    song: { file: 'hammonds-song.mp3', level: 0.35, near: 4,
      credit: { what: "Hammond's Flycatcher, song (a kinglet and a hummingbird are in the original, outside the cut's band)", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2015", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-hammondsflycatcher.htm', bytes: 1527192, kept: 2.2 } },
    call: { file: 'hammonds-call.mp3', level: 0.3, near: 4,
      credit: { what: "Hammond's Flycatcher, call", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2016", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-hammondsflycatcher.htm', bytes: 212136, kept: 2.1 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 13 cm long and 10 g: a small flycatcher, olive-grey above.',
    marks: ['Olive-grey above; greyish at the throat and across the breast, washed pale yellow below', 'Two pale bars on long wings', 'A white ring round the eye, fullest behind it', 'A small, narrow, dark bill'],
    lives: 'Tall conifers of old, wet forest, high in the canopy. It waits upright on an open perch, wagging its tail slowly, and flies out to pick an insect off the leaves as it hovers, or to snatch one from the air, and comes back to a perch. It arrives in the lowlands in the middle of April; in May the males sing a hoarse run of short slurred notes.',
  },
  plate: { wide: 0.38, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 56.6
    top:    [[-9, 2], [-3, 5.4], [6, 9.2], [17, 12], [28, 13], [37, 13], [44, 13.2], [49, 14.4], [53, 14.2], [55.2, 11], [56.2, 7], [56.6, 4.2]],
    bottom: [[-11, -1], [-4, -5.2], [6, -10], [16, -13.2], [27, -14], [36, -12.6], [43, -9.6], [49, -5.4], [53.4, -2], [56.6, 1.2]],
    half:   [[-11, 2.4], [-4, 6.4], [6, 10.4], [16, 12.6], [27, 13], [36, 12], [43, 10.6], [48, 10.4], [52.6, 7.6], [55.4, 4.4], [56.6, 2.2]],
    widest: 0.46,
    neck: [38, 47],
    eye: { x: 51, y: 8.2, r: 1.6 },
    // flat and broad at the base (width 4 mm against 3 deep)
    bill: { culmen: 10.7, drop: 0.03, gape: 1.8 },
    wing: {
      chord: 71.3, wrist: [41, -1.8], aim: [-70.5, 4.6],
      up:   [[0, 2], [0.12, 7.8], [0.3, 9.4], [0.5, 8.2], [0.72, 5], [0.9, 2.2], [1, 0.5]],
      down: [[0, 1.4], [0.12, 4.4], [0.3, 6.2], [0.5, 6.4], [0.72, 4.6], [0.9, 2.4], [1, 0.5]],
      rest: 2, proud: 1.1,
      span: 220, shoulder: [35.5, 6.4, 9.4], arm: 32, lead: 7, sweep: 14, root: 54, tipChord: 24,
    },
    // a little notched (the agent's): the outer feathers shorter than the middle
    tail: { length: 57.9, root: 0.9, rootHalf: 2.4, feathers: 12, width: 6.4, closed: 0.035, graded: -1.5, point: 0.6, droop: 0.03, tent: 4 },
    leg: { knee: [24, -8.4, 6], shin: 12, tarsus: 16.2, thick: [2.8, 1.2, 0.72], toes: { mid: 9.2, side: 7, hind: 6.8, claw: 3.6, hindClaw: 4.8 }, splay: 0.55 },
  },
  poses: {
    // upright on an open perch, the tail hanging
    perched: { pitch: 0.62, lift: 0.5, head: { pitch: 0.12 }, tail: { pitch: -0.12, fan: 0.02 }, feet: { mode: 'grip', round: 0.005 }, perch: 0.005 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.28 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                  // belly and the rest dull white, tinged very pale primrose (R)
      { where: (p) => p.a > 0.2 && p.a < 0.58 && p.x < 41 && p.x > 4, colour: FLANK, size: 4.4 }, // sides and flanks pale grey fading (R)
      { where: (p) => p.a < 0.45 && p.x >= 22 && p.x < 46, colour: CHEST, size: 3.2 },          // chest pale grey to olive (R), between his two phases
      { where: (p) => p.a >= 0.45 && p.a < 0.58 && p.x >= 26 && p.x < 46, colour: SIDE, size: 3.2 },   // the side of the breast over the wing's bend, between the chest and the back
      { where: (p) => p.a < 0.5 && p.x >= 44, colour: THROAT, size },                           // chin and throat dull greyish white (R)
      { where: (p) => p.a >= 0.58 && p.x <= 40, colour: OLIVE, size },                          // back and scapulars like the crown, decidedly more olive (R)
      { where: (p) => p.a >= 0.58 && p.x < 9, colour: RUMP, size: 4 },                          // rump and upper tail coverts (R)
      { where: (p) => p.x > 40 && p.a >= 0.46, colour: FACE, size: 2.6 },                       // sides of the head like the crown, a little paler (R)
      { where: (p) => p.x > 40 && p.a >= 0.66, colour: CROWN, size: 2.2 },                      // crown and hindneck dull deep brownish grey (R)
      { where: (p) => shows(p, 1.6) > 54.4 && p.y > 4.2 && p.y < 9.8 && p.a > 0.42, colour: LORE, size: 1.6 },   // lores greyish white in front (R)
      { where: (p) => { const x = shows(p, 1.6); return x > 52.4 && x <= 54.4 && p.y > 5 && p.y < 10.2 && p.a > 0.5; }, colour: DUSK, size: 1.6 }, // and dusky behind (R)
      { where: (p) => p.a > 0.45 && ring(shows(p, 1.5), p.y), colour: RING, size: 1.5 },           // an eye ring of dull white, broader behind and below (R)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: [30, 9, 21], covert: [30, 9, 21], lesser: OLIVE, lesserEdge: [60, 16, 42],
      medianTip: [BAR, 0.17], greaterTip: [BAR, 0.15],       // middle and greater coverts dusky, broadly tipped pale grey: two distinct bands (R)
      patchSkip: 0,
      primaryBars: [[0.35, 0.95, [42, 10, 40], 'edge']],     // primaries narrowly and indistinctly edged lighter greyish (R)
      secondaryBars: [[0.3, 0.98, [48, 10, 52], 'edge']],    // secondaries edged dull whitish except at the base (R)
      tertialTip: [[48, 10, 62], 0.1],
      under: [45, 8, 48], underCovert: [56, 30, 78], underCovertTip: null, underBars: [],     // axillars and under wing coverts pale primrose or yellowish white (R)
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.66, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },     // the primaries well past the tertials (B, S)
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: [30, 12, 21], edge: [58, 12, 44], under: [34, 8, 36], point: 0.4 },           // deep greyish brown, the outer webs passing to light greyish olive (R)
    bill: { upper: [30, 14, 11], lower: [32, 18, 17], lowerBase: [[34, 24, 34], 0.4] },        // "The bill is dark" (B); the lower pale brownish in skins (R): a little paler at its base
    mouth: [8, 45, 48],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                          // iris brown (R)
    leg: [28, 18, 15],                                                                         // blackish brown (R)
    shin: [28, 18, 17],
  },
};
