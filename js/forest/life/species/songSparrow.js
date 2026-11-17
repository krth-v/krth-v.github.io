// Song Sparrow, Melospiza melodia (the dark, rusty form of the north-west coast, morphna): the adult in spring.
// The sexes are alike in plumage; the male is a little the larger.
//
// What is published and what is not. The lengths under `published` are Ridgway's for twenty adult males of
// Melospiza cinerea morphna, the "Rusty Song Sparrow" (1901), and the bird is built to their means;
// life/measure.js measures the built bird against them. That morphna is the form of the Olympic Peninsula's
// lowlands is an inference from range alone: Ridgway has it breeding from southern Alaska through British
// Columbia to western Oregon, and Wikipedia has it resident from the coast of central British Columbia to
// north-west Oregon; neither names the Peninsula. Ridgway's own entry for morphna is a comparison with
// cleonensis and the measurements, so the colour of each tract is his description of the nominate form, with the
// differences his comparison and his key give for morphna (the lateral crown stripes deep chestnut, the
// streaks rusty brown or chestnut, the back's black streaks indistinct, the ground above rusty olive, the
// flanks olive and not tawny). His bill, iris and leg colours are the nominate form's. The wing's least,
// printed "64£.77" in the scan's text, is read 64.77. The outline of head and body, where the eye sits, how the
// folded wing lies and every width of a stripe are in nothing that was read: they are the agent's drawing, for
// the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, the second confirming every
// length and every Ridgway quotation against the scan's character-recognition text (archive.org, Cornell's
// copy, cu31924090256870). The wingspan, Wikipedia's range for the species, and BirdWeb were not checked by a
// second agent. No page was seen as an image.

const R = 'Ridgway 1901, The Birds of North and Middle America, Part I (U.S. National Museum Bulletin 50), Melospiza cinerea morphna, p. 372';

export const published = {
  shown: 'adult (the sexes alike), in spring',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it for the nominate form with the differences he gives for morphna (the crown brown, narrowly streaked black, with a narrow grey median stripe, the lateral stripes deep chestnut; the back and scapulars rusty olive with chestnut streaks and indistinct black ones; the wing coverts brown with paler tips, no wing bars; the tertials blackish with pale outer edgings; the tail brown, its middle pair with a dusky median stripe; a broad olive-grey stripe over the eye, a brown stripe behind it and another under the ear coverts, a dull white malar stripe edged below by a black submalar stripe; the underparts white, the chest streaked chestnut and the streaks run together into a spot on the upper breast, the flanks olive; bill maxilla dusky, mandible horn; iris brown; tarsi pale brown, toes darker). Not found in what was read, and the agent\'s: the outline, the width of each stripe, how many streaks, the wingspan (built at 220 mm, inside the species\' 180 to 254), the stance, the form on the Olympic Peninsula, and any colour of bill, leg or iris for morphna itself. The middle toe is Ridgway\'s, claw not included. The wing\'s least is a reading of a garbled figure. No second source was checked for any of the Ridgway figures.',
  sources: {
    R: `${R}: 20 adult males, museum skins (read as the scan\'s text; checked against the same text by a second agent)`,
    W: 'Wikipedia, "Song sparrow": wingspan of the species 18 to 25.4 cm, all races (secondary, plain text, not checked by a second agent)',
  },
  lengths: [
    ['wing', 'Wing, folded', 67.82, [64.77, 71.87], 'R'],
    ['tail', 'Tail', 66.04, [60.71, 72.9], 'R'],
    ['culmen', 'Exposed culmen', 12.95, [11.94, 13.72], 'R'],
    ['tarsus', 'Tarsus', 22.86, [21.59, 23.62], 'R'],
    ['midToe', 'Middle toe', 17.02, [16, 18.03], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 152.65, [144.53, 164.08], 'R'],
    ['span', 'Wingspan (the species, all races)', null, [180, 254], 'W'],
  ],
  proportions: [
    'The tail as long as the wing (66.0 to 67.8: Ridgway\'s means), rounded, its feathers narrow with blunt tips',
    'The wing short and rounded (Ridgway, the genus); the bill stout, a depth of 7.1 at its base to a culmen of 12.95',
    'The tarsus about as long as the middle toe with its claw, or a little longer (Ridgway, the genus)',
  ],
  mass: 'Not found for morphna. The species: 11.9 to 53 g over all races, 22 g for the nominate form (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]; each set darker than its name reads
// (2026-11-16, the agent called sparrows, against the plates: morphna is the darkest and rustiest of the forms, and the
// bird was a pale one with orange flecks on a white breast; every tract set darker, the chest's streaks darker and
// broader, and the pale wedge behind the ear, where no rule held, given the neck's grey-brown)
const CROWN = [18, 40, 18], CHEST = [14, 42, 17], SLASH = [20, 20, 9];
const GREYSTRIPE = [36, 6, 34], BACK = [26, 22, 19], BACKSTREAK = [14, 40, 14], NAPE = [30, 10, 30];
const BROW = [36, 8, 37], EAR = [30, 12, 25], POST = [18, 36, 16], MALAR = [40, 8, 60], SUBMALAR = [20, 24, 10];
const WHITE = [40, 8, 71], FLANK = [34, 16, 39], RUMP = [28, 18, 26], NECK = [32, 9, 36];

const size = (p) => (p.x > 62 ? 2.4 : p.x > 50 ? 3.4 : 5);
const head = (p) => p.x > 57.5;
// the eye is at (66.5, 8.2): the stripe over it, the brown stripe behind it, the pale malar stripe and the dark one below
const brow = (p) => head(p) && p.x < 72.5 && p.y > 10.8 && p.y < 13.2 + (p.x - 57) * 0.03;
const behind = (p) => head(p) && p.x < 66.5 && p.y > 7 && p.y <= 10.8;
const ear = (p) => head(p) && p.x < 71.5 && p.y > 3.6 && p.y <= 7;
const malar = (p) => head(p) && p.x > 62 && p.y > -0.4 && p.y <= 3.6;
const submalar = (p) => head(p) && p.x > 61.5 && p.y > -3  && p.y <= -0.6 && p.a < 0.4;

export default {
  name: 'Song Sparrow', latin: 'Melospiza melodia', key: 'song-sparrow', seed: 137,
  // ---- who is about on a visit (life/species/index.js says what each field is), how it lives on one and its voices
  census: { tier: 'some', source: 'B C; P regular; brush by the river and the clearing' },
  // How it lives on a visit: its family's (life/families/scratcher.js), with these numbers. From BirdWeb (read
  // 2026-11-16): it lives in "dense, brushy thickets", forages "mostly on the ground, sometimes scratching the soil",
  // holds its long tail cocked and pumps it "up and down in flight", and sings almost all year. The agent's own: every
  // number here; that it keeps to where the air is open (the river's bank, the beach's back, the old clearing) and
  // sings from a perch no higher than four and a half metres (a willow by the river, a young tree, a stump or a log).
  way: {
    family: 'scratcher', there: 0.85, gap: [30, 150],
    hz: 17, speed: 6.5,                              // wingbeats a second (a guess from its size); how fast it flies (m/s)
    // put up from 4 m at a stroll (further for one who runs), or by a sudden movement within 8 m
    flush: 4, startle: 8, near: 0.85, gone: 0.12,
    air: [0.45, 1], thicket: 0, stretch: 30, apart: 50, reach: 14, high: 4.5,
    stay: [12, 40], patches: [2, 5], sit: 0.12, rest: [5, 14],
    hop: [0.06, 0.11], kick: 0.25, kicks: [1, 2], flick: 0, flash: 0.25, pump: 0.35,
    hopping: 'hopping along the edge of the trail, its long tail cocked', perched: 'perched low, looking about',
    call: { every: [1.2, 3.5], time: 0.12, reach: 25, doing: 'calling' },
    // (a song as long as the recording that is played for it)
    song: { chance: 0.5, songs: [4, 10], time: [2.7, 2.9], gap: [5, 11], reach: 120, high: [0.3, 4.5], doing: 'singing: a crisp run of repeated notes and trills' },
  },
  voices: {
    song: { file: 'songsparrow-song.mp3', level: 0.5, near: 6,
      credit: { what: 'Song Sparrow, song', by: 'J. Job, National Park Service, Rocky Mountain NP sound library, 2015', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-songsparrow.htm', bytes: 1398650, kept: 2.8 } },
    // (its call: silent, no recording of it was found under a licence that could be used)
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 15 cm long: a large, dark, chunky sparrow (the western forms are the largest).',
    marks: ['A brown cap with a grey stripe down its middle', 'A grey face with a brown stripe through the eye and a dark whisker', 'Heavy rusty streaks down the white breast, run together into a spot', 'A long, rounded tail'],
    lives: 'Brushy thickets, edges and wet ground below the high country, where it feeds mostly on the ground, scratching in the litter for insects and seeds. It sings almost all year, a crisp run of repeated notes and trills from a low perch, and pumps its long tail in flight.',
  },
  plate: { wide: 0.3, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 73.7
    top:    [[-9, 2], [-3, 6], [8, 11], [20, 15], [34, 16.6], [46, 16.4], [54, 16], [60, 16.8], [65, 17], [69, 15.4], [72, 11.4], [73.7, 5.6]],
    bottom: [[-11, -1], [-4, -6], [7, -12], [19, -16], [32, -17], [44, -15.2], [54, -11.8], [61, -8.6], [67, -5.4], [71.5, -2.6], [73.7, -1.4]],
    half:   [[-11, 2.4], [-4, 7], [7, 12.2], [19, 15], [32, 15.6], [44, 14.4], [54, 12.6], [61, 11], [66, 10], [70, 8], [72.5, 5.4], [73.7, 3.5]],
    widest: 0.47,
    neck: [53, 64],
    eye: { x: 66.5, y: 8.2, r: 1.9 },
    bill: { culmen: 12.95, drop: 0.04, gape: 2.6 },
    wing: {
      chord: 67.82, wrist: [45, -2], aim: [-66, 5],
      // short and rounded
      up:   [[0, 2.2], [0.12, 8.6], [0.3, 10.4], [0.5, 9.2], [0.72, 6], [0.9, 2.8], [1, 0.7]],
      down: [[0, 1.6], [0.12, 4.8], [0.3, 6.8], [0.5, 7], [0.72, 5.2], [0.9, 2.8], [1, 0.7]],
      rest: 2.2, proud: 1.2,
      span: 220, shoulder: [43.5, 7.6, 11.2], arm: 32, lead: 7, sweep: 15, root: 59, tipChord: 23,
    },
    tail: { length: 66.04, root: 0.9, rootHalf: 3, feathers: 12, width: 7.6, closed: 0.04, graded: 8, point: 0.5, droop: 0.03, tent: 4 },
    leg: { knee: [30, -10.5, 7], shin: 14, tarsus: 22.86, thick: [3.8, 1.6, 0.95], toes: { mid: 17.02, side: 12.4, hind: 12.8, claw: 5.6, hindClaw: 7.2 }, splay: 0.5 },
  },
  poses: {
    // on a twig or a low stem: the body inclined, the long tail hanging a little behind it
    perched: { pitch: 0.3, lift: 0.4, head: { pitch: 0.06 }, tail: { pitch: 0, fan: 0.03 }, feet: { mode: 'grip', round: 0.006 }, perch: 0.006 },
    // standing on flat ground, feet flat: the body low and level, the tail held just off it
    ground: { pitch: 0.2, lift: 0.4, head: { pitch: 0.1 }, tail: { pitch: 0.16, fan: 0.03 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.22 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // underparts white (R)
      { where: (p) => p.a < 0.55 && p.x > 34 && p.x < 62, colour: WHITE, shaft: CHEST, shaftWidth: 0.66, size: 3.8 },        // chest marked with wedge-shaped streaks, rusty brown or chestnut (R)
      { where: (p) => p.a < 0.16 && p.x > 40 && p.x < 52, colour: CHEST, shaft: SLASH, shaftWidth: 0.3, size: 3 },            // run together on the upper breast into a spot (R)
      { where: (p) => p.a > 0.14 && p.a < 0.62 && p.x < 36, colour: FLANK, shaft: CHEST, shaftWidth: 0.42, size: 4.4 },       // sides and flanks streaked, olivaceous rather than tawny in morphna (R)
      { where: (p) => p.a >= 0.5 && p.a < 0.62 && p.x >= 34 && p.x <= 58, colour: FLANK, shaft: CHEST, shaftWidth: 0.4, size: 3.8 },   // the sides of the breast, under the wing's bend: streaked as the flanks are (the agent's)
      { where: (p) => p.x > 53 && p.x <= 62.5 && p.y > -3 && p.a >= 0.3 && p.a < 0.62, colour: NECK, shaft: CHEST, shaftWidth: 0.2, size: 2.6 },   // the side of the neck grey-brown, a few streaks (the agent's)
      { where: (p) => p.x <= 3 && p.a < 0.5, colour: [36, 14, 62], shaft: [26, 25, 34], shaftWidth: 0.2, size: 5 },           // under tail coverts white or pale buffy, streaked brown (R)
      { where: (p) => p.a >= 0.62, colour: BACK, shaft: BACKSTREAK, shaftWidth: 0.4, size: 4.6 },                              // back and scapulars rusty olive, streaked chestnut, the black streaks indistinct (R)
      { where: (p) => p.a >= 0.62 && p.x < 12, colour: RUMP, shaft: BACKSTREAK, shaftWidth: 0.22, size: 4.6 },                 // rump olive-grey, faintly streaked; upper tail coverts browner (R)
      { where: (p) => p.a >= 0.62 && p.x >= 44 && p.x <= 57.5, colour: NAPE, shaft: BACKSTREAK, shaftWidth: 0.22, size: 3.4 },   // hindneck brownish grey, washed with brown (R)
      { where: (p) => head(p) && p.y >= 13.2, colour: CROWN, shaft: SLASH, shaftWidth: 0.2, size: 2.4 },                       // crown brown to chestnut, narrowly streaked black (R)
      { where: (p) => head(p) && p.y >= 13.2 && p.a > 0.9, colour: GREYSTRIPE, shaft: SLASH, shaftWidth: 0.1, size: 2.4 },     // a narrow median stripe of grey (R)
      { where: brow, colour: BROW, size: 2 },                                                   // a broad stripe over the eye, olive-grey (R)
      { where: behind, colour: POST, size: 2 },                                                 // a brown stripe behind the eye (R)
      { where: ear, colour: EAR, size: 2 },                                                     // loral, suborbital and auricular regions darker olive-grey (R)
      { where: (p) => head(p) && p.x < 63 && p.y > 2 && p.y <= 4.2, colour: POST, size: 2 },    // the rictal stripe of brown below the ear coverts (R)
      { where: malar, colour: MALAR, size: 2 },                                                 // a broad malar stripe of dull white (R)
      { where: submalar, colour: SUBMALAR, size: 2 },                                           // margined below by a black submalar stripe (R)
      { where: (p) => head(p) && p.x > 62 && p.y <= -3 && p.a < 0.34, colour: WHITE, size: 2 },           // the throat white
    ],
    wing: {
      web: [24, 20, 15], edge: [26, 28, 27], tertial: [24, 16, 12], covert: [22, 26, 20], lesser: [22, 30, 22], lesserEdge: [24, 28, 26],  // coverts brown, tertials blackish with brown outer webs, the rest dusky edged paler brown (R)
      medianTip: null, greaterTip: null,                         // margined terminally with pale brownish grey (R); no wing bars
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.6, 0.97, [34, 12, 40], 'edge']],                       // tertials paler, sometimes almost grey-white, towards the tip (R)
      under: [32, 8, 48], underCovert: [38, 8, 66], underCovertTip: null, underBars: [],        // not described in what was read
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.74, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: [26, 22, 26], edge: [26, 24, 31], under: [30, 8, 40], point: 0.4, middle: [24, 22, 22], shaft: [22, 25, 16] },   // brown, the middle pair with a dusky median stripe (R)
    bill: { upper: [26, 14, 17], lower: [34, 18, 40] },                                         // maxilla dusky brown, mandible horn colour (R)
    mouth: [350, 30, 45],
    eye: { iris: [22, 40, 13], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [28, 22, 42],                                                                          // tarsi pale brown, toes darker (R)
    shin: [26, 26, 38],
  },
};
